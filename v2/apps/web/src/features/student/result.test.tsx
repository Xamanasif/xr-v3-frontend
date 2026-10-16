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
const cards = () => [...main().querySelectorAll<HTMLElement>('ul.xa-ans > li')];
const rowsOf = (card: HTMLElement) =>
  [...card.querySelectorAll('.xa-ans-row')].map((row) => [
    text(row.firstElementChild),
    text(row.lastElementChild),
  ]);

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
  expect(main().querySelector('.xa-score')).toBeNull();
  expect(main().querySelector('.xa-ans')).toBeNull();
  expect(main().querySelector('.xa-mk')).toBeNull();
  expect(main()).not.toHaveTextContent(/of 16 marks|Passed|Correct answer|Explanation/);
}

// ---- f0, f5: released, passed -------------------------------------------------------------------

describe('ST-14 — released and passed (B4-13 f0, f5)', () => {
  it('the header, the score card, every answer and the actions, as Flow D leaves them', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    showResult(runtime, 'ASMT-0009');
    await h1('You passed');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(text(main().querySelector('.xr-phead .xr-overline'))).toBe(`${NAME} · result`);
    // The shell: "Result" (below 1024) and "Assessments / Heat Exchanger — post-lab / Result".
    expect(text(document.querySelector('.xr-top-title'))).toBe('Result');
    const crumbs = document.querySelector('ol.xr-crumbs')!;
    expect(
      [...crumbs.querySelectorAll('li')].map((item) => text(item).replace(/\s*\/$/, '')),
    ).toEqual(['Assessments', NAME, 'Result']);
    expect(within(crumbs as HTMLElement).getByRole('link', { name: NAME })).toHaveAttribute(
      'href',
      '/student/assessments/ASMT-0009',
    );
    expect(document.querySelector('aside.xr-side a[aria-current="page"]')).toHaveTextContent(
      'Assessments',
    );
    // The score card (f0 `div.xa-score`).
    const score = main().querySelector('.xa-score')!;
    expect(text(score.querySelector('.xa-score-n'))).toBe('11 of 16 marks');
    expect(score.querySelector('.xa-score-sub .xr-status.xr-status--ok')).toHaveTextContent(
      'Passed',
    );
    expect([...score.querySelectorAll('.xa-score-facts > span')].map(text)).toEqual([
      'Pass mark 50% · 8 of 16 marks',
      'Attempt 1 of 2',
      'Released 14 Nov 2026, 23:59, after the deadline',
    ]);
    // "Your answers": each question with its head, mark, answer, key, explanation, feedback.
    expect(screen.getByRole('heading', { level: 2, name: 'Your answers' })).toBeInTheDocument();
    const all = cards();
    expect(all).toHaveLength(4);
    expect(all.map((card) => text(card.querySelector('.xa-q-n')))).toEqual([
      'Question 1 · Multiple choice',
      'Question 2 · Multiple choice',
      'Question 3 · True or false',
      'Question 4 · Written answer',
    ]);
    expect(all.map((card) => text(card.querySelector('.xa-mk')))).toEqual([
      '2 of 2 marks',
      '0 of 2 marks',
      '2 of 2 marks',
      '7 of 10 marks',
    ]);
    expect(all.map((card) => card.querySelector('.xa-mk')!.className)).toEqual([
      'xa-mk is-ok',
      'xa-mk is-no',
      'xa-mk is-ok',
      'xa-mk is-ok',
    ]);
    expect(text(all[0]!.querySelector('.xa-q-text'))).toBe(
      'What does the effectiveness (ε) of a heat exchanger compare?',
    );
    expect(rowsOf(all[0]!)).toEqual([
      ['Your answer', 'The actual heat transfer with the largest heat transfer possible'],
      ['Correct answer', 'The actual heat transfer with the largest heat transfer possible'],
      ['Explanation', 'ε = q ÷ q_max, where q_max = C_min (T_h,in − T_c,in).'],
    ]);
    expect(rowsOf(all[1]!).slice(0, 2)).toEqual([
      ['Your answer', 'C_min ÷ C_max'],
      ['Correct answer', 'UA ÷ C_min'],
    ]);
    expect(rowsOf(all[2]!).slice(0, 2)).toEqual([
      ['Your answer', 'True'],
      ['Correct answer', 'True'],
    ]);
    const written = rowsOf(all[3]!);
    expect(written.map(([label]) => label)).toEqual([
      'Your answer',
      'Explanation',
      'Feedback from Dr S. Ranganathan',
    ]);
    expect(written[0]![1]).toMatch(/^In the WEB run I turned the fouling up/);
    // The walk's feedback words (B4-13 draws other sample words).
    expect(written[2]![1]).toBe('Clear explanation of fouling.');
    // The actions: "Back to experiment" (the one primary), "See your progress"; no Try again.
    const actions = main().querySelector('.xw-actions')!;
    expect(
      within(actions as HTMLElement).getByRole('link', { name: 'Back to experiment' }),
    ).toHaveAttribute('href', HUB);
    expect(
      within(actions as HTMLElement).getByRole('link', { name: 'See your progress' }),
    ).toHaveAttribute('href', '/student/progress');
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});

// ---- f1, f4, f2: submitted, then marked, not yet released ----------------------------------------

describe('ST-14 — before release, no figure (B4-13 f1, f2, f4)', () => {
  it('submitted: waiting for marking, with the attempt’s own release terms (f1)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    await submitAs(sample, RAHUL, id, RIGHT);
    showResult(runtime, id);
    await h1('Submitted — waiting for marking');
    expect(main().querySelector('.xr-msg .xr-lead')).toHaveTextContent(
      'You submitted on 27 Oct 2026, 10:00. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(main().querySelector('.xr-msg-icon')).toHaveClass('bg-warn-bg', 'text-warn');
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute('href', HUB);
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveClass('xr-btn--primary');
    expect(text(document.querySelector('.xr-top-title'))).toBe('Result');
    expectNoFigure();
  });

  it('the deadline passed but marking is not finished: still waiting, never a partial score (f4)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await createPostLab(sample);
    await submitAs(sample, RAHUL, id, RIGHT);
    setSampleNow(sample, '2026-11-15T04:30:00.000Z' as IsoInstant);
    showResult(runtime, id);
    await h1('Submitted — waiting for marking');
    expect(main().querySelector('.xr-msg .xr-lead')).toHaveTextContent(
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
    expect(main().querySelector('.xr-msg .xr-lead')).toHaveTextContent(
      'Your answers have been marked. Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(main().querySelector('.xr-msg-icon')).not.toHaveClass('bg-warn-bg');
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute('href', HUB);
    expectNoFigure();
    expect(main()).not.toHaveTextContent('Good use of your own readings.');
    // The deadline passes: the result is released by the assessment's own setting.
    setSampleNow(sample, '2026-11-15T04:30:00.000Z' as IsoInstant);
    await act(async () => {
      await runtime.queryClient.invalidateQueries();
    });
    await h1('You passed');
    expect(text(main().querySelector('.xa-score-n'))).toBe('11 of 16 marks');
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
    const score = main().querySelector('.xa-score')!;
    expect(text(score.querySelector('.xa-score-n'))).toBe('6 of 16 marks');
    expect(score.querySelector('.xr-status.xr-status--err')).toHaveTextContent('Not passed');
    expect([...score.querySelectorAll('.xa-score-facts > span')].map(text)).toEqual([
      'Pass mark 50% · 8 of 16 marks',
      'Attempt 1 of 2',
      'Released 27 Oct 2026, 10:00, when marked',
    ]);
    const all = cards();
    expect(all.map((card) => text(card.querySelector('.xa-mk')))).toEqual([
      '0 of 2 marks',
      '2 of 2 marks',
      '0 of 2 marks',
      '4 of 10 marks',
    ]);
    expect(rowsOf(all[0]!).slice(0, 2)).toEqual([
      ['Your answer', 'The hot-side flow rate with the cold-side flow rate'],
      ['Correct answer', 'The actual heat transfer with the largest heat transfer possible'],
    ]);
    expect(rowsOf(all[2]!)[0]).toEqual(['Your answer', 'False']);
    // The actions: Back to experiment · Try again · "You have 1 attempt left." · See your progress.
    const actions = main().querySelector('.xw-actions')!;
    expect([...actions.children].map((child) => text(child))).toEqual([
      'Back to experiment',
      'Try again',
      'You have 1 attempt left.',
      'See your progress',
    ]);
    const tryAgain = screen.getByRole('button', { name: 'Try again' });
    expect(tryAgain).toHaveClass('xr-btn--secondary');
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
    expect(text(main().querySelector('.xa-score-n'))).toBe('6 of 16 marks');
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
    expect(text(main().querySelector('.xa-score-facts'))).toContain('Attempt 2 of 2');
    expect(text(main().querySelector('.xa-score-n'))).toBe('3 of 16 marks');
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
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
    expect(main().querySelector('.xr-msg .xr-lead')).toHaveTextContent(
      'Your result appears here after you submit and your answers are marked.',
    );
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
    await waitFor(() =>
      expect(text(document.querySelector('.xr-top-title'))).toBe('Not available'),
    );
    expect(main().querySelector('.xa-score')).toBeNull();
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

  it('one primary per drawn state; Try again is a command', () => {
    const primaries = P4B_RESULT_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.where}: ${entry.action}`)).toEqual([
      'Released result: Back to experiment',
      'Submitted — waiting for marking: Back to experiment',
      'Result not released yet: Back to experiment',
      'Not submitted yet: Back to the assessment',
      'Failed state: Try again',
    ]);
    const tryAgain = P4B_RESULT_LINK_TARGETS.find(
      (entry) => entry.action === 'Try again' && entry.role === 'secondary',
    )!;
    expect(tryAgain).toMatchObject({ target: null, outcome: 'in-page' });
  });
});
