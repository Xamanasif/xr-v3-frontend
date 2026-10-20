import { expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { ACCOUNT_LINES, expectSameDocument, markDocument, sidebarLink } from '../support/workspace';

/**
 * The Package-1A demonstration, in ONE browser tab of the PRODUCT build (no test hooks, no boot
 * descriptor, nothing but the screens): signed out → sign-in with the return address → the
 * card's validation and institution sign-in states → Arjun Mehta → SA-02 search, filter, sort →
 * REQ-0038 and REQ-0040 → a permitted decision changes the shared world → another workspace's
 * address is "Not your workspace" → sign out → Kavya Nair's Content Manager shell — and back to
 * Arjun to see the same world. Every move after the first load is client-side: one document, one
 * sample world (ADR-0004). An address typed into the bar would load a new document and start a
 * fresh world, so the one address outside the screens' own links (step 10) is opened through the
 * app router, as a link would.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'One journey, at the board width.');

// The Super Admin's V3 requests table (SA-v1) names each row by its institution and never shows
// the request's reference: rows are told apart by the address each opens.
const rows = (page: Page) => page.locator('main table.rk-table tbody a.rk-rowlink');
const rowIds = (page: Page) =>
  rows(page).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')!.split('/').pop()!),
  );
const requestRow = (page: Page, id: string) =>
  page.locator('main table.rk-table tbody tr', {
    has: page.locator(`a[href="/admin/requests/${id}"]`),
  });
const card = (page: Page) => page.locator('.xs-card');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
  await expect(card(page).getByText('You’re signed out')).toBeVisible();
}

test('one tab, the product build: sign-in, requests, a decision, sign-out, another role', async ({
  page,
}) => {
  // 1–2. Signed out, the protected address leads to sign-in with its return address.
  await page.goto('/admin/requests');
  await page.waitForURL('**/sign-in?returnTo=%2Fadmin%2Frequests');
  const mark = await markDocument(page);
  await expect(card(page).getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();

  // 3. Required fields, then an e-mail that is not one.
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
  await expect(
    card(page).locator('.rk-ferr', { hasText: 'Enter your e-mail address' }),
  ).toBeVisible();
  await expect(card(page).locator('.rk-ferr', { hasText: 'Enter your password' })).toBeVisible();
  await card(page).getByLabel('E-mail', { exact: true }).fill('arjun.mehta');
  await card(page).locator('#sign-in-password').fill('x');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
  await expect(
    card(page).locator('.rk-ferr', {
      hasText: 'Enter an e-mail address like name@institution.edu',
    }),
  ).toBeVisible();

  // 4. Institution sign-in: the documented unavailable state (T-10 open).
  await reachAndClick(
    page,
    card(page).getByRole('button', { name: 'Sign in with your institution' }),
  );
  await expect(card(page).getByText('Institution sign-in isn’t available right now')).toBeVisible();

  // 5–6. Arjun Mehta, back to the Requests he asked for.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin/requests');
  await expect(page.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
  await expect(rows(page)).toHaveCount(10);
  await expectSameDocument(page, mark);

  // 7. Search, filter and sort.
  const search = page.getByRole('searchbox', { name: 'Search' });
  await search.fill('konark');
  await expect.poll(() => rowIds(page)).toEqual(['REQ-0040', 'REQ-0031']);
  await search.fill('');
  await page.getByLabel('Status').selectOption({ label: 'Under review' });
  await expect.poll(() => rowIds(page)).toEqual(['REQ-0040', 'REQ-0038']);
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Received, newest first. Change order' }),
  );
  await expect.poll(() => rowIds(page)).toEqual(['REQ-0038', 'REQ-0040']);
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Remove filter Status: Under review' }),
  );
  await expect(rows(page)).toHaveCount(10);

  // 8. REQ-0038 (renewal): approve and request information are offered, a smaller scope is not.
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: /^BITS Pilani — Hyderabad Campus, renewal, .*Open the request$/,
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0038');
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await expect(panel.getByRole('radio', { name: /Approve request/ })).toBeEnabled();
  await expect(panel.getByRole('radio', { name: /Request more information/ })).toBeEnabled();
  await expect(panel.getByRole('radio', { name: /Approve a smaller scope/ })).toBeDisabled();
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Requests' }),
  );
  await page.waitForURL('**/admin/requests');
  //    REQ-0040 (more licences): every decision is offered; its route is already External.
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: /^Konark Polytechnic, additional licences, .*Open the request$/,
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0040');
  for (const decision of [
    /Approve request/,
    /Approve a smaller scope/,
    /Request more information/,
  ]) {
    await expect(panel.getByRole('radio', { name: decision })).toBeEnabled();
  }

  // 9. A permitted decision: request more information on REQ-0040.
  await reachAndClick(page, panel.locator('label[for="decision-info"]'));
  await panel
    .getByLabel('What do you need from the requester? (required)')
    .fill('Please confirm the size of the second section.');
  await reachAndClick(page, panel.getByRole('button', { name: 'Send request for information' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Information requested');
  await reachAndClick(page, panel.getByRole('link', { name: 'Back to requests' }));
  await page.waitForURL('**/admin/requests');
  await expect(requestRow(page, 'REQ-0040').locator('.xr-st')).toHaveText('Information requested');
  // The Super Admin's V3 rail (SA-v1) counts in the singular too.
  await expect(
    page.locator('aside.rb-rail .rb-nav a[href="/admin/requests"] .rb-count .xr-sr'),
  ).toHaveText(', 1 request under review');
  await expectSameDocument(page, mark);

  // 10. Another workspace's address: "Not your workspace", in Arjun's own shell.
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/student/help',
    );
  });
  await page.waitForURL('**/student/help');
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
  await expect(page.locator('aside.rb-rail .rb-ws-role')).toHaveText('Super Admin');
  await expectSameDocument(page, mark);

  // 11. Sign out: the signed-out card.
  await signOut(page, ACCOUNT_LINES.super_admin);
  await expectSameDocument(page, mark);

  // 12. Kavya Nair: the Content Manager shell (her own destinations — CM-01 Overview is her home
  //     since Phase 5, Updates since Phase 6 — no Super Admin destination), and the Super Admin's
  //     Requests are not hers.
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  // The Content Manager's V3 rail (CM-v1).
  await expect(page.locator('aside.rb-rail .rb-ws-role')).toHaveText('Content Manager');
  expect(
    await page
      .locator('aside.rb-rail nav[aria-label="Content Manager navigation"] a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual([
    '/content-manager',
    '/content-manager/ready',
    '/content-manager/library',
    '/content-manager/updates',
    '/content-manager/course-codes',
  ]);
  await expect(page.locator('main')).not.toContainText(/REQ-00|Konark/);
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/admin/requests',
    );
  });
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toContainText('REQ-0040');
  await expectSameDocument(page, mark);

  // And the same world: Arjun again sees the decision he recorded before signing out.
  await signOut(page, ACCOUNT_LINES.content_manager);
  await signIn(page, 'arjun.mehta@wilp.example');
  // His base is SA-01 Overview since Package 1D.
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await reachAndClick(page, sidebarLink(page, '/admin/requests'));
  await page.waitForURL('**/admin/requests');
  await expect(requestRow(page, 'REQ-0040').locator('.xr-st')).toHaveText('Information requested');
  await expectSameDocument(page, mark);
});
