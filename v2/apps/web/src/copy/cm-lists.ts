/**
 * The words of Phase 5’s Content Manager lists: CM-01 Overview (board B6-05 f0 … f2), CM-02 Ready
 * to publish (B6-06 f0, f2, f3; B6-12 f2), CM-04 Content library (B6-06 f1, f4) and CM-09 Course
 * codes (B6-10 f0 … f2; B6-11 f12). Every phrase is the frozen boards’ own, found verbatim in their
 * markup or script (`cm-lists.test.ts`); the composed lines take the boards’ forms with the
 * records’ values (names, ids, codes and dates come from the sample world, never from the boards).
 * What the boards do not word is a provisional entry of the state-copy register
 * (`state-copy-cm-lists.ts`, VD-12) and is read from there.
 */
import { dateTime, dayMonthYear } from './dates';
import { stateWords } from './state-copy';

function plural(count: number, word: string): string {
  return count === 1 ? `1 ${word}` : `${count} ${word}s`;
}

// ---- CM-01 Overview (B6-05) ---------------------------------------------------------------------

export const CM_OVERVIEW = {
  /** `div.xr-phead-actions > a.xr-btn--secondary` (with the Content library icon). */
  contentLibrary: 'Content library',
  /** `section.xr-section` “Needs your decision”. */
  needsDecision: 'Needs your decision',
  /** `section.xr-section` “With others” and its meta. */
  withOthers: 'With others',
  withOthersMeta: 'For information — nothing to do',
  /** The oldest ready item’s one primary, then every other ready item’s secondary. */
  openNextReady: 'Open the next ready item',
  openDecision: 'Open decision',
  /** A “With others” row’s text link. */
  open: 'Open',
  /** f1 “Nothing waiting”: `div.xr-section > div.xr-empty` with the done icon in the ok tint. */
  nothingTitle: 'Nothing is waiting for your publication decision',
  nothingLine: 'Approved experiments and corrections that need you appear here.',
  openLibrary: 'Open the Content library',
} as const;

/** The status line’s three facts (`p.xv-statusline[role=status]`, “2 ready to publish · …”). */
export function overviewStatusLine(counts: {
  readonly ready: number;
  readonly corrections: number;
  readonly withOthers: number;
}): readonly { readonly n: string; readonly t: string }[] {
  return [
    { n: String(counts.ready), t: 'ready to publish' },
    {
      n: String(counts.corrections),
      t: counts.corrections === 1 ? 'correction needs you' : 'corrections need you',
    },
    { n: String(counts.withOthers), t: 'with others' },
  ];
}

/** “Ready to publish: Transient Cooling”. */
export function readyTitle(name: string): string {
  return `Ready to publish: ${name}`;
}

/**
 * “SUB-0074 · ME ZG523 · approved 14 Aug 2026 · oldest of 2” (the oldest) or “SUB-0070 · CHE
 * ZG513 · approved 21 Aug 2026”. A course with no platform code leaves the code out (state-copy
 * `CM-lists.no-course-code`).
 */
export function readySub(row: {
  readonly id: string;
  readonly courseCode: string | null;
  readonly approvedAt: string;
  readonly oldestOf?: number;
}): string {
  const parts = [row.id, ...(row.courseCode ? [row.courseCode] : [])];
  const oldest = row.oldestOf === undefined ? '' : ` · oldest of ${row.oldestOf}`;
  return `${parts.join(' · ')} · approved ${dayMonthYear(row.approvedAt)}${oldest}`;
}

/** The row action’s name: “Open decision for Packed Bed Pressure Drop” (B6-05/B6-06 `aria`). */
export function openDecisionLabel(name: string): string {
  return `Open decision for ${name}`;
}

/** An update named with its version label: “Induction Motor Loading 1.1”. */
function updateName(name: string, versionLabel: string | null): string {
  return versionLabel ? `${name} ${versionLabel}` : name;
}

/** “Update returned: Induction Motor Loading 1.1”. */
export function updateReturnedTitle(name: string, versionLabel: string | null): string {
  return `Update returned: ${updateName(name, versionLabel)}`;
}

/**
 * The reason as the row quotes it: its first sentence, cut with “…” when more follows (“The
 * proposed description says slip falls as the load rises…”; state-copy `CM-01.reason-excerpt`).
 */
export function reasonExcerpt(reason: string): string {
  const text = reason.trim();
  const end = /[.!?](\s|$)/.exec(text);
  if (!end || end.index + 1 >= text.length) return text;
  return `${text.slice(0, end.index)}…`;
}

/** “UPD-0006 · returned by the Academic Reviewer on 26 Aug 2026 · “The proposed description …”” */
export function updateReturnedSub(row: {
  readonly id: string;
  readonly returnedAt: string;
  readonly reason: string;
}): string {
  const reason = row.reason.trim() ? ` · “${reasonExcerpt(row.reason)}”` : '';
  return `${row.id} · returned by the Academic Reviewer on ${dayMonthYear(row.returnedAt)}${reason}`;
}

/** “Venturi Meter Calibration — with the Academic Reviewer for a re-check”. */
export function recheckTitle(name: string): string {
  return `${name} — with the Academic Reviewer for a re-check`;
}

/** “SUB-0071 · you sent it back on 25 Aug 2026”. */
export function recheckSub(id: string, sentAt: string): string {
  return `${id} · you sent it back on ${dayMonthYear(sentAt)}`;
}

/** “Distillation Column 1.3 — in academic review” · “UPD-0005 · sent on 25 Aug 2026”. */
export function updateInReviewTitle(name: string, versionLabel: string | null): string {
  return `${updateName(name, versionLabel)} — in academic review`;
}

export function updateInReviewSub(id: string, sentAt: string): string {
  return `${id} · sent on ${dayMonthYear(sentAt)}`;
}

/**
 * Undrawn on B6-05 (state-copy `CM-01.awaiting-release`): an update the Academic Reviewer approved,
 * waiting for the Super Admin — “Distillation Column 1.3 — awaiting release decision”.
 */
export function updateAwaitingTitle(name: string, versionLabel: string | null): string {
  return stateWords('CM-01.awaiting-release.title').replace(
    '{update}',
    updateName(name, versionLabel),
  );
}

export function updateAwaitingSub(id: string, approvedAt: string): string {
  return stateWords('CM-01.awaiting-release.sub')
    .replace('{id}', id)
    .replace('{date}', dayMonthYear(approvedAt));
}

/** “Boiler Drum Level 2.1 — on hold”. */
export function updateOnHoldTitle(name: string, versionLabel: string | null): string {
  return `${updateName(name, versionLabel)} — on hold`;
}

/** “UPD-0004 · the Super Admin put it on hold on 20 Aug 2026 · version 2.0 stays live”. */
export function updateOnHoldSub(id: string, heldAt: string, liveLabel: string): string {
  return `${id} · the Super Admin put it on hold on ${dayMonthYear(heldAt)} · version ${liveLabel} stays live`;
}

// ---- CM-02 Ready to publish (B6-06 f0, f2, f3) --------------------------------------------------

export const READY_TO_PUBLISH = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'Approved experiments waiting for your publication decision',
  /** `section.xr-section` “Approved by the Academic Reviewer”. */
  sectionTitle: 'Approved by the Academic Reviewer',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    approved: 'Approved',
    check: 'Publication check',
    action: 'Action',
  },
  /** `span.xr-status--ok`. */
  ready: 'Ready',
  /** Each row’s primary (`a.xr-btn--primary.xr-btn--sm`). */
  openDecision: 'Open decision',
  /** f3 “Empty”. */
  emptyTitle: 'Nothing is ready to publish',
  emptyLine: 'Experiments appear here once the Academic Reviewer approves them.',
  openLibrary: 'Open the Content library',
} as const;

/** “3 experiments approved and waiting · oldest first” (`span.xr-meta` beside the H2). */
export function readyCountWords(count: number): string {
  return `${plural(count, 'experiment')} approved and waiting · oldest first`;
}

/** The publication check’s conditions as B6-07 names them (OD-B6-03’s stated prerequisites). */
export const PUBLICATION_CHECK_WORDS = {
  'approved-by-reviewer': 'Approved by the Academic Reviewer',
  'learning-outcomes': 'Learning outcomes',
  'catalogue-details': 'Catalogue details',
  'delivery-per-format': 'Delivery details for each format',
} as const;

export type PublicationCheckName = keyof typeof PUBLICATION_CHECK_WORDS;

/**
 * The row’s blocked check (`span.xr-status--err`): one condition not met, “1 to resolve: learning
 * outcomes” (f2); several, “2 things to resolve” (the board script’s form; state-copy
 * `CM-02.blockers`).
 */
export function blockerWords(open: readonly PublicationCheckName[]): string {
  if (open.length === 1) {
    const words = PUBLICATION_CHECK_WORDS[open[0]!];
    return `1 to resolve: ${words.charAt(0).toLowerCase()}${words.slice(1)}`;
  }
  return `${plural(open.length, 'thing')} to resolve`;
}

// ---- CM-04 Content library (B6-06 f1, f4) -------------------------------------------------------

export const CONTENT_LIBRARY = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'Ready · in review · with the vendor · published',
  /** `section.xr-section` “Every experiment you look after” and its meta. */
  sectionTitle: 'Every experiment you look after',
  sectionMeta: 'Drafts stay with the vendor and are not listed',
  /** `div.xr-tabs[role=tablist][aria-label]`. */
  tabsLabel: 'Content library',
  tabs: {
    ready: 'Ready',
    'in-review': 'In review',
    'with-vendor': 'With vendor',
    published: 'Published',
  },
  searchLabel: 'Search the library',
  searchPlaceholder: 'Name, ID or course',
  clearSearch: 'Clear search',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    whereItIs: 'Where it is',
    action: 'Action',
  },
  /** Ready rows open the decision; every other row “Open”. */
  openDecision: 'Open decision',
  open: 'Open',
  /** B6-06 `lNone`: a tab or a search that lists nothing. */
  nothingTitle: 'Nothing here',
  nothingLine: 'Try another tab or clear the search.',
} as const;

/** “Ready · 3 of 3” (`span.xr-meta[role=status]` in the toolbar status). */
export function libraryCountWords(tabLabel: string, shown: number, total: number): string {
  return `${tabLabel} · ${shown} of ${total}`;
}

/** A non-Ready row’s action name: “Open Venturi Meter Calibration” (B6-06 `aria`). */
export function openLabel(name: string): string {
  return `Open ${name}`;
}

/** Ready: “Approved 14 Aug 2026”, with “ · 1 to resolve” while the publication check is not met. */
export function approvedWhere(approvedAt: string, blockers: number): string {
  const blocked = blockers > 0 ? ` · ${blockers} to resolve` : '';
  return `Approved ${dayMonthYear(approvedAt)}${blocked}`;
}

/** In review: a first review “New submission · since 24 Aug 2026”. */
export function newSubmissionWhere(since: string): string {
  return `New submission · since ${dayMonthYear(since)}`;
}

/** In review: the re-check she asked for, “Re-check you asked for · since 25 Aug 2026”. */
export function recheckWhere(since: string): string {
  return `Re-check you asked for · since ${dayMonthYear(since)}`;
}

/** In review: a resubmission, “Revision 2 · with the Academic Reviewer” (B6-06 script). */
export function revisionWhere(revision: number): string {
  return `Revision ${revision} · with the Academic Reviewer`;
}

/** With vendor: “Returned by the Academic Reviewer · 24 Aug 2026”. */
export function returnedByReviewerWhere(since: string): string {
  return `Returned by the Academic Reviewer · ${dayMonthYear(since)}`;
}

/** With vendor, sent back by her: “You sent it back · 26 Aug 2026” (state-copy `CM-04.sent-back`). */
export function sentBackWhere(since: string): string {
  return stateWords('CM-04.sent-back').replace('{date}', dayMonthYear(since));
}

/** With vendor after a Super Admin override (state-copy `CM-04.override`). */
export function overrideWhere(since: string): string {
  return stateWords('CM-04.override').replace('{date}', dayMonthYear(since));
}

export type OpenUpdateState =
  | 'draft'
  | 'in-academic-review'
  | 'returned'
  | 'awaiting-release-decision'
  | 'on-hold'
  | 'released'
  | 'withdrawn';

/** The open correction’s tag on a Published row (B6-06 f4); undrawn states from the register. */
export function openUpdateTag(state: OpenUpdateState): string | null {
  switch (state) {
    case 'returned':
      return 'Update returned to you';
    case 'in-academic-review':
      return 'Update in academic review';
    case 'on-hold':
      return 'Update on hold';
    case 'draft':
      return stateWords('CM-04.update-draft');
    case 'awaiting-release-decision':
      return stateWords('CM-04.update-awaiting');
    case 'released':
    case 'withdrawn':
      return null;
  }
}

/** Published: “Version 1.2 · live since 3 Jul 2026 · Update in academic review”. */
export function publishedWhere(label: string, liveFrom: string, tag: string | null): string {
  return `Version ${label} · live since ${dayMonthYear(liveFrom)}${tag ? ` · ${tag}` : ''}`;
}

// ---- CM-09 Course codes (B6-10 f0 … f2; B6-11 f12) ----------------------------------------------

export const COURSE_CODES = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'The official platform code of each course — shown in the public catalogue',
  /** `section.xr-section` “Courses” and its meta. */
  sectionTitle: 'Courses',
  sectionMeta: 'From Academic structure (Super Admin)',
  /** `p.xr-hint#…-hint`: every code field’s description. */
  hint: 'Each code must be unique. Leave it blank if the course has no platform code yet.',
  columns: { course: 'Course', code: 'Platform course code' },
  /** `span.xg-changed-mark`. */
  changed: 'Changed — not saved yet',
  /** A blank code (`span.xr-meta`). */
  blank: 'No code yet — the catalogue shows the course name only.',
  clean: 'No unsaved changes',
  undo: 'Undo changes',
  save: 'Save codes',
  saving: 'Saving…',
  /** `p.xl-open` under the section. */
  note: 'You are the only person who edits these codes. The Super Admin sees them read-only in Academic structure. Institute Admins keep their own institution code for a course (for example MEC-523) — a separate field.',
} as const;

/** The visually hidden label of a code field: “Platform course code for Fluid Mechanics”. */
export function codeFieldLabel(course: string): string {
  return `Platform course code for ${course}`;
}

/** “Mechanical & Manufacturing · 3 published experiments” (“1 published experiment”). */
export function courseMeta(areaName: string, published: number): string {
  return `${areaName} · ${plural(published, 'published experiment')}`;
}

/** “1 change not saved”, “6 changes not saved”. */
export function changedCountWords(count: number): string {
  return `${plural(count, 'change')} not saved`;
}

/** “Codes saved · 27 Aug 2026, 16:40 · the catalogue shows them from now on”. */
export function codesSavedWords(at: string): string {
  return `Codes saved · ${dateTime(at)} · the catalogue shows them from now on`;
}
