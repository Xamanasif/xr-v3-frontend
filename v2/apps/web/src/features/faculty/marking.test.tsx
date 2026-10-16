/**
 * FA-18 Marking queue and FA-19 Mark a submission (board B4-09 f0 … f5, f7, f8) on the real
 * composition root and the sample world. After Flow C, Dr S. Ranganathan creates “Heat Exchanger —
 * post-lab” (the walk’s D1, through the assessments port), Meera Iyer gives Priya Natarajan the
 * experiment, and Rahul Verma and Priya submit (the stand-in marks their choice questions on
 * submit, P4-01) — the board’s two waiting answers, at the board’s times. The one world moves the
 * pages: a mark saved and confirmed through FA-19 leaves the queue’s Waiting list; after Flow D the
 * confirmed, released attempt reads as B4-09’s script words it. The service’s drawn validation
 * words; the undrawn loading, failed, not-found and provisional (policy-open) states.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { AssessmentId, AttemptId, ExperimentId, IsoInstant, PersonId } from '@xr/domain';
import { asPersonId, faults, standinsOf, worldOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
import { filtersOf, MarkingQueue, nextToMark } from './fa-18-marking/marking-queue';
import { blockedOf, MarkSubmission, markingView } from './fa-19-mark-submission/mark-submission';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const MEERA = 'per-0001';
const RAHUL = 'per-0002';
const PRIYA = 'per-0003';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const POST_LAB = 'Heat Exchanger — post-lab';
const COURSE = 'thermodynamics-heat-transfer';

/** B4-09’s sample times, in Indian time. */
const RAHUL_SUBMITS = '2026-11-05T13:22:00.000Z'; // 5 Nov 2026, 18:52
const PRIYA_SUBMITS = '2026-11-06T14:40:00.000Z'; // 6 Nov 2026, 20:10
const MARKING_TIME = '2026-11-07T04:45:00.000Z'; // 7 Nov 2026, 10:15

const RAHUL_WRITTEN =
  'In the WEB run I turned the fouling up and kept both flow rates the same. The hot fluid left hotter than before and the cold fluid left cooler, so less heat was passed across. Fouling is an extra layer of resistance, so U goes down and the effectiveness goes down with it. That is why exchangers are cleaned, or designed with extra area.';
const PRIYA_WRITTEN =
  'Fouling builds up on the tubes and acts like insulation. The overall coefficient U drops, so for the same flows the exchanger transfers less heat and both outlet temperatures change less.';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/** D1: “Heat Exchanger — post-lab” of Q-0101, Q-0102, Q-0104 and Q-0106 (written), as the walk. */
async function createPostLab(sample: Sample): Promise<AssessmentId> {
  const created = ok(
    await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL as ExperimentId,
      name: POST_LAB,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'] as never,
    }),
  );
  return created.id;
}

/** Meera gives Priya Shell-and-Tube (IA-05), so she can submit too. */
async function givePriyaAccess(sample: Sample) {
  const plan = worldOf(sample).records.plans['ACC-0107'] as { readonly rev: number };
  ok(
    await asPersonId(sample, MEERA).studentAccess.giveAccess({
      experimentIds: [SHELL as ExperimentId],
      target: { kind: 'student', studentId: PRIYA as PersonId },
      expectedPlanRev: plan.rev,
    }),
  );
}

/** A Student starts, answers (Q1 A, Q2 B, Q3 true: 4 of 6 by the key) and submits. */
async function submit(
  sample: Sample,
  student: string,
  assessmentId: AssessmentId,
  written: string,
): Promise<string> {
  const ports = asPersonId(sample, student);
  let attempt = ok(await ports.assessments.startAttempt(assessmentId));
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice' as const, choice: 'A' as const }],
    ['Q-0102', { type: 'multiple-choice' as const, choice: 'B' as const }],
    ['Q-0104', { type: 'true-false' as const, value: true }],
    ['Q-0106', { type: 'written' as const, text: written }],
  ] as const) {
    attempt = ok(
      await ports.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId: questionId as never,
        answer,
        expectedRev: attempt.rev,
      }),
    );
  }
  ok(await ports.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }));
  return attempt.id;
}

/** B4-09’s world: two written answers waiting, Rahul’s the oldest (f0). */
async function twoWaiting(submissions: 0 | 1 | 2 = 2) {
  const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
  const assessmentId = await createPostLab(sample);
  await givePriyaAccess(sample);
  const ids: string[] = [];
  if (submissions >= 1) {
    moveClock(sample, RAHUL_SUBMITS);
    ids.push(await submit(sample, RAHUL, assessmentId, RAHUL_WRITTEN));
  }
  if (submissions >= 2) {
    moveClock(sample, PRIYA_SUBMITS);
    ids.push(await submit(sample, PRIYA, assessmentId, PRIYA_WRITTEN));
  }
  moveClock(sample, MARKING_TIME);
  return { runtime, sample, assessmentId, rahul: ids[0]!, priya: ids[1]! };
}

/** He marks and confirms through the ports, as FA-19 would. */
async function markAndConfirm(runtime: PlatformRuntime, sample: Sample, attemptId: string) {
  const faculty = asPersonId(sample, RANGANATHAN);
  await act(async () => {
    const view = ok(await faculty.marking.getAttemptForMarking(attemptId as AttemptId));
    const saved = ok(
      await faculty.marking.saveMark({
        attemptId: view.attempt.id,
        questionId: 'Q-0106' as never,
        mark: '7',
        feedback: null,
        expectedRev: view.attempt.rev,
      }),
    );
    const confirmed = await faculty.marking.confirmMarks({
      attemptId: view.attempt.id,
      expectedRev: saved.rev,
    });
    ok(confirmed);
    if (confirmed.ok) await runtime.invalidate(confirmed.changed);
  });
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showQueue(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation('/faculty/marking', search);
  const view = renderInTab(inShell(<MarkingQueue />), { runtime, navigation });
  return { navigation, view };
}

function showMark(runtime: PlatformRuntime, attemptId: string) {
  const navigation = testNavigation(`/faculty/marking/${attemptId}`);
  const view = renderInTab(inShell(<MarkSubmission attemptId={attemptId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const queueHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Marking' }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const count = () => text(main().querySelector('.xr-phead-meta [role="status"]'));

async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

// ---- FA-18 ------------------------------------------------------------------------------------

describe('FA-18 Marking queue — two answers waiting (B4-09 f0)', () => {
  it('the header with the count and “Mark next”, the toolbar, the table oldest first', async () => {
    const { runtime, rahul, priya, assessmentId } = await twoWaiting();
    // The world’s ids: ASMT-0009 and ATT-0450 as the walk reserves them; Priya’s attempt takes the
    // next free id (the board’s ATT-0451 is reserved in the walk).
    expect(assessmentId).toBe('ASMT-0009');
    expect(rahul).toBe('ATT-0450');
    expect(priya).toMatch(/^ATT-\d{4}$/);
    showQueue(runtime);
    await queueHeading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await waitFor(() => expect(count()).toBe('2 written answers waiting'));
    const next = screen.getByRole('link', { name: 'Mark next' });
    expect(next).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(next).toHaveAttribute('href', '/faculty/marking/ATT-0450');
    // The shell: Marking current with its count (the same read), the top bar “Marking”.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Marking');
    const sidebar = screen.getByRole('navigation', { name: 'Faculty navigation' });
    const current = sidebar.querySelector('[aria-current="page"]')!;
    expect(current).toHaveAttribute('href', '/faculty/marking');
    await waitFor(() => expect(current).toHaveTextContent('2, 2 written answers to mark'));

    const section = screen.getByRole('region', { name: 'Written answers' });
    const assessment = within(section).getByRole('combobox', { name: 'Assessment' });
    await waitFor(() =>
      expect(
        within(assessment)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['All assessments', `${POST_LAB} · ${SHELL_NAME}`]),
    );
    expect(assessment).toHaveValue('all');
    const show = within(section).getByRole('group', { name: 'Show' });
    expect(show).toHaveClass('xr-seg');
    expect(
      within(show)
        .getAllByRole('button')
        .map((button) => [button.textContent, button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['Waiting', 'true'],
      ['Marked', 'false'],
      ['All', 'false'],
    ]);

    const found = await table();
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Student',
      'Assessment',
      'Submitted (oldest first)',
      'Status',
      'Action',
    ]);
    expect(found.querySelector('th:last-child .xr-sr')).toHaveTextContent('Action');
    expect(await rows()).toEqual([
      [
        'Rahul VermaATT-0450',
        `${POST_LAB}Question 4 · written answer`,
        '5 Nov 2026, 18:52',
        'Waiting for marking',
        'Mark',
      ],
      [
        `Priya Natarajan${priya}`,
        `${POST_LAB}Question 4 · written answer`,
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        'Mark',
      ],
    ]);
    const first = found.querySelector('tbody tr')!;
    expect(first.querySelector('td strong')).toHaveTextContent('Rahul Verma');
    expect(first.querySelector('td .xr-meta')).toHaveTextContent('ATT-0450');
    expect(first.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    const mark = within(first as HTMLElement).getByRole('link', { name: 'Mark Rahul Verma' });
    expect(mark).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(mark).toHaveAttribute('href', '/faculty/marking/ATT-0450');
  });

  it('Marked, All and an assessment: the list follows, the address mirrors the filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await twoWaiting();
    const { navigation } = showQueue(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Marked' }));
    // Nothing is marked yet: answers exist, so the filter matches nothing (B4-09 `noMatch`).
    expect(await screen.findByText('Nothing matches these filters.')).toBeVisible();
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?state=marked');
    expect(count()).toBe('2 written answers waiting');
    await user.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?state=all');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Assessment' }), 'ASMT-0009');
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/faculty/marking?assessmentId=ASMT-0009&state=all',
    );
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    await user.click(screen.getByRole('button', { name: 'Waiting' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?assessmentId=ASMT-0009');
  });

  it('reads its filters from the address', async () => {
    const { runtime } = await twoWaiting();
    showQueue(runtime, '?assessmentId=ASMT-0009&state=all');
    await table();
    expect(screen.getByRole('combobox', { name: 'Assessment' })).toHaveValue('ASMT-0009');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(filtersOf('?state=nonsense')).toEqual({ assessmentId: null, state: 'waiting' });
  });
});

describe('FA-18 — after marking Rahul, and nothing waiting (B4-09 f4, f5)', () => {
  it('f4: Priya waits alone; under All, Rahul is Marked with View', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    await markAndConfirm(runtime, sample, rahul);
    showQueue(runtime);
    await table();
    expect(count()).toBe('1 written answer waiting');
    expect((await rows()).map((cells) => cells[0])).toEqual([`Priya Natarajan${priya}`]);
    expect(screen.getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    await user.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    const marked = (await table()).querySelector('tbody tr')!;
    expect(marked.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expect(marked.querySelector('.xr-status')).toHaveTextContent('Marked');
    expect(
      within(marked as HTMLElement).getByRole('link', { name: 'View marks for Rahul Verma' }),
    ).toHaveTextContent('View');
    await user.click(screen.getByRole('button', { name: 'Marked' }));
    await waitFor(async () =>
      expect((await rows()).map((cells) => cells[0])).toEqual(['Rahul VermaATT-0450']),
    );
  });

  it('f5: nothing submitted yet — “Nothing is waiting for you”, no Mark next', async () => {
    const { runtime } = await twoWaiting(0);
    showQueue(runtime);
    const title = await screen.findByRole('heading', {
      level: 3,
      name: 'Nothing is waiting for you',
    });
    expect(count()).toBe('0 written answers waiting');
    const empty = title.closest('.xr-empty')!;
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(empty).toHaveTextContent(
      'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
    );
    expect(screen.queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(main().querySelector('.xr-phead-actions')).toBeNull();
    // The toolbar stays (f5).
    expect(screen.getByRole('combobox', { name: 'Assessment' })).toBeVisible();
  });

  it('f5 again once every answer is confirmed; Marked shows them', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    await markAndConfirm(runtime, sample, rahul);
    await markAndConfirm(runtime, sample, priya);
    showQueue(runtime);
    expect(await screen.findByText('Nothing is waiting for you')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Marked' }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
  });

  it('“Mark next” opens the oldest of the assessment chosen, else of the whole queue', () => {
    const row = (id: string, assessmentId: string) =>
      ({ attempt: { id, assessmentId } }) as unknown as Parameters<typeof nextToMark>[0][number];
    const waiting = [row('ATT-1', 'ASMT-A'), row('ATT-2', 'ASMT-B')];
    expect(nextToMark(waiting, null)?.attempt.id).toBe('ATT-1');
    expect(nextToMark(waiting, 'ASMT-B')?.attempt.id).toBe('ATT-2');
    expect(nextToMark(waiting, 'ASMT-C')?.attempt.id).toBe('ATT-1');
    expect(nextToMark([], null)).toBeNull();
  });
});

describe('FA-18 — loading and failed (undrawn; state-copy FA-18.loading, FA-18.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await twoWaiting();
    faults(sample).failNext('MarkingService.listQueue');
    renderInTab(<MarkingQueue />, { runtime, navigation: testNavigation('/faculty/marking') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the written answers',
    );
    const failed = await screen.findByRole('heading', {
      level: 3,
      name: 'We couldn’t load the written answers',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await rows()).toHaveLength(2);
  });
});

// ---- FA-19 ------------------------------------------------------------------------------------

const markField = () => screen.getByRole('textbox', { name: 'Mark for question 4' });
const feedbackField = () => screen.getByRole('textbox', { name: /^Feedback for Rahul/ });
const panel = () => screen.getByRole('complementary', { name: 'Your mark' });
const markHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Rahul Verma' }, { timeout: 5000 });

describe('FA-19 Mark a submission — as drawn (B4-09 f1)', () => {
  it('the header, the question, the answer, the guidance, the automatic marks and the panel', async () => {
    const { runtime, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/faculty/marking');
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Marking');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(`${POST_LAB} · ${SHELL_NAME}`);
    expect(main().querySelector('.xr-phead-meta .xr-id')).toHaveTextContent('ATT-0450');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Submitted 5 Nov 2026, 18:52 · attempt 1 of 2',
    );
    // The shell: Marking current; the crumbs “Marking / Rahul Verma”; the top bar “Mark a submission”.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Mark a submission');
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect(within(crumbs).getByRole('link', { name: 'Marking' })).toHaveAttribute(
      'href',
      '/faculty/marking',
    );
    expect(crumbs).toHaveTextContent('Rahul Verma');
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/marking');

    // ~72 / 28: the content stack beside the decision panel.
    const decide = main().querySelector('.xr-decide')!;
    expect(decide.firstElementChild).toHaveClass('xw-stack');
    expect(decide.lastElementChild).toHaveClass('xr-dpanel');

    const question = screen.getByRole('region', { name: 'Question 4 · Written answer' });
    expect(question.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('10 marks');
    expect(question.querySelector('p.xa-q-text')).toHaveTextContent(
      'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.',
    );
    const answer = screen.getByRole('region', { name: 'Rahul Verma’s answer' });
    expect(answer.querySelector('blockquote.xa-answer')).toHaveTextContent(RAHUL_WRITTEN);
    const guidance = main().querySelector('details.xa-guide')!;
    expect(guidance).toHaveAttribute('open');
    expect(guidance.querySelector('summary')).toHaveTextContent('Marking guidance');
    expect(guidance.querySelector('.xa-guide-body')?.textContent).toMatch(/^Look for: /);

    const automatic = screen.getByRole('region', { name: 'Marked automatically' });
    expect(automatic.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('4 of 6 marks');
    expect(
      [...automatic.querySelectorAll('ul.xa-counts > li')].map((row) => [
        text(row.firstElementChild),
        text(row.querySelector('.xa-mk')),
        row.querySelector('.xa-mk')?.classList.contains('is-ok') ? 'ok' : 'no',
      ]),
    ).toEqual([
      ['Question 1', '2 of 2', 'ok'],
      ['Question 2', '0 of 2', 'no'],
      ['Question 3', '2 of 2', 'ok'],
    ]);

    expect(within(panel()).getByRole('heading', { level: 2 })).toHaveTextContent('Your mark');
    expect(markField()).toHaveValue('');
    expect(markField()).toHaveAttribute('inputmode', 'numeric');
    expect(markField()).toHaveAccessibleDescription('Out of 10, as a whole number.');
    expect(panel().querySelector('label[for="ms-fb"]')).toHaveTextContent(
      'Feedback for Rahul (optional)',
    );
    expect(within(panel()).getByRole('button', { name: 'Confirm marks' })).toHaveClass(
      'xr-btn--primary',
      'xr-btn--block',
    );
    expect(within(panel()).getByRole('button', { name: 'Save mark' })).toHaveClass(
      'xr-btn--secondary',
      'xr-btn--block',
    );
    expect(panel()).toHaveTextContent('Confirmed marks can’t be changed.');
    expect(panel()).not.toHaveTextContent('Mark saved');
  });
});

describe('FA-19 — the service’s checks (B4-09 f3)', () => {
  it('12 is out of range: the drawn words under the field, which takes focus; nothing saved', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '12');
    await user.click(screen.getByRole('button', { name: 'Save mark' }));
    const error = await screen.findByText('Enter a whole number from 0 to 10');
    expect(error.closest('.xr-error')).not.toBeNull();
    expect(markField()).toHaveAttribute('aria-invalid', 'true');
    expect(markField()).toHaveAccessibleDescription(
      'Out of 10, as a whole number. Enter a whole number from 0 to 10',
    );
    await waitFor(() => expect(markField()).toHaveFocus());
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.written).toEqual([]);
    // Typing clears the error.
    await user.type(markField(), '{Backspace}');
    expect(screen.queryByText('Enter a whole number from 0 to 10')).toBeNull();
  });

  it('blank, Confirm marks: “Enter a mark for question 4” and no dialog', async () => {
    const user = userEvent.setup();
    const { runtime, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    expect(await screen.findByText('Enter a mark for question 4')).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(markField()).toHaveFocus());
  });
});

describe('FA-19 — save, confirm, read-only (B4-09 f1 → f2)', () => {
  it('Save mark: “Mark saved — not confirmed yet”; a change hides it; the Student sees nothing', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    await user.type(feedbackField(), 'Good use of your own readings.');
    await user.click(screen.getByRole('button', { name: 'Save mark' }));
    const saved = await within(panel()).findByRole('status');
    await waitFor(() => expect(saved).toHaveTextContent('Mark saved — not confirmed yet'));
    expect(panel().querySelector('p.xa-save.is-ok')).not.toBeNull();
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.written).toEqual([
      expect.objectContaining({ mark: 7, feedback: 'Good use of your own readings.' }),
    ]);
    expect(view.attempt.marking.confirmed).toBeNull();
    const result = ok(await asPersonId(sample, RAHUL).assessments.getResult(rahul as AttemptId));
    expect(result.result.kind).toBe('waiting-for-marking');
    await user.type(markField(), '{Backspace}8');
    expect(panel()).not.toHaveTextContent('Mark saved');
  });

  it('Confirm marks: DL-1, then the read-only panel with the release line and Next submission', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    await user.type(feedbackField(), 'Good use of your own readings and the right cause.');
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    expect(
      [...dialog.querySelectorAll('.xr-dialog-body p')].map((line) => line.textContent),
    ).toEqual([
      'Question 4: 7 of 10.',
      'Confirmed marks can’t be changed. Rahul sees the result when it’s released — after the deadline, 14 Nov 2026, 23:59.',
    ]);
    expect(dialog.querySelector('strong')).toHaveTextContent('7 of 10');
    // The typed mark is saved before DL-1 opens (state-copy FA-19.confirm-saves-first).
    expect(
      ok(await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId))
        .attempt.marking.written[0]?.mark,
    ).toBe(7);
    const go = within(dialog).getByRole('button', { name: 'Confirm marks' });
    await waitFor(() => expect(go).toHaveFocus());
    await user.click(go);

    const done = await waitFor(() => {
      const element = document.getElementById('ms-mdone');
      if (!element) throw new Error('not confirmed yet');
      return element;
    });
    await waitFor(() => expect(done).toHaveFocus());
    expect(done.querySelector('.xr-status--ok')).toHaveTextContent('Marks confirmed');
    expect(done).toHaveTextContent('7 Nov 2026, 10:15 · Dr S. Ranganathan');
    const kv = done.querySelector('dl.xl-kv')!;
    expect([...kv.querySelectorAll('dt')].map((cell) => text(cell))).toEqual(['Mark', 'Feedback']);
    expect([...kv.querySelectorAll('dd')].map((cell) => text(cell))).toEqual([
      '7 of 10',
      'Good use of your own readings and the right cause.',
    ]);
    expect(done).toHaveTextContent(
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await waitFor(() =>
      expect(within(done).getByRole('link', { name: 'Next submission' })).toHaveAttribute(
        'href',
        `/faculty/marking/${priya}`,
      ),
    );
    expect(screen.queryByRole('textbox', { name: 'Mark for question 4' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save mark' })).toBeNull();
    // The service holds it: confirmed by him, and Rahul still sees no score (after the deadline).
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed).toMatchObject({ at: expect.any(String) });
    const result = ok(await asPersonId(sample, RAHUL).assessments.getResult(rahul as AttemptId));
    expect(result.result.kind).toBe('not-released-yet');
  });

  it('Cancel in DL-1 confirms nothing; the mark stays saved', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '6');
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(panel()).toHaveTextContent('Mark saved — not confirmed yet');
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed).toBeNull();
  });

  it('a mark saved earlier fills the form with its note (state-copy FA-19.saved-on-open)', async () => {
    const { runtime, sample, rahul } = await twoWaiting();
    const faculty = asPersonId(sample, RANGANATHAN);
    const view = ok(await faculty.marking.getAttemptForMarking(rahul as AttemptId));
    ok(
      await faculty.marking.saveMark({
        attemptId: view.attempt.id,
        questionId: 'Q-0106' as never,
        mark: '5',
        feedback: 'Saved before.',
        expectedRev: view.attempt.rev,
      }),
    );
    showMark(runtime, rahul);
    await markHeading();
    expect(markField()).toHaveValue('5');
    expect(feedbackField()).toHaveValue('Saved before.');
    expect(panel()).toHaveTextContent('Mark saved — not confirmed yet');
  });
});

describe('FA-19 — after Flow D: confirmed and released (B4-09 script relLine)', () => {
  it('reads only; released after the deadline; Next submission opens the queue', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMark(runtime, 'ATT-0450');
    await markHeading();
    const done = document.getElementById('ms-mdone')!;
    expect(done).toHaveTextContent('Marks confirmed');
    expect(done).toHaveTextContent('7 Nov 2026, 10:15 · Dr S. Ranganathan');
    expect(done.querySelector('dl')).toHaveTextContent('Mark7 of 10');
    await waitFor(() =>
      expect(done).toHaveTextContent(
        'Released to Rahul on 14 Nov 2026, 23:59 — when the deadline passed.',
      ),
    );
    await waitFor(() =>
      expect(within(done).getByRole('link', { name: 'Next submission' })).toHaveAttribute(
        'href',
        '/faculty/marking',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Confirm marks' })).toBeNull();
  });
});

describe('FA-19 — refusals, policy-open, not found, loading and failed', () => {
  function answerConfirmWith(runtime: PlatformRuntime, error: ServiceError): void {
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        marking: { ...ports.marking, confirmMarks: async () => ({ ok: false as const, error }) },
      } as typeof ports;
    });
  }

  it.each([
    ['ATT-07', 'These marks can’t be confirmed yet'],
    ['ATT-17', 'Several written answers can’t be marked here yet'],
    ['M22-no-written-questions', 'There’s no written answer to mark'],
    ['OD-B4-17', 'This submission isn’t available to you yet'],
  ])(
    'confirm answered policy-open %s: a calm state in the panel, no form',
    async (decision, title) => {
      const user = userEvent.setup();
      const { runtime, rahul } = await twoWaiting();
      answerConfirmWith(runtime, { kind: 'policy-open', decision });
      showMark(runtime, rahul);
      await markHeading();
      await user.type(markField(), '7');
      await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Confirm marks' }));
      await waitFor(() => expect(panel()).toHaveTextContent(title));
      expect(screen.queryByRole('textbox', { name: 'Mark for question 4' })).toBeNull();
      expect(panel().textContent).not.toMatch(/\b(?:OD|ATT|M)-?\d/);
    },
  );

  it('confirm refused as stale: the submission is read again and the panel says so', async () => {
    const user = userEvent.setup();
    const { runtime, rahul } = await twoWaiting();
    answerConfirmWith(runtime, { kind: 'stale-version', currentRev: 99 });
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Confirm marks',
      }),
    );
    expect(
      await within(panel()).findByText('This submission changed since you opened it'),
    ).toBeVisible();
    expect(markField()).toHaveValue('7');
  });

  it('a colleague’s assessment is not available yet (OD-B4-17): no answer, no form', async () => {
    // Dr Anita Desai’s tab: Meera assigns her ME ZG523 too; Dr Ranganathan set the assessment.
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    ok(
      await asPersonId(sample, MEERA).facultyCourses.assign({
        facultyId: DESAI as PersonId,
        courseId: COURSE as never,
      }),
    );
    const assessmentId = await createPostLab(sample);
    const attemptId = await submit(sample, RAHUL, assessmentId, RAHUL_WRITTEN);
    showMark(runtime, attemptId);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'This submission isn’t available to you yet',
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mark a submission');
    expect(title.closest('.xr-empty')).toHaveTextContent(
      'A colleague set this assessment. Whether you can mark answers to a colleague’s assessment hasn’t been decided yet.',
    );
    expect(main()).not.toHaveTextContent('Rahul');
    expect(screen.queryByRole('textbox')).toBeNull();
    // Nor is it in her queue.
    const queue = ok(await asPersonId(sample, DESAI).marking.listQueue({ state: 'all' }));
    expect(queue).toEqual([]);
  });

  it('an unknown attempt is the in-shell not-found page', async () => {
    const { runtime } = await twoWaiting();
    showMark(runtime, 'ATT-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    faults(sample).failNext('MarkingService.getAttemptForMarking');
    renderInTab(<MarkSubmission attemptId={rahul} />, {
      runtime,
      navigation: testNavigation(`/faculty/marking/${rahul}`),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the submission',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mark a submission');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load this submission' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await markHeading()).toBeVisible();
  });

  it('the provisional states the read itself shows (markingView) and the decisions they map', () => {
    const base = {
      attempt: { marking: { automatic: [{ questionId: 'Q-1', awarded: 2, outOf: 2 }] } },
      numbering: [
        { questionId: 'Q-1', number: 1, type: 'multiple-choice', marks: 2 },
        { questionId: 'Q-2', number: 2, type: 'written', marks: 10 },
      ],
    };
    const view = (answer: unknown) => markingView(answer as Parameters<typeof markingView>[0]);
    expect(view(base).blocked).toBeNull();
    expect(
      view({ ...base, numbering: [...base.numbering, { ...base.numbering[1], questionId: 'Q-3' }] })
        .blocked,
    ).toBe('several');
    expect(view({ ...base, numbering: [base.numbering[0]] }).blocked).toBe('none');
    expect(view({ ...base, attempt: { marking: { automatic: [] } } }).blocked).toBe('choice');
    expect(blockedOf('ATT-07')).toBe('choice');
    expect(blockedOf('ATT-17')).toBe('several');
    expect(blockedOf('M22-no-written-questions')).toBe('none');
    expect(blockedOf('OD-B4-17')).toBe('colleague');
  });
});
