import {
  boundaries,
  browserGlobals,
  core,
  ignores,
  prettier,
  typescript,
  uiRules,
} from '@xr/config/eslint';

export default [
  ignores,
  ...core,
  ...typescript,
  browserGlobals,
  prettier,
  boundaries('@xr/ui'),
  // v46 class names only, no raw hex, no canvas classes (ADR-0001; Appendix F §3.8, WP-0.4).
  ...uiRules,
];
