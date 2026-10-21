/**
 * The words of the Academic Reviewer's lists — RV-01 Overview, RV-02 Review queue and RV-05
 * Reviewed by me — in the V3 Refined B design: the owner-approved export's
 * (design/v3-refined-b/roles/RV-v1 `project/RV.dc.html`). Each drawn phrase is in its template or
 * script verbatim, and each composed line takes the script's form (`overviewVals`, `queueVals`,
 * `reviewedVals`, `fromOf`, `focusOf`) with the records' values (`reviewer-lists.test.ts`). No line
 * or name carries an internal reference (SUB-, UPD-): each record is named by its experiment
 * (the owner's identifier rule). The review type's words and where a decided item is now are the
 * role's shared words (`rv-shared.ts`). What the export does not word is a provisional entry of the
 * state-copy register (`state-copy-reviewer-lists.ts`, VD-12).
 */
import { stateWords } from './state-copy';

/** "1 item", "4 items" (the script's `plural(n, w)`). */
/** The three kinds of review work in the queue (the service's `type`). */
export type ReviewItemType = 'new' | 'recheck' | 'update';

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** The failed lists' line and action (`rk-state` "Nothing has changed. Try again."). */
export const LIST_FAILED = {
  line: 'Nothing has changed. Try again.',
  retry: 'Try again',
} as const;

/** "Clear filters" (`button.rk-clear`, and the no-match state's `button.rb-btn`). */
export const CLEAR_FILTERS = 'Clear filters';

/** A chip's words: “Search: “dist””, “Course: CHE ZG513” (`queueVals` `chips`). */
export function searchChip(search: string): string {
  return `Search: “${search.trim()}”`;
}

export function courseChip(code: string): string {
  return `Course: ${code}`;
}

/** The format badges' name (`fmtAria`): “Formats: WEB, VR”. */
export function formatsLabel(codes: readonly string[]): string {
  return `Formats: ${codes.join(', ')}`;
}

// ---- RV-01 Overview (`overviewVals`) -----------------------------------------------------------

export const REVIEWER_OVERVIEW = {
  /** `div.rk-head-act > a.rb-btn`. */
  openQueue: 'Open the review queue',
  /** `section.rv-wait` `h2.rb-h2` and its `p.rb-note`. */
  waitingTitle: 'Waiting for your decision',
  oldestFirst: 'Oldest first',
  nothingWaiting: 'Nothing waiting',
  /** `p.rv-next-k`. */
  nextInLine: 'Next in line · waiting longest',
  /** `h3.rv-then`. */
  then: 'Then, oldest first',
  /** The desk's actions (`act`): the first, an update, any other. */
  startReview: 'Start review',
  reviewUpdate: 'Review update',
  review: 'Review',
  /** The calm state (`div.rb-calm`) and its action (`div.rv-calm-act`). */
  calmTitle: 'Nothing is waiting for your decision',
  calmLine: 'New submissions, updates and re-checks appear here when they reach you.',
  openReviewed: 'Open Reviewed by me',
  /** The side cards. */
  inYourQueue: 'In your queue',
  scopeTitle: 'Your review scope',
  scopeNote: 'Only these courses reach your queue.',
  recentTitle: 'Recently decided',
  allDecisions: 'All decisions',
  noRecent: 'Nothing decided yet. Your decisions appear here, newest first.',
} as const;

/** "In your queue" by type (`overviewVals` `types`): the title and the line under it. */
export const QUEUE_TYPES: Readonly<
  Record<ReviewItemType, { readonly title: string; readonly detail: string }>
> = {
  new: { title: 'New submissions', detail: 'From vendors' },
  recheck: { title: 'Re-checks', detail: 'Sent back by the Content Manager' },
  update: { title: 'Updates', detail: 'Corrections to published experiments' },
};

/** The head's line (`OV.sub`): “4 items are waiting for your academic decision, oldest first.” */
export function overviewLead(waiting: number): string {
  if (waiting === 0) return 'Nothing is waiting for your decision.';
  if (waiting === 1) return '1 item is waiting for your academic decision.';
  return `${waiting} items are waiting for your academic decision, oldest first.`;
}

/** New submissions' line: “From vendors · 1 is a resubmission” (`nResub`). */
export function newSubmissionsDetail(resubmissions: number): string {
  if (resubmissions === 0) return QUEUE_TYPES.new.detail;
  return `${QUEUE_TYPES.new.detail} · ${resubmissions}${resubmissions === 1 ? ' is a resubmission' : ' are resubmissions'}`;
}

/** A type row's name: “New submissions: 2 items. Open them in the review queue”. */
export function queueTypeLabel(title: string, count: number): string {
  return `${title}: ${plural(count, 'item')}. Open them in the review queue`;
}

/** A scope row's name: “CHE ZG513 Process Instrumentation & Control. Open the review queue …”. */
export function scopeCourseLabel(code: string, name: string | null): string {
  return `${code}${name ? ` ${name}` : ''}. Open the review queue for this course`;
}

/** The desk action's name (`aria`): the first, an update, any other. */
export function deskActionLabel(first: boolean, update: boolean, name: string): string {
  if (first) return `Start review: ${name}`;
  return update ? `Review the update to ${name}` : `Review ${name}`;
}

/** A recent decision's words (`recent` `dec`): “Approved”, “Update approved”, “Returned to vendor”, “Returned”. */
export function recentDecisionWords(approved: boolean, update: boolean): string {
  if (approved) return update ? 'Update approved' : 'Approved';
  return update ? 'Returned' : 'Returned to vendor';
}

/** A recent decision's name: “Forced Convection, returned to vendor on 24 Aug 2026. Now: … Open it”. */
export function recentDecisionLabel(
  name: string,
  decision: string,
  when: string,
  now: string,
): string {
  return `${name}, ${decision.toLowerCase()} on ${when}. Now: ${now}. Open it`;
}

// ---- What waits: who sent it and what to look at (`fromOf`, `focusOf`) -----------------------

/**
 * Who sent an item (`p.rv-from`, the queue's `span.rk-small`): a first review “Revision 1 · from
 * Meridian Virtual Labs”; a resubmission “Resubmitted 8 Oct · from Northline Simulation Studio”; an
 * update “From Kavya Nair, Content Manager”; a re-check “Sent back by the Content Manager” (the
 * reads hold neither the revision nor the person who sent it back: state-copy `RV-01.recheck-from`).
 */
export function fromWords(
  item:
    | { readonly kind: 'new'; readonly who: string }
    | { readonly kind: 'resubmission'; readonly who: string; readonly resubmitted: string }
    | { readonly kind: 'update'; readonly person: string }
    | { readonly kind: 'recheck' },
): string {
  switch (item.kind) {
    case 'new':
      return `Revision 1 · from ${item.who}`;
    case 'resubmission':
      return `Resubmitted ${item.resubmitted} · from ${item.who}`;
    case 'update':
      return `From ${item.person}, Content Manager`;
    case 'recheck':
      return QUEUE_TYPES.recheck.detail;
  }
}

/** The flag of a first review without outcomes (`focusOf`): “No learning outcomes yet”. */
export const NO_OUTCOMES_YET = 'No learning outcomes yet';

/** The Content Manager's reason, quoted and cut at a word near 74 characters (`excerpt`). */
export function recheckFocus(reason: string): string {
  const cut = reason.length <= 74 ? reason : `${reason.slice(0, 74).replace(/\s+\S*$/, '')}…`;
  return `“${cut}”`;
}

// ---- RV-02 Review queue (`queueVals`) ----------------------------------------------------------

export type QueueTab = 'all' | ReviewItemType;

export const REVIEW_QUEUE = {
  /** `p.rk-sub`. */
  lead: 'Everything waiting for your academic decision, oldest first. Drafts are never listed.',
  /** `section.rk-surface[aria-label]`. */
  surfaceLabel: 'Items waiting for your decision',
  /** The tabs (`div.rk-tabs[aria-label]`). */
  tabsLabel: 'Review type',
  tabs: {
    all: 'All',
    new: 'New submissions',
    recheck: 'Re-checks',
    update: 'Updates',
  } satisfies Record<QueueTab, string>,
  /** The toolbar. */
  toolsLabel: 'Filter the review queue',
  search: 'Search the queue',
  searchPlaceholder: 'Name, course or sender',
  course: 'Course',
  allCourses: 'All courses',
  /** The table. */
  caption: 'Items waiting for your decision, oldest first',
  columns: {
    item: 'Experiment',
    kind: 'Review type',
    focus: 'What to look at',
    when: 'Waiting',
  },
  /** The narrow layouts' inline label (`span.rk-inlabel`). */
  waitingLabel: 'Waiting',
  /** No match. */
  noMatchTitle: 'No items match these filters',
  noMatchLine: 'Try fewer filters, or a different spelling of the name, course or sender.',
  /** Nothing waiting. */
  emptyTitle: 'Nothing is waiting for your decision',
  emptyLine:
    'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
  openReviewed: 'Open Reviewed by me',
  /** Loading and failed. */
  loading: 'Loading the review queue…',
  failedTitle: 'We couldn’t load the review queue',
} as const;

/** The count (`Q.count`): “4 items · oldest first”; filtered, “1 of 4 items · oldest first”. */
export function queueCountWords(shown: number, all: number, filtered: boolean): string {
  return filtered
    ? `${shown} of ${plural(all, 'item')} · oldest first`
    : `${plural(all, 'item')} · oldest first`;
}

/**
 * A row's name (`r.aria`): “Flash Distillation, new submission, waiting since 24 Aug 2026. Review
 * it”; with the tag's detail, “Distillation Column, update 1.2 → 1.3, waiting since …”.
 */
export function queueRowLabel(
  name: string,
  kind: string,
  detail: string | null,
  since: string,
): string {
  return `${name}, ${kind.toLowerCase()}${detail ? ` ${detail}` : ''}, waiting since ${since}. Review it`;
}

// ---- RV-05 Reviewed by me (`reviewedVals`) -----------------------------------------------------

export type ReviewedTab = 'all' | 'new' | 'update';

export const REVIEWED_BY_ME = {
  /** `p.rk-sub`. */
  lead: 'What you approved or returned, newest first. Opening one shows it read-only.',
  surfaceLabel: 'Your decisions',
  tabsLabel: 'Show',
  tabs: {
    all: 'All',
    new: 'New submissions',
    update: 'Updates',
  } satisfies Record<ReviewedTab, string>,
  toolsLabel: 'Filter your decisions',
  search: 'Search your decisions',
  searchPlaceholder: 'Name or course',
  caption: 'Your decisions, newest first',
  columns: {
    item: 'Experiment',
    kind: 'Type',
    decision: 'Your decision',
    now: 'Where it is now',
  },
  /** The narrow layouts' inline labels. */
  decidedLabel: 'Decided',
  nowLabel: 'Now:',
  noMatchTitle: 'No decisions match these filters',
  noMatchLine: 'Try fewer filters, or a different spelling of the name or course.',
  emptyTitle: 'You haven’t decided anything yet',
  emptyLine: 'Items you approve or return appear here, newest first.',
  openQueue: 'Open the review queue',
  loading: 'Loading your decisions…',
  failedTitle: 'We couldn’t load your decisions',
} as const;

/** The count (`R.count`): “9 decisions · newest first”; filtered, “4 of 9 decisions · newest first”. */
export function decisionsCountWords(shown: number, all: number, filtered: boolean): string {
  return filtered
    ? `${shown} of ${plural(all, 'decision')} · newest first`
    : `${plural(all, 'decision')} · newest first`;
}

/**
 * The decision's words (`decLabel`): “Approved”, “Update approved”, “Returned to vendor”,
 * “Returned to the Content Manager”.
 */
export function decisionWords(approved: boolean, update: boolean): string {
  if (approved) return update ? 'Update approved' : 'Approved';
  return update ? 'Returned to the Content Manager' : 'Returned to vendor';
}

/** A row's name (`r.aria`): “Forced Convection, returned to vendor on 24 Aug 2026. Open it”. */
export function decisionRowLabel(name: string, decision: string, when: string): string {
  return `${name}, ${decision.toLowerCase()} on ${when}. Open it`;
}

/** The overview's loading and failed words (undrawn: state-copy `RV-01.loading`, `RV-01.failed`). */
export function overviewStateWords(state: 'loading' | 'failed'): string {
  return stateWords(state === 'loading' ? 'RV-01.loading' : 'RV-01.failed');
}
