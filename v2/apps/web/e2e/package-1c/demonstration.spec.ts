import { expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  ACCOUNT_LINES,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';
import { openInTab, sendRequest, statusHead } from './flow';

/**
 * The Package-1C demonstration (owner step 9), in ONE browser tab of the PRODUCT build — no test
 * hooks, no boot descriptor, nothing but the screens — at 1440, 1024, 768 and 375: the catalogue →
 * an experiment → Your selection → the request → REQ-0042 → its status (Submitted) → the Super
 * Admin signs in on the same tab, finds REQ-0042 on SA-02 and approves it on SA-03 (External: the
 * Super Admin's own choice) → signs out → the requester's status shows "Approved — payment
 * required" → PU-12 → "Continue to payment" (the TE-4 sample stand-in confirms in this local
 * prototype build) → Access active, ACC-0107. One document, one sample world (ADR-0004). The
 * requester's own address is opened through the app router, as a link would: no product page
 * lists a request (R01 open), and an address typed into the bar would start a fresh world.
 */

const card = (page: Page) => page.locator('.xp-auth-card');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

test('one tab, the product build: selection → request → status → Super Admin decision → payment → access', async ({
  page,
}) => {
  test.slow();
  // 1–5. The catalogue, the experiment, the selection, the request; the reference.
  await page.goto('/');
  const mark = await markDocument(page);
  const address = await sendRequest(page);
  await checkState(page, 'Request sent');
  await expect(page.locator('main')).toContainText('Your reference is REQ-0042.');

  // 6. Its status, from this browser session: Submitted.
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Submitted');
  await checkState(page, 'Request REQ-0042');

  // 7. The Super Admin signs in on this tab (the public header's Sign in, the real form).
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await reachAndClick(page, page.locator('header a.xp-signin'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name: 'Sign in' }));
  }
  await page.waitForURL('**/sign-in');
  await signIn(page, 'arjun.mehta@wilp.example');
  // His base is SA-01 Overview since Package 1D (before, the interim landing: Help).
  await page.waitForURL('**/admin');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  // Signed in as someone else, the requester's page shows nothing of the request (O-05).
  await openInTab(page, address);
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();

  // 8. SA-02: REQ-0042 is there, from the public request; SA-03: approve it, External.
  await openInTab(page, '/admin/help');
  // The shell is drawn before its drawer is opened (below 1024 px the sidebar is a drawer).
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await revealSidebar(page);
  await reachAndClick(page, page.locator('aside.xr-side nav a[href="/admin/requests"]'));
  await page.waitForURL('**/admin/requests');
  await reachAndClick(page, page.getByRole('link', { name: /^Open request REQ-0042,/ }));
  await page.waitForURL('**/admin/requests/REQ-0042');
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const dialog = page.getByRole('dialog', { name: 'Approve REQ-0042?' });
  await expect(dialog).toContainText(
    'Institutional access is not activated now. It is activated only after the payment is confirmed.',
  );
  await reachAndClick(page, dialog.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.xr-status')).toHaveText('Approved — payment required');

  // 9. Sign out.
  await page.getByRole('button', { name: ACCOUNT_LINES.super_admin, exact: true }).click();
  await page.locator('.xr-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');

  // 10. The requester's status, in the same browser session: approved, payment required.
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Approved — payment required');
  await expect(statusHead(page)).toContainText('Approved. Payment is needed before access starts.');
  await checkState(page, 'Request REQ-0042');

  // 11. PU-12 → Continue to payment: the sample stand-in confirms; access activates.
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await checkState(page, 'Pay for access');
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page)).toContainText('Access plan ACC-0107');
  await expect(page.locator('.xr-tl .xr-tl-what')).toHaveText([
    'Access active',
    'Payment confirmed',
    'Approved — payment needed',
    'Request submitted',
  ]);
  await checkState(page, 'Request REQ-0042');
  await expectSameDocument(page, mark);
});
