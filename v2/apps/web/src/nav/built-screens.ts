import { SCREENS_WITH_PAGES } from './routes';
import type { ScreenKey } from './screens';

/**
 * The built-screen manifest (Appendix F §3.2 `built-screens.ts`; ADR-0005 §8): a navigation item
 * renders only when the screen it opens is built (`navigation.json`: "A sidebar item exists only
 * when its screen exists"; B8-06 "a sidebar item exists only when its screen exists"). Unbuilt
 * destinations stay in the typed configuration and never appear as disabled placeholders.
 *
 * Generated from the route manifest (`routes.ts`), which the route-manifest test holds equal to
 * the page files under `src/app`: a screen is built when it has a page. Phase 0 builds Help &
 * support (XS-07) as the one workspace destination, so every sidebar shows only Help, and the
 * account menu offers no "My device" (ST-18 is not built). Each later work package adds the
 * pages it builds, and their items appear in board order.
 */
export const BUILT_SCREENS: ReadonlySet<ScreenKey> = new Set<ScreenKey>(SCREENS_WITH_PAGES);
