import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { landingSignIn, onLanding } from '../support/landing';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument, revealSidebar, sidebarLink } from '../support/workspace';

/**
 * Flow E on the PRODUCT build — the Phase-5 demonstration in ONE browser tab, no test hooks,
 * nothing but the screens, at 1440, 1024, 768 and 375, on one sample world:
 *
 *  0. the public request → approval → the payment stand-in (TE-4) → access active → Meera Iyer
 *     assigned; Meera adds Rahul Verma and gives him Shell-and-Tube Heat Exchanger (as Phase 4B),
 *     so an institution and a Student hold access before anything is published;
 *  1–3. Anil Shetty creates “Conduction Through a Composite Wall” (VE-03 … VE-06): course and
 *     description, formats and delivery (WEB + VR), preview and documents, check and submit
 *     through DL-1 — “It does not publish anything”;
 *  4. Prof. A. Menon opens it from the Review queue (RV-02 → RV-03) and returns it with a reason
 *     and a reference (DL-2);
 *  5. Anil sees that reason above the editor (VE-01 → VE-08), follows the reference, revises and
 *     resubmits through DL-1 — he reads “Submitted” (M-3; the owner's drawn-default routing
 *     stand-in, PC-66, routes it back to the reviewer as revision 2);
 *  6–7. Prof. A. Menon sees “What changed in revision 2”, records the learning outcomes (LD-3) and
 *     approves through DL-1 — “Approving does not publish it” (RV-06);
 *  8–9. Kavya Nair finds it in Ready to publish (CM-02) and publishes it through DL-1 (CM-03) —
 *     “Publishing gives no one access”;
 *  10. the public catalogue, the course page and the experiment page list it, with the reviewer's
 *     outcomes (PU-04, PU-05, PU-06) — before publication none did;
 *  11. Meera's Content access and Give access, and Rahul's My courses, are unchanged: publication,
 *     institution access and Student access stay separate (BC9).
 *
 * Every address is reached by a link or a button; one document throughout (ADR-0004).
 */

const SHELL = 'Shell-and-Tube Heat Exchanger';
const COMPOSITE = 'Conduction Through a Composite Wall';
const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL = 'Account menu, Rahul Verma, Student, Godavari Institute of Technology';
const ANIL = 'Account menu, Anil Shetty, Vendor, Northline Simulation Studio';
const MENON = 'Account menu, Prof. A. Menon, Academic Reviewer';
const KAVYA = 'Account menu, Kavya Nair, Content Manager';

const CONTENT = {
  summary: 'Heat flow through a wall of several layers.',
  description:
    'Learners build a wall of three layers and compare the temperature profile with the series-resistance model.',
  version: '1.0',
  webLink: 'https://labs.northline.example/composite-wall',
  browser: 'A current browser on a laptop or desktop.',
  packageLabel: 'Composite Wall VR',
  packageReference: 'NSS-CW-VR-1.0',
  device: 'A supported VR headset.',
  install: 'Install it from the lab’s device manager.',
} as const;
const REASON = 'Please name the VR headsets it runs on.';
const REVISED_DEVICE = 'Meta Quest 3 standalone headset — no PC needed.';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

const card = (page: Page) => page.locator('.xs-card');
const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });
const button = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
const decision = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const region = (page: Page, name: string) => page.getByRole('region', { name });
/**
 * An Academic Reviewer's queue row link (V3, RV-v1), named by the experiment and never its
 * reference: “<name>, <type>, waiting since <date>. Review it”.
 */
const reviewRowLink = (page: Page, name: string) =>
  main(page).getByRole('link', { name: new RegExp(`^${name}, `) });

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
  // The landing draws its own header with Sign in at every width (owner decision D-3).
  if (await onLanding(page)) return landingSignIn(page);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await reachAndClick(page, page.locator('header a.xp-signin'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name: 'Sign in' }));
  }
  await page.waitForURL('**/sign-in');
}

async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

/**
 * A press inside a V3 decision panel (CM-03, CM-v1): on wide screens the panel is sticky and, when
 * taller than the window, scrolls on its own; the person brings the control into view first.
 */
async function inPanel(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await reachAndClick(page, target);
}

/** Types into a field as a person would (key by key). */
async function type(field: Locator, value: string): Promise<void> {
  await field.click();
  await field.pressSequentially(value);
}

/** The public catalogue (PU-04) from the public footer, in the same tab. */
async function catalogue(page: Page): Promise<void> {
  // The landing's footer names the catalogue “Catalogue” (frozen 2037).
  const name = (await onLanding(page)) ? 'Catalogue' : 'Browse experiments';
  await reachAndClick(page, page.locator('footer').getByRole('link', { name }));
  await page.waitForURL((url) => url.pathname === '/experiments');
  await expect(main(page).getByRole('heading', { level: 3, name: SHELL })).toBeVisible();
}

test('one tab, the product build: Flow E — create → return with a reason → revise → resubmit → approve with outcomes → publish → listed, no access granted', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto('/');
  const mark = await markDocument(page);

  // 0. An institution and a Student hold access before anything is published (as Phase 4B).
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
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Add student' }),
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
  await sidebar(page, '/institute/content-access');
  await expect(main(page)).toContainText(SHELL);
  await expect(main(page)).not.toContainText(COMPOSITE);
  await signOut(page, MEERA);

  // Before Flow E the public catalogue lists “Composite Wall Conduction” only (two records, BC11).
  await page.getByRole('link', { name: 'Back to experiments' }).click();
  await page.waitForURL((url) => url.pathname === '/experiments');
  await expect(main(page).getByRole('heading', { level: 3, name: SHELL })).toBeVisible();
  await expect(
    main(page).getByRole('heading', { level: 3, name: 'Composite Wall Conduction' }),
  ).toBeVisible();
  await expect(main(page).getByRole('heading', { level: 3, name: COMPOSITE })).toHaveCount(0);

  // 1–3. Anil creates the experiment and submits it for academic review (VE-01 → VE-03 … VE-06).
  await toSignIn(page);
  await signIn(page, 'anil.shetty@northline.example');
  await page.waitForURL((url) => url.pathname === '/vendor');
  // VE-01 (V3, VE-v1): the studio band's heading, "Overview, " for assistive technology.
  await expect(h1(page)).toHaveText('Overview, Northline Simulation Studio');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Create experiment' }).first());
  await page.waitForURL('**/vendor/experiments/new');
  await expect(h1(page)).toHaveText('Course and description');
  await page
    .getByRole('combobox', { name: 'Course' })
    .selectOption({ label: 'ME ZG523 · Thermodynamics & Heat Transfer' });
  // The V3 editor names its sections and steps too ("Course and description"): exact labels.
  await type(page.getByLabel('Experiment name', { exact: true }), COMPOSITE);
  await type(page.getByLabel('Summary', { exact: true }), CONTENT.summary);
  await type(page.getByLabel('Description', { exact: true }), CONTENT.description);
  await type(page.getByLabel('Version', { exact: true }), CONTENT.version);
  await reachAndClick(page, button(page, 'Save draft'));
  // The first save gives the draft its own address (SUB-0077); no word on the page shows the
  // reference (the owner's identifier rule for the Vendor, 22 Oct 2026).
  await page.waitForURL('**/vendor/experiments/SUB-0077/edit');
  await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Only you can see a draft');
  await expect(main(page)).not.toContainText(/\bSUB-\d+/);
  await reachAndClick(page, button(page, 'Continue'));
  await expect(h1(page)).toHaveText('Formats and delivery');
  await reachAndClick(page, page.getByRole('checkbox', { name: /^WEB Browser/ }));
  await reachAndClick(page, page.getByRole('checkbox', { name: /^VR Virtual reality/ }));
  const web = region(page, 'Browser · Web link');
  await type(web.getByLabel('Web link'), CONTENT.webLink);
  await type(web.getByLabel('Browser and computer needed'), CONTENT.browser);
  const vr = region(page, 'Virtual reality · App package');
  await type(vr.getByLabel('Package label'), CONTENT.packageLabel);
  await type(vr.getByLabel('Package reference'), CONTENT.packageReference);
  await type(vr.getByLabel('Device needed'), CONTENT.device);
  await type(vr.getByLabel('Install notes'), CONTENT.install);
  await reachAndClick(page, button(page, 'Continue'));
  await expect(h1(page)).toHaveText('Preview and documents');
  await reachAndClick(page, button(page, 'Continue'));
  await expect(h1(page)).toHaveText('Check and submit');
  await expect(main(page).locator('.rk-notice--ok')).toContainText(
    'Everything required is provided',
  );
  await reachAndClick(page, button(page, 'Submit for academic review'));
  const submit = page.getByRole('dialog', { name: 'Submit for academic review?' });
  await expect(submit).toContainText('It does not publish anything.');
  await reachAndClick(
    page,
    submit.getByRole('button', { name: 'Submit for academic review', exact: true }),
  );
  await expect(h1(page)).toHaveText('Submitted for academic review');
  await checkState(page, 'Submitted for academic review');
  await signOut(page, ANIL);

  // 4. Prof. A. Menon returns it with a reason and a reference (RV-01 → RV-02 → RV-03, DL-2).
  await signIn(page, 'a.menon@wilp.example');
  await page.waitForURL((url) => url.pathname === '/reviewer');
  await expect(h1(page)).toHaveText('Overview');
  await sidebar(page, '/reviewer/queue');
  await reachAndClick(page, reviewRowLink(page, COMPOSITE));
  await page.waitForURL('**/reviewer/submissions/SUB-0077');
  await expect(h1(page)).toHaveText(COMPOSITE);
  // RV-03 (V3, RV-v1): the return is inline in the panel — its reason and references there.
  await reachAndClick(page, decision(page).getByRole('radio', { name: /^Return to vendor/ }));
  await decision(page)
    .getByRole('textbox', { name: 'Reason the vendor will see (required)' })
    .fill(REASON);
  await decision(page)
    .getByRole('group', { name: 'Formats & delivery · VR' })
    .getByRole('checkbox', { name: 'Device need' })
    .check();
  const returnGo = decision(page).getByRole('button', { name: 'Return to vendor' });
  await returnGo.scrollIntoViewIfNeeded();
  await reachAndClick(page, returnGo);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#rv-done .xr-st--err')).toHaveText('Returned to vendor');
  await expect(page.locator('#rv-done')).toContainText(
    'The vendor sees your reason above their editor and can revise and resubmit.',
  );
  await signOut(page, MENON);

  // 5. Anil sees the reason, follows the reference, revises and resubmits (VE-01 → VE-08).
  await signIn(page, 'anil.shetty@northline.example');
  await page.waitForURL((url) => url.pathname === '/vendor');
  // VE-01's lead names its Revise by the experiment and who returned it (VE-v1).
  await reachAndClick(
    page,
    main(page).getByRole('link', {
      name: `Revise ${COMPOSITE}, returned by the Academic Reviewer`,
    }),
  );
  await page.waitForURL('**/vendor/experiments/SUB-0077/revise');
  const returned = region(page, 'Returned by the Academic Reviewer');
  await expect(returned.locator('blockquote')).toHaveText(REASON);
  await checkState(page, 'Course and description');
  await reachAndClick(
    page,
    returned.getByRole('button', { name: 'Go to Formats & delivery · VR · Device need' }),
  );
  await expect(h1(page)).toHaveText('Formats and delivery');
  const device = region(page, 'Virtual reality · App package').getByLabel('Device needed');
  await expect(device).toBeFocused();
  await device.fill('');
  await device.pressSequentially(REVISED_DEVICE);
  await reachAndClick(page, button(page, 'Save changes'));
  await expect(page.locator('#Ve-saved')).toContainText('not resubmitted yet');
  await reachAndClick(page, button(page, 'Continue'));
  await expect(h1(page)).toHaveText('Preview and documents');
  await reachAndClick(page, button(page, 'Continue'));
  await expect(h1(page)).toHaveText('Check and submit');
  await reachAndClick(page, button(page, 'Resubmit'));
  const resubmit = page.getByRole('dialog', { name: 'Resubmit your changes?' });
  await expect(resubmit).toContainText('This does not publish anything.');
  await reachAndClick(page, resubmit.getByRole('button', { name: 'Resubmit', exact: true }));
  // M-3: “Submitted” — the next gate is never named.
  await expect(h1(page)).toHaveText('Submitted');
  await expect(main(page)).toContainText('Your changes have been submitted for review.');
  await expect(main(page)).not.toContainText('Academic Reviewer');
  await signOut(page, ANIL);

  // 6–7. Prof. A. Menon: what changed in revision 2, the outcomes, Approve (DL-1) → RV-06.
  await signIn(page, 'a.menon@wilp.example');
  await page.waitForURL((url) => url.pathname === '/reviewer');
  await sidebar(page, '/reviewer/queue');
  await reachAndClick(page, reviewRowLink(page, COMPOSITE));
  await page.waitForURL('**/reviewer/submissions/SUB-0077');
  // RV-03 (V3, RV-v1): the identity card's type tag and status.
  await expect(main(page).locator('header.rv-idcard .rv-kind')).toHaveText('Resubmittedrevision 2');
  await expect(main(page).locator('header.rv-idcard .rv-meta-main .xr-st')).toHaveText(
    'Waiting for your decision',
  );
  await expect(main(page)).toContainText('What changed in revision 2');
  await expect(main(page)).toContainText(REVISED_DEVICE);
  const add = page.getByRole('textbox', { name: /^Add a learning outcome/ });
  for (const outcome of OUTCOMES) {
    await add.fill(outcome);
    await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
    await expect(add).toHaveValue('');
  }
  await checkState(page, COMPOSITE);
  // Nothing is chosen first (V3, RV-v1): choose Approve, then press it.
  await reachAndClick(page, decision(page).getByRole('radio', { name: /^Approve/ }));
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Approve' }));
  const approve = page.getByRole('dialog', { name: `Approve “${COMPOSITE}”?` });
  await expect(approve).toContainText('Approving does not publish.');
  await approve.getByRole('button', { name: 'Approve' }).click();
  await expect(approve).toBeHidden();
  await expect(page.locator('#rv-done .xr-st--ok')).toHaveText(
    'Approved — with the Content Manager',
  );
  await signOut(page, MENON);

  // Approving published nothing.
  await page.getByRole('link', { name: 'Back to experiments' }).click();
  await page.waitForURL((url) => url.pathname === '/experiments');
  await expect(main(page).getByRole('heading', { level: 3, name: SHELL })).toBeVisible();
  await expect(main(page).getByRole('heading', { level: 3, name: COMPOSITE })).toHaveCount(0);

  // 8–9. Kavya Nair: Ready to publish → the publication decision → Publish (DL-1).
  await toSignIn(page);
  await signIn(page, 'kavya.nair@wilp.example');
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await expect(h1(page)).toHaveText('Overview');
  await sidebar(page, '/content-manager/ready');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: `Open the publication decision for ${COMPOSITE}` }),
  );
  await page.waitForURL('**/content-manager/decisions/SUB-0077');
  await expect(h1(page)).toHaveText(COMPOSITE);
  // CM-03 (V3, CM-v1): nothing is chosen first — choose Publish, then press it. The panel is
  // sticky and scrolls on its own, so it is brought to the control first.
  await inPanel(page, decision(page).getByRole('radio', { name: 'Publish' }));
  await inPanel(page, decision(page).getByRole('button', { name: 'Publish' }));
  const publish = page.getByRole('dialog', { name: `Publish “${COMPOSITE}”?` });
  await expect(publish).toContainText('Publishing gives no one access');
  await reachAndClick(page, publish.getByRole('button', { name: 'Publish' }));
  await expect(publish).toBeHidden({ timeout: 30_000 });
  const published = page.locator('#cm-d-done');
  await expect(published.locator('.xr-st--ok')).toHaveText('Published');
  await expect(published).toContainText('Publishing gave no one access.');
  await checkState(page, COMPOSITE);

  // 10. The public pages list it, with the reviewer's outcomes (PU-06, PU-05, PU-04).
  await inPanel(page, published.getByRole('link', { name: 'View the public page' }));
  await expect(h1(page)).toHaveText(COMPOSITE);
  await expect(page).toHaveURL(/\/experiments\/conduction-through-a-composite-wall$/);
  for (const outcome of OUTCOMES) await expect(main(page)).toContainText(outcome);
  await reachAndClick(page, main(page).getByRole('link', { name: 'View the course' }));
  await page.waitForURL('**/courses/thermodynamics-heat-transfer');
  await expect(main(page).getByRole('heading', { level: 3, name: COMPOSITE })).toBeVisible();
  await catalogue(page);
  await expect(main(page).getByRole('heading', { level: 3, name: COMPOSITE })).toBeVisible();
  await expect(
    main(page).getByRole('heading', { level: 3, name: 'Composite Wall Conduction' }),
  ).toBeVisible();

  // 11. Publication gave no one access: Meera's Content access and Give access, Rahul's courses.
  // Back (in the tab's history) to the decision page, where Kavya signs out.
  for (let back = 0; back < 3; back += 1) await page.goBack();
  await page.waitForURL('**/content-manager/decisions/SUB-0077');
  await signOut(page, KAVYA);
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/content-access');
  await expect(main(page)).toContainText(SHELL);
  await expect(main(page)).not.toContainText(COMPOSITE);
  await sidebar(page, '/institute/student-access');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give students access' }));
  await page.waitForURL('**/institute/student-access/give**');
  await expect(page.getByRole('checkbox', { name: new RegExp(SHELL) })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: new RegExp(COMPOSITE) })).toHaveCount(0);
  await signOut(page, MEERA);
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await sidebar(page, '/student/courses');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'My courses' }).getByRole('link', { name: 'Experiments' }),
  );
  await expect(main(page)).toContainText(SHELL);
  await expect(main(page)).not.toContainText(COMPOSITE);
  await signOut(page, RAHUL);

  await expectSameDocument(page, mark);
});
