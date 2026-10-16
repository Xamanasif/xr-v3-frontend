import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-16 Platform roles (board B7-08 f0, f3, f6) and SA-17 Role holder (B7-08 f1, f2, f4, f5, f7,
 * f8; B7-10 f10, f11; B7-12 “Role holder” at four widths) on the test-hook build at 1440, 1024, 768
 * and 375, as Arjun Mehta on after-flow-e (23 Oct 2026: Dr K. Iyer registered with no scope,
 * SUB-0085 stuck — no Academic Reviewer has EEE ZC341). Each drawn state passes `checkState` (axe
 * WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways
 * scroll). The CI seam only SETS UP the world (Anil Shetty submits an ME ZG523 experiment so that
 * Prof. A. Menon's queue holds one) and switches who is signed in to this tab; everything the
 * screens do — the tabs, Register (refused, then registered), Assign scope (refused, then
 * assigned), Withdraw (refused, then withdrawn) and Restore — is done by real clicks and typing.
 * The cross-role effects are read on the other role's own screens in the same tab and world: the
 * reviewer's Review queue (RV-02) and All content (SA-12, another group's page: its stuck notice).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const SA = { personId: 'sa-arjun-mehta' };
const ANIL = { personId: 'per-anil-shetty' };
const MENON = { personId: 'per-a-menon' };
const FIXTURE = 'after-flow-e';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/platform-roles';

/** A new ME ZG523 experiment from Anil Shetty (set-up only: Prof. A. Menon's queue holds it). */
const PIN_FINS = {
  courseId: 'thermodynamics-heat-transfer',
  name: 'Pin-Fin Array Effectiveness',
  summary:
    'Measure the temperature along a row of pin fins and compare the heat removed with fin theory.',
  description:
    'Students heat the base of an aluminium plate carrying a row of pin fins, read the temperature along one fin and the air around it, and compare the heat removed with the fin-efficiency model for an adiabatic tip. They explain where the measured and predicted effectiveness differ.',
  version: '1.0',
  formats: ['web'],
  delivery: {
    web: {
      format: 'web',
      webLink: 'https://labs.northline.example/pin-fins',
      browserAndComputer:
        'A current Chrome, Edge, Firefox or Safari on a laptop or desktop, with a keyboard and mouse',
      notes: null,
    },
  },
  preview: { label: 'Two-minute walkthrough', link: 'https://media.northline.example/pin-fins' },
  documents: [{ fileName: 'Lab handout — Pin-Fin Array.pdf' }],
};

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port call as a sample person through the CI seam, which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/** Anil saves and submits the ME ZG523 experiment (set-up only). */
async function submitPinFins(page: Page): Promise<string> {
  const draft = await port<{ readonly id: string; readonly rev: number }>(
    page,
    ANIL,
    'production',
    'saveDraft',
    { id: null, content: PIN_FINS, step: 'course', expectedRev: null },
  );
  const submitted = await port<{ readonly id: string }>(
    page,
    ANIL,
    'production',
    'submitForReview',
    { id: draft.id, content: PIN_FINS, expectedRev: draft.rev },
  );
  return submitted.id;
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const tableRows = (page: Page) => main(page).locator('table.xr-table tbody tr');
const flash = (page: Page) => main(page).locator('p.xa-save');
const scopeList = (page: Page, name: 'Scope' | 'Withdrawn scope') =>
  main(page).getByRole('list', { name, exact: true }).locator(':scope > li .xg-lo-main');
const historyWhat = (page: Page) => main(page).locator('ol.xr-timeline .xr-tl-what');
const effect = (page: Page) =>
  page.getByRole('region', { name: 'Can act on' }).locator('p.xr-body').first();

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A client-side move in this tab (the sample world lives in the tab: no reload). */
async function push(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** A control pressed: scrolled into reach and clicked with the pointer. */
async function press(page: Page, control: Locator): Promise<void> {
  await reachAndClick(page, control);
}

test.describe('SA-16 Platform roles', () => {
  test('Vendors (f3), Reviewers (f0) and Content Managers by real clicks; Open a holder', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Who can produce, review and publish content — and for what',
    );
    const tabs = page.getByRole('tablist', { name: 'Role' });
    await expect(tabs.getByRole('tab')).toHaveText([
      'Vendors 2',
      'Reviewers 2',
      'Content Managers 1',
    ]);
    await expect(tabs.getByRole('tab', { name: /^Vendors/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible();
    await expect(tableRows(page)).toHaveCount(2);
    await expect(tableRows(page).nth(0).locator('td').nth(0)).toHaveText(
      'Anil ShettyNorthline Simulation Studio · Registered 4 Jul 2026',
    );
    await expect(tableRows(page).nth(0).locator('td').nth(1)).toHaveText(
      'ME ZG5231 scope withdrawn',
    );
    await expect(tableRows(page).nth(1).locator('td').nth(1)).toHaveText('CHE ZG513, EEE ZC341');
    await expect(main(page).locator('.xr-notice--warn')).toHaveCount(0);
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-vendors');

    // Reviewers (f0): the address follows; the no-scope notice and the tag.
    await press(page, tabs.getByRole('tab', { name: /^Reviewers/ }));
    await expect(page).toHaveURL(/\/admin\/roles\?tab=reviewers$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Reviewers' })).toBeVisible();
    await expect(main(page).locator('.xr-notice--warn')).toHaveText(
      '1 holder with no scope — they can’t act on anything yetOpen the holder and assign a scope.',
    );
    await expect(tableRows(page).locator('td.is-primary strong')).toHaveText([
      'Prof. A. Menon',
      'Dr K. Iyer',
    ]);
    await expect(tableRows(page).nth(0).locator('td').nth(1)).toHaveText(
      'ME ZG523, MEL ZG512, CHE ZG5131 scope withdrawn',
    );
    await expect(tableRows(page).nth(1).locator('.xw-tag.xw-tag--warn')).toHaveText(
      'Nothing — no scope yet',
    );
    await expect(page.getByRole('button', { name: 'Register a Reviewer' })).toBeVisible();
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-reviewers');

    // Content Managers (the engine state of f0).
    await press(page, tabs.getByRole('tab', { name: /^Content Managers/ }));
    await expect(page).toHaveURL(/\/admin\/roles\?tab=content-managers$/);
    await expect(tableRows(page)).toHaveCount(1);
    await expect(tableRows(page).nth(0).locator('td').nth(1)).toHaveText('All experiments');
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-content-managers');

    // Back to Reviewers; Open Dr K. Iyer, in the same tab.
    await press(page, tabs.getByRole('tab', { name: /^Reviewers/ }));
    const mark = await markDocument(page);
    await press(page, page.getByRole('link', { name: 'Open Dr K. Iyer' }));
    await expect(page).toHaveURL(/\/admin\/roles\/role-0001$/, { timeout: 60_000 });
    await expect(heading(page, 'Dr K. Iyer')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/roles\?tab=reviewers$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Reviewers' })).toBeVisible();
  });

  test('`?tab=vendors` and a tab that does not exist are the bare address (D-11)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles?tab=vendors');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/admin\/roles$/);
    await page.goto('/admin/roles?tab=institute-admins');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/admin\/roles$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible();
  });

  test('Register a Vendor (f6): all three required; a used e-mail refused; registered → SA-17 with the flash', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(tableRows(page)).toHaveCount(2);
    await press(page, page.getByRole('button', { name: 'Register a Vendor' }));
    const dialog = page.getByRole('dialog', { name: 'Register a Vendor' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body > p')).toHaveText(
      'Role: Vendor. They start with no scope — you assign it next. Nothing is sent from here.',
    );
    const name = dialog.getByRole('textbox', { name: 'Name' });
    const email = dialog.getByRole('textbox', { name: 'Work e-mail' });
    const organisation = dialog.getByRole('textbox', { name: 'Organisation' });
    await expect(name).toBeFocused();
    await press(page, dialog.getByRole('button', { name: 'Register' }));
    await expect(dialog.locator('.xr-error')).toHaveText([
      'Enter the person’s name',
      'Enter a work e-mail address',
      'Enter the organisation',
    ]);
    await expect(name).toBeFocused();
    await checkState(page, 'Platform roles');
    await shot(page, 'b7-08-f6-register-validation');

    // An e-mail someone already signs in with (PC-49): SA-16's words, nothing registered.
    await name.pressSequentially('Kavya Nair');
    await email.pressSequentially('kavya.nair@wilp.example');
    await organisation.pressSequentially('BITS Pilani · WILP');
    await press(page, dialog.getByRole('button', { name: 'Register' }));
    await expect(dialog.locator('.xr-error')).toHaveText(
      'Someone is already registered with this e-mail address',
    );
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Platform roles');

    // Registered: the new holder opens on SA-17 with the flash; focus on the name.
    await name.fill('');
    await name.pressSequentially('Neha Kapoor');
    await email.fill('');
    await email.pressSequentially('neha.kapoor@vertexsim.example');
    await organisation.fill('');
    await organisation.pressSequentially('Vertex Simulations');
    const mark = await markDocument(page);
    await press(page, dialog.getByRole('button', { name: 'Register' }));
    await expect(page).toHaveURL(/\/admin\/roles\/role-\d{4}$/, { timeout: 60_000 });
    const title = heading(page, 'Neha Kapoor');
    await expect(title).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(title).toBeFocused();
    await expect(flash(page)).toHaveText(
      'Neha Kapoor is registered as Vendor. They have no scope yet — assign one so they can act. Nothing is sent from here.',
    );
    await expect(main(page).locator('.xr-overline')).toHaveText('Vendor · Vertex Simulations');
    await expect(effect(page)).toHaveText(
      'Can’t create or submit experiments yet — nothing is in scope.',
    );
    await expect(historyWhat(page)).toHaveText(['Registered as Vendor']);
    await expect(main(page).locator('ol.xr-timeline .xr-tl-note')).toHaveText([
      'Arjun Mehta · no scope yet',
    ]);
    await checkState(page, 'Neha Kapoor');
    await shot(page, 'sa-17-registered');

    // Back to the list: three Vendors, one without scope.
    await press(page, main(page).locator('a.xr-back'));
    await expect(page).toHaveURL(/\/admin\/roles$/);
    await expect(page.getByRole('tablist', { name: 'Role' }).getByRole('tab').first()).toHaveText(
      'Vendors 3',
    );
    await expect(main(page).locator('.xr-notice--warn')).toHaveText(
      '1 holder with no scope — they can’t act on anything yetOpen the holder and assign a scope.',
    );
  });
});

test.describe('SA-17 Role holder', () => {
  test('Dr K. Iyer (f1, f2; B7-10 f10): Assign validation (f5); EEE ZC341 assigned → SUB-0085 is no longer stuck and is in his queue', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    // SA-12 (another group's page) before: the stuck record is flagged.
    await page.goto('/admin/content/all');
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).getByText('1 record stuck — nobody can act')).toBeVisible({
      timeout: 60_000,
    });

    await push(page, '/admin/roles/role-0001');
    await expect(heading(page, 'Dr K. Iyer')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'Academic Reviewer · BITS Pilani · WILP',
    );
    await expect(main(page).locator('.xr-notice--warn')).toHaveText(
      'No scope — can’t act on anything yetAssign a scope so they can act: all experiments, a course, or one experiment.',
    );
    await expect(effect(page)).toHaveText(
      'Their review queue is empty — nothing is in scope. Submissions for courses nobody reviews get stuck.',
    );
    await expect(main(page).locator('dl.xl-kv')).toContainText('k.iyer@wilp.example');
    await expect(main(page).locator('dl.xl-kv')).toContainText('20 Oct 2026 · by Arjun Mehta');
    await expect(
      main(page).getByText('How they first sign in is still open — nothing is sent from here.'),
    ).toBeVisible();
    await expect(historyWhat(page)).toHaveText(['Registered as Academic Reviewer']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'sa-17-no-scope');

    // f5: “A course” chosen, no course picked.
    const assign = main(page).getByRole('button', { name: 'Assign scope' });
    await press(page, assign);
    const dialog = page.getByRole('dialog', { name: 'Assign scope to Dr K. Iyer' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radio', { name: /All experiments/ })).toBeFocused();
    await press(page, dialog.getByRole('button', { name: 'Assign scope' }));
    await expect(dialog.locator('.xr-error')).toHaveText('Choose what they can act on');
    await press(page, dialog.getByRole('radio', { name: /A course/ }));
    await press(page, dialog.getByRole('button', { name: 'Assign scope' }));
    const course = dialog.getByRole('combobox', { name: 'Course' });
    await expect(dialog.locator('.xr-error')).toHaveText('Choose a course');
    await expect(course).toBeFocused();
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'b7-08-f5-assign-validation');

    await course.selectOption({ label: 'EEE ZC341 · Electrical Machines' });
    await press(page, dialog.getByRole('button', { name: 'Assign scope' }));
    await expect(dialog).toBeHidden();
    await expect(flash(page)).toHaveText('Dr K. Iyer can now act on EEE ZC341.');
    await expect(flash(page)).toBeFocused();
    await expect(main(page).locator('.xr-notice--warn')).toHaveCount(0);
    await expect(scopeList(page, 'Scope')).toHaveText([
      /^EEE ZC341 · Electrical Machines\s*Since \d+ Oct 2026$/,
    ]);
    await expect(effect(page)).toHaveText(
      'Sees submissions and updates for these in the review queue: EEE ZC341.',
    );
    await expect(historyWhat(page)).toHaveText([
      'Scope assigned — EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'sa-17-assigned');

    // SA-12 after: nothing is stuck any more.
    await push(page, '/admin/content/all');
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('table.xr-table')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).getByText(/record stuck — nobody can act/)).toHaveCount(0);

    // Dr K. Iyer's own Review queue (RV-02), in this tab and world: SUB-0085 is there.
    const iyer = await port<{ readonly holder: { readonly personId: string } }>(
      page,
      SA,
      'platformRoles',
      'getHolder',
      'role-0001',
    );
    await switchIdentity(page, { personId: iyer.holder.personId });
    await push(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('table.xr-table tbody td.is-primary strong')).toHaveText([
      'DC Motor Speed Control',
    ]);
  });

  test('Prof. A. Menon: ME ZG523 withdrawn with a reason — his queue drops it at once; restored (f8) — it is back', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles/role-a-menon');
    await expect(heading(page, 'Prof. A. Menon')).toBeVisible({ timeout: 90_000 });
    const submission = await submitPinFins(page);

    // f8: Restore EEE ZC341 asks no reason — the inline confirmation; Cancel returns focus.
    const restoreEee = main(page).getByRole('button', {
      name: 'Restore EEE ZC341 · Electrical Machines',
    });
    await press(page, restoreEee);
    const confirm = main(page).getByRole('button', { name: 'Restore scope' });
    await expect(confirm).toBeFocused();
    await expect(main(page).locator('.xw-inline-panel p')).toHaveText(
      'Restore EEE ZC341 · Electrical Machines? They can act on it again straight away.',
    );
    await expect(main(page).locator('.xw-inline-panel textarea')).toHaveCount(0);
    await checkState(page, 'Prof. A. Menon');
    await shot(page, 'b7-08-f8-restore');
    await press(
      page,
      main(page).locator('.xw-inline-panel').getByRole('button', { name: 'Cancel' }),
    );
    await expect(restoreEee).toBeFocused();

    // Withdraw ME ZG523: a reason is required (DL-2), inline beside the scope.
    await press(
      page,
      main(page).getByRole('button', {
        name: 'Withdraw ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    );
    const reason = main(page).getByRole('textbox', {
      name: 'Reason for withdrawing ME ZG523 · Thermodynamics & Heat Transfer',
    });
    await expect(reason).toBeFocused();
    await press(page, main(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(main(page).locator('.xw-inline-panel .xr-error')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await expect(reason).toBeFocused();
    await reason.pressSequentially('Thermodynamics reviews move to the mechanical faculty.');
    await press(page, main(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(flash(page)).toHaveText(
      'ME ZG523 withdrawn. Prof. A. Menon can no longer act on it.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(scopeList(page, 'Withdrawn scope').first()).toContainText(
      '“Thermodynamics reviews move to the mechanical faculty.”',
    );
    await expect(historyWhat(page).first()).toHaveText('Scope withdrawn — ME ZG523');
    await checkState(page, 'Prof. A. Menon');

    // As Prof. A. Menon, in this tab: the ME ZG523 submission has left his queue straight away.
    await switchIdentity(page, MENON);
    await push(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    const queue = main(page).locator('table.xr-table tbody td.is-primary strong');
    await expect(queue).toHaveText(['Flash Distillation', 'Venturi Meter Calibration']);
    await expect(main(page)).not.toContainText(submission);

    // Back as the Super Admin: Restore ME ZG523 — no reason asked.
    await switchIdentity(page, SA);
    await push(page, '/admin/roles/role-a-menon');
    await expect(heading(page, 'Prof. A. Menon')).toBeVisible({ timeout: 90_000 });
    await press(
      page,
      main(page).getByRole('button', { name: 'Restore ME ZG523 · Thermodynamics & Heat Transfer' }),
    );
    await press(page, main(page).getByRole('button', { name: 'Restore scope' }));
    await expect(flash(page)).toHaveText('ME ZG523 restored. Prof. A. Menon can act on it again.');
    await expect(historyWhat(page).first()).toHaveText('Scope restored — ME ZG523');

    // He sees it again at once.
    await switchIdentity(page, MENON);
    await push(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    await expect(queue).toHaveText([
      'Flash Distillation',
      'Venturi Meter Calibration',
      PIN_FINS.name,
    ]);
  });

  test('Anil Shetty (B7-12; f4 Withdraw · reason required), Ritu Sharma (B7-10 f11), Kavya Nair (f7)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles/role-anil-shetty');
    await expect(heading(page, 'Anil Shetty')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'Vendor · Northline Simulation Studio',
    );
    await expect(effect(page)).toHaveText('Can create experiments and submit them for: ME ZG523.');
    await expect(scopeList(page, 'Scope')).toHaveText([
      /^ME ZG523 · Thermodynamics & Heat Transfer\s*Since 4 Jul 2026$/,
    ]);
    await expect(scopeList(page, 'Withdrawn scope')).toHaveText([
      /^MEL ZG512 · Manufacturing Processes\s*Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term\.”$/,
    ]);
    await expect(historyWhat(page)).toHaveText([
      'Scope withdrawn — MEL ZG512',
      'Registered as Vendor',
    ]);
    await checkState(page, 'Anil Shetty');
    await shot(page, 'b7-12-role-holder');

    // f4: Withdraw, no reason given.
    const withdraw = main(page).getByRole('button', {
      name: 'Withdraw ME ZG523 · Thermodynamics & Heat Transfer',
    });
    await press(page, withdraw);
    await press(page, main(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(main(page).locator('.xw-inline-panel .xr-error')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await checkState(page, 'Anil Shetty');
    await shot(page, 'b7-08-f4-withdraw-validation');
    await press(
      page,
      main(page).locator('.xw-inline-panel').getByRole('button', { name: 'Cancel' }),
    );
    await expect(withdraw).toBeFocused();
    await expect(main(page).locator('.xw-inline-panel')).toHaveCount(0);

    // B7-10 f11: Ritu Sharma's EEE ZC341.
    await push(page, '/admin/roles/role-ritu-sharma');
    await expect(heading(page, 'Ritu Sharma')).toBeVisible({ timeout: 60_000 });
    await expect(effect(page)).toHaveText(
      'Can create experiments and submit them for: CHE ZG513, EEE ZC341.',
    );
    await expect(historyWhat(page)).toHaveText([
      'Scope assigned — EEE ZC341',
      'Registered as Vendor',
    ]);
    await press(
      page,
      main(page).getByRole('button', { name: 'Withdraw EEE ZC341 · Electrical Machines' }),
    );
    await press(page, main(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(main(page).locator('.xw-inline-panel .xr-error')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await checkState(page, 'Ritu Sharma');
    await shot(page, 'b7-10-f11-withdraw');

    // f7: the Content Manager with All experiments.
    await push(page, '/admin/roles/role-kavya-nair');
    await expect(heading(page, 'Kavya Nair')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'Content Manager · BITS Pilani · WILP',
    );
    await expect(effect(page)).toHaveText(
      'Decides publication and raises corrections for: All experiments.',
    );
    await expect(scopeList(page, 'Scope')).toHaveText([/^All experiments\s*Since 2 Jun 2026$/]);
    await expect(main(page).locator('ol.xr-timeline .xr-tl-note')).toHaveText([
      'Arjun Mehta · scope All experiments',
    ]);
    await checkState(page, 'Kavya Nair');
    await shot(page, 'b7-08-f7-content-manager');
  });
});
