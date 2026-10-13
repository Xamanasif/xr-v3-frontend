/**
 * The six stand-in ports (Appendix C §3.18; ADR-0007; WP-0.11 §7) — the non-human writers the
 * sample world needs, for the seed walk and tests only. Exported from `./testing` alone: no product
 * control, developer surface, simulator or account switcher ever reaches them.
 *
 *  - clock: the one sample clock; `setSampleNow` moves it (seed loader and tests only);
 *  - payment outcome (TE-4): the provider's report — the only way a payment is confirmed or fails;
 *  - runtime report (TE-3, X-7): activity, and the completion report the system completion
 *    handler writes. It reports only what a real runtime could — a format the Student can open
 *    now — and records every event with sample provenance (`sample-fixture` for the walk and test
 *    hooks, `sample-standin` for the deferred Phase-3 WEB stand-in route). The production event
 *    vocabulary is unchanged; a launch, a session or time never completes a format (T-12);
 *  - workflow routing: only the drawn default — back to the Academic Reviewer (M-3);
 *  - licence availability (T-06, D7): answers only from seeded facts, never counts;
 *  - overlapping grants (OD-B2-01): no default — `undecided` unless a test injects one.
 */
import type { DecisionOutcome, InvalidState, Result } from '@xr/contracts/draft';
import type { StandinPorts } from '@xr/contracts/draft/standins';
import {
  type ActivityReport,
  canOpenFormat,
  type CompletionReport,
  type Decision,
  type FormatCompletion,
  type IsoInstant,
  recordRuntimeActivity,
  reportCompletion,
  reportPaymentOutcome,
  type RuntimeActivity,
  systemActor,
} from '@xr/domain';

import type { PlatformCore } from '../platform/core.js';
import { type Op, SystemRefusal, systemCommand } from '../pipeline/runner.js';
import { seededLicenceOracle } from '../handlers/student-access.js';
import { accessFacts, plansOf } from '../world/queries.js';
import { formatKey } from '../world/records.js';
import type { SampleOrigin } from '../world/types.js';

/** A domain decision's value, or the stand-in's `invalid-state` refusal. */
export function settle<T>(decision: Decision<T>): T {
  if (decision.ok) return decision.value;
  const refusal = decision.refusal;
  throw new SystemRefusal(
    refusal.kind === 'invalid-state'
      ? refusal.current
      : refusal.kind === 'refused' || refusal.kind === 'conflict'
        ? refusal.code
        : refusal.kind,
  );
}

function answer<T>(outcome: ReturnType<typeof systemCommand<T>>): Result<T, InvalidState> {
  return outcome.ok
    ? { ok: true, value: outcome.value, changed: outcome.changed }
    : { ok: false, error: { kind: 'invalid-state', current: outcome.current } };
}

/** The next sample runtime-event id (`rte-000001` …), from the world itself. */
function nextEventId(op: Op): string {
  const count = op.world.runtimeEvents.length + op.runtimeEvents.length + 1;
  return `rte-${String(count).padStart(6, '0')}`;
}

/** A runtime report only for a format the Student can open now (what a real runtime could send). */
function authorise(
  op: Op,
  report: { studentId: string; experimentId: string; format: ActivityReport['format'] },
): void {
  const student = op.records.people[report.studentId];
  if (student?.kind !== 'student') throw new SystemRefusal('unknown-student');
  const experiment = op.records.experiments[report.experimentId] ?? null;
  const facts = accessFacts(op.records, op.seeded, student, op.core.overlap, report.experimentId);
  if (!experiment || !facts) throw new SystemRefusal('format-not-open');
  const gate = canOpenFormat({ ...facts, experiment, now: op.now, format: report.format });
  if (!gate.canOpen) throw new SystemRefusal('format-not-open');
}

export function reportActivityAs(
  core: PlatformCore,
  report: ActivityReport,
  origin: SampleOrigin,
): Result<RuntimeActivity, InvalidState> {
  return answer(
    systemCommand(core, 'RuntimeReportPort.reportActivity', origin, (op) => {
      authorise(op, report);
      const actor = systemActor('system:runtime-report');
      const key = formatKey(report.studentId, report.experimentId, report.format);
      const activity = settle(
        recordRuntimeActivity({ activity: op.records.activities[key] ?? null, report, actor }),
      );
      op.tx.put('activities', key, activity);
      op.runtimeEvents.push({
        id: nextEventId(op),
        origin,
        recordedAt: op.now,
        report: { kind: 'activity', activity: report },
      });
      return { value: activity, decision: 'recordRuntimeActivity', actor };
    }),
  );
}

export function reportCompletionAs(
  core: PlatformCore,
  report: CompletionReport,
  origin: SampleOrigin,
): Result<FormatCompletion, InvalidState> {
  return answer(
    systemCommand(core, 'RuntimeReportPort.reportCompletion', origin, (op) => {
      authorise(op, report);
      const actor = systemActor('system:runtime-report');
      const key = formatKey(report.studentId, report.experimentId, report.format);
      // The system completion handler (ADR-0006): the first completion stands.
      const outcome = settle(
        reportCompletion({ existing: op.records.completions[key] ?? null, report, actor }),
      );
      if (outcome.created) op.tx.put('completions', key, outcome.completion);
      op.runtimeEvents.push({
        id: nextEventId(op),
        origin,
        recordedAt: op.now,
        report: { kind: 'completion', completion: report },
      });
      return { value: outcome.completion, decision: 'reportCompletion', actor };
    }),
  );
}

export function reportPayment(
  core: PlatformCore,
  input: { readonly requestId: string; readonly outcome: 'confirmed' | 'failed' },
  origin: SampleOrigin,
): Result<DecisionOutcome, InvalidState> {
  return answer(
    systemCommand(core, 'PaymentOutcomePort.report', origin, (op) => {
      const request = op.records.requests[input.requestId];
      if (!request) throw new SystemRefusal('unknown-request');
      const institution = request.institutionId
        ? op.records.institutions[request.institutionId]
        : undefined;
      if (!institution) throw new SystemRefusal(request.status);
      const actor = systemActor('system:payment-provider');
      const outcome = settle(
        reportPaymentOutcome({
          request,
          outcome: input.outcome,
          institution,
          plans: plansOf(op.records, institution.id),
          actor,
          now: op.now,
          ids: op.ids,
        }),
      );
      op.tx.put('requests', outcome.request.id, outcome.request);
      if (outcome.institution)
        op.tx.put('institutions', outcome.institution.id, outcome.institution);
      if (outcome.plan) op.tx.put('plans', outcome.plan.id, outcome.plan);
      return { value: outcome, decision: 'reportPaymentOutcome', actor };
    }),
  );
}

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
