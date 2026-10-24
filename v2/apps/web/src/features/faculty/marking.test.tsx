/**
 * FA-18 Marking queue and FA-19 Mark a submission as the owner-approved Faculty export draws them
 * (V3 Refined B, FA-v1 `Main.dc.html` FA-18, FA-19 and the Confirm marks dialog), on the real
 * composition root and the sample world. After Flow C, Dr S. Ranganathan creates “Heat Exchanger —
 * post-lab” (the walk’s D1, through the assessments port), Meera Iyer gives Priya Natarajan the
 * experiment, and Rahul Verma and Priya submit (the stand-in marks their choice questions on
 * submit, P4-01) — two written answers waiting, at the walk’s times. The one world moves the
 * pages: a mark saved and confirmed through FA-19 leaves the queue’s Waiting list; after Flow D the
 * confirmed, released attempt reads as the export words it. The service’s validation words; the
 * undrawn loading, failed, not-found and provisional (policy-open) states; no attempt or
 * assessment named by its internal reference anywhere (the owner’s identifier rule).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fieldError, type ServiceError, validationFailed } from '@xr/contracts/draft';
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
import { calendarDaysSince } from './fa-18-marking/queue-days';
import { passMarkOf, wholeMarkOf } from './fa-19-mark-submission/mark-facts';
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

/** The walk’s sample times, in Indian time. */
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

/** Two written answers waiting, Rahul’s the oldest. */
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

/** He saves a mark through the port, as FA-19 would (not confirmed). */
async function saveOnly(
  sample: Sample,
  attemptId: string,
  mark = '5',
  feedback: string | null = null,
) {
  const faculty = asPersonId(sample, RANGANATHAN);
  const view = ok(await faculty.marking.getAttemptForMarking(attemptId as AttemptId));
  ok(
    await faculty.marking.saveMark({
      attemptId: view.attempt.id,
      questionId: 'Q-0106' as never,
      mark,
      feedback,
      expectedRev: view.attempt.rev,
    }),
  );
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
/** An element's words, its text nodes joined by spaces (cells and lines read as words). */
const words = (element: Element | null) => {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    parts.push(node.textContent ?? '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};
const queueHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Marking' }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const count = () => text(main().querySelector('.fa-mqcount [role="status"]'));
const sidebarCurrent = () =>
  screen
    .getByRole('navigation', { name: 'Faculty navigation' })
    .querySelector('[aria-current="page"]');

async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => words(cell)),
  );
}

/** An internal reference: the Faculty’s ids (ASMT-, ATT-, Q-, D-) and every other role’s. */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference in the document’s words (hidden and screen-reader-only words included),
 * in any `aria-label`, `title` or `placeholder`, or in the tab’s title.
 */
function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

// ---- FA-18 ------------------------------------------------------------------------------------

describe('FA-18 Marking queue — two answers waiting', () => {
  it('the head, the count and oldest wait, “Mark next”, the filters, the table oldest first', async () => {
    const { runtime, rahul, priya, assessmentId } = await twoWaiting();
    // The world’s ids: ASMT-0009 and ATT-0450 as the walk reserves them (addresses only).
    expect(assessmentId).toBe('ASMT-0009');
    expect(rahul).toBe('ATT-0450');
    expect(priya).toMatch(/^ATT-\d{4}$/);
    showQueue(runtime);
    await queueHeading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.rk-sub')).toHaveTextContent(
      'Written answers from your assessments, oldest first. Choice questions are marked automatically.',
    );
    await waitFor(() => expect(count()).toBe('2 written answers waiting'));
    // The session’s clock reads the day of sign-in: the answers are “today” or later.
    expect(text(main().querySelector('.fa-oldest'))).toBe('Oldest submitted today');
    const next = screen.getByRole('link', { name: 'Mark next' });
    expect(next).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(next.closest('.fa-tbar-act')).not.toBeNull();
    expect(next).toHaveAttribute('href', '/faculty/marking/ATT-0450');
    // The shell: Marking current with its count (the same read), the tab’s title “Marking”.
    expect(document.title).toMatch(/^Marking/);
    const current = sidebarCurrent()!;
    expect(current).toHaveAttribute('href', '/faculty/marking');
    await waitFor(() => expect(current).toHaveTextContent('2, 2 written answers to mark'));

    const section = screen.getByRole('region', { name: 'Written answers' });
    expect(within(section).getByRole('search', { name: 'Filter written answers' })).toHaveClass(
      'rk-tools',
      'fa-mqtools',
    );
    const assessment = within(section).getByRole('combobox', { name: 'Assessment' });
    expect(assessment.closest('.rk-field')).toHaveClass('fa-field-sel', 'fa-mqasm');
    await waitFor(() =>
      expect(
        within(assessment)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['All assessments', `${POST_LAB} · ${SHELL_NAME}`]),
    );
    expect(assessment).toHaveValue('all');
    const show = within(section).getByRole('group', { name: 'Show' });
    expect(show).toHaveClass('fa-seg', 'fa-seg--bar');
    expect(
      within(show)
        .getAllByRole('button')
        .map((button) => [words(button), button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['Waiting 2 , 2', 'true'],
      ['Marked 0 , 0', 'false'],
      ['All 2 , 2', 'false'],
    ]);
    expect(within(show).getByRole('button', { name: 'Waiting, 2' })).toBeVisible();

    const found = await table();
    expect(found.closest('.fa-tablewrap')).not.toBeNull();
    expect(found).toHaveClass('rk-table', 'fa-table', 'fa-ptable');
    expect(found.querySelector('caption')).toHaveTextContent('Written answers, oldest first');
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
        'Rahul Verma Attempt 1 of 2',
        `Assessment ${POST_LAB} Question 4 · written answer`,
        'Submitted 5 Nov 2026, 18:52 Today',
        'Status Waiting for marking',
        'Mark',
      ],
      [
        'Priya Natarajan Attempt 1 of 2',
        `Assessment ${POST_LAB} Question 4 · written answer`,
        'Submitted 6 Nov 2026, 20:10 Today',
        'Status Waiting for marking',
        'Mark',
      ],
    ]);
    const first = found.querySelector('tbody tr')!;
    expect(first).toHaveClass('fa-static');
    expect(first.querySelector('td.fa-c-main .rk-strong')).toHaveTextContent('Rahul Verma');
    expect(first.querySelector('td.fa-c-main .fa-cellsub')).toHaveTextContent('Attempt 1 of 2');
    expect(first.querySelector('.xr-st')).toHaveClass('xr-st--warn');
    const mark = within(first as HTMLElement).getByRole('link', { name: 'Mark Rahul Verma' });
    expect(mark).toHaveClass('rb-btn');
    expect(mark).not.toHaveClass('rb-btn--primary');
    expect(mark).toHaveAttribute('href', '/faculty/marking/ATT-0450');
    // The rows name the attempt and the assessment by content, never by their ids.
    expectNoReferences();
  });

  it('Marked, All and an assessment: the list and the counts follow, the address mirrors them', async () => {
    const user = userEvent.setup();
    const { runtime } = await twoWaiting();
    const { navigation } = showQueue(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Marked, 0' }));
    // Nothing is marked yet: answers exist, so Marked matches nothing (the export’s `noMatch`).
    expect(await screen.findByText('No confirmed marks here yet')).toBeVisible();
    expect(main()).toHaveTextContent('Answers you mark and confirm are listed here.');
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?state=marked');
    expect(count()).toBe('2 written answers waiting');
    await user.click(screen.getByRole('button', { name: 'All, 2' }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?state=all');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Assessment' }), 'ASMT-0009');
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/faculty/marking?assessmentId=ASMT-0009&state=all',
    );
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    await user.click(screen.getByRole('button', { name: 'Waiting, 2' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?assessmentId=ASMT-0009');
  });

  it('“Show all written answers” chooses All and All assessments and moves focus to the list', async () => {
    const user = userEvent.setup();
    const { runtime } = await twoWaiting();
    const { navigation } = showQueue(runtime, '?state=marked');
    const show = await screen.findByRole('button', { name: 'Show all written answers' });
    expect(show.closest('.rk-state')).toHaveTextContent('No confirmed marks here yet');
    await user.click(show);
    expect(navigation.replace).toHaveBeenLastCalledWith('/faculty/marking?state=all');
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(screen.getByRole('heading', { level: 2, name: 'Written answers' })).toHaveFocus();
  });

  it('reads its filters from the address', async () => {
    const { runtime } = await twoWaiting();
    showQueue(runtime, '?assessmentId=ASMT-0009&state=all');
    await table();
    expect(screen.getByRole('combobox', { name: 'Assessment' })).toHaveValue('ASMT-0009');
    expect(screen.getByRole('button', { name: 'All, 2' })).toHaveAttribute('aria-pressed', 'true');
    expect(filtersOf('?state=nonsense')).toEqual({ assessmentId: null, state: 'waiting' });
  });

  it('a mark saved but not confirmed: “Mark saved — not confirmed yet” under the status', async () => {
    const { runtime, sample, rahul } = await twoWaiting();
    await saveOnly(sample, rahul);
    showQueue(runtime);
    await table();
    const first = (await table()).querySelector('tbody tr')!;
    await waitFor(() =>
      expect(words(first.querySelector('td.fa-c-st'))).toBe(
        'Status Waiting for marking Mark saved — not confirmed yet',
      ),
    );
    expect(count()).toBe('2 written answers waiting');
  });
});

describe('FA-18 — after marking Rahul, and nothing waiting', () => {
  it('Priya waits alone; under All, Rahul is Marked with View marks', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    await markAndConfirm(runtime, sample, rahul);
    showQueue(runtime);
    await table();
    expect(count()).toBe('1 written answer waiting');
    expect((await rows()).map((cells) => cells[0])).toEqual(['Priya Natarajan Attempt 1 of 2']);
    expect(screen.getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    await user.click(screen.getByRole('button', { name: 'All, 2' }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    const marked = (await table()).querySelector('tbody tr')!;
    expect(marked.querySelector('.xr-st')).toHaveClass('xr-st--ok');
    expect(words(marked.querySelector('td.fa-c-st'))).toBe(
      'Status Marked Confirmed 7 Nov 2026, 10:15',
    );
    // A confirmed row says no “how long ago”.
    expect(words(marked.querySelectorAll('td')[2]!)).toBe('Submitted 5 Nov 2026, 18:52');
    const view = within(marked as HTMLElement).getByRole('link', {
      name: 'View marks for Rahul Verma',
    });
    expect(view).toHaveTextContent('View marks');
    expect(view).toHaveClass('rb-btn', 'rb-btn--ghost');
    expect(view).toHaveAttribute('href', `/faculty/marking/${rahul}`);
    await user.click(screen.getByRole('button', { name: 'Marked, 1' }));
    await waitFor(async () =>
      expect((await rows()).map((cells) => cells[0])).toEqual(['Rahul Verma Attempt 1 of 2']),
    );
    expectNoReferences();
  });

  it('nothing submitted yet — “Nothing is waiting for you”, “Nothing waiting”, no Mark next, no filters', async () => {
    const { runtime } = await twoWaiting(0);
    showQueue(runtime);
    const title = await screen.findByText('Nothing is waiting for you', {}, { timeout: 5000 });
    await waitFor(() => expect(count()).toBe('Nothing waiting'));
    const empty = title.closest('.rk-state')!;
    expect(empty).toHaveClass('rk-state--roomy');
    expect(empty).toHaveTextContent(
      'Written answers appear here, oldest first, as students submit. Choice questions are marked automatically.',
    );
    expect(main().querySelector('.fa-oldest')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(main().querySelector('.fa-tbar-act')).toBeNull();
    // With no written answer at all the export draws no filters (`MQ.hasAny`).
    expect(screen.queryByRole('combobox', { name: 'Assessment' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Show' })).toBeNull();
  });

  it('empty again once every answer is confirmed; the filters stay and Marked shows them', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    await markAndConfirm(runtime, sample, rahul);
    await markAndConfirm(runtime, sample, priya);
    showQueue(runtime);
    expect(
      await screen.findByText('Nothing is waiting for you', {}, { timeout: 5000 }),
    ).toBeVisible();
    await user.click(await screen.findByRole('button', { name: 'Marked, 2' }));
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

  it('how long ago, in Indian calendar days (state-copy FA-18.days)', () => {
    expect(calendarDaysSince('2026-11-05T13:22:00.000Z', '2026-11-07T04:45:00.000Z')).toBe(2);
    // 23:30 and 00:30 the next day, in India: one day apart, an hour of time.
    expect(calendarDaysSince('2026-11-05T18:00:00.000Z', '2026-11-05T19:00:00.000Z')).toBe(1);
    expect(calendarDaysSince('2026-11-07T04:45:00.000Z', '2026-11-05T13:22:00.000Z')).toBe(0);
  });
});

describe('FA-18 — no course, a co-teacher, loading and failed', () => {
  it('no course taught: the message card “Nothing to mark yet”, no surface', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showQueue(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'Nothing to mark yet' },
      { timeout: 5000 },
    );
    const card = title.closest('section')!;
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(card).toHaveTextContent(
      'Written answers appear here once you teach a course with an assessment. Your Institute Admin hasn’t assigned you a course yet.',
    );
    expect(screen.queryByRole('region', { name: 'Written answers' })).toBeNull();
  });

  it('a co-teaching colleague’s answers are not listed; the note says why', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    ok(
      await asPersonId(sample, MEERA).facultyCourses.assign({
        facultyId: DESAI as PersonId,
        courseId: COURSE as never,
      }),
    );
    const assessmentId = await createPostLab(sample);
    await submit(sample, RAHUL, assessmentId, RAHUL_WRITTEN);
    showQueue(runtime);
    const note = await waitFor(() => {
      const found = main().querySelector('.rk-state p.rk-locked');
      if (!found) throw new Error('no note yet');
      return found;
    });
    expect(note).toHaveTextContent(
      'Written answers for assessments another Faculty member created aren’t shown to co-teaching colleagues while sharing between colleagues is being decided.',
    );
    expect(note.querySelector('svg.xr-ico')).not.toBeNull();
    expect(main()).not.toHaveTextContent('Rahul');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await twoWaiting();
    faults(sample).failNext('MarkingService.listQueue');
    renderInTab(<MarkingQueue />, { runtime, navigation: testNavigation('/faculty/marking') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the written answers',
    );
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveClass('rk-state');
    expect(failed).toHaveTextContent('We couldn’t load the written answers');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(await rows()).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 1, name: 'Marking' })).toHaveFocus();
  });
});

// ---- FA-19 ------------------------------------------------------------------------------------

const markField = () => screen.getByRole('textbox', { name: /^Your mark/ });
const feedbackField = () => screen.getByRole('textbox', { name: /^Feedback for Rahul/ });
const panel = () => screen.getByRole('complementary', { name: 'Marks' });
const markHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Rahul Verma' }, { timeout: 5000 });

describe('FA-19 Mark a submission — as the export draws it', () => {
  it('the head, the reading sheet, the guidance, the automatic marks and the marks panel', async () => {
    const { runtime, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs).toHaveClass('rk-crumbs');
    expect(within(crumbs).getByRole('link', { name: 'Marking' })).toHaveAttribute(
      'href',
      '/faculty/marking',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Rahul Verma');
    const head = main().querySelector('.rk-head')!;
    expect(head.querySelector('.rk-eyebrow')).toHaveTextContent(`${POST_LAB} · ${SHELL_NAME}`);
    expect(head.querySelector('h1')).toHaveClass('rk-title');
    expect(words(head.querySelector('.rk-meta'))).toBe(
      'Waiting for marking Submitted 5 Nov 2026, 18:52 · attempt 1 of 2',
    );
    expect(head.querySelector('.rk-meta .xr-st')).toHaveClass('xr-st--warn');
    await waitFor(() =>
      expect(head.querySelector('.fa-qpos')).toHaveTextContent('1 of 2 waiting · oldest first'),
    );
    // The shell: Marking current; the tab’s title names the Student and the page.
    expect(document.title).toMatch(/^Rahul Verma · Mark a submission/);
    expect(sidebarCurrent()).toHaveAttribute('href', '/faculty/marking');

    // The reading sheet beside the marks panel; “Go to the marks” for narrow widths.
    const detail = main().querySelector('.rk-detailwrap > .rk-detail')!;
    expect(detail.firstElementChild).toHaveClass('rk-surface', 'rk-mainsheet', 'fa-sheet');
    expect(detail.lastElementChild).toHaveClass('rk-aside');
    expect(main().querySelector('.rk-detailwrap > p.fa-gomark a')).toHaveAttribute(
      'href',
      '#ms-panel',
    );

    const automatic = screen.getByRole('region', { name: 'Marked automatically' });
    expect(automatic).toHaveClass('fa-autos');
    expect(automatic.querySelector('.fa-autos-h b')).toHaveTextContent('4 of 6 marks');
    expect(
      [...automatic.querySelectorAll('ul.fa-autolist > li')].map((row) => [
        text(row.querySelector('.fa-auto-q')),
        text(row.querySelector('.fa-res')),
        row.querySelector('.fa-res')?.classList.contains('fa-res--ok') ? 'ok' : 'no',
      ]),
    ).toEqual([
      ['Question 1 · Multiple choice', '2 of 2', 'ok'],
      ['Question 2 · Multiple choice', '0 of 2', 'no'],
      ['Question 3 · True or false', '2 of 2', 'ok'],
    ]);

    const question = screen.getByRole('region', { name: 'Question 4 of 4 · Written answer' });
    expect(question).toHaveClass('fa-sheetq');
    expect(question.querySelector('.fa-sheetq-m')).toHaveTextContent('10 marks');
    expect(question.querySelector('.fa-sheetq-t')).toHaveTextContent(
      'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.',
    );
    expect(question.querySelector('h3.fa-ans-h')).toHaveTextContent('Rahul Verma’s answer');
    expect(question.querySelector('.fa-answer')).toHaveTextContent(RAHUL_WRITTEN);
    expect(question.querySelector('.fa-guide-k')).toHaveTextContent(
      'Marking guidance · only you see this',
    );
    expect(question.querySelector('.fa-guide-t')?.textContent).toMatch(/^Look for: /);

    expect(panel().querySelector('.rk-panel')).toHaveClass('fa-mpanel');
    expect(within(panel()).getByRole('heading', { level: 2 })).toHaveTextContent('Marks');
    expect(panel().querySelector('.fa-ph-note')).toHaveTextContent('16 marks in total');
    expect(markField()).toHaveValue('');
    expect(markField()).toHaveClass('fa-scorein');
    expect(markField()).toHaveAttribute('inputmode', 'numeric');
    expect(markField()).toHaveAccessibleName('Your mark Question 4 · written answer, out of 10');
    expect(markField()).toHaveAccessibleDescription('A whole number from 0 to 10.');
    expect(panel().querySelector('.fa-scoreof')).toHaveTextContent('/ 10');
    expect(panel().querySelector('label[for="ms-fb"]')).toHaveTextContent(
      'Feedback for Rahul (optional)',
    );
    expect(words(panel().querySelector('.fa-total'))).toBe(
      'Total — of 16 4 marked automatically + the written mark · pass mark 8',
    );
    expect(within(panel()).getByRole('button', { name: 'Confirm marks' })).toHaveClass(
      'rb-btn',
      'rb-btn--primary',
      'rb-btn--lg',
    );
    expect(within(panel()).getByRole('button', { name: 'Save mark' })).toHaveClass('rb-btn');
    expect(panel().querySelector('.fa-save-d')).toHaveTextContent(
      'Saving keeps your mark editable.',
    );
    expect(panel().querySelector('.fa-final')).toHaveTextContent(
      'Confirmed marks can’t be changed.',
    );
    expect(panel()).not.toHaveTextContent('Mark saved');
    expectNoReferences();
  });

  it('“Go to the marks” moves focus to the marks panel', async () => {
    const user = userEvent.setup();
    const { runtime, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    Element.prototype.scrollIntoView = vi.fn();
    await user.click(screen.getByRole('link', { name: 'Go to the marks' }));
    expect(document.getElementById('ms-panel')).toHaveFocus();
  });
});

describe('FA-19 — the service’s checks', () => {
  it('12 is out of range: the words under the score, which takes focus; nothing saved', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '12');
    await user.click(screen.getByRole('button', { name: 'Save mark' }));
    const error = await screen.findByText('Enter a whole number from 0 to 10');
    expect(error.closest('.rk-ferr')).not.toBeNull();
    expect(markField()).toHaveAttribute('aria-invalid', 'true');
    expect(markField()).toHaveAccessibleDescription(
      'A whole number from 0 to 10. Enter a whole number from 0 to 10',
    );
    await waitFor(() => expect(markField()).toHaveFocus());
    // The live total waits for a whole number within the question’s marks.
    expect(text(panel().querySelector('.fa-total b'))).toBe('— of 16');
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

describe('FA-19 — save, confirm, read-only', () => {
  it('Save mark: “Mark saved — not confirmed yet” takes focus; a change hides it; the Student sees nothing', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    expect(words(panel().querySelector('.fa-total'))).toBe(
      'Total 11 of 16 4 marked automatically + 7 written · pass mark 8',
    );
    await user.type(feedbackField(), 'Good use of your own readings.');
    await user.click(screen.getByRole('button', { name: 'Save mark' }));
    const saved = await within(panel()).findByRole('status');
    await waitFor(() => expect(saved).toHaveTextContent('Mark saved — not confirmed yet'));
    expect(saved).toHaveClass('fa-savednote');
    await waitFor(() => expect(saved).toHaveFocus());
    expect(panel().querySelector('.fa-save-d')).toBeNull();
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

  it('Confirm marks: the dialog, then the read-only panel with the total, the release line and Next submission', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul, priya } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    await user.type(feedbackField(), 'Good use of your own readings and the right cause.');
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    expect(dialog).toHaveClass('rk-dialog');
    // The dialog names the assessment (never the attempt’s id).
    expect(dialog).toHaveAccessibleDescription(POST_LAB);
    const groups = [...dialog.querySelectorAll('.rk-dlg-group')];
    expect(groups.map((group) => group.querySelector('h3')?.textContent)).toEqual([
      'What confirming does',
      'When Rahul sees the result',
    ]);
    expect(groups[0]).toHaveClass('rk-dlg-now');
    expect([...groups[0]!.querySelectorAll('li')].map((line) => text(line))).toEqual([
      'Question 4 is marked 7 of 10.',
      'Rahul’s total becomes 11 of 16 marks — passed (pass mark 8).',
      'The marks become read-only. They can’t be changed after you confirm.',
    ]);
    expect(groups[1]).toHaveClass('rk-dlg-later');
    expect(text(groups[1]!.querySelector('li'))).toBe(
      'Rahul sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment.',
    );
    // The typed mark is saved before the dialog opens (state-copy FA-19.confirm-saves-first).
    expect(
      ok(await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId))
        .attempt.marking.written[0]?.mark,
    ).toBe(7);
    // The dialog opens on its title (the export’s `focusLater('fa-dlg-t')`).
    await waitFor(() => expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus());
    expectNoReferences();
    await user.click(within(dialog).getByRole('button', { name: 'Confirm marks' }));

    const done = await waitFor(() => {
      const element = document.getElementById('ms-mdone');
      if (!element) throw new Error('not confirmed yet');
      return element;
    });
    await waitFor(() => expect(done).toHaveFocus());
    expect(done).toHaveClass('fa-done');
    expect(words(done.querySelector('.rk-notice--ok'))).toBe(
      'Marks confirmed 7 Nov 2026, 10:15 · Dr S. Ranganathan',
    );
    expect(words(done.querySelector('.fa-done-total'))).toBe('11 of 16 marks Passed · pass mark 8');
    const summary = done.querySelector('dl.fa-sumdl')!;
    expect([...summary.querySelectorAll('dt')].map((cell) => text(cell))).toEqual([
      'Question 4',
      'Feedback',
    ]);
    expect([...summary.querySelectorAll('dd')].map((cell) => text(cell))).toEqual([
      '7 of 10',
      'Good use of your own readings and the right cause.',
    ]);
    expect(summary.querySelectorAll('dd')[1]).toHaveClass('is-text');
    expect(done.querySelector('p.rk-locked')).toHaveTextContent(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    await waitFor(() =>
      expect(within(done).getByRole('link', { name: 'Next submission' })).toHaveAttribute(
        'href',
        `/faculty/marking/${priya}`,
      ),
    );
    expect(within(done).getByRole('link', { name: 'Next submission' })).toHaveClass(
      'rb-btn--primary',
    );
    expect(within(done).getByRole('link', { name: 'See submissions' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009/submissions',
    );
    // Read-only: no score field, no Save mark; the head says Marked.
    expect(screen.queryByRole('textbox', { name: /^Your mark/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save mark' })).toBeNull();
    expect(main().querySelector('.rk-meta .xr-st')).toHaveClass('xr-st--ok');
    expect(main().querySelector('.fa-qpos')).toBeNull();
    // The service holds it: confirmed by him, and Rahul still sees no score (after the deadline).
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed).toMatchObject({ at: expect.any(String) });
    const result = ok(await asPersonId(sample, RAHUL).assessments.getResult(rahul as AttemptId));
    expect(result.result.kind).toBe('not-released-yet');
    expectNoReferences();
  });

  it('Cancel in the dialog confirms nothing; the mark stays saved', async () => {
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

  it('a confirm that fails for now keeps the dialog open and says so (FA-19.unavailable.confirm)', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await twoWaiting();
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markField(), '7');
    await user.click(screen.getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog');
    faults(sample).failNext('MarkingService.confirmMarks');
    await user.click(within(dialog).getByRole('button', { name: 'Confirm marks' }));
    expect(
      await within(dialog).findByText('The marks weren’t confirmed. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(screen.getByRole('dialog')).toBeVisible();
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed).toBeNull();
  });

  it('a mark saved earlier fills the form with its note (state-copy FA-19.saved-on-open)', async () => {
    const { runtime, sample, rahul } = await twoWaiting();
    await saveOnly(sample, rahul, '5', 'Saved before.');
    showMark(runtime, rahul);
    await markHeading();
    expect(markField()).toHaveValue('5');
    expect(feedbackField()).toHaveValue('Saved before.');
    expect(panel()).toHaveTextContent('Mark saved — not confirmed yet');
  });
});

describe('FA-19 — after Flow D: confirmed and released', () => {
  it('reads only; released when the deadline passed; nothing else waits', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMark(runtime, 'ATT-0450');
    await markHeading();
    const done = document.getElementById('ms-mdone')!;
    expect(done).toHaveTextContent('Marks confirmed');
    expect(done).toHaveTextContent('7 Nov 2026, 10:15 · Dr S. Ranganathan');
    expect(done.querySelector('dl')).toHaveTextContent('Question 47 of 10');
    await waitFor(() =>
      expect(done.querySelector('p.fa-savednote')).toHaveTextContent(
        'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
      ),
    );
    // Nothing else waits: the quiet line in place of Next submission (state-copy FA-19.next).
    await waitFor(() =>
      expect(done.querySelector('.fa-done-acts p.fa-quiet')).toHaveTextContent(
        'Nothing else is waiting for marking.',
      ),
    );
    expect(within(done).queryByRole('link', { name: 'Next submission' })).toBeNull();
    expect(within(done).getByRole('link', { name: 'See submissions' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009/submissions',
    );
    expect(screen.queryByRole('button', { name: 'Confirm marks' })).toBeNull();
    expectNoReferences();
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

  // The decisions still open (ATT-07, OD-B4-17). Several written questions and none were decided
  // by the owner on 24 Oct 2026: they are marked here (the describe "every Ready shape" below).
  it.each([
    ['ATT-07', 'These marks can’t be confirmed yet'],
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
      expect(screen.queryByRole('textbox', { name: /^Your mark/ })).toBeNull();
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
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'This submission isn’t available to you yet' },
      { timeout: 5000 },
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mark a submission');
    expect(title.closest('.rk-state')).toHaveTextContent(
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
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing has changed. Try again.');
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
    expect(view(base).outOf).toBe(12);
    expect(view(base).questions).toBe(2);
    // Owner decisions of 24 Oct 2026: several written questions and none are marked here.
    const several = view({
      ...base,
      numbering: [...base.numbering, { ...base.numbering[1], questionId: 'Q-3', number: 3 }],
    });
    expect(several.blocked).toBeNull();
    expect(several.written.map((entry) => entry.number)).toEqual([2, 3]);
    const choiceOnly = view({ ...base, numbering: [base.numbering[0]] });
    expect(choiceOnly.blocked).toBeNull();
    expect(choiceOnly.written).toEqual([]);
    // Without every automatic mark (ATT-07), whatever the shape: the calm state.
    const unmarked = { attempt: { marking: { automatic: [] } } };
    expect(view({ ...base, ...unmarked }).blocked).toBe('choice');
    expect(
      view({
        ...base,
        numbering: [...base.numbering, { ...base.numbering[1], questionId: 'Q-3', number: 3 }],
        ...unmarked,
      }).blocked,
    ).toBe('choice');
    expect(view({ ...base, numbering: [base.numbering[0]], ...unmarked }).blocked).toBe('choice');
    expect(blockedOf('ATT-07')).toBe('choice');
    expect(blockedOf('OD-B4-17')).toBe('colleague');
  });

  it('the pass mark is the pinned version’s, as the domain counts it; the live total’s whole marks', () => {
    const assessment = {
      version: 2,
      rules: { passMarkPercent: 60 },
      versions: [
        { version: 1, rules: { passMarkPercent: 50 } },
        { version: 2, rules: { passMarkPercent: 60 } },
      ],
    } as unknown as Parameters<typeof passMarkOf>[0];
    expect(passMarkOf(assessment, 1, 16)).toBe(8);
    expect(passMarkOf(assessment, 2, 16)).toBe(9.6);
    expect(passMarkOf({ ...assessment, versions: [] }, 1, 16)).toBeNull();
    expect(wholeMarkOf(' 7 ', 10)).toBe(7);
    expect(wholeMarkOf('12', 10)).toBeNull();
    expect(wholeMarkOf('7.5', 10)).toBeNull();
    expect(wholeMarkOf('', 10)).toBeNull();
  });
});

// ---- Every Ready shape (owner decisions of 24 Oct 2026, the assessment P0 fix) ------------------

const QUICK_CHECK = 'Shell-and-Tube — quick check';
const SECOND_WRITTEN = 'Which reading in the simulation showed the fouling most clearly, and why?';

/**
 * A Ready assessment of its own shape, released immediately after marking: Dr Ranganathan creates
 * it of the walk's questions (and, for two written questions, a second written one he adds to the
 * bank, out of 5); Rahul answers (Q1 A, Q2 B, Q3 true: 4 of 6 by the key; written as given) and
 * submits at the walk's time.
 */
async function shaped(kind: 'choice-only' | 'two-written') {
  const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
  const faculty = asPersonId(sample, RANGANATHAN);
  const second =
    kind === 'two-written'
      ? ok(
          await faculty.questionBank.addQuestion({
            experimentId: SHELL as ExperimentId,
            type: 'written',
            text: SECOND_WRITTEN,
            options: {},
            correct: null,
            marks: '5',
            explanation: null,
            markingGuidance: null,
          }),
        ).id
      : null;
  const questions =
    kind === 'choice-only'
      ? ['Q-0101', 'Q-0102', 'Q-0104']
      : ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106', second!];
  const created = ok(
    await faculty.assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL as ExperimentId,
      name: QUICK_CHECK,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'immediately-after-marking',
        releaseDate: null,
      },
      questions: questions as never,
    }),
  );
  moveClock(sample, RAHUL_SUBMITS);
  const ports = asPersonId(sample, RAHUL);
  let attempt = ok(await ports.assessments.startAttempt(created.id));
  const answers: (readonly [string, unknown])[] = [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
  ];
  if (second) {
    answers.push(['Q-0106', { type: 'written', text: RAHUL_WRITTEN }]);
    answers.push([second, { type: 'written', text: 'The cold outlet, because it moved most.' }]);
  }
  for (const [questionId, answer] of answers) {
    attempt = ok(
      await ports.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId: questionId as never,
        answer: answer as never,
        expectedRev: attempt.rev,
      }),
    );
  }
  ok(await ports.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }));
  moveClock(sample, MARKING_TIME);
  return { runtime, sample, rahul: attempt.id as string, second };
}

const markFields = () => screen.getAllByRole('textbox', { name: /^Your mark/ });

describe('FA-18 / FA-19 — every Ready shape (owner decisions of 24 Oct 2026)', () => {
  it('choice-only: queued as “Marked automatically · confirm the marks”, counted as a submission to confirm', async () => {
    const { runtime } = await shaped('choice-only');
    showQueue(runtime);
    await queueHeading();
    await waitFor(() => expect(count()).toBe('1 submission to confirm'));
    expect(await rows()).toEqual([
      [
        'Rahul Verma Attempt 1 of 2',
        `Assessment ${QUICK_CHECK} Marked automatically · confirm the marks`,
        'Submitted 5 Nov 2026, 18:52 Today',
        'Status Waiting for marking',
        'Mark',
      ],
    ]);
    // The rail's Marking count says what it counts.
    await waitFor(() => expect(sidebarCurrent()).toHaveTextContent('1, 1 submission to confirm'));
    expect(screen.getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/faculty\/marking\/ATT-\d{4}$/),
    );
    expectNoReferences();
  });

  it('choice-only: the automatic marks, the total and Confirm marks — no score field; confirmed and released', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await shaped('choice-only');
    showMark(runtime, rahul);
    await markHeading();
    const automatic = screen.getByRole('region', { name: 'Marked automatically' });
    expect(automatic.querySelector('.fa-autos-h b')).toHaveTextContent('4 of 6 marks');
    expect(screen.queryByRole('region', { name: /Written answer/ })).toBeNull();
    expect(within(panel()).queryByRole('textbox')).toBeNull();
    expect(within(panel()).queryByRole('button', { name: 'Save mark' })).toBeNull();
    expect(words(within(panel()).getByRole('status'))).toBe(
      'There’s no written answer to mark The choice questions are marked automatically. Check their marks, then confirm them.',
    );
    await waitFor(() =>
      expect(words(panel().querySelector('.fa-total'))).toBe(
        'Total 4 of 6 4 marked automatically · pass mark 3',
      ),
    );
    // Confirm opens the dialog at once: nothing to save.
    await user.click(within(panel()).getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    expect(dialog).toHaveAccessibleDescription(QUICK_CHECK);
    expect([...dialog.querySelectorAll('.rk-dlg-group li')].map((item) => text(item))).toEqual([
      'Rahul’s total becomes 4 of 6 marks — passed (pass mark 3).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    await user.click(within(dialog).getByRole('button', { name: 'Confirm marks' }));
    const done = await waitFor(() => {
      const element = document.getElementById('ms-mdone');
      expect(element).not.toBeNull();
      return element!;
    });
    expect(done.querySelector('.rk-notice-t')).toHaveTextContent('Marks confirmed');
    expect(done.querySelector('.fa-done-total b')).toHaveTextContent('4 of 6 marks');
    expect([...done.querySelectorAll('dl.fa-sumdl > div')].map((row) => words(row))).toEqual([
      'Marked automatically 4 of 6 marks',
    ]);
    await waitFor(() =>
      expect(done).toHaveTextContent(
        'Result released to Rahul when the marks were confirmed, 7 Nov 2026, 10:15.',
      ),
    );
    // Confirmed by the Faculty member; Rahul's result is released by the assessment's setting.
    const view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed?.by).toMatchObject({ displayName: 'Dr S. Ranganathan' });
    const result = ok(await asPersonId(sample, RAHUL).assessments.getResult(rahul as AttemptId));
    expect(result.result).toMatchObject({ kind: 'released', score: 4, outOf: 6, passed: true });
    expectNoReferences();
  });

  it('two written questions: one block each; Confirm is refused until both are saved, then confirmed once', async () => {
    const user = userEvent.setup();
    const { runtime, sample, rahul } = await shaped('two-written');
    showQueue(runtime);
    await queueHeading();
    await waitFor(() => expect(count()).toBe('2 written answers waiting'));
    expect((await rows())[0]![1]).toBe(
      `Assessment ${QUICK_CHECK} Questions 4 and 5 · written answers`,
    );

    showMark(runtime, rahul);
    await markHeading();
    expect(
      screen.getByRole('region', { name: 'Question 5 of 5 · Written answer' }),
    ).toHaveTextContent(SECOND_WRITTEN);
    const [first, second] = markFields();
    expect(first).toHaveAccessibleName('Your mark Question 4 · written answer, out of 10');
    expect(second).toHaveAccessibleName('Your mark Question 5 · written answer, out of 5');
    expect(first).toHaveAttribute('id', 'ms-mk-q4');
    expect(second).toHaveAttribute('id', 'ms-mk-q5');
    expect(
      screen.getByRole('textbox', { name: 'Feedback for Rahul on question 4 (optional)' }),
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Feedback for Rahul on question 5 (optional)' }),
    ).toBeVisible();
    expect(within(panel()).getAllByRole('button', { name: /^Save mark/ })).toHaveLength(2);
    expect(within(panel()).getAllByRole('button', { name: 'Confirm marks' })).toHaveLength(1);
    expect(words(panel().querySelector('.fa-total'))).toBe(
      'Total — of 21 4 marked automatically + the written marks · pass mark 10.5',
    );

    // Save the first block only.
    await user.type(first!, '7');
    await user.type(
      screen.getByRole('textbox', { name: 'Feedback for Rahul on question 4 (optional)' }),
      'Good use of your readings.',
    );
    await user.click(screen.getByRole('button', { name: 'Save mark for question 4' }));
    const savedNote = await waitFor(() => {
      const element = document.getElementById('ms-saved-q4');
      expect(element).toHaveTextContent('Mark saved — not confirmed yet');
      return element!;
    });
    await waitFor(() => expect(savedNote).toHaveFocus());
    expect(document.getElementById('ms-saved-q5')).toBeNull();

    // Confirm with the second empty: its words under its score, which takes focus; no dialog.
    await user.click(within(panel()).getByRole('button', { name: 'Confirm marks' }));
    expect(await screen.findByText('Enter a mark for question 5')).toBeVisible();
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(markFields()[1]).toHaveFocus());
    expect(markFields()[1]).toHaveAttribute('aria-invalid', 'true');
    expect(markFields()[0]).not.toHaveAttribute('aria-invalid');
    let view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.confirmed).toBeNull();

    // Type the second: Confirm saves it first, then the dialog lists both marks.
    await user.type(markFields()[1]!, '3');
    expect(words(panel().querySelector('.fa-total'))).toBe(
      'Total 14 of 21 4 marked automatically + 10 written · pass mark 10.5',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Confirm marks' }));
    const dialog = await screen.findByRole('dialog', { name: 'Confirm marks for Rahul Verma?' });
    expect([...dialog.querySelectorAll('.rk-dlg-group li')].map((item) => text(item))).toEqual([
      'Question 4 is marked 7 of 10.',
      'Question 5 is marked 3 of 5.',
      'Rahul’s total becomes 14 of 21 marks — passed (pass mark 10.5).',
      'The marks become read-only. They can’t be changed after you confirm.',
      'Rahul sees the result as soon as you confirm, as set for this assessment.',
    ]);
    view = ok(
      await asPersonId(sample, RANGANATHAN).marking.getAttemptForMarking(rahul as AttemptId),
    );
    expect(view.attempt.marking.written.map((mark) => mark.mark)).toEqual([7, 3]);
    await user.click(within(dialog).getByRole('button', { name: 'Confirm marks' }));
    const done = await waitFor(() => {
      const element = document.getElementById('ms-mdone');
      expect(element).not.toBeNull();
      return element!;
    });
    expect(done.querySelector('.fa-done-total b')).toHaveTextContent('14 of 21 marks');
    expect([...done.querySelectorAll('dl.fa-sumdl > div')].map((row) => words(row))).toEqual([
      'Question 4 7 of 10',
      'Question 5 3 of 5',
      'Feedback on question 4 Good use of your readings.',
      'Feedback on question 5 No feedback',
    ]);
    expect(within(panel()).queryByRole('textbox')).toBeNull();
    const result = ok(await asPersonId(sample, RAHUL).assessments.getResult(rahul as AttemptId));
    expect(result.result).toMatchObject({ kind: 'released', score: 14, outOf: 21, passed: true });
    expectNoReferences();
  });

  it('two written questions: a confirm the service refuses for a missing mark names that question’s block', async () => {
    const user = userEvent.setup();
    const { runtime, rahul, second } = await shaped('two-written');
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        marking: {
          ...ports.marking,
          confirmMarks: async () => ({
            ok: false as const,
            error: validationFailed(
              [fieldError(`marks.${second}`, 'FA-19.mark.required', { question: '5' })],
              null,
            ),
          }),
        },
      } as typeof ports;
    });
    showMark(runtime, rahul);
    await markHeading();
    await user.type(markFields()[0]!, '7');
    await user.type(markFields()[1]!, '3');
    await user.click(within(panel()).getByRole('button', { name: 'Confirm marks' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm marks' }),
    );
    expect(await screen.findByText('Enter a mark for question 5')).toBeVisible();
    await waitFor(() => expect(markFields()[1]).toHaveFocus());
  });
});
