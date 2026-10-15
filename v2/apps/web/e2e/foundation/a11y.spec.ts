import { expect, test } from '@playwright/test';

import {
  actAs,
  expectNoAxeViolations,
  expectNoInvisibleFocusTargets,
  reachAndClick,
  TEST_HOOKS_URL,
} from '../support';
import { checkState, smallTargets } from '../support/screen-checks';
import {
  ACCOUNT_LINES,
  INACTIVE_STUDENT,
  openAs,
  PAUSED_INSTITUTE_ADMIN,
  roleEntry,
  SUPER_ADMIN,
  waitForShell,
} from '../support/workspace';

/**
 * Every Phase-0 screen state at 1440, 1024, 768 and 375 (Appendix F WP-0.13 acceptance 7; §7.2;
 * boards 07, 08, 10, 12; handoff README "Done"): the drawn heading and words; axe (WCAG 2.2 AA)
 * clean; a Tab walk from the top reaches no invisible focus target; targets at least 24 × 24 px
 * (WCAG 2.5.8; inline links in a sentence excepted); no developer, demo or canvas surface and
 * nothing of the rejected Slice-1 UI. "Send report" is pressed with a real pointer
 * (`reachAndClick`) at every width.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const RAHUL = roleEntry('student');

test('XS-07 My reports, with reports', async ({ page }) => {
  await openAs(page, RAHUL.person, '/student/help');
  await expect(page.locator('main.xr-page ul.xr-rows > li')).toHaveCount(1);
  await checkState(page, 'Help & support');
  // Board 07: rows open the report; status in words; at 375 the status moves under the title.
  await expect(page.locator('main .xr-status')).toHaveText('Open');
});

test('XS-07 My reports, empty', async ({ page }) => {
  await openAs(page, roleEntry('vendor').person, '/vendor/help');
  await expect(page.getByRole('heading', { level: 3, name: 'No reports yet' })).toBeVisible();
  await checkState(page, 'Help & support');
});

test('XS-07 Report a problem: form, validation, Sent — "Send report" by real pointer', async ({
  page,
}) => {
  await openAs(page, roleEntry('faculty').person, '/faculty/help/report');
  await checkState(page, 'Report a problem');
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  await expect(page.locator('main').getByRole('alert')).toBeFocused();
  await checkState(page, 'Report a problem');
  await page.getByLabel('What happened?').fill('The marking page did not open.');
  await reachAndClick(page, page.getByRole('button', { name: 'Send report' }));
  await expect(page.locator('main .xr-msg')).toBeFocused();
  await checkState(page, 'Report sent');
});

test('XS-07 Report detail: reopened, then resolved with its note', async ({ page }) => {
  const kavya = roleEntry('content_manager');
  await openAs(page, kavya.person, '/content-manager/help/reports/SUP-0207');
  await expect(page.getByText('This report is open again')).toBeVisible();
  await checkState(page, 'The preview of the WEB delivery link showed an empty frame');
  const current = await actAs<{ value: { rev: number } }>(page, kavya.person, {
    port: 'operations',
    method: 'getMyReport',
    input: 'SUP-0207',
  });
  await actAs(page, SUPER_ADMIN, {
    port: 'operations',
    method: 'resolveReport',
    input: { id: 'SUP-0207', note: 'Fixed again.', expectedRev: current.value.rev },
  });
  await expect(page.getByText(/^Resolution note · /)).toBeVisible();
  await checkState(page, 'The preview of the WEB delivery link showed an empty frame');
});

test('XS-06 Not your workspace', async ({ page }) => {
  await openAs(page, RAHUL.person, '/institute/help');
  await checkState(page, 'This page isn’t part of your workspace');
});

test('PU-15 workspace variant', async ({ page }) => {
  await openAs(page, roleEntry('super_admin').person, '/admin/operations/support');
  await checkState(page, 'We can’t find that page');
});

test('PU-15 public variant (product build)', async ({ page }) => {
  await page.goto('http://localhost:3000/no-such-page');
  await checkState(page, 'We can’t find that page');
});

test('XS-08 paused banner', async ({ page }) => {
  await openAs(page, PAUSED_INSTITUTE_ADMIN, '/institute/help');
  await expect(page.locator('.xr-banner--paused')).toBeVisible();
  await checkState(page, 'Help & support');
});

test('XS-08 inactive banner', async ({ page }) => {
  await openAs(page, INACTIVE_STUDENT, '/student/help');
  await expect(page.locator('.xr-banner--inactive')).toBeVisible();
  await checkState(page, 'Help & support');
});

test('XS-05 account menu open (keyboard)', async ({ page }) => {
  await openAs(page, roleEntry('academic_reviewer').person, '/reviewer/help');
  const button = page.getByRole('button', { name: ACCOUNT_LINES.academic_reviewer, exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.xr-menu')).toBeVisible();
  await expectNoAxeViolations(page);
  expect(await smallTargets(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
});

test('the drawer below 1024 px: focus to Close menu, background inert, Esc back to Menu (boards 06, 12)', async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) >= 1024, 'The drawer is the sidebar below 1024 px.');
  await openAs(page, RAHUL.person, '/student/help');
  await waitForShell(page);
  const menu = page.getByRole('button', { name: 'Open menu' });
  await menu.click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await expect(page.locator('div.xr-main')).toHaveAttribute('inert', '');
  await expectNoAxeViolations(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.locator('[inert]')).toHaveCount(0);
});

/** The app-width bands (board 05; WP-0.8): drawer < 1024 ≤ rail < 1280 ≤ full sidebar. */
for (const [width, band] of [
  [1023, 'drawer'],
  [1024, 'rail'],
  [1279, 'rail'],
  [1280, 'full'],
] as const) {
  test(`shell boundary at ${width} px: ${band}`, async ({ page }) => {
    test.skip(test.info().project.name !== 'chromium-1440x900', 'Sets its own width.');
    await page.setViewportSize({ width, height: 900 });
    await openAs(page, RAHUL.person, '/student/help');
    await waitForShell(page);
    const appWidth = await page
      .locator('.xr-app')
      .evaluate((element) => element.getBoundingClientRect().width);
    expect(appWidth).toBe(width);
    const menuShown = await page.getByRole('button', { name: 'Open menu' }).isVisible();
    const sideWidth = await page
      .locator('aside.xr-side')
      .evaluate((element) => element.getBoundingClientRect().width);
    if (band === 'drawer') {
      expect(menuShown).toBe(true);
    } else {
      expect(menuShown).toBe(false);
      expect(sideWidth).toBe(band === 'rail' ? 72 : 248);
      await expect(
        page.getByRole('button', { name: band === 'rail' ? 'Expand menu' : 'Collapse menu' }),
      ).toBeVisible();
    }
    await expectNoInvisibleFocusTargets(page);
    await expectNoAxeViolations(page);
  });
}
