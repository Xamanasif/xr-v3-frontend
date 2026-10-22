/**
 * The words of VE-01 Overview, the Vendor workspace home, and VE-02 My experiments, as the
 * owner-approved Vendor export draws them (V3 Refined B, design/v3-refined-b/roles/VE-v1
 * `project/Main.dc.html`: the overview and list views and the script's `overView`, `listView`,
 * `stSub` and `activity`), written from the facts `ProductionService.getVendorOverview`,
 * `listMyExperiments` and `getEditor` answer (PC-62: facts, never words). Every phrase is the
 * export's own, found verbatim in its markup or script (`vendor-home.test.ts`); the composed lines
 * take the script's forms with the records' values (names, reasons and dates are never copied
 * from the export's sample world). No line or name carries an internal reference (SUB-): where the
 * script's form writes one it is left out and the experiment is named by content (owner's
 * identifier rule, 22 Oct 2026; state-copy `VE-02.no-reference`). What the export does not word
 * is a provisional entry of the state-copy register (`state-copy-vendor-home.ts`, VD-12).
 */
import type { MyExperimentsStatus } from '@/queries/production';

import { stateWords } from './state-copy';

/** The studio band's and the list head's action, and the empty states' (`data-to="VE-03"`). */
export const CREATE_EXPERIMENT = 'Create experiment';

/** Who returned it (the script's `ret.by`: “Academic Reviewer” · “Content Manager”). */
export const RETURNED_BY_WORDS = {
  'academic-reviewer': 'Academic Reviewer',
  'content-manager': 'Content Manager',
} as const;

export type ReturnedBy = keyof typeof RETURNED_BY_WORDS;

// ---- VE-01 Overview --------------------------------------------------------------------------

export const VENDOR_OVERVIEW_WORDS = {
  /** `h1.rb-id-name > span.xr-sr`: the H1 says the page before the studio's name. */
  titlePrefix: 'Overview, ',
  /** `dl.rb-figs.vr-figs[aria-label]`. */
  figuresLabel: 'Your experiments at a glance',
  figures: {
    withYou: 'With you',
    inReview: 'In review',
    published: 'Published',
    readOnly: 'Read-only',
  },
  figureLines: {
    nothingWaiting: 'Nothing waiting',
    nothingNeeded: 'Nothing needed from you',
    noneRightNow: 'None right now',
    live: 'Live in the catalogue',
    noneYet: 'None yet',
    courseGone: 'Course no longer assigned',
  },
  /** `section.rb-att` “Needs your action” and its note when it is empty. */
  attention: 'Needs your action',
  nothingWaiting: 'Nothing waiting',
  /** The kinds (`p.vr-kind`, `span.vr-kind`). */
  returnedKind: 'Returned to you',
  draftKind: 'Draft to finish',
  /** `span.vr-lead-refs-k`. */
  refersTo: 'Refers to',
  /** `p.vr-lead-pend` on the lead. */
  savedNotResubmitted: 'Your changes are saved, not resubmitted. Only you can see them.',
  /** A draft's action (→ the editor, VE-09). */
  finishDraft: 'Finish draft',
  /** `div.rb-calm`. */
  calmTitle: 'Nothing needs you right now',
  calmLine:
    'Experiments with the Academic Reviewer or the Content Manager need nothing from you. You’ll see them here if they come back.',
  /** `section.rb-panel.vr-act`. */
  activity: 'Recent activity',
  newestFirst: 'Newest first',
  today: 'Today',
  changedRecently: 'Changed in the last 7 days',
  seeAll: 'See all your experiments',
  /** The first visit (`section.rk-surface > div.rk-state.rk-state--roomy`). */
  firstTitle: 'Create your first experiment',
  firstLine:
    'Describe it, add its formats and delivery, then submit it for academic review. You can save a draft at every step.',
} as const;

/** `p.rb-id-status`: “Your course: ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseLine(courses: readonly string[]): string {
  return (courses.length === 1 ? 'Your course: ' : 'Your courses: ') + courses.join(', ');
}

/** A course as the course line names it: “ME ZG523 · Thermodynamics & Heat Transfer”. */
export function courseWords(code: string | null, name: string): string {
  return code ? `${code} · ${name}` : name;
}

/** “With you”'s line: “1 returned · 1 draft”, “2 drafts”, “Nothing waiting”. */
export function withYouLine(returned: number, drafts: number): string {
  const parts: string[] = [];
  if (returned) parts.push(`${returned} returned`);
  if (drafts) parts.push(`${drafts}${drafts === 1 ? ' draft' : ' drafts'}`);
  return parts.join(' · ') || VENDOR_OVERVIEW_WORDS.figureLines.nothingWaiting;
}

/** “Needs your action”'s note: “2 items”, “1 item”, “Nothing waiting”. */
export function attentionCountWords(items: number): string {
  return items === 0
    ? VENDOR_OVERVIEW_WORDS.nothingWaiting
    : `${items}${items === 1 ? ' item' : ' items'}`;
}

/** The lead's meta line: “Academic Reviewer · Prof. A. Menon · 24 Aug 2026” (no name: left out). */
export function leadMeta(by: ReturnedBy, who: string, when: string): string {
  return [RETURNED_BY_WORDS[by], who, when].filter(Boolean).join(' · ');
}

/** “Revise “Forced Convection”” (the lead's gold action and a further returned item's). */
export function reviseLabel(name: string): string {
  return `Revise “${name}”`;
}

/** Its name: “Revise Forced Convection, returned by the Academic Reviewer”. */
export function reviseName(name: string, by: ReturnedBy): string {
  return `Revise ${name}, returned by the ${RETURNED_BY_WORDS[by]}`;
}

/** “By the Academic Reviewer on 24 Aug” (`onDay`: “on 24 Aug” or “today”). */
export function returnedByLine(by: ReturnedBy, onDay: string): string {
  return `By the ${RETURNED_BY_WORDS[by]} ${onDay}`;
}

/** A further returned item's line, with the saved-changes words when the product can tell. */
export function returnedRowLine(by: ReturnedBy, onDay: string, saved: boolean): string {
  return returnedByLine(by, onDay) + (saved ? ' · your changes are saved, not resubmitted' : '');
}

/** “Saved at step 2 of 4 · 25 Aug 2026 · only you can see it”. */
export function draftRowLine(step: number, when: string): string {
  return `Saved at step ${step} of 4 · ${when} · only you can see it`;
}

/** “Finish the draft of Pin Fin Efficiency”. */
export function finishDraftName(name: string): string {
  return `Finish the draft of ${name}`;
}

/** “on 24 Aug”, or “today” on the sample clock's day. */
export function onDay(day: string, today: boolean): string {
  return today ? 'today' : `on ${day}`;
}

/** Recent activity's row name: “Draft saved, Pin Fin Efficiency, 25 Aug 2026, 17:20. Open …”. */
export function activityName(what: string, name: string, when: string): string {
  return `${what}, ${name}, ${when}. Open the experiment record`;
}

/**
 * What a history entry says on Recent activity, in the record's history words (the export's
 * `hist[].what`); a resubmission names its revision.
 */
export const HISTORY_WORDS = {
  draftSaved: 'Draft saved',
  submitted: 'Submitted for academic review',
  returned: 'Returned with a reason',
  approved: 'Approved by the Academic Reviewer',
  recheck: 'Back with the Academic Reviewer for a re-check',
  published: 'Published by the Content Manager',
} as const;

/** “Submitted · revision 2”. */
export function resubmittedWords(revision: string): string {
  return `Submitted · revision ${revision}`;
}

// ---- VE-02 My experiments --------------------------------------------------------------------

export const MY_EXPERIMENTS_WORDS = {
  /** `div.rk-head > p.rk-sub`. */
  lead: 'Every experiment you created, in any status',
  /** `div.rb-switch[role=group][aria-label]`. */
  tabsLabel: 'Show experiments by status',
  /** `section.rk-surface.vr-list[aria-label]`; the table's caption starts with it. */
  listLabel: 'Your experiments',
  /** `div.vr-tools[role=search][aria-label]`. */
  toolsLabel: 'Search your experiments',
  /** `label.vr-toggle` (the VE-13 filter). */
  recent: 'Changed in the last 7 days',
  clearFilters: 'Clear filters',
  /** The sort (`button.rk-sortbtn`): “Sort: newest first”, “…, newest first. Change order”. */
  sortPrefix: 'Sort: ',
  newestFirst: 'newest first',
  oldestFirst: 'oldest first',
  changeOrder: '. Change order',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    status: 'Status',
    lastChange: 'Last change',
    action: 'Action',
  },
  /** `span.vr-datek` in the three-line rows below 760 px. */
  lastChange: 'Last change',
  /** The row actions. */
  revise: 'Revise',
  editDraft: 'Edit draft',
  /** `span.vr-pending`. */
  savedNotResubmitted: 'Changes saved, not resubmitted',
  /** No match. */
  noMatchTitle: 'No experiments match',
  /** No experiments yet. */
  emptyTitle: 'You haven’t created an experiment yet',
  emptyLine:
    'Create one, describe it, add its formats and delivery, and submit it for academic review.',
} as const;

/**
 * The search's words and its no-match line: the export's without “ID” (state-copy `VE-02.search`,
 * `VE-02.no-match-line`; `VE-02.no-reference`). The service's search still matches a reference.
 */
export const MY_EXPERIMENTS_SEARCH = {
  /** `label.xr-sr` and the placeholder of `input#ve-q`. */
  label: stateWords('VE-02.search'),
  noMatchLine: stateWords('VE-02.no-match-line'),
} as const;

/** The tab keys: All, then the six statuses the service filters on (`listMyExperimentsInput`). */
export type StatusTabKey = 'all' | MyExperimentsStatus;

/**
 * The status tabs in the export's order, with its words (`tabName`): Draft includes the read-only
 * draft, Returned a Content Manager's return, With Academic Reviewer a re-check (the service's).
 */
export const STATUS_TABS: readonly (readonly [StatusTabKey, string])[] = [
  ['all', 'All'],
  ['returned', 'Returned'],
  ['draft', 'Draft'],
  ['submitted', 'Submitted'],
  ['with-academic-reviewer', 'With Academic Reviewer'],
  ['with-content-manager', 'With Content Manager'],
  ['published', 'Published'],
];

/** “1 experiment”, “6 experiments”. */
export function experimentsWords(count: number): string {
  return `${count}${count === 1 ? ' experiment' : ' experiments'}`;
}

/** A tab's name: “Returned, 1 experiment”. */
export function statusTabName(label: string, count: number): string {
  return `${label}, ${experimentsWords(count)}`;
}

/** The count (`p.rk-count`): “6 experiments”; “1 of 6 experiments” while a filter is applied. */
export function experimentCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${experimentsWords(total)}` : experimentsWords(total);
}

/** “Formats: WEB, AR”; “Formats: none chosen”. */
export function formatsName(codes: readonly string[]): string {
  return `Formats: ${codes.join(', ') || 'none chosen'}`;
}

/**
 * The name link's name: “Forced Convection, Returned, last change 24 Aug 2026. Open the experiment
 * record” — the script's `aria` without the submission's reference (state-copy
 * `VE-02.no-reference`).
 */
export function experimentRowName(name: string, status: string, when: string): string {
  return `${name}, ${status}, last change ${when}. Open the experiment record`;
}

/** “Revise Forced Convection”. */
export function reviseRowName(name: string): string {
  return `Revise ${name}`;
}

/** “Edit the draft of Pin Fin Efficiency”. */
export function editDraftRowName(name: string): string {
  return `Edit the draft of ${name}`;
}

/** The one plain line under a status pill (HANDOFF §2; the script's `stSub`). */
export const STATUS_LINES = {
  /** “Saved at step 2 of 4 · only you can see it”. */
  draft: (step: number) => `Saved at step ${step} of 4 · only you can see it`,
  /** “Submitted on 24 Aug” (a first submission with the Academic Reviewer). */
  withReviewer: (on: string) => `Submitted ${on}`,
  /** “Revision 2 · submitted on 26 Aug” (a resubmitted revision). */
  submitted: (revision: number, on: string) => `Revision ${revision} · submitted ${on}`,
  /** “Back for a re-check”. */
  recheck: 'Back for a re-check',
  /** “Approved on 14 Aug”. */
  withContentManager: (on: string) => `Approved ${on}`,
  /** “Live in the catalogue since 30 Jul”. */
  published: (day: string) => `Live in the catalogue since ${day}`,
} as const;

/** The pill of a draft whose course is no longer one of the Vendor's (OD-B5-01). */
export const READ_ONLY_DRAFT = 'Draft · read-only';

/** The pill of a returned record (a Super Admin override included: no other words are drawn). */
export const RETURNED = 'Returned';

// ---- Loading and failed (VE-02 drawn; VE-01 the same formula) ---------------------------------

/** The export's failed state (`div.rk-state[role=alert]`). */
export const VENDOR_FAILED_WORDS = {
  line: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;
