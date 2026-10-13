/**
 * People, groups and Faculty courses (Appendix C M12–M14; matrix PER-*, GRP-*, FCM-*).
 * Every Institute Admin write is refused while the institution is paused: "Pages are read-only
 * until BITS lifts the pause." (B2-01 paused frame; schemas §8-33; INST-12, INST-13).
 */
import type { PersonActorRef } from '../roles.js';
import {
  type Decision,
  type InputIssue,
  invalidInput,
  invalidState,
  isBlank,
  notPermitted,
  ok,
  refused,
} from '../kernel/decision.js';
import { historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { CourseId, ExperimentId, PersonId } from '../kernel/ids.js';
import { isDrawnTransition } from '../kernel/machine.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Institution } from '../institution/model.js';
import { WORK_EMAIL } from '../institution/decide.js';
import {
  type AccountStatus,
  type FacultyCourseMapping,
  type FacultyPerson,
  type Group,
  PERSON_TRANSITIONS,
  type Person,
  type PersonCommand,
  type PersonEvent,
  type StudentDirectoryStatus,
  type StudentPerson,
} from './model.js';

const ADMIN_READERS = ['tenant_admin', 'super_admin'] as const;

interface IaWrite {
  readonly institution: Institution;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function personEntry(
  input: { readonly ids: IdSource; readonly now: IsoInstant; readonly actor: PersonActorRef },
  event: PersonEvent,
  note: string | null = null,
) {
  return historyEntry({
    id: input.ids.next('history'),
    event,
    at: input.now,
    actor: input.actor,
    note,
    visibleTo: ADMIN_READERS,
  });
}

export interface StudentForm {
  readonly fullName: string;
  readonly email: string;
  readonly studentId: string;
  readonly programme: string | null;
}

/** Full name and institution e-mail (B2-07): "This e-mail already belongs to someone in People". */
function nameAndEmailIssues(
  fullName: string,
  email: string,
  people: readonly Person[],
): InputIssue[] {
  return [
    ...(isBlank(fullName) ? [{ field: 'fullName', rule: 'required' }] : []),
    ...(isBlank(email)
      ? [{ field: 'email', rule: 'required' }]
      : !WORK_EMAIL.test(email.trim())
        ? [{ field: 'email', rule: 'email-format' }]
        : people.some((person) => sameEmail(person.institutionEmail, email))
          ? [{ field: 'email', rule: 'taken' }]
          : []),
  ];
}

/** IA-10 rules (B2-07): full name, institution e-mail (full address, not already in People),
 *  Student ID (not already used — compared upper-case). Programme and group optional. */
export function studentFormIssues(form: StudentForm, people: readonly Person[]): InputIssue[] {
  return [
    ...nameAndEmailIssues(form.fullName, form.email, people),
    ...(isBlank(form.studentId)
      ? [{ field: 'studentId', rule: 'required' }]
      : people.some(
            (person) =>
              person.kind === 'student' &&
              person.institutionStudentId.toUpperCase() === form.studentId.trim().toUpperCase(),
          )
        ? [{ field: 'studentId', rule: 'taken' }]
        : []),
  ];
}

export interface AddStudentInput extends IaWrite {
  /** The institution's People. */
  readonly people: readonly Person[];
  readonly form: StudentForm;
}

/** Add a student (PER-01): Active, no experiments; nothing is sent (T-11). */
export function addStudent(input: AddStudentInput): Decision<StudentPerson> {
  if (input.institution.pause) return refused('institution-paused');
  const issues = studentFormIssues(input.form, input.people);
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...newMeta(input.now),
    kind: 'student',
    id: input.ids.next('person'),
    institutionId: input.institution.id,
    fullName: input.form.fullName.trim(),
    institutionEmail: input.form.email.trim(),
    accountStatus: 'active',
    added: { at: input.now, by: input.actor, how: 'form', importFileName: null },
    institutionStudentId: input.form.studentId.trim(),
    programme: isBlank(input.form.programme) ? null : input.form.programme!.trim(),
    courseFilings: [],
    deactivation: null,
    history: [personEntry(input, 'added')],
  });
}

export interface AddFacultyInput extends IaWrite {
  readonly people: readonly Person[];
  readonly fullName: string;
  readonly email: string;
}

/** Add a faculty member: full name + institution e-mail, same rules, no Student ID (PER-03). */
export function addFaculty(input: AddFacultyInput): Decision<FacultyPerson> {
  if (input.institution.pause) return refused('institution-paused');
  const issues = nameAndEmailIssues(input.fullName, input.email, input.people);
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...newMeta(input.now),
    kind: 'faculty',
    id: input.ids.next('person'),
    institutionId: input.institution.id,
    fullName: input.fullName.trim(),
    institutionEmail: input.email.trim(),
    accountStatus: 'active',
    added: { at: input.now, by: input.actor, how: 'form', importFileName: null },
    history: [personEntry(input, 'added')],
  });
}

/** One parsed row of the six-column student CSV (B2-07; IA-11): every column required. */
export interface StudentImportRow {
  readonly row: number;
  readonly studentId: string;
  readonly fullName: string;
  readonly email: string;
  readonly programme: string;
  readonly course: string;
  readonly courseCode: string;
}

export interface ImportProblem {
  readonly row: number;
  readonly field: keyof Omit<StudentImportRow, 'row'>;
  readonly rule: string;
}

/** "13 rows checked · 9 ready to import · 4 rows with errors"; any error blocks the whole import
 *  (all-or-nothing interim, T-24). */
export interface StudentImportReport {
  readonly rowsChecked: number;
  readonly ready: number;
  readonly problems: readonly ImportProblem[];
  readonly canImport: boolean;
}

export interface StudentImportCheck {
  readonly rows: readonly StudentImportRow[];
  readonly people: readonly Person[];
  /**
   * The course a `course_code` (platform code or the institution's own) files the student
   * against. A code that names no course is reported as an error [PROPOSED — not drawn: filing
   * needs a course; reported to the owner].
   */
  readonly resolveCourse: (courseCode: string) => CourseId | null;
}

/** Checks the drawn rules of the student CSV (B2-07). Writes nothing (preview). */
export function checkStudentImport(input: StudentImportCheck): StudentImportReport {
  const problems: ImportProblem[] = [];
  const seenIds = new Map<string, number>();
  for (const row of input.rows) {
    const add = (field: ImportProblem['field'], rule: string) =>
      problems.push({ row: row.row, field, rule });
    for (const field of [
      'studentId',
      'fullName',
      'email',
      'programme',
      'course',
      'courseCode',
    ] as const) {
      if (isBlank(row[field])) add(field, 'required');
    }
    if (!isBlank(row.email)) {
      if (!WORK_EMAIL.test(row.email.trim())) add('email', 'email-format');
      else if (input.people.some((person) => sameEmail(person.institutionEmail, row.email)))
        add('email', 'in-people');
    }
    if (!isBlank(row.studentId)) {
      const key = row.studentId.trim().toUpperCase();
      if (seenIds.has(key)) add('studentId', 'duplicate-in-file');
      else seenIds.set(key, row.row);
      if (
        input.people.some(
          (person) =>
            person.kind === 'student' && person.institutionStudentId.toUpperCase() === key,
        )
      ) {
        add('studentId', 'in-people');
      }
    }
    if (!isBlank(row.courseCode) && input.resolveCourse(row.courseCode.trim()) === null) {
      add('courseCode', 'unknown-course');
    }
  }
  const rowsWithErrors = new Set(problems.map((problem) => problem.row)).size;
  return {
    rowsChecked: input.rows.length,
    ready: input.rows.length - rowsWithErrors,
    problems,
    canImport: input.rows.length > 0 && problems.length === 0,
  };
}

export interface CommitImportInput extends IaWrite, StudentImportCheck {
  readonly fileName: string;
}

/** Import students from CSV (PER-02; stakeholder conflict on optional columns — the six drawn
 *  columns only). All or nothing: any error blocks the import. */
export function commitStudentImport(input: CommitImportInput): Decision<readonly StudentPerson[]> {
  if (input.institution.pause) return refused('institution-paused');
  const report = checkStudentImport(input);
  if (!report.canImport) {
    return invalidInput(
      ...(report.problems.length > 0
        ? report.problems.map((problem) => ({
            field: `row ${problem.row} ${problem.field}`,
            rule: problem.rule,
          }))
        : [{ field: 'file', rule: 'required' }]),
    );
  }
  return ok(
    input.rows.map((row) => ({
      ...newMeta(input.now),
      kind: 'student' as const,
      id: input.ids.next('person'),
      institutionId: input.institution.id,
      fullName: row.fullName.trim(),
      institutionEmail: row.email.trim(),
      accountStatus: 'active' as const,
      added: {
        at: input.now,
        by: input.actor,
        how: 'import' as const,
        importFileName: input.fileName,
      },
      institutionStudentId: row.studentId.trim(),
      programme: row.programme.trim(),
      courseFilings: [
        {
          courseId: input.resolveCourse(row.courseCode.trim())!,
          codeAsGiven: row.courseCode.trim(),
          filedAt: input.now,
          source: 'import' as const,
        },
      ],
      deactivation: null,
      history: [personEntry(input, 'imported', input.fileName)],
    })),
  );
}

function accountMove(person: StudentPerson, to: AccountStatus, command: PersonCommand): boolean {
  return isDrawnTransition(PERSON_TRANSITIONS, person.accountStatus, to, command);
}

export interface StatusChangeInput extends IaWrite {
  readonly student: StudentPerson;
}

/** Deactivate a student account (PER-05; DL-2): "Enter the reason for deactivating this
 *  account" — shown on the record to the institution's administrators. Work is kept. */
export function deactivateStudent(
  input: StatusChangeInput & { readonly reason: string },
): Decision<StudentPerson> {
  if (input.institution.pause) return refused('institution-paused');
  if (input.student.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  if (!accountMove(input.student, 'inactive', 'deactivateStudent'))
    return invalidState(input.student.accountStatus);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.student,
    ...nextMeta(input.student, input.now),
    accountStatus: 'inactive',
    deactivation: { at: input.now, by: input.actor, reason },
    history: [...input.student.history, personEntry(input, 'deactivated', reason)],
  });
}

/** Reactivate (PER-06; DL-1): "the experiments Rahul has been given open again". */
export function reactivateStudent(input: StatusChangeInput): Decision<StudentPerson> {
  if (input.institution.pause) return refused('institution-paused');
  if (input.student.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  if (!accountMove(input.student, 'active', 'reactivateStudent'))
    return invalidState(input.student.accountStatus);
  return ok({
    ...input.student,
    ...nextMeta(input.student, input.now),
    accountStatus: 'active',
    deactivation: null,
    history: [...input.student.history, personEntry(input, 'reactivated')],
  });
}

export interface OverrideStudentInput {
  readonly student: StudentPerson;
  readonly to: AccountStatus;
  readonly reason: string;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Super Admin status override, any institution (PER-11): "Add a reason — it is kept in the
 *  history"; "An override — kept in the history. The Institute Admin normally changes this." */
export function overrideStudentStatus(input: OverrideStudentInput): Decision<StudentPerson> {
  if (!accountMove(input.student, input.to, 'overrideStudentStatus'))
    return invalidState(input.student.accountStatus);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.student,
    ...nextMeta(input.student, input.now),
    accountStatus: input.to,
    deactivation: input.to === 'inactive' ? { at: input.now, by: input.actor, reason } : null,
    history: [...input.student.history, personEntry(input, 'status-overridden', reason)],
  });
}

/** IA-06 directory (B2-06 `LBL`): Inactive, else Access active when an active grant names them. */
export function studentDirectoryStatus(
  student: StudentPerson,
  hasActiveGrant: boolean,
): StudentDirectoryStatus {
  if (student.accountStatus === 'inactive') return 'inactive';
  return hasActiveGrant ? 'access-active' : 'no-access-yet';
}

export interface CreateGroupInput extends IaWrite {
  readonly groups: readonly Group[];
  readonly name: string;
}

/** Create group (GRP-01; DL-3): "Enter a name for the group" / "A group called “…” already
 *  exists" (case-insensitive). Created with 0 members. */
export function createGroup(input: CreateGroupInput): Decision<Group> {
  if (input.institution.pause) return refused('institution-paused');
  if (isBlank(input.name)) return invalidInput({ field: 'name', rule: 'required' });
  if (
    input.groups.some(
      (group) => group.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    )
  ) {
    return invalidInput({ field: 'name', rule: 'taken' });
  }
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('group'),
    institutionId: input.institution.id,
    name: input.name.trim(),
    createdAt: input.now,
    createdBy: input.actor,
    memberships: [],
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'created',
        at: input.now,
        actor: input.actor,
        visibleTo: ['tenant_admin'],
      }),
    ],
  });
}

/** Rename group (GRP-02; DL-3). A duplicate-name check on rename is not drawn [U]. */
export function renameGroup(
  input: IaWrite & { readonly group: Group; readonly name: string },
): Decision<Group> {
  if (input.institution.pause) return refused('institution-paused');
  if (isBlank(input.name)) return invalidInput({ field: 'name', rule: 'required' });
  return ok({
    ...input.group,
    ...nextMeta(input.group, input.now),
    name: input.name.trim(),
    history: [
      ...input.group.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'renamed',
        at: input.now,
        actor: input.actor,
        note: input.group.name,
        visibleTo: ['tenant_admin'],
      }),
    ],
  });
}

export function currentMembers(group: Group): readonly PersonId[] {
  return group.memberships
    .filter((membership) => membership.removedAt === null)
    .map((membership) => membership.studentId);
}

/** Add members (GRP-03): own-institution students; inactive students are offered (" · inactive").
 *  Late members are marked "Added after the group grant" — whether they receive it is open
 *  (OD-B2-02; SACC-16): nothing here gives or computes access. */
export function addMembers(
  input: IaWrite & { readonly group: Group; readonly students: readonly StudentPerson[] },
): Decision<Group> {
  if (input.institution.pause) return refused('institution-paused');
  if (input.students.length === 0) return invalidInput({ field: 'students', rule: 'required' });
  if (input.students.some((student) => student.institutionId !== input.group.institutionId)) {
    return notPermitted('out-of-scope');
  }
  const current = new Set(currentMembers(input.group));
  if (input.students.some((student) => current.has(student.id)))
    return invalidState('already-a-member');
  return ok({
    ...input.group,
    ...nextMeta(input.group, input.now),
    memberships: [
      ...input.group.memberships,
      ...input.students.map((student) => ({
        studentId: student.id,
        addedAt: input.now,
        addedBy: input.actor,
        removedAt: null,
        removedBy: null,
      })),
    ],
  });
}

/** Remove a member (GRP-04; DL-1): they leave the group; their record stays. The effect on
 *  group-given access is not stated (GRP-05 UNRESOLVED): only the membership changes — no grant is
 *  created, withdrawn or edited (P2-04). */
export function removeMember(
  input: IaWrite & { readonly group: Group; readonly studentId: PersonId },
): Decision<Group> {
  if (input.institution.pause) return refused('institution-paused');
  const index = input.group.memberships.findIndex(
    (membership) => membership.studentId === input.studentId && membership.removedAt === null,
  );
  if (index < 0) return invalidState('not-a-member');
  return ok({
    ...input.group,
    ...nextMeta(input.group, input.now),
    memberships: input.group.memberships.map((membership, at) =>
      at === index ? { ...membership, removedAt: input.now, removedBy: input.actor } : membership,
    ),
  });
}

export interface AssignFacultyCourseInput extends IaWrite {
  readonly mappings: readonly FacultyCourseMapping[];
  readonly faculty: FacultyPerson;
  readonly courseId: CourseId;
  /** Courses in the institution's content access. */
  readonly coursesInAccess: readonly CourseId[];
}

/** Assign a course to an active faculty member (FCM-01): "<name> already teaches <course>". */
export function assignFacultyCourse(
  input: AssignFacultyCourseInput,
): Decision<FacultyCourseMapping> {
  if (input.institution.pause) return refused('institution-paused');
  if (input.faculty.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  const issues = [
    ...(input.faculty.accountStatus === 'active'
      ? []
      : [{ field: 'facultyId', rule: 'active-only' }]),
    ...(input.coursesInAccess.includes(input.courseId)
      ? []
      : [{ field: 'courseId', rule: 'in-content-access' }]),
    ...(input.mappings.some(
      (mapping) =>
        mapping.facultyId === input.faculty.id &&
        mapping.courseId === input.courseId &&
        mapping.removedAt === null,
    )
      ? [{ field: 'courseId', rule: 'already-teaches' }]
      : []),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('facultyCourseMapping'),
    institutionId: input.institution.id,
    facultyId: input.faculty.id,
    courseId: input.courseId,
    assignedAt: input.now,
    assignedBy: input.actor,
    removedAt: null,
    removedBy: null,
  });
}

/** Remove a course from a faculty member (FCM-02; DL-1, with the drawn warning — see
 *  `unmarkedAfterRemoval`). Soft removal: the record and its dates stay. */
export function removeFacultyCourse(
  input: IaWrite & { readonly mapping: FacultyCourseMapping },
): Decision<FacultyCourseMapping> {
  if (input.institution.pause) return refused('institution-paused');
  if (input.mapping.removedAt !== null) return invalidState('removed');
  return ok({
    ...input.mapping,
    ...nextMeta(input.mapping, input.now),
    removedAt: input.now,
    removedBy: input.actor,
  });
}

/** The drawn warning (B2-09 f2; FCM-05): "1 written answer in ME ZG523 is waiting for marking,
 *  and no other faculty member teaches the course." */
export function unmarkedAfterRemoval(
  mapping: FacultyCourseMapping,
  mappings: readonly FacultyCourseMapping[],
  writtenAnswersWaiting: number,
): { readonly waiting: number; readonly noOtherMarker: boolean } {
  const others = mappings.some(
    (other) =>
      other.id !== mapping.id && other.courseId === mapping.courseId && other.removedAt === null,
  );
  return { waiting: writtenAnswersWaiting, noOtherMarker: !others && writtenAnswersWaiting > 0 };
}

/**
 * The Faculty scope (FCM-04; BR-064): courses assigned in Faculty courses ∩ experiments the
 * institution holds. Students come from grants only inside this scope (SACC-20).
 */
export function facultyScope(input: {
  readonly facultyId: PersonId;
  readonly mappings: readonly FacultyCourseMapping[];
  /** Experiments in the institution's plans, with their course. */
  readonly heldExperiments: readonly {
    readonly experimentId: ExperimentId;
    readonly courseId: CourseId;
  }[];
}): { readonly courseIds: readonly CourseId[]; readonly experimentIds: readonly ExperimentId[] } {
  const courseIds = [
    ...new Set(
      input.mappings
        .filter((mapping) => mapping.facultyId === input.facultyId && mapping.removedAt === null)
        .map((mapping) => mapping.courseId),
    ),
  ];
  const taught = new Set(courseIds);
  return {
    courseIds,
    experimentIds: [
      ...new Set(
        input.heldExperiments
          .filter((held) => taught.has(held.courseId))
          .map((held) => held.experimentId),
      ),
    ],
  };
}
