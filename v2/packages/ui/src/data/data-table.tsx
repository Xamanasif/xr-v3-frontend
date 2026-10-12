'use client';

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefCallback,
  type ThHTMLAttributes,
} from 'react';

import { Button } from '../foundation/button.js';
import { Link } from '../foundation/links.js';
import { EmptyState, FailedState, LoadingState, NoMatch, Skeleton } from '../foundation/states.js';
import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';

/** A slot draws only when it holds something: `undefined`, `null`, `false` and `''` draw nothing. */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/**
 * Extra attributes on a column's `th[scope="col"]`. `aria-sort` here states an order the person
 * cannot change; a column sorted through the `sort` prop gets its `aria-sort` from that prop,
 * which wins (Appendix E §7.1 PF-01).
 */
export type DataTableHeaderCellProps = Pick<
  ThHTMLAttributes<HTMLTableCellElement>,
  'aria-sort' | 'id'
>;

/** What every data column has, sortable or not. */
interface DataTableColumnBase<Row> {
  /** Unique within the table (the React key of the header and of each cell). */
  readonly key: string;
  /**
   * The `data-label` drawn above the value in labelled-row mode (below 760 px of content, by
   * the v46 sheet). Defaults to the header when the header is a string; give it when the header
   * is not plain words (B2-04 "Formats (from your plan)", whose head holds an `xr-opt`). `null`
   * draws none: an action column whose control names itself (B2-04 "Action" column).
   */
  readonly label?: string | null;
  /** The cell's content for one row (words, a StatusPill, an `xr-sub` line …). */
  readonly cell: (row: Row) => ReactNode;
  /** Board context classes on the `td`: `xr-num` for dates and figures (B1-10 "Received"). */
  readonly className?: string;
  /** Attributes on this column's `th` (see `DataTableHeaderCellProps`). */
  readonly headerCellProps?: DataTableHeaderCellProps;
}

/** One data column after the primary one (a `td[data-label]` per row). */
export interface DataTablePlainColumn<Row> extends DataTableColumnBase<Row> {
  /**
   * The `th[scope="col"]` content: the column's words ("Institution and contact person"), or a
   * visually hidden name for an action column (`<VisuallyHidden>Action</VisuallyHidden>`, B2-04).
   */
  readonly header: ReactNode;
  readonly sortWords?: undefined;
}

/**
 * The order of a sorted column, as `aria-sort` states it. B1-10 "Received": `descending` is
 * "newest first", `ascending` "oldest first".
 */
export type DataTableSortDirection = 'ascending' | 'descending';

/**
 * A sortable column's order in words, said after the column's name. B1-10's own words
 * (`sortLabel: s.desc ? 'Received, newest first' : 'Received, oldest first'`): descending
 * "newest first", ascending "oldest first".
 */
export interface DataTableSortWords {
  readonly ascending: string;
  readonly descending: string;
}

/**
 * A data column the rows can be sorted by (B1-10 "Received", the only sortable column the
 * boards draw). Its header is its name in words; the sort controls say it before the order.
 */
export interface DataTableSortableColumn<Row> extends DataTableColumnBase<Row> {
  /** The column's name ("Received"): the header's words and the start of the controls' names. */
  readonly header: string;
  /** The order in words, for the controls' names and the sort bar's visible words. */
  readonly sortWords: DataTableSortWords;
}

/** One data column after the primary one: plain, or sortable (PF-01). */
export type DataTableColumn<Row> = DataTablePlainColumn<Row> | DataTableSortableColumn<Row>;

/** The rows' order: the sorted column's `key` and its direction. */
export interface DataTableSort {
  /** The `key` of the sorted column, a column with `sortWords`. */
  readonly column: string;
  readonly direction: DataTableSortDirection;
}

/**
 * The order and its one change handler, controlled by the caller, who sorts `rows` to match.
 * The same object goes to the DataTable (its header button) and to the `DataTableSortBar` in the
 * ListToolbar, so both controls show one state and both call `onSortChange`.
 */
export interface DataTableSorting extends DataTableSort {
  /** Called with the reversed order when either sort control is pressed. */
  readonly onSortChange: (sort: DataTableSort) => void;
}

/** B1-10's words after the order: "Received, newest first. Change order". */
const CHANGE_ORDER = 'Change order';

/** "Received, newest first": the order in words (the sort bar's visible words, the announcement). */
function sortPhrase<Row>(
  column: DataTableSortableColumn<Row>,
  direction: DataTableSortDirection,
): string {
  return `${column.header}, ${column.sortWords[direction]}`;
}

/** The sorted column named by `sort`; a programming error when it is not a sortable column. */
function sortedColumn<Row>(
  columns: readonly DataTableColumn<Row>[],
  sort: DataTableSort,
): DataTableSortableColumn<Row> {
  const column = columns.find((candidate) => candidate.key === sort.column);
  if (column?.sortWords === undefined) {
    throw new Error(
      `DataTable sort.column "${sort.column}" must be the key of a column with sortWords.`,
    );
  }
  return column;
}

/**
 * One sort control: a text button named "<name>, <order>. Change order" that reverses the
 * order. The name is an `aria-label`, not the visible words plus an `xr-sr` suffix as Appendix
 * E §7.1 sketches: v46 `.xr-sr` is absolutely positioned, so Chromium joins the suffix with a
 * space ("Received , newest first. Change order"; the boards' own button reads "Received ,
 * Received, newest first. Change order" in derived/frame-index.json). The chevron is B1-10's:
 * down while descending, up while ascending.
 */
function SortButton<Row>({
  column,
  sort,
  onPress = sort.onSortChange,
  size,
  className,
  children,
}: {
  readonly column: DataTableSortableColumn<Row>;
  readonly sort: DataTableSorting;
  /** Called with the reversed order (default `sort.onSortChange`). */
  readonly onPress?: (sort: DataTableSort) => void;
  readonly size?: 'sm';
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const reversed: DataTableSortDirection =
    sort.direction === 'descending' ? 'ascending' : 'descending';
  return (
    <Button
      variant="text"
      size={size}
      className={className}
      icon={sort.direction === 'descending' ? 'chevronDown' : 'chevronUp'}
      iconPosition="end"
      iconSize={16}
      aria-label={`${sortPhrase(column, sort.direction)}. ${CHANGE_ORDER}`}
      onClick={() => onPress({ column: column.key, direction: reversed })}
    >
      {children}
    </Button>
  );
}

export interface DataTableSortBarProps<Row> {
  /** The sorted column: the same column object the DataTable's `columns` hold. */
  readonly column: DataTableSortableColumn<Row>;
  /** The same sorting object the DataTable gets. */
  readonly sort: DataTableSorting;
}

/**
 * The visible sort control for labelled-row mode (PF-01; START-HERE Known exception 1; B8-03
 * "Open finding — B1-10 at 375"; B8-08 "B1-10 sort button at 375": "render the sort as a visible
 * control above the labelled rows below 760 px"): `div.xr-x-table-sortbar` > a small text button
 * reading "Received, newest first", named "Received, newest first. Change order".
 *
 * Put it in the ListToolbar's `sortBar` slot, so it sits in the `xr-toolbar-status` row after
 * the count, above the first row (Appendix E §7.1, VD-04 PROVISIONAL placement), inside the same
 * `.xr-content` as the table. The product layer shows it only below 760 px of content, exactly
 * where it hides the header's button, so one control is ever displayed. Render it only while the
 * DataTable shows its table — not `loading`, not `failed`, with rows — as the header button is
 * only drawn then.
 */
export function DataTableSortBar<Row>({ column, sort }: DataTableSortBarProps<Row>) {
  if (sort.column !== column.key) {
    throw new Error(
      `DataTableSortBar column "${column.key}" is not the sorted column "${sort.column}".`,
    );
  }
  return (
    <div className="xr-x-table-sortbar">
      <SortButton column={column} sort={sort} size="sm">
        {sortPhrase(column, sort.direction)}
      </SortButton>
    </div>
  );
}

/**
 * The first column (`td.is-primary`): the row's link to its record. Every row opens its record
 * (Appendix E §3.3; board 11 "Lists": "Every row still opens its record"); the link is rendered
 * by the injected link component (`LinkProvider`).
 */
export interface DataTablePrimaryColumn<Row> {
  /** Names the column, as a data column's `key` does (for the caller's own column state). */
  readonly key: string;
  /** The first `th[scope="col"]` ("Reference", "Student"). */
  readonly header: ReactNode;
  /** Where the row opens: its record. */
  readonly href: (row: Row) => string;
  /** The link's words: the record's name or reference ("Priya Natarajan", "REQ-0042"). */
  readonly title: (row: Row) => ReactNode;
  /**
   * A fuller accessible name where the words alone are ambiguous out of context (B1-10: "Open
   * request REQ-0042, Godavari Institute of Technology"). Omitted, the words are the name.
   */
  readonly linkLabel?: (row: Row) => string;
  /** `xr-id` where the link is a record reference in monospace (B1-10 "REQ-0042"). */
  readonly linkClassName?: string;
  /** The secondary line under the link (`span.xr-sub`: a student ID, a contact). */
  readonly sub?: (row: Row) => ReactNode;
  /** Attributes on the first `th` (see `DataTableHeaderCellProps`). */
  readonly headerCellProps?: DataTableHeaderCellProps;
}

/** A row tint: `tr.is-changed` (warm: an unsaved or changed row) or `tr.is-error` (red tint). */
export type DataTableRowState = 'changed' | 'error';

/** Nothing here yet: the board-04 empty grammar (icon, one line, one next step). */
export interface DataTableEmpty {
  /** The icon of what the list holds (B1-10: the Requests icon). */
  readonly icon: IconName;
  /** "No requests yet" — never "No data" (board 04 "State grammar"). */
  readonly title: ReactNode;
  /** H2 (default) on a page; H3 inside a section that already has an H2 (B7-02, B2-08). */
  readonly headingLevel?: 2 | 3;
  /** How it fills, in one line. */
  readonly children?: ReactNode;
  /** The one next step, where the board draws one. */
  readonly actions?: ReactNode;
}

/** Filters that match nothing (B1-10 "No match"): one way back, "Clear filters". */
export interface DataTableNoMatch {
  /** "No requests match these filters". */
  readonly title: ReactNode;
  /** H2 (default) or H3, as for the empty state. */
  readonly headingLevel?: 2 | 3;
  /** An optional line ("Try another name or clear the filters.", B7-02). */
  readonly children?: ReactNode;
  /** Clears every filter (the caller's state). */
  readonly onClearFilters: () => void;
}

/** The list did not load: the error notice in place with "Try again" and "Report a problem". */
export interface DataTableFailed {
  /** What didn't work, with reassurance ("We couldn’t load the requests"). */
  readonly title: ReactNode;
  /** The next step in words ("Nothing has changed. Try again."). */
  readonly children?: ReactNode;
  /** Loads again ("Try again"); the caller sets `loading` while it does. */
  readonly onRetry: () => void;
  /** Where "Report a problem" goes (the Help report form). */
  readonly reportHref?: string;
}

export interface DataTableProps<Row> {
  /** The visually hidden caption (`caption.xr-sr`): what the table lists. */
  readonly caption: ReactNode;
  /** The first column: the row's link to its record. */
  readonly primary: DataTablePrimaryColumn<Row>;
  /** The other columns, in board order. */
  readonly columns: readonly DataTableColumn<Row>[];
  /** The rows to show, in the caller's order (DataTable does not sort or filter). */
  readonly rows: readonly Row[];
  /**
   * The rows' order and its change handler (PF-01; Appendix E §7.1), controlled: the caller
   * sorts `rows` to match. The sorted column's `th` takes `aria-sort` — the only one: other
   * columns' `headerCellProps` `aria-sort` is dropped while this is given — and holds
   * `button.xr-x-th-sort` + `span.xr-x-th-text`; below 760 px of content the product layer hides
   * the button and the `DataTableSortBar` (same object) takes its place. A change of order is
   * announced in the table's status region in the sort bar's words ("Received, oldest first").
   *
   * Sort in place: reorder the rows already held, in the same render, as B1-10 does; do not show
   * the loading state for a sort. (If a load does replace the table, focus on its header button
   * moves to the table, as after "Try again", and the new order is announced once the rows are
   * back; the sort bar, outside the table, would lose focus with it.)
   */
  readonly sort?: DataTableSorting;
  /** A stable, unique key per row (the record's reference). */
  readonly rowKey: (row: Row) => string;
  /** A row's tint, if any (board 03 "Decision panel and editable table"). */
  readonly rowState?: (row: Row) => DataTableRowState | undefined;
  /**
   * `xw-table-flush`: the table sits flush inside a section, with no border of its own (B2-02,
   * B2-03, B2-06, B2-08). The empty and no-match states then draw no section of their own either
   * (sections are never nested).
   */
  readonly flush?: boolean;
  /** While true: `aria-busy` on the wrap, `loadingLabel` in its status region, the skeleton. */
  readonly loading?: boolean;
  /**
   * What screen readers hear while loading ("Loading requests"; B1-10 "Loading"). The status
   * region stays mounted in every state, so the next load is announced reliably (§5.5).
   */
  readonly loadingLabel: string;
  /** Skeleton rows while loading (B1-10 draws 5); one bar per column. */
  readonly skeletonRows?: number;
  /** Set when the last load failed; shown instead of the table until the caller clears it. */
  readonly failed?: DataTableFailed | null;
  /** Filters or a search are applied: an empty result shows `noMatch` instead of `empty`. */
  readonly filtered?: boolean;
  /** No rows and nothing applied: the empty state. */
  readonly empty: DataTableEmpty;
  /** No rows while `filtered`: the no-match state (without it, the empty state shows). */
  readonly noMatch?: DataTableNoMatch;
  /** Board context classes on the wrap. */
  readonly className?: string;
  /** The one container that holds every state (and its status region). */
  readonly ref?: Ref<HTMLDivElement>;
}

/** `data-label` for a column: its label, else its header when that is plain words. */
function dataLabel<Row>(column: DataTableColumn<Row>): string | undefined {
  if (column.label === null) return undefined;
  if (column.label !== undefined) return column.label;
  return typeof column.header === 'string' ? column.header : undefined;
}

/**
 * Skeleton rows in the shape of the table (board 04: "Skeleton in the shape of the content"). The
 * boards draw them as inline-styled grids, one `span.xr-skel` per column (B1-10 "Loading" and 83
 * more); @xr/ui emits no inline styles, so the same bars sit in `xr-table` rows (hidden from
 * screen readers, which hear the status text), and stack as labelled rows do below 760.
 */
function SkeletonRows({ columns, rows }: { readonly columns: number; readonly rows: number }) {
  return (
    <table className="xr-table" aria-hidden="true">
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: columns }, (_, column) => (
              <td key={column}>
                <Skeleton />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type View = 'loading' | 'failed' | 'table' | 'no-match' | 'empty';

/**
 * The list table (`div.xr-table-wrap` > `table.xr-table`; boards 03 "Search, filter, segmented
 * and tabs", 11, B1-10, B2-03): a visually hidden caption, `th[scope="col"]`, the primary cell
 * with the row's link, `td[data-label]` for every other value — the v46 sheet turns the rows
 * into labelled rows below 760 px of content — and the loading, failed, empty and no-match
 * states in place (B1-10 frames "Loading", "Failed + retry", "Empty · no requests yet", "No
 * match"). A sortable column (`sort`) carries B1-10's header sort button, with the B1-10 fix
 * (PF-01): the `DataTableSortBar` in the ListToolbar is its visible stand-in below 760 px.
 *
 * "Clear filters" (no match) and "Try again" (failed) go away with their own state; the header's
 * sort button goes only if the caller loads for the new order. When the pressed one had focus,
 * focus then moves to the first row's link, or, while there is none (loading, empty), to the
 * container, which takes `tabindex="-1"` until focus moves on — also when the caller acts in a
 * later commit (a transition, a busy render first). PROVISIONAL: no board draws where focus goes.
 */
export function DataTable<Row>({
  caption,
  primary,
  columns,
  rows,
  rowKey,
  sort,
  rowState,
  flush = false,
  loading = false,
  loadingLabel,
  skeletonRows = 5,
  failed,
  filtered = false,
  empty,
  noMatch,
  className,
  ref,
}: DataTableProps<Row>) {
  const sorted = sort ? sortedColumn(columns, sort) : null;
  const phrase = sort && sorted ? sortPhrase(sorted, sort.direction) : '';
  const view: View = loading
    ? 'loading'
    : failed
      ? 'failed'
      : rows.length > 0
        ? 'table'
        : filtered && noMatch
          ? 'no-match'
          : 'empty';
  const listing = view === 'table';
  // A change of order is announced in the status region that stays mounted (Appendix E §5.5), in
  // the sort bar's words ("Received, oldest first"), once the table shows the reordered rows: at
  // once when the caller sorts in place, after the load when it loads for the order. The first
  // order is not announced. Leaving the table (a load, no match, a failure) clears the words, so
  // they are never read above another state nor repeated when the rows come back. State adjusted
  // while rendering, so the words change in the same commit as the rows.
  const [announcement, setAnnouncement] = useState({ phrase, text: '', pending: false });
  if (announcement.phrase !== phrase) {
    const change = announcement.phrase !== '' && phrase !== '';
    setAnnouncement({ phrase, text: change && listing ? phrase : '', pending: change && !listing });
  } else if (!listing && announcement.text !== '') {
    setAnnouncement({ phrase, text: '', pending: announcement.pending });
  } else if (listing && announcement.pending) {
    setAnnouncement({ phrase, text: phrase, pending: false });
  }
  const wrap = useRef<HTMLDivElement | null>(null);
  // A React 19 callback ref may return its own cleanup, which React then calls instead of
  // calling the ref with null. This merged ref returns a cleanup, so it passes the caller's on.
  const attach: RefCallback<HTMLDivElement> = useCallback(
    (element: HTMLDivElement | null) => {
      wrap.current = element;
      let callerCleanup: (() => void) | undefined;
      if (typeof ref === 'function') {
        const result = ref(element);
        if (typeof result === 'function') callerCleanup = result;
      } else if (ref) {
        ref.current = element;
      }
      return () => {
        wrap.current = null;
        if (callerCleanup) callerCleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
  /**
   * The focused control of the table's own that was pressed, until it has gone: "Clear filters"
   * and "Try again" always go with their state; the header's sort button goes only if the caller
   * loads for the new order, so it is watched only while it keeps focus (`whileFocused`).
   */
  const pressed = useRef<{ readonly control: HTMLElement; readonly whileFocused: boolean } | null>(
    null,
  );
  /** The container holds rescued focus (`tabindex="-1"` while it does). */
  const [holdsFocus, setHoldsFocus] = useState(false);

  const press = (action: () => void, whileFocused = false) => {
    const active = document.activeElement;
    // Only a control that had focus can lose it (a mouse press in Safari does not focus).
    pressed.current =
      active instanceof HTMLElement && wrap.current?.contains(active)
        ? { control: active, whileFocused }
        : null;
    action();
  };
  const recordPress = (action: () => void) => () => press(action);

  // After every commit, before paint, so focus is never seen resting on the page body. The
  // caller may change the state in a later commit than the press (a transition's urgent render
  // or a busy render comes first), so the rescue waits until the pressed control has gone.
  useLayoutEffect(() => {
    const record = pressed.current;
    if (record === null) return;
    const { control, whileFocused } = record;
    if (control.isConnected) {
      // A sort button that stayed (the rows were sorted in place) is let go once focus moves on.
      if (whileFocused && document.activeElement !== control) pressed.current = null;
      return;
    }
    pressed.current = null;
    const active = document.activeElement;
    // Only rescue focus that was lost with the removed control.
    if (active && active !== document.body && active.isConnected) return;
    const link = wrap.current?.querySelector<HTMLElement>('td.is-primary a');
    if (link) link.focus();
    else setHoldsFocus(true);
  });

  // The container takes focus once it is focusable, and is drawn as the boards draw it (no
  // tabindex) again when focus lands elsewhere; not on blur alone, which a window switch fires.
  useLayoutEffect(() => {
    const element = wrap.current;
    if (!holdsFocus || element === null) return;
    element.focus();
    const release = (event: FocusEvent) => {
      if (event.target !== element) setHoldsFocus(false);
    };
    document.addEventListener('focusin', release);
    return () => document.removeEventListener('focusin', release);
  }, [holdsFocus]);

  // While a column is sorted, its own `aria-sort` is the only one (ARIA: one sorted header).
  const headerCellProps = (props: DataTableHeaderCellProps | undefined) =>
    sort && props?.['aria-sort'] !== undefined ? { ...props, 'aria-sort': undefined } : props;
  // One container for every state, so its status region stays mounted (LoadingState): the table
  // wrap while loading or listing; a section around an empty state (B1-10 frames "No match",
  // "Empty · no requests yet"); nothing around the failed notice, which is its own surface.
  const surface =
    view === 'loading' || view === 'table'
      ? 'table'
      : view === 'failed' || flush
        ? null
        : 'section';
  return (
    <LoadingState
      ref={attach}
      label={loadingLabel}
      loading={loading}
      status={announcement.text}
      surface={surface}
      className={joinClasses(surface === 'table' && flush && 'xw-table-flush', className)}
      skeleton={<SkeletonRows columns={columns.length + 1} rows={skeletonRows} />}
      focusTarget={holdsFocus}
    >
      {view === 'failed' && failed ? (
        <FailedState
          title={failed.title}
          onRetry={recordPress(failed.onRetry)}
          reportHref={failed.reportHref}
        >
          {failed.children}
        </FailedState>
      ) : view === 'no-match' && noMatch ? (
        <NoMatch
          title={noMatch.title}
          headingLevel={noMatch.headingLevel}
          onClearFilters={recordPress(noMatch.onClearFilters)}
        >
          {noMatch.children}
        </NoMatch>
      ) : view === 'empty' ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          headingLevel={empty.headingLevel}
          actions={empty.actions}
        >
          {empty.children}
        </EmptyState>
      ) : (
        <table className="xr-table">
          <caption className="xr-sr">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" {...headerCellProps(primary.headerCellProps)}>
                {primary.header}
              </th>
              {columns.map((column) =>
                sort && column === sorted ? (
                  // B1-10 `th[aria-sort]` with its sort button, plus the header's words alone for
                  // labelled-row mode, where the product layer hides the button (PF-01).
                  <th
                    key={column.key}
                    scope="col"
                    {...column.headerCellProps}
                    aria-sort={sort.direction}
                  >
                    <SortButton
                      column={column}
                      sort={sort}
                      onPress={(next) => press(() => sort.onSortChange(next), true)}
                      className="xr-x-th-sort"
                    >
                      {column.header}
                    </SortButton>
                    <span className="xr-x-th-text">{column.header}</span>
                  </th>
                ) : (
                  <th key={column.key} scope="col" {...headerCellProps(column.headerCellProps)}>
                    {column.header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const state = rowState?.(row);
              const sub = primary.sub?.(row);
              return (
                <tr key={rowKey(row)} className={state ? `is-${state}` : undefined}>
                  <td className="is-primary">
                    <Link
                      href={primary.href(row)}
                      className={primary.linkClassName}
                      aria-label={primary.linkLabel?.(row)}
                    >
                      {primary.title(row)}
                    </Link>
                    {filled(sub) ? <span className="xr-sub">{sub}</span> : null}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={dataLabel(column)}
                      className={column.className}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </LoadingState>
  );
}
