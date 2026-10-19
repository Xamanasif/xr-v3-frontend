import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Requests (SA-02, B1-10) and Request decision (SA-03, B1-11): their addresses
 * (ADR-0005 §2: the request id is the canonical `requestId` segment) and their place in the shell
 * — Requests current in the sidebar on both (Appendix A §3.6), the decision under the "Requests"
 * crumb, named by its institution (the Super Admin export; never by its reference).
 */
export const REQUESTS_ADDRESS = WORKSPACE_NAV.super_admin.destinations.find(
  (destination) => destination.screen === 'SA-02',
)!.href;

export function requestAddress(requestId: string): string {
  return `${REQUESTS_ADDRESS}/${encodeURIComponent(requestId)}`;
}

/** The B1-10 top bar: "Requests", no crumbs above it (a destination's own page). */
export const REQUESTS_TITLE = 'Requests';

export interface RequestsPlacement {
  readonly screen: 'SA-02' | 'SA-03';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

export function requestsPlacement(): RequestsPlacement {
  return { screen: 'SA-02', title: REQUESTS_TITLE, trail: [] };
}

/**
 * SA-03 under "Requests", named by its institution (the Super Admin export names a request by its
 * institution, never by its reference: `title: SA.req(p[1]).inst`). Until the request has loaded
 * its institution is not known: the destination's own name stands alone.
 */
export function decisionPlacement(institution: string | null): RequestsPlacement {
  if (institution === null) return { screen: 'SA-03', title: REQUESTS_TITLE, trail: [] };
  return {
    screen: 'SA-03',
    title: REQUESTS_TITLE,
    trail: [{ label: REQUESTS_TITLE, href: REQUESTS_ADDRESS }],
    currentCrumb: institution,
  };
}
