/**
 * §3.5 InstitutionService (SA-06, SA-07, IA-01 … IA-03; M01, M02, M05; Flow B1–B2).
 *
 * Pause changes the institution's one stored fact; work, grants and progress are untouched
 * (B7-04; invariant 4). Assigning an Institute Admin sends nothing (T-11); replacing one is
 * INST-06 (`policy-open`). Licences are shown as provided — never counted (T-06).
 */
import {
  assignInstituteAdminInput,
  type InstitutionService,
  overrideStudentStatusInput,
  pauseInstitutionInput,
  restoreInstitutionInput,
} from '@xr/contracts/draft';
import {
  accessPlanStatus,
  type AccessPlanItem,
  assignInstituteAdmin,
  currentMembers,
  iaContentAccess,
  type Institution,
  institutionStatus,
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
    listInstitutions: deferred('InstitutionService.listInstitutions'),
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
