/** Component test support (never shipped: excluded from the build, Appendix F §3.4 `testing/`). */
export {
  boardText,
  expectBoardDraws,
  canonicalMarkup,
  expectRenderedAsDrawn,
  expectRenderedAsDrawnInAnyAttributeOrder,
  normaliseMarkup,
  withoutProductClasses,
  type BoardSource,
} from './board.js';
export { classesIn, expectStylesheetClassesOnly, STYLESHEET_CLASS_NAMES } from './v46-css.js';
export { assertNoAxeViolations } from '@xr/testing/axe';
export {
  V3_BOARDS_DIRECTORY,
  V3_STYLESHEET_CLASS_NAMES,
  INTERNAL_REFERENCE,
  expectNoInternalReferences,
  expectRenderedAsV3Drawn,
  expectRenderedAsV3Element,
  expectV3ClassesOnly,
  v3BoardElement,
  v3BoardText,
  xsExportText,
  XS_EXPORT_DIRECTORY,
  saExportText,
  SA_EXPORT_DIRECTORY,
  veExportText,
  VE_EXPORT_DIRECTORY,
  cmExportText,
  CM_EXPORT_DIRECTORY,
  rvExportText,
  RV_EXPORT_DIRECTORY,
  iaExportText,
  IA_EXPORT_DIRECTORY,
  IA_PATCHED_STYLES,
  iaPatchedMarkup,
  v3Canonical,
} from './v3.js';
