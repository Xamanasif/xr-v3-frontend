import { expect, type Locator, type Page, test } from '@playwright/test';

import { bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar } from '../support/workspace';

/**
 * The Phase-3 demonstration that needs the two things a product build never records, in ONE tab
 * of the TEST-HOOK build at 1440, 1024, 768 and 375 — every other step is a product action on the
 * screens, on one sample world:
 *
 * - **CI-only fixture: the world** — the walk after its setup (8 Oct 2026): Godavari active with
 *   ACC-0107, Meera Iyer assigned, the students imported, and Rahul Verma's authorised VR device
 *   (GIT-VR-03) supplied by the seed (no device registry is designed: D20b, P3-03).
 * - **CI-only fixture: the runtime report** — `reportRuntime` is the sample runtime's own report
 *   (`system:runtime-report`): the ONLY way "In progress" and "Completed" are written (T-12 open,
 *   ADR-0006; TE-3 unsigned, so no product runtime exists). No launch, page, resource or time
 *   writes either.
 *
 * Learning: Meera gives Rahul the experiment (IA-07 → IA-05) → Rahul signs in → the hub (ST-05) →
 * Resources (ST-06) → Simulation (ST-07) → WEB (ST-08): Launch records nothing → [runtime: WEB
 * opened] → In progress, Continue WEB → [runtime: WEB completed] → "Give feedback on WEB" → the
 * form (ST-16): missing ratings refused, then sent → Feedback sent (ST-17) → Progress (ST-15): WEB
 * completed + feedback sent, VR not started with no feedback offer.
 * Device: Rahul requests a transfer (ST-18) → Meera: the Overview's device row → Device requests
 * (IA-18) → Review (IA-19) → Forward to BITS (DL-1) → Arjun Mehta: Operations › Device transfers
 * (SA-18) → the decision (SA-19) → Approve (DL-1) → Rahul's My device: Approved, GIT-VR-07 → Meera's
 * Device requests: decided; Usage (IA-20) counts WEB started and completed.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'Shell-and-Tube Heat Exchanger';
const SHELL_ID = 'shell-and-tube-heat-exchanger';
const GIT_VR_07 = 'ME lab VR headset, asset tag GIT-VR-07';
const ARJUN_LINE = 'Account menu: Arjun Mehta, Super Admin';
const MEERA_LINE = 'Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL_LINE = 'Account menu: Rahul Verma, Student, Godavari Institute of Technology';

const card = (page: Page) => page.locator('.xp-auth-card');
const main = (page: Page) => page.locator('main');

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xr-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator(`aside.xr-side nav a[href="${href}"]`));
  await page.waitForURL((url) => url.pathname === href);
}

async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

async function hubTab(page: Page, name: string): Promise<void> {
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: SHELL }).getByRole('link', { name, exact: true }),
  );
}

/** The new tab opens blank in the click, then gets the published link; closed once it has it. */
async function newTab(page: Page, open: () => Promise<void>): Promise<void> {
  const popup = page.waitForEvent('popup');
  await open();
  const tab = await popup;
  await tab.waitForURL(/\.example\//);
  await tab.close();
}

async function myDevice(page: Page): Promise<void> {
  await page.getByRole('button', { name: RAHUL_LINE, exact: true }).click();
  await page.locator('.xr-menu').getByRole('link', { name: 'My device' }).click();
  await page.waitForURL('**/student/device');
}

test('one tab, the test-hook build: access → resources → WEB → runtime progress and completion → feedback → the device chain across three roles', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.context().route(/\.example\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>x</title>',
    }),
  );
  await bootWorld(page, { fixture: 'after-setup', session: MEERA });
  await page.goto('/institute');
  await page.getByRole('heading', { level: 1, name: 'Overview' }).waitFor();
  const mark = await markDocument(page);

  // Meera gives Rahul the experiment from his record (IA-07 → IA-05).
  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: 'Open student record: Rahul Verma' }),
  );
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give this student access' }));
  await page.waitForURL('**/institute/student-access/give?**');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  await expect(page.getByRole('list', { name: 'Access given' })).toContainText('Rahul Verma');
  await signOut(page, MEERA_LINE);

  // Rahul signs in: the hub → Resources → Simulation → WEB.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await reachAndClick(page, main(page).getByRole('link', { name: `Open ${SHELL}` }));
  await page.waitForURL(`**/student/experiments/${SHELL_ID}`);
  await hubTab(page, 'Resources');
  const brief = main(page).getByRole('region', { name: 'Resources' }).locator('li.xr-row').first();
  await newTab(page, () =>
    reachAndClick(page, brief.getByRole('button', { name: /in a new tab$/ })),
  );
  await expect(brief).toContainText('Opened');
  await hubTab(page, 'Simulation');
  const chooser = main(page).getByRole('region', { name: 'Choose a format' });
  await reachAndClick(page, chooser.getByRole('link', { name: 'Open WEB' }));
  await page.waitForURL(`**/simulation/web`);
  const status = main(page).locator('.xl-fmtpanel .xr-status');
  await newTab(page, () =>
    reachAndClick(page, main(page).getByRole('button', { name: 'Launch WEB' })),
  );
  await expect(status).toHaveText('Not started');

  // CI-ONLY FIXTURE: the sample runtime reports WEB opened — In progress, from activity only.
  await reportRuntime(page, {
    person: RAHUL,
    experimentId: SHELL_ID,
    format: 'web',
    kind: 'opened',
  });
  await expect(status).toHaveText('In progress');
  await expect(main(page).getByRole('button', { name: 'Continue WEB' })).toBeVisible();
  await expect(main(page).getByRole('link', { name: /Give feedback/ })).toHaveCount(0);

  // CI-ONLY FIXTURE: the runtime reports WEB completed (the only route to Completed, T-12).
  await reportRuntime(page, {
    person: RAHUL,
    experimentId: SHELL_ID,
    format: 'web',
    kind: 'completed',
  });
  await expect(status).toContainText('Completed');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give feedback on WEB' }));
  await page.waitForURL(`**/student/experiments/${SHELL_ID}/feedback/web`);
  await reachAndClick(page, page.getByRole('button', { name: 'Submit feedback' }));
  await expect(page.getByRole('alert').filter({ hasText: 'ratings are missing' })).toContainText(
    '5 ratings are missing',
  );
  for (const statement of [1, 2, 3, 4, 5]) {
    await page.locator(`label[for="feedback-q${statement}-4"]`).click();
  }
  await reachAndClick(page, page.getByRole('button', { name: 'Submit feedback' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Feedback on WEB sent' })).toBeVisible();
  await checkState(page, 'Feedback on WEB sent');

  // Progress (ST-15): WEB completed with its feedback sent; VR not started, nothing offered.
  await sidebar(page, '/student/progress');
  await expect(main(page)).toContainText('Feedback sent');
  await expect(main(page).getByRole('link', { name: 'Give feedback on VR' })).toHaveCount(0);
  await checkState(page, 'Progress');

  // Device 1: Rahul requests a transfer of his authorised VR device (seeded GIT-VR-03).
  await myDevice(page);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Request a device transfer' }));
  await page.getByRole('textbox', { name: 'New device' }).fill(GIT_VR_07);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Send request' }));
  await expect(main(page)).toContainText('With your Institute Admin');
  const reference = /DTR-\d{4}/.exec((await main(page).textContent()) ?? '')![0];
  await signOut(page, RAHUL_LINE);

  // Device 2: Meera — the Overview's row → Device requests → Review → Forward to BITS (DL-1).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await reachAndClick(page, main(page).getByRole('link', { name: /Open requests/ }));
  await page.waitForURL('**/institute/requests?tab=devices');
  await expect(main(page).locator('tbody tr', { hasText: 'Rahul Verma' })).toContainText(
    'Waiting on you',
  );
  await reachAndClick(page, page.getByRole('link', { name: 'Review Rahul Verma’s request' }));
  await page.waitForURL(`**/institute/requests/devices/${reference}`);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Forward to BITS' }));
  const forward = page.getByRole('dialog', { name: `Forward ${reference} to BITS?` });
  await forward.getByRole('button', { name: 'Forward to BITS' }).click();
  await expect(forward).toBeHidden();
  await expect(page.locator('#device-request-status')).toContainText('Forwarded to BITS');
  await signOut(page, MEERA_LINE);

  // Device 3: Arjun Mehta — Operations › Device transfers → the decision → Approve (DL-1).
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/operations/device-transfers');
  await reachAndClick(page, main(page).getByRole('link', { name: `Review ${reference}` }));
  await page.waitForURL(`**/admin/operations/device-transfers/${reference}`);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Approve transfer' }));
  const approve = page.getByRole('dialog', { name: `Approve ${reference}?` });
  await approve.getByRole('button', { name: 'Approve transfer' }).click();
  await expect(approve).toBeHidden();
  await expect(page.locator('#transfer-status')).toContainText('Approved');
  await signOut(page, ARJUN_LINE);

  // Rahul sees the decision: Approved, the authorised device is GIT-VR-07 now.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await myDevice(page);
  await expect(main(page)).toContainText('Approved');
  await expect(main(page)).toContainText(GIT_VR_07);
  await signOut(page, RAHUL_LINE);

  // Meera sees it decided; Usage counts what the runtime reported.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/requests');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Requests' }).getByRole('link', {
      name: 'Device requests',
    }),
  );
  await expect(main(page).locator('tbody tr', { hasText: 'Rahul Verma' })).toContainText(
    'Decided · approved by BITS',
  );
  await sidebar(page, '/institute/usage');
  const web = main(page).locator('tbody tr', { hasText: 'WEB' }).first();
  await expect(web.locator('td[data-label="Started"]')).toHaveText('1');
  await expect(web.locator('td[data-label="Completed"]')).toHaveText('1');
  await expectSameDocument(page, mark);
});
