/**
 * FA-01 Overview — the owner-approved V3 design (design/v3-refined-b/roles/FA-v1 `Main.dc.html`
 * FA-01, `vmOverview`) on the real composition root and the sample world: the scope line, the
 * priority band ("Needs your attention"), the calm state, "Coming up" and "Your teaching", as
 * `TeachingService.getFacultyOverview`, the marking queue, Students, `listMyCourses` and the taught
 * experiments answer them, for Dr S. Ranganathan (per-0014, ME ZG523) and Dr Anita Desai (per-0015,
 * no course yet; then a co-teaching colleague). The one world is proved end to end: Meera Iyer's
 * Faculty course assignment (IA-15) turns Anita's "no courses" card into her overview; a Ready
 * assessment saved through the assessments port appears under Coming up; a Student's submission
 * brings the written answers to mark with "Mark now" (the oldest submission, FA-19); the sample clock
 * moved gives the inactive Students (FA-20) and the course whose access ended. The drafts item stays
 * undrawn (no service fact). No internal reference anywhere on the page.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  AssessmentListRow,
  FacultyAttention,
  FacultyStudentRow,
  MarkingQueueRow,
} from '@xr/contracts/draft';
import type { AssessmentId, ExperimentId, IsoInstant, PersonId } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { assessmentName, UNTITLED_DRAFT } from '@/copy/fa-shared';
import {
  acrossWords,
  ATTENTION_ITEMS,
  FACULTY_OVERVIEW_WORDS,
  GET_READY,
  lastActiveWords,
  markNowLabel,
  moreInWords,
  oldestWaitingWords,
  openDueLabel,
  releaseRuleWords,
  scopeLineWords,
  submittedWords,
  TEACHING_STATUS,
} from '@/copy/faculty-overview';
import { STATE_COPY_FACULTY_OVERVIEW } from '@/copy/state-copy-faculty-overview';
import { BUILT_SCREENS } from '@/nav/built-screens';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import { renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { FacultyOverview } from './fa-01-overview/overview';
import {
  deadlineViews,
  isNewTeacher,
  NAMES_SHOWN,
  priorityItems,
  submittedAtWords,
  writtenAnswersWaiting,
} from './fa-01-overview/overview-view';
import type { TaughtExperiment } from './fa-04-experiments/taught-experiments';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const MEERA = 'per-0001';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const COURSE = 'thermodynamics-heat-transfer';
const COURSE_NAME = 'Thermodynamics & Heat Transfer';
/** Two days after ACC-0107's term ends on 7 Oct 2027 (09:00 in Indian time). */
const AFTER_ACCESS_ENDED = '2027-10-09T03:30:00.000Z';
const LEAD = 'You teach 1 course with 1 experiment, as assigned by your Institute Admin.';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

/** The export's text with tags removed and entities read, then its raw markup and script. */
const RAW = faExport('Main.dc.html');
const EXPORT = `${RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${RAW}`;

/** An internal reference (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the page's words, names, placeholders or the tab's title. */
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
/** An element's words with a space between its text nodes (as a screen reader reads them). */
function text(node: Element | null): string {
  if (!node) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    parts.push(current.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
const h1 = () => screen.findByRole('heading', { level: 1, name: 'Overview' }, { timeout: 5000 });
const lead = () => document.querySelector('.rk-head .rk-sub');
const band = () => screen.findByRole('region', { name: 'Needs your attention' }, { timeout: 5000 });
const comingUp = () => screen.findByRole('region', { name: 'Coming up' }, { timeout: 5000 });
const teaching = () => screen.findByRole('region', { name: 'Your teaching' }, { timeout: 5000 });
const calm = () => document.querySelector('.rb-calm[role="status"]');
const items = (region: HTMLElement) => [...region.querySelectorAll('li.rb-pi')] as HTMLElement[];

/** With nothing to mark and no inactive Student, none of the band's actions is on the page. */
function expectNoBandActions() {
  for (const name of [/^Mark now/, /^Review drafts/, /^View students/]) {
    expect(screen.queryByRole('link', { name })).toBeNull();
  }
  expect(screen.queryByRole('region', { name: 'Needs your attention' })).toBeNull();
}

/** A Student starts, answers the written question and submits (ST-13), as they would. */
async function submits(
  runtime: PlatformRuntime,
  sample: Sample,
  assessmentId: AssessmentId,
  studentId = 'per-0002',
) {
  const student = asPersonId(sample, studentId);
  await act(async () => {
    const started = await student.assessments.startAttempt(assessmentId);
    if (!started.ok) throw new Error(`start ${JSON.stringify(started.error)}`);
    const saved = await student.assessments.saveAnswer({
      attemptId: started.value.id,
      questionId: 'Q-0106' as never,
      answer: { type: 'written', text: 'U falls, so less heat passes.' },
      expectedRev: started.value.rev,
    });
    if (!saved.ok) throw new Error(`answer ${JSON.stringify(saved.error)}`);
    const submitted = await student.assessments.submitAttempt({
      attemptId: saved.value.id,
      expectedRev: saved.value.rev,
    });
    if (!submitted.ok) throw new Error(`submit ${JSON.stringify(submitted.error)}`);
    await runtime.invalidate(submitted.changed);
  });
}

/** A Ready assessment of Shell-and-Tube through the assessments port (FA-07 "Create"). */
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

// ---- The page as he sees it after Flow C ----------------------------------------------------------

describe('FA-01 — Dr S. Ranganathan after Flow C', () => {
  it('the date, the H1, the scope line, the V3 shell (Overview current) and Your teaching', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await h1();
    await teaching();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    // The head: the date on phones (`p.rb-eyebrow-date`), "Overview" and the scope line.
    expect(main().querySelector('.rk-head .rb-eyebrow-date')).toHaveTextContent(
      'Tuesday 27 October 2026',
    );
    expect(text(lead())).toBe(LEAD);
    // The V3 shell: the Faculty rail, Overview current, Help & support in its foot.
    const rail = screen.getByRole('navigation', { name: 'Faculty navigation' });
    expect(
      within(rail)
        .getAllByRole('link')
        .map((link) => link.querySelector('span')?.textContent),
    ).toEqual(['Overview', 'My courses', 'Assessments', 'Question bank', 'Marking', 'Students']);
    expect(rail.querySelector('[aria-current="page"]')).toHaveAttribute('href', '/faculty');
    expect(document.querySelector('aside.rb-rail .rb-rail-foot a')).toHaveAttribute(
      'href',
      '/faculty/help',
    );

    // Your teaching: the course with its code and "Open course", the experiment with its formats,
    // who has it, one unit meter per format and its assessment.
    const pane = await teaching();
    expect(pane).toHaveClass('rb-panel', 'fa-pane');
    expect(text(pane.querySelector('.fa-pane-head .rb-note'))).toBe('As of 27 Oct 2026');
    const course = pane.querySelector('.fa-tc')!;
    expect(text(course.querySelector('.rb-code'))).toBe('ME ZG523');
    expect(text(course.querySelector('h3.fa-tc-t'))).toBe(COURSE_NAME);
    expect(
      within(course as HTMLElement).getByRole('link', {
        name: `Open course ME ZG523 ${COURSE_NAME}`,
      }),
    ).toHaveAttribute('href', `/faculty/courses/${COURSE}`);
    const experiment = course.querySelector('.fa-te')!;
    expect(
      within(experiment as HTMLElement).getByRole('link', { name: SHELL_NAME }),
    ).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(
      within(experiment as HTMLElement).getByRole('img', {
        name: 'Formats your institution has: WEB, VR',
      }),
    ).toBeVisible();
    expect(text(experiment.querySelector('.fa-te-n'))).toBe('1 student with access');
    const progress = within(experiment as HTMLElement).getByRole('list', {
      name: `Student activity by format for ${SHELL_NAME}, as of 27 Oct 2026`,
    });
    // The separators between the three counts are drawn by CSS (`span + span::before`).
    expect([...progress.querySelectorAll('li.fa-prog-row')].map((row) => text(row))).toEqual([
      'WEB 1 completed 0 in progress 0 not started',
      'VR 1 completed 0 in progress 0 not started',
    ]);
    // One unit per Student reached: Rahul completed both formats.
    expect(progress.querySelectorAll('li:first-child .fa-units > i.is-done')).toHaveLength(1);
    expect(text(experiment.querySelector('.fa-te-asm'))).toBe(TEACHING_STATUS.none);
    // No KPI tiles, no percentages, never one figure across formats.
    expect(main().textContent).not.toMatch(/%|total/i);
    expectNoReferences();
  });

  it('nothing needs him: the calm state, and none of the band’s actions', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await teaching();
    const answer = await runtime.ports.teaching.getFacultyOverview();
    expect(answer.ok && answer.value.attention).toEqual([]);
    const state = calm()!;
    expect(state).toHaveClass('rb-calm', 'fa-calm');
    expect(text(state.querySelector('.rb-calm-t'))).toBe('Nothing needs you right now');
    expect(text(state.querySelector('.rb-calm-d'))).toBe(
      'Written answers to mark, drafts to review and inactive students appear here.',
    );
    expectNoBandActions();
  });

  it('Coming up before any assessment: “No deadlines yet. …”; once one exists: “No deadlines in the next 30 days.”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    const pane = await comingUp();
    expect(text(pane.querySelector('.fa-pane-head .rb-note'))).toBe('Next 30 days');
    expect(text(pane.querySelector('p.fa-upi-none'))).toBe(
      'No deadlines yet. They appear here once you create an assessment.',
    );
    expect(pane.querySelector('ul.fa-uplist')).toBeNull();
    // A draft is never coming up (the service's Ready only), even with a deadline in 30 days.
    await createReady(runtime, '2026-11-14T23:59:00+05:30', 'save-as-draft');
    const listed = await runtime.ports.assessments.listAssessments();
    expect(listed.ok && listed.value.map((row) => row.readiness)).toEqual(['draft-not-ready']);
    await waitFor(() =>
      expect(text(pane.querySelector('p.fa-upi-none'))).toBe('No deadlines in the next 30 days.'),
    );
  });

  it('a Ready assessment due within 30 days appears under Coming up: date tile, days left, meter, release', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await comingUp();
    const id = await createReady(runtime);
    const pane = await comingUp();
    const item = await waitFor(() => {
      const found = pane.querySelector('ul.fa-uplist > li.fa-upi');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(item.querySelector('.fa-date')).toHaveAttribute('aria-hidden', 'true');
    expect(text(item.querySelector('.fa-date b'))).toBe('14');
    expect(text(item.querySelector('.fa-date span'))).toBe('Nov');
    const open = within(item).getByRole('link', {
      name: 'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
    });
    expect(open).toHaveAttribute('href', `/faculty/assessments/${id}`);
    expect(open).toHaveTextContent(/^Heat Exchanger — post-lab$/);
    expect(text(item.querySelector('p.fa-upi-d'))).toBe('Due 14 Nov 2026, 23:59 · 18 days left');
    expect(text(item.querySelector('p.fa-upi-d b'))).toBe('18 days left');
    // Rahul is the one Godavari Student it reaches in this world: one unit, not submitted.
    expect(item.querySelectorAll('.fa-upi-meter .fa-units > i')).toHaveLength(1);
    expect(item.querySelectorAll('.fa-upi-meter .fa-units > i.is-sub')).toHaveLength(0);
    expect(text(item.querySelector('.fa-upi-meter p'))).toBe('0 of 1 student submitted');
    expect(text(item.querySelector('p.fa-upi-rel'))).toBe(
      'Students see results after the deadline',
    );
    // Your teaching names it, Ready.
    expect(text((await teaching()).querySelector('.fa-te-asm'))).toBe(
      `${TEACHING_STATUS.ready} Heat Exchanger — post-lab`,
    );
    // Nothing is submitted yet: still calm.
    expect(calm()).not.toBeNull();
    expectNoReferences();
  });

  it('a deadline past the next 30 days is not coming up', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showOverview(runtime);
    await comingUp();
    await createReady(runtime, '2026-12-20T23:59:00+05:30');
    await waitFor(async () =>
      expect(text((await comingUp()).querySelector('p.fa-upi-none'))).toBe(
        'No deadlines in the next 30 days.',
      ),
    );
  });

  it('Students inactive for 14 days: one item, the names and last activity, “View students” (FA-20)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    moveClock(sample, '2026-12-01T03:30:00.000Z');
    const answer = await runtime.ports.teaching.getFacultyOverview();
    expect(answer.ok && answer.value.attention.map((item) => item.kind)).toEqual([
      'students-inactive',
    ]);
    showOverview(runtime);
    const region = await band();
    expect(region).toHaveClass('rb-prio', 'fa-prio--1');
    // One item: no ordering note.
    expect(region.querySelector('.rb-sec-head .rb-note')).toBeNull();
    const [item] = items(region);
    expect(text(item!.querySelector('.rb-pi-big'))).toBe('1');
    expect(item!.querySelector('.rb-pi-rel')).toHaveClass('rb-pi-rel--calm');
    expect(text(item!.querySelector('.rb-pi-rel'))).toBe('Inactive 14 days or more');
    expect(text(item!.querySelector('.rb-pi-kind'))).toBe('Student to follow up');
    expect(text(item!.querySelector('h3.rb-pi-title'))).toBe(SHELL_NAME);
    const list = within(item!).getByRole('list', {
      name: 'Students inactive for 14 days or more, longest first',
    });
    // Rahul last opened a format on 16 Oct (OD-B4-10: activity is opening a format).
    expect([...list.querySelectorAll('li')].map((row) => text(row))).toEqual([
      'Rahul Verma Last active 16 Oct',
    ]);
    const view = within(item!).getByRole('link', {
      name: 'View students inactive for 14 days or more',
    });
    expect(view).toHaveTextContent(/^View students$/);
    expect(view).toHaveClass('rb-btn', 'rb-btn--lg');
    expect(view).not.toHaveClass('rb-btn--primary');
    expect(view).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);
    expect(screen.queryByRole('link', { name: /^Mark now/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /^Review drafts/ })).toBeNull();
    expect(calm()).toBeNull();
    expectNoReferences();
  });

  it('a submitted written answer: the item, the student behind it and “Mark now” — the oldest submission (FA-19)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createReady(runtime, '2026-11-14T23:59:00+05:30', 'create', [
      'Q-0101',
      'Q-0106',
    ]);
    showOverview(runtime);
    await teaching();
    await submits(runtime, sample, id);
    const region = await band();
    const queue = await runtime.ports.marking.listQueue({ state: 'waiting' });
    if (!queue.ok) throw new Error('queue');
    const attempt = queue.value[0]!.attempt.id;
    await waitFor(() =>
      expect(
        within(region).getByRole('link', {
          name: 'Mark now: Rahul Verma, Heat Exchanger — post-lab',
        }),
      ).toHaveAttribute('href', `/faculty/marking/${attempt}`),
    );
    const [item] = items(region);
    expect(text(item!.querySelector('.rb-pi-big'))).toBe('1');
    expect(item!.querySelector('.rb-pi-rel')).not.toHaveClass('rb-pi-rel--calm');
    expect(text(item!.querySelector('.rb-pi-rel'))).toBe('Submitted today');
    expect(text(item!.querySelector('.rb-pi-kind'))).toBe('Written answer to mark');
    expect(item!.querySelector('.rb-pi-kind path')).toHaveAttribute(
      'd',
      'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    );
    expect(text(item!.querySelector('h3.rb-pi-title'))).toBe('Heat Exchanger — post-lab');
    expect(text(item!.querySelector('.rb-pi-d'))).toBe(
      'Choice questions are marked automatically.',
    );
    const list = within(item!).getByRole('list', { name: 'Waiting for marking, oldest first' });
    expect([...list.querySelectorAll('li')].map((row) => text(row))).toEqual([
      'Rahul Verma 27 Oct, 10:00',
    ]);
    const markNow = within(item!).getByRole('link', { name: /^Mark now/ });
    expect(markNow).toHaveTextContent(/^Mark now$/);
    expect(markNow).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    // The page's one primary.
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(screen.queryByRole('link', { name: /^Review drafts/ })).toBeNull();
    // Coming up shows the submission on the meter.
    const upi = (await comingUp()).querySelector('li.fa-upi')!;
    expect(upi.querySelectorAll('.fa-units > i.is-sub')).toHaveLength(1);
    expect(text(upi.querySelector('.fa-upi-meter p'))).toBe('1 of 1 student submitted');
    expectNoReferences();
  });
});

// ---- A new teacher (after Flow B: no assessment, an empty bank, no Student yet) ---------------------

describe('FA-01 — a new teacher: “Get your course ready”', () => {
  it('no assessment, nothing in the bank, no Student: three steps with one real entry action each', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    // No sample world has a Faculty member whose experiment no Student has been given (Rahul is
    // given Shell-and-Tube before any Faculty member exists, and a deactivated Student is still
    // counted). The teaching read is answered as it would be before that grant: no Student yet.
    const teachingPort = runtime.ports.teaching;
    const read = teachingPort.getTeachingExperiment.bind(teachingPort);
    Object.defineProperty(teachingPort, 'getTeachingExperiment', {
      configurable: true,
      value: async (experimentId: ExperimentId) => {
        const answer = await read(experimentId);
        if (!answer.ok) return answer;
        return {
          ...answer,
          value: {
            ...answer.value,
            formatsUsedByStudents: [],
            perFormatCounts: answer.value.perFormatCounts.map((row) => ({
              ...row,
              completed: 0,
              inProgress: 0,
              notStarted: 0,
            })),
          },
        };
      },
    });
    // After Flow B nothing is in his question bank and there is no assessment.
    const bank = await runtime.ports.questionBank.listQuestions({
      experimentId: SHELL as ExperimentId,
    });
    expect(bank.ok && bank.value).toEqual([]);
    showOverview(runtime);
    const ready = await screen.findByRole(
      'region',
      { name: 'Get your course ready' },
      { timeout: 5000 },
    );
    expect(ready).toHaveClass('fa-ready');
    expect(text(ready.querySelector('.rb-sec-head .rb-note'))).toBe(`For ${SHELL_NAME}`);
    expect([...ready.querySelectorAll('li.fa-ready-i h3')].map((h) => h.textContent)).toEqual([
      'Write questions',
      'Create the assessment',
      'Look at the experiment',
    ]);
    const add = within(ready).getByRole('link', { name: 'Add a question' });
    expect(add).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(add).toHaveAttribute('href', `/faculty/question-bank/new?experimentId=${SHELL}`);
    expect(within(ready).getByRole('link', { name: 'Create assessment' })).toHaveAttribute(
      'href',
      `/faculty/assessments/new?experimentId=${SHELL}`,
    );
    expect(within(ready).getByRole('link', { name: 'Open experiment' })).toHaveAttribute(
      'href',
      `/faculty/experiments/${SHELL}`,
    );
    expect(calm()).toBeNull();
    // Your teaching: no Student yet.
    const experiment = (await teaching()).querySelector('.fa-te')!;
    expect(text(experiment.querySelector('.fa-te-n'))).toBe('No students yet');
    expect(text(experiment.querySelector('p.fa-quiet'))).toBe(
      'No students yet. They appear when your Institute Admin gives them access.',
    );
    expect(text((await comingUp()).querySelector('p.fa-upi-none'))).toBe(
      'No deadlines yet. They appear here once you create an assessment.',
    );
    expectNoReferences();
  });
});

// ---- Course access ended (a product state the export does not draw) ------------------------------

describe('FA-01 — course access ended', () => {
  it('the access-ended item with its code and My courses; Your teaching and the scope stay', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    moveClock(sample, AFTER_ACCESS_ENDED);
    showOverview(runtime);
    const region = await band();
    const [item] = items(region);
    expect(text(item!.querySelector('.rb-pi-big'))).toBe('1');
    expect(text(item!.querySelector('.rb-pi-rel'))).toBe('Ended 7 Oct 2027');
    expect(text(item!.querySelector('.rb-pi-kind'))).toBe('Course access ended');
    expect(text(item!.querySelector('h3.rb-pi-title'))).toBe(SHELL_NAME);
    expect(text(item!.querySelector('.rb-pi-d'))).toBe(
      'ME ZG523 · students can’t open it now; their work and results are kept',
    );
    expect(within(item!).getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/faculty/courses',
    );
    expect(text(lead())).toBe(LEAD);
    expect(text((await comingUp()).querySelector('p.fa-upi-none'))).toBe(
      'No deadlines yet. They appear here once you create an assessment.',
    );
    expect(screen.queryByRole('link', { name: /^Mark now/ })).toBeNull();
  });

  it('an assessment whose deadline passed with the access is not coming up', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await createReady(runtime);
    moveClock(sample, AFTER_ACCESS_ENDED);
    showOverview(runtime);
    expect((await comingUp()).querySelector('ul.fa-uplist')).toBeNull();
  });
});

// ---- No courses yet, Meera assigns one, and a co-teaching colleague ------------------------------

describe('FA-01 — Dr Anita Desai: no courses yet, then Meera assigns one (IA-15)', () => {
  it('the message card and Help & support only — no scope line, no band, no panes', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showOverview(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'Your Institute Admin hasn’t assigned you courses yet' },
      { timeout: 5000 },
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(lead()).toBeNull();
    const card = screen.getByRole('region', { name: FACULTY_OVERVIEW_WORDS.noCoursesTitle });
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(title.closest('.fa-inlinemsg')).not.toBeNull();
    expect(text(card.querySelector('p.fa-msg-d'))).toBe(
      'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
    );
    expect(card.querySelector('.fa-msg-ico path')).toHaveAttribute(
      'd',
      'M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11M9 8.5h6',
    );
    const help = within(card).getByRole('link', { name: 'Help & support' });
    expect(help).toHaveClass('rb-link');
    expect(help).toHaveAttribute('href', '/faculty/help');
    expect(screen.queryByRole('region', { name: 'Needs your attention' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Coming up' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Your teaching' })).toBeNull();
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty');
    expectNoReferences();
  });

  it('Meera assigns her ME ZG523 in Faculty courses: her overview gains the scope line and panes', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    showOverview(runtime);
    await screen.findByRole(
      'heading',
      { level: 2, name: 'Your Institute Admin hasn’t assigned you courses yet' },
      { timeout: 5000 },
    );
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
    await waitFor(() => expect(text(lead())).toBe(LEAD));
    expect(
      screen.queryByRole('heading', {
        name: 'Your Institute Admin hasn’t assigned you courses yet',
      }),
    ).toBeNull();
    expect(calm()).not.toBeNull();
    expect(text((await comingUp()).querySelector('p.fa-upi-none'))).toBe(
      'No deadlines yet. They appear here once you create an assessment.',
    );
  });

  it('a co-teaching colleague’s assessment: “Created by …” under Coming up and in Your teaching, no meter', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-d');
    moveClock(sample, '2026-11-07T04:30:00.000Z');
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as PersonId,
      courseId: COURSE as never,
    });
    expect(assigned.ok).toBe(true);
    showOverview(runtime);
    const pane = await comingUp();
    const item = await waitFor(() => {
      const found = pane.querySelector('li.fa-upi');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(item.querySelector('.fa-upi-meter')).toBeNull();
    expect([...item.querySelectorAll('p.fa-upi-d')].map((line) => text(line))[1]).toBe(
      'Created by Dr S. Ranganathan',
    );
    expect(text((await teaching()).querySelector('.fa-te-asm'))).toBe(
      `${TEACHING_STATUS.ready} Heat Exchanger — post-lab · created by Dr S. Ranganathan`,
    );
    // Nothing of hers waits for marking: no Mark now.
    expect(screen.queryByRole('link', { name: /^Mark now/ })).toBeNull();
    expectNoReferences();
  });
});

// ---- Loading and failed (the application's) ------------------------------------------------------

describe('FA-01 — loading and failed (state-copy FA-01.loading, FA-01.failed)', () => {
  it('announces loading; a failed read says so with Try again, which reads again and moves focus to the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.getFacultyOverview');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<FacultyOverview />, { runtime, navigation: testNavigation('/faculty') });
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading your overview');
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(lead()).toBeNull();
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alert).toHaveClass('rk-state');
    expect(
      within(alert).getByRole('heading', { level: 2, name: 'We couldn’t load your overview' }),
    ).toBeVisible();
    expect(alert).toHaveTextContent('Nothing has changed. Try again.');
    expect(lead()).toBeNull();
    const retry = within(alert).getByRole('button', { name: 'Try again' });
    expect(retry).toHaveClass('rb-btn');
    await user.click(retry);
    await waitFor(() => expect(calm()).not.toBeNull());
    expect(text(lead())).toBe(LEAD);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toHaveFocus();
  });
});

// ---- The band's rule (pure), the words and the registers -------------------------------------------

const written = (
  assessment: string,
  answers: number,
  submittedAt: string,
  student = 'Rahul Verma',
): FacultyAttention => ({
  kind: 'written-answers-to-mark',
  assessmentId: `A-${assessment}` as AssessmentId,
  assessmentName: assessment,
  answers,
  oldest: { studentName: student, submittedAt: submittedAt as never },
});
const queueRow = (id: string, student: string, submittedAt: string): MarkingQueueRow =>
  ({
    attempt: { id, assessmentId: 'A' },
    student: { fullName: student },
    assessmentName: 'Heat Exchanger — post-lab',
    submittedAt,
  }) as never;

describe('FA-01 — the band, Coming up and the new teacher (pure)', () => {
  const today = '2026-11-07T04:30:00.000Z';

  it('written answers: one item over several assessments, the oldest wait, three names, then “more in Marking”', () => {
    const facts = [
      written('Heat Exchanger — post-lab', 3, '2026-11-05T13:22:00.000Z'),
      written('Venturi Meter — quiz', 2, '2026-11-06T14:40:00.000Z', 'Priya Natarajan'),
    ];
    const queue = [
      queueRow('A1', 'Rahul Verma', '2026-11-05T13:22:00.000Z'),
      queueRow('A2', 'Priya Natarajan', '2026-11-06T14:40:00.000Z'),
      queueRow('A3', 'Imran Shaikh', '2026-11-06T15:00:00.000Z'),
      queueRow('A4', 'Divya Menon', '2026-11-06T16:00:00.000Z'),
    ];
    const [item] = priorityItems(facts, queue, new Map(), today);
    expect(item).toMatchObject({
      big: '5',
      relative: 'Oldest waiting 2 days',
      calm: false,
      kindLabel: 'Written answers to mark',
      title: 'Across 2 assessments',
      description: 'Choice questions are marked automatically.',
      action: {
        label: 'Mark now',
        href: null,
        primary: true,
        accessibleName: 'Mark now: Rahul Verma, Heat Exchanger — post-lab',
      },
    });
    expect(item!.list!.rows.map((row) => `${row.name} · ${row.detail}`)).toEqual([
      'Rahul Verma · 5 Nov, 18:52',
      'Priya Natarajan · 6 Nov, 20:10',
      'Imran Shaikh · 6 Nov, 20:30',
    ]);
    expect(item!.list!.rows).toHaveLength(NAMES_SHOWN);
    expect(item!.list!.more).toBe('and 2 more in Marking');
    expect(writtenAnswersWaiting(facts)).toBe(5);
    // Without the queue (not answered, or failed): the facts alone, no names.
    expect(priorityItems(facts, null, new Map(), today)[0]!.list).toBeNull();
  });

  it('inactive Students: one item over several experiments, longest inactive first, three names', () => {
    const facts: FacultyAttention[] = [
      {
        kind: 'students-inactive',
        experimentId: SHELL as ExperimentId,
        experimentName: SHELL_NAME,
        days: 14,
        students: [
          { studentId: 'p1' as PersonId, name: 'Imran Shaikh' },
          { studentId: 'p2' as PersonId, name: 'Karthik Rao' },
        ],
      },
      {
        kind: 'students-inactive',
        experimentId: 'venturi' as ExperimentId,
        experimentName: 'Venturi Meter',
        days: 14,
        students: [
          { studentId: 'p3' as PersonId, name: 'Divya Menon' },
          { studentId: 'p4' as PersonId, name: 'Sneha Reddy' },
        ],
      },
    ];
    const row = (studentId: string, inactiveDays: number, last: string | null) =>
      ({
        studentId,
        inactiveDays,
        lastActivityAt: last,
        accessGivenAt: '2026-10-12T04:30:00.000Z',
      }) as unknown as FacultyStudentRow;
    const students = new Map([
      [SHELL, [row('p1', 19, '2026-10-19T04:30:00.000Z'), row('p2', 26, null)]],
    ]);
    const [item] = priorityItems(facts, null, students, today);
    expect(item).toMatchObject({
      big: '4',
      relative: 'Inactive 14 days or more',
      calm: true,
      kindLabel: 'Students to follow up',
      title: 'Across 2 experiments',
      action: { href: `/faculty/students?experimentId=${SHELL}`, primary: false },
    });
    expect(item!.list!.rows.map((entry) => `${entry.name} · ${entry.detail ?? ''}`)).toEqual([
      'Karthik Rao · No activity since access, 12 Oct',
      'Imran Shaikh · Last active 19 Oct',
      // Students for Venturi Meter has not answered: the name alone.
      'Divya Menon · ',
    ]);
    expect(item!.list!.more).toBe('and 1 more in Students');
  });

  it('the order: written answers, inactive Students, then a course whose access ended; the drafts item never', () => {
    const ended: FacultyAttention = {
      kind: 'access-ended',
      experimentId: SHELL as ExperimentId,
      experimentName: SHELL_NAME,
      courseCode: null,
      endedOn: '2027-10-07' as never,
    };
    const inactive: FacultyAttention = {
      kind: 'students-inactive',
      experimentId: SHELL as ExperimentId,
      experimentName: SHELL_NAME,
      days: 14,
      students: [{ studentId: 'per-0002' as PersonId, name: 'Rahul Verma' }],
    };
    const result = priorityItems(
      [ended, inactive, written('Heat Exchanger — post-lab', 1, '2026-11-07T04:00:00.000Z')],
      null,
      new Map(),
      today,
    );
    expect(result.map((item) => item.key)).toEqual(['written', 'inactive', 'access-ended']);
    expect(result[0]!.relative).toBe('Submitted today');
    // Without a code: the line alone (state-copy `FA-01.access-ended-no-code`).
    expect(result[2]!.description).toBe(
      'Students can’t open it now; their work and results are kept',
    );
    expect(
      priorityItems(
        [ended, { ...ended, experimentId: 'venturi' as ExperimentId }],
        null,
        new Map(),
        today,
      )[0],
    ).toMatchObject({ big: '2', relative: 'Access ended', title: 'Across 2 experiments' });
    // An unnamed assessment is an "Untitled draft", never its reference.
    expect(priorityItems([written('', 1, today)], null, new Map(), today)[0]!.title).toBe(
      UNTITLED_DRAFT,
    );
  });

  it('Coming up: days left on the session’s day, the release rule, a colleague’s “Created by”', () => {
    const rows = [
      {
        assessment: {
          id: 'A-1',
          createdBy: {
            kind: 'person',
            personId: 'per-0014',
            role: 'faculty',
            displayName: 'Dr S. Ranganathan',
          },
          rules: { release: { option: 'on-date', releaseDate: '2026-11-20T03:30:00.000Z' } },
        },
      },
    ] as unknown as AssessmentListRow[];
    const comingUp = [
      {
        assessmentId: 'A-1' as AssessmentId,
        name: 'Heat Exchanger — post-lab',
        deadline: '2026-11-14T18:29:00.000Z' as IsoInstant,
        submitted: 2,
        reach: 5,
      },
    ];
    const [own] = deadlineViews(comingUp, rows, 'per-0014', today);
    expect(own).toMatchObject({
      day: '14',
      month: 'Nov',
      due: 'Due 14 Nov 2026, 23:59',
      left: '7 days left',
      createdBy: null,
      release: 'Students see results on 20 Nov 2026, 09:00',
      accessibleName: 'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
    });
    expect(own!.submissions).toEqual({
      units: ['submitted', 'submitted', 'none', 'none', 'none'],
      line: '2 of 5 students submitted',
    });
    const [colleague] = deadlineViews(comingUp, rows, 'per-0015', '2026-11-14T10:00:00.000Z');
    expect(colleague).toMatchObject({
      submissions: null,
      createdBy: 'Created by Dr S. Ranganathan',
      left: 'today',
    });
  });

  it('a new teacher: a course, no assessment, an empty bank and no Student yet', () => {
    const entry = (reach: number) =>
      ({
        option: { experimentId: SHELL, name: SHELL_NAME },
        teaching: {
          perFormatCounts: [{ format: 'web', completed: 0, inProgress: 0, notStarted: reach }],
        },
        assessment: null,
      }) as unknown as TaughtExperiment;
    const base = { courses: 1, taught: [entry(0)], assessments: [], bankEmpty: true } as const;
    expect(isNewTeacher(base)).toBe(true);
    expect(isNewTeacher({ ...base, taught: [entry(1)] })).toBe(false);
    expect(isNewTeacher({ ...base, bankEmpty: false })).toBe(false);
    expect(isNewTeacher({ ...base, bankEmpty: null })).toBe(false);
    expect(isNewTeacher({ ...base, taught: [] })).toBe(false);
    expect(isNewTeacher({ ...base, assessments: [{} as AssessmentListRow] })).toBe(false);
  });
});

describe('FA-01 — words, ledger and register', () => {
  it('every drawn phrase is the export’s, the composed ones as its script composes them', () => {
    const drawn = [
      ...Object.values(FACULTY_OVERVIEW_WORDS),
      ...Object.values(ATTENTION_ITEMS.written),
      ...Object.values(ATTENTION_ITEMS.inactive),
      GET_READY.title,
      ...Object.values(GET_READY.steps).flatMap((step) => Object.values(step)),
      ...Object.values(TEACHING_STATUS),
    ];
    for (const phrase of drawn) expect(EXPORT, phrase).toContain(phrase);
    // The script's forms (`vmOverview`).
    for (const form of [
      "'You teach ' + this.plural(nC, 'course') + ' with ' + this.plural(nE, 'experiment') + ', as assigned by your Institute Admin.'",
      "'Oldest waiting ' + this.plural(d0, 'day')",
      "'Across ' + asms.length + ' assessments'",
      "'Across ' + ex.length + ' experiments'",
      "'and ' + (wait.length - 3) + ' more in Marking'",
      "'and ' + (inact.length - 3) + ' more in Students'",
      "'Mark now: ' + this.stu(o.st).n + ', ' + (a.name || 'Untitled draft')",
      "'Last active ' + this.shortDay(s.last)",
      "'No activity since access, ' + this.shortDay(s.access)",
      "'For ' + exps[0].t",
      "'Due ' + cfg.dl, left: days === 0 ? 'today' : this.plural(days, 'day') + ' left'",
      "subs.length + ' of ' + this.plural(ss.length, 'student') + ' submitted'",
      "'Created by ' + this.person(a.by).name",
      "'Students see results as soon as answers are marked'",
      "'Students see results on ' + cfg.reldate",
      "'Open ' + a.name + ', due ' + cfg.dl",
      "'As of ' + W.clock.day",
      "'Open course ' + c.code + ' ' + c.t",
      "'Formats your institution has: ' + e.held.join(', ')",
      "this.plural(n, 'student') + ' with access' : 'No students yet'",
      "'Student activity by format for ' + e.t + ', as of ' + W.clock.day",
      "(this.own(a) ? '' : ' · created by ' + this.person(a.by).name)",
    ]) {
      expect(RAW, form).toContain(form);
    }
    expect(scopeLineWords(1, 1)).toBe(LEAD);
    expect(scopeLineWords(2, 3)).toBe(
      'You teach 2 courses with 3 experiments, as assigned by your Institute Admin.',
    );
    expect(oldestWaitingWords(2)).toBe('Oldest waiting 2 days');
    expect(oldestWaitingWords(1)).toBe('Oldest waiting 1 day');
    expect(acrossWords(2, 'assessment')).toBe('Across 2 assessments');
    expect(moreInWords(2, 'Marking')).toBe('and 2 more in Marking');
    expect(markNowLabel('Rahul Verma', 'Heat Exchanger — post-lab')).toBe(
      'Mark now: Rahul Verma, Heat Exchanger — post-lab',
    );
    expect(lastActiveWords('19 Oct', '12 Oct')).toBe('Last active 19 Oct');
    expect(lastActiveWords(null, '12 Oct')).toBe('No activity since access, 12 Oct');
    expect(openDueLabel('Heat Exchanger — post-lab', '14 Nov 2026, 23:59')).toBe(
      'Open Heat Exchanger — post-lab, due 14 Nov 2026, 23:59',
    );
    expect(submittedWords(2, 5)).toBe('2 of 5 students submitted');
    expect(releaseRuleWords('after-deadline', null)).toBe(
      'Students see results after the deadline',
    );
    expect(submittedAtWords('2026-11-05T13:22:00.000Z')).toBe('5 Nov, 18:52');
    expect(assessmentName('')).toBe('Untitled draft');
  });

  it('every FA-01 action in the ledger reaches a built page; the drafts item waits for its fact', () => {
    const mine = LINK_TARGET_LEDGER.filter((entry) => entry.screen === 'FA-01');
    expect(mine.map((entry) => `${entry.action} · ${entry.outcome}`)).toEqual([
      'Mark now · built',
      'Review drafts · not-rendered',
      'View students · built',
      'My courses · built',
      '<assessment name> · built',
      'Open course · built',
      '<experiment name> · built',
      'Add a question · built',
      'Create assessment · built',
      'Open experiment · built',
      'Help & support · built',
      'Try again · in-page',
    ]);
    // One primary per drawn state: the band's Mark now, a new teacher's Add a question.
    expect(mine.filter((entry) => entry.role === 'primary').map((entry) => entry.action)).toEqual([
      'Mark now',
      'Add a question',
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
      expect(entry.action).toBe('Review drafts');
      expect(entry.note).toMatch(/no drafts fact/);
      expect(BUILT_SCREENS.has('FA-16')).toBe(true);
    }
    expect(resolveAddress(expandTarget('/faculty/marking/{attemptId}', '/faculty'))).toEqual(
      expect.objectContaining({ screen: 'FA-19' }),
    );
    expect(resolveAddress('/faculty/students')).toEqual(
      expect.objectContaining({ screen: 'FA-20' }),
    );
  });

  it('every state-copy entry of FA-01 is provisional, with its decision, and names no decision or reference in its words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_OVERVIEW)) {
      expect(id.startsWith('FA-01.'), id).toBe(true);
      expect(entry.screen).toBe('FA-01');
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      if (entry.words !== null) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD)-\d/);
        expect(entry.words).not.toMatch(REFERENCE);
      }
    }
  });
});
