'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { useSession } from '@/queries/session';

/** The decision being made: Approve or Return to vendor; none chosen at first (RV-v1 `choice: null`). */
export type ReviewChoice = 'approve' | 'return';

/**
 * What the reviewer has done on a submission so far (RV-v1 `decOf`: `lo`, `newText`, `ed`,
 * `choice`, `reason`, `refs`): the working set of learning outcomes (LD-3; one set for the
 * Experiment), the outcome being added or edited, the decision chosen and a return’s reason and
 * references. The set travels with the decision (OD-B6-04).
 */
export interface ReviewDraft {
  /**
   * The record’s revision when the work began: the decision’s `expectedRev`. `null` after a
   * refusal because the record changed: the next attempt is sent on the record as now shown.
   */
  readonly basis: number | null;
  readonly outcomes: readonly string[];
  readonly newOutcome: string;
  /** The outcome being edited (one at a time) and its text as typed. */
  readonly editing: { readonly index: number; readonly text: string } | null;
  readonly choice: ReviewChoice | null;
  readonly reason: string;
  /** The references ticked, by option key (`reviewer-review.ts` `referenceOptions`). */
  readonly references: readonly string[];
}

/** The work on a record nobody has touched yet: its own outcomes, no decision chosen. */
export function startingDraft(record: {
  readonly rev: number;
  readonly learningOutcomes: readonly { readonly text: string }[];
}): ReviewDraft {
  return {
    basis: record.rev,
    outcomes: record.learningOutcomes.map((outcome) => outcome.text),
    newOutcome: '',
    editing: null,
    choice: null,
    reason: '',
    references: [],
  };
}

/**
 * The drafts typed in this tab (state-copy `RV-03.kept`): in memory only — never localStorage or
 * sessionStorage — per signed-in session and submission, for the life of the tab. Leaving the page
 * and coming back shows the work as it was left; a decision sent, or the record decided elsewhere,
 * drops it; a different session never reads another’s. A reload starts again.
 */
const drafts = new Map<string, ReviewDraft>();
const listeners = new Set<() => void>();

function publish(): void {
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function slotOf(sessionKey: string, submissionId: string): string {
  return `${sessionKey}|${submissionId}`;
}

/** Every draft kept in this tab is dropped (tests start from an empty tab). */
export function forgetReviewDrafts(): void {
  drafts.clear();
  publish();
}

export interface ReviewDraftHandle {
  /** The kept draft, or `null` while nothing was changed on this record in this session. */
  readonly kept: ReviewDraft | null;
  /** Changes the draft (from the kept one, or from `start` when none is kept). */
  readonly update: (start: ReviewDraft, change: (current: ReviewDraft) => ReviewDraft) => void;
  /** Drops the draft: the decision was sent, or the record moved on. */
  readonly drop: () => void;
}

/** The draft of the signed-in session for one submission. */
export function useReviewDraft(submissionId: string): ReviewDraftHandle {
  const session = useSession();
  const key = session.status === 'signed-in' ? slotOf(session.sessionKey, submissionId) : null;
  const kept = useSyncExternalStore(
    subscribe,
    () => (key === null ? null : (drafts.get(key) ?? null)),
    () => null,
  );
  const update = useCallback(
    (start: ReviewDraft, change: (current: ReviewDraft) => ReviewDraft) => {
      if (key === null) return;
      drafts.set(key, change(drafts.get(key) ?? start));
      publish();
    },
    [key],
  );
  const drop = useCallback(() => {
    if (key === null || !drafts.has(key)) return;
    drafts.delete(key);
    publish();
  }, [key]);
  return { kept, update, drop };
}
