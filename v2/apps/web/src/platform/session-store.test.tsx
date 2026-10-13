/**
 * The per-tab session store (Appendix F §4.6; Appendix D §2.3–§2.4; ADR-0003, ADR-0004 A):
 * subscribers see every identity change, sign-out clears the cache, the next person gets a
 * different cache namespace, the world is kept across people, and nothing touches storage.
 */
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCurrentSession, useSession } from '@/queries/session';
import {
  platformWrapper,
  SAMPLE_PASSWORD,
  SAMPLE_PEOPLE,
  signInAs,
  testPlatform,
} from '@/test-support/platform';

import { createSessionStore, UNKNOWN_SESSION } from './session-store';

afterEach(() => vi.restoreAllMocks());

describe('the session store', () => {
  it('starts unknown, adopts the signed-out session on boot, and its server snapshot stays unknown', async () => {
    const { runtime } = await testPlatform();
    expect(runtime.session.getServerSnapshot()).toBe(UNKNOWN_SESSION);
    expect(runtime.session.getSnapshot()).toEqual({
      status: 'signed-out',
      sessionKey: 'public:bs-test',
    });
  });

  it('a sign-in publishes person:<id>#<nonce> and the person id, nonce and sign-in time only', async () => {
    const { runtime } = await testPlatform();
    const session = await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const snapshot = runtime.session.getSnapshot();
    if (snapshot.status !== 'signed-in') throw new Error('not signed in');
    expect(snapshot.personId).toBe(SAMPLE_PEOPLE.arjun.personId);
    expect(snapshot.sessionKey).toBe(`person:${SAMPLE_PEOPLE.arjun.personId}#${snapshot.nonce}`);
    expect(snapshot.nonce).toMatch(/^ses-\d{6}$/);
    expect(snapshot.signedInAt).toBe(session.signedInAt);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('notifies every subscriber once per identity change, with the new snapshot already in place', async () => {
    const { runtime } = await testPlatform();
    const seen: string[] = [];
    const unsubscribe = runtime.session.subscribe(() => {
      const snapshot = runtime.session.getSnapshot();
      seen.push(snapshot.status === 'signed-in' ? snapshot.personId : snapshot.status);
    });
    const other = vi.fn();
    const unsubscribeOther = runtime.session.subscribe(other);

    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    await runtime.ports.session.signOut();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    // A refused sign-in and a repeated read change nothing.
    await runtime.ports.session.signIn({
      method: 'email',
      email: 'nobody@example.org',
      password: SAMPLE_PASSWORD,
    });
    await runtime.session.refresh();

    expect(seen).toEqual(['sa-arjun-mehta', 'signed-out', 'per-anil-shetty']);
    expect(other).toHaveBeenCalledTimes(3);
    unsubscribe();
    unsubscribeOther();
    await runtime.ports.session.signOut();
    expect(seen).toHaveLength(3);
  });

  it('sign-out clears every cached query and command state; the world is untouched', async () => {
    const { runtime, sample } = await testPlatform();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const { result } = renderHook(() => useCurrentSession(), { wrapper: platformWrapper(runtime) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    runtime.queryClient.getMutationCache().build(runtime.queryClient, {});
    expect(runtime.queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);
    const version = sample.worldVersion();
    const clear = vi.spyOn(runtime.queryClient, 'clear');

    await act(async () => {
      await runtime.ports.session.signOut();
    });

    expect(clear).toHaveBeenCalledTimes(1);
    expect(
      runtime.queryClient
        .getQueryCache()
        .getAll()
        .filter((query) => String(query.queryKey[1]).startsWith('person:')),
    ).toEqual([]);
    expect(runtime.queryClient.getMutationCache().getAll()).toEqual([]);
    expect(sample.worldVersion()).toBe(version);
  });

  it('the next person — or the same person again — gets a different cache namespace', async () => {
    const { runtime } = await testPlatform();
    const keyOf = () => runtime.session.getSnapshot();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const first = keyOf();
    await runtime.ports.session.signOut();
    const visitor = keyOf();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const again = keyOf();
    await runtime.ports.session.signOut();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    const next = keyOf();
    const keys = [first, visitor, again, next].map((snapshot) =>
      snapshot.status === 'unknown' ? null : snapshot.sessionKey,
    );
    expect(new Set(keys).size).toBe(4);
    expect(keys[1]).toBe('public:bs-test');
  });

  it("user-specific answers never leak: the next person's view is read afresh, under their own key", async () => {
    const { runtime } = await testPlatform();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const { result } = renderHook(() => ({ session: useSession(), current: useCurrentSession() }), {
      wrapper: platformWrapper(runtime),
    });
    await waitFor(() => expect(result.current.current.data?.ok).toBe(true));
    const arjunKey = (result.current.session as { sessionKey: string }).sessionKey;

    await act(async () => {
      await runtime.ports.session.signOut();
      await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    });
    await waitFor(() => {
      const data = result.current.current.data;
      expect(data?.ok && data.value?.session.personId).toBe(SAMPLE_PEOPLE.anil.personId);
    });
    const keys = runtime.queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey[1]);
    expect(keys).not.toContain(arjunKey);
    expect(
      keys.every((key) => key === (result.current.session as { sessionKey: string }).sessionKey),
    ).toBe(true);
  });

  it('signing in as another person in the same tab keeps the same world and its records', async () => {
    const { runtime, sample } = await testPlatform();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    const report = await runtime.ports.operations.reportProblem({
      whatHappened: 'The preview does not load.',
      where: 'Help & support',
      screenshotFileName: null,
    });
    if (!report.ok) throw new Error(`reportProblem refused: ${report.error.kind}`);

    // Another role, same tab: the Super Admin finds and resolves the Vendor's report.
    await runtime.ports.session.signOut();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const resolved = await runtime.ports.operations.resolveReport({
      id: report.value.id,
      note: 'The preview loads again.',
      expectedRev: report.value.rev,
    });
    if (!resolved.ok) throw new Error(`resolveReport refused: ${resolved.error.kind}`);
    const version = sample.worldVersion();

    // Back to the reporter: the Super Admin's decision is in the one world they read.
    await runtime.ports.session.signOut();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    const mine = await runtime.ports.operations.getMyReport(report.value.id);
    if (!mine.ok) throw new Error(`getMyReport refused: ${mine.error.kind}`);
    expect(mine.value.id).toBe(report.value.id);
    expect(mine.value.state).toBe('resolved');
    expect(sample.worldVersion()).toBe(version);
  });

  it('re-renders subscribed components through useSyncExternalStore', async () => {
    const { runtime } = await testPlatform();
    function Who() {
      const session = useSession();
      return <p>{session.status === 'signed-in' ? session.personId : session.status}</p>;
    }
    render(<Who />, { wrapper: platformWrapper(runtime) });
    expect(screen.getByText('signed-out')).toBeInTheDocument();
    await act(async () => {
      await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    });
    expect(screen.getByText('sa-arjun-mehta')).toBeInTheDocument();
    await act(async () => {
      await runtime.ports.session.signOut();
    });
    expect(screen.getByText('signed-out')).toBeInTheDocument();
  });

  it('writes nothing to localStorage, sessionStorage or cookies, and invents no expiry', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookie = document.cookie;
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    try {
      const { runtime } = await testPlatform();
      await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
      await vi.advanceTimersByTimeAsync(1000 * 60 * 60 * 24 * 30);
      expect(runtime.session.getSnapshot().status).toBe('signed-in');
      await runtime.ports.session.signOut();
    } finally {
      vi.useRealTimers();
    }
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe(cookie);
  });

  it('a re-sent sign-in id cannot make the store name a person the adapter no longer has signed in', async () => {
    const { runtime } = await testPlatform();
    const commandId = runtime.newCommandId();
    const input = {
      method: 'email' as const,
      email: SAMPLE_PEOPLE.arjun.email,
      password: SAMPLE_PASSWORD,
    };
    expect((await runtime.withCommandId(commandId).session.signIn(input)).ok).toBe(true);
    await runtime.ports.session.signOut();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    const before = runtime.session.getSnapshot();

    // The adapter answers the first receipt again (Arjun) without changing who is signed in.
    const replay = await runtime.withCommandId(commandId).session.signIn(input);
    expect(replay.ok && replay.value.session.personId).toBe(SAMPLE_PEOPLE.arjun.personId);

    const after = runtime.session.getSnapshot();
    expect(after).toBe(before);
    expect(after.status === 'signed-in' && after.personId).toBe(SAMPLE_PEOPLE.anil.personId);
    const actual = await runtime.ports.session.getSession();
    expect(actual.ok && actual.value?.session.sessionKey).toBe(
      after.status === 'signed-in' ? after.sessionKey : null,
    );
  });

  it('a re-sent sign-out id cannot make the store report a visitor while someone is signed in', async () => {
    const { runtime } = await testPlatform();
    await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    const commandId = runtime.newCommandId();
    expect((await runtime.withCommandId(commandId).session.signOut()).ok).toBe(true);
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);

    expect((await runtime.withCommandId(commandId).session.signOut()).ok).toBe(true);

    const snapshot = runtime.session.getSnapshot();
    expect(snapshot.status === 'signed-in' && snapshot.personId).toBe(SAMPLE_PEOPLE.anil.personId);
  });

  it('refuses a malformed public key and a session key that does not name its person', async () => {
    const { runtime } = await testPlatform();
    expect(() =>
      createSessionStore({
        session: runtime.ports.session,
        queryClient: runtime.queryClient,
        publicSessionKey: 'visitor',
      }),
    ).toThrow(/not a public session key/);

    const fakeRaw = {
      ...runtime.ports.session,
      getSession: async () => ({
        ok: true as const,
        changed: [],
        value: {
          session: {
            sessionKey: 'person:someone-else#ses-1',
            personId: 'sa-arjun-mehta',
          } as never,
          banners: [],
        },
      }),
    };
    const forged = createSessionStore({
      session: fakeRaw,
      queryClient: runtime.queryClient,
      publicSessionKey: 'public:bs-x',
    });
    await expect(forged.refresh()).rejects.toThrow(/does not name sa-arjun-mehta/);
    expect(forged.getSnapshot()).toBe(UNKNOWN_SESSION);
  });
});
