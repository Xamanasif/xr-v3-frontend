/**
 * Phase 3, the experiment hub's tabs, on the real composition root and the sample world: ST-05's
 * tab strip, Next step and card actions (B2-12, B3-12), ST-06 Resources and ST-10 Progress for
 * this experiment (B3-01), ST-07 Simulation — choose a format (B3-02). Every row, status and
 * action is the ports' answer for the signed-in Student; mid-flow states (WEB in progress, WEB
 * completed without feedback) come from the CI-only runtime-report stand-ins, never from a page.
 * The safeguards: opening a resource or launching WEB completes nothing (T-12, T-13); feedback is
 * offered per format, only on that format's own completion (BC5); no percentage, no
 * experiment-level verdict; no Assessment tab or action (Phase 4, DEV-21).
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
const topTitle = () => document.querySelector('.xr-top-title');
const crumbs = () =>
  [...document.querySelectorAll('.xr-crumbs li')].map((li) => [
    li.textContent?.replace('/', '').trim(),
    li.querySelector('a')?.getAttribute('href') ?? null,
  ]);

async function hubReady() {
  return screen.findByRole('heading', { level: 1, name: SHELL_NAME }, { timeout: 5000 });
}

/** The tab strip's links as [words, href, current]. */
function tabStrip() {
  const strip = screen.getByRole('navigation', { name: SHELL_NAME });
  expect(strip).toHaveClass('xr-tabs', 'xr-tabs--on-white', 'xw-hubtabs');
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
    ['Progress', `${HUB}/progress`, current === 'Progress'],
  ];
}

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

// ---- ST-05: the Phase-3 additions (B2-12 f0 … f3, f5; B3-12) ----------------------------------

describe('ST-05 Overview — the tabs, the one Next step and the cards’ actions', () => {
  it('first visit: the tab strip without Assessment; “open the resources”; the cards open the tabs (B2-12 f0)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    expect(tabStrip()).toEqual(stripWith('Overview'));
    // The Assessment tab (Phase 4) is not rendered (DEV-21).
    expect(screen.queryByRole('link', { name: /Assessment/ })).toBeNull();
    const head = main().querySelector('.xw-hubhead')!;
    expect(head).not.toHaveClass('xl-hubhead');
    const row = head.querySelector('.xw-hubrow')!;
    expect(row).toHaveTextContent('Next step: open the resources');
    const next = within(row as HTMLElement).getByRole('link', { name: 'Open resources' });
    expect(next).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(next).toHaveAttribute('href', `${HUB}/resources`);
    const cards = [...main().querySelectorAll<HTMLElement>('.xw-scard')];
    expect(within(cards[0]!).getByRole('link', { name: 'Open resources' })).toHaveAttribute(
      'href',
      `${HUB}/resources`,
    );
    expect(within(cards[1]!).getByRole('link', { name: 'Choose a format' })).toHaveAttribute(
      'href',
      `${HUB}/simulation`,
    );
    // Assessment: words only (Phase 4).
    expect(within(cards[2]!).queryByRole('link')).toBeNull();
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
  });

  it('WEB in progress: “continue in your browser”, Continue WEB to the WEB page (B2-12 f1)', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    const row = main().querySelector<HTMLElement>('.xw-hubrow')!;
    expect(row).toHaveTextContent('Next step: continue in your browser');
    expect(within(row).getByRole('link', { name: 'Continue WEB' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    const simulation = main().querySelectorAll<HTMLElement>('.xw-scard')[1]!;
    expect(simulation).toHaveTextContent(
      'WEB in progress · VR not started. Each format has its own progress.',
    );
    expect(within(simulation).getByRole('link', { name: 'Continue WEB' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    expect(main()).not.toHaveTextContent('%');
  });

  it('a resource opened, nothing started: the provisional “choose a format” (T-16, nothing locked)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const answer = await runtime.ports.learning.openResource({
      resourceId: 'res-shell-brief' as never,
    });
    expect(answer.ok).toBe(true);
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    const row = main().querySelector<HTMLElement>('.xw-hubrow')!;
    expect(row).toHaveTextContent('Next step: choose a format');
    expect(within(row).getByRole('link', { name: 'Choose a format' })).toHaveAttribute(
      'href',
      `${HUB}/simulation`,
    );
    // Opening a resource is not progress (T-13).
    expect(main().querySelectorAll('.xw-scard')[1]).toHaveTextContent(
      'WEB not started · VR not started.',
    );
  });

  it('both formats completed: no Next step is left, the cards still open the tabs (B3-12)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    expect(main()).not.toHaveTextContent('Next step');
    expect(main().querySelector('.xw-hubrow .xr-btn')).toBeNull();
    expect(main().querySelectorAll('.xw-scard')[1]).toHaveTextContent(
      'WEB completed · VR completed. Each format has its own progress.',
    );
    expect(screen.getAllByRole('link', { name: 'Choose a format' })).toHaveLength(1);
    expect(main()).not.toHaveTextContent(/experiment completed/i);
  });

  it('paused: the tabs stay; no Next step and no card action (B2-12 f3)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    await waitFor(() => expect(main()).toHaveTextContent('Not available while'));
    expect(tabStrip()).toEqual(stripWith('Overview'));
    expect(main()).not.toHaveTextContent('Next step');
    expect(main().querySelectorAll('.xw-scard a')).toHaveLength(0);
  });

  it('a licence wait: no Next step, no card action; the header keeps “Available to you” (B3-02 f4)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    await hubReady();
    expect(main()).toHaveTextContent('No licence is available for you on ACC-0107 right now.');
    expect(main()).not.toHaveTextContent('Next step');
    expect(main().querySelectorAll('.xw-scard a')).toHaveLength(0);
  }, 30_000);

  it('nextStepOf follows the real position only', () => {
    const hub = (
      formats: readonly (readonly [string, string, string])[],
      opened = 0,
      closure: unknown = null,
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
      }) as never;
    const both = (web: string, vr: string) =>
      [
        ['web', 'available-to-you', web],
        ['vr', 'available-to-you', vr],
      ] as const;
    expect(nextStepOf(hub(both('not-started', 'not-started')), null)).toBe('open-resources');
    expect(nextStepOf(hub(both('in-progress', 'not-started'), 1), null)).toBe('continue-web');
    expect(nextStepOf(hub(both('not-started', 'not-started'), 1), null)).toBe('choose-format');
    expect(nextStepOf(hub(both('completed', 'in-progress'), 1), null)).toBe('choose-format');
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

// ---- ST-06 Resources (B3-01 f0 … f7) --------------------------------------------------------

describe('ST-06 Resources', () => {
  it('first visit: the compact header, Resources current, three rows not opened yet (B3-01 f2)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    await hubReady();
    const head = main().querySelector('.xw-hubhead')!;
    expect(head).toHaveClass('xr-dark', 'xl-hubhead');
    expect(head.querySelector('p')).toBeNull();
    expect(head.querySelector('.xr-overline')).toHaveTextContent(
      'MEC-523 · Thermodynamics & Heat Transfer',
    );
    expect(tabStrip()).toEqual(stripWith('Resources'));
    const section = await screen.findByRole('region', { name: 'Resources' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('3 resources');
    const rows = [...section.querySelectorAll<HTMLElement>('li.xr-row')];
    expect(rows.map((row) => row.querySelector('.xr-row-title')?.textContent)).toEqual([
      BRIEF,
      'Pre-lab reading — the effectiveness–NTU method',
      'Readings sheet',
    ]);
    expect(rows.map((row) => row.querySelector('.xr-row-sub')?.textContent)).toEqual([
      'PDF document · 6 pages',
      'Web page · About 10 minutes',
      'Spreadsheet · 1 sheet',
    ]);
    for (const row of rows) expect(row).toHaveTextContent('Not opened yet');
    expect(
      within(rows[0]!).getByRole('button', { name: `Open ${BRIEF} in a new tab` }),
    ).toHaveTextContent('Open');
    await waitFor(() => expect(topTitle()).toHaveTextContent('Resources'));
    expect(crumbs()).toEqual([
      ['My courses', '/student/courses'],
      ['MEC-523', COURSE],
      [SHELL_NAME, HUB],
      ['Resources', null],
    ]);
  });

  it('Open: “Opening…”, the link in a new tab, “Opened in a new tab just now” — and no progress (B3-01 f0; T-13)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const open = await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` });
    await user.click(open);
    const row =
      open.closest('li') ??
      screen.getAllByRole('listitem').find((li) => li.textContent?.includes(BRIEF))!;
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent('Opened in a new tab just now'),
    );
    expect(opened).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledWith('', '_blank');
    // The new page gets no handle on this one; the tab gets the resource's link.
    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledTimes(1);
    expect(String(tab.location.replace.mock.calls[0]![0]).length).toBeGreaterThan(0);
    expect(tab.close).not.toHaveBeenCalled();
    expect(row).toBeDefined();
    // The service keeps the first opening; nothing else changes (T-13).
    const list = await runtime.ports.learning.listResources(SHELL as never);
    expect(
      list.ok && list.value.find((entry) => entry.resource.id === 'res-shell-brief')?.openedAt,
    ).toBeTruthy();
    const chooser = await runtime.ports.learning.getSimulationChooser(SHELL as never);
    expect(chooser.ok && chooser.value.map((view) => view.status)).toEqual(
      chooser.ok ? chooser.value.map(() => 'not-started') : [],
    );
  });

  it('couldn’t open: said in words, nothing lost; “Try again” opens it (B3-01 f1)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const open = await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` });
    faults(sample).failNext('LearningService.openResource');
    await user.click(open);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('It didn’t open. Nothing was lost — try again.');
    // The blank tab opened in the click is closed again; it never got a link.
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toContainElement(alert));
    await user.click(screen.getByRole('button', { name: `Try opening ${BRIEF} again` }));
    await waitFor(() =>
      expect(document.activeElement).toHaveTextContent('Opened in a new tab just now'),
    );
    expect(opened).toHaveBeenCalledTimes(2);
    expect(tab.location.replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a browser that refuses the new tab: “It didn’t open”, never “Opened” (review finding 1)', async () => {
    opened.mockImplementation(() => null);
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'It didn’t open. Nothing was lost — try again.',
    );
    expect(screen.queryByText('Opened in a new tab just now')).toBeNull();
  });

  it('after Flow C: the lab brief reads the first opening the service kept (B3-01 f0)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    const rows = section.querySelectorAll('li.xr-row');
    expect(rows[0]).toHaveTextContent('Opened 12 Oct 2026, 09:40');
    expect(rows[1]).toHaveTextContent('Not opened yet');
  });

  it('none attached: the empty state, and the other tabs don’t wait (B3-01 f3)', async () => {
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
      level: 2,
      name: 'No resources are attached to this experiment yet',
    });
    expect(title.closest('.xr-empty')).toHaveTextContent(
      'When resources are added, they appear here. The simulation and its other tabs don’t depend on them.',
    );
    expect(tabStrip()).toEqual(stripWith('Resources'));
  });

  it('loading is announced; the list failed says nothing changed; “Try again” reads again (B3-01 f4, f5)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.listResources');
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load the resources' });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    // The header and the tabs stay (f5).
    expect(tabStrip()).toEqual(stripWith('Resources'));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('button', { name: `Open ${BRIEF} in a new tab` })).toBeVisible();
  });

  it('the list loading frame: the label in a status region (B3-01 f4)', async () => {
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
    const status = await screen.findByText('Loading resources');
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('.xr-table-wrap')).toHaveAttribute('aria-busy', 'true');
    release();
    expect(await screen.findByRole('region', { name: 'Resources' })).toBeVisible();
  });

  it('paused: listed, not openable — the Paused chip in place of Open (B3-01 f6)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    await waitFor(() => expect(section.querySelectorAll('.xr-status--paused')).toHaveLength(3));
    expect(within(section).queryByRole('button')).toBeNull();
    expect(section).not.toHaveTextContent('Not opened yet');
    const formats = screen.getByRole('list', { name: 'Formats for you' });
    expect(formats).toHaveTextContent('WEBPaused');
  });

  it('a licence wait: listed, not openable, said in words (`ST-06.closed`)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' }, { timeout: 5000 });
    expect(section.querySelectorAll('.xr-status--wait')).toHaveLength(3);
    expect(section).toHaveTextContent('Waiting for a licence');
    expect(within(section).queryByRole('button')).toBeNull();
  }, 30_000);

  it('a withdrawn grant: the tab is ST-19 “no longer given”, placed “My courses / Not available”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment is no longer given to you',
      }),
    ).toBeVisible();
    await waitFor(() => expect(topTitle()).toHaveTextContent('Not available'));
  });
});

// ---- ST-07 Simulation — choose a format (B3-02 f0 … f7) -------------------------------------

/** The chooser's rows as [code, meta, status, actions as "words → href"]. */
function chooserRows() {
  const section = screen.getByRole('region', { name: 'Choose a format' });
  return [...section.querySelectorAll<HTMLElement>('li.xl-frow')].map((row) => [
    row.querySelector('.xl-frow-title')?.textContent,
    row.querySelector('.xl-frow-meta')?.textContent ?? null,
    row.querySelector('.xr-status')?.textContent,
    [...row.querySelectorAll('.xl-frow-end > a, .xl-frow-end > .xl-inline')].map((node) =>
      node.tagName === 'A'
        ? `${node.textContent} → ${node.getAttribute('href')}${node.classList.contains('xr-btn--primary') ? ' (primary)' : ''}`
        : node.textContent,
    ),
  ]);
}

const AR_ROW = [
  'AR',
  'Published for this experiment; your institution’s access doesn’t include it.',
  'Not included for your institution',
  [],
];
const MR_ROW = [
  'MR',
  'This experiment isn’t made for MR.',
  'Not available for this experiment',
  [],
];

describe('ST-07 Simulation — choose a format', () => {
  it('first visit: one row per format, one status, one action; Open WEB the one primary (B3-02 f1)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('region', { name: 'Choose a format' }, { timeout: 5000 });
    expect(main()).toHaveTextContent(
      'Formats come from your institution’s access. Each one has its own progress.',
    );
    expect(tabStrip()).toEqual(stripWith('Simulation'));
    expect(chooserRows()).toEqual([
      [
        'WEB',
        'Opens in your browser',
        'Not started',
        [`Open WEB → ${HUB}/simulation/web (primary)`],
      ],
      ['VR', 'Needs a VR headset', 'Not started', [`Open VR → ${HUB}/simulation/vr`]],
      AR_ROW,
      MR_ROW,
    ]);
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
    await waitFor(() => expect(topTitle()).toHaveTextContent('Simulation'));
  });

  it('WEB in progress with its last save: Continue WEB (B3-02 f0; B3-12 f0)', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('region', { name: 'Choose a format' }, { timeout: 5000 });
    expect(chooserRows().slice(0, 2)).toEqual([
      [
        'WEB',
        'Last saved 12 Oct 2026, 11:20',
        'In progress',
        [`Continue WEB → ${HUB}/simulation/web (primary)`],
      ],
      ['VR', 'Needs a VR headset', 'Not started', [`Open VR → ${HUB}/simulation/vr`]],
    ]);
  });

  it('WEB completed: Give feedback on WEB only on WEB, its own completion (B3-02 f2; BC5)', async () => {
    const { runtime } = await webCompleted();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('link', { name: 'Give feedback on WEB' }, { timeout: 5000 });
    expect(chooserRows().slice(0, 2)).toEqual([
      [
        'WEB',
        null,
        'Completed 14 Oct 2026',
        [`Give feedback on WEB → ${HUB}/feedback/web`, `Open WEB → ${HUB}/simulation/web`],
      ],
      ['VR', 'Needs a VR headset', 'Not started', [`Open VR → ${HUB}/simulation/vr`]],
    ]);
    expect(main().querySelector('.xr-btn--primary')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Give feedback on VR' })).toBeNull();
  });

  it('both completed, feedback sent: no experiment-level “completed” (B3-02 f3)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByText('Feedback sent 20 Oct 2026', undefined, { timeout: 5000 });
    expect(chooserRows()).toEqual([
      [
        'WEB',
        null,
        'Completed 14 Oct 2026',
        ['Feedback sent 14 Oct 2026', `Open WEB → ${HUB}/simulation/web`],
      ],
      [
        'VR',
        null,
        'Completed 20 Oct 2026',
        ['Feedback sent 20 Oct 2026', `Open VR → ${HUB}/simulation/vr`],
      ],
      AR_ROW,
      MR_ROW,
    ]);
    expect(screen.queryByRole('link', { name: /Give feedback/ })).toBeNull();
    expect(main()).not.toHaveTextContent(/experiment completed|%/i);
  });

  it('launching WEB stores nothing: still Not started until the runtime reports (T-12, AD-16)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const launched = await runtime.ports.learning.launchWebFormat({ experimentId: SHELL as never });
    expect(launched.ok).toBe(true);
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('region', { name: 'Choose a format' }, { timeout: 5000 });
    expect(chooserRows()[0]?.[2]).toBe('Not started');
  });

  it('waiting for a licence: the reason in words, no counting, nothing opens (B3-02 f4)', async () => {
    const { runtime } = await fatima();
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('region', { name: 'Choose a format' }, { timeout: 5000 });
    const waiting = 'No licence is available for you on ACC-0107 right now.';
    expect(chooserRows()).toEqual([
      ['WEB', waiting, 'Waiting for a licence', []],
      ['VR', waiting, 'Waiting for a licence', []],
      AR_ROW,
      MR_ROW,
    ]);
    expect(screen.getByRole('list', { name: 'Formats for you' })).toHaveTextContent(
      'WEBAvailable to you',
    );
  }, 30_000);

  it('paused: rows stay, nothing opens, progress kept (B3-02 f5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    await screen.findByRole('region', { name: 'Choose a format' }, { timeout: 5000 });
    await waitFor(() => expect(chooserRows()[0]?.[2]).toBe('Paused'));
    const paused =
      'Not available while your institution’s access is paused. Your progress is kept.';
    expect(chooserRows()).toEqual([
      ['WEB', paused, 'Paused', []],
      ['VR', paused, 'Paused', []],
      AR_ROW,
      MR_ROW,
    ]);
  });

  it('the progress read failed: said so, with Try again (`ST-07.failed`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getSimulationChooser');
    inStudent(runtime, `${HUB}/simulation`, <SimulationChooser experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load the formats' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'Choose a format' })).toBeVisible();
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
    expect(screen.getByRole('list', { name: 'Formats for you' })).toHaveTextContent('WEBInactive');
    expect(main()).not.toHaveTextContent('Next step');
    expect(main().querySelectorAll('.xw-scard a')).toHaveLength(0);
    hub.unmount();

    const resources = inStudent(runtime, `${HUB}/resources`, <Resources experimentId={SHELL} />);
    const section = await screen.findByRole('region', { name: 'Resources' });
    expect(section.querySelectorAll('.xr-status--off')).toHaveLength(3);
    expect(within(section).queryByRole('button')).toBeNull();
    resources.unmount();

    const chooser = inStudent(
      runtime,
      `${HUB}/simulation`,
      <SimulationChooser experimentId={SHELL} />,
    );
    await screen.findByRole('region', { name: 'Choose a format' });
    const inactive = 'Not available while your account is inactive. Your progress is kept.';
    expect(chooserRows()).toEqual([
      ['WEB', inactive, 'Inactive', []],
      ['VR', inactive, 'Inactive', []],
      AR_ROW,
      MR_ROW,
    ]);
    chooser.unmount();

    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Progress by format' });
    expect(progressRows().slice(0, 2)).toEqual([
      ['WEBWEB', 'Not started', [], ''],
      ['VRVR', 'Not started', [], ''],
    ]);
  }, 30_000);
});

// ---- ST-10 Progress for this experiment (B3-01 f8 … f12) -------------------------------------

/** The Progress tab's rows as [code, state words, action words → href]. */
function progressRows() {
  const list = screen.getByRole('list', { name: 'Progress by format' });
  return [...list.querySelectorAll<HTMLElement>(':scope > li')].map((row) => [
    row.querySelector('.xl-fl-fmt')?.textContent,
    row.querySelector('.xl-fl-state')?.textContent,
    [...row.querySelectorAll('.xl-fl-act > *')].map((node) =>
      node.tagName === 'A'
        ? `${node.textContent} → ${node.getAttribute('href')}${node.classList.contains('xr-btn') ? ' (button)' : ''}`
        : node.textContent,
    ),
    row.className,
  ]);
}

const AR_PROGRESS = ['ARAR', 'Not included for your institution', [], 'is-off'];
const MR_PROGRESS = ['MRMR', 'Not available for this experiment', [], 'is-off'];
const NO_ASSESSMENT = 'Your faculty hasn’t set an assessment for this experiment yet.';

describe('ST-10 Progress for this experiment', () => {
  it('first visit: one row per format, the assessment in words, no verdict', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Progress by format' }, { timeout: 5000 });
    expect(tabStrip()).toEqual(stripWith('Progress'));
    expect(screen.getByRole('region', { name: 'Your progress, format by format' })).toBeVisible();
    expect(progressRows()).toEqual([
      ['WEBWEB', 'Not started', [`Open WEB → ${HUB}/simulation/web`], ''],
      ['VRVR', 'Not started', [`Open VR → ${HUB}/simulation/vr`], ''],
      AR_PROGRESS,
      MR_PROGRESS,
    ]);
    const assessment = screen.getByRole('region', { name: 'Assessment' });
    expect(assessment).toHaveTextContent(NO_ASSESSMENT);
    expect(within(assessment).queryByRole('link')).toBeNull();
    expect(main()).not.toHaveTextContent('%');
    await waitFor(() => expect(topTitle()).toHaveTextContent('Progress'));
  });

  it('WEB in progress with its last save (B3-01 f9)', async () => {
    const { runtime } = await webInProgress();
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Progress by format' }, { timeout: 5000 });
    expect(progressRows()[0]).toEqual([
      'WEBWEB',
      'In progressLast saved 12 Oct 2026, 11:20',
      [`Continue WEB → ${HUB}/simulation/web`],
      '',
    ]);
  });

  it('WEB completed, reported by the simulation → Give feedback on WEB; VR not started (B3-01 f8)', async () => {
    const { runtime } = await webCompleted();
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByRole('link', { name: 'Give feedback on WEB' }, { timeout: 5000 });
    expect(progressRows().slice(0, 2)).toEqual([
      [
        'WEBWEB',
        'Completed 14 Oct 2026',
        [`Give feedback on WEB → ${HUB}/feedback/web (button)`],
        '',
      ],
      ['VRVR', 'Not started', [`Open VR → ${HUB}/simulation/vr`], ''],
    ]);
  });

  it('both completed, feedback sent: still no “experiment completed” (B3-01 f10; B3-12 f2)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByText('Feedback sent 20 Oct 2026', undefined, { timeout: 5000 });
    expect(progressRows()).toEqual([
      ['WEBWEB', 'Completed 14 Oct 2026', ['Feedback sent 14 Oct 2026'], ''],
      ['VRVR', 'Completed 20 Oct 2026', ['Feedback sent 20 Oct 2026'], ''],
      AR_PROGRESS,
      MR_PROGRESS,
    ]);
    expect(main()).not.toHaveTextContent(/experiment completed|%/i);
  });

  it('VR completed, its feedback not sent: Give feedback on VR only (B3-01 f12)', async () => {
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
    await screen.findByRole('link', { name: 'Give feedback on VR' }, { timeout: 5000 });
    expect(progressRows().slice(0, 2)).toEqual([
      ['WEBWEB', 'Completed 14 Oct 2026', [expect.stringMatching(/^Feedback sent /)], ''],
      ['VRVR', 'Completed 20 Oct 2026', [`Give feedback on VR → ${HUB}/feedback/vr (button)`], ''],
    ]);
  });

  it('paused: progress kept, shown as before the pause, no action (B3-01 f11)', async () => {
    const { runtime, sample } = await webCompleted();
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    await screen.findByRole('list', { name: 'Progress by format' }, { timeout: 5000 });
    await waitFor(() => expect(progressRows()[0]?.[1]).toMatch(/^Paused/));
    expect(progressRows()).toEqual([
      ['WEBWEB', 'PausedCompleted 14 Oct 2026 before the pause', [], ''],
      ['VRVR', 'PausedNot started before the pause', [], ''],
      AR_PROGRESS,
      MR_PROGRESS,
    ]);
  });

  it('the progress read failed: said so, with Try again; the assessment still shows (`ST-10.failed`)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getSimulationChooser');
    inStudent(runtime, `${HUB}/progress`, <ExperimentProgress experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load your progress' }),
    ).toBeVisible();
    expect(screen.getByRole('region', { name: 'Assessment' })).toHaveTextContent(NO_ASSESSMENT);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list', { name: 'Progress by format' })).toBeVisible();
  });
});

// ---- the registers ---------------------------------------------------------------------------

describe('the hub’s registers', () => {
  it('every hub action in the ledger reaches a built page, or names the unbuilt Phase-4 screen', () => {
    const mine = LINK_TARGET_LEDGER.filter((entry) =>
      ['ST-05', 'ST-06', 'ST-07', 'ST-10'].includes(entry.screen),
    );
    expect(new Set(mine.map((entry) => entry.screen))).toEqual(
      new Set(['ST-05', 'ST-06', 'ST-07', 'ST-10']),
    );
    for (const entry of mine) {
      if (entry.target === null) continue;
      const target = expandTarget(entry.target, '/student');
      const kind = resolveAddress(target).kind;
      if (entry.outcome === 'built') {
        expect(['screen', 'record-screen'], `${entry.screen} ${entry.action}`).toContain(kind);
      } else {
        expect(entry.outcome).toBe('not-rendered');
        expect(entry.note).toMatch(/ST-11 .*not built \(Phase 4\)/);
        expect(kind).toBe('workspace-not-found');
      }
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
