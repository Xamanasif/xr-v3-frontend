/**
 * Tabs: SectionTabs, RecordHubTabs, StatusTabs — markup contract, behaviour and accessibility
 * (Appendix E §3.3 Tabs, §5.4; Appendix F WP-0.6 acceptance 2–4). Sources: board 03 "Section
 * tabs · sub-navigation inside “People”" (links, `aria-current`, `xr-tab-count`, on white) and
 * "Record tabs · one record (AR-7)" (the tablist); B2-06 "IA-06 People › Students · 1440 ·
 * interactive" (section tabs on the canvas); B2-12 "ST-05 Experiment hub · Overview · 1440 · Rahul,
 * 9 Oct 2026" (hub tabs as links); B7-02 "SA-06 Institutions · 1440 · 23 Oct 2026 · interactive"
 * (status tabs that filter one list); board 12 "Keyboard and focus" ("Record tabs ← → move
 * between tabs; Tab enters the panel"); board 11 "Section tabs at 375 px · each People tab as
 * the current one" (the current tab scrolled into view).
 *
 * Completions and variances, each asserted below: no board draws the `tabpanel` (VD-14,
 * PROVISIONAL): StatusTabs adds `role="tabpanel"` labelled by the selected tab, `tabindex="0"`,
 * and on the tabs `tabindex` (roving) and `aria-controls`; the inline `padding:0 16px` of the
 * B7-02 tablist is not emitted; the B6/B7 tablists draw no space between the label and its count
 * (board 03 does: "Students <span…>214"), and StatusTabs keeps board 03's space so the name reads
 * "All 6", not "All6". Real Tab order, sideways scrolling and the right-edge fade are proven in
 * apps/specimens/e2e/components-data.spec.ts.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  canonicalMarkup,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import {
  RecordHubTabs,
  scrollTabIntoView,
  SectionTabs,
  StatusTabs,
  type StatusTab,
} from './tabs.js';

const SECTION: BoardSource = {
  board: '03',
  frame: 'Section tabs · sub-navigation inside “People”',
};
const RECORD: BoardSource = { board: '03', frame: 'Record tabs · one record (AR-7)' };
const PEOPLE: BoardSource = {
  board: 'B2-06',
  frame: 'IA-06 People › Students · 1440 · interactive',
};
const HUB: BoardSource = {
  board: 'B2-12',
  frame: 'ST-05 Experiment hub · Overview · 1440 · Rahul, 9 Oct 2026',
};
const INSTITUTIONS: BoardSource = {
  board: 'B7-02',
  frame: 'SA-06 Institutions · 1440 · 23 Oct 2026 · interactive',
};
const KEYBOARD: BoardSource = { board: '12', frame: 'Keyboard and focus' };
const AT_375: BoardSource = {
  board: '11',
  frame: 'Section tabs at 375 px · each People tab as the current one',
};

const PEOPLE_TABS = [
  { href: '#h-find', label: 'Students', count: 214, current: true },
  { href: '#h-find', label: 'Faculty', count: 9 },
  { href: '#h-find', label: 'Groups' },
  { href: '#h-find', label: 'Faculty courses' },
];

/** B7-02's six views (`const F = [['all', 'All'], …]`), with sample counts. */
const INSTITUTION_TABS: readonly StatusTab[] = [
  { id: 'all', label: 'All', count: 6 },
  { id: 'active', label: 'Access active', count: 3 },
  { id: 'ending', label: 'Ending soon', count: 1 },
  { id: 'paused', label: 'Paused', count: 1 },
  { id: 'payment', label: 'Awaiting payment', count: 1 },
  { id: 'noia', label: 'No Institute Admin', count: 0 },
];

function Institutions({
  initial = 'all',
  onSelect,
}: {
  readonly initial?: string;
  readonly onSelect?: (id: string) => void;
}) {
  const [selected, setSelected] = useState(initial);
  return (
    <StatusTabs
      label="Show"
      tabs={INSTITUTION_TABS}
      selected={selected}
      onSelect={(id) => {
        onSelect?.(id);
        setSelected(id);
      }}
      idPrefix="Ll"
    >
      <p>Institutions shown: {selected}</p>
    </StatusTabs>
  );
}

describe('SectionTabs and RecordHubTabs markup contract', () => {
  it('board 03: links with aria-current, the count chip after a space, on white', () => {
    const { container } = render(
      <SectionTabs label="People sections" tabs={PEOPLE_TABS} surface="white" />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SECTION,
      `<nav class="xr-tabs xr-tabs--on-white" aria-label="People sections">
              <a class="xr-tab" href="#h-find" aria-current="page">Students <span class="xr-tab-count">214</span></a>
              <a class="xr-tab" href="#h-find">Faculty <span class="xr-tab-count">9</span></a>
              <a class="xr-tab" href="#h-find">Groups</a>
              <a class="xr-tab" href="#h-find">Faculty courses</a>
            </nav>`,
    );
  });

  it('B2-06: section tabs on the canvas (no modifier)', () => {
    const { container } = render(
      <SectionTabs
        label="People"
        tabs={[
          { href: 'B2-06-People.dc.html', label: 'Students', current: true },
          { href: 'B2-06-People.dc.html', label: 'Faculty' },
          { href: 'B2-08-Groups.dc.html', label: 'Groups' },
          { href: 'B2-09-Faculty-Courses.dc.html', label: 'Faculty courses' },
        ]}
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      PEOPLE,
      '<nav class="xr-tabs" aria-label="People"><a class="xr-tab" href="B2-06-People.dc.html" aria-current="page">Students</a><a class="xr-tab" href="B2-06-People.dc.html">Faculty</a><a class="xr-tab" href="B2-08-Groups.dc.html">Groups</a><a class="xr-tab" href="B2-09-Faculty-Courses.dc.html">Faculty courses</a></nav>',
    );
  });

  it('B2-12: record-hub tabs are links in nav.xr-tabs.xr-tabs--on-white.xw-hubtabs', () => {
    const { container } = render(
      <RecordHubTabs
        label="Shell-and-Tube Heat Exchanger"
        tabs={[
          { href: 'B2-12-Experiment-Hub.dc.html', label: 'Overview', current: true },
          { href: 'B3-01-Hub-Resources-and-Progress.dc.html', label: 'Resources' },
          { href: 'B3-02-Simulation-Choose-Format.dc.html', label: 'Simulation' },
          { href: 'B4-11-Student-Assessments.dc.html', label: 'Assessment' },
          { href: 'B3-01-Hub-Resources-and-Progress.dc.html', label: 'Progress' },
        ]}
      />,
    );
    expectRenderedAsDrawn(
      container.firstElementChild!,
      HUB,
      '<nav class="xr-tabs xr-tabs--on-white xw-hubtabs" aria-label="Shell-and-Tube Heat Exchanger"><a class="xr-tab" href="B2-12-Experiment-Hub.dc.html" aria-current="page">Overview</a><a class="xr-tab" href="B3-01-Hub-Resources-and-Progress.dc.html">Resources</a><a class="xr-tab" href="B3-02-Simulation-Choose-Format.dc.html">Simulation</a><a class="xr-tab" href="B4-11-Student-Assessments.dc.html">Assessment</a><a class="xr-tab" href="B3-01-Hub-Resources-and-Progress.dc.html">Progress</a></nav>',
    );
  });

  it('section tabs are ordinary links reached with Tab: no tablist roles, no roving tabindex', () => {
    expectBoardDraws(KEYBOARD, 'Section tabs', 'Ordinary links;');
    render(<SectionTabs label="People sections" tabs={PEOPLE_TABS} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('tabindex'))).toEqual([null, null, null, null]);
    expect(screen.getByRole('link', { name: 'Students 214' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});

describe('StatusTabs markup contract', () => {
  /** The ARIA completions this component adds to the drawn tablist (VD-14). */
  const withoutCompletions = (html: string) =>
    html.replace(/ (?:id|tabindex|aria-controls)="[^"]*"/g, '');

  it('board 03 "Record tabs": a tablist of aria-selected tab buttons on white', () => {
    const drawn = `<div class="xr-tabs xr-tabs--on-white" role="tablist" aria-label="Shell-and-Tube Heat Exchanger">
              <button type="button" class="xr-tab" role="tab" aria-selected="true">Overview</button>
              <button type="button" class="xr-tab" role="tab" aria-selected="false">Resources</button>
              <button type="button" class="xr-tab" role="tab" aria-selected="false">Simulation</button>
              <button type="button" class="xr-tab" role="tab" aria-selected="false">Assessment</button>
              <button type="button" class="xr-tab" role="tab" aria-selected="false">Progress</button>
            </div>`;
    expectBoardDraws(RECORD, drawn);
    const { container } = render(
      <StatusTabs
        label="Shell-and-Tube Heat Exchanger"
        tabs={['Overview', 'Resources', 'Simulation', 'Assessment', 'Progress'].map((label) => ({
          id: label.toLowerCase(),
          label,
        }))}
        selected="overview"
        onSelect={() => {}}
      >
        <p>Overview</p>
      </StatusTabs>,
    );
    expect(canonicalMarkup(withoutCompletions(container.firstElementChild!.outerHTML))).toBe(
      canonicalMarkup(drawn),
    );
  });

  it('B7-02: product attribute order and the count chip; the tabpanel follows the tablist', () => {
    const tablist =
      '<div class="xr-tabs xr-tabs--on-white" role="tablist" aria-label="Show" style="padding:0 16px"><sc-for list="{{ L.fTabs }}" as="t" hint-placeholder-count="3"><button type="button" role="tab" class="xr-tab" id="{{ t.id }}" aria-selected="{{ t.sel }}" onClick="{{ t.pick }}">{{ t.label }}<span class="xr-tab-count">{{ t.n }}</span></button></sc-for></div>';
    expectBoardDraws(INSTITUTIONS, tablist);
    const { container } = render(<Institutions />);
    const [list, panel] = [...container.children];
    expect(list!.outerHTML).toMatch(
      /^<div class="xr-tabs xr-tabs--on-white" role="tablist" aria-label="Show">/,
    );
    const first = list!.firstElementChild!;
    expect(normaliseMarkup(first.outerHTML)).toBe(
      '<button type="button" role="tab" class="xr-tab" id="Ll-tab-all" aria-selected="true" tabindex="0" aria-controls="Ll-panel">All <span class="xr-tab-count">6</span></button>',
    );
    expect(normaliseMarkup(list!.lastElementChild!.outerHTML)).toBe(
      '<button type="button" role="tab" class="xr-tab" id="Ll-tab-noia" aria-selected="false" tabindex="-1" aria-controls="Ll-panel">No Institute Admin <span class="xr-tab-count">0</span></button>',
    );
    expect(panel).toHaveAttribute('role', 'tabpanel');
    expect(panel).toHaveAttribute('id', 'Ll-panel');
    expect(panel).toHaveAttribute('aria-labelledby', 'Ll-tab-all');
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(panel).not.toHaveAttribute('class');
  });
});

describe('StatusTabs keyboard (board 12 "Keyboard and focus": ← → move, Tab enters the panel)', () => {
  it('one tab stop: the selected tab; the panel is the next stop', () => {
    expectBoardDraws(KEYBOARD, 'Record tabs', 'move between tabs;', 'enters the panel');
    render(<Institutions initial="paused" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1]);
    const panel = screen.getByRole('tabpanel', { name: 'Paused 1' });
    expect(panel.tabIndex).toBe(0);
    expect(tabs.every((tab) => tab.getAttribute('aria-controls') === panel.id)).toBe(true);
  });

  it('→ and ← move to the next or previous tab, select it and wrap around', () => {
    const onSelect = vi.fn();
    render(<Institutions onSelect={onSelect} />);
    const all = screen.getByRole('tab', { name: 'All 6' });
    act(() => all.focus());
    fireEvent.keyDown(all, { key: 'ArrowRight' });
    const active = screen.getByRole('tab', { name: 'Access active 3' });
    expect(active).toHaveFocus();
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(active.tabIndex).toBe(0);
    expect(all).toHaveAttribute('aria-selected', 'false');
    expect(all.tabIndex).toBe(-1);
    expect(screen.getByRole('tabpanel', { name: 'Access active 3' })).toHaveTextContent(
      'Institutions shown: active',
    );
    fireEvent.keyDown(active, { key: 'ArrowLeft' });
    expect(all).toHaveFocus();
    fireEvent.keyDown(all, { key: 'ArrowLeft' });
    const last = screen.getByRole('tab', { name: 'No Institute Admin 0' });
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    expect(all).toHaveFocus();
    expect(onSelect.mock.calls.map(([id]) => id)).toEqual(['active', 'all', 'noia', 'all']);
  });

  it('Home and End go to the first and last tab; other keys do nothing', () => {
    render(<Institutions initial="ending" />);
    const ending = screen.getByRole('tab', { name: 'Ending soon 1' });
    act(() => ending.focus());
    fireEvent.keyDown(ending, { key: 'End' });
    expect(screen.getByRole('tab', { name: 'No Institute Admin 0' })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    const all = screen.getByRole('tab', { name: 'All 6' });
    expect(all).toHaveFocus();
    expect(all).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(all, { key: 'ArrowDown' });
    fireEvent.keyDown(all, { key: 'a' });
    expect(all).toHaveFocus();
    expect(all).toHaveAttribute('aria-selected', 'true');
  });

  it('without an idPrefix, generated ids still tie every tab to the one panel', () => {
    render(
      <StatusTabs label="Show" tabs={INSTITUTION_TABS} selected="ending" onSelect={() => {}}>
        <p>Institutions</p>
      </StatusTabs>,
    );
    const panel = screen.getByRole('tabpanel', { name: 'Ending soon 1' });
    const tabs = screen.getAllByRole('tab');
    expect(new Set(tabs.map((tab) => tab.id)).size).toBe(INSTITUTION_TABS.length);
    expect(tabs.every((tab) => tab.getAttribute('aria-controls') === panel.id)).toBe(true);
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[2]!.id);
  });

  it('a click selects; the panel is labelled by the selected tab', () => {
    render(<Institutions />);
    fireEvent.click(screen.getByRole('tab', { name: 'Awaiting payment 1' }));
    expect(screen.getByRole('tab', { name: 'Awaiting payment 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Awaiting payment 1');
  });
});

describe('the current tab is scrolled into view (board 11 "Section tabs at 375 px")', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** A 375 px strip at x 0 whose tabs are `width` px wide, laid out from its scroll position. */
  function layOutStrip(tabWidth: () => number = () => 120) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const strip = this.closest<HTMLElement>('.xr-tabs');
      if (this === strip) return DOMRect.fromRect({ x: 0, y: 0, width: 375, height: 48 });
      const index = strip ? [...strip.children].indexOf(this) : 0;
      const width = tabWidth();
      const x = index * (width + 4) - (strip?.scrollLeft ?? 0);
      return DOMRect.fromRect({ x, y: 0, width, height: 48 });
    });
  }

  /**
   * jsdom has no `document.fonts`: a stand-in that behaves as Chromium's FontFaceSet was measured
   * to (Package 1E, board 11 at 375 px): each call finishes one batch of faces — `loadingdone`
   * fires — and `ready` resolves after the first batch, whatever is still to load.
   */
  function stubFonts() {
    const fonts = new EventTarget();
    let resolveReady: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    Object.defineProperty(fonts, 'ready', { value: ready });
    Object.defineProperty(document, 'fonts', { value: fonts, configurable: true });
    return async () => {
      resolveReady();
      await act(async () => {
        await ready;
        fonts.dispatchEvent(new Event('loadingdone'));
      });
    };
  }

  afterEach(() => {
    Reflect.deleteProperty(document, 'fonts');
  });

  it('re-aligned after every batch of fonts, not only when `fonts.ready` first resolves', async () => {
    // As measured: at mount no Public Sans face has loaded and the fallback glyphs fit (no
    // scroll); the regular face loads first and `ready` resolves; the semibold and bold faces of
    // the tab labels come in a later batch and widen the tabs.
    let width = 80;
    layOutStrip(() => width);
    const batchLoaded = stubFonts();
    const tabs = PEOPLE_TABS.map((tab) => ({ ...tab, current: tab.label === 'Faculty courses' }));
    render(<SectionTabs label="People sections" tabs={tabs} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    expect(nav.scrollLeft).toBe(0); // Faculty courses at x 252 … 332: in view
    await batchLoaded(); // the regular face: the labels keep their fallback widths
    expect(nav.scrollLeft).toBe(0);
    width = 120; // Faculty courses now at x 372 … 492
    await batchLoaded(); // the semibold and bold faces
    expect(nav.scrollLeft).toBe(492 - 375);
  });

  it('re-aligned once the web fonts have loaded (wider glyphs move the tabs)', async () => {
    let width = 120;
    layOutStrip(() => width);
    const fontsLoaded = stubFonts();
    const tabs = PEOPLE_TABS.map((tab) => ({ ...tab, current: tab.label === 'Faculty courses' }));
    render(<SectionTabs label="People sections" tabs={tabs} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    expect(nav.scrollLeft).toBe(117);
    width = 140; // Faculty courses now at x 432 − 117 … 572 − 117
    await fontsLoaded();
    expect(nav.scrollLeft).toBe(117 + (572 - 117 - 375));
  });

  it('not re-aligned after the fonts load if the strip was scrolled meanwhile', async () => {
    let width = 120;
    layOutStrip(() => width);
    const fontsLoaded = stubFonts();
    const tabs = PEOPLE_TABS.map((tab) => ({ ...tab, current: tab.label === 'Faculty courses' }));
    render(<SectionTabs label="People sections" tabs={tabs} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    nav.scrollLeft = 10;
    width = 140;
    await fontsLoaded();
    expect(nav.scrollLeft).toBe(10);
  });

  it('a section tab past the right edge is scrolled into view on mount, the strip only', () => {
    expectBoardDraws(AT_375, 'the current tab is scrolled into view when the page opens');
    layOutStrip();
    const tabs = PEOPLE_TABS.map((tab) => ({ ...tab, current: tab.label === 'Faculty courses' }));
    render(<SectionTabs label="People sections" tabs={tabs} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    // Faculty courses: x 372 … 492; the strip ends at 375, so it scrolls by 117.
    expect(nav.scrollLeft).toBe(117);
  });

  it('the selected status tab is scrolled into view on mount', () => {
    layOutStrip();
    render(<Institutions initial="noia" />);
    // No Institute Admin: x 620 … 740 → scrolled by 365.
    expect(screen.getByRole('tablist').scrollLeft).toBe(365);
  });

  it('a tab already in view does not move the strip; one left of the view scrolls back', () => {
    layOutStrip();
    render(<SectionTabs label="People sections" tabs={PEOPLE_TABS} />);
    const nav = screen.getByRole('navigation', { name: 'People sections' });
    expect(nav.scrollLeft).toBe(0);
    const students = within(nav).getByRole('link', { name: 'Students 214' });
    nav.scrollLeft = 200;
    scrollTabIntoView(nav, students);
    expect(nav.scrollLeft).toBe(0);
  });
});

describe('Tabs: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emit only stylesheet classes', () => {
    const { container } = render(
      <div>
        <SectionTabs label="People sections" tabs={PEOPLE_TABS} surface="white" />
        <RecordHubTabs label="Shell-and-Tube Heat Exchanger" tabs={PEOPLE_TABS} />
        <Institutions />
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['section tabs', <SectionTabs key="s" label="People sections" tabs={PEOPLE_TABS} />],
    [
      'section tabs on white',
      <SectionTabs key="w" label="People sections" tabs={PEOPLE_TABS} surface="white" />,
    ],
    [
      'record-hub tabs',
      <RecordHubTabs key="h" label="Shell-and-Tube Heat Exchanger" tabs={PEOPLE_TABS} />,
    ],
    ['status tabs with their panel', <Institutions key="t" />],
    [
      'status tabs with generated ids, a later tab selected',
      <StatusTabs key="g" label="Show" tabs={INSTITUTION_TABS} selected="noia" onSelect={() => {}}>
        <p>Institutions</p>
      </StatusTabs>,
    ],
  ])('%s', async (_name, element) => {
    const { container } = render(<main>{element}</main>);
    await assertNoAxeViolations(container);
  });
});
