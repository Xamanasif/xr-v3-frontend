import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Overview (SA-01, B7-01), Institutions (SA-06, B7-02) and Institution detail
 * (SA-07, B7-03): their addresses (ADR-0005 §2: the institution id is the canonical
 * `institutionId` segment — "Institution id exists from first approval; do not key by plan id",
 * Appendix A) and their place in the shell — Overview current on SA-01, Institutions current on
 * SA-06 and SA-07 (Appendix A §3.6). B7-03's top bar keeps the destination's name as its title
 * ("Institutions") and puts the institution's name in the current crumb.
 */
const destinationOf = (screen: 'SA-01' | 'SA-06') =>
  WORKSPACE_NAV.super_admin.destinations.find((destination) => destination.screen === screen)!;

export const OVERVIEW_ADDRESS = destinationOf('SA-01').href;
export const INSTITUTIONS_ADDRESS = destinationOf('SA-06').href;

export function institutionAddress(institutionId: string): string {
  return `${INSTITUTIONS_ADDRESS}/${encodeURIComponent(institutionId)}`;
}

/** B7-01 / B7-02 / B7-03 top bars: "Overview", "Institutions". */
export const OVERVIEW_TITLE = destinationOf('SA-01').label;
export const INSTITUTIONS_TITLE = destinationOf('SA-06').label;

export interface SuperAdminPlacement {
  readonly screen: 'SA-01' | 'SA-06' | 'SA-07';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

export function overviewPlacement(): SuperAdminPlacement {
  return { screen: 'SA-01', title: OVERVIEW_TITLE, trail: [] };
}

export function institutionsPlacement(): SuperAdminPlacement {
  return { screen: 'SA-06', title: INSTITUTIONS_TITLE, trail: [] };
}

/**
 * B7-03 top bar: title "Institutions"; crumbs "Institutions / Godavari Institute of Technology".
 * Until the institution has loaded its name is not known: the destination's own crumb stands alone.
 */
export function institutionPlacement(name: string | null): SuperAdminPlacement {
  if (name === null) return { screen: 'SA-07', title: INSTITUTIONS_TITLE, trail: [] };
  return {
    screen: 'SA-07',
    title: INSTITUTIONS_TITLE,
    trail: [{ label: INSTITUTIONS_TITLE, href: INSTITUTIONS_ADDRESS }],
    currentCrumb: name,
  };
}
