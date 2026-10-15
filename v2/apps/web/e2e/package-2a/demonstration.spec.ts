import { expect, type Locator, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar } from '../support/workspace';
import { openInTab, sendRequest, statusHead } from '../package-1c/flow';

/**
 * The Package-2A demonstration (owner §8), in ONE browser tab of the PRODUCT build — no test hooks,
 * no boot descriptor, nothing but the screens — at 1440, 1024, 768 and 375, on one sample world:
 * the public request → the Super Admin approves it → the requester pays (the TE-4 stand-in) →
 * access active → the Super Admin assigns Meera Iyer → Meera signs in: her Overview (IA-01), the
 * institution's plan (IA-02 → IA-03), People (IA-06) → Add student (IA-10) → Give this student
 * access (IA-05, three steps) → Student access (IA-04) → Overview again → Rahul Verma signs in with
 * the e-mail Meera entered: Home (ST-01) → the experiment (ST-05) → My courses (ST-02) → the course
 * (ST-03) → Meera withdraws the grant with a reason (IA-04) → Rahul's Home and the experiment's
 * refusal (ST-19). One document throughout (ADR-0004): every address is reached by a link or a
 * button, except the one marked TEST NAVIGATION (the app router; a typed address would reset the
 * in-memory world, TE-6).
 */

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

/** From a public page: the header's Sign in (the menu sheet below 1024 px). */
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

const ARJUN = 'Account menu: Arjun Mehta, Super Admin';
const MEERA = 'Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL = 'Account menu: Rahul Verma, Student, Godavari Institute of Technology';
const SHELL = 'Shell-and-Tube Heat Exchanger';
const RAHUL_EMAIL = 'rahul.verma@godavari.edu.in';

test('one tab, the product build: approval → the Institute Admin’s plan, people and Give access → the Student’s access → withdrawal', async ({
  page,
}) => {
  test.slow();
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. The public request (Package 1C), approved by the Super Admin (Package 1A), paid (TE-4).
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open: REQ-0042 · Godavari Institute of Technology' }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
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

  // 2. The Super Admin assigns the Institute Admin (Package 1D, SA-07).
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  const search = page.getByRole('searchbox', { name: 'Search institutions' });
  await reachAndClick(page, search);
  await search.fill('godavari');
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

  // 3. Meera Iyer signs in: her Overview (IA-01) — access active, ACC-0107, what needs her.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await expect(page.getByRole('button', { name: MEERA, exact: true })).toBeVisible();
  const statusLine = main(page).locator('.xw-statusline');
  await expect(statusLine).toContainText('Access active');
  await expect(statusLine).toContainText('Access plan ACC-0107 · 120 licences');
  const attention = page.getByRole('region', { name: 'Needs your attention' });
  await expect(attention).toContainText(`${SHELL} hasn’t been given to any student`);
  await checkState(page, 'Overview');

  // 4. Content access (IA-02) → the plan (IA-03): what BITS gave the institution.
  await sidebar(page, '/institute/content-access');
  await expect(main(page)).toContainText('Access plan ACC-0107');
  await expect(main(page)).toContainText('AR is published but not in your plan');
  await checkState(page, 'Content access');
  await reachAndClick(page, main(page).getByRole('link', { name: 'View access plan ACC-0107' }));
  await page.waitForURL('**/institute/content-access/plans/ACC-0107');
  await expect(main(page)).toContainText('120 — as approved by BITS');
  await checkState(page, 'Access plan ACC-0107');

  // 5. People (IA-06): nobody yet → Add student (IA-10) → Rahul Verma.
  await sidebar(page, '/institute/people');
  await expect(page.getByRole('heading', { name: 'No students yet' })).toBeVisible();
  await checkState(page, 'People');
  await reachAndClick(
    page,
    main(page).locator('.xr-phead').getByRole('link', { name: 'Add student' }),
  );
  await page.waitForURL('**/institute/people/add');
  await checkState(page, 'Add student');
  // The drawn checks first (B2-07 f1): nothing typed.
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
  await expect(main(page).getByRole('alert')).toBeVisible();
  await page.getByLabel('Full name', { exact: true }).fill('Rahul Verma');
  await page.getByLabel(/^Institution e-mail/).fill(RAHUL_EMAIL);
  await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
  await page.getByLabel(/^Programme/).fill('B.Tech Mechanical');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
  await expect(main(page)).toContainText('Rahul Verma is in People now, with no experiments yet.');

  // 6. Give this student access (IA-05): the experiment, Rahul (pre-filled), review, give.
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give this student access' }));
  await page.waitForURL('**/institute/student-access/give?**');
  await expect(main(page)).toContainText('Giving access to Rahul Verma');
  await checkState(page, 'Choose experiments');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('heading', { level: 1, name: 'Choose students' })).toBeVisible();
  await tick(page, page.getByRole('checkbox', { name: /Rahul Verma/ }));
  await checkState(page, 'Choose students');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(
    page.getByRole('heading', { level: 1, name: 'Review and give access' }),
  ).toBeVisible();
  await checkState(page, 'Review and give access');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  const given = page.getByRole('list', { name: 'Access given' });
  await expect(given).toContainText('Rahul Verma');
  await expect(given).toContainText(SHELL);
  await expect(given).toContainText(/SACC-\d{4}/);
  await expect(given).toContainText('Active');

  // 7. Student access (IA-04) lists the grant; the Overview no longer asks for it.
  await reachAndClick(page, main(page).getByRole('link', { name: 'View Student access' }));
  await page.waitForURL((url) => url.pathname === '/institute/student-access');
  const row = main(page).locator('tbody tr', { hasText: 'Rahul Verma' });
  await expect(row).toContainText(SHELL);
  await expect(row).toContainText('Active');
  await checkState(page, 'Student access');
  await sidebar(page, '/institute');
  await expect(attention).not.toContainText(`${SHELL} hasn’t been given to any student`);
  await signOut(page, MEERA);

  // 8. Rahul Verma signs in with the e-mail Meera entered (the sample sign-in, P1-01): his Home
  //    (ST-01) shows the experiment his institution gave him — and only that.
  await signIn(page, RAHUL_EMAIL);
  await page.waitForURL((url) => url.pathname === '/student');
  await expect(page.getByRole('button', { name: RAHUL, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible();
  await checkState(page, 'Hello, Rahul');
  await reachAndClick(page, main(page).getByRole('link', { name: `Open ${SHELL}` }));
  await page.waitForURL('**/student/experiments/shell-and-tube-heat-exchanger');

  // 9. The experiment (ST-05): WEB and VR available to him; AR not included for his institution.
  await expect(page.getByRole('heading', { level: 1, name: SHELL })).toBeVisible();
  await expect(main(page)).toContainText('Not included for your institution');
  await checkState(page, SHELL);
  // My courses (ST-02) → the course (ST-03) → the experiment again.
  await sidebar(page, '/student/courses');
  await checkState(page, 'My courses');
  await reachAndClick(
    page,
    main(page)
      .getByRole('link', { name: /^Open course/ })
      .first(),
  );
  await page.waitForURL('**/student/courses/**');
  await checkState(page, 'Thermodynamics & Heat Transfer');
  await reachAndClick(page, main(page).getByRole('link', { name: `Open ${SHELL}` }));
  await page.waitForURL('**/student/experiments/shell-and-tube-heat-exchanger');
  await signOut(page, RAHUL);

  // 10. Meera withdraws the grant (IA-04, DL-2 with a reason).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/student-access');
  await reachAndClick(
    page,
    main(page).getByRole('button', { name: `Withdraw Rahul Verma’s access to ${SHELL}` }),
  );
  const withdraw = page.getByRole('dialog', { name: 'Withdraw access?' });
  await withdraw.getByLabel(/^Reason/).fill('Given to the wrong student.');
  await reachAndClick(page, withdraw.getByRole('button', { name: 'Withdraw access' }));
  await expect(withdraw).toBeHidden();
  await expect(main(page)).toContainText(
    /Access withdrawn\. SACC-\d{4} was Rahul Verma’s only grant/,
  );
  await expect(
    main(page).getByRole('button', { name: `Withdraw Rahul Verma’s access to ${SHELL}` }),
  ).toHaveCount(0);
  await signOut(page, MEERA);

  // 11. Rahul again: nothing is given to him now; the experiment refuses (ST-19). TEST NAVIGATION:
  //     his earlier address of the experiment, through the app router.
  await signIn(page, RAHUL_EMAIL);
  await page.waitForURL((url) => url.pathname === '/student');
  await expect(main(page)).not.toContainText(`Open ${SHELL}`);
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/student/experiments/shell-and-tube-heat-exchanger',
    );
  });
  await page.waitForURL('**/student/experiments/shell-and-tube-heat-exchanger');
  await expect(
    page.getByRole('heading', { level: 1, name: 'This experiment is no longer given to you' }),
  ).toBeVisible();
  await checkState(page, 'This experiment is no longer given to you');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Back to My courses' }));
  await page.waitForURL((url) => url.pathname === '/student/courses');
  await expectSameDocument(page, mark);
});
