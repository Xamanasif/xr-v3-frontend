/**
 * The Vendor's workspace patterns (owner-approved export design/v3-refined-b/roles/VE-v1,
 * `project/Main.dc.html` overview and list views; `v3-vendor.css`): VE-01's studio band with its
 * counts, “Needs your action” with the ivory lead, its further items or the calm block, Recent
 * activity; VE-02's status tabs, list surface, tool row and experiment table. Markup against the
 * export's classes and ARIA, the class contract and the accessibility checks.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, veExportText } from '../testing/index.js';
import { V3_ICON_PATHS } from './icons.js';
import {
  VendorAttention,
  VendorExperimentTable,
  type VendorExperimentRow,
  VendorListSurface,
  VendorListTools,
  VendorOverviewColumn,
  VendorRecentActivity,
  type VendorSort,
  VendorStatusTabs,
  VendorStudioBand,
  VendorWorkSplit,
} from './ve-workspace.js';

const MAIN = veExportText('Main.dc.html');

/** Each piece of markup is drawn by the export, with its classes and ARIA as they are. */
function expectDrawn(pieces: readonly string[]): void {
  for (const piece of pieces) expect(MAIN, piece).toContain(piece);
}

describe('VE-01 studio band (`div.vr-herocard`)', () => {
  it('draws the band, the course line, Create experiment and the four counts', async () => {
    expectDrawn([
      '<div class="vr-ov">',
      '<div class="vr-herocard">',
      '<section class="rb-id vr-hero" aria-labelledby="ve-h1">',
      '<div class="rb-id-top">',
      '<div class="rb-id-text">',
      '<p class="rb-eyebrow-date">',
      '<h1 class="rb-id-name" id="ve-h1" tabindex="-1"><span class="xr-sr">Overview, </span>',
      '<p class="rb-id-status"><span>{{ O.courseLine }}</span></p>',
      '<div class="rb-id-act"><a class="rb-btn rb-btn--lg" href="#ve-main"',
      '<dl class="rb-figs vr-figs" aria-label="Your experiments at a glance">',
      '<div class="rb-fig"><dt class="rb-fig-t">{{ g.t }}</dt><dd class="rb-fig-n">{{ g.n }}</dd><dd class="rb-fig-s">{{ g.s }}</dd></div>',
    ]);
    const { container } = render(
      <main>
        <VendorOverviewColumn>
          <VendorStudioBand
            title="Northline Simulation Studio"
            titlePrefix="Overview, "
            titleId="ve-h1"
            date="Thursday 27 August 2026"
            status="Your course: ME ZG523 · Thermodynamics & Heat Transfer"
            action={{ href: '/vendor/experiments/new', label: 'Create experiment' }}
            figuresLabel="Your experiments at a glance"
            figures={[
              { title: 'With you', value: 2, detail: '1 returned · 1 draft' },
              { title: 'In review', value: 2, detail: 'Nothing needed from you' },
              { title: 'Published', value: 1, detail: 'Live in the catalogue' },
              { title: 'Read-only', value: 1, detail: 'Course no longer assigned' },
            ]}
          />
        </VendorOverviewColumn>
      </main>,
    );
    const column = container.querySelector('main > div')!;
    expect(column.className).toBe('vr-ov');
    const hero = column.firstElementChild!;
    expect(hero.className).toBe('vr-herocard');
    const band = screen.getByRole('region');
    expect(band).toHaveAccessibleName(/^Overview,\s?Northline Simulation Studio$/);
    expect(band.className).toBe('rb-id vr-hero');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toBe('rb-id-name');
    expect(h1).toHaveAttribute('id', 've-h1');
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1.querySelector('.xr-sr')).toHaveTextContent('Overview,');
    expect(band.querySelector('p.rb-eyebrow-date')).toHaveTextContent('Thursday 27 August 2026');
    expect(band.querySelector('p.rb-id-status > span')).toHaveTextContent(
      'Your course: ME ZG523 · Thermodynamics & Heat Transfer',
    );
    const create = within(band).getByRole('link', { name: 'Create experiment' });
    expect(create.className).toBe('rb-btn rb-btn--lg');
    expect(create.parentElement!.className).toBe('rb-id-act');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    expect(create.querySelector('svg path')).toHaveAttribute('d', V3_ICON_PATHS.add);
    const figures = hero.querySelector('dl')!;
    expect(figures.className).toBe('rb-figs vr-figs');
    expect(figures).toHaveAttribute('aria-label', 'Your experiments at a glance');
    expect(
      [...figures.querySelectorAll('.rb-fig')].map((figure) =>
        [...figure.children].map((child) => `${child.tagName}.${child.className}`),
      ),
    ).toEqual(Array(4).fill(['DT.rb-fig-t', 'DD.rb-fig-n', 'DD.rb-fig-s']));
    expect([...figures.querySelectorAll('.rb-fig-n')].map((n) => n.textContent)).toEqual([
      '2',
      '2',
      '1',
      '1',
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the first visit: no counts, no action; without a prefix the H1 is the title alone', () => {
    const { container } = render(<VendorStudioBand title="Overview" titleId="ve-h1" />);
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('.rb-id-act')).toBeNull();
    expect(container.querySelector('.rb-id-status')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).innerHTML).toBe('Overview');
  });
});

const LEAD = {
  kind: 'Returned to you',
  title: 'Forced Convection',
  meta: 'Academic Reviewer · Prof. A. Menon · 24 Aug 2026',
  reason:
    'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
  references: { label: 'Refers to', items: ['AR · Device need', 'AR · Install notes'] },
  action: {
    href: '/vendor/experiments/SUB-0081/revise',
    label: 'Revise “Forced Convection”',
    accessibleName: 'Revise Forced Convection, returned by the Academic Reviewer',
  },
};

describe('VE-01 “Needs your action” (`section.rb-panel.rb-att`)', () => {
  it('draws the ivory lead and the drafts to finish as the export does', async () => {
    expectDrawn([
      '<div class="rb-split vr-split">',
      '<div class="rb-att-head"><h2 class="rb-h2" id="ve-att-h">Needs your action</h2><p class="rb-note">',
      '<div class="rb-lead vr-lead">',
      '<span class="rb-lead-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#vei-return"></use></svg></span>',
      '<div class="vr-lead-main">',
      '<p class="vr-kind">{{ O.lead.kind }}</p>',
      '<p class="rb-lead-t">{{ O.lead.name }}</p>',
      '<p class="vr-lead-meta">{{ O.lead.meta }}</p>',
      '<blockquote class="vr-lead-q">{{ O.lead.reason }}</blockquote>',
      '<div class="vr-lead-refs"><span class="vr-lead-refs-k">Refers to</span><ul class="vr-reflist">',
      '<li class="vr-ref">{{ x }}</li>',
      '<p class="vr-lead-pend"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-lock"></use></svg>Your changes are saved, not resubmitted. Only you can see them.</p>',
      '<div class="rb-lead-act"><a class="rb-btn rb-btn--primary rb-btn--lg" href="#ve-main"',
      '<ul class="vr-ai-list">',
      '<li class="rb-ai vr-ai">',
      '<span class="rb-ai-n" aria-hidden="true"><span class="rb-ico-tile">',
      '<p class="rb-ai-t"><span class="vr-kind">{{ r.kind }}</span>{{ r.name }}</p>',
      '<p class="rb-ai-d">{{ r.sub }}</p>',
      '<div class="rb-ai-act"><a class="{{ r.btnCls }}"',
    ]);
    const { container } = render(
      <VendorWorkSplit>
        <VendorAttention
          title="Needs your action"
          titleId="ve-att-h"
          note="2 items"
          lead={{
            ...LEAD,
            pending: 'Your changes are saved, not resubmitted. Only you can see them.',
          }}
          rows={[
            {
              key: 'draft',
              icon: 'edit',
              kind: 'Draft to finish',
              title: 'Pin Fin Efficiency',
              detail: 'Saved at step 2 of 4 · 25 Aug 2026 · only you can see it',
              action: {
                href: '/vendor/experiments/SUB-0079/edit?step=formats',
                label: 'Finish draft',
                accessibleName: 'Finish the draft of Pin Fin Efficiency',
              },
            },
          ]}
        />
      </VendorWorkSplit>,
    );
    expect(container.firstElementChild!.className).toBe('rb-split vr-split');
    const panel = screen.getByRole('region', { name: 'Needs your action' });
    expect(panel.className).toBe('rb-panel rb-att');
    expect(panel.querySelector('.rb-att-head > p.rb-note')).toHaveTextContent('2 items');
    const lead = panel.querySelector('div.rb-lead')!;
    expect(lead.className).toBe('rb-lead vr-lead');
    expect(lead.querySelector('.rb-lead-ico')).toHaveAttribute('aria-hidden', 'true');
    expect(lead.querySelector('.rb-lead-ico path')).toHaveAttribute('d', V3_ICON_PATHS.returned);
    const main = lead.querySelector('.vr-lead-main')!;
    expect([...main.children].map((child) => `${child.tagName}.${child.className}`)).toEqual([
      'P.vr-kind',
      'P.rb-lead-t',
      'P.vr-lead-meta',
      'BLOCKQUOTE.vr-lead-q',
      'DIV.vr-lead-refs',
      'P.vr-lead-pend',
    ]);
    expect(main.querySelector('.vr-lead-q')).toHaveTextContent(LEAD.reason);
    expect(main.querySelector('.vr-lead-refs-k')).toHaveTextContent('Refers to');
    expect(
      [...main.querySelectorAll('ul.vr-reflist > li.vr-ref')].map((li) => li.textContent),
    ).toEqual(['AR · Device need', 'AR · Install notes']);
    expect(main.querySelector('.vr-lead-pend path')).toHaveAttribute('d', V3_ICON_PATHS.lock);
    const revise = within(panel).getByRole('link', {
      name: 'Revise Forced Convection, returned by the Academic Reviewer',
    });
    expect(revise.className).toBe('rb-btn rb-btn--primary rb-btn--lg');
    expect(revise).toHaveTextContent('Revise “Forced Convection”');
    expect(revise.parentElement!.className).toBe('rb-lead-act');
    const row = panel.querySelector('ul.vr-ai-list > li')!;
    expect(row.className).toBe('rb-ai vr-ai');
    expect(row.querySelector('.rb-ai-n')).toHaveAttribute('aria-hidden', 'true');
    expect(row.querySelector('.rb-ai-n > .rb-ico-tile path')).toHaveAttribute(
      'd',
      V3_ICON_PATHS.edit,
    );
    expect(row.querySelector('.rb-ai-t')!.innerHTML).toBe(
      '<span class="vr-kind">Draft to finish</span>Pin Fin Efficiency',
    );
    expect(row.querySelector('.rb-ai-d')).toHaveTextContent(
      'Saved at step 2 of 4 · 25 Aug 2026 · only you can see it',
    );
    const finish = within(row as HTMLElement).getByRole('link', {
      name: 'Finish the draft of Pin Fin Efficiency',
    });
    expect(finish.className).toBe('rb-btn');
    expect(finish).toHaveAttribute('href', '/vendor/experiments/SUB-0079/edit?step=formats');
    expect(container.querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('with nothing returned the first row’s action is gold; without references no “Refers to”', () => {
    render(
      <VendorAttention
        title="Needs your action"
        titleId="ve-att-h"
        note="1 item"
        rows={[
          {
            key: 'draft',
            icon: 'edit',
            kind: 'Draft to finish',
            title: 'Pin Fin Efficiency',
            detail: 'Saved at step 1 of 4 · 25 Aug 2026 · only you can see it',
            action: { href: '/edit', label: 'Finish draft', primary: true },
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Finish draft' }).className).toBe(
      'rb-btn rb-btn--primary',
    );
    const { container } = render(
      <VendorAttention
        title="Needs your action"
        titleId="ve-att-2"
        lead={{ ...LEAD, references: { label: 'Refers to', items: [] } }}
      />,
    );
    expect(container.querySelector('.vr-lead-refs')).toBeNull();
    expect(container.querySelector('.vr-lead-pend')).toBeNull();
    expect(container.querySelector('ul')).toBeNull();
  });

  it('nothing needs the Vendor: the calm block (`div.rb-calm`)', async () => {
    expectDrawn([
      '<div class="rb-calm">',
      '<span class="rb-calm-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#vei-check"></use></svg></span>',
      '<p class="rb-calm-t">Nothing needs you right now</p>',
    ]);
    const { container } = render(
      <VendorAttention
        title="Needs your action"
        titleId="ve-att-h"
        note="Nothing waiting"
        calm={{
          title: 'Nothing needs you right now',
          line: 'Experiments with the Academic Reviewer or the Content Manager need nothing from you.',
        }}
      />,
    );
    const calm = container.querySelector('.rb-calm')!;
    expect(calm.querySelector('.rb-calm-ico')).toHaveAttribute('aria-hidden', 'true');
    expect(calm.querySelector('p.rb-calm-t')).toHaveTextContent('Nothing needs you right now');
    expect(calm.querySelector('p.rb-calm-d')).toHaveTextContent('need nothing from you');
    expect(container.querySelector('.rb-lead, ul')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VE-01 Recent activity (`section.rb-panel.vr-act`)', () => {
  it('draws each entry with its day and time, its record link, and the foot links', async () => {
    expectDrawn([
      '<section class="rb-panel vr-act" aria-labelledby="ve-act-h">',
      '<div class="vr-act-head"><h2 class="rb-h2" id="ve-act-h">Recent activity</h2><p class="rb-note">Newest first</p></div>',
      '<ul class="rb-rows vr-rows">',
      '<li class="rb-row">',
      '<div class="rb-row-main"><p class="rb-row-t">{{ a.what }}</p><p class="rb-row-d"><a class="vr-rowlink" href="#ve-main"',
      '<p class="rb-row-when"><b>{{ a.day }}</b><span>{{ a.time }}</span></p>',
      '<div class="vr-act-foot"><a class="rb-link" href="#ve-main"',
    ]);
    const { container } = render(
      <VendorRecentActivity
        title="Recent activity"
        titleId="ve-act-h"
        note="Newest first"
        rows={[
          {
            key: 'e1',
            what: 'Submitted · revision 2',
            name: 'Conduction Through a Composite Wall',
            href: '/vendor/experiments/SUB-0077',
            accessibleName:
              'Submitted · revision 2, Conduction Through a Composite Wall, 26 Aug 2026, 11:30. Open the experiment record',
            day: '26 Aug',
            time: '11:30',
          },
        ]}
        links={[
          { href: '/vendor/experiments?changed=last-7-days', label: 'Changed in the last 7 days' },
          { href: '/vendor/experiments', label: 'See all your experiments' },
        ]}
      />,
    );
    const panel = screen.getByRole('region', { name: 'Recent activity' });
    expect(panel.className).toBe('rb-panel vr-act');
    expect(panel.querySelector('.vr-act-head > p.rb-note')).toHaveTextContent('Newest first');
    const row = panel.querySelector('ul.rb-rows.vr-rows > li.rb-row')!;
    expect(row.querySelector('.rb-row-main > p.rb-row-t')).toHaveTextContent(
      'Submitted · revision 2',
    );
    const link = within(row as HTMLElement).getByRole('link', {
      name: 'Submitted · revision 2, Conduction Through a Composite Wall, 26 Aug 2026, 11:30. Open the experiment record',
    });
    expect(link.className).toBe('vr-rowlink');
    expect(link).toHaveAttribute('href', '/vendor/experiments/SUB-0077');
    expect(row.querySelector('p.rb-row-when')!.innerHTML).toBe('<b>26 Aug</b><span>11:30</span>');
    const foot = panel.querySelector('.vr-act-foot')!;
    expect([...foot.querySelectorAll('a.rb-link')].map((a) => a.getAttribute('href'))).toEqual([
      '/vendor/experiments?changed=last-7-days',
      '/vendor/experiments',
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VE-02 status tabs (`div.rb-switchbar.vr-switchbar`)', () => {
  it('draws the tabs with their counts, pressed state and names; a press chooses', async () => {
    expectDrawn([
      '<div class="rb-switchbar vr-switchbar">',
      '<div class="rb-switch" role="group" aria-label="Show experiments by status">',
      'aria-pressed="{{ t.pressed }}" aria-label="{{ t.aria }}" onClick="{{ t.pick }}">{{ t.label }}<b aria-hidden="true">{{ t.n }}</b></button>',
    ]);
    const onChange = vi.fn();
    const { container } = render(
      <VendorStatusTabs
        label="Show experiments by status"
        value="all"
        onChange={onChange}
        tabs={[
          { key: 'all', label: 'All', count: 6, accessibleName: 'All, 6 experiments' },
          {
            key: 'returned',
            label: 'Returned',
            count: 1,
            accessibleName: 'Returned, 1 experiment',
          },
        ]}
      />,
    );
    expect(container.firstElementChild!.className).toBe('rb-switchbar vr-switchbar');
    const group = screen.getByRole('group', { name: 'Show experiments by status' });
    expect(group.className).toBe('rb-switch');
    const all = within(group).getByRole('button', { name: 'All, 6 experiments' });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(all.innerHTML).toBe('All<b aria-hidden="true">6</b>');
    const returned = within(group).getByRole('button', { name: 'Returned, 1 experiment' });
    expect(returned).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(returned);
    expect(onChange).toHaveBeenCalledWith('returned');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

const SORT: Omit<VendorSort, 'onToggle'> = {
  direction: 'desc',
  words: { desc: 'newest first', asc: 'oldest first' },
  prefix: 'Sort: ',
  changeOrder: '. Change order',
};

describe('VE-02 tool row (`div.vr-tools[role=search]`)', () => {
  it('draws the search, the 7-day filter, the count, Clear filters and the narrow sort', async () => {
    expectDrawn([
      '<section class="rk-surface vr-list" aria-label="Your experiments">',
      '<div class="vr-tools" role="search" aria-label="Search your experiments">',
      '<div class="vr-search"><label class="xr-sr" for="ve-q">Search by name, ID or course</label><div class="rk-inputwrap"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-search"></use></svg><input id="ve-q" class="rk-input" type="search" placeholder="Search by name, ID or course" autocomplete="off"',
      '<label class="vr-toggle" for="ve-recent"><input type="checkbox" id="ve-recent"',
      '<span>Changed in the last 7 days</span></label>',
      '<div class="vr-tools-r">',
      '<p class="rk-count" role="status">{{ L.count }}</p>',
      '<button type="button" class="rk-clear" onClick="{{ L.clear }}">Clear filters</button>',
      '<div class="rk-sortbar vr-sortnarrow"><button type="button" class="rk-sortbtn" onClick="{{ L.toggleSort }}"><span>Sort: {{ L.sortShort }}</span>',
    ]);
    const clear = vi.fn();
    const toggleSort = vi.fn();
    function Tools() {
      const [query, setQuery] = useState('');
      const [recent, setRecent] = useState(false);
      return (
        <VendorListSurface label="Your experiments">
          <VendorListTools
            label="Search your experiments"
            search={{
              id: 've-q',
              label: 'Search by name, ID or course',
              placeholder: 'Search by name, ID or course',
              value: query,
              onChange: setQuery,
            }}
            toggle={{
              id: 've-recent',
              label: 'Changed in the last 7 days',
              checked: recent,
              onChange: setRecent,
            }}
            count="1 of 6 experiments"
            clear={{ label: 'Clear filters', onClick: clear }}
            sort={{ ...SORT, onToggle: toggleSort }}
          />
        </VendorListSurface>
      );
    }
    const { container } = render(<Tools />);
    const surface = screen.getByRole('region', { name: 'Your experiments' });
    expect(surface.className).toBe('rk-surface vr-list');
    const tools = screen.getByRole('search', { name: 'Search your experiments' });
    expect(tools.className).toBe('vr-tools');
    const search = within(tools).getByRole('searchbox', { name: 'Search by name, ID or course' });
    expect(search.className).toBe('rk-input');
    expect(search.parentElement!.className).toBe('rk-inputwrap');
    expect(search.closest('.vr-search')!.querySelector('label')!.className).toBe('xr-sr');
    fireEvent.change(search, { target: { value: 'fin' } });
    expect(search).toHaveValue('fin');
    const checkbox = within(tools).getByRole('checkbox', { name: 'Changed in the last 7 days' });
    expect(checkbox.closest('label')!.className).toBe('vr-toggle');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    const right = tools.querySelector('.vr-tools-r')!;
    expect(within(right as HTMLElement).getByRole('status')).toHaveTextContent(
      '1 of 6 experiments',
    );
    fireEvent.click(within(right as HTMLElement).getByRole('button', { name: 'Clear filters' }));
    expect(clear).toHaveBeenCalledTimes(1);
    const sort = within(right as HTMLElement).getByRole('button', {
      name: 'Sort: newest first. Change order',
    });
    expect(sort.parentElement!.className).toBe('rk-sortbar vr-sortnarrow');
    expect(sort.querySelector('path')).toHaveAttribute('d', V3_ICON_PATHS.arrowDown);
    fireEvent.click(sort);
    expect(toggleSort).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

const ROWS: readonly VendorExperimentRow[] = [
  {
    key: 'SUB-0081',
    href: '/vendor/experiments/SUB-0081',
    name: 'Forced Convection',
    accessibleName:
      'Forced Convection, SUB-0081, Returned, last change 24 Aug 2026. Open the experiment record',
    id: 'SUB-0081',
    course: 'ME ZG523',
    formats: ['WEB', 'AR'],
    formatsLabel: 'Formats: WEB, AR',
    status: { tone: 'err', label: 'Returned' },
    statusLine: 'By the Academic Reviewer on 24 Aug',
    pending: 'Changes saved, not resubmitted',
    lastChange: '24 Aug 2026',
    action: {
      href: '/vendor/experiments/SUB-0081/revise',
      label: 'Revise',
      accessibleName: 'Revise Forced Convection',
    },
  },
  {
    key: 'SUB-0052',
    href: '/vendor/experiments/SUB-0052',
    name: 'Fin-Tube Bundle',
    accessibleName:
      'Fin-Tube Bundle, SUB-0052, Published, last change 30 Jul 2026. Open the experiment record',
    id: 'SUB-0052',
    formats: ['VR', 'WEB'],
    formatsLabel: 'Formats: WEB, VR',
    status: { tone: 'ok', label: 'Published' },
    statusLine: 'Live in the catalogue since 30 Jul',
    lastChange: '30 Jul 2026',
  },
];

describe('VE-02 experiment table (`table.vr-table`)', () => {
  it('draws the columns, the sortable last change and every cell as the export does', async () => {
    expectDrawn([
      '<table class="vr-table">',
      '<caption class="xr-sr">Your experiments, {{ L.sortLabel }}</caption>',
      '<th scope="col" class="vr-c-exp">Experiment</th>',
      '<th scope="col" class="vr-c-fmt">Formats</th>',
      '<th scope="col" class="vr-c-st">Status</th>',
      '<th scope="col" class="vr-c-date" aria-sort="{{ L.ariaSort }}"><button type="button" class="rk-sortbtn" onClick="{{ L.toggleSort }}">Last change',
      '<span class="xr-sr">, {{ L.sortLabel }}. Change order</span></button></th>',
      '<th scope="col" class="vr-c-act"><span class="xr-sr">Action</span></th>',
      '<td class="vr-c-exp"><a class="rk-rowlink vr-name" href="#ve-main"',
      '<span class="vr-meta"><span class="ve-id">{{ r.id }}</span> · {{ r.course }}</span></td>',
      '<td class="vr-c-fmt"><span class="rk-fmts"',
      '<td class="vr-c-st"><span class="{{ r.stCls }}"><i></i>{{ r.stLabel }}</span><span class="vr-stsub">{{ r.stSub }}</span>',
      '<span class="vr-pending"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-lock"></use></svg>Changes saved, not resubmitted</span>',
      '<td class="vr-c-date"><span class="vr-datek">Last change </span><span class="vr-dated">{{ r.when }}</span></td>',
      '<button type="button" class="rb-btn vr-rowbtn"',
      '<svg class="vr-chev" viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-right"></use></svg>',
    ]);
    const onToggle = vi.fn();
    const { container } = render(
      <VendorExperimentTable
        caption="Your experiments"
        headers={{
          experiment: 'Experiment',
          formats: 'Formats',
          status: 'Status',
          lastChange: 'Last change',
          action: 'Action',
        }}
        sort={{ ...SORT, onToggle }}
        lastChangeLabel="Last change"
        rows={ROWS}
      />,
    );
    const table = screen.getByRole('table', {
      name: 'Your experiments, last change, newest first',
    });
    expect(table.className).toBe('vr-table');
    expect(table.querySelector('caption')!.className).toBe('xr-sr');
    expect([...table.querySelectorAll('thead th')].map((th) => th.className)).toEqual([
      'vr-c-exp',
      'vr-c-fmt',
      'vr-c-st',
      'vr-c-date',
      'vr-c-act',
    ]);
    const dateHead = table.querySelector('th.vr-c-date')!;
    expect(dateHead).toHaveAttribute('aria-sort', 'descending');
    const sort = within(dateHead as HTMLElement).getByRole('button', {
      name: 'Last change, newest first. Change order',
    });
    expect(sort.className).toBe('rk-sortbtn');
    fireEvent.click(sort);
    expect(onToggle).toHaveBeenCalledTimes(1);

    const [returned, published] = [...table.querySelectorAll('tbody tr')] as HTMLElement[];
    const link = within(returned!).getByRole('link', { name: ROWS[0]!.accessibleName });
    expect(link.className).toBe('rk-rowlink vr-name');
    expect(link).toHaveTextContent('Forced Convection');
    expect(returned!.querySelector('.vr-meta')!.innerHTML).toBe('<span>SUB-0081</span> · ME ZG523');
    expect(published!.querySelector('.vr-meta')!.innerHTML).toBe('<span>SUB-0052</span>');
    // The kit's badges, in WEB/AR/VR/MR order, named in words.
    expect([...published!.querySelectorAll('.xr-fmt')].map((badge) => badge.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(published!.querySelector('.rk-fmts .xr-sr')).toHaveTextContent('Formats: WEB, VR');
    const pill = returned!.querySelector('td.vr-c-st > span.xr-st')!;
    expect(pill.className).toBe('xr-st xr-st--err');
    expect(pill).toHaveTextContent('Returned');
    expect(returned!.querySelector('.vr-stsub')).toHaveTextContent(
      'By the Academic Reviewer on 24 Aug',
    );
    expect(returned!.querySelector('.vr-pending')).toHaveTextContent(
      'Changes saved, not resubmitted',
    );
    expect(published!.querySelector('.vr-pending')).toBeNull();
    expect(returned!.querySelector('td.vr-c-date')!.innerHTML).toBe(
      '<span class="vr-datek">Last change </span><span class="vr-dated">24 Aug 2026</span>',
    );
    const revise = within(returned!).getByRole('link', { name: 'Revise Forced Convection' });
    expect(revise.className).toBe('rb-btn vr-rowbtn');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    const chevron = published!.querySelector('td.vr-c-act > svg')!;
    expect(chevron).toHaveAttribute('class', 'vr-chev');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron.querySelector('path')).toHaveAttribute('d', V3_ICON_PATHS.chevronRight);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a press anywhere on a row opens its record, not on its own action', () => {
    const clicks: string[] = [];
    const { container } = render(
      <div
        onClick={(event) => {
          const anchor = (event.target as Element).closest('a');
          if (anchor) {
            event.preventDefault();
            clicks.push(anchor.getAttribute('href')!);
          }
        }}
      >
        <VendorExperimentTable
          caption="Your experiments"
          headers={{
            experiment: 'Experiment',
            formats: 'Formats',
            status: 'Status',
            lastChange: 'Last change',
            action: 'Action',
          }}
          sort={{ ...SORT, direction: 'asc', onToggle: () => {} }}
          lastChangeLabel="Last change"
          rows={ROWS}
        />
      </div>,
    );
    const [returned, published] = [...container.querySelectorAll('tbody tr')] as HTMLElement[];
    fireEvent.click(published!.querySelector('.vr-stsub')!);
    expect(clicks).toEqual(['/vendor/experiments/SUB-0052']);
    fireEvent.click(within(returned!).getByRole('link', { name: 'Revise Forced Convection' }));
    expect(clicks).toEqual(['/vendor/experiments/SUB-0052', '/vendor/experiments/SUB-0081/revise']);
    expect(container.querySelector('th.vr-c-date')).toHaveAttribute('aria-sort', 'ascending');
    expect(container.querySelector('th.vr-c-date path')).toHaveAttribute(
      'd',
      V3_ICON_PATHS.arrowUp,
    );
  });
});
