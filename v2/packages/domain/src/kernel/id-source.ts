/**
 * New ids come from an injected, deterministic source (Appendix F §3.7 "ids/"): a decision never
 * invents an id, a random number or a time. The sample world mints drawn ids in the
 * "Prefix + four digits" form; tests use a counter.
 */
import type {
  AccessPlanId,
  AreaId,
  AssessmentId,
  AttemptId,
  CourseId,
  DeviceTransferId,
  ExperimentId,
  FacultyCourseMappingId,
  FeedbackId,
  GroupId,
  HistoryEntryId,
  ImportBatchId,
  InstituteAdminAssignmentId,
  InstitutionId,
  LearningOutcomeId,
  PaymentAttemptId,
  PersonId,
  QuestionDraftId,
  QuestionId,
  RequestId,
  RequestRouteId,
  RequestStatusToken,
  RoleHolderId,
  ScopeId,
  StudentAccessGrantId,
  SubmissionId,
  SupportReportId,
  UpdateId,
} from './ids.js';

export interface MintedIds {
  readonly request: RequestId;
  readonly statusToken: RequestStatusToken;
  readonly requestRoute: RequestRouteId;
  readonly paymentAttempt: PaymentAttemptId;
  readonly accessPlan: AccessPlanId;
  readonly institution: InstitutionId;
  readonly instituteAdminAssignment: InstituteAdminAssignmentId;
  readonly studentAccessGrant: StudentAccessGrantId;
  readonly person: PersonId;
  readonly group: GroupId;
  readonly facultyCourseMapping: FacultyCourseMappingId;
  readonly area: AreaId;
  readonly course: CourseId;
  readonly experiment: ExperimentId;
  readonly learningOutcome: LearningOutcomeId;
  readonly submission: SubmissionId;
  readonly update: UpdateId;
  readonly assessment: AssessmentId;
  readonly question: QuestionId;
  readonly questionDraft: QuestionDraftId;
  readonly importBatch: ImportBatchId;
  readonly attempt: AttemptId;
  readonly feedback: FeedbackId;
  readonly deviceTransfer: DeviceTransferId;
  readonly supportReport: SupportReportId;
  readonly roleHolder: RoleHolderId;
  readonly scope: ScopeId;
  readonly history: HistoryEntryId;
}

export interface IdSource {
  next<K extends keyof MintedIds>(kind: K): MintedIds[K];
}
