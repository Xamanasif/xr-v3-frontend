import { expect, test } from '@playwright/test';

import { bootWorld, TEST_HOOKS_URL } from '../support';

/**
 * The session gate (Appendix F §3.3 notes, §5.2; ADR-0005 §5): a workspace address with nobody
 * signed in is replaced with `/sign-in?returnTo=<the address>`, which since Phase-1 Package 1A is
 * the XS-01 card (B1-09) — a client-side move, so the tab's sample world is kept (ADR-0004). No
 * shell, name or role shows on the way.
 */

test.describe('product build: nobody is ever signed in (no test hooks)', () => {
  for (const path of [
    '/student',
    '/admin/help',
    '/institute/help/reports/SUP-0213',
    '/vendor/x?y=1',
  ]) {
    test(`${path} → /sign-in?returnTo=${encodeURIComponent(path)} → the sign-in card`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForURL(`**/sign-in?returnTo=${encodeURIComponent(path)}`);
      await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
      await expect(page).toHaveTitle('Sign in · XR Learning Platform');
      // No notice: a visit without a session is not "session expired" (no expiry policy, P1-19).
      await expect(page.locator('.xp-auth-card .xr-notice')).toHaveCount(0);
      await expect(page.locator('aside, .xr-acct')).toHaveCount(0);
    });
  }
});

test.describe('test-hook build, booted signed out', () => {
  test.use({ baseURL: TEST_HOOKS_URL });

  test('the loading state, then the sign-in address with the page asked for', async ({ page }) => {
    // The server never knows the tab's session (ADR-0004): it renders the loading state only.
    const served = await page.request.get('/content-manager/help/report');
    expect(served.status()).toBe(200);
    const html = await served.text();
    expect(html).toContain('Loading …');
    expect(html).not.toContain('xr-side');
    expect(html).toContain('<title>XR Learning Platform</title>');
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await page.goto('/content-manager/help/report');
    await page.waitForURL('**/sign-in?returnTo=%2Fcontent-manager%2Fhelp%2Freport');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  });
});
