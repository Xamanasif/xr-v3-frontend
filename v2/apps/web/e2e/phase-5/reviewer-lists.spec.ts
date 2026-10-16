import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';

/**
 * RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (boards B6-01 f0 … f2, B6-02 f0 …
 * f5; B6-11 f14; B6-12 f0) on the test-hook build at 1440, 1024, 768 and 375, as Prof. A. Menon.
 * Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24
 * targets, no developer surface, no sideways scroll). The world starts at spine-start; the CI
 * seam only SETS UP the board’s world — Kavya Nair sends the Distillation Column correction
 * (UPD-0005), Anil Shetty submits “Conduction Through a Composite Wall” (SUB-0077), Prof. Menon
 * returns it and Anil resubmits (the routing stand-in sends revision 2 back to the reviewer); or,
 * for the calm state, Prof. Menon decides both waiting items. Everything the screens do — the
 * filters, Clear filters, “Open the review queue”, “Review the oldest”, each row’s Review and
 * Open, “Open Reviewed by me” — is done by real clicks and typing. RV-03 is another group’s page:
 * only its address and heading are checked. Loading and failed run in the component tests (the
 * fault plan exists only there).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const MENON = { personId: 'per-a-menon' };
const ANIL = { personId: 'per-anil-shetty' };
const KAVYA = { personId: 'per-kavya-nair' };
const COMPOSITE = 'Conduction Through a Composite Wall';
const RECHECK_REASON =
  'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/reviewer-lists';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };
interface Rev {
  readonly id: string;
  readonly rev: number;
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

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05); the revision changes the VR device need. */
function compositeWall(vrDevice: string) {
  return {
    courseId: 'thermodynamics-heat-transfer',
    name: COMPOSITE,
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current browser on a laptop or desktop',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: null,
        packageFileName: 'composite-wall-vr-1.0.zip',
        deviceNeeded: vrDevice,
        installNotes: 'Install the build named above on the headset and open “Composite Wall Lab”.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

/** B6-01 f0 / B6-02 f0’s world from spine-start: four items waiting and SUB-0077 decided once. */
async function boardWorld(page: Page): Promise<void> {
  const opened = await port<{
    readonly update: Rev & { readonly proposed: Record<string, unknown> };
  }>(page, KAVYA, 'corrections', 'openCorrection', {
    experimentId: 'distillation-column',
    entry: 'edit-catalogue-details',
  });
  const corrected = await port<Rev>(page, KAVYA, 'corrections', 'saveCorrection', {
    id: opened.update.id,
    proposed: {
      ...opened.update.proposed,
      description:
        'Learners start a binary column from cold and bring it to steady state. Raising the reflux ratio raises the overhead purity.',
    },
    whatChangesAndWhy: 'Corrects the reflux statement in the description.',
    versionLabel: '1.3',
    expectedRev: opened.update.rev,
  });
  await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
    id: corrected.id,
    expectedRev: corrected.rev,
  });

  const draft = await port<Rev>(page, ANIL, 'production', 'saveDraft', {
    id: null,
    content: compositeWall('VR headset'),
    step: 'course',
    expectedRev: null,
  });
  await port(page, ANIL, 'production', 'submitForReview', {
    id: draft.id,
    content: compositeWall('VR headset'),
    expectedRev: draft.rev,
  });
  const view = await port<{ readonly submission: Rev }>(
    page,
    MENON,
    'production',
    'getSubmissionForReview',
    draft.id,
  );
  await port(page, MENON, 'production', 'returnSubmission', {
    id: view.submission.id,
    reason: 'Please clarify the VR device requirements.',
    references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
    outcomes: [],
    expectedRev: view.submission.rev,
  });
  const revised = compositeWall('Standalone VR headset and about 2 × 2 m of clear floor');
  const record = await port<{ readonly submission: Rev }>(
    page,
    ANIL,
    'production',
    'getRecord',
    draft.id,
  );
  const saved = await port<Rev>(page, ANIL, 'production', 'saveRevision', {
    id: record.submission.id,
    content: revised,
    expectedRev: record.submission.rev,
  });
  await port(page, ANIL, 'production', 'resubmit', {
    id: saved.id,
    content: revised,
    expectedRev: saved.rev,
  });
}

/** Prof. Menon decides both spine-start items: nothing waits (B6-01 f1, B6-02 f4). */
async function decideBoth(page: Page): Promise<void> {
  for (const id of ['SUB-0086', 'SUB-0071']) {
    const view = await port<{
      readonly submission: Rev & {
        readonly learningOutcomes: readonly { readonly text: string }[];
      };
    }>(page, MENON, 'production', 'getSubmissionForReview', id);
    const outcomes = view.submission.learningOutcomes.map((outcome) => outcome.text);
    await port(page, MENON, 'production', 'approveSubmission', {
      id: view.submission.id,
      outcomes: outcomes.length > 0 ? outcomes : ['Find the vapour fraction of a flashed feed.'],
      expectedRev: view.submission.rev,
    });
  }
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const table = (page: Page) => main(page).locator('table.xr-table');
const status = (page: Page) => main(page).locator('.xr-toolbar-status [role="status"]');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** At 720 px wide, as B6-01 f1 and B6-02 f2 … f4 are drawn (during the 768 run only). */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-720.png`), fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
}

/** Below 760 px of content the table’s rows become labelled blocks and its header row is hidden. */
async function expectTableLayout(page: Page): Promise<void> {
  const header = table(page).locator('thead');
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

/** Opens a sidebar destination with a real click (the drawer below 1024 px). */
async function openFromSidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator(`aside.xr-side a[href="${href}"]`));
}

test.describe('RV-01 Overview and RV-02 Review queue', () => {
  test('spine-start, then four items waiting (B6-01 f0, f2; B6-02 f0, f5): rows, filters, Review', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const line = main(page).locator('.xr-phead-meta p.xv-statusline[role="status"]');
    await expect(line.locator(':scope > span')).toHaveText([
      '2 items waiting',
      '1 re-check from the Content Manager',
      '0 updates',
    ]);
    await expect(main(page).locator('.xr-overline')).toHaveText('Prof. A. Menon');
    await expect(main(page).locator('p.xg-scope')).toHaveText(
      'You review: ME ZG523 · MEL ZG512 · CHE ZG513',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer');
    await checkState(page, 'Overview');

    // The world moves (set-up): the board’s four items, oldest first.
    await boardWorld(page);
    await expect(line.locator(':scope > span')).toHaveText([
      '4 items waiting',
      '1 re-check from the Content Manager',
      '1 update',
    ]);
    const section = page.getByRole('region', { name: 'Waiting for your decision' });
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText('4 items · oldest first');
    const rows = section.locator('li.xr-row');
    await expect(rows.locator('.xr-row-title')).toHaveText([
      'Review: Flash Distillation',
      'Re-check: Venturi Meter Calibration',
      'Update: Distillation Column',
      `Review: ${COMPOSITE}`,
    ]);
    await expect(rows.nth(0).locator('.xr-row-sub')).toHaveText(
      'New submission · no learning outcomes yet · Meridian Virtual Labs · 24 Aug 2026',
    );
    await expect(rows.nth(1).locator('.xr-row-sub')).toHaveText(
      `Content Manager · 25 Aug 2026 · “${RECHECK_REASON}”`,
    );
    await expect(rows.nth(2).locator('.xr-row-sub')).toHaveText(
      /^Correction to the live version 1\.2 → 1\.3 · from Kavya Nair · Content Manager · \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    await expect(rows.nth(3).locator('.xr-row-sub')).toHaveText(
      /^Resubmitted · revision 2 · Northline Simulation Studio · \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    // The update’s “Review update” opens Review an update (RV-04, Phase 6).
    await expect(
      rows.nth(2).getByRole('link', { name: 'Review update Distillation Column' }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0005');
    await expect(rows.getByRole('link')).toHaveCount(4);
    const oldest = main(page).getByRole('link', { name: 'Review the oldest — Flash Distillation' });
    await expect(oldest).toHaveClass(/xr-btn--primary/);
    await checkState(page, 'Overview');
    if (width(page) === 1440) await shot(page, 'b6-01-f0-overview');
    if (width(page) === 375) await shot(page, 'b6-01-f2-overview');

    // “Open the review queue”, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open the review queue' }));
    await expect(page).toHaveURL(/\/reviewer\/queue$/);
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
    await expect(status(page)).toHaveText('4 of 4 items · oldest first');
    const body = table(page).locator('tbody tr');
    await expect(body.locator('td.is-primary strong')).toHaveText([
      'Flash Distillation',
      'Venturi Meter Calibration',
      'Distillation Column',
      COMPOSITE,
    ]);
    await expect(body.nth(0).locator('td.is-primary .xr-meta').first()).toHaveText(
      'SUB-0086 · CHE ZG513 · Meridian Virtual Labs',
    );
    await expect(body.nth(2).locator('td.is-primary .xr-meta').first()).toHaveText(
      'UPD-0005 · CHE ZG513 · Kavya Nair · Content Manager',
    );
    await expect(body.locator('.xw-tag')).toHaveText([
      'New submission',
      'Re-check',
      'Update',
      'New submission',
    ]);
    await expect(body.nth(1).locator('.xw-tag')).toHaveClass(/xw-tag--warn/);
    await expect(body.nth(1).locator('.xr-fmt')).toHaveText(['WEB', 'AR']);
    // The update’s “Review” opens Review an update (RV-04, Phase 6).
    await expect(
      body.nth(2).getByRole('link', { name: 'Review Distillation Column' }),
    ).toHaveAttribute('href', '/reviewer/updates/UPD-0005');
    await expect(table(page).getByRole('link', { name: /^Review / })).toHaveCount(4);
    await expect(page.getByRole('combobox', { name: 'Course' }).locator('option')).toHaveText([
      'All courses',
      'ME ZG523',
      'MEL ZG512',
      'CHE ZG513',
    ]);
    await expectTableLayout(page);
    await checkState(page, 'Review queue');
    if (width(page) === 1440) await shot(page, 'b6-02-f0-queue');
    if (width(page) === 375) await shot(page, 'b6-02-f5-queue');

    // The filters, by real interaction: Type is mirrored in the address.
    await page.getByRole('combobox', { name: 'Type' }).selectOption('recheck');
    await expect(page).toHaveURL(/\/reviewer\/queue\?type=recheck$/);
    await expect(body).toHaveCount(1);
    await expect(status(page)).toHaveText('1 of 4 items · oldest first');
    await page.getByRole('combobox', { name: 'Type' }).selectOption('all');
    await expect(page).toHaveURL(/\/reviewer\/queue$/);
    await page.getByRole('combobox', { name: 'Course' }).selectOption('MEL ZG512');
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Nothing in the queue matches' }),
    ).toBeVisible();
    await expect(status(page)).toHaveText('0 of 4 items · oldest first');
    await checkState(page, 'Review queue');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(body).toHaveCount(4);
    const search = page.getByRole('searchbox', { name: 'Search the queue' });
    await search.pressSequentially('northline');
    await expect(body).toHaveCount(1);
    await expect(body.locator('td.is-primary strong')).toHaveText(COMPOSITE);
    await reachAndClick(
      page,
      main(page).locator('.xr-toolbar-status').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(body).toHaveCount(4);
    await expect(search).toHaveValue('');

    // A row’s Review opens RV-03 for that submission, in the same tab.
    await reachAndClick(page, table(page).getByRole('link', { name: `Review ${COMPOSITE}` }));
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0077$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);

    // The Overview’s one primary opens the oldest.
    await openFromSidebar(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Review the oldest — Flash Distillation' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0086$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    // And a row’s Review: the re-check.
    await openFromSidebar(page, '/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Review Venturi Meter Calibration' }),
    );
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0071$/);
    await expectSameDocument(page, mark);
  });

  test('nothing waiting (B6-01 f1, B6-02 f4): the calm states and “Open Reviewed by me”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('p.xv-statusline')).toBeVisible();
    await decideBoth(page);
    const calm = main(page).getByRole('heading', {
      level: 2,
      name: 'Nothing is waiting for your decision',
    });
    await expect(calm).toBeVisible();
    await expect(main(page).locator('p.xv-statusline')).toHaveCount(0);
    await expect(main(page).locator('p.xg-scope')).toHaveText(
      'You review: ME ZG523 · MEL ZG512 · CHE ZG513',
    );
    await expect(main(page)).toContainText(
      'New submissions, updates and re-checks appear here when they reach you.',
    );
    await expect(main(page).locator('.xw-actions')).toHaveCount(0);
    await checkState(page, 'Overview');
    await shotAt720(page, 'b6-01-f1-nothing-waiting');

    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open Reviewed by me' }));
    await expect(page).toHaveURL(/\/reviewer\/reviewed$/);
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 60_000 });

    await openFromSidebar(page, '/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 60_000 });
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'Nothing is waiting for your decision' }),
    ).toBeVisible();
    await expect(main(page)).toContainText(
      'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
    );
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await checkState(page, 'Review queue');
    await shotAt720(page, 'b6-02-f4-nothing-waiting');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open Reviewed by me' }));
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('RV-05 Reviewed by me', () => {
  test('the decisions newest first (B6-02 f1): Show, and Open on a submission', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer/reviewed');
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 90_000 });
    await expect(status(page)).toHaveText('9 of 9 decisions');
    await boardWorld(page);
    await expect(status(page)).toHaveText('10 of 10 decisions');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/reviewed');
    const body = table(page).locator('tbody tr');
    await expect(body.locator('td.is-primary strong')).toHaveText([
      COMPOSITE,
      'Forced Convection',
      'Packed Bed Pressure Drop',
      'Venturi Meter Calibration',
      'Transient Cooling',
      'Boiler Drum Level',
      'Orifice Plate Metering',
      'Fin-Tube Bundle',
      'Distillation Column',
      'Distillation Column',
    ]);
    // B6-02 f1: SUB-0077 has moved on since (resubmitted) — its revision is named; SUB-0081 is
    // still returned.
    await expect(body.locator('.xr-status')).toHaveText([
      'Returned to vendor · revision 1',
      'Returned to vendor',
      'Approved — with the Content Manager',
      'Approved — later sent back for a re-check',
      'Approved — with the Content Manager',
      'Update approved — with the Super Admin',
      'Update approved — released',
      'Approved — published',
      'Update approved — released',
      'Update approved — released',
    ]);
    await expect(body.nth(0).locator('.xr-status')).toHaveClass(/xr-status--err/);
    await expect(body.nth(2).locator('.xr-status')).toHaveClass(/xr-status--ok/);
    await expect(body.nth(1).locator('td').nth(3)).toHaveText('24 Aug 2026');
    // An update’s Open opens RV-04’s decided view (Phase 6).
    await expect(body.nth(5).getByRole('link', { name: 'Open Boiler Drum Level' })).toHaveAttribute(
      'href',
      '/reviewer/updates/UPD-0004',
    );
    await expectTableLayout(page);
    await checkState(page, 'Reviewed by me');
    if (width(page) === 1440) await shot(page, 'b6-02-f1-reviewed');
    if (width(page) === 375) await shot(page, 'b6-02-f1-reviewed');

    const showFilter = page.getByRole('combobox', { name: 'Show' });
    await showFilter.selectOption('update');
    await expect(body).toHaveCount(4);
    await expect(status(page)).toHaveText('4 of 10 decisions');
    await showFilter.selectOption('new');
    await expect(body).toHaveCount(6);
    await expect(status(page)).toHaveText('6 of 10 decisions');
    await showFilter.selectOption('all');
    await expect(body).toHaveCount(10);

    const mark = await markDocument(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Open Forced Convection' }));
    await expect(page).toHaveURL(/\/reviewer\/submissions\/SUB-0081$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});
