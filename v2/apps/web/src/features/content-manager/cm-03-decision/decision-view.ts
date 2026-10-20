import {
  type ActorRef,
  FORMAT_META,
  type FormatCode,
  inDisplayOrder,
  type ReturnReference,
  type Submission,
  type Technology,
} from '@xr/domain';
import type { CmIdentityFact, TimelineEvent } from '@xr/ui/v3';

import {
  approvedCheckLine,
  approvedNote,
  approvedWhat,
  CHECK_FIXES,
  CHECK_LINES,
  CHECK_TITLES,
  courseLabel,
  DECISION_PAGE,
  deliveryCheckLine,
  formatsList,
  gateVerdict,
  HISTORY,
  outcomesCheckLine,
  packageDetail,
  publishedNote,
  publishedWhat,
  quoted,
  READ_ONLY,
  recheckLine,
  recheckReviewLine,
  referenceWords,
  resubmittedWhat,
  returnedByReviewerLine,
  returnedByReviewerWhat,
  returnedReviewLine,
  reviewLine,
  revisionFact,
  sentBackToReviewerWhat,
  sentBackToVendorNote,
  sentBackToVendorWhat,
  sentToVendorLine,
  submittedNote,
} from '@/copy/cm-decision';
import { dateTime, dayMonthYear } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import type { LibraryTab } from '@/nav/content-manager';
import type { PublicationDecisionView } from '@/queries/production-cm-decision';

import { type CmPill, cmSubmissionPill } from '../shared/status';

/**
 * CM-03's facts as the owner-approved export draws them (CM-v1 `decVM`), derived from
 * `getPublicationDecision` alone: which panel the page shows, the status pill, the band's facts,
 * the gate's checks and verdict, the delivery rows, the review line, the read-only notice and the
 * history. No rule is decided here that the record or the export does not state.
 */

/**
 * The panel: `open` with the Content Manager (Publish or Send back; with blockers, Send back only),
 * `published` (the result), `sent` (her send back, until it is approved again) and `read-only`
 * (in academic review, or with the vendor: nothing to decide yet).
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

export interface DeliveryRow {
  readonly format: Technology;
  readonly code: FormatCode;
  readonly name: string;
  /** "Web link" / "App package (provisional)", then the link or the package. */
  readonly lines: readonly [string, string];
  readonly status: string;
}

export interface Approval {
  readonly by: string;
  readonly at: string;
  readonly on: string;
}

export interface SentBack {
  readonly to: 'academic-reviewer' | 'vendor';
  readonly at: string;
  readonly by: ActorRef;
  readonly reason: string;
}

/** The read-only notice (`roMap`): its tone, glyph, title and line. */
export interface ReadOnlyNotice {
  readonly tone: 'info' | 'off';
  readonly icon: 'clock' | 'updates';
  readonly title: string;
  readonly line: string;
}

export interface DecisionFacts {
  readonly kind: PanelKind;
  readonly pill: CmPill;
  /** The band's facts: formats, learning outcomes, version, submission. */
  readonly bandFacts: readonly CmIdentityFact[];
  /** The read-only notice, when nothing is hers to decide (`read-only`, or `sent` opened again). */
  readonly readOnly: ReadOnlyNotice | null;
  /** The library view that lists the record while it is read-only (`CM-03.crumb`). */
  readonly libraryTab: LibraryTab;
  readonly approval: Approval | null;
  /** Who approved it last (the re-check's "Now with"), whatever its state now. */
  readonly reviewerName: string;
  readonly courseCode: string | null;
  readonly courseName: string;
  /** "ME ZG523" — the course as the export writes it short (its code, else its name). */
  readonly courseShort: string;
  /** "ME ZG523 · Thermodynamics & Heat Transfer" (`cLabel`). */
  readonly courseFull: string;
  /** "WEB", "VR" in display order. */
  readonly codes: readonly FormatCode[];
  readonly checks: readonly CheckRow[];
  /** The failing rows, while the decision is open (Publish is then not offered). */
  readonly blockers: readonly CheckRow[];
  /** The gate's verdict beside "Publication check". */
  readonly verdict: { readonly words: string; readonly tone: 'ok' | 'no' | 'plain' };
  readonly delivery: readonly DeliveryRow[];
  /** "Northline Simulation Studio · Anil Shetty". */
  readonly fromVendor: string;
  /** The summary's "Academic review" line. */
  readonly reviewLine: string;
  readonly published: { readonly at: string; readonly by: ActorRef | null } | null;
  readonly sentBack: SentBack | null;
  readonly history: readonly TimelineEvent[];
}

/** A person's name as the record carries it (a system step has none). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return '';
}

/** The formats of the submission, in the display order. */
export function formatsOf(submission: Submission): Technology[] {
  return inDisplayOrder(submission.content.formats);
}

function lastApprovalOf(submission: Submission): Approval | null {
  const approval = submission.reviewDecisions.findLast((entry) => entry.decision === 'approve');
  if (!approval) return null;
  return {
    by: actorName(approval.decidedBy),
    at: approval.decidedAt,
    on: dayMonthYear(approval.decidedAt),
  };
}

/** The approval the check names: with the Content Manager or published only. */
function approvalOf(submission: Submission): Approval | null {
  const state = submission.status.state;
  if (state !== 'with-content-manager' && state !== 'published') return null;
  return lastApprovalOf(submission);
}

/** Her last send back, while it has not been approved again (state-copy `CM-03.sent-back`). */
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
    by: last.by,
    reason: last.reason,
  };
}

/** The read-only notice for a record that is not hers to decide (`roMap`). */
function readOnlyOf(submission: Submission, sentBack: SentBack | null): ReadOnlyNotice {
  const status = submission.status;
  if (status.state === 'with-academic-reviewer' && status.reason === 'recheck') {
    return {
      tone: 'info',
      icon: 'clock',
      title: READ_ONLY.recheckTitle,
      line: sentBack ? recheckLine(dayMonthYear(sentBack.at), sentBack.reason) : '',
    };
  }
  if (status.state === 'with-academic-reviewer' || status.state === 'resubmitted') {
    return {
      tone: 'info',
      icon: 'clock',
      title: READ_ONLY.inReviewTitle,
      line: READ_ONLY.inReviewLine,
    };
  }
  if (status.state === 'returned' && status.by === 'content-manager') {
    return {
      tone: 'off',
      icon: 'updates',
      title: READ_ONLY.vendorTitle,
      line: sentToVendorLine(sentBack ? dayMonthYear(sentBack.at) : null),
    };
  }
  if (status.state === 'returned' && status.by === 'super-admin-override') {
    return {
      tone: 'off',
      icon: 'updates',
      title: READ_ONLY.vendorTitle,
      line: stateWords('CM-03.returned-override'),
    };
  }
  const returned = submission.reviewDecisions.findLast(
    (entry) => entry.decision === 'return-to-vendor',
  );
  return {
    tone: 'off',
    icon: 'updates',
    title: READ_ONLY.vendorTitle,
    line: returnedByReviewerLine(returned ? dayMonthYear(returned.decidedAt) : null),
  };
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

/** The fields a send back to the vendor refers to, as the history lists them. */
function referencesOf(submission: Submission, at: string): string[] {
  const decision = submission.contentManagerDecisions.find(
    (entry) => entry.kind === 'send-back-to-vendor' && entry.at === at,
  );
  if (!decision || decision.kind !== 'send-back-to-vendor') return [];
  return decision.references.map((reference: ReturnReference) =>
    referenceWords(reference, reference.format ? FORMAT_META[reference.format].code : null),
  );
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
    const when = dateTime(entry.at);
    switch (entry.event) {
      case 'submitted':
        events.push({
          what: HISTORY.submitted,
          when,
          note: submittedNote(1, submission.vendorOrganisation),
        });
        break;
      case 'returned-by-reviewer':
        events.push({
          what: returnedByReviewerWhat(by),
          when,
          note: entry.note ? quoted(entry.note) : null,
        });
        break;
      case 'resubmitted':
        events.push({ what: resubmittedWhat(Number(entry.note) || submission.revision), when });
        break;
      case 'approved-by-reviewer': {
        const decision = submission.reviewDecisions.find(
          (item) => item.decision === 'approve' && item.decidedAt === entry.at,
        );
        const outcomes = decision?.outcomesAtDecision.length ?? submission.learningOutcomes.length;
        events.push({ what: approvedWhat(by), when, note: approvedNote(outcomes) });
        break;
      }
      case 'sent-back-for-recheck':
        events.push({
          what: sentBackToReviewerWhat(by),
          when,
          note: entry.note ? quoted(entry.note) : null,
        });
        break;
      case 'returned-by-content-manager':
        events.push({
          what: sentBackToVendorWhat(by),
          when,
          note: entry.note
            ? sentBackToVendorNote(entry.note, referencesOf(submission, entry.at))
            : null,
        });
        break;
      case 'published':
        events.push({ what: publishedWhat(by), when, note: publishedNote(course, codes) });
        break;
      default:
        // A draft save, the routing stand-in's step and a Super Admin override are not listed.
        break;
    }
  }
  return events.reverse();
}

function deliveryOf(submission: Submission, status: string): DeliveryRow[] {
  return formatsOf(submission).map((format) => {
    const delivery = submission.content.delivery[format];
    let detail: string = DECISION_PAGE.notGiven;
    if (delivery?.format === 'web') detail = delivery.webLink ?? '';
    else if (delivery) {
      const reference = delivery.packageReference ?? delivery.packageFileName;
      if (delivery.packageLabel || reference)
        detail = packageDetail(delivery.packageLabel ?? '', reference ?? '');
    }
    return {
      format,
      code: FORMAT_META[format].code,
      name: FORMAT_META[format].name,
      lines: [format === 'web' ? DECISION_PAGE.webLink : DECISION_PAGE.appPackage, detail],
      status,
    };
  });
}

/** The delivery rows' status by the record's state (`deliv.state`). */
function deliveryStatus(submission: Submission): string {
  switch (submission.status.state) {
    case 'published':
      return DECISION_PAGE.formatPublished;
    case 'with-content-manager':
      return DECISION_PAGE.formatPassed;
    case 'with-academic-reviewer':
    case 'resubmitted':
      return DECISION_PAGE.formatInReview;
    default:
      return DECISION_PAGE.formatWithVendor;
  }
}

function reviewLineOf(
  submission: Submission,
  approval: Approval | null,
  sentBack: SentBack | null,
): string {
  const status = submission.status;
  const returns = submission.reviewDecisions.filter(
    (entry) => entry.decision === 'return-to-vendor',
  ).length;
  if (approval) return reviewLine(approval.by, approval.on, returns);
  if (status.state === 'with-academic-reviewer' && status.reason === 'recheck' && sentBack) {
    const previous = lastApprovalOf(submission);
    if (previous) return recheckReviewLine(previous.by, previous.on, dayMonthYear(sentBack.at));
  }
  if (status.state === 'returned' && status.by === 'academic-reviewer') {
    const returned = submission.reviewDecisions.findLast(
      (entry) => entry.decision === 'return-to-vendor',
    );
    if (returned)
      return returnedReviewLine(actorName(returned.decidedBy), dayMonthYear(returned.decidedAt));
  }
  return DECISION_PAGE.notDecided;
}

export function decisionFacts(view: PublicationDecisionView): DecisionFacts {
  const { submission, cataloguePreview: preview } = view;
  const formats = formatsOf(submission);
  const codes = formats.map((format) => FORMAT_META[format].code);
  const courseShort = preview.platformCode ?? preview.courseName;
  const courseFull = courseLabel(preview.platformCode, preview.courseName);
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
    // Once published, the approval it was published on still stands; the service's check
    // answers "approved" only while it waits with the Content Manager (state-copy
    // `CM-03.published-check`).
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
  const status = submission.status;
  const libraryTab: LibraryTab =
    state === 'with-academic-reviewer' || state === 'resubmitted' ? 'in-review' : 'with-vendor';
  return {
    kind,
    pill: cmSubmissionPill(status, blockers.length),
    bandFacts: [
      { key: 'formats', term: DECISION_PAGE.factFormats, value: formatsList(codes) },
      outcomes > 0
        ? { key: 'outcomes', term: DECISION_PAGE.factOutcomes, value: String(outcomes) }
        : {
            key: 'outcomes',
            term: DECISION_PAGE.factOutcomes,
            value: DECISION_PAGE.noOutcomesFact,
            quiet: true,
          },
      { key: 'version', term: DECISION_PAGE.factVersion, value: submission.content.version ?? '' },
      {
        key: 'submission',
        term: DECISION_PAGE.factSubmission,
        value: revisionFact(submission.revision),
      },
    ],
    readOnly: kind === 'read-only' || kind === 'sent' ? readOnlyOf(submission, sentBack) : null,
    libraryTab,
    approval,
    reviewerName: lastApprovalOf(submission)?.by ?? '',
    courseCode: preview.platformCode,
    courseName: preview.courseName,
    courseShort,
    courseFull,
    codes,
    checks,
    blockers,
    verdict:
      kind === 'open' || kind === 'published'
        ? {
            words: gateVerdict(kind, checks.length, blockers.length),
            tone: blockers.length > 0 ? 'no' : 'ok',
          }
        : { words: DECISION_PAGE.checkRead, tone: 'plain' },
    delivery: deliveryOf(submission, deliveryStatus(submission)),
    fromVendor: person
      ? `${submission.vendorOrganisation} · ${person}`
      : submission.vendorOrganisation,
    reviewLine: reviewLineOf(submission, approval, sentBack),
    published:
      status.state === 'published'
        ? { at: publish?.at ?? status.at, by: publish?.by ?? null }
        : null,
    sentBack,
    history: historyOf(submission, courseFull, codes),
  };
}

/** One reference option of the send back (`REFOPTS`, OD-B6-05), for the submission's formats. */
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
