/** Component test support (never shipped: excluded from the build, Appendix F §3.4 `testing/`). */
export {
  boardText,
  expectBoardDraws,
  canonicalMarkup,
  expectRenderedAsDrawn,
  expectRenderedAsDrawnInAnyAttributeOrder,
  normaliseMarkup,
  type BoardSource,
} from './board.js';
export { classesIn, expectStylesheetClassesOnly, STYLESHEET_CLASS_NAMES } from './v46-css.js';
export { assertNoAxeViolations } from '@xr/testing/axe';
