/**
 * IA-15 People › Faculty courses (B2-09) as pure view helpers over three reads: the faculty
 * (`PeopleService.listFaculty`), the Faculty course mappings (`FacultyCourseService.list`) and the
 * courses in the institution's content access (`InstitutionCourseCodeService.list`). Words come from
 * the copy modules, facts from the reads; nothing here decides who may teach what — the service
 * refuses an inactive faculty member, a course outside content access and a course already taught.
 * A mapping sets what the faculty member sees in their Faculty workspace only; it gives students
 * nothing.
 */
import type {
  FacultyCourseMapping,
  FacultyDirectoryRow,
  FieldError,
  ProductPorts,
} from '@xr/contracts/draft';
import type { CourseId, PersonId } from '@xr/domain';
import type { SelectOption } from '@xr/ui/v3';

import { courseCode, courseOptionWords, FACULTY_COURSES } from '@/copy/faculty';

/** A row of `InstitutionCourseCodeService.list`: a course in the institution's content access. */
export type ContentAccessCourse = Extract<
  Awaited<ReturnType<ProductPorts['institutionCourseCodes']['list']>>,
  { readonly ok: true }
>['value'][number];

/** One course a faculty member teaches now, with the current mapping "Remove…" removes. */
export interface TaughtCourse {
  readonly courseId: CourseId;
  /** "ME ZG523" (the course's name without a code). */
  readonly code: string;
  /** The course's name: the code chip's hover title ("Thermodynamics & Heat Transfer"). */
  readonly name: string;
  /** The current mapping, as `FacultyCourseService.list` answers it (`null` until it does). */
  readonly mapping: { readonly id: FacultyCourseMapping['id']; readonly rev: number } | null;
}

/** One table row (B2-09 f0): the faculty member, their courses and their status. */
export interface FacultyCoursesRow {
  readonly id: PersonId;
  readonly fullName: string;
  readonly email: string;
  readonly active: boolean;
  readonly courses: readonly TaughtCourse[];
}

/**
 * The rows, in the order `listFaculty` answers them; each course the current mappings name, with
 * the current mapping of `FacultyCourseService.list` for that person and course (state-copy
 * `IA-15.reads`).
 */
export function facultyCourseRows(
  directory: readonly FacultyDirectoryRow[],
  mappings: readonly FacultyCourseMapping[],
): FacultyCoursesRow[] {
  return directory.map((row) => ({
    id: row.faculty.id,
    fullName: row.faculty.fullName,
    email: row.faculty.institutionEmail,
    active: row.faculty.accountStatus === 'active',
    courses: row.coursesTaught.map((courseId) => {
      const course = row.courses.find((candidate) => candidate.id === courseId);
      const mapping = mappings.find(
        (candidate) =>
          candidate.facultyId === row.faculty.id &&
          candidate.courseId === courseId &&
          candidate.removedAt === null,
      );
      return {
        courseId,
        code: course ? courseCode(course) : courseId,
        name: course?.name ?? '',
        mapping: mapping ? { id: mapping.id, rev: mapping.rev } : null,
      };
    }),
  }));
}

/** B2-09 `faView`: the rows whose name or e-mail contains the search, ignoring case. */
export function searchRows(
  rows: readonly FacultyCoursesRow[],
  search: string,
): readonly FacultyCoursesRow[] {
  const wanted = search.trim().toLocaleLowerCase('en');
  if (wanted === '') return rows;
  return rows.filter((row) =>
    `${row.fullName} ${row.email}`.toLocaleLowerCase('en').includes(wanted),
  );
}

/** B2-09 "Faculty member": "Choose a faculty member", then the active members only, in list order. */
export function facultyChoices(rows: readonly FacultyCoursesRow[]): SelectOption[] {
  return [
    { value: '', label: FACULTY_COURSES.panel.chooseFaculty },
    ...rows.filter((row) => row.active).map((row) => ({ value: row.id, label: row.fullName })),
  ];
}

/** B2-09 "Course": "Choose a course", then each course in content access, "<code> — <name>". */
export function courseChoices(courses: readonly ContentAccessCourse[]): SelectOption[] {
  return [
    { value: '', label: FACULTY_COURSES.panel.chooseCourse },
    ...courses.map(({ course }) => ({
      value: course.id,
      label: courseOptionWords(course.platformCode, course.name),
    })),
  ];
}

/**
 * `&faculty=<id>` (from IA-09): an active faculty member of the list is chosen; an unknown or
 * inactive ID chooses no one (state-copy `IA-15.preselect`).
 */
export function preselectedFaculty(
  search: string,
  rows: readonly FacultyCoursesRow[],
): PersonId | '' {
  const wanted = new URLSearchParams(search).get('faculty');
  if (!wanted) return '';
  return rows.find((row) => row.id === wanted && row.active)?.id ?? '';
}

/** The panel's two fields, as the contract names them. */
export type AssignField = 'facultyId' | 'courseId';

/**
 * The one field error the panel shows (B2-09: one message at a time, the faculty member first):
 * the field, and the drawn words — `null` for a rule B2-09 draws no words for (state-copy
 * `IA-15.field-error`).
 */
export function firstAssignError(
  fieldErrors: readonly FieldError[],
): { readonly field: AssignField; readonly message: string | null } | null {
  for (const field of ['facultyId', 'courseId'] as const) {
    const error = fieldErrors.find((candidate) => candidate.field === field);
    if (error) return { field, message: error.message };
  }
  return null;
}
