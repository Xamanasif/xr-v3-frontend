/**
 * §3.6 People, groups, Faculty courses and institution course codes (IA-06 … IA-16; M08, M12–M14).
 *
 * Every Institute Admin write acts on the admin's own institution — never one named by the caller
 * — and is refused while it is paused ("Pages are read-only until BITS lifts the pause.", B2-01).
 * Adding a person creates a record only; nothing is sent (T-11). A Faculty course mapping gives
 * students nothing (B2-09).
 */
import {
  addFacultyInput,
  addMembersInput,
  addStudentInput,
  assignFacultyCourseInput,
  commitStudentImportInput,
  createGroupInput,
  deactivateStudentInput,
  type GrantRow,
  listStudentsInput,
  type FacultyCourseService,
  type GroupService,
  type InstitutionCourseCodeService,
  type PeopleService,
  previewRemovalInput,
  previewStudentImportInput,
  reactivateStudentInput,
  SAMPLE_IDENTITY_KEYS,
  STUDENT_IMPORT_FILE_KEYS,
  STUDENT_IMPORT_SAFEGUARD_ROW_KEYS,
  fieldError,
  fieldErrorsFromDomain,
  type GroupRecordView,
  validationFailed,
  removeFacultyCourseInput,
  removeMemberInput,
  renameGroupInput,
  setInstitutionCourseCodeInput,
} from '@xr/contracts/draft';
import {
  addFaculty,
  addMembers,
  addStudent,
  assignFacultyCourse,
  checkStudentImport,
  commitStudentImport,
  createGroup,
  type CourseId,
  deactivateStudent,
  grantDisplayStatus,
  type Group,
  groupMemberStanding,
  type ImportProblem,
  type InputIssue,
  type Institution,
  institutionCodeStatus,
  navCounts,
  planTermState,
  reactivateStudent,
  removeFacultyCourse,
  removeMember,
  renameGroup,
  setInstitutionCourseCode,
  type StudentAccessGrant,
  type StudentPerson,
  unmarkedAfterRemoval,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import type { ResolvedPerson } from '../pipeline/actor.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import {
  coursesInAccess,
  grantsOf,
  groupsOf,
  heldExperiments,
  mappingsOf,
  peopleOf,
  waitsOf,
} from '../world/queries.js';
import { courseCodeKey, values } from '../world/records.js';
import { decideWithIdentity } from './identity-safeguard.js';
import {
  facultyDirectory,
  groupDirectory,
  peopleCoursesOf,
  studentDirectory,
} from './institute-reads.js';
import {
  courseResolver,
  identityProblems,
  importReport,
  parseStudentFile,
  problemParams,
} from './student-import.js';
import { courseCardOf } from './views.js';
import {
  facultyCourseSubject,
  groupSubject,
  institutionSubject,
  personSubject,
} from './subjects.js';

/** The Institute Admin's own institution — the only one their writes can touch. */
export function ownInstitution(op: Op, person: ResolvedPerson): Institution {
  return op.found(person.institutionId ? op.records.institutions[person.institutionId] : null);
}

type Params = Readonly<Record<string, string>>;
type ImportProblemField = ImportProblem['field'];

function idIn(input: unknown, field: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[field]
    : undefined;
}

function studentIn(op: Op, id: string): StudentPerson {
  const person = op.found(op.records.people[id]);
  if (person.kind !== 'student') refuse({ kind: 'not-found' });
  return person;
}

/**
 * IA-07 "Experiments given" (B2-06 f9 … f11, f17; PC-40): each grant that reaches the student — as
 * `StudentAccessService.listGrants` reads it for this student: the experiment and its course code,
 * the formats inherited from the plan item (LD-1), the Institute Admin's grant word, the active
 * group grant an individual grant is "Also in", and a supplied licence wait (never counted, D7).
 */
function studentGrantRows(
  op: Op,
  student: StudentPerson,
  grants: readonly StudentAccessGrant[],
): GrantRow[] {
  const institution = op.found(op.records.institutions[student.institutionId]);
  const waits = waitsOf(op.records, institution.id);
  const rows: GrantRow[] = [];
  for (const grant of grants) {
    const plan = op.records.plans[grant.accessPlanId];
    const experiment = op.records.experiments[grant.experimentId];
    if (!plan || !experiment) continue;
    const groupGrant =
      grant.target.kind === 'student'
        ? grants.find(
            (other) =>
              other.target.kind === 'group' &&
              other.state === 'active' &&
              other.experimentId === grant.experimentId,
          )
        : undefined;
    rows.push({
      grant,
      student,
      experimentName: experiment.live.catalogue.name,
      courseCode: op.records.courses[experiment.courseId]?.platformCode ?? null,
      formats: [
        ...(plan.items.find((item) => item.experimentId === grant.experimentId)?.formats ?? []),
      ],
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
        waits.find((wait) => wait.grantId === grant.id && wait.studentId === student.id) ?? null,
    });
  }
  return rows;
}

/** The People form's fields in its order (B2-07), for the identity safeguard's error summary. */
const PERSON_FORM_ORDER = ['fullName', 'institutionEmail', 'institutionStudentId'] as const;

/** Each staged import file's reference, per platform (adapter state, never a world record). */
const importCounters = new WeakMap<object, number>();

function nextBatchId(call: Call, fileName: string): string {
  const next = (importCounters.get(call.core) ?? call.core.imports.size) + 1;
  importCounters.set(call.core, next);
  const safe = fileName.replace(/[^\w.-]+/g, '-').slice(0, 60);
  return `imp-${String(next).padStart(4, '0')}-${safe}`;
}

/**
 * IA-14 (B2-08; PC-46): the group's grants as the page names them, and each current member's
 * standing per active grant on a live plan — none while the institution is paused, so no "Can open
 * it" is shown where access is not live. An individual grant beside an active group grant whose
 * own grant was withdrawn is the open decision itself (OD-B2-01, the domain's standing).
 */
function groupView(op: Op, group: Group, institution: Institution): GroupRecordView {
  const grants = grantsOf(op.records, institution.id);
  const waits = waitsOf(op.records, institution.id);
  const own = grants
    .filter((grant) => grant.target.kind === 'group' && grant.target.groupId === group.id)
    .sort((a, b) => (a.givenAt < b.givenAt ? -1 : a.givenAt > b.givenAt ? 1 : 0));
  const grantRows: GroupRecordView['grantRows'][number][] = [];
  for (const grant of own) {
    const plan = op.records.plans[grant.accessPlanId];
    const experiment = op.records.experiments[grant.experimentId];
    if (!plan || !experiment) continue;
    grantRows.push({
      grant,
      experimentName: experiment.live.catalogue.name,
      courseCode: op.records.courses[experiment.courseId]?.platformCode ?? null,
      formats: [
        ...(plan.items.find((item) => item.experimentId === grant.experimentId)?.formats ?? []),
      ],
      status:
        grant.state === 'withdrawn'
          ? 'withdrawn'
          : planTermState(plan, op.now) === 'ended'
            ? 'access-ended'
            : 'active',
    });
  }
  const live = institution.pause ? [] : grantRows.filter((row) => row.status === 'active');
  const members: GroupRecordView['members'][number][] = [];
  for (const membership of group.memberships) {
    if (membership.removedAt !== null) continue;
    const student = op.records.people[membership.studentId];
    if (student?.kind !== 'student') continue;
    members.push({
      student,
      standing: live.map(({ grant }) => {
        // The member's own grant for the experiment on a live plan (an ended plan's grant gives
        // nothing now — IA-04 reads it `access-ended`); withdrawn ones stay (the OD-B2-01 case).
        const individual = grants
          .filter((other) => {
            const plan = op.records.plans[other.accessPlanId];
            return (
              other.target.kind === 'student' &&
              other.target.studentId === student.id &&
              other.experimentId === grant.experimentId &&
              plan !== undefined &&
              planTermState(plan, op.now) !== 'ended'
            );
          })
          .sort((a, b) =>
            a.state === b.state ? (a.givenAt < b.givenAt ? 1 : -1) : a.state === 'active' ? -1 : 1,
          )[0];
        return groupMemberStanding({
          membership,
          student,
          groupGrant: grant,
          individualGrant: individual ?? null,
          waits,
        });
      }),
    });
  }
  return { group, members, grants: own, grantRows };
}

/** Written answers waiting for marking in this institution's assessments of a course (B2-09 f2). */
function writtenAnswersWaiting(op: Op, institutionId: string, courseId: CourseId): number {
  const experiments = heldExperiments(op.records, institutionId)
    .filter((held) => held.courseId === courseId)
    .map((held) => held.experimentId);
  return navCounts.facultyMarking(
    values(op.records.attempts),
    values(op.records.assessments).filter(
      (assessment) => assessment.institutionId === institutionId,
    ),
    values(op.records.questions),
    experiments,
  );
}

export function peoplePort(call: Call): PeopleService {
  return {
    // Phase-2 Package 2A (IA-06): the admin's own students, filtered by the service (PC-39).
    listStudents: (filter) =>
      read(call, 'PeopleService.listStudents', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'people', institutionId: institution.id });
        const accepted = op.parse(listStudentsInput, filter);
        return studentDirectory(op, institution, accepted);
      }),
    // Phase-2 Package 2B (IA-11; PC-47): the service reads the chosen CSV file and checks every
    // row; the rows wait in the adapter for the commit. Nothing is written.
    previewStudentImport: (input) =>
      read(call, 'PeopleService.previewStudentImport', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'person.import-students', institutionSubject(op.records, institution));
        const accepted = op.parse(previewStudentImportInput, input);
        const parsed = parseStudentFile(accepted.csvText);
        if (parsed.kind !== 'rows') {
          refuse(
            validationFailed([fieldError('file', STUDENT_IMPORT_FILE_KEYS[parsed.kind])], null),
          );
        }
        const rows = parsed.rows;
        const domain = checkStudentImport({
          rows,
          people: peopleOf(op.records, institution.id),
          resolveCourse: courseResolver(op, institution),
        }).problems;
        const batchId = nextBatchId(call, accepted.fileName);
        call.core.imports.set(batchId, {
          batchId,
          institutionId: institution.id,
          fileName: accepted.fileName,
          rows,
        });
        return importReport(op, institution, { batchId, fileName: accepted.fileName }, rows, [
          ...domain,
          ...identityProblems(op, rows, domain),
        ]);
      }),
    // Phase-2 Package 2A (IA-08): the admin's own faculty and the courses they teach.
    listFaculty: () =>
      read(call, 'PeopleService.listFaculty', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'people', institutionId: institution.id });
        return facultyDirectory(op, institution);
      }),
    // Phase-2 Package 2B (IA-09; PC-46): the faculty member, every mapping of theirs (current and
    // removed — the screen lists the current ones) and the courses those mappings name.
    getFaculty: (id) =>
      read(call, 'PeopleService.getFaculty', (op) => {
        const person = op.person();
        const faculty = op.found(op.records.people[op.idText(id)]);
        if (faculty.kind !== 'faculty') refuse({ kind: 'not-found' });
        op.see(person, { kind: 'people', institutionId: faculty.institutionId });
        const mappings = mappingsOf(op.records, faculty.institutionId).filter(
          (mapping) => mapping.facultyId === faculty.id,
        );
        return {
          faculty,
          mappings,
          courses: peopleCoursesOf(
            op,
            mappings.map((mapping) => mapping.courseId),
          ),
        };
      }),

    getStudent: (id) =>
      read(call, 'PeopleService.getStudent', (op) => {
        const person = op.person();
        const student = studentIn(op, op.idText(id));
        op.see(person, { kind: 'people', institutionId: student.institutionId });
        const groups = groupsOf(op.records, student.institutionId).filter((group) =>
          group.memberships.some(
            (membership) => membership.studentId === student.id && membership.removedAt === null,
          ),
        );
        const groupIds = new Set(groups.map((group) => group.id as string));
        const grants = grantsOf(op.records, student.institutionId).filter((grant) =>
          grant.target.kind === 'student'
            ? grant.target.studentId === student.id
            : groupIds.has(grant.target.groupId),
        );
        return {
          student,
          groups,
          grants,
          // Phase-2 Package 2A (IA-07, PC-40): the named courses and each grant as IA-04 reads it.
          courses: peopleCoursesOf(
            op,
            student.courseFilings.map((filing) => filing.courseId),
          ),
          grantRows: studentGrantRows(op, student, grants),
        };
      }),

    addStudent: (input) =>
      command(call, 'PeopleService.addStudent', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'person.add-student', institutionSubject(op.records, institution));
        const accepted = op.parse(addStudentInput, input);
        const group = accepted.groupId ? op.found(op.records.groups[accepted.groupId]) : null;
        if (group && group.institutionId !== institution.id) refuse({ kind: 'not-found' });
        const people = peopleOf(op.records, institution.id);
        // Package 2B (PC-49): an e-mail another sample identity signs in with is refused.
        const student = decideWithIdentity(
          op,
          addStudent({
            institution,
            people,
            form: {
              fullName: accepted.fullName,
              email: accepted.institutionEmail,
              studentId: accepted.institutionStudentId,
              programme: accepted.programme,
            },
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          {
            email: accepted.institutionEmail,
            field: 'institutionEmail',
            key: SAMPLE_IDENTITY_KEYS.addPerson,
            order: PERSON_FORM_ORDER,
            paramsFor: (_issue, target): Params => {
              if (target.key !== 'IA-10.institutionStudentId.taken') return {};
              const holder = people.find(
                (other) =>
                  other.kind === 'student' &&
                  other.institutionStudentId.toUpperCase() ===
                    accepted.institutionStudentId.toUpperCase(),
              );
              return { id: accepted.institutionStudentId, name: holder?.fullName ?? '' };
            },
          },
        );
        op.tx.put('people', student.id, student);
        if (group) {
          const joined = op.decide(
            addMembers({
              institution,
              group,
              students: [student],
              actor: person.ref,
              now: op.now,
              ids: op.ids,
            }),
            input,
          );
          op.tx.put('groups', joined.id, joined);
        }
        return { value: student, decision: 'addStudent', actor: person.ref };
      }),

    addFaculty: (input) =>
      command(call, 'PeopleService.addFaculty', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'person.add-faculty', institutionSubject(op.records, institution));
        const accepted = op.parse(addFacultyInput, input);
        // Package 2B (PC-49): an e-mail another sample identity signs in with is refused.
        const faculty = decideWithIdentity(
          op,
          addFaculty({
            institution,
            people: peopleOf(op.records, institution.id),
            fullName: accepted.fullName,
            email: accepted.institutionEmail,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          {
            email: accepted.institutionEmail,
            field: 'institutionEmail',
            key: SAMPLE_IDENTITY_KEYS.addPerson,
            order: PERSON_FORM_ORDER,
          },
        );
        op.tx.put('people', faculty.id, faculty);
        return { value: faculty, decision: 'addFaculty', actor: person.ref };
      }),

    commitStudentImport: (input) =>
      command(call, 'PeopleService.commitStudentImport', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'person.import-students', institutionSubject(op.records, institution));
        const accepted = op.parse(commitStudentImportInput, input);
        const batch = op.found(call.core.imports.get(accepted.batchId));
        if (batch.institutionId !== institution.id) refuse({ kind: 'not-found' });
        const resolveCourse = courseResolver(op, institution);
        const people = peopleOf(op.records, institution.id);
        const paramsFor = (issue: InputIssue): Params => {
          const match = /^row (\d+) (\w+)$/.exec(issue.field);
          if (!match) return {};
          return problemParams(op, institution, batch.rows, {
            row: Number(match[1]),
            field: match[2] as ImportProblemField,
            rule: issue.rule,
          });
        };
        // Package 2B (PC-49): the identity safeguard is checked again on the records as they are
        // now; its rows join the domain's in one refusal.
        const domain = checkStudentImport({ rows: batch.rows, people, resolveCourse }).problems;
        const safeguard = identityProblems(op, batch.rows, domain);
        if (safeguard.length > 0) {
          refuse(
            validationFailed(
              [
                ...fieldErrorsFromDomain(
                  'PeopleService.commitStudentImport',
                  domain.map((problem) => ({
                    field: `row ${problem.row} ${problem.field}`,
                    rule: problem.rule,
                  })),
                  input,
                  paramsFor,
                ),
                ...safeguard.map((problem) =>
                  fieldError(
                    `rows.${problem.row}.${problem.field}`,
                    STUDENT_IMPORT_SAFEGUARD_ROW_KEYS[
                      `email:${problem.rule}` as keyof typeof STUDENT_IMPORT_SAFEGUARD_ROW_KEYS
                    ],
                    problemParams(op, institution, batch.rows, problem),
                  ),
                ),
              ],
              null,
            ),
          );
        }
        const students = op.decide(
          commitStudentImport({
            institution,
            people,
            rows: batch.rows,
            resolveCourse,
            fileName: batch.fileName,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          paramsFor,
        );
        for (const student of students) op.tx.put('people', student.id, student);
        return {
          value: {
            added: students.length,
            students: students.map((student) => ({ id: student.id, fullName: student.fullName })),
          },
          decision: 'commitStudentImport',
          actor: person.ref,
          after: () => {
            call.core.imports.delete(batch.batchId);
          },
        };
      }),

    deactivateStudent: (input) =>
      command(call, 'PeopleService.deactivateStudent', (op) => {
        const person = op.person();
        const target = op.found(op.records.people[op.idText(idIn(input, 'id'))]);
        op.allow(person, 'person.deactivate-student', op.found(personSubject(op.records, target)));
        const accepted = op.parse(deactivateStudentInput, input);
        if (target.kind !== 'student') refuse({ kind: 'policy-open', decision: 'PER-07' });
        op.rev(target, accepted.expectedRev);
        const next = op.decide(
          deactivateStudent({
            institution: op.found(op.records.institutions[target.institutionId]),
            student: target,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('people', next.id, next);
        return { value: next, decision: 'deactivateStudent', actor: person.ref };
      }),

    reactivateStudent: (input) =>
      command(call, 'PeopleService.reactivateStudent', (op) => {
        const person = op.person();
        const target = op.found(op.records.people[op.idText(idIn(input, 'id'))]);
        op.allow(person, 'person.reactivate-student', op.found(personSubject(op.records, target)));
        const accepted = op.parse(reactivateStudentInput, input);
        if (target.kind !== 'student') refuse({ kind: 'policy-open', decision: 'PER-07' });
        op.rev(target, accepted.expectedRev);
        const next = op.decide(
          reactivateStudent({
            institution: op.found(op.records.institutions[target.institutionId]),
            student: target,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('people', next.id, next);
        return { value: next, decision: 'reactivateStudent', actor: person.ref };
      }),
  };
}

export function groupPort(call: Call): GroupService {
  return {
    // Phase-2 Package 2A (IA-06's Group filter): the admin's own groups.
    listGroups: () =>
      read(call, 'GroupService.listGroups', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'groups', institutionId: institution.id });
        return groupDirectory(op, institution);
      }),
    // Phase-2 Package 2B (IA-14; PC-46): the group, its current members with their standing per
    // live group grant, and its grants as the page names them.
    getGroup: (id) =>
      read(call, 'GroupService.getGroup', (op) => {
        const person = op.person();
        const group = op.found(op.records.groups[op.idText(id)]);
        op.see(person, { kind: 'groups', institutionId: group.institutionId });
        return groupView(op, group, op.found(op.records.institutions[group.institutionId]));
      }),

    createGroup: (input) =>
      command(call, 'GroupService.createGroup', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'group.create', institutionSubject(op.records, institution));
        const accepted = op.parse(createGroupInput, input);
        const groups = groupsOf(op.records, institution.id);
        const group = op.decide(
          createGroup({
            institution,
            groups,
            name: accepted.name,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          () => {
            const taken = groups.find(
              (existing) => existing.name.trim().toLowerCase() === accepted.name.toLowerCase(),
            );
            return { name: taken?.name ?? accepted.name };
          },
        );
        op.tx.put('groups', group.id, group);
        return { value: group, decision: 'createGroup', actor: person.ref };
      }),

    renameGroup: (input) =>
      command(call, 'GroupService.renameGroup', (op) => {
        const person = op.person();
        const group = op.found(op.records.groups[op.idText(idIn(input, 'id'))]);
        const subject = op.found(groupSubject(op.records, group));
        op.allow(person, 'group.rename', subject);
        const accepted = op.parse(renameGroupInput, input);
        op.rev(group, accepted.expectedRev);
        const next = op.decide(
          renameGroup({
            institution: subject.institution,
            group,
            name: accepted.name,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('groups', next.id, next);
        return { value: next, decision: 'renameGroup', actor: person.ref };
      }),

    addMembers: (input) =>
      command(call, 'GroupService.addMembers', (op) => {
        const person = op.person();
        const group = op.found(op.records.groups[op.idText(idIn(input, 'id'))]);
        const subject = op.found(groupSubject(op.records, group));
        op.allow(person, 'group.add-members', subject);
        const accepted = op.parse(addMembersInput, input);
        const students = accepted.studentIds.map((id) => studentIn(op, id));
        op.rev(group, accepted.expectedRev);
        const next = op.decide(
          addMembers({
            institution: subject.institution,
            group,
            students,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('groups', next.id, next);
        return { value: next, decision: 'addMembers', actor: person.ref };
      }),

    removeMember: (input) =>
      command(call, 'GroupService.removeMember', (op) => {
        const person = op.person();
        const group = op.found(op.records.groups[op.idText(idIn(input, 'id'))]);
        const subject = op.found(groupSubject(op.records, group));
        op.allow(person, 'group.remove-member', subject);
        const accepted = op.parse(removeMemberInput, input);
        studentIn(op, accepted.studentId);
        op.rev(group, accepted.expectedRev);
        const next = op.decide(
          removeMember({
            institution: subject.institution,
            group,
            studentId: accepted.studentId,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('groups', next.id, next);
        return { value: next, decision: 'removeMember', actor: person.ref };
      }),
  };
}

export function facultyCoursePort(call: Call): FacultyCourseService {
  return {
    // Phase-2 Package 2B (IA-15): every Faculty course mapping of the admin's own institution —
    // current and removed (the record and its dates stay); the screen lists the current ones.
    list: () =>
      read(call, 'FacultyCourseService.list', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'people', institutionId: institution.id });
        return mappingsOf(op.records, institution.id);
      }),

    assign: (input) =>
      command(call, 'FacultyCourseService.assign', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.allow(person, 'faculty-course.assign', institutionSubject(op.records, institution));
        const accepted = op.parse(assignFacultyCourseInput, input);
        const faculty = op.found(op.records.people[accepted.facultyId]);
        if (faculty.kind !== 'faculty') refuse({ kind: 'not-found' });
        const course = op.found(op.records.courses[accepted.courseId]);
        const mapping = op.decide(
          assignFacultyCourse({
            institution,
            mappings: mappingsOf(op.records, institution.id),
            faculty,
            courseId: course.id,
            coursesInAccess: coursesInAccess(op.records, institution.id),
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          () => ({ name: faculty.fullName, course: course.platformCode ?? course.name }),
        );
        op.tx.put('mappings', mapping.id, mapping);
        return { value: mapping, decision: 'assignFacultyCourse', actor: person.ref };
      }),

    previewRemoval: (input) =>
      read(call, 'FacultyCourseService.previewRemoval', (op) => {
        const person = op.person();
        const mapping = op.found(op.records.mappings[op.idText(idIn(input, 'mappingId'))]);
        op.allow(
          person,
          'faculty-course.remove',
          op.found(facultyCourseSubject(op.records, mapping)),
        );
        op.parse(previewRemovalInput, input);
        const waiting = writtenAnswersWaiting(op, mapping.institutionId, mapping.courseId);
        const outcome = unmarkedAfterRemoval(
          mapping,
          mappingsOf(op.records, mapping.institutionId),
          waiting,
        );
        const course = op.records.courses[mapping.courseId];
        return {
          warning: outcome.noOtherMarker
            ? {
                writtenAnswersWaiting: outcome.waiting,
                courseCode: course?.platformCode ?? course?.name ?? mapping.courseId,
              }
            : null,
        };
      }),

    remove: (input) =>
      command(call, 'FacultyCourseService.remove', (op) => {
        const person = op.person();
        const mapping = op.found(op.records.mappings[op.idText(idIn(input, 'mappingId'))]);
        const subject = op.found(facultyCourseSubject(op.records, mapping));
        op.allow(person, 'faculty-course.remove', subject);
        const accepted = op.parse(removeFacultyCourseInput, input);
        op.rev(mapping, accepted.expectedRev);
        const next = op.decide(
          removeFacultyCourse({
            institution: subject.institution,
            mapping,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('mappings', next.id, next);
        return { value: next, decision: 'removeFacultyCourse', actor: person.ref };
      }),
  };
}

export function institutionCourseCodePort(call: Call): InstitutionCourseCodeService {
  return {
    // Phase-2 Package 2B (IA-16): each course in the institution's content access, its BITS code
    // (read-only here, M-2) and the institution's own code with its status — "Missing" / "Added".
    list: () =>
      read(call, 'InstitutionCourseCodeService.list', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        op.see(person, { kind: 'access-plan', institutionId: institution.id });
        return coursesInAccess(op.records, institution.id).flatMap((courseId) => {
          const course = op.records.courses[courseId];
          if (!course) return [];
          const code = op.records.courseCodes[courseCodeKey(institution.id, courseId)] ?? null;
          return [
            {
              course: courseCardOf(op.records, course),
              code,
              status: institutionCodeStatus(code),
            },
          ];
        });
      }),

    set: (input) =>
      command(call, 'InstitutionCourseCodeService.set', (op) => {
        const person = op.person();
        const institution = ownInstitution(op, person);
        const course = op.found(op.records.courses[op.idText(idIn(input, 'courseId'))]);
        const key = courseCodeKey(institution.id, course.id);
        const existing = op.records.courseCodes[key] ?? null;
        const inAccess = coursesInAccess(op.records, institution.id);
        op.allow(person, 'institution-course-code.set', {
          kind: 'course-code',
          institution,
          courseId: course.id,
          coursesInAccess: inAccess,
          existing,
        });
        const accepted = op.parse(setInstitutionCourseCodeInput, input);
        if (existing && accepted.expectedRev !== existing.rev) {
          refuse({ kind: 'stale-version', currentRev: existing.rev });
        }
        const next = op.decide(
          setInstitutionCourseCode({
            existing,
            institution,
            courseId: course.id,
            coursesInAccess: inAccess,
            code: accepted.code,
            semester: accepted.semester,
            actor: person.ref,
            now: op.now,
          }),
          input,
        );
        op.tx.put('courseCodes', key, next);
        return { value: next, decision: 'setInstitutionCourseCode', actor: person.ref };
      }),
  };
}
