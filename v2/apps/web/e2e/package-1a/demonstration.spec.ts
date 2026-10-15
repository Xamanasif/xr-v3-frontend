import { expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { ACCOUNT_LINES, expectSameDocument, markDocument } from '../support/workspace';

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

const rows = (page: Page) => page.locator('table.xr-table tbody td.is-primary a');
const card = (page: Page) => page.locator('.xp-auth-card');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xr-menu').getByRole('button', { name: 'Sign out' }).click();
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
  await expect(card(page).getByText('Enter your e-mail address')).toBeVisible();
  await expect(card(page).getByText('Enter your password')).toBeVisible();
  await card(page).getByLabel('E-mail', { exact: true }).fill('arjun.mehta');
  await card(page).locator('#sign-in-password').fill('x');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
  await expect(
    card(page).getByText('Enter an e-mail address like name@institution.edu'),
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
  await expect(rows(page)).toHaveText(['REQ-0040', 'REQ-0031']);
  await search.fill('');
  await page.getByLabel('Status').selectOption({ label: 'Under review' });
  await expect(rows(page)).toHaveText(['REQ-0040', 'REQ-0038']);
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Received, newest first. Change order' }),
  );
  await expect(rows(page)).toHaveText(['REQ-0038', 'REQ-0040']);
  await reachAndClick(page, page.getByRole('button', { name: 'Remove Status: Under review' }));
  await expect(rows(page)).toHaveCount(10);

  // 8. REQ-0038 (renewal): approve and request information are offered, a smaller scope is not.
  await reachAndClick(page, page.getByRole('link', { name: /^Open request REQ-0038,/ }));
  await page.waitForURL('**/admin/requests/REQ-0038');
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await expect(panel.getByRole('radio', { name: /Approve request/ })).toBeEnabled();
  await expect(panel.getByRole('radio', { name: /Request more information/ })).toBeEnabled();
  await expect(panel.getByRole('radio', { name: /Approve a smaller scope/ })).toBeDisabled();
  await reachAndClick(page, page.locator('main a.xr-back'));
  await page.waitForURL('**/admin/requests');
  //    REQ-0040 (more licences): every decision is offered; its route is already External.
  await reachAndClick(page, page.getByRole('link', { name: /^Open request REQ-0040,/ }));
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
  await expect(panel.locator('.xr-status')).toHaveText('Information requested');
  await reachAndClick(page, panel.getByRole('link', { name: 'Back to requests' }));
  await page.waitForURL('**/admin/requests');
  const row40 = page.locator('table.xr-table tbody tr', { hasText: 'REQ-0040' });
  await expect(row40.locator('.xr-status')).toHaveText('Information requested');
  await expect(
    page.locator('aside.xr-side nav a[href="/admin/requests"] .xr-count .xr-sr'),
  ).toHaveText(', 1 requests under review');
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
  await expect(page.locator('aside.xr-side .xr-ws-label')).toHaveText('Super Admin');
  await expectSameDocument(page, mark);

  // 11. Sign out: the signed-out card.
  await signOut(page, ACCOUNT_LINES.super_admin);
  await expectSameDocument(page, mark);

  // 12. Kavya Nair: the Content Manager shell (Help only — no Super Admin destination), and the
  //     Super Admin's Requests are not hers.
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL('**/content-manager/help');
  await expect(page.locator('aside.xr-side .xr-ws-label')).toHaveText('Content Manager');
  await expect(page.locator('aside.xr-side nav')).toHaveCount(0);
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
  await reachAndClick(page, page.locator('aside.xr-side nav a[href="/admin/requests"]'));
  await page.waitForURL('**/admin/requests');
  await expect(
    page.locator('table.xr-table tbody tr', { hasText: 'REQ-0040' }).locator('.xr-status'),
  ).toHaveText('Information requested');
  await expectSameDocument(page, mark);
});
