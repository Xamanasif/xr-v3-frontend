import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * CM-01 Overview (board B6-05 f0 … f2), CM-02 Ready to publish (B6-06 f0, f3; B6-12 f2), CM-04
 * Content library (B6-06 f1, f4) and CM-09 Course codes (B6-10 f0 … f2; B6-11 f12), on the
 * test-hook build at 1440, 1024, 768 and 375, as Kavya Nair on spine-start. Each drawn state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). The CI seam only SETS UP the world: Anil Shetty saves and submits
 * “Conduction Through a Composite Wall” and Prof. A. Menon approves it (Flow E’s E1, E3) for B6-06
 * f0; Kavya’s own publications and a withdrawn correction empty the lists for f1 and f3.
 * Everything the screens do — the library’s tabs and search, typing codes, Save codes (the
 * duplicate refused, a unique code saved), Undo changes, the rows’ links to CM-03 and CM-05 — is
 * done by real clicks and typing; CM-03 and CM-05 are another group’s pages (their address and an
 * h1 are checked only).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const KAVYA = { personId: 'per-kavya-nair' };
const ANIL = { personId: 'per-anil-shetty' };
const MENON = { personId: 'per-a-menon' };

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/cm-lists';

const COMPOSITE_WALL = {
  courseId: 'thermodynamics-heat-transfer',
  name: 'Conduction Through a Composite Wall',
  summary:
    'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
  description:
    'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface. They compare the measured profile and heat flux with the series thermal-resistance model and explain where the two differ.',
  version: '1.0',
  formats: ['web', 'vr'],
  delivery: {
    web: {
      format: 'web',
      webLink: 'https://labs.northline.example/composite-wall',
      browserAndComputer:
        'A current Chrome, Edge, Firefox or Safari on a laptop or desktop, with a keyboard and mouse',
      notes: null,
    },
    vr: {
      format: 'vr',
      packageLabel: 'Composite Wall — VR build 1.0',
      packageReference: null,
      packageFileName: 'composite-wall-vr-1.0.zip',
      deviceNeeded: 'VR headset',
      installNotes:
        'Install the build named above on the headset and open “Composite Wall Lab”. On first launch, set the play-area boundary.',
      notes: null,
    },
  },
  preview: {
    label: 'Two-minute walkthrough',
    link: 'https://media.northline.example/composite-wall-walkthrough',
  },
  documents: [
    { fileName: 'Lab handout — Composite Wall.pdf' },
    { fileName: 'Thermocouple positions.pdf' },
  ],
};

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

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

/** E1 and E3: Anil saves and submits SUB-0077, Prof. A. Menon approves it. */
async function approveCompositeWall(page: Page): Promise<string> {
  const draft = await port<{ readonly id: string; readonly rev: number }>(
    page,
    ANIL,
    'production',
    'saveDraft',
    { id: null, content: COMPOSITE_WALL, step: 'course', expectedRev: null },
  );
  const submitted = await port<{ readonly id: string; readonly rev: number }>(
    page,
    ANIL,
    'production',
    'submitForReview',
    { id: draft.id, content: COMPOSITE_WALL, expectedRev: draft.rev },
  );
  const view = await port<{ readonly submission: { readonly id: string; readonly rev: number } }>(
    page,
    MENON,
    'production',
    'getSubmissionForReview',
    submitted.id,
  );
  await port(page, MENON, 'production', 'approveSubmission', {
    id: view.submission.id,
    outcomes: [
      'Explain conduction through layers in series using thermal resistance.',
      'Predict interface temperatures from layer properties.',
      'Compare measured and predicted heat flux and explain the difference.',
    ],
    expectedRev: view.submission.rev,
  });
  return submitted.id;
}

/** Kavya publishes a ready submission (set-up of the empty lists only; CM-03 is not under test). */
async function publish(page: Page, id: string): Promise<void> {
  const decision = await port<{
    readonly submission: { readonly id: string; readonly rev: number };
  }>(page, KAVYA, 'production', 'getPublicationDecision', id);
  await port(page, KAVYA, 'production', 'publish', {
    id: decision.submission.id,
    expectedRev: decision.submission.rev,
  });
}

/** Kavya withdraws the returned correction UPD-0006 (set-up of f1 only). */
async function withdrawReturnedUpdate(page: Page): Promise<void> {
  const view = await port<{ readonly update: { readonly id: string; readonly rev: number } }>(
    page,
    KAVYA,
    'corrections',
    'getUpdate',
    'UPD-0006',
  );
  await port(page, KAVYA, 'corrections', 'withdrawUpdate', {
    id: view.update.id,
    reason: 'The live description is right; nothing to correct.',
    expectedRev: view.update.rev,
  });
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const statusLine = (page: Page) => main(page).locator('p.xv-statusline[role="status"]');
const region = (page: Page, name: string) => page.getByRole('region', { name });
const tableRows = (page: Page) => main(page).locator('table.xr-table tbody tr');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A board frame drawn at 720: the 768 project narrows its viewport for the comparison shot. */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  await shot(page, name);
  await page.setViewportSize({ width: 768, height: 1024 });
}

/** Below 760 px of content the table’s rows stack and its header row is hidden (f2, f4). */
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

/** A link reached and pressed: Enter after focus (a wrapped inline link at 375), else a click. */
async function follow(page: Page, link: ReturnType<Page['getByRole']>): Promise<void> {
  if (width(page) <= 375) {
    await link.focus();
    await page.keyboard.press('Enter');
  } else {
    await reachAndClick(page, link);
  }
}

test.describe('CM-01 Overview', () => {
  test('as drawn at spine-start (f0, f2), the rows’ links, then nothing waiting (f1)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-overline')).toHaveText('Kavya Nair');
    // UPD-0005 is Flow F’s: two with others at spine-start (B6-05 draws three).
    await expect(statusLine(page).locator('span')).toHaveText([
      '2 ready to publish',
      '1 correction needs you',
      '2 with others',
    ]);
    const needs = region(page, 'Needs your decision');
    await expect(needs.locator('li.xr-row .xr-row-title')).toHaveText([
      'Ready to publish: Transient Cooling',
      'Ready to publish: Packed Bed Pressure Drop',
      'Update returned: Induction Motor Loading 1.1',
    ]);
    await expect(needs.locator('li.xr-row .xr-row-sub').first()).toHaveText(
      'SUB-0074 · ME ZG523 · approved 14 Aug 2026 · oldest of 2',
    );
    await expect(needs.locator('li.xr-row .xr-row-sub').nth(2)).toHaveText(
      'UPD-0006 · returned by the Academic Reviewer on 26 Aug 2026 · “The proposed description says slip falls as the load rises…”',
    );
    // “Open update” waits for CM-08 (Phase 6): the row has no action.
    await expect(needs.getByRole('link', { name: /update/i })).toHaveCount(0);
    const others = region(page, 'With others');
    await expect(others.locator('.xr-section-head .xr-meta')).toHaveText(
      'For information — nothing to do',
    );
    await expect(others.locator('li.xr-row .xr-row-title')).toHaveText([
      'Venturi Meter Calibration — with the Academic Reviewer for a re-check',
      'Boiler Drum Level 2.1 — on hold',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager');
    await checkState(page, 'Overview');
    if (width(page) === 1440) await shot(page, 'b6-05-f0-overview');
    if (width(page) === 375) await shot(page, 'b6-05-f2-overview');

    // The oldest ready item opens its decision (CM-03), in the same tab.
    const mark = await markDocument(page);
    await follow(page, needs.getByRole('link', { name: 'Open the next ready item' }));
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0074$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // The re-check row opens the same decision page, read-only while the reviewer has it.
    await follow(page, others.getByRole('link', { name: 'Open Venturi Meter Calibration' }));
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0071$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // The header’s Content library.
    await follow(page, main(page).locator('.xr-phead-actions').getByRole('link'));
    await expect(page).toHaveURL(/\/content-manager\/library$/, { timeout: 60_000 });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });

    // f1: both published and the returned correction withdrawn — nothing waits for her.
    await publish(page, 'SUB-0074');
    await publish(page, 'SUB-0070');
    await withdrawReturnedUpdate(page);
    const calm = main(page).getByRole('heading', {
      level: 2,
      name: 'Nothing is waiting for your publication decision',
    });
    await expect(calm).toBeVisible();
    await expect(statusLine(page).locator('span')).toHaveText([
      '0 ready to publish',
      '0 corrections need you',
      '2 with others',
    ]);
    await expect(main(page)).toContainText(
      'Approved experiments and corrections that need you appear here.',
    );
    await checkState(page, 'Overview');
    await shotAt720(page, 'b6-05-f1-nothing-waiting');
    await follow(page, main(page).getByRole('link', { name: 'Open the Content library' }));
    await expect(page).toHaveURL(/\/content-manager\/library$/, { timeout: 60_000 });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('CM-02 Ready to publish', () => {
  test('spine-start (B6-12 f2), SUB-0077 approved (f0) and its Open decision, then empty (f3)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/ready');
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 90_000 });
    const list = region(page, 'Approved by the Academic Reviewer');
    await expect(list.locator('.xr-section-head .xr-meta')).toHaveText(
      '2 experiments approved and waiting · oldest first',
    );
    await expect(tableRows(page)).toHaveCount(2);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/ready');
    await checkState(page, 'Ready to publish');
    if (width(page) === 1440) await shot(page, 'b6-12-f2-ready');

    // The Academic Reviewer approves SUB-0077: the list (and the sidebar count) follow.
    const id = await approveCompositeWall(page);
    expect(id).toBe('SUB-0077');
    await expect(tableRows(page)).toHaveCount(3);
    await expect(list.locator('.xr-section-head .xr-meta')).toHaveText(
      '3 experiments approved and waiting · oldest first',
    );
    const third = tableRows(page).nth(2);
    await expect(third.locator('td').first()).toHaveText(
      'Conduction Through a Composite WallSUB-0077 · ME ZG523 · Northline Simulation Studio',
    );
    await expect(third.locator('.xr-fmt')).toHaveText(['WEB', 'VR']);
    await expect(third.locator('td').nth(2)).toContainText('Prof. A. Menon');
    await expect(third.locator('.xr-status--ok')).toHaveText('Ready');
    await expect(currentSidebarItem(page)).toContainText('3');
    await expectTableLayout(page);
    await checkState(page, 'Ready to publish');
    if (width(page) === 1440) await shot(page, 'b6-06-f0-ready');
    await shotAt720(page, 'b6-06-f2-ready-stacked');

    const mark = await markDocument(page);
    await follow(
      page,
      list.getByRole('link', { name: 'Open decision for Conduction Through a Composite Wall' }),
    );
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0077$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 60_000 });

    // f3: all three published — nothing is ready.
    for (const ready of ['SUB-0074', 'SUB-0070', 'SUB-0077']) await publish(page, ready);
    const empty = main(page).getByRole('heading', {
      level: 3,
      name: 'Nothing is ready to publish',
    });
    await expect(empty).toBeVisible();
    await expect(list.locator('.xr-section-head .xr-meta')).toHaveText(
      '0 experiments approved and waiting · oldest first',
    );
    await expect(main(page)).toContainText(
      'Experiments appear here once the Academic Reviewer approves them.',
    );
    await checkState(page, 'Ready to publish');
    await shotAt720(page, 'b6-06-f3-empty');
    await follow(page, main(page).getByRole('link', { name: 'Open the Content library' }));
    await expect(page).toHaveURL(/\/content-manager\/library$/, { timeout: 60_000 });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('CM-04 Content library', () => {
  test('the tabs and the search by real clicks and typing (f1, f4), the rows’ links', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/library');
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 90_000 });
    const library = region(page, 'Every experiment you look after');
    const tabs = library.getByRole('tablist', { name: 'Content library' });
    const status = library.locator('.xr-toolbar-status [role="status"]');
    await expect(tabs.getByRole('tab')).toHaveText([
      'Ready 2',
      'In review 3',
      'With vendor 1',
      'Published 12',
    ]);
    await expect(status).toHaveText('Ready · 2 of 2');
    await expect(tableRows(page)).toHaveCount(2);
    await expect(tableRows(page).first().locator('td').nth(2)).toHaveText('Approved 14 Aug 2026');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/library');
    await expectTableLayout(page);
    await checkState(page, 'Content library');
    if (width(page) === 1440) await shot(page, 'b6-06-f1-library');

    // In review: the address follows; the re-check row opens CM-03 read-only.
    await reachAndClick(page, tabs.getByRole('tab', { name: /^In review/ }));
    await expect(page).toHaveURL(/\/content-manager\/library\?tab=in-review$/, { timeout: 60_000 });
    await expect(status).toHaveText('In review · 3 of 3');
    await expect(tableRows(page).locator('td:nth-child(3)')).toHaveText([
      'New submission · since 24 Aug 2026',
      'Re-check you asked for · since 25 Aug 2026',
      'New submission · since 2 Oct 2026',
    ]);
    // The search narrows the tab (typed), and “Clear search” clears it.
    const search = library.getByRole('searchbox', { name: 'Search the library' });
    await search.click();
    await search.pressSequentially('venturi');
    await expect(status).toHaveText('In review · 1 of 3');
    await expect(tableRows(page)).toHaveCount(1);
    await checkState(page, 'Content library');
    await reachAndClick(page, library.getByRole('button', { name: 'Clear search' }));
    await expect(status).toHaveText('In review · 3 of 3');
    await search.pressSequentially('zz-nothing');
    await expect(library.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeVisible();
    await expect(status).toHaveText('In review · 0 of 3');
    await reachAndClick(page, library.getByRole('button', { name: 'Clear search' }));
    await expect(tableRows(page)).toHaveCount(3);
    const mark = await markDocument(page);
    await follow(page, library.getByRole('link', { name: 'Open Venturi Meter Calibration' }));
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0071$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expect(tabs.getByRole('tab', { name: /^In review/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // With vendor, by the arrow key (one tab stop).
    await tabs.getByRole('tab', { name: /^In review/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(/\?tab=with-vendor$/, { timeout: 60_000 });
    await expect(tableRows(page)).toHaveCount(1);
    await expect(tableRows(page).first().locator('td').nth(2)).toHaveText(
      'Returned by the Academic Reviewer · 24 Aug 2026',
    );

    // Published (f4 at 375): twelve rows, their open corrections named; a row opens CM-05.
    await reachAndClick(page, tabs.getByRole('tab', { name: /^Published/ }));
    await expect(page).toHaveURL(/\?tab=published$/, { timeout: 60_000 });
    await expect(status).toHaveText('Published · 12 of 12');
    await expect(tableRows(page)).toHaveCount(12);
    const distillation = tableRows(page).filter({ hasText: 'Distillation Column' });
    await expect(distillation.locator('td').nth(2)).toHaveText(
      'Version 1.2 · live since 3 Jul 2026',
    );
    await expect(
      tableRows(page).filter({ hasText: 'Induction Motor Loading' }).locator('td').nth(2),
    ).toHaveText('Version 1.0 · live since 9 Jun 2026 · Update returned to you');
    await expect(
      tableRows(page).filter({ hasText: 'Boiler Drum Level' }).locator('td').nth(2),
    ).toHaveText('Version 2.0 · live since 18 Jun 2026 · Update on hold');
    await expectTableLayout(page);
    await checkState(page, 'Content library');
    if (width(page) === 375) await shot(page, 'b6-06-f4-published');
    await follow(page, library.getByRole('link', { name: 'Open Distillation Column' }));
    await expect(page).toHaveURL(/\/content-manager\/published\/distillation-column$/, {
      timeout: 60_000,
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('CM-09 Course codes', () => {
  test('as drawn (f0, f2), a duplicate refused (B6-11 f12, f1), a unique code saved, Undo changes', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/course-codes');
    await expect(heading(page, 'Course codes')).toBeVisible({ timeout: 90_000 });
    const field = (course: string) =>
      page.getByRole('textbox', { name: `Platform course code for ${course}` });
    const foot = main(page).locator('.xw-flow-foot [role="status"]');
    await expect(tableRows(page)).toHaveCount(6);
    await expect(field('Thermodynamics & Heat Transfer')).toHaveValue('ME ZG523');
    await expect(field('Fluid Mechanics')).toHaveValue('');
    await expect(tableRows(page).last()).toContainText(
      'No code yet — the catalogue shows the course name only.',
    );
    await expect(foot).toHaveText('No unsaved changes');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/course-codes');
    await expectTableLayout(page);
    await checkState(page, 'Course codes');
    if (width(page) === 1440) await shot(page, 'b6-10-f0-course-codes');
    if (width(page) === 375) await shot(page, 'b6-10-f2-course-codes');

    // Fluid Mechanics given ME ZG523: Save codes is refused, nothing saved.
    await field('Fluid Mechanics').click();
    await field('Fluid Mechanics').pressSequentially('ME ZG523');
    await expect(tableRows(page).last().locator('.xg-changed-mark')).toHaveText(
      'Changed — not saved yet',
    );
    await expect(foot).toHaveText('1 change not saved');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Save codes' }));
    const summary = main(page).locator('div.xw-errsum[role="alert"]');
    const words =
      'ME ZG523 is already the code for Thermodynamics & Heat Transfer. Each course needs its own code.';
    await expect(summary).toBeFocused();
    await expect(summary.locator('strong')).toHaveText('Check the codes');
    await expect(summary.getByRole('link')).toHaveText(words);
    await expect(tableRows(page).last().locator('.xr-error')).toHaveText(words);
    await expect(field('Fluid Mechanics')).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Course codes');
    await shotAt720(page, 'b6-11-f12-duplicate');
    // The summary link moves focus to the field (a wrapped inline link: Enter after focus).
    await summary.getByRole('link').focus();
    await page.keyboard.press('Enter');
    await expect(field('Fluid Mechanics')).toBeFocused();

    // A unique code instead: saved, said so, and kept as the platform’s code.
    await field('Fluid Mechanics').fill('');
    await field('Fluid Mechanics').pressSequentially('ME ZG541');
    await expect(tableRows(page).last().locator('.xr-error')).toHaveCount(0);
    await reachAndClick(page, main(page).getByRole('button', { name: 'Save codes' }));
    const saved = main(page).locator('p.xa-save.is-ok[role="status"]');
    await expect(saved).toHaveText(
      /^Codes saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · the catalogue shows them from now on$/,
    );
    await expect(saved).toBeFocused();
    await expect(foot).toHaveText('No unsaved changes');
    await expect(field('Fluid Mechanics')).toHaveValue('ME ZG541');
    await expect(main(page).locator('.xg-changed-mark')).toHaveCount(0);
    await checkState(page, 'Course codes');

    // Undo changes puts every typed code back.
    await field('Power Electronics').fill('');
    await expect(tableRows(page).nth(3)).toContainText(
      'No code yet — the catalogue shows the course name only.',
    );
    await expect(foot).toHaveText('1 change not saved');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Undo changes' }));
    await expect(field('Power Electronics')).toHaveValue('EEE ZG512');
    await expect(foot).toHaveText('No unsaved changes');
    await expect(field('Thermodynamics & Heat Transfer')).toBeFocused();
  });
});
