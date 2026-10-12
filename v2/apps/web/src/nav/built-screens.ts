import type { ScreenKey } from './screens';

/**
 * The built-screen manifest (Appendix F §3.2 `built-screens.ts`; ADR-0005 §8): a navigation item
 * renders only when the screen it opens is built (`navigation.json`: "A sidebar item exists only
 * when its screen exists"; B8-06 "a sidebar item exists only when its screen exists"). Unbuilt
 * destinations stay in the typed configuration and never appear as disabled placeholders.
 *
 * Phase 0 builds Help & support (XS-07) as the one workspace destination, so every sidebar shows
 * only Help. Appendix F §3.2 makes this a generated manifest: it is written by hand until the
 * route files it would be generated from exist (WP-0.13 builds XS-07's pages and the
 * route-manifest test). Each later work package adds the screen ids it builds.
 */
export const BUILT_SCREENS: ReadonlySet<ScreenKey> = new Set<ScreenKey>(['XS-07']);
