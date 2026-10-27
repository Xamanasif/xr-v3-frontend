/**
 * §3.12 ProductionService — first publication (BC7): Vendor → Academic Reviewer → Content Manager →
 * Published (VE-03 … VE-08, RV-02 … RV-06, CM-02, CM-03, SA-12, SA-13; Flow E).
 *
 * Submitting, approving and returning publish nothing; only the Content Manager publishes, and
 * publishing writes the submission and the new experiment only — no plan, grant, licence, mapping
 * or person (BC9; invariant 1). The name check compares names, never content, so "Composite Wall
 * Conduction" and "Conduction Through a Composite Wall" stay two records (BC11). A resubmission
 * waits "resubmitted" until the approved workflow rule routes it (M-3): the route is the test seam
 * `routeResubmission`, never a product call.
 *
 * `listAllContent` (SA-12) is the approved E-alt3 phase-schedule exception (owner decision,
 * WP-0.11 §2): the WP-0.10 signature, the existing read rule (SUB-37 — the Super Admin reads every
 * submission except a draft) and the Super Admin's read-only workspace; nothing else of P6.
 */
import {
  allContentInput,
  approveSubmissionInput,
  continueStepInput,
  getEditorInput,
  libraryInput,
  listMyExperimentsInput,
  overrideStatusInput,
  type ProductionService,
  publishInput,
  type PublicExperimentPage,
  resubmitInput,
  returnSubmissionInput,
  reviewQueueInput,
  saveDraftInput,
  saveRevisionInput,
  sendBackInput,
  submitForReviewInput,
} from '@xr/contracts/draft';
import {
  type AcademicReviewDecision,
  activeScopes,
  approveSubmission,
  type ContentManagerDecision,
  type CorrectionUpdate,
  type Course,
  courseNoLongerAssigned,
  type EditorStep,
  type Experiment,
  experimentNameTaken,
  FORMAT_DISPLAY_ORDER,
  FORMAT_META,
  inDisplayOrder,
  type InputIssue,
  invalidInput,
  type IsoInstant,
  isStuck,
  type LearningOutcome,
  type PlatformRoleHolder,
  publicationCheck,
  publish,
  resubmit,
  returnSubmission,
  routeResubmission,
  saveDraft,
  systemActor,
  type RecordRef,
  saveRevision,
  scopeCovers,
  sendBackToReviewer,
  sendBackToVendor,
  overrideStatus,
  type Submission,
  type SubmissionContent,
  type SubjectOf,
  submitChecklist,
  submitForReview,
  type Technology,
  type UpdateReviewDecision,
  vendorCourseGrant,
  type VendorCourseGrant,
} from '@xr/domain';

import { experimentSlug } from '../ids/id-source.js';
import type { Call, PlatformCore } from '../platform/core.js';
import type { ResolvedPerson } from '../pipeline/actor.js';
import { command, type Op, read, refuse, settle, systemCommand } from '../pipeline/runner.js';
import { openUpdateOf } from '../world/queries.js';
import { values } from '../world/records.js';
import { asReadBy } from './correction.js';
import { courseCardOf } from './views.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

function holdersOf(op: Op): PlatformRoleHolder[] {
  return values(op.records.holders);
}

function submissionSubject(op: Op, submission: Submission | null): SubjectOf<'submission'> {
  return { kind: 'submission', submission, holders: holdersOf(op) };
}

/** The Vendor's holder record (the creator and the scope). */
function vendorOf(person: ResolvedPerson): PlatformRoleHolder {
  if (person.holder?.role !== 'vendor') refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
  return person.holder;
}

/**
 * The courses the Vendor may submit under (B5-03; ROLE-11 decided, PD-2): "All experiments" is
 * every course that exists now, so a course that does not exist is never one of them (the domain
 * then answers `course-not-assigned`); no active scope is no course (PD-3).
 */
function assignedCourses(
  op: Op,
  holder: PlatformRoleHolder,
): Extract<VendorCourseGrant, { readonly kind: 'listed' }> {
  const grant = vendorCourseGrant(holder);
  return grant.kind === 'any-course'
    ? { kind: 'listed', courseIds: values(op.records.courses).map((course) => course.id) }
    : grant;
}

/** May this person see the submission? Only its creator among Vendors (SUB-14; SUB-15, PD-1). */
function seeSubmission(op: Op, person: ResolvedPerson, submission: Submission): void {
  op.see(person, { kind: 'submission', submission });
}

/** Names the name check compares with: the catalogue and the Vendor's other experiments (B5-03). */
function otherNames(op: Op, holder: PlatformRoleHolder, current: string | null): string[] {
  return [
    ...values(op.records.experiments).map((experiment) => experiment.live.catalogue.name),
    ...values(op.records.submissions)
      .filter((candidate) => candidate.vendorHolderId === holder.id && candidate.id !== current)
      .map((candidate) => candidate.content.name),
  ];
}

/** The Vendor write context the domain decisions take. */
function vendorWrite(op: Op, person: ResolvedPerson) {
  const vendor = vendorOf(person);
  return {
    actor: person.ref,
    vendor,
    assignedCourses: assignedCourses(op, vendor),
    now: op.now,
    ids: op.ids,
  };
}

/** The submission an editor call names, or `null` for an unsaved new experiment. */
function editorSubmission(op: Op, person: ResolvedPerson, rawId: unknown): Submission | null {
  if (rawId === null || rawId === undefined) return null;
  const submission = op.found(op.records.submissions[op.idText(rawId)]);
  seeSubmission(op, person, submission);
  return submission;
}

/** The reviewer's working set of outcomes; an outcome kept word for word keeps its id. */
function outcomesOf(op: Op, submission: Submission, texts: readonly string[]): LearningOutcome[] {
  return texts.map(
    (text) =>
      submission.learningOutcomes.find((outcome) => outcome.text === text) ?? {
        id: op.ids.next('learningOutcome'),
        text,
      },
  );
}

function courseOf(op: Op, courseId: string | null): Course | null {
  return courseId ? (op.records.courses[courseId] ?? null) : null;
}

/** The values the Vendor form's messages name: the chosen course's code and the name typed. */
function vendorParams(op: Op, content: SubmissionContent) {
  return (issue: InputIssue): Readonly<Record<string, string>> => {
    if (issue.field === 'courseId') {
      const course = courseOf(op, content.courseId);
      return { code: course?.platformCode ?? course?.name ?? content.courseId ?? '' };
    }
    return issue.field === 'name' ? { name: content.name.trim() } : {};
  };
}

const NEXT_STEP: Readonly<Record<'course' | 'formats' | 'preview', EditorStep>> = {
  course: 'formats',
  formats: 'preview',
  preview: 'submit',
};

/**
 * The content as stored data, one row per field (the keys follow the submit checklist's own
 * vocabulary). Read by "What changed in revision n" only.
 */
function contentRows(op: Op, content: SubmissionContent): Map<string, string> {
  const rows = new Map<string, string>();
  rows.set('course', courseOf(op, content.courseId)?.name ?? content.courseId ?? '');
  rows.set('name', content.name);
  rows.set('summary', content.summary ?? '');
  rows.set('description', content.description ?? '');
  rows.set('version', content.version ?? '');
  rows.set(
    'formats',
    inDisplayOrder(content.formats)
      .map((format) => FORMAT_META[format].code)
      .join(' · '),
  );
  for (const format of FORMAT_DISPLAY_ORDER) {
    const delivery = content.delivery[format];
    if (format === 'web') {
      const web = delivery?.format === 'web' ? delivery : null;
      rows.set('web:web-link', web?.webLink ?? '');
      rows.set('web:browser-and-computer', web?.browserAndComputer ?? '');
      rows.set('web:notes', web?.notes ?? '');
      continue;
    }
    const pkg = delivery && delivery.format !== 'web' ? delivery : null;
    rows.set(`${format}:package-label`, pkg?.packageLabel ?? '');
    rows.set(`${format}:package`, pkg?.packageReference ?? pkg?.packageFileName ?? '');
    rows.set(`${format}:device-need`, pkg?.deviceNeeded ?? '');
    rows.set(`${format}:install-notes`, pkg?.installNotes ?? '');
    rows.set(`${format}:notes`, pkg?.notes ?? '');
  }
  rows.set('preview-label', content.preview.label ?? '');
  rows.set('preview-link', content.preview.link ?? '');
  rows.set('documents', content.documents.map((entry) => entry.fileName).join(', '));
  return rows;
}

/** RV-03 "What changed in revision n": only what the Vendor changed since the revision before. */
function whatChanged(op: Op, submission: Submission) {
  if (submission.revision < 2) return [];
  const before = op.world.sentContent[submission.id]?.[submission.revision - 2];
  if (!before) return [];
  const was = contentRows(op, before);
  const now = contentRows(op, submission.content);
  return [...now].flatMap(([key, value]) =>
    (was.get(key) ?? '') === value ? [] : [{ field: key, was: was.get(key) ?? '', now: value }],
  );
}

/** The decision that returned it to the Vendor (shown above the editor, VE-07 / VE-08). */
function lastReturn(
  submission: Submission,
): AcademicReviewDecision | ContentManagerDecision | null {
  if (submission.status.state !== 'returned') return null;
  if (submission.status.by === 'academic-reviewer') {
    return (
      submission.reviewDecisions.findLast((decision) => decision.decision === 'return-to-vendor') ??
      null
    );
  }
  if (submission.status.by === 'content-manager') {
    return (
      submission.contentManagerDecisions.findLast(
        (decision) => decision.kind === 'send-back-to-vendor',
      ) ?? null
    );
  }
  // What the Vendor sees after an override is not drawn (SUB-38).
  return null;
}

function guardsOf(op: Op, submission: Submission, assigned: VendorCourseGrant) {
  return {
    courseNoLongerAssigned: courseNoLongerAssigned(submission, assigned),
    stuck: isStuck(submission, holdersOf(op)),
    publicationCheck: [...publicationCheck(submission)],
    submitChecklist: submitChecklist(submission.content).map((item) => ({
      section: item.section,
      missing: [...item.missing],
    })),
  };
}

function personName(
  by: { readonly kind: string } & Partial<Record<'displayName' | 'name', string>>,
) {
  return by.displayName ?? by.name ?? '';
}

/** RV-02 "who" and sub-line words — pre-rendered (PC-13 provisional) as the boards draw them. */
function queueWordsOf(submission: Submission): {
  readonly subLine: string;
  readonly type: 'new' | 'recheck';
} {
  const status = submission.status;
  if (status.state === 'with-academic-reviewer' && status.reason === 'recheck') {
    return { subLine: 'Back from the Content Manager for a re-check', type: 'recheck' };
  }
  if (status.state === 'with-academic-reviewer' && status.reason === 'resubmission') {
    return { subLine: `Resubmitted · revision ${submission.revision}`, type: 'new' };
  }
  return {
    subLine:
      submission.learningOutcomes.length === 0
        ? 'New submission · no learning outcomes yet'
        : 'New submission',
    type: 'new',
  };
}

/** SA-12 "who can act" — pre-rendered words (PC-13 provisional) as B7-06 draws them. */
function whoCanAct(op: Op, submission: Submission, course: Course | null): string | null {
  const holders = holdersOf(op);
  const covering = (role: PlatformRoleHolder['role']) =>
    holders.filter(
      (holder) =>
        holder.role === role && scopeCovers(holder, { courseId: submission.content.courseId }),
    );
  switch (submission.status.state) {
    case 'with-academic-reviewer': {
      const reviewers = covering('academic_reviewer');
      if (reviewers.length === 0)
        return `Nobody — no Academic Reviewer has ${course?.platformCode ?? course?.name ?? 'this course'} in scope`;
      return reviewers.map((holder) => `${holder.name} · Academic Reviewer`).join(', ');
    }
    case 'with-content-manager': {
      const managers = covering('content_manager');
      return managers.length === 0
        ? null
        : managers.map((holder) => `${holder.name} · Content Manager`).join(', ');
    }
    case 'returned': {
      const vendor = op.records.holders[submission.vendorHolderId];
      return vendor ? `${vendor.name} · ${vendor.organisation}` : null;
    }
    default:
      return null;
  }
}

function formatsOf(content: SubmissionContent): Technology[] {
  return inDisplayOrder(content.formats);
}

/** CM-03's catalogue preview: the page as publishing would list it (the live view, BC9). */
function previewPage(op: Op, submission: Submission): PublicExperimentPage {
  const content = submission.content;
  const course = op.found(courseOf(op, content.courseId));
  const area = op.found(op.records.areas[course.areaId]);
  const formats = formatsOf(content);
  // A published submission names its experiment; otherwise the id publishing would give it.
  const status = submission.status;
  return {
    experimentId:
      status.state === 'published'
        ? status.experimentId
        : (experimentSlug(content.name, (id) =>
            Object.hasOwn(op.records.experiments, id),
          ) as Experiment['id']),
    name: content.name,
    summary: content.summary ?? '',
    courseId: course.id,
    courseName: course.name,
    platformCode: course.platformCode,
    availableIn: formats,
    // Publishing assigns no artwork (no upload is designed, D3; PC-31): the preview shows none.
    artworkKey: null,
    description: content.description ?? '',
    areaName: area.name,
    learningOutcomes: submission.learningOutcomes.map((outcome) => outcome.text),
    formats: formats.map((format) => {
      const delivery = content.delivery[format];
      return {
        format,
        howItRuns: FORMAT_META[format].howItRuns,
        deviceNeeds:
          (delivery?.format === 'web' ? delivery.browserAndComputer : delivery?.deviceNeeded) ?? '',
      };
    }),
    preview: content.preview.link
      ? { label: content.preview.label, link: content.preview.link }
      : null,
    // OD-B7-05 is open (PC-14).
    versionLabel: null,
  };
}

/** SA-12 "Published · version 1.2 · live since 3 Jul 2026" (PC-71). */
function liveOf(experiment: Experiment) {
  return { label: experiment.live.label, since: experiment.live.liveFrom };
}

/** The state of the experiment's open correction, if this reader may see it (PC-71). */
function visibleUpdateState(op: Op, person: ResolvedPerson, experiment: Experiment) {
  const id = visibleOpenUpdateId(op, person, experiment);
  return id ? (op.records.updates[id]?.state ?? null) : null;
}

/**
 * SA-13's facts beside the record (PC-71): who can act (SA-12's words), the course, the open
 * correction where the reader may see it, and — for a stuck record — the reviewer scopes over its
 * course that were withdrawn (B7-06 f1).
 */
function recordFacts(
  op: Op,
  person: ResolvedPerson,
  submission: Submission | null,
  experiment: Experiment | null,
) {
  const courseId = submission?.content.courseId ?? experiment?.courseId ?? null;
  const course = courseOf(op, courseId);
  const updateId = experiment ? visibleOpenUpdateId(op, person, experiment) : null;
  const stuck = submission ? isStuck(submission, holdersOf(op)) : false;
  const withdrawn = stuck
    ? holdersOf(op)
        .filter((holder) => holder.role === 'academic_reviewer')
        .flatMap((holder) =>
          holder.scopes.flatMap((scope) =>
            scope.withdrawal &&
            scope.supersededAt === null &&
            scope.target.kind === 'course' &&
            scope.target.courseId === courseId
              ? [
                  {
                    holderName: holder.name,
                    at: scope.withdrawal.at,
                    reason: scope.withdrawal.reason,
                  },
                ]
              : [],
          ),
        )
    : [];
  return {
    whoCanAct: submission ? whoCanAct(op, submission, course) : null,
    courseCode: course?.platformCode ?? null,
    courseName: course?.name ?? null,
    openUpdate:
      updateId && op.records.updates[updateId]
        ? asReadBy(op.records.updates[updateId], person)
        : null,
    withdrawnReviewerScopes: withdrawn,
  };
}

/** The experiment's open correction, if this reader may see it (`canRead` update; UPD-18, UPD-26). */
function visibleOpenUpdateId(op: Op, person: ResolvedPerson, experiment: Experiment) {
  const update = openUpdateOf(op.records, experiment.id);
  return update && op.canSee(person, { kind: 'update', update, experiment }) ? update.id : null;
}

/** The experiment as this reader sees it: an open correction it may not see is not named. */
function withVisibleUpdate(op: Op, person: ResolvedPerson, experiment: Experiment): Experiment {
  if (experiment.openUpdateId === null) return experiment;
  const update = op.records.updates[experiment.openUpdateId];
  return update && op.canSee(person, { kind: 'update', update, experiment })
    ? experiment
    : { ...experiment, openUpdateId: null };
}

// ---- Phase 5 reads (VE-01, VE-02, the editor, RV-01, CM-01, CM-04) ----

/** The Vendor's own records — "Every experiment you created" (B5-02); never a colleague's (PD-1). */
function myExperiments(op: Op, person: ResolvedPerson, holder: PlatformRoleHolder): Submission[] {
  return values(op.records.submissions)
    .filter((submission) => submission.vendorHolderId === holder.id)
    .filter((submission) => op.canSee(person, { kind: 'submission', submission }));
}

type VendorStatus =
  | 'draft'
  | 'submitted'
  | 'with-academic-reviewer'
  | 'returned'
  | 'with-content-manager'
  | 'published';

/**
 * The status the Vendor reads (B5-02's filter): "Submitted" after a resubmit until the record moves
 * on (B5-06 f4; M-3), "With Academic Reviewer" for a first review or a re-check.
 */
function vendorStatusOf(submission: Submission): VendorStatus {
  const status = submission.status;
  switch (status.state) {
    case 'resubmitted':
      return 'submitted';
    case 'with-academic-reviewer':
      return submission.revision > 1 && status.reason === 'resubmission'
        ? 'submitted'
        : 'with-academic-reviewer';
    default:
      return status.state;
  }
}

/** Newest change first (B5-02 "Status · last change"). */
function newestFirst(a: { readonly updatedAt: string }, b: { readonly updatedAt: string }) {
  return a.updatedAt === b.updatedAt ? 0 : a.updatedAt < b.updatedAt ? 1 : -1;
}

/** The decision that returned a record to the Vendor, as VE-01 names it. */
function returnFacts(submission: Submission) {
  const decision = lastReturn(submission);
  if (!decision) return null;
  return 'decision' in decision
    ? { by: 'academic-reviewer' as const, at: decision.decidedAt, reason: decision.reason ?? '' }
    : decision.kind === 'send-back-to-vendor'
      ? { by: 'content-manager' as const, at: decision.at, reason: decision.reason }
      : null;
}

/** The scope line's words of one active scope (OD-B6-01): a course code, else the name. */
function scopeLineOf(op: Op, holder: PlatformRoleHolder): { codes: string[]; all: boolean } {
  const codes: string[] = [];
  let all = false;
  for (const scope of activeScopes(holder)) {
    if (scope.target.kind === 'all') all = true;
    else if (scope.target.kind === 'course') {
      const course = op.records.courses[scope.target.courseId];
      codes.push(course?.platformCode ?? course?.name ?? scope.target.courseId);
    } else {
      const experiment = op.records.experiments[scope.target.experimentId];
      codes.push(experiment?.live.catalogue.name ?? scope.target.experimentId);
    }
  }
  return { codes, all };
}

/** The approval a record carries now (the last "approve"). */
function approvalOf(submission: Submission): AcademicReviewDecision | null {
  return submission.reviewDecisions.findLast((decision) => decision.decision === 'approve') ?? null;
}

/** Oldest first by an instant. */
function byInstant<T>(at: (row: T) => string) {
  return (a: T, b: T) => (at(a) === at(b) ? 0 : at(a) < at(b) ? -1 : 1);
}

type LibraryTab = 'ready' | 'in-review' | 'with-vendor' | 'published';

/** Where a submission sits in the Content library (B6-06 f1); a draft is the Vendor's only. */
function libraryTabOf(submission: Submission): LibraryTab | null {
  switch (submission.status.state) {
    case 'with-content-manager':
      return 'ready';
    case 'with-academic-reviewer':
    case 'resubmitted':
      return 'in-review';
    case 'returned':
      return 'with-vendor';
    default:
      return null;
  }
}

/**
 * The record as a reader other than its Vendor sees it: while it is back with the Vendor, the
 * content it was last sent with — never the Vendor's saved, not-yet-resubmitted revision (a
 * revision is the Vendor's until it is resubmitted; independent review, Phase 5). The Vendor, and
 * every other state, read the record as it is.
 */
function asSentFor(op: Op, person: ResolvedPerson, submission: Submission): Submission {
  if (person.role === 'vendor' || submission.status.state !== 'returned') return submission;
  const sent = op.world.sentContent[submission.id]?.[submission.revision - 1];
  return sent ? { ...submission, content: sent } : submission;
}

/** RV-02's items (and RV-01's): submissions and updates with the reviewer, oldest first. */
function reviewQueueOf(
  op: Op,
  person: ResolvedPerson,
  accepted: {
    readonly type?: 'new' | 'update' | 'recheck';
    readonly courseId?: string;
    readonly search?: string;
  },
) {
  const search = accepted.search?.trim().toLocaleLowerCase('en') ?? '';
  const submissions = values(op.records.submissions)
    .filter((submission) => submission.status.state === 'with-academic-reviewer')
    .filter((submission) => op.canSee(person, { kind: 'submission', submission }))
    .map((submission) => {
      const words = queueWordsOf(submission);
      const course = courseOf(op, submission.content.courseId);
      return {
        ref: { kind: 'SUB' as const, id: submission.id },
        name: submission.content.name,
        courseId: submission.content.courseId,
        courseCode: course?.platformCode ?? null,
        who: submission.vendorOrganisation,
        subLine: words.subLine,
        type: words.type,
        formats: formatsOf(submission.content),
        waitingSince:
          submission.status.state === 'with-academic-reviewer'
            ? submission.status.since
            : submission.updatedAt,
      };
    });
  const updates = values(op.records.updates)
    .filter((update) => update.state === 'in-academic-review')
    .flatMap((update) => {
      const experiment = op.records.experiments[update.experimentId];
      if (!experiment || !op.canSee(person, { kind: 'update', update, experiment })) return [];
      const course = courseOf(op, experiment.courseId);
      return [
        {
          ref: { kind: 'UPD' as const, id: update.id },
          name: experiment.live.catalogue.name,
          courseId: experiment.courseId,
          courseCode: course?.platformCode ?? null,
          who: `${personName(update.startedBy)} · Content Manager`,
          subLine:
            `Correction to the live version ${update.baseVersionLabel} → ${update.versionLabel ?? ''}`.trim(),
          type: 'update' as const,
          formats: inDisplayOrder(experiment.live.formats.map((entry) => entry.format)),
          waitingSince: update.sentForReviewAt ?? update.updatedAt,
        },
      ];
    });
  return [...submissions, ...updates]
    .filter((item) => !accepted.type || item.type === accepted.type)
    .filter((item) => !accepted.courseId || item.courseId === accepted.courseId)
    .filter(
      (item) =>
        search === '' ||
        item.name.toLocaleLowerCase('en').includes(search) ||
        (item.courseCode ?? '').toLocaleLowerCase('en').includes(search),
    )
    .sort((a, b) =>
      a.waitingSince === b.waitingSince ? 0 : a.waitingSince < b.waitingSince ? -1 : 1,
    )
    .map(({ courseId: _course, ...item }) => item);
}

/** Two receipts' record references, each named once. */
function joinedRefs(
  first: readonly RecordRef[],
  second: readonly RecordRef[],
): readonly RecordRef[] {
  const seen = new Set(first.map((ref) => JSON.stringify(ref)));
  return [...first, ...second.filter((ref) => !seen.has(JSON.stringify(ref)))];
}

/**
 * The sample platform's `system:workflow-routing` stand-in in a local prototype build (PC-66, owner
 * answer to M-3): right after a resubmit, the record is routed by the only route the domain's
 * routing policy can answer — back to the Academic Reviewer as revision n (B5-08 "Routed by the
 * approved workflow rule"). It never skips the reviewer and names no gate in any copy.
 */
export function routeByDrawnDefault(
  core: PlatformCore,
  submissionId: string,
): readonly RecordRef[] {
  const outcome = systemCommand(core, 'WorkflowRouting.drawnDefault', 'sample-standin', (op) => {
    const submission = op.found(op.records.submissions[submissionId]);
    const actor = systemActor('system:workflow-routing');
    const next = settle(
      routeResubmission({ submission, routing: core.routing, actor, now: op.now, ids: op.ids }),
    );
    op.tx.put('submissions', next.id, next);
    return { value: next, decision: 'routeResubmission', actor };
  });
  return outcome.ok ? outcome.changed : [];
}

export function productionPort(call: Call): ProductionService {
  return {
    getVendorOverview: () =>
      read(call, 'ProductionService.getVendorOverview', (op) => {
        const person = op.person();
        const vendor = vendorOf(person);
        const assigned = assignedCourses(op, vendor);
        const mine = myExperiments(op, person, vendor);
        const counts = {
          draft: 0,
          'with-academic-reviewer': 0,
          'with-content-manager': 0,
          published: 0,
        };
        for (const submission of mine) {
          const status = vendorStatusOf(submission);
          // A resubmission the Vendor reads as "Submitted" is not counted: the line would name the
          // next gate (M-3; B5-01's script counts with_rv and recheck only).
          if (status === 'draft') counts.draft += 1;
          else if (status === 'with-academic-reviewer') counts['with-academic-reviewer'] += 1;
          else if (status === 'with-content-manager') counts['with-content-manager'] += 1;
          else if (status === 'published') counts.published += 1;
        }
        const returned = mine
          .filter((submission) => submission.status.state === 'returned')
          .flatMap((submission) => {
            const facts = returnFacts(submission);
            return facts
              ? [
                  {
                    kind: 'returned' as const,
                    submissionId: submission.id,
                    name: submission.content.name,
                    ...facts,
                  },
                ]
              : [];
          })
          .sort(byInstant((row) => row.at));
        // A draft whose course is no longer assigned opens read-only (OD-B5-01): nothing to finish.
        const drafts = mine
          .filter(
            (submission) =>
              submission.status.state === 'draft' && !courseNoLongerAssigned(submission, assigned),
          )
          .map((submission) => ({
            kind: 'draft' as const,
            submissionId: submission.id,
            name: submission.content.name,
            savedAt: submission.updatedAt,
          }))
          .sort(byInstant((row) => row.savedAt));
        return {
          statusCounts: counts,
          attention: [...returned, ...drafts],
          hasExperiments: mine.length > 0,
        };
      }),

    listMyExperiments: (filter) =>
      read(call, 'ProductionService.listMyExperiments', (op) => {
        const person = op.person();
        const vendor = vendorOf(person);
        const assigned = assignedCourses(op, vendor);
        const accepted = op.parse(listMyExperimentsInput, filter);
        const search = accepted.search?.trim().toLocaleLowerCase('en') ?? '';
        return myExperiments(op, person, vendor)
          .filter(
            (submission) => !accepted.status || vendorStatusOf(submission) === accepted.status,
          )
          .filter((submission) => {
            if (search === '') return true;
            const course = courseOf(op, submission.content.courseId);
            return [
              submission.content.name,
              submission.id,
              course?.platformCode ?? '',
              course?.name ?? '',
            ].some((text) => text.toLocaleLowerCase('en').includes(search));
          })
          .sort(newestFirst)
          .map((submission) => ({ submission, guards: guardsOf(op, submission, assigned) }));
      }),

    getEditor: (input) =>
      read(call, 'ProductionService.getEditor', (op) => {
        const person = op.person();
        const vendor = vendorOf(person);
        const assigned = assignedCourses(op, vendor);
        const existing = editorSubmission(op, person, field(input, 'id'));
        op.parse(getEditorInput, input);
        const subject = submissionSubject(op, existing);
        if (existing === null) op.allow(person, 'submission.start', subject);
        // Only a draft or a returned record is edited; anything else — and a record whose course
        // is no longer assigned (OD-B5-01) — opens read-only.
        const editable =
          existing === null ||
          (existing.status.state === 'draft' &&
            op.canDo(person, 'submission.save-draft', subject)) ||
          (existing.status.state === 'returned' &&
            op.canDo(person, 'submission.save-revision', subject));
        const courses = assigned.courseIds
          .map((courseId) => op.records.courses[courseId])
          .filter((course): course is Course => course !== undefined)
          .map((course) => courseCardOf(op.records, course));
        return {
          submission: existing,
          assignedCourses: courses,
          readOnly: !editable || (existing !== null && courseNoLongerAssigned(existing, assigned)),
        };
      }),

    getReviewerOverview: () =>
      read(call, 'ProductionService.getReviewerOverview', (op) => {
        const person = op.person();
        if (person.holder?.role !== 'academic_reviewer')
          refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
        const scope = scopeLineOf(op, person.holder);
        const waiting = reviewQueueOf(op, person, {}).map((item) => {
          const submission = item.ref.kind === 'SUB' ? op.records.submissions[item.ref.id] : null;
          const recheck =
            submission && item.type === 'recheck'
              ? submission.contentManagerDecisions.findLast(
                  (decision) => decision.kind === 'send-back-to-reviewer',
                )
              : undefined;
          return {
            ...item,
            reason: recheck && recheck.kind === 'send-back-to-reviewer' ? recheck.reason : null,
          };
        });
        return { scopeLine: scope.codes, scopeAll: scope.all, waiting };
      }),

    getContentManagerOverview: () =>
      read(call, 'ProductionService.getContentManagerOverview', (op) => {
        const person = op.person();
        if (person.holder?.role !== 'content_manager')
          refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
        const visible = values(op.records.submissions).filter((submission) =>
          op.canSee(person, { kind: 'submission', submission }),
        );
        const ready = visible
          .filter((submission) => submission.status.state === 'with-content-manager')
          .flatMap((submission) => {
            const approval = approvalOf(submission);
            return approval
              ? [
                  {
                    kind: 'ready-to-publish' as const,
                    submissionId: submission.id,
                    name: submission.content.name,
                    courseCode: courseOf(op, submission.content.courseId)?.platformCode ?? null,
                    approvedAt: approval.decidedAt,
                  },
                ]
              : [];
          })
          .sort(byInstant((row) => row.approvedAt));
        const updates = values(op.records.updates).flatMap((update) => {
          const experiment = op.records.experiments[update.experimentId];
          return experiment && op.canSee(person, { kind: 'update', update, experiment })
            ? [{ update, name: experiment.live.catalogue.name }]
            : [];
        });
        const returnedUpdates = updates
          .filter(({ update }) => update.state === 'returned')
          .map(({ update, name }) => {
            const decision = update.reviewDecisions.findLast(
              (entry) => entry.decision === 'return-to-content-manager',
            );
            return {
              kind: 'update-returned' as const,
              updateId: update.id,
              name,
              versionLabel: update.versionLabel,
              returnedAt: decision?.at ?? update.updatedAt,
              reason: decision?.reason ?? '',
            };
          })
          .sort(byInstant((row) => row.returnedAt));
        const rechecks = visible
          .filter(
            (submission) =>
              submission.status.state === 'with-academic-reviewer' &&
              submission.status.reason === 'recheck',
          )
          .map((submission) => {
            const sent = submission.contentManagerDecisions.findLast(
              (decision) => decision.kind === 'send-back-to-reviewer',
            );
            return {
              kind: 'recheck' as const,
              submissionId: submission.id,
              name: submission.content.name,
              sentAt: sent?.at ?? submission.updatedAt,
              at: sent?.at ?? submission.updatedAt,
            };
          });
        type WithOthersRow = (
          | { kind: 'recheck'; submissionId: Submission['id']; name: string; sentAt: IsoInstant }
          | {
              kind: 'update-in-review';
              updateId: CorrectionUpdate['id'];
              name: string;
              versionLabel: string | null;
              sentAt: IsoInstant;
            }
          | {
              kind: 'update-awaiting-release';
              updateId: CorrectionUpdate['id'];
              name: string;
              versionLabel: string | null;
              approvedAt: IsoInstant;
            }
          | {
              kind: 'update-on-hold';
              updateId: CorrectionUpdate['id'];
              name: string;
              versionLabel: string | null;
              heldAt: IsoInstant;
              liveLabel: string;
            }
        ) & { at: IsoInstant };
        const elsewhere = updates.flatMap(({ update, name }): WithOthersRow[] => {
          if (update.state === 'in-academic-review') {
            const sentAt = update.sentForReviewAt ?? update.updatedAt;
            return [
              {
                kind: 'update-in-review' as const,
                updateId: update.id,
                name,
                versionLabel: update.versionLabel,
                sentAt,
                at: sentAt,
              },
            ];
          }
          if (update.state === 'awaiting-release-decision') {
            const approvedAt =
              update.reviewDecisions.findLast((entry) => entry.decision === 'approve')?.at ??
              update.updatedAt;
            return [
              {
                kind: 'update-awaiting-release' as const,
                updateId: update.id,
                name,
                versionLabel: update.versionLabel,
                approvedAt,
                at: approvedAt,
              },
            ];
          }
          if (update.state === 'on-hold' && update.hold) {
            return [
              {
                kind: 'update-on-hold' as const,
                updateId: update.id,
                name,
                versionLabel: update.versionLabel,
                heldAt: update.hold.at,
                liveLabel: update.baseVersionLabel,
                at: update.hold.at,
              },
            ];
          }
          return [];
        });
        // "With others" newest first (B6-05 f0: 25 Aug, 25 Aug, 20 Aug).
        const withOthers = [...(rechecks as WithOthersRow[]), ...elsewhere]
          .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? 1 : -1))
          .map(({ at: _at, ...row }) => row);
        return { attention: [...ready, ...returnedUpdates], withOthers };
      }),

    getLibrary: (filter) =>
      read(call, 'ProductionService.getLibrary', (op) => {
        const person = op.person();
        if (person.holder?.role !== 'content_manager')
          refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
        const accepted = op.parse(libraryInput, filter);
        const search = accepted.search?.trim().toLocaleLowerCase('en') ?? '';
        const matches = (texts: readonly (string | null)[]) =>
          search === '' ||
          texts.some((text) => (text ?? '').toLocaleLowerCase('en').includes(search));
        const submissions = values(op.records.submissions)
          .filter((submission) => op.canSee(person, { kind: 'submission', submission }))
          .flatMap((submission) => {
            const tab = libraryTabOf(submission);
            return tab ? [{ submission, tab }] : [];
          });
        const experiments = values(op.records.experiments).filter((experiment) =>
          op.canSee(person, { kind: 'published-experiment', experiment }),
        );
        const counts = {
          ready: submissions.filter((entry) => entry.tab === 'ready').length,
          'in-review': submissions.filter((entry) => entry.tab === 'in-review').length,
          'with-vendor': submissions.filter((entry) => entry.tab === 'with-vendor').length,
          published: experiments.length,
        };
        if (accepted.tab === 'published') {
          return {
            counts,
            rows: experiments
              .map((experiment) => {
                const code = courseOf(op, experiment.courseId)?.platformCode ?? null;
                const updateId = visibleOpenUpdateId(op, person, experiment);
                const update = updateId ? op.records.updates[updateId] : undefined;
                return {
                  kind: 'experiment' as const,
                  experiment: withVisibleUpdate(op, person, experiment),
                  courseCode: code,
                  openUpdate: update ? { id: update.id, state: update.state } : null,
                };
              })
              .filter((row) =>
                matches([row.experiment.live.catalogue.name, row.courseCode, row.experiment.id]),
              )
              .sort(byInstant((row) => row.experiment.publishedAt)),
          };
        }
        return {
          counts,
          rows: submissions
            .filter((entry) => entry.tab === accepted.tab)
            .map(({ submission: record }) => asSentFor(op, person, record))
            .map((submission) => ({
              kind: 'submission' as const,
              submission,
              courseCode: courseOf(op, submission.content.courseId)?.platformCode ?? null,
              approvedAt:
                submission.status.state === 'with-content-manager'
                  ? (approvalOf(submission)?.decidedAt ?? null)
                  : null,
            }))
            .filter((row) =>
              matches([row.submission.content.name, row.courseCode, row.submission.id]),
            )
            .sort(byInstant((row) => row.approvedAt ?? row.submission.updatedAt)),
        };
      }),

    saveDraft: (input) =>
      command(call, 'ProductionService.saveDraft', (op) => {
        const person = op.person();
        const existing = editorSubmission(op, person, field(input, 'id'));
        const subject = submissionSubject(op, existing);
        op.allow(person, existing ? 'submission.save-draft' : 'submission.start', subject);
        const accepted = op.parse(saveDraftInput, input);
        if (
          existing &&
          JSON.stringify(accepted.content.documents) !== JSON.stringify(existing.content.documents)
        ) {
          op.allow(person, 'submission.edit-attachments', subject);
        }
        if (existing) op.rev(existing, accepted.expectedRev);
        const submission = op.decide(
          saveDraft({
            ...vendorWrite(op, person),
            submission: existing,
            content: accepted.content,
            step: accepted.step,
          }),
          input,
          vendorParams(op, accepted.content),
        );
        op.tx.put('submissions', submission.id, submission);
        return { value: submission, decision: 'saveDraft', actor: person.ref };
      }),

    continueStep: (input) =>
      read(call, 'ProductionService.continueStep', (op) => {
        const person = op.person();
        const existing = editorSubmission(op, person, field(input, 'id'));
        const subject = submissionSubject(op, existing);
        const state = existing?.status.state ?? null;
        if (state === null) op.allow(person, 'submission.start', subject);
        else if (state === 'draft') op.allow(person, 'submission.save-draft', subject);
        else if (state === 'returned') op.allow(person, 'submission.save-revision', subject);
        else refuse({ kind: 'invalid-state', current: state });
        const accepted = op.parse(continueStepInput, input);
        if (accepted.from === 'course') {
          const write = vendorWrite(op, person);
          // The course and the name need the records — the domain answers both (B5-03).
          const issues: InputIssue[] = [];
          const course =
            existing?.status.state === 'returned'
              ? saveRevision({ ...write, submission: existing, content: accepted.content })
              : saveDraft({ ...write, submission: existing, content: accepted.content });
          if (!course.ok && course.refusal.kind === 'validation-failed') {
            issues.push(...course.refusal.issues.filter((issue) => issue.field === 'courseId'));
          } else if (!course.ok) {
            op.decide(course, input, vendorParams(op, accepted.content));
          }
          if (
            experimentNameTaken(
              accepted.content.name,
              otherNames(op, write.vendor, existing?.id ?? null),
            )
          ) {
            issues.push({ field: 'name', rule: 'taken' });
          }
          if (issues.length > 0)
            op.decide(invalidInput(...issues), input, vendorParams(op, accepted.content));
        }
        return { next: NEXT_STEP[accepted.from] };
      }),

    submitForReview: (input) =>
      command(call, 'ProductionService.submitForReview', (op) => {
        const person = op.person();
        const existing = editorSubmission(op, person, field(input, 'id'));
        op.allow(person, 'submission.submit-for-review', submissionSubject(op, existing));
        const accepted = op.parse(submitForReviewInput, input);
        if (existing) op.rev(existing, accepted.expectedRev);
        const write = vendorWrite(op, person);
        const submission = op.decide(
          submitForReview({
            ...write,
            submission: existing,
            content: accepted.content,
            otherNames: otherNames(op, write.vendor, existing?.id ?? null),
          }),
          input,
          vendorParams(op, accepted.content),
        );
        op.tx.put('submissions', submission.id, submission);
        op.keepSent(submission);
        return { value: submission, decision: 'submitForReview', actor: person.ref };
      }),

    getRecord: (id) =>
      read(call, 'ProductionService.getRecord', (op) => {
        const person = op.person();
        const submission = op.found(op.records.submissions[op.idText(id)]);
        seeSubmission(op, person, submission);
        return {
          submission,
          guards: guardsOf(op, submission, assignedCourses(op, vendorOf(person))),
          lastReturn: lastReturn(submission),
        };
      }),

    saveRevision: (input) =>
      command(call, 'ProductionService.saveRevision', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        op.allow(person, 'submission.save-revision', submissionSubject(op, existing));
        const accepted = op.parse(saveRevisionInput, input);
        op.rev(existing, accepted.expectedRev);
        const submission = op.decide(
          saveRevision({
            ...vendorWrite(op, person),
            submission: existing,
            content: accepted.content,
          }),
          input,
          vendorParams(op, accepted.content),
        );
        op.tx.put('submissions', submission.id, submission);
        return { value: submission, decision: 'saveRevision', actor: person.ref };
      }),

    resubmit: async (input) => {
      let routed: readonly RecordRef[] = [];
      const answer = await command(call, 'ProductionService.resubmit', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        op.allow(person, 'submission.resubmit', submissionSubject(op, existing));
        const accepted = op.parse(resubmitInput, input);
        op.rev(existing, accepted.expectedRev);
        const write = vendorWrite(op, person);
        const submission = op.decide(
          resubmit({
            ...write,
            submission: existing,
            content: accepted.content,
            otherNames: otherNames(op, write.vendor, existing.id),
          }),
          input,
          vendorParams(op, accepted.content),
        );
        // "Submitted" until the approved workflow rule routes it (M-3; PC-24). In a local
        // prototype build the `system:workflow-routing` stand-in routes it right after this
        // command, by the drawn default (PC-66) — a system event of its own; the Vendor's receipt
        // is the resubmitted record as written here.
        op.tx.put('submissions', submission.id, submission);
        op.keepSent(submission);
        return {
          value: submission,
          decision: 'resubmit',
          actor: person.ref,
          after: () => {
            if (call.core.resubmissionRouting === 'drawn-default-on-resubmit')
              routed = routeByDrawnDefault(call.core, submission.id);
          },
        };
      });
      return answer.ok && routed.length > 0
        ? { ...answer, changed: joinedRefs(answer.changed, routed) }
        : answer;
    },

    getReviewQueue: (filter) =>
      read(call, 'ProductionService.getReviewQueue', (op) => {
        const person = op.person();
        const accepted = op.parse(reviewQueueInput, filter);
        return reviewQueueOf(op, person, accepted);
      }),

    getSubmissionForReview: (id) =>
      read(call, 'ProductionService.getSubmissionForReview', (op) => {
        const person = op.person();
        const record = op.found(op.records.submissions[op.idText(id)]);
        seeSubmission(op, person, record);
        const submission = asSentFor(op, person, record);
        const status = submission.status;
        const previousReturn =
          submission.revision > 1
            ? (submission.reviewDecisions.findLast(
                (decision) =>
                  decision.decision === 'return-to-vendor' &&
                  decision.revision === submission.revision - 1,
              ) ?? null)
            : null;
        return {
          submission,
          whatChanged: whatChanged(op, submission),
          previousReturn,
          recheck:
            status.state === 'with-academic-reviewer' && status.reason === 'recheck'
              ? (submission.contentManagerDecisions.findLast(
                  (decision) => decision.kind === 'send-back-to-reviewer',
                ) ?? null)
              : null,
          decided: status.state !== 'with-academic-reviewer',
        };
      }),

    approveSubmission: (input) =>
      command(call, 'ProductionService.approveSubmission', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        const subject = submissionSubject(op, existing);
        op.allow(person, 'submission.approve', subject);
        op.allow(person, 'learning-outcomes.edit', subject);
        const accepted = op.parse(approveSubmissionInput, input);
        op.rev(existing, accepted.expectedRev);
        const submission = op.decide(
          approveSubmission({
            submission: existing,
            outcomes: outcomesOf(op, existing, accepted.outcomes),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Approving publishes nothing (BC7).
        op.tx.put('submissions', submission.id, submission);
        return { value: submission, decision: 'approveSubmission', actor: person.ref };
      }),

    returnSubmission: (input) =>
      command(call, 'ProductionService.returnSubmission', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        op.allow(person, 'submission.return', submissionSubject(op, existing));
        const accepted = op.parse(returnSubmissionInput, input);
        op.rev(existing, accepted.expectedRev);
        const submission = op.decide(
          returnSubmission({
            submission: existing,
            outcomes: outcomesOf(op, existing, accepted.outcomes),
            reason: accepted.reason,
            references: accepted.references,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('submissions', submission.id, submission);
        return { value: submission, decision: 'returnSubmission', actor: person.ref };
      }),

    listReviewedByMe: () =>
      read(call, 'ProductionService.listReviewedByMe', (op) => {
        const person = op.person();
        const mine = (by: { readonly kind: string; readonly personId?: string }) =>
          by.kind === 'person' && by.personId === person.personId;
        const submissions = values(op.records.submissions).flatMap((record) => {
          const decision = record.reviewDecisions.findLast((entry) => mine(entry.decidedBy));
          if (!decision || !op.canSee(person, { kind: 'submission', submission: record }))
            return [];
          const submission = asSentFor(op, person, record);
          return [
            {
              at: decision.decidedAt,
              row: {
                recordRef: { kind: 'SUB' as const, id: submission.id },
                name: submission.content.name,
                courseCode: courseOf(op, submission.content.courseId)?.platformCode ?? null,
                type: decision.wasRecheck ? ('recheck' as const) : ('new' as const),
                decision: decision as AcademicReviewDecision | UpdateReviewDecision,
                nowState: submission.status as Submission['status'] | CorrectionUpdate['state'],
              },
            },
          ];
        });
        const updates = values(op.records.updates).flatMap((update) => {
          const decision = update.reviewDecisions.findLast((entry) => mine(entry.by));
          const experiment = op.records.experiments[update.experimentId];
          if (
            !decision ||
            !experiment ||
            !op.canSee(person, { kind: 'update', update, experiment })
          )
            return [];
          return [
            {
              at: decision.at,
              row: {
                recordRef: { kind: 'UPD' as const, id: update.id },
                name: experiment.live.catalogue.name,
                courseCode: courseOf(op, experiment.courseId)?.platformCode ?? null,
                type: 'update' as const,
                decision: decision as AcademicReviewDecision | UpdateReviewDecision,
                nowState: update.state as Submission['status'] | CorrectionUpdate['state'],
              },
            },
          ];
        });
        return [...submissions, ...updates]
          .sort((a, b) => (a.at === b.at ? 0 : a.at < b.at ? 1 : -1))
          .map((entry) => entry.row);
      }),

    listReadyToPublish: () =>
      read(call, 'ProductionService.listReadyToPublish', (op) => {
        const person = op.person();
        return values(op.records.submissions)
          .filter((submission) => submission.status.state === 'with-content-manager')
          .filter((submission) => op.canSee(person, { kind: 'submission', submission }))
          .flatMap((submission) => {
            const approval = submission.reviewDecisions.findLast(
              (decision) => decision.decision === 'approve',
            );
            if (!approval) return [];
            return [
              {
                submission,
                approvedAt: approval.decidedAt,
                approvedBy: personName(approval.decidedBy) || 'Academic Reviewer',
                check: [...publicationCheck(submission)],
              },
            ];
          });
      }),

    getPublicationDecision: (id) =>
      read(call, 'ProductionService.getPublicationDecision', (op) => {
        const person = op.person();
        const record = op.found(op.records.submissions[op.idText(id)]);
        seeSubmission(op, person, record);
        const submission = asSentFor(op, person, record);
        return {
          submission,
          check: [...publicationCheck(submission)],
          cataloguePreview: previewPage(op, submission),
        };
      }),

    publish: (input) =>
      command(call, 'ProductionService.publish', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        op.allow(person, 'submission.publish', submissionSubject(op, existing));
        const accepted = op.parse(publishInput, input);
        op.rev(existing, accepted.expectedRev);
        const experimentId = experimentSlug(existing.content.name, (id) =>
          Object.hasOwn(op.records.experiments, id),
        ) as Experiment['id'];
        const outcome = op.decide(
          publish({
            submission: existing,
            experimentId,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // The submission and the new experiment only — no plan, grant, licence or person (BC9).
        op.tx.put('submissions', outcome.submission.id, outcome.submission);
        op.tx.put('experiments', outcome.experiment.id, outcome.experiment);
        return { value: outcome, decision: 'publish', actor: person.ref };
      }),

    sendBack: (input) =>
      command(call, 'ProductionService.sendBack', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        const to = field(input, 'to');
        if (to === 'academic-reviewer')
          op.allow(person, 'submission.send-back-to-reviewer', submissionSubject(op, existing));
        else if (to === 'vendor')
          op.allow(person, 'submission.send-back-to-vendor', submissionSubject(op, existing));
        const accepted = op.parse(sendBackInput, input);
        op.rev(existing, accepted.expectedRev);
        const base = {
          submission: existing,
          reason: accepted.reason,
          actor: person.ref,
          now: op.now,
          ids: op.ids,
        };
        const submission = op.decide(
          accepted.to === 'academic-reviewer'
            ? sendBackToReviewer(base)
            : sendBackToVendor({ ...base, references: accepted.references }),
          input,
        );
        op.tx.put('submissions', submission.id, submission);
        return {
          value: submission,
          decision: accepted.to === 'academic-reviewer' ? 'sendBackToReviewer' : 'sendBackToVendor',
          actor: person.ref,
        };
      }),

    listAllContent: (filter) =>
      read(call, 'ProductionService.listAllContent', (op) => {
        const person = op.person();
        const accepted = op.parse(allContentInput, filter);
        // An experiment's open correction is named only where the reader may see it: the Super
        // Admin sees nothing of an update before the Academic Reviewer approves it (UPD-18, UPD-26).
        const visibleUpdate = (experiment: Experiment) =>
          visibleOpenUpdateId(op, person, experiment);
        const search = accepted.search?.trim().toLocaleLowerCase('en') ?? '';
        const represented = new Set<string>();
        const submissionRows = values(op.records.submissions)
          // SUB-37: every submission except a draft, which is the Vendor's only (SUB-16).
          .filter((submission) => op.canSee(person, { kind: 'submission', submission }))
          .map((record) => asSentFor(op, person, record))
          .map((submission) => {
            const course = courseOf(op, submission.content.courseId);
            const status = submission.status;
            const experiment =
              status.state === 'published'
                ? (op.records.experiments[status.experimentId] ?? null)
                : null;
            if (experiment) represented.add(experiment.id);
            return {
              ref: { kind: 'SUB' as const, id: submission.id as string },
              name: submission.content.name,
              courseCode: course?.platformCode ?? null,
              formats: formatsOf(submission.content),
              status,
              stuck: isStuck(submission, holdersOf(op)),
              whoCanAct: whoCanAct(op, submission, course),
              openUpdate: experiment ? visibleUpdate(experiment) : null,
              live: experiment ? liveOf(experiment) : null,
              openUpdateState: experiment ? visibleUpdateState(op, person, experiment) : null,
            };
          });
        const experimentRows = values(op.records.experiments)
          .filter((experiment) => !represented.has(experiment.id))
          .filter((experiment) => op.canSee(person, { kind: 'published-experiment', experiment }))
          .map((experiment) => ({
            ref: { kind: 'EXP' as const, id: experiment.id as string },
            name: experiment.live.catalogue.name,
            courseCode: courseOf(op, experiment.courseId)?.platformCode ?? null,
            formats: inDisplayOrder(experiment.live.formats.map((entry) => entry.format)),
            status: {
              state: 'published' as const,
              at: experiment.publishedAt,
              experimentId: experiment.id,
            },
            stuck: false,
            whoCanAct: null,
            openUpdate: visibleUpdate(experiment),
            live: liveOf(experiment),
            openUpdateState: visibleUpdateState(op, person, experiment),
          }));
        return [...experimentRows, ...submissionRows]
          .filter((row) =>
            accepted.status === undefined
              ? true
              : accepted.status === 'stuck'
                ? row.stuck
                : row.status.state === accepted.status,
          )
          .filter(
            (row) =>
              search === '' ||
              row.name.toLocaleLowerCase('en').includes(search) ||
              (row.courseCode ?? '').toLocaleLowerCase('en').includes(search) ||
              row.ref.id.toLocaleLowerCase('en').includes(search),
          );
      }),

    getContentRecord: (ref) =>
      read(call, 'ProductionService.getContentRecord', (op) => {
        const person = op.person();
        const kind = field(ref, 'kind');
        const id = op.idText(field(ref, 'id'));
        if (kind === 'SUB') {
          const record = op.found(op.records.submissions[id]);
          seeSubmission(op, person, record);
          const submission = asSentFor(op, person, record);
          const status = submission.status;
          const experiment =
            status.state === 'published'
              ? (op.records.experiments[status.experimentId] ?? null)
              : null;
          return {
            submission,
            experiment: experiment ? withVisibleUpdate(op, person, experiment) : null,
            stuck: isStuck(submission, holdersOf(op)),
            ...recordFacts(op, person, submission, experiment),
          };
        }
        if (kind === 'EXP') {
          const experiment = op.found(op.records.experiments[id]);
          op.see(person, { kind: 'published-experiment', experiment });
          const origin = experiment.originSubmissionId
            ? (op.records.submissions[experiment.originSubmissionId] ?? null)
            : null;
          const submission =
            origin && op.canSee(person, { kind: 'submission', submission: origin }) ? origin : null;
          return {
            submission,
            experiment: withVisibleUpdate(op, person, experiment),
            stuck: submission ? isStuck(submission, holdersOf(op)) : false,
            ...recordFacts(op, person, submission, experiment),
          };
        }
        return refuse({ kind: 'not-found' });
      }),

    overrideStatus: (input) =>
      command(call, 'ProductionService.overrideStatus', (op) => {
        const person = op.person();
        const existing = op.found(op.records.submissions[op.idText(field(input, 'id'))]);
        seeSubmission(op, person, existing);
        op.allow(person, 'submission.override-status', submissionSubject(op, existing));
        const accepted = op.parse(overrideStatusInput, input);
        op.rev(existing, accepted.expectedRev);
        const submission = op.decide(
          overrideStatus({
            submission: existing,
            holders: holdersOf(op),
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('submissions', submission.id, submission);
        return { value: submission, decision: 'overrideStatus', actor: person.ref };
      }),
  };
}
