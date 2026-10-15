import { WORKSPACE_NAV } from './nav-config';

/**
 * IA-20 Usage (board B3-10; Phase 3): its address (Appendix A register `/institute/usage`; B8-01
 * "Sidebar Usage"), its "By course" view (`?view=course`, register PROPOSED) and its place in the
 * shell — a destination's own page, titled with the destination ("Usage") and crumbed with itself
 * alone (B3-10 f0 … f4 `ol.xr-crumbs` › "Usage"), Usage current in the sidebar.
 */
const USAGE_DESTINATION = WORKSPACE_NAV.tenant_admin.destinations.find(
  (destination) => destination.screen === 'IA-20',
)!;

/** `/institute/usage`: the view by experiment and format (B3-10 f0). */
export const USAGE_ADDRESS = USAGE_DESTINATION.href;

/** "Usage" (board 06 label; B3-10 `span.xr-top-title`). */
export const USAGE_TITLE = USAGE_DESTINATION.label;

/** The page's views: by experiment and format (f0, f3, f4) or by course (f1). */
export type UsageViewKey = 'experiment' | 'course';

/** `?view=course` (register PROPOSED): the "By course" view (B3-10 f1). */
export const USAGE_BY_COURSE_ADDRESS = `${USAGE_ADDRESS}?view=course`;

/** The address of a view: the bare address for the view by experiment and format. */
export function usageAddress(view: UsageViewKey): string {
  return view === 'course' ? USAGE_BY_COURSE_ADDRESS : USAGE_ADDRESS;
}

/**
 * The view an address asks for and whether it must be normalised: `view=course` is the course
 * view; no `view` is the view by experiment and format; any other `view` shows that view too and
 * the address becomes the bare `/institute/usage` (state-copy `IA-20.view-address`).
 */
export function usageViewOf(search: string): {
  readonly view: UsageViewKey;
  readonly normalise: boolean;
} {
  const view = new URLSearchParams(search).get('view');
  if (view === 'course') return { view: 'course', normalise: false };
  return { view: 'experiment', normalise: view !== null };
}

/** IA-20's shell placement: a destination's own page, no trail. */
export const USAGE_PLACEMENT = { screen: 'IA-20', title: USAGE_TITLE, trail: [] } as const;
