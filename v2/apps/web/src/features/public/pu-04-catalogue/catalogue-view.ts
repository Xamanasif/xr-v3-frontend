/**
 * PU-04's view of the catalogue (B1-04 `catView`): the address it is opened with, the facets with
 * their live counts, the removable chips, the result count and the By-area groups — computed from
 * what `CatalogueService` answered. The text search and the order are the service's
 * (`searchCatalogue`); the facets — Engineering area · Course · Format — are applied here, OR inside
 * a facet and AND across facets, as B1-04 draws them ("a reversible design choice", P1-22).
 * Nothing here decides what is published or who may see it.
 */
import type { CatalogueEntry } from '@xr/contracts/draft';
import { FORMAT_DISPLAY_ORDER, isTechnology, type Technology } from '@xr/domain';

export type CatalogueSort = 'default' | 'title-a-z' | 'course-code';
export type CatalogueLayout = 'all' | 'area';

/** What the catalogue shows: its search, filters, order and view (the address's query). */
export interface CatalogueState {
  readonly q: string;
  readonly areas: readonly string[];
  readonly courses: readonly string[];
  readonly formats: readonly Technology[];
  readonly sort: CatalogueSort;
  readonly view: CatalogueLayout;
}

export const EMPTY_STATE: CatalogueState = {
  q: '',
  areas: [],
  courses: [],
  formats: [],
  sort: 'default',
  view: 'all',
};

const SORTS: readonly CatalogueSort[] = ['default', 'title-a-z', 'course-code'];

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

/**
 * Reads `?area=&course=&format=&q=&sort=&view=` (Appendix A PU-04, state-copy `PU-04.address`).
 * An unknown order or view falls back to its default; a format that is not one of the four is
 * dropped and reported (`dropped`), as are unknown areas and courses once `known` is given.
 */
export function parseCatalogueSearch(
  search: string,
  known: { readonly areas: ReadonlySet<string>; readonly courses: ReadonlySet<string> } | null,
): { readonly state: CatalogueState; readonly dropped: boolean } {
  const params = new URLSearchParams(search);
  const formats = params.getAll('format');
  const areas = unique(params.getAll('area').filter((id) => id !== ''));
  const courses = unique(params.getAll('course').filter((id) => id !== ''));
  const keptFormats = unique(formats.filter(isTechnology));
  const keptAreas = known ? areas.filter((id) => known.areas.has(id)) : areas;
  const keptCourses = known ? courses.filter((id) => known.courses.has(id)) : courses;
  const sort = params.get('sort');
  return {
    state: {
      q: params.get('q') ?? '',
      areas: keptAreas,
      courses: keptCourses,
      formats: FORMAT_DISPLAY_ORDER.filter((format) => keptFormats.includes(format)),
      sort: SORTS.includes(sort as CatalogueSort) ? (sort as CatalogueSort) : 'default',
      view: params.get('view') === 'area' ? 'area' : 'all',
    },
    dropped:
      keptFormats.length !== unique(formats).length ||
      keptAreas.length !== areas.length ||
      keptCourses.length !== courses.length,
  };
}

/** The query that reopens this state (`''` for the defaults). */
export function catalogueSearchOf(state: CatalogueState): string {
  const params = new URLSearchParams();
  for (const id of state.areas) params.append('area', id);
  for (const id of state.courses) params.append('course', id);
  for (const format of state.formats) params.append('format', format);
  if (state.q.trim() !== '') params.set('q', state.q);
  if (state.sort !== 'default') params.set('sort', state.sort);
  if (state.view !== 'all') params.set('view', state.view);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** One area of the structure with its courses, as the structure read answers (listAreas + getArea). */
export interface StructureArea {
  readonly id: string;
  readonly name: string;
  readonly courses: readonly {
    readonly id: string;
    readonly name: string;
    readonly platformCode: string | null;
  }[];
}

export interface FacetOption {
  readonly id: string;
  readonly n: number;
  readonly checked: boolean;
}

export interface CatalogueModel {
  /** The rows that match, in the service's order. */
  readonly rows: readonly CatalogueEntry[];
  readonly facets: {
    readonly areas: readonly FacetOption[];
    readonly courses: readonly FacetOption[];
    readonly formats: readonly FacetOption[];
  };
  /** Filters set, the search included (B1-04 `nf`): the count then reads "n of total". */
  readonly filtered: boolean;
  /** Chosen facet values (B1-04 `sheetBtn` "Filters (n)"). */
  readonly chosen: number;
  /** By-area view: each area with matching rows, in Academic-structure order. */
  readonly groups: readonly {
    readonly area: StructureArea;
    readonly rows: readonly CatalogueEntry[];
  }[];
}

/** The catalogue's facets, rows and groups for this state (B1-04 `catView`). */
export function catalogueModel(
  entries: readonly CatalogueEntry[],
  structure: readonly StructureArea[],
  state: CatalogueState,
): CatalogueModel {
  const areaOfCourse = new Map<string, string>();
  for (const area of structure)
    for (const course of area.courses) areaOfCourse.set(course.id, area.id);
  const areaOf = (entry: CatalogueEntry) => areaOfCourse.get(entry.courseId) ?? null;
  type Facet = 'area' | 'course' | 'format';
  const matches = (entry: CatalogueEntry, skip: Facet | null) =>
    (skip === 'area' || state.areas.length === 0 || state.areas.includes(areaOf(entry) ?? '')) &&
    (skip === 'course' || state.courses.length === 0 || state.courses.includes(entry.courseId)) &&
    (skip === 'format' ||
      state.formats.length === 0 ||
      state.formats.some((format) => entry.availableIn.includes(format)));
  const count = (facet: Facet, test: (entry: CatalogueEntry) => boolean) =>
    entries.filter((entry) => matches(entry, facet) && test(entry)).length;
  const rows = entries.filter((entry) => matches(entry, null));
  return {
    rows,
    facets: {
      areas: structure.map((area) => ({
        id: area.id,
        n: count('area', (entry) => areaOf(entry) === area.id),
        checked: state.areas.includes(area.id),
      })),
      courses: structure.flatMap((area) =>
        area.courses.map((course) => ({
          id: course.id,
          n: count('course', (entry) => entry.courseId === course.id),
          checked: state.courses.includes(course.id),
        })),
      ),
      formats: FORMAT_DISPLAY_ORDER.map((format) => ({
        id: format,
        n: count('format', (entry) => entry.availableIn.includes(format)),
        checked: state.formats.includes(format),
      })),
    },
    filtered:
      state.areas.length + state.courses.length + state.formats.length > 0 || state.q.trim() !== '',
    chosen: state.areas.length + state.courses.length + state.formats.length,
    groups: structure
      .map((area) => ({ area, rows: rows.filter((entry) => areaOf(entry) === area.id) }))
      .filter((group) => group.rows.length > 0),
  };
}

/** Turns a facet value on or off (B1-04 `catTog`). */
export function toggled<T extends string>(values: readonly T[], value: T): readonly T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

/**
 * Where a row opens (state-copy `PU-04.format-context`): with exactly one format filter, the page
 * of B1-05 "Arrived with a format filter".
 */
export function experimentHref(experimentId: string, state: CatalogueState): string {
  const base = `/experiments/${encodeURIComponent(experimentId)}`;
  return state.formats.length === 1 ? `${base}?format=${state.formats[0]!}` : base;
}
