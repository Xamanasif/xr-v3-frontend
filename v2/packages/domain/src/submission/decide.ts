/**
 * First-publication decisions (Appendix C M10; matrix SUB-*, LO-01, CRS-08; BC7, BC9).
 * Each decision consults `SUBMISSION_TRANSITIONS`, so no undrawn move is possible.
 */
import type { PersonActorRef, SystemActorRef } from '../roles.js';
import { inDisplayOrder, type Technology } from '../technology.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isBlank,
  notPermitted,
  ok,
  refused,
} from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId } from '../kernel/ids.js';
import { isDrawnTransition } from '../kernel/machine.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Audience } from '../roles.js';
import type { Experiment, FormatDelivery, LearningOutcome } from '../catalogue/model.js';
import {
  grantCovers,
  type PlatformRoleHolder,
  scopeCovers,
  type VendorCourseGrant,
} from '../platform-roles/platform-roles.js';
import {
  type FormatDeliveryDraft,
  type PublicationCheckItem,
  type ReturnReference,
  SUBMISSION_TRANSITIONS,
  type Submission,
  type SubmissionCommand,
  type SubmissionContent,
  type SubmissionEvent,
  type SubmissionState,
  type SubmitChecklistItem,
  type WorkflowRoutingPolicy,
} from './model.js';

/** B5-04 / B5-05: "Enter a web link that starts with https://". */
export const HTTPS_LINK = /^https:\/\/[^\s/.]+\.[^\s]+$/;

const STAFF_AND_VENDOR: readonly Audience[] = [
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
];

function entry(
  ids: IdSource,
  event: SubmissionEvent,
  now: IsoInstant,
  actor: HistoryEntry<SubmissionEvent>['actor'],
  note: string | null = null,
  visibleTo: readonly Audience[] = STAFF_AND_VENDOR,
): HistoryEntry<SubmissionEvent> {
  return historyEntry({ id: ids.next('history'), event, at: now, actor, note, visibleTo });
}

function can(
  submission: Submission | null,
  to: SubmissionState,
  command: SubmissionCommand,
): boolean {
  return isDrawnTransition(SUBMISSION_TRANSITIONS, submission?.status.state ?? null, to, command);
}

function deliveryMissing(format: Technology, delivery: FormatDeliveryDraft | undefined): string[] {
  if (format === 'web') {
    const web = delivery?.format === 'web' ? delivery : null;
    return [
      ...(web?.webLink && HTTPS_LINK.test(web.webLink.trim()) ? [] : ['web:web-link']),
      ...(isBlank(web?.browserAndComputer) ? ['web:browser-and-computer'] : []),
    ];
  }
  const pkg = delivery && delivery.format !== 'web' ? delivery : null;
  return [
    ...(isBlank(pkg?.packageLabel) ? [`${format}:package-label`] : []),
    ...(isBlank(pkg?.packageReference) && isBlank(pkg?.packageFileName)
      ? [`${format}:package`]
      : []),
    ...(isBlank(pkg?.deviceNeeded) ? [`${format}:device-need`] : []),
    ...(isBlank(pkg?.installNotes) ? [`${format}:install-notes`] : []),
  ];
}

/** VE-06: missing items with links; sends nothing (B5-05). Preview and documents are optional, but
 *  a preview label without a valid link is an error ("Add a preview link for “…”, or remove the
 *  label", B5-05; OD-B5-08). */
export function submitChecklist(content: SubmissionContent): readonly SubmitChecklistItem[] {
  const course = [
    ...(content.courseId ? [] : ['course']),
    ...(isBlank(content.name) ? ['name'] : []),
    ...(isBlank(content.summary) ? ['summary'] : []),
    ...(isBlank(content.description) ? ['description'] : []),
    ...(isBlank(content.version) ? ['version'] : []),
  ];
  const formats =
    content.formats.length === 0
      ? ['formats']
      : inDisplayOrder(content.formats).flatMap((format) =>
          deliveryMissing(format, content.delivery[format]),
        );
  const link = content.preview.link?.trim() ?? '';
  const preview =
    (!isBlank(content.preview.label) && !HTTPS_LINK.test(link)) ||
    (link !== '' && !HTTPS_LINK.test(link))
      ? ['preview-link']
      : [];
  return [
    { section: 'course-and-description', missing: course },
    { section: 'formats-and-delivery', missing: formats },
    { section: 'preview-and-documents', missing: preview },
  ];
}

export function checklistComplete(content: SubmissionContent): boolean {
  return submitChecklist(content).every((item) => item.missing.length === 0);
}

/** CM-03 publication check (B6-07 `checks[]`; OD-B6-03 — what else blocks is open). */
export function publicationCheck(submission: Submission): readonly PublicationCheckItem[] {
  const latest = submission.reviewDecisions.at(-1);
  const approved =
    submission.status.state === 'with-content-manager' &&
    latest?.decision === 'approve' &&
    latest.revision === submission.revision;
  const items = submitChecklist(submission.content);
  return [
    {
      check: 'approved-by-reviewer',
      ok: approved,
      fixHint: approved ? null : 'send-back-to-reviewer',
    },
    {
      check: 'learning-outcomes',
      ok: submission.learningOutcomes.length > 0,
      fixHint: submission.learningOutcomes.length > 0 ? null : 'send-back-to-reviewer',
    },
    {
      check: 'catalogue-details',
      ok: items[0]!.missing.length === 0,
      fixHint: items[0]!.missing.length === 0 ? null : 'send-back-to-vendor',
    },
    {
      check: 'delivery-per-format',
      ok: items[1]!.missing.length === 0,
      fixHint: items[1]!.missing.length === 0 ? null : 'send-back-to-vendor',
    },
  ];
}

/** "Stuck — nobody can act": with the Academic Reviewer while no reviewer scope covers its course
 *  ("Nobody — no Academic Reviewer has EEE ZC341 in scope", B7-06). */
export function isStuck(submission: Submission, holders: readonly PlatformRoleHolder[]): boolean {
  return (
    submission.status.state === 'with-academic-reviewer' &&
    !holders.some(
      (holder) =>
        holder.role === 'academic_reviewer' &&
        scopeCovers(holder, { courseId: submission.content.courseId }),
    )
  );
}

/** "Draft · read-only" when the draft's course is no longer one of the Vendor's (B5-06/B5-07;
 *  SUB-11; OD-B5-01 — the effect on a submission already in review is open). */
export function courseNoLongerAssigned(
  submission: Submission,
  assignedCourses: VendorCourseGrant,
): boolean {
  return (
    submission.status.state === 'draft' &&
    submission.content.courseId !== null &&
    !grantCovers(assignedCourses, submission.content.courseId)
  );
}

/** "An experiment called “<name>” already exists" — case-insensitive against the catalogue and the
 *  Vendor's own experiments, the current one excluded (B5-03; OD-B5-04). No duplicate-content rule:
 *  the two Composite Wall records stay separate (EXP-11). */
export function experimentNameTaken(name: string, otherNames: readonly string[]): boolean {
  const key = name.trim().toLocaleLowerCase('en');
  return otherNames.some((other) => other.trim().toLocaleLowerCase('en') === key);
}

interface VendorWrite {
  readonly actor: PersonActorRef;
  /** The Vendor's holder record (creator and scope). */
  readonly vendor: PlatformRoleHolder;
  /** The courses the Vendor may submit under (B5-03; CRS-08; ROLE-11 decided, PD-2). */
  readonly assignedCourses: VendorCourseGrant;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

function courseIssue(content: SubmissionContent, assigned: VendorCourseGrant) {
  return content.courseId !== null && !grantCovers(assigned, content.courseId)
    ? [{ field: 'courseId', rule: 'course-not-assigned' }]
    : [];
}

function created(input: VendorWrite, content: SubmissionContent): Submission {
  return {
    ...newMeta(input.now),
    id: input.ids.next('submission'),
    vendorHolderId: input.vendor.id,
    vendorOrganisation: input.vendor.organisation,
    status: { state: 'draft' },
    revision: 1,
    content,
    learningOutcomes: [],
    lastStepReached: 'course',
    reviewDecisions: [],
    contentManagerDecisions: [],
    overrides: [],
    firstSubmittedAt: null,
    lastResubmittedAt: null,
    history: [],
  };
}

/**
 * Save draft (SUB-02 first save, SUB-03 later saves): a name is the only field a draft save needs
 * ("Enter a name to save a draft"). The first save gives the id and writes "Draft saved · Only you
 * can see a draft."; later saves write no history (M28). A draft whose course is no longer
 * assigned is read-only (SUB-11).
 */
export function saveDraft(
  input: VendorWrite & {
    readonly submission: Submission | null;
    readonly content: SubmissionContent;
    readonly step?: Submission['lastStepReached'];
  },
): Decision<Submission> {
  const to: SubmissionState = 'draft';
  if (!can(input.submission, to, 'saveDraft'))
    return invalidState(input.submission?.status.state ?? 'none');
  if (input.submission && courseNoLongerAssigned(input.submission, input.assignedCourses)) {
    return refused('course-not-assigned');
  }
  if (isBlank(input.content.name))
    return invalidInput({ field: 'name', rule: 'required-for-draft' });
  const issues = courseIssue(input.content, input.assignedCourses);
  if (issues.length > 0) return invalidInput(...issues);
  const first = input.submission === null;
  const base = input.submission ?? created(input, input.content);
  return ok({
    ...base,
    ...(first ? {} : nextMeta(base, input.now)),
    content: input.content,
    lastStepReached: input.step ?? base.lastStepReached,
    history: first
      ? [entry(input.ids, 'draft-saved', input.now, input.actor, null, ['vendor'])]
      : base.history,
  });
}

/**
 * Submit for academic review (SUB-05; DL-1 "This sends it to the Academic Reviewer. It does not
 * publish anything."): the checklist must be complete — otherwise it lists what is missing and
 * sends nothing (B5-05). Read-only while under review (SUB-06).
 */
export function submitForReview(
  input: VendorWrite & {
    readonly submission: Submission | null;
    readonly content: SubmissionContent;
    /** Experiment names in the catalogue and the Vendor's other experiments. */
    readonly otherNames: readonly string[];
  },
): Decision<Submission> {
  if (!can(input.submission, 'with-academic-reviewer', 'submitForReview')) {
    return invalidState(input.submission?.status.state ?? 'none');
  }
  if (input.submission && courseNoLongerAssigned(input.submission, input.assignedCourses)) {
    return refused('course-not-assigned');
  }
  const courseIssues = courseIssue(input.content, input.assignedCourses);
  if (courseIssues.length > 0) return invalidInput(...courseIssues);
  if (!checklistComplete(input.content)) return refused('submit-checklist-incomplete');
  if (experimentNameTaken(input.content.name, input.otherNames))
    return invalidInput({ field: 'name', rule: 'taken' });
  const base = input.submission ?? created(input, input.content);
  return ok({
    ...base,
    ...(input.submission ? nextMeta(base, input.now) : {}),
    content: input.content,
    status: { state: 'with-academic-reviewer', since: input.now, reason: 'first-review' },
    revision: 1,
    lastStepReached: 'submit',
    firstSubmittedAt: input.now,
    history: [...base.history, entry(input.ids, 'submitted', input.now, input.actor)],
  });
}

interface ReviewerWrite {
  readonly submission: Submission;
  /** The reviewer's working set of experiment-level outcomes; it travels with the decision (LO-01). */
  readonly outcomes: readonly LearningOutcome[];
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

function wasRecheck(submission: Submission): boolean {
  return (
    submission.status.state === 'with-academic-reviewer' && submission.status.reason === 'recheck'
  );
}

/** Approve (SUB-17; DL-1 "Sends it to the Content Manager. Approving does not publish."): the whole
 *  experiment, every format; needs ≥ 1 learning outcome (OD-B6-02). */
export function approveSubmission(input: ReviewerWrite): Decision<Submission> {
  if (!can(input.submission, 'with-content-manager', 'approveSubmission')) {
    return invalidState(input.submission.status.state);
  }
  if (input.outcomes.length === 0 || input.outcomes.some((outcome) => isBlank(outcome.text))) {
    return invalidInput({ field: 'outcomes', rule: 'at-least-one' });
  }
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'with-content-manager', since: input.now },
    learningOutcomes: input.outcomes,
    reviewDecisions: [
      ...input.submission.reviewDecisions,
      {
        revision: input.submission.revision,
        decision: 'approve',
        reason: null,
        references: [],
        outcomesAtDecision: input.outcomes,
        wasRecheck: wasRecheck(input.submission),
        decidedAt: input.now,
        decidedBy: input.actor,
      },
    ],
    history: [
      ...input.submission.history,
      entry(input.ids, 'approved-by-reviewer', input.now, input.actor),
    ],
  });
}

/** Return to vendor (SUB-18; DL-2): reason required ("Add a reason so the vendor knows what to
 *  change"); "What it refers to" optional. */
export function returnSubmission(
  input: ReviewerWrite & {
    readonly reason: string;
    readonly references: readonly ReturnReference[];
  },
): Decision<Submission> {
  if (!can(input.submission, 'returned', 'returnSubmission'))
    return invalidState(input.submission.status.state);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'returned', since: input.now, by: 'academic-reviewer' },
    learningOutcomes: input.outcomes,
    reviewDecisions: [
      ...input.submission.reviewDecisions,
      {
        revision: input.submission.revision,
        decision: 'return-to-vendor',
        reason,
        references: input.references,
        outcomesAtDecision: input.outcomes,
        wasRecheck: wasRecheck(input.submission),
        decidedAt: input.now,
        decidedBy: input.actor,
      },
    ],
    history: [
      ...input.submission.history,
      entry(input.ids, 'returned-by-reviewer', input.now, input.actor, reason),
    ],
  });
}

/** Save changes while revising (SUB-08; SUB-09 course or formats may change, OD-B5-06): "Changes
 *  saved · not resubmitted yet" — no history entry (M28). */
export function saveRevision(
  input: VendorWrite & { readonly submission: Submission; readonly content: SubmissionContent },
): Decision<Submission> {
  if (!can(input.submission, 'returned', 'saveRevision'))
    return invalidState(input.submission.status.state);
  if (isBlank(input.content.name))
    return invalidInput({ field: 'name', rule: 'required-for-draft' });
  const issues = courseIssue(input.content, input.assignedCourses);
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    content: input.content,
  });
}

/** Revise & resubmit (SUB-07; DL-1 "Your changes are submitted for review. This does not publish
 *  anything."): the Vendor sees "Submitted" (revision n+1) until the workflow routes it. */
export function resubmit(
  input: VendorWrite & {
    readonly submission: Submission;
    readonly content: SubmissionContent;
    readonly otherNames: readonly string[];
  },
): Decision<Submission> {
  if (!can(input.submission, 'resubmitted', 'resubmit'))
    return invalidState(input.submission.status.state);
  const issues = courseIssue(input.content, input.assignedCourses);
  if (issues.length > 0) return invalidInput(...issues);
  if (!checklistComplete(input.content)) return refused('submit-checklist-incomplete');
  if (experimentNameTaken(input.content.name, input.otherNames))
    return invalidInput({ field: 'name', rule: 'taken' });
  const revision = input.submission.revision + 1;
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    content: input.content,
    status: { state: 'resubmitted', since: input.now },
    revision,
    lastResubmittedAt: input.now,
    history: [
      ...input.submission.history,
      entry(input.ids, 'resubmitted', input.now, input.actor, String(revision)),
    ],
  });
}

/** Route a resubmission (SUB-10, SYSTEM; OD-B5-05): only the drawn default — back to the Academic
 *  Reviewer, "Routed by the approved workflow rule." */
export function routeResubmission(input: {
  readonly submission: Submission;
  readonly routing: WorkflowRoutingPolicy;
  readonly actor: SystemActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<Submission> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:workflow-routing')
    return notPermitted('wrong-workspace');
  if (!can(input.submission, 'with-academic-reviewer', 'routeResubmission')) {
    return invalidState(input.submission.status.state);
  }
  const { reason } = input.routing.route(input.submission);
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'with-academic-reviewer', since: input.now, reason },
    history: [
      ...input.submission.history,
      entry(input.ids, 'routed', input.now, input.actor, String(input.submission.revision)),
    ],
  });
}

function delivered(format: Technology, draft: FormatDeliveryDraft | undefined): FormatDelivery {
  if (format === 'web' && draft?.format === 'web') {
    return {
      format: 'web',
      webLink: draft.webLink!.trim(),
      browserAndComputer: draft.browserAndComputer!.trim(),
      notes: draft.notes,
    };
  }
  if (draft && draft.format !== 'web' && format !== 'web') {
    return {
      format,
      packageLabel: draft.packageLabel!.trim(),
      packageReference: draft.packageReference,
      packageFileName: draft.packageFileName,
      deviceNeeded: draft.deviceNeeded!.trim(),
      installNotes: draft.installNotes!.trim(),
      notes: draft.notes,
    };
  }
  throw new Error(`Delivery for ${format} is incomplete — the publication check guards this.`);
}

/**
 * Publish — first publication (SUB-24; DL-1 "It appears in the public catalogue. It gives no one
 * access."): only once nothing is missing (SUB-25). Creates the experiment record with live version
 * = the Vendor's version label ("Live version 1.0", B7-06). No institution access, grant, licence,
 * Faculty or Student mapping is written (SUB-30; invariant 1).
 */
export function publish(input: {
  readonly submission: Submission;
  readonly experimentId: ExperimentId;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<{ readonly submission: Submission; readonly experiment: Experiment }> {
  if (!can(input.submission, 'published', 'publish'))
    return invalidState(input.submission.status.state);
  if (publicationCheck(input.submission).some((item) => !item.ok))
    return refused('publication-blocked');
  const content = input.submission.content;
  const formats = inDisplayOrder(content.formats);
  const live = {
    label: content.version!.trim(),
    liveFrom: input.now,
    liveUntil: null,
    source: {
      kind: 'first-publication' as const,
      submissionId: input.submission.id,
      revision: input.submission.revision,
    },
    catalogue: {
      name: content.name.trim(),
      summary: content.summary!.trim(),
      description: content.description!.trim(),
    },
    formats: formats.map((format) => ({
      format,
      delivery: delivered(format, content.delivery[format]),
    })),
    preview: isBlank(content.preview.link)
      ? null
      : { label: content.preview.label, link: content.preview.link!.trim() },
    documents: content.documents,
  };
  const experiment: Experiment = {
    ...newMeta(input.now),
    id: input.experimentId,
    courseId: content.courseId!,
    originSubmissionId: input.submission.id,
    vendorOrganisation: input.submission.vendorOrganisation,
    // No artwork upload is designed (D3): a newly published experiment has none (PC-31).
    artworkKey: null,
    live,
    versions: [live],
    learningOutcomes: input.submission.learningOutcomes,
    resources: [],
    publishedAt: input.now,
    publishedBy: input.actor,
    openUpdateId: null,
  };
  return ok({
    submission: {
      ...input.submission,
      ...nextMeta(input.submission, input.now),
      status: { state: 'published', at: input.now, experimentId: input.experimentId },
      contentManagerDecisions: [
        ...input.submission.contentManagerDecisions,
        { kind: 'publish', at: input.now, by: input.actor },
      ],
      history: [...input.submission.history, entry(input.ids, 'published', input.now, input.actor)],
    },
    experiment,
  });
}

interface CmSendBack {
  readonly submission: Submission;
  readonly reason: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Send back to the Academic Reviewer for a re-check (SUB-26; DL-2, reason only). */
export function sendBackToReviewer(input: CmSendBack): Decision<Submission> {
  if (!can(input.submission, 'with-academic-reviewer', 'sendBackToReviewer')) {
    return invalidState(input.submission.status.state);
  }
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'with-academic-reviewer', since: input.now, reason: 'recheck' },
    contentManagerDecisions: [
      ...input.submission.contentManagerDecisions,
      { kind: 'send-back-to-reviewer', reason, at: input.now, by: input.actor },
    ],
    history: [
      ...input.submission.history,
      entry(input.ids, 'sent-back-for-recheck', input.now, input.actor, reason),
    ],
  });
}

/** Send back to the Vendor (SUB-27; DL-2): reason required; references optional (OD-B6-05). */
export function sendBackToVendor(
  input: CmSendBack & { readonly references: readonly ReturnReference[] },
): Decision<Submission> {
  if (!can(input.submission, 'returned', 'sendBackToVendor'))
    return invalidState(input.submission.status.state);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'returned', since: input.now, by: 'content-manager' },
    contentManagerDecisions: [
      ...input.submission.contentManagerDecisions,
      {
        kind: 'send-back-to-vendor',
        reason,
        references: input.references,
        at: input.now,
        by: input.actor,
      },
    ],
    history: [
      ...input.submission.history,
      entry(input.ids, 'returned-by-content-manager', input.now, input.actor, reason),
    ],
  });
}

/**
 * Move status (override) of a stuck record (SUB-33; DL-2 "Add a reason — it is kept in the
 * history"): with the Academic Reviewer and stuck → returned to the vendor. Never into or out of
 * Published, never on a record someone can act on (SUB-34; "In the workflow — someone can act …
 * nothing to do here."). Other targets are not designed (SUB-35 OPEN). What the Vendor sees after
 * an override is not drawn (SUB-38): the entry is the Super Admin's.
 */
export function overrideStatus(input: {
  readonly submission: Submission;
  readonly holders: readonly PlatformRoleHolder[];
  readonly reason: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<Submission> {
  if (!can(input.submission, 'returned', 'overrideStatus'))
    return invalidState(input.submission.status.state);
  if (!isStuck(input.submission, input.holders)) return refused('override-not-stuck');
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.submission,
    ...nextMeta(input.submission, input.now),
    status: { state: 'returned', since: input.now, by: 'super-admin-override' },
    overrides: [
      ...input.submission.overrides,
      { from: 'with-academic-reviewer', to: 'returned', reason, at: input.now, by: input.actor },
    ],
    history: [
      ...input.submission.history,
      entry(input.ids, 'status-overridden', input.now, input.actor, reason, ['super_admin']),
    ],
  });
}
