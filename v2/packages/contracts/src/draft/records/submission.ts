/**
 * M10 Submission (SUB) + review and publication decisions, M11 Correction (UPD) — Appendix C §2.
 * First publication: Vendor → Academic Reviewer → Content Manager → Published (BC7). Corrections:
 * Content Manager → Academic Reviewer → Super Admin Release / Hold (BC8), never "Publish".
 * Publishing or releasing gives no one access (BC9).
 */
import {
  type AcademicReviewDecision,
  type ContentManagerDecision,
  type CorrectionEntry,
  type CorrectionFields,
  type CorrectionUpdate,
  type EditorStep,
  type FormatDeliveryDraft,
  type PublicationCheckItem,
  RETURNED_BY,
  REVIEW_REASONS,
  type ReturnReference,
  type StatusOverride,
  SUBMISSION_STATES,
  type Submission,
  type SubmissionContent,
  type SubmissionEvent,
  type SubmissionStatus,
  type SubmitChecklistItem,
  UPDATE_STATES,
  type UpdateEvent,
  type UpdateReviewDecision,
} from '@xr/domain';
import { z } from 'zod';

import {
  actorRef,
  courseId,
  experimentId,
  historyOf,
  isoInstant,
  packageFormat,
  recordMeta,
  roleHolderId,
  submissionId,
  technology,
  updateId,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';
import { documentRef, learningOutcome } from './catalogue.js';

export const EDITOR_STEPS = vocabulary<EditorStep>()(['course', 'formats', 'preview', 'submit']);
export const SUBMISSION_EVENTS = vocabulary<SubmissionEvent>()([
  'draft-saved',
  'submitted',
  'returned-by-reviewer',
  'approved-by-reviewer',
  'resubmitted',
  'routed',
  'sent-back-for-recheck',
  'returned-by-content-manager',
  'published',
  'status-overridden',
]);
export const UPDATE_EVENTS = vocabulary<UpdateEvent>()([
  'started',
  'saved',
  'sent-for-academic-review',
  'approved-by-reviewer',
  'returned-by-reviewer',
  'put-on-hold',
  'hold-lifted',
  'released',
  'withdrawn',
]);
export const CORRECTION_ENTRIES = vocabulary<CorrectionEntry>()([
  'start-a-correction',
  'edit-catalogue-details',
  'edit-delivery-link',
]);
export const RETURN_REFERENCE_STEPS = vocabulary<ReturnReference['step']>()([
  'course-and-description',
  'formats-and-delivery',
  'preview-and-documents',
]);
export const RETURN_REFERENCE_FIELDS = vocabulary<ReturnReference['field']>()([
  'summary',
  'description',
  'web-link',
  'browser-and-computer',
  'package',
  'device-need',
  'install-notes',
  'preview-link',
]);
export const PUBLICATION_CHECKS = vocabulary<PublicationCheckItem['check']>()([
  'approved-by-reviewer',
  'learning-outcomes',
  'catalogue-details',
  'delivery-per-format',
]);

export const editorStep = z.enum(EDITOR_STEPS);
export const submissionState = z.enum(SUBMISSION_STATES);
export const updateState = z.enum(UPDATE_STATES);
export const correctionEntry = z.enum(CORRECTION_ENTRIES);

export const submissionStatus = typedAs<SubmissionStatus>()(
  z.discriminatedUnion('state', [
    z.object({ state: z.literal('draft') }),
    z.object({
      state: z.literal('with-academic-reviewer'),
      since: isoInstant,
      reason: z.enum(REVIEW_REASONS),
    }),
    z.object({ state: z.literal('returned'), since: isoInstant, by: z.enum(RETURNED_BY) }),
    z.object({ state: z.literal('resubmitted'), since: isoInstant }),
    z.object({ state: z.literal('with-content-manager'), since: isoInstant }),
    z.object({ state: z.literal('published'), at: isoInstant, experimentId }),
  ]),
);

export const formatDeliveryDraft = typedAs<FormatDeliveryDraft>()(
  z.discriminatedUnion('format', [
    z.object({
      format: z.literal('web'),
      webLink: z.string().nullable(),
      browserAndComputer: z.string().nullable(),
      notes: z.string().nullable(),
    }),
    z.object({
      format: packageFormat,
      packageLabel: z.string().nullable(),
      packageReference: z.string().nullable(),
      packageFileName: z.string().nullable(),
      deviceNeeded: z.string().nullable(),
      installNotes: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ]),
);

export const submissionContent = typedAs<SubmissionContent>()(
  z.object({
    courseId: courseId.nullable(),
    name: z.string(),
    summary: z.string().nullable(),
    description: z.string().nullable(),
    version: z.string().nullable(),
    formats: z.array(technology),
    delivery: z.partialRecord(technology, formatDeliveryDraft),
    preview: z.object({ label: z.string().nullable(), link: z.string().nullable() }),
    documents: z.array(documentRef),
  }),
);

export const returnReference = typedAs<ReturnReference>()(
  z.object({
    step: z.enum(RETURN_REFERENCE_STEPS),
    format: technology.nullable(),
    field: z.enum(RETURN_REFERENCE_FIELDS),
  }),
);

export const academicReviewDecision = typedAs<AcademicReviewDecision>()(
  z.object({
    revision: z.number().int().min(1),
    decision: z.enum(['approve', 'return-to-vendor']),
    reason: z.string().nullable(),
    references: z.array(returnReference),
    outcomesAtDecision: z.array(learningOutcome),
    wasRecheck: z.boolean(),
    decidedAt: isoInstant,
    decidedBy: actorRef,
  }),
);

export const contentManagerDecision = typedAs<ContentManagerDecision>()(
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('publish'), at: isoInstant, by: actorRef }),
    z.object({
      kind: z.literal('send-back-to-reviewer'),
      reason: z.string().min(1),
      at: isoInstant,
      by: actorRef,
    }),
    z.object({
      kind: z.literal('send-back-to-vendor'),
      reason: z.string().min(1),
      references: z.array(returnReference),
      at: isoInstant,
      by: actorRef,
    }),
  ]),
);

export const statusOverride = typedAs<StatusOverride>()(
  z.object({
    from: z.literal('with-academic-reviewer'),
    to: z.literal('returned'),
    reason: z.string().min(1),
    at: isoInstant,
    by: actorRef,
  }),
);

export const submission = typedAs<Submission>()(
  z.object({
    ...recordMeta,
    id: submissionId,
    vendorHolderId: roleHolderId,
    vendorOrganisation: z.string(),
    status: submissionStatus,
    revision: z.number().int().min(1),
    content: submissionContent,
    learningOutcomes: z.array(learningOutcome),
    lastStepReached: editorStep,
    reviewDecisions: z.array(academicReviewDecision),
    contentManagerDecisions: z.array(contentManagerDecision),
    overrides: z.array(statusOverride),
    firstSubmittedAt: isoInstant.nullable(),
    lastResubmittedAt: isoInstant.nullable(),
    history: historyOf(SUBMISSION_EVENTS),
  }),
);

export const publicationCheckItem = typedAs<PublicationCheckItem>()(
  z.object({
    check: z.enum(PUBLICATION_CHECKS),
    ok: z.boolean(),
    fixHint: z.enum(['send-back-to-reviewer', 'send-back-to-vendor']).nullable(),
  }),
);

export const submitChecklistItem = typedAs<SubmitChecklistItem>()(
  z.object({ section: z.enum(RETURN_REFERENCE_STEPS), missing: z.array(z.string()) }),
);

export const correctionFields = typedAs<CorrectionFields>()(
  z.object({
    name: z.string(),
    summary: z.string(),
    description: z.string(),
    webLink: z.string().nullable(),
    packageReferences: z.partialRecord(packageFormat, z.string()),
  }),
);

export const updateReviewDecision = typedAs<UpdateReviewDecision>()(
  z.object({
    decision: z.enum(['approve', 'return-to-content-manager']),
    reason: z.string().nullable(),
    at: isoInstant,
    by: actorRef,
  }),
);

export const correctionUpdate = typedAs<CorrectionUpdate>()(
  z.object({
    ...recordMeta,
    id: updateId,
    experimentId,
    baseVersionLabel: z.string().min(1),
    state: updateState,
    entry: correctionEntry,
    proposed: correctionFields,
    whatChangesAndWhy: z.string().nullable(),
    versionLabel: z.string().nullable(),
    startedAt: isoInstant,
    startedBy: actorRef,
    sentForReviewAt: isoInstant.nullable(),
    reviewDecisions: z.array(updateReviewDecision),
    hold: z.object({ at: isoInstant, by: actorRef, reason: z.string().min(1) }).nullable(),
    holdLifts: z.array(z.object({ at: isoInstant, by: actorRef })),
    release: z.object({ at: isoInstant, by: actorRef }).nullable(),
    withdrawal: z.object({ at: isoInstant, by: actorRef, reason: z.string().min(1) }).nullable(),
    history: historyOf(UPDATE_EVENTS),
  }),
);
