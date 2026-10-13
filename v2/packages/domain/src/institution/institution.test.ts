/**
 * Institution, Institute Admin assignment and access plan (Appendix C M01, M02, M05; matrix INST-*,
 * ACC-06): the stored pause, the derived status words and the term clock.
 */
import { describe, expect, it } from 'vitest';

import { calendarDate } from '../kernel/time.js';
import {
  at,
  counterIds,
  expectOk,
  institution,
  plan,
  refusalOf,
  T,
  who,
} from '../testing/fixtures.js';
import {
  accessPlanStatus,
  assignInstituteAdmin,
  institutionStatus,
  pauseInstitution,
  restoreInstitution,
} from './decide.js';
import { daysLeft, ENDING_SOON_DAYS, endedDaysAgo, planTermState, termEndsOn } from './term.js';

describe('the term clock (system:term-clock; ACC-06): derived on every read, never stored', () => {
  it('"31 Oct 2026 · 8 days left" on 23 Oct; "Ended 8 days ago" (B7-09 f4)', () => {
    const ending = plan({ endsOn: calendarDate('2026-10-31') });
    expect(daysLeft(ending, T.oct23)).toBe(8);
    expect(planTermState(ending, T.oct23)).toBe('ending-soon');
    const ended = plan({ endsOn: calendarDate('2026-10-15') });
    expect(endedDaysAgo(ended, T.oct23)).toBe(8);
    expect(planTermState(ended, T.oct23)).toBe('ended');
  });

  it('the 15-day window is inclusive and one named, provisional constant (BR-049; T-31)', () => {
    expect(ENDING_SOON_DAYS).toBe(15);
    expect(planTermState(plan({ endsOn: calendarDate('2026-11-07') }), T.oct23)).toBe(
      'ending-soon',
    ); // 15 days left
    expect(planTermState(plan({ endsOn: calendarDate('2026-11-08') }), T.oct23)).toBe('active'); // 16
  });

  it('an Ending-soon plan is live through its end date; the next day it has ended', () => {
    const lastDay = plan({ endsOn: calendarDate('2026-10-23') });
    expect(planTermState(lastDay, at('2026-10-23T18:00:00.000Z'))).toBe('ending-soon');
    expect(planTermState(lastDay, at('2026-10-24T00:00:00.000Z'))).toBe('ended');
  });

  it('"Yearly · 8 Oct 2026 to 7 Oct 2027" (B2-03); other terms read the same way', () => {
    expect(termEndsOn('yearly', calendarDate('2026-10-08'))).toBe('2027-10-07');
    expect(termEndsOn('quarterly', calendarDate('2026-10-08'))).toBe('2027-01-07');
    expect(termEndsOn('monthly', calendarDate('2026-01-31'))).toBe('2026-02-27');
    expect(termEndsOn('until-date', calendarDate('2026-10-08'), calendarDate('2027-06-30'))).toBe(
      '2027-06-30',
    );
  });
});

describe('institution status — read, not stored (Appendix C M01)', () => {
  it('awaiting payment · active · ending soon · paused · ended', () => {
    const godavari = institution();
    expect(institutionStatus(godavari, [], T.oct14)).toBe('approved-payment-required');
    expect(institutionStatus(godavari, [plan()], T.oct14)).toBe('access-active');
    expect(institutionStatus(godavari, [plan()], T.sep2027)).toBe('ending-soon');
    expect(institutionStatus(godavari, [plan()], T.oct2027)).toBe('access-ended');
    const paused = institution({
      pause: { since: T.oct12, by: who.superAdmin, reason: 'Checking the student list.' },
    });
    expect(institutionStatus(paused, [plan()], T.oct14)).toBe('access-paused');
    expect(accessPlanStatus(plan(), paused, T.oct14)).toBe('paused');
  });
});

describe('Pause / Restore (INST-07, INST-08; DL-2 with a reason kept in the history)', () => {
  const ids = counterIds();
  it('pauses an active institution; the reason is the Super Admin’s; the plan reads "Access paused by BITS"', () => {
    const outcome = expectOk(
      pauseInstitution({
        institution: institution(),
        plans: [plan()],
        reason: ' The institution asked us to pause access. ',
        actor: who.superAdmin,
        now: T.oct12,
        ids,
      }),
    );
    expect(outcome.institution.pause?.reason).toBe('The institution asked us to pause access.');
    expect(outcome.institution.history.at(-1)).toMatchObject({
      event: 'paused',
      visibleTo: ['super_admin'],
    });
    expect(outcome.plans[0]!.history.at(-1)).toMatchObject({ event: 'paused', note: null });
    // The licence figure is passed through unchanged (T-06).
    expect(outcome.plans[0]!.licences).toBe(120);
  });

  it('needs a reason; only from Access active or Ending soon; restore only when paused', () => {
    expect(
      refusalOf(
        pauseInstitution({
          institution: institution(),
          plans: [plan()],
          reason: ' ',
          actor: who.superAdmin,
          now: T.oct12,
          ids,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'reason', rule: 'required' }],
    });
    // INST-09: no status action on an awaiting-payment or ended institution.
    expect(
      refusalOf(
        pauseInstitution({
          institution: institution(),
          plans: [],
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct12,
          ids,
        }),
      ),
    ).toEqual({
      kind: 'invalid-state',
      current: 'approved-payment-required',
    });
    expect(
      refusalOf(
        pauseInstitution({
          institution: institution(),
          plans: [plan()],
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct2027,
          ids,
        }),
      ),
    ).toEqual({
      kind: 'invalid-state',
      current: 'access-ended',
    });
    expect(
      refusalOf(
        restoreInstitution({
          institution: institution(),
          plans: [plan()],
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct12,
          ids,
        }),
      ),
    ).toEqual({
      kind: 'invalid-state',
      current: 'access-active',
    });
    const paused = expectOk(
      pauseInstitution({
        institution: institution(),
        plans: [plan()],
        reason: 'x',
        actor: who.superAdmin,
        now: T.oct12,
        ids,
      }),
    );
    const restored = expectOk(
      restoreInstitution({
        institution: paused.institution,
        plans: paused.plans,
        reason: 'Checked.',
        actor: who.superAdmin,
        now: T.oct14,
        ids,
      }),
    );
    expect(institutionStatus(restored.institution, restored.plans, T.oct14)).toBe('access-active');
  });
});

describe('Assign Institute Admin (INST-04; INST-05 before activation; INST-06 replace is OPEN)', () => {
  const ids = counterIds();
  const input = {
    name: 'R. Bhatt',
    workEmail: 'r.bhatt@konark.edu.in',
    personId: 'per-bhatt' as never,
    actor: who.superAdmin,
    now: T.oct14,
    ids,
  };
  it('once access is active and none is assigned; nothing is sent', () => {
    const assigned = expectOk(
      assignInstituteAdmin({
        ...input,
        institution: institution({ instituteAdmin: null }),
        plans: [plan()],
      }),
    );
    expect(assigned.instituteAdmin).toMatchObject({
      name: 'R. Bhatt',
      workEmail: 'r.bhatt@konark.edu.in',
    });
    expect(assigned.history.at(-1)?.event).toBe('institute-admin-assigned');
  });

  it('"The Institute Admin is assigned once access is active." (B7-03 f3)', () => {
    expect(
      refusalOf(
        assignInstituteAdmin({
          ...input,
          institution: institution({ instituteAdmin: null }),
          plans: [],
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'access-not-active' });
  });

  it('also while paused; replacing an existing one is not designed', () => {
    const paused = institution({
      instituteAdmin: null,
      pause: { since: T.oct12, by: who.superAdmin, reason: 'x' },
    });
    expect(assignInstituteAdmin({ ...input, institution: paused, plans: [plan()] }).ok).toBe(true);
    expect(
      refusalOf(assignInstituteAdmin({ ...input, institution: institution(), plans: [plan()] })),
    ).toEqual({ kind: 'policy-open', decision: 'INST-06' });
  });

  it('name and a work e-mail (B7-03 script; "n.joshi@sahyadri" is the drawn invalid input)', () => {
    expect(
      refusalOf(
        assignInstituteAdmin({
          ...input,
          name: '',
          workEmail: 'n.joshi@sahyadri',
          institution: institution({ instituteAdmin: null }),
          plans: [plan()],
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'name', rule: 'required' },
        { field: 'workEmail', rule: 'email-format' },
      ],
    });
  });
});
