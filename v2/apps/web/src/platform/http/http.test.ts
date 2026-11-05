/**
 * The HTTP adapter (ADR-0014) on a fake `fetch`: what each HTTP outcome becomes, the query it
 * sends, contract drift, the browser-held selection, the visitor-only session, and that every
 * port the API does not serve answers `unavailable` only.
 */
import { ledgerRows, type PortKey } from '@xr/contracts/draft';
import { type AreaId, type CourseId, type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { ContractDriftError, createHttpPlatform, type FetchLike } from './index';
import { SELECTION_STORAGE_KEY, type SelectionStorage } from './selection';

const AREA = {
  id: 'mechanical-manufacturing',
  name: 'Mechanical & Manufacturing',
  description: null,
  artworkKey: 'thermal',
  courseCount: 1,
  experimentCount: 1,
};
const ENTRY = {
  experimentId: 'shell-and-tube-heat-exchanger',
  name: 'Shell-and-Tube Heat Exchanger',
  summary: 'Derive effectiveness–NTU.',
  courseId: 'thermodynamics-heat-transfer',
  courseName: 'Thermodynamics & Heat Transfer',
  platformCode: 'ME ZG523',
  availableIn: ['web', 'vr'],
  artworkKey: null,
};
const PAGE = {
  ...ENTRY,
  description: 'A two-pass exchanger.',
  areaName: 'Mechanical & Manufacturing',
  learningOutcomes: ['Determine LMTD'],
  formats: [
    { format: 'web', howItRuns: 'In a browser.', deviceNeeds: 'Laptop' },
    { format: 'vr', howItRuns: 'On a headset.', deviceNeeds: 'Headset' },
  ],
  preview: null,
  versionLabel: null,
};

const area = (id: string) => unsafeBrand<AreaId>(id);
const course = (id: string) => unsafeBrand<CourseId>(id);
const experiment = (id: string) => unsafeBrand<ExperimentId>(id);
const SHELL = experiment(ENTRY.experimentId);

type Route = (url: URL) => { status: number; body?: unknown } | 'network-error';

function fakeFetch(route: Route): { fetch: FetchLike; seen: URL[] } {
  const seen: URL[] = [];
  return {
    seen,
    fetch: async (url) => {
      seen.push(url);
      const answer = route(url);
      if (answer === 'network-error') throw new TypeError('Failed to fetch');
      return new Response(answer.body === undefined ? 'not json' : JSON.stringify(answer.body), {
        status: answer.status,
        headers: { 'content-type': 'application/json' },
      });
    },
  };
}

function memoryStorage(initial: Record<string, string> = {}): SelectionStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const catalogueRoute: Route = (url) => {
  if (url.pathname === '/api/v1/catalogue/areas') return { status: 200, body: [AREA] };
  if (url.pathname === '/api/v1/catalogue/experiments')
    return { status: 200, body: { total: 1, entries: [ENTRY] } };
  if (url.pathname === `/api/v1/catalogue/experiments/${ENTRY.experimentId}`)
    return { status: 200, body: PAGE };
  return { status: 404, body: { status: 404 } };
};

const platform = (route: Route, storage: SelectionStorage | null = null) => {
  const http = fakeFetch(route);
  const adapter = createHttpPlatform({
    baseUrl: 'http://api.test',
    fetch: http.fetch,
    browserStorage: storage,
    now: () => Date.UTC(2026, 10, 4, 10, 0, 0),
  });
  return { ports: adapter.ports, seen: http.seen, adapter };
};

describe('CatalogueService over HTTP', () => {
  it('answers the API body, validated against the port schema', async () => {
    const { ports, seen } = platform(catalogueRoute);
    expect(await ports.catalogue.listAreas()).toEqual({ ok: true, value: [AREA], changed: [] });
    expect(seen[0]!.href).toBe('http://api.test/api/v1/catalogue/areas');
  });

  it('sends the search as the HTTP query: featured as true / false, unset filters omitted', async () => {
    const { ports, seen } = platform(catalogueRoute);
    await ports.catalogue.searchCatalogue({
      sort: 'title-a-z',
      featured: true,
      text: 'heat exchanger',
    });
    await ports.catalogue.searchCatalogue({ sort: 'default', featured: false, format: 'vr' });
    expect(Object.fromEntries(seen[0]!.searchParams)).toEqual({
      sort: 'title-a-z',
      featured: 'true',
      text: 'heat exchanger',
    });
    expect(Object.fromEntries(seen[1]!.searchParams)).toEqual({
      sort: 'default',
      featured: 'false',
      format: 'vr',
    });
  });

  it('404 and a malformed id are not found; no answer and a 5xx are unavailable', async () => {
    const { ports } = platform((url) =>
      url.pathname.endsWith('/broken')
        ? { status: 503, body: {} }
        : url.pathname.endsWith('/offline')
          ? 'network-error'
          : url.pathname.endsWith('/bad')
            ? { status: 400, body: {} }
            : { status: 404, body: {} },
    );
    expect(await ports.catalogue.getArea(area('unknown'))).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(await ports.catalogue.getCourse(course('bad'))).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(await ports.catalogue.getExperiment(experiment('broken'))).toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
    expect(await ports.catalogue.getArea(area('offline'))).toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('a path segment is encoded, never interpreted', async () => {
    const { ports, seen } = platform(() => ({ status: 404, body: {} }));
    await ports.catalogue.getExperiment(experiment('a/../b?c'));
    expect(seen[0]!.pathname).toBe('/api/v1/catalogue/experiments/a%2F..%2Fb%3Fc');
  });

  it('a body outside the published contract is drift: it throws, never shown as data', async () => {
    const { ports } = platform(() => ({ status: 200, body: [{ id: 'x' }] }));
    await expect(ports.catalogue.listAreas()).rejects.toThrow(ContractDriftError);
  });
});

describe('SelectionService in the browser (api data source)', () => {
  it('adds an experiment the catalogue has named, in a published format, and keeps it', async () => {
    const storage = memoryStorage();
    const { ports } = platform(catalogueRoute, storage);
    expect(ports.selection.add({ experimentId: SHELL, formats: ['vr'] })).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    await ports.catalogue.getExperiment(SHELL);
    const added = ports.selection.add({ experimentId: SHELL, formats: ['vr'] });
    expect(added.ok).toBe(true);
    expect(ports.selection.get().items).toEqual([
      { experimentId: SHELL, formats: ['vr'], addedAt: '2026-11-04T10:00:00.000Z' },
    ]);
    expect(JSON.parse(storage.data[SELECTION_STORAGE_KEY]!).items).toHaveLength(1);
  });

  it('refuses a format the experiment is not published in, and a second add of the same one', async () => {
    const { ports } = platform(catalogueRoute);
    await ports.catalogue.searchCatalogue({ sort: 'default' });
    const refused = ports.selection.add({ experimentId: SHELL, formats: ['mr'] });
    expect(refused.ok).toBe(false);
    if (!refused.ok)
      expect(refused.error).toMatchObject({ kind: 'refused', code: 'format-not-published' });
    expect(ports.selection.add({ experimentId: SHELL, formats: ['web'] }).ok).toBe(true);
    const again = ports.selection.add({ experimentId: SHELL, formats: ['web'] });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.kind).toBe('conflict');
  });

  it('an empty format choice is validation-failed with the drawn field, as in the mock', async () => {
    const { ports } = platform(catalogueRoute);
    await ports.catalogue.getExperiment(SHELL);
    const answer = ports.selection.add({ experimentId: SHELL, formats: [] });
    expect(answer.ok).toBe(false);
    if (!answer.ok) expect(answer.error.kind).toBe('validation-failed');
  });

  it('remove and undo; the basket survives a new page in the same browser session', async () => {
    const storage = memoryStorage();
    const first = platform(catalogueRoute, storage);
    await first.ports.catalogue.getExperiment(SHELL);
    first.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] });
    const reopened = platform(catalogueRoute, storage);
    expect(reopened.ports.selection.get().items).toHaveLength(1);
    expect(reopened.ports.selection.remove(SHELL).ok).toBe(true);
    expect(reopened.ports.selection.get().items).toEqual([]);
    expect(reopened.ports.selection.undoRemove().ok).toBe(true);
    expect(reopened.ports.selection.get().items).toHaveLength(1);
  });

  it('a stored basket that does not parse is an empty one', () => {
    const { ports } = platform(catalogueRoute, memoryStorage({ [SELECTION_STORAGE_KEY]: '{oops' }));
    expect(ports.selection.get()).toEqual({ items: [], lastRemoved: null, lastRemovedAt: null });
  });
});

describe('the rest of the api data source', () => {
  it('nobody is signed in, and signing in is unavailable (no identity yet)', async () => {
    const { ports } = platform(catalogueRoute);
    expect(await ports.session.getSession()).toEqual({ ok: true, value: null, changed: [] });
    expect(
      await ports.session.signIn({ method: 'email', email: 'a@b.test', password: 'x' }),
    ).toEqual({ ok: false, error: { kind: 'unavailable' } });
    expect(await ports.session.signOut()).toEqual({ ok: false, error: { kind: 'not-signed-in' } });
  });

  it('every method of every port the API does not serve answers unavailable, and declares it', async () => {
    const { ports, seen } = platform(catalogueRoute);
    const served = new Set<PortKey>(['catalogue', 'selection', 'session']);
    const rows = ledgerRows().filter((row) => !served.has(row.portKey));
    expect(rows).toHaveLength(170);
    for (const row of rows) {
      expect(row.errors, row.id).toContain('unavailable');
      const port = ports[row.portKey] as unknown as Record<string, (input?: unknown) => unknown>;
      expect(await port[row.method]!({}), row.id).toEqual({
        ok: false,
        error: { kind: 'unavailable' },
      });
    }
    expect(seen).toEqual([]);
  });

  it('all 22 ports are present; command ids are fresh', () => {
    const { adapter } = platform(catalogueRoute);
    expect(Object.keys(adapter.ports)).toHaveLength(22);
    expect(adapter.newCommandId()).not.toBe(adapter.newCommandId());
  });
});
