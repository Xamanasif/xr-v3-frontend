import { expect, test, type Page } from '@playwright/test';

import {
  bootWorld,
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  reachAndClick,
  TEST_HOOKS_URL,
} from '../support';

/**
 * SA-02 Requests — the record table's sort on the product route, in the V3 design (the Super Admin
 * export `sa-views-a.js` `V.requests`; kit RecordTable and SortBar, V3P-02). Written in WP-0.7 for
 * the B1-10 fix (BC13; START-HERE Known exception 1; Appendix E §7.1 test 1): exactly one sort
 * control is displayed at any width — the Received head's button while the table shows its head,
 * the sort bar in the status line where the table's narrow layouts hide it (below 880 px of table)
 * — and it reverses the rows and `aria-sort`. The page is the Super Admin's Requests on the
 * spine-start sample world, reached through the CI-only boot descriptor.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const BAR_NAME = /^Sort: (?:received, )?(?:newest|oldest) first ?\. Change order$/;
/** The table's head is hidden below this width of the table (rb-kit.css `@container rktable`). */
const HEAD_FROM = 880;

/** SA-02 as the sample Super Admin (Arjun Mehta), its rows listed. */
async function openRequests(page: Page): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: { personId: 'sa-arjun-mehta' } });
  await page.goto('/admin/requests');
  await expect(page.locator('table.rk-table a.rk-rowlink').first()).toBeVisible();
}

/** Classic scrollbars narrow the page (R-20): a boundary is only checked at its real width. */
async function expectPageIsViewport(page: Page, width: number): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(width);
}

const tableWidth = (page: Page) =>
  page.locator('main .rk-tablewrap').evaluate((element) => element.clientWidth);

const firstRow = (page: Page) => page.locator('table.rk-table tbody a.rk-rowlink').first();

/**
 * Appendix E §7.1 test 1, at one viewport: no invisible Tab stop; one displayed control that sorts
 * by Received (the sort bar above the first row where the head is hidden); activating it reverses
 * the rows and flips `aria-sort`; axe is clean.
 */
async function expectSortOnRoute(page: Page): Promise<void> {
  const headShown = (await tableWidth(page)) >= HEAD_FROM;
  const stops = await expectNoInvisibleFocusTargets(page);
  // One Tab stop sorts by Received (a stop is described by its name, or else its whole text).
  expect(stops.filter((stop) => stop.element.endsWith('. Change order"'))).toHaveLength(1);
  const head = page.locator('th[aria-sort] button');
  const bar = page.locator('main .rk-statusline .rk-sortbar button');
  const control = headShown ? head : bar;
  await expect(control).toBeVisible();
  await expect(headShown ? bar : head).toBeHidden();
  await expect(control).toHaveAccessibleName(
    headShown ? 'Received, newest first. Change order' : BAR_NAME,
  );
  await expect(control).toHaveAccessibleName(/newest first/);
  if (!headShown) {
    // Above the first row.
    const [barBox, rowBox] = [
      await bar.boundingBox(),
      await page.locator('table.rk-table tbody tr').first().boundingBox(),
    ];
    expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(rowBox!.y);
  }
  const before = await firstRow(page).getAttribute('href');
  await reachAndClick(page, control);
  await expect(firstRow(page)).not.toHaveAttribute('href', before ?? '');
  await expect(page.locator('th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
  await expect(control).toHaveAccessibleName(/oldest first/);
  await expect(page.locator('main table caption')).toHaveText(
    'Institutional access requests, received, oldest first',
  );
  await expectNoAxeViolations(page);
}

test.describe('SA-02 Requests: the record table’s sort on the route (V3)', () => {
  for (const { width, height } of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    test(`${width}×${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openRequests(page);
      await expectPageIsViewport(page, width);
      await expectSortOnRoute(page);
    });
  }

  // The head shows from 880 px of table: with the Menu drawer (below 1024 px of page) the table is
  // the page less 66 px; with the rail, less 314 px.
  for (const { width, headShown } of [
    { width: 945, headShown: false },
    { width: 946, headShown: true },
    { width: 1193, headShown: false },
    { width: 1194, headShown: true },
  ]) {
    test(`page width ${width}: ${headShown ? 'the head’s button' : 'the sort bar'}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openRequests(page);
      await expectPageIsViewport(page, width);
      expect(await tableWidth(page)).toBe(headShown ? HEAD_FROM : HEAD_FROM - 1);
      await expectSortOnRoute(page);
    });
  }
});
