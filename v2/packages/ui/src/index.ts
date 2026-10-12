/**
 * @xr/ui — the frozen v46 visual system (docs/decisions/ADR-0001).
 *
 * The stylesheets are exported as `@xr/ui/styles.css` (the eight verbatim v46 sheets in one
 * `xr.v46` layer plus the `xr.product` layer). The only TypeScript values are the generated
 * container-query thresholds and focus colours (Appendix E §1.2 T-2). The components that emit
 * the v46 class names arrive in WP-0.6.
 */
export { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from './tokens/v46-constants.js';
