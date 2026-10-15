/**
 * The Institute Admin reads Phase-2 Package 2A delivers (IA-01, IA-06, IA-08 and IA-06's group
 * filter): `getMyOverview`, `listStudents`, `listFaculty`, `listGroups`. Each reads the admin's own
 * institution only and derives every fact from the records on every read — nothing is stored or
 * counted for licences (T-06, D7): a "waiting for a licence" item is a supplied wait.
 */
import type { InstituteAttention, MyOverview, StudentDirectoryRow } from '@xr/contracts/draft';
import {
  type AccessPlan,
  accessPlanStatus,
  type CourseId,
  currentMembers,
  dateOf,
  daysLeft,
  type FacultyPerson,
  grantDisplayStatus,
  type Group,
  type Institution,
  institutionStatus,
  planTermState,
  type StudentAccessGrant,
  studentDirectoryStatus,
  type StudentDirectoryStatus,
  type StudentPerson,
  type Technology,
} from '@xr/domain';

import type { Op } from '../pipeline/runner.js';
import { grantsOf, groupsOf, mappingsOf, plansOf, studentsOf, waitsOf } from '../world/queries.js';
import { courseCodeKey, values } from '../world/records.js';

/** IA-01 "at most six rows" (B2-01 f7; BR-138). */
const ATTENTION_ROWS = 6;

/** Newest plan first (by activation; the reference breaks a tie) — as SA-06 orders them. */
function newestFirst(a: AccessPlan, b: AccessPlan): number {
  if (a.activatedAt !== b.activatedAt) return a.activatedAt < b.activatedAt ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** The current members of the groups an active group grant names, by group. */
function reachedBy(grant: StudentAccessGrant, groups: ReadonlyMap<string, Group>): string[] {
  if (grant.target.kind === 'student') return [grant.target.studentId];
  const group = groups.get(grant.target.groupId);
  return group ? [...currentMembers(group)] : [];
}

/** The active grants of the institution, each with the students it reaches now. */
function activeReach(op: Op, institutionId: string) {
  const groups = new Map(groupsOf(op.records, institutionId).map((group) => [group.id, group]));
  return grantsOf(op.records, institutionId)
    .filter((grant) => grant.state === 'active')
    .map((grant) => ({ grant, students: reachedBy(grant, groups) }));
}

/** The formats a grant inherits from its plan item (LD-1). */
function formatsOf(op: Op, grant: StudentAccessGrant): readonly Technology[] {
  const plan = op.records.plans[grant.accessPlanId];
  return plan?.items.find((item) => item.experimentId === grant.experimentId)?.formats ?? [];
}

/**
 * IA-01 "Needs your attention" (B2-01; provisional register PC-38). While the institution is
 * paused the pause is the only item (f5: "Pages are read-only until BITS lifts the pause."); once
 * every plan has ended, the newest plan's end is the only item (f4). Otherwise, in the order the
 * boards draw them (f7, f0): plans ending soon, supplied licence waits by experiment, held
 * experiments no active grant reaches, active students no active grant reaches, held courses
 * without the institution's own code.
 */
function attentionOf(
  op: Op,
  institution: Institution,
  plans: readonly AccessPlan[],
): InstituteAttention[] {
  if (plans.length === 0) return [];
  if (institution.pause) return [{ kind: 'institution-paused' }];
  const live = plans.filter((plan) => planTermState(plan, op.now) !== 'ended');
  if (live.length === 0) {
    const ended = plans[0]!;
    return [{ kind: 'plan-ended', planId: ended.id, endedOn: ended.endsOn }];
  }
  const items: InstituteAttention[] = [];
  for (const plan of live) {
    if (accessPlanStatus(plan, institution, op.now) === 'ending-soon') {
      items.push({
        kind: 'plan-ending-soon',
        planId: plan.id,
        endsOn: plan.endsOn,
        daysLeft: Math.max(0, daysLeft(plan, op.now)),
      });
    }
  }

  // Supplied waits only (seed or the licence oracle) — "2 students are waiting for a licence":
  // a student counts while the grant still reaches them and reads "Waiting for a licence" as IA-04
  // reads it (`grantDisplayStatus`): an inactive student, an ended plan or a member who left the
  // group is not waiting.
  const waits = waitsOf(op.records, institution.id);
  const groups = new Map(groupsOf(op.records, institution.id).map((group) => [group.id, group]));
  const waitingByExperiment = new Map<string, Set<string>>();
  for (const wait of waits) {
    const grant = op.records.grants[wait.grantId];
    const student = op.records.people[wait.studentId];
    const plan = grant ? op.records.plans[grant.accessPlanId] : undefined;
    if (!grant || !plan || student?.kind !== 'student') continue;
    if (!reachedBy(grant, groups).includes(student.id)) continue;
    const display = grantDisplayStatus({
      grant,
      student,
      plan,
      institution,
      waits,
      alsoInActiveGroupGrant: false,
      screen: 'student-access',
      now: op.now,
    });
    if (display !== 'waiting-for-a-licence') continue;
    const students = waitingByExperiment.get(grant.experimentId) ?? new Set<string>();
    students.add(student.id);
    waitingByExperiment.set(grant.experimentId, students);
  }
  for (const [experimentId, students] of waitingByExperiment) {
    const experiment = op.records.experiments[experimentId];
    if (!experiment) continue;
    items.push({
      kind: 'students-waiting-for-a-licence',
      experimentId: experiment.id,
      experimentName: experiment.live.catalogue.name,
      students: students.size,
    });
  }

  const reach = activeReach(op, institution.id);
  const givenExperiments = new Set(
    reach.filter((entry) => entry.students.length > 0).map((entry) => entry.grant.experimentId),
  );
  const seen = new Set<string>();
  for (const plan of live) {
    for (const item of plan.items) {
      if (seen.has(item.experimentId) || givenExperiments.has(item.experimentId)) continue;
      seen.add(item.experimentId);
      const experiment = op.records.experiments[item.experimentId];
      if (!experiment) continue;
      items.push({
        kind: 'experiment-not-given',
        planId: plan.id,
        experimentId: experiment.id,
        courseId: experiment.courseId,
        experimentName: experiment.live.catalogue.name,
        courseCode: op.records.courses[experiment.courseId]?.platformCode ?? null,
      });
    }
  }

  const reached = new Set(reach.flatMap((entry) => entry.students));
  const without = studentsOf(op.records, institution.id).filter(
    (student) => student.accountStatus === 'active' && !reached.has(student.id),
  );
  if (without.length > 0) {
    const last = without.reduce((latest, student) =>
      student.added.at > latest.added.at ? student : latest,
    );
    items.push({
      kind: 'students-without-access',
      students: without.length,
      lastAddedOn: dateOf(last.added.at),
      lastAddedHow: last.added.how,
    });
  }

  const courses = new Set<string>();
  for (const plan of live) {
    for (const item of plan.items) {
      const courseId = op.records.experiments[item.experimentId]?.courseId;
      if (courseId) courses.add(courseId);
    }
  }
  for (const courseId of courses) {
    const course = op.records.courses[courseId];
    if (!course) continue;
    // A code record whose code was cleared is no code (as the Student's T-17 reading).
    if (op.records.courseCodes[courseCodeKey(institution.id, courseId)]?.code != null) continue;
    items.push({
      kind: 'course-without-code',
      courseId: course.id,
      courseCode: course.platformCode,
    });
  }
  return items.slice(0, ATTENTION_ROWS);
}

/** IA-01 (B2-01): the institution, its status, the plan its status line names and attention. */
export function instituteOverview(op: Op, institution: Institution): MyOverview {
  const plans = plansOf(op.records, institution.id).sort(newestFirst);
  const live = plans.filter((plan) => planTermState(plan, op.now) !== 'ended');
  const plan = live[0] ?? plans[0] ?? null;
  return {
    institution,
    status: institutionStatus(institution, plans, op.now),
    plan,
    planDaysLeft: plan ? termDaysLeft(plan, op.now) : null,
    attention: attentionOf(op, institution, plans),
  };
}

/**
 * "15 days left" (B2-01 f3, B2-02 f3, B2-03 f2): the days left in a plan's term on the sample
 * clock while the term is live; null once it has ended (Package 2A).
 */
export function termDaysLeft(plan: AccessPlan, now: Op['now']): number | null {
  return planTermState(plan, now) === 'ended' ? null : Math.max(0, daysLeft(plan, now));
}

export interface StudentDirectoryFilter {
  readonly status?: StudentDirectoryStatus | undefined;
  readonly groupId?: string | undefined;
  readonly notInGroup?: boolean | undefined;
  readonly search?: string | undefined;
}

/**
 * IA-06 rows (B2-06; PC-39), in the order the students were added: each student's current groups
 * and the experiments an active grant gives them now (individually, or through a group they are
 * a member of), with the plan's formats. The status is `studentDirectoryStatus` over those grants.
 */
export function studentDirectory(
  op: Op,
  institution: Institution,
  filter: StudentDirectoryFilter,
): StudentDirectoryRow[] {
  const groups = groupsOf(op.records, institution.id);
  const reach = activeReach(op, institution.id);
  const search = filter.search?.trim().toLocaleLowerCase('en') ?? '';
  const rows: StudentDirectoryRow[] = [];
  for (const student of studentsOf(op.records, institution.id)) {
    const memberOf = groups.filter((group) => currentMembers(group).includes(student.id));
    const given: StudentDirectoryRow['given'][number][] = [];
    for (const { grant, students } of reach) {
      if (!students.includes(student.id)) continue;
      if (given.some((entry) => entry.experimentId === grant.experimentId)) continue;
      const experiment = op.records.experiments[grant.experimentId];
      if (!experiment) continue;
      given.push({
        experimentId: experiment.id,
        name: experiment.live.catalogue.name,
        formats: [...formatsOf(op, grant)],
      });
    }
    const directoryStatus = studentDirectoryStatus(student, given.length > 0);
    if (filter.status && directoryStatus !== filter.status) continue;
    if (filter.groupId && !memberOf.some((group) => group.id === filter.groupId)) continue;
    if (filter.notInGroup && memberOf.length > 0) continue;
    if (search !== '' && !matches(student, search)) continue;
    rows.push({
      student,
      directoryStatus,
      groups: memberOf.map((group) => ({ id: group.id, name: group.name })),
      given,
      courses: peopleCoursesOf(
        op,
        student.courseFilings.map((filing) => filing.courseId),
      ),
    });
  }
  return rows;
}

type CourseRecord = NonNullable<Op['records']['courses'][string]>;

/** A course as People names it (`peopleCourse`). */
export interface PeopleCourseFacts {
  readonly id: CourseRecord['id'];
  readonly name: string;
  readonly platformCode: CourseRecord['platformCode'];
}

/**
 * The named courses People shows (PC-40): "ME ZG523 · Thermodynamics & Heat Transfer" — each
 * course once, in the order given; a course the records no longer hold is left out.
 */
export function peopleCoursesOf(op: Op, courseIds: readonly string[]): PeopleCourseFacts[] {
  const seen = new Set<string>();
  const courses: PeopleCourseFacts[] = [];
  for (const id of courseIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const course = op.records.courses[id];
    if (course)
      courses.push({ id: course.id, name: course.name, platformCode: course.platformCode });
  }
  return courses;
}

/** "Name, student ID or e-mail" (B2-06 search), ignoring case. */
function matches(student: StudentPerson, search: string): boolean {
  return [student.fullName, student.institutionStudentId, student.institutionEmail]
    .join(' ')
    .toLocaleLowerCase('en')
    .includes(search);
}

/** IA-08 rows (B2-06 f14): each faculty member and the courses their current mappings name. */
export function facultyDirectory(
  op: Op,
  institution: Institution,
): {
  readonly faculty: FacultyPerson;
  readonly coursesTaught: CourseId[];
  readonly courses: PeopleCourseFacts[];
}[] {
  const mappings = mappingsOf(op.records, institution.id).filter(
    (mapping) => mapping.removedAt === null,
  );
  return values(op.records.people)
    .filter(
      (person): person is FacultyPerson =>
        person.institutionId === institution.id && person.kind === 'faculty',
    )
    .map((faculty) => {
      const coursesTaught = mappings
        .filter((mapping) => mapping.facultyId === faculty.id)
        .map((mapping) => mapping.courseId);
      return { faculty, coursesTaught, courses: peopleCoursesOf(op, coursesTaught) };
    });
}

/** IA-13 / IA-06's Group filter: each group and its current member count. */
export function groupDirectory(
  op: Op,
  institution: Institution,
): { readonly group: Group; readonly memberCount: number }[] {
  return groupsOf(op.records, institution.id).map((group) => ({
    group,
    memberCount: currentMembers(group).length,
  }));
}
