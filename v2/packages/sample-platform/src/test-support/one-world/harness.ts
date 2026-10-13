/**
 * The WP-0.14 one-world proof harness (Appendix F WP-0.14 (a), acceptance 1, 2 and 7; Appendix D
 * §4.2–§4.9, §5.5). Test support only (excluded from the build, outside every fence).
 *
 * ONE platform is assembled from the spine-start seed and kept for the whole proof: every flow
 * step, alternate and cross-cutting command runs on it, in order, and nothing is rebuilt. The
 * spine is the scripted walk itself — each walk step runs exactly once, at its own sample time and
 * with its reserved board reference — so the proof cannot drift from the timeline the fixtures and
 * the boards share. Around it the harness adds what an isolated contract case cannot show:
 *
 *  - every port call (the walk's and the proof's) goes through the WP-0.10 conformance proxy
 *    (output schema, declared errors, refusals write nothing, `changed` = what was written) and is
 *    recorded with its answer, so a step can assert the actual command result;
 *  - every commit is observed through the platform's change bus, and after each proof step the
 *    twelve `@xr/domain` invariants are evaluated per commit — independently of the adapter's own
 *    pipeline check — together with the reworded invariant 10 and the sample provenance of every
 *    runtime event (invariant 12). A violation names the proof step, the commit and the record;
 *  - the world's command log and every record's own history are checked append-only, `changed`
 *    is checked against what each commit actually wrote, and a changed record's `rev` must rise.
 */
import type { ProductPorts, ServiceError } from '@xr/contracts/draft';
import { ledgerRows } from '@xr/contracts/draft';
import { conformingPorts, writtenKeys } from '@xr/contracts/draft/contract-suite';
import type { StandinPorts } from '@xr/contracts/draft/standins';
import {
  type ActorRef,
  brokenInvariants,
  canOpenFormat,
  FORMAT_DISPLAY_ORDER,
  type InvariantWorld,
  type PersonId,
} from '@xr/domain';

import { assemblePlatform, internalsOf, type SamplePlatform } from '../../platform/create.js';
import { ist } from '../../seed/book.js';
import { seed } from '../../seed/spine-start.js';
import {
  asPerson,
  personIdOf,
  type SampleSeams,
  seamsOf,
  setSampleNow,
  standinsOf,
  visitorPorts,
  worldOf,
} from '../../testing/harness.js';
import type { WalkContext, WalkStep } from '../../testing/walk.js';
import { WALK_STEPS } from '../../testing/walk.js';
import { accessFacts, experimentsGivenTo } from '../../world/queries.js';
import { formatKey, snapshotOf, values } from '../../world/records.js';
import type { World, WorldHistoryEntry, WorldRecords } from '../../world/types.js';

/** The matchers the proof steps use (the test runner's own, injected by the test file). */
export interface Matchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toContain(item: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toMatchObject(expected: object): void;
  toHaveProperty(property: string): void;
  readonly not: Matchers;
}

/** The runner's assertion function: `expect(actual, message)` with its asymmetric matchers. */
export interface Expect {
  (actual: unknown, message?: string): Matchers;
  arrayContaining(items: readonly unknown[]): unknown;
}

let runner: Expect | null = null;

/**
 * Installs the test runner's `expect` (the test file calls this). Test support is held to the
 * package's own boundary rules like its source — no test framework, no Node API (boundaries.test)
 * — so it receives the assertion function instead of importing one.
 */
export function useExpect(installed: Expect): void {
  runner = installed;
}

function installed(): Expect {
  if (!runner) throw new ProofViolation('The test file must call useExpect(expect) first.');
  return runner;
}

/** The installed runner's `expect`, for the proof steps. */
export const expect: Expect = Object.assign(
  (actual: unknown, message?: string) => installed()(actual, message),
  { arrayContaining: (items: readonly unknown[]) => installed().arrayContaining(items) },
);

/** One port, stand-in or seam call made during a proof step, with its answer. */
export interface RecordedCall {
  /** `Port.method` (ledger id), `standin.<port>.<method>` or `seam.<name>`. */
  readonly method: string;
  /** The sample person, `visitor` (the REQ-0042 requester) or `public`. */
  readonly actor: string;
  readonly input: unknown;
  readonly answer: unknown;
  readonly versionBefore: number;
  readonly versionAfter: number;
}

/** One committed world change, as the change bus announced it. */
export interface ObservedCommit {
  readonly step: string;
  readonly before: World;
  readonly after: World;
  readonly entry: WorldHistoryEntry;
}

/** A failed check, with the step, the commit and the record it concerns. */
export class ProofViolation extends Error {
  override readonly name = 'ProofViolation';
}

const LEDGER = new Map(ledgerRows().map((row) => [`${row.portKey}.${row.method}`, row.id]));

/** The answer of a success, or a violation naming the step. */
function successOf(answer: unknown, what: string): unknown {
  const result = answer as { ok?: boolean; value?: unknown; error?: unknown };
  if (result?.ok !== true) {
    throw new ProofViolation(`${what}: expected a success, got ${JSON.stringify(result?.error)}`);
  }
  return result.value;
}

// ---- invariants (Appendix D §5.5), evaluated per commit and per step ----

/** Product decisions the invariants name, by the command log's method (stand-ins and seams included). */
const DECISION_OF_METHOD: Readonly<Record<string, string>> = {
  'RuntimeReportPort.reportActivity': 'recordRuntimeActivity',
  'RuntimeReportPort.reportCompletion': 'reportCompletion',
  'PaymentOutcomePort.report': 'reportPaymentOutcome',
  'seam.recordReviewStarted': 'recordReviewStarted',
  'seam.supplyObjectiveMarks': 'applyObjectiveMarks',
  'seam.routeResubmission': 'routeResubmission',
};

/** `Port.method` → the domain decision (the method's own name for product commands). */
export function decisionOf(method: string): string {
  return DECISION_OF_METHOD[method] ?? method.slice(method.lastIndexOf('.') + 1);
}

/** The pipeline's actor for a value a fixture supplies (no product actor writes it). */
const FIXTURE_ACTOR: ActorRef = { kind: 'requester', name: 'sample fixture' };

function gates(platform: SamplePlatform, world: World): Map<string, boolean | 'policy-open'> {
  const { overlap } = internalsOf(platform).core;
  const now = internalsOf(platform).core.clock.now();
  const answers = new Map<string, boolean | 'policy-open'>();
  for (const person of values(world.records.people)) {
    if (person.kind !== 'student') continue;
    for (const experimentId of experimentsGivenTo(world.records, person)) {
      const facts = accessFacts(world.records, world.seeded, person, overlap, experimentId);
      if (!facts) continue;
      const experiment = world.records.experiments[experimentId] ?? null;
      for (const format of FORMAT_DISPLAY_ORDER) {
        const gate = canOpenFormat({ ...facts, experiment, now, format });
        answers.set(
          formatKey(person.id, experimentId, format),
          gate.canOpen ? true : gate.reason === 'policy-open' ? 'policy-open' : false,
        );
      }
    }
  }
  return answers;
}

function invariantWorld(
  platform: SamplePlatform,
  world: World,
  withGates: boolean,
): InvariantWorld {
  const records: WorldRecords = world.records;
  return {
    plans: values(records.plans),
    grants: values(records.grants),
    mappings: values(records.mappings),
    experiments: values(records.experiments),
    courses: values(records.courses),
    activities: values(records.activities),
    completions: values(records.completions),
    feedback: values(records.feedback),
    assessments: values(records.assessments),
    gates: withGates ? gates(platform, world) : new Map(),
  };
}

const RUNTIME_REPORTS = new Set([
  'RuntimeReportPort.reportActivity',
  'RuntimeReportPort.reportCompletion',
]);

/** The twelve invariants over one observed commit; each broken one names the step and the commit. */
export function commitViolations(platform: SamplePlatform, commit: ObservedCommit): string[] {
  const runtime = RUNTIME_REPORTS.has(commit.entry.method);
  const broken = brokenInvariants(
    invariantWorld(platform, commit.before, runtime),
    invariantWorld(platform, commit.after, runtime),
    { name: decisionOf(commit.entry.method), actor: commit.entry.actor ?? FIXTURE_ACTOR },
  );
  return broken.map(
    (message) =>
      `invariant ${message} — step ${commit.step}, commit ${commit.entry.method} (world v${commit.entry.worldVersion}; changed ${commit.entry.changed.map((ref) => `${ref.kind}:${ref.id}`).join(', ') || 'nothing'})`,
  );
}

/** Where the world stands against the reworded invariant 10 (Appendix D §5.5; WP-0.9 (5)). */
export type CompositeWallStage = 'before-flow-e' | 'in-flow-e' | 'after-flow-e';

const COMPOSITE_WALL = 'Composite Wall Conduction';
const COMPOSITE_WALL_NEW = 'Conduction Through a Composite Wall';

/** State checks of the whole world after a step: invariants 7, 9, 10 (reworded), 11 and 12. */
export function worldViolations(
  platform: SamplePlatform,
  step: string,
  world: World,
  stage: CompositeWallStage,
): string[] {
  const problems: string[] = [];
  // The world-state invariants (7, 9, 10's id rule, 11, 12) hold of the world on its own: a
  // neutral system "command" makes every command-relative invariant vacuous.
  const state = invariantWorld(platform, world, false);
  for (const message of brokenInvariants(state, state, {
    name: 'proof:world-state',
    actor: { kind: 'system', system: 'system:term-clock' },
  })) {
    problems.push(`invariant ${message} — world after step ${step}`);
  }
  // Invariant 10 as reworded: SUB-0077 does not exist before Flow E step 1; both Composite Wall
  // records exist once Flow E has published it; no two experiments ever share a name.
  const experiments = values(world.records.experiments);
  const named = (name: string) =>
    experiments.filter((experiment) => experiment.live.catalogue.name === name);
  const names = experiments.map((experiment) =>
    experiment.live.catalogue.name.trim().toLowerCase(),
  );
  if (new Set(names).size !== names.length)
    problems.push(`invariant #10 two experiment records share a name — after step ${step}`);
  if (named(COMPOSITE_WALL).length !== 1)
    problems.push(
      `invariant #10 "${COMPOSITE_WALL}" is not exactly one record — after step ${step}`,
    );
  const submission = world.records.submissions['SUB-0077'];
  if (stage === 'before-flow-e' && submission)
    problems.push(`invariant #10 SUB-0077 exists before Flow E step 1 — after step ${step}`);
  if (stage !== 'after-flow-e' && named(COMPOSITE_WALL_NEW).length > 0)
    problems.push(
      `invariant #10 "${COMPOSITE_WALL_NEW}" is an experiment record before Flow E publishes it — after step ${step}`,
    );
  if (stage === 'after-flow-e') {
    const created = named(COMPOSITE_WALL_NEW);
    if (created.length !== 1 || !submission)
      problems.push(
        `invariant #10 "${COMPOSITE_WALL_NEW}" (SUB-0077) is not its own published record — after step ${step}`,
      );
    else if (created[0]!.id === named(COMPOSITE_WALL)[0]!.id)
      problems.push(
        `invariant #10 the two Composite Wall records share an id — after step ${step}`,
      );
  }
  // Invariant 12: every runtime event the world holds carries sample provenance, and the WEB
  // stand-in never reports a completion (TE-3).
  for (const event of world.runtimeEvents) {
    if (event.origin !== 'sample-fixture' && event.origin !== 'sample-standin')
      problems.push(
        `invariant #12 runtime event ${event.id} has origin ${String(event.origin)} — after step ${step}`,
      );
    if (event.origin === 'sample-standin' && event.report.kind === 'completion')
      problems.push(
        `invariant #12 the WEB stand-in reported completion ${event.id} — after step ${step}`,
      );
  }
  return problems;
}

/** Record history and changed references (WP-0.14 (7)) for one observed commit. */
export function historyViolations(commit: ObservedCommit): string[] {
  const problems: string[] = [];
  const where = `step ${commit.step}, commit ${commit.entry.method} (world v${commit.entry.worldVersion})`;
  const { before, after, entry } = commit;
  if (after.worldVersion !== before.worldVersion + 1)
    problems.push(
      `world version ${after.worldVersion} does not follow ${before.worldVersion} — ${where}`,
    );
  if (
    after.history.length !== before.history.length + 1 ||
    JSON.stringify(after.history.slice(0, -1)) !== JSON.stringify(before.history)
  )
    problems.push(`the command log is not append-only — ${where}`);
  if (entry.worldVersion !== after.worldVersion)
    problems.push(`the command log entry names world v${entry.worldVersion} — ${where}`);
  const declared = [...new Set(entry.changed.map((ref) => `${ref.kind}:${ref.id}`))].sort();
  const beforeSnapshot = snapshotOf(before);
  const afterSnapshot = snapshotOf(after);
  const written = writtenKeys(beforeSnapshot, afterSnapshot);
  if (JSON.stringify(declared) !== JSON.stringify(written))
    problems.push(
      `changed lists ${declared.join(', ') || 'nothing'} but the commit wrote ${written.join(', ') || 'nothing'} — ${where}`,
    );
  for (const key of written) {
    const was = beforeSnapshot[key] as { rev?: unknown; history?: unknown } | undefined;
    const now = afterSnapshot[key] as { rev?: unknown; history?: unknown } | undefined;
    if (!now) {
      problems.push(`${key} was removed — ${where}`);
      continue;
    }
    if (was && typeof was.rev === 'number' && typeof now.rev === 'number' && now.rev <= was.rev)
      problems.push(`${key} changed without a new rev (${was.rev} → ${now.rev}) — ${where}`);
    if (was && Array.isArray(was.history)) {
      const kept = Array.isArray(now.history)
        ? JSON.stringify(now.history.slice(0, was.history.length)) === JSON.stringify(was.history)
        : false;
      if (!kept) problems.push(`${key} lost or rewrote its history — ${where}`);
    }
  }
  return problems;
}

// ---- the proof context ----

/** What a proof step's `run` and `verify` receive. */
export interface ProofContext {
  readonly platform: SamplePlatform;
  /** A documented sample person's ports, in a session of their own (the harness seam). */
  readonly as: (name: string) => ProductPorts;
  /** The visitor who sent REQ-0042 (their browser session holds its status ticket). */
  readonly visitor: ProductPorts;
  /** A new public visitor with a browser session of their own. */
  readonly stranger: () => ProductPorts;
  readonly standins: StandinPorts;
  readonly seams: SampleSeams;
  readonly personId: (name: string) => PersonId;
  /** Values one step hands to a later one. */
  readonly carried: Map<string, string>;
  readonly world: () => World;
  /** The calls made so far in this step (walk and proof alike), in order. */
  readonly calls: () => readonly RecordedCall[];
  /** The success value of this step's last (or first) successful call of a method. */
  readonly resultOf: <T = unknown>(method: string, which?: 'first' | 'last') => T;
  /** The `changed` refs of this step's last successful call of a method. */
  readonly changedBy: (method: string) => readonly string[];
  /** The command-log entries this step committed, in order. */
  readonly committed: () => readonly WorldHistoryEntry[];
  /** The fields of a record (`KIND:id`) that this step's commit of `method` changed. */
  readonly fieldsChanged: (method: string, key: string) => readonly string[];
  /**
   * Runs a call that must be refused with `kind` (and `code` / `decision` when given) and checks
   * that nothing was written: the world version and every record are unchanged.
   */
  readonly refused: (
    what: string,
    call: () => unknown,
    expected: {
      readonly kind: ServiceError['kind'];
      readonly code?: string;
      readonly decision?: string;
    },
  ) => Promise<ServiceError>;
  /** The success value of a call, or a violation naming `what`. */
  readonly ok: <T>(what: string, answer: unknown) => Promise<T>;
  readonly note: (line: string) => void;
}

export type ProofCoverage =
  `flows.json ${string}` | `alternate ${string}` | `cross-cutting ${string}` | `interim ${string}`;

/** One step of the proof: walk steps it runs and/or its own commands, then what it verifies. */
export interface ProofStep {
  readonly id: string;
  readonly title: string;
  /** The flows.json steps, alternates, cross-cutting commands and interims this step proves. */
  readonly covers: readonly ProofCoverage[];
  readonly actor: string;
  /** Planned screen ids (the screens are later phases; the proof reads their port methods). */
  readonly screens: string;
  /** Board evidence (board code and frame). */
  readonly evidence: string;
  /** An owner-approved interim the step uses, named in its title (AD-14, DV-2, DV-1, M-3). */
  readonly interim?: string;
  /** Walk step ids this step runs, in walk order, each at its own sample time. */
  readonly walk?: readonly string[];
  /** The step's own commands (alternates, interims, cross-cutting), at `at`. */
  readonly at?: string;
  readonly run?: (proof: ProofContext) => Promise<void> | void;
  readonly verify: (proof: ProofContext) => Promise<void> | void;
}

/** A finished step's evidence: its calls, commits and the checks that ran. */
export interface StepReport {
  readonly id: string;
  readonly calls: readonly RecordedCall[];
  readonly commits: readonly ObservedCommit[];
  readonly notes: readonly string[];
  readonly invariantChecks: number;
}

export interface OneWorld {
  readonly platform: SamplePlatform;
  /** Runs one proof step (its walk steps and own commands, then its checks); throws on any failure. */
  readonly runStep: (step: ProofStep) => Promise<StepReport>;
  readonly reports: readonly StepReport[];
  /** Every commit the change bus announced, whichever step made it. */
  readonly commitLog: readonly ObservedCommit[];
  /** Walk step ids run so far, in order. */
  readonly walked: readonly string[];
  readonly dispose: () => void;
}

const WALK_BY_ID = new Map(WALK_STEPS.map((step) => [step.id, step]));

/** Builds the one world and the step runner. */
export function oneWorld(): OneWorld {
  const platform = assemblePlatform({ world: seed() });
  const reports: StepReport[] = [];
  const commitLog: ObservedCommit[] = [];
  /** Commits announced since the last check, whichever step made them: every one is checked once. */
  let unchecked: ObservedCommit[] = [];
  const walked: string[] = [];
  const carried = new Map<string, string>();
  let current = 'boot';
  let calls: RecordedCall[] = [];
  let commits: ObservedCommit[] = [];
  let notes: string[] = [];
  let previous = worldOf(platform);
  let stage: CompositeWallStage = 'before-flow-e';

  const unsubscribe = platform.subscribe(() => {
    const after = worldOf(platform);
    const commit = { step: current, before: previous, after, entry: after.history.at(-1)! };
    commits.push(commit);
    commitLog.push(commit);
    unchecked.push(commit);
    previous = after;
  });

  const snapshot = () => snapshotOf(worldOf(platform));
  const version = () => worldOf(platform).worldVersion;

  /** Records every call of a set of conformance-checked ports. */
  function recorded(ports: ProductPorts, actor: string): ProductPorts {
    const conformed = conformingPorts(ports, snapshot, { calls: [] });
    const wrapped: Record<string, Record<string, unknown>> = {};
    for (const [portKey, port] of Object.entries(
      conformed as unknown as Record<string, Record<string, unknown>>,
    )) {
      wrapped[portKey] = {};
      for (const [method, original] of Object.entries(port)) {
        if (typeof original !== 'function') continue;
        const id = LEDGER.get(`${portKey}.${method}`) ?? `${portKey}.${method}`;
        wrapped[portKey]![method] = (...args: unknown[]) => {
          const versionBefore = version();
          const answer = (original as (...a: unknown[]) => unknown)(...args);
          const keep = (value: unknown) => {
            calls.push({
              method: id,
              actor,
              input: args[0],
              answer: value,
              versionBefore,
              versionAfter: version(),
            });
            return value;
          };
          return answer instanceof Promise ? answer.then(keep) : keep(answer);
        };
      }
    }
    return wrapped as unknown as ProductPorts;
  }

  const rawStandins = standinsOf(platform);
  const standins: StandinPorts = {
    ...rawStandins,
    paymentOutcome: {
      report: (input) => {
        const versionBefore = version();
        const answer = rawStandins.paymentOutcome.report(input);
        calls.push({
          method: 'standin.paymentOutcome.report',
          actor: 'system',
          input,
          answer,
          versionBefore,
          versionAfter: version(),
        });
        return answer;
      },
    },
    runtimeReport: {
      reportActivity: (input) => {
        const versionBefore = version();
        const answer = rawStandins.runtimeReport.reportActivity(input);
        calls.push({
          method: 'standin.runtimeReport.reportActivity',
          actor: 'system',
          input,
          answer,
          versionBefore,
          versionAfter: version(),
        });
        return answer;
      },
      reportCompletion: (input) => {
        const versionBefore = version();
        const answer = rawStandins.runtimeReport.reportCompletion(input);
        calls.push({
          method: 'standin.runtimeReport.reportCompletion',
          actor: 'system',
          input,
          answer,
          versionBefore,
          versionAfter: version(),
        });
        return answer;
      },
    },
  };
  const rawSeams = seamsOf(platform);
  const seamCall =
    <A extends unknown[]>(name: string, run: (...args: A) => void) =>
    (...args: A) => {
      const versionBefore = version();
      run(...args);
      calls.push({
        method: `seam.${name}`,
        actor: 'test-seam',
        input: args[0],
        answer: { ok: true },
        versionBefore,
        versionAfter: version(),
      });
    };
  const seams: SampleSeams = {
    recordReviewStarted: seamCall('recordReviewStarted', rawSeams.recordReviewStarted),
    supplyObjectiveMarks: seamCall('supplyObjectiveMarks', rawSeams.supplyObjectiveMarks),
    routeResubmission: seamCall('routeResubmission', rawSeams.routeResubmission),
  };

  const visitor = recorded(visitorPorts(platform), 'visitor');
  const people = new Map<string, ProductPorts>();
  const as = (name: string): ProductPorts => {
    let ports = people.get(name);
    if (!ports) {
      ports = recorded(asPerson(platform, name), name);
      people.set(name, ports);
    }
    return ports;
  };

  const context: ProofContext = {
    platform,
    as,
    visitor,
    stranger: () => recorded(visitorPorts(platform), 'public'),
    standins,
    seams,
    personId: (name) => personIdOf(worldOf(platform), name),
    carried,
    world: () => worldOf(platform),
    calls: () => calls,
    resultOf: <T>(method: string, which: 'first' | 'last' = 'last') => {
      const matching = calls.filter(
        (call) => call.method === method && (call.answer as { ok?: boolean })?.ok === true,
      );
      const call = which === 'first' ? matching[0] : matching.at(-1);
      if (!call) throw new ProofViolation(`step ${current}: no call of ${method} was made`);
      return successOf(call.answer, `step ${current}: ${method}`) as T;
    },
    changedBy: (method) => {
      const call = calls
        .filter((entry) => entry.method === method && (entry.answer as { ok?: boolean })?.ok)
        .at(-1);
      if (!call) throw new ProofViolation(`step ${current}: no successful call of ${method}`);
      return [
        ...new Set(
          (call.answer as { changed: { kind: string; id: string }[] }).changed.map(
            (ref) => `${ref.kind}:${ref.id}`,
          ),
        ),
      ].sort();
    },
    committed: () => commits.map((commit) => commit.entry),
    fieldsChanged: (method, key) => {
      const commit = commits.filter((entry) => entry.entry.method === method).at(-1);
      if (!commit) throw new ProofViolation(`step ${current}: no commit of ${method}`);
      const was = (snapshotOf(commit.before)[key] ?? {}) as Record<string, unknown>;
      const now = (snapshotOf(commit.after)[key] ?? {}) as Record<string, unknown>;
      return [...new Set([...Object.keys(was), ...Object.keys(now)])]
        .filter((field) => JSON.stringify(was[field]) !== JSON.stringify(now[field]))
        .sort();
    },
    refused: async (what, call, expected) => {
      const before = snapshot();
      const versionBefore = version();
      const answer = (await call()) as { ok?: boolean; error?: ServiceError };
      if (answer?.ok !== false || !answer.error)
        throw new ProofViolation(
          `step ${current}: ${what} — expected ${expected.kind}, got a success`,
        );
      const error = answer.error;
      if (error.kind !== expected.kind)
        throw new ProofViolation(
          `step ${current}: ${what} — expected ${expected.kind}, got ${JSON.stringify(error)}`,
        );
      if (expected.code !== undefined && (error as { code?: string }).code !== expected.code)
        throw new ProofViolation(
          `step ${current}: ${what} — expected code ${expected.code}, got ${JSON.stringify(error)}`,
        );
      if (
        expected.decision !== undefined &&
        (error as { decision?: string }).decision !== expected.decision
      )
        throw new ProofViolation(
          `step ${current}: ${what} — expected decision ${expected.decision}, got ${JSON.stringify(error)}`,
        );
      if (version() !== versionBefore)
        throw new ProofViolation(
          `step ${current}: ${what} — the refusal moved the world to v${version()}`,
        );
      const written = writtenKeys(before, snapshot());
      if (written.length > 0)
        throw new ProofViolation(
          `step ${current}: ${what} — the refusal wrote ${written.join(', ')}`,
        );
      return error;
    },
    ok: async <T>(what: string, answer: unknown) =>
      successOf(await answer, `step ${current}: ${what}`) as T,
    note: (line) => notes.push(line),
  };

  const walkContext: WalkContext = {
    platform,
    visitor,
    as,
    standins,
    seams,
    personId: context.personId,
    carried,
  };

  async function runWalkStep(step: WalkStep): Promise<void> {
    setSampleNow(platform, step.at);
    await step.run(walkContext);
    walked.push(step.id);
  }

  /** The invariant and history checks over every unchecked commit, and the world after `step`. */
  function checks(step: string): string[] {
    const pending = unchecked;
    unchecked = [];
    return [
      ...pending.flatMap((commit) => [
        ...commitViolations(platform, commit),
        ...historyViolations(commit),
      ]),
      ...worldViolations(platform, step, worldOf(platform), stage),
    ];
  }

  async function runStep(step: ProofStep): Promise<StepReport> {
    current = step.id;
    calls = [];
    commits = [];
    notes = [];
    let phase: 'commands' | 'verify' = 'commands';
    let failure: unknown = null;
    try {
      for (const id of step.walk ?? []) {
        const walkStep = WALK_BY_ID.get(id);
        if (!walkStep) throw new ProofViolation(`step ${step.id}: no walk step ${id}`);
        await runWalkStep(walkStep);
        if (id === 'E1-save') stage = 'in-flow-e';
        if (id === 'E4-publish') stage = 'after-flow-e';
      }
      if (step.run) {
        if (step.at) setSampleNow(platform, ist(step.at));
        await step.run(context);
      }
      phase = 'verify';
      await step.verify(context);
    } catch (error) {
      failure = error;
    }
    // The checks run whatever happened above: a failed command or check never hides a commit.
    const problems = checks(step.id);
    if (problems.length > 0) {
      const also = failure ? `\n(the step also failed: ${String(failure)})` : '';
      throw Object.assign(new ProofViolation(`${problems.join('\n')}${also}`), { phase: 'checks' });
    }
    if (failure) {
      throw Object.assign(failure instanceof Error ? failure : new Error(String(failure)), {
        phase,
      });
    }
    const report: StepReport = {
      id: step.id,
      calls,
      commits,
      notes,
      invariantChecks: commits.length * 12 + 12,
    };
    reports.push(report);
    return report;
  }

  return { platform, runStep, reports, commitLog, walked, dispose: unsubscribe };
}
