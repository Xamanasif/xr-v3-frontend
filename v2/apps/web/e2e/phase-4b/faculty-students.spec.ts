import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-20 Students with FA-22 Export CSV, and FA-21 Student detail (board B4-10 f0 … f7), on the
 * test-hook build at 1440, 1024, 768 and 375, as Dr S. Ranganathan. Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus targets, 24 × 24 targets, no developer
 * surface, no sideways scroll). World: after Flow C, where only Rahul has Shell-and-Tube — the CI
 * seam SETS UP the board's five (Meera gives Priya, Imran, Divya and Karthik the experiment; the
 * sample runtime reports their formats; he creates “Heat Exchanger — post-lab”; Rahul and Priya
 * submit). The screens' own work — the filters, the chips, Clear filters, Export CSV, opening a
 * Student, the back link, FA-03's and FA-05's ways in — is done by real clicks. The sample clock
 * cannot be moved in the browser, so "Inactive <n> days" (14 days or more, f1, f5) is proven by
 * the unit suite; here a Student given the experiment today has no activity yet.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const RANGANATHAN = { personId: 'per-0014' };
const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const PRIYA = { personId: 'per-0003' };
const IMRAN = { personId: 'per-0006' };
const DIVYA = { personId: 'per-0007' };
const KARTHIK = { personId: 'per-0008' };
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'thermodynamics-heat-transfer';
const POST_LAB = 'Heat Exchanger — post-lab';
const STUDENTS = '/faculty/students';
const FIVE = ['Divya Menon', 'Imran Shaikh', 'Karthik Rao', 'Priya Natarajan', 'Rahul Verma'];

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/e6f2f9f4-aaaa-49f8-bcc7-f8cf4cd1eb0d/scratchpad/shots-product/faculty-students';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

/** One port command as a sample person through the CI seam (set-up only), which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/** D1: “Heat Exchanger — post-lab” of Q-0101, Q-0102, Q-0104 and Q-0106 (written). */
async function createPostLab(page: Page): Promise<string> {
  const created = await port<{ readonly id: string }>(
    page,
    RANGANATHAN,
    'assessments',
    'createAssessment',
    {
      mode: 'create',
      experimentId: SHELL,
      name: POST_LAB,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    },
  );
  return created.id;
}

/** A Student starts, answers (Q1 A, Q2 B, Q3 true: 4 of 6 by the key) and submits. */
async function submit(
  page: Page,
  student: { readonly personId: string },
  assessmentId: string,
): Promise<string> {
  let attempt = await port<{ readonly id: string; readonly rev: number }>(
    page,
    student,
    'assessments',
    'startAttempt',
    assessmentId,
  );
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: 'Fouling lowers the overall coefficient U.' }],
  ] as const) {
    attempt = await port(page, student, 'assessments', 'saveAnswer', {
      attemptId: attempt.id,
      questionId,
      answer,
      expectedRev: attempt.rev,
    });
  }
  await port(page, student, 'assessments', 'submitAttempt', {
    attemptId: attempt.id,
    expectedRev: attempt.rev,
  });
  return attempt.id;
}

/**
 * After Flow C, on FA-20: the board's five Students (B4-10 f0). Returns the assessment and
 * Rahul's attempt. Everything here is set-up through the CI seam; the page follows each receipt.
 */
async function fiveStudents(page: Page, path = STUDENTS) {
  await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 90_000 });
  const assessmentId = await createPostLab(page);
  const options = await port<{ readonly plan: { readonly rev: number } }>(
    page,
    MEERA,
    'studentAccess',
    'getGiveAccessOptions',
    {},
  );
  await port(page, MEERA, 'studentAccess', 'giveAccess', {
    experimentIds: [SHELL],
    target: {
      kind: 'students',
      studentIds: [PRIYA, IMRAN, DIVYA, KARTHIK].map((person) => person.personId),
    },
    expectedPlanRev: options.plan.rev,
  });
  await reportRuntime(page, { person: IMRAN, experimentId: SHELL, format: 'web', kind: 'opened' });
  await reportRuntime(page, { person: PRIYA, experimentId: SHELL, format: 'web', kind: 'opened' });
  await reportRuntime(page, {
    person: PRIYA,
    experimentId: SHELL,
    format: 'web',
    kind: 'completed',
  });
  await reportRuntime(page, { person: PRIYA, experimentId: SHELL, format: 'vr', kind: 'session' });
  await reportRuntime(page, { person: DIVYA, experimentId: SHELL, format: 'web', kind: 'opened' });
  const rahul = await submit(page, RAHUL, assessmentId);
  await submit(page, PRIYA, assessmentId);
  return { assessmentId, rahul };
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const table = (page: Page) => main(page).locator('table.xr-table');
const status = (page: Page) => main(page).locator('.xr-toolbar-status [role="status"]');
const names = (page: Page) => table(page).locator('tbody tr td:first-child a');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const select = (page: Page, name: string) => page.getByRole('combobox', { name });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** Below 760 px of content the table's rows stack, labelled, and its header row is hidden (f7). */
async function expectTableLayout(page: Page): Promise<void> {
  const header = table(page).locator('thead');
  const contentWidth = await main(page)
    .locator('.xr-content')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (contentWidth < 760) {
    await expect
      .poll(() => header.evaluate((element) => getComputedStyle(element).position))
      .toBe('absolute');
  } else {
    await expect(header).toBeVisible();
  }
  // Below 600 px of content the Experiment filter is not shown (f7, `xr-filter-2`).
  if (contentWidth < 600) await expect(select(page, 'Experiment')).toBeHidden();
  else await expect(select(page, 'Experiment')).toBeVisible();
}

test.describe('FA-20 Students', () => {
  test('the five Students, per format in words (f0, f7)', async ({ page }) => {
    await fiveStudents(page);
    await expect(heading(page, 'Students')).toBeVisible();
    await expect(names(page)).toHaveText(FIVE);
    await expect(status(page)).toHaveText('5 of 5 students');
    await expect(main(page).locator('.xr-phead-meta .xl-meta')).toHaveText(
      'Students who have the experiments you teach · as of 27 Oct 2026',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', STUDENTS);
    const section = page.getByRole('region', { name: SHELL_NAME });
    await expect(section.locator('.xr-section-head .xr-meta')).toHaveText(
      'Progress per format, in words',
    );
    await expect(table(page).locator('thead th')).toHaveText([
      'Student',
      'WEB',
      'VR',
      'Assessment',
      'Last activity',
    ]);
    const row = (name: string) => table(page).locator('tbody tr', { hasText: name });
    await expect(row('Rahul Verma').locator('td')).toHaveText([
      'Rahul VermaGIT-2026-0418',
      'Completed14 Oct 2026',
      'Completed20 Oct 2026',
      'Waiting for marking',
      '27 Oct 2026',
    ]);
    await expect(row('Priya Natarajan').locator('td')).toHaveText([
      'Priya NatarajanGIT-2026-0431',
      'Completed27 Oct 2026',
      'In progress',
      'Waiting for marking',
      '27 Oct 2026',
    ]);
    await expect(row('Karthik Rao').locator('td')).toHaveText([
      'Karthik RaoGIT-2026-0415',
      'Not started',
      'Not started',
      'Not started',
      'None since access was given (27 Oct 2026)',
    ]);
    await expect(row('Imran Shaikh').locator('td').nth(1).locator('.xr-status--wait')).toHaveText(
      'In progress',
    );
    await expect(row('Imran Shaikh').locator('td').nth(2).locator('.xr-status--off')).toHaveText(
      'Not started',
    );
    await expect(page.getByRole('link', { name: 'Open Rahul Verma' })).toHaveAttribute(
      'href',
      `${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`,
    );
    await expect(main(page)).not.toContainText('%');
    await expectTableLayout(page);
    await checkState(page, 'Students');
    if (width(page) === 1440) await shot(page, 'f0-students');
    if (width(page) === 375) await shot(page, 'f7-mobile');
  });

  test('the filters by real choices: chips, Clear filters, no match (f1)', async ({ page }) => {
    await fiveStudents(page);
    await expect(names(page)).toHaveText(FIVE);

    // Progress: Waiting for marking — Rahul and Priya; the chip removes it.
    await select(page, 'Progress').selectOption({ label: 'Waiting for marking' });
    await expect(names(page)).toHaveText(['Priya Natarajan', 'Rahul Verma']);
    await expect(status(page)).toHaveText('2 of 5 students');
    const chip = main(page).locator('.xr-fchip');
    await expect(chip).toHaveText('Progress: Waiting for marking');
    await checkState(page, 'Students');
    await reachAndClick(
      page,
      page.getByRole('button', { name: 'Remove Progress: Waiting for marking' }),
    );
    await expect(names(page)).toHaveText(FIVE);
    await expect(chip).toHaveCount(0);

    // Inactive for 7 days or more: with no activity the days count from when the experiment was
    // given (B4-10 f0 "None since access was given … · Inactive 26 days"; script `r.days >= N`).
    // Here it was given today and the others were active this week: nobody — the board script's
    // no-match line. (The tag at 14 days or more is proven by the unit tests, the clock moved.)
    await select(page, 'Inactive for').selectOption({ label: '7 days or more' });
    const line = main(page).locator('.xr-section-body p.xr-body');
    await expect(line).toContainText('No student matches these filters.');
    await expect(table(page)).toHaveCount(0);
    await expect(status(page)).toHaveText('0 of 5 students');
    await expect(chip).toHaveText('Inactive 7 days or more');
    await checkState(page, 'Students');
    if (width(page) === 1024) await shot(page, 'f1-inactive');

    // Completed a format as well: two filters make two chips; still nobody.
    await select(page, 'Progress').selectOption({ label: 'Completed a format' });
    await expect(line).toContainText('No student matches these filters.');
    await expect(table(page)).toHaveCount(0);
    await expect(main(page).locator('.xr-fchip')).toHaveText([
      'Progress: Completed a format',
      'Inactive 7 days or more',
    ]);
    await checkState(page, 'Students');
    await reachAndClick(page, line.getByRole('button', { name: 'Clear filters' }));
    await expect(names(page)).toHaveText(FIVE);
    await expect(status(page)).toHaveText('5 of 5 students');
    await expect(select(page, 'Progress')).toHaveValue('');
    await expect(select(page, 'Inactive for')).toHaveValue('');
  });

  test('Export CSV saves the list on show; the message names, counts and lists it (f2)', async ({
    page,
  }) => {
    await fiveStudents(page);
    await expect(names(page)).toHaveText(FIVE);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      reachAndClick(page, page.getByRole('button', { name: 'Export CSV' })),
    ]);
    expect(download.suggestedFilename()).toBe('students-shell-and-tube-heat-exchanger.csv');
    const csv = readFileSync((await download.path())!, 'utf8').replace(/^\uFEFF/, '');
    const lines = csv.trimEnd().split('\r\n');
    expect(lines[0]).toBe(
      'student,student ID,experiment,WEB,VR,assessment,result released to student,last activity',
    );
    expect(lines).toHaveLength(6);
    const message = main(page).locator('#faculty-students-export');
    await expect(message).toBeFocused();
    await expect(message.locator('.xr-notice--ok .xr-notice-title')).toHaveText(
      'Exported students-shell-and-tube-heat-exchanger.csv · 5 rows',
    );
    await expect(message).toContainText(
      'Columns: student, student ID, experiment, WEB, VR, assessment, result released to student, last activity. It contains the filtered list only.',
    );
    await checkState(page, 'Students');
    if (width(page) === 1024) await shot(page, 'f2-exported');

    // The filtered list only: two rows waiting for marking.
    await select(page, 'Progress').selectOption({ label: 'Waiting for marking' });
    await expect(names(page)).toHaveText(['Priya Natarajan', 'Rahul Verma']);
    await expect(message).toHaveCount(0);
    const [second] = await Promise.all([
      page.waitForEvent('download'),
      reachAndClick(page, page.getByRole('button', { name: 'Export CSV' })),
    ]);
    const filtered = readFileSync((await second.path())!, 'utf8');
    expect(filtered.trimEnd().split('\r\n')).toHaveLength(3);
    await expect(message.locator('.xr-notice-title')).toHaveText(
      'Exported students-shell-and-tube-heat-exchanger.csv · 2 rows',
    );
  });

  test('no students yet: “0 of 0 students” and the empty state (f6)', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-setup', session: RANGANATHAN });
    await page.goto(STUDENTS);
    await expect(
      main(page).getByRole('heading', { level: 3, name: 'No students have this experiment yet' }),
    ).toBeVisible({ timeout: 90_000 });
    await expect(main(page).locator('.xr-empty')).toContainText(
      'Students appear here when your Institute Admin gives them the experiment.',
    );
    await expect(status(page)).toHaveText('0 of 0 students');
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await checkState(page, 'Students');
    if (width(page) === 768) await shot(page, 'f6-empty');
  });
});

test.describe('FA-21 Student detail', () => {
  test('a Student’s row opens their detail: waiting for marking (f3); back to the list', async ({
    page,
  }) => {
    const { rahul } = await fiveStudents(page);
    await expect(names(page)).toHaveText(FIVE);
    const mark = await markDocument(page);
    const link = page.getByRole('link', { name: 'Open Rahul Verma' });
    await link.scrollIntoViewIfNeeded();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`${STUDENTS}/${RAHUL.personId}\\?experimentId=${SHELL}$`),
    );
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await expectSameDocument(page, mark);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', STUDENTS);

    const head = main(page).locator('.xr-phead');
    await expect(head.locator('.xr-overline')).toHaveText(`${SHELL_NAME} · ME ZG523`);
    await expect(head.locator('.xr-phead-meta')).toHaveText('GIT-2026-0418');
    const progress = page.getByRole('list', { name: 'Progress by format' });
    await expect(progress.locator(':scope > li')).toHaveText([
      'WEBWEBCompleted 14 Oct 2026',
      'VRVRCompleted 20 Oct 2026',
    ]);
    await expect(main(page)).toContainText(
      'Per format only — there is no overall percentage or verdict.',
    );
    const assessment = page.getByRole('region', { name: 'Assessment' });
    const row = assessment.locator('li.xr-row');
    await expect(row.locator('.xr-row-title')).toHaveText(`${POST_LAB} · attempt 1 of 2`);
    await expect(row.locator('.xr-row-sub')).toHaveText(
      new RegExp(`^${rahul} · submitted 27 Oct 2026, \\d\\d:\\d\\d · Waiting for marking$`),
    );
    await expect(row.getByRole('link', { name: 'Mark their answers' })).toHaveAttribute(
      'href',
      `/faculty/marking/${rahul}`,
    );
    const resources = page.getByRole('region', { name: 'Resources' });
    await expect(resources.locator('dd')).toHaveText([
      'Opened 12 Oct 2026, 09:40',
      'Not opened',
      'Not opened',
    ]);
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'Feedback students give on a format isn’t shown to Faculty.',
    );
    await checkState(page, 'Rahul Verma');
    if (width(page) === 768) await shot(page, 'f3-waiting');

    await reachAndClick(page, main(page).getByRole('link', { name: 'Students' }));
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(names(page)).toHaveText(FIVE);
    await expectSameDocument(page, mark);
  });

  test('marked, not released yet (f4); a Student with nothing started (f5)', async ({ page }) => {
    const { rahul } = await fiveStudents(page);
    await expect(names(page)).toHaveText(FIVE);
    // Dr Ranganathan's marks, through the seam (FA-19's own spec drives its screen).
    const view = await port<{ readonly attempt: { readonly id: string; readonly rev: number } }>(
      page,
      RANGANATHAN,
      'marking',
      'getAttemptForMarking',
      rahul,
    );
    const saved = await port<{ readonly rev: number }>(page, RANGANATHAN, 'marking', 'saveMark', {
      attemptId: rahul,
      questionId: 'Q-0106',
      mark: '7',
      feedback: null,
      expectedRev: view.attempt.rev,
    });
    await port(page, RANGANATHAN, 'marking', 'confirmMarks', {
      attemptId: rahul,
      expectedRev: saved.rev,
    });
    await softNavigate(page, `${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    const row = page.getByRole('region', { name: 'Assessment' }).locator('li.xr-row');
    await expect(row.locator('.xr-row-sub')).toHaveText(
      'Marked 11 of 16 · Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59',
    );
    // B4-10 f4 links B4-06: the assessment's Submissions (FA-12).
    await expect(row.getByRole('link', { name: 'See submission' })).toHaveAttribute(
      'href',
      /^\/faculty\/assessments\/ASMT-\d{4}\/submissions$/,
    );
    expect(rahul).toBeTruthy();
    await expect(row.getByRole('link', { name: 'Mark their answers' })).toHaveCount(0);
    await checkState(page, 'Rahul Verma');
    if (width(page) === 768) await shot(page, 'f4-marked');

    await softNavigate(page, `${STUDENTS}/${KARTHIK.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Karthik Rao')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('list', { name: 'Progress by format' }).locator('li')).toHaveText([
      'WEBWEBNot started',
      'VRVRNot started',
    ]);
    await expect(
      page.getByRole('region', { name: 'Assessment' }).locator('.xr-section-body'),
    ).toHaveText('Not started.');
    await expect(page.getByRole('region', { name: 'Resources' }).locator('dd')).toHaveText([
      'Not opened',
      'Not opened',
      'Not opened',
    ]);
    await checkState(page, 'Karthik Rao');
    if (width(page) === 768) await shot(page, 'f5-karthik');
  });

  test('after Flow D: the released result', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 90_000 });
    const row = page.getByRole('region', { name: 'Assessment' }).locator('li.xr-row');
    await expect(row.locator('.xr-row-sub')).toHaveText(
      'Marked 11 of 16 · Result released to Rahul 14 Nov 2026, 23:59',
    );
    await expect(row.getByRole('link', { name: 'See submission' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009/submissions',
    );
    await checkState(page, 'Rahul Verma');
  });
});

test.describe('the ways in: FA-03 Course and FA-05 Experiment (B4-02 f1, B4-03)', () => {
  test('“Students on this experiment” and “See students on this experiment” open FA-20', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`/faculty/courses/${THERMO}`);
    const card = main(page).locator('li.xl-exp');
    await expect(card).toHaveCount(1, { timeout: 90_000 });
    const mark = await markDocument(page);
    if (width(page) === 1440) await shot(page, 'fa03-course');
    await reachAndClick(page, card.getByRole('link', { name: 'Students on this experiment' }));
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(heading(page, 'Students')).toBeVisible({ timeout: 60_000 });
    await expect(names(page)).toHaveText(['Rahul Verma']);
    await expect(status(page)).toHaveText('1 of 1 student');
    await expectSameDocument(page, mark);

    await softNavigate(page, `/faculty/experiments/${SHELL}`);
    await expect(heading(page, SHELL_NAME)).toBeVisible({ timeout: 60_000 });
    const link = page
      .getByRole('region', { name: 'Student activity' })
      .getByRole('link', { name: 'See students on this experiment' });
    await expect(link).toBeVisible();
    if (width(page) === 1440) await shot(page, 'fa05-experiment');
    await reachAndClick(page, link);
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(names(page)).toHaveText(['Rahul Verma']);
    await expectSameDocument(page, mark);
  });
});
