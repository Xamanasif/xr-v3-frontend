import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import {
  actAs,
  bootWorld,
  expectNoAxeViolations,
  reachAndClick,
  switchIdentity,
  TEST_HOOKS_URL,
} from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';

/**
 * Phase 6 · the Super Admin's Operations — SA-20 Support (B7-09 f7, f13), SA-21 Support report
 * (B7-09 f8 … f12, f14; B7-10 f12; B7-12 f28 … f31), SA-22 Access ending (B7-09 f4, f6; B7-10
 * f13), SA-18's three tab links (B7-09 f0) and SA-07's access-ending row (B7-03 konark) — on the
 * test-hook build at 1440, 1024, 768 and 375, on the world after Flow E (23 Oct 2026). Each drawn
 * state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no
 * developer surface, no sideways scroll); the DL-1 Reopen passes axe and gives focus back to
 * Reopen on Esc.
 *
 * Everything the screens do — the view tabs, Open, Resolve with its note (and without one),
 * Reopen through DL-1, Open request / Open institution — is done by real clicks and typing in one
 * tab (one world, no reload). The cross-role proof: Rahul Verma sends a report from Help (XS-07,
 * the real form); the Super Admin, in the same tab (the CI-only same-tab session switch), finds it
 * in Support and resolves it with a note; Rahul's own report page reads Resolved and the note; the
 * Super Admin reopens it (DL-1) and both sides read Reopened. The CI seam only SETS UP a state
 * (every open report resolved, for f13) — never what the screens do.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const ADMIN = { personId: 'sa-arjun-mehta' };
const RAHUL = { personId: 'per-0002' };
const FIXTURE = 'after-flow-e';
const SUPPORT = '/admin/operations/support';
const ENDING = '/admin/operations/access-ending';
const TRANSFERS = '/admin/operations/device-transfers';
const SUP_0213_TITLE = 'The VR simulation stopped loading at the second step';
const LOAD = { timeout: 90_000 };

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/operations-6';

const main = (page: Page) => page.locator('main');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Resolve' });
const flash = (page: Page) => page.locator('#support-flash');
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Operations' }).getByRole('link');
/** A list's table once loaded (the loading skeleton is an `aria-hidden` table of its own). */
const table = (page: Page, section: 'Support reports' | 'Ending within 15 days, or ended') =>
  page.getByRole('region', { name: section }).locator('table.xr-table:not([aria-hidden="true"])');
const supportTable = (page: Page) => table(page, 'Support reports');
const endingTable = (page: Page) => table(page, 'Ending within 15 days, or ended');

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

async function open(page: Page, path: string, session = ADMIN): Promise<void> {
  await bootWorld(page, { fixture: FIXTURE, session });
  await page.goto(path);
}

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

/** A list's body rows as their cells' words (text nodes joined by spaces). */
async function rows(list: Locator): Promise<string[][]> {
  return list.locator('tbody tr').evaluateAll((list) =>
    list.map((row) =>
      [...row.querySelectorAll('td')].map((cell) => {
        const parts: string[] = [];
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode())
          parts.push(node.textContent ?? '');
        return parts.join(' ').replace(/\s+/g, ' ').trim();
      }),
    ),
  );
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator(`aside.xr-side a[href="${href}"]`));
  await page.waitForURL((url) => url.pathname === href);
}

/**
 * Switches this tab to `person` (the CI-only same-tab session switch: same document, same world)
 * and follows XS-06's "Back to Home" — the address belongs to the previous workspace.
 */
async function switchTo(page: Page, person: { readonly personId: string }, home: string) {
  const switched = await switchIdentity(page, person);
  expect(switched.personId).toBe(person.personId);
  await expect(
    page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
  ).toBeVisible(LOAD);
  await main(page)
    .locator('.xs-msg')
    .getByRole('link', { name: /^Back to (Home|Overview)$/ })
    .click();
  await page.waitForURL((url) => url.pathname === home, LOAD);
}

test.describe('SA-20 Operations › Support', () => {
  test('Open: the three tabs, the counted views and the open reports; All by its tab; Open leads to SA-21 (B7-09 f7)', async ({
    page,
  }) => {
    await open(page, SUPPORT);
    await expect(supportTable(page)).toBeVisible(LOAD);
    await expect(tabs(page)).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs(page).nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', TRANSFERS);
    await expect(page.getByRole('tablist', { name: 'Show' }).getByRole('tab')).toHaveText([
      /Open\s*2/,
      /Resolved\s*0/,
      /All\s*2/,
    ]);
    expect(await rows(supportTable(page))).toEqual([
      [
        'The preview of the WEB delivery link showed an empty frame SUP-0207 · Sent 28 Sep 2026',
        'Kavya Nair · Content Manager',
        'Reopened',
        'Open',
      ],
      [
        `${SUP_0213_TITLE} SUP-0213 · Sent 16 Oct 2026`,
        'Rahul Verma · Student · Godavari Institute of Technology',
        'Open',
        'Open',
      ],
    ]);
    await checkState(page, 'Operations');
    await shot(page, 'SA-20-f7');

    const mark = await markDocument(page);
    await reachAndClick(page, page.getByRole('tab', { name: /All/ }));
    await page.waitForURL(`**${SUPPORT}?show=all`);
    await expect(page.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: `Open SUP-0213 ${SUP_0213_TITLE}` }),
    );
    await page.waitForURL(`**${SUPPORT}/SUP-0213`);
    await expect(page.getByRole('heading', { level: 1, name: SUP_0213_TITLE })).toBeVisible(LOAD);
    await expectSameDocument(page, mark);
  });

  test('nothing open: the calm state on the Open tab (B7-09 f13)', async ({ page }) => {
    await open(page, SUPPORT);
    await expect(supportTable(page)).toBeVisible(LOAD);
    // Set-up: every open report resolved (the CI seam), then the list reads it.
    for (const id of ['SUP-0207', 'SUP-0213']) {
      const report = await port<{ id: string; rev: number }>(
        page,
        ADMIN,
        'operations',
        'getMyReport',
        id,
      );
      await port(page, ADMIN, 'operations', 'resolveReport', {
        id: report.id,
        note: 'Fixed — please try again.',
        expectedRev: report.rev,
      });
    }
    await expect(
      page.getByRole('heading', { level: 3, name: 'No open support reports' }),
    ).toBeVisible();
    await expect(main(page)).toContainText('Reports sent from Help appear here.');
    await expect(page.getByRole('tablist', { name: 'Show' }).getByRole('tab')).toHaveText([
      /Open\s*0/,
      /Resolved\s*2/,
      /All\s*2/,
    ]);
    await checkState(page, 'Operations');
    await shot(page, 'SA-20-f13');
  });
});

test.describe('SA-21 Support report', () => {
  test('open → no note → Resolve with a note → resolved → Reopen (DL-1) → reopened (B7-09 f8, f11, f9, f12, f10)', async ({
    page,
  }) => {
    await open(page, `${SUPPORT}/SUP-0213`);
    await expect(page.getByRole('heading', { level: 1, name: SUP_0213_TITLE })).toBeVisible(LOAD);
    await expect(panel(page)).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', TRANSFERS);
    await expect(main(page).locator('.xr-overline')).toHaveText('Support report · SUP-0213');
    await expect(
      page.getByRole('region', { name: 'What they reported' }).getByRole('link', {
        name: 'Open Godavari Institute of Technology',
      }),
    ).toHaveAttribute('href', '/admin/institutions/godavari');
    await expect(panel(page).locator('.xl-open')).toHaveText('No response-time target is set.');
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-f8');

    // f11: Resolve with no note — the drawn error, focus on the note, nothing written.
    const note = panel(page).getByRole('textbox', { name: 'Note to the reporter' });
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve' }));
    await expect(panel(page).locator('.xr-error')).toHaveText('Add a note — the reporter sees it');
    await expect(note).toBeFocused();
    await expect(note).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-f11');

    // f9: Resolve with a note — the flash takes focus; the note the reporter sees.
    const words = 'The VR build was fixed. Please open the simulation again.';
    await note.fill(words);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve' }));
    await expect(flash(page)).toHaveText('SUP-0213 resolved. The reporter sees your note.');
    await expect(flash(page)).toBeFocused();
    await expect(panel(page)).toContainText(`“${words}”`);
    await expect(panel(page)).toContainText('The reporter sees this note.');
    await expect(main(page).locator('.xr-phead-meta .xr-status')).toHaveText('Resolved');
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-f9');

    // f12: Reopen asks first (DL-1); Esc gives focus back to Reopen and writes nothing.
    const reopen = panel(page).getByRole('button', { name: 'Reopen' });
    await reachAndClick(page, reopen);
    const dialog = page.getByRole('dialog', { name: 'Reopen SUP-0213?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
    );
    await expect(dialog.getByRole('button', { name: 'Reopen' })).toBeFocused();
    await expectNoAxeViolations(page);
    await shot(page, 'SA-21-f12');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(reopen).toBeFocused();
    await reachAndClick(page, reopen);
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Reopen' }));
    await expect(flash(page)).toHaveText(
      'SUP-0213 is open again. The reporter sees it is reopened.',
    );
    await expect(flash(page)).toBeFocused();

    // f10: reopened — the earlier note first; Resolve again with a new note.
    await expect(main(page).locator('.xr-notice--warn')).toContainText('Reopened by Arjun Mehta');
    await expect(main(page).locator('.xr-notice--warn')).toContainText(`Earlier note: “${words}”`);
    await expect(main(page).locator('.xr-phead-meta .xr-status')).toHaveText('Reopened');
    await expect(
      page.getByRole('region', { name: 'History' }).locator('li.xr-tl .xr-tl-what'),
    ).toHaveText(['Reopened', 'Resolved', 'Sent']);
    await expect(note).toBeVisible();
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-f10');
  });

  test('a report reopened before (SUP-0207, B7-12 f28 … f31): the earlier note first; no institution link', async ({
    page,
  }) => {
    await open(page, `${SUPPORT}/SUP-0207`);
    const title = 'The preview of the WEB delivery link showed an empty frame';
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible(LOAD);
    await expect(main(page).locator('.xr-notice--warn')).toContainText(
      'Earlier note: “The preview now loads. Please try again.”',
    );
    await expect(
      page.getByRole('region', { name: 'What they reported' }).getByRole('link'),
    ).toHaveCount(0);
    await checkState(page, title);
    await shot(page, 'SA-21-B7-12');
    await reachAndClick(page, main(page).locator('a.xr-back'));
    await page.waitForURL((url) => url.pathname === SUPPORT && url.search === '');
    await expect(supportTable(page)).toBeVisible(LOAD);
  });
});

test.describe('SA-22 Operations › Access ending', () => {
  test('soonest first, ended after; Open request and Open institution open their pages; SA-07’s reminder row leads back (B7-09 f4, f6; B7-10 f13; B7-03 konark)', async ({
    page,
  }) => {
    await open(page, ENDING);
    await expect(endingTable(page)).toBeVisible(LOAD);
    await expect(tabs(page).nth(2)).toHaveAttribute('aria-current', 'page');
    await expect(
      page
        .getByRole('region', { name: 'Ending within 15 days, or ended' })
        .locator('.xr-section-head .xr-meta'),
    ).toHaveText('As of 23 Oct 2026 · soonest first');
    expect(await rows(endingTable(page))).toEqual([
      [
        'BITS Pilani — Hyderabad Campus ACC-0098 · Internal',
        '31 Oct 2026 8 days left',
        'Renewal in progress REQ-0038 under review',
        'Open request Open institution',
      ],
      [
        'Konark Polytechnic ACC-0091 · External',
        '2 Nov 2026 10 days left',
        'Reminder due Nothing is sent from here',
        'Open institution',
      ],
      [
        'Malnad College of Engineering ACC-0079 · External',
        '15 Oct 2026 Ended 8 days ago',
        'Access ended No renewal requested',
        'Open institution',
      ],
    ]);
    await expect(endingTable(page).getByRole('button')).toHaveCount(0);
    await expect(main(page).locator('p.xl-open')).toHaveText(
      '“Reminder due” is a status only — nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
    );
    await checkState(page, 'Operations');
    await shot(page, 'SA-22-f4');

    const mark = await markDocument(page);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open request REQ-0038' }));
    await page.waitForURL('**/admin/requests/REQ-0038');
    // SA-03 names the request's institution (B1-11).
    await expect(
      page.getByRole('heading', { level: 1, name: 'BITS Pilani — Hyderabad Campus' }),
    ).toBeVisible(LOAD);
    await page.goBack();
    await page.waitForURL(`**${ENDING}`);
    await expect(endingTable(page)).toBeVisible(LOAD);
    await reachAndClick(page, main(page).getByRole('link', { name: 'Open Konark Polytechnic' }));
    await page.waitForURL('**/admin/institutions/konark');
    await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible(
      LOAD,
    );
    const attention = page.getByRole('region', { name: 'Needs attention' });
    await expect(attention.locator('.xr-row-title').first()).toHaveText(
      'Access ends 2 Nov 2026 — reminder due (nothing is sent from here)',
    );
    await checkState(page, 'Konark Polytechnic');
    await reachAndClick(page, attention.getByRole('link', { name: 'Operations › Access ending' }));
    await page.waitForURL(`**${ENDING}`);
    await expect(endingTable(page)).toBeVisible(LOAD);

    // SA-18 now renders all three tabs (B7-09 f0).
    await reachAndClick(page, tabs(page).nth(0));
    await page.waitForURL(`**${TRANSFERS}`);
    await expect(tabs(page)).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs(page).nth(0)).toHaveAttribute('aria-current', 'page');
    await checkState(page, 'Operations');
    await shot(page, 'SA-18-f0');
    await reachAndClick(page, tabs(page).nth(1));
    await page.waitForURL(`**${SUPPORT}`);
    await expect(supportTable(page)).toBeVisible(LOAD);
    await expectSameDocument(page, mark);
  });
});

test.describe('Cross-role: a report from Help, resolved and reopened by the Super Admin', () => {
  test('Rahul sends it (XS-07); the Super Admin resolves it; Rahul reads Resolved and the note; reopened, both read Reopened', async ({
    page,
  }) => {
    await open(page, '/student/help', RAHUL);
    await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible(LOAD);
    const mark = await markDocument(page);
    // 1. Rahul's report, through the real form.
    await reachAndClick(page, main(page).getByRole('link', { name: 'Report a problem' }));
    await page.waitForURL('**/student/help/report');
    await expect(page.getByRole('heading', { level: 1, name: 'Report a problem' })).toBeVisible(
      LOAD,
    );
    const whatHappened = 'The AR model froze when I rotated the heat exchanger.';
    await page.getByLabel('What happened?').fill(whatHappened);
    await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible(LOAD);
    const reference = (await main(page).locator('.xs-msg .xs-msg-d b').textContent())!;
    expect(reference).toMatch(/^SUP-\d{4}$/);

    // 2. The Super Admin, in this tab, finds it in Support (Open, oldest first: last) and resolves it.
    await switchTo(page, ADMIN, '/admin');
    await sidebar(page, TRANSFERS);
    await reachAndClick(page, tabs(page).nth(1));
    await page.waitForURL(`**${SUPPORT}`);
    await expect(supportTable(page)).toBeVisible(LOAD);
    const last = (await rows(supportTable(page))).at(-1)!;
    expect(last.slice(0, 3)).toEqual([
      `${whatHappened.replace(/\.$/, '')} ${reference} · Sent 23 Oct 2026`,
      'Rahul Verma · Student · Godavari Institute of Technology',
      'Open',
    ]);
    await reachAndClick(
      page,
      main(page).getByRole('link', {
        name: `Open ${reference} ${whatHappened.replace(/\.$/, '')}`,
      }),
    );
    await page.waitForURL(`**${SUPPORT}/${reference}`);
    await expect(panel(page)).toBeVisible(LOAD);
    const note = 'Fixed — the AR model now keeps rotating. Please try again.';
    await panel(page).getByRole('textbox', { name: 'Note to the reporter' }).fill(note);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve' }));
    await expect(flash(page)).toHaveText(`${reference} resolved. The reporter sees your note.`);

    // 3. Rahul's own report page: Resolved, with the note.
    await switchTo(page, RAHUL, '/student');
    await sidebar(page, '/student/help');
    const row = main(page).locator('ul.xs-reports a.xs-report', { hasText: reference });
    await expect(row).toContainText('Resolved', LOAD);
    await reachAndClick(page, row);
    await page.waitForURL(`**/student/help/reports/${reference}`);
    await expect(main(page).locator('.rk-notice--ok')).toContainText(`“${note}”`, LOAD);
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Resolved');
    await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);

    // 4. The Super Admin reopens it (DL-1): Reopened on their side…
    await switchTo(page, ADMIN, '/admin');
    await sidebar(page, TRANSFERS);
    await reachAndClick(page, tabs(page).nth(1));
    await page.waitForURL(`**${SUPPORT}`);
    await reachAndClick(page, page.getByRole('tab', { name: /Resolved/ }));
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: new RegExp(`^Open ${reference}`) }),
    );
    await page.waitForURL(`**${SUPPORT}/${reference}`);
    await expect(panel(page).getByRole('button', { name: 'Reopen' })).toBeVisible(LOAD);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Reopen' }));
    const dialog = page.getByRole('dialog', { name: `Reopen ${reference}?` });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Reopen' }));
    await expect(flash(page)).toHaveText(
      `${reference} is open again. The reporter sees it is reopened.`,
    );
    await expect(main(page).locator('.xr-phead-meta .xr-status')).toHaveText('Reopened');

    // 5. …and on Rahul's.
    await switchTo(page, RAHUL, '/student');
    await sidebar(page, '/student/help');
    const again = main(page).locator('ul.xs-reports a.xs-report', { hasText: reference });
    await expect(again).toContainText('Reopened', LOAD);
    await reachAndClick(page, again);
    await page.waitForURL(`**/student/help/reports/${reference}`);
    await expect(main(page)).toContainText('This report is open again', LOAD);
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Reopened');
    await expectSameDocument(page, mark);
  });
});
