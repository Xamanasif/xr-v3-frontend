/**
 * The Institute Admin's distribution reads (Phase-2 Package 2A; B2-01 IA-01, B2-06 IA-06
 * and IA-08): the overview's attention items are read from the records — the held experiment no
 * active grant reaches, the active students no active grant reaches — and Give access changes
 * them at once; the student directory filters by status, group, "Not in a group" and search as
 * B2-06 draws them and tells the same story as each student's record; faculty and groups are the
 * institution's own. The reads are the Institute Admin's alone (INST-11, PER-18, GRP-08 own
 * institution; the Student's workspace is refused).
 *
 * The fixture is the walk after its setup (8 Oct 2026, 16:15): Godavari's ACC-0107 active, Meera
 * Iyer assigned, twelve students imported (Sneha Reddy deactivated), three faculty (Dr S.
 * Ranganathan teaching ME ZG523), GRP-0012 "ME ZG523 — Sem II", MEC-523 set — and no grant yet.
 */
import type { MethodId } from '../../ports/index.js';
import { check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, personIdOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { SAMPLE } from '../sample.js';

const SESSION: readonly MethodId[] = ['SessionService.getSession'];

const overview: ContractCase = {
  id: 'institute:overview',
  title:
    'IA-01’s attention items are the records’ facts, and Give access changes them at once (B2-01)',
  group: 'institution',
  evidence:
    'B2-01 f0 (“Shell-and-Tube Heat Exchanger hasn’t been given to any student”, “12 students have no access yet”, “ME ZG523 has no course code from your institution”), f2 (nothing needs your attention), f7 (at most six rows); matrix INST-11, PER-18, SACC-01; PC-38',
  requires: {
    fixture: { kind: 'after-setup' },
    methods: [
      ...SESSION,
      'InstitutionService.getMyOverview',
      'InstitutionService.getAccessPlan',
      'PeopleService.listStudents',
      'StudentAccessService.giveAccess',
      'CatalogueService.searchCatalogue',
    ],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const student = context.as('Rahul Verma');
    const rahul = await personIdOf(student, 'Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);

    const before = valueOf(await ia.institutions.getMyOverview(), 'IA-01 before any grant');
    check(before.status === 'access-active', 'IA-01: Access active after activation');
    check(before.plan !== null, 'IA-01: the status line names the access plan');
    check(before.attention.length <= 6, 'IA-01: at most six items (BR-138)');
    check(
      before.attention.some(
        (item) => item.kind === 'experiment-not-given' && item.experimentId === shell.experimentId,
      ),
      'IA-01: the held experiment no grant reaches is an item',
    );
    const directory = valueOf(await ia.people.listStudents({}), 'IA-06');
    const withoutAccess = directory.filter((row) => row.directoryStatus === 'no-access-yet');
    const without = before.attention.find((item) => item.kind === 'students-without-access');
    check(
      without !== undefined && without.students === withoutAccess.length,
      'IA-01: “N students have no access yet” counts the students IA-06 lists as No access yet',
    );
    check(
      !before.attention.some((item) => item.kind === 'course-without-code'),
      'IA-01: ME ZG523 has the institution’s code MEC-523 (setup S6), so no course-code item',
    );

    const plan = valueOf(await ia.institutions.getAccessPlan(before.plan.id), 'IA-03');
    valueOf(
      await ia.studentAccess.giveAccess({
        experimentIds: [shell.experimentId],
        target: { kind: 'student', studentId: rahul },
        expectedPlanRev: plan.plan.rev,
      }),
      'IA-05 give Rahul Verma the experiment',
    );
    const after = valueOf(await ia.institutions.getMyOverview(), 'IA-01 after the grant');
    check(
      !after.attention.some(
        (item) => item.kind === 'experiment-not-given' && item.experimentId === shell.experimentId,
      ),
      'IA-01: once given, the experiment is no longer an item',
    );
    const afterWithout = after.attention.find((item) => item.kind === 'students-without-access');
    deepEqual(
      afterWithout?.students ?? 0,
      withoutAccess.length - 1,
      'IA-01: one student fewer has no access',
    );

    errorOf(
      await student.institutions.getMyOverview(),
      'not-permitted',
      'a Student cannot read the Institute Admin’s overview',
    );
  },
};

const students: ContractCase = {
  id: 'institute:students',
  title:
    'IA-06 lists the institution’s students as their records read, with the drawn filters (B2-06)',
  group: 'institution',
  evidence:
    'B2-06 f0 (Search “Name, student ID or e-mail”, Status, Group with “Not in a group”; “Course and group”, “Experiments given”, “Status”), f2 (no match), f6 (Inactive); matrix PER-18; PC-39',
  requires: {
    fixture: { kind: 'after-setup' },
    methods: [
      ...SESSION,
      'PeopleService.listStudents',
      'PeopleService.getStudent',
      'GroupService.listGroups',
    ],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const all = valueOf(await ia.people.listStudents({}), 'IA-06 all');
    check(all.length > 0, 'IA-06: the imported students are listed');
    for (const row of all) {
      const record = valueOf(
        await ia.people.getStudent(row.student.id),
        `IA-07 ${row.student.fullName}`,
      );
      deepEqual(
        row.groups.map((group) => group.id).sort(),
        record.groups.map((group) => group.id).sort(),
        `${row.student.fullName}: the row’s groups are the record’s`,
      );
      check(
        (row.directoryStatus === 'inactive') === (record.student.accountStatus === 'inactive'),
        `${row.student.fullName}: Inactive exactly when the account is`,
      );
      check(
        row.directoryStatus !== 'access-active' || row.given.length > 0,
        `${row.student.fullName}: Access active names an experiment given`,
      );
    }

    const inactive = valueOf(await ia.people.listStudents({ status: 'inactive' }), 'Inactive');
    deepEqual(
      inactive.map((row) => row.student.id),
      all.filter((row) => row.directoryStatus === 'inactive').map((row) => row.student.id),
      'IA-06: the Status filter',
    );

    const first = all[0]!.student;
    for (const text of [
      first.institutionStudentId.toLowerCase(),
      first.institutionEmail.toUpperCase(),
      ` ${first.fullName.split(' ')[0]!} `,
    ]) {
      const found = valueOf(await ia.people.listStudents({ search: text }), `search “${text}”`);
      check(
        found.some((row) => row.student.id === first.id),
        `IA-06: “${text}” finds ${first.fullName} (name, student ID or e-mail, ignoring case)`,
      );
    }
    deepEqual(
      valueOf(await ia.people.listStudents({ search: 'zz-nobody' }), 'no match'),
      [],
      'IA-06: no match',
    );

    const groups = valueOf(await ia.groups.listGroups(), 'the institution’s groups');
    check(groups.length > 0, 'IA-06: the Group filter has the institution’s groups');
    let inGroups = 0;
    for (const entry of groups) {
      const members = valueOf(
        await ia.people.listStudents({ groupId: entry.group.id }),
        `Group ${entry.group.name}`,
      );
      deepEqual(members.length, entry.memberCount, `${entry.group.name}: its current members`);
      for (const row of members)
        check(
          row.groups.some((group) => group.id === entry.group.id),
          `${entry.group.name}: only its members`,
        );
      inGroups += members.length;
    }
    const outside = valueOf(await ia.people.listStudents({ notInGroup: true }), 'Not in a group');
    check(
      outside.every((row) => row.groups.length === 0),
      'IA-06: “Not in a group” lists students in no group',
    );
    check(
      outside.length + all.filter((row) => row.groups.length > 0).length === all.length &&
        inGroups >= all.filter((row) => row.groups.length > 0).length,
      'IA-06: every student is in a group or not in one',
    );

    errorOf(
      await context.as('Rahul Verma').people.listStudents({}),
      'not-permitted',
      'a Student cannot list the institution’s students',
    );
  },
};

const facultyAndGroups: ContractCase = {
  id: 'institute:faculty-and-groups',
  title:
    'IA-08 lists the institution’s faculty with the courses they teach; groups are its own (B2-06)',
  group: 'institution',
  evidence:
    'B2-06 f14 (IA-08 Faculty: Dr S. Ranganathan · ME ZG523), B2-08 (GRP-0012 “ME ZG523 — Sem II”); matrix PER-18, GRP-08',
  requires: {
    fixture: { kind: 'after-setup' },
    methods: [...SESSION, 'PeopleService.listFaculty', 'GroupService.listGroups'],
  },
  run: async (context) => {
    const ia = context.as('Meera Iyer');
    const faculty = valueOf(await ia.people.listFaculty(), 'IA-08');
    const ranganathan = faculty.find((row) => row.faculty.fullName === 'Dr S. Ranganathan');
    check(ranganathan, 'IA-08: Dr S. Ranganathan is listed');
    check(ranganathan.coursesTaught.length === 1, 'IA-08: he teaches one course (setup S4)');
    check(
      faculty.every((row) => row.faculty.kind === 'faculty'),
      'IA-08: faculty members only',
    );
    const groups = valueOf(await ia.groups.listGroups(), 'groups');
    check(
      groups.some((entry) => entry.group.name === 'ME ZG523 — Sem II'),
      'the setup’s group is listed',
    );
    errorOf(
      await context.as('Dr S. Ranganathan').people.listFaculty(),
      'not-permitted',
      'a Faculty member cannot list the institution’s faculty',
    );
    errorOf(
      await context.as('Rahul Verma').groups.listGroups(),
      'not-permitted',
      'a Student cannot list the institution’s groups',
    );
  },
};

export const INSTITUTE_READ_CASES: readonly ContractCase[] = [overview, students, facultyAndGroups];
