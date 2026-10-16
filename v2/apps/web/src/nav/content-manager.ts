import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Content Manager workspace's pages (Phase 5: boards B6-05 … B6-08, B6-10 … B6-12; Phase 6:
 * B6-09, B6-13, B7-11): addresses, titles and places in the shell. Sidebar owners are the
 * active-item map's (Overview; Ready to publish for CM-02, CM-03; Content library for CM-04,
 * CM-05; Updates for CM-08 and the drafts CM-06 and CM-07 open; Course codes for CM-09). Top bars:
 * a destination's own page has no crumbs; a decision "Ready to publish / SUB-0077" (B6-07 f0); a
 * published experiment "Content library / Distillation Column" (B6-08 f0); an update "Updates /
 * UPD-0005" (B6-09 f1). The correction entries (CM-06 "Edit catalogue details", CM-07 "Edit
 * delivery link", "Start a correction") open or join the one update and land on its page, the
 * field they name focused (`?focus=summary` · `?focus=web-link`; routes.json CM-06 / CM-07).
 */
type CmDestination = 'CM-01' | 'CM-02' | 'CM-04' | 'CM-08' | 'CM-09';

const destinationOf = (screen: CmDestination) =>
  WORKSPACE_NAV.content_manager.destinations.find((destination) => destination.screen === screen)!;

export const CM_HOME_ADDRESS = destinationOf('CM-01').href;
export const READY_TO_PUBLISH_ADDRESS = destinationOf('CM-02').href;
export const CONTENT_LIBRARY_ADDRESS = destinationOf('CM-04').href;
export const COURSE_CODES_ADDRESS = destinationOf('CM-09').href;
export const UPDATES_ADDRESS = destinationOf('CM-08').href;
export const CM_HELP_ADDRESS = WORKSPACE_NAV.content_manager.help.href;

export const CM_OVERVIEW_TITLE = destinationOf('CM-01').label;
export const READY_TO_PUBLISH_TITLE = destinationOf('CM-02').label;
export const CONTENT_LIBRARY_TITLE = destinationOf('CM-04').label;
export const COURSE_CODES_TITLE = destinationOf('CM-09').label;
export const UPDATES_TITLE = destinationOf('CM-08').label;

/** The library's tabs (B6-06 f1: Ready · In review · With vendor · Published; rule T2 `?tab=`). */
export const LIBRARY_TABS = ['ready', 'in-review', 'with-vendor', 'published'] as const;
export type LibraryTab = (typeof LIBRARY_TABS)[number];

/** `?tab=` of the library address (unknown or missing: Ready). */
export function libraryTabOf(search: string): LibraryTab {
  const tab = new URLSearchParams(search).get('tab');
  return (LIBRARY_TABS as readonly string[]).includes(tab ?? '') ? (tab as LibraryTab) : 'ready';
}

/** CM-04 on a tab (Ready carries no parameter). */
export function libraryAddress(tab: LibraryTab = 'ready'): string {
  return tab === 'ready' ? CONTENT_LIBRARY_ADDRESS : `${CONTENT_LIBRARY_ADDRESS}?tab=${tab}`;
}

/** CM-03: `/content-manager/decisions/[submissionId]`. */
export function publicationDecisionAddress(submissionId: string): string {
  return `/content-manager/decisions/${encodeURIComponent(submissionId)}`;
}

/** CM-05: `/content-manager/published/[experimentId]`. */
export function publishedExperimentAddress(experimentId: string): string {
  return `/content-manager/published/${encodeURIComponent(experimentId)}`;
}

/**
 * The field a correction entry focuses on the update's page: CM-06 "Edit catalogue details" the
 * summary, CM-07 "Edit delivery link" the WEB link (B6-08 "focus on the summary" / "focus on the
 * web link"). "Start a correction" and "Open update" focus nothing.
 */
export const CORRECTION_FOCUS = ['summary', 'web-link'] as const;
export type CorrectionFocus = (typeof CORRECTION_FOCUS)[number];

/** `?focus=` of an update's address (unknown or missing: none). */
export function correctionFocusOf(search: string): CorrectionFocus | null {
  const focus = new URLSearchParams(search).get('focus');
  return (CORRECTION_FOCUS as readonly string[]).includes(focus ?? '')
    ? (focus as CorrectionFocus)
    : null;
}

/** CM-08 detail (and the drafts CM-06 / CM-07 open): `/content-manager/updates/[updateId]`. */
export function correctionAddress(updateId: string, focus: CorrectionFocus | null = null): string {
  const base = `${UPDATES_ADDRESS}/${encodeURIComponent(updateId)}`;
  return focus ? `${base}?focus=${focus}` : base;
}

export interface CmPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const READY_CRUMB: BreadcrumbLevel = {
  label: READY_TO_PUBLISH_TITLE,
  href: READY_TO_PUBLISH_ADDRESS,
};
const LIBRARY_CRUMB: BreadcrumbLevel = {
  label: CONTENT_LIBRARY_TITLE,
  href: CONTENT_LIBRARY_ADDRESS,
};
const UPDATES_CRUMB: BreadcrumbLevel = { label: UPDATES_TITLE, href: UPDATES_ADDRESS };

export function cmOverviewPlacement(): CmPlacement {
  return { screen: 'CM-01', title: CM_OVERVIEW_TITLE, trail: [] };
}

export function readyToPublishPlacement(): CmPlacement {
  return { screen: 'CM-02', title: READY_TO_PUBLISH_TITLE, trail: [] };
}

export function contentLibraryPlacement(): CmPlacement {
  return { screen: 'CM-04', title: CONTENT_LIBRARY_TITLE, trail: [] };
}

export function courseCodesPlacement(): CmPlacement {
  return { screen: 'CM-09', title: COURSE_CODES_TITLE, trail: [] };
}

/** B6-07 f0 "Ready to publish / SUB-0077"; while it loads, "Ready to publish". */
export function publicationDecisionPlacement(
  submission: { readonly id: string; readonly name: string } | null,
): CmPlacement {
  if (submission === null) return { screen: 'CM-03', title: READY_TO_PUBLISH_TITLE, trail: [] };
  return {
    screen: 'CM-03',
    title: submission.name,
    trail: [READY_CRUMB],
    currentCrumb: submission.id,
  };
}

/** B6-08 f0 "Content library / Distillation Column"; while it loads, "Content library". */
export function publishedExperimentPlacement(name: string | null): CmPlacement {
  if (name === null) return { screen: 'CM-05', title: CONTENT_LIBRARY_TITLE, trail: [] };
  return { screen: 'CM-05', title: name, trail: [LIBRARY_CRUMB], currentCrumb: name };
}

/** B6-09 f0 "Updates": the destination's own page. */
export function updatesPlacement(): CmPlacement {
  return { screen: 'CM-08', title: UPDATES_TITLE, trail: [] };
}

/** B6-09 f1 "Updates / UPD-0005" (the mobile top bar: "Updates"); while it loads, "Updates". */
export function correctionPlacement(updateId: string | null): CmPlacement {
  if (updateId === null) return { screen: 'CM-08', title: UPDATES_TITLE, trail: [] };
  return { screen: 'CM-08', title: UPDATES_TITLE, trail: [UPDATES_CRUMB], currentCrumb: updateId };
}
