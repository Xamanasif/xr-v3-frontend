import type { Out, submissionForReviewOutput } from '@xr/contracts/draft';
import {
  type AcademicReviewDecision,
  type ActorRef,
  inDisplayOrder,
  type Submission,
  type Technology,
} from '@xr/domain';
import type { StatusTone } from '@xr/ui/v3';

import { dateTime, dayMonth, dayMonthYear } from '@/copy/dates';
import {
  changedFieldWords,
  changedValueWords,
  decidedByOther,
  DONE_WORDS,
  HISTORY_WORDS,
  outcomesStand,
  publishedNoteWords,
  quoted,
  referencesStand,
  referenceWords,
  resubmittedNoteWords,
} from '@/copy/reviewer-review';
import { decidedByYouOn, decidedElsewhereOn, publishedOn, RV_STAND } from '@/copy/rv-shared';
import { stateWords } from '@/copy/state-copy';

import { submissionStanding } from '../shared/standing';

/** What `getSubmissionForReview` answers: the record, what changed, the previous return, a re-check. */
export type SubmissionForReview = Out<typeof submissionForReviewOutput>;

/** Who did something, by name (“Prof. A. Menon”, “Kavya Nair”). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** Whether the person is the signed-in viewer. */
export function isViewer(actor: ActorRef, personId: string): boolean {
  return actor.kind === 'person' && actor.personId === personId;
}

/** The record is with the reviewer to decide: RV-03 (otherwise RV-06, read-only). */
export function isLive(answer: SubmissionForReview): boolean {
  return !answer.decided && answer.submission.status.state === 'with-academic-reviewer';
}

/** Back with the reviewer because the Content Manager sent it back for a re-check. */
export function isRecheck(answer: SubmissionForReview): boolean {
  const status = answer.submission.status;
  return (
    isLive(answer) &&
    status.state === 'with-academic-reviewer' &&
    status.reason === 'recheck' &&
    answer.recheck !== null
  );
}

/** The formats in display order (WEB · AR · VR · MR). */
export function formatsOf(submission: Submission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

/** A format's code as the badges print it. */
export function formatCode(format: Technology): 'WEB' | 'AR' | 'VR' | 'MR' {
  return format.toUpperCase() as 'WEB' | 'AR' | 'VR' | 'MR';
}

/**
 * The record's status as the reviewer may see it (the export's `standing`; the shared
 * `submissionStanding`). A resubmission not yet routed back is not the reviewer's to decide on this
 * page: it reads as resubmitted (state-copy `RV-06.resubmitted`).
 */
export function statusOf(answer: SubmissionForReview): {
  readonly tone: StatusTone;
  readonly words: string;
} {
  const status = answer.submission.status;
  if (status.state === 'resubmitted') {
    return { tone: 'info', words: stateWords('RV-06.resubmitted') };
  }
  const standing = submissionStanding(status, answer.submission.revision);
  return standing ? { tone: standing.tone, words: standing.label } : { tone: 'neutral', words: '' };
}

/** The reviewer's latest decision on the record, if any. */
export function lastDecision(submission: Submission): AcademicReviewDecision | null {
  return submission.reviewDecisions.at(-1) ?? null;
}

/** One “What changed” row (`changes`): the field, what it was and what it is now. */
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

/** “What changed in revision n” shows for a live resubmission that reports a change (`hasChanges`). */
export function showsChanges(answer: SubmissionForReview): boolean {
  return isLive(answer) && answer.submission.revision > 1 && answer.whatChanged.length > 0;
}

/** The changed field keys, while “What changed” shows (the delivery cards' tags). */
export function changedKeys(answer: SubmissionForReview): ReadonlySet<string> {
  return showsChanges(answer)
    ? new Set(answer.whatChanged.map((change) => change.field))
    : new Set<string>();
}

/** One “Review history” entry (`hist`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * “Review history”, newest first (state-copy `RV-03.history-events`): what the reviewer may read.
 * `courseCode` names the catalogue course a publication is listed under.
 */
export function historyLines(
  answer: SubmissionForReview,
  courseCode: string | null,
): HistoryLine[] {
  const { submission } = answer;
  const organisation = submission.vendorOrganisation;
  const formats = formatsOf(submission).map(formatCode);
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
          note: courseCode ? publishedNoteWords(courseCode, formats) : null,
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
      readonly changed: ReadonlySet<'link' | 'browser'>;
    }
  | {
      readonly kind: 'package';
      readonly format: 'ar' | 'vr' | 'mr';
      readonly label: string;
      readonly device: string;
      readonly reference: string | null;
      readonly fileName: string | null;
      readonly installNotes: string;
      readonly changed: ReadonlySet<'label' | 'device' | 'reference' | 'install'>;
    };

const trimmed = (value: string | null | undefined) => (value ?? '').trim();

export function deliveryCards(answer: SubmissionForReview): DeliveryCard[] {
  const { submission } = answer;
  const changed = changedKeys(answer);
  return formatsOf(submission).map((format): DeliveryCard => {
    const delivery = submission.content.delivery[format];
    const has = (field: string) => changed.has(`${format}:${field}`);
    if (format === 'web') {
      const web = delivery?.format === 'web' ? delivery : null;
      const marks = new Set<'link' | 'browser'>();
      if (has('web-link')) marks.add('link');
      if (has('browser-and-computer')) marks.add('browser');
      return {
        kind: 'web',
        format,
        link: trimmed(web?.webLink) || null,
        browser: trimmed(web?.browserAndComputer),
        changed: marks,
      };
    }
    const pkg = delivery && delivery.format !== 'web' ? delivery : null;
    const marks = new Set<'label' | 'device' | 'reference' | 'install'>();
    if (has('package-label')) marks.add('label');
    if (has('device-need')) marks.add('device');
    if (has('package')) marks.add('reference');
    if (has('install-notes')) marks.add('install');
    return {
      kind: 'package',
      format,
      label: trimmed(pkg?.packageLabel),
      device: trimmed(pkg?.deviceNeeded),
      reference: trimmed(pkg?.packageReference) || null,
      fileName: trimmed(pkg?.packageFileName) || null,
      installNotes: trimmed(pkg?.installNotes),
      changed: marks,
    };
  });
}

/** The decided outcome (RV-06, or RV-03 right after deciding): the export's `doneBlock`. */
export interface DecidedView {
  readonly tone: StatusTone;
  readonly status: string;
  /** “Decided by you on 14 Aug 2026, 15:10” (or by another reviewer); none without a decision. */
  readonly meta: string | null;
  readonly reason: { readonly text: string; readonly references: readonly string[] } | null;
  readonly stand: readonly { readonly term: string; readonly value: string }[];
  readonly next: string | null;
}

/**
 * Where the decided record stands (the export's `stand` and `next`): the academic review (approved
 * with its outcomes, or returned with its references), the publication and, while with the
 * Content Manager, access. `here`: decided on this page now ("…, sent with your decision"; the
 * vendor's next step as the export words it right after a return).
 */
export function decidedView(
  answer: SubmissionForReview,
  personId: string,
  options: { readonly here: boolean; readonly elsewhere: boolean },
): DecidedView {
  const { submission } = answer;
  const status = submission.status;
  const decision = lastDecision(submission);
  const pill = statusOf(answer);
  const mine = decision ? isViewer(decision.decidedBy, personId) : true;
  const by = decision && !mine ? actorName(decision.decidedBy) : null;
  const when = decision ? dateTime(decision.decidedAt) : null;
  const meta =
    when === null
      ? null
      : options.elsewhere && mine
        ? decidedElsewhereOn(when)
        : by === null
          ? decidedByYouOn(when)
          : decidedByOther(when, by);
  const stand: { term: string; value: string }[] = [];
  let reason: DecidedView['reason'] = null;
  if (decision?.decision === 'approve') {
    stand.push({
      term: RV_STAND.academicReview,
      value:
        by === null
          ? RV_STAND.approvedByYou
          : stateWords('RV-06.approved-by-other').replace('{name}', by),
    });
    stand.push({
      term: DONE_WORDS.learningOutcomes,
      value: outcomesStand(decision.outcomesAtDecision.length, options.here),
    });
  } else if (decision) {
    stand.push({ term: RV_STAND.academicReview, value: DONE_WORDS.returnedToVendor });
    stand.push({ term: DONE_WORDS.references, value: referencesStand(decision.references.length) });
    if (decision.reason && status.state !== 'with-academic-reviewer') {
      reason = { text: decision.reason, references: decision.references.map(referenceWords) };
    }
  }
  let next: string | null = null;
  if (status.state === 'published') {
    stand.push({ term: DONE_WORDS.publication, value: publishedOn(dayMonthYear(status.at)) });
    next = DONE_WORDS.nextPublished;
  } else if (status.state === 'with-content-manager') {
    stand.push({ term: DONE_WORDS.publication, value: DONE_WORDS.notPublishedDecides });
    stand.push({ term: RV_STAND.access, value: DONE_WORDS.noAccess });
    next = DONE_WORDS.nextWithContentManager;
  } else {
    stand.push({ term: DONE_WORDS.publication, value: DONE_WORDS.notPublished });
    if (status.state === 'returned' && status.by === 'academic-reviewer') {
      next = options.here ? DONE_WORDS.nextReturnedHere : DONE_WORDS.nextReturned;
    } else if (status.state === 'returned' && status.by === 'content-manager') {
      next = stateWords('RV-06.with-vendor.next');
    } else if (status.state === 'resubmitted') {
      next = stateWords('RV-06.resubmitted.next').replace('{day}', dayMonthYear(status.since));
    }
  }
  // The override's reason is the Super Admin's: no reason, no next line.
  if (status.state === 'returned' && status.by === 'super-admin-override') {
    reason = null;
    next = null;
  }
  return { tone: pill.tone, status: pill.words, meta, reason, stand, next };
}

/** The previous return a resubmission answers (`prevReturn`), shown with “What changed”. */
export function previousReturnOf(
  answer: SubmissionForReview,
  personId: string,
): {
  readonly reason: string;
  readonly revision: number;
  readonly day: string;
  readonly by: string | null;
} | null {
  const previous = answer.previousReturn;
  if (!previous || !previous.reason || !showsChanges(answer)) return null;
  return {
    reason: previous.reason,
    revision: previous.revision,
    day: dayMonthYear(previous.decidedAt),
    by: isViewer(previous.decidedBy, personId) ? null : actorName(previous.decidedBy),
  };
}

/** The day a resubmission came in (“26 Aug”), for the revision fact. */
export function resubmittedDay(submission: Submission): string | null {
  return submission.revision > 1 && submission.lastResubmittedAt
    ? dayMonth(submission.lastResubmittedAt)
    : null;
}
