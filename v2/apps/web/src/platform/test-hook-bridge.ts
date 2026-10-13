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
 * - **`inspect()`**: the world's identity, the tab's session and the session keys its cached
 *   answers belong to, for assertions.
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
  inspect: async () => {
    const { sample, runtime, fixture } = await whenBooted();
    const world = worldOf(sample);
    const session = runtime.session.getSnapshot();
    return {
      marker: TEST_HOOK_BRIDGE_MARKER,
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
    booted = { sample: composed.sample, runtime, fixture: prepared?.fixture ?? null };
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
