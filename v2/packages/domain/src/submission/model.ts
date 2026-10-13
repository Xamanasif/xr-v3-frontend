/**
 * M10 Submission (SUB) + review and publication decisions (Appendix C §2).
 * Boards: B5-01 … B5-08, B6-01 … B6-03, B6-06, B6-07, B6-11, B6-12, B7-06, B7-10.
 *
 * The first-publication chain (BC7): Vendor → Academic Reviewer → Content Manager → Published.
 * Only the Content Manager publishes (SUB-24); never the Vendor, the Reviewer or the Super Admin
 * (SUB-12, SUB-21, SUB-32). Publishing gives no one access (BC9; SUB-30). Corrections to a
 * published experiment are a separate chain (M11).
 */
import type { ActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import type { HistoryEntry } from '../kernel/history.js';
import type { CourseId, ExperimentId, RoleHolderId, SubmissionId } from '../kernel/ids.js';
import type { TransitionTable } from '../kernel/machine.js';
import type { RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { DocumentRef, LearningOutcome } from '../catalogue/model.js';

export type EditorStep = 'course' | 'formats' | 'preview' | 'submit';

export const SUBMISSION_STATES = [
  'draft',
  'with-academic-reviewer',
  'returned',
  'resubmitted',
  'with-content-manager',
  'published',
] as const;

export type SubmissionState = (typeof SUBMISSION_STATES)[number];

/** Why it is with the Academic Reviewer: first review, a routed resubmission, or a re-check the
 *  Content Manager asked for (Appendix C M10 "with-AR · …" rows). */
export const REVIEW_REASONS = ['first-review', 'resubmission', 'recheck'] as const;
export type ReviewReason = (typeof REVIEW_REASONS)[number];

/** Who returned it to the Vendor (Appendix C M10 "returned · by …" rows). */
export const RETURNED_BY = [
  'academic-reviewer',
  'content-manager',
  'super-admin-override',
] as const;
export type ReturnedBy = (typeof RETURNED_BY)[number];

export type SubmissionStatus =
  /** Only the Vendor sees a draft (SUB-16). */
  | { readonly state: 'draft' }
  | {
      readonly state: 'with-academic-reviewer';
      readonly since: IsoInstant;
      /** recheck = the Content Manager sent it back. */
      readonly reason: ReviewReason;
    }
  | {
      readonly state: 'returned';
      readonly since: IsoInstant;
      readonly by: ReturnedBy;
    }
  /** The Vendor sees "Submitted" until the resubmission is routed (M-3). */
  | { readonly state: 'resubmitted'; readonly since: IsoInstant }
  | { readonly state: 'with-content-manager'; readonly since: IsoInstant }
  | { readonly state: 'published'; readonly at: IsoInstant; readonly experimentId: ExperimentId };

export type FormatDeliveryDraft =
  | {
      readonly format: 'web';
      readonly webLink: string | null;
      readonly browserAndComputer: string | null;
      readonly notes: string | null;
    }
  | {
      readonly format: 'ar' | 'vr' | 'mr';
      readonly packageLabel: string | null;
      readonly packageReference: string | null;
      readonly packageFileName: string | null;
      readonly deviceNeeded: string | null;
      readonly installNotes: string | null;
      readonly notes: string | null;
    };

/** The four-step editor (VE-03 … VE-06). */
export interface SubmissionContent {
  readonly courseId: CourseId | null;
  /** The only field a draft save needs. */
  readonly name: string;
  readonly summary: string | null;
  readonly description: string | null;
  /** '1.0'. */
  readonly version: string | null;
  readonly formats: readonly Technology[];
  readonly delivery: Readonly<Partial<Record<Technology, FormatDeliveryDraft>>>;
  readonly preview: { readonly label: string | null; readonly link: string | null };
  readonly documents: readonly DocumentRef[];
}

/** 'What it refers to' (step · format · field) — OD-B5-10. */
export interface ReturnReference {
  readonly step: 'course-and-description' | 'formats-and-delivery' | 'preview-and-documents';
  readonly format: Technology | null;
  readonly field:
    | 'summary'
    | 'description'
    | 'web-link'
    | 'browser-and-computer'
    | 'package'
    | 'device-need'
    | 'install-notes'
    | 'preview-link';
}

export interface AcademicReviewDecision {
  readonly revision: number;
  readonly decision: 'approve' | 'return-to-vendor';
  readonly reason: string | null;
  readonly references: readonly ReturnReference[];
  readonly outcomesAtDecision: readonly LearningOutcome[];
  readonly wasRecheck: boolean;
  readonly decidedAt: IsoInstant;
  readonly decidedBy: ActorRef;
}

export type ContentManagerDecision =
  | { readonly kind: 'publish'; readonly at: IsoInstant; readonly by: ActorRef }
  | {
      readonly kind: 'send-back-to-reviewer';
      readonly reason: string;
      readonly at: IsoInstant;
      readonly by: ActorRef;
    }
  | {
      readonly kind: 'send-back-to-vendor';
      readonly reason: string;
      readonly references: readonly ReturnReference[];
      readonly at: IsoInstant;
      readonly by: ActorRef;
    };

/** Super Admin 'Move status (override)' — stuck records only, one target (SUB-33; OD-B7-09). */
export interface StatusOverride {
  readonly from: 'with-academic-reviewer';
  readonly to: 'returned';
  readonly reason: string;
  readonly at: IsoInstant;
  readonly by: ActorRef;
}

export type SubmissionEvent =
  | 'draft-saved'
  | 'submitted'
  | 'returned-by-reviewer'
  | 'approved-by-reviewer'
  | 'resubmitted'
  | 'routed'
  | 'sent-back-for-recheck'
  | 'returned-by-content-manager'
  | 'published'
  | 'status-overridden';

export interface Submission extends RecordMeta {
  /** Given on the first save (OD-B5-07); an unsaved new experiment has no id. */
  readonly id: SubmissionId;
  /** The creator — 'Every experiment you created' (B5-02). */
  readonly vendorHolderId: RoleHolderId;
  readonly vendorOrganisation: string;
  readonly status: SubmissionStatus;
  /** Starts at 1; +1 on each resubmit. */
  readonly revision: number;
  readonly content: SubmissionContent;
  /** The committed set; travels with the reviewer's decision (OD-B6-04). */
  readonly learningOutcomes: readonly LearningOutcome[];
  /** 'Opens at step 2, where Anil stopped' (B5-07). */
  readonly lastStepReached: EditorStep;
  readonly reviewDecisions: readonly AcademicReviewDecision[];
  readonly contentManagerDecisions: readonly ContentManagerDecision[];
  readonly overrides: readonly StatusOverride[];
  readonly firstSubmittedAt: IsoInstant | null;
  readonly lastResubmittedAt: IsoInstant | null;
  readonly history: readonly HistoryEntry<SubmissionEvent>[];
}

export type SubmissionCommand =
  | 'saveDraft'
  | 'submitForReview'
  | 'approveSubmission'
  | 'returnSubmission'
  | 'saveRevision'
  | 'resubmit'
  | 'routeResubmission'
  | 'publish'
  | 'sendBackToReviewer'
  | 'sendBackToVendor'
  | 'overrideStatus';

/** Appendix C M10 "Transitions". Nothing un-publishes (EXP-12); no withdraw or recall (SUB-06). */
export const SUBMISSION_TRANSITIONS: TransitionTable<SubmissionState, SubmissionCommand> = [
  { from: null, to: 'draft', command: 'saveDraft', actors: ['vendor'] },
  { from: 'draft', to: 'draft', command: 'saveDraft', actors: ['vendor'] },
  { from: null, to: 'with-academic-reviewer', command: 'submitForReview', actors: ['vendor'] },
  { from: 'draft', to: 'with-academic-reviewer', command: 'submitForReview', actors: ['vendor'] },
  {
    from: 'with-academic-reviewer',
    to: 'with-content-manager',
    command: 'approveSubmission',
    actors: ['academic_reviewer'],
  },
  {
    from: 'with-academic-reviewer',
    to: 'returned',
    command: 'returnSubmission',
    actors: ['academic_reviewer'],
  },
  { from: 'returned', to: 'returned', command: 'saveRevision', actors: ['vendor'] },
  { from: 'returned', to: 'resubmitted', command: 'resubmit', actors: ['vendor'] },
  {
    from: 'resubmitted',
    to: 'with-academic-reviewer',
    command: 'routeResubmission',
    actors: ['system:workflow-routing'],
  },
  {
    from: 'with-content-manager',
    to: 'published',
    command: 'publish',
    actors: ['content_manager'],
  },
  {
    from: 'with-content-manager',
    to: 'with-academic-reviewer',
    command: 'sendBackToReviewer',
    actors: ['content_manager'],
  },
  {
    from: 'with-content-manager',
    to: 'returned',
    command: 'sendBackToVendor',
    actors: ['content_manager'],
  },
  {
    from: 'with-academic-reviewer',
    to: 'returned',
    command: 'overrideStatus',
    actors: ['super_admin'],
  },
];

/**
 * OD-B5-05 / M-3: the next gate after a resubmit. Typed so it can ONLY return the drawn default —
 * back to the Academic Reviewer, "Routed by the approved workflow rule." (B5-08). A route that
 * skips the reviewer is not a variant (BC7; Appendix C §6).
 */
export interface WorkflowRoutingPolicy {
  route(submission: Submission): { readonly reason: 'resubmission' };
}

export const DRAWN_WORKFLOW_ROUTING: WorkflowRoutingPolicy = {
  route: () => ({ reason: 'resubmission' }),
};

/** CM-03 publication check rows (B6-07 `checks[]`). */
export interface PublicationCheckItem {
  readonly check:
    'approved-by-reviewer' | 'learning-outcomes' | 'catalogue-details' | 'delivery-per-format';
  readonly ok: boolean;
  readonly fixHint: 'send-back-to-reviewer' | 'send-back-to-vendor' | null;
}

/** VE-06 submit checklist: missing items per section; preview & documents are optional. */
export interface SubmitChecklistItem {
  readonly section: 'course-and-description' | 'formats-and-delivery' | 'preview-and-documents';
  readonly missing: readonly string[];
}
