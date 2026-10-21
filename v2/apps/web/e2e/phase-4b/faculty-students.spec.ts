import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, reportRuntime, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * FA-20 Students with FA-22 Export CSV, and FA-21 Student detail, as the owner-approved Faculty
 * export draws them (V3 Refined B, FA-v1 `Main.dc.html` FA-20, FA-21), on the test-hook build at
 * 1440, 1024, 768 and 375, as Dr S. Ranganathan. Each drawn state passes `checkState` (axe WCAG
 * A/AA, one h1, visible focus targets, 24 × 24 targets, no developer surface, no sideways scroll)
 * and shows no internal reference (the owner's identifier rule). World: after Flow C, where only
 * Rahul has Shell-and-Tube — the CI seam SETS UP the five (Meera gives Priya, Imran, Divya and
 * Karthik the experiment; the sample runtime reports their formats; he creates “Heat Exchanger —
 * post-lab”; Rahul and Priya submit). The screens' own work — the filters, the chips, Clear
 * filters, Export CSV, opening a Student, the breadcrumb — is done by real clicks. The sample
 * clock cannot be moved in the browser, so “Inactive <n> days” (14 days or more) is proven by the
 * unit suite; here a Student given the experiment today has no activity yet. FA-03's and FA-05's
 * ways in are the teaching group's describe.
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

/** An internal reference: the Faculty’s ids (ASMT-, ATT-, Q-, D-) and every other role’s. */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

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
 * After Flow C, on FA-20: the five Students. Returns the assessment and Rahul's attempt.
 * Everything here is set-up through the CI seam; the page follows each receipt.
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
const table = (page: Page) => main(page).locator('table.fa-rtable');
const status = (page: Page) => main(page).locator('.rk-statusline [role="status"]');
const names = (page: Page) => table(page).locator('tbody a.rk-rowlink');
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const select = (page: Page, name: string) => page.getByRole('combobox', { name });
const panel = (page: Page) => page.getByRole('complementary', { name: 'Assessment' });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** No internal reference in the page’s words, names or title (the owner’s identifier rule). */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate((source) => {
    const pattern = new RegExp(source);
    const named = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].map(
      (element) =>
        `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('placeholder') ?? ''}`,
    );
    return [document.body.innerText, document.title, ...named]
      .map((text) => pattern.exec(text)?.[0])
      .filter(Boolean);
  }, REFERENCE.source);
  expect(found).toEqual([]);
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** Below 760 px of table width the rows are compact blocks and the head row is not shown. */
async function expectTableLayout(page: Page): Promise<void> {
  const header = table(page).locator('thead');
  const tableWidth = await main(page)
    .locator('.fa-tablewrap')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  if (tableWidth < 760) await expect(header).toBeHidden();
  else await expect(header).toBeVisible();
}

test.describe('FA-20 Students', () => {
  test('the five Students: the summary, the roster per format in words', async ({ page }) => {
    await fiveStudents(page);
    await expect(heading(page, 'Students')).toBeVisible();
    await expect(names(page)).toHaveText(FIVE);
    await expect(status(page)).toHaveText('5 students');
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(
      'Students who have the experiments you teach, from Godavari Institute of Technology.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', STUDENTS);
    const section = page.getByRole('region', { name: SHELL_NAME });
    await expect(section.locator('.fa-tbar .rk-hint')).toHaveText(
      'As of 27 Oct 2026 · progress in words, per format',
    );
    await expect(
      section
        .getByRole('list', {
          name: 'Progress by format for all students with access to Shell-and-Tube Heat Exchanger',
        })
        .locator(':scope > li'),
    ).toHaveText([
      /^WEB\s*2 completed\s*2 in progress\s*1 not started$/,
      /^VR\s*1 completed\s*1 in progress\s*3 not started$/,
    ]);
    await expect(table(page).locator('thead th')).toHaveText([
      'Student',
      'Progress by format',
      'Assessment',
      'Last activity',
    ]);
    const row = (name: string) => table(page).locator('tbody tr', { hasText: name });
    await expect(row('Rahul Verma').locator('td').nth(1).locator('li')).toHaveText([
      'WEBCompleted14 Oct 2026',
      'VRCompleted20 Oct 2026',
    ]);
    await expect(row('Rahul Verma').locator('td').nth(2)).toHaveText(
      /^AssessmentWaiting for markingSubmitted 27 Oct 2026, \d\d:\d\d$/,
    );
    await expect(row('Priya Natarajan').locator('td').nth(1).locator('li')).toHaveText([
      'WEBCompleted27 Oct 2026',
      'VRIn progress',
    ]);
    await expect(row('Karthik Rao').locator('td').nth(3)).toHaveText(
      'Last activityNone since access was given (27 Oct 2026)',
    );
    await expect(row('Imran Shaikh').locator('td').nth(1).locator('.xr-st--info')).toHaveText(
      'In progress',
    );
    await expect(page.getByRole('link', { name: 'Open Rahul Verma' })).toHaveAttribute(
      'href',
      `${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`,
    );
    await expect(main(page)).not.toContainText('%');
    await expect(main(page)).toContainText(
      'Contacting a student happens outside the platform. Feedback students give on a format isn’t shown to Faculty.',
    );
    await expectTableLayout(page);
    await checkState(page, 'Students');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa20-students');
    if (width(page) === 375) await shot(page, 'fa20-phone');
  });

  test('the filters by real choices: chips, Clear filters, no match', async ({ page }) => {
    await fiveStudents(page);
    await expect(names(page)).toHaveText(FIVE);

    // Progress: Waiting for marking — Rahul and Priya; the chip removes it.
    await select(page, 'Progress').selectOption({ label: 'Waiting for marking' });
    await expect(names(page)).toHaveText(['Priya Natarajan', 'Rahul Verma']);
    await expect(status(page)).toHaveText('2 of 5 students');
    const chip = main(page).locator('.rk-chip');
    await expect(chip).toHaveText('Progress: Waiting for marking');
    await checkState(page, 'Students');
    await reachAndClick(
      page,
      page.getByRole('button', { name: 'Remove filter Progress: Waiting for marking' }),
    );
    await expect(names(page)).toHaveText(FIVE);
    await expect(chip).toHaveCount(0);
    await expect(select(page, 'Progress')).toBeFocused();

    // Inactive for 7 days or more: with no activity the days count from when the experiment was
    // given — here today, and the others were active this week: nobody matches.
    await select(page, 'Inactive for').selectOption({ label: '7 days or more' });
    const none = main(page).locator('.rk-state');
    await expect(none).toContainText('No student matches these filters');
    await expect(none).toContainText('Try a shorter inactivity period or another progress filter.');
    await expect(table(page)).toHaveCount(0);
    await expect(status(page)).toHaveText('0 of 5 students');
    await expect(chip).toHaveText('Inactive 7 days or more');
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
    await checkState(page, 'Students');
    if (width(page) === 1440) await shot(page, 'fa20-no-match');

    // Completed a format as well: two filters make two chips; still nobody.
    await select(page, 'Progress').selectOption({ label: 'Completed a format' });
    await expect(none).toContainText('No student matches these filters');
    await expect(main(page).locator('.rk-chip')).toHaveText([
      'Progress: Completed a format',
      'Inactive 7 days or more',
    ]);
    await checkState(page, 'Students');
    await reachAndClick(page, none.getByRole('button', { name: 'Clear filters' }));
    await expect(names(page)).toHaveText(FIVE);
    await expect(status(page)).toHaveText('5 students');
    await expect(select(page, 'Progress')).toHaveValue('');
    await expect(select(page, 'Inactive for')).toHaveValue('');
  });

  test('Export CSV saves the list on show; the band names, counts and shows it', async ({
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
    const notice = main(page).locator('#faculty-students-export');
    await expect(notice).toBeFocused();
    await expect(notice.locator('.rk-notice-t')).toHaveText(
      'Exported students-shell-and-tube-heat-exchanger.csv · 5 rows',
    );
    await expect(notice).toContainText(
      'It contains the filtered list only, as it was when you exported it. Columns: student, student ID, experiment, WEB, VR, assessment, result released to student, last activity.',
    );
    const preview = page.getByRole('region', { name: 'Rows in the exported file' });
    await expect(preview.locator('tbody tr')).toHaveCount(5);
    await expect(preview.locator('thead th')).toHaveText([
      'student',
      'student ID',
      'experiment',
      'WEB',
      'VR',
      'assessment',
      'result released to student',
      'last activity',
    ]);
    await checkState(page, 'Students');
    if (width(page) === 1440) await shot(page, 'fa20-export');
    if (width(page) === 375) await shot(page, 'fa20-export-phone');

    // The filtered list only: two rows waiting for marking.
    await select(page, 'Progress').selectOption({ label: 'Waiting for marking' });
    await expect(names(page)).toHaveText(['Priya Natarajan', 'Rahul Verma']);
    await expect(notice).toHaveCount(0);
    const [second] = await Promise.all([
      page.waitForEvent('download'),
      reachAndClick(page, page.getByRole('button', { name: 'Export CSV' })),
    ]);
    const filtered = readFileSync((await second.path())!, 'utf8');
    expect(filtered.trimEnd().split('\r\n')).toHaveLength(3);
    await expect(notice.locator('.rk-notice-t')).toHaveText(
      'Exported students-shell-and-tube-heat-exchanger.csv · 2 rows',
    );
  });

  test('no students yet: the empty state, no filters, no export', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-setup', session: RANGANATHAN });
    await page.goto(STUDENTS);
    await expect(main(page).getByText('No students have this experiment yet')).toBeVisible({
      timeout: 90_000,
    });
    await expect(main(page).locator('.rk-state')).toContainText(
      'Students appear here when your Institute Admin gives them the experiment.',
    );
    await expect(page.getByRole('search')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
    await checkState(page, 'Students');
    if (width(page) === 768) await shot(page, 'fa20-no-students');
  });
});

test.describe('FA-21 Student detail', () => {
  test('a Student’s row opens their detail: waiting for marking; the breadcrumb back', async ({
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

    const head = main(page).locator('.rk-head');
    await expect(head.locator('.rk-eyebrow')).toHaveText(`${SHELL_NAME} · ME ZG523`);
    await expect(head.locator('.rk-meta')).toHaveText('GIT-2026-0418Last activity 27 Oct 2026');
    const progress = page.getByRole('list', { name: 'Progress by format' });
    await expect(progress.locator(':scope > li')).toHaveText([
      'WEBCompleted14 Oct 2026',
      'VRCompleted20 Oct 2026',
    ]);
    await expect(main(page)).toContainText(
      'Per format only — there is no overall percentage or verdict.',
    );
    await expect(panel(page).locator('.fa-apanel-id')).toHaveText(
      `Waiting for marking${POST_LAB}Due 14 Nov 2026, 23:59`,
    );
    await expect(panel(page).locator('.fa-asm-note')).toHaveText(
      /^Attempt 1 of 2 · submitted 27 Oct 2026, \d\d:\d\d$/,
    );
    await expect(panel(page).getByRole('link', { name: 'Mark their answers' })).toHaveAttribute(
      'href',
      `/faculty/marking/${rahul}`,
    );
    await expect(panel(page).getByRole('link', { name: 'Open the assessment' })).toHaveAttribute(
      'href',
      /^\/faculty\/assessments\/ASMT-\d{4}$/,
    );
    await expect(
      main(page).locator('ul.fa-reslist li .rk-next, ul.fa-reslist li .fa-quiet'),
    ).toHaveText(['Opened 12 Oct 2026, 09:40', 'Not opened', 'Not opened']);
    await expect(main(page)).toContainText(
      'Feedback students give on a format isn’t shown to Faculty.',
    );
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa21-waiting');
    if (width(page) === 375) await shot(page, 'fa21-phone');

    await reachAndClick(
      page,
      page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Students' }),
    );
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(names(page)).toHaveText(FIVE);
    await expectSameDocument(page, mark);
  });

  test('marked, not released yet; a Student with nothing started', async ({ page }) => {
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
    await expect(
      table(page).locator('tbody tr', { hasText: 'Rahul Verma' }).locator('td').nth(2),
    ).toHaveText('AssessmentMarked11 of 16 · result not released yet');
    await softNavigate(page, `${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 60_000 });
    await expect(panel(page).locator('.fa-apanel-id .xr-st--ok')).toHaveText('Marked');
    await expect(panel(page).locator('.fa-done-total')).toHaveText(
      '11 of 16 marksPassed · pass mark 8',
    );
    await expect(panel(page).locator('p.rk-locked')).toHaveText(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await expect(panel(page).getByRole('link', { name: 'View marks' })).toHaveAttribute(
      'href',
      `/faculty/marking/${rahul}`,
    );
    await expect(panel(page).getByRole('link', { name: 'Mark their answers' })).toHaveCount(0);
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa21-marked');

    await softNavigate(page, `${STUDENTS}/${KARTHIK.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Karthik Rao')).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.rk-head .rk-meta')).toHaveText(
      'GIT-2026-0415No activity since access was given (27 Oct 2026)',
    );
    await expect(page.getByRole('list', { name: 'Progress by format' }).locator('li')).toHaveText([
      'WEBNot started',
      'VRNot started',
    ]);
    await expect(panel(page).locator('.fa-asm-note')).toHaveText(
      '2 attempts allowed. No attempt submitted yet.',
    );
    await expect(panel(page).getByRole('link')).toHaveText(['Open the assessment']);
    await expect(main(page).locator('ul.fa-reslist li .fa-quiet')).toHaveText([
      'Not opened',
      'Not opened',
      'Not opened',
    ]);
    await checkState(page, 'Karthik Rao');
    if (width(page) === 768) await shot(page, 'fa21-karthik');
  });

  test('after Flow D: the released result', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`${STUDENTS}/${RAHUL.personId}?experimentId=${SHELL}`);
    await expect(heading(page, 'Rahul Verma')).toBeVisible({ timeout: 90_000 });
    await expect(panel(page).locator('p.fa-savednote')).toHaveText(
      'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
    );
    await expect(panel(page).locator('.fa-done-total')).toHaveText(
      '11 of 16 marksPassed · pass mark 8',
    );
    await expect(panel(page).getByRole('link', { name: 'View marks' })).toHaveAttribute(
      'href',
      '/faculty/marking/ATT-0450',
    );
    await checkState(page, 'Rahul Verma');
    await expectNoReferences(page);
    if (width(page) === 1440) await shot(page, 'fa21-released');
  });
});

test.describe('the ways in: FA-03 Course and FA-05 Experiment (FA-v1 FA-03, FA-05)', () => {
  test('“Students on this experiment” on FA-03 and on FA-05 opens FA-20 for that experiment', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`/faculty/courses/${THERMO}`);
    const card = page.getByRole('article', { name: SHELL_NAME });
    await expect(card).toHaveCount(1, { timeout: 90_000 });
    const mark = await markDocument(page);
    if (width(page) === 1440) await shot(page, 'fa03-course');
    await reachAndClick(page, card.getByRole('link', { name: 'Students on this experiment' }));
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(heading(page, 'Students')).toBeVisible({ timeout: 60_000 });
    await expect(names(page)).toHaveText(['Rahul Verma']);
    await expectSameDocument(page, mark);

    await softNavigate(page, `/faculty/experiments/${SHELL}`);
    await expect(heading(page, SHELL_NAME)).toBeVisible({ timeout: 60_000 });
    const link = page
      .getByRole('region', { name: 'Student activity, by format' })
      .getByRole('link', { name: 'Students on this experiment' });
    await expect(link).toBeVisible();
    if (width(page) === 1440) await shot(page, 'fa05-experiment');
    await reachAndClick(page, link);
    await expect(page).toHaveURL(new RegExp(`${STUDENTS}\\?experimentId=${SHELL}$`));
    await expect(names(page)).toHaveText(['Rahul Verma']);
    await expectSameDocument(page, mark);
  });
});
