import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Academic Reviewer workspace's Phase-5 pages (boards B6-01 … B6-03, B6-11, B6-12): addresses,
 * titles and places in the shell. Sidebar owners are the active-item map's (Overview; Review queue
 * for RV-02, RV-03 and RV-06 — even when opened from Reviewed by me, B6-03 f4; Reviewed by me for
 * RV-05). Top bars: a destination's own page has no crumbs (B6-01 f0 "Overview", B6-02 f0 "Review
 * queue", f1 "Reviewed by me"); a submission "Review queue / SUB-0077" (B6-03 f0). RV-04 Review an
 * update is Phase 6: its address is not built.
 */
type ReviewerDestination = 'RV-01' | 'RV-02' | 'RV-05';

const destinationOf = (screen: ReviewerDestination) =>
  WORKSPACE_NAV.academic_reviewer.destinations.find(
    (destination) => destination.screen === screen,
  )!;

export const REVIEWER_HOME_ADDRESS = destinationOf('RV-01').href;
export const REVIEW_QUEUE_ADDRESS = destinationOf('RV-02').href;
export const REVIEWED_BY_ME_ADDRESS = destinationOf('RV-05').href;
export const REVIEWER_HELP_ADDRESS = WORKSPACE_NAV.academic_reviewer.help.href;

export const REVIEWER_OVERVIEW_TITLE = destinationOf('RV-01').label;
export const REVIEW_QUEUE_TITLE = destinationOf('RV-02').label;
export const REVIEWED_BY_ME_TITLE = destinationOf('RV-05').label;

/** RV-03 (and RV-06, the decided read-only state): `/reviewer/submissions/[submissionId]`. */
export function reviewSubmissionAddress(submissionId: string): string {
  return `/reviewer/submissions/${encodeURIComponent(submissionId)}`;
}

/** RV-02 with its filters (`?type=new|update|recheck`, `?courseId=`). */
export function reviewQueueAddress(
  options: { readonly type?: 'new' | 'update' | 'recheck'; readonly courseId?: string } = {},
): string {
  const query = new URLSearchParams();
  if (options.type) query.set('type', options.type);
  if (options.courseId) query.set('courseId', options.courseId);
  const text = query.toString();
  return `${REVIEW_QUEUE_ADDRESS}${text ? `?${text}` : ''}`;
}

export interface ReviewerPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const QUEUE_CRUMB: BreadcrumbLevel = { label: REVIEW_QUEUE_TITLE, href: REVIEW_QUEUE_ADDRESS };

export function reviewerOverviewPlacement(): ReviewerPlacement {
  return { screen: 'RV-01', title: REVIEWER_OVERVIEW_TITLE, trail: [] };
}

export function reviewQueuePlacement(): ReviewerPlacement {
  return { screen: 'RV-02', title: REVIEW_QUEUE_TITLE, trail: [] };
}

export function reviewedByMePlacement(): ReviewerPlacement {
  return { screen: 'RV-05', title: REVIEWED_BY_ME_TITLE, trail: [] };
}

/** B6-03 f0 "Review queue / SUB-0077"; RV-06 once decided. While it loads, "Review queue". */
export function reviewSubmissionPlacement(
  submission: { readonly id: string; readonly name: string; readonly decided: boolean } | null,
): ReviewerPlacement {
  if (submission === null) return { screen: 'RV-03', title: REVIEW_QUEUE_TITLE, trail: [] };
  return {
    screen: submission.decided ? 'RV-06' : 'RV-03',
    title: submission.name,
    trail: [QUEUE_CRUMB],
    currentCrumb: submission.id,
  };
}
