/**
 * Phase-2 Package 2A — People for the Institute Admin on the sample adapter (B2-06 IA-06, IA-07,
 * IA-08; B2-07 IA-10), beyond the adapter-independent `campus:*` contract cases: the named courses
 * the rows and the record carry (PC-40), each grant that reaches a student as IA-04 reads it
 * (`grantRows`: experiment, course code, inherited formats, the grant word, "Also in", a supplied
 * wait — never counted, D7), a student added through IA-10 listed at once and able to sign in by
 * the sample sign-in (which resolves people by e-mail), a faculty member added and listed, and a
 * paused institution's Institute Admin refused every People write (`institution-paused`).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { assemblePlatform } from '../platform/create.js';
import { asPersonId, fixtureWorld, type FixtureName, visitorPorts } from '../testing/index.js';

const MEERA = 'per-0001';
const RAHUL = 'per-0002';
const ARUN = 'per-0004';
const SNEHA = 'per-0005';
const NIKHIL = 'per-0012';
const KULKARNI = 'per-s-kulkarni';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

async function platformAt(fixture: FixtureName) {
  return assemblePlatform({ world: await fixtureWorld(fixture) });
}

async function as(fixture: FixtureName, personId: string): Promise<ProductPorts> {
  return asPersonId(await platformAt(fixture), personId);
}

const THERMO = {
  id: 'thermodynamics-heat-transfer',
  name: 'Thermodynamics & Heat Transfer',
  platformCode: 'ME ZG523',
};

describe('the named courses People shows (PC-40)', () => {
  it('IA-06 rows, the IA-07 record and the IA-08 rows name the course (after-setup)', async () => {
    const ia = await as('after-setup', MEERA);
    const rows = ok(await ia.people.listStudents({}));
    expect(rows).toHaveLength(12);
    for (const row of rows) expect(row.courses).toEqual([THERMO]);
    const record = ok(await ia.people.getStudent(RAHUL as never));
    expect(record.courses).toEqual([THERMO]);
    expect(record.grantRows).toEqual([]);
    const faculty = ok(await ia.people.listFaculty());
    expect(faculty.map((row) => [row.faculty.fullName, row.courses])).toEqual([
      ['Dr S. Ranganathan', [THERMO]],
      ['Dr Anita Desai', []],
      ['Prof. Ravi Shankar', []],
    ]);
  });
});

describe('IA-07 grantRows: each grant that reaches the student, as IA-04 reads it', () => {
  it('after Flow B: Rahul’s SACC-0310, individually, WEB and VR from ACC-0107, Active', async () => {
    const record = ok(await (await as('after-flow-b', MEERA)).people.getStudent(RAHUL as never));
    expect(
      record.grantRows.map((row) => [
        row.grant.id,
        row.grant.target.kind,
        row.experimentName,
        row.courseCode,
        row.formats,
        row.grant.accessPlanId,
        row.display,
        row.alsoInGroupGrant,
        row.wait,
      ]),
    ).toEqual([
      [
        'SACC-0310',
        'student',
        'Shell-and-Tube Heat Exchanger',
        'ME ZG523',
        ['web', 'vr'],
        'ACC-0107',
        'active',
        null,
        null,
      ],
    ]);
  });

  it('later sample: the overlap, a supplied wait, an inactive member and a withdrawn grant', async () => {
    const ia = await as('later-sample', MEERA);
    const rows = async (id: string) =>
      ok(await ia.people.getStudent(id as never)).grantRows.map((row) => [
        row.grant.id,
        row.display,
        row.alsoInGroupGrant,
        row.wait?.grantId ?? null,
      ]);
    // Rahul: his own grant, "Also in" the group grant — each grant keeps its own word (OD-B2-01).
    expect(await rows(RAHUL)).toEqual([
      ['SACC-0310', 'active', 'SACC-0311', null],
      ['SACC-0311', 'active', null, null],
    ]);
    // Arun: through the group, waiting for a licence — the supplied wait (T-06 / D7).
    expect(await rows(ARUN)).toEqual([['SACC-0311', 'waiting-for-a-licence', null, 'SACC-0311']]);
    // Sneha: inactive, so the group grant reads "Can’t open — inactive" on her record.
    expect(await rows(SNEHA)).toEqual([['SACC-0311', 'student-inactive', null, null]]);
    // Nikhil: his individual grant SACC-0312 withdrawn, with its reason on the grant.
    const nikhil = ok(await ia.people.getStudent(NIKHIL as never)).grantRows;
    expect(nikhil.map((row) => [row.grant.id, row.display])).toEqual([['SACC-0312', 'withdrawn']]);
    expect(nikhil[0]!.grant.withdrawal?.reason).toBe(
      'Given by mistake — Nikhil is not in ME ZG523 this semester.',
    );
  });
});

describe('IA-10 then IA-06: a person added is listed at once (no invitation, T-11)', () => {
  it('a student added with a group is listed in it, has no access yet and can sign in', async () => {
    const platform = await platformAt('after-setup');
    const ia = asPersonId(platform, MEERA);
    const added = ok(
      await ia.people.addStudent({
        fullName: 'Meenakshi Pillai',
        institutionEmail: 'meenakshi.pillai@godavari.edu.in',
        institutionStudentId: 'GIT-2026-0444',
        programme: 'B.Tech Mechanical',
        groupId: 'GRP-0012' as never,
      }),
    );
    const listed = ok(await ia.people.listStudents({ search: 'meenakshi' }));
    expect(
      listed.map((row) => [row.student.id, row.directoryStatus, row.groups, row.courses]),
    ).toEqual([[added.id, 'no-access-yet', [{ id: 'GRP-0012', name: 'ME ZG523 — Sem II' }], []]]);
    const record = ok(await ia.people.getStudent(added.id));
    expect(record.student.added.how).toBe('form');
    expect(record.student.history.map((entry) => entry.event)).toEqual(['added']);

    // The sample sign-in resolves people by e-mail: the new student signs in to their workspace.
    const visitor = visitorPorts(platform);
    const signedIn = ok(
      await visitor.session.signIn({
        method: 'email',
        email: 'meenakshi.pillai@godavari.edu.in',
        password: 'any',
      }),
    );
    expect(signedIn.session.personId).toBe(added.id);
    expect(signedIn.session.role).toBe('student');
    expect(signedIn.landing).toBe('/student');
  });

  it('the drawn uniqueness rule: an e-mail or student ID already in People (B2-07 f1)', async () => {
    const ia = await as('after-setup', MEERA);
    const taken = await ia.people.addStudent({
      fullName: 'Ananya Das',
      institutionEmail: 'rahul.verma@godavari.edu.in',
      institutionStudentId: 'GIT-2026-0418',
      programme: null,
      groupId: null,
    });
    expect(taken.ok).toBe(false);
    if (taken.ok || taken.error.kind !== 'validation-failed') throw new Error('expected fields');
    expect(taken.error.fieldErrors.map((error) => [error.field, error.message])).toEqual([
      ['institutionEmail', 'This e-mail already belongs to someone in People'],
      ['institutionStudentId', 'GIT-2026-0418 is already used by Rahul Verma'],
    ]);
    expect(taken.error.summaryTitle).toBe('2 things need fixing');
  });

  it('a faculty member added is listed on IA-08 with no courses yet', async () => {
    const ia = await as('after-setup', MEERA);
    const added = ok(
      await ia.people.addFaculty({
        fullName: 'Dr Kavitha Rao',
        institutionEmail: 'kavitha.rao@godavari.edu.in',
      }),
    );
    const faculty = ok(await ia.people.listFaculty());
    expect(faculty.find((row) => row.faculty.id === added.id)).toMatchObject({
      faculty: { fullName: 'Dr Kavitha Rao', accountStatus: 'active' },
      coursesTaught: [],
      courses: [],
    });
  });
});

describe('a paused institution’s People are read-only (B2-01 f5; one rule for every IA write)', () => {
  it('Deccan’s Institute Admin reads People but every write is refused', async () => {
    const ia = await as('after-flow-b', KULKARNI);
    expect(ok(await ia.people.listStudents({}))).toEqual([]);
    expect(ok(await ia.people.listFaculty())).toEqual([]);
    expect(ok(await ia.groups.listGroups())).toEqual([]);
    const student = await ia.people.addStudent({
      fullName: 'A. Student',
      institutionEmail: 'a.student@deccan.example',
      institutionStudentId: 'DIT-0001',
      programme: null,
      groupId: null,
    });
    expect(student).toMatchObject({
      ok: false,
      error: { kind: 'refused', code: 'institution-paused' },
    });
    const faculty = await ia.people.addFaculty({
      fullName: 'A. Teacher',
      institutionEmail: 'a.teacher@deccan.example',
    });
    expect(faculty).toMatchObject({
      ok: false,
      error: { kind: 'refused', code: 'institution-paused' },
    });
  });

  it('another institution’s student is not Deccan’s to read', async () => {
    const ia = await as('after-flow-b', KULKARNI);
    const answer = await ia.people.getStudent(RAHUL as never);
    expect(answer.ok).toBe(false);
    if (answer.ok) return;
    expect(['not-found', 'not-permitted']).toContain(answer.error.kind);
  });
});
