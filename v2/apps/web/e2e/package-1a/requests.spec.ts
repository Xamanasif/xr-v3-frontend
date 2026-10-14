import { expect, type Page, test } from '@playwright/test';

import { bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-02 Requests (board B1-10) on the spine-start sample world, as the Super Admin, at 1440,
 * 1024, 768 and 375 (Phase-1 Package 1A): the list, search, Status, Type, More filters and their
 * chips, no match, the count, the sidebar count, and the reference opening SA-03 client-side.
 * The sort and the B1-10 fix on this route are `e2e/a11y/datatable-sort.spec.ts`.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function openRequests(page: Page): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: { personId: 'sa-arjun-mehta' } });
  await page.goto('/admin/requests');
  await expect(page.locator('table.xr-table tbody td.is-primary a').first()).toBeVisible();
}

const references = (page: Page) => page.locator('table.xr-table tbody td.is-primary a');

/** Type is in the toolbar from 600 px of content, inside More filters below (B1-10 f8, f9). */
async function typeSelect(page: Page) {
  const inToolbar = page.locator('.xr-toolbar .xr-filter-2 select');
  if (await inToolbar.isVisible()) return inToolbar;
  const more = page.getByRole('button', { name: /^More filters/ });
  if ((await more.getAttribute('aria-expanded')) !== 'true') await reachAndClick(page, more);
  return page.locator('.xp-morefilters .xp-morefilters-type select');
}

test('the list (B1-10 f0): ten seeded requests, newest first, B1-10’s words', async ({ page }) => {
  await openRequests(page);
  await checkState(page, 'Requests');
  await expect(page).toHaveTitle('Requests · XR Learning Platform');
  await expect(references(page)).toHaveText([
    'REQ-0041',
    'REQ-0040',
    'REQ-0038',
    'REQ-0039',
    'REQ-0037',
    'REQ-0036',
    'REQ-0033',
    'REQ-0031',
    'REQ-0027',
    'REQ-0029',
  ]);
  await expect(page.locator('.xr-toolbar-status [role="status"]')).toHaveText('10 requests');
  // The sidebar: Requests current, with its count in words (2 under review in this world).
  const requests = page.locator('aside.xr-side nav a[href="/admin/requests"]');
  await expect(requests).toHaveAttribute('aria-current', 'page');
  await expect(requests.locator('.xr-count .xr-sr')).toHaveText(', 2 requests under review');
  await expect(page.locator('body')).not.toContainText(/Declin/);
});

test('Status: Under review — the chip, the count, and Clear filters', async ({ page }) => {
  await openRequests(page);
  await page.getByLabel('Status').selectOption({ label: 'Under review' });
  await expect(references(page)).toHaveText(['REQ-0040', 'REQ-0038']);
  await expect(page.locator('.xr-toolbar-status [role="status"]')).toHaveText('2 of 10 requests');
  await checkState(page, 'Requests');
  await reachAndClick(page, page.getByRole('button', { name: 'Remove Status: Under review' }));
  await expect(references(page)).toHaveCount(10);
  // Focus is not lost with the removed chip.
  await expect(page.locator('body')).not.toBeFocused();
});

test('search, then no match (f4): one way back', async ({ page }) => {
  await openRequests(page);
  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.fill('menon');
  await expect(references(page)).toHaveText(['REQ-0038', 'REQ-0039']);
  await search.fill('Narmada');
  await expect(
    page.getByRole('heading', { name: 'No requests match these filters' }),
  ).toBeVisible();
  await checkState(page, 'Requests');
  await reachAndClick(
    page,
    page.locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
  );
  await expect(references(page)).toHaveCount(10);
  await expect(search).toHaveValue('');
});

test('More filters (f1, f9): Type and Internal or external, counted on the button', async ({
  page,
}) => {
  await openRequests(page);
  const type = await typeSelect(page);
  await type.selectOption({ label: 'Additional licences' });
  await expect(references(page)).toHaveText(['REQ-0040', 'REQ-0036']);
  const more = page.getByRole('button', { name: /^More filters/ });
  if ((await more.getAttribute('aria-expanded')) !== 'true') await reachAndClick(page, more);
  const panel = page.getByRole('group', { name: 'More filters' });
  await panel.getByLabel('Internal or external').selectOption({ label: 'Not set yet' });
  await expect(
    page.getByRole('heading', { name: 'No requests match these filters' }),
  ).toBeVisible();
  await panel.getByLabel('Internal or external').selectOption({ label: 'External' });
  await expect(references(page)).toHaveText(['REQ-0040', 'REQ-0036']);
  await expect(page.getByRole('button', { name: 'More filters (1)' })).toBeVisible();
  await expect(page.locator('.xr-fchip')).toHaveText([
    'Type: Additional licences',
    'Internal or external: External',
  ]);
  await checkState(page, 'Requests');
});

test('a reference opens its decision client-side: same document, same world', async ({ page }) => {
  await openRequests(page);
  const mark = await markDocument(page);
  const before = await inspectWorld(page);
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open request REQ-0040, Konark Polytechnic' }),
  );
  await page.waitForURL('**/admin/requests/REQ-0040');
  await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible();
  await expectSameDocument(page, mark);
  await expect(page.locator('main.xr-page#main')).toBeFocused();
  const after = await inspectWorld(page);
  expect(after.instance).toBe(before.instance);
  // Opening the decision wrote nothing (AD-14 / P1-04: no review start on open).
  expect(after.worldVersion).toBe(before.worldVersion);
});
