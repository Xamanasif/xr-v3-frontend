/**
 * What only the Academic Reviewer's update group draws (owner-approved export
 * design/v3-refined-b/roles/RV-v1, `project/RV.dc.html` RV-04 and RV-06 for an update): "The live
 * experiment". Markup against the export's classes and ARIA, the class contract and the
 * accessibility checks.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { assertNoAxeViolations, expectV3ClassesOnly, rvExportText } from '../testing/index.js';
import { RvLiveExperiment } from './rv-update.js';

const RV = rvExportText('RV.dc.html');
/** The item view's "The live experiment" block in the export. */
const LIVE = RV.slice(
  RV.indexOf('<sc-if value="{{ I.hasLive }}"'),
  RV.indexOf('<sc-if value="{{ I.hasDeliv }}"'),
);

describe('RV-04 The live experiment (`section.rv-block` `#rv-s-live`)', () => {
  it('the kicker, heading and note, the live outcomes read-only and the footnote', async () => {
    for (const piece of [
      '<section class="rk-surface rv-block" aria-labelledby="rv-s-live">',
      '<div class="rv-block-h"><div><p class="rv-block-k">Read-only context</p><h2 class="rb-h2" id="rv-s-live" tabindex="-1">The live experiment</h2></div><p class="rb-note">{{ I.liveNote }}</p></div>',
      '<h3 class="rv-mini-h">Learning outcomes in version {{ I.liveVer }}</h3>',
      '<ol class="rv-lo-ro"><sc-for list="{{ I.liveLo }}" as="t" hint-placeholder-count="2"><li>{{ t }}</li></sc-for></ol>',
      '<p class="rv-footnote">Learning outcomes are not part of this correction.</p>',
    ]) {
      expect(LIVE).toContain(piece);
    }
    const { container } = render(
      <main>
        <RvLiveExperiment
          titleId="rv-s-live"
          kicker="Read-only context"
          title="The live experiment"
          note="Version 1.2 · live since 3 Jul 2026"
          outcomesTitle="Learning outcomes in version 1.2"
          outcomes={[
            'Bring a column to steady state from cold start',
            'Tune reflux ratio against an overhead purity target',
          ]}
          footnote="Learning outcomes are not part of this correction."
        />
      </main>,
    );
    const section = screen.getByRole('region', { name: 'The live experiment' });
    expect(section).toHaveClass('rk-surface', 'rv-block');
    expect(section).toHaveAttribute('aria-labelledby', 'rv-s-live');
    const heading = screen.getByRole('heading', { level: 2, name: 'The live experiment' });
    expect(heading).toHaveClass('rb-h2');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(section.querySelector('.rv-block-h > div > p.rv-block-k')).toHaveTextContent(
      'Read-only context',
    );
    expect(section.querySelector('.rv-block-h > p.rb-note')).toHaveTextContent(
      'Version 1.2 · live since 3 Jul 2026',
    );
    expect(section.querySelector('h3.rv-mini-h')).toHaveTextContent(
      'Learning outcomes in version 1.2',
    );
    const list = section.querySelector('ol.rv-lo-ro')!;
    // The export names this list by its heading only (no `aria-label`, unlike RV-06's own list).
    expect(list).not.toHaveAttribute('aria-label');
    expect([...list.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    expect(section.lastElementChild).toHaveClass('rv-footnote');
    expect([...section.children].map((child) => `${child.tagName}.${child.className}`)).toEqual([
      'DIV.rv-block-h',
      'H3.rv-mini-h',
      'OL.rv-lo-ro',
      'P.rv-footnote',
    ]);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });

  it('no note and no outcomes read: the head alone and the footnote', () => {
    const { container } = render(
      <RvLiveExperiment
        titleId="rv-s-live"
        kicker="Read-only context"
        title="The live experiment"
        outcomesTitle="Learning outcomes in version 1.2"
        outcomes={[]}
        footnote="Learning outcomes are not part of this correction."
      />,
    );
    const section = container.querySelector('section')!;
    expect(section.querySelector('.rb-note')).toBeNull();
    expect(section.querySelector('ol')).toBeNull();
    expect(section.querySelector('h3')).toBeNull();
    expect(section.querySelector('p.rv-footnote')).not.toBeNull();
    expectV3ClassesOnly(container);
  });
});
