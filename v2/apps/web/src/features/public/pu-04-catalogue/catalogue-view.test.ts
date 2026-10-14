/**
 * PU-04's view of the catalogue (B1-04 `catView`) on the spine-start world's real answers: the
 * address it reads and writes (state-copy `PU-04.address`), the facets — OR inside a facet, AND
 * across — with their live counts, the result count words, the By-area groups and where a row
 * opens (state-copy `PU-04.format-context`).
 */
import type { CatalogueEntry } from '@xr/contracts/draft';
import { beforeAll, describe, expect, it } from 'vitest';

import { testPlatform } from '@/test-support/platform';

import {
  type CatalogueState,
  EMPTY_STATE,
  type StructureArea,
  catalogueModel,
  catalogueSearchOf,
  experimentHref,
  parseCatalogueSearch,
  toggled,
} from './catalogue-view';

let entries: readonly CatalogueEntry[];
let structure: readonly StructureArea[];

beforeAll(async () => {
  const { runtime } = await testPlatform();
  const all = await runtime.ports.catalogue.searchCatalogue({ sort: 'default' });
  const areas = await runtime.ports.catalogue.listAreas();
  if (!all.ok || !areas.ok) throw new Error('the spine-start catalogue did not answer');
  entries = all.value.entries;
  structure = await Promise.all(
    areas.value.map(async (area) => {
      const page = await runtime.ports.catalogue.getArea(area.id);
      if (!page.ok) throw new Error(`${area.id} did not answer`);
      return { id: area.id, name: area.name, courses: page.value.courses };
    }),
  );
});

const state = (patch: Partial<CatalogueState>): CatalogueState => ({ ...EMPTY_STATE, ...patch });

describe('the address (Appendix A PU-04 query; B1-04 “Arriving with a filter”)', () => {
  it('reads every key, repeated keys for several values, formats in display order', () => {
    const parsed = parseCatalogueSearch(
      '?area=mechanical-manufacturing&format=vr&format=web&q=heat&sort=course-code&view=area',
      null,
    );
    expect(parsed).toEqual({
      state: {
        q: 'heat',
        areas: ['mechanical-manufacturing'],
        courses: [],
        formats: ['web', 'vr'],
        sort: 'course-code',
        view: 'area',
      },
      dropped: false,
    });
  });

  it('“This link was adjusted”: unknown formats, areas and courses are dropped and reported', () => {
    const known = {
      areas: new Set(structure.map((area) => area.id)),
      courses: new Set(structure.flatMap((area) => area.courses.map((course) => course.id))),
    };
    expect(parseCatalogueSearch('?format=hologram&format=ar', known)).toEqual({
      state: state({ formats: ['ar'] }),
      dropped: true,
    });
    expect(parseCatalogueSearch('?area=retired-area&area=chemical-process', known)).toEqual({
      state: state({ areas: ['chemical-process'] }),
      dropped: true,
    });
    expect(parseCatalogueSearch('?course=no-such-course', known)).toEqual({
      state: EMPTY_STATE,
      dropped: true,
    });
  });

  it('an unknown order or view falls back to its default without a notice', () => {
    expect(parseCatalogueSearch('?sort=price&view=grid', null)).toEqual({
      state: EMPTY_STATE,
      dropped: false,
    });
  });

  it('writes the defaults as no key, and reads back what it wrote', () => {
    expect(catalogueSearchOf(EMPTY_STATE)).toBe('');
    const view = state({
      q: 'motor',
      areas: ['electrical-electronics'],
      courses: ['electrical-machines'],
      formats: ['vr', 'mr'],
      sort: 'title-a-z',
      view: 'area',
    });
    const search = catalogueSearchOf(view);
    expect(search).toBe(
      '?area=electrical-electronics&course=electrical-machines&format=vr&format=mr&q=motor&sort=title-a-z&view=area',
    );
    expect(parseCatalogueSearch(search, null).state).toEqual(view);
  });
});

describe('the facets (B1-04: OR inside a facet, AND across facets, live counts)', () => {
  it('with nothing chosen: every experiment, the drawn counts per option', () => {
    const model = catalogueModel(entries, structure, EMPTY_STATE);
    expect(model.rows).toHaveLength(12);
    expect(model.filtered).toBe(false);
    expect(model.facets.areas.map((option) => [option.id, option.n])).toEqual([
      ['mechanical-manufacturing', 5],
      ['electrical-electronics', 4],
      ['chemical-process', 3],
    ]);
    expect(model.facets.formats.map((option) => [option.id, option.n])).toEqual([
      ['web', 12],
      ['ar', 5],
      ['vr', 7],
      ['mr', 2],
    ]);
    expect(model.facets.courses.map((option) => option.n)).toEqual([3, 2, 3, 1, 3]);
  });

  it('an area filter (“5 of 12 experiments”) leaves the other facets counting within it', () => {
    const model = catalogueModel(
      entries,
      structure,
      state({ areas: ['mechanical-manufacturing'] }),
    );
    expect(model.rows.map((entry) => entry.name)).toEqual([
      'Shell-and-Tube Heat Exchanger',
      'Fin-Tube Bundle',
      'Composite Wall Conduction',
      'CNC Turning Centre',
      'Investment Casting',
    ]);
    expect(model.filtered).toBe(true);
    // The area facet itself still shows what each area would give (it is skipped for its own count).
    expect(model.facets.areas.map((option) => option.n)).toEqual([5, 4, 3]);
    expect(model.facets.formats.map((option) => option.n)).toEqual([5, 3, 3, 1]);
    expect(model.chosen).toBe(1);
  });

  it('two formats are OR, a format and an area are AND', () => {
    const either = catalogueModel(entries, structure, state({ formats: ['ar', 'mr'] }));
    expect(
      either.rows.every((entry) => entry.availableIn.some((f) => ['ar', 'mr'].includes(f))),
    ).toBe(true);
    expect(either.rows).toHaveLength(6);
    const both = catalogueModel(
      entries,
      structure,
      state({ formats: ['vr'], areas: ['chemical-process'] }),
    );
    expect(both.rows.map((entry) => entry.name)).toEqual([
      'Distillation Column',
      'Boiler Drum Level',
    ]);
  });

  it('By area: the matching rows under their area, in Academic-structure order, empty areas left out', () => {
    const model = catalogueModel(entries, structure, state({ formats: ['mr'], view: 'area' }));
    expect(
      model.groups.map(({ area, rows }) => [area.name, rows.map((entry) => entry.name)]),
    ).toEqual([
      ['Mechanical & Manufacturing', ['CNC Turning Centre']],
      ['Electrical & Electronics', ['Induction Motor Loading']],
    ]);
  });

  it('turns a value on and off', () => {
    expect(toggled(['web'], 'vr')).toEqual(['web', 'vr']);
    expect(toggled(['web', 'vr'], 'web')).toEqual(['vr']);
  });
});

describe('where a row opens (B1-05 “Arrived with a format filter”)', () => {
  it('with exactly one format filter, the page carries it; otherwise the plain page', () => {
    expect(experimentHref('shell-and-tube-heat-exchanger', state({ formats: ['vr'] }))).toBe(
      '/experiments/shell-and-tube-heat-exchanger?format=vr',
    );
    expect(experimentHref('shell-and-tube-heat-exchanger', state({ formats: ['vr', 'ar'] }))).toBe(
      '/experiments/shell-and-tube-heat-exchanger',
    );
    expect(experimentHref('shell-and-tube-heat-exchanger', EMPTY_STATE)).toBe(
      '/experiments/shell-and-tube-heat-exchanger',
    );
  });
});
