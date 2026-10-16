import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, inspectWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * CM-03 Publication decision (boards B6-07 f0 … f5, B6-11 f4 … f8, B6-12 f3, f5, f6) and CM-05
 * Published experiment (B6-08 f0 … f2, f4; B6-11 f9) on the test-hook build at 1440, 1024, 768 and
 * 375, as Kavya Nair on the spine-start world. Each drawn state passes `checkState` (axe WCAG A/AA,
 * one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll).
 *
 * Everything the screens do — choosing Publish or Send back, the DL-1 publish, the DL-2 send back
 * with its validation, references and reason, following the result to the public experiment page,
 * the course page and the catalogue — is done by real clicks and typing in one tab (one world,
 * no reload). The CI seam only READS (that publishing changed no access plan, licence or Student
 * grant; where a sent-back record now is) or SETS UP a world (UPD-0005 for CM-05’s update states).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const KAVYA = { personId: 'per-kavya-nair' };
const SUPER_ADMIN = { personId: 'sa-arjun-mehta' };
const RITU = { personId: 'per-ritu-sharma' };
const MENON = { personId: 'per-a-menon' };
const DECISION = (id: string) => `/content-manager/decisions/${id}`;
const PUBLISHED = (id: string) => `/content-manager/published/${id}`;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/cm-decision';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam, which must succeed. */
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

/** The spine-start world’s Institute Admins: Malnad, Deccan (paused) and Konark. */
const INSTITUTE_ADMINS = [
  { personId: 'per-v-hegde' },
  { personId: 'per-s-kulkarni' },
  { personId: 'per-r-bhatt' },
] as const;

/**
 * Every access fact a publication could touch, read through the CI seam (reads only): each
 * institution with its plans, licences and people as the Super Admin reads it, and each
 * institution’s content access and Student grants as its Institute Admin reads them (whatever
 * each answers — a paused institution’s refusal included).
 */
async function accessFacts(page: Page): Promise<string> {
  const rows = await port<readonly { readonly id: string }[]>(
    page,
    SUPER_ADMIN,
    'institutions',
    'listInstitutions',
    { tab: 'all' },
  );
  const details = [];
  for (const row of rows) {
    details.push(await port(page, SUPER_ADMIN, 'institutions', 'getInstitution', row.id));
  }
  const admins = [];
  for (const admin of INSTITUTE_ADMINS) {
    admins.push(
      await actAs(page, admin, { port: 'institutions', method: 'listContentAccess' }),
      await actAs(page, admin, {
        port: 'studentAccess',
        method: 'listGrants',
        input: { showWithdrawn: true },
      }),
    );
  }
  return JSON.stringify({ rows, details, admins });
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const chip = (page: Page) => main(page).locator('.xr-phead-meta .xr-status');

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

/** ~72 / 28 from 860 px of content; below, the panel under the content (B6-07 f1 vs f2, f5). */
async function expectDecisionLayout(page: Page): Promise<void> {
  const stack = await main(page).locator('.xr-decide > .xr-stack').boundingBox();
  const aside = await panel(page).boundingBox();
  if (!stack || !aside) throw new Error('not laid out');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (contentWidth >= 860) {
    expect(aside.x).toBeGreaterThan(stack.x + stack.width - 1);
    expect(aside.width / (stack.width + aside.width)).toBeLessThan(0.34);
    await expect(main(page).locator('a.xr-jump')).toBeHidden();
  } else {
    expect(aside.y).toBeGreaterThan(stack.y + stack.height - 1);
    await expect(main(page).locator('a.xr-jump')).toBeVisible();
  }
}

async function openDecision(page: Page, id: string, name: string): Promise<void> {
  await page.goto(DECISION(id));
  await expect(heading(page, name)).toBeVisible({ timeout: 90_000 });
  await expect(panel(page)).toBeVisible();
}

/** The check rows’ words, in order (`li.xv-check-row`). */
function checkRows(page: Page): Locator {
  return main(page).getByRole('list', { name: 'Publication check' }).locator('li');
}

test.describe('CM-03 Publication decision', () => {
  test('SUB-0074: Publish through DL-1 → Published; the public pages list it; no access changed', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0074', 'Transient Cooling');
    const mark = await markDocument(page);
    const world = await inspectWorld(page);

    // f0 / f1 / f5: ready, nothing missing.
    await expect(main(page).locator('.xr-overline')).toHaveText('SUB-0074 · First publication');
    await expect(chip(page)).toHaveText('Ready to publish');
    await expect(chip(page)).toHaveClass(/xr-status--info/);
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Northline Simulation Studio · ME ZG523 · approved by Prof. A. Menon on 14 Aug 2026',
    );
    const preview = main(page).locator('.xg-preview');
    await expect(preview.locator('.xg-preview-tag')).toHaveText('Preview — not public yet');
    await expect(preview.locator('.xp-erow-course')).toHaveText(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    await expect(preview.locator('.xp-outcomes li')).toHaveText([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    await expect(checkRows(page)).toHaveText([
      'Approved by the Academic ReviewerProf. A. Menon · 14 Aug 2026',
      'Learning outcomes2 outcomes · one set for every format',
      'Catalogue detailsName, course, summary, description, version',
      'Delivery details for each formatWEB — complete',
    ]);
    await expect(main(page).locator('dl.xv-kv')).toContainText(
      'Northline Simulation Studio · Anil Shetty',
    );
    await expect(main(page).locator('table.xr-table tbody tr')).toHaveText([
      /WEB\s*Web link\s*Passed review/,
    ]);
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what')).toHaveText([
      'Approved by Prof. A. Menon',
      'Submitted for academic review',
    ]);
    await expect(panel(page).getByRole('radio', { name: /^Publish/ })).toBeChecked();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/ready');
    if (width(page) < 1024) {
      await expect(page.locator('.xr-top-title')).toHaveText('Ready to publish');
    } else {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Ready to publish\s*\/\s*SUB-0074/,
      );
    }
    await expectDecisionLayout(page);
    await checkState(page, 'Transient Cooling');
    if (width(page) === 1440) await shot(page, 'b607-f0-ready');
    if (width(page) === 1024) await shot(page, 'b607-f1-ready');
    if (width(page) === 375) await shot(page, 'b607-f5-ready');

    const before = await accessFacts(page);

    // DL-1 (B6-11 f6): what publishing does — and does not do. Cancel changes nothing.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Publish' }));
    const dialog = page.getByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.xr-dialog-body')).toHaveText(
      'It will appear in the public catalogue under ME ZG523 with WEB. Publishing gives no one access — institutions still need access before their students can open it.',
    );
    await expect(dialog.getByRole('button', { name: 'Publish' })).toBeFocused();
    if (width(page) === 1024) await shot(page, 'b611-f6-publish');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Cancel' }));
    await expect(dialog).toBeHidden();
    await expect(panel(page).getByRole('button', { name: 'Publish' })).toBeFocused();
    await expect(chip(page)).toHaveText('Ready to publish');

    await reachAndClick(page, panel(page).getByRole('button', { name: 'Publish' }));
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Publish' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    // f4 / B6-11 f8: the result; focus on it; “Publishing gave no one access”.
    const decided = page.locator('#cm-cdec');
    await expect(decided).toBeFocused();
    await expect(decided.locator('.xr-status--ok')).toHaveText('Published');
    await expect(decided).toContainText('· Kavya Nair');
    await expect(decided).toContainText(
      'In the public catalogue under ME ZG523 with WEB. Publishing gave no one access.',
    );
    await expect(chip(page)).toHaveText('Published');
    await expect(main(page).locator('table.xr-table tbody tr')).toHaveText([
      /WEB\s*Web link\s*Published/,
    ]);
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Published by Kavya Nair',
    );
    await expect(main(page).locator('ol.xr-timeline .xr-tl-note').first()).toHaveText(
      'In the public catalogue under ME ZG523 with WEB. No one was given access.',
    );
    await expect(decided.getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    await checkState(page, 'Transient Cooling');
    if (width(page) === 1024) await shot(page, 'b611-f8-published');
    await shot720(page, 'b607-f4-published');

    // Publishing gave no one access: every plan, licence and Student grant reads as before.
    expect(await accessFacts(page)).toBe(before);
    const after = await inspectWorld(page);
    expect([after.instance, after.attached]).toEqual([world.instance, 1]);

    // The public experiment page (PU-06), in the same tab.
    await reachAndClick(page, decided.getByRole('link', { name: 'View in the catalogue' }));
    await expect(heading(page, 'Transient Cooling')).toBeVisible({ timeout: 90_000 });
    await expect(page).toHaveURL(/\/experiments\/transient-cooling$/);
    await expectSameDocument(page, mark);
    // Its course page (PU-05, B6-12 f5) lists it.
    await reachAndClick(page, main(page).getByRole('link', { name: 'View the course' }));
    await expect(page).toHaveURL(/\/courses\/thermodynamics-heat-transfer$/);
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    // The public catalogue (PU-04, from the public footer at every width) lists it.
    await reachAndClick(
      page,
      page.locator('footer').getByRole('link', { name: 'Browse experiments' }),
    );
    await expect(page).toHaveURL(/\/experiments$/);
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('before publication the public page does not exist and the course does not list it (B6-12 f5, f6)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await page.goto('/experiments/transient-cooling');
    await expect(heading(page, 'We can’t find that experiment')).toBeVisible({ timeout: 90_000 });
    await page.goto('/courses/thermodynamics-heat-transfer');
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Fin-Tube Bundle' }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Transient Cooling' }),
    ).toHaveCount(0);
  });

  test('SUB-0070: Send back to the vendor — who and why first, then a reason and a reference', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0070', 'Packed Bed Pressure Drop');
    await reachAndClick(page, panel(page).getByRole('radio', { name: /^Send back/ }));
    await expect(panel(page).getByRole('button', { name: 'Send back' })).toBeVisible();
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Send back' }));
    const dialog = page.getByRole('dialog', { name: 'Send it back?' });
    await expect(dialog).toBeVisible();
    const reviewer = dialog.getByRole('radio', { name: /^Academic Reviewer/ });
    await expect(reviewer).toBeFocused();

    // B6-11 f7: both errors at once; focus on who.
    await reachAndClick(page, dialog.getByRole('button', { name: 'Send back' }));
    await expect(dialog.locator('.xr-error')).toHaveText([
      'Choose who it goes back to',
      'Add a reason so they know what to change',
    ]);
    await expect(dialog.getByRole('textbox', { name: 'Reason they will see' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(reviewer).toBeFocused();
    await checkState(page, 'Packed Bed Pressure Drop');
    if (width(page) === 1024) await shot(page, 'b611-f7-send-back');

    // To the vendor: the reason label names them; references show (OD-B6-05).
    await reachAndClick(page, dialog.getByRole('radio', { name: /^Vendor/ }));
    await expect(dialog.getByRole('radio', { name: /^Vendor/ })).toBeChecked();
    await expect(dialog.locator('.xr-error')).toHaveText([
      'Add a reason so they know what to change',
    ]);
    const reason = dialog.getByRole('textbox', { name: 'Reason the vendor will see' });
    await expect(dialog.getByRole('group', { name: /What it refers to/ })).toBeVisible();
    await expect(dialog.locator('.xg-refgrid .xr-check')).toHaveText([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Formats & delivery · AR · Package',
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
      'Preview & documents · Preview link',
    ]);
    await reason.fill('');
    await reason.pressSequentially('Name the supported phones and tablets for the AR build.');
    await expect(dialog.locator('.xr-error')).toHaveCount(0);
    await reachAndClick(
      page,
      dialog.getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    );
    await expect(
      dialog.getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    ).toBeChecked();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Send back' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const decided = page.locator('#cm-cdec');
    await expect(decided).toBeFocused();
    await expect(decided.locator('.xr-status--wait')).toHaveText('Sent back to the vendor');
    await expect(decided).toContainText(
      '· Kavya Nair · “Name the supported phones and tablets for the AR build.”',
    );
    await expect(decided).toContainText(
      'Nothing is published. It comes back to Ready to publish only after it is approved again.',
    );
    await expect(decided.getByRole('link', { name: 'Back to Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    await expect(chip(page)).toHaveText('With the vendor');
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Sent back to the vendor by Kavya Nair',
    );
    await checkState(page, 'Packed Bed Pressure Drop');

    // Where it is now, read as the vendor (CI seam, read only).
    const record = await port<{
      readonly submission: { readonly status: { readonly state: string; readonly by?: string } };
      readonly lastReturn: {
        readonly reason: string;
        readonly references: readonly unknown[];
      } | null;
    }>(page, RITU, 'production', 'getRecord', 'SUB-0070');
    expect(record.submission.status).toMatchObject({ state: 'returned', by: 'content-manager' });
    expect(record.lastReturn?.reason).toBe(
      'Name the supported phones and tablets for the AR build.',
    );
    expect(record.lastReturn?.references).toEqual([
      { step: 'formats-and-delivery', format: 'ar', field: 'device-need' },
    ]);

    // Back to Ready to publish: it is no longer listed.
    await reachAndClick(page, decided.getByRole('link', { name: 'Back to Ready to publish' }));
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 60_000 });
  });

  test('SUB-0074: Send back to the Academic Reviewer with a reason (a re-check)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0074', 'Transient Cooling');
    await reachAndClick(page, panel(page).getByRole('radio', { name: /^Send back/ }));
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Send back' }));
    const dialog = page.getByRole('dialog', { name: 'Send it back?' });
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('radio', { name: /^Academic Reviewer/ }));
    const reason = dialog.getByRole('textbox', { name: 'Reason the Academic Reviewer will see' });
    await expect(dialog.getByRole('group', { name: /What it refers to/ })).toHaveCount(0);
    await reason.pressSequentially('Please re-check the second outcome against the description.');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Send back' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    const decided = page.locator('#cm-cdec');
    await expect(decided).toBeFocused();
    await expect(decided.locator('.xr-status--wait')).toHaveText(
      'Sent back to the Academic Reviewer',
    );
    // B6-07 script `cmChipWords`: a re-check reads "Back with the Academic Reviewer".
    await expect(chip(page)).toHaveText('Back with the Academic Reviewer');
    await expect(main(page).locator('ol.xr-timeline .xr-tl-what').first()).toHaveText(
      'Sent back to the Academic Reviewer by Kavya Nair',
    );
    await expect(main(page).locator('ol.xr-timeline .xr-tl-note').first()).toHaveText(
      '“Please re-check the second outcome against the description.”',
    );
    await checkState(page, 'Transient Cooling');

    // The Academic Reviewer has it back as a re-check (CI seam, read only).
    const queue = await port<readonly { readonly ref: { readonly id: string } }[]>(
      page,
      MENON,
      'production',
      'getReviewQueue',
      { type: 'recheck' },
    );
    expect(queue.map((item) => item.ref.id)).toContain('SUB-0074');
  });

  test('SUB-0086 still in academic review: read-only, nothing to decide yet (f3; B6-11 f5; B6-12 f3)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0086', 'Flash Distillation');
    await expect(chip(page)).toHaveText('Still in academic review');
    await expect(chip(page)).toHaveClass(/xr-status--wait/);
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Meridian Virtual Labs · CHE ZG513',
    );
    await expect(main(page).locator('.xr-phead-meta')).not.toContainText('approved by');
    const notice = main(page).locator('.xr-decide .xr-notice').first();
    await expect(notice).toContainText('Still in academic review');
    await expect(notice).toContainText(
      'The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then.',
    );
    await expect(checkRows(page).first()).toHaveText(
      'Approved by the Academic ReviewerNot approved yet',
    );
    await expect(main(page).locator('table.xr-table tbody tr')).toHaveText([
      /WEB\s*Web link\s*In review/,
    ]);
    await expect(panel(page)).toContainText('Nothing to decide yet.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(panel(page).getByRole('radio')).toHaveCount(0);
    await expectDecisionLayout(page);
    await checkState(page, 'Flash Distillation');
    if (width(page) === 1024) await shot(page, 'b611-f5-read-only');
    if (width(page) === 1440) await shot(page, 'b612-f3-read-only');
    await shot720(page, 'b607-f3-read-only');
  });

  test('with the vendor (SUB-0081) and a re-check she asked for (SUB-0071): calm and read-only', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await openDecision(page, 'SUB-0081', 'Forced Convection');
    await expect(chip(page)).toHaveText('With the vendor');
    const notice = main(page).locator('.xr-decide .xr-notice').first();
    await expect(notice).toContainText('With the vendor');
    await expect(notice).toContainText(
      'It was returned with a reason. It comes back to the Academic Reviewer when the vendor resubmits.',
    );
    await expect(panel(page)).toContainText('Nothing to decide yet.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Forced Convection');

    await page.goto(DECISION('SUB-0071'));
    await expect(heading(page, 'Venturi Meter Calibration')).toBeVisible({ timeout: 90_000 });
    const decided = page.locator('#cm-cdec');
    await expect(decided.locator('.xr-status--wait')).toHaveText(
      'Sent back to the Academic Reviewer',
    );
    await expect(decided).toContainText(
      '25 Aug 2026, 10:00 · Kavya Nair · “The second learning outcome',
    );
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await checkState(page, 'Venturi Meter Calibration');
  });

  test('after Flow E: SUB-0077 published — the result read from the record', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-e', session: KAVYA });
    await openDecision(page, 'SUB-0077', 'Conduction Through a Composite Wall');
    await expect(chip(page)).toHaveText('Published');
    const decided = page.locator('#cm-cdec');
    await expect(decided.locator('.xr-status--ok')).toHaveText('Published');
    await expect(decided).toContainText(
      'In the public catalogue under ME ZG523 with WEB and VR. Publishing gave no one access.',
    );
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Northline Simulation Studio · ME ZG523 · approved by Prof. A. Menon on',
    );
    await expect(main(page).locator('dl.xv-kv')).toContainText('— after 1 return with a reason');
    await checkState(page, 'Conduction Through a Composite Wall');
    await shot720(page, 'b607-f4-sub0077');
    if (width(page) === 1440) await shot(page, 'b607-f4-sub0077');
  });
});

test.describe('CM-05 Published experiment', () => {
  test('Distillation Column: live and read-only (f0, f4); then an update in progress — draft (f2) and in academic review (f1; B6-11 f9)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('distillation-column'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'CHE ZG513 · Published · version 1.2',
    );
    await expect(chip(page)).toHaveText('Published');
    await expect(main(page).locator('.xr-phead-meta')).toContainText(
      'Live since 3 Jul 2026 · Meridian Virtual Labs',
    );
    await expect(main(page)).toContainText(
      'Every change opens a correction draft. The live experiment changes only when the Super Admin releases it.',
    );
    // The correction entry is Phase 6: none of its actions is offered.
    for (const name of [
      'Start a correction',
      'Edit catalogue details',
      'Edit delivery link',
      'Open update',
    ]) {
      await expect(main(page).getByRole('button', { name })).toHaveCount(0);
      await expect(main(page).getByRole('link', { name })).toHaveCount(0);
    }
    const catalogue = main(page).getByRole('region', { name: 'Catalogue details' });
    await expect(catalogue.locator('dd')).toHaveText([
      'Distillation Column',
      'CHE ZG513 · Process Instrumentation & Control',
      /^Bring a binary column/,
      /^Learners start a binary column/,
      '1.2',
      /WEB.*VR/,
    ]);
    await expect(
      main(page).getByRole('region', { name: 'Learning outcomes' }).locator('li'),
    ).toHaveText([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    const delivery = main(page).getByRole('region', { name: 'Delivery' });
    await expect(delivery.locator('.xv-deliv-head')).toHaveText([
      /WEB\s*Web link/,
      /VR\s*App package \(provisional — T-14\)/,
    ]);
    await expect(delivery).toContainText('MVL-DC-VR-1.2');
    const history = main(page).getByRole('region', { name: 'History' });
    await expect(history.locator('.xr-tl-what')).toHaveText([
      'Version 1.2 released',
      'Version 1.1 released',
      'Published · version 1.0',
    ]);
    await expect(history.locator('.xr-tl-note')).toHaveText([
      'Correction UPD-0002 — released by the Super Admin.',
      'Correction UPD-0001.',
      'First publication by the Content Manager.',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/library');
    if (width(page) < 1024) {
      await expect(page.locator('.xr-top-title')).toHaveText('Content library');
    } else {
      await expect(page.getByRole('list', { name: 'You are here' })).toHaveText(
        /Content library\s*\/\s*Distillation Column/,
      );
    }
    await checkState(page, 'Distillation Column');
    if (width(page) === 1440) await shot(page, 'b608-f0-live');
    if (width(page) === 375) await shot(page, 'b608-f4-live');

    // World set-up through the CI seam: Kavya opens UPD-0005 (Flow F’s F1) — a draft.
    await port(page, KAVYA, 'corrections', 'openCorrection', {
      experimentId: 'distillation-column',
      entry: 'edit-catalogue-details',
    });
    const notice = main(page).locator('.xr-notice--warn');
    await expect(notice).toContainText('An update is in progress — UPD-0005 · Draft');
    await expect(notice).toContainText(
      'Edits to this experiment join that update. Open it to continue.',
    );
    await expect(notice.getByRole('button')).toHaveCount(0);
    await expect(history.locator('.xr-tl-what').first()).toHaveText('UPD-0005 started — draft');
    await checkState(page, 'Distillation Column');
    await shot720(page, 'b608-f2-draft');

    // … saved with version 1.3 and sent for academic review.
    const draft = await port<{
      readonly update: { readonly id: string; readonly rev: number; readonly proposed: object };
    }>(page, KAVYA, 'corrections', 'getUpdate', 'UPD-0005');
    const saved = await port<{ readonly rev: number }>(
      page,
      KAVYA,
      'corrections',
      'saveCorrection',
      {
        id: draft.update.id,
        proposed: {
          ...draft.update.proposed,
          description:
            'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
        },
        whatChangesAndWhy: 'Corrects the reflux statement in the description.',
        versionLabel: '1.3',
        expectedRev: draft.update.rev,
      },
    );
    await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
      id: draft.update.id,
      expectedRev: saved.rev,
    });
    await expect(notice).toContainText('An update is in progress — UPD-0005 · In academic review');
    await expect(notice).toContainText(
      'It is with the Academic Reviewer. You can’t start another update until it is decided.',
    );
    await expect(history.locator('.xr-tl-what').first()).toHaveText(
      'UPD-0005 started — in academic review',
    );
    await expect(history.locator('.xr-tl-note').first()).toHaveText(
      'Version 1.3. The live version below is unchanged.',
    );
    await checkState(page, 'Distillation Column');
    await shot720(page, 'b608-f1-review');
    if (width(page) === 1024) await shot(page, 'b611-f9-review');
  });

  test('Induction Motor Loading (UPD-0006 returned) and Boiler Drum Level (UPD-0004 on hold)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto(PUBLISHED('induction-motor-loading'));
    await expect(heading(page, 'Induction Motor Loading')).toBeVisible({ timeout: 90_000 });
    const notice = main(page).locator('.xr-notice--warn');
    await expect(notice).toContainText('An update is in progress — UPD-0006 · Returned');
    await expect(notice).toContainText(
      'Edits to this experiment join that update. Open it to continue.',
    );
    const history = main(page).getByRole('region', { name: 'History' });
    await expect(history.locator('.xr-tl-what').first()).toHaveText('UPD-0006 started — returned');
    await checkState(page, 'Induction Motor Loading');

    // The back link names the library.
    await expect(main(page).locator('a.xr-back')).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    await expect(main(page).locator('a.xr-back')).toHaveText('Content library');

    await page.goto(PUBLISHED('boiler-drum-level'));
    await expect(heading(page, 'Boiler Drum Level')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'An update is in progress — UPD-0004 · On hold',
    );
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'The Super Admin put it on hold. Version 2.0 stays live.',
    );
    await expect(main(page).locator('.xr-phead-meta')).toContainText('Live since 18 Jun 2026');
    await checkState(page, 'Boiler Drum Level');
  });
});
