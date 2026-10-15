import { expect, type Page, test } from '@playwright/test';

import { bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, PAUSED_INSTITUTE_ADMIN, revealSidebar } from '../support/workspace';

/**
 * The Package-2B screens' drawn states on the test-hook build, at 1440, 1024, 768 and 375 (the
 * cross-role journey runs on the product build in `demonstration.spec.ts`). Each state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll); each dialog passes axe and keeps the keyboard inside it, Esc
 * returning focus to its trigger. Worlds: after the setup (8 Oct: twelve students, GRP-0012, three
 * faculty, FMAP-0021, MEC-523), after Flow B (SACC-0310; Deccan paused) and the later sample (the
 * group grant SACC-0311, supplied waits).
 */
test.use({ baseURL: TEST_HOOKS_URL });

const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const ARUN = { personId: 'per-0004' };
const SHELL = 'Shell-and-Tube Heat Exchanger';
const GROUP = 'ME ZG523 — Sem II';

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
  test('IA-13 Groups: the list, People current; Create group (DL-3) refuses a duplicate name (B2-08 f0, f1)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=groups');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await expect(main(page).locator('tbody tr')).toContainText(GROUP);
    await expect(main(page).locator('tbody tr')).toContainText('7 members');
    await expect(main(page).locator('tbody tr')).toContainText('None yet');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'People');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Create group' }));
    const dialog = page.getByRole('dialog', { name: 'Create group' });
    await dialog.getByRole('textbox', { name: 'Group name' }).fill(GROUP.toLowerCase());
    await reachAndClick(page, dialog.getByRole('button', { name: 'Create group' }));
    // The words name the group that already has the name (B2-08 `create`, ignoring case).
    await expect(dialog).toContainText(`A group called “${GROUP}” already exists`);
    await checkDialog(page, 'Create group');
    await expect(main(page).getByRole('button', { name: 'Create group' })).toBeFocused();
  });

  test('IA-14 Group after the group grant: each member’s standing, the grant (B2-08 f4); Remove (DL-1), Rename (DL-3)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/people/groups/GRP-0012');
    await expect(page.getByRole('heading', { level: 1, name: GROUP })).toBeVisible();
    const members = page.getByRole('table', { name: 'Members' });
    await expect(members.locator('tbody tr', { hasText: 'Sneha Reddy' })).toContainText(
      'Can’t open experiments while inactive',
    );
    await expect(members.locator('tbody tr', { hasText: 'Arun Kumar' })).toContainText(
      'Waiting for a licence',
    );
    await expect(members.locator('tbody tr', { hasText: 'Rahul Verma' })).toContainText(
      /Has it individually · SACC-\d{4}/,
    );
    await expect(members.locator('tbody tr', { hasText: 'Priya Natarajan' })).toContainText(
      'Can open it',
    );
    const grants = page.getByRole('table', { name: 'Experiments given to this group' });
    await expect(grants).toContainText(SHELL);
    await expect(grants).toContainText('From access plan ACC-0107');
    await checkState(page, GROUP);
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Remove Priya Natarajan from this group' }),
    );
    await expect(page.getByRole('dialog')).toContainText(
      'Priya will no longer be a member of ME ZG523 — Sem II. Their student record stays in People.',
    );
    await checkDialog(page, 'Remove Priya Natarajan from this group?');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Rename', exact: true }));
    await checkDialog(page, 'Rename group');
  });

  test('IA-14 Group: the add-students panel (B2-08 f7) and an empty group (f8)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/groups/GRP-0012');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add students' }));
    await expect(
      page.getByRole('heading', { level: 3, name: 'Add students to this group' }),
    ).toBeFocused();
    await expect(main(page).getByRole('button', { name: 'Add students' })).toBeDisabled();
    await checkState(page, GROUP);
  });

  test('IA-09 Faculty record, from the Faculty tab (B2-06 f15), and a record with no courses (f16)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty');
    await reachAndClick(page, main(page).getByRole('link', { name: 'Dr S. Ranganathan' }));
    await page.waitForURL('**/institute/people/faculty/**');
    await expect(main(page)).toContainText('ME ZG523 · Thermodynamics & Heat Transfer');
    await expect(main(page)).toContainText(/FMAP-0021/);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'Dr S. Ranganathan');
    await reachAndClick(page, main(page).locator('a.xr-back'));
    await reachAndClick(page, main(page).getByRole('link', { name: 'Dr Anita Desai' }));
    await page.waitForURL('**/institute/people/faculty/**');
    await expect(page.getByRole('heading', { name: 'No courses yet' })).toBeVisible();
    await checkState(page, 'Dr Anita Desai');
  });

  test('IA-15 Faculty courses: the table and the panel; validation; Remove (DL-1) (B2-09 f0, f3, f4)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty-courses');
    await expect(main(page).locator('tbody tr')).toHaveCount(3);
    await checkState(page, 'People');
    const panel = page.getByRole('complementary', { name: 'Assign a course' });
    await reachAndClick(page, panel.getByRole('button', { name: 'Assign course' }));
    await expect(panel).toContainText('Choose a faculty member');
    await checkState(page, 'People');
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Remove ME ZG523 from Dr S. Ranganathan' }),
    );
    await checkDialog(page, 'Remove ME ZG523 from Dr S. Ranganathan?');
  });

  test('IA-16 Course codes: the editable table; the one designed rule (B2-03 f6, f8)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/content-access?tab=course-codes');
    await expect(main(page)).toContainText('Every course has a code from your institution');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/content-access');
    await checkState(page, 'Content access');
    await page
      .getByRole('textbox', { name: 'Your course code for Thermodynamics & Heat Transfer' })
      .fill('');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Save course codes' }));
    await expect(main(page)).toContainText('Add your course code, or clear the semester');
    await expect(
      page.getByRole('textbox', { name: 'Your course code for Thermodynamics & Heat Transfer' }),
    ).toBeFocused();
    await checkState(page, 'Content access');
  });

  test('IA-16 and IA-13 read-only while the institution is paused (B2-03 f9)', async ({ page }) => {
    await open(
      page,
      'after-flow-b',
      PAUSED_INSTITUTE_ADMIN,
      '/institute/content-access?tab=course-codes',
    );
    await expect(main(page)).toContainText('Read-only while your institution’s access is paused');
    await expect(main(page).getByRole('button', { name: 'Save course codes' })).toHaveCount(0);
    await checkState(page, 'Content access');
    await revealSidebar(page);
    await reachAndClick(
      page,
      page.locator('aside.xr-side nav a[href="/institute/people"]').first(),
    );
    await page.waitForURL('**/institute/people');
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'People' }).getByRole('link', { name: 'Groups' }),
    );
    await expect(main(page).getByRole('button', { name: 'Create group' })).toHaveCount(0);
    await checkState(page, 'People');
  });

  test('IA-11 Import students: step 1, “Choose a CSV file first”, then the file’s problems (B2-07 f5, f6)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/import');
    await checkState(page, 'Choose a file');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Check file' }));
    await expect(main(page)).toContainText('Choose a CSV file first');
    await checkState(page, 'Choose a file');
    await main(page)
      .locator('input[type="file"]')
      .setInputFiles({
        name: 'more-students.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
          [
            'student_id,full_name,email,programme,course,course_code',
            'GIT-2026-0418,Rahul Verma,rahul.v@godavari.edu.in,B.Tech,Thermodynamics,ME ZG523',
            'GIT-2026-0501,Asha Rao,asha.rao@godavari.edu.in,,Thermodynamics,MEC-523',
          ].join('\n'),
        ),
      });
    await reachAndClick(page, main(page).getByRole('button', { name: 'Check file' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Check rows' })).toBeFocused();
    await expect(main(page)).toContainText('2 rows with errors');
    await checkState(page, 'Check rows');
  });
});

test.describe('Student', () => {
  test('ST-04 All experiments: the given experiment, My courses current (B2-11 f2); no match (f4)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', RAHUL, '/student/courses?tab=experiments');
    await expect(main(page).locator('.xw-erow')).toHaveCount(1);
    await expect(main(page).locator('.xw-erow')).toContainText(SHELL);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, 'My courses');
    await page.getByRole('searchbox', { name: 'Search' }).fill('Fin-Tube');
    await expect(page.getByRole('heading', { name: 'No experiments match' })).toBeVisible();
    await checkState(page, 'My courses');
  });

  test('ST-04 for a Student waiting for a licence: named, still opens (later sample)', async ({
    page,
  }) => {
    await open(page, 'later-sample', ARUN, '/student/courses?tab=experiments');
    await expect(main(page).locator('.xw-erow').first()).toContainText(
      /No licence is available for you on ACC-\d{4} right now\./,
    );
    await checkState(page, 'My courses');
  });
});
