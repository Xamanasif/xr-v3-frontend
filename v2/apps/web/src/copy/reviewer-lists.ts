/**
 * The words of Phase 5’s Academic Reviewer lists: RV-01 Overview (board B6-01 f0 … f2), RV-02
 * Review queue (B6-02 f0, f2 … f5; B6-11 f13, f14; B6-12 f0) and RV-05 Reviewed by me (B6-02 f1).
 * Every phrase is the frozen boards’ own, found verbatim in their markup or script
 * (`reviewer-lists.test.ts`); the composed lines take the boards’ forms (B6-01 script `qFields`,
 * the overview’s `att` and `rvLine`, the reviewed list’s `rbCount`) with the records’ values —
 * names, ids, codes and dates are never copied from the boards. What B6-01 and B6-02 do not word
 * is a provisional entry of the state-copy register (`state-copy-reviewer-lists.ts`, VD-12).
 */
import { stateWords } from './state-copy';

export type ReviewItemType = 'new' | 'update' | 'recheck';

/** “1 item”, “4 items” (the boards’ `plural(n, 'item')`). */
function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// ---- RV-01 Overview (B6-01 f0 … f2) -----------------------------------------------------------

export const REVIEWER_OVERVIEW = {
  /** `div.xw-actions > a.xr-btn--secondary`. */
  openQueue: 'Open the review queue',
  /** `section.xr-section` “Waiting for your decision”. */
  sectionTitle: 'Waiting for your decision',
  /** A row’s action: “Review” (RV-03); an update’s “Review update” (RV-04, Phase 6). */
  review: 'Review',
  reviewUpdate: 'Review update',
  /** f1 “Nothing waiting”: `div.xr-section > div.xr-empty` with the done icon in the ok tint. */
  emptyTitle: 'Nothing is waiting for your decision',
  emptyLine: 'New submissions, updates and re-checks appear here when they reach you.',
  openReviewed: 'Open Reviewed by me',
} as const;

/** `p.xg-scope`: “You review: ME ZG523 · MEL ZG512 · CHE ZG513” (OD-B6-01 sample scope). */
export function scopeWords(codes: readonly string[]): string {
  return `You review: ${codes.join(' · ')}`;
}

/**
 * `p.xv-statusline[role=status]` (`rvLine`): “**4 items** waiting · **1** re-check from the
 * Content Manager · **1** update” — each part a figure and its words.
 */
export function statusLineParts(
  items: readonly { readonly type: ReviewItemType }[],
): readonly { readonly figure: string; readonly words: string }[] {
  const rechecks = items.filter((item) => item.type === 'recheck').length;
  const updates = items.filter((item) => item.type === 'update').length;
  return [
    { figure: plural(items.length, 'item'), words: 'waiting' },
    {
      figure: String(rechecks),
      words:
        rechecks === 1 ? 're-check from the Content Manager' : 're-checks from the Content Manager',
    },
    { figure: String(updates), words: updates === 1 ? 'update' : 'updates' },
  ];
}

/** The primary action (`oldest`): “Review the oldest — Flash Distillation”. */
export function oldestWords(name: string): string {
  return `Review the oldest — ${name}`;
}

/** The section meta: “4 items · oldest first” (`attCount`). */
export function attentionCountWords(count: number): string {
  return `${plural(count, 'item')} · oldest first`;
}

/** A row’s title: “Review: …”, “Re-check: …”, “Update: …”. */
export function attentionTitle(type: ReviewItemType, name: string): string {
  if (type === 'update') return `Update: ${name}`;
  if (type === 'recheck') return `Re-check: ${name}`;
  return `Review: ${name}`;
}

/**
 * A row’s line, as the script composes it: a submission “<sub-line> · <vendor> · <date>”; a
 * re-check “Content Manager · <date> · “<her reason>””; an update “<sub-line> · from <who> ·
 * <date>”. A re-check without a reason (undrawn) ends at the date (state-copy `RV-01.recheck-reason`).
 */
export function attentionSub(item: {
  readonly type: ReviewItemType;
  readonly subLine: string;
  readonly who: string;
  readonly since: string;
  readonly reason: string | null;
}): string {
  if (item.type === 'update') return `${item.subLine} · from ${item.who} · ${item.since}`;
  if (item.type === 'recheck') {
    return item.reason
      ? `Content Manager · ${item.since} · “${item.reason}”`
      : `Content Manager · ${item.since}`;
  }
  return `${item.subLine} · ${item.who} · ${item.since}`;
}

/** A row action’s name (`a.aria`): “Review Flash Distillation”, “Review update Distillation Column”. */
export function attentionActionLabel(type: ReviewItemType, name: string): string {
  return type === 'update' ? `Review update ${name}` : `Review ${name}`;
}

// ---- RV-02 Review queue (B6-02 f0, f2 … f5; B6-11 f13, f14; B6-12 f0) ------------------------

export const REVIEW_QUEUE = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  lead: 'New submissions, updates (Content Manager corrections) and re-checks — one queue',
  sectionTitle: 'Waiting for your decision',
  /** The section head’s `span.xr-meta`. */
  draftsNever: 'Drafts are never listed',
  /** The toolbar: the search, Type and Course. */
  search: 'Search the queue',
  searchPlaceholder: 'Name, ID, course or vendor',
  type: 'Type',
  allTypes: 'All types',
  course: 'Course',
  allCourses: 'All courses',
  /** `div.xr-toolbar-status > button.xr-btn--text` while a filter is applied. */
  clearFilters: 'Clear filters',
  /** The table’s header row; the last column is visually hidden. */
  columns: {
    item: 'Item',
    type: 'Type',
    formats: 'Formats',
    waitingSince: 'Waiting since',
    action: 'Action',
  },
  /** The row’s `a.xr-btn--primary.xr-btn--sm`. */
  review: 'Review',
  /** `qNoMatch`: the empty pattern with the search icon. */
  noMatchTitle: 'Nothing in the queue matches',
  noMatchLine: 'Try a different name, or clear the filters.',
  /** f2 “Loading”: skeleton rows; the status is announced. */
  loading: 'Loading the review queue',
  /** f3 “Failed + retry”; B6-11 f13. */
  failedTitle: 'We couldn’t load the review queue',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  /** f4 “Nothing waiting”; B6-11 f14. */
  emptyTitle: 'Nothing is waiting for your decision',
  emptyLine:
    'New submissions, updates from the Content Manager and re-checks appear here, oldest first.',
  openReviewed: 'Open Reviewed by me',
} as const;

/** The Type tag and option (`TW`): New submission · Update · Re-check. */
export const ITEM_TYPE_WORDS: Readonly<Record<ReviewItemType, string>> = {
  new: 'New submission',
  update: 'Update',
  recheck: 'Re-check',
};

/** The toolbar status (`qCount`): “4 of 4 items · oldest first”. */
export function queueCountWords(shown: number, all: number): string {
  return `${shown} of ${plural(all, 'item')} · oldest first`;
}

/** The row action’s name (`aria`): “Review Flash Distillation”. */
export function reviewLabel(name: string): string {
  return `Review ${name}`;
}

// ---- RV-05 Reviewed by me (B6-02 f1) ----------------------------------------------------------

export type ReviewedFilter = 'all' | 'new' | 'update';

export const REVIEWED_BY_ME = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  lead: 'What you approved or returned. Opening one shows it read-only.',
  sectionTitle: 'Your decisions',
  meta: 'Read-only · newest first',
  /** The toolbar’s one filter. */
  show: 'Show',
  filters: {
    all: 'Everything I decided',
    new: 'New submissions',
    update: 'Updates',
  } satisfies Record<ReviewedFilter, string>,
  columns: {
    item: 'Item',
    type: 'Type',
    decision: 'Your decision',
    decidedOn: 'Decided on',
    action: 'Action',
  },
  /** The Type column (`typeWord`): an update, else a new submission (a re-check included). */
  typeUpdate: 'Update',
  typeNew: 'New submission',
  /** The row’s `a.xr-btn--secondary.xr-btn--sm` (RV-06, the decided page). */
  open: 'Open',
  /** `rbNone`: nothing decided, or nothing of the kind chosen. */
  emptyTitle: 'Nothing decided yet',
  emptyLine: 'Your approvals and returns appear here, read-only.',
} as const;

/** The toolbar status (`rbCount`): “9 of 9 decisions”. */
export function decisionsCountWords(shown: number, all: number): string {
  return `${shown} of ${plural(all, 'decision')}`;
}

/** The row action’s name (`aria`): “Open Forced Convection”. */
export function openLabel(name: string): string {
  return `Open ${name}`;
}

/**
 * An approval where B6-02 f1 draws no line for where the record is now (`reviewedByMeWords`
 * answers undrawn): the decision alone, “Approved” or “Update approved” (state-copy
 * `RV-05.approved`, `RV-05.update-approved`). A return is always drawn.
 */
export function approvedOnlyWords(update: boolean): string {
  return update ? stateWords('RV-05.update-approved') : stateWords('RV-05.approved');
}
