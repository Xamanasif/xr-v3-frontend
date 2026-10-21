/**
 * The words more than one Faculty screen group draws (V3 Refined B; the owner-approved export
 * design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`). The four screen groups (teaching FA-01 …
 * FA-05, assessments FA-06 … FA-12, bank FA-14 … FA-17, marking FA-18 … FA-21) import these and do
 * not change them: a group that needs other words for its own screen adds a key to its own module.
 *
 * Settled first (behaviour-neutral, 21 Oct 2026): the words two groups already shared moved here
 * unchanged, and their old modules re-export them under the same names —
 * `FACULTY_FAILED_WORDS` (was `faculty-overview.ts`; FA-01, FA-18, FA-19) and
 * `QUESTION_SOURCE_WORDS` (was the first two keys of `question-tools.ts` `BANK_TOOLS`, which still
 * spreads them; FA-07, FA-09, FA-14, FA-16).
 */

// ---- settled cross-group words (unchanged, frozen) ----------------------------------------------

/** The Faculty failed formula (B4-02 f5; the export's `rk-state-d` "Nothing has changed. Try again."). */
export const FACULTY_FAILED_WORDS = {
  line: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

/**
 * The two other ways to add questions, beside the bank: FA-14's header links (B4-07 f0
 * `a.xr-btn--secondary` ×2, f7's empty state's "Import"), FA-07 step 3 and FA-09 "Or Draft with
 * assistance · Import" (the export, lines 744–745, 919, 1254–1255).
 */
export const QUESTION_SOURCE_WORDS = {
  draftWithAssistance: 'Draft with assistance',
  import: 'Import',
} as const;

// ---- naming an assessment (owner's identifier rule) ---------------------------------------------

/** An assessment with no name yet (the export's `a.name || 'Untitled draft'`, never its id). */
export const UNTITLED_DRAFT = 'Untitled draft';

/**
 * An assessment as every Faculty page names it: its own name, or "Untitled draft" while a draft has
 * none (the export, script lines 2569, 2717, 2999, 3058, 3779 …). Never the internal reference.
 */
export function assessmentName(name: string | null | undefined): string {
  return name && name.trim() !== '' ? name : UNTITLED_DRAFT;
}

// ---- V3 words more than one group draws (pinned to the export in fa-shared.test.ts) -------------

/** The script's `plural`: "1 student", "2 written answers", "1 day". */
export function faPlural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** The three counts after each per-format meter (`p.fa-prog-t`; FA-01, FA-03, FA-04, FA-05, FA-20). */
export const FA_PROGRESS_WORDS = {
  completed: 'completed',
  inProgress: 'in progress',
  notStarted: 'not started',
} as const;

/**
 * A per-format list's name (the script's `progAria` / `actAria`): "Student activity by format for
 * Venturi Meter, as of 7 Nov 2026"; FA-03's column, without the date.
 */
export function activityByFormatLabel(experiment: string, asOf?: string): string {
  return `Student activity by format for ${experiment}${asOf ? `, as of ${asOf}` : ''}`;
}

/** "As of 7 Nov 2026" (the activity's date line, `p.rk-hint`; FA-03, FA-05, FA-21). */
export function asOfWords(day: string): string {
  return `As of ${day}`;
}

/** The format badges' name (the script's `fmAria`): "Formats your institution has: WEB, VR". */
export function formatsHeldLabel(codes: readonly string[]): string {
  return `Formats your institution has: ${codes.join(', ')}`;
}

/** "Students with access" (a figure on FA-02, FA-03, FA-05 and the record band). */
export const STUDENTS_WITH_ACCESS = 'Students with access';

/**
 * An assessment's state (the script's `asmState`: FA-01 … FA-06, FA-08 … FA-12): "Ready" and
 * "Draft — not ready" are the shared `READINESS_WORDS` labels; with no assessment, "No assessment
 * yet". The teaching pages' longer labels (the script's `stLabelOf`: FA-01, FA-02, FA-03, FA-05).
 */
export const FA_ASSESSMENT_STATE_WORDS = {
  none: 'No assessment yet',
  readyLong: 'Assessment ready',
  draftLong: 'Assessment in draft',
} as const;

/** A deadline's words (the script's `left`, `dueNote`, figures): "Due today", "Deadline passed". */
export const FA_DEADLINE_WORDS = {
  dueToday: 'Due today',
  today: 'today',
  passed: 'Deadline passed',
} as const;

/**
 * Days to a deadline (the script's `left`): "7 days left", "1 day left"; on the day itself "Due
 * today" (FA-06, the record band) or, after "Due <date> ·", just "today" (FA-01, FA-03, FA-05).
 */
export function faDaysLeftWords(days: number, sameDay: 'due' | 'short' = 'due'): string {
  if (days === 0) return sameDay === 'due' ? FA_DEADLINE_WORDS.dueToday : FA_DEADLINE_WORDS.today;
  return `${faPlural(days, 'day')} left`;
}

/** "1 written answer waiting for marking" (FA-02, FA-03, FA-05, the record band). */
export function writtenAnswersWaitingWords(count: number): string {
  return `${faPlural(count, 'written answer')} waiting for marking`;
}

/** "2 waiting for marking" (FA-06's row, FA-08's meta). */
export function waitingForMarkingWords(count: number): string {
  return `${count} waiting for marking`;
}

/** The list toolbars' chips and their clearing (FA-04, FA-06, FA-14, FA-20). */
export const FA_FILTER_WORDS = { clear: 'Clear filters' } as const;

/** A chip's remove button (the script's `c.aria`): "Remove filter Format: VR". */
export function removeFilterLabel(chip: { readonly label: string }): string {
  return `Remove filter ${chip.label}`;
}

/** A guided step's state for screen readers (the script's `sr`; FA-07, FA-17). */
export const FA_STEP_STATE_WORDS = {
  done: ', done',
  current: ', current step',
  todo: ', not done yet',
} as const;

/** The marking guidance's label (`p.fa-guide-k`; FA-11's answer key, FA-19). */
export const FA_GUIDANCE_LABEL = 'Marking guidance · only you see this';

/** FA-22 on FA-12 and FA-20: the action and the preview's name. */
export const FA_EXPORT_WORDS = {
  action: 'Export CSV',
  rowsLabel: 'Rows in the exported file',
} as const;

/** The list filters by state (`div.fa-seg.fa-seg--bar[aria-label=Show]`; FA-12, FA-18). */
export const FA_SHOW_WORDS = {
  label: 'Show',
  all: 'All',
  waiting: 'Waiting',
  waitingLong: ' for marking',
  marked: 'Marked',
} as const;
