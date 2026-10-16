/**
 * The words of FA-12 Assessment · Submissions with its FA-22 Export CSV, as board B4-06 draws them
 * (f7 … f11, and the interactive frames' own script: the count line, the score, the release flag,
 * the export confirmation, the filter's no-match line), and the record's Phase-4B actions on FA-08
 * (B4-05 f0, f4: "Mark next", "See submissions"). Every undrawn variant — the release flag of the
 * other release settings, the loading, failed and policy-open states — is a state-copy entry
 * (`state-copy-submissions.ts`), read through `stateWords`.
 */
import { stateWords } from './state-copy';

/** The submissions filter (B4-06 `div.xr-seg[aria-label="Show"]`), in-page. */
export type SubmissionFilter = 'all' | 'waiting' | 'marked';

export const SUBMISSIONS_WORDS = {
  /** f7 `nav.xw-hubtabs` "Submissions 2" and the top bar's current crumb. */
  tab: 'Submissions',
  /** f7 `h2#Ub-sh`. */
  title: 'Submissions',
  /** f7 `div.xr-seg[aria-label]`. */
  show: 'Show',
  filters: {
    all: 'All',
    waiting: 'Waiting for marking',
    marked: 'Marked',
  } satisfies Record<SubmissionFilter, string>,
  /** f7 `a.xr-btn--primary.xr-btn--sm` (to FA-19, the oldest submission waiting). */
  markNext: 'Mark next',
  /** f7 `button.xr-btn--secondary.xr-btn--sm` with the download icon (FA-22). */
  exportCsv: 'Export CSV',
  columns: {
    student: 'Student',
    submitted: 'Submitted',
    status: 'Status',
    score: 'Score',
    released: 'Result released to student',
  },
  /** f7 `span.xr-status--wait`, f8 `span.xr-status--ok`. */
  waiting: 'Waiting for marking',
  marked: 'Marked',
  /** f7 the score before the marks are confirmed. */
  noScore: '—',
  /** f7 the release flag of an "after the deadline" assessment, with the lock. */
  notYetAfterDeadline: 'Not yet — after the deadline',
  /** f10 the export confirmation's body. */
  exportedColumns:
    'Columns: student, student ID, submitted, status, score, result released to student. It contains this list only.',
  /** B4-06 script `filtNone`. */
  noMatch: 'No submissions match this filter.',
  /** f11 `h3.xr-h3`. */
  emptyTitle: 'No submissions yet',
} as const;

/** f7 "2 submitted · 2 waiting for marking" (B4-06 script `subCount`). */
export function submittedCountWords(submitted: number, waiting: number): string {
  return `${submitted} submitted · ${waiting} waiting for marking`;
}

/** f8 "11 of 16" — the confirmed score out of the attempt's total marks. */
export function scoreWords(score: number, outOf: number): string {
  return `${score} of ${outOf}`;
}

/** f9 "Released 14 Nov 2026, 23:59". */
export function releasedWords(when: string): string {
  return `Released ${when}`;
}

/**
 * The flag while the result is not released yet, from the attempt's own pinned release terms:
 * f7 draws "after the deadline"; the other settings are `FA-12.release-*`.
 */
export function notReleasedWords(
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date' | null,
  on: string | null,
): string {
  switch (option) {
    case 'after-deadline':
      return SUBMISSIONS_WORDS.notYetAfterDeadline;
    case 'immediately-after-marking':
      return stateWords('FA-12.release-when-marked');
    case 'on-date':
      return on === null
        ? stateWords('FA-12.release-on-a-date')
        : stateWords('FA-12.release-on-date').replace('{date}', on);
    case null:
      return stateWords('FA-12.release-not-set');
  }
}

/** f10 "Exported submissions-ASMT-0009.csv · 2 rows" (B4-06 script `expText`). */
export function exportedWords(fileName: string, rows: number): string {
  return `Exported ${fileName} · ${rows} row${rows === 1 ? '' : 's'}`;
}

/** f11 "Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. …" */
export function emptyLine(experiment: string): string {
  return `Students who have ${experiment} see this assessment in Assessments. Their submissions appear here.`;
}

// ---- FA-08 Summary's Phase-4B actions (B4-05 f0, f4 `div.xw-actions`) ---------------------------

export const SUMMARY_ACTIONS = {
  /** `a.xr-btn--primary` (to FA-19, the oldest submission of this assessment waiting). */
  markNext: 'Mark next',
  /** `a.xr-btn--secondary` (to FA-12, the Submissions tab). */
  seeSubmissions: 'See submissions',
} as const;
