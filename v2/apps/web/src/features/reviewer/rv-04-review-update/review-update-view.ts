import type { ActorRef, CorrectionUpdate } from '@xr/domain';
import type { StatusTone, TimelineEvent } from '@xr/ui';

import { dateTime, dayMonthYear } from '@/copy/dates';
import { updateWords, wordsOf } from '@/copy/flow-state-words';
import {
  approvedMetaWords,
  awaitingNextWords,
  quotedWords,
  returnedMetaWords,
  UPDATE_DECISION,
  UPDATE_HISTORY,
} from '@/copy/review-update';
import type { UpdateForReviewView } from '@/queries/correction-view';

/**
 * RV-04’s facts as B6-04 draws them, derived from `getUpdateForReview` alone: whether the
 * decision is open, the header chip, the decided panel and the history the reviewer reads. No
 * rule is decided here that the record or the board does not state: the service says whether the
 * update is decided; the history lists the steps the record shows to the Academic Reviewer.
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

/** The header chip (B6-04 script `rvChipWords`, `rvChip_*`; state-copy `RV-04.chip`). */
export function chipOf(update: CorrectionUpdate): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  const words = wordsOf(updateWords(update.state, 'academic_reviewer'));
  switch (update.state) {
    case 'in-academic-review':
      return { tone: 'wait', words: words ?? '' };
    case 'returned':
      return { tone: 'err', words: words ?? '' };
    case 'awaiting-release-decision':
    case 'on-hold':
    case 'released':
      return { tone: 'ok', words: words ?? '' };
    default:
      return { tone: 'off', words: words ?? UPDATE_DECISION.withdrawnChip };
  }
}

/** The decided panel (B6-04 `rDecTitle`, `rDecMeta`, `rDecNext`; state-copy `RV-04.decided`). */
export interface DecidedPanel {
  readonly tone: StatusTone;
  readonly title: string;
  readonly meta: string | null;
  readonly next: string | null;
}

export function decidedPanelOf(update: CorrectionUpdate, liveLabel: string): DecidedPanel {
  switch (update.state) {
    case 'awaiting-release-decision': {
      const approval = update.reviewDecisions.findLast((entry) => entry.decision === 'approve');
      return {
        tone: 'ok',
        title: UPDATE_DECISION.awaitingTitle,
        meta: approval
          ? approvedMetaWords(dayMonthYear(approval.at), actorName(approval.by))
          : null,
        next: awaitingNextWords(liveLabel),
      };
    }
    case 'returned': {
      const back = update.reviewDecisions.findLast(
        (entry) => entry.decision === 'return-to-content-manager',
      );
      return {
        tone: 'err',
        title: UPDATE_DECISION.returnedTitle,
        meta: back ? returnedMetaWords(dayMonthYear(back.at), back.reason ?? '') : null,
        next: UPDATE_DECISION.returnedNext,
      };
    }
    case 'withdrawn':
      // The withdrawal’s reason is the Content Manager’s (UPD-17): only that it was withdrawn.
      return { tone: 'off', title: UPDATE_DECISION.withdrawnTitle, meta: null, next: null };
    default:
      return { tone: 'off', title: UPDATE_DECISION.nothingTitle, meta: null, next: null };
  }
}

/**
 * The update history as the reviewer reads it, newest first (state-copy `RV-04.history`): the
 * steps whose audience includes the Academic Reviewer, with the board’s words. `reader` is the
 * signed-in reviewer’s name: the record names no recipient for “Sent for academic review”.
 */
export function historyOf(update: CorrectionUpdate, reader: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const base = update.baseVersionLabel;
  for (const entry of update.history) {
    if (!entry.visibleTo.includes('academic_reviewer')) continue;
    const who = actorName(entry.actor);
    const step = { id: entry.id, when: dateTime(entry.at) };
    switch (entry.event) {
      case 'started':
        events.push({
          ...step,
          what: UPDATE_HISTORY.started,
          note: UPDATE_HISTORY.startedNote(base),
        });
        break;
      case 'sent-for-academic-review':
        events.push({
          ...step,
          what: UPDATE_HISTORY.sent,
          note: UPDATE_HISTORY.sentNote(reader, base),
        });
        break;
      case 'approved-by-reviewer':
        events.push({
          ...step,
          what: UPDATE_HISTORY.approved(who),
          note: UPDATE_HISTORY.approvedNote(base),
        });
        break;
      case 'returned-by-reviewer':
        events.push({
          ...step,
          what: UPDATE_HISTORY.returned(who),
          note: entry.note && entry.note.trim() !== '' ? quotedWords(entry.note) : null,
        });
        break;
      case 'released':
        events.push({
          ...step,
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
