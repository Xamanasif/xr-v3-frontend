/**
 * FA-05 Experiment, the teaching view — the owner-approved V3 design (design/v3-refined-b/roles/
 * FA-v1 `Main.dc.html` FA-05, `vmExperiment`, `asmSum`) on the real composition root and the sample
 * world: the breadcrumb, the identity band with its figures (the formats the institution has, the
 * formats its Students used, the Students with access), Student activity (one unit meter per format,
 * never one figure across formats), About this experiment (read-only outcomes, resources) and the
 * navy Assessment panel — Ready with "Open assessment", none yet with "Create assessment", a draft
 * with "Continue setting up", written answers waiting with "Mark …" (the oldest waiting submission),
 * a co-teaching colleague's with "Created by …". The one world moves the page: an assessment created
 * and set through the port, a Student's submission, a runtime report, the Institute Admin removing
 * the Faculty course mapping (IA-15). The application's loading, failed and not-found states; every
 * drawn phrase is the export's; no internal reference anywhere.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, ExperimentId, PersonId, RecordRef } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ABOUT,
  ACTIVITY,
  ASSESSMENT_SUMMARY,
  assessmentNoteWords,
  deadlinePassedWords,
  EXPERIMENT_PAGE,
  EXPERIMENT_SECTIONS,
  experimentKicker,
  formatsUsedLabel,
  markWrittenLabel,
  markWrittenWords,
  NO_ASSESSMENT,
  studentsHaveLine,
  writtenWaitingWords,
} from '@/copy/faculty-experiment';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_EXPERIMENT } from '@/copy/state-copy-faculty-experiment';
import { P4_FACULTY_EXPERIMENT_LINK_TARGETS } from '@/nav/link-targets-p4/experiment';
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
import { FacultyExperiment } from './fa-05-experiment/experiment';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const MEERA = 'per-0001';
const RAHUL = 'per-0002';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const FIN_TUBE = 'fin-tube-bundle';
const ADDRESS = `/faculty/experiments/${SHELL}`;

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

function showExperiment(runtime: PlatformRuntime, experimentId = SHELL) {
  const navigation = testNavigation(`/faculty/experiments/${experimentId}`);
  return renderInTab(
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
        <FacultyExperiment experimentId={experimentId} />
      </TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
}

const main = () => screen.getByRole('main');
const heading = () =>
  screen.findByRole('heading', { level: 1, name: SHELL_NAME }, { timeout: 5000 });
const region = (name: string) => screen.getByRole('region', { name });
const activity = () => region(EXPERIMENT_SECTIONS.activity);
/** The navy panel's body, named by its heading through the aside. */
const panel = () =>
  screen
    .getByRole('complementary', { name: EXPERIMENT_SECTIONS.assessment })
    .querySelector('.rk-panel-body') as HTMLElement;

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

/** The per-format rows (the separators between the counts are drawn by CSS). */
function progressRows(): string[] {
  return [...activity().querySelectorAll('ul.fa-prog > li.fa-prog-row')].map((row) => text(row));
}

/** The band's figures as "value · term" (the value is drawn first; the `dt` comes first in the DOM). */
function figures(): string[] {
  return [...main().querySelectorAll('header.fa-cid dl.fa-figs > div.fa-fig')].map((figure) => {
    const value = figure.querySelector('dd')!;
    const formats = value.querySelector('[role="img"]');
    return `${formats ? formats.getAttribute('aria-label') : text(value)} · ${text(figure.querySelector('dt'))}`;
  });
}

async function changed(runtime: PlatformRuntime, refs: readonly RecordRef[]) {
  await act(async () => {
    await runtime.invalidate(refs);
  });
}

const RULES = {
  passMarkPercent: '50',
  attemptsAllowed: '2',
  deadline: '2026-11-14T23:59:00+05:30',
  releaseOption: 'after-deadline',
  releaseDate: null,
} as const;
const NO_RULES = {
  passMarkPercent: '',
  attemptsAllowed: '',
  deadline: '',
  releaseOption: null,
  releaseDate: null,
} as const;

/** The Faculty member creates (or saves as a draft) the experiment's assessment in this tab. */
async function createAssessment(
  runtime: PlatformRuntime,
  input: {
    readonly mode: 'create' | 'save-as-draft';
    readonly rules: typeof RULES | typeof NO_RULES | Record<string, string | null>;
    readonly questions: readonly string[];
  },
) {
  const answer = await runtime.ports.assessments.createAssessment({
    mode: input.mode,
    experimentId: SHELL as never,
    name: 'Heat Exchanger — post-lab',
    introduction: '',
    rules: input.rules as never,
    questions: input.questions as never,
  });
  if (!answer.ok) throw new Error(`create refused: ${JSON.stringify(answer.error)}`);
  await changed(runtime, answer.changed);
  return answer.value;
}

// ---- Ready (after Flow D: the assessment Ready, Rahul's submission marked) ------------------------

describe('FA-05 — the teaching view with a Ready assessment', () => {
  it('the breadcrumb, the band and its figures, activity per format, About and the navy Assessment panel', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showExperiment(runtime);
    const title = await heading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveClass('fa-cid-t');
    expect(title).toHaveAttribute('tabindex', '-1');

    // The breadcrumb names the course by its code and the experiment by its name.
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(text(crumbs)).toBe(`My courses ME ZG523 ${SHELL_NAME}`);
    expect(within(crumbs).getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/faculty/courses',
    );
    expect(within(crumbs).getByRole('link', { name: 'ME ZG523' })).toHaveAttribute(
      'href',
      '/faculty/courses/thermodynamics-heat-transfer',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent(SHELL_NAME);
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/courses');

    // The band: the date, the code and kicker, the name and the three figures.
    const band = main().querySelector('header.fa-cid')!;
    expect(text(band.querySelector('.rb-eyebrow-date'))).toBe('Sunday 15 November 2026');
    expect(text(band.querySelector('.fa-cid-eyebrow'))).toBe(
      'ME ZG523 Experiment you teach · Thermodynamics & Heat Transfer',
    );
    expect(figures()).toEqual([
      'Formats your institution has: WEB, VR · Formats your institution has',
      'Formats used by your students: WEB, VR · Formats your students have used',
      '1 · Students with access',
    ]);
    expect(band.querySelectorAll('.fa-fig--fm')).toHaveLength(2);

    // The sheet's two sections, the panel beside them (first on narrow widths).
    expect(main().querySelector('.rk-detail')).toHaveClass('fa-asidefirst');
    expect(
      [...main().querySelectorAll('.rk-mainsheet > section.rk-sec h2')].map((h) => h.textContent),
    ).toEqual(['Student activity, by format', 'About this experiment']);

    // Student activity: as of the read, one row per format, who has it and the way to them.
    expect(text(activity().querySelector('.rk-sec-h .rk-hint'))).toBe('As of 15 Nov 2026');
    expect(
      within(activity()).getByRole('list', {
        name: `Student activity by format for ${SHELL_NAME}, as of 15 Nov 2026`,
      }),
    ).toHaveClass('fa-prog');
    expect(progressRows()).toEqual([
      'WEB 1 completed 0 in progress 0 not started',
      'VR 1 completed 0 in progress 0 not started',
    ]);
    expect(text(activity().querySelector('p.fa-xp-foot > span'))).toBe(
      '1 student has this experiment from your institution.',
    );
    expect(
      within(activity()).getByRole('link', { name: 'Students on this experiment' }),
    ).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);

    // About: the published description and outcomes (read-only), the resources' titles.
    const about = region(EXPERIMENT_SECTIONS.about);
    expect(text(about.querySelector('p.fa-about'))).toBe(
      'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.',
    );
    const outcomes = within(about).getByRole('list', { name: 'Learning outcomes' });
    expect(outcomes).toHaveClass('fa-check');
    expect([...outcomes.querySelectorAll('li.is-ok')].map((item) => text(item))).toEqual([
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ]);
    expect(text(about.querySelector('.fa-aboutgrid .rk-hint'))).toBe(ABOUT.outcomesNote);
    const resources = within(about).getByRole('list', { name: 'Resources students see' });
    expect([...resources.querySelectorAll('li')].map((item) => text(item))).toEqual([
      'Lab brief — Shell-and-Tube Heat Exchanger',
      'Pre-lab reading — the effectiveness–NTU method',
      'Readings sheet',
    ]);

    // The panel: Ready, the name (FA-08), the deadline passed on 15 Nov, Rahul's submission.
    const body = await waitFor(() => {
      const found = panel();
      expect(found.querySelector('.fa-apanel-id')).not.toBeNull();
      return found;
    });
    expect(body).toHaveClass('rk-panel-body', 'fa-apanel');
    expect(body.querySelector('.fa-apanel-id .xr-st')).toHaveClass('xr-st--ok');
    expect(text(body.querySelector('.fa-apanel-id .xr-st'))).toBe('Ready');
    expect(within(body).getByRole('link', { name: 'Heat Exchanger — post-lab' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    expect(text(body.querySelector('p.fa-asm-d'))).toBe('Deadline passed: 14 Nov 2026, 23:59');
    expect(text(body.querySelector('.fa-asm-subs p'))).toBe('1 of 1 student submitted');
    expect(body.querySelector('.fa-asm-wait')).toBeNull();
    expect(body.querySelector('.fa-asm-note')).toBeNull();
    const open = within(body).getByRole('link', { name: 'Open assessment' });
    expect(open).toHaveClass('rb-btn', 'rb-btn--lg');
    expect(open).not.toHaveClass('rb-btn--primary');
    expect(open.parentElement).toHaveClass('fa-panel-acts');
    // Nothing waits after Flow D: no "Mark …".
    expect(screen.queryByRole('link', { name: /^Mark \d+ written answer/ })).toBeNull();
    // No editing of outcomes (LD-3), no feedback for Faculty (T-25), no total.
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
    expect(main().textContent).not.toMatch(/feedback|rating|total|%/i);
    expectNoReferences();
  });
});

// ---- No assessment yet, then one created, then a submission --------------------------------------

describe('FA-05 — no assessment yet, created, submitted', () => {
  it('“Create assessment” carries the experiment to FA-07; the page’s one primary', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const body = await waitFor(() => {
      const found = panel();
      expect(found.querySelector('.fa-asm-n')).not.toBeNull();
      return found;
    });
    expect(text(body.querySelector('.fa-apanel-id .fa-asm-n'))).toBe(NO_ASSESSMENT.title);
    expect(text(body.querySelector('.fa-apanel-id .fa-asm-note'))).toBe(NO_ASSESSMENT.line);
    const create = within(body).getByRole('link', { name: 'Create assessment' });
    expect(create).toHaveAttribute('href', `/faculty/assessments/new?experimentId=${SHELL}`);
    expect(create).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    // Rahul completed WEB and VR on the walk: one completion in each format, side by side.
    expect(progressRows()).toEqual([
      'WEB 1 completed 0 in progress 0 not started',
      'VR 1 completed 0 in progress 0 not started',
    ]);
    expect(main().textContent).not.toMatch(/2 completed/);
  });

  it('an assessment created through the port replaces it; Rahul’s submission brings “Mark 1 written answer” (the oldest, FA-19)', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    await waitFor(() =>
      expect(within(panel()).getByRole('link', { name: 'Create assessment' })).toBeVisible(),
    );
    const created = await createAssessment(runtime, {
      mode: 'create',
      rules: RULES,
      questions: ['Q-0101', 'Q-0106'],
    });
    await waitFor(() =>
      expect(text(panel().querySelector('p.fa-asm-d'))).toBe(
        'Due 14 Nov 2026, 23:59 · 18 days left',
      ),
    );
    expect(text(panel().querySelector('p.fa-asm-d b'))).toBe('18 days left');
    expect(text(panel().querySelector('.fa-asm-subs p'))).toBe('0 of 1 student submitted');
    expect(within(panel()).getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${created.id}`,
    );
    expect(within(panel()).queryByRole('link', { name: 'Create assessment' })).toBeNull();

    // Rahul submits his attempt (the written answer waits for marking).
    const rahul = asPersonId(sample, RAHUL);
    const started = await rahul.assessments.startAttempt(created.id);
    if (!started.ok) throw new Error(`start refused: ${JSON.stringify(started.error)}`);
    const submitted = await rahul.assessments.submitAttempt({
      attemptId: started.value.id,
      expectedRev: started.value.rev,
    });
    if (!submitted.ok) throw new Error(`submit refused: ${JSON.stringify(submitted.error)}`);
    await changed(runtime, submitted.changed);
    await waitFor(() =>
      expect(text(panel().querySelector('p.fa-asm-wait'))).toBe(
        '1 written answer waiting for marking',
      ),
    );
    expect(text(panel().querySelector('.fa-asm-subs p'))).toBe('1 of 1 student submitted');
    await waitFor(() =>
      expect(
        within(panel())
          .getAllByRole('link')
          .map((link) => [link.textContent, link.getAttribute('href')]),
      ).toEqual([
        ['Heat Exchanger — post-lab', `/faculty/assessments/${created.id}`],
        ['Mark 1 written answer', `/faculty/marking/${started.value.id}`],
        ['Open assessment', `/faculty/assessments/${created.id}`],
      ]),
    );
    const mark = within(panel()).getByRole('link', {
      name: 'Mark 1 written answer for Heat Exchanger — post-lab',
    });
    expect(mark).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expectNoReferences();
  });
});

// ---- A draft ----------------------------------------------------------------------------------------

describe('FA-05 — an assessment in draft', () => {
  it('rules set, no questions: “Draft — not ready”, why students can’t see it, “Continue setting up”; Ready once it has a question', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const draft = await createAssessment(runtime, {
      mode: 'save-as-draft',
      rules: RULES,
      questions: [],
    });
    await waitFor(() =>
      expect(text(panel().querySelector('.fa-apanel-id .xr-st'))).toBe('Draft — not ready'),
    );
    expect(panel().querySelector('.fa-apanel-id .xr-st')!.className).toBe('xr-st');
    expect(text(panel().querySelector('p.fa-asm-d'))).toBe('Due 14 Nov 2026, 23:59');
    expect(text(panel().querySelector('p.fa-asm-note'))).toBe(
      'No questions yet · students can’t see it yet.',
    );
    expect(panel().querySelector('.fa-asm-subs')).toBeNull();
    const resume = within(panel()).getByRole('link', { name: 'Continue setting up' });
    expect(resume).toHaveAttribute('href', `/faculty/assessments/${draft.id}`);
    expect(resume).not.toHaveClass('rb-btn--primary');

    // A question added through the port makes it Ready: the panel follows.
    const added = await runtime.ports.assessments.updateQuestions({
      id: draft.id,
      questions: [{ questionId: 'Q-0101' as never, questionVersion: 1 }],
      expectedRev: draft.rev,
    });
    if (!added.ok) throw new Error(`update refused: ${JSON.stringify(added.error)}`);
    await changed(runtime, added.changed);
    expect(await within(panel()).findByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${draft.id}`,
    );
    expect(panel().querySelector('.fa-apanel-id .xr-st')).toHaveClass('xr-st--ok');
    expect(within(panel()).queryByRole('link', { name: 'Continue setting up' })).toBeNull();
  });

  it('a draft with no rule set: “No deadline set yet”; with a question but rules unfinished: “Rules not finished · …”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const draft = await createAssessment(runtime, {
      mode: 'save-as-draft',
      rules: NO_RULES,
      questions: [],
    });
    await waitFor(() =>
      expect(text(panel().querySelector('p.fa-asm-d'))).toBe('No deadline set yet'),
    );
    expect(text(panel().querySelector('p.fa-asm-note'))).toBe(
      'No questions yet · students can’t see it yet.',
    );
    const set = await runtime.ports.assessments.updateSettings({
      id: draft.id,
      name: draft.name,
      introduction: '',
      rules: { ...NO_RULES, passMarkPercent: '50' },
      expectedRev: draft.rev,
    });
    if (!set.ok) throw new Error(`settings refused: ${JSON.stringify(set.error)}`);
    const withQuestion = await runtime.ports.assessments.updateQuestions({
      id: draft.id,
      questions: [{ questionId: 'Q-0104' as never, questionVersion: 1 }],
      expectedRev: set.value.assessment.rev,
    });
    if (!withQuestion.ok) throw new Error(`update refused: ${JSON.stringify(withQuestion.error)}`);
    await changed(runtime, [...set.changed, ...withQuestion.changed]);
    await waitFor(() =>
      expect(text(panel().querySelector('p.fa-asm-note'))).toBe(
        'Rules not finished · students can’t see it yet.',
      ),
    );
  });

  it('one assessment per experiment: a second is refused and the panel keeps the first', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showExperiment(runtime);
    await heading();
    await waitFor(() =>
      expect(within(panel()).getByRole('link', { name: 'Open assessment' })).toBeVisible(),
    );
    const second = await runtime.ports.assessments.createAssessment({
      mode: 'save-as-draft',
      experimentId: SHELL as never,
      name: 'Second',
      introduction: '',
      rules: NO_RULES as never,
      questions: [],
    });
    expect(second).toMatchObject({
      ok: false,
      error: { kind: 'refused', code: 'assessment-exists' },
    });
    expect(panel().querySelectorAll('.fa-apanel-id')).toHaveLength(1);
    expect(text(panel().querySelector('.fa-asm-n'))).toBe('Heat Exchanger — post-lab');
  });
});

// ---- No activity yet (after Flow B: Rahul given the experiment, nothing opened) -------------------

describe('FA-05 — no activity yet', () => {
  it('“None yet” used, every Student not started; a runtime report brings the progress and the format used', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showExperiment(runtime);
    await heading();
    expect(figures()).toEqual([
      'Formats your institution has: WEB, VR · Formats your institution has',
      'None yet · Formats your students have used',
      '1 · Students with access',
    ]);
    expect(main().querySelectorAll('header.fa-cid .fa-fig dd')[1]).toHaveClass('is-quiet');
    expect(progressRows()).toEqual([
      'WEB 0 completed 0 in progress 1 not started',
      'VR 0 completed 0 in progress 1 not started',
    ]);
    // f3 also has no assessment yet: "Create assessment".
    await waitFor(() =>
      expect(within(panel()).getByRole('link', { name: 'Create assessment' })).toBeVisible(),
    );

    await report(sample, runtime, 'web');
    await waitFor(() =>
      expect(progressRows()).toEqual([
        'WEB 0 completed 1 in progress 0 not started',
        'VR 0 completed 0 in progress 1 not started',
      ]),
    );
    expect(figures()[1]).toBe(
      'Formats used by your students: WEB · Formats your students have used',
    );
  });
});

/** The runtime's own report through the stand-in (the CI seam), then the tab's reads refreshed. */
async function report(sample: Sample, runtime: PlatformRuntime, format: 'web' | 'vr') {
  const standins = standinsOf(sample);
  const answer = standins.runtimeReport.reportActivity({
    studentId: RAHUL as PersonId,
    experimentId: SHELL as ExperimentId,
    format,
    at: standins.clock.now(),
    kind: 'opened',
  });
  if (!answer.ok) throw new Error(`runtime report refused: ${answer.error.kind}`);
  await changed(runtime, answer.changed);
}

// ---- Not found, and a co-teaching colleague ---------------------------------------------------------

describe('FA-05 — not found (state-copy FA-05.not-found) and a co-teaching colleague', () => {
  const notFound = () =>
    screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });

  it('an unknown experiment is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime, 'zz-no-such-experiment');
    expect(await notFound()).toBeVisible();
  });

  it('an experiment the Faculty member does not teach is the same not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime, FIN_TUBE);
    expect(await notFound()).toBeVisible();
  });

  it('a co-teaching colleague sees the assessment named with who created it — never a failure, no submissions, no Mark', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-d');
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as PersonId,
      courseId: 'thermodynamics-heat-transfer' as CourseId,
    });
    expect(assigned.ok).toBe(true);
    showExperiment(runtime);
    await heading();
    await waitFor(() =>
      expect(text(panel().querySelector('p.fa-asm-note'))).toBe('Created by Dr S. Ranganathan.'),
    );
    expect(text(panel().querySelector('.fa-apanel-id .xr-st'))).toBe('Ready');
    expect(panel().querySelector('.fa-asm-subs')).toBeNull();
    expect(panel().querySelector('.fa-asm-wait')).toBeNull();
    expect(within(panel()).queryByRole('alert')).toBeNull();
    expect(within(panel()).queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(
      within(panel())
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Heat Exchanger — post-lab', 'Open assessment']);
    expectNoReferences();
  });

  it('a Faculty member with no course mapped finds nothing', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showExperiment(runtime);
    expect(await notFound()).toBeVisible();
  });

  it('the Institute Admin removing the Faculty course (IA-15) makes the next read not found', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const meera = asPersonId(sample, MEERA);
    const mappings = await meera.facultyCourses.list();
    if (!mappings.ok) throw new Error('mappings');
    const mapping = mappings.value.find(
      (entry) => entry.facultyId === RANGANATHAN && entry.removedAt === null,
    )!;
    const preview = await meera.facultyCourses.previewRemoval({ mappingId: mapping.id });
    expect(preview).toMatchObject({ ok: true, value: { warning: null } });
    const removed = await meera.facultyCourses.remove({
      mappingId: mapping.id,
      expectedRev: mapping.rev,
    });
    if (!removed.ok) throw new Error(`remove refused: ${JSON.stringify(removed.error)}`);
    await changed(runtime, removed.changed);
    expect(await notFound()).toBeVisible();
    expect(screen.queryByRole('heading', { level: 1, name: SHELL_NAME })).toBeNull();
  });
});

// ---- The application's loading and failed --------------------------------------------------------

describe('FA-05 — loading and failed (state-copy FA-05.loading, FA-05.failed)', () => {
  it('announces loading; a failed read says so with Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('TeachingService.getTeachingExperiment');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<FacultyExperiment experimentId={SHELL} />, {
      runtime,
      navigation: testNavigation(ADDRESS),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the experiment',
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The experiment didn’t load. Nothing was lost.');
    expect(alert).toHaveTextContent(
      'Try again. If it keeps happening, report a problem from Help.',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await heading()).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('the assessment failing to load fails its panel only; Try again reads it again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listAssessments');
    showExperiment(runtime);
    await heading();
    const alert = await within(
      screen.getByRole('complementary', { name: EXPERIMENT_SECTIONS.assessment }),
    ).findByRole('alert', {}, { timeout: 5000 });
    expect(alert).toHaveClass('rk-state');
    expect(alert).toHaveTextContent('The assessment didn’t load. Nothing was lost.');
    // The rest of the page is as read.
    expect(progressRows()).toHaveLength(2);
    expect(region(EXPERIMENT_SECTIONS.about)).toBeVisible();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await within(panel()).findByRole('link', { name: 'Open assessment' })).toBeVisible();
  });
});

// ---- The words are the export's; the register and the ledger ------------------------------------

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-05 — words, register and ledger', () => {
  it('every drawn phrase is the export’s, the composed ones as its script composes them', () => {
    for (const phrase of [
      ...strings(EXPERIMENT_PAGE),
      ...strings(EXPERIMENT_SECTIONS),
      ...strings(ACTIVITY),
      ...strings(ABOUT),
      ...strings(ASSESSMENT_SUMMARY),
      ...strings(NO_ASSESSMENT),
    ]) {
      expect(EXPORT, phrase).toContain(phrase);
    }
    for (const form of [
      "'Experiment you teach · ' + c.t",
      "'Formats used by your students: ' + (used.join(', ') || 'none yet')",
      "this.plural(ss.length, 'student has', 'students have') + ' this experiment from your institution.'",
      "'Deadline passed: ' + cfg.dl",
      "this.plural(waitL.length, 'written answer') + ' waiting for marking'",
      "'Mark ' + this.plural(waitL.length, 'written answer')",
      "'Mark ' + this.plural(waitL.length, 'written answer') + ' for ' + (a ? a.name : '')",
      "'Created by ' + this.person(a.by).name + '.'",
      "(cfg.qs.length ? 'Rules not finished' : 'No questions yet') + ' · students can’t see it yet.'",
    ]) {
      expect(RAW, form).toContain(form);
    }
    expect(experimentKicker('Thermodynamics & Heat Transfer')).toBe(
      'Experiment you teach · Thermodynamics & Heat Transfer',
    );
    expect(formatsUsedLabel([])).toBe('Formats used by your students: none yet');
    expect(studentsHaveLine(5)).toBe('5 students have this experiment from your institution.');
    expect(studentsHaveLine(1)).toBe('1 student has this experiment from your institution.');
    expect(deadlinePassedWords('14 Nov 2026, 23:59')).toBe('Deadline passed: 14 Nov 2026, 23:59');
    expect(writtenWaitingWords(2)).toBe('2 written answers waiting for marking');
    expect(markWrittenWords(1)).toBe('Mark 1 written answer');
    expect(markWrittenLabel(2, 'Heat Exchanger — post-lab')).toBe(
      'Mark 2 written answers for Heat Exchanger — post-lab',
    );
    expect(assessmentNoteWords({ colleague: 'Dr S. Ranganathan', ready: true, questions: 4 })).toBe(
      'Created by Dr S. Ranganathan.',
    );
    expect(assessmentNoteWords({ colleague: null, ready: true, questions: 4 })).toBeNull();
    expect(assessmentNoteWords({ colleague: null, ready: false, questions: 1 })).toBe(
      'Rules not finished · students can’t see it yet.',
    );
  });

  it('the undrawn words and rules are provisional entries of the one register, with no reference', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_EXPERIMENT)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry).toMatchObject({ screen: 'FA-05', status: 'provisional' });
      if (entry.words) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV)-\d/);
        expect(entry.words).not.toMatch(REFERENCE);
      }
    }
  });

  it('the ledger: one primary per drawn state of the panel; FA-19, FA-20 and FA-03 linked', () => {
    const rows = P4_FACULTY_EXPERIMENT_LINK_TARGETS;
    expect(rows.every((row) => row.on === '/faculty/experiments/{experimentId}')).toBe(true);
    expect(rows.filter((row) => row.role === 'primary').map((row) => row.action)).toEqual([
      'Mark <n> written answers',
      'Create assessment',
    ]);
    expect(rows.filter((row) => row.outcome === 'not-rendered')).toEqual([]);
    expect(rows.find((row) => row.action === 'Mark <n> written answers')).toMatchObject({
      outcome: 'built',
      target: '/faculty/marking/{attemptId}',
    });
    expect(rows.find((row) => row.action === 'Students on this experiment')).toMatchObject({
      outcome: 'built',
      target: '/faculty/students?experimentId={experimentId}',
    });
    expect(rows.find((row) => row.action === '<course code>')).toMatchObject({
      target: '/faculty/courses/{courseId}',
    });
  });
});
