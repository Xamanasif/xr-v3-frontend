import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { SUPER_ADMIN } from '../support/workspace';
import { addShellAndTube, panelOf, SHELL_AND_TUBE, shown } from '../package-1c/flow';

/**
 * B2B milestone I1 (owner approval, 5 Nov 2026) at 1440, 1024, 768 and 375, on the test-hook build:
 *
 * - DP-09 interim safeguard: a repeat public request from an onboarded institution — its name typed
 *   with other letter case and dashes — is held on SA-03: a warning names the existing
 *   institution with its route and an "Open <name>" link; no decision control is offered; the
 *   service holds the approval too (`policy-open` SEL-05) and nothing is written.
 * - DP-08: while the institution is paused, IA-17 offers no "Open the payment page", PU-12 opens
 *   the request status instead, and the service refuses a payment (`institution-paused`).
 * - I1-C1: SA-02's Status filter offers "Payment failed".
 */
test.use({ baseURL: TEST_HOOKS_URL });

const HYDERABAD = 'BITS Pilani — Hyderabad Campus';

/**
 * In-app navigation in the same document: the tab's world lives in the page (a reload would compose
 * a new one from the fixture), as the phase-6 suites move after a change.
 */
async function push(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
  await page.waitForURL((url) => url.pathname === href.split('?')[0], { timeout: 60_000 });
}
const MEERA = { personId: 'per-0001' };

/** A visitor of this world sends a request naming `institution` (PU-06 → PU-08 → PU-09). */
async function sendRequestAs(page: Page, institution: string): Promise<void> {
  await page.goto(SHELL_AND_TUBE);
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
  await page.waitForURL('**/request-access');
  await page.getByLabel('Institution name', { exact: true }).fill(institution);
  await page.getByLabel('Contact person', { exact: true }).fill('A. Menon');
  await page.getByLabel('E-mail', { exact: true }).fill('a.menon@hyderabad.bits-pilani.ac.in');
  await page.getByLabel('Licences requested', { exact: true }).fill('40');
  await reachAndClick(page, page.locator('label[for="request-term-2"]'));
  await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
  await page.waitForURL('**/request-access?step=review');
  await reachAndClick(page, page.getByRole('button', { name: 'Submit request' }));
  await page.waitForURL('**/request-access/sent');
}

test('DP-09: a repeat request from an onboarded institution is held on SA-03', async ({ page }) => {
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await sendRequestAs(page, 'bits pilani – hyderabad   campus');
  await switchIdentity(page, SUPER_ADMIN);
  // The first new request of the world takes the reserved reference REQ-0042.
  await push(page, '/admin/requests/REQ-0042');
  const decision = page.getByRole('complementary', { name: 'Your decision' });
  await expect(decision.locator('.rk-notice--warn')).toContainText(
    'An institution with this name already exists',
  );
  const line = `${HYDERABAD} is already on the platform (Internal). This request can’t be decided until requests can be matched to an existing institution.`;
  await expect(decision).toContainText(line);
  await expect(decision.getByRole('link', { name: `Open ${HYDERABAD}` })).toHaveAttribute(
    'href',
    '/admin/institutions/bitshyd',
  );
  await expect(decision.getByRole('radio')).toHaveCount(0);
  await expect(decision.getByRole('button')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Existing access' })).toContainText(line);
  await checkState(page, 'bits pilani – hyderabad campus');

  const read = await actAs<{ value: { request: { rev: number } } }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'getRequestForDecision',
    input: 'REQ-0042',
  });
  const held = await actAs<{
    readonly ok: boolean;
    readonly error?: { readonly kind: string; readonly decision?: string };
  }>(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'approveRequest',
    input: { id: 'REQ-0042', route: 'internal', expectedRev: read.value.request.rev },
  });
  expect(held).toMatchObject({ ok: false, error: { kind: 'policy-open', decision: 'SEL-05' } });
});

test('DP-08: no payment step while the institution is paused; PU-12 opens the status', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'after-flow-c', session: MEERA });
  await page.goto('/institute/requests');
  await expect(page.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
  const page58 = await actAs<{ value: { request: { id: string; rev: number } } }>(
    page,
    SUPER_ADMIN,
    { port: 'accessRequests', method: 'getRequestForDecision', input: 'REQ-0058' },
  );
  await actAs(page, SUPER_ADMIN, {
    port: 'accessRequests',
    method: 'approveRequest',
    input: { id: 'REQ-0058', route: null, expectedRev: page58.value.request.rev },
  });
  const godavari = await actAs<{ value: { institution: { id: string; rev: number } } }>(
    page,
    SUPER_ADMIN,
    { port: 'institutions', method: 'getInstitution', input: 'godavari' },
  );
  await actAs(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: {
      institutionId: godavari.value.institution.id,
      reason: 'Licence review.',
      expectedRev: godavari.value.institution.rev,
    },
  });

  await push(page, '/institute/requests/REQ-0058');
  const notice = page.locator('main .rk-notice--warn').first();
  await expect(notice).toContainText('Approved — payment required');
  await expect(notice).toContainText('Nothing changes until the payment is confirmed.');
  await expect(page.getByRole('link', { name: 'Open the payment page' })).toHaveCount(0);

  const view = await actAs<{ value: { routeId: string; rev: number; nextStep: string } }>(
    page,
    MEERA,
    { port: 'accessRequests', method: 'getInstitutionRequest', input: 'REQ-0058' },
  );
  expect(view.value.nextStep).toBe('none');
  // PU-12 offers no payment step now: it opens the request status instead.
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, `/requests/${view.value.routeId}/payment`);
  await page.waitForURL((url) => url.pathname === `/requests/${view.value.routeId}`, {
    timeout: 60_000,
  });
  const refused = await actAs<{ readonly ok: boolean; readonly error?: unknown }>(page, MEERA, {
    port: 'accessRequests',
    method: 'startPayment',
    input: { request: view.value.routeId, expectedRev: view.value.rev },
  });
  expect(refused).toMatchObject({
    ok: false,
    error: { kind: 'refused', code: 'institution-paused' },
  });
});

test('I1-C1: the SA-02 Status filter offers “Payment failed”', async ({ page }) => {
  await bootWorld(page, { fixture: 'spine-start', session: SUPER_ADMIN });
  await page.goto('/admin/requests');
  await expect(page.locator('table.rk-table a.rk-rowlink').first()).toBeVisible();
  // Status stays beside the search at every width (Type moves into More filters when narrow).
  const status = page.getByLabel('Status');
  await expect(status.locator('option')).toContainText([
    'All statuses',
    'Under review',
    'Information requested',
    'Approved — payment required',
    'Payment not confirmed',
    'Payment failed',
    'Access active',
  ]);
});
