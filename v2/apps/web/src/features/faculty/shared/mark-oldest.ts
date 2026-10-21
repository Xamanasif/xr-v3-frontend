'use client';

import { markingQueueAddress, markSubmissionAddress } from '@/nav/faculty';
import { useMarkingQueue } from '@/queries/faculty-assessment-work';

/** Where "Mark" goes, and whether the queue has answered yet. */
export interface OldestWaiting {
  /** FA-19 for the oldest submission waiting; else FA-18 (for that assessment, when one is named). */
  readonly address: string;
  /** The oldest waiting attempt (an address key only — never shown). */
  readonly attemptId: string | null;
  /** The queue has not answered yet (the address is FA-18's until it does). */
  readonly pending: boolean;
}

/**
 * The FA-01 / FA-03 / FA-05 / FA-08 "Mark" action (the export's `Mark now` / `Mark` → FA-19 of the
 * oldest submission waiting, WHAT-CHANGED: "Mark opens the oldest submission"): the existing
 * MarkingService `listQueue` read (oldest first), for one assessment or for every one of the
 * Faculty member's (the same read the rail's Marking count makes, so no second request). Until it
 * answers, when it fails, or when nothing waits, the action opens Marking (FA-18) — for that
 * assessment when one is named — exactly as FA-08's "Mark next" already does.
 *
 * `waiting` is the count the page already holds (0 reads nothing).
 */
export function useOldestWaiting(assessmentId: string | null, waiting: number): OldestWaiting {
  const queue = useMarkingQueue(assessmentId, 'waiting', waiting > 0);
  const answer = queue.data;
  const attemptId = answer?.ok ? (answer.value[0]?.attempt.id ?? null) : null;
  return {
    address:
      attemptId === null
        ? markingQueueAddress(assessmentId ? { assessmentId } : {})
        : markSubmissionAddress(attemptId),
    attemptId,
    pending: waiting > 0 && answer === undefined,
  };
}
