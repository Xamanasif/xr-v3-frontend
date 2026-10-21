/**
 * The words of FA-20 Students with its FA-22 Export CSV, and FA-21 Student detail, as the
 * owner-approved Faculty export draws them (V3 Refined B, design/v3-refined-b/roles/FA-v1
 * `project/Main.dc.html` FA-20, FA-21 and the script's `vmStudents`, `vmStudent`, `stuAsm`,
 * `lastAct`, `fmState`), written from the facts `TeachingService.listStudents`, `exportStudentsCsv`
 * and `getStudentDetail` answer (per-format status in words, the assessment's state, the last
 * activity and when the experiment was given, the attempts with their confirmed marks and pinned
 * release terms, the resources opened). Every phrase is the export's own, found verbatim in its
 * template or script (`faculty-students.test.ts`). What the export does not word is a provisional
 * entry of the state-copy register (`state-copy-faculty-students.ts`). Sample names, dates and
 * counts are never copied: they come from the records; no line names an attempt by its internal
 * reference.
 */
import type { FormatProgressStatus } from '@xr/domain';

import { stateWords } from './state-copy';

/** “1 student”, “5 students” (the export's `plural`). */
function plural(count: number, one: string): string {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

/** FA-20's page: the head, the experiment's surface and its toolbar. */
export const STUDENTS_PAGE = {
  /** `p.rk-sub` without a course taught (the institution named after it once one is). */
  lead: 'Students who have the experiments you teach.',
  /** The no-course message card. */
  noCourseTitle: 'No students to follow yet',
  noCourseLine:
    'Students appear here when you teach a course and your Institute Admin gives them its experiments. You haven’t been assigned a course yet.',
  /** `button#fa-sl-export` with the download glyph (FA-22). */
  exportCsv: 'Export CSV',
  /** `div.rk-tools[role=search]`. */
  filters: 'Filter students',
  experimentLabel: 'Experiment',
  progressLabel: 'Progress',
  inactiveLabel: 'Inactive for',
  clearFilters: 'Clear filters',
  /** The table's caption. */
  caption: 'Students who have the experiments you teach',
  /** The note under the surface. */
  footNote:
    'Contacting a student happens outside the platform. Feedback students give on a format isn’t shown to Faculty.',
} as const;

/** “Students who have the experiments you teach, from Godavari Institute of Technology.”. */
export function studentsLead(institution: string | null): string {
  return institution
    ? `Students who have the experiments you teach, from ${institution}.`
    : STUDENTS_PAGE.lead;
}

/** Under the experiment's name (`p.rk-hint`): “As of 7 Nov 2026 · progress in words, per format”. */
export function studentsAsOfLine(asOf: string): string {
  return `As of ${asOf} · progress in words, per format`;
}

/** The per-format summary's heading (`p.fa-k`): “All 5 students with access, by format”. */
export function formatSummaryTitle(students: number): string {
  return `All ${plural(students, 'student')} with access, by format`;
}

/** Its list's name: “Progress by format for all students with access to Shell-and-Tube …”. */
export function formatSummaryLabel(experiment: string): string {
  return `Progress by format for all students with access to ${experiment}`;
}

/** A unit meter's words (`p.fa-prog-t`): “2 completed”, “2 in progress”, “1 not started”. */
export const FORMAT_COUNT_WORDS = {
  completed: 'completed',
  inProgress: 'in progress',
  notStarted: 'not started',
} as const;

/** “Progress”: the options, in the drawn order (the service's `progress` filter values). */
export const PROGRESS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not-started', label: 'Not started' },
  { value: 'in-progress', label: 'In progress in a format' },
  { value: 'completed', label: 'Completed a format' },
  { value: 'waiting-for-marking', label: 'Waiting for marking' },
] as const;

/** “Inactive for”: the options, in the drawn order (the service's `inactiveForDays`). */
export const INACTIVE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '7', label: '7 days or more' },
  { value: '14', label: '14 days or more' },
  { value: '30', label: '30 days or more' },
] as const;

/** The table's column heads. */
export const STUDENTS_COLUMNS = {
  student: 'Student',
  progress: 'Progress by format',
  assessment: 'Assessment',
  lastActivity: 'Last activity',
} as const;

/** A format's status (“Completed” with its date beside it, “In progress”, “Not started”). */
export const FORMAT_STATUS_WORDS: Readonly<Record<FormatProgressStatus, string>> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
};

/** The assessment's state for a Student (`stuAsm` labels). */
export const ASSESSMENT_WORDS = {
  waiting: 'Waiting for marking',
  marked: 'Marked',
  notStarted: 'Not started',
  none: 'No assessment yet',
  /** FA-21: the experiment's assessment is a draft (`stuAsm` `draft`). */
  draft: 'Assessment in draft',
} as const;

/** The no-match and no-students states. */
export const STUDENTS_STATES = {
  noMatchTitle: 'No student matches these filters',
  noMatchLine: 'Try a shorter inactivity period or another progress filter.',
  emptyTitle: 'No students have this experiment yet',
  emptyLine: 'Students appear here when your Institute Admin gives them the experiment.',
} as const;

/**
 * The count (`p.rk-count[role=status]`): “5 students” with no filter on; “2 of 5 students” with
 * one (the script's `count`).
 */
export function studentCountWords(shown: number, total: number, filtered: boolean): string {
  return filtered ? `${shown} of ${plural(total, 'student')}` : plural(total, 'student');
}

/** The applied-filter chips (the script's `PL` and “Inactive <n> days or more”). */
export function progressChip(label: string): string {
  return `Progress: ${label}`;
}

export function inactiveChip(days: number): string {
  return `Inactive ${days} days or more`;
}

/** A chip's remove button (the script's `c.aria`): “Remove filter Progress: Not started”. */
export function removeChipLabel(label: string): string {
  return `Remove filter ${label}`;
}

/** The name link's accessible name (`r.aria`): “Open Rahul Verma”. */
export function openStudentLabel(name: string): string {
  return `Open ${name}`;
}

/**
 * A row's format list name (`r.fmAria`): “Progress by format: WEB completed 14 Oct 2026, VR in
 * progress”.
 */
export function formatCellLabel(
  formats: readonly {
    readonly code: string;
    readonly status: string;
    readonly date: string | null;
  }[],
): string {
  return `Progress by format: ${formats
    .map(
      (entry) => `${entry.code} ${entry.status.toLowerCase()}${entry.date ? ` ${entry.date}` : ''}`,
    )
    .join(', ')}`;
}

/** “Inactive 19 days” (`rk-tag-warn`, the script's `inText`; from 14 days). */
export function inactiveTag(days: number): string {
  return `Inactive ${days} days`;
}

/** “None since access was given (12 Oct 2026)” (the last-activity cell). */
export function noneSinceAccess(givenOn: string): string {
  return `None since access was given (${givenOn})`;
}

/** A waiting Student's line under the state: “Submitted 5 Nov 2026, 18:52”. */
export function submittedOnWords(at: string): string {
  return `Submitted ${at}`;
}

/** A Student not started yet: “Due 14 Nov 2026, 23:59”. */
export function dueWords(at: string): string {
  return `Due ${at}`;
}

/** A marked Student: “11 of 16 · result not released yet”, “11 of 16 · result released”. */
export function markedSubWords(score: number, outOf: number, released: boolean): string {
  return `${score} of ${outOf} · ${released ? 'result released' : 'result not released yet'}`;
}

/** FA-22: “Exported students-shell-and-tube-heat-exchanger.csv · 5 rows” (the script's `expT`). */
export function exportedTitle(fileName: string, rows: number): string {
  return `Exported ${fileName} · ${plural(rows, 'row')}`;
}

/**
 * FA-22: “It contains the filtered list only, as it was when you exported it. Columns: student,
 * student ID, experiment, WEB, VR, assessment, result released to student, last activity.” — the
 * file's own header row, in order.
 */
export function exportedColumns(columns: readonly string[]): string {
  return `It contains the filtered list only, as it was when you exported it. Columns: ${columns.join(', ')}.`;
}

/** The exported rows' region and caption. */
export const EXPORTED_ROWS = 'Rows in the exported file';

// ---- FA-21 Student detail -----------------------------------------------------------------------

export const STUDENT_DETAIL = {
  /** The breadcrumb → FA-20. */
  back: 'Students',
  progressTitle: 'Progress by format',
  /** `ul.fa-fmlist[aria-label]`. */
  progressLabel: 'Progress by format',
  perFormatOnly: 'Per format only — there is no overall percentage or verdict.',
  resourcesTitle: 'Resources',
  notOpened: 'Not opened',
  feedbackNote: 'Feedback students give on a format isn’t shown to Faculty.',
  /** The navy panel (`aside.rk-aside`). */
  assessmentTitle: 'Assessment',
  noAssessmentLine: 'There’s no assessment for this experiment yet.',
  draftLine: 'It’s a draft, so students can’t see it yet.',
  noDeadline: 'No deadline yet',
  /** The panel's actions: waiting (gold) → FA-19, marked → FA-19 read-only; the record → FA-08. */
  markAnswers: 'Mark their answers',
  viewMarks: 'View marks',
  openAssessment: 'Open the assessment',
} as const;

/** The eyebrow: “Shell-and-Tube Heat Exchanger · ME ZG523”. */
export function detailOverline(experimentName: string, courseCode: string | null): string {
  return courseCode ? `${experimentName} · ${courseCode}` : experimentName;
}

/** The head's line: “Last activity 5 Nov 2026”. */
export function lastActivityLine(on: string): string {
  return `Last activity ${on}`;
}

/** The head's line with no activity yet: “No activity since access was given (12 Oct 2026)”. */
export function noActivitySinceAccess(givenOn: string): string {
  return `No activity since access was given (${givenOn})`;
}

/** “as of 7 Nov 2026” beside “Progress by format”. */
export function asOfWords(asOf: string): string {
  return `as of ${asOf}`;
}

/** “Opened 12 Oct 2026, 09:40” beside a resource. */
export function openedWords(at: string): string {
  return `Opened ${at}`;
}

/** The panel's attempt line: “Attempt 1 of 2 · submitted 5 Nov 2026, 18:52”. */
export function attemptLine(attempt: number, allowed: number | null, submittedAt: string): string {
  const which =
    allowed === null
      ? stateWords('FA-21.attempt-unlimited').replace('{n}', String(attempt))
      : `Attempt ${attempt} of ${allowed}`;
  return `${which} · submitted ${submittedAt}`;
}

/** Nothing submitted yet: “2 attempts allowed. No attempt submitted yet.”. */
export function notSubmittedLine(allowed: number | null): string {
  return allowed === null
    ? stateWords('FA-21.not-submitted')
    : `${plural(allowed, 'attempt')} allowed. No attempt submitted yet.`;
}

/** An attempt started, not submitted: “Attempt 1 of 2 · started 16 Nov 2026, 10:00”. */
export function startedAttemptLine(
  attempt: number,
  allowed: number | null,
  startedAt: string,
): string {
  const which =
    allowed === null
      ? stateWords('FA-21.attempt-unlimited').replace('{n}', String(attempt))
      : `Attempt ${attempt} of ${allowed}`;
  return stateWords('FA-21.attempt-started')
    .replace('{attempt}', which)
    .replace('{date}', startedAt);
}
