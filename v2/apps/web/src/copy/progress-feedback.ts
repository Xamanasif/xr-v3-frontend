/**
 * The words of the Student's ST-15 Progress and ST-16 Format feedback with its ST-17 Feedback sent
 * state, as the owner-approved V3 Student export draws them (design/v3-refined-b/roles/ST-v1,
 * `project/StudentFinal.dc.html`: the `progress` and `feedback` regions, `progVM`, `progExp`,
 * `fbVM`, `msg('fb-not')`). Every string here is the export's own (`progress-feedback.test.ts` finds
 * each in it, the composed ones with the export's own values); the per-format pieces ST-15 shares
 * with the hub's ST-10 (chips, pills, facts, actions) are `st-shared.ts`'s, the ST-17 heading is the
 * WP-0.14 words of `flow-state-words.ts`, and what the export does not draw is a provisional entry of
 * the state-copy register (`state-copy-progress-feedback.ts`). No word names a record by its internal
 * reference (lead decision 3): the grant line names no grant. Names, dates and ratings are the
 * records', never typed here.
 */
import {
  FEEDBACK_STATEMENTS,
  type FormatProgressStatus,
  RATING_SCALE,
  type Rating,
  type Technology,
} from '@xr/domain';

import { formatCode } from './student';
import { stDateTime, stDay } from './st-shared';

// ---- ST-15 Progress ------------------------------------------------------------------------------

export const PROGRESS_PAGE = {
  /** `p.rk-sub` under the H1. */
  meta: 'What you’ve started and finished, format by format',
  /** The surface's heading, read by screen readers only. */
  panelTitle: 'Your progress by course',
  /** The filters' search region. */
  filtersLabel: 'Filter your progress',
  statusLabel: 'Status',
  allStatuses: 'All statuses',
  courseLabel: 'Course',
  allCourses: 'All courses',
  noMatchTitle: 'No experiments match these filters',
  noMatchLine: 'Try a different status or course.',
  nothingTitle: 'Nothing to show yet',
  nothingLine:
    'Your progress appears here when your institution gives you an experiment and you start a format.',
  loading: 'Loading your progress…',
  failedTitle: 'We couldn’t load your progress',
  /** The grant line under an experiment's name (no grant reference: lead decision 3). */
  given: 'Given by your institution',
} as const;

/** The Status filter's options in the export's order (`prog`, `done`, `none`). */
export const STATUS_OPTIONS: readonly (readonly [FormatProgressStatus, string])[] = [
  ['in-progress', 'In progress'],
  ['completed', 'Completed'],
  ['not-started', 'Not started'],
];

/** "Status: Completed" (`'Status: ' + …`). */
export function statusChip(label: string): string {
  return `Status: ${label}`;
}

/** "Course: MEC-523" (`'Course: ' + C.own`). */
export function courseChip(code: string): string {
  return `Course: ${code}`;
}

/** A chip's remove button: "Remove filter Status: Completed" (`'Remove filter ' + c.label`). */
export function removeFilterWords(label: string): string {
  return `Remove filter ${label}`;
}

/** "1 experiment", "2 experiments" (a course group's `d`). */
export function experimentCount(count: number): string {
  return count === 1 ? '1 experiment' : `${count} experiments`;
}

function courseCount(count: number): string {
  return count === 1 ? '1 course' : `${count} courses`;
}

/**
 * The count beside the filters (`P.count`): "1 experiment in 1 course" with no filter, "0 of 1
 * experiment" with one.
 */
export function progressCount(
  shown: number,
  total: number,
  courses: number,
  filtered: boolean,
): string {
  return filtered
    ? `${shown} of ${experimentCount(total)}`
    : `${experimentCount(total)} in ${courseCount(courses)}`;
}

/** The assessment line of an experiment (`progExp` `asmt`, `asmtLink`). */
export const PROGRESS_ASSESSMENT = {
  noneSet: 'Not set by your faculty yet',
  toDo: (name: string, deadline: string | null) =>
    deadline === null ? `${name} · to do` : `${name} · to do · due ${stDateTime(deadline)}`,
  inProgress: (name: string) => `${name} · attempt in progress`,
  waiting: (name: string) => `${name} · submitted, waiting for marking`,
  notReleased: (name: string) => `${name} · marked, result not released yet`,
  released: (name: string, passed: boolean, score: number, outOf: number, releasedAt: string) =>
    `${name} · ${passed ? 'passed' : 'not passed'} · ${score} of ${outOf} marks · released ${stDay(releasedAt)}`,
  open: 'Open assessment',
  continueAttempt: 'Continue attempt',
  seeResult: 'See result',
} as const;

// ---- ST-16 Format feedback / ST-17 Feedback sent ---------------------------------------------------

export const FEEDBACK_PAGE = {
  /** `p.rk-sub` under the H1 while the form shows. */
  lead: 'Your feedback helps improve this experience. Rate all five statements; additional comments are optional.',
  /** The current crumb. */
  crumb: 'Feedback',
  /** The scale's head (`sv-lk-head-t`). */
  rateEach: 'Rate each statement',
  /** A statement's choice in words before one is made (`sv-lk-sel`). */
  notRated: 'Not rated yet',
  comments: 'Additional comments (optional)',
  cancel: 'Cancel',
  submit: 'Submit feedback',
  sending: 'Sending…',
  failedTitle: 'Your feedback wasn’t sent',
  failedLine: 'Nothing was lost — your answers are still here. Try again.',
  thankYou: 'Thank you',
  backToExperiment: 'Back to experiment',
  seeProgress: 'See your progress',
  readOnly: 'Read-only',
  /** The sent comment's term (`sv-fbsent-c`). */
  commentsSent: 'Additional comments',
  noComment: '—',
} as const;

/** "Feedback on VR" (the H1, the sheet's name, the top bar's title). */
export function feedbackTitle(format: Technology): string {
  return `Feedback on ${formatCode(format)}`;
}

/** The five statements' places (statement set 1, `FBQ`). */
export const STATEMENT_INDEXES: readonly number[] = FEEDBACK_STATEMENTS.map((_, index) => index);

/** "Strongly disagree" … "Strongly agree" by point (`SCALE`). */
export const RATING_LABELS: Readonly<Record<Rating, string>> = RATING_SCALE;

/** "1. This experience helped me understand the concept." (`n + '. ' + t`). */
export function statementLegend(index: number): string {
  return `${index + 1}. ${FEEDBACK_STATEMENTS[index]!}`;
}

/** "Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent." (`sv-fbsent-d`). */
export function sentLine(sentAt: string): string {
  return `Sent ${stDateTime(sentAt)}. Feedback can’t be changed after it’s sent.`;
}

/** "Your answers · VR". */
export function answersHeading(format: Technology): string {
  return `Your answers · ${formatCode(format)}`;
}

/** "4 — Agree" (`v + ' — ' + SC[v - 1]`). */
export function answerWords(rating: Rating): string {
  return `${rating} — ${RATING_SCALE[rating]}`;
}

/** Feedback not open yet — the format not completed (`msg('fb-not')`). */
export const FEEDBACK_NOT_OPEN = {
  kicker: (experimentName: string) => `${experimentName} · Feedback`,
  title: (format: Technology) => `Feedback on ${formatCode(format)} isn’t open yet`,
  line: (format: Technology) => {
    const code = formatCode(format);
    return `You can give feedback on ${code} once ${code} is recorded as completed. Each format has its own feedback.`;
  },
  back: (format: Technology) => `Back to ${formatCode(format)}`,
} as const;

// ---- ST-01 Home's Up next feedback item (B2-10 f5) ----------------------------------------------

/** The Up next feedback item's button (B2-10 f5 → B3-06). */
export const UP_NEXT_FEEDBACK = 'Give feedback';
