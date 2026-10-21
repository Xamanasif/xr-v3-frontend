/**
 * The experiment hub, on the real composition root and the sample world, as the V3 Student export
 * draws it (ST-v1 `StudentFinal.dc.html`): the hub's head and five section tabs, ST-05 Overview
 * (about, what you learn, your formats with the one next step, Learning resources and Assessment
 * beside), ST-06 Resources, ST-07 Simulation — choose a format, ST-10 Progress for this
 * experiment. Every row, status and action is the ports' answer for the signed-in Student;
 * mid-flow states (WEB in progress, WEB completed without feedback) come from the CI-only
 * runtime-report stand-ins, never from a page. The safeguards: opening a resource or launching
 * WEB completes nothing (T-12, T-13); feedback is offered per format, only on that format's own
 * completion (BC5); no percentage, no experiment-level verdict; no stage (lead decision 1); no
 * record reference in any word, name or title (lead decision 3). The Assessment tab itself:
 * student-assessments.test.tsx.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  asPersonId,
  beginSession,
  faults,
  fixtureWorld,
  ist,
  standinsOf,
} from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest';

import { STATE_COPY_LEARNING_HUB } from '@/copy/state-copy-learning-hub';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { ExperimentHub, nextStepOf } from './st-05-experiment-hub/experiment-hub';
import { Resources } from './st-06-resources/resources';
import { SimulationChooser } from './st-07-simulation/simulation-chooser';
import { ExperimentProgress } from './st-10-experiment-progress/experiment-progress';

/**
 * Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces (in a string, or in each string of a row).
 */
function plain<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\u00a0/g, ' ') as T;
  if (Array.isArray(value)) return value.map((item: unknown) => plain(item)) as T;
  return value;
}

let opened: MockInstance<typeof window.open>;
/** The blank tab the page opens in the click (`openPendingTab`), then points or closes. */
let tab: {
  opener: unknown;
  location: { replace: ReturnType<typeof vi.fn> };
  close: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  tab = { opener: window, location: { replace: vi.fn() }, close: vi.fn() };
  opened = vi.spyOn(window, 'open').mockImplementation(() => tab as unknown as Window);
});

afterEach(() => {
  opened.mockRestore();
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const HUB = `/student/experiments/${SHELL}`;
const HUB_PATTERN = '/student/experiments/{experimentId}';
const COURSE = '/student/courses/thermodynamics-heat-transfer';
const BRIEF = 'Lab brief — Shell-and-Tube Heat Exchanger';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inStudent(runtime: PlatformRuntime, path: string, page: ReactNode) {
  return renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation: testNavigation(path) },
  );
}

const main = () => screen.getByRole('main');
const COURSE_NAME = 'Thermodynamics & Heat Transfer';

/** The page's breadcrumbs (`nav.rk-crumbs`) as [words, href] — the current one without a link. */
const crumbs = () =>
  [
    ...screen
      .getByRole('navigation', { name: 'Breadcrumb' })
      .querySelectorAll('a, [aria-current="page"]'),
  ].map((item) => [item.textContent?.trim(), item.getAttribute('href')]);

async function hubReady() {
  return screen.findByRole('heading', { level: 1, name: SHELL_NAME }, { timeout: 5000 });
}

/** The section tabs' links as [words, href, current] (`nav.rk-tabs.sv-tabs.sv-tabs--chips`). */
function tabStrip() {
  const strip = screen.getByRole('navigation', { name: `${SHELL_NAME} sections` });
  expect(strip).toHaveClass('rk-tabs', 'sv-tabs', 'sv-tabs--chips');
  return within(strip)
    .getAllByRole('link')
    .map((link) => [
      link.textContent,
      link.getAttribute('href'),
      link.getAttribute('aria-current') === 'page',
    ]);
}

function stripWith(current: string) {
  return [
    ['Overview', HUB, current === 'Overview'],
    ['Resources', `${HUB}/resources`, current === 'Resources'],
    ['Simulation', `${HUB}/simulation`, current === 'Simulation'],
    ['Assessment', `${HUB}/assessment`, current === 'Assessment'],
    ['Progress', `${HUB}/progress`, current === 'Progress'],
  ];
}

/** The hub's head (`div.rk-head`): the code chip and the course, the H1, the pill and its line. */
function hubHead() {
  const head = main().querySelector<HTMLElement>('.rk-head')!;
  return {
    eyebrow: head.querySelector('.st-eyecode')?.textContent,
    meta: head.querySelector('.rk-meta')?.textContent ?? null,
  };
}

/** Student words never carry an internal record reference (lead decision 3, the identifier rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectNoReferences() {
  const root = main();
  expect(root.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of root.querySelectorAll('[aria-label], [title]')) {
    expect(`${element.getAttribute('aria-label')} ${element.getAttribute('title')}`).not.toMatch(
      REFERENCE,
    );
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** The action links of an element as "words → href", "(primary)" for the view's gold one. */
function actionsOf(element: Element | null | undefined): string[] {
  return [...(element?.querySelectorAll('a.rb-btn') ?? [])].map(
    (link) =>
      `${link.textContent} → ${link.getAttribute('href')}${link.classList.contains('rb-btn--primary') ? ' (primary)' : ''}`,
  );
}

/** The Overview's "Your formats" rows as [name, access, next tag, status, fact, actions]. */
function overviewRows() {
  const list = screen.getByRole('list', { name: 'Your formats' });
  return [...list.querySelectorAll<HTMLElement>(':scope > li.sv-frow')].map((row) => [
    row.querySelector('.sv-frow-t b')?.textContent,
    row.querySelector('.sv-frow-acc')?.textContent,
    row.querySelector('.sv-tag')?.textContent ?? null,
    row.querySelector('.xr-st')?.textContent,
    row.querySelector('.sv-frow-f')?.textContent ?? null,
    actionsOf(row),
  ]);
}

/** The "Not available to you" rows as "code name · reason". */
function offRows(): string[] {
  return [...main().querySelectorAll('li.sv-xrow')].map(
    (row) =>
      `${row.querySelector('.xr-fmt')?.textContent} ${row.querySelector('b')?.textContent} · ${row.querySelector('.sv-xrow-r')?.textContent}`,
  );
}

const OFF = [
  'AR Augmented reality · Published for this experiment, not included in your institution’s access',
  'MR Mixed reality · Not published for this experiment',
];

/** The Overview's aside section named `name` (Learning resources, Assessment). */
const side = (name: string) => screen.getByRole('region', { name });

/** The CI-only runtime report (the simulation or the headset), as the walk's C2 steps send it. */
function report(
  sample: Sample,
  format: 'web' | 'vr',
  kind: 'opened' | 'saved' | 'session' | 'completed',
  at: string,
) {
  const runtime = standinsOf(sample).runtimeReport;
  const base = { studentId: RAHUL as never, experimentId: SHELL as never, format, at: ist(at) };
  const answer =
    kind === 'completed'
      ? runtime.reportCompletion({ ...base, from: format === 'web' ? 'simulation' : 'headset' })
      : runtime.reportActivity({ ...base, kind });
  if (!answer.ok) throw new Error(`runtime report refused: ${answer.error.kind}`);
}

/** Rahul on after-flow-b with WEB opened and saved by the simulation (B3-02 f0, B3-01 f9). */
async function webInProgress() {
  const tab = await tabPlatform(RAHUL, 'after-flow-b');
  report(tab.sample, 'web', 'opened', '2026-10-12 10:05');
  report(tab.sample, 'web', 'saved', '2026-10-12 11:20');
  return tab;
}

/** …and then WEB completed, reported by the simulation, without feedback yet (B3-02 f2, B3-01 f8). */
async function webCompleted() {
  const tab = await webInProgress();
  report(tab.sample, 'web', 'completed', '2026-10-14 15:30');
  return tab;
}

async function signIn(sample: Sample, runtime: PlatformRuntime, personId: string) {
  beginSession(sample, personId);
  await act(async () => {
    await runtime.session.refresh();
  });
}

/** The Super Admin pauses Godavari through the port (B7-04), as Package 2A's tests do. */
async function pauseGodavari(sample: Sample, runtime: PlatformRuntime) {
  const admin = asPersonId(sample, SUPER_ADMIN).institutions;
  const found = await admin.getInstitution('godavari' as never);
  if (!found.ok) throw new Error('getInstitution refused');
  const answer = await admin.pauseInstitution({
    institutionId: found.value.institution.id,
    reason: 'The institution asked us to pause access while it checks its student list.',
    expectedRev: found.value.institution.rev,
  });
  if (!answer.ok) throw new Error(`pause refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

/** Meera withdraws SACC-0310 through her own port (B2-04), then Rahul is back in the tab. */
async function meeraWithdrawsRahulsGrant(sample: Sample, runtime: PlatformRuntime) {
  await signIn(sample, runtime, MEERA);
  const grants = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
  if (!grants.ok) throw new Error(grants.error.kind);
  const row = grants.value.find((entry) => entry.grant.id === 'SACC-0310')!;
  const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
    grantId: row.grant.id,
    reason: 'Given individually by mistake.',
    expectedRev: row.grant.rev,
  });
  if (!withdrawn.ok) throw new Error(withdrawn.error.kind);
  await signIn(sample, runtime, RAHUL);
}

/** Fatima Begum (later sample): a supplied licence wait (B3-02 f4; never counted, D7). */
async function fatima() {
  const meera = await tabPlatform(MEERA, 'later-sample');
  const rows = await meera.runtime.ports.people.listStudents({ search: 'Fatima Begum' });
  if (!rows.ok) throw new Error(rows.error.kind);
  return tabPlatform(rows.value[0]!.student.id, 'later-sample');
}

// ---- ST-05 Overview and the hub's head ---------------------------------------------------------

const WEB_PAGE = `${HUB}/simulation/web`;
const VR_PAGE = `${HUB}/simulation/vr`;

describe('ST-05 Overview — the head, the tabs, the formats and the one next step', () => {
  it('first visit: the head, the five tabs, about and outcomes; “Next step” on Learning resources', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(tabStrip()).toEqual(stripWith('Overview'));
    expect(crumbs()).toEqual([
      ['My courses', '/student/courses'],
      [COURSE_NAME, COURSE],
      [SHELL_NAME, null],
    ]);
    expect(hubHead()).toEqual({ eyebrow: `MEC-523${COURSE_NAME}`, meta: null });
    const about = screen.getByRole('region', { name: 'About this experiment' });
    expect(about.querySelector('.sv-meta')).toHaveTextContent(
      'Mechanical & ManufacturingBITS course codeME ZG523',
    );
    expect(screen.getByRole('region', { name: 'What you’ll learn' })).toHaveTextContent(
      'The same in every format',
    );
    expect(overviewRows()).toEqual([
      [
        'Browser',
        'Available to you',
        null,
        'Not started',
        'Runs in your browser on a laptop or desktop',
        [`Open WEB → ${WEB_PAGE}`],
      ],
      [
        'Virtual reality',
        'Available to you',
        null,
        'Not started',
        'Needs a supported VR headset',
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    expect(offRows()).toEqual(OFF);
    // Nothing opened, nothing started: the resources are the next step, the page's one gold action.
    const resources = side('Learning resources');
    expect(resources).toHaveClass('is-next');
    expect(resources).toHaveTextContent('Next step');
    expect(resources).toHaveTextContent('None opened yet.');
    expect(actionsOf(resources)).toEqual([`Open resources → ${HUB}/resources (primary)`]);
    expect(within(resources).getByRole('link')).toHaveAccessibleName(
      `Open resources, ${SHELL_NAME}`,
    );
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    // None set: the Assessment tab is the only assessment link.
    expect(side('Assessment')).toHaveTextContent(
      'Your faculty hasn’t set an assessment for this experiment yet.',
    );
    expect(
      within(main())
        .getAllByRole('link', { name: /Assessment/ })
        .map((link) => link.getAttribute('href')),
    ).toEqual([`${HUB}/assessment`]);
    await waitFor(() => expect(document.title).toBe(`${SHELL_NAME} · XR Learning Platform`));
    expectNoReferences();
  });

  it('WEB in progress: the WEB row is the next step — Continue WEB, its last save (the hub rule)', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(plain(overviewRows())).toEqual([
      [
        'Browser',
        'Available to you',
        'Next step',
        'In progress',
        'Last saved 12 Oct 2026, 11:20',
        [`Continue WEB → ${WEB_PAGE} (primary)`],
      ],
      [
        'Virtual reality',
        'Available to you',
        null,
        'Not started',
        'Needs a supported VR headset',
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    expect(within(main()).getByRole('link', { name: `Continue WEB, ${SHELL_NAME}` })).toBeVisible();
    expect(side('Learning resources')).not.toHaveClass('is-next');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(main()).not.toHaveTextContent('%');
    expect(main()).not.toHaveTextContent(/stage/i);
  });

  it('a resource opened, nothing started: “choose a format” tags the first format to open (T-16)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const answer = await runtime.ports.learning.openResource({
      resourceId: 'res-shell-brief' as never,
    });
    expect(answer.ok).toBe(true);
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    const rows = overviewRows();
    expect(rows[0]).toEqual([
      'Browser',
      'Available to you',
      'Next step',
      'Not started',
      'Runs in your browser on a laptop or desktop',
      [`Open WEB → ${WEB_PAGE} (primary)`],
    ]);
    // Opening a resource is not progress (T-13).
    expect(rows[1]?.[3]).toBe('Not started');
    expect(side('Learning resources')).toHaveTextContent('1 of 3 opened.');
    expect(actionsOf(side('Learning resources'))).toEqual([`Open resources → ${HUB}/resources`]);
  });

  it('both formats completed, feedback sent: no next step, no gold action, no verdict (B3-12)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(plain(overviewRows())).toEqual([
      [
        'Browser',
        'Available to you',
        null,
        'Completed 14 Oct 2026',
        'Feedback sent 14 Oct 2026',
        [],
      ],
      [
        'Virtual reality',
        'Available to you',
        null,
        'Completed 20 Oct 2026',
        'Feedback sent 20 Oct 2026',
        [],
      ],
    ]);
    expect(main()).not.toHaveTextContent('Next step');
    expect(main().querySelector('.rb-btn--primary')).toBeNull();
    expect(actionsOf(side('Learning resources'))).toEqual([`Open resources → ${HUB}/resources`]);
    expect(main()).not.toHaveTextContent(/experiment completed/i);
  });

  it('WEB completed without feedback: “Give feedback on WEB” is the next step (BC5)', async () => {
    const { runtime } = await webCompleted();
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(plain(overviewRows()[0])).toEqual([
      'Browser',
      'Available to you',
      'Next step',
      'Completed 14 Oct 2026',
      'Feedback not given yet',
      [`Give feedback on WEB → ${HUB}/feedback/web (primary)`],
    ]);
    expect(within(main()).queryByRole('link', { name: /Give feedback on VR/ })).toBeNull();
  });

  it('paused: the tabs stay; every format reads Paused with its progress; nothing opens (B2-12 f3)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    await waitFor(() => expect(overviewRows()[0]?.[1]).toBe('Paused'));
    expect(tabStrip()).toEqual(stripWith('Overview'));
    expect(overviewRows()).toEqual([
      ['Browser', 'Paused', null, 'Not started', null, []],
      ['Virtual reality', 'Paused', null, 'Not started', null, []],
    ]);
    expect(main().querySelector('.sv-frow-b .xr-fmt')).toHaveClass('sv-fmt--held');
    expect(main()).not.toHaveTextContent('Next step');
    expect(side('Learning resources')).toHaveTextContent(
      'They open again when the pause is lifted.',
    );
    expect(within(side('Learning resources')).queryByRole('link')).toBeNull();
  });

  it('a licence wait: the head’s pill says it once, without the plan; nothing opens (B3-02 f4)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(hubHead().meta).toBe('Waiting for a licenceYour institution can tell you more.');
    expect(main().querySelector('.rk-meta .xr-st')).toHaveClass('xr-st--warn');
    expect(overviewRows().map((row) => [row[1], row[5]])).toEqual([
      ['Waiting for a licence', []],
      ['Waiting for a licence', []],
    ]);
    expect(main()).not.toHaveTextContent('Next step');
    expect(side('Learning resources')).toHaveTextContent('They open when you have a licence.');
    expect(within(side('Learning resources')).queryByRole('link')).toBeNull();
    expectNoReferences();
  }, 30_000);

  it('nextStepOf follows the real position only (the export’s one rule for Home and the hub)', () => {
    const hub = (
      formats: readonly (readonly [string, string, string])[],
      opened = 0,
      closure: unknown = null,
      assessment: unknown = { kind: 'none-set' },
    ) =>
      ({
        row: {
          formats: formats.map(([format, availability, progress]) => ({
            format,
            availability,
            progress,
          })),
          closure,
        },
        resourceSummary: { total: 3, opened },
        assessment,
      }) as never;
    const both = (web: string, vr: string) =>
      [
        ['web', 'available-to-you', web],
        ['vr', 'available-to-you', vr],
      ] as const;
    const offered = (format: string) => [{ format, feedback: 'offered' }] as never;
    expect(nextStepOf(hub(both('not-started', 'not-started')), null)).toBe('open-resources');
    expect(nextStepOf(hub(both('in-progress', 'not-started'), 1), null)).toBe('continue-web');
    expect(nextStepOf(hub(both('not-started', 'not-started'), 1), null)).toBe('choose-format');
    // VR in progress → continue it on the headset ("Open VR", the hub rule).
    expect(nextStepOf(hub(both('completed', 'in-progress'), 1), null)).toBe('continue-vr');
    // A completed format whose feedback the service offers.
    expect(nextStepOf(hub(both('completed', 'not-started'), 1), null, offered('web'))).toBe(
      'feedback-web',
    );
    // Then the assessment, then a format not started yet.
    const toDo = { id: 'asm-1', result: { kind: 'to-do' } };
    expect(nextStepOf(hub(both('completed', 'not-started'), 1, null, toDo), null)).toBe(
      'assessment-to-do',
    );
    expect(
      nextStepOf(
        hub(both('completed', 'completed'), 1, null, {
          id: 'asm-1',
          result: { kind: 'in-progress' },
        }),
        null,
      ),
    ).toBe('assessment-in-progress');
    expect(nextStepOf(hub(both('completed', 'not-started'), 1), null)).toBe('set-up-vr');
    expect(nextStepOf(hub(both('completed', 'completed'), 3), null)).toBeNull();
    expect(nextStepOf(hub(both('not-started', 'not-started')), 'paused')).toBeNull();
    expect(nextStepOf(hub(both('not-started', 'not-started')), 'inactive')).toBeNull();
    expect(
      nextStepOf(
        hub(both('not-started', 'not-started'), 0, {
          kind: 'waiting-for-a-licence',
          planId: 'ACC-0107',
        }),
        null,
      ),
    ).toBeNull();
  });
});

// ---- ST-06 Resources -----------------------------------------------------------------------------

/** The reading list's rows (`li.sv-li`) as [title, kind and length, status]. */
function resourceRows(section: HTMLElement) {
  return [...section.querySelectorAll<HTMLElement>('li.sv-li')].map((row) => [
    row.querySelector('.sv-li-t')?.textContent,
    [...row.querySelectorAll('.sv-res-m > span')].map((span) => span.textContent).join(' · '),
    row.querySelector('.sv-res-st')?.textContent,
  ]);
}

describe('ST-06 Resources', () => {
  it('first visit: the head, Resources current, three rows not opened yet, the aside', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    await hubReady();
    expect(hubHead().eyebrow).toBe(`MEC-523${COURSE_NAME}`);
    expect(tabStrip()).toEqual(stripWith('Resources'));
    const section = await screen.findByRole('region', { name: 'Resources' });
    expect(section.querySelector('.sv-card-h .sv-sh-note')).toHaveTextContent(
      '3 resources · each opens in a new tab',
    );
    expect(resourceRows(section)).toEqual([
      [BRIEF, 'PDF document · 6 pages', 'Not opened yet'],
      [
        'Pre-lab reading — the effectiveness–NTU method',
        'Web page · About 10 minutes',
        'Not opened yet',
      ],
      ['Readings sheet', 'Spreadsheet · 1 sheet', 'Not opened yet'],
    ]);
    expect(
      within(section).getByRole('button', { name: `Open ${BRIEF} in a new tab` }),
    ).toHaveTextContent('Open');
    const aside = screen.getByRole('complementary', { name: 'How resources fit in' });
    expect(within(aside).getByRole('region', { name: 'Opened isn’t progress' })).toHaveTextContent(
      'None opened yet',
    );
    expect(
      within(aside).getByRole('region', { name: 'Before you run a simulation' }),
    ).toBeVisible();
    await waitFor(() => expect(document.title).toBe('Resources · XR Learning Platform'));
    expect(crumbs()).toEqual([
      ['My courses', '/student/courses'],
      [COURSE_NAME, COURSE],
      [SHELL_NAME, null],
    ]);
    expectNoReferences();
  });

  it('Open: “Opening…”, the link in a new tab, “Opened in a new tab just now” — and no progress (T-13)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const open = await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` });
    await user.click(open);
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent('Opened in a new tab just now'),
    );
    expect(document.activeElement).toHaveAttribute('role', 'status');
    expect(opened).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledWith('', '_blank');
    // The new page gets no handle on this one; the tab gets the resource's link.
    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledTimes(1);
    expect(String(tab.location.replace.mock.calls[0]![0]).length).toBeGreaterThan(0);
    expect(tab.close).not.toHaveBeenCalled();
    // The service keeps the first opening; nothing else changes (T-13).
    const list = await runtime.ports.learning.listResources(SHELL as never);
    expect(
      list.ok && list.value.find((entry) => entry.resource.id === 'res-shell-brief')?.openedAt,
    ).toBeTruthy();
    const chooser = await runtime.ports.learning.getSimulationChooser(SHELL as never);
    expect(chooser.ok && chooser.value.map((view) => view.status)).toEqual(
      chooser.ok ? chooser.value.map(() => 'not-started') : [],
    );
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Opened isn’t progress' })).toHaveTextContent(
        '1 of 3 opened',
      ),
    );
  });

  it('couldn’t open: said in the row, nothing lost; “Try again” opens it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const open = await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` });
    faults(sample).failNext('LearningService.openResource');
    await user.click(open);
    const failed = await screen.findByText('It didn’t open. Nothing was lost — try again.');
    expect(failed).toHaveClass('sv-res-s', 'sv-res-s--err');
    // The blank tab opened in the click is closed again; it never got a link.
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
    // Focus lands on the row's status region, which carries the words.
    await waitFor(() => expect(document.activeElement).toContainElement(failed));
    expect(document.activeElement).toHaveAttribute('role', 'status');
    await user.click(screen.getByRole('button', { name: `Try opening ${BRIEF} in a new tab` }));
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent('Opened in a new tab just now'),
    );
    expect(opened).toHaveBeenCalledTimes(2);
    expect(tab.location.replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('It didn’t open. Nothing was lost — try again.')).toBeNull();
  });

  it('a browser that refuses the new tab: “It didn’t open”, never “Opened” (review finding 1)', async () => {
    opened.mockImplementation(() => null);
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` }));
    expect(await screen.findByText('It didn’t open. Nothing was lost — try again.')).toBeVisible();
    expect(screen.queryByText('Opened in a new tab just now')).toBeNull();
  });

  it('after Flow C: the lab brief reads the first opening the service kept', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    await waitFor(() => expect(resourceRows(section)).toHaveLength(3));
    const rows = resourceRows(section);
    expect(plain(rows[0]?.[2])).toBe('Opened 12 Oct 2026, 09:40');
    expect(section.querySelector('.sv-res-s--ok')).toHaveTextContent('Opened 12 Oct 2026, 09:40');
    expect(rows[1]?.[2]).toBe('Not opened yet');
    expect(screen.getByRole('region', { name: 'Opened isn’t progress' })).toHaveTextContent(
      '1 of 3 opened',
    );
  });

  it('none attached: the state row, and the other tabs don’t wait', async () => {
    const world = await fixtureWorld('after-flow-b');
    const shell = world.records.experiments[SHELL]!;
    const { runtime } = await worldPlatform(RAHUL, {
      ...world,
      records: {
        ...world.records,
        experiments: { ...world.records.experiments, [SHELL]: { ...shell, resources: [] } },
      },
    });
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const title = await screen.findByRole('heading', {
      level: 3,
      name: 'No resources are attached to this experiment yet',
    });
    const state = title.closest('.sv-pstate')!;
    expect(state).toHaveAttribute('role', 'status');
    expect(state).toHaveTextContent(
      'When resources are added, they appear here. The simulation and the other tabs don’t depend on them.',
    );
    expect(screen.getByRole('region', { name: 'Resources' })).toHaveTextContent(
      'Each resource opens in a new tab',
    );
    expect(tabStrip()).toEqual(stripWith('Resources'));
  });

  it('the list failed says nothing changed; “Try again” reads again and focuses “Resources”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.listResources');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load the resources' });
    expect(failed.closest('.sv-pstate')).toHaveAttribute('role', 'alert');
    expect(failed.closest('.sv-pstate')).toHaveTextContent('Nothing has changed. Try again.');
    // The head and the tabs stay.
    expect(tabStrip()).toEqual(stripWith('Resources'));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` })).toBeVisible();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { level: 2, name: 'Resources' }),
      ),
    );
  });

  it('the list loading: the label in a status region, the block busy', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    // The hub answers first; the list is held back.
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const listResources = runtime.ports.learning.listResources.bind(runtime.ports.learning);
    vi.spyOn(runtime.ports.learning, 'listResources').mockImplementation(async (id) => {
      await held;
      return listResources(id);
    });
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    await hubReady();
    const status = await screen.findByText('Loading resources…');
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('.sv-loading')).toHaveAttribute('aria-busy', 'true');
    release();
    expect(await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` })).toBeVisible();
  });

  it('paused: listed, not openable — the pause said once above the list', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    await waitFor(() =>
      expect(section.querySelector('.sv-res-held')).toHaveTextContent(
        'They can’t be opened while your institution’s access is paused.',
      ),
    );
    expect(resourceRows(section)).toHaveLength(3);
    expect(within(section).queryByRole('button')).toBeNull();
  });

  it('a licence wait: listed, not openable, said once in words (`ST-06.closed`)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' }, { timeout: 5000 });
    await waitFor(() =>
      expect(section.querySelector('.sv-res-held')).toHaveTextContent(
        'They open when you have a licence.',
      ),
    );
    expect(hubHead().meta).toBe('Waiting for a licenceYour institution can tell you more.');
    expect(within(section).queryByRole('button')).toBeNull();
    expectNoReferences();
  }, 30_000);

  it('a withdrawn grant: the tab is ST-19 “no longer given”, placed “Not available”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment is no longer given to you',
      }),
    ).toBeVisible();
    await waitFor(() => expect(document.title).toBe('Not available · XR Learning Platform'));
  });
});

// ---- ST-07 Simulation — choose a format ---------------------------------------------------------

/** The chooser's cards (`li.sv-fcard`) as [title, access, next tag, status, facts, actions]. */
function chooserCards() {
  const list = screen.getByRole('list', { name: 'Your formats' });
  return [...list.querySelectorAll<HTMLElement>(':scope > li.sv-fcard')].map((card) => [
    card.querySelector('.sv-fcard-t')?.textContent,
    card.querySelector('.sv-fcard-acc')?.textContent,
    card.querySelector('.sv-tag')?.textContent ?? null,
    card.querySelector('.xr-st')?.textContent,
    [...card.querySelectorAll('.sv-fcard-facts > li')].map((fact) => fact.textContent),
    actionsOf(card),
  ]);
}

async function chooserReady() {
  return screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
}

describe('ST-07 Simulation — choose a format', () => {
  it('first visit: a card per format you can use, its need and progress; Open WEB the one gold action', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    const chooser = screen.getByRole('region', { name: 'Choose a format' });
    expect(chooser).toHaveTextContent(
      'Formats come from your institution’s access. Each one has its own progress.',
    );
    expect(tabStrip()).toEqual(stripWith('Simulation'));
    expect(chooserCards()).toEqual([
      [
        'Browser (WEB)',
        'Available to you',
        null,
        'Not started',
        ['Not opened yet'],
        [`Open WEB → ${WEB_PAGE} (primary)`],
      ],
      [
        'Virtual reality (VR)',
        'Available to you',
        null,
        'Not started',
        ['No headset session reported yet'],
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    const cards = screen
      .getByRole('list', { name: 'Your formats' })
      .querySelectorAll('li.sv-fcard');
    expect(cards[0]).toHaveTextContent(
      'Runs in your browser on a laptop or desktop. This page keeps your place between visits.',
    );
    await waitFor(() =>
      expect(cards[1]?.querySelector('.sv-fcard-dev')).toHaveTextContent(
        'Your headset: ME lab VR headset, asset tag GIT-VR-03',
      ),
    );
    expect(offRows()).toEqual(OFF);
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(main()).not.toHaveTextContent(/stage/i);
    await waitFor(() => expect(document.title).toBe('Simulation · XR Learning Platform'));
    expectNoReferences();
  });

  it('WEB in progress with its last save: Continue WEB, the next step', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    expect(plain(chooserCards()[0])).toEqual([
      'Browser (WEB)',
      'Available to you',
      'Next step',
      'In progress',
      ['Last saved 12 Oct 2026, 11:20'],
      [`Continue WEB → ${WEB_PAGE} (primary)`],
    ]);
    expect(chooserCards()[1]?.[5]).toEqual([`Open VR → ${VR_PAGE}`]);
  });

  it('WEB completed: Give feedback on WEB only on WEB, its own completion — the gold action (BC5)', async () => {
    const { runtime } = await webCompleted();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole(
      'link',
      { name: `Give feedback on WEB, ${SHELL_NAME}` },
      { timeout: 5000 },
    );
    expect(plain(chooserCards())).toEqual([
      [
        'Browser (WEB)',
        'Available to you',
        'Next step',
        'Completed 14 Oct 2026',
        ['Reported by the simulation at 15:30', 'Feedback not given yet'],
        [`Give feedback on WEB → ${HUB}/feedback/web (primary)`, `Open WEB → ${WEB_PAGE}`],
      ],
      [
        'Virtual reality (VR)',
        'Available to you',
        null,
        'Not started',
        ['No headset session reported yet'],
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    expect(screen.queryByRole('link', { name: /Give feedback on VR/ })).toBeNull();
  });

  it('both completed, feedback sent: no experiment-level “completed”, no gold action', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    expect(plain(chooserCards())).toEqual([
      [
        'Browser (WEB)',
        'Available to you',
        null,
        'Completed 14 Oct 2026',
        ['Reported by the simulation at 15:30', 'Feedback sent 14 Oct 2026'],
        [`Open WEB → ${WEB_PAGE}`],
      ],
      [
        'Virtual reality (VR)',
        'Available to you',
        null,
        'Completed 20 Oct 2026',
        ['Reported from the headset at 11:15', 'Feedback sent 20 Oct 2026'],
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    expect(offRows()).toEqual(OFF);
    expect(screen.queryByRole('link', { name: /Give feedback/ })).toBeNull();
    expect(main().querySelector('.rb-btn--primary')).toBeNull();
    expect(main()).not.toHaveTextContent(/experiment completed|%/i);
  });

  it('launching WEB stores nothing: still Not started until the runtime reports (T-12, AD-16)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const launched = await runtime.ports.learning.launchWebFormat({ experimentId: SHELL as never });
    expect(launched.ok).toBe(true);
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    expect(chooserCards()[0]?.[3]).toBe('Not started');
  });

  it('waiting for a licence: said once in the note, without the plan; nothing opens (D7)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    expect(screen.getByRole('region', { name: 'Choose a format' })).toHaveTextContent(
      'No licence is available for you right now.',
    );
    expect(chooserCards().map((card) => [card[1], card[5]])).toEqual([
      ['Waiting for a licence', []],
      ['Waiting for a licence', []],
    ]);
    expect(main().querySelector('.sv-fcard-why')).toBeNull();
    expect(hubHead().meta).toBe('Waiting for a licenceYour institution can tell you more.');
    expectNoReferences();
  }, 30_000);

  it('paused: the cards stay with the progress kept; nothing opens', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await chooserReady();
    await waitFor(() => expect(chooserCards()[0]?.[1]).toBe('Paused'));
    expect(plain(chooserCards().map((card) => [card[1], card[3], card[5]]))).toEqual([
      ['Paused', 'Completed 14 Oct 2026', []],
      ['Paused', 'Completed 20 Oct 2026', []],
    ]);
    expect(
      within(screen.getByRole('region', { name: 'Choose a format' })).queryByRole('link'),
    ).toBeNull();
  });

  it('the progress read failed: said so, with Try again (`ST-07.failed`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getSimulationChooser');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load the formats' });
    expect(failed.closest('.sv-pstate')).toHaveAttribute('role', 'alert');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await chooserReady()).toBeVisible();
  });

  it('an experiment that isn’t given: ST-19, never a chooser', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment isn’t available to you',
      }),
    ).toBeVisible();
  });
});

// ---- an inactive account (Sneha Reddy, reached through her group on the later sample) ----------

describe('an inactive Student — every tab lists, nothing opens (`ST-05.inactive`, `ST-06.closed`, `ST-07.inactive`, `ST-10.closed`)', () => {
  it('Overview, Resources, Simulation and Progress', async () => {
    const { runtime } = await tabPlatform('per-0005', 'later-sample');
    const hub = inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(overviewRows().map((row) => [row[1], row[5]])).toEqual([
      ['Inactive', []],
      ['Inactive', []],
    ]);
    expect(main()).not.toHaveTextContent('Next step');
    expect(side('Learning resources')).toHaveTextContent(
      'Not available while your account is inactive.',
    );
    expect(within(side('Learning resources')).queryByRole('link')).toBeNull();
    hub.unmount();

    const resources = inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    await waitFor(() =>
      expect(section.querySelector('.sv-res-held')).toHaveTextContent(
        'Not available while your account is inactive.',
      ),
    );
    expect(within(section).queryByRole('button')).toBeNull();
    resources.unmount();

    const chooser = inStudent(
      runtime,
      `${HUB}/simulation`,
      <SimulationChooser experimentId={SHELL} />,
    );
    await chooserReady();
    expect(chooserCards().map((card) => [card[1], card[3], card[5]])).toEqual([
      ['Inactive', 'Not started', []],
      ['Inactive', 'Not started', []],
    ]);
    chooser.unmount();

    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(progressRows().map((row) => [row[1], row[2], row[4]])).toEqual([
      ['Inactive', 'Not started', []],
      ['Inactive', 'Not started', []],
    ]);
  }, 30_000);
});

// ---- ST-10 Progress for this experiment ---------------------------------------------------------

/** The table's rows (`table.sv-ptable`) as [name, access, status, facts, actions]. */
function progressRows() {
  const table = screen.getByRole('table', {
    name: `Your formats for ${SHELL_NAME}: progress and actions`,
  });
  return [...table.querySelectorAll<HTMLElement>('tbody > tr')].map((row) => [
    row.querySelector('.sv-pc-name b')?.textContent,
    row.querySelector('.sv-pc-acc')?.textContent,
    row.querySelector('.sv-pc-p')?.textContent,
    [...row.querySelectorAll('.sv-pc-fact')].map((fact) => fact.textContent),
    actionsOf(row),
  ]);
}

async function progressReady() {
  return screen.findByRole(
    'table',
    { name: `Your formats for ${SHELL_NAME}: progress and actions` },
    { timeout: 5000 },
  );
}

const assessmentLine = () => main().querySelector('.sv-pas');

describe('ST-10 Progress for this experiment', () => {
  it('first visit: one row per given format, the formats not yours, the assessment in words', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(tabStrip()).toEqual(stripWith('Progress'));
    const card = screen.getByRole('region', { name: 'Your progress, format by format' });
    expect(card).toHaveTextContent(
      'Each format has its own progress, with no overall percentage. Opening resources isn’t counted here.',
    );
    expect(card.querySelector('.sv-card-h .sv-sh-note')).toHaveTextContent(
      'Given by your institution',
    );
    expect(progressRows()).toEqual([
      [
        'Browser',
        'Available to you',
        'Not started',
        ['Not opened yet'],
        [`Open WEB → ${WEB_PAGE} (primary)`],
      ],
      [
        'Virtual reality',
        'Available to you',
        'Not started',
        ['No headset session reported yet'],
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
    expect(offRows()).toEqual(OFF);
    expect(assessmentLine()).toHaveTextContent('AssessmentNot set by your faculty yet');
    expect(assessmentLine()?.querySelector('a')).toBeNull();
    expect(main()).not.toHaveTextContent('%');
    await waitFor(() => expect(document.title).toBe('Progress · XR Learning Platform'));
    expectNoReferences();
  });

  it('WEB in progress: first opened and the last save; Continue WEB', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(plain(progressRows()[0])).toEqual([
      'Browser',
      'Available to you',
      'In progress',
      ['First opened 12 Oct 2026, 10:05', 'Last saved 12 Oct 2026, 11:20'],
      [`Continue WEB → ${WEB_PAGE} (primary)`],
    ]);
  });

  it('WEB completed, reported by the simulation → Give feedback on WEB; VR → Open VR', async () => {
    const { runtime } = await webCompleted();
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(plain(progressRows())).toEqual([
      [
        'Browser',
        'Available to you',
        'Completed 14 Oct 2026',
        ['First opened 12 Oct 2026, 10:05', 'Reported by the simulation at 15:30'],
        [`Give feedback on WEB → ${HUB}/feedback/web (primary)`],
      ],
      [
        'Virtual reality',
        'Available to you',
        'Not started',
        ['No headset session reported yet'],
        [`Open VR → ${VR_PAGE}`],
      ],
    ]);
  });

  it('both completed, feedback sent: still no “experiment completed” (B3-12 f2)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(plain(progressRows())).toEqual([
      [
        'Browser',
        'Available to you',
        'Completed 14 Oct 2026',
        [
          'First opened 12 Oct 2026, 10:05',
          'Reported by the simulation at 15:30',
          'Feedback sent 14 Oct 2026',
        ],
        [],
      ],
      [
        'Virtual reality',
        'Available to you',
        'Completed 20 Oct 2026',
        [
          'First session reported 16 Oct 2026, 14:10',
          'Reported from the headset at 11:15',
          'Feedback sent 20 Oct 2026',
        ],
        [],
      ],
    ]);
    expect(main()).not.toHaveTextContent(/experiment completed|%/i);
  });

  it('VR completed, its feedback not sent: Give feedback on VR only', async () => {
    const { runtime, sample } = await webCompleted();
    const sent = await runtime.ports.feedback.sendFeedback({
      experimentId: SHELL as never,
      format: 'web',
      ratings: [5, 4, 4, 5, 4],
      comments: null,
    });
    expect(sent.ok).toBe(true);
    report(sample, 'vr', 'session', '2026-10-16 14:10');
    report(sample, 'vr', 'completed', '2026-10-20 11:15');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    const rows = progressRows();
    expect(rows[0]?.[3]).toContainEqual(expect.stringMatching(/^Feedback sent /));
    expect(rows[0]?.[4]).toEqual([]);
    expect(plain(rows[1]?.[2])).toBe('Completed 20 Oct 2026');
    expect(rows[1]?.[4]).toEqual([`Give feedback on VR → ${HUB}/feedback/vr (primary)`]);
  });

  it('paused: the progress kept, each format Paused, no action', async () => {
    const { runtime, sample } = await webCompleted();
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    await waitFor(() => expect(progressRows()[0]?.[1]).toBe('Paused'));
    expect(plain(progressRows().map((row) => [row[1], row[2], row[4]]))).toEqual([
      ['Paused', 'Completed 14 Oct 2026', []],
      ['Paused', 'Not started', []],
    ]);
    expect(main().querySelector('.sv-holdnote')).toBeNull();
  });

  it('a licence wait: said once above the table, without the plan; nothing opens', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await progressReady();
    expect(main().querySelector('.sv-holdnote')).toHaveTextContent(
      'No licence is available for you right now.',
    );
    expect(progressRows().map((row) => [row[1], row[4]])).toEqual([
      ['Waiting for a licence', []],
      ['Waiting for a licence', []],
    ]);
    expectNoReferences();
  }, 30_000);

  it('the progress read failed: said so, with Try again; the assessment still shows (`ST-10.failed`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getSimulationChooser');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your progress' });
    expect(failed.closest('.sv-pstate')).toHaveAttribute('role', 'alert');
    expect(assessmentLine()).toHaveTextContent('Not set by your faculty yet');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await progressReady()).toBeVisible();
  });
});

// ---- the registers ---------------------------------------------------------------------------

describe('the hub’s registers', () => {
  it('every hub action in the ledger reaches a built page — the Assessment tab too (Phase 4B)', () => {
    const mine = LINK_TARGET_LEDGER.filter((entry) =>
      ['ST-05', 'ST-06', 'ST-07', 'ST-10'].includes(entry.screen),
    );
    expect(new Set(mine.map((entry) => entry.screen))).toEqual(
      new Set(['ST-05', 'ST-06', 'ST-07', 'ST-10']),
    );
    for (const entry of mine) {
      if (entry.target === null) continue;
      const target = expandTarget(entry.target, '/student');
      expect(entry.outcome, `${entry.screen} ${entry.where} ${entry.action}`).toBe('built');
      expect(['screen', 'record-screen'], `${entry.screen} ${entry.action}`).toContain(
        resolveAddress(target).kind,
      );
    }
    // Each tab page's section tabs list the Assessment tab.
    for (const on of ['', '/resources', '/simulation', '/assessment', '/progress']) {
      expect(
        mine.some(
          (entry) =>
            entry.on === `${HUB_PATTERN}${on}` &&
            entry.action === 'Assessment' &&
            entry.target === `${HUB_PATTERN}/assessment`,
        ),
        on,
      ).toBe(true);
    }
  });

  it('every state-copy entry of the hub is provisional, with its decision', () => {
    for (const entry of Object.values(STATE_COPY_LEARNING_HUB)) {
      expect(entry.status).toBe('provisional');
      expect(entry.decisions.length).toBeGreaterThan(0);
      expect(entry.words === null ? Boolean('rule' in entry && entry.rule) : true).toBe(true);
      // Decision ids never reach visible words (P1-14).
      if (entry.words) expect(entry.words).not.toMatch(/\b[A-Z]{1,3}-?\d/);
    }
  });
});
