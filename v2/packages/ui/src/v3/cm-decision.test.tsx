/**
 * What only the Content Manager's decision group draws (owner-approved export
 * design/v3-refined-b/roles/CM-v1, `project/Main.dc.html` `v.decision` CM-03 and `v.published`
 * CM-05): the sheet sections with their note or the gate's verdict, the publication check as a
 * gate, the catalogue entry with its formats and device needs, the blockers, the live facts, the
 * delivery cards and the Corrections panel's primary link. Markup against the export's classes and
 * ARIA, the class contract and the accessibility checks.
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { assertNoAxeViolations, cmExportText, expectV3ClassesOnly } from '../testing/index.js';
import {
  CmBlockers,
  CmCatalogueEntry,
  CmDeliveryCards,
  CmFormatRows,
  CmGoLink,
  CmLiveFacts,
  CmPublicationChecks,
  CmSheetSection,
  CmSubHeading,
} from './cm-decision.js';
import { V3_ICON_PATHS } from './icons.js';

const MAIN = cmExportText('Main.dc.html');
/** CM-03's template in the export. */
const DECISION = MAIN.slice(
  MAIN.indexOf('<!-- CM-03 Publication decision -->'),
  MAIN.indexOf('<!-- CM-04 Content library -->'),
);
/** CM-05's template in the export. */
const PUBLISHED = MAIN.slice(
  MAIN.indexOf('<!-- CM-05 Published experiment'),
  MAIN.indexOf('<!-- CM-08 Updates list -->'),
);

const pathOf = (element: Element | null) => element?.querySelector('path')?.getAttribute('d');

describe('CM-03 the publication check as a gate (`ul.cm-checks.cm-gate`)', () => {
  it('the section head with the verdict; two met and one failed check with its fix line', async () => {
    for (const piece of [
      '<section class="rk-sec" aria-labelledby="cm-d-check">',
      '<div class="rk-sec-h"><h2 class="rb-h2" id="cm-d-check">Publication check</h2><p class="{{ D.gateCls }}">{{ D.gateLine }}</p></div>',
      '<ul class="cm-checks cm-gate">',
      '<li class="{{ c.cls }}"><span class="cm-check-ico" aria-hidden="true">',
      '<p class="cm-check-t"><span class="xr-sr">{{ c.sr }}</span>{{ c.t }}</p><p class="cm-check-d">{{ c.d }}</p><sc-if value="{{ c.hasFix }}" hint-placeholder-val="{{ false }}"><p class="cm-check-fix">{{ c.fix }}</p></sc-if>',
    ]) {
      expect(DECISION).toContain(piece);
    }
    expect(MAIN).toContain("cls: 'cm-check ' + (k.ok ? 'cm-check--ok' : 'cm-check--no')");
    expect(MAIN).toContain(
      "gateCls: 'cm-gateline' + (withCm && nb ? ' is-no' : (withCm || pub) ? ' is-ok' : '')",
    );
    const { container } = render(
      <CmSheetSection
        title="Publication check"
        titleId="cm-d-check"
        verdict={{ words: '1 check not met · publishing is blocked', tone: 'no' }}
      >
        <CmPublicationChecks
          label="Publication check"
          stateWords={{ met: 'Met: ', notMet: 'Not met: ' }}
          items={[
            {
              key: 'approved',
              title: 'Approved by the Academic Reviewer',
              detail: 'Prof. A. Menon · 21 Aug 2026',
              met: true,
            },
            {
              key: 'outcomes',
              title: 'Learning outcomes',
              detail: 'None',
              met: false,
              fix: 'Send it back to the Academic Reviewer to add them.',
            },
          ]}
        />
      </CmSheetSection>,
    );
    const section = screen.getByRole('region', { name: 'Publication check' });
    expect(section.className).toBe('rk-sec');
    const head = section.querySelector(':scope > div.rk-sec-h')!;
    expect(head.querySelector('h2')!.className).toBe('rb-h2');
    expect(head.querySelector('p')!.className).toBe('cm-gateline is-no');
    const list = within(section).getByRole('list', { name: 'Publication check' });
    expect(list.className).toBe('cm-checks cm-gate');
    const [met, failed] = [...list.querySelectorAll(':scope > li')];
    expect(met!.className).toBe('cm-check cm-check--ok');
    expect(failed!.className).toBe('cm-check cm-check--no');
    expect(met!.querySelector('.cm-check-ico')).toHaveAttribute('aria-hidden', 'true');
    expect(pathOf(met!.querySelector('.cm-check-ico'))).toBe(V3_ICON_PATHS.check);
    expect(pathOf(failed!.querySelector('.cm-check-ico'))).toBe(V3_ICON_PATHS.cross);
    expect(met!.querySelector('.cm-check-t')!.textContent).toBe(
      'Met: Approved by the Academic Reviewer',
    );
    expect(met!.querySelector('.cm-check-t .xr-sr')).toHaveTextContent('Met:');
    expect(met!.querySelector('.cm-check-fix')).toBeNull();
    expect(failed!.querySelector('.cm-check-t')!.textContent).toBe('Not met: Learning outcomes');
    expect(failed!.querySelector('.cm-check-d')).toHaveTextContent('None');
    expect(failed!.querySelector('.cm-check-fix')).toHaveTextContent(
      'Send it back to the Academic Reviewer to add them.',
    );
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('the verdict’s three tones, or a plain note', () => {
    const { rerender, container } = render(
      <CmSheetSection title="Publication check" titleId="t" verdict={{ words: 'x', tone: 'ok' }}>
        <p>body</p>
      </CmSheetSection>,
    );
    expect(container.querySelector('.rk-sec-h p')!.className).toBe('cm-gateline is-ok');
    rerender(
      <CmSheetSection title="Publication check" titleId="t" verdict={{ words: 'x', tone: 'plain' }}>
        <p>body</p>
      </CmSheetSection>,
    );
    expect(container.querySelector('.rk-sec-h p')!.className).toBe('cm-gateline');
    rerender(
      <CmSheetSection title="History" titleId="t" note="Newest first">
        <p>body</p>
      </CmSheetSection>,
    );
    expect(DECISION).toContain(
      '<div class="rk-sec-h"><h2 class="rb-h2" id="cm-d-hist">History</h2><p class="rb-note">Newest first</p></div>',
    );
    expect(container.querySelector('.rk-sec-h p')!.className).toBe('rb-note');
    expect(container.querySelector('.rk-sec-h p')).toHaveTextContent('Newest first');
    rerender(
      <CmSheetSection title="Submission and review summary" titleId="t">
        <CmSubHeading>Delivery by format</CmSubHeading>
      </CmSheetSection>,
    );
    expect(container.querySelector('.rk-sec-h p')).toBeNull();
    // Spaced inline in the export (`margin: 24px 0 10px`): `rk-x-h3-sub` (V3P-14).
    expect(DECISION).toContain(
      '<h3 class="rk-h3" style="margin: 24px 0 10px">Delivery by format</h3>',
    );
    expect(container.querySelector('h3')!.className).toBe('rk-h3 rk-x-h3-sub');
    expectV3ClassesOnly(container);
  });
});

describe('the catalogue entry (`article.cm-cat`) with its formats and device needs (`ul.cm-devs`)', () => {
  it('CM-03 preview: the tag, the course, the name, the formats, no outcomes yet, the device rows', async () => {
    for (const piece of [
      '<article class="cm-cat" aria-labelledby="cm-d-cat-name">',
      '<div class="cm-cat-top"><span class="{{ D.previewCls }}"><i></i>{{ D.previewTag }}</span><span class="cm-cat-course"><sc-if value="{{ D.hasCode }}" hint-placeholder-val="{{ true }}"><span class="rk-code">{{ D.code }}</span></sc-if>{{ D.cname }}</span></div>',
      '<div class="cm-cat-body">',
      '<h3 class="cm-cat-name" id="cm-d-cat-name">{{ D.name }}</h3>',
      '<p class="cm-cat-sum">{{ D.summary }}</p>',
      '<h4 class="cm-cat-h">Learning outcomes</h4>',
      '<sc-if value="{{ D.noLo }}" hint-placeholder-val="{{ false }}"><p class="rk-hint">None yet. The Academic Reviewer sets them during review, one set for every format.</p></sc-if>',
      '<div class="cm-devswrap"><ul class="cm-devs">',
      '<li class="cm-dev cm-dev--head" aria-hidden="true"><span>Format</span><span>How it runs</span><span>Device needs</span></li>',
      '<li class="cm-dev"><p class="cm-fmtname"><span class="xr-fmt" aria-hidden="true">{{ d.code }}</span><span class="cm-sub-strong">{{ d.name }}</span></p><p class="cm-dev-d"><span class="cm-inlabel">How it runs</span>{{ d.how }}</p><p class="cm-dev-d"><span class="cm-inlabel">Device needs</span>{{ d.dev }}</p></li>',
    ]) {
      expect(DECISION).toContain(piece);
    }
    const { container } = render(
      <CmCatalogueEntry
        nameId="cm-d-cat-name"
        tag={{ words: 'Preview — not public yet', tone: 'neutral' }}
        course={{ code: 'CHE ZG513', name: 'Process Instrumentation & Control' }}
        name="Packed Bed Pressure Drop"
        summary="Push air through a packed bed."
        availableIn="Available in"
        formats={['WEB', 'AR']}
        formatsLabel="Formats: WEB, AR"
        outcomesTitle="Learning outcomes"
        outcomes={[]}
        noOutcomes="None yet. The Academic Reviewer sets them during review, one set for every format."
        formatsTitle="Formats and device needs"
      >
        <CmFormatRows
          head={['Format', 'How it runs', 'Device needs']}
          rows={[
            {
              key: 'web',
              code: 'WEB',
              name: 'Browser',
              cells: [
                { label: 'How it runs', lines: ['The experiment in a web browser.'] },
                { label: 'Device needs', lines: ['A current browser'] },
              ],
            },
            {
              key: 'ar',
              code: 'AR',
              name: 'Augmented reality',
              cells: [
                { label: 'How it runs', lines: ['Overlaid on your surroundings.'] },
                { label: 'Device needs', lines: ['Not given yet'] },
              ],
            },
          ]}
        />
      </CmCatalogueEntry>,
    );
    const entry = screen.getByRole('article', { name: 'Packed Bed Pressure Drop' });
    expect(entry.className).toBe('cm-cat');
    const top = entry.querySelector(':scope > div.cm-cat-top')!;
    expect(top.querySelector(':scope > span')!.className).toBe('xr-st');
    expect(top.querySelector(':scope > span')).toHaveTextContent('Preview — not public yet');
    const course = top.querySelector(':scope > span.cm-cat-course')!;
    expect(course.querySelector('.rk-code')).toHaveTextContent('CHE ZG513');
    expect(course).toHaveTextContent('CHE ZG513Process Instrumentation & Control');
    const body = entry.querySelector(':scope > div.cm-cat-body')!;
    const [about, outcomes, formats] = [...body.children];
    expect(about!.querySelector('h3')!.className).toBe('cm-cat-name');
    expect(about!.querySelector('p.cm-cat-sum')).toHaveTextContent(
      'Push air through a packed bed.',
    );
    const avail = about!.querySelector('p.cm-cat-avail')!;
    // The badges' `margin-top: 0`, inline in the export: `rk-x-fmts-flush` (V3P-14).
    expect(DECISION).toContain(
      '<p class="cm-cat-avail">Available in <span class="rk-fmts" style="margin-top: 0"',
    );
    expect(avail.querySelector(':scope > span')!.className).toBe('rk-fmts rk-x-fmts-flush');
    expect(avail.querySelector('.rk-fmts .xr-sr')).toHaveTextContent('Formats: WEB, AR');
    expect([...avail.querySelectorAll('.rk-fmts .xr-fmt')].map((chip) => chip.textContent)).toEqual(
      ['WEB', 'AR'],
    );
    expect(outcomes!.querySelector('h4')!.className).toBe('cm-cat-h');
    expect(outcomes!.querySelector('h4')!.textContent).toBe('Learning outcomes');
    expect(outcomes!.querySelector('ol')).toBeNull();
    expect(outcomes!.querySelector('p')!.className).toBe('rk-hint');
    expect(formats!.querySelector('h4')).toHaveTextContent('Formats and device needs');
    const devs = formats!.querySelector(':scope > div.cm-devswrap > ul.cm-devs')!;
    const rows = [...devs.children];
    expect(rows.map((row) => row.className)).toEqual(['cm-dev cm-dev--head', 'cm-dev', 'cm-dev']);
    expect(rows[0]).toHaveAttribute('aria-hidden', 'true');
    expect(rows[1]!.querySelector('p.cm-fmtname > span.xr-fmt')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(rows[1]!.querySelector('p.cm-fmtname > span.cm-sub-strong')).toHaveTextContent(
      'Browser',
    );
    expect([...rows[2]!.querySelectorAll('p.cm-dev-d')].map((cell) => cell.textContent)).toEqual([
      'How it runsOverlaid on your surroundings.',
      'Device needsNot given yet',
    ]);
    expect(rows[2]!.querySelector('p.cm-dev-d > span')!.className).toBe('cm-inlabel');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('CM-05 live entry: the tag in green, the version after the formats, who sets the outcomes', async () => {
    for (const piece of [
      '<div class="cm-cat-top"><span class="xr-st xr-st--ok"><i></i>In the public catalogue</span>',
      '<span>· version {{ P.ver }}</span></p>',
      '<h4 class="cm-cat-h">Learning outcomes <span class="cm-cat-hs">set by the Academic Reviewer</span></h4>',
      '<ol class="cm-ol"><sc-for list="{{ P.outcomes }}" as="l" hint-placeholder-count="2"><li>{{ l }}</li></sc-for></ol>',
    ]) {
      expect(PUBLISHED).toContain(piece);
    }
    const { container } = render(
      <CmCatalogueEntry
        nameId="cm-p-cat-name"
        tag={{ words: 'In the public catalogue', tone: 'ok' }}
        course={{ code: null, name: 'Process Instrumentation & Control' }}
        name="Distillation Column"
        summary="Bring a binary column to steady state."
        availableIn="Available in"
        formats={['VR', 'WEB']}
        formatsLabel="Formats: WEB, VR"
        version="· version 1.2"
        outcomesTitle="Learning outcomes"
        outcomesBy="set by the Academic Reviewer"
        outcomes={['Bring a column to steady state', 'Tune reflux ratio']}
        formatsTitle="Formats and device needs"
      >
        <p>formats</p>
      </CmCatalogueEntry>,
    );
    const entry = screen.getByRole('article', { name: 'Distillation Column' });
    expect(entry.querySelector('.cm-cat-top > span')!.className).toBe('xr-st xr-st--ok');
    expect(entry.querySelector('.cm-cat-course .rk-code')).toBeNull();
    const avail = entry.querySelector('p.cm-cat-avail')!;
    expect([...avail.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(avail.querySelector(':scope > span:last-child')).toHaveTextContent('· version 1.2');
    const heading = entry.querySelectorAll('h4.cm-cat-h')[0]!;
    expect(heading.textContent).toBe('Learning outcomes set by the Academic Reviewer');
    expect(heading.querySelector('span')!.className).toBe('cm-cat-hs');
    const list = entry.querySelector('ol')!;
    expect(list.className).toBe('cm-ol');
    expect([...list.children].map((item) => item.textContent)).toEqual([
      'Bring a column to steady state',
      'Tune reflux ratio',
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('CM-03 delivery by format: two lines in a value, a line break between them', () => {
    expect(DECISION).toContain(
      '<p class="cm-dev-d"><span class="cm-inlabel">Delivery</span>{{ d.how }}<br>{{ d.detail }}</p><p class="cm-dev-d"><span class="cm-inlabel">Status</span>{{ d.state }}</p>',
    );
    const { container } = render(
      <CmFormatRows
        head={['Format', 'Delivery', 'Status']}
        rows={[
          {
            key: 'web',
            code: 'WEB',
            name: 'Browser',
            cells: [
              { label: 'Delivery', lines: ['Web link', 'https://labs.example/flash'] },
              { label: 'Status', lines: ['Passed review'] },
            ],
          },
        ]}
      />,
    );
    const cell = container.querySelectorAll('li.cm-dev:not(.cm-dev--head) p.cm-dev-d')[0]!;
    expect(cell.innerHTML).toBe(
      '<span class="cm-inlabel">Delivery</span>Web link<br>https://labs.example/flash',
    );
    expect(container.querySelector('.cm-dev--head')!.textContent).toBe('FormatDeliveryStatus');
    expectV3ClassesOnly(container);
  });
});

describe('the decision panel’s blockers (`div.rk-pending[role=status]`)', () => {
  it('the alert icon, the count line and one line per failing check', async () => {
    expect(DECISION).toContain(
      '<div class="rk-pending" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#cmi-alert"></use></svg><div><p>{{ D.blockText }}</p><ul',
    );
    // The list and its items, spaced inline in the export: `rk-x-pending-list`,
    // `rk-x-pending-item` (V3P-14).
    expect(DECISION).toContain(
      '<ul style="margin-top: 4px; padding-left: 18px; list-style: disc"><sc-for list="{{ D.blockList }}" as="b" hint-placeholder-count="1"><li style="font-weight: 500">{{ b }}</li>',
    );
    const { container } = render(
      <CmBlockers
        title="1 thing to resolve before it can be published"
        items={['Learning outcomes: none. Send it back to the Academic Reviewer to add them.']}
      />,
    );
    const pending = screen.getByRole('status');
    expect(pending.className).toBe('rk-pending');
    expect(pathOf(pending)).toBe(V3_ICON_PATHS.alertCircle);
    expect(pending.querySelector(':scope > div > p')).toHaveTextContent(
      '1 thing to resolve before it can be published',
    );
    expect(
      within(pending)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Learning outcomes: none. Send it back to the Academic Reviewer to add them.']);
    expect(pending.querySelector('ul')!.className).toBe('rk-x-pending-list');
    expect(pending.querySelector('li')!.className).toBe('rk-x-pending-item');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

describe('CM-05 the published record: live facts, delivery cards, the Corrections panel link', () => {
  it('the description and live version; one card per format with its values', async () => {
    for (const piece of [
      '<dl class="rk-dl cm-p-dl">',
      '<dt>Description</dt><dd>{{ P.desc }}</dd>',
      '<dt>Live version</dt><dd>{{ P.ver }}, since {{ P.since }}</dd>',
      '<ul class="cm-delgrid">',
      '<li class="cm-delcard">',
      '<p class="cm-delcard-h"><span class="xr-fmt" aria-hidden="true">{{ d.code }}</span><span class="cm-delcard-t">{{ d.title }}</span></p>',
      '<dl class="cm-deldl"><sc-for list="{{ d.rows }}" as="x" hint-placeholder-count="2"><div><dt>{{ x.k }}</dt><dd>{{ x.v }}</dd></div></sc-for></dl>',
    ]) {
      expect(PUBLISHED).toContain(piece);
    }
    const { container } = render(
      <>
        <CmLiveFacts
          items={[
            { term: 'Description', value: 'Learners start a binary column from cold.' },
            { term: 'Live version', value: '1.2, since 3 Jul 2026' },
          ]}
        />
        <CmDeliveryCards
          cards={[
            {
              key: 'web',
              code: 'WEB',
              title: 'Web link',
              rows: [
                { term: 'Web link', value: 'https://labs.example/dc' },
                { term: 'Browser and computer', value: 'A current browser' },
              ],
            },
            {
              key: 'vr',
              code: 'VR',
              title: 'App package (provisional)',
              rows: [
                { term: 'Package', value: 'DC — VR build 1.2' },
                { term: 'Package reference', value: 'MVL-DC-VR-1.2' },
              ],
            },
          ]}
        />
      </>,
    );
    const facts = container.querySelector('dl')!;
    expect(facts.className).toBe('rk-dl cm-p-dl');
    expect([...facts.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Description',
      'Live version',
    ]);
    const grid = container.querySelector('ul')!;
    expect(grid.className).toBe('cm-delgrid');
    const cards = [...grid.children];
    expect(cards.map((item) => item.className)).toEqual(['cm-delcard', 'cm-delcard']);
    expect(cards[1]!.querySelector('p.cm-delcard-h')!.textContent).toBe(
      'VRApp package (provisional)',
    );
    expect(cards[1]!.querySelector('.cm-delcard-h .xr-fmt')).toHaveAttribute('aria-hidden', 'true');
    expect(cards[1]!.querySelector('dl')!.className).toBe('cm-deldl');
    expect(
      [...cards[1]!.querySelectorAll('dl > div')].map(
        (row) => `${row.querySelector('dt')!.textContent}: ${row.querySelector('dd')!.textContent}`,
      ),
    ).toEqual(['Package: DC — VR build 1.2', 'Package reference: MVL-DC-VR-1.2']);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('“Continue the update” / “Open update”: the gold primary drawn as a link', async () => {
    expect(PUBLISHED).toContain(
      '<button type="button" class="rb-btn rb-btn--primary rk-go" id="cm-p-open" data-to="CM-08" onClick="{{ P.openUpd }}">Open update</button>',
    );
    const { container } = render(
      <CmGoLink href="/content-manager/updates/UPD-0004">Open update</CmGoLink>,
    );
    const link = screen.getByRole('link', { name: 'Open update' });
    expect(link.className).toBe('rb-btn rb-btn--primary rk-go');
    expect(link).toHaveAttribute('href', '/content-manager/updates/UPD-0004');
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});
