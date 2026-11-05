// Vocabulary (WP-0.3).
export * from './roles.js';
export * from './technology.js';
export * from './runtime/events.js';
export * from './completion/policy.js';
// Runtime activity derivation. `SimulationStatus` and `deriveSimulationUtilisation` are
// deliberately not exported here: they are for a future runtime adapter only and must
// never reach a UI path (docs/decisions/ADR-0006).
export { byRuntimeClock, foldSessions } from './runtime/utilisation.js';
export type { SessionFold, SessionSummary } from './runtime/utilisation.js';

// Kernel (WP-0.9): ids, time, records, history, decisions, transition tables.
export * from './kernel/brand.js';
export * from './kernel/ids.js';
export * from './kernel/time.js';
export * from './kernel/record.js';
export * from './kernel/provided.js';
export * from './kernel/history.js';
export * from './kernel/decision.js';
export * from './kernel/machine.js';
export * from './kernel/id-source.js';

// Models, transitions and decisions, M01–M28 (WP-0.9).
export * from './institution/model.js';
export * from './institution/term.js';
export * from './institution/decide.js';
export * from './institution/names.js';
export * from './catalogue/model.js';
export * from './catalogue/decide.js';
export * from './request/model.js';
export * from './request/decide.js';
export * from './request/selection.js';
export * from './people/model.js';
export * from './people/decide.js';
export * from './access/model.js';
export * from './access/decide.js';
export * from './access/gate.js';
export * from './runtime/activity.js';
export * from './completion/record.js';
export * from './completion/progress.js';
export * from './resources/resources.js';
export * from './feedback/feedback.js';
export * from './submission/model.js';
export * from './submission/decide.js';
export * from './correction/correction.js';
export * from './assessment/model.js';
export * from './assessment/assessment.js';
export * from './assessment/question-bank.js';
export * from './assessment/attempt.js';
export * from './device/device.js';
export * from './support/support.js';
export * from './platform-roles/platform-roles.js';
export * from './session/session.js';
export * from './read-models/read-models.js';

// Policy and invariants (WP-0.9).
export * from './policy/context.js';
export * from './policy/subjects.js';
export * from './policy/rules.js';
export * from './policy/may.js';
export * from './policy/read.js';
export * from './invariants/invariants.js';
