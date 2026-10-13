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
  type FacultyCourseService,
  type GroupService,
  type InstitutionCourseCodeService,
  type PeopleService,
  previewRemovalInput,
  reactivateStudentInput,
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
  commitStudentImport,
  createGroup,
  type CourseId,
  deactivateStudent,
  type Institution,
  navCounts,
  platformCodeKey,
  reactivateStudent,
  removeFacultyCourse,
  removeMember,
  renameGroup,
  setInstitutionCourseCode,
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
} from '../world/queries.js';
import { courseCodeKey, values } from '../world/records.js';
import { deferred } from './deferred.js';
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
    listStudents: deferred('PeopleService.listStudents'),
    previewStudentImport: deferred('PeopleService.previewStudentImport'),
    listFaculty: deferred('PeopleService.listFaculty'),
    getFaculty: deferred('PeopleService.getFaculty'),

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
        return {
          student,
          groups,
          grants: grantsOf(op.records, student.institutionId).filter((grant) =>
            grant.target.kind === 'student'
              ? grant.target.studentId === student.id
              : groupIds.has(grant.target.groupId),
          ),
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
        const student = op.decide(
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
          (_issue, target): Params => {
            if (target.key !== 'IA-10.institutionStudentId.taken') return {};
            const holder = people.find(
              (other) =>
                other.kind === 'student' &&
                other.institutionStudentId.toUpperCase() ===
                  accepted.institutionStudentId.toUpperCase(),
            );
            return { id: accepted.institutionStudentId, name: holder?.fullName ?? '' };
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
        const faculty = op.decide(
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
        const resolveCourse = (code: string): CourseId | null => {
          const key = platformCodeKey(code);
          const platform = values(op.records.courses).find(
            (course) =>
              course.platformCode !== null && platformCodeKey(course.platformCode) === key,
          );
          if (platform) return platform.id;
          const own = values(op.records.courseCodes).find(
            (entry) =>
              entry.institutionId === institution.id &&
              entry.code !== null &&
              platformCodeKey(entry.code) === key,
          );
          return own?.courseId ?? null;
        };
        const students = op.decide(
          commitStudentImport({
            institution,
            people: peopleOf(op.records, institution.id),
            rows: batch.rows,
            resolveCourse,
            fileName: batch.fileName,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          (issue): Params => {
            const rowNumber = Number(/^row (\d+)/.exec(issue.field)?.[1]);
            const row = batch.rows.find((candidate) => candidate.row === rowNumber);
            if (issue.rule === 'email-format') return { value: row?.email.trim() ?? '' };
            if (issue.rule === 'duplicate-in-file') {
              const id = row?.studentId.trim() ?? '';
              const first = batch.rows.find(
                (candidate) => candidate.studentId.trim().toUpperCase() === id.toUpperCase(),
              );
              return { id, row: String(first?.row ?? rowNumber) };
            }
            return {};
          },
        );
        for (const student of students) op.tx.put('people', student.id, student);
        return {
          value: { added: students.length },
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
    listGroups: deferred('GroupService.listGroups'),
    getGroup: deferred('GroupService.getGroup'),

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
    list: deferred('FacultyCourseService.list'),

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
    list: deferred('InstitutionCourseCodeService.list'),

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
