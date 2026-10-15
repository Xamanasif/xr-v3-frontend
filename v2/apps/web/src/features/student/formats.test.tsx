/**
 * Phase 3, the Student's format pages, on the real composition root and the sample world: ST-08
 * WEB simulation (B3-03) and ST-09 AR / VR / MR format (B3-04). Every status, date, device and
 * offer is the ports' answer for the signed-in Student; runtime activity and completion come only
 * from the sample runtime's own report (`standinsOf(sample).runtimeReport`, the system writer),
 * never from the page: a launch, a visit or feedback writes neither (AD-16, BC3, T-12).
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
const topTitle = () => document.querySelector('.xr-top-title');
const crumbs = () =>
  [...document.querySelectorAll('.xr-crumbs li')].map((item) => item.textContent?.trim());
const panel = (name: string) => screen.getByRole('region', { name });
const linksOf = (element: HTMLElement) =>
  within(element)
    .getAllByRole('link')
    .map((link) => [link.textContent, link.getAttribute('href')]);

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

describe('ST-08 WEB simulation — Rahul after Flow B, nothing opened (B3-03 f1)', () => {
  it('Not started: status in words, one large action, About WEB; the top bar as drawn', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-overline')).toHaveTextContent('Simulation · WEB');
    expect(web.querySelector('.xr-fmt')).toHaveClass('xr-fmt--yours', 'xr-fmt--compact');
    expect(web.querySelector('.xr-status')).toHaveTextContent('Not started');
    expect(web.querySelector('.xr-status')).toHaveClass('xr-status--off');
    expect(web).toHaveTextContent('Needs a laptop or desktop with a current web browser');
    expect(within(web).getByRole('button', { name: 'Launch WEB' })).toHaveAccessibleDescription(
      'Opens in a new tab',
    );
    expect(within(web).getAllByRole('button')).toHaveLength(1);
    expect(linksOf(web)).toEqual([
      ['Report a problem', '/student/help/report'],
      ['Back to Simulation', SIMULATION],
    ]);
    // The back link names its destination (B3-03 f0).
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', SIMULATION);
    const about = screen.getByRole('region', { name: 'About WEB' });
    expect(about).toHaveTextContent(`Experiment${SHELL_NAME} · MEC-523`);
    expect(about).toHaveTextContent(
      'How it worksRuns in your browser in a new tab. This page keeps your place.',
    );
    expect(about).toHaveTextContent(
      'Completed meansThe simulation reports that you finished. You can’t mark it yourself.',
    );
    expect(topTitle()).toHaveTextContent('WEB simulation');
    expect(crumbs()).toEqual(['My courses/', `${SHELL_NAME}/`, 'Simulation/', 'WEB']);
    // No self-report, no timer, no runtime page (T-12, TE-3).
    expect(main()).not.toHaveTextContent(/I have finished|Mark as complete/);
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
    expect(opened.closest('.xr-notice')).toHaveClass('xr-notice--ok');
    expect(opened.closest('.xr-notice')).toHaveAttribute('role', 'status');
    await waitFor(() => expect(opened.closest('[tabindex="-1"]')).toHaveFocus());
    // The status stays as the service reports it: the launch wrote no activity, no completion.
    expect(panel('WEB simulation').querySelector('.xr-status')).toHaveTextContent('Not started');
    expect(screen.getByRole('button', { name: 'Launch WEB' })).toBeVisible();
    expect(await webProgress(runtime)).toMatchObject({
      status: 'not-started',
      activity: null,
      completion: null,
    });
  });

  it('the launch fails for now → “didn’t open”, nothing lost, Try again opens it (B3-03 f2)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    const user = userEvent.setup();
    faults(sample).failNext('LearningService.launchWebFormat');
    await user.click(await screen.findByRole('button', { name: 'Launch WEB' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('xr-notice--err');
    expect(alert).toHaveTextContent('The simulation didn’t open');
    expect(alert).toHaveTextContent(
      'Nothing was lost. Try again, or report a problem if it keeps happening.',
    );
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
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
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'You can’t open the simulation right now',
      }),
    ).toBeVisible();
    // The refused launch got no link: its blank tab is closed.
    expect(tab.location.replace).not.toHaveBeenCalled();
    expect(tab.close).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Launch WEB|Try again/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — runtime reports (B3-03 f0, f3; B3-12 f1)', () => {
  it('In progress only from the runtime’s activity: “First opened”, then “Last saved”, Continue WEB', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' });
    await report(sample, runtime, 'web', 'opened');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Continue where you left off' }),
    ).toBeVisible();
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    expect(web.querySelector('.xr-status')).toHaveTextContent('In progress');
    expect(web).toHaveTextContent('First opened 12 Oct 2026, 09:40');
    expect(within(web).getByRole('button', { name: 'Continue WEB' })).toBeVisible();
    await report(sample, runtime, 'web', 'saved');
    await waitFor(() => expect(web).toHaveTextContent('Last saved 12 Oct 2026, 09:40'));
    expect(web).not.toHaveTextContent('First opened');
  });

  it('Completed only with the completion record → Give feedback on WEB (eligible); no launch', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' });
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You’ve completed WEB' }),
    ).toBeVisible();
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expect(web.querySelector('.xr-status')).toHaveTextContent('Completed 12 Oct 2026');
    expect(web).toHaveTextContent('Reported by the simulation at 09:40');
    expect(web).toHaveTextContent(
      'Tell us how this format worked for you. It takes about two minutes.',
    );
    const give = within(web).getByRole('link', { name: 'Give feedback on WEB' });
    expect(give).toHaveClass('xr-btn--primary');
    expect(give).toHaveAttribute('href', `/student/experiments/${SHELL}/feedback/web`);
    expect(within(web).queryByRole('button')).toBeNull();
  });

  it('another format’s completion offers nothing on WEB (feedback is per format, BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' });
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    expect(panel('WEB simulation').querySelector('.xr-status')).toHaveTextContent('Not started');
    expect(screen.queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — after Flow C, WEB completed 14 Oct and feedback sent (B3-03 f4)', () => {
  it('“Feedback sent …”, the thank-you line and “See your feedback” (read-only); no Give feedback', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You’ve completed WEB' }),
    ).toBeVisible();
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-status')).toHaveTextContent('Completed 14 Oct 2026');
    expect(web).toHaveTextContent('Feedback sent 14 Oct 2026, 15:42');
    expect(web).not.toHaveTextContent('Reported by the simulation');
    expect(web).toHaveTextContent('Thank you — your feedback on WEB is recorded.');
    const see = within(web).getByRole('link', { name: 'See your feedback' });
    expect(see).toHaveClass('xr-btn--secondary');
    expect(see).toHaveAttribute('href', `/student/experiments/${SHELL}/feedback/web`);
    expect(within(web).queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

describe('ST-08 WEB simulation — closed states (B3-03 f5, f6) and refusals', () => {
  it('paused: “You can’t open the simulation right now”, progress kept, no launch (f5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' });
    await pauseGodavari(sample, runtime);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'You can’t open the simulation right now',
      }),
    ).toBeVisible();
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-status')).toHaveClass('xr-status--paused');
    expect(web.querySelector('.xr-status')).toHaveTextContent('Paused');
    expect(web).toHaveTextContent(
      'Your institution’s access is paused. Your progress is kept, and you can continue when it’s lifted.',
    );
    expect(screen.queryByRole('button', { name: /Launch|Continue/ })).toBeNull();
    // The text actions sit under the panel, as f5 draws them.
    expect(within(web).queryByRole('link', { name: 'Report a problem' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Report a problem' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'About WEB' })).toBeVisible();
  });

  it('a supplied licence wait: Arun, later sample — “Not available to you yet” (f6)', async () => {
    const { runtime } = await tabPlatform(ARUN, 'later-sample');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Not available to you yet' }),
    ).toBeVisible();
    const web = panel('WEB simulation');
    expect(web.querySelector('.xr-status')).toHaveTextContent('Waiting for a licence');
    expect(web).toHaveTextContent(
      'No licence is available for you on ACC-0107 right now. Your institution can tell you more.',
    );
    expect(within(main()).queryByRole('button', { name: /Launch|Continue/ })).toBeNull();
  });

  it('an experiment not given → ST-19 in place (“My courses / Not available”)', async () => {
    const { runtime } = await tabPlatform(SNEHA, 'after-flow-c');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment isn’t available to you',
      }),
    ).toBeVisible();
    expect(topTitle()).toHaveTextContent('Not available');
  });

  it('loading is announced; a failed read says nothing changed, and Try again reads again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getFormatPage');
    inStudent(runtime, WEB, <WebSimulation experimentId={SHELL} />);
    expect(await screen.findByText('Loading the WEB simulation')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('heading', {
      name: 'We couldn’t load the WEB simulation',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Start the WEB simulation' }),
    ).toBeVisible();
  });
});

// ---- ST-09 AR / VR / MR format ----------------------------------------------------------------

const VR = `${SIMULATION}/vr`;

describe('ST-09 VR format — Rahul after Flow B (B3-04 f1, f7)', () => {
  it('Not started: “Set up VR”, the authorised device, the steps open; no launch button', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Set up VR' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const vr = panel('VR format');
    expect(vr.querySelector('.xr-overline')).toHaveTextContent('Simulation · VR');
    expect(vr.querySelector('.xr-status')).toHaveTextContent('Not started');
    expect(vr).toHaveTextContent('Needs a VR headset');
    expect(vr).toHaveTextContent(
      'VR runs on a headset, not in this browser. Follow the setup steps below.',
    );
    expect(vr.querySelector('.xl-dev-name')).toHaveTextContent(
      'ME lab VR headset, asset tag GIT-VR-03',
    );
    expect(linksOf(vr)).toEqual([
      ['My device', '/student/device'],
      ['Report a problem', '/student/help/report'],
      ['Back to Simulation', SIMULATION],
    ]);
    expect(within(main()).queryByRole('button')).toBeNull();
    const details = main().querySelector('details.xl-more')!;
    expect(details).toHaveAttribute('open');
    expect(screen.getByRole('region', { name: 'View setup steps' })).toBe(details.parentElement);
    expect([...details.querySelectorAll('.xl-steps > li')].map((item) => item.textContent)).toEqual(
      [
        '1Use your authorised VR headset.It is shown under My device, in your account menu.',
        '2Open the Shell-and-Tube Heat Exchanger app on the headset.If you can’t find it, contact your institution administrator.',
        '3Work through the experiment on the headset.Your sessions are reported here, so this page shows where you are.',
        '4When the headset reports that you’ve finished, this page shows “Completed”.You can then give feedback on VR.',
      ],
    );
    expect(topTitle()).toHaveTextContent('VR format');
    expect(crumbs()).toEqual(['My courses/', `${SHELL_NAME}/`, 'Simulation/', 'VR']);
  });

  it('In progress from the last reported session; the steps fold under “View setup steps” (f0)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await screen.findByRole('heading', { level: 1, name: 'Set up VR' });
    await report(sample, runtime, 'vr', 'session');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Continue on your headset' }),
    ).toBeVisible();
    const vr = panel('VR format');
    expect(vr.querySelector('.xr-status')).toHaveTextContent('In progress');
    expect(vr).toHaveTextContent('Last session reported 12 Oct 2026, 09:40');
    expect(vr).toHaveTextContent(
      'Pick up where you left off on the headset. This page updates when a session is reported.',
    );
    expect(main().querySelector('details.xl-more')).not.toHaveAttribute('open');
  });

  it('Completed, reported from the headset → Give feedback on VR (f2); no steps', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await screen.findByRole('heading', { level: 1, name: 'Set up VR' });
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You’ve completed VR' }),
    ).toBeVisible();
    const vr = panel('VR format');
    expect(vr.querySelector('.xr-status')).toHaveTextContent('Completed 12 Oct 2026');
    expect(vr).toHaveTextContent('Reported from the headset at 09:40');
    expect(vr).toHaveTextContent('Tell us how this format worked for you.');
    expect(vr).not.toHaveTextContent('two minutes');
    expect(within(vr).getByRole('link', { name: 'Give feedback on VR' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/vr`,
    );
    expect(vr.querySelector('.xl-dev-name')).toBeInTheDocument();
    expect(main().querySelector('details.xl-more')).toBeNull();
  });

  it('paused: “You can’t use VR right now”, no device block, no steps (f5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await screen.findByRole('heading', { level: 1, name: 'Set up VR' });
    await pauseGodavari(sample, runtime);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You can’t use VR right now' }),
    ).toBeVisible();
    const vr = panel('VR format');
    expect(vr.querySelector('.xr-status')).toHaveTextContent('Paused');
    expect(vr).toHaveTextContent('Your institution’s access is paused. Your progress is kept.');
    expect(vr.querySelector('.xl-dev')).toBeNull();
    expect(main().querySelector('details')).toBeNull();
    expect(linksOf(vr)).toEqual([
      ['Report a problem', '/student/help/report'],
      ['Back to Simulation', SIMULATION],
    ]);
  });
});

describe('ST-09 after Flow C — VR completed 20 Oct, feedback sent (B3-12 f3, f4)', () => {
  it('“Feedback sent …” and “See your feedback”; nothing more is offered', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'You’ve completed VR' }),
    ).toBeVisible();
    const vr = panel('VR format');
    expect(vr.querySelector('.xr-status')).toHaveTextContent('Completed 20 Oct 2026');
    expect(vr).toHaveTextContent('Feedback sent 20 Oct 2026, 11:30');
    expect(vr).toHaveTextContent('Thank you — your feedback on VR is recorded.');
    expect(within(vr).getByRole('link', { name: 'See your feedback' })).toHaveAttribute(
      'href',
      `/student/experiments/${SHELL}/feedback/vr`,
    );
    expect(within(vr).queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });
});

describe('ST-09 AR and MR (B3-04 f3, f4) and the address', () => {
  it('AR: not included for the institution — a message page with Back to Simulation', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${SIMULATION}/ar`, <FormatPage experimentId={SHELL} format="ar" />);
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'AR isn’t included for your institution',
    });
    const message = title.closest('.xr-msg') as HTMLElement;
    expect(message).toHaveTextContent(
      'AR is published for this experiment, but your institution’s access includes WEB and VR only.',
    );
    expect(linksOf(message)).toEqual([['Back to Simulation', SIMULATION]]);
    expect(within(message).getByRole('link')).toHaveClass('xr-btn--primary');
    expect(topTitle()).toHaveTextContent('AR format');
    expect(crumbs()).toEqual(['My courses/', `${SHELL_NAME}/`, 'Simulation/', 'AR']);
  });

  it('AR stays “not included” while the institution is paused', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    inStudent(runtime, `${SIMULATION}/ar`, <FormatPage experimentId={SHELL} format="ar" />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'AR isn’t included for your institution',
      }),
    ).toBeVisible();
  });

  it('MR: not published for this experiment — “made for WEB, AR and VR”', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, `${SIMULATION}/mr`, <FormatPage experimentId={SHELL} format="mr" />);
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'This experiment isn’t available in MR',
    });
    expect(title.closest('.xr-msg')).toHaveTextContent(
      'Shell-and-Tube Heat Exchanger is made for WEB, AR and VR.',
    );
    expect(topTitle()).toHaveTextContent('MR format');
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
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Not available to you yet' }),
    ).toBeVisible();
    expect(panel('VR format')).toHaveTextContent(
      'No licence is available for you on ACC-0107 right now.',
    );
    expect(main().querySelector('details')).toBeNull();
  });

  it('a failed read: “We couldn’t load this format”, then Try again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('LearningService.getFormatPage');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    expect(await screen.findByText('Loading this format')).toHaveAttribute('role', 'status');
    await screen.findByRole('heading', { name: 'We couldn’t load this format' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Set up VR' })).toBeVisible();
  });

  it('visiting the format pages writes no activity and no completion (T-12)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, VR, <FormatPage experimentId={SHELL} format="vr" />);
    await screen.findByRole('heading', { level: 1, name: 'Set up VR' });
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
