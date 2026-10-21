import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  expectSameDocument,
  markDocument,
  revealSidebar,
  sidebarHelp,
  sidebarLink,
} from '../support/workspace';

/**
 * Phase 6 on the PRODUCT build — one browser tab each, no test hooks, nothing but the screens, at
 * 1440, 1024, 768 and 375, each on its own sample world (a document load starts the world again).
 *
 * Flow F, released and held (Content Manager → Academic Reviewer → Super Admin; BC8, BC9):
 *  0. the public request → approval → the payment stand-in (TE-4) → access active → Meera Iyer
 *     assigned; Meera adds Rahul Verma and gives him Shell-and-Tube Heat Exchanger — an
 *     institution and a Student hold access before any correction;
 *  1. Kavya Nair opens the published experiment (CM-04 → CM-05), “Edit catalogue details” opens the
 *     correction draft (CM-06 → CM-08), she corrects the name and the summary, saves the draft and
 *     sends it for academic review (DL-1) — the public page still shows the live version;
 *  2. Prof. A. Menon reviews the update (RV-02 → RV-04) and approves it (DL-1) — approval releases
 *     nothing: the public page still shows the live version;
 *  3. Arjun Mehta finds it on his Overview (SA-01) and releases it (SA-11, DL-1, never “Publish”);
 *  4. the public catalogue and experiment page (PU-04, PU-06) show the released version, Rahul’s My
 *     courses and experiment page show it, and Meera’s Content access still gives him access
 *     (grants and plans unchanged);
 *  5. a second correction (“Start a correction”) is sent, approved and HELD with a reason — the
 *     released version stays live for the public and for Rahul; Kavya reads “On hold” and the
 *     reason; Release is not offered while it is held.
 *
 * Governance (SA-14 … SA-17): a course renamed reaches the public course page and the Content
 * Manager’s course codes; a reviewer’s scope withdrawn removes the work from his queue and refuses
 * the record’s address, and restored it returns.
 *
 * Operations (SA-20 … SA-22): a Content Manager’s report from Help is resolved with a note she
 * reads, then reopened; Access ending lists a reminder due (nothing is sent) and opens the
 * institution.
 *
 * Every address is reached by a link or a button, except the one client-side push the governance
 * test makes to show a refused address (as `openInTab`, no reload); one document per test.
 */

const SHELL = 'Shell-and-Tube Heat Exchanger';
const SHELL_ID = 'shell-and-tube-heat-exchanger';
const RELEASED_NAME = 'Shell-and-Tube Heat Exchanger Performance';
const RELEASED_SUMMARY =
  'Run counter-flow and parallel-flow tests and find the overall heat-transfer coefficient from your own readings.';
const HELD_SUMMARY = 'A held summary that must never reach the catalogue.';
const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL = 'Account menu, Rahul Verma, Student, Godavari Institute of Technology';
const MENON = 'Account menu, Prof. A. Menon, Academic Reviewer';
const KAVYA = 'Account menu, Kavya Nair, Content Manager';

const card = (page: Page) => page.locator('.xs-card');
const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const button = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
const field = (page: Page, label: string) =>
  main(page).getByRole('textbox', { name: label, exact: true });
const decision = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
/** The Content Manager's V3 correction page (CM-08, CM-v1): its status pill in the identity band. */
const cmChip = (page: Page) => main(page).locator('section.cm-idband .rb-id-status .xr-st');
/** CM-08's labels (CM-v1): what changes and why, and the version label, both required to send. */
const WHY_FIELD = 'Reason for the change (required to send)';
const VERSION_FIELD = 'New version label (required to send)';
/** A name as a pattern, its characters literal. */
const literally = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

/**
 * A tab, a tab link or a view button (CM-04's views, CM-v1): below 1024 px its strip scrolls
 * sideways, so it is brought into view first.
 */
async function pressTab(page: Page, tab: Locator): Promise<void> {
  await tab.scrollIntoViewIfNeeded();
  await reachAndClick(page, tab);
}

async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

/** Replaces a field's text as a person would (select all, type). */
async function retype(page: Page, input: Locator, value: string): Promise<void> {
  await input.click();
  await input.press('ControlOrMeta+a');
  await input.press('Backspace');
  await input.pressSequentially(value);
  await expect(input).toHaveValue(value);
}

/** From the signed-out card to a public experiment page, through the catalogue (PU-04 → PU-06). */
async function publicExperiment(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Back to experiments' }).click();
  await page.waitForURL((url) => url.pathname === '/experiments');
  await reachAndClick(page, main(page).getByRole('link', { name, exact: true }));
  await page.waitForURL(`**/experiments/${SHELL_ID}`);
  await expect(h1(page)).toHaveText(name);
}

/** 0. An institution and a Student hold access to Shell-and-Tube (as the Phase-5 demonstration). */
async function accessBeforeCorrections(page: Page): Promise<void> {
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: 'Open the new access request from Godavari Institute of Technology',
    }),
  );
  const saPanel = decision(page);
  await reachAndClick(page, saPanel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, saPanel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, saPanel.getByRole('button', { name: 'Approve request' }));
  const approveRequest = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await reachAndClick(page, approveRequest.getByRole('button', { name: 'Approve request' }));
  await expect(saPanel.locator('.rk-done .xr-st')).toHaveText('Approved — payment required');
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
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
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
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: Meera Iyer');
  await signOut(page, ARJUN);
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
}

/**
 * The Content Manager's published experiment (CM-04 Published view → CM-05). CM-04 (V3, CM-v1):
 * the views are buttons in “Show experiments that are”, and a row's link is named by the
 * experiment, its course, version and status (“<name>, <code>, version 1.0, published. Open the
 * published experiment”).
 */
async function openPublished(page: Page, name: string): Promise<void> {
  await sidebar(page, '/content-manager/library');
  await pressTab(
    page,
    page
      .getByRole('group', { name: 'Show experiments that are' })
      .getByRole('button', { name: /^Published/ }),
  );
  await page.waitForURL(/\/content-manager\/library\?tab=published$/);
  await reachAndClick(
    page,
    main(page).getByRole('link', {
      name: new RegExp(`^${literally(name)}, .*Open the published experiment$`),
    }),
  );
  await page.waitForURL(`**/content-manager/published/${SHELL_ID}`);
  await expect(h1(page)).toHaveText(name);
}

/** CM-08: send the draft for academic review through DL-1 (V3: “Send the update to <experiment> for academic review?”). */
async function sendForReview(page: Page): Promise<void> {
  // The page's H1 is “Update to <experiment>”: the dialog names the update the same way.
  const title = (await page.getByRole('heading', { level: 1 }).first().textContent())!.trim();
  const experiment = title.replace(/^Update to /, '');
  await reachAndClick(page, button(page, 'Send for academic review'));
  const send = page.getByRole('dialog', {
    name: `Send the update to ${experiment} for academic review?`,
  });
  await expect(send).toBeVisible();
  await reachAndClick(page, send.getByRole('button', { name: 'Send for academic review' }));
  await expect(send).toBeHidden();
  await expect(cmChip(page)).toHaveText('In academic review');
}

/** RV-02 → RV-04 → Approve update (DL-1): approval releases nothing. */
async function approveAsReviewer(page: Page, name: string): Promise<void> {
  await signIn(page, 'a.menon@wilp.example');
  await page.waitForURL((url) => url.pathname === '/reviewer');
  await sidebar(page, '/reviewer/queue');
  // RV-02 (V3, RV-v1): the row's link is named by the experiment, never its reference.
  await reachAndClick(page, main(page).getByRole('link', { name: new RegExp(`^${name}, `) }));
  await page.waitForURL(/\/reviewer\/updates\/UPD-\d{4}$/);
  // RV-04 (V3, RV-v1): choose Approve update, then press it; the dialog names the experiment.
  await reachAndClick(page, decision(page).getByRole('radio', { name: 'Approve update' }));
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Approve update' }));
  const approve = page.getByRole('dialog', { name: `Approve the update to ${name}?` });
  await expect(approve).toContainText('It goes to the Super Admin');
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve update' }));
  await expect(approve).toBeHidden();
  await expect(page.locator('#rv-done .xr-st--ok')).toHaveText('Approved — with the Super Admin');
  await signOut(page, MENON);
}

/**
 * SA-10 Waiting for your decision → SA-11 for the correction of `name` from `from` to `to` (the
 * V3 row link names the correction by its content: SA-v1).
 */
async function openDecision(page: Page, name: string, from: string, to: string): Promise<void> {
  await sidebar(page, '/admin/content/updates');
  await reachAndClick(
    page,
    main(page).getByRole('link', {
      name: `${name} correction, version ${from} to ${to}, Waiting for your decision. Open`,
    }),
  );
  await page.waitForURL(/\/admin\/content\/updates\/UPD-\d{4}$/);
}

test('one tab, the product build: Flow F — a correction released, then another held; the live version, access and the Student follow only the release', async ({
  page,
}) => {
  test.setTimeout(900_000);
  await page.goto('/');
  const mark = await markDocument(page);
  await accessBeforeCorrections(page);

  // 1. Kavya: Content library → the published experiment → Edit catalogue details (CM-06).
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await openPublished(page, SHELL);
  await expect(
    page.getByRole('complementary', { name: 'Corrections' }).getByRole('button'),
  ).toHaveText(['Start a correction', 'Edit catalogue details', 'Edit delivery link']);
  await reachAndClick(page, button(page, 'Edit catalogue details'));
  await page.waitForURL(/\/content-manager\/updates\/UPD-\d{4}\?focus=summary$/);
  // CM-08 (V3, CM-v1): the H1 names the live experiment (“Update to …”) whatever is typed.
  await expect(h1(page)).toHaveText(`Update to ${SHELL}`);
  await expect(field(page, 'Summary')).toBeFocused();
  await retype(page, field(page, 'Name'), RELEASED_NAME);
  await retype(page, field(page, 'Summary'), RELEASED_SUMMARY);
  await field(page, WHY_FIELD).fill(
    'The name and summary now say what the Student measures: the overall heat-transfer coefficient.',
  );
  await field(page, VERSION_FIELD).fill('1.1');
  await reachAndClick(page, button(page, 'Save draft'));
  await expect(main(page).locator('#cm-u-saved')).toContainText('the live version is unchanged');
  await sendForReview(page);
  await checkState(page, `Update to ${SHELL}`);
  await signOut(page, KAVYA);

  // The draft and the review are private: the public page shows the live version.
  await publicExperiment(page, SHELL);
  await expect(page.locator('.xp-xsum')).not.toHaveText(RELEASED_SUMMARY);
  await toSignIn(page);

  // 2. Prof. A. Menon approves the update — nothing is released.
  await approveAsReviewer(page, SHELL);
  await publicExperiment(page, SHELL);
  await expect(main(page)).not.toContainText(RELEASED_SUMMARY);
  await toSignIn(page);

  // 3. Arjun: the Overview names the correction waiting for him; he releases it (never “Publish”).
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await expect(
    main(page).getByRole('link', { name: `Review the ${SHELL} correction` }),
  ).toBeVisible();
  await openDecision(page, SHELL, '1.0', '1.1');
  await expect(h1(page)).toHaveText(SHELL);
  // SA-11 (V3): choose the decision, then confirm it.
  await reachAndClick(page, decision(page).getByRole('radio', { name: 'Release update' }));
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Release update' }));
  const release = page.getByRole('dialog', { name: `Release version 1.1 of ${SHELL}?` });
  await expect(release).toContainText('No institution’s or student’s access changes.');
  await expect(release).not.toContainText('Publish');
  await reachAndClick(page, release.getByRole('button', { name: 'Release update' }));
  await expect(release).toBeHidden();
  await expect(page.locator('#update-decided .xr-st--ok')).toHaveText('Released');
  await checkState(page, SHELL);
  await signOut(page, ARJUN);

  // 4. The public pages show the released version…
  await publicExperiment(page, RELEASED_NAME);
  await expect(page.locator('.xp-xsum')).toHaveText(RELEASED_SUMMARY);
  await toSignIn(page);
  // …so does Rahul's My courses and experiment page: his access is the same grant as before.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await sidebar(page, '/student/courses');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'My courses' }).getByRole('link', { name: 'Experiments' }),
  );
  await expect(main(page)).toContainText(RELEASED_NAME);
  await reachAndClick(page, main(page).getByRole('link', { name: RELEASED_NAME }).first());
  await page.waitForURL(`**/student/experiments/${SHELL_ID}`);
  await expect(h1(page)).toHaveText(RELEASED_NAME);
  await checkState(page, RELEASED_NAME);
  await signOut(page, RAHUL);
  // Meera's institution access is unchanged: the same experiment, still given to Rahul.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/content-access');
  await expect(main(page)).toContainText(RELEASED_NAME);
  await sidebar(page, '/institute/student-access');
  await expect(main(page)).toContainText('Rahul Verma');
  await signOut(page, MEERA);

  // 5. A second correction (“Start a correction”), sent, approved and HELD with a reason.
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await openPublished(page, RELEASED_NAME);
  await reachAndClick(page, button(page, 'Start a correction'));
  await page.waitForURL(/\/content-manager\/updates\/UPD-\d{4}$/);
  await expect(h1(page)).toHaveText(`Update to ${RELEASED_NAME}`);
  await retype(page, field(page, 'Summary'), HELD_SUMMARY);
  await field(page, WHY_FIELD).fill('A second summary correction, to be checked.');
  await field(page, VERSION_FIELD).fill('1.2');
  await sendForReview(page);
  await signOut(page, KAVYA);
  await approveAsReviewer(page, RELEASED_NAME);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await openDecision(page, RELEASED_NAME, '1.1', '1.2');
  // SA-11 (V3): the hold's reason is typed in the panel and quoted in the confirmation.
  await reachAndClick(page, decision(page).getByRole('radio', { name: 'Hold' }));
  await decision(page)
    .getByRole('textbox', { name: 'Reason for the hold (required)' })
    .fill('Version 1.1 stays live while the new summary is checked.');
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Hold update' }));
  const hold = page.getByRole('dialog', { name: `Hold the ${RELEASED_NAME} correction?` });
  await expect(hold).toContainText('Version 1.1 stays live while the new summary is checked.');
  await reachAndClick(page, hold.getByRole('button', { name: 'Hold update' }));
  await expect(hold).toBeHidden();
  await expect(decision(page).getByRole('button')).toHaveText(['Lift hold']);
  await checkState(page, RELEASED_NAME);
  await signOut(page, ARJUN);

  // The held correction reaches no one: the public page and Rahul's keep the released version.
  await publicExperiment(page, RELEASED_NAME);
  await expect(page.locator('.xp-xsum')).toHaveText(RELEASED_SUMMARY);
  await expect(main(page)).not.toContainText(HELD_SUMMARY);
  await toSignIn(page);
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await sidebar(page, '/student/courses');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'My courses' }).getByRole('link', { name: 'Experiments' }),
  );
  await reachAndClick(page, main(page).getByRole('link', { name: RELEASED_NAME }).first());
  await expect(h1(page)).toHaveText(RELEASED_NAME);
  await expect(main(page)).not.toContainText(HELD_SUMMARY);
  await signOut(page, RAHUL);
  // Kavya reads “On hold” and the Super Admin's reason on her Updates.
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await sidebar(page, '/content-manager/updates');
  // CM-08 (V3, CM-v1): the tracker's card for RELEASED_NAME's 1.2 (its version change “1.1 live
  // → 1.2 proposed”), with the others.
  const held = main(page)
    .locator('li.cm-trk')
    .filter({
      has: page.locator('.cm-qname', { hasText: new RegExp(`^${literally(RELEASED_NAME)}$`) }),
    })
    .filter({ has: page.locator('.cm-ver', { hasText: /1\.2 proposed/ }) });
  await expect(held).toContainText('On hold');
  await reachAndClick(page, held.getByRole('link').first());
  await page.waitForURL(/\/content-manager\/updates\/UPD-\d{4}$/);
  await expect(main(page)).toContainText(
    'Version 1.1 stays live while the new summary is checked.',
  );
  await checkState(page, `Update to ${RELEASED_NAME}`);
  await signOut(page, KAVYA);

  await expectSameDocument(page, mark);
});

test('one tab, the product build: governance — a renamed course reaches the public pages and the course codes; a withdrawn reviewer scope stops the queue and the record, a restored one brings them back', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto('/');
  const mark = await markDocument(page);
  const RENAMED = 'Process Instrumentation & Control Systems';

  // Academic structure (SA-14 → SA-15): rename a course with published experiments.
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/structure');
  await expect(h1(page)).toHaveText('Academic structure');
  // The V3 course rows are named by their content (SA-v1 `sa-list-row`).
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: /^Process Instrumentation & Control/ }),
  );
  await page.waitForURL('**/admin/structure/courses/process-instrumentation-control');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Rename' }));
  const rename = page.getByRole('dialog', { name: 'Rename Process Instrumentation & Control' });
  await retype(page, rename.getByRole('textbox').first(), RENAMED);
  await reachAndClick(page, rename.getByRole('button', { name: 'Save name' }));
  await expect(h1(page)).toHaveText(RENAMED);
  await checkState(page, RENAMED);

  // Platform roles (SA-16 → SA-17): withdraw Prof. A. Menon's CHE ZG513 with a reason.
  // The V3 page tabs are links (`nav` "Platform roles"); the holder rows are named by content.
  await sidebar(page, '/admin/roles');
  await reachAndClick(
    page,
    page
      .getByRole('navigation', { name: 'Platform roles' })
      .getByRole('link', { name: /^Reviewers/ }),
  );
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: 'Prof. A. Menon, Academic Reviewer. Open' }),
  );
  await page.waitForURL('**/admin/roles/role-a-menon');
  await reachAndClick(
    page,
    main(page).getByRole('button', { name: /^Withdraw scope CHE ZG513 · / }),
  );
  await main(page)
    .getByRole('textbox', { name: /^Reason for withdrawing CHE ZG513/ })
    .fill('Process control reviews move to another reviewer for this term.');
  await reachAndClick(
    page,
    main(page).locator('.sa-inline').getByRole('button', { name: 'Withdraw scope' }),
  );
  await expect(main(page)).toContainText('Scope withdrawn: CHE ZG513.');
  await signOut(page, ARJUN);

  // The rename reaches the public course page and the Content Manager's course codes.
  await page.getByRole('link', { name: 'Back to experiments' }).click();
  await page.waitForURL((url) => url.pathname === '/experiments');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: 'Distillation Column', exact: true }),
  );
  await page.waitForURL('**/experiments/distillation-column');
  await reachAndClick(page, main(page).getByRole('link', { name: 'View the course' }));
  await page.waitForURL('**/courses/process-instrumentation-control');
  await expect(h1(page)).toHaveText(RENAMED);
  await toSignIn(page);
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await sidebar(page, '/content-manager/course-codes');
  await expect(main(page)).toContainText(RENAMED);
  await signOut(page, KAVYA);

  // The withdrawn scope: Prof. A. Menon's queue no longer lists CHE ZG513 work, and the record's
  // address refuses him.
  await signIn(page, 'a.menon@wilp.example');
  await page.waitForURL((url) => url.pathname === '/reviewer');
  await sidebar(page, '/reviewer/queue');
  await expect(main(page)).not.toContainText('Flash Distillation');
  await openInTab(page, '/reviewer/submissions/SUB-0086');
  await expect(main(page)).not.toContainText('Flash Distillation');
  await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(0);
  await signOut(page, MENON);

  // Restored, the work comes back at once.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/roles');
  await reachAndClick(
    page,
    page
      .getByRole('navigation', { name: 'Platform roles' })
      .getByRole('link', { name: /^Reviewers/ }),
  );
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: 'Prof. A. Menon, Academic Reviewer. Open' }),
  );
  await reachAndClick(
    page,
    main(page).getByRole('button', { name: /^Restore scope CHE ZG513 · / }),
  );
  await reachAndClick(
    page,
    page
      .getByRole('dialog', { name: 'Restore CHE ZG513 for Prof. A. Menon?' })
      .getByRole('button', { name: 'Restore scope' }),
  );
  await signOut(page, ARJUN);
  await signIn(page, 'a.menon@wilp.example');
  await page.waitForURL((url) => url.pathname === '/reviewer');
  await sidebar(page, '/reviewer/queue');
  await expect(main(page)).toContainText('Flash Distillation');
  await signOut(page, MENON);

  await expectSameDocument(page, mark);
});

test('one tab, the product build: operations — a report resolved with a note the reporter reads, then reopened; access ending is a status only', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto('/');
  const mark = await markDocument(page);
  const what = 'The library search showed nothing for a course code.';
  const note = 'Search now covers course codes. Please try again.';

  // Kavya reports a problem from Help (XS-07).
  await toSignIn(page);
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await revealSidebar(page);
  // The rail's (or, below 1024 px, the drawer's) Help & support: the V3 shell (CM-v1).
  await reachAndClick(page, sidebarHelp(page));
  await page.waitForURL('**/content-manager/help');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Report a problem' }));
  await page.getByLabel('What happened?').fill(what);
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  await expect(h1(page)).toHaveText('Report sent');
  const reference = (await main(page).locator('.xs-msg .xs-msg-d b').textContent())!;
  expect(reference).toMatch(/^SUP-\d{4}$/);
  await signOut(page, KAVYA);

  // Arjun: Operations › Support → the report → Resolve with a note.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/operations/device-transfers');
  await pressTab(
    page,
    page.getByRole('navigation', { name: 'Operations' }).getByRole('link', { name: 'Support' }),
  );
  await page.waitForURL('**/admin/operations/support');
  // SA-20 / SA-21 in the V3 design (SA-v1): the row is named by the report's title, never its
  // reference.
  const title = what.replace(/\.$/, '');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: `${title}, Open. Open the report` }),
  );
  await page.waitForURL(`**/admin/operations/support/${reference}`);
  const resolve = page.getByRole('complementary', { name: 'Resolve' });
  await resolve.getByRole('textbox', { name: 'Resolution note (required)' }).fill(note);
  await reachAndClick(page, resolve.getByRole('button', { name: 'Resolve report' }));
  await expect(page.locator('#support-flash')).toContainText('Report resolved.');
  await expect(main(page)).not.toContainText(reference);
  await checkState(page, title);

  // Access ending: a reminder due is a status only; the row opens the institution.
  await sidebar(page, '/admin/operations/device-transfers');
  await pressTab(
    page,
    page
      .getByRole('navigation', { name: 'Operations' })
      .getByRole('link', { name: 'Access ending' }),
  );
  await page.waitForURL('**/admin/operations/access-ending');
  const malnad = main(page).locator('tr, li').filter({ hasText: 'Malnad College of Engineering' });
  await expect(malnad.first()).toContainText('Reminder due');
  await expect(main(page)).toContainText('Nothing is sent from here');
  await checkState(page, 'Operations');
  await reachAndClick(
    page,
    malnad.first().getByRole('link', { name: 'Open Malnad College of Engineering' }),
  );
  await page.waitForURL('**/admin/institutions/malnad');
  await signOut(page, ARJUN);

  // Kavya reads Resolved and the note on her own report.
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await revealSidebar(page);
  // The rail's (or, below 1024 px, the drawer's) Help & support: the V3 shell (CM-v1).
  await reachAndClick(page, sidebarHelp(page));
  const row = main(page).locator('ul.xs-reports a.xs-report', { hasText: reference });
  await expect(row).toContainText('Resolved');
  await reachAndClick(page, row);
  await expect(main(page)).toContainText(`“${note}”`);
  await signOut(page, KAVYA);

  // Arjun reopens it (DL-1); Kavya reads Reopened.
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/operations/device-transfers');
  await pressTab(
    page,
    page.getByRole('navigation', { name: 'Operations' }).getByRole('link', { name: 'Support' }),
  );
  await reachAndClick(
    page,
    page
      .getByRole('group', { name: 'Show support reports' })
      .getByRole('button', { name: /^Resolved/ }),
  );
  await reachAndClick(
    page,
    main(page).getByRole('link', {
      name: `${what.replace(/\.$/, '')}, Resolved. Open the report`,
    }),
  );
  await reachAndClick(page, page.getByRole('button', { name: 'Reopen' }));
  const reopen = page.getByRole('dialog', { name: 'Reopen this report?' });
  await reachAndClick(page, reopen.getByRole('button', { name: 'Reopen' }));
  await expect(page.locator('#support-flash')).toContainText('Report reopened.');
  await signOut(page, ARJUN);
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await revealSidebar(page);
  // The rail's (or, below 1024 px, the drawer's) Help & support: the V3 shell (CM-v1).
  await reachAndClick(page, sidebarHelp(page));
  await expect(
    main(page).locator('ul.xs-reports a.xs-report', { hasText: reference }),
  ).toContainText('Reopened');
  await signOut(page, KAVYA);

  await expectSameDocument(page, mark);
});
