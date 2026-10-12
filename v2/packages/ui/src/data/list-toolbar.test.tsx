/**
 * ListToolbar / Filters — markup contract, behaviour and accessibility (Appendix E §3.3
 * ListToolbar, §5.5, §6.1; Appendix F WP-0.6 acceptance 2–4). Sources: board 03 "Search, filter,
 * segmented and tabs" ("List toolbar · one shared component at three widths": search, two
 * filters, "More filters", the count, a chip and "Clear filters"); B1-10 "SA-02 Requests · 1440 ·
 * interactive" (the live toolbar: `aria-controls`, the `role="status"` count, chips named
 * "Remove <label>") and "More filters open · Internal or external = External" (the
 * `xp-morefilters` panel with the second filter's phone copy and "More filters (1)"); board 12
 * "Targets, names, status and Help placement" (the 28 × 28 chip remove button).
 *
 * Board variances, each asserted below: board 03 draws the count without `role="status"` (B1-10
 * and the product boards carry it) and names the chip button "Remove filter <label>" (17 product
 * list engines build "Remove " + label; `removeLabel` reproduces board 03); the inline
 * `min-height: 32px` of "Clear filters" is not emitted. Below 600 px of content the second filter
 * moves into "More filters" by CSS (container query): proven in
 * apps/specimens/e2e/components-data.spec.ts.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState, useTransition } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Field } from '../forms/field.js';
import { Select } from '../forms/select.js';
import {
  assertNoAxeViolations,
  canonicalMarkup,
  expectBoardDraws,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { DataTableSortBar, type DataTableSortableColumn } from './data-table.js';
import { ListToolbar, type FilterChip, type ListToolbarFilter } from './list-toolbar.js';

const FIND: BoardSource = { board: '03', frame: 'Search, filter, segmented and tabs' };
const REQUESTS: BoardSource = { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' };
const MORE: BoardSource = {
  board: 'B1-10',
  frame: 'More filters open · Internal or external = External',
};
const TARGETS: BoardSource = {
  board: '12',
  frame: 'Targets, names, status and Help placement',
};

const svg = (d: string, size = '') =>
  `<svg class="xr-ico${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"></path></svg>`;
const SEARCH = svg('M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4');
const CHEVRON = svg('M6 9.5l6 6 6-6');
const FILTER = svg('M4 6h16M7 12h10M10 18h4');
const CLOSE_16 = svg('M6 6l12 12M18 6 6 18', ' xr-ico--16');

/** Board wiring (`value="{{ … }}"`, `onChange="{{ … }}"`, `onClick="{{ … }}"`) is canvas runtime. */
function withoutWiring(excerpt: string): string {
  return excerpt.replace(/\s(?:value|onChange|onClick)="\{\{[^}]*\}\}"/g, '');
}

/** A controlled input's `value` attribute (React writes it; the canvas writes none). */
function withoutValueAttribute(html: string): string {
  return html.replace(/(<input[^>]*?) value="[^"]*"/g, '$1');
}

const noop = () => {};

/* ------------------------------------------------------------------------------------------ */
/* Board 03 toolbar                                                                             */
/* ------------------------------------------------------------------------------------------ */

const BOARD_03_TOOLBAR = `<div class="xr-toolbar">
  <div class="xr-field xr-toolbar-search"><label class="xr-label" for="{{ tf.id }}-s">Search</label><div class="xr-search">${SEARCH}<input id="{{ tf.id }}-s" class="xr-input" type="search" placeholder="Name, e-mail or student ID"></div></div>
  <div class="xr-field"><label class="xr-label" for="{{ tf.id }}-f1">Status</label><div class="xr-select-wrap"><select id="{{ tf.id }}-f1" class="xr-select"><option>No access yet</option><option>All statuses</option><option>Access active</option><option>Inactive</option></select>${CHEVRON}</div></div>
  <div class="xr-field xr-filter-2"><label class="xr-label" for="{{ tf.id }}-f2">Course</label><div class="xr-select-wrap"><select id="{{ tf.id }}-f2" class="xr-select"><option>All courses</option><option>ME ZG523 — Thermodynamics &amp; Heat Transfer</option></select>${CHEVRON}</div></div>
  <button type="button" class="xr-btn xr-btn--secondary" aria-expanded="false">${FILTER}More filters</button>
</div>`;

const BOARD_03_STATUS = `<div class="xr-toolbar-status">
  <span class="xr-meta">12 of 214 students</span>
  <span class="xr-fchip">Status: No access yet<button type="button" aria-label="Remove filter Status: No access yet">${CLOSE_16}</button></span>
  <button type="button" class="xr-btn xr-btn--text" style="min-height: 32px">Clear filters</button>
</div>`;

const STATUS_FILTER: ListToolbarFilter = {
  id: 'tb-d-f1',
  label: 'Status',
  options: [
    { label: 'No access yet' },
    { label: 'All statuses' },
    { label: 'Access active' },
    { label: 'Inactive' },
  ],
  value: 'No access yet',
  onChange: noop,
};

const COURSE_FILTER: ListToolbarFilter = {
  id: 'tb-d-f2',
  label: 'Course',
  options: [{ label: 'All courses' }, { label: 'ME ZG523 — Thermodynamics & Heat Transfer' }],
  value: 'All courses',
  onChange: noop,
};

function board03Toolbar() {
  return (
    <ListToolbar
      search={{
        id: 'tb-d-s',
        label: 'Search',
        placeholder: 'Name, e-mail or student ID',
        value: '',
        onChange: noop,
      }}
      filters={[STATUS_FILTER, COURSE_FILTER]}
      moreFilters={{ open: false, onOpenChange: noop }}
      status="12 of 214 students"
      chips={[
        {
          key: 'status',
          label: 'Status: No access yet',
          removeLabel: 'Remove filter Status: No access yet',
          onRemove: noop,
        },
      ]}
      onClearFilters={noop}
    />
  );
}

/* ------------------------------------------------------------------------------------------ */
/* B1-10 toolbar, driven by a stateful caller as the board's engine does                        */
/* ------------------------------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'review', label: 'Under review' },
  { value: 'info', label: 'Information requested' },
  { value: 'pay', label: 'Approved — payment required' },
  { value: 'pend', label: 'Payment not confirmed' },
  { value: 'active', label: 'Access active' },
];
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'New access', label: 'New access' },
  { value: 'Additional licences', label: 'Additional licences' },
  { value: 'Renewal', label: 'Renewal' },
];
const ROUTE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Internal', label: 'Internal' },
  { value: 'External', label: 'External' },
  { value: 'Not set yet', label: 'Not set yet' },
];
const LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

interface Filters {
  readonly q: string;
  readonly st: string;
  readonly type: string;
  readonly route: string;
}

const NONE: Filters = { q: '', st: 'all', type: 'all', route: 'all' };

function RequestsToolbar({
  initial = NONE,
  initialMore = false,
  total = 7,
}: {
  readonly initial?: Filters;
  readonly initialMore?: boolean;
  readonly total?: number;
}) {
  const [filters, setFilters] = useState(initial);
  const [more, setMore] = useState(initialMore);
  const set = (patch: Partial<Filters>) => setFilters((current) => ({ ...current, ...patch }));
  const chips: FilterChip[] = [];
  if (filters.q.trim()) {
    chips.push({
      key: 'q',
      label: `Search: “${filters.q.trim()}”`,
      onRemove: () => set({ q: '' }),
    });
  }
  if (filters.st !== 'all') {
    chips.push({
      key: 'st',
      label: `Status: ${LABELS[filters.st]}`,
      onRemove: () => set({ st: 'all' }),
    });
  }
  if (filters.type !== 'all') {
    chips.push({
      key: 'type',
      label: `Type: ${filters.type}`,
      onRemove: () => set({ type: 'all' }),
    });
  }
  if (filters.route !== 'all') {
    chips.push({
      key: 'route',
      label: `Internal or external: ${filters.route}`,
      onRemove: () => set({ route: 'all' }),
    });
  }
  // The count is the caller's words; this stand-in only counts the chips.
  const shown = Math.max(total - chips.length * 2, 0);
  return (
    <ListToolbar
      search={{
        id: 'Qq-q',
        label: 'Search',
        placeholder: 'Reference, institution or contact',
        value: filters.q,
        onChange: (q) => set({ q }),
      }}
      filters={[
        {
          id: 'Qq-st',
          label: 'Status',
          options: STATUS_OPTIONS,
          value: filters.st,
          onChange: (st) => set({ st }),
        },
        {
          id: 'Qq-type',
          label: 'Type',
          options: TYPE_OPTIONS,
          value: filters.type,
          onChange: (type) => set({ type }),
        },
      ]}
      moreFilters={{
        id: 'Qq-more',
        open: more,
        onOpenChange: setMore,
        activeCount: filters.route === 'all' ? 0 : 1,
        children: (
          <Field id="Qq-route" label="Internal or external">
            <Select
              options={ROUTE_OPTIONS}
              value={filters.route}
              onChange={(event) => set({ route: event.target.value })}
            />
          </Field>
        ),
      }}
      status={chips.length ? `${shown} of ${total} requests` : `${total} requests`}
      chips={chips}
      onClearFilters={chips.length ? () => setFilters(NONE) : undefined}
    />
  );
}

/**
 * A caller whose removal commits after the press: in a transition (`startTransition(() =>
 * router.replace(…))`, whose urgent `isPending` render comes first), or after a busy render and a
 * later tick. Its chips are built inline, a new array on every render.
 */
function DeferredToolbar({ mode }: { readonly mode: 'transition' | 'later' }) {
  const [keys, setKeys] = useState<readonly string[]>(['a', 'b', 'c']);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  const apply = (next: (current: readonly string[]) => readonly string[]) => {
    if (mode === 'transition') {
      startTransition(() => setKeys(next));
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setKeys(next);
      setBusy(false);
    }, 0);
  };
  const chips: FilterChip[] = keys.map((key) => ({
    key,
    label: `F ${key}`,
    onRemove: () => apply((current) => current.filter((other) => other !== key)),
  }));
  return (
    <ListToolbar
      search={{ label: 'Search', value: '', onChange: noop }}
      status={busy || isPending ? 'Updating' : `${keys.length} filters`}
      chips={chips}
      onClearFilters={keys.length ? () => apply(() => []) : undefined}
    />
  );
}

/** Lets the deferred caller's later tick run. */
const nextTick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const NO_CHIPS: readonly FilterChip[] = [];

/** B6-06-style search-only list: a constant (never re-created) chips array and "Clear search". */
function ClearSearchToolbar() {
  const [query, setQuery] = useState('heat');
  return (
    <ListToolbar
      search={{ label: 'Search the library', value: query, onChange: setQuery }}
      status={query ? 'Published · 3' : 'Published · 12'}
      chips={NO_CHIPS}
      onClearFilters={query ? () => setQuery('') : undefined}
      clearLabel="Clear search"
    />
  );
}

describe('ListToolbar markup contract', () => {
  it('board 03: search, two filters (the second is xr-filter-2), More filters, count, chip, Clear filters', () => {
    expectBoardDraws(FIND, BOARD_03_TOOLBAR, BOARD_03_STATUS);
    expectBoardDraws(
      FIND,
      'List toolbar · one shared component at three widths',
      'Phone: search on its own row, then one filter beside “More filters” (the second filter moves inside “More filters”)',
    );
    const { container } = render(board03Toolbar());
    const [toolbar, status] = [...container.children];
    // Board 03's static button has no aria-controls; the live B1-10 button has (next test).
    const more = toolbar!.querySelector('button')!;
    expect(more).toHaveAttribute('aria-controls');
    expect(
      canonicalMarkup(
        withoutValueAttribute(toolbar!.outerHTML).replace(/ aria-controls="[^"]*"/, ''),
      ),
    ).toBe(canonicalMarkup(BOARD_03_TOOLBAR.replaceAll('{{ tf.id }}', 'tb-d')));
    // Board 03 count has no live region and the clear button an inline min-height; the product
    // count is a role=status (B1-10) and @xr/ui emits no inline style.
    expect(canonicalMarkup(status!.outerHTML)).toBe(
      canonicalMarkup(
        BOARD_03_STATUS.replace(
          '<span class="xr-meta">',
          '<span class="xr-meta" role="status">',
        ).replace(' style="min-height: 32px"', ''),
      ),
    );
  });

  it('B1-10: the live toolbar — More filters controls its panel, the count is a status, chips name what they remove', () => {
    const drawn = {
      search:
        '<div class="xr-field xr-toolbar-search"><label class="xr-label" for="Qq-q">Search</label><div class="xr-search"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4"></path></svg><input id="Qq-q" class="xr-input" type="search" placeholder="Reference, institution or contact" value="{{ q.q }}" onChange="{{ q.onQ }}"></div></div>',
      more: `<button type="button" class="xr-btn xr-btn--secondary" aria-expanded="{{ q.moreOpen }}" aria-controls="Qq-more" onClick="{{ q.toggleMore }}">${FILTER}{{ q.moreLabel }}</button>`,
      status:
        '<div class="xr-toolbar-status"><span class="xr-meta" role="status">{{ q.count }}</span>',
      chip: `<span class="xr-fchip">{{ c.label }}<button type="button" aria-label="{{ c.aria }}" onClick="{{ c.rm }}">${CLOSE_16}</button></span>`,
      clear:
        '<button type="button" class="xr-btn xr-btn--text" style="min-height:32px" onClick="{{ q.clear }}">Clear filters</button>',
    };
    expectBoardDraws(REQUESTS, ...Object.values(drawn));
    expectBoardDraws(REQUESTS, "chips.forEach(c => { c.aria = 'Remove ' + c.label; });");
    const { container } = render(<RequestsToolbar initial={{ ...NONE, st: 'review' }} />);
    const toolbar = container.querySelector('.xr-toolbar')!;
    expect(canonicalMarkup(withoutValueAttribute(toolbar.firstElementChild!.outerHTML))).toBe(
      canonicalMarkup(withoutWiring(drawn.search)),
    );
    expect(canonicalMarkup(toolbar.querySelector('button')!.outerHTML)).toBe(
      canonicalMarkup(
        withoutWiring(drawn.more)
          .replace('{{ q.moreOpen }}', 'false')
          .replace('{{ q.moreLabel }}', 'More filters'),
      ),
    );
    const status = container.querySelector('.xr-toolbar-status')!;
    expect(normaliseMarkup(status.firstElementChild!.outerHTML)).toBe(
      '<span class="xr-meta" role="status">5 of 7 requests</span>',
    );
    expect(normaliseMarkup(status.querySelector('.xr-fchip')!.outerHTML)).toBe(
      normaliseMarkup(
        withoutWiring(drawn.chip)
          .replace('{{ c.label }}', 'Status: Under review')
          .replace('{{ c.aria }}', 'Remove Status: Under review'),
      ),
    );
    expect(normaliseMarkup(status.lastElementChild!.outerHTML)).toBe(
      normaliseMarkup(withoutWiring(drawn.clear).replace(' style="min-height:32px"', '')),
    );
  });

  it('B1-10 "More filters open": the panel holds the second filter’s phone copy and the further filters; the button counts them', () => {
    const panel =
      '<div class="xp-morefilters" id="Qqx-more" role="group" aria-label="More filters"><div class="xr-field xp-morefilters-type"><label class="xr-label" for="Qqx-type2">Type</label><div class="xr-select-wrap"><select id="Qqx-type2" class="xr-select" value="{{ qx.type }}" onChange="{{ qx.onType }}"><option value="all">All types</option><option value="New access">New access</option><option value="Additional licences">Additional licences</option><option value="Renewal">Renewal</option></select><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></div></div><div class="xr-field "><label class="xr-label" for="Qqx-route">Internal or external</label><div class="xr-select-wrap"><select id="Qqx-route" class="xr-select" value="{{ qx.route }}" onChange="{{ qx.onRoute }}"><option value="all">All</option><option value="Internal">Internal</option><option value="External">External</option><option value="Not set yet">Not set yet</option></select><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg></div></div></div>';
    expectBoardDraws(
      MORE,
      panel,
      "moreLabel: s.route !== 'all' ? 'More filters (1)' : 'More filters'",
    );
    const { container } = render(
      <RequestsToolbar initial={{ ...NONE, route: 'External' }} initialMore />,
    );
    const rendered = container.querySelector('.xp-morefilters')!;
    // Ids are the caller's (Qq-…; the board's second frame is Qqx-…); the trailing space in
    // `class="xr-field "` is the board template's empty class slot.
    expect(normaliseMarkup(rendered.outerHTML)).toBe(
      normaliseMarkup(
        withoutWiring(panel).replaceAll('Qqx-', 'Qq-').replace('xr-field "', 'xr-field"'),
      ),
    );
    const button = screen.getByRole('button', { name: 'More filters (1)' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'Qq-more');
    expect(screen.getByRole('group', { name: 'More filters' })).toBe(rendered);
  });

  it('board 12: the chip remove control is the 28 × 28 button inside xr-fchip, always named', () => {
    expectBoardDraws(TARGETS, 'Remove-filter button on a chip', '28 × 28');
    render(<RequestsToolbar initial={{ ...NONE, type: 'Renewal' }} />);
    const remove = screen.getByRole('button', { name: 'Remove Type: Renewal' });
    expect(remove.parentElement).toHaveClass('xr-fchip', { exact: true });
    expect(remove).not.toHaveAttribute('class');
  });
});

describe('ListToolbar behaviour', () => {
  it('search and filters report their values to the caller; the count is the caller’s words', () => {
    const onSearch = vi.fn();
    const onStatus = vi.fn();
    render(
      <ListToolbar
        search={{ label: 'Search', value: '', onChange: onSearch }}
        filters={[{ ...STATUS_FILTER, onChange: onStatus }]}
        status="214 students"
      />,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), {
      target: { value: 'Priya' },
    });
    expect(onSearch).toHaveBeenCalledWith('Priya');
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'Inactive' },
    });
    expect(onStatus).toHaveBeenCalledWith('Inactive');
    expect(screen.getByRole('status')).toHaveTextContent('214 students');
    // No More filters, chips or Clear filters unless the caller asks for them.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('the count stays one mounted status region; only its words change (§5.5)', () => {
    render(<RequestsToolbar />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('7 requests');
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'review' },
    });
    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('5 of 7 requests');
  });

  it('More filters opens and closes its panel; the second filter is reachable inside it', () => {
    render(<RequestsToolbar />);
    const button = screen.getByRole('button', { name: 'More filters' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'More filters' })).toBeNull();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('group', { name: 'More filters' });
    expect(button).toHaveAttribute('aria-controls', panel.id);
    // Two "Type" selects exist; CSS shows exactly one at any width (xr-filter-2 / xp-morefilters-type).
    const types = screen.getAllByRole('combobox', { name: 'Type' });
    expect(types.map((select) => select.id)).toEqual(['Qq-type', 'Qq-type2']);
    fireEvent.change(types[1]!, { target: { value: 'Renewal' } });
    expect(types[0]).toHaveValue('Renewal');
    expect(screen.getByRole('button', { name: 'Remove Type: Renewal' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Internal or external' }), {
      target: { value: 'External' },
    });
    expect(button).toHaveAccessibleName('More filters (1)');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('group', { name: 'More filters' })).toBeNull();
  });

  it('a chip’s remove button removes that filter; focus moves to the next chip, then the previous, then the search', () => {
    render(
      <RequestsToolbar
        initial={{ q: 'Konark', st: 'review', type: 'Renewal', route: 'External' }}
      />,
    );
    const names = () =>
      screen
        .getAllByRole('button', { name: /^Remove / })
        .map((button) => button.getAttribute('aria-label'));
    expect(names()).toEqual([
      'Remove Search: “Konark”',
      'Remove Status: Under review',
      'Remove Type: Renewal',
      'Remove Internal or external: External',
    ]);
    const status = screen.getByRole('button', { name: 'Remove Status: Under review' });
    act(() => status.focus());
    act(() => status.click());
    expect(names()).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Remove Type: Renewal' })).toHaveFocus();
    const route = screen.getByRole('button', { name: 'Remove Internal or external: External' });
    act(() => route.focus());
    act(() => route.click());
    expect(screen.getByRole('button', { name: 'Remove Type: Renewal' })).toHaveFocus();
    act(() => screen.getByRole('button', { name: 'Remove Type: Renewal' }).click());
    act(() => screen.getByRole('button', { name: 'Remove Search: “Konark”' }).click());
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('7 requests');
  });

  it('"Clear filters" clears every filter and focus returns to the search', () => {
    render(<RequestsToolbar initial={{ ...NONE, st: 'info', route: 'Internal' }} />);
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    act(() => clear.focus());
    act(() => clear.click());
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(0);
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('all');
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
  });

  it('focus is left alone when the removed control did not have it', () => {
    render(<RequestsToolbar initial={{ ...NONE, st: 'info' }} />);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    act(() => search.focus());
    fireEvent.click(screen.getByRole('button', { name: 'Remove Status: Information requested' }));
    expect(search).toHaveFocus();
  });

  it('a removal the caller commits later (in a transition) still moves focus to the next chip, then the search', async () => {
    render(<DeferredToolbar mode="transition" />);
    const removeB = screen.getByRole('button', { name: 'Remove F b' });
    act(() => removeB.focus());
    await act(async () => removeB.click());
    expect(removeB).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove F c' })).toHaveFocus();
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    act(() => clear.focus());
    await act(async () => clear.click());
    expect(clear).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(0);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
  });

  it('a removal the caller commits after a busy render: focus waits on the pressed control, then moves on', async () => {
    render(<DeferredToolbar mode="later" />);
    const removeB = screen.getByRole('button', { name: 'Remove F b' });
    act(() => removeB.focus());
    act(() => removeB.click());
    // The busy render: the chips are a new array, the pressed chip is still there and focused.
    expect(screen.getByRole('status')).toHaveTextContent('Updating');
    expect(removeB).toHaveFocus();
    await nextTick();
    expect(removeB).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 filters');
    expect(screen.getByRole('button', { name: 'Remove F c' })).toHaveFocus();
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    act(() => clear.focus());
    act(() => clear.click());
    expect(clear).toHaveFocus();
    await nextTick();
    expect(clear).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveFocus();
  });

  it('"Clear search" with a constant chips array: focus returns to the search (B6-06)', () => {
    render(<ClearSearchToolbar />);
    const clear = screen.getByRole('button', { name: 'Clear search' });
    act(() => clear.focus());
    act(() => clear.click());
    expect(clear).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Published · 12');
    expect(screen.getByRole('searchbox', { name: 'Search the library' })).toHaveFocus();
  });

  it('the clear button takes the caller’s words (B6-06 "Clear search")', () => {
    expectBoardDraws(
      { board: 'B6-06', frame: 'CM-04 Content library · 1440' },
      'onClick="{{ l.lClear }}">Clear search</button>',
    );
    const onClearFilters = vi.fn();
    render(
      <ListToolbar
        search={{ label: 'Search the library', value: 'heat', onChange: noop }}
        status="Published · 3"
        onClearFilters={onClearFilters}
        clearLabel="Clear search"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('a second filter needs More filters (compile-time)', () => {
    // @ts-expect-error — the second filter moves into "More filters" below 600 px of content.
    const element = <ListToolbar status="" filters={[STATUS_FILTER, COURSE_FILTER]} />;
    expect(element).toBeTruthy();
  });

  it('the sortBar slot sits after the count in the status row (for WP-0.7)', () => {
    const { container } = render(
      <ListToolbar status="4 requests" sortBar={<span id="sort-slot">sort</span>} />,
    );
    const row = container.querySelector('.xr-toolbar-status')!;
    expect([...row.children].map((child) => child.id || child.getAttribute('role'))).toEqual([
      'status',
      'sort-slot',
    ]);
    // Nothing to search or filter: no empty `xr-toolbar` row (it would only add its margin).
    expect(container.querySelector('.xr-toolbar')).toBeNull();
    expect(container.children).toHaveLength(1);
  });
});

describe('ListToolbar with the DataTable sort bar (WP-0.7; PF-01; Appendix E §7.1)', () => {
  const received: DataTableSortableColumn<{ readonly date: string }> = {
    key: 'date',
    header: 'Received',
    cell: (row) => row.date,
    sortWords: { descending: 'newest first', ascending: 'oldest first' },
  };

  it('the sort bar sits in the status row after the count and before the chips (B1-10 "SA-02 Requests · 1440 · interactive")', () => {
    expectBoardDraws(
      { board: 'B1-10', frame: 'SA-02 Requests · 1440 · interactive' },
      '<div class="xr-toolbar-status"><span class="xr-meta" role="status">{{ q.count }}</span><sc-for list="{{ q.chips }}"',
    );
    const onSortChange = vi.fn();
    const { container } = render(
      <ListToolbar
        status="3 of 7 requests"
        sortBar={
          <DataTableSortBar
            column={received}
            sort={{ column: 'date', direction: 'descending', onSortChange }}
          />
        }
        chips={[{ key: 'st', label: 'Status: Under review', onRemove: () => {} }]}
        onClearFilters={() => {}}
      />,
    );
    const row = container.querySelector('.xr-toolbar-status')!;
    expect([...row.children].map((child) => child.className || child.getAttribute('role'))).toEqual(
      ['xr-meta', 'xr-x-table-sortbar', 'xr-fchip', 'xr-btn xr-btn--text'],
    );
    fireEvent.click(screen.getByRole('button', { name: 'Received, newest first. Change order' }));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'date', direction: 'ascending' });
    // The count keeps the caller's words; the order is the sort bar's own.
    expect(screen.getByRole('status')).toHaveTextContent(/^3 of 7 requests$/);
  });
});

describe('ListToolbar: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        {board03Toolbar()}
        <RequestsToolbar
          initial={{ q: 'Konark', st: 'review', type: 'Renewal', route: 'External' }}
          initialMore
        />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['board 03 toolbar, filtered', board03Toolbar()],
    ['no filters applied', <RequestsToolbar key="none" />],
    ['More filters open', <RequestsToolbar key="open" initialMore />],
    [
      'every filter applied, panel open',
      <RequestsToolbar
        key="all"
        initial={{ q: 'Konark', st: 'review', type: 'Renewal', route: 'External' }}
        initialMore
      />,
    ],
    [
      'search only',
      <ListToolbar
        key="search"
        search={{ label: 'Search institutions', value: '', onChange: noop }}
        status="12 institutions"
      />,
    ],
    [
      'search applied, the caller’s clear words (B6-06 "Clear search")',
      <ListToolbar
        key="clear-search"
        search={{ label: 'Search the library', value: 'heat', onChange: noop }}
        status="Published · 3"
        onClearFilters={noop}
        clearLabel="Clear search"
      />,
    ],
    [
      'status row only, with the WP-0.7 slot',
      <ListToolbar
        key="status-only"
        status="4 requests"
        sortBar={<button type="button">Received, newest first</button>}
      />,
    ],
  ])('%s', async (_state, element) => {
    const { container } = render(<main>{element}</main>);
    await assertNoAxeViolations(container);
  });
});
