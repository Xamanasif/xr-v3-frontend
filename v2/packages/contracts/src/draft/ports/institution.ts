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
  accessPlanId,
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

/**
 * SA-06's status tabs and search (B7-02 script `match`, Phase-1 Package 1D): `all`; `access-active`
 * holds the institutions whose access is active or ending soon ("Access active 4" = two active +
 * two ending soon); `ending-soon`, `access-paused`, `approved-payment-required` and `access-ended`
 * one status each; `no-institute-admin` the rows flagged "Needs one". The search matches the
 * institution's name, its access plans' references and its Institute Admin's name, ignoring case
 * ("Institution, access plan or Institute Admin").
 */
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

/** One access plan on an SA-06 row: "ACC-0107 · 1 course · 1 experiment" (B7-02), as facts. */
export const institutionRowPlan = z.object({
  id: accessPlanId,
  /** The distinct courses of the plan's experiments. */
  courseCount: z.number().int().min(0),
  /** The experiments in the plan. */
  experimentCount: z.number().int().min(0),
});

/**
 * SA-06 row (B7-02), canonical facts only — the words are the web layer's (Appendix C §1.5). Built
 * in Phase-1 Package 1D, where Appendix C's pre-rendered `planSummary` became the facts it was
 * written from (PC-13; provisional register PC-36). Rows come newest institution first.
 */
export const institutionRow = z.object({
  id: institutionId,
  name: z.string().min(1),
  kind: institutionKind,
  status: institutionStatus,
  instituteAdminName: z.string().nullable(),
  /**
   * "Needs one" (B7-02: "“No Institute Admin” is flagged on the row, not a status"): none is
   * assigned while access is active, ending soon or paused — the states in which one may be
   * assigned (INST-04). The `no-institute-admin` tab holds exactly these rows.
   */
  needsInstituteAdmin: z.boolean(),
  /** "Ends 7 Oct 2027" / "Ended 15 Oct 2026": the last end date of its plans; null before one. */
  accessEndsOn: calendarDate.nullable(),
  /** Its access plans, newest first; none while the approved request waits for its payment. */
  plans: z.array(institutionRowPlan),
  /** "No access plan yet · 1 experiment requested": the experiments its first request asked for. */
  requestedExperimentCount: z.number().int().min(0),
});

/**
 * SA-07: the "Institution report" is per format, never added up (B7-03). Each listed student
 * carries the revision of its own record (`rev`), which "Change status" sends as the
 * `expectedRev` of `overrideStudentStatus` (Phase-1 Package 1D; provisional register PC-37).
 */
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
        /** The student record's `rev`, read with the record — never made up by a screen. */
        rev: z.number().int().min(1),
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
