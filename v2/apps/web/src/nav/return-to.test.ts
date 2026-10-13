/**
 * The `returnTo` rule (ADR-0005 §5; Appendix F §5.2; AD-21 PROVISIONAL; Appendix F WP-0.13
 * acceptance 6: "a Student given /faculty/x lands on /student; //example.org and absolute URLs
 * land on the role home"), and the sign-in addresses the session gate builds.
 */
import { describe, expect, it } from 'vitest';

import { returnToFor, signInAddress } from './return-to';

describe('returnToFor — honoured only inside the signed-in role’s own base', () => {
  it.each([
    ['/student/help', '/student/help'],
    ['/student/help/reports/SUP-0213', '/student/help/reports/SUP-0213'],
    ['/student/help?x=1#top', '/student/help?x=1#top'],
    ['/student', '/student'],
    // Another workspace's address lands on the role home (acceptance 6).
    ['/faculty/x', '/student'],
    ['/admin/help', '/student'],
    // A prefix that is not the base itself.
    ['/students/help', '/student'],
    ['/student-x', '/student'],
    // Off-origin and protocol-relative addresses.
    ['//example.org', '/student'],
    ['//example.org/student/help', '/student'],
    ['https://example.org/student/help', '/student'],
    ['javascript:alert(1)', '/student'],
    ['/\\example.org/student', '/student'],
    ['\\\\example.org', '/student'],
    ['student/help', '/student'],
    ['/student/../admin/help', '/student'],
    ['/student/%2e%2e/admin', '/student'],
    ['/student/\nhelp', '/student'],
    ['', '/student'],
  ])('a Student given %j lands on %j', (requested, expected) => {
    expect(returnToFor('student', requested)).toBe(expected);
  });

  it('no address, or not a string, lands on the role home', () => {
    expect(returnToFor('super_admin', null)).toBe('/admin');
    expect(returnToFor('tenant_admin', undefined)).toBe('/institute');
  });

  it('each role keeps its own base only', () => {
    expect(returnToFor('content_manager', '/content-manager/help')).toBe('/content-manager/help');
    expect(returnToFor('content_manager', '/content/help')).toBe('/content-manager');
    expect(returnToFor('academic_reviewer', '/reviewer/help/report')).toBe('/reviewer/help/report');
    expect(returnToFor('vendor', '/student/help')).toBe('/vendor');
  });
});

describe('signInAddress', () => {
  it('a signed-out visitor keeps the address they asked for, encoded', () => {
    expect(signInAddress({ kind: 'return', path: '/student/help/reports/SUP-0213' })).toBe(
      '/sign-in?returnTo=%2Fstudent%2Fhelp%2Freports%2FSUP-0213',
    );
    expect(signInAddress({ kind: 'return', path: '/student/help?a=1&b=2' })).toBe(
      '/sign-in?returnTo=%2Fstudent%2Fhelp%3Fa%3D1%26b%3D2',
    );
  });

  it('never carries an off-origin address', () => {
    expect(signInAddress({ kind: 'return', path: '//example.org' })).toBe('/sign-in?returnTo=%2F');
  });

  it('after signing out: the XS-03 "Signed out" reason and no return address', () => {
    expect(signInAddress({ kind: 'signed-out' })).toBe('/sign-in?reason=signed-out');
  });
});
