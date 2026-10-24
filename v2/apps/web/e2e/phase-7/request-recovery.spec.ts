import { type Browser, type BrowserContext, expect, type Page, test } from '@playwright/test';

import { expectHidden, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  approveRequestExternal,
  catalogue,
  decision,
  EMAIL,
  h1,
  main,
  requestShellAndTube,
  sidebar,
  signIn,
} from '../flows/product';

/**
 * The requester comes back to an external request in progress (P0 fix "external payment request
 * recovery"; owner decision, 24 Oct 2026; ADR-0009 amendment; audit CB-1 / F-01) — on the PRODUCT
 * build, the local prototype build that keeps the world in this browser (TE-6), at 1440, 1024, 768
 * and 375 wherever the requester's screens are walked:
 *
 * - CB-1 itself: after the Super Admin approves the request as External ("Approved — payment
 *   required"), a reload of the status page shows the same request; "Continue to payment" leads to
 *   Access active — one request, one institution;
 * - navigating away and back, and a tab closed and the site opened again in a new page of the same
 *   browser: Your selection says "You have a request in progress for <institution>" with "Check
 *   request status", which leads to the request and its payment;
 * - the Internal route is unchanged: Access active at once, no payment step, no line on PU-07;
 * - and nothing else opens (width-independent, proved at 1440): another browser — even one holding
 *   a copy of the saved world — sees the not-found page; "Reset demo data" ends the ticket; no other
 *   request, the reference or the ticket opens anything.
 *
 * Each test is its own browser (a Playwright context) starting from the clean world, so the
 * request is REQ-0042 and its plan ACC-0107 every time. The Super Admin decides in a tab of his own
 * at 1440 — his screens are proved at every width by their own suites.
 */

// Each test walks a request from the catalogue to its payment, with a second tab: a longer budget.
test.describe.configure({ timeout: 180_000 });
test.use({ navigationTimeout: 20_000, actionTimeout: 20_000 });

const SNAPSHOT_KEY = 'xr.sample-world';
const KEPT_KEY = 'xr.request-tickets.kept';
const GODAVARI = 'Godavari Institute of Technology';
const IN_PROGRESS = `You have a request in progress for ${GODAVARI}.`;

/** The request's status page (PU-10), its H1 being "Request REQ-0042". */
async function onStatus(page: Page, address: string): Promise<void> {
  await page.waitForURL(`**${address}`);
  await expect(h1(page)).toHaveText('Request REQ-0042');
}

/** A1 → A2 in the visitor's tab: the request sent, its status page open (Submitted). */
async function sendAndOpen(page: Page): Promise<string> {
  await page.goto('/');
  const address = await requestShellAndTube(page);
  await reachAndClick(page, page.getByRole('link', { name: 'Check request status' }));
  await onStatus(page, address);
  await expect(statusHead(page)).toContainText('Submitted');
  return address;
}

/** The Super Admin, in a tab of his own (1440) in this browser, signed in on his Overview. */
async function superAdmin(context: BrowserContext): Promise<Page> {
  const admin = await context.newPage();
  await admin.setViewportSize({ width: 1440, height: 900 });
  await admin.goto('/sign-in');
  await signIn(admin, EMAIL.arjun);
  await admin.waitForURL((url) => url.pathname === '/admin');
  return admin;
}

/** SA-03: REQ-0042 approved on the Internal route (no payment step). */
async function approveRequestInternal(admin: Page): Promise<void> {
  await reachAndClick(
    admin,
    admin.getByRole('link', {
      name: `Open the new access request from ${GODAVARI}`,
    }),
  );
  await admin.waitForURL('**/admin/requests/REQ-0042');
  const panel = decision(admin);
  await reachAndClick(admin, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(admin, panel.locator('label[for="decision-route-internal"]'));
  await reachAndClick(admin, panel.getByRole('button', { name: 'Approve request' }));
  const confirm = admin.getByRole('dialog', { name: `Approve the request from ${GODAVARI}?` });
  await reachAndClick(admin, confirm.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Access active');
}

/** From the status page: PU-12 → "Continue to payment" → PU-10 Access active (TE-4 stand-in). */
async function pay(page: Page, address: string): Promise<void> {
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await checkState(page, 'Pay for access');
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await onStatus(page, address);
  await expect(statusHead(page)).toContainText('Access active');
  await expect(statusHead(page)).toContainText('Access plan ACC-0107');
}

/** From a public page of the v46 shell: its header's "Selection" (in the menu sheet when hidden). */
async function toSelection(page: Page): Promise<void> {
  const inHeader = page.locator('header a.xp-sel');
  if (await inHeader.isVisible()) {
    await expect(inHeader).toHaveAccessibleName('Selection, empty');
    await reachAndClick(page, inHeader);
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(
      page,
      page.locator('#public-menu').getByRole('link', { name: /^Selection\b/ }),
    );
  }
  await page.waitForURL((url) => url.pathname === '/selection');
  await expect(h1(page)).toHaveText('Your selection');
}

/** PU-07's line for the request, if the page shows one. */
const inProgressNote = (page: Page) =>
  main(page).getByRole('note').filter({ hasText: 'You have a request in progress' });

/** The Super Admin's view: REQ-0042 is the only request of Godavari, and Godavari one institution. */
async function oneRequestOneInstitution(admin: Page): Promise<void> {
  await admin.bringToFront();
  await sidebar(admin, '/admin/requests');
  await expect(main(admin).locator('a[href="/admin/requests/REQ-0042"]')).toHaveCount(1);
  await expect(main(admin).locator('a[href="/admin/requests/REQ-0043"]')).toHaveCount(0);
  await sidebar(admin, '/admin/institutions');
  await expect(
    admin.getByRole('link', { name: new RegExp(`^${GODAVARI}, .*Open the institution$`) }),
  ).toHaveCount(1);
}

async function stored(page: Page, key: string): Promise<string | null> {
  return page.evaluate((name) => window.localStorage.getItem(name), key);
}

test.describe('CB-1 — the requester comes back to the same request in this browser', () => {
  test('a reload while the request is still Submitted (no decision yet): the same request, and Your selection leads back to it', async ({
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    await page.reload();
    await onStatus(page, address);
    await checkState(page, 'Request REQ-0042');
    await expect(statusHead(page)).toContainText('Submitted');
    await expect(statusHead(page)).toContainText('We’ve received your request');
    await expect(statusHead(page).getByRole('link')).toHaveCount(0);

    await page.goto('/');
    await catalogue(page);
    await toSelection(page);
    await expect(inProgressNote(page)).toHaveText(`${IN_PROGRESS} Check request status`);
    await reachAndClick(
      page,
      inProgressNote(page).getByRole('link', { name: 'Check request status' }),
    );
    await onStatus(page, address);
    await expect(statusHead(page)).toContainText('Submitted');
    // Still the one request: the Super Admin finds REQ-0042 waiting, and nothing else was sent.
    const admin = await superAdmin(context);
    await expect(main(admin).locator('a[href="/admin/requests/REQ-0042"]')).toHaveCount(1);
    await expect(main(admin).locator('a[href="/admin/requests/REQ-0043"]')).toHaveCount(0);
  });

  test('External approval, then a reload of the status page: Continue to payment → Access active (same request, one institution)', async ({
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    const admin = await superAdmin(context);
    await approveRequestExternal(admin);
    await page.bringToFront();
    await expect(statusHead(page)).toContainText('Approved — payment required');

    // The reload that stranded the institution before the fix.
    await page.reload();
    await onStatus(page, address);
    await checkState(page, 'Request REQ-0042');
    await expect(statusHead(page)).toContainText('Approved — payment required');
    await expect(statusHead(page).getByRole('link', { name: 'Continue to payment' })).toBeVisible();
    // The ticket is never in an address, nor in the saved world; it is kept beside it.
    expect(page.url()).not.toMatch(/tok-|REQ-/);
    const ticket = await stored(page, KEPT_KEY);
    const token = (JSON.parse(ticket!) as { tickets: { token: string }[] }).tickets[0]!.token;
    expect(await stored(page, SNAPSHOT_KEY)).not.toContain(token);

    await pay(page, address);
    // Reloaded once paid: Access active, the plan named, nothing to pay.
    await page.reload();
    await onStatus(page, address);
    await expect(statusHead(page)).toContainText('Access active');
    await expect(statusHead(page).getByRole('link', { name: 'Continue to payment' })).toHaveCount(
      0,
    );
    await oneRequestOneInstitution(admin);
  });

  test('navigating away and back: the status page and Your selection lead to the same request', async ({
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    const admin = await superAdmin(context);
    await approveRequestExternal(admin);
    await page.bringToFront();

    // Away to another site, and Back.
    await page.goto('about:blank');
    await page.goBack();
    await onStatus(page, address);
    await expect(statusHead(page)).toContainText('Approved — payment required');

    // Away through the product (the landing, a full page load), then Your selection.
    await page.goto('/');
    await catalogue(page);
    await toSelection(page);
    await expect(inProgressNote(page)).toHaveCount(1);
    await expect(inProgressNote(page)).toHaveText(`${IN_PROGRESS} Check request status`);
    await checkState(page, 'Your selection');
    await reachAndClick(
      page,
      inProgressNote(page).getByRole('link', { name: 'Check request status' }),
    );
    await onStatus(page, address);
    await pay(page, address);
    await oneRequestOneInstitution(admin);
  });

  test('the tab closed, the site opened again in a new page of this browser: Your selection → Check request status → pay', async ({
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    const admin = await superAdmin(context);
    await approveRequestExternal(admin);
    await page.close();

    const reopened = await context.newPage();
    await reopened.goto('/');
    await catalogue(reopened);
    await toSelection(reopened);
    const note = inProgressNote(reopened);
    await expect(note).toHaveText(`${IN_PROGRESS} Check request status`);
    await expect(note).toHaveClass(/xr-notice--quiet/);
    // Named by its institution only: no reference, address or ticket in the words.
    await expect(note).not.toContainText(/REQ-|rq-|tok-/);
    await expect(note.getByRole('link', { name: 'Check request status' })).toHaveAttribute(
      'href',
      address,
    );
    await checkState(reopened, 'Your selection');
    await reachAndClick(reopened, note.getByRole('link', { name: 'Check request status' }));
    await onStatus(reopened, address);
    await checkState(reopened, 'Request REQ-0042');
    await expect(statusHead(reopened)).toContainText('Approved — payment required');
    await pay(reopened, address);

    // Access active: no longer in progress, so Your selection says nothing of it.
    await reachAndClick(
      reopened,
      reopened.getByRole('link', { name: 'Browse experiments' }).first(),
    );
    await reopened.waitForURL((url) => url.pathname === '/experiments');
    await toSelection(reopened);
    await expect(
      reopened.getByRole('heading', { level: 2, name: 'Your selection is empty' }),
    ).toBeVisible();
    await expect(inProgressNote(reopened)).toHaveCount(0);
    await oneRequestOneInstitution(admin);
  });

  test('the Internal route is unchanged: Access active with no payment step, and no line on Your selection', async ({
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    const admin = await superAdmin(context);
    await approveRequestInternal(admin);
    await page.bringToFront();
    await page.reload();
    await onStatus(page, address);
    await expect(statusHead(page)).toContainText('Access active');
    await expect(statusHead(page)).toContainText('Access plan ACC-0107');
    await expect(statusHead(page).getByRole('link', { name: 'Continue to payment' })).toHaveCount(
      0,
    );
    await expect(page.locator('ol.xr-timeline')).not.toContainText(/Payment/);
    await page.goto('/');
    await catalogue(page);
    await toSelection(page);
    await expect(inProgressNote(page)).toHaveCount(0);
  });
});

test.describe('only this browser, only this request', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

  /** A browser of its own, holding a copy of this browser's saved world but none of its tickets. */
  async function otherBrowser(browser: Browser, saved: string | null): Promise<BrowserContext> {
    const other = await browser.newContext();
    if (saved !== null) {
      await other.addInitScript(
        ({ key, value }) => {
          if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value);
        },
        { key: SNAPSHOT_KEY, value: saved },
      );
    }
    return other;
  }

  test('another browser cannot open the status page — not even with a copy of the saved world', async ({
    browser,
    context,
    page,
  }) => {
    const address = await sendAndOpen(page);
    const admin = await superAdmin(context);
    await approveRequestExternal(admin);
    const saved = await stored(page, SNAPSHOT_KEY);
    expect(saved).toContain('REQ-0042');

    for (const copy of [null, saved]) {
      const other = await otherBrowser(browser, copy);
      const elsewhere = await other.newPage();
      await elsewhere.goto(address);
      await expectHidden(elsewhere);
      await checkState(elsewhere, 'We can’t find that page');
      await elsewhere.goto(`${address}/payment`);
      await expectHidden(elsewhere);
      await elsewhere.goto('/');
      await catalogue(elsewhere);
      await toSelection(elsewhere);
      await expect(inProgressNote(elsewhere)).toHaveCount(0);
      await other.close();
    }
    // This browser still has it.
    await page.bringToFront();
    await page.reload();
    await onStatus(page, address);
  });

  test('“Reset demo data” ends the ticket with the saved world', async ({ context, page }) => {
    const address = await sendAndOpen(page);
    expect(await stored(page, KEPT_KEY)).toContain('REQ-0042');
    const reset = await context.newPage();
    await reset.goto('/prototype/reset');
    await reachAndClick(reset, reset.getByRole('button', { name: 'Reset demo data' }));
    const dialog = reset.getByRole('dialog', { name: 'Reset demo data?' });
    await reachAndClick(reset, dialog.getByRole('button', { name: 'Reset demo data' }));
    await reset.waitForURL('**/prototype/reset?done=1');
    await expect(reset.getByText('Back to the starting state')).toBeVisible();
    expect(await stored(reset, KEPT_KEY)).toBeNull();

    // The requester's tab starts again on the clean world: the address opens nothing.
    await page.bringToFront();
    await page.waitForLoadState();
    await page.goto(address);
    await expectHidden(page);
    await page.goto('/');
    await catalogue(page);
    await toSelection(page);
    await expect(inProgressNote(page)).toHaveCount(0);
    expect(await stored(page, KEPT_KEY)).toBeNull();
  });

  test('nobody else’s request is reachable: the other requests, the reference and the ticket open nothing', async ({
    page,
  }) => {
    const address = await sendAndOpen(page);
    const ticket = await stored(page, KEPT_KEY);
    const token = (JSON.parse(ticket!) as { tickets: { token: string }[] }).tickets[0]!.token;
    await page.reload();
    await onStatus(page, address);
    const others = Array.from(
      { length: 10 },
      (_, index) => `/requests/rq-${String(index + 1).padStart(4, '0')}`,
    );
    for (const guess of [...others, '/requests/REQ-0042', `/requests/${token}`]) {
      expect(guess).not.toBe(address);
      await page.goto(guess);
      await expectHidden(page);
    }
    // Your selection names this browser's own request, and only it.
    await page.goto('/');
    await catalogue(page);
    await toSelection(page);
    await expect(inProgressNote(page)).toHaveCount(1);
    await expect(inProgressNote(page)).toContainText(GODAVARI);
    await expect(main(page).getByRole('note')).toHaveCount(1);
  });
});
