/**
 * The CI-only test-hook bridge (ADR-0007 §2–3; Appendix F §7.2), run through the real runtime
 * the way a test-hook build compiles it: `@/platform/test-hooks` is pointed at the bridge here,
 * as next.config.ts's alias does. One tab per file: the bridge attaches once per page.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BOOT_DESCRIPTOR_GLOBAL as E2E_BOOT_GLOBAL,
  TEST_HOOKS_GLOBAL as E2E_HOOKS_GLOBAL,
} from '../../e2e/support/test-seam';
import { xrQueryKey } from '@/queries/keys';

import {
  BOOT_DESCRIPTOR_GLOBAL,
  TEST_HOOK_BRIDGE_MARKER,
  TEST_HOOKS_GLOBAL,
  testHooks,
} from './test-hook-bridge';

vi.mock('@/platform/test-hooks', async () => await import('./test-hook-bridge'));

const { bootPlatform } = await import('./runtime');

interface Hooks {
  readonly marker: string;
  actAs(personId: unknown, command: unknown): Promise<unknown>;
  inspect(): Promise<{
    fixture: string | null;
    seedId: string;
    worldVersion: number;
    attached: number;
    persistence: string;
    session: { status: string; sessionKey?: string; personId?: string };
  }>;
}
const hooks = () => Reflect.get(window, TEST_HOOKS_GLOBAL) as Hooks | undefined;

afterEach(() => {
  Reflect.deleteProperty(window, BOOT_DESCRIPTOR_GLOBAL);
});

describe('the seam names', () => {
  it('are the ones the Playwright helpers install and read', () => {
    expect(BOOT_DESCRIPTOR_GLOBAL).toBe(E2E_BOOT_GLOBAL);
    expect(TEST_HOOKS_GLOBAL).toBe(E2E_HOOKS_GLOBAL);
  });
});

describe('the boot descriptor', () => {
  it('without one, the tab starts on the seed, signed out', async () => {
    expect(await testHooks.prepare()).toBeNull();
  });

  it.each([
    [{ fixture: 'no-such-world', session: null }, /names no fixture world/],
    [{ fixture: 42, session: null }, /names no fixture world/],
    [{ fixture: 'spine-start', session: { personId: ' ' } }, /null or \{ personId \}/],
    [{ fixture: 'spine-start', session: { id: 'sa-arjun-mehta' } }, /null or \{ personId \}/],
    [{ fixture: 'spine-start' }, /null or \{ personId \}/],
  ])('refuses %j', async (descriptor, message) => {
    Reflect.set(window, BOOT_DESCRIPTOR_GLOBAL, descriptor);
    await expect(testHooks.prepare()).rejects.toThrow(message);
  });

  it('names a fixture world and the person signed in', async () => {
    Reflect.set(window, BOOT_DESCRIPTOR_GLOBAL, { fixture: 'spine-start', session: null });
    const prepared = await testHooks.prepare();
    expect(prepared?.fixture).toBe('spine-start');
    expect(prepared?.personId).toBeNull();
    expect(prepared?.world.seedId).toBe('spine-start');
  });
});

describe('a test-hook tab', () => {
  it('boots the fixture world signed in, and actAs runs against that same world', async () => {
    Reflect.set(
      window,
      BOOT_DESCRIPTOR_GLOBAL,
      Object.freeze({
        fixture: 'after-flow-a',
        session: Object.freeze({ personId: 'sa-arjun-mehta' }),
      }),
    );
    // The handle is installed when the boot starts (the descriptor checks above started one).
    expect(hooks()?.marker).toBe(TEST_HOOK_BRIDGE_MARKER);
    const runtime = await bootPlatform();

    // The tab: the fixture world, signed in as the descriptor's person, no sign-in form.
    const handle = hooks();
    if (!handle) throw new Error('no hooks');
    expect(handle.marker).toBe(TEST_HOOK_BRIDGE_MARKER);
    const before = await handle.inspect();
    expect(before).toMatchObject({
      fixture: 'after-flow-a',
      seedId: 'after-flow-a',
      attached: 1,
      persistence: 'memory-per-tab',
      session: { status: 'signed-in', personId: 'sa-arjun-mehta' },
    });
    const snapshot = runtime.session.getSnapshot();
    expect(snapshot.status === 'signed-in' && snapshot.personId).toBe('sa-arjun-mehta');

    // Flow A created REQ-0042: it is in this world (the spine-start seed has none).
    const request = (await handle.actAs('sa-arjun-mehta', {
      port: 'accessRequests',
      method: 'getRequestForDecision',
      input: 'REQ-0042',
    })) as { ok: boolean };
    expect(request.ok).toBe(true);

    // A command as another actor changes the tab's world and invalidates the tab's queries.
    const key = [
      ...xrQueryKey(snapshot.status === 'signed-in' ? snapshot.sessionKey : '', 'INST', 'probe'),
    ];
    runtime.queryClient
      .getQueryCache()
      .build(runtime.queryClient, { queryKey: key, meta: { deps: ['INST'] } });
    runtime.queryClient.setQueryData(key, 'cached');
    const institution = (await handle.actAs('sa-arjun-mehta', {
      port: 'institutions',
      method: 'getInstitution',
      input: 'deccan',
    })) as { ok: true; value: { institution: { id: string; rev: number } } };
    const paused = (await handle.actAs('sa-arjun-mehta', {
      port: 'institutions',
      method: 'pauseInstitution',
      input: {
        institutionId: institution.value.institution.id,
        reason: 'Checking the student list.',
        expectedRev: institution.value.institution.rev,
      },
    })) as { ok: boolean };
    expect(paused.ok).toBe(true);
    expect((await handle.inspect()).worldVersion).toBe(before.worldVersion + 1);
    expect(runtime.queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    // The tab's own session is untouched by actAs.
    expect((await handle.inspect()).session).toEqual(before.session);
    const seen = await runtime.ports.institutions.getInstitution('deccan' as never);
    expect(seen.ok && seen.value.institution.pause).not.toBeNull();

    // Refusals stay values; malformed calls fail loudly.
    expect(
      await handle.actAs('per-anil-shetty', {
        port: 'institutions',
        method: 'restoreInstitution',
        input: { institutionId: 'deccan', reason: 'x', expectedRev: 99 },
      }),
    ).toMatchObject({ ok: false, error: { kind: 'not-permitted' } });
    await expect(
      handle.actAs('per-nobody', { port: 'session', method: 'getSession' }),
    ).rejects.toThrow(/No sample person/);
    await expect(handle.actAs(' ', { port: 'session', method: 'getSession' })).rejects.toThrow(
      /non-empty id/,
    );
    await expect(handle.actAs('sa-arjun-mehta', { port: 'admin', method: 'x' })).rejects.toThrow(
      /not a product port/,
    );
    await expect(
      handle.actAs('sa-arjun-mehta', { port: 'session', method: 'switchTo' }),
    ).rejects.toThrow(/not a method of the session port/);

    // One world per tab: the handle cannot be replaced and a second attach is refused.
    expect(() => Reflect.defineProperty(window, TEST_HOOKS_GLOBAL, { value: {} })).not.toThrow();
    expect(hooks()).toBe(handle);
    expect(await bootPlatform()).toBe(runtime);
    expect((await handle.inspect()).attached).toBe(1);
  });
});
