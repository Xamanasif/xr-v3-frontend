/**
 * `@xr/sample-platform/testing` — for test harnesses, the seed loader and the web test-hook bridge
 * only (Appendix F §3.8; ADR-0007). Never imported by product code: it holds the stand-ins
 * (Appendix C §3.18), the three test-only seams (AD-14 review start, DV-2 objective marks, M-3
 * resubmission routing), the sample clock control (`setSampleNow`, X-8), the fault plan, identity
 * by the harness seam (`asPerson`), the scripted walk and the fixtures, and the contract-suite
 * factory. Its marker lets `verify` prove it never reaches a product bundle.
 */
export const SAMPLE_PLATFORM_TESTING_MARKER = 'xr-sample-platform-testing';

export { anchoredClock, controllableClock, fixedClock, manualClock } from '../clock/clock.js';
export { DRAWN_FLOORS, EMPTY_ID_STATE, pendingReservations, reserve } from '../ids/id-source.js';
export { assemblePlatform, internalsOf, type PlatformInternals } from '../platform/create.js';
export { createStandins } from '../standins/index.js';
export { SPINE_ANCHOR, WALK_RESERVATIONS } from '../seed/spine-start.js';
export { ist } from '../seed/book.js';
export { snapshotOf } from '../world/records.js';
export {
  afterFlow,
  afterSetup,
  buildWorld,
  contractFactory,
  FIXTURE_NAMES,
  type FixtureName,
  fixtureWorld,
  type FlowName,
  laterSample,
  stateCoverage,
  stepsTo,
} from './fixtures.js';
export {
  asPerson,
  asPersonId,
  beginSession,
  faults,
  personIdOf,
  planPayment,
  type SampleSeams,
  seamsOf,
  setSampleNow,
  snapshot,
  stageStudentImport,
  standinsOf,
  SUPPLIED_OBJECTIVE_MARKS,
  visitorPorts,
  worldOf,
} from './harness.js';
export {
  must,
  runWalk,
  WALK_STEPS,
  type WalkContext,
  type WalkFlow,
  type WalkStep,
} from './walk.js';
