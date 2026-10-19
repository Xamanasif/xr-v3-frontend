import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
  sidebarLink,
  SUPER_ADMIN,
} from '../support/workspace';

/**
 * SA-01 Overview in full, SA-12 All content and SA-13 Content record in the V3 Refined B design
 * (the owner-approved Super Admin export, design/v3-refined-b/roles/SA-v1 `V.overview`,
 * `V.allContent`, `V.record`), on the test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta.
 * Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24
 * targets, no developer surface, no sideways scroll); no reference is shown on SA-12 or SA-13. The
 * CI seam only SETS UP the world (the calm Overview: requests asked for information, reports
 * resolved, an Institute Admin assigned, a reviewer given EEE ZC341) and reads the services for
 * the cross-role proofs. Everything the screens do — the Overview's links, the status filter,
 * "Show stuck records", the search and Clear filters, the records' links and the override (a
 * reason required, then its confirmation) — is done by real clicks and typing.
 *
 * Cross-role: the Overview agrees with the lists it opens (Requests → SA-02's rows under review;
 * Stuck content → SA-12's Stuck status and the SA-13 record), and the override on the stuck
 * DC Motor Speed Control moves it back to the vendor: it leaves the Stuck status and the
 * Overview's Stuck content group, and the Vendor's own record reads returned.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ARJUN = SUPER_ADMIN;
const RITU = { personId: 'per-ritu-sharma' };

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/sa-content/spec-shots/content-oversight';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam (set-up or a read), which must succeed. */
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

interface Group {
  readonly count: number;
  readonly rows: readonly unknown[];
}
interface OverviewAnswer {
  readonly figures: {
    readonly activeInstitutions: number;
    readonly paused: number;
    readonly awaitingPayment: number;
    readonly publishedExperiments: number;
  };
  readonly requests: Group;
  readonly updates: Group;
  readonly deviceTransfers: Group;
  readonly support: Group;
  readonly accessEnding: Group;
  readonly institutionsWithoutAdmin: Group;
  readonly stuckContent: Group;
  readonly holdersWithoutScope: Group;
}

/** The service's eight groups: the Overview's “All” counts each of their items once. */
const GROUPS = [
  'requests',
  'updates',
  'deviceTransfers',
  'support',
  'accessEnding',
  'institutionsWithoutAdmin',
  'stuckContent',
  'holdersWithoutScope',
] as const;

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
/** An Overview group (`section.rb-g`, named by its heading). */
const group = (page: Page, title: string) =>
  main(page).getByRole('region', { name: title, exact: true });
const tableRows = (page: Page) => main(page).locator('table.rk-table tbody tr');
const rowNamed = (page: Page, name: string) =>
  tableRows(page).filter({
    has: page.locator('a.rk-rowlink', { hasText: new RegExp(`^${name}$`) }),
  });
const countStatus = (page: Page) => main(page).locator('.rk-statusline [role="status"]');
const statusFilter = (page: Page) => page.getByRole('combobox', { name: 'Workflow status' });
const overridePanel = (page: Page) =>
  page.getByRole('complementary', { name: 'Move status (override)' });
const meta = (page: Page) => main(page).locator('.rk-head .rk-meta');
const history = (page: Page) => main(page).locator('ol.rk-tl > li');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

async function open(page: Page, fixture: string, path: string, title: string): Promise<void> {
  await bootWorld(page, { fixture, session: ARJUN });
  await page.goto(path);
  await expect(heading(page, title)).toBeVisible({ timeout: 90_000 });
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

/** The rail's destination, reached and pressed (the Menu drawer opened below 1024 px). */
async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
}

/** Waits for the page's CSS animations and transitions (a dialog fading in) to finish. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished.catch(() => null))),
  );
}

/** No reference in the page's words or the names of its controls (HANDOFF “Internal references”). */
async function expectNoReferences(page: Page): Promise<void> {
  const reference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
  expect(await main(page).innerText()).not.toMatch(reference);
  const names = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(reference);
}

test.describe('SA-01 Overview', () => {
  test('the figures, the switch and the groups agree with the lists they open', async ({
    page,
  }) => {
    await open(page, 'after-flow-e', '/admin', 'Overview');
    await expect(group(page, 'Requests')).toBeVisible();
    const overview = await port<OverviewAnswer>(page, ARJUN, 'operations', 'getSuperAdminOverview');
    const items = GROUPS.reduce((sum, key) => sum + overview[key].count, 0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin');
    await expect(main(page).locator('dl.rb-figs > div')).toHaveText([
      new RegExp(
        `Active institutions\\s*${overview.figures.activeInstitutions}\\s*Access active or ending soon\\. ${overview.figures.paused} paused, ${overview.figures.awaitingPayment} awaiting payment\\.`,
      ),
      new RegExp(
        `Published experiments\\s*${overview.figures.publishedExperiments}\\s*Live in the catalogue today`,
      ),
    ]);
    // The switch's “All” counts every item once, as the service counts them.
    await expect(
      page.getByRole('group', { name: 'Show what is waiting' }).getByRole('button').first(),
    ).toHaveText(new RegExp(`^All\\s*${items}$`));
    await checkState(page, 'Overview');
    await shot(page, 'sa01-overview');

    const mark = await markDocument(page);
    // Requests → SA-02: as many requests under review as the service counts.
    await follow(page, group(page, 'Requests').getByRole('link', { name: 'Open Requests' }));
    await page.waitForURL('**/admin/requests');
    await expect(heading(page, 'Requests')).toBeVisible({ timeout: 60_000 });
    await expect(
      main(page)
        .locator('tbody tr')
        .filter({ has: page.locator('.xr-st', { hasText: /^Under review$/ }) }),
    ).toHaveCount(overview.requests.count);
    await page.goBack();
    await expect(group(page, 'Requests')).toBeVisible({ timeout: 60_000 });

    // A request row opens its decision (SA-03).
    await follow(
      page,
      group(page, 'Requests').getByRole('link', {
        name: 'Open the additional licences request from Konark Polytechnic',
      }),
    );
    await page.waitForURL('**/admin/requests/REQ-0040');
    await expect(heading(page, 'Konark Polytechnic')).toBeVisible({ timeout: 60_000 });
    await page.goBack();

    // Stuck content → SA-12, whose Stuck status holds as many; the row opens the record (SA-13).
    const stuck = group(page, 'Stuck content');
    await expect(stuck).toBeVisible({ timeout: 60_000 });
    await follow(page, stuck.getByRole('link', { name: 'Open All content' }));
    await page.waitForURL('**/admin/content/all');
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 60_000 });
    await expect(statusFilter(page).locator('option[value="stuck"]')).toHaveText(
      `Stuck — nobody can act (${overview.stuckContent.count})`,
      { timeout: 60_000 },
    );
    await page.goBack();
    await follow(
      page,
      group(page, 'Stuck content').getByRole('link', {
        name: 'Open DC Motor Speed Control in All content',
      }),
    );
    await page.waitForURL('**/admin/content/records/SUB-0085');
    await expect(heading(page, 'DC Motor Speed Control')).toBeVisible({ timeout: 60_000 });
    await page.goBack();

    // The other items open the pages where they are handled.
    await expect(group(page, 'Requests')).toBeVisible({ timeout: 60_000 });
    const targets: readonly (readonly [string, RegExp])[] = [
      ['Review the Distillation Column correction', /\/admin\/content\/updates\/UPD-0005$/],
      ['Review the VR device transfer for Rahul Verma', /\/device-transfers\/DTR-0018$/],
      [
        'Assign an Institute Admin to Sahyadri Institute of Engineering',
        /\/admin\/institutions\/sahyadri$/,
      ],
      ['Assign scope to Dr K. Iyer', /\/admin\/roles\/role-0001$/],
      ['View access ending for Konark Polytechnic', /\/admin\/operations\/access-ending$/],
    ];
    for (const [name, address] of targets) {
      await expect(main(page).getByRole('link', { name }).first()).toHaveAttribute('href', address);
    }
    await follow(
      page,
      main(page).getByRole('link', { name: 'Review the Distillation Column correction' }),
    );
    await page.waitForURL('**/admin/content/updates/UPD-0005');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('nothing waiting: the calm state, the two figures kept', async ({ page }) => {
    await open(page, 'state-coverage', '/admin', 'Overview');
    await expect(group(page, 'Requests')).toBeVisible();
    // Set-up: everything waiting is dealt with elsewhere (each through its own service).
    for (const reference of ['REQ-0058', 'REQ-0040', 'REQ-0038']) {
      const view = await port<{ readonly request: { readonly id: string; readonly rev: number } }>(
        page,
        ARJUN,
        'accessRequests',
        'getRequestForDecision',
        reference,
      );
      await port(page, ARJUN, 'accessRequests', 'requestMoreInformation', {
        id: view.request.id,
        reason: 'Please confirm the student numbers.',
        expectedRev: view.request.rev,
      });
    }
    for (const id of ['SUP-0207', 'SUP-0213']) {
      const report = await port<{ readonly rev: number }>(
        page,
        ARJUN,
        'operations',
        'getMyReport',
        id,
      );
      await port(page, ARJUN, 'operations', 'resolveReport', {
        id,
        note: 'Fixed in the next build.',
        expectedRev: report.rev,
      });
    }
    const sahyadri = await port<{ readonly institution: { readonly rev: number } }>(
      page,
      ARJUN,
      'institutions',
      'getInstitution',
      'sahyadri',
    );
    await port(page, ARJUN, 'institutions', 'assignInstituteAdmin', {
      institutionId: 'sahyadri',
      name: 'Asha Rao',
      workEmail: 'asha.rao@sahyadri.example',
      expectedRev: sahyadri.institution.rev,
    });
    const holder = await port<{ readonly holder: { readonly rev: number } }>(
      page,
      ARJUN,
      'platformRoles',
      'getHolder',
      'role-0001',
    );
    await port(page, ARJUN, 'platformRoles', 'assignScope', {
      holderId: 'role-0001',
      target: { kind: 'course', courseId: 'electrical-machines' },
      expectedRev: holder.holder.rev,
    });

    const calm = page.getByRole('region', { name: 'Nothing is waiting' });
    await expect(calm).toBeVisible({ timeout: 60_000 });
    await expect(calm.locator('.rb-calm-d')).toHaveText(
      'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.',
    );
    await expect(main(page).locator('dl.rb-figs > div')).toHaveCount(2);
    await expect(main(page).locator('section.rb-g')).toHaveCount(0);
    await settle(page);
    await checkState(page, 'Overview');
    await shot(page, 'sa01-calm');
  });
});

test.describe('SA-12 All content', () => {
  test('the notices, the status filter, Show stuck records, the search and no match', async ({
    page,
  }) => {
    await open(page, 'after-flow-e', '/admin/content/all', 'Content');
    await expect(tableRows(page)).toHaveCount(19, { timeout: 60_000 });
    await expect(statusFilter(page).locator('option')).toHaveText([
      'All statuses (19)',
      'Published (13)',
      'With the Academic Reviewer (2)',
      'With the Content Manager (2)',
      'Returned to the vendor (1)',
      'Stuck — nobody can act (1)',
    ]);
    await expect(countStatus(page)).toHaveText('19 records · read-only');
    const notices = main(page).locator('.rk-notice');
    await expect(notices.nth(0)).toContainText('1 record stuck — nobody can act');
    await expect(notices.nth(0)).toContainText(
      'DC Motor Speed Control (EEE ZC341). Open the record to see why.',
    );
    await expect(notices.nth(1)).toContainText('A correction is waiting for your release decision');
    await expect(notices.nth(1)).toContainText('Distillation Column 1.2 → 1.3.');
    await expect(notices.nth(1).getByRole('link', { name: 'Open Updates' })).toHaveAttribute(
      'href',
      '/admin/content/updates',
    );
    await expect(
      page.getByRole('navigation', { name: 'Content' }).getByRole('link', { name: 'All content' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(rowNamed(page, 'Distillation Column')).toContainText(
      'Correction waiting for your release decision',
    );
    await expect(rowNamed(page, 'Induction Motor Loading')).not.toContainText('Correction');
    await expect(rowNamed(page, 'DC Motor Speed Control').locator('.xr-st--err')).toHaveText(
      'Stuck — nobody can act',
    );
    await expectNoReferences(page);
    await checkState(page, 'Content');
    await shot(page, 'sa12-all-content');

    // "Show stuck records" sets the filter to Stuck (focus on it) and the address says so.
    await reachAndClick(page, page.getByRole('button', { name: 'Show stuck records' }));
    await expect(statusFilter(page)).toHaveValue('stuck');
    await expect(statusFilter(page)).toBeFocused();
    await expect(tableRows(page)).toHaveCount(1);
    await expect(countStatus(page)).toHaveText('1 of 19 records · read-only');
    await page.waitForURL(/\/admin\/content\/all\?show=stuck$/);
    await statusFilter(page).selectOption('review');
    await expect(tableRows(page)).toHaveCount(2);
    await statusFilter(page).selectOption('all');
    await expect(tableRows(page)).toHaveCount(19);

    // No match: the count, the empty state and one way back.
    const search = page.getByRole('searchbox', { name: 'Search' });
    await search.click();
    await search.pressSequentially('Heat pump');
    await expect(main(page).locator('.rk-state-t')).toHaveText('No content matches', {
      timeout: 30_000,
    });
    await expect(countStatus(page)).toHaveText('0 of 19 records · read-only');
    await page.waitForURL(/\/admin\/content\/all\?q=Heat\+pump$/);
    await checkState(page, 'Content');
    await shot(page, 'sa12-no-match');
    await reachAndClick(
      page,
      main(page).locator('.rk-state').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(tableRows(page)).toHaveCount(19);
    await expect(search).toHaveValue('');
    await expect(search).toBeFocused();

    // A row opens its record (SA-13).
    const mark = await markDocument(page);
    await follow(
      page,
      page.getByRole('link', {
        name: 'Flash Distillation, With the Academic Reviewer. Open the record',
      }),
    );
    await page.waitForURL('**/admin/content/records/SUB-0086');
    await expect(heading(page, 'Flash Distillation')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('SA-13 Content record', () => {
  test('stuck: the override moves it back to the vendor', async ({ page }) => {
    await open(page, 'after-flow-e', '/admin/content/records/SUB-0085', 'DC Motor Speed Control');
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Submission');
    await expect(meta(page)).toHaveText(/Stuck — nobody can act\s*EEE ZC341\s*Electrical Machines/);
    const stuckNotice = main(page).locator('.rk-notice--warn');
    await expect(stuckNotice).toContainText(
      'No Academic Reviewer has EEE ZC341 in scope, so this review can’t continue.',
    );
    await expect(stuckNotice.getByRole('link', { name: 'Open Platform roles' })).toHaveAttribute(
      'href',
      '/admin/roles?tab=reviewers',
    );
    await expect(history(page).first()).toContainText(
      'Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
    );
    await expect(overridePanel(page).locator('dl.rk-stand')).toHaveText(
      /From\s*With the Academic Reviewer\s*To\s*Returned to the vendor/,
    );
    await expectNoReferences(page);
    await checkState(page, 'DC Motor Speed Control');
    await shot(page, 'sa13-stuck');

    // “Go to override” leads to the panel below 860 px of page width.
    const goTo = main(page).locator('a.rk-goto');
    if (await goTo.isVisible()) {
      await reachAndClick(page, goTo);
      await expect(overridePanel(page)).toBeInViewport();
      await expect(
        overridePanel(page).getByRole('heading', { level: 2, name: 'Move status (override)' }),
      ).toBeFocused();
    }

    // A reason is required before anything opens.
    const reason = overridePanel(page).getByRole('textbox', { name: 'Reason (required)' });
    const move = overridePanel(page).getByRole('button', { name: 'Move status' });
    await reachAndClick(page, move);
    await expect(
      overridePanel(page).getByText('Add a reason — it is kept in the history'),
    ).toBeVisible();
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toBeFocused();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (width(page) === 1024) await shot(page, 'sa13-reason-required');
    const before = await port<{ readonly stuck: boolean }>(
      page,
      ARJUN,
      'production',
      'getContentRecord',
      { kind: 'SUB', id: 'SUB-0085' },
    );
    expect(before.stuck).toBe(true);

    await reason.pressSequentially('No reviewer for Electrical Machines until November.');
    await reachAndClick(page, move);
    const dialog = page.getByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-now')).toContainText(
      'Ritu Sharma · Meridian Virtual Labs can work on it again.',
    );
    await expect(dialog.locator('blockquote.rk-quote')).toContainText(
      'No reviewer for Electrical Machines until November.',
    );
    await expect(dialog.getByRole('button', { name: 'Move status' })).toBeFocused();
    await settle(page);
    await checkState(page, 'DC Motor Speed Control');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Move status' }));
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    const flash = main(page)
      .locator('.rk-notice--ok')
      .filter({ hasText: 'Returned to the vendor.' });
    await expect(flash).toBeFocused();
    await expect(flash).toContainText(
      'The override and your reason are in the governance history.',
    );
    await expect(meta(page)).toContainText('Returned to the vendor', { timeout: 30_000 });
    await expect(overridePanel(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Move status' })).toHaveCount(0);
    await expect(history(page).first()).toContainText('Status moved by Arjun Mehta (override)');
    await expectNoReferences(page);
    await checkState(page, 'DC Motor Speed Control');

    // Cross-role: the Vendor's own record reads returned (OD-B7-09: the one supported move).
    const vendor = await port<{
      readonly submission: { readonly status: { readonly state: string; readonly by?: string } };
    }>(page, RITU, 'production', 'getRecord', 'SUB-0085');
    expect(vendor.submission.status).toMatchObject({
      state: 'returned',
      by: 'super-admin-override',
    });

    // It has left the Stuck status and the Overview's Stuck content group.
    const mark = await markDocument(page);
    await follow(
      page,
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'All content' }),
    );
    await page.waitForURL('**/admin/content/all');
    await expect(statusFilter(page).locator('option[value="stuck"]')).toHaveText(
      'Stuck — nobody can act (0)',
      { timeout: 60_000 },
    );
    await expect(main(page).getByRole('button', { name: 'Show stuck records' })).toHaveCount(0);
    await expect(rowNamed(page, 'DC Motor Speed Control')).toContainText('Returned to the vendor');
    await sidebar(page, '/admin');
    await page.waitForURL(/\/admin$/);
    await expect(group(page, 'Requests')).toBeVisible({ timeout: 60_000 });
    await expect(group(page, 'Stuck content')).toHaveCount(0);
    await expectSameDocument(page, mark);
  });

  test('published and in-the-workflow records are read-only', async ({ page }) => {
    await open(
      page,
      'after-flow-e',
      '/admin/content/records/distillation-column',
      'Distillation Column',
    );
    const published = main(page).locator('.rk-notice--info');
    await expect(published).toContainText('Published · read-only');
    await expect(published).toContainText(
      'Published content changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.',
    );
    await expect(
      published.getByRole('link', { name: 'Open the release decision' }),
    ).toHaveAttribute('href', '/admin/content/updates/UPD-0005');
    await expect(page.getByRole('button', { name: /Move status|Edit/ })).toHaveCount(0);
    await expect(overridePanel(page)).toHaveCount(0);
    await expectNoReferences(page);
    await checkState(page, 'Distillation Column');
    await shot(page, 'sa13-published');

    const mark = await markDocument(page);
    const states: readonly (readonly [string, string, string])[] = [
      ['Boiler Drum Level', 'Open the held correction', 'sa13-held'],
      ['Conduction Through a Composite Wall', 'Published · read-only', 'sa13-published-sub'],
      [
        'Flash Distillation',
        'Prof. A. Menon · Academic Reviewer can act on it. Nothing is needed from you.',
        'sa13-in-workflow',
      ],
    ];
    for (const [name, words, frame] of states) {
      await follow(
        page,
        page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', {
          name: 'All content',
        }),
      );
      await expect(tableRows(page)).toHaveCount(19, { timeout: 60_000 });
      await follow(page, rowNamed(page, name).locator('a.rk-rowlink'));
      await expect(heading(page, name)).toBeVisible({ timeout: 60_000 });
      await expect(main(page)).toContainText(words);
      await expect(page.getByRole('button', { name: 'Move status' })).toHaveCount(0);
      await expectNoReferences(page);
      await checkState(page, name);
      await shot(page, frame);
    }
    await follow(
      page,
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'All content' }),
    );
    await follow(page, rowNamed(page, 'Distillation Column').locator('a.rk-rowlink'));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 60_000 });
    await follow(page, main(page).getByRole('link', { name: 'Open the release decision' }));
    await page.waitForURL('**/admin/content/updates/UPD-0005');
    await expectSameDocument(page, mark);
  });
});
