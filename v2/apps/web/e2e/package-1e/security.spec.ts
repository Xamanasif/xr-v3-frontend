import { expect, type Page, test } from '@playwright/test';

import {
  addShellAndTube,
  fillDetails,
  headerLink,
  openInTab,
  panelOf,
  sendRequest,
  SHELL_AND_TUBE,
  shown,
  statusHead,
  wide,
} from '../package-1c/flow';
import {
  actAs,
  bootWorld,
  inspectWorld,
  planPayment,
  reachAndClick,
  signInAs,
  TEST_HOOKS_URL,
} from '../support';
import { ACCOUNT_LINES, expectSameDocument, markDocument, SUPER_ADMIN } from '../support/workspace';

/**
 * Package 1E — who may see a request, and commands sent twice, at 1440, 1024, 768 and 375, on the
 * test-hook build (the bridge reads the world and the query cache; the people sign in through the
 * XS-01 card and every move is a link, a button or the app router — one document, one world):
 * - the requester's ticket reaches no page and no answer of the Super Admin (PC-34, ADR-0009);
 * - a sign-out leaves no answer cached for the person, so Back has none of theirs to show;
 * - Submit pressed twice sends one request; Continue to payment pressed twice leaves one payment
 *   started (a second start, if one were sent, carries the same revision: refused, nothing written).
 * Port-level twins: `@xr/sample-platform` `handlers/access-request.test.ts` ("Package 1E").
 */
test.use({ baseURL: TEST_HOOKS_URL });

const TICKETS = 'xr.request-tickets.v2';

async function ticketOf(page: Page): Promise<string> {
  const stored = await page.evaluate((key) => sessionStorage.getItem(key), TICKETS);
  const tickets = JSON.parse(stored ?? '[]') as { token: string }[];
  expect(tickets).toHaveLength(1);
  return tickets[0]!.token;
}

async function toSignIn(page: Page): Promise<void> {
  if (wide(page)) await reachAndClick(page, page.locator('header a.xp-signin'));
  else await headerLink(page, 'Sign in');
  await page.waitForURL('**/sign-in');
}

interface Listed {
  readonly ok: boolean;
  readonly value: readonly { readonly id: string }[];
}

test('the requester’s ticket reaches no Super Admin page or answer; sign-out leaves none of his answers', async ({
  page,
}) => {
  test.slow();
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto('/');
  const mark = await markDocument(page);
  const address = await sendRequest(page);
  const token = await ticketOf(page);
  // Neither the address nor any page shows it.
  expect(address).not.toContain(token);
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Submitted');
  expect(await page.content()).not.toContain(token);

  // The Super Admin signs in on this tab: SA-02 and SA-03 for the request, and his answers.
  await toSignIn(page);
  await signInAs(page, { email: 'arjun.mehta@wilp.example' });
  await openInTab(page, '/admin/requests');
  // SA-02 names requests by their institution, never by reference (SA-v1).
  await expect(
    page.locator('main tbody tr', { hasText: 'Godavari Institute of Technology' }),
  ).toBeVisible();
  expect(await page.content()).not.toContain(token);
  await openInTab(page, '/admin/requests/REQ-0042');
  await expect(page.getByRole('complementary', { name: 'Your decision' })).toBeVisible();
  expect(await page.content()).not.toContain(token);
  const listed = await actAs<Listed>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'listRequests',
    input: { sort: 'received-newest' },
  });
  expect(listed.value.map((row) => row.id)).toContain('REQ-0042');
  expect(JSON.stringify(listed)).not.toContain(token);
  const decision = await actAs(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  expect(JSON.stringify(decision)).not.toContain(token);
  const signedIn = await inspectWorld(page);
  const arjunKey = (signedIn.session as { sessionKey: string }).sessionKey;
  expect(signedIn.cachedSessionKeys).toEqual([arjunKey]);

  // Sign out: none of his answers stay cached (the cache's session keys say so), so Back — which
  // meets the session gate — has nothing of his to show.
  await page.getByRole('button', { name: ACCOUNT_LINES.super_admin, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
  expect((await inspectWorld(page)).cachedSessionKeys).not.toContain(arjunKey);
  await page.goBack();
  await page.waitForURL((url) => url.pathname === '/sign-in');
  await expect(page.locator('main')).not.toContainText('Godavari Institute of Technology');
  await expect(page.getByRole('complementary', { name: 'Your decision' })).toHaveCount(0);
  expect((await inspectWorld(page)).cachedSessionKeys).not.toContain(arjunKey);

  // The visitor holds the ticket again (the same user session that sent it): the status opens.
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Submitted');
  await expectSameDocument(page, mark);
});

test('Submit pressed twice sends one request; Continue to payment pressed twice leaves one payment started', async ({
  page,
}) => {
  test.slow();
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto(SHELL_AND_TUBE);
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
  await page.waitForURL('**/request-access');
  await fillDetails(page);
  await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
  await page.waitForURL('**/request-access?step=review');
  const submit = page.getByRole('button', { name: 'Submit request' });
  await submit.scrollIntoViewIfNeeded();
  await submit.dblclick();
  await page.waitForURL('**/request-access/sent');
  await expect(page.locator('main')).toContainText('Your reference is REQ-0042.');
  const address = await page
    .getByRole('link', { name: 'Check request status' })
    .getAttribute('href');
  const listed = await actAs<Listed>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'listRequests',
    input: { sort: 'received-newest' },
  });
  const ids = listed.value.map((row) => row.id);
  expect(ids).toContain('REQ-0042');
  expect(ids).not.toContain('REQ-0043');

  // Approved (External) by the Super Admin's own session; the provider then answers "pending".
  const opened = await actAs<{ value: { request: { rev: number } } }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  await actAs(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'approveRequest',
    input: { id: 'REQ-0042', route: 'external', expectedRev: opened.value.request.rev },
  });
  await openInTab(page, address!);
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await planPayment(page, 'pending');
  // The outcome is what is checked here: a second start, if one were sent, would carry the same
  // revision and be refused as stale, writing nothing (the port-level tests count the commands).
  const pay = page.getByRole('button', { name: 'Continue to payment' });
  await pay.scrollIntoViewIfNeeded();
  await pay.dblclick();
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Payment not confirmed');
  const after = await actAs<{
    value: { request: { history: readonly { event: string }[] } };
  }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  expect(
    after.value.request.history.filter((entry) => entry.event === 'payment-started'),
  ).toHaveLength(1);
});
