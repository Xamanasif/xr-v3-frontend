import type { ActorRef, CorrectionUpdate } from '@xr/domain';
import type { RvComparisonRow, StandItem, TimelineEvent } from '@xr/ui/v3';

import { comparisonFieldLabel } from '@/copy/corrections';
import { dateTime, dayMonthYear } from '@/copy/dates';
import {
  approvedBy,
  awaitingNextWords,
  decidedByOn,
  quotedWords,
  releasedNextWords,
  releasedOnWords,
  unchangedLive,
  UPDATE_HISTORY,
  UPDATE_OUTCOME,
} from '@/copy/review-update';
import { decidedByYouOn, RV_STAND } from '@/copy/rv-shared';
import type { UpdateForReviewView } from '@/queries/correction-view';

import { markChanges } from './compare-words';

/**
 * RV-04's facts as the export draws them (RV-v1 `RV.dc.html` `itemVals` for an update), derived
 * from `getUpdateForReview` alone: whether the decision is open, what changes with its marks, the
 * decided outcome and the history the reviewer reads. No rule is decided here that the record does
 * not state: the service says whether the update is decided; the history lists the steps the
 * record shows to the Academic Reviewer.
 */

/** Who did something, by name (“Prof. A. Menon”, “Kavya Nair”). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** The decision is open: with the reviewer and not decided (the service’s `decided`). */
export function isOpen(view: UpdateForReviewView): boolean {
  return !view.decided && view.update.state === 'in-academic-review';
}

/**
 * “What changes” (`I.cmp`): each changed field, the live value with what is removed struck and the
 * proposed value with what is added highlighted; the version marked whole on both sides.
 */
export function changeRowsOf(view: UpdateForReviewView): RvComparisonRow[] {
  return view.comparison.map((row) => {
    const marks = markChanges(row.liveNow, row.proposed, { wholeValue: row.field === 'version' });
    return {
      key: `${row.field}-${row.format ?? ''}`,
      field: comparisonFieldLabel(row),
      before: marks.live,
      after: marks.proposed,
    };
  });
}

/** The reviewer's decision the update's state rests on: the last one recorded. */
function lastDecision(update: CorrectionUpdate, kind: 'approve' | 'return-to-content-manager') {
  return update.reviewDecisions.findLast((entry) => entry.decision === kind) ?? null;
}

/** The outcome block (`doneBlock` for an update; state-copy `RV-04.decided`). */
export interface UpdateOutcome {
  /** “Decided by you on 27 Aug 2026, 11:20”; none for a withdrawal (not shown to the reviewer). */
  readonly meta: string | null;
  /** A return's reason, quoted under “Your reason”. */
  readonly reason: string | null;
  readonly stand: readonly StandItem[];
  readonly next: string;
}

/**
 * Where a decided update stands, as the reviewer may read it. `personId` is the reader: their own
 * decision reads “by you”, another reviewer's by name (state-copy `RV-04.decided-by`). A hold reads
 * as with the Super Admin, and a withdrawal names no reason or date (`updateForAudience`).
 */
export function outcomeOf(view: UpdateForReviewView, personId: string): UpdateOutcome {
  const { update, live } = view;
  const unchanged = { term: UPDATE_OUTCOME.stand.liveVersion, value: unchangedLive(live.label) };
  const byWhom = (by: ActorRef) => (by.kind === 'person' && by.personId === personId ? null : by);
  const decidedMeta = (entry: { readonly at: string; readonly by: ActorRef }) => {
    const other = byWhom(entry.by);
    const when = dateTime(entry.at);
    return other ? decidedByOn(actorName(other), when) : decidedByYouOn(when);
  };
  if (update.state === 'withdrawn') {
    return {
      meta: null,
      reason: null,
      stand: [
        { term: UPDATE_OUTCOME.stand.update, value: UPDATE_OUTCOME.stand.withdrawn },
        unchanged,
      ],
      next: UPDATE_OUTCOME.withdrawnNext,
    };
  }
  if (update.state === 'returned') {
    const back = lastDecision(update, 'return-to-content-manager');
    return {
      meta: back ? decidedMeta(back) : null,
      reason: back?.reason ?? null,
      stand: [{ term: RV_STAND.academicReview, value: UPDATE_OUTCOME.stand.returned }, unchanged],
      next: UPDATE_OUTCOME.returnedNext,
    };
  }
  const approval = lastDecision(update, 'approve');
  const other = approval ? byWhom(approval.by) : null;
  const approved = {
    term: RV_STAND.academicReview,
    value: other ? approvedBy(actorName(other)) : RV_STAND.approvedByYou,
  };
  if (update.state === 'released') {
    const version = update.versionLabel ?? live.label;
    return {
      meta: approval ? decidedMeta(approval) : null,
      reason: null,
      stand: [
        approved,
        ...(update.release
          ? [
              {
                term: UPDATE_OUTCOME.stand.release,
                value: releasedOnWords(dayMonthYear(update.release.at)),
              },
            ]
          : []),
        { term: UPDATE_OUTCOME.stand.liveVersion, value: version },
      ],
      next: releasedNextWords(version),
    };
  }
  // Approved: awaiting the release decision, or on hold (a hold is never shown to the reviewer).
  return {
    meta: approval ? decidedMeta(approval) : null,
    reason: null,
    stand: [
      approved,
      {
        term: UPDATE_OUTCOME.stand.releaseDecision,
        value: UPDATE_OUTCOME.stand.withTheSuperAdmin,
      },
      unchanged,
      { term: RV_STAND.access, value: UPDATE_OUTCOME.stand.unchanged },
    ],
    next: awaitingNextWords(live.label),
  };
}

/** When the reviewer's decision was recorded (the Decided fact): the last decision's instant. */
export function decidedAt(update: CorrectionUpdate): string | null {
  return update.reviewDecisions.at(-1)?.at ?? null;
}

/**
 * The update history as the reviewer reads it, newest first (state-copy `RV-04.history`): the
 * steps whose audience includes the Academic Reviewer, with the boards' words. `reader` is the
 * signed-in reviewer’s name: the record names no recipient for “Sent for academic review”.
 */
export function historyOf(update: CorrectionUpdate, reader: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const base = update.baseVersionLabel;
  for (const entry of update.history) {
    if (!entry.visibleTo.includes('academic_reviewer')) continue;
    const who = actorName(entry.actor);
    const when = dateTime(entry.at);
    switch (entry.event) {
      case 'started':
        events.push({ when, what: UPDATE_HISTORY.started, note: UPDATE_HISTORY.startedNote(base) });
        break;
      case 'sent-for-academic-review':
        events.push({
          when,
          what: UPDATE_HISTORY.sent,
          note: UPDATE_HISTORY.sentNote(reader, base),
        });
        break;
      case 'approved-by-reviewer':
        events.push({
          when,
          what: UPDATE_HISTORY.approved(who),
          note: UPDATE_HISTORY.approvedNote(base),
        });
        break;
      case 'returned-by-reviewer':
        events.push({
          when,
          what: UPDATE_HISTORY.returned(who),
          note: entry.note && entry.note.trim() !== '' ? quotedWords(entry.note) : null,
        });
        break;
      case 'released':
        events.push({
          when,
          what: UPDATE_HISTORY.released(who),
          note: update.versionLabel ? UPDATE_HISTORY.releasedNote(update.versionLabel) : null,
        });
        break;
      default:
        // A hold, its lift and a withdrawal are not written for the reviewer.
        break;
    }
  }
  return events.reverse();
}
