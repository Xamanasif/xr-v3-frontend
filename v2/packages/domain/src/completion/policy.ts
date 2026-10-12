/**
 * The replaceable seam that decides whether a runtime COMPLETION REPORT counts as the
 * learning completion of one technology format (docs/decisions/ADR-0006).
 *
 * The event that marks a format Completed is still OPEN (v46 T-12; docs/OPEN_DECISIONS.md
 * A-06). Owner binding constraint BC3: "Completed" is set by the system, never by the
 * Student, and never inferred from a launch. Therefore:
 *  - a policy is consulted ONLY for `SIMULATION_COMPLETED` reports. A launch, a session
 *    start or end, an error, time, resources, an assessment or another technology can
 *    never complete a format, whatever policy is injected (enforced by `foldSessions`);
 *  - the only policy today is `interimCompletionPolicy`, the committed foundation rule
 *    kept verbatim and labelled PROVISIONAL. It is not an owner-approved production
 *    completion rule and decides nothing about T-12.
 */
import type { RuntimeEventRecord } from '../runtime/events.js';

/** Facts about the session a completion report belongs to, at the moment it is folded. */
export interface CompletionContext {
  /** The session was launched (`SIMULATION_LAUNCHED`). */
  readonly sessionLaunched: boolean;
  /** The session was started (`SESSION_STARTED`). */
  readonly sessionStarted: boolean;
}

export interface CompletionPolicy {
  readonly id: string;
  /** `provisional` until T-12 is decided by the owner. */
  readonly status: 'provisional' | 'decided';
  /** Whether this `SIMULATION_COMPLETED` report completes the format. */
  isCompletion(report: RuntimeEventRecord, context: CompletionContext): boolean;
}

/**
 * The committed foundation rule (Implementation 09, parity row P-13), verbatim in meaning:
 * a completion is a report FROM a run — it counts only when its session was actually
 * launched or started. PROVISIONAL: T-12 stays open.
 */
export const interimCompletionPolicy: CompletionPolicy = {
  id: 'interim-completion-report-from-an-opened-session',
  status: 'provisional',
  isCompletion: (report, context) =>
    report.type === 'SIMULATION_COMPLETED' && (context.sessionLaunched || context.sessionStarted),
};
