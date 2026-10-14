import { expect, type Page } from '@playwright/test';
import { SLICE1_TERMS } from '@xr/config/policy-terms';

import {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
} from './index';

/**
 * The checks every built screen state passes at 1440, 1024, 768 and 375 (Appendix F WP-0.13
 * acceptance 7; §7.2; handoff README "Done"), shared by the Phase-0 suite (`foundation/a11y`) and
 * the Phase-1 suites.
 */
/**
 * WCAG 2.2 SC 2.5.8 Target Size (Minimum), as the criterion reads: every rendered target is at
 * least 24 × 24 CSS px, unless it is inline in a sentence, or — the spacing exception — a 24 px
 * circle centred on it intersects no other target and no other undersized target's circle (the
 * v46 crumb link and the error-summary link are undersized and pass by spacing).
 */
export async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    interface Target {
      readonly name: string;
      readonly box: DOMRect;
      readonly inline: boolean;
    }
    const targets: Target[] = [];
    // While a modal dialog is open the page behind it is inert: only the dialog's own controls
    // are targets (a radio under a bottom sheet is not something a pointer can reach).
    const modal = document.querySelector('dialog:modal');
    for (const element of document.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, summary',
    )) {
      if (modal && !modal.contains(element)) continue;
      if (element.closest('[inert]')) continue;
      if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      if (element.classList.contains('xr-skip')) continue; // off-screen until focused
      const parentText = element.parentElement?.textContent?.trim() ?? '';
      const inline =
        element.tagName === 'A' &&
        getComputedStyle(element).display === 'inline' &&
        parentText.length > (element.textContent ?? '').trim().length;
      const name = (element.textContent || element.getAttribute('aria-label') || '').trim();
      targets.push({ name: `${element.tagName.toLowerCase()} "${name}"`, box, inline });
    }
    const small = targets.filter(
      (target) => !target.inline && (target.box.width < 24 || target.box.height < 24),
    );
    const centre = (box: DOMRect) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
    const circleHitsBox = (c: { x: number; y: number }, box: DOMRect) => {
      const dx = Math.max(box.left - c.x, 0, c.x - box.right);
      const dy = Math.max(box.top - c.y, 0, c.y - box.bottom);
      return dx * dx + dy * dy < 12 * 12;
    };
    const failing: string[] = [];
    for (const target of small) {
      const c = centre(target.box);
      const crowded = targets.some((other) => {
        if (other === target) return false;
        if (circleHitsBox(c, other.box)) return true;
        if (!small.includes(other)) return false;
        const o = centre(other.box);
        return (c.x - o.x) ** 2 + (c.y - o.y) ** 2 < 24 * 24;
      });
      if (crowded) {
        failing.push(
          `${target.name} ${Math.round(target.box.width)}×${Math.round(target.box.height)}`,
        );
      }
    }
    return failing;
  });
}

export async function noSlice1(page: Page): Promise<void> {
  const html = await page.content();
  for (const term of SLICE1_TERMS.filter((candidate) => candidate.scope.includes('code'))) {
    expect(html, term.id).not.toMatch(term.pattern);
  }
}

export async function checkState(page: Page, heading: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expectNoAxeViolations(page);
  const stops = await expectNoInvisibleFocusTargets(page);
  expect(stops.length).toBeGreaterThan(0);
  expect(await smallTargets(page)).toEqual([]);
  await expectNoDeveloperSurfaces(page);
  await noSlice1(page);
  // Pages grow with their content; nothing scrolls sideways at any width (board 12 "reflow").
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
