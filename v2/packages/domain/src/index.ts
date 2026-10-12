export * from './roles.js';
export * from './technology.js';
export * from './runtime/events.js';
export * from './completion/policy.js';
// Runtime activity derivation. `SimulationStatus` and `deriveSimulationUtilisation` are
// deliberately not exported here: they are for a future runtime adapter only and must
// never reach a UI path (docs/decisions/ADR-0006).
export { byRuntimeClock, foldSessions } from './runtime/utilisation.js';
export type { SessionFold, SessionSummary } from './runtime/utilisation.js';
