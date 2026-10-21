import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-16 Platform roles and SA-17 Role holder in the owner-approved V3 design
 * (design/v3-refined-b/roles/SA-v1, `sa-views-d.js` `V.roles`, `V.holder`; renders
 * `<width>_roles_reviewers`, `<width>_roles_holder_k-iyer`, `state_<width>_sa17-withdraw-inline`) on
 * the test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta on after-flow-e (23 Oct 2026: Dr K.
 * Iyer registered with no scope, SUB-0085 stuck — no Academic Reviewer has EEE ZC341). Each drawn
 * state passes `checkState` (axe
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/sa-roles/spec-shots';

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
const tableRows = (page: Page) => main(page).locator('table.rk-table tbody tr');
const flash = (page: Page) => main(page).locator('#role-holder-flash');
const pageTabs = (page: Page) => page.getByRole('navigation', { name: 'Platform roles' });
const panel = (page: Page) => page.getByRole('complementary', { name: 'Assign scope' });
const scopeList = (page: Page, section: 'Can act on' | 'Withdrawn') =>
  page.getByRole('region', { name: section }).locator('ul.sa-scopes > li > .sa-scope-row > div');
const historyWhat = (page: Page) => main(page).locator('ol.rk-tl > li .rk-tl-w');
const effect = (page: Page) =>
  page.getByRole('region', { name: 'Can act on' }).locator('p.rk-next');
const inline = (page: Page) => main(page).locator('.sa-inline');

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
  test('Vendors, Reviewers and Content Managers by real clicks on the page tabs; open a holder', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Who can produce, review and publish content, and for what.',
    );
    const tabs = pageTabs(page);
    await expect(tabs.getByRole('link')).toHaveText([
      'Vendors 2',
      'Reviewers 2',
      'Content Managers 1',
    ]);
    await expect(tabs.getByRole('link', { name: /^Vendors/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('region', { name: 'Vendors' })).toBeVisible();
    await expect(tableRows(page)).toHaveCount(2);
    await expect(tableRows(page).nth(0).locator('td.rk-c-inst')).toHaveText(
      'Anil ShettyNorthline Simulation Studio',
    );
    await expect(tableRows(page).nth(0).locator('td.rk-c-exp')).toHaveText(
      'ME ZG5231 scope withdrawn',
    );
    await expect(tableRows(page).nth(1).locator('td.rk-c-exp .rk-code')).toHaveText([
      'CHE ZG513',
      'EEE ZC341',
    ]);
    await expect(tableRows(page).nth(0).locator('td.rk-c-st')).toHaveText('Has scope');
    await expect(main(page).locator('.rk-notice--warn')).toHaveCount(0);
    await expect(main(page).locator('p.rk-ca-foot')).toHaveText(
      'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-vendors');

    // Reviewers: the address follows; the no-scope notice names Dr K. Iyer; his row says No scope.
    await press(page, tabs.getByRole('link', { name: /^Reviewers/ }));
    await expect(page).toHaveURL(/\/admin\/roles\?tab=reviewers$/);
    await expect(heading(page, 'Platform roles')).toBeFocused();
    await expect(page.getByRole('region', { name: 'Reviewers' })).toBeVisible();
    const notice = main(page).locator('.rk-notice--warn');
    await expect(notice.locator('.rk-notice-t')).toHaveText('Dr K. Iyer has no scope yet');
    await expect(notice.locator('.rk-notice-d')).toHaveText(
      'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.',
    );
    await expect(tableRows(page).locator('a.rk-rowlink')).toHaveText([
      'Prof. A. Menon',
      'Dr K. Iyer',
    ]);
    await expect(tableRows(page).nth(0).locator('td.rk-c-exp .rk-code')).toHaveText([
      'ME ZG523',
      'MEL ZG512',
      'CHE ZG513',
    ]);
    await expect(tableRows(page).nth(1).locator('td.rk-c-exp')).toHaveText('Nothing yet');
    await expect(tableRows(page).nth(1).locator('.xr-st--warn')).toHaveText('No scope');
    await expect(page.getByRole('button', { name: 'Register a Reviewer' })).toBeVisible();
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-reviewers');

    // Content Managers.
    await press(page, tabs.getByRole('link', { name: /^Content Managers/ }));
    await expect(page).toHaveURL(/\/admin\/roles\?tab=content-managers$/);
    await expect(tableRows(page)).toHaveCount(1);
    await expect(tableRows(page).nth(0).locator('td.rk-c-exp')).toHaveText('All experiments');
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-content-managers');

    // Back to Reviewers; the notice's Assign scope opens Dr K. Iyer, in the same tab; Back returns.
    await press(page, tabs.getByRole('link', { name: /^Reviewers/ }));
    await expect(page).toHaveURL(/\/admin\/roles\?tab=reviewers$/);
    const mark = await markDocument(page);
    await press(page, notice.getByRole('link', { name: 'Assign scope' }));
    await expect(page).toHaveURL(/\/admin\/roles\/role-0001$/, { timeout: 60_000 });
    await expect(heading(page, 'Dr K. Iyer')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/roles\?tab=reviewers$/);
    // The row's link, named by its content, opens the holder. (A press elsewhere on the row is the
    // kit's `RecordTable` behaviour; inside the V3 shell it is ignored today — reported to the lead.)
    await press(
      page,
      page.getByRole('link', { name: 'Dr K. Iyer, Academic Reviewer, no scope. Open' }),
    );
    await expect(page).toHaveURL(/\/admin\/roles\/role-0001$/, { timeout: 60_000 });
    await expectSameDocument(page, mark);
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
    await expect(page.getByRole('region', { name: 'Vendors' })).toBeVisible();
  });

  test('Register a Vendor: all three required; a used e-mail refused; registered → SA-17 with the flash', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles');
    await expect(heading(page, 'Platform roles')).toBeVisible({ timeout: 90_000 });
    await expect(tableRows(page)).toHaveCount(2);
    await press(page, page.getByRole('button', { name: 'Register a Vendor' }));
    const dialog = page.getByRole('dialog', { name: 'Register a Vendor' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-head p')).toHaveText(
      'Registering doesn’t send an invitation. You assign what they can act on next.',
    );
    const name = dialog.getByRole('textbox', { name: 'Name' });
    const email = dialog.getByRole('textbox', { name: 'Work e-mail' });
    const organisation = dialog.getByRole('textbox', { name: 'Organisation' });
    await expect(name).toBeFocused();
    await press(page, dialog.getByRole('button', { name: 'Register' }));
    await expect(dialog.locator('.rk-ferr')).toHaveText([
      'Enter the person’s name',
      'Enter a work e-mail address',
      'Enter the organisation',
    ]);
    await expect(name).toBeFocused();
    await checkState(page, 'Platform roles');
    await shot(page, 'sa-16-register-validation');

    // An e-mail someone already signs in with (PC-49): SA-16's words, nothing registered.
    await name.pressSequentially('Kavya Nair');
    await email.pressSequentially('kavya.nair@wilp.example');
    await organisation.pressSequentially('BITS Pilani · WILP');
    await press(page, dialog.getByRole('button', { name: 'Register' }));
    await expect(dialog.locator('.rk-ferr')).toHaveText(
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
    await expect(flash(page).locator('.rk-notice-t')).toHaveText(
      'Neha Kapoor is registered as Vendor.',
    );
    await expect(flash(page).locator('.rk-notice-d')).toHaveText(
      'Assign what they can act on. Nothing was sent to them.',
    );
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Vendor');
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Vertex Simulations');
    await expect(effect(page)).toHaveText(
      'Can’t create or submit experiments yet. Nothing is in scope.',
    );
    await expect(historyWhat(page)).toHaveText(['Registered as Vendor']);
    await expect(main(page).locator('ol.rk-tl > li .rk-tl-n')).toHaveText([
      'Arjun Mehta · no scope yet',
    ]);
    await checkState(page, 'Neha Kapoor');
    await shot(page, 'sa-17-registered');

    // Back to the list by the crumb: three Vendors, one without scope.
    await press(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
        name: 'Platform roles',
      }),
    );
    await expect(page).toHaveURL(/\/admin\/roles$/);
    await expect(pageTabs(page).getByRole('link').first()).toHaveText('Vendors 3');
    await expect(main(page).locator('.rk-notice--warn .rk-notice-t')).toHaveText(
      'Neha Kapoor has no scope yet',
    );
  });
});

test.describe('SA-17 Role holder', () => {
  test('Dr K. Iyer: Assign scope validation; EEE ZC341 assigned → SUB-0085 is no longer stuck and is in his queue', async ({
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
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link')).toHaveText(['Platform roles', 'Reviewers']);
    await expect(crumbs.getByRole('link', { name: 'Reviewers' })).toHaveAttribute(
      'href',
      '/admin/roles?tab=reviewers',
    );
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Academic Reviewer');
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      'No scopeBITS Pilani · WILPRegistered 20 Oct 2026',
    );
    await expect(main(page).locator('.rk-notice--warn')).toHaveText(
      'No scope — can’t act on anything yetAssign a scope so they can act: all experiments, a course, or one experiment.',
    );
    await expect(effect(page)).toHaveText(
      'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.',
    );
    await expect(main(page).locator('dl.rk-dl')).toContainText('k.iyer@wilp.example');
    await expect(main(page).locator('dl.rk-dl')).toContainText('20 Oct 2026');
    await expect(
      main(page).getByText('How they first sign in is still open. Nothing is sent from here.'),
    ).toBeVisible();
    await expect(historyWhat(page)).toHaveText(['Registered as Academic Reviewer']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin/roles');
    // Where the panel follows the record (under 860 px of page), “Go to assign scope” leads to it.
    const goTo = main(page).getByRole('link', { name: 'Go to assign scope' });
    if (width(page) >= 1440) await expect(goTo).toBeHidden();
    else {
      await expect(goTo).toBeVisible();
      // As the export's `goInPanel`: the panel scrolls into view and its heading takes focus; the
      // address does not change.
      const before = page.url();
      await press(page, goTo);
      await expect(page.locator('#assign-scope-h')).toBeFocused();
      await expect(panel(page)).toBeInViewport();
      expect(page.url()).toBe(before);
    }
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'sa-17-no-scope');

    // Nothing chosen, then “A course” chosen with no course picked: the summary and the fields.
    const assign = panel(page).getByRole('button', { name: 'Assign scope' });
    await press(page, assign);
    const summary = panel(page).locator('.rk-errsum');
    await expect(summary).toHaveText('Check the scopeChoose what they can act on');
    await expect(summary).toBeFocused();
    await press(page, panel(page).getByRole('radio', { name: 'A course' }));
    await expect(summary).toHaveCount(0);
    await press(page, assign);
    const course = panel(page).getByRole('combobox', { name: 'Course' });
    await expect(summary).toHaveText('Check the scopeChoose a course');
    await expect(summary).toBeFocused();
    await expect(course).toHaveAttribute('aria-invalid', 'true');
    await expect(panel(page).locator('.rk-field .rk-ferr')).toHaveText('Choose a course');
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'sa-17-assign-validation');
    await press(page, summary.getByRole('link', { name: 'Choose a course' }));
    await expect(course).toBeFocused();

    await course.selectOption({ label: 'EEE ZC341 · Electrical Machines' });
    await press(page, assign);
    await expect(flash(page)).toHaveText(
      'Scope assigned: EEE ZC341.It now appears in their workspace.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(main(page).locator('.rk-notice--warn')).toHaveCount(0);
    await expect(scopeList(page, 'Can act on')).toHaveText([
      /^EEE ZC341\s*Electrical Machines\s*Assigned \d+ Oct 2026$/,
    ]);
    await expect(effect(page)).toHaveText(
      'Sees submissions and updates for these in the review queue: EEE ZC341.',
    );
    await expect(historyWhat(page)).toHaveText([
      'Scope assigned: EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
    await checkState(page, 'Dr K. Iyer');
    await shot(page, 'sa-17-assigned');

    // SA-12 after: nothing is stuck any more.
    await push(page, '/admin/content/all');
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).getByRole('table')).toBeVisible({ timeout: 60_000 });
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
    // RV-02 (V3, RV-v1): each row's link is the experiment's name.
    await expect(main(page).locator('table.rk-table tbody a.rk-rowlink')).toHaveText([
      'DC Motor Speed Control',
    ]);
  });

  test('Prof. A. Menon: ME ZG523 withdrawn with a reason (inline) — his queue drops it at once; restored (confirmation) — it is back', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles/role-a-menon');
    await expect(heading(page, 'Prof. A. Menon')).toBeVisible({ timeout: 90_000 });
    const submission = await submitPinFins(page);

    // Restore EEE ZC341 asks no reason — a confirmation; Cancel returns focus.
    const restoreEee = main(page).getByRole('button', {
      name: 'Restore scope EEE ZC341 · Electrical Machines',
    });
    await press(page, restoreEee);
    const confirmation = page.getByRole('dialog', {
      name: 'Restore EEE ZC341 for Prof. A. Menon?',
    });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByRole('button', { name: 'Restore scope' })).toBeFocused();
    await expect(confirmation.locator('.rk-dlg-head p')).toHaveText(
      'The same scope comes back. No reason is asked; the earlier withdrawal stays in the history.',
    );
    await expect(confirmation.locator('textarea')).toHaveCount(0);
    await checkState(page, 'Prof. A. Menon');
    await shot(page, 'sa-17-restore');
    await press(page, confirmation.getByRole('button', { name: 'Cancel' }));
    await expect(confirmation).toBeHidden();
    await expect(restoreEee).toBeFocused();

    // Withdraw ME ZG523: a reason is required, inline below the scope.
    await press(
      page,
      main(page).getByRole('button', {
        name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    );
    const reason = main(page).getByRole('textbox', { name: 'Reason for withdrawing ME ZG523' });
    await expect(reason).toBeFocused();
    await press(page, inline(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(inline(page).locator('.rk-ferr')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await expect(reason).toBeFocused();
    await checkState(page, 'Prof. A. Menon');
    await shot(page, 'sa-17-withdraw-inline');
    await reason.pressSequentially('Thermodynamics reviews move to the mechanical faculty.');
    await press(page, inline(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(flash(page)).toHaveText(
      'Scope withdrawn: ME ZG523.The reason is kept with the scope.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(scopeList(page, 'Withdrawn').first()).toContainText(
      '“Thermodynamics reviews move to the mechanical faculty.”',
    );
    await expect(historyWhat(page).first()).toHaveText('Scope withdrawn: ME ZG523');
    await checkState(page, 'Prof. A. Menon');

    // As Prof. A. Menon, in this tab: the ME ZG523 submission has left his queue straight away.
    await switchIdentity(page, MENON);
    await push(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    // RV-02 (V3, RV-v1): each row's link is the experiment's name.
    const queue = main(page).locator('table.rk-table tbody a.rk-rowlink');
    await expect(queue).toHaveText(['Flash Distillation', 'Venturi Meter Calibration']);
    await expect(main(page)).not.toContainText(submission);

    // Back as the Super Admin: Restore ME ZG523 — no reason asked.
    await switchIdentity(page, SA);
    await push(page, '/admin/roles/role-a-menon');
    await expect(heading(page, 'Prof. A. Menon')).toBeVisible({ timeout: 90_000 });
    await press(
      page,
      main(page).getByRole('button', {
        name: 'Restore scope ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    );
    await press(
      page,
      page
        .getByRole('dialog', { name: 'Restore ME ZG523 for Prof. A. Menon?' })
        .getByRole('button', { name: 'Restore scope' }),
    );
    await expect(flash(page)).toHaveText('Scope restored: ME ZG523.');
    await expect(historyWhat(page).first()).toHaveText('Scope restored: ME ZG523');

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

  test('Anil Shetty (withdraw · reason required), Ritu Sharma, Kavya Nair (All experiments)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles/role-anil-shetty');
    await expect(heading(page, 'Anil Shetty')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Vendor');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Vendors' }),
    ).toHaveAttribute('href', '/admin/roles?tab=vendors');
    await expect(effect(page)).toHaveText('Can create experiments and submit them for: ME ZG523.');
    await expect(scopeList(page, 'Can act on')).toHaveText([
      /^ME ZG523\s*Thermodynamics & Heat Transfer\s*Assigned 4 Jul 2026$/,
    ]);
    await expect(scopeList(page, 'Withdrawn')).toHaveText([
      /^MEL ZG512\s*Manufacturing Processes\s*Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term\.”$/,
    ]);
    await expect(historyWhat(page)).toHaveText([
      'Scope withdrawn: MEL ZG512',
      'Registered as Vendor',
    ]);
    await checkState(page, 'Anil Shetty');
    await shot(page, 'sa-17-role-holder');

    // Withdraw, no reason given; Cancel returns focus to Withdraw.
    const withdraw = main(page).getByRole('button', {
      name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
    });
    await press(page, withdraw);
    await press(page, inline(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(inline(page).locator('.rk-ferr')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await checkState(page, 'Anil Shetty');
    await press(page, inline(page).getByRole('button', { name: 'Cancel' }));
    await expect(withdraw).toBeFocused();
    await expect(inline(page)).toHaveCount(0);

    // Ritu Sharma's EEE ZC341.
    await push(page, '/admin/roles/role-ritu-sharma');
    await expect(heading(page, 'Ritu Sharma')).toBeVisible({ timeout: 60_000 });
    await expect(effect(page)).toHaveText(
      'Can create experiments and submit them for: CHE ZG513, EEE ZC341.',
    );
    await expect(historyWhat(page)).toHaveText([
      'Scope assigned: EEE ZC341',
      'Registered as Vendor',
    ]);
    await press(
      page,
      main(page).getByRole('button', { name: 'Withdraw scope EEE ZC341 · Electrical Machines' }),
    );
    await press(page, inline(page).getByRole('button', { name: 'Withdraw scope' }));
    await expect(inline(page).locator('.rk-ferr')).toHaveText(
      'Add a reason — it is kept in the history',
    );
    await checkState(page, 'Ritu Sharma');
    await shot(page, 'sa-17-withdraw-ritu');

    // The Content Manager with All experiments.
    await push(page, '/admin/roles/role-kavya-nair');
    await expect(heading(page, 'Kavya Nair')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Content Manager');
    await expect(effect(page)).toHaveText(
      'Decides publication and raises corrections for: All experiments.',
    );
    await expect(scopeList(page, 'Can act on')).toHaveText([
      /^All experiments\s*Assigned 2 Jun 2026$/,
    ]);
    await expect(main(page).locator('ol.rk-tl > li .rk-tl-n')).toHaveText([
      'Arjun Mehta · scope All experiments',
    ]);
    await checkState(page, 'Kavya Nair');
    await shot(page, 'sa-17-content-manager');
  });

  test('an address that names no holder is the “not available” message in place', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: FIXTURE, session: SA });
    await page.goto('/admin/roles/role-nobody');
    await expect(heading(page, 'This page isn’t available')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
    await expect(main(page)).not.toContainText('role-nobody');
    await checkState(page, 'This page isn’t available');
  });
});
