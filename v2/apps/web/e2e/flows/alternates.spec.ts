import { expect, type Locator, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  ACCOUNT,
  allContent,
  button,
  cmChip,
  COMPOSITE,
  decision,
  EMAIL,
  h1,
  main,
  openPublished,
  openUpdateDecision,
  region,
  retype,
  sendForReview,
  SHELL,
  SHELL_ID,
  sidebar,
  signIn,
  signOut,
  toSignIn,
  type,
} from './product';

/**
 * Phase 7 — the PRODUCT build's coverage of the drawn alternates of Flows E and F that the register
 * (`registry.ts`) names this file for. Each test runs on a sample world of its own (a fresh browser
 * context: the local prototype build's own world, TE-6) and reaches every screen as a person does —
 * the sign-in card, the sidebar, links, buttons, fields and dialogs; no test hook, boot descriptor
 * or fixture. Each asserts the role-relative words the frozen boards draw for its alternate on the
 * screen that shows them (B7-06 draws no Vendor-side words for E-alt3's override: none asserted)
 * and one failure case. E-alt1 and E-alt2 start from SUB-0077 as the Phase-5 demonstration submits
 * and approves it, E-alt3 from the seeded stuck SUB-0085, and Flow F's from a correction of
 * Shell-and-Tube's summary as the Phase-6 demonstration sends it. The Super Admin's screens
 * (SA-10 … SA-13) are the V3 Refined B ones (SA-v1): they never show a reference, so a record is
 * the one whose link opens its address, and rows and dialogs are named by their content.
 */
test.skip(
  ({ viewport }) => viewport?.width !== 1440,
  'Width-independent flow: the screens are proved at every width by their own phase suites.',
);

type Person = 'anil' | 'menon' | 'kavya' | 'arjun';

/** Where each sample person lands after signing in: their Overview. */
const OVERVIEW: Readonly<Record<Person, string>> = {
  anil: '/vendor',
  menon: '/reviewer',
  kavya: '/content-manager',
  arjun: '/admin',
};

/** Flow E's submission, as Anil Shetty types it (the Phase-5 demonstration's content). */
const SUB = 'SUB-0077';
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
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];
const RECHECK_REASON = 'Please re-check the second outcome against the description.';
const VENDOR_REASON = 'Say in the summary which three layers the wall has.';

/** The seeded stuck record: no Academic Reviewer has its course in scope. */
const STUCK = { id: 'SUB-0085', name: 'DC Motor Speed Control' } as const;
const OVERRIDE_REASON = 'No reviewer for Electrical Machines until November.';

/** Flow F's correction of Shell-and-Tube's summary (the Phase-6 demonstration's first one). */
const CORRECTED_SUMMARY =
  'Run counter-flow and parallel-flow tests and find the overall heat-transfer coefficient from your own readings.';
const WHY =
  'The summary now says what the Student measures: the overall heat-transfer coefficient.';
const HOLD_REASON = 'Version 1.0 stays live while the new summary is checked.';
/** CM-08's H1 for Shell-and-Tube's correction (V3, CM-v1: the live experiment's name). */
const UPDATE_TITLE = `Update to ${SHELL}`;
const RETURN_REASON = 'Please name the readings the coefficient is found from.';
const WITHDRAW_REASON = 'Raised by mistake — the vendor is rewriting the summary first.';

const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');
/** The Vendor's V3 record (VE-07, VE-v1): the status pill in the page head's meta. */
const vendorChip = (page: Page) => main(page).locator('.rk-head .rk-meta .xr-st');
const field = (page: Page, label: string) =>
  main(page).getByRole('textbox', { name: label, exact: true });
/** CM-08's labels (V3, CM-v1): what changes and why, and the version label, both required to send. */
const WHY_FIELD = 'Reason for the change (required to send)';
const VERSION_FIELD = 'New version label (required to send)';
/** CM-03's result after a decision (V3, CM-v1: `#cm-d-done`, focused). */
const cmDone = (page: Page) => page.locator('#cm-d-done');
/** CM-08's state notice in the “Your update” panel (V3, CM-v1: `#cm-u-state`). */
const cmState = (page: Page) => page.locator('#cm-u-state');
const rows = (page: Page) => main(page).locator('table.xr-table tbody tr');

// The Super Admin's V3 screens (SA-v1): the kit's page head, record table and status chips.
const saChip = (page: Page) => main(page).locator('.rk-head .rk-meta .xr-st');
const saRows = (page: Page) => main(page).locator('table.rk-table tbody tr');
/** The SA-10 / SA-12 row whose link opens `href` (the reference is the address, never shown). */
const saRow = (page: Page, href: string) =>
  saRows(page).filter({ has: page.locator(`a.rk-rowlink[href="${href}"]`) });
const statusFilter = (page: Page) => page.getByRole('combobox', { name: 'Workflow status' });

/** A Super Admin decision's flash (`.rk-notice--ok`, announced): its title, its line; it has focus. */
async function expectFlash(page: Page, title: string, line: string): Promise<void> {
  const flash = main(page)
    .locator('.rk-notice--ok[role="status"]')
    .filter({ has: page.locator('.rk-notice-t', { hasText: title }) });
  await expect(flash.locator('.rk-notice-t')).toHaveText(title);
  await expect(flash.locator('.rk-notice-d')).toHaveText(line);
  await expect(flash).toBeFocused();
}

/** Signs in on the card on show as one of the sample people; their Overview opens. */
async function startAs(page: Page, person: Person): Promise<void> {
  await signIn(page, EMAIL[person]);
  await page.waitForURL((url) => url.pathname === OVERVIEW[person]);
}

/** E1 (VE-01 → VE-03 … VE-06), as the Phase-5 demonstration: Anil creates and submits SUB-0077. */
async function submitComposite(page: Page): Promise<void> {
  await toSignIn(page);
  await startAs(page, 'anil');
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
  await page.waitForURL(`**/vendor/experiments/${SUB}/edit`);
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
  await reachAndClick(
    page,
    submit.getByRole('button', { name: 'Submit for academic review', exact: true }),
  );
  await expect(h1(page)).toHaveText('Submitted for academic review');
  await signOut(page, ACCOUNT.anil);
}

/** E3 (RV-02 → RV-03), as the Phase-5 demonstration: Prof. A. Menon adds outcomes and approves. */
async function approveComposite(page: Page): Promise<void> {
  await startAs(page, 'menon');
  await sidebar(page, '/reviewer/queue');
  await reachAndClick(page, main(page).getByRole('link', { name: `Review ${COMPOSITE}` }));
  await page.waitForURL(`**/reviewer/submissions/${SUB}`);
  await expect(h1(page)).toHaveText(COMPOSITE);
  const add = page.getByRole('textbox', { name: /^Add a learning outcome/ });
  for (const outcome of OUTCOMES) {
    await add.fill(outcome);
    await reachAndClick(page, page.getByRole('button', { name: 'Add outcome' }));
    await expect(add).toHaveValue('');
  }
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Approve' }));
  const approve = page.getByRole('dialog', { name: `Approve “${COMPOSITE}”?` });
  await expect(approve).toContainText('Approving does not publish it.');
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve' }));
  await expect(approve).toBeHidden();
  await expect(page.locator('#rv-dec .xr-status--ok')).toHaveText(
    'Approved — with the Content Manager',
  );
  await signOut(page, ACCOUNT.menon);
}

/**
 * A press inside a V3 decision panel (CM-03, CM-v1): on wide screens the panel is sticky and, when
 * taller than the window, scrolls on its own; the person brings the control into view first.
 */
async function inPanel(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await reachAndClick(page, target);
}

/**
 * E4's screens (CM-02 → CM-03): Kavya Nair opens SUB-0077's decision and chooses Send back. CM-03
 * (V3, CM-v1) sends back inline in its “Your decision” panel (no dialog): answers the panel.
 */
async function openSendBack(page: Page): Promise<Locator> {
  await startAs(page, 'kavya');
  await sidebar(page, '/content-manager/ready');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: `Open the publication decision for ${COMPOSITE}` }),
  );
  await page.waitForURL(`**/content-manager/decisions/${SUB}`);
  await expect(h1(page)).toHaveText(COMPOSITE);
  await expect(cmChip(page)).toHaveText('Ready to publish');
  const panel = decision(page);
  await inPanel(page, panel.getByRole('radio', { name: 'Send back' }));
  await expect(panel.getByRole('group', { name: /^Send it to/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Send back' })).toBeVisible();
  return panel;
}

/** VE-02 → VE-07: Anil Shetty signs in and opens his own record of SUB-0077. */
async function vendorRecord(page: Page): Promise<void> {
  await startAs(page, 'anil');
  await sidebar(page, '/vendor/experiments');
  // VE-02 (V3): the row's link is named by the experiment, its ID, status and last change.
  await reachAndClick(page, main(page).getByRole('link', { name: new RegExp(`^${COMPOSITE}, `) }));
  await page.waitForURL(`**/vendor/experiments/${SUB}`);
  await expect(h1(page)).toHaveText(COMPOSITE);
}

/**
 * F1 (CM-05 → CM-06 → CM-08), as the Phase-6 demonstration: Kavya Nair corrects Shell-and-Tube's
 * summary, saves the draft and sends it for academic review, then signs out. Answers the update's
 * reference and the live summary the draft started from.
 */
async function sendShellCorrection(page: Page): Promise<{ id: string; live: string }> {
  await startAs(page, 'kavya');
  await openPublished(page, SHELL);
  await reachAndClick(page, button(page, 'Edit catalogue details'));
  await page.waitForURL(/\/content-manager\/updates\/UPD-\d{4}\?focus=summary$/);
  const id = /UPD-\d{4}/.exec(page.url())![0];
  // CM-08 (V3, CM-v1): the H1 names the live experiment, “Update to …”.
  await expect(h1(page)).toHaveText(UPDATE_TITLE);
  const summary = field(page, 'Summary');
  await expect(summary).toBeFocused();
  await expect(summary).not.toHaveValue('');
  const live = await summary.inputValue();
  await retype(summary, CORRECTED_SUMMARY);
  await field(page, WHY_FIELD).fill(WHY);
  await field(page, VERSION_FIELD).fill('1.1');
  await reachAndClick(page, button(page, 'Save draft'));
  await expect(main(page).locator('#cm-u-saved')).toContainText('the live version is unchanged');
  await sendForReview(page);
  await signOut(page, ACCOUNT.kavya);
  return { id, live };
}

/** F2 (RV-02 → RV-04): Prof. A. Menon opens the correction from his Review queue. */
async function reviewShellCorrection(page: Page, id: string): Promise<void> {
  await startAs(page, 'menon');
  await sidebar(page, '/reviewer/queue');
  await reachAndClick(page, main(page).getByRole('link', { name: `Review ${SHELL}` }));
  await page.waitForURL(`**/reviewer/updates/${id}`);
  await expect(h1(page)).toHaveText(`${SHELL} · 1.0 → 1.1`);
  await expect(chip(page)).toHaveText('Waiting for your decision');
}

/**
 * CM Updates → CM-08: the Content Manager (signed in) opens the update from her list. CM-08 (V3,
 * CM-v1): a card's action is named “Open|Continue <id>, <name>, <status>”.
 */
async function openUpdate(page: Page, id: string): Promise<void> {
  await sidebar(page, '/content-manager/updates');
  await reachAndClick(
    page,
    main(page).getByRole('link', { name: new RegExp(`^(Open|Continue) ${id}, ${SHELL}, `) }),
  );
  await page.waitForURL(`**/content-manager/updates/${id}`);
  await expect(h1(page)).toHaveText(UPDATE_TITLE);
}

/** From the signed-out card to Shell-and-Tube's public page (PU-04 → PU-06). */
async function publicShell(page: Page): Promise<void> {
  await reachAndClick(page, page.getByRole('link', { name: 'Back to experiments' }));
  await page.waitForURL((url) => url.pathname === '/experiments');
  await reachAndClick(page, main(page).getByRole('link', { name: SHELL, exact: true }));
  await page.waitForURL(`**/experiments/${SHELL_ID}`);
  await expect(h1(page)).toHaveText(SHELL);
}

test('E-alt1 · the Content Manager sends an approved submission back to the Academic Reviewer for a re-check', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await submitComposite(page);
  await approveComposite(page);

  // CM-03 Send back (inline in the panel, V3): nobody chosen and no reason — both errors at once,
  // nothing is sent.
  const panel = await openSendBack(page);
  await inPanel(page, panel.getByRole('button', { name: 'Send back' }));
  await expect(panel.locator('.rk-ferr')).toHaveText([
    'Choose who it goes back to',
    'Add a reason so they know what to change',
  ]);
  await expect(cmChip(page)).toHaveText('Ready to publish');
  await inPanel(page, panel.getByRole('radio', { name: 'Academic Reviewer' }));
  await type(
    panel.getByRole('textbox', { name: 'Reason the Academic Reviewer will see (required)' }),
    RECHECK_REASON,
  );
  await inPanel(page, panel.getByRole('button', { name: 'Send back' }));
  await expect(cmDone(page)).toBeFocused({ timeout: 30_000 });
  await expect(cmDone(page).locator('.rk-done-meta')).toHaveText(/^Sent back by you on /);
  await expect(cmDone(page).locator('.xr-st')).toHaveText('Back with the Academic Reviewer');
  await expect(cmChip(page)).toHaveText('Back with the Academic Reviewer');
  await signOut(page, ACCOUNT.kavya);

  // VE-07: “With Academic Reviewer” — nothing is needed from Anil; the reason is not his to read.
  await vendorRecord(page);
  await expect(vendorChip(page)).toHaveText('With Academic Reviewer');
  await expect(main(page).locator('.rk-notice').first().locator('.rk-notice-t')).toHaveText(
    'Back with the Academic Reviewer for a re-check',
  );
  await expect(main(page)).not.toContainText(RECHECK_REASON);
  await checkState(page, COMPOSITE);
  await signOut(page, ACCOUNT.anil);

  // RV-05: his approval, “later sent back for a re-check”; RV-02 → RV-03: back for a re-check.
  await startAs(page, 'menon');
  await sidebar(page, '/reviewer/reviewed');
  await expect(rows(page).filter({ hasText: COMPOSITE }).locator('.xr-status')).toHaveText(
    'Approved — later sent back for a re-check',
  );
  await sidebar(page, '/reviewer/queue');
  await expect(rows(page).filter({ hasText: COMPOSITE })).toContainText('Re-check');
  await reachAndClick(page, main(page).getByRole('link', { name: `Review ${COMPOSITE}` }));
  await page.waitForURL(`**/reviewer/submissions/${SUB}`);
  await expect(chip(page)).toHaveText('Back for a re-check');
  const recheck = region(page, 'Sent back by the Content Manager for a re-check');
  await expect(recheck.locator('blockquote')).toHaveText(RECHECK_REASON);
  await checkState(page, COMPOSITE);
  await signOut(page, ACCOUNT.menon);
});

test('E-alt2 · the Content Manager returns an approved submission to the Vendor', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await submitComposite(page);
  await approveComposite(page);

  // CM-03 Send back to the vendor (inline in the panel, V3): the reason is required (the
  // references are optional).
  const panel = await openSendBack(page);
  await inPanel(page, panel.getByRole('radio', { name: 'Vendor' }));
  await inPanel(page, panel.getByRole('button', { name: 'Send back' }));
  await expect(panel.locator('.rk-ferr')).toHaveText(['Add a reason so they know what to change']);
  const reason = panel.getByRole('textbox', { name: 'Reason the vendor will see (required)' });
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(cmChip(page)).toHaveText('Ready to publish');
  await type(reason, VENDOR_REASON);
  await inPanel(page, panel.getByRole('checkbox', { name: 'Course & description · Summary' }));
  await inPanel(page, panel.getByRole('button', { name: 'Send back' }));
  await expect(cmDone(page)).toBeFocused({ timeout: 30_000 });
  await expect(cmDone(page).locator('.rk-done-meta')).toHaveText(/^Sent back by you on /);
  await expect(cmDone(page).locator('.xr-st')).toHaveText('With the vendor');
  await expect(cmChip(page)).toHaveText('With the vendor');
  await signOut(page, ACCOUNT.kavya);

  // VE-07: “Returned”, with the Content Manager's reason and reference; VE-08 shows it too.
  await vendorRecord(page);
  await expect(vendorChip(page)).toHaveText('Returned');
  const returned = region(page, 'Returned by the Content Manager');
  await expect(returned.getByRole('heading', { level: 2 })).toHaveText(
    'Returned by the Content Manager',
  );
  await expect(returned).toContainText('Kavya Nair');
  await expect(returned.locator('blockquote')).toHaveText(VENDOR_REASON);
  await expect(returned.locator('button.ve-ref')).toHaveText(['Course & description · Summary']);
  await checkState(page, COMPOSITE);
  await reachAndClick(
    page,
    main(page).locator('.rk-head-act').getByRole('link', { name: 'Revise and resubmit' }),
  );
  await page.waitForURL(`**/vendor/experiments/${SUB}/revise`);
  await expect(region(page, 'Returned by the Content Manager').locator('blockquote')).toHaveText(
    VENDOR_REASON,
  );
  await signOut(page, ACCOUNT.anil);

  // SA-12: the Super Admin's All content reads “Returned to the vendor” on SUB-0077's row.
  await startAs(page, 'arjun');
  await allContent(page);
  await expect(h1(page)).toHaveText('Content');
  const row = saRow(page, `/admin/content/records/${SUB}`);
  await expect(
    row.getByRole('link', { name: `${COMPOSITE}, Returned to the vendor. Open the record` }),
  ).toBeVisible();
  await expect(row.locator('.xr-st')).toHaveText('Returned to the vendor');
  await expect(row).toContainText('Returned to the vendor on');
  await checkState(page, 'Content');
  await signOut(page, ACCOUNT.arjun);
});

test('E-alt3 · the Super Admin returns a submission stuck with the Academic Reviewer to the Vendor', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await toSignIn(page);
  await startAs(page, 'arjun');

  // SA-12 → Show stuck records (the “Workflow status” filter set to Stuck, focus on it) → SA-13:
  // “Stuck — nobody can act”.
  await allContent(page);
  await expect(h1(page)).toHaveText('Content');
  await reachAndClick(page, page.getByRole('button', { name: 'Show stuck records' }));
  await expect(statusFilter(page)).toHaveValue('stuck');
  await expect(statusFilter(page)).toBeFocused();
  await page.waitForURL(/\/admin\/content\/all\?show=stuck$/);
  await expect(saRows(page)).toHaveCount(1);
  const stuck = saRow(page, `/admin/content/records/${STUCK.id}`);
  await expect(stuck.locator('.xr-st')).toHaveText('Stuck — nobody can act');
  await reachAndClick(
    page,
    stuck.getByRole('link', { name: `${STUCK.name}, Stuck — nobody can act. Open the record` }),
  );
  await page.waitForURL(`**/admin/content/records/${STUCK.id}`);
  await expect(h1(page)).toHaveText(STUCK.name);
  await expect(saChip(page)).toHaveText('Stuck — nobody can act');
  await expect(main(page).locator('.rk-notice--warn .rk-notice-t')).toHaveText(
    'Stuck — nobody can act',
  );
  await checkState(page, STUCK.name);

  // The override (the “Move status (override)” panel, then its confirmation): an empty reason is
  // refused under the field before anything opens; nothing moves.
  const panel = page.getByRole('complementary', { name: 'Move status (override)' });
  const reason = panel.getByRole('textbox', { name: 'Reason (required)' });
  const move = panel.getByRole('button', { name: 'Move status' });
  await reachAndClick(page, move);
  await expect(panel.locator('.rk-ferr')).toHaveText('Add a reason — it is kept in the history');
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(reason).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(saChip(page)).toHaveText('Stuck — nobody can act');
  await type(reason, OVERRIDE_REASON);
  await reachAndClick(page, move);
  const dialog = page.getByRole('dialog', { name: `Return ${STUCK.name} to the vendor?` });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('blockquote.rk-quote')).toContainText(OVERRIDE_REASON);
  await expect(dialog).toContainText('Ritu Sharma · Meridian Virtual Labs can work on it again.');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Move status' }));
  await expect(dialog).toBeHidden();
  await expectFlash(
    page,
    'Returned to the vendor.',
    'The override and your reason are in the governance history.',
  );
  await expect(saChip(page)).toHaveText('Returned to the vendor');
  await expect(
    main(page).locator('.rk-notice').filter({ hasText: 'In the workflow' }).locator('.rk-notice-d'),
  ).toHaveText('Ritu Sharma · Meridian Virtual Labs can act on it. Nothing is needed from you.');
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Move status' })).toHaveCount(0);

  // SA-12: “Returned to the vendor”, and nothing is stuck any more.
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'All content' }),
  );
  await page.waitForURL((url) => url.pathname === '/admin/content/all');
  await expect(statusFilter(page).locator('option[value="stuck"]')).toHaveText(
    'Stuck — nobody can act (0)',
  );
  await expect(page.getByRole('button', { name: 'Show stuck records' })).toHaveCount(0);
  const row = saRow(page, `/admin/content/records/${STUCK.id}`);
  await expect(row.locator('.xr-st')).toHaveText('Returned to the vendor');
  await expect(row).toContainText('(Super Admin override)');
  await signOut(page, ACCOUNT.arjun);
});

test('Hold and Lift hold · a held correction goes back to waiting for the Super Admin’s decision', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await toSignIn(page);
  const { id, live } = await sendShellCorrection(page);
  await reviewShellCorrection(page, id);
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Approve update' }));
  const approve = page.getByRole('dialog', { name: `Approve ${id}?` });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve update' }));
  await expect(approve).toBeHidden();
  await signOut(page, ACCOUNT.menon);

  // SA-10 → SA-11: Hold needs a reason; once held, “On hold” and only Lift hold — no Release.
  // The page is named by the experiment, its versions in the head; Hold asks for its reason in
  // the decision panel, checked before the confirmation opens.
  await startAs(page, 'arjun');
  await openUpdateDecision(page, /1\.0 → 1\.1/);
  await expect(page).toHaveURL(new RegExp(`/admin/content/updates/${id}$`));
  await expect(h1(page)).toHaveText(SHELL);
  await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Version 1.0 → 1.1');
  await expect(saChip(page)).toHaveText('Waiting for your decision');
  await reachAndClick(page, decision(page).getByRole('radio', { name: /^Hold/ }));
  const reason = decision(page).getByRole('textbox', { name: 'Reason for the hold (required)' });
  const holdGo = decision(page).getByRole('button', { name: 'Hold update' });
  await reachAndClick(page, holdGo);
  await expect(decision(page).locator('.rk-ferr')).toHaveText(
    'Add a reason — the Content Manager sees it',
  );
  await expect(decision(page).locator('.rk-errsum')).toBeFocused();
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(saChip(page)).toHaveText('Waiting for your decision');
  await type(reason, HOLD_REASON);
  await reachAndClick(page, holdGo);
  const hold = page.getByRole('dialog', { name: `Hold the ${SHELL} correction?` });
  await expect(hold.locator('blockquote.rk-quote')).toContainText(HOLD_REASON);
  await reachAndClick(page, hold.getByRole('button', { name: 'Hold update' }));
  await expect(hold).toBeHidden();
  await expectFlash(page, 'The correction is on hold.', 'Version 1.0 stays live.');
  await expect(saChip(page)).toHaveText('On hold');
  await expect(page.locator('#update-decided blockquote.rk-quote')).toHaveText(HOLD_REASON);
  await expect(decision(page).getByRole('button')).toHaveText(['Lift hold']);
  await expect(decision(page).getByRole('button', { name: 'Release update' })).toHaveCount(0);
  await expect(decision(page).getByRole('radio')).toHaveCount(0);
  await checkState(page, SHELL);
  await signOut(page, ACCOUNT.arjun);

  // While it is held the public page keeps the live version.
  await publicShell(page);
  await expect(page.locator('.xp-xsum')).toHaveText(live);
  await expect(main(page)).not.toContainText(CORRECTED_SUMMARY);
  await toSignIn(page);

  // CM-08: Kavya reads “On hold” and the Super Admin's reason.
  await startAs(page, 'kavya');
  await openUpdate(page, id);
  await expect(cmChip(page)).toHaveText('On hold');
  await expect(cmState(page)).toHaveClass(/rk-notice--paused/);
  await expect(cmState(page).locator('.rk-notice-t')).toHaveText('On hold');
  await expect(cmState(page)).toContainText(
    /The Super Admin put this update on hold on \d{1,2} [A-Z][a-z]{2} 2026\. Version 1\.0 stays live\./,
  );
  await expect(cmState(page)).toContainText(`Reason: “${HOLD_REASON}”`);
  await expect(main(page).locator('.rk-tl-n').first()).toContainText(`“${HOLD_REASON}”`);
  await signOut(page, ACCOUNT.kavya);

  // SA-10 On hold → SA-11: Lift hold → waiting for his decision again; Release offered again.
  await startAs(page, 'arjun');
  await sidebar(page, '/admin/content/updates');
  const onHold = page
    .getByRole('group', { name: 'Show corrections' })
    .getByRole('button', { name: /^On hold/ });
  // On a phone the segments scroll sideways (a swipe brings a hidden one into view).
  await onHold.scrollIntoViewIfNeeded();
  await reachAndClick(page, onHold);
  await expect(onHold).toHaveAttribute('aria-pressed', 'true');
  await page.waitForURL(/\/admin\/content\/updates\?show=on-hold$/);
  const held = saRow(page, `/admin/content/updates/${id}`);
  await expect(held).toContainText('Version 1.0 → 1.1');
  await expect(held.locator('.xr-st')).toHaveText('On hold');
  await reachAndClick(
    page,
    held.getByRole('link', { name: `${SHELL} correction, version 1.0 to 1.1, On hold. Open` }),
  );
  await page.waitForURL(`**/admin/content/updates/${id}`);
  await expect(saChip(page)).toHaveText('On hold');
  await reachAndClick(page, decision(page).getByRole('button', { name: 'Lift hold' }));
  const lift = page.getByRole('dialog', { name: `Lift the hold on the ${SHELL} correction?` });
  await expect(lift).toContainText('It goes back to waiting for your decision.');
  await reachAndClick(page, lift.getByRole('button', { name: 'Lift hold' }));
  await expect(lift).toBeHidden();
  await expect(saChip(page)).toHaveText('Waiting for your decision');
  await expectFlash(
    page,
    'Hold lifted.',
    'The correction is waiting for your decision again. Nothing went live.',
  );
  await expect(decision(page).getByRole('radio', { name: /^Release update/ })).toBeVisible();
  await expect(decision(page).getByRole('button', { name: 'Release update' })).toBeVisible();
  await expect(decision(page).getByRole('button', { name: 'Lift hold' })).toHaveCount(0);
  await checkState(page, SHELL);
  await signOut(page, ACCOUNT.arjun);
});

test('F-alt return · the Academic Reviewer returns a correction to the Content Manager', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await toSignIn(page);
  const { id } = await sendShellCorrection(page);

  // RV-04 → DL-2: the reason is required; returned, “Returned to the Content Manager”.
  await reviewShellCorrection(page, id);
  await reachAndClick(
    page,
    decision(page).getByRole('radio', { name: /^Return to the Content Manager/ }),
  );
  await reachAndClick(
    page,
    decision(page).getByRole('button', { name: 'Return to the Content Manager' }),
  );
  const dialog = page.getByRole('dialog', { name: 'Return to the Content Manager?' });
  const reason = dialog.getByRole('textbox', { name: 'Reason the Content Manager will see' });
  await reachAndClick(page, dialog.getByRole('button', { name: 'Return to the Content Manager' }));
  await expect(dialog.locator('.xr-error')).toHaveText(
    'Add a reason so the Content Manager knows what to change',
  );
  await expect(reason).toHaveAttribute('aria-invalid', 'true');
  await expect(chip(page)).toHaveText('Waiting for your decision');
  await type(reason, RETURN_REASON);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Return to the Content Manager' }));
  await expect(dialog).toBeHidden();
  await expect(page.locator('#ru-dec .xr-status--err')).toHaveText(
    'Returned to the Content Manager',
  );
  await expect(chip(page)).toHaveText('Returned to the Content Manager');
  await checkState(page, `${SHELL} · 1.0 → 1.1`);
  await signOut(page, ACCOUNT.menon);

  // CM-08: “Returned”, the reviewer's reason first, and the correction hers to change again.
  await startAs(page, 'kavya');
  await openUpdate(page, id);
  await expect(cmChip(page)).toHaveText('Returned');
  const returned = region(page, 'Returned by the Academic Reviewer');
  await expect(returned.getByRole('heading', { level: 2 })).toHaveText(
    'Returned by the Academic Reviewer',
  );
  await expect(returned).toContainText('Prof. A. Menon');
  await expect(returned.locator('blockquote p').first()).toHaveText(RETURN_REASON);
  await expect(field(page, 'Summary')).toHaveValue(CORRECTED_SUMMARY);
  await expect(button(page, 'Send for academic review')).toBeVisible();
  await checkState(page, UPDATE_TITLE);
  await signOut(page, ACCOUNT.kavya);
});

test('F-alt withdraw · the Content Manager withdraws a correction in academic review', async ({
  page,
}) => {
  test.setTimeout(300_000);
  await page.goto('/');
  await toSignIn(page);
  const { id, live } = await sendShellCorrection(page);

  // RV-02: the correction waits in Prof. A. Menon's Review queue.
  await startAs(page, 'menon');
  await sidebar(page, '/reviewer/queue');
  const names = rows(page).locator('td.is-primary strong');
  await expect(names.filter({ hasText: SHELL })).toHaveCount(1);
  const before = await names.allTextContents();
  await signOut(page, ACCOUNT.menon);

  // CM-08 → DL-2: Withdraw needs a reason; withdrawn, “Withdrawn”, nothing left to do.
  await startAs(page, 'kavya');
  await openUpdate(page, id);
  await expect(cmChip(page)).toHaveText('In academic review');
  await reachAndClick(page, button(page, 'Withdraw update'));
  const dialog = page.getByRole('dialog', { name: `Withdraw ${id}?` });
  await expect(dialog).toContainText('Nothing changes in the live version.');
  await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw update' }));
  await expect(dialog).toContainText('Add a reason for withdrawing this update');
  await expect(cmChip(page)).toHaveText('In academic review');
  await type(dialog.getByLabel('Reason (required)'), WITHDRAW_REASON);
  await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw update' }));
  await expect(dialog).toBeHidden();
  await expect(cmChip(page)).toHaveText('Withdrawn');
  // The withdrawn notice (V3: `#cm-u-state`, quiet): the reason, and the live version unchanged.
  await expect(cmState(page)).toHaveClass(/rk-notice--off/);
  await expect(cmState(page)).toContainText(`Reason: “${WITHDRAW_REASON}”`);
  await expect(cmState(page)).toContainText('The live version is unchanged.');
  await expect(main(page).getByRole('button')).toHaveCount(0);
  await checkState(page, UPDATE_TITLE);
  await signOut(page, ACCOUNT.kavya);

  // The public page keeps the live version.
  await publicShell(page);
  await expect(page.locator('.xp-xsum')).toHaveText(live);
  await toSignIn(page);

  // RV-02: it is no longer in the Review queue; the rest of the queue is as it was.
  await startAs(page, 'menon');
  await sidebar(page, '/reviewer/queue');
  await expect(names).toHaveText(before.filter((name) => name !== SHELL));
  await expect(main(page).getByRole('link', { name: `Review ${SHELL}` })).toHaveCount(0);
  await signOut(page, ACCOUNT.menon);
});
