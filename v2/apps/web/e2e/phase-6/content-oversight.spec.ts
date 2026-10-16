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
  SUPER_ADMIN,
} from '../support/workspace';

/**
 * SA-01 Overview in full (B7-01 f0 … f3; B7-10 f15; B7-12 f8 … f11), SA-12 Content › All content
 * (B7-06 f0, f7) and SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6; B7-12 f4 … f7), on the
 * test-hook build at 1440, 1024, 768 and 375, as Arjun Mehta. Each drawn state passes `checkState`
 * (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no
 * sideways scroll). The CI seam only SETS UP the world (the calm Overview: requests asked for
 * information, reports resolved, an Institute Admin assigned, a reviewer given EEE ZC341) and
 * reads the services for the cross-role proofs. Everything the screens do — the Overview's rows
 * and lists, the tabs, "Show stuck records", the search and Clear filters, the records' links and
 * the override (DL-2, a reason required) — is done by real clicks and typing.
 *
 * Cross-role: the Overview's groups and counts agree with the lists they open (Requests → SA-02's
 * rows under review; Stuck content → SA-12's Stuck tab and the SA-13 record), and the override on
 * the stuck SUB-0085 moves it back to the vendor: it leaves the Stuck group and the Stuck tab, and
 * the Vendor's own record reads returned.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ARJUN = SUPER_ADMIN;
const RITU = { personId: 'per-ritu-sharma' };

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/content-oversight';

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

const GROUPS = [
  ['requests', 'Requests'],
  ['updates', 'Corrections waiting for your release decision'],
  ['deviceTransfers', 'Device transfers'],
  ['support', 'Support reports'],
  ['accessEnding', 'Access ending within 15 days'],
  ['institutionsWithoutAdmin', 'Institutions without an Institute Admin'],
  ['stuckContent', 'Stuck content'],
  ['holdersWithoutScope', 'Role holders without scope'],
] as const;

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const group = (page: Page, title: string) =>
  page.getByRole('region', { name: new RegExp(`^${title} \\d+$`) });
const tableRows = (page: Page) => main(page).locator('table.xr-table tbody tr');
const countStatus = (page: Page) => main(page).locator('.xr-toolbar-status [role="status"]');
const tab = (page: Page, name: string) =>
  page.getByRole('tab', { name: new RegExp(`^${name}\\s?\\d+$`) });

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

/** The sidebar's destination, reached and pressed (the drawer opened below 1024 px). */
async function sidebar(page: Page, name: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator('aside.xr-side').getByRole('link', { name }));
}

test.describe('SA-01 Overview', () => {
  test('the figures and eight groups agree with the lists they open (B7-01 f0, f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-e', '/admin', 'Overview');
    await expect(group(page, 'Requests')).toBeVisible();
    const overview = await port<OverviewAnswer>(page, ARJUN, 'operations', 'getSuperAdminOverview');
    const items = GROUPS.reduce((sum, [key]) => sum + overview[key].count, 0);
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      `${items} items waiting across 8 groups · 23 Oct 2026`,
    );
    await expect(main(page).locator('.xr-overline')).toHaveText('Super Admin · Arjun Mehta');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/admin');
    await expect(main(page).locator('.xd-fig')).toHaveText([
      `${overview.figures.activeInstitutions}Active institutionsAccess active or ending soon · ${overview.figures.paused} paused · ${overview.figures.awaitingPayment} awaiting payment`,
      `${overview.figures.publishedExperiments}Published experimentsLive in the catalogue today`,
    ]);
    // The groups in B7-01's order, each the service's count and at most four rows.
    await expect(main(page).locator('section.xd-group h2')).toHaveText(
      GROUPS.map(([key, title]) => `${title} ${overview[key].count}`),
    );
    for (const [key, title] of GROUPS) {
      await expect(group(page, title).locator('.xr-row')).toHaveCount(
        Math.min(4, overview[key].count),
      );
    }
    await checkState(page, 'Overview');
    await shot(page, width(page) === 375 ? 'B7-01-f3' : 'B7-01-f0');

    const mark = await markDocument(page);
    // Requests → SA-02: as many requests under review as the group counts.
    await follow(page, group(page, 'Requests').getByRole('link', { name: 'Open Requests' }));
    await page.waitForURL('**/admin/requests');
    await expect(heading(page, 'Requests')).toBeVisible({ timeout: 60_000 });
    await expect(
      main(page)
        .locator('tbody tr')
        .filter({ has: page.locator('.xr-status', { hasText: /^Under review$/ }) }),
    ).toHaveCount(overview.requests.count);
    await page.goBack();
    await expect(group(page, 'Requests')).toBeVisible({ timeout: 60_000 });

    // A request row opens its decision (SA-03).
    await follow(
      page,
      group(page, 'Requests').getByRole('link', { name: 'Open: REQ-0040 · Konark Polytechnic' }),
    );
    await page.waitForURL('**/admin/requests/REQ-0040');
    await expect(heading(page, 'Konark Polytechnic')).toBeVisible({ timeout: 60_000 });
    await page.goBack();

    // Stuck content → SA-12's Stuck tab holds as many; the row opens the record (SA-13).
    const stuck = group(page, 'Stuck content');
    await expect(stuck).toBeVisible({ timeout: 60_000 });
    await follow(page, stuck.getByRole('link', { name: 'Open All content' }));
    await page.waitForURL('**/admin/content/all');
    await expect(heading(page, 'Content')).toBeVisible({ timeout: 60_000 });
    await expect(tab(page, 'Stuck')).toHaveText(`Stuck ${overview.stuckContent.count}`);
    await page.goBack();
    await follow(
      page,
      group(page, 'Stuck content').getByRole('link', {
        name: 'Open: SUB-0085 · DC Motor Speed Control · EEE ZC341',
      }),
    );
    await page.waitForURL('**/admin/content/records/SUB-0085');
    await expect(heading(page, 'DC Motor Speed Control')).toBeVisible({ timeout: 60_000 });
    await page.goBack();

    // The other rows open the pages where they are handled.
    const targets: readonly (readonly [string, string, RegExp])[] = [
      [
        'Corrections waiting for your release decision',
        'Review: UPD-0005 · Distillation Column 1.2 → 1.3',
        /\/admin\/content\/updates\/UPD-0005$/,
      ],
      ['Device transfers', 'Review: DTR-0018 · Rahul Verma · VR', /\/device-transfers\/DTR-0018$/],
      [
        'Institutions without an Institute Admin',
        'Assign: Sahyadri Institute of Engineering',
        /\/admin\/institutions\/sahyadri$/,
      ],
      [
        'Role holders without scope',
        'Assign scope: Dr K. Iyer · Academic Reviewer',
        /\/admin\/roles\/role-0001$/,
      ],
      [
        'Access ending within 15 days',
        'Open: Konark Polytechnic · ends 2 Nov 2026',
        /\/admin\/operations\/access-ending$/,
      ],
    ];
    for (const [title, name, address] of targets) {
      await expect(group(page, title).getByRole('link', { name })).toHaveAttribute('href', address);
    }
    await follow(
      page,
      group(page, 'Corrections waiting for your release decision').getByRole('link', {
        name: 'Review: UPD-0005 · Distillation Column 1.2 → 1.3',
      }),
    );
    await page.waitForURL('**/admin/content/updates/UPD-0005');
    await expectSameDocument(page, mark);
  });

  test('nothing waiting: the calm state, the two figures kept (B7-01 f1; B7-10 f15)', async ({
    page,
  }) => {
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

    const calm = page.getByRole('region', { name: 'Waiting on you' });
    await expect(calm).toBeVisible({ timeout: 60_000 });
    await expect(calm.getByRole('heading', { level: 3, name: 'Nothing is waiting' })).toBeVisible();
    await expect(calm.locator('p')).toHaveText(
      'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.',
    );
    await expect(page.getByRole('region', { name: 'Platform at a glance' })).toBeVisible();
    await expect(main(page).locator('section.xd-group')).toHaveCount(0);
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
    await checkState(page, 'Overview');
    await shot(page, 'B7-01-f1');
  });
});

test.describe('SA-12 All content', () => {
  test('the notices, the tabs, Show stuck records, the search and no match (B7-06 f0, f7)', async ({
    page,
  }) => {
    await open(page, 'after-flow-e', '/admin/content/all', 'Content');
    await expect(tableRows(page)).toHaveCount(19, { timeout: 60_000 });
    await expect(page.getByRole('tab')).toHaveText([
      'All 19',
      'Stuck 1',
      'In the workflow 6',
      'Published 13',
    ]);
    await expect(countStatus(page)).toHaveText('19 of 19 records');
    const notices = main(page).locator('.xr-notice');
    await expect(notices.nth(0)).toContainText('1 record stuck — nobody can act');
    await expect(notices.nth(1)).toContainText(
      'UPD-0005 · Distillation Column 1.2 → 1.3 — approved by the Academic Reviewer.',
    );
    await expect(notices.nth(1).getByRole('link', { name: 'Open Updates' })).toHaveAttribute(
      'href',
      '/admin/content/updates',
    );
    await expect(
      page.getByRole('navigation', { name: 'Content' }).getByRole('link', { name: 'All content' }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(tableRows(page).filter({ hasText: 'Distillation Column' }).first()).toContainText(
      'Update UPD-0005 · approved — waiting for your release decision',
    );
    await expect(tableRows(page).filter({ hasText: 'Induction Motor Loading' })).not.toContainText(
      'UPD-0006',
    );
    await checkState(page, 'Content');
    await shot(page, 'B7-06-f0');

    // "Show stuck records" selects the Stuck tab (focus on it) and the address says so.
    await reachAndClick(page, page.getByRole('button', { name: 'Show stuck records' }));
    await expect(tab(page, 'Stuck')).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 'Stuck')).toBeFocused();
    await expect(tableRows(page)).toHaveCount(1);
    await expect(countStatus(page)).toHaveText('1 of 19 records');
    await page.waitForURL(/\/admin\/content\/all\?show=stuck$/);
    await page.keyboard.press('ArrowRight');
    await expect(tab(page, 'In the workflow')).toHaveAttribute('aria-selected', 'true');
    await expect(tableRows(page)).toHaveCount(6);
    await page.keyboard.press('Home');
    await expect(tableRows(page)).toHaveCount(19);

    // No match (f7): the count, the empty state and one way back.
    const search = page.getByRole('searchbox', { name: 'Search content' });
    await search.click();
    await search.pressSequentially('Heat pump');
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'No content matches' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(countStatus(page)).toHaveText('0 of 19 records');
    await page.waitForURL(/\/admin\/content\/all\?q=Heat\+pump$/);
    await checkState(page, 'Content');
    await shot(page, 'B7-06-f7');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(tableRows(page)).toHaveCount(19);
    await expect(search).toHaveValue('');

    // A row opens its record (SA-13).
    const mark = await markDocument(page);
    await follow(page, page.getByRole('link', { name: 'Open Flash Distillation' }));
    await page.waitForURL('**/admin/content/records/SUB-0086');
    await expect(heading(page, 'Flash Distillation')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
  });
});

test.describe('SA-13 Content record', () => {
  test('stuck: the override moves it back to the vendor (B7-06 f1, f5, f8; B7-10 f6)', async ({
    page,
  }) => {
    await open(page, 'after-flow-e', '/admin/content/records/SUB-0085', 'DC Motor Speed Control');
    await expect(main(page).locator('.xr-overline')).toHaveText(
      'SUB-0085 · EEE ZC341 · Electrical Machines',
    );
    const stuckNotice = main(page).locator('.xr-notice--err');
    await expect(stuckNotice).toContainText(
      'Nobody — no Academic Reviewer has EEE ZC341 in scope. It has been waiting since 2 Oct 2026.',
    );
    await expect(stuckNotice.getByRole('link', { name: 'Open Platform roles' })).toHaveAttribute(
      'href',
      '/admin/roles?tab=reviewers',
    );
    await expect(main(page).locator('ol.xr-timeline > li').first()).toContainText(
      'Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
    );
    await checkState(page, 'DC Motor Speed Control');
    await shot(page, width(page) === 375 ? 'B7-06-f8' : 'B7-06-f1');

    // DL-2: a reason is required (f5).
    await reachAndClick(page, page.getByRole('button', { name: 'Move status (override)' }));
    const dialog = page.getByRole('dialog', { name: 'Move SUB-0085 out of review?' });
    await expect(dialog).toBeVisible();
    const reason = dialog.getByRole('textbox', { name: 'Reason — kept in the history' });
    await expect(reason).toBeFocused();
    await expect(dialog.locator('dl')).toContainText(
      'Returned to vendor — Ritu Sharma · Meridian Virtual Labs can change it and send it again',
    );
    await reachAndClick(page, dialog.getByRole('button', { name: 'Move status' }));
    await expect(dialog.getByText('Add a reason — it is kept in the history')).toBeVisible();
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(reason).toBeFocused();
    await shot(page, 'B7-06-f5');
    const before = await port<{ readonly stuck: boolean }>(
      page,
      ARJUN,
      'production',
      'getContentRecord',
      {
        kind: 'SUB',
        id: 'SUB-0085',
      },
    );
    expect(before.stuck).toBe(true);

    await reason.pressSequentially('No reviewer for Electrical Machines until November.');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Move status' }));
    const flash = main(page).locator('p.xa-save');
    await expect(flash).toHaveText(
      'SUB-0085 is now with the vendor. Ritu Sharma · Meridian Virtual Labs can act on it.',
      { timeout: 30_000 },
    );
    await expect(flash).toBeFocused();
    await expect(main(page).locator('.xr-phead-meta')).toContainText('Returned to vendor');
    await expect(page.getByRole('button', { name: 'Move status (override)' })).toHaveCount(0);
    await expect(main(page).locator('ol.xr-timeline > li').first()).toContainText(
      'Status moved by Arjun Mehta — override',
    );
    await checkState(page, 'DC Motor Speed Control');

    // Cross-role: the Vendor's own record reads returned (OD-B7-09: the one supported move).
    const vendor = await port<{
      readonly submission: { readonly status: { readonly state: string; readonly by?: string } };
    }>(page, RITU, 'production', 'getRecord', 'SUB-0085');
    expect(vendor.submission.status).toMatchObject({
      state: 'returned',
      by: 'super-admin-override',
    });

    // It has left the Stuck tab and the Overview's Stuck content group.
    const mark = await markDocument(page);
    await follow(page, main(page).getByRole('link', { name: 'All content' }));
    await page.waitForURL('**/admin/content/all');
    await expect(tab(page, 'Stuck')).toHaveText('Stuck 0', { timeout: 60_000 });
    await expect(main(page).locator('.xr-notice--err')).toHaveCount(0);
    await expect(tableRows(page).filter({ hasText: 'DC Motor Speed Control' })).toContainText(
      'Returned to vendor',
    );
    await sidebar(page, 'Overview');
    await page.waitForURL(/\/admin$/);
    await expect(group(page, 'Requests')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('region', { name: /^Stuck content/ })).toHaveCount(0);
    await expectSameDocument(page, mark);
  });

  test('published and in-the-workflow records are read-only (B7-06 f2, f3, f4, f6; B7-10 f5)', async ({
    page,
  }) => {
    await open(
      page,
      'after-flow-e',
      '/admin/content/records/distillation-column',
      'Distillation Column',
    );
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'Published · read-only. Published content changes only through a correction: Content Manager → Academic Reviewer → your release decision.',
    );
    const waiting = main(page).locator('.xr-notice').first();
    await expect(waiting).toContainText(
      'Update UPD-0005 · approved — waiting for your release decision',
    );
    await expect(waiting.getByRole('link', { name: 'Open the release decision' })).toHaveClass(
      /xr-btn--primary/,
    );
    await expect(page.getByRole('button', { name: /Move status|Edit/ })).toHaveCount(0);
    await checkState(page, 'Distillation Column');
    await shot(page, 'B7-06-f2');

    const mark = await markDocument(page);
    const states: readonly (readonly [string, string, string])[] = [
      ['Boiler Drum Level', 'Update UPD-0004 · on hold', 'B7-06-f6'],
      ['Conduction Through a Composite Wall', 'Published · read-only.', 'B7-06-f3'],
      [
        'Flash Distillation',
        'Who can act: Prof. A. Menon · Academic Reviewer. Nothing to do here.',
        'B7-06-f4',
      ],
    ];
    for (const [name, words, frame] of states) {
      await follow(page, main(page).getByRole('link', { name: 'All content' }));
      await expect(tableRows(page)).toHaveCount(19, { timeout: 60_000 });
      await follow(page, page.getByRole('link', { name: `Open ${name}` }));
      await expect(heading(page, name)).toBeVisible({ timeout: 60_000 });
      await expect(main(page)).toContainText(words);
      await expect(page.getByRole('button', { name: 'Move status (override)' })).toHaveCount(0);
      await checkState(page, name);
      await shot(page, frame);
    }
    await follow(page, main(page).getByRole('link', { name: 'All content' }));
    await follow(page, page.getByRole('link', { name: 'Open Distillation Column' }));
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 60_000 });
    await follow(page, main(page).getByRole('link', { name: 'Open the release decision' }));
    await page.waitForURL('**/admin/content/updates/UPD-0005');
    await expectSameDocument(page, mark);
  });
});
