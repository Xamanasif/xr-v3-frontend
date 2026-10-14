'use client';

import type { Technology } from '@xr/domain';
import { Button, Icon, Link } from '@xr/ui';
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import {
  AREAS,
  CATALOGUE,
  VIEW_AREA,
  areaChip,
  courseChip,
  courseLine,
  experimentsWords,
  filtersButtonWords,
  formatChip,
  formatFacetWords,
  removeChipLabel,
  resultCountWords,
  searchChip,
  showCountWords,
} from '@/copy/public';
import { DocumentTitle } from '@/features/shared/document-title';
import { useAppNavigation } from '@/nav/navigation';
import { usePublicCatalogue, usePublicStructure } from '@/queries/catalogue';
import { useSelection } from '@/queries/selection';

import { PublicMain } from '../shell/public-frame';
import { FilterSheet } from '../shell/filter-sheet';
import { ExperimentRow } from '../shared/experiment-row';
import { Crumbs, EmptyBlock, FailedBlock } from '../shared/blocks';
import {
  type CatalogueState,
  type FacetOption,
  type StructureArea,
  catalogueModel,
  catalogueSearchOf,
  experimentHref,
  parseCatalogueSearch,
  toggled,
} from './catalogue-view';

/**
 * PU-04 Catalogue (B1-04; Appendix A PU-04 `/experiments?area=&course=&format=&q=&sort=&view=`):
 * one row per published experiment, searched by the catalogue service, filtered by Engineering
 * area · Course · Format with live counts, sorted, shown All or By area. The address carries the
 * view (state-copy `PU-04.address`): an arriving filter is a normal removable chip, and an
 * unknown one is dropped with "We adjusted this link". Rows already in the visitor's selection
 * say so (B1-04 "Selection marker"). Below 1024 px the filters move into the sheet (PF-05).
 */
export function Catalogue() {
  const navigation = useAppNavigation();
  const structure = usePublicStructure();
  const areas: readonly StructureArea[] | null = useMemo(
    () =>
      structure.data?.ok
        ? structure.data.value.map(({ area, courses }) => ({
            id: area.id,
            name: area.name,
            courses: courses.map((course) => ({
              id: course.id,
              name: course.name,
              platformCode: course.platformCode,
            })),
          }))
        : null,
    [structure.data],
  );
  const total = useMemo(
    () =>
      structure.data?.ok
        ? structure.data.value.reduce((sum, { area }) => sum + area.experimentCount, 0)
        : null,
    [structure.data],
  );

  // The view lives here while the page is on show; the address mirrors it (no history entry). An
  // address that differs from the view came from outside (the browser's Back): it is read again.
  const [state, setState] = useState<CatalogueState>(
    () => parseCatalogueSearch(navigation.search, null).state,
  );
  const [adjusted, setAdjusted] = useState(
    () => parseCatalogueSearch(navigation.search, null).dropped,
  );
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    if (navigation.search !== catalogueSearchOf(state)) {
      const parsed = parseCatalogueSearch(navigation.search, null);
      setState(parsed.state);
      setAdjusted(parsed.dropped);
    }
  }

  // Once the areas and courses are known, values that name none of them are dropped (B1-04
  // "This link was adjusted": "Unknown or retired filter values are dropped, the rest still apply").
  if (areas) {
    const knownAreas = new Set(areas.map((area) => area.id));
    const knownCourses = new Set(areas.flatMap((area) => area.courses.map((course) => course.id)));
    const keptAreas = state.areas.filter((id) => knownAreas.has(id));
    const keptCourses = state.courses.filter((id) => knownCourses.has(id));
    if (keptAreas.length !== state.areas.length || keptCourses.length !== state.courses.length) {
      setState({ ...state, areas: keptAreas, courses: keptCourses });
      setAdjusted(true);
    }
  }

  const { pathname, search: currentSearch, replace } = navigation;
  useEffect(() => {
    const search = catalogueSearchOf(state);
    if (search !== currentSearch) replace(`${pathname}${search}`);
  }, [state, pathname, currentSearch, replace]);

  const catalogue = usePublicCatalogue({
    text: state.q,
    areaId: null,
    featured: false,
    sort: state.sort,
  });
  const { selection } = useSelection();
  const selected = useMemo(
    () => new Set(selection.items.map((item) => item.experimentId as string)),
    [selection],
  );

  const entries = catalogue.data?.ok ? catalogue.data.value.entries : null;
  const model = useMemo(
    () => (entries && areas ? catalogueModel(entries, areas, state) : null),
    [entries, areas, state],
  );
  const failed = structure.isError || catalogue.isError;
  const loading = !failed && (!model || total === null);

  // The count is announced (`span.xp-count role=status`) once the rows it counts are on show
  // (B1-04 Loading: "the count is announced when results arrive"); while a new search loads, the
  // rows on show are the previous answer's (`keepPrevious`), so the count keeps its last words.
  const settledCount =
    !model || total === null || failed
      ? ''
      : catalogue.isPlaceholderData
        ? null
        : resultCountWords(model.rows.length, total, model.filtered);
  const [countWords, setCountWords] = useState('');
  if (settledCount !== null && settledCount !== countWords) setCountWords(settledCount);

  const [panelOpen, setPanelOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filtersButton = useRef<HTMLButtonElement | null>(null);
  const search = useRef<HTMLInputElement | null>(null);
  const status = useRef<HTMLDivElement | null>(null);
  const returnToFilters = useCallback(() => filtersButton.current, []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // A removed chip or "Clear all filters" takes its button away: once the page has updated, focus
  // moves to the chip now in that place, else the search field (as @xr/ui ListToolbar's chips do).
  const setRescue = (index: number) => {
    window.setTimeout(() => {
      const buttons = status.current?.querySelectorAll<HTMLButtonElement>('.xr-fchip button');
      const next = buttons?.[Math.min(index, buttons.length - 1)];
      (next ?? search.current)?.focus();
    }, 0);
  };

  const update = (patch: Partial<CatalogueState>) =>
    setState((current) => ({ ...current, ...patch }));
  const clearAll = () => {
    update({ q: '', areas: [], courses: [], formats: [] });
    setAdjusted(false);
  };

  const ids = useId();
  const facetGroups = (suffix: string) =>
    areas && model ? (
      <FacetGroups
        areas={areas}
        model={model}
        idPrefix={`${ids}${suffix}`}
        onArea={(id) => update({ areas: toggled(state.areas, id) })}
        onCourse={(id) => update({ courses: toggled(state.courses, id) })}
        onFormat={(format) => update({ formats: toggled(state.formats, format) })}
      />
    ) : null;

  const chips = model && areas ? chipsOf(state, areas) : [];

  return (
    <>
      <DocumentTitle title={CATALOGUE.title} />
      <PublicMain>
        <div className="xp-phead xp-phead--white pb-8">
          <div className="xp-in">
            <Crumbs trail={[{ label: AREAS.crumbHome, href: '/' }, { label: CATALOGUE.crumb }]} />
            <div className="xp-phead-main">
              <span className="xp-eyebrow">{CATALOGUE.eyebrow}</span>
              <h1 className="xp-h1">{CATALOGUE.title}</h1>
              <p className="xp-lead">{CATALOGUE.lead}</p>
            </div>
          </div>
        </div>
        <div className="xp-page pt-7">
          <div className="xp-in">
            {adjusted ? (
              <div className="mb-5">
                <div className="xr-notice" role="status">
                  <Icon name="info" />
                  <div className="xr-notice-body">
                    <span className="xr-notice-title">{CATALOGUE.adjustedTitle}</span>
                    <span>{CATALOGUE.adjustedLine}</span>
                    <div className="xr-notice-actions">
                      <button
                        type="button"
                        className="xr-btn xr-btn--text min-h-8 p-0"
                        onClick={() => {
                          setAdjusted(false);
                          search.current?.focus();
                        }}
                      >
                        {CATALOGUE.dismiss}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <div className="xr-seg" role="group" aria-label={CATALOGUE.view}>
                <button
                  type="button"
                  aria-pressed={state.view === 'all'}
                  onClick={() => update({ view: 'all' })}
                >
                  {CATALOGUE.viewAll}
                </button>
                <button
                  type="button"
                  aria-pressed={state.view === 'area'}
                  onClick={() => update({ view: 'area' })}
                >
                  {CATALOGUE.viewByArea}
                </button>
              </div>
              <button
                type="button"
                className="xr-btn xr-btn--text xp-filter-toggle"
                aria-expanded={panelOpen}
                aria-controls={`${ids}filters`}
                onClick={() => setPanelOpen((open) => !open)}
              >
                <Icon name="filter" />
                {panelOpen ? CATALOGUE.hideFilters : CATALOGUE.showFilters}
              </button>
            </div>
            <div className={panelOpen ? 'xp-cat' : 'xp-cat is-collapsed'}>
              <aside className="xp-filters" id={`${ids}filters`} aria-label={CATALOGUE.filters}>
                <div className="xp-filters-head">
                  <h2 className="xp-filters-title">{CATALOGUE.filters}</h2>
                  {chips.length > 0 ? (
                    <button
                      type="button"
                      className="xr-btn xr-btn--text min-h-8"
                      onClick={() => {
                        clearAll();
                        setRescue(0);
                      }}
                    >
                      {CATALOGUE.clearAll}
                    </button>
                  ) : null}
                </div>
                {facetGroups('')}
                <p className="xr-caption">{CATALOGUE.applyNote}</p>
              </aside>
              <div className="xr-content">
                <div className="xr-toolbar">
                  <div className="xr-field xr-toolbar-search">
                    <label className="xr-label" htmlFor={`${ids}q`}>
                      {CATALOGUE.searchLabel}
                    </label>
                    <div className="xr-search">
                      <Icon name="search" />
                      <input
                        ref={search}
                        id={`${ids}q`}
                        className="xr-input"
                        type="search"
                        placeholder={CATALOGUE.searchPlaceholder}
                        value={state.q}
                        onChange={(event) => update({ q: event.target.value })}
                      />
                    </div>
                  </div>
                  <div className="xr-field">
                    <label className="xr-label" htmlFor={`${ids}sort`}>
                      {CATALOGUE.sortLabel}
                    </label>
                    <div className="xr-select-wrap">
                      <select
                        id={`${ids}sort`}
                        className="xr-select"
                        value={state.sort}
                        onChange={(event) =>
                          update({ sort: event.target.value as CatalogueState['sort'] })
                        }
                      >
                        <option value="default">{CATALOGUE.sortDefault}</option>
                        <option value="title-a-z">{CATALOGUE.sortTitle}</option>
                        <option value="course-code">{CATALOGUE.sortCode}</option>
                      </select>
                      <Icon name="chevronDown" />
                    </div>
                  </div>
                  <button
                    ref={filtersButton}
                    type="button"
                    className="xr-btn xr-btn--secondary xp-filter-btn"
                    aria-haspopup="dialog"
                    onClick={() => setSheetOpen(true)}
                  >
                    <Icon name="filter" />
                    {filtersButtonWords(model?.chosen ?? 0)}
                  </button>
                </div>
                <div className="xr-toolbar-status" ref={status}>
                  <span className="xp-count" role="status">
                    {settledCount ?? countWords}
                  </span>
                  {chips.map((chip, index) => (
                    <span className="xr-fchip" key={chip.key}>
                      {chip.label}
                      <button
                        type="button"
                        aria-label={removeChipLabel(chip.label)}
                        onClick={() => {
                          update(chip.remove(state));
                          setRescue(index);
                        }}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </span>
                  ))}
                  {chips.length > 0 ? (
                    <button
                      type="button"
                      className="xr-btn xr-btn--text"
                      onClick={() => {
                        clearAll();
                        setRescue(0);
                      }}
                    >
                      {CATALOGUE.clearAllFilters}
                    </button>
                  ) : null}
                </div>
                <Results
                  model={model}
                  areas={areas}
                  state={state}
                  selected={selected}
                  loading={loading}
                  failed={failed}
                  onRetry={() => {
                    if (structure.isError) void structure.refetch();
                    if (catalogue.isError) void catalogue.refetch();
                  }}
                  onClear={() => {
                    clearAll();
                    setRescue(0);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </PublicMain>
      <FilterSheet
        open={sheetOpen}
        title={CATALOGUE.filters}
        closeLabel={CATALOGUE.closeFilters}
        onClose={closeSheet}
        returnFocusTo={returnToFilters}
        foot={
          <>
            <Button variant="secondary" onClick={clearAll}>
              {CATALOGUE.clearAll}
            </Button>
            <Button variant="primary" onClick={closeSheet}>
              {showCountWords(model?.rows.length ?? 0)}
            </Button>
          </>
        }
      >
        {facetGroups('-s')}
      </FilterSheet>
    </>
  );
}

interface Chip {
  readonly key: string;
  readonly label: string;
  readonly remove: (state: CatalogueState) => Partial<CatalogueState>;
}

/** B1-04 `chips`: areas, courses, formats, then the search. */
function chipsOf(state: CatalogueState, areas: readonly StructureArea[]): readonly Chip[] {
  const chips: Chip[] = [];
  for (const id of state.areas) {
    const area = areas.find((candidate) => candidate.id === id);
    if (area)
      chips.push({
        key: `area-${id}`,
        label: areaChip(area.name),
        remove: (current) => ({ areas: toggled(current.areas, id) }),
      });
  }
  for (const id of state.courses) {
    const course = areas.flatMap((area) => area.courses).find((candidate) => candidate.id === id);
    if (course)
      chips.push({
        key: `course-${id}`,
        label: courseChip(course.platformCode, course.name),
        remove: (current) => ({ courses: toggled(current.courses, id) }),
      });
  }
  for (const format of state.formats)
    chips.push({
      key: `format-${format}`,
      label: formatChip(format),
      remove: (current) => ({ formats: toggled(current.formats, format) }),
    });
  if (state.q.trim() !== '')
    chips.push({ key: 'search', label: searchChip(state.q), remove: () => ({ q: '' }) });
  return chips;
}

function FacetGroups({
  areas,
  model,
  idPrefix,
  onArea,
  onCourse,
  onFormat,
}: {
  readonly areas: readonly StructureArea[];
  readonly model: ReturnType<typeof catalogueModel>;
  readonly idPrefix: string;
  readonly onArea: (id: string) => void;
  readonly onCourse: (id: string) => void;
  readonly onFormat: (format: Technology) => void;
}) {
  const courses = areas.flatMap((area) => area.courses);
  const labelOf = {
    area: (id: string) => areas.find((area) => area.id === id)?.name ?? id,
    course: (id: string) => {
      const course = courses.find((candidate) => candidate.id === id);
      return course ? courseLine(course.platformCode, course.name) : id;
    },
  };
  return (
    <>
      <Facet
        legend={CATALOGUE.facetArea}
        options={model.facets.areas}
        idPrefix={`${idPrefix}-area`}
        label={labelOf.area}
        onToggle={onArea}
      />
      <Facet
        legend={CATALOGUE.facetCourse}
        options={model.facets.courses}
        idPrefix={`${idPrefix}-course`}
        label={labelOf.course}
        onToggle={onCourse}
      />
      <Facet
        legend={CATALOGUE.facetFormat}
        options={model.facets.formats}
        idPrefix={`${idPrefix}-format`}
        label={(id) => formatFacetWords(id as Technology)}
        onToggle={(id) => onFormat(id as Technology)}
      />
    </>
  );
}

function Facet({
  legend,
  options,
  idPrefix,
  label,
  onToggle,
}: {
  readonly legend: string;
  readonly options: readonly FacetOption[];
  readonly idPrefix: string;
  readonly label: (id: string) => string;
  readonly onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="xp-fgroup">
      <legend>{legend}</legend>
      <div>
        {options.map((option) => {
          const id = `${idPrefix}-${option.id}`;
          return (
            <label
              key={option.id}
              className={option.n === 0 && !option.checked ? 'xp-fopt is-zero' : 'xp-fopt'}
              htmlFor={id}
            >
              <input
                type="checkbox"
                id={id}
                checked={option.checked}
                onChange={() => onToggle(option.id)}
              />
              <span>{label(option.id)}</span>
              <span className="xp-fopt-n">{option.n}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Results({
  model,
  areas,
  state,
  selected,
  loading,
  failed,
  onRetry,
  onClear,
}: {
  readonly model: ReturnType<typeof catalogueModel> | null;
  readonly areas: readonly StructureArea[] | null;
  readonly state: CatalogueState;
  readonly selected: ReadonlySet<string>;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onRetry: () => void;
  readonly onClear: () => void;
}) {
  if (failed) {
    return (
      <FailedBlock
        title={CATALOGUE.failedTitle}
        line={CATALOGUE.failedLine}
        retryLabel={CATALOGUE.retry}
        onRetry={onRetry}
      />
    );
  }
  if (loading || !model || !areas) {
    return (
      <>
        <span className="xr-sr" role="status">
          {CATALOGUE.loading}
        </span>
        <ul className="xp-erows">
          {[0, 1, 2, 3].map((index) => (
            <li className="xp-erow" aria-hidden="true" key={index}>
              <div className="xp-erow-media" />
              <div className="xp-erow-text">
                <span className="xr-skel w-3/10" />
                <span className="xr-skel h-5 w-11/20" />
                <span className="xr-skel w-9/10" />
                <span className="xr-skel w-1/4" />
              </div>
              <span />
            </li>
          ))}
        </ul>
      </>
    );
  }
  if (model.rows.length === 0) {
    return (
      <EmptyBlock
        icon="search"
        title={CATALOGUE.emptyTitle}
        line={CATALOGUE.emptyLine}
        action={{ kind: 'button', label: CATALOGUE.clearAllFilters, onClick: onClear }}
      />
    );
  }
  if (state.view === 'area') {
    // Keyed fragments, not wrappers: B1-04 draws the headings and lists as siblings in
    // `div.xr-content`, and `.xp-group-h:first-child{margin-top:0}` must match the first one only.
    return model.groups.map(({ area, rows }) => (
      <Fragment key={area.id}>
        <div className="xp-group-h">
          <h2>{area.name}</h2>
          <span className="xr-meta">
            {experimentsWords(rows.length)} ·{' '}
            <Link href={`/areas/${encodeURIComponent(area.id)}`}>{VIEW_AREA}</Link>
          </span>
        </div>
        <ul className="xp-erows mb-2">
          {rows.map((entry) => (
            <ExperimentRow
              key={entry.experimentId}
              entry={entry}
              href={experimentHref(entry.experimentId, state)}
              inSelection={selected.has(entry.experimentId)}
            />
          ))}
        </ul>
      </Fragment>
    ));
  }
  return (
    <ul className="xp-erows">
      {model.rows.map((entry) => (
        <ExperimentRow
          key={entry.experimentId}
          entry={entry}
          href={experimentHref(entry.experimentId, state)}
          inSelection={selected.has(entry.experimentId)}
        />
      ))}
    </ul>
  );
}
