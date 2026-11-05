/**
 * The CI-only test-hook bridge (TE-7; ADR-0003 §3; ADR-0007 §2–3; Appendix F §3.2, §7.2).
 *
 * Compiled in ONLY by builds made with the test-hook flag (`scripts/next-with-test-hooks.mjs`):
 * `next.config.ts` resolves `@/platform/test-hooks` to this file then, and to the empty stub
 * (`test-hooks.ts`) in every other build. It is the only module that imports
 * `@xr/sample-platform/testing` (import fences). It renders nothing and adds no control, route,
 * account chooser, scenario selector or clock to the product.
 *
 * What it does, for Playwright only:
 * - **Boot descriptor** (`bootWorld`): before the tab's platform is composed, it reads the
 *   frozen `{ fixture, session }` a test installed and starts the tab on that fixture world,
 *   signed in as that person (no sign-in form: XS-01 is Phase 1, G-8).
 * - **`actAs(personId, { port, method, input })`**: runs one port method as another sample
 *   person, in a session of its own, against the SAME world the page shows; the receipt
 *   invalidates the page's queries through the one invalidation function.
 * - **`switchSession(personId)`** (WP-0.14, owner-authorised): signs the tab's OWN session in as
 *   another sample person through the product's session port — `SessionService.signIn` with that
 *   person's sample e-mail and a non-empty password (the AD-03 interim), so the sign-in policy
 *   applies (an inactive Faculty member is refused, SES-09) — and the tab's session store adopts
 *   the answer as it adopts every sign-in: the whole query cache is cleared first, then the new
 *   session key is published, so the shell re-renders from that person's stored role. The same
 *   world, nothing reloaded. It is the CI stand-in for typing a sign-in on XS-01 while XS-01 is
 *   unbuilt (Phase 1, G-8): it chooses the person; it decides nothing else. No UI reaches it: no
 *   selector, no chooser.
 * - **`inspect()`**: the world's identity (including this tab's world instance), the tab's session
 *   and the session keys its cached answers belong to, for assertions.
 * - **Request seams** (Package 1C; owner decisions AD-14 / P1-04 and TE-4, 14 Oct 2026), each a
 *   non-human writer of `@xr/sample-platform/testing`, never a product control:
 *   `startReview(reference)` records the review-start fact through the AD-14 test-only seam (the
 *   requester's "Submitted" becomes "Under review"; opening SA-03 still starts nothing);
 *   `planPayment(outcome)` sets what the sample payment provider reports for the next payment the
 *   page starts (`pending` → "Payment not confirmed", `failed` → "Payment failed"); and
 *   `reportPayment(reference, outcome)` is the provider's later report on a started payment. Their
 *   writes invalidate the page's reads like `actAs` receipts.
 * - **Runtime-report seam** (Phase 3; T-12 / P3-01 open, ADR-0006, TE-3 unsigned): `reportRuntime`
 *   is the sample runtime's own report — activity (`opened`, `saved`, `session`) or a completion
 *   (`completed`, from the simulation or the headset) — written by `system:runtime-report` with
 *   sample provenance through `@xr/sample-platform/testing`'s stand-in, at the world's sample "now".
 *   It is the ONLY way a browser test reaches In progress or Completed: no product control, launch,
 *   page or time writes either, and product builds do not contain this seam.
 */
import { PORT_KEYS, type PortKey } from '@xr/contracts/draft';
import type { ExperimentId, PersonId, RecordRef, RequestId } from '@xr/domain';
import {
  asPersonId,
  beginSession,
  FIXTURE_NAMES,
  type FixtureName,
  fixtureWorld,
  planPayment,
  seamsOf,
  standinsOf,
  worldOf,
} from '@xr/sample-platform/testing';

import { sampleOf } from './composition';
import type { PlatformRuntime } from './runtime';
import type { PreparedBoot, TestHooks } from './test-hook-contract';

/** Its presence in a bundle marks a test-hook build; `pnpm verify` requires it absent elsewhere. */
export const TEST_HOOK_BRIDGE_MARKER = 'xr-web-test-hook-bridge';
/** Marks the same-tab session switch (WP-0.14); `pnpm verify` requires it in no product bundle. */
export const TEST_SESSION_SWITCH_MARKER = 'xr-web-test-session-switch';
/** Marks the request seams (Package 1C); `pnpm verify` requires it in no product bundle. */
export const TEST_REQUEST_SEAMS_MARKER = 'xr-web-test-request-seams';
/** Marks the runtime-report seam (Phase 3); `pnpm verify` requires it in no product bundle. */
export const TEST_RUNTIME_SEAM_MARKER = 'xr-web-test-runtime-seam';
/** Kept equal to `e2e/support/test-seam.ts` (checked by the bridge's unit test). */
export const BOOT_DESCRIPTOR_GLOBAL = '__XR_TEST_BOOT__';
export const TEST_HOOKS_GLOBAL = '__XR_TEST_HOOKS__';

type Sample = Parameters<typeof worldOf>[0];

const PORT_KEY_SET: ReadonlySet<string> = new Set(Object.values(PORT_KEYS));
const PERSON_ID = /^\S+$/;
/** A request's reference (`REQ-0042`): the seams name the record, never its address or ticket. */
const REQUEST_REFERENCE = /^REQ-\d{4,}$/;

class TestHookError extends Error {
  override readonly name = 'TestHookError';
}

interface Descriptor {
  readonly fixture: FixtureName;
  readonly personId: string | null;
}

function readDescriptor(): Descriptor | null {
  const value: unknown = Reflect.get(window, BOOT_DESCRIPTOR_GLOBAL);
  if (value === undefined) return null;
  const descriptor = value as { readonly fixture?: unknown; readonly session?: unknown };
  if (
    typeof descriptor.fixture !== 'string' ||
    !(FIXTURE_NAMES as readonly string[]).includes(descriptor.fixture)
  ) {
    throw new TestHookError(
      `The boot descriptor names no fixture world of @xr/sample-platform/testing (${String(descriptor.fixture)}; known: ${FIXTURE_NAMES.join(', ')}).`,
    );
  }
  const session = descriptor.session as { readonly personId?: unknown } | null | undefined;
  if (session === null) return { fixture: descriptor.fixture as FixtureName, personId: null };
  const personId = session?.personId;
  if (typeof personId !== 'string' || !PERSON_ID.test(personId)) {
    throw new TestHookError('The boot descriptor session must be null or { personId }.');
  }
  return { fixture: descriptor.fixture as FixtureName, personId };
}

interface PortCommand {
  readonly port: PortKey;
  readonly method: string;
  readonly input: unknown;
}

/** Any non-empty password signs a known sample e-mail in (AD-03 interim; README "Sample credentials"). */
const SAMPLE_PASSWORD = 'test-hook-session-switch';

/**
 * The sample e-mail a person signs in with, found where `SessionService.signIn` looks for it: a
 * person's institution e-mail, an institution's Institute Admin, a platform-role holder, or a
 * Super Admin identity.
 */
function sampleEmailOf(world: ReturnType<typeof worldOf>, personId: string): string | null {
  const person = Object.values(world.records.people).find((candidate) => candidate.id === personId);
  if (person) return person.institutionEmail;
  const institution = Object.values(world.records.institutions).find(
    (candidate) => candidate.instituteAdmin?.personId === personId,
  );
  if (institution?.instituteAdmin) return institution.instituteAdmin.workEmail;
  const holder = Object.values(world.records.holders).find(
    (candidate) => candidate.personId === personId,
  );
  if (holder) return holder.workEmail;
  return (
    world.identities.superAdmins.find((identity) => identity.personId === personId)?.email ?? null
  );
}

function portCommand(value: unknown): PortCommand {
  const command = value as {
    readonly port?: unknown;
    readonly method?: unknown;
    readonly input?: unknown;
  };
  if (typeof command?.port !== 'string' || !PORT_KEY_SET.has(command.port)) {
    throw new TestHookError(`"${String(command?.port)}" is not a product port.`);
  }
  if (typeof command.method !== 'string' || command.method.length === 0) {
    throw new TestHookError('A port command names its method.');
  }
  return { port: command.port as PortKey, method: command.method, input: command.input };
}

function requestReference(seam: string, value: unknown): string {
  if (typeof value !== 'string' || !REQUEST_REFERENCE.test(value)) {
    throw new TestHookError(`${seam} names a request by its reference, like REQ-0042.`);
  }
  return value;
}

const RUNTIME_KINDS = ['opened', 'saved', 'session', 'completed'] as const;
type RuntimeKind = (typeof RUNTIME_KINDS)[number];
const FORMATS = ['web', 'ar', 'vr', 'mr'] as const;

/** A runtime report as a test names it: whose, which experiment and format, what happened. */
function runtimeReport(value: unknown): {
  readonly personId: string;
  readonly experimentId: string;
  readonly format: (typeof FORMATS)[number];
  readonly kind: RuntimeKind;
  readonly from: 'simulation' | 'headset';
} {
  const report = value as Record<string, unknown> | null;
  const personId = report?.personId;
  const experimentId = report?.experimentId;
  const format = report?.format;
  const kind = report?.kind;
  if (typeof personId !== 'string' || !PERSON_ID.test(personId)) {
    throw new TestHookError('reportRuntime names a sample Student by a non-empty personId.');
  }
  if (typeof experimentId !== 'string' || experimentId.trim() === '') {
    throw new TestHookError('reportRuntime names the experiment by its id.');
  }
  if (!(FORMATS as readonly unknown[]).includes(format)) {
    throw new TestHookError('reportRuntime takes a format: web, ar, vr or mr.');
  }
  if (!(RUNTIME_KINDS as readonly unknown[]).includes(kind)) {
    throw new TestHookError('reportRuntime takes a kind: opened, saved, session or completed.');
  }
  const from = report?.from ?? (format === 'web' ? 'simulation' : 'headset');
  if (from !== 'simulation' && from !== 'headset') {
    throw new TestHookError('reportRuntime reports from the simulation or the headset.');
  }
  return {
    personId,
    experimentId,
    format: format as (typeof FORMATS)[number],
    kind: kind as RuntimeKind,
    from,
  };
}

function isReceipt(
  answer: unknown,
): answer is { readonly ok: true; readonly changed: readonly RecordRef[] } {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    (answer as { ok?: unknown }).ok === true &&
    Array.isArray((answer as { changed?: unknown }).changed)
  );
}

interface Booted {
  readonly sample: Sample;
  readonly runtime: PlatformRuntime;
  readonly fixture: string | null;
  /** This tab's one world, named once when the bridge attaches: a second world would differ. */
  readonly instance: string;
}

function newInstanceId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `world-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

let booted: Booted | null = null;
let attached = 0;
let resolveBoot: () => void = () => undefined;
let rejectBoot: (error: Error) => void = () => undefined;
const boot = new Promise<void>((resolve, reject) => {
  resolveBoot = resolve;
  rejectBoot = reject;
});
// A failed boot is reported through the handle's calls, never as an unhandled rejection.
boot.catch(() => undefined);

async function whenBooted(): Promise<Booted> {
  await boot;
  if (!booted) throw new TestHookError('The tab booted without the bridge attached.');
  return booted;
}

const handle = Object.freeze({
  marker: TEST_HOOK_BRIDGE_MARKER,
  actAs: async (personId: unknown, command: unknown): Promise<unknown> => {
    const { sample, runtime } = await whenBooted();
    if (typeof personId !== 'string' || !PERSON_ID.test(personId)) {
      throw new TestHookError('actAs names a sample person by a non-empty id.');
    }
    const { port, method, input } = portCommand(command);
    const target: unknown = Reflect.get(asPersonId(sample, personId)[port], method);
    if (typeof target !== 'function') {
      throw new TestHookError(`${port}.${method} is not a method of the ${port} port.`);
    }
    const answer: unknown = await (target as (input: unknown) => Promise<unknown>)(input);
    if (isReceipt(answer)) await runtime.invalidate(answer.changed);
    return answer;
  },
  switchSession: async (personId: unknown): Promise<unknown> => {
    const { sample, runtime, instance } = await whenBooted();
    if (typeof personId !== 'string' || !PERSON_ID.test(personId)) {
      throw new TestHookError('switchSession names a sample person by a non-empty id.');
    }
    const email = sampleEmailOf(worldOf(sample), personId);
    if (!email) throw new TestHookError(`No sample person with id ${personId} signs in here.`);
    const previous = runtime.session.getSnapshot();
    // The product's own sign-in, on the tab's session port: policy, then adoption by the store.
    const answer = await runtime.ports.session.signIn({
      method: 'email',
      email,
      password: SAMPLE_PASSWORD,
    });
    if (!answer.ok) {
      throw new TestHookError(
        `Sign-in as ${personId} was refused: ${JSON.stringify(answer.error)}`,
      );
    }
    const next = runtime.session.getSnapshot();
    return {
      marker: TEST_SESSION_SWITCH_MARKER,
      instance,
      previousSessionKey: previous.status === 'unknown' ? null : previous.sessionKey,
      sessionKey: next.status === 'unknown' ? null : next.sessionKey,
      personId: next.status === 'signed-in' ? next.personId : null,
      worldVersion: worldOf(sample).worldVersion,
    };
  },
  startReview: async (reference: unknown): Promise<{ readonly marker: string }> => {
    const { sample, runtime } = await whenBooted();
    const requestId = requestReference('startReview', reference);
    // The AD-14 seam throws when the request cannot start a review (unknown, decided, started).
    seamsOf(sample).recordReviewStarted(requestId);
    const changed: RecordRef = { kind: 'REQ', id: requestId };
    await runtime.invalidate([changed]);
    return { marker: TEST_REQUEST_SEAMS_MARKER };
  },
  planPayment: async (outcome: unknown): Promise<{ readonly marker: string }> => {
    const { sample } = await whenBooted();
    if (outcome !== 'pending' && outcome !== 'failed' && outcome !== 'confirmed') {
      throw new TestHookError('planPayment takes pending, failed or confirmed.');
    }
    planPayment(sample, outcome);
    return { marker: TEST_REQUEST_SEAMS_MARKER };
  },
  reportPayment: async (reference: unknown, outcome: unknown): Promise<unknown> => {
    const { sample, runtime } = await whenBooted();
    const requestId = requestReference('reportPayment', reference);
    if (outcome !== 'failed' && outcome !== 'confirmed') {
      throw new TestHookError('reportPayment takes confirmed or failed.');
    }
    // The provider's report, written by `system:payment-provider` with sample provenance.
    const answer = standinsOf(sample).paymentOutcome.report({
      requestId: requestId as RequestId,
      outcome,
    });
    if (answer.ok) await runtime.invalidate(answer.changed);
    return answer;
  },
  reportRuntime: async (value: unknown): Promise<unknown> => {
    const { sample, runtime } = await whenBooted();
    const report = runtimeReport(value);
    const standins = standinsOf(sample);
    const at = standins.clock.now();
    const base = {
      studentId: report.personId as PersonId,
      experimentId: report.experimentId as ExperimentId,
      format: report.format,
      at,
    };
    // The runtime's own report (`system:runtime-report`, sample provenance): activity never
    // completes a format; a completion is written only here, the first one standing (ADR-0006).
    const answer =
      report.kind === 'completed'
        ? standins.runtimeReport.reportCompletion({ ...base, from: report.from })
        : standins.runtimeReport.reportActivity({ ...base, kind: report.kind });
    if (!answer.ok) {
      throw new TestHookError(`The runtime report was refused: ${JSON.stringify(answer.error)}`);
    }
    await runtime.invalidate(answer.changed);
    return { marker: TEST_RUNTIME_SEAM_MARKER, value: answer.value };
  },
  inspect: async () => {
    const { sample, runtime, fixture, instance } = await whenBooted();
    const world = worldOf(sample);
    const session = runtime.session.getSnapshot();
    return {
      marker: TEST_HOOK_BRIDGE_MARKER,
      instance,
      fixture,
      seedId: world.seedId,
      worldVersion: world.worldVersion,
      attached,
      persistence: runtime.capabilities.persistence,
      session:
        session.status === 'signed-in'
          ? { status: session.status, sessionKey: session.sessionKey, personId: session.personId }
          : session,
      cachedQueries: runtime.queryClient.getQueryCache().getAll().length,
      // The session key of every cached answer (`['xr', sessionKey, …]`), each once: a sign-out
      // must leave none of the previous person's (WP-0.13).
      cachedSessionKeys: [
        ...new Set(
          runtime.queryClient
            .getQueryCache()
            .getAll()
            .map((query) => String(query.queryKey[1])),
        ),
      ],
    };
  },
});

let installed = false;

/**
 * The page handle, installed as the boot starts so a test can tell a failed boot from a build
 * without the bridge. Read-only and not replaceable by page scripts.
 */
function installHandle(): void {
  if (installed) return;
  installed = true;
  Object.defineProperty(window, TEST_HOOKS_GLOBAL, {
    value: handle,
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

export const testHooks: TestHooks = {
  async prepare(): Promise<PreparedBoot | null> {
    installHandle();
    const descriptor = readDescriptor();
    if (!descriptor) return null;
    return {
      fixture: descriptor.fixture,
      world: await fixtureWorld(descriptor.fixture),
      personId: descriptor.personId,
    };
  },
  attach({ composed, runtime, prepared }) {
    // One world per tab: a second attach would be a second world.
    if (booted) throw new TestHookError('The bridge is already attached to this tab’s world.');
    if (prepared?.personId) beginSession(sampleOf(composed), prepared.personId);
    attached += 1;
    booted = {
      sample: sampleOf(composed),
      runtime,
      fixture: prepared?.fixture ?? null,
      instance: newInstanceId(),
    };
  },
  settle(outcome) {
    if (outcome.ok) {
      resolveBoot();
      return;
    }
    const reason = outcome.error instanceof Error ? outcome.error.message : String(outcome.error);
    rejectBoot(new TestHookError(`The test-hook boot failed: ${reason}`));
  },
};
