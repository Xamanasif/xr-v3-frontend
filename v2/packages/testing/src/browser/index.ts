/**
 * Browser-test helpers shared by every Playwright suite (apps/web e2e, the specimen
 * harness) — Appendix F §7.2 and WP-0.4. They drive a real browser the way a person does
 * (Tab key, mouse wheel, pointer) and never choose an identity through any UI.
 */
export { reachAndClick, ReachError, type ReachOptions } from './reach.js';
export {
  expectNoInvisibleFocusTargets,
  InvisibleFocusTargetError,
  type FocusStop,
  type FocusWalkOptions,
} from './focus.js';
export {
  expectNoAxeViolations,
  formatAxeViolations,
  AxeViolationsError,
  WCAG_TAGS,
  type AxeScanOptions,
  type DisabledAxeRule,
} from './axe.js';
export {
  expectNoDeveloperSurfaces,
  DeveloperSurfaceError,
  type DeveloperSurfaceFinding,
} from './developer-surfaces.js';
