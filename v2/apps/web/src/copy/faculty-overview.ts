/**
 * The words of FA-01 Overview, the Faculty workspace home (board B4-01 f0 … f4), written from the
 * facts `TeachingService.getFacultyOverview` answers (the scope line's counts, the attention facts
 * and the Ready assessments due in the next 30 days — PC-51: facts, never words). Every phrase is
 * the frozen board's own, found verbatim in its markup (`overview.test.tsx`); what B4-01 does not
 * word is a provisional entry of the state-copy register (`state-copy-faculty-overview.ts`, VD-12).
 * The board's sample names, counts and dates are never copied: they come from the records.
 */
import { stateWords } from './state-copy';

export const FACULTY_OVERVIEW_WORDS = {
  /** `section.xr-section` "Needs your attention" (f0, f1, f3, f4). */
  attention: 'Needs your attention',
  /** f1 "Nothing needs you": `div.xr-empty` with the done icon in the ok tint. */
  calmTitle: 'Nothing needs you right now.',
  calmLine: 'Written answers to mark, drafts to review and inactive students appear here.',
  /** `section.xr-section` "Coming up" and its `span.xr-meta`. */
  comingUp: 'Coming up',
  comingUpMeta: 'at most 3',
  /** f3: Coming up with no Ready assessment due in the next 30 days. */
  noDeadlines: 'No deadlines in the next 30 days.',
  /** A Coming up row's action (→ the assessment's Summary, FA-08). */
  open: 'Open',
  /** f2 "No courses yet" (before the Institute Admin assigns a course in Faculty courses). */
  noCoursesTitle: 'Your Institute Admin hasn’t assigned you courses yet',
  noCoursesLine:
    'When they assign you a course in Faculty courses, its experiments, assessments and students appear here.',
  help: 'Help',
  /** The scope line's link and the access-ended row's action (→ My courses, FA-02). */
  myCourses: 'My courses',
} as const;

/** The Faculty boards' failed formula (B4-02 f5 "We couldn’t load your experiments"). */
export const FACULTY_FAILED_WORDS = {
  line: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
} as const;

function count(value: number, one: string, many: string): string {
  return `${value} ${value === 1 ? one : many}`;
}

/**
 * The scope line before its "My courses" link: "You teach 1 course · 1 experiment · " (f0, f1,
 * f3, f4). Other counts are written in the plural (state-copy `FA-01.scope-counts`).
 */
export function scopeLineWords(courses: number, experiments: number): string {
  return `You teach ${count(courses, 'course', 'courses')} · ${count(
    experiments,
    'experiment',
    'experiments',
  )} · `;
}

/** The attention count: "3 items" (f0, f4), "1 item" (f3). */
export function attentionCountWords(items: number): string {
  return count(items, 'item', 'items');
}

/**
 * f3 "Your institution’s access to Shell-and-Tube Heat Exchanger ended on 7 Oct 2027" — the
 * experiment's name and the date its institution's access ended (`endedOnWords`).
 */
export function accessEndedTitle(experimentName: string, endedOn: string): string {
  return `Your institution’s access to ${experimentName} ended on ${endedOn}`;
}

const ACCESS_ENDED_LINE = 'students can’t open it now; their work and results are kept';

/**
 * f3 "ME ZG523 · students can’t open it now; their work and results are kept" — the course code
 * Faculty see first; without one, the line alone (state-copy `FA-01.access-ended-no-code`).
 */
export function accessEndedSub(courseCode: string | null): string {
  return courseCode === null
    ? stateWords('FA-01.access-ended-no-code')
    : `${courseCode} · ${ACCESS_ENDED_LINE}`;
}

/**
 * A Coming up row's line: "Due 14 Nov 2026, 23:59 · 1 of 5 students submitted" (f0, f1, f4) —
 * the deadline in words (`deadlineWords`), the Students who submitted and the Students the
 * assessment reaches; one Student reached reads "1 student" (state-copy `FA-01.reach-one`).
 */
export function comingUpSub(deadline: string, submitted: number, reach: number): string {
  const students = reach === 1 ? stateWords('FA-01.reach-one') : 'students submitted';
  return `Due ${deadline} · ${submitted} of ${reach} ${students}`;
}

/** B4-01 f0 "1 written answer to mark"; "<n> written answers to mark" (the sidebar's plural, board 06). */
export function writtenAnswersTitle(answers: number): string {
  return answers === 1 ? '1 written answer to mark' : `${answers} written answers to mark`;
}

/**
 * B4-01 f0 "Heat Exchanger — post-lab · from Rahul Verma, 5 Nov 2026"; with several waiting, the
 * oldest is named ("· oldest from …", state-copy `FA-01.written-several`).
 */
export function writtenAnswersSub(
  assessment: string,
  student: string,
  date: string,
  answers: number,
): string {
  return answers === 1
    ? `${assessment} · from ${student}, ${date}`
    : `${assessment} · ${stateWords('FA-01.written-several')} ${student}, ${date}`;
}
