import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * ST-14 Result (board B4-13 f0 … f5) on the test-hook build, at 1440, 1024, 768 and 375, as Rahul
 * Verma. After Flow D, ATT-0450 is released after the deadline: "You passed", 11 of 16, every
 * answer with its key, explanation and feedback (f0, f5). After Flow C, Dr Ranganathan creates
 * the assessment through the assessments port and Rahul answers and submits through it (the CI
 * seam sets the state only): waiting for marking (f1), then — confirmed by Dr Ranganathan in the
 * same world — not released yet (f2); a deadline already passed with marking not finished (f4);
 * "Not passed this time" released at once, whose "Try again" starts attempt 2 and opens it (f3);
 * no submitted attempt. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible
 * focus, 24 × 24 targets, no sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.describe.configure({ timeout: 120_000 });

const RAHUL = { personId: 'per-0002' };
const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const HUB = `/student/experiments/${SHELL}`;
const NAME = 'Heat Exchanger — post-lab';
const SHOTS = join(
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/e6f2f9f4-aaaa-49f8-bcc7-f8cf4cd1eb0d/scratchpad',
  'shots-product',
  'result',
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

const RIGHT: readonly (readonly [string, Answer])[] = [
  ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
  ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
  ['Q-0104', { type: 'true-false', value: true }],
  ['Q-0106', { type: 'written', text: 'Fouling adds a resistance, so U falls.' }],
];

/** B4-13 f3's answers: 2 of the 6 choice marks. */
const WRONG: readonly (readonly [string, Answer])[] = [
  ['Q-0101', { type: 'multiple-choice', choice: 'B' }],
  ['Q-0102', { type: 'multiple-choice', choice: 'A' }],
  ['Q-0104', { type: 'true-false', value: false }],
  [
    'Q-0106',
    {
      type: 'written',
      text: 'Fouling makes the tubes dirty so the exchanger works less well. It should be cleaned.',
    },
  ],
];

const main = (page: Page) => page.locator('main');
const resultAddress = (id: string) => `/student/assessments/${id}/result`;

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

function must<T>(answer: Answered<T>, what: string): T {
  if (!answer.ok) throw new Error(`${what}: ${JSON.stringify(answer.error)}`);
  return answer.value;
}

/** After Flow C, as Rahul on his Help page: Dr Ranganathan creates the post-lab (the walk's D1). */
async function postLab(
  page: Page,
  rules: { readonly releaseOption: string; readonly deadline?: string },
): Promise<string> {
  await bootWorld(page, { fixture: 'after-flow-c', session: RAHUL });
  await page.goto('/student/help');
  await waitForShell(page);
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
        deadline: rules.deadline ?? '2026-11-14T23:59:00+05:30',
        releaseOption: rules.releaseOption,
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    },
  });
  return must(created, 'create the assessment').id;
}

/** Rahul starts, answers and submits through the port (set-up only; ST-13 is its own suite). */
async function submit(
  page: Page,
  assessmentId: string,
  answers: readonly (readonly [string, Answer])[],
): Promise<string> {
  let attempt = must(
    await actAs<Answered<AttemptRecord>>(page, RAHUL, {
      port: 'assessments',
      method: 'startAttempt',
      input: assessmentId,
    }),
    'start',
  );
  for (const [questionId, answer] of answers) {
    attempt = must(
      await actAs<Answered<AttemptRecord>>(page, RAHUL, {
        port: 'assessments',
        method: 'saveAnswer',
        input: { attemptId: attempt.id, questionId, answer, expectedRev: attempt.rev },
      }),
      `answer ${questionId}`,
    );
  }
  must(
    await actAs<Answered<AttemptRecord>>(page, RAHUL, {
      port: 'assessments',
      method: 'submitAttempt',
      input: { attemptId: attempt.id, expectedRev: attempt.rev },
    }),
    'submit',
  );
  return attempt.id;
}

/** Dr Ranganathan marks the written answer and confirms (FA-19's commands). */
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
        feedback: 'You named the cause. Explain what changes and use your readings.',
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

async function expectNoFigure(page: Page): Promise<void> {
  await expect(main(page).locator('.xa-score, .xa-ans, .xa-mk')).toHaveCount(0);
  await expect(main(page)).not.toContainText(/of 16 marks|Passed|Correct answer|Explanation/);
}

test.describe('ST-14 Result', () => {
  test('released and passed: the score card, every answer, the actions (f0, f5)', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RAHUL });
    await page.goto(resultAddress('ASMT-0009'));
    await expect(page.getByRole('heading', { level: 1, name: 'You passed' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/assessments');
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveText(`${NAME} · result`);
    await expect(main(page).locator('.xa-score-n')).toHaveText('11 of 16 marks');
    await expect(main(page).locator('.xa-score-sub .xr-status--ok')).toHaveText('Passed');
    await expect(main(page).locator('.xa-score-facts > span')).toHaveText([
      'Pass mark 50% · 8 of 16 marks',
      'Attempt 1 of 2',
      'Released 14 Nov 2026, 23:59, after the deadline',
    ]);
    await expect(page.getByRole('heading', { level: 2, name: 'Your answers' })).toBeVisible();
    await expect(main(page).locator('ul.xa-ans > li .xa-q-n')).toHaveText([
      'Question 1 · Multiple choice',
      'Question 2 · Multiple choice',
      'Question 3 · True or false',
      'Question 4 · Written answer',
    ]);
    await expect(main(page).locator('ul.xa-ans > li .xa-mk')).toHaveText([
      '2 of 2 marks',
      '0 of 2 marks',
      '2 of 2 marks',
      '7 of 10 marks',
    ]);
    await expect(main(page).locator('ul.xa-ans > li').last()).toContainText(
      'Feedback from Dr S. Ranganathan',
    );
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'Back to experiment',
      'See your progress',
    ]);
    // The answer rows stack below 600 px of content width (f5), side by side above it (f0).
    const row = main(page).locator('ul.xa-ans > li').first().locator('.xa-ans-row').first();
    const [label, value] = [row.locator('span').first(), row.locator('span').last()];
    const labelBox = (await label.boundingBox())!;
    const valueBox = (await value.boundingBox())!;
    if ((page.viewportSize()?.width ?? 1440) <= 375) {
      expect(valueBox.y).toBeGreaterThan(labelBox.y + labelBox.height - 1);
    } else if ((page.viewportSize()?.width ?? 1440) >= 1024) {
      expect(Math.abs(valueBox.y - labelBox.y)).toBeLessThan(2);
    }
    await checkState(page, 'You passed');
    // "See your progress" opens Progress (ST-15); Back returns, then "Back to experiment" (ST-05).
    await reachAndClick(page, page.getByRole('link', { name: 'See your progress' }));
    await expect(page).toHaveURL(/\/student\/progress$/);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'You passed' })).toBeVisible();
    await reachAndClick(page, page.getByRole('link', { name: 'Back to experiment' }));
    await expect(page).toHaveURL(new RegExp(`${HUB}$`));
  });

  test('submitted: waiting for marking, then marked but not released — no figure (f1, f2)', async ({
    page,
  }) => {
    const id = await postLab(page, { releaseOption: 'after-deadline' });
    const attemptId = await submit(page, id, RIGHT);
    await softNavigate(page, resultAddress(id));
    const waiting = page.getByRole('heading', {
      level: 1,
      name: 'Submitted — waiting for marking',
    });
    await expect(waiting).toBeVisible({ timeout: 60_000 });
    // The sample clock runs on from 27 Oct 2026, 10:00 on the dev server.
    await expect(main(page).locator('.xr-msg .xr-lead')).toHaveText(
      /^You submitted on 27 Oct 2026, \d\d:\d\d\. Your faculty marks written answers\. Your result appears after the deadline: 14 Nov 2026, 23:59\.$/,
    );
    await expectNoFigure(page);
    await checkState(page, 'Submitted — waiting for marking');
    // Dr Ranganathan confirms the marks in the same world: the page follows, still no figure.
    await markAndConfirm(page, attemptId, '7');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Result not released yet' }),
    ).toBeVisible();
    await expect(main(page).locator('.xr-msg .xr-lead')).toHaveText(
      'Your answers have been marked. Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    await expectNoFigure(page);
    await expect(main(page)).not.toContainText('You named the cause');
    await checkState(page, 'Result not released yet');
    await reachAndClick(page, page.getByRole('link', { name: 'Back to experiment' }));
    await expect(page).toHaveURL(new RegExp(`${HUB}$`));
  });

  test('the deadline has passed, marking not finished: still waiting, never a partial score (f4)', async ({
    page,
  }) => {
    // The sample "now" is 27 Oct 2026; this version's deadline passed on 20 Oct.
    const id = await postLab(page, {
      releaseOption: 'after-deadline',
      deadline: '2026-10-20T23:59:00+05:30',
    });
    await submit(page, id, RIGHT);
    await softNavigate(page, resultAddress(id));
    await expect(
      page.getByRole('heading', { level: 1, name: 'Submitted — waiting for marking' }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(main(page).locator('.xr-msg .xr-lead')).toContainText(
      'Your result appears after the deadline: 20 Oct 2026, 23:59.',
    );
    await expectNoFigure(page);
    await checkState(page, 'Submitted — waiting for marking');
  });

  test('not passed with an attempt left: Try again starts attempt 2 and opens it (f3)', async ({
    page,
  }) => {
    const id = await postLab(page, { releaseOption: 'immediately-after-marking' });
    const attemptId = await submit(page, id, WRONG);
    await markAndConfirm(page, attemptId, '4');
    await softNavigate(page, resultAddress(id));
    await expect(page.getByRole('heading', { level: 1, name: 'Not passed this time' })).toBeVisible(
      { timeout: 60_000 },
    );
    await expect(main(page).locator('.xa-score-n')).toHaveText('6 of 16 marks');
    await expect(main(page).locator('.xa-score-sub .xr-status--err')).toHaveText('Not passed');
    await expect(main(page).locator('.xa-score-facts > span')).toHaveText([
      'Pass mark 50% · 8 of 16 marks',
      'Attempt 1 of 2',
      /^Released 27 Oct 2026, \d\d:\d\d, when marked$/,
    ]);
    await expect(main(page).locator('ul.xa-ans > li .xa-mk')).toHaveText([
      '0 of 2 marks',
      '2 of 2 marks',
      '0 of 2 marks',
      '4 of 10 marks',
    ]);
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'Back to experiment',
      'Try again',
      'You have 1 attempt left.',
      'See your progress',
    ]);
    await checkState(page, 'Not passed this time');
    await reachAndClick(page, page.getByRole('button', { name: 'Try again' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    const intro = await actAs<
      Answered<{
        readonly attempts: readonly { readonly attemptNumber: number; readonly state: string }[];
      }>
    >(page, RAHUL, { port: 'assessments', method: 'getAssessmentIntro', input: id });
    expect(must(intro, 'intro').attempts.map((attempt) => attempt.state)).toEqual([
      'submitted',
      'in-progress',
    ]);
  });

  test('no submitted attempt: "Not submitted yet" with Back to the assessment', async ({
    page,
  }) => {
    const id = await postLab(page, { releaseOption: 'after-deadline' });
    await softNavigate(page, resultAddress(id));
    await expect(page.getByRole('heading', { level: 1, name: 'Not submitted yet' })).toBeVisible({
      timeout: 60_000,
    });
    await expectNoFigure(page);
    await checkState(page, 'Not submitted yet');
    await reachAndClick(page, page.getByRole('link', { name: 'Back to the assessment' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}$`));
  });

  test.describe('screenshots for the board comparison', () => {
    test.skip(({ viewport }) => viewport?.width !== 1440, 'taken once, at the frames’ widths');

    test('f0 at 1440, f5 at 375 (after Flow D)', async ({ page }) => {
      mkdirSync(SHOTS, { recursive: true });
      await bootWorld(page, { fixture: 'after-flow-d', session: RAHUL });
      await page.goto(resultAddress('ASMT-0009'));
      await expect(page.getByRole('heading', { level: 1, name: 'You passed' })).toBeVisible({
        timeout: 60_000,
      });
      await page.screenshot({ path: join(SHOTS, 'f0.png'), fullPage: true });
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(SHOTS, 'f5.png'), fullPage: true });
    });

    test('f1, f2 at 720', async ({ page }) => {
      mkdirSync(SHOTS, { recursive: true });
      await page.setViewportSize({ width: 720, height: 560 });
      const id = await postLab(page, { releaseOption: 'after-deadline' });
      const attemptId = await submit(page, id, RIGHT);
      await softNavigate(page, resultAddress(id));
      await expect(
        page.getByRole('heading', { level: 1, name: 'Submitted — waiting for marking' }),
      ).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: join(SHOTS, 'f1.png'), fullPage: true });
      await markAndConfirm(page, attemptId, '7');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Result not released yet' }),
      ).toBeVisible();
      await page.screenshot({ path: join(SHOTS, 'f2.png'), fullPage: true });
    });

    test('f3 at 720', async ({ page }) => {
      mkdirSync(SHOTS, { recursive: true });
      await page.setViewportSize({ width: 720, height: 560 });
      const id = await postLab(page, { releaseOption: 'immediately-after-marking' });
      const attemptId = await submit(page, id, WRONG);
      await markAndConfirm(page, attemptId, '4');
      await softNavigate(page, resultAddress(id));
      await expect(
        page.getByRole('heading', { level: 1, name: 'Not passed this time' }),
      ).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: join(SHOTS, 'f3.png'), fullPage: true });
    });
  });
});
