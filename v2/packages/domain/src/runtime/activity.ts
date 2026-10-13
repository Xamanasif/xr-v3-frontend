/**
 * M16 Runtime activity — the activity half of RUN (Appendix C §2; Appendix D §5.1 ④). Written by
 * the runtime (in sample mode the test/seed-only `RuntimeReportPort` stand-in) — never by the
 * Student, and never derived from publication, plan or grant. It is NOT learning completion (BC3):
 * no activity, however much, makes a format Completed (invariants 2, 3, 11).
 *
 * The portal "Launch WEB" stores nothing; In progress comes only from runtime reports (AD-16;
 * P3-01 (c) stays open for Phase 3). AR / VR / MR have no launch button (RUN-05).
 */
import type { SystemActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import { type Decision, invalidState, notPermitted, ok, refused } from '../kernel/decision.js';
import type { ExperimentId, PersonId } from '../kernel/ids.js';
import { type Provided, provided } from '../kernel/provided.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Experiment } from '../catalogue/model.js';
import type { OpenGate } from '../access/model.js';

export interface RuntimeActivity {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  /** 'First opened 12 Oct 2026, 10:05' (WEB) / 'First session reported …' (VR). */
  readonly firstOpenedAt: Provided<IsoInstant> | null;
  /** WEB 'Last saved 12 Oct 2026, 11:20' — the time only (OD-B3-07). */
  readonly lastSavedAt: Provided<IsoInstant> | null;
  /** VR 'Last session reported 16 Oct 2026, 14:10'. */
  readonly lastSessionReportedAt: Provided<IsoInstant> | null;
  /** Usage 'Sessions': times opened in the browser (WEB) or reported from a headset (B3-10). */
  readonly sessions: Provided<number>;
}

export interface ActivityReport {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly kind: 'opened' | 'saved' | 'session';
  readonly at: IsoInstant;
}

/**
 * Record a runtime activity report (matrix RUN-08, SYSTEM). The only writer of activity: any
 * actor other than the runtime-report system writer is refused.
 */
export function recordRuntimeActivity(input: {
  readonly activity: RuntimeActivity | null;
  readonly report: ActivityReport;
  readonly actor: SystemActorRef;
}): Decision<RuntimeActivity> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:runtime-report') {
    return notPermitted('wrong-workspace');
  }
  const { report } = input;
  const current = input.activity;
  if (
    current &&
    (current.studentId !== report.studentId ||
      current.experimentId !== report.experimentId ||
      current.format !== report.format)
  ) {
    return invalidState('different-format');
  }
  const opened = report.kind !== 'saved';
  return ok({
    studentId: report.studentId,
    experimentId: report.experimentId,
    format: report.format,
    firstOpenedAt: current?.firstOpenedAt ?? provided(report.at),
    lastSavedAt: report.kind === 'saved' ? provided(report.at) : (current?.lastSavedAt ?? null),
    lastSessionReportedAt:
      report.kind === 'session' ? provided(report.at) : (current?.lastSessionReportedAt ?? null),
    sessions: provided((current?.sessions ?? 0) + (opened ? 1 : 0)),
  });
}

/**
 * Launch / Continue WEB (RUN-03, RUN-04): the given format opens in a new tab. Nothing is stored —
 * "In progress" is written by the runtime report afterwards (RUN-08), never by the click (AD-16).
 * `webGate` is the WEB format gate (`canOpenFormat` with format `web`): given, published and in the
 * plan (RUN-06) — never the experiment-level gate.
 */
export function launchWebFormat(input: {
  readonly experiment: Experiment;
  readonly webGate: OpenGate;
}): Decision<{ readonly webLink: string }> {
  if (!input.webGate.canOpen) {
    return input.webGate.reason === 'policy-open'
      ? { ok: false, refusal: { kind: 'policy-open', decision: input.webGate.decision } }
      : refused(input.webGate.reason);
  }
  const web = input.experiment.live.formats.find((entry) => entry.format === 'web');
  if (!web || web.delivery.format !== 'web') return refused('format-not-published');
  return ok({ webLink: web.delivery.webLink });
}
