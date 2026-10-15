import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
} from '../support/workspace';

/**
 * The Phase-4A demonstration in ONE browser tab of the PRODUCT build — no test hooks, nothing but
 * the screens — at 1440, 1024, 768 and 375, on one sample world:
 *
 *  1. the public request → approval → the payment stand-in (TE-4) → access active → Meera Iyer
 *     assigned (as Package 2B);
 *  2. Meera adds Rahul Verma and gives him Shell-and-Tube Heat Exchanger (IA-10, IA-05), then adds
 *     Dr S. Ranganathan as Faculty and assigns him ME ZG523 in Faculty courses (IA-10 → IA-15);
 *  3. Dr S. Ranganathan signs in: the assignment is his workspace — Overview (FA-01) → My courses
 *     (FA-02) → the course (FA-03) → the experiment (FA-05, no assessment yet) → Create assessment
 *     (FA-07): the experiment, the rules typed with nothing pre-filled, an empty bank → "New
 *     question" (FA-15) writes a multiple-choice question and comes back with it ticked → Preview
 *     → Create assessment: Ready;
 *  4. the record: Summary (FA-08, Ready, reaching Rahul) → Settings (FA-10: the pass mark changed
 *     and saved) → Questions (FA-09: a true-or-false question written from here comes back offered
 *     in the bank panel and is added) → Preview (FA-11: the Student view and the answer key of the
 *     two questions as the record pins them) → Assessments (FA-06) and the Question bank (FA-14)
 *     list the same records.
 *
 * Every address is reached by a link or a button; one document throughout (ADR-0004). The Student
 * side of the assessment (ST-11 … ST-14) and marking (FA-18, FA-19) are Phase 4B.
 */

const SHELL = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'Thermodynamics & Heat Transfer';
const ASSESSMENT = 'Heat Exchanger — post-lab';
const ARJUN = 'Account menu: Arjun Mehta, Super Admin';
const MEERA = 'Account menu: Meera Iyer, Institute Admin, Godavari Institute of Technology';

const card = (page: Page) => page.locator('.xp-auth-card');
const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xr-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, page.locator(`aside.xr-side nav a[href="${href}"]`));
  await page.waitForURL((url) => url.pathname === href);
}

async function toSignIn(page: Page): Promise<void> {
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    await reachAndClick(page, page.locator('header a.xp-signin'));
  } else {
    await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
    await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name: 'Sign in' }));
  }
  await page.waitForURL('**/sign-in');
}

/** A drawn checkbox, ticked by a pointer click on its label (the v46 control draws the box). */
async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

/** A radio, chosen and checked. */
async function choose(radio: Locator): Promise<void> {
  await radio.scrollIntoViewIfNeeded();
  await radio.check();
  await expect(radio).toBeChecked();
}

/**
 * The assessment record's tab strip (B4-05 `nav.xw-hubtabs`). At 375 the strip is wider than the
 * screen and scrolls sideways (the v46 tab pattern keeps the current tab in view): the tab is
 * brought into view first, as a swipe along the strip does, then pressed.
 */
async function recordTab(page: Page, name: RegExp): Promise<void> {
  const tab = page.getByRole('navigation', { name: ASSESSMENT }).getByRole('link', { name });
  await tab.scrollIntoViewIfNeeded();
  await reachAndClick(page, tab);
}

test('one tab, the product build: Faculty course assigned → the Faculty workspace → create, set, fill and preview an assessment', async ({
  page,
}) => {
  test.setTimeout(360_000);
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. Access: the public request, approved and paid; the Institute Admin assigned.
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open: REQ-0042 · Godavari Institute of Technology' }),
  );
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const approve = page.getByRole('dialog', { name: 'Approve REQ-0042?' });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.xr-status')).toHaveText('Approved — payment required');
  await signOut(page, ARJUN);
  await openInTab(page, address);
  await reachAndClick(page, statusHead(page).getByRole('link', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}/payment`);
  await reachAndClick(page, page.getByRole('button', { name: 'Continue to payment' }));
  await page.waitForURL(`**${address}`);
  await expect(statusHead(page)).toContainText('Access active');
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await sidebar(page, '/admin/institutions');
  await reachAndClick(
    page,
    page.getByRole('link', { name: 'Open Godavari Institute of Technology' }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await reachAndClick(
    page,
    main(page).locator('.xw-actions').getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.xr-phead-meta')).toContainText('Institute Admin: Meera Iyer');
  await signOut(page, ARJUN);

  // 2. Meera: Rahul Verma and his access; Dr S. Ranganathan and his Faculty course.
  await signIn(page, 'meera.iyer@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/institute');
  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    main(page).locator('.xr-phead').getByRole('link', { name: 'Add student' }),
  );
  await page.waitForURL('**/institute/people/add**');
  await page.getByLabel('Full name', { exact: true }).fill('Rahul Verma');
  await page.getByLabel(/^Institution e-mail/).fill('rahul.verma@godavari.edu.in');
  await page.getByLabel(/^Student ID/).fill('GIT-2026-0418');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add student' }));
  await reachAndClick(page, main(page).getByRole('link', { name: 'Give this student access' }));
  await page.waitForURL('**/institute/student-access/give?**');
  await tick(page, page.getByRole('checkbox', { name: new RegExp(SHELL) }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await expect(page.getByRole('checkbox', { name: /Rahul Verma/ })).toBeChecked();
  await reachAndClick(page, main(page).getByRole('button', { name: 'Continue' }));
  await reachAndClick(page, main(page).getByRole('button', { name: 'Give access' }));
  await expect(page.getByRole('list', { name: 'Access given' })).toContainText('Rahul Verma');

  await sidebar(page, '/institute/people');
  await reachAndClick(
    page,
    page.getByRole('navigation', { name: 'People' }).getByRole('link', {
      name: 'Faculty',
      exact: true,
    }),
  );
  await reachAndClick(
    page,
    main(page).locator('.xr-phead').getByRole('link', { name: 'Add faculty member' }),
  );
  await page.waitForURL('**/institute/people/add?type=faculty');
  await page.getByLabel('Full name', { exact: true }).fill('Dr S. Ranganathan');
  await page.getByLabel(/^Institution e-mail/).fill('s.ranganathan@godavari.edu.in');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Add faculty member' }));
  await reachAndClick(page, main(page).getByRole('link', { name: 'Assign a course' }));
  await page.waitForURL('**/institute/people?tab=faculty-courses&faculty=**');
  const assignCourse = page.getByRole('complementary', { name: 'Assign a course' });
  await assignCourse
    .getByRole('combobox', { name: /^Course/ })
    .selectOption({ label: `ME ZG523 — ${THERMO}` });
  await reachAndClick(page, assignCourse.getByRole('button', { name: 'Assign course' }));
  await expect(main(page)).toContainText(
    'Dr S. Ranganathan now teaches ME ZG523. It appears in their Faculty workspace.',
  );
  await signOut(page, MEERA);

  // 3. Dr S. Ranganathan: the assigned course is his workspace.
  await signIn(page, 's.ranganathan@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/faculty');
  await expect(h1(page)).toHaveText('Overview');
  await expect(main(page)).toContainText('You teach 1 course · 1 experiment');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty');
  await checkState(page, 'Overview');
  await sidebar(page, '/faculty/courses');
  await expect(h1(page)).toHaveText('My courses');
  await reachAndClick(page, page.getByRole('link', { name: `Open course ${THERMO}` }));
  await page.waitForURL('**/faculty/courses/thermodynamics-heat-transfer');
  await expect(h1(page)).toHaveText(THERMO);
  await reachAndClick(page, main(page).getByRole('link', { name: 'Open experiment' }));
  await page.waitForURL('**/faculty/experiments/shell-and-tube-heat-exchanger');
  await expect(h1(page)).toHaveText(SHELL);
  await checkState(page, SHELL);
  const assessmentSection = page.getByRole('region', { name: 'Assessment' });
  await reachAndClick(page, assessmentSection.getByRole('link', { name: 'Create assessment' }));
  await page.waitForURL('**/faculty/assessments/new?experimentId=shell-and-tube-heat-exchanger');

  // FA-07 step 1: the experiment carried from FA-05.
  await expect(page.getByRole('radio', { name: new RegExp(SHELL) })).toBeChecked();
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  // Step 2: nothing pre-filled (BC6).
  await page.waitForURL('**/faculty/assessments/new?step=rules**');
  for (const label of ['Assessment name', 'Pass mark (%)', 'Attempts allowed', 'Deadline'])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
  for (const radio of await page.getByRole('radio').all()) await expect(radio).not.toBeChecked();
  await page.getByLabel('Assessment name', { exact: true }).fill(ASSESSMENT);
  await page.getByLabel('Pass mark (%)', { exact: true }).fill('50');
  await page.getByLabel('Attempts allowed', { exact: true }).fill('2');
  await page.getByLabel('Deadline', { exact: true }).fill('14 Nov 2026, 23:59');
  await choose(page.getByRole('radio', { name: /After the deadline/ }));
  await checkState(page, 'Set the rules');
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  // Step 3: the bank is empty in a new institution — "New question" writes one and comes back.
  await page.waitForURL('**/faculty/assessments/new?step=questions**');
  await reachAndClick(page, main(page).getByRole('link', { name: 'New question' }));
  await page.waitForURL('**/faculty/question-bank/new?**');
  let form = page.getByRole('form', { name: 'Add a question' });
  await expect(form).toBeVisible();
  await choose(form.getByRole('radio', { name: 'Multiple choice' }));
  await form
    .getByRole('textbox', { name: 'Question' })
    .fill('What does the effectiveness (ε) of a heat exchanger compare?');
  await form
    .getByRole('textbox', { name: 'Option A' })
    .fill('The actual heat transfer with the largest heat transfer possible');
  await form
    .getByRole('textbox', { name: 'Option B' })
    .fill('The hot-side flow rate with the cold-side flow rate');
  await choose(form.getByRole('radio', { name: 'Option A is the correct answer' }));
  await form.getByRole('textbox', { name: 'Marks' }).fill('2');
  await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
  await page.waitForURL('**/faculty/assessments/new?step=questions**');
  const bankList = page.getByRole('list', { name: 'Questions' });
  await expect(bankList.getByRole('checkbox')).toHaveCount(1);
  await expect(bankList.getByRole('checkbox')).toBeChecked();
  // Everything typed before is kept across the round trip (the summary beside the steps from
  // 1024 px, folded below them under that, B4-04 f11).
  await expect(main(page)).toContainText(ASSESSMENT);
  await expect(main(page)).toContainText('Pass mark 50% · 2 attempts');
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  // Step 4: the preview, then Create assessment → Ready.
  await page.waitForURL('**/faculty/assessments/new?step=preview**');
  await expect(main(page)).toContainText('Previewing creates no attempt.');
  await checkState(page, 'Preview and create');
  await reachAndClick(page, page.getByRole('button', { name: 'Create assessment' }));
  await expect(h1(page)).toHaveText('Assessment created');
  await expect(main(page).locator('.xr-notice--ok')).toContainText('· Ready');
  await reachAndClick(page, page.getByRole('link', { name: 'Open assessment' }));

  // 4. The record: Summary → Settings → Questions → Preview.
  await page.waitForURL(/\/faculty\/assessments\/ASMT-\d{4}$/);
  const record = new URL(page.url()).pathname;
  await expect(h1(page)).toHaveText(ASSESSMENT);
  await expect(page.getByRole('region', { name: 'Ready to use' })).toContainText(
    `Students who have ${SHELL} can see and start it.`,
  );
  await expect(page.getByRole('region', { name: 'Who it reaches' })).toContainText(
    '1 student who has',
  );
  await checkState(page, ASSESSMENT);

  await recordTab(page, /^Settings$/);
  await page.waitForURL(`**${record}/settings`);
  await expect(page.getByLabel('Pass mark (%)', { exact: true })).toHaveValue('50');
  await page.getByLabel('Pass mark (%)', { exact: true }).fill('60');
  await reachAndClick(page, page.getByRole('button', { name: 'Save settings' }));
  await expect(page.locator('#Es-saved')).toContainText('saved');

  await recordTab(page, /^Questions/);
  await page.waitForURL(`**${record}/questions`);
  const inOrder = page.getByRole('region', { name: 'Questions in order' });
  await expect(inOrder).toContainText('1 question · 2 marks');
  await reachAndClick(page, inOrder.getByRole('link', { name: 'New question' }));
  await page.waitForURL('**/faculty/question-bank/new?**');
  form = page.getByRole('form', { name: 'Add a question' });
  await expect(form).toBeVisible();
  await choose(form.getByRole('radio', { name: 'True or false' }));
  await form
    .getByRole('textbox', { name: 'Question' })
    .fill('Fouling on the tube surfaces lowers the overall heat transfer coefficient U.');
  await choose(form.getByRole('radio', { name: 'True', exact: true }));
  await form.getByRole('textbox', { name: 'Marks' }).fill('2');
  await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
  // Back on Questions: the new question is offered in the bank panel, never attached silently.
  await page.waitForURL(`**${record}/questions`);
  const bankPanel = page.getByRole('complementary', { name: 'From your question bank' });
  await expect(bankPanel).toBeVisible();
  const offered = bankPanel.locator('li').first();
  await expect(offered).toContainText('Just added to your question bank');
  await expect(inOrder).toContainText('1 question · 2 marks');
  await reachAndClick(
    page,
    offered.getByRole('button', { name: /^Add Q-\d{4} to this assessment$/ }),
  );
  await expect(inOrder).toContainText('2 questions · 4 marks');

  await recordTab(page, /^Preview$/);
  await page.waitForURL(`**${record}/preview`);
  await expect(main(page)).toContainText('Previewing creates no attempt and saves nothing.');
  await expect(main(page)).toContainText(
    'What does the effectiveness (ε) of a heat exchanger compare?',
  );
  await expect(main(page)).toContainText(
    'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
  );
  await checkState(page, ASSESSMENT);
  await reachAndClick(
    page,
    page.getByRole('group', { name: 'Preview as' }).getByRole('button', { name: 'Answer key' }),
  );
  await expect(main(page)).toContainText('Only you see the answer key and the marking guidance.');
  await expect(main(page).getByText('Correct', { exact: true }).first()).toBeVisible();

  // The same records in Assessments and the Question bank.
  await sidebar(page, '/faculty/assessments');
  const row = main(page).locator('tbody tr').filter({ hasText: ASSESSMENT });
  await expect(row.locator('.xr-status--ok')).toHaveText('Ready');
  await sidebar(page, '/faculty/question-bank');
  await expect(main(page).locator('tbody tr')).toHaveCount(2);
  await expectSameDocument(page, mark);
});
