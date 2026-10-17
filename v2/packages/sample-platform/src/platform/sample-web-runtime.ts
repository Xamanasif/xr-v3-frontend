/**
 * The sample WEB activity's side of the runtime (TE-3 / T-12; owner authorisation of Phase 7,
 * 17 Oct 2026; a local prototype build only). The activity is a small, deterministic, simulated
 * exercise in its own tab — not a real XR or simulation runtime. It reports through this tab's
 * platform, which holds the launch: an unknown launch is refused, and every report is written by
 * the system runtime-report handler with `sample-standin` provenance, checked as a real runtime's
 * report would be (the format must be open to the Student now). Opening the activity is activity
 * ("In progress"), never completion; only the activity's own completion — after its conditions are
 * met — reports `completed`, and the first completion stands (ADR-0006).
 */
import type { RecordRef } from '@xr/domain';

import { reportActivityAs, reportCompletionAs } from '../handlers/runtime-report.js';
import type { PlatformCore } from './core.js';

export type SampleWebReportKind = 'opened' | 'saved' | 'completed';

/**
 * The sample activity's own conditions, as the platform checks them: it was opened and saved
 * progress after each of its trials before it may report the completion (the page asks for three
 * trials at different levels and a right answer to its check question).
 */
export const SAMPLE_WEB_TRIALS = 3;

export type SampleWebAnswer =
  | { readonly ok: true; readonly changed: readonly RecordRef[] }
  | { readonly ok: false; readonly reason: 'unknown-launch' | 'not-finished' | 'refused' };

export interface SampleWebRuntime {
  /** What the activity may show for a launch this tab issued; `null` for any other. */
  describe(launch: string): { readonly experimentName: string } | null;
  /** One report from the activity for a launch this tab issued, after the commands before it. */
  report(launch: string, kind: SampleWebReportKind): Promise<SampleWebAnswer>;
}

export function sampleWebRuntime(core: PlatformCore): SampleWebRuntime {
  /** What each launch has reported so far (adapter memory, with the launch). */
  const progress = new Map<string, { readonly opened: boolean; readonly saved: number }>();
  return {
    describe(launch) {
      const held = core.launches.get(launch);
      return held ? { experimentName: held.experimentName } : null;
    },
    report(launch, kind) {
      return core.store.serialize((): SampleWebAnswer => {
        const held = core.launches.get(launch);
        if (!held) return { ok: false, reason: 'unknown-launch' };
        const reported = progress.get(launch) ?? { opened: false, saved: 0 };
        // Never out of order: progress after opening, the completion only after every trial.
        if (kind === 'saved' && !reported.opened) return { ok: false, reason: 'not-finished' };
        if (kind === 'completed' && (!reported.opened || reported.saved < SAMPLE_WEB_TRIALS)) {
          return { ok: false, reason: 'not-finished' };
        }
        const subject = {
          studentId: held.studentId,
          experimentId: held.experimentId,
          format: 'web',
        } as const;
        const at = core.clock.now();
        const outcome =
          kind === 'completed'
            ? reportCompletionAs(core, { ...subject, at, from: 'simulation' }, 'sample-standin')
            : reportActivityAs(core, { ...subject, kind, at }, 'sample-standin');
        if (!outcome.ok) return { ok: false, reason: 'refused' };
        progress.set(launch, {
          opened: true,
          saved: reported.saved + (kind === 'saved' ? 1 : 0),
        });
        return { ok: true, changed: outcome.changed };
      });
    },
  };
}
