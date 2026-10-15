/**
 * The words of the Faculty member's courses and experiments — FA-02 My courses (board B4-02 f0,
 * f6, f7), FA-04 its Experiments tab (f2 … f5, f8) and FA-03 Course (f1) — written from the facts
 * the ports answer (`TeachingService.listMyCourses`, `getTeachingExperiment`,
 * `AssessmentService.listAssessments`, `getCreateOptions`): read models carry no words. Every
 * phrase here is B4-02's own, found verbatim in its markup or script (`courses.test.tsx`); what
 * B4-02 does not word is a provisional entry of the state-copy register
 * (`state-copy-faculty-courses.ts`, VD-12), read through `stateWords`. The board's sample course,
 * counts and dates are never copied: they come from the records.
 */
import type { Technology } from '@xr/domain';

import { endedOnWords } from './assessment-words';
import { stateWords } from './state-copy';

/** One of a count: "1 experiment", "5 experiments" (the board's own plural, `count` in its script). */
function counted(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// ---- FA-02 My courses (B4-02 f0, f6, f7) ----

export const MY_COURSES_PAGE = {
  /** `span.xr-overline` (drawn in capitals by CSS). */
  overline: 'Courses you teach',
  meta: 'From Faculty courses, set by your Institute Admin',
  /** The section tabs' `nav` name (`nav.xr-tabs[aria-label]`). */
  tabsLabel: 'My courses',
  coursesSection: 'Courses',
  openCourse: 'Open course',
  noneAssignedTitle: 'Your Institute Admin hasn’t assigned you courses yet',
  noneAssignedLine: 'Courses appear here when they assign you one in Faculty courses.',
} as const;

/** "1 course" (f0 section meta). */
export function courseCountWords(count: number): string {
  return counted(count, 'course', 'courses');
}

/** "Open course Thermodynamics & Heat Transfer" (f0 `aria-label`). */
export function openCourseLabel(name: string): string {
  return `${MY_COURSES_PAGE.openCourse} ${name}`;
}

/** "1 experiment" (f0 row, f2 count). */
export function experimentCountWords(count: number): string {
  return counted(count, 'experiment', 'experiments');
}

/** "5 students with access" (f0 row); one is `FA-02.students-one`. */
export function studentsWithAccessWords(count: number): string {
  return count === 1 ? `1 ${stateWords('FA-02.students-one')}` : `${count} students with access`;
}

/** "1 assessment" (f0 row); any other count is `FA-02.assessments-count`. */
export function assessmentCountWords(count: number): string {
  return counted(count, 'assessment', 'assessments');
}

/** "1 experiment · 5 students with access · 1 assessment" — after the code (f0). */
export function courseFactsLine(row: {
  readonly experiments: number;
  readonly studentsWithAccess: number;
  readonly assessments: number;
}): string {
  return [
    experimentCountWords(row.experiments),
    studentsWithAccessWords(row.studentsWithAccess),
    assessmentCountWords(row.assessments),
  ].join(' · ');
}

/** "Access ended on 7 Oct 2027 · earlier work and results kept" — after the code (f7). */
export function accessEndedLine(endedOn: string): string {
  return `Access ended on ${endedOnWords(endedOn)} · earlier work and results kept`;
}

// ---- FA-04 Experiments (B4-02 f2 … f5, f8) ----

export type ActivityFilter = 'all' | 'some' | 'none';

export const EXPERIMENTS_TAB = {
  section: 'Experiments you teach',
  searchLabel: 'Search experiments',
  searchPlaceholder: 'Experiment or course',
  formatLabel: 'Format',
  allFormats: 'All formats',
  activityLabel: 'Activity',
  /** The Activity options in the board's order (`all`, `some`, `none` in its script). */
  activity: { all: 'All', some: 'With activity', none: 'No activity yet' },
  clearFilters: 'Clear filters',
  /** f3: "No experiment matches." then the "Clear filters" text button. */
  noMatch: 'No experiment matches.',
  loading: 'Loading your experiments',
  failedTitle: 'We couldn’t load your experiments',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  open: 'Open',
  columns: {
    experiment: 'Experiment',
    formats: 'Formats your institution has',
    assessment: 'Assessment',
    action: 'Action',
  },
} as const;

/** "Completed (WEB)" — one column per format, never summed (f2). */
export function completedHeader(format: Technology): string {
  return `Completed (${format.toUpperCase()})`;
}

/** "Format: WEB" (the board script's chip). */
export function formatChip(format: Technology): string {
  return `${EXPERIMENTS_TAB.formatLabel}: ${format.toUpperCase()}`;
}

/** "Open Shell-and-Tube Heat Exchanger" (f2 `aria-label`). */
export function openExperimentLabel(name: string): string {
  return `${EXPERIMENTS_TAB.open} ${name}`;
}

// ---- FA-03 Course (B4-02 f1) ----

export const COURSE_PAGE = {
  overline: 'Course you teach',
  experimentsSection: 'Experiments',
  experimentsMeta: 'Only experiments your institution holds',
  assessmentReady: 'Assessment ready',
  formatsKey: 'Formats your institution has',
  assessmentKey: 'Assessment',
  /** `ul.xa-counts[aria-label]`. */
  countsLabel: 'Student activity by format',
  completed: 'completed',
  inProgress: 'in progress',
  notStarted: 'not started',
  openExperiment: 'Open experiment',
} as const;

/** "1 experiment in your institution’s access · 5 students with access" (f1 meta). */
export function courseMetaLine(row: {
  readonly experiments: number;
  readonly studentsWithAccess: number;
}): string {
  const experiments =
    row.experiments === 1
      ? '1 experiment in your institution’s access'
      : `${row.experiments} experiments in your institution’s access`;
  return `${experiments} · ${studentsWithAccessWords(row.studentsWithAccess)}`;
}

/**
 * "Heat Exchanger — post-lab · due 14 Nov 2026, 23:59 · 1 of 5 submitted · 1 waiting for marking"
 * (f1). The deadline is left out while none is set and the waiting count while none waits
 * (`FA-03.assessment-line`).
 */
export function assessmentLine(input: {
  readonly name: string;
  readonly deadline: string | null;
  readonly submitted: number;
  readonly reach: number;
  readonly waiting: number;
}): string {
  return [
    input.name,
    input.deadline === null ? null : `due ${input.deadline}`,
    `${input.submitted} of ${input.reach} submitted`,
    input.waiting > 0 ? `${input.waiting} waiting for marking` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}
