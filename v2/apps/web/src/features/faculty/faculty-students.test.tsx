/**
 * FA-20 Students with FA-22 Export CSV, and FA-21 Student detail, as the owner-approved Faculty
 * export draws them (V3 Refined B, FA-v1 `Main.dc.html` FA-20, FA-21), on the real composition root
 * and the sample world. After Flow C only Rahul has Shell-and-Tube; the "five students" world below
 * moves it as the export's sample does: Meera gives Priya, Imran, Divya and Karthik the experiment,
 * the sample runtime reports their activity, Dr Ranganathan creates ASMT-0009 and Rahul and Priya
 * submit — then the sample clock reads 12 Nov 2026, so Imran (last active 28 Oct) and Karthik
 * (given 27 Oct, never active) are inactive for 14 days or more. The drawn states: the roster, its
 * summary and filters, the export, no match, no students yet, no course; the detail waiting for
 * marking, marked and not released, released, an inactive Student, a co-teacher. The undrawn ones:
 * loading, failed, not found, an attempt in progress. No attempt or assessment named by its
 * internal reference anywhere (the owner’s identifier rule).
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

import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_STUDENTS } from '@/copy/state-copy-faculty-students';
import { P4B_FACULTY_STUDENTS_LINK_TARGETS } from '@/nav/link-targets-p4b/faculty-students';
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
import { FacultyStudents } from './fa-20-students/students';
import { csvRecords, csvShape, daysBetween, formatCounts } from './fa-20-students/student-facts';
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
 * The five Students with Shell-and-Tube, as the export's sample, on the sample clock of after
 * Flow C: given 27 Oct, active until 28 Oct … 6 Nov; read on 12 Nov 2026, 10:00.
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
/** An element's words, its text nodes joined by spaces (cells and lines read as words). */
const words = (element: Element | null) => {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    parts.push(node.textContent ?? '');
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};
const studentsHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Students' }, { timeout: 5000 });
const notFoundHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });
const table = () =>
  screen.findByRole(
    'table',
    { name: 'Students who have the experiments you teach' },
    { timeout: 5000 },
  );
const status = () => text(main().querySelector('.rk-statusline [role="status"]'));
const select = (name: string) => screen.getByRole('combobox', { name });
const sidebarCurrent = () =>
  screen
    .getByRole('navigation', { name: 'Faculty navigation' })
    .querySelector('[aria-current="page"]');

/** The roster's rows as their cells' words. */
async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => words(cell)),
  );
}

async function names(): Promise<string[]> {
  const found = await table();
  return [...found.querySelectorAll('tbody a.rk-rowlink')].map((link) => text(link));
}

async function waitForNames(expected: string[]) {
  await waitFor(async () => expect(await names()).toEqual(expected), { timeout: 5000 });
}

const FIVE = ['Divya Menon', 'Imran Shaikh', 'Karthik Rao', 'Priya Natarajan', 'Rahul Verma'];

/** An internal reference: the Faculty’s ids (ASMT-, ATT-, Q-, D-) and every other role’s. */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

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

// ---- FA-20: the roster ----------------------------------------------------------------------------

describe('FA-20 Students — the roster as the export draws it', () => {
  it('the head, the surface, the summary, the filters and one row per Student, per format in words', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await studentsHeading();
    await waitForNames(FIVE);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toMatch(/^Students/);
    expect(sidebarCurrent()).toHaveAttribute('href', STUDENTS);
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      /^Students who have the experiments you teach, from Godavari Institute of Technology\.$/,
    );

    const section = screen.getByRole('region', { name: SHELL_NAME });
    expect(section).toHaveClass('rk-surface');
    // “As of …” — the teaching read's own instant.
    await waitFor(() =>
      expect(section.querySelector('.fa-tbar .rk-hint')).toHaveTextContent(
        /^As of 12 Nov 2026 · progress in words, per format$/,
      ),
    );
    const exportButton = within(section).getByRole('button', { name: 'Export CSV' });
    expect(exportButton).toHaveClass('rb-btn');
    expect(exportButton.parentElement).toHaveClass('fa-actions', 'fa-tbar-act');
    expect(exportButton.querySelector('svg.xr-ico')).not.toBeNull();

    // The summary: every Student with access, by format (one unit each).
    const summary = within(section).getByRole('group', {
      name: 'All 5 students with access, by format',
    });
    expect(summary).toHaveClass('fa-slsum');
    const meters = within(summary).getByRole('list', {
      name: 'Progress by format for all students with access to Shell-and-Tube Heat Exchanger',
    });
    expect(meters).toHaveClass('fa-prog', 'fa-prog--sum');
    expect([...meters.querySelectorAll(':scope > li')].map((row) => words(row))).toEqual([
      'WEB 2 completed 2 in progress 1 not started',
      'VR 1 completed 1 in progress 3 not started',
    ]);
    expect(
      [...meters.querySelectorAll(':scope > li')[0]!.querySelectorAll('.fa-units i')].map(
        (unit) => unit.className,
      ),
    ).toEqual(['is-done', 'is-done', 'is-prog', 'is-prog', '']);

    // One experiment taught: no Experiment filter (the export's `SL.multiExp`).
    expect(screen.queryByRole('combobox', { name: 'Experiment' })).toBeNull();
    expect(within(section).getByRole('search', { name: 'Filter students' })).toHaveClass(
      'rk-tools',
      'fa-tools',
    );
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
    expect(status()).toBe('5 students');
    expect(section.querySelector('.rk-chip')).toBeNull();

    const found = await table();
    expect(found).toHaveClass('rk-table', 'fa-table', 'fa-rtable', 'fa-ptable');
    expect(
      [...found.querySelectorAll('thead th')].map((th) => [th.textContent, th.className]),
    ).toEqual([
      ['Student', 'fa-c-who'],
      ['Progress by format', 'fa-c-fm'],
      ['Assessment', 'fa-c-asm'],
      ['Last activity', ''],
    ]);
    expect(await rows()).toEqual([
      [
        'Divya Menon GIT-2026-0411',
        'Progress by format WEB In progress VR Not started',
        'Assessment Not started',
        'Last activity 3 Nov 2026',
      ],
      [
        'Imran Shaikh GIT-2026-0409',
        'Progress by format WEB In progress VR Not started',
        'Assessment Not started',
        'Last activity 28 Oct 2026 Inactive 15 days',
      ],
      [
        'Karthik Rao GIT-2026-0415',
        'Progress by format WEB Not started VR Not started',
        'Assessment Not started',
        'Last activity None since access was given (27 Oct 2026) Inactive 16 days',
      ],
      [
        'Priya Natarajan GIT-2026-0431',
        'Progress by format WEB Completed 28 Oct 2026 VR In progress',
        'Assessment Waiting for marking Submitted 6 Nov 2026, 20:10',
        'Last activity 6 Nov 2026',
      ],
      [
        'Rahul Verma GIT-2026-0418',
        'Progress by format WEB Completed 14 Oct 2026 VR Completed 20 Oct 2026',
        'Assessment Waiting for marking Submitted 5 Nov 2026, 18:52',
        'Last activity 5 Nov 2026',
      ],
    ]);

    // The export's markup: the name link (“Open …”) to FA-21 for this experiment, the ID.
    const rahul = screen.getByRole('link', { name: 'Open Rahul Verma' });
    expect(rahul).toHaveClass('rk-rowlink');
    expect(rahul).toHaveAttribute('href', `${STUDENTS}/${RAHUL}?experimentId=${SHELL}`);
    expect(rahul.nextElementSibling).toHaveClass('fa-cellsub');
    const cells = rahul.closest('tr')!.querySelectorAll('td');
    const formats = cells[1]!.querySelector('ul.fa-fmcell')!;
    expect(formats).toHaveAttribute(
      'aria-label',
      'Progress by format: WEB completed 14 Oct 2026, VR completed 20 Oct 2026',
    );
    expect(formats.querySelector('.xr-fmt')).toHaveAttribute('aria-hidden', 'true');
    expect(formats.querySelector('.xr-st')).toHaveClass('xr-st--ok');
    expect(formats.querySelector('.fa-fmtcell-d')).toHaveTextContent('14 Oct 2026');
    expect(cells[2]!.querySelector('.xr-st')).toHaveClass('xr-st--warn');
    const karthik = screen.getByRole('link', { name: 'Open Karthik Rao' }).closest('tr')!;
    expect(karthik.querySelectorAll('td')[1]!.querySelector('.xr-st')!.className).toBe('xr-st');
    const tag = karthik.querySelector('.rk-tag-warn');
    expect(tag).toHaveTextContent('Inactive 16 days');
    expect(tag?.querySelector('svg')).not.toBeNull();
    expect(
      screen
        .getByRole('link', { name: 'Open Divya Menon' })
        .closest('tr')!
        .querySelector('.fa-c-main + td .xr-st'),
    ).toHaveClass('xr-st--info');
    // No percentage, no score before marking.
    expect(main().textContent).not.toMatch(/%|\bof 16\b/);
    expect(
      screen.getByText(
        'Contacting a student happens outside the platform. Feedback students give on a format isn’t shown to Faculty.',
      ),
    ).toHaveClass('rk-hint');
    expectNoReferences();
  });

  it('a press on a Student’s row follows its name link (not on another control)', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    const link = screen.getByRole('link', { name: 'Open Priya Natarajan' });
    const followed = vi.fn();
    link.addEventListener('click', (event) => {
      event.preventDefault();
      followed(link.getAttribute('href'));
    });
    await user.click(link.closest('tr')!.querySelectorAll('td')[3]!);
    expect(followed).toHaveBeenCalledWith(`${STUDENTS}/${PRIYA}?experimentId=${SHELL}`);
  });

  it('the address names the experiment; an experiment outside the teaching scope is not found', async () => {
    const { runtime } = await fiveStudents();
    const { navigation } = showStudents(runtime, `?experimentId=${SHELL}`);
    await waitForNames(FIVE);
    expect(screen.getByRole('region', { name: SHELL_NAME })).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();

    const other = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudents(other.runtime, '?experimentId=fin-tube-bundle');
    await notFoundHeading();
  });
});

// ---- FA-20: the filters -------------------------------------------------------------------------

describe('FA-20 — Progress and “Inactive for”', () => {
  it('inactive 14 days or more: two of five, the chip and Clear filters', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.selectOptions(select('Inactive for'), '14 days or more');
    await waitForNames(['Imran Shaikh', 'Karthik Rao']);
    expect(status()).toBe('2 of 5 students');
    const chip = main().querySelector('.rk-chip')!;
    expect(chip).toHaveTextContent('Inactive 14 days or more');
    expect(
      within(chip as HTMLElement).getByRole('button', {
        name: 'Remove filter Inactive 14 days or more',
      }),
    ).toBeVisible();
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    expect(clear).toHaveClass('rk-clear');

    // 30 days or more: with no activity the service counts the days since access was given —
    // Karthik has had the experiment 16 days, so nobody matches.
    await user.selectOptions(select('Inactive for'), '30 days or more');
    await waitFor(() => expect(status()).toBe('0 of 5 students'), { timeout: 5000 });
    const none = main().querySelector('.rk-state')!;
    expect(words(none)).toBe(
      'No student matches these filters Try a shorter inactivity period or another progress filter. Clear filters',
    );
    expect(screen.queryByRole('table')).toBeNull();
    // No rows on show: no Export CSV (the export's `SL.hasRows`).
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();

    // Removing the chip brings everyone back; focus goes to the filter it set.
    await user.click(
      screen.getByRole('button', { name: 'Remove filter Inactive 30 days or more' }),
    );
    await waitForNames(FIVE);
    expect(main().querySelector('.rk-chip')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect(select('Inactive for')).toHaveFocus();
    expect(status()).toBe('5 students');
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
    expect(main().querySelector('.rk-chip')).toHaveTextContent('Progress: Not started');
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
    expect([...main().querySelectorAll('.rk-chip')].map((chip) => text(chip))).toEqual([
      'Progress: In progress in a format',
      'Inactive 7 days or more',
    ]);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitForNames(FIVE);
    expect(select('Progress')).toHaveValue('');
    expect(select('Inactive for')).toHaveValue('');
    expect(select('Progress')).toHaveFocus();
  });

  it('no match: “Clear filters” in the state brings the list back', async () => {
    const { runtime } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.selectOptions(select('Progress'), 'Not started');
    await user.selectOptions(select('Inactive for'), '7 days or more');
    await waitForNames(['Karthik Rao']);
    await user.selectOptions(select('Progress'), 'Waiting for marking');
    await user.selectOptions(select('Inactive for'), '14 days or more');
    const state = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('.rk-state');
      expect(found).toHaveTextContent('No student matches these filters');
      return found!;
    });
    await user.click(within(state).getByRole('button', { name: 'Clear filters' }));
    await waitForNames(FIVE);
    expect(select('Progress')).toHaveFocus();
  });
});

// ---- FA-22: Export CSV ---------------------------------------------------------------------------

describe('FA-22 Export CSV on FA-20', () => {
  it('exports the filtered list: the browser saves the service’s file; the band shows its rows', async () => {
    const { runtime, sample } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    const notice = await waitFor(() => {
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
    expect(notice).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(notice).toHaveAttribute('tabindex', '-1');
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveFocus();
    expect(notice.parentElement).toHaveClass('fa-export');
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent(
      'Exported students-shell-and-tube-heat-exchanger.csv · 5 rows',
    );
    expect(text(notice.querySelector('.rk-notice-d'))).toBe(
      'It contains the filtered list only, as it was when you exported it. Columns: student, student ID, experiment, WEB, VR, assessment, result released to student, last activity.',
    );
    const preview = screen.getByRole('region', { name: 'Rows in the exported file' });
    expect(preview).toHaveClass('fa-scrollx');
    expect(preview).toHaveAttribute('tabindex', '0');
    const file = csvRecords(service.csv);
    expect([...preview.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(
      file.columns,
    );
    expect(
      [...preview.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent),
      ),
    ).toEqual(file.rows);
    expect(file.rows).toHaveLength(5);

    // The filter on show is the file's: a filter change takes the band away (FA-20.filters).
    await user.selectOptions(select('Inactive for'), '14 days or more');
    await waitForNames(['Imran Shaikh', 'Karthik Rao']);
    expect(main().querySelector('#faculty-students-export')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(main().querySelector('#faculty-students-export .rk-notice-t')).toHaveTextContent(
        'Exported students-shell-and-tube-heat-exchanger.csv · 2 rows',
      ),
    );
    const second = vi.mocked(downloadCsv).mock.calls[1]![1];
    expect(csvShape(second).rows).toBe(2);
    expect(second).toContain('Imran Shaikh');
    expect(second).not.toContain('Rahul Verma');
    expectNoReferences();
  });

  it('a failed export says so in place and keeps Export CSV to try again', async () => {
    const { runtime, sample } = await fiveStudents();
    showStudents(runtime);
    await waitForNames(FIVE);
    faults(sample).failNext('TeachingService.exportStudentsCsv');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Export CSV' }));
    const notice = await waitFor(() => {
      const found = main().querySelector('#faculty-students-export');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(notice).toHaveClass('rk-notice');
    expect(notice).toHaveAttribute('role', 'alert');
    expect(words(notice)).toBe(
      'The file wasn’t made. Nothing was lost. Try Export CSV again. If it keeps happening, report a problem from Help.',
    );
    expect(notice).toHaveFocus();
    expect(vi.mocked(downloadCsv)).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeVisible();
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
    expect(csvRecords('﻿student,id\r\n"Rao, K",GIT-1\r\n')).toEqual({
      columns: ['student', 'id'],
      rows: [['Rao, K', 'GIT-1']],
    });
    expect(daysBetween('2026-10-27T04:30:00.000Z', '2026-11-12T04:30:00.000Z')).toBe(16);
    expect(daysBetween('2026-11-12T04:30:00.000Z', '2026-10-27T04:30:00.000Z')).toBe(0);
  });
});

// ---- FA-20: no students, no course, the undrawn states ---------------------------------------------

describe('FA-20 — no students yet, no course and the undrawn states', () => {
  it('before anyone is given the experiment: the empty state, no filters, no export', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-setup');
    showStudents(runtime);
    const empty = await screen.findByText(
      'No students have this experiment yet',
      {},
      { timeout: 5000 },
    );
    const state = empty.closest('.rk-state')!;
    expect(state).toHaveClass('rk-state--roomy');
    expect(state).toHaveTextContent(
      'Students appear here when your Institute Admin gives them the experiment.',
    );
    expect(screen.queryByRole('search')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('no experiment taught: the message card, no Export CSV, no date, no note', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showStudents(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'No students to follow yet' },
      { timeout: 5000 },
    );
    expect(title.closest('section')).toHaveClass('rk-surface', 'fa-msgcard');
    expect(main()).toHaveTextContent(
      'Students appear here when you teach a course and your Institute Admin gives them its experiments. You haven’t been assigned a course yet.',
    );
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      /^Students who have the experiments you teach\.$/,
    );
    expect(main()).not.toHaveTextContent('Contacting a student happens outside the platform.');
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

  it('assessment words: an attempt in progress; marked, with the total and whether it is released', async () => {
    const { runtime, sample, assessmentId, rahulAttempt } = await fiveStudents();
    setSampleNow(sample, at('2026-11-12 10:00'));
    await attempt(sample, DIVYA, assessmentId, '2026-11-12 10:00', null);
    await markAndConfirm(sample, rahulAttempt);
    setSampleNow(sample, at('2026-11-12 10:30'));
    showStudents(runtime);
    await waitForNames(FIVE);
    const cell = (name: string) =>
      screen
        .getByRole('link', { name: `Open ${name}` })
        .closest('tr')!
        .querySelectorAll('td')[2]!;
    expect(words(cell('Divya Menon'))).toBe('Assessment Attempt in progress');
    expect(cell('Divya Menon').querySelector('.xr-st')).toHaveClass('xr-st--info');
    await waitFor(() =>
      expect(words(cell('Rahul Verma'))).toBe(
        'Assessment Marked 11 of 16 · result not released yet',
      ),
    );
    expect(cell('Rahul Verma').querySelector('.xr-st')).toHaveClass('xr-st--ok');
  });

  it('no assessment set: “No assessment yet” (after Flow C, Rahul only)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudents(runtime);
    await waitForNames(['Rahul Verma']);
    expect(status()).toBe('1 student');
    expect((await rows())[0]).toEqual([
      'Rahul Verma GIT-2026-0418',
      'Progress by format WEB Completed 14 Oct 2026 VR Completed 20 Oct 2026',
      'Assessment No assessment yet',
      'Last activity 16 Oct 2026',
    ]);
  });

  it('the summary’s counts per format (state-copy FA-20.summary)', () => {
    const row = (statuses: Record<string, string>) =>
      ({
        perFormat: Object.entries(statuses).map(([format, status]) => ({ format, status })),
      }) as never;
    expect(
      formatCounts([
        row({ web: 'completed', vr: 'in-progress' }),
        row({ web: 'not-started', vr: 'in-progress' }),
      ]),
    ).toEqual([
      { format: 'web', completed: 1, inProgress: 0, notStarted: 1 },
      { format: 'vr', completed: 0, inProgress: 2, notStarted: 0 },
    ]);
  });
});

// ---- A co-teaching colleague (OD-B4-17) ---------------------------------------------------------

describe('a co-teaching colleague’s assessment (Phase 4B protective refusal)', () => {
  it('FA-20 and FA-21 say it isn’t available yet — never a state, figure or mark action', async () => {
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
    expect(words(rahul.querySelectorAll('td')[2]!)).toBe('Assessment Not available to you yet');
    expect(rahul.querySelectorAll('td')[2]!.querySelector('.xr-st')).toBeNull();
    list.view.unmount();

    showStudent(runtime, RAHUL);
    const panel = await screen.findByRole(
      'complementary',
      { name: 'Assessment' },
      { timeout: 5000 },
    );
    await waitFor(() =>
      expect(text(panel.querySelector('p.rk-locked'))).toBe(
        'This assessment isn’t available to you yet.',
      ),
    );
    // A colleague's rules are readable: only “Open the assessment”.
    expect(
      within(panel)
        .getAllByRole('link')
        .map((link) => text(link)),
    ).toEqual(['Open the assessment']);
    expect(panel.querySelector('.xr-st')).toBeNull();
    expect(panel.textContent).not.toMatch(/ATT-|of 16|Waiting|Marked/);
  });
});

// ---- FA-21 Student detail --------------------------------------------------------------------------

describe('FA-21 Student detail', () => {
  it('waiting for marking — the head, per format, the resources, the panel with “Mark their answers”', async () => {
    const { runtime, rahulAttempt, assessmentId } = await fiveStudents();
    showStudent(runtime, RAHUL);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Rahul Verma' }, { timeout: 5000 }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toMatch(/^Rahul Verma/);
    expect(sidebarCurrent()).toHaveAttribute('href', STUDENTS);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Students' })).toHaveAttribute(
      'href',
      `${STUDENTS}?experimentId=${SHELL}`,
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Rahul Verma');
    const head = main().querySelector('.rk-head')!;
    expect(head.querySelector('.rk-eyebrow')).toHaveTextContent(`${SHELL_NAME} · ME ZG523`);
    expect(head.querySelector('h1')).toHaveClass('rk-title');
    expect(words(head.querySelector('.rk-meta'))).toBe('GIT-2026-0418 Last activity 5 Nov 2026');
    expect(head.querySelector('.rk-meta .fa-id')).toHaveTextContent('GIT-2026-0418');
    expect(head.querySelector('.rk-tag-warn')).toBeNull();

    // The sheet beside the panel; the panel first on narrow widths.
    expect(main().querySelector('.rk-detail')).toHaveClass('fa-asidefirst');
    const sheet = main().querySelector('.rk-detail > .rk-mainsheet')!;
    expect([...sheet.querySelectorAll('section.rk-sec h2')].map((h) => h.textContent)).toEqual([
      'Progress by format',
      'Resources',
    ]);
    await waitFor(() =>
      expect(sheet.querySelector('section.rk-sec .rk-sec-h .rk-hint')).toHaveTextContent(
        'as of 12 Nov 2026',
      ),
    );
    const progress = screen.getByRole('list', { name: 'Progress by format' });
    expect(progress).toHaveClass('fa-fmlist');
    expect([...progress.querySelectorAll(':scope > li')].map((row) => words(row))).toEqual([
      'WEB Completed 14 Oct 2026',
      'VR Completed 20 Oct 2026',
    ]);
    expect(sheet).toHaveTextContent('Per format only — there is no overall percentage or verdict.');
    const resources = sheet.querySelector('ul.fa-reslist.fa-reslist--status')!;
    expect([...resources.querySelectorAll('li')].map((row) => words(row))).toEqual([
      'Lab brief — Shell-and-Tube Heat Exchanger Opened 12 Oct 2026, 09:40',
      'Pre-lab reading — the effectiveness–NTU method Not opened',
      'Readings sheet Not opened',
    ]);
    expect(resources.querySelector('li .rk-next')).toHaveTextContent('Opened 12 Oct 2026, 09:40');
    expect(sheet).toHaveTextContent('Feedback students give on a format isn’t shown to Faculty.');

    const panel = screen.getByRole('complementary', { name: 'Assessment' });
    expect(panel.querySelector('.rk-panel-body')).toHaveClass('fa-apanel');
    await waitFor(() =>
      expect(words(panel.querySelector('.fa-apanel-id'))).toBe(
        `Waiting for marking ${NAME} Due 14 Nov 2026, 23:59`,
      ),
    );
    expect(panel.querySelector('.fa-apanel-id .xr-st')).toHaveClass('xr-st--warn');
    expect(text(panel.querySelector('.fa-asm-note'))).toBe(
      'Attempt 1 of 2 · submitted 5 Nov 2026, 18:52',
    );
    const mark = within(panel).getByRole('link', { name: 'Mark their answers' });
    expect(mark).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(mark).toHaveAttribute('href', `/faculty/marking/${rahulAttempt}`);
    expect(within(panel).getByRole('link', { name: 'Open the assessment' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${assessmentId}`,
    );
    expect(main().textContent).not.toMatch(/\bof 16\b|%/);
    expectNoReferences();
  });

  it('marked, not released yet — the total, the pass outcome, the pinned release term and “View marks”', async () => {
    const { runtime, sample, rahulAttempt } = await fiveStudents();
    await markAndConfirm(sample, rahulAttempt);
    showStudent(runtime, RAHUL);
    const panel = await screen.findByRole(
      'complementary',
      { name: 'Assessment' },
      { timeout: 5000 },
    );
    await waitFor(() =>
      expect(panel.querySelector('.fa-apanel-id .xr-st')).toHaveClass('xr-st--ok'),
    );
    expect(text(panel.querySelector('.fa-apanel-id .xr-st'))).toBe('Marked');
    await waitFor(() =>
      expect(words(panel.querySelector('.fa-done-total'))).toBe(
        '11 of 16 marks Passed · pass mark 8',
      ),
    );
    expect(panel.querySelector('p.rk-locked')).toHaveTextContent(
      'Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59, as set for this assessment.',
    );
    const view = within(panel).getByRole('link', { name: 'View marks' });
    expect(view).toHaveClass('rb-btn', 'rb-btn--lg');
    expect(view).not.toHaveClass('rb-btn--primary');
    expect(view).toHaveAttribute('href', `/faculty/marking/${rahulAttempt}`);
    expect(within(panel).queryByRole('link', { name: 'Mark their answers' })).toBeNull();
    expectNoReferences();
  });

  it('an inactive Student — the activity line, the tag, nothing started, nothing opened', async () => {
    const { runtime } = await fiveStudents();
    showStudent(runtime, KARTHIK);
    await screen.findByRole('heading', { level: 1, name: 'Karthik Rao' }, { timeout: 5000 });
    await waitFor(() =>
      expect(words(main().querySelector('.rk-head .rk-meta'))).toBe(
        'GIT-2026-0415 No activity since access was given (27 Oct 2026) Inactive 16 days',
      ),
    );
    expect(main().querySelector('.rk-meta .rk-tag-warn svg')).not.toBeNull();
    expect(
      [
        ...screen.getByRole('list', { name: 'Progress by format' }).querySelectorAll(':scope > li'),
      ].map((row) => words(row)),
    ).toEqual(['WEB Not started', 'VR Not started']);
    const panel = screen.getByRole('complementary', { name: 'Assessment' });
    await waitFor(() =>
      expect(text(panel.querySelector('.fa-asm-note'))).toBe(
        '2 attempts allowed. No attempt submitted yet.',
      ),
    );
    expect(text(panel.querySelector('.fa-apanel-id .xr-st'))).toBe('Not started');
    expect(
      within(panel)
        .getAllByRole('link')
        .map((link) => text(link)),
    ).toEqual(['Open the assessment']);
    expect(
      [...main().querySelectorAll('ul.fa-reslist li')].map(
        (row) => row.querySelector('.fa-quiet')?.textContent,
      ),
    ).toEqual(['Not opened', 'Not opened', 'Not opened']);
  });

  it('a Student inactive since their last activity: “Last activity …” and “Inactive 15 days”', async () => {
    const { runtime } = await fiveStudents();
    showStudent(runtime, IMRAN);
    await screen.findByRole('heading', { level: 1, name: 'Imran Shaikh' }, { timeout: 5000 });
    await waitFor(() =>
      expect(words(main().querySelector('.rk-head .rk-meta'))).toBe(
        'GIT-2026-0409 Last activity 28 Oct 2026 Inactive 15 days',
      ),
    );
  });

  it('released (after Flow D): the total and when the result reached the Student', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showStudent(runtime, RAHUL);
    const panel = await screen.findByRole(
      'complementary',
      { name: 'Assessment' },
      { timeout: 5000 },
    );
    await waitFor(() =>
      expect(panel.querySelector('p.fa-savednote')).toHaveTextContent(
        'Result released to Rahul when the deadline passed: 14 Nov 2026, 23:59.',
      ),
    );
    await waitFor(() =>
      expect(words(panel.querySelector('.fa-done-total'))).toBe(
        '11 of 16 marks Passed · pass mark 8',
      ),
    );
    expect(within(panel).getByRole('link', { name: 'View marks' })).toHaveAttribute(
      'href',
      '/faculty/marking/ATT-0450',
    );
    expect(within(panel).getByRole('link', { name: 'Open the assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    expectNoReferences();
  });

  it('an attempt in progress has no action', async () => {
    const five = await fiveStudents();
    await attempt(five.sample, DIVYA, five.assessmentId, '2026-11-12 10:00', null);
    showStudent(five.runtime, DIVYA);
    const panel = await screen.findByRole(
      'complementary',
      { name: 'Assessment' },
      { timeout: 5000 },
    );
    await waitFor(() =>
      expect(text(panel.querySelector('.fa-apanel-id .xr-st'))).toBe('Attempt in progress'),
    );
    expect(panel.querySelector('.fa-apanel-id .xr-st')).toHaveClass('xr-st--info');
    expect(text(panel.querySelector('.fa-asm-note'))).toBe(
      'Attempt 1 of 2 · started 12 Nov 2026, 10:00',
    );
    expect(
      within(panel)
        .getAllByRole('link')
        .map((link) => text(link)),
    ).toEqual(['Open the assessment']);
    expectNoReferences();
  });

  it('after Flow C (no assessment set): the state and its line, no link', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showStudent(runtime, RAHUL);
    const panel = await screen.findByRole(
      'complementary',
      { name: 'Assessment' },
      { timeout: 5000 },
    );
    expect(text(panel.querySelector('.fa-apanel-id .xr-st'))).toBe('No assessment yet');
    expect(text(panel.querySelector('.fa-asm-note'))).toBe(
      'There’s no assessment for this experiment yet.',
    );
    expect(within(panel).queryAllByRole('link')).toHaveLength(0);
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

// ---- Register and ledger -------------------------------------------------------------------------

describe('FA-20 / FA-21 register and ledger', () => {
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
