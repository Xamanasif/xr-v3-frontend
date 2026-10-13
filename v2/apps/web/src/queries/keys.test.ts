/**
 * The approved key structure (Appendix F §4.6): `['xr', sessionKey, kind, view, params]`, with
 * `person:<id>#<nonce>` or `public:<browser-session-id>` session keys, and checked `meta.deps`.
 */
import { RECORD_KINDS, type RecordKind } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { checkedDeps, SESSION_KEY_PATTERN, xrQueryKey } from './keys';

describe('query keys', () => {
  it('are [xr, sessionKey, kind, view, params]', () => {
    expect(
      xrQueryKey('person:sa-arjun-mehta#ses-000001', 'REQ', 'list', { status: 'new' }),
    ).toEqual(['xr', 'person:sa-arjun-mehta#ses-000001', 'REQ', 'list', { status: 'new' }]);
    expect(xrQueryKey('public:bs-0a1b2c', 'EXP', 'catalogue')).toEqual([
      'xr',
      'public:bs-0a1b2c',
      'EXP',
      'catalogue',
      null,
    ]);
  });

  it('differ for two people, and for two sessions of one person', () => {
    const a = xrQueryKey('person:per-a#ses-000001', 'session', 'current');
    const b = xrQueryKey('person:per-b#ses-000002', 'session', 'current');
    const again = xrQueryKey('person:per-a#ses-000003', 'session', 'current');
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(again);
  });

  it.each([
    '',
    'per-a',
    'person:per-a',
    'person:per-a#',
    'person:#ses-1',
    'public:',
    'admin',
    'person:a b#c',
  ])('refuse the session key %j', (sessionKey) => {
    expect(SESSION_KEY_PATTERN.test(sessionKey)).toBe(false);
    expect(() => xrQueryKey(sessionKey, 'REQ', 'list')).toThrow(/is not a session key/);
  });

  it('need a view name', () => {
    expect(() => xrQueryKey('public:bs-1', 'REQ', '')).toThrow(/view name/);
  });
});

describe('meta.deps', () => {
  it('names real record kinds, at least one, none twice', () => {
    expect(checkedDeps(['REQ', 'INST'])).toEqual(['REQ', 'INST']);
    expect(Object.isFrozen(checkedDeps(['SUB']))).toBe(true);
    expect(() => checkedDeps([])).toThrow(/must declare/);
    expect(() => checkedDeps(['REQ', 'REQ'])).toThrow(/declared twice/);
    expect(() => checkedDeps(['FCM' as RecordKind])).toThrow(/not a record kind/);
    expect(checkedDeps([...RECORD_KINDS])).toHaveLength(RECORD_KINDS.length);
  });
});
