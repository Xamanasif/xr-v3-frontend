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

import { Link } from '../foundation/links.js';
import { EmptyState, FailedState, LoadingState, NoMatch, Skeleton } from '../foundation/states.js';
import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';

/** A slot draws only when it holds something: `undefined`, `null`, `false` and `''` draw nothing. */
function filled(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/**
 * Extra attributes on a column's `th[scope="col"]`. This is the extension point for the sortable
 * column of WP-0.7 (`aria-sort`, Appendix E §7.1 PF-01); DataTable itself never sorts.
 */
export type DataTableHeaderCellProps = Pick<
  ThHTMLAttributes<HTMLTableCellElement>,
  'aria-sort' | 'id'
>;

/** One data column after the primary one (a `td[data-label]` per row). */
export interface DataTableColumn<Row> {
  /** Unique within the table (the React key of the header and of each cell). */
  readonly key: string;
  /**
   * The `th[scope="col"]` content: the column's words ("Institution and contact person"), or a
   * visually hidden name for an action column (`<VisuallyHidden>Action</VisuallyHidden>`, B2-04).
   * WP-0.7 passes its sort button and text here.
   */
  readonly header: ReactNode;
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
 * match"). Sorting is WP-0.7 (`headerCellProps`, `ListToolbar` `sortBar`).
 *
 * "Clear filters" (no match) and "Try again" (failed) go away with their own state. When the
 * pressed one had focus, focus then moves to the first row's link, or, while there is none
 * (loading, empty), to the container, which takes `tabindex="-1"` until focus moves on — also
 * when the caller acts in a later commit (a transition, a busy render first). PROVISIONAL: no
 * board draws where focus goes.
 */
export function DataTable<Row>({
  caption,
  primary,
  columns,
  rows,
  rowKey,
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
  /** The focused "Clear filters" or "Try again" that was pressed, until it has gone. */
  const pressed = useRef<HTMLElement | null>(null);
  /** The container holds rescued focus (`tabindex="-1"` while it does). */
  const [holdsFocus, setHoldsFocus] = useState(false);

  const recordPress = (action: () => void) => () => {
    const active = document.activeElement;
    // Only a control that had focus can lose it (a mouse press in Safari does not focus).
    pressed.current =
      active instanceof HTMLElement && wrap.current?.contains(active) ? active : null;
    action();
  };

  // After every commit, before paint, so focus is never seen resting on the page body. The
  // caller may change the state in a later commit than the press (a transition's urgent render
  // or a busy render comes first), so the rescue waits until the pressed control has gone.
  useLayoutEffect(() => {
    const control = pressed.current;
    if (control === null || control.isConnected) return;
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

  const view: View = loading
    ? 'loading'
    : failed
      ? 'failed'
      : rows.length > 0
        ? 'table'
        : filtered && noMatch
          ? 'no-match'
          : 'empty';
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
              <th scope="col" {...primary.headerCellProps}>
                {primary.header}
              </th>
              {columns.map((column) => (
                <th key={column.key} scope="col" {...column.headerCellProps}>
                  {column.header}
                </th>
              ))}
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
