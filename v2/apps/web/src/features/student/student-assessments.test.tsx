/**
 * Phase 4B, the Student's assessment list — ST-11 Assessments (board B4-11 f0 … f6), the
 * experiment hub's Assessment tab (f7 … f9) and Home's "Up next" assessment row (f10) — on the real
 * composition root and the one sample world. Every row, status, line and action is the ports'
 * answer for the signed-in Student (`listMyAssessments`): the assessment Dr S. Ranganathan creates
 * on after Flow C (the walk's D1, 27 Oct), Rahul's attempt started, answered and submitted through
 * his own port (D2, 5 Nov 18:52), marked and confirmed through the Faculty member's (D3, 7 Nov),
 * and after Flow D (15 Nov) released. Nothing here scores or releases: no score, outcome or answer
 * shows before the service releases it, and there is no release control.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type AssessmentId, type AttemptId, type QuestionId, unsafeBrand } from '@xr/domain';
import { asPersonId, faults, ist, setSampleNow } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_STUDENT_ASSESSMENTS } from '@/copy/state-copy-student-assessments';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { P4B_STUDENT_ASSESSMENTS_LINK_TARGETS } from '@/nav/link-targets-p4b/student-assessments';
import { resolveAddress } from '@/nav/routes';
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
import { StudentHome } from './st-01-home/home';
import { HubAssessmentTab } from './st-05-experiment-hub/hub-assessment-tab';
import { StudentAssessments } from './st-11-assessments/assessments';

/**
 * Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces (in a string, or in each string of a row).
 */
function plain<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\u00a0/g, ' ') as T;
  if (Array.isArray(value)) return value.map((item: unknown) => plain(item)) as T;
  return value;
}

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const RANGANATHAN = 'per-0014';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const NAME = 'Heat Exchanger — post-lab';
/** The course code Rahul sees on these worlds (the platform's; B4-11 draws the institution's). */
const CODE = 'MEC-523';
const LIST = '/student/assessments';
const HUB = `/student/experiments/${SHELL}`;
const TAB = `${HUB}/assessment`;

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function inStudent(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

const main = () => screen.getByRole('main');
/** An internal reference: no assessment, attempt or record id in any word or name (decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT|Q)-\d+/;

function expectNoReference(root: Element) {
  expect(root.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of root.querySelectorAll('[aria-label]'))
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(REFERENCE);
  expect(document.title).not.toMatch(REFERENCE);
}

/** D1: Dr S. Ranganathan creates ASMT-0009 on Shell-and-Tube, after the deadline (27 Oct). */
async function created(sample: Sample): Promise<AssessmentId> {
  const assessment = ok(
    await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
      mode: 'create',
      experimentId: unsafeBrand(SHELL),
      name: NAME,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'].map((id) => unsafeBrand<QuestionId>(id)),
    }),
  );
  return assessment.id;
}

/** D2: Rahul starts the attempt (5 Nov, 18:20) through his own port. */
async function started(sample: Sample, id: AssessmentId) {
  setSampleNow(sample, ist('2026-11-05 18:20'));
  return ok(await asPersonId(sample, RAHUL).assessments.startAttempt(id));
}

/** D2: Rahul answers the four questions and submits (5 Nov, 18:52). */
async function submitted(sample: Sample, id: AssessmentId): Promise<AttemptId> {
  let attempt = await started(sample, id);
  const rahul = asPersonId(sample, RAHUL).assessments;
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: 'Fouling adds a resistance, so U falls.' }],
  ] as const) {
    attempt = ok(
      await rahul.saveAnswer({
        attemptId: attempt.id,
        questionId: unsafeBrand(questionId),
        answer,
        expectedRev: attempt.rev,
      }),
    );
  }
  setSampleNow(sample, ist('2026-11-05 18:52'));
  ok(await rahul.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }));
  return attempt.id;
}

/** D3: Dr Ranganathan marks the written answer 7 of 10 and confirms (7 Nov) — not released yet. */
async function confirmed(sample: Sample, attemptId: AttemptId) {
  setSampleNow(sample, ist('2026-11-07 10:12'));
  const marking = asPersonId(sample, RANGANATHAN).marking;
  const view = ok(await marking.getAttemptForMarking(attemptId));
  const saved = ok(
    await marking.saveMark({
      attemptId,
      questionId: unsafeBrand('Q-0106'),
      mark: '7',
      feedback: 'Clear explanation of fouling.',
      expectedRev: view.attempt.rev,
    }),
  );
  setSampleNow(sample, ist('2026-11-07 10:15'));
  ok(await marking.confirmMarks({ attemptId, expectedRev: saved.rev }));
}

/**
 * The list's rows (`li.sv-li.sv-ali` in the card named by the tab) as [date kicker, date block,
 * experiment line, title, status, line, action, href, name].
 */
function rows(tab = 'To do') {
  const card = screen.getByRole('region', { name: tab });
  return [...card.querySelectorAll<HTMLElement>('ul.sv-list > li.sv-li.sv-ali')].map((row) => {
    const link = within(row).getByRole('link');
    return [
      row.querySelector('.sv-ali-when .sv-eyebrow')?.textContent,
      row.querySelector('.sv-when')?.textContent ?? null,
      row.querySelector('.sv-li-k')?.textContent,
      row.querySelector('h3.sv-li-t')?.textContent,
      row.querySelector('.sv-li-m .xr-st')?.textContent,
      row.querySelector('.sv-li-m > span:last-child')?.textContent,
      link.textContent,
      link.getAttribute('href'),
      link.getAttribute('aria-label'),
    ];
  });
}

/** The state tabs (`nav.rk-tabs.sv-tabs` "Assessments") as [name, current]. */
function tabs() {
  const nav = screen.getByRole('navigation', { name: 'Assessments' });
  expect(nav).toHaveClass('rk-tabs', 'sv-tabs');
  return within(nav)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('aria-current') === 'page']);
}

// ---- ST-11 Assessments ---------------------------------------------------------------------------

describe('ST-11 Assessments (ST-v1 `is.alist`)', () => {
  it('none yet (after Flow C, before D1): “No assessments yet” with each experiment Rahul has; Assessments current', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, LIST, <StudentAssessments />);
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Assessments' });
    expect(h1).toHaveAttribute('class', 'rb-h1');
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'Assessments for the experiments you have',
    );
    expect(main().querySelector('.rk-head .rb-eyebrow-date')).toHaveTextContent(
      'Tuesday 27 October 2026',
    );
    const empty = await screen.findByRole('region', { name: 'No assessments yet' });
    expect(empty).toHaveClass('sv-card', 'sv-msg');
    expect(empty.querySelector('.sv-msg-d')).toHaveTextContent(
      'When your faculty sets an assessment for an experiment you have, it appears here.',
    );
    const experiments = await within(empty).findByRole('list', { name: 'Your experiments' });
    const facts = [...experiments.querySelectorAll('li')].map((item) => [
      item.querySelector('.sv-facts-t')?.textContent,
      item.querySelector('.sv-facts-s')?.textContent,
    ]);
    expect(facts).toContainEqual([SHELL_NAME, 'No assessment set yet']);
    expect(experiments.querySelector('.sv-facts-c')?.textContent).toMatch(/^MEC-523 · /);
    expect(screen.queryByRole('navigation', { name: 'Assessments' })).toBeNull();
    // States only: no action is added.
    expect(within(main()).queryAllByRole('link')).toEqual([]);
    expect(
      screen.getByRole('navigation', { name: /Student/ }).querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', LIST);
    expect(main().querySelector('.rk-crumbs')).toBeNull();
    expectNoReference(main());
  });

  it('to do (D1): the row led by its deadline, its line, "To do" and the gold "Open" to Before you start', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(tabs()).toEqual([
      ['To do1, 1', true],
      ['Submitted0, 0', false],
      ['Results0, 0', false],
    ]);
    expect(rows()).toEqual([
      [
        'Due',
        '14 Nov23:59 · in 18 days',
        `${SHELL_NAME} · ${CODE}`,
        NAME,
        'To do',
        '4 questions · 16 marks · no time limit',
        'Open',
        `${LIST}/${id}`,
        `Open, ${NAME}`,
      ],
    ]);
    const card = screen.getByRole('region', { name: 'To do' });
    expect(card).toHaveClass('sv-card', 'sv-alist');
    expect(card.querySelector('.sv-li-m .xr-st')).toHaveClass('xr-st--info');
    expect(card.querySelector('.sv-when')).toHaveAttribute('class', 'sv-when');
    expect(within(card).getByRole('link')).toHaveAttribute('class', 'rb-btn rb-btn--primary');
    expectNoReference(main());
  });

  it('the state tabs switch the list in place and keep the tab in the address (`?tab=`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await created(sample);
    const navigation = inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() => expect(rows()).toHaveLength(1));
    await user.click(screen.getByRole('link', { name: 'Submitted, 0' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?tab=submitted`);
    expect(tabs()[1]).toEqual(['Submitted0, 0', true]);
    const card = screen.getByRole('region', { name: 'Submitted' });
    expect(card.querySelector('ul.sv-list')).toBeNull();
    const state = within(card).getByRole('status');
    expect(state).toHaveClass('sv-pstate', 'sv-pstate--row');
    expect(state).toHaveTextContent('Nothing submitted and waiting.');
    expect(state).toHaveTextContent('Your assessment is under To do.');
    await user.click(screen.getByRole('link', { name: 'Results, 0' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?tab=results`);
    expect(screen.getByRole('region', { name: 'Results' })).toHaveTextContent(
      'No results released yet.',
    );
    await user.click(screen.getByRole('link', { name: 'To do, 1' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(LIST);
    expect(rows()).toHaveLength(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('an address with another tab shows To do and is normalised; `?tab=results` opens Results', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await created(sample);
    const odd = inStudent(runtime, LIST, <StudentAssessments />, '?tab=everything');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(tabs()[0]).toEqual(['To do1, 1', true]);
    expect(odd.replace).toHaveBeenCalledWith(LIST);
  });

  it('attempt in progress (D2 started): "Your answers are saved", "Continue attempt" to the attempt', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() => expect(rows()[0]?.[4]).toBe('To do'));
    // Rahul starts in another tab of the same world: this list follows the receipt.
    const attempt = await asPersonId(sample, RAHUL).assessments.startAttempt(id);
    if (!attempt.ok) throw new Error('start refused');
    await act(async () => {
      await runtime.invalidate(attempt.changed);
    });
    await waitFor(() => expect(rows()[0]?.[4]).toBe('Attempt in progress'));
    expect(tabs()[0]).toEqual(['To do1, 1', true]);
    expect(rows()).toEqual([
      [
        'Due',
        '14 Nov23:59 · in 18 days',
        `${SHELL_NAME} · ${CODE}`,
        NAME,
        'Attempt in progress',
        'Your answers are saved · no time limit',
        'Continue attempt',
        `${LIST}/${id}/attempt`,
        `Continue attempt, ${NAME}`,
      ],
    ]);
    expect(main().querySelector('.sv-li-m .xr-st')).toHaveClass('xr-st--warn');
    expect(screen.getByRole('link', { name: `Continue attempt, ${NAME}` })).toHaveClass(
      'rb-btn--primary',
    );
  });

  it('waiting for marking (D2 submitted): the Submitted tab, "Result after", "View" the result page, no score', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await submitted(sample, id);
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=submitted');
    await waitFor(() => expect(rows('Submitted')).toHaveLength(1));
    expect(tabs()).toEqual([
      ['To do0, 0', false],
      ['Submitted1, 1', true],
      ['Results0, 0', false],
    ]);
    expect(plain(rows('Submitted'))).toEqual([
      [
        'Result after',
        '14 Nov23:59 · in 18 days',
        `${SHELL_NAME} · ${CODE}`,
        NAME,
        'Waiting for marking',
        'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
        'View',
        `${LIST}/${id}/result`,
        `View, ${NAME}`,
      ],
    ]);
    // A release date is never drawn ivory; the action is a plain button.
    expect(main().querySelector('.sv-when')).toHaveAttribute('class', 'sv-when');
    expect(screen.getByRole('link', { name: `View, ${NAME}` })).toHaveAttribute('class', 'rb-btn');
    expect(main()).not.toHaveTextContent(/of 16 marks|Passed|Not passed|score/i);
  });

  it('result not released yet (D3 confirmed, before the deadline): "Marked · released after the deadline"', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await confirmed(sample, await submitted(sample, id));
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=submitted');
    await waitFor(() => expect(rows('Submitted')).toHaveLength(1));
    expect(rows('Submitted')[0]).toEqual([
      'Result after',
      '14 Nov23:59 · in 18 days',
      `${SHELL_NAME} · ${CODE}`,
      NAME,
      'Result not released yet',
      'Marked · released after the deadline',
      'View',
      `${LIST}/${id}/result`,
      `View, ${NAME}`,
    ]);
    expect(main().querySelector('.sv-li-m .xr-st')).toHaveAttribute('class', 'xr-st');
    // Marks confirmed, still nothing of the result before the release (ATT-15).
    expect(main()).not.toHaveTextContent(/11|of 16|Passed|Not passed/);
  });

  it('choice-only (owner decision 24 Oct 2026): “your faculty confirms the automatic marks”, then released once confirmed', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = ok(
      await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
        mode: 'create',
        experimentId: unsafeBrand(SHELL),
        name: NAME,
        introduction: null,
        rules: {
          passMarkPercent: '50',
          attemptsAllowed: '2',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: 'immediately-after-marking',
          releaseDate: null,
        },
        questions: ['Q-0101', 'Q-0102', 'Q-0104'].map((entry) => unsafeBrand<QuestionId>(entry)),
      }),
    ).id;
    let attempt = await started(sample, id);
    const rahul = asPersonId(sample, RAHUL).assessments;
    for (const [questionId, answer] of [
      ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
      ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
      ['Q-0104', { type: 'true-false', value: true }],
    ] as const) {
      attempt = ok(
        await rahul.saveAnswer({
          attemptId: attempt.id,
          questionId: unsafeBrand(questionId),
          answer,
          expectedRev: attempt.rev,
        }),
      );
    }
    setSampleNow(sample, ist('2026-11-05 18:52'));
    ok(await rahul.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }));
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=submitted');
    await waitFor(() => expect(rows('Submitted')).toHaveLength(1));
    const [waiting] = plain(rows('Submitted'));
    expect(waiting![4]).toBe('Waiting for marking');
    expect(waiting![5]).toBe(
      'Submitted 5 Nov 2026, 18:52 · your faculty confirms the automatic marks',
    );
    expect(main()).not.toHaveTextContent('written answers');
    expect(main()).not.toHaveTextContent(/of 6 marks|Passed|score/i);
    // Dr Ranganathan confirms the automatic marks: released at once, as set.
    setSampleNow(sample, ist('2026-11-07 10:15'));
    const marking = asPersonId(sample, RANGANATHAN).marking;
    const view = ok(await marking.getAttemptForMarking(attempt.id));
    await act(async () => {
      const done = await marking.confirmMarks({
        attemptId: attempt.id,
        expectedRev: view.attempt.rev,
      });
      ok(done);
      if (done.ok) await runtime.invalidate(done.changed);
    });
    await waitFor(() =>
      expect(tabs()).toEqual([
        ['To do0, 0', false],
        ['Submitted0, 0', true],
        ['Results1, 1', false],
      ]),
    );
    const result = ok(await rahul.getResult(attempt.id));
    expect(result.result).toMatchObject({ kind: 'released', score: 4, outOf: 6, passed: true });
    expectNoReference(main());
  });

  it('result ready (after Flow D): the Results tab, "Released", "See result"', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=results');
    await waitFor(() => expect(rows('Results')).toHaveLength(1));
    expect(tabs()).toEqual([
      ['To do0, 0', false],
      ['Submitted0, 0', false],
      ['Results1, 1', true],
    ]);
    const [row] = rows('Results');
    expect(row).toEqual([
      'Released',
      expect.stringMatching(/^14 Nov23:59 · /),
      `${SHELL_NAME} · ${CODE}`,
      NAME,
      'Result ready',
      'Your result and answers are ready',
      'See result',
      `${LIST}/ASMT-0009/result`,
      `See result, ${NAME}`,
    ]);
    expect(main().querySelector('.sv-li-m .xr-st')).toHaveClass('xr-st--ok');
    // The list never carries the figures: they are the result page's.
    expect(main()).not.toHaveTextContent(/11 of 16|Passed/);
    expectNoReference(main());
  });

  it('loading, then failed says so in the card and "Try again" reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listMyAssessments');
    inStudent(runtime, LIST, <StudentAssessments />);
    const failed = await screen.findByRole('heading', {
      level: 3,
      name: 'We couldn’t load your assessments',
    });
    expect(failed.closest('.sv-pstate')).toHaveAttribute('role', 'alert');
    expect(failed.closest('.sv-pstate')).toHaveTextContent('Nothing has changed. Try again.');
    // The tabs stay, without their counts.
    expect(tabs()).toEqual([
      ['To do', true],
      ['Submitted', false],
      ['Results', false],
    ]);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(tabs()[2]).toEqual(['Results1, 1', false]));
  });
});

// ---- the hub's Assessment tab ----------------------------------------------------------------------

describe('the hub’s Assessment tab (ST-v1 `HB.isAssessment`)', () => {
  /** The card of this experiment's assessment (`section.sv-card.sv-atab`), named by it. */
  const card = () => screen.findByRole('region', { name: NAME }, { timeout: 5000 });

  it('none set yet: the hub with Assessment current and “Your faculty hasn’t set an assessment …”', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    const assessment = await screen.findByRole('link', { name: 'Assessment' });
    expect(assessment).toHaveAttribute('aria-current', 'page');
    expect(assessment).toHaveAttribute('href', TAB);
    const empty = await screen.findByRole('region', {
      name: 'Your faculty hasn’t set an assessment for this experiment yet',
    });
    expect(empty).toHaveClass('sv-card', 'sv-msg');
    expect(empty).toHaveTextContent('When they do, it appears here and in Assessments.');
    expect(within(empty).queryAllByRole('link')).toEqual([]);
  });

  it('to do: the deadline, the key facts, "To do" and the gold "Open assessment"', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await card();
    expect(section).toHaveClass('sv-card', 'sv-atab');
    expect(section.querySelector('.sv-atab-when .sv-eyebrow')).toHaveTextContent('Due');
    expect(section.querySelector('.sv-when')).toHaveTextContent('14 Nov23:59 · in 18 days');
    expect(section.querySelector('.sv-atab-main .sv-eyebrow')).toHaveTextContent('Assessment');
    expect(section.querySelector('.sv-atab-f')).toHaveTextContent(
      '4 questions · 16 marks · pass mark 50% · 2 attempts · no time limit',
    );
    expect(
      plain([...section.querySelectorAll('.sv-li-m > span')].map((span) => span.textContent)),
    ).toEqual(['To do']);
    const open = within(section).getByRole('link', { name: `Open assessment, ${NAME}` });
    expect(open).toHaveTextContent('Open assessment');
    expect(open).toHaveAttribute('class', 'rb-btn rb-btn--primary');
    expect(open).toHaveAttribute('href', `${LIST}/${id}`);
    expect(main().querySelectorAll('.sv-atab .rb-btn--primary')).toHaveLength(1);
    expectNoReference(main());
  });

  it('waiting for marking: "Deadline", "Submitted … · your faculty marks written answers" and "View"', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await submitted(sample, id);
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await card();
    expect(section.querySelector('.sv-atab-when .sv-eyebrow')).toHaveTextContent('Deadline');
    expect(
      plain([...section.querySelectorAll('.sv-li-m > span')].map((span) => span.textContent)),
    ).toEqual([
      'Waiting for marking',
      'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
    ]);
    const view = within(section).getByRole('link', { name: `View, ${NAME}` });
    expect(view).toHaveAttribute('class', 'rb-btn');
    expect(view).toHaveAttribute('href', `${LIST}/${id}/result`);
    expect(main().querySelectorAll('.sv-atab .rb-btn--primary')).toHaveLength(0);
  });

  it('result ready (after Flow D): "Result ready", "Released …" and "See result"', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await card();
    expect(
      plain([...section.querySelectorAll('.sv-li-m > span')].map((span) => span.textContent)),
    ).toEqual(['Result ready', 'Released 14 Nov 2026, 23:59']);
    expect(within(section).getByRole('link', { name: `See result, ${NAME}` })).toHaveAttribute(
      'href',
      `${LIST}/ASMT-0009/result`,
    );
    expect(main()).not.toHaveTextContent(/11 of 16|Passed/);
  });

  it('an experiment that was not given is ST-19 in place, as every hub tab', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(
      runtime,
      '/student/experiments/fin-tube-bundle/assessment',
      <HubAssessmentTab experimentId="fin-tube-bundle" />,
    );
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeVisible());
    expect(main().querySelector('.sv-atab')).toBeNull();
  });
});

// ---- Home's Up next ------------------------------------------------------------------------------

describe('Home · Up next · the assessment (B4-11 f10)', () => {
  it('the cover’s next step names the assessment and its deadline; "Open assessment" opens Before you start', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, '/student', <StudentHome />);
    // V3 Home (the export's `nextStep` "asmt-todo"): both formats done and their feedback sent,
    // so the assessment to do is the one next step — named from the Student's own assessments.
    const cover = await screen.findByRole('region', { name: 'Continue learning' });
    const step = cover.querySelector<HTMLElement>('.sv-step.is-next')!;
    expect(step.querySelector('.sv-step-t')).toHaveTextContent('Start the assessment');
    expect(step.querySelector('.sv-step-d')).toHaveTextContent(
      'Heat Exchanger — post-lab is due 14 Nov 2026, 23:59.',
    );
    const open = within(step).getByRole('link', { name: `Open assessment, ${SHELL_NAME}` });
    expect(open).toHaveTextContent('Open assessment');
    expect(open).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(open).toHaveAttribute('href', `${LIST}/${id}`);
    // The step covers it: "Also in this experiment" does not list the assessment again.
    const also = screen.getByRole('region', { name: 'Also in this experiment' });
    expect(also).not.toHaveTextContent('Assessment');
  });

  it('offers the assessment only while it is to do (after Flow D: none)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, '/student', <StudentHome />);
    await screen.findByRole('article', { name: SHELL_NAME });
    expect(within(main()).queryByRole('link', { name: /^Open assessment/ })).toBeNull();
    // The assessment stays named in the experiment's parts, with its state.
    const parts = main().querySelector<HTMLElement>('.sv-home-also')!;
    expect(parts).toHaveTextContent('Assessment');
  });
});

// ---- the registers ---------------------------------------------------------------------------------

describe('the registers', () => {
  it('every action in this group’s ledger reaches a built page or stays on it', () => {
    expect(LINK_TARGET_LEDGER).toEqual(
      expect.arrayContaining([...P4B_STUDENT_ASSESSMENTS_LINK_TARGETS]),
    );
    for (const entry of P4B_STUDENT_ASSESSMENTS_LINK_TARGETS) {
      expect(['built', 'in-page'], `${entry.screen} ${entry.where}`).toContain(entry.outcome);
      expect(['screen', 'record-screen'], entry.on).toContain(
        resolveAddress(expandTarget(entry.on, '/student')).kind,
      );
      if (entry.target === null) continue;
      expect(['screen', 'record-screen'], `${entry.screen} ${entry.action}`).toContain(
        resolveAddress(expandTarget(entry.target, '/student')).kind,
      );
    }
  });

  it('the state-copy entries are in the one register, provisional with their decisions', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_STUDENT_ASSESSMENTS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
    }
  });
});
