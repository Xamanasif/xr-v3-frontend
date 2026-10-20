import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * CM-01 Overview, CM-02 Ready to publish, CM-04 Content library and CM-09 Platform course codes in
 * the V3 Refined B design (the owner-approved export design/v3-refined-b/roles/CM-v1), on the
 * test-hook build at 1440, 1024, 768 and 375, as Kavya Nair on spine-start. Each drawn state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). The CI seam only SETS UP the world: Anil Shetty saves and submits
 * “Conduction Through a Composite Wall” and Prof. A. Menon approves it (Flow E’s E1, E3); Kavya’s
 * own publications and a withdrawn correction empty the lists for the calm and empty states.
 * Everything the screens do — the pipeline’s and the desk’s links, the sort, the library’s views,
 * search and course filter, typing codes, Save codes (the duplicate refused, a unique code saved),
 * Undo changes, the rows’ links to CM-03 and CM-05 — is done by real clicks and typing; CM-03 and
 * CM-05 are another group’s pages (their address and an h1 are checked only).
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/cm-lists/shots';

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

/** Kavya withdraws the returned correction UPD-0006 (set-up of the calm state only). */
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
const region = (page: Page, name: string) => page.getByRole('region', { name });
const cards = (page: Page) => main(page).locator('ul.cm-qlist > li.cm-qcard');
const libraryRows = (page: Page) => main(page).locator('table.rk-table tbody tr:not(.cm-grp-h)');
const codeRows = (page: Page) => main(page).locator('table.cm-codes tbody tr:not(.cm-area)');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** On a phone a table's rows become labelled blocks: its head is hidden; on wide pages it shows. */
async function expectTableLayout(page: Page, table: Locator): Promise<void> {
  const head = table.locator('thead');
  if (width(page) <= 375) {
    await expect
      .poll(() =>
        head.evaluate((element) => {
          const style = getComputedStyle(element);
          return style.display === 'none' || style.position === 'absolute';
        }),
      )
      .toBe(true);
  } else if (width(page) >= 1440) {
    await expect(head).toBeVisible();
  }
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

test.describe('CM-01 Overview', () => {
  test('as drawn at spine-start: the pipeline, the desk, with others, the catalogue, their links; then calm', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const pipeline = region(page, 'Publishing pipeline');
    await expect(pipeline.locator('li.cm-tile')).toHaveCount(8);
    await expect(pipeline.locator('li.cm-tile.is-you .cm-you')).toHaveText([
      'Your step',
      'Your step',
    ]);
    await expect(
      pipeline.getByRole('link', {
        name: '2 Ready to publish. Oldest approved 14 Aug. Your step. Open Ready to publish',
      }),
    ).toHaveAttribute('href', '/content-manager/ready');
    const desk = region(page, 'Needs your decision');
    await expect(desk.locator('li.cm-orow .rb-row-t')).toHaveText([
      'Transient Cooling',
      'Packed Bed Pressure Drop',
      'Induction Motor Loading',
    ]);
    await expect(desk.locator('li.cm-orow.is-first .cm-next')).toHaveText('Publish next');
    await expect(desk.locator('li.cm-orow .rb-row-d').first()).toHaveText(
      'SUB-0074 · ME ZG523 · Northline Simulation Studio',
    );
    await expect(desk.locator('blockquote.cm-orow-q footer')).toHaveText(
      'Prof. A. Menon, Academic Reviewer · 26 Aug',
    );
    await expect(
      desk.getByRole('link', { name: 'Continue UPD-0006, correction to Induction Motor Loading' }),
    ).toHaveAttribute('href', '/content-manager/updates/UPD-0006');
    const others = region(page, 'With others');
    await expect(others.locator('.cm-hold-t')).toHaveText([
      'Boiler Drum Level 2.1',
      'Venturi Meter Calibration',
    ]);
    const catalogue = region(page, 'In the catalogue');
    await expect(catalogue.locator('.cm-cattotal')).toHaveText(
      /^12\s*experiments live, in 5 courses$/,
    );
    await expect(catalogue.locator('.cm-catlist-t')).toHaveCount(5);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager');
    await checkState(page, 'Overview');
    await shot(page, '01-overview');

    // The oldest ready item opens its decision (CM-03), in the same tab.
    const mark = await markDocument(page);
    await follow(
      page,
      desk.getByRole('link', { name: 'Open the publication decision for Transient Cooling' }),
    );
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0074$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // The re-check opens the same decision page, read-only while the reviewer has it.
    await follow(page, others.getByRole('link', { name: 'Open Venturi Meter Calibration' }));
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0071$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // A pipeline stage opens the list that holds its items.
    await follow(
      page,
      pipeline.getByRole('link', {
        name: '1 With the vendor. Vendor revising. Open the Content library, With vendor',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/library\?tab=with-vendor$/, {
      timeout: 60_000,
    });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^With vendor/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // A course in the catalogue opens the library's Published view filtered to it.
    await follow(
      page,
      catalogue.getByRole('link', {
        name: 'Thermodynamics & Heat Transfer, 3 published experiments. Open in the Content library',
      }),
    );
    await expect(page).toHaveURL(
      /\/content-manager\/library\?tab=published&course=thermodynamics-heat-transfer$/,
      { timeout: 60_000 },
    );
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expect(libraryRows(page)).toHaveCount(3);
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });

    // Calm: both published and the returned correction withdrawn — nothing waits for her.
    await publish(page, 'SUB-0074');
    await publish(page, 'SUB-0070');
    await withdrawReturnedUpdate(page);
    const calm = region(page, 'Nothing is waiting for your decision');
    await expect(calm).toBeVisible();
    await expect(calm).toContainText(
      'Approved experiments and corrections returned to you appear here.',
    );
    await expect(
      pipeline.getByRole('link', {
        name: '0 Ready to publish. Nothing waiting. Your step. Open Ready to publish',
      }),
    ).toBeVisible();
    await expect(catalogue.locator('.cm-cattotal')).toHaveText(/^14\s*experiments live/);
    await checkState(page, 'Overview');
    await shot(page, '14-empty-overview');
    await follow(page, calm.getByRole('link', { name: 'Open the Content library' }));
    await expect(page).toHaveURL(/\/content-manager\/library$/, { timeout: 60_000 });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('CM-02 Ready to publish', () => {
  test('spine-start, SUB-0077 approved (three cards), the sort, its Open decision, then empty', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/ready');
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 90_000 });
    const list = region(page, 'Approved experiments waiting for your decision');
    await expect(list.getByRole('status')).toHaveText('2 experiments approved and waiting');
    await expect(cards(page)).toHaveCount(2);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/ready');
    await checkState(page, 'Ready to publish');

    // The Academic Reviewer approves SUB-0077: the list (and the rail count) follow.
    const id = await approveCompositeWall(page);
    expect(id).toBe('SUB-0077');
    await expect(cards(page)).toHaveCount(3);
    await expect(list.getByRole('status')).toHaveText('3 experiments approved and waiting');
    const third = cards(page).nth(2);
    await expect(third.locator('.cm-qname')).toHaveText('Conduction Through a Composite Wall');
    await expect(third.locator('.cm-qmeta .xr-fmt')).toHaveText(['WEB', 'VR']);
    await expect(third.locator('.cm-qsum')).toHaveText('All 4 checks met');
    await expect(cards(page).first()).toHaveClass(/is-first/);
    await expect(currentSidebarItem(page)).toContainText('3');
    await checkState(page, 'Ready to publish');
    await shot(page, '02-ready');

    // Newest first: the longest wait stays marked and gold.
    await reachAndClick(page, list.getByRole('button', { name: /^Sort: / }));
    await expect(cards(page).first().locator('.cm-qname')).toHaveText(
      'Conduction Through a Composite Wall',
    );
    await expect(cards(page).last()).toHaveClass(/is-first/);
    await expect(cards(page).last().locator('.cm-qact a')).toHaveClass(/rb-btn--primary/);
    await checkState(page, 'Ready to publish');
    await shot(page, '02d-ready-newest');
    await reachAndClick(page, list.getByRole('button', { name: /^Sort: / }));
    await expect(cards(page).first().locator('.cm-qname')).toHaveText('Transient Cooling');

    const mark = await markDocument(page);
    await follow(
      page,
      list.getByRole('link', {
        name: 'Open the publication decision for Conduction Through a Composite Wall',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0077$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Ready to publish')).toBeVisible({ timeout: 60_000 });

    // Empty: all three published — nothing is ready.
    for (const ready of ['SUB-0074', 'SUB-0070', 'SUB-0077']) await publish(page, ready);
    const empty = main(page).getByRole('heading', {
      level: 2,
      name: 'Nothing is ready to publish',
    });
    await expect(empty).toBeVisible();
    await expect(main(page)).toContainText(
      'Experiments appear here once the Academic Reviewer approves them.',
    );
    await expect(main(page).locator('dl.rb-figs')).toHaveCount(0);
    await checkState(page, 'Ready to publish');
    await shot(page, '14b-empty-ready');
    await follow(
      page,
      list.locator('.rk-state').getByRole('link', { name: 'Open the Content library' }),
    );
    await expect(page).toHaveURL(/\/content-manager\/library$/, { timeout: 60_000 });
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('CM-04 Content library', () => {
  test('the views, the search and the course filter by real clicks and typing, the rows’ links', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/library');
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 90_000 });
    const views = page.getByRole('group', { name: 'Show experiments that are' });
    const count = main(page).locator('.rk-statusline [role="status"]');
    await expect(views.getByRole('button')).toHaveText([
      'Ready 2',
      'In review 3',
      'With vendor 1',
      'Published 12',
    ]);
    await expect(count).toHaveText('2 ready to publish');
    await expect(libraryRows(page)).toHaveCount(2);
    await expect(main(page).locator('table.rk-table tbody tr.cm-grp-h')).toHaveCount(2);
    await expect(main(page).locator('.cm-stageline .cm-own')).toHaveText('With you');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/library');
    await expectTableLayout(page, main(page).locator('table.rk-table'));
    await checkState(page, 'Content library');
    await shot(page, '04-library');

    // In review: the address follows; the re-check row opens CM-03 read-only.
    await reachAndClick(page, views.getByRole('button', { name: /^In review/ }));
    await expect(page).toHaveURL(/\/content-manager\/library\?tab=in-review$/, { timeout: 60_000 });
    await expect(count).toHaveText('3 in academic review');
    await expect(libraryRows(page).locator('.cm-stcell .rk-small')).toHaveText([
      'New submission',
      'New submission',
      'Re-check you asked for',
    ]);
    // The search narrows the view (typed); its chip; Clear filters clears it.
    const search = main(page).getByRole('searchbox', { name: 'Search' });
    await search.click();
    await search.pressSequentially('venturi');
    await expect(count).toHaveText('1 of 3 in academic review');
    await expect(libraryRows(page)).toHaveCount(1);
    await checkState(page, 'Content library');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Clear filters' }));
    await expect(count).toHaveText('3 in academic review');
    await expect(search).toBeFocused();
    await search.pressSequentially('zz-nothing');
    await expect(
      main(page).getByRole('heading', { level: 2, name: 'Nothing in In review matches' }),
    ).toBeVisible();
    await expect(count).toHaveText('0 of 3 in academic review');
    await checkState(page, 'Content library');
    await shot(page, '04c-lib-nomatch');
    await reachAndClick(
      page,
      main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(libraryRows(page)).toHaveCount(3);
    const mark = await markDocument(page);
    await follow(
      page,
      main(page).getByRole('link', {
        name: 'Venturi Meter Calibration, SUB-0071, back with the academic reviewer. Open',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/decisions\/SUB-0071$/, { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await page.goBack();
    await expect(heading(page, 'Content library')).toBeVisible({ timeout: 60_000 });
    await expect(views.getByRole('button', { name: /^In review/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // With vendor, from the keyboard (each view is its own button).
    await views.getByRole('button', { name: /^With vendor/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\?tab=with-vendor$/, { timeout: 60_000 });
    await expect(libraryRows(page)).toHaveCount(1);
    await expect(libraryRows(page).first().locator('.cm-stcell')).toHaveText(
      /^With the vendor\s*Returned by the Academic Reviewer$/,
    );

    // Published: twelve rows by course, their open corrections as their own chips; the pressed
    // view stays in sight on a phone; a row opens CM-05.
    await reachAndClick(page, views.getByRole('button', { name: /^Published/ }));
    await expect(page).toHaveURL(/\?tab=published$/, { timeout: 60_000 });
    await expect(count).toHaveText('12 published');
    await expect(libraryRows(page)).toHaveCount(12);
    const pressed = await views.getByRole('button', { name: /^Published/ }).boundingBox();
    const box = await views.boundingBox();
    expect(
      pressed &&
        box &&
        pressed.x >= box.x - 1 &&
        pressed.x + pressed.width <= box.x + box.width + 1,
    ).toBe(true);
    await expect(
      libraryRows(page).filter({ hasText: 'Induction Motor Loading' }).locator('.cm-stcell .xr-st'),
    ).toHaveText(['Published', 'Update returned to you']);
    await expect(
      libraryRows(page).filter({ hasText: 'Boiler Drum Level' }).locator('.cm-stcell .xr-st'),
    ).toHaveText(['Published', 'Update on hold']);
    // The course filter narrows the view to one course; its chip; the address carries it.
    await main(page)
      .getByRole('combobox', { name: 'Course' })
      .selectOption('process-instrumentation-control');
    await expect(page).toHaveURL(/\?tab=published&course=process-instrumentation-control$/, {
      timeout: 60_000,
    });
    await expect(count).toHaveText('3 of 12 published');
    await expect(libraryRows(page)).toHaveCount(3);
    await expectTableLayout(page, main(page).locator('table.rk-table'));
    await checkState(page, 'Content library');
    await shot(page, '04b-lib-pub');
    await follow(
      page,
      main(page).getByRole('link', {
        name: /^Distillation Column, CHE ZG513, version 1\.2, published.*\. Open the published experiment$/,
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/published\/distillation-column$/, {
      timeout: 60_000,
    });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('CM-09 Platform course codes', () => {
  test('clean, a duplicate refused, a unique code saved, Undo changes', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/course-codes');
    await expect(heading(page, 'Course codes')).toBeVisible({ timeout: 90_000 });
    const field = (course: string) =>
      page.getByRole('textbox', { name: `Platform course code for ${course}` });
    const foot = main(page).locator('.cm-codes-foot [role="status"]');
    await expect(codeRows(page)).toHaveCount(6);
    await expect(main(page).locator('table.cm-codes tr.cm-area .cm-grp-name')).toHaveText([
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    await expect(field('Thermodynamics & Heat Transfer')).toHaveValue('ME ZG523');
    await expect(field('Fluid Mechanics')).toHaveValue('');
    await expect(codeRows(page).nth(2)).toContainText(
      'No code yet — the catalogue shows the course name only.',
    );
    await expect(foot).toHaveText('No unsaved changes');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/course-codes');
    await expectTableLayout(page, main(page).locator('table.cm-codes'));
    await checkState(page, 'Course codes');
    await shot(page, '09-codes');

    // Fluid Mechanics given ME ZG523: Save codes is refused, nothing saved.
    await field('Fluid Mechanics').click();
    await field('Fluid Mechanics').pressSequentially('ME ZG523');
    await expect(codeRows(page).nth(2).locator('.cm-tag')).toHaveText('Changed — not saved yet');
    await expect(foot).toHaveText('1 change not saved');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Save codes' }));
    const summary = main(page).locator('div.rk-errsum[role="alert"]');
    const words =
      'ME ZG523 is already the code for Thermodynamics & Heat Transfer. Each course needs its own code.';
    await expect(summary).toBeFocused();
    await expect(summary.locator('.rk-errsum-t')).toHaveText('Check the codes');
    await expect(summary.getByRole('link')).toHaveText(words);
    await expect(codeRows(page).nth(2).locator('.rk-ferr')).toHaveText(words);
    await expect(field('Fluid Mechanics')).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Course codes');
    await shot(page, '09b-codes-dup');
    // The summary link moves focus to the field (a wrapped inline link: Enter after focus).
    await summary.getByRole('link').focus();
    await page.keyboard.press('Enter');
    await expect(field('Fluid Mechanics')).toBeFocused();

    // A unique code instead: saved, said so, and kept as the platform’s code.
    await field('Fluid Mechanics').fill('');
    await field('Fluid Mechanics').pressSequentially('ME ZG541');
    await expect(codeRows(page).nth(2).locator('.rk-ferr')).toHaveCount(0);
    await reachAndClick(page, main(page).getByRole('button', { name: 'Save codes' }));
    const saved = main(page).locator('div.rk-notice--ok[role="status"]');
    await expect(saved.locator('.rk-notice-t')).toHaveText('Codes saved');
    await expect(saved.locator('.rk-notice-d')).toHaveText(
      /^\d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · the catalogue shows them from now on$/,
    );
    await expect(saved).toBeFocused();
    await expect(foot).toHaveText('No unsaved changes');
    await expect(field('Fluid Mechanics')).toHaveValue('ME ZG541');
    await expect(main(page).locator('.cm-tag')).toHaveCount(0);
    await checkState(page, 'Course codes');
    await shot(page, '09e-codes-saved');

    // Undo changes puts every typed code back.
    await field('Power Electronics').fill('');
    await expect(codeRows(page).nth(4)).toContainText(
      'No code yet — the catalogue shows the course name only.',
    );
    await expect(foot).toHaveText('1 change not saved');
    await checkState(page, 'Course codes');
    await shot(page, '09c-codes-edit');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Undo changes' }));
    await expect(field('Power Electronics')).toHaveValue('EEE ZG512');
    await expect(foot).toHaveText('No unsaved changes');
    await expect(field('Thermodynamics & Heat Transfer')).toBeFocused();
  });
});
