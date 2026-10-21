/**
 * FA-02 My courses (the course ledger), FA-04 its Experiments tab (the refined table) and FA-03
 * Course (the identity band and one panel per experiment) — the owner-approved V3 design
 * (design/v3-refined-b/roles/FA-v1 `Main.dc.html` FA-02 · FA-04, FA-03, `vmCourses`, `vmCourse`) on
 * the real composition root and the sample world: the courses the Institute Admin's Faculty courses
 * (IA-15) map to the Faculty member, the experiments they teach with their formats, one unit meter
 * per format (never summed, never a percentage) and their assessment, and the course's teaching
 * view. The one world moves the pages: Meera assigning or removing a Faculty course, an assessment
 * created through the port, a Student's submission. The states the export draws (no match, loading,
 * couldn't load, no courses, no experiments, a co-teaching colleague's assessment) and the
 * application's own (loading and failed of the Courses tab and FA-03, not found); every drawn phrase
 * is the export's; no internal reference anywhere.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IsoInstant, PersonId, RecordRef } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  accessEndedLine,
  assessmentDueLine,
  assessmentsReadyLabel,
  COURSE_PAGE,
  courseCountWords,
  courseExperimentsLabel,
  courseLine,
  EXPERIMENTS_TAB,
  experimentCountWords,
  experimentsHeldLabel,
  formatChip,
  MY_COURSES_PAGE,
  openCourseLabel,
  openExperimentFullLabel,
  openExperimentLabel,
  reachAsOfWords,
  removeFilterLabel,
  searchChip,
  studentsWithAccessWords,
  withAccessWords,
} from '@/copy/faculty-courses';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_COURSES } from '@/copy/state-copy-faculty-courses';
import { P4_FACULTY_COURSES_LINK_TARGETS } from '@/nav/link-targets-p4/courses';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { FacultyMyCourses } from './fa-02-my-courses/my-courses';
import { FacultyCourse } from './fa-03-course/course';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const MEERA = 'per-0001';
const THERMO = 'thermodynamics-heat-transfer';
const THERMO_NAME = 'Thermodynamics & Heat Transfer';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const SHELL_ABOUT =
  'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

/** The export's text with tags removed and entities read, then its raw markup and script. */
const RAW = faExport('Main.dc.html');
const EXPORT = `${RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${RAW}`;

/** An internal reference (the owner's identifier rule, 21 Oct 2026). */
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

function inFaculty(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const showMyCourses = (runtime: PlatformRuntime, search = '') =>
  inFaculty(runtime, '/faculty/courses', <FacultyMyCourses />, search);
const showCourse = (runtime: PlatformRuntime, courseId = THERMO) =>
  inFaculty(runtime, `/faculty/courses/${courseId}`, <FacultyCourse courseId={courseId} />);

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
const h1 = () => screen.findByRole('heading', { level: 1, name: 'My courses' }, { timeout: 5000 });
const tabs = () => screen.getByRole('navigation', { name: 'My courses' });
const count = () => document.querySelector('.rk-statusline .rk-count[role="status"]');
const currentRail = () =>
  screen
    .getByRole('navigation', { name: 'Faculty navigation' })
    .querySelector('[aria-current="page"]');
const crumbs = () => text(screen.getByRole('navigation', { name: 'Breadcrumb' }));

async function changed(runtime: PlatformRuntime, refs: readonly RecordRef[]) {
  await act(async () => {
    await runtime.invalidate(refs);
  });
}

/** The ledger's course cards. */
async function ledger() {
  return waitFor(
    () => {
      const cards = main().querySelectorAll('section.fa-course');
      expect(cards.length).toBeGreaterThan(0);
      return [...cards] as HTMLElement[];
    },
    { timeout: 5000 },
  );
}

/** A course card's figures as "value term" (drawn value first; the `dt` comes first in the DOM). */
const figures = (card: Element) =>
  [...card.querySelectorAll('dl.fa-figs > div.fa-fig')].map(
    (figure) => `${text(figure.querySelector('dd'))} ${text(figure.querySelector('dt'))}`,
  );

async function experimentsSurface() {
  return screen.findByRole('region', { name: EXPERIMENTS_TAB.section }, { timeout: 5000 });
}

async function experimentsTable() {
  return screen.findByRole('table', { name: EXPERIMENTS_TAB.section }, { timeout: 5000 });
}

/** The table's body rows as their cells' words. */
function cells(): string[][] {
  return [...main().querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

const RULES = {
  passMarkPercent: '50',
  attemptsAllowed: '2',
  deadline: '2026-11-14T23:59:00+05:30',
  releaseOption: 'after-deadline',
  releaseDate: null,
} as const;

/** Dr S. Ranganathan creates (or saves as a draft) Shell-and-Tube's assessment through the port. */
async function createAssessment(
  runtime: PlatformRuntime,
  mode: 'create' | 'save-as-draft' = 'create',
  questions?: readonly string[],
) {
  const bank = await runtime.ports.questionBank.listQuestions({ experimentId: SHELL as never });
  if (!bank.ok) throw new Error('bank');
  const answer = await runtime.ports.assessments.createAssessment({
    mode,
    experimentId: SHELL as never,
    name: 'Heat Exchanger — post-lab',
    introduction: '',
    rules: (mode === 'create'
      ? RULES
      : {
          passMarkPercent: '',
          attemptsAllowed: '',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: null,
          releaseDate: null,
        }) as never,
    questions: (mode === 'create' ? (questions ?? [bank.value[0]!.question.id]) : []) as never,
  });
  if (!answer.ok) throw new Error(`create refused: ${JSON.stringify(answer.error)}`);
  await changed(runtime, answer.changed);
  return answer.value;
}

/** Rahul starts, answers the written question and submits (ST-13). */
async function rahulSubmits(runtime: PlatformRuntime, sample: Sample, assessmentId: string) {
  const rahul = asPersonId(sample, 'per-0002');
  const started = await rahul.assessments.startAttempt(assessmentId as never);
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
  await changed(runtime, submitted.changed);
  return saved.value.id;
}

/** Meera's Faculty course mapping for a faculty member, read through her own session. */
async function mappingOf(sample: Sample, facultyId: string) {
  const mappings = await asPersonId(sample, MEERA).facultyCourses.list();
  if (!mappings.ok) throw new Error('mappings');
  return mappings.value.find((entry) => entry.facultyId === facultyId && entry.removedAt === null);
}

// ---- FA-02 My courses: the course ledger ------------------------------------------------------------

describe('FA-02 My courses — the course ledger', () => {
  it('the head, the tabs, the count, the course card with its figures and experiment row; My courses current', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await h1();
    const [card] = await ledger();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(MY_COURSES_PAGE.lead);
    expect(currentRail()).toHaveAttribute('href', '/faculty/courses');

    const links = within(tabs()).getAllByRole('link');
    expect(tabs()).toHaveClass('rk-tabs');
    expect(links.map((link) => link.textContent)).toEqual(['Courses', 'Experiments']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/faculty/courses',
      '/faculty/courses?tab=experiments',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    expect(links[1]).not.toHaveAttribute('aria-current');

    // "Courses you teach" for screen readers, then the count.
    expect(screen.getByRole('heading', { level: 2, name: 'Courses you teach' })).toHaveClass(
      'xr-sr',
    );
    expect(text(main().querySelector('p.fa-listcount[role="status"]'))).toBe(
      '1 course · 1 experiment',
    );
    // The card: code, name, source, figures (the world's own: Rahul is the one Godavari Student
    // given Shell-and-Tube; no assessment yet on 27 Oct) and "Open course".
    expect(card).toHaveAccessibleName(THERMO_NAME);
    expect(text(card!.querySelector('.fa-course-id .rb-code'))).toBe('ME ZG523');
    expect(text(card!.querySelector('p.fa-course-src'))).toBe(
      'Assigned to you by your Institute Admin',
    );
    expect(figures(card!)).toEqual(['1 Experiments', '1 Students with access', '0 Assessments']);
    const open = within(card!).getByRole('link', { name: `Open course ME ZG523 ${THERMO_NAME}` });
    expect(open).toHaveAttribute('href', `/faculty/courses/${THERMO}`);
    expect(open).toHaveTextContent(/^Open course$/);
    expect(open).toHaveClass('rb-btn');
    // The aligned rows: the column heads are for sighted readers; each cell names itself on phones.
    expect(card!.querySelector('.fa-xhead')).toHaveAttribute('aria-hidden', 'true');
    const rows = within(card!).getByRole('list', { name: 'Experiments in ME ZG523' });
    const row = rows.querySelector('li.fa-xrow')!;
    expect(within(row as HTMLElement).getByRole('link', { name: SHELL_NAME })).toHaveAttribute(
      'href',
      `/faculty/experiments/${SHELL}`,
    );
    expect(
      within(row as HTMLElement).getByRole('img', {
        name: 'Formats your institution has: WEB, VR',
      }),
    ).toBeVisible();
    expect([...row.querySelectorAll('.fa-xcell')].map((cell) => text(cell))).toEqual([
      `${SHELL_NAME} WEB VR`,
      'Students 1 with access',
      'Assessment No assessment yet Create one from the experiment page.',
    ]);
    expect(text(main().querySelector('p.fa-foot'))).toBe(MY_COURSES_PAGE.foot);
    expect(main().textContent).not.toMatch(/%|total/i);
    expectNoReferences();
  });

  it('after Flow D the course counts its assessment; the row names it, Ready, with its deadline', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMyCourses(runtime);
    const [card] = await ledger();
    expect(figures(card!)[2]).toBe('1 Assessments');
    const assessment = card!.querySelector('.fa-xasm')!;
    expect(assessment.querySelector('.xr-st')).toHaveClass('xr-st--ok');
    expect(text(assessment)).toBe(
      'Assessment Assessment ready Heat Exchanger — post-lab Due 14 Nov 2026, 23:59',
    );
    // ATT-0450's marks are confirmed: nothing waits.
    expect(assessment.querySelector('.fa-xwait')).toBeNull();
    expectNoReferences();
  });

  it('a submission waiting for marking: “1 written answer waiting for marking” on the row', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await ledger();
    const created = await createAssessment(runtime, 'create', ['Q-0101', 'Q-0106']);
    await act(async () => {
      await rahulSubmits(runtime, sample, created.id);
    });
    await waitFor(() =>
      expect(text(main().querySelector('.fa-xasm .fa-xwait'))).toBe(
        '1 written answer waiting for marking',
      ),
    );
  });

  it('an unknown tab shows Courses and the address becomes the bare one', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=students');
    await ledger();
    expect(navigation.replace).toHaveBeenCalledWith('/faculty/courses');
    expect(within(tabs()).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('switching tabs is a link', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await ledger();
    expect(within(tabs()).getByRole('link', { name: 'Experiments' }).tagName).toBe('A');
  });
});

// ---- No courses, access ended, and the one world (IA-15) ------------------------------------------

describe('FA-02 / FA-04 — no courses, access ended, and Meera’s Faculty courses', () => {
  it('no Faculty course maps a course to Dr Anita Desai: the tabs stay and Courses says so in its card', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    const { navigation } = showMyCourses(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: MY_COURSES_PAGE.noneAssignedTitle },
      { timeout: 5000 },
    );
    const card = screen.getByRole('region', { name: MY_COURSES_PAGE.noneAssignedTitle });
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(title.closest('.fa-inlinemsg')).not.toBeNull();
    expect(text(card.querySelector('p.fa-msg-d'))).toBe(MY_COURSES_PAGE.noneAssignedLine);
    expect(card.querySelector('.fa-msg-ico path')?.getAttribute('d')).toMatch(/^M5 4\.5h11/);
    expect(card.querySelector('.fa-msg-act')).toBeNull();
    expect(within(tabs()).getAllByRole('link')).toHaveLength(2);
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(MY_COURSES_PAGE.lead);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('the Experiments tab with no course: “No experiments yet” in its card (the address stays)', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=experiments');
    const card = await screen.findByRole(
      'region',
      { name: EXPERIMENTS_TAB.emptyTitle },
      { timeout: 5000 },
    );
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(text(card.querySelector('p.fa-msg-d'))).toBe(EXPERIMENTS_TAB.emptyLine);
    expect(card.querySelector('.fa-msg-ico path')?.getAttribute('d')).toMatch(/^M12 3/);
    expect(screen.queryByRole('search')).toBeNull();
    expect(within(tabs()).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('once the institution’s access has ended: “Access ended on 7 Oct 2027 · …” in place of the source, and it still opens', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    standinsOf(sample).clock.setSampleNow('2027-10-09T03:30:00.000Z' as IsoInstant);
    showMyCourses(runtime);
    const [card] = await ledger();
    expect(text(card!.querySelector('p.fa-course-src'))).toBe(
      'Access ended on 7 Oct 2027 · earlier work and results kept',
    );
    expect(
      within(card!).getByRole('link', { name: `Open course ME ZG523 ${THERMO_NAME}` }),
    ).toBeVisible();
  });

  it('Meera removes Dr S. Ranganathan’s course: his My courses becomes the no-course card', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await ledger();
    const mapping = (await mappingOf(sample, RANGANATHAN))!;
    const removed = await asPersonId(sample, MEERA).facultyCourses.remove({
      mappingId: mapping.id,
      expectedRev: mapping.rev,
    });
    if (!removed.ok) throw new Error(`remove refused: ${JSON.stringify(removed.error)}`);
    await changed(runtime, removed.changed);
    expect(
      await screen.findByRole('heading', { level: 2, name: MY_COURSES_PAGE.noneAssignedTitle }),
    ).toBeVisible();
    expect(main().querySelector('section.fa-course')).toBeNull();
  });

  it('Meera assigns ME ZG523 to Dr Anita Desai: her My courses lists it, its experiments too', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    showMyCourses(runtime);
    await screen.findByRole(
      'heading',
      { level: 2, name: MY_COURSES_PAGE.noneAssignedTitle },
      { timeout: 5000 },
    );
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as never,
      courseId: THERMO as never,
    });
    if (!assigned.ok) throw new Error(`assign refused: ${JSON.stringify(assigned.error)}`);
    await changed(runtime, assigned.changed);
    const [card] = await ledger();
    expect(text(card!.querySelector('h3.fa-course-t'))).toBe(THERMO_NAME);
    expect(figures(card!)).toEqual(['1 Experiments', '1 Students with access', '0 Assessments']);
    expect(within(card!).getByRole('link', { name: SHELL_NAME })).toBeVisible();
  });
});

// ---- FA-04 Experiments: the refined table -----------------------------------------------------------

describe('FA-04 Experiments — the tab', () => {
  it('the toolbar, the count and the table: the experiment, one unit meter per format, the assessment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=experiments');
    await h1();
    const surface = await experimentsSurface();
    const table = await experimentsTable();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(currentRail()).toHaveAttribute('href', '/faculty/courses');
    expect(within(tabs()).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(surface).toHaveClass('rk-surface');
    expect(screen.getByRole('heading', { level: 2, name: EXPERIMENTS_TAB.section })).toHaveClass(
      'xr-sr',
    );

    // The toolbar: Search, Format (the formats held) and Student activity.
    const tools = within(surface).getByRole('search', { name: 'Filter experiments' });
    expect(tools).toHaveClass('rk-tools', 'fa-tools');
    const search = within(tools).getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveAttribute('placeholder', 'Experiment or course');
    const format = within(tools).getByRole('combobox', { name: 'Format' });
    expect([...format.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All formats',
      'WEB',
      'VR',
    ]);
    const activity = within(tools).getByRole('combobox', { name: 'Student activity' });
    expect([...activity.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All',
      'With activity',
      'No activity yet',
    ]);
    expect(count()).toHaveTextContent(/^1 experiment$/);
    expect(surface.querySelector('.rk-chip')).toBeNull();
    expect(within(surface).queryByRole('button', { name: 'Clear filters' })).toBeNull();

    expect(table).toHaveClass('rk-table', 'fa-table', 'fa-xtable');
    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Experiment',
      'Student activity, by format',
      'Assessment',
    ]);
    // Rahul completed WEB and VR before Flow D; no assessment yet on 27 Oct. The separators
    // between the three counts are drawn by CSS.
    expect(cells()).toEqual([
      [
        `${SHELL_NAME} ME ZG523 · ${THERMO_NAME} Formats your institution has WEB VR`,
        'Student activity, by format WEB 1 completed 0 in progress 0 not started VR 1 completed 0 in progress 0 not started 1 student with access · as of 27 Oct 2026',
        'Assessment No assessment yet Create one from the experiment page.',
      ],
    ]);
    const row = table.querySelector('tbody tr')!;
    const name = within(row as HTMLElement).getByRole('link', { name: `Open ${SHELL_NAME}` });
    expect(name).toHaveClass('rk-rowlink');
    expect(name).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(
      within(row as HTMLElement).getByRole('img', {
        name: 'Formats your institution has: WEB, VR',
      }),
    ).toBeVisible();
    expect(
      within(row as HTMLElement).getByRole('list', {
        name: `Student activity by format for ${SHELL_NAME}, as of 27 Oct 2026`,
      }),
    ).toHaveClass('fa-prog', 'fa-prog--cell');
    // Below 760 px of table every value cell names itself (`span.fa-lbl`).
    expect([...row.querySelectorAll('td > span.fa-lbl')].map((label) => label.textContent)).toEqual(
      ['Student activity, by format', 'Assessment'],
    );
    expect(main().textContent).not.toMatch(/%|total/i);
    expectNoReferences();
  });

  it('a press anywhere on the row follows its link (FA-05)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const table = await experimentsTable();
    const link = table.querySelector<HTMLAnchorElement>('tbody a.rk-rowlink')!;
    const followed: string[] = [];
    link.addEventListener('click', (event) => {
      followed.push(link.getAttribute('href') ?? '');
      event.preventDefault();
    });
    await user.click(table.querySelector('tbody td:nth-child(2)')!);
    expect(followed).toEqual([`/faculty/experiments/${SHELL}`]);
  });

  it('after Flow D: the assessment is Ready (ok) with its name and deadline', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMyCourses(runtime, '?tab=experiments');
    const table = await experimentsTable();
    const pill = table.querySelector('tbody .xr-st')!;
    expect(pill).toHaveClass('xr-st', 'xr-st--ok');
    expect(pill).toHaveTextContent(/^Ready$/);
    expect(cells()[0]![2]).toBe(
      'Assessment Ready Heat Exchanger — post-lab Due 14 Nov 2026, 23:59',
    );
  });
});

describe('FA-04 — search, filters, chips and no match', () => {
  it('a search that matches nothing: its chip, “0 of 1 experiment” and the no-match state; Clear filters brings it back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const surface = await experimentsSurface();
    await experimentsTable();
    const search = within(surface).getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'fin-tube');
    expect(count()).toHaveTextContent(/^0 of 1 experiment$/);
    expect(screen.queryByRole('table')).toBeNull();
    expect([...surface.querySelectorAll('.rk-chip')].map((chip) => text(chip))).toEqual([
      'Search: “fin-tube”',
    ]);
    const state = surface.querySelector('.rk-state')!;
    expect(text(state.querySelector('.rk-state-t'))).toBe('No experiment matches these filters');
    expect(text(state.querySelector('.rk-state-d'))).toBe(EXPERIMENTS_TAB.noMatchLine);
    const clear = within(state as HTMLElement).getByRole('button', { name: 'Clear filters' });
    expect(clear).toHaveClass('rb-btn');
    await user.click(clear);
    expect(count()).toHaveTextContent(/^1 experiment$/);
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    expect(await experimentsTable()).toBeVisible();
  });

  it('the search reads the code and the course too, ignoring case', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const surface = await experimentsSurface();
    await experimentsTable();
    const search = within(surface).getByRole('searchbox', { name: 'Search' });
    for (const query of ['me zg523', 'thermodynamics', 'SHELL-AND']) {
      await user.clear(search);
      await user.type(search, query);
      expect(count()).toHaveTextContent(/^1 of 1 experiment$/);
    }
  });

  it('Format and Student activity make chips; removing a chip returns focus to its field; “Clear filters” resets them', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const surface = await experimentsSurface();
    await experimentsTable();
    const format = within(surface).getByRole('combobox', { name: 'Format' });
    await user.selectOptions(format, 'vr');
    expect(count()).toHaveTextContent(/^1 of 1 experiment$/);
    expect(text(surface.querySelector('.rk-chip'))).toBe('Format: VR');
    // Rahul opened both formats: "With activity" keeps it, "No activity yet" leaves none.
    const activity = within(surface).getByRole('combobox', { name: 'Student activity' });
    await user.selectOptions(activity, 'some');
    expect(count()).toHaveTextContent(/^1 of 1 experiment$/);
    await user.selectOptions(activity, 'none');
    expect(count()).toHaveTextContent(/^0 of 1 experiment$/);
    expect([...surface.querySelectorAll('.rk-chip')].map((chip) => text(chip))).toEqual([
      'Format: VR',
      'No activity yet',
    ]);
    await user.click(
      within(surface).getByRole('button', { name: 'Remove filter No activity yet' }),
    );
    expect(activity).toHaveValue('all');
    expect(count()).toHaveTextContent(/^1 of 1 experiment$/);
    expect(activity).toHaveFocus();
    await user.click(
      within(surface.querySelector('.rk-statusline') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    expect(format).toHaveValue('all');
    expect(surface.querySelector('.rk-chip')).toBeNull();
    expect(within(surface).getByRole('searchbox', { name: 'Search' })).toHaveFocus();
  });

  it('“With activity” leaves out an experiment no Student has opened (after Flow B)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showMyCourses(runtime, '?tab=experiments');
    const surface = await experimentsSurface();
    await experimentsTable();
    expect(cells()[0]![1]).toContain('WEB 0 completed 0 in progress 1 not started');
    await user.selectOptions(
      within(surface).getByRole('combobox', { name: 'Student activity' }),
      'some',
    );
    expect(count()).toHaveTextContent(/^0 of 1 experiment$/);
    await user.selectOptions(
      within(surface).getByRole('combobox', { name: 'Student activity' }),
      'none',
    );
    expect(count()).toHaveTextContent(/^1 of 1 experiment$/);
  });
});

describe('FA-04 — loading and couldn’t load', () => {
  it('announces loading in the table’s place; a failed read says so with “Try again”, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('AssessmentService.getCreateOptions');
    showMyCourses(runtime, '?tab=experiments');
    await h1();
    const busy = await waitFor(() => {
      const element = document.querySelector('[aria-busy="true"]');
      expect(element).not.toBeNull();
      return element!;
    });
    expect(busy.querySelector('.rk-loading-msg[role="status"]')).toHaveTextContent(
      'Loading your experiments…',
    );
    expect(busy.querySelectorAll('.rk-skel-row')).toHaveLength(2);
    expect(count()).toBeNull();
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alert).toHaveClass('rk-state');
    expect(alert.querySelector('.rk-state-ico')).toHaveClass('rk-state-ico--err');
    expect(text(alert.querySelector('.rk-state-t'))).toBe('We couldn’t load your experiments');
    expect(text(alert.querySelector('.rk-state-d'))).toBe('Nothing has changed. Try again.');
    // The toolbar stays; the count is left out while nothing is listed (`FA-04.count`).
    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toBeVisible();
    expect(count()).toBeNull();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(search).toHaveFocus();
    expect(await experimentsTable()).toBeVisible();
    expect(count()).toHaveTextContent(/^1 experiment$/);
  });

  it('one experiment’s teaching read failing fails the list too', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.getTeachingExperiment');
    showMyCourses(runtime, '?tab=experiments');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
      'We couldn’t load your experiments',
    );
  });
});

describe('FA-02 — the Courses tab loading and failed (FA-02.loading, FA-02.failed)', () => {
  it('announces loading; a failed read says so with Try again, which reads again and moves focus to the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.listMyCourses');
    renderInTab(<FacultyMyCourses />, {
      runtime,
      navigation: testNavigation('/faculty/courses'),
    });
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading your courses');
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(
      within(alert).getByRole('heading', { level: 2, name: 'We couldn’t load your courses' }),
    ).toBeVisible();
    expect(alert).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(document.querySelector('section.fa-course')).not.toBeNull());
    expect(screen.getByRole('heading', { level: 1, name: 'My courses' })).toHaveFocus();
  });
});

// ---- The one world: an assessment created through the port --------------------------------------

describe('FA-02 / FA-04 — an assessment created through the port', () => {
  it('counts in the course card and names it in the row', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    const [card] = await ledger();
    expect(figures(card!)[2]).toBe('0 Assessments');
    await createAssessment(runtime);
    await waitFor(() =>
      expect(figures(main().querySelector('section.fa-course')!)[2]).toBe('1 Assessments'),
    );
    expect(text(main().querySelector('.fa-xasm-n'))).toBe('Heat Exchanger — post-lab');
  });

  it('a Ready assessment shows in the Experiments tab; a draft reads “Draft — not ready”', async () => {
    const ready = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const first = showMyCourses(ready.runtime, '?tab=experiments');
    await experimentsTable();
    expect(cells()[0]![2]).toBe(
      'Assessment No assessment yet Create one from the experiment page.',
    );
    await createAssessment(ready.runtime);
    await waitFor(() =>
      expect(cells()[0]![2]).toBe(
        'Assessment Ready Heat Exchanger — post-lab Due 14 Nov 2026, 23:59',
      ),
    );
    first.view.unmount();
    forgetLastAddress();

    const draft = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(draft.runtime, '?tab=experiments');
    await experimentsTable();
    await createAssessment(draft.runtime, 'save-as-draft');
    await waitFor(() =>
      expect(cells()[0]![2]).toBe(
        'Assessment Draft — not ready Heat Exchanger — post-lab Due 14 Nov 2026, 23:59',
      ),
    );
    // The export's neutral pill for a draft.
    expect(main().querySelector('tbody .xr-st')!.className).toBe('xr-st');
  });
});

// ---- FA-03 Course -------------------------------------------------------------------------------------

describe('FA-03 Course — the identity band and the experiment panels', () => {
  it('the breadcrumb, the band and its figures, the panel’s activity and its Ready assessment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showCourse(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 1, name: THERMO_NAME },
      { timeout: 5000 },
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveClass('fa-cid-t');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(crumbs()).toBe('My courses ME ZG523');
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'My courses',
      }),
    ).toHaveAttribute('href', '/faculty/courses');
    expect(currentRail()).toHaveAttribute('href', '/faculty/courses');

    const band = main().querySelector('header.fa-cid')!;
    expect(text(band.querySelector('.rb-eyebrow-date'))).toBe('Sunday 15 November 2026');
    expect(text(band.querySelector('.fa-cid-eyebrow'))).toBe('ME ZG523 Course you teach');
    expect(text(band.querySelector('p.fa-cid-src'))).toBe(COURSE_PAGE.source);
    expect(figures(band)).toEqual([
      '1 Experiment your institution holds',
      '1 Students with access',
      '1 Assessment ready',
    ]);

    const section = screen.getByRole('region', { name: 'Experiments' });
    expect(text(section.querySelector('.rb-sec-head .rb-note'))).toBe(
      'Only experiments your institution holds',
    );
    const panel = within(section).getByRole('article', { name: SHELL_NAME });
    expect(panel).toHaveClass('rk-surface', 'fa-xp');
    expect(text(panel.querySelector('p.fa-xp-about'))).toBe(SHELL_ABOUT);
    expect(text(panel.querySelector('p.fa-xp-fm .fa-k'))).toBe('Formats your institution has');
    const open = within(panel).getByRole('link', { name: `Open experiment ${SHELL_NAME}` });
    expect(open).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(open).toHaveTextContent(/^Open experiment$/);

    const activity = within(panel).getByRole('region', { name: 'Student activity, by format' });
    expect(text(activity.querySelector('.fa-xp-colh .rk-hint'))).toBe('As of 15 Nov 2026');
    const progress = within(activity).getByRole('list', {
      name: `Student activity by format for ${SHELL_NAME}`,
    });
    expect([...progress.querySelectorAll('li')].map((row) => text(row))).toEqual([
      'WEB 1 completed 0 in progress 0 not started',
      'VR 1 completed 0 in progress 0 not started',
    ]);
    expect(text(activity.querySelector('p.fa-xp-foot > span'))).toBe('1 student with access');
    expect(
      within(activity).getByRole('link', { name: 'Students on this experiment' }),
    ).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);

    // The assessment: Ready, its deadline passed on 15 Nov, Rahul's submission, nothing waiting.
    const assessment = within(panel).getByRole('region', { name: 'Assessment' });
    expect(assessment.querySelector('.fa-xp-colh .xr-st')).toHaveClass('xr-st--ok');
    expect(text(assessment.querySelector('.fa-xp-colh .xr-st'))).toBe('Ready');
    expect(text(assessment.querySelector('p.fa-asm-n'))).toBe('Heat Exchanger — post-lab');
    expect(text(assessment.querySelector('p.fa-asm-d'))).toBe(
      'Deadline passed: 14 Nov 2026, 23:59',
    );
    expect(assessment.querySelectorAll('.fa-asm-subs .fa-units > i.is-sub')).toHaveLength(1);
    expect(text(assessment.querySelector('.fa-asm-subs p'))).toBe('1 of 1 student submitted');
    expect(assessment.querySelector('.fa-asm-wait')).toBeNull();
    expect(assessment.querySelector('.fa-asm-note')).toBeNull();
    expect(
      within(assessment)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([['Open assessment', '/faculty/assessments/ASMT-0009']]);
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(0);
    expectNoReferences();
  });

  it('after Flow C: no assessment yet — the line and “Create assessment” (FA-07 with the experiment)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    expect(text(assessment.querySelector('.fa-xp-colh .xr-st'))).toBe('No assessment yet');
    expect(text(assessment.querySelector('p.fa-asm-note'))).toBe(
      'No assessment for this experiment yet. Assessments are set per experiment, not per format.',
    );
    const create = within(assessment).getByRole('link', { name: 'Create assessment' });
    expect(create).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(create).toHaveAttribute('href', `/faculty/assessments/new?experimentId=${SHELL}`);
    expect(figures(main().querySelector('header.fa-cid')!)[2]).toBe('0 Assessments ready');
  });

  it('a draft: “Draft — not ready”, why students can’t see it, and “Continue setting up”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    const draft = await createAssessment(runtime, 'save-as-draft');
    const assessment = screen.getByRole('region', { name: 'Assessment' });
    await waitFor(() =>
      expect(text(assessment.querySelector('.fa-xp-colh .xr-st'))).toBe('Draft — not ready'),
    );
    expect(assessment.querySelector('.fa-xp-colh .xr-st')!.className).toBe('xr-st');
    expect(text(assessment.querySelector('p.fa-asm-d'))).toBe('Due 14 Nov 2026, 23:59');
    expect(text(assessment.querySelector('p.fa-asm-note'))).toBe(
      'No questions yet · students can’t see it yet.',
    );
    expect(assessment.querySelector('.fa-asm-subs')).toBeNull();
    expect(within(assessment).getByRole('link', { name: 'Continue setting up' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${draft.id}`,
    );
  });

  it('a Ready assessment created in the tab, then Rahul submits: days left, the meter, “Mark 1 written answer” (the oldest, FA-19)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    const created = await createAssessment(runtime, 'create', ['Q-0101', 'Q-0106']);
    const assessment = screen.getByRole('region', { name: 'Assessment' });
    await waitFor(() =>
      expect(text(assessment.querySelector('p.fa-asm-d'))).toBe(
        'Due 14 Nov 2026, 23:59 · 18 days left',
      ),
    );
    expect(text(assessment.querySelector('.fa-asm-subs p'))).toBe('0 of 1 student submitted');
    expect(figures(main().querySelector('header.fa-cid')!)[2]).toBe('1 Assessment ready');
    let attempt = '';
    await act(async () => {
      attempt = await rahulSubmits(runtime, sample, created.id);
    });
    await waitFor(() =>
      expect(text(assessment.querySelector('p.fa-asm-wait'))).toBe(
        '1 written answer waiting for marking',
      ),
    );
    const mark = await waitFor(() => {
      const link = within(assessment).getByRole('link', {
        name: 'Mark 1 written answer for Heat Exchanger — post-lab',
      });
      expect(link).toHaveAttribute('href', `/faculty/marking/${attempt}`);
      return link;
    });
    expect(mark).toHaveTextContent(/^Mark 1 written answer$/);
    expect(mark).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(mark.nextElementSibling).toHaveTextContent('Open assessment');
    expect(text(assessment.querySelector('.fa-asm-subs p'))).toBe('1 of 1 student submitted');
    expectNoReferences();
  });

  it('a co-teaching colleague’s assessment: “Created by …”, no submissions, no Mark', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-d');
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as PersonId,
      courseId: THERMO as never,
    });
    expect(assigned.ok).toBe(true);
    showCourse(runtime);
    const assessment = await screen.findByRole('region', { name: 'Assessment' }, { timeout: 5000 });
    await waitFor(() =>
      expect(text(assessment.querySelector('p.fa-asm-note'))).toBe('Created by Dr S. Ranganathan.'),
    );
    expect(assessment.querySelector('.fa-asm-subs')).toBeNull();
    expect(assessment.querySelector('.fa-asm-wait')).toBeNull();
    expect(
      within(assessment)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Open assessment']);
  });

  it('once access has ended the band says so in place of its source', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    standinsOf(sample).clock.setSampleNow('2027-10-09T03:30:00.000Z' as IsoInstant);
    showCourse(runtime);
    await screen.findByRole('heading', { level: 1, name: THERMO_NAME }, { timeout: 5000 });
    expect(text(main().querySelector('p.fa-cid-src'))).toBe(
      'Access ended on 7 Oct 2027 · earlier work and results kept',
    );
  });

  it('an unknown course, or one not mapped to the Faculty member, is the in-shell not-found', async () => {
    for (const [person, courseId] of [
      [RANGANATHAN, 'no-such-course'],
      [RANGANATHAN, 'fluid-mechanics'],
      [DESAI, THERMO],
    ] as const) {
      const { runtime } = await tabPlatform(person, 'after-flow-c');
      const { view } = showCourse(runtime, courseId);
      expect(
        await screen.findByRole(
          'heading',
          { level: 1, name: 'We can’t find that page' },
          { timeout: 5000 },
        ),
      ).toBeVisible();
      view.unmount();
      forgetLastAddress();
    }
  });

  it('Meera removing the mapping makes the open course not found', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    await screen.findByRole('heading', { level: 1, name: THERMO_NAME }, { timeout: 5000 });
    const mapping = (await mappingOf(sample, RANGANATHAN))!;
    const removed = await asPersonId(sample, MEERA).facultyCourses.remove({
      mappingId: mapping.id,
      expectedRev: mapping.rev,
    });
    if (!removed.ok) throw new Error('remove');
    await changed(runtime, removed.changed);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('loading, then failed with Try again (FA-03.loading, FA-03.failed)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.listMyCourses');
    renderInTab(<FacultyCourse courseId={THERMO} />, {
      runtime,
      navigation: testNavigation(`/faculty/courses/${THERMO}`),
    });
    expect(
      document.querySelector('[aria-busy="true"] .rk-loading-msg[role="status"]'),
    ).toHaveTextContent('Loading the course');
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(
      within(alert).getByRole('heading', { level: 2, name: 'We couldn’t load this course' }),
    ).toBeVisible();
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'My courses',
      }),
    ).toHaveAttribute('href', '/faculty/courses');
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toHaveFocus();
  });
});

// ---- Words, state copy and the ledger -------------------------------------------------------------

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the export’s words, the state-copy register and the ledger', () => {
  it('every drawn phrase is the export’s, the composed ones as its script composes them', () => {
    for (const phrase of [
      ...strings(MY_COURSES_PAGE),
      ...strings(EXPERIMENTS_TAB),
      ...strings(COURSE_PAGE),
    ]) {
      expect(EXPORT, phrase).toContain(phrase);
    }
    for (const form of [
      "this.plural(courses.length, 'course') + ' · ' + this.plural(nE, 'experiment')",
      "'Open course ' + c.code + ' ' + c.t",
      "'Experiments in ' + c.code",
      "ns ? ns + ' with access' : 'None yet'",
      "(cfg.dl ? 'Due ' + cfg.dl : 'No deadline set yet') + (this.own(a) ? '' : ' · created by ' + this.person(a.by).name)",
      "rows.length + ' of ' + this.plural(all.length, 'experiment') : this.plural(all.length, 'experiment')",
      "'Search: “' + s.q.trim() + '”'",
      "'Format: ' + s.fm",
      "'Remove filter ' + c.label",
      "'Open ' + e.t",
      "c.code + ' · ' + c.t",
      "this.plural(n, 'student') + ' with access · as of ' + W.clock.day",
      "exps.length === 1 ? 'Experiment your institution holds' : 'Experiments your institution holds'",
      "ready === 1 ? 'Assessment ready' : 'Assessments ready'",
      "'Open experiment ' + e.t",
      "this.plural(ss.length, 'student') + ' with access'",
    ]) {
      expect(RAW, form).toContain(form);
    }
    expect(courseCountWords(1, 1)).toBe('1 course · 1 experiment');
    expect(openCourseLabel('ME ZG523', THERMO_NAME)).toBe(`Open course ME ZG523 ${THERMO_NAME}`);
    expect(courseExperimentsLabel('ME ZG523', THERMO_NAME)).toBe('Experiments in ME ZG523');
    expect(withAccessWords(5)).toBe('5 with access');
    expect(withAccessWords(0)).toBe('None yet');
    expect(assessmentDueLine('14 Nov 2026, 23:59', 'Dr S. Ranganathan')).toBe(
      'Due 14 Nov 2026, 23:59 · created by Dr S. Ranganathan',
    );
    expect(assessmentDueLine(null, null)).toBe('No deadline set yet');
    expect(experimentCountWords(0, 1, true)).toBe('0 of 1 experiment');
    expect(experimentCountWords(2, 2, false)).toBe('2 experiments');
    expect(searchChip('fin-tube')).toBe('Search: “fin-tube”');
    expect(formatChip('vr')).toBe('Format: VR');
    expect(removeFilterLabel('Format: VR')).toBe('Remove filter Format: VR');
    expect(openExperimentLabel(SHELL_NAME)).toBe(`Open ${SHELL_NAME}`);
    expect(courseLine('ME ZG523', THERMO_NAME)).toBe(`ME ZG523 · ${THERMO_NAME}`);
    expect(reachAsOfWords(5, '7 Nov 2026')).toBe('5 students with access · as of 7 Nov 2026');
    expect(experimentsHeldLabel(1)).toBe('Experiment your institution holds');
    expect(assessmentsReadyLabel(2)).toBe('Assessments ready');
    expect(openExperimentFullLabel(SHELL_NAME)).toBe(`Open experiment ${SHELL_NAME}`);
    expect(studentsWithAccessWords(1)).toBe('1 student with access');
    // A course whose access ended (a product state the export does not draw; B4-02 f7).
    expect(accessEndedLine('2027-10-07')).toBe(
      'Access ended on 7 Oct 2027 · earlier work and results kept',
    );
  });

  it('the register holds this group’s entries, provisional, no decision id or reference in their words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_COURSES)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.words ?? '').not.toMatch(/\b(?:OD|T|PC|DEV|VD|BC)-?\d/);
      expect(entry.words ?? '').not.toMatch(REFERENCE);
    }
  });

  it('the ledger: FA-02 and FA-04 draw no primary; FA-03’s Assessment column draws one; nothing unrendered', () => {
    const primaries = P4_FACULTY_COURSES_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'FA-03 Mark <n> written answers',
      'FA-03 Create assessment',
    ]);
    expect(
      P4_FACULTY_COURSES_LINK_TARGETS.filter((entry) => entry.outcome === 'not-rendered'),
    ).toEqual([]);
    expect(
      P4_FACULTY_COURSES_LINK_TARGETS.find(
        (entry) => entry.screen === 'FA-03' && entry.action === 'Students on this experiment',
      ),
    ).toMatchObject({ outcome: 'built', target: '/faculty/students?experimentId={experimentId}' });
  });
});
