/**
 * The words of the Faculty member's courses and experiments — FA-02 My courses (the course ledger),
 * FA-04 its Experiments tab (the refined table) and FA-03 Course (the identity band and one panel
 * per experiment) — as the owner-approved V3 export draws them (design/v3-refined-b/roles/FA-v1
 * `project/Main.dc.html`: the FA-02 · FA-04 and FA-03 templates, the script's `vmCourses` and
 * `vmCourse`). Written from the facts the ports answer (`TeachingService.listMyCourses`,
 * `getTeachingExperiment`, `AssessmentService.listAssessments`, `getCreateOptions`): read models
 * carry no words. Every phrase is the export's own, in its template or composed as its script
 * composes it (`courses.test.tsx`); what the export does not word is a provisional entry of the
 * state-copy register (`state-copy-faculty-courses.ts`). The export's sample course, counts and dates
 * are never copied: they come from the records. No line names an internal reference.
 */
import type { Technology } from '@xr/domain';

import { endedOnWords } from './assessment-words';
import { FA_FILTER_WORDS, removeFilterLabel as removeFilterWords } from './fa-shared';
import { counted } from './faculty-overview';

// ---- FA-02 My courses ------------------------------------------------------------------------------

export const MY_COURSES_PAGE = {
  /** `p.rk-sub` under the H1. */
  lead: 'Courses your Institute Admin assigned you in Faculty courses',
  /** The tabs' `nav` name (`nav.rk-tabs[aria-label]`). */
  tabsLabel: 'My courses',
  /** The Courses tab's heading for screen readers (`h2.xr-sr`). */
  coursesHeading: 'Courses you teach',
  source: 'Assigned to you by your Institute Admin',
  figures: {
    experiments: 'Experiments',
    students: 'Students with access',
    assessments: 'Assessments',
  },
  openCourse: 'Open course',
  columns: {
    experiment: 'Experiment and formats your institution has',
    students: 'Students',
    assessment: 'Assessment',
  },
  noneYet: 'None yet',
  createFromExperiment: 'Create one from the experiment page.',
  foot: 'Courses come from Faculty courses, set by your Institute Admin. Only experiments your institution holds are listed.',
  noneAssignedTitle: 'Your Institute Admin hasn’t assigned you courses yet',
  noneAssignedLine: 'Courses appear here when they assign you one in Faculty courses.',
} as const;

/** "1 course · 1 experiment" (the ledger's count). */
export function courseCountWords(courses: number, experiments: number): string {
  return `${counted(courses, 'course')} · ${counted(experiments, 'experiment')}`;
}

/** "Open course ME ZG523 Thermodynamics & Heat Transfer". */
export function openCourseLabel(code: string | null, name: string): string {
  return code
    ? `${MY_COURSES_PAGE.openCourse} ${code} ${name}`
    : `${MY_COURSES_PAGE.openCourse} ${name}`;
}

/** "Experiments in ME ZG523" (the experiment list's name). */
export function courseExperimentsLabel(code: string | null, name: string): string {
  return `Experiments in ${code ?? name}`;
}

/** "5 with access" or "None yet" (a ledger row's Students cell). */
export function withAccessWords(students: number): string {
  return students > 0 ? `${students} with access` : MY_COURSES_PAGE.noneYet;
}

/** "Due 14 Nov 2026, 23:59 · created by Dr S. Ranganathan" — an assessment's line in a list. */
export function assessmentDueLine(deadline: string | null, colleague: string | null): string {
  const due = deadline === null ? 'No deadline set yet' : `Due ${deadline}`;
  return colleague === null ? due : `${due} · created by ${colleague}`;
}

/** "Access ended on 7 Oct 2027 · earlier work and results kept" — a course's source line (f7). */
export function accessEndedLine(endedOn: string): string {
  return `Access ended on ${endedOnWords(endedOn)} · earlier work and results kept`;
}

// ---- FA-04 Experiments ------------------------------------------------------------------------------

export type ActivityFilter = 'all' | 'some' | 'none';

export const EXPERIMENTS_TAB = {
  /** The tab's heading for screen readers and the table's caption. */
  section: 'Experiments you teach',
  /** The search landmark's name (`div.rk-tools[role=search]`). */
  filtersLabel: 'Filter experiments',
  searchLabel: 'Search',
  searchPlaceholder: 'Experiment or course',
  formatLabel: 'Format',
  allFormats: 'All formats',
  activityLabel: 'Student activity',
  /** The activity options in the export's order (`all`, `some`, `none`). */
  activity: { all: 'All', some: 'With activity', none: 'No activity yet' },
  clearFilters: FA_FILTER_WORDS.clear,
  noMatchTitle: 'No experiment matches these filters',
  noMatchLine:
    'Only experiments in your courses that your institution holds are listed. Try fewer filters or a different spelling.',
  loading: 'Loading your experiments…',
  failedTitle: 'We couldn’t load your experiments',
  failedLine: 'Nothing has changed. Try again.',
  tryAgain: 'Try again',
  emptyTitle: 'No experiments yet',
  emptyLine:
    'Experiments appear here when your Institute Admin assigns you a course that your institution holds.',
  columns: {
    experiment: 'Experiment',
    activity: 'Student activity, by format',
    assessment: 'Assessment',
  },
  formatsKey: 'Formats your institution has',
  noStudents: 'No students have it yet',
} as const;

/** "1 experiment", or "0 of 1 experiment" while a filter applies (the count line). */
export function experimentCountWords(listed: number, all: number, filtered: boolean): string {
  return filtered ? `${listed} of ${counted(all, 'experiment')}` : counted(all, 'experiment');
}

/** "Search: “fin-tube”" (the search chip). */
export function searchChip(query: string): string {
  return `Search: “${query}”`;
}

/** "Remove filter Format: VR" (a chip's remove button). */
export function removeFilterLabel(chip: string): string {
  return removeFilterWords({ label: chip });
}

/** "Format: VR" (the format chip). */
export function formatChip(format: Technology): string {
  return `${EXPERIMENTS_TAB.formatLabel}: ${format.toUpperCase()}`;
}

/** "Open Shell-and-Tube Heat Exchanger" (the row link's accessible name). */
export function openExperimentLabel(name: string): string {
  return `Open ${name}`;
}

/** "ME ZG523 · Thermodynamics & Heat Transfer" (the row's course line). */
export function courseLine(code: string | null, courseName: string): string {
  return code ? `${code} · ${courseName}` : courseName;
}

/** "5 students with access · as of 7 Nov 2026" (under the meters). */
export function reachAsOfWords(students: number, date: string): string {
  return `${counted(students, 'student')} with access · as of ${date}`;
}

// ---- FA-03 Course -----------------------------------------------------------------------------------

export const COURSE_PAGE = {
  /** The eyebrow after the code (`p.rk-eyebrow.fa-cid-eyebrow`). */
  eyebrow: 'Course you teach',
  source: 'Assigned to you by your Institute Admin in Faculty courses.',
  studentsWithAccess: 'Students with access',
  experimentsSection: 'Experiments',
  experimentsNote: 'Only experiments your institution holds',
  formatsKey: 'Formats your institution has',
  openExperiment: 'Open experiment',
  activity: 'Student activity, by format',
  assessment: 'Assessment',
  studentsLink: 'Students on this experiment',
  noStudents:
    'No students have this experiment yet. They appear when your Institute Admin gives them access.',
} as const;

/** "Experiment your institution holds" / "Experiments your institution holds" (the figure). */
export function experimentsHeldLabel(count: number): string {
  return count === 1 ? 'Experiment your institution holds' : 'Experiments your institution holds';
}

/** "Assessment ready" / "Assessments ready" (the figure). */
export function assessmentsReadyLabel(count: number): string {
  return count === 1 ? 'Assessment ready' : 'Assessments ready';
}

/** "Open experiment Shell-and-Tube Heat Exchanger". */
export function openExperimentFullLabel(name: string): string {
  return `${COURSE_PAGE.openExperiment} ${name}`;
}

/** "5 students with access" (under the meters). */
export function studentsWithAccessWords(students: number): string {
  return `${counted(students, 'student')} with access`;
}
