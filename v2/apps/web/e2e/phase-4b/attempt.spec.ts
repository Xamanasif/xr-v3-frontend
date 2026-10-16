import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, waitForShell } from '../support/workspace';

/**
 * ST-12 Before you start (board B4-11 f11 … f16) and ST-13 the attempt (board B4-12 f0 … f6) on the
 * test-hook build, at 1440, 1024, 768 and 375, as Rahul Verma. After Flow C, Dr S. Ranganathan
 * creates "Heat Exchanger — post-lab" through the assessments port (the walk's D1: 4 questions,
 * 16 marks, pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline); every
 * Student state is then reached by the Student's own clicks, or set up through the CI seam
 * (`actAs`) and read by the screen. Save and submit failures are proven in the component tests
 * (`src/features/student/attempt.test.tsx`: no fault seam in the browser). Each drawn state passes
 * `checkState` (axe WCAG A/AA, one h1, visible focus, 24 × 24 targets, no sideways scroll).
 */
test.use({ baseURL: TEST_HOOKS_URL });
test.describe.configure({ timeout: 120_000 });

const RAHUL = { personId: 'per-0002' };
const RANGANATHAN = { personId: 'per-0014' };
const SHELL = 'shell-and-tube-heat-exchanger';
const NAME = 'Heat Exchanger — post-lab';
const EXPERIMENT = 'Shell-and-Tube Heat Exchanger';
const INTRODUCTION =
  'Four short questions on what you measured in the Shell-and-Tube Heat Exchanger simulation. One answer is written; your faculty marks it.';
const WRITTEN = 'Q-0106';

/** Screenshots for the visual comparison with the boards (only when a folder is named). */
async function shot(page: Page, name: string): Promise<void> {
  const folder = process.env['XR_PRODUCT_SHOTS'];
  if (!folder) return;
  mkdirSync(folder, { recursive: true });
  const width = page.viewportSize()?.width ?? 0;
  await page.screenshot({ path: join(folder, `${name}-${width}.png`), fullPage: true });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

interface Answer<T> {
  readonly ok: boolean;
  readonly value: T;
}

function ok<T>(answer: Answer<T>): T {
  expect(answer.ok, JSON.stringify(answer)).toBe(true);
  return answer.value;
}

/** After Flow C, as Rahul; Dr Ranganathan creates the assessment (D1). Its id. */
async function setUp(
  page: Page,
  options: {
    readonly introduction?: string | null;
    readonly release?: 'after-deadline' | 'immediately-after-marking';
  } = {},
): Promise<string> {
  await bootWorld(page, { fixture: 'after-flow-c', session: RAHUL });
  await page.goto('/student/help');
  await waitForShell(page);
  const created = await actAs<Answer<{ readonly id: string }>>(page, RANGANATHAN, {
    port: 'assessments',
    method: 'createAssessment',
    input: {
      mode: 'create',
      experimentId: SHELL,
      name: NAME,
      introduction: options.introduction ?? null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: options.release ?? 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    },
  });
  return ok(created).id;
}

interface AttemptValue {
  readonly id: string;
  readonly rev: number;
}

/** Rahul starts an attempt through the seam, answers as given, and (optionally) submits. */
async function rahulAttempt(
  page: Page,
  assessmentId: string,
  answers: readonly (readonly [string, unknown])[],
  submit: boolean,
): Promise<AttemptValue> {
  let attempt = ok(
    await actAs<Answer<AttemptValue>>(page, RAHUL, {
      port: 'assessments',
      method: 'startAttempt',
      input: assessmentId,
    }),
  );
  for (const [questionId, answer] of answers) {
    attempt = ok(
      await actAs<Answer<AttemptValue>>(page, RAHUL, {
        port: 'assessments',
        method: 'saveAnswer',
        input: { attemptId: attempt.id, questionId, answer, expectedRev: attempt.rev },
      }),
    );
  }
  if (submit) {
    attempt = ok(
      await actAs<Answer<AttemptValue>>(page, RAHUL, {
        port: 'assessments',
        method: 'submitAttempt',
        input: { attemptId: attempt.id, expectedRev: attempt.rev },
      }),
    );
  }
  return attempt;
}

/** Dr Ranganathan marks the written answer and confirms the marks. */
async function markAndConfirm(page: Page, attemptId: string, mark: string): Promise<void> {
  const marking = ok(
    await actAs<Answer<{ readonly attempt: AttemptValue }>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'getAttemptForMarking',
      input: attemptId,
    }),
  );
  const saved = ok(
    await actAs<Answer<AttemptValue>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'saveMark',
      input: {
        attemptId,
        questionId: WRITTEN,
        mark,
        feedback: '',
        expectedRev: marking.attempt.rev,
      },
    }),
  );
  ok(
    await actAs<Answer<AttemptValue>>(page, RANGANATHAN, {
      port: 'marking',
      method: 'confirmMarks',
      input: { attemptId, expectedRev: saved.rev },
    }),
  );
}

const main = (page: Page) => page.locator('main');
const facts = (page: Page) => main(page).locator('dl.xa-facts > div');
const notice = (page: Page) => main(page).locator('.xr-notice');
const bar = (page: Page) => page.locator('header.xa-bar');
const save = (page: Page) => bar(page).locator('.xa-save');
const strip = (page: Page) => page.getByRole('navigation', { name: 'Your answers' });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Submit your answers?' });

async function factsText(page: Page): Promise<string[]> {
  return (await facts(page).allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
}

const DRAWN_FACTS = [
  'Questions 4 2 multiple choice · 1 true or false · 1 written answer',
  'Total marks 16',
  'Pass mark 50% 8 of 16 marks',
  'Attempts allowed 2 You have used none',
  'Deadline 14 Nov 2026, 23:59',
  'Result and answers After the deadline Your faculty marks written answers',
];

test.describe('ST-12 Before you start', () => {
  test('to do: the six key facts as configured, Start assessment opens the attempt (f11, f16)', async ({
    page,
  }) => {
    const id = await setUp(page, { introduction: INTRODUCTION });
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible({
      timeout: 30_000,
    });
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/assessments');
    await expect(main(page).locator('a.xr-back')).toHaveText(EXPERIMENT);
    await expect(main(page).locator('a.xr-back')).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}`,
    );
    await expect(main(page).locator('.xr-phead .xr-overline')).toHaveText(
      `${EXPERIMENT} · assessment`,
    );
    await expect(main(page).locator('p.xr-lead')).toHaveText(INTRODUCTION);
    expect(await factsText(page)).toEqual(DRAWN_FACTS);
    await expect(main(page).locator('p.xl-open')).toHaveText(
      'No time limit. Answers save as you go, and nothing is submitted until you choose Submit.',
    );
    await expect(notice(page)).toHaveCount(0);
    const actions = main(page).locator('.xw-actions > *');
    await expect(actions).toHaveText(['Start assessment', 'Back to experiment']);
    await expect(main(page).locator('.xr-btn--primary')).toHaveText(['Start assessment']);
    await expect(page.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}`,
    );
    // f16 at 375: the facts in one column.
    const width = page.viewportSize()?.width ?? 1440;
    const boxes = await facts(page).evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().x),
    );
    expect(new Set(boxes.map(Math.round)).size).toBe(width < 600 ? 1 : 2);
    await checkState(page, NAME);
    await shot(page, 'st12-f11');

    await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await expect(page.locator('.xr-phead .xr-overline')).toHaveText(
      `${EXPERIMENT} · Attempt 1 of 2`,
    );
    await expect(strip(page).locator('.xa-strip-text')).toHaveText('0 of 4 answered');
  });

  test('an attempt in progress: “Attempt 1 in progress”, Continue attempt (f12)', async ({
    page,
  }) => {
    const id = await setUp(page);
    await rahulAttempt(
      page,
      id,
      [
        ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
        ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
      ],
      false,
    );
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page).locator('.xr-notice-title')).toHaveText('Attempt 1 in progress', {
      timeout: 30_000,
    });
    await expect(notice(page)).toContainText(
      'Your answers are saved. Two of four questions answered.',
    );
    await expect(notice(page)).not.toHaveClass(/xr-notice--/);
    // No introduction was written (the walk's D1): none is shown.
    await expect(main(page).locator('p.xr-lead')).toHaveCount(0);
    expect(await factsText(page)).toEqual(DRAWN_FACTS);
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'Continue attempt',
      'Back to experiment',
    ]);
    await checkState(page, NAME);
    await shot(page, 'st12-f12');

    await reachAndClick(page, page.getByRole('link', { name: 'Continue attempt' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(strip(page).locator('.xa-strip-text')).toHaveText('2 of 4 answered');
    await expect(
      page.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    ).toBeChecked();
    await expect(page.getByRole('radio', { name: 'C_min ÷ C_max' })).toBeChecked();
    await expect(strip(page).locator('a.is-done')).toHaveText(['1', '2']);
  });

  test('submitted: “Submitted — waiting for marking”, See result page (f13)', async ({ page }) => {
    const id = await setUp(page);
    await rahulAttempt(page, id, [['Q-0101', { type: 'multiple-choice', choice: 'A' }]], true);
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page).locator('.xr-notice-title')).toHaveText(
      'Submitted — waiting for marking',
      { timeout: 30_000 },
    );
    await expect(notice(page)).toHaveClass(/xr-notice--warn/);
    await expect(notice(page)).toContainText(
      'You submitted on 27 Oct 2026, 10:00. Your result appears after the deadline.',
    );
    await expect(facts(page).nth(3)).toContainText('You have used 1');
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'See result page',
      'Back to experiment',
    ]);
    await expect(page.getByRole('link', { name: 'See result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    // No figure of any kind before the result is released.
    await expect(main(page)).not.toContainText(/of 16 marks scored|Passed|Not passed/);
    await checkState(page, NAME);
    await shot(page, 'st12-f13');
  });

  test('not passed with an attempt left: Try again starts attempt 2 (f14)', async ({ page }) => {
    const id = await setUp(page, { release: 'immediately-after-marking' });
    const first = await rahulAttempt(
      page,
      id,
      [['Q-0101', { type: 'multiple-choice', choice: 'B' }]],
      true,
    );
    await markAndConfirm(page, first.id, '2');
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page).locator('.xr-notice-title')).toHaveText(
      'Not passed on attempt 1 · 1 attempt left',
      { timeout: 30_000 },
    );
    await expect(notice(page)).toHaveClass(/xr-notice--quiet/);
    await expect(notice(page)).toContainText(
      'You can try once more. Your first result stays on your result page.',
    );
    await expect(facts(page).nth(5)).toContainText('Immediately after marking');
    await expect(main(page).locator('.xw-actions > *')).toHaveText(['Try again', 'See result']);
    await checkState(page, NAME);
    await shot(page, 'st12-f14');

    await reachAndClick(page, page.getByRole('button', { name: 'Try again' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(page.locator('.xr-phead .xr-overline')).toHaveText(
      `${EXPERIMENT} · Attempt 2 of 2`,
    );
    await expect(strip(page).locator('.xa-strip-text')).toHaveText('0 of 4 answered');
  });

  test('not passed with no attempt left: See result only (provisional)', async ({ page }) => {
    const id = await setUp(page, { release: 'immediately-after-marking' });
    const first = await rahulAttempt(page, id, [], true);
    await markAndConfirm(page, first.id, '0');
    const second = await rahulAttempt(page, id, [], true);
    await markAndConfirm(page, second.id, '1');
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page).locator('.xr-notice-title')).toHaveText(
      'Not passed on attempt 2 · no attempts left',
      { timeout: 30_000 },
    );
    await expect(notice(page)).toContainText('Your result stays on your result page.');
    await expect(facts(page).nth(3)).toContainText('You have used 2');
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'See result',
      'Back to experiment',
    ]);
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await checkState(page, NAME);
  });

  test('passed after Flow D: “Passed on attempt 1” (provisional)', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RAHUL });
    await page.goto('/student/assessments/ASMT-0009');
    await expect(notice(page).locator('.xr-notice-title')).toHaveText('Passed on attempt 1', {
      timeout: 30_000,
    });
    await expect(notice(page)).toHaveClass(/xr-notice--ok/);
    await expect(main(page).locator('.xw-actions > *')).toHaveText([
      'See result',
      'Back to experiment',
    ]);
    await checkState(page, NAME);
  });
});

test.describe('ST-13 the attempt', () => {
  test('answer, save, the strip, DL-1 with the unanswered warning, submit (f0, f1, f4, f5, f6)', async ({
    page,
  }) => {
    const id = await setUp(page);
    await softNavigate(page, `/student/assessments/${id}`);
    await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));

    // The focused page: its own bar, no sidebar, no shell top bar; the tab named by the assessment.
    await expect(page.locator('aside.xr-side')).toHaveCount(0);
    await expect(page.locator('header.xr-top')).toHaveCount(0);
    await expect(page).toHaveTitle(`${NAME} · XR Learning Platform`);
    await expect(bar(page).locator('a.xr-back')).toHaveText(EXPERIMENT);
    await expect(bar(page).locator('a.xr-back')).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}`,
    );
    await expect(save(page)).toHaveText('Answers save automatically');
    await expect(bar(page).getByRole('img', { name: 'Rahul Verma, Student' })).toHaveText('RV');
    await expect(page.locator('.xr-phead .xl-meta')).toHaveText(
      '4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit',
    );
    await expect(page.locator('li.xa-q .xa-q-n')).toHaveText([
      'Question 1 of 4 · Multiple choice',
      'Question 2 of 4 · Multiple choice',
      'Question 3 of 4 · True or false',
      'Question 4 of 4 · Written answer',
    ]);
    await expect(page.locator('li.xa-q .xa-q-head .xr-meta')).toHaveText([
      '2 marks',
      '2 marks',
      '2 marks',
      '10 marks',
    ]);
    await expect(strip(page).locator('a')).toHaveText(['1', '2', '3', '4']);
    await checkState(page, NAME);
    await shot(page, 'st13-f0');

    // f6 at 375: each option is a touch row of 44 px or more.
    const option = page.locator('label.xr-choice').first();
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    // Answer two choices: "Saving…" → "All answers saved"; the strip counts them.
    await page
      .getByText('The actual heat transfer with the largest heat transfer possible')
      .click();
    await expect(save(page)).toHaveText('All answers saved');
    await expect(save(page)).toHaveClass(/is-ok/);
    await page.getByText('C_min ÷ C_max', { exact: true }).click();
    await expect(strip(page).locator('.xa-strip-text')).toHaveText('2 of 4 answered');
    await expect(strip(page).getByRole('link', { name: 'Question 1, answered' })).toHaveClass(
      /is-done/,
    );
    await expect(
      strip(page).getByRole('link', { name: 'Question 3, not answered' }),
    ).not.toHaveClass(/is-done/);
    await expect(save(page)).toHaveText('All answers saved');
    await checkState(page, NAME);
    await shot(page, 'st13-f5');

    // Next unanswered moves focus to question 3.
    await reachAndClick(page, page.getByRole('button', { name: 'Next unanswered' }));
    await expect(page.locator('#Ta-q3')).toBeFocused();
    // A strip number moves focus to its question.
    await strip(page).getByRole('link', { name: 'Question 4, not answered' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#Ta-q4')).toBeFocused();

    // f1: Submit opens DL-1 with the unanswered warning; Keep answering closes it.
    await reachAndClick(page, page.getByRole('button', { name: 'Submit', exact: true }));
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).locator('.xr-dialog-body')).toHaveText(
      /2 questions aren’t answered \(3, 4\)\. You can still submit\.\s*You can’t change your answers after submitting\./,
    );
    await expect(dialog(page).getByRole('button', { name: 'Submit answers' })).toBeFocused();
    await checkState(page, NAME);
    await shot(page, 'st13-f1');
    await dialog(page).getByRole('button', { name: 'Keep answering' }).click();
    await expect(dialog(page)).toBeHidden();

    // The written answer saves after a pause in typing; the true-or-false choice at once.
    await page
      .getByLabel('Explain how fouling changes', { exact: false })
      .fill('Fouling adds a resistance, so U falls and less heat passes across.');
    await expect(save(page)).toHaveText('All answers saved', { timeout: 10_000 });
    await page.getByText('True', { exact: true }).click();
    await expect(strip(page).locator('.xa-strip-text')).toHaveText('4 of 4 answered');
    await expect(page.getByRole('button', { name: 'Next unanswered' })).toHaveCount(0);
    await expect(save(page)).toHaveText('All answers saved');

    // Submit: no warning now; Submit answers sends it; "Answers submitted" takes focus.
    await reachAndClick(page, page.getByRole('button', { name: 'Submit', exact: true }));
    await expect(dialog(page).locator('.xr-dialog-body')).toHaveText(
      'You can’t change your answers after submitting.',
    );
    await dialog(page).getByRole('button', { name: 'Submit answers' }).click();
    const done = page.locator('#Ta-done');
    await expect(done.getByRole('heading', { level: 1 })).toHaveText('Answers submitted');
    await expect(done).toBeFocused();
    await expect(done.locator('p.xr-lead')).toHaveText(
      'Submitted 27 Oct 2026, 10:00. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    await expect(page).toHaveTitle(`Answers submitted · ${NAME} · XR Learning Platform`);
    await expect(done.locator('.xr-msg-actions > *')).toHaveText([
      'Back to experiment',
      'See your result page',
    ]);
    await expect(page.getByRole('link', { name: 'See your result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    await checkState(page, 'Answers submitted');
    await shot(page, 'st13-f4');

    // Back to experiment opens the hub; Before you start now says it is waiting for marking.
    await reachAndClick(page, page.getByRole('link', { name: 'Back to experiment' }));
    await expect(page).toHaveURL(new RegExp(`/student/experiments/${SHELL}$`));
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page).locator('.xr-notice-title')).toHaveText(
      'Submitted — waiting for marking',
    );
  });

  test('without an attempt in progress the attempt page gives way to Before you start', async ({
    page,
  }) => {
    const id = await setUp(page);
    await softNavigate(page, `/student/assessments/${id}/attempt`);
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}$`), { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Start assessment' })).toBeVisible();
  });

  test('the way out keeps the answers: Continue attempt comes back to them', async ({ page }) => {
    const id = await setUp(page);
    await softNavigate(page, `/student/assessments/${id}`);
    await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
    await expect(page).toHaveURL(new RegExp(`/attempt$`));
    await page.getByText('False', { exact: true }).click();
    await expect(save(page)).toHaveText('All answers saved');
    await reachAndClick(page, bar(page).locator('a.xr-back'));
    await expect(page).toHaveURL(new RegExp(`/student/experiments/${SHELL}$`));
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(notice(page)).toContainText(
      'Your answers are saved. One of four questions answered.',
    );
    await reachAndClick(page, page.getByRole('link', { name: 'Continue attempt' }));
    await expect(page.getByRole('radio', { name: 'False' })).toBeChecked();
  });
});
