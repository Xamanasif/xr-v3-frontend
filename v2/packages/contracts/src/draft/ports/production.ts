/**
 * §3.12 ProductionService (submissions, review, publication) — VE-01…VE-09, VE-13; RV-01…RV-03,
 * RV-05, RV-06; CM-01…CM-04; SA-12, SA-13 — and §3.13 CorrectionService (updates, Release / Hold)
 * — CM-05…CM-08, RV-04, SA-10, SA-11.
 *
 * First publication: Vendor → Academic Reviewer → Content Manager → Published (BC7); only the
 * Content Manager publishes. Corrections: Content Manager → Academic Reviewer → Super Admin
 * Release / Hold (BC8), never "Publish". Publishing or releasing gives no one access (BC9). The two
 * Composite Wall experiments stay two records: the name check compares names, never content
 * (BC11; OD-B5-04).
 */
import {
  type CorrectionUpdate,
  type Experiment,
  FORMAT_META,
  type Submission,
  type Technology,
} from '@xr/domain';
import { HTTPS_LINK_AS_DRAWN, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  expectedRev,
  ids,
  isoInstant,
  packageFormat,
  recordRef,
  recordRefInput,
  technology,
  updateId,
  accessPlanId,
  institutionId,
} from '../kernel/primitives.js';
import {
  academicReviewDecision,
  contentManagerDecision,
  correctionEntry,
  correctionUpdate,
  editorStep,
  publicationCheckItem,
  returnReference,
  submission,
  submissionState,
  submissionStatus,
  submitChecklistItem,
  updateReviewDecision,
  updateState,
} from '../records/submission.js';
import { documentRef, experiment, experimentVersion } from '../records/catalogue.js';
import type { MessageKey } from '../errors/messages.js';
import type {
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  StaleVersion,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import { courseCard, publicExperimentPage } from './catalogue.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';
import { attentionRow } from './shared.js';

// ---- the Vendor editor (VE-03 … VE-06) ----

const text = z.string().nullable();

const deliveryDraftInput = z.discriminatedUnion('format', [
  z.object({ format: z.literal('web'), webLink: text, browserAndComputer: text, notes: text }),
  z.object({
    format: packageFormat,
    packageLabel: text,
    packageReference: text,
    packageFileName: text,
    deviceNeeded: text,
    installNotes: text,
    notes: text,
  }),
]);

/** The editor's content as typed: blank values are `null` after trimming (an explicit transformation). */
export const submissionContentInput = z
  .object({
    courseId: ids.in.course.nullable(),
    name: z.string(),
    summary: text,
    description: text,
    version: text,
    formats: z.array(technology),
    delivery: z.partialRecord(technology, deliveryDraftInput),
    preview: z.object({ label: text, link: text }),
    documents: z.array(documentRef),
  })
  .transform((content) => {
    const t = (value: string | null) => {
      const trimmed = value?.trim() ?? '';
      return trimmed === '' ? null : trimmed;
    };
    const delivery: Partial<Record<Technology, z.output<typeof deliveryDraftInput>>> = {};
    for (const [format, entry] of Object.entries(content.delivery) as [
      Technology,
      z.output<typeof deliveryDraftInput>,
    ][]) {
      delivery[format] =
        entry.format === 'web'
          ? {
              format: 'web',
              webLink: t(entry.webLink),
              browserAndComputer: t(entry.browserAndComputer),
              notes: t(entry.notes),
            }
          : {
              format: entry.format,
              packageLabel: t(entry.packageLabel),
              packageReference: t(entry.packageReference),
              packageFileName: t(entry.packageFileName),
              deviceNeeded: t(entry.deviceNeeded),
              installNotes: t(entry.installNotes),
              notes: t(entry.notes),
            };
    }
    return {
      courseId: content.courseId,
      name: content.name.trim(),
      summary: t(content.summary),
      description: t(content.description),
      version: t(content.version),
      formats: content.formats,
      delivery,
      preview: { label: t(content.preview.label), link: t(content.preview.link) },
      documents: content.documents,
    };
  });

type AcceptedContent = z.output<typeof submissionContentInput>;

/**
 * One editor step's drawn rules (B5-03 `e1`, `e2`, `e3`). The name's uniqueness and a course that
 * is no longer assigned need the records: the domain answers them (`VE-03.name.taken`,
 * `VE-03.courseId.course-not-assigned`).
 */
export function editorStepIssues(
  step: 'course' | 'formats' | 'preview',
  content: AcceptedContent,
): readonly {
  readonly path: readonly (string | number)[];
  readonly key: MessageKey;
  readonly params?: Readonly<Record<string, string>>;
}[] {
  const issues: { path: (string | number)[]; key: MessageKey; params?: Record<string, string> }[] =
    [];
  if (step === 'course') {
    if (content.courseId === null)
      issues.push({ path: ['courseId'], key: key('VE-03.courseId.required') });
    if (content.name === '') issues.push({ path: ['name'], key: key('VE-03.name.required') });
    if (content.summary === null)
      issues.push({ path: ['summary'], key: key('VE-03.summary.required') });
    if (content.description === null)
      issues.push({ path: ['description'], key: key('VE-03.description.required') });
    if (content.version === null)
      issues.push({ path: ['version'], key: key('VE-03.version.required') });
  } else if (step === 'formats') {
    if (content.formats.length === 0)
      issues.push({ path: ['formats'], key: key('VE-04.formats.required') });
    for (const format of content.formats) {
      const entry = content.delivery[format];
      const code = FORMAT_META[format].code;
      if (format === 'web') {
        const web = entry?.format === 'web' ? entry : null;
        if (!web?.webLink)
          issues.push({ path: ['delivery', 'web', 'webLink'], key: key('VE-04.webLink.required') });
        else if (!HTTPS_LINK_AS_DRAWN.test(web.webLink))
          issues.push({ path: ['delivery', 'web', 'webLink'], key: key('VE-04.webLink.format') });
        if (!web?.browserAndComputer)
          issues.push({
            path: ['delivery', 'web', 'browserAndComputer'],
            key: key('VE-04.browserAndComputer.required'),
          });
        continue;
      }
      const pkg = entry && entry.format !== 'web' ? entry : null;
      const params = { format: code };
      if (!pkg?.packageLabel)
        issues.push({
          path: ['delivery', format, 'packageLabel'],
          key: key('VE-04.packageLabel.required'),
          params,
        });
      if (!pkg?.packageReference && !pkg?.packageFileName)
        issues.push({
          path: ['delivery', format, 'packageReference'],
          key: key('VE-04.packageReference.required'),
          params,
        });
      if (!pkg?.deviceNeeded)
        issues.push({
          path: ['delivery', format, 'deviceNeeded'],
          key: key('VE-04.deviceNeeded.required'),
          params,
        });
      if (!pkg?.installNotes)
        issues.push({
          path: ['delivery', format, 'installNotes'],
          key: key('VE-04.installNotes.required'),
          params,
        });
    }
  } else {
    const { label, link } = content.preview;
    if (link !== null && !HTTPS_LINK_AS_DRAWN.test(link))
      issues.push({ path: ['preview', 'link'], key: key('VE-05.previewLink.format') });
    else if (label !== null && link === null)
      issues.push({
        path: ['preview', 'link'],
        key: key('VE-05.previewLink.required-with-label'),
        params: { label },
      });
  }
  return issues;
}

/** VE-03 "Save draft": only a name — "Enter a name to save a draft". */
export const saveDraftInput = z
  .object({
    id: ids.in.submission.nullable(),
    content: submissionContentInput,
    step: editorStep,
    expectedRev: expectedRev.nullable(),
  })
  .superRefine((input, context) => {
    if (input.content.name === '') {
      context.addIssue({
        code: 'custom',
        path: ['content', 'name'],
        message: key('VE-03.name.required-for-draft'),
      });
    }
  });

/** "Continue" validates the step it leaves (B5-03 `next`). */
export const continueStepInput = z
  .object({
    id: ids.in.submission.nullable(),
    content: submissionContentInput,
    from: z.enum(['course', 'formats', 'preview'], { error: key('contract.invalid-input') }),
  })
  .superRefine((input, context) => {
    for (const issue of editorStepIssues(input.from, input.content)) {
      context.addIssue({
        code: 'custom',
        path: ['content', ...issue.path],
        message: issue.key,
        ...(issue.params ? { params: issue.params } : {}),
      });
    }
  });

/** VE-06: a missing item is the refusal `submit-checklist-incomplete` with links, not a field error. */
export const submitForReviewInput = z.object({
  id: ids.in.submission.nullable(),
  content: submissionContentInput,
  expectedRev: expectedRev.nullable(),
});

export const saveRevisionInput = z
  .object({ id: ids.in.submission, content: submissionContentInput, expectedRev })
  .superRefine((input, context) => {
    if (input.content.name === '') {
      context.addIssue({
        code: 'custom',
        path: ['content', 'name'],
        message: key('VE-03.name.required-for-draft'),
      });
    }
  });

export const resubmitInput = z.object({
  id: ids.in.submission,
  content: submissionContentInput,
  expectedRev,
});

export const getEditorInput = z.object({ id: ids.in.submission.nullable(), step: editorStep });

export const listMyExperimentsInput = z.object({
  status: z
    .enum([
      'draft',
      'submitted',
      'with-academic-reviewer',
      'returned',
      'with-content-manager',
      'published',
    ])
    .optional(),
  search: z.string().optional(),
});

// ---- Academic Reviewer, Content Manager, Super Admin inputs ----

export const reviewQueueInput = z.object({
  type: z.enum(['new', 'update', 'recheck']).optional(),
  courseId: ids.in.course.optional(),
  search: z.string().optional(),
});

/** RV-03: approving needs at least one learning outcome (B6-03). */
export const approveSubmissionInput = z.object({
  id: ids.in.submission,
  outcomes: z
    .array(requiredTrimmed(key('RV-03.outcome.required')), { error: key('contract.invalid-input') })
    .min(1, { error: key('RV-03.outcomes.at-least-one') }),
  expectedRev,
});

export const returnSubmissionInput = z.object({
  id: ids.in.submission,
  reason: requiredTrimmed(key('RV-03.reason.required')),
  references: z.array(returnReference),
  outcomes: z.array(requiredTrimmed(key('RV-03.outcome.required'))),
  expectedRev,
});

export const publishInput = z.object({ id: ids.in.submission, expectedRev });

/**
 * CM-03: references exist only toward the Vendor (OD-B6-05). "Choose who it goes back to" is a
 * form-level state checked before the call.
 */
export const sendBackInput = z.discriminatedUnion(
  'to',
  [
    z.object({
      id: ids.in.submission,
      to: z.literal('academic-reviewer'),
      reason: requiredTrimmed(key('CM-03.reason.required')),
      expectedRev,
    }),
    z.object({
      id: ids.in.submission,
      to: z.literal('vendor'),
      reason: requiredTrimmed(key('CM-03.reason.required')),
      references: z.array(returnReference),
      expectedRev,
    }),
  ],
  { error: key('CM-03.to.required') },
);

export const libraryInput = z.object({
  tab: z.enum(['ready', 'in-review', 'with-vendor', 'published'], {
    error: key('contract.invalid-input'),
  }),
  search: z.string().optional(),
});

export const allContentInput = z.object({
  status: z.union([submissionState, z.literal('stuck')]).optional(),
  search: z.string().optional(),
});

/** SA-13: stuck records only, back to the Vendor only; never into or out of Published (OD-B7-09). */
export const overrideStatusInput = z.object({
  id: ids.in.submission,
  reason: requiredTrimmed(key('SA-13.reason.required')),
  expectedRev,
});

// ---- outputs ----

/** Derived by the service so every role sees the same verdict (Appendix C M10 [P]). */
export const submissionGuards = z.object({
  courseNoLongerAssigned: z.boolean(),
  stuck: z.boolean(),
  publicationCheck: z.array(publicationCheckItem),
  submitChecklist: z.array(submitChecklistItem),
});

/** `subLine` is pre-rendered words (Appendix C [P]) — PROVISIONAL (provisional register). */
export const reviewQueueItem = z.object({
  ref: recordRef,
  name: z.string().min(1),
  courseCode: z.string().nullable(),
  who: z.string(),
  subLine: z.string(),
  type: z.enum(['new', 'update', 'recheck']),
  formats: z.array(technology),
  waitingSince: isoInstant,
});

export const vendorOverviewOutput = z.object({
  statusCounts: z.object({
    draft: z.number().int().min(0),
    'with-academic-reviewer': z.number().int().min(0),
    'with-content-manager': z.number().int().min(0),
    published: z.number().int().min(0),
  }),
  attention: z.array(attentionRow),
});
export const listMyExperimentsOutput = z.array(z.object({ submission, guards: submissionGuards }));
export const editorOutput = z.object({
  submission: submission.nullable(),
  assignedCourses: z.array(courseCard),
  readOnly: z.boolean(),
});
export const continueStepOutput = z.object({ next: editorStep });
export const recordOutput = z.object({
  submission,
  guards: submissionGuards,
  lastReturn: z.union([academicReviewDecision, contentManagerDecision]).nullable(),
});
/** `scopeLine` is pre-rendered words (Appendix C [P]) — PROVISIONAL. */
export const reviewerOverviewOutput = z.object({
  scopeLine: z.array(z.string()),
  waiting: z.array(attentionRow),
});
export const reviewQueueOutput = z.array(reviewQueueItem);
export const submissionForReviewOutput = z.object({
  submission,
  whatChanged: z.array(z.object({ field: z.string(), was: z.string(), now: z.string() })),
  previousReturn: academicReviewDecision.nullable(),
  recheck: contentManagerDecision.nullable(),
  decided: z.boolean(),
});
export const reviewedByMeOutput = z.array(
  z.object({
    recordRef,
    name: z.string().min(1),
    courseCode: z.string().nullable(),
    type: z.enum(['new', 'update', 'recheck']),
    decision: z.union([academicReviewDecision, updateReviewDecision]),
    nowState: z.union([submissionStatus, updateState]),
  }),
);
export const contentManagerOverviewOutput = z.object({
  attention: z.array(attentionRow),
  withOthers: z.array(attentionRow),
});
export const readyToPublishOutput = z.array(
  z.object({
    submission,
    approvedAt: isoInstant,
    approvedBy: z.string().min(1),
    check: z.array(publicationCheckItem),
  }),
);
export const publicationDecisionOutput = z.object({
  submission,
  check: z.array(publicationCheckItem),
  cataloguePreview: publicExperimentPage,
});
/** Publishing creates the experiment and changes no plan, grant, licence or person (BC9). */
export const publishOutput = z.object({ submission, experiment });
/** `where` and `tag` are pre-rendered words (Appendix C [P]) — PROVISIONAL. */
export const libraryOutput = z.array(
  z.object({
    ref: recordRef,
    name: z.string().min(1),
    where: z.string(),
    tag: z.string().nullable(),
  }),
);
/** `whoCanAct` is pre-rendered words (Appendix C [P]) — PROVISIONAL. */
export const allContentOutput = z.array(
  z.object({
    ref: recordRef,
    name: z.string().min(1),
    courseCode: z.string().nullable(),
    formats: z.array(technology),
    status: submissionStatus,
    stuck: z.boolean(),
    whoCanAct: z.string().nullable(),
    openUpdate: updateId.nullable(),
  }),
);
export const contentRecordOutput = z.object({
  submission: submission.nullable(),
  experiment: experiment.nullable(),
  stuck: z.boolean(),
});

type VendorErrors = NotSignedIn | NotPermitted | PolicyOpen | Unavailable;

export interface ProductionService {
  // Vendor — policy-open: ROLE-11 (what a non-course scope means for a Vendor), SUB-15 (a colleague's record).
  getVendorOverview(): Answer<
    Out<typeof vendorOverviewOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  listMyExperiments(
    filter: In<typeof listMyExperimentsInput>,
  ): Answer<Out<typeof listMyExperimentsOutput>, VendorErrors>;
  getEditor(
    input: In<typeof getEditorInput>,
  ): Answer<Out<typeof editorOutput>, VendorErrors | NotFound>;
  /** The first save mints the SUB id ("Draft saved · SUB-0077"); only the Vendor sees drafts. */
  saveDraft(
    input: In<typeof saveDraftInput>,
  ): Answer<
    Submission,
    | ValidationFailed
    | Refused<'course-not-assigned'>
    | InvalidState
    | StaleVersion
    | NotFound
    | VendorErrors
  >;
  /** Validation only — writes nothing. A duplicate name is the field error `VE-03.name.taken`. */
  continueStep(
    input: In<typeof continueStepInput>,
  ): Answer<
    Out<typeof continueStepOutput>,
    ValidationFailed | Refused<'course-not-assigned'> | NotFound | InvalidState | VendorErrors
  >;
  /** Publishes nothing. */
  submitForReview(
    input: In<typeof submitForReviewInput>,
  ): Answer<
    Submission,
    | Refused<'submit-checklist-incomplete' | 'course-not-assigned'>
    | ValidationFailed
    | InvalidState
    | StaleVersion
    | NotFound
    | VendorErrors
  >;
  getRecord(
    id: In<typeof ids.in.submission>,
  ): Answer<Out<typeof recordOutput>, VendorErrors | NotFound>;
  saveRevision(
    input: In<typeof saveRevisionInput>,
  ): Answer<Submission, ValidationFailed | InvalidState | StaleVersion | NotFound | VendorErrors>;
  /** The Vendor sees "Submitted" until the approved workflow rule routes it (M-3). */
  resubmit(
    input: In<typeof resubmitInput>,
  ): Answer<
    Submission,
    | Refused<'submit-checklist-incomplete'>
    | ValidationFailed
    | InvalidState
    | StaleVersion
    | NotFound
    | VendorErrors
  >;
  // Academic Reviewer
  getReviewerOverview(): Answer<
    Out<typeof reviewerOverviewOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  getReviewQueue(
    filter: In<typeof reviewQueueInput>,
  ): Answer<Out<typeof reviewQueueOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getSubmissionForReview(
    id: In<typeof ids.in.submission>,
  ): Answer<
    Out<typeof submissionForReviewOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  /** "Approving does not publish it." */
  approveSubmission(
    input: In<typeof approveSubmissionInput>,
  ): Answer<
    Submission,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  returnSubmission(
    input: In<typeof returnSubmissionInput>,
  ): Answer<
    Submission,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  listReviewedByMe(): Answer<
    Out<typeof reviewedByMeOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  // Content Manager
  getContentManagerOverview(): Answer<
    Out<typeof contentManagerOverviewOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  listReadyToPublish(): Answer<
    Out<typeof readyToPublishOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  getPublicationDecision(
    id: In<typeof ids.in.submission>,
  ): Answer<
    Out<typeof publicationDecisionOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  publish(
    input: In<typeof publishInput>,
  ): Answer<
    { readonly submission: Submission; readonly experiment: Experiment },
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'publication-blocked'>
    | StaleVersion
    | Unavailable
  >;
  sendBack(
    input: In<typeof sendBackInput>,
  ): Answer<
    Submission,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  getLibrary(
    filter: In<typeof libraryInput>,
  ): Answer<Out<typeof libraryOutput>, NotSignedIn | NotPermitted | Unavailable>;
  // Super Admin
  listAllContent(
    filter: In<typeof allContentInput>,
  ): Answer<Out<typeof allContentOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getContentRecord(
    ref: In<typeof recordRefInput>,
  ): Answer<Out<typeof contentRecordOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  overrideStatus(
    input: In<typeof overrideStatusInput>,
  ): Answer<
    Submission,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'override-not-stuck'>
    | StaleVersion
    | Unavailable
  >;
}

// ---- CorrectionService ----

export const openCorrectionInput = z.object({
  experimentId: ids.in.experiment,
  entry: correctionEntry,
});

/** A draft save has no rule (B6-09: the web-link hint "Starts with https://" is a hint only). */
export const saveCorrectionInput = z.object({
  id: ids.in.update,
  proposed: z.object({
    name: z.string(),
    summary: z.string(),
    description: z.string(),
    webLink: z.string().nullable(),
    packageReferences: z.partialRecord(packageFormat, z.string()),
  }),
  whatChangesAndWhy: z.string().nullable(),
  versionLabel: z.string().nullable(),
  expectedRev,
});

/** The live values decide "Change at least one …" and "Use a new version label — <live> is live": the domain answers them. */
export const updateCommandInput = z.object({ id: ids.in.update, expectedRev });
export const withdrawUpdateInput = z.object({
  id: ids.in.update,
  reason: requiredTrimmed(key('CM-08.reason.required')),
  expectedRev,
});
export const returnUpdateInput = z.object({
  id: ids.in.update,
  reason: requiredTrimmed(key('RV-04.reason.required')),
  expectedRev,
});
export const holdUpdateInput = z.object({
  id: ids.in.update,
  reason: requiredTrimmed(key('SA-11.reason.required')),
  expectedRev,
});
export const listUpdatesInput = z.object({ state: updateState.optional() });
export const listUpdatesForReleaseInput = z.object({
  tab: z.enum(['waiting-for-you', 'on-hold', 'released'], { error: key('contract.invalid-input') }),
});

/** "Description · Live now … · Proposed …" (CM-08, RV-04, SA-11) — derived. */
export const correctionComparisonRow = z.object({
  field: z.enum(['name', 'summary', 'description', 'webLink', 'packageReferences', 'version']),
  liveNow: z.string().nullable(),
  proposed: z.string().nullable(),
});

export const publishedExperimentOutput = z.object({
  experiment,
  openUpdate: correctionUpdate.nullable(),
  canJoin: z.boolean(),
});
export const openCorrectionOutput = z.object({ update: correctionUpdate, joined: z.boolean() });
export const listUpdatesOutput = z.array(
  z.object({
    update: correctionUpdate,
    experimentName: z.string().min(1),
    withWhom: z.enum(['you', 'academic-reviewer', 'super-admin']).nullable(),
  }),
);
export const getUpdateOutput = z.object({
  update: correctionUpdate,
  comparison: z.array(correctionComparisonRow),
});
export const updateForReviewOutput = getUpdateOutput.extend({
  live: experimentVersion,
  decided: z.boolean(),
});
export const listUpdatesForReleaseOutput = z.array(
  z.object({
    update: correctionUpdate,
    experimentName: z.string().min(1),
    courseCode: z.string().nullable(),
  }),
);
/** SA-11: "Nothing here changes any institution's access". `note` is pre-rendered (Appendix C [P]). */
export const updateDecisionOutput = getUpdateOutput.extend({
  liveLine: z.object({ label: z.string().min(1), since: isoInstant }),
  institutionsUsingIt: z.array(
    z.object({
      institutionId,
      planId: accessPlanId,
      formats: z.array(technology),
      studentsWithAccess: z.number().int().min(0),
      note: z.string().nullable(),
    }),
  ),
});
/** The live version becomes the update's label; no access changes (BC9). */
export const releaseUpdateOutput = z.object({ update: correctionUpdate, experiment });

type CorrectionWrite =
  NotSignedIn | NotPermitted | NotFound | InvalidState | StaleVersion | Unavailable;

export interface CorrectionService {
  // Content Manager
  getPublishedExperiment(
    id: In<typeof ids.in.experiment>,
  ): Answer<
    Out<typeof publishedExperimentOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  /** Opens or joins the one draft, pre-filled from the live version; the live version is unchanged. */
  openCorrection(
    input: In<typeof openCorrectionInput>,
  ): Answer<
    Out<typeof openCorrectionOutput>,
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'update-already-open'>
    | Unavailable
  >;
  saveCorrection(input: In<typeof saveCorrectionInput>): Answer<CorrectionUpdate, CorrectionWrite>;
  sendForAcademicReview(
    input: In<typeof updateCommandInput>,
  ): Answer<CorrectionUpdate, ValidationFailed | CorrectionWrite>;
  withdrawUpdate(
    input: In<typeof withdrawUpdateInput>,
  ): Answer<CorrectionUpdate, ValidationFailed | CorrectionWrite>;
  listUpdates(
    filter: In<typeof listUpdatesInput>,
  ): Answer<Out<typeof listUpdatesOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getUpdate(
    id: In<typeof ids.in.update>,
  ): Answer<Out<typeof getUpdateOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  // Academic Reviewer
  getUpdateForReview(
    id: In<typeof ids.in.update>,
  ): Answer<
    Out<typeof updateForReviewOutput>,
    NotSignedIn | NotPermitted | NotFound | InvalidState | Unavailable
  >;
  /** The live version does not change. */
  approveUpdate(input: In<typeof updateCommandInput>): Answer<CorrectionUpdate, CorrectionWrite>;
  returnUpdate(
    input: In<typeof returnUpdateInput>,
  ): Answer<CorrectionUpdate, ValidationFailed | CorrectionWrite>;
  // Super Admin
  listUpdatesForRelease(
    filter: In<typeof listUpdatesForReleaseInput>,
  ): Answer<Out<typeof listUpdatesForReleaseOutput>, NotSignedIn | NotPermitted | Unavailable>;
  getUpdateDecision(
    id: In<typeof ids.in.update>,
  ): Answer<
    Out<typeof updateDecisionOutput>,
    NotSignedIn | NotPermitted | NotFound | InvalidState | Unavailable
  >;
  /** Never "Publish"; grants or changes no institution's access (BC8, BC9). */
  releaseUpdate(
    input: In<typeof updateCommandInput>,
  ): Answer<
    { readonly update: CorrectionUpdate; readonly experiment: Experiment },
    Refused<'hold-must-be-lifted'> | CorrectionWrite
  >;
  holdUpdate(
    input: In<typeof holdUpdateInput>,
  ): Answer<CorrectionUpdate, ValidationFailed | CorrectionWrite>;
  /** Never releases. */
  liftHold(input: In<typeof updateCommandInput>): Answer<CorrectionUpdate, CorrectionWrite>;
}
