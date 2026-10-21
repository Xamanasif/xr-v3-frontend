/**
 * The shared Faculty hooks on the sample world: "Mark" opens the oldest submission waiting
 * (`useOldestWaiting`, MarkingService `listQueue` — the world just after Flow D's D2, Rahul's
 * answer waiting for marking), and today is the session's clock (`useFacultyToday`).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { buildWorld, fixtureWorld, WALK_STEPS } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { weekdayDate } from '@/copy/dates';
import { platformWrapper } from '@/test-support/platform';
import { PERSON_OF_ROLE, worldPlatform } from '@/test-support/workspace';

import { useOldestWaiting } from './mark-oldest';
import { useFacultyToday } from './use-today';

/** After Flow D's D2 (through `D2-submit`): Rahul has submitted, his written answer waits for marking. */
async function rahulWaiting() {
  const from = WALK_STEPS.findIndex((step) => step.id === 'D1');
  const to = WALK_STEPS.findIndex((step) => step.id === 'D3-objective');
  const world = await buildWorld(await fixtureWorld('after-flow-c'), WALK_STEPS.slice(from, to), {
    seedId: 'fa-shared-d2',
    at: WALK_STEPS[to]!.at,
  });
  const { runtime } = await worldPlatform(PERSON_OF_ROLE.faculty, world);
  const queue = await runtime.ports.marking.listQueue({ state: 'waiting' });
  if (!queue.ok) throw new Error(JSON.stringify(queue.error));
  const oldest = queue.value[0]!;
  return {
    runtime,
    attemptId: oldest.attempt.id as string,
    assessmentId: oldest.attempt.assessmentId as string,
  };
}

describe('useOldestWaiting: “Mark” opens the oldest submission waiting', () => {
  it('for one assessment: Marking for it until the queue answers, then the oldest answer (FA-19)', async () => {
    const { runtime, attemptId, assessmentId } = await rahulWaiting();
    const { result } = renderHook(() => useOldestWaiting(assessmentId, 1), {
      wrapper: platformWrapper(runtime),
    });
    expect(result.current.address).toBe(
      `/faculty/marking?assessmentId=${encodeURIComponent(assessmentId)}`,
    );
    await waitFor(() => expect(result.current.pending).toBe(false));
    expect(result.current.attemptId).toBe(attemptId);
    expect(result.current.address).toBe(`/faculty/marking/${encodeURIComponent(attemptId)}`);
  });

  it('across every assessment (FA-01): the same oldest answer', async () => {
    const { runtime, attemptId } = await rahulWaiting();
    const { result } = renderHook(() => useOldestWaiting(null, 1), {
      wrapper: platformWrapper(runtime),
    });
    await waitFor(() => expect(result.current.attemptId).toBe(attemptId));
    expect(result.current.address).toBe(`/faculty/marking/${encodeURIComponent(attemptId)}`);
  });

  it('with nothing waiting it reads nothing and opens Marking', async () => {
    const { runtime, assessmentId } = await rahulWaiting();
    const { result } = renderHook(() => useOldestWaiting(assessmentId, 0), {
      wrapper: platformWrapper(runtime),
    });
    expect(result.current).toEqual({
      address: `/faculty/marking?assessmentId=${encodeURIComponent(assessmentId)}`,
      attemptId: null,
      pending: false,
    });
  });
});

describe('useFacultyToday', () => {
  it('is the session’s sign-in instant, with the date line and the day', async () => {
    const { runtime } = await rahulWaiting();
    const session = runtime.session.getSnapshot();
    if (session.status !== 'signed-in') throw new Error('not signed in');
    const { result } = renderHook(() => useFacultyToday(), { wrapper: platformWrapper(runtime) });
    expect(result.current?.now).toBe(session.signedInAt);
    expect(result.current?.line).toBe(weekdayDate(session.signedInAt));
    expect(result.current?.day).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
  });
});
