/**
 * FA-12 Assessment · Submissions with FA-22 Export CSV (board B4-06 f7 … f11), and the record's
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
import { AssessmentSubmissions, csvRowCount } from './fa-12-submissions/submissions';

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
const tabs = () => screen.getByRole('navigation', { name: NAME });

/** The table's rows: name, ATT number, submitted, status, score, release flag. */
function rowsOf(section: HTMLElement): string[][] {
  return [...section.querySelectorAll('tbody tr')].map((row) => {
    const cells = [...row.querySelectorAll('td')];
    return [
      cells[0]!.querySelector('strong')?.textContent ?? '',
      cells[0]!.querySelector('.xr-meta')?.textContent ?? '',
      ...cells.slice(1).map((cell) => cell.textContent ?? ''),
    ];
  });
}

// ---- f7: two submissions waiting ----------------------------------------------------------------

describe('FA-12 Submissions — two waiting for marking (B4-06 f7)', () => {
  it('the frame with the Submissions tab, the count, the toolbar and the rows as drawn', async () => {
    const { runtime, rahul, priya } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    // "Assessments / Heat Exchanger — post-lab / Submissions", the tab current with its figure.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Submissions');
    expect(
      within(tabs())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Summary', 'Questions 4', 'Settings', 'Preview', 'Submissions 2']);
    const current = within(tabs()).getByRole('link', { name: /^Submissions/ });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('href', `/faculty/assessments/${ASMT}/submissions`);
    expect(current.querySelector('.xr-tab-count')).toHaveTextContent('2');
    expect(
      [...main().querySelectorAll('.xa-headfacts > span')].map((fact) => fact.textContent),
    ).toEqual(['Due 14 Nov 2026, 23:59', '2 waiting for marking']);

    expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '2 submitted · 2 waiting for marking',
    );
    const show = within(section).getByRole('group', { name: 'Show' });
    expect(show).toHaveClass('xr-seg');
    expect(
      within(show)
        .getAllByRole('button')
        .map((button) => [button.textContent, button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['All', 'true'],
      ['Waiting for marking', 'false'],
      ['Marked', 'false'],
    ]);
    // "Mark next" opens FA-19 for the oldest waiting: Rahul's.
    const markNext = within(section).getByRole('link', { name: 'Mark next' });
    expect(markNext).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`);
    const exportButton = within(section).getByRole('button', { name: 'Export CSV' });
    expect(exportButton).toHaveClass('xr-btn--secondary', 'xr-btn--sm');

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
        rahul,
        '5 Nov 2026, 18:52',
        'Waiting for marking',
        '—',
        'Not yet — after the deadline',
      ],
      [
        'Priya Natarajan',
        priya,
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        '—',
        'Not yet — after the deadline',
      ],
    ]);
    for (const row of section.querySelectorAll('tbody tr')) {
      expect(row.querySelector('.xr-status--wait')).not.toBeNull();
      expect(row.querySelector('td.xl-num')).toHaveTextContent('—');
      expect(row.querySelector('.xl-inline svg')).not.toBeNull();
    }
    // No row link (the board draws none) and never a release control.
    expect(within(section.querySelector('table')!).queryByRole('link')).toBeNull();
    expect(
      within(main()).queryByRole('button', { name: /release|publish|make available/i }),
    ).toBeNull();
  });

  it('the in-page filter: Waiting for marking, Marked (none match), All', async () => {
    const user = userEvent.setup();
    const { runtime } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    await user.click(within(section).getByRole('button', { name: 'Marked' }));
    expect(within(section).getByRole('button', { name: 'Marked' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(section.querySelector('table')).toBeNull();
    expect(section.querySelector('.xr-section-body p.xr-body')).toHaveTextContent(
      'No submissions match this filter.',
    );
    // The count and the actions stay: they are the assessment's, not the filter's.
    expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '2 submitted · 2 waiting for marking',
    );
    expect(within(section).getByRole('link', { name: 'Mark next' })).toBeVisible();

    await user.click(within(section).getByRole('button', { name: 'Waiting for marking' }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Rahul Verma', 'Priya Natarajan']);
    await user.click(within(section).getByRole('button', { name: 'All' }));
    expect(rowsOf(section)).toHaveLength(2);
  });
});

// ---- f8: after marking Rahul ----------------------------------------------------------------

describe('FA-12 Submissions — after marking Rahul, not released yet (B4-06 f8)', () => {
  it('Rahul “Marked · 11 of 16 · Not yet — after the deadline”; Mark next opens Priya’s', async () => {
    const user = userEvent.setup();
    const { runtime, rahul, priya } = await f7World();
    await markAndConfirm(runtime, rahul, '7');
    showSubmissions(runtime);
    const section = await region();
    await waitFor(() =>
      expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
        '2 submitted · 1 waiting for marking',
      ),
    );
    expect(rowsOf(section)).toEqual([
      [
        'Rahul Verma',
        rahul,
        '5 Nov 2026, 18:52',
        'Marked',
        '11 of 16',
        'Not yet — after the deadline',
      ],
      [
        'Priya Natarajan',
        priya,
        '6 Nov 2026, 20:10',
        'Waiting for marking',
        '—',
        'Not yet — after the deadline',
      ],
    ]);
    expect(section.querySelector('tbody tr .xr-status--ok')).toHaveTextContent('Marked');
    expect(within(section).getByRole('link', { name: 'Mark next' })).toHaveAttribute(
      'href',
      `/faculty/marking/${priya}`,
    );
    expect(main().querySelector('.xa-headfacts')).toHaveTextContent('1 waiting for marking');

    await user.click(within(section).getByRole('button', { name: 'Marked' }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Rahul Verma']);
    await user.click(within(section).getByRole('button', { name: 'Waiting for marking' }));
    expect(rowsOf(section).map((row) => row[0])).toEqual(['Priya Natarajan']);
  });
});

// ---- f9: released after the deadline --------------------------------------------------------

describe('FA-12 Submissions — released after the deadline (after Flow D; B4-06 f9)', () => {
  it('ATT-0450 “Released 14 Nov 2026, 23:59”, without the lock; nothing to mark next', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSubmissions(runtime);
    const section = await region();
    expect(rowsOf(section)).toEqual([
      [
        'Rahul Verma',
        'ATT-0450',
        '5 Nov 2026, 18:52',
        'Marked',
        '11 of 16',
        'Released 14 Nov 2026, 23:59',
      ],
    ]);
    expect(section.querySelector('tbody .xl-inline')).toBeNull();
    expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '1 submitted · 0 waiting for marking',
    );
    expect(within(section).queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(within(tabs()).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      'Submissions 1',
    );
  });
});

// ---- f10: Export CSV (FA-22) ------------------------------------------------------------------

describe('FA-22 Export CSV on FA-12 (B4-06 f10)', () => {
  it('saves the service’s file in the browser and confirms it; the confirmation takes focus', async () => {
    const user = userEvent.setup();
    const { runtime } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    const confirmation = await waitFor(() => {
      const wrapper = document.getElementById('submissions-export');
      expect(wrapper).not.toBeNull();
      return wrapper!;
    });
    expect(confirmation).toHaveAttribute('tabindex', '-1');
    await waitFor(() => expect(confirmation).toHaveFocus());
    const box = confirmation.querySelector('.xr-notice.xr-notice--ok')!;
    expect(box).toHaveAttribute('role', 'status');
    expect(box.querySelector('.xr-notice-title')).toHaveTextContent(
      'Exported submissions-ASMT-0009.csv · 2 rows',
    );
    expect(box).toHaveTextContent(
      'Columns: student, student ID, submitted, status, score, result released to student. It contains this list only.',
    );

    expect(saved.map((file) => file.name)).toEqual(['submissions-ASMT-0009.csv']);
    const text = await saved[0]!.blob.text();
    const lines = text.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines[0]).toBe('student,student ID,submitted,status,score,result released to student');
    expect(lines[1]).toMatch(
      /^Rahul Verma,GIT-2026-0418,"5 Nov 2026, 18:52",Waiting for marking,,/,
    );
    expect(lines[2]).toMatch(/^Priya Natarajan,/);
    expect(csvRowCount(text)).toBe(2);
  });

  it('a failure is an err notice in the same place; nothing is saved', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await f7World();
    showSubmissions(runtime);
    const section = await region();
    faults(sample).failNext('AssessmentService.exportSubmissionsCsv');
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    const box = await waitFor(() => {
      const found = document.querySelector('#submissions-export .xr-notice--err');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(box.querySelector('.xr-notice-title')).toHaveTextContent(
      stateWords('FA-12.export-failed'),
    );
    await waitFor(() => expect(document.getElementById('submissions-export')).toHaveFocus());
    expect(saved).toEqual([]);
    // Again: the file is made this time.
    await user.click(within(section).getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(saved.map((file) => file.name)).toEqual(['submissions-ASMT-0009.csv']),
    );
    expect(document.querySelector('#submissions-export .xr-notice--ok')).not.toBeNull();
  });

  it('counts the file’s records, quoted line breaks included', () => {
    expect(csvRowCount('a,b\r\n')).toBe(0);
    expect(csvRowCount('a,b\r\n1,"x\r\ny"\r\n2,z\r\n')).toBe(2);
    expect(csvRowCount('a,b\n1,2')).toBe(1);
  });
});

// ---- f11: no submission yet ---------------------------------------------------------------------

describe('FA-12 Submissions — no submissions yet (B4-06 f11)', () => {
  it('“0 submitted · 0 waiting for marking”, the empty state, Export CSV and no Mark next', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createAssessment(runtime);
    showSubmissions(runtime, id);
    const section = await region();
    expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '0 submitted · 0 waiting for marking',
    );
    const empty = section.querySelector('.xr-section-body .xr-empty')!;
    expect(within(empty as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent(
      'No submissions yet',
    );
    expect(empty).toHaveTextContent(
      'Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. Their submissions appear here.',
    );
    expect(section.querySelector('table')).toBeNull();
    expect(within(section).queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(within(section).getByRole('button', { name: 'Export CSV' })).toBeVisible();
    expect(within(section).getByRole('group', { name: 'Show' })).toBeVisible();
    expect(within(tabs()).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      'Submissions 0',
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
    expect(
      await screen.findByRole('heading', { name: stateWords('FA-12.policy-open.title') }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 1, name: 'Submissions' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main()).toHaveTextContent(stateWords('FA-12.policy-open.line'));
    expect(main()).not.toHaveTextContent('Rahul Verma');
    expect(within(main()).queryByRole('button', { name: 'Export CSV' })).toBeNull();
    expect(within(main()).queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Submissions');
  });

  it('announces loading; a failed list has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listSubmissions');
    showSubmissions(runtime);
    expect(await screen.findByText(stateWords('FA-12.failed'))).toBeVisible();
    // The frame stays: the header and the tabs.
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    const section = await region();
    expect(rowsOf(section)).toHaveLength(1);
  });

  it('an unknown assessment is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSubmissions(runtime, 'ASMT-9999');
    expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  });
});

// ---- FA-08's Phase-4B actions -----------------------------------------------------------------

describe('FA-08 Summary — Mark next and See submissions (B4-05 f0)', () => {
  it('while a submission waits: Mark next opens the oldest; See submissions the tab', async () => {
    const { runtime, rahul } = await f7World();
    show(runtime, `/faculty/assessments/${ASMT}`, <AssessmentSummary assessmentId={ASMT} />);
    const submissions = await screen.findByRole('region', { name: 'Submissions' });
    const markNext = await within(submissions).findByRole('link', {
      name: SUMMARY_ACTIONS.markNext,
    });
    expect(markNext).toHaveClass('xr-btn', 'xr-btn--primary');
    await waitFor(() => expect(markNext).toHaveAttribute('href', `/faculty/marking/${rahul}`));
    const see = within(submissions).getByRole('link', { name: SUMMARY_ACTIONS.seeSubmissions });
    expect(see).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(see).toHaveAttribute('href', `/faculty/assessments/${ASMT}/submissions`);
    expect(submissions.querySelector('.xw-actions')).not.toBeNull();
  });

  it('none waiting (after Flow D): See submissions only', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, `/faculty/assessments/${ASMT}`, <AssessmentSummary assessmentId={ASMT} />);
    const submissions = await screen.findByRole('region', { name: 'Submissions' });
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
