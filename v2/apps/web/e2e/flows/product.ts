import { expect, type Locator, type Page } from '@playwright/test';

import { addShellAndTube, fillDetails, headerLink, panelOf, shown, wide } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { revealSidebar, sidebarLink } from '../support/workspace';

/**
 * Phase 7 — the product-build helpers of the flow walk-throughs (`walkthrough.spec.ts`,
 * `alternates.spec.ts`): the same ordinary interactions the Phase 1–6 demonstrations make (a link,
 * a button, a field), gathered once. No test hook, boot descriptor or fixture: every world here is
 * the local prototype build's own (spine-start + the P3-03 device), kept in the browser (TE-6).
 */

export const SHELL = 'Shell-and-Tube Heat Exchanger';
export const SHELL_ID = 'shell-and-tube-heat-exchanger';
export const THERMO = 'Thermodynamics & Heat Transfer';
export const COMPOSITE = 'Conduction Through a Composite Wall';

export const EMAIL = {
  arjun: 'arjun.mehta@wilp.example',
  meera: 'meera.iyer@godavari.edu.in',
  rahul: 'rahul.verma@godavari.edu.in',
  ranganathan: 's.ranganathan@godavari.edu.in',
  anil: 'anil.shetty@northline.example',
  menon: 'a.menon@wilp.example',
  kavya: 'kavya.nair@wilp.example',
} as const;

export const ACCOUNT = {
  arjun: 'Account menu, Arjun Mehta, Super Admin',
  meera: 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology',
  rahul: 'Account menu, Rahul Verma, Student, Godavari Institute of Technology',
  ranganathan: 'Account menu, Dr S. Ranganathan, Faculty, Godavari Institute of Technology',
  anil: 'Account menu, Anil Shetty, Vendor, Northline Simulation Studio',
  menon: 'Account menu, Prof. A. Menon, Academic Reviewer',
  kavya: 'Account menu, Kavya Nair, Content Manager',
} as const;

export const main = (page: Page) => page.locator('main');
export const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
export const card = (page: Page) => page.locator('.xs-card');
export const button = (page: Page, name: string) =>
  main(page).getByRole('button', { name, exact: true });
export const decision = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
export const region = (page: Page, name: string) => page.getByRole('region', { name });
/**
 * The Content Manager's V3 pages (CM-v1): the status pill in the identity band of CM-03, CM-05 and
 * CM-08 (`section.rb-id.cm-idband` > `div.rb-id-status` > `span.xr-st`).
 */
export const cmChip = (page: Page) =>
  main(page).locator('section.cm-idband .rb-id-status > .xr-st');
/** A name as a pattern, its characters literal. */
export const literally = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Signs in on the sign-in card the page is on (the sample sign-in, P1-01). */
export async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
  await page.waitForURL((url) => url.pathname !== '/sign-in');
}

/** Signs out through the account menu (XS-05) to the signed-out card. */
export async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

/** From a public page: the header's Sign in (the menu sheet below 1024 px). */
export async function toSignIn(page: Page): Promise<void> {
  if (wide(page)) await reachAndClick(page, page.locator('header a.xp-signin'));
  else await headerLink(page, 'Sign in');
  await page.waitForURL('**/sign-in');
}

export async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await page.waitForURL((url) => url.pathname === href);
}

/** A drawn checkbox, ticked by a pointer click on its label (the v46 control draws the box). */
export async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

export async function choose(radio: Locator): Promise<void> {
  await radio.scrollIntoViewIfNeeded();
  await radio.check();
  await expect(radio).toBeChecked();
}

/** Replaces a field's text as a person would (select all, type). */
export async function retype(input: Locator, value: string): Promise<void> {
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.press('Backspace');
  await input.pressSequentially(value);
  await expect(input).toHaveValue(value);
}

/** Types into a field key by key. */
export async function type(field: Locator, value: string): Promise<void> {
  await field.click();
  await field.pressSequentially(value);
}

/** The public catalogue (PU-04) from the public footer, in the same tab. */
export async function catalogue(page: Page): Promise<void> {
  await reachAndClick(
    page,
    page.locator('footer').getByRole('link', { name: 'Browse experiments' }),
  );
  await page.waitForURL((url) => url.pathname === '/experiments');
}

/**
 * The sample resource links end in `.example`: a new tab opened on one gets a stand-in page, never
 * the network (the product opens them as they are published).
 */
export async function stubExampleLinks(page: Page): Promise<void> {
  await page.context().route(/\.example\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="en"><title>Stand-in</title><p>Stand-in</p></html>',
    }),
  );
}

/** A1 → A2 in the visitor's tab: the catalogue → Shell-and-Tube → selection → request; the status address. */
export async function requestShellAndTube(page: Page): Promise<string> {
  await catalogue(page);
  await reachAndClick(page, main(page).getByRole('link', { name: SHELL, exact: true }));
  await page.waitForURL(`**/experiments/${SHELL_ID}`);
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  await expect(h1(page)).toHaveText('Your selection');
  await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
  await page.waitForURL('**/request-access');
  await fillDetails(page);
  await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
  await page.waitForURL('**/request-access?step=review');
  await reachAndClick(page, page.getByRole('button', { name: 'Submit request' }));
  await page.waitForURL('**/request-access/sent');
  await expect(h1(page)).toHaveText('Request sent');
  const address = await page
    .getByRole('link', { name: 'Check request status' })
    .getAttribute('href');
  expect(address).toMatch(/^\/requests\/rq-\d{4}$/);
  return address!;
}

/** A3: the Super Admin (signed in) approves REQ-0042 from the Overview, External. */
export async function approveRequestExternal(page: Page): Promise<void> {
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: 'Open the new access request from Godavari Institute of Technology',
    }),
  );
  await page.waitForURL('**/admin/requests/REQ-0042');
  const panel = decision(page);
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const confirm = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await reachAndClick(page, confirm.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Approved — payment required');
}

/** B1: the Super Admin (signed in) assigns Meera Iyer from Institutions › Godavari (SA-06 → SA-07). */
export async function assignMeera(page: Page): Promise<void> {
  await sidebar(page, '/admin/institutions');
  // SA-06 (V3, SA-v1): the row's link is named by the institution and its status.
  await reachAndClick(
    page,
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  // SA-07: Assign is the first action of the "What you can do" panel.
  await reachAndClick(
    page,
    page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill(EMAIL.meera);
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: Meera Iyer');
}

/** B3: Meera (signed in) adds Rahul Verma (IA-10) and gives him Shell-and-Tube (IA-05). */
export async function addRahulWithShell(page: Page): Promise<void> {
  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Add student' }),
  );
  await page.waitForURL('**/institute/people/add**');
  await page.getByLabel('Full name', { exact: true }).fill('Rahul Verma');
  await page.getByLabel(/^Institution e-mail/).fill(EMAIL.rahul);
  await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
  await expect(main(page)).toContainText('Rahul Verma is in People now, with no experiments yet.');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give this student access' }));
  await page.waitForURL('**/institute/student-access/give?**');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  const given = page.getByRole('list', { name: 'Access given' });
  await expect(given).toContainText('Rahul Verma');
  await expect(given).toContainText('Active');
}

/** My device (ST-18), from the Student's account menu. */
export async function myDevice(page: Page): Promise<void> {
  await page.getByRole('button', { name: ACCOUNT.rahul, exact: true }).click();
  await page.locator('.xs-menu').getByRole('link', { name: 'My device' }).click();
  await page.waitForURL('**/student/device');
}

/**
 * CM-04 Published view → CM-05, for the Content Manager (signed in). CM-04 (V3, CM-v1): the views
 * are buttons in “Show experiments that are”; a row's link is named by the experiment, its course,
 * version and status (“<name>, <code>, version 1.0, published. Open the published experiment”).
 */
export async function openPublished(page: Page, name: string, id = SHELL_ID): Promise<void> {
  await sidebar(page, '/content-manager/library');
  const view = page
    .getByRole('group', { name: 'Show experiments that are' })
    .getByRole('button', { name: /^Published/ });
  await view.scrollIntoViewIfNeeded();
  await reachAndClick(page, view);
  await page.waitForURL(/\/content-manager\/library\?tab=published$/);
  await reachAndClick(
    page,
    main(page).getByRole('link', {
      name: new RegExp(`^${literally(name)}, .*Open the published experiment$`),
    }),
  );
  await page.waitForURL(`**/content-manager/published/${id}`);
  await expect(h1(page)).toHaveText(name);
}

/** CM-08: sends the draft correction for academic review (DL-1; V3: “Send the update to <experiment> for academic review?”). */
export async function sendForReview(page: Page): Promise<void> {
  // The page's H1 is “Update to <experiment>”: the dialog names the update the same way.
  const title = (await page.getByRole('heading', { level: 1 }).first().textContent())!.trim();
  const experiment = title.replace(/^Update to /, '');
  await reachAndClick(page, button(page, 'Send for academic review'));
  const send = page.getByRole('dialog', {
    name: `Send the update to ${experiment} for academic review?`,
  });
  await reachAndClick(page, send.getByRole('button', { name: 'Send for academic review' }));
  await expect(send).toBeHidden();
  await expect(cmChip(page)).toHaveText('In academic review');
}

/** SA-10 → SA-11 for the update whose row matches `title`, for the Super Admin (signed in). */
export async function openUpdateDecision(page: Page, title: RegExp): Promise<void> {
  await sidebar(page, '/admin/content/updates');
  // SA-10 (V3, SA-v1): the row's link is named by the correction's content, never its reference.
  const row = main(page).locator('table.rk-table tbody tr').filter({ hasText: title });
  await expect(row).toHaveCount(1);
  await reachAndClick(page, row.locator('a.rk-rowlink'));
  await page.waitForURL(/\/admin\/content\/updates\/UPD-\d{4}$/);
}

/** SA-10's Content sub-navigation → SA-12 All content, for the Super Admin (signed in). */
export async function allContent(page: Page): Promise<void> {
  await sidebar(page, '/admin/content/updates');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Content' }).getByRole('link', { name: 'All content' }),
  );
  await page.waitForURL((url) => url.pathname === '/admin/content/all');
}
