/**
 * §3.7 StudentAccessService (IA-04, IA-05; ST-01 … ST-05, ST-19; M15; Flow B3–B5).
 *
 * Student entitlement is written only by the Institute Admin (BC3, BC9). Formats are inherited
 * from the plan, never chosen (LD-1). "Waiting for a licence" appears only where the licence
 * oracle answers from seeded data — nothing is counted (T-06, D7). Publishing, releasing or
 * activating a plan never creates a grant (invariants 1, 8).
 */
import {
  giveAccessInput,
  giveAccessOptionsInput,
  type GrantRow,
  listGrantsInput,
  previewGiveAccessInput,
  type StudentAccessService,
  type StudentHome,
  withdrawGrantInput,
} from '@xr/contracts/draft';
import {
  type ActionId,
  currentMembers,
  type GiveAccessTarget,
  giveAccess,
  grantDisplayStatus,
  type LicenceAvailabilityOracle,
  type PersonId,
  publishedFormats,
  type StudentAccessGrant,
  type StudentPerson,
  withdrawGrant,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import {
  coursesInAccess,
  currentPlanOf,
  grantsOf,
  groupsOf,
  studentsOf,
  waitsOf,
} from '../world/queries.js';
import { formatKey, resourceKey, values, waitKey } from '../world/records.js';
import type { SeededFacts } from '../world/types.js';
import {
  assessmentOf,
  courseRows,
  experimentRow,
  factsFor,
  formatRows,
  givenExperiments,
  routedGrantIds,
  standingOf,
  studentAssessmentView,
  studentOf,
} from './learner.js';
import { ownInstitution } from './people.js';
import { grantSubject } from './subjects.js';
import { courseCardOf, publicPageOf } from './views.js';

/** T-06 / D7: answers only from the seeded sample data — never counts licences (Appendix C §3.18). */
export function seededLicenceOracle(seeded: SeededFacts): LicenceAvailabilityOracle {
  return {
    waitFor: ({ planId, studentId, experimentId }) =>
      seeded.licenceWaits.some(
        (wait) =>
          wait.planId === planId &&
          wait.studentId === studentId &&
          wait.experimentId === experimentId,
      )
        ? { waiting: true }
        : null,
  };
}

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

/** A group's current members (an unknown group has none). */
function membersOf(op: Op, groupId: string): readonly PersonId[] {
  const group = op.records.groups[groupId];
  return group ? currentMembers(group) : [];
}

/** Which Give-access rule applies: the group one for a group, the students one otherwise. */
function giveAction(input: unknown): ActionId {
  return field(field(input, 'target'), 'kind') === 'group'
    ? 'access.give-to-group'
    : 'access.give-to-students';
}

/**
 * Steps 2–5 of Give access, shared by the preview and the command (Appendix C rule 3): the
 * admin's own institution and current plan, the policy, the input, the revision (command only)
 * and the decision. Nothing is staged here.
 */
function prepareGive(
  op: Op,
  input: unknown,
  schema: typeof previewGiveAccessInput | typeof giveAccessInput,
) {
  const person = op.person();
  const institution = ownInstitution(op, person);
  const rawIds = field(input, 'experimentIds');
  const plan = currentPlanOf(
    op.records,
    institution.id,
    op.now,
    Array.isArray(rawIds) ? rawIds.filter((id): id is string => typeof id === 'string') : [],
  );
  if (plan) op.allow(person, giveAction(input), { kind: 'plan', plan, institution });
  const accepted = op.parse(schema, input);
  let target: GiveAccessTarget;
  if (accepted.target.kind === 'group') {
    const group = op.found(op.records.groups[accepted.target.groupId]);
    if (group.institutionId !== institution.id) refuse({ kind: 'not-found' });
    const members = currentMembers(group).flatMap((id) => {
      const member = op.records.people[id];
      return member?.kind === 'student' ? [member] : [];
    });
    target = { kind: 'group', group, members };
  } else {
    const ids =
      accepted.target.kind === 'student' ? [accepted.target.studentId] : accepted.target.studentIds;
    const students: StudentPerson[] = ids.map((id) => {
      const student = op.found(op.records.people[id]);
      if (student.kind !== 'student') refuse({ kind: 'not-found' });
      return student;
    });
    target = { kind: 'students', students };
  }
  if (plan && 'expectedPlanRev' in accepted) op.rev(plan, accepted.expectedPlanRev);
  const outcome = op.decide(
    giveAccess({
      institution,
      plan,
      experimentIds: accepted.experimentIds,
      target,
      grants: grantsOf(op.records, institution.id),
      licences: seededLicenceOracle(op.seeded),
      actor: person.ref,
      now: op.now,
      ids: op.ids,
    }),
    input,
  );
  return { person, outcome };
}

function whoOf(op: Op, grant: StudentAccessGrant): string {
  if (grant.target.kind === 'group')
    return op.records.groups[grant.target.groupId]?.name ?? grant.id;
  return op.records.people[grant.target.studentId]?.fullName ?? grant.id;
}

type UpNext = StudentHome['upNext'][number];

export function studentAccessPort(call: Call): StudentAccessService {
  return {
    // ── Institute Admin ──────────────────────────────────────────────────────────────────────
    listGrants: (filter) =>
      read(call, 'StudentAccessService.listGrants', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'student-access-list', institutionId: institution.id });
        const accepted = op.parse(listGrantsInput, filter);
        const grants = grantsOf(op.records, institution.id);
        const waits = waitsOf(op.records, institution.id);
        const search = accepted.search?.trim().toLowerCase() ?? '';
        const rows: GrantRow[] = [];
        for (const grant of grants) {
          if (!accepted.showWithdrawn && grant.state === 'withdrawn') continue;
          if (accepted.experimentId && grant.experimentId !== accepted.experimentId) continue;
          const plan = op.records.plans[grant.accessPlanId];
          const experiment = op.records.experiments[grant.experimentId];
          if (!plan || !experiment) continue;
          const formats =
            plan.items.find((item) => item.experimentId === grant.experimentId)?.formats ?? [];
          const reached =
            grant.target.kind === 'student'
              ? [grant.target.studentId]
              : membersOf(op, grant.target.groupId);
          for (const studentId of reached) {
            const student = op.records.people[studentId];
            if (student?.kind !== 'student') continue;
            const text = `${student.fullName} ${student.institutionStudentId}`.toLowerCase();
            if (search !== '' && !text.includes(search)) continue;
            const groupGrant =
              grant.target.kind === 'student'
                ? grants.find(
                    (other) =>
                      other.target.kind === 'group' &&
                      other.state === 'active' &&
                      other.experimentId === grant.experimentId &&
                      membersOf(op, other.target.groupId).includes(student.id),
                  )
                : undefined;
            rows.push({
              grant,
              student,
              experimentName: experiment.live.catalogue.name,
              courseCode: op.records.courses[experiment.courseId]?.platformCode ?? null,
              formats,
              display: grantDisplayStatus({
                grant,
                student,
                plan,
                institution,
                waits,
                alsoInActiveGroupGrant: groupGrant !== undefined,
                screen: 'student-access',
                now: op.now,
              }),
              alsoInGroupGrant: groupGrant?.id ?? null,
              wait:
                waits.find((wait) => wait.grantId === grant.id && wait.studentId === student.id) ??
                null,
            });
          }
        }
        return rows;
      }),

    getGiveAccessOptions: (input) =>
      read(call, 'StudentAccessService.getGiveAccessOptions', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        const plan = currentPlanOf(op.records, institution.id, op.now);
        if (!plan) refuse({ kind: 'refused', code: 'nothing-held' });
        op.allow(person, 'access.give-to-students', { kind: 'plan', plan, institution });
        const accepted = op.parse(giveAccessOptionsInput, input);
        const course = accepted.courseId ? op.found(op.records.courses[accepted.courseId]) : null;
        if (accepted.preselectStudentId) {
          const student = op.found(op.records.people[accepted.preselectStudentId]);
          if (student.institutionId !== institution.id) refuse({ kind: 'not-found' });
        }
        if (accepted.preselectGroupId) {
          const group = op.found(op.records.groups[accepted.preselectGroupId]);
          if (group.institutionId !== institution.id) refuse({ kind: 'not-found' });
        }
        const inAccess = coursesInAccess(op.records, institution.id);
        const experiments = values(op.records.experiments)
          .filter((experiment) =>
            course ? experiment.courseId === course.id : inAccess.includes(experiment.courseId),
          )
          .map((experiment) => {
            const item = plan.items.find((candidate) => candidate.experimentId === experiment.id);
            return {
              experimentId: experiment.id,
              name: experiment.live.catalogue.name,
              inPlan: item !== undefined,
              formats: [...(item?.formats ?? publishedFormats(experiment))],
            };
          });
        const inPlan = experiments.filter((entry) => entry.inPlan).map((e) => e.experimentId);
        const grants = grantsOf(op.records, institution.id);
        const hasIt = (student: StudentPerson, experimentId: string) =>
          grants.some(
            (grant) =>
              grant.state === 'active' &&
              grant.experimentId === experimentId &&
              grant.target.kind === 'student' &&
              grant.target.studentId === student.id,
          );
        return {
          plan,
          courses: inAccess.flatMap((id) => {
            const entry = op.records.courses[id];
            return entry ? [courseCardOf(op.records, entry)] : [];
          }),
          experiments,
          students: studentsOf(op.records, institution.id).map((student) => {
            const why =
              student.accountStatus === 'inactive'
                ? ('inactive' as const)
                : inPlan.length > 0 && inPlan.every((id) => hasIt(student, id))
                  ? ('already-has-it' as const)
                  : null;
            return { id: student.id, name: student.fullName, selectable: why === null, why };
          }),
          groups: groupsOf(op.records, institution.id).map((group) => {
            const memberCount = currentMembers(group).length;
            return { id: group.id, name: group.name, memberCount, selectable: memberCount > 0 };
          }),
        };
      }),

    previewGiveAccess: (input) =>
      read(call, 'StudentAccessService.previewGiveAccess', (op) => {
        const { outcome } = prepareGive(op, input, previewGiveAccessInput);
        // A preview writes nothing (Appendix C rule 3): the decision's records are not staged.
        return outcome.grants.map((grant) => ({
          who: whoOf(op, grant),
          experimentId: grant.experimentId,
          formats: [
            ...(outcome.plan.items.find((item) => item.experimentId === grant.experimentId)
              ?.formats ?? []),
          ],
        }));
      }),

    giveAccess: (input) =>
      command(call, 'StudentAccessService.giveAccess', (op) => {
        const { person, outcome } = prepareGive(op, input, giveAccessInput);
        for (const grant of outcome.grants) op.tx.put('grants', grant.id, grant);
        for (const wait of outcome.waits)
          op.tx.put('waits', waitKey(wait.grantId, wait.studentId), wait);
        op.tx.put('plans', outcome.plan.id, outcome.plan);
        for (const student of outcome.students) op.tx.put('people', student.id, student);
        return {
          value: outcome.grants.map((grant) => {
            const wait =
              grant.target.kind === 'student'
                ? (outcome.waits.find((candidate) => candidate.grantId === grant.id) ?? null)
                : null;
            return {
              who: whoOf(op, grant),
              experimentId: grant.experimentId,
              grantId: grant.id,
              display: wait ? ('waiting-for-a-licence' as const) : ('active' as const),
              wait,
            };
          }),
          decision: 'giveAccess',
          actor: person.ref,
        };
      }),

    withdrawGrant: (input) =>
      command(call, 'StudentAccessService.withdrawGrant', (op) => {
        const person = op.person();
        const grant = op.found(op.records.grants[op.idText(field(input, 'grantId'))]);
        const subject = op.found(grantSubject(op.records, grant));
        op.allow(person, 'access.withdraw-individual', subject);
        const accepted = op.parse(withdrawGrantInput, input);
        op.rev(grant, accepted.expectedRev);
        const outcome = op.decide(
          withdrawGrant({
            grant,
            institution: subject.institution,
            plan: subject.plan,
            student: subject.student,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('grants', outcome.grant.id, outcome.grant);
        op.tx.put('people', outcome.student.id, outcome.student);
        op.tx.put('plans', outcome.plan.id, outcome.plan);
        return { value: outcome.grant, decision: 'withdrawGrant', actor: person.ref };
      }),

    // ── Student ──────────────────────────────────────────────────────────────────────────────
    getMyHome: () =>
      read(call, 'StudentAccessService.getMyHome', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const upNext: UpNext[] = [];
        let latest: { readonly at: string; readonly experimentId: string } | null = null;
        for (const experiment of givenExperiments(op, student)) {
          const standing = standingOf(op, person, student, experiment);
          // Up next and Continue name only what the Student can open now (ST-01).
          if (standing.kind !== 'visible' || !standing.gate.canOpen) continue;
          for (const row of formatRows(op, standing, experiment)) {
            if (row.availability !== 'available-to-you') continue;
            const activity =
              op.records.activities[formatKey(student.id, experiment.id, row.format)];
            const at =
              activity?.lastSavedAt ?? activity?.lastSessionReportedAt ?? activity?.firstOpenedAt;
            if (at && (!latest || at > latest.at)) latest = { at, experimentId: experiment.id };
            if (row.progress !== 'completed')
              upNext.push({ kind: 'format', experimentId: experiment.id, format: row.format });
          }
          const assessment = assessmentOf(op, student.institutionId, experiment.id);
          if (assessment) {
            const { view, result } = studentAssessmentView(op, student, assessment);
            if (view.visible && result.kind === 'to-do')
              upNext.push({ kind: 'assessment', assessmentId: assessment.id });
          }
          for (const format of publishedFormats(experiment)) {
            const completed = op.records.completions[formatKey(student.id, experiment.id, format)];
            const sent = values(op.records.feedback).some(
              (entry) =>
                entry.studentId === student.id &&
                entry.experimentId === experiment.id &&
                entry.format === format,
            );
            if (completed && !sent)
              upNext.push({ kind: 'feedback', experimentId: experiment.id, format });
          }
        }
        const resume = latest ? op.records.experiments[latest.experimentId] : undefined;
        const myCourses = courseRows(op, person, student);
        return {
          continue: resume ? experimentRow(op, person, student, resume) : null,
          upNext,
          myCourses,
          noAccessYet: myCourses.length === 0,
        };
      }),

    listMyCourses: () =>
      read(call, 'StudentAccessService.listMyCourses', (op) => {
        const person = op.person();
        return courseRows(op, person, studentOf(person));
      }),

    getMyCourse: (courseId) =>
      read(call, 'StudentAccessService.getMyCourse', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const id = op.idText(courseId);
        const course = op.found(courseRows(op, person, student).find((row) => row.courseId === id));
        return {
          course,
          experiments: givenExperiments(op, student)
            .filter((experiment) => experiment.courseId === id)
            .flatMap((experiment) => {
              const row = experimentRow(op, person, student, experiment);
              return row ? [row] : [];
            }),
        };
      }),

    getExperimentHub: (experimentId) =>
      read(call, 'StudentAccessService.getExperimentHub', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const experiment = op.records.experiments[op.idText(experimentId)] ?? null;
        const facts = experiment ? factsFor(op, student, experiment.id) : null;
        // An unknown or unpublished experiment reads as not given (existence is not revealed).
        if (!experiment || !facts) refuse({ kind: 'refused', code: 'not-given' });
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        const opened = experiment.resources.filter(
          (resource) =>
            op.records.resourcesOpened[resourceKey(student.id, resource.id)] !== undefined,
        ).length;
        const assessment = assessmentOf(op, student.institutionId, experiment.id);
        const view = assessment ? studentAssessmentView(op, student, assessment) : null;
        return {
          experiment: publicPageOf(op.records, experiment),
          row: op.found(experimentRow(op, person, student, experiment)),
          grantIds: [...routedGrantIds(op, facts, experiment)],
          resourceSummary: { total: experiment.resources.length, opened },
          assessment:
            assessment && view?.view.visible
              ? { id: assessment.id, result: view.result }
              : { kind: 'none-set' as const },
        };
      }),
  };
}
