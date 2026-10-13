/**
 * The CI-only same-tab session switch (WP-0.14 §7, owner-authorised): one tab, one world, one
 * QueryClient — the identity changes the way a sign-out and a sign-in would, and nothing else
 * does. Its own file: the bridge attaches once per page.
 */
import { describe, expect, it, vi } from 'vitest';

import { fixtureWorld } from '@xr/sample-platform/testing';

import { xrQueryKey } from '@/queries/keys';

import {
  BOOT_DESCRIPTOR_GLOBAL,
  TEST_HOOKS_GLOBAL,
  TEST_SESSION_SWITCH_MARKER,
} from './test-hook-bridge';

vi.mock('@/platform/test-hooks', async () => await import('./test-hook-bridge'));

const { bootPlatform } = await import('./runtime');

interface Switched {
  readonly marker: string;
  readonly instance: string;
  readonly previousSessionKey: string | null;
  readonly sessionKey: string | null;
  readonly personId: string | null;
  readonly worldVersion: number;
}

interface Hooks {
  switchSession(personId: unknown): Promise<Switched>;
  actAs(personId: unknown, command: unknown): Promise<unknown>;
  inspect(): Promise<{
    instance: string;
    seedId: string;
    worldVersion: number;
    attached: number;
    session: { status: string; sessionKey?: string; personId?: string };
    cachedSessionKeys: readonly string[];
  }>;
}

describe('switchSession — the same world, a new session, an empty cache', () => {
  it('switches Student → Super Admin → Faculty → Student in one tab: same world instance, new keys, previous answers gone, roles from the records', async () => {
    Reflect.set(
      window,
      BOOT_DESCRIPTOR_GLOBAL,
      Object.freeze({ fixture: 'after-flow-b', session: Object.freeze({ personId: 'per-0002' }) }),
    );
    const runtime = await bootPlatform();
    const hooks = Reflect.get(window, TEST_HOOKS_GLOBAL) as Hooks;
    const start = await hooks.inspect();
    expect(start.session).toMatchObject({ status: 'signed-in', personId: 'per-0002' });

    // Rahul's cached answer, as a screen would hold it.
    const rahulKey = start.session.sessionKey!;
    const key = [...xrQueryKey(rahulKey, 'SACC', 'home')];
    runtime.queryClient
      .getQueryCache()
      .build(runtime.queryClient, { queryKey: key, meta: { deps: ['SACC'] } });
    runtime.queryClient.setQueryData(key, 'Rahul’s home');
    expect((await hooks.inspect()).cachedSessionKeys).toEqual([rahulKey]);

    // A permitted change by Rahul, in the shared world.
    const report = (await hooks.actAs('per-0002', {
      port: 'operations',
      method: 'reportProblem',
      input: {
        whatHappened: 'The VR headset lost tracking.',
        where: null,
        screenshotFileName: null,
      },
    })) as { ok: true; value: { id: string } };
    expect(report.ok).toBe(true);
    const afterReport = await hooks.inspect();

    const toAdmin = await hooks.switchSession('sa-arjun-mehta');
    expect(toAdmin).toMatchObject({
      marker: TEST_SESSION_SWITCH_MARKER,
      instance: start.instance,
      previousSessionKey: rahulKey,
      personId: 'sa-arjun-mehta',
      worldVersion: afterReport.worldVersion,
    });
    expect(toAdmin.sessionKey).toMatch(/^person:sa-arjun-mehta#/);
    const asAdmin = await hooks.inspect();
    expect(asAdmin).toMatchObject({
      instance: start.instance,
      seedId: 'after-flow-b',
      attached: 1,
    });
    expect(asAdmin.cachedSessionKeys, 'the previous person’s answers are gone').not.toContain(
      rahulKey,
    );
    expect(runtime.queryClient.getQueryData(key)).toBeUndefined();
    // The role comes from the records: the tab's own ports now act as the Super Admin.
    const session = await runtime.ports.session.getSession();
    expect(session.ok && session.value?.session.role).toBe('super_admin');
    expect((await runtime.ports.session.checkWorkspace('admin')).ok).toBe(true);
    expect((await runtime.ports.session.checkWorkspace('student')).ok).toBe(false);
    // The same record change, visible where authorised: the Super Admin reads Rahul's report (SA-21).
    const seen = await runtime.ports.operations.getMyReport(report.value.id as never);
    expect(seen.ok && seen.value.state).toBe('open');

    // …and refused where not: a Faculty member of the same institution.
    const toFaculty = await hooks.switchSession('per-0014');
    expect([toFaculty.instance, toFaculty.previousSessionKey]).toEqual([
      start.instance,
      toAdmin.sessionKey,
    ]);
    const refused = await runtime.ports.operations.getMyReport(report.value.id as never);
    expect(refused.ok ? null : refused.error.kind).toBe('not-permitted');
    expect((await runtime.ports.session.checkWorkspace('faculty')).ok).toBe(true);

    // Back to Rahul: a NEW session (another nonce), the same world, his report still there.
    const back = await hooks.switchSession('per-0002');
    expect(back.instance).toBe(start.instance);
    expect(back.sessionKey).not.toBe(rahulKey);
    expect(back.previousSessionKey).toBe(toFaculty.sessionKey);
    const mine = await runtime.ports.operations.listMyReports();
    expect(mine.ok && mine.value.map((item) => item.id)).toContain(report.value.id);
    expect((await hooks.inspect()).worldVersion).toBe(afterReport.worldVersion);

    // The switch is the product's sign-in, so its policy applies: an inactive Faculty member
    // (Prof. Ravi Shankar, B2-06; SES-09) is refused, and the session stays as it was.
    const ravi = Object.values((await fixtureWorld('after-flow-b')).records.people).find(
      (person) => person.fullName === 'Prof. Ravi Shankar',
    )!;
    const before = await hooks.inspect();
    await expect(hooks.switchSession(ravi.id)).rejects.toThrow(/SES-09/);
    expect((await hooks.inspect()).session).toEqual(before.session);

    // Refusals leave the session as it was.
    await expect(hooks.switchSession('per-nobody')).rejects.toThrow(/No sample person/);
    expect((await hooks.inspect()).session).toEqual(before.session);
    await expect(hooks.switchSession(' ')).rejects.toThrow(/non-empty id/);
    await expect(hooks.switchSession({ personId: 'sa-arjun-mehta' })).rejects.toThrow(
      /non-empty id/,
    );
    expect((await hooks.inspect()).session).toEqual(before.session);
  });
});
