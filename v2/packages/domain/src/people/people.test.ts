/**
 * People, groups and Faculty courses (Appendix C M12–M14; matrix PER-*, GRP-*, FCM-*). Adding a
 * person writes a record only (T-11); Programme is a record field only (BC2); every Institute
 * Admin write is refused while the institution is paused.
 */
import { describe, expect, it } from 'vitest';

import {
  counterIds,
  expectOk,
  faculty,
  group,
  ids,
  institution,
  mapping,
  refusalOf,
  student,
  T,
  who,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import type { CourseId, ExperimentId, PersonId } from '../kernel/ids.js';
import {
  addFaculty,
  addMembers,
  addStudent,
  assignFacultyCourse,
  checkStudentImport,
  commitStudentImport,
  createGroup,
  currentMembers,
  deactivateStudent,
  facultyScope,
  overrideStudentStatus,
  reactivateStudent,
  removeFacultyCourse,
  removeMember,
  renameGroup,
  studentDirectoryStatus,
  type StudentImportRow,
  unmarkedAfterRemoval,
} from './decide.js';
import { ACCOUNT_STATUSES, PERSON_TRANSITIONS } from './model.js';

const paused = () => institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });
const ia = () => ({
  institution: institution(),
  actor: who.instituteAdmin,
  now: T.oct14,
  ids: counterIds(),
});

describe('adding people (PER-01, PER-03): a record, Active, no experiments, nothing sent (T-11)', () => {
  const form = {
    fullName: 'Kiran Rao',
    email: 'kiran.rao@godavari.edu.in',
    studentId: 'git-2026-0510',
    programme: ' B.E. Mechanical ',
  };

  it('a student carries Programme as a field only', () => {
    const added = expectOk(addStudent({ ...ia(), people: [student()], form }));
    expect(added).toMatchObject({
      kind: 'student',
      accountStatus: 'active',
      programme: 'B.E. Mechanical',
      courseFilings: [],
      institutionStudentId: 'git-2026-0510',
    });
    expect(added.history.map((entry) => entry.event)).toEqual(['added']);
    expect(Object.keys(added)).not.toEqual(
      expect.arrayContaining(['invitation', 'password', 'activation', 'module']),
    );
  });

  it('e-mail and Student ID already in People (Student ID compared upper-case)', () => {
    const issues = refusalOf(
      addStudent({
        ...ia(),
        people: [student()],
        form: { ...form, email: 'RAHUL.VERMA@godavari.edu.in', studentId: 'git-2026-0418' },
      }),
    );
    expect(issues).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'email', rule: 'taken' },
        { field: 'studentId', rule: 'taken' },
      ],
    });
  });

  it('a faculty member: name and e-mail, no Student ID; refused while paused', () => {
    expect(
      expectOk(
        addFaculty({ ...ia(), people: [], fullName: 'Dr K. Rao', email: 'k.rao@godavari.edu.in' }),
      ).kind,
    ).toBe('faculty');
    expect(
      refusalOf(
        addFaculty({
          ...ia(),
          institution: paused(),
          people: [],
          fullName: 'Dr K. Rao',
          email: 'k.rao@godavari.edu.in',
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
    expect(refusalOf(addStudent({ ...ia(), institution: paused(), people: [], form }))).toEqual({
      kind: 'refused',
      code: 'institution-paused',
    });
  });
});

describe('the student CSV (PER-02; B2-07): six columns, all or nothing', () => {
  const row = (n: number, overrides: Partial<StudentImportRow> = {}): StudentImportRow => ({
    row: n,
    studentId: `GIT-2026-05${String(n).padStart(2, '0')}`,
    fullName: `Student ${n}`,
    email: `student${n}@godavari.edu.in`,
    programme: 'B.E. Mechanical',
    course: 'Thermodynamics & Heat Transfer',
    courseCode: 'ME ZG523',
    ...overrides,
  });
  const resolveCourse = (code: string): CourseId | null =>
    code === 'ME ZG523' || code === 'MEC-523' ? ids.course : null;

  it('reports every drawn problem and blocks the import', () => {
    const rows = [
      row(1),
      row(2, { studentId: 'git-2026-0501' }),
      row(3, { email: 'rahul.verma@godavari.edu.in' }),
      row(4, { email: 'student4@godavari', programme: '' }),
      row(5, { courseCode: 'XX 000' }),
    ];
    const report = checkStudentImport({ rows, people: [student()], resolveCourse });
    expect(report).toMatchObject({ rowsChecked: 5, ready: 1, canImport: false });
    expect(report.problems).toEqual([
      { row: 2, field: 'studentId', rule: 'duplicate-in-file' },
      { row: 3, field: 'email', rule: 'in-people' },
      { row: 4, field: 'programme', rule: 'required' },
      { row: 4, field: 'email', rule: 'email-format' },
      { row: 5, field: 'courseCode', rule: 'unknown-course' },
    ]);
    expect(
      commitStudentImport({
        ...ia(),
        rows,
        people: [student()],
        resolveCourse,
        fileName: 'godavari.csv',
      }).ok,
    ).toBe(false);
  });

  it('a clean file files each student against the course (platform code or the institution’s own)', () => {
    const imported = expectOk(
      commitStudentImport({
        ...ia(),
        rows: [row(1), row(2, { courseCode: 'MEC-523' })],
        people: [],
        resolveCourse,
        fileName: 'godavari-me-zg523.csv',
      }),
    );
    expect(imported.map((person) => person.courseFilings[0])).toEqual([
      { courseId: ids.course, codeAsGiven: 'ME ZG523', filedAt: T.oct14, source: 'import' },
      { courseId: ids.course, codeAsGiven: 'MEC-523', filedAt: T.oct14, source: 'import' },
    ]);
    expect(imported[0]!.added).toMatchObject({
      how: 'import',
      importFileName: 'godavari-me-zg523.csv',
    });
    expect(
      refusalOf(
        commitStudentImport({
          ...ia(),
          rows: [],
          people: [],
          resolveCourse,
          fileName: 'empty.csv',
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'file', rule: 'required' }] });
  });
});

describe('the account machine (M12): drawn moves only; Faculty status is not designed (PER-07)', () => {
  it('the table has exactly the drawn rows', () => {
    expect(ACCOUNT_STATUSES).toEqual(['active', 'inactive']);
    expect(
      PERSON_TRANSITIONS.some(
        (row) => row.command.toLowerCase().includes('faculty') && row.from !== null,
      ),
    ).toBe(false);
  });

  it('deactivate needs a reason; reactivate restores; both only from the drawn state', () => {
    const off = expectOk(
      deactivateStudent({ ...ia(), student: student(), reason: ' Left the programme ' }),
    );
    expect(off).toMatchObject({
      accountStatus: 'inactive',
      deactivation: { reason: 'Left the programme' },
    });
    expect(refusalOf(deactivateStudent({ ...ia(), student: off, reason: 'x' }))).toEqual({
      kind: 'invalid-state',
      current: 'inactive',
    });
    expect(refusalOf(deactivateStudent({ ...ia(), student: student(), reason: ' ' }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'reason', rule: 'required' }],
    });
    const on = expectOk(reactivateStudent({ ...ia(), student: off }));
    expect(on).toMatchObject({ accountStatus: 'active', deactivation: null });
    expect(refusalOf(reactivateStudent({ ...ia(), student: on }))).toEqual({
      kind: 'invalid-state',
      current: 'active',
    });
  });

  it('another institution’s student is out of scope; a paused institution is read-only', () => {
    expect(
      refusalOf(
        deactivateStudent({
          ...ia(),
          student: student({ institutionId: ids.konark }),
          reason: 'x',
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'out-of-scope' });
    expect(
      refusalOf(
        reactivateStudent({
          ...ia(),
          institution: paused(),
          student: student({ accountStatus: 'inactive' }),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
  });

  it('the Super Admin override (PER-11) both ways, with a reason kept in the history', () => {
    const off = expectOk(
      overrideStudentStatus({
        student: student(),
        to: 'inactive',
        reason: 'Duplicate account',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(off.history.at(-1)).toMatchObject({
      event: 'status-overridden',
      note: 'Duplicate account',
    });
    expect(
      expectOk(
        overrideStudentStatus({
          student: off,
          to: 'active',
          reason: 'Restored',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ).accountStatus,
    ).toBe('active');
    expect(
      refusalOf(
        overrideStudentStatus({
          student: student(),
          to: 'active',
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'invalid-state', current: 'active' });
  });

  it('the directory word (IA-06) reads from the account and grants', () => {
    expect(studentDirectoryStatus(student(), true)).toBe('access-active');
    expect(studentDirectoryStatus(student(), false)).toBe('no-access-yet');
    expect(studentDirectoryStatus(student({ accountStatus: 'inactive' }), true)).toBe('inactive');
  });
});

describe('groups (GRP-01 … GRP-05)', () => {
  it('create with 0 members; names are unique case-insensitively; rename keeps the old name in history', () => {
    const made = expectOk(createGroup({ ...ia(), groups: [], name: 'ME ZG523 — Sem II' }));
    expect(made).toMatchObject({ id: 'GRP-1001', memberships: [] });
    expect(refusalOf(createGroup({ ...ia(), groups: [made], name: 'me zg523 — sem ii' }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'name', rule: 'taken' }],
    });
    const renamed = expectOk(renameGroup({ ...ia(), group: made, name: 'ME ZG523 — Sem I' }));
    expect(renamed.history.at(-1)).toMatchObject({ event: 'renamed', note: 'ME ZG523 — Sem II' });
  });

  it('removing a member changes the membership only (GRP-05 unresolved): the record stays', () => {
    const members = expectOk(
      addMembers({ ...ia(), group: group(), students: [student(), student({ id: ids.arun })] }),
    );
    expect(currentMembers(members)).toEqual([ids.rahul, ids.arun]);
    expect(refusalOf(addMembers({ ...ia(), group: members, students: [student()] }))).toEqual({
      kind: 'invalid-state',
      current: 'already-a-member',
    });
    expect(
      refusalOf(
        addMembers({
          ...ia(),
          group: members,
          students: [student({ id: ids.sneha, institutionId: ids.konark })],
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'out-of-scope' });
    const removed = expectOk(removeMember({ ...ia(), group: members, studentId: ids.rahul }));
    expect(currentMembers(removed)).toEqual([ids.arun]);
    expect(removed.memberships).toHaveLength(2);
    expect(removed.memberships[0]).toMatchObject({ studentId: ids.rahul, removedAt: T.oct14 });
    expect(refusalOf(removeMember({ ...ia(), group: removed, studentId: ids.rahul }))).toEqual({
      kind: 'invalid-state',
      current: 'not-a-member',
    });
  });
});

describe('Faculty courses (FCM-01 … FCM-05): the Faculty scope, never Student access (B2-09)', () => {
  it('assign an active faculty member to a course in the content access', () => {
    const made = expectOk(
      assignFacultyCourse({
        ...ia(),
        mappings: [],
        faculty: faculty(),
        courseId: ids.course,
        coursesInAccess: [ids.course],
      }),
    );
    expect(made).toMatchObject({
      id: 'FMAP-1001',
      facultyId: ids.ranganathan,
      courseId: ids.course,
      removedAt: null,
    });
    expect(
      refusalOf(
        assignFacultyCourse({
          ...ia(),
          mappings: [made],
          faculty: faculty({ accountStatus: 'inactive' }),
          courseId: ids.course2,
          coursesInAccess: [ids.course],
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'facultyId', rule: 'active-only' },
        { field: 'courseId', rule: 'in-content-access' },
      ],
    });
    expect(
      refusalOf(
        assignFacultyCourse({
          ...ia(),
          mappings: [made],
          faculty: faculty(),
          courseId: ids.course,
          coursesInAccess: [ids.course],
        }),
      ),
    ).toMatchObject({ issues: [{ rule: 'already-teaches' }] });
  });

  it('removal is soft and warns about unmarked written answers with no other marker', () => {
    const removed = expectOk(removeFacultyCourse({ ...ia(), mapping: mapping() }));
    expect(removed.removedAt).toBe(T.oct14);
    expect(refusalOf(removeFacultyCourse({ ...ia(), mapping: removed }))).toEqual({
      kind: 'invalid-state',
      current: 'removed',
    });
    expect(unmarkedAfterRemoval(mapping(), [mapping()], 1)).toEqual({
      waiting: 1,
      noOtherMarker: true,
    });
    const other = mapping({ id: unsafeBrand('FMAP-0022'), facultyId: ids.kumar });
    expect(unmarkedAfterRemoval(mapping(), [mapping(), other], 1)).toEqual({
      waiting: 1,
      noOtherMarker: false,
    });
  });

  it('the scope is assigned courses ∩ experiments the institution holds', () => {
    const otherExperiment = unsafeBrand<ExperimentId>('other');
    const scope = facultyScope({
      facultyId: ids.ranganathan,
      mappings: [
        mapping(),
        mapping({ id: unsafeBrand('FMAP-0023'), courseId: ids.course2, removedAt: T.oct12 }),
        mapping({ id: unsafeBrand('FMAP-0024'), facultyId: unsafeBrand<PersonId>('per-other') }),
      ],
      heldExperiments: [
        { experimentId: ids.shell, courseId: ids.course },
        { experimentId: otherExperiment, courseId: ids.course2 },
      ],
    });
    expect(scope).toEqual({ courseIds: [ids.course], experimentIds: [ids.shell] });
  });
});
