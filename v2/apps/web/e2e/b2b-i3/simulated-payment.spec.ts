import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  planPayment,
  reachAndClick,
  TEST_HOOKS_URL,
} from '../support';
import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { smallTargets } from '../support/screen-checks';
import { expectSameDocument, markDocument, SUPER_ADMIN } from '../support/workspace';

/**
 * B2B milestone I3 (owner decisions DP-05, DP-06, DP-07, DP-13) at 1440, 1024, 768 and 375 on the
 * test-hook build (a local development build, whose TE-4 stand-in confirms a payment as it starts;
 * `planPayment('pending')` leaves one waiting, as the prototype profile always does): a payment left
 * unconfirmed is found in the prototype tools and answered on the simulated provider's page — it
 * fails, the payer tries again, it is left waiting again and then completed — and the request's
 * history keeps every attempt. The support pages pass the prototype page checks.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function checkSupportPage(page: Page, heading: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expectNoAxeViolations(page);
  expect((await expectNoInvisibleFocusTargets(page)).length).toBeGreaterThan(0);
  expect(await smallTargets(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

/** In-document navigation: the tab's world lives in the page (a reload would start a new one). */
async function push(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
  await page.waitForURL((url) => url.pathname === href.split('?')[0], { timeout: 60_000 });
}

/** PU-12 → Continue to payment, with the stand-in told to leave the payment waiting. */
async function payLeavingItWaiting(page: Page, address: string, link: string): Promise<void> {
  await planPayment(page, 'pending');
  await reachAndClick(page, statusHead(page).getByRole('link', { name: link }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Payment not confirmed yet');
}

/** The prototype tools list the waiting payment; "Choose the outcome" opens the provider page. */
async function chooseFromTools(page: Page, routeId: string): Promise<void> {
  await push(page, '/prototype');
  await checkSupportPage(page, 'Prototype tools');
  const choose = page.getByRole('link', { name: 'Choose the outcome' });
  await expect(choose).toHaveAttribute('href', `/prototype/payment?request=${routeId}`);
  await reachAndClick(page, choose);
  await page.waitForURL((url) => url.pathname === '/prototype/payment');
  await checkSupportPage(page, 'Simulated payment');
  await expect(page.locator('main')).toContainText(
    'No money moves and no payment details are asked for.',
  );
  await expect(page.locator('main')).not.toContainText(/₹|INR|amount|card|UPI|GST|price/i);
}

test('a waiting payment is answered from the prototype tools: it fails, is tried again, then completes', async ({
  page,
}) => {
  test.slow();
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto('/');
  const mark = await markDocument(page);
  const address = await sendRequest(page);
  const routeId = address.split('/').pop()!;
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  const opened = await actAs<{ value: { request: { rev: number } } }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  const approved = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'approveRequest',
    input: { id: 'REQ-0042', route: 'external', expectedRev: opened.value.request.rev },
  });
  expect(approved.ok).toBe(true);
  await expect(statusHead(page)).toContainText('Approved — payment required');

  // Left waiting; answered later from the tools: Make the payment fail.
  await payLeavingItWaiting(page, address, 'Continue to payment');
  await chooseFromTools(page, routeId);
  await reachAndClick(page, page.getByRole('button', { name: 'Make the payment fail' }));
  await page.waitForURL((url) => url.pathname === address);
  await expect(statusHead(page)).toContainText('Payment failed');
  await expect(statusHead(page)).toContainText('Nothing has been activated.');

  // Try payment again; left waiting again; then Complete the payment.
  await payLeavingItWaiting(page, address, 'Try payment again');
  await chooseFromTools(page, routeId);
  await reachAndClick(page, page.getByRole('button', { name: 'Complete the payment' }));
  await page.waitForURL((url) => url.pathname === address);
  await expect(statusHead(page)).toContainText('Access active');
  await expect(page.locator('.xr-tl .xr-tl-what')).toHaveText([
    'Access active',
    'Payment confirmed',
    'Payment not completed',
    'Approved — payment needed',
    'Request submitted',
  ]);

  // Nothing waits any more; the provider page says so for this address.
  await push(page, '/prototype');
  await expect(page.locator('main')).toContainText(
    'No payment is waiting for an outcome in this browser.',
  );
  await openInTab(page, `/prototype/payment?request=${routeId}`);
  await expect(page.locator('main')).toContainText('No payment is waiting here');
  await expectSameDocument(page, mark);
});
