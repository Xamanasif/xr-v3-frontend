import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, expectNoInvisibleFocusTargets } from '@xr/testing/browser';

import { openSpecimen } from './support/specimen';

/**
 * Button and IconButton in a real browser at the four approved viewports (Appendix F WP-0.6
 * acceptance 3–4): axe, every focus stop visible, keyboard activation, busy ignores repeats.
 */
for (const id of ['c-button', 'c-icon-button']) {
  test(`${id}: axe and visible focus stops`, async ({ page }) => {
    await openSpecimen(page, id);
    await expectNoAxeViolations(page);
    await expectNoInvisibleFocusTargets(page);
  });
}

test('a busy button ignores repeat presses from the keyboard and the pointer', async ({ page }) => {
  await openSpecimen(page, 'c-button');
  const demo = page.locator('[data-probe="busy-demo"]');
  await demo.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-probe="presses"]')).toHaveText('Pressed 1');
  await expect(demo).toHaveAccessibleName('Giving access…');
  await expect(demo).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  // Playwright will not click an aria-disabled element unless forced; force sends a real click.
  await demo.click({ force: true });
  await expect(page.locator('[data-probe="presses"]')).toHaveText('Pressed 1');
  await expect(demo).toBeFocused();
});

test('an unavailable icon button stays focusable and named but does nothing', async ({ page }) => {
  await openSpecimen(page, 'c-icon-button');
  const up1 = page.getByRole('button', { name: 'Move question 1 up' });
  await up1.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-probe="moved"]')).toHaveText('Moved 0');
  await page.getByRole('button', { name: 'Move question 2 up' }).press('Enter');
  await expect(page.locator('[data-probe="moved"]')).toHaveText('Moved 1');
});

test('every button meets the 24 × 24 target minimum (WCAG 2.5.8; board 12 "Target size")', async ({
  page,
}) => {
  await openSpecimen(page, 'c-button');
  for (const box of await page
    .locator('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect()))) {
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(36);
  }
});
