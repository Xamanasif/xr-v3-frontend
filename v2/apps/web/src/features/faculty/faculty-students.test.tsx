/**
 * FA-20 Students with FA-22 Export CSV, and FA-21 Student detail (board B4-10 f0 … f7) on the real
 * composition root and the sample world. After Flow C only Rahul has Shell-and-Tube; the "five
 * students" world below moves it as the board's sample does: Meera gives Priya, Imran, Divya and
 * Karthik the experiment, the sample runtime reports their activity, Dr Ranganathan creates
 * ASMT-0009 and Rahul and Priya submit — then the sample clock reads 12 Nov 2026, so Imran (last
 * active 28 Oct) and Karthik (given 27 Oct, never active) are inactive for 14 days or more (f1).
 * The drawn states: the list and its filters (f0, f1, f7), the export (f2), no students yet (f6);
 * the detail waiting for marking (f3), marked and not released (f4) and an inactive Student (f5).
 * The undrawn ones: loading, failed, no experiment taught, not found, an attempt in progress, a
 * released result, a co-teaching colleague's assessment. FA-03 and FA-05 now link to FA-20.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  AssessmentId,
  CourseId,
  ExperimentId,
  IsoInstant,
  PersonId,
  QuestionId,
} from '@xr/domain';
import { asPersonId, faults, ist, setSampleNow, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  exportedColumns,
  exportedTitle,
  STUDENT_DETAIL,
  STUDENTS_STATES,
} from '@/copy/faculty-students';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_STUDENTS } from '@/copy/state-copy-faculty-students';
import { P4B_FACULTY_STUDENTS_LINK_TARGETS } from '@/nav/link-targets-p4b/faculty-students';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { FacultyStudents } from './fa-20-students/students';
import { csvShape, daysBetween } from './fa-20-students/student-facts';
import { FacultyStudentDetail } from './fa-21-student/student-detail';
import { downloadCsv } from './shared/download-csv';

vi.mock('./shared/download-csv', () => ({ downloadCsv: vi.fn() }));
// The five-student world is built by real commands before each render.
vi.setConfig({ testTimeout: 30_000 });

afterEach(() => {
  forgetLastAddress();
});
beforeEach(() => {
  vi.mocked(downloadCsv).mockClear();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const MEERA = 'per-0001';
const RAHUL = 'per-0002';
const PRIYA = 'per-0003';
const IMRAN = 'per-0006';
const DIVYA = 'per-0007';
const KARTHIK = 'per-0008';
const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const NAME = 'Heat Exchanger — post-lab';
const STUDENTS = '/faculty/students';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const at = (time: string): IsoInstant => ist(time);

function activity(
  sample: Sample,
  studentId: string,
  format: 'web' | 'vr',
  kind: 'opened' | 'session',
  time: string,
) {
  setSampleNow(sample, at(time));
  ok(
    standinsOf(sample).runtimeReport.reportActivity({
      studentId: studentId as PersonId,
      experimentId: SHELL,
      format,
      kind,
      at: at(time),
    }),
  );
}

/** ASMT-0009 as the walk's D1 makes it (27 Oct, after the deadline release, 2 attempts). */
async function createAssessment(sample: Sample): Promise<AssessmentId> {
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
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'] as QuestionId[],
    } as never),
  ) as { readonly id: AssessmentId };
  return created.id;
}

/** A Student starts the attempt (and, given a submit time, answers as Rahul does and submits). */
async function attempt(
  sample: Sample,
  studentId: string,
  assessmentId: AssessmentId,
  started: string,
  submitted: string | null,
): Promise<string> {
  const student = asPersonId(sample, studentId);
  setSampleNow(sample, at(started));
  let current = ok(await student.assessments.startAttempt(assessmentId));
  if (submitted === null) return current.id;
  for (const [questionId, answer] of [
    ['Q-0101', { type: 'multiple-choice', choice: 'A' }],
    ['Q-0102', { type: 'multiple-choice', choice: 'B' }],
    ['Q-0104', { type: 'true-false', value: true }],
    ['Q-0106', { type: 'written', text: 'Fouling lowers the overall coefficient.' }],
  ] as const) {
    current = ok(
      await student.assessments.saveAnswer({
        attemptId: current.id,
        questionId: questionId as QuestionId,
        answer,
        expectedRev: current.rev,
      }),
    );
  }
  setSampleNow(sample, at(submitted));
  ok(await student.assessments.submitAttempt({ attemptId: current.id, expectedRev: current.rev }));
  return current.id;
}

/**
 * The five Students with Shell-and-Tube, as the board's sample (B4-10 f0), on the sample clock of
 * after Flow C: given 27 Oct, active until 28 Oct … 6 Nov; read on 12 Nov 2026, 10:00.
 */
async function fiveStudents(personId = RANGANATHAN) {
  const platform = await tabPlatform(personId, 'after-flow-c');
  const { sample } = platform;
  setSampleNow(sample, at('2026-10-27 10:00'));
  const assessmentId = await createAssessment(sample);
  const meera = asPersonId(sample, MEERA);
  const options = ok(await meera.studentAccess.getGiveAccessOptions({ experimentIds: [SHELL] }));
  ok(
    await meera.studentAccess.giveAccess({
      experimentIds: [SHELL],
      target: {
        kind: 'students',
        studentIds: [PRIYA, IMRAN, DIVYA, KARTHIK] as PersonId[],
      },
      expectedPlanRev: options.plan.rev,
    }),
  );
  activity(sample, IMRAN, 'web', 'opened', '2026-10-28 09:00');
  activity(sample, PRIYA, 'web', 'opened', '2026-10-28 10:00');
  setSampleNow(sample, at('2026-10-28 11:00'));
  ok(
    standinsOf(sample).runtimeReport.reportCompletion({
      studentId: PRIYA as PersonId,
      experimentId: SHELL,
      format: 'web',
      at: at('2026-10-28 11:00'),
      from: 'simulation',
    }),
  );
  activity(sample, PRIYA, 'vr', 'session', '2026-10-30 14:00');
  activity(sample, DIVYA, 'web', 'opened', '2026-11-03 16:00');
  const rahulAttempt = await attempt(
    sample,
    RAHUL,
    assessmentId,
    '2026-11-05 18:20',
    '2026-11-05 18:52',
  );
  const priyaAttempt = await attempt(
    sample,
    PRIYA,
    assessmentId,
    '2026-11-06 19:40',
    '2026-11-06 20:10',
  );
  setSampleNow(sample, at('2026-11-12 10:00'));
  return { ...platform, assessmentId, rahulAttempt, priyaAttempt };
}

/** Dr Ranganathan marks an attempt's written answer and confirms the marks (FA-19, through the port). */
async function markAndConfirm(sample: Sample, attemptId: string, mark = '7') {
  const faculty = asPersonId(sample, RANGANATHAN);
  const view = ok(await faculty.marking.getAttemptForMarking(attemptId as never));
  const saved = ok(
    await faculty.marking.saveMark({
      attemptId: view.attempt.id,
      questionId: 'Q-0106' as QuestionId,
      mark,
      feedback: null,
      expectedRev: view.attempt.rev,
    } as never),
  ) as { readonly rev: number };
  ok(await faculty.marking.confirmMarks({ attemptId: view.attempt.id, expectedRev: saved.rev }));
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showStudents(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation(STUDENTS, search);
  const view = renderInTab(inShell(<FacultyStudents />), { runtime, navigation });
  return { navigation, view };
}

function showStudent(
  runtime: PlatformRuntime,
  studentId: string,
  search = `?experimentId=${SHELL}`,
) {
  const navigation = testNavigation(`${STUDENTS}/${studentId}`, search);
  const view = renderInTab(inShell(<FacultyStudentDetail studentId={studentId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
/** An element's text with its child elements' texts apart ("Rahul Verma GIT-2026-0418"). */
const parts = (element: Element) =>
  [...element.childNodes]
    .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
const studentsHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Students' }, { timeout: 5000 });
const notFoundHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const status = () => text(main().querySelector('.xr-toolbar-status [role="status"]'));
const select = (name: string) => screen.getByRole('combobox', { name });

/** The table's rows as their cells' text. */
async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => parts(cell)),
  );
}

async function names(): Promise<string[]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr td:first-child a')].map((link) => text(link));
}

async function waitForNames(expected: string[]) {
  await waitFor(async () => expect(await names()).toEqual(expected), { timeout: 5000 });
}

const FIVE = ['Divya Menon', 'Imran Shaikh', 'Karthik Rao', 'Priya Natarajan', 'Rahul Verma'];

// ---- FA-20: the list (f0, f7) ---------------------------------------------------------------------

describe('FA-20 Students — the list (B4-10 f0, f7)', () => {
  it('the header, the experiment section, the toolbar and one row per Student, per format in words', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await studentsHeading();
    await waitForNames(FIVE);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Students');
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', STUDENTS);

    // "Students who have the experiments you teach · as of 12 Nov 2026" — the read's own instant.
    await waitFor(() =>
      expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
        /^Students who have the experiments you teach · as of 12 Nov 2026$/,
      ),
    );
    const exportButton = screen.getByRole('button', { name: 'Export CSV' });
    expect(exportButton).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(exportButton.parentElement).toHaveClass('xr-phead-actions');

    const section = screen.getByRole('region', { name: SHELL_NAME });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      /^Progress per format, in words$/,
    );
    expect(select('Experiment').closest('.xr-field')).toHaveClass('xr-filter-2');
    expect(
      [...select('Experiment').querySelectorAll('option')].map((option) => option.textContent),
    ).toEqual([SHELL_NAME]);
    expect(
      [...select('Progress').querySelectorAll('option')].map((option) => option.textContent),
    ).toEqual([
      'All',
      'Not started',
      'In progress in a format',
      'Completed a format',
      'Waiting for marking',
    ]);
    expect(
      [...select('Inactive for').querySelectorAll('option')].map((option) => option.textContent),
    ).toEqual(['Any time', '7 days or more', '14 days or more', '30 days or more']);
    expect(status()).toBe('5 of 5 students');
    expect(section.querySelector('.xr-fchip')).toBeNull();

    const found = await table();
    expect([...found.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Student',
      'WEB',
      'VR',
      'Assessment',
      'Last activity',
    ]);
    expect(await rows()).toEqual([
      ['Divya Menon GIT-2026-0411', 'In progress', 'Not started', 'Not started', '3 Nov 2026'],
      [
        'Imran Shaikh GIT-2026-0409',
        'In progress',
        'Not started',
        'Not started',
        '28 Oct 2026 Inactive 15 days',
      ],
      [
        'Karthik Rao GIT-2026-0415',
        'Not started',
        'Not started',
        'Not started',
        'None since access was given (27 Oct 2026) Inactive 16 days',
      ],
      [
        'Priya Natarajan GIT-2026-0431',
        'Completed 28 Oct 2026',
        'In progress',
        'Waiting for marking',
        '6 Nov 2026',
      ],
      [
        'Rahul Verma GIT-2026-0418',
        'Completed 14 Oct 2026',
        'Completed 20 Oct 2026',
        'Waiting for marking',
        '5 Nov 2026',
      ],
    ]);

    // The board's markup: the name link (aria "Open …") to FA-21 for this experiment, the ID.
    const rahul = screen.getByRole('link', { name: 'Open Rahul Verma' });
    expect(rahul).toHaveAttribute('href', `${STUDENTS}/${RAHUL}?experimentId=${SHELL}`);
    expect(rahul.querySelector('strong')).toHaveTextContent('Rahul Verma');
    expect(rahul.nextElementSibling).toHaveClass('xr-meta', 'xw-nowrap', 'block');
    const cells = rahul.closest('tr')!.querySelectorAll('td');
    expect([...cells].map((cell) => cell.getAttribute('data-label'))).toEqual([
      null,
      'WEB',
      'VR',
      'Assessment',
      'Last activity',
    ]);
    expect(cells[1]!.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expect(cells[1]!.querySelector('.xr-meta')).toHaveTextContent('14 Oct 2026');
    expect(cells[3]!.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    const karthik = screen.getByRole('link', { name: 'Open Karthik Rao' }).closest('tr')!;
    expect(karthik.querySelectorAll('td')[1]!.querySelector('.xr-status')).toHaveClass(
      'xr-status--off',
    );
    expect(karthik.querySelectorAll('td')[3]!.querySelector('.xl-meta')).toHaveTextContent(
      'Not started',
    );
    const tag = karthik.querySelector('.xa-tag');
    expect(tag).toHaveClass('xa-tag', 'xa-tag--draft');
    expect(tag?.querySelector('svg.xr-ico')).not.toBeNull();
    // No percentage, no score, no feedback anywhere on the list.
    expect(main().textContent).not.toMatch(/%|\bof 16\b|feedback/i);
  });

  it('the address names the experiment; an experiment outside the teaching scope is not found', async () => {
    const { runtime } = await fiveStudents();
    const { navigation } = showStudents(runtime, `?experimentId=${SHELL}`);
    await waitForNames(FIVE);
    expect(select('Experiment')).toHaveValue(SHELL);
    expect(navigation.replace).not.toHaveBeenCalled();

    const other = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudents(other.runtime, '?experimentId=fin-tube-bundle');
    await notFoundHeading();
  });
});

// ---- FA-20: the filters (f1, the board script's no match) ----------------------------------------

describe('FA-20 — Progress and “Inactive for” (B4-10 f1)', () => {
  it('inactive 14 days or more: two of five, the chip and Clear filters', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.selectOptions(select('Inactive for'), '14 days or more');
    await waitForNames(['Imran Shaikh', 'Karthik Rao']);
    expect(status()).toBe('2 of 5 students');
    const chip = main().querySelector('.xr-fchip')!;
    expect(chip).toHaveTextContent('Inactive 14 days or more');
    expect(
      within(chip as HTMLElement).getByRole('button', { name: 'Remove Inactive 14 days or more' }),
    ).toBeVisible();
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    expect(clear).toHaveClass('xr-btn', 'xr-btn--text', 'min-h-8');

    // 30 days or more: with no activity the service counts the days since access was given
    // (B4-10 f0 “None since access was given … · Inactive 26 days”; script `r.days >= N`) —
    // Karthik has had the experiment 16 days, so nobody matches.
    await user.selectOptions(select('Inactive for'), '30 days or more');
    await waitFor(() => expect(status()).toBe('0 of 5 students'), { timeout: 5000 });
    expect(main()).toHaveTextContent('No student matches these filters.');

    // Removing the chip brings everyone back; focus stays in the toolbar.
    await user.click(screen.getByRole('button', { name: 'Remove Inactive 30 days or more' }));
    await waitForNames(FIVE);
    expect(main().querySelector('.xr-fchip')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(document.activeElement?.tagName).toBe('SELECT');
  });

  it('each Progress choice is the service’s reading; two filters make two chips', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    const progress = select('Progress');
    await user.selectOptions(progress, 'Not started');
    await waitForNames(['Karthik Rao']);
    expect(status()).toBe('1 of 5 students');
    expect(main().querySelector('.xr-fchip')).toHaveTextContent('Progress: Not started');
    await user.selectOptions(progress, 'In progress in a format');
    await waitForNames(['Divya Menon', 'Imran Shaikh', 'Priya Natarajan']);
    await user.selectOptions(progress, 'Completed a format');
    await waitForNames(['Priya Natarajan', 'Rahul Verma']);
    await user.selectOptions(progress, 'Waiting for marking');
    await waitForNames(['Priya Natarajan', 'Rahul Verma']);
    await user.selectOptions(progress, 'In progress in a format');
    await user.selectOptions(select('Inactive for'), '7 days or more');
    // Divya last active 3 Nov (9 days), Imran 28 Oct; Priya 6 Nov (5 days) drops out.
    await waitForNames(['Divya Menon', 'Imran Shaikh']);
    expect([...main().querySelectorAll('.xr-fchip')].map((chip) => text(chip))).toEqual([
      'Progress: In progress in a format',
      'Inactive 7 days or more',
    ]);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitForNames(FIVE);
    expect(select('Progress')).toHaveValue('');
    expect(select('Inactive for')).toHaveValue('');
    expect(document.activeElement?.tagName).toBe('SELECT');
  });

  it('no match: “Clear filters” in the line brings the list back', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.selectOptions(select('Progress'), 'Not started');
    await user.selectOptions(select('Inactive for'), '7 days or more');
    await waitForNames(['Karthik Rao']);
    await user.selectOptions(select('Progress'), 'Waiting for marking');
    await user.selectOptions(select('Inactive for'), '14 days or more');
    const line = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('.xr-section-body p.xr-body');
      expect(found).toHaveTextContent(STUDENTS_STATES.noMatch);
      return found!;
    });
    await user.click(within(line).getByRole('button', { name: 'Clear filters' }));
    await waitForNames(FIVE);
    expect(document.activeElement?.tagName).toBe('SELECT');
  });
});

// ---- FA-22: Export CSV (f2) ---------------------------------------------------------------------

describe('FA-22 Export CSV (B4-10 f2)', () => {
  it('exports the filtered list: the browser saves the service’s file; the message counts it', async () => {
    const { runtime, sample } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    const message = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('#faculty-students-export');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(vi.mocked(downloadCsv)).toHaveBeenCalledTimes(1);
    const [fileName, csv] = vi.mocked(downloadCsv).mock.calls[0]!;
    expect(fileName).toBe('students-shell-and-tube-heat-exchanger.csv');
    const service = ok(
      await asPersonId(sample, RANGANATHAN).teaching.exportStudentsCsv({ experimentId: SHELL }),
    );
    expect(csv).toBe(service.csv);
    expect(message).toHaveAttribute('tabindex', '-1');
    expect(message).toHaveFocus();
    const notice = message.querySelector('.xr-notice')!;
    expect(notice).toHaveClass('xr-notice', 'xr-notice--ok');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice.querySelector('.xr-notice-title')).toHaveTextContent(
      'Exported students-shell-and-tube-heat-exchanger.csv · 5 rows',
    );
    expect(text(notice.querySelector('.xr-notice-body > span:last-child'))).toBe(
      'Columns: student, student ID, experiment, WEB, VR, assessment, result released to student, last activity. It contains the filtered list only.',
    );

    // The filter on show is the file's: a filter change takes the message away (FA-20.filters).
    await user.selectOptions(select('Inactive for'), '14 days or more');
    await waitForNames(['Imran Shaikh', 'Karthik Rao']);
    expect(main().querySelector('#faculty-students-export')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(main().querySelector('#faculty-students-export .xr-notice-title')).toHaveTextContent(
        'Exported students-shell-and-tube-heat-exchanger.csv · 2 rows',
      ),
    );
    const second = vi.mocked(downloadCsv).mock.calls[1]![1];
    expect(csvShape(second).rows).toBe(2);
    expect(second).toContain('Imran Shaikh');
    expect(second).not.toContain('Rahul Verma');
  });

  it('a failed export says so in place and keeps Export CSV to try again', async () => {
    const { runtime, sample } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    faults(sample).failNext('TeachingService.exportStudentsCsv');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export CSV' }));
    const notice = await waitFor(() => {
      const found = main().querySelector('#faculty-students-export .xr-notice--err');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(notice).toHaveTextContent(
      'The file wasn’t made. Nothing was lost.Try Export CSV again. If it keeps happening, report a problem from Help.',
    );
    expect(vi.mocked(downloadCsv)).not.toHaveBeenCalled();
  });

  it('reads a CSV’s records as written: quoted commas and line breaks stay in one cell', () => {
    expect(csvShape('a,b\r\n"x, y","two\nlines"\r\n\'=z,w\r\n')).toEqual({
      columns: ['a', 'b'],
      rows: 2,
    });
    expect(csvShape('student,"say ""hi"""\r\n')).toEqual({
      columns: ['student', 'say "hi"'],
      rows: 0,
    });
    expect(daysBetween('2026-10-27T04:30:00.000Z', '2026-11-12T04:30:00.000Z')).toBe(16);
    expect(daysBetween('2026-11-12T04:30:00.000Z', '2026-10-27T04:30:00.000Z')).toBe(0);
  });
});

// ---- FA-20: the undrawn states and f6 -----------------------------------------------------------

describe('FA-20 — no students yet (f6) and the undrawn states', () => {
  it('f6: before anyone is given the experiment, “0 of 0 students” and the empty state', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-setup');
    showStudents(runtime);
    const empty = await screen.findByRole(
      'heading',
      { level: 3, name: STUDENTS_STATES.emptyTitle },
      { timeout: 5000 },
    );
    expect(empty.closest('.xr-empty')).toHaveTextContent(STUDENTS_STATES.emptyLine);
    expect(status()).toBe('0 of 0 students');
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('no experiment taught: the empty state, no Export CSV, no date', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showStudents(runtime);
    expect(
      await screen.findByRole(
        'heading',
        { level: 2, name: 'Your Institute Admin hasn’t assigned you courses yet' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Students appear here when they assign you one in Faculty courses.',
    );
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      /^Students who have the experiments you teach$/,
    );
  });

  it('loading is announced; a failed list says so and “Try again” reads it again', async () => {
    const { runtime, sample } = await fiveStudents();
    faults(sample).failNext('TeachingService.listStudents');
    showStudents(runtime);
    await studentsHeading();
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('The students didn’t load. Nothing was lost.');
    expect(failed).toHaveTextContent(
      'Try again. If it keeps happening, report a problem from Help.',
    );
    await userEvent.setup().click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitForNames(FIVE);
  });

  it('the experiments failing to load is the same failed state', async () => {
    const { runtime, sample } = await fiveStudents();
    faults(sample).failNext('AssessmentService.getCreateOptions');
    renderInTab(<FacultyStudents />, { runtime, navigation: testNavigation(STUDENTS) });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading students',
    );
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('The students didn’t load. Nothing was lost.');
    await userEvent.setup().click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitForNames(FIVE);
  });

  it('assessment words: an attempt in progress, marked (released or not), never a score', async () => {
    const { runtime, sample, assessmentId, rahulAttempt } = await fiveStudents();
    setSampleNow(sample, at('2026-11-12 10:00'));
    await attempt(sample, DIVYA, assessmentId, '2026-11-12 10:00', null);
    await markAndConfirm(sample, rahulAttempt);
    setSampleNow(sample, at('2026-11-12 10:30'));
    showStudents(runtime);
    await waitForNames(FIVE);
    const cell = (name: string) =>
      parts(
        screen
          .getByRole('link', { name: `Open ${name}` })
          .closest('tr')!
          .querySelectorAll('td')[3]!,
      );
    expect(cell('Divya Menon')).toBe('Attempt in progress');
    expect(cell('Rahul Verma')).toBe('Marked');
    expect(
      screen
        .getByRole('link', { name: 'Open Rahul Verma' })
        .closest('tr')!
        .querySelector('.xr-status--ok'),
    ).not.toBeNull();
  });

  it('no assessment set: “No assessment yet” (after Flow C, Rahul only)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudents(runtime);
    await waitForNames(['Rahul Verma']);
    expect(status()).toBe('1 of 1 student');
    expect((await rows())[0]).toEqual([
      'Rahul Verma GIT-2026-0418',
      'Completed 14 Oct 2026',
      'Completed 20 Oct 2026',
      'No assessment yet',
      '16 Oct 2026',
    ]);
  });
});

// ---- A co-teaching colleague (OD-B4-17) ---------------------------------------------------------

describe('a co-teaching colleague’s assessment (Phase 4B protective refusal)', () => {
  it('FA-20 and FA-21 say it isn’t available yet — never a state or figure', async () => {
    // Dr Desai's tab on the five-student world; Meera then gives her the course too.
    const { runtime, sample } = await fiveStudents(DESAI);
    ok(
      await asPersonId(sample, MEERA).facultyCourses.assign({
        facultyId: DESAI as PersonId,
        courseId: 'thermodynamics-heat-transfer' as CourseId,
      }),
    );
    const list = showStudents(runtime);
    await waitForNames(FIVE);
    const rahul = screen.getByRole('link', { name: 'Open Rahul Verma' }).closest('tr')!;
    expect(text(rahul.querySelectorAll('td')[3]!)).toBe('Not available to you yet');
    expect(rahul.querySelectorAll('td')[3]!.querySelector('.xr-status')).toBeNull();
    list.view.unmount();

    showStudent(runtime, RAHUL);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    expect(text(assessment.querySelector('.xr-section-body p'))).toBe(
      'This assessment isn’t available to you yet.',
    );
    expect(within(assessment).queryAllByRole('link')).toHaveLength(0);
    expect(assessment.textContent).not.toMatch(/ATT-|of 16|Waiting/);
  });
});

// ---- FA-21 Student detail (f3 … f5) -------------------------------------------------------------

describe('FA-21 Student detail (B4-10 f3 … f5)', () => {
  it('f3: waiting for marking — per format, the attempt, “Mark their answers”, the resources', async () => {
    const { runtime, rahulAttempt } = await fiveStudents();
    showStudent(runtime, RAHUL);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rahul Verma' }, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Rahul Verma');
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect([...crumbs.querySelectorAll('li')].map((item) => text(item))).toEqual([
      'Students/',
      'Rahul Verma',
    ]);
    const back = main().querySelector('a.xr-back')!;
    expect(back).toHaveTextContent(/^Students$/);
    expect(back).toHaveAttribute('href', `${STUDENTS}?experimentId=${SHELL}`);
    const head = main().querySelector('.xr-phead')!;
    expect(head).toHaveClass('mt-2');
    expect(head.querySelector('.xr-overline')).toHaveTextContent(`${SHELL_NAME} · ME ZG523`);
    expect(text(head.querySelector('.xr-phead-meta'))).toBe('GIT-2026-0418');
    expect(head.querySelector('.xr-phead-meta .xr-id')).toHaveTextContent('GIT-2026-0418');
    expect(head.querySelector('.xa-tag')).toBeNull();

    expect(
      [...main().querySelectorAll('.xw-stack > section.xr-section h2')].map((h) => h.textContent),
    ).toEqual(['Progress by format', 'Assessment', 'Resources']);
    const progress = screen.getByRole('list', { name: 'Progress by format' });
    expect(progress).toHaveClass('xl-fl');
    expect([...progress.querySelectorAll(':scope > li')].map((row) => parts(row))).toEqual([
      'WEBWEB Completed 14 Oct 2026',
      'VRVR Completed 20 Oct 2026',
    ]);
    expect(progress.querySelector('.xl-fl-fmt .xr-fmt')).toHaveClass(
      'xr-fmt--yours',
      'xr-fmt--compact',
    );
    expect(progress.parentElement!.querySelector('p.xl-meta')).toHaveTextContent(
      STUDENT_DETAIL.perFormatOnly,
    );

    const assessment = screen.getByRole('region', { name: 'Assessment' });
    const row = await within(assessment).findByRole('listitem');
    expect(row).toHaveClass('xr-row');
    expect(row.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--wait');
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(`${NAME} · attempt 1 of 2`);
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      `${rahulAttempt} · submitted 5 Nov 2026, 18:52 · Waiting for marking`,
    );
    expect(row.querySelector('.xr-row-sub .xr-id')).toHaveTextContent(rahulAttempt);
    expect(row.querySelector('.xr-row-sub .xr-status')).toHaveClass('xr-status--wait');
    const mark = within(row).getByRole('link', { name: 'Mark their answers' });
    expect(mark).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(mark).toHaveAttribute('href', `/faculty/marking/${rahulAttempt}`);
    expect(main().textContent).not.toMatch(/\bof 16\b|%/);

    const resources = screen.getByRole('region', { name: 'Resources' });
    expect([...resources.querySelectorAll('dt')].map((dt) => text(dt))).toEqual([
      'Lab brief — Shell-and-Tube Heat Exchanger',
      'Pre-lab reading — the effectiveness–NTU method',
      'Readings sheet',
    ]);
    expect([...resources.querySelectorAll('dd')].map((dd) => text(dd))).toEqual([
      'Opened 12 Oct 2026, 09:40',
      'Not opened',
      'Not opened',
    ]);
    expect(main().querySelector('.xw-stack > p.xl-open')).toHaveTextContent(
      'Feedback students give on a format isn’t shown to Faculty.',
    );
  });

  it('f4: marked, not released yet — the marks, the pinned release term and “See submission”', async () => {
    const { runtime, sample, rahulAttempt } = await fiveStudents();
    await markAndConfirm(sample, rahulAttempt);
    showStudent(runtime, RAHUL);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    const row = await within(assessment).findByRole('listitem');
    await waitFor(() => expect(row.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--ok'));
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      'Marked 11 of 16 · Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59',
    );
    expect(row.querySelector('.xr-row-sub .xl-inline svg')).not.toBeNull();
    const see = within(row).getByRole('link', { name: 'See submission' });
    expect(see).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    // B4-10 f4 links B4-06: the assessment's Submissions (FA-12).
    expect(see.getAttribute('href')).toMatch(/^\/faculty\/assessments\/ASMT-\d{4}\/submissions$/);
    expect(rahulAttempt).toBeTruthy();
    expect(within(row).queryByRole('link', { name: 'Mark their answers' })).toBeNull();
  });

  it('f5: an inactive Student — the tag, nothing started, nothing opened', async () => {
    const { runtime } = await fiveStudents();
    showStudent(runtime, KARTHIK);
    await screen.findByRole('heading', { level: 1, name: 'Karthik Rao' }, { timeout: 5000 });
    await waitFor(() =>
      expect(main().querySelector('.xr-phead-meta .xa-tag')).toHaveTextContent(
        'No activity since access was given (27 Oct 2026) · 16 days',
      ),
    );
    expect(main().querySelector('.xr-phead-meta .xa-tag')).toHaveClass('xa-tag--draft');
    expect(
      [
        ...screen.getByRole('list', { name: 'Progress by format' }).querySelectorAll(':scope > li'),
      ].map((row) => parts(row)),
    ).toEqual(['WEBWEB Not started', 'VRVR Not started']);
    const assessment = screen.getByRole('region', { name: 'Assessment' });
    expect(text(assessment.querySelector('.xr-section-body p.xr-body'))).toBe('Not started.');
    expect(within(assessment).queryAllByRole('link')).toHaveLength(0);
    expect(
      [...screen.getByRole('region', { name: 'Resources' }).querySelectorAll('dd')].map((dd) =>
        text(dd),
      ),
    ).toEqual(['Not opened', 'Not opened', 'Not opened']);
  });

  it('a Student inactive since their last activity: “No activity since <date> · <n> days”', async () => {
    const { runtime } = await fiveStudents();
    showStudent(runtime, IMRAN);
    await screen.findByRole('heading', { level: 1, name: 'Imran Shaikh' }, { timeout: 5000 });
    await waitFor(() =>
      expect(main().querySelector('.xr-phead-meta .xa-tag')).toHaveTextContent(
        'No activity since 28 Oct 2026 · 15 days',
      ),
    );
  });

  it('released (after Flow D): the marks and when the result reached the Student', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showStudent(runtime, RAHUL);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    const row = await within(assessment).findByRole('listitem');
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      'Marked 11 of 16 · Result released to Rahul 14 Nov 2026, 23:59',
    );
    expect(within(row).getByRole('link', { name: 'See submission' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009/submissions',
    );
  });

  it('an attempt in progress has no action; no assessment set reads “No assessment yet.”', async () => {
    const five = await fiveStudents();
    await attempt(five.sample, DIVYA, five.assessmentId, '2026-11-12 10:00', null);
    showStudent(five.runtime, DIVYA);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    const row = await within(assessment).findByRole('listitem');
    expect(text(row.querySelector('.xr-row-sub'))).toMatch(
      /^ATT-\d{4} · started 12 Nov 2026, 10:00 · Attempt in progress$/,
    );
    expect(within(row).queryAllByRole('link')).toHaveLength(0);
  });

  it('after Flow C (no assessment set): one line, no row', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudent(runtime, RAHUL);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    expect(text(assessment.querySelector('.xr-section-body p'))).toBe('No assessment yet.');
  });

  it('not found: no experiment in the address, an unknown Student, one without the experiment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const first = showStudent(runtime, RAHUL, '');
    await notFoundHeading();
    first.view.unmount();
    const second = showStudent(runtime, 'per-9999');
    await notFoundHeading();
    second.view.unmount();
    showStudent(runtime, 'per-0004'); // Arun Kumar: not given Shell-and-Tube.
    await notFoundHeading();
  });

  it('a failed read says so and “Try again” reads it again', async () => {
    const { runtime, sample } = await fiveStudents();
    faults(sample).failNext('TeachingService.getStudentDetail');
    showStudent(runtime, RAHUL);
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('The student’s details didn’t load. Nothing was lost.');
    await userEvent.setup().click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rahul Verma' }, { timeout: 5000 }),
    ).toBeVisible();
  });
});

// ---- Words, register, ledger --------------------------------------------------------------------

describe('FA-20 / FA-21 words, register and ledger', () => {
  it('the composed words are the board’s with its sample values', () => {
    const B4_10 = board('B4-10-Students-and-Follow-up.dc.html');
    expect(B4_10).toContain(
      exportedColumns([
        'student',
        'student ID',
        'experiment',
        'WEB',
        'VR',
        'assessment',
        'result released to student',
        'last activity',
      ]),
    );
    expect(exportedTitle('students-shell-and-tube.csv', 5)).toBe(
      'Exported students-shell-and-tube.csv · 5 rows',
    );
  });

  it('the register holds this group’s entries, provisional, no decision id in their words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_STUDENTS)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.words ?? '').not.toMatch(/\b(?:OD|T|PC|DEV|VD|BC|ATT)-?\d/);
    }
  });

  it('the ledger: FA-21’s one primary, every target a pattern of a built page', () => {
    const primaries = P4B_FACULTY_STUDENTS_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'FA-21 Mark their answers',
    ]);
    expect(
      P4B_FACULTY_STUDENTS_LINK_TARGETS.filter((entry) => entry.outcome === 'not-rendered'),
    ).toEqual([]);
  });
});
