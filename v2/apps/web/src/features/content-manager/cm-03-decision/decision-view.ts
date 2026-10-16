import type { StatusTone, TimelineEvent } from '@xr/ui';
import {
  type ActorRef,
  FORMAT_META,
  inDisplayOrder,
  type ReturnReference,
  type Submission,
  type Technology,
} from '@xr/domain';

import {
  approvedCheckLine,
  approvedNote,
  approvedWhat,
  CHECK_FIXES,
  CHECK_LINES,
  CHECK_TITLES,
  DECISION_PAGE,
  deliveryCheckLine,
  HISTORY,
  outcomesCheckLine,
  publishedNote,
  publishedWhat,
  quoted,
  READ_ONLY,
  resubmittedWhat,
  returnedByReviewerWhat,
  sentBackToReviewerWhat,
  sentBackToVendorWhat,
  submittedNote,
  toResolveChip,
  WITH_THE_VENDOR,
} from '@/copy/cm-decision';
import { dateTime, dayMonthYear } from '@/copy/dates';
import { submissionWords, wordsOf } from '@/copy/flow-state-words';
import type { PublicationDecisionView } from '@/queries/production-cm-decision';

/**
 * CM-03’s facts as B6-07 draws them, derived from `getPublicationDecision` alone: which panel the
 * page shows, the status chip, the approval it names, the check rows with their words, the format
 * rows and the history. No rule is decided here that the record or the board does not state.
 */

/**
 * The panel (B6-07 script): `open` with the Content Manager (Publish or Send back; with blockers,
 * Send back only), `published` (the result), `sent` (just sent back, until it is approved again)
 * and `read-only` (still in academic review, or with the vendor: nothing to decide yet).
 */
export type PanelKind = 'open' | 'published' | 'sent' | 'read-only';

export interface CheckRow {
  readonly check: keyof typeof CHECK_TITLES;
  readonly title: string;
  readonly line: string;
  readonly ok: boolean;
  /** What to do, while the decision is open and the row fails (state-copy `CM-03.fix-read-only`). */
  readonly fix: string | null;
}

export interface FormatRow {
  readonly format: Technology;
  readonly delivery: string;
  readonly status: string;
}

export interface Approval {
  readonly by: string;
  readonly on: string;
}

export interface SentBack {
  readonly to: 'academic-reviewer' | 'vendor';
  readonly at: string;
  readonly by: string;
  readonly reason: string;
}

export interface DecisionFacts {
  readonly kind: PanelKind;
  readonly chip: { readonly tone: StatusTone; readonly words: string };
  /** The read-only notice (title, line), when the panel is `read-only`. */
  readonly readOnly: { readonly title: string; readonly line: string } | null;
  readonly approval: Approval | null;
  /** “ME ZG523” — the course as B6-07 writes it in sentences (its code, else its name). */
  readonly course: string;
  /** “WEB”, “VR” in display order. */
  readonly codes: readonly string[];
  readonly checks: readonly CheckRow[];
  /** The failing rows, while the decision is open (Publish is then not offered). */
  readonly blockers: readonly CheckRow[];
  readonly formats: readonly FormatRow[];
  /** “Northline Simulation Studio · Anil Shetty”. */
  readonly fromVendor: string;
  readonly returns: number;
  readonly published: { readonly at: string; readonly by: string } | null;
  readonly sentBack: SentBack | null;
  readonly history: readonly TimelineEvent[];
}

/** A person’s name as the record carries it (a system step has none). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** The formats of the submission, in the display order. */
export function formatsOf(submission: Submission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

/** The approval the page names: with the Content Manager or published only. */
function approvalOf(submission: Submission): Approval | null {
  const state = submission.status.state;
  if (state !== 'with-content-manager' && state !== 'published') return null;
  const approval = submission.reviewDecisions.findLast((entry) => entry.decision === 'approve');
  if (!approval) return null;
  return { by: actorName(approval.decidedBy), on: dayMonthYear(approval.decidedAt) };
}

/** The last send back, while it has not been approved again (state-copy `CM-03.sent-back`). */
function sentBackOf(submission: Submission): SentBack | null {
  const state = submission.status.state;
  if (state === 'with-content-manager' || state === 'published') return null;
  const last = submission.contentManagerDecisions.at(-1);
  if (!last || last.kind === 'publish') return null;
  const approvedSince = submission.reviewDecisions.some(
    (entry) => entry.decision === 'approve' && entry.decidedAt > last.at,
  );
  if (approvedSince) return null;
  return {
    to: last.kind === 'send-back-to-reviewer' ? 'academic-reviewer' : 'vendor',
    at: last.at,
    by: actorName(last.by),
    reason: last.reason,
  };
}

function chipOf(
  submission: Submission,
  blockers: number,
): { readonly tone: StatusTone; readonly words: string } {
  const words = wordsOf(submissionWords(submission, 'content_manager'));
  switch (submission.status.state) {
    case 'published':
      return { tone: 'ok', words: words ?? DECISION_PAGE.formatPublished };
    case 'with-content-manager': {
      const ready = words ?? '';
      return blockers > 0
        ? { tone: 'err', words: toResolveChip(ready, blockers) }
        : { tone: 'info', words: ready };
    }
    case 'with-academic-reviewer':
    case 'resubmitted':
      return { tone: 'wait', words: words ?? READ_ONLY.inReviewTitle };
    default:
      // B6-07 `cmChip_off`: “With the vendor” (submissionWords leaves it to the library tab).
      return { tone: 'off', words: words ?? WITH_THE_VENDOR };
  }
}

function readOnlyOf(submission: Submission): DecisionFacts['readOnly'] {
  const status = submission.status;
  if (status.state === 'with-academic-reviewer' && status.reason === 'recheck')
    return { title: READ_ONLY.recheckTitle, line: READ_ONLY.recheckLine };
  if (status.state === 'with-academic-reviewer' || status.state === 'resubmitted')
    return { title: READ_ONLY.inReviewTitle, line: READ_ONLY.inReviewLine };
  return { title: READ_ONLY.vendorTitle, line: READ_ONLY.vendorLine };
}

function checkLine(
  check: CheckRow['check'],
  ok: boolean,
  approval: Approval | null,
  outcomes: number,
  codes: readonly string[],
): string {
  switch (check) {
    case 'approved-by-reviewer':
      return ok && approval ? approvedCheckLine(approval.by, approval.on) : CHECK_LINES.notApproved;
    case 'learning-outcomes':
      return outcomes > 0 ? outcomesCheckLine(outcomes) : CHECK_LINES.noOutcomes;
    case 'catalogue-details':
      return ok ? CHECK_LINES.catalogueComplete : CHECK_LINES.catalogueIncomplete;
    case 'delivery-per-format':
      return deliveryCheckLine(codes, ok);
  }
}

/** The history entries the Content Manager reads, newest first (state-copy `CM-03.history`). */
function historyOf(
  submission: Submission,
  course: string,
  codes: readonly string[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const entry of submission.history) {
    if (!entry.visibleTo.includes('content_manager')) continue;
    const by = actorName(entry.actor);
    const base = { id: entry.id, when: dateTime(entry.at) };
    switch (entry.event) {
      case 'submitted':
        events.push({
          ...base,
          what: HISTORY.submitted,
          note: submittedNote(1, submission.vendorOrganisation),
        });
        break;
      case 'returned-by-reviewer':
        events.push({
          ...base,
          what: returnedByReviewerWhat(by),
          note: entry.note ? quoted(entry.note) : null,
        });
        break;
      case 'resubmitted':
        events.push({ ...base, what: resubmittedWhat(Number(entry.note) || submission.revision) });
        break;
      case 'approved-by-reviewer': {
        const decision = submission.reviewDecisions.find(
          (item) => item.decision === 'approve' && item.decidedAt === entry.at,
        );
        const outcomes = decision?.outcomesAtDecision.length ?? submission.learningOutcomes.length;
        events.push({ ...base, what: approvedWhat(by), note: approvedNote(outcomes) });
        break;
      }
      case 'sent-back-for-recheck':
        events.push({
          ...base,
          what: sentBackToReviewerWhat(by),
          note: entry.note ? quoted(entry.note) : null,
        });
        break;
      case 'returned-by-content-manager':
        events.push({
          ...base,
          what: sentBackToVendorWhat(by),
          note: entry.note ? quoted(entry.note) : null,
        });
        break;
      case 'published':
        events.push({ ...base, what: publishedWhat(by), note: publishedNote(course, codes) });
        break;
      default:
        // A draft save, the routing stand-in’s step and a Super Admin override are not listed.
        break;
    }
  }
  return events.reverse();
}

export function decisionFacts(view: PublicationDecisionView): DecisionFacts {
  const { submission, cataloguePreview: preview } = view;
  const formats = formatsOf(submission);
  const codes = formats.map((format) => FORMAT_META[format].code);
  const course = preview.platformCode ?? preview.courseName;
  const approval = approvalOf(submission);
  const state = submission.status.state;
  const sentBack = sentBackOf(submission);
  const kind: PanelKind =
    state === 'with-content-manager'
      ? 'open'
      : state === 'published'
        ? 'published'
        : sentBack
          ? 'sent'
          : 'read-only';
  const outcomes = submission.learningOutcomes.length;
  const checks: CheckRow[] = view.check.map((item) => {
    // Once published, the approval it was published on still stands (B6-07 f4 draws the row
    // passed); the service’s check answers “approved” only while it waits with the Content
    // Manager (state-copy `CM-03.published-check`).
    const ok =
      item.ok || (item.check === 'approved-by-reviewer' && kind === 'published' && !!approval);
    return {
      check: item.check,
      title: CHECK_TITLES[item.check],
      line: checkLine(item.check, ok, approval, outcomes, codes),
      ok,
      fix: !ok && kind === 'open' ? CHECK_FIXES[item.check] : null,
    };
  });
  const blockers = kind === 'open' ? checks.filter((row) => !row.ok) : [];
  const submitted = submission.history.find((entry) => entry.event === 'submitted');
  const person = submitted ? actorName(submitted.actor) : '';
  const publish = submission.contentManagerDecisions.findLast((entry) => entry.kind === 'publish');
  return {
    kind,
    chip: chipOf(submission, blockers.length),
    readOnly: kind === 'read-only' ? readOnlyOf(submission) : null,
    approval,
    course,
    codes,
    checks,
    blockers,
    formats: formats.map((format) => ({
      format,
      delivery: format === 'web' ? DECISION_PAGE.webLink : DECISION_PAGE.appPackage,
      status:
        state === 'published'
          ? DECISION_PAGE.formatPublished
          : approval
            ? DECISION_PAGE.formatPassed
            : DECISION_PAGE.formatInReview,
    })),
    fromVendor: person
      ? `${submission.vendorOrganisation} · ${person}`
      : submission.vendorOrganisation,
    returns: submission.reviewDecisions.filter((entry) => entry.decision === 'return-to-vendor')
      .length,
    published:
      submission.status.state === 'published'
        ? {
            at: publish?.at ?? submission.status.at,
            by: publish ? actorName(publish.by) : '',
          }
        : null,
    sentBack,
    history: historyOf(submission, course, codes),
  };
}

/** One reference option of the send back (`refOpts`, OD-B6-05), for the submission’s formats. */
export interface ReferenceOption {
  readonly id: string;
  readonly reference: ReturnReference;
  readonly formatCode: string | null;
}

export function referenceOptions(submission: Submission, prefix: string): ReferenceOption[] {
  const options: ReferenceOption[] = [];
  const add = (reference: ReturnReference) =>
    options.push({
      id: `${prefix}-${reference.step}-${reference.format ?? 'all'}-${reference.field}`,
      reference,
      formatCode: reference.format ? FORMAT_META[reference.format].code : null,
    });
  add({ step: 'course-and-description', format: null, field: 'summary' });
  add({ step: 'course-and-description', format: null, field: 'description' });
  for (const format of formatsOf(submission)) {
    const fields: ReturnReference['field'][] =
      format === 'web'
        ? ['web-link', 'browser-and-computer']
        : ['package', 'device-need', 'install-notes'];
    for (const field of fields) add({ step: 'formats-and-delivery', format, field });
  }
  add({ step: 'preview-and-documents', format: null, field: 'preview-link' });
  return options;
}

/** Two references are the same field of the same step and format. */
export function sameReference(a: ReturnReference, b: ReturnReference): boolean {
  return a.step === b.step && a.format === b.format && a.field === b.field;
}
