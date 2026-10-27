import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import { EMAIL, h1, main, signIn } from '../flows/product';

/**
 * Vendor ownership and course permission (owner decisions of 27 Oct 2026, Vendor ownership audit,
 * correction A) on the PRODUCT build, through the real screens only — the Super Admin registers and
 * scopes the Vendors on SA-16 / SA-17, each Vendor signs in on the sample sign-in and opens
 * addresses by typing them (signed out, then `returnTo` after signing in):
 *
 * - PD-3: a Vendor registered with “Assign courses next” has no course — Overview, My experiments
 *   and Create experiment explain it, and nothing offers Create experiment (every width);
 * - PD-1: two Vendors of the same studio and one of another studio never open each other's
 *   records — the record, the editor and the revise address answer “not found”, and nothing says
 *   “colleague”; each lists only their own;
 * - PD-2: a Vendor registered with “Any course” (the default) is offered every course and saves a
 *   draft under a course no course scope names; Anil given All experiments keeps every own record;
 * - withdrawn: once “All experiments” is withdrawn, the draft stays readable and read-only, and
 *   nothing new can be created.
 *
 * One browser per test (a Playwright context) from the clean world; each person has a tab of
 * their own in it (the world is the browser's, TE-6; a session is the tab's).
 */
test.describe.configure({ timeout: 240_000 });
test.use({ navigationTimeout: 30_000, actionTimeout: 20_000 });

const NORTHLINE = 'Northline Simulation Studio';
const PROCESS = 'process-instrumentation-control';
const CHEMICAL = 'chemical-process';
const ELECTRICAL = 'electrical-electronics';
const NO_COURSE = 'No course is assigned to you yet';
const NO_COURSE_LINE =
  'The platform team assigns the courses you can submit experiments to. Once a course is assigned, you can create experiments here.';
const NOT_FOUND = 'We can’t find that experiment';

const VENDORS = {
  sana: { name: 'Sana Rao', email: 'sana.rao@northline.example', organisation: NORTHLINE },
  cora: { name: 'Cora Das', email: 'cora.das@northline.example', organisation: NORTHLINE },
  omar: { name: 'Omar Ali', email: 'omar.ali@harbourlabs.example', organisation: 'Harbour Labs' },
} as const;

/** A tab of its own in this browser, at the given width. */
async function tab(context: BrowserContext, width = 1440, height = 900): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height });
  return page;
}

/** Types an address in a fresh tab: signed out, so the sign-in comes first and returns to it. */
async function openAs(page: Page, email: string, address: string): Promise<void> {
  await page.goto(address);
  await page.waitForURL((url) => url.pathname === '/sign-in');
  await signIn(page, email);
  await page.waitForURL((url) => url.pathname === address);
}

/** SA-16: Register a Vendor, with “Any course” (the default) or “Assign courses next”. */
async function registerVendor(
  admin: Page,
  vendor: (typeof VENDORS)[keyof typeof VENDORS],
  start: 'Any course' | 'Assign courses next',
): Promise<void> {
  await openAs(admin, EMAIL.arjun, '/admin/roles');
  await reachAndClick(admin, admin.getByRole('button', { name: 'Register a Vendor' }));
  const dialog = admin.getByRole('dialog', { name: 'Register a Vendor' });
  await dialog.getByRole('textbox', { name: 'Name' }).fill(vendor.name);
  await dialog.getByRole('textbox', { name: 'Work e-mail' }).fill(vendor.email);
  await dialog.getByRole('textbox', { name: 'Organisation' }).fill(vendor.organisation);
  const choices = dialog.getByRole('group', { name: 'What can they submit to?' });
  await expect(choices.getByRole('radio', { name: 'Any course' })).toBeChecked();
  if (start === 'Assign courses next') {
    await reachAndClick(admin, choices.locator('label').filter({ hasText: start }));
  }
  await reachAndClick(admin, dialog.getByRole('button', { name: 'Register', exact: true }));
  await expect(h1(admin)).toHaveText(vendor.name);
}

/** The editor's Create experiment: the name and the course, then Save draft; the draft's id. */
async function saveDraft(
  page: Page,
  name: string,
  courseId: string,
  areaId: string,
): Promise<string> {
  await page.getByLabel('Experiment name', { exact: true }).fill(name);
  // Engineering area first (PD-5): Course then lists that area's courses.
  await page.getByRole('combobox', { name: 'Engineering area' }).selectOption(areaId);
  await page.getByRole('combobox', { name: 'Course' }).selectOption(courseId);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Save draft', exact: true }));
  await page.waitForURL(/\/vendor\/experiments\/SUB-\d+\/edit$/);
  return new URL(page.url()).pathname.split('/')[3]!;
}

async function expectNotFound(page: Page): Promise<void> {
  await expect(main(page).locator('.rk-state h2')).toHaveText(NOT_FOUND);
  await expect(main(page)).not.toContainText('colleague');
}

test('no course assigned: Overview, My experiments and Create experiment explain it, nothing offers Create (PD-3)', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext();
  const admin = await tab(context);
  await registerVendor(admin, VENDORS.sana, 'Assign courses next');
  await expect(main(admin)).toContainText('No scope — can’t act on anything yet');

  const viewport = testInfo.project.use.viewport!;
  const sana = await tab(context, viewport.width, viewport.height);
  await openAs(sana, VENDORS.sana.email, '/vendor');
  await expect(main(sana).getByRole('heading', { level: 2, name: NO_COURSE })).toBeVisible();
  await expect(main(sana)).toContainText(NO_COURSE_LINE);
  await expect(sana.getByRole('link', { name: 'Create experiment' })).toHaveCount(0);
  await checkState(sana, 'Overview');

  // My experiments, from its own address (the sidebar's link is the shell's, proved elsewhere).
  await openAs(sana, VENDORS.sana.email, '/vendor/experiments');
  await expect(main(sana).getByRole('heading', { level: 2, name: NO_COURSE })).toBeVisible();
  await expect(sana.getByRole('link', { name: 'Create experiment' })).toHaveCount(0);
  await checkState(sana, 'My experiments');

  // The address typed: the calm state, never “We can’t find that page”.
  const create = await tab(context, viewport.width, viewport.height);
  await openAs(create, VENDORS.sana.email, '/vendor/experiments/new');
  await expect(main(create).getByRole('heading', { level: 2, name: NO_COURSE })).toBeVisible();
  await expect(main(create)).not.toContainText('We can’t find that page');
  await expect(main(create).getByRole('combobox')).toHaveCount(0);
  await checkState(create, 'Create experiment');
  await context.close();
});

test('Create experiment step 1: Engineering area, then Course; a draft reopens with its area (PD-5)', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext();
  const admin = await tab(context);
  await registerVendor(admin, VENDORS.cora, 'Any course');
  const viewport = testInfo.project.use.viewport!;
  const cora = await tab(context, viewport.width, viewport.height);
  await openAs(cora, VENDORS.cora.email, '/vendor/experiments/new');
  const area = cora.getByRole('combobox', { name: 'Engineering area' });
  const course = cora.getByRole('combobox', { name: 'Course' });
  await expect(area).toHaveValue('');
  await expect(course.locator('option')).toHaveText(['Choose an Engineering area first']);
  await checkState(cora, 'Course and description');
  // An area: its courses only. Another area: the course is cleared.
  await area.selectOption(ELECTRICAL);
  await expect(course.locator('option')).toHaveText([
    'Choose a course',
    'EEE ZC341 · Electrical Machines',
    'EEE ZG512 · Power Electronics',
  ]);
  await course.selectOption('electrical-machines');
  await area.selectOption(CHEMICAL);
  await expect(course).toHaveValue('');
  await expect(course.locator('option')).toHaveText([
    'Choose a course',
    'CHE ZG513 · Process Instrumentation & Control',
  ]);
  await checkState(cora, 'Course and description');
  // Saved, then opened again from its own address: the area comes from the saved course.
  const draft = await saveDraft(cora, 'Packed Column Absorption', PROCESS, CHEMICAL);
  const again = await tab(context, viewport.width, viewport.height);
  await openAs(again, VENDORS.cora.email, `/vendor/experiments/${draft}/edit`);
  await expect(again.getByRole('combobox', { name: 'Engineering area' })).toHaveValue(CHEMICAL);
  await expect(again.getByRole('combobox', { name: 'Course' })).toHaveValue(PROCESS);
  await checkState(again, 'Course and description');
  await context.close();
});

test.describe('ownership across Vendors (1440: width-independent)', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

  test('same studio and another studio never open each other’s records; each lists only their own (PD-1, PD-2)', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const admin = await tab(context);
    await registerVendor(admin, VENDORS.cora, 'Any course');
    await expect(main(admin)).toContainText(
      'Can create experiments and submit them for any course, now and later.',
    );
    await registerVendor(admin, VENDORS.omar, 'Any course');

    // Cora (Northline, Any course): every course is offered; a draft under CHE ZG513.
    const cora = await tab(context);
    await openAs(cora, VENDORS.cora.email, '/vendor/experiments/new');
    const course = cora.getByRole('combobox', { name: 'Course' });
    // Every area is offered (Any course); Course waits for one.
    await expect(
      cora.getByRole('combobox', { name: 'Engineering area' }).locator('option'),
    ).toHaveText([
      'Choose an Engineering area',
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await expect(course.locator('option')).toHaveText(['Choose an Engineering area first']);
    const draft = await saveDraft(cora, 'Packed Column Absorption', PROCESS, CHEMICAL);

    // Cora opens Anil's records by typed address: not found, nothing about a colleague.
    for (const address of [
      '/vendor/experiments/SUB-0081',
      '/vendor/experiments/SUB-0079',
      '/vendor/experiments/SUB-0052',
    ]) {
      const page = await tab(context);
      await openAs(page, VENDORS.cora.email, address);
      await expectNotFound(page);
      await page.close();
    }
    for (const address of [
      '/vendor/experiments/SUB-0079/edit',
      '/vendor/experiments/SUB-0081/revise',
    ]) {
      const page = await tab(context);
      await openAs(page, VENDORS.cora.email, address);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('We can’t find that page');
      await expect(main(page)).not.toContainText('Forced Convection');
      await page.close();
    }
    // Her own list: her draft only.
    const list = await tab(context);
    await openAs(list, VENDORS.cora.email, '/vendor/experiments');
    await expect(
      main(list)
        .getByRole('link', { name: /Packed Column Absorption/ })
        .first(),
    ).toBeVisible();
    await expect(main(list)).not.toContainText('Forced Convection');
    await expect(main(list)).not.toContainText('Flash Distillation');

    // Anil (same studio) and Omar (another studio) never open Cora's draft.
    for (const email of [EMAIL.anil, VENDORS.omar.email]) {
      const page = await tab(context);
      await openAs(page, email, `/vendor/experiments/${draft}`);
      await expectNotFound(page);
      await expect(main(page)).not.toContainText('Packed Column Absorption');
      await page.close();
    }
    const anil = await tab(context);
    await openAs(anil, EMAIL.anil, '/vendor/experiments');
    await expect(main(anil)).not.toContainText('Packed Column Absorption');
    await expect(
      main(anil)
        .getByRole('link', { name: /Forced Convection/ })
        .first(),
    ).toBeVisible();
    await context.close();
  });

  test('Anil given All experiments keeps every own record; withdrawn, his drafts stay readable and read-only (PD-2, PD-3)', async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const admin = await tab(context);
    await openAs(admin, EMAIL.arjun, '/admin/roles/role-anil-shetty');
    await expect(h1(admin)).toHaveText('Anil Shetty');
    const panel = admin.getByRole('complementary', { name: 'Assign scope' });
    await expect(panel.getByRole('radio')).toHaveCount(2);
    await expect(panel.getByRole('radio', { name: 'One experiment' })).toHaveCount(0);
    await reachAndClick(admin, panel.locator('label').filter({ hasText: 'Any course' }));
    await reachAndClick(admin, panel.getByRole('button', { name: 'Assign scope' }));
    await expect(main(admin)).toContainText(
      'Can create experiments and submit them for any course, now and later.',
    );

    // His own returned record opens as his — never “created by a colleague”.
    const anil = await tab(context);
    await openAs(anil, EMAIL.anil, '/vendor/experiments/SUB-0081');
    await expect(h1(anil)).toHaveText('Forced Convection');
    await expect(main(anil)).not.toContainText('colleague');
    const editor = await tab(context);
    await openAs(editor, EMAIL.anil, '/vendor/experiments/new');
    await expect(
      editor.getByRole('combobox', { name: 'Engineering area' }).locator('option'),
    ).toHaveCount(4);
    const draft = await saveDraft(editor, 'Packed Column Absorption', PROCESS, CHEMICAL);

    // Withdraw every scope: nothing new; the draft opens read-only, its words still readable.
    for (const name of ['Any course', 'ME ZG523 · Thermodynamics & Heat Transfer']) {
      await reachAndClick(admin, admin.getByRole('button', { name: `Withdraw scope ${name}` }));
      await admin.getByRole('region', { name: 'Can act on' }).getByRole('textbox').fill('Paused');
      await reachAndClick(
        admin,
        admin.getByRole('button', { name: 'Withdraw scope', exact: true }),
      );
      await expect(admin.getByRole('button', { name: `Withdraw scope ${name}` })).toHaveCount(0);
    }
    const home = await tab(context);
    await openAs(home, EMAIL.anil, '/vendor');
    await expect(main(home)).toContainText(
      'No course is assigned to you now. Your experiments stay here to read.',
    );
    await expect(home.getByRole('link', { name: 'Create experiment' })).toHaveCount(0);
    const record = await tab(context);
    await openAs(record, EMAIL.anil, `/vendor/experiments/${draft}`);
    await expect(h1(record)).toHaveText('Packed Column Absorption');
    await expect(main(record).getByRole('link', { name: /Edit draft/ })).toHaveCount(0);
    await context.close();
  });
});
