/**
 * DataTable — markup contract, behaviour and accessibility (Appendix E §3.3 DataTable, §5.2, §5.5,
 * §8; Appendix F WP-0.6 acceptance 2–4). Sources: board 03 "Search, filter, segmented and tabs"
 * (the list rows: primary cell link + `xr-sub`, `td[data-label]`) and "Decision panel and
 * editable table" (`tr.is-changed`, `tr.is-error`); B1-10 "SA-02 Requests · 1440 · interactive"
 * (caption, `th[scope=col]`, the reference link and the `xr-num` date cell), "Loading", "Empty ·
 * no requests yet", "No match" and "Failed + retry"; B2-03 "After SACC-0310 · 9 Oct 2026" (a
 * complete `xw-table-flush` table) and "IA-16 Course codes tab · 1440 · interactive" (a board
 * context class on the wrap, `xw-edit`).
 *
 * Not emitted, as everywhere in @xr/ui: the boards' inline styles (the row link's
 * `font-weight:700`, the 40476B empty line, the skeleton grids). Board variances, each asserted
 * below: (1) board 03's toolbar table draws `th` without `scope` (617 product `th` carry it);
 * (2) B1-10 "Failed + retry" draws the empty pattern with a primary "Try again" and no "Report a
 * problem", where board 04 "State grammar" and board 03 draw the error notice the WP-0.6 states
 * row asks for (FailedState); (3) every state keeps one container with its status region mounted
 * (§5.5), so a `span.xr-sr[role=status]`, empty unless loading, precedes the table or state.
 * The labelled-row mode below 760 px of content is CSS (container query): proven in
 * apps/specimens/e2e/components-data.spec.ts.
 *
 * Sorting (WP-0.7; PF-01; Appendix E §7.1; START-HERE Known exception 1): B1-10 "SA-02 Requests ·
 * 1440 · interactive" draws one sortable column, `th[aria-sort]` > "Received" text button with a
 * chevron and an `xr-sr` suffix; B1-10 "Filtered · Under review", "Mobile 375" and "Mobile 375 ·
 * More filters open" draw it clipped but focusable (B8-03 "Open finding — B1-10 at 375"; B8-08
 * "B1-10 sort button at 375"). Which control shows at which content width is CSS: proven in
 * apps/specimens/e2e/datatable-sort.spec.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState, useTransition } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormatSet } from '../foundation/format-badge.js';
import { IdChip } from '../foundation/id-chip.js';
import { StatusPill } from '../foundation/status-pill.js';
import { VisuallyHidden } from '../foundation/typography.js';
import {
  assertNoAxeViolations,
  boardText,
  canonicalMarkup,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import {
  DataTable,
  DataTableSortBar,
  type DataTableColumn,
  type DataTableProps,
  type DataTableSort,
  type DataTableSortableColumn,
  type DataTableSortDirection,
  type DataTableSorting,
} from './data-table.js';
import { ListToolbar } from './list-toolbar.js';

const FIND: BoardSource = { board: '03', frame: 'Search, filter, segmented and tabs' };
const EDITABLE: BoardSource = { board: '03', frame: 'Decision panel and editable table' };
const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const LOADING: BoardSource = { board: 'B1-10', frame: 'Loading' };
const EMPTY: BoardSource = { board: 'B1-10', frame: 'Empty · no requests yet' };
const NO_MATCH: BoardSource = { board: 'B1-10', frame: 'No match' };
const FAILED: BoardSource = { board: 'B1-10', frame: 'Failed + retry' };
const FLUSH: BoardSource = { board: 'B2-03', frame: 'After SACC-0310 · 9 Oct 2026' };

const svg = (d: string) =>
  `<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
const MINUS = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8';
const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4';
const REQUESTS_ICON =
  'M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20';

/* ------------------------------------------------------------------------------------------ */
/* Board 03 students (the toolbar specimen's table).                                            */
/* ------------------------------------------------------------------------------------------ */

interface Student {
  readonly name: string;
  readonly id: string;
  readonly course: string;
  readonly status: string;
}

const STUDENTS: readonly Student[] = [
  { name: 'Priya Natarajan', id: 'GIT-2026-0431', course: 'ME ZG523', status: 'No access yet' },
  { name: 'Kiran Rao', id: 'GIT-2026-0440', course: 'ME ZG523', status: 'No access yet' },
];

const STUDENT_COLUMNS: readonly DataTableColumn<Student>[] = [
  { key: 'course', header: 'Course', cell: (row) => row.course },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <StatusPill tone="neutral">{row.status}</StatusPill>,
  },
];

function studentTable(overrides: Partial<DataTableProps<Student>> = {}) {
  return (
    <DataTable<Student>
      caption="Students"
      primary={{
        key: 'student',
        header: 'Student',
        href: () => '#h-find',
        title: (row) => row.name,
        sub: (row) => row.id,
      }}
      columns={STUDENT_COLUMNS}
      rows={STUDENTS}
      rowKey={(row) => row.id}
      loadingLabel="Loading students"
      empty={{ icon: 'studentsPeople', title: 'No students yet' }}
      {...overrides}
    />
  );
}

/* ------------------------------------------------------------------------------------------ */
/* B1-10 requests.                                                                              */
/* ------------------------------------------------------------------------------------------ */

interface Request {
  readonly ref: string;
  readonly inst: string;
  readonly contact: string;
  readonly type: string;
  readonly route: string;
  readonly date: string;
}

const REQ_0042: Request = {
  ref: 'REQ-0042',
  inst: 'Godavari Institute of Technology',
  contact: 'Meera Iyer',
  type: 'New access',
  route: 'Not set yet',
  date: '2 Oct 2026',
};

const REQUEST_COLUMNS: readonly DataTableColumn<Request>[] = [
  {
    key: 'inst',
    header: 'Institution and contact person',
    cell: (row) => (
      <>
        {row.inst}
        <span className="xr-sub">{row.contact}</span>
      </>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    cell: (row) => (
      <>
        {row.type}
        <span className="xr-sub">{row.route}</span>
      </>
    ),
  },
  { key: 'date', header: 'Received', className: 'xr-num', cell: (row) => row.date },
];

function requestTable(overrides: Partial<DataTableProps<Request>> = {}) {
  return (
    <DataTable<Request>
      caption="Institutional access requests"
      primary={{
        key: 'ref',
        header: 'Reference',
        href: () => 'B1-11-SA-Decision.dc.html',
        title: (row) => row.ref,
        linkLabel: (row) => `Open request ${row.ref}, ${row.inst}`,
        linkClassName: 'xr-id',
      }}
      columns={REQUEST_COLUMNS}
      rows={[REQ_0042]}
      rowKey={(row) => row.ref}
      loadingLabel="Loading requests"
      empty={{
        icon: 'requests',
        title: 'No requests yet',
        children: 'Requests that institutions send from the public site appear here.',
      }}
      noMatch={{ title: 'No requests match these filters', onClearFilters: () => {} }}
      {...overrides}
    />
  );
}

const REQ_0042_LINK = 'Open request REQ-0042, Godavari Institute of Technology';

/** B1-10 "No match" as a caller drives it: "Clear filters" brings the rows back (or in a transition). */
function ClearableTable({ deferred = false }: { readonly deferred?: boolean }) {
  const [filtered, setFiltered] = useState(true);
  const [, startTransition] = useTransition();
  const clear = () => {
    if (deferred) startTransition(() => setFiltered(false));
    else setFiltered(false);
  };
  return requestTable({
    rows: filtered ? [] : [REQ_0042, { ...REQ_0042, ref: 'REQ-0041' }],
    filtered,
    noMatch: { title: 'No requests match these filters', onClearFilters: clear },
  });
}

/** B1-10 "Failed + retry" as a caller drives it: "Try again" sets `loading`; the rows arrive a tick later. */
function RetryingTable() {
  const [mode, setMode] = useState<'failed' | 'loading' | 'loaded'>('failed');
  const retry = () => {
    setMode('loading');
    setTimeout(() => setMode('loaded'), 0);
  };
  return requestTable({
    loading: mode === 'loading',
    rows: mode === 'loaded' ? [REQ_0042] : [],
    failed:
      mode === 'failed' ? { title: 'We couldn’t load the requests', onRetry: retry } : undefined,
  });
}

/** Lets a caller's later tick run. */
const nextTick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

/** Fills a board template's `{{ r.<name> }}` slots with a row's values. */
function fill(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{\{ r\.(\w+) \}\}/g, (_, name: string) => values[name] ?? '');
}

describe('DataTable markup contract', () => {
  it('board 03: the primary cell holds the row link and its xr-sub line; the others are labelled', () => {
    const { container } = render(studentTable());
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expectRenderedAsDrawn(
      rows[0]!,
      FIND,
      `<tr><td class="is-primary"><a href="#h-find">Priya Natarajan</a><span class="xr-sub">GIT-2026-0431</span></td><td data-label="Course">ME ZG523</td><td data-label="Status"><span class="xr-status">${svg(MINUS)}No access yet</span></td></tr>`,
    );
    expectRenderedAsDrawn(
      rows[1]!,
      FIND,
      `<tr><td class="is-primary"><a href="#h-find">Kiran Rao</a><span class="xr-sub">GIT-2026-0440</span></td><td data-label="Course">ME ZG523</td><td data-label="Status"><span class="xr-status">${svg(MINUS)}No access yet</span></td></tr>`,
    );
  });

  it('board variance: board 03 draws the head cells without scope; the product boards and DataTable use th[scope=col]', () => {
    expectBoardDraws(
      FIND,
      '<thead><tr><th>Student</th><th>Course</th><th>Status</th></tr></thead>',
    );
    const { container } = render(studentTable());
    expect(normaliseMarkup(container.querySelector('thead')!.outerHTML)).toBe(
      '<thead><tr><th scope="col">Student</th><th scope="col">Course</th><th scope="col">Status</th></tr></thead>',
    );
  });

  it('B1-10: visually hidden caption, scoped heads, the reference link named in full, the xr-num date', () => {
    const head =
      '<caption class="xr-sr">Institutional access requests</caption><thead><tr><th scope="col">Reference</th><th scope="col">Institution and contact person</th>';
    expectBoardDraws(REQUESTS, head);
    const { container } = render(requestTable());
    const table = container.querySelector('table.xr-table')!;
    expect(normaliseMarkup(table.innerHTML)).toContain(normaliseMarkup(head));
    // The row template as drawn, with the inline link style (not emitted) left out.
    const primary =
      '<td class="is-primary"><a class="{{ r.linkCls }}" href="{{ r.href }}" aria-label="{{ r.aria }}" style="font-weight:700;color:#1F4FD8">{{ r.ref }}</a></td>';
    const inst =
      '<td data-label="Institution and contact person">{{ r.inst }}<span class="xr-sub">{{ r.contact }}</span></td>';
    const type = '<td data-label="Type">{{ r.type }}<span class="xr-sub">{{ r.route }}</span></td>';
    const received = '<td data-label="Received" class="xr-num">{{ r.date }}</td>';
    expectBoardDraws(REQUESTS, primary, inst, type, received);
    const values = {
      linkCls: 'xr-id',
      href: 'B1-11-SA-Decision.dc.html',
      aria: 'Open request REQ-0042, Godavari Institute of Technology',
      ...REQ_0042,
    };
    const cells = [...container.querySelectorAll('tbody tr:first-child > td')];
    expect(canonicalMarkup(cells[0]!.outerHTML)).toBe(
      canonicalMarkup(fill(primary, values).replace(' style="font-weight:700;color:#1F4FD8"', '')),
    );
    expect(normaliseMarkup(cells[1]!.outerHTML)).toBe(normaliseMarkup(fill(inst, values)));
    expect(normaliseMarkup(cells[2]!.outerHTML)).toBe(normaliseMarkup(fill(type, values)));
    expect(normaliseMarkup(cells[3]!.outerHTML)).toBe(normaliseMarkup(fill(received, values)));
  });

  it('B2-03: a complete xw-table-flush table, with an action-free sr-only header and an xr-sub ID', () => {
    const excerpt =
      '<table class="xr-table"><caption class="xr-sr">Students given access under ACC-0107</caption><thead><tr><th scope="col">Student</th><th scope="col">Experiment</th><th scope="col">Given</th><th scope="col">Status</th></tr></thead><tbody><tr><td class="is-primary"><a href="B2-06-People.dc.html" style="font-weight:700">Rahul Verma</a><span class="xr-sub">GIT-2026-0418</span></td><td data-label="Experiment">Shell-and-Tube Heat Exchanger<span class="xr-sub"><span class="xr-fmt-set"><span class="xr-fmt xr-fmt--compact"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v9H2zM2 6.5h12"></path></svg>WEB</span><span class="xr-fmt xr-fmt--compact"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.75 5h12.5v6H10.25L8 9.1 5.75 11H1.75z"></path></svg>VR</span></span></span></td><td data-label="Given">9 Oct 2026 · individually<span class="xr-sub xr-id">SACC-0310</span></td><td data-label="Status"><span class="xr-status xr-status--ok"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Active</span></td></tr></tbody></table>';
    expectBoardDraws(FLUSH, `<div class="xr-table-wrap xw-table-flush">${excerpt}`);
    const { container } = render(
      <DataTable
        flush
        caption="Students given access under ACC-0107"
        primary={{
          key: 'student',
          header: 'Student',
          href: () => 'B2-06-People.dc.html',
          title: () => 'Rahul Verma',
          sub: () => 'GIT-2026-0418',
        }}
        columns={[
          {
            key: 'experiment',
            header: 'Experiment',
            cell: () => (
              <>
                Shell-and-Tube Heat Exchanger
                <span className="xr-sub">
                  <FormatSet formats={['WEB', 'VR']} compact />
                </span>
              </>
            ),
          },
          {
            key: 'given',
            header: 'Given',
            cell: () => (
              <>
                9 Oct 2026 · individually
                <IdChip className="xr-sub">SACC-0310</IdChip>
              </>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            cell: () => <StatusPill tone="ok">Active</StatusPill>,
          },
        ]}
        rows={['SACC-0310']}
        rowKey={(row) => row}
        loadingLabel="Loading students"
        empty={{ icon: 'studentAccess', title: 'No students given access yet' }}
      />,
    );
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveClass('xr-table-wrap xw-table-flush', { exact: true });
    expect(normaliseMarkup(wrap.querySelector('table')!.outerHTML)).toBe(
      normaliseMarkup(excerpt.replace(' style="font-weight:700"', '')),
    );
    // The one addition (§5.5): the mounted, empty status region before the table.
    expect(normaliseMarkup(wrap.firstElementChild!.outerHTML)).toBe(
      '<span class="xr-sr" role="status"></span>',
    );
  });

  it('board 03: changed and error rows are tinted by tr.is-changed / tr.is-error', () => {
    expectBoardDraws(
      EDITABLE,
      '<tr class="is-changed"><td class="is-primary">Fluid Mechanics</td>',
      '<tr class="is-error"><td class="is-primary">Heat Transfer Lab</td>',
    );
    const { container } = render(
      studentTable({
        rows: [...STUDENTS, { ...STUDENTS[0]!, id: 'GIT-2026-0377', name: 'Arun Kumar' }],
        rowState: (row) =>
          row.id === 'GIT-2026-0440' ? 'changed' : row.id === 'GIT-2026-0377' ? 'error' : undefined,
      }),
    );
    const rows = [...container.querySelectorAll('tbody tr')];
    expect(rows.map((row) => row.getAttribute('class'))).toEqual([null, 'is-changed', 'is-error']);
  });
});

describe('DataTable columns', () => {
  it('data-label defaults to a string header; an explicit label wins; null draws none', () => {
    const { container } = render(
      studentTable({
        columns: [
          { key: 'course', header: 'Course', cell: (row) => row.course },
          {
            key: 'status',
            header: <span>Status</span>,
            label: 'Status',
            cell: (row) => row.status,
          },
          {
            key: 'action',
            header: <VisuallyHidden>Action</VisuallyHidden>,
            label: null,
            cell: (row) => <button type="button">Give access to {row.name}</button>,
          },
        ],
      }),
    );
    const cells = [...container.querySelectorAll('tbody tr:first-child > td')];
    expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
      null,
      'Course',
      'Status',
      null,
    ]);
    expect(normaliseMarkup(container.querySelectorAll('th')[3]!.outerHTML)).toBe(
      '<th scope="col"><span class="xr-sr">Action</span></th>',
    );
  });

  it('a column can add aria-sort to its th (the WP-0.7 extension point); DataTable never sorts', () => {
    const rows = [REQ_0042, { ...REQ_0042, ref: 'REQ-0041', date: '30 Sep 2026' }];
    const { container } = render(
      requestTable({
        rows,
        columns: REQUEST_COLUMNS.map((column) =>
          column.key === 'date'
            ? { ...column, headerCellProps: { 'aria-sort': 'descending' as const } }
            : column,
        ),
      }),
    );
    expect(container.querySelectorAll('th')[3]).toHaveAttribute('aria-sort', 'descending');
    expect(
      [...container.querySelectorAll('tbody td.is-primary a')].map((link) => link.textContent),
    ).toEqual(['REQ-0042', 'REQ-0041']);
  });

  it('every row opens its record: one link per row, through the injected link component', () => {
    render(
      studentTable({
        primary: {
          key: 'student',
          header: 'Student',
          href: (row) => `/institute-admin/people/students/${row.id}`,
          title: (row) => row.name,
        },
      }),
    );
    const table = screen.getByRole('table', { name: 'Students' });
    const links = within(table).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Priya Natarajan', '/institute-admin/people/students/GIT-2026-0431'],
      ['Kiran Rao', '/institute-admin/people/students/GIT-2026-0440'],
    ]);
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Student', 'Course', 'Status']);
  });

  it('B1-10: the link name says what opens', () => {
    render(requestTable());
    expect(
      screen.getByRole('link', { name: 'Open request REQ-0042, Godavari Institute of Technology' }),
    ).toHaveClass('xr-id', { exact: true });
  });
});

describe('DataTable states', () => {
  it('B1-10 "Loading": the busy table wrap names what is loading, with skeleton rows', () => {
    expectBoardDraws(
      LOADING,
      '<div class="xr-table-wrap" aria-busy="true"><span class="xr-sr" role="status">Loading requests</span><div style="display:grid;grid-template-columns:110px 1.4fr 1fr 120px 120px 160px;gap:20px;padding:18px 16px;border-top:1px solid #E1E4F3"><span class="xr-skel"></span><span class="xr-skel"></span><span class="xr-skel"></span><span class="xr-skel"></span><span class="xr-skel"></span><span class="xr-skel"></span></div>',
    );
    const { container } = render(requestTable({ loading: true }));
    const wrap = container.firstElementChild!;
    expect(normaliseMarkup(wrap.outerHTML)).toMatch(
      /^<div class="xr-table-wrap" aria-busy="true"><span class="xr-sr" role="status">Loading requests<\/span><table class="xr-table" aria-hidden="true"><tbody>/,
    );
    // Variance (no inline styles): the bars sit in table rows — B1-10's 5 rows, one per column.
    const skeletonRows = wrap.querySelectorAll('tbody tr');
    expect(skeletonRows).toHaveLength(5);
    for (const row of skeletonRows) {
      expect(row.querySelectorAll('td > span.xr-skel')).toHaveLength(4);
    }
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Loading requests');
  });

  it('B1-10 "Empty · no requests yet": the empty pattern in a section', () => {
    const line = 'Requests that institutions send from the public site appear here.';
    const drawn = `<div class="xr-section"><div class="xr-empty"><span class="xr-empty-icon">${svg(REQUESTS_ICON)}</span><h2 class="xr-h3">No requests yet</h2><p class="xr-body" style="color:#40476B">${line}</p></div></div>`;
    expectBoardDraws(EMPTY, drawn);
    const { container } = render(requestTable({ rows: [] }));
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveClass('xr-section', { exact: true });
    expect(wrap).not.toHaveAttribute('aria-busy');
    expect(normaliseMarkup(wrap.querySelector('.xr-empty')!.outerHTML)).toBe(
      normaliseMarkup(
        `<div class="xr-empty"><span class="xr-empty-icon">${svg(REQUESTS_ICON)}</span><h2 class="xr-h3">No requests yet</h2><p class="xr-body">${line}</p></div>`,
      ),
    );
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('B1-10 "No match": when filtered, the Search icon and one way back, "Clear filters"', () => {
    const drawn = `<div class="xr-empty"><span class="xr-empty-icon">${svg(SEARCH)}</span><h2 class="xr-h3">No requests match these filters</h2><button type="button" class="xr-btn xr-btn--secondary" onClick="{{ q.clear }}">Clear filters</button></div>`;
    expectBoardDraws(NO_MATCH, `<div class="xr-section">${drawn}</div>`);
    const onClearFilters = vi.fn();
    const { container } = render(
      requestTable({
        rows: [],
        filtered: true,
        noMatch: { title: 'No requests match these filters', onClearFilters },
      }),
    );
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveClass('xr-section', { exact: true });
    expect(normaliseMarkup(wrap.querySelector('.xr-empty')!.outerHTML)).toBe(
      normaliseMarkup(drawn.replace(' onClick="{{ q.clear }}"', '')),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('empty, not filtered: the empty state even when a no-match state is given', () => {
    render(requestTable({ rows: [], filtered: false }));
    expect(screen.getByRole('heading', { name: 'No requests yet' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('failed: the error notice in place with "Try again" and "Report a problem" (board 04 grammar; B1-10 variance)', () => {
    expectBoardDraws(
      FAILED,
      '<h2 class="xr-h3">We couldn’t load the requests</h2><p class="xr-body" style="color:#40476B">Nothing has changed. Try again.</p><button type="button" class="xr-btn xr-btn--primary" onClick="{{ q.retry }}">',
    );
    expectBoardDraws(
      { board: '04', frame: 'State grammar · one pattern per state' },
      'Error notice in place; Try again; Report a problem',
    );
    const onRetry = vi.fn();
    const { container } = render(
      requestTable({
        failed: {
          title: 'We couldn’t load the requests',
          children: 'Nothing has changed. Try again.',
          onRetry,
          reportHref: '/super-admin/help/report',
        },
      }),
    );
    const wrap = container.firstElementChild!;
    expect(wrap).not.toHaveAttribute('class');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('xr-notice xr-notice--err', { exact: true });
    expect(alert).toHaveTextContent('We couldn’t load the requests');
    expect(screen.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '/super-admin/help/report',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('flush while loading: the busy wrap keeps xw-table-flush', () => {
    const { container } = render(requestTable({ loading: true, flush: true }));
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveClass('xr-table-wrap xw-table-flush', { exact: true });
    expect(wrap).toHaveAttribute('aria-busy', 'true');
  });

  it('board context classes follow the wrap class (B2-03 draws xr-table-wrap xw-edit)', () => {
    expectBoardDraws(
      { board: 'B2-03', frame: 'IA-16 Course codes tab · 1440 · interactive' },
      '<div class="xr-table-wrap xw-edit">',
    );
    const { container } = render(requestTable({ className: 'xw-edit' }));
    expect(container.firstElementChild).toHaveClass('xr-table-wrap xw-edit', { exact: true });
  });

  it('failed without a report address: "Try again" only, as B1-10 "Failed + retry" draws it', () => {
    render(requestTable({ failed: { title: 'We couldn’t load the requests', onRetry: () => {} } }));
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Report a problem' })).toBeNull();
  });

  it('flush: empty and no-match draw no section of their own (sections are never nested)', () => {
    const { container } = render(requestTable({ rows: [], flush: true }));
    expect(container.firstElementChild).not.toHaveAttribute('class');
    expect(container.querySelector('.xr-section')).toBeNull();
    expect(container.querySelector('.xr-empty')).not.toBeNull();
  });

  it('one status region stays mounted through loading, loaded, failed and a retry (§5.5)', () => {
    const { container, rerender } = render(requestTable({ loading: true }));
    const wrap = container.firstElementChild!;
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading requests');
    rerender(requestTable());
    expect(container.firstElementChild).toBe(wrap);
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(wrap).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('table', { name: 'Institutional access requests' })).toBeVisible();
    rerender(
      requestTable({ failed: { title: 'We couldn’t load the requests', onRetry: () => {} } }),
    );
    expect(container.firstElementChild).toBe(wrap);
    expect(screen.getByRole('status')).toBe(status);
    rerender(requestTable({ loading: true }));
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Loading requests');
    expect(wrap).toHaveAttribute('aria-busy', 'true');
    expect(wrap).toHaveClass('xr-table-wrap', { exact: true });
  });
});

describe('DataTable focus after "Clear filters" and "Try again" (PROVISIONAL: no board draws it)', () => {
  it.each([
    ['at once', false],
    ['in a transition', true],
  ])(
    'no match: the focused "Clear filters" goes with its state (%s); focus moves to the first row link, not the page',
    async (_when, deferred) => {
      render(<ClearableTable deferred={deferred} />);
      const clear = screen.getByRole('button', { name: 'Clear filters' });
      act(() => clear.focus());
      await act(async () => clear.click());
      expect(clear).not.toBeInTheDocument();
      expect(screen.getAllByRole('link')).toHaveLength(2);
      expect(document.body).not.toHaveFocus();
      expect(screen.getByRole('link', { name: REQ_0042_LINK })).toHaveFocus();
    },
  );

  it('failed: the focused "Try again" goes with its notice; the busy container takes focus until it moves on', async () => {
    const { container } = render(<RetryingTable />);
    const wrap = container.firstElementChild!;
    expect(wrap).not.toHaveAttribute('tabindex');
    const retry = screen.getByRole('button', { name: 'Try again' });
    act(() => retry.focus());
    act(() => retry.click());
    expect(retry).not.toBeInTheDocument();
    expect(wrap).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading requests');
    expect(document.body).not.toHaveFocus();
    // A focus target only while it holds focus (tabindex=-1: not a Tab stop).
    expect(wrap).toHaveAttribute('tabindex', '-1');
    expect(wrap).toHaveFocus();
    await nextTick();
    // The rows arrive in the same container, which keeps focus; Tab goes on to the first row.
    expect(screen.getByRole('table', { name: 'Institutional access requests' })).toBeVisible();
    expect(wrap).toHaveFocus();
    const link = screen.getByRole('link', { name: REQ_0042_LINK });
    act(() => link.focus());
    // Focus moved on: the wrap is drawn as the boards draw it again.
    expect(wrap).not.toHaveAttribute('tabindex');
    expect(normaliseMarkup(wrap.outerHTML)).toMatch(
      /^<div class="xr-table-wrap"><span class="xr-sr" role="status"><\/span><table class="xr-table">/,
    );
  });

  it('focus is left alone when the pressed control did not have it', () => {
    render(
      <>
        <input aria-label="Elsewhere" />
        <ClearableTable />
      </>,
    );
    const elsewhere = screen.getByRole('textbox', { name: 'Elsewhere' });
    act(() => elsewhere.focus());
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(elsewhere).toHaveFocus();
  });
});

describe('DataTable: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  const failed = {
    title: 'We couldn’t load the requests',
    children: 'Nothing has changed. Try again.',
    onRetry: () => {},
    reportHref: '#report',
  };

  it('emits only stylesheet classes in every state', () => {
    for (const element of [
      studentTable({ rowState: (row) => (row.id === 'GIT-2026-0440' ? 'changed' : 'error') }),
      requestTable(),
      requestTable({ flush: true }),
      requestTable({ loading: true }),
      requestTable({ rows: [] }),
      requestTable({ rows: [], filtered: true }),
      requestTable({ failed }),
    ]) {
      const { container, unmount } = render(<div>{element}</div>);
      expectStylesheetClassesOnly(container.firstElementChild!);
      unmount();
    }
  });

  it.each([
    ['table (board 03 rows)', studentTable()],
    ['table (B1-10 references, named links)', requestTable()],
    ['flush table', requestTable({ flush: true })],
    [
      'changed and error rows',
      studentTable({ rowState: (row) => (row.id === 'GIT-2026-0440' ? 'changed' : 'error') }),
    ],
    ['loading', requestTable({ loading: true })],
    ['empty', requestTable({ rows: [] })],
    ['no match', requestTable({ rows: [], filtered: true })],
    ['failed', requestTable({ failed })],
  ])('%s', async (_state, element) => {
    const { container } = render(element);
    await assertNoAxeViolations(container);
  });
});

/* ------------------------------------------------------------------------------------------ */
/* Sorting (WP-0.7): B1-10's sortable "Received" column and the PF-01 fix.                      */
/* ------------------------------------------------------------------------------------------ */

const FILTERED: BoardSource = { board: 'B1-10', frame: 'Filtered · Under review' };
const MOBILE: BoardSource = { board: 'B1-10', frame: 'Mobile 375' };
const MOBILE_MORE: BoardSource = { board: 'B1-10', frame: 'Mobile 375 · More filters open' };
const FINDING: BoardSource = { board: 'B8-03', frame: 'Open finding — B1-10 at 375' };
const LIMITATION: BoardSource = { board: 'B8-08', frame: 'B1-10 sort button at 375' };

const AUDIT = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'v46', 'audit');
const PRODUCT_CSS = join(import.meta.dirname, '..', 'styles', 'product.css');
const V46_FOUNDATION = join(import.meta.dirname, '..', 'styles', 'v46', 'xr-foundation.css');

const svg16 = (d: string) =>
  `<svg class="xr-ico xr-ico--16" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
/** B1-10's chevrons: down while "newest first" (`sortIcon: s.desc`), up while "oldest first". */
const CHEVRON_DOWN = 'M6 9.5l6 6 6-6';
const CHEVRON_UP = 'M6 14.5l6-6 6 6';
const NEWEST = 'Received, newest first. Change order';
const OLDEST = 'Received, oldest first. Change order';

/** B1-10's sortable column, "Received", with its own order words (`sortLabel`). */
const RECEIVED: DataTableSortableColumn<Request> = {
  key: 'date',
  header: 'Received',
  className: 'xr-num',
  cell: (row) => row.date,
  sortWords: { descending: 'newest first', ascending: 'oldest first' },
};

const SORTABLE_COLUMNS: readonly DataTableColumn<Request>[] = REQUEST_COLUMNS.map((column) =>
  column.key === 'date' ? RECEIVED : column,
);

/** B1-10's first three requests (`static get RQ()`) with the date the board sorts by (`iso`). */
const DATED: readonly (Request & { readonly iso: string })[] = [
  { ...REQ_0042, iso: '20261002' },
  {
    ref: 'REQ-0041',
    inst: 'Krishna College of Engineering',
    contact: 'S. Pillai',
    type: 'New access',
    route: 'Not set yet',
    date: '30 Sep 2026',
    iso: '20260930',
  },
  {
    ref: 'REQ-0040',
    inst: 'Konark Polytechnic',
    contact: 'R. Bhatt',
    type: 'Additional licences',
    route: 'External',
    date: '29 Sep 2026',
    iso: '20260929',
  },
];

/** The caller's order: B1-10 sorts by `iso`, newest first until the person changes it. */
function ordered(direction: DataTableSortDirection) {
  return [...DATED].sort((a, b) =>
    direction === 'descending' ? b.iso.localeCompare(a.iso) : a.iso.localeCompare(b.iso),
  );
}

/** A fixed order with a spy, for the markup and callback checks. */
function fixedSorting(
  direction: DataTableSortDirection,
  onSortChange: (sort: DataTableSort) => void = vi.fn(),
): DataTableSorting {
  return { column: 'date', direction, onSortChange };
}

/** B1-10 sorted by the caller, with or without changing it. */
function sortedTable(
  direction: DataTableSortDirection,
  overrides: Partial<DataTableProps<Request>> = {},
) {
  return requestTable({
    columns: SORTABLE_COLUMNS,
    rows: ordered(direction),
    sort: fixedSorting(direction),
    ...overrides,
  });
}

/**
 * B1-10 as a caller drives it: one sort state; the header button in the table and the sort bar in
 * the toolbar's status row share it; the caller sorts the rows.
 */
function SortableRequests({
  onSortChange,
}: {
  readonly onSortChange?: (sort: DataTableSort) => void;
}) {
  const [direction, setDirection] = useState<DataTableSortDirection>('descending');
  const sort: DataTableSorting = {
    column: 'date',
    direction,
    onSortChange: (next) => {
      onSortChange?.(next);
      setDirection(next.direction);
    },
  };
  const rows = ordered(direction);
  return (
    <>
      <ListToolbar
        status={`${rows.length} requests`}
        sortBar={<DataTableSortBar column={RECEIVED} sort={sort} />}
      />
      {requestTable({ columns: SORTABLE_COLUMNS, rows, sort })}
    </>
  );
}

/**
 * A caller that loads for the new order (not B1-10, which sorts in place): `onSortChange` shows
 * the loading state, and the reordered rows arrive a tick later.
 */
function ReloadingRequests() {
  const [state, setState] = useState<{
    readonly direction: DataTableSortDirection;
    readonly loading: boolean;
  }>({ direction: 'descending', loading: false });
  const sort: DataTableSorting = {
    column: 'date',
    direction: state.direction,
    onSortChange: (next) => {
      setState({ direction: next.direction, loading: true });
      setTimeout(() => setState({ direction: next.direction, loading: false }), 0);
    },
  };
  return requestTable({
    columns: SORTABLE_COLUMNS,
    rows: state.loading ? [] : ordered(state.direction),
    loading: state.loading,
    sort,
  });
}

const headerButton = (container: Element) =>
  container.querySelector<HTMLButtonElement>('th[aria-sort] > button.xr-x-th-sort')!;
const barButton = (container: Element) =>
  container.querySelector<HTMLButtonElement>('.xr-x-table-sortbar > button')!;
const references = (container: Element) =>
  [...container.querySelectorAll('tbody td.is-primary a')].map((link) => link.textContent);
/** The table's own status region (the toolbar's count is another `role=status`). */
const tableStatus = (container: Element) =>
  container.querySelector('.xr-table-wrap > [role="status"]')!;

/**
 * CSS without comments and with whitespace only where it separates selectors (a space before a
 * colon is a descendant combinator, `thead :is(…)`, and stays).
 */
function compactCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,()>])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/\s*!important/g, '!important')
    .replace(/;}/g, '}')
    .trim();
}

/** The bodies of every `@container <query>{…}` block in compact CSS. */
function containerBlocks(css: string, query: string): string[] {
  const bodies: string[] = [];
  const opening = `@container ${query}{`;
  for (let start = css.indexOf(opening); start >= 0; start = css.indexOf(opening, start + 1)) {
    let depth = 0;
    let end = start + opening.length - 1;
    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1;
      if (css[end] === '}') depth -= 1;
      if (depth === 0) break;
    }
    bodies.push(css.slice(start + opening.length, end));
  }
  return bodies;
}

describe('DataTable sorting: the B1-10 column and the PF-01 fix (WP-0.7)', () => {
  it('B1-10 draws one sortable column: th[aria-sort] > a "Received" text button with a chevron and the order in words', () => {
    expectBoardDraws(
      REQUESTS,
      `<th scope="col" aria-sort="{{ q.ariaSort }}"><button type="button" class="xr-btn xr-btn--text" style="min-height:32px;padding:0;color:#40476B;font-weight:700;text-decoration:none;font-size:14px" onClick="{{ q.toggleSort }}">Received<sc-if value="{{ q.sortIcon }}" hint-placeholder-val="{{ true }}">${svg16(CHEVRON_DOWN)}</sc-if><sc-if value="{{ q.sortAsc }}" hint-placeholder-val="{{ false }}">${svg16(CHEVRON_UP)}</sc-if><span class="xr-sr">, {{ q.sortLabel }}. Change order</span></button></th>`,
      "sortLabel: s.desc ? 'Received, newest first' : 'Received, oldest first', ariaSort: s.desc ? 'descending' : 'ascending'",
    );
    // The defect (BC13): B1-10 draws these frames below 760 px of content (672 and 343 px), where
    // the v46 sheet clips the head — which keeps its button in the tab order.
    expectBoardDraws(FILTERED);
    expectBoardDraws(MOBILE);
    expectBoardDraws(MOBILE_MORE);
    expect(readFileSync(V46_FOUNDATION, 'utf8')).toContain(
      '@container xr-content (max-width:759.98px){ .xr-table thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
    );
    expectBoardDraws(
      FINDING,
      'its “Received” sort button stays in the tab order, so a keyboard user can focus an invisible control',
      'Build: show the sort as a visible control above the rows below 760 px (B8-08).',
    );
    expectBoardDraws(
      LIMITATION,
      'Defer to the build — render the sort as a visible control above the labelled rows below 760 px',
    );
  });

  it('the header: th[aria-sort] > button.xr-x-th-sort + span.xr-x-th-text; the other heads are unchanged', () => {
    const { container } = render(sortedTable('descending'));
    expect(container.querySelectorAll('th[aria-sort]')).toHaveLength(1);
    expect(
      container.querySelectorAll('th[aria-sort] > button.xr-x-th-sort + span.xr-x-th-text'),
    ).toHaveLength(1);
    // As drawn, without the inline style (Appendix E §2.5: "Never copy the specimen inline style
    // of the B1-10 sort button"), named by aria-label rather than an xr-sr suffix (see below).
    expect(canonicalMarkup(container.querySelector('th[aria-sort]')!.outerHTML)).toBe(
      canonicalMarkup(
        `<th scope="col" aria-sort="descending"><button type="button" class="xr-btn xr-btn--text xr-x-th-sort" aria-label="${NEWEST}">Received${svg16(CHEVRON_DOWN)}</button><span class="xr-x-th-text">Received</span></th>`,
      ),
    );
    expect(normaliseMarkup(container.querySelector('thead')!.outerHTML)).toMatch(
      /^<thead><tr><th scope="col">Reference<\/th><th scope="col">Institution and contact person<\/th><th scope="col">Type<\/th><th /,
    );
    // The column's cells keep their label for labelled-row mode.
    expect(container.querySelector('tbody td.xr-num')).toHaveAttribute('data-label', 'Received');
  });

  it('the sort bar: div.xr-x-table-sortbar > a small text button with the order in words', () => {
    const { container } = render(
      <DataTableSortBar column={RECEIVED} sort={fixedSorting('descending')} />,
    );
    expect(canonicalMarkup(container.innerHTML)).toBe(
      canonicalMarkup(
        `<div class="xr-x-table-sortbar"><button type="button" class="xr-btn xr-btn--text xr-btn--sm" aria-label="${NEWEST}">Received, newest first${svg16(CHEVRON_DOWN)}</button></div>`,
      ),
    );
  });

  it('follows the documented mechanism (Appendix E §7.1): its classes and structure; aria-label names', () => {
    const text = readFileSync(join(AUDIT, 'Appendix-E-Visual-Strategy.md'), 'utf8');
    const section = text.slice(text.indexOf('### 7.1 B1-10 remediation'), text.indexOf('### 7.2'));
    for (const piece of [
      '<div class="xr-x-table-sortbar">',
      '<button type="button" class="xr-btn xr-btn--text xr-btn--sm">Received, newest first<svg class="xr-ico xr-ico--16" aria-hidden="true">',
      '<th scope="col" aria-sort="descending">',
      '<button type="button" class="xr-btn xr-btn--text xr-x-th-sort">Received<svg',
      '<span class="xr-x-th-text">Received</span>',
      "Name: 'Received, newest first. Change order'.",
    ]) {
      expect(section).toContain(piece);
    }
    // The sketch names each button with its visible words plus an xr-sr suffix. v46 `.xr-sr` is
    // position:absolute (blockified), and Chromium joins a block child's text with a space:
    // "Received , newest first. Change order" (measured in Chromium 1243, WP-0.7), as the boards'
    // own name reads "Received , Received, …" in derived/frame-index.json. The exact name needs
    // aria-label; the visible words stay at the start of it (WCAG 2.5.3 label in name).
    const { container } = render(
      <>
        <DataTableSortBar column={RECEIVED} sort={fixedSorting('descending')} />
        {sortedTable('descending')}
      </>,
    );
    for (const button of [headerButton(container), barButton(container)]) {
      expect(button).toHaveAttribute('aria-label', NEWEST);
      expect(button.querySelector('.xr-sr')).toBeNull();
      expect(button.textContent).toMatch(/^Received/);
      expect(NEWEST.startsWith(button.textContent!)).toBe(true);
    }
  });

  it('product.css gives the header button exactly the look B1-10 draws inline (WP-0.7 visual correction)', () => {
    // Every B1-10 table draws the same header button; its inline style is the evidence.
    const drawn =
      /<th scope="col" aria-sort="\{\{ (\w+)\.ariaSort \}\}"><button type="button" class="xr-btn xr-btn--text" style="([^"]+)"/g;
    const instances = [...boardText('B1-10').matchAll(drawn)];
    expect(instances.map(([, table]) => table)).toEqual([
      'q',
      'qx',
      'qf',
      'qr',
      'qn',
      'ql',
      'qe',
      'qz',
      'qm',
      'qmo',
    ]);
    const styles = instances.map(([, , style]) => style!);
    expect(new Set(styles).size).toBe(1);
    const declarations = (block: string) =>
      Object.fromEntries(
        block
          .split(';')
          .filter(Boolean)
          .map((declaration) => {
            const [name, value] = declaration.split(':');
            return [name!.trim(), value!.trim().toLowerCase()];
          }),
      );
    const boardLook = declarations(styles[0]!);
    expect(boardLook).toEqual({
      'min-height': '32px',
      padding: '0',
      color: '#40476b',
      'font-weight': '700',
      'text-decoration': 'none',
      'font-size': '14px',
    });
    // The product rule: the same declarations, on the sort button in a table head only.
    const product = compactCss(readFileSync(PRODUCT_CSS, 'utf8'));
    const rules = [...product.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(([, selector]) =>
      selector!.includes('xr-x-th-sort'),
    );
    const look = rules.filter(([, selector]) => selector!.trim() === '.xr-table th .xr-x-th-sort');
    expect(look).toHaveLength(1);
    expect(declarations(look[0]![2]!)).toEqual(boardLook);
    // No other sort-button rule sets anything but display.
    for (const [, selector, body] of rules) {
      if (selector!.trim() === '.xr-table th .xr-x-th-sort') continue;
      expect(Object.keys(declarations(body!))).toEqual(['display']);
    }
  });

  it('product.css holds the documented PF-01 sort rules (Appendix E §7.1), after the WP-0.5 guards', () => {
    const text = readFileSync(join(AUDIT, 'Appendix-E-Visual-Strategy.md'), 'utf8');
    const section = text.slice(text.indexOf('### 7.1 B1-10 remediation'), text.indexOf('### 7.2'));
    // The second css block of §7.1 (the first quotes the v46 clip rule): "xr.product — PF-01".
    const fence = section.indexOf('```css', section.indexOf('```css') + 6);
    const documented = compactCss(section.slice(fence + 6, section.indexOf('```', fence + 6)));
    expect(documented).toContain('.xr-x-table-sortbar');
    const product = compactCss(readFileSync(PRODUCT_CSS, 'utf8'));
    const query = '(max-width:759.98px)';
    const narrowRules = containerBlocks(documented, `xr-content${query}`)
      .join('')
      .split('}')
      .filter((rule) => /xr-x-/.test(rule))
      .map((rule) => `${rule}}`);
    expect(narrowRules).toEqual([
      '.xr-x-table-sortbar{display:flex!important;align-items:center;gap:8px}',
      '.xr-table .xr-x-th-sort{display:none!important}',
      '.xr-table .xr-x-th-text{display:inline!important}',
    ]);
    const productNarrow = containerBlocks(product, `xr-content${query}`).join('');
    for (const rule of narrowRules) expect(productNarrow).toContain(rule);
    // Outside any container query: the bar and the header's words are not displayed.
    const productTop = product.replace(/@container[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
    for (const rule of [
      '.xr-x-table-sortbar{display:none}',
      '.xr-table .xr-x-th-text{display:none}',
    ]) {
      expect(documented).toContain(rule);
      expect(productTop).toContain(rule);
    }
    // The WP-0.5 guard for every control in a clipped .xr-table head stays as it was.
    expect(productNarrow).toContain(
      ".xr-table thead :is(a,button,input,select,textarea,summary,[tabindex]:not([tabindex='-1'])){display:none!important}",
    );
  });

  it.each([
    ['descending', NEWEST, CHEVRON_DOWN, 'Received, newest first'],
    ['ascending', OLDEST, CHEVRON_UP, 'Received, oldest first'],
  ] as const)(
    '%s: both controls are named exactly "%s", "Received" once; aria-sort and the chevron follow',
    (direction, name, chevron, words) => {
      const { container } = render(
        <>
          <DataTableSortBar column={RECEIVED} sort={fixedSorting(direction)} />
          {sortedTable(direction)}
        </>,
      );
      const buttons = screen.getAllByRole('button', { name });
      expect(buttons).toEqual([barButton(container), headerButton(container)]);
      for (const button of buttons) {
        expect(button.getAttribute('aria-label')!.match(/Received/g)).toHaveLength(1);
        expect(button.querySelector('path')).toHaveAttribute('d', chevron);
      }
      expect(barButton(container)).toHaveTextContent(new RegExp(`^${words}$`));
      expect(headerButton(container)).toHaveTextContent(/^Received$/);
      expect(container.querySelector('th[aria-sort]')).toHaveAttribute('aria-sort', direction);
    },
  );

  it('both controls call onSortChange with the reversed order, from either direction', () => {
    for (const [direction, reversed] of [
      ['descending', 'ascending'],
      ['ascending', 'descending'],
    ] as const) {
      const onSortChange = vi.fn();
      const sort = fixedSorting(direction, onSortChange);
      const { container, unmount } = render(
        <>
          <DataTableSortBar column={RECEIVED} sort={sort} />
          {sortedTable(direction, { sort })}
        </>,
      );
      fireEvent.click(headerButton(container));
      fireEvent.click(barButton(container));
      expect(onSortChange.mock.calls).toEqual([
        [{ column: 'date', direction: reversed }],
        [{ column: 'date', direction: reversed }],
      ]);
      unmount();
    }
  });

  it('a caller that sorts: either control reverses the rows, flips aria-sort and renames both controls', () => {
    const onSortChange = vi.fn();
    const { container } = render(<SortableRequests onSortChange={onSortChange} />);
    const th = container.querySelector('th[aria-sort]')!;
    expect(references(container)).toEqual(['REQ-0042', 'REQ-0041', 'REQ-0040']);
    expect(th).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('button', { name: NEWEST })).toHaveLength(2);

    act(() => headerButton(container).click());
    expect(references(container)).toEqual(['REQ-0040', 'REQ-0041', 'REQ-0042']);
    expect(container.querySelector('th[aria-sort]')).toBe(th);
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getAllByRole('button', { name: OLDEST })).toHaveLength(2);
    expect(screen.queryAllByRole('button', { name: NEWEST })).toHaveLength(0);
    expect(barButton(container)).toHaveTextContent('Received, oldest first');

    act(() => barButton(container).click());
    expect(references(container)).toEqual(['REQ-0042', 'REQ-0041', 'REQ-0040']);
    expect(th).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getAllByRole('button', { name: NEWEST })).toHaveLength(2);
    expect(onSortChange.mock.calls).toEqual([
      [{ column: 'date', direction: 'ascending' }],
      [{ column: 'date', direction: 'descending' }],
    ]);
    // Every row still opens its record, in the new order.
    expect(
      within(screen.getByRole('table', { name: 'Institutional access requests' }))
        .getAllByRole('link')
        .map((link) => link.getAttribute('aria-label')),
    ).toEqual([
      'Open request REQ-0042, Godavari Institute of Technology',
      'Open request REQ-0041, Krishna College of Engineering',
      'Open request REQ-0040, Konark Polytechnic',
    ]);
  });

  it('the pressed control keeps focus while the rows reorder', () => {
    const { container } = render(<SortableRequests />);
    const header = headerButton(container);
    act(() => header.focus());
    act(() => header.click());
    expect(headerButton(container)).toBe(header);
    expect(header).toHaveFocus();
    const bar = barButton(container);
    act(() => bar.focus());
    act(() => bar.click());
    expect(barButton(container)).toBe(bar);
    expect(bar).toHaveFocus();
  });

  it('a new order is announced in the table’s mounted status region, in the sort bar’s words; the first order is not', () => {
    const { container } = render(<SortableRequests />);
    const status = tableStatus(container);
    expect(status).toBeEmptyDOMElement();
    act(() => headerButton(container).click());
    expect(tableStatus(container)).toBe(status);
    expect(status).toHaveTextContent(/^Received, oldest first$/);
    act(() => barButton(container).click());
    expect(tableStatus(container)).toBe(status);
    expect(status).toHaveTextContent(/^Received, newest first$/);
    // The toolbar's count keeps its own words (B1-10 `count`).
    expect(container.querySelector('.xr-toolbar-status > [role="status"]')).toHaveTextContent(
      /^3 requests$/,
    );
  });

  it('a load clears the announcement, so rows that arrive after it do not repeat an old order', () => {
    const { container, rerender } = render(sortedTable('descending'));
    const status = tableStatus(container);
    rerender(sortedTable('ascending'));
    expect(status).toHaveTextContent(/^Received, oldest first$/);
    rerender(sortedTable('ascending', { loading: true, rows: [] }));
    expect(tableStatus(container)).toBe(status);
    expect(status).toHaveTextContent(/^Loading requests$/);
    rerender(sortedTable('ascending'));
    expect(status).toBeEmptyDOMElement();
    expect(references(container)).toEqual(['REQ-0040', 'REQ-0041', 'REQ-0042']);
  });

  it('the first order is not announced, also when sorting starts after the first render', () => {
    const { container, rerender } = render(
      requestTable({ columns: SORTABLE_COLUMNS, rows: ordered('descending') }),
    );
    const status = tableStatus(container);
    rerender(sortedTable('descending'));
    expect(status).toBeEmptyDOMElement();
    rerender(sortedTable('ascending'));
    expect(status).toHaveTextContent(/^Received, oldest first$/);
  });

  it('leaving the table clears the words; the rows coming back do not repeat them', () => {
    const { container, rerender } = render(sortedTable('descending'));
    const region = container.firstElementChild!;
    const status = region.querySelector(':scope > [role="status"]')!;
    rerender(sortedTable('ascending'));
    expect(status).toHaveTextContent(/^Received, oldest first$/);
    rerender(sortedTable('ascending', { rows: [], filtered: true }));
    expect(container.firstElementChild).toBe(region);
    expect(region.querySelector(':scope > [role="status"]')).toBe(status);
    expect(screen.getByRole('heading', { name: 'No requests match these filters' })).toBeVisible();
    expect(status).toBeEmptyDOMElement();
    rerender(sortedTable('ascending'));
    expect(status).toBeEmptyDOMElement();
  });

  it('an order changed during a load is announced when the rows are back', () => {
    const { container, rerender } = render(sortedTable('descending'));
    const status = tableStatus(container);
    rerender(sortedTable('descending', { loading: true, rows: [] }));
    rerender(sortedTable('ascending', { loading: true, rows: [] }));
    expect(status).toHaveTextContent(/^Loading requests$/);
    rerender(sortedTable('ascending'));
    expect(status).toHaveTextContent(/^Received, oldest first$/);
  });

  it('a caller that loads for the new order: focus on the header button goes to the table, not the page; the order is announced once the rows are back', async () => {
    const { container } = render(<ReloadingRequests />);
    const wrap = container.firstElementChild!;
    const header = headerButton(container);
    act(() => header.focus());
    act(() => header.click());
    expect(header).not.toBeInTheDocument();
    expect(document.body).not.toHaveFocus();
    expect(wrap).toHaveFocus();
    expect(wrap).toHaveAttribute('tabindex', '-1');
    expect(tableStatus(container)).toHaveTextContent(/^Loading requests$/);
    await nextTick();
    expect(references(container)).toEqual(['REQ-0040', 'REQ-0041', 'REQ-0042']);
    expect(container.querySelector('th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
    expect(tableStatus(container)).toHaveTextContent(/^Received, oldest first$/);
    // The table keeps focus (not a Tab stop); the next Tab reaches the header button again.
    expect(wrap).toHaveFocus();
    act(() => headerButton(container).focus());
    expect(wrap).not.toHaveAttribute('tabindex');
  });

  it('a header button that stayed is let go once focus moves on: a later load does not take focus', () => {
    const onSortChange = vi.fn();
    const sort = fixedSorting('descending', onSortChange);
    const { container, rerender } = render(sortedTable('descending', { sort }));
    const header = headerButton(container);
    act(() => header.focus());
    act(() => header.click());
    expect(onSortChange).toHaveBeenCalledTimes(1);
    // Focus leaves the button (to the page), then the table renders and later reloads.
    act(() => header.blur());
    rerender(sortedTable('descending', { sort }));
    rerender(sortedTable('descending', { sort, loading: true, rows: [] }));
    expect(document.body).toHaveFocus();
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
  });

  it('while sorted, the sorted column is the only th with aria-sort', () => {
    const { container } = render(
      sortedTable('descending', {
        primary: {
          key: 'ref',
          header: 'Reference',
          href: () => '#',
          title: (row) => row.ref,
          headerCellProps: { 'aria-sort': 'none' },
        },
        columns: SORTABLE_COLUMNS.map((column) =>
          column.key === 'type'
            ? { ...column, headerCellProps: { 'aria-sort': 'ascending', id: 'Qq-type' } }
            : column,
        ),
      }),
    );
    expect(container.querySelectorAll('th[aria-sort]')).toHaveLength(1);
    expect(container.querySelector('th[aria-sort] > .xr-x-th-sort')).not.toBeNull();
    expect(container.querySelector('#Qq-type')).not.toHaveAttribute('aria-sort');
  });

  it.each([
    ['loading', { loading: true, rows: [] }],
    ['empty', { rows: [] }],
    ['no match', { rows: [], filtered: true }],
    ['failed', { failed: { title: 'We couldn’t load the requests', onRetry: () => {} } }],
  ] as const)(
    '%s: no table, so no sort control; the state renders exactly as without sorting',
    (_state, overrides) => {
      const { container: sorted } = render(sortedTable('descending', overrides));
      const { container: plain } = render(requestTable(overrides));
      expect(sorted.querySelector('th, .xr-x-th-sort, .xr-x-th-text')).toBeNull();
      expect(within(sorted).queryAllByRole('button', { name: /Change order/ })).toHaveLength(0);
      expect(sorted.innerHTML).toBe(plain.innerHTML);
    },
  );

  it('without sort, a sortable column draws its plain header (the WP-0.6 table)', () => {
    const { container: sortable } = render(
      requestTable({ columns: SORTABLE_COLUMNS, rows: ordered('descending') }),
    );
    const { container: plain } = render(requestTable({ rows: ordered('descending') }));
    expect(sortable.innerHTML).toBe(plain.innerHTML);
    expect(sortable.querySelector('th[aria-sort], button')).toBeNull();
  });

  it('the sort state wins over a caller’s headerCellProps aria-sort on the sorted column; its id stays', () => {
    const { container } = render(
      sortedTable('ascending', {
        columns: SORTABLE_COLUMNS.map((column) =>
          column === RECEIVED
            ? { ...RECEIVED, headerCellProps: { 'aria-sort': 'descending', id: 'Qq-received' } }
            : column,
        ),
      }),
    );
    const th = container.querySelector('th[aria-sort]')!;
    expect(th).toHaveAttribute('aria-sort', 'ascending');
    expect(th).toHaveAttribute('id', 'Qq-received');
  });

  it('refuses a sort on a column that cannot be sorted, and a sort bar for another column', () => {
    expect(() =>
      render(
        sortedTable('descending', { sort: { ...fixedSorting('descending'), column: 'inst' } }),
      ),
    ).toThrow('DataTable sort.column "inst" must be the key of a column with sortWords.');
    expect(() =>
      render(
        sortedTable('descending', { sort: { ...fixedSorting('descending'), column: 'nope' } }),
      ),
    ).toThrow('DataTable sort.column "nope" must be the key of a column with sortWords.');
    expect(() =>
      render(
        <DataTableSortBar
          column={RECEIVED}
          sort={{ ...fixedSorting('descending'), column: 'inst' }}
        />,
      ),
    ).toThrow('DataTableSortBar column "date" is not the sorted column "inst".');
  });

  it('a sortable column must be named in words (compile-time)', () => {
    // The controls say the column's name, so a column with sortWords needs a string header.
    // @ts-expect-error — a node header with sortWords is neither a plain nor a sortable column.
    const column: DataTableColumn<Request> = {
      key: 'date',
      header: <span>Received</span>,
      cell: (row: Request) => row.date,
      sortWords: { descending: 'newest first', ascending: 'oldest first' },
    };
    expect(column.key).toBe('date');
    // The same column with its name in words is a sortable column.
    const named: DataTableColumn<Request> = { ...RECEIVED, header: 'Received' };
    expect(named.sortWords).toEqual(RECEIVED.sortWords);
  });

  it('emits only stylesheet classes and the PF-01 allow-list, in both orders', () => {
    for (const direction of ['descending', 'ascending'] as const) {
      const { container, unmount } = render(
        <div>
          <ListToolbar
            status="3 requests"
            sortBar={<DataTableSortBar column={RECEIVED} sort={fixedSorting(direction)} />}
          />
          {sortedTable(direction)}
        </div>,
      );
      expectStylesheetClassesOnly(container.firstElementChild!);
      unmount();
    }
  });

  it.each(['descending', 'ascending'] as const)(
    'axe (WCAG 2.2 AA): sort bar, header button and table, %s',
    async (direction) => {
      const { container } = render(
        <main>
          <ListToolbar
            status="3 requests"
            sortBar={<DataTableSortBar column={RECEIVED} sort={fixedSorting(direction)} />}
          />
          {sortedTable(direction)}
        </main>,
      );
      await assertNoAxeViolations(container);
    },
  );
});
