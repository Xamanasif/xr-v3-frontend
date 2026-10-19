import { expect, type Page, test } from '@playwright/test';

import {
  addShellAndTube,
  fillDetails,
  headerLink,
  openInTab,
  panelOf,
  RECORD,
  shown,
  statusHead,
  wide,
} from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar, sidebarLink } from '../support/workspace';

/**
 * Package 1E — the connected Phase-1 proof (Flow A steps 1–4 and the A-info alternate, Flow B step
 * 1; flows.json), in ONE tab of the PRODUCT build — no test hooks, no boot descriptor, no fixture:
 * the spine-start sample world the build composes — at 1440, 1024, 768 and 375. One document
 * throughout (ADR-0004), so one sample world for every role.
 *
 * Every step is an ordinary product interaction (a link, a button, a field), except two kinds,
 * named where they happen:
 * - TEST NAVIGATION — the requester's way back to their status page. No product page lists a
 *   request (R01 open), and an address typed into the bar would load a new document and reset the
 *   in-memory world (TE-6): the test opens the address PU-09 handed out through the app router, as
 *   a saved link inside the app would. It writes nothing; the service still decides who may read.
 * - DEVELOPMENT-ONLY STAND-IN — "Continue to payment" in this local prototype build (TE-4): the
 *   sample payment provider confirms at once. No money moves; staging and production builds leave
 *   the payment unconfirmed.
 * Not reachable here at all (CI-only fixtures, `e2e/package-1c/status.spec.ts` and
 * `decision-revision.spec.ts`): the AD-14 review start ("Under review" for the requester), and
 * the provider's "pending" and "failed" outcomes.
 */

const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const main = (page: Page) => page.locator('main');
const card = (page: Page) => page.locator('.xs-card');
const decisionPanel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const godavariRow = (page: Page) =>
  main(page).locator('tbody tr', { hasText: 'Godavari Institute of Technology' });
// The Super Admin's V3 pages (SA-v1) never show a request's reference: REQ-0042 is found by the
// address its links open, its decision by the panel's status.
const request42 = (page: Page) => page.locator('main a[href="/admin/requests/REQ-0042"]');
const request42Row = (page: Page) =>
  main(page).locator('tbody tr', { has: page.locator('a[href="/admin/requests/REQ-0042"]') });
const decided = (page: Page) => decisionPanel(page).locator('.rk-done .xr-st');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

/** From a public page: the header's Sign in (the menu sheet below 1024 px). */
async function toSignIn(page: Page): Promise<void> {
  if (wide(page)) await reachAndClick(page, page.locator('header a.xp-signin'));
  else await headerLink(page, 'Sign in');
  await page.waitForURL('**/sign-in');
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await page.waitForURL(`**${href}`);
}

/** Landing → engineering areas → an area → a course → its experiment (PU-01 → 02 → 03 → 05 → 06). */
async function browseToShellAndTube(page: Page): Promise<void> {
  await headerLink(page, 'Areas');
  await page.waitForURL('**/areas');
  await checkState(page, 'Engineering areas');
  await reachAndClick(page, page.getByRole('link', { name: 'Mechanical & Manufacturing' }));
  await page.waitForURL('**/areas/mechanical-manufacturing');
  await checkState(page, 'Mechanical & Manufacturing');
  await reachAndClick(page, page.getByRole('link', { name: 'Thermodynamics & Heat Transfer' }));
  await page.waitForURL('**/courses/thermodynamics-heat-transfer');
  await checkState(page, 'Thermodynamics & Heat Transfer');
  // The catalogue (PU-04), then the experiment from its row.
  await headerLink(page, 'Browse experiments');
  await page.waitForURL('**/experiments');
  await checkState(page, 'Experiments');
  await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
  await page.waitForURL('**/experiments/shell-and-tube-heat-exchanger');
  await checkState(page, 'Shell-and-Tube Heat Exchanger');
}

/** PU-07 → PU-08 → PU-09; resolves with the status address PU-09 hands out. */
async function requestFromSelection(page: Page): Promise<string> {
  await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
  await page.waitForURL('**/request-access');
  await fillDetails(page);
  await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
  await page.waitForURL('**/request-access?step=review');
  await checkState(page, 'Check your request');
  await reachAndClick(page, page.getByRole('button', { name: 'Submit request' }));
  await page.waitForURL('**/request-access/sent');
  await checkState(page, 'Request sent');
  await expect(main(page)).toContainText('Your reference is REQ-0042.');
  const address = await page
    .getByRole('link', { name: 'Check request status' })
    .getAttribute('href');
  // The address is the opaque route id, never the reference or the ticket (ADR-0009).
  expect(address).toMatch(/^\/requests\/rq-\d{4}$/);
  return address!;
}

/** The Super Admin decides REQ-0042 on SA-03, reached from the Requests list (SA-02). */
async function decide(page: Page, route: 'internal' | 'external'): Promise<void> {
  await sidebar(page, '/admin/requests');
  await checkState(page, 'Requests');
  const row = request42Row(page);
  await expect(row).toContainText('Godavari Institute of Technology');
  await reachAndClick(
    page,
    row.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the request$/ }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
  await checkState(page, 'Godavari Institute of Technology');
  const panel = decisionPanel(page);
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator(`label[for="decision-route-${route}"]`));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const confirm = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await expect(confirm).toContainText(
    route === 'external'
      ? 'Institutional access is not activated now.'
      : 'Institutional access is activated now and the access plan is created.',
  );
  await reachAndClick(page, confirm.getByRole('button', { name: 'Approve request' }));
  await expect(decided(page)).toHaveText(
    route === 'external' ? 'Approved — payment required' : 'Access active',
  );
  await expect(panel.getByRole('heading', { name: 'Your decision' })).toBeFocused();
}

test('Flow A and B1 in one tab of the product build: browse → select → request → decide → pay → access → institution → Institute Admin', async ({
  page,
}) => {
  test.slow();
  // 1. The public landing (PU-01): the only document load.
  await page.goto('/');
  const mark = await markDocument(page);
  await checkState(page, 'Set the conditions.');

  // 2. Engineering areas, an area, a course, the catalogue, an experiment (PU-02 … PU-06).
  await browseToShellAndTube(page);

  // 3. The experiment's supported formats into the selection (A1: availability, never access).
  await expect(page.locator('.xp-xtext .xr-fmt')).toHaveText(['WEB', 'AR', 'VR']);
  await addShellAndTube(page);
  await expect(page.getByRole('link', { name: 'Selection, 1 experiment' }).first()).toBeAttached();

  // 4. Your selection (PU-07), edited: a format off and on again, Remove and Undo.
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  await checkState(page, 'Your selection');
  const pills = page.getByRole('group', { name: 'Formats for Shell-and-Tube Heat Exchanger' });
  await reachAndClick(page, pills.getByText('VR · Virtual reality'));
  await expect(pills.getByRole('checkbox', { name: 'VR · Virtual reality' })).not.toBeChecked();
  await reachAndClick(page, pills.getByText('VR · Virtual reality'));
  await expect(pills.getByRole('checkbox', { name: 'VR · Virtual reality' })).toBeChecked();
  await reachAndClick(
    page,
    page.getByRole('button', { name: 'Remove Shell-and-Tube Heat Exchanger from your selection' }),
  );
  const notice = page.locator('.xr-notice[role="status"]');
  await expect(notice).toBeFocused();
  await reachAndClick(page, notice.getByRole('button', { name: 'Undo' }));
  await expect(page.locator('.xp-srow')).toHaveCount(1);

  // 5–6. The institutional request (PU-08) and its reference (PU-09; A2).
  const address = await requestFromSelection(page);

  // 7. Its status, through PU-09's link: the browser session holds the ticket (ADR-0009).
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);
  await checkState(page, 'Request REQ-0042');
  await expect(statusHead(page)).toContainText('Submitted');

  // 8. The Super Admin signs in on this tab (sample sign-in, P1-01): SA-01, REQ-0042 waiting.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await checkState(page, 'Overview');
  await expect(
    page.getByRole('region', { name: /^Requests/ }).locator('a[href="/admin/requests/REQ-0042"]'),
  ).toHaveCount(1);

  // 9. SA-02 → SA-03: approve, External (A3).
  await decide(page, 'external');
  await signOut(page, ARJUN);

  // 10. The requester's status shows the decision. TEST NAVIGATION (see above).
  await openInTab(page, address);
  await checkState(page, 'Request REQ-0042');
  await expect(statusHead(page)).toContainText('Approved — payment required');

  // 11. The payment-required path: PU-12, then DEVELOPMENT-ONLY STAND-IN (TE-4) confirms (A4).
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await checkState(page, 'Pay for access');
  await expect(main(page)).not.toContainText(/₹|INR|amount|card|UPI|refund|mark paid/i);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);

  // 12. Access active (PU-13): the plan the confirmation created.
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page)).toContainText('Access plan ACC-0107');
  await checkState(page, 'Request REQ-0042');

  // 13. The Super Admin: SA-06 lists the institution and its plan; SA-07 opens it.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await checkState(page, 'Overview');
  await expect(request42(page)).toHaveCount(0);
  await sidebar(page, '/admin/institutions');
  await checkState(page, 'Institutions');
  await expect(godavariRow(page)).toContainText('External');
  await expect(godavariRow(page)).toContainText('1 course · 1 experiment');
  await expect(godavariRow(page)).toContainText('Access active');
  await expect(godavariRow(page).locator('.rk-tag-warn')).toHaveText('Needs one');
  const search = page.getByRole('searchbox', { name: 'Search' });
  await reachAndClick(page, search);
  await search.fill('godavari');
  await reachAndClick(
    page,
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await checkState(page, 'Godavari Institute of Technology');
  // The records the activation made: one plan, as approved; institutional access only — no
  // Student has access and none was given automatically (published ≠ institution ≠ Student).
  // SA-v1 draws the one plan as the plan band, named by what it holds, without its reference.
  const plan = page.getByRole('region', { name: /^1 experiment · \d+ licences$/ });
  await expect(plan).toHaveCount(1);
  await expect(plan).toContainText('Access plan');
  await expect(plan).toContainText('Shell-and-Tube Heat Exchanger');
  await expect(plan).toContainText(`${RECORD.licences} licences, as approved.`);
  await expect(plan.getByRole('img', { name: /^Yearly term / })).toBeVisible();
  await expect(main(page)).not.toContainText('ACC-0107');
  await expect(main(page)).toContainText('0 students · 0 Faculty');
  const people = page.getByRole('region', { name: 'People' });
  await expect(people).toContainText('Nobody has been added yet.');
  await expect(people.getByRole('list')).toHaveCount(0);

  // 14. Assign the Institute Admin (B1): the drawn checks, then Meera Iyer. Her work e-mail is
  // held by nobody else in this world (T-11 / P1-01: a colliding e-mail is not handled).
  await reachAndClick(
    page,
    page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(assign).toContainText('Enter the person’s name');
  await assign.getByRole('textbox', { name: 'Name' }).fill(RECORD.contact);
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill(RECORD.email);
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.rk-notice--ok[role="status"]')).toContainText(
    'Meera Iyer is now the Institute Admin for Godavari Institute of Technology.',
  );
  await checkState(page, 'Godavari Institute of Technology');
  await signOut(page, ARJUN);

  // 15. Meera Iyer signs in: her own workspace, and its boundary.
  await signIn(page, RECORD.email);
  // Her base is IA-01 Overview since Package 2A (before, the interim landing: Help).
  await page.waitForURL(/\/institute$/);
  await expect(page.getByRole('button', { name: MEERA, exact: true })).toBeVisible();
  await checkState(page, 'Overview');
  await revealSidebar(page);
  await expect(page.locator('aside.xr-side a[href^="/admin"]')).toHaveCount(0);
  // Her institution's request at its address (TEST NAVIGATION): readable by its Institute Admin.
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Access active');
  // The Super Admin's pages, opened in her shell (TEST NAVIGATION): refused, nothing of theirs.
  for (const other of ['/admin/institutions/godavari', '/admin/requests/REQ-0042', '/admin']) {
    await openInTab(page, other);
    await expect(
      page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
    ).toBeVisible();
    await expect(main(page)).not.toContainText(
      /Pause access|Approve request|Assign Institute Admin/,
    );
  }
  await expectSameDocument(page, mark);
});

test('an internal approval: access active at once, no payment step (A3 internal)', async ({
  page,
}) => {
  test.slow();
  await page.goto('/');
  const mark = await markDocument(page);
  await headerLink(page, 'Browse experiments');
  await page.waitForURL('**/experiments');
  await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
  await page.waitForURL('**/experiments/shell-and-tube-heat-exchanger');
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  const address = await requestFromSelection(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await decide(page, 'internal');
  await signOut(page, ARJUN);
  // TEST NAVIGATION: the requester's status — active, with no payment step to take.
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page)).toContainText('Access plan ACC-0107');
  await expect(page.getByRole('link', { name: 'Continue to payment' })).toHaveCount(0);
  await checkState(page, 'Request REQ-0042');
  // Its payment address (TEST NAVIGATION) has no payment step: back to the status (replace).
  await openInTab(page, `${address}/payment`);
  await page.waitForURL((url) => url.pathname === address);
  await expect(statusHead(page)).toContainText('Access active');
  // The institution as SA-06 lists it: internal, active, its plan.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  await expect(godavariRow(page)).toContainText('Internal');
  await expect(godavariRow(page)).toContainText('1 course · 1 experiment');
  await expect(godavariRow(page)).toContainText('Access active');
  await expectSameDocument(page, mark);
});

test('the A-info alternate: information requested, shown to the requester, no reply field (T-03)', async ({
  page,
}) => {
  test.slow();
  await page.goto('/');
  const mark = await markDocument(page);
  await headerLink(page, 'Browse experiments');
  await page.waitForURL('**/experiments');
  await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
  await page.waitForURL('**/experiments/shell-and-tube-heat-exchanger');
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  const address = await requestFromSelection(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/requests');
  await reachAndClick(
    page,
    request42Row(page).getByRole('link', {
      name: /^Godavari Institute of Technology, .*Open the request$/,
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
  const panel = decisionPanel(page);
  await reachAndClick(page, panel.locator('label[for="decision-info"]'));
  await panel
    .getByLabel('What do you need from the requester? (required)')
    .fill('Please confirm the cohort size for this term.');
  await reachAndClick(page, panel.getByRole('button', { name: 'Send request for information' }));
  await expect(decided(page)).toHaveText('Information requested');
  await signOut(page, ARJUN);
  // TEST NAVIGATION: the requester sees the question; there is no reply field (T-03 open).
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Information requested');
  await expect(statusHead(page)).toContainText('Please confirm the cohort size for this term.');
  await expect(main(page).locator('textarea, input')).toHaveCount(0);
  await checkState(page, 'Request REQ-0042');
  await expectSameDocument(page, mark);
});
