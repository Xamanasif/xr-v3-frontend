import { expect, type Page, test } from '@playwright/test';

import { bootWorld, expectNoAxeViolations, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  PAUSED_INSTITUTE_ADMIN,
  revealSidebar,
  sidebarLink,
} from '../support/workspace';

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

/** Every internal record reference the Institute Admin's pages keep out of their words. */
const IA_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the page's words, names, placeholders or tab title (identifier rule). */
async function expectNoIaReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label], [title], [placeholder]')].flatMap(
      (element) =>
        ['aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name) ?? ''),
    );
    return [document.querySelector('main')?.textContent ?? '', document.title, ...named].filter(
      (text) => pattern.test(text),
    );
  }, IA_REFERENCE.source);
  expect(found).toEqual([]);
}

/**
 * A dialog is accessible and modal: axe, Tab stays inside, Esc closes it back to its trigger. A
 * destructive one is an `alertdialog` (IA-v1: Remove from group).
 */
async function checkDialog(
  page: Page,
  name: string | RegExp,
  role: 'dialog' | 'alertdialog' = 'dialog',
): Promise<void> {
  const dialog = page.getByRole(role, { name });
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
  test('IA-13 Groups: the list, People current; Create group (DL-3) refuses a duplicate name (IA-v1 IA-13)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=groups');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await expect(main(page).locator('tbody tr')).toContainText(GROUP);
    await expect(main(page).locator('tbody tr')).toContainText('7 members');
    await expect(main(page).locator('tbody tr')).toContainText('None yet');
    await expect(main(page).getByRole('link', { name: `Open group ${GROUP}` })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'People');
    await expectNoIaReferences(page);
    await reachAndClick(page, main(page).getByRole('button', { name: 'Create group' }));
    const dialog = page.getByRole('dialog', { name: 'Create group' });
    await expect(dialog.getByRole('textbox', { name: 'Group name' })).toBeFocused();
    await dialog.getByRole('textbox', { name: 'Group name' }).fill(GROUP.toLowerCase());
    await reachAndClick(page, dialog.getByRole('button', { name: 'Create group' }));
    // The words name the group that already has the name (B2-08 `create`, ignoring case).
    await expect(dialog).toContainText(`A group called “${GROUP}” already exists`);
    await checkDialog(page, 'Create group');
    await expect(main(page).getByRole('button', { name: 'Create group' })).toBeFocused();
  });

  test('IA-14 Group after the group grant: each member’s standing, the grant (IA-v1 IA-14); Remove (DL-1), Rename (DL-3)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/people/groups/GRP-0012');
    await expect(page.getByRole('heading', { level: 1, name: GROUP })).toBeVisible();
    const members = page.getByRole('table', { name: `Members of ${GROUP}` });
    await expect(members.locator('tbody tr', { hasText: 'Sneha Reddy' })).toContainText(
      'Can’t open experiments while inactive',
    );
    await expect(members.locator('tbody tr', { hasText: 'Arun Kumar' })).toContainText(
      'Waiting for a licence',
    );
    await expect(members.locator('tbody tr', { hasText: 'Rahul Verma' })).toContainText(
      'Has it individuallyGiven 9 Oct 2026',
    );
    await expect(members.locator('tbody tr', { hasText: 'Priya Natarajan' })).toContainText(
      'Can open it',
    );
    const grants = page.getByRole('list', { name: `Experiments given to ${GROUP}` });
    await expect(grants).toContainText(SHELL);
    await expect(grants).toContainText('Given 12 Oct 2026');
    await checkState(page, GROUP);
    await expectNoIaReferences(page);
    await reachAndClick(
      page,
      main(page).getByRole('button', { name: 'Remove Priya Natarajan from this group' }),
    );
    await expect(page.getByRole('alertdialog')).toContainText(
      'Priya will no longer be a member of ME ZG523 — Sem II. Their student record stays in People.',
    );
    await expect(
      page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }),
    ).toBeFocused();
    await checkDialog(page, 'Remove Priya Natarajan from this group?', 'alertdialog');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Rename', exact: true }));
    await checkDialog(page, 'Rename group');
  });

  test('IA-14 Group: the add-students panel (IA-v1 IA-14 adding)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/groups/GRP-0012');
    const toggle = main(page).locator('#gd-add');
    await reachAndClick(page, toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Add students to this group' }),
    ).toBeFocused();
    const panel = page.getByRole('region', { name: 'Add students to this group' });
    await expect(panel.getByRole('button', { name: 'Add students' })).toBeDisabled();
    await reachAndClick(page, panel.getByRole('checkbox', { name: /Vikram Joshi/ }));
    await expect(panel.getByRole('button', { name: 'Add 1 student' })).toBeEnabled();
    await checkState(page, GROUP);
    await reachAndClick(page, panel.getByRole('button', { name: 'Cancel' }));
    await expect(toggle).toBeFocused();
  });

  test('IA-09 Faculty record, from the Faculty tab, and a record with no courses (IA-v1 IA-09)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty');
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Open faculty record: Dr S. Ranganathan' }),
    );
    await page.waitForURL('**/institute/people/faculty/**');
    await expect(main(page)).toContainText('Thermodynamics & Heat Transfer');
    await expect(main(page)).toContainText('Your course code MEC-523');
    await expect(main(page)).toContainText('Added 8 Oct 2026');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'Dr S. Ranganathan');
    // Named by its course and when it was assigned, never by its reference (the identifier rule).
    await expectNoIaReferences(page);
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Faculty' }),
    );
    await reachAndClick(
      page,
      main(page).getByRole('link', { name: 'Open faculty record: Dr Anita Desai' }),
    );
    await page.waitForURL('**/institute/people/faculty/**');
    await expect(page.getByRole('heading', { name: 'No courses yet' })).toBeVisible();
    await checkState(page, 'Dr Anita Desai');
    await expectNoIaReferences(page);
  });

  test('IA-15 Faculty courses: the table and the panel; validation; Remove (DL-1) (IA-v1 IA-15)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty-courses');
    await expect(main(page).locator('tbody tr')).toHaveCount(3);
    await checkState(page, 'People');
    const panel = page.getByRole('region', { name: 'Assign a course' });
    await reachAndClick(page, panel.getByRole('button', { name: 'Assign course' }));
    await expect(panel.getByRole('alert')).toContainText('Choose a faculty member');
    await expect(panel.getByRole('combobox', { name: 'Faculty member' })).toBeFocused();
    await checkState(page, 'People');
    await expectNoIaReferences(page);
    const remove = main(page).getByRole('button', {
      name: 'Remove ME ZG523 from Dr S. Ranganathan',
    });
    await reachAndClick(page, remove);
    // Destructive DL-1: an alert dialog, focus on Cancel.
    await expect(
      page.getByRole('alertdialog', { name: 'Remove ME ZG523 from Dr S. Ranganathan?' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await checkDialog(page, 'Remove ME ZG523 from Dr S. Ranganathan?', 'alertdialog');
    await expect(remove).toBeFocused();
  });

  test('IA-16 Course codes: the editor; the one designed rule (IA-v1 IA-16, st-ia16-error)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/content-access?tab=course-codes');
    const editor = page.getByRole('region', { name: 'Course codes' });
    await expect(editor).toContainText('Your institution’s code is added');
    await expect(editor.locator('.ia-cc-lock')).toHaveText('ME ZG523');
    await expect(page.getByRole('complementary', { name: 'How course codes work' })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/content-access');
    await checkState(page, 'Content access');
    await expectNoIaReferences(page);
    const code = page.getByRole('textbox', {
      name: 'Your course code for Thermodynamics & Heat Transfer',
    });
    await code.fill('');
    await expect(editor.locator('.ia-cc-state')).toHaveText('You have unsaved changes');
    await reachAndClick(page, editor.getByRole('button', { name: 'Save course code' }));
    await expect(editor.locator('.rk-ferr')).toContainText(
      'Add your course code, or clear the semester',
    );
    await expect(code).toBeFocused();
    await expect(code).toHaveAttribute('aria-invalid', 'true');
    await checkState(page, 'Content access');
    await expectNoIaReferences(page);
  });

  test('IA-16 and IA-13 read-only while the institution is paused (B2-03 f9)', async ({ page }) => {
    await open(
      page,
      'after-flow-b',
      PAUSED_INSTITUTE_ADMIN,
      '/institute/content-access?tab=course-codes',
    );
    await expect(main(page).locator('.rk-notice--paused')).toContainText(
      'Read-only while your institution’s access is paused',
    );
    await expect(main(page).getByRole('button', { name: /^Save course code/ })).toHaveCount(0);
    await expect(main(page).getByRole('textbox')).toHaveCount(0);
    await checkState(page, 'Content access');
    await expectNoIaReferences(page);
    await revealSidebar(page);
    await reachAndClick(page, sidebarLink(page, '/institute/people'));
    await page.waitForURL('**/institute/people');
    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'People' }).getByRole('link', { name: 'Groups' }),
    );
    await expect(main(page).getByRole('button', { name: 'Create group' })).toHaveCount(0);
    await checkState(page, 'People');
  });

  test('IA-11 Import students: step 1, “Choose a CSV file first”, then the file’s problems (IA-v1 IA-11)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/import');
    await expect(page.getByRole('list', { name: 'Steps' })).toBeVisible();
    await checkState(page, 'Choose a file');
    await expectNoIaReferences(page);
    await reachAndClick(page, main(page).getByRole('button', { name: 'Check file' }));
    await expect(main(page).getByRole('alert')).toContainText('Choose a CSV file first');
    await expect(main(page).getByRole('button', { name: 'Choose a CSV file' })).toBeFocused();
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
    await expect(
      main(page)
        .getByRole('table', { name: /^Rows that need attention/ })
        .locator('tbody tr'),
    ).toHaveCount(2);
    await checkState(page, 'Check rows');
    await expectNoIaReferences(page);
  });

  test('IA-11 refused while paused: the message in place of the flow (IA-v1 IA-11)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute/people/import');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'You can’t import students while your institution’s access is paused',
      }),
    ).toBeVisible();
    await expect(page.getByRole('list', { name: 'Steps' })).toHaveCount(0);
    await checkState(page, 'You can’t import students while your institution’s access is paused');
    await expectNoIaReferences(page);
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
