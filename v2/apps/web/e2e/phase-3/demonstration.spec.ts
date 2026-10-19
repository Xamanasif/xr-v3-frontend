import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar } from '../support/workspace';

/**
 * The Phase-3 demonstration in ONE browser tab of the PRODUCT build — no test hooks, nothing but
 * the screens — at 1440, 1024, 768 and 375, on one sample world, as far as the product build
 * authorises:
 *
 *  1. the public request → approval → the payment stand-in (TE-4) → access active → Meera Iyer
 *     assigned (as Package 2B);
 *  2. Meera adds Rahul Verma (IA-10) and gives him Shell-and-Tube Heat Exchanger (IA-05);
 *  3. Rahul signs in: Home → the experiment hub (ST-05) → Resources (ST-06): the lab brief opens
 *     in a new tab and reads "Opened" → Simulation (ST-07) → WEB (ST-08): "Launch WEB" opens the
 *     local prototype build's sample WEB activity in a new tab (TE-3, owner authorisation of
 *     Phase 7) — labelled simulated; the launch itself records nothing (AD-16), the activity
 *     opening reports activity only, so WEB reads "In progress"; closed unfinished, nothing is
 *     completed → Progress (ST-10, ST-15): WEB "In progress", no feedback is offered (feedback
 *     needs that format's system-recorded completion, T-12);
 *  4. My device (ST-18): Rahul's pre-authorised sample VR headset GIT-VR-03 (P3-03, owner
 *     authorisation of Phase 7; a seeded fact of the local prototype build, no device registry)
 *     and "Request a device transfer";
 *  5. Meera asks BITS for 60 more licences (IA-17): the same REQ record reaches the Super Admin's
 *     Requests (SA-02); Usage (IA-20) counts Rahul's WEB session; Device requests (IA-18) is
 *     empty; the Super Admin's Operations › Device transfers (SA-18) has nothing forwarded.
 *
 * The finished activity → completion → feedback and the device chain are walked on the product
 * build in `e2e/flows/walkthrough.spec.ts` (Phase 7), and on the test-hook build in
 * `demonstration-hooks.spec.ts` from CI-only fixtures. Every address here is reached by a link or
 * a button, except where marked TEST NAVIGATION; one tab throughout.
 */

const SHELL = 'Shell-and-Tube Heat Exchanger';
const SHELL_ID = 'shell-and-tube-heat-exchanger';
const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL = 'Account menu, Rahul Verma, Student, Godavari Institute of Technology';

const card = (page: Page) => page.locator('.xs-card');
const main = (page: Page) => page.locator('main');

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

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator(`aside.xr-side nav a[href="${href}"]`));
  await page.waitForURL((url) => url.pathname === href);
}

async function toSignIn(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await reachAndClick(page, page.locator('header a.xp-signin'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name: 'Sign in' }));
  }
  await page.waitForURL('**/sign-in');
}

/** A drawn checkbox, ticked by a pointer click on its label (the v46 control draws the box). */
async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

/** The hub's tab strip (B3-01 `nav.xw-hubtabs`). */
async function hubTab(page: Page, name: string): Promise<void> {
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: SHELL }).getByRole('link', { name, exact: true }),
  );
}

/**
 * A new tab opened by the page (a resource, the WEB link): opened blank in the click, then pointed
 * at the published link once the service answers — its address, then closed.
 */
async function newTab(page: Page, open: () => Promise<void>): Promise<string> {
  const popup = page.waitForEvent('popup');
  await open();
  const tab = await popup;
  await tab.waitForURL(/\.example\//);
  const address = tab.url();
  await tab.close();
  return address;
}

test('one tab, the product build: access → Rahul’s resources, WEB launch and per-format progress → My device → requests to BITS, usage and operations', async ({
  page,
}) => {
  test.setTimeout(300_000);
  // The sample resource and WEB links end in `.example`: the new tab gets a stand-in page, never
  // the network (the product opens them as they are published).
  await page.context().route(/\.example\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>x</title>',
    }),
  );
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. Access: the public request, approved and paid; the Institute Admin assigned.
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open: REQ-0042 · Godavari Institute of Technology' }),
  );
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const approve = page.getByRole('dialog', { name: 'Approve REQ-0042?' });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.xr-status')).toHaveText('Approved — payment required');
  await signOut(page, ARJUN);
  await openInTab(page, address);
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open Godavari Institute of Technology' }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await reachAndClick(
    page,
    main(page).locator('.xw-actions').getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.xr-phead-meta')).toContainText('Institute Admin: Meera Iyer');
  await signOut(page, ARJUN);

  // 2. Meera adds Rahul Verma (IA-10) and gives him the experiment (IA-05).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).locator('.xr-phead').getByRole('link', { name: 'Add student' }),
  );
  await page.waitForURL('**/institute/people/add**');
  await page.getByLabel('Full name', { exact: true }).fill('Rahul Verma');
  await page.getByLabel(/^Institution e-mail/).fill('rahul.verma@godavari.edu.in');
  await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give this student access' }));
  await page.waitForURL('**/institute/student-access/give?**');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  await expect(page.getByRole('list', { name: 'Access given' })).toContainText('Rahul Verma');
  await signOut(page, MEERA);

  // 3. Rahul: the hub → Resources → Simulation → WEB → Progress.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await reachAndClick(page, main(page).getByRole('link', { name: `Open ${SHELL}` }));
  await page.waitForURL(`**/student/experiments/${SHELL_ID}`);
  await expect(main(page).locator('.xw-hubrow')).toContainText('Next step: open the resources');
  await reachAndClick(
    page,
    main(page).locator('.xw-hubrow').getByRole('link', { name: 'Open resources' }),
  );
  await page.waitForURL(`**/student/experiments/${SHELL_ID}/resources`);
  const resources = main(page).getByRole('region', { name: 'Resources' });
  const brief = resources.locator('li.xr-row').first();
  await expect(brief).toContainText('Not opened yet');
  const opened = await newTab(page, () =>
    reachAndClick(page, brief.getByRole('button', { name: /in a new tab$/ })),
  );
  expect(opened).toMatch(/\.example\//);
  await expect(brief).toContainText('Opened');
  await checkState(page, SHELL);

  await hubTab(page, 'Simulation');
  await page.waitForURL(`**/student/experiments/${SHELL_ID}/simulation`);
  const chooser = main(page).getByRole('region', { name: 'Choose a format' });
  await expect(chooser.locator('li.xl-frow').nth(2)).toContainText(
    'Not included for your institution',
  );
  await reachAndClick(page, chooser.getByRole('link', { name: 'Open WEB' }));
  await page.waitForURL(`**/student/experiments/${SHELL_ID}/simulation/web`);
  const status = main(page).locator('.xl-fmtpanel .xr-status');
  await expect(status).toHaveText('Not started');
  // TE-3: the launch opens the sample WEB activity, labelled simulated, in a new tab.
  const popup = page.waitForEvent('popup');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Launch WEB' }));
  const activity = await popup;
  await activity.waitForURL('**/prototype/web-activity?launch=*');
  await expect(
    activity.getByRole('heading', { level: 1, name: 'Sample WEB activity' }),
  ).toBeVisible();
  await expect(activity.getByText('Simulated for this prototype')).toBeVisible();
  await expect(activity.getByText(SHELL, { exact: true })).toBeVisible();
  await expect(
    main(page).getByText(
      'The simulation opened in a new tab. Come back here any time to continue.',
    ),
  ).toBeVisible();
  // The activity opening is activity (In progress), never completion (AD-16 / T-12).
  await expect(status).toHaveText('In progress');
  await activity.close();
  await expect(status).toHaveText('In progress');
  await expect(main(page).getByRole('button', { name: 'Continue WEB' })).toBeVisible();
  await expect(main(page).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
  await checkState(page, 'Continue where you left off');

  await reachAndClick(page, main(page).getByRole('link', { name: 'Back to Simulation' }));
  await hubTab(page, 'Progress');
  await page.waitForURL(`**/student/experiments/${SHELL_ID}/progress`);
  const rows = page.getByRole('list', { name: 'Progress by format' }).locator(':scope > li');
  await expect(rows.nth(0)).toContainText('In progress');
  await expect(rows.nth(1)).toContainText('Not started');
  await expect(main(page).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
  await sidebar(page, '/student/progress');
  await expect(main(page)).toContainText(SHELL);
  await expect(main(page).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);
  await checkState(page, 'Progress');

  // 4. My device: Rahul's pre-authorised sample VR headset (P3-03), and the transfer request.
  await page.getByRole('button', { name: RAHUL, exact: true }).click();
  await page.locator('.xs-menu').getByRole('link', { name: 'My device' }).click();
  await page.waitForURL('**/student/device');
  await expect(main(page)).toContainText('ME lab VR headset, asset tag GIT-VR-03');
  await expect(main(page)).not.toContainText('No authorised device is recorded for you yet.');
  await expect(main(page).getByRole('button', { name: 'Request a device transfer' })).toBeVisible();
  await checkState(page, 'My device');
  await signOut(page, RAHUL);

  // 5. Meera: Requests to BITS (IA-17) → 60 more licences; Usage; Device requests.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/requests');
  await reachAndClick(
    page,
    main(page).getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
  );
  await reachAndClick(
    page,
    page.getByRole('radio', { name: /More licences for experiments you hold/ }),
  );
  await page.getByRole('textbox', { name: 'Licences requested' }).fill('60');
  await reachAndClick(page, page.getByRole('button', { name: 'Send request to BITS' }));
  const sent = page.getByRole('heading', { level: 1, name: /^Request REQ-\d{4} sent to BITS$/ });
  await expect(sent).toBeVisible();
  const reference = /REQ-\d{4}/.exec((await sent.textContent()) ?? '')![0];
  await checkState(page, `Request ${reference} sent to BITS`);
  await sidebar(page, '/institute/usage');
  await expect(page.getByRole('heading', { level: 2, name: 'No activity yet' })).toHaveCount(0);
  await expect(main(page)).toContainText(SHELL);
  await checkState(page, 'Usage');
  await sidebar(page, '/institute/requests');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Requests' }).getByRole('link', {
      name: 'Device requests',
    }),
  );
  await page.waitForURL('**/institute/requests?tab=devices');
  await expect(main(page).locator('tbody tr')).toHaveCount(0);
  await signOut(page, MEERA);

  // The Super Admin: the same request in Requests (SA-02); nothing forwarded in Operations.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/requests');
  await expect(main(page)).toContainText(reference);
  await sidebar(page, '/admin/operations/device-transfers');
  await expect(main(page).getByRole('link', { name: /^Review / })).toHaveCount(0);
  await checkState(page, 'Operations');
  await expectSameDocument(page, mark);
});
