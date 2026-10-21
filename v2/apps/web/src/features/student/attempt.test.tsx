/**
 * ST-12 Before you start (board B4-11 f11 … f16) and ST-13 the attempt (board B4-12 f0 … f6) on the
 * real composition root and the sample world. After Flow C, Dr S. Ranganathan creates "Heat
 * Exchanger — post-lab" (the walk's D1) and Rahul Verma meets it: the six key facts as configured,
 * each state of his attempts (in progress, waiting for marking, not passed with an attempt left,
 * passed, none left, can't be started), Start assessment, and the attempt itself — answers that
 * save one at a time with the attempt's revision, the strip, DL-1 with the unanswered warning,
 * Submit. The failures the browser cannot reach (no fault seam there): a save that fails for now
 * (f2 "Your last answer didn’t save · Try again"), a stale revision, a submit that fails (f3), a
 * start that fails, a read that fails. No answer key ever reaches the page.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AssessmentIntro as IntroAnswer } from '@xr/contracts/draft';
import type { AssessmentId, AttemptId, QuestionId } from '@xr/domain';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { STATE_COPY } from '@/copy/state-copy';
import { P4B_ATTEMPT_LINK_TARGETS } from '@/nav/link-targets-p4b/attempt';
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
import { AssessmentIntro } from './st-12-assessment-intro/assessment-intro';
import { introState } from './st-12-assessment-intro/intro-state';
import { WRITTEN_SAVE_PAUSE_MS } from './st-13-attempt/answer-saver';
import { AssessmentAttempt } from './st-13-attempt/attempt';

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const RANGANATHAN = 'per-0014';
const SHELL = 'shell-and-tube-heat-exchanger';
const NAME = 'Heat Exchanger — post-lab';
const INTRODUCTION =
  'Four short questions on what you measured in the Shell-and-Tube Heat Exchanger simulation. One answer is written; your faculty marks it.';
const Q1 = 'Q-0101' as QuestionId;
const Q3 = 'Q-0104' as QuestionId;
const WRITTEN = 'Q-0106' as QuestionId;
/** The key's own words: the explanations the result releases later — never on these pages. */
const KEY_WORDS = /q_max = C_min|NTU = UA ÷ C_min —|thermal resistance in series/;

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** After Flow C, signed in as Rahul; Dr Ranganathan creates the assessment (D1). */
async function world(
  options: {
    readonly release?: 'after-deadline' | 'immediately-after-marking';
    readonly introduction?: string | null;
  } = {},
) {
  const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
  const created = ok(
    await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
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
    } as never),
  );
  return { runtime, sample, id: created.id as string };
}

function rahul(sample: Sample) {
  return asPersonId(sample, RAHUL).assessments;
}

/** Rahul starts (and optionally submits) an attempt through the service. */
async function attemptAs(sample: Sample, id: string, submit: boolean) {
  let attempt = ok(await rahul(sample).startAttempt(id as AssessmentId));
  if (submit) {
    attempt = ok(
      await rahul(sample).submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
    );
  }
  return attempt;
}

async function markAndConfirm(sample: Sample, attemptId: AttemptId, mark: string) {
  const marking = asPersonId(sample, RANGANATHAN).marking;
  const read = ok(await marking.getAttemptForMarking(attemptId));
  const saved = ok(
    await marking.saveMark({
      attemptId,
      questionId: WRITTEN,
      mark,
      feedback: '',
      expectedRev: read.attempt.rev,
    } as never),
  );
  ok(await marking.confirmMarks({ attemptId, expectedRev: saved.rev }));
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showIntro(runtime: PlatformRuntime, id: string) {
  const navigation = testNavigation(`/student/assessments/${id}`);
  const view = renderInTab(inShell(<AssessmentIntro assessmentId={id} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

function showAttempt(runtime: PlatformRuntime, id: string) {
  const navigation = testNavigation(`/student/assessments/${id}/attempt`);
  const view = renderInTab(inShell(<AssessmentAttempt assessmentId={id} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
/** An element's words as read: its text nodes joined with a space, white space collapsed. */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    parts.push(node.textContent ?? '');
  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,)])/g, '$1')
    .trim();
}
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
/** "Answers submitted" (`h2` in `section.sv-act-card#Ta-done`; the H1 stays the assessment's). */
const submittedHeading = () =>
  screen.findByRole('heading', { level: 2, name: 'Answers submitted' }, { timeout: 5000 });
/** The card's state (`section.sv-ai`): its heading, line, status, facts and actions. */
const stateTitle = () => text(main().querySelector('.sv-ai-state h2.sv-sec-t'));
const stateLine = () => text(main().querySelector('.sv-ai-state .sv-ai-d'));
const statusPill = () => main().querySelector('.sv-ai-state .xr-st');
const facts = () => [...main().querySelectorAll('dl.sv-ai-dl > div')].map((item) => text(item));
const actions = () => [...main().querySelectorAll('.sv-ai-act > *')].map((item) => text(item));
const saveState = () => text(document.querySelector('header.st-focusbar .st-save'));
/** No assessment, attempt or record id in any word, name or the tab title (decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;
function expectNoReference() {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.querySelectorAll('[aria-label]'))
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(REFERENCE);
  expect(document.title).not.toMatch(REFERENCE);
}

async function attemptOf(sample: Sample, id: string) {
  const intro = ok(await rahul(sample).getAssessmentIntro(id as AssessmentId));
  return intro;
}

// ---- ST-12 -------------------------------------------------------------------------------------

describe('ST-12 Before you start (ST-v1 `is.aintro`)', () => {
  it('to do: the crumbs, the head, "Before you start" with the rules, the key facts as configured, Start assessment', async () => {
    const { runtime, id } = await world({ introduction: INTRODUCTION });
    showIntro(runtime, id);
    const h1 = await heading(NAME);
    expect(h1).toHaveAttribute('class', 'rk-title');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(text(crumbs)).toBe(`Assessments ${NAME}`);
    expect(within(crumbs).getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'href',
      '/student/assessments',
    );
    const back = main().querySelector('.rk-head .rk-eyebrow a.st-eyelink')!;
    expect(text(back)).toBe('Shell-and-Tube Heat Exchanger');
    expect(back).toHaveAttribute('href', `/student/experiments/${SHELL}/assessment`);
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe(
      'Shell-and-Tube Heat Exchanger · assessment',
    );
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(INTRODUCTION);
    const card = screen.getByRole('region', { name: 'Before you start' });
    expect(card).toHaveClass('sv-card', 'sv-ai');
    expect(statusPill()).toHaveClass('xr-st--info');
    expect(text(statusPill())).toBe('To do');
    expect(main().querySelector('.sv-ai-d')).toBeNull();
    const rules = within(card).getByRole('list', { name: 'How answering works' });
    expect([...rules.querySelectorAll('li')].map((rule) => text(rule))).toEqual([
      'No time limit',
      'Answers save as you go',
      'Nothing is submitted until you choose Submit You can’t change answers after submitting.',
    ]);
    const keyFacts = within(card).getByRole('group', {
      name: 'Key facts, as set for this assessment',
    });
    expect(text(keyFacts.querySelector('.sv-ai-when'))).toBe(
      'Deadline 14 Nov 23:59 · in 18 days 14 Nov 2026, 23:59',
    );
    expect(facts()).toEqual([
      'Questions 4 2 multiple choice · 1 true or false · 1 written answer',
      'Total marks 16',
      'Pass mark 50% 8 of 16 marks',
      'Attempts allowed 2 You have used none',
      'Result and answers After the deadline Your faculty marks written answers',
      'Set by Dr S. Ranganathan',
    ]);
    expect(actions()).toEqual(['Start assessment', 'Back to experiment']);
    expect(screen.getByRole('button', { name: 'Start assessment' })).toHaveAttribute(
      'class',
      'rb-btn rb-btn--primary rb-btn--lg',
    );
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/assessment`,
    );
    expect(document.body.textContent).not.toMatch(KEY_WORDS);
    expectNoReference();
  });

  it('Start assessment starts attempt 1 and opens the attempt', async () => {
    const { runtime, sample, id } = await world();
    const { navigation } = showIntro(runtime, id);
    await heading(NAME);
    await userEvent.click(screen.getByRole('button', { name: 'Start assessment' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/student/assessments/${id}/attempt`),
    );
    const intro = await attemptOf(sample, id);
    expect(intro.sheet?.attemptNumber).toBe(1);
  });

  it('a start that fails for now: “Your attempt didn’t start”, nothing changed, focus on it', async () => {
    const { runtime, sample, id } = await world();
    const { navigation } = showIntro(runtime, id);
    await heading(NAME);
    faults(sample).failNext('AssessmentService.startAttempt');
    await userEvent.click(screen.getByRole('button', { name: 'Start assessment' }));
    const alert = await screen.findByRole('alert');
    expect(text(alert)).toBe('Your attempt didn’t start Nothing has changed. Try again.');
    await waitFor(() => expect(document.getElementById('Im-start')).toHaveFocus());
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect((await attemptOf(sample, id)).attempts).toHaveLength(0);
  });

  it('an attempt in progress: “Attempt 1 in progress · 2 questions of 4 answered.”', async () => {
    const { runtime, sample, id } = await world();
    let attempt = await attemptAs(sample, id, false);
    for (const [questionId, answer] of [
      [Q1, { type: 'multiple-choice', choice: 'A' }],
      ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ] as const) {
      attempt = ok(
        await rahul(sample).saveAnswer({
          attemptId: attempt.id,
          questionId: questionId as QuestionId,
          answer,
          expectedRev: attempt.rev,
        }),
      );
    }
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Attempt 1 in progress'));
    expect(stateLine()).toBe('Your answers are saved. 2 questions of 4 answered.');
    expect(main().querySelector('.sv-ai-d')).toHaveAttribute('role', 'status');
    expect(statusPill()).toHaveClass('xr-st--warn');
    expect(text(statusPill())).toBe('Attempt in progress');
    expect(main().querySelector('.sv-rules')).not.toBeNull();
    expect(facts()[3]).toBe('Attempts allowed 2 You have used none');
    expect(actions()).toEqual(['Continue attempt', 'Back to experiment']);
    expect(screen.getByRole('link', { name: 'Continue attempt' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/attempt`,
    );
    expect(main().querySelector('.rk-head .rk-sub')).toBeNull();
  });

  it('submitted: “Submitted — waiting for marking”, no figure', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, true);
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Submitted — waiting for marking'));
    expect(statusPill()).toHaveClass('xr-st--warn');
    expect(text(statusPill())).toBe('Waiting for marking');
    expect(stateLine()).toBe(
      'You submitted on 27 Oct 2026, 10:00. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(main().querySelector('.sv-rules')).toBeNull();
    expect(facts()[3]).toBe('Attempts allowed 2 You have used 1');
    expect(actions()).toEqual(['See result page', 'Back to experiment']);
    expect(screen.getByRole('link', { name: 'See result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    expect(main().textContent).not.toMatch(/Passed|Not passed|of 16 marks scored/);
  });

  it('a release change after the submission: the facts stay the submitted version’s (P4-06; Phase 4B review)', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, true);
    // Dr Ranganathan switches the release: a new version; Rahul's submission keeps its own.
    const faculty = asPersonId(sample, RANGANATHAN).assessments;
    const view = ok(await faculty.getAssessment(id as AssessmentId));
    const changed = ok(
      await faculty.updateSettings({
        id: id as AssessmentId,
        name: view.assessment.name,
        introduction: null,
        rules: {
          passMarkPercent: '60',
          attemptsAllowed: '2',
          deadline: '2026-11-20T23:59:00+05:30',
          releaseOption: 'immediately-after-marking',
          releaseDate: null,
        },
        expectedRev: view.assessment.rev,
      }),
    );
    expect(changed.newVersion).toBe(true);
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Submitted — waiting for marking'));
    expect(stateLine()).toContain('Your result appears after the deadline: 14 Nov 2026, 23:59.');
    expect(text(main().querySelector('.sv-ai-when .xr-sr'))).toBe('14 Nov 2026, 23:59');
    expect(facts()).toEqual(
      expect.arrayContaining([
        'Pass mark 50% 8 of 16 marks',
        'Result and answers After the deadline Your faculty marks written answers',
      ]),
    );
  });

  it('marked, not released yet: “Marked — result not released yet”, still no figure', async () => {
    const { runtime, sample, id } = await world();
    const attempt = await attemptAs(sample, id, true);
    await markAndConfirm(sample, attempt.id, '5');
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Marked — result not released yet'));
    expect(stateLine()).toBe(
      'Results for this assessment are released after the deadline: 14 Nov 2026, 23:59.',
    );
    expect(statusPill()).toHaveAttribute('class', 'xr-st');
    expect(text(statusPill())).toBe('Result not released yet');
    expect(actions()).toEqual(['See result page', 'Back to experiment']);
    expect(main().textContent).not.toMatch(/Passed|Not passed/);
  });

  it('not passed, 1 attempt left: the rules again; Try again starts attempt 2', async () => {
    const { runtime, sample, id } = await world({ release: 'immediately-after-marking' });
    const attempt = await attemptAs(sample, id, true);
    await markAndConfirm(sample, attempt.id, '3');
    const { navigation } = showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Not passed on attempt 1 · 1 attempt left'));
    expect(stateLine()).toBe('You can try once more. Your first result stays on your result page.');
    expect(statusPill()).toHaveClass('xr-st--ok');
    expect(text(statusPill())).toBe('Result ready');
    expect(main().querySelector('.sv-rules')).not.toBeNull();
    expect(facts()[4]).toBe(
      'Result and answers Immediately after marking Your faculty marks written answers',
    );
    expect(actions()).toEqual(['Try again', 'See result']);
    expect(screen.getByRole('link', { name: 'See result' })).toHaveAttribute(
      'class',
      'rb-btn rb-btn--lg',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/student/assessments/${id}/attempt`),
    );
    expect((await attemptOf(sample, id)).sheet?.attemptNumber).toBe(2);
  });

  it('released and passed: “Result released — you passed” (after Flow D)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    showIntro(runtime, 'ASMT-0009');
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Result released — you passed'));
    expect(stateLine()).toBe('Released 14 Nov 2026, 23:59, after the deadline.');
    expect(statusPill()).toHaveClass('xr-st--ok');
    expect(actions()).toEqual(['See result', 'Back to experiment']);
    expect(screen.getByRole('link', { name: 'See result' })).toHaveClass('rb-btn--primary');
    expectNoReference();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('can’t be started: the board’s line only for an assessment with no questions (f15)', async () => {
    const { runtime, id } = await world();
    // The service never shows a Student an assessment that is not Ready: its answer is shaped here.
    const ports = runtime.ports as unknown as { assessments: Record<string, unknown> };
    const real = runtime.ports.assessments.getAssessmentIntro.bind(runtime.ports.assessments);
    let mix = { multipleChoice: 0, trueFalse: 0, written: 0 };
    ports.assessments = {
      ...runtime.ports.assessments,
      getAssessmentIntro: async (assessmentId: AssessmentId) => {
        const answer = await real(assessmentId);
        return answer.ok
          ? { ...answer, value: { ...answer.value, canStart: false, questionTypes: mix } }
          : answer;
      },
    };
    const first = showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('This assessment can’t be started yet'));
    expect(stateLine()).toBe(
      'It has no questions yet. It appears ready to start when your faculty has added them.',
    );
    expect(text(statusPill())).toBe('Can’t be started yet');
    expect(actions()).toEqual(['Back to experiment']);
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveClass('rb-btn--primary');
    first.view.unmount();
    runtime.queryClient.clear();
    mix = { multipleChoice: 2, trueFalse: 1, written: 1 };
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('This assessment can’t be started yet'));
    expect(stateLine()).toBe(STATE_COPY['ST-12.cant-start-line'].words);
  });

  it('no attempt left: “Result released”, when it was released, See result', async () => {
    const { runtime, sample, id } = await world({ release: 'immediately-after-marking' });
    await markAndConfirm(sample, (await attemptAs(sample, id, true)).id, '0');
    await markAndConfirm(sample, (await attemptAs(sample, id, true)).id, '0');
    showIntro(runtime, id);
    await heading(NAME);
    await waitFor(() => expect(stateTitle()).toBe('Result released'));
    expect(stateLine()).toBe('Released 27 Oct 2026, 10:00, when marked.');
    expect(facts()[3]).toBe('Attempts allowed 2 You have used 2');
    expect(actions()).toEqual(['See result', 'Back to experiment']);
  });

  it('a read that fails for now: “We couldn’t load this assessment” with Try again', async () => {
    const { runtime, sample, id } = await world();
    faults(sample).failNext('AssessmentService.getAssessmentIntro');
    showIntro(runtime, id);
    expect(
      await screen.findByRole(
        'heading',
        { name: 'We couldn’t load this assessment' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await heading(NAME);
  });

  it('an unknown assessment is the in-shell not-found', async () => {
    const { runtime } = await world();
    showIntro(runtime, 'ASMT-9999');
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'We can’t find that page' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  });

  it('the state comes from the service’s answer alone', () => {
    const base = {
      canStart: true,
      sheet: null,
      attempts: [],
      questionTypes: { multipleChoice: 2, trueFalse: 1, written: 1 },
    } as unknown as IntroAnswer;
    expect(introState(base).kind).toBe('start');
    expect(introState({ ...base, canStart: false })).toEqual({
      kind: 'cant-start',
      noQuestions: false,
      latest: null,
    });
  });
});

// ---- ST-13 -------------------------------------------------------------------------------------

describe('ST-13 the attempt (ST-v1 `is.att`, focused)', () => {
  it('the focused page: its own V3 root and bar, the questions without a key, the panel', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    // No rail: the focused task keeps none (neither the v46 sidebar nor the V3 rail).
    expect(document.querySelector('aside.xr-side')).toBeNull();
    expect(document.querySelector('aside.rb-rail')).toBeNull();
    expect(document.querySelector('.st-focus')!.parentElement).toHaveAttribute('class', 'xr rb');
    const bar = document.querySelector('header.st-focusbar')!;
    const exit = within(bar as HTMLElement).getByRole('link', { name: NAME });
    expect(exit).toHaveAttribute('class', 'st-exit st-exit--compact');
    expect(exit).toHaveAttribute('href', `/student/assessments/${id}`);
    expect(saveState()).toBe('Answers save automatically');
    const avatar = bar.querySelector('.xr-avatar')!;
    expect(avatar).toHaveTextContent('RV');
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelector('main.st-focuspage.st-main#main')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(text(main().querySelector('.sv-focushead .sv-act-k'))).toBe(
      'Shell-and-Tube Heat Exchanger · Attempt 1 of 2',
    );
    expect(text(main().querySelector('.sv-focushead .sv-focus-sub'))).toBe(
      '4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit',
    );
    expect(screen.getByRole('list', { name: 'Questions' })).toHaveClass('sv-card', 'sv-qs');
    const strip = screen.getByRole('region', { name: 'Your answers' });
    expect(text(strip.querySelector('.sv-attcount'))).toBe('0 of 4 answered');
    expect([...strip.querySelectorAll('a')].map((link) => link.getAttribute('aria-label'))).toEqual(
      [
        'Question 1, not answered',
        'Question 2, not answered',
        'Question 3, not answered',
        'Question 4, not answered',
      ],
    );
    expect([...main().querySelectorAll('h2.sv-q-k')].map((label) => text(label))).toEqual([
      'Question 1 of 4 · Multiple choice',
      'Question 2 of 4 · Multiple choice',
      'Question 3 of 4 · True or false',
      'Question 4 of 4 · Written answer',
    ]);
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    expect(
      screen.getByRole('group', {
        name: 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /Explain how fouling changes/ }),
    ).toHaveAccessibleDescription('Your faculty marks written answers.');
    expect(text(main().querySelector('.st-att-submit .sv-attnote'))).toBe(
      'Nothing is submitted until you choose Submit. You can’t change answers after submitting.',
    );
    expect(document.body.textContent).not.toMatch(KEY_WORDS);
    expect(document.title).toBe(`${NAME} · XR Learning Platform`);
    expectNoReference();
  });

  it('a choice saves at once; the strip counts it; Next unanswered moves focus', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    );
    await waitFor(() => expect(saveState()).toBe('All answers saved'));
    expect(document.querySelector('.st-save')).toHaveClass('st-save--ok');
    expect(text(document.querySelector('.sv-attcount'))).toBe('1 of 4 answered');
    expect(screen.getByRole('link', { name: 'Question 1, answered' })).toHaveClass('is-done');
    expect(document.querySelector('#Ta-q1 .sv-q-n')).toHaveClass('is-done');
    const saved = await attemptOf(sample, id);
    expect(saved.sheet?.answers[Q1]).toEqual({ type: 'multiple-choice', choice: 'A' });
    await userEvent.click(screen.getByRole('button', { name: 'Next unanswered' }));
    expect(document.getElementById('Ta-q2')).toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Question 4, not answered' }));
    expect(document.getElementById('Ta-q4')).toHaveFocus();
  });

  it('a written answer saves after a pause in typing, and at once when its field is left', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    const field = screen.getByRole('textbox', { name: /Explain how fouling changes/ });
    fireEvent.change(field, { target: { value: 'Fouling lowers U.' } });
    expect(saveState()).toBe('Saving…');
    await waitFor(() => expect(saveState()).toBe('All answers saved'), {
      timeout: WRITTEN_SAVE_PAUSE_MS + 3000,
    });
    expect((await attemptOf(sample, id)).sheet?.answers[WRITTEN]).toEqual({
      type: 'written',
      text: 'Fouling lowers U.',
    });
    fireEvent.change(field, { target: { value: 'Fouling lowers U and the heat duty.' } });
    fireEvent.blur(field);
    await waitFor(async () =>
      expect((await attemptOf(sample, id)).sheet?.answers[WRITTEN]).toEqual({
        type: 'written',
        text: 'Fouling lowers U and the heat duty.',
      }),
    );
    await waitFor(() => expect(saveState()).toBe('All answers saved'));
  });

  it('a save that fails for now: “Your last answer didn’t save · Try again” keeps it (f2)', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    faults(sample).failNext('AssessmentService.saveAnswer');
    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    );
    const alert = await screen.findByRole('alert');
    expect(text(alert)).toBe('Your last answer didn’t save Try again');
    expect(alert.firstElementChild).toHaveAttribute('class', 'st-save st-save--err');
    // The answer stays on the page and in the strip; the service has none yet.
    expect(
      screen.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    ).toBeChecked();
    expect(text(document.querySelector('.sv-attcount'))).toBe('1 of 4 answered');
    expect((await attemptOf(sample, id)).sheet?.answers[Q1]).toBeUndefined();
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(saveState()).toBe('All answers saved'));
    expect((await attemptOf(sample, id)).sheet?.answers[Q1]).toEqual({
      type: 'multiple-choice',
      choice: 'A',
    });
  });

  it('a stale revision (saved in another tab) is read again; Try again then saves', async () => {
    const { runtime, sample, id } = await world();
    const attempt = await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    ok(
      await rahul(sample).saveAnswer({
        attemptId: attempt.id,
        questionId: Q3,
        answer: { type: 'true-false', value: false },
        expectedRev: attempt.rev,
      }),
    );
    await userEvent.click(screen.getByRole('radio', { name: 'UA ÷ C_min' }));
    await waitFor(() => expect(saveState()).toBe('Your last answer didn’t save Try again'));
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(saveState()).toBe('All answers saved'));
    const saved = (await attemptOf(sample, id)).sheet!.answers;
    expect(saved['Q-0102' as QuestionId]).toEqual({ type: 'multiple-choice', choice: 'A' });
    expect(saved[Q3]).toEqual({ type: 'true-false', value: false });
  });

  it('a stale Submit reads the attempt again and the next Submit sends it (Phase 4B review)', async () => {
    const { runtime, sample, id } = await world();
    const attempt = await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    // Saved in another tab: the page's revision is now behind.
    ok(
      await rahul(sample).saveAnswer({
        attemptId: attempt.id,
        questionId: Q3,
        answer: { type: 'true-false', value: false },
        expectedRev: attempt.rev,
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Submit your answers?' })).getByRole('button', {
        name: 'Submit answers',
      }),
    );
    await waitFor(() => expect(main()).toHaveTextContent('Your answers weren’t submitted'));
    expect((await attemptOf(sample, id)).sheet).not.toBeNull();
    // Submit again: the revision read after the refusal is used — it is sent.
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Submit your answers?' })).getByRole('button', {
        name: 'Submit answers',
      }),
    );
    await submittedHeading();
    expect((await attemptOf(sample, id)).sheet).toBeNull();
  });

  it('DL-1 names the unanswered questions; Keep answering closes it, nothing sent', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    await userEvent.click(
      screen.getByRole('radio', {
        name: 'The actual heat transfer with the largest heat transfer possible',
      }),
    );
    await userEvent.click(screen.getByRole('radio', { name: 'C_min ÷ C_max' }));
    await waitFor(() => expect(saveState()).toBe('All answers saved'));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const dialog = screen.getByRole('dialog', { name: 'Submit your answers?' });
    expect(dialog).toHaveAccessibleDescription('You can’t change your answers after submitting.');
    expect(text(dialog.querySelector('.rk-dlg-body'))).toBe(
      '2 questions aren’t answered (3, 4). You can still submit.',
    );
    expect(dialog.querySelector('.rk-dlg-body p')).toHaveClass('rk-pending');
    // Opening focuses the dialog's title (the export's `focusId('st-dlg-t')`).
    expect(screen.getByRole('heading', { name: 'Submit your answers?' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep answering' }));
    expect(dialog).not.toHaveAttribute('open');
    expect((await attemptOf(sample, id)).sheet).not.toBeNull();
  });

  it('a submit that fails for now: “Your answers weren’t submitted”, then it submits (f3, f4)', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    showAttempt(runtime, id);
    await heading(NAME);
    const field = screen.getByRole('textbox', { name: /Explain how fouling changes/ });
    fireEvent.change(field, { target: { value: 'Fouling lowers U.' } });
    faults(sample).failNext('AssessmentService.submitAttempt');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const dialog = screen.getByRole('dialog', { name: 'Submit your answers?' });
    expect(text(dialog.querySelector('.rk-dlg-body'))).toContain(
      '3 questions aren’t answered (1, 2, 3).',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Submit answers' }));
    await waitFor(() => expect(document.getElementById('Ta-suberr')).toHaveFocus());
    expect(text(document.getElementById('Ta-suberr'))).toBe(
      'Your answers weren’t submitted They’re still saved here. Try again.',
    );
    expect(document.getElementById('Ta-suberr')).toHaveAttribute('role', 'alert');
    expect(document.getElementById('Ta-suberr')!.closest('section')).toHaveClass('st-att-submit');
    // The pending written answer was saved before the submit was sent; nothing was submitted.
    const kept = await attemptOf(sample, id);
    expect(kept.sheet?.answers[WRITTEN]).toEqual({ type: 'written', text: 'Fouling lowers U.' });
    expect(dialog).not.toHaveAttribute('open');

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Submit your answers?' })).getByRole('button', {
        name: 'Submit answers',
      }),
    );
    const done = await submittedHeading();
    const message = document.getElementById('Ta-done')!;
    expect(message).toContainElement(done);
    expect(message).toHaveClass('sv-card', 'sv-act-card');
    await waitFor(() => expect(message).toHaveFocus());
    expect(text(message.querySelector('.xr-st'))).toBe('Waiting for marking');
    expect(message.querySelector('.xr-st')).toHaveClass('xr-st--warn', 'rk-st-lg');
    expect(text(message.querySelector('p.sv-act-d'))).toBe(
      'Submitted 27 Oct 2026, 10:00. Your faculty marks written answers. Your result appears after the deadline: 14 Nov 2026, 23:59.',
    );
    // The questions are gone: no save state, the head and the way out stay.
    expect(document.querySelector('.st-save')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to experiment' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/assessment`,
    );
    expect(screen.getByRole('link', { name: 'See your result page' })).toHaveAttribute(
      'href',
      `/student/assessments/${id}/result`,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(`Answers submitted · ${NAME} · XR Learning Platform`);
    const after = await attemptOf(sample, id);
    expect(after.sheet).toBeNull();
    expect(after.attempts[0]?.state).toBe('submitted');
  });

  it('no attempt in progress: the page is replaced by Before you start', async () => {
    const { runtime, id } = await world();
    const { navigation } = showAttempt(runtime, id);
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(`/student/assessments/${id}`, {
        replace: true,
      }),
    );
  });

  it('a read that fails for now: “We couldn’t load this assessment”', async () => {
    const { runtime, sample, id } = await world();
    await attemptAs(sample, id, false);
    faults(sample).failNext('AssessmentService.getAssessmentIntro');
    showAttempt(runtime, id);
    expect(
      await screen.findByRole(
        'heading',
        { name: 'We couldn’t load this assessment' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    });
    await heading(NAME);
  });
});

describe('the link targets of ST-12 and ST-13', () => {
  it('one primary per state, each drawn action listed once', () => {
    const keys = P4B_ATTEMPT_LINK_TARGETS.map(
      (entry) => `${entry.screen}|${entry.where}|${entry.action}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(
      P4B_ATTEMPT_LINK_TARGETS.filter(
        (entry) => entry.screen === 'ST-13' && entry.role === 'primary',
      ).map((entry) => entry.action),
    ).toEqual(['Submit', 'Submit answers', 'See your result page']);
  });
});
