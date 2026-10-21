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
const facts = (page: Page) => main(page).locator('dl.sv-ai-dl > div');
/** ST-12's card: the state's heading, line and status, and its actions. */
const stateTitle = (page: Page) => main(page).locator('.sv-ai-state h2.sv-sec-t');
const stateLine = (page: Page) => main(page).locator('.sv-ai-state .sv-ai-d');
const statusPill = (page: Page) => main(page).locator('.sv-ai-state .xr-st');
const cardActions = (page: Page) => main(page).locator('.sv-ai-act > *');
const bar = (page: Page) => page.locator('header.st-focusbar');
const save = (page: Page) => bar(page).locator('.st-save');
const strip = (page: Page) => page.getByRole('region', { name: 'Your answers', exact: true });
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Submit your answers?' });
const TAB = `/student/experiments/${SHELL}/assessment`;
/** No assessment, attempt or record id in any word, name or the tab title (decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;

async function expectNoReference(page: Page): Promise<void> {
  expect(await page.locator('body').innerText()).not.toMatch(REFERENCE);
  const names = await page
    .locator('[aria-label]')
    .evaluateAll((items) => items.map((item) => item.getAttribute('aria-label') ?? ''));
  for (const name of names) expect(name).not.toMatch(REFERENCE);
  expect(await page.title()).not.toMatch(REFERENCE);
}

async function factsText(page: Page): Promise<string[]> {
  return (await facts(page).allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
}

const DRAWN_FACTS = [
  'Questions 4 2 multiple choice · 1 true or false · 1 written answer',
  'Total marks 16',
  'Pass mark 50% 8 of 16 marks',
  'Attempts allowed 2 You have used none',
  'Result and answers After the deadline Your faculty marks written answers',
  'Set by Dr S. Ranganathan',
];

test.describe('ST-12 Before you start', () => {
  test('to do: “Before you start”, the rules, the key facts as configured; Start assessment opens the attempt', async ({
    page,
  }) => {
    const id = await setUp(page, { introduction: INTRODUCTION });
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible({
      timeout: 30_000,
    });
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/student/assessments');
    const crumbs = main(page).getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'href',
      '/student/assessments',
    );
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText(NAME);
    const eyebrow = main(page).locator('.rk-head .rk-eyebrow');
    await expect(eyebrow).toHaveText(`${EXPERIMENT} · assessment`);
    await expect(eyebrow.locator('a.st-eyelink')).toHaveAttribute('href', TAB);
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveText(INTRODUCTION);
    await expect(stateTitle(page)).toHaveText('Before you start');
    await expect(statusPill(page)).toHaveText('To do');
    await expect(
      main(page).getByRole('list', { name: 'How answering works' }).locator('li b'),
    ).toHaveText([
      'No time limit',
      'Answers save as you go',
      'Nothing is submitted until you choose Submit',
    ]);
    await expect(main(page).locator('.sv-ai-when .sv-when-d')).toHaveText('14 Nov');
    await expect(main(page).locator('.sv-ai-when .sv-when-t')).toHaveText('23:59 · in 18 days');
    expect(await factsText(page)).toEqual(DRAWN_FACTS);
    await expect(cardActions(page)).toHaveText(['Start assessment', 'Back to experiment']);
    await expect(main(page).locator('.rb-btn--primary')).toHaveText(['Start assessment']);
    await expect(page.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      TAB,
    );
    // The facts in three columns on a wide page, two below 900 px of page width.
    const width = page.viewportSize()?.width ?? 1440;
    const boxes = await facts(page).evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().x),
    );
    expect(new Set(boxes.map(Math.round)).size).toBe(width >= 1280 ? 3 : 2);
    await checkState(page, NAME);
    await expectNoReference(page);
    await shot(page, 'st12-assess');

    await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(page.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await expect(page.locator('.sv-focushead .sv-act-k')).toHaveText(
      `${EXPERIMENT}·Attempt 1 of 2`,
    );
    await expect(strip(page).locator('.sv-attcount')).toHaveText('0 of 4 answered');
  });

  test('an attempt in progress: “Attempt 1 in progress”, Continue attempt', async ({ page }) => {
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
    await expect(stateTitle(page)).toHaveText('Attempt 1 in progress', { timeout: 30_000 });
    await expect(stateLine(page)).toHaveText('Your answers are saved. 2 questions of 4 answered.');
    await expect(statusPill(page)).toHaveText('Attempt in progress');
    await expect(statusPill(page)).toHaveClass(/xr-st--warn/);
    // No introduction was written (the walk's D1): none is shown.
    await expect(main(page).locator('.rk-head .rk-sub')).toHaveCount(0);
    expect(await factsText(page)).toEqual(DRAWN_FACTS);
    await expect(cardActions(page)).toHaveText(['Continue attempt', 'Back to experiment']);
    await checkState(page, NAME);
    await shot(page, 'st12-inprog');

    await reachAndClick(page, page.getByRole('link', { name: 'Continue attempt' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(strip(page).locator('.sv-attcount')).toHaveText('2 of 4 answered');
    await expect(
      page.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    ).toBeChecked();
    await expect(page.getByRole('radio', { name: 'C_min ÷ C_max' })).toBeChecked();
    await expect(strip(page).locator('a.is-done')).toHaveText(['1', '2']);
  });

  test('submitted: “Submitted — waiting for marking”, See result page', async ({ page }) => {
    const id = await setUp(page);
    await rahulAttempt(page, id, [['Q-0101', { type: 'multiple-choice', choice: 'A' }]], true);
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(stateTitle(page)).toHaveText('Submitted — waiting for marking', {
      timeout: 30_000,
    });
    await expect(statusPill(page)).toHaveText('Waiting for marking');
    await expect(stateLine(page)).toHaveText(
      'You submitted on 27 Oct 2026, 10:00. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    await expect(facts(page).nth(3)).toContainText('You have used 1');
    await expect(cardActions(page)).toHaveText(['See result page', 'Back to experiment']);
    await expect(main(page).locator('.sv-ai .rb-btn--primary')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'See result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    // No figure of any kind before the result is released.
    await expect(main(page)).not.toContainText(/of 16 marks scored|Passed|Not passed/);
    await checkState(page, NAME);
    await shot(page, 'st12-waitmark');
  });

  test('not passed with an attempt left: Try again starts attempt 2', async ({ page }) => {
    const id = await setUp(page, { release: 'immediately-after-marking' });
    const first = await rahulAttempt(
      page,
      id,
      [['Q-0101', { type: 'multiple-choice', choice: 'B' }]],
      true,
    );
    await markAndConfirm(page, first.id, '2');
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(stateTitle(page)).toHaveText('Not passed on attempt 1 · 1 attempt left', {
      timeout: 30_000,
    });
    await expect(stateLine(page)).toHaveText(
      'You can try once more. Your first result stays on your result page.',
    );
    await expect(statusPill(page)).toHaveText('Result ready');
    await expect(facts(page).nth(4)).toContainText('Immediately after marking');
    await expect(cardActions(page)).toHaveText(['Try again', 'See result']);
    await checkState(page, NAME);
    await shot(page, 'st12-notpassed');

    await reachAndClick(page, page.getByRole('button', { name: 'Try again' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));
    await expect(page.locator('.sv-focushead .sv-act-k')).toHaveText(
      `${EXPERIMENT}·Attempt 2 of 2`,
    );
    await expect(strip(page).locator('.sv-attcount')).toHaveText('0 of 4 answered');
  });

  test('not passed with no attempt left: “Result released”, See result only', async ({ page }) => {
    const id = await setUp(page, { release: 'immediately-after-marking' });
    const first = await rahulAttempt(page, id, [], true);
    await markAndConfirm(page, first.id, '0');
    const second = await rahulAttempt(page, id, [], true);
    await markAndConfirm(page, second.id, '1');
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(stateTitle(page)).toHaveText('Result released', { timeout: 30_000 });
    await expect(stateLine(page)).toHaveText('Released 27 Oct 2026, 10:00, when marked.');
    await expect(facts(page).nth(3)).toContainText('You have used 2');
    await expect(cardActions(page)).toHaveText(['See result', 'Back to experiment']);
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0);
    await checkState(page, NAME);
  });

  test('passed after Flow D: “Result released — you passed”', async ({ page }) => {
    await bootWorld(page, { fixture: 'after-flow-d', session: RAHUL });
    await page.goto('/student/assessments/ASMT-0009');
    await expect(stateTitle(page)).toHaveText('Result released — you passed', {
      timeout: 30_000,
    });
    await expect(stateLine(page)).toHaveText('Released 14 Nov 2026, 23:59, after the deadline.');
    await expect(statusPill(page)).toHaveClass(/xr-st--ok/);
    await expect(cardActions(page)).toHaveText(['See result', 'Back to experiment']);
    await checkState(page, NAME);
    await expectNoReference(page);
    await shot(page, 'st12-released');
  });
});

test.describe('ST-13 the attempt', () => {
  test('answer, save, the panel, DL-1 with the unanswered warning, submit', async ({ page }) => {
    const id = await setUp(page);
    await softNavigate(page, `/student/assessments/${id}`);
    await reachAndClick(page, page.getByRole('button', { name: 'Start assessment' }));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}/attempt$`));

    // The focused page: its own V3 root and bar, no rail, no shell top bar; the tab named by the
    // assessment; the way out goes back to Before you start.
    await expect(page.locator('aside.xr-side, aside.rb-rail')).toHaveCount(0);
    await expect(page.locator('header.xr-top, header.rb-top')).toHaveCount(0);
    await expect(page.locator('div.xr.rb > div.st-focus')).toHaveCount(1);
    await expect(page).toHaveTitle(`${NAME} · XR Learning Platform`);
    const exit = bar(page).locator('a.st-exit');
    await expect(exit).toHaveAccessibleName(NAME);
    await expect(exit).toHaveAttribute('href', `/student/assessments/${id}`);
    await expect(save(page)).toHaveText('Answers save automatically');
    await expect(bar(page).locator('.xr-avatar')).toHaveText('RV');
    await expect(bar(page).locator('.xr-avatar')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.sv-focushead .sv-focus-sub')).toHaveText(
      '4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit',
    );
    await expect(page.locator('section.sv-q h2.sv-q-k')).toHaveText([
      'Question 1 of 4 · Multiple choice',
      'Question 2 of 4 · Multiple choice',
      'Question 3 of 4 · True or false',
      'Question 4 of 4 · Written answer',
    ]);
    await expect(page.locator('section.sv-q .sv-q-m')).toHaveText([
      '2 marks',
      '2 marks',
      '2 marks',
      '10 marks',
    ]);
    await expect(strip(page).locator('ol.st-strip a')).toHaveText(['1', '2', '3', '4']);
    // Below 900 px the panel splits: the answers above the questions, Submit after them.
    const width = page.viewportSize()?.width ?? 1440;
    const [stripBox, firstQuestion, submitBox] = await Promise.all([
      strip(page).boundingBox(),
      page.locator('#Ta-q1').boundingBox(),
      page.getByRole('region', { name: 'Submit your answers' }).boundingBox(),
    ]);
    if (width < 1000) {
      expect(stripBox!.y).toBeLessThan(firstQuestion!.y);
      expect(submitBox!.y).toBeGreaterThan(firstQuestion!.y);
    } else {
      expect(stripBox!.x).toBeGreaterThan(firstQuestion!.x);
    }
    await checkState(page, NAME);
    await expectNoReference(page);
    await shot(page, 'st13-assess');

    // Each option is a touch row of 44 px or more.
    const option = page.locator('label.rk-choice').first();
    expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);

    // Answer two choices: "Saving…" → "All answers saved"; the panel counts them.
    await page
      .getByText('The actual heat transfer with the largest heat transfer possible')
      .click();
    await expect(save(page)).toHaveText('All answers saved');
    await expect(save(page)).toHaveClass(/st-save--ok/);
    await page.getByText('C_min ÷ C_max', { exact: true }).click();
    await expect(strip(page).locator('.sv-attcount')).toHaveText('2 of 4 answered');
    await expect(strip(page).getByRole('link', { name: 'Question 1, answered' })).toHaveClass(
      /is-done/,
    );
    await expect(
      strip(page).getByRole('link', { name: 'Question 3, not answered' }),
    ).not.toHaveClass(/is-done/);
    await expect(page.locator('#Ta-q1 .sv-q-n')).toHaveClass(/is-done/);
    await expect(save(page)).toHaveText('All answers saved');
    await checkState(page, NAME);
    await shot(page, 'st13-inprog');

    // Next unanswered moves focus to question 3.
    await reachAndClick(page, page.getByRole('button', { name: 'Next unanswered' }));
    await expect(page.locator('#Ta-q3')).toBeFocused();
    // A question number moves focus to its question.
    await strip(page).getByRole('link', { name: 'Question 4, not answered' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#Ta-q4')).toBeFocused();

    // Submit opens DL-1 with the unanswered warning; Keep answering closes it.
    await reachAndClick(page, page.getByRole('button', { name: 'Submit', exact: true }));
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toHaveAccessibleDescription(
      'You can’t change your answers after submitting.',
    );
    await expect(dialog(page).locator('.rk-dlg-body .rk-pending')).toHaveText(
      '2 questions aren’t answered (3, 4). You can still submit.',
    );
    await expect(dialog(page).getByRole('heading', { name: 'Submit your answers?' })).toBeFocused();
    await checkState(page, NAME);
    await shot(page, 'st13-dialog');
    await dialog(page).getByRole('button', { name: 'Keep answering' }).click();
    await expect(dialog(page)).toBeHidden();

    // The written answer saves after a pause in typing; the true-or-false choice at once.
    await page
      .getByLabel('Explain how fouling changes', { exact: false })
      .fill('Fouling adds a resistance, so U falls and less heat passes across.');
    await expect(save(page)).toHaveText('All answers saved', { timeout: 10_000 });
    await page.getByText('True', { exact: true }).click();
    await expect(strip(page).locator('.sv-attcount')).toHaveText('4 of 4 answered');
    await expect(page.getByRole('button', { name: 'Next unanswered' })).toHaveCount(0);
    await expect(save(page)).toHaveText('All answers saved');

    // Submit: every question answered; Submit answers sends it; "Answers submitted" takes focus.
    await reachAndClick(page, page.getByRole('button', { name: 'Submit', exact: true }));
    await expect(dialog(page).locator('.rk-dlg-body')).toHaveText('All 4 questions are answered.');
    await dialog(page).getByRole('button', { name: 'Submit answers' }).click();
    const done = page.locator('#Ta-done');
    await expect(done.getByRole('heading', { level: 2 })).toHaveText('Answers submitted');
    await expect(done).toBeFocused();
    await expect(done.locator('.xr-st')).toHaveText('Waiting for marking');
    await expect(done.locator('p.sv-act-d')).toHaveText(
      'Submitted 27 Oct 2026, 10:00. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    await expect(save(page)).toHaveCount(0);
    await expect(page).toHaveTitle(`Answers submitted · ${NAME} · XR Learning Platform`);
    await expect(done.locator('.sv-act-go > *')).toHaveText([
      'See your result page',
      'Back to experiment',
    ]);
    await expect(page.getByRole('link', { name: 'See your result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    await checkState(page, NAME);
    await expectNoReference(page);
    await shot(page, 'st13-waitmark');

    // Back to experiment opens the hub's Assessment tab; Before you start now says it is waiting.
    await reachAndClick(page, page.getByRole('link', { name: 'Back to experiment' }));
    await expect(page).toHaveURL(new RegExp(`${TAB}$`));
    await softNavigate(page, `/student/assessments/${id}`);
    await expect(stateTitle(page)).toHaveText('Submitted — waiting for marking');
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
    await reachAndClick(page, bar(page).locator('a.st-exit'));
    await expect(page).toHaveURL(new RegExp(`/student/assessments/${id}$`));
    await expect(stateLine(page)).toHaveText('Your answers are saved. One question of 4 answered.');
    await reachAndClick(page, page.getByRole('link', { name: 'Continue attempt' }));
    await expect(page.getByRole('radio', { name: 'False' })).toBeChecked();
  });
});
