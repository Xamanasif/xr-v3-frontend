/**
 * "Where did it happen?" — the page the person came from (board 07 "State 1 · Report a problem":
 * "“Where” is pre-filled from the page the person came from"; the field hint "Filled in from the
 * page you came from. Change it if needed."). WP-0.13 interim rule, PROVISIONAL:
 *
 * - The place is the last page the person saw **outside Help & support**: Help is reached from the
 *   page where something went wrong (the sidebar foot, the account menu, a banner), so the Help
 *   landing and the report pages are never the place itself.
 * - It is written in the page's own words — its crumbs and title as the top bar shows them,
 *   joined by " · " as board 07 writes places ("Content library · Forced Convection") — never an
 *   address (board 08 "Never show route names").
 * - Kept in memory for the signed-in person in this browser tab only, like the rail preference
 *   (ADR-0004 option A): nothing is stored, a reload forgets it, and another person signed in in
 *   the same tab never sees it. With no such page yet, the field starts empty.
 */
const origins = new Map<string, string>();

export interface PageVisit {
  /** The page's words, outermost crumb first, the page's own title last. */
  readonly words: readonly string[];
  /** A Help & support page (XS-07): not a place a problem is reported about. */
  readonly help: boolean;
}

/** Records the page the person is on now. */
export function recordPageVisit(personId: string, visit: PageVisit): void {
  if (visit.help) return;
  const words = visit.words.map((word) => word.trim()).filter((word) => word.length > 0);
  if (words.length > 0) origins.set(personId, words.join(' · '));
}

/** The place to pre-fill for this person: the last page outside Help, or `''`. */
export function originOf(personId: string): string {
  return origins.get(personId) ?? '';
}

/** Tests only: forget every recorded place (a new tab). */
export function forgetPageVisits(): void {
  origins.clear();
}
