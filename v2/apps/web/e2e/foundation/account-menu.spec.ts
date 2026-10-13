import { expect, test } from '@playwright/test';

import { inspectWorld, TEST_HOOKS_URL } from '../support';
import {
  ACCOUNT_LINES,
  expectSameDocument,
  markDocument,
  openAs,
  roleEntry,
  ROLES,
  waitForShell,
} from '../support/workspace';

/**
 * XS-05 Account menu in the real shell (Appendix F WP-0.13 acceptance 5; boards 05, 06, 12): the
 * name, role and organisation lines of board 06 for each role; Help to that role's Help page (a
 * client-side navigation, same world); keyboard and focus as board 12 draws them; no "My device"
 * (ST-18 is not built), no switcher, no sign-in form; "Sign out" runs the session service, clears
 * the query cache and leaves with `reason=signed-out`.
 */
test.use({ baseURL: TEST_HOOKS_URL });

for (const entry of ROLES) {
  test(`${entry.label}: the board 06 lines, Help and Sign out — nothing else`, async ({ page }) => {
    await openAs(page, entry.person, `${entry.base}/help`);
    await waitForShell(page);
    const button = page.getByRole('button', { name: ACCOUNT_LINES[entry.role], exact: true });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator(`#${await button.getAttribute('aria-controls')}`);
    const lines = ACCOUNT_LINES[entry.role].replace('Account menu: ', '').split(', ');
    await expect(menu.locator('.xr-menu-head > span')).toHaveText(lines);
    await expect(menu.locator('a, button')).toHaveText(['Help', 'Sign out']);
    await expect(menu.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      `${entry.base}/help`,
    );
    await expect(menu).not.toContainText('My device');
  });
}

test('keyboard: Enter opens, Tab moves through the items, Esc closes and returns focus (board 12)', async ({
  page,
}) => {
  await openAs(page, roleEntry('tenant_admin').person, '/institute/help');
  const button = page.getByRole('button', { name: ACCOUNT_LINES.tenant_admin, exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('.xr-menu').getByRole('link', { name: 'Help' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.xr-menu').getByRole('button', { name: 'Sign out' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
});

test('Help in the account menu: that role’s Help, client-side, the same world', async ({
  page,
}) => {
  await openAs(page, roleEntry('vendor').person, '/vendor/zz-unknown');
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  const mark = await markDocument(page);
  const before = await inspectWorld(page);
  await page.getByRole('button', { name: ACCOUNT_LINES.vendor, exact: true }).click();
  await page.locator('.xr-menu').getByRole('link', { name: 'Help' }).click();
  await page.waitForURL('**/vendor/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await expect(page.locator('.xr-menu')).toHaveCount(0);
  await expectSameDocument(page, mark);
  const after = await inspectWorld(page);
  expect({ ...after, cachedQueries: 0 }).toEqual({ ...before, cachedQueries: 0 });
  expect(after.cachedQueries).toBeGreaterThan(before.cachedQueries); // My reports joined the cache
});

test('Sign out: the session service ends the session, the cache is cleared, the gate leaves for sign-in', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-1440x900', 'One width proves the flow.');
  const rahul = roleEntry('student');
  await openAs(page, rahul.person, '/student/help');
  await expect(page.locator('main.xr-page ul.xr-rows > li')).toHaveCount(1);
  const before = await inspectWorld(page);
  expect(before.session).toMatchObject({ status: 'signed-in', personId: 'per-0002' });
  expect(before.cachedQueries).toBeGreaterThan(0);

  // Hold the sign-in address (unbuilt until XS-01, Phase 1): a 204 leaves this document in place,
  // so the tab's state after signing out can be read before the gate's document load.
  const asked: string[] = [];
  await page.route('**/sign-in**', async (route) => {
    asked.push(new URL(route.request().url()).pathname + new URL(route.request().url()).search);
    await route.fulfill({ status: 204 });
  });
  await page.getByRole('button', { name: ACCOUNT_LINES.student, exact: true }).click();
  await page.locator('.xr-menu').getByRole('button', { name: 'Sign out' }).click();

  await expect
    .poll(() => asked.some((url) => url.startsWith('/sign-in?reason=signed-out')))
    .toBe(true);
  const after = await inspectWorld(page);
  expect(after.session).toMatchObject({ status: 'signed-out' });
  // Nothing cached for Rahul's session survives; the world itself is kept (ADR-0004 option A).
  expect(after.cachedSessionKeys).not.toContain(
    (before.session as { sessionKey: string }).sessionKey,
  );
  // Signing out writes no record: the world is the same world, unchanged (ADR-0004 option A).
  expect(after.worldVersion).toBe(before.worldVersion);
  expect(after.seedId).toBe(before.seedId);
  expect(after.attached).toBe(1);
  expect(asked.every((url) => !url.includes('returnTo'))).toBe(true);

  // Let the gate go on: /sign-in shows the public not-found page until XS-01 (K-21).
  await page.unroute('**/sign-in**');
  await page.goto('/sign-in?reason=signed-out');
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  await expect(page.locator('form, input[type="password"]')).toHaveCount(0);
});

test('no identity UI anywhere: no sign-in form, switcher, "Viewing as" or DEMO banner (owner constraint)', async ({
  page,
}) => {
  await openAs(page, roleEntry('super_admin').person, '/admin/help');
  await waitForShell(page);
  await page.getByRole('button', { name: ACCOUNT_LINES.super_admin, exact: true }).click();
  await expect(page.locator('input[type="email"], input[type="password"], select')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(
    /Viewing as|Switch (account|role)|DEMO|Sign in as/i,
  );
});
