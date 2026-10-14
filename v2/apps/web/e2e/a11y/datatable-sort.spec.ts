import { expect, test, type Page } from '@playwright/test';
import { V46_CONTAINER_THRESHOLDS } from '@xr/ui';

import {
  bootWorld,
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  reachAndClick,
  TEST_HOOKS_URL,
} from '../support';

/**
 * SA-02 Requests — the DataTable sort and the B1-10 fix on the product route (BC13; START-HERE
 * Known exception 1; Appendix E §7.1 test 1; Appendix F WP-0.7 acceptance 5).
 *
 * Written in WP-0.7 as `fixme` until SA-02 existed; Phase-1 Package 1A builds SA-02 and turns it
 * on. The page is the Super Admin's Requests on the spine-start sample world, reached through the
 * CI-only boot descriptor (the sign-in itself is proven in `e2e/package-1a/sign-in.spec.ts`).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const NEWEST = 'Received, newest first. Change order';
const OLDEST = 'Received, oldest first. Change order';
const SORT_NAME = /^Received, (?:newest|oldest) first\. Change order$/;
const LABELLED_ROWS = V46_CONTAINER_THRESHOLDS.labelledRows.px;

/** SA-02 as the sample Super Admin (Arjun Mehta), its rows listed. */
async function openRequests(page: Page): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: { personId: 'sa-arjun-mehta' } });
  await page.goto('/admin/requests');
  await expect(page.locator('table.xr-table tbody td.is-primary a').first()).toBeVisible();
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

test.describe('SA-02 Requests: DataTable sort on the route (Package 1A)', () => {
  for (const { width, height, expanded } of [
    { width: 375, height: 812, expanded: false },
    { width: 768, height: 1024, expanded: false },
    { width: 1024, height: 768, expanded: true },
    { width: 1440, height: 900, expanded: false },
  ]) {
    test(`${width}×${height}${expanded ? ', sidebar expanded' : ''}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openRequests(page);
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
      await openRequests(page);
      if (expanded) await page.getByRole('button', { name: 'Expand menu' }).click();
      await expectAppIsViewport(page, width);
      expect(await contentWidth(page)).toBe(labelled ? 759 : 760);
      await expectSortOnRoute(page);
    });
  }
});
