/**
 * DV-1 interim (OD-B2-01 open; Appendix F §10.2; SACC-15; WP-0.9 policy) — kept apart from the
 * one-world proof on purpose: an unresolved overlap never enters a seeded Student journey. On the
 * later sample (B2-04 f1, B2-13 f8) Rahul holds his individual grant SACC-0310 and the group grant
 * SACC-0311 for the same experiment. Two active grants open the experiment (a single active grant
 * does, `canOpenFormat`). The overlap the owner has not decided is the next state B2-04 f4 draws:
 * the individual grant withdrawn while the group grant stays active. Then every gate answers
 * `policy-open` OD-B2-01 — never a default grant and never a refusal — and nothing is written by
 * that answer. Each grant shows its own state only.
 */
import { type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { assemblePlatform } from './platform/create.js';
import { EXPERIMENT } from './seed/catalogue.js';
import { asPerson, laterSample, snapshot } from './testing/index.js';

const SHELL = unsafeBrand<ExperimentId>(EXPERIMENT.shellAndTube);

function value<T>(answer: { ok: true; value: T } | { ok: false; error: unknown }): T {
  if (!answer.ok) throw new Error(JSON.stringify(answer.error));
  return answer.value;
}

describe('DV-1 interim (OD-B2-01) — an unresolved overlapping grant answers policy-open', () => {
  it('withdrawn individual grant + active group grant: Rahul’s gate and launch are policy-open OD-B2-01; nothing is decided or written', async () => {
    const platform = assemblePlatform({ world: await laterSample() });
    const rahul = asPerson(platform, 'Rahul Verma');
    const ia = asPerson(platform, 'Meera Iyer');

    const rows = value(await ia.studentAccess.listGrants({ showWithdrawn: false }));
    const own = rows.find((row) => row.grant.id === 'SACC-0310')!;
    expect(own.alsoInGroupGrant, 'B2-04 f2: Rahul is also in a group with this experiment').toBe(
      'SACC-0311',
    );
    const both = value(await rahul.learning.getFormatPage({ experimentId: SHELL, format: 'web' }));
    expect(both.gate, 'Two active grants: no overlap decision is needed').toEqual({
      canOpen: true,
      viaGrantIds: ['SACC-0310', 'SACC-0311'],
    });

    value(
      await ia.studentAccess.withdrawGrant({
        grantId: own.grant.id,
        reason: 'Given individually by mistake; the group grant covers him.',
        expectedRev: own.grant.rev,
      }),
    );
    const after = value(await ia.studentAccess.listGrants({ showWithdrawn: true }));
    expect(
      after
        .filter((row) => row.student.fullName === 'Rahul Verma')
        .map((row) => [row.grant.id, row.grant.state]),
      'B2-04 f4: the group grant is unchanged; each grant keeps its own state',
    ).toEqual(
      expect.arrayContaining([
        ['SACC-0310', 'withdrawn'],
        ['SACC-0311', 'active'],
      ]),
    );

    const before = JSON.stringify(snapshot(platform));
    const page = await rahul.learning.getFormatPage({ experimentId: SHELL, format: 'web' });
    expect(
      page.ok ? page.value.gate : page.error,
      'SACC-15: the store must not compute can-open for this case',
    ).toMatchObject({
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
    const launch = await rahul.learning.launchWebFormat({ experimentId: SHELL });
    expect(
      launch.ok ? null : launch.error,
      'Launch WEB is neither granted nor refused',
    ).toMatchObject({
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
    expect(JSON.stringify(snapshot(platform)), 'A policy-open answer writes nothing').toBe(before);
  });
});
