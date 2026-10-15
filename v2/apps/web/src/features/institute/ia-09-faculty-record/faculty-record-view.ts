/**
 * IA-09 Faculty record (B2-06 f15, f16) as pure view helpers over `getFaculty`'s answer: the
 * "Courses taught" lines and the "Details" values — words from the copy modules, facts from the
 * record. A mapping only sets what the faculty member sees in their own workspace; nothing here
 * gives or describes student access.
 */
import type { FacultyRecordView } from '@xr/contracts/draft';

import { dayMonthYear } from '@/copy/dates';
import { assignedWords, facultyAddedWords } from '@/copy/faculty';
import { courseLine } from '@/copy/institute-people';

import { actorName } from '../ia-07-student-record/record-view';

/** One "Courses taught" row (B2-06 f15). */
export interface CourseTaughtLine {
  readonly mappingId: string;
  /** "ME ZG523 · Thermodynamics & Heat Transfer". */
  readonly course: string;
  /** "9 Oct 2026 · Meera Iyer · " — the screen adds the mapping's ID. */
  readonly assigned: string;
}

/**
 * The current mappings (not removed), in the order the record answers them (state-copy
 * `IA-09.courses`): a removed mapping stays on the record but is not listed.
 */
export function coursesTaughtLines(record: FacultyRecordView): CourseTaughtLine[] {
  return record.mappings
    .filter((mapping) => mapping.removedAt === null)
    .map((mapping) => {
      const course = record.courses.find((candidate) => candidate.id === mapping.courseId);
      return {
        mappingId: mapping.id,
        course: course ? courseLine(course.platformCode, course.name) : mapping.courseId,
        assigned: assignedWords(dayMonthYear(mapping.assignedAt), actorName(mapping.assignedBy)),
      };
    });
}

/** "Added": "8 Oct 2026 · Meera Iyer" (B2-06 f15, f16). */
export function facultyAddedLine(record: FacultyRecordView): string {
  const { added } = record.faculty;
  return facultyAddedWords(dayMonthYear(added.at), actorName(added.by));
}
