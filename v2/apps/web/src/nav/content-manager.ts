import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Content Manager workspace's Phase-5 pages (boards B6-05 … B6-08, B6-10 … B6-12): addresses,
 * titles and places in the shell. Sidebar owners are the active-item map's (Overview; Ready to
 * publish for CM-02, CM-03; Content library for CM-04, CM-05; Course codes for CM-09). Updates
 * (CM-08) and the correction steps (CM-06, CM-07) are Phase 6: their addresses are not built and
 * the sidebar does not list Updates yet. Top bars: a destination's own page has no crumbs; a
 * decision "Ready to publish / SUB-0077" (B6-07 f0); a published experiment "Content library /
 * Distillation Column" (B6-08 f0).
 */
type CmDestination = 'CM-01' | 'CM-02' | 'CM-04' | 'CM-09';

const destinationOf = (screen: CmDestination) =>
  WORKSPACE_NAV.content_manager.destinations.find((destination) => destination.screen === screen)!;

export const CM_HOME_ADDRESS = destinationOf('CM-01').href;
export const READY_TO_PUBLISH_ADDRESS = destinationOf('CM-02').href;
export const CONTENT_LIBRARY_ADDRESS = destinationOf('CM-04').href;
export const COURSE_CODES_ADDRESS = destinationOf('CM-09').href;
export const CM_HELP_ADDRESS = WORKSPACE_NAV.content_manager.help.href;

export const CM_OVERVIEW_TITLE = destinationOf('CM-01').label;
export const READY_TO_PUBLISH_TITLE = destinationOf('CM-02').label;
export const CONTENT_LIBRARY_TITLE = destinationOf('CM-04').label;
export const COURSE_CODES_TITLE = destinationOf('CM-09').label;

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
