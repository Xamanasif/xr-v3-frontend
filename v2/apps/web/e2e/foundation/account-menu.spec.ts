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
 * XS-05 Account menu in the real shell (Appendix F WP-0.13 acceptance 5; the owner-approved XS
 * export's `XsAccountMenu`): the name, role and organisation lines of board 06 for each role; Help
 * & support to that role's Help page (a client-side navigation, same world); the XS keyboard
 * contract (focus on the first item when it opens, arrows, Home/End, Escape, Tab out); "My device" for
 * the Student who holds VR only (ST-18, Phase 3), no switcher, no sign-in form; "Sign out" runs the session service, clears
 * the query cache and leaves with `reason=signed-out`.
 */
test.use({ baseURL: TEST_HOOKS_URL });

for (const entry of ROLES) {
  test(`${entry.label}: the board 06 lines, Help & support and Sign out — nothing else`, async ({
    page,
  }) => {
    await openAs(page, entry.person, `${entry.base}/help`);
    await waitForShell(page);
    const button = page.getByRole('button', { name: ACCOUNT_LINES[entry.role], exact: true });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = page.locator(`#${await button.getAttribute('aria-controls')}`);
    const lines = ACCOUNT_LINES[entry.role].replace('Account menu, ', '').split(', ');
    await expect(menu.locator('.xs-menu-head > p')).toHaveText(lines);
    // "My device" only for the Student, who holds VR here (ST-18 is built since Phase 3; B3-07 f1).
    const device = entry.role === 'student';
    await expect(menu.locator('a, button')).toHaveText([
      ...(device ? ['My device'] : []),
      'Help & support',
      'Sign out',
    ]);
    await expect(menu.getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      `${entry.base}/help`,
    );
    if (device) {
      await expect(menu.getByRole('link', { name: 'My device' })).toHaveAttribute(
        'href',
        '/student/device',
      );
    } else {
      await expect(menu).not.toContainText('My device');
    }
  });
}

test('keyboard (XS-05): Enter opens on the first item, arrows and Home/End move, Esc and Tab out close', async ({
  page,
}) => {
  await openAs(page, roleEntry('tenant_admin').person, '/institute/help');
  const button = page.getByRole('button', { name: ACCOUNT_LINES.tenant_admin, exact: true });
  const help = page.locator('.xs-menu').getByRole('link', { name: 'Help & support' });
  const signOut = page.locator('.xs-menu').getByRole('button', { name: 'Sign out' });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(help).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(signOut).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(help).toBeFocused();
  await page.keyboard.press('End');
  await expect(signOut).toBeFocused();
  await page.keyboard.press('Home');
  await expect(help).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  // ArrowDown on the closed button opens it on the first item; Tab past the last item closes it.
  await page.keyboard.press('ArrowDown');
  await expect(help).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(signOut).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  // A press outside closes it and returns focus to the button, activating nothing under it (a
  // point inside the viewport at every width, below and left of the panel).
  await button.click();
  await expect(help).toBeFocused();
  const viewport = page.viewportSize()!;
  await page.mouse.click(Math.round(viewport.width / 4), viewport.height - 40);
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await expect(page).toHaveURL(/\/institute\/help$/);
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
  await page.locator('.xs-menu').getByRole('link', { name: 'Help & support' }).click();
  await page.waitForURL('**/vendor/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await expect(page.locator('.xs-menu')).toHaveCount(0);
  await expectSameDocument(page, mark);
  const after = await inspectWorld(page);
  expect({ ...after, cachedQueries: 0 }).toEqual({ ...before, cachedQueries: 0 });
  expect(after.cachedQueries).toBeGreaterThan(before.cachedQueries); // My reports joined the cache
});

test('Sign out: the session service ends the session, the cache is cleared, the “Signed out” card shows', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-1440x900', 'One width proves the flow.');
  const rahul = roleEntry('student');
  await openAs(page, rahul.person, '/student/help');
  await expect(page.locator('main#main ul.xs-reports > li')).toHaveCount(1);
  const before = await inspectWorld(page);
  expect(before.session).toMatchObject({ status: 'signed-in', personId: 'per-0002' });
  expect(before.cachedQueries).toBeGreaterThan(0);

  await page.getByRole('button', { name: ACCOUNT_LINES.student, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();

  // The gate replaces the address with the sign-in card's "Signed out" notice (XS-03, built in
  // Package 1A) — a client-side move: the same document, the same world (ADR-0004).
  await page.waitForURL('**/sign-in?reason=signed-out');
  await expect(page.getByText('You’re signed out')).toBeVisible();
  const after = await inspectWorld(page);
  expect(after.session).toMatchObject({ status: 'signed-out' });
  // Nothing cached for Rahul's session survives; the world itself is kept (ADR-0004 option A).
  expect(after.cachedSessionKeys).not.toContain(
    (before.session as { sessionKey: string }).sessionKey,
  );
  // Signing out writes no record: the world is the same world, unchanged (ADR-0004 option A).
  expect(after.worldVersion).toBe(before.worldVersion);
  expect(after.seedId).toBe(before.seedId);
  expect(after.instance).toBe(before.instance);
  expect(after.attached).toBe(1);
  expect(page.url()).not.toContain('returnTo');
});

test('no identity UI in the workspace: no sign-in form, switcher, "Viewing as" or DEMO banner (owner constraint)', async ({
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
