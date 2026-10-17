/**
 * The runtime's reports (TE-3, X-7; ADR-0006; Appendix C §3.18 `RuntimeReportPort`): activity, and
 * the completion the system completion handler writes — by `system:runtime-report`, with sample
 * provenance, never by a person, a launch, a session or time (T-12). Each report is checked as a
 * real runtime's would be: only for a format the Student can open now.
 *
 * Two callers: the stand-in port of `./testing` (the seed walk, fixtures and CI test hooks,
 * `sample-fixture`) and — in a local prototype build whose composition root asks for it (owner
 * authorisation of Phase 7, 17 Oct 2026) — the sample WEB activity's reports for a launch this tab
 * issued (`platform/sample-web-runtime.ts`, `sample-standin`).
 */
import type { InvalidState, Result } from '@xr/contracts/draft';
import {
  type ActivityReport,
  canOpenFormat,
  type CompletionReport,
  type FormatCompletion,
  recordRuntimeActivity,
  reportCompletion,
  type RuntimeActivity,
  systemActor,
} from '@xr/domain';

import type { PlatformCore } from '../platform/core.js';
import { type Op, settle, SystemRefusal, systemCommand } from '../pipeline/runner.js';
import { accessFacts } from '../world/queries.js';
import { formatKey } from '../world/records.js';
import type { SampleOrigin } from '../world/types.js';

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
