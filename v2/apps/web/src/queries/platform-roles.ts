'use client';

/**
 * The Super Admin's Platform roles (Phase 6; boards B7-08, B7-10, B7-12), through
 * `PlatformRoleService`: each tab's holders (SA-16) and one holder (SA-17), each with its scopes
 * as facts (PC-70). Register, assign, withdraw and restore are commands — `useCommand(ports =>
 * ports.platformRoles.registerHolder | assignScope | withdrawScope | restoreScope)`; their receipt
 * (`ROLE`) refreshes every scope-dependent read in the tab at once (the holder's queue, library
 * and course list — "They stop seeing it straight away"). Nothing is sent from here (T-11).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { RoleHolderId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

const DEPS = ['ROLE', 'CRS', 'EXP'] as const;

export type HolderTab = 'vendors' | 'reviewers' | 'content-managers';

export const roleHolders = defineQuery({
  family: 'ROLE',
  view: 'sa-holders',
  deps: DEPS,
  read: (ports: ProductPorts, filter: { readonly tab: HolderTab; readonly search: string }) =>
    ports.platformRoles.listHolders({
      tab: filter.tab,
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

/** SA-16 (B7-08 f0, f3, f7): one tab's holders, first registered first (each tab read for its count). */
export function useRoleHolders(tab: HolderTab, search = '', enabled = true) {
  return useXrQuery(roleHolders, { tab, search }, { enabled, keepPrevious: true });
}

export const roleHolder = defineQuery({
  family: 'ROLE',
  view: 'sa-holder',
  deps: DEPS,
  read: (ports: ProductPorts, id: string) => ports.platformRoles.getHolder(id as RoleHolderId),
});

/** SA-17 (B7-08 f1, f4, f5, f7, f8): the holder and its scopes. */
export function useRoleHolder(id: string | null, enabled = true) {
  return useXrQuery(roleHolder, id ?? '', { enabled: enabled && id !== null });
}
