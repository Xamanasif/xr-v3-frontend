import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Academic Reviewer workspace's Phase-5 pages (boards B6-01 … B6-03, B6-11, B6-12): addresses,
 * titles and places in the shell. Sidebar owners are the active-item map's (Overview; Review queue
 * for RV-02, RV-03 and RV-06 — even when opened from Reviewed by me, B6-03 f4; Reviewed by me for
 * RV-05). A destination's own page has no crumbs (B6-01 f0 "Overview", B6-02 f0 "Review queue",
 * f1 "Reviewed by me"); a submission or an update sits under its parent list and is named by its
 * experiment (RV-v1 "The breadcrumb names the experiment"; the owner's identifier rule: no record
 * reference in a crumb, a browser tab or a prefilled place).
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

/** RV-04 Review an update (and its decided view): `/reviewer/updates/[updateId]`. */
export function reviewUpdateAddress(updateId: string): string {
  return `/reviewer/updates/${encodeURIComponent(updateId)}`;
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
const REVIEWED_CRUMB: BreadcrumbLevel = {
  label: REVIEWED_BY_ME_TITLE,
  href: REVIEWED_BY_ME_ADDRESS,
};

/**
 * The list an item page sits under (RV-v1 `parentOf`): the Review queue while the item waits for
 * the reviewer's decision, otherwise Reviewed by me.
 */
export type ReviewerParent = 'queue' | 'reviewed';

export function reviewerParentOf(waiting: boolean): ReviewerParent {
  return waiting ? 'queue' : 'reviewed';
}

/** The parent list as the breadcrumb's link (`nav.rk-crumbs a`). */
export function reviewerParentCrumb(parent: ReviewerParent): BreadcrumbLevel {
  return parent === 'reviewed' ? REVIEWED_CRUMB : QUEUE_CRUMB;
}

export function reviewerOverviewPlacement(): ReviewerPlacement {
  return { screen: 'RV-01', title: REVIEWER_OVERVIEW_TITLE, trail: [] };
}

export function reviewQueuePlacement(): ReviewerPlacement {
  return { screen: 'RV-02', title: REVIEW_QUEUE_TITLE, trail: [] };
}

export function reviewedByMePlacement(): ReviewerPlacement {
  return { screen: 'RV-05', title: REVIEWED_BY_ME_TITLE, trail: [] };
}

/**
 * An item page's place (RV-v1: "The breadcrumb names the experiment"; the owner's identifier rule —
 * no record reference in a breadcrumb, a browser tab or the "Where" of Report a problem): under its
 * parent list, the current crumb the experiment's name ("Review queue / Conduction Through a
 * Composite Wall"; the tab "Conduction Through a Composite Wall · Review queue"). Without a parent,
 * a waiting item sits under the Review queue and a decided one under Reviewed by me.
 */
function itemPlacement(screen: ScreenKey, name: string, parent: ReviewerParent): ReviewerPlacement {
  const crumb = reviewerParentCrumb(parent);
  return { screen, title: crumb.label, trail: [crumb], currentCrumb: name };
}

/** RV-03 (RV-06 once decided), named by the experiment. While it loads, "Review queue". */
export function reviewSubmissionPlacement(
  submission: {
    readonly name: string;
    readonly decided: boolean;
    readonly parent?: ReviewerParent | null;
  } | null,
): ReviewerPlacement {
  if (submission === null) return { screen: 'RV-03', title: REVIEW_QUEUE_TITLE, trail: [] };
  return itemPlacement(
    submission.decided ? 'RV-06' : 'RV-03',
    submission.name,
    submission.parent ?? reviewerParentOf(!submission.decided),
  );
}

/** RV-04 (and its decided view), named by the experiment. While it loads, "Review queue". */
export function reviewUpdatePlacement(
  update: {
    readonly name: string;
    readonly decided: boolean;
    readonly parent?: ReviewerParent | null;
  } | null,
): ReviewerPlacement {
  if (update === null) return { screen: 'RV-04', title: REVIEW_QUEUE_TITLE, trail: [] };
  return itemPlacement('RV-04', update.name, update.parent ?? reviewerParentOf(!update.decided));
}
