/**
 * DecisionLayout + DecisionPanel (AR-4) — markup contract, behaviour and accessibility (Appendix
 * E §3.3, §5.4, §6.4; Appendix F WP-0.6 acceptance 2–4). Sources: board 03 "Decision panel and
 * editable table" (the panel: "one decision, its reason, one confirm"); 09a "Decision page —
 * “Should I approve this?”" (AR-4); B1-11 "SA-03 Request decision · REQ-0042 · 1440 ·
 * interactive" ("Go to decision" after the page header, `div.xr-decide` > `div.xr-stack` + the
 * focusable panel, the title as a focus target); B7-05 "SA-11 Release or hold an update · 1440 ·
 * interactive" (the static panel, `xg-static`); board 11 "Decisions" (the panel under the
 * content with "Go to decision" at the top of the page).
 *
 * Variances and open decisions, asserted below: the jump link sits after the page header on the
 * product boards (70 instances, B1-11 … B7-12) and inside `xr-phead-main` on 09a and 11 (2) —
 * DecisionLayout draws the product placement, `jump={false}` leaves it to the page; board 03's
 * stand-alone specimen panel has no `id`/`tabindex` (it has no jump link) — DecisionPanel always
 * has both; the jump link's inline `margin-bottom:16px` is not emitted; sticky (default) versus
 * static is PROVISIONAL (VD-05 / PF-10: a prop, no CSS). The 860 px switch (side by side, jump
 * hidden) is a container query: proven in apps/specimens/e2e/components-data.spec.ts.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectStylesheetClassesOnly,
  normaliseMarkup,
  type BoardSource,
} from '../testing/index.js';
import { DecisionLayout, DecisionPanel } from './decision-layout.js';

const PANEL: BoardSource = { board: '03', frame: 'Decision panel and editable table' };
const AR4: BoardSource = { board: '09a', frame: 'Decision page — “Should I approve this?”' };
const REQUEST: BoardSource = {
  board: 'B1-11',
  frame: 'SA-03 Request decision · REQ-0042 · 1440 · interactive',
};
const RELEASE: BoardSource = {
  board: 'B7-05',
  frame: 'SA-11 Release or hold an update · 1440 · interactive',
};
const DECISIONS: BoardSource = { board: '11', frame: 'Expected behaviour at about 768 px (admin)' };

const CHEVRON =
  '<svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"></path></svg>';

/** The B1-11 / dc sources write React's `tabIndex`; in HTML the attribute is `tabindex`. */
const asHtml = (excerpt: string) => excerpt.replaceAll('tabIndex=', 'tabindex=');

describe('DecisionPanel markup contract', () => {
  it('board 03: an aside labelled by its title, holding one decision, its reason and one confirm', () => {
    expectBoardDraws(
      PANEL,
      '<aside class="xr-dpanel" aria-labelledby="c-dp"><h3 id="c-dp" class="xr-dpanel-title">Your decision</h3>',
      'The decision panel is the only side panel a page may carry: one decision, its reason, one confirm.',
    );
    const { container } = render(
      <DecisionPanel id="c-decision" title="Your decision" titleId="c-dp" headingLevel={3}>
        <button type="button" className="xr-btn xr-btn--primary xr-btn--block">
          Return to vendor
        </button>
      </DecisionPanel>,
    );
    const aside = container.firstElementChild!;
    // The specimen draws no jump target; the product panel is one (id + tabindex, next tests).
    expect(normaliseMarkup(aside.outerHTML).replace(' id="c-decision" tabindex="-1"', '')).toBe(
      '<aside class="xr-dpanel" aria-labelledby="c-dp"><h3 id="c-dp" class="xr-dpanel-title">Your decision</h3><button type="button" class="xr-btn xr-btn--primary xr-btn--block">Return to vendor</button></aside>',
    );
  });

  it('B7-05: the static panel (xg-static), a focusable jump target labelled by its H2', () => {
    const drawn =
      '<aside class="xr-dpanel xg-static" id="Wm-decision" tabindex="-1" aria-labelledby="Wm-dp"><h2 id="Wm-dp" class="xr-dpanel-title">Your decision</h2>';
    expectBoardDraws(RELEASE, drawn);
    const { container } = render(
      <DecisionPanel id="Wm-decision" title="Your decision" titleId="Wm-dp" position="static">
        <p>The live version stays as it is.</p>
      </DecisionPanel>,
    );
    expect(normaliseMarkup(container.firstElementChild!.outerHTML)).toBe(
      normaliseMarkup(`${drawn}<p>The live version stays as it is.</p></aside>`),
    );
  });

  it('B1-11: the title can be the focus target once the decision is made', () => {
    const drawn =
      '<aside class="xr-dpanel" id="Za-decision" tabIndex="-1" aria-labelledby="Za-dp"><h2 id="Za-dp" class="xr-dpanel-title" tabIndex="-1">Your decision</h2>';
    expectBoardDraws(REQUEST, drawn);
    const titleRef = createRef<HTMLHeadingElement>();
    const { container } = render(
      <DecisionPanel
        id="Za-decision"
        title="Your decision"
        titleId="Za-dp"
        titleFocusTarget
        titleRef={titleRef}
      />,
    );
    expect(normaliseMarkup(container.innerHTML)).toBe(normaliseMarkup(`${asHtml(drawn)}</aside>`));
    act(() => titleRef.current?.focus());
    expect(screen.getByRole('heading', { name: 'Your decision' })).toHaveFocus();
  });

  it('the default title id is <id>-title; sticky is the default (no xg-static)', () => {
    render(<DecisionPanel id="p-decision" title="Your mark" />);
    const panel = screen.getByRole('complementary', { name: 'Your mark' });
    expect(panel).toHaveClass('xr-dpanel', { exact: true });
    expect(panel).toHaveAttribute('aria-labelledby', 'p-decision-title');
    expect(panel.tabIndex).toBe(-1);
    expect(screen.getByRole('heading', { level: 2, name: 'Your mark' })).not.toHaveAttribute(
      'tabindex',
    );
  });
});

describe('DecisionLayout markup contract', () => {
  it('B1-11: "Go to decision" after the page header, then div.xr-decide > div.xr-stack + the panel', () => {
    const drawn = `<a class="xr-jump" href="#Za-decision" style="margin-bottom:16px">Go to decision${CHEVRON}</a> <div class="xr-decide"><div class="xr-stack">`;
    expectBoardDraws(REQUEST, drawn);
    const { container } = render(
      <DecisionLayout panel={{ id: 'Za-decision', titleId: 'Za-dp', title: 'Your decision' }}>
        <section className="xr-section" aria-label="Summary" />
      </DecisionLayout>,
    );
    const [jump, decide] = [...container.children];
    expect(normaliseMarkup(jump!.outerHTML)).toBe(
      normaliseMarkup(`<a class="xr-jump" href="#Za-decision">Go to decision${CHEVRON}</a>`),
    );
    expect(normaliseMarkup(decide!.outerHTML)).toBe(
      normaliseMarkup(
        '<div class="xr-decide"><div class="xr-stack"><section class="xr-section" aria-label="Summary"></section></div><aside class="xr-dpanel" id="Za-decision" tabindex="-1" aria-labelledby="Za-dp"><h2 id="Za-dp" class="xr-dpanel-title">Your decision</h2></aside></div>',
      ),
    );
  });

  it('09a (AR-4): the page may place the jump itself (inside the page header); jump={false}', () => {
    expectBoardDraws(
      AR4,
      '<a class="xr-jump" href="#ar4-decision">Go to decision',
      '<aside class="xr-dpanel" id="ar4-decision" tabIndex="-1" aria-labelledby="ar4-dp">',
    );
    const { container } = render(
      <DecisionLayout
        jump={false}
        panel={{ id: 'ar4-decision', titleId: 'ar4-dp', title: 'Your decision' }}
      >
        <p>Content</p>
      </DecisionLayout>,
    );
    expect(container.querySelector('.xr-jump')).toBeNull();
    expect(container.firstElementChild).toHaveClass('xr-decide', { exact: true });
  });

  it('board 11: below 860 px of content the panel sits under the content, reached by "Go to decision"', () => {
    expectBoardDraws(
      DECISIONS,
      'The decision panel moves under the content, full width, with a “Go to decision” link at the top of the page.',
    );
    render(
      <DecisionLayout panel={{ id: 'p-decision', title: 'Your decision' }}>
        <p>What they asked for</p>
      </DecisionLayout>,
    );
    const jump = screen.getByRole('link', { name: 'Go to decision' });
    act(() => {
      fireEvent.click(jump);
    });
    expect(screen.getByRole('complementary', { name: 'Your decision' })).toHaveFocus();
  });

  it('the panel follows the main column in source order (content first, then the decision)', () => {
    const { container } = render(
      <DecisionLayout panel={{ id: 'p-decision', title: 'Your decision', position: 'static' }}>
        <p>What changed</p>
      </DecisionLayout>,
    );
    const decide = container.querySelector('.xr-decide')!;
    expect([...decide.children].map((child) => child.tagName)).toEqual(['DIV', 'ASIDE']);
    expect(decide.lastElementChild).toHaveClass('xr-dpanel xg-static', { exact: true });
  });
});

describe('DecisionLayout: stylesheet classes and accessibility (axe, WCAG 2.2 AA)', () => {
  it('emits only stylesheet classes', () => {
    const { container } = render(
      <div>
        <DecisionLayout panel={{ id: 'a-decision', title: 'Your decision' }}>
          <p>Content</p>
        </DecisionLayout>
        <DecisionLayout panel={{ id: 'b-decision', title: 'Resolve', position: 'static' }}>
          <p>Content</p>
        </DecisionLayout>
      </div>,
    );
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it.each([
    ['sticky (default) with the jump link', 'sticky' as const, true],
    ['static (xg-static)', 'static' as const, true],
    ['without the jump link', 'sticky' as const, false],
  ])('%s', async (_name, position, jump) => {
    const { container } = render(
      <main>
        <h1>Godavari Institute of Technology</h1>
        <DecisionLayout jump={jump} panel={{ id: 'x-decision', title: 'Your decision', position }}>
          <section aria-label="Summary">
            <p>What they asked for</p>
          </section>
        </DecisionLayout>
      </main>,
    );
    await assertNoAxeViolations(container);
  });

  it.each([
    [
      'a stand-alone panel under an H2 (board 03: H3 title)',
      <section key="h3" aria-labelledby="dec-h">
        <h2 id="dec-h">Decision panel and editable table</h2>
        <DecisionPanel id="c-decision" title="Your decision" titleId="c-dp" headingLevel={3}>
          <button type="button">Return to vendor</button>
        </DecisionPanel>
      </section>,
    ],
    [
      'decided: the title is a focus target (B1-11)',
      <DecisionPanel key="decided" id="Za-decision" title="Your decision" titleFocusTarget>
        <p>Approved — payment required</p>
      </DecisionPanel>,
    ],
  ])('%s', async (_name, element) => {
    const { container } = render(<main>{element}</main>);
    await assertNoAxeViolations(container);
  });
});
