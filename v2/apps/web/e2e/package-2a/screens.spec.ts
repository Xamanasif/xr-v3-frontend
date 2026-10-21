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
 * destructive one is an `alertdialog` (IA-v1: Withdraw, Deactivate).
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
  test('IA-01 Overview: the head, the attention list and the plan card as the records stand (IA-v1 IA-01)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute');
    const attention = page.getByRole('region', { name: 'Needs your attention' });
    await expect(attention).toContainText('1 experiment hasn’t been given to any student');
    await expect(attention).toContainText(SHELL);
    await expect(attention).toContainText('11 students have no access yet');
    await expect(main(page).locator('.ia-ov-status')).toContainText(
      'Your access plan ends on 7 October 2027.',
    );
    const card = page.getByRole('region', { name: 'Access plan' });
    await expect(card.getByRole('img', { name: /^Access term from 8 October 2026/ })).toBeVisible();
    await expect(card.getByRole('list', { name: `Formats of ${SHELL}` }).locator('li')).toHaveCount(
      4,
    );
    await expect(card.getByRole('link', { name: 'View plan' })).toHaveAttribute(
      'href',
      '/institute/content-access/plans/ACC-0107',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute');
    await checkState(page, 'Overview');
    await expectNoIaReferences(page);
  });

  test('IA-01 ending soon: the lead band asks for a renewal (IA-v1 st-ia01-ending; Malnad)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', { personId: 'per-v-hegde' }, '/institute');
    const lead = page.getByRole('region', { name: 'Needs your attention' }).locator('.rb-lead');
    await expect(lead).toContainText('Request a renewal');
    await expect(lead.getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    await expect(
      page.getByRole('region', { name: 'Access plan' }).locator('.ia-plan-left.is-warn'),
    ).toHaveText('3 days left');
    await checkState(page, 'Overview');
    await expectNoIaReferences(page);
  });

  test('IA-01 and IA-04 read-only while the institution is paused (B2-01 f5, B2-04 f12)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute');
    await expect(page.getByRole('region', { name: 'Needs your attention' })).toContainText(
      'BITS has paused your institution’s access',
    );
    await expect(main(page).getByRole('link', { name: 'Give students access' })).toHaveCount(0);
    await expect(main(page).locator('.rb-lead.ia-lead--paused')).toBeVisible();
    await checkState(page, 'Overview');
    await expectNoIaReferences(page);
    await reachAndClick(page, page.locator('.rk-banner').getByRole('link', { name: 'Help' }));
    await page.waitForURL('**/institute/help');
  });

  test('IA-02 Content access: the plan strip, no match, then Show all experiments (IA-v1 st-ia02-nomatch)', async ({
    page,
  }) => {
    await open(page, 'after-setup', MEERA, '/institute/content-access');
    const strip = page.getByRole('region', { name: 'Access plan' });
    await expect(
      strip.getByRole('link', { name: 'View access plan, 8 Oct 2026 – 7 Oct 2027' }),
    ).toBeVisible();
    await expect(
      page.getByRole('table', { name: /^Experiments in your access plan/ }),
    ).toContainText(SHELL);
    await checkState(page, 'Content access');
    await expectNoIaReferences(page);
    await page.getByRole('searchbox', { name: 'Search experiments' }).fill('Distillation');
    await expect(main(page).getByText('No experiments match these filters')).toBeVisible();
    await expect(main(page).locator('.ia-xs-count')).toHaveText('0 of 1 experiment');
    await checkState(page, 'Content access');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Show all experiments' }));
    await expect(
      page.getByRole('table', { name: /^Experiments in your access plan/ }),
    ).toContainText(SHELL);
    await expect(page.getByRole('searchbox', { name: 'Search experiments' })).toBeFocused();
  });

  test('IA-02 ending soon: the note in the strip (IA-v1 st-ia02-ending; Malnad)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', { personId: 'per-v-hegde' }, '/institute/content-access');
    const note = page.getByRole('region', { name: 'Access plan' }).locator('.ia-cp-note--warn');
    await expect(note).toContainText('Renewal reminder due. Ask BITS for a renewal from Requests.');
    await expect(note.getByRole('link', { name: 'Request renewal' })).toBeVisible();
    await checkState(page, 'Content access');
    await expectNoIaReferences(page);
  });

  test('IA-03 Access plan: what BITS gave, who was given it, the history (IA-v1 IA-03)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/content-access/plans/ACC-0107');
    const strip = page.getByRole('region', { name: 'Licences and term' });
    await expect(strip.locator('.ia-cp-facts dd')).toContainText('120');
    await expect(strip.locator('.ia-cp-facts dd')).toContainText('as approved by BITS');
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }).locator('[aria-current="page"]'),
    ).toHaveText('Access plan');
    await expect(main(page).getByRole('link', { name: 'your request to BITS' })).toHaveAttribute(
      'href',
      '/institute/requests/REQ-0042',
    );
    await expect(page.getByRole('region', { name: 'Students you’ve given access' })).toContainText(
      'Rahul Verma',
    );
    await expect(page.getByRole('region', { name: 'History' }).locator('li')).not.toHaveCount(0);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/content-access');
    await expect(page).toHaveTitle(/^Access plan/);
    await checkState(page, 'Your access plan');
    await expectNoIaReferences(page);
  });

  test('IA-03 paused: the read-only note, Paused rows (IA-v1 st-ia03-paused; Deccan)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute/content-access');
    await reachAndClick(page, main(page).getByRole('link', { name: /^View access plan, / }));
    await expect(page.getByRole('heading', { level: 1, name: 'Your access plan' })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Licences and term' }).locator('.ia-cp-note--paused'),
    ).toContainText('Read-only while your institution’s access is paused.');
    await expect(main(page).getByRole('link', { name: 'Give students access' })).toHaveCount(0);
    await checkState(page, 'Your access plan');
    await expectNoIaReferences(page);
  });

  test('IA-04 Student access: the withdraw dialog, the reason required (IA-v1 IA-04, DL-2)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/student-access');
    await checkState(page, 'Student access');
    await expectNoIaReferences(page);
    const trigger = main(page).getByRole('button', {
      name: `Withdraw Rahul Verma’s access to ${SHELL}`,
    });
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('alertdialog', { name: 'Withdraw access?' });
    await reachAndClick(page, dialog.getByRole('button', { name: 'Withdraw access' }));
    await expect(dialog).toContainText('Enter the reason for withdrawing access');
    await checkDialog(page, 'Withdraw access?', 'alertdialog');
    await expect(trigger).toBeFocused();
  });

  test('IA-04 Student access on the later sample: the status switch, Withdrawn and no match (IA-v1 IA-04)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/student-access');
    const rows = main(page).locator('tbody tr.ia-gt-row');
    await expect(rows).toHaveCount(9);
    await expect(
      main(page).getByRole('link', { name: 'Group: ME ZG523 — Sem II' }).first(),
    ).toHaveAttribute('href', '/institute/people/groups/GRP-0012');
    await checkState(page, 'Student access');
    await expectNoIaReferences(page);
    await page.getByLabel('Search student access').fill('Meenakshi');
    await expect(main(page).getByText('No grants match these filters')).toBeVisible();
    await checkState(page, 'Student access');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Show all current grants' }));
    await expect(rows).toHaveCount(9);
    // Withdrawn last: on narrow pages the switch scrolls sideways to the pressed status.
    await reachAndClick(page, main(page).getByRole('button', { name: /^Withdrawn/ }));
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText('Nikhil Bose');
    await checkState(page, 'Student access');
  });

  test('IA-04 Student access on the later sample: the overlap dialog says nothing about access (B2-04 f2, OD-B2-01)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/student-access');
    const trigger = main(page).getByRole('button', {
      name: `Withdraw Rahul Verma’s individual grant for ${SHELL}`,
    });
    await reachAndClick(page, trigger);
    const dialog = page.getByRole('alertdialog', {
      name: 'Withdraw Rahul Verma’s individual grant?',
    });
    await expect(dialog).toContainText('doesn’t change the group grant');
    await expect(dialog).not.toContainText(/can still open|can no longer open/);
    await expectNoIaReferences(page);
    await checkDialog(page, 'Withdraw Rahul Verma’s individual grant?', 'alertdialog');
  });

  test('IA-05 Give students access: step 1’s check (B2-05 f10)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/student-access/give');
    await expect(page.getByRole('heading', { level: 1, name: 'Choose experiments' })).toBeVisible();
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/student-access');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
    await expect(main(page).getByRole('alert')).toContainText('Choose at least one experiment');
    await checkState(page, 'Choose experiments');
    await expectNoIaReferences(page);
  });

  test('IA-05 Give students access: a group’s review, then the result (IA-v1 IA-05)', async ({
    page,
  }) => {
    await open(
      page,
      'after-flow-b',
      MEERA,
      '/institute/student-access/give?group=GRP-0012&experiment=shell-and-tube-heat-exchanger',
    );
    await expect(page.getByRole('heading', { level: 1, name: 'Choose experiments' })).toBeVisible();
    await expect(main(page)).toContainText('Giving access to the group ME ZG523 — Sem II');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Choose students' })).toBeVisible();
    await expect(main(page).getByRole('radio', { name: /ME ZG523 — Sem II/ })).toBeChecked();
    await checkState(page, 'Choose students');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
    await expect(
      page.getByRole('heading', { level: 1, name: 'Review and give access' }),
    ).toBeVisible();
    await expect(main(page).locator('ul.ia-lines')).toContainText(
      'Rahul Verma already has it individually. That grant isn’t changed.',
    );
    await checkState(page, 'Review and give access');
    await expectNoIaReferences(page);
    await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
    await expect(page.getByRole('heading', { level: 1, name: 'Access given' })).toBeFocused();
    await expect(main(page).getByRole('link', { name: 'Open the group' })).toBeVisible();
    await checkState(page, 'Access given');
    await expectNoIaReferences(page);
  });

  test('IA-05 refused while paused: the message in place of the flow (IA-v1 IA-05)', async ({
    page,
  }) => {
    await open(page, 'later-sample', PAUSED_INSTITUTE_ADMIN, '/institute/student-access/give');
    await checkState(page, 'You can’t give access while your institution’s access is paused');
    await expect(main(page).getByRole('link', { name: 'Back to Student access' })).toBeVisible();
  });

  test('IA-06 Students: the roster, filters to no match, then the inactive student (IA-v1 IA-06)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/people');
    await expect(main(page).locator('tbody tr')).toHaveCount(12);
    await expect(
      page.getByRole('navigation', { name: 'People' }).getByRole('link', { name: /^Students/ }),
    ).toHaveAttribute('aria-current', 'page');
    // A "No access yet" row's shortcut opens Give students access with the student chosen; the
    // phone rows leave it out (IA-v1 ia-role.css `.ia-rt .ia-rt-act` below 640 px of the list).
    const give = main(page).getByRole('link', { name: 'Give Priya Natarajan access' });
    if ((page.viewportSize()?.width ?? 1440) >= 768) {
      await expect(give).toHaveAttribute('href', '/institute/student-access/give?student=per-0003');
    } else {
      await expect(give).toBeHidden();
    }
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'People');
    await expectNoIaReferences(page);
    await main(page).getByRole('searchbox', { name: 'Search students' }).fill('Meenakshi');
    await expect(main(page).getByText('No students match these filters')).toBeVisible();
    await checkState(page, 'People');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Show all students' }));
    await expect(main(page).getByRole('searchbox', { name: 'Search students' })).toBeFocused();
    await reachAndClick(page, main(page).getByRole('button', { name: 'Inactive 1' }));
    await expect(main(page).getByRole('button', { name: 'Inactive 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await expect(main(page).locator('tbody')).toContainText('Sneha Reddy');
    await expectNoIaReferences(page);
  });

  test('IA-08 Faculty: the tab, its rows, Add faculty member (IA-v1 IA-08)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people?tab=faculty');
    await expect(main(page).locator('tbody')).toContainText('Dr S. Ranganathan');
    await expect(main(page).getByRole('link', { name: 'Add faculty member' })).toHaveAttribute(
      'href',
      '/institute/people/add?type=faculty',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/institute/people');
    await checkState(page, 'People');
    await main(page).getByRole('searchbox', { name: 'Search faculty' }).fill('nobody');
    await expect(main(page).getByText('No faculty members match')).toBeVisible();
    await checkState(page, 'People');
    await expectNoIaReferences(page);
  });

  test('IA-07 Student record: the deactivate dialog (B2-06 f12, f13); an inactive record (f11)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', MEERA, '/institute/people/students/per-0002');
    await checkState(page, 'Rahul Verma');
    await expectNoIaReferences(page);
    const trigger = main(page).getByRole('button', { name: 'Deactivate account…' });
    await reachAndClick(page, trigger);
    await checkDialog(page, 'Deactivate Rahul Verma’s account?', 'alertdialog');
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

  test('IA-07 a student with an individual grant and the group’s: one row, “Also in” (IA-v1 IA-07)', async ({
    page,
  }) => {
    await open(page, 'later-sample', MEERA, '/institute/people/students/per-0002');
    await expect(main(page).locator('table tbody tr')).toHaveCount(1);
    await expect(main(page).locator('table tbody tr')).toContainText(
      'Also in ME ZG523 — Sem II, which has this experiment',
    );
    await checkState(page, 'Rahul Verma');
    await expectNoIaReferences(page);
  });

  test('IA-10 Add student: the drawn checks (IA-v1 IA-10)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/add');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
    await expect(main(page).getByRole('alert')).toBeVisible();
    await expect(main(page).getByRole('alert')).toBeFocused();
    await checkState(page, 'Add student');
    await page.getByLabel('Full name', { exact: true }).fill('Meenakshi Pillai');
    await page.getByLabel(/^Institution e-mail/).fill('rahul.verma@godavari.edu.in');
    await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
    await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
    await expect(main(page).getByRole('alert')).toContainText('2 things need fixing');
    await expectNoIaReferences(page);
  });

  test('IA-10 Add faculty member (IA-v1 IA-10 faculty)', async ({ page }) => {
    await open(page, 'after-setup', MEERA, '/institute/people/add?type=faculty');
    await checkState(page, 'Add faculty member');
    await expectNoIaReferences(page);
  });

  test('IA-10 refused while paused: the message in place of the form (IA-v1 IA-10)', async ({
    page,
  }) => {
    await open(page, 'after-flow-b', PAUSED_INSTITUTE_ADMIN, '/institute/people/add');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'You can’t add people while your institution’s access is paused',
      }),
    ).toBeVisible();
    await expect(main(page).getByRole('textbox', { name: 'Full name' })).toHaveCount(0);
    await checkState(page, 'You can’t add people while your institution’s access is paused');
    await expectNoIaReferences(page);
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
