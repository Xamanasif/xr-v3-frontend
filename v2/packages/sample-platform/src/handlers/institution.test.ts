/**
 * Package 1D — the Super Admin's institutions on the sample adapter, beyond the adapter-independent
 * contract cases (`institutions:*`): the spine-start world's rows as B7-02 words them, the "Needs
 * one" flag against what `assignInstituteAdmin` actually accepts, each listed student's revision
 * against its record, an assigned Institute Admin signing in with the work e-mail (the sample
 * sign-in, P1-01), and every refusal leaving the world as it was.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import { type InstitutionId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed } from '../index.js';
import { afterFlow, asPerson, visitorPorts, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const id = (text: string) => unsafeBrand<InstitutionId>(text);

describe('listInstitutions on the spine-start world (2 Oct 2026)', () => {
  it('lists the six background institutions, newest first, with their facts', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const rows = ok(
      await asPerson(platform, 'Arjun Mehta').institutions.listInstitutions({ tab: 'all' }),
    );
    expect(
      rows.map((row) => [
        row.name,
        row.kind,
        row.status,
        row.instituteAdminName,
        row.needsInstituteAdmin,
        row.accessEndsOn,
        row.plans.map((plan) => `${plan.id}:${plan.courseCount}:${plan.experimentCount}`),
        row.requestedExperimentCount,
      ]),
    ).toEqual([
      [
        'BITS Pilani — Hyderabad Campus',
        'internal',
        'access-active',
        'Dr P. Srinivas',
        false,
        '2026-10-31',
        ['ACC-0098:1:2'],
        2,
      ],
      ['Vizag Polytechnic', 'external', 'approved-payment-required', null, false, null, [], 1],
      [
        'Sahyadri Institute of Engineering',
        'external',
        'access-active',
        null,
        true,
        '2027-09-29',
        ['ACC-0102:1:1'],
        1,
      ],
      [
        'Konark Polytechnic',
        'external',
        'access-active',
        'R. Bhatt',
        false,
        '2026-11-02',
        ['ACC-0091:1:1'],
        1,
      ],
      [
        'Malnad College of Engineering',
        'external',
        'ending-soon',
        'V. Hegde',
        false,
        '2026-10-15',
        ['ACC-0079:1:1'],
        1,
      ],
      [
        'Deccan Institute of Technology',
        'external',
        'access-active',
        'S. Kulkarni',
        false,
        '2027-07-13',
        ['ACC-0085:1:1'],
        1,
      ],
    ]);
  });

  it('reads nothing it may not: every other role is refused and the world is unchanged', async () => {
    const platform = await platformAfter('C');
    const before = worldOf(platform);
    for (const name of [
      'Meera Iyer',
      'Rahul Verma',
      'Dr S. Ranganathan',
      'Anil Shetty',
      'Prof. A. Menon',
      'Kavya Nair',
    ]) {
      const ports = asPerson(platform, name);
      expect(await ports.institutions.listInstitutions({ tab: 'all' }), name).toMatchObject({
        ok: false,
        error: { kind: 'not-permitted' },
      });
      expect(await ports.institutions.getInstitution(id('godavari')), name).toMatchObject({
        ok: false,
        error: { kind: 'not-permitted' },
      });
    }
    expect(await visitorPorts(platform).institutions.listInstitutions({ tab: 'all' })).toEqual({
      ok: false,
      error: { kind: 'not-signed-in' },
    });
    expect(worldOf(platform)).toBe(before);
  });
});

async function platformAfter(flow: 'B' | 'C') {
  return createSamplePlatform({ world: await afterFlow(flow) });
}

describe('“Needs one” is exactly what assignInstituteAdmin accepts (INST-04, INST-05)', () => {
  it.each(['spine-start', 'after-flow-c'] as const)(
    'on %s, for every institution without an Institute Admin',
    async (fixture) => {
      const world = fixture === 'spine-start' ? seed() : await afterFlow('C');
      const listed = ok(
        await asPerson(
          createSamplePlatform({ world }),
          'Arjun Mehta',
        ).institutions.listInstitutions({ tab: 'all' }),
      );
      const without = listed.filter((row) => row.instituteAdminName === null);
      expect(without.length).toBeGreaterThan(0);
      for (const row of without) {
        // A fresh platform per institution: each assignment starts from the same world.
        const admin = asPerson(createSamplePlatform({ world }), 'Arjun Mehta');
        const detail = ok(await admin.institutions.getInstitution(row.id));
        const answer = await admin.institutions.assignInstituteAdmin({
          institutionId: row.id,
          name: 'A. Sample',
          workEmail: 'a.sample@example.edu.in',
          expectedRev: detail.institution.rev,
        });
        expect(answer.ok, `${row.name} (${row.status})`).toBe(row.needsInstituteAdmin);
        if (!answer.ok) {
          expect(answer.error).toEqual({ kind: 'refused', code: 'access-not-active' });
        }
      }
    },
  );
});

describe('SA-07 lists each student with the revision of its record (PC-37)', () => {
  it('takes every revision from the record itself, and a changed record answers its new one', async () => {
    const platform = await platformAfter('C');
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(id('godavari')));
    expect(detail.people.studentList.length).toBe(12);
    const people = worldOf(platform).records.people;
    for (const student of detail.people.studentList) {
      expect(student.rev, student.name).toBe(people[student.id]!.rev);
      expect(student.status, student.name).toBe(people[student.id]!.accountStatus);
    }
    const sneha = detail.people.studentList.find((student) => student.name === 'Sneha Reddy')!;
    expect(sneha.status).toBe('inactive');
    const changed = ok(
      await admin.institutions.overrideStudentStatus({
        studentId: sneha.id,
        to: 'active',
        reason: 'Re-enrolled for Sem II.',
        expectedRev: sneha.rev,
      }),
    );
    const after = ok(await admin.institutions.getInstitution(id('godavari')));
    expect(after.people.studentList.find((student) => student.id === sneha.id)).toEqual({
      ...sneha,
      status: 'active',
      rev: changed.rev,
    });
    expect(changed.rev).toBe(worldOf(platform).records.people[sneha.id]!.rev);
  });

  it('refuses a stale revision and writes nothing', async () => {
    const platform = await platformAfter('C');
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(id('godavari')));
    const rahul = detail.people.studentList.find((student) => student.name === 'Rahul Verma')!;
    const before = worldOf(platform);
    expect(
      await admin.institutions.overrideStudentStatus({
        studentId: rahul.id,
        to: 'inactive',
        reason: 'Paused his studies.',
        expectedRev: rahul.rev + 1,
      }),
    ).toEqual({ ok: false, error: { kind: 'stale-version', currentRev: rahul.rev } });
    expect(worldOf(platform)).toBe(before);
  });
});

describe('an assigned Institute Admin signs in with the work e-mail (P1-01 sample sign-in)', () => {
  async function signIn(ports: ProductPorts, email: string) {
    return ports.session.signIn({ method: 'email', email, password: 'any password' });
  }

  it('is unknown before the assignment, and the institution’s Institute Admin after it', async () => {
    const platform = await platformAfter('C');
    const email = 'n.joshi@sahyadri.edu.in';
    expect(await signIn(visitorPorts(platform), email)).toEqual({
      ok: false,
      error: { kind: 'refused', code: 'wrong-details' },
    });
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(id('sahyadri')));
    ok(
      await admin.institutions.assignInstituteAdmin({
        institutionId: id('sahyadri'),
        name: 'N. Joshi',
        workEmail: email,
        expectedRev: detail.institution.rev,
      }),
    );
    const browser = visitorPorts(platform);
    const signedIn = ok(await signIn(browser, email));
    expect(signedIn.landing).toBe('/institute');
    expect(signedIn.session).toMatchObject({
      role: 'tenant_admin',
      displayName: 'N. Joshi',
      institutionId: 'sahyadri',
      institutionName: 'Sahyadri Institute of Engineering',
    });
    // Their workspace is the Institute Admin's: the Super Admin's reads stay closed to them.
    expect(await browser.institutions.listInstitutions({ tab: 'all' })).toMatchObject({
      ok: false,
      error: { kind: 'not-permitted' },
    });
    expect(ok(await browser.session.checkWorkspace('institute'))).toBe('allowed');
    expect(await browser.session.checkWorkspace('admin')).toMatchObject({
      ok: false,
      error: { kind: 'not-permitted' },
    });
  });

  it('sees the paused banner while their institution is paused, and not after Restore', async () => {
    const platform = await platformAfter('C');
    const admin = asPerson(platform, 'Arjun Mehta');
    const email = 'n.joshi@sahyadri.edu.in';
    const detail = ok(await admin.institutions.getInstitution(id('sahyadri')));
    const assigned = ok(
      await admin.institutions.assignInstituteAdmin({
        institutionId: id('sahyadri'),
        name: 'N. Joshi',
        workEmail: email,
        expectedRev: detail.institution.rev,
      }),
    );
    const paused = ok(
      await admin.institutions.pauseInstitution({
        institutionId: id('sahyadri'),
        reason: 'Checking the student list.',
        expectedRev: assigned.rev,
      }),
    );
    const browser = visitorPorts(platform);
    ok(await browser.session.signIn({ method: 'email', email, password: 'any password' }));
    expect(ok(await browser.session.getSession())?.banners).toEqual(['institution-paused']);
    ok(
      await admin.institutions.restoreInstitution({
        institutionId: id('sahyadri'),
        reason: 'Confirmed.',
        expectedRev: paused.rev,
      }),
    );
    expect(ok(await browser.session.getSession())?.banners).toEqual([]);
  });
});

/**
 * Owner decision T-11 / P1-01, OPEN (Package 1E reproduction — no rule added, P1-08): nothing checks
 * an assigned work e-mail against the people who already sign in with it, and the sample sign-in
 * resolves an e-mail to the first holder in a fixed order — people, then Institute Admins, then role
 * holders, then Super Admins (`personIdByEmail`). These cases record what happens today; they are
 * not an accepted rule. A hosted demonstration that lets reviewers assign any e-mail is blocked on
 * this decision (`docs/phase-1/PHASE-1-HANDOVER.md`).
 */
describe('T-11 / P1-01 open: an assigned work e-mail someone already signs in with (reproduction)', () => {
  async function signIn(platform: Awaited<ReturnType<typeof platformAfter>>, email: string) {
    const answer = await visitorPorts(platform).session.signIn({
      method: 'email',
      email,
      password: 'any password',
    });
    return answer.ok
      ? {
          landing: answer.value.landing,
          role: answer.value.session.role,
          name: answer.value.session.displayName,
          institution: answer.value.session.institutionId,
        }
      : answer.error;
  }

  async function assignSahyadri(
    platform: Awaited<ReturnType<typeof platformAfter>>,
    email: string,
  ) {
    const admin = asPerson(platform, 'Arjun Mehta');
    const detail = ok(await admin.institutions.getInstitution(id('sahyadri')));
    // Accepted: the work e-mail is checked for its form only (B7-03 `doAssign`).
    return ok(
      await admin.institutions.assignInstituteAdmin({
        institutionId: id('sahyadri'),
        name: 'N. Joshi',
        workEmail: email,
        expectedRev: detail.institution.rev,
      }),
    );
  }

  const SAHYADRI_IA = {
    landing: '/institute',
    role: 'tenant_admin',
    name: 'N. Joshi',
    institution: 'sahyadri',
  };

  it('the Super Admin’s e-mail: his sample sign-in now lands as the new Institute Admin', async () => {
    const platform = await platformAfter('C');
    const email = 'arjun.mehta@wilp.example';
    expect(await signIn(platform, email)).toMatchObject({ landing: '/admin', role: 'super_admin' });
    const people = Object.keys(worldOf(platform).records.people).length;
    await assignSahyadri(platform, email);
    expect(await signIn(platform, email)).toEqual(SAHYADRI_IA);
    // No record was overwritten: the collision is the sign-in's resolution only.
    expect(Object.keys(worldOf(platform).records.people)).toHaveLength(people);
    expect(worldOf(platform).identities.superAdmins.map((admin) => admin.email)).toContain(email);
  });

  it('a role holder’s e-mail (the Content Manager): her sign-in now lands as the Institute Admin', async () => {
    const platform = await platformAfter('C');
    const email = 'kavya.nair@wilp.example';
    expect(await signIn(platform, email)).toMatchObject({ role: 'content_manager' });
    await assignSahyadri(platform, email);
    expect(await signIn(platform, email)).toEqual(SAHYADRI_IA);
  });

  it('another institution’s Institute Admin: one e-mail, two Institute Admins — only one can sign in', async () => {
    const platform = await platformAfter('C');
    const email = 'meera.iyer@godavari.edu.in';
    expect(await signIn(platform, email)).toMatchObject({
      role: 'tenant_admin',
      name: 'Meera Iyer',
      institution: 'godavari',
    });
    await assignSahyadri(platform, email);
    // The institution listed first wins: Meera Iyer now lands in Sahyadri's workspace.
    expect(await signIn(platform, email)).toEqual(SAHYADRI_IA);
  });

  it('a Student’s e-mail: the Student keeps signing in, and the new Institute Admin never can', async () => {
    const platform = await platformAfter('C');
    const email = 'rahul.verma@godavari.edu.in';
    expect(await signIn(platform, email)).toMatchObject({ role: 'student', name: 'Rahul Verma' });
    await assignSahyadri(platform, email);
    expect(await signIn(platform, email)).toMatchObject({ role: 'student', name: 'Rahul Verma' });
  });

  it('the approved demonstration’s e-mail collides with nobody on the spine-start world', async () => {
    const platform = createSamplePlatform({ world: seed() });
    expect(await signIn(platform, 'meera.iyer@godavari.edu.in')).toEqual({
      kind: 'refused',
      code: 'wrong-details',
    });
  });
});
