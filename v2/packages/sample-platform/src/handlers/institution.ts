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
  type INSTITUTION_TABS,
  type InstitutionRow,
  type InstitutionService,
  listInstitutionsInput,
  overrideStudentStatusInput,
  pauseInstitutionInput,
  restoreInstitutionInput,
} from '@xr/contracts/draft';
import {
  type AccessPlan,
  accessPlanStatus,
  type AccessPlanItem,
  assignInstituteAdmin,
  currentMembers,
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
import { courseCodeKey, values } from '../world/records.js';
import { deferred } from './deferred.js';
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

/** Distinct students an active grant of this plan reaches (a count of people, never licences). */
function studentsGiven(op: Op, planId: string): number {
  const reached = new Set<string>();
  for (const grant of values(op.records.grants)) {
    if (grant.accessPlanId !== planId || grant.state !== 'active') continue;
    if (grant.target.kind === 'student') reached.add(grant.target.studentId);
    else {
      const group = op.records.groups[grant.target.groupId];
      if (group) currentMembers(group).forEach((member) => reached.add(member));
    }
  }
  return reached.size;
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
    getMyOverview: deferred('InstitutionService.getMyOverview'),

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
        const next = op.decide(
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
        const byCourse = new Map<string, { items: AccessPlanItem[]; notInPlan: Set<Technology> }>();
        const experiments = values(op.records.experiments);
        for (const plan of plansOf(op.records, institutionId)) {
          // The plan's experiments × formats and the published formats it leaves out (`iaContentAccess`).
          for (const { item, publishedNotInPlan } of iaContentAccess(plan, experiments)) {
            const experiment = op.records.experiments[item.experimentId];
            if (!experiment) continue;
            const row = byCourse.get(experiment.courseId) ?? { items: [], notInPlan: new Set() };
            row.items.push(item);
            for (const format of publishedNotInPlan) row.notInPlan.add(format);
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
        return {
          plan,
          status: accessPlanStatus(plan, institution, op.now),
          studentsGiven: studentsGiven(op, plan.id),
        };
      }),
  };
}
