/**
 * The six stand-in ports (Appendix C §3.18; ADR-0007; WP-0.11 §7) — the non-human writers the
 * sample world needs, for the seed walk and tests only. Exported from `./testing` alone: no product
 * control, developer surface, simulator or account switcher ever reaches them.
 *
 *  - clock: the one sample clock; `setSampleNow` moves it (seed loader and tests only);
 *  - payment outcome (TE-4): the provider's report — the only way a payment is confirmed or fails
 *    (`handlers/payment-provider.ts`; a local prototype build's `startPayment` reports through the
 *    same writer when its composition root asks for it, Package 1C);
 *  - runtime report (TE-3, X-7): activity, and the completion report the system completion
 *    handler writes. It reports only what a real runtime could — a format the Student can open
 *    now — and records every event with sample provenance (`sample-fixture` for the walk and test
 *    hooks, `sample-standin` for the local prototype build's sample WEB activity, Phase 7). The production event
 *    vocabulary is unchanged; a launch, a session or time never completes a format (T-12);
 *  - workflow routing: only the drawn default — back to the Academic Reviewer (M-3);
 *  - licence availability (T-06, D7): answers only from seeded facts, never counts;
 *  - overlapping grants (OD-B2-01): no default — `undecided` unless a test injects one.
 */
import type { StandinPorts } from '@xr/contracts/draft/standins';
import type { IsoInstant } from '@xr/domain';

import type { PlatformCore } from '../platform/core.js';
import { reportPayment } from '../handlers/payment-provider.js';
import { reportActivityAs, reportCompletionAs } from '../handlers/runtime-report.js';
import { seededLicenceOracle } from '../handlers/student-access.js';
import type { SampleOrigin } from '../world/types.js';

export { settle } from '../pipeline/runner.js';
export { reportActivityAs, reportCompletionAs } from '../handlers/runtime-report.js';

/** The stand-in ports over a platform core; `origin` is the provenance their writes carry. */
export function createStandins(
  core: PlatformCore,
  origin: SampleOrigin = 'sample-fixture',
): StandinPorts {
  return {
    clock: {
      now: () => core.clock.now(),
      setSampleNow: (instant: IsoInstant) => core.clock.set(instant),
    },
    paymentOutcome: {
      report: (input) => reportPayment(core, input, origin),
    },
    runtimeReport: {
      reportActivity: (report) => reportActivityAs(core, report, origin),
      reportCompletion: (report) => reportCompletionAs(core, report, origin),
    },
    workflowRouting: core.routing,
    licenceAvailability: {
      waitFor: (input) => seededLicenceOracle(core.store.world.seeded).waitFor(input),
    },
    overlapGrant: core.overlap,
  };
}
