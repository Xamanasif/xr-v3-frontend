import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { SUPER_ADMIN } from '../support/workspace';
import { expectHidden, openInTab, sendRequest, statusHead } from './flow';

/**
 * Who may open a request's pages (owner decisions DV-5 / O-05, 14 Oct 2026; ADR-0009): the browser
 * session that sent it, by the ticket it holds for the user session that sent it, or the signed-in
 * Institute Admin of the requesting institution — decided by the service, never by hiding links.
 * Anyone else sees the public not-found page and nothing of the request: another tab, a reloaded
 * tab, a forged or copied ticket, the reference or the ticket typed as an address, another person
 * signed in to the same tab, another institution's Institute Admin. Test-hook build (boot
 * descriptors, `switchIdentity`, `actAs`), except the server check, which reads the product build.
 */

const KAVYA = { personId: 'per-kavya-nair' } as const;
const BHATT = { personId: 'per-r-bhatt' } as const;
const SRINIVAS = { personId: 'per-p-srinivas' } as const;
const TICKETS_KEY = 'xr.request-tickets.v2';

test.describe('the product build', () => {
  test.skip(
    ({ viewport }) => viewport?.width !== 1440,
    'Server answers: the viewport does not matter.',
  );

  test('the server answers no request at any request address (client-rendered, TE-8 mechanism)', async ({
    request,
  }) => {
    for (const address of ['/requests/rq-0001', '/requests/rq-0011', '/requests/rq-0001/payment']) {
      const response = await request.get(address, { maxRedirects: 0 });
      expect(response.status(), address).toBe(200);
      const html = await response.text();
      expect(html, address).not.toMatch(/REQ-\d{4}|Konark|Deccan|Godavari|Meera|tok-\d/);
    }
  });
});

test.describe('the test-hook build', () => {
  test.use({ baseURL: TEST_HOOKS_URL });

  async function sendFromNewTab(page: Page): Promise<string> {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await page.goto('/');
    return sendRequest(page);
  }

  test('the sending tab reads it; the reference and the ticket are not addresses (V-17)', async ({
    page,
  }) => {
    const address = await sendFromNewTab(page);
    const [ticket] = await page.evaluate(
      (key) => JSON.parse(sessionStorage.getItem(key) ?? '[]') as { token: string }[],
      TICKETS_KEY,
    );
    expect(ticket?.token).toMatch(/\S/);
    expect(address).not.toContain(ticket!.token);

    await openInTab(page, address);
    await expect(statusHead(page)).toContainText('Submitted');
    for (const guess of ['/requests/REQ-0042', `/requests/${ticket!.token}`, '/requests/rq-9999']) {
      await openInTab(page, guess);
      await expectHidden(page);
    }
    await checkState(page, 'We can’t find that page');
  });

  test('another tab, a reloaded tab, a copied or forged ticket: the public not-found page', async ({
    page,
    context,
  }) => {
    const address = await sendFromNewTab(page);
    const stored = await page.evaluate((key) => sessionStorage.getItem(key), TICKETS_KEY);

    // A tab opened from this one starts with a copy of its session storage — and its own world:
    // the copied ticket belongs to another world and opens nothing.
    const [opened] = await Promise.all([
      context.waitForEvent('page'),
      page.evaluate((href) => void window.open(href, '_blank'), address),
    ]);
    await opened.waitForLoadState();
    await expectHidden(opened);
    expect(await opened.evaluate((key) => sessionStorage.getItem(key), TICKETS_KEY)).toBe('[]');
    await opened.close();

    // Another tab with the ticket planted as it was stored, and with a forged one.
    const other = await context.newPage();
    await other.addInitScript(({ key, value }) => sessionStorage.setItem(key, value), {
      key: TICKETS_KEY,
      value: JSON.stringify([
        ...(JSON.parse(stored ?? '[]') as unknown[]),
        { world: 'world-guess', token: 'tok-0001', holder: 'visitor' },
      ]),
    });
    await bootWorld(other, { fixture: 'spine-start', session: null });
    await other.goto(address);
    await expectHidden(other);
    await checkState(other, 'We can’t find that page');
    await other.close();

    // This tab, reloaded at the request's address: a new world from the seed; the old ticket has
    // expired and is dropped.
    await openInTab(page, address);
    await expect(statusHead(page)).toContainText('Submitted');
    await page.reload();
    await expectHidden(page);
    expect(await page.evaluate((key) => sessionStorage.getItem(key), TICKETS_KEY)).toBe('[]');
  });

  test('another person signed in to this tab sees nothing of it; signed out, the tab’s visitor has it back', async ({
    page,
  }) => {
    const address = await sendFromNewTab(page);
    await openInTab(page, address);
    await expect(statusHead(page)).toContainText('Submitted');

    // The Content Manager signs in to this tab (CI-only same-tab switch, WP-0.14).
    await switchIdentity(page, KAVYA);
    await expectHidden(page);
    await openInTab(page, `${address}/payment`);
    await expectHidden(page);

    // Another institution's Institute Admin, in the same tab.
    await switchIdentity(page, BHATT);
    await openInTab(page, address);
    await expectHidden(page);

    // Signed out through the product's own account menu: the tab's visitor reads it again.
    await openInTab(page, '/institute/help');
    await page.getByRole('button', { name: /^Account menu, R\. Bhatt/ }).click();
    await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/sign-in?reason=signed-out');
    await openInTab(page, address);
    await expect(statusHead(page)).toContainText('Submitted');
  });

  test('the Institute Admin of the requesting institution reads its requests; another institution’s, never', async ({
    page,
    context,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: BHATT });
    await page.goto('/institute/help');
    const routeOf = async (reference: string) =>
      (
        await actAs<{ ok: true; value: { request: { routeId: string } } }>(page, SUPER_ADMIN, {
          port: 'accessRequests',
          method: 'getRequestForDecision',
          input: reference,
        })
      ).value.request.routeId;
    const konark = await routeOf('REQ-0040');
    const hyderabad = await routeOf('REQ-0039');

    await openInTab(page, `/requests/${konark}`);
    await checkState(page, 'Request REQ-0040');
    await expect(page.locator('main')).toContainText('Konark Polytechnic');
    await openInTab(page, `/requests/${hyderabad}`);
    await expectHidden(page);

    // BITS Pilani — Hyderabad Campus's own Institute Admin: the internal route, no payment step.
    const srinivas = await context.newPage();
    await bootWorld(srinivas, { fixture: 'spine-start', session: SRINIVAS });
    await srinivas.goto(`/requests/${hyderabad}`);
    await checkState(srinivas, 'Request REQ-0039');
    await expect(statusHead(srinivas)).toContainText('Access active');
    await expect(statusHead(srinivas)).toContainText('Access plan ACC-0098');
    await expect(srinivas.locator('ol.xr-timeline')).not.toContainText(/Payment/);
    await reachAndClick(srinivas, statusHead(srinivas).getByRole('link', { name: 'Sign in' }));
    await srinivas.waitForURL('**/sign-in');
    await srinivas.close();
  });

  test('nobody else starts the payment: refused by the service, nothing written', async ({
    page,
  }) => {
    const address = await sendFromNewTab(page);
    const opened = await actAs<{ ok: true; value: { request: { rev: number; routeId: string } } }>(
      page,
      SUPER_ADMIN,
      { port: 'accessRequests', method: 'getRequestForDecision', input: 'REQ-0042' },
    );
    await actAs(page, SUPER_ADMIN, {
      port: 'accessRequests',
      method: 'approveRequest',
      input: { id: 'REQ-0042', route: 'external', expectedRev: opened.value.request.rev },
    });
    const routeId = address.replace('/requests/', '');
    for (const person of [BHATT, KAVYA, SUPER_ADMIN]) {
      const answer = await actAs<{ ok: boolean; error?: { kind: string } }>(page, person, {
        port: 'accessRequests',
        method: 'startPayment',
        input: { request: routeId, expectedRev: opened.value.request.rev + 1 },
      });
      expect(answer.ok, person.personId).toBe(false);
      // Answered as an address that names nothing: no one learns the request exists (O-05).
      expect(answer.error?.kind, person.personId).toBe('not-found');
    }
    await openInTab(page, address);
    await expect(statusHead(page)).toContainText('Approved — payment required');
  });
});
