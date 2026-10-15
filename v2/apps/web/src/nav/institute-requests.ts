import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Institute Admin's Requests destination (Phase 3; boards B3-08, B3-09): its addresses
 * (Appendix A register: IA-17 `/institute/requests`, IA-18 its `?tab=devices`, the request detail
 * `/institute/requests/[requestId]` — PROPOSED, no screen id of its own, O-02 — and IA-19
 * `/institute/requests/devices/[transferId]`) and their place in the shell (Requests current on
 * every one of them, `nav/active-item.ts`). The top bars follow the boards: "Requests" alone on
 * Requests to BITS (B3-08 f0); the tab with an id of its own reads the tab, crumbed "Requests /
 * Device requests" (B3-09 f0); a record is titled with its reference under the crumbs above it —
 * "Requests / REQ-0058" (B3-08 f4), "Requests / Device requests / DTR-0018" (B3-09 f1).
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

const REQUESTS_CRUMB: BreadcrumbLevel = {
  label: INSTITUTE_REQUESTS_TITLE,
  href: INSTITUTE_REQUESTS_ADDRESS,
};

/** IA-17 (B3-08 f0 … f3, f7): "Requests", the destination's own page — also while the form shows. */
export function requestsPlacement(): InstituteRequestsPlacement {
  return { screen: 'IA-17', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
}

/** IA-18 (B3-09 f0): the tab reads itself, crumbed "Requests / Device requests". */
export function deviceRequestsPlacement(tabLabel: string): InstituteRequestsPlacement {
  return { screen: 'IA-18', title: tabLabel, trail: [REQUESTS_CRUMB], currentCrumb: tabLabel };
}

/**
 * The request detail (B3-08 f4 … f6): its reference under "Requests". Until the request has loaded
 * its reference is not known: the destination's own crumb stands alone.
 */
export function requestDetailPlacement(reference: string | null): InstituteRequestsPlacement {
  if (reference === null) {
    return { screen: 'institute-request-detail', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
  }
  return {
    screen: 'institute-request-detail',
    title: reference,
    trail: [REQUESTS_CRUMB],
    currentCrumb: reference,
  };
}

/** IA-19 (B3-09 f1 … f5): "Requests / Device requests / DTR-0018". */
export function deviceRequestPlacement(
  reference: string | null,
  tabLabel: string,
): InstituteRequestsPlacement {
  if (reference === null) {
    return { screen: 'IA-19', title: INSTITUTE_REQUESTS_TITLE, trail: [] };
  }
  return {
    screen: 'IA-19',
    title: reference,
    trail: [REQUESTS_CRUMB, { label: tabLabel, href: DEVICE_REQUESTS_ADDRESS }],
    currentCrumb: reference,
  };
}
