/**
 * §3.5 InstitutionService (+ access plans) — SA-06, SA-07, IA-01, IA-02, IA-03.
 *
 * Pause changes the institution's one stored status fact; every effect follows from it — work,
 * grants and progress are untouched (B7-04). Assigning an Institute Admin sends nothing (T-11).
 * Replacing an assigned Institute Admin is not designed: WP-0.9 answers `policy-open` INST-06
 * where Appendix C proposed `conflict` (provisional register). Licences are shown as provided.
 */
import type { StudentPerson, Institution } from '@xr/domain';
import { emailAsDrawn, requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  accessPlanId,
  calendarDate,
  courseId,
  expectedRev,
  experimentId,
  groupId,
  ids,
  institutionId,
  isoInstant,
  personId,
  studentAccessGrantId,
  technology,
} from '../kernel/primitives.js';
import { grantDisplayStatus } from '../records/access.js';
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

/**
 * IA-01 "Needs your attention" (B2-01): one fact per drawn row kind, never words — the web layer
 * writes them (Appendix C §1.5; Phase-2 Package 2A replaced Appendix C's pre-rendered
 * `attentionRow`, provisional register PC-38). Each item is derived from the records on every
 * read: the pause, a plan's term (`accessPlanStatus`), the supplied licence waits (never counted,
 * T-06 / D7), the held experiments no active grant reaches, the active students no active grant
 * reaches, and the held courses without an institution code. Device requests (DEV-17) and
 * problem reports (P2-11) are not items until their decisions are taken.
 */
export const instituteAttention = z.discriminatedUnion('kind', [
  /** "BITS has paused your institution’s access" (B2-01 f5) — the only item while paused. */
  z.object({ kind: z.literal('institution-paused') }),
  /** "Access plan ACC-0107 ends in 15 days" / "Ends 7 Oct 2027 · renewal reminder due" (f3, f7). */
  z.object({
    kind: z.literal('plan-ending-soon'),
    planId: accessPlanId,
    endsOn: calendarDate,
    daysLeft: z.number().int().min(0),
  }),
  /** "Access plan ACC-0107 has ended" (f4) — the only item once every plan has ended. */
  z.object({ kind: z.literal('plan-ended'), planId: accessPlanId, endedOn: calendarDate }),
  /** "2 students are waiting for a licence" · experiment (f7): supplied waits, never counted. */
  z.object({
    kind: z.literal('students-waiting-for-a-licence'),
    experimentId,
    experimentName: z.string().min(1),
    students: z.number().int().min(1),
  }),
  /** "Shell-and-Tube Heat Exchanger hasn’t been given to any student" · "ME ZG523 · access plan ACC-0107" (f0). */
  z.object({
    kind: z.literal('experiment-not-given'),
    planId: accessPlanId,
    experimentId,
    /** The experiment's course, so "Give access" opens IA-05 on it (PC-38). */
    courseId,
    experimentName: z.string().min(1),
    courseCode: z.string().nullable(),
  }),
  /** "12 students have no access yet" · "Imported on 8 Oct 2026" / "Added on 15 Sep 2027" (f0, f7). */
  z.object({
    kind: z.literal('students-without-access'),
    students: z.number().int().min(1),
    lastAddedOn: calendarDate,
    lastAddedHow: z.enum(['form', 'import']),
  }),
  /** "ME ZG523 has no course code from your institution" · "Content access · Course codes" (f0). */
  z.object({
    kind: z.literal('course-without-code'),
    courseId,
    courseCode: z.string().nullable(),
  }),
]);

/**
 * "ends 7 Oct 2027 — 15 days left" (B2-01 f3, B2-02 f3, B2-03 f2): the days left in a plan's term
 * on the sample clock while the term is live, null once it has ended (Phase-2 Package 2A; the
 * screens have no clock of their own).
 */
const daysLeftInTerm = z.number().int().min(0).nullable();

/** IA-01: the institution, its status, its current plan and attention ≤ 6 items (BR-138). */
export const myOverview = z.object({
  institution,
  status: institutionStatus,
  /** The plan the status line names: the newest live plan, else the newest plan; none before payment. */
  plan: accessPlan.nullable(),
  /** The days left in `plan`'s term while it is live; null once it has ended, or with no plan. */
  planDaysLeft: daysLeftInTerm,
  attention: z.array(instituteAttention).max(6),
});

/**
 * A plan as IA-02's plan band draws it (B2-02: "Access plan ACC-0107 · Active · 120 licences ·
 * Yearly · 8 Oct 2026 – 7 Oct 2027 [· 15 days left]"): the plan, its status and the days left in
 * its term (Phase-2 Package 2A).
 */
export const planStanding = z.object({
  plan: accessPlan,
  status: accessPlanStatus,
  daysLeft: daysLeftInTerm,
});

/**
 * One IA-02 table row (B2-02 f0, Phase-2 Package 2A): an experiment of one plan, its formats in
 * that plan, the published formats the plan leaves out ("AR is published but not in your plan",
 * ACC-10 — per experiment), and how many students an active grant of that plan gives it to now
 * ("1 student", "None yet") — people, never licences (T-06).
 */
export const contentAccessExperiment = z.object({
  experimentId,
  name: z.string().min(1),
  planId: accessPlanId,
  formats: z.array(technology).min(1),
  publishedNotInPlan: z.array(technology),
  studentsGiven: z.number().int().min(0),
});

/**
 * IA-02: no amend control (T-08); "AR is published but not in your plan" (ACC-10). Phase-2
 * Package 2A adds the facts B2-02 draws per plan and per experiment: `plans` (the plans holding
 * the course's experiments, newest first) and `experiments` (one per plan item).
 */
export const contentAccessRow = z.object({
  course: courseCard,
  items: z.array(accessPlanItem),
  publishedNotInPlan: z.array(technology),
  institutionCode: institutionCourseCode.nullable(),
  plans: z.array(planStanding),
  experiments: z.array(contentAccessExperiment),
});

/**
 * One row of IA-03's "Students you’ve given access" (B2-03 f1, Phase-2 Package 2A): an active
 * grant of the plan and a student it reaches now (a group grant reaches each current member), with
 * the grant's status as the plan page reads it (`grantDisplayStatus`, screen `plan-page`: paused
 * while the institution is paused, access ended once the term has ended).
 */
export const planGrantRow = z.object({
  grantId: studentAccessGrantId,
  experimentId,
  student: z.object({
    id: personId,
    fullName: z.string().min(1),
    institutionStudentId: z.string().min(1),
  }),
  givenAt: isoInstant,
  via: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('student') }),
    z.object({ kind: z.literal('group'), groupId, groupName: z.string().min(1) }),
  ]),
  display: grantDisplayStatus,
});

/** A grant of the plan in any state, naming whom it gives to — IA-03's history lines. */
export const planGrant = z.object({
  id: studentAccessGrantId,
  experimentId,
  target: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('student'), studentId: personId, name: z.string().min(1) }),
    z.object({ kind: z.literal('group'), groupId, name: z.string().min(1) }),
  ]),
});

/**
 * IA-03: licences "as approved by BITS" — no figure is derived (T-06). Phase-2 Package 2A adds
 * what B2-03 draws beyond the plan record: the days left in its term, the institution's name (the
 * overline), each experiment with its course and the published formats the plan leaves out, the
 * students given access with each grant's plan-page status, and the plan's grants for the history.
 */
export const accessPlanView = z.object({
  plan: accessPlan,
  status: accessPlanStatus,
  studentsGiven: z.number().int().min(0),
  daysLeft: daysLeftInTerm,
  institutionName: z.string().min(1),
  experiments: z.array(
    z.object({
      experimentId,
      name: z.string().min(1),
      course: z.object({
        id: courseId,
        name: z.string().min(1),
        platformCode: z.string().nullable(),
      }),
      formats: z.array(technology).min(1),
      publishedNotInPlan: z.array(technology),
    }),
  ),
  givenTo: z.array(planGrantRow),
  grants: z.array(planGrant),
});

export const listInstitutionsOutput = z.array(institutionRow);
export const listContentAccessOutput = z.array(contentAccessRow);

export type InstitutionRow = Out<typeof institutionRow>;
export type InstituteAttention = Out<typeof instituteAttention>;
export type MyOverview = Out<typeof myOverview>;
export type InstitutionDetail = Out<typeof institutionDetail>;
export type ContentAccessRow = Out<typeof contentAccessRow>;
export type ContentAccessExperiment = Out<typeof contentAccessExperiment>;
export type AccessPlanView = Out<typeof accessPlanView>;
export type PlanGrantRow = Out<typeof planGrantRow>;
export type PlanGrant = Out<typeof planGrant>;

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
  getAccessPlan(
    planId: In<typeof ids.in.accessPlan>,
  ): Answer<AccessPlanView, NotSignedIn | NotPermitted | NotFound | Unavailable>;
}
