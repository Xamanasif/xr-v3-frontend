/**
 * The composition root (Appendix F §3.2; ADR-0002 §5): `sample` composes the committed
 * `@xr/sample-platform` adapter; `api` composes the HTTP adapter (ADR-0014) — never the sample world.
 */
import { seed } from '@xr/sample-platform';
import { afterEach, describe, expect, it, vi } from 'vitest';

const created = vi.hoisted(() => ({ count: 0 }));

vi.mock('@xr/sample-platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xr/sample-platform')>();
  return {
    ...actual,
    createSamplePlatform: (...args: Parameters<typeof actual.createSamplePlatform>) => {
      created.count += 1;
      return actual.createSamplePlatform(...args);
    },
  };
});

const { composePlatform, queryDefaultsFor, sampleOf } = await import('./composition');

afterEach(() => {
  created.count = 0;
});

describe('composePlatform', () => {
  it('TE-4: only a local prototype build (development) lets the sample stand-in confirm a payment', async () => {
    const { internalsOf } = await import('@xr/sample-platform/testing');
    const modeOf = (appEnvironment?: 'development' | 'staging' | 'production') =>
      internalsOf(
        composePlatform({ dataSource: 'sample', ...(appEnvironment ? { appEnvironment } : {}) })
          .sample,
      ).core.payments.mode;
    expect(modeOf()).toBe('confirm-on-start');
    expect(modeOf('development')).toBe('confirm-on-start');
    expect(modeOf('staging')).toBe('provider-reports');
    expect(modeOf('production')).toBe('provider-reports');
  });

  it('P4-01 (PC-60): only a local prototype build marks choice questions by the pinned key', async () => {
    const { internalsOf } = await import('@xr/sample-platform/testing');
    const modeOf = (appEnvironment?: 'development' | 'staging' | 'production') =>
      internalsOf(
        composePlatform({ dataSource: 'sample', ...(appEnvironment ? { appEnvironment } : {}) })
          .sample,
      ).core.objectiveMarks;
    expect(modeOf()).toBe('answer-key-on-submit');
    expect(modeOf('development')).toBe('answer-key-on-submit');
    expect(modeOf('staging')).toBe('supplied-only');
    expect(modeOf('production')).toBe('supplied-only');
  });

  it('sample: the committed sample adapter, its 22 ports and the memory-per-tab capability', async () => {
    const composed = composePlatform({ dataSource: 'sample' });
    expect(created.count).toBe(1);
    expect(Object.keys(composed.adapter.ports)).toHaveLength(22);
    expect(composed.capabilities).toEqual({ dataSource: 'sample', persistence: 'memory-per-tab' });
    expect(composed.sample.persistence).toBe('memory');
    // The seed is the starting world; the session starts signed out.
    expect(await composed.adapter.ports.session.getSession()).toEqual({
      ok: true,
      value: null,
      changed: [],
    });
  });

  it('starts from a supplied world (the test-hook bridge and tests only)', () => {
    const world = { ...seed(), seedId: 'supplied' };
    const composed = composePlatform({ dataSource: 'sample', world });
    expect(composed.sample.worldVersion()).toBe(world.worldVersion);
  });

  it('mints distinct command ids and binds them to the ports', () => {
    const { adapter } = composePlatform({ dataSource: 'sample' });
    const first = adapter.newCommandId();
    expect(first).not.toBe(adapter.newCommandId());
    expect(Object.keys(adapter.withCommandId(first))).toHaveLength(22);
  });

  it('api: the HTTP adapter, all 22 ports, and the sample world is never created', () => {
    const composed = composePlatform({ dataSource: 'api', apiBaseUrl: 'http://api.test' });
    expect(composed.capabilities).toEqual({ dataSource: 'api', persistence: 'server' });
    expect(composed.sample).toBeNull();
    expect(() => sampleOf(composed)).toThrow(/api data source has no sample world/);
    expect(Object.keys(composed.adapter.ports)).toHaveLength(22);
    expect(created.count).toBe(0);
  });

  it('refuses a data source outside the schema', () => {
    expect(() => composePlatform({ dataSource: 'mock' as 'sample' })).toThrow(
      /Unknown data source mock/,
    );
    expect(created.count).toBe(0);
  });
});

describe('queryDefaultsFor', () => {
  it('sample: never stale on a timer, no refetch on focus or reconnect, no retries, no network wait', () => {
    expect(queryDefaultsFor('sample')).toEqual({
      queries: {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: false,
        networkMode: 'always',
      },
      mutations: { retry: false, networkMode: 'always' },
    });
  });

  it('api: fresh for a minute, read again on reconnect; still no retries and no network wait', () => {
    expect(queryDefaultsFor('api')).toEqual({
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: false,
        networkMode: 'always',
      },
      mutations: { retry: false, networkMode: 'always' },
    });
  });
});
