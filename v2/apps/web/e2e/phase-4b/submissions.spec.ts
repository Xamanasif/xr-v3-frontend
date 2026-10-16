import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV (board B4-06 f7 … f11), and the record's
 * Phase-4B actions on FA-08 (B4-05 f0), on the test-hook build at 1440, 1024, 768 and 375, as Dr
 * S. Ranganathan. After Flow C he creates ASMT-0009 (the walk's D1) through the assessments port;
 * Meera Iyer gives Priya Natarajan Shell-and-Tube; Rahul Verma and Priya answer and submit
 * through their own ports; Ranganathan confirms Rahul's marks through the marking port — the CI
 * seam (`actAs`) only sets the states up. The page's own interactions — the filter, "Export CSV"
 * (the browser saves the service's file), "Mark next", the tab and "See submissions" — are real
 * clicks. After Flow D, ATT-0450 is released (f9); a draft-free assessment with no submission is
 * f11; a co-teaching colleague's assessment is held back calmly (OD-B4-17). Each drawn state
 * passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.describe.configure({ timeout: 150_000 });

const RANGANATHAN = { personId: 'per-0014' };
const MEERA = { personId: 'per-0001' };
const RAHUL = { personId: 'per-0002' };
const PRIYA = { personId: 'per-0003' };
const DESAI = { personId: 'per-0015' };
const SHELL = 'shell-and-tube-heat-exchanger';
const NAME = 'Heat Exchanger — post-lab';
const ASMT = 'ASMT-0009';
const SHOTS = join(
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/e6f2f9f4-aaaa-49f8-bcc7-f8cf4cd1eb0d/scratchpad',
  'shots-product',
  'submissions',
);

type Answer =
  | { readonly type: 'multiple-choice'; readonly choice: string }
  | { readonly type: 'true-false'; readonly value: boolean }
  | { readonly type: 'written'; readonly text: string };

interface Answered<T> {
  readonly ok: boolean;
  readonly value: T;
  readonly error?: unknown;
}

interface AttemptRecord {
  readonly id: string;
  readonly rev: number;
}

function must<T>(answer: Answered<T>, what: string): T {
  if (!answer.ok) throw new Error(`${what}: ${JSON.stringify(answer.error)}`);
  return answer.value;
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** After Flow C, on the Faculty Assessments page: ASMT-0009 as the walk's D1 creates it. */
async function createOnC(page: Page): Promise<string> {
  await bootWorld(page, { fixture: 'after-flow-c', session: RANGANATHAN });
  await page.goto('/faculty/assessments');
  await waitForShell(page);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 60_000 });
  const created = await actAs<Answered<{ readonly id: string }>>(page, RANGANATHAN, {
    port: 'assessments',
    method: 'createAssessment',
    input: {
      mode: 'create',
      experimentId: SHELL,
      name: NAME,
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
  });
  return must(created, 'create the assessment').id;
}

/** A Student starts, answers every question and submits through their own port. */
async function submit(
  page: Page,
  student: { readonly personId: string },
  assessmentId: string,
  written: string,
): Promise<string> {
  const answers: readonly (readonly [string, Answer])[] = [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: written }],
  ];
  let attempt = must(
    await actAs<Answered<AttemptRecord>>(page, student, {
      port: 'assessments',
      method: 'startAttempt',
      input: assessmentId,
    }),
    'start',
  );
  for (const [questionId, answer] of answers) {
    attempt = must(
      await actAs<Answered<AttemptRecord>>(page, student, {
        port: 'assessments',
        method: 'saveAnswer',
        input: { attemptId: attempt.id, questionId, answer, expectedRev: attempt.rev },
      }),
      `answer ${questionId}`,
    );
  }
  must(
    await actAs<Answered<AttemptRecord>>(page, student, {
      port: 'assessments',
      method: 'submitAttempt',
      input: { attemptId: attempt.id, expectedRev: attempt.rev },
    }),
    'submit',
  );
  return attempt.id;
}

/** The f7 world: Meera gives Priya the experiment; Rahul, then Priya, submit. */
async function twoSubmitted(page: Page) {
  const id = await createOnC(page);
  const plan = must(
    await actAs<Answered<{ readonly plan: { readonly rev: number } }>>(page, MEERA, {
      port: 'institutions',
      method: 'getAccessPlan',
      input: 'ACC-0107',
    }),
    'the plan',
  );
  must(
    await actAs<Answered<unknown>>(page, MEERA, {
      port: 'studentAccess',
      method: 'giveAccess',
      input: {
        experimentIds: [SHELL],
        target: { kind: 'student', studentId: PRIYA.personId },
        expectedPlanRev: plan.plan.rev,
      },
    }),
    'give Priya Shell-and-Tube',
  );
  const rahul = await submit(page, RAHUL, id, 'Fouling adds a thermal resistance, so U falls.');
  const priya = await submit(page, PRIYA, id, 'Fouling acts like insulation; U drops.');
  return { id, rahul, priya };
}

/** Dr Ranganathan marks the written answer and confirms (FA-19's commands, as set-up). */
async function markAndConfirm(page: Page, attemptId: string, mark: string): Promise<void> {
  const view = must(
    await actAs<Answered<{ readonly attempt: AttemptRecord }>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'getAttemptForMarking',
      input: attemptId,
    }),
    'read for marking',
  );
  const saved = must(
    await actAs<Answered<AttemptRecord>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'saveMark',
      input: {
        attemptId,
        questionId: 'Q-0106',
        mark,
        feedback: 'Good use of your own readings.',
        expectedRev: view.attempt.rev,
      },
    }),
    'save mark',
  );
  must(
    await actAs<Answered<AttemptRecord>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'confirmMarks',
      input: { attemptId, expectedRev: saved.rev },
    }),
    'confirm marks',
  );
}

const main = (page: Page) => page.locator('main');
const section = (page: Page) => page.getByRole('region', { name: 'Submissions' });
const tabs = (page: Page) => page.getByRole('navigation', { name: NAME });
const countLine = (page: Page) => section(page).locator('.xr-section-head [role="status"]');
const rows = (page: Page) => section(page).locator('tbody tr');

/** A row's cells: name, ATT number, submitted, status, score, release flag. */
async function rowCells(row: Locator): Promise<string[]> {
  const cells = row.locator('td');
  return [
    (await cells.nth(0).locator('strong').textContent()) ?? '',
    (await cells.nth(0).locator('.xr-meta').textContent()) ?? '',
    ...(await cells.evaluateAll((all) => all.slice(1).map((cell) => cell.textContent ?? ''))),
  ];
}

/** The table's rows below 760 px of content stack (B4-06 f8 … f11): one cell per line. */
async function expectStacking(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? 1440;
  const display = await rows(page)
    .first()
    .locator('td')
    .first()
    .evaluate((cell) => getComputedStyle(cell).display);
  // The content box is narrower than the window by the sidebar (from 1024) and the gutters.
  if (width <= 768) expect(display).toBe('block');
  if (width === 1440) expect(display).toBe('table-cell');
}

/** The product's frame for the visual comparison (1440 as f7 draws it; 720 as f8 … f11). */
async function shoot(page: Page, name: string, at720 = true): Promise<void> {
  const width = page.viewportSize()?.width ?? 1440;
  if (width !== 1440) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-1440.png`), fullPage: true });
  if (!at720) return;
  await page.setViewportSize({ width: 720, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SHOTS, `${name}-720.png`), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
}

test.describe('FA-12 Assessment · Submissions', () => {
  test('two waiting (f7): the tab, the count, the rows, the filter, Export CSV (f10) and Mark next', async ({
    page,
  }) => {
    const { id, rahul, priya } = await twoSubmitted(page);
    await softNavigate(page, `/faculty/assessments/${id}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    await expect(tabs(page).getByRole('link')).toHaveText([
      'Summary',
      'Questions 4',
      'Settings',
      'Preview',
      'Submissions 2',
    ]);
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Submissions 2');
    await expect(main(page).locator('.xa-headfacts > span')).toHaveText([
      'Due 14 Nov 2026, 23:59',
      '2 waiting for marking',
    ]);
    await expect(countLine(page)).toHaveText('2 submitted · 2 waiting for marking');
    const show = section(page).getByRole('group', { name: 'Show' });
    await expect(show.getByRole('button')).toHaveText(['All', 'Waiting for marking', 'Marked']);
    await expect(show.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    const markNext = section(page).getByRole('link', { name: 'Mark next' });
    await expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`);
    await expect(section(page).locator('thead th')).toHaveText([
      'Student',
      'Submitted',
      'Status',
      'Score',
      'Result released to student',
    ]);
    await expect(rows(page)).toHaveCount(2);
    const first = await rowCells(rows(page).nth(0));
    const second = await rowCells(rows(page).nth(1));
    expect([first[0], first[1], first[3], first[4], first[5]]).toEqual([
      'Rahul Verma',
      rahul,
      'Waiting for marking',
      '—',
      'Not yet — after the deadline',
    ]);
    expect([second[0], second[1], second[3], second[4], second[5]]).toEqual([
      'Priya Natarajan',
      priya,
      'Waiting for marking',
      '—',
      'Not yet — after the deadline',
    ]);
    // Submitted at the sample world's "now" (after Flow C: 27 Oct 2026).
    expect(first[2]).toMatch(/^27 Oct 2026, \d\d:\d\d$/);
    await expect(rows(page).locator('.xl-inline svg')).toHaveCount(2);
    await expectStacking(page);
    await checkState(page, NAME);
    await shoot(page, 'f7');

    // The in-page filter.
    await reachAndClick(page, show.getByRole('button', { name: 'Marked' }));
    await expect(show.getByRole('button', { name: 'Marked' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows(page)).toHaveCount(0);
    await expect(section(page)).toContainText('No submissions match this filter.');
    await expect(countLine(page)).toHaveText('2 submitted · 2 waiting for marking');
    await checkState(page, NAME);
    await reachAndClick(page, show.getByRole('button', { name: 'Waiting for marking' }));
    await expect(rows(page)).toHaveCount(2);
    await reachAndClick(page, show.getByRole('button', { name: 'All' }));
    await expect(rows(page)).toHaveCount(2);

    // f10: Export CSV saves the service's file and confirms it.
    const download = page.waitForEvent('download');
    await reachAndClick(page, section(page).getByRole('button', { name: 'Export CSV' }));
    const file = await download;
    expect(file.suggestedFilename()).toBe(`submissions-${id}.csv`);
    const text = readFileSync(await file.path(), 'utf8').replace(/^\uFEFF/, '');
    const lines = text.split('\r\n');
    expect(lines[0]).toBe('student,student ID,submitted,status,score,result released to student');
    expect(lines[1]).toMatch(
      /^Rahul Verma,GIT-2026-0418,"27 Oct 2026, \d\d:\d\d",Waiting for marking,,Not yet — after the deadline$/,
    );
    expect(lines[2]).toMatch(/^Priya Natarajan,/);
    const confirmation = page.locator('#submissions-export');
    await expect(confirmation).toBeFocused();
    await expect(confirmation.locator('.xr-notice--ok .xr-notice-title')).toHaveText(
      `Exported submissions-${id}.csv · 2 rows`,
    );
    await expect(confirmation).toContainText(
      'Columns: student, student ID, submitted, status, score, result released to student. It contains this list only.',
    );
    await checkState(page, NAME);
    await shoot(page, 'f10');

    // Mark next opens FA-19 for the oldest waiting submission.
    await reachAndClick(page, markNext);
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
  });

  test('after marking Rahul (f8); FA-08’s Mark next and See submissions; the tab', async ({
    page,
  }) => {
    const { id, rahul, priya } = await twoSubmitted(page);
    await markAndConfirm(page, rahul, '7');
    await softNavigate(page, `/faculty/assessments/${id}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(countLine(page)).toHaveText('2 submitted · 1 waiting for marking');
    const first = await rowCells(rows(page).nth(0));
    expect([first[0], first[3], first[4], first[5]]).toEqual([
      'Rahul Verma',
      'Marked',
      '11 of 16',
      'Not yet — after the deadline',
    ]);
    await expect(rows(page).nth(0).locator('.xr-status--ok')).toHaveText('Marked');
    await expect(rows(page).nth(1).locator('.xr-status--wait')).toHaveText('Waiting for marking');
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    await expect(main(page).locator('.xa-headfacts > span').nth(1)).toHaveText(
      '1 waiting for marking',
    );
    await checkState(page, NAME);
    await shoot(page, 'f8');
    await reachAndClick(
      page,
      section(page).getByRole('group', { name: 'Show' }).getByRole('button', { name: 'Marked' }),
    );
    await expect(rows(page)).toHaveCount(1);
    expect((await rowCells(rows(page).nth(0)))[0]).toBe('Rahul Verma');

    // The record's Summary tab (the strip scrolls sideways at 375: focus it, then press Enter).
    const summaryTab = tabs(page).getByRole('link', { name: 'Summary' });
    await summaryTab.focus();
    await summaryTab.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}$`));
    const summary = page.getByRole('region', { name: 'Submissions' });
    await expect(summary.locator('p.xr-body')).toHaveText(
      '2 of 2 submitted · 1 waiting for marking',
    );
    const markNext = summary.getByRole('link', { name: 'Mark next' });
    await expect(markNext).toHaveClass(/xr-btn--primary/);
    await expect(markNext).toHaveAttribute('href', `/faculty/marking/${priya}`);
    await checkState(page, NAME);
    await shoot(page, 'fa-08-summary', false);
    await reachAndClick(page, summary.getByRole('link', { name: 'See submissions' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(countLine(page)).toHaveText('2 submitted · 1 waiting for marking');
  });

  test('released after the deadline (after Flow D, f9)', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`/faculty/assessments/${ASMT}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(countLine(page)).toHaveText('1 submitted · 0 waiting for marking');
    await expect(rows(page)).toHaveCount(1);
    expect(await rowCells(rows(page).nth(0))).toEqual([
      'Rahul Verma',
      'ATT-0450',
      '5 Nov 2026, 18:52',
      'Marked',
      '11 of 16',
      'Released 14 Nov 2026, 23:59',
    ]);
    await expect(rows(page).locator('.xl-inline')).toHaveCount(0);
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Submissions 1');
    await expectStacking(page);
    await checkState(page, NAME);
    await shoot(page, 'f9');
  });

  test('no submissions yet (f11), reached by the record’s Submissions tab', async ({ page }) => {
    const id = await createOnC(page);
    await softNavigate(page, `/faculty/assessments/${id}`);
    await expect(page.getByRole('region', { name: 'Ready to use' })).toBeVisible({
      timeout: 60_000,
    });
    const tab = tabs(page).getByRole('link', { name: /^Submissions/ });
    await expect(tab).toHaveText('Submissions 0');
    await tab.focus();
    await tab.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(countLine(page)).toHaveText('0 submitted · 0 waiting for marking');
    const empty = section(page).locator('.xr-empty');
    await expect(empty.getByRole('heading', { level: 3 })).toHaveText('No submissions yet');
    await expect(empty).toContainText(
      'Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. Their submissions appear here.',
    );
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    await expect(section(page).getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await checkState(page, NAME);
    await shoot(page, 'f11');
  });

  test('a co-teaching colleague’s assessment is held back calmly', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: DESAI });
    await page.goto('/faculty/assessments');
    await waitForShell(page);
    must(
      await actAs<Answered<unknown>>(page, MEERA, {
        port: 'facultyCourses',
        method: 'assign',
        input: { facultyId: DESAI.personId, courseId: 'thermodynamics-heat-transfer' },
      }),
      'map Dr Desai to the course',
    );
    await softNavigate(page, `/faculty/assessments/${ASMT}/submissions`);
    await expect(
      page.getByRole('heading', { name: 'These submissions aren’t available to you yet' }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page)).toContainText(
      'Another faculty member created this assessment. Ask them about its submissions; your own assessments are in Assessments.',
    );
    await expect(main(page)).not.toContainText('Rahul Verma');
    await expect(main(page).getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
    await checkState(page, 'Submissions');
    await shoot(page, 'policy-open', false);
  });
});
