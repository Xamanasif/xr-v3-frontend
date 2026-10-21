/**
 * IA-09 Faculty record (V3 export IA-v1 IA-09; B2-06 f15, f16) as pure view helpers over
 * `getFaculty`'s answer: the "Courses taught" lines and the head's "Added" — words from the copy
 * modules, facts from the record. A mapping is named by its course and when it was assigned, never
 * by its internal reference (the identifier rule). A mapping only sets what the faculty member sees
 * in their own workspace; nothing here gives or describes student access.
 */
import type { FacultyRecordView } from '@xr/contracts/draft';

import { dayMonthYear } from '@/copy/dates';
import { facultyAddedWords } from '@/copy/faculty';

import { actorName } from '../shared/actor-name';

/** One "Courses taught" row. */
export interface CourseTaughtLine {
  /** The mapping's id: the row's key only, never shown. */
  readonly mappingId: string;
  readonly courseId: string;
  /** "ME ZG523" (`span.rk-code`); none for a course without a code. */
  readonly code: string | null;
  /** "Thermodynamics & Heat Transfer"; the course's id when the record no longer names it. */
  readonly name: string;
  /** "9 Oct 2026 · Meera Iyer" — when it was assigned and by whom (the date alone without a person). */
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
        courseId: mapping.courseId,
        code: course?.platformCode ?? null,
        name: course ? course.name : mapping.courseId,
        assigned: facultyAddedWords(
          dayMonthYear(mapping.assignedAt),
          actorName(mapping.assignedBy),
        ),
      };
    });
}

/** "Added": "8 Oct 2026 · Meera Iyer" (the head's meta: "Added 8 Oct 2026 · Meera Iyer"). */
export function facultyAddedLine(record: FacultyRecordView): string {
  const { added } = record.faculty;
  return facultyAddedWords(dayMonthYear(added.at), actorName(added.by));
}
