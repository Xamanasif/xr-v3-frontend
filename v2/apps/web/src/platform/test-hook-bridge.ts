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
 */
import { PORT_KEYS, type PortKey } from '@xr/contracts/draft';
import type { RecordRef } from '@xr/domain';
import {
  asPersonId,
  beginSession,
  FIXTURE_NAMES,
  type FixtureName,
  fixtureWorld,
  worldOf,
} from '@xr/sample-platform/testing';

import type { PlatformRuntime } from './runtime';
import type { PreparedBoot, TestHooks } from './test-hook-contract';

/** Its presence in a bundle marks a test-hook build; `pnpm verify` requires it absent elsewhere. */
export const TEST_HOOK_BRIDGE_MARKER = 'xr-web-test-hook-bridge';
/** Marks the same-tab session switch (WP-0.14); `pnpm verify` requires it in no product bundle. */
export const TEST_SESSION_SWITCH_MARKER = 'xr-web-test-session-switch';
/** Kept equal to `e2e/support/test-seam.ts` (checked by the bridge's unit test). */
export const BOOT_DESCRIPTOR_GLOBAL = '__XR_TEST_BOOT__';
export const TEST_HOOKS_GLOBAL = '__XR_TEST_HOOKS__';

type Sample = Parameters<typeof worldOf>[0];

const PORT_KEY_SET: ReadonlySet<string> = new Set(Object.values(PORT_KEYS));
const PERSON_ID = /^\S+$/;

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
    if (prepared?.personId) beginSession(composed.sample, prepared.personId);
    attached += 1;
    booted = {
      sample: composed.sample,
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
