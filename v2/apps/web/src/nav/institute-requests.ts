import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Institute Admin's Requests destination (Phase 3; boards B3-08, B3-09; in V3 the
 * owner-approved Institute Admin export, IA-v1): its addresses (Appendix A register: IA-17
 * `/institute/requests`, IA-18 its `?tab=devices`, the request detail
 * `/institute/requests/[requestId]` — PROPOSED, no screen id of its own, O-02 — and IA-19
 * `/institute/requests/devices/[transferId]`) and their place in the shell (Requests current on
 * every one of them, `nav/active-item.ts`). The crumbs are drawn in the page (V3); the placement
 * names the browser tab and the place a problem report starts from — never by a reference
 * (state-copy `IA-17.no-reference`): "Requests" on Requests to BITS, "Ask BITS · Requests" and
 * "Request sent · Requests" for the form and its result, "Device requests" on the tab, a request by
 * its title ("60 more licences · Requests") and a device request by its title ("VR device transfer
 * for Rahul Verma · Device requests").
 */
const destination = WORKSPACE_NAV.tenant_admin.destinations.find(
  (entry) => entry.screen === 'IA-17',
)!;

/** IA-17: `/institute/requests` (the sidebar's Requests). */
export const INSTITUTE_REQUESTS_ADDRESS = destination.href;

/** "Requests" (board 06; B3-08 top bar). */
export const INSTITUTE_REQUESTS_TITLE = destination.label;

/** IA-18: the Requests page's Device requests tab (Appendix A rule T2). */
export const DEVICE_REQUESTS_ADDRESS = `${INSTITUTE_REQUESTS_ADDRESS}?tab=devices`;

/** The request detail (B3-08 f4 … f6): `/institute/requests/[requestId]`. */
export function instituteRequestAddress(requestId: string): string {
  return `${INSTITUTE_REQUESTS_ADDRESS}/${encodeURIComponent(requestId)}`;
}

/** IA-19: `/institute/requests/devices/[transferId]`. */
export function deviceRequestAddress(transferId: string): string {
  return `${INSTITUTE_REQUESTS_ADDRESS}/devices/${encodeURIComponent(transferId)}`;
}

/**
 * "Open the payment page" (B3-08 f6 → B1-08): PU-12 by the request's opaque address
 * (`/requests/[routeId]/payment`, O-05; ADR-0009) — the requesting institution's signed-in
 * Institute Admin may open it and pay; never by the reference.
 */
export function paymentPageAddress(routeId: string): string {
  return `/requests/${encodeURIComponent(routeId)}/payment`;
}

export interface InstituteRequestsPlacement {
  readonly screen: 'IA-17' | 'IA-18' | 'IA-19' | 'institute-request-detail';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

/** "Requests", the crumb above every page under it (IA-v1 `rk-crumbs`). */
export const REQUESTS_CRUMB: BreadcrumbLevel = {
  label: INSTITUTE_REQUESTS_TITLE,
  href: INSTITUTE_REQUESTS_ADDRESS,
};

/**
 * IA-17 (IA-v1 "Requests head and tabs"): "Requests", the destination's own page; while the form
 * or its result shows in place, its crumb under "Requests" ("Ask BITS", "Request sent").
 */
export function requestsPlacement(inPlace: string | null = null): InstituteRequestsPlacement {
  if (inPlace === null) return { screen: 'IA-17', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
  return {
    screen: 'IA-17',
    title: INSTITUTE_REQUESTS_TITLE,
    trail: [REQUESTS_CRUMB],
    currentCrumb: inPlace,
  };
}

/** IA-18 (IA-v1 "IA-18 Device requests tab"): the tab reads itself, under "Requests". */
export function deviceRequestsPlacement(tabLabel: string): InstituteRequestsPlacement {
  return { screen: 'IA-18', title: tabLabel, trail: [REQUESTS_CRUMB], currentCrumb: tabLabel };
}

/**
 * The request detail (IA-v1 "IA-17 detail"): its title (the H1's words) under "Requests". Until
 * the request has loaded its title is not known: the destination's own crumb stands alone.
 */
export function requestDetailPlacement(title: string | null): InstituteRequestsPlacement {
  if (title === null) {
    return { screen: 'institute-request-detail', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
  }
  return {
    screen: 'institute-request-detail',
    title: INSTITUTE_REQUESTS_TITLE,
    trail: [REQUESTS_CRUMB],
    currentCrumb: title,
  };
}

/** IA-19 (IA-v1 "IA-19"): its title under "Requests / Device requests". */
export function deviceRequestPlacement(
  title: string | null,
  tabLabel: string,
): InstituteRequestsPlacement {
  if (title === null) {
    return { screen: 'IA-19', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
  }
  return {
    screen: 'IA-19',
    title: tabLabel,
    trail: [REQUESTS_CRUMB, { label: tabLabel, href: DEVICE_REQUESTS_ADDRESS }],
    currentCrumb: title,
  };
}
