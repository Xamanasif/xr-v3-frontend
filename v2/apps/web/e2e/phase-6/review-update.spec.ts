import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * RV-04 Review an update (board B6-04 f0 … f4; B6-13 f4; B7-11 f6) and CM-08 Updates (B6-09 f0;
 * B6-13 f2; B7-11 f2), with the update rows of RV-01, RV-02, RV-05 and CM-01 they open, on the
 * test-hook build at 1440, 1024, 768 and 375, on spine-start. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll).
 *
 * The CI seam only SETS UP the world (Kavya Nair opens, saves and sends a correction; later
 * withdraws one). Everything the screens do is done by real clicks and typing; the identity
 * changes in the same tab and the same world (`switchIdentity`) for the cross-role proof:
 *
 * - (a) Flow 6 step 2: Prof. A. Menon finds UPD-0005 in the Review queue → RV-04 (f0 … f2) →
 *   Approve update through DL-1 (f4) → the public experiment page still shows the live version
 *   1.2 (approval releases nothing) → Kavya Nair’s Updates list shows “Awaiting release decision
 *   · Super Admin” (B7-11 f2).
 * - (b) A second correction returned with a reason (DL-2, the reason first required; f3), reached
 *   from the Overview’s “Review update” and again from Reviewed by me → Kavya Nair’s list shows
 *   it “Returned · You · Continue”, and her Overview’s “Open update” opens it.
 * - (c) The list at spine-start (B6-13 f2), a draft not shown to the reviewer (B6-13 f4), and an
 *   update withdrawn while the reviewer has it open.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const MENON = { personId: 'per-a-menon' };
const KAVYA = { personId: 'per-kavya-nair' };

const LIVE_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const CORRECTED_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const NEW_LINK = 'https://labs.meridian.example/distillation-column-1-3';
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite. The web link moves to build 1.3, which carries the same correction in its on-screen notes.';
const RETURN_REASON =
  'The corrected sentence is right. Please also say that the measured flow uses the 1.2 discharge coefficient.';
const DISTILLATION_TITLE = 'Distillation Column · 1.2 → 1.3';
const ORIFICE_TITLE = 'Orifice Plate Metering · 1.1 → 1.2';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/review-update';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };
interface UpdateRef {
  readonly id: string;
  readonly rev: number;
  readonly proposed: Record<string, unknown>;
}

/** One port command as a sample person through the CI seam (set-up only), which must succeed. */
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

/**
 * Kavya Nair opens a correction (Edit catalogue details), changes it, labels it and — unless
 * `send` is false — sends it for academic review (set-up through the seam).
 */
async function propose(
  page: Page,
  experimentId: string,
  change: Record<string, unknown>,
  versionLabel: string,
  why: string,
  send = true,
): Promise<UpdateRef> {
  const opened = await port<{ readonly update: UpdateRef }>(
    page,
    KAVYA,
    'corrections',
    'openCorrection',
    { experimentId, entry: 'edit-catalogue-details' },
  );
  const saved = await port<UpdateRef>(page, KAVYA, 'corrections', 'saveCorrection', {
    id: opened.update.id,
    proposed: { ...opened.update.proposed, ...change },
    whatChangesAndWhy: why,
    versionLabel,
    expectedRev: opened.update.rev,
  });
  if (!send) return saved;
  return port<UpdateRef>(page, KAVYA, 'corrections', 'sendForAcademicReview', {
    id: saved.id,
    expectedRev: saved.rev,
  });
}

/** B6-04’s correction: the reflux sentence and the web link, version 1.3 (UPD-0005). */
function proposeDistillation(page: Page, send = true): Promise<UpdateRef> {
  return propose(
    page,
    'distillation-column',
    { description: CORRECTED_DESCRIPTION, webLink: NEW_LINK },
    '1.3',
    WHY,
    send,
  );
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const decided = (page: Page) => page.locator('#ru-dec');
const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');
const tableRows = (page: Page) => main(page).locator('table.xr-table tbody tr');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A board frame drawn at 720: the 768 run takes it at 720 too. */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  await shot(page, name);
  await page.setViewportSize({ width: 768, height: 1024 });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** A link reached and pressed: Enter after focus (a wrapped inline link at 375), else a click. */
async function follow(page: Page, link: Locator): Promise<void> {
  if (width(page) <= 375) {
    await link.focus();
    await page.keyboard.press('Enter');
  } else {
    await reachAndClick(page, link);
  }
}

/** ~72 / 28 from 860 px of content; below, the panel under the content with “Go to decision”. */
async function expectDecisionLayout(page: Page): Promise<void> {
  const stack = await main(page).locator('.xr-decide > .xr-stack').boundingBox();
  const aside = await panel(page).boundingBox();
  if (!stack || !aside) throw new Error('not laid out');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  const jump = main(page).locator('a.xr-jump');
  if (contentWidth >= 860) {
    expect(aside.x).toBeGreaterThan(stack.x + stack.width - 1);
    expect(aside.width / (stack.width + aside.width)).toBeLessThan(0.34);
    await expect(jump).toBeHidden();
  } else {
    expect(aside.y).toBeGreaterThan(stack.y + stack.height - 1);
    await expect(jump).toBeVisible();
  }
}

/** Below 860 px of content, “Go to decision” moves focus to the panel (f2 … f4). */
async function goToDecision(page: Page): Promise<void> {
  const jump = main(page).locator('a.xr-jump');
  if (!(await jump.isVisible())) return;
  await jump.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeFocused();
}

/** Below 760 px of content the table’s rows stack and its header row is hidden. */
async function expectTableLayout(page: Page): Promise<void> {
  const header = main(page).locator('table.xr-table thead');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (contentWidth < 760) {
    await expect
      .poll(() => header.evaluate((element) => getComputedStyle(element).position))
      .toBe('absolute');
  } else {
    await expect(header).toBeVisible();
  }
}

/** The crumbs from 1024 px, the top bar “Review queue” below (B6-04 f0 … f2). */
async function expectReviewShell(page: Page, id: string): Promise<void> {
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
  if (width(page) >= 1024) {
    await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
      new RegExp(`Review queue\\s*/\\s*${id}`),
    );
  } else {
    await expect(page.locator('.xr-top-title')).toHaveText('Review queue');
  }
}

test.describe('RV-04 Review an update and CM-08 Updates', () => {
  test('(a) Flow 6 step 2: queue → RV-04 (f0 … f2) → Approve update (DL-1, f4); nothing is released; her list says “Awaiting release decision · Super Admin”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    // Set-up through the seam: Kavya Nair sends the correction for academic review.
    const sent = await proposeDistillation(page);
    expect(sent.id).toBe('UPD-0005');

    // The Review queue lists it (B6-13 f3 → B7-11 f5): its primary “Review” opens RV-04.
    const row = tableRows(page).filter({ hasText: 'UPD-0005' });
    await expect(row.locator('.xw-tag')).toHaveText('Update');
    await follow(page, row.getByRole('link', { name: 'Review Distillation Column' }));
    await expect(page).toHaveURL(/\/reviewer\/updates\/UPD-0005$/, { timeout: 60_000 });
    await expect(heading(page, DISTILLATION_TITLE)).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);

    // f0 … f2: the header, what changes, why, the live experiment, the history, the open panel.
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'UPD-0005 · Update (Content Manager correction)',
    );
    await expect(chip(page)).toHaveText('Waiting for your decision');
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Waiting for your decisionFrom Kavya Nair · CHE ZG513 · live version 1.2',
    );
    const changes = page.getByRole('table', { name: 'Current and proposed' });
    await expect(changes.locator('.xg-cmp-f')).toHaveText([
      'Description',
      'WEB · web link',
      'Version',
    ]);
    await expect(changes.locator('.xg-cmp-pro').first()).toContainText(CORRECTED_DESCRIPTION);
    await expect(changes.locator('.xg-cmp-cur').first()).toContainText(LIVE_DESCRIPTION);
    await expect(
      page.getByRole('region', { name: 'Why — from the Content Manager' }).locator('blockquote'),
    ).toHaveText(WHY);
    const about = page.getByRole('region', { name: 'About this experiment' });
    await expect(about.locator('dd').first()).toHaveText(
      'CHE ZG513 · Process Instrumentation & Control',
    );
    await expect(about.locator('.xr-fmt')).toHaveText(['WEB', 'VR']);
    await expect(about.locator('ul.xv-los li')).toHaveText([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    await expect(about.locator('p.xl-open')).toHaveText(
      'Whether a correction may change formats, and references on update returns, are still open.',
    );
    const history = page.getByRole('region', { name: 'Update history' });
    await expect(history.locator('.xr-tl-what')).toHaveText([
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    await expect(history.locator('.xr-tl-note')).toHaveText([
      'To Prof. A. Menon. The live version 1.2 is unchanged.',
      'Pre-filled with the live version 1.2.',
    ]);
    await expect(panel(page).getByRole('radio', { name: /^Approve update/ })).toBeChecked();
    await expectReviewShell(page, 'UPD-0005');
    await expectDecisionLayout(page);
    await checkState(page, DISTILLATION_TITLE);
    if (width(page) === 1440) await shot(page, 'b6-04-f0-review');
    if (width(page) === 1024) await shot(page, 'b6-04-f1-review');
    if (width(page) === 375) await shot(page, 'b6-04-f2-review');
    await goToDecision(page);

    // DL-1: approval goes to the Super Admin; the live version stays.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve update' }));
    const dialog = page.getByRole('dialog', { name: 'Approve UPD-0005?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body')).toHaveText(
      'It goes to the Super Admin, who decides when to release it. Version 1.2 stays live until then.',
    );
    await expect(dialog.getByRole('button', { name: 'Approve update' })).toBeFocused();
    await checkState(page, DISTILLATION_TITLE);
    if (width(page) === 1024) await shot(page, 'b6-04-dl1-approve');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve update' }));
    await expect(dialog).toBeHidden();

    // f4: approved — with the Super Admin; the result is focused.
    await expect(decided(page).locator('.xr-status--ok')).toHaveText(
      'Approved — awaiting the Super Admin’s release decision',
    );
    await expect(decided(page)).toBeFocused();
    await expect(decided(page)).toContainText(
      'Version 1.2 stays live. Release or hold is the Super Admin’s decision.',
    );
    await expect(chip(page)).toHaveText('Approved — with the Super Admin');
    await expect(history.locator('.xr-tl-what')).toHaveText([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    await expect(
      decided(page).getByRole('link', { name: 'Back to the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    await checkState(page, DISTILLATION_TITLE);
    if (width(page) === 1440) await shot(page, 'b7-11-f6-approved');
    await shotAt720(page, 'b6-04-f4-approved');

    // Approval releases nothing: the public experiment page still reads the live version 1.2.
    await softNavigate(page, '/experiments/distillation-column');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('main')).toContainText('Lowering the reflux ratio raises');
    await expect(page.locator('main')).not.toContainText('Raising the reflux ratio raises');
    await expectSameDocument(page, mark);

    // Kavya Nair’s Updates (same tab, same world): awaiting the Super Admin’s release decision.
    await switchIdentity(page, KAVYA);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mine = tableRows(page).filter({ hasText: 'UPD-0005' });
    await expect(mine.locator('td')).toHaveText([
      'Distillation Column · 1.3UPD-0005',
      /^Awaiting release decision\d{1,2} [A-Z][a-z]{2} 2026$/,
      'Super Admin',
      'Open',
    ]);
    await expect(mine.locator('.xr-status')).toHaveClass(/xr-status--wait/);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    await expectTableLayout(page);
    await checkState(page, 'Updates');
    if (width(page) === 1440) await shot(page, 'b7-11-f2-updates');
    await follow(page, mine.getByRole('link', { name: 'Open UPD-0005 Distillation Column' }));
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005$/, { timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('(b) Return to the Content Manager (DL-2, reason required; f3) from the Overview; Reviewed by me opens it; her list: “Returned · You · Continue”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    // Set-up: a correction to Orifice Plate Metering (1.1 → 1.2), sent for academic review.
    const sent = await propose(
      page,
      'orifice-plate-metering',
      {
        summary:
          'Calibrate against a reference meter and propagate the instrument uncertainty into the reported flow and its interval.',
      },
      '1.2',
      'Names the reported interval in the summary, as the lab handout does.',
    );

    // RV-01: the update row’s “Review update” opens RV-04.
    const waiting = page.getByRole('region', { name: 'Waiting for your decision' });
    const updateRow = waiting
      .locator('li.xr-row')
      .filter({ hasText: 'Update: Orifice Plate Metering' });
    await follow(
      page,
      updateRow.getByRole('link', { name: 'Review update Orifice Plate Metering' }),
    );
    await expect(page).toHaveURL(new RegExp(`/reviewer/updates/${sent.id}$`), { timeout: 60_000 });
    await expect(heading(page, ORIFICE_TITLE)).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);
    await goToDecision(page);

    // DL-2: the reason first required.
    await reachAndClick(
      page,
      panel(page).getByRole('radio', { name: /^Return to the Content Manager/ }),
    );
    await reachAndClick(
      page,
      panel(page).getByRole('button', { name: 'Return to the Content Manager' }),
    );
    const dialog = page.getByRole('dialog', { name: 'Return to the Content Manager?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'The Content Manager sees your reason and can change the update and send it again.',
    );
    const reason = dialog.getByRole('textbox', { name: 'Reason the Content Manager will see' });
    await expect(reason).toBeFocused();
    await expect(dialog.getByRole('checkbox')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Return to the Content Manager' }).click();
    await expect(dialog.locator('.xr-error')).toHaveText(
      'Add a reason so the Content Manager knows what to change',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toBeFocused();
    await checkState(page, ORIFICE_TITLE);
    if (width(page) === 1024) await shot(page, 'b6-04-dl2-reason-required');
    await reason.fill(RETURN_REASON);
    await reachAndClick(
      page,
      dialog.getByRole('button', { name: 'Return to the Content Manager' }),
    );
    await expect(dialog).toBeHidden();

    // f3: returned to the Content Manager, read-only for the reviewer.
    await expect(decided(page).locator('.xr-status--err')).toHaveText(
      'Returned to the Content Manager',
    );
    await expect(decided(page)).toBeFocused();
    await expect(decided(page)).toContainText(`“${RETURN_REASON}”`);
    await expect(decided(page)).toContainText(
      'The Content Manager can change it and send it again.',
    );
    await expect(chip(page)).toHaveText('Returned to the Content Manager');
    await expect(
      page.getByRole('region', { name: 'Update history' }).locator('.xr-tl-what').first(),
    ).toHaveText('Returned by Prof. A. Menon');
    await checkState(page, ORIFICE_TITLE);
    await shotAt720(page, 'b6-04-f3-returned');

    // RV-05 Reviewed by me: the decided update’s “Open” opens it read-only.
    await softNavigate(page, '/reviewer/reviewed');
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 90_000 });
    const decidedRow = tableRows(page).filter({ hasText: sent.id });
    await expect(decidedRow.locator('.xr-status')).toHaveText('Returned to the Content Manager');
    await follow(page, decidedRow.getByRole('link', { name: 'Open Orifice Plate Metering' }));
    await expect(heading(page, ORIFICE_TITLE)).toBeVisible({ timeout: 90_000 });
    await expect(decided(page).locator('.xr-status--err')).toHaveText(
      'Returned to the Content Manager',
    );
    await expectSameDocument(page, mark);

    // Kavya Nair: “Returned · You · Continue”; her Overview’s “Open update” opens it.
    await switchIdentity(page, KAVYA);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mine = tableRows(page).filter({ hasText: sent.id });
    await expect(mine.locator('td')).toHaveText([
      `Orifice Plate Metering · 1.2${sent.id}`,
      /^Returned\d{1,2} [A-Z][a-z]{2} 2026$/,
      'You',
      'Continue',
    ]);
    await expect(mine.locator('.xr-status')).toHaveClass(/xr-status--err/);
    await expect(
      mine.getByRole('link', { name: `Continue ${sent.id} Orifice Plate Metering` }),
    ).toHaveAttribute('href', `/content-manager/updates/${sent.id}`);
    await checkState(page, 'Updates');
    await softNavigate(page, '/content-manager');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const needs = page.getByRole('region', { name: 'Needs your decision' });
    const returned = needs.locator('li.xr-row').filter({ hasText: 'Orifice Plate Metering' });
    await expect(returned.locator('.xr-row-title')).toHaveText(
      'Update returned: Orifice Plate Metering 1.2',
    );
    await follow(page, returned.getByRole('link', { name: 'Open update' }));
    await expect(page).toHaveURL(new RegExp(`/content-manager/updates/${sent.id}$`), {
      timeout: 60_000,
    });
    await expectSameDocument(page, mark);
  });

  test('(c) the list at spine-start (B6-13 f2); a draft is not the reviewer’s (B6-13 f4); withdrawn while open', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    await expect(main(page).locator('.xr-phead-meta .xl-meta')).toHaveText(
      'The only way to change published content: you → Academic Reviewer → Super Admin release',
    );
    const section = page.getByRole('region', { name: 'Corrections you raised' });
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText('5 updates');
    await expect(tableRows(page).locator('td.is-primary')).toHaveText([
      'Induction Motor Loading · 1.1UPD-0006',
      'Boiler Drum Level · 2.1UPD-0004',
      'Orifice Plate Metering · 1.1UPD-0003',
      'Distillation Column · 1.2UPD-0002',
      'Distillation Column · 1.1UPD-0001',
    ]);
    await expect(tableRows(page).locator('.xr-status')).toHaveText([
      'Returned',
      'On hold',
      'Released',
      'Released',
      'Released',
    ]);
    await expect(tableRows(page).locator('td[data-label="With"]')).toHaveText([
      'You',
      'Super Admin',
      '—',
      '—',
      '—',
    ]);
    await expect(tableRows(page).getByRole('link')).toHaveText([
      'Continue',
      'Open',
      'Open',
      'Open',
      'Open',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    await expectTableLayout(page);
    await checkState(page, 'Updates');
    if (width(page) === 1440) await shot(page, 'b6-13-f2-updates');
    if (width(page) === 375) await shot(page, 'b6-09-updates-stacked');
    await shotAt720(page, 'b6-09-updates-720');
    // “Continue” opens the returned correction.
    await follow(
      page,
      tableRows(page)
        .first()
        .getByRole('link', { name: 'Continue UPD-0006 Induction Motor Loading' }),
    );
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0006$/, { timeout: 60_000 });
    await expectSameDocument(page, mark);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });

    // A draft (set-up): hers to continue, never shown to the Academic Reviewer.
    const draft = await proposeDistillation(page, false);
    await expect(tableRows(page).first().locator('td')).toHaveText([
      `Distillation Column · 1.3${draft.id}`,
      /^Draft\d{1,2} [A-Z][a-z]{2} 2026$/,
      'You',
      'Continue',
    ]);
    await switchIdentity(page, MENON);
    await softNavigate(page, `/reviewer/updates/${draft.id}`);
    const none = main(page).getByRole('heading', {
      level: 2,
      name: 'No update is waiting for your decision',
    });
    await expect(none).toBeVisible({ timeout: 90_000 });
    await expect(heading(page, 'Review an update')).toBeVisible();
    await expect(main(page)).not.toContainText(CORRECTED_DESCRIPTION);
    await checkState(page, 'Review an update');
    if (width(page) === 1440) await shot(page, 'b6-13-f4-not-sent');
    await follow(page, main(page).getByRole('link', { name: 'Open the review queue' }));
    await expect(page).toHaveURL(/\/reviewer\/queue$/, { timeout: 60_000 });
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });

    // Sent, then withdrawn by the Content Manager while the reviewer has it open.
    await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
      id: draft.id,
      expectedRev: draft.rev,
    });
    await softNavigate(page, `/reviewer/updates/${draft.id}`);
    await expect(heading(page, DISTILLATION_TITLE)).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Waiting for your decision');
    const current = await port<{ readonly update: UpdateRef }>(
      page,
      KAVYA,
      'corrections',
      'getUpdate',
      draft.id,
    );
    await port(page, KAVYA, 'corrections', 'withdrawUpdate', {
      id: draft.id,
      reason: 'The vendor will fix the build first.',
      expectedRev: current.update.rev,
    });
    await expect(chip(page)).toHaveText('Withdrawn');
    await expect(decided(page)).toHaveText(
      'Withdrawn by the Content ManagerBack to the review queue',
    );
    await expect(main(page)).not.toContainText('The vendor will fix the build first.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, DISTILLATION_TITLE);
    await expectSameDocument(page, mark);
  });
});
