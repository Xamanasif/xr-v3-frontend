import { expect, type Page, test } from '@playwright/test';

import { reachAndClick, signInAs } from '../support';
import { checkState } from '../support/screen-checks';
import { expectSameDocument, markDocument } from '../support/workspace';

/**
 * XS-01 Sign in, XS-03 (signed out, session expired) and XS-04 (forgot password) — board B1-09 —
 * on the PRODUCT build (no test hooks), at 1440, 1024, 768 and 375 (Phase-1 Package 1A). Every
 * state passes the screen checks (axe, no invisible focus target, targets ≥ 24 px, no developer
 * or Slice-1 surface, no sideways scroll); presses are real pointer clicks (`reachAndClick`).
 * The sample rule is the owner's local one (P1-01 / DV-3): a known sample e-mail and any
 * non-empty password; nothing names an account, a role or a workspace to choose.
 */

const ARJUN = 'arjun.mehta@wilp.example';

async function card(page: Page) {
  const found = page.locator('.xp-auth-card');
  await expect(found.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  return found;
}

test('the card (B1-09 f0, f11): two ways in, XS-04, nothing to choose', async ({ page }) => {
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
  // The focused frame has no header or navigation to wander off to (AR-6). Its way back, "Back to
  // experiments", goes to the Landing (P1-17) since Package 1B built it; under the card, "Request
  // institutional access" leads to Your selection (B1-09 → B1-06) since Package 1C built it.
  await expect(page.locator('header, nav, aside')).toHaveCount(0);
  await expect(page.locator('a[href]')).toHaveCount(2);
  await expect(page.locator('.xp-auth-top a.xr-back')).toHaveAttribute('href', '/');
  await expect(page.locator('.xp-auth-top a.xr-back')).toHaveText('Back to experiments');
  await expect(page.locator('.xp-auth-links')).toHaveText(
    'Need access for your institution? Request institutional access',
  );
  await expect(
    page.locator('.xp-auth-links').getByRole('link', { name: 'Request institutional access' }),
  ).toHaveAttribute('href', '/selection');
  // XS-04: a disclosure only.
  const forgot = signIn.getByRole('button', { name: 'Forgot your password?' });
  await reachAndClick(page, forgot);
  await expect(forgot).toHaveAttribute('aria-expanded', 'true');
  await expect(
    signIn.getByText('Contact your institution administrator to reset it.'),
  ).toBeVisible();
  await checkState(page, 'Sign in');
  // Show / Hide.
  await signIn.locator('#sign-in-password').fill('secret');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Show password' }));
  await expect(signIn.locator('#sign-in-password')).toHaveAttribute('type', 'text');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Hide password' }));
  await expect(signIn.locator('#sign-in-password')).toHaveAttribute('type', 'password');
});

test('missing fields (f4), then an e-mail that is not one: the drawn words, focus to the field', async ({
  page,
}) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in', exact: true }));
  await expect(signIn.getByText('Enter your e-mail address')).toBeVisible();
  await expect(signIn.getByText('Enter your password')).toBeVisible();
  await expect(signIn.getByLabel('E-mail', { exact: true })).toBeFocused();
  await expect(signIn.getByLabel('E-mail', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await checkState(page, 'Sign in');
  await signIn.getByLabel('E-mail', { exact: true }).fill('arjun.mehta');
  await signIn.locator('#sign-in-password').fill('x');
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in', exact: true }));
  await expect(signIn.getByText('Enter an e-mail address like name@institution.edu')).toBeVisible();
  await expect(signIn.getByLabel('E-mail', { exact: true })).toBeFocused();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('wrong details (f3): the alert takes focus, password cleared, e-mail kept', async ({
  page,
}) => {
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

test('institution sign-in (f5 → f6): the unavailable notice in place of the button', async ({
  page,
}) => {
  await page.goto('/sign-in');
  const signIn = await card(page);
  await reachAndClick(page, signIn.getByRole('button', { name: 'Sign in with your institution' }));
  await expect(signIn.getByText('Institution sign-in isn’t available right now')).toBeVisible();
  await expect(signIn.getByRole('button', { name: 'Sign in with your institution' })).toHaveCount(
    0,
  );
  await expect(signIn.getByLabel('E-mail', { exact: true })).toBeFocused();
  await checkState(page, 'Sign in');
});

test('XS-03 signed out (f10) and the /signed-out address (row 21)', async ({ page }) => {
  await page.goto('/signed-out');
  await page.waitForURL('**/sign-in?reason=signed-out');
  const signIn = await card(page);
  await expect(signIn.locator('.xr-notice--ok')).toHaveText('You’re signed out');
  await checkState(page, 'Sign in');
});

test('XS-03 session expired (f9): the return address in words, then back there', async ({
  page,
}) => {
  await page.goto('/sign-in?reason=expired&returnTo=%2Fadmin%2Frequests%2FREQ-0038');
  const signIn = await card(page);
  await expect(signIn.locator('.xr-notice').first()).toContainText(
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
    // `/admin` is the interim landing: Help & support until SA-01 is built (P0-35).
    await page.waitForURL('**/admin/help');
    expect(new URL(page.url()).origin).toBe('http://localhost:3000');
  }
});
