/**
 * M01 Institution, M02 Institute Admin assignment, M05 Access plan (Appendix C §2) as output
 * schemas, each tied to its `@xr/domain` type. An institution stores one status fact — its pause;
 * every status word is derived (Appendix C M01). A plan's licence figure is `Provided` — shown as
 * approved, never consumed or derived (T-06, D7).
 */
import {
  ACCESS_PLAN_STATUSES,
  type AccessPlan,
  type AccessPlanEvent,
  type AccessPlanItem,
  type AccessPlanTerm,
  INSTITUTION_STATUSES,
  type InstituteAdminAssignment,
  type Institution,
  type InstitutionEvent,
  type InstitutionKind,
  type InstitutionPause,
} from '@xr/domain';
import { z } from 'zod';

import {
  accessPlanId,
  actorRef,
  calendarDate,
  experimentId,
  historyOf,
  instituteAdminAssignmentId,
  institutionId,
  isoInstant,
  personId,
  providedNumber,
  recordMeta,
  requestId,
  technology,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const INSTITUTION_KINDS = vocabulary<InstitutionKind>()(['internal', 'external']);

/**
 * Appendix C M01 lists the first eight; `licences-requested` was added in WP-0.9 for B7-02's
 * "Request REQ-0040 received - additional licences" [PROPOSED; provisional register].
 */
export const INSTITUTION_EVENTS = vocabulary<InstitutionEvent>()([
  'record-created',
  'access-activated',
  'institute-admin-assigned',
  'paused',
  'restored',
  'student-status-overridden',
  'access-ended',
  'renewal-requested',
  'licences-requested',
]);

/**
 * Appendix C M05 lists the first seven; `access-given` and `access-withdrawn` were added in WP-0.9
 * [PROPOSED; provisional register].
 */
export const ACCESS_PLAN_EVENTS = vocabulary<AccessPlanEvent>()([
  'activated',
  'paused',
  'restored',
  'ending-soon',
  'ended',
  'renewal-requested',
  'renewed',
  'access-given',
  'access-withdrawn',
]);

export const ACCESS_PLAN_TERMS = vocabulary<AccessPlanTerm>()([
  'monthly',
  'quarterly',
  'yearly',
  'until-date',
]);

export const institutionKind = z.enum(INSTITUTION_KINDS);
export const institutionStatus = z.enum(INSTITUTION_STATUSES);
export const accessPlanStatus = z.enum(ACCESS_PLAN_STATUSES);
export const accessPlanTerm = z.enum(ACCESS_PLAN_TERMS);

export const institutionPause = typedAs<InstitutionPause>()(
  z.object({ since: isoInstant, by: actorRef, reason: z.string().min(1) }),
);

export const instituteAdminAssignment = typedAs<InstituteAdminAssignment>()(
  z.object({
    id: instituteAdminAssignmentId,
    institutionId,
    name: z.string().min(1),
    workEmail: z.string().min(1),
    assignedAt: isoInstant,
    assignedBy: actorRef,
    personId,
  }),
);

export const institution = typedAs<Institution>()(
  z.object({
    ...recordMeta,
    id: institutionId,
    name: z.string().min(1),
    kind: institutionKind,
    createdFromRequestId: requestId,
    pause: institutionPause.nullable(),
    instituteAdmin: instituteAdminAssignment.nullable(),
    history: historyOf(INSTITUTION_EVENTS),
  }),
);

export const accessPlanItem = typedAs<AccessPlanItem>()(
  z.object({ experimentId, formats: z.array(technology).min(1) }),
);

export const accessPlan = typedAs<AccessPlan>()(
  z.object({
    ...recordMeta,
    id: accessPlanId,
    institutionId,
    sourceRequestId: requestId,
    items: z.array(accessPlanItem),
    licences: providedNumber,
    term: accessPlanTerm,
    startsOn: calendarDate,
    endsOn: calendarDate,
    activatedAt: isoInstant,
    history: historyOf(ACCESS_PLAN_EVENTS),
  }),
);
