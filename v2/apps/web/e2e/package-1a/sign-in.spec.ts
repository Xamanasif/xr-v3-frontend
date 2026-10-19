import { expect, type Page, test } from '@playwright/test';

import { PRODUCT_URL, reachAndClick, signInAs } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument } from '../support/workspace';

/**
 * XS-01 Sign in, XS-03 (signed out, session expired) and XS-04 (forgot password, first time) — the
 * owner-approved Entry & shared design (design/v3-refined-b/roles/XS-v6, `XsSignIn`; B1-09's words)
 * — on the PRODUCT build (no test hooks), at 1440, 1024, 768 and 375 (Phase-1 Package 1A). Every
 * state passes the screen checks (axe, no invisible focus target, targets ≥ 24 px, no developer
 * or Slice-1 surface, no sideways scroll); presses are real pointer clicks (`reachAndClick`).
 * The sample rule is the owner's local one (P1-01 / DV-3): a known sample e-mail and any
 * non-empty password; nothing names an account, a role or a workspace to choose.
 */

const ARJUN = 'arjun.mehta@wilp.example';

async function card(page: Page) {
  const found = page.locator('.xs-card');
  await expect(found.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  return found;
}

test('the card (XS default): two ways in, XS-04, nothing to choose', async ({ page }) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await checkState(page, 'Sign in');
  await expect(page).toHaveTitle('Sign in · XR Learning Platform');
  await expect(signIn.getByRole('button', { name: 'Sign in with your institution' })).toBeVisible();
  await expect(signIn.getByText('or sign in with e-mail')).toBeVisible();
  await expect(signIn.getByRole('button', { name: 'Show password' })).toBeVisible();
  await expect(page.locator('select, [role="listbox"], [role="combobox"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(
    /DEMO|Viewing as|Sign in as|@wilp\.example/i,
  );
  // The page has no navigation to wander off to: its top row holds the one way back, "Back to
  // experiments", to the public catalogue (PU-04, the XS link map); the card's foot, "Request
  // institutional access", to the request form (PU-08), which sends a visitor with nothing
  // selected to Your selection first. Under the card, the prototype line names no account.
  await expect(page.locator('nav, aside')).toHaveCount(0);
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('a[href]')).toHaveCount(2);
  await expect(page.locator('header.xs-entry-top a.xs-back')).toHaveAttribute(
    'href',
    '/experiments',
  );
  await expect(page.locator('header.xs-entry-top a.xs-back')).toHaveText('Back to experiments');
  await expect(page.locator('.xs-card-foot')).toHaveText(
    'Need access for your institution? Request institutional access',
  );
  await expect(
    page.locator('.xs-card-foot').getByRole('link', { name: 'Request institutional access' }),
  ).toHaveAttribute('href', '/request-access');
  await expect(page.locator('.xs-proto')).toContainText('Prototype sign-in.');
  // XS-04: two disclosures, a contact route only.
  const forgot = signIn.getByRole('button', { name: 'Forgot your password?' });
  await reachAndClick(page, forgot);
  await expect(forgot).toHaveAttribute('aria-expanded', 'true');
  await expect(
    signIn.getByText('Contact your institution administrator to reset it.'),
  ).toBeVisible();
  const firstTime = signIn.getByRole('button', { name: 'First time signing in?' });
  await reachAndClick(page, firstTime);
  await expect(
    signIn.getByText(
      'Contact your institution administrator to find out how to sign in for the first time.',
    ),
  ).toBeVisible();
  await checkState(page, 'Sign in');
  // Show / Hide.
  await signIn.locator('#sign-in-password').fill('secret');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Show password' }));
  await expect(signIn.locator('#sign-in-password')).toHaveAttribute('type', 'text');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Hide password' }));
  await expect(signIn.locator('#sign-in-password')).toHaveAttribute('type', 'password');
});

test('missing details, then an e-mail that is not one: the summary takes focus, links each field', async ({
  page,
}) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in', exact: true }));
  const summary = signIn.getByRole('alert');
  await expect(summary).toContainText('Check your sign-in details');
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('link')).toHaveText([
    'Enter your e-mail address',
    'Enter your password',
  ]);
  await reachAndClick(page, summary.getByRole('link', { name: 'Enter your password' }));
  await expect(signIn.locator('#sign-in-password')).toBeFocused();
  await reachAndClick(page, summary.getByRole('link', { name: 'Enter your e-mail address' }));
  await expect(signIn.getByLabel('E-mail', { exact: true })).toBeFocused();
  await expect(signIn.getByLabel('E-mail', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await checkState(page, 'Sign in');
  await signIn.getByLabel('E-mail', { exact: true }).fill('arjun.mehta');
  await signIn.locator('#sign-in-password').fill('x');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in', exact: true }));
  await expect(
    signIn.locator('.rk-ferr', { hasText: 'Enter an e-mail address like name@institution.edu' }),
  ).toBeVisible();
  await expect(signIn.getByRole('alert')).toBeFocused();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('wrong details: the refusal takes focus, password cleared, e-mail kept', async ({ page }) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await signIn.getByLabel('E-mail', { exact: true }).fill('someone@godavari.edu.in');
  await signIn.locator('#sign-in-password').fill('anything');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in', exact: true }));
  const alert = signIn.getByRole('alert');
  await expect(alert).toContainText('The e-mail or password isn’t right');
  await expect(alert).toBeFocused();
  await expect(signIn.locator('#sign-in-password')).toHaveValue('');
  await expect(signIn.getByLabel('E-mail', { exact: true })).toHaveValue('someone@godavari.edu.in');
  await checkState(page, 'Sign in');
});

test('institution sign-in: the unavailable notice in place of the button, focused', async ({
  page,
}) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in with your institution' }));
  const notice = signIn.locator('.rk-notice', {
    hasText: 'Institution sign-in isn’t available right now',
  });
  await expect(notice).toBeVisible();
  await expect(signIn.getByRole('button', { name: 'Sign in with your institution' })).toHaveCount(
    0,
  );
  await expect(notice).toBeFocused();
  await checkState(page, 'Sign in');
});

test('XS-03 signed out (f10) and the /signed-out address (row 21)', async ({ page }) => {
  await page.goto('/signed-out');
  await page.waitForURL('**/sign-in?reason=signed-out');
  const signIn = await card(page);
  await expect(signIn.locator('.rk-notice--ok')).toHaveText('You’re signed out');
  await expect(signIn.locator('.rk-notice--ok')).toBeFocused();
  await checkState(page, 'Sign in');
});

test('XS-03 session expired (f9): the return address in words, then back there', async ({
  page,
}) => {
  await page.goto('/sign-in?reason=expired&returnTo=%2Fadmin%2Frequests%2FREQ-0038');
  const signIn = await card(page);
  await expect(signIn.locator('.rk-notice').first()).toContainText(
    'Sign in again to go back to where you were: Requests › REQ-0038.',
  );
  await checkState(page, 'Sign in');
  const mark = await markDocument(page);
  await signInAs(page, { email: ARJUN });
  await page.waitForURL('**/admin/requests/REQ-0038');
  await expect(
    page.getByRole('heading', { level: 1, name: 'BITS Pilani — Hyderabad Campus' }),
  ).toBeVisible();
  // Signing in moved within the document: the tab's sample world is kept (ADR-0004).
  await expectSameDocument(page, mark);
  // After signing in, focus is in the workspace's main content.
  await expect(page.locator('main.xr-page#main')).toBeFocused();
});

test('open redirects and other workspaces are refused: the person’s own base instead', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-1440x900', 'One width proves the rule.');
  for (const returnTo of ['https://evil.example/admin', '//evil.example/admin', '/student/help']) {
    await page.goto(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
    await signInAs(page, { email: ARJUN });
    // `/admin` is SA-01 Overview since Package 1D (before, the interim landing: Help, P0-35).
    await page.waitForURL('**/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(new URL(page.url()).origin).toBe(PRODUCT_URL);
  }
});
