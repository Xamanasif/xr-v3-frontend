import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * SA-10 Content updates and SA-11 Release or hold an update in the V3 Refined B design (the
 * owner-approved Super Admin export, design/v3-refined-b/roles/SA-v1 `V.updates`, `V.update`) on
 * the test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll); no reference (UPD-) is shown or names a control.
 *
 * Flow F, steps 3–5, in one tab (one world, client-side navigation only): on after-flow-e the
 * Super Admin opens the Distillation Column correction (UPD-0005) from Updates, releases it through
 * its confirmation, and the Content Manager's
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/sa-content/spec-shots/release';

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
const chip = (page: Page) => main(page).locator('.rk-head .rk-meta .xr-st');
const segments = (page: Page) => page.getByRole('group', { name: 'Show corrections' });
const rows = (page: Page) => main(page).locator('table.rk-table tbody tr');
const history = (page: Page) => main(page).locator('ol.rk-tl .rk-tl-w');
const crumbs = (page: Page) => page.getByRole('navigation', { name: 'Breadcrumb' });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/**
 * The detail layout: the record on the left and the decision panel beside it; below 860 px of
 * page width the panel under the record, with “Go to decision” in the head.
 */
async function expectDecisionLayout(page: Page): Promise<void> {
  const sheet = await main(page).locator('.rk-mainsheet').boundingBox();
  const aside = await panel(page).boundingBox();
  if (!sheet || !aside) throw new Error('not laid out');
  const goTo = main(page).locator('a.rk-goto');
  if (await goTo.isVisible()) {
    expect(aside.y).toBeGreaterThan(sheet.y + sheet.height - 1);
  } else {
    expect(aside.x).toBeGreaterThan(sheet.x + sheet.width - 1);
  }
}

/** Waits for the element's CSS animations and transitions (a dialog fading in) to finish. */
async function settle(locator: Locator): Promise<void> {
  await locator.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => null)),
    ),
  );
}

/** A segment press: the pressed colours fade in over 120 ms (rb.css), read once they have. */
async function pressSegment(page: Page, name: RegExp): Promise<void> {
  const button = segments(page).getByRole('button', { name });
  // On a phone the segments scroll sideways (a swipe brings a hidden one into view).
  await button.scrollIntoViewIfNeeded();
  await reachAndClick(page, button);
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await settle(segments(page));
}

async function expectNoPublish(page: Page): Promise<void> {
  expect(await main(page).innerText()).not.toMatch(/\bPublish/);
}

/** No reference in the page's words or the names of its controls (HANDOFF “Internal references”). */
async function expectNoReferences(page: Page): Promise<void> {
  const reference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
  expect(await main(page).innerText()).not.toMatch(reference);
  const names = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(reference);
  expect(await page.title()).not.toMatch(reference);
}

test.describe('SA-10 Content updates', () => {
  test('Waiting for your decision, On hold and Released by real clicks; each row opens its decision', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    await page.goto(LIST);
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 90_000 });
    await expect(segments(page)).toBeVisible({ timeout: 60_000 });
    const mark = await markDocument(page);
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Corrections to published experiments reach you after the Academic Reviewer approves them. Nothing goes live until you release it.',
    );
    const tabs = page.getByRole('navigation', { name: 'Content' });
    await expect(tabs.getByRole('link')).toHaveText(['Updates', 'All content']);
    await expect(tabs.getByRole('link', { name: 'Updates' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(segments(page).getByRole('button')).toHaveText([
      /Waiting for your decision\s*1/,
      /On hold\s*1/,
      /Released\s*3/,
    ]);
    await expect(rows(page)).toHaveCount(1);
    const first = rows(page).first();
    await expect(first.locator('a.rk-rowlink')).toHaveText('Distillation Column');
    await expect(first.locator('.rk-code')).toHaveText('CHE ZG513');
    await expect(first).toContainText('Version 1.2 → 1.3');
    await expect(first).toContainText('Version 1.2 stays live until released');
    await expect(first).toContainText('Prof. A. Menon');
    await expect(first).toContainText('22 Oct 2026');
    await expect(first.locator('.xr-st--warn')).toHaveText('Waiting for your decision');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expectNoPublish(page);
    await expectNoReferences(page);
    await checkState(page, 'Content');
    await shot(page, 'sa10-waiting');

    // On hold (the address follows the segment).
    await pressSegment(page, /^On hold/);
    await expect(page).toHaveURL(/\/admin\/content\/updates\?show=on-hold$/);
    await expect(segments(page).getByRole('button', { name: /^On hold/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first().locator('a.rk-rowlink')).toHaveText('Boiler Drum Level');
    await expect(rows(page).first()).toContainText('Version 2.0 → 2.1');
    await expect(rows(page).first().locator('.xr-st--paused')).toHaveText('On hold');
    await checkState(page, 'Content');
    if (width(page) === 375) await shot(page, 'sa10-on-hold');

    // Released, newest first.
    await pressSegment(page, /^Released/);
    await expect(page).toHaveURL(/\/admin\/content\/updates\?show=released$/);
    await expect(rows(page)).toHaveCount(3);
    await expect(rows(page).locator('a.rk-rowlink')).toHaveText([
      'Orifice Plate Metering',
      'Distillation Column',
      'Distillation Column',
    ]);
    await expect(rows(page).first()).toContainText('Released 5 Aug 2026');
    await checkState(page, 'Content');

    // Back to Waiting for your decision; the row's link opens SA-11 in the same document.
    await pressSegment(page, /^Waiting for your decision/);
    await expect(page).toHaveURL(/\/admin\/content\/updates$/);
    await reachAndClick(
      page,
      rows(page).first().getByRole('link', {
        name: 'Distillation Column correction, version 1.2 to 1.3, Waiting for your decision. Open',
      }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/admin\/content\/updates\/UPD-0005$/);
    await expectSameDocument(page, mark);
  });

  test('nothing waiting: the calm empty state', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ARJUN });
    await page.goto(LIST);
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 90_000 });
    const empty = main(page).locator('.rk-state');
    await expect(empty.locator('.rk-state-t')).toHaveText(
      'Nothing is waiting for your release decision',
      { timeout: 60_000 },
    );
    await expect(empty.locator('.rk-state-d')).toHaveText(
      'Corrections reach you after the Academic Reviewer approves them.',
    );
    await expect(segments(page).getByRole('button')).toHaveText([
      /Waiting for your decision\s*0/,
      /On hold\s*1/,
      /Released\s*3/,
    ]);
    await checkState(page, 'Content');
    if (width(page) === 1440) await shot(page, 'sa10-nothing-waiting');
    // An unknown segment in the address is replaced by the list's own address.
    await page.goto(`${LIST}?show=everything`);
    await expect(page).toHaveURL(/\/admin\/content\/updates$/, { timeout: 60_000 });
  });
});

test.describe('SA-11 Release or hold an update', () => {
  test('Flow F: UPD-0005 released through its confirmation; the Content Manager reads 1.3; no access changed', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    await page.goto(`${LIST}/UPD-0005`);
    const title = heading(page, 'Distillation Column');
    await expect(title).toBeVisible({ timeout: 90_000 });
    await expect(panel(page)).toBeVisible();
    const mark = await markDocument(page);

    // Waiting for your decision.
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText(
      'Correction to a published experiment',
    );
    await expect(chip(page)).toHaveText('Waiting for your decision');
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Version 1.2 → 1.3');
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText(
      'Approved by Prof. A. Menon on 22 Oct 2026',
    );
    await expect(crumbs(page).getByRole('link')).toHaveText(['Content', 'Updates']);
    await expect(main(page).locator('dl.rk-factstrip .rk-fact')).toHaveText([
      /Live now\s*Version 1\.2/,
      /Proposed\s*Version 1\.3/,
      /Course\s*CHE ZG513/,
      /Formats\s*WEB, VR/,
    ]);
    const comparison = main(page).getByRole('table', { name: 'Changed fields, live and proposed' });
    await expect(comparison.getByRole('rowheader')).toHaveText([
      'Description',
      'WEB · web link',
      'Version',
    ]);
    await expect(
      main(page).getByRole('region', { name: 'Institutions using it' }).locator('tbody tr'),
    ).toHaveText([/BITS Pilani — Hyderabad Campus\s*In its access plan · WEB, VR\s*Ending soon/]);
    await expect(main(page)).toContainText(
      'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
    );
    await expect(panel(page).getByRole('radio', { name: 'Release update' })).not.toBeChecked();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await expectDecisionLayout(page);
    await expectNoPublish(page);
    await expectNoReferences(page);
    await checkState(page, 'Distillation Column');
    await shot(page, 'sa11-waiting');

    // “Go to decision” leads to the panel below 860 px of page width.
    const goTo = main(page).locator('a.rk-goto');
    if (await goTo.isVisible()) {
      await reachAndClick(page, goTo);
      await expect(panel(page)).toBeInViewport();
      await expect(
        panel(page).getByRole('heading', { level: 2, name: 'Your decision' }),
      ).toBeFocused();
    }

    const before = await accessFacts(page);

    // A decision is required before anything opens.
    const go = panel(page).getByRole('button', { name: 'Release update' });
    await reachAndClick(page, go);
    const summary = panel(page).locator('.rk-errsum');
    await expect(summary).toHaveText(/Check your decision\s*Choose a decision/);
    await expect(summary).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // The confirmation says exactly what goes live and for whom; Cancel changes nothing.
    await reachAndClick(page, panel(page).getByRole('radio', { name: 'Release update' }));
    await reachAndClick(page, go);
    const dialog = page.getByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-now')).toContainText(
      'Version 1.3 goes live for everyone: the public catalogue and every institution using it.',
    );
    await expect(dialog.locator('.rk-dlg-later')).toContainText(
      'No institution’s or student’s access changes.',
    );
    await expect(dialog.getByRole('button', { name: 'Release update' })).toBeFocused();
    await settle(dialog);
    await checkState(page, 'Distillation Column');
    if (width(page) === 1024) await shot(page, 'sa11-release-confirm');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(go).toBeFocused();
    await expect(chip(page)).toHaveText('Waiting for your decision');

    await reachAndClick(page, go);
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Release update' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // Released — the flash takes focus; the panel is read-only.
    const flash = main(page).locator('.rk-notice--ok').filter({ hasText: 'Version 1.3 is live.' });
    await expect(flash).toBeFocused();
    await expect(flash).toContainText(
      'Everyone now sees the corrected experiment. No access changed.',
    );
    const decided = page.locator('#update-decided');
    await expect(decided.locator('.xr-st--ok')).toHaveText('Released');
    await expect(decided).toContainText('Released on 23 Oct 2026 by Arjun Mehta');
    await expect(decided.locator('dl.rk-stand')).toHaveText(
      /Live now\s*Version 1\.3\s*Live before\s*Version 1\.2\s*Institutional access\s*Unchanged/,
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(chip(page)).toHaveText('Released');
    await expect(history(page).first()).toHaveText('Released by Arjun Mehta');
    await expectNoPublish(page);
    await expectNoReferences(page);
    await checkState(page, 'Distillation Column');
    if (width(page) === 1440) await shot(page, 'sa11-released');

    // Releasing changed no plan, licence or Student grant (BC9).
    expect(await accessFacts(page)).toBe(before);

    // The Updates list moved it to Released.
    await reachAndClick(page, crumbs(page).getByRole('link', { name: 'Updates' }));
    await expect(segments(page).getByRole('button')).toHaveText(
      [/Waiting for your decision\s*0/, /On hold\s*1/, /Released\s*4/],
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
    // CM-05 (V3, CM-v1): the identity band's eyebrow names the course and the page; its status
    // names the live version.
    const band = main(page).locator('section.rb-id.cm-idband');
    await expect(band.locator('.rk-eyebrow')).toHaveText('CHE ZG513 · Published experiment', {
      timeout: 90_000,
    });
    await expect(band.locator('.rb-id-status .cm-ver-live')).toHaveText('1.3 live');
    await expect(main(page)).toContainText(
      'Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
    );
    await expectSameDocument(page, mark);
  });

  test('a held correction: Hold needs a reason; 1.1 never reaches the public until Lift hold, then Release', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: ARJUN });
    // Set up before the tab reads Updates: the CI seam's writes are the world's, not this tab's.
    await page.goto(`${LIST}/UPD-0004`);
    await expect(heading(page, 'Boiler Drum Level')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    const id = await approvedShellCorrection(page);
    const before = await accessFacts(page);
    const publicSummary = (
      await port<{ readonly summary: string }>(page, RAHUL, 'catalogue', 'getExperiment', SHELL)
    ).summary;
    expect(publicSummary).not.toBe(SHELL_SUMMARY);

    // The Super Admin sees it only now it is approved, and opens it from Updates.
    await reachAndClick(page, crumbs(page).getByRole('link', { name: 'Updates' }));
    await expect(segments(page).getByRole('button').first()).toHaveText(
      /Waiting for your decision\s*2/,
      { timeout: 60_000 },
    );
    const row = rows(page).filter({ hasText: 'Shell-and-Tube Heat Exchanger' });
    await expect(row).toHaveCount(1, { timeout: 60_000 });
    await expect(row).toContainText('Version 1.0 → 1.1');
    await reachAndClick(
      page,
      row.getByRole('link', {
        name: 'Shell-and-Tube Heat Exchanger correction, version 1.0 to 1.1, Waiting for your decision. Open',
      }),
    );
    const title = heading(page, 'Shell-and-Tube Heat Exchanger');
    await expect(title).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(new RegExp(`/admin/content/updates/${id}$`));

    // Hold with no reason — the error on the field and in the summary; nothing opens or is held.
    await reachAndClick(page, panel(page).getByRole('radio', { name: 'Hold' }));
    await expect(panel(page).getByRole('radio', { name: 'Hold' })).toBeChecked();
    const reason = panel(page).getByRole('textbox', { name: 'Reason for the hold (required)' });
    await expect(panel(page).locator('.rk-pending')).toHaveText('Add the reason before holding.');
    const go = panel(page).getByRole('button', { name: 'Hold update' });
    await reachAndClick(page, go);
    const summary = panel(page).locator('.rk-errsum');
    await expect(summary).toHaveText(
      /Check your decision\s*Add a reason — the Content Manager sees it/,
    );
    await expect(summary).toBeFocused();
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    if (width(page) === 1024) await shot(page, 'sa11-hold-reason');
    await reason.fill(HOLD_REASON);
    await reachAndClick(page, go);
    const dialog = page.getByRole('dialog', {
      name: 'Hold the Shell-and-Tube Heat Exchanger correction?',
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('blockquote.rk-quote')).toContainText(HOLD_REASON);
    await reachAndClick(page, dialog.getByRole('button', { name: 'Hold update' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // On hold — the reason and date; Release isn't available; Lift hold the only action.
    const flash = main(page)
      .locator('.rk-notice--ok')
      .filter({ hasText: 'The correction is on hold.' });
    await expect(flash).toBeFocused();
    const decided = page.locator('#update-decided');
    await expect(chip(page)).toHaveText('On hold');
    await expect(decided).toContainText('Put on hold on 23 Oct 2026 by Arjun Mehta');
    await expect(decided.locator('blockquote.rk-quote')).toHaveText(HOLD_REASON);
    await expect(decided.locator('.rk-notice--paused')).toContainText(
      'Release isn’t available while the update is on hold',
    );
    await expect(decided).toContainText(
      'What else a hold affects, and whether it blocks later corrections, is still open.',
    );
    await expect(panel(page).getByRole('button')).toHaveText(['Lift hold']);
    await expect(history(page).first()).toHaveText('Put on hold by Arjun Mehta');
    await expectNoPublish(page);
    await expectNoReferences(page);
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    if (width(page) === 1440) await shot(page, 'sa11-on-hold');

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

    // Lift hold (confirmed, no reason): back to waiting, nothing went live.
    await softNavigate(page, `${LIST}/${id}`);
    await expect(title).toBeVisible({ timeout: 90_000 });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Lift hold' }));
    const lift = page.getByRole('dialog', {
      name: 'Lift the hold on the Shell-and-Tube Heat Exchanger correction?',
    });
    await expect(lift).toBeVisible();
    await expect(lift.getByRole('textbox')).toHaveCount(0);
    await reachAndClick(page, lift.getByRole('button', { name: 'Lift hold' }));
    await expect(lift).toBeHidden({ timeout: 30_000 });
    const lifted = main(page).locator('.rk-notice--ok').filter({ hasText: 'Hold lifted.' });
    await expect(lifted).toBeFocused();
    await expect(lifted).toContainText(
      'The correction is waiting for your decision again. Nothing went live.',
    );
    await expect(chip(page)).toHaveText('Waiting for your decision');
    await expect(history(page).first()).toHaveText('Hold lifted by Arjun Mehta');
    await checkState(page, 'Shell-and-Tube Heat Exchanger');
    expect(
      (await port<{ readonly summary: string }>(page, RAHUL, 'catalogue', 'getExperiment', SHELL))
        .summary,
    ).toBe(publicSummary);

    // Released: the public page shows the new summary; Rahul still opens the experiment.
    await reachAndClick(page, panel(page).getByRole('radio', { name: 'Release update' }));
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Release update' }));
    const release = page.getByRole('dialog', {
      name: 'Release version 1.1 of Shell-and-Tube Heat Exchanger?',
    });
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

  test('on hold (UPD-0004), released (after-flow-f) and not approved yet (UPD-0006) as drawn', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-f', session: ARJUN });
    await page.goto(`${LIST}/UPD-0005`);
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    await expect(chip(page)).toHaveText('Released', { timeout: 60_000 });
    await expect(page.locator('#update-decided')).toContainText(
      'Released on 24 Oct 2026 by Arjun Mehta',
    );
    await expect(
      main(page)
        .getByRole('table', { name: 'Changed fields, live and proposed' })
        .getByRole('columnheader'),
    ).toHaveText(['Field', 'Live before', 'Released · 1.3']);
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, 'Distillation Column');
    if (width(page) !== 1440) await shot(page, 'sa11-released');

    await softNavigate(page, `${LIST}/UPD-0004`);
    await expect(heading(page, 'Boiler Drum Level')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('On hold');
    await expect(panel(page).getByRole('button')).toHaveText(['Lift hold']);
    await checkState(page, 'Boiler Drum Level');
    if (width(page) !== 1440) await shot(page, 'sa11-on-hold');

    // Still with the Content Manager — nothing to decide, never “not available”.
    await softNavigate(page, `${LIST}/UPD-0006`);
    await expect(heading(page, 'Nothing to decide')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.sa-msg .rk-sub')).toHaveText(
      'This correction hasn’t been approved by the Academic Reviewer yet. It reaches you when it is. The live version is unchanged.',
    );
    await expect(main(page).getByRole('link', { name: 'Back to Updates' })).toHaveAttribute(
      'href',
      LIST,
    );
    await expect(panel(page)).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, 'Nothing to decide');
    await shot(page, 'sa11-not-approved');
    await expectSameDocument(page, mark);
  });
});
