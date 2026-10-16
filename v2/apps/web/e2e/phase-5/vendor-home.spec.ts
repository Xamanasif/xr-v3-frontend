import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState as checkScreen } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';

/**
 * VE-01 Overview (board B5-01 f0 … f3; B5-08 f1) and VE-02 My experiments (B5-02 f0 … f5; B5-08
 * f3) on the test-hook build at 1440, 1024, 768 and 375. Each drawn state passes `checkState`
 * (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no
 * sideways scroll). World: spine-start as Anil Shetty (Northline Simulation Studio). The CI seam
 * only SETS UP the world — Flow E's SUB-0077 saved (and submitted) through Anil's own port, as the
 * editor would; Ritu Sharma for “Nothing needs you”; a Vendor the Super Admin registers for the
 * first visit. Everything the screens do — See all your experiments, the Status filter (the
 * address mirrors it), the search, “Changed in the last 7 days”, Clear filters, the row links and
 * the Overview's actions — is done by real clicks and typing; the pages they open may be other
 * builders' (only their address and their one h1 are asserted there).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ANIL = { personId: 'per-anil-shetty' };
const RITU = { personId: 'per-ritu-sharma' };
const ARJUN = { personId: 'sa-arjun-mehta' };
const THERMO = 'thermodynamics-heat-transfer';
const REASON =
  'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.';

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/5ecc5525-e260-4938-9ed0-61e1898a71eb/scratchpad/shots-product/vendor-home';

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

/** Flow E's SUB-0077 as the walk's E1 saves it (B5-03 … B5-05). */
const COMPOSITE_WALL = {
  courseId: THERMO,
  name: 'Conduction Through a Composite Wall',
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
      browserAndComputer: 'A current Chrome, Edge, Firefox or Safari on a laptop or desktop',
      notes: null,
    },
    vr: {
      format: 'vr',
      packageLabel: 'Composite Wall — VR build 1.0',
      packageReference: null,
      packageFileName: 'composite-wall-vr-1.0.zip',
      deviceNeeded: 'VR headset',
      installNotes: 'Install the build named above on the headset and open “Composite Wall Lab”.',
      notes: null,
    },
  },
  preview: { label: null, link: null },
  documents: [],
};

/** Anil saves SUB-0077 (set-up: the editor's first save mints it), at a step, and maybe submits. */
async function compositeWall(
  page: Page,
  options: { readonly step?: 'course' | 'formats'; readonly submit?: boolean } = {},
): Promise<string> {
  const saved = await port<{ readonly id: string; readonly rev: number }>(
    page,
    ANIL,
    'production',
    'saveDraft',
    { id: null, content: COMPOSITE_WALL, step: options.step ?? 'course', expectedRev: null },
  );
  if (options.submit) {
    await port(page, ANIL, 'production', 'submitForReview', {
      id: saved.id,
      content: COMPOSITE_WALL,
      expectedRev: saved.rev,
    });
  }
  return saved.id;
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const statusLine = (page: Page) => main(page).locator('p.xv-statusline > span');
const attention = (page: Page) => page.getByRole('region', { name: 'Needs your action' });
const list = (page: Page) => page.getByRole('region', { name: 'All your experiments' });
const count = (page: Page) => main(page).locator('.xr-toolbar-status [role="status"]');
const table = (page: Page) => main(page).locator('table.xr-table');
const names = (page: Page) => table(page).locator('tbody td.is-primary strong');
const search = (page: Page) => page.getByRole('searchbox', { name: 'Search your experiments' });
const statusFilter = (page: Page) => page.getByRole('combobox', { name: 'Status' });
const recent = (page: Page) => page.getByRole('checkbox', { name: 'Changed in the last 7 days' });
const toolbarClear = (page: Page) =>
  main(page).locator('.xr-toolbar-status').getByRole('button', { name: 'Clear filters' });

/**
 * `checkState`, once the dev server's “Compiling …” indicator (a page of another suite compiling on
 * the shared test-hook server) has gone: while it shows, its button takes the first Tab stop in
 * Next.js's portal and the focus walk finds none — a dev-server artefact, never the product's.
 */
async function checkState(page: Page, title: string): Promise<void> {
  await expect(page.getByText('Compiling', { exact: false })).toHaveCount(0, { timeout: 90_000 });
  await checkScreen(page, title);
}

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  // The pointer off the page, so no row is drawn in its hover tint.
  await page.mouse.move(0, 0);
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A board frame drawn at another width than the project's: the shot at that width, then back. */
async function shotAt(page: Page, frameWidth: number, name: string): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  await page.setViewportSize({ width: frameWidth, height: 760 });
  await checkState(page, (await page.getByRole('heading', { level: 1 }).textContent()) ?? '');
  await shot(page, name);
  await page.setViewportSize(viewport);
}

/** Below 760 px of content the table's rows stack and its header row is hidden (B5-02 f4, f5). */
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

/** An action of another builder's page opened in the same tab: its address and its one h1. */
async function expectOpened(page: Page, address: RegExp, mark: string): Promise<void> {
  await expect(page).toHaveURL(address);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectSameDocument(page, mark);
}

/** Back to My experiments through the sidebar (the drawer below 1024 px). */
async function toMyExperiments(page: Page): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'Vendor navigation' }).getByRole('link', {
      name: 'My experiments',
    }),
  );
  await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
  await expect(count(page)).toHaveText('6 of 6 experiments');
}

test.describe('VE-01 Overview → VE-02 My experiments', () => {
  test('the overview as f0 / f3, See all, the list as f0 / f4 / f5, its filters, search, checkbox and row links', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    await expect(attention(page)).toBeVisible();
    // B5-01 f0's world: Flow E's SUB-0077 with the Academic Reviewer.
    const id = await compositeWall(page, { submit: true });
    await expect(statusLine(page)).toHaveText([
      '2 Draft',
      '1 With Academic Reviewer',
      '1 With Content Manager',
      '1 Published',
    ]);
    await expect(main(page).locator('.xr-overline')).toHaveText('Northline Simulation Studio');
    await expect(attention(page).locator('.xr-section-head .xr-meta')).toHaveText('2 items');
    await expect(attention(page).locator('.xr-row-title')).toHaveText([
      'Returned: Forced Convection',
      'Draft to finish: Pin Fin Efficiency',
    ]);
    await expect(attention(page).locator('.xr-row-sub')).toHaveText([
      `Academic Reviewer · 24 Aug 2026 · “${REASON}”`,
      'Last saved 25 Aug 2026 · only you can see it',
    ]);
    await expect(
      attention(page).getByRole('link', { name: 'Revise “Forced Convection”' }),
    ).toHaveClass(/xr-btn--primary/);
    await expect(attention(page).getByRole('link', { name: 'Finish draft' })).toHaveClass(
      /xr-btn--secondary/,
    );
    await expect(main(page).getByRole('link', { name: 'Create experiment' })).toHaveClass(
      /xr-btn--secondary/,
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/vendor');
    await checkState(page, 'Overview');
    if (width(page) === 1440) await shot(page, 'B5-01-f0');
    if (width(page) === 375) await shot(page, 'B5-01-f3');

    // See all your experiments → VE-02, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'See all your experiments' }));
    await expect(page).toHaveURL(/\/vendor\/experiments$/);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(count(page)).toHaveText('6 of 6 experiments');
    await expect(names(page)).toHaveText([
      'Conduction Through a Composite Wall',
      'Pin Fin Efficiency',
      'Forced Convection',
      'Transient Cooling',
      'Surface Roughness in Turning',
      'Fin-Tube Bundle',
    ]);
    const row = (name: string) =>
      table(page)
        .locator('tbody tr')
        .filter({ has: page.locator('td.is-primary strong', { hasText: name }) });
    await expect(
      row('Conduction Through a Composite Wall').locator('td.is-primary .xr-meta'),
    ).toHaveText(`${id} · ME ZG523`);
    await expect(row('Conduction Through a Composite Wall').locator('.xr-status--wait')).toHaveText(
      'With Academic Reviewer',
    );
    await expect(row('Forced Convection').locator('.xr-status--err')).toHaveText('Returned');
    await expect(row('Forced Convection').locator('td[data-label="With"]')).toHaveText('You');
    await expect(row('Pin Fin Efficiency').locator('.xr-status--off')).toHaveText('Draft');
    await expect(row('Transient Cooling').locator('td[data-label="With"]')).toHaveText(
      'Content Manager',
    );
    await expect(row('Fin-Tube Bundle').locator('.xr-status--ok')).toHaveText('Published');
    await expect(row('Surface Roughness in Turning').locator('.xr-status--paused')).toHaveText(
      'Draft · read-only',
    );
    await expect(row('Surface Roughness in Turning').locator('td.is-primary .xr-meta')).toHaveText(
      'SUB-0083 · MEL ZG512',
    );
    await expect(row('Forced Convection').locator('.xr-fmt')).toHaveText(['WEB', 'AR']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/vendor/experiments');
    await expectTableLayout(page);
    await checkState(page, 'My experiments');
    if (width(page) === 1440) await shot(page, 'B5-02-f0');
    if (width(page) === 768) await shot(page, 'B5-02-f5');
    if (width(page) === 375) await shot(page, 'B5-02-f4');

    // f1 Filtered: Returned — the address mirrors it; one row, Revise its primary.
    await statusFilter(page).selectOption('returned');
    await expect(page).toHaveURL(/\/vendor\/experiments\?status=returned$/);
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await expect(names(page)).toHaveText(['Forced Convection']);
    await expect(table(page).getByRole('link', { name: 'Revise Forced Convection' })).toHaveClass(
      /xr-btn--primary/,
    );
    await expect(toolbarClear(page)).toBeVisible();
    await checkState(page, 'My experiments');
    if (width(page) === 1440) await shotAt(page, 1080, 'B5-02-f1');
    await reachAndClick(page, toolbarClear(page));
    await expect(page).toHaveURL(/\/vendor\/experiments$/);
    await expect(count(page)).toHaveText('6 of 6 experiments');
    await expect(statusFilter(page)).toHaveValue('all');
    await expect(toolbarClear(page)).toHaveCount(0);

    // f2 No match — a search for something he never made; Clear filters brings the rows back.
    await search(page).fill('Radiation');
    const noMatch = main(page).getByRole('heading', { level: 3, name: 'No experiments match' });
    await expect(noMatch).toBeVisible();
    await expect(count(page)).toHaveText('0 of 6 experiments');
    await expect(main(page)).toContainText('Try a different name, or clear the filters.');
    await checkState(page, 'My experiments');
    if (width(page) === 1440) await shotAt(page, 1080, 'B5-02-f2');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(count(page)).toHaveText('6 of 6 experiments');
    await expect(search(page)).toHaveValue('');
    await expect(search(page)).toBeFocused();

    // The search: an id, then a course code.
    await search(page).pressSequentially('SUB-0081');
    await expect(names(page)).toHaveText(['Forced Convection']);
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await search(page).fill('MEL ZG512');
    await expect(names(page)).toHaveText(['Surface Roughness in Turning']);
    await search(page).fill('');
    await expect(count(page)).toHaveText('6 of 6 experiments');

    // “Changed in the last 7 days” on the sample clock: only SUB-0077, saved today.
    await reachAndClick(page, recent(page));
    await expect(recent(page)).toBeChecked();
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await expect(names(page)).toHaveText(['Conduction Through a Composite Wall']);
    await expect(toolbarClear(page)).toBeVisible();
    await checkState(page, 'My experiments');
    await reachAndClick(page, recent(page));
    await expect(count(page)).toHaveText('6 of 6 experiments');

    // The row links open the built pages, in the same tab.
    await reachAndClick(page, table(page).getByRole('link', { name: 'Revise Forced Convection' }));
    await expectOpened(page, /\/vendor\/experiments\/SUB-0081\/revise$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: 'Edit draft Pin Fin Efficiency' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0079\/edit$/, mark);
    await toMyExperiments(page);
    await reachAndClick(page, table(page).getByRole('link', { name: 'Open Transient Cooling' }));
    await expectOpened(page, /\/vendor\/experiments\/SUB-0074$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: 'Open Surface Roughness in Turning' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0083$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: 'Fin-Tube Bundle', exact: true }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0052$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      main(page).locator('.xr-phead-actions').getByRole('link', {
        name: 'Create experiment',
      }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });

  test('B5-08 f1 / f3: a new draft on the Overview and the list; Revise, Finish draft and Create from the Overview', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    await expect(attention(page)).toBeVisible();
    const id = await compositeWall(page, { step: 'formats' });
    await expect(attention(page).locator('.xr-section-head .xr-meta')).toHaveText('3 items');
    await expect(statusLine(page)).toHaveText([
      '3 Draft',
      '0 With Academic Reviewer',
      '1 With Content Manager',
      '1 Published',
    ]);
    await expect(attention(page).locator('.xr-row-title')).toHaveText([
      'Returned: Forced Convection',
      'Draft to finish: Pin Fin Efficiency',
      'Draft to finish: Conduction Through a Composite Wall',
    ]);
    await checkState(page, 'Overview');
    if (width(page) === 768) await shotAt(page, 720, 'B5-08-f1');

    const mark = await markDocument(page);
    await reachAndClick(
      page,
      attention(page).getByRole('link', { name: 'Revise “Forced Convection”' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0081\/revise$/, mark);
    await revealSidebar(page);
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Vendor navigation' }).getByRole('link', {
        name: 'Overview',
      }),
    );
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 60_000 });
    // The new draft's Finish draft opens the step it reached.
    await reachAndClick(page, attention(page).getByRole('link', { name: 'Finish draft' }).nth(1));
    await expectOpened(page, new RegExp(`/vendor/experiments/${id}/edit\\?step=formats$`), mark);

    // B5-08 f3: the list — the new draft is “Draft”, “You”, “Edit draft”.
    await toMyExperiments(page);
    const row = table(page)
      .locator('tbody tr')
      .filter({ has: page.locator('td.is-primary strong', { hasText: 'Conduction Through' }) });
    await expect(row.locator('.xr-status--off')).toHaveText('Draft');
    await expect(row.locator('td[data-label="With"]')).toHaveText('You');
    await expect(
      row.getByRole('link', { name: 'Edit draft Conduction Through a Composite Wall' }),
    ).toHaveAttribute('href', `/vendor/experiments/${id}/edit?step=formats`);
    await checkState(page, 'My experiments');
    if (width(page) === 1440) await shot(page, 'B5-08-f3');
  });

  test('B5-01 f1 “Nothing needs you” (Ritu Sharma)', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: RITU });
    await page.goto('/vendor');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const calm = main(page).getByRole('heading', { level: 2, name: 'Nothing needs you right now' });
    await expect(calm).toBeVisible();
    await expect(main(page).locator('.xr-overline')).toHaveText('Meridian Virtual Labs');
    await expect(statusLine(page)).toHaveCount(4);
    await expect(attention(page)).toHaveCount(0);
    await expect(main(page).locator('.xr-btn--primary')).toHaveCount(0);
    await checkState(page, 'Overview');
    if (width(page) === 768) await shotAt(page, 720, 'B5-01-f1');
    // Its Create experiment opens the editor.
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('link', { name: 'Create experiment' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });

  test('first visit: B5-01 f2 (Create your first experiment) and B5-02 f3 (empty)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    // Set-up: the Super Admin registers a Vendor (SA-16) and this tab signs in as them.
    const holder = await port<{ readonly personId: string }>(
      page,
      ARJUN,
      'platformRoles',
      'registerHolder',
      {
        role: 'vendor',
        name: 'Kiran Rao',
        workEmail: 'kiran.rao@northline.example',
        organisation: 'Northline Simulation Studio',
      },
    );
    const mark = await markDocument(page);
    await switchIdentity(page, holder);
    const first = main(page).getByRole('heading', {
      level: 2,
      name: 'Create your first experiment',
    });
    await expect(first).toBeVisible({ timeout: 60_000 });
    await expect(statusLine(page)).toHaveCount(0);
    await expect(
      main(page).locator('.xr-empty').getByRole('link', { name: 'Create experiment' }),
    ).toHaveClass(/xr-btn--primary/);
    await checkState(page, 'Overview');
    if (width(page) === 768) await shotAt(page, 720, 'B5-01-f2');

    await reachAndClick(page, main(page).getByRole('link', { name: 'See all your experiments' }));
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    const empty = main(page).getByRole('heading', {
      level: 2,
      name: 'You haven’t created an experiment yet',
    });
    await expect(empty).toBeVisible();
    await expect(list(page)).toHaveCount(0);
    await checkState(page, 'My experiments');
    if (width(page) === 768) await shotAt(page, 720, 'B5-02-f3');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('link', { name: 'Create experiment' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });
});
