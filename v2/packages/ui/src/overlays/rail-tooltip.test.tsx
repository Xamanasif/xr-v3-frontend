/**
 * RailTooltip — markup contract and accessible name (Appendix E §3.4 RailTooltip, §5.4 "Rail ·
 * Tooltip on focus; name = destination"). Sources: board 06 "Rail · Institute Admin · tooltip on
 * hover and focus" and its "Behaviour" list; B3-07 "ST-18 My device · 1440 · interactive · 22 Oct
 * 2026" (the sidebar link with its tip, as every product sidebar draws it).
 *
 * The name test loads the real v46 rules for `.xr-tip` and `.xr-side--rail` (read from the
 * byte-identical xr-foundation.css, never rewritten); hover and `:focus-visible` showing the tip
 * are proven in a real browser (apps/specimens/e2e/components-overlays.spec.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Icon } from '../foundation/icon.js';
import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
  type BoardSource,
} from '../testing/index.js';
import { RailTooltip } from './rail-tooltip.js';

const RAIL: BoardSource = {
  board: '06',
  frame: 'Rail · Institute Admin · tooltip on hover and focus',
};
const BEHAVIOUR: BoardSource = { board: '06', frame: 'Behaviour' };
const SIDEBAR: BoardSource = {
  board: 'B3-07',
  frame: 'ST-18 My device · 1440 · interactive · 22 Oct 2026',
};

function NavLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <a href={href}>
      <Icon name="home" />
      <span className="xr-nav-text">{label}</span>
      <RailTooltip>{label}</RailTooltip>
    </a>
  );
}

/** The top-level v46 rules for the tip and the standalone rail, verbatim from xr-foundation.css. */
function v46TipRules(): string {
  const css = readFileSync(
    join(import.meta.dirname, '..', 'styles', 'v46', 'xr-foundation.css'),
    'utf8',
  );
  const rules = css
    .split('\n')
    .filter((line) => line.startsWith('.xr-tip{') || line.startsWith('.xr-side--rail '));
  expect(rules).toContain('.xr-tip{display:none}');
  return rules.join('\n');
}

const sheets: HTMLStyleElement[] = [];
afterEach(() => {
  for (const sheet of sheets.splice(0)) sheet.remove();
});

function loadTipRules(): void {
  const style = document.createElement('style');
  style.textContent = v46TipRules();
  document.head.append(style);
  sheets.push(style);
}

describe('RailTooltip markup contract', () => {
  it('a sidebar link with its tip renders exactly as the product boards draw it', () => {
    const { container } = render(<NavLink href="B2-10-Student-Home.dc.html" label="Home" />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      SIDEBAR,
      '<a href="B2-10-Student-Home.dc.html"><svg class="xr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"></path></svg><span class="xr-nav-text">Home</span><span class="xr-tip">Home</span></a>',
    );
  });

  it('the rail draws the tip without role="tooltip" or aria-hidden (board 06)', () => {
    expectBoardDraws(
      RAIL,
      '<span class="xr-nav-text">{{ n.label }}</span><span class="xr-tip {{ n.tipCls }}">{{ n.label }}</span>',
    );
    const { container } = render(<RailTooltip>Overview</RailTooltip>);
    const tip = container.firstElementChild!;
    expect(tip.outerHTML).toBe('<span class="xr-tip">Overview</span>');
    expect(tip).not.toHaveAttribute('role');
    expect(tip).not.toHaveAttribute('aria-hidden');
    expectStylesheetClassesOnly(container);
  });
});

describe('RailTooltip accessible name (board 06: "the accessible name is always the destination name")', () => {
  it('without the stylesheet the tip would repeat the name — the v46 CSS is what keeps it single', () => {
    render(<NavLink href="#overview" label="Overview" />);
    expect(screen.getByRole('link')).toHaveAccessibleName('OverviewOverview');
  });

  it('full sidebar: the tip is display:none, the name is the destination', () => {
    expectBoardDraws(
      BEHAVIOUR,
      'Rail: icons with a tooltip on hover and keyboard focus; the accessible name is always the destination name.',
    );
    loadTipRules();
    render(
      <aside className="xr-side" aria-label="Institute Admin workspace">
        <nav aria-label="Institute Admin navigation">
          <ul className="xr-nav">
            <li>
              <NavLink href="#overview" label="Overview" />
            </li>
          </ul>
        </nav>
      </aside>,
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Overview');
  });

  it('rail: the label is display:none and the tip carries the destination name', () => {
    loadTipRules();
    render(
      <aside className="xr-side xr-side--rail" aria-label="Institute Admin workspace">
        <nav aria-label="Institute Admin navigation">
          <ul className="xr-nav">
            <li>
              <NavLink href="#overview" label="Overview" />
            </li>
          </ul>
        </nav>
      </aside>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName('Overview');
    expect(within(link).queryByRole('tooltip')).toBeNull();
  });

  it('axe: full sidebar and rail', async () => {
    loadTipRules();
    const { container } = render(
      <div>
        <aside className="xr-side" aria-label="Institute Admin workspace">
          <nav aria-label="Institute Admin navigation">
            <ul className="xr-nav">
              <li>
                <NavLink href="#overview" label="Overview" />
              </li>
            </ul>
          </nav>
        </aside>
        <aside className="xr-side xr-side--rail" aria-label="Student workspace">
          <nav aria-label="Student navigation">
            <ul className="xr-nav">
              <li>
                <NavLink href="#home" label="Home" />
              </li>
            </ul>
          </nav>
        </aside>
      </div>,
    );
    await assertNoAxeViolations(container);
  });
});
