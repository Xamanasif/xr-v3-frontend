import { expect, test } from '@playwright/test';

import { bootWorld, TEST_HOOKS_URL } from '../support';

/**
 * The session gate (Appendix F §3.3 notes, §5.2; ADR-0005 §5; K-21): a workspace address with
 * nobody signed in is replaced with `/sign-in?returnTo=<the address>`. The sign-in page is Phase 1
 * (G-8), so that address shows the public not-found page — the expected state of a Phase-0
 * engineering build without a CI boot descriptor; the build is not for an unauthenticated
 * stakeholder walk-through. No shell, name or role shows on the way.
 */

test.describe('product build: nobody is ever signed in (no test hooks)', () => {
  for (const path of [
    '/student',
    '/admin/help',
    '/institute/help/reports/SUP-0213',
    '/vendor/x?y=1',
  ]) {
    test(`${path} → /sign-in?returnTo=${encodeURIComponent(path)} → the public not-found page`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForURL(`**/sign-in?returnTo=${encodeURIComponent(path)}`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
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
    await expect(
      page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });
});
