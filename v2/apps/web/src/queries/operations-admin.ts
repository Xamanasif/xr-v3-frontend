'use client';

/**
 * The Super Admin's Operations › Support and Access ending (Phase 6; boards B7-09, B7-10) and the
 * full Overview (SA-01, B7-01; PC-67), through `OperationsService`: every support report (SA-20;
 * one report is the reporter's own read `getMyReport`, which the Super Admin may read for every
 * report, SUP-09 — `useMyReport` in `operations.ts`), the plans ending or ended (SA-22, PC-68) and
 * the overview's figures and eight groups. Resolve and reopen are `useCommand(ports =>
 * ports.operations.resolveReport | reopenReport)`; their receipt (`SUP`) refreshes the reporter's
 * Help pages read in the same tab. Nothing is sent from the product (T-31, T-34).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { SupportState } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

export const supportReports = defineQuery({
  family: 'SUP',
  view: 'sa-support',
  deps: ['SUP', 'INST'],
  read: (ports: ProductPorts, state: SupportState | null) =>
    ports.operations.listSupportReports(state ? { state } : {}),
});

/** SA-20 (B7-09 f7, f13): every report, oldest first (the page filters Open / Resolved / All). */
export function useSupportReports(state: SupportState | null = null, enabled = true) {
  return useXrQuery(supportReports, state, { enabled });
}

export const accessEnding = defineQuery({
  family: 'ACC',
  view: 'sa-access-ending',
  deps: ['ACC', 'INST', 'REQ'],
  read: (ports: ProductPorts) => ports.operations.listAccessEnding(),
});

/** SA-22 (B7-09 f4, f5): plans ending within 15 days or ended, soonest first. */
export function useAccessEnding(enabled = true) {
  return useXrQuery(accessEnding, null, { enabled });
}

export const superAdminOverview = defineQuery({
  family: 'admin',
  view: 'sa-overview',
  deps: ['REQ', 'INST', 'ACC', 'UPD', 'EXP', 'DTR', 'PER', 'SUP', 'SUB', 'ROLE', 'CRS'],
  read: (ports: ProductPorts) => ports.operations.getSuperAdminOverview(),
});

/** SA-01 (B7-01 f0 … f3): the two figures and the eight groups, each with its first four rows. */
export function useSuperAdminOverview(enabled = true) {
  return useXrQuery(superAdminOverview, null, { enabled });
}
