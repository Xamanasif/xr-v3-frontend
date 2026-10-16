import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem } from '../support/workspace';

/**
 * ST-11 Assessments (board B4-11 f0 … f6), the experiment hub's Assessment tab (f7 … f9) and Home's
 * "Up next" assessment row (f10), on the test-hook build at 1440, 1024, 768 and 375, as Rahul
 * Verma. After Flow C (27 Oct) there is no assessment (f5, f8); Dr S. Ranganathan then creates
 * ASMT-0009 through his own port (the walk's D1) — To do (f0, f6, f7, f10); Rahul's attempt is
 * started, answered and submitted through his own port (D2: in progress f1, waiting f2, f9); the
 * Faculty member marks and confirms (D3: not released yet, f3); after Flow D the result is
 * released (f4). Those set-ups go through `actAs` (the CI seam); the screens' own interactions —
 * the state tabs, the row actions, the hub's tab strip, Home's "Open assessment" — are real
 * clicks. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24
 * targets, no developer surface, no sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The shared dev server compiles a route on its first visit.
test.describe.configure({ timeout: 240_000 });

const RAHUL = { personId: 'per-0002' };
const RANGANATHAN = { personId: 'per-0014' };
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const LIST = '/student/assessments';
const HUB = `/student/experiments/${SHELL}`;
const TAB = `${HUB}/assessment`;
/** The course code Rahul sees on these worlds (the platform's; B4-11 draws the institution's). */
const CODE = 'MEC-523';
const FIRST_LOAD = { timeout: 120_000 };

const main = (page: Page) => page.locator('main');
const list = (page: Page) => page.getByRole('region', { name: 'Your assessments' });
const rows = (page: Page) => list(page).locator('ul.xr-rows > li.xr-row');
const segments = (page: Page) => page.getByRole('group', { name: 'Show' }).getByRole('button');
const hubTabs = (page: Page) => page.getByRole('navigation', { name: SHELL_NAME });

async function open(page: Page, fixture: string, path: string): Promise<void> {
  await bootWorld(page, { fixture, session: RAHUL });
  await page.goto(path);
}

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };

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

/** D1: Dr S. Ranganathan creates ASMT-0009 (after the deadline, four questions). */
async function created(page: Page): Promise<void> {
  const assessment = await port<{ readonly id: string }>(
    page,
    RANGANATHAN,
    'assessments',
    'createAssessment',
    {
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
  );
  expect(assessment.id).toBe(ASMT);
}

interface AttemptRecord {
  readonly id: string;
  readonly rev: number;
}

/** D2: Rahul starts the attempt through his own port. */
async function started(page: Page): Promise<AttemptRecord> {
  return port<AttemptRecord>(page, RAHUL, 'assessments', 'startAttempt', ASMT);
}

/** D2: Rahul answers the four questions and submits. */
async function submitted(page: Page): Promise<string> {
  let attempt = await started(page);
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: 'Fouling adds a resistance, so U falls.' }],
  ] as const) {
    attempt = await port<AttemptRecord>(page, RAHUL, 'assessments', 'saveAnswer', {
      attemptId: attempt.id,
      questionId,
      answer,
      expectedRev: attempt.rev,
    });
  }
  await port(page, RAHUL, 'assessments', 'submitAttempt', {
    attemptId: attempt.id,
    expectedRev: attempt.rev,
  });
  return attempt.id;
}

/** D3: Dr Ranganathan marks the written answer and confirms the marks. */
async function confirmed(page: Page, attemptId: string): Promise<void> {
  const view = await port<{ readonly attempt: AttemptRecord }>(
    page,
    RANGANATHAN,
    'marking',
    'getAttemptForMarking',
    attemptId,
  );
  const saved = await port<AttemptRecord>(page, RANGANATHAN, 'marking', 'saveMark', {
    attemptId,
    questionId: 'Q-0106',
    mark: '7',
    feedback: 'Clear explanation of fouling.',
    expectedRev: view.attempt.rev,
  });
  await port(page, RANGANATHAN, 'marking', 'confirmMarks', {
    attemptId,
    expectedRev: saved.rev,
  });
}

/** A row's text parts, as the board lays them out. */
async function expectRow(
  row: Locator,
  parts: {
    readonly line: string | RegExp;
    readonly status: string;
    readonly tone: string;
    readonly action: string;
    readonly href: string;
  },
): Promise<void> {
  await expect(row.locator('.xr-row-title')).toHaveText(NAME);
  await expect(row.locator('.xr-row-sub')).toHaveText([`${SHELL_NAME} · ${CODE}`, parts.line]);
  await expect(row.locator('.xr-status')).toHaveText(parts.status);
  await expect(row.locator('.xr-status')).toHaveClass(new RegExp(`xr-status--${parts.tone}`));
  const link = row.getByRole('link', { name: `${parts.action} ${NAME}` });
  await expect(link).toHaveText(parts.action);
  await expect(link).toHaveAttribute('href', parts.href);
  await expect(link).toHaveClass(/xr-btn--secondary/);
}

test.describe('ST-11 Assessments', () => {
  test('none yet (after Flow C): the empty state, Assessments current (f5)', async ({ page }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 2, name: 'No assessments yet' })).toBeVisible(
      FIRST_LOAD,
    );
    await expect(main(page).locator('.xr-empty')).toContainText(
      'When your faculty sets an assessment for an experiment you have, it appears here.',
    );
    await expect(main(page).locator('.xr-phead-meta')).toHaveText(
      'Assessments for the experiments you have',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', LIST);
    await checkState(page, 'Assessments');
  });

  test('to do (D1): the row, the state tabs in the address, "Open" → Before you start (f0, f6)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 2, name: 'No assessments yet' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    await expect(rows(page)).toHaveCount(1);
    await expect(segments(page)).toHaveText(['To do (1)', 'Submitted (0)', 'Results (0)']);
    await expect(segments(page).first()).toHaveAttribute('aria-pressed', 'true');
    await expectRow(rows(page).first(), {
      line: 'Due 14 Nov 2026, 23:59 · 4 questions · no time limit',
      status: 'To do',
      tone: 'info',
      action: 'Open',
      href: `${LIST}/${ASMT}`,
    });
    await checkState(page, 'Assessments');

    // The state tabs switch the list in place; the address keeps the tab (replaced).
    await reachAndClick(page, segments(page).nth(1));
    await page.waitForURL(`**${LIST}?tab=submitted`);
    await expect(segments(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(rows(page)).toHaveCount(0);
    await expect(list(page).locator('.xr-section-body')).toHaveText(
      'Nothing submitted and waiting.',
    );
    await checkState(page, 'Assessments');
    await reachAndClick(page, segments(page).nth(2));
    await page.waitForURL(`**${LIST}?tab=results`);
    await expect(list(page).locator('.xr-section-body')).toHaveText('No results released yet.');
    await reachAndClick(page, segments(page).nth(0));
    await page.waitForURL((url) => url.pathname === LIST && url.search === '');
    await expect(rows(page)).toHaveCount(1);

    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `Open ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });

  test('attempt in progress (D2): "Answers saved", "Continue attempt" → the attempt (f1)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', LIST);
    await expect(page.getByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    await started(page);
    await expect(rows(page).first().locator('.xr-status')).toHaveText('Attempt in progress');
    await expect(segments(page)).toHaveText(['To do (1)', 'Submitted (0)', 'Results (0)']);
    await expectRow(rows(page).first(), {
      line: 'Answers saved · due 14 Nov 2026, 23:59',
      status: 'Attempt in progress',
      tone: 'wait',
      action: 'Continue attempt',
      href: `${LIST}/${ASMT}/attempt`,
    });
    await checkState(page, 'Assessments');
    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `Continue attempt ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/attempt`, FIRST_LOAD);
  });

  test('waiting for marking, then not released yet (D2, D3): the Submitted tab, "View" (f2, f3)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${LIST}?tab=submitted`);
    await expect(page.getByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    const attemptId = await submitted(page);
    await expect(rows(page)).toHaveCount(1);
    await expect(segments(page)).toHaveText(['To do (0)', 'Submitted (1)', 'Results (0)']);
    await expect(segments(page).nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expectRow(rows(page).first(), {
      // The sample clock runs from the world's 27 Oct 10:00 while the page is open.
      line: /^Submitted 27 Oct 2026, 10:0\d · your faculty marks written answers$/,
      status: 'Waiting for marking',
      tone: 'wait',
      action: 'View',
      href: `${LIST}/${ASMT}/result`,
    });
    await checkState(page, 'Assessments');

    await confirmed(page, attemptId);
    await expect(rows(page).first().locator('.xr-status')).toHaveText('Result not released yet');
    await expectRow(rows(page).first(), {
      line: 'Released after the deadline: 14 Nov 2026, 23:59',
      status: 'Result not released yet',
      tone: 'off',
      action: 'View',
      href: `${LIST}/${ASMT}/result`,
    });
    // Confirmed marks, still no figure before the release.
    await expect(main(page)).not.toContainText(/of 16|Passed/);
    await checkState(page, 'Assessments');
    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `View ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });

  test('result ready (after Flow D): the Results tab, "See result" → the result (f4)', async ({
    page,
  }) => {
    await open(page, 'after-flow-d', `${LIST}?tab=results`);
    await expect(rows(page)).toHaveCount(1, FIRST_LOAD);
    await expect(segments(page)).toHaveText(['To do (0)', 'Submitted (0)', 'Results (1)']);
    await expectRow(rows(page).first(), {
      line: 'Released 14 Nov 2026, 23:59',
      status: 'Result ready',
      tone: 'ok',
      action: 'See result',
      href: `${LIST}/${ASMT}/result`,
    });
    await checkState(page, 'Assessments');
    await reachAndClick(
      page,
      rows(page)
        .first()
        .getByRole('link', { name: `See result ${NAME}` }),
    );
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });
});

test.describe('the hub’s Assessment tab', () => {
  test('none set yet, then to do: the empty state, the row and "Open assessment" (f8, f7)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', `${HUB}/progress`);
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible(FIRST_LOAD);
    // The strip lists the Assessment tab; it opens the tab.
    await expect(hubTabs(page).getByRole('link')).toHaveText([
      'Overview',
      'Resources',
      'Simulation',
      'Assessment',
      'Progress',
    ]);
    const tab = hubTabs(page).getByRole('link', { name: 'Assessment', exact: true });
    await tab.scrollIntoViewIfNeeded();
    await reachAndClick(page, tab);
    await page.waitForURL(`**${TAB}`, FIRST_LOAD);
    await expect(hubTabs(page).locator('[aria-current="page"]')).toHaveText('Assessment');
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'Your faculty hasn’t set an assessment for this experiment yet',
      }),
    ).toBeVisible(FIRST_LOAD);
    await expect(main(page).locator('.xr-empty')).toContainText(
      'When they do, it appears here and in Assessments.',
    );
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/courses');
    await checkState(page, SHELL_NAME);

    await created(page);
    const section = page.getByRole('region', { name: 'Assessment', exact: true });
    const row = section.locator('li.xr-row');
    await expect(row).toHaveCount(1);
    await expect(row.locator('.xr-row-sub')).toHaveText(
      'Due 14 Nov 2026, 23:59 · 4 questions · 16 marks · no time limit',
    );
    await expect(row.locator('.xr-status')).toHaveText('To do');
    const openAssessment = row.getByRole('link', { name: 'Open assessment' });
    await expect(openAssessment).toHaveClass(/xr-btn--primary/);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, openAssessment);
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });

  test('waiting for marking: "your result appears after the deadline", "View" → the result (f9)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', TAB);
    await expect(page.getByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible(FIRST_LOAD);
    await created(page);
    await submitted(page);
    const row = page.getByRole('region', { name: 'Assessment', exact: true }).locator('li.xr-row');
    await expect(row.locator('.xr-status')).toHaveText('Waiting for marking');
    await expect(row.locator('.xr-row-sub')).toHaveText(
      /^Submitted 27 Oct 2026, 10:0\d · your result appears after the deadline$/,
    );
    const view = row.getByRole('link', { name: 'View' });
    await expect(view).toHaveClass(/xr-btn--secondary/);
    await checkState(page, SHELL_NAME);
    await reachAndClick(page, view);
    await page.waitForURL(`**${LIST}/${ASMT}/result`, FIRST_LOAD);
  });
});

test.describe('Home · Up next', () => {
  test('the assessment to do, named; "Open assessment" → Before you start (f10)', async ({
    page,
  }) => {
    await open(page, 'after-flow-c', '/student');
    await expect(page.getByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible(
      FIRST_LOAD,
    );
    await created(page);
    const upNext = page.getByRole('region', { name: 'Up next' });
    const row = upNext.locator('li.xr-row', { hasText: 'Heat Exchanger — post-lab is ready' });
    await expect(row).toHaveCount(1);
    await expect(row.locator('.xr-row-sub')).toHaveText(
      `${SHELL_NAME} · assessment · due 14 Nov 2026, 23:59`,
    );
    await checkState(page, 'Hello, Rahul');
    await reachAndClick(page, row.getByRole('link', { name: 'Open assessment' }));
    await page.waitForURL(`**${LIST}/${ASMT}`, FIRST_LOAD);
  });
});
