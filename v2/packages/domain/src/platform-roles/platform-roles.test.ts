/**
 * Platform role holders and scopes (Appendix C M25; matrix ROLE-*): registered with no scope; scope
 * decides what they act on; withdrawals are kept; a Vendor's non-course scope is not drawn
 * (ROLE-11 OPEN). Sessions (M26; SES-*): one role per person, banners derived on every read.
 */
import { describe, expect, it } from 'vitest';

import {
  counterIds,
  expectOk,
  holder,
  ids,
  institution,
  refusalOf,
  T,
  who,
} from '../testing/fixtures.js';
import { PLATFORM_ROLES } from '../roles.js';
import { shellBanner, signInOutcome } from '../session/session.js';
import {
  activeScopes,
  assignScope,
  registerHolder,
  restoreScope,
  scopeCovers,
  vendorCourses,
  withdrawScope,
} from './platform-roles.js';

const sa = () => ({ actor: who.superAdmin, now: T.oct14, ids: counterIds() });

describe('platform role holders (ROLE-01 … ROLE-14)', () => {
  it('registered with no scope; nothing is sent; work e-mails are unique', () => {
    const registered = expectOk(
      registerHolder({
        ...sa(),
        holders: [holder('vendor')],
        role: 'academic_reviewer',
        name: 'Dr P. Rao',
        workEmail: 'p.rao@bits.example.org',
        organisation: 'BITS Pilani',
        personId: 'per-rao' as never,
      }),
    );
    expect(registered.scopes).toEqual([]);
    expect(
      refusalOf(
        registerHolder({
          ...sa(),
          holders: [holder('vendor')],
          role: 'vendor',
          name: '',
          workEmail: 'ANIL.SHETTY@example.org',
          organisation: ' ',
          personId: 'per-x' as never,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'name', rule: 'required' },
        { field: 'workEmail', rule: 'taken' },
        { field: 'organisation', rule: 'required' },
      ],
    });
  });

  it('assign, withdraw (reason kept), restore — the withdrawn row is superseded, never deleted', () => {
    const reviewer = holder('academic_reviewer', []);
    const assigned = expectOk(
      assignScope({ ...sa(), holder: reviewer, target: { kind: 'course', courseId: ids.course } }),
    );
    expect(scopeCovers(assigned, { courseId: ids.course })).toBe(true);
    expect(
      refusalOf(
        assignScope({
          ...sa(),
          holder: assigned,
          target: { kind: 'course', courseId: ids.course },
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'target', rule: 'already-in-scope' }],
    });
    const scopeId = assigned.scopes[0]!.id;
    const withdrawn = expectOk(
      withdrawScope({ ...sa(), holder: assigned, scopeId, reason: 'Moved to another programme' }),
    );
    expect(scopeCovers(withdrawn, { courseId: ids.course })).toBe(false);
    expect(withdrawn.scopes[0]!.withdrawal?.reason).toBe('Moved to another programme');
    const restored = expectOk(restoreScope({ ...sa(), holder: withdrawn, scopeId }));
    expect(restored.scopes).toHaveLength(2);
    expect(restored.scopes[0]!.supersededAt).toBe(T.oct14);
    expect(activeScopes(restored).map((scope) => scope.target)).toEqual([
      { kind: 'course', courseId: ids.course },
    ]);
    expect(restored.history.map((entry) => entry.event)).toEqual([
      'scope-assigned',
      'scope-withdrawn',
      'scope-restored',
    ]);
  });

  it('"All experiments" covers everything; a Vendor’s non-course scope is not drawn (ROLE-11)', () => {
    expect(
      scopeCovers(holder('content_manager', [{ kind: 'all' }]), { courseId: ids.course2 }),
    ).toBe(true);
    expect(
      scopeCovers(holder('academic_reviewer', [{ kind: 'experiment', experimentId: ids.shell }]), {
        courseId: ids.course2,
        experimentId: ids.shell,
      }),
    ).toBe(true);
    expect(expectOk(vendorCourses(holder('vendor')))).toEqual([ids.course]);
    expect(refusalOf(vendorCourses(holder('vendor', [{ kind: 'all' }])))).toEqual({
      kind: 'policy-open',
      decision: 'ROLE-11',
    });
  });
});

describe('sessions (SES-01 … SES-10): seven roles, one per person; Public is a surface, not a role', () => {
  it('seven roles and no public role', () => {
    expect(PLATFORM_ROLES).toHaveLength(7);
    expect(PLATFORM_ROLES as readonly string[]).not.toContain('public');
  });

  it('banners are derived: paused institution for tenant roles; inactive account for a Student', () => {
    const paused = institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });
    expect(shellBanner({ role: 'faculty', institution: paused, accountStatus: 'active' })).toBe(
      'institution-paused',
    );
    expect(shellBanner({ role: 'student', institution: paused, accountStatus: 'inactive' })).toBe(
      'account-inactive',
    );
    expect(shellBanner({ role: 'vendor', institution: paused, accountStatus: null })).toBeNull();
    expect(
      signInOutcome({ role: 'tenant_admin', accountStatus: null, institution: paused }),
    ).toEqual({ kind: 'signed-in', banner: 'institution-paused' });
    expect(
      signInOutcome({ role: 'student', accountStatus: 'inactive', institution: institution() }),
    ).toEqual({ kind: 'signed-in', banner: 'account-inactive' });
    expect(
      signInOutcome({ role: 'faculty', accountStatus: 'inactive', institution: institution() }),
    ).toEqual({ kind: 'policy-open', decision: 'SES-09' });
  });
});
