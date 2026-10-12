import { expect, test, type Page } from '@playwright/test';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import {
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  HarnessUnavailableError,
  reachAndClick,
} from '../support';

/**
 * SA-02 Requests — the DataTable sort and the B1-10 fix on the product route (BC13; START-HERE
 * Known exception 1; Appendix E §7.1 test 1; Appendix F WP-0.7 acceptance 5).
 *
 * DEFERRED TO PHASE 1. SA-02 is not built: WP-0.7 builds the shared DataTable only ("Not
 * included: SA-02 itself"), and the owner's WP-0.7 authorisation says not to build SA-02 to make
 * this test executable. Every test here is `fixme`, so Playwright reports it as skipped — never
 * as passed — and `openRequests` refuses, so removing the `fixme` early fails loudly. The
 * component-level proofs of the same behaviour run now on the specimen harness
 * (apps/specimens/e2e/datatable-sort.spec.ts).
 *
 * When SA-02 exists (Phase 1): boot its sample world with `bootWorld` (the Super Admin B1-10
 * draws, from the WP-0.11 world), open the route (screens.json proposes `/admin/requests`;
 * ADR-0005), and remove the `fixme`.
 */

const NEWEST = 'Received, newest first. Change order';
const OLDEST = 'Received, oldest first. Change order';
const SORT_NAME = /^Received, (?:newest|oldest) first\. Change order$/;
const LABELLED_ROWS = V46_CONTAINER_THRESHOLDS.labelledRows.px;

/**
 * Phase 1 opens SA-02 as the sample Super Admin here (`bootWorld` on the test's page, then the
 * route) and takes the page as its argument. SA-02 and its sample world are not built, so it
 * refuses before touching any page.
 */
async function openRequests(): Promise<void> {
  throw new HarnessUnavailableError(
    'openRequests (SA-02)',
    'SA-02 Requests is built in Phase 1 (Appendix F WP-0.7 "Not included: SA-02 itself").',
  );
}

/** Classic scrollbars narrow the app (R-20): a boundary is only checked at its real width. */
async function expectAppIsViewport(page: Page, width: number): Promise<void> {
  const measured = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    app: document.querySelector('.xr-app')?.getBoundingClientRect().width ?? 0,
  }));
  expect(measured).toEqual({ viewport: width, app: width });
}

const contentWidth = (page: Page) =>
  page.locator('main .xr-content').evaluate((element) => element.getBoundingClientRect().width);

/**
 * Appendix E §7.1 test 1, items 1–4, at one viewport: no invisible Tab stop; one visible
 * control named /Received/ (above the first row below 760 px of content); activating it
 * reverses the rows and flips `aria-sort`; at 760 px and more the header button shows and the
 * sort bar is not displayed; axe is clean.
 */
async function expectSortOnRoute(page: Page): Promise<void> {
  const labelled = (await contentWidth(page)) < LABELLED_ROWS;
  const stops = await expectNoInvisibleFocusTargets(page);
  expect(stops.filter((stop) => SORT_NAME.test(stop.element.split('"')[1] ?? ''))).toHaveLength(1);
  const control = page.getByRole('button', { name: SORT_NAME });
  await expect(control).toHaveCount(1);
  await expect(control).toHaveAccessibleName(NEWEST);
  if (labelled) {
    const bar = page.locator('.xr-toolbar-status .xr-x-table-sortbar');
    await expect(bar).toBeVisible();
    await expect(page.locator('th[aria-sort] > .xr-x-th-sort')).toBeHidden();
    // Above the first row.
    const [barBox, rowBox] = [
      await bar.boundingBox(),
      await page.locator('table.xr-table tbody tr').first().boundingBox(),
    ];
    expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(rowBox!.y);
  } else {
    await expect(page.locator('th[aria-sort] > .xr-x-th-sort')).toBeVisible();
    await expect(page.locator('.xr-x-table-sortbar')).toBeHidden();
  }
  const first = page.locator('table.xr-table tbody td.is-primary a').first();
  const before = await first.textContent();
  await reachAndClick(page, control);
  await expect(first).not.toHaveText(before ?? '');
  await expect(page.locator('th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
  await expect(control).toHaveAccessibleName(OLDEST);
  await expectNoAxeViolations(page);
}

test.describe.fixme('SA-02 Requests: DataTable sort on the route (Phase 1; deferred)', () => {
  for (const { width, height, expanded } of [
    { width: 375, height: 812, expanded: false },
    { width: 768, height: 1024, expanded: false },
    { width: 1024, height: 768, expanded: true },
    { width: 1440, height: 900, expanded: false },
  ]) {
    test(`${width}×${height}${expanded ? ', sidebar expanded' : ''}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openRequests();
      if (expanded) await page.getByRole('button', { name: 'Expand menu' }).click();
      await expectAppIsViewport(page, width);
      await expectSortOnRoute(page);
    });
  }

  for (const { width, expanded, labelled } of [
    { width: 807, expanded: false, labelled: true },
    { width: 808, expanded: false, labelled: false },
    { width: 1071, expanded: true, labelled: true },
    { width: 1072, expanded: true, labelled: false },
  ]) {
    test(`app width ${width}${expanded ? ', sidebar expanded' : ''}: ${labelled ? 'the sort bar' : 'the header button'}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await openRequests();
      if (expanded) await page.getByRole('button', { name: 'Expand menu' }).click();
      await expectAppIsViewport(page, width);
      expect(await contentWidth(page)).toBe(labelled ? 759 : 760);
      await expectSortOnRoute(page);
    });
  }
});
