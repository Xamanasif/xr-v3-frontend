/**
 * Phase-2 Package 2B on the sample adapter: the five Phase-2 reads it delivers — IA-11's CSV check
 * (`previewStudentImport`, PC-47), IA-09's Faculty record (`getFaculty`), IA-14's Group
 * (`getGroup`, PC-46), IA-15's Faculty courses (`FacultyCourseService.list`) and IA-16's Course
 * codes (`InstitutionCourseCodeService.list`) — IA-13's experiments given per group, the IA-05
 * "Already has it" fix per chosen experiment (PC-48) and the sample-mode identity safeguard
 * (PC-49). Every answer matches its ledger output schema; a check writes nothing.
 */
import {
  commitStudentImportOutput,
  getFacultyOutput,
  getGroupOutput,
  giveAccessOptions,
  listFacultyCoursesOutput,
  listGroupsOutput,
  listInstitutionCourseCodesOutput,
  type ProductPorts,
  studentImportReport,
} from '@xr/contracts/draft';
import {
  type AccessPlan,
  type ExperimentId,
  type GroupId,
  type PersonId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { seed } from '../seed/spine-start.js';
import {
  asPerson,
  buildWorld,
  fixtureWorld,
  type FixtureName,
  personIdOf,
  snapshot,
  stepsTo,
  visitorPorts,
  worldOf,
} from '../testing/index.js';
import type { World } from '../world/types.js';
import { csvRecords, parseStudentFile } from './student-import.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const FIN_TUBE = unsafeBrand<ExperimentId>('fin-tube-bundle');
const GRP_0012 = unsafeBrand<GroupId>('GRP-0012');
const THERMO = 'thermodynamics-heat-transfer';

/** Godavari active, Meera Iyer assigned, nobody in People yet (the walk before S1). */
let beforeImport: Promise<World> | null = null;
function worldBeforeImport(): Promise<World> {
  beforeImport ??= (async () => {
    const { steps, at } = stepsTo({ before: 'S1' });
    return buildWorld(seed(), steps, { seedId: 'before-import', at });
  })();
  return beforeImport;
}

async function platformOn(world: World | FixtureName) {
  return createSamplePlatform({
    world: typeof world === 'string' ? await fixtureWorld(world) : world,
  });
}

type Platform = Awaited<ReturnType<typeof platformOn>>;

const meera = (platform: Platform): ProductPorts => asPerson(platform, 'Meera Iyer');
const idOf = (platform: Platform, name: string) =>
  unsafeBrand<PersonId>(personIdOf(worldOf(platform), name));

const HEADER = 'student_id,full_name,email,programme,course,course_code';
const row = (id: string, name: string, email: string, code = 'ME ZG523') =>
  `${id},${name},${email},B.Tech Mechanical,Thermodynamics & Heat Transfer,${code}`;

/** B2-07's two files: twelve good rows, and the one with four errors (rows 6, 9, 11, 12). */
const GOOD = [
  HEADER,
  row('GIT-2026-0418', 'Rahul Verma', 'rahul.verma@godavari.edu.in'),
  row('GIT-2026-0431', 'Priya Natarajan', 'priya.natarajan@godavari.edu.in'),
  row('GIT-2026-0409', 'Imran Shaikh', 'imran.shaikh@godavari.edu.in', 'MEC-523'),
].join('\r\n');

describe('the CSV reader (RFC 4180, PC-47)', () => {
  it('reads quoted fields, doubled quotes, commas and line ends inside quotes, and drops a BOM', () => {
    expect(csvRecords('﻿a,"b, c","say ""hi"""\r\n"line\nbreak",,x\ny')).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['line\nbreak', '', 'x'],
      ['y'],
    ]);
  });

  it('numbers rows as the file’s lines (the header is row 1), skips blank lines, any column order', () => {
    const parsed = parseStudentFile(
      'Course_Code, Full Name ,email,student_id,programme,course\n\n' +
        'ME ZG523,Rahul Verma,rahul@godavari.edu.in,GIT-1,B.Tech,Thermo\n',
    );
    expect(parsed).toEqual({
      kind: 'rows',
      rows: [
        {
          row: 3,
          studentId: 'GIT-1',
          fullName: 'Rahul Verma',
          email: 'rahul@godavari.edu.in',
          programme: 'B.Tech',
          course: 'Thermo',
          courseCode: 'ME ZG523',
        },
      ],
    });
  });

  it('refuses a header without the six columns, or with one twice; a header alone has no rows', () => {
    expect(parseStudentFile('')).toEqual({ kind: 'columns' });
    expect(parseStudentFile('student_id,full_name,email,programme,course')).toEqual({
      kind: 'columns',
    });
    expect(parseStudentFile(`${HEADER},email`)).toEqual({ kind: 'columns' });
    expect(parseStudentFile(`${HEADER}\n\n`)).toEqual({ kind: 'no-rows' });
  });
});

describe('IA-11 previewStudentImport and commitStudentImport (B2-07 f5 … f10)', () => {
  it('checks a clean file, writes nothing, and the commit adds every row with no experiments', async () => {
    const platform = await platformOn(await worldBeforeImport());
    // MEC-523 is the institution's own code once it is set (S6); before that it names no course.
    const before = JSON.stringify(snapshot(platform));
    const report = ok(
      await meera(platform).people.previewStudentImport({
        fileName: 'godavari-me-zg523-corrected.csv',
        csvText: GOOD.replace(',MEC-523', ',ME ZG523'),
      }),
    );
    expect(studentImportReport.safeParse(report).success).toBe(true);
    expect(report).toMatchObject({
      fileName: 'godavari-me-zg523-corrected.csv',
      rowsChecked: 3,
      readyToImport: 3,
      problems: [],
      canImport: true,
    });
    expect(JSON.stringify(snapshot(platform))).toBe(before);

    const done = ok(await meera(platform).people.commitStudentImport({ batchId: report.batchId }));
    expect(commitStudentImportOutput.safeParse(done).success).toBe(true);
    expect(done.added).toBe(3);
    expect(done.students.map((student) => student.fullName)).toEqual([
      'Rahul Verma',
      'Priya Natarajan',
      'Imran Shaikh',
    ]);
    const listed = ok(await meera(platform).people.listStudents({}));
    expect(
      listed.map((entry) => [entry.student.fullName, entry.directoryStatus, entry.given]),
    ).toEqual([
      ['Rahul Verma', 'no-access-yet', []],
      ['Priya Natarajan', 'no-access-yet', []],
      ['Imran Shaikh', 'no-access-yet', []],
    ]);
    // A batch is committed once.
    expect(await meera(platform).people.commitStudentImport({ batchId: report.batchId })).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
  });

  it('reports the drawn errors with the row’s student and the words’ values; nothing is imported', async () => {
    const platform = await platformOn(await worldBeforeImport());
    const csv = [
      HEADER,
      row('GIT-2026-0418', 'Rahul Verma', 'rahul.verma@godavari.edu.in'),
      row('GIT-2026-0409', 'Imran Shaikh', 'imran.shaikh@godavari.edu.in'),
      row('GIT-2026-0409', 'Imran S.', 'imran.s@godavari.edu.in'),
      'GIT-2026-0426,Vikram Joshi,vikram.joshi@godavari.edu.in,,Thermodynamics & Heat Transfer,ME ZG523',
      row('GIT-2026-0430', 'Fatima Begum', 'fatima.begum@godavari'),
      row('GIT-2026-0436', 'Nikhil Bose', 'nikhil.bose@godavari.edu.in', ''),
      row('GIT-2026-0440', 'Ananya Das', 'ananya.das@godavari.edu.in', 'XX 999'),
    ].join('\n');
    const report = ok(
      await meera(platform).people.previewStudentImport({
        fileName: 'godavari-me-zg523.csv',
        csvText: csv,
      }),
    );
    expect(report.rowsChecked).toBe(7);
    expect(report.readyToImport).toBe(2);
    expect(report.canImport).toBe(false);
    expect(report.problems).toEqual([
      {
        row: 4,
        field: 'studentId',
        rule: 'duplicate-in-file',
        who: { fullName: 'Imran S.', studentId: 'GIT-2026-0409' },
        params: { id: 'GIT-2026-0409', row: '3' },
      },
      {
        row: 5,
        field: 'programme',
        rule: 'required',
        who: { fullName: 'Vikram Joshi', studentId: 'GIT-2026-0426' },
        params: {},
      },
      {
        row: 6,
        field: 'email',
        rule: 'email-format',
        who: { fullName: 'Fatima Begum', studentId: 'GIT-2026-0430' },
        params: { value: 'fatima.begum@godavari' },
      },
      {
        row: 7,
        field: 'courseCode',
        rule: 'required',
        who: { fullName: 'Nikhil Bose', studentId: 'GIT-2026-0436' },
        params: {},
      },
      {
        row: 8,
        field: 'courseCode',
        rule: 'unknown-course',
        who: { fullName: 'Ananya Das', studentId: 'GIT-2026-0440' },
        params: { value: 'XX 999' },
      },
    ]);
    const answer = await meera(platform).people.commitStudentImport({ batchId: report.batchId });
    expect(answer.ok).toBe(false);
    expect(ok(await meera(platform).people.listStudents({}))).toEqual([]);
  });

  it('answers the file checks on the file field: the template columns, then at least one row', async () => {
    const platform = await platformOn(await worldBeforeImport());
    const check = (csvText: string) =>
      meera(platform).people.previewStudentImport({ fileName: 'x.csv', csvText });
    const fileError = (key: string) => ({
      ok: false,
      error: {
        kind: 'validation-failed',
        fieldErrors: [{ field: 'file', key, message: null, params: {} }],
        summaryTitle: null,
      },
    });
    expect(await check('name,e-mail\nRahul,rahul@x.in')).toEqual(fileError('IA-11.file.columns'));
    expect(await check(HEADER)).toEqual(fileError('IA-11.file.no-rows'));
    expect(
      await meera(platform).people.previewStudentImport({ fileName: '  ', csvText: GOOD }),
    ).toMatchObject({
      ok: false,
      error: { fieldErrors: [{ field: 'fileName', key: 'IA-11.file.required' }] },
    });
  });

  it('files the student under the institution’s own course code (MEC-523, after S6)', async () => {
    const platform = await platformOn('after-setup');
    const report = ok(
      await meera(platform).people.previewStudentImport({
        fileName: 'more.csv',
        csvText: [
          HEADER,
          row('GIT-2026-0501', 'Asha Rao', 'asha.rao@godavari.edu.in', 'mec-523'),
        ].join('\n'),
      }),
    );
    expect(report.problems).toEqual([]);
    ok(await meera(platform).people.commitStudentImport({ batchId: report.batchId }));
    const asha = ok(await meera(platform).people.listStudents({ search: 'Asha' }));
    expect(asha[0]!.courses.map((course) => course.id)).toEqual([THERMO]);
  });

  it('is refused while the institution is paused, like every People write', async () => {
    const platform = await platformOn('after-setup');
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(unsafeBrand('godavari')));
    ok(
      await admin.institutions.pauseInstitution({
        institutionId: unsafeBrand('godavari'),
        reason: 'Paused for review.',
        expectedRev: detail.institution.rev,
      }),
    );
    expect(
      await meera(platform).people.previewStudentImport({ fileName: 'x.csv', csvText: GOOD }),
    ).toEqual({ ok: false, error: { kind: 'refused', code: 'institution-paused' } });
  });
});

describe('the sample-mode identity safeguard (PC-49)', () => {
  it('IA-10 refuses an e-mail another sample identity signs in with; the sign-in is unchanged', async () => {
    const platform = await platformOn('after-setup');
    const people = Object.keys(worldOf(platform).records.people).length;
    for (const email of [
      'meera.iyer@godavari.edu.in',
      'Arjun.Mehta@wilp.example',
      'kavya.nair@wilp.example',
    ]) {
      expect(
        await meera(platform).people.addStudent({
          fullName: 'New Person',
          institutionEmail: email,
          institutionStudentId: 'GIT-2026-0999',
          programme: null,
          groupId: null,
        }),
      ).toEqual({
        ok: false,
        error: {
          kind: 'validation-failed',
          fieldErrors: [
            {
              field: 'institutionEmail',
              key: 'IA-10.institutionEmail.identity-taken',
              message: null,
              params: {},
            },
          ],
          summaryTitle: 'One thing needs fixing',
        },
      });
      expect(
        await meera(platform).people.addFaculty({
          fullName: 'New Person',
          institutionEmail: email,
        }),
      ).toMatchObject({ ok: false, error: { kind: 'validation-failed' } });
    }
    expect(Object.keys(worldOf(platform).records.people)).toHaveLength(people);
    const signIn = await visitorPorts(platform).session.signIn({
      method: 'email',
      email: 'meera.iyer@godavari.edu.in',
      password: 'x',
    });
    expect(signIn.ok && signIn.value.session.displayName).toBe('Meera Iyer');
  });

  it('joins the domain’s own field errors in the form’s order; People’s own word wins on the e-mail', async () => {
    const platform = await platformOn('after-setup');
    const answer = await meera(platform).people.addStudent({
      fullName: 'New Person',
      institutionEmail: 'kavya.nair@wilp.example',
      institutionStudentId: 'GIT-2026-0418',
      programme: null,
      groupId: null,
    });
    expect(answer.ok ? null : answer.error).toEqual({
      kind: 'validation-failed',
      fieldErrors: [
        {
          field: 'institutionEmail',
          key: 'IA-10.institutionEmail.identity-taken',
          message: null,
          params: {},
        },
        {
          field: 'institutionStudentId',
          key: 'IA-10.institutionStudentId.taken',
          message: 'GIT-2026-0418 is already used by Rahul Verma',
          params: { id: 'GIT-2026-0418', name: 'Rahul Verma' },
        },
      ],
      summaryTitle: '2 things need fixing',
    });
    const inPeople = await meera(platform).people.addStudent({
      fullName: 'New Person',
      institutionEmail: 'rahul.verma@godavari.edu.in',
      institutionStudentId: 'GIT-2026-0999',
      programme: null,
      groupId: null,
    });
    expect(inPeople.ok ? null : inPeople.error).toMatchObject({
      fieldErrors: [{ field: 'institutionEmail', key: 'IA-10.institutionEmail.taken' }],
    });
  });

  it('IA-11 reports an e-mail another identity holds, and an e-mail two rows share; the commit refuses them', async () => {
    const platform = await platformOn(await worldBeforeImport());
    const csv = [
      HEADER,
      row('GIT-1', 'A One', 'meera.iyer@godavari.edu.in'),
      row('GIT-2', 'B Two', 'shared@godavari.edu.in'),
      row('GIT-3', 'C Three', 'Shared@Godavari.edu.in'),
    ].join('\n');
    const report = ok(
      await meera(platform).people.previewStudentImport({ fileName: 'x.csv', csvText: csv }),
    );
    expect(report.problems.map((problem) => [problem.row, problem.rule, problem.params])).toEqual([
      [2, 'identity-taken', { value: 'meera.iyer@godavari.edu.in' }],
      [4, 'duplicate-in-file', { value: 'Shared@Godavari.edu.in', row: '3' }],
    ]);
    expect(report.canImport).toBe(false);
    const answer = await meera(platform).people.commitStudentImport({ batchId: report.batchId });
    expect(answer.ok ? null : answer.error).toEqual({
      kind: 'validation-failed',
      fieldErrors: [
        {
          field: 'rows.2.email',
          key: 'IA-11.row.email.identity-taken',
          message: null,
          params: { value: 'meera.iyer@godavari.edu.in' },
        },
        {
          field: 'rows.4.email',
          key: 'IA-11.row.email.duplicate-in-file',
          message: null,
          params: { value: 'Shared@Godavari.edu.in', row: '3' },
        },
      ],
      summaryTitle: null,
    });
    expect(ok(await meera(platform).people.listStudents({}))).toEqual([]);
  });
});

describe('IA-09 getFaculty and IA-15 FacultyCourseService.list (B2-06 f15, f16; B2-09)', () => {
  it('a faculty member, their mappings and the courses they name; another person is not found', async () => {
    const platform = await platformOn('after-setup');
    const ranganathan = idOf(platform, 'Dr S. Ranganathan');
    const record = ok(await meera(platform).people.getFaculty(ranganathan));
    expect(getFacultyOutput.safeParse(record).success).toBe(true);
    expect(record.faculty.fullName).toBe('Dr S. Ranganathan');
    expect(
      record.mappings.map((mapping) => [mapping.id, mapping.courseId, mapping.removedAt]),
    ).toEqual([['FMAP-0021', THERMO, null]]);
    expect(record.courses).toEqual([
      { id: THERMO, name: 'Thermodynamics & Heat Transfer', platformCode: 'ME ZG523' },
    ]);
    const desai = ok(await meera(platform).people.getFaculty(idOf(platform, 'Dr Anita Desai')));
    expect([desai.mappings, desai.courses]).toEqual([[], []]);
    expect(await meera(platform).people.getFaculty(idOf(platform, 'Rahul Verma'))).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    const mappings = ok(await meera(platform).facultyCourses.list());
    expect(listFacultyCoursesOutput.safeParse(mappings).success).toBe(true);
    expect(mappings.map((mapping) => mapping.id)).toEqual(['FMAP-0021']);
  });

  it('a removal stays on the record with its date and leaves the current list', async () => {
    const platform = await platformOn('after-setup');
    const [mapping] = ok(await meera(platform).facultyCourses.list());
    ok(
      await meera(platform).facultyCourses.remove({
        mappingId: mapping!.id,
        expectedRev: mapping!.rev,
      }),
    );
    const record = ok(await meera(platform).people.getFaculty(idOf(platform, 'Dr S. Ranganathan')));
    expect(record.mappings[0]!.removedAt).not.toBeNull();
    const faculty = ok(await meera(platform).people.listFaculty());
    expect(faculty[0]!.courses).toEqual([]);
  });
});

describe('IA-13 listGroups and IA-14 getGroup (B2-08)', () => {
  it('after setup: GRP-0012 with seven members, nothing given yet — every member Active', async () => {
    const platform = await platformOn('after-setup');
    const groups = ok(await meera(platform).groups.listGroups());
    expect(listGroupsOutput.safeParse(groups).success).toBe(true);
    expect(groups.map((entry) => [entry.group.id, entry.memberCount, entry.given])).toEqual([
      ['GRP-0012', 7, []],
    ]);
    const view = ok(await meera(platform).groups.getGroup(GRP_0012));
    expect(getGroupOutput.safeParse(view).success).toBe(true);
    expect(view.members).toHaveLength(7);
    expect(view.members.every((member) => member.standing.length === 0)).toBe(true);
    expect(view.grantRows).toEqual([]);
  });

  it('the later sample (SACC-0311): the group grant named, and each member’s standing', async () => {
    const platform = await platformOn('later-sample');
    const groups = ok(await meera(platform).groups.listGroups());
    expect(groups.find((entry) => entry.group.id === GRP_0012)!.given).toEqual([
      { experimentId: SHELL, name: 'Shell-and-Tube Heat Exchanger', formats: ['web', 'vr'] },
    ]);
    const view = ok(await meera(platform).groups.getGroup(GRP_0012));
    expect(
      view.grantRows.map((entry) => [
        entry.grant.id,
        entry.experimentName,
        entry.courseCode,
        entry.formats,
        entry.status,
      ]),
    ).toEqual([
      ['SACC-0311', 'Shell-and-Tube Heat Exchanger', 'ME ZG523', ['web', 'vr'], 'active'],
    ]);
    const standing = Object.fromEntries(
      view.members.map((member) => [member.student.fullName, member.standing]),
    );
    expect(standing['Sneha Reddy']).toEqual(['inactive']);
    expect(standing['Rahul Verma']).toEqual(['has-it-individually']);
    expect(standing['Arun Kumar']).toEqual(['waiting-for-a-licence']);
    expect(standing['Priya Natarajan']).toEqual(['can-open-it']);
  });

  it('computes no standing while the institution is paused (no “Can open it” where access is not live)', async () => {
    const platform = await platformOn('later-sample');
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(unsafeBrand('godavari')));
    ok(
      await admin.institutions.pauseInstitution({
        institutionId: unsafeBrand('godavari'),
        reason: 'Paused for review.',
        expectedRev: detail.institution.rev,
      }),
    );
    const view = ok(await meera(platform).groups.getGroup(GRP_0012));
    expect(view.grantRows.map((entry) => entry.status)).toEqual(['active']);
    expect(view.members.every((member) => member.standing.length === 0)).toBe(true);
  });

  it('create, add, remove and rename reach both reads at once; another institution’s group is not found', async () => {
    const platform = await platformOn('after-setup');
    const created = ok(await meera(platform).groups.createGroup({ name: 'Lab batch B' }));
    const empty = ok(await meera(platform).groups.getGroup(created.id));
    expect(empty.members).toEqual([]);
    const added = ok(
      await meera(platform).groups.addMembers({
        id: created.id,
        studentIds: [idOf(platform, 'Ananya Das')],
        expectedRev: created.rev,
      }),
    );
    expect(ok(await meera(platform).groups.getGroup(created.id)).members).toHaveLength(1);
    const removed = ok(
      await meera(platform).groups.removeMember({
        id: created.id,
        studentId: idOf(platform, 'Ananya Das'),
        expectedRev: added.rev,
      }),
    );
    ok(
      await meera(platform).groups.renameGroup({
        id: created.id,
        name: 'Lab batch C',
        expectedRev: removed.rev,
      }),
    );
    const listed = ok(await meera(platform).groups.listGroups());
    expect(listed.map((entry) => [entry.group.name, entry.memberCount])).toEqual([
      ['ME ZG523 — Sem II', 7],
      ['Lab batch C', 0],
    ]);
    expect(await asPerson(platform, 'Rahul Verma').groups.getGroup(created.id)).toMatchObject({
      ok: false,
    });
  });
});

describe('IA-16 InstitutionCourseCodeService.list (B2-03 f6 … f9)', () => {
  it('the course in content access, its BITS code and the institution’s own code with its status', async () => {
    const before = await platformOn(await worldBeforeImport());
    const missing = ok(await meera(before).institutionCourseCodes.list());
    expect(listInstitutionCourseCodesOutput.safeParse(missing).success).toBe(true);
    expect(
      missing.map((entry) => [
        entry.course.id,
        entry.course.platformCode,
        entry.code,
        entry.status,
      ]),
    ).toEqual([[THERMO, 'ME ZG523', null, 'missing']]);
    const after = await platformOn('after-setup');
    const added = ok(await meera(after).institutionCourseCodes.list());
    expect(added.map((entry) => [entry.code?.code, entry.code?.semester, entry.status])).toEqual([
      ['MEC-523', 'Sem II', 'added'],
    ]);
  });
});

/**
 * Package 2A's review: IA-05 answered "Already has it" per course. The regression fixture puts
 * two experiments of one course (ME ZG523: Shell-and-Tube and Fin-Tube) in ACC-0107; Rahul holds
 * Shell-and-Tube (SACC-0310). Choosing Fin-Tube must leave him selectable — and giving it succeeds.
 */
describe('IA-05 “Already has it” per chosen experiment (PC-48)', () => {
  async function twoExperimentPlan(): Promise<Platform> {
    const world = await fixtureWorld('after-flow-b');
    const plan = world.records.plans['ACC-0107'] as AccessPlan;
    return platformOn({
      ...world,
      records: {
        ...world.records,
        plans: {
          ...world.records.plans,
          'ACC-0107': {
            ...plan,
            items: [...plan.items, { experimentId: FIN_TUBE, formats: ['web'] }],
          },
        },
      },
    });
  }

  it('holding Shell-and-Tube blocks only Shell-and-Tube; Fin-Tube in the same course can be given', async () => {
    const platform = await twoExperimentPlan();
    const rahul = idOf(platform, 'Rahul Verma');
    const options = (experimentIds?: ExperimentId[]) =>
      meera(platform).studentAccess.getGiveAccessOptions({
        courseId: unsafeBrand(THERMO),
        ...(experimentIds ? { experimentIds } : {}),
      });
    const rahulIn = async (experimentIds?: ExperimentId[]) => {
      const answer = ok(await options(experimentIds));
      expect(giveAccessOptions.safeParse(answer).success).toBe(true);
      return answer.students.find((student) => student.id === rahul)!;
    };
    expect(ok(await options()).experiments.filter((entry) => entry.inPlan)).toHaveLength(2);
    expect(await rahulIn([SHELL])).toMatchObject({
      selectable: false,
      why: 'already-has-it',
      alreadyHas: [SHELL],
    });
    expect(await rahulIn([FIN_TUBE])).toMatchObject({
      selectable: true,
      why: null,
      alreadyHas: [],
    });
    // Both chosen: giving would be refused `already-given` for Shell-and-Tube, so he is marked.
    expect(await rahulIn([SHELL, FIN_TUBE])).toMatchObject({
      selectable: false,
      why: 'already-has-it',
      alreadyHas: [SHELL],
    });
    expect(await rahulIn()).toMatchObject({ selectable: true, alreadyHas: [] });

    const given = ok(
      await meera(platform).studentAccess.giveAccess({
        experimentIds: [FIN_TUBE],
        target: { kind: 'students', studentIds: [rahul] },
        expectedPlanRev: (worldOf(platform).records.plans['ACC-0107'] as AccessPlan).rev,
      }),
    );
    expect(given.map((entry) => entry.experimentId)).toEqual([FIN_TUBE]);
    expect(await rahulIn([FIN_TUBE])).toMatchObject({
      why: 'already-has-it',
      alreadyHas: [FIN_TUBE],
    });
    expect(await rahulIn([SHELL, FIN_TUBE])).toMatchObject({ alreadyHas: [SHELL, FIN_TUBE] });
  });
});

/** Independent review of Package 2B: an ended plan, a course outside access, holder registration. */
describe('Package 2B review fixes', () => {
  /** later-sample with ACC-0107 ended (its term over before the sample "today"). */
  async function endedPlan(): Promise<Platform> {
    const world = await fixtureWorld('later-sample');
    const plan = world.records.plans['ACC-0107'] as AccessPlan;
    return platformOn({
      ...world,
      records: {
        ...world.records,
        plans: {
          ...world.records.plans,
          'ACC-0107': { ...plan, endsOn: '2026-01-01' as AccessPlan['endsOn'] },
        },
      },
    });
  }

  it('IA-13 lists nothing given once the group grant’s plan has ended, as IA-14 reads it', async () => {
    const platform = await endedPlan();
    const groups = ok(await meera(platform).groups.listGroups());
    expect(groups.find((entry) => entry.group.id === GRP_0012)!.given).toEqual([]);
    const view = ok(await meera(platform).groups.getGroup(GRP_0012));
    expect(view.grantRows.map((entry) => entry.status)).toEqual(['access-ended']);
    expect(view.members.every((member) => member.standing.length === 0)).toBe(true);
  });

  it('IA-11 files students only under courses of the content access', async () => {
    const platform = await platformOn('after-setup');
    const report = ok(
      await meera(platform).people.previewStudentImport({
        fileName: 'x.csv',
        csvText: [
          HEADER,
          'GIT-2026-0601,Asha Rao,asha.rao@godavari.edu.in,B.Tech,Power Electronics,EEE ZG512',
        ].join('\n'),
      }),
    );
    expect(report.problems.map((problem) => [problem.field, problem.rule])).toEqual([
      ['courseCode', 'unknown-course'],
    ]);
  });

  it('SA-16 registerHolder refuses an e-mail another sample identity signs in with', async () => {
    const platform = await platformOn('after-setup');
    const admin = asPerson(platform, 'Arjun Mehta');
    const answer = await admin.platformRoles.registerHolder({
      role: 'vendor',
      name: 'New Vendor',
      workEmail: 'Meera.Iyer@godavari.edu.in',
      organisation: 'Northline',
    });
    expect(answer.ok ? null : answer.error).toMatchObject({
      kind: 'validation-failed',
      fieldErrors: [
        {
          field: 'workEmail',
          key: 'SA-16.workEmail.taken',
          message: 'Someone is already registered with this e-mail address',
        },
      ],
    });
  });
});
