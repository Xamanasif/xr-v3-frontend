import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Platform roles (Phase 6; boards B7-08, B7-10, B7-12): the holders by tab
 * (SA-16) and one holder (SA-17) — addresses (Appendix A register routes: `/admin/roles` with
 * `?tab=reviewers|content-managers`, Vendors the default with no parameter, `?tab=vendors`
 * accepted and normalised; `/admin/roles/[holderId]`) and their place in the shell: "Platform
 * roles" current on both. Top bars: "Platform roles" (B7-08 f0); "Platform roles / Dr K. Iyer"
 * (f1); mobile "Platform roles". Nothing is sent when a holder is registered (T-11).
 */
const destination = WORKSPACE_NAV.super_admin.destinations.find(
  (candidate) => candidate.screen === 'SA-16',
)!;

export const ROLES_ADDRESS = destination.href;
export const ROLES_TITLE = destination.label;

/** B7-08 tabs (rule T3: `role=tablist` buttons): Vendors · Reviewers · Content Managers. */
export const ROLE_TABS = ['vendors', 'reviewers', 'content-managers'] as const;
export type RoleTab = (typeof ROLE_TABS)[number];

/** `?tab=` of the address; `null` for a value that names no tab (missing: Vendors). */
export function roleTabOf(search: string): RoleTab | null {
  const tab = new URLSearchParams(search).get('tab');
  if (tab === null) return 'vendors';
  return (ROLE_TABS as readonly string[]).includes(tab) ? (tab as RoleTab) : null;
}

/** SA-16 on a tab (Vendors carries no parameter). */
export function rolesAddress(tab: RoleTab = 'vendors'): string {
  return tab === 'vendors' ? ROLES_ADDRESS : `${ROLES_ADDRESS}?tab=${tab}`;
}

/** SA-17: `/admin/roles/[holderId]`. */
export function holderAddress(holderId: string): string {
  return `${ROLES_ADDRESS}/${encodeURIComponent(holderId)}`;
}

export interface RolesPlacement {
  readonly screen: 'SA-16' | 'SA-17';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const ROLES_CRUMB: BreadcrumbLevel = { label: ROLES_TITLE, href: ROLES_ADDRESS };

export function rolesPlacement(): RolesPlacement {
  return { screen: 'SA-16', title: ROLES_TITLE, trail: [] };
}

/** B7-08 f1 "Platform roles / Dr K. Iyer"; while it loads, "Platform roles". */
export function holderPlacement(name: string | null): RolesPlacement {
  return name === null
    ? { screen: 'SA-17', title: ROLES_TITLE, trail: [] }
    : { screen: 'SA-17', title: ROLES_TITLE, trail: [ROLES_CRUMB], currentCrumb: name };
}
