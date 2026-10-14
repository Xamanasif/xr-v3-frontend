import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  planPayment,
  reachAndClick,
  reportPayment,
  startReview,
  TEST_HOOKS_URL,
} from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, SUPER_ADMIN } from '../support/workspace';
import { openInTab, sendRequest, statusHead } from './flow';

/**
 * PU-10 Request status, PU-13 Access active and PU-12 Payment (B1-08) at 1440, 1024, 768 and 375,
 * on the dedicated test-hook build (ADR-0007): the request is sent through the screens by the tab's
 * own browser session; what no ordinary person can do from these pages comes from the CI-only
 * seams, each named — the Super Admin's decisions (`actAs`, the same world, a session of its own),
 * the AD-14 review start (`startReview`) and the TE-4 sample provider's outcomes (`planPayment`,
 * `reportPayment`). In the product build "Continue to payment" is answered by the stand-in, which
 * confirms (the demonstration). Every state passes the screen checks.
 */
test.use({ baseURL: TEST_HOOKS_URL });

async function sent(page: Page): Promise<{ address: string; mark: string }> {
  test.slow();
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto('/');
  const mark = await markDocument(page);
  const address = await sendRequest(page);
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Submitted');
  return { address, mark };
}

async function decision(page: Page, method: string, input: Record<string, unknown>) {
  const opened = await actAs<{ ok: true; value: { request: { rev: number } } }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  const answer = await actAs<{ ok: boolean }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method,
    input: { id: 'REQ-0042', expectedRev: opened.value.request.rev, ...input },
  });
  expect(answer.ok, `${method} as the Super Admin`).toBe(true);
}

test('Submitted → Under review (AD-14 seam) → Information requested (SA-03): one fact at a time', async ({
  page,
}) => {
  const { mark } = await sent(page);
  await checkState(page, 'Request REQ-0042');

  // Opening SA-03 starts nothing (AD-14 / P1-04): the read records no review start.
  const opened = await actAs<{ ok: true; value: { request: { reviewStartedAt: string | null } } }>(
    page,
    SUPER_ADMIN,
    { port: 'accessRequests', method: 'getRequestForDecision', input: 'REQ-0042' },
  );
  expect(opened.value.request.reviewStartedAt).toBeNull();
  await expect(statusHead(page)).toContainText('Submitted');

  await startReview(page, 'REQ-0042');
  await expect(statusHead(page)).toContainText('Under review');
  await expect(statusHead(page)).toContainText('BITS is reviewing your request');
  await expect(page.locator('.xr-tl.is-latest')).toContainText('BITS started reviewing');
  await checkState(page, 'Request REQ-0042');

  await decision(page, 'requestMoreInformation', {
    reason: 'Please confirm the cohort size for this term.',
  });
  await expect(statusHead(page)).toContainText('Information requested');
  await expect(statusHead(page).locator('.xp-reason')).toHaveText(
    'What BITS asked“Please confirm the cohort size for this term.”',
  );
  // No reply field: the reply lifecycle is OPEN (T-03).
  await expect(page.locator('main textarea, main input')).toHaveCount(0);
  await checkState(page, 'Request REQ-0042');
  await expectSameDocument(page, mark);
});

test('Approved with changes → Payment → the stand-in confirms → Access active (PU-13)', async ({
  page,
}) => {
  const { address, mark } = await sent(page);
  await decision(page, 'approveSmallerScope', {
    route: 'external',
    items: [{ experimentId: 'shell-and-tube-heat-exchanger', formats: ['web', 'vr'] }],
    licences: '80',
    term: 'yearly',
    reason: 'We can offer 80 licences this term.',
  });
  await expect(statusHead(page)).toContainText('Approved with changes');
  await expect(page.locator('.xp-compare tr.is-diff')).toHaveCount(1);
  await expect(page.locator('.xp-compare tr.is-diff')).toContainText('Changed');
  await checkState(page, 'Request REQ-0042');

  // PU-12: what will be activated — the approved scope; no amount, method or provider.
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await checkState(page, 'Pay for access');
  await expect(page).toHaveTitle('Pay for access · XR Learning Platform');
  await expect(page.locator('.xp-pay dd').nth(4)).toHaveText('80');
  await expect(page.locator('main')).not.toContainText(/₹|INR|amount|card|UPI|refund|mark paid/i);
  await expect(page.locator('main input, main select, main textarea')).toHaveCount(0);
  // Back to the status, Forward to the payment page: the same document.
  await page.goBack();
  await page.waitForURL(`**${address}`);
  await page.goForward();
  await page.waitForURL(`**${address}/payment`);

  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page)).toContainText('Access plan ACC-0107');
  await expect(statusHead(page).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
    'href',
    '/sign-in',
  );
  await expect(page.locator('.xr-tl .xr-tl-what')).toHaveText([
    'Access active',
    'Payment confirmed',
    'Approved with changes — payment needed',
    'Request submitted',
  ]);
  await checkState(page, 'Request REQ-0042');
  await expectSameDocument(page, mark);
});

test('Payment not confirmed (CI: planned pending) → Check again → Payment failed (CI: provider report) → Try payment again', async ({
  page,
}) => {
  const { address, mark } = await sent(page);
  await decision(page, 'approveRequest', { route: 'external' });
  await expect(statusHead(page)).toContainText('Approved — payment required');
  await checkState(page, 'Request REQ-0042');

  await planPayment(page, 'pending');
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Payment not confirmed yet');
  // No "pay again" while a confirmation is pending (REQ-08): one action, Check again.
  await expect(statusHead(page).getByRole('link')).toHaveCount(0);
  await expect(statusHead(page).getByRole('button', { name: 'Check again' })).toBeVisible();
  await expect(page.locator('.xr-tl.is-latest')).toContainText('Waiting for confirmation.');
  await checkState(page, 'Request REQ-0042');
  // Check again reads the request again: still waiting for the provider.
  await reachAndClick(page, statusHead(page).getByRole('button', { name: 'Check again' }));
  await expect(statusHead(page)).toContainText('Payment not confirmed yet');
  // The payment page has no payment step now: it goes to the status.
  await openInTab(page, `${address}/payment`);
  await page.waitForURL((url) => url.pathname === address);

  // The provider reports a failure (CI: the sample provider's report, read by the page).
  expect((await reportPayment(page, 'REQ-0042', 'failed')).ok).toBe(true);
  await expect(statusHead(page)).toContainText('Payment failed');
  await expect(statusHead(page)).toContainText('Nothing has been activated.');
  await checkState(page, 'Request REQ-0042');

  // Try payment again: this time the stand-in confirms on start.
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Try payment again' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');
  await expectSameDocument(page, mark);
});

test('Internal route: approval activates directly — no payment step, no payment page', async ({
  page,
}) => {
  const { address, mark } = await sent(page);
  await decision(page, 'approveRequest', { route: 'internal' });
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page).getByRole('link', { name: 'Continue to payment' })).toHaveCount(0);
  await expect(page.locator('.xr-tl .xr-tl-what')).toHaveText([
    'Access active',
    'Approved',
    'Request submitted',
  ]);
  await expect(page.locator('.xr-tl.is-latest')).toContainText('No payment step.');
  await checkState(page, 'Request REQ-0042');
  await openInTab(page, `${address}/payment`);
  await page.waitForURL((url) => url.pathname === address);
  await expect(statusHead(page)).toContainText('Access active');
  await expectSameDocument(page, mark);
});
