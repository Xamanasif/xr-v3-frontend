/**
 * The Student's format pages, on the real composition root and the sample world, as the V3 Student
 * export draws them (ST-v1 `StudentFinal.dc.html`, `fpageVM`, `msg('ar' | 'mr')`): ST-08 WEB
 * simulation and ST-09 AR / VR / MR. Every status, date, device and offer is the ports' answer for
 * the signed-in Student; runtime activity and completion come only from the sample runtime's own
 * report (`standinsOf(sample).runtimeReport`, the system writer), never from the page: a launch,
 * a visit or feedback writes neither (AD-16, BC3, T-12). No stage is drawn (lead decision 1) and
 * no record reference (lead decision 3).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExperimentId, PersonId } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { WebSimulation } from './st-08-web-simulation/web-simulation';
import { FormatPage } from './st-09-format/format-page';

/**
 * Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces (in a string, or in each string of a row).
 */
function plain<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\u00a0/g, ' ') as T;
  if (Array.isArray(value)) return value.map((item: unknown) => plain(item)) as T;
  return value;
}

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const RAHUL = 'per-0002';
const ARUN = 'per-0004';
const SNEHA = 'per-0005';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const SIMULATION = `/student/experiments/${SHELL}/simulation`;
const WEB = `${SIMULATION}/web`;
const WEB_LINK = 'https://labs.example/shell-and-tube-heat-exchanger';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inStudent(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
/** The page's breadcrumbs (`nav.rk-crumbs`) as [words, href] — the current one without a link. */
const crumbs = () =>
  [
    ...screen
      .getByRole('navigation', { name: 'Breadcrumb' })
      .querySelectorAll('a, [aria-current="page"]'),
  ].map((item) => [item.textContent?.trim(), item.getAttribute('href')]);
/** The launch surface (`section.sv-card.sv-launch`, named by its title). */
const launch = () => main().querySelector<HTMLElement>('section.sv-launch')!;
/** The head's status pill (`div.rk-meta span.xr-st`) and its line. */
const pill = () => main().querySelector('.rk-head .rk-meta .xr-st');
const headLine = () => main().querySelector('.rk-head .rk-meta > span:not(.xr-st)')?.textContent;
const linksOf = (element: HTMLElement) =>
  within(element)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]);
const HUB_ADDRESS = `/student/experiments/${SHELL}`;
const CRUMBS = (code: string) => [
  [SHELL_NAME, HUB_ADDRESS],
  ['Simulation', SIMULATION],
  [code, null],
];

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

/** The page's title and the launch surface's title (`h1.rk-title`, `h2.sv-sec-t`). */
async function launchTitle(name: string) {
  return screen.findByRole('heading', { level: 2, name }, { timeout: 5000 });
}

/** The sample runtime's own report (system writer), then the page's reads refresh. */
async function report(
  sample: Sample,
  runtime: PlatformRuntime,
  format: 'web' | 'vr',
  kind: 'opened' | 'saved' | 'session' | 'completed',
) {
  const standins = standinsOf(sample);
  const base = {
    studentId: RAHUL as PersonId,
    experimentId: SHELL as ExperimentId,
    format,
    at: standins.clock.now(),
  };
  const answer =
    kind === 'completed'
      ? standins.runtimeReport.reportCompletion({
          ...base,
          from: format === 'web' ? 'simulation' : 'headset',
        })
      : standins.runtimeReport.reportActivity({ ...base, kind });
  if (!answer.ok) throw new Error(`report refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

/** The Super Admin pauses Godavari through the port; `refresh` = the tab's reads refresh too. */
async function pauseGodavari(sample: Sample, runtime: PlatformRuntime, refresh = true) {
  const admin = asPersonId(sample, SUPER_ADMIN).institutions;
  const found = await admin.getInstitution('godavari' as never);
  if (!found.ok) throw new Error('getInstitution refused');
  const answer = await admin.pauseInstitution({
    institutionId: found.value.institution.id,
    reason: 'The institution asked us to pause access while it checks its student list.',
    expectedRev: found.value.institution.rev,
  });
  if (!answer.ok) throw new Error(`pause refused: ${answer.error.kind}`);
  if (refresh) {
    await act(async () => {
      await runtime.invalidate(answer.changed);
    });
  }
}

/** What the world holds for Rahul's WEB now, read through his own port. */
async function webProgress(runtime: PlatformRuntime) {
  const answer = await runtime.ports.learning.getFormatPage({
    experimentId: SHELL as ExperimentId,
    format: 'web',
  });
  if (!answer.ok) throw new Error(`getFormatPage refused: ${answer.error.kind}`);
  return answer.value.progress;
}

// ---- ST-08 WEB simulation ---------------------------------------------------------------------

/** The blank tab ST-08 opens in the click (`openPendingTab`), then points at the link or closes. */
function fakeTab() {
  return { opener: window as unknown, location: { replace: vi.fn() }, close: vi.fn() };
}

describe('ST-08 WEB simulation — Rahul after Flow B, nothing opened', () => {
  it('Not started: the head, one launch surface with one large action, About WEB; no stage', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(await launchTitle('Start the WEB simulation')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'WEB simulation',
    ]);
    const eyebrow = main().querySelector('.rk-head .st-eyecode')!;
    expect(eyebrow.querySelector('.xr-fmt')).toHaveClass('sv-fmt', 'sv-fmt--on');
    expect(eyebrow).toHaveTextContent(`WEB${SHELL_NAME}`);
    expect(pill()).toHaveTextContent('Not started');
    expect(pill()?.className).toBe('xr-st');
    expect(headLine()).toBeUndefined();
    const web = launch();
    expect(web).toBe(screen.getByRole('region', { name: 'Start the WEB simulation' }));
    expect(web).toHaveTextContent('Runs in your browser in a new tab. This page keeps your place.');
    expect(within(web).getByRole('button', { name: 'Launch WEB' })).toHaveAccessibleDescription(
      'Opens in a new tab',
    );
    expect(within(web).getAllByRole('button')).toHaveLength(1);
    expect(linksOf(web)).toEqual([['Report a problem', '/student/help/report']]);
    expect(web).toHaveTextContent(
      'Something not working? Reporting it doesn’t affect your progress.',
    );
    expect(crumbs()).toEqual(CRUMBS('WEB'));
    const about = screen.getByRole('complementary', { name: 'About WEB' });
    expect(about).toHaveTextContent('NeedsA laptop or desktop with a current web browser');
    expect(about).toHaveTextContent(
      'In this prototypeA simulated sample activity stands in for the real simulation.',
    );
    expect(about).toHaveTextContent(
      'Completed meansThe simulation reports that you finished and the platform records it. You can’t mark it yourself.',
    );
    await waitFor(() => expect(document.title).toContain('WEB simulation'));
    // No self-report, no timer, no runtime page (T-12, TE-3), no stage (lead decision 1).
    expect(main()).not.toHaveTextContent(/I have finished|Mark as complete|stage/i);
    expectNoReferences();
  });

  it('Launch WEB runs the command, opens the WEB link in a new tab and stores nothing (AD-16)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Launch WEB' }));
    const opened = await screen.findByText(
      'The simulation opened in a new tab. Come back here any time to continue.',
    );
    // A blank tab in the click's own task, detached, then pointed at the published WEB link.
    expect(open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBeNull();
    expect(tab.location.replace).toHaveBeenCalledWith(WEB_LINK);
    const notice = opened.closest('.rk-notice');
    expect(notice).toHaveClass('rk-notice--ok');
    expect(notice).toHaveAttribute('role', 'status');
    await waitFor(() => expect(notice).toHaveFocus());
    // The status stays as the service reports it: the launch wrote no activity, no completion.
    expect(pill()).toHaveTextContent('Not started');
    expect(screen.getByRole('button', { name: 'Launch WEB' })).toBeVisible();
    expect(await webProgress(runtime)).toMatchObject({
      status: 'not-started',
      activity: null,
      completion: null,
    });
  });

  it('the launch fails for now → “didn’t open”, nothing lost, Try again opens it', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    const user = userEvent.setup();
    faults(sample).failNext('LearningService.launchWebFormat');
    await user.click(await screen.findByRole('button', { name: 'Launch WEB' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('rk-notice', 'rk-notice--warn', 'sv-launch-err');
    expect(alert).toHaveTextContent('The simulation didn’t open');
    expect(alert).toHaveTextContent(
      'Nothing was lost. Try again, or report a problem if it keeps happening.',
    );
    await waitFor(() => expect(alert).toHaveFocus());
    // The blank tab opened in the click is closed: it never got the link.
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByText(
        'The simulation opened in a new tab. Come back here any time to continue.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(open).toHaveBeenCalledTimes(2);
    expect(tab.location.replace).toHaveBeenCalledWith(WEB_LINK);
    expect(screen.getByRole('button', { name: 'Launch WEB' })).toBeVisible();
  });

  it('a browser that blocks the new tab (no window) reads as “didn’t open”, never “opened” (review finding 1)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    vi.spyOn(window, 'open').mockReturnValue(null);
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Launch WEB' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The simulation didn’t open');
    expect(
      screen.queryByText(
        'The simulation opened in a new tab. Come back here any time to continue.',
      ),
    ).toBeNull();
  });

  it('a browser that refuses the new tab (the open throws) reads as “didn’t open”', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    vi.spyOn(window, 'open').mockImplementation(() => {
      throw new Error('blocked');
    });
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Launch WEB' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The simulation didn’t open');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('a refused launch (paused since the page was read) → “didn’t open”, then the page reads Paused', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    const button = await screen.findByRole('button', { name: 'Launch WEB' });
    await pauseGodavari(sample, runtime, false);
    await userEvent.setup().click(button);
    expect(await launchTitle('You can’t open the simulation right now')).toBeVisible();
    // The refused launch got no link: its blank tab is closed.
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Launch WEB|Try again/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — runtime reports', () => {
  it('In progress only from the runtime’s activity: “First opened”, then “Last saved”, Continue WEB', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await launchTitle('Start the WEB simulation');
    await report(sample, runtime, 'web', 'opened');
    expect(await launchTitle('Continue where you left off')).toBeVisible();
    expect(pill()).toHaveClass('xr-st--warn');
    expect(pill()).toHaveTextContent('In progress');
    expect(plain(headLine())).toBe('First opened 12 Oct 2026, 09:40');
    expect(within(launch()).getByRole('button', { name: 'Continue WEB' })).toBeVisible();
    await report(sample, runtime, 'web', 'saved');
    await waitFor(() => expect(plain(headLine())).toBe('Last saved 12 Oct 2026, 09:40'));
    expect(main()).not.toHaveTextContent('First opened');
    expect(main()).not.toHaveTextContent(/stage/i);
  });

  it('Completed only with the completion record → Give feedback on WEB (eligible); no launch', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await launchTitle('Start the WEB simulation');
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    expect(await launchTitle('You’ve completed WEB')).toBeVisible();
    expect(pill()).toHaveClass('xr-st--ok');
    expect(pill()).toHaveTextContent('Completed 12 Oct 2026');
    expect(headLine()).toBe('Reported by the simulation at 09:40');
    const web = launch();
    expect(web).toHaveTextContent(
      'Tell us how this format worked for you. It takes about two minutes.',
    );
    const give = within(web).getByRole('link', { name: 'Give feedback on WEB' });
    expect(give).toHaveClass('rb-btn--primary', 'rb-btn--lg');
    expect(give).toHaveAttribute('href', `/student/experiments/${SHELL}/feedback/web`);
    expect(within(web).queryByRole('button')).toBeNull();
  });

  it('another format’s completion offers nothing on WEB (feedback is per format, BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await launchTitle('Start the WEB simulation');
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    expect(pill()).toHaveTextContent('Not started');
    expect(screen.queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — after Flow C, WEB completed 14 Oct and feedback sent', () => {
  it('the thank-you line and “See your feedback” (read-only); no Give feedback', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(await launchTitle('You’ve completed WEB')).toBeVisible();
    expect(pill()).toHaveTextContent('Completed 14 Oct 2026');
    expect(headLine()).toBe('Reported by the simulation at 15:30');
    const web = launch();
    expect(web).toHaveTextContent('Thank you — your feedback on WEB is recorded.');
    const see = within(web).getByRole('link', { name: 'See your feedback' });
    expect(see.className).toBe('rb-btn');
    expect(see).toHaveAttribute('href', `/student/experiments/${SHELL}/feedback/web`);
    expect(within(web).queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — closed states and refusals', () => {
  it('paused: “You can’t open the simulation right now”, progress kept, no launch', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await launchTitle('Start the WEB simulation');
    await pauseGodavari(sample, runtime);
    expect(await launchTitle('You can’t open the simulation right now')).toBeVisible();
    expect(pill()).toHaveClass('xr-st--paused');
    expect(pill()).toHaveTextContent('Paused');
    expect(main().querySelector('.rk-head .xr-fmt')).toHaveClass('sv-fmt--held');
    expect(launch()).toHaveTextContent('You can start WEB when access resumes.');
    expect(screen.queryByRole('button', { name: /Launch|Continue/ })).toBeNull();
    expect(within(launch()).getByRole('link', { name: 'Report a problem' })).toBeVisible();
    expect(screen.getByRole('complementary', { name: 'About WEB' })).toBeVisible();
  });

  it('a supplied licence wait: Arun, later sample — “Not available to you yet”, no plan named', async () => {
    const { runtime } = await tabPlatform(ARUN, 'later-sample');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(await launchTitle('Not available to you yet')).toBeVisible();
    expect(pill()).toHaveTextContent('Waiting for a licence');
    expect(launch()).toHaveTextContent(
      'No licence is available for you right now. Your institution can tell you more.',
    );
    expect(within(main()).queryByRole('button', { name: /Launch|Continue/ })).toBeNull();
    expectNoReferences();
  });

  it('an experiment not given → ST-19 in place (“Not available”)', async () => {
    const { runtime } = await tabPlatform(SNEHA, 'after-flow-c');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment isn’t available to you',
      }),
    ).toBeVisible();
    await waitFor(() => expect(document.title).toBe('Not available · XR Learning Platform'));
  });

  it('loading is announced; a failed read says nothing changed, and Try again reads again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getFormatPage');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(await screen.findByText('Loading the WEB simulation')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('heading', {
      name: 'We couldn’t load the WEB simulation',
    });
    const message = failed.closest('.sv-msg')!;
    expect(message).toHaveAttribute('role', 'alert');
    expect(message).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await launchTitle('Start the WEB simulation')).toBeVisible();
  });
});

// ---- ST-09 AR / VR / MR format ----------------------------------------------------------------

const VR = `${SIMULATION}/vr`;
const setupToggle = () => within(launch()).queryByRole('button', { name: /setup steps/ });

describe('ST-09 VR format — Rahul after Flow B', () => {
  it('Not started: “Set up VR”, the authorised headset, the steps open; no launch button', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await launchTitle('Set up VR')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'VR on your headset',
    ]);
    expect(pill()).toHaveTextContent('Not started');
    const vr = launch();
    expect(vr).toHaveTextContent(
      'Nothing has been reported from a headset yet. Follow the setup steps to start.',
    );
    expect(vr.querySelector('.sv-launch-dev')).toHaveTextContent('Your authorised headset');
    expect(vr.querySelector('.sv-launch-devname')).toHaveTextContent(
      'ME lab VR headset, asset tag GIT-VR-03',
    );
    expect(linksOf(vr)).toEqual([
      ['My device', '/student/device'],
      ['Report a problem', '/student/help/report'],
    ]);
    // Information only (T-14): the one button is the setup steps' disclosure, open the first time.
    expect(within(main()).getAllByRole('button')).toEqual([setupToggle()]);
    expect(setupToggle()).toHaveAccessibleName('Hide setup steps');
    expect(setupToggle()).toHaveAttribute('aria-expanded', 'true');
    const steps = vr.querySelector('ol.sv-howto')!;
    expect(setupToggle()).toHaveAttribute('aria-controls', steps.id);
    expect([...steps.querySelectorAll(':scope > li')].map((item) => item.textContent)).toEqual([
      '1Use your authorised VR headset.It is shown under My device, in your account menu.',
      '2Open the Shell-and-Tube Heat Exchanger app on the headset.If you can’t find it, contact your institution administrator.',
      '3Work through the experiment on the headset.Your sessions are reported here, so this page shows where you are.',
      '4When the headset reports that you’ve finished, this page shows “Completed”.You can then give feedback on VR.',
    ]);
    await userEvent.setup().click(setupToggle()!);
    expect(setupToggle()).toHaveAccessibleName('View setup steps');
    expect(setupToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(vr.querySelector('ol.sv-howto')).toBeNull();
    const about = screen.getByRole('complementary', { name: 'About VR' });
    expect(about).toHaveTextContent('Runs onYour authorised VR headset, not in this browser');
    expect(about).toHaveTextContent('This page showsOnly what the headset reports');
    await waitFor(() => expect(document.title).toContain('VR on your headset'));
    expect(crumbs()).toEqual(CRUMBS('VR'));
    expectNoReferences();
  });

  it('In progress from the last reported session; the steps fold under “View setup steps”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await launchTitle('Set up VR');
    await report(sample, runtime, 'vr', 'session');
    expect(await launchTitle('Continue on your headset')).toBeVisible();
    expect(pill()).toHaveTextContent('In progress');
    expect(plain(headLine())).toBe('Last session reported 12 Oct 2026, 09:40');
    expect(launch()).toHaveTextContent(
      'Pick up where you left off on the headset. This page updates when the headset reports a session.',
    );
    expect(setupToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(launch().querySelector('ol.sv-howto')).toBeNull();
  });

  it('Completed, reported from the headset → Give feedback on VR; no steps', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await launchTitle('Set up VR');
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    expect(await launchTitle('You’ve completed VR')).toBeVisible();
    expect(pill()).toHaveTextContent('Completed 12 Oct 2026');
    expect(headLine()).toBe('Reported from the headset at 09:40');
    const vr = launch();
    expect(vr).toHaveTextContent('Tell us how this format worked for you.');
    expect(vr).not.toHaveTextContent('two minutes');
    expect(within(vr).getByRole('link', { name: 'Give feedback on VR' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/vr`,
    );
    expect(vr.querySelector('.sv-launch-devname')).toBeInTheDocument();
    expect(setupToggle()).toBeNull();
  });

  it('paused: “You can’t use VR right now”, no headset, no steps', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await launchTitle('Set up VR');
    await pauseGodavari(sample, runtime);
    expect(await launchTitle('You can’t use VR right now')).toBeVisible();
    expect(pill()).toHaveTextContent('Paused');
    const vr = launch();
    expect(vr).toHaveTextContent('You can start VR when access resumes.');
    expect(vr.querySelector('.sv-launch-dev')).toBeNull();
    expect(setupToggle()).toBeNull();
    expect(linksOf(vr)).toEqual([['Report a problem', '/student/help/report']]);
  });
});

describe('ST-09 after Flow C — VR completed 20 Oct, feedback sent', () => {
  it('the thank-you line and “See your feedback”; nothing more is offered', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await launchTitle('You’ve completed VR')).toBeVisible();
    expect(pill()).toHaveTextContent('Completed 20 Oct 2026');
    expect(headLine()).toBe('Reported from the headset at 11:15');
    const vr = launch();
    expect(vr).toHaveTextContent('Thank you — your feedback on VR is recorded.');
    expect(within(vr).getByRole('link', { name: 'See your feedback' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/vr`,
    );
    expect(within(vr).queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

/** The refusal's "Formats you can use" as [title, run, link → href]. */
function usable(card: Element) {
  return [...card.querySelectorAll('.sv-refuse-list > li')].map((item) => [
    item.querySelector('b')?.textContent,
    item.querySelector('.sv-refuse-row > span')?.textContent,
    `${item.querySelector('a')?.textContent} → ${item.querySelector('a')?.getAttribute('href')}`,
  ]);
}

describe('ST-09 AR and MR and the address', () => {
  it('AR: not included for the institution — the refusal card, the formats you can use, Back to Simulation', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${SIMULATION}/ar`, <FormatPage experimentId={SHELL} format="ar" />);
    const title = await screen.findByRole(
      'heading',
      { level: 1, name: 'AR isn’t included for your institution' },
      { timeout: 5000 },
    );
    const card = title.closest('.sv-refuse')!;
    expect(card.querySelector('.sv-refuse-k')).toHaveTextContent(`${SHELL_NAME} · Simulation`);
    expect(card).toHaveTextContent(
      'AR is published for this experiment, but your institution’s access includes WEB and VR only.',
    );
    expect(within(card as HTMLElement).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Formats you can use',
    );
    expect(usable(card)).toEqual([
      ['Browser (WEB)', 'Not started', `Open WEB → ${WEB}`],
      ['Virtual reality (VR)', 'Not started', `Open VR → ${VR}`],
    ]);
    const back = within(card as HTMLElement).getByRole('link', { name: 'Back to Simulation' });
    expect(back).toHaveAttribute('href', SIMULATION);
    expect(back).toHaveClass('rb-btn', 'rb-btn--lg');
    await waitFor(() => expect(document.title).toContain('AR format'));
    expect(crumbs()).toEqual(CRUMBS('AR'));
    expectNoReferences();
  });

  it('AR stays “not included” while the institution is paused', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${SIMULATION}/ar`, <FormatPage experimentId={SHELL} format="ar" />);
    const title = await screen.findByRole(
      'heading',
      { level: 1, name: 'AR isn’t included for your institution' },
      { timeout: 5000 },
    );
    // A held format leads with its hold.
    expect(usable(title.closest('.sv-refuse')!).map((row) => row[1])).toEqual(['Paused', 'Paused']);
  });

  it('MR: not published for this experiment — “made for WEB, AR and VR”', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${SIMULATION}/mr`, <FormatPage experimentId={SHELL} format="mr" />);
    const title = await screen.findByRole(
      'heading',
      { level: 1, name: 'This experiment isn’t available in MR' },
      { timeout: 5000 },
    );
    const card = title.closest('.sv-refuse')!;
    expect(card).toHaveTextContent('Shell-and-Tube Heat Exchanger is made for WEB, AR and VR.');
    expect(card.querySelector('.sv-refuse-ico')).toHaveClass('sv-refuse-ico--off');
    await waitFor(() => expect(document.title).toContain('MR format'));
  });

  it.each(['web', 'WEB', 'VR', 'xr', ''])(
    '“%s” has no format page (not found)',
    async (segment) => {
      const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
      inStudent(
        runtime,
        `${SIMULATION}/${segment}`,
        <FormatPage experimentId={SHELL} format={segment} />,
      );
      expect(
        await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
      ).toBeVisible();
    },
  );

  it('a supplied licence wait on VR: Arun, later sample', async () => {
    const { runtime } = await tabPlatform(ARUN, 'later-sample');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await launchTitle('Not available to you yet')).toBeVisible();
    expect(launch()).toHaveTextContent(
      'No licence is available for you right now. Your institution can tell you more.',
    );
    expect(setupToggle()).toBeNull();
    expectNoReferences();
  });

  it('a failed read: “We couldn’t load this format”, then Try again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getFormatPage');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await screen.findByText('Loading this format')).toHaveAttribute('role', 'status');
    await screen.findByRole('heading', { name: 'We couldn’t load this format' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await launchTitle('Set up VR')).toBeVisible();
  });

  it('visiting the format pages writes no activity and no completion (T-12)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await launchTitle('Set up VR');
    const answer = await runtime.ports.learning.getFormatPage({
      experimentId: SHELL as ExperimentId,
      format: 'vr',
    });
    expect(answer.ok && answer.value.progress).toMatchObject({
      status: 'not-started',
      activity: null,
      completion: null,
    });
  });
});
