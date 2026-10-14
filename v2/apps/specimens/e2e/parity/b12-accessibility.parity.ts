import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { expect, test } from './support';

/**
 * Board 12 "Accessibility and motion" against SkipLink (WP-0.15). The board draws the skip link
 * shown and focused with static classes (`.is-shown.is-focus`); the product link appears on real
 * keyboard focus (Tab from the top of the page). The rest of board 12 is documentation — measured
 * contrast, keyboard patterns, target sizes, reduced motion — plus the 1–5 rating scale, a
 * Phase-3 component (format feedback); none of it has a Phase-0 product component to compare.
 */
test('board 12 · skip link on keyboard focus', async ({ page, openBoardPage }, testInfo) => {
  const { page: board } = await openBoardPage('12-Accessibility-Motion.dc.html');
  await page.goto('/p-12-skip-link');
  await page.keyboard.press('Tab');
  const ours = page.locator('[data-parity="skip-link"] .xr-skip');
  await expect(ours).toBeFocused();
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: [
      {
        name: '12-skip-link-focused',
        reference: board.locator('.xr-skip'),
        product: ours,
        margin: 4,
      },
    ],
  });
});
