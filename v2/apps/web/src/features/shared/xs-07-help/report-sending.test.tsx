/**
 * XS-07 board 07 "State 1b · Sending": while the report is on its way the primary reads
 * "Sending…", is busy and ignores presses — the command is sent once (WP-0.12 `useCommand`).
 * The sample world answers within a tick, so the browser cannot hold this state; here the session's
 * `reportProblem` is held open around the real adapter.
 */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts } from '@xr/contracts/draft';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { PERSON_OF_ROLE, renderInTab, tabPlatform, testNavigation } from '@/test-support/workspace';

import { forgetLastAddress } from '../workspace-frame/route-focus';
import { WorkspaceLayout } from '../workspace-frame/workspace-frame';
import { ReportProblem } from './report-problem';

afterEach(() => forgetLastAddress());

/** The runtime with `reportProblem` held until `release()`; every call is counted. */
function holdingReports(runtime: PlatformRuntime) {
  const calls: unknown[] = [];
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const hold = (ports: ProductPorts): ProductPorts => ({
    ...ports,
    operations: {
      ...ports.operations,
      reportProblem: async (input) => {
        calls.push(input);
        await gate;
        return ports.operations.reportProblem(input);
      },
    },
  });
  const held: PlatformRuntime = {
    ...runtime,
    ports: hold(runtime.ports),
    withCommandId: (commandId) => hold(runtime.withCommandId(commandId)),
  };
  return { held, calls, release: () => release() };
}

describe('Report a problem — Sending (board 07 "State 1b")', () => {
  it('"Sending…", busy, presses ignored; one command; then Report sent', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.student);
    const { held, calls, release } = holdingReports(runtime);
    renderInTab(
      <WorkspaceLayout workspace="student">
        <ReportProblem />
      </WorkspaceLayout>,
      { runtime: held, navigation: testNavigation('/student/help/report') },
    );
    await user.type(await screen.findByLabelText('What happened?'), 'The VR simulation stopped.');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    const busy = await screen.findByRole('button', { name: 'Sending…' });
    // The WP-0.6 Button's busy state (590 product-board instances: `is-busy`, `aria-disabled`);
    // board 07 draws `aria-busy` on this one button — a component-level variance left as WP-0.6
    // decided it.
    expect(busy).toHaveAttribute('aria-disabled', 'true');
    expect(busy).toHaveClass('is-busy');
    await user.click(busy);
    await user.click(busy);
    expect(calls).toHaveLength(1);
    await act(async () => release());
    expect(await screen.findByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
    await waitFor(() => expect(calls).toHaveLength(1));
  });
});

describe('Report a problem — a corrected send after a refusal (WP-0.13 review)', () => {
  it('an empty send is refused by the service; the summary takes focus', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.student);
    const { held, calls, release } = holdingReports(runtime);
    renderInTab(
      <WorkspaceLayout workspace="student">
        <ReportProblem />
      </WorkspaceLayout>,
      { runtime: held, navigation: testNavigation('/student/help/report') },
    );
    // A first, empty send is refused by the service (let it through at once).
    release();
    await user.click(await screen.findByRole('button', { name: 'Send report' }));
    const summary = await screen.findByRole('alert');
    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(calls).toHaveLength(1);
  });

  it('while a corrected report is held, no earlier refusal is shown or focused', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(PERSON_OF_ROLE.student);
    let refuseFirst = true;
    const { held, calls, release } = holdingReports(runtime);
    const firstRefused: PlatformRuntime = {
      ...held,
      withCommandId: (commandId) => {
        const ports = held.withCommandId(commandId);
        if (!refuseFirst) return ports;
        refuseFirst = false;
        return {
          ...ports,
          operations: {
            ...ports.operations,
            reportProblem: runtime.withCommandId(commandId).operations.reportProblem,
          },
        };
      },
    };
    renderInTab(
      <WorkspaceLayout workspace="student">
        <ReportProblem />
      </WorkspaceLayout>,
      { runtime: firstRefused, navigation: testNavigation('/student/help/report') },
    );
    await user.click(await screen.findByRole('button', { name: 'Send report' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('One thing needs fixing');
    await user.type(screen.getByLabelText('What happened?'), 'The VR simulation stopped.');
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await screen.findByRole('button', { name: 'Sending…' });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText('Say what happened, so it can be looked into')).toBeNull();
    expect(screen.getByLabelText('What happened?')).not.toHaveAttribute('aria-invalid', 'true');
    expect(calls).toHaveLength(1);
    await act(async () => release());
    expect(await screen.findByRole('heading', { level: 1, name: 'Report sent' })).toBeVisible();
  });
});
