import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * CM-05 Published experiment's correction entry (boards B6-08 f0 … f4; B6-11 f9; B6-13 f1; B7-11
 * f4) and the CM-08 update page it opens — the draft of CM-06 / CM-07 and every later state
 * (B6-09 f1 … f8; B6-11 f10, f11; B6-13 f0; B7-11 f3) — on the test-hook build at 1440, 1024, 768
 * and 375, as Kavya Nair. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 *
 * Everything the screens do — Edit catalogue details opening the one draft with the summary
 * focused, the check before sending (all three errors at once), typing the correction with the
 * comparison following it, Save draft, “Back to the published experiment” and its notice, Open
 * update, Send for academic review through DL-1, Withdraw through DL-2 with its required reason —
 * is done by real clicks and typing in one tab (one world, no reload). The cross-role effect this
 * group owns: a saved draft is never public — the public experiment page (PU-06) still shows the
 * live version — and a sent update is read-only “In academic review”. The CI seam only SETS UP a
 * world (the Super Admin’s hold for B6-09 f6) or READS the record.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const KAVYA = { personId: 'per-kavya-nair' };
const SUPER_ADMIN = { personId: 'sa-arjun-mehta' };
const PUBLISHED = (id: string) => `/content-manager/published/${id}`;
const UPDATE = (id: string) => `/content-manager/updates/${id}`;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/cm-correction';

const LIVE_SUMMARY =
  'Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag.';
const NEW_SUMMARY =
  'Bring a binary column from cold start to steady state, raising the reflux ratio for a purer overhead under realistic lag.';
const NEW_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite.';

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

interface UpdateRecord {
  readonly id: string;
  readonly rev: number;
  readonly state: string;
  readonly proposed: { readonly summary: string; readonly description: string };
  readonly versionLabel: string | null;
}

async function updateRecord(page: Page, id: string): Promise<UpdateRecord> {
  return (
    await port<{ readonly update: UpdateRecord }>(page, KAVYA, 'corrections', 'getUpdate', id)
  ).update;
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');
const button = (page: Page, name: string) => main(page).getByRole('button', { name, exact: true });
const field = (page: Page, label: string) =>
  main(page).getByRole('textbox', { name: label, exact: true });

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

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

test.describe('CM-05 → CM-06 → CM-08: one correction draft, never public until released', () => {
  test('Edit catalogue details opens the draft (B6-09 f1, f4); the check (B6-11 f11); Save draft keeps PU-06 on the live version; back (B6-08 f3, f2); Send → In academic review (B6-09 f3; B6-08 f1)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('distillation-column'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);

    // B6-08 f0 / f4; B6-13 f1: the three entries, Start a correction the primary.
    const entries = main(page).locator('.xw-actions').first();
    await expect(entries.getByRole('button')).toHaveText([
      'Start a correction',
      'Edit catalogue details',
      'Edit delivery link',
    ]);
    await expect(entries.locator('.xr-btn--primary')).toHaveText('Start a correction');
    await checkState(page, 'Distillation Column');
    if (width(page) === 1440) await shot(page, 'b608-f0-entry');
    if (width(page) === 375) await shot(page, 'b608-f4-entry');

    // CM-06: Edit catalogue details → the one draft, the summary focused (B6-09 f1).
    await reachAndClick(page, button(page, 'Edit catalogue details'));
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005\?focus=summary$/);
    await expect(heading(page, 'Update to version …')).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'Summary')).toBeFocused();
    await expectSameDocument(page, mark);
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'UPD-0005 · correction to Distillation Column (live version 1.2)',
    );
    await expect(chip(page)).toHaveText('Draft');
    await expect(main(page).locator('.xg-live')).toHaveText('Live version 1.2 unchanged');
    await expect(field(page, 'Name')).toHaveValue('Distillation Column');
    await expect(field(page, 'Summary')).toHaveValue(LIVE_SUMMARY);
    await expect(field(page, 'WEB · web link')).toHaveValue(
      'https://labs.meridian.example/distillation-column',
    );
    await expect(field(page, 'VR · package reference')).toHaveValue('MVL-DC-VR-1.2');
    await expect(main(page).getByRole('region', { name: 'Current and proposed' })).toContainText(
      'Nothing changed yet.',
    );
    await expect(main(page).locator('.xr-tl-what')).toHaveText([
      'Correction started from Edit catalogue details',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    if (width(page) < 1024) {
      await expect(page.locator('.xr-top-title')).toHaveText('Updates');
    } else {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Updates\s*\/\s*UPD-0005/,
      );
    }
    await checkState(page, 'Update to version …');
    if (width(page) === 1440) await shot(page, 'b609-f1-draft');
    if (width(page) === 375) await shot(page, 'b609-f4-draft');

    // B6-11 f11: Send with nothing changed — every drawn error at once.
    await reachAndClick(page, button(page, 'Send for academic review'));
    const summary = page.locator('#cm-err');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveText([
      'Say what changes and why',
      'Enter the version label, for example 1.3',
      'Change at least one catalogue detail or delivery link',
    ]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(main(page).locator('#cm-u-chg-e')).toHaveText(
      'Change at least one catalogue detail or delivery link',
    );
    await checkState(page, 'Update to version …');
    if (width(page) === 1024) await shot(page, 'b611-f11-missing');
    await summary.getByRole('link', { name: 'Say what changes and why' }).click();
    await expect(field(page, 'What changes and why')).toBeFocused();

    // Typing the correction: the comparison follows the form (B6-09 f2's rows).
    await field(page, 'What changes and why').fill(WHY);
    await field(page, 'Summary').fill(NEW_SUMMARY);
    await field(page, 'Description').fill(NEW_DESCRIPTION);
    await field(page, 'Version label').fill('1.3');
    await expect(heading(page, 'Update to version 1.3')).toBeVisible();
    const comparison = main(page).getByRole('table', { name: 'Current and proposed' });
    await expect(comparison.getByRole('rowheader')).toHaveText([
      'Summary',
      'Description',
      'Version',
    ]);
    await expect(summary).toHaveCount(0);
    await reachAndClick(page, button(page, 'Save draft'));
    const saved = main(page).locator('#cm-u-saved');
    await expect(saved).toHaveText(/^Draft saved · .* · the live version is unchanged$/);
    await expect(saved).toBeFocused();
    const draft = await updateRecord(page, 'UPD-0005');
    expect([draft.state, draft.proposed.summary, draft.versionLabel]).toEqual([
      'draft',
      NEW_SUMMARY,
      '1.3',
    ]);

    // Cross-role: a saved draft is never public — PU-06 still reads the live version.
    await softNavigate(page, '/experiments/distillation-column');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);
    await expect(page.locator('.xp-xsum')).toHaveText(LIVE_SUMMARY);
    await expect(page.locator('main')).not.toContainText(NEW_SUMMARY);
    await page.goBack();
    await expect(heading(page, 'Update to version 1.3')).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);

    // “Back to the published experiment”: B6-08 f3 (the notice) and f2 (the entries join the draft).
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const notices = main(page).locator('.xr-notice');
    await expect(notices.first()).toHaveText(
      /Back from the correction\s*The live version is unchanged until the Super Admin releases the update\./,
    );
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'An update is in progress — UPD-0005 · Draft',
    );
    const join = main(page).locator('.xw-actions');
    await expect(join.getByRole('link', { name: 'Open update' })).toHaveClass(/xr-btn--primary/);
    await expect(join.getByRole('button')).toHaveText([
      'Edit catalogue details',
      'Edit delivery link',
    ]);
    await expect(main(page).locator('.xr-tl-what').first()).toHaveText('UPD-0005 started — draft');
    await checkState(page, 'Distillation Column');
    await shot720(page, 'b608-f3-back');

    // CM-07 joins the same draft (never a second update), the web link focused.
    await reachAndClick(page, button(page, 'Edit delivery link'));
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005\?focus=web-link$/);
    await expect(heading(page, 'Update to version 1.3')).toBeVisible({ timeout: 90_000 });
    await expect(field(page, 'WEB · web link')).toBeFocused();
    await field(page, 'WEB · web link').fill(
      'https://labs.meridian.example/distillation-column-1-3',
    );

    // Send for academic review (DL-1): saves what is on the page and sends it.
    await reachAndClick(page, button(page, 'Send for academic review'));
    const dialog = page.getByRole('dialog', { name: 'Send for academic review?' });
    await expect(dialog).toContainText(
      'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it. The live version 1.2 doesn’t change until it is released.',
    );
    await reachAndClick(page, dialog.getByRole('button', { name: 'Send for academic review' }));
    await expect(chip(page)).toHaveText('In academic review');
    await expect(heading(page, 'Update to version 1.3')).toBeFocused();
    await expect(main(page).locator('.xr-notice').first()).toContainText(
      'Read-only while it is reviewed. The live version 1.2 is unchanged.',
    );
    await expect(main(page).getByRole('textbox')).toHaveCount(0);
    await expect(
      main(page).getByRole('table', { name: 'Current and proposed' }).getByRole('rowheader'),
    ).toHaveText(['Summary', 'Description', 'WEB · web link', 'Version']);
    await expect(main(page).locator('.xr-tl-what')).toHaveText([
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    await expect(main(page).getByRole('button')).toHaveText(['Withdraw update']);
    const sent = await updateRecord(page, 'UPD-0005');
    expect(sent.state).toBe('in-academic-review');
    await checkState(page, 'Update to version 1.3');
    await shot720(page, 'b609-f3-review');

    // B6-08 f1; B6-11 f9: only “Open update”, in the notice.
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    const progress = main(page).locator('.xr-notice--warn');
    await expect(progress).toContainText(
      'An update is in progress — UPD-0005 · In academic review',
    );
    await expect(progress.getByRole('link', { name: 'Open update' })).toHaveClass(/xr-btn--sm/);
    await expect(main(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Distillation Column');
    await shot720(page, 'b608-f1-review');
    if (width(page) === 1024) await shot(page, 'b611-f9-review');
    // The public page still reads 1.2's summary.
    await softNavigate(page, '/experiments/distillation-column');
    await expect(page.locator('.xp-xsum')).toHaveText(LIVE_SUMMARY, { timeout: 90_000 });
    await expectSameDocument(page, mark);
  });

  test('returned (UPD-0006; B6-09 f2): the reason first, editable; Withdraw (DL-2) needs a reason → Withdrawn (f8)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(UPDATE('UPD-0006'));
    await expect(heading(page, 'Update to version 1.1')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Returned');
    const reason = main(page).getByRole('region', { name: 'Returned by the Academic Reviewer' });
    await expect(reason).toContainText('26 Aug 2026, 10:00 · Prof. A. Menon');
    await expect(reason.locator('blockquote')).toHaveText(
      'The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.',
    );
    await expect(field(page, 'What changes and why')).toHaveValue('Correction UPD-0006.');
    await checkState(page, 'Update to version 1.1');
    await shot720(page, 'b609-f2-returned');

    await reachAndClick(page, button(page, 'Withdraw update'));
    const dialog = page.getByRole('dialog', { name: 'Withdraw this update?' });
    await expect(dialog).toContainText('Nothing changes in the live version.');
    await expect(dialog.getByLabel('Reason')).toBeFocused();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw update' }));
    await expect(dialog).toContainText('Add a reason for withdrawing this update');
    await dialog
      .getByLabel('Reason')
      .fill('Raised by mistake — the Vendor is sending a corrected build first.');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw update' }));
    await expect(chip(page)).toHaveText('Withdrawn');
    await expect(main(page).locator('.xr-notice--quiet')).toContainText(
      '“Raised by mistake — the Vendor is sending a corrected build first.” The live version is unchanged. You can start a new correction from the published experiment.',
    );
    await expect(main(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Update to version 1.1');
    await shot720(page, 'b609-f8-withdrawn');

    // The experiment offers a new correction again; no “Back from the correction” after a withdrawal.
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Induction Motor Loading')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-notice')).toHaveCount(0);
    await expect(main(page).locator('.xw-actions').getByRole('button')).toHaveText([
      'Start a correction',
      'Edit catalogue details',
      'Edit delivery link',
    ]);
  });

  test('after Flow E: awaiting release decision (B6-09 f5; B6-11 f10; B7-11 f3, f4); then on hold (f6)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: KAVYA });
    await page.goto(UPDATE('UPD-0005'));
    await expect(heading(page, 'Update to version 1.3')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Awaiting release decision');
    await expect(main(page).locator('.xr-notice').first()).toContainText(
      'Approved by Prof. A. Menon on',
    );
    await expect(
      main(page).getByRole('table', { name: 'Current and proposed' }).getByRole('rowheader'),
    ).toHaveText(['Description', 'WEB · web link', 'Version']);
    await expect(main(page).locator('.xr-tl-what')).toHaveText([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    await expect(main(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Update to version 1.3');
    await shot720(page, 'b609-f5-awaiting');
    if (width(page) === 1024) await shot(page, 'b611-f10-awaiting');
    if (width(page) === 1440) await shot(page, 'b711-f3-awaiting');

    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Back to the published experiment' }),
    );
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'The Academic Reviewer approved it. The Super Admin decides when to release it.',
    );
    await checkState(page, 'Distillation Column');
    if (width(page) === 1440) await shot(page, 'b711-f4-published');

    // World set-up through the CI seam: the Super Admin holds UPD-0005 (B7-11 branch B).
    const before = await updateRecord(page, 'UPD-0005');
    await port(page, SUPER_ADMIN, 'corrections', 'holdUpdate', {
      id: 'UPD-0005',
      reason: 'Version 1.2 stays live while the 1.3 build is checked.',
      expectedRev: before.rev,
    });
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open update' }));
    await expect(heading(page, 'Update to version 1.3')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('On hold');
    await expect(main(page).locator('.xr-notice--warn')).toHaveText(
      /On hold\s*The Super Admin put this update on hold\. The live version stays as it is\./,
    );
    await expect(main(page).locator('.xr-tl-what').first()).toHaveText(
      'Put on hold by Arjun Mehta',
    );
    await expect(main(page).locator('.xr-tl-note').first()).toHaveText(
      '“Version 1.2 stays live while the 1.3 build is checked.” Version 1.2 stays live.',
    );
    await checkState(page, 'Update to version 1.3');
    await shot720(page, 'b609-f6-hold');
  });

  test('after Flow F: released (B6-09 f7); an update address with no update (B6-13 f0)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-f', session: KAVYA });
    await page.goto(UPDATE('UPD-0005'));
    await expect(heading(page, 'Update to version 1.3')).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Released');
    await expect(main(page).locator('.xr-notice--ok')).toHaveText(
      /Released\s*This version is live for everyone\./,
    );
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'UPD-0005 · correction to Distillation Column (live version 1.2)',
    );
    await expect(
      main(page).getByRole('table', { name: 'Current and proposed' }).getByRole('rowheader'),
    ).toHaveText(['Description', 'WEB · web link', 'Version']);
    await expect(main(page).locator('.xr-tl-what').first()).toHaveText('Released by Arjun Mehta');
    await checkState(page, 'Update to version 1.3');
    await shot720(page, 'b609-f7-released');

    await softNavigate(page, UPDATE('UPD-0099'));
    await expect(heading(page, 'No update open')).toBeVisible({ timeout: 90_000 });
    await expect(main(page)).toContainText('Start a correction from a published experiment.');
    await expect(
      main(page).getByRole('link', { name: 'Open the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library');
    await checkState(page, 'No update open');
    if (width(page) === 1440) await shot(page, 'b613-f0-none');
  });
});
