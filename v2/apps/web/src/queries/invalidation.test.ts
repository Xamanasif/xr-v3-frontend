/**
 * WP-0.12 acceptance (1): after a command whose `changed` holds INST, exactly the queries whose
 * `meta.deps` include INST are invalidated — and nothing else (Appendix F §4.6). Spy-based, on a
 * real QueryClient holding queries of several families and sessions.
 */
import { QueryClient } from '@tanstack/react-query';
import type { RecordKind, RecordRef } from '@xr/domain';
import { describe, expect, it, vi } from 'vitest';

import { queryDefaultsFor } from '@/platform/composition';

import { changedKinds, invalidateChanged } from './invalidation';
import { xrQueryKey } from './keys';

const ARJUN = 'person:sa-arjun-mehta#ses-000001';
const VISITOR = 'public:bs-test';

/** Cached queries as screens will hold them (Appendix D §1.5 examples), each with its deps. */
const CACHED: readonly { name: string; key: readonly unknown[]; deps?: readonly RecordKind[] }[] = [
  {
    name: 'SA-02 list',
    key: xrQueryKey(ARJUN, 'REQ', 'list', { status: 'new' }),
    deps: ['REQ', 'INST'],
  },
  {
    name: 'SA-03 decision',
    key: xrQueryKey(ARJUN, 'REQ', 'decision', 'REQ-0038'),
    deps: ['REQ', 'INST', 'ACC', 'EXP'],
  },
  { name: 'session', key: xrQueryKey(ARJUN, 'session', 'current'), deps: ['PER', 'INST', 'ROLE'] },
  {
    name: 'SA-07 institution',
    key: xrQueryKey(ARJUN, 'INST', 'detail', 'deccan'),
    deps: ['INST', 'ACC'],
  },
  { name: 'CM queue', key: xrQueryKey(ARJUN, 'SUB', 'queue'), deps: ['SUB'] },
  {
    name: 'FA-18 marking',
    key: xrQueryKey(ARJUN, 'ATT', 'marking-queue'),
    deps: ['ATT', 'ASMT', 'FMAP', 'SACC'],
  },
  { name: 'nav counts', key: xrQueryKey(ARJUN, 'nav-counts', 'admin'), deps: ['REQ'] },
  {
    name: 'student hub',
    key: xrQueryKey(ARJUN, 'student', 'hub', 'exp-1'),
    deps: ['SACC', 'ACC', 'PER', 'EXP', 'RES', 'RUN', 'COMP'],
  },
  {
    name: 'public catalogue',
    key: xrQueryKey(VISITOR, 'EXP', 'catalogue'),
    deps: ['EXP', 'CRS', 'AREA'],
  },
  { name: 'no meta (foreign)', key: ['other', 'thing'] },
];

function seeded(): QueryClient {
  const client = new QueryClient({ defaultOptions: queryDefaultsFor('sample') });
  for (const entry of CACHED) {
    client.getQueryCache().build(client, {
      queryKey: [...entry.key],
      ...(entry.deps ? { meta: { deps: entry.deps } } : {}),
    });
    client.setQueryData([...entry.key], { cached: entry.name });
  }
  return client;
}

const invalidated = (client: QueryClient): string[] =>
  CACHED.filter((entry) => client.getQueryState([...entry.key])?.isInvalidated).map(
    (entry) => entry.name,
  );

const ref = (kind: RecordKind, id: string): RecordRef => ({ kind, id });

describe('invalidateChanged — one function, driven by the receipt', () => {
  it('an INST receipt invalidates exactly the queries whose meta.deps include INST', async () => {
    const client = seeded();
    const spy = vi.spyOn(client, 'invalidateQueries');

    await invalidateChanged(client, [ref('INST', 'deccan')]);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(invalidated(client)).toEqual([
      'SA-02 list',
      'SA-03 decision',
      'session',
      'SA-07 institution',
    ]);
    // Negative controls: unrelated families, foreign queries and the visitor's cache stay valid.
    for (const name of [
      'CM queue',
      'FA-18 marking',
      'nav counts',
      'student hub',
      'public catalogue',
      'no meta (foreign)',
    ]) {
      expect(invalidated(client)).not.toContain(name);
    }
    // No cached answer is rewritten: invalidation marks, it never writes data (no optimistic update).
    for (const entry of CACHED) {
      expect(client.getQueryData([...entry.key])).toEqual({ cached: entry.name });
    }
  });

  it('the predicate is the meta.deps test, evaluated per cached query', async () => {
    const client = seeded();
    const spy = vi.spyOn(client, 'invalidateQueries');
    await invalidateChanged(client, [ref('INST', 'deccan'), ref('INST', 'konark')]);
    const filters = spy.mock.calls[0]?.[0];
    expect(filters && Object.keys(filters)).toEqual(['predicate']);
    const verdicts = client
      .getQueryCache()
      .getAll()
      .map((query) => [query.meta?.deps?.join(',') ?? '(none)', filters?.predicate?.(query)]);
    expect(verdicts).toContainEqual(['SUB', false]);
    expect(verdicts).toContainEqual(['(none)', false]);
    expect(verdicts).toContainEqual(['INST,ACC', true]);
  });

  it('an empty changed list invalidates nothing and does not call the client', async () => {
    const client = seeded();
    const spy = vi.spyOn(client, 'invalidateQueries');
    await invalidateChanged(client, []);
    expect(spy).not.toHaveBeenCalled();
    expect(invalidated(client)).toEqual([]);
  });

  it.each([
    [[ref('SUB', 'SUB-0077')], ['CM queue']],
    [[ref('ATT', 'ATT-0450')], ['FA-18 marking']],
    [
      [ref('REQ', 'REQ-0042'), ref('ACC', 'ACC-0107')],
      ['SA-02 list', 'SA-03 decision', 'SA-07 institution', 'nav counts', 'student hub'],
    ],
    [[ref('SUP', 'SUP-0213')], []],
  ] as const)('changed %j invalidates exactly %j', async (changed, expected) => {
    const client = seeded();
    await invalidateChanged(client, changed);
    expect(invalidated(client)).toEqual(expected);
  });

  it('reduces a receipt to its kinds, each once', () => {
    expect([...changedKinds([ref('INST', 'a'), ref('ACC', 'b'), ref('INST', 'c')])]).toEqual([
      'INST',
      'ACC',
    ]);
  });
});
