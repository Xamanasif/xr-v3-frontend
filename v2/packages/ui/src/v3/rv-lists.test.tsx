/**
 * What only the Academic Reviewer's lists draw (owner-approved export design/v3-refined-b/roles/RV-v1,
 * `project/RV.dc.html` RV-01, RV-02 and RV-05): markup against the export's classes, structure and
 * ARIA (excerpts of its template), the behaviour (tabs and their keys, the toolbar's chips and
 * Clear filters, the whole row as a link), the class contract, the accessibility checks and no
 * internal reference anywhere a piece draws.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  rvExportText,
} from '../testing/index.js';
import { ButtonLink, TextLink } from './actions.js';
import { V3_ICON_PATHS } from './icons.js';
import { RvFormatBadges, RvKindTag } from './rv.js';
import {
  RvCalm,
  RvDecisionsTable,
  RvDesk,
  RvListPanel,
  RvListTabs,
  RvListToolbar,
  RvLoadingRows,
  RvNextInLine,
  RvQueueTable,
  RvQueueTypes,
  RvRecentDecisions,
  RvScopeCourses,
  RvSide,
  RvSideCard,
  rvListTabId,
  RvWaitList,
  RvWaitPanel,
  type RvWaitingItem,
} from './rv-lists.js';

const ROOT = rvExportText('RV.dc.html');
const section = (from: string, to: string) => ROOT.slice(ROOT.indexOf(from), ROOT.indexOf(to));
const OVERVIEW = section('{{ isOverview }}', '{{ isQueue }}');
const QUEUE = section('{{ isQueue }}', '{{ isReviewed }}');
const REVIEWED = section('{{ isReviewed }}', '{{ isItem }}');

/** A tab by its visible words (its accessible name joins the hidden ", " and the count). */
const tab = (words: string) =>
  screen.getAllByRole('tab').find((element) => element.textContent === words)!;
const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');
const classesOf = (elements: Iterable<Element>) =>
  [...elements].map((element) => element.getAttribute('class') ?? '');

const FLASH: RvWaitingItem = {
  key: 'flash',
  kind: <RvKindTag kind="new" label="New submission" />,
  name: 'Flash Distillation',
  courseCode: 'CHE ZG513',
  courseName: 'Process Instrumentation & Control',
  from: 'Revision 1 · from Meridian Virtual Labs',
  flag: 'No learning outcomes yet',
  age: '3 days',
  since: 'since 24 Aug',
  action: {
    label: 'Start review',
    href: '/reviewer/submissions/x',
    accessibleName: 'Start review: Flash Distillation',
  },
};

const VENTURI: RvWaitingItem = {
  key: 'venturi',
  kind: <RvKindTag kind="recheck" label="Re-check" />,
  name: 'Venturi Meter Calibration',
  courseCode: 'CHE ZG513',
  courseName: 'Process Instrumentation & Control',
  from: 'Sent back by the Content Manager',
  focus: '“The second learning outcome mentions a Pitot tube, which this experiment…”',
  age: '2 days',
  since: 'since 25 Aug',
  action: {
    label: 'Review',
    href: '/reviewer/submissions/y',
    accessibleName: 'Review Venturi Meter Calibration',
  },
};

describe('RV-01 the desk', () => {
  it('the wait panel, next in line (one gold Start review) and the rest oldest first', async () => {
    for (const piece of [
      '<div class="rv-desk">',
      '<section class="rb-panel rv-wait" aria-labelledby="rv-ov-h">',
      '<div class="rv-wait-h"><h2 class="rb-h2" id="rv-ov-h">Waiting for your decision</h2><p class="rb-note">{{ OV.note }}</p></div>',
      '<p class="rv-next-k"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rvi-clock"></use></svg>Next in line · waiting longest</p>',
      '<h3 class="rv-next-t">{{ OV.next.name }}</h3>',
      '<p class="rv-age rv-age--lg"><b>{{ OV.next.age }}</b><span>{{ OV.next.since }}</span></p>',
      '<a class="rb-btn rb-btn--primary rb-btn--lg rv-btn-wrap" href="#rv-top" aria-label="{{ OV.next.aria }}"',
      '<h3 class="rv-then">Then, oldest first</h3>',
      '<li class="rv-wl-row">',
      '<p class="rv-age"><b>{{ r.age }}</b><span>{{ r.since }}</span></p>',
      '<p class="rv-wl-t">{{ r.name }}</p>',
      '<span class="rv-wl-cname">{{ r.courseName }}</span>',
      '<p class="rv-wl-focus">{{ r.focus }}</p>',
      '<div class="rv-wl-act"><a class="rb-btn" href="#rv-top" aria-label="{{ r.aria }}"',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    const { container } = render(
      <RvDesk>
        <RvWaitPanel title="Waiting for your decision" titleId="rv-ov-h" note="Oldest first">
          <RvNextInLine
            label="Next in line · waiting longest"
            item={FLASH}
            formats={<RvFormatBadges formats={['WEB']} label="Formats: WEB" />}
          />
          <RvWaitList title="Then, oldest first" items={[VENTURI]} />
        </RvWaitPanel>
      </RvDesk>,
    );
    const panel = screen.getByRole('region', { name: 'Waiting for your decision' });
    expect(panel).toHaveClass('rb-panel', 'rv-wait');
    expect(panel.parentElement).toHaveClass('rv-desk');
    expect(panel.querySelector('.rv-wait-h > p.rb-note')).toHaveTextContent('Oldest first');
    const next = panel.querySelector('.rv-next')!;
    expect(pathOf(next.querySelector('p.rv-next-k'))).toBe(V3_ICON_PATHS.clock);
    expect(classesOf(next.querySelectorAll('.rv-next-main > *'))).toEqual([
      'rv-kind rv-kind--new',
      'rv-next-t',
      'rv-next-meta',
      'rv-from',
      'rv-next-facts',
    ]);
    expect(next.querySelector('.rv-next-meta > .rv-meta-course')).toHaveTextContent(
      'CHE ZG513Process Instrumentation & Control',
    );
    expect(classesOf(next.querySelectorAll('.rv-next-facts > *'))).toEqual([
      'rk-fmts',
      'rk-tag-warn',
    ]);
    expect(pathOf(next.querySelector('.rk-tag-warn'))).toBe(V3_ICON_PATHS.flag);
    const start = screen.getByRole('link', { name: 'Start review: Flash Distillation' });
    expect(start).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg', 'rv-btn-wrap');
    expect(start).toHaveTextContent('Start review');
    expect(next.querySelector('.rv-next-side > p.rv-age.rv-age--lg')).toHaveTextContent(
      '3 dayssince 24 Aug',
    );
    expect(panel.querySelector('h3.rv-then')).toHaveTextContent('Then, oldest first');
    const row = panel.querySelector('ul.rv-wl > li.rv-wl-row')!;
    expect(classesOf(row.children)).toEqual(['rv-age', 'rv-wl-main', 'rv-wl-act']);
    expect(classesOf(row.querySelectorAll('.rv-wl-main > *'))).toEqual([
      'rv-kind rv-kind--recheck',
      'rv-wl-t',
      'rv-wl-meta',
      'rv-from',
      'rv-wl-focus',
    ]);
    expect(row.querySelector('.rv-wl-cname')).toHaveTextContent(
      'Process Instrumentation & Control',
    );
    expect(
      within(row as HTMLElement).getByRole('link', { name: 'Review Venturi Meter Calibration' }),
    ).toHaveClass('rb-btn');
    expect(container.querySelectorAll('a.rb-btn--primary')).toHaveLength(1);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('a row without a course name or a focus leaves them out', () => {
    const { container } = render(
      <RvWaitList
        title="Then, oldest first"
        items={[
          { ...VENTURI, courseName: null, focus: undefined, flag: 'No learning outcomes yet' },
        ]}
      />,
    );
    expect(container.querySelector('.rv-wl-cname')).toBeNull();
    expect(container.querySelector('.rv-wl-focus')).toBeNull();
    expect(container.querySelector('.rv-wl-main > .rk-tag-warn')).toHaveTextContent(
      'No learning outcomes yet',
    );
  });

  it('the calm state is a status with the tick, then its one action', async () => {
    for (const piece of [
      '<div class="rb-calm" role="status">',
      '<span class="rb-calm-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#rvi-calm"></use></svg></span>',
      '<p class="rb-calm-t">Nothing is waiting for your decision</p>',
      '<div class="rv-calm-act"><a class="rb-btn" href="#rv-top"',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    expect(ROOT).toContain(
      '<symbol id="rvi-calm" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5">',
    );
    const { container } = render(
      <RvWaitPanel title="Waiting for your decision" titleId="rv-ov-h" note="Nothing waiting">
        <RvCalm
          title="Nothing is waiting for your decision"
          action={<ButtonLink href="/reviewer/reviewed">Open Reviewed by me</ButtonLink>}
        >
          New submissions, updates and re-checks appear here when they reach you.
        </RvCalm>
      </RvWaitPanel>,
    );
    const calm = screen.getByRole('status');
    expect(calm).toHaveClass('rb-calm');
    expect(pathOf(calm.querySelector('.rb-calm-ico'))).toBe('M5 12.5l4.5 4.5L19 7.5');
    expect(classesOf(calm.children)).toEqual(['rb-calm-ico', 'rb-calm-t', 'rb-calm-d']);
    expect(calm.nextElementSibling).toHaveClass('rv-calm-act');
    expect(screen.getByRole('link', { name: 'Open Reviewed by me' })).toHaveClass('rb-btn');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('RV-01 the side cards', () => {
  it('In your queue, Your review scope, Recently decided (named links)', async () => {
    for (const piece of [
      '<section class="rb-panel rv-sidecard" aria-labelledby="rv-ty-h">',
      '<h2 class="rv-side-h" id="rv-ty-h">In your queue</h2>',
      '<li><a class="rv-type" href="#rv-top" aria-label="{{ t.aria }}"',
      '<b class="rv-type-n" aria-hidden="true">{{ t.nTxt }}</b>',
      '<li><a class="rv-course" href="#rv-top" aria-label="{{ c.aria }}"',
      '<span class="rk-code">{{ c.code }}</span><span class="rv-course-t">{{ c.t }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#rvi-right"></use></svg>',
      '<p class="rv-side-note">Only these courses reach your queue.</p>',
      '<div class="rv-side-hrow"><h2 class="rv-side-h" id="rv-rc-h">Recently decided</h2><a class="rb-link" href="#rv-top"',
      '<span class="rv-recent-t">{{ h.name }}</span><span class="rv-recent-d"><span class="{{ h.stCls }}"><i></i>{{ h.dec }}</span><span>{{ h.when }}</span></span><span class="rv-recent-now">{{ h.now }}</span>',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    expect(ROOT).toContain("icoCls: 'rv-kind-ico rv-kind-ico--recheck rv-kind--recheck'");
    expect(ROOT).toContain(
      "stCls: 'xr-st rv-st-sm ' + (h.dec === 'approved' ? 'xr-st--ok' : 'xr-st--err')",
    );
    const { container } = render(
      <RvSide>
        <RvSideCard title="In your queue" titleId="rv-ty-h">
          <RvQueueTypes
            types={[
              {
                kind: 'new',
                title: 'New submissions',
                detail: 'From vendors · 1 is a resubmission',
                count: 2,
                href: '/reviewer/queue?type=new',
                accessibleName: 'New submissions: 2 items. Open them in the review queue',
              },
              {
                kind: 'recheck',
                title: 'Re-checks',
                detail: 'Sent back by the Content Manager',
                count: 1,
                href: '/reviewer/queue?type=recheck',
                accessibleName: 'Re-checks: 1 item. Open them in the review queue',
              },
              {
                kind: 'update',
                title: 'Updates',
                detail: 'Corrections to published experiments',
                count: 0,
                href: '/reviewer/queue?type=update',
                accessibleName: 'Updates: 0 items. Open them in the review queue',
              },
            ]}
          />
        </RvSideCard>
        <RvSideCard
          title="Your review scope"
          titleId="rv-sc-h"
          note="Only these courses reach your queue."
        >
          <RvScopeCourses
            courses={[
              {
                key: 'che',
                code: 'CHE ZG513',
                name: 'Process Instrumentation & Control',
                href: '/reviewer/queue?courseId=che',
                accessibleName:
                  'CHE ZG513 Process Instrumentation & Control. Open the review queue for this course',
              },
            ]}
          />
        </RvSideCard>
        <RvSideCard
          title="Recently decided"
          titleId="rv-rc-h"
          link={<TextLink href="/reviewer/reviewed">All decisions</TextLink>}
        >
          <RvRecentDecisions
            items={[
              {
                key: 'fc',
                name: 'Forced Convection',
                decision: 'Returned to vendor',
                approved: false,
                when: '24 Aug 2026',
                now: 'With the vendor to revise',
                href: '/reviewer/submissions/z',
                accessibleName:
                  'Forced Convection, returned to vendor on 24 Aug 2026. Now: With the vendor to revise. Open it',
              },
              {
                key: 'pb',
                name: 'Packed Bed Pressure Drop',
                decision: 'Approved',
                approved: true,
                when: '21 Aug 2026',
                now: 'With the Content Manager · not published',
                href: '/reviewer/submissions/w',
                accessibleName: 'Packed Bed Pressure Drop, approved on 21 Aug 2026. Open it',
              },
            ]}
          />
        </RvSideCard>
      </RvSide>,
    );
    expect(container.firstElementChild).toHaveClass('rv-side');
    const queue = screen.getByRole('region', { name: 'In your queue' });
    expect(queue).toHaveClass('rb-panel', 'rv-sidecard');
    const types = queue.querySelectorAll('ul.rv-types > li > a.rv-type');
    expect(classesOf([...types].map((type) => type.firstElementChild!))).toEqual([
      'rv-kind-ico rv-kind--new',
      'rv-kind-ico rv-kind-ico--recheck rv-kind--recheck',
      'rv-kind-ico rv-kind-ico--update rv-kind--update',
    ]);
    expect([...types].map((type) => pathOf(type))).toEqual([
      V3_ICON_PATHS.kindNew,
      V3_ICON_PATHS.kindRecheck,
      V3_ICON_PATHS.kindUpdate,
    ]);
    const first = screen.getByRole('link', {
      name: 'New submissions: 2 items. Open them in the review queue',
    });
    expect(first).toHaveAttribute('href', '/reviewer/queue?type=new');
    expect(first.querySelector('b.rv-type-n')).toHaveAttribute('aria-hidden', 'true');
    expect(first).toHaveTextContent('New submissionsFrom vendors · 1 is a resubmission2');

    const scope = screen.getByRole('region', { name: 'Your review scope' });
    const course = within(scope).getByRole('link', {
      name: 'CHE ZG513 Process Instrumentation & Control. Open the review queue for this course',
    });
    expect(classesOf(course.children)).toEqual(['rk-code', 'rv-course-t', '']);
    expect(pathOf(course)).toBe(V3_ICON_PATHS.chevronRight);
    expect(scope.querySelector('p.rv-side-note')).toHaveTextContent(
      'Only these courses reach your queue.',
    );

    const recent = screen.getByRole('region', { name: 'Recently decided' });
    expect(recent.querySelector('.rv-side-hrow > h2.rv-side-h + a.rb-link')).toHaveTextContent(
      'All decisions',
    );
    const rows = recent.querySelectorAll('ul.rv-recent > li > a.rv-recent-row');
    expect(classesOf(rows[0]!.children)).toEqual(['rv-recent-t', 'rv-recent-d', 'rv-recent-now']);
    expect(classesOf(recent.querySelectorAll('.rv-recent-d > .xr-st'))).toEqual([
      'xr-st rv-st-sm xr-st--err',
      'xr-st rv-st-sm xr-st--ok',
    ]);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });
});

function Tabbed({ onChange }: { readonly onChange?: (value: string) => void }) {
  const [value, setValue] = useState<'all' | 'new' | 'recheck' | 'update'>('all');
  return (
    <>
      <RvListTabs
        label="Review type"
        idPrefix="rv-qt"
        panelId="rv-q-panel"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        tabs={[
          { value: 'all', label: 'All', count: 4 },
          { value: 'new', label: 'New submissions', count: 2 },
          { value: 'recheck', label: 'Re-checks', count: 1 },
          { value: 'update', label: 'Updates', count: 1 },
        ]}
      />
      <RvListPanel id="rv-q-panel" labelledBy={rvListTabId('rv-qt', value)}>
        <p>Rows</p>
      </RvListPanel>
    </>
  );
}

describe('RV-02, RV-05 the tabs and the panel', () => {
  it('ARIA tabs with counts, one Tab stop, the arrow keys, Home and End; the panel follows', async () => {
    for (const piece of [
      '<div class="rv-qtabs">',
      '<div class="rk-tabs" role="tablist" aria-label="Review type"',
      '<button type="button" class="rk-tab" role="tab" id="{{ t.id }}" aria-selected="{{ t.sel }}" aria-controls="rv-q-panel" tabindex="{{ t.tab }}"',
      '<span class="rv-tabn"><span class="xr-sr">, </span>{{ t.n }}</span>',
      '<div id="rv-q-panel" role="{{ Q.panelRole }}" aria-labelledby="{{ Q.panelBy }}">',
    ]) {
      expect(QUEUE).toContain(piece);
    }
    expect(REVIEWED).toContain('<div class="rv-qtabs rv-qtabs--3">');
    expect(ROOT).toContain(
      "if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % TABS.length;",
    );
    const changed = vi.fn();
    const { container } = render(<Tabbed onChange={changed} />);
    const list = screen.getByRole('tablist', { name: 'Review type' });
    expect(list.parentElement).toHaveClass('rv-qtabs');
    expect(list.parentElement).not.toHaveClass('rv-qtabs--3');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'All, 4',
      'New submissions, 2',
      'Re-checks, 1',
      'Updates, 1',
    ]);
    expect(tab('All, 4')).toHaveAttribute('aria-selected', 'true');
    expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1', '-1', '-1']);
    expect(tabs.every((tab) => tab.getAttribute('aria-controls') === 'rv-q-panel')).toBe(true);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'rv-qt-all');

    const press = (key: string) => fireEvent.keyDown(document.activeElement!, { key });
    tabs[0]!.focus();
    press('ArrowRight');
    expect(changed).toHaveBeenLastCalledWith('new');
    expect(tab('New submissions, 2')).toHaveFocus();
    press('ArrowDown');
    expect(changed).toHaveBeenLastCalledWith('recheck');
    press('End');
    expect(changed).toHaveBeenLastCalledWith('update');
    press('ArrowRight');
    expect(changed).toHaveBeenLastCalledWith('all');
    press('ArrowLeft');
    expect(changed).toHaveBeenLastCalledWith('update');
    press('ArrowUp');
    expect(changed).toHaveBeenLastCalledWith('recheck');
    press('Home');
    expect(changed).toHaveBeenLastCalledWith('all');
    expect(tab('All, 4')).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'rv-qt-all');
    fireEvent.click(tab('Re-checks, 1'));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'rv-qt-recheck');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('no counts while loading; three tabs stack on phones; an empty list is a plain region', () => {
    const { container } = render(
      <>
        <RvListTabs
          label="Show"
          idPrefix="rv-rt"
          panelId="rv-r-panel"
          value="all"
          onChange={() => {}}
          three
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'new', label: 'New submissions' },
            { value: 'update', label: 'Updates' },
          ]}
        />
        <RvListPanel id="rv-r-panel" labelledBy={null}>
          <p>Nothing</p>
        </RvListPanel>
      </>,
    );
    expect(container.firstElementChild).toHaveClass('rv-qtabs', 'rv-qtabs--3');
    expect(container.querySelector('.rv-tabn')).toBeNull();
    const panel = container.querySelector('#rv-r-panel')!;
    expect(panel).not.toHaveAttribute('role');
    expect(panel).not.toHaveAttribute('aria-labelledby');
  });
});

function Toolbar({ solo = false }: { readonly solo?: boolean }) {
  const [search, setSearch] = useState('dist');
  const [course, setCourse] = useState('CHE ZG513');
  const chips = [
    ...(search ? [{ key: 's', label: `Search: “${search}”`, onRemove: () => setSearch('') }] : []),
    ...(!solo && course !== 'all'
      ? [{ key: 'c', label: `Course: ${course}`, onRemove: () => setCourse('all') }]
      : []),
  ];
  return (
    <RvListToolbar
      label={solo ? 'Filter your decisions' : 'Filter the review queue'}
      search={{
        id: solo ? 'rv-r-search' : 'rv-q-search',
        label: solo ? 'Search your decisions' : 'Search the queue',
        placeholder: solo ? 'Name or course' : 'Name, course or sender',
        value: search,
        onChange: setSearch,
      }}
      course={
        solo
          ? undefined
          : {
              id: 'rv-q-course',
              label: 'Course',
              value: course,
              options: [
                { value: 'all', label: 'All courses' },
                { value: 'CHE ZG513', label: 'CHE ZG513' },
              ],
              onChange: setCourse,
            }
      }
      count="1 of 4 items · oldest first"
      chips={chips}
      clear={
        chips.length > 0
          ? {
              label: 'Clear filters',
              onClear: () => {
                setSearch('');
                setCourse('all');
              },
            }
          : undefined
      }
    />
  );
}

describe('RV-02, RV-05 the toolbar', () => {
  it('search and Course, the count, a chip per filter, Clear filters (focus kept)', async () => {
    for (const piece of [
      '<div class="rk-toolbar">',
      '<div class="rk-tools" role="search" aria-label="Filter the review queue">',
      '<div class="rk-field rk-search">',
      '<label class="rk-label" for="rv-q-search">Search the queue</label>',
      'placeholder="Name, course or sender" autocomplete="off"',
      '<div class="rk-field rk-field--st">',
      '<div class="rk-statusline">',
      '<p class="rk-count" role="status">{{ Q.count }}</p>',
      '<span class="rk-chip">{{ c.label }}<button type="button" aria-label="{{ c.aria }}"',
      '<button type="button" class="rk-clear"',
    ]) {
      expect(QUEUE).toContain(piece);
    }
    expect(REVIEWED).toContain(
      '<div class="rk-tools rv-tools--solo" role="search" aria-label="Filter your decisions">',
    );
    const { container } = render(<Toolbar />);
    const tools = screen.getByRole('search', { name: 'Filter the review queue' });
    expect(tools).toHaveClass('rk-tools');
    expect(tools).not.toHaveClass('rv-tools--solo');
    const search = screen.getByRole('searchbox', { name: 'Search the queue' });
    expect(search).toHaveAttribute('id', 'rv-q-search');
    expect(search).toHaveAttribute('autocomplete', 'off');
    expect(search.closest('.rk-field')).toHaveClass('rk-search');
    expect(screen.getByRole('combobox', { name: 'Course' }).closest('.rk-field')).toHaveClass(
      'rk-field--st',
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 of 4 items · oldest first');
    expect(screen.getByRole('status')).toHaveClass('rk-count');
    // Removing a chip moves focus to the next one, then to the search.
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Search: “dist”' }));
    expect(screen.getByRole('button', { name: 'Remove filter Course: CHE ZG513' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Course: CHE ZG513' }));
    expect(search).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    fireEvent.change(search, { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the search alone (`rv-tools--solo`)', () => {
    render(<Toolbar solo />);
    expect(screen.getByRole('search', { name: 'Filter your decisions' })).toHaveClass(
      'rk-tools',
      'rv-tools--solo',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByRole('searchbox', { name: 'Search your decisions' })).toHaveAttribute(
      'placeholder',
      'Name or course',
    );
  });
});

describe('RV-02 the review-queue table, RV-05 the decisions table', () => {
  it('the queue: caption, the four columns, a row as one link; a press on the row follows it', async () => {
    for (const piece of [
      '<table class="rk-table rv-qtable">',
      '<caption>Items waiting for your decision, oldest first</caption>',
      '<th scope="col" class="rv-c-item">Experiment</th>',
      '<th scope="col" class="rv-c-when" aria-sort="descending">Waiting</th>',
      '<td class="rv-c-item"><a class="rk-rowlink" href="#rv-top"',
      '<span class="rv-cell-course"><span class="rk-code">{{ r.course }}</span>{{ r.courseName }}</span><span class="rv-cell-ref">',
      '<span class="rk-small">{{ r.from }}</span></td>',
      '<span class="rv-focus-t">{{ r.focus }}</span>',
      '<td class="rv-c-when"><span class="rk-inlabel">Waiting </span><span class="rv-age"><b>{{ r.age }}</b><span>{{ r.sinceTxt }}</span></span></td>',
    ]) {
      expect(QUEUE).toContain(piece);
    }
    const followed = vi.fn((event: Event) => event.preventDefault());
    const { container } = render(
      <RvQueueTable
        caption="Items waiting for your decision, oldest first"
        headers={{
          item: 'Experiment',
          kind: 'Review type',
          focus: 'What to look at',
          when: 'Waiting',
        }}
        whenLabel="Waiting"
        rows={[
          {
            key: 'a',
            href: '/reviewer/submissions/a',
            name: 'Flash Distillation',
            accessibleName:
              'Flash Distillation, new submission, waiting since 24 Aug 2026. Review it',
            courseCode: 'CHE ZG513',
            courseName: 'Process Instrumentation & Control',
            formats: <RvFormatBadges formats={['WEB']} label="Formats: WEB" />,
            kind: <RvKindTag kind="new" label="New submission" />,
            from: 'Revision 1 · from Meridian Virtual Labs',
            flag: 'No learning outcomes yet',
            age: '3 days',
            since: 'since 24 Aug',
          },
          {
            key: 'b',
            href: '/reviewer/updates/b',
            name: 'Distillation Column',
            accessibleName:
              'Distillation Column, update 1.2 → 1.3, waiting since 25 Aug 2026. Review it',
            courseCode: 'CHE ZG513',
            courseName: null,
            kind: <RvKindTag kind="update" label="Update" detail="1.2 → 1.3" />,
            from: 'From Kavya Nair, Content Manager',
            age: '2 days',
            since: 'since 25 Aug',
          },
        ]}
      />,
    );
    const table = screen.getByRole('table', {
      name: 'Items waiting for your decision, oldest first',
    });
    expect(table).toHaveClass('rk-table', 'rv-qtable');
    expect(table.parentElement).toHaveClass('rk-tablewrap');
    expect(classesOf(table.querySelectorAll('th'))).toEqual([
      'rv-c-item',
      'rv-c-kind',
      'rv-c-focus',
      'rv-c-when',
    ]);
    expect(table.querySelector('th.rv-c-when')).toHaveAttribute('aria-sort', 'descending');
    const [first, second] = table.querySelectorAll('tbody tr');
    expect(classesOf(first!.querySelectorAll('td.rv-c-item > *'))).toEqual([
      'rk-rowlink',
      'rv-cell-course',
      'rv-cell-ref',
    ]);
    expect(first!.querySelector('td.rv-c-kind > .rk-small')).toHaveTextContent(
      'Revision 1 · from Meridian Virtual Labs',
    );
    expect(first!.querySelector('td.rv-c-focus > .rk-tag-warn')).toHaveTextContent(
      'No learning outcomes yet',
    );
    expect(first!.querySelector('td.rv-c-when')).toHaveTextContent('Waiting 3 dayssince 24 Aug');
    expect(second!.querySelector('td.rv-c-item > .rv-cell-course')).toHaveTextContent('CHE ZG513');
    expect(second!.querySelector('.rv-cell-ref')).toBeNull();
    expect(second!.querySelector('td.rv-c-focus')!.children).toHaveLength(0);
    const link = screen.getByRole('link', {
      name: 'Distillation Column, update 1.2 → 1.3, waiting since 25 Aug 2026. Review it',
    });
    expect(link).toHaveClass('rk-rowlink');
    link.addEventListener('click', followed);
    fireEvent.click(second!.querySelector('td.rv-c-when')!);
    expect(followed).toHaveBeenCalledTimes(1);
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });

  it('the decisions: the four columns, the decision pill that wraps, the inline labels', async () => {
    for (const piece of [
      '<table class="rk-table rv-rtable">',
      '<caption>Your decisions, newest first</caption>',
      '<th scope="col" class="rv-c-dec" aria-sort="descending">Your decision</th>',
      '<td class="rv-c-dec"><span class="{{ r.stCls }}"><i></i>{{ r.dec }}</span><span class="rk-small"><span class="rk-inlabel">Decided </span>{{ r.when }}</span></td>',
      '<td class="rv-c-now"><span class="rk-inlabel">Now: </span><span class="rv-now">{{ r.now }}</span></td>',
    ]) {
      expect(REVIEWED).toContain(piece);
    }
    expect(ROOT).toContain(
      "stCls: 'xr-st rv-st-wrap ' + (h.dec === 'approved' ? 'xr-st--ok' : 'xr-st--err')",
    );
    const { container } = render(
      <RvDecisionsTable
        caption="Your decisions, newest first"
        headers={{
          item: 'Experiment',
          kind: 'Type',
          decision: 'Your decision',
          now: 'Where it is now',
        }}
        decidedLabel="Decided"
        nowLabel="Now:"
        rows={[
          {
            key: 'fc',
            href: '/reviewer/submissions/fc',
            name: 'Forced Convection',
            accessibleName: 'Forced Convection, returned to vendor on 24 Aug 2026. Open it',
            courseCode: 'ME ZG523',
            courseName: 'Thermodynamics & Heat Transfer',
            kind: <RvKindTag kind="new" label="New submission" />,
            decision: 'Returned to vendor',
            approved: false,
            when: '24 Aug 2026',
            now: 'With the vendor to revise',
          },
          {
            key: 'bd',
            href: '/reviewer/updates/bd',
            name: 'Boiler Drum Level',
            accessibleName: 'Boiler Drum Level, update approved on 14 Aug 2026. Open it',
            courseCode: 'CHE ZG513',
            courseName: 'Process Instrumentation & Control',
            kind: <RvKindTag kind="update" label="Update" detail="to version 2.1" />,
            decision: 'Update approved',
            approved: true,
            when: '14 Aug 2026',
            now: 'With the Super Admin for a release decision',
          },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Your decisions, newest first' });
    expect(table).toHaveClass('rk-table', 'rv-rtable');
    expect(classesOf(table.querySelectorAll('th'))).toEqual([
      'rv-c-item',
      'rv-c-kind',
      'rv-c-dec',
      'rv-c-now',
    ]);
    const rows = table.querySelectorAll('tbody tr');
    expect(classesOf([...rows].map((row) => row.querySelector('td.rv-c-dec > .xr-st')!))).toEqual([
      'xr-st rv-st-wrap xr-st--err',
      'xr-st rv-st-wrap xr-st--ok',
    ]);
    expect(rows[0]!.querySelector('td.rv-c-dec > .rk-small')).toHaveTextContent(
      'Decided 24 Aug 2026',
    );
    expect(rows[1]!.querySelector('td.rv-c-now')).toHaveTextContent(
      'Now: With the Super Admin for a release decision',
    );
    expect(rows[1]!.querySelector('td.rv-c-now > .rv-now')).not.toBeNull();
    expect(
      screen.getByRole('link', {
        name: 'Forced Convection, returned to vendor on 24 Aug 2026. Open it',
      }),
    ).toHaveAttribute('href', '/reviewer/submissions/fc');
    expectV3ClassesOnly(container);
    expectNoInternalReferences(container);
    await assertNoAxeViolations(container);
  });
});

describe('RV-02, RV-05 loading', () => {
  it('the message over three four-column skeleton rows, hidden from screen readers', () => {
    for (const piece of [
      '<p class="rk-loading-msg" role="status">Loading the review queue…</p>',
      '<div class="rk-skel-row rv-skel4" aria-hidden="true"><div><span class="rk-skel"></span><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div></div>',
    ]) {
      expect(QUEUE).toContain(piece);
    }
    expect(REVIEWED).toContain(
      '<div class="rk-skel-row rv-skel4" aria-hidden="true"><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div><div><span class="rk-skel"></span><span class="rk-skel"></span></div><div><span class="rk-skel"></span></div></div>',
    );
    const { container } = render(<RvLoadingRows message="Loading the review queue…" />);
    const busy = container.firstElementChild!;
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading the review queue…');
    const rows = busy.querySelectorAll('.rk-skel-row.rv-skel4[aria-hidden="true"]');
    expect(rows).toHaveLength(3);
    expect([...rows[0]!.children].map((cell) => cell.children.length)).toEqual([3, 2, 2, 1]);
    const decisions = render(
      <RvLoadingRows message="Loading your decisions…" cells={[2, 1, 2, 1]} />,
    ).container;
    expect(
      [...decisions.querySelector('.rk-skel-row')!.children].map((cell) => cell.children.length),
    ).toEqual([2, 1, 2, 1]);
    expectV3ClassesOnly(container);
  });
});
