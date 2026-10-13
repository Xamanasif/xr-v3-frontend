/**
 * The command pipeline (Appendix F §4.5; Appendix D §1.4). Every write:
 *
 *  1. is serialised by the in-tab lock and reads the latest world;
 *  2. resolves the acting person and permissions from the canonical records (never the caller);
 *  3. evaluates domain policy and record scope (`may` / `canRead` of `@xr/domain`);
 *  4. validates its input with the method's DTO schema (drawn words, `@xr/contracts/draft`);
 *  5. checks the record revision (`expectedRev` → `stale-version`), runs the pure domain decision
 *     and stages the resulting records;
 *  6. verifies the twelve invariants;
 *  7. commits the next world version and publishes the exact changed records;
 *  8. answers the typed `Result` — and a refusal writes nothing: no record, no id, no history.
 *
 * A repeated client-minted `commandId` answers its first receipt without acting again. Reads and
 * previews run steps 1–4 and write nothing. Handlers stop at the first refusal by throwing
 * `Refuse`; any other throw is a programming error and is never turned into a refusal.
 */
import {
  failure,
  fromDomainRefusal,
  type IssueTarget,
  type MethodId,
  type Out,
  parseInput,
  type Result,
  type ServiceError,
  success,
  type TypedSchema,
} from '@xr/contracts/draft';
import {
  type ActionId,
  type ActorRef,
  canRead,
  type Decision,
  type InputIssue,
  type IsoInstant,
  may,
  type PublicActor,
  type ReadTarget,
  type ReadVerdict,
  type RecordRef,
  type Subject,
  type Submission,
  type SubmissionContent,
} from '@xr/domain';

import { type IdExists, StagedIds, type MintedKind } from '../ids/id-source.js';
import type { Call, PlatformCore, SessionContext, SessionState } from '../platform/core.js';
import { Transaction } from '../world/records.js';
import type {
  ChangeOrigin,
  SampleRuntimeEvent,
  SeededFacts,
  SeedNote,
  World,
  WorldRecords,
} from '../world/types.js';
import { publicActor, type ResolvedPerson, resolvePerson } from './actor.js';
import { checkInvariants } from './invariants.js';
import { assertDeclared, audienceOf, rowOf } from './ledger.js';

/** A refusal on its way out of a handler; caught by the pipeline and answered as a value. */
export class Refuse {
  constructor(readonly error: ServiceError) {}
}

/** Stops the handler with a refusal (nothing is written). */
export function refuse(error: ServiceError): never {
  throw new Refuse(error);
}

/** A committed command's answer and what the invariant check needs to know about it. */
export interface Done<V> {
  readonly value: V;
  /** The domain decision that ran (invariants name commands by it: `publish`, `giveAccess` …). */
  readonly decision: string;
  /** Who acted; `null` only for a value a fixture supplies that no command can write (seedNote). */
  readonly actor: ActorRef | null;
  /** Runs once, after the commit (browser-session effects such as emptying the selection). */
  readonly after?: () => void;
}

const DRAWN_TABLE: Partial<Record<MintedKind, keyof WorldRecords>> = {
  request: 'requests',
  accessPlan: 'plans',
  studentAccessGrant: 'grants',
  assessment: 'assessments',
  attempt: 'attempts',
  submission: 'submissions',
  update: 'updates',
  deviceTransfer: 'transfers',
  supportReport: 'reports',
  question: 'questions',
  group: 'groups',
  facultyCourseMapping: 'mappings',
  institution: 'institutions',
  person: 'people',
  area: 'areas',
  course: 'courses',
  experiment: 'experiments',
  roleHolder: 'holders',
};

/** An id is taken when a record of its table already has it (the world as staged so far). */
function existsIn(tx: Transaction, world: World): IdExists {
  return (kind, id) => {
    const table = DRAWN_TABLE[kind];
    if (table && Object.hasOwn(tx.records[table], id)) return true;
    if (kind === 'person') {
      return (
        world.identities.superAdmins.some((identity) => identity.personId === id) ||
        Object.values(tx.records.institutions).some(
          (institution) => institution.instituteAdmin?.personId === id,
        ) ||
        Object.values(tx.records.holders).some((holder) => holder.personId === id)
      );
    }
    return false;
  };
}

/** The working state of one call: the staged records, ids and envelope additions. */
export class Op {
  readonly tx: Transaction;
  readonly ids: StagedIds;
  readonly runtimeEvents: SampleRuntimeEvent[] = [];
  seeded: SeededFacts;
  readonly seedNotes: Record<string, SeedNote> = {};
  sentContent: World['sentContent'];

  constructor(
    readonly core: PlatformCore,
    readonly context: SessionContext | null,
    readonly method: string,
    readonly world: World,
    readonly now: IsoInstant,
    /** The session the call was made in (a request carries its own cookie), captured at call time. */
    readonly session: SessionState | null = context?.session ?? null,
  ) {
    this.tx = new Transaction(world.records);
    this.ids = new StagedIds(world.idSource, existsIn(this.tx, world));
    this.seeded = world.seeded;
    this.sentContent = world.sentContent;
  }

  get records(): WorldRecords {
    return this.tx.records;
  }

  refuse(error: ServiceError): never {
    throw new Refuse(error);
  }

  /**
   * The session the call was made in, while it is still this tab's session: a call queued before a
   * sign-out or a new sign-in is no longer signed in when it runs.
   */
  liveSession(): SessionState | null {
    const session = this.session;
    return session !== null && this.context?.session === session ? session : null;
  }

  /** Step 2: the signed-in person, resolved from the records, in a workspace that calls this method. */
  person(): ResolvedPerson {
    const session = this.liveSession();
    const resolved = session
      ? resolvePerson(this.records, this.world.identities, session.personId)
      : null;
    if (!resolved) this.refuse({ kind: 'not-signed-in' });
    if (!audienceOf(this.method as MethodId).roles.has(resolved.role)) {
      this.refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
    }
    return resolved;
  }

  /** The signed-in person, if any, without a workspace check (the account menu, `getSession`). */
  sessionPerson(): ResolvedPerson | null {
    const session = this.liveSession();
    return session ? resolvePerson(this.records, this.world.identities, session.personId) : null;
  }

  /** The public surface's actor: a visitor holding this browser session's request tickets. */
  visitor(): PublicActor {
    return publicActor(this.context?.browser.tickets ?? []);
  }

  /** Step 3: may this actor take the action on this subject now? (`@xr/domain` `may`). */
  allow(actor: ResolvedPerson | PublicActor, action: ActionId, subject: Subject): void {
    const verdict = may(
      { actor: 'policy' in actor ? actor.policy : actor, now: this.now },
      action,
      subject,
    );
    if (!verdict.allowed) this.refuse(verdict.refusal as ServiceError);
  }

  /** Whether this actor may take the action now (a read model's "can start", never a refusal). */
  canDo(actor: ResolvedPerson | PublicActor, action: ActionId, subject: Subject): boolean {
    return this.verdict(actor, action, subject).allowed;
  }

  /** The policy's whole answer, for a read model that shows an open decision as itself (PC-26). */
  verdict(actor: ResolvedPerson | PublicActor, action: ActionId, subject: Subject) {
    return may({ actor: 'policy' in actor ? actor.policy : actor, now: this.now }, action, subject);
  }

  /**
   * Step 3 for reads: may this actor see the record? (`canRead`). A record this reader may not see
   * in its state reads as not found where the method declares no `invalid-state` (PC-16).
   */
  see(actor: ResolvedPerson | PublicActor, target: ReadTarget): void {
    const verdict = canRead(
      { actor: 'policy' in actor ? actor.policy : actor, now: this.now },
      target,
    );
    if (verdict.visible) return;
    const refusal = verdict.refusal;
    if (
      refusal.kind === 'invalid-state' &&
      !(rowOf(this.method as MethodId).errors as readonly string[]).includes('invalid-state')
    ) {
      this.refuse({ kind: 'not-found' });
    }
    this.refuse(refusal as ServiceError);
  }

  /** Whether this actor may see the record (lists leave out what a reader may not see). */
  canSee(actor: ResolvedPerson | PublicActor, target: ReadTarget): boolean {
    return this.readVerdict(actor, target).visible;
  }

  /** The read policy's whole answer, for a read model that shows an open decision as itself (PC-26). */
  readVerdict(actor: ResolvedPerson | PublicActor, target: ReadTarget): ReadVerdict {
    return canRead({ actor: 'policy' in actor ? actor.policy : actor, now: this.now }, target);
  }

  /**
   * A bare id argument (`ids.in.*`, PC-16): a bounded string names a record or nothing; a value of
   * the wrong type names nothing (`''`), so the method answers its own not-found or gate refusal.
   */
  idText(value: unknown): string {
    return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : '';
  }

  /** A record the caller named, or `not-found`. */
  found<T>(value: T | null | undefined): T {
    if (value === null || value === undefined) this.refuse({ kind: 'not-found' });
    return value;
  }

  /** Step 4: the accepted input, or `validation-failed` with the drawn words and summary title. */
  parse<S extends TypedSchema<unknown, unknown>>(schema: S, input: unknown): Out<S> {
    const parsed = parseInput(schema, input, rowOf(this.method as MethodId).form);
    if (!parsed.ok) this.refuse(parsed.error);
    return parsed.value as Out<S>;
  }

  /**
   * Step 5: the caller saw this revision of the record (Appendix C §1.8). A write to an existing
   * record without the revision it saw (`null`, as for a first save) is stale too.
   */
  rev(record: { readonly rev: number }, expectedRev: number | null | undefined): void {
    if (record.rev !== expectedRev) this.refuse({ kind: 'stale-version', currentRev: record.rev });
  }

  /** Step 5: the pure decision's records, or its refusal as the port's error (drawn words). */
  decide<T>(
    decision: Decision<T>,
    input: unknown,
    paramsFor?: (issue: InputIssue, target: IssueTarget) => Readonly<Record<string, string>>,
  ): T {
    if (decision.ok) return decision.value;
    this.refuse(
      fromDomainRefusal(
        this.method as MethodId,
        decision.refusal,
        input,
        rowOf(this.method as MethodId).form,
        paramsFor,
      ),
    );
  }

  /** Keeps the content a submission's current revision was sent with (`World.sentContent`). */
  keepSent(submission: Submission): void {
    const sent: SubmissionContent[] = [...(this.sentContent[submission.id] ?? [])];
    sent[submission.revision - 1] = submission.content;
    this.sentContent = { ...this.sentContent, [submission.id]: sent };
  }

  /** Marks a record as sample (seed metadata; never product chrome, T-36). */
  note(key: string, note: SeedNote): void {
    this.seedNotes[key] = note;
  }
}

/**
 * A port answer. Its error side is typed `never` so one runner serves every method's narrower
 * union; which error kinds, refusal codes and open decisions a method may answer is enforced at
 * run time against its ledger entry (`assertDeclared`) — and checked again by the contract suite.
 */
export type Answered<V> = Result<V, never>;

function failed(error: ServiceError): Answered<never> {
  return failure(error) as unknown as Answered<never>;
}

function caught<V>(method: MethodId, error: unknown): Answered<V> {
  if (error instanceof Refuse) {
    assertDeclared(method, error.error);
    return failed(error.error);
  }
  throw error;
}

interface CommitInput {
  readonly core: PlatformCore;
  readonly op: Op;
  readonly method: string;
  readonly origin: ChangeOrigin;
  readonly decision: string;
  readonly actor: ActorRef | null;
  readonly commandId: string | null;
  readonly receipt: { readonly sessionKey: string; readonly value: unknown } | null;
  readonly note?: string | null;
}

/** The actor the invariant check sees for a fixture-supplied value (never stored). */
const FIXTURE_ACTOR: ActorRef = { kind: 'requester', name: 'sample fixture' };

/** Steps 6–7: verify the invariants and commit the next world version. */
function commit(input: CommitInput): readonly RecordRef[] {
  const { core, op } = input;
  const world = op.world;
  const changed = op.tx.changed();
  const envelopeChanged =
    op.runtimeEvents.length > 0 ||
    op.seeded !== world.seeded ||
    op.sentContent !== world.sentContent ||
    Object.keys(op.seedNotes).length > 0;
  if (changed.length === 0 && !envelopeChanged) {
    // Nothing changed: no world version, no history, no event — but a repeated command id still
    // answers this first receipt instead of running again.
    if (input.commandId && input.receipt) {
      core.store.keep({
        ...world,
        processedCommandIds: {
          ...world.processedCommandIds,
          [input.commandId]: {
            method: input.method,
            sessionKey: input.receipt.sessionKey,
            worldVersion: world.worldVersion,
            value: input.receipt.value,
            changed,
          },
        },
      });
    }
    return changed;
  }
  checkInvariants({
    before: world.records,
    after: op.records,
    seeded: op.seeded,
    overlap: core.overlap,
    now: op.now,
    command: { name: input.decision, actor: input.actor ?? FIXTURE_ACTOR },
  });
  const worldVersion = world.worldVersion + 1;
  const commandId = input.commandId ?? core.nonces.next('command');
  const next: World = {
    ...world,
    worldVersion,
    records: op.records,
    idSource: op.ids.state,
    seeded: op.seeded,
    sentContent: op.sentContent,
    runtimeEvents:
      op.runtimeEvents.length > 0
        ? [...world.runtimeEvents, ...op.runtimeEvents]
        : world.runtimeEvents,
    seedNotes:
      Object.keys(op.seedNotes).length > 0
        ? { ...world.seedNotes, ...op.seedNotes }
        : world.seedNotes,
    history: [
      ...world.history,
      {
        worldVersion,
        commandId,
        method: input.method,
        origin: input.origin,
        actor: input.actor,
        at: op.now,
        changed,
        note: input.note ?? null,
      },
    ],
    processedCommandIds:
      input.commandId && input.receipt
        ? {
            ...world.processedCommandIds,
            [input.commandId]: {
              method: input.method,
              sessionKey: input.receipt.sessionKey,
              worldVersion,
              value: input.receipt.value,
              changed,
            },
          }
        : world.processedCommandIds,
  };
  core.store.commit(next, changed);
  return changed;
}

/** A product command (ledger kind `command`) that writes the world. */
export function command<V>(
  call: Call,
  method: MethodId,
  body: (op: Op) => Done<V>,
): Promise<Answered<V>> {
  const session = call.context.session;
  const sessionKey = call.context.sessionKey;
  return call.core.store.serialize((): Answered<V> => {
    const world = call.core.store.world;
    if (call.commandId) {
      const receipt = world.processedCommandIds[call.commandId];
      if (receipt) {
        if (receipt.method !== method || receipt.sessionKey !== sessionKey) {
          throw new Error(
            `Command id ${call.commandId} was already used for ${receipt.method} in another call.`,
          );
        }
        return success(receipt.value as V, receipt.changed);
      }
    }
    if (call.core.faults.take(method)) return failed({ kind: 'unavailable' });
    const op = new Op(call.core, call.context, method, world, call.core.clock.now(), session);
    let done: Done<V>;
    try {
      done = body(op);
    } catch (error) {
      return caught<V>(method, error);
    }
    const changed = commit({
      core: call.core,
      op,
      method,
      origin: 'command',
      decision: done.decision,
      actor: done.actor,
      commandId: call.commandId,
      receipt: { sessionKey, value: done.value },
    });
    done.after?.();
    return success(done.value, changed);
  });
}

/** A product read or preview: steps 1–4 and the read model; nothing is written. */
export function read<V>(call: Call, method: MethodId, body: (op: Op) => V): Promise<Answered<V>> {
  const session = call.context.session;
  return call.core.store.serialize((): Answered<V> => {
    if (call.core.faults.take(method)) return failed({ kind: 'unavailable' });
    const op = new Op(
      call.core,
      call.context,
      method,
      call.core.store.world,
      call.core.clock.now(),
      session,
    );
    try {
      const value = body(op);
      if (op.tx.changed().length > 0) throw new Error(`${method} is a read and staged a write.`);
      return success(value);
    } catch (error) {
      return caught<V>(method, error);
    }
  });
}

/**
 * A command that changes only the session or the browser session (sign-in, sign-out, the
 * selection): no world record is written. Its first answer is kept per session for a repeated
 * `commandId`.
 */
export function sessionScoped<V>(
  call: Call,
  method: MethodId,
  body: (op: Op) => Done<V>,
): Answered<V> {
  if (call.commandId) {
    const receipt = call.context.receipts.get(call.commandId);
    if (receipt) {
      if (receipt.method !== method)
        throw new Error(`Command id ${call.commandId} was already used for ${receipt.method}.`);
      return success(receipt.value as V, receipt.changed);
    }
  }
  if (call.core.faults.take(method)) {
    assertDeclared(method, { kind: 'unavailable' });
    return failed({ kind: 'unavailable' });
  }
  const op = new Op(call.core, call.context, method, call.core.store.world, call.core.clock.now());
  let done: Done<V>;
  try {
    done = body(op);
  } catch (error) {
    return caught<V>(method, error);
  }
  if (op.tx.changed().length > 0) throw new Error(`${method} wrote a world record.`);
  done.after?.();
  if (call.commandId) {
    call.context.receipts.set(call.commandId, { method, value: done.value, changed: [] });
  }
  return success(done.value);
}

/**
 * Sign-in and sign-out: session-scoped, and taken in turn behind the calls already made (the
 * in-tab lock), so a call made before them runs in the session it was made in.
 */
export function sessionCommand<V>(
  call: Call,
  method: MethodId,
  body: (op: Op) => Done<V>,
): Promise<Answered<V>> {
  return call.core.store.serialize(() => sessionScoped(call, method, body));
}

/** A failure of a stand-in or a test seam (their unions carry `invalid-state` only, §3.18). */
export class SystemRefusal extends Error {
  constructor(readonly current: string) {
    super(`refused: ${current}`);
  }
}

/**
 * A system writer's command (the stand-ins of §3.18, the test-only seams, seed steps):
 * synchronous, no session, a system or seed actor, the same invariant check and commit.
 */
export function systemCommand<V>(
  core: PlatformCore,
  method: string,
  origin: ChangeOrigin,
  body: (op: Op) => Done<V>,
  note: string | null = null,
):
  | { readonly ok: true; readonly value: V; readonly changed: readonly RecordRef[] }
  | { readonly ok: false; readonly current: string } {
  const op = new Op(core, null, method, core.store.world, core.clock.now());
  let done: Done<V>;
  try {
    done = body(op);
  } catch (error) {
    if (error instanceof SystemRefusal) return { ok: false, current: error.current };
    if (error instanceof Refuse) {
      const refusal = error.error;
      return {
        ok: false,
        current: refusal.kind === 'invalid-state' ? refusal.current : refusal.kind,
      };
    }
    throw error;
  }
  const changed = commit({
    core,
    op,
    method,
    origin,
    decision: done.decision,
    actor: done.actor,
    commandId: null,
    receipt: null,
    note,
  });
  done.after?.();
  return { ok: true, value: done.value, changed };
}
