/**
 * The local prototype build's support pages (owner authorisation of Phase 7, 17 Oct 2026):
 *
 * - TE-3, the sample WEB activity: labelled simulated; connects to the tab that launched it; opening
 *   it reports activity only; three trials at different levels and the right answer unlock
 *   "Finish activity", which alone reports the completion; a refusal or no answer is said so.
 * - TE-6, "Reset demo data": asks once (destructive, focus on Cancel), then resets through the
 *   platform and loads the page again; says so when nothing is kept in this browser.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { composePlatform } from '@/platform/composition';
import { PlatformRuntimeProvider } from '@/platform/platform-provider';
import { assembleRuntime, createQueryClient } from '@/platform/runtime';
import type { ChannelLike } from '@/platform/sample-web-relay';
import { useSampleWebActivity } from '@/queries/prototype';

import { measuredValue } from './activity-model';
import { ResetPage } from './reset-page';
import { WebActivity } from './web-activity';

vi.mock('@/queries/prototype', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/queries/prototype')>();
  return {
    ...actual,
    useSampleWebActivity: vi.fn((launch: string | null) =>
      actual.useSampleWebActivity(launch, channelFactory),
    ),
  };
});

/** The launching tab, as the activity's channel sees it. */
let currentChannel: ChannelLike | null = null;
/** One factory for every render, as the real default (`openChannel`) is. */
function channelFactory(): ChannelLike | null {
  return currentChannel;
}

interface Launcher {
  readonly reports: string[];
  answerReportsWith: 'recorded' | 'refused' | 'silent';
}

function launcherChannel(options: { readonly answers: boolean }): Launcher {
  const listeners = new Set<(event: { readonly data: unknown }) => void>();
  const launcher: Launcher = { reports: [], answerReportsWith: 'recorded' };
  const reply = (data: unknown) =>
    queueMicrotask(() => {
      for (const listener of listeners) listener({ data });
    });
  currentChannel = {
    postMessage(message) {
      const sent = message as { type: string; id: string; kind?: string };
      if (!options.answers) return;
      if (sent.type === 'hello') {
        reply({ type: 'launch', id: sent.id, experimentName: 'Shell-and-Tube Heat Exchanger' });
      } else if (sent.type === 'report') {
        launcher.reports.push(sent.kind!);
        if (launcher.answerReportsWith !== 'silent') {
          reply({ type: 'ack', id: sent.id, outcome: launcher.answerReportsWith });
        }
      }
    },
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    close: () => listeners.clear(),
  };
  return launcher;
}

afterEach(() => {
  currentChannel = null;
  vi.useRealTimers();
});

const SHELL = 'Shell-and-Tube Heat Exchanger';

async function runTrial(user: ReturnType<typeof userEvent.setup>, level: number) {
  await user.selectOptions(screen.getByLabelText(/Rig level/), String(level));
  await user.click(screen.getByRole('button', { name: 'Run trial' }));
}

describe('TE-3 — the sample WEB activity', () => {
  it('is labelled simulated, opens as activity only, and completes only after its steps', async () => {
    const launcher = launcherChannel({ answers: true });
    const user = userEvent.setup();
    render(<WebActivity launch="lch-000001.world-a" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Sample WEB activity' })).toBeVisible();
    expect(screen.getByText('Simulated for this prototype')).toBeVisible();
    expect(screen.getByText(/No real simulation or XR runtime runs here\./)).toBeVisible();
    expect(await screen.findByText(SHELL)).toBeVisible();
    expect(launcher.reports).toEqual(['opened']);
    expect(screen.queryByRole('button', { name: 'Finish activity' })).toBeNull();

    await runTrial(user, 2);
    await runTrial(user, 2);
    expect(screen.getByText('You already ran this level. Choose a different one.')).toBeVisible();
    await runTrial(user, 4);
    await runTrial(user, 1);
    const table = screen.getByRole('table', { name: 'Your trials' });
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(table).getByText(measuredValue(SHELL, 4).toFixed(1))).toBeVisible();
    expect(launcher.reports).toEqual(['opened', 'saved', 'saved', 'saved']);
    expect(await screen.findByText('Three trials done.')).toBeVisible();

    const question = screen.getByRole('group', { name: /Which level gave the highest/ });
    await user.click(within(question).getByLabelText('Level 2'));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText(/Not quite\./)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Finish activity' })).toBeNull();
    await user.click(within(question).getByLabelText('Level 4'));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText(/Correct/)).toBeVisible();
    expect(launcher.reports).not.toContain('completed');

    await user.click(screen.getByRole('button', { name: 'Finish activity' }));
    expect(await screen.findByText('Activity completed')).toBeVisible();
    expect(launcher.reports).toEqual(['opened', 'saved', 'saved', 'saved', 'completed']);
    expect(screen.getByRole('button', { name: 'Close this tab' })).toBeVisible();
  });

  it('says when the platform refuses or does not confirm the completion', async () => {
    const launcher = launcherChannel({ answers: true });
    const user = userEvent.setup();
    render(<WebActivity launch="lch-000001.world-a" />);
    await screen.findByText(SHELL);
    for (const level of [1, 2, 3]) await runTrial(user, level);
    await user.click(screen.getByLabelText('Level 3'));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    launcher.answerReportsWith = 'refused';
    await user.click(screen.getByRole('button', { name: 'Finish activity' }));
    expect(await screen.findByText('The result wasn’t recorded')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Finish activity' })).toBeVisible();
  });

  it('is not connected without a launching tab, and can ask again', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    launcherChannel({ answers: false });
    render(<WebActivity launch="lch-000009.world-z" />);
    expect(screen.getByText('Connecting to your experiment page…')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(screen.getByText('This activity isn’t connected to your experiment page')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Run trial' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  it('is not connected without a launch in its address', () => {
    launcherChannel({ answers: true });
    render(<WebActivity launch={null} />);
    expect(screen.getByText('This activity isn’t connected to your experiment page')).toBeVisible();
    expect(vi.mocked(useSampleWebActivity)).toHaveBeenCalledWith(null);
  });
});

function storage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
}

describe('TE-6 — Reset demo data', () => {
  let replace: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    replace = vi.fn();
    vi.stubGlobal('location', { ...window.location, replace });
  });
  afterEach(() => vi.unstubAllGlobals());

  function renderReset(kept: boolean, done = false) {
    const local = storage();
    const composed = composePlatform({
      dataSource: 'sample',
      ...(kept ? { worldStorage: local, lineage: 'lineage-test' } : {}),
    });
    const runtime = assembleRuntime({
      composed,
      queryClient: createQueryClient('sample'),
      publicSessionKey: 'public:bs-test',
    });
    render(
      <PlatformRuntimeProvider runtime={runtime} queryClient={runtime.queryClient}>
        <ResetPage done={done} />
      </PlatformRuntimeProvider>,
    );
    return { local, runtime };
  }

  it('asks once, then removes the kept world and loads the page again', async () => {
    const user = userEvent.setup();
    const { local, runtime } = renderReset(true);
    expect(runtime.capabilities.persistence).toBe('browser-snapshot');
    expect(local.items.size).toBe(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Reset demo data' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset demo data?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Reset demo data' }));
    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/prototype/reset?done=1'));
    expect(local.items.size).toBe(0);
  });

  it('confirms the reset after the new page load', () => {
    renderReset(true, true);
    expect(screen.getByText('Back to the starting state')).toBeVisible();
  });

  it('says nothing is kept when this browser keeps no world', () => {
    renderReset(false);
    expect(screen.getByText('Nothing is kept in this browser')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Reset demo data' })).toBeNull();
  });
});
