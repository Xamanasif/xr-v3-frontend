/**
 * The words of Phase 5’s VE-01 Overview, the Vendor workspace home (board B5-01 f0 … f3; B5-08
 * f1), and VE-02 My experiments (B5-02 f0 … f5; B5-08 f3), written from the facts
 * `ProductionService.getVendorOverview` and `listMyExperiments` answer (PC-62: facts, never
 * words). Every phrase is the frozen boards’ own, found verbatim in their markup or script
 * (`vendor-home.test.ts`); the composed lines take the boards’ forms with the records’ values
 * (names, reasons and dates are never copied from the boards). What B5-01 and B5-02 do not word is
 * a provisional entry of the state-copy register (`state-copy-vendor-home.ts`, VD-12).
 */
import type { MyExperimentsStatus } from '@/queries/production';

/** B5-01 / B5-02 header action (`div.xr-phead-actions`; the empty states draw it again). */
export const CREATE_EXPERIMENT = 'Create experiment';

// ---- VE-01 Overview (B5-01 f0 … f3; B5-08 f1) ---------------------------------------------------

export const VENDOR_OVERVIEW_WORDS = {
  /** `section.xr-section` “Needs your action” (f0, f3; B5-08 f1). */
  attention: 'Needs your action',
  /** A draft’s action (→ the editor, VE-09). */
  finishDraft: 'Finish draft',
  /** f1 “Nothing needs you”: `div.xr-empty` with the done icon in the ok tint. */
  calmTitle: 'Nothing needs you right now',
  calmLine:
    'Experiments with the Academic Reviewer or the Content Manager need nothing from you. You’ll see them here if they come back.',
  /** f2 “First visit — no experiments yet”: the primary action moves into the empty state. */
  firstTitle: 'Create your first experiment',
  firstLine:
    'Describe it, add its formats and delivery, then submit it for academic review. You can save a draft at every step.',
  /** `p.xl-meta > a` under the sections (f0 … f3). */
  seeAll: 'See all your experiments',
} as const;

/** The status line’s four counts (`p.xv-statusline`, B5-01 script `o.statusLine`), in order. */
export const STATUS_LINE = [
  ['draft', 'Draft'],
  ['with-academic-reviewer', 'With Academic Reviewer'],
  ['with-content-manager', 'With Content Manager'],
  ['published', 'Published'],
] as const;

/** Who returned it (B5-01 script `x.by`: “Academic Reviewer” · “Content Manager”). */
export const RETURNED_BY_WORDS = {
  'academic-reviewer': 'Academic Reviewer',
  'content-manager': 'Content Manager',
} as const;

/** The attention count: “2 items” (f0, f3), “3 items” (B5-08 f1), “1 item”. */
export function attentionCountWords(items: number): string {
  return `${items} item${items === 1 ? '' : 's'}`;
}

/** “Returned: Forced Convection”. */
export function returnedTitle(name: string): string {
  return `Returned: ${name}`;
}

/** “Academic Reviewer · 24 Aug 2026 · “The AR install notes …””. */
export function returnedSub(
  by: keyof typeof RETURNED_BY_WORDS,
  when: string,
  reason: string,
): string {
  return `${RETURNED_BY_WORDS[by]} · ${when} · “${reason}”`;
}

/** “Revise “Forced Convection””. */
export function reviseLabel(name: string): string {
  return `Revise “${name}”`;
}

/** “Draft to finish: Pin Fin Efficiency”. */
export function draftTitle(name: string): string {
  return `Draft to finish: ${name}`;
}

/** “Last saved 25 Aug 2026 · only you can see it”. */
export function draftSub(when: string): string {
  return `Last saved ${when} · only you can see it`;
}

// ---- VE-02 My experiments (B5-02 f0 … f5; B5-08 f3) --------------------------------------------

export const MY_EXPERIMENTS_WORDS = {
  /** `div.xr-phead-meta > span.xl-meta`. */
  meta: 'Every experiment you created, in any status',
  /** `section.xr-section` “All your experiments”. */
  section: 'All your experiments',
  searchLabel: 'Search your experiments',
  searchPlaceholder: 'Name, ID or course',
  statusLabel: 'Status',
  allStatuses: 'All statuses',
  /** `label.xr-check` (the merged history filter, VE-13). */
  recent: 'Changed in the last 7 days',
  clearFilters: 'Clear filters',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats',
    status: 'Status · last change',
    with: 'With',
    action: 'Action',
  },
  /** The stacked rows’ labels below 760 px of content (`td[data-label]`, f4, f5). */
  labels: { formats: 'Formats', status: 'Status', with: 'With' },
  /** The row actions (B5-02 script `r.act`). */
  revise: 'Revise',
  editDraft: 'Edit draft',
  open: 'Open',
  /** f2 “No match”. */
  noMatchTitle: 'No experiments match',
  noMatchLine: 'Try a different name, or clear the filters.',
  /** f3 “Empty — no experiments yet”. */
  emptyTitle: 'You haven’t created an experiment yet',
  emptyLine:
    'Create one, describe it, add its formats and delivery, and submit it for academic review.',
} as const;

/** The Status filter’s options (`select#Lm-s`), in the board’s order, with the service’s values. */
export const STATUS_FILTER_OPTIONS: readonly (readonly [MyExperimentsStatus, string])[] = [
  ['draft', 'Draft'],
  ['submitted', 'Submitted'],
  ['with-academic-reviewer', 'With Academic Reviewer'],
  ['returned', 'Returned'],
  ['with-content-manager', 'With Content Manager'],
  ['published', 'Published'],
];

/** B5-02 `stw.readonly`: a draft whose course is no longer one of the Vendor’s (OD-B5-01). */
export const READ_ONLY_DRAFT = 'Draft · read-only';

/** B5-02 `stw.returned`: the Vendor’s word for a returned record. */
export const RETURNED = 'Returned';

/** Who has it now (B5-02 `withw`): “You”, “Academic Reviewer”, “Content Manager” or “—”. */
export const WITH_WORDS = {
  you: 'You',
  academicReviewer: 'Academic Reviewer',
  contentManager: 'Content Manager',
  nobody: '—',
} as const;

/** “6 of 6 experiments”, “1 of 6 experiments”, “0 of 1 experiment” (B5-02 script `o.count`). */
export function experimentCountWords(shown: number, total: number): string {
  return `${shown} of ${total} experiment${total === 1 ? '' : 's'}`;
}

/** The row action’s name: “Revise Forced Convection”, “Edit draft Pin Fin Efficiency”, “Open …”. */
export function rowActionLabel(action: string, name: string): string {
  return `${action} ${name}`;
}

// ---- Failed (both pages) ---------------------------------------------------------------------

/** The Phase-5 boards’ failed formula (B6-02 “We couldn’t load the review queue”). */
export const VENDOR_FAILED_WORDS = {
  line: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;
