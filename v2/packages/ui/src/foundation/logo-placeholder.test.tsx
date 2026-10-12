/**
 * LogoPlaceholder — markup contract and accessibility (Appendix E §3.1 LogoPlaceholder, §4.5;
 * BC12). Sources: board 06 "The seven sidebars · full width (≥ 1280 px)" (the sidebar box, drawn
 * statically), board 05 "GL-01 Workspace Shell" and board 07 (the same box in every shell). The
 * public placements `xp-logo` and `xp-auth-brand` are Phase 1 (G-8). The committed branding PNG
 * is never used (VD-03).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  assertNoAxeViolations,
  expectBoardDraws,
  expectRenderedAsDrawn,
  expectStylesheetClassesOnly,
} from '../testing/index.js';
import { LOGO_PLACEHOLDER_TEXT, LogoPlaceholder } from './logo-placeholder.js';

describe('LogoPlaceholder markup contract', () => {
  it('renders exactly the sidebar box board 06 draws', () => {
    const { container } = render(<LogoPlaceholder />);
    expectRenderedAsDrawn(
      container.firstElementChild!,
      { board: '06', frame: 'The seven sidebars · full width (≥ 1280 px)' },
      '<div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div>',
    );
  });

  it('the text is exactly the BC12 wording, as boards 05 and 07 draw it too', () => {
    expect(LOGO_PLACEHOLDER_TEXT).toBe('BITS Pilani / WILP logo — placeholder');
    expectBoardDraws(
      { board: '05', frame: 'GL-01 Workspace Shell' },
      '<div class="xr-logo-ph" style="flex: 1 1 auto">BITS Pilani / WILP logo — placeholder</div>',
    );
    expectBoardDraws(
      { board: '07', frame: 'State 2 · My reports · open / reopened / resolved · Institute Admin' },
      '<div class="xr-side-head"><div class="xr-logo-ph">BITS Pilani / WILP logo — placeholder</div><span class="xr-product">XR Learning Platform</span></div>',
    );
    render(<LogoPlaceholder />);
    expect(screen.getByText(LOGO_PLACEHOLDER_TEXT)).toBeInTheDocument();
  });

  it('is text, not an image: the branding PNG is never imported (VD-03)', () => {
    const { container } = render(<LogoPlaceholder />);
    expect(container.querySelector('img, svg, picture')).toBeNull();
    const source = readFileSync(join(import.meta.dirname, 'logo-placeholder.tsx'), 'utf8');
    expect(source).not.toMatch(/\.png|branding\//);
  });

  it('keeps a composition class after `xr-logo-ph`', () => {
    const { container } = render(<LogoPlaceholder className="xw-full" />);
    expect(container.firstElementChild!.className).toBe('xr-logo-ph xw-full');
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
