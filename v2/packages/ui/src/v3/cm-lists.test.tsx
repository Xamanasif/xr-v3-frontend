/**
 * What only the Content Manager's lists draw (owner-approved export design/v3-refined-b/roles/CM-v1,
 * `project/Main.dc.html` CM-01, CM-02, CM-04 and CM-09): markup against the export's classes,
 * structure and ARIA (excerpts of its template), the class contract and the accessibility checks.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { assertNoAxeViolations, cmExportText, expectV3ClassesOnly } from '../testing/index.js';
import { Button, TextLink } from './actions.js';
import { CmCourseName, CmFormatBadges, CmGroupHead, CmQuote, CmVersionChange } from './cm.js';
import {
  CmCalmDesk,
  CmCatalogueList,
  CmCatalogueTotal,
  CmCheckChip,
  CmCodesFailed,
  CmCodesFoot,
  CmCodesSurface,
  CmCodesTable,
  CmColumns,
  CmDecisionCards,
  CmDecisionDesk,
  CmFeed,
  CmHoldList,
  CmLibraryLayout,
  CmLibraryTable,
  CmLoadingCards,
  CmPageHead,
  CmPipeline,
  CmQueueToolbar,
  CmSays,
  CmSide,
  CmSideCard,
  CmSideText,
  CmStack,
  CmStageLine,
  CmStatusCell,
  CmViewSwitch,
} from './cm-lists.js';
import { FormatBadges } from './formats.js';
import { V3_ICON_PATHS } from './icons.js';
import { StatusPill } from './status.js';

const MAIN = cmExportText('Main.dc.html');
const section = (from: string, to: string) => MAIN.slice(MAIN.indexOf(from), MAIN.indexOf(to));
const OVERVIEW = section('<!-- CM-01 Overview -->', '<!-- CM-02 Ready to publish -->');
const READY = section('<!-- CM-02 Ready to publish -->', '<!-- CM-03 Publication decision -->');
const LIBRARY = section('<!-- CM-04 Content library -->', '<!-- CM-05 Published experiment');
const CODES = section('<!-- CM-09 Platform course codes -->', '<!-- XS-07 Help & support');

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');
const classesOf = (elements: Iterable<Element>) =>
  [...elements].map((element) => element.className);

describe('CM-01 the page head, the pipeline and the decision desk', () => {
  it('the head (`header.rb-head`): date, H1 that takes focus, lead; no figures on CM-01', async () => {
    for (const piece of [
      '<header class="rb-head">',
      '<h1 class="rb-h1" id="cm-h-overview" tabindex="-1">Overview</h1>',
      '<p class="rk-sub">What is ready for you to publish',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    const titleRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <CmPageHead
        as="header"
        title="Overview"
        titleId="cm-h-overview"
        titleRef={titleRef}
        date="Thursday 27 August 2026"
        lead="What is ready for you to publish."
      />,
    );
    const head = container.firstElementChild!;
    expect(head.tagName).toBe('HEADER');
    expect(head).toHaveClass('rb-head');
    expect([...head.querySelectorAll(':scope > div > *')].map((child) => child.className)).toEqual([
      'rb-eyebrow-date',
      'rb-h1',
      'rk-sub',
    ]);
    expect(titleRef.current).toHaveAttribute('tabindex', '-1');
    expect(titleRef.current).toHaveAttribute('id', 'cm-h-overview');
    expect(head.querySelector('dl')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a list head (`div.rb-head`) with its figures (`dl.rb-figs`, named)', async () => {
    for (const piece of [
      '<dl class="rb-figs" aria-label="The queue at a glance">',
      '<div class="rb-fig"><dt class="rb-fig-t">Waiting for you</dt><dd class="rb-fig-n">{{ Q.n }}</dd><dd class="rb-fig-s">{{ Q.nSub }}</dd></div>',
    ]) {
      expect(READY).toContain(piece);
    }
    const { container } = render(
      <CmPageHead
        title="Ready to publish"
        lead="Experiments the Academic Reviewer has approved."
        figuresLabel="The queue at a glance"
        figures={[
          { title: 'Waiting for you', value: 3, details: ['All checks met'] },
          { title: 'days, the longest wait', value: 13, details: ['Transient Cooling'] },
        ]}
      />,
    );
    const head = container.firstElementChild!;
    expect(head.tagName).toBe('DIV');
    const list = head.querySelector('dl.rb-figs')!;
    expect(list).toHaveAttribute('aria-label', 'The queue at a glance');
    expect(
      [...list.querySelectorAll('.rb-fig')].map((fig) =>
        [...fig.children].map(
          (child) => `${child.tagName} ${child.className} ${child.textContent}`,
        ),
      ),
    ).toEqual([
      ['DT rb-fig-t Waiting for you', 'DD rb-fig-n 3', 'DD rb-fig-s All checks met'],
      ['DT rb-fig-t days, the longest wait', 'DD rb-fig-n 13', 'DD rb-fig-s Transient Cooling'],
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the pipeline (`section.cm-pipe`): lanes, tiles as named links, your step in gold, empty quiet', async () => {
    for (const piece of [
      '<section class="cm-pipe" aria-labelledby="cm-pipe-h">',
      '<div class="cm-pipe-head">',
      '<h3 class="cm-lane-t"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="{{ ln.ico }}"></use></svg>{{ ln.t }}</h3>',
      '<li class="{{ tl.cls }}"><a class="cm-tile-a" href="#cm-main" data-to="{{ tl.to }}" aria-label="{{ tl.aria }}" onClick="{{ tl.go }}"><span class="cm-tile-n">{{ tl.n }}</span><span class="cm-tile-t">{{ tl.t }}</span><span class="cm-tile-d">{{ tl.d }}</span><sc-if value="{{ tl.you }}" hint-placeholder-val="{{ false }}"><span class="cm-you">Your step</span></sc-if></a></li>',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    expect(MAIN).toContain("cls: 'cm-tile' + (you ? ' is-you' : '') + (n ? '' : ' is-quiet')");
    const { container } = render(
      <CmPipeline
        title="Publishing pipeline"
        titleId="cm-pipe-h"
        note="Gold marks your step."
        youLabel="Your step"
        lanes={[
          {
            key: 'first',
            title: 'First publication',
            icon: 'readyToPublish',
            tiles: [
              {
                key: 'vendor',
                count: 0,
                title: 'With the vendor',
                detail: 'Vendor revising',
                href: '/library?tab=with-vendor',
                accessibleName:
                  '0 With the vendor. Vendor revising. Open the Content library, With vendor',
              },
              {
                key: 'ready',
                count: 3,
                title: 'Ready to publish',
                detail: 'Oldest approved 14 Aug',
                you: true,
                href: '/ready',
                accessibleName:
                  '3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish',
              },
            ],
          },
        ]}
      />,
    );
    const pipe = screen.getByRole('region', { name: 'Publishing pipeline' });
    expect(pipe).toHaveClass('cm-pipe');
    expect(pipe.querySelector('.cm-pipe-head > h2.rb-h2 + p.rb-note')).toHaveTextContent(
      'Gold marks your step.',
    );
    const lane = pipe.querySelector('.cm-lanes > div')!;
    expect(pathOf(lane.querySelector('h3.cm-lane-t'))).toBe(V3_ICON_PATHS.readyToPublish);
    expect(classesOf(lane.querySelectorAll('ol.cm-tiles > li'))).toEqual([
      'cm-tile is-quiet',
      'cm-tile is-you',
    ]);
    const ready = screen.getByRole('link', {
      name: '3 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish',
    });
    expect(ready).toHaveClass('cm-tile-a');
    expect(ready).toHaveAttribute('href', '/ready');
    expect(classesOf(ready.children)).toEqual(['cm-tile-n', 'cm-tile-t', 'cm-tile-d', 'cm-you']);
    expect(screen.getAllByText('Your step')).toHaveLength(1);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the decision desk (`section.rb-queue` > `div.cm-queue-top`): rows with the wait first, facts, quote, one gold action', async () => {
    for (const piece of [
      '<section class="rb-queue" aria-labelledby="cm-need-h">',
      '<div class="cm-queue-top"><h2 class="rb-h2" id="cm-need-h">Needs your decision</h2><p class="rb-note">Oldest first</p></div>',
      '<span class="rb-ico-tile" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#cmi-upload"></use></svg></span>',
      '<p class="rb-row-when"><b>{{ r.when }}</b><span>{{ r.when2 }}</span></p>',
      '<sc-if value="{{ r.first }}" hint-placeholder-val="{{ false }}"><p class="cm-next">Publish next</p></sc-if>',
      '<p class="cm-orow-x"><span class="{{ r.chkCls }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="{{ r.chkIco }}"></use></svg>{{ r.chk }}</span>',
      '<blockquote class="cm-orow-q"><p>{{ r.quote }}</p><footer>{{ r.who }}</footer></blockquote>',
      '<div class="rb-row-act"><a class="{{ r.btnCls }}"',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    expect(MAIN).toContain("cls: 'rb-row cm-orow' + (i === 0 ? ' is-first' : '')");
    const { container } = render(
      <CmDecisionDesk
        title="Needs your decision"
        titleId="cm-need-h"
        note="Oldest first"
        idPrefix="cm-need"
        groups={[
          {
            key: 'ready',
            name: 'Ready to publish',
            icon: 'readyToPublish',
            link: { href: '/ready', label: 'Open Ready to publish' },
            rows: [
              {
                key: 'SUB-0074',
                first: true,
                next: 'Publish next',
                when: { big: '13 days', small: 'approved 14 Aug' },
                title: 'Transient Cooling',
                description: 'SUB-0074 · ME ZG523 · Northline Simulation Studio',
                facts: (
                  <>
                    <CmCheckChip met>4 of 4 checks met</CmCheckChip>
                    <FormatBadges formats={['WEB']} label="Formats: WEB" />
                  </>
                ),
                action: {
                  href: '/decisions/SUB-0074',
                  label: 'Open decision',
                  accessibleName: 'Open the publication decision for Transient Cooling',
                  primary: true,
                },
              },
            ],
          },
          {
            key: 'corr',
            name: 'Corrections that need you',
            icon: 'updates',
            link: { href: '/updates', label: 'Open Updates' },
            rows: [
              {
                key: 'UPD-0006',
                when: { big: '1 day', small: 'returned 26 Aug' },
                title: 'Induction Motor Loading',
                facts: (
                  <>
                    <StatusPill tone="err">Returned to you</StatusPill>
                    <CmVersionChange
                      from={{ text: '1.0 live', kind: 'live' }}
                      to={{ text: '1.1 proposed', kind: 'new' }}
                    />
                  </>
                ),
                quote: (
                  <CmQuote quote="“It rises.”" by="Prof. A. Menon, Academic Reviewer · 26 Aug" />
                ),
                action: {
                  href: '/updates/UPD-0006',
                  label: 'Continue',
                  accessibleName: 'Continue UPD-0006, correction to Induction Motor Loading',
                },
              },
            ],
          },
        ]}
      />,
    );
    const desk = screen.getByRole('region', { name: 'Needs your decision' });
    expect(desk).toHaveClass('rb-queue');
    expect(desk.firstElementChild).toHaveClass('cm-queue-top');
    const ready = screen.getByRole('region', { name: 'Ready to publish' });
    expect(ready).toHaveClass('rb-g');
    expect(pathOf(ready.querySelector('.rb-ico-tile'))).toBe(V3_ICON_PATHS.readyToPublish);
    expect(within(ready).getByRole('link', { name: 'Open Ready to publish' })).toHaveClass(
      'rb-link',
    );
    const row = ready.querySelector('li')!;
    expect(row.className).toBe('rb-row cm-orow is-first');
    expect(classesOf(row.children)).toEqual(['rb-row-when', 'rb-row-main', 'rb-row-act']);
    expect(classesOf(row.querySelector('.rb-row-main')!.children)).toEqual([
      'cm-next',
      'rb-row-t',
      'rb-row-d',
      'cm-orow-x',
    ]);
    const chip = row.querySelector('.cm-orow-x > span.cm-qcheck')!;
    expect(pathOf(chip)).toBe(V3_ICON_PATHS.check);
    const open = within(ready).getByRole('link', {
      name: 'Open the publication decision for Transient Cooling',
    });
    expect(open.className).toBe('rb-btn rb-btn--primary');
    const corrections = screen.getByRole('region', { name: 'Corrections that need you' });
    const correction = corrections.querySelector('li')!;
    expect(correction.className).toBe('rb-row cm-orow');
    expect(
      correction.querySelector('.rb-row-main > blockquote.cm-orow-q > footer'),
    ).toHaveTextContent('Prof. A. Menon, Academic Reviewer · 26 Aug');
    expect(
      within(corrections).getByRole('link', {
        name: 'Continue UPD-0006, correction to Induction Motor Loading',
      }).className,
    ).toBe('rb-btn');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a check not met (`cm-qcheck is-no`, the alert)', () => {
    expect(MAIN).toContain(
      "chkCls: 'cm-qcheck' + (nb ? ' is-no' : ''), chkIco: nb ? '#cmi-alert' : '#cmi-check'",
    );
    const { container } = render(<CmCheckChip met={false}>1 thing to resolve</CmCheckChip>);
    expect(container.firstElementChild!.className).toBe('cm-qcheck is-no');
    expect(pathOf(container.firstElementChild)).toBe(V3_ICON_PATHS.alertCircle);
  });

  it('the calm desk (`section.rb-panel.rb-att.rb-att--calm`) named by its calm title', async () => {
    for (const piece of [
      '<section class="rb-panel rb-att rb-att--calm" aria-labelledby="cm-calm-t">',
      '<div class="rb-att-head"><h2 class="rb-h2">Needs your decision</h2></div>',
      '<p class="rb-calm-t" id="cm-calm-t">Nothing is waiting for your decision</p>',
      // The link's line, padded inline: `p.rk-x-calm-foot` (V3P-14).
      '<p style="padding: 0 0 18px"><a class="rb-link"',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    const { container } = render(
      <CmCalmDesk
        title="Needs your decision"
        calmTitle="Nothing is waiting for your decision"
        calmTitleId="cm-calm-t"
        link={<TextLink href="/library">Open the Content library</TextLink>}
      >
        Approved experiments and corrections returned to you appear here.
      </CmCalmDesk>,
    );
    const calm = screen.getByRole('region', { name: 'Nothing is waiting for your decision' });
    expect(calm.className).toBe('rb-panel rb-att rb-att--calm');
    expect(classesOf(calm.children)).toEqual(['rb-att-head', 'rb-calm', 'rk-x-calm-foot']);
    expect(calm.querySelector('.rb-calm-d')).toHaveTextContent(
      'Approved experiments and corrections returned to you appear here.',
    );
    expect(within(calm).getByRole('link', { name: 'Open the Content library' })).toHaveClass(
      'rb-link',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the side column: With others (`ul.cm-hold`) and In the catalogue (`p.cm-cattotal`, `ul.cm-catlist`)', async () => {
    for (const piece of [
      '<div class="cm-cols">',
      '<div class="cm-stack cm-stack--lg">',
      '<div class="cm-side">',
      '<li>\n                <div><p class="cm-hold-t">{{ r.t }}</p><p class="cm-hold-d">{{ r.d }}</p><p class="cm-hold-st"><span class="{{ r.stCls }}"><i></i>{{ r.stLabel }}</span></p></div>\n                <a class="rb-link" href="#cm-main" data-to="{{ r.to }}" aria-label="{{ r.aria }}" onClick="{{ r.go }}">Open</a>',
      '<p class="cm-cattotal"><b>{{ O.nPub }}</b><span>{{ O.pubLine }}</span></p>',
      '<ul class="cm-catlist" aria-label="Live experiments by course">',
      '<li><a class="cm-catlist-t" href="#cm-main" data-to="CM-04" aria-label="{{ c.aria }}" onClick="{{ c.go }}"><sc-if value="{{ c.hasCode }}" hint-placeholder-val="{{ true }}"><span class="rk-code">{{ c.code }}</span></sc-if><span>{{ c.name }}</span></a><span class="{{ c.nCls }}" aria-hidden="true">{{ c.n }}</span></li>',
      '<p class="cm-sidefoot"><a class="rb-link"',
    ]) {
      expect(OVERVIEW).toContain(piece);
    }
    const { container } = render(
      <CmColumns>
        <CmStack large>
          <p>Desk</p>
        </CmStack>
        <CmSide>
          <CmSideCard
            titleId="cm-others-h"
            head={
              <CmGroupHead
                variant="side"
                title="With others"
                titleId="cm-others-h"
                note="Nothing for you to do"
              />
            }
          >
            <CmHoldList
              rows={[
                {
                  key: 'UPD-0004',
                  title: 'Boiler Drum Level 2.1',
                  detail: 'Super Admin · held 20 Aug · 2.0 stays live',
                  status: <StatusPill tone="paused">On hold</StatusPill>,
                  link: {
                    href: '/updates/UPD-0004',
                    label: 'Open',
                    accessibleName: 'Open UPD-0004, Boiler Drum Level',
                  },
                },
              ]}
            />
          </CmSideCard>
          <CmSideCard
            titleId="cm-cat-h"
            title="In the catalogue"
            foot={<TextLink href="/library?tab=published">Open the Content library</TextLink>}
          >
            <CmCatalogueTotal count={12}>experiments live, in 5 courses</CmCatalogueTotal>
            <CmCatalogueList
              label="Live experiments by course"
              courses={[
                {
                  key: 'thermo',
                  code: 'ME ZG523',
                  name: 'Thermodynamics & Heat Transfer',
                  count: 3,
                  href: '/library?tab=published&course=thermo',
                  accessibleName:
                    'Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library',
                },
                {
                  key: 'fluids',
                  code: null,
                  name: 'Fluid Mechanics',
                  count: 1,
                  href: '/library?tab=published&course=fluids',
                  accessibleName:
                    'Fluid Mechanics, 1 published experiment. Open in the Content library',
                },
              ]}
            />
          </CmSideCard>
        </CmSide>
      </CmColumns>,
    );
    const cols = container.firstElementChild!;
    expect(classesOf(cols.children)).toEqual(['cm-stack cm-stack--lg', 'cm-side']);
    const others = screen.getByRole('region', { name: 'With others' });
    expect(others.className).toBe('cm-sidecard');
    expect(others.querySelector('.cm-grp-head > h2.cm-sidecard-t + p.rb-note')).toHaveTextContent(
      'Nothing for you to do',
    );
    const hold = others.querySelector('ul.cm-hold > li')!;
    expect(classesOf(hold.querySelector('div')!.children)).toEqual([
      'cm-hold-t',
      'cm-hold-d',
      'cm-hold-st',
    ]);
    expect(
      within(others).getByRole('link', { name: 'Open UPD-0004, Boiler Drum Level' }),
    ).toHaveClass('rb-link');
    const catalogue = screen.getByRole('region', { name: 'In the catalogue' });
    expect(classesOf(catalogue.children)).toEqual([
      'cm-sidecard-t',
      'cm-cattotal',
      'cm-catlist',
      'cm-sidefoot',
    ]);
    const list = within(catalogue).getByRole('list', { name: 'Live experiments by course' });
    const links = within(list).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library',
      'Fluid Mechanics, 1 published experiment. Open in the Content library',
    ]);
    expect(links[0]!.querySelector('.rk-code')).toHaveTextContent('ME ZG523');
    expect(links[1]!.querySelector('.rk-code')).toBeNull();
    expect(list.querySelector('.cm-catlist-n')).toHaveAttribute('aria-hidden', 'true');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('nothing with others (`p.cm-hold-d`)', () => {
    expect(OVERVIEW).toContain(
      '<p class="cm-hold-d">Nothing is waiting on the Academic Reviewer, the vendors or the Super Admin.</p>',
    );
    const { container } = render(<CmSideText>Nothing is waiting.</CmSideText>);
    expect(container.firstElementChild!.outerHTML).toBe(
      '<p class="cm-hold-d">Nothing is waiting.</p>',
    );
  });

  it('the line straight under a side card’s title (`flush`: CM-09’s ivory card, V3P-14)', () => {
    expect(CODES).toContain(
      '<p class="cm-hold-d" style="margin-top: 0">Institute Admins keep their own code',
    );
    const { container } = render(
      <CmSideText flush>Institute Admins keep their own code.</CmSideText>,
    );
    expect(container.firstElementChild!.outerHTML).toBe(
      '<p class="cm-hold-d rk-x-hold-d-flush">Institute Admins keep their own code.</p>',
    );
  });
});

describe('CM-02 decision cards and their side cards', () => {
  it('the toolbar: the announced count and the sort button always shown', async () => {
    for (const piece of [
      '<div class="rk-toolbar">\n            <div class="rk-statusline">\n              <p class="rk-count" role="status">{{ Q.count }}</p>',
      '<div class="rk-sortbar"><button type="button" class="rk-sortbtn" onClick="{{ Q.toggleSort }}"><span class="rk-sort-l">Sort: {{ Q.sortLabel }}</span><span class="rk-sort-s">Sort: {{ Q.sortShort }}</span>',
    ]) {
      expect(READY).toContain(piece);
    }
    const toggle = vi.fn();
    const { container } = render(
      <CmQueueToolbar
        count="3 experiments approved and waiting"
        sort={{
          long: 'Sort: approved, oldest first',
          short: 'Sort: oldest first',
          direction: 'asc',
          onToggle: toggle,
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('3 experiments approved and waiting');
    const bar = container.querySelector('.rk-statusline > .rk-sortbar')!;
    expect(bar.className).toBe('rk-sortbar rk-x-sort-shown');
    const button = within(bar as HTMLElement).getByRole('button');
    expect(classesOf(button.querySelectorAll('span'))).toEqual(['rk-sort-l', 'rk-sort-s']);
    expect(pathOf(button)).toBe(V3_ICON_PATHS.arrowUp);
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalledOnce();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a card per submission (`ul.cm-qlist` > `li.cm-qcard`): wait, identity, checks, summary, action', async () => {
    for (const piece of [
      '<div class="cm-qbody">',
      '<ul class="cm-qlist" aria-label="{{ Q.listLabel }}">',
      '<div class="cm-age"><p class="cm-age-n">{{ r.age }}</p><p class="cm-age-t">{{ r.ageT }}</p><p class="cm-age-d">{{ r.ageD }}</p></div>',
      '<h2 class="cm-qname">{{ r.name }}</h2>',
      '<p class="cm-qline">{{ r.idLine }}</p>',
      '<p class="cm-qmeta"><span class="cm-fmtname">',
      '<ul class="cm-qchecks" aria-label="Publication check">',
      '<li class="{{ c.cls }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="{{ c.ico }}"></use></svg><span class="xr-sr">{{ c.sr }}</span>{{ c.t }}</li>',
      '<p class="{{ r.sumCls }}">{{ r.sum }}</p>',
      '<div class="cm-qact"><a class="{{ r.btnCls }}"',
    ]) {
      expect(READY).toContain(piece);
    }
    const { container } = render(
      <CmDecisionCards
        label="Approved experiments, oldest first"
        checksLabel="Publication check"
        cards={[
          {
            key: 'SUB-0074',
            first: true,
            firstLabel: 'Waiting longest',
            age: { value: '13', unit: 'days waiting', detail: 'since 14 Aug' },
            name: 'Transient Cooling',
            idLine: 'SUB-0074 · Northline Simulation Studio',
            meta: (
              <>
                <CmCourseName code="ME ZG523" name="Thermodynamics & Heat Transfer" />
                <FormatBadges formats={['WEB']} label="Formats: WEB" />
              </>
            ),
            byLine: 'Approved by Prof. A. Menon · 2 learning outcomes',
            checks: [
              { key: 'a', label: 'Approved', met: true, stateWords: 'Met: ' },
              { key: 'b', label: 'Learning outcomes', met: false, stateWords: 'Not met: ' },
            ],
            summary: { text: '1 thing to resolve', met: false },
            action: {
              href: '/decisions/SUB-0074',
              label: 'Open decision',
              accessibleName: 'Open the publication decision for Transient Cooling',
              primary: true,
            },
          },
        ]}
      />,
    );
    const list = screen.getByRole('list', { name: 'Approved experiments, oldest first' });
    expect(list.parentElement).toHaveClass('cm-qbody');
    const decisionCard = list.querySelector(':scope > li')!;
    expect(decisionCard.className).toBe('cm-qcard is-first');
    expect(classesOf(decisionCard.children)).toEqual([
      'cm-age',
      'cm-qmain',
      'cm-qchecks',
      'cm-qsum is-no',
      'cm-qact',
    ]);
    expect(classesOf(decisionCard.querySelector('.cm-qmain')!.children)).toEqual([
      'cm-next',
      'cm-qname',
      'cm-qline',
      'cm-qmeta',
      'cm-qline',
    ]);
    expect(screen.getByRole('heading', { level: 2, name: 'Transient Cooling' })).toHaveClass(
      'cm-qname',
    );
    const checks = within(decisionCard as HTMLElement).getByRole('list', {
      name: 'Publication check',
    });
    expect(classesOf(checks.children)).toEqual(['cm-qcheck', 'cm-qcheck is-no']);
    expect(checks.children[1]).toHaveTextContent('Not met: Learning outcomes');
    expect(pathOf(checks.children[1]!)).toBe(V3_ICON_PATHS.cross);
    expect(
      within(decisionCard as HTMLElement).getByRole('link', {
        name: 'Open the publication decision for Transient Cooling',
      }).className,
    ).toBe('rb-btn rb-btn--primary');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('loading: the announced line over three card skeletons', () => {
    expect(READY).toContain(
      '<div class="rk-skel-card"><span class="rk-skel"></span><div class="rk-skel-cells"><span></span><span></span><span></span><span></span></div></div>',
    );
    const { container } = render(
      <CmLoadingCards message="Loading the experiments ready to publish…" />,
    );
    const box = container.firstElementChild!;
    expect(box).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveClass('rk-loading-msg');
    expect(box.querySelectorAll('.rk-skel-ca > .rk-skel-card')).toHaveLength(3);
    expect(box.querySelector('.rk-skel-ca')).toHaveAttribute('aria-hidden', 'true');
    expectV3ClassesOnly(container);
  });

  it('the side cards: what publishing does (ivory, `ul.cm-says`) and the latest (`ul.cm-feed`)', async () => {
    for (const piece of [
      '<aside class="cm-side" aria-label="Before you publish">',
      '<section class="cm-sidecard cm-sidecard--ivory" aria-labelledby="cm-q-does">',
      '<li><span class="cm-says-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#cmi-upload"></use></svg></span><p><b>Lists it in the public catalogue</b>',
      '<li><p class="cm-feed-t">{{ h.t }}</p><p class="cm-feed-d">{{ h.d }}</p></li>',
      '<p class="cm-feed-d">Nothing is published yet.</p>',
    ]) {
      expect(READY).toContain(piece);
    }
    const { container } = render(
      <CmSide label="Before you publish">
        <CmSideCard ivory titleId="cm-q-does" title="What publishing does">
          <CmSays
            items={[
              {
                key: 'lists',
                icon: 'readyToPublish',
                title: 'Lists it',
                children: 'Under its course.',
              },
            ]}
          />
        </CmSideCard>
        <CmSideCard titleId="cm-q-latest" title="Latest in the catalogue">
          <CmFeed
            items={[
              {
                key: 'e1',
                title: 'Orifice Plate Metering',
                detail: 'Version 1.1 released · 5 Aug 2026',
              },
            ]}
          />
        </CmSideCard>
      </CmSide>,
    );
    const aside = screen.getByRole('complementary', { name: 'Before you publish' });
    expect(aside).toHaveClass('cm-side');
    const does = screen.getByRole('region', { name: 'What publishing does' });
    expect(does.className).toBe('cm-sidecard cm-sidecard--ivory');
    const point = does.querySelector('ul.cm-says > li')!;
    expect(pathOf(point.querySelector('.cm-says-ico'))).toBe(V3_ICON_PATHS.readyToPublish);
    expect(point.querySelector('p > b')).toHaveTextContent('Lists it');
    const latest = screen.getByRole('region', { name: 'Latest in the catalogue' });
    expect(classesOf(latest.querySelectorAll('ul.cm-feed > li > p'))).toEqual([
      'cm-feed-t',
      'cm-feed-d',
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    const { container: empty } = render(<CmFeed items={[]} empty="Nothing is published yet." />);
    expect(empty.innerHTML).toBe('<p class="cm-feed-d">Nothing is published yet.</p>');
  });
});

describe('CM-04 the view switch, the stage line and the course-grouped table', () => {
  it('the switch (`div.rb-switch[role=group]`, `aria-pressed`, counts in `b`, hidden while loading)', async () => {
    for (const piece of [
      '<div class="rk-ca">\n        <div class="rb-switchbar">\n          <div class="rb-switch" id="cm-lib-switch" role="group" aria-label="Show experiments that are">',
      '<button type="button" id="{{ t.id }}" aria-pressed="{{ t.sel }}" onClick="{{ t.pick }}">{{ t.label }}<sc-if value="{{ t.hasN }}" hint-placeholder-val="{{ true }}"><b>{{ t.n }}</b></sc-if></button>',
    ]) {
      expect(LIBRARY).toContain(piece);
    }
    const change = vi.fn();
    const { container, rerender } = render(
      <CmLibraryLayout>
        <CmViewSwitch
          id="cm-lib-switch"
          label="Show experiments that are"
          value="ready"
          onChange={change}
          options={[
            { key: 'ready', label: 'Ready', count: 3 },
            { key: 'published', label: 'Published', count: 12 },
          ]}
        />
      </CmLibraryLayout>,
    );
    expect(container.firstElementChild).toHaveClass('rk-ca');
    const group = screen.getByRole('group', { name: 'Show experiments that are' });
    expect(group).toHaveClass('rb-switch');
    expect(group.parentElement).toHaveClass('rb-switchbar');
    expect(screen.getByRole('button', { name: 'Ready 3' })).toHaveAttribute('aria-pressed', 'true');
    const published = screen.getByRole('button', { name: 'Published 12' });
    expect(published).toHaveAttribute('aria-pressed', 'false');
    expect(published).toHaveAttribute('id', 'cm-lib-switch-published');
    fireEvent.click(published);
    expect(change).toHaveBeenCalledWith('published');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    rerender(
      <CmViewSwitch
        label="Show experiments that are"
        value="ready"
        onChange={change}
        options={[{ key: 'ready', label: 'Ready' }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Ready' }).querySelector('b')).toBeNull();
  });

  it('the stage line (`p.cm-stageline` > `span.cm-own`): who holds the view', () => {
    expect(LIBRARY).toContain(
      '<p class="cm-stageline"><span class="{{ L.ownCls }}">{{ L.own }}</span><span class="cm-stageline-d">{{ L.viewNote }}</span></p>',
    );
    for (const cls of ["'cm-own is-you'", "'cm-own'", "'cm-own is-vendor'", "'cm-own is-live'"]) {
      expect(MAIN).toContain(cls);
    }
    const tones = ['you', 'other', 'vendor', 'live'] as const;
    expect(
      tones.map((tone) => {
        const { container } = render(
          <CmStageLine owner="With you" tone={tone}>
            Waiting for your decision.
          </CmStageLine>,
        );
        return container.querySelector('.cm-own')!.className;
      }),
    ).toEqual(['cm-own is-you', 'cm-own', 'cm-own is-vendor', 'cm-own is-live']);
  });

  it('the table grouped by course: bands as row headers, rows that follow their link, the correction chip', async () => {
    for (const piece of [
      '<tr class="cm-grp-h"><th colspan="5" scope="rowgroup"><div class="cm-grp-row"><span class="cm-grp-c"><sc-if value="{{ g.hasCode }}" hint-placeholder-val="{{ true }}"><span class="rk-code">{{ g.code }}</span></sc-if><span class="cm-grp-name">{{ g.name }}</span></span><span class="cm-grp-k">{{ g.count }}</span></div></th></tr>',
      '<td class="rk-c-inst"><a class="rk-rowlink"',
      '<td class="rk-c-type"><span class="rk-strong">{{ r.c3 }}</span>',
      '<td class="rk-c-date"><span class="rk-inlabel">{{ r.dateLabel }} </span>{{ r.date }}</td>',
      '<td class="rk-c-st"><span class="cm-stcell"><span class="{{ r.stCls }}"><i></i>{{ r.stLabel }}</span><sc-if value="{{ r.hasTag }}" hint-placeholder-val="{{ false }}"><span class="rk-small">{{ r.tag }}</span></sc-if><sc-if value="{{ r.hasUTag }}" hint-placeholder-val="{{ false }}"><span class="{{ r.uCls }}"><i></i>{{ r.uTag }}</span></sc-if></span></td>',
    ]) {
      expect(LIBRARY).toContain(piece);
    }
    const { container } = render(
      <CmLibraryTable
        caption="Published — 2"
        headers={{
          who: 'Experiment',
          what: 'Formats',
          kind: 'Version',
          when: 'Live since',
          status: 'Where it is',
        }}
        groups={[
          {
            key: 'proc',
            code: 'CHE ZG513',
            name: 'Process Instrumentation & Control',
            count: '2 published',
            rows: [
              {
                key: 'boiler',
                href: '/published/boiler',
                title: 'Boiler Drum Level',
                linkLabel:
                  'Boiler Drum Level, CHE ZG513, version 2.0, published, update on hold. Open the published experiment',
                formats: <CmFormatBadges formats={['WEB', 'VR']} label="Formats: WEB, VR" />,
                kind: { strong: 'Version 2.0', small: 'Meridian Virtual Labs' },
                whenLabel: 'Live since',
                when: '18 Jun 2026',
                status: (
                  <CmStatusCell
                    status={{ tone: 'ok', label: 'Published' }}
                    update={{ tone: 'paused', label: 'Update on hold' }}
                  />
                ),
              },
              {
                key: 'venturi',
                href: '/decisions/SUB-0071',
                title: 'Venturi Meter Calibration',
                titleDetail: 'SUB-0071',
                linkLabel:
                  'Venturi Meter Calibration, SUB-0071, back with the academic reviewer. Open',
                formats: <CmFormatBadges formats={['WEB']} label="Formats: WEB" />,
                kind: { strong: 'Meridian Virtual Labs', small: 'Revision 1' },
                whenLabel: 'Since',
                when: '25 Aug 2026',
                status: (
                  <CmStatusCell
                    status={{ tone: 'info', label: 'Back with the Academic Reviewer' }}
                    tag="Re-check you asked for"
                  />
                ),
              },
            ],
          },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Published — 2' });
    expect(table).toHaveClass('rk-table');
    expect(table.parentElement).toHaveClass('rk-tablewrap');
    // The export's inline column widths (34 %, 17 %, 16 %, 13 %, 20 %): `rk-x-lib-col` (V3P-14).
    expect(classesOf(table.querySelectorAll('thead th'))).toEqual([
      'rk-c-inst rk-x-lib-col',
      'rk-c-exp rk-x-lib-col',
      'rk-c-type rk-x-lib-col',
      'rk-c-date rk-x-lib-col',
      'rk-c-st rk-x-lib-col',
    ]);
    const band = table.querySelector('tbody > tr.cm-grp-h > th')!;
    expect(band).toHaveAttribute('scope', 'rowgroup');
    expect(band).toHaveAttribute('colspan', '5');
    expect(band.querySelector('.cm-grp-row > .cm-grp-c > .rk-code')).toHaveTextContent('CHE ZG513');
    expect(band.querySelector('.cm-grp-k')).toHaveTextContent('2 published');
    const rows = [...table.querySelectorAll('tbody > tr:not(.cm-grp-h)')];
    // A row's formats as the export writes them, `margin-top: 0` inline (V3P-14).
    expect(rows[0]!.querySelector('.rk-c-exp > span')!.className).toBe('rk-fmts rk-x-fmts-flush');
    expect(rows[0]!.querySelector('.rk-c-date .rk-inlabel')).toHaveTextContent('Live since');
    const cell = rows[0]!.querySelector('.rk-c-st > .cm-stcell')!;
    expect(classesOf(cell.children)).toEqual(['xr-st xr-st--ok', 'xr-st xr-st--paused']);
    expect(rows[1]!.querySelector('.cm-stcell > .rk-small')).toHaveTextContent(
      'Re-check you asked for',
    );
    const link = screen.getByRole('link', {
      name: 'Boiler Drum Level, CHE ZG513, version 2.0, published, update on hold. Open the published experiment',
    });
    expect(link).toHaveClass('rk-rowlink');
    const follow = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', follow);
    fireEvent.click(rows[0]!.querySelector('.rk-c-type')!);
    expect(follow).toHaveBeenCalledOnce();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('CM-09 the course codes by engineering area', () => {
  it('the surface, the table, the Changed tag, the blank line, the error and the foot', async () => {
    for (const piece of [
      '<section class="rk-surface" aria-labelledby="cm-k-h">',
      '<div class="rk-sec-h"><h2 class="rb-h2" id="cm-k-h">Courses</h2><p class="rb-note">From Academic structure, kept by the Super Admin</p></div>',
      '<p class="rk-next">Each code must be unique. Leave it blank if the course has no platform code yet.</p>',
      '<div class="cm-codeswrap">',
      '<table class="cm-codes">',
      '<thead><tr><th scope="col" class="cm-c-course">Course</th><th scope="col" class="cm-c-live">Live experiments</th><th scope="col">Platform course code</th></tr></thead>',
      '<tr class="cm-area"><th colspan="3" scope="rowgroup"><div class="cm-grp-row"><span class="cm-grp-name">{{ a.name }}</span><span class="cm-grp-k">{{ a.count }}</span></div></th></tr>',
      '<td><p class="cm-course-t">{{ r.name }}</p><p class="cm-course-s">{{ r.nText }}</p></td>',
      '<td class="cm-c-live"><span class="{{ r.liveCls }}">{{ r.n }}</span></td>',
      '<span class="rk-label cm-inlabel" aria-hidden="true">Platform course code</span>',
      '<p><span class="cm-tag" id="{{ r.cid }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#cmi-edit"></use></svg>Changed — not saved yet</span></p>',
      '<p class="rk-hint" id="{{ r.bid }}">No code yet — the catalogue shows the course name only.</p>',
      '<p class="rk-ferr" id="{{ r.eid }}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#cmi-alert"></use></svg>{{ r.err }}</p>',
      '<div class="cm-codes-foot">\n          <p class="cm-codes-state" role="status">{{ K.stateText }}</p>\n          <div class="cm-btnrow">',
    ]) {
      expect(CODES).toContain(piece);
    }
    const typed = vi.fn();
    const { container } = render(
      <CmCodesSurface
        title="Courses"
        titleId="cm-k-h"
        note="From Academic structure, kept by the Super Admin"
        hint="Each code must be unique."
        hintId="cc-hint"
      >
        <CmCodesTable
          caption="Platform course codes"
          headers={{ course: 'Course', live: 'Live experiments', code: 'Platform course code' }}
          areas={[
            {
              key: 'mech',
              name: 'Mechanical & Manufacturing',
              count: '2 courses',
              rows: [
                {
                  key: 'thermo',
                  name: 'Thermodynamics & Heat Transfer',
                  liveText: '3 experiments live under this course',
                  live: 3,
                  field: {
                    id: 'cc-code-0',
                    value: 'ME ZG523',
                    label: 'Platform course code for Thermodynamics & Heat Transfer',
                    inlineLabel: 'Platform course code',
                    onChange: typed,
                    describedBy: 'cc-hint',
                  },
                },
                {
                  key: 'fluids',
                  name: 'Fluid Mechanics',
                  liveText: 'Nothing live yet',
                  live: 0,
                  field: {
                    id: 'cc-code-1',
                    value: 'ME ZG523',
                    label: 'Platform course code for Fluid Mechanics',
                    inlineLabel: 'Platform course code',
                    onChange: typed,
                    invalid: true,
                    describedBy: 'cc-hint cc-code-1-c cc-code-1-e',
                  },
                  changed: { id: 'cc-code-1-c', text: 'Changed — not saved yet' },
                  error: {
                    id: 'cc-code-1-e',
                    text: 'ME ZG523 is already the code for Thermodynamics & Heat Transfer.',
                  },
                },
              ],
            },
          ]}
        />
        <CmCodesFoot state="1 change not saved">
          <Button>Undo changes</Button>
          <Button variant="primary">Save codes</Button>
        </CmCodesFoot>
      </CmCodesSurface>,
    );
    const surface = screen.getByRole('region', { name: 'Courses' });
    expect(surface.className).toBe('rk-surface');
    expect(surface.querySelector('.rk-sec > .cm-stack > p.rk-next')).toHaveAttribute(
      'id',
      'cc-hint',
    );
    const table = screen.getByRole('table', { name: 'Platform course codes' });
    expect(table.parentElement).toHaveClass('cm-codeswrap');
    expect(table.querySelector('tr.cm-area > th')).toHaveAttribute('scope', 'rowgroup');
    expect(classesOf(table.querySelectorAll('.cm-livecount'))).toEqual([
      'cm-livecount',
      'cm-livecount is-zero',
    ]);
    const fluids = screen.getByRole('textbox', {
      name: 'Platform course code for Fluid Mechanics',
    });
    expect(fluids).toHaveClass('rk-input');
    expect(fluids).toHaveAttribute('aria-invalid', 'true');
    expect(fluids).toHaveAttribute('autocomplete', 'off');
    expect(fluids).toHaveAttribute('spellcheck', 'false');
    expect(fluids).toHaveAccessibleDescription(
      'Each code must be unique. Changed — not saved yet ME ZG523 is already the code for Thermodynamics & Heat Transfer.',
    );
    const field = fluids.parentElement!;
    expect(field.className).toBe('rk-field');
    expect(field.firstElementChild!.className).toBe('rk-label cm-inlabel');
    expect(pathOf(field.querySelector('.cm-tag'))).toBe(V3_ICON_PATHS.edit);
    expect(pathOf(field.querySelector('.rk-ferr'))).toBe(V3_ICON_PATHS.alertCircle);
    fireEvent.change(fluids, { target: { value: 'ME ZG541' } });
    expect(typed).toHaveBeenCalledWith('ME ZG541');
    const foot = surface.querySelector('.cm-codes-foot')!;
    expect(classesOf(foot.children)).toEqual(['cm-codes-state', 'cm-btnrow']);
    expect(within(foot as HTMLElement).getByRole('status')).toHaveTextContent('1 change not saved');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('a save that failed (`div.rk-errsum[role=alert][tabindex=-1]`): what happened and Try again', async () => {
    for (const piece of [
      '<div class="rk-errsum" id="cm-k-fail" tabindex="-1" role="alert">',
      '<p class="rk-errsum-t">We couldn’t save the codes</p>',
    ]) {
      expect(CODES).toContain(piece);
    }
    // The line and Try again, spaced inline: `p.rk-x-errsum-line`, `rk-x-errsum-retry` (V3P-14).
    expect(CODES).toContain(
      '<p style="margin-top: 4px; font: 500 15px/22px var(--sans)">Nothing has changed.',
    );
    expect(CODES).toContain(
      '<button type="button" class="rb-btn" style="margin-top: 10px" onClick="{{ K.save }}">Try again</button>',
    );
    const ref = createRef<HTMLDivElement>();
    const onRetry = vi.fn();
    const { container, rerender } = render(
      <CmCodesFailed
        ref={ref}
        id="cc-fail"
        title="We couldn’t save the codes"
        retry={{ label: 'Try again', onRetry }}
      >
        Nothing has changed. Your edits are still in the table. Try again.
      </CmCodesFailed>,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBe(ref.current);
    expect(alert.className).toBe('rk-errsum');
    expect(alert).toHaveAttribute('tabindex', '-1');
    expect([...alert.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'P rk-errsum-t',
      'P rk-x-errsum-line',
      'BUTTON rb-btn rk-x-errsum-retry',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
    // Where trying again cannot help, no button.
    rerender(
      <CmCodesFailed id="cc-fail" title="We couldn’t save the codes">
        Someone else changed the codes.
      </CmCodesFailed>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
