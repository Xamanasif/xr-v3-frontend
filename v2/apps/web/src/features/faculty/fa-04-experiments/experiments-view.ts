import type { Technology } from '@xr/domain';
import type { FaProgressRow } from '@xr/ui/v3';

import { deadlineWords } from '@/copy/assessment-words';
import { dayMonthYear } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import {
  type ActivityFilter,
  assessmentDueLine,
  courseLine,
  EXPERIMENTS_TAB,
  formatChip,
  MY_COURSES_PAGE,
  openExperimentLabel,
  reachAsOfWords,
  searchChip,
} from '@/copy/faculty-courses';
import { activityLabel } from '@/copy/faculty-overview';
import { facultyExperimentAddress } from '@/nav/faculty';

import type { TaughtExperiment } from './taught-experiments';
import { assessmentStateView, type StatusView } from '../shared/assessment-state';
import {
  colleagueOf,
  FORMAT_ORDER,
  formatCodes,
  progressRows,
  studentsReached,
} from './teaching-view';

/**
 * FA-04's view (the export's `vmCourses` for the Experiments tab): the filters, the chips and the
 * count, and each taught experiment as a table row — its course, the formats the institution has,
 * one unit meter per format with the Students reached "as of" the read, and its assessment. Pure.
 */

export interface Filters {
  readonly search: string;
  readonly format: Technology | 'all';
  readonly activity: ActivityFilter;
}

export const NO_FILTERS: Filters = { search: '', format: 'all', activity: 'all' };

/** The formats any listed experiment's plan holds, in the display order WEB · AR · VR · MR. */
export function heldFormats(experiments: readonly TaughtExperiment[]): Technology[] {
  const held = new Set<Technology>();
  for (const entry of experiments) {
    for (const format of entry.teaching.formatsInstitutionHas) held.add(format);
  }
  return FORMAT_ORDER.filter((format) => held.has(format));
}

/** Search (name, code, course; ignoring case), Format and Student activity. */
export function matches(entry: TaughtExperiment, filters: Filters): boolean {
  const wanted = filters.search.trim().toLocaleLowerCase('en');
  const text = [
    entry.option.name,
    entry.option.courseCode ?? '',
    entry.teaching.experiment.courseName,
  ]
    .join(' ')
    .toLocaleLowerCase('en');
  const active = entry.teaching.formatsUsedByStudents.length > 0;
  return (
    (wanted === '' || text.includes(wanted)) &&
    (filters.format === 'all' || entry.teaching.formatsInstitutionHas.includes(filters.format)) &&
    (filters.activity === 'all' || (filters.activity === 'some' ? active : !active))
  );
}

export interface FilterChipView {
  readonly key: keyof Filters;
  readonly label: string;
}

/** One chip per applied filter, as the export's script makes them: Search, Format, activity. */
export function filterChips(filters: Filters): FilterChipView[] {
  const chips: FilterChipView[] = [];
  const search = filters.search.trim();
  if (search) chips.push({ key: 'search', label: searchChip(search) });
  if (filters.format !== 'all') chips.push({ key: 'format', label: formatChip(filters.format) });
  if (filters.activity !== 'all') {
    chips.push({ key: 'activity', label: EXPERIMENTS_TAB.activity[filters.activity] });
  }
  return chips;
}

export interface ExperimentRowView {
  readonly experimentId: string;
  readonly name: string;
  readonly href: string;
  readonly accessibleName: string;
  readonly course: string;
  readonly formats: readonly string[];
  readonly students: number;
  readonly progress: readonly FaProgressRow[];
  readonly progressLabel: string;
  /** "5 students with access · as of 7 Nov 2026". */
  readonly reach: string;
  /** "Ready" (ok), "Draft — not ready" or "No assessment yet" (neutral). */
  readonly status: StatusView;
  readonly assessment: string | null;
  readonly detail: string;
}

/** One taught experiment as a row of the table. */
export function experimentRowView(entry: TaughtExperiment, me: string | null): ExperimentRowView {
  const { option, teaching, assessment } = entry;
  const students = studentsReached(teaching);
  const asOf = dayMonthYear(teaching.asOf);
  return {
    experimentId: option.experimentId,
    name: option.name,
    href: facultyExperimentAddress(option.experimentId),
    accessibleName: openExperimentLabel(option.name),
    course: courseLine(
      option.courseCode ?? teaching.experiment.platformCode,
      teaching.experiment.courseName,
    ),
    formats: formatCodes(teaching.formatsInstitutionHas),
    students,
    progress: students > 0 ? progressRows(teaching) : [],
    progressLabel: activityLabel(option.name, asOf),
    reach: reachAsOfWords(students, asOf),
    status: assessmentStateView(assessment?.readiness ?? null),
    assessment: assessment === null ? null : assessmentName(assessment.assessment.name),
    detail:
      assessment === null
        ? MY_COURSES_PAGE.createFromExperiment
        : assessmentDueLine(
            assessment.assessment.rules.deadline === null
              ? null
              : deadlineWords(assessment.assessment.rules.deadline),
            colleagueOf(assessment, me),
          ),
  };
}
