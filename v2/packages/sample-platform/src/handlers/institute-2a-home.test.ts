/**
 * Phase-2 Package 2A — the Institute Admin's home reads on the sample adapter: what IA-01
 * Overview (B2-01), IA-02 Content access (B2-02) and IA-03 Access plan (B2-03) draw beyond the
 * Phase-0 shapes — the days left in a term on the sample clock, the plan band and the per-
 * experiment rows of IA-02 ("1 student" — people, never licences), and IA-03's experiments with
 * their courses, the students given access with each grant's plan-page status, and the grants the
 * history names. Every answer matches its ledger output schema.
 */
import {
  accessPlanView,
  type AccessPlanView,
  listContentAccessOutput,
  myOverview,
  type ProductPorts,
} from '@xr/contracts/draft';
import { type AccessPlanId, type InstitutionId, type IsoInstant, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, asPersonId, fixtureWorld, setSampleNow } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const ACC_0107 = unsafeBrand<AccessPlanId>('ACC-0107');
const at = (instant: string) => unsafeBrand<IsoInstant>(instant);

async function platformAt(fixture: Parameters<typeof fixtureWorld>[0]) {
  return createSamplePlatform({ world: await fixtureWorld(fixture) });
}

async function pauseGodavari(platform: Awaited<ReturnType<typeof platformAt>>) {
  const arjun = asPerson(platform, 'Arjun Mehta');
  const detail = ok(
    await arjun.institutions.getInstitution(unsafeBrand<InstitutionId>('godavari')),
  );
  ok(
    await arjun.institutions.pauseInstitution({
      institutionId: detail.institution.id,
      reason: 'The institution asked us to pause access while it checks its student list.',
      expectedRev: detail.institution.rev,
    }),
  );
}

const meera = (platform: Awaited<ReturnType<typeof platformAt>>): ProductPorts =>
  asPerson(platform, 'Meera Iyer');

describe('getMyOverview — the days left in the status line’s plan', () => {
  it('counts the days to the end of the term on the sample clock while it is live', async () => {
    const platform = await platformAt('after-flow-b');
    const overview = ok(await meera(platform).institutions.getMyOverview());
    expect(myOverview.safeParse(overview).success).toBe(true);
    expect(overview.plan?.id).toBe('ACC-0107');
    // 12 Oct 2026 → 7 Oct 2027.
    expect(overview.planDaysLeft).toBe(360);
    setSampleNow(platform, at('2027-09-22T04:30:00.000Z'));
    const ending = ok(await meera(platform).institutions.getMyOverview());
    expect(ending.status).toBe('ending-soon');
    expect(ending.planDaysLeft).toBe(15);
    expect(ending.attention[0]).toEqual({
      kind: 'plan-ending-soon',
      planId: 'ACC-0107',
      endsOn: '2027-10-07',
      daysLeft: 15,
    });
  });

  it('is null once the term has ended (Malnad, after its 15 Oct 2026 end)', async () => {
    const platform = await platformAt('after-flow-c');
    const overview = ok(await asPersonId(platform, 'per-v-hegde').institutions.getMyOverview());
    expect(overview.status).toBe('access-ended');
    expect(overview.planDaysLeft).toBeNull();
    expect(overview.attention).toEqual([
      { kind: 'plan-ended', planId: overview.plan!.id, endedOn: overview.plan!.endsOn },
    ]);
  });
});

describe('listContentAccess — the plan band and one row per plan item (B2-02)', () => {
  it('names each experiment, its plan, its formats and the students given it now', async () => {
    const platform = await platformAt('after-setup');
    const before = ok(await meera(platform).institutions.listContentAccess());
    expect(listContentAccessOutput.safeParse(before).success).toBe(true);
    expect(before).toHaveLength(1);
    const [row] = before;
    expect(row!.plans.map((standing) => [standing.plan.id, standing.status])).toEqual([
      ['ACC-0107', 'access-active'],
    ]);
    expect(row!.plans[0]!.daysLeft).toBe(363);
    expect(row!.experiments).toEqual([
      {
        experimentId: 'shell-and-tube-heat-exchanger',
        name: 'Shell-and-Tube Heat Exchanger',
        planId: 'ACC-0107',
        formats: ['web', 'vr'],
        publishedNotInPlan: ['ar'],
        studentsGiven: 0,
      },
    ]);
  });

  it('counts people reached by active grants of that plan, never licences (later sample)', async () => {
    const flowB = await platformAt('after-flow-b');
    const given = ok(await meera(flowB).institutions.listContentAccess());
    expect(given[0]!.experiments[0]!.studentsGiven).toBe(1);
    const later = await platformAt('later-sample');
    const rows = ok(await meera(later).institutions.listContentAccess());
    const plan = ok(await meera(later).institutions.getAccessPlan(ACC_0107));
    // The same people the plan page counts: SACC-0310 + the group's members + SACC-0313/0314.
    expect(rows[0]!.experiments[0]!.studentsGiven).toBe(plan.studentsGiven);
    expect(plan.studentsGiven).toBeGreaterThan(1);
  });

  it('reads the plan as paused while the institution is paused, ending soon near its end', async () => {
    const deccan = await platformAt('after-flow-b');
    const paused = ok(await asPersonId(deccan, 'per-s-kulkarni').institutions.listContentAccess());
    expect(paused[0]!.plans[0]!.status).toBe('paused');
    const malnad = ok(await asPersonId(deccan, 'per-v-hegde').institutions.listContentAccess());
    expect(malnad[0]!.plans[0]).toMatchObject({ status: 'ending-soon', daysLeft: 3 });
  });
});

describe('getAccessPlan — what B2-03 draws (Package 2A)', () => {
  const rowsOf = (view: AccessPlanView) =>
    view.givenTo.map((row) => [
      row.grantId,
      row.student.fullName,
      row.via.kind === 'group' ? row.via.groupName : 'individually',
      row.display,
    ]);

  it('just activated: the institution, the experiment with its course, nobody given yet', async () => {
    const platform = await platformAt('after-setup');
    const view = ok(await meera(platform).institutions.getAccessPlan(ACC_0107));
    expect(accessPlanView.safeParse(view).success).toBe(true);
    expect(view.institutionName).toBe('Godavari Institute of Technology');
    expect(view.status).toBe('access-active');
    expect(view.daysLeft).toBe(363);
    expect(view.experiments).toEqual([
      {
        experimentId: 'shell-and-tube-heat-exchanger',
        name: 'Shell-and-Tube Heat Exchanger',
        course: {
          id: 'thermodynamics-heat-transfer',
          name: 'Thermodynamics & Heat Transfer',
          platformCode: 'ME ZG523',
        },
        formats: ['web', 'vr'],
        publishedNotInPlan: ['ar'],
      },
    ]);
    expect(view.givenTo).toEqual([]);
    expect(view.grants).toEqual([]);
  });

  it('after SACC-0310: Rahul, individually, active (B2-03 f1)', async () => {
    const platform = await platformAt('after-flow-b');
    const view = ok(await meera(platform).institutions.getAccessPlan(ACC_0107));
    expect(view.givenTo).toEqual([
      {
        grantId: 'SACC-0310',
        experimentId: 'shell-and-tube-heat-exchanger',
        student: { id: 'per-0002', fullName: 'Rahul Verma', institutionStudentId: 'GIT-2026-0418' },
        givenAt: '2026-10-09T04:50:00.000Z',
        via: { kind: 'student' },
        display: 'active',
      },
    ]);
    expect(view.grants).toEqual([
      {
        id: 'SACC-0310',
        experimentId: 'shell-and-tube-heat-exchanger',
        target: { kind: 'student', studentId: 'per-0002', name: 'Rahul Verma' },
      },
    ]);
  });

  it('later sample: each active grant and member, supplied waits and inactive students as such', async () => {
    const platform = await platformAt('later-sample');
    const view = ok(await meera(platform).institutions.getAccessPlan(ACC_0107));
    expect(accessPlanView.safeParse(view).success).toBe(true);
    const rows = rowsOf(view);
    expect(rows[0]).toEqual(['SACC-0310', 'Rahul Verma', 'individually', 'active']);
    expect(rows).toContainEqual([
      'SACC-0311',
      'Arun Kumar',
      'ME ZG523 — Sem II',
      'waiting-for-a-licence',
    ]);
    expect(rows).toContainEqual([
      'SACC-0311',
      'Sneha Reddy',
      'ME ZG523 — Sem II',
      'student-inactive',
    ]);
    expect(rows).toContainEqual([
      'SACC-0314',
      'Fatima Begum',
      'individually',
      'waiting-for-a-licence',
    ]);
    // The withdrawn SACC-0312 gives nobody access now, but the history still names it.
    expect(rows.some(([grant]) => grant === 'SACC-0312')).toBe(false);
    expect(view.grants.find((grant) => grant.id === 'SACC-0312')?.target).toMatchObject({
      kind: 'student',
      name: 'Nikhil Bose',
    });
    expect(view.grants.find((grant) => grant.id === 'SACC-0311')?.target).toMatchObject({
      kind: 'group',
      name: 'ME ZG523 — Sem II',
    });
  });

  it('paused: every row reads paused on the plan page (B2-03 f4)', async () => {
    const platform = await platformAt('after-flow-b');
    await pauseGodavari(platform);
    const view = ok(await meera(platform).institutions.getAccessPlan(ACC_0107));
    expect(view.status).toBe('paused');
    expect(rowsOf(view)).toEqual([['SACC-0310', 'Rahul Verma', 'individually', 'paused']]);
  });

  it('ended: access ended on every row and no days left (B2-03 f3)', async () => {
    const platform = await platformAt('after-flow-b');
    setSampleNow(platform, at('2027-10-20T04:30:00.000Z'));
    const view = ok(await meera(platform).institutions.getAccessPlan(ACC_0107));
    expect(view.status).toBe('access-ended');
    expect(view.daysLeft).toBeNull();
    expect(rowsOf(view)).toEqual([['SACC-0310', 'Rahul Verma', 'individually', 'access-ended']]);
  });

  it('another institution’s plan is not the Institute Admin’s to read', async () => {
    const platform = await platformAt('after-flow-b');
    const answer = await asPersonId(platform, 'per-s-kulkarni').institutions.getAccessPlan(
      ACC_0107,
    );
    expect(answer.ok).toBe(false);
  });
});
