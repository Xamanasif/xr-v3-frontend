import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';
import { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from '@xr/ui';

import { openSpecimen } from './support/specimen';

/**
 * The foundation content components in a real browser at the four approved viewports (Appendix
 * F WP-0.6 acceptance 3–4): Link / BackLink / JumpLink, FormatBadge / FormatSet, StatusPill,
 * Notice, ShellBanner (XS-08), the list states and MessagePage. Axe and the keyboard walk run on
 * every specimen; the behaviour tests cover what jsdom cannot show: the container-query "Go to
 * decision" link and its focus move, real accessible names, the focus ring on a navy banner, the
 * live loading region and reduced motion.
 */
const SPECIMENS = [
  'c-links',
  'c-format-badge',
  'c-status-pill',
  'c-notice',
  'c-shell-banner-paused',
  'c-shell-banner-inactive',
  'c-states',
  'c-message-page',
  'c-message-page-confirmation',
];

for (const id of SPECIMENS) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await openSpecimen(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

/**
 * Lets running transitions and animations finish. Use with reduced motion only: the v46
 * backstop then makes every animation (the skeleton shimmer included) one .01 ms iteration.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(document.getAnimations().map((animation) => animation.finished));
  });
}

async function openSettled(page: Page, id: string, width?: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSpecimen(page, id, width);
  await settle(page);
}

/** The inline size the `xr-content` container queries resolve against. */
const contentWidth = (page: Page) =>
  page
    .locator('[data-probe="content"]')
    .evaluate((element) => element.getBoundingClientRect().width);

const DECISION_PANEL = V46_CONTAINER_THRESHOLDS.decisionPanel.px;

test.describe('JumpLink: "Go to decision" (board 13 correction "Mobile decision shortcut"; Appendix E §5.4)', () => {
  test('at the viewport’s own width it shows exactly when the content is under 860 px', async ({
    page,
  }) => {
    await openSettled(page, 'c-links');
    const jump = page.locator('[data-probe="jump"]');
    if ((await contentWidth(page)) < DECISION_PANEL) {
      await expect(jump).toBeVisible();
      await expect(jump).toHaveAccessibleName('Go to decision');
    } else {
      await expect(jump).toBeHidden();
    }
  });

  test('below 860 px of content Enter moves focus to the decision panel, which comes into view', async ({
    page,
  }) => {
    await openSettled(page, 'c-links', 600);
    expect(await contentWidth(page)).toBeLessThan(DECISION_PANEL);
    const jump = page.locator('[data-probe="jump"]');
    const panel = page.locator('[data-probe="decision"]');
    await expect(jump).toBeVisible();
    await jump.focus();
    await page.keyboard.press('Enter');
    await settle(page);
    await expect(panel).toBeFocused();
    await expect(panel).toBeInViewport();
    // The panel is a focus target, not a tab stop.
    await expect(panel).toHaveAttribute('tabindex', '-1');
  });

  test('from 860 px of content it is not displayed and not in the tab order', async ({ page }) => {
    await openSettled(page, 'c-links', 1200);
    expect(await contentWidth(page)).toBeGreaterThanOrEqual(DECISION_PANEL);
    await expect(page.locator('[data-probe="jump"]')).toBeHidden();
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops.some((stop) => stop.element.includes('Go to decision'))).toBe(false);
  });
});

test.describe('Link and BackLink', () => {
  test('an external link says it opens a new tab (board 02 "Link treatment")', async ({ page }) => {
    await openSpecimen(page, 'c-links');
    const external = page.locator('[data-probe="external"]');
    await expect(external).toHaveAccessibleName('Open delivery link (opens in a new tab)');
    await expect(external).toHaveAttribute('target', '_blank');
    await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('the back link is named by its destination and is at least 24 × 24', async ({ page }) => {
    await openSpecimen(page, 'c-links');
    const back = page.getByRole('link', { name: 'Requests', exact: true });
    await expect(back).toHaveClass('xr-back');
    const box = await back.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });
});

test.describe('ShellBanner (XS-08)', () => {
  for (const [kind, focus] of [
    ['paused', V46_FOCUS_COLOURS.focus],
    ['inactive', V46_FOCUS_COLOURS.focusDark],
  ] as const) {
    test(`${kind}: a status with Help, whose focus ring suits its surface`, async ({ page }) => {
      await openSettled(page, `c-shell-banner-${kind}`);
      const banner = page.getByRole('status');
      await expect(banner).toHaveClass(new RegExp(`xr-banner--${kind}`));
      const help = banner.getByRole('link', { name: 'Help' });
      await page.keyboard.press('Tab');
      await settle(page);
      await expect(help).toBeFocused();
      expect(await help.evaluate((element) => getComputedStyle(element).outlineColor)).toBe(
        rgb(focus),
      );
      if (kind === 'inactive') {
        expect(await help.evaluate((element) => getComputedStyle(element).color)).toBe(
          rgb('#FFFFFF'),
        );
      }
      const box = await help.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(24);
    });
  }
});

test.describe('States (board 04 "State grammar"; B1-10 frames 4–7)', () => {
  test('"Clear filters" and "Try again" work from the keyboard; the failure is an alert', async ({
    page,
  }) => {
    await openSpecimen(page, 'c-states');
    await page.getByRole('button', { name: 'Clear filters' }).press('Enter');
    await expect(page.locator('[data-probe="cleared"]')).toHaveText('Cleared 1');
    await page.getByRole('button', { name: 'Try again' }).press('Space');
    await expect(page.locator('[data-probe="retries"]')).toHaveText('Retried 1');
    // Scoped to the specimen: Next's route announcer is also role="alert".
    await expect(page.locator('div.specimen-frame').getByRole('alert')).toContainText(
      'We couldn’t load the requests',
    );
    await expect(page.getByRole('link', { name: 'Report a problem' })).toBeVisible();
  });

  test('loading is busy and announced; the same status region empties and refills', async ({
    page,
  }) => {
    await openSettled(page, 'c-states');
    const region = page.locator('div.xr-table-wrap');
    const status = region.locator(':scope > .xr-sr[role="status"]');
    const toggle = page.locator('[data-probe="toggle-loading"]');
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(status).toHaveText('Loading requests');
    await expect(region.locator('.xr-skel')).toHaveCount(3);
    // Reduced motion: the shimmer is static (board 12; the v46 reduced-motion backstop).
    expect(
      await region
        .locator('.xr-skel')
        .first()
        .evaluate(
          (element) =>
            element.getAnimations().filter((animation) => animation.playState === 'running').length,
        ),
    ).toBe(0);
    await status.evaluate((element) => Object.assign(element, { xrKept: 'kept' }));
    await toggle.press('Enter');
    await expect(region).not.toHaveAttribute('aria-busy');
    await expect(status).toHaveText('');
    await expect(
      region.getByRole('table', { name: 'Institutional access requests' }),
    ).toBeVisible();
    await toggle.press('Enter');
    await expect(status).toHaveText('Loading requests');
    expect(
      await status.evaluate((element) => (element as Element & { xrKept?: string }).xrKept),
    ).toBe('kept');
  });

  test('every state action meets the 24 × 24 target minimum (WCAG 2.5.8)', async ({ page }) => {
    await openSpecimen(page, 'c-states');
    for (const box of await page
      .locator('.xr-empty .xr-btn, .xr-notice-actions .xr-btn')
      .evaluateAll((controls) => controls.map((control) => control.getBoundingClientRect()))) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe('MessagePage (AR-10, GL-04; board 08 "Anatomy")', () => {
  test('one H1, the primary action named by its destination, then quiet Help', async ({ page }) => {
    await openSpecimen(page, 'c-message-page');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText('This experiment isn’t available to you');
    const actions = page.locator('.xr-msg-actions a');
    await expect(actions).toHaveText(['Back to My courses', 'Help']);
    await expect(actions.first()).toHaveClass('xr-btn xr-btn--primary');
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops.map((stop) => stop.element)).toEqual([
      expect.stringContaining('"Back to My courses"'),
      expect.stringContaining('"Help"'),
    ]);
    const width = await page
      .locator('.xr-msg')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(600);
  });
});

test.describe('MessagePage as the result of an action (B4-12; Appendix E §8 "focus moves to the result")', () => {
  test('the confirmation takes focus, is in view, and is a focus target but not a tab stop', async ({
    page,
  }) => {
    await openSettled(page, 'c-message-page-confirmation');
    await page.locator('[data-probe="submit"]').press('Enter');
    await settle(page);
    const confirmation = page.locator('[data-probe="confirmation"]');
    await expect(confirmation).toBeFocused();
    await expect(confirmation).toBeInViewport();
    await expect(confirmation).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Answers submitted');
    await expect(confirmation.locator('p.xr-lead')).toContainText('Submitted 5 Nov 2026, 18:52.');
    const stops = await expectNoInvisibleFocusTargets(page);
    expect(stops.map((stop) => stop.element)).toEqual([
      expect.stringContaining('"Back to experiment"'),
      expect.stringContaining('"See your result page"'),
    ]);
    await expectNoAxeViolations(page);
  });
});
