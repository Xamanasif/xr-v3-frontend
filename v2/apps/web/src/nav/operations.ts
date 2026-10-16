import type { DeviceTransferState } from '@xr/domain';
import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Operations › Device transfers (SA-18, B3-11 f0 · f2 · f3; B7-09 f0, f2) and
 * the Device transfer decision (SA-19, B3-11 f1 · f4 … f7; B7-09 f1, f3; B7-10 f14): their
 * addresses (Appendix A register routes; the transfer id is the canonical `transferId` segment;
 * `/admin/operations` redirects to the list) and their place in the shell — Operations current in
 * the sidebar on both (Appendix A §3.6). B3-11's top bars: "Operations" on the list (no crumbs
 * above it), the transfer's reference under the "Operations" crumb on its decision
 * ("Operations / DTR-0018"), also while it has not reached BITS (B7-10 f14).
 */
const destination = WORKSPACE_NAV.super_admin.destinations.find(
  (candidate) => candidate.screen === 'SA-18',
)!;

/** `/admin/operations/device-transfers` — the Operations destination opens Device transfers. */
export const DEVICE_TRANSFERS_ADDRESS = destination.href;

/** "Operations" (board 06 label): the list's top-bar title and the decision's crumb. */
export const OPERATIONS_TITLE = destination.label;

/** The failed states' "Report a problem": the Super Admin's own Help report form (XS-07). */
export const OPERATIONS_REPORT_ADDRESS = `${WORKSPACE_NAV.super_admin.help.href}/report`;

/**
 * The list's "Show" filter (B3-11 `xl-seg`: "Forwarded to BITS · Still with an institution ·
 * Approved"), in the address as `?show=`; the forwarded view is the list's own address.
 */
export const TRANSFER_SHOWS = ['forwarded', 'with-institution', 'approved'] as const;
export type TransferShow = (typeof TRANSFER_SHOWS)[number];

/** The canonical state each view lists (`listDeviceTransfers({ state })`). */
export const SHOW_STATE: Readonly<Record<TransferShow, DeviceTransferState>> = {
  forwarded: 'forwarded',
  'with-institution': 'with-institute-admin',
  approved: 'approved',
};

/** The view an address's `?show=` names; `null` for a value that names none. */
export function showOf(search: string): TransferShow | null {
  const value = new URLSearchParams(search).get('show');
  if (value === null) return 'forwarded';
  return (TRANSFER_SHOWS as readonly string[]).includes(value) ? (value as TransferShow) : null;
}

export function deviceTransfersAddress(show: TransferShow = 'forwarded'): string {
  return show === 'forwarded'
    ? DEVICE_TRANSFERS_ADDRESS
    : `${DEVICE_TRANSFERS_ADDRESS}?show=${show}`;
}

/** SA-19: `/admin/operations/device-transfers/[transferId]`. */
export function deviceTransferAddress(transferId: string): string {
  return `${DEVICE_TRANSFERS_ADDRESS}/${encodeURIComponent(transferId)}`;
}

/**
 * Phase 6 (B7-09 f4, f7, f8; B7-10): Operations › Support (SA-20, `?show=open|resolved|all`, Open
 * the list's own address), a Support report (SA-21, the same SUP record as the reporter's
 * `/<base>/help/reports/[reportId]`) and Access ending (SA-22). The three tabs are links (rule T1):
 * Device transfers · Support · Access ending.
 */
export const SUPPORT_ADDRESS = '/admin/operations/support';
export const ACCESS_ENDING_ADDRESS = '/admin/operations/access-ending';
export const OPERATIONS_TABS = [
  { key: 'device-transfers', label: 'Device transfers', href: DEVICE_TRANSFERS_ADDRESS },
  { key: 'support', label: 'Support', href: SUPPORT_ADDRESS },
  { key: 'access-ending', label: 'Access ending', href: ACCESS_ENDING_ADDRESS },
] as const;

/** SA-20's views (B7-09 f7: Open · Resolved · All; Open holds open and reopened reports). */
export const SUPPORT_SHOWS = ['open', 'resolved', 'all'] as const;
export type SupportShow = (typeof SUPPORT_SHOWS)[number];

export function supportShowOf(search: string): SupportShow | null {
  const value = new URLSearchParams(search).get('show');
  if (value === null) return 'open';
  return (SUPPORT_SHOWS as readonly string[]).includes(value) ? (value as SupportShow) : null;
}

export function supportAddress(show: SupportShow = 'open'): string {
  return show === 'open' ? SUPPORT_ADDRESS : `${SUPPORT_ADDRESS}?show=${show}`;
}

/** SA-21: `/admin/operations/support/[reportId]`. */
export function supportReportAddress(reportId: string): string {
  return `${SUPPORT_ADDRESS}/${encodeURIComponent(reportId)}`;
}

export interface OperationsPlacement {
  readonly screen: 'SA-18' | 'SA-19' | 'SA-20' | 'SA-21' | 'SA-22';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

/** B3-11 f0 top bar: "Operations", the destination's own page. */
export function deviceTransfersPlacement(): OperationsPlacement {
  return { screen: 'SA-18', title: OPERATIONS_TITLE, trail: [] };
}

/** B3-11 f1 top bar: "DTR-0018" under the "Operations" crumb. */
export function deviceTransferPlacement(reference: string): OperationsPlacement {
  return {
    screen: 'SA-19',
    title: reference,
    trail: [{ label: OPERATIONS_TITLE, href: DEVICE_TRANSFERS_ADDRESS }],
  };
}

const OPERATIONS_CRUMB: BreadcrumbLevel = {
  label: OPERATIONS_TITLE,
  href: DEVICE_TRANSFERS_ADDRESS,
};

/** B7-09 f7 "Operations / Support" (mobile: "Operations"). */
export function supportPlacement(): OperationsPlacement {
  return {
    screen: 'SA-20',
    title: OPERATIONS_TITLE,
    trail: [OPERATIONS_CRUMB],
    currentCrumb: 'Support',
  };
}

/** B7-09 f8 "Operations / Support / SUP-0213"; while it loads, "Operations / Support". */
export function supportReportPlacement(reportId: string | null): OperationsPlacement {
  return reportId === null
    ? {
        screen: 'SA-21',
        title: OPERATIONS_TITLE,
        trail: [OPERATIONS_CRUMB],
        currentCrumb: 'Support',
      }
    : {
        screen: 'SA-21',
        title: OPERATIONS_TITLE,
        trail: [OPERATIONS_CRUMB, { label: 'Support', href: SUPPORT_ADDRESS }],
        currentCrumb: reportId,
      };
}

/** B7-09 f4 "Operations / Access ending" (mobile: "Operations"). */
export function accessEndingPlacement(): OperationsPlacement {
  return {
    screen: 'SA-22',
    title: OPERATIONS_TITLE,
    trail: [OPERATIONS_CRUMB],
    currentCrumb: 'Access ending',
  };
}
