import { expect, type Page, test } from '@playwright/test';

import { actAs, expectNoAxeViolations, TEST_HOOKS_URL } from '../support';
import {
  INACTIVE_STUDENT,
  openAs,
  PAUSED_INSTITUTE_ADMIN,
  roleEntry,
  ROLES,
  SUPER_ADMIN,
  waitForShell,
} from '../support/workspace';

/**
 * XS-08 paused and inactive banners in the real shell, from the shared world (Appendix F WP-0.13
 * acceptance 3; boards 05, 08; B7-04), at the four widths: the drawn words and colours,
 * `role="status"`, never modal, Help to the person's own Help. The state changes only through
 * port commands run as the Super Admin (`actAs`) or as the walk left it; no policy is bent.
 */
test.use({ baseURL: TEST_HOOKS_URL });

const PAUSED = 'Your institution’s access is paused — your work is kept.';
const INACTIVE = 'Your account is inactive. Contact your institution administrator.';

async function setGodavari(page: Page, paused: boolean): Promise<void> {
  const found = await actAs<{ ok: boolean; value: { institution: { id: string; rev: number } } }>(
    page,
    SUPER_ADMIN,
    { port: 'institutions', method: 'getInstitution', input: 'godavari' },
  );
  const { id, rev } = found.value.institution;
  expect(
    await actAs(page, SUPER_ADMIN, {
      port: 'institutions',
      method: paused ? 'pauseInstitution' : 'restoreInstitution',
      input: {
        institutionId: id,
        reason: paused ? 'Checking the student list.' : 'The student list is checked.',
        expectedRev: rev,
      },
    }),
  ).toMatchObject({ ok: true });
}

async function expectBanner(page: Page, kind: 'paused' | 'inactive', help: string): Promise<void> {
  const banner = page.locator('.xr-banner');
  await expect(banner).toHaveCount(1);
  await expect(banner).toHaveAttribute('role', 'status');
  await expect(banner).toContainText(kind === 'paused' ? PAUSED : INACTIVE);
  await expect(banner.getByRole('link', { name: 'Help' })).toHaveAttribute('href', help);
  // Board 04/05 colours: amber paused (#FBF3E0 on #12173F, #E8D3A3 rule), navy inactive (#0C1247).
  const look = await banner.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      color: style.color,
      border: style.borderBottomColor,
    };
  });
  expect(look).toEqual(
    kind === 'paused'
      ? { background: 'rgb(251, 243, 224)', color: 'rgb(18, 23, 63)', border: 'rgb(232, 211, 163)' }
      : { background: 'rgb(12, 18, 71)', color: 'rgb(255, 255, 255)', border: 'rgb(12, 18, 71)' },
  );
  // Below the top bar, above the page, and never modal: nothing inert, no dialog.
  expect(
    await banner.evaluate(
      (element) => element.previousElementSibling?.matches('header.xr-top') ?? false,
    ),
  ).toBe(true);
  await expect(
    page.locator('dialog[open], [role="dialog"], [aria-modal="true"], [inert]'),
  ).toHaveCount(0);
}

for (const role of ['student', 'faculty', 'tenant_admin'] as const) {
  const entry = roleEntry(role);
  test(`Godavari paused by the Super Admin: the ${entry.label} sees the paused banner; restored, it goes`, async ({
    page,
  }) => {
    await openAs(page, entry.person, `${entry.base}/help`);
    await waitForShell(page);
    await expect(page.locator('.xr-banner')).toHaveCount(0);
    await setGodavari(page, true);
    await expectBanner(page, 'paused', `${entry.base}/help`);
    // The page stays usable under the banner (Faculty: the banner only, OD-B7-07).
    await page.locator('main').getByRole('link', { name: 'Report a problem' }).click();
    await page.waitForURL(`**${entry.base}/help/report`);
    await expectBanner(page, 'paused', `${entry.base}/help`);
    await expectNoAxeViolations(page);
    await setGodavari(page, false);
    await expect(page.locator('.xr-banner')).toHaveCount(0);
  });
}

test('the banner’s Help is the person’s own Help, reached client-side', async ({ page }) => {
  await openAs(page, PAUSED_INSTITUTE_ADMIN, '/institute/zz-unknown');
  await expectBanner(page, 'paused', '/institute/help');
  await page.locator('.xr-banner').getByRole('link', { name: 'Help' }).click();
  await page.waitForURL('**/institute/help');
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
});

test('an inactive Student: the navy inactive banner, distinct from paused', async ({ page }) => {
  await openAs(page, INACTIVE_STUDENT, '/student/help');
  await waitForShell(page);
  await expectBanner(page, 'inactive', '/student/help');
  await expect(page.locator('.xr-banner')).toHaveClass(/xr-dark/);
  await expectNoAxeViolations(page);
});

test('a Student deactivated by the Institute Admin while signed in sees the inactive banner', async ({
  page,
}) => {
  const rahul = roleEntry('student');
  await openAs(page, rahul.person, '/student/help');
  await waitForShell(page);
  const student = await actAs<{ ok: boolean; value: { student: { rev: number } } }>(
    page,
    roleEntry('tenant_admin').person,
    { port: 'people', method: 'getStudent', input: 'per-0002' },
  );
  expect(student.ok).toBe(true);
  const answer = await actAs(page, roleEntry('tenant_admin').person, {
    port: 'people',
    method: 'deactivateStudent',
    input: {
      id: 'per-0002',
      reason: 'Left the programme.',
      expectedRev: student.value.student.rev,
    },
  });
  expect(answer).toMatchObject({ ok: true });
  await expectBanner(page, 'inactive', '/student/help');
});

test('the platform roles never see an institution banner, even while Godavari is paused', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-1440x900', 'Width-independent: one width.');
  for (const role of ['vendor', 'academic_reviewer', 'content_manager', 'super_admin'] as const) {
    const entry = ROLES.find((candidate) => candidate.role === role)!;
    const tab = await page.context().newPage();
    await openAs(tab, entry.person, `${entry.base}/help`);
    await waitForShell(tab);
    await setGodavari(tab, true);
    await expect(tab.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
    await expect(tab.locator('.xr-banner')).toHaveCount(0);
    await tab.close();
  }
});
