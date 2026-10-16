/**
 * FA-05 Experiment, the teaching view (board B4-03 f0 … f4) on the real composition root and the
 * sample world: the published page with its read-only outcomes, the formats the institution has
 * and the formats its Students used, the per-format activity (never one figure across formats),
 * and the institution's assessment — f0 Ready with "Open assessment", f1 none yet with "Create
 * assessment", f2 a draft with "Continue setting up", f3 no activity yet. The one world moves the
 * page: an assessment created and set through the port, a Student's submission, a runtime report,
 * the Institute Admin removing the Faculty course mapping (IA-15). The undrawn loading, failed and
 * not-found states; every drawn phrase is the board's own.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, ExperimentId, PersonId, RecordRef } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ABOUT,
  ACTIVITY,
  ASSESSMENT_ROW,
  draftLine,
  EXPERIMENT_PAGE,
  EXPERIMENT_SECTIONS,
  experimentOverline,
  NO_ASSESSMENT,
  noActivityLine,
  readyLine,
  studentsHaveLine,
} from '@/copy/faculty-experiment';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_FACULTY_EXPERIMENT } from '@/copy/state-copy-faculty-experiment';
import { P4_FACULTY_EXPERIMENT_LINK_TARGETS } from '@/nav/link-targets-p4/experiment';
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
const assessmentRegion = () => region(EXPERIMENT_SECTIONS.assessment);
const activityRegion = () => region(EXPERIMENT_SECTIONS.activity);
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

/** The per-format rows (`ul.xa-counts > li`): the format, then each count, as their text. */
function countRows(): string[] {
  return [...activityRegion().querySelectorAll('ul.xa-counts > li')].map((row) =>
    [...row.children].map((cell) => text(cell)).join(' | '),
  );
}

/** The two labelled facts under the H1, as "label: chips". */
function facts(): string[] {
  return [...main().querySelectorAll('.xr-phead-meta .xw-statusline > .xl-inline')].map((fact) => {
    const [label, ...rest] = [...fact.children];
    return `${text(label!)}: ${rest.map((part) => text(part)).join(' ')}`;
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

// ---- f0: Ready (after Flow D: ASMT-0009 Ready, ATT-0450 submitted and released) --------------

describe('FA-05 — the teaching view with a Ready assessment (B4-03 f0)', () => {
  it('the header, the two format facts, the Ready row, activity per format and the experiment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showExperiment(runtime);
    await heading();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    // The shell: My courses current; "My courses / ME ZG523 / Shell-and-Tube Heat Exchanger".
    expect(document.querySelector('.xr-top-title')?.textContent).toBe(SHELL_NAME);
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect([...crumbs.querySelectorAll('li')].map((item) => text(item))).toEqual([
      'My courses/',
      'ME ZG523/',
      SHELL_NAME,
    ]);
    expect(within(crumbs).getByRole('link', { name: 'ME ZG523' })).toHaveAttribute(
      'href',
      '/faculty/courses/thermodynamics-heat-transfer',
    );
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/courses');

    // Back to My courses; "ME ZG523 · Thermodynamics & Heat Transfer"; the two labelled facts.
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/faculty/courses');
    expect(main().querySelector('a.xr-back')).toHaveTextContent(/^My courses$/);
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(facts()).toEqual([
      'Formats your institution has: WEBVR',
      'Formats used by your students: WEBVR',
    ]);
    for (const chip of main().querySelectorAll('.xr-phead-meta .xr-fmt')) {
      expect(chip).toHaveClass('xr-fmt', 'xr-fmt--yours', 'xr-fmt--compact');
    }

    // Three sections in the drawn order.
    expect(
      [...main().querySelectorAll('.xw-stack > section.xr-section h2')].map((h) => h.textContent),
    ).toEqual(['Assessment', 'Student activity', 'About this experiment']);

    // Assessment: the Ready row (the world's own counts: one Student reached, one submitted).
    const row = await within(assessmentRegion()).findByRole('listitem');
    expect(row).toHaveClass('xr-row');
    expect(row.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--ok');
    expect(row.querySelector('.xr-row-title')).toHaveTextContent('Heat Exchanger — post-lab');
    expect(row.querySelector('.xr-row-sub .xr-status')).toHaveClass('xr-status--ok');
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      'Ready Due 14 Nov 2026, 23:59 · 1 of 1 submitted',
    );
    const open = within(row).getByRole('link', { name: 'Open assessment' });
    expect(open).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    expect(open).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(open.parentElement).toHaveClass('xw-actions');
    // FA-18 is not built: no "Mark … written answer" (DEV-21).
    expect(within(row).getAllByRole('link')).toHaveLength(1);

    // Student activity: the Students reached, one row per format, nothing summed.
    const activity = activityRegion();
    expect(activity.querySelector('.xr-section-body > p.xr-body')).toHaveTextContent(
      /^1 student has this experiment from your institution\.$/,
    );
    expect(activity.querySelector('p.xr-body strong')).toHaveTextContent(/^1 student$/);
    expect(within(activity).getByRole('list', { name: 'Student activity by format' })).toHaveClass(
      'xa-counts',
    );
    expect(countRows()).toEqual([
      'WEBWEB | 1 completed | 0 in progress | 0 not started',
      'VRVR | 1 completed | 0 in progress | 0 not started',
    ]);
    // "See students on this experiment" under the per-format rows opens FA-20 for it (Phase 4B).
    const students = within(activity).getByRole('link', {
      name: 'See students on this experiment',
    });
    expect(students).toHaveAttribute('href', `/faculty/students?experimentId=${SHELL}`);
    expect(students.parentElement).toHaveClass('xr-section-body');
    expect(students.previousElementSibling).toHaveClass('xa-counts');
    expect(within(activity).queryAllByRole('link')).toHaveLength(1);
    // "as of <date>": the read's own instant (PC-52), the sample today of the fixture.
    expect(activity.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'as of 15 Nov 2026',
    );

    // About: the published description and outcomes (read-only), the resources' titles.
    const about = region(EXPERIMENT_SECTIONS.about);
    expect(about.querySelector('p.xr-body')).toHaveTextContent(
      'Vary flow rates and inlet temperatures across a two-pass exchanger, then derive the effectiveness–NTU relationship from your own readings.',
    );
    expect(
      within(about).getByRole('heading', { level: 3, name: 'Learning outcomes' }),
    ).toBeVisible();
    expect([...about.querySelectorAll('ul > li')].map((item) => item.textContent)).toEqual([
      'Determine log mean temperature difference from measured inlet and outlet conditions',
      'Compare countercurrent and cocurrent arrangements at matched duty',
    ]);
    expect(about.querySelector('p.xl-open')).toHaveTextContent(ABOUT.outcomesNote);
    expect(about.querySelector('p.xl-open svg path')).toHaveAttribute(
      'd',
      'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
    );
    const resources = within(about).getByRole('heading', { level: 3, name: ABOUT.resources });
    expect(resources.nextElementSibling).toHaveClass('xr-body', 'text-ink-2');
    expect(text(resources.nextElementSibling)).toBe(
      'Lab brief — Shell-and-Tube Heat Exchanger · Pre-lab reading — the effectiveness–NTU method · Readings sheet',
    );
    // No editing of outcomes (LD-3), no feedback for Faculty (T-25), no total.
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
    expect(main().textContent).not.toMatch(/feedback|rating|total|%/i);
  });
});

// ---- f1: no assessment yet (after Flow C) ------------------------------------------------------

describe('FA-05 — no assessment yet (B4-03 f1)', () => {
  it('“Create assessment” carries the experiment to FA-07; activity per format from the walk', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const assessment = assessmentRegion();
    const empty = assessment.querySelector('.xr-section-body > .xr-empty')!;
    expect(empty).not.toBeNull();
    expect(within(assessment).getByRole('heading', { level: 3 })).toHaveTextContent(
      NO_ASSESSMENT.title,
    );
    expect(empty.querySelector('p.xr-body')).toHaveTextContent(NO_ASSESSMENT.line);
    const create = within(assessment).getByRole('link', { name: 'Create assessment' });
    expect(create).toHaveAttribute('href', `/faculty/assessments/new?experimentId=${SHELL}`);
    expect(create).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(create).not.toHaveClass('xr-btn--sm');
    // The page's one primary action.
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);

    // Rahul completed WEB and VR on the walk: one completion in each format, side by side.
    expect(countRows()).toEqual([
      'WEBWEB | 1 completed | 0 in progress | 0 not started',
      'VRVR | 1 completed | 0 in progress | 0 not started',
    ]);
    expect(main().textContent).not.toMatch(/2 completed/);
  });

  it('an assessment created through the port replaces the empty state with its row', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    expect(
      within(assessmentRegion()).getByRole('link', { name: 'Create assessment' }),
    ).toBeVisible();

    const created = await createAssessment(runtime, {
      mode: 'create',
      rules: RULES,
      questions: ['Q-0101', 'Q-0106'],
    });
    const row = await within(assessmentRegion()).findByRole('listitem');
    expect(row.querySelector('.xr-row-title')).toHaveTextContent('Heat Exchanger — post-lab');
    await waitFor(() =>
      expect(text(row.querySelector('.xr-row-sub'))).toBe(
        'Ready Due 14 Nov 2026, 23:59 · 0 of 1 submitted',
      ),
    );
    expect(
      within(assessmentRegion()).getByRole('link', { name: 'Open assessment' }),
    ).toHaveAttribute('href', `/faculty/assessments/${created.id}`);
    expect(
      within(assessmentRegion()).queryByRole('link', { name: 'Create assessment' }),
    ).toBeNull();

    // Rahul submits his attempt (the written answer waits for marking): the row says so.
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
      expect(text(assessmentRegion().querySelector('.xr-row-sub'))).toBe(
        'Ready Due 14 Nov 2026, 23:59 · 1 of 1 submitted · 1 waiting for marking',
      ),
    );
    // Phase 4B: "Mark 1 written answer" opens FA-18 for this assessment, before "Open assessment".
    expect(
      within(assessmentRegion())
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Mark 1 written answer', `/faculty/marking?assessmentId=${created.id}`],
      ['Open assessment', `/faculty/assessments/${created.id}`],
    ]);
  });
});

// ---- f2: a draft -------------------------------------------------------------------------------

describe('FA-05 — an assessment in draft (B4-03 f2)', () => {
  it('rules set, no questions: the draft row and “Continue setting up”; Ready once it has a question', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const draft = await createAssessment(runtime, {
      mode: 'save-as-draft',
      rules: RULES,
      questions: [],
    });
    const row = await within(assessmentRegion()).findByRole('listitem');
    expect(row.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--wait');
    expect(row.querySelector('.xr-row-sub .xr-status')).toHaveClass('xr-status--wait');
    expect(text(row.querySelector('.xr-row-sub'))).toBe(
      'Draft — not ready Rules set · no questions yet. Students can’t see it.',
    );
    const resume = within(row).getByRole('link', { name: 'Continue setting up' });
    expect(resume).toHaveAttribute('href', `/faculty/assessments/${draft.id}`);
    expect(resume).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    // f2 draws the draft's action on its own, not in a group.
    expect(resume.parentElement).toBe(row);

    // A question added through the port makes it Ready: the row follows.
    const added = await runtime.ports.assessments.updateQuestions({
      id: draft.id,
      questions: [{ questionId: 'Q-0101' as never, questionVersion: 1 }],
      expectedRev: draft.rev,
    });
    if (!added.ok) throw new Error(`update refused: ${JSON.stringify(added.error)}`);
    await changed(runtime, added.changed);
    expect(
      await within(assessmentRegion()).findByRole('link', { name: 'Open assessment' }),
    ).toHaveAttribute('href', `/faculty/assessments/${draft.id}`);
    expect(assessmentRegion().querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--ok');
    expect(
      within(assessmentRegion()).queryByRole('link', { name: 'Continue setting up' }),
    ).toBeNull();
  });

  it('a draft with no rule set, or some, says so (state-copy FA-05.draft-line)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showExperiment(runtime);
    await heading();
    const draft = await createAssessment(runtime, {
      mode: 'save-as-draft',
      rules: NO_RULES,
      questions: [],
    });
    await waitFor(() =>
      expect(text(assessmentRegion().querySelector('.xr-row-sub'))).toBe(
        'Draft — not ready Rules not set yet · no questions yet. Students can’t see it.',
      ),
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
      expect(text(assessmentRegion().querySelector('.xr-row-sub'))).toBe(
        'Draft — not ready Some rules not set yet · 1 question. Students can’t see it.',
      ),
    );
  });

  it('one assessment per experiment: a second is refused and the page keeps the first', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showExperiment(runtime);
    await within(await screen.findByRole('region', { name: 'Assessment' })).findByRole('listitem');
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
    expect(within(assessmentRegion()).getAllByRole('listitem')).toHaveLength(1);
  });
});

// ---- f3: no activity yet (after Flow B: Rahul given the experiment, nothing opened) ------------

describe('FA-05 — no activity yet (B4-03 f3)', () => {
  it('“None yet” and the one line; a runtime report brings the per-format rows', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showExperiment(runtime);
    await heading();
    expect(facts()).toEqual([
      'Formats your institution has: WEBVR',
      'Formats used by your students: None yet',
    ]);
    expect(main().querySelectorAll('.xr-phead-meta .xl-inline')[1]!.lastElementChild).toHaveClass(
      'xl-meta',
    );
    const activity = activityRegion();
    expect(activity.querySelector('.xr-section-body > p.xr-body')).toHaveTextContent(
      /^1 student has this experiment\. They haven’t opened it yet\.$/,
    );
    expect(activity.querySelector('.xr-section-body > p.xr-body')).toHaveClass('text-ink-2');
    expect(activity.querySelector('ul.xa-counts')).toBeNull();
    // f3 also has no assessment yet: "Create assessment".
    expect(
      within(assessmentRegion()).getByRole('link', { name: 'Create assessment' }),
    ).toBeVisible();

    await report(sample, runtime, 'web');
    await waitFor(() =>
      expect(countRows()).toEqual([
        'WEBWEB | 0 completed | 1 in progress | 0 not started',
        'VRVR | 0 completed | 0 in progress | 1 not started',
      ]),
    );
    expect(activityRegion().querySelector('p.xr-body')).toHaveTextContent(
      '1 student has this experiment from your institution.',
    );
    expect(facts()[1]).toBe('Formats used by your students: WEB');
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

// ---- Not found: unknown, out of scope, no course, the mapping removed ---------------------------

describe('FA-05 — not found (state-copy FA-05.not-found)', () => {
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

  it('a co-teaching colleague sees the assessment held back calmly, never a failure (Phase 4B review)', async () => {
    const { runtime, sample } = await tabPlatform(DESAI, 'after-flow-d');
    const assigned = await asPersonId(sample, MEERA).facultyCourses.assign({
      facultyId: DESAI as PersonId,
      courseId: 'thermodynamics-heat-transfer' as CourseId,
    });
    expect(assigned.ok).toBe(true);
    showExperiment(runtime);
    await heading();
    await waitFor(() =>
      expect(assessmentRegion()).toHaveTextContent('This assessment isn’t available to you yet'),
    );
    expect(within(assessmentRegion()).queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(within(assessmentRegion()).queryByRole('link')).toBeNull();
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

// ---- Undrawn: loading and failed ----------------------------------------------------------------

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

  it('the assessment failing to load fails its section only; Try again reads it again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.getAssessment');
    showExperiment(runtime);
    await heading();
    const alert = await within(assessmentRegion()).findByRole('alert');
    expect(alert).toHaveTextContent('The assessment didn’t load. Nothing was lost.');
    // The rest of the page is as read.
    expect(countRows()).toHaveLength(2);
    expect(region(EXPERIMENT_SECTIONS.about)).toBeVisible();
    await user.click(within(assessmentRegion()).getByRole('button', { name: 'Try again' }));
    expect(
      await within(assessmentRegion()).findByRole('link', { name: 'Open assessment' }),
    ).toBeVisible();
  });
});

// ---- The words are B4-03's; the ledger rows -----------------------------------------------------

/** A board's text with tags removed and `&amp;` read, then its raw markup. */
function words(file: string): string {
  const raw = board(file);
  const plain = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${plain}\n${raw}`;
}

describe('FA-05 words (B4-03)', () => {
  const B4_03 = words('B4-03-Experiment-Teaching-View.dc.html');

  it.each([
    ...Object.values(EXPERIMENT_PAGE),
    ...Object.values(EXPERIMENT_SECTIONS),
    ...Object.values(NO_ASSESSMENT),
    ...Object.values(ASSESSMENT_ROW),
    ...Object.values(ACTIVITY),
    ...Object.values(ABOUT),
  ])('“%s” is on B4-03', (phrase) => {
    expect(B4_03).toContain(phrase);
  });

  it('the composed words follow the board with its own sample values', () => {
    expect(experimentOverline('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    expect(B4_03).toContain('ME ZG523 · Thermodynamics & Heat Transfer');
    const have = studentsHaveLine(5);
    expect(B4_03).toContain(`<strong>${have.strong}</strong> ${have.rest}`);
    expect(B4_03).toContain(noActivityLine(5));
    const ready = readyLine({
      deadline: '14 Nov 2026, 23:59',
      counts: { submitted: 1, reach: 5, waiting: 1 },
    });
    expect(ready).toBe('Due 14 Nov 2026, 23:59 · 1 of 5 submitted · 1 waiting for marking');
    expect(B4_03).toContain(ready);
    const rules = {
      passMarkPercent: 50,
      attemptsAllowed: 2,
      deadline: '2026-11-14T18:29:00.000Z',
      release: { option: 'after-deadline', releaseDate: null },
    } as const;
    expect(B4_03).toContain(draftLine(rules as never, 0));
  });

  it('the undrawn words and rules are provisional entries of the one register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_FACULTY_EXPERIMENT)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(entry).toMatchObject({ screen: 'FA-05', status: 'provisional' });
      if (entry.words) expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV)-\d/);
    }
  });

  it('the ledger: one primary per drawn state; FA-18 and FA-20 linked (Phase 4B)', () => {
    const rows = P4_FACULTY_EXPERIMENT_LINK_TARGETS;
    expect(rows.every((row) => row.on === '/faculty/experiments/{experimentId}')).toBe(true);
    expect(rows.filter((row) => row.role === 'primary').map((row) => row.action)).toEqual([
      'Open assessment',
      'Create assessment',
      'Continue setting up',
    ]);
    expect(rows.filter((row) => row.outcome === 'not-rendered')).toEqual([]);
    expect(rows.find((row) => row.action === 'Mark 1 written answer')).toMatchObject({
      outcome: 'built',
      target: '/faculty/marking?assessmentId={assessmentId}',
    });
    expect(rows.find((row) => row.action === 'See students on this experiment')).toMatchObject({
      outcome: 'built',
      target: '/faculty/students?experimentId={experimentId}',
    });
  });
});
