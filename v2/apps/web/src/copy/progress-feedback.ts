/**
 * The words of the Student's ST-15 Progress (B3-05) and ST-16 Format feedback with its ST-17
 * Feedback sent state (B3-06) — Phase 3. Every string here is a board's own
 * (`progress-feedback.test.ts` finds each on its board, the composed ones with the board's own
 * values); the per-format status words ("Completed 14 Oct 2026", "In progress", "Not started") and
 * the ST-08 / ST-09 / ST-17 headings are the WP-0.14 words of `flow-state-words.ts`. What no board
 * words is a provisional entry of the state-copy register (`state-copy-progress-feedback.ts`,
 * VD-12). Names, ids, dates and ratings are the sample world's, never typed here.
 */
import {
  FEEDBACK_STATEMENTS,
  type FormatProgressStatus,
  RATING_SCALE,
  type Rating,
  type Technology,
} from '@xr/domain';

import { dateTime, dayMonthYear } from './dates';
import { formatCode } from './student';

// ---- ST-15 Progress (B3-05) -------------------------------------------------------------------

export const PROGRESS_PAGE = {
  meta: 'What you’ve started and finished, format by format',
  statusLabel: 'Status',
  allStatuses: 'All statuses',
  courseLabel: 'Course',
  allCourses: 'All courses',
  clearFilters: 'Clear filters',
  formatsLabel: 'Progress by format',
  showDetails: 'Show details',
  assessment: 'Assessment',
  noneSetYet: 'None set yet',
  noMatchTitle: 'No experiments match these filters',
  nothingTitle: 'Nothing to show yet',
  nothingLine:
    'Your progress appears here when your institution gives you an experiment and you start a format.',
  loading: 'Loading your progress',
  failedTitle: 'We couldn’t load your progress',
  paused: 'Paused',
} as const;

/** The Status filter's options in the board's order (B3-05 `Gp-st`: prog, done, none). */
export const STATUS_OPTIONS: readonly (readonly [FormatProgressStatus, string])[] = [
  ['in-progress', 'In progress'],
  ['completed', 'Completed'],
  ['not-started', 'Not started'],
];

/** "Status: Not started" (B3-05 `'Status: ' + LBL[s.st]`; f3 "Remove Status: Not started"). */
export function statusChip(label: string): string {
  return `Status: ${label}`;
}

/** "Course: ME ZG523" (B3-05 `'Course: ' + s.crs`). */
export function courseChip(code: string): string {
  return `Course: ${code}`;
}

/** "1 experiment", "0 experiments" (B3-05 `count`; the course heading's "· 1 experiment"). */
export function experimentCount(count: number): string {
  return count === 1 ? '1 experiment' : `${count} experiments`;
}

/** "Given by your institution · SACC-0310" (B3-05 f0): the grant the access is routed through. */
export function givenThroughWords(grantId: string): string {
  return `Given by your institution · ${grantId}`;
}

/** "Last saved 12 Oct 2026, 11:20" (B3-05 f1): WEB in progress, the runtime's time (OD-B3-07). */
export function lastSavedWords(at: string): string {
  return `Last saved ${dateTime(at)}`;
}

/** "Last session reported 16 Oct 2026, 14:10" (B3-04 f0; B3-06 f5): a headset format in progress. */
export function lastSessionWords(at: string): string {
  return `Last session reported ${dateTime(at)}`;
}

/**
 * "Completed 14 Oct 2026 before the pause", "Not started before the pause" (B3-05 f5); "In progress
 * before the pause" on the same pattern (state-copy `ST-15.paused-in-progress`).
 */
export function beforePauseWords(progressWords: string): string {
  return `${progressWords} before the pause`;
}

/** "Feedback sent 14 Oct 2026" (B3-05 f2, f9). */
export function feedbackSentWords(sentAt: string): string {
  return `Feedback sent ${dayMonthYear(sentAt)}`;
}

/** "Open VR" (B3-05 f0 → B3-04); "Open WEB" (B3-02 f0 → B3-03). */
export function openFormatWords(format: Technology): string {
  return `Open ${formatCode(format)}`;
}

/** The "Show details" rows (B3-05 f0, f1, f2, f9). */
export const PROGRESS_DETAILS = {
  /** "First opened 12 Oct 2026, 10:05" (WEB). */
  firstOpened: (at: string) => `First opened ${dateTime(at)}`,
  /** "First session reported 16 Oct 2026, 14:10" (VR). */
  firstSession: (at: string) => `First session reported ${dateTime(at)}`,
  /** "· completed 14 Oct 2026, 15:30". */
  completed: (at: string) => `completed ${dateTime(at)}`,
  /** "· last saved 12 Oct 2026, 11:20" (f1). */
  lastSaved: (at: string) => `last saved ${dateTime(at)}`,
  /** "· last session reported …" — a headset format in progress (state-copy `ST-15.details`). */
  lastSession: (at: string) => `last session reported ${dateTime(at)}`,
  /** "Completed …" — a completion with no reported activity (state-copy `ST-15.details`). */
  completedAlone: (at: string) => `Completed ${dateTime(at)}`,
  /** "WEB feedback" (f2). */
  feedbackKey: (format: Technology) => `${formatCode(format)} feedback`,
  /** "Sent 14 Oct 2026" (f2). */
  sent: (at: string) => `Sent ${dayMonthYear(at)}`,
} as const;

// ---- ST-16 Format feedback / ST-17 Feedback sent (B3-06) ----------------------------------------

export const FEEDBACK_PAGE = {
  overline: 'Give feedback',
  lead: 'Your feedback helps improve this experience.',
  instruction: 'Rate all five statements. Additional comments are optional.',
  comments: 'Additional comments',
  optional: '(optional)',
  cancel: 'Cancel',
  submit: 'Submit feedback',
  sending: 'Sending…',
  failedTitle: 'Your feedback wasn’t sent',
  failedLine: 'Nothing was lost — your answers are still here. Try again.',
  backToExperiment: 'Back to experiment',
  seeProgress: 'See your progress',
  answersLabel: 'Your answers',
  noComment: '—',
} as const;

/** "Feedback on VR" (B3-06 f0: the top bar's title and current crumb). */
export function feedbackTitle(format: Technology): string {
  return `Feedback on ${formatCode(format)}`;
}

/** The five statements' places (B3-06 `FB.qs`, statement set 1). */
export const STATEMENT_INDEXES: readonly number[] = FEEDBACK_STATEMENTS.map((_, index) => index);

/** "Strongly disagree" … "Strongly agree" by point (B3-06 `FB.scale`). */
export const RATING_LABELS: Readonly<Record<Rating, string>> = RATING_SCALE;

/** "1. This experience helped me understand the concept." (B3-06 `n + '. ' + t`). */
export function statementLegend(index: number): string {
  return `${index + 1}. ${FEEDBACK_STATEMENTS[index]!}`;
}

/** "Thank you. Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent." (B3-06 f4). */
export function sentLine(sentAt: string): string {
  return `Thank you. Sent ${dateTime(sentAt)}. Feedback can’t be changed after it’s sent.`;
}

/** "Your answers · VR" (B3-06 f3, f4). */
export function answersHeading(format: Technology): string {
  return `Your answers · ${formatCode(format)}`;
}

/** "4 — Agree" (B3-06 `s.ans[i + 1] + ' — ' + D.scale[…]`). */
export function answerWords(rating: Rating): string {
  return `${rating} — ${RATING_SCALE[rating]}`;
}

// ---- ST-01 Home's Up next feedback item (B2-10 f5) ----------------------------------------------

/** The Up next feedback item's button (B2-10 f5 → B3-06). */
export const UP_NEXT_FEEDBACK = 'Give feedback';
