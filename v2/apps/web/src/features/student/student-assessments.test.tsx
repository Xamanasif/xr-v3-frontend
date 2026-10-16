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
const topTitle = () => document.querySelector('.xr-top-title');
const crumbs = () =>
  [...document.querySelectorAll('.xr-crumbs li')].map((li) => [
    li.textContent?.replace('/', '').trim(),
    li.querySelector('a')?.getAttribute('href') ?? null,
  ]);

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

/** The list's rows as [title, experiment line, fact line, status, action, href, name]. */
function rows() {
  const section = screen.getByRole('region', { name: 'Your assessments' });
  return [...section.querySelectorAll<HTMLElement>('ul.xr-rows > li.xr-row')].map((row) => {
    const link = within(row).getByRole('link');
    return [
      row.querySelector('.xr-row-title')?.textContent,
      ...[...row.querySelectorAll('.xr-row-sub')].map((sub) => sub.textContent),
      row.querySelector('.xr-status')?.textContent,
      link.textContent,
      link.getAttribute('href'),
      link.getAttribute('aria-label'),
    ];
  });
}

/** The state tabs as [words, pressed]. */
function tabs() {
  const group = screen.getByRole('group', { name: 'Show' });
  expect(group).toHaveClass('xr-seg');
  return within(group)
    .getAllByRole('button')
    .map((button) => [button.textContent, button.getAttribute('aria-pressed')]);
}

// ---- ST-11 Assessments ---------------------------------------------------------------------------

describe('ST-11 Assessments (B4-11 f0 … f6)', () => {
  it('none yet (after Flow C, before D1): the empty state; Assessments current, no crumb (f5)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, LIST, <StudentAssessments />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Assessments' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Assessments for the experiments you have',
    );
    const empty = await screen.findByRole('heading', { level: 2, name: 'No assessments yet' });
    expect(empty.closest('.xr-section > .xr-empty')).toHaveTextContent(
      'When your faculty sets an assessment for an experiment you have, it appears here.',
    );
    expect(screen.queryByRole('group', { name: 'Show' })).toBeNull();
    expect(within(main()).queryAllByRole('link')).toEqual([]);
    expect(topTitle()?.textContent).toBe('Assessments');
    expect(crumbs()).toEqual([['Assessments', null]]);
    expect(
      screen.getByRole('navigation', { name: /Student/ }).querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', LIST);
  });

  it('to do (D1): the row, its line, "To do" and "Open" to Before you start (f0)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Your assessments' })).toBeVisible(),
    );
    expect(tabs()).toEqual([
      ['To do (1)', 'true'],
      ['Submitted (0)', 'false'],
      ['Results (0)', 'false'],
    ]);
    expect(rows()).toEqual([
      [
        NAME,
        `${SHELL_NAME} · ${CODE}`,
        'Due 14 Nov 2026, 23:59 · 4 questions · no time limit',
        'To do',
        'Open',
        `${LIST}/${id}`,
        `Open ${NAME}`,
      ],
    ]);
    const row = main().querySelector('li.xr-row')!;
    expect(row.querySelector('.xr-row-icon')).not.toBeNull();
    expect(row.querySelector('.xw-actions .xr-status')).toHaveClass('xr-status--info');
    expect(within(row as HTMLElement).getByRole('link')).toHaveClass(
      'xr-btn',
      'xr-btn--secondary',
      'xr-btn--sm',
    );
    // No primary action on the list: each row has one secondary action.
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(0);
  });

  it('the state tabs switch the list in place and keep the tab in the address (`?tab=`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await created(sample);
    const navigation = inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() => expect(rows()).toHaveLength(1));
    await user.click(screen.getByRole('button', { name: 'Submitted (0)' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?tab=submitted`);
    expect(tabs()[1]).toEqual(['Submitted (0)', 'true']);
    const section = screen.getByRole('region', { name: 'Your assessments' });
    expect(section.querySelector('ul.xr-rows')).toBeNull();
    expect(section.querySelector('.xr-section-body p.xr-body')).toHaveTextContent(
      'Nothing submitted and waiting.',
    );
    await user.click(screen.getByRole('button', { name: 'Results (0)' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?tab=results`);
    expect(section).toHaveTextContent('No results released yet.');
    await user.click(screen.getByRole('button', { name: 'To do (1)' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(LIST);
    expect(rows()).toHaveLength(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('an address with another tab shows To do and is normalised; `?tab=results` opens Results', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await created(sample);
    const odd = inStudent(runtime, LIST, <StudentAssessments />, '?tab=everything');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(tabs()[0]).toEqual(['To do (1)', 'true']);
    expect(odd.replace).toHaveBeenCalledWith(LIST);
  });

  it('attempt in progress (D2 started): "Answers saved · due …", "Continue attempt" to the attempt (f1)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, LIST, <StudentAssessments />);
    await waitFor(() => expect(rows()[0]?.[3]).toBe('To do'));
    // Rahul starts in another tab of the same world: this list follows the receipt.
    const attempt = await asPersonId(sample, RAHUL).assessments.startAttempt(id);
    if (!attempt.ok) throw new Error('start refused');
    await act(async () => {
      await runtime.invalidate(attempt.changed);
    });
    await waitFor(() => expect(rows()[0]?.[3]).toBe('Attempt in progress'));
    expect(tabs()[0]).toEqual(['To do (1)', 'true']);
    expect(rows()).toEqual([
      [
        NAME,
        `${SHELL_NAME} · ${CODE}`,
        'Answers saved · due 14 Nov 2026, 23:59',
        'Attempt in progress',
        'Continue attempt',
        `${LIST}/${id}/attempt`,
        `Continue attempt ${NAME}`,
      ],
    ]);
    expect(main().querySelector('.xr-status')).toHaveClass('xr-status--wait');
  });

  it('waiting for marking (D2 submitted): the Submitted tab, "View" the result page, no score (f2)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await submitted(sample, id);
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=submitted');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(tabs()).toEqual([
      ['To do (0)', 'false'],
      ['Submitted (1)', 'true'],
      ['Results (0)', 'false'],
    ]);
    expect(rows()).toEqual([
      [
        NAME,
        `${SHELL_NAME} · ${CODE}`,
        'Submitted 5 Nov 2026, 18:52 · your faculty marks written answers',
        'Waiting for marking',
        'View',
        `${LIST}/${id}/result`,
        `View ${NAME}`,
      ],
    ]);
    expect(main()).not.toHaveTextContent(/of 16|Passed|Not passed|score/i);
  });

  it('result not released yet (D3 confirmed, before the deadline): the release terms (f3)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await confirmed(sample, await submitted(sample, id));
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=submitted');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0]).toEqual([
      NAME,
      `${SHELL_NAME} · ${CODE}`,
      'Released after the deadline: 14 Nov 2026, 23:59',
      'Result not released yet',
      'View',
      `${LIST}/${id}/result`,
      `View ${NAME}`,
    ]);
    expect(main().querySelector('.xr-status')).toHaveClass('xr-status--off');
    // Marks confirmed, still nothing of the result before the release (ATT-15).
    expect(main()).not.toHaveTextContent(/11|of 16|Passed|Not passed/);
  });

  it('result ready (after Flow D): the Results tab, "Released …", "See result" (f4)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, LIST, <StudentAssessments />, '?tab=results');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(tabs()).toEqual([
      ['To do (0)', 'false'],
      ['Submitted (0)', 'false'],
      ['Results (1)', 'true'],
    ]);
    expect(rows()).toEqual([
      [
        NAME,
        `${SHELL_NAME} · ${CODE}`,
        'Released 14 Nov 2026, 23:59',
        'Result ready',
        'See result',
        `${LIST}/ASMT-0009/result`,
        `See result ${NAME}`,
      ],
    ]);
    expect(main().querySelector('.xr-status')).toHaveClass('xr-status--ok');
    // The list never carries the figures: they are the result page's.
    expect(main()).not.toHaveTextContent(/11 of 16|Passed/);
  });

  it('failed says so and "Try again" reads again (ST-11.failed)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listMyAssessments');
    inStudent(runtime, LIST, <StudentAssessments />);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load your assessments' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('group', { name: 'Show' })).toBeVisible());
  });
});

// ---- the hub's Assessment tab ----------------------------------------------------------------------

describe('the hub’s Assessment tab (B4-11 f7 … f9)', () => {
  function strip() {
    return within(screen.getByRole('navigation', { name: SHELL_NAME }))
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('aria-current') === 'page']);
  }

  it('none set yet: the hub, the strip with Assessment current, the empty state (f8)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    expect(strip()).toEqual([
      ['Overview', false],
      ['Resources', false],
      ['Simulation', false],
      ['Assessment', true],
      ['Progress', false],
    ]);
    const empty = await screen.findByRole('heading', {
      level: 2,
      name: 'Your faculty hasn’t set an assessment for this experiment yet',
    });
    expect(empty.closest('.xr-section > .xr-empty')).toHaveTextContent(
      'When they do, it appears here and in Assessments.',
    );
    expect(main().querySelector('.xw-hubhead')).toHaveClass('xl-hubhead');
    await waitFor(() => expect(topTitle()?.textContent).toBe('Assessment'));
    expect(crumbs()).toEqual([
      ['My courses', '/student/courses'],
      [CODE, '/student/courses/thermodynamics-heat-transfer'],
      [SHELL_NAME, HUB],
      ['Assessment', null],
    ]);
  });

  it('to do: the row with 16 marks, "To do" and the primary "Open assessment" (f7)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Assessment' });
    const row = section.querySelector<HTMLElement>('ul.xr-rows > li.xr-row')!;
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(NAME);
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      'Due 14 Nov 2026, 23:59 · 4 questions · 16 marks · no time limit',
    );
    expect(row.querySelector('.xr-status')).toHaveTextContent('To do');
    const open = within(row).getByRole('link', { name: 'Open assessment' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(open).not.toHaveClass('xr-btn--sm');
    expect(open).toHaveAttribute('href', `${LIST}/${id}`);
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
  });

  it('waiting for marking: "your result appears after the deadline" and "View" (f9)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    await submitted(sample, id);
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Assessment' });
    const row = section.querySelector<HTMLElement>('li.xr-row')!;
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      'Submitted 5 Nov 2026, 18:52 · your result appears after the deadline',
    );
    expect(row.querySelector('.xr-status')).toHaveTextContent('Waiting for marking');
    const view = within(row).getByRole('link', { name: 'View' });
    expect(view).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(view).toHaveAttribute('href', `${LIST}/${id}/result`);
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(0);
  });

  it('result ready (after Flow D): ST-11’s status, line and "See result" (ST-05.assessment-tab.states)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, TAB, <HubAssessmentTab experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Assessment' });
    const row = section.querySelector<HTMLElement>('li.xr-row')!;
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent('Released 14 Nov 2026, 23:59');
    expect(row.querySelector('.xr-status')).toHaveTextContent('Result ready');
    expect(within(row).getByRole('link', { name: 'See result' })).toHaveAttribute(
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
    expect(screen.queryByRole('region', { name: 'Assessment' })).toBeNull();
  });
});

// ---- Home's Up next ------------------------------------------------------------------------------

describe('Home · Up next · the assessment (B4-11 f10)', () => {
  it('names the assessment, its experiment and deadline; "Open assessment" opens Before you start', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    const id = await created(sample);
    inStudent(runtime, '/student', <StudentHome />);
    const upNext = await screen.findByRole('region', { name: 'Up next' });
    await waitFor(() => expect(upNext).toHaveTextContent('Heat Exchanger — post-lab is ready'));
    const row = within(upNext)
      .getByText('Heat Exchanger — post-lab is ready')
      .closest<HTMLElement>('li.xr-row')!;
    expect(row.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--info');
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      `${SHELL_NAME} · assessment · due 14 Nov 2026, 23:59`,
    );
    const open = within(row).getByRole('link', { name: 'Open assessment' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', `${LIST}/${id}`);
  });

  it('lists the assessment only while it is to do (after Flow D: none)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-d');
    inStudent(runtime, '/student', <StudentHome />);
    const upNext = await screen.findByRole('region', { name: 'Up next' });
    expect(within(upNext).queryByRole('link', { name: 'Open assessment' })).toBeNull();
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
