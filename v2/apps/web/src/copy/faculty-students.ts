/**
 * The words of FA-20 Students with its FA-22 Export CSV, and FA-21 Student detail (board B4-10
 * f0 … f7), written from the facts `TeachingService.listStudents`, `exportStudentsCsv` and
 * `getStudentDetail` answer (per-format status in words, the assessment's state, the last activity
 * and when the experiment was given, the attempts with their confirmed marks and pinned release
 * terms, the resources opened). Every phrase here is the frozen board's own, found verbatim in its
 * markup or script (`faculty-students.test.ts`); FA-03's and FA-05's links to FA-20 are B4-02's
 * and B4-03's. What B4-10 does not word is a provisional entry of the state-copy register
 * (`state-copy-faculty-students.ts`, VD-12) and is read from there. The board's sample names,
 * dates and counts are never copied: they come from the records.
 */
import type { FormatProgressStatus, ReleaseOption } from '@xr/domain';

import { stateWords } from './state-copy';

/** FA-20's page (f0): the header, the experiment section and its toolbar. */
export const STUDENTS_PAGE = {
  /** `div.xr-phead-meta > span.xl-meta`, before "· as of <date>". */
  meta: 'Students who have the experiments you teach',
  /** `xr-btn--secondary` with the download icon (FA-22). */
  exportCsv: 'Export CSV',
  /** The section head's `span.xr-meta` beside the experiment's name. */
  sectionMeta: 'Progress per format, in words',
  experimentLabel: 'Experiment',
  progressLabel: 'Progress',
  inactiveLabel: 'Inactive for',
  clearFilters: 'Clear filters',
} as const;

/** f0 "Progress": the options, in the drawn order (the service's `progress` filter values). */
export const PROGRESS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress in a format' },
  { value: 'completed', label: 'Completed a format' },
  { value: 'waiting-for-marking', label: 'Waiting for marking' },
] as const;

/** f0 "Inactive for": the options, in the drawn order (the service's `inactiveForDays`). */
export const INACTIVE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7', label: '7 days or more' },
  { value: '14', label: '14 days or more' },
  { value: '30', label: '30 days or more' },
] as const;

/** The table's fixed column heads (one more per format, by its code, between them). */
export const STUDENTS_COLUMNS = {
  student: 'Student',
  assessment: 'Assessment',
  lastActivity: 'Last activity',
} as const;

/** A format's status in a row (f0: "Completed" with its date under it, "In progress", "Not started"). */
export const FORMAT_STATUS_WORDS: Readonly<Record<FormatProgressStatus, string>> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
};

/** The Assessment column's drawn words (f0): the attempt waiting, or no attempt yet. */
export const ASSESSMENT_WORDS = {
  waiting: 'Waiting for marking',
  notStarted: 'Not started',
} as const;

/** The board script's no-match line (`s.noMatch`) and f6's empty state. */
export const STUDENTS_STATES = {
  noMatch: 'No student matches these filters.',
  emptyTitle: 'No students have this experiment yet',
  emptyLine: 'Students appear here when your Institute Admin gives them the experiment.',
} as const;

/** "Students who have the experiments you teach · as of 7 Nov 2026" (f0); the date once read. */
export function studentsMetaLine(asOf: string | null): string {
  return asOf === null ? STUDENTS_PAGE.meta : `${STUDENTS_PAGE.meta} · as of ${asOf}`;
}

/**
 * "5 of 5 students", "2 of 5 students" (f0, f1; the script's `count`). One student in all is
 * provisional (`FA-20.count-one`): "1 of 1 student".
 */
export function studentCountWords(shown: number, total: number): string {
  return `${shown} of ${total} ${total === 1 ? 'student' : 'students'}`;
}

/** The applied-filter chips (f1; the script's `PL` and "Inactive <n> days or more"). */
export function progressChip(label: string): string {
  return `Progress: ${label}`;
}

export function inactiveChip(days: number): string {
  return `Inactive ${days} days or more`;
}

/** A chip's remove button (the script's `c.aria`). */
export function removeChipLabel(label: string): string {
  return `Remove ${label}`;
}

/** The name link's accessible name (the script's `r.aria`): "Open Rahul Verma". */
export function openStudentLabel(name: string): string {
  return `Open ${name}`;
}

/** "Inactive 19 days" (f0 `xa-tag--draft`, the script's `inText`). */
export function inactiveTag(days: number): string {
  return `Inactive ${days} days`;
}

/** "None since access was given (12 Oct 2026)" (f0, Karthik Rao). */
export function noneSinceAccess(givenOn: string): string {
  return `None since access was given (${givenOn})`;
}

/** f2 (FA-22): "Exported students-shell-and-tube.csv · 5 rows" (the script's `expText`). */
export function exportedTitle(fileName: string, rows: number): string {
  return `Exported ${fileName} · ${rows} ${rows === 1 ? 'row' : 'rows'}`;
}

/**
 * f2: "Columns: student, student ID, experiment, WEB, VR, assessment, result released to student,
 * last activity. It contains the filtered list only." — the file's own header row, in order.
 */
export function exportedColumns(columns: readonly string[]): string {
  return `Columns: ${columns.join(', ')}. It contains the filtered list only.`;
}

// ---- FA-21 Student detail (f3 … f5) -------------------------------------------------------------

export const STUDENT_DETAIL = {
  /** `a.xr-back` → FA-20. */
  back: 'Students',
  progressTitle: 'Progress by format',
  /** `ul.xl-fl[aria-label]`. */
  progressLabel: 'Progress by format',
  perFormatOnly: 'Per format only — there is no overall percentage or verdict.',
  assessmentTitle: 'Assessment',
  /** f5: no attempt yet. */
  notStarted: 'Not started.',
  /** f3: the attempt waiting for marking (primary, → FA-19). */
  markAnswers: 'Mark their answers',
  /** f4: the marked attempt (secondary, → FA-19, read-only once confirmed). */
  seeSubmission: 'See submission',
  marked: 'Marked',
  waiting: 'Waiting for marking',
  resourcesTitle: 'Resources',
  notOpened: 'Not opened',
  /** `p.xl-open` under the sections. */
  feedbackNote: 'Feedback students give on a format isn’t shown to Faculty.',
} as const;

/** "Shell-and-Tube Heat Exchanger · ME ZG523" (the overline is drawn in capitals by CSS). */
export function detailOverline(experimentName: string, courseCode: string | null): string {
  return courseCode ? `${experimentName} · ${courseCode}` : experimentName;
}

/** f3 / f4 `Completed 14 Oct 2026` in the format list. */
export function completedOn(date: string): string {
  return `${FORMAT_STATUS_WORDS.completed} ${date}`;
}

/** f5: "No activity since access was given (12 Oct 2026) · 26 days". */
export function noActivitySinceAccess(givenOn: string, days: number): string {
  return `No activity since access was given (${givenOn}) · ${days} days`;
}

/** A Student inactive since their last activity (`FA-21.inactive`): "No activity since 19 Oct 2026 · 19 days". */
export function noActivitySince(lastOn: string, days: number): string {
  return `No activity since ${lastOn} · ${days} days`;
}

/**
 * f3: "Heat Exchanger — post-lab · attempt 1 of 2". With no attempt limit pinned the "of" part is
 * left out (`FA-21.attempt-title`).
 */
export function attemptTitle(name: string, attempt: number, allowed: number | null): string {
  return allowed === null
    ? `${name} · attempt ${attempt}`
    : `${name} · attempt ${attempt} of ${allowed}`;
}

/** f3: "submitted 5 Nov 2026, 18:52" after the attempt's ID. */
export function submittedWords(at: string): string {
  return `submitted ${at}`;
}

/** An attempt not submitted yet (`FA-21.attempt-in-progress`): "started 16 Nov 2026, 10:00". */
export function startedWords(at: string): string {
  return `started ${at}`;
}

/** A released result (`FA-21.released`): "Result released to Rahul 14 Nov 2026, 23:59". */
export function releasedLine(firstName: string, at: string): string {
  return `Result released to ${firstName} ${at}`;
}

/** f4: "11 of 16" after the Marked chip. */
export function marksWords(score: number, outOf: number): string {
  return `${score} of ${outOf}`;
}

/**
 * f4: "Result not released to Rahul yet — after the deadline, 14 Nov 2026, 23:59" — the attempt's
 * pinned release term and its instant. The other terms are provisional (`FA-21.release-words`).
 */
export function notReleasedLine(
  firstName: string,
  release: { readonly option: ReleaseOption | null; readonly on: string | null },
): string {
  const lead = `Result not released to ${firstName} yet`;
  if (release.option === 'after-deadline' && release.on !== null)
    return `${lead} — after the deadline, ${release.on}`;
  if (release.option === 'on-date' && release.on !== null) return `${lead} — on ${release.on}`;
  if (release.option === 'immediately-after-marking')
    return `${lead} — ${stateWords('FA-21.release-immediately')}`;
  return lead;
}

/** f3: "Opened 12 Oct 2026, 09:40" beside a resource. */
export function openedWords(at: string): string {
  return `Opened ${at}`;
}

// ---- FA-03 and FA-05: the way in (B4-02 f1, B4-03 f0 / f1 / f2 / f4) -----------------------------

export const STUDENTS_LINKS = {
  /** B4-02 f1, each experiment card: `a.xr-btn--text` after "Open experiment". */
  course: 'Students on this experiment',
  /** B4-03 f0: `a` under the per-format rows of Student activity. */
  experiment: 'See students on this experiment',
} as const;
