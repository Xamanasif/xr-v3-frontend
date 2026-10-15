/**
 * §3.5 InstitutionService (SA-06, SA-07, IA-01 … IA-03; M01, M02, M05; Flow B1–B2).
 *
 * Pause changes the institution's one stored fact; work, grants and progress are untouched
 * (B7-04; invariant 4). Assigning an Institute Admin sends nothing (T-11); replacing one is
 * INST-06 (`policy-open`). Licences are shown as provided — never counted (T-06).
 *
 * `listInstitutions` (SA-06) was built by Phase-1 Package 1D (ledger `PACKAGE_DELIVERIES`): the
 * rows are read from the same records and status rules as `getInstitution`, so the list and the
 * detail always agree.
 */
import {
  assignInstituteAdminInput,
  type ContentAccessExperiment,
  type INSTITUTION_TABS,
  type InstitutionRow,
  type InstitutionService,
  listInstitutionsInput,
  overrideStudentStatusInput,
  pauseInstitutionInput,
  type PlanGrant,
  type PlanGrantRow,
  restoreInstitutionInput,
  SAMPLE_IDENTITY_KEYS,
} from '@xr/contracts/draft';
import {
  type AccessPlan,
  accessPlanStatus,
  type AccessPlanItem,
  assignInstituteAdmin,
  currentMembers,
  grantDisplayStatus,
  iaContentAccess,
  type Institution,
  institutionStatus,
  type InstitutionStatus,
  overrideStudentStatus,
  pauseInstitution,
  restoreInstitution,
  type Technology,
  usage,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import { grantsOf, groupsOf, plansOf, studentsOf, waitsOf } from '../world/queries.js';
import { decideWithIdentity } from './identity-safeguard.js';
import { courseCodeKey, values } from '../world/records.js';
import { instituteOverview, termDaysLeft } from './institute-reads.js';
import { ownInstitution } from './people.js';
import { institutionSubject, personSubject } from './subjects.js';
import { courseCardOf } from './views.js';

/** IA-20 / SA-07 report: per experiment × format, each column from its own state (M27). */
export function usageOf(op: Op, institution: Institution) {
  const records = op.records;
  return usage({
    institution,
    plans: plansOf(records, institution.id),
    experiments: values(records.experiments),
    students: studentsOf(records, institution.id),
    grants: grantsOf(records, institution.id),
    groups: groupsOf(records, institution.id),
    waits: waitsOf(records, institution.id),
    overlap: op.core.overlap,
    activities: values(records.activities),
    completions: values(records.completions),
    now: op.now,
  });
}

/**
 * Distinct students an active grant of this plan reaches (a count of people, never licences) —
 * for one of its experiments only when `experimentId` is given (IA-02 "1 student", Package 2A).
 */
function studentsGiven(op: Op, planId: string, experimentId?: string): number {
  const reached = new Set<string>();
  for (const grant of values(op.records.grants)) {
    if (grant.accessPlanId !== planId || grant.state !== 'active') continue;
    if (experimentId !== undefined && grant.experimentId !== experimentId) continue;
    if (grant.target.kind === 'student') reached.add(grant.target.studentId);
    else {
      const group = op.records.groups[grant.target.groupId];
      if (group) currentMembers(group).forEach((member) => reached.add(member));
    }
  }
  return reached.size;
}

/** IA-02 / IA-03 (Package 2A): a plan with its status and the days left in its term. */
function planStandingOf(op: Op, plan: AccessPlan, institution: Institution) {
  return {
    plan,
    status: accessPlanStatus(plan, institution, op.now),
    daysLeft: termDaysLeft(plan, op.now),
  };
}

/**
 * IA-03 "Students you’ve given access" (B2-03 f1, Package 2A): each active grant of the plan and
 * each student it reaches now (a group grant: its current members), oldest grant first, with the
 * grant's status as the plan page reads it (`grantDisplayStatus`, screen `plan-page`).
 */
function planGrantRows(op: Op, plan: AccessPlan, institution: Institution): PlanGrantRow[] {
  const waits = waitsOf(op.records, institution.id);
  const rows: PlanGrantRow[] = [];
  const grants = grantsOf(op.records, institution.id)
    .filter((grant) => grant.accessPlanId === plan.id && grant.state === 'active')
    .sort((a, b) => (a.givenAt === b.givenAt ? 0 : a.givenAt < b.givenAt ? -1 : 1));
  for (const grant of grants) {
    const group = grant.target.kind === 'group' ? op.records.groups[grant.target.groupId] : null;
    const reached =
      grant.target.kind === 'student'
        ? [grant.target.studentId]
        : group
          ? [...currentMembers(group)]
          : [];
    for (const studentId of reached) {
      const student = op.records.people[studentId];
      if (student?.kind !== 'student') continue;
      rows.push({
        grantId: grant.id,
        experimentId: grant.experimentId,
        student: {
          id: student.id,
          fullName: student.fullName,
          institutionStudentId: student.institutionStudentId,
        },
        givenAt: grant.givenAt,
        via: group
          ? { kind: 'group', groupId: group.id, groupName: group.name }
          : { kind: 'student' },
        display: grantDisplayStatus({
          grant,
          student,
          plan,
          institution,
          waits,
          alsoInActiveGroupGrant: false,
          screen: 'plan-page',
          now: op.now,
        }),
      });
    }
  }
  return rows;
}

/** IA-03's history (Package 2A): every grant of the plan, in any state, naming whom it gives to. */
function planGrants(op: Op, plan: AccessPlan): PlanGrant[] {
  return grantsOf(op.records, plan.institutionId)
    .filter((grant) => grant.accessPlanId === plan.id)
    .flatMap((grant): PlanGrant[] => {
      if (grant.target.kind === 'student') {
        const student = op.records.people[grant.target.studentId];
        if (!student) return [];
        return [
          {
            id: grant.id,
            experimentId: grant.experimentId,
            target: { kind: 'student', studentId: student.id, name: student.fullName },
          },
        ];
      }
      const group = op.records.groups[grant.target.groupId];
      if (!group) return [];
      return [
        {
          id: grant.id,
          experimentId: grant.experimentId,
          target: { kind: 'group', groupId: group.id, name: group.name },
        },
      ];
    });
}

/**
 * "Needs one" (B7-02): no Institute Admin while access is active, ending soon or paused — the
 * states in which `assignInstituteAdmin` assigns one (INST-04; it refuses `access-not-active`
 * before activation and after access ended, INST-05, INST-09).
 */
function needsInstituteAdmin(institution: Institution, status: InstitutionStatus): boolean {
  return (
    institution.instituteAdmin === null &&
    (status === 'access-active' || status === 'ending-soon' || status === 'access-paused')
  );
}

/** Newest plan first (by activation; the reference breaks a tie). */
function newestPlanFirst(a: AccessPlan, b: AccessPlan): number {
  if (a.activatedAt !== b.activatedAt) return a.activatedAt < b.activatedAt ? 1 : -1;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/** SA-06 row: the institution's facts as `getInstitution` reads them (B7-02). */
function institutionRowOf(op: Op, institution: Institution): InstitutionRow {
  const records = op.records;
  const plans = plansOf(records, institution.id).sort(newestPlanFirst);
  const status = institutionStatus(institution, plans, op.now);
  const ends = plans.map((plan) => plan.endsOn).sort();
  return {
    id: institution.id,
    name: institution.name,
    kind: institution.kind,
    status,
    instituteAdminName: institution.instituteAdmin?.name ?? null,
    needsInstituteAdmin: needsInstituteAdmin(institution, status),
    accessEndsOn: ends.at(-1) ?? null,
    plans: plans.map((plan) => ({
      id: plan.id,
      courseCount: new Set(
        plan.items.flatMap((item) => records.experiments[item.experimentId]?.courseId ?? []),
      ).size,
      experimentCount: plan.items.length,
    })),
    requestedExperimentCount: records.requests[institution.createdFromRequestId]?.items.length ?? 0,
  };
}

/** The B7-02 status tabs (`match`): "Access active" also holds the institutions ending soon. */
function inTab(row: InstitutionRow, tab: (typeof INSTITUTION_TABS)[number]): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'access-active':
      return row.status === 'access-active' || row.status === 'ending-soon';
    case 'no-institute-admin':
      return row.needsInstituteAdmin;
    default:
      return row.status === tab;
  }
}

/**
 * "Institution, access plan or Institute Admin" (B7-02 search), ignoring case: the words as one
 * line — name, plan references, Institute Admin — as B7-02's script joins them (`r.name + ' ' +
 * r.plan + ' ' + r.ia`), so a search may run across two of them ("Technology ACC-0107").
 */
function matchesSearch(row: InstitutionRow, search: string): boolean {
  if (search === '') return true;
  return [row.name, ...row.plans.map((plan) => plan.id), row.instituteAdminName ?? '']
    .join(' ')
    .toLocaleLowerCase('en')
    .includes(search);
}

function pauseOrRestore(call: Call, which: 'pause' | 'restore') {
  const method =
    which === 'pause'
      ? 'InstitutionService.pauseInstitution'
      : 'InstitutionService.restoreInstitution';
  return (input: unknown) =>
    command(call, method, (op) => {
      const person = op.person();
      const institution = op.found(
        op.records.institutions[
          op.idText((input as { institutionId?: unknown } | null)?.institutionId)
        ],
      );
      op.allow(
        person,
        which === 'pause' ? 'institution.pause' : 'institution.restore',
        institutionSubject(op.records, institution),
      );
      const accepted = op.parse(
        which === 'pause' ? pauseInstitutionInput : restoreInstitutionInput,
        input,
      );
      op.rev(institution, accepted.expectedRev);
      const decide = which === 'pause' ? pauseInstitution : restoreInstitution;
      const outcome = op.decide(
        decide({
          institution,
          plans: plansOf(op.records, institution.id),
          reason: accepted.reason,
          actor: person.ref,
          now: op.now,
          ids: op.ids,
        }),
        input,
      );
      op.tx.put('institutions', outcome.institution.id, outcome.institution);
      for (const plan of outcome.plans) op.tx.put('plans', plan.id, plan);
      return {
        value: outcome.institution,
        decision: which === 'pause' ? 'pauseInstitution' : 'restoreInstitution',
        actor: person.ref,
      };
    });
}

export function institutionPort(call: Call): InstitutionService {
  return {
    listInstitutions: (filter) =>
      read(call, 'InstitutionService.listInstitutions', (op) => {
        const person = op.person();
        const accepted = op.parse(listInstitutionsInput, filter);
        const search = accepted.search?.trim().toLocaleLowerCase('en') ?? '';
        // The method's audience is SA-06's workspace (`op.person()`): the Super Admin, who sees
        // every institution (INST-03). The record created last comes first (PC-36: no sort control
        // is drawn).
        return values(op.records.institutions)
          .filter((institution) =>
            op.canSee(person, { kind: 'institution', institutionId: institution.id }),
          )
          .sort((a, b) =>
            a.createdAt === b.createdAt
              ? a.name.localeCompare(b.name, 'en')
              : a.createdAt < b.createdAt
                ? 1
                : -1,
          )
          .map((institution) => institutionRowOf(op, institution))
          .filter((row) => inTab(row, accepted.tab) && matchesSearch(row, search));
      }),
    // Phase-2 Package 2A (IA-01): the Institute Admin's own institution (PC-38).
    getMyOverview: () =>
      read(call, 'InstitutionService.getMyOverview', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'institution', institutionId: institution.id });
        op.see(person, { kind: 'people', institutionId: institution.id });
        return instituteOverview(op, institution);
      }),

    getInstitution: (id) =>
      read(call, 'InstitutionService.getInstitution', (op) => {
        const person = op.person();
        const institution = op.found(op.records.institutions[op.idText(id)]);
        op.see(person, { kind: 'institution', institutionId: institution.id });
        const plans = plansOf(op.records, institution.id);
        const students = studentsOf(op.records, institution.id);
        return {
          institution,
          status: institutionStatus(institution, plans, op.now),
          plans,
          people: {
            students: students.length,
            faculty: values(op.records.people).filter(
              (other) => other.institutionId === institution.id && other.kind === 'faculty',
            ).length,
            studentList: students.map((student) => ({
              id: student.id,
              name: student.fullName,
              institutionStudentId: student.institutionStudentId,
              status: student.accountStatus,
              // The record's own revision: "Change status" sends it as `expectedRev` (PC-37).
              rev: student.rev,
            })),
          },
          report: [...usageOf(op, institution)],
        };
      }),

    assignInstituteAdmin: (input) =>
      command(call, 'InstitutionService.assignInstituteAdmin', (op) => {
        const person = op.person();
        const institution = op.found(
          op.records.institutions[
            op.idText((input as { institutionId?: unknown } | null)?.institutionId)
          ],
        );
        op.allow(
          person,
          'institution.assign-institute-admin',
          institutionSubject(op.records, institution),
        );
        const accepted = op.parse(assignInstituteAdminInput, input);
        op.rev(institution, accepted.expectedRev);
        // Package 2B (PC-49): an e-mail another sample identity signs in with is refused, so the
        // new Institute Admin never takes over or hides that sign-in (T-11 stays open).
        const next = decideWithIdentity(
          op,
          assignInstituteAdmin({
            institution,
            plans: plansOf(op.records, institution.id),
            name: accepted.name,
            workEmail: accepted.workEmail,
            personId: op.ids.next('person'),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          {
            email: accepted.workEmail,
            field: 'workEmail',
            key: SAMPLE_IDENTITY_KEYS.assignInstituteAdmin,
            order: ['name', 'workEmail'],
          },
        );
        op.tx.put('institutions', next.id, next);
        return { value: next, decision: 'assignInstituteAdmin', actor: person.ref };
      }),

    pauseInstitution: pauseOrRestore(call, 'pause'),
    restoreInstitution: pauseOrRestore(call, 'restore'),

    overrideStudentStatus: (input) =>
      command(call, 'InstitutionService.overrideStudentStatus', (op) => {
        const person = op.person();
        const target = op.found(
          op.records.people[op.idText((input as { studentId?: unknown } | null)?.studentId)],
        );
        const subject = op.found(personSubject(op.records, target));
        op.allow(person, 'person.override-student-status', subject);
        const accepted = op.parse(overrideStudentStatusInput, input);
        if (target.kind !== 'student') refuse({ kind: 'not-permitted', why: 'out-of-scope' });
        op.rev(target, accepted.expectedRev);
        const next = op.decide(
          overrideStudentStatus({
            student: target,
            to: accepted.to,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('people', next.id, next);
        return { value: next, decision: 'overrideStudentStatus', actor: person.ref };
      }),

    listContentAccess: () =>
      read(call, 'InstitutionService.listContentAccess', (op) => {
        const person = op.person();
        const institutionId = op.found(person.institutionId);
        op.see(person, { kind: 'access-plan', institutionId });
        const institution = op.found(op.records.institutions[institutionId]);
        const byCourse = new Map<
          string,
          {
            items: AccessPlanItem[];
            notInPlan: Set<Technology>;
            plans: AccessPlan[];
            experiments: ContentAccessExperiment[];
          }
        >();
        const experiments = values(op.records.experiments);
        for (const plan of plansOf(op.records, institutionId)) {
          // The plan's experiments × formats and the published formats it leaves out (`iaContentAccess`).
          for (const { item, publishedNotInPlan } of iaContentAccess(plan, experiments)) {
            const experiment = op.records.experiments[item.experimentId];
            if (!experiment) continue;
            const row = byCourse.get(experiment.courseId) ?? {
              items: [],
              notInPlan: new Set(),
              plans: [],
              experiments: [],
            };
            row.items.push(item);
            for (const format of publishedNotInPlan) row.notInPlan.add(format);
            // Package 2A (B2-02): the plan band and one table row per plan item.
            if (!row.plans.includes(plan)) row.plans.push(plan);
            row.experiments.push({
              experimentId: experiment.id,
              name: experiment.live.catalogue.name,
              planId: plan.id,
              formats: [...item.formats],
              publishedNotInPlan: [...publishedNotInPlan],
              studentsGiven: studentsGiven(op, plan.id, experiment.id),
            });
            byCourse.set(experiment.courseId, row);
          }
        }
        return [...byCourse].flatMap(([courseId, row]) => {
          const course = op.records.courses[courseId];
          if (!course) return [];
          return [
            {
              course: courseCardOf(op.records, course),
              items: row.items,
              publishedNotInPlan: [...row.notInPlan].filter(
                (format) => !row.items.some((item) => item.formats.includes(format)),
              ),
              institutionCode:
                op.records.courseCodes[courseCodeKey(institutionId, courseId)] ?? null,
              plans: [...row.plans]
                .sort(newestPlanFirst)
                .map((plan) => planStandingOf(op, plan, institution)),
              experiments: row.experiments,
            },
          ];
        });
      }),

    getAccessPlan: (planId) =>
      read(call, 'InstitutionService.getAccessPlan', (op) => {
        const person = op.person();
        const plan = op.found(op.records.plans[op.idText(planId)]);
        op.see(person, { kind: 'access-plan', institutionId: plan.institutionId });
        const institution = op.found(op.records.institutions[plan.institutionId]);
        // Package 2A (B2-03): the students' names are the institution's people (same audience).
        op.see(person, { kind: 'people', institutionId: plan.institutionId });
        return {
          ...planStandingOf(op, plan, institution),
          studentsGiven: studentsGiven(op, plan.id),
          institutionName: institution.name,
          experiments: iaContentAccess(plan, values(op.records.experiments)).flatMap(
            ({ item, publishedNotInPlan }) => {
              const experiment = op.records.experiments[item.experimentId];
              const course = experiment ? op.records.courses[experiment.courseId] : undefined;
              if (!experiment || !course) return [];
              return [
                {
                  experimentId: experiment.id,
                  name: experiment.live.catalogue.name,
                  course: { id: course.id, name: course.name, platformCode: course.platformCode },
                  formats: [...item.formats],
                  publishedNotInPlan: [...publishedNotInPlan],
                },
              ];
            },
          ),
          givenTo: planGrantRows(op, plan, institution),
          grants: planGrants(op, plan),
        };
      }),
  };
}
