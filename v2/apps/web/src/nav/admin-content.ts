import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Super Admin's Content (Phase 6; boards B7-05, B7-06, B7-10, B7-11): Updates (SA-10) and its
 * Release or hold decision (SA-11), All content (SA-12) and a Content record (SA-13) — their
 * addresses (Appendix A register routes; `/admin/content` redirects to Updates, §3.7 row 15) and
 * their place in the shell: "Content" current in the sidebar on all four (Appendix A §3.6). Top
 * bars: "Content / Updates" (B7-05 f0), "Content / Updates / UPD-0005" (f1), "Content / All
 * content" (B7-06 f0), "Content / All content / DC Motor Speed Control" (f1); the mobile top bar
 * names the destination, "Content".
 */
const destination = WORKSPACE_NAV.super_admin.destinations.find(
  (candidate) => candidate.screen === 'SA-10',
)!;

/** "Content" (board 06 label): the destination, its crumb and the mobile top bar. */
export const CONTENT_TITLE = destination.label;
/** `/admin/content/updates` — the sidebar's "Content" opens Updates (B7-05; row 15). */
export const CONTENT_UPDATES_ADDRESS = destination.href;
export const ALL_CONTENT_ADDRESS = '/admin/content/all';
/** The sub-navigation's two links (B7-05 / B7-06 `xr-tabs`: "Updates · All content", rule T1). */
export const CONTENT_TABS = [
  { key: 'updates', label: 'Updates', href: CONTENT_UPDATES_ADDRESS },
  { key: 'all', label: 'All content', href: ALL_CONTENT_ADDRESS },
] as const;

/** SA-10's three tabs (B7-05 f0, f2, f3: Waiting for you · On hold · Released), `?show=`. */
export const UPDATE_SHOWS = ['waiting', 'on-hold', 'released'] as const;
export type UpdateShow = (typeof UPDATE_SHOWS)[number];

/** The view an address's `?show=` names; `null` for a value that names none. */
export function updateShowOf(search: string): UpdateShow | null {
  const value = new URLSearchParams(search).get('show');
  if (value === null) return 'waiting';
  return (UPDATE_SHOWS as readonly string[]).includes(value) ? (value as UpdateShow) : null;
}

export function contentUpdatesAddress(show: UpdateShow = 'waiting'): string {
  return show === 'waiting' ? CONTENT_UPDATES_ADDRESS : `${CONTENT_UPDATES_ADDRESS}?show=${show}`;
}

/** SA-11: `/admin/content/updates/[updateId]`. */
export function updateDecisionAddress(updateId: string): string {
  return `${CONTENT_UPDATES_ADDRESS}/${encodeURIComponent(updateId)}`;
}

/**
 * SA-13: `/admin/content/records/[recordId]` — the id of a submission (`SUB-0085`) or of a
 * published experiment that has no submission (`distillation-column`; routes.json SA-13 "recordId
 * addresses a SUB or an EXP (union)").
 */
export function contentRecordAddress(recordId: string): string {
  return `/admin/content/records/${encodeURIComponent(recordId)}`;
}

/** Which record kind an SA-13 address names: a submission reference, else an experiment id. */
export function recordRefOf(recordId: string): {
  readonly kind: 'SUB' | 'EXP';
  readonly id: string;
} {
  return /^SUB-\d{4,}$/.test(recordId)
    ? { kind: 'SUB', id: recordId }
    : { kind: 'EXP', id: recordId };
}

export interface ContentPlacement {
  readonly screen: 'SA-10' | 'SA-11' | 'SA-12' | 'SA-13';
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const CONTENT_CRUMB: BreadcrumbLevel = { label: CONTENT_TITLE, href: CONTENT_UPDATES_ADDRESS };
const UPDATES_CRUMB: BreadcrumbLevel = { label: 'Updates', href: CONTENT_UPDATES_ADDRESS };
const ALL_CRUMB: BreadcrumbLevel = { label: 'All content', href: ALL_CONTENT_ADDRESS };

/** B7-05 f0 "Content / Updates". */
export function contentUpdatesPlacement(): ContentPlacement {
  return { screen: 'SA-10', title: CONTENT_TITLE, trail: [CONTENT_CRUMB], currentCrumb: 'Updates' };
}

/** B7-05 f1 "Content / Updates / UPD-0005"; while it loads, "Content / Updates". */
export function updateDecisionPlacement(updateId: string | null): ContentPlacement {
  return updateId === null
    ? { screen: 'SA-11', title: CONTENT_TITLE, trail: [CONTENT_CRUMB], currentCrumb: 'Updates' }
    : {
        screen: 'SA-11',
        title: CONTENT_TITLE,
        trail: [CONTENT_CRUMB, UPDATES_CRUMB],
        currentCrumb: updateId,
      };
}

/** B7-06 f0 "Content / All content". */
export function allContentPlacement(): ContentPlacement {
  return {
    screen: 'SA-12',
    title: CONTENT_TITLE,
    trail: [CONTENT_CRUMB],
    currentCrumb: 'All content',
  };
}

/** B7-06 f1 "Content / All content / DC Motor Speed Control"; while it loads, "… / All content". */
export function contentRecordPlacement(name: string | null): ContentPlacement {
  return name === null
    ? { screen: 'SA-13', title: CONTENT_TITLE, trail: [CONTENT_CRUMB], currentCrumb: 'All content' }
    : {
        screen: 'SA-13',
        title: CONTENT_TITLE,
        trail: [CONTENT_CRUMB, ALL_CRUMB],
        currentCrumb: name,
      };
}
