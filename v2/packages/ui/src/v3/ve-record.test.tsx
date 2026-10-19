/**
 * What only the Vendor record draws (owner-approved export design/v3-refined-b/roles/VE-v1,
 * `project/Main.dc.html` record view `V.record`): VE-07's frame, Details sheet and "Where it
 * stands", and VE-13's history sheet — composed with the shared Vendor patterns (`ve.tsx`, tested
 * in `ve.test.tsx`) as the record draws them. Markup against the export's classes and ARIA, the
 * class contract and the accessibility checks.
 */
import { render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, veExportText } from '../testing/index.js';
import { DefinitionList } from './detail.js';
import { V3_ICON_PATHS } from './icons.js';
import {
  VendorDeliveryList,
  VendorDeliveryView,
  VendorFormatChips,
  VendorLearningOutcomes,
  VendorSection,
} from './ve.js';
import {
  VendorRecordHistory,
  VendorRecordLayout,
  VendorRecordSheet,
  VendorRecordStand,
} from './ve-record.js';

const MAIN = veExportText('Main.dc.html');
/** The record view's markup in the export (`V.record`). */
const RECORD_VIEW = MAIN.slice(
  MAIN.indexOf('<!-- ═══ VE-07 Experiment record'),
  MAIN.indexOf('<!-- ═══ XS-07 Help & support'),
);

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');

describe('VE-07 Details beside “Where it stands” (`div.rk-detailwrap`)', () => {
  it('the sheet with its version line, sections, delivery blocks and outcomes; the stand list', async () => {
    for (const piece of [
      '<div class="rk-detailwrap">',
      '<div class="rk-detail">',
      '<div class="rk-mainsheet">',
      '<div class="rk-surface vr-sheet">',
      '<p class="vr-intro"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-info"></use></svg><span>{{ R.intro }}</span></p>',
      '<section class="vr-sec" aria-labelledby="r-cd">',
      '<div class="vr-sec-h"><h2 class="vr-sec-t" id="r-cd">Course and description</h2></div>',
      '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="r-fd">Formats and delivery</h2><sc-if value="{{ R.isPub }}" hint-placeholder-val="{{ false }}"><p class="vr-sec-st">Formats published: {{ R.fmtText }}</p></sc-if></div>',
      '<div class="vr-dlvs"><sc-for list="{{ R.delivery }}" as="d" hint-placeholder-count="2"><div class="vr-dlv vr-dlv--ro"><div class="vr-dlv-h"><span class="xr-fmt">{{ d.code }}</span><p class="vr-dlv-t">{{ d.name }} <span class="vr-dlv-k">· {{ d.kind }}</span></p></div><dl class="rk-dl vr-dlv-b">',
      '<p class="vr-foot"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-info"></use></svg><span>Changes to a published experiment are not made from the Vendor workspace.</span></p>',
      '<ol class="ve-los">',
      '<p class="ve-intro">None yet. The Academic Reviewer adds them during review — one set for every format.</p>',
      '<aside class="rk-aside" aria-labelledby="r-ws">',
      '<div class="rk-surface vr-ws">',
      '<h2 class="vr-ws-t" id="r-ws">Where it stands</h2>',
      '<dl class="rk-stand"><div><dt>Formats</dt><dd><span class="ve-chips" aria-label="{{ R.fmtAria }}"><sc-for list="{{ R.fmts }}" as="f" hint-placeholder-count="2"><span class="xr-fmt" aria-hidden="true">{{ f }}</span></sc-for></span></dd></div>',
    ]) {
      expect(RECORD_VIEW).toContain(piece);
    }
    const { container } = render(
      <VendorRecordLayout
        asideLabelledBy="vr-ws"
        main={
          <VendorRecordSheet intro="The published version, live in the catalogue since 30 Jul 2026.">
            <VendorSection as="section" title="Course and description" titleId="vr-cd">
              <DefinitionList items={[{ term: 'Course', value: 'ME ZG523 · Thermodynamics' }]} />
            </VendorSection>
            <VendorSection
              as="section"
              title="Formats and delivery"
              titleId="vr-fd"
              row
              status="Formats published: WEB · VR"
              note="Changes to a published experiment are not made from the Vendor workspace."
            >
              <VendorDeliveryList>
                <VendorDeliveryView
                  code="WEB"
                  name="Browser"
                  kind="Web link"
                  rows={[{ term: 'Web link', value: 'https://labs.example/fin-tube' }]}
                />
                <VendorDeliveryView
                  code="VR"
                  name="Virtual reality"
                  kind="App package"
                  rows={[
                    { term: 'Package label', value: 'Fin-Tube Bundle — VR build 1.0' },
                    { term: 'Device needed', value: 'Standalone VR headset' },
                  ]}
                />
              </VendorDeliveryList>
            </VendorSection>
            <VendorLearningOutcomes
              title="Learning outcomes"
              titleId="vr-lo"
              by="Added by the Academic Reviewer · read-only"
              line="One set for every format."
              outcomes={[
                { key: '1', text: 'Quantify the effect of fouling' },
                { key: '2', text: 'Distinguish degradation from drift' },
              ]}
              empty="None yet."
            />
          </VendorRecordSheet>
        }
        aside={
          <VendorRecordStand
            title="Where it stands"
            titleId="vr-ws"
            formats={{
              term: 'Formats',
              value: <VendorFormatChips formats={['WEB', 'VR']} label="Formats: WEB, VR" />,
            }}
            items={[
              { term: 'Revision', value: '1' },
              { term: 'Last change', value: '30 Jul 2026' },
            ]}
          />
        }
      />,
    );
    const wrap = container.firstElementChild!;
    expect(wrap).toHaveClass('rk-detailwrap');
    const detail = wrap.querySelector(':scope > div.rk-detail')!;
    expect([...detail.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'DIV rk-mainsheet',
      'ASIDE rk-aside',
    ]);
    const sheet = detail.querySelector(':scope > .rk-mainsheet > div')!;
    expect(sheet.className).toBe('rk-surface vr-sheet');
    const intro = sheet.querySelector(':scope > p.vr-intro')!;
    expect(pathOf(intro)).toBe(V3_ICON_PATHS.infoNote);
    expect(intro.querySelector('span')).toHaveTextContent(
      'The published version, live in the catalogue since 30 Jul 2026.',
    );
    const course = screen.getByRole('region', { name: 'Course and description' });
    expect(course).toHaveClass('vr-sec');
    expect(course.querySelector('.vr-sec-h')!.className).toBe('vr-sec-h');
    expect(course.querySelector('h2')).toHaveClass('vr-sec-t');
    const delivery = screen.getByRole('region', { name: 'Formats and delivery' });
    expect(delivery.querySelector('.vr-sec-h')!.className).toBe('vr-sec-h vr-sec-h--row');
    expect(delivery.querySelector('p.vr-sec-st')).toHaveTextContent('Formats published: WEB · VR');
    const blocks = [...delivery.querySelectorAll('.vr-dlvs > div')];
    expect(blocks.map((block) => block.className)).toEqual(['vr-dlv', 'vr-dlv']);
    expect(blocks.map((block) => block.querySelector('.vr-dlv-h')!.textContent)).toEqual([
      'WEBBrowser · Web link',
      'VRVirtual reality · App package',
    ]);
    expect(blocks[1]!.querySelector('.vr-dlv-k')).toHaveTextContent('· App package');
    expect(blocks[1]!.querySelector('dl')!.className).toBe('rk-dl vr-dlv-b');
    expect(blocks[1]!.querySelectorAll('dt')).toHaveLength(2);
    const foot = delivery.querySelector(':scope > p.vr-foot')!;
    expect(pathOf(foot)).toBe(V3_ICON_PATHS.infoNote);
    expect(foot).toHaveTextContent(
      'Changes to a published experiment are not made from the Vendor workspace.',
    );
    const outcomes = screen.getByRole('region', { name: 'Learning outcomes' });
    expect(outcomes.querySelector('p.ve-intro')).toHaveTextContent('One set for every format.');
    expect(
      within(outcomes)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Quantify the effect of fouling', 'Distinguish degradation from drift']);
    expect(outcomes.querySelector('ol')).toHaveClass('ve-los');
    const aside = screen.getByRole('complementary', { name: 'Where it stands' });
    const stand = aside.querySelector(':scope > div.rk-surface.vr-ws')!;
    expect(stand.querySelector('h2')).toHaveClass('vr-ws-t');
    const rows = [...stand.querySelectorAll('dl.rk-stand > div')];
    expect(rows.map((row) => row.querySelector('dt')!.textContent)).toEqual([
      'Formats',
      'Revision',
      'Last change',
    ]);
    const chips = rows[0]!.querySelector('dd > span.ve-chips')!;
    expect(chips.querySelector('.xr-sr')).toHaveTextContent('Formats: WEB, VR');
    expect([...chips.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(chips.querySelector('.xr-fmt')).toHaveAttribute('aria-hidden', 'true');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('VE-13 the history sheet (`section.vr-hist`)', () => {
  it('its heading takes focus; the note, the private-changes note and the timeline, newest first', async () => {
    for (const piece of [
      '<section class="rk-surface vr-sheet vr-hist" aria-labelledby="r-hh">',
      '<div class="vr-sec-h vr-sec-h--row"><h2 class="vr-sec-t" id="r-hh" tabindex="-1">Submission and version history</h2><p class="vr-sec-st">Newest first · not an audit log</p></div>',
      '<p class="vr-intro vr-intro--inline"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#vei-lock"></use></svg><span>{{ R.histPendingNote }}</span></p>',
      '<ol class="rk-tl"><sc-for list="{{ R.hist }}" as="h" hint-placeholder-count="3"><li class="{{ h.cls }}"><p class="rk-tl-w">{{ h.what }}</p><p class="rk-tl-t">{{ h.when }}</p>',
      "cls: i === 0 ? 'is-latest' : ''",
    ]) {
      expect(MAIN).toContain(piece);
    }
    const titleRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <VendorRecordHistory
        title="Submission and version history"
        titleId="vr-hh"
        titleRef={titleRef}
        note="Newest first · not an audit log"
        privateNote="Your changes saved on 27 Aug 2026, 10:40 are not part of this history until you resubmit."
        events={[
          {
            what: 'Returned with a reason',
            when: '24 Aug 2026, 09:30',
            note: 'Academic Reviewer: “The AR install notes don’t say…”',
          },
          { what: 'Submitted for academic review', when: '18 Aug 2026, 15:00' },
        ]}
      />,
    );
    const sheet = screen.getByRole('region', { name: 'Submission and version history' });
    expect(sheet.className).toBe('rk-surface vr-sheet vr-hist');
    const heading = within(sheet).getByRole('heading', { level: 2 });
    expect(heading).toBe(titleRef.current);
    expect(heading).toHaveClass('vr-sec-t');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(sheet.querySelector('.vr-sec-h p.vr-sec-st')).toHaveTextContent(
      'Newest first · not an audit log',
    );
    const note = sheet.querySelector('p.vr-intro.vr-intro--inline')!;
    expect(pathOf(note)).toBe(V3_ICON_PATHS.lock);
    expect(note).toHaveTextContent('are not part of this history until you resubmit.');
    const items = [...sheet.querySelectorAll('ol.rk-tl > li')];
    expect(items.map((item) => item.className)).toEqual(['is-latest', '']);
    expect(items[0]!.querySelector('.rk-tl-t')).toHaveTextContent('24 Aug 2026, 09:30');
    expect(items[1]!.querySelector('.rk-tl-n')).toBeNull();
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('without saved changes: no private-changes note', () => {
    const { container } = render(
      <VendorRecordHistory
        title="Submission and version history"
        titleId="vr-hh"
        note="Newest first · not an audit log"
        events={[
          { what: 'Draft saved', when: '25 Aug 2026, 17:20', note: 'Only you can see a draft.' },
        ]}
      />,
    );
    expect(container.querySelector('.vr-intro')).toBeNull();
    expect(container.querySelectorAll('li.is-latest')).toHaveLength(1);
    expectV3ClassesOnly(container);
  });
});
