'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';

import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Button } from './actions.js';
import { Field, Select, SearchInput, type SelectOption } from './fields.js';
import { Glyph, type V3IconName } from './icons.js';

/** `useLayoutEffect` in the browser, nothing on the server (no layout to read there). */
const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** The content-box inline size of an element (what a container query on it reads). */
function contentInlineSize(element: HTMLElement): number {
  const style = getComputedStyle(element);
  return (
    element.clientWidth -
    parseFloat(style.paddingLeft || '0') -
    parseFloat(style.paddingRight || '0')
  );
}

/**
 * The content-box inline size of `ref`'s element — what a container query on it reads. Measured
 * before the first paint (a layout effect), then on every resize; `null` only where there is no
 * layout to read (the server, or an environment without ResizeObserver).
 */
export function useInlineSize(ref: RefObject<HTMLElement | null>): number | null {
  const [size, setSize] = useState<number | null>(null);
  useBrowserLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    setSize(contentInlineSize(element));
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentBoxSize?.[0];
      setSize(box ? box.inlineSize : contentInlineSize(element));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

// ── list surface: one sort state shared by the table head and the narrow-width sort bar ──────

interface ListSurfaceState {
  /** Whether the table's head (and its sort button) is displayed; `null` while no table shows. */
  readonly headShown: boolean | null;
  readonly setHeadShown: (shown: boolean | null) => void;
}

const ListSurfaceContext = createContext<ListSurfaceState | null>(null);

export interface ListSurfaceProps {
  /** The list's name: "Institutional access requests". */
  readonly label?: string;
  readonly labelledBy?: string;
  readonly className?: string;
  readonly busy?: boolean;
  readonly children: ReactNode;
}

/**
 * A list surface (`section.rk-surface`): the toolbar, the table and the list states of one list.
 * It lets the narrow-width sort bar follow the table's own breakpoint (V3P-02): exactly one of the
 * head's sort button and the sort bar is displayed at any width, and the bar only while rows show.
 */
export function ListSurface({ label, labelledBy, className, busy, children }: ListSurfaceProps) {
  const [headShown, setHeadShown] = useState<boolean | null>(null);
  return (
    <ListSurfaceContext value={{ headShown, setHeadShown }}>
      <section
        className={joinClasses('rk-surface', className)}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-busy={busy || undefined}
      >
        {children}
      </section>
    </ListSurfaceContext>
  );
}

// ── sorting ──────────────────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface RecordTableSort {
  /** The sortable column's header: "Received". */
  readonly header: string;
  readonly direction: SortDirection;
  /** The order in words, per direction: { desc: 'newest first', asc: 'oldest first' }. */
  readonly words: Readonly<Record<SortDirection, string>>;
  /** Reverses the order; the caller sorts the rows it passes. */
  readonly onToggle: () => void;
}

function SortArrow({ direction }: { readonly direction: SortDirection }) {
  return <Glyph name={direction === 'desc' ? 'arrowDown' : 'arrowUp'} />;
}

/**
 * The narrow-width sort control (`div.rk-sortbar` > `button.rk-sortbtn`), for the toolbar's status
 * line. Shown only while the table lists rows with its head hidden (V3P-02). Its name is its
 * visible words ("Sort: received, newest first", "Sort: newest first" under 600 px) and what it
 * does.
 */
export function SortBar({ sort }: { readonly sort: RecordTableSort }) {
  const surface = useContext(ListSurfaceContext);
  if (!surface) throw new Error('SortBar goes inside a ListSurface.');
  if (surface.headShown === null) return null;
  const words = sort.words[sort.direction];
  return (
    <div
      className={joinClasses(
        'rk-sortbar',
        surface.headShown ? 'rk-x-sort-hidden' : 'rk-x-sort-shown',
      )}
    >
      <button type="button" className="rk-sortbtn" onClick={sort.onToggle}>
        <span className="rk-sort-l">
          Sort: {sort.header.toLowerCase()}, {words}
        </span>
        <span className="rk-sort-s">Sort: {words}</span>
        <SortArrow direction={sort.direction} />
        <span className="xr-sr">. Change order</span>
      </button>
    </div>
  );
}

// ── the record table ─────────────────────────────────────────────────────────────────────────

export interface RecordTableRow {
  readonly key: string;
  /** Where the row leads: its link, and a press anywhere on the row, go there. */
  readonly href: string;
  /** The link's words (`a.rk-rowlink`): the institution's name. */
  readonly title: ReactNode;
  /**
   * The link's accessible name: the row in words and what the link does ("Godavari Institute of
   * Technology, additional licences, received 21 Oct 2026, Under review. Open the request").
   */
  readonly linkLabel: string;
  /** Under the link (`span.rk-small`): the contact person. */
  readonly titleDetail?: ReactNode;
  readonly what: ReactNode;
  readonly kind: ReactNode;
  readonly when: ReactNode;
  readonly status: ReactNode;
}

export interface RecordTableHeaders {
  readonly who: string;
  readonly what: string;
  readonly kind: string;
  readonly when: string;
  readonly status: string;
}

export interface RecordTableProps {
  /** The table's name; the order is added to it when sorted (visually hidden caption). */
  readonly caption: string;
  readonly headers: RecordTableHeaders;
  readonly rows: readonly RecordTableRow[];
  /** The `when` column's order (its head button; the sort bar below the table's breakpoint). */
  readonly sort?: RecordTableSort;
  /** In the narrow layouts the date carries its label inline (`span.rk-inlabel`): "Received". */
  readonly whenLabel?: string;
}

const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex]';

/**
 * The record table (`div.rk-tablewrap` > `table.rk-table`; rb-kit.css RequestTable): a real table
 * with a hidden caption, `aria-sort` on the sortable column and the whole row clickable. It has
 * three layouts by its own width (table, two-line rows, stacked); explicit table roles keep the
 * table semantics when the narrow layouts change the cells' display (ADR-0010).
 */
export function RecordTable({ caption, headers, rows, sort, whenLabel }: RecordTableProps) {
  const surface = useContext(ListSurfaceContext);
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLTableSectionElement>(null);
  const width = useInlineSize(wrapRef);
  const setHeadShown = surface?.setHeadShown;

  // Whether the head is displayed is read from the table's own layout, before the first paint and
  // again whenever the table's width changes — so the sort bar never lags behind the breakpoint.
  useBrowserLayoutEffect(() => {
    const head = headRef.current;
    if (!setHeadShown || !head) return;
    setHeadShown(getComputedStyle(head).display !== 'none');
  }, [setHeadShown, width]);
  useEffect(() => () => setHeadShown?.(null), [setHeadShown]);

  const words = sort ? sort.words[sort.direction] : null;
  return (
    <div ref={wrapRef} className="rk-tablewrap">
      <table className="rk-table" role="table">
        <caption>{words ? `${caption}, ${sort?.header.toLowerCase()}, ${words}` : caption}</caption>
        <thead ref={headRef} role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="rk-c-inst">
              {headers.who}
            </th>
            <th scope="col" role="columnheader" className="rk-c-exp">
              {headers.what}
            </th>
            <th scope="col" role="columnheader" className="rk-c-type">
              {headers.kind}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="rk-c-date"
              aria-sort={
                sort ? (sort.direction === 'desc' ? 'descending' : 'ascending') : undefined
              }
            >
              {sort ? (
                <button
                  type="button"
                  className="rk-sortbtn"
                  aria-label={`${sort.header}, ${words}. Change order`}
                  onClick={sort.onToggle}
                >
                  {headers.when}
                  <SortArrow direction={sort.direction} />
                </button>
              ) : (
                headers.when
              )}
            </th>
            <th scope="col" role="columnheader" className="rk-c-st">
              {headers.status}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <RecordRow key={row.key} row={row} whenLabel={whenLabel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordRow({
  row,
  whenLabel,
}: {
  readonly row: RecordTableRow;
  readonly whenLabel: string | undefined;
}) {
  const Link = useLinkComponent();
  const linkRef = useRef<HTMLAnchorElement>(null);
  // A press anywhere on the row follows its link — not on another control, and not when the
  // press ended a text selection.
  const onRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;
    linkRef.current?.click();
  };
  return (
    <tr role="row" onClick={onRowClick}>
      <td role="cell" className="rk-c-inst">
        <Link ref={linkRef} className="rk-rowlink" href={row.href} aria-label={row.linkLabel}>
          {row.title}
        </Link>
        {row.titleDetail ? <span className="rk-small">{row.titleDetail}</span> : null}
      </td>
      <td role="cell" className="rk-c-exp">
        {row.what}
      </td>
      <td role="cell" className="rk-c-type">
        {row.kind}
      </td>
      <td role="cell" className="rk-c-date">
        {whenLabel ? <span className="rk-inlabel">{whenLabel} </span> : null}
        {row.when}
      </td>
      <td role="cell" className="rk-c-st">
        {row.status}
      </td>
    </tr>
  );
}

/** The two lines of a cell (`span.rk-strong` + `span.rk-small`). */
export function CellLines({
  strong,
  small,
}: {
  readonly strong: ReactNode;
  readonly small?: ReactNode;
}) {
  return (
    <>
      <span className="rk-strong">{strong}</span>
      {small ? <span className="rk-small">{small}</span> : null}
    </>
  );
}

// ── the filter toolbar ───────────────────────────────────────────────────────────────────────

export interface ToolbarSelect {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
  /** The value that applies no filter (default `all`): a filter on another value counts. */
  readonly allValue?: string;
  /** The field's width class: `rk-field--st`, `rk-field--type` or `rk-field--route`. */
  readonly size?: 'status' | 'type' | 'route';
}

export interface ToolbarChip {
  readonly key: string;
  /** "Status: Under review"; the remove button is named "Remove filter Status: Under review". */
  readonly label: string;
  readonly onRemove: () => void;
}

export interface FilterToolbarProps {
  /** The search landmark's name: "Filter requests". */
  readonly label: string;
  readonly search: {
    readonly id: string;
    readonly label: string;
    readonly placeholder?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
  };
  /** The filters beside the search. A `type`-size filter moves into More filters under 600 px. */
  readonly filters?: readonly ToolbarSelect[];
  /** "More filters" and the filters it holds (SA-02 "Internal or external"). */
  readonly more?: {
    readonly id: string;
    readonly label: string;
    readonly open: boolean;
    readonly onToggle: () => void;
    readonly filters: readonly ToolbarSelect[];
  };
  /** The count in words ("3 of 8 requests"), announced politely; omitted while loading. */
  readonly count?: ReactNode;
  /** The narrow-width `SortBar`, after the count. */
  readonly sortBar?: ReactNode;
  readonly chips?: readonly ToolbarChip[];
  /** Clears every filter; focus returns to the search field. */
  readonly onClearFilters?: () => void;
  /** `ca`: the content-access toolbar (IA-02). */
  readonly variant?: 'ca';
  /** The search input, for a caller that moves focus to it. */
  readonly searchRef?: Ref<HTMLInputElement>;
}

const SIZE_CLASS: Readonly<Record<NonNullable<ToolbarSelect['size']>, string>> = {
  status: 'rk-field--st',
  type: 'rk-field--type',
  route: 'rk-field--route',
};

/** Below this toolbar width the `type` filter lives in More filters (rb-kit.css `rktool`). */
const TYPE_MOVES_BELOW = 600;

function applied(filter: ToolbarSelect): boolean {
  return filter.value !== (filter.allValue ?? 'all');
}

function ToolbarField({
  filter,
  id,
  className,
}: {
  readonly filter: ToolbarSelect;
  readonly id: string;
  readonly className?: string;
}) {
  return (
    <Field label={filter.label} id={id} className={className}>
      <Select
        value={filter.value}
        options={filter.options}
        onChange={(event) => filter.onChange(event.target.value)}
      />
    </Field>
  );
}

/**
 * The filter toolbar (`div.rk-toolbar` > `div.rk-tools[role=search]` + More filters + the status
 * line; rb-kit.css FilterToolbar): search, filters, "More filters" with the number it holds, the
 * count, the sort bar, one chip per filter and "Clear filters". Removing a chip moves focus to the
 * next chip (or the previous, or the search field) instead of losing it; clearing returns focus
 * to the search field.
 */
export function FilterToolbar({
  label,
  search,
  filters = [],
  more,
  count,
  sortBar,
  chips = [],
  onClearFilters,
  variant,
  searchRef,
}: FilterToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const width = useInlineSize(toolbarRef);
  const narrow = width !== null && width < TYPE_MOVES_BELOW;
  const pendingChipFocus = useRef<number | null>(null);

  useEffect(() => {
    const index = pendingChipFocus.current;
    if (index === null) return;
    pendingChipFocus.current = null;
    const buttons = statusRef.current?.querySelectorAll<HTMLButtonElement>('.rk-chip button');
    (buttons?.[index] ?? buttons?.[index - 1] ?? searchInput.current)?.focus();
  }, [chips.length]);

  const attachSearch = (element: HTMLInputElement | null) => {
    searchInput.current = element;
    if (typeof searchRef === 'function') searchRef(element);
    else if (searchRef) searchRef.current = element;
  };

  const moving = filters.filter((filter) => filter.size === 'type');
  const held = [...(more?.filters ?? []), ...(narrow ? moving : [])];
  const heldCount = held.filter(applied).length;

  return (
    <div
      ref={toolbarRef}
      className={joinClasses('rk-toolbar', variant === 'ca' && 'rk-toolbar--ca')}
    >
      <div className="rk-tools" role="search" aria-label={label}>
        <Field label={search.label} id={search.id} className="rk-search">
          <SearchInput
            ref={attachSearch}
            placeholder={search.placeholder}
            autoComplete="off"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
          />
        </Field>
        {filters.map((filter) => (
          <ToolbarField
            key={filter.id}
            filter={filter}
            id={filter.id}
            className={filter.size ? SIZE_CLASS[filter.size] : undefined}
          />
        ))}
        {more ? (
          <div className="rk-btnfield">
            <Button
              className="rk-toggle"
              icon="filter"
              aria-expanded={more.open}
              aria-controls={more.id}
              onClick={more.onToggle}
            >
              {more.label}
              {heldCount > 0 ? (
                <>
                  <b aria-hidden="true">{heldCount}</b>
                  <span className="xr-sr">, {heldCount} applied</span>
                </>
              ) : null}
            </Button>
          </div>
        ) : null}
      </div>
      {more?.open ? (
        <div className="rk-more" id={more.id}>
          {moving.map((filter) => (
            <ToolbarField
              key={filter.id}
              filter={filter}
              id={`${filter.id}-more`}
              className="rk-more-type"
            />
          ))}
          {more.filters.map((filter) => (
            <ToolbarField key={filter.id} filter={filter} id={filter.id} />
          ))}
        </div>
      ) : null}
      {count !== undefined || chips.length > 0 ? (
        <div ref={statusRef} className="rk-statusline">
          {count !== undefined ? (
            <p className="rk-count" role="status">
              {count}
            </p>
          ) : null}
          {count !== undefined ? sortBar : null}
          {count !== undefined && chips.length > 0 ? (
            <span className="rk-break" aria-hidden="true" />
          ) : null}
          {chips.map((chip, index) => (
            <span key={chip.key} className="rk-chip">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={() => {
                  pendingChipFocus.current = index;
                  chip.onRemove();
                }}
              >
                <Glyph name="close" />
              </button>
            </span>
          ))}
          {chips.length > 0 && onClearFilters ? (
            <button
              type="button"
              className="rk-clear"
              onClick={() => {
                onClearFilters();
                searchInput.current?.focus();
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── list states ──────────────────────────────────────────────────────────────────────────────

export type ListStateKind = 'nomatch' | 'empty' | 'failed' | 'none';

const STATE_ICON: Readonly<Record<ListStateKind, V3IconName>> = {
  nomatch: 'search',
  empty: 'inbox',
  failed: 'cloudAlert',
  none: 'contentAccess',
};

export interface ListStateProps {
  readonly kind: ListStateKind;
  /** "No requests match these filters", "We couldn’t load the requests". */
  readonly title: ReactNode;
  /** The next step in words ("Nothing has changed. Try again."). */
  readonly children?: ReactNode;
  /** "Clear filters", "Try again", "View request status". */
  readonly action?: ReactNode;
  /** The roomy padding of a whole-page state (IA-02 "No content yet"). */
  readonly roomy?: boolean;
  /** `p` (default) or a heading where the state replaces a section's content (IA-02). */
  readonly titleAs?: 'p' | 'h2' | 'h3';
  readonly titleId?: string;
  readonly icon?: V3IconName;
}

/**
 * An accessible list state (`div.rk-state`; rb-kit.css ListState): no match, empty, failed or none
 * yet. A failed load is an alert; the others are not live regions — the count line already
 * announces "0 of 8 requests" (concise announcements, ADR-0010).
 */
export function ListState({
  kind,
  title,
  children,
  action,
  roomy = false,
  titleAs: Title = 'p',
  titleId,
  icon,
}: ListStateProps) {
  return (
    <div
      className={joinClasses('rk-state', roomy && 'rk-state--roomy')}
      role={kind === 'failed' ? 'alert' : undefined}
    >
      <span
        className={joinClasses('rk-state-ico', kind === 'failed' && 'rk-state-ico--err')}
        aria-hidden="true"
      >
        <Glyph name={icon ?? STATE_ICON[kind]} />
      </span>
      <Title className="rk-state-t" id={titleId}>
        {title}
      </Title>
      {children ? <p className="rk-state-d">{children}</p> : null}
      {action}
    </div>
  );
}

/** "Loading requests…" over skeleton rows (`p.rk-loading-msg` + `div.rk-skel-row` ×3). */
export function LoadingRows({
  message,
  rows = 3,
}: {
  readonly message: ReactNode;
  readonly rows?: number;
}) {
  return (
    <div aria-busy="true">
      <p className="rk-loading-msg" role="status">
        {message}
      </p>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rk-skel-row" aria-hidden="true">
          <div>
            <span className="rk-skel" />
            <span className="rk-skel" />
          </div>
          <div>
            <span className="rk-skel" />
            <span className="rk-skel" />
          </div>
          <div>
            <span className="rk-skel" />
          </div>
          <div>
            <span className="rk-skel" />
          </div>
          <div>
            <span className="rk-skel" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** "Loading content access…" over a skeleton plan band and experiment (`div.rk-skel-ca`). */
export function LoadingCards({ message }: { readonly message: ReactNode }) {
  return (
    <>
      <p className="rk-loading-msg" role="status">
        {message}
      </p>
      <div className="rk-skel-ca" aria-hidden="true">
        <div className="rk-skel-band">
          <span className="rk-skel" />
          <span className="rk-skel" />
        </div>
        <div className="rk-skel-card">
          <span className="rk-skel" />
          <div className="rk-skel-cells">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </>
  );
}

/** The quiet foot line of a list (`p.rk-ca-foot`). */
export function ListFoot({ children }: { readonly children: ReactNode }) {
  return <p className="rk-ca-foot">{children}</p>;
}
