/**
 * The CI-only runtime-report seam of the test-hook bridge (Phase 3; T-12 / P3-01 open, ADR-0006):
 * the sample runtime's own reports — activity, then a completion — written into the tab's own world
 * by `system:runtime-report` through `@xr/sample-platform/testing`, never by a product control. The
 * Student's own reads (the tab's session) show In progress, then Completed and the feedback offer.
 * Its own file: the bridge attaches once per page.
 */
import type { ExperimentId } from '@xr/domain';
import { describe, expect, it, vi } from 'vitest';

import {
  BOOT_DESCRIPTOR_GLOBAL,
  TEST_HOOKS_GLOBAL,
  TEST_RUNTIME_SEAM_MARKER,
} from './test-hook-bridge';

vi.mock('@/platform/test-hooks', async () => await import('./test-hook-bridge'));

const { bootPlatform } = await import('./runtime');

interface Hooks {
  reportRuntime(report: unknown): Promise<{ marker: string }>;
  inspect(): Promise<{ worldVersion: number }>;
}

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

const SHELL = 'shell-and-tube-heat-exchanger' as ExperimentId;
const RAHUL = 'per-0002';

describe('the runtime-report seam — the only way a test reaches In progress and Completed', () => {
  it('reports activity, then a completion; a launch alone changes nothing', async () => {
    Reflect.set(
      window,
      BOOT_DESCRIPTOR_GLOBAL,
      Object.freeze({ fixture: 'after-flow-b', session: { personId: RAHUL } }),
    );
    const runtime = await bootPlatform();
    const hooks = Reflect.get(window, TEST_HOOKS_GLOBAL) as Hooks;
    const learning = runtime.ports.learning;
    const web = async () =>
      ok(await learning.getSimulationChooser(SHELL)).find((row) => row.format === 'web')!;

    ok(await learning.launchWebFormat({ experimentId: SHELL }));
    expect((await web()).status).toBe('not-started');

    await expect(
      hooks.reportRuntime({ personId: RAHUL, experimentId: SHELL, format: 'web', kind: 'x' }),
    ).rejects.toThrow('reportRuntime takes a kind');
    const before = (await hooks.inspect()).worldVersion;
    expect(
      await hooks.reportRuntime({
        personId: RAHUL,
        experimentId: SHELL,
        format: 'web',
        kind: 'opened',
      }),
    ).toMatchObject({ marker: TEST_RUNTIME_SEAM_MARKER });
    expect((await hooks.inspect()).worldVersion).toBe(before + 1);
    expect((await web()).status).toBe('in-progress');
    expect(
      ok(await runtime.ports.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' }))
        .state,
    ).toBe('not-eligible');

    await hooks.reportRuntime({
      personId: RAHUL,
      experimentId: SHELL,
      format: 'web',
      kind: 'completed',
    });
    const done = await web();
    expect(done.status).toBe('completed');
    expect(done.completion).toMatchObject({
      reportedFrom: 'simulation',
      recordedBy: { kind: 'system', system: 'system:runtime-report' },
    });
    expect(
      ok(await runtime.ports.feedback.getFeedbackState({ experimentId: SHELL, format: 'web' }))
        .state,
    ).toBe('eligible');
    expect(
      ok(await runtime.ports.feedback.getFeedbackState({ experimentId: SHELL, format: 'vr' }))
        .state,
    ).toBe('not-eligible');
  });
});
