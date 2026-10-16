import type { Out, submissionForReviewOutput } from '@xr/contracts/draft';
import {
  type AcademicReviewDecision,
  type ActorRef,
  inDisplayOrder,
  type Submission,
  type Technology,
} from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import { dateTime, dayMonth, dayMonthYear } from '@/copy/dates';
import { submissionWords, wordsOf } from '@/copy/flow-state-words';
import {
  changedFieldWords,
  changedValueWords,
  DECIDED_WORDS,
  decidedWhenWords,
  HISTORY_WORDS,
  previousReturnWords,
  publishedNextWords,
  quoted,
  resubmittedNoteWords,
} from '@/copy/reviewer-review';
import { stateWords } from '@/copy/state-copy';

/** What `getSubmissionForReview` answers: the record, what changed, the previous return, a re-check. */
export type SubmissionForReview = Out<typeof submissionForReviewOutput>;

/** Who did something, by name (“Prof. A. Menon”, “Kavya Nair”). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** Whether the person is the signed-in viewer. */
function isViewer(actor: ActorRef, personId: string): boolean {
  return actor.kind === 'person' && actor.personId === personId;
}

/** The record is with the reviewer to decide: RV-03 (otherwise RV-06, read-only). */
export function isLive(answer: SubmissionForReview): boolean {
  return !answer.decided && answer.submission.status.state === 'with-academic-reviewer';
}

/** The formats in display order (WEB · AR · VR · MR). */
export function formatsOf(submission: Submission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

/** The header chip (B6-03 script `rvChipWords`, `rvChip_*`). */
export function chipOf(submission: Submission): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  const status = submission.status;
  switch (status.state) {
    case 'with-academic-reviewer':
      return {
        tone: status.reason === 'recheck' ? 'wait' : 'info',
        words: wordsOf(submissionWords(submission, 'academic_reviewer')) ?? '',
      };
    case 'with-content-manager':
      return { tone: 'ok', words: DECIDED_WORDS.withContentManager };
    case 'published':
      return { tone: 'ok', words: DECIDED_WORDS.publishedChip };
    case 'returned':
      if (status.by === 'content-manager')
        return { tone: 'err', words: DECIDED_WORDS.returnedByContentManager };
      if (status.by === 'super-admin-override')
        return { tone: 'err', words: stateWords('RV-06.override') };
      return { tone: 'err', words: DECIDED_WORDS.returned };
    case 'resubmitted':
      return { tone: 'info', words: stateWords('RV-06.resubmitted') };
    case 'draft':
      return { tone: 'neutral', words: '' };
  }
}

/** The reviewer’s latest decision on the record, if any. */
export function lastDecision(submission: Submission): AcademicReviewDecision | null {
  return submission.reviewDecisions.at(-1) ?? null;
}

/** RV-06: the decided panel (B6-03 f4; script `decTitle`, `decWhen`, `decReason`, `decNext`). */
export interface DecidedPanelView {
  readonly tone: StatusTone;
  readonly title: string;
  readonly when: string | null;
  readonly reason: string | null;
  readonly next: string | null;
}

export function decidedPanelOf(submission: Submission): DecidedPanelView {
  const decision = lastDecision(submission);
  const when = decision
    ? decidedWhenWords(dateTime(decision.decidedAt), actorName(decision.decidedBy))
    : null;
  const ownReturn =
    decision?.decision === 'return-to-vendor' && decision.reason ? quoted(decision.reason) : null;
  const status = submission.status;
  const chip = chipOf(submission);
  switch (status.state) {
    case 'with-content-manager':
      return {
        tone: 'ok',
        title: DECIDED_WORDS.withContentManager,
        when,
        reason: null,
        next: DECIDED_WORDS.nextWithContentManager,
      };
    case 'published':
      return {
        tone: 'ok',
        title: DECIDED_WORDS.published,
        when,
        reason: null,
        next: publishedNextWords(dayMonthYear(status.at)),
      };
    case 'returned':
      if (status.by === 'academic-reviewer') {
        return {
          tone: 'err',
          title: DECIDED_WORDS.returned,
          when,
          reason: ownReturn,
          next: DECIDED_WORDS.nextReturned,
        };
      }
      if (status.by === 'content-manager') {
        return {
          tone: 'err',
          title: DECIDED_WORDS.returnedByContentManager,
          when,
          reason: null,
          next: DECIDED_WORDS.nextReturnedByContentManager,
        };
      }
      return { tone: chip.tone, title: chip.words, when, reason: null, next: null };
    case 'resubmitted':
      return {
        tone: chip.tone,
        title: chip.words,
        when,
        reason: ownReturn,
        next: stateWords('RV-06.resubmitted.next').replace('{day}', dayMonthYear(status.since)),
      };
    default:
      return { tone: chip.tone, title: chip.words, when, reason: null, next: null };
  }
}

/** One “What changed” row (f0 `chg`). */
export interface ChangedRow {
  readonly key: string;
  readonly field: string;
  readonly was: string;
  readonly now: string;
}

export function changedRows(answer: SubmissionForReview): ChangedRow[] {
  return answer.whatChanged.map((change) => ({
    key: change.field,
    field: changedFieldWords(change.field),
    was: changedValueWords(change.was),
    now: changedValueWords(change.now),
  }));
}

/** “What changed in revision n” shows for a live resubmission that reports a change (`hasChg`). */
export function showsChanges(answer: SubmissionForReview): boolean {
  return isLive(answer) && answer.submission.revision > 1 && answer.whatChanged.length > 0;
}

/** “You returned revision 1 on 19 Aug: “…”” (`prevRet`), shown with “What changed”. */
export function previousReturnLine(answer: SubmissionForReview, personId: string): string | null {
  const previous = answer.previousReturn;
  if (!previous || !previous.reason || !showsChanges(answer)) return null;
  return previousReturnWords(
    previous.revision,
    dayMonth(previous.decidedAt),
    previous.reason,
    isViewer(previous.decidedBy, personId) ? null : actorName(previous.decidedBy),
  );
}

/** One “Review history” entry (`sh`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * “Review history”, newest first (state-copy `RV-03.history-events`): what the reviewer may read,
 * in B6-03’s words. `courseCode` names the catalogue course a publication is listed under.
 */
export function historyLines(
  answer: SubmissionForReview,
  courseCode: string | null,
): HistoryLine[] {
  const { submission } = answer;
  const organisation = submission.vendorOrganisation;
  const formats = formatsOf(submission).map((format) => format.toUpperCase());
  const latestResubmission = submission.history.findLast((entry) => entry.event === 'resubmitted');
  const lines: HistoryLine[] = [];
  for (const entry of submission.history) {
    if (!entry.visibleTo.includes('academic_reviewer')) continue;
    const who = actorName(entry.actor);
    const when = dateTime(entry.at);
    const note = entry.note && entry.note.trim() !== '' ? quoted(entry.note) : null;
    switch (entry.event) {
      case 'submitted':
        lines.push({
          id: entry.id,
          what: HISTORY_WORDS.submitted,
          when,
          note: HISTORY_WORDS.submittedNote(organisation),
        });
        break;
      case 'returned-by-reviewer':
        lines.push({ id: entry.id, what: HISTORY_WORDS.returned(who), when, note });
        break;
      case 'approved-by-reviewer': {
        const decision = submission.reviewDecisions.find(
          (item) => item.decision === 'approve' && item.decidedAt === entry.at,
        );
        lines.push({
          id: entry.id,
          what: HISTORY_WORDS.approved(who),
          when,
          note: decision ? HISTORY_WORDS.approvedNote(decision.outcomesAtDecision.length) : null,
        });
        break;
      }
      case 'resubmitted': {
        const revision = Number(entry.note) || submission.revision;
        const changed =
          entry.id === latestResubmission?.id && revision === submission.revision
            ? answer.whatChanged.map((change) => change.field)
            : null;
        lines.push({
          id: entry.id,
          what: HISTORY_WORDS.resubmitted(revision),
          when,
          note: resubmittedNoteWords(organisation, revision, changed),
        });
        break;
      }
      case 'sent-back-for-recheck':
        lines.push({ id: entry.id, what: HISTORY_WORDS.recheck(who), when, note });
        break;
      case 'returned-by-content-manager':
        lines.push({ id: entry.id, what: HISTORY_WORDS.sentBackToVendor(who), when, note });
        break;
      case 'published':
        lines.push({
          id: entry.id,
          what: HISTORY_WORDS.published(who),
          when,
          note: courseCode ? HISTORY_WORDS.publishedNote(courseCode, formats) : null,
        });
        break;
      default:
        // Drafts (the Vendor's own), the routing stand-in's system entry and an override.
        break;
    }
  }
  return lines.reverse();
}

/** One format's delivery card (`deliv`): WEB's link, or a package's fields (T-14, T-30). */
export type DeliveryCard =
  | {
      readonly kind: 'web';
      readonly format: 'web';
      readonly link: string | null;
      readonly browser: string;
    }
  | {
      readonly kind: 'package';
      readonly format: 'ar' | 'vr' | 'mr';
      readonly label: string;
      readonly device: string;
      readonly deviceChanged: boolean;
      readonly reference: string | null;
      readonly fileName: string | null;
      readonly installNotes: string;
    };

const trimmed = (value: string | null | undefined) => (value ?? '').trim();

export function deliveryCards(answer: SubmissionForReview): DeliveryCard[] {
  const { submission } = answer;
  const changed = showsChanges(answer)
    ? new Set(answer.whatChanged.map((change) => change.field))
    : new Set<string>();
  return formatsOf(submission).map((format): DeliveryCard => {
    const delivery = submission.content.delivery[format];
    if (format === 'web') {
      const web = delivery?.format === 'web' ? delivery : null;
      return {
        kind: 'web',
        format,
        link: trimmed(web?.webLink) || null,
        browser: trimmed(web?.browserAndComputer),
      };
    }
    const pkg = delivery && delivery.format !== 'web' ? delivery : null;
    return {
      kind: 'package',
      format,
      label: trimmed(pkg?.packageLabel),
      device: trimmed(pkg?.deviceNeeded),
      deviceChanged: changed.has(`${format}:device-need`),
      reference: trimmed(pkg?.packageReference) || null,
      fileName: trimmed(pkg?.packageFileName) || null,
      installNotes: trimmed(pkg?.installNotes),
    };
  });
}
