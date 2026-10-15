import { expect, test } from '@playwright/test';

import { TEST_HOOKS_URL } from '../support';
import {
  expectSameDocument,
  markDocument,
  openAs,
  ROLES,
  sidebarHelp,
  waitForShell,
} from '../support/workspace';

/**
 * XS-06 "Not your workspace" for all 42 (role, other workspace) pairs, at the four widths, on the
 * real routes (Appendix F §5.2, WP-0.13 acceptance 1; ADR-0005 §5; board 08): the person's own
 * shell, the board 08 words naming their own workspace, the address unchanged, nothing current in
 * the sidebar, "Back to Home" to their own base (which reaches their Help — ADR-0005 §8) and Help
 * to their own Help; no route, role code or status code shown. "Back to Home" is followed for real:
 * a client-side navigation that keeps the tab's world.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const PAIRS = ROLES.flatMap((person) =>
  ROLES.filter((other) => other.base !== person.base).map((other) => ({ person, other })),
);

test('42 pairs: seven roles, six other workspaces each', () => {
  expect(PAIRS).toHaveLength(42);
});

for (const { person, other } of PAIRS) {
  test(`${person.label} opening ${other.base}/help: own shell, XS-06 in place`, async ({
    page,
  }) => {
    await openAs(page, person.person, `${other.base}/help`);
    await waitForShell(page);
    const heading = page.getByRole('heading', {
      level: 1,
      name: 'This page isn’t part of your workspace',
    });
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(`${TEST_HOOKS_URL}${other.base}/help`);
    await expect(page).toHaveTitle('Not your workspace · XR Learning Platform');

    const message = page.locator('main .xr-msg');
    await expect(message).toContainText(
      `You’re signed in to the ${person.label} workspace. This address belongs to a different workspace.`,
    );
    await expect(message.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      person.base,
    );
    await expect(message.getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      `${person.base}/help`,
    );
    // The person's own shell; nothing current in the sidebar; the account menu is theirs.
    await expect(page.locator('aside.xr-side')).toHaveAttribute(
      'aria-label',
      `${person.label} workspace`,
    );
    await expect(page.locator('aside.xr-side [aria-current]')).toHaveCount(0);
    await expect(sidebarHelp(page)).toHaveAttribute('href', `${person.base}/help`);
    await expect(
      page.getByRole('button', { name: new RegExp(`^Account menu: [^,]+, ${person.label}`) }),
    ).toBeAttached();
    // Nothing of the requested page, no route, role code or status code.
    await expect(page.getByRole('heading', { name: 'Help & support' })).toHaveCount(0);
    const text = (await page.locator('body').innerText()).toLowerCase();
    for (const leak of [other.base, other.role, '403', '404', 'not-permitted', 'forbidden']) {
      expect(text).not.toContain(leak.toLowerCase());
    }

    // "Back to Home": the person's own base — their Help until their home is built; the Super
    // Admin's Overview (SA-01) since Package 1D — client-side, the same world.
    const mark = await markDocument(page);
    await message.getByRole('link', { name: 'Back to Home' }).click();
    if (person.role === 'super_admin') {
      await page.waitForURL(`**${person.base}`);
      await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
      await expect(page.locator('aside.xr-side a[aria-current="page"]')).toHaveAttribute(
        'href',
        person.base,
      );
    } else {
      await page.waitForURL(`**${person.base}/help`);
      await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
      await expect(sidebarHelp(page)).toHaveAttribute('aria-current', 'page');
    }
    await expectSameDocument(page, mark);
  });
}

test.describe('leaving XS-06 shown at another role’s bare base: focus moves into the new page', () => {
  for (const action of ['Help', 'Back to Home'] as const) {
    test(`a Student at /faculty chooses ${action}`, async ({ page }) => {
      await openAs(page, ROLES[0].person, '/faculty');
      await expect(
        page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
      ).toBeVisible();
      await expect(page).toHaveURL(`${TEST_HOOKS_URL}/faculty`);
      const mark = await markDocument(page);
      await page.locator('main .xr-msg').getByRole('link', { name: action }).click();
      await page.waitForURL('**/student/help');
      await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
      await expect(page.locator('main.xr-page#main')).toBeFocused();
      await expectSameDocument(page, mark);
    });
  }
});

test.describe('the guard comes before the page and before not-found', () => {
  test.skip(({ viewport }) => viewport?.width !== 1440, 'Width-independent: one width proves it.');

  for (const path of [
    '/admin',
    '/admin/help/report',
    '/admin/help/reports/SUP-0213',
    '/admin/requests',
    '/admin/x/y',
  ]) {
    test(`a Student at ${path} sees XS-06 at that address`, async ({ page }) => {
      await openAs(page, ROLES[0].person, path);
      await expect(
        page.getByRole('heading', { level: 1, name: 'This page isn’t part of your workspace' }),
      ).toBeVisible();
      await expect(page).toHaveURL(`${TEST_HOOKS_URL}${path}`);
      await expect(page.locator('aside.xr-side')).toHaveAttribute(
        'aria-label',
        'Student workspace',
      );
    });
  }
});
