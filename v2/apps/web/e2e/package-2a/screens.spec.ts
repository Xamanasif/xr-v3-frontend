import { expect, type Page, test } from '@playwright/test';

import { bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, PAUSED_INSTITUTE_ADMIN, INACTIVE_STUDENT } from '../support/workspace';

/**
 * The Package-2A screens' drawn states on the test-hook build, at 1440, 1024, 768 and 375 (the
 * primary journey runs on the product build in `demonstration.spec.ts`). Each state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll); each dialog passes axe and keeps the keyboard inside it, Esc
 * returning focus to its trigger. The worlds are the walk's fixtures: after the setup (8 Oct:
 * students imported, no grant), after Flow B (SACC-0310 given; Deccan paused on 12 Oct) and the
 * later sample (12 Oct: a group grant overlapping Rahul's own, waits supplied for two students).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const SHELL = 'Shell-and-Tube Heat Exchanger';

async function open(
  page: Page,
  fixture: string,
  person: { readonly personId: string },
  path: string,
): Promise<void> {
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

const main = (page: Page) => page.locator('main');

/** A dialog is accessible and modal: axe, Tab stays inside, Esc closes it back to its trigger. */
async function checkDialog(page: Page, name: string | RegExp): Promise<void> {
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeVisible();
  await expectNoAxeViolations(page);
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

test.describe('Institute Admin', () => {
  test('IA-01 Overview: the attention list as the records stand, Overview current', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute');
    const attention = page.getByRole('region', { name: 'Needs your attention' });
    await expect(attention).toContainText(`${SHELL} hasn’t been given to any student`);
    await expect(attention).toContainText('11 students have no access yet');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute');
    await checkState(page, 'Overview');
  });

  test('IA-01 and IA-04 read-only while the institution is paused (B2-01 f5, B2-04 f12)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute');
    await expect(page.getByRole('region', { name: 'Needs your attention' })).toContainText(
      'BITS has paused your institution’s access',
    );
    await expect(main(page).getByRole('link', { name: 'Give students access' })).toHaveCount(0);
    await checkState(page, 'Overview');
    await reachAndClick(page, page.locator('.rk-banner').getByRole('link', { name: 'Help' }));
    await page.waitForURL('**/institute/help');
  });

  test('IA-02 Content access: no match, then Clear filters (B2-02 f7)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/content-access');
    await page.getByLabel('Search', { exact: true }).fill('Distillation');
    await expect(
      page.getByRole('heading', { name: 'No experiments match these filters' }),
    ).toBeVisible();
    await checkState(page, 'Content access');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await expect(main(page)).toContainText(SHELL);
  });

  test('IA-03 Access plan: what BITS gave, who was given it, the history (B2-03 f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/content-access/plans/ACC-0107');
    await expect(main(page)).toContainText('120 — as approved by BITS');
    await expect(page.getByRole('region', { name: 'Students you’ve given access' })).toContainText(
      'Rahul Verma',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/content-access');
    await checkState(page, 'Access plan ACC-0107');
  });

  test('IA-04 Student access: the withdraw dialog, the reason required (B2-04 f2, f3, f7)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/student-access');
    await checkState(page, 'Student access');
    const trigger = main(page).getByRole('button', {
      name: `Withdraw Rahul Verma’s access to ${SHELL}`,
    });
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('dialog', { name: 'Withdraw access?' });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw access' }));
    await expect(dialog).toContainText('Enter the reason for withdrawing access');
    await checkDialog(page, 'Withdraw access?');
    await expect(trigger).toBeFocused();
  });

  test('IA-04 Student access on the later sample: the overlap dialog says nothing about access (B2-04 f2, OD-B2-01)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/student-access');
    const trigger = main(page).getByRole('button', {
      name: `Withdraw Rahul Verma’s individual grant for ${SHELL}`,
    });
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('dialog', { name: 'Withdraw Rahul Verma’s individual grant?' });
    await expect(dialog).toContainText('doesn’t change the group grant');
    await expect(dialog).not.toContainText(/can still open|can no longer open/);
    await checkDialog(page, 'Withdraw Rahul Verma’s individual grant?');
  });

  test('IA-05 Give students access: step 1’s check (B2-05 f10)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/student-access/give');
    await expect(page.getByRole('heading', { level: 1, name: 'Choose experiments' })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/student-access');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
    await expect(main(page).getByRole('alert')).toContainText('Choose at least one experiment');
    await checkState(page, 'Choose experiments');
  });

  test('IA-06 Students: filters to no match, then the inactive student (B2-06 f2, f6)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people');
    await checkState(page, 'People');
    await page.getByLabel('Search', { exact: true }).fill('Meenakshi');
    await expect(
      page.getByRole('heading', { name: 'No students match these filters' }),
    ).toBeVisible();
    await checkState(page, 'People');
    await reachAndClick(
      page,
      main(page).locator('.xr-empty').getByRole('button', { name: 'Clear filters' }),
    );
    await page.getByLabel('Status', { exact: true }).selectOption({ label: 'Inactive' });
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await expect(main(page).locator('tbody')).toContainText('Sneha Reddy');
  });

  test('IA-08 Faculty: the tab, its rows, Add faculty member (B2-06 f14)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty');
    await expect(main(page).locator('tbody')).toContainText('Dr S. Ranganathan');
    await expect(main(page).getByRole('link', { name: 'Add faculty member' })).toHaveAttribute(
      'href',
      '/institute/people/add?type=faculty',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'People');
  });

  test('IA-07 Student record: the deactivate dialog (B2-06 f12, f13); an inactive record (f11)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/people/students/per-0002');
    await checkState(page, 'Rahul Verma');
    const trigger = main(page).getByRole('button', { name: 'Deactivate account…' });
    await reachAndClick(page, trigger);
    await checkDialog(page, 'Deactivate Rahul Verma’s account?');
    await expect(trigger).toBeFocused();
  });

  test('IA-07 an inactive student’s record offers Reactivate (B2-06 f11)', async ({ page }) => {
    await open(
      page,
      'after-setup',
      MEERA,
      `/institute/people/students/${INACTIVE_STUDENT.personId}`,
    );
    await expect(main(page).getByRole('button', { name: 'Reactivate account' })).toBeVisible();
    await expect(main(page)).toContainText('This account is inactive');
    await checkState(page, 'Sneha Reddy');
  });

  test('IA-10 Add student: the drawn checks (B2-07 f1)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/add');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
    await expect(main(page).getByRole('alert')).toBeVisible();
    await checkState(page, 'Add student');
    await page.getByLabel('Full name', { exact: true }).fill('Meenakshi Pillai');
    await page.getByLabel(/^Institution e-mail/).fill('rahul.verma@godavari.edu.in');
    await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
    await expect(main(page).getByRole('alert')).toContainText('2 things need fixing');
  });

  test('IA-10 Add faculty member (B2-07 f3)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/add?type=faculty');
    await checkState(page, 'Add faculty member');
  });
});

test.describe('Student', () => {
  test('ST-01, ST-02 and ST-19 before access (B2-10 f0, B2-11 f3, f12)', async ({ page }) => {
    await open(page, 'after-setup', RAHUL, '/student');
    await expect(main(page)).toContainText('Your institution hasn’t given you access yet');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student');
    await checkState(page, 'Hello, Rahul');
    await page.goto('/student/courses');
    await expect(main(page)).toContainText('Your institution hasn’t given you access yet');
    await checkState(page, 'My courses');
    await page.goto('/student/experiments/shell-and-tube-heat-exchanger');
    await expect(
      page.getByRole('heading', { level: 1, name: 'This experiment isn’t available to you' }),
    ).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, 'This experiment isn’t available to you');
  });

  test('ST-01 → ST-03 → ST-05 after the grant (B2-10 f1, B2-11 f0, f1, B2-12 f0)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, '/student/courses');
    await checkState(page, 'My courses');
    await reachAndClick(
      page,
      main(page)
        .getByRole('link', { name: /^Open course/ })
        .first(),
    );
    await page.waitForURL('**/student/courses/**');
    await checkState(page, 'Thermodynamics & Heat Transfer');
    await reachAndClick(page, main(page).getByRole('link', { name: `Open ${SHELL}` }));
    await page.waitForURL('**/student/experiments/shell-and-tube-heat-exchanger');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, SHELL);
  });

  test('an inactive student’s Home (B2-10 f7)', async ({ page }) => {
    await open(page, 'after-setup', INACTIVE_STUDENT, '/student');
    await expect(main(page)).toContainText('Your account is inactive');
    await checkState(page, 'Hello, Sneha');
  });
});
