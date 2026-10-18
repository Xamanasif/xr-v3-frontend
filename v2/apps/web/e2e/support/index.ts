/**
 * End-to-end support for the web app (Appendix F §3.2 `e2e/support/`, WP-0.4).
 *
 * Generic browser helpers come from `@xr/testing/browser` (shared with the specimen
 * harness); the app-specific session and world helpers live here, next to the app whose
 * test-hook seam they speak to.
 */
export {
  expectNoAxeViolations,
  expectNoDeveloperSurfaces,
  expectNoInvisibleFocusTargets,
  reachAndClick,
} from '@xr/testing/browser';
export {
  actAs,
  inspectWorld,
  planPayment,
  type PortCommand,
  reportPayment,
  reportRuntime,
  type RuntimeReport,
  type SessionSwitch,
  startReview,
  switchIdentity,
  type WorldInspection,
} from './act-as';
export { bootWorld, type BootDescriptor } from './boot-world';
export { SAMPLE_PASSWORD, type SampleCredential, signInAs } from './sign-in';
export {
  BOOT_DESCRIPTOR_GLOBAL,
  HarnessUnavailableError,
  TEST_HOOKS_GLOBAL,
  TEST_HOOKS_URL,
  PRODUCT_URL,
  type SamplePerson,
} from './test-seam';
