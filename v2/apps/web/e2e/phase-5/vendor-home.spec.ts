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
  sidebarLink,
} from '../support/workspace';

/**
 * VE-01 Overview and VE-02 My experiments in the owner-approved Vendor export's design (V3 Refined
 * B, design/v3-refined-b/roles/VE-v1 `Main.dc.html`) on the test-hook build at 1440, 1024, 768 and
 * 375. Each state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24
 * targets, no developer surface, no sideways scroll). World: spine-start as Anil Shetty (Northline
 * Simulation Studio). The CI seam only SETS UP the world — Flow E's SUB-0077 saved (and submitted)
 * through Anil's own port, as the editor would; Ritu Sharma for the calm state; a Vendor the Super
 * Admin registers for the first visit. Everything the screens do — the studio band's and Recent
 * activity's links, the status tabs (the address mirrors them), the search, “Changed in the last 7
 * days”, the sort, Clear filters, the row links and the Overview's actions — is done by real clicks
 * and typing; the pages they open may be other builders' (only their address and their one h1 are
 * asserted there).
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
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/ve-workspace/shots';

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

/** Flow E's SUB-0077 as the walk's E1 saves it. */
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
// VE-01.
const figures = (page: Page) =>
  main(page).locator('dl[aria-label="Your experiments at a glance"] dt');
const attention = (page: Page) => page.getByRole('region', { name: 'Needs your action' });
const activity = (page: Page) => page.getByRole('region', { name: 'Recent activity' });
const leadItem = (page: Page) => attention(page).locator('.rb-lead');
const items = (page: Page) => attention(page).locator('.vr-ai-list > li');
// VE-02.
const list = (page: Page) => page.getByRole('region', { name: 'Your experiments' });
const tools = (page: Page) => page.getByRole('search', { name: 'Search your experiments' });
const count = (page: Page) => tools(page).getByRole('status');
const search = (page: Page) =>
  tools(page).getByRole('searchbox', { name: 'Search by name, ID or course' });
const recent = (page: Page) =>
  tools(page).getByRole('checkbox', { name: 'Changed in the last 7 days' });
const tabs = (page: Page) => page.getByRole('group', { name: 'Show experiments by status' });
const tab = (page: Page, name: string) => tabs(page).getByRole('button', { name });
const toolsClear = (page: Page) => tools(page).getByRole('button', { name: 'Clear filters' });
const table = (page: Page) => list(page).getByRole('table');
const names = (page: Page) => table(page).locator('tbody a.vr-name');
const row = (page: Page, name: string) =>
  table(page)
    .locator('tbody tr')
    .filter({ has: page.locator('a.vr-name', { hasText: name }) });

/** A status tab, brought into view first where the row scrolls sideways (its focus walk moved it). */
async function chooseTab(page: Page, name: string): Promise<void> {
  const target = tab(page, name);
  await target.scrollIntoViewIfNeeded();
  await reachAndClick(page, target);
}

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

/**
 * Below 760 px of list width the table's rows become three-line cards, its head row hidden and
 * the last change labelled; the narrow sort shows instead of the head's.
 */
async function expectTableLayout(page: Page): Promise<void> {
  const listWidth = await list(page).evaluate((element) => element.clientWidth);
  const head = table(page).locator('thead');
  const label = table(page).locator('tbody tr').first().locator('.vr-datek');
  const narrowSort = tools(page).getByRole('button', { name: /^Sort: newest first/ });
  if (listWidth < 760) {
    await expect(head).toBeHidden();
    await expect(label).toBeVisible();
    await expect(narrowSort).toBeVisible();
  } else {
    await expect(head).toBeVisible();
    await expect(label).toBeHidden();
    await expect(narrowSort).toBeHidden();
  }
}

/** An action of another builder's page opened in the same tab: its address and its one h1. */
async function expectOpened(page: Page, address: RegExp, mark: string): Promise<void> {
  await expect(page).toHaveURL(address);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1, { timeout: 60_000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expectSameDocument(page, mark);
}

/** Back to a destination through the rail (the drawer below 1024 px). */
async function viaRail(page: Page, href: string, title: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await expect(heading(page, title)).toBeVisible({ timeout: 60_000 });
}

async function toMyExperiments(page: Page, total = '6 experiments'): Promise<void> {
  await viaRail(page, '/vendor/experiments', 'My experiments');
  await expect(count(page)).toHaveText(total);
}

test.describe('VE-01 Overview → VE-02 My experiments', () => {
  test('the overview, its links, the list, its tabs, search, 7-day filter, sort and row links', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Northline Simulation Studio')).toBeVisible({ timeout: 90_000 });
    await expect(attention(page)).toBeVisible();
    // The export's portfolio: Flow E's SUB-0077 with the Academic Reviewer.
    const id = await compositeWall(page, { submit: true });
    await expect(heading(page, 'Overview, Northline Simulation Studio')).toBeVisible();
    await expect(
      main(page).getByText('Your course: ME ZG523 · Thermodynamics & Heat Transfer'),
    ).toBeVisible();
    await expect(figures(page)).toHaveText(['With you', 'In review', 'Published', 'Read-only']);
    await expect(main(page).locator('dl .rb-fig-n')).toHaveText(['2', '2', '1', '1']);
    await expect(attention(page).locator('.rb-att-head .rb-note')).toHaveText('2 items');
    await expect(leadItem(page).locator('.rb-lead-t')).toHaveText('Forced Convection');
    await expect(leadItem(page).locator('blockquote')).toHaveText(REASON);
    await expect(leadItem(page).locator('li')).toHaveText([
      'AR · Device need',
      'AR · Install notes',
    ]);
    await expect(
      leadItem(page).getByRole('link', {
        name: 'Revise Forced Convection, returned by the Academic Reviewer',
      }),
    ).toHaveClass(/rb-btn--primary/);
    await expect(items(page)).toHaveCount(1);
    await expect(items(page).first()).toContainText('Pin Fin Efficiency');
    await expect(
      items(page).getByRole('link', { name: 'Finish the draft of Pin Fin Efficiency' }),
    ).not.toHaveClass(/rb-btn--primary/);
    await expect(main(page).locator('.rb-btn--primary')).toHaveCount(1);
    await expect(activity(page).locator('li')).toHaveCount(5);
    await expect(activity(page).locator('li').first()).toContainText(
      'Submitted for academic review',
    );
    await expect(activity(page).locator('li').first()).toContainText(
      'Conduction Through a Composite Wall',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/vendor');
    await shot(page, 'VE-01_overview');
    await checkState(page, 'Overview');

    // Recent activity's first row opens its record, in the same tab.
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      activity(page).getByRole('link', {
        name: /^Submitted for academic review, Conduction Through a Composite Wall, .*Open the experiment record$/,
      }),
    );
    await expectOpened(page, new RegExp(`/vendor/experiments/${id}$`), mark);
    await viaRail(page, '/vendor', 'Overview');

    // “Changed in the last 7 days” → VE-02 with the filter ticked: only SUB-0077 changed lately.
    await reachAndClick(
      page,
      activity(page).getByRole('link', { name: 'Changed in the last 7 days' }),
    );
    await expect(page).toHaveURL(/\/vendor\/experiments\?changed=last-7-days$/);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await expect(recent(page)).toBeChecked();
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await expect(names(page)).toHaveText(['Conduction Through a Composite Wall']);
    await expectSameDocument(page, mark);
    await reachAndClick(page, toolsClear(page));
    await expect(page).toHaveURL(/\/vendor\/experiments$/);
    await expect(recent(page)).not.toBeChecked();
    await expect(search(page)).toBeFocused();
    await viaRail(page, '/vendor', 'Overview');

    // See all your experiments → VE-02, unfiltered.
    await reachAndClick(
      page,
      activity(page).getByRole('link', { name: 'See all your experiments' }),
    );
    await expect(page).toHaveURL(/\/vendor\/experiments$/);
    await expect(heading(page, 'My experiments')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(count(page)).toHaveText('6 experiments');
    await expect(tabs(page).getByRole('button')).toHaveText([
      'All6',
      'Returned1',
      'Draft2',
      'With Academic Reviewer1',
      'With Content Manager1',
      'Published1',
    ]);
    await expect(tab(page, 'All, 6 experiments')).toHaveAttribute('aria-pressed', 'true');
    await expect(names(page)).toHaveText([
      'Conduction Through a Composite Wall',
      'Pin Fin Efficiency',
      'Forced Convection',
      'Transient Cooling',
      'Surface Roughness in Turning',
      'Fin-Tube Bundle',
    ]);
    await expect(row(page, 'Conduction Through a Composite Wall').locator('.vr-meta')).toHaveText(
      `${id} · ME ZG523`,
    );
    await expect(
      row(page, 'Conduction Through a Composite Wall').locator('.xr-st--info'),
    ).toHaveText('With Academic Reviewer');
    await expect(row(page, 'Conduction Through a Composite Wall').locator('.vr-stsub')).toHaveText(
      'Submitted today',
    );
    await expect(row(page, 'Forced Convection').locator('.xr-st--err')).toHaveText('Returned');
    await expect(row(page, 'Forced Convection').locator('.vr-stsub')).toHaveText(
      'By the Academic Reviewer on 24 Aug',
    );
    await expect(row(page, 'Pin Fin Efficiency').locator('.xr-st')).toHaveText('Draft');
    await expect(row(page, 'Transient Cooling').locator('.vr-stsub')).toHaveText(
      'Approved on 14 Aug',
    );
    await expect(row(page, 'Fin-Tube Bundle').locator('.xr-st--ok')).toHaveText('Published');
    await expect(row(page, 'Surface Roughness in Turning').locator('.xr-st--paused')).toHaveText(
      'Draft · read-only',
    );
    await expect(row(page, 'Surface Roughness in Turning').locator('.vr-meta')).toHaveText(
      'SUB-0083 · MEL ZG512',
    );
    await expect(row(page, 'Forced Convection').locator('.xr-fmt')).toHaveText(['WEB', 'AR']);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/vendor/experiments');
    await expectTableLayout(page);
    await shot(page, 'VE-02_list');
    await checkState(page, 'My experiments');

    // The Returned tab — the address mirrors it; one row, its Revise.
    await chooseTab(page, 'Returned, 1 experiment');
    await expect(page).toHaveURL(/\/vendor\/experiments\?status=returned$/);
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await expect(names(page)).toHaveText(['Forced Convection']);
    await expect(table(page).getByRole('link', { name: 'Revise Forced Convection' })).toBeVisible();
    await expect(toolsClear(page)).toBeVisible();
    await shot(page, 'VE-02_filtered-returned');
    await checkState(page, 'My experiments');
    await reachAndClick(page, toolsClear(page));
    await expect(page).toHaveURL(/\/vendor\/experiments$/);
    await expect(count(page)).toHaveText('6 experiments');
    await expect(tab(page, 'All, 6 experiments')).toHaveAttribute('aria-pressed', 'true');
    await expect(toolsClear(page)).toHaveCount(0);

    // No match — a search for something he never made; its Clear filters brings the rows back.
    await search(page).fill('Radiation');
    await expect(list(page).getByText('No experiments match')).toBeVisible();
    await expect(count(page)).toHaveText('0 of 6 experiments');
    await expect(list(page)).toContainText(
      'Try a different name, ID or course, or clear the filters.',
    );
    await shot(page, 'VE-02_nomatch');
    await checkState(page, 'My experiments');
    await reachAndClick(
      page,
      list(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(count(page)).toHaveText('6 experiments');
    await expect(search(page)).toHaveValue('');
    await expect(search(page)).toBeFocused();

    // The search: an id, then a course code.
    await search(page).pressSequentially('SUB-0081');
    await expect(names(page)).toHaveText(['Forced Convection']);
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await search(page).fill('MEL ZG512');
    await expect(names(page)).toHaveText(['Surface Roughness in Turning']);
    await search(page).fill('');
    await expect(count(page)).toHaveText('6 experiments');

    // “Changed in the last 7 days” on the sample clock: only SUB-0077, saved today.
    await reachAndClick(page, recent(page));
    await expect(recent(page)).toBeChecked();
    await expect(page).toHaveURL(/\/vendor\/experiments\?changed=last-7-days$/);
    await expect(count(page)).toHaveText('1 of 6 experiments');
    await expect(names(page)).toHaveText(['Conduction Through a Composite Wall']);
    await checkState(page, 'My experiments');
    await reachAndClick(page, recent(page));
    await expect(count(page)).toHaveText('6 experiments');

    // The visible sort: oldest first, then back.
    const sortButton =
      (await list(page).evaluate((element) => element.clientWidth)) < 760
        ? tools(page).getByRole('button', { name: /^Sort: newest first/ })
        : table(page).getByRole('button', { name: 'Last change, newest first. Change order' });
    await reachAndClick(page, sortButton);
    await expect(names(page).first()).toHaveText('Fin-Tube Bundle');
    await expect(names(page).last()).toHaveText('Conduction Through a Composite Wall');
    await reachAndClick(
      page,
      (await list(page).evaluate((element) => element.clientWidth)) < 760
        ? tools(page).getByRole('button', { name: /^Sort: oldest first/ })
        : table(page).getByRole('button', { name: 'Last change, oldest first. Change order' }),
    );
    await expect(names(page).first()).toHaveText('Conduction Through a Composite Wall');

    // The row links open the built pages, in the same tab.
    await reachAndClick(page, table(page).getByRole('link', { name: 'Revise Forced Convection' }));
    await expectOpened(page, /\/vendor\/experiments\/SUB-0081\/revise$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: 'Edit the draft of Pin Fin Efficiency' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0079\/edit$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: /^Transient Cooling, SUB-0074,/ }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0074$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: /^Surface Roughness in Turning, SUB-0083,/ }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0083$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      table(page).getByRole('link', { name: /^Fin-Tube Bundle, SUB-0052,/ }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0052$/, mark);
    await toMyExperiments(page);
    await reachAndClick(
      page,
      main(page).locator('.rk-head-act').getByRole('link', { name: 'Create experiment' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });

  test('a new draft on the Overview and the list; Revise, Finish draft and Create from the Overview', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Northline Simulation Studio')).toBeVisible({ timeout: 90_000 });
    await expect(attention(page)).toBeVisible();
    const id = await compositeWall(page, { step: 'formats' });
    await expect(attention(page).locator('.rb-att-head .rb-note')).toHaveText('3 items');
    await expect(main(page).locator('dl .rb-fig-s').first()).toHaveText('1 returned · 2 drafts');
    await expect(items(page).locator('.rb-ai-t')).toHaveText([
      'Draft to finishConduction Through a Composite Wall',
      'Draft to finishPin Fin Efficiency',
    ]);
    await checkState(page, 'Overview');

    const mark = await markDocument(page);
    await reachAndClick(
      page,
      leadItem(page).getByRole('link', {
        name: 'Revise Forced Convection, returned by the Academic Reviewer',
      }),
    );
    await expectOpened(page, /\/vendor\/experiments\/SUB-0081\/revise$/, mark);
    await viaRail(page, '/vendor', 'Overview');
    // The new draft's Finish draft opens the step it reached.
    await reachAndClick(
      page,
      items(page).getByRole('link', {
        name: 'Finish the draft of Conduction Through a Composite Wall',
      }),
    );
    await expectOpened(page, new RegExp(`/vendor/experiments/${id}/edit\\?step=formats$`), mark);
    await viaRail(page, '/vendor', 'Overview');
    await reachAndClick(
      page,
      main(page).locator('.rb-id-act').getByRole('link', { name: 'Create experiment' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);

    // The list: the new draft is “Draft” with “Edit draft” at its step.
    await toMyExperiments(page);
    const draft = row(page, 'Conduction Through a Composite Wall');
    await expect(draft.locator('.xr-st')).toHaveText('Draft');
    await expect(draft.locator('.vr-stsub')).toHaveText(
      'Saved at step 2 of 4 · only you can see it',
    );
    await expect(
      draft.getByRole('link', { name: 'Edit the draft of Conduction Through a Composite Wall' }),
    ).toHaveAttribute('href', `/vendor/experiments/${id}/edit?step=formats`);
    await checkState(page, 'My experiments');
  });

  test('calm: nothing needs Ritu Sharma', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: RITU });
    await page.goto('/vendor');
    await expect(heading(page, 'Meridian Virtual Labs')).toBeVisible({ timeout: 90_000 });
    await expect(attention(page).getByText('Nothing needs you right now')).toBeVisible();
    await expect(attention(page).locator('.rb-att-head .rb-note')).toHaveText('Nothing waiting');
    await expect(figures(page)).toHaveCount(3);
    await expect(main(page).locator('.rb-btn--primary')).toHaveCount(0);
    await shot(page, 'VE-01_calm');
    await checkState(page, 'Overview');
    // The band's Create experiment opens the editor.
    const mark = await markDocument(page);
    await reachAndClick(
      page,
      main(page).locator('.rb-id-act').getByRole('link', { name: 'Create experiment' }),
    );
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });

  test('first visit: Create your first experiment, and My experiments empty', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: ANIL });
    await page.goto('/vendor');
    await expect(heading(page, 'Northline Simulation Studio')).toBeVisible({ timeout: 90_000 });
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
    const first = page.getByRole('region', { name: 'Create your first experiment' });
    await expect(first).toBeVisible({ timeout: 60_000 });
    await expect(figures(page)).toHaveCount(0);
    await expect(attention(page)).toHaveCount(0);
    await expect(first.getByRole('link', { name: 'Create experiment' })).toHaveClass(
      /rb-btn--primary/,
    );
    await shot(page, 'VE-01_first-visit');
    await checkState(page, 'Overview');

    await viaRail(page, '/vendor/experiments', 'My experiments');
    const empty = main(page).getByRole('heading', {
      level: 2,
      name: 'You haven’t created an experiment yet',
    });
    await expect(empty).toBeVisible();
    await expect(tools(page)).toHaveCount(0);
    await expect(tabs(page)).toHaveCount(0);
    await shot(page, 'VE-02_empty');
    await checkState(page, 'My experiments');
    await reachAndClick(page, list(page).getByRole('link', { name: 'Create experiment' }));
    await expectOpened(page, /\/vendor\/experiments\/new$/, mark);
  });
});
