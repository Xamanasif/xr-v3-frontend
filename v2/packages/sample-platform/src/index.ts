/**
 * `@xr/sample-platform` — the typed mock adapter and the one shared sample world (ADR-0002;
 * Appendix F §3.7). The product composition root (WP-0.12) takes only this root export:
 * `createSamplePlatform` and the spine-start seed. Stand-ins, test seams, the sample clock control,
 * fault injection and the fixtures live behind `@xr/sample-platform/testing` (ADR-0007), which the
 * import fences keep out of product code.
 */
export type { RealNow } from './clock/clock.js';
export type { SampleWebRuntimeOptions } from './platform/core.js';
export {
  createSamplePlatform,
  type SamplePlatform,
  type SamplePlatformOptions,
  type SampleSnapshotControls,
} from './platform/create.js';
export {
  KEPT_TICKETS_KEY,
  SNAPSHOT_KEY,
  type SnapshotOptions,
  type SnapshotStorage,
} from './persistence/snapshot.js';
export type {
  SamplePaymentAnswer,
  SamplePaymentProvider,
  SamplePaymentWaiting,
} from './platform/sample-payment-provider.js';
export type {
  SampleWebAnswer,
  SampleWebReportKind,
  SampleWebRuntime,
} from './platform/sample-web-runtime.js';
export { seed, SPINE_ANCHOR } from './seed/spine-start.js';
export type { SessionStorageLike } from './session/browser-session.js';
export type { ChangeEvent, ChangeListener } from './store/bus.js';
export { WORLD_SCHEMA, WORLD_VERSION, type World } from './world/types.js';
