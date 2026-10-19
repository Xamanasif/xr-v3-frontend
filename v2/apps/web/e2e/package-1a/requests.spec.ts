import { expect, type Page, test } from '@playwright/test';

import { bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar, sidebarLink } from '../support/workspace';

/**
 * SA-02 Requests in the V3 design (the Super Admin export `sa-views-a.js` `V.requests`) on the
 * spine-start sample world, as the Super Admin, at 1440, 1024, 768 and 375: the list, search,
 * Status, Type, More filters and their chips, no match, the count, the rail count, and a row
 * opening SA-03 client-side — by its link, named by its institution, or by a press anywhere on the
 * row. The sort on this route is `e2e/a11y/datatable-sort.spec.ts`.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function openRequests(page: Page): Promise<void> {
  await bootWorld(page, { fixture: 'spine-start', session: { personId: 'sa-arjun-mehta' } });
  await page.goto('/admin/requests');
  await expect(page.locator('table.rk-table a.rk-rowlink').first()).toBeVisible();
}

const rowLinks = (page: Page) => page.locator('table.rk-table tbody a.rk-rowlink');
const count = (page: Page) => page.locator('main .rk-count[role="status"]');

/** Each row's request, read from where its link goes (the reference is never shown). */
async function references(page: Page): Promise<string[]> {
  return (
    await rowLinks(page).evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  ).map((href) => href!.split('/').at(-1)!);
}

/** Type is in the toolbar from 600 px of toolbar, inside More filters below. */
async function typeSelect(page: Page) {
  const inToolbar = page.locator('main .rk-tools select#rq-type');
  if (await inToolbar.isVisible()) return inToolbar;
  const more = page.getByRole('button', { name: /^More filters/ });
  if ((await more.getAttribute('aria-expanded')) !== 'true') await reachAndClick(page, more);
  return page.locator('main .rk-more select#rq-type-more');
}

test('the list: ten seeded requests, newest first, the export’s words', async ({ page }) => {
  await openRequests(page);
  await checkState(page, 'Requests');
  await expect(page).toHaveTitle('Requests · XR Learning Platform');
  expect(await references(page)).toEqual([
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
  await expect(rowLinks(page).first()).toHaveText('Krishna College of Engineering');
  await expect(count(page)).toHaveText('10 requests');
  // No internal reference is shown or names a control.
  await expect(page.locator('main')).not.toContainText(/\bREQ-\d/);
  // The rail: Requests current, with its count in words (2 under review in this world).
  await revealSidebar(page);
  const requests = sidebarLink(page, '/admin/requests');
  await expect(requests).toHaveAttribute('aria-current', 'page');
  await expect(requests.locator('.rb-count .xr-sr')).toHaveText(', 2 requests under review');
  await expect(page.locator('body')).not.toContainText(/Declin/);
});

test('Status: Under review — the chip, the count, and Clear filters', async ({ page }) => {
  await openRequests(page);
  await page.getByLabel('Status').selectOption({ label: 'Under review' });
  await expect.poll(() => references(page)).toEqual(['REQ-0040', 'REQ-0038']);
  await expect(count(page)).toHaveText('2 of 10 requests');
  await checkState(page, 'Requests');
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Remove filter Status: Under review' }),
  );
  await expect(rowLinks(page)).toHaveCount(10);
  // Focus is not lost with the removed chip: it goes back to the search field.
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeFocused();
});

test('search, then no match: one way back', async ({ page }) => {
  await openRequests(page);
  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.fill('menon');
  await expect.poll(() => references(page)).toEqual(['REQ-0038', 'REQ-0039']);
  await search.fill('Narmada');
  await expect(page.getByText('No requests match these filters')).toBeVisible();
  await expect(count(page)).toHaveText('0 of 10 requests');
  await expect(page.locator('main .rk-chip')).toHaveText('Search: “Narmada”');
  await checkState(page, 'Requests');
  await reachAndClick(
    page,
    page.locator('main .rk-state').getByRole('button', { name: 'Clear filters' }),
  );
  await expect(rowLinks(page)).toHaveCount(10);
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
});

test('More filters: Type and Internal or external, counted on the button', async ({ page }) => {
  await openRequests(page);
  const type = await typeSelect(page);
  await type.selectOption({ label: 'Additional licences' });
  await expect.poll(() => references(page)).toEqual(['REQ-0040', 'REQ-0036']);
  const more = page.getByRole('button', { name: /^More filters/ });
  if ((await more.getAttribute('aria-expanded')) !== 'true') await reachAndClick(page, more);
  const panel = page.locator('main #rq-more');
  await panel.getByLabel('Internal or external').selectOption({ label: 'Not set yet' });
  await expect(page.getByText('No requests match these filters')).toBeVisible();
  await panel.getByLabel('Internal or external').selectOption({ label: 'External' });
  await expect.poll(() => references(page)).toEqual(['REQ-0040', 'REQ-0036']);
  // The button counts what More filters holds (Type too, where it has moved there).
  await expect(page.getByRole('button', { name: /^More filters ?, [12] applied$/ })).toBeVisible();
  await expect(page.locator('main .rk-chip')).toHaveText([
    'Type: Additional licences',
    'Internal or external: External',
  ]);
  await checkState(page, 'Requests');
});

test('a row opens its decision client-side: same document, same world', async ({ page }) => {
  await openRequests(page);
  const mark = await markDocument(page);
  const before = await inspectWorld(page);
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: 'Konark Polytechnic, additional licences, received 29 Sep 2026, Under review. Open the request',
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0040');
  const title = page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' });
  await expect(title).toBeVisible();
  await expectSameDocument(page, mark);
  // Route focus: the page's main content — its H1 where the page has drawn it by then (the
  // decision loads after the move).
  await expect
    .poll(() =>
      page.evaluate(
        () => document.activeElement?.matches('main#main, main#main h1[tabindex="-1"]') ?? false,
      ),
    )
    .toBe(true);
  const after = await inspectWorld(page);
  expect(after.instance).toBe(before.instance);
  // Opening the decision wrote nothing (AD-14 / P1-04: no review start on open).
  expect(after.worldVersion).toBe(before.worldVersion);
});

test('a press anywhere on a row opens it, as its link does', async ({ page }) => {
  await openRequests(page);
  const mark = await markDocument(page);
  const row = page.locator('table.rk-table tbody tr').filter({ hasText: 'Krishna College' });
  await reachAndClick(page, row.locator('td.rk-c-exp'));
  await page.waitForURL('**/admin/requests/REQ-0041');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Krishna College of Engineering' }),
  ).toBeVisible();
  await expectSameDocument(page, mark);
});
