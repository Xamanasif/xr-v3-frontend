/**
 * Schema primitives of the draft contracts: branded identifiers, time, record references, actors
 * and history entries (Appendix C §1.1–§1.8), each typed as its `@xr/domain` type.
 *
 * Identifiers come in two strengths:
 * - output schemas (`requestId`, `accessPlanId` …) check the drawn "Prefix + four digits" form for
 *   the twelve drawn ids (B8-03 'Record IDs') and a bounded opaque string otherwise;
 * - input schemas (`ids.in.*`) accept any bounded string, so an unknown or malformed id given to a
 *   read answers `not-found` from the adapter instead of an undrawn validation message.
 */
import {
  type AccessPlanId,
  type ActorRef,
  type AreaId,
  type AssessmentId,
  type AttemptId,
  type Audience,
  type CalendarDate,
  type CourseId,
  type DeviceTransferId,
  DRAWN_ID_PREFIX,
  type DrawnIdKind,
  type ExperimentId,
  type FacultyCourseMappingId,
  type FeedbackId,
  type GroupId,
  type HistoryEntry,
  type HistoryEntryId,
  type ImportBatchId,
  type InstituteAdminAssignmentId,
  type InstitutionId,
  type IsoInstant,
  type LearningOutcomeId,
  type PaymentAttemptId,
  type PersonId,
  PLATFORM_ROLES,
  type PlatformCourseCode,
  type Provided,
  type QuestionDraftId,
  type QuestionId,
  RECORD_KINDS,
  type RecordRef,
  type RequestId,
  type RequestStatusToken,
  type ResourceId,
  type RoleHolderId,
  type ScopeId,
  type StudentAccessGrantId,
  type SubmissionId,
  type SupportReportId,
  SYSTEM_ACTORS,
  TECHNOLOGIES,
  type UpdateId,
} from '@xr/domain';
import { identifier, slug } from '@xr/validation';
import { z } from 'zod';

import type { MessageKey } from '../errors/messages.js';
import { branded, type TypedSchema, typedAs } from './typed.js';

/** A value of the wrong type or shape reached a port: a programming error with no drawn words. */
const INVALID_INPUT: MessageKey = 'contract.invalid-input';

/** The canonical UTC instant the domain stores (`toISOString`, Appendix C §1.2). */
export const CANONICAL_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const isoInstant = branded<IsoInstant>()(z.string().regex(CANONICAL_INSTANT));
export const calendarDate = branded<CalendarDate>()(z.iso.date());
export const providedNumber = branded<Provided<number>>()(z.number().int().min(0));
export const providedInstant = branded<Provided<IsoInstant>>()(z.string().regex(CANONICAL_INSTANT));

function drawnId<B>(kind: DrawnIdKind) {
  return branded<B>()(z.string().regex(new RegExp(`^${DRAWN_ID_PREFIX[kind]}-\\d{4}$`)));
}
const opaque = <B>() => branded<B>()(identifier);
/**
 * An id a caller passes: typed as the domain brand on both sides, checked as a bounded string —
 * the committed `identifier` bounds, reported as `contract.invalid-input` (a caller never types an
 * id; a malformed one is a programming error, not a drawn form state).
 */
const inputIdentifier = z
  .string({ error: INVALID_INPUT })
  .min(1, { error: INVALID_INPUT })
  .max(200, { error: INVALID_INPUT });
const param = <B>() => inputIdentifier as unknown as TypedSchema<B, B>;

export const requestId = drawnId<RequestId>('request');
export const accessPlanId = drawnId<AccessPlanId>('accessPlan');
export const studentAccessGrantId = drawnId<StudentAccessGrantId>('studentAccessGrant');
export const assessmentId = drawnId<AssessmentId>('assessment');
export const attemptId = drawnId<AttemptId>('attempt');
export const submissionId = drawnId<SubmissionId>('submission');
export const updateId = drawnId<UpdateId>('update');
export const deviceTransferId = drawnId<DeviceTransferId>('deviceTransfer');
export const supportReportId = drawnId<SupportReportId>('supportReport');
export const questionId = drawnId<QuestionId>('question');
export const groupId = drawnId<GroupId>('group');
export const facultyCourseMappingId = drawnId<FacultyCourseMappingId>('facultyCourseMapping');

export const institutionId = opaque<InstitutionId>();
export const personId = opaque<PersonId>();
/** A lower-case slug (committed `slug`); the two Composite Wall records have different slugs (BC11). */
export const experimentId = branded<ExperimentId>()(slug);
export const courseId = opaque<CourseId>();
export const areaId = opaque<AreaId>();
export const roleHolderId = opaque<RoleHolderId>();
export const scopeId = opaque<ScopeId>();
export const resourceId = opaque<ResourceId>();
export const learningOutcomeId = opaque<LearningOutcomeId>();
export const feedbackId = opaque<FeedbackId>();
export const paymentAttemptId = opaque<PaymentAttemptId>();
export const instituteAdminAssignmentId = opaque<InstituteAdminAssignmentId>();
export const questionDraftId = opaque<QuestionDraftId>();
export const importBatchId = opaque<ImportBatchId>();
export const historyEntryId = opaque<HistoryEntryId>();
export const requestStatusToken = opaque<RequestStatusToken>();
/** 'ME ZG523' — contains a space; blank is `null`, never '' (T-17). */
export const platformCourseCode = branded<PlatformCourseCode>()(z.string().min(1));

/** Lenient id inputs: a bounded string; existence is the adapter's answer (`not-found`). */
export const ids = {
  in: {
    request: param<RequestId>(),
    accessPlan: param<AccessPlanId>(),
    studentAccessGrant: param<StudentAccessGrantId>(),
    assessment: param<AssessmentId>(),
    attempt: param<AttemptId>(),
    submission: param<SubmissionId>(),
    update: param<UpdateId>(),
    deviceTransfer: param<DeviceTransferId>(),
    supportReport: param<SupportReportId>(),
    question: param<QuestionId>(),
    group: param<GroupId>(),
    facultyCourseMapping: param<FacultyCourseMappingId>(),
    institution: param<InstitutionId>(),
    person: param<PersonId>(),
    experiment: param<ExperimentId>(),
    course: param<CourseId>(),
    area: param<AreaId>(),
    roleHolder: param<RoleHolderId>(),
    scope: param<ScopeId>(),
    resource: param<ResourceId>(),
    questionDraft: param<QuestionDraftId>(),
    importBatch: param<ImportBatchId>(),
    statusToken: param<RequestStatusToken>(),
  },
} as const;

export const technology = z.enum(TECHNOLOGIES);
export const packageFormat = z.enum(['ar', 'vr', 'mr']);
export const role = z.enum(PLATFORM_ROLES);
export const audience = typedAs<Audience>()(z.enum([...PLATFORM_ROLES, 'public']));
export const recordKind = z.enum(RECORD_KINDS);

export const recordRef = typedAs<RecordRef>()(
  z.object({ kind: recordKind, id: z.string().min(1) }),
);

/** A record reference a caller passes (`getContentRecord`): a malformed one is `contract.invalid-input`. */
export const recordRefInput = typedAs<RecordRef>()(
  z.object({ kind: z.enum(RECORD_KINDS, { error: INVALID_INPUT }), id: inputIdentifier }),
);

export const actorRef = typedAs<ActorRef>()(
  z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('person'),
      personId,
      role,
      displayName: z.string(),
    }),
    z.object({ kind: z.literal('requester'), name: z.string() }),
    z.object({ kind: z.literal('system'), system: z.enum(SYSTEM_ACTORS) }),
  ]),
);

/**
 * History of a record (M28): canonical event kinds only; words live in per-audience copy. The
 * entry shape is checked against `HistoryEntry<E>` where each record schema is tied to its domain
 * type (`typedAs` cannot resolve a generic event union here).
 */
export function historyOf<const E extends readonly [string, ...string[]]>(events: E) {
  return z.array(
    z.object({
      id: historyEntryId,
      event: z.enum(events),
      at: isoInstant,
      actor: actorRef,
      note: z.string().nullable(),
      visibleTo: z.array(audience),
      refs: z.array(recordRef),
    }),
  );
}

/** One history entry of a known event vocabulary, typed as the domain's `HistoryEntry<E>`. */
export type HistoryEntryOf<E extends string> = HistoryEntry<E>;

/** `RecordMeta` (Appendix C §1.8): `rev` +1 on every write; `expectedRev` mismatch → `stale-version`. */
export const recordMeta = {
  rev: z.number().int().min(1),
  createdAt: isoInstant,
  updatedAt: isoInstant,
} as const;

/** `expectedRev` carried by every write (Appendix C §3.0 rule 2); a bad one is a programming error. */
export const expectedRev = z
  .number({ error: INVALID_INPUT })
  .int({ error: INVALID_INPUT })
  .min(1, { error: INVALID_INPUT });
