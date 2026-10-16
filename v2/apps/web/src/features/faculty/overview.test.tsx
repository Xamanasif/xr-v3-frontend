/**
 * FA-01 Overview (board B4-01 f0 … f4) on the real composition root and the sample world: the
 * scope line, "Needs your attention" and "Coming up" as `TeachingService.getFacultyOverview`
 * answers them, for Dr S. Ranganathan (per-0014, ME ZG523) and Dr Anita Desai (per-0015, no course
 * yet). The one world is proved end to end: Meera Iyer's Faculty course assignment (IA-15, through
 * the real `facultyCourses.assign` port) turns Anita's "No courses yet" into her scope line; a
 * Ready assessment saved through the assessments port appears under Coming up; the sample clock
 * past the plan's end gives the access-ended row (f3). Phase 4B renders the actions 4A left out
 * (DEV-21): a submitted written answer brings the header's "Mark 1 written answer" and the row's
 * "Mark now" (FA-18), and Students inactive for 14 days the row with "View students" (FA-20); the
 * drafts row stays undrawn (no service fact). The undrawn loading and failed states read again.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FacultyAttention } from '@xr/contracts/draft';
import type { AssessmentId, ExperimentId, IsoInstant, PersonId } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import {
  accessEndedSub,
  accessEndedTitle,
  attentionCountWords,
  comingUpSub,
  FACULTY_FAILED_WORDS,
  FACULTY_OVERVIEW_WORDS,
  scopeLineWords,
} from '@/copy/faculty-overview';
import { STATE_COPY_FACULTY_OVERVIEW } from '@/copy/state-copy-faculty-overview';
import { BUILT_SCREENS } from '@/nav/built-screens';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { FacultyOverview } from './fa-01-overview/overview';
import {
  ATTENTION_BUDGET,
  attentionRow,
  attentionRows,
  writtenAnswersWaiting,
} from './fa-01-overview/overview-view';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = PERSON_OF_ROLE.faculty;
const DESAI = 'per-0015';
const MEERA = PERSON_OF_ROLE.tenant_admin;
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const COURSE = 'thermodynamics-heat-transfer';
const INSTITUTION = 'Godavari Institute of Technology';
/** Two days after ACC-0107's term ends on 7 Oct 2027 (09:00 in Indian time). */
const AFTER_ACCESS_ENDED = '2027-10-09T03:30:00.000Z';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

/** A board's text with tags removed and `&amp;` read, then its raw markup. */
function words(file: string): string {
  const raw = board(file);
  return `${raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')}\n${raw}`;
}
const B4_01 = words('B4-01-Faculty-Overview.dc.html');
const B4_02 = words('B4-02-My-Courses-and-Experiments.dc.html');

function showOverview(runtime: PlatformRuntime) {
  const navigation = testNavigation('/faculty');
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <FacultyOverview />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const header = () => document.querySelector('.xr-phead');
const scopeLine = () => document.querySelector('.xr-phead-meta');
const attention = () => screen.findByRole('region', { name: 'Needs your attention' });
const comingUp = () => screen.findByRole('region', { name: 'Coming up' });
const rowTitles = (region: HTMLElement) =>
  [...region.querySelectorAll('.xr-row-title')].map((node) => node.textContent);

/**
 * With nothing to mark and no inactive Student, none of the Phase-4B actions is on the page; the
 * drafts row's "Review drafts" never is (the service has no drafts fact, PC-51).
 */
function expectNoPhase4BActions() {
  for (const name of [/^Mark \d+ written answer/, 'Mark now', 'Review drafts', 'View students']) {
    expect(screen.queryByRole('link', { name })).toBeNull();
    expect(screen.queryByRole('button', { name })).toBeNull();
  }
  expect(main().querySelector('.xr-phead-actions')).toBeNull();
}

/** Rahul starts, answers and submits the assessment (ST-13), as he would; the stand-in marks his choices. */
async function rahulSubmits(runtime: PlatformRuntime, sample: Sample, assessmentId: AssessmentId) {
  const rahul = asPersonId(sample, 'per-0002');
  await act(async () => {
    const started = await rahul.assessments.startAttempt(assessmentId);
    if (!started.ok) throw new Error(`start ${JSON.stringify(started.error)}`);
    const saved = await rahul.assessments.saveAnswer({
      attemptId: started.value.id,
      questionId: 'Q-0106' as never,
      answer: { type: 'written', text: 'U falls, so less heat passes.' },
      expectedRev: started.value.rev,
    });
    if (!saved.ok) throw new Error(`answer ${JSON.stringify(saved.error)}`);
    const submitted = await rahul.assessments.submitAttempt({
      attemptId: saved.value.id,
      expectedRev: saved.value.rev,
    });
    if (!submitted.ok) throw new Error(`submit ${JSON.stringify(submitted.error)}`);
    await runtime.invalidate(submitted.changed);
  });
}

/** A Ready assessment of Shell-and-Tube through the assessments port (FA-07 "Create"), as he saves it. */
async function createReady(
  runtime: PlatformRuntime,
  deadline = '2026-11-14T23:59:00+05:30',
  mode: 'create' | 'save-as-draft' = 'create',
  questions?: readonly string[],
): Promise<AssessmentId> {
  const bank = await runtime.ports.questionBank.listQuestions({
    experimentId: SHELL as ExperimentId,
  });
  if (!bank.ok) throw new Error(`bank ${bank.error.kind}`);
  let id: AssessmentId | null = null;
  await act(async () => {
    const created = await runtime.ports.assessments.createAssessment({
      mode,
      experimentId: SHELL as ExperimentId,
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline,
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      // A draft without questions is "Draft — not ready"; with every rule and a question it is Ready.
      questions: mode === 'create' ? ((questions as never) ?? [bank.value[0]!.question.id]) : [],
    });
    if (!created.ok) throw new Error(`create ${JSON.stringify(created.error)}`);
    id = created.value.id;
    await runtime.invalidate(created.changed);
  });
  return id!;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

// ---- f1 / f0: the scope line, nothing needs him, Coming up ------------------------------------

describe('FA-01 — Dr S. Ranganathan after Flow C (B4-01 f0, f1)', () => {
  it('the overline, the H1, the scope line and the shell (Overview current)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await attention();
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(header()?.querySelector('.xr-overline')).toHaveTextContent(INSTITUTION);
    // "You teach 1 course · 1 experiment · My courses" (`div.xr-phead-meta > p.xr-body`).
    expect(scopeLine()?.querySelector('p.xr-body')).toHaveTextContent(
      /^You teach 1 course · 1 experiment · My courses$/,
    );
    expect(
      within(scopeLine() as HTMLElement).getByRole('link', { name: 'My courses' }),
    ).toHaveAttribute('href', '/faculty/courses');
    // The shell: the top bar "Overview", the Faculty sidebar's four built destinations and Help.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Overview');
    const sidebar = screen.getByRole('navigation', { name: 'Faculty navigation' });
    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.querySelector('.xr-nav-text')?.textContent),
    ).toEqual(['Overview', 'My courses', 'Assessments', 'Question bank', 'Marking', 'Students']);
    expect(sidebar.querySelector('[aria-current="page"]')).toHaveAttribute('href', '/faculty');
    expect(document.querySelector('aside.xr-side .xr-side-foot a')).toHaveAttribute(
      'href',
      '/faculty/help',
    );
  });

  it('nothing needs him: the calm state, no count, and no Phase-4B row or action (f1)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    const region = await attention();
    const answer = await runtime.ports.teaching.getFacultyOverview();
    expect(answer.ok && answer.value.attention).toEqual([]);
    expect(region.querySelector('.xr-section-head .xr-meta')).toBeNull();
    expect(region.querySelector('.xr-rows')).toBeNull();
    const calm = region.querySelector('.xr-empty')!;
    expect(calm.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(within(calm as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Nothing needs you right now.',
    );
    expect(calm).toHaveTextContent(
      'Written answers to mark, drafts to review and inactive students appear here.',
    );
    expectNoPhase4BActions();
  });

  it('Coming up is empty after Flow C: no assessment yet (f3’s words)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    const region = await comingUp();
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('at most 3');
    expect(region.querySelector('.xr-section-body p')).toHaveTextContent(
      'No deadlines in the next 30 days.',
    );
    expect(region.querySelector('.xr-rows')).toBeNull();
  });

  it('a Ready assessment due within 30 days, saved through the assessments port, appears under Coming up (f0, f1)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await comingUp();
    const id = await createReady(runtime);
    const region = await comingUp();
    await waitFor(() => expect(rowTitles(region)).toEqual(['Heat Exchanger — post-lab']));
    const row = region.querySelector('.xr-row')!;
    expect(row.querySelector('.xr-row-icon')).not.toBeNull();
    // Rahul is the one Godavari Student the experiment reaches in this world (the board's 5 are sample).
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      /^Due 14 Nov 2026, 23:59 · 0 of 1 student submitted$/,
    );
    const open = within(row as HTMLElement).getByRole('link', { name: 'Open' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(open).toHaveAttribute('href', `/faculty/assessments/${id}`);
    expect(region.querySelector('.xr-section-body')).toBeNull();
    // The attention list is unchanged (nothing is submitted yet).
    expect((await attention()).querySelector('.xr-empty')).not.toBeNull();
  });

  it('a draft is not coming up, even with a deadline in the next 30 days (state-copy FA-01.coming-up)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await comingUp();
    await createReady(runtime, '2026-11-14T23:59:00+05:30', 'save-as-draft');
    const listed = await runtime.ports.assessments.listAssessments();
    expect(listed.ok && listed.value.map((row) => row.readiness)).toEqual(['draft-not-ready']);
    expect((await comingUp()).querySelector('.xr-section-body p')).toHaveTextContent(
      'No deadlines in the next 30 days.',
    );
  });

  it('a deadline past the next 30 days is not coming up', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await comingUp();
    await createReady(runtime, '2026-12-20T23:59:00+05:30');
    const region = await comingUp();
    expect(region.querySelector('.xr-section-body p')).toHaveTextContent(
      'No deadlines in the next 30 days.',
    );
  });

  it('Students inactive for 14 days: the row names them, “View students” opens Students for the experiment (f0, f4)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    moveClock(sample, '2026-12-01T03:30:00.000Z');
    const answer = await runtime.ports.teaching.getFacultyOverview();
    expect(answer.ok && answer.value.attention.map((item) => item.kind)).toEqual([
      'students-inactive',
    ]);
    const fact = answer.ok ? answer.value.attention[0] : null;
    if (fact?.kind !== 'students-inactive') throw new Error('no inactive fact');
    showOverview(runtime);
    const region = await attention();
    await waitFor(() => expect(region.querySelectorAll('li.xr-row')).toHaveLength(1));
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(/^1 item$/);
    const row = region.querySelector('li.xr-row')!;
    const names = fact.students.map((student) => student.name);
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(
      names.length === 1
        ? '1 student inactive for 14 days or more'
        : `${names.length} students inactive for 14 days or more`,
    );
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(names[0]!);
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(`· ${SHELL_NAME}`);
    // The clock icon, no tone (B4-01 `span.xr-row-icon` with the clock).
    expect(row.querySelector('.xr-row-icon')?.className.trim()).toBe('xr-row-icon');
    const view = within(row as HTMLElement).getByRole('link', { name: 'View students' });
    expect(view).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(view).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);
    // Nothing to mark: no header action.
    expect(main().querySelector('.xr-phead-actions')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Review drafts' })).toBeNull();
  });

  it('a submitted written answer: the header’s “Mark 1 written answer” and the row’s “Mark now” open Marking (f0, f4)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createReady(runtime, '2026-11-14T23:59:00+05:30', 'create', [
      'Q-0101',
      'Q-0106',
    ]);
    showOverview(runtime);
    await attention();
    await rahulSubmits(runtime, sample, id);
    const region = await attention();
    await waitFor(() => expect(rowTitles(region)).toEqual(['1 written answer to mark']));
    const row = region.querySelector('li.xr-row')!;
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      /^Heat Exchanger — post-lab · from Rahul Verma, 27 Oct 2026$/,
    );
    const markNow = within(row as HTMLElement).getByRole('link', { name: 'Mark now' });
    expect(markNow).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(markNow).toHaveAttribute('href', `/faculty/marking?assessmentId=${id}`);
    const primary = within(main().querySelector('.xr-phead-actions') as HTMLElement).getByRole(
      'link',
      { name: 'Mark 1 written answer' },
    );
    expect(primary).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(primary).toHaveAttribute('href', '/faculty/marking');
    expect(screen.queryByRole('link', { name: 'Review drafts' })).toBeNull();
  });
});

// ---- f3: access ended ---------------------------------------------------------------------------

describe('FA-01 — course access ended (B4-01 f3)', () => {
  it('the access-ended row with its code and My courses; nothing coming up', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    moveClock(sample, AFTER_ACCESS_ENDED);
    showOverview(runtime);
    const region = await attention();
    await waitFor(() =>
      expect(rowTitles(region)).toEqual([
        `Your institution’s access to ${SHELL_NAME} ended on 7 Oct 2027`,
      ]),
    );
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(/^1 item$/);
    const row = region.querySelector('.xr-row')!;
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent(
      /^ME ZG523 · students can’t open it now; their work and results are kept$/,
    );
    expect(row.querySelector('.xr-row-icon path')).toHaveAttribute(
      'd',
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12h8',
    );
    const action = within(row as HTMLElement).getByRole('link', { name: 'My courses' });
    expect(action).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(action).toHaveAttribute('href', '/faculty/courses');
    // The scope line still names what he teaches.
    expect(scopeLine()).toHaveTextContent('You teach 1 course · 1 experiment · My courses');
    expect((await comingUp()).querySelector('.xr-section-body')).toHaveTextContent(
      'No deadlines in the next 30 days.',
    );
    expectNoPhase4BActions();
  });

  it('an assessment whose deadline passed with the access is not coming up', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await createReady(runtime);
    moveClock(sample, AFTER_ACCESS_ENDED);
    showOverview(runtime);
    expect((await comingUp()).querySelector('.xr-rows')).toBeNull();
  });
});

// ---- f2: no courses yet, and the one world ------------------------------------------------------

describe('FA-01 — Dr Anita Desai: no courses yet, then Meera assigns one (B4-01 f2; IA-15)', () => {
  it('the message and Help only — no scope line, no sections (f2)', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showOverview(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'Your Institute Admin hasn’t assigned you courses yet',
    });
    expect(header()?.querySelector('.xr-overline')).toHaveTextContent(INSTITUTION);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(scopeLine()).toBeNull();
    const empty = title.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty).toHaveTextContent(
      'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
    );
    const help = within(empty as HTMLElement).getByRole('link', { name: 'Help' });
    expect(help).toHaveClass('xr-btn', 'xr-btn--text');
    expect(help).toHaveAttribute('href', '/faculty/help');
    expect(screen.queryByRole('region', { name: 'Needs your attention' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Coming up' })).toBeNull();
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty');
  });

  it('Meera assigns her ME ZG523 in Faculty courses: her overview gains the scope line and sections', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    showOverview(runtime);
    await screen.findByRole('heading', {
      level: 2,
      name: 'Your Institute Admin hasn’t assigned you courses yet',
    });
    // The Institute Admin's command on the same world (IA-15 "Assign course"), as she sends it.
    const meera = asPersonId(sample, MEERA);
    await act(async () => {
      const assigned = await meera.facultyCourses.assign({
        facultyId: DESAI as PersonId,
        courseId: COURSE as never,
      });
      if (!assigned.ok) throw new Error(`assign ${JSON.stringify(assigned.error)}`);
      expect(assigned.value).toMatchObject({ facultyId: DESAI, courseId: COURSE });
      await runtime.invalidate(assigned.changed);
    });
    await waitFor(() =>
      expect(scopeLine()).toHaveTextContent(/^You teach 1 course · 1 experiment · My courses$/),
    );
    expect(
      screen.queryByRole('heading', {
        name: 'Your Institute Admin hasn’t assigned you courses yet',
      }),
    ).toBeNull();
    expect(await attention()).toHaveTextContent('Nothing needs you right now.');
    expect(await comingUp()).toHaveTextContent('No deadlines in the next 30 days.');
  });
});

// ---- Undrawn: loading and failed ---------------------------------------------------------------

describe('FA-01 — loading and failed (undrawn; state-copy FA-01.loading, FA-01.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.getFacultyOverview');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<FacultyOverview />, { runtime, navigation: testNavigation('/faculty') });
    expect(
      document.querySelector('.xr-section[aria-busy="true"] [role="status"]'),
    ).toHaveTextContent('Loading your overview');
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(scopeLine()).toBeNull();
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your overview',
    });
    const empty = failed.closest('.xr-empty')!;
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('bg-err-bg', 'text-err');
    expect(empty).toHaveTextContent('Nothing has changed. Try again.');
    expect(scopeLine()).toBeNull();
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry).toHaveClass('xr-btn', 'xr-btn--primary');
    await user.click(retry);
    expect(await attention()).toHaveTextContent('Nothing needs you right now.');
    expect(scopeLine()).toHaveTextContent('You teach 1 course · 1 experiment · My courses');
  });
});

// ---- The rows' rule, the words and the registers -----------------------------------------------

describe('FA-01 — rows, words and registers', () => {
  it('draws only the rows whose page is built, in the service’s order, at most five', () => {
    const ended = (index: number): FacultyAttention => ({
      kind: 'access-ended',
      experimentId: `exp-${index}` as ExperimentId,
      experimentName: `Experiment ${index}`,
      courseCode: null,
      endedOn: '2027-10-07' as never,
    });
    const marking: FacultyAttention = {
      kind: 'written-answers-to-mark',
      assessmentId: 'ASMT-0009' as AssessmentId,
      assessmentName: 'Heat Exchanger — post-lab',
      answers: 1,
      oldest: { studentName: 'Rahul Verma', submittedAt: '2026-11-05T10:00:00+05:30' as never },
    };
    const inactive: FacultyAttention = {
      kind: 'students-inactive',
      experimentId: SHELL as ExperimentId,
      experimentName: SHELL_NAME,
      days: 14,
      students: [{ studentId: 'per-0002' as PersonId, name: 'Rahul Verma' }],
    };
    // Phase 4B: "Mark now" opens Marking for the assessment (FA-18); the inactive-students row
    // is drawn with "View students" (FA-20 for the experiment).
    expect(attentionRow(marking)).toMatchObject({
      icon: 'marking',
      tone: 'wait',
      title: '1 written answer to mark',
      sub: 'Heat Exchanger — post-lab · from Rahul Verma, 5 Nov 2026',
      action: { label: 'Mark now', href: '/faculty/marking?assessmentId=ASMT-0009' },
    });
    expect(attentionRow(inactive)).toEqual({
      key: `inactive:${SHELL}`,
      icon: 'clock',
      title: '1 student inactive for 14 days or more',
      sub: `Rahul Verma · ${SHELL_NAME}`,
      action: { label: 'View students', href: `/faculty/students?experimentId=${SHELL}` },
    });
    expect(writtenAnswersWaiting([marking, inactive, { ...marking, answers: 2 }])).toBe(3);
    const rows = attentionRows([marking, ended(1), inactive, ...[2, 3, 4, 5, 6].map(ended)]);
    expect(rows).toHaveLength(ATTENTION_BUDGET);
    expect(rows.map((row) => row.title)).toEqual([
      '1 written answer to mark',
      'Your institution’s access to Experiment 1 ended on 7 Oct 2027',
      '1 student inactive for 14 days or more',
      ...[2, 3].map(
        (index) => `Your institution’s access to Experiment ${index} ended on 7 Oct 2027`,
      ),
    ]);
    // Without a code: the line alone (state-copy `FA-01.access-ended-no-code`).
    expect(rows[1]!.sub).toBe('Students can’t open it now; their work and results are kept');
  });

  it('every drawn phrase is B4-01’s (the failed words B4-02 f5’s), composed with the board’s sample values', () => {
    for (const phrase of Object.values(FACULTY_OVERVIEW_WORDS)) expect(B4_01).toContain(phrase);
    for (const phrase of Object.values(FACULTY_FAILED_WORDS)) expect(B4_02).toContain(phrase);
    expect(B4_01).toContain(`${scopeLineWords(1, 1)}<a`);
    expect(B4_01).toContain(attentionCountWords(3));
    expect(B4_01).toContain(attentionCountWords(1));
    expect(B4_01).toContain(accessEndedTitle(SHELL_NAME, '7 Oct 2027'));
    expect(B4_01).toContain(accessEndedSub('ME ZG523'));
    expect(B4_01).toContain(comingUpSub('14 Nov 2026, 23:59', 1, 5));
    // The undrawn forms are the register's.
    expect(scopeLineWords(2, 3)).toBe('You teach 2 courses · 3 experiments · ');
    expect(comingUpSub('14 Nov 2026, 23:59', 0, 1)).toBe(
      'Due 14 Nov 2026, 23:59 · 0 of 1 student submitted',
    );
  });

  it('every FA-01 action in the ledger reaches a built page; the drafts row waits for its fact', () => {
    const mine = LINK_TARGET_LEDGER.filter((entry) => entry.screen === 'FA-01');
    expect(mine.map((entry) => `${entry.action} · ${entry.outcome}`)).toEqual([
      'Mark <n> written answer · built',
      'My courses · built',
      'Mark now · built',
      'Review drafts · not-rendered',
      'View students · built',
      'My courses · built',
      'Open · built',
      'Help · built',
      'Try again · in-page',
    ]);
    // One primary, as B4-01 draws it (Phase 4B: FA-18 is built).
    expect(mine.filter((entry) => entry.role === 'primary').map((entry) => entry.action)).toEqual([
      'Mark <n> written answer',
    ]);
    for (const entry of mine) {
      expect(entry.on).toBe('/faculty');
      if (entry.target === null) continue;
      const target = expandTarget(entry.target, '/faculty').split('?')[0]!;
      const resolved = resolveAddress(target);
      if (entry.outcome === 'built') {
        expect(['screen', 'record-screen'], `${entry.action}`).toContain(resolved.kind);
        continue;
      }
      // "Review drafts": FA-16 and the Drafts tab are built; the service names no drafts (PC-51).
      expect(entry.outcome).toBe('not-rendered');
      expect(entry.action).toBe('Review drafts');
      expect(entry.note).toMatch(/no drafts fact/);
      expect(BUILT_SCREENS.has('FA-16')).toBe(true);
    }
    expect(resolveAddress('/faculty/marking')).toEqual(
      expect.objectContaining({ screen: 'FA-18' }),
    );
    expect(resolveAddress('/faculty/students')).toEqual(
      expect.objectContaining({ screen: 'FA-20' }),
    );
    expect(resolveAddress(expandTarget('/faculty/assessments/{assessmentId}', '/faculty'))).toEqual(
      expect.objectContaining({ screen: 'FA-08' }),
    );
  });

  it('every state-copy entry of FA-01 is provisional, with its decision, and names no decision in its words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_OVERVIEW)) {
      expect(id.startsWith('FA-01.'), id).toBe(true);
      expect(entry.screen).toBe('FA-01');
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD)-\d/);
    }
  });
});
