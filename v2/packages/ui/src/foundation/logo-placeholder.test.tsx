/**
 * LogoPlaceholder — markup contract and accessibility (Appendix E §3.1 LogoPlaceholder, §4.5).
 * Sources: board 06 "The seven sidebars · full width (≥ 1280 px)" (the sidebar box), board 05
 * "GL-01 Workspace Shell" and board 07 (the same box in every shell); the public placement
 * `span.xp-logo`, board B1-01 "Landing · 1440 · default". The boards draw the box with the words
 * "BITS Pilani / WILP logo — placeholder" until the approved lockup is supplied; the owner's lockup
 * is the one the accepted V1 landing shows, so the box now holds it (K-02).
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { LOGO_PLACEHOLDER_TEXT, LogoPlaceholder, OFFICIAL_LOGO } from './logo-placeholder.js';

const IMAGE =
  '<img class="xr-logo-img" alt="BITS Pilani Work Integrated Learning Programmes" width="632" height="316" src="/brand/bits-wilp-lockup.png">';

describe('LogoPlaceholder markup contract', () => {
  it('the sidebar box board 06 draws, holding the official lockup', () => {
    expectBoardDraws(
      { board: '06', frame: 'The seven sidebars · full width (≥ 1280 px)' },
      '<div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>',
    );
    const { container } = render(<LogoPlaceholder />);
    expect(container.innerHTML).toBe(`<div class="xr-logo-ph xr-logo--official">${IMAGE}</div>`);
  });

  it('the public box B1-01 draws in the header and the footer, holding the official lockup', () => {
    expectBoardDraws(
      { board: 'B1-01', frame: 'Landing · 1440 · default' },
      '<div class="xp-foot-brand"><span class="xp-logo">BITS Pilani / WILP logo — placeholder</span><span>XR Learning Platform</span></div>',
    );
    const { container } = render(<LogoPlaceholder placement="public" />);
    expect(container.innerHTML).toBe(`<span class="xp-logo xr-logo--official">${IMAGE}</span>`);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it('boards 05 and 07 draw the same box in every shell; it holds the same lockup', () => {
    expectBoardDraws(
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<div class="xr-logo-ph" style="flex: 1 1 auto">BITS Pilani / WILP logo — placeholder</div>',
    );
    expectBoardDraws(
      { board: '07', frame: 'State 2 · My reports · open / reopened / resolved · Institute Admin' },
      '<div class="xr-side-head"><div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div><span class="xr-product">XR Learning Platform</span></div>',
    );
    const { container } = render(<LogoPlaceholder />);
    expect(container.innerHTML).toBe(`<div class="xr-logo-ph xr-logo--official">${IMAGE}</div>`);
  });

  it('the lockup is the landing’s file and is named for screen readers', () => {
    expect(OFFICIAL_LOGO.src).toBe('/brand/bits-wilp-lockup.png');
    expect(LOGO_PLACEHOLDER_TEXT).toBe(OFFICIAL_LOGO.alt);
    render(<LogoPlaceholder />);
    expect(
      screen.getByRole('img', { name: 'BITS Pilani Work Integrated Learning Programmes' }),
    ).toBeInTheDocument();
  });

  it('keeps a composition class after its own', () => {
    const { container } = render(<LogoPlaceholder className="xw-full" />);
    expect(container.firstElementChild!.className).toBe('xr-logo-ph xr-logo--official xw-full');
  });

  it('emits only stylesheet classes', () => {
    const { container } = render(<LogoPlaceholder />);
    expectStylesheetClassesOnly(container.firstElementChild!);
  });

  it('axe (WCAG 2.2 AA)', async () => {
    const { container } = render(
      <aside aria-label="Student workspace">
        <LogoPlaceholder />
      </aside>,
    );
    await assertNoAxeViolations(container);
  });
});
