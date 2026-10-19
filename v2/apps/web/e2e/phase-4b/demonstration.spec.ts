import { readFileSync } from 'node:fs';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { openInTab, sendRequest, statusHead } from '../package-1c/flow';
import { reachAndClick } from '../support';
import { checkState } from '../support/screen-checks';
import {
  currentSidebarItem,
  expectSameDocument,
  markDocument,
  revealSidebar,
  sidebarLink,
} from '../support/workspace';

/**
 * Flow D on the PRODUCT build — the Phase-4B demonstration in ONE browser tab, no test hooks,
 * nothing but the screens, at 1440, 1024, 768 and 375, on one sample world:
 *
 *  1. the public request → approval → the payment stand-in (TE-4) → access active → Meera Iyer
 *     assigned; Meera adds Rahul Verma, gives him Shell-and-Tube Heat Exchanger, adds Dr S.
 *     Ranganathan and assigns him ME ZG523 in Faculty courses (as Phase 4A);
 *  2. Dr S. Ranganathan creates the assessment with its own rules — nothing pre-filled, results
 *     "Immediately after marking" — writes a multiple-choice, a true-or-false and a written
 *     question, adds them, and previews it (FA-01 … FA-15);
 *  3. Rahul signs in: Home's Up next → Before you start (ST-12) → Start → the attempt (ST-13):
 *     answers save as he goes; Submit → DL-1 → Answers submitted → his result page says
 *     "Submitted — waiting for marking" with no figure (ST-14), Assessments lists it under
 *     Submitted (ST-11);
 *  4. Dr S. Ranganathan: Overview "Mark 1 written answer" → Marking (FA-18) → Mark a submission
 *     (FA-19): the choice questions were marked automatically by the sample stand-in (owner
 *     answer to P4-01, PC-60); he marks the written answer, confirms through DL-1 (read-only
 *     afterwards) → the assessment's Submissions (FA-12): Marked, the score, released → Export
 *     CSV (FA-22) → Students (FA-20) → Rahul's detail (FA-21) → Export CSV of the list;
 *  5. Rahul signs in again: Assessments › Results → his result (ST-14): passed, the score, every
 *     answer with its correct answer and the Faculty member's feedback — released by the
 *     assessment's own setting, with no release button anywhere.
 *
 * Every address is reached by a link or a button; one document throughout (ADR-0004).
 */

const SHELL = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'Thermodynamics & Heat Transfer';
const ASSESSMENT = 'Heat Exchanger — post-lab';
const ARJUN = 'Account menu, Arjun Mehta, Super Admin';
const MEERA = 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology';
const RAHUL = 'Account menu, Rahul Verma, Student, Godavari Institute of Technology';
const RANGANATHAN = 'Account menu, Dr S. Ranganathan, Faculty, Godavari Institute of Technology';

const Q1 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q1_RIGHT = 'The actual heat transfer with the largest heat transfer possible';
const Q1_WRONG = 'The hot-side flow rate with the cold-side flow rate';
const Q2 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q3 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';
const RAHUL_ANSWER =
  'Fouling is an extra layer of resistance, so U goes down and less heat passes at the same flow rates.';
const FEEDBACK = 'Good use of your own readings and the right cause.';

const card = (page: Page) => page.locator('.xs-card');
const main = (page: Page) => page.locator('main');
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });

async function signIn(page: Page, email: string): Promise<void> {
  await card(page).getByLabel('E-mail', { exact: true }).fill(email);
  await card(page).locator('#sign-in-password').fill('sample-password');
  await reachAndClick(page, card(page).getByRole('button', { name: 'Sign in', exact: true }));
}

async function signOut(page: Page, accountLine: string): Promise<void> {
  await page.getByRole('button', { name: accountLine, exact: true }).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

async function sidebar(page: Page, href: string): Promise<void> {
  await revealSidebar(page);
  await reachAndClick(page, sidebarLink(page, href));
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

async function tick(page: Page, box: Locator): Promise<void> {
  if (await box.isChecked()) return;
  await reachAndClick(page, page.locator('label').filter({ has: box }).first());
  await expect(box).toBeChecked();
}

async function choose(radio: Locator): Promise<void> {
  await radio.scrollIntoViewIfNeeded();
  await radio.check();
  await expect(radio).toBeChecked();
}

/** The assessment record's tab strip, brought into view first at 375 (it scrolls sideways). */
async function recordTab(page: Page, name: RegExp): Promise<void> {
  const tab = page.getByRole('navigation', { name: ASSESSMENT }).getByRole('link', { name });
  await tab.scrollIntoViewIfNeeded();
  await reachAndClick(page, tab);
}

/** A question written in FA-15 from the record's Questions tab, then added from the bank panel. */
async function writeAndAdd(
  page: Page,
  record: string,
  fill: (form: Locator) => Promise<void>,
): Promise<void> {
  const inOrder = page.getByRole('region', { name: 'Questions in order' });
  await reachAndClick(page, inOrder.getByRole('link', { name: 'New question' }));
  await page.waitForURL('**/faculty/question-bank/new?**');
  const form = page.getByRole('form', { name: 'Add a question' });
  await expect(form).toBeVisible();
  await fill(form);
  await reachAndClick(page, form.getByRole('button', { name: 'Save question' }));
  await page.waitForURL(`**${record}/questions`);
  const offered = page
    .getByRole('complementary', { name: 'From your question bank' })
    .locator('li')
    .first();
  await expect(offered).toContainText('Just added to your question bank');
  await reachAndClick(
    page,
    offered.getByRole('button', { name: /^Add Q-\d{4} to this assessment$/ }),
  );
}

test('one tab, the product build: Flow D — assessment → attempt → submission → marking → result by its own setting', async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.goto('/');
  const mark = await markDocument(page);

  // 1. Access, the Institute Admin, Rahul and his access, the Faculty member and his course.
  const address = await sendRequest(page);
  await toSignIn(page);
  await signIn(page, 'arjun.mehta@wilp.example');
  await page.waitForURL('**/admin');
  await reachAndClick(
    page,
    page.getByRole('link', {
      name: 'Open the new access request from Godavari Institute of Technology',
    }),
  );
  const panel = page.getByRole('complementary', { name: 'Your decision' });
  await reachAndClick(page, panel.locator('label[for="decision-approve"]'));
  await reachAndClick(page, panel.locator('label[for="decision-route-external"]'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Approve request' }));
  const approve = page.getByRole('dialog', {
    name: 'Approve the request from Godavari Institute of Technology?',
  });
  await reachAndClick(page, approve.getByRole('button', { name: 'Approve request' }));
  await expect(panel.locator('.rk-done .xr-st')).toHaveText('Approved — payment required');
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
    page.getByRole('link', { name: /^Godavari Institute of Technology, .*Open the institution$/ }),
  );
  await page.waitForURL('**/admin/institutions/godavari');
  await reachAndClick(
    page,
    page
      .getByRole('complementary', { name: 'What you can do' })
      .getByRole('button', { name: 'Assign Institute Admin' }),
  );
  const assign = page.getByRole('dialog', {
    name: 'Assign the Institute Admin for Godavari Institute of Technology',
  });
  await assign.getByRole('textbox', { name: 'Name' }).fill('Meera Iyer');
  await assign.getByRole('textbox', { name: 'Work e-mail' }).fill('meera.iyer@godavari.edu.in');
  await reachAndClick(page, assign.getByRole('button', { name: 'Assign' }));
  await expect(main(page).locator('.rk-meta')).toContainText('Institute Admin: Meera Iyer');
  await signOut(page, ARJUN);

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

  // 2. Dr S. Ranganathan creates the assessment: its own rules, three questions, a preview.
  await signIn(page, 's.ranganathan@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/faculty');
  await expect(h1(page)).toHaveText('Overview');
  await sidebar(page, '/faculty/courses');
  await reachAndClick(page, page.getByRole('link', { name: `Open course ${THERMO}` }));
  await page.waitForURL('**/faculty/courses/thermodynamics-heat-transfer');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Open experiment' }));
  await page.waitForURL('**/faculty/experiments/shell-and-tube-heat-exchanger');
  await reachAndClick(
    page,
    page
      .getByRole('region', { name: 'Assessment' })
      .getByRole('link', { name: 'Create assessment' }),
  );
  await page.waitForURL('**/faculty/assessments/new?experimentId=shell-and-tube-heat-exchanger');
  await expect(page.getByRole('radio', { name: new RegExp(SHELL) })).toBeChecked();
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  await page.waitForURL('**/faculty/assessments/new?step=rules**');
  // Nothing comes pre-filled (BC6): every rule is this assessment's own.
  for (const label of ['Assessment name', 'Pass mark (%)', 'Attempts allowed', 'Deadline'])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
  for (const radio of await page.getByRole('radio').all()) await expect(radio).not.toBeChecked();
  await page.getByLabel('Assessment name', { exact: true }).fill(ASSESSMENT);
  await page.getByLabel('Pass mark (%)', { exact: true }).fill('50');
  await page.getByLabel('Attempts allowed', { exact: true }).fill('2');
  await page.getByLabel('Deadline', { exact: true }).fill('14 Nov 2026, 23:59');
  await choose(page.getByRole('radio', { name: /Immediately after marking/ }));
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  await page.waitForURL('**/faculty/assessments/new?step=questions**');
  await reachAndClick(page, main(page).getByRole('link', { name: 'New question' }));
  await page.waitForURL('**/faculty/question-bank/new?**');
  const first = page.getByRole('form', { name: 'Add a question' });
  await choose(first.getByRole('radio', { name: 'Multiple choice' }));
  await first.getByRole('textbox', { name: 'Question' }).fill(Q1);
  await first.getByRole('textbox', { name: 'Option A' }).fill(Q1_RIGHT);
  await first.getByRole('textbox', { name: 'Option B' }).fill(Q1_WRONG);
  await choose(first.getByRole('radio', { name: 'Option A is the correct answer' }));
  await first.getByRole('textbox', { name: 'Marks' }).fill('2');
  await reachAndClick(page, first.getByRole('button', { name: 'Save question' }));
  await page.waitForURL('**/faculty/assessments/new?step=questions**');
  await expect(page.getByRole('list', { name: 'Questions' }).getByRole('checkbox')).toBeChecked();
  await reachAndClick(page, page.getByRole('button', { name: 'Continue' }));
  await page.waitForURL('**/faculty/assessments/new?step=preview**');
  await reachAndClick(page, page.getByRole('button', { name: 'Create assessment' }));
  await expect(h1(page)).toHaveText('Assessment created');
  await reachAndClick(page, page.getByRole('link', { name: 'Open assessment' }));
  await page.waitForURL(/\/faculty\/assessments\/ASMT-\d{4}$/);
  const record = new URL(page.url()).pathname;
  const assessmentId = record.split('/').at(-1)!;

  await recordTab(page, /^Questions/);
  await page.waitForURL(`**${record}/questions`);
  await writeAndAdd(page, record, async (form) => {
    await choose(form.getByRole('radio', { name: 'True or false' }));
    await form.getByRole('textbox', { name: 'Question' }).fill(Q2);
    await choose(form.getByRole('radio', { name: 'True', exact: true }));
    await form.getByRole('textbox', { name: 'Marks' }).fill('2');
  });
  await writeAndAdd(page, record, async (form) => {
    await choose(form.getByRole('radio', { name: 'Written answer' }));
    await form.getByRole('textbox', { name: 'Question' }).fill(Q3);
    await form
      .getByRole('textbox', { name: 'Marking guidance (optional)' })
      .fill('Look for: fouling adds a thermal resistance; U falls.');
    await form.getByRole('textbox', { name: 'Marks' }).fill('10');
  });
  await expect(page.getByRole('region', { name: 'Questions in order' })).toContainText(
    '3 questions · 14 marks',
  );
  await recordTab(page, /^Preview$/);
  await page.waitForURL(`**${record}/preview`);
  await expect(main(page)).toContainText('Previewing creates no attempt and saves nothing.');
  await expect(main(page)).toContainText(Q3);
  // The record's Submissions tab is there, with nothing yet (B4-06 f11).
  await recordTab(page, /^Submissions/);
  await page.waitForURL(`**${record}/submissions`);
  await expect(main(page)).toContainText('No submissions yet');
  await signOut(page, RANGANATHAN);

  // 3. Rahul: Up next → Before you start → the attempt → Submit → no figure yet.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  const upNext = page.getByRole('region', { name: 'Up next' });
  const upNextRow = upNext.locator('li.xr-row', { hasText: `${ASSESSMENT} is ready` });
  await reachAndClick(page, upNextRow.getByRole('link', { name: 'Open assessment' }));
  await page.waitForURL(`**/student/assessments/${assessmentId}`);
  await expect(h1(page)).toHaveText(ASSESSMENT);
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/assessments');
  await expect(main(page)).toContainText('1 multiple choice · 1 true or false · 1 written answer');
  await expect(main(page)).toContainText('Immediately after marking');
  await checkState(page, ASSESSMENT);
  await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
  await page.waitForURL(`**/student/assessments/${assessmentId}/attempt`);
  await expect(h1(page)).toHaveText(ASSESSMENT);
  // A focused page: no sidebar; no key anywhere on it.
  await expect(page.locator('aside.xr-side')).toHaveCount(0);
  await expect(main(page)).not.toContainText('Correct answer');
  await choose(page.getByRole('radio', { name: Q1_RIGHT }));
  await choose(page.getByRole('radio', { name: 'True', exact: true }));
  await page.getByRole('textbox', { name: Q3 }).fill(RAHUL_ANSWER);
  await page.getByRole('textbox', { name: Q3 }).blur();
  await expect(page.locator('header.xa-bar [role="status"]')).toHaveText('All answers saved');
  await expect(main(page).locator('.xa-strip-text')).toHaveText('3 of 3 answered');
  await checkState(page, ASSESSMENT);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Submit', exact: true }));
  const submitDialog = page.getByRole('dialog', { name: 'Submit your answers?' });
  await expect(submitDialog).toContainText('You can’t change your answers after submitting.');
  await reachAndClick(page, submitDialog.getByRole('button', { name: 'Submit answers' }));
  await expect(h1(page)).toHaveText('Answers submitted');
  await reachAndClick(page, page.getByRole('link', { name: 'See your result page' }));
  await page.waitForURL(`**/student/assessments/${assessmentId}/result`);
  await expect(h1(page)).toHaveText('Submitted — waiting for marking');
  await expect(main(page)).not.toContainText('of 14 marks');
  await checkState(page, 'Submitted — waiting for marking');
  await sidebar(page, '/student/assessments');
  await expect(page.getByRole('group', { name: 'Show' }).getByRole('button')).toHaveText([
    'To do (0)',
    'Submitted (1)',
    'Results (0)',
  ]);
  await signOut(page, RAHUL);

  // 4. Dr S. Ranganathan marks the written answer; the record and the Students list follow.
  await signIn(page, 's.ranganathan@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/faculty');
  await expect(main(page)).toContainText('1 written answer to mark');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Mark 1 written answer' }));
  await page.waitForURL((url) => url.pathname === '/faculty/marking');
  await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/marking');
  await checkState(page, 'Marking');
  await reachAndClick(page, main(page).getByRole('link', { name: 'Mark Rahul Verma' }));
  await page.waitForURL(/\/faculty\/marking\/ATT-\d{4}$/);
  await expect(h1(page)).toHaveText('Rahul Verma');
  // The choice questions were marked automatically (the sample stand-in, PC-60): 4 of 4.
  await expect(main(page)).toContainText('Marked automatically');
  await expect(main(page)).toContainText('4 of 4 marks');
  await expect(main(page)).toContainText(RAHUL_ANSWER);
  await checkState(page, 'Rahul Verma');
  await page.getByRole('textbox', { name: 'Mark for question 3' }).fill('7');
  await page.getByRole('textbox', { name: /^Feedback for Rahul/ }).fill(FEEDBACK);
  await reachAndClick(page, main(page).getByRole('button', { name: 'Confirm marks' }));
  const confirm = page.getByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
  await expect(confirm).toContainText('Confirmed marks can’t be changed.');
  await reachAndClick(page, confirm.getByRole('button', { name: 'Confirm marks' }));
  const done = page.locator('#ms-mdone');
  await expect(done.locator('.xr-status--ok')).toHaveText('Marks confirmed');
  await expect(done).toContainText('· Dr S. Ranganathan');
  // Read-only afterwards: no mark field, no Confirm.
  await expect(page.getByRole('textbox', { name: 'Mark for question 3' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Confirm marks' })).toHaveCount(0);

  await sidebar(page, '/faculty/assessments');
  // The row's name link wraps at some widths (its box centre falls between lines): opened from
  // the keyboard, as a keyboard user does.
  const rowLink = main(page)
    .getByRole('link', { name: new RegExp(ASSESSMENT) })
    .first();
  await rowLink.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(`**${record}`);
  await recordTab(page, /^Submissions/);
  await page.waitForURL(`**${record}/submissions`);
  const submitted = main(page)
    .locator('tbody tr, .xr-rows > li')
    .filter({ hasText: 'Rahul Verma' });
  await expect(submitted).toContainText('Marked');
  await expect(submitted).toContainText('11 of 14');
  await expect(submitted).toContainText('Released');
  // There is no Faculty release control (B4-14 D4).
  await expect(page.getByRole('button', { name: /^Release/ })).toHaveCount(0);
  await checkState(page, ASSESSMENT);
  const submissionsCsv = page.waitForEvent('download');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Export CSV' }));
  const submissionsFile = await submissionsCsv;
  expect(submissionsFile.suggestedFilename()).toBe(`submissions-${assessmentId}.csv`);
  const submissionsText = readFileSync(await submissionsFile.path(), 'utf8');
  expect(submissionsText).toContain('Rahul Verma,GIT-2026-0418,');
  // The release cell holds a comma, so it is quoted (RFC 4180; PC-57).
  expect(submissionsText).toContain(',Marked,11 of 14,"Released ');

  await sidebar(page, '/faculty/students');
  await expect(main(page)).toContainText('1 of 1 student');
  await reachAndClick(page, page.getByRole('link', { name: 'Open Rahul Verma' }));
  await page.waitForURL(/\/faculty\/students\/[^/?]+\?experimentId=shell-and-tube-heat-exchanger$/);
  await expect(h1(page)).toHaveText('Rahul Verma');
  await expect(page.getByRole('region', { name: 'Assessment' })).toContainText('Marked 11 of 14');
  await checkState(page, 'Rahul Verma');
  await sidebar(page, '/faculty/students');
  const studentsCsv = page.waitForEvent('download');
  await reachAndClick(page, main(page).getByRole('button', { name: 'Export CSV' }));
  const studentsFile = await studentsCsv;
  expect(studentsFile.suggestedFilename()).toBe('students-shell-and-tube-heat-exchanger.csv');
  expect(readFileSync(await studentsFile.path(), 'utf8')).toContain('Rahul Verma,GIT-2026-0418,');
  await signOut(page, RANGANATHAN);

  // 5. Rahul: the result, released by the assessment's own setting.
  await signIn(page, 'rahul.verma@godavari.edu.in');
  await page.waitForURL((url) => url.pathname === '/student');
  await sidebar(page, '/student/assessments');
  await reachAndClick(
    page,
    page.getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Results (1)' }),
  );
  await reachAndClick(page, main(page).getByRole('link', { name: `See result ${ASSESSMENT}` }));
  await page.waitForURL(`**/student/assessments/${assessmentId}/result`);
  await expect(h1(page)).toHaveText('You passed');
  await expect(main(page).locator('.xa-score-n')).toHaveText('11 of 14 marks');
  await expect(main(page)).toContainText(`Correct answer`);
  await expect(main(page)).toContainText('Feedback from Dr S. Ranganathan');
  await expect(main(page)).toContainText(FEEDBACK);
  await checkState(page, 'You passed');
  await expectSameDocument(page, mark);
});
