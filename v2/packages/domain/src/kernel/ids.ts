/**
 * Record identifiers (Appendix C §1.1; Appendix F §6.1).
 *
 * - Twelve records carry a drawn id, shown "Prefix + four digits in a monospace chip" (B8-03
 *   'Record IDs'; GRP-0012 B2-08; FMAP-0021 B2-06 f15; Q-0101 B4-07 — one letter + four digits).
 * - Every other record gets an opaque id that product copy never shows. `CourseId` is a stable
 *   key, never the platform code (a code may be blank and contains a space, T-17).
 *   `ExperimentId` is a lower-case slug; the two Composite Wall records have different slugs and
 *   stay separate records (BC11).
 */
import type { Brand } from './brand.js';

export type RequestId = Brand<string, 'RequestId'>;
export type AccessPlanId = Brand<string, 'AccessPlanId'>;
export type StudentAccessGrantId = Brand<string, 'StudentAccessGrantId'>;
export type AssessmentId = Brand<string, 'AssessmentId'>;
export type AttemptId = Brand<string, 'AttemptId'>;
export type SubmissionId = Brand<string, 'SubmissionId'>;
export type UpdateId = Brand<string, 'UpdateId'>;
export type DeviceTransferId = Brand<string, 'DeviceTransferId'>;
export type SupportReportId = Brand<string, 'SupportReportId'>;
export type QuestionId = Brand<string, 'QuestionId'>;
export type GroupId = Brand<string, 'GroupId'>;
export type FacultyCourseMappingId = Brand<string, 'FacultyCourseMappingId'>;

export type InstitutionId = Brand<string, 'InstitutionId'>;
export type PersonId = Brand<string, 'PersonId'>;
export type ExperimentId = Brand<string, 'ExperimentId'>;
export type CourseId = Brand<string, 'CourseId'>;
export type AreaId = Brand<string, 'AreaId'>;
export type RoleHolderId = Brand<string, 'RoleHolderId'>;
export type ScopeId = Brand<string, 'ScopeId'>;
export type ResourceId = Brand<string, 'ResourceId'>;
export type LearningOutcomeId = Brand<string, 'LearningOutcomeId'>;
export type FeedbackId = Brand<string, 'FeedbackId'>;
export type PaymentAttemptId = Brand<string, 'PaymentAttemptId'>;
export type InstituteAdminAssignmentId = Brand<string, 'InstituteAdminAssignmentId'>;
export type QuestionDraftId = Brand<string, 'QuestionDraftId'>;
export type ImportBatchId = Brand<string, 'ImportBatchId'>;
export type HistoryEntryId = Brand<string, 'HistoryEntryId'>;
/**
 * The ticket the browser session that sent a request holds for its status page (B1-07 "continues
 * from this session"). The reference REQ-0042 "identifies the request — it does not open the page
 * on its own" (B1-08 'Who can open this page'). Held by the session, never shown and never part
 * of an address: a ticket in the URL would work as a bearer link (Appendix D V-17, AD-13).
 */
export type RequestStatusToken = Brand<string, 'RequestStatusToken'>;
/**
 * The opaque id of a request's public addresses, `/requests/[requestId]` and its payment step
 * (owner decision DV-5 / O-05, 14 Oct 2026; ADR-0009). Never the reference (B1-07, B1-08) and
 * never the ticket (V-17): it names the request and opens nothing — the page is shown only to the
 * browser session holding the ticket or to the signed-in Institute Admin of the institution.
 */
export type RequestRouteId = Brand<string, 'RequestRouteId'>;

/** The drawn prefixes (B8-03 'Record IDs'). */
export const DRAWN_ID_PREFIX = {
  request: 'REQ',
  accessPlan: 'ACC',
  studentAccessGrant: 'SACC',
  assessment: 'ASMT',
  attempt: 'ATT',
  submission: 'SUB',
  update: 'UPD',
  deviceTransfer: 'DTR',
  supportReport: 'SUP',
  question: 'Q',
  group: 'GRP',
  facultyCourseMapping: 'FMAP',
} as const;

export type DrawnIdKind = keyof typeof DRAWN_ID_PREFIX;

/** Does `value` read as a drawn id of this kind: the prefix, a hyphen and four digits? */
export function isDrawnId(kind: DrawnIdKind, value: string): boolean {
  return new RegExp(`^${DRAWN_ID_PREFIX[kind]}-\\d{4}$`).test(value);
}

/**
 * Ids that would collide with static route segments and are never minted (Appendix C §1.1;
 * route issues FA-06/07, FA-14…17, VE-02/03).
 */
export const RESERVED_ID_SLUGS = [
  'new',
  'draft',
  'import',
  'edit',
  'revise',
  'help',
  'not-allowed',
] as const;
