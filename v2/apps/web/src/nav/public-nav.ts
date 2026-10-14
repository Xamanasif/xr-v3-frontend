/**
 * The public surface's navigation (Phase-1 Package 1B; ADR-0005 §8 built-screen navigation):
 * which of the drawn header, menu-sheet and footer destinations render — only those whose page is
 * built — and which header item is the current place. PUBLIC is a surface, not a role (BC1).
 *
 * The header data is `PUBLIC_HEADER_NAV` (B1-01; HB-02: "Request access" opens PU-07). PU-07
 * Selection is Package 1C: its "Selection (n)" link and the "Request access" button are drawn but
 * not rendered until it is built (P0-35, extended to Phase 1; link-target ledger `not-rendered`).
 */
import { PUBLIC_HEADER_NAV, type PublicHeaderItemConfig, type PublicScreenId } from './nav-config';
import { PUBLIC_SCREENS_WITH_PAGES } from './routes';

/** The public screens a header, sheet or footer item may open once built (XS-01 is built in 1A). */
function isBuilt(screen: PublicScreenId): boolean {
  return screen === 'XS-01' || (PUBLIC_SCREENS_WITH_PAGES as ReadonlySet<string>).has(screen);
}

/** The header item a page belongs to (B1-03 PU-05 and B1-05 PU-06 keep their section current). */
export type PublicPlace = 'browse' | 'areas';

export function publicPlaceOf(pathname: string): PublicPlace | null {
  if (pathname === '/experiments' || pathname.startsWith('/experiments/')) return 'browse';
  if (pathname === '/areas' || pathname.startsWith('/areas/') || pathname.startsWith('/courses/'))
    return 'areas';
  return null;
}

const ITEMS = new Map(PUBLIC_HEADER_NAV.map((item) => [item.key, item]));

function item(key: string): PublicHeaderItemConfig {
  const found = ITEMS.get(key);
  if (!found) throw new Error(`No public header item "${key}".`);
  return found;
}

/** The header's `nav aria-label="Main"` and the menu sheet's list: Browse experiments, Areas, For institutions. */
export const PUBLIC_MAIN_NAV: readonly PublicHeaderItemConfig[] = [
  item('browse'),
  item('areas'),
  item('for-institutions'),
].filter((entry) => isBuilt(entry.screen));

/** "Selection (n)" in the header and the sheet — rendered once PU-07 is built (Package 1C). */
export const PUBLIC_SELECTION_LINK: PublicHeaderItemConfig | null = isBuilt(
  item('selection').screen,
)
  ? item('selection')
  : null;

/** "Request access" in the header and the sheet — rendered once PU-07 is built (Package 1C). */
export const PUBLIC_REQUEST_ACCESS: PublicHeaderItemConfig | null = isBuilt(
  item('request-access').screen,
)
  ? item('request-access')
  : null;

export const PUBLIC_SIGN_IN: PublicHeaderItemConfig = item('sign-in');

/** The footer's real links (B1-01: Browse experiments · Areas · For institutions · Sign in; PU-16 excluded). */
export const PUBLIC_FOOTER_LINKS: readonly PublicHeaderItemConfig[] = [
  ...PUBLIC_MAIN_NAV,
  PUBLIC_SIGN_IN,
];

/** PU-14 "How institutional access works": the landing's section (Appendix A PU-14). */
export const FOR_INSTITUTIONS_ID = 'for-institutions';
export const FOR_INSTITUTIONS_HREF = `/#${FOR_INSTITUTIONS_ID}`;

/** PU-07 is not built (Package 1C): the PU-01 / PU-06 / XS-01 ways into it are not rendered. */
export const SELECTION_BUILT = isBuilt('PU-07');
