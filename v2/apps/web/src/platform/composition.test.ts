/**
 * The composition root (Appendix F §3.2; ADR-0002 §5): `sample` composes the committed
 * `@xr/sample-platform` adapter; `api` is refused — never answered by the sample world.
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

const { composePlatform, DataSourceUnavailableError, queryDefaultsFor } =
  await import('./composition');

afterEach(() => {
  created.count = 0;
});

describe('composePlatform', () => {
  it('TE-4: only a local prototype build (development) lets the sample stand-in confirm a payment', async () => {
    const { internalsOf } = await import('@xr/sample-platform/testing');
    const modeOf = (appEnvironment?: 'development' | 'prototype' | 'staging' | 'production') =>
      internalsOf(
        composePlatform({ dataSource: 'sample', ...(appEnvironment ? { appEnvironment } : {}) })
          .sample,
      ).core.payments.mode;
    expect(modeOf()).toBe('confirm-on-start');
    expect(modeOf('development')).toBe('confirm-on-start');
    // DP-05: in the prototype profile the payer chooses on the simulated provider page.
    expect(modeOf('prototype')).toBe('provider-reports');
    expect(modeOf('staging')).toBe('provider-reports');
    expect(modeOf('production')).toBe('provider-reports');
  });

  it('P4-01 (PC-60): only a local prototype build marks choice questions by the pinned key', async () => {
    const { internalsOf } = await import('@xr/sample-platform/testing');
    const modeOf = (appEnvironment?: 'development' | 'prototype' | 'staging' | 'production') =>
      internalsOf(
        composePlatform({ dataSource: 'sample', ...(appEnvironment ? { appEnvironment } : {}) })
          .sample,
      ).core.objectiveMarks;
    expect(modeOf()).toBe('answer-key-on-submit');
    expect(modeOf('development')).toBe('answer-key-on-submit');
    expect(modeOf('prototype')).toBe('answer-key-on-submit');
    expect(modeOf('staging')).toBe('supplied-only');
    expect(modeOf('production')).toBe('supplied-only');
  });

  it('DP-16 / DP-18: the prototype profile runs the stand-ins and keeps its own browser save; staging and production run none', async () => {
    const { internalsOf } = await import('@xr/sample-platform/testing');
    const memory = () => {
      const items = new Map<string, string>();
      return {
        items,
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => void items.set(key, value),
        removeItem: (key: string) => void items.delete(key),
      };
    };
    const compose = (
      appEnvironment: 'development' | 'prototype' | 'staging' | 'production',
      worldStorage: ReturnType<typeof memory>,
    ) =>
      composePlatform({
        dataSource: 'sample',
        appEnvironment,
        worldStorage,
        lineage: `lineage-${appEnvironment}`,
        webActivityHref: (launch) => `/prototype/web-activity?launch=${launch}`,
      });
    for (const appEnvironment of ['staging', 'production'] as const) {
      const composed = compose(appEnvironment, memory());
      const core = internalsOf(composed.sample).core;
      expect(composed.sample.persistence, appEnvironment).toBe('memory');
      expect(composed.sample.snapshot, appEnvironment).toBeNull();
      expect(composed.sample.sampleWebRuntime, appEnvironment).toBeNull();
      expect(core.resubmissionRouting, appEnvironment).toBe('seam-only');
    }
    const shared = memory();
    const local = compose('development', shared);
    expect(local.sample.persistence).toBe('browser-snapshot');
    const prototype = compose('prototype', shared);
    expect(prototype.sample.persistence).toBe('browser-snapshot');
    expect(prototype.sample.sampleWebRuntime).not.toBeNull();
    expect(internalsOf(prototype.sample).core.resubmissionRouting).toBe(
      'drawn-default-on-resubmit',
    );
    // The local build's save is not this profile's: the prototype starts clean (and saves its own).
    expect(prototype.sample.snapshot?.opened).toBe('rejected');
    expect(prototype.sample.snapshot?.rejectedBecause).toBe('another build');
    expect(compose('prototype', shared).sample.snapshot?.opened).toBe('restored');
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

  it('api: refused loudly, and the sample world is not used in its place', () => {
    expect(() => composePlatform({ dataSource: 'api' })).toThrow(DataSourceUnavailableError);
    expect(() => composePlatform({ dataSource: 'api' })).toThrow(
      /NEXT_PUBLIC_XR_DATA_SOURCE=api: no adapter is built .* not used in its place/,
    );
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

  it('api: refused (no adapter, so no defaults are invented for it)', () => {
    expect(() => queryDefaultsFor('api')).toThrow(DataSourceUnavailableError);
  });
});
