import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-12 Submissions"; earlier board B4-06 f7 … f11), and the record's Phase-4B
 * actions on FA-08's Submissions panel, on the test-hook build at 1440, 1024, 768 and 375, as Dr
 * S. Ranganathan. After Flow C he creates "Heat Exchanger — post-lab" (the walk's D1) through the
 * assessments port; Meera Iyer gives Priya Natarajan Shell-and-Tube; Rahul Verma and Priya answer
 * and submit through their own ports; Ranganathan confirms Rahul's marks through the marking port
 * — the CI seam (`actAs`) only sets the states up. The page's own interactions — the filter,
 * "Export CSV" (the browser saves the service's file), "Mark next", the tab and "See submissions"
 * — are real clicks. After Flow D, Rahul's attempt is released; an assessment with no submission
 * shows "No submissions yet"; a co-teaching colleague's assessment is held back calmly
 * (OD-B4-17). Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24
 * targets, no sideways scroll) and names no assessment or attempt by its reference — not even the
 * export's confirmation: the browser saves the service's file (`submissions-<reference>.csv`, lead
 * decision) and the words name the assessment.
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
const tabs = (page: Page) => page.getByRole('navigation', { name: `${NAME} sections` });
const countLine = (page: Page) => section(page).locator('.fa-tbar p.rk-count[role="status"]');
const rows = (page: Page) => section(page).locator('table.fa-stable tbody tr');
const show = (page: Page) => section(page).getByRole('group', { name: 'Show' });

/** A row's cells as shown: name, attempt line, submitted, status, score, release (no phone labels). */
async function rowCells(row: Locator): Promise<string[]> {
  return row.evaluate((tr) => {
    const cells = [...tr.querySelectorAll('td')];
    const shown = (cell: Element) => {
      const copy = cell.cloneNode(true) as Element;
      for (const hidden of copy.querySelectorAll('.fa-lbl, .xr-sr')) hidden.remove();
      return copy.textContent ?? '';
    };
    return [
      cells[0]?.querySelector('a.rk-rowlink')?.textContent ?? '',
      cells[0]?.querySelector('.fa-cellsub')?.textContent ?? '',
      ...cells.slice(1).map(shown),
    ];
  });
}

/**
 * The table's rows below 760 px of table (`fatable` container) stack: the name and the status side
 * by side, then one cell per line (`fa-ptable`'s two-column grid).
 */
async function expectStacking(page: Page): Promise<void> {
  const width = page.viewportSize()?.width ?? 1440;
  const display = await rows(page)
    .first()
    .evaluate((row) => getComputedStyle(row).display);
  // The content box is narrower than the window by the sidebar (from 1024) and the gutters.
  if (width <= 768) expect(display).toBe('grid');
  if (width === 1440) expect(display).toBe('table-row');
}

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;

/**
 * No reference in the page's words, its accessible names and placeholders, or the tab title — no
 * exception: the export's confirmation names the assessment, not the service's file name.
 */
async function expectNoReferences(page: Page): Promise<void> {
  const found = await page.evaluate(
    ({ source }) => {
      const pattern = new RegExp(source);
      const named = [...document.querySelectorAll('[aria-label],[title],[placeholder]')].map(
        (element) =>
          `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('placeholder') ?? ''}`,
      );
      return [document.body.innerText, document.title, ...named].filter((text) =>
        pattern.test(text),
      );
    },
    { source: REFERENCE.source },
  );
  expect(found).toEqual([]);
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
  test('two waiting: the tab, the count, the rows, the filter, Export CSV and Mark next', async ({
    page,
  }) => {
    const { id, rahul } = await twoSubmitted(page);
    await softNavigate(page, `/faculty/assessments/${id}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/faculty/assessments');
    await expect(tabs(page).getByRole('link')).toHaveText([
      'Summary',
      'Questions4, 4',
      'Settings',
      'Preview',
      'Submissions2, 2',
    ]);
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Submissions2, 2');
    await expect(main(page).locator('.fa-rec .fa-fig').first()).toContainText('14 Nov 2026, 23:59');
    await expect(main(page).locator('.fa-rec-meta .fa-rec-wait')).toHaveText(
      '2 waiting for marking',
    );
    await expect(countLine(page)).toHaveText('2 submissions · 2 waiting for marking');
    await expect(show(page).getByRole('button')).toHaveText([
      'All2, 2',
      'Waiting for marking2, 2',
      'Marked0, 0',
    ]);
    await expect(show(page).getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const markNext = section(page).getByRole('link', { name: 'Mark next' });
    await expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`);
    await expect(markNext).toHaveClass(/\brb-btn--primary\b/);
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
    expect([first[0], first[1], first[3], first[5]]).toEqual([
      'Rahul Verma',
      'Attempt 1 of 2',
      'Waiting for marking',
      'Not yetafter the deadline, 14 Nov 2026, 23:59',
    ]);
    expect(first[4]).toMatch(/^— of 16Marked automatically: \d of 6$/);
    expect([second[0], second[1], second[3], second[5]]).toEqual([
      'Priya Natarajan',
      'Attempt 1 of 2',
      'Waiting for marking',
      'Not yetafter the deadline, 14 Nov 2026, 23:59',
    ]);
    // Submitted at the sample world's "now" (after Flow C: 27 Oct 2026).
    expect(first[2]).toMatch(/^27 Oct 2026, \d\d:\d\d$/);
    await expect(rows(page).locator('.fa-res.fa-res--no svg')).toHaveCount(2);
    // Each row opens FA-19, named by its student.
    await expect(section(page).getByRole('link', { name: 'Mark Rahul Verma' })).toHaveAttribute(
      'href',
      `/faculty/marking/${rahul}`,
    );
    await expectStacking(page);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await shoot(page, 'f7');

    // The in-page filter.
    await reachAndClick(page, show(page).getByRole('button', { name: /^Marked/ }));
    await expect(show(page).getByRole('button', { name: /^Marked/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows(page)).toHaveCount(0);
    await expect(section(page).locator('.rk-state-t')).toHaveText(
      'No submissions match this filter',
    );
    await expect(countLine(page)).toHaveText('2 submissions · 2 waiting for marking');
    await checkState(page, NAME);
    await reachAndClick(page, show(page).getByRole('button', { name: /^Waiting/ }));
    await expect(rows(page)).toHaveCount(2);
    await reachAndClick(page, show(page).getByRole('button', { name: /^Marked/ }));
    await reachAndClick(page, section(page).getByRole('button', { name: 'Show all' }));
    await expect(show(page).getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(rows(page)).toHaveCount(2);

    // Export CSV saves the service's file and confirms it with the file's rows.
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
    await expect(confirmation.locator('.rk-notice-t')).toHaveText(
      `Exported the submissions of ${NAME} as a CSV file · 2 rows`,
    );
    await expect(confirmation.locator('.rk-notice-d')).toHaveText(
      'It contains every submission to this assessment, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.',
    );
    const exported = section(page).getByRole('region', { name: 'Rows in the exported file' });
    await expect(exported.locator('th')).toHaveText([
      'student',
      'student ID',
      'submitted',
      'status',
      'score',
      'result released to student',
    ]);
    await expect(exported.locator('tbody tr')).toHaveCount(2);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await shoot(page, 'f10');

    // Mark next opens FA-19 for the oldest waiting submission.
    await reachAndClick(page, markNext);
    await expect(page).toHaveURL(new RegExp(`/faculty/marking/${rahul}$`));
  });

  test('after marking Rahul; FA-08’s Mark next and See submissions; the tab', async ({ page }) => {
    const { id, rahul, priya } = await twoSubmitted(page);
    await markAndConfirm(page, rahul, '7');
    await softNavigate(page, `/faculty/assessments/${id}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(countLine(page)).toHaveText('2 submissions · 1 waiting for marking');
    const first = await rowCells(rows(page).nth(0));
    expect([first[0], first[3], first[4], first[5]]).toEqual([
      'Rahul Verma',
      'Marked',
      '11 of 16Passed · pass mark 8',
      'Not yetafter the deadline, 14 Nov 2026, 23:59',
    ]);
    await expect(rows(page).nth(0).locator('.xr-st--ok')).toHaveText('Marked');
    await expect(rows(page).nth(1).locator('.xr-st--warn')).toHaveText('Waiting for marking');
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    await expect(
      section(page).getByRole('link', { name: 'View marks for Rahul Verma' }),
    ).toBeVisible();
    await expect(main(page).locator('.fa-rec-meta .fa-rec-wait')).toHaveText(
      '1 waiting for marking',
    );
    await expectNoReferences(page);
    await checkState(page, NAME);
    await shoot(page, 'f8');
    await reachAndClick(page, show(page).getByRole('button', { name: /^Marked/ }));
    await expect(rows(page)).toHaveCount(1);
    expect((await rowCells(rows(page).nth(0)))[0]).toBe('Rahul Verma');

    // The record's Summary tab (the strip scrolls sideways at 375: focus it, then press Enter).
    const summaryTab = tabs(page).getByRole('link', { name: 'Summary' });
    await summaryTab.focus();
    await summaryTab.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}$`));
    const panel = page.getByRole('complementary', { name: 'Submissions' });
    await expect(panel.locator('p.rk-pending')).toHaveText('1 written answer waiting for marking');
    await expect(
      panel.getByRole('list', { name: 'Waiting for marking, oldest first' }).locator('li b'),
    ).toHaveText(['Priya Natarajan']);
    const markNext = panel.getByRole('link', { name: 'Mark next' });
    await expect(markNext).toHaveClass(/\brb-btn--primary\b/);
    await expect(markNext).toHaveAttribute('href', `/faculty/marking/${priya}`);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await shoot(page, 'fa-08-summary', false);
    await reachAndClick(page, panel.getByRole('link', { name: 'See submissions' }));
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(countLine(page)).toHaveText('2 submissions · 1 waiting for marking');
  });

  test('released after the deadline (after Flow D)', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RANGANATHAN });
    await page.goto(`/faculty/assessments/${ASMT}/submissions`);
    await expect(section(page)).toBeVisible({ timeout: 60_000 });
    await expect(countLine(page)).toHaveText('1 submission · 0 waiting for marking');
    await expect(rows(page)).toHaveCount(1);
    expect(await rowCells(rows(page).nth(0))).toEqual([
      'Rahul Verma',
      'Attempt 1 of 2',
      '5 Nov 2026, 18:52',
      'Marked',
      '11 of 16Passed · pass mark 8',
      'Released14 Nov 2026, 23:59, after the deadline',
    ]);
    await expect(rows(page).locator('.fa-res.fa-res--ok')).toHaveText('Released');
    await expect(rows(page).locator('.fa-res--no')).toHaveCount(0);
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveText('Submissions1, 1');
    await expectStacking(page);
    await expectNoReferences(page);
    await checkState(page, NAME);
    await shoot(page, 'f9');
  });

  test('no submissions yet, reached by the record’s Submissions tab', async ({ page }) => {
    const id = await createOnC(page);
    await softNavigate(page, `/faculty/assessments/${id}`);
    await expect(page.getByRole('region', { name: 'Ready to use' })).toBeVisible({
      timeout: 60_000,
    });
    // No count while nothing is submitted.
    const tab = tabs(page).getByRole('link', { name: /^Submissions/ });
    await expect(tab).toHaveText('Submissions');
    await tab.focus();
    await tab.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/faculty/assessments/${id}/submissions$`));
    await expect(countLine(page)).toHaveText('0 submissions · 0 waiting for marking');
    const empty = section(page).locator('.rk-state');
    await expect(empty.locator('.rk-state-t')).toHaveText('No submissions yet');
    await expect(empty).toContainText(
      'Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. Their submissions appear here.',
    );
    await expect(section(page).getByRole('link', { name: 'Mark next' })).toHaveCount(0);
    // Nothing to export or filter yet (the export draws neither without a submission).
    await expect(section(page).getByRole('button', { name: 'Export CSV' })).toHaveCount(0);
    await expect(show(page)).toHaveCount(0);
    await expectNoReferences(page);
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
    await expectNoReferences(page);
    await checkState(page, 'Submissions');
    await shoot(page, 'policy-open', false);
  });
});
