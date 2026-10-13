/**
 * M17 Format completion + the per-format progress view (Appendix C §2; ADR-0006; Appendix D §5.1
 * ⑤). Completion is its own record, written ONLY by the system completion handler — never by a
 * Student command, a launch, sessions, time, resources, an assessment or another format (BC3;
 * matrix CMP-01 SYSTEM, CMP-02 … CMP-05 DENY). The completing event itself is open (T-12): in
 * sample mode the only source is the test/seed-only `RuntimeReportPort.reportCompletion`.
 */
import type { SystemActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import { type Decision, invalidState, notPermitted, ok } from '../kernel/decision.js';
import type { ExperimentId, PersonId } from '../kernel/ids.js';
import { isoInstant, type IsoInstant } from '../kernel/time.js';
import { byRuntimeClock, foldSessions } from '../runtime/utilisation.js';
import type { RuntimeEventRecord } from '../runtime/events.js';
import type { CompletionPolicy } from './policy.js';

export interface FormatCompletion {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  /** 'Completed 14 Oct 2026'. */
  readonly completedAt: IsoInstant;
  /** 'Reported by the simulation at 15:30' / 'Reported from the headset at 11:15'. */
  readonly reportedFrom: 'simulation' | 'headset';
  readonly recordedBy: SystemActorRef<'system:runtime-report'>;
}

export const FORMAT_PROGRESS_STATUSES = ['not-started', 'in-progress', 'completed'] as const;

/** The one progress status any read model or screen uses (§1.9 edit 3). */
export type FormatProgressStatus = (typeof FORMAT_PROGRESS_STATUSES)[number];

export interface CompletionReport {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly at: IsoInstant;
  readonly from: 'simulation' | 'headset';
}

function sameKey(completion: FormatCompletion, report: CompletionReport): boolean {
  return (
    completion.studentId === report.studentId &&
    completion.experimentId === report.experimentId &&
    completion.format === report.format
  );
}

/**
 * The system completion handler (CMP-01): writes the completion of one Student × Experiment ×
 * format once. A second report never moves the date — the first completion stands (Appendix C
 * §3.18 [P], the committed fold rule). Any actor but the runtime-report system writer is refused.
 */
export function reportCompletion(input: {
  readonly existing: FormatCompletion | null;
  readonly report: CompletionReport;
  readonly actor: SystemActorRef;
}): Decision<{ readonly completion: FormatCompletion; readonly created: boolean }> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:runtime-report') {
    return notPermitted('wrong-workspace');
  }
  if (input.existing) {
    if (!sameKey(input.existing, input.report)) return invalidState('different-format');
    return ok({ completion: input.existing, created: false });
  }
  return ok({
    completion: {
      studentId: input.report.studentId,
      experimentId: input.report.experimentId,
      format: input.report.format,
      completedAt: input.report.at,
      reportedFrom: input.report.from,
      recordedBy: { kind: 'system', system: 'system:runtime-report' },
    },
    created: true,
  });
}

/**
 * The handler's decision behind the injectable `CompletionPolicy` (ADR-0006 decision 3), for a
 * future runtime adapter: given one Student's runtime events for one experiment, does this format
 * now have a completion? Only events of `format` are read (one format never completes another);
 * the policy sees only `SIMULATION_COMPLETED` reports (a launch, a session, an error or time never
 * complete); an existing completion is returned unchanged. The policy is required — no default —
 * because the completing event is open (T-12); the committed rule is `interimCompletionPolicy`.
 */
export function completionFromRuntimeEvents(input: {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly events: readonly RuntimeEventRecord[];
  readonly policy: CompletionPolicy;
  readonly existing: FormatCompletion | null;
}): FormatCompletion | null {
  if (input.existing) return input.existing;
  const own = input.events
    .filter((event) => event.technology === input.format)
    .sort(byRuntimeClock);
  const fold = foldSessions(own, input.policy);
  if (!fold.completed || !fold.completedAt) return null;
  return {
    studentId: input.studentId,
    experimentId: input.experimentId,
    format: input.format,
    completedAt: isoInstant(new Date(fold.completedAt).toISOString()),
    reportedFrom: input.format === 'web' ? 'simulation' : 'headset',
    recordedBy: { kind: 'system', system: 'system:runtime-report' },
  };
}
