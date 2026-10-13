/**
 * `useCommand` over the real sample adapter (Appendix F §4.5–§4.6; ADR-0008): receipts
 * invalidate exactly their changed kinds, refusals are values, only `unavailable` throws, a
 * command is sent once and keeps its id, stale revisions are refused by the adapter, nothing is
 * written to the cache optimistically and no caller-supplied permission is trusted.
 */
import type { QueryClient } from '@tanstack/react-query';
import type { RecordKind } from '@xr/domain';
import { faults } from '@xr/sample-platform/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { platformWrapper, SAMPLE_PEOPLE, signInAs, testPlatform } from '@/test-support/platform';

import { xrQueryKey } from './keys';
import { useCurrentSession } from './session';
import { ServiceUnavailableError } from './unavailable';
import { useCommand } from './use-command';

afterEach(() => vi.restoreAllMocks());

const pause = (ports: PlatformRuntime['ports']) => ports.institutions.pauseInstitution;

async function deccan(runtime: PlatformRuntime) {
  const detail = await runtime.ports.institutions.getInstitution('deccan' as never);
  if (!detail.ok) throw new Error(`getInstitution refused: ${detail.error.kind}`);
  return detail.value.institution;
}

/** Inactive cached reads of other families, as other screens of the tab would leave them. */
function cacheOtherReads(client: QueryClient, sessionKey: string) {
  const reads: [string, readonly RecordKind[]][] = [
    ['SUB', ['SUB']],
    ['ATT', ['ATT', 'ASMT']],
    ['INST', ['INST']],
    ['ACC', ['ACC', 'SACC']],
  ];
  for (const [family, deps] of reads) {
    const key = [...xrQueryKey(sessionKey, family as RecordKind, 'probe')];
    client.getQueryCache().build(client, { queryKey: key, meta: { deps } });
    client.setQueryData(key, { cached: family });
  }
}

async function adminPlatform() {
  const platform = await testPlatform();
  await signInAs(platform.runtime, SAMPLE_PEOPLE.arjun.email);
  const snapshot = platform.runtime.session.getSnapshot();
  if (snapshot.status !== 'signed-in') throw new Error('not signed in');
  return { ...platform, sessionKey: snapshot.sessionKey };
}

describe('useCommand', () => {
  it('a success receipt invalidates exactly the queries depending on its changed kinds', async () => {
    const { runtime, sample, sessionKey } = await adminPlatform();
    const { result } = renderHook(
      () => ({ command: useCommand(pause), session: useCurrentSession() }),
      { wrapper: platformWrapper(runtime) },
    );
    await waitFor(() => expect(result.current.session.isSuccess).toBe(true));
    cacheOtherReads(runtime.queryClient, sessionKey);
    const reads = vi.spyOn(runtime.ports.session, 'getSession');
    const invalidate = vi.spyOn(runtime.queryClient, 'invalidateQueries');
    const setQueryData = vi.spyOn(runtime.queryClient, 'setQueryData');
    const institution = await deccan(runtime);
    const version = sample.worldVersion();

    let answer: Awaited<ReturnType<ReturnType<typeof pause>>> | undefined;
    let readsWhenSettled = -1;
    await act(async () => {
      answer = await result.current.command.run({
        institutionId: institution.id,
        reason: 'The institution asked us to pause access while it checks its student list.',
        expectedRev: institution.rev,
      });
      readsWhenSettled = reads.mock.calls.length;
    });

    if (!answer?.ok) throw new Error('pause refused');
    const kinds = new Set(answer.changed.map((ref) => ref.kind));
    expect(kinds.has('INST')).toBe(true);
    expect(sample.worldVersion()).toBe(version + 1);
    expect(invalidate).toHaveBeenCalledTimes(1);
    const states = runtime.queryClient
      .getQueryCache()
      .getAll()
      .map((query) => ({
        deps: query.meta?.deps ?? [],
        invalidated: query.state.isInvalidated,
      }));
    for (const state of states) {
      // Active queries refetch at once, so "invalidated" is visible on the inactive ones.
      if (state.deps.length === 3) continue;
      expect(state.invalidated).toBe(state.deps.some((kind) => kinds.has(kind)));
    }
    expect(states.filter((state) => state.invalidated).length).toBeGreaterThan(0);
    expect(states.some((state) => !state.invalidated && state.deps.includes('SUB'))).toBe(true);
    // The active session read depends on INST: it was refetched once, before `run` resolved.
    expect(readsWhenSettled).toBe(1);
    // The hook's state follows one notification tick after `run` resolves (TanStack batching).
    await waitFor(() => expect(result.current.command.answer).toBe(answer));
    expect(result.current.command.busy).toBe(false);
    // No optimistic write: the cache was never written by hand.
    expect(setQueryData).not.toHaveBeenCalled();
  });

  it('refusals are values: nothing is thrown, written or invalidated', async () => {
    const { runtime, sample } = await adminPlatform();
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const invalidate = vi.spyOn(runtime.queryClient, 'invalidateQueries');
    const institution = await deccan(runtime);
    const version = sample.worldVersion();

    let blank: unknown;
    let stale: unknown;
    await act(async () => {
      blank = await result.current.run({
        institutionId: institution.id,
        reason: '  ',
        expectedRev: institution.rev,
      });
      stale = await result.current.run({
        institutionId: institution.id,
        reason: 'A reason.',
        expectedRev: institution.rev + 1,
      });
    });

    expect(blank).toMatchObject({ ok: false, error: { kind: 'validation-failed' } });
    expect(stale).toEqual({
      ok: false,
      error: { kind: 'stale-version', currentRev: institution.rev },
    });
    await waitFor(() => expect(result.current.answer).toEqual(stale));
    expect(result.current.unavailable).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(sample.worldVersion()).toBe(version);
  });

  it('never trusts a permission the caller supplies: the adapter resolves the actor and refuses', async () => {
    const { runtime, sample } = await testPlatform();
    await signInAs(runtime, SAMPLE_PEOPLE.anil.email);
    const institution = await (async () => {
      const admin = await testPlatform();
      await signInAs(admin.runtime, SAMPLE_PEOPLE.arjun.email);
      return deccan(admin.runtime);
    })();
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const version = sample.worldVersion();
    let answer: unknown;
    await act(async () => {
      answer = await result.current.run({
        institutionId: institution.id,
        reason: 'A vendor claims it may.',
        expectedRev: institution.rev,
        // Not part of the contract; ignored by the port, which decides from the records.
        ...({ role: 'super_admin', allowed: true, canPause: true } as object),
      } as never);
    });
    expect(answer).toMatchObject({ ok: false, error: { kind: 'not-permitted' } });
    expect(sample.worldVersion()).toBe(version);
  });

  it('throws only for unavailable, and keeps nothing', async () => {
    const { runtime, sample } = await adminPlatform();
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const invalidate = vi.spyOn(runtime.queryClient, 'invalidateQueries');
    const institution = await deccan(runtime);
    const version = sample.worldVersion();
    faults(sample).failNext('InstitutionService.pauseInstitution');

    let thrown: unknown;
    await act(async () => {
      await result.current
        .run({ institutionId: institution.id, reason: 'A reason.', expectedRev: institution.rev })
        .catch((error: unknown) => {
          thrown = error;
        });
    });

    expect(thrown).toBeInstanceOf(ServiceUnavailableError);
    await waitFor(() => expect(result.current.unavailable).toBe(true));
    expect(result.current.busy).toBe(false);
    expect(invalidate).not.toHaveBeenCalled();
    expect(sample.worldVersion()).toBe(version);
  });

  it('is sent once while busy, under one client-minted command id', async () => {
    const { runtime, sample } = await adminPlatform();
    const minted = vi.spyOn(runtime, 'newCommandId');
    const bound = vi.spyOn(runtime, 'withCommandId');
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const institution = await deccan(runtime);
    const version = sample.worldVersion();
    const input = {
      institutionId: institution.id,
      reason: 'A reason.',
      expectedRev: institution.rev,
    };

    let first: Promise<unknown> | undefined;
    let second: Promise<unknown> | undefined;
    await act(async () => {
      first = result.current.run(input);
      second = result.current.run(input);
      await Promise.all([first, second]);
    });

    expect(second).toBe(first);
    expect(minted).toHaveBeenCalledTimes(1);
    expect(bound).toHaveBeenCalledTimes(1);
    expect(bound).toHaveBeenCalledWith(minted.mock.results[0]?.value);
    expect(sample.worldVersion()).toBe(version + 1);
  });

  it('a different call while busy is sent as its own command, not answered with the first', async () => {
    const { runtime, sample } = await adminPlatform();
    const minted = vi.spyOn(runtime, 'newCommandId');
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const institution = await deccan(runtime);
    const version = sample.worldVersion();

    let answers: unknown[] = [];
    await act(async () => {
      answers = await Promise.all([
        result.current.run({
          institutionId: institution.id,
          reason: 'First reason.',
          expectedRev: institution.rev,
        }),
        result.current.run({
          institutionId: institution.id,
          reason: 'Second reason.',
          expectedRev: institution.rev,
        }),
        // The same explicit command id twice while busy is one command.
        result.current.run(
          { institutionId: institution.id, reason: 'Third.', expectedRev: institution.rev },
          { commandId: 'cmd-explicit-1' },
        ),
      ]);
    });

    expect(minted).toHaveBeenCalledTimes(2);
    expect(answers[0]).toMatchObject({ ok: true });
    // Each was sent after the first committed, so the adapter refused each on its own.
    for (const answer of answers.slice(1)) {
      expect(answer).toMatchObject({ ok: false });
      expect(['invalid-state', 'stale-version']).toContain(
        (answer as { error: { kind: string } }).error.kind,
      );
    }
    expect(sample.worldVersion()).toBe(version + 1);
  });

  it('after a sign-out the hook holds no state of the previous person, and shares no run with the next', async () => {
    const { runtime } = await adminPlatform();
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const institution = await deccan(runtime);
    const input = {
      institutionId: institution.id,
      reason: 'A reason.',
      expectedRev: institution.rev,
    };
    const bound = vi.spyOn(runtime, 'withCommandId');
    let sent: Promise<unknown> | undefined;
    let afterSignOut: Promise<unknown> | undefined;
    await act(async () => {
      sent = result.current.run(input);
      // Sign out once Arjun's command has reached the port (it runs first, in his session).
      await vi.waitFor(() => expect(bound).toHaveBeenCalledTimes(1));
      await runtime.ports.session.signOut();
    });
    await act(async () => {
      afterSignOut = result.current.run(input);
      await Promise.all([sent, afterSignOut]);
    });

    expect(afterSignOut).not.toBe(sent);
    expect(await sent).toMatchObject({ ok: true });
    expect(await afterSignOut).toMatchObject({ ok: false, error: { kind: 'not-signed-in' } });
    // The hook shows the visitor's own run, never Arjun's receipt.
    await waitFor(() =>
      expect(result.current.answer).toMatchObject({ ok: false, error: { kind: 'not-signed-in' } }),
    );

    await act(async () => {
      await signInAs(runtime, SAMPLE_PEOPLE.arjun.email);
    });
    await waitFor(() => expect(result.current.answer).toBeUndefined());
    expect(result.current.busy).toBe(false);
    expect(result.current.unavailable).toBe(false);
  });

  it('a re-sent command id answers its first receipt and applies nothing again', async () => {
    const { runtime, sample } = await adminPlatform();
    const { result } = renderHook(() => useCommand(pause), { wrapper: platformWrapper(runtime) });
    const institution = await deccan(runtime);
    const input = {
      institutionId: institution.id,
      reason: 'A reason.',
      expectedRev: institution.rev,
    };
    const commandId = runtime.newCommandId();

    let first: unknown;
    let repeat: unknown;
    await act(async () => {
      first = await result.current.run(input, { commandId });
    });
    const version = sample.worldVersion();
    await act(async () => {
      repeat = await result.current.run(input, { commandId });
    });

    expect(first).toMatchObject({ ok: true });
    expect(repeat).toEqual(first);
    expect(sample.worldVersion()).toBe(version);
  });

  it('signing out through a command clears the cache and the session, and settles normally', async () => {
    const { runtime } = await adminPlatform();
    const { result } = renderHook(
      () => ({
        signOut: useCommand((ports) => ports.session.signOut),
        session: useCurrentSession(),
      }),
      { wrapper: platformWrapper(runtime) },
    );
    await waitFor(() => expect(result.current.session.isSuccess).toBe(true));
    const clear = vi.spyOn(runtime.queryClient, 'clear');

    let answer: unknown;
    await act(async () => {
      answer = await result.current.signOut.run();
    });

    expect(answer).toEqual({ ok: true, value: { signedOut: true }, changed: [] });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(runtime.session.getSnapshot()).toEqual({
      status: 'signed-out',
      sessionKey: 'public:bs-test',
    });
    await waitFor(() => expect(result.current.signOut.busy).toBe(false));
    await waitFor(() =>
      expect(result.current.session.data).toEqual({ ok: true, value: null, changed: [] }),
    );
  });
});
