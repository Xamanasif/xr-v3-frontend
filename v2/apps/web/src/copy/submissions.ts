/**
 * The words of FA-12 Assessment · Submissions with its FA-22 Export CSV in the V3 Refined B design
 * (the owner-approved export design/v3-refined-b/roles/FA-v1, `project/Main.dc.html` "FA-12
 * Submissions · FA-22 Export" and the script's `vmSubmissions`, `release`, `score`), and the
 * record's actions on FA-08's Submissions panel ("Mark next", "See submissions"). Every undrawn
 * variant — the loading, failed and policy-open states — is a state-copy entry
 * (`state-copy-submissions.ts`), read by the page through `stateWords`. A submission is named by its student
 * and "Attempt 1 of 2", never by its internal reference (the owner's identifier rule).
 */
function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

import { FA_EXPORT_WORDS, FA_SHOW_WORDS } from './fa-shared';

/** The submissions filter (`div.fa-seg.fa-seg--bar[aria-label="Show"]`), in-page. */
export type SubmissionFilter = 'all' | 'waiting' | 'marked';

export const SUBMISSIONS_WORDS = {
  /** The record tab "Submissions 2" and the shell's place words. */
  tab: 'Submissions',
  /** `h2#fa-tabh`. */
  title: 'Submissions',
  /** `div.fa-seg[aria-label]`. */
  show: FA_SHOW_WORDS.label,
  filters: {
    all: FA_SHOW_WORDS.all,
    waiting: FA_SHOW_WORDS.waiting,
    marked: FA_SHOW_WORDS.marked,
  } satisfies Record<SubmissionFilter, string>,
  /** The tail phones leave out: "Waiting for marking". */
  waitingLong: FA_SHOW_WORDS.waitingLong,
  /** `a.rb-btn--primary` (to FA-19, the oldest submission waiting). */
  markNext: 'Mark next',
  /** `button.rb-btn` with the download glyph (FA-22). */
  exportCsv: FA_EXPORT_WORDS.action,
  columns: {
    student: 'Student',
    submitted: 'Submitted',
    status: 'Status',
    score: 'Score',
    released: 'Result released to student',
  },
  waiting: 'Waiting for marking',
  marked: 'Marked',
  passed: 'Passed',
  notPassed: 'Not passed',
  released: 'Released',
  notYet: 'Not yet',
  /**
   * The export confirmation's line. The export writes “It contains this list only, …”, but the
   * service's file holds every submission of the assessment whichever filter is on, so the line
   * says that (state-copy `FA-12.export-file`).
   */
  exportedColumns:
    'It contains every submission to this assessment, as it was when you exported it. Columns: student, student ID, submitted, status, score, result released to student.',
  /** `div.fa-scrollx[aria-label]` and its table's caption. */
  exportedRows: FA_EXPORT_WORDS.rowsLabel,
  noMatch: 'No submissions match this filter',
  showAll: 'Show all',
  emptyTitle: 'No submissions yet',
  emptyDraft: 'Students can’t see a draft, so there are no submissions yet.',
} as const;

/** "2 submissions · 1 waiting for marking" (the export's `count`). */
export function submittedCountWords(submissions: number, waiting: number): string {
  return `${plural(submissions, 'submission')} · ${waiting} waiting for marking`;
}

/** "Submissions for Heat Exchanger — post-lab" (the table's caption). */
export function submissionsCaption(assessmentName: string): string {
  return `Submissions for ${assessmentName}`;
}

/** "Attempt 1 of 2", with " · version 2" while attempts span versions. */
export function attemptWords(
  number: number,
  allowed: number | null,
  version: number | null,
): string {
  const of = allowed === null ? `Attempt ${number}` : `Attempt ${number} of ${allowed}`;
  return version === null ? of : `${of} · version ${version}`;
}

/** "Mark Priya Natarajan" / "View marks for Rahul Verma" (the row link's name). */
export function rowLinkLabel(waiting: boolean, student: string): string {
  return `${waiting ? 'Mark ' : 'View marks for '}${student}`;
}

/** "11 of 16" — the confirmed score out of the attempt's total marks. */
export function scoreWords(score: number, outOf: number): string {
  return `${score} of ${outOf}`;
}

/** "— of 16" while the written answers wait. */
export function waitingScoreWords(outOf: number): string {
  return `— of ${outOf}`;
}

/** "Marked automatically: 4 of 6". */
export function automaticWords(awarded: number, outOf: number): string {
  return `Marked automatically: ${awarded} of ${outOf}`;
}

/** "Passed · pass mark 8" / "Not passed · pass mark 8". */
export function outcomeWords(passed: boolean, passMark: number): string {
  return `${passed ? SUBMISSIONS_WORDS.passed : SUBMISSIONS_WORDS.notPassed} · pass mark ${passMark}`;
}

/** The line under "Released": "14 Nov 2026, 23:59, after the deadline" or the release time. */
export function releasedSubWords(
  when: string,
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date' | null,
): string {
  return option === 'after-deadline' ? `${when}, after the deadline` : when;
}

/**
 * The line under "Not yet", from the attempt's own pinned release terms: "after the deadline, 14
 * Nov 2026, 23:59", "after marking", "on 20 Nov 2026, 09:00" (the export's `release`); a release
 * not set is `FA-12.release-not-set` ("Not yet" alone, `null`).
 */
export function notReleasedSubWords(
  option: 'immediately-after-marking' | 'after-deadline' | 'on-date' | null,
  on: string | null,
): string | null {
  switch (option) {
    case 'after-deadline':
      return on === null ? 'after the deadline' : `after the deadline, ${on}`;
    case 'immediately-after-marking':
      return 'after marking';
    case 'on-date':
      return on === null ? 'on a date' : `on ${on}`;
    case null:
      return null;
  }
}

/**
 * "Exported the submissions of Heat Exchanger — post-lab as a CSV file · 2 rows". The export names
 * the file ("Exported submissions-<name>.csv · 2 rows"); the service's file name holds the
 * assessment's internal reference, which no Faculty words show (the owner's identifier rule), so
 * the confirmation names the assessment by its name instead. The browser still saves the file
 * under the service's name (state-copy `FA-12.export-file`).
 */
export function exportedWords(assessment: string, rows: number): string {
  return `Exported the submissions of ${assessment} as a CSV file · ${plural(rows, 'row')}`;
}

/** "Students who have Shell-and-Tube Heat Exchanger see this assessment in Assessments. …" */
export function emptyLine(experiment: string): string {
  return `Students who have ${experiment} see this assessment in Assessments. Their submissions appear here.`;
}

// ---- FA-08 Summary's panel actions -------------------------------------------------------------

export const SUMMARY_ACTIONS = {
  /** `a.rb-btn--primary.rk-go` (to FA-19, the oldest submission of this assessment waiting). */
  markNext: 'Mark next',
  /** `a.rb-btn` (to FA-12, the Submissions tab). */
  seeSubmissions: 'See submissions',
} as const;
