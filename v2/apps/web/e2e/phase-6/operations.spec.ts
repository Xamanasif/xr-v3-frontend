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
  sidebarHelp,
  sidebarLink,
} from '../support/workspace';

/**
 * Phase 6 · the Super Admin's Operations in the V3 design (SA-v1 `V.support`, `V.report`,
 * `V.accessEnding`) — SA-20 Support, SA-21 Support report, SA-22 Access ending, SA-18's three tab
 * links, and SA-07's access-ending row (B7-03 konark) — on the test-hook build at 1440, 1024, 768
 * and 375, on the world after Flow E (23 Oct 2026). Each drawn state passes `checkState` (axe WCAG
 * A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll)
 * and names no SUP, REQ or ACC reference; the Reopen confirmation passes axe and gives focus back
 * to Reopen on Esc.
 *
 * Everything the screens do — the views, opening a report, Resolve with its note (and without
 * one), Reopen through its confirmation, Open request / Open institution — is done by real clicks
 * and typing in one tab (one world, no reload). The cross-role proof: Rahul Verma sends a report
 * from Help (XS-07, the real form); the Super Admin, in the same tab (the CI-only same-tab session
 * switch), finds it in Support and resolves it with a note; Rahul's own report page reads Resolved
 * and the note; the Super Admin reopens it and both sides read Reopened. The CI seam only SETS UP
 * a state (every open report resolved, for the empty view) — never what the screens do.
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
const SUP_0207_TITLE = 'The preview of the WEB delivery link showed an empty frame';
const LOAD = { timeout: 90_000 };
const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/a566da95-3982-4d42-9ae6-383145b4d848/scratchpad/sa-operations/shots';

const main = (page: Page) => page.locator('main');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: /^Resolved?$/ });
const flash = (page: Page) => page.locator('#support-flash');
const tabs = (page: Page) => page.getByRole('navigation', { name: 'Operations' }).getByRole('link');
const views = (page: Page) => page.getByRole('group', { name: 'Show support reports' });
const supportTable = (page: Page) =>
  page.getByRole('table', { name: 'Support reports, oldest first' });
const endingTable = (page: Page) =>
  page.getByRole('table', {
    name: 'Access ending within 15 days, or recently ended, soonest first',
  });
const note = (page: Page) =>
  panel(page).getByRole('textbox', { name: 'Resolution note (required)' });

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

/** A table's body rows as their cells' words (text nodes joined by spaces); row heads first. */
async function rows(list: Locator): Promise<string[][]> {
  return list.locator('tbody tr').evaluateAll((list) =>
    list.map((row) =>
      [...row.querySelectorAll('th, td')].map((cell) => {
        const parts: string[] = [];
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode())
          parts.push(node.textContent ?? '');
        return parts.join(' ').replace(/\s+/g, ' ').trim();
      }),
    ),
  );
}

/**
 * Opens a report from the list by pressing its row (the whole row opens it; a two-line title's
 * link box can have no point of its own at its centre).
 */
async function openRow(page: Page, name: string): Promise<void> {
  await expect(supportTable(page).getByRole('link', { name })).toBeVisible(LOAD);
  await reachAndClick(
    page,
    supportTable(page)
      .getByRole('row')
      .filter({ has: page.getByRole('link', { name }) }),
  );
}

/** No internal reference in the page's words or accessible names (SA-v1 HANDOFF). */
async function expectNoReferences(page: Page): Promise<void> {
  expect(await main(page).innerText()).not.toMatch(INTERNAL);
  const names = await main(page)
    .locator('[aria-label]')
    .evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(INTERNAL);
  expect(await page.title()).not.toMatch(INTERNAL);
}

/** The workspace's destination, as the person reaches it at this width (rail or Menu drawer). */
async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
  await page.waitForURL((url) => url.pathname === href);
}

/** The workspace's Help, in the sidebar's foot (the rail's or the drawer's below 1024 px). */
async function help(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarHelp(page).filter({ visible: true }).first());
  await page.waitForURL((url) => url.pathname === href);
}

/**
 * Below the switch's own width its views scroll sideways (the export's `rb-switch`): a sideways
 * wheel over it — a swipe on a phone — brings the view into sight before it is pressed.
 */
async function chooseView(page: Page, name: RegExp): Promise<void> {
  const box = await views(page).boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(600, 0);
  }
  await reachAndClick(page, views(page).getByRole('button', { name }));
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

/** The dialog pops in (`rk-pop`, 180 ms): axe reads its colours once it has settled. */
async function settled(dialog: Locator): Promise<void> {
  await dialog.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => null)),
    ),
  );
}

test.describe('SA-20 Operations › Support', () => {
  test('Open: the tabs, the counted views and the open reports; All by its view; a row opens SA-21', async ({
    page,
  }) => {
    await open(page, SUPPORT);
    await expect(supportTable(page)).toBeVisible(LOAD);
    await expect(tabs(page)).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs(page).nth(1)).toHaveAttribute('aria-current', 'page');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', TRANSFERS);
    await expect(views(page).getByRole('button')).toHaveText(['Open 2', 'Resolved 0', 'All 2']);
    await expect(views(page).getByRole('button').first()).toHaveAttribute('aria-pressed', 'true');
    expect(await rows(supportTable(page))).toEqual([
      [
        `${SUP_0207_TITLE} Sent 28 Sep 2026`,
        'Kavya Nair Content Manager',
        'Content library · Forced Convection',
        'Last activity Reopened 6 Oct',
        'Reopened',
      ],
      [
        `${SUP_0213_TITLE} Sent 16 Oct 2026`,
        'Rahul Verma Student · Godavari Institute of Technology',
        'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
        'Last activity Sent 16 Oct',
        'Open',
      ],
    ]);
    await expectNoReferences(page);
    await checkState(page, 'Operations');
    await shot(page, 'SA-20');

    const mark = await markDocument(page);
    await chooseView(page, /^All/);
    await page.waitForURL(`**${SUPPORT}?show=all`);
    await expect(views(page).getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await openRow(page, `${SUP_0213_TITLE}, Open. Open the report`);
    await page.waitForURL(`**${SUPPORT}/SUP-0213`);
    await expect(page.getByRole('heading', { level: 1, name: SUP_0213_TITLE })).toBeVisible(LOAD);
    await expectSameDocument(page, mark);
  });

  test('nothing open: the empty state on the Open view', async ({ page }) => {
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
    await expect(main(page).getByText('Nothing is open')).toBeVisible();
    await expect(main(page)).toContainText('Reports sent from Help appear here.');
    await expect(views(page).getByRole('button')).toHaveText(['Open 0', 'Resolved 2', 'All 2']);
    await checkState(page, 'Operations');
    await shot(page, 'SA-20-empty');
  });
});

test.describe('SA-21 Support report', () => {
  test('open → no note → Resolve with a note → resolved → Reopen (confirmed) → reopened', async ({
    page,
  }) => {
    await open(page, `${SUPPORT}/SUP-0213`);
    await expect(page.getByRole('heading', { level: 1, name: SUP_0213_TITLE })).toBeVisible(LOAD);
    await expect(panel(page)).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', TRANSFERS);
    await expect(main(page).locator('.rk-head .rk-eyebrow')).toHaveText('Support report');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
      `OperationsSupport${SUP_0213_TITLE}`,
    );
    await expect(
      page.getByRole('region', { name: 'What they reported' }).getByRole('link', {
        name: 'Open Godavari Institute of Technology',
      }),
    ).toHaveAttribute('href', '/admin/institutions/godavari');
    await expect(panel(page)).toContainText('No response-time target is set.');
    await expectNoReferences(page);
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-open');

    // Resolve with no note — the drawn error, focus on the note, nothing written.
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve report' }));
    await expect(panel(page).locator('.rk-ferr')).toHaveText('Add a note — the reporter sees it');
    await expect(note(page)).toBeFocused();
    await expect(note(page)).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-note-required');

    // Resolve with a note — the flash takes focus; the note the reporter sees.
    const words = 'The VR build was fixed. Please open the simulation again.';
    await note(page).fill(words);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve report' }));
    await expect(flash(page)).toHaveText(
      'Report resolved.Rahul Verma sees your note on their report.',
    );
    await expect(flash(page)).toBeFocused();
    await expect(panel(page).locator('blockquote')).toContainText(words);
    await expect(panel(page)).toContainText('Note shown to the reporter');
    await expect(main(page).locator('.rk-head .rk-meta .xr-st')).toHaveText('Resolved');
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-resolved');

    // Reopen asks first; Esc gives focus back to Reopen and writes nothing.
    const reopen = panel(page).getByRole('button', { name: 'Reopen' });
    await reachAndClick(page, reopen);
    const dialog = page.getByRole('dialog', { name: 'Reopen this report?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(
      'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
    );
    await expect(dialog.getByRole('button', { name: 'Reopen' })).toBeFocused();
    await settled(dialog);
    await expectNoAxeViolations(page);
    await shot(page, 'SA-21-reopen');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(reopen).toBeFocused();
    await reachAndClick(page, reopen);
    await expect(dialog).toBeVisible();
    await reachAndClick(page, dialog.getByRole('button', { name: 'Reopen' }));
    await expect(flash(page)).toHaveText('Report reopened.It is back with the open reports.');
    await expect(flash(page)).toBeFocused();

    // Reopened — the earlier note first in the panel; Resolve again with a new note.
    await expect(panel(page).locator('.rk-notice--warn')).toContainText('Reopened by Arjun Mehta');
    await expect(panel(page).locator('.rk-notice--warn')).toContainText(
      `Your earlier note: “${words}”`,
    );
    await expect(main(page).locator('.rk-head .rk-meta .xr-st')).toHaveText('Reopened');
    await expect(
      page.getByRole('region', { name: 'History' }).locator('ol.rk-tl li .rk-tl-w'),
    ).toHaveText(['Reopened', 'Resolved', 'Sent']);
    await expect(note(page)).toBeVisible();
    await expectNoReferences(page);
    await checkState(page, SUP_0213_TITLE);
    await shot(page, 'SA-21-reopened');
  });

  test('a report reopened before: the earlier note first; no institution link; the crumb leads back', async ({
    page,
  }) => {
    await open(page, `${SUPPORT}/SUP-0207`);
    await expect(page.getByRole('heading', { level: 1, name: SUP_0207_TITLE })).toBeVisible(LOAD);
    await expect(panel(page).locator('.rk-notice--warn')).toContainText(
      'Your earlier note: “The preview now loads. Please try again.”',
    );
    await expect(
      page.getByRole('region', { name: 'What they reported' }).getByRole('link'),
    ).toHaveCount(0);
    await checkState(page, SUP_0207_TITLE);
    await shot(page, 'SA-21-SUP-0207');
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Support' }),
    );
    await page.waitForURL((url) => url.pathname === SUPPORT && url.search === '');
    await expect(supportTable(page)).toBeVisible(LOAD);
  });
});

test.describe('SA-22 Operations › Access ending', () => {
  test('soonest first, ended after; the institution, Open request and Open institution open their pages; the tabs lead on', async ({
    page,
  }) => {
    await open(page, ENDING);
    await expect(endingTable(page)).toBeVisible(LOAD);
    await expect(tabs(page).nth(2)).toHaveAttribute('aria-current', 'page');
    await expect(
      page.getByRole('region', { name: 'Access ending within 15 days, or recently ended' }),
    ).toContainText('As of 23 Oct 2026 · soonest first');
    expect(await rows(endingTable(page))).toEqual([
      [
        'BITS Pilani — Hyderabad Campus Internal',
        '31 Oct 2026 8 days left',
        'Renewal in progress Request under review',
        'Open request Open institution',
      ],
      [
        'Konark Polytechnic External',
        '2 Nov 2026 10 days left',
        'Reminder due Nothing is sent from here',
        'Open institution',
      ],
      [
        'Malnad College of Engineering External',
        '15 Oct 2026 Ended 8 days ago',
        'Access ended No renewal requested',
        'Open institution',
      ],
    ]);
    await expect(endingTable(page).getByRole('button')).toHaveCount(0);
    await expect(main(page).locator('p.rk-ca-foot')).toHaveText(
      '“Reminder due” is a status only. Nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
    );
    await expectNoReferences(page);
    await checkState(page, 'Operations');
    await shot(page, 'SA-22');

    const mark = await markDocument(page);
    await reachAndClick(
      page,
      main(page).getByRole('link', {
        name: 'Open the renewal request from BITS Pilani — Hyderabad Campus',
      }),
    );
    await page.waitForURL('**/admin/requests/REQ-0038');
    // SA-03 names the request's institution.
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
    await page.goBack();
    await page.waitForURL(`**${ENDING}`);
    await expect(endingTable(page)).toBeVisible(LOAD);
    // The institution's name links to it too (it wraps in the narrow column: its href is read).
    await expect(
      endingTable(page).getByRole('link', { name: 'Konark Polytechnic', exact: true }),
    ).toHaveAttribute('href', '/admin/institutions/konark');
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Open Malnad College of Engineering' }),
    );
    await page.waitForURL('**/admin/institutions/malnad');
    await page.goBack();
    await page.waitForURL(`**${ENDING}`);
    await expect(endingTable(page)).toBeVisible(LOAD);

    // The tabs lead to the other two lists.
    await reachAndClick(page, tabs(page).nth(0));
    await page.waitForURL(`**${TRANSFERS}`);
    await expect(tabs(page)).toHaveText(['Device transfers', 'Support', 'Access ending']);
    await expect(tabs(page).nth(0)).toHaveAttribute('aria-current', 'page');
    await checkState(page, 'Operations');
    await shot(page, 'SA-18');
    await reachAndClick(page, tabs(page).nth(1));
    await page.waitForURL(`**${SUPPORT}`);
    await expect(supportTable(page)).toBeVisible(LOAD);
    await expectSameDocument(page, mark);
  });

  test('SA-07’s reminder note leads to Access ending (SA-v1 plan band, konark)', async ({
    page,
  }) => {
    await open(page, '/admin/institutions/konark');
    await expect(page.getByRole('heading', { level: 1, name: 'Konark Polytechnic' })).toBeVisible(
      LOAD,
    );
    // The plan band's warning note: when access ends, and that the reminder is a status only.
    const note = main(page).locator('.rk-plan-note--warn', { hasText: 'Reminder due' });
    await expect(note).toContainText('Ends on 2 Nov 2026');
    await expect(note).toContainText('Reminder due. Nothing is sent from here.');
    await checkState(page, 'Konark Polytechnic');
    await reachAndClick(page, note.getByRole('link', { name: 'View access ending' }));
    await page.waitForURL(`**${ENDING}`);
    await expect(endingTable(page)).toBeVisible(LOAD);
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
    const title = whatHappened.replace(/\.$/, '');
    const last = (await rows(supportTable(page))).at(-1)!;
    // Report · From · (Where: the reporter's own page) · Last activity · Status.
    expect([last[0], last[1], last[3], last[4]]).toEqual([
      `${title} Sent 23 Oct 2026`,
      'Rahul Verma Student · Godavari Institute of Technology',
      'Last activity Sent 23 Oct',
      'Open',
    ]);
    // The Super Admin's side never names the reference the reporter was given.
    await expectNoReferences(page);
    await openRow(page, `${title}, Open. Open the report`);
    await page.waitForURL(`**${SUPPORT}/${reference}`);
    await expect(panel(page)).toBeVisible(LOAD);
    const words = 'Fixed — the AR model now keeps rotating. Please try again.';
    await note(page).fill(words);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Resolve report' }));
    await expect(flash(page)).toHaveText(
      'Report resolved.Rahul Verma sees your note on their report.',
    );
    await expectNoReferences(page);

    // 3. Rahul's own report page: Resolved, with the note.
    await switchTo(page, RAHUL, '/student');
    await help(page, '/student/help');
    const row = main(page).locator('ul.xs-reports a.xs-report', { hasText: reference });
    await expect(row).toContainText('Resolved', LOAD);
    await reachAndClick(page, row);
    await page.waitForURL(`**/student/help/reports/${reference}`);
    await expect(main(page).locator('.rk-notice--ok')).toContainText(`“${words}”`, LOAD);
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Resolved');
    await expect(page.getByRole('button', { name: /reopen/i })).toHaveCount(0);

    // 4. The Super Admin reopens it (confirmed): Reopened on their side…
    await switchTo(page, ADMIN, '/admin');
    await sidebar(page, TRANSFERS);
    await reachAndClick(page, tabs(page).nth(1));
    await page.waitForURL(`**${SUPPORT}`);
    await expect(supportTable(page)).toBeVisible(LOAD);
    await chooseView(page, /^Resolved/);
    await page.waitForURL(`**${SUPPORT}?show=resolved`);
    await openRow(page, `${title}, Resolved. Open the report`);
    await page.waitForURL(`**${SUPPORT}/${reference}`);
    await expect(panel(page).getByRole('button', { name: 'Reopen' })).toBeVisible(LOAD);
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Reopen' }));
    const dialog = page.getByRole('dialog', { name: 'Reopen this report?' });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Reopen' }));
    await expect(flash(page)).toHaveText('Report reopened.It is back with the open reports.');
    await expect(main(page).locator('.rk-head .rk-meta .xr-st')).toHaveText('Reopened');

    // 5. …and on Rahul's.
    await switchTo(page, RAHUL, '/student');
    await help(page, '/student/help');
    const again = main(page).locator('ul.xs-reports a.xs-report', { hasText: reference });
    await expect(again).toContainText('Reopened', LOAD);
    await reachAndClick(page, again);
    await page.waitForURL(`**/student/help/reports/${reference}`);
    await expect(main(page)).toContainText('This report is open again', LOAD);
    await expect(main(page).locator('.rk-head .rk-meta')).toContainText('Reopened');
    await expectSameDocument(page, mark);
  });
});
