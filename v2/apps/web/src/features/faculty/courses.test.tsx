/**
 * FA-02 My courses, FA-04 its Experiments tab and FA-03 Course (board B4-02 f0 … f8) on the real
 * composition root and the sample world: the courses the Institute Admin's Faculty courses (IA-15)
 * map to the Faculty member, the experiments they teach with their formats, per-format completions
 * (never summed) and assessment, and the course's teaching view. The one world moves the pages:
 * Meera assigning or removing a Faculty course, an assessment created through the port. The
 * drawn states (f0 … f8), the undrawn loading, failed and not-found ones; every drawn phrase is
 * B4-02's own.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IsoInstant, RecordRef } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  COURSE_PAGE,
  EXPERIMENTS_TAB,
  MY_COURSES_PAGE,
  accessEndedLine,
  assessmentLine,
  completedHeader,
  courseFactsLine,
  courseMetaLine,
  formatChip,
  openCourseLabel,
  openExperimentLabel,
} from '@/copy/faculty-courses';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_COURSES } from '@/copy/state-copy-faculty-courses';
import { P4_FACULTY_COURSES_LINK_TARGETS } from '@/nav/link-targets-p4/courses';
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

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

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
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const h1 = () => screen.findByRole('heading', { level: 1, name: 'My courses' }, { timeout: 5000 });
const tabs = () => screen.getByRole('navigation', { name: 'My courses' });
const count = () => document.querySelector('.xr-toolbar-status [role="status"]');
const crumbs = () =>
  [...screen.getByRole('list', { name: 'You are here' }).querySelectorAll('li')].map((item) =>
    text(item),
  );
const currentSidebar = () =>
  screen
    .getByRole('navigation', { name: 'Faculty navigation' })
    .querySelector('[aria-current="page"]');

async function changed(runtime: PlatformRuntime, refs: readonly RecordRef[]) {
  await act(async () => {
    await runtime.invalidate(refs);
  });
}

/** The table's body rows as their cells' text. */
function cells(): string[][] {
  return [...main().querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

async function coursesSection() {
  return screen.findByRole('region', { name: MY_COURSES_PAGE.coursesSection }, { timeout: 5000 });
}

async function experimentsSection() {
  return screen.findByRole('region', { name: EXPERIMENTS_TAB.section }, { timeout: 5000 });
}

async function experimentsTable() {
  return screen.findByRole('table', { name: EXPERIMENTS_TAB.section }, { timeout: 5000 });
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
    questions: mode === 'create' ? [bank.value[0]!.question.id] : [],
  });
  if (!answer.ok) throw new Error(`create refused: ${JSON.stringify(answer.error)}`);
  await changed(runtime, answer.changed);
  return answer.value;
}

/** Meera's Faculty course mapping for a faculty member, read through her own session. */
async function mappingOf(sample: Sample, facultyId: string) {
  const mappings = await asPersonId(sample, MEERA).facultyCourses.list();
  if (!mappings.ok) throw new Error('mappings');
  return mappings.value.find((entry) => entry.facultyId === facultyId && entry.removedAt === null);
}

// ---- FA-02 My courses (f0) ------------------------------------------------------------------------

describe('FA-02 My courses — the Courses tab (B4-02 f0)', () => {
  it('the header, the tabs, the course row and its facts; My courses current', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await h1();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const head = main().querySelector('.xr-phead')!;
    expect(head.querySelector('.xr-overline')).toHaveTextContent(/^Courses you teach$/);
    expect(head.querySelector('.xr-phead-meta > .xl-meta')).toHaveTextContent(
      /^From Faculty courses, set by your Institute Admin$/,
    );
    // The shell: "My courses" with no crumbs; My courses current.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('My courses');
    expect(currentSidebar()).toHaveAttribute('href', '/faculty/courses');

    const links = within(tabs()).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Courses', 'Experiments']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/faculty/courses',
      '/faculty/courses?tab=experiments',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
    expect(links[1]).not.toHaveAttribute('aria-current');

    const section = await coursesSection();
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(/^1 course$/);
    const rows = section.querySelectorAll('ul.xr-rows > li.xr-row');
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.querySelector('.xr-row-icon svg path')).toHaveAttribute(
      'd',
      'M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13H6.5A1.5 1.5 0 0 0 5 18.5zM5 18.5A1.5 1.5 0 0 0 6.5 20H19M9 8h6',
    );
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(THERMO_NAME);
    expect(row.querySelector('.xr-row-sub .xr-id')).toHaveTextContent(/^ME ZG523$/);
    // The world's own figures: Rahul is the one Godavari Student given Shell-and-Tube; no
    // assessment yet on 27 Oct (the board's five students and one assessment are sample).
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      'ME ZG523 · 1 experiment · 1 student with access · 0 assessments',
    );
    const open = within(row as HTMLElement).getByRole('link', {
      name: `Open course ${THERMO_NAME}`,
    });
    expect(open).toHaveAttribute('href', `/faculty/courses/${THERMO}`);
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(open).toHaveTextContent(/^Open course$/);
  });

  it('after Flow D the course counts its assessment (“1 assessment”)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMyCourses(runtime);
    const section = await coursesSection();
    await waitFor(() =>
      expect(text(section.querySelector('.xr-row-sub'))).toBe(
        'ME ZG523 · 1 experiment · 1 student with access · 1 assessment',
      ),
    );
  });

  it('an unknown tab shows Courses and the address becomes the bare one', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=students');
    await coursesSection();
    expect(navigation.replace).toHaveBeenCalledWith('/faculty/courses');
    expect(within(tabs()).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

// ---- f6, f7 ---------------------------------------------------------------------------------------

describe('FA-02 — none assigned (f6) and access ended (f7)', () => {
  it('no Faculty course maps a course to Dr Anita Desai: the drawn empty state, no tabs', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    const { navigation } = showMyCourses(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: MY_COURSES_PAGE.noneAssignedTitle,
    });
    const empty = title.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty.querySelector('p.xr-body')).toHaveTextContent(MY_COURSES_PAGE.noneAssignedLine);
    expect(empty.querySelector('.xr-empty-icon svg path')?.getAttribute('d')).toMatch(/^M5 5\.5A/);
    expect(screen.queryByRole('navigation', { name: 'My courses' })).toBeNull();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(MY_COURSES_PAGE.meta);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('the Experiments tab does not exist then: its address becomes the bare one', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=experiments');
    await screen.findByRole('heading', { level: 2, name: MY_COURSES_PAGE.noneAssignedTitle });
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/faculty/courses'));
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('My courses');
  });

  it('once the institution’s access has ended: “Access ended on 7 Oct 2027 · …” and still opens', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    standinsOf(sample).clock.setSampleNow('2027-10-09T03:30:00.000Z' as IsoInstant);
    showMyCourses(runtime);
    const section = await coursesSection();
    expect(text(section.querySelector('.xr-row-sub'))).toBe(
      'ME ZG523 · Access ended on 7 Oct 2027 · earlier work and results kept',
    );
    expect(within(section).getByRole('link', { name: `Open course ${THERMO_NAME}` })).toBeVisible();
  });
});

// ---- The one world: Faculty courses (IA-15) set what My courses lists -----------------------------

describe('FA-02 — Meera’s Faculty courses set what the Faculty member sees (IA-15)', () => {
  it('Meera removes Dr S. Ranganathan’s course: his My courses becomes “None assigned”', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await coursesSection();
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
    expect(screen.queryByRole('region', { name: MY_COURSES_PAGE.coursesSection })).toBeNull();
  });

  it('Meera assigns ME ZG523 to Dr Anita Desai: her My courses lists it, its experiments too', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-c');
    showMyCourses(runtime);
    await screen.findByRole('heading', { level: 2, name: MY_COURSES_PAGE.noneAssignedTitle });
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as never,
      courseId: THERMO as never,
    });
    if (!assigned.ok) throw new Error(`assign refused: ${JSON.stringify(assigned.error)}`);
    await changed(runtime, assigned.changed);
    const section = await coursesSection();
    expect(section.querySelector('.xr-row-title')).toHaveTextContent(THERMO_NAME);
    expect(text(section.querySelector('.xr-row-sub'))).toBe(
      'ME ZG523 · 1 experiment · 1 student with access · 0 assessments',
    );
    // The Experiments tab exists again and lists the taught experiment.
    expect(within(tabs()).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'href',
      '/faculty/courses?tab=experiments',
    );
  });
});

// ---- FA-04 Experiments (f2, f8) ---------------------------------------------------------------------

describe('FA-04 Experiments — the tab (B4-02 f2, f8)', () => {
  it('the toolbar, the count and the table: formats, completions per format, assessment, Open', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showMyCourses(runtime, '?tab=experiments');
    await h1();
    const section = await experimentsSection();
    const table = await experimentsTable();
    expect(navigation.replace).not.toHaveBeenCalled();
    // The shell: "My courses / Experiments"; My courses current; the tab current; no meta (f2).
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Experiments');
    expect(crumbs()).toEqual(['My courses/', 'Experiments']);
    expect(currentSidebar()).toHaveAttribute('href', '/faculty/courses');
    expect(within(tabs()).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(main().querySelector('.xr-phead-meta')).toBeNull();

    // The toolbar inside the section (f2): search, Format, Activity (`xr-filter-2`).
    const search = within(section).getByRole('searchbox', { name: 'Search experiments' });
    expect(search).toHaveAttribute('placeholder', 'Experiment or course');
    const format = within(section).getByRole('combobox', { name: 'Format' });
    expect([...format.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All formats',
      'WEB',
      'VR',
    ]);
    const activity = within(section).getByRole('combobox', { name: 'Activity' });
    expect([...activity.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All',
      'With activity',
      'No activity yet',
    ]);
    expect(activity.closest('.xr-field')).toHaveClass('xr-filter-2');
    expect(count()).toHaveTextContent(/^1 experiment$/);
    expect(section.querySelector('.xr-toolbar-status .xr-fchip')).toBeNull();
    expect(within(section).queryByRole('button', { name: 'Clear filters' })).toBeNull();

    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Experiment',
      'Formats your institution has',
      'Completed (WEB)',
      'Completed (VR)',
      'Assessment',
      'Action',
    ]);
    // Rahul completed WEB and VR before Flow D; no assessment yet on 27 Oct.
    expect(cells()).toEqual([
      [`${SHELL_NAME}ME ZG523`, 'WEBVR', '1', '1', 'No assessment yet', 'Open'],
    ]);
    const row = table.querySelector('tbody tr')!;
    const name = within(row as HTMLElement).getByRole('link', { name: SHELL_NAME });
    expect(name).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(name.querySelector('strong')).toHaveTextContent(SHELL_NAME);
    expect(row.querySelector('td:first-child .xr-meta')).toHaveTextContent(/^ME ZG523$/);
    for (const chip of row.querySelectorAll('.xr-fmt')) {
      expect(chip).toHaveClass('xr-fmt', 'xr-fmt--yours', 'xr-fmt--compact');
    }
    const open = within(row as HTMLElement).getByRole('link', { name: `Open ${SHELL_NAME}` });
    expect(open).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    // f8: below 760 px of content every value cell carries its column's name.
    expect(
      [...row.querySelectorAll('td[data-label]')].map((cell) => cell.getAttribute('data-label')),
    ).toEqual(['Formats your institution has', 'Completed (WEB)', 'Completed (VR)', 'Assessment']);
    // Never one figure across formats, never a percentage.
    expect(main().textContent).not.toMatch(/total|%/i);
  });

  it('after Flow D: the assessment is Ready (the ok chip)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showMyCourses(runtime, '?tab=experiments');
    const table = await experimentsTable();
    const chip = table.querySelector('tbody .xr-status')!;
    expect(chip).toHaveClass('xr-status', 'xr-status--ok');
    expect(chip).toHaveTextContent(/^Ready$/);
  });

  it('switching tabs is a link; the address names the tab', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    await coursesSection();
    expect(within(tabs()).getByRole('link', { name: 'Experiments' }).tagName).toBe('A');
  });
});

describe('FA-04 — search, filters, chips and no match (f2, f3)', () => {
  it('a search that matches nothing: “0 experiments” and the f3 line; Clear filters brings it back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const section = await experimentsSection();
    await experimentsTable();
    const search = within(section).getByRole('searchbox', { name: 'Search experiments' });
    await user.type(search, 'fin-tube');
    expect(count()).toHaveTextContent(/^0 experiments$/);
    expect(screen.queryByRole('table')).toBeNull();
    const line = section.querySelector('.xr-section-body > p.xr-body')!;
    expect(text(line)).toBe('No experiment matches. Clear filters');
    // A search makes no chip and no toolbar "Clear filters" (the board's script).
    expect(section.querySelector('.xr-fchip')).toBeNull();
    const clear = within(line as HTMLElement).getByRole('button', { name: 'Clear filters' });
    expect(clear).toHaveClass('xr-btn', 'xr-btn--text');
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
    const section = await experimentsSection();
    await experimentsTable();
    const search = within(section).getByRole('searchbox', { name: 'Search experiments' });
    for (const query of ['me zg523', 'thermodynamics', 'SHELL-AND']) {
      await user.clear(search);
      await user.type(search, query);
      expect(count()).toHaveTextContent(/^1 experiment$/);
    }
  });

  it('Format and Activity filters make chips; removing a chip or “Clear filters” resets them', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime, '?tab=experiments');
    const section = await experimentsSection();
    await experimentsTable();
    await user.selectOptions(within(section).getByRole('combobox', { name: 'Format' }), 'vr');
    expect(count()).toHaveTextContent(/^1 experiment$/);
    expect(text(section.querySelector('.xr-fchip'))).toBe('Format: VR');
    // Rahul opened both formats: "With activity" keeps it, "No activity yet" leaves none.
    const activity = within(section).getByRole('combobox', { name: 'Activity' });
    await user.selectOptions(activity, 'some');
    expect(count()).toHaveTextContent(/^1 experiment$/);
    await user.selectOptions(activity, 'none');
    expect(count()).toHaveTextContent(/^0 experiments$/);
    expect([...section.querySelectorAll('.xr-fchip')].map((chip) => text(chip))).toEqual([
      'Format: VR',
      'No activity yet',
    ]);
    const remove = within(section).getByRole('button', { name: 'Remove No activity yet' });
    await user.click(remove);
    expect(activity).toHaveValue('all');
    expect(count()).toHaveTextContent(/^1 experiment$/);
    // Focus moves to the remaining chip's button.
    expect(within(section).getByRole('button', { name: 'Remove Format: VR' })).toHaveFocus();
    await user.click(
      within(section.querySelector('.xr-toolbar-status') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    expect(within(section).getByRole('combobox', { name: 'Format' })).toHaveValue('all');
    expect(section.querySelector('.xr-fchip')).toBeNull();
    expect(within(section).getByRole('searchbox', { name: 'Search experiments' })).toHaveFocus();
  });

  it('“With activity” leaves out an experiment no Student has opened (after Flow B)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showMyCourses(runtime, '?tab=experiments');
    const section = await experimentsSection();
    await experimentsTable();
    expect(cells()[0]!.slice(2, 4)).toEqual(['0', '0']);
    await user.selectOptions(within(section).getByRole('combobox', { name: 'Activity' }), 'some');
    expect(count()).toHaveTextContent(/^0 experiments$/);
    await user.selectOptions(within(section).getByRole('combobox', { name: 'Activity' }), 'none');
    expect(count()).toHaveTextContent(/^1 experiment$/);
  });
});

describe('FA-04 — loading and failed (f4, f5)', () => {
  it('announces loading in the table’s shape; a failed read has “Try again”, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('AssessmentService.getCreateOptions');
    showMyCourses(runtime, '?tab=experiments');
    await h1();
    const busy = await waitFor(() => {
      const element = document.querySelector('.xr-table-wrap[aria-busy="true"]');
      expect(element).not.toBeNull();
      return element!;
    });
    expect(busy.querySelector('[role="status"]')).toHaveTextContent('Loading your experiments');
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your experiments',
    });
    const empty = failed.closest('.xr-empty')!;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('bg-err-bg', 'text-err');
    expect(empty.querySelector('p.xr-body')).toHaveTextContent(
      /^Nothing has changed\. Try again\.$/,
    );
    // The toolbar stays; the count is empty while nothing is listed (`FA-04.count`).
    expect(screen.getByRole('searchbox', { name: 'Search experiments' })).toBeVisible();
    expect(count()?.textContent).toBe('');
    const retry = within(empty as HTMLElement).getByRole('button', { name: 'Try again' });
    expect(retry).toHaveClass('xr-btn', 'xr-btn--primary');
    await user.click(retry);
    expect(await experimentsTable()).toBeVisible();
    expect(count()).toHaveTextContent(/^1 experiment$/);
  });

  it('one experiment’s teaching read failing fails the list too', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.getTeachingExperiment');
    showMyCourses(runtime, '?tab=experiments');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load your experiments' }),
    ).toBeVisible();
  });
});

describe('FA-02 — the Courses tab loading and failed (undrawn; FA-02.loading, FA-02.failed)', () => {
  it('a failed read: the Faculty failed formula; Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.listMyCourses');
    renderInTab(<FacultyMyCourses />, {
      runtime,
      navigation: testNavigation('/faculty/courses'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading your courses',
    );
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your courses',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await coursesSection()).toBeVisible();
  });
});

// ---- The one world: an assessment created through the port --------------------------------------

describe('FA-02 / FA-04 / FA-03 — an assessment created through the port', () => {
  it('counts in the course row and reads “Ready” in the Assessment column', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(runtime);
    const section = await coursesSection();
    expect(text(section.querySelector('.xr-row-sub'))).toMatch(/· 0 assessments$/);
    await createAssessment(runtime);
    await waitFor(() =>
      expect(text(section.querySelector('.xr-row-sub'))).toMatch(/· 1 assessment$/),
    );
  });

  it('a Ready assessment shows in the Experiments tab; a draft reads “Draft — not ready”', async () => {
    const ready = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const first = showMyCourses(ready.runtime, '?tab=experiments');
    await experimentsTable();
    expect(cells()[0]![4]).toBe('No assessment yet');
    await createAssessment(ready.runtime);
    await waitFor(() => expect(cells()[0]![4]).toBe('Ready'));
    first.view.unmount();
    forgetLastAddress();

    const draft = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showMyCourses(draft.runtime, '?tab=experiments');
    await experimentsTable();
    await createAssessment(draft.runtime, 'save-as-draft');
    await waitFor(() => expect(cells()[0]![4]).toBe('Draft — not ready'));
    expect(main().querySelector('tbody .xr-status')).toHaveClass('xr-status--wait');
  });
});

// ---- FA-03 Course (f1) ------------------------------------------------------------------------------

describe('FA-03 Course — the teaching view (B4-02 f1)', () => {
  it('the header, the experiment card with its assessment and per-format activity', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showCourse(runtime);
    await screen.findByRole('heading', { level: 1, name: THERMO_NAME }, { timeout: 5000 });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The shell: "My courses / ME ZG523"; My courses current.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe(THERMO_NAME);
    expect(crumbs()).toEqual(['My courses/', 'ME ZG523']);
    expect(currentSidebar()).toHaveAttribute('href', '/faculty/courses');

    const back = main().querySelector('a.xr-back')!;
    expect(back).toHaveAttribute('href', '/faculty/courses');
    expect(back).toHaveTextContent(/^My courses$/);
    const head = main().querySelector('.xr-phead')!;
    expect(head).toHaveClass('mt-2');
    expect(head.querySelector('.xr-overline')).toHaveTextContent(/^Course you teach$/);
    expect(head.querySelector('.xr-phead-meta > .xr-id')).toHaveTextContent(/^ME ZG523$/);
    expect(head.querySelector('.xr-phead-meta > .xl-meta')).toHaveTextContent(
      /^1 experiment in your institution’s access · 1 student with access$/,
    );

    const section = await screen.findByRole('region', { name: 'Experiments' }, { timeout: 5000 });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      /^Only experiments your institution holds$/,
    );
    const cards = await waitFor(() => {
      const found = section.querySelectorAll('ul > li.xl-exp');
      expect(found).toHaveLength(1);
      return found;
    });
    const card = cards[0] as HTMLElement;
    const title = within(card).getByRole('heading', { level: 3, name: SHELL_NAME });
    expect(title).toHaveClass('xl-exp-title');
    expect(within(title).getByRole('link')).toHaveAttribute(
      'href',
      `/faculty/experiments/${SHELL}`,
    );
    const chip = card.querySelector('.xl-exp-head > .xr-status')!;
    expect(chip).toHaveClass('xr-status--ok');
    expect(chip).toHaveTextContent(/^Assessment ready$/);
    expect([...card.querySelectorAll('dl.xl-kv > dt')].map((term) => text(term))).toEqual([
      'Formats your institution has',
      'Assessment',
    ]);
    const values = [...card.querySelectorAll('dl.xl-kv > dd')];
    expect(text(values[0]!)).toBe('WEBVR');
    // ATT-0450 submitted and marked: one of one, nothing waiting.
    expect(text(values[1]!)).toBe(
      'Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · 1 of 1 submitted',
    );
    const counts = within(card).getByRole('list', { name: 'Student activity by format' });
    expect(counts).toHaveClass('xa-counts');
    expect(
      [...counts.querySelectorAll(':scope > li')].map((row) =>
        [...row.children].map((cell) => text(cell)).join(' | '),
      ),
    ).toEqual([
      'WEBWEB | 1 completed | 0 in progress | 0 not started',
      'VRVR | 1 completed | 0 in progress | 0 not started',
    ]);
    const open = within(card).getByRole('link', { name: 'Open experiment' });
    expect(open).toHaveAttribute('href', `/faculty/experiments/${SHELL}`);
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(open.parentElement).toHaveClass('xw-actions');
    // FA-20 is not built: "Students on this experiment" is not rendered (DEV-21).
    expect(within(card).queryByRole('link', { name: 'Students on this experiment' })).toBeNull();
    expect(within(card).getAllByRole('link')).toHaveLength(2);
  });

  it('after Flow C: no assessment yet (no chip, “No assessment yet”)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    const section = await screen.findByRole('region', { name: 'Experiments' }, { timeout: 5000 });
    const card = await waitFor(() => {
      const found = section.querySelector('li.xl-exp');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(card.querySelector('.xr-status')).toBeNull();
    expect(text(card.querySelectorAll('dl.xl-kv > dd')[1]!)).toBe('No assessment yet');
  });

  it('a draft: “Draft — not ready” and “Students can’t see it.”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    await screen.findByRole('region', { name: 'Experiments' }, { timeout: 5000 });
    await createAssessment(runtime, 'save-as-draft');
    await waitFor(() =>
      expect(main().querySelector('li.xl-exp .xr-status')).toHaveTextContent(/^Draft — not ready$/),
    );
    expect(main().querySelector('li.xl-exp .xr-status')).toHaveClass('xr-status--wait');
    expect(text(main().querySelectorAll('li.xl-exp dl.xl-kv > dd')[1]!)).toBe(
      'Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · Students can’t see it.',
    );
  });

  it('a Ready assessment created in the tab: the chip and the line follow', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showCourse(runtime);
    await screen.findByRole('region', { name: 'Experiments' }, { timeout: 5000 });
    await createAssessment(runtime);
    await waitFor(() =>
      expect(main().querySelector('li.xl-exp .xr-status')).toHaveTextContent(/^Assessment ready$/),
    );
    expect(text(main().querySelectorAll('li.xl-exp dl.xl-kv > dd')[1]!)).toBe(
      'Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · 0 of 1 submitted',
    );
  });

  it('once access has ended the meta says so', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    standinsOf(sample).clock.setSampleNow('2027-10-09T03:30:00.000Z' as IsoInstant);
    showCourse(runtime);
    await screen.findByRole('heading', { level: 1, name: THERMO_NAME }, { timeout: 5000 });
    expect(main().querySelector('.xr-phead-meta > .xl-meta')).toHaveTextContent(
      /^Access ended on 7 Oct 2027 · earlier work and results kept$/,
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
          {
            timeout: 5000,
          },
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
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the course',
    );
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load this course' }),
    ).toBeVisible();
    expect(document.querySelector('a.xr-back')).toHaveAttribute('href', '/faculty/courses');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
  });
});

// ---- Words, state copy and the ledger -------------------------------------------------------------

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  const plain = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${plain}\n${raw}`;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('B4-02’s words, the state-copy register and the ledger', () => {
  const B4_02 = words('B4-02-My-Courses-and-Experiments.dc.html');

  it('every drawn phrase is found verbatim on B4-02, the composed ones with its sample values', () => {
    const drawn = [
      ...strings(MY_COURSES_PAGE),
      ...strings(EXPERIMENTS_TAB),
      ...strings(COURSE_PAGE),
      courseFactsLine({ experiments: 1, studentsWithAccess: 5, assessments: 1 }),
      accessEndedLine('2027-10-07'),
      openCourseLabel(THERMO_NAME),
      completedHeader('web'),
      completedHeader('vr'),
      formatChip('web'),
      openExperimentLabel(SHELL_NAME),
      courseMetaLine({ experiments: 1, studentsWithAccess: 5 }),
      assessmentLine({
        name: 'Heat Exchanger — post-lab',
        deadline: '14 Nov 2026, 23:59',
        submitted: 1,
        reach: 5,
        waiting: 1,
      }),
    ];
    for (const phrase of drawn) {
      // Composed in the board's script: "Format: " + s.fmt; "Open {{ r.t }}".
      const found =
        phrase === 'Format: WEB'
          ? B4_02.includes("'Format: '")
          : phrase === openExperimentLabel(SHELL_NAME)
            ? B4_02.includes('aria-label="Open {{ r.t }}"')
            : B4_02.includes(phrase);
      expect(found, phrase).toBe(true);
    }
  });

  it('the register holds this group’s entries, provisional, no decision id in their words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_COURSES)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry.status).toBe('provisional');
      expect(entry.words ?? '').not.toMatch(/\b(?:OD|T|PC|DEV|VD|BC)-?\d/);
    }
  });

  it('the ledger: no primary, FA-20 not rendered with its reason, every built target a page', () => {
    expect(P4_FACULTY_COURSES_LINK_TARGETS.filter((entry) => entry.role === 'primary')).toEqual([]);
    const hidden = P4_FACULTY_COURSES_LINK_TARGETS.filter(
      (entry) => entry.outcome === 'not-rendered',
    );
    expect(hidden.map((entry) => `${entry.screen} ${entry.action}`)).toEqual([
      'FA-03 Students on this experiment',
    ]);
    expect(hidden[0]!.note).toMatch(/FA-20 Students is not built/);
  });
});
