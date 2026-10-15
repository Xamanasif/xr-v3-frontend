/**
 * Phase-2 Package 2A — the Institute Admin's Student access on the sample adapter, as IA-04
 * (B2-04) and IA-05 (B2-05) read it. The one addition is `previewGiveAccess`'s `reaches`: whom each
 * planned grant reaches and how each one stands (B2-05 f2 "What will be created", f5 the group's
 * members) — the domain's `groupMemberStanding` for the grant about to be given, a wait only where
 * the licence oracle supplies one (T-06, D7), and the open overlap (OD-B2-01) as itself. A preview
 * writes nothing; every answer matches its ledger output schema.
 */
import { previewGiveAccessOutput, type ProductPorts } from '@xr/contracts/draft';
import { type ExperimentId, type GroupId, type PersonId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, fixtureWorld, personIdOf, snapshot, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const GRP_0012 = unsafeBrand<GroupId>('GRP-0012');

async function platformAt(fixture: Parameters<typeof fixtureWorld>[0]) {
  return createSamplePlatform({ world: await fixtureWorld(fixture) });
}

type Platform = Awaited<ReturnType<typeof platformAt>>;

const meera = (platform: Platform): ProductPorts => asPerson(platform, 'Meera Iyer');
const idOf = (platform: Platform, name: string) =>
  unsafeBrand<PersonId>(personIdOf(worldOf(platform), name));

describe('previewGiveAccess — whom the planned grant reaches (B2-05 f2, f5)', () => {
  it('one student: the student, can open it — and the preview writes nothing', async () => {
    const platform = await platformAt('after-setup');
    const before = JSON.stringify(snapshot(platform));
    const planned = ok(
      await meera(platform).studentAccess.previewGiveAccess({
        experimentIds: [SHELL],
        target: { kind: 'students', studentIds: [idOf(platform, 'Rahul Verma')] },
      }),
    );
    expect(previewGiveAccessOutput.safeParse(planned).success).toBe(true);
    expect(planned).toEqual([
      {
        who: 'Rahul Verma',
        experimentId: SHELL,
        formats: ['web', 'vr'],
        reaches: [
          {
            studentId: idOf(platform, 'Rahul Verma'),
            name: 'Rahul Verma',
            standing: 'can-open-it',
            individualGrantId: null,
          },
        ],
      },
    ]);
    expect(JSON.stringify(snapshot(platform))).toBe(before);
  });

  it('a group: each current member’s standing — already has it individually, inactive, can open it', async () => {
    const platform = await platformAt('after-flow-b');
    const before = JSON.stringify(snapshot(platform));
    const [planned] = ok(
      await meera(platform).studentAccess.previewGiveAccess({
        experimentIds: [SHELL],
        target: { kind: 'group', groupId: GRP_0012 },
      }),
    );
    expect(planned!.who).toBe('ME ZG523 — Sem II');
    const standings = Object.fromEntries(
      planned!.reaches.map((reach) => [reach.name, [reach.standing, reach.individualGrantId]]),
    );
    expect(standings).toEqual({
      'Rahul Verma': ['has-it-individually', 'SACC-0310'],
      'Priya Natarajan': ['can-open-it', null],
      'Arun Kumar': ['can-open-it', null],
      'Sneha Reddy': ['inactive', null],
      'Imran Shaikh': ['can-open-it', null],
      'Divya Menon': ['can-open-it', null],
      'Karthik Rao': ['can-open-it', null],
    });
    expect(JSON.stringify(snapshot(platform))).toBe(before);
  });

  it('a supplied wait is the only “waiting for a licence” (later sample: Arun Kumar; T-06, D7)', async () => {
    const platform = await platformAt('later-sample');
    const planned = ok(
      await meera(platform).studentAccess.previewGiveAccess({
        experimentIds: [SHELL],
        target: {
          kind: 'students',
          studentIds: [idOf(platform, 'Arun Kumar'), idOf(platform, 'Priya Natarajan')],
        },
      }),
    );
    expect(
      planned.map((grant) => [grant.who, grant.reaches.map((reach) => reach.standing)]),
    ).toEqual([
      ['Arun Kumar', ['waiting-for-a-licence']],
      ['Priya Natarajan', ['can-open-it']],
    ]);
  });

  it('a member whose own grant was withdrawn is the open overlap itself (OD-B2-01), never a can / can’t', async () => {
    const platform = await platformAt('after-flow-b');
    const ia = meera(platform);
    const [row] = ok(await ia.studentAccess.listGrants({ showWithdrawn: false }));
    ok(
      await ia.studentAccess.withdrawGrant({
        grantId: row!.grant.id,
        reason: 'Given individually by mistake.',
        expectedRev: row!.grant.rev,
      }),
    );
    const [planned] = ok(
      await ia.studentAccess.previewGiveAccess({
        experimentIds: [SHELL],
        target: { kind: 'group', groupId: GRP_0012 },
      }),
    );
    expect(planned!.reaches.find((reach) => reach.name === 'Rahul Verma')).toEqual({
      studentId: idOf(platform, 'Rahul Verma'),
      name: 'Rahul Verma',
      standing: { kind: 'policy-open', decision: 'OD-B2-01' },
      individualGrantId: null,
    });
  });
});

describe('the IA-04 / IA-05 refusals the screens draw', () => {
  it('a paused institution: the options are refused (B2-05 f15), the list stays readable (B2-04 f12)', async () => {
    const platform = await platformAt('later-sample');
    const kulkarni = asPerson(platform, 'S. Kulkarni');
    expect(await kulkarni.studentAccess.getGiveAccessOptions({})).toMatchObject({
      ok: false,
      error: { kind: 'refused', code: 'institution-paused' },
    });
    expect(ok(await kulkarni.studentAccess.listGrants({ showWithdrawn: true }))).toEqual([]);
  });

  it('withdrawing an individual grant beside a group grant withdraws that grant only (B2-04 f2–f4; B2-13 f8)', async () => {
    const platform = await platformAt('later-sample');
    const ia = meera(platform);
    const rows = ok(await ia.studentAccess.listGrants({ showWithdrawn: true }));
    const own = rows.find((row) => row.grant.id === 'SACC-0310')!;
    expect(own.alsoInGroupGrant).toBe('SACC-0311');
    ok(
      await ia.studentAccess.withdrawGrant({
        grantId: own.grant.id,
        reason: 'Given individually by mistake.',
        expectedRev: own.grant.rev,
      }),
    );
    const after = ok(await ia.studentAccess.listGrants({ showWithdrawn: true }));
    const rahul = after.filter((row) => row.student.fullName === 'Rahul Verma');
    expect(rahul.map((row) => [row.grant.id, row.grant.state, row.display])).toEqual([
      ['SACC-0310', 'withdrawn', 'individual-grant-withdrawn'],
      ['SACC-0311', 'active', 'active'],
    ]);
  });
});
