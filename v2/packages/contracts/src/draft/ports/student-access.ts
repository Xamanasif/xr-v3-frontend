/**
 * §3.7 StudentAccessService — IA-04, IA-05; Student ST-01…ST-05, ST-19.
 *
 * Student entitlement is written only by the Institute Admin (BC3, BC9). Formats are inherited
 * from the plan — never chosen here (LD-1). "Waiting for a licence" appears only where the
 * `LicenceAvailabilityOracle` supplies it; nothing is counted (T-06, D7). The overlap of a
 * withdrawn individual grant and an active group grant answers `policy-open` OD-B2-01 (DV-1).
 */
import type { StudentAccessGrant } from '@xr/domain';
import { requiredTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  accessPlanId,
  assessmentId,
  experimentId,
  expectedRev,
  groupId,
  ids,
  personId,
  studentAccessGrantId,
  courseId,
  technology,
} from '../kernel/primitives.js';
import { grantDisplayStatus, providedLicenceWait, studentAccessGrant } from '../records/access.js';
import { accessPlan } from '../records/institution.js';
import { groupMemberStanding, studentPerson } from '../records/people.js';
import { formatProgressStatus } from '../records/learning.js';
import { attemptResult } from '../records/assessment.js';
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
import type { OpenRefusal } from '@xr/domain';
import { courseCard, publicExperimentPage } from './catalogue.js';
import type { Answer, In, Out } from './common.js';
import { key, requiredChoice } from './fields.js';

// ---- inputs ----

/** IA-04: "Show withdrawn" is a view filter, not an access statement. */
export const listGrantsInput = z.object({
  showWithdrawn: z.boolean(),
  experimentId: ids.in.experiment.optional(),
  search: z.string().optional(),
});

export const giveAccessOptionsInput = z.object({
  courseId: ids.in.course.optional(),
  preselectStudentId: ids.in.person.optional(),
  preselectGroupId: ids.in.group.optional(),
});

/** IA-05 step 2 (B2-05 `next2`): students, or one group. */
const giveAccessTarget = z.discriminatedUnion(
  'kind',
  [
    z.object({ kind: z.literal('student'), studentId: ids.in.person }),
    z.object({
      kind: z.literal('students'),
      studentIds: z
        .array(ids.in.person, { error: key('contract.invalid-input') })
        .min(1, { error: key('IA-05.students.required') }),
    }),
    z.object({
      kind: z.literal('group'),
      groupId: requiredChoice(ids.in.group, key('IA-05.group.required')),
    }),
  ],
  { error: key('IA-05.students.required') },
);

const giveAccessFields = {
  experimentIds: z
    .array(ids.in.experiment, { error: key('contract.invalid-input') })
    .min(1, { error: key('IA-05.experimentIds.required') }),
  target: giveAccessTarget,
};

export const previewGiveAccessInput = z.object(giveAccessFields);
export const giveAccessInput = z.object({ ...giveAccessFields, expectedPlanRev: expectedRev });

/** IA-04 (B2-04): DL-2 with a required reason; individual grants only. */
export const withdrawGrantInput = z.object({
  grantId: ids.in.studentAccessGrant,
  reason: requiredTrimmed(key('IA-04.reason.required')),
  expectedRev,
});

// ---- outputs ----

export const grantRow = z.object({
  grant: studentAccessGrant,
  student: studentPerson,
  experimentName: z.string().min(1),
  courseCode: z.string().nullable(),
  /** Inherited from the plan item — never stored on the grant (LD-1). */
  formats: z.array(technology),
  display: grantDisplayStatus,
  alsoInGroupGrant: studentAccessGrantId.nullable(),
  wait: providedLicenceWait.nullable(),
});

/** IA-05 steps 1–2. `selectable` and `why` are facts the service computes from the records. */
export const giveAccessOptions = z.object({
  plan: accessPlan,
  courses: z.array(courseCard),
  experiments: z.array(
    z.object({
      experimentId,
      name: z.string().min(1),
      inPlan: z.boolean(),
      formats: z.array(technology),
    }),
  ),
  students: z.array(
    z.object({
      id: personId,
      name: z.string().min(1),
      selectable: z.boolean(),
      why: z.enum(['already-has-it', 'inactive']).nullable(),
    }),
  ),
  groups: z.array(
    z.object({
      id: groupId,
      name: z.string().min(1),
      memberCount: z.number().int().min(0),
      selectable: z.boolean(),
    }),
  ),
});

/**
 * Whom a planned grant reaches and how each one stands (Phase-2 Package 2A, additive; B2-05 f2
 * "What will be created", f5 the group's members: "Already has it · inactive · waiting — stated,
 * not computed against licences"). The standing is the domain's `groupMemberStanding` for the
 * grant about to be given: a wait only where the licence oracle supplies one (T-06, D7); a member
 * whose own grant was withdrawn is the undecided overlap itself (OD-B2-01) — no can / can't.
 */
export const plannedReach = z.object({
  studentId: personId,
  name: z.string().min(1),
  standing: z.union([
    groupMemberStanding,
    z.object({ kind: z.literal('policy-open'), decision: z.string().min(1) }),
  ]),
  /** The student's own active grant for the experiment ("already has it individually (SACC-0310)"). */
  individualGrantId: studentAccessGrantId.nullable(),
});

export const plannedGrant = z.object({
  who: z.string().min(1),
  experimentId,
  formats: z.array(technology),
  reaches: z.array(plannedReach),
});

/**
 * IA-05 result: "Rahul Verma → Shell-and-Tube Heat Exchanger → SACC-0310 → Active". A wait is the
 * supplied fact (WP-0.9), not a pre-rendered note (Appendix C proposed `note: string`).
 */
export const grantResult = z.object({
  who: z.string().min(1),
  experimentId,
  grantId: studentAccessGrantId,
  display: z.enum(['active', 'waiting-for-a-licence']),
  wait: providedLicenceWait.nullable(),
});

/**
 * B2-12 per-format words. `not-available-right-now` has no designed cause, record or writer
 * (D-26): only the seed may supply it, and the gate answers `policy-open` for it.
 */
export const formatAvailability = z.enum([
  'available-to-you',
  'not-included-for-your-institution',
  'not-available-for-this-experiment',
  'not-available-right-now',
]);

/**
 * A format's availability for the Student, or — where the experiment's gate reached an undecided
 * rule (OD-B2-01, OD-B2-02, GRP-05) — that open decision, with no can / can't statement.
 */
export const formatAvailabilityOrOpen = z.union([
  formatAvailability,
  z.object({ policyOpen: z.string().min(1) }),
]);

/**
 * The drawn read-only closure of an experiment the Student still sees but cannot open now (the
 * gate's own refusal): the institution's pause, an inactive account, or a supplied licence wait
 * (B3-02 "No licence is available for you on ACC-0107 right now."; never counted, T-06 / D7).
 * The formats read with the closure lifted (B3-02 draws the header "Available to you" beside the
 * wait), so a screen that names availability names the closure too (Phase-2 Package 2A, PC-45).
 */
export const experimentClosure = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('institution-paused') }),
  z.object({ kind: z.literal('student-inactive') }),
  z.object({ kind: z.literal('waiting-for-a-licence'), planId: accessPlanId }),
]);

export const myExperimentRow = z.object({
  experimentId,
  name: z.string().min(1),
  formats: z.array(
    z.object({
      format: technology,
      availability: formatAvailabilityOrOpen,
      progress: formatProgressStatus,
    }),
  ),
  closure: experimentClosure.nullable(),
});

/** ST-02: the course code shown follows T-17 (institution code when set) [U]. */
export const myCourseRow = z.object({
  courseId,
  name: z.string().min(1),
  codeShown: z.string().nullable(),
  experimentsGiven: z.number().int().min(0),
  formatsAvailable: z.array(technology),
  earlierWork: z.boolean(),
});

export const upNextItem = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('format'), experimentId, format: technology }),
  z.object({ kind: z.literal('assessment'), assessmentId }),
  z.object({ kind: z.literal('feedback'), experimentId, format: technology }),
]);

/** ST-01: "Your institution hasn’t given you access yet." when nothing is given. */
export const studentHome = z.object({
  continue: myExperimentRow.nullable(),
  upNext: z.array(upNextItem),
  myCourses: z.array(myCourseRow),
  noAccessYet: z.boolean(),
});

export const experimentHub = z.object({
  experiment: publicExperimentPage,
  row: myExperimentRow,
  grantIds: z.array(studentAccessGrantId),
  resourceSummary: z.object({ total: z.number().int().min(0), opened: z.number().int().min(0) }),
  assessment: z.union([
    z.object({
      id: assessmentId,
      result: z.union([attemptResult, z.object({ kind: z.literal('to-do') })]),
    }),
    z.object({ kind: z.literal('none-set') }),
  ]),
});

export const listGrantsOutput = z.array(grantRow);
export const previewGiveAccessOutput = z.array(plannedGrant);
export const giveAccessOutput = z.array(grantResult);
export const listMyCoursesOutput = z.array(myCourseRow);
export const getMyCourseOutput = z.object({
  course: myCourseRow,
  experiments: z.array(myExperimentRow),
});

export type GrantRow = Out<typeof grantRow>;
export type PlannedGrant = Out<typeof plannedGrant>;
export type GrantResult = Out<typeof grantResult>;
export type GiveAccessOptions = Out<typeof giveAccessOptions>;
export type MyExperimentRow = Out<typeof myExperimentRow>;
export type ExperimentClosure = Out<typeof experimentClosure>;
export type MyCourseRow = Out<typeof myCourseRow>;
export type StudentHome = Out<typeof studentHome>;
export type ExperimentHub = Out<typeof experimentHub>;

type GiveRefusals = Refused<
  | 'institution-paused'
  | 'plan-ended'
  | 'nothing-held'
  | 'experiment-not-in-plan'
  | 'already-given'
  | 'group-empty'
  | 'student-inactive'
>;

export interface StudentAccessService {
  // Institute Admin
  listGrants(
    filter: In<typeof listGrantsInput>,
  ): Answer<readonly GrantRow[], NotSignedIn | NotPermitted | Unavailable>;
  getGiveAccessOptions(
    input: In<typeof giveAccessOptionsInput>,
  ): Answer<
    GiveAccessOptions,
    | NotSignedIn
    | NotPermitted
    | NotFound
    | Refused<'institution-paused' | 'plan-ended' | 'nothing-held'>
    | Unavailable
  >;
  /** Writes nothing (Appendix C rule 3). */
  previewGiveAccess(
    input: In<typeof previewGiveAccessInput>,
  ): Answer<
    Out<typeof previewGiveAccessOutput>,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | GiveRefusals
    | Unavailable
  >;
  giveAccess(
    input: In<typeof giveAccessInput>,
  ): Answer<
    Out<typeof giveAccessOutput>,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | GiveRefusals
    | StaleVersion
    | Unavailable
  >;
  /** Policy-open: OD-B2-01 (a group grant covers the same experiment), SACC-11. */
  withdrawGrant(
    input: In<typeof withdrawGrantInput>,
  ): Answer<
    StudentAccessGrant,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'institution-paused' | 'student-inactive'>
    | PolicyOpen
    | StaleVersion
    | Unavailable
  >;
  // Student
  getMyHome(): Answer<StudentHome, NotSignedIn | NotPermitted | Unavailable>;
  listMyCourses(): Answer<readonly MyCourseRow[], NotSignedIn | NotPermitted | Unavailable>;
  getMyCourse(
    courseId: In<typeof ids.in.course>,
  ): Answer<Out<typeof getMyCourseOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** The ST-19 family; policy-open: OD-B2-01, OD-B2-02, GRP-05, SACC-14, D-26. */
  getExperimentHub(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<
    ExperimentHub,
    NotSignedIn | NotPermitted | Refused<OpenRefusal> | PolicyOpen | Unavailable
  >;
}
