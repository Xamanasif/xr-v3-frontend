import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-10 Content › Updates (B7-05 f0, f2, f3, f4; B7-11 f0) and SA-11 Release or hold an update
 * (B7-05 f1, f5 … f11; B7-10 f0 … f4; B7-11 f1; B7-12 f0 … f3) on the test-hook build at 1440,
 * 1024, 768 and 375, as Arjun Mehta. Each drawn state passes `checkState` (axe WCAG A/AA, one h1,
 * visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 *
 * Flow F, steps 3–5, in one tab (one world, client-side navigation only): on after-flow-e the
 * Super Admin opens UPD-0005 from Updates, releases it through DL-1, and the Content Manager's
 * published experiment then reads version 1.3 with the corrected description, while the
 * institutions' plans, licences and Student grants read exactly as before. A second approved
 * correction (Shell-and-Tube Heat Exchanger, set up through the CI seam as Kavya Nair and Prof.
 * A. Menon) is held with a reason: the public page keeps the live summary, the panel offers only
 * Lift hold and the service refuses a release; lifted, then released, the public page shows the
 * new summary and Rahul Verma still opens the experiment. The CI seam only SETS UP that correction
 * and READS facts; every decision is made by real clicks and typing.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ARJUN = { personId: 'sa-arjun-mehta' };
const KAVYA = { personId: 'per-kavya-nair' };
const MENON = { personId: 'per-a-menon' };
const RAHUL = { personId: 'per-0002' };
const LIST = '/admin/content/updates';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_SUMMARY = 'Counter-flow and parallel-flow runs, with the LMTD read from your own data.';
const HOLD_REASON = 'Hold until the Hyderabad lab has finished this month’s runs on version 1.2.';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/release';

type PortAnswer<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly kind: string; readonly code?: string } };

/** One port call as a sample person through the CI seam (set-up and reads), which must succeed. */
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

interface UpdateRef {
  readonly id: string;
  readonly rev: number;
  readonly proposed: Record<string, unknown>;
}

/** Kavya opens a correction of Shell-and-Tube's summary and sends it; Prof. A. Menon approves it. */
async function approvedShellCorrection(page: Page): Promise<string> {
  const opened = await port<{ readonly update: UpdateRef }>(
    page,
    KAVYA,
    'corrections',
    'openCorrection',
    { experimentId: SHELL, entry: 'edit-catalogue-details' },
  );
  const saved = await port<UpdateRef>(page, KAVYA, 'corrections', 'saveCorrection', {
    id: opened.update.id,
    proposed: { ...opened.update.proposed, summary: SHELL_SUMMARY },
    whatChangesAndWhy: 'The summary now says what the Student measures.',
    versionLabel: '1.1',
    expectedRev: opened.update.rev,
  });
  const sent = await port<UpdateRef>(page, KAVYA, 'corrections', 'sendForAcademicReview', {
    id: saved.id,
    expectedRev: saved.rev,
  });
  await port(page, MENON, 'corrections', 'approveUpdate', { id: sent.id, expectedRev: sent.rev });
  return sent.id;
}

/**
 * Every access fact a release could touch, read through the CI seam (reads only): each
 * institution with its plans, licences and people as the Super Admin reads it, and Rahul's
 * experiment hub as he reads it.
 */
async function accessFacts(page: Page): Promise<string> {
  const rows = await port<readonly { readonly id: string }[]>(
    page,
    ARJUN,
    'institutions',
    'listInstitutions',
    { tab: 'all' },
  );
  const details = [];
  for (const row of rows) {
    details.push(await port(page, ARJUN, 'institutions', 'getInstitution', row.id));
  }
  const hub = await port<{ readonly grantIds: unknown }>(
    page,
    RAHUL,
    'studentAccess',
    'getExperimentHub',
    SHELL,
  );
  return JSON.stringify({ rows, details, grants: hub.grantIds });
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');
const tabs = (page: Page) => page.getByRole('tablist', { name: 'Show' });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A 720 frame of a board, taken in the 768 project. */
async function shot720(page: Page, name: string): Promise<void> {
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

/** ~74 / 26 from 860 px of content; below, the panel under the content with “Go to decision”. */
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

async function expectNoPublish(page: Page): Promise<void> {
  expect(await main(page).innerText()).not.toMatch(/\bPublish/);
}

test.describe('SA-10 Content › Updates', () => {
  test('Waiting for you, On hold and Released by real clicks; each row opens its decision (f0, f2, f3)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    await page.goto(LIST);
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 90_000 });
    await expect(tabs(page)).toBeVisible({ timeout: 60_000 });
    const mark = await markDocument(page);
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Corrections raised by the Content Manager and approved by the Academic Reviewer wait here for release',
    );
    const subnav = page.getByRole('navigation', { name: 'Content' });
    await expect(subnav.getByRole('link')).toHaveText(['Updates', 'All content']);
    await expect(subnav.getByRole('link', { name: 'Updates' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(tabs(page).getByRole('tab')).toHaveText([
      /Waiting for you\s*1/,
      /On hold\s*1/,
      /Released\s*3/,
    ]);
    const rows = main(page).locator('table.xr-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Distillation Column · 1.2 → 1.3');
    await expect(rows.first()).toContainText('UPD-0005 · CHE ZG513');
    await expect(rows.first().locator('.xr-status--wait')).toHaveText('Waiting for your decision');
    await expect(rows.first()).toContainText('Approved by the Academic Reviewer on 22 Oct 2026');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expectNoPublish(page);
    await checkState(page, 'Content');
    if (width(page) === 1440) await shot(page, 'b705-f0-updates');
    await shot720(page, 'b705-f0-updates');

    // f2: On hold (the address follows the tab).
    await reachAndClick(page, tabs(page).getByRole('tab', { name: /On hold/ }));
    await expect(page).toHaveURL(/\/admin\/content\/updates\?show=on-hold$/);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Boiler Drum Level · 2.0 → 2.1');
    await expect(rows.first()).toContainText('On hold since 20 Aug 2026');
    await expect(rows.first().getByRole('link')).toHaveText('Open');
    await checkState(page, 'Content');
    await shot720(page, 'b705-f2-on-hold');
    if (width(page) === 375) await shot(page, 'b705-f2-on-hold');

    // f3: Released, newest first.
    await reachAndClick(page, tabs(page).getByRole('tab', { name: /Released/ }));
    await expect(page).toHaveURL(/\/admin\/content\/updates\?show=released$/);
    await expect(rows).toHaveCount(3);
    await expect(rows.locator('td.is-primary strong')).toHaveText([
      'Orifice Plate Metering · 1.0 → 1.1',
      'Distillation Column · 1.1 → 1.2',
      'Distillation Column · 1.0 → 1.1',
    ]);
    await expect(rows.first()).toContainText('Released on 5 Aug 2026');
    await checkState(page, 'Content');
    await shot720(page, 'b705-f3-released');

    // Back to Waiting for you; “Review” opens SA-11 in the same document.
    await reachAndClick(page, tabs(page).getByRole('tab', { name: /Waiting for you/ }));
    await expect(page).toHaveURL(/\/admin\/content\/updates$/);
    await reachAndClick(
      page,
      rows.first().getByRole('link', { name: 'Review UPD-0005 Distillation Column · 1.2 → 1.3' }),
    );
    await expect(heading(page, 'Distillation Column · 1.2 → 1.3')).toBeVisible({
      timeout: 90_000,
    });
    await expect(page).toHaveURL(/\/admin\/content\/updates\/UPD-0005$/);
    await expectSameDocument(page, mark);
  });

  test('nothing waiting: the calm empty state (f4)', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ARJUN });
    await page.goto(LIST);
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 90_000 });
    const empty = main(page).locator('.xr-empty');
    await expect(empty.getByRole('heading', { level: 3 })).toHaveText(
      'Nothing is waiting for a release decision',
      { timeout: 60_000 },
    );
    await expect(empty.locator('p')).toHaveText(
      'Corrections reach you after the Academic Reviewer approves them.',
    );
    await expect(tabs(page).getByRole('tab')).toHaveText([
      /Waiting for you\s*0/,
      /On hold\s*1/,
      /Released\s*3/,
    ]);
    await checkState(page, 'Content');
    await shot720(page, 'b705-f4-nothing-waiting');
    // An unknown tab in the address is replaced by the list's own address.
    await page.goto(`${LIST}?show=everything`);
    await expect(page).toHaveURL(/\/admin\/content\/updates$/, { timeout: 60_000 });
  });
});

test.describe('SA-11 Release or hold an update', () => {
  test('Flow F: UPD-0005 released through DL-1; the Content Manager reads 1.3; no access changed (f1, f8, f6)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    await page.goto(`${LIST}/UPD-0005`);
    const title = heading(page, 'Distillation Column · 1.2 → 1.3');
    await expect(title).toBeVisible({ timeout: 90_000 });
    await expect(panel(page)).toBeVisible();
    const mark = await markDocument(page);

    // f1: waiting for your decision.
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'UPD-0005 · Correction to published content',
    );
    await expect(chip(page)).toHaveText('Waiting for your decision');
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Live now: version 1.2 · since 3 Jul 2026',
    );
    const comparison = main(page).getByRole('table', { name: 'Current and proposed' });
    await expect(comparison.getByRole('rowheader')).toHaveText([
      'Description',
      'WEB · web link',
      'Version',
    ]);
    await expect(
      main(page).getByRole('region', { name: 'Institutions using it' }).locator('tbody tr'),
    ).toHaveText([
      /BITS Pilani — Hyderabad Campus\s*ACC-0098 · WEB \+ VR.*Access ends 31 Oct 2026 · renewal REQ-0038 under review/,
    ]);
    await expect(main(page)).toContainText(
      'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
    );
    await expect(panel(page).getByRole('radio', { name: /^Release update/ })).toBeChecked();
    if (width(page) < 1024) {
      await expect(page.locator('.xr-top-title')).toHaveText('Content');
    } else {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Content\s*\/\s*Updates\s*\/\s*UPD-0005/,
      );
    }
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expectDecisionLayout(page);
    await expectNoPublish(page);
    await checkState(page, 'Distillation Column · 1.2 → 1.3');
    if (width(page) === 1440) await shot(page, 'b705-f1-waiting');
    if (width(page) === 1024) await shot(page, 'b712-f1-waiting');
    if (width(page) === 768) await shot(page, 'b712-f2-waiting');
    if (width(page) === 375) await shot(page, 'b705-f11-mobile');

    // f11: “Go to decision” jumps to the panel below 860 px of content.
    const jump = main(page).locator('a.xr-jump');
    if (await jump.isVisible()) {
      await reachAndClick(page, jump);
      await expect(panel(page)).toBeFocused();
    }

    const before = await accessFacts(page);

    // f8 / B7-10 f0: DL-1 says exactly what goes live and for whom; Cancel changes nothing.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Release update' }));
    const dialog = page.getByRole('dialog', { name: 'Release UPD-0005?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body')).toHaveText(
      'Version 1.3 of Distillation Column goes live for everyone — the public catalogue and every institution that uses it. Version 1.2 is no longer shown.',
    );
    await expect(dialog.getByRole('button', { name: 'Release update' })).toBeFocused();
    await checkState(page, 'Distillation Column · 1.2 → 1.3');
    if (width(page) === 1024) await shot(page, 'b705-f8-release');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Release update' })).toBeFocused();
    await expect(chip(page)).toHaveText('Waiting for your decision');

    await reachAndClick(page, panel(page).getByRole('button', { name: 'Release update' }));
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Release update' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // f6 / B7-10 f3: released — decided, read-only; focus on the result.
    const decided = page.locator('#update-decided');
    await expect(decided).toBeFocused();
    await expect(decided.locator('.xr-status--ok')).toHaveText('Released');
    await expect(decided).toContainText('Released on 23 Oct 2026 · Arjun Mehta');
    await expect(decided).toContainText(
      'Version 1.3 is live for everyone. The history below keeps the earlier version and every decision.',
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(chip(page)).toHaveText('Released');
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Live now: version 1.3 · released 23 Oct 2026',
    );
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Released by Arjun Mehta',
    );
    await expectNoPublish(page);
    await checkState(page, 'Distillation Column · 1.2 → 1.3');
    if (width(page) === 1024) await shot(page, 'b705-f6-released');

    // Releasing changed no plan, licence or Student grant (BC9).
    expect(await accessFacts(page)).toBe(before);

    // The Updates list moved it to Released.
    await reachAndClick(page, main(page).getByRole('link', { name: 'Updates' }).first());
    await expect(tabs(page).getByRole('tab')).toHaveText(
      [/Waiting for you\s*0/, /On hold\s*1/, /Released\s*4/],
      { timeout: 60_000 },
    );
    await expectSameDocument(page, mark);

    // The public catalogue reads the released version (PU-06 does not show the description or
    // the version, OD-B7-05: the catalogue read says it).
    const live = await port<{ readonly description: string }>(
      page,
      RAHUL,
      'catalogue',
      'getExperiment',
      'distillation-column',
    );
    expect(live.description).toContain('Raising the reflux ratio raises the overhead purity');
    await softNavigate(page, '/experiments/distillation-column');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);

    // The Content Manager's published experiment (CM-05) reads version 1.3 and its description.
    await switchIdentity(page, KAVYA);
    await softNavigate(page, '/content-manager/published/distillation-column');
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'CHE ZG513 · Published · version 1.3',
      { timeout: 90_000 },
    );
    await expect(main(page)).toContainText(
      'Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
    );
    await expectSameDocument(page, mark);
  });

  test('a held correction: Hold needs a reason; 1.1 never reaches the public until Lift hold, then Release (f9, f5, f7)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    // Set up before the tab reads Updates: the CI seam's writes are the world's, not this tab's.
    await page.goto(`${LIST}/UPD-0004`);
    await expect(heading(page, 'Boiler Drum Level · 2.0 → 2.1')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    const id = await approvedShellCorrection(page);
    const before = await accessFacts(page);
    const publicSummary = (
      await port<{ readonly summary: string }>(page, RAHUL, 'catalogue', 'getExperiment', SHELL)
    ).summary;
    expect(publicSummary).not.toBe(SHELL_SUMMARY);

    // The Super Admin sees it only now it is approved, and opens it from Updates.
    await reachAndClick(page, main(page).getByRole('link', { name: 'Updates' }).first());
    await expect(tabs(page).getByRole('tab').first()).toHaveText(/Waiting for you\s*2/, {
      timeout: 60_000,
    });
    const row = main(page)
      .locator('table.xr-table tbody tr')
      .filter({ hasText: 'Shell-and-Tube Heat Exchanger · 1.0 → 1.1' });
    await expect(row).toHaveCount(1, { timeout: 60_000 });
    await reachAndClick(page, row.getByRole('link', { name: /^Review/ }));
    const title = heading(page, 'Shell-and-Tube Heat Exchanger · 1.0 → 1.1');
    await expect(title).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(new RegExp(`/admin/content/updates/${id}$`));

    // f9 / B7-10 f1: Hold with no reason — the error on the field; nothing is held.
    await reachAndClick(page, panel(page).getByRole('radio', { name: /^Hold/ }));
    await expect(panel(page).getByRole('radio', { name: /^Hold/ })).toBeChecked();
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Hold' }));
    const dialog = page.getByRole('dialog', { name: `Hold ${id}?` });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body > p').first()).toHaveText(
      'Version 1.0 stays live. The update waits until you lift the hold. The Content Manager sees your reason.',
    );
    const reason = dialog.getByRole('textbox', { name: 'Reason the Content Manager will see' });
    await expect(reason).toBeFocused();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Hold' }));
    await expect(dialog.locator('.xr-error')).toHaveText(
      'Add a reason — the Content Manager sees it',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toBeFocused();
    await checkState(page, 'Shell-and-Tube Heat Exchanger · 1.0 → 1.1');
    if (width(page) === 1024) await shot(page, 'b705-f9-hold-reason');
    await reason.fill(HOLD_REASON);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Hold' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // f5 / B7-10 f2: on hold — the reason and date first; Lift hold the only action.
    const decided = page.locator('#update-decided');
    await expect(decided).toBeFocused();
    await expect(chip(page)).toHaveText('On hold');
    await expect(decided).toContainText('On hold since 23 Oct 2026 · Arjun Mehta');
    await expect(decided).toContainText(`“${HOLD_REASON}”`);
    await expect(decided).toContainText('The live version stays as it is.');
    await expect(decided).toContainText(
      'What else a hold affects, and whether it blocks later corrections, is still open.',
    );
    await expect(panel(page).getByRole('button')).toHaveText(['Lift hold']);
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Put on hold by Arjun Mehta',
    );
    await expectNoPublish(page);
    await checkState(page, 'Shell-and-Tube Heat Exchanger · 1.0 → 1.1');
    if (width(page) === 1024) await shot(page, 'b705-f5-on-hold');

    // Release is refused while held (`hold-must-be-lifted`); the public page keeps 1.0.
    const current = await port<{ readonly update: { readonly rev: number } }>(
      page,
      ARJUN,
      'corrections',
      'getUpdateDecision',
      id,
    );
    const refused = await actAs<PortAnswer<unknown>>(page, ARJUN, {
      port: 'corrections',
      method: 'releaseUpdate',
      input: { id, expectedRev: current.update.rev },
    });
    expect(refused.ok ? null : refused.error).toMatchObject({
      kind: 'refused',
      code: 'hold-must-be-lifted',
    });
    await softNavigate(page, `/experiments/${SHELL}`);
    await expect(heading(page, 'Shell-and-Tube Heat Exchanger')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xp-xsum')).toHaveText(publicSummary);
    await expectSameDocument(page, mark);

    // Lift hold (DL-1, no reason): back to waiting, nothing went live (f7).
    await softNavigate(page, `${LIST}/${id}`);
    await expect(title).toBeVisible({ timeout: 90_000 });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Lift hold' }));
    const lift = page.getByRole('dialog', { name: `Lift the hold on ${id}?` });
    await expect(lift).toBeVisible();
    await expect(lift.locator('.xr-dialog-body')).toHaveText(
      'It goes back to waiting for your decision. Nothing goes live until you release it.',
    );
    await expect(lift.getByRole('textbox')).toHaveCount(0);
    await reachAndClick(page, lift.getByRole('button', { name: 'Lift hold' }));
    await expect(lift).toBeHidden({ timeout: 30_000 });
    await expect(title).toBeFocused();
    await expect(chip(page)).toHaveText('Waiting for your decision');
    const notice = main(page).locator('.xr-notice').filter({ hasText: 'Hold lifted' });
    await expect(notice).toHaveText(
      /Hold lifted\s*The hold was lifted on 23 Oct 2026\. It is waiting for your decision again\./,
    );
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Hold lifted by Arjun Mehta',
    );
    await checkState(page, 'Shell-and-Tube Heat Exchanger · 1.0 → 1.1');
    if (width(page) === 1024) await shot(page, 'b705-f7-lifted');
    expect(
      (await port<{ readonly summary: string }>(page, RAHUL, 'catalogue', 'getExperiment', SHELL))
        .summary,
    ).toBe(publicSummary);

    // Released: the public page shows the new summary; Rahul still opens the experiment.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Release update' }));
    const release = page.getByRole('dialog', { name: `Release ${id}?` });
    await reachAndClick(page, release.getByRole('button', { name: 'Release update' }));
    await expect(release).toBeHidden({ timeout: 30_000 });
    await expect(chip(page)).toHaveText('Released');
    expect(await accessFacts(page)).toBe(before);
    await softNavigate(page, `/experiments/${SHELL}`);
    await expect(main(page).locator('.xp-xsum')).toHaveText(SHELL_SUMMARY, { timeout: 90_000 });
    await switchIdentity(page, RAHUL);
    await softNavigate(page, `/student/experiments/${SHELL}`);
    await expect(heading(page, 'Shell-and-Tube Heat Exchanger')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);
  });

  test('on hold (UPD-0004), released (after-flow-f) and not approved yet (UPD-0006) as drawn (B7-10 f2 … f4; B7-05 f10)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-f', session: ARJUN });
    await page.goto(`${LIST}/UPD-0005`);
    await expect(heading(page, 'Distillation Column · 1.2 → 1.3')).toBeVisible({
      timeout: 90_000,
    });
    const mark = await markDocument(page);
    await expect(chip(page)).toHaveText('Released', { timeout: 60_000 });
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Live now: version 1.3 · released 24 Oct 2026',
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Distillation Column · 1.2 → 1.3');

    await softNavigate(page, `${LIST}/UPD-0004`);
    await expect(heading(page, 'Boiler Drum Level · 2.0 → 2.1')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('On hold');
    await expect(panel(page).getByRole('button')).toHaveText(['Lift hold']);
    await checkState(page, 'Boiler Drum Level · 2.0 → 2.1');

    // B7-05 f10 / B7-10 f4: still with the Content Manager — nothing to decide, never not found.
    await softNavigate(page, `${LIST}/UPD-0006`);
    await expect(heading(page, 'Release or hold an update')).toBeVisible({ timeout: 90_000 });
    const empty = main(page).locator('.xr-empty');
    await expect(empty.getByRole('heading', { level: 2 })).toHaveText('Nothing to decide');
    await expect(empty.locator('p')).toHaveText(
      'This update hasn’t been approved by the Academic Reviewer yet. It reaches you when it is.',
    );
    await expect(empty.getByRole('link', { name: 'Back to Updates' })).toHaveAttribute(
      'href',
      LIST,
    );
    await expect(panel(page)).toHaveCount(0);
    await checkState(page, 'Release or hold an update');
    if (width(page) === 1024) await shot(page, 'b705-f10-nothing-to-decide');
    await expectSameDocument(page, mark);
  });
});
