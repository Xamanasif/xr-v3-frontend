import { expect, test } from '@playwright/test';

import { bootWorld, inspectWorld, signInAs, TEST_HOOKS_URL } from '../support';
import { ACCOUNT_LINES, expectSameDocument, markDocument } from '../support/workspace';

/**
 * Sign-in and sign-out in one tab (Phase-1 Package 1A; ADR-0003, ADR-0004; WP-0.12 session
 * store): the session is the adapter's own, each identity reads under its own query namespace, a
 * sign-out clears every answer cached for the person, and the tab keeps one document and one
 * sample world throughout. Inspected through the CI-only bridge (`inspectWorld`); the identities
 * themselves come only from typing on the XS-01 card.
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.skip(({ viewport }) => viewport?.width !== 1440, 'The session does not depend on the width.');

test('Arjun signs in, out, then Kavya: own namespaces, cache cleared, one world', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'spine-start', session: null });
  await page.goto('/admin/requests');
  await page.waitForURL('**/sign-in?returnTo=%2Fadmin%2Frequests');
  const mark = await markDocument(page);
  const start = await inspectWorld(page);
  expect(start.session.status).toBe('signed-out');

  await signInAs(page, { email: 'arjun.mehta@wilp.example' });
  await page.waitForURL('**/admin/requests');
  // SA-02 in the V3 design (SA-v1): the request table's row links.
  await expect(page.locator('table.rk-table tbody a.rk-rowlink').first()).toBeVisible();
  const arjun = await inspectWorld(page);
  expect(arjun.session).toMatchObject({ status: 'signed-in', personId: 'sa-arjun-mehta' });
  const arjunKey = (arjun.session as { sessionKey: string }).sessionKey;
  expect(arjunKey).toMatch(/^person:sa-arjun-mehta#/);
  // Every cached answer is Arjun's: the visitor's answers were dropped at sign-in.
  expect(arjun.cachedSessionKeys).toEqual([arjunKey]);
  expect(arjun.instance).toBe(start.instance);
  // Signing in writes no record.
  expect(arjun.worldVersion).toBe(start.worldVersion);

  await page.getByRole('button', { name: ACCOUNT_LINES.super_admin, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
  await expect(page.getByText('You’re signed out')).toBeVisible();
  const out = await inspectWorld(page);
  expect(out.session.status).toBe('signed-out');
  expect(out.cachedSessionKeys).not.toContain(arjunKey);

  await signInAs(page, { email: 'kavya.nair@wilp.example' });
  // Phase 5: the Content Manager's base is her home, CM-01 Overview; Phase 6 completes her
  // destinations (Updates, CM-08).
  await page.waitForURL((url) => url.pathname === '/content-manager');
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
  await expect(page.locator('aside.xr-side .xr-ws-label')).toHaveText('Content Manager');
  await expect(page.locator('aside.xr-side nav a')).toHaveCount(5);
  const kavya = await inspectWorld(page);
  const kavyaKey = (kavya.session as { sessionKey: string }).sessionKey;
  expect(kavya.session).toMatchObject({ status: 'signed-in', personId: 'per-kavya-nair' });
  expect(kavya.cachedSessionKeys).toEqual([kavyaKey]);
  expect(kavya.cachedSessionKeys).not.toContain(arjunKey);
  expect(kavya.instance).toBe(start.instance);
  expect(kavya.attached).toBe(1);
  await expectSameDocument(page, mark);

  // Arjun's requests are not Kavya's: his workspace's address is "Not your workspace".
  await page.evaluate(() => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      '/admin/requests',
    );
  });
  await expect(
    page.getByRole('heading', { name: 'This page isn’t part of your workspace' }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/REQ-0040|Konark Polytechnic/);
  await expectSameDocument(page, mark);
});
