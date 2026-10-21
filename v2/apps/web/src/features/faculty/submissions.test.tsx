/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-12 Submissions · FA-22 Export"; earlier board B4-06 f7 … f11), and the record's
 * Phase-4B actions on FA-08 (B4-05 f0, f4), on the real composition root and the sample world, as
 * Dr S. Ranganathan (per-0014). After Flow C he creates ASMT-0009 (the walk's D1) through the
 * assessments port; Meera Iyer gives Priya Natarajan Shell-and-Tube; Rahul Verma and Priya answer
 * and submit through their own ports at the board's times (f7); Ranganathan marks and confirms
 * Rahul's written answer through the marking port (f8). After Flow D, Rahul's ATT-0450 is released
 * after the deadline (f9). The filter is in-page; "Export CSV" saves the service's file in the
 * browser and confirms it (f10); no submission yet is f11. A co-teaching colleague's assessment is
 * held back calmly (OD-B4-17).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts, Result, ServiceError } from '@xr/contracts/draft';
import type { AssessmentId, AttemptId, CourseId, ExperimentId, QuestionId } from '@xr/domain';
import { asPersonId, faults, setSampleNow } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SUBMISSIONS_WORDS, SUMMARY_ACTIONS } from '@/copy/submissions';
import { stateWords } from '@/copy/state-copy';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { P4B_SUBMISSIONS_LINK_TARGETS } from '@/nav/link-targets-p4b/submissions';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  PERSON_OF_ROLE,
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AssessmentSummary } from './fa-08-assessment-summary/assessment-summary';
import { AssessmentSubmissions, csvCells, csvRowCount } from './fa-12-submissions/submissions';

const RANGANATHAN = PERSON_OF_ROLE.faculty;
const MEERA = 'per-0001';
const RAHUL = 'per-0002';
const PRIYA = 'per-0003';
const DESAI = 'per-0015';
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';
const RAHUL_WRITTEN =
  'In the WEB run I turned the fouling up and kept both flow rates the same. Fouling is an extra layer of resistance, so U goes down.';
const PRIYA_WRITTEN =
  'Fouling builds up on the tubes and acts like insulation. The overall coefficient U drops.';

// ---- The browser's file download (jsdom has no object URLs) -----------------------------------

const saved: { name: string; blob: Blob }[] = [];
let lastBlob: Blob | null = null;

beforeEach(() => {
  saved.length = 0;
  Object.assign(URL, {
    createObjectURL: vi.fn((blob: Blob) => {
      lastBlob = blob;
      return 'blob:submissions';
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    if (this.download && lastBlob) saved.push({ name: this.download, blob: lastBlob });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  forgetLastAddress();
});

// ---- The one world --------------------------------------------------------------------------

function show(runtime: PlatformRuntime, path: string, page: ReactNode) {
  return renderInTab(
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation: testNavigation(path) },
  );
}

const showSubmissions = (runtime: PlatformRuntime, id = ASMT) =>
  show(
    runtime,
    `/faculty/assessments/${id}/submissions`,
    <AssessmentSubmissions assessmentId={id} />,
  );

/** A command as `ports`' person; its receipt refreshes the tab (as `actAs` does). */
async function as<T>(
  runtime: PlatformRuntime,
  send: () => Promise<Result<T, ServiceError>>,
): Promise<T> {
  let value: T | null = null;
  await act(async () => {
    const answer = await send();
    if (!answer.ok) throw new Error(`refused: ${JSON.stringify(answer.error)}`);
    value = answer.value;
    await runtime.invalidate(answer.changed);
  });
  return value as T;
}

/** After Flow C: ASMT-0009 as the walk's D1 creates it (B4-14 D1). */
async function createAssessment(runtime: PlatformRuntime): Promise<string> {
  const created = await as(runtime, () =>
    runtime.ports.assessments.createAssessment({
      mode: 'create',
      experimentId: SHELL as ExperimentId,
      name: NAME,
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: ['Q-0101', 'Q-0102', 'Q-0104', 'Q-0106'].map((id) => id as QuestionId),
    }),
  );
  return created.id;
}

/** Meera Iyer gives Priya Natarajan Shell-and-Tube (IA-05, through her own port). */
async function givePriya(runtime: PlatformRuntime, meera: ProductPorts) {
  const plan = await meera.institutions.getAccessPlan('ACC-0107' as never);
  if (!plan.ok) throw new Error('plan');
  await as(runtime, () =>
    meera.studentAccess.giveAccess({
      experimentIds: [SHELL as ExperimentId],
      target: { kind: 'student', studentId: PRIYA as never },
      expectedPlanRev: plan.value.plan.rev,
    }),
  );
}

/** A Student answers every question and submits, through their own ports. */
async function submit(
  runtime: PlatformRuntime,
  student: ProductPorts,
  id: string,
  written: string,
): Promise<string> {
  let attempt = await as(runtime, () => student.assessments.startAttempt(id as AssessmentId));
  const answers = [
    ['Q-0101', { type: 'multiple-choice' as const, choice: 'A' as const }],
    ['Q-0102', { type: 'multiple-choice' as const, choice: 'B' as const }],
    ['Q-0104', { type: 'true-false' as const, value: true }],
    ['Q-0106', { type: 'written' as const, text: written }],
  ] as const;
  for (const [questionId, answer] of answers) {
    attempt = await as(runtime, () =>
      student.assessments.saveAnswer({
        attemptId: attempt.id,
        questionId: questionId as QuestionId,
        answer,
        expectedRev: attempt.rev,
      }),
    );
  }
  await as(runtime, () =>
    student.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
  );
  return attempt.id;
}

/** The f7 world: ASMT-0009 with Rahul's (5 Nov, 18:52) and Priya's (6 Nov, 20:10) submissions. */
async function f7World() {
  const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
  const id = await createAssessment(runtime);
  await givePriya(runtime, asPersonId(sample, MEERA));
  setSampleNow(sample, '2026-11-05T13:22:00.000Z' as never);
  const rahul = await submit(runtime, asPersonId(sample, RAHUL), id, RAHUL_WRITTEN);
  setSampleNow(sample, '2026-11-06T14:40:00.000Z' as never);
  const priya = await submit(runtime, asPersonId(sample, PRIYA), id, PRIYA_WRITTEN);
  setSampleNow(sample, '2026-11-07T04:40:00.000Z' as never);
  return { runtime, sample, id, rahul, priya };
}

/** Ranganathan marks the written answer and confirms (FA-19, through his own port). */
async function markAndConfirm(runtime: PlatformRuntime, attemptId: string, mark: string) {
  const view = await runtime.ports.marking.getAttemptForMarking(attemptId as AttemptId);
  if (!view.ok) throw new Error(`getAttemptForMarking ${view.error.kind}`);
  const marked = await as(runtime, () =>
    runtime.ports.marking.saveMark({
      attemptId: attemptId as AttemptId,
      questionId: 'Q-0106' as QuestionId,
      mark,
      feedback: 'Good use of your own readings.',
      expectedRev: view.value.attempt.rev,
    }),
  );
  await as(runtime, () =>
    runtime.ports.marking.confirmMarks({
      attemptId: attemptId as AttemptId,
      expectedRev: marked.rev,
    }),
  );
}

const main = () => screen.getByRole('main');
const region = () => screen.findByRole('region', { name: SUBMISSIONS_WORDS.title });
const tabs = () => screen.getByRole('navigation', { name: `${NAME} sections` });
const countLine = (section: HTMLElement) => section.querySelector('.fa-tbar-t [role="status"]');

/** An element's words without the phone labels and the screen-reader-only words. */
function shown(element: Element | null): string {
  if (!element) return '';
  const copy = element.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('.fa-lbl, .xr-sr')) hidden.remove();
  return copy.textContent ?? '';
}

/** The table's rows: name, attempt line, submitted, status, score, release. */
function rowsOf(section: HTMLElement): string[][] {
  return [...section.querySelectorAll('table.fa-stable tbody tr')].map((row) => {
    const cells = [...row.querySelectorAll('td')];
    return [
      cells[0]!.querySelector('a.rk-rowlink')?.textContent ?? '',
      cells[0]!.querySelector('.fa-cellsub')?.textContent ?? '',
      ...cells.slice(1).map((cell) => shown(cell)),
    ];
  });
}

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;
/**
 * The service's own export file name (lead decision: the service names the file,
 * `submissions-<reference>.csv`): the browser saves the file under it, and no words show it.
 */
const SERVICE_FILE = 'submissions-ASMT-0009.csv';

/** No reference in the words, the names, the placeholders or the tab title — no exception. */
function expectNoReferences() {
  // No exception: not even the export's confirmation names the service's file.
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

// ---- f7: two submissions waiting ----------------------------------------------------------------

describe('FA-12 Submissions — two waiting for marking', () => {
  it('the frame with the Submissions tab, the count, the toolbar and the rows', async () => {
    const { runtime, rahul } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await waitFor(() => expect(document.title).toMatch(/^Submissions · /));
    expect(
      within(tabs())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Summary', 'Questions4, 4', 'Settings', 'Preview', 'Submissions2, 2']);
    const current = within(tabs()).getByRole('link', { name: /^Submissions/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('href', `/faculty/assessments/${ASMT}/submissions`);
    expect(current.querySelector('.fa-tabn')).toHaveTextContent('2');
    // The record band: the days left to the deadline, the waiting link.
    expect(main().querySelector('.fa-rec .fa-fig')).toHaveTextContent('Due 14 Nov 2026, 23:59');
    expect(
      within(main().querySelector('.fa-rec-meta') as HTMLElement).getByRole('link', {
        name: '2 waiting for marking',
      }),
    ).toBeVisible();

    expect(countLine(section)).toHaveTextContent('2 submissions · 2 waiting for marking');
    const show = within(section).getByRole('group', { name: 'Show' });
    expect(show).toHaveClass('fa-seg', 'fa-seg--bar');
    expect(
      within(show)
        .getAllByRole('button')
        .map((button) => [button.textContent, button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['All2, 2', 'true'],
      ['Waiting for marking2, 2', 'false'],
      ['Marked0, 0', 'false'],
    ]);
    expect(
      within(show)
        .getByRole('button', { name: /^Waiting/ })
        .querySelector('.fa-seg-long')?.textContent,
    ).toBe(' for marking');
    // "Mark next" opens FA-19 for the oldest waiting: Rahul's.
    const markNext = within(section).getByRole('link', { name: 'Mark next' });
    expect(markNext).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`);
    const exportButton = within(section).getByRole('button', { name: 'Export CSV' });
    expect(exportButton).toHaveClass('rb-btn');
    expect(exportButton.querySelector('svg')).not.toBeNull();

    expect(section.querySelector('table caption')).toHaveTextContent(`Submissions for ${NAME}`);
    expect([...section.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Student',
      'Submitted',
      'Status',
      'Score',
      'Result released to student',
    ]);
    expect(rowsOf(section)).toEqual([
      [
        'Rahul Verma',
        'Attempt 1 of 2',
        '5 Nov 2026, 18:52',
        'Waiting for marking',
        '— of 16Marked automatically: 4 of 6',
        'Not yetafter the deadline, 14 Nov 2026, 23:59',
      ],
      [
        'Priya Natarajan',
        'Attempt 1 of 2',
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        '— of 16Marked automatically: 4 of 6',
        'Not yetafter the deadline, 14 Nov 2026, 23:59',
      ],
    ]);
    for (const row of section.querySelectorAll('tbody tr')) {
      expect(row.querySelector('.xr-st--warn')).not.toBeNull();
      expect(row.querySelector('.fa-res.fa-res--no svg')).not.toBeNull();
    }
    // Each row opens FA-19, named by its student; never a release control.
    expect(within(section).getByRole('link', { name: 'Mark Priya Natarajan' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/faculty\/marking\//),
    );
    expect(
      within(main()).queryByRole('button', { name: /release|publish|make available/i }),
    ).toBeNull();
    expectNoReferences();
  });

  it('the in-page filter: Waiting for marking, Marked (none match, Show all), All', async () => {
    const user = userEvent.setup();
    const { runtime } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    await user.click(within(section).getByRole('button', { name: /^Marked/ }));
    expect(within(section).getByRole('button', { name: /^Marked/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(section.querySelector('table')).toBeNull();
    expect(section.querySelector('.rk-state')).toHaveTextContent(
      'No submissions match this filter',
    );
    // The count and the actions stay: they are the assessment's, not the filter's.
    expect(countLine(section)).toHaveTextContent('2 submissions · 2 waiting for marking');
    expect(within(section).getByRole('link', { name: 'Mark next' })).toBeVisible();

    await user.click(within(section).getByRole('button', { name: 'Show all' }));
    expect(within(section).getByRole('button', { name: /^All/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(section).getByRole('button', { name: /^Waiting/ }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Rahul Verma', 'Priya Natarajan']);
    await user.click(within(section).getByRole('button', { name: /^All/ }));
    expect(rowsOf(section)).toHaveLength(2);
  });
});

// ---- after marking Rahul ----------------------------------------------------------------------

describe('FA-12 Submissions — after marking Rahul, not released yet', () => {
  it('Rahul “Marked · 11 of 16 · Passed · pass mark 8 · Not yet”; Mark next opens Priya’s', async () => {
    const user = userEvent.setup();
    const { runtime, rahul, priya } = await f7World();
    await markAndConfirm(runtime, rahul, '7');
    showSubmissions(runtime);
    const section = await region();
    await waitFor(() =>
      expect(countLine(section)).toHaveTextContent('2 submissions · 1 waiting for marking'),
    );
    expect(rowsOf(section)).toEqual([
      [
        'Rahul Verma',
        'Attempt 1 of 2',
        '5 Nov 2026, 18:52',
        'Marked',
        '11 of 16Passed · pass mark 8',
        'Not yetafter the deadline, 14 Nov 2026, 23:59',
      ],
      [
        'Priya Natarajan',
        'Attempt 1 of 2',
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        '— of 16Marked automatically: 4 of 6',
        'Not yetafter the deadline, 14 Nov 2026, 23:59',
      ],
    ]);
    expect(section.querySelector('tbody tr .xr-st--ok')).toHaveTextContent('Marked');
    expect(within(section).getByRole('link', { name: 'View marks for Rahul Verma' })).toBeVisible();
    expect(within(section).getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    expect(main().querySelector('.fa-rec-meta')).toHaveTextContent('1 waiting for marking');

    await user.click(within(section).getByRole('button', { name: /^Marked/ }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Rahul Verma']);
    await user.click(within(section).getByRole('button', { name: /^Waiting/ }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Priya Natarajan']);
    expectNoReferences();
  });
});

// ---- released after the deadline --------------------------------------------------------------

describe('FA-12 Submissions — released after the deadline (after Flow D)', () => {
  it('Rahul’s attempt “Released” with when, the tick; nothing to mark next', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSubmissions(runtime);
    const section = await region();
    expect(rowsOf(section)).toEqual([
      [
        'Rahul Verma',
        'Attempt 1 of 2',
        '5 Nov 2026, 18:52',
        'Marked',
        '11 of 16Passed · pass mark 8',
        'Released14 Nov 2026, 23:59, after the deadline',
      ],
    ]);
    expect(section.querySelector('tbody .fa-res.fa-res--ok')).toHaveTextContent('Released');
    expect(section.querySelector('tbody .fa-res--no')).toBeNull();
    expect(countLine(section)).toHaveTextContent('1 submission · 0 waiting for marking');
    expect(within(section).queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(within(tabs()).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      'Submissions1, 1',
    );
    expectNoReferences();
  });
});

// ---- Export CSV (FA-22) ---------------------------------------------------------------------------

describe('FA-22 Export CSV on FA-12', () => {
  it('saves the service’s file in the browser and confirms it with the file’s rows; the confirmation takes focus', async () => {
    const user = userEvent.setup();
    const { runtime } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    const confirmation = await waitFor(() => {
      const notice = document.getElementById('submissions-export');
      expect(notice).not.toBeNull();
      return notice!;
    });
    expect(confirmation).toHaveAttribute('tabindex', '-1');
    await waitFor(() => expect(confirmation).toHaveFocus());
    expect(confirmation).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(confirmation).toHaveAttribute('role', 'status');
    expect(confirmation.parentElement).toHaveClass('fa-export');
    // Named by the assessment, not the service's file name (it holds the reference); the file
    // itself keeps the service's name (below).
    expect(confirmation.querySelector('.rk-notice-t')).toHaveTextContent(
      'Exported the submissions of Heat Exchanger — post-lab as a CSV file · 2 rows',
    );
    expect(confirmation).toHaveTextContent(
      'It contains every submission to this assessment, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.',
    );
    // The file's rows, as written, in a region that scrolls sideways.
    const rows = within(section).getByRole('region', { name: 'Rows in the exported file' });
    expect(rows).toHaveClass('fa-scrollx');
    expect(rows).toHaveAttribute('tabindex', '0');
    expect([...rows.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual([
      'student',
      'student ID',
      'submitted',
      'status',
      'score',
      'result released to student',
    ]);
    expect(
      [...rows.querySelectorAll('tbody tr')].map((row) =>
        [...row.querySelectorAll('td')].map((cell) => cell.textContent),
      ),
    ).toEqual([
      [
        'Rahul Verma',
        'GIT-2026-0418',
        '5 Nov 2026, 18:52',
        'Waiting for marking',
        '',
        'Not yet — after the deadline',
      ],
      [
        'Priya Natarajan',
        expect.stringMatching(/^GIT-/),
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        '',
        'Not yet — after the deadline',
      ],
    ]);

    expect(saved.map((file) => file.name)).toEqual([SERVICE_FILE]);
    const text = await saved[0]!.blob.text();
    const lines = text.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines[0]).toBe('student,student ID,submitted,status,score,result released to student');
    expect(lines[1]).toMatch(
      /^Rahul Verma,GIT-2026-0418,"5 Nov 2026, 18:52",Waiting for marking,,/,
    );
    expect(lines[2]).toMatch(/^Priya Natarajan,/);
    expect(csvRowCount(text)).toBe(2);
    expectNoReferences();
  });

  it('a failure is a notice in the same place; nothing is saved', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    faults(sample).failNext('AssessmentService.exportSubmissionsCsv');
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    const box = await waitFor(() => {
      const found = document.querySelector('#submissions-export.rk-notice--warn');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(box).toHaveAttribute('role', 'alert');
    expect(box.querySelector('.rk-notice-t')).toHaveTextContent(stateWords('FA-12.export-failed'));
    await waitFor(() => expect(document.getElementById('submissions-export')).toHaveFocus());
    expect(saved).toEqual([]);
    // Again: the file is made this time.
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(saved.map((file) => file.name)).toEqual([SERVICE_FILE]));
    expect(document.querySelector('#submissions-export.rk-notice--ok')).not.toBeNull();
  });

  it('counts the file’s records, quoted line breaks included', () => {
    expect(csvRowCount('a,b\r\n')).toBe(0);
    expect(csvRowCount('a,b\r\n1,"x\r\ny"\r\n2,z\r\n')).toBe(2);
    expect(csvRowCount('a,b\n1,2')).toBe(1);
  });

  it('reads the file’s cells: quoted commas, doubled quotes and line breaks', () => {
    expect(csvCells('a,b\r\n1,"x, y"\r\n"say ""hi""","p\r\nq"\r\n')).toEqual([
      ['a', 'b'],
      ['1', 'x, y'],
      ['say "hi"', 'p\r\nq'],
    ]);
    expect(csvCells('a,b\n1,')).toEqual([
      ['a', 'b'],
      ['1', ''],
    ]);
  });
});

// ---- no submission yet ----------------------------------------------------------------------------

describe('FA-12 Submissions — no submissions yet', () => {
  it('“0 submissions · 0 waiting for marking”, the empty state, no Export CSV, no filter, no Mark next', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createAssessment(runtime);
    showSubmissions(runtime, id);
    const section = await region();
    expect(countLine(section)).toHaveTextContent('0 submissions · 0 waiting for marking');
    const empty = section.querySelector('.rk-state')!;
    expect(empty.querySelector('.rk-state-t')).toHaveTextContent('No submissions yet');
    expect(empty).toHaveTextContent(
      'Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. Their submissions appear here.',
    );
    expect(section.querySelector('table')).toBeNull();
    expect(within(section).queryByRole('link', { name: 'Mark next' })).toBeNull();
    // Nothing to export or filter yet (the export draws neither without a submission).
    expect(within(section).queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(within(section).queryByRole('group', { name: 'Show' })).toBeNull();
    expect(within(tabs()).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      /^Submissions$/,
    );
  });
});

// ---- Undrawn states ---------------------------------------------------------------------------

describe('FA-12 Submissions — undrawn states', () => {
  it('a co-teaching colleague’s assessment is held back calmly (OD-B4-17)', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-d');
    await as(runtime, () =>
      asPersonId(sample, MEERA).facultyCourses.assign({
        facultyId: DESAI as never,
        courseId: 'thermodynamics-heat-transfer' as CourseId,
      }),
    );
    showSubmissions(runtime);
    const heading = await screen.findByRole('heading', {
      name: stateWords('FA-12.policy-open.title'),
    });
    expect(heading.closest('section')).toHaveClass('fa-msgcard');
    expect(heading.closest('.fa-inlinemsg')?.querySelector('.fa-msg-ico--lock')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Submissions' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main()).toHaveTextContent(stateWords('FA-12.policy-open.line'));
    expect(main()).not.toHaveTextContent('Rahul Verma');
    expect(within(main()).queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(within(main()).queryByRole('button', { name: 'Try again' })).toBeNull();
    await waitFor(() => expect(document.title).toMatch(/^Submissions · /));
    expectNoReferences();
  });

  it('announces loading; a failed list has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listSubmissions');
    showSubmissions(runtime);
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('heading', { level: 2 })).toHaveTextContent(
      stateWords('FA-12.failed'),
    );
    // The frame stays: the record band and the tabs.
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    const section = await region();
    await waitFor(() => expect(rowsOf(section)).toHaveLength(1));
  });

  it('an unknown assessment is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSubmissions(runtime, 'ASMT-9999');
    expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  });
});

// ---- FA-08's panel actions -----------------------------------------------------------------------

describe('FA-08 Summary — Mark next and See submissions', () => {
  it('while a submission waits: Mark next opens the oldest; See submissions the tab', async () => {
    const { runtime, rahul } = await f7World();
    show(runtime, `/faculty/assessments/${ASMT}`, <AssessmentSummary assessmentId={ASMT} />);
    const submissions = await screen.findByRole('complementary', { name: 'Submissions' });
    const markNext = await within(submissions).findByRole('link', {
      name: SUMMARY_ACTIONS.markNext,
    });
    expect(markNext).toHaveClass('rb-btn', 'rb-btn--primary', 'rk-go');
    await waitFor(() => expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`));
    const see = within(submissions).getByRole('link', { name: SUMMARY_ACTIONS.seeSubmissions });
    expect(see).toHaveClass('rb-btn');
    expect(see).not.toHaveClass('rb-btn--primary');
    expect(see).toHaveAttribute('href', `/faculty/assessments/${ASMT}/submissions`);
    // Who waits, oldest first.
    expect(
      [
        ...within(submissions)
          .getByRole('list', { name: 'Waiting for marking, oldest first' })
          .querySelectorAll('li b'),
      ].map((name) => name.textContent),
    ).toEqual(['Rahul Verma', 'Priya Natarajan']);
    expect(submissions).toHaveTextContent('2 written answers waiting for marking');
  });

  it('none waiting (after Flow D): See submissions only', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, `/faculty/assessments/${ASMT}`, <AssessmentSummary assessmentId={ASMT} />);
    const submissions = await screen.findByRole('complementary', { name: 'Submissions' });
    expect(within(submissions).queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(
      within(submissions).getByRole('link', { name: SUMMARY_ACTIONS.seeSubmissions }),
    ).toHaveAttribute('href', `/faculty/assessments/${ASMT}/submissions`);
  });
});

// ---- The link-target ledger -----------------------------------------------------------------

describe('FA-12 link targets', () => {
  it('one primary (Mark next); every built target resolves; nothing waits for FA-12 now', () => {
    expect(
      P4B_SUBMISSIONS_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => entry.action,
      ),
    ).toEqual(['Mark next']);
    for (const entry of P4B_SUBMISSIONS_LINK_TARGETS.filter((item) => item.outcome === 'built')) {
      expect(['screen', 'record-screen'], entry.action).toContain(
        resolveAddress(expandTarget(entry.target!, '/faculty').split('?')[0]!).kind,
      );
    }
    expect(
      LINK_TARGET_LEDGER.filter(
        (entry) => entry.outcome === 'not-rendered' && /FA-12/.test(entry.note ?? ''),
      ),
    ).toEqual([]);
  });
});
