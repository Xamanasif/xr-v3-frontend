/**
 * Phase 4B, ST-14 Result (board B4-13 f0 … f5) on the real composition root and the sample world.
 * After Flow D, Rahul's ATT-0450 is marked 7 of 10, confirmed and released after the deadline:
 * "You passed", 11 of 16, every answer with its key, explanation and Dr Ranganathan's feedback.
 * After Flow C the same assessment is created through the assessments port and the one world
 * moves the page: submitted (waiting for marking, f1 — still waiting once the deadline has passed,
 * f4), marked and confirmed but not released (f2), and a "Not passed" released at once
 * ("Immediately after marking") with "Try again", which starts attempt 2 and opens it (f3). No
 * figure is ever on the page before the service releases the result. The undrawn states: no
 * submitted attempt, loading, failed + retry, a refused assessment (ST-19) and the not-found.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnswerValue, AssessmentId, AttemptId, IsoInstant, QuestionId } from '@xr/domain';
import { asPersonId, faults, setSampleNow } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_RESULT } from '@/copy/state-copy-result';
import { P4B_RESULT_LINK_TARGETS } from '@/nav/link-targets-p4b/result';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AssessmentResult } from './st-14-result/result';

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const PRIYA = 'per-0003';
const RANGANATHAN = 'per-0014';
const SHELL = 'shell-and-tube-heat-exchanger';
const HUB = `/student/experiments/${SHELL}`;
/** "Back to experiment": the hub's Assessment tab (ST-v1 LINK-MAP `?tab=assessment`). */
const TAB = `${HUB}/assessment`;
/** No assessment, attempt or record id in any word, name or the tab title (decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;
const NAME = 'Heat Exchanger — post-lab';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];
type Answers = readonly (readonly [string, AnswerValue])[];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function showResult(runtime: PlatformRuntime, assessmentId: string, page?: ReactNode) {
  const navigation = testNavigation(`/student/assessments/${assessmentId}/result`);
  const view = renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        {page ?? <AssessmentResult assessmentId={assessmentId} />}
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const h1 = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const cards = () => [...main().querySelectorAll<HTMLElement>('ol.sv-review-list > li.sv-ans')];
const rowsOf = (card: HTMLElement) =>
  [...card.querySelectorAll('dl.sv-ans-dl > div')].map((row) => [
    text(row.querySelector('dt')),
    text(row.querySelector('dd')),
  ]);
const crumbsOf = () =>
  [...screen.getByRole('navigation', { name: 'Breadcrumb' }).querySelectorAll('a, span')].map(
    (item) => text(item),
  );
function expectNoReference() {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.querySelectorAll('[aria-label]'))
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(REFERENCE);
  expect(document.title).not.toMatch(REFERENCE);
}

/** The board's ASMT-0009, made by Dr Ranganathan after Flow C (the walk's D1). */
async function createPostLab(
  sample: Sample,
  releaseOption: 'after-deadline' | 'immediately-after-marking' = 'after-deadline',
): Promise<string> {
  const created = ok(
    await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL,
      name: NAME,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption,
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'],
    } as never),
  );
  return created.id;
}

const RIGHT: Answers = [
  ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
  ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
  ['Q-0104', { type: 'true-false', value: true }],
  ['Q-0106', { type: 'written', text: 'Fouling adds a resistance, so U falls.' }],
];

/** B4-13 f3's answers: 2 of the 6 choice marks. */
const WRONG: Answers = [
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

/** The Student starts, answers and submits through the assessments port (the stand-in marks choices). */
async function submitAs(
  sample: Sample,
  studentId: string,
  assessmentId: string,
  answers: Answers,
): Promise<string> {
  const student = asPersonId(sample, studentId).assessments;
  let attempt = ok(await student.startAttempt(assessmentId as AssessmentId));
  for (const [questionId, answer] of answers) {
    attempt = ok(
      await student.saveAnswer({
        attemptId: attempt.id,
        questionId: questionId as QuestionId,
        answer,
        expectedRev: attempt.rev,
      }),
    );
  }
  ok(await student.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }));
  return attempt.id;
}

/** Dr Ranganathan marks the written answer and confirms (FA-19's commands). */
async function markAs(
  sample: Sample,
  attemptId: string,
  mark: string,
  feedback: string,
  runtime?: PlatformRuntime,
): Promise<void> {
  const marking = asPersonId(sample, RANGANATHAN).marking;
  const view = ok(await marking.getAttemptForMarking(attemptId as AttemptId));
  const saved = ok(
    await marking.saveMark({
      attemptId: attemptId as AttemptId,
      questionId: 'Q-0106' as QuestionId,
      mark,
      feedback,
      expectedRev: view.attempt.rev,
    }),
  );
  const confirmed = await marking.confirmMarks({
    attemptId: attemptId as AttemptId,
    expectedRev: saved.rev,
  });
  ok(confirmed);
  if (runtime && confirmed.ok) {
    await act(async () => {
      await runtime.invalidate(confirmed.changed);
    });
  }
}

/** Nothing of a result is on the page: no score card, no answers, no mark, no key. */
function expectNoFigure() {
  expect(main().querySelector('.sv-score')).toBeNull();
  expect(main().querySelector('.sv-review')).toBeNull();
  expect(main().querySelector('.sv-byq')).toBeNull();
  expect(main()).not.toHaveTextContent(/of 16 marks|Passed|Correct answer|Explanation/);
}

// ---- f0, f5: released, passed -------------------------------------------------------------------

describe('ST-14 — released and passed (ST-v1 `AR.released`)', () => {
  it('the crumbs, the head, the score panel, every answer and the ways on, as Flow D leaves them', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    showResult(runtime, 'ASMT-0009');
    const title = await h1('You passed');
    expect(title).toHaveAttribute('class', 'rk-title');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe(`${NAME} · result`);
    // The crumbs: "Assessments › Heat Exchanger — post-lab › Result".
    expect(crumbsOf()).toEqual(['Assessments', NAME, 'Result']);
    expect(screen.getByRole('link', { name: NAME })).toHaveAttribute(
      'href',
      '/student/assessments/ASMT-0009',
    );
    expect(
      screen.getByRole('navigation', { name: /Student/ }).querySelector('[aria-current="page"]'),
    ).toHaveTextContent('Assessments');
    // The score panel (`section.sv-card.sv-score`).
    const score = screen.getByRole('region', { name: 'Your score' });
    expect(score).toHaveClass('sv-card', 'sv-score');
    expect(score.querySelector('.sv-score-n')!.innerHTML).toBe('<b>11</b><span>of 16 marks</span>');
    expect(score.querySelector('.sv-score-main .xr-st')).toHaveAttribute(
      'class',
      'xr-st xr-st--ok rk-st-lg',
    );
    expect(text(score.querySelector('.sv-score-main .xr-st'))).toBe('Passed');
    expect(
      [...score.querySelectorAll('dl.sv-score-facts > div')].map((fact) => [
        text(fact.querySelector('dt')),
        text(fact.querySelector('dd')),
      ]),
    ).toEqual([
      ['Pass mark', '50% · 8 of 16 marks'],
      ['Attempt', 'Attempt 1 of 2'],
      ['Result', 'Released 14 Nov 2026, 23:59, after the deadline'],
    ]);
    // The marks by question: a jump list to each answer.
    const byq = within(score).getByRole('list', { name: 'Marks by question' });
    expect(
      within(byq)
        .getAllByRole('link')
        .map((link) => [link.getAttribute('aria-label'), link.className]),
    ).toEqual([
      ['Question 1: 2 of 2 marks', 'sv-byq-i is-full'],
      ['Question 2: 0 of 2 marks', 'sv-byq-i'],
      ['Question 3: 2 of 2 marks', 'sv-byq-i is-full'],
      ['Question 4: 7 of 10 marks', 'sv-byq-i'],
    ]);
    await userEvent
      .setup()
      .click(within(byq).getByRole('link', { name: 'Question 4: 7 of 10 marks' }));
    expect(cards()[3]).toHaveFocus();
    expect(score.querySelector('.sv-score-retry')).toBeNull();
    // "Your answers": each question with its head, mark, answer, verdict, key, explanation, feedback.
    const review = screen.getByRole('region', { name: 'Your answers' });
    expect(review).toHaveClass('sv-card', 'sv-review');
    const all = cards();
    expect(all).toHaveLength(4);
    expect(all.map((card) => text(card.querySelector('.sv-ans-k')))).toEqual([
      'Question 1 · Multiple choice',
      'Question 2 · Multiple choice',
      'Question 3 · True or false',
      'Question 4 · Written answer',
    ]);
    expect(all.map((card) => text(card.querySelector('.sv-ans-h .xr-st')))).toEqual([
      '2 of 2 marks',
      '0 of 2 marks',
      '2 of 2 marks',
      '7 of 10 marks',
    ]);
    expect(all.map((card) => card.querySelector('.sv-ans-h .xr-st')!.className)).toEqual([
      'xr-st xr-st--ok',
      'xr-st',
      'xr-st xr-st--ok',
      'xr-st',
    ]);
    expect(text(all[0]!.querySelector('.sv-ans-q'))).toBe(
      'What does the effectiveness (ε) of a heat exchanger compare?',
    );
    // A right choice: its verdict, no "Correct answer" (only where it differs).
    expect(rowsOf(all[0]!)).toEqual([
      ['Your answer', 'The actual heat transfer with the largest heat transfer possibleCorrect'],
      ['Explanation', 'ε = q ÷ q_max, where q_max = C_min (T_h,in − T_c,in).'],
    ]);
    expect(all[0]!.querySelector('.sv-verdict')).toHaveClass('sv-verdict--ok');
    expect(rowsOf(all[1]!).slice(0, 2)).toEqual([
      ['Your answer', 'C_min ÷ C_maxNot correct'],
      ['Correct answer', 'UA ÷ C_min'],
    ]);
    expect(all[1]!.querySelector('.sv-verdict')).toHaveAttribute('class', 'sv-verdict');
    expect(rowsOf(all[2]!)[0]).toEqual(['Your answer', 'TrueCorrect']);
    const written = rowsOf(all[3]!);
    expect(written.map(([label]) => label)).toEqual([
      'Your answer',
      'Explanation',
      'Feedback from Dr S. Ranganathan',
    ]);
    expect(written[0]![1]).toMatch(/^In the WEB run I turned the fouling up/);
    expect(all[3]!.querySelector('.sv-verdict')).toBeNull();
    // The walk's feedback words (the export draws other sample words).
    expect(written[2]![1]).toBe('Clear explanation of fouling.');
    expect(all[3]!.querySelector('p.rk-quote.sv-ans-fb')).toHaveTextContent(
      'Clear explanation of fouling.',
    );
    // The ways on: "Back to experiment" (to the hub's Assessment tab), "See your progress ›".
    const foot = review.querySelector('.sv-review-foot')!;
    expect(
      within(foot as HTMLElement).getByRole('link', { name: 'Back to experiment' }),
    ).toHaveAttribute('href', TAB);
    expect(
      within(foot as HTMLElement).getByRole('link', { name: 'See your progress' }),
    ).toHaveAttribute('href', '/student/progress');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expectNoReference();
  });
});

// ---- f1, f4, f2: submitted, then marked, not yet released ----------------------------------------

describe('ST-14 — before release, no figure (B4-13 f1, f2, f4)', () => {
  it('submitted: waiting for marking, with the attempt’s own release terms (f1)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    await submitAs(sample, RAHUL, id, RIGHT);
    showResult(runtime, id);
    const title = await h1('Submitted — waiting for marking');
    expect(title).toHaveAttribute('class', 'sv-refuse-t');
    const card = screen.getByRole('region', { name: 'Submitted — waiting for marking' });
    expect(card).toHaveClass('sv-card', 'sv-refuse');
    expect(text(card.querySelector('.sv-refuse-k'))).toBe(`${NAME} · result`);
    expect(card.querySelector('.sv-refuse-d')).toHaveTextContent(
      'You submitted on 27 Oct 2026, 10:00. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(card.querySelector('.sv-refuse-ico')).toHaveAttribute('class', 'sv-refuse-ico');
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute('href', TAB);
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'class',
      'rb-btn rb-btn--lg',
    );
    expect(crumbsOf()).toEqual(['Assessments', NAME, 'Result']);
    expectNoFigure();
    expectNoReference();
  });

  it('the deadline passed but marking is not finished: still waiting, never a partial score (f4)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    await submitAs(sample, RAHUL, id, RIGHT);
    setSampleNow(sample, '2026-11-15T04:30:00.000Z' as IsoInstant);
    showResult(runtime, id);
    await h1('Submitted — waiting for marking');
    expect(main().querySelector('.sv-refuse-d')).toHaveTextContent(
      'Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expectNoFigure();
  });

  it('marked and confirmed in the same world: "Result not released yet", still no figure (f2)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    const attemptId = await submitAs(sample, RAHUL, id, RIGHT);
    showResult(runtime, id);
    await h1('Submitted — waiting for marking');
    await markAs(sample, attemptId, '7', 'Good use of your own readings.', runtime);
    await h1('Result not released yet');
    expect(main().querySelector('.sv-refuse-d')).toHaveTextContent(
      'Your answers have been marked. Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(main().querySelector('.sv-refuse-ico')).toHaveClass('sv-refuse-ico--off');
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute('href', TAB);
    expectNoFigure();
    expect(main()).not.toHaveTextContent('Good use of your own readings.');
    // The deadline passes: the result is released by the assessment's own setting.
    setSampleNow(sample, '2026-11-15T04:30:00.000Z' as IsoInstant);
    await act(async () => {
      await runtime.queryClient.invalidateQueries();
    });
    await h1('You passed');
    expect(text(main().querySelector('.sv-score-n'))).toBe('11of 16 marks');
  });
});

// ---- f3: not passed, with an attempt left ------------------------------------------------------

describe('ST-14 — not passed, Try again (B4-13 f3)', () => {
  it('released at once: "Not passed this time", 6 of 16, and Try again opens attempt 2', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample, 'immediately-after-marking');
    const attemptId = await submitAs(sample, RAHUL, id, WRONG);
    await markAs(
      sample,
      attemptId,
      '4',
      'You named the cause. Explain what changes — U, the heat duty and the outlet temperatures — and use your readings.',
    );
    const { navigation } = showResult(runtime, id);
    await h1('Not passed this time');
    const score = screen.getByRole('region', { name: 'Your score' });
    expect(score.querySelector('.sv-score-n')!.innerHTML).toBe('<b>6</b><span>of 16 marks</span>');
    expect(score.querySelector('.sv-score-main .xr-st')).toHaveAttribute('class', 'xr-st rk-st-lg');
    expect(text(score.querySelector('.sv-score-main .xr-st'))).toBe('Not passed');
    expect(
      [...score.querySelectorAll('dl.sv-score-facts > div dd')].map((fact) => text(fact)),
    ).toEqual([
      '50% · 8 of 16 marks',
      'Attempt 1 of 2',
      'Released 27 Oct 2026, 10:00, when marked',
    ]);
    const all = cards();
    expect(all.map((card) => text(card.querySelector('.sv-ans-h .xr-st')))).toEqual([
      '0 of 2 marks',
      '2 of 2 marks',
      '0 of 2 marks',
      '4 of 10 marks',
    ]);
    expect(rowsOf(all[0]!).slice(0, 2)).toEqual([
      ['Your answer', 'The hot-side flow rate with the cold-side flow rateNot correct'],
      ['Correct answer', 'The actual heat transfer with the largest heat transfer possible'],
    ]);
    expect(rowsOf(all[2]!)[0]).toEqual(['Your answer', 'FalseNot correct']);
    // Try again is in the score panel, with the attempts left; the review's ways on below.
    const retry = score.querySelector('.sv-score-retry')!;
    expect(text(retry.querySelector('p'))).toBe(
      'You have 1 attempt left. Your first result stays here.',
    );
    const tryAgain = within(retry as HTMLElement).getByRole('button', { name: 'Try again' });
    expect(tryAgain).toHaveAttribute('class', 'rb-btn rb-btn--primary rb-btn--lg');
    expect([...main().querySelectorAll('.sv-review-foot > *')].map((child) => text(child))).toEqual(
      ['Back to experiment', 'See your progress'],
    );
    await userEvent.setup().click(tryAgain);
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/student/assessments/${id}/attempt`),
    );
    const intro = ok(
      await asPersonId(sample, RAHUL).assessments.getAssessmentIntro(id as AssessmentId),
    );
    expect(intro.attempts.map((attempt) => [attempt.attemptNumber, attempt.state])).toEqual([
      [1, 'submitted'],
      [2, 'in-progress'],
    ]);
    // With attempt 2 in progress the page still shows attempt 1's result, without Try again.
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull());
    expect(text(main().querySelector('.sv-score-n'))).toBe('6of 16 marks');
  });

  it('a refused or failed start is said in place; the page stays', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample, 'immediately-after-marking');
    const attemptId = await submitAs(sample, RAHUL, id, WRONG);
    await markAs(sample, attemptId, '4', 'Explain what changes.');
    const { navigation } = showResult(runtime, id);
    await h1('Not passed this time');
    const user = userEvent.setup();
    faults(sample).failNext('AssessmentService.startAttempt');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /^Your new attempt didn’t start\s*Nothing has changed\. Try again\.$/,
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
    // Another tab started attempt 2 meanwhile: the service refuses a third start.
    ok(await asPersonId(sample, RAHUL).assessments.startAttempt(id as AssessmentId));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByText('A new attempt can’t be started now.', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('passed, or no attempt left: no Try again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample, 'immediately-after-marking');
    const first = await submitAs(sample, RAHUL, id, WRONG);
    await markAs(sample, first, '0', 'Explain what changes.');
    const second = await submitAs(sample, RAHUL, id, WRONG);
    await markAs(sample, second, '1', 'Use your readings.');
    showResult(runtime, id);
    await h1('Not passed this time');
    expect(text(main().querySelector('.sv-score-facts'))).toContain('Attempt 2 of 2');
    expect(text(main().querySelector('.sv-score-n'))).toBe('3of 16 marks');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(main().querySelector('.sv-score-retry')).toBeNull();
    expect(main()).not.toHaveTextContent('attempt left');
  });
});

// ---- Undrawn states -----------------------------------------------------------------------------

describe('ST-14 — the undrawn states', () => {
  it('no submitted attempt: "Not submitted yet" with Back to the assessment', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    // An attempt in progress is not a result.
    ok(await asPersonId(sample, RAHUL).assessments.startAttempt(id as AssessmentId));
    showResult(runtime, id);
    await h1('Not submitted yet');
    expect(main().querySelector('.sv-refuse-d')).toHaveTextContent(
      'Your result appears here after you submit and your answers are marked.',
    );
    expect(main().querySelector('.sv-refuse-ico')).toHaveClass('sv-refuse-ico--off');
    expect(screen.getByRole('link', { name: 'Back to the assessment' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}`,
    );
    expectNoFigure();
  });

  it('loading, then failed + retry', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-d');
    faults(sample).failNext('AssessmentService.getResult');
    showResult(runtime, 'ASMT-0009');
    expect(
      await screen.findByText('We couldn’t load your result', {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    await h1('You passed');
  });

  it('an assessment of an experiment not given to the Student: ST-19 in place', async () => {
    const { runtime } = await tabPlatform(PRIYA, 'after-flow-d');
    showResult(runtime, 'ASMT-0009');
    await h1('This experiment isn’t available to you');
    await waitFor(() => expect(document.title).toMatch(/^Not available/));
    expect(main().querySelector('.sv-score')).toBeNull();
  });

  it('an unknown assessment: the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    showResult(runtime, 'ASMT-9999');
    await h1('We can’t find that page');
  });
});

// ---- The registers --------------------------------------------------------------------------------

describe('ST-14 — the state-copy register and link targets', () => {
  it('every ST-14 entry is in the one register', () => {
    for (const id of Object.keys(STATE_COPY_RESULT)) expect(STATE_COPY).toHaveProperty([id]);
  });

  it('one primary where the export draws one; Try again is a command', () => {
    const primaries = P4B_RESULT_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.where}: ${entry.action}`)).toEqual([
      'Released result, not passed with an attempt left: Try again',
    ]);
    expect(primaries[0]).toMatchObject({ target: null, outcome: 'in-page' });
    for (const entry of P4B_RESULT_LINK_TARGETS.filter(
      (item) => item.action === 'Back to experiment',
    ))
      expect(entry.target).toBe('/student/experiments/{experimentId}/assessment');
  });
});
