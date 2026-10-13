/**
 * Student access grants and the open gate (Appendix C M15; matrix SACC-*; Appendix D §5.3).
 * Entitlement is written only by the Institute Admin; formats come from the plan; a licence wait
 * is a supplied fact; the overlap of a withdrawn individual grant and an active group grant has no
 * default (DV-1 → policy-open).
 */
import { describe, expect, it } from 'vitest';

import {
  counterIds,
  experiment,
  expectOk,
  grant,
  group,
  ids,
  institution,
  plan,
  refusalOf,
  student,
  T,
  who,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import { calendarDate } from '../kernel/time.js';
import type { StudentAccessGrantId } from '../kernel/ids.js';
import { giveAccess, withdrawGrant } from './decide.js';
import {
  canOpenFormat,
  experimentGate,
  type GateInput,
  grantDisplayStatus,
  groupMemberStanding,
} from './gate.js';
import {
  GRANT_STATES,
  GRANT_TRANSITIONS,
  type LicenceAvailabilityOracle,
  NO_LICENCE_WAITS,
  type OverlapGrantPolicy,
  UNDECIDED_OVERLAP_POLICY,
} from './model.js';

const paused = () => institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });
const give = (overrides: Partial<Parameters<typeof giveAccess>[0]> = {}) =>
  giveAccess({
    institution: institution(),
    plan: plan(),
    experimentIds: [ids.shell],
    target: { kind: 'students', students: [student()] },
    grants: [],
    licences: NO_LICENCE_WAITS,
    actor: who.instituteAdmin,
    now: T.oct14,
    ids: counterIds(),
    ...overrides,
  });

describe('the grant machine: give (IA) and withdraw an individual grant (IA) — nothing else writes one', () => {
  it('two stored states, two drawn rows, both the Institute Admin’s', () => {
    expect(GRANT_STATES).toEqual(['active', 'withdrawn']);
    expect(GRANT_TRANSITIONS.map((row) => [row.from, row.to, row.command, row.actors])).toEqual([
      [null, 'active', 'giveAccess', ['tenant_admin']],
      ['active', 'withdrawn', 'withdrawGrant', ['tenant_admin']],
    ]);
  });
});

describe('Give students access (SACC-01, SACC-02; B2-05)', () => {
  it('one grant per student × experiment; formats are never stored on the grant (LD-1)', () => {
    const outcome = expectOk(
      give({ target: { kind: 'students', students: [student(), student({ id: ids.arun })] } }),
    );
    expect(outcome.grants.map((entry) => [entry.id, entry.target, entry.state])).toEqual([
      ['SACC-1001', { kind: 'student', studentId: ids.rahul }, 'active'],
      ['SACC-1002', { kind: 'student', studentId: ids.arun }, 'active'],
    ]);
    expect(Object.keys(outcome.grants[0]!)).not.toContain('formats');
    expect(outcome.plan.history.map((entry) => entry.event)).toEqual([
      'access-given',
      'access-given',
    ]);
    expect(outcome.students.map((entry) => entry.history.at(-1)?.event)).toEqual([
      'access-given',
      'access-given',
    ]);
    expect(outcome.plan.licences).toBe(120); // passed through, never decremented (T-06)
    expect(outcome.waits).toEqual([]);
  });

  it('a group grant is one record; members’ waits come only from the supplied oracle', () => {
    const members = [student(), student({ id: ids.arun })];
    const arunWaits: LicenceAvailabilityOracle = {
      waitFor: ({ studentId }) => (studentId === ids.arun ? { waiting: true } : null),
    };
    const outcome = expectOk(
      give({
        target: { kind: 'group', group: group([{ id: ids.rahul }, { id: ids.arun }]), members },
        licences: arunWaits,
      }),
    );
    expect(outcome.grants).toHaveLength(1);
    expect(outcome.grants[0]!.target).toEqual({ kind: 'group', groupId: ids.grp12 });
    expect(outcome.waits).toEqual([
      { grantId: outcome.grants[0]!.id, studentId: ids.arun, since: T.oct14 },
    ]);
  });

  it('the drawn refusals', () => {
    expect(refusalOf(give({ institution: paused() }))).toEqual({
      kind: 'refused',
      code: 'institution-paused',
    });
    expect(refusalOf(give({ plan: null }))).toEqual({ kind: 'refused', code: 'nothing-held' });
    expect(refusalOf(give({ now: T.oct2027 }))).toEqual({ kind: 'refused', code: 'plan-ended' });
    expect(refusalOf(give({ experimentIds: [ids.wallA] }))).toEqual({
      kind: 'refused',
      code: 'experiment-not-in-plan',
    });
    expect(
      refusalOf(
        give({ target: { kind: 'students', students: [student({ accountStatus: 'inactive' })] } }),
      ),
    ).toEqual({ kind: 'refused', code: 'student-inactive' });
    expect(refusalOf(give({ grants: [grant()] }))).toEqual({
      kind: 'refused',
      code: 'already-given',
    });
    expect(refusalOf(give({ target: { kind: 'group', group: group(), members: [] } }))).toEqual({
      kind: 'refused',
      code: 'group-empty',
    });
    expect(
      refusalOf(
        give({ target: { kind: 'students', students: [student({ institutionId: ids.konark })] } }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'out-of-scope' });
  });
});

describe('Withdraw an individual grant (SACC-07; SACC-08 group OPEN; SACC-11 after the end OPEN)', () => {
  const base = {
    grant: grant(),
    institution: institution(),
    plan: plan(),
    student: student(),
    reason: 'Moved to a different course',
    actor: who.instituteAdmin,
    now: T.oct14,
    ids: counterIds(),
  };
  it('needs a reason, kept in the access history; work is kept and nothing is counted', () => {
    const outcome = expectOk(withdrawGrant(base));
    expect(outcome.grant).toMatchObject({
      state: 'withdrawn',
      withdrawal: { reason: 'Moved to a different course' },
    });
    expect(outcome.plan.licences).toBe(120);
    expect(outcome.student.history.at(-1)).toMatchObject({
      event: 'access-withdrawn',
      note: 'Moved to a different course',
    });
    expect(refusalOf(withdrawGrant({ ...base, reason: '' }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'reason', rule: 'required' }],
    });
    expect(refusalOf(withdrawGrant({ ...base, grant: outcome.grant }))).toEqual({
      kind: 'invalid-state',
      current: 'withdrawn',
    });
  });

  it('the undecided and refused cases', () => {
    expect(
      refusalOf(
        withdrawGrant({ ...base, grant: grant({ target: { kind: 'group', groupId: ids.grp12 } }) }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'OD-B2-01' });
    expect(refusalOf(withdrawGrant({ ...base, now: T.oct2027 }))).toEqual({
      kind: 'policy-open',
      decision: 'SACC-11',
    });
    expect(refusalOf(withdrawGrant({ ...base, institution: paused() }))).toEqual({
      kind: 'refused',
      code: 'institution-paused',
    });
    expect(
      refusalOf(withdrawGrant({ ...base, student: student({ accountStatus: 'inactive' }) })),
    ).toEqual({ kind: 'refused', code: 'student-inactive' });
  });
});

describe('the open gate (experimentGate, canOpenFormat): publication × institution access × entitlement', () => {
  const gate = (overrides: Partial<GateInput> = {}): GateInput => ({
    student: student(),
    experiment: experiment(),
    institution: institution(),
    plans: [plan()],
    grants: [grant()],
    groups: [],
    waits: [],
    overlap: UNDECIDED_OVERLAP_POLICY,
    now: T.oct14,
    ...overrides,
  });

  it('opens through an active grant on a live plan', () => {
    expect(experimentGate(gate())).toEqual({ canOpen: true, viaGrantIds: [ids.sacc310] });
  });

  it('publication alone gives nothing (BC3): a published experiment with no grant is "not given"', () => {
    expect(experimentGate(gate({ grants: [] }))).toEqual({ canOpen: false, reason: 'not-given' });
    expect(experimentGate(gate({ experiment: null }))).toEqual({
      canOpen: false,
      reason: 'not-given',
    });
  });

  it('the drawn refusals (AD-27 precedence is provisional)', () => {
    expect(experimentGate(gate({ grants: [grant({ state: 'withdrawn' })] }))).toEqual({
      canOpen: false,
      reason: 'no-longer-given',
    });
    expect(experimentGate(gate({ now: T.oct2027 }))).toEqual({
      canOpen: false,
      reason: 'access-ended',
    });
    expect(experimentGate(gate({ institution: paused() }))).toEqual({
      canOpen: false,
      reason: 'institution-paused',
    });
    expect(experimentGate(gate({ student: student({ accountStatus: 'inactive' }) }))).toEqual({
      canOpen: false,
      reason: 'student-inactive',
    });
    expect(
      experimentGate(
        gate({ waits: [{ grantId: ids.sacc310, studentId: ids.rahul, since: T.oct9 }] }),
      ),
    ).toEqual({ canOpen: false, reason: 'waiting-for-a-licence' });
  });

  it('per format: published, then in the plan; "not available right now" is not designed', () => {
    expect(canOpenFormat({ ...gate(), format: 'web' }).canOpen).toBe(true);
    expect(canOpenFormat({ ...gate(), format: 'ar' })).toEqual({
      canOpen: false,
      reason: 'format-not-published',
    });
    const arToo = experiment({}, ['web', 'ar', 'vr']);
    expect(canOpenFormat({ ...gate({ experiment: arToo }), format: 'ar' })).toEqual({
      canOpen: false,
      reason: 'format-not-in-plan',
    });
    expect(canOpenFormat({ ...gate({ unavailableRightNow: ['vr'] }), format: 'vr' })).toEqual({
      canOpen: false,
      reason: 'policy-open',
      decision: 'not-designed:format-temporarily-unavailable',
    });
  });

  describe('group grants and the undecided cases', () => {
    const groupGrant = grant({
      id: ids.sacc311,
      target: { kind: 'group', groupId: ids.grp12 },
      givenAt: T.oct12,
    });
    it('a member at the time of the grant can open it', () => {
      expect(
        experimentGate(
          gate({ grants: [groupGrant], groups: [group([{ id: ids.rahul, addedAt: T.oct9 }])] }),
        ),
      ).toEqual({ canOpen: true, viaGrantIds: [ids.sacc311] });
    });

    it('a member added after the grant: OD-B2-02 is open', () => {
      expect(
        experimentGate(
          gate({ grants: [groupGrant], groups: [group([{ id: ids.rahul, addedAt: T.oct14 }])] }),
        ),
      ).toEqual({ canOpen: false, reason: 'policy-open', decision: 'OD-B2-02' });
    });

    it('a member removed after the grant: GRP-05 is open', () => {
      expect(
        experimentGate(
          gate({
            grants: [groupGrant],
            groups: [group([{ id: ids.rahul, addedAt: T.oct9, removedAt: T.oct14 }])],
          }),
        ),
      ).toEqual({ canOpen: false, reason: 'policy-open', decision: 'GRP-05' });
    });

    it('DV-1 (Phase-0 interim): a withdrawn individual grant beside an active group grant returns policy-open; the injected policy decides — all three answers', () => {
      const overlap = (answer: ReturnType<OverlapGrantPolicy['resolve']>): OverlapGrantPolicy => ({
        resolve: () => answer,
      });
      const world = {
        grants: [grant({ state: 'withdrawn' }), groupGrant],
        groups: [group([{ id: ids.rahul, addedAt: T.oct9 }])],
      };
      expect(experimentGate(gate({ ...world, overlap: UNDECIDED_OVERLAP_POLICY }))).toEqual({
        canOpen: false,
        reason: 'policy-open',
        decision: 'OD-B2-01',
      });
      expect(experimentGate(gate({ ...world, overlap: overlap('closed') }))).toEqual({
        canOpen: false,
        reason: 'no-longer-given',
      });
      expect(experimentGate(gate({ ...world, overlap: overlap('open') }))).toEqual({
        canOpen: true,
        viaGrantIds: [ids.sacc311],
      });
    });
  });
});

describe('the Institute Admin’s words (B2-03, B2-04, B2-08)', () => {
  const display = (overrides: Partial<Parameters<typeof grantDisplayStatus>[0]> = {}) =>
    grantDisplayStatus({
      grant: grant(),
      student: student(),
      plan: plan(),
      institution: institution(),
      waits: [],
      alsoInActiveGroupGrant: false,
      screen: 'student-access',
      now: T.oct14,
      ...overrides,
    });

  it('per grant', () => {
    expect(display()).toBe('active');
    expect(display({ grant: grant({ state: 'withdrawn' }) })).toBe('withdrawn');
    expect(display({ grant: grant({ state: 'withdrawn' }), alsoInActiveGroupGrant: true })).toBe(
      'individual-grant-withdrawn',
    );
    expect(display({ institution: paused(), screen: 'plan-page' })).toBe('paused');
    expect(display({ institution: paused() })).toBe('active'); // IA-04 keeps the grant's own word
    expect(display({ plan: plan({ endsOn: calendarDate('2026-10-13') }) })).toBe('access-ended');
    expect(display({ student: student({ accountStatus: 'inactive' }) })).toBe('student-inactive');
    expect(
      display({ waits: [{ grantId: ids.sacc310, studentId: ids.rahul, since: T.oct9 }] }),
    ).toBe('waiting-for-a-licence');
  });

  it('per group member', () => {
    const groupGrant = grant({
      id: unsafeBrand<StudentAccessGrantId>('SACC-0311'),
      target: { kind: 'group', groupId: ids.grp12 },
      givenAt: T.oct12,
    });
    const membership = group([{ id: ids.rahul, addedAt: T.oct9 }]).memberships[0]!;
    const standing = (overrides: Partial<Parameters<typeof groupMemberStanding>[0]> = {}) =>
      groupMemberStanding({
        membership,
        student: student(),
        groupGrant,
        individualGrant: null,
        waits: [],
        ...overrides,
      });
    expect(standing()).toBe('can-open-it');
    expect(standing({ individualGrant: grant() })).toBe('has-it-individually');
    expect(standing({ membership: { ...membership, addedAt: T.oct14 } })).toBe(
      'added-after-the-group-grant',
    );
    expect(standing({ student: student({ accountStatus: 'inactive' }) })).toBe('inactive');
    expect(
      standing({ waits: [{ grantId: groupGrant.id, studentId: ids.rahul, since: T.oct12 }] }),
    ).toBe('waiting-for-a-licence');
    // The overlap (OD-B2-01; SACC-15): no word that would compute can-open.
    expect(standing({ individualGrant: grant({ state: 'withdrawn' }) })).toEqual({
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
  });
});
