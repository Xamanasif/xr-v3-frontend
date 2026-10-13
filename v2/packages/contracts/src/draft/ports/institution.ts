/**
 * §3.5 InstitutionService (+ access plans) — SA-06, SA-07, IA-01, IA-02, IA-03.
 *
 * Pause changes the institution's one stored status fact; every effect follows from it — work,
 * grants and progress are untouched (B7-04). Assigning an Institute Admin sends nothing (T-11).
 * Replacing an assigned Institute Admin is not designed: WP-0.9 answers `policy-open` INST-06
 * where Appendix C proposed `conflict` (provisional register). Licences are shown as provided.
 */
import type { AccessPlan, StudentPerson, Institution } from '@xr/domain';
import { emailAsDrawn, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  calendarDate,
  expectedRev,
  ids,
  institutionId,
  personId,
  technology,
} from '../kernel/primitives.js';
import {
  accessPlan,
  accessPlanItem,
  accessPlanStatus,
  institution,
  institutionKind,
  institutionStatus,
} from '../records/institution.js';
import { institutionCourseCode } from '../records/catalogue.js';
import { accountStatus } from '../records/people.js';
import { usageRow } from '../records/operations.js';
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
import { courseCard } from './catalogue.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';
import { attentionRow } from './shared.js';

export const INSTITUTION_TABS = [
  'all',
  'access-active',
  'ending-soon',
  'access-paused',
  'approved-payment-required',
  'access-ended',
  'no-institute-admin',
] as const;

export const listInstitutionsInput = z.object({
  tab: z.enum(INSTITUTION_TABS, { error: key('contract.invalid-input') }),
  search: z.string().optional(),
});

export const assignInstituteAdminInput = z.object({
  institutionId: ids.in.institution,
  name: requiredTrimmed(key('SA-07.name.required')),
  workEmail: emailAsDrawn(key('SA-07.workEmail.required'), key('SA-07.workEmail.format')),
  expectedRev,
});

/** "Add a reason — it is kept in the history" (B7-03 f7). */
export const pauseInstitutionInput = z.object({
  institutionId: ids.in.institution,
  reason: requiredTrimmed(key('SA-07.reason.required')),
  expectedRev,
});
export const restoreInstitutionInput = pauseInstitutionInput;

export const overrideStudentStatusInput = z.object({
  studentId: ids.in.person,
  to: accountStatus,
  reason: requiredTrimmed(key('SA-07.reason.required')),
  expectedRev,
});

/**
 * SA-06 row. `planSummary` is pre-rendered words (Appendix C [P]; conflicts with §1.5) —
 * PROVISIONAL until SA-06 is built in Phase 1 (provisional register).
 */
export const institutionRow = z.object({
  id: institutionId,
  name: z.string().min(1),
  kind: institutionKind,
  status: institutionStatus,
  instituteAdminName: z.string().nullable(),
  accessEndsOn: calendarDate.nullable(),
  planSummary: z.string(),
});

/** SA-07: the "Institution report" is per format, never added up (B7-03). */
export const institutionDetail = z.object({
  institution,
  status: institutionStatus,
  plans: z.array(accessPlan),
  people: z.object({
    students: z.number().int().min(0),
    faculty: z.number().int().min(0),
    studentList: z.array(
      z.object({
        id: personId,
        name: z.string().min(1),
        institutionStudentId: z.string().min(1),
        status: accountStatus,
      }),
    ),
  }),
  report: z.array(usageRow),
});

/** IA-01: attention ≤ 6 rows (BR-138). */
export const myOverview = z.object({
  institution,
  status: institutionStatus,
  plan: accessPlan.nullable(),
  attention: z.array(attentionRow).max(6),
});

/** IA-02: no amend control (T-08); "AR is published but not in your plan" (ACC-10). */
export const contentAccessRow = z.object({
  course: courseCard,
  items: z.array(accessPlanItem),
  publishedNotInPlan: z.array(technology),
  institutionCode: institutionCourseCode.nullable(),
});

/** IA-03: licences "as approved by BITS" — no figure is derived (T-06). */
export const accessPlanView = z.object({
  plan: accessPlan,
  status: accessPlanStatus,
  studentsGiven: z.number().int().min(0),
});

export const listInstitutionsOutput = z.array(institutionRow);
export const listContentAccessOutput = z.array(contentAccessRow);

export type InstitutionRow = Out<typeof institutionRow>;
export type InstitutionDetail = Out<typeof institutionDetail>;

export interface InstitutionService {
  // Super Admin
  listInstitutions(
    filter: In<typeof listInstitutionsInput>,
  ): Answer<readonly InstitutionRow[], NotSignedIn | NotPermitted | Unavailable>;
  getInstitution(
    id: In<typeof ids.in.institution>,
  ): Answer<InstitutionDetail, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** Policy-open: INST-06 (an Institute Admin is already assigned; replacing one is not designed). */
  assignInstituteAdmin(
    input: In<typeof assignInstituteAdminInput>,
  ): Answer<
    Institution,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | Refused<'access-not-active'>
    | PolicyOpen
    | StaleVersion
    | Unavailable
  >;
  pauseInstitution(
    input: In<typeof pauseInstitutionInput>,
  ): Answer<
    Institution,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  restoreInstitution(
    input: In<typeof restoreInstitutionInput>,
  ): Answer<
    Institution,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  overrideStudentStatus(
    input: In<typeof overrideStudentStatusInput>,
  ): Answer<
    StudentPerson,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  // Institute Admin
  getMyOverview(): Answer<Out<typeof myOverview>, NotSignedIn | NotPermitted | Unavailable>;
  listContentAccess(): Answer<
    Out<typeof listContentAccessOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  getAccessPlan(planId: In<typeof ids.in.accessPlan>): Answer<
    {
      readonly plan: AccessPlan;
      readonly status: Out<typeof accessPlanStatus>;
      readonly studentsGiven: number;
    },
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
}
