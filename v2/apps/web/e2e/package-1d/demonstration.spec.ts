import { expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar, sidebarLink } from '../support/workspace';
import { openInTab, sendRequest, statusHead } from '../package-1c/flow';

/**
 * The Package-1D demonstration (owner §6), in ONE browser tab of the PRODUCT build — no test
 * hooks, no boot descriptor, nothing but the screens — at 1440, 1024, 768 and 375, continuing the
 * Package-1C journey on the same sample world: the public request → the Super Admin approves it on
 * SA-03 → the requester pays (the TE-4 stand-in) → access active → the Super Admin's Overview
 * (SA-01) → Institutions (SA-06): the newly activated Godavari Institute of Technology, "Needs one"
 * → its detail (SA-07): Assign Institute Admin (the drawn checks first) → Pause and Restore (a
 * reason each) → sign out → Meera Iyer signs in with the work e-mail just assigned: her own
 * workspace, her institution's request at its address, and the Super Admin's pages refused → sign
 * out → the Super Admin again, on the same world. One document throughout (ADR-0004): every
 * address is reached by a link or through the app router, never typed into the bar.
 */

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
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await page.waitForURL(`**${href}`);
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

const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const main = (page: Page) => page.locator('main');
// The Super Admin's V3 pages (SA-v1): the flash is the kit's notice; rows never show a reference.
const flash = (page: Page) => page.locator('main .rk-notice--ok[role="status"]');
const godavariRow = (page: Page) =>
  main(page).locator('tbody tr', { hasText: 'Godavari Institute of Technology' });
const actions = (page: Page) => page.getByRole('complementary', { name: 'What you can do' });

test('one tab, the product build: request → approval → payment → Overview → Institutions → Assign, Pause, Restore → the Institute Admin', async ({
  page,
}) => {
  test.slow();
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. The public request (Package 1C), from this browser session.
  const address = await sendRequest(page);
  await expect(main(page)).toContainText('Your reference is REQ-0042.');
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await page.waitForURL(`**${address}`);

  // 2. The Super Admin signs in on this tab: his base is SA-01 Overview, REQ-0042 in its group.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  const requests = page.getByRole('region', { name: /^Requests/ });
  await expect(requests.locator('.rb-row-t').first()).toHaveText(
    'Godavari Institute of Technology asks for new access',
  );
  await checkState(page, 'Overview');

  // 3. Its row opens SA-03: approve, External.
  await reachAndClick(
    page,
    requests.getByRole('link', {
      name: 'Open the new access request from Godavari Institute of Technology',
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const approve = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Approved — payment required');

  // 4. Before the payment: Godavari exists, approved — payment required; no Institute Admin yet.
  await sidebar(page, '/admin/institutions');
  await expect(godavariRow(page)).toContainText('Approved — payment required');
  await expect(godavariRow(page)).toContainText('No access plan yet · 1 experiment requested');
  await expect(godavariRow(page).locator('.rk-tag-warn')).toHaveCount(0);
  await signOut(page, ARJUN);

  // 5. The requester pays (the TE-4 stand-in confirms): access active, ACC-0107.
  await openInTab(page, address);
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');

  // 6. The Super Admin again: SA-06 lists Godavari as active, without an Institute Admin.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await expect(requests).toBeVisible();
  await expect(requests).not.toContainText('Godavari Institute of Technology');
  await sidebar(page, '/admin/institutions');
  await expect(godavariRow(page)).toContainText('External');
  await expect(godavariRow(page)).toContainText('1 course · 1 experiment');
  await expect(godavariRow(page)).not.toContainText('ACC-0107');
  await expect(godavariRow(page)).toContainText('Access active');
  await expect(godavariRow(page).locator('.rk-tag-warn')).toHaveText('Needs one');
  // The Status filter (SA-v1 draws a select where B7-02 drew tabs) finds the institutions
  // without an Institute Admin.
  const status = main(page).getByLabel('Status');
  await status.selectOption(
    (await status.locator('option', { hasText: 'No Institute Admin' }).getAttribute('value'))!,
  );
  await expect(main(page).locator('tbody a.rk-rowlink')).toContainText([
    'Godavari Institute of Technology',
  ]);
  await checkState(page, 'Institutions');

  // 7. SA-07: Assign the Institute Admin — the drawn checks, then Meera Iyer.
  await reachAndClick(
    page,
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await checkState(page, 'Godavari Institute of Technology');
  await expect(main(page)).toContainText(
    'Nobody at this institution can give students access until you assign one.',
  );
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
  await expect(assign).toContainText('Enter a work e-mail address');
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(flash(page)).toContainText(
    'Meera Iyer is now the Institute Admin for Godavari Institute of Technology.',
  );
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: Meera Iyer');

  // 8. Pause, then Restore — a reason each time, kept in the history.
  await reachAndClick(page, page.getByRole('button', { name: 'Pause access' }));
  const pause = page.getByRole('dialog', {
    name: 'Pause access for Godavari Institute of Technology?',
  });
  await pause.getByRole('textbox').fill('Checking the student list.');
  await reachAndClick(page, pause.getByRole('button', { name: 'Pause access' }));
  await expect(flash(page)).toContainText('Access paused.');
  await expect(flash(page)).toContainText(
    'Everyone at Godavari Institute of Technology now sees the paused banner.',
  );
  await reachAndClick(page, actions(page).getByRole('button', { name: 'Restore access' }));
  const restore = page.getByRole('dialog', {
    name: 'Restore access for Godavari Institute of Technology?',
  });
  await restore.getByRole('textbox').fill('The student list is confirmed.');
  await reachAndClick(page, restore.getByRole('button', { name: 'Restore access' }));
  await expect(flash(page)).toHaveText(
    'Access restored.Godavari Institute of Technology can work again.',
  );
  await expect(page.getByRole('region', { name: 'History' }).locator('.rk-tl-w')).toContainText([
    'Access restored by Arjun Mehta',
    'Access paused by Arjun Mehta',
    'Institute Admin assigned: Meera Iyer',
  ]);
  await checkState(page, 'Godavari Institute of Technology');
  await signOut(page, ARJUN);

  // 9. Meera Iyer signs in with the work e-mail just assigned (the sample sign-in, P1-01).
  await signIn(page, 'meera.iyer@godavari.edu.in');
  // Her base is IA-01 Overview since Package 2A (before, the interim landing: Help).
  await page.waitForURL(/\/institute$/);
  await expect(page.getByRole('button', { name: MEERA, exact: true })).toBeVisible();
  await checkState(page, 'Overview');
  // Her institution's request, at its address (ADR-0009: the requesting institution's Institute
  // Admin may open it), and the Super Admin's pages refused in her own shell.
  await openInTab(page, address);
  await expect(statusHead(page)).toContainText('Access active');
  await openInTab(page, '/admin/institutions/godavari');
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
  await expect(main(page)).not.toContainText('Pause access');
  await signOut(page, MEERA);

  // 10. The Super Admin again, on the same world: Godavari has its Institute Admin.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  await expect(godavariRow(page)).toContainText('Meera Iyer');
  await expect(godavariRow(page).locator('.rk-tag-warn')).toHaveCount(0);
  await expectSameDocument(page, mark);
});
