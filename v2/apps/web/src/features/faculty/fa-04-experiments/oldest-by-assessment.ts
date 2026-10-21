'use client';

import { markingQueueAddress, markSubmissionAddress } from '@/nav/faculty';
import { useMarkingQueue } from '@/queries/faculty-assessment-work';

/**
 * FA-03's "Mark <n> written answers" per experiment → FA-19 of that assessment's oldest waiting
 * submission (WHAT-CHANGED: "Mark opens the oldest submission"), from ONE marking-queue read for
 * every assessment of the page (`MarkingService.listQueue`, oldest first — the read the rail's
 * Marking count and `useOldestWaiting(null, …)` make), never one read per experiment. Until it
 * answers, when it fails, or when none of that assessment waits, the action opens Marking (FA-18)
 * for that assessment, as `useOldestWaiting` does.
 */
export function useOldestByAssessment(waiting: number): (assessmentId: string) => string {
  const queue = useMarkingQueue(null, 'waiting', waiting > 0);
  const rows = queue.data?.ok ? queue.data.value : [];
  return (assessmentId) => {
    const oldest = rows.find((row) => row.attempt.assessmentId === assessmentId);
    return oldest
      ? markSubmissionAddress(oldest.attempt.id)
      : markingQueueAddress({ assessmentId });
  };
}
