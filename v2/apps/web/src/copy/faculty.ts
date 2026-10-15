/**
 * The words of the Institute Admin's Faculty screens — IA-09 Faculty record (board B2-06 f15, f16)
 * and IA-15 People › Faculty courses (board B2-09) — written from the canonical facts the ports
 * answer (`getFacultyOutput`, `listFacultyOutput`, `FacultyCourseService`,
 * `InstitutionCourseCodeService.list`): read models carry no words. Every phrase here is the
 * frozen boards' own, found verbatim in their markup or script (`faculty.test.ts`); what no board
 * words is a provisional entry of the state-copy register (`state-copy-faculty.ts`, VD-12), never an
 * invented rule. The boards' sample people, courses, dates and IDs are never copied: they come from
 * the records.
 *
 * A Faculty course mapping sets what the faculty member sees in their own workspace; it gives
 * students nothing (B2-09).
 */

// ---- IA-09 Faculty record (B2-06 f15, f16) ----

export const FACULTY_RECORD = {
  back: 'Faculty',
  overline: 'Faculty',
  assignCourse: 'Assign a course',
  sections: { coursesTaught: 'Courses taught', details: 'Details' },
  openFacultyCourses: 'Open Faculty courses',
  caption: 'Courses taught',
  columns: { course: 'Course', assigned: 'Assigned', action: 'Action' },
  remove: 'Remove…',
  noCoursesTitle: 'No courses yet',
  keys: { email: 'Institution e-mail', added: 'Added' },
} as const;

/** "Desai" from "Dr Anita Desai" — B2-06 f16 names the faculty member by the last word. */
export function lastName(fullName: string): string {
  return fullName.trim().split(/\s+/).at(-1) ?? fullName;
}

/** B2-06 f15: "These courses set what Dr S. Ranganathan sees in the Faculty workspace." */
export function coursesSetLine(fullName: string): string {
  return `These courses set what ${fullName} sees in the Faculty workspace.`;
}

/** B2-06 f16: "Assign a course so it appears in Desai’s Faculty workspace." */
export function noCoursesLine(fullName: string): string {
  return `Assign a course so it appears in ${lastName(fullName)}’s Faculty workspace.`;
}

/** B2-06 f15 "Assigned": "9 Oct 2026 · Meera Iyer · " — then the mapping's ID (`span.xr-id`). */
export function assignedWords(date: string, who: string | null): string {
  return who ? `${date} · ${who} · ` : `${date} · `;
}

/** B2-06 f15, f16 "Added": "8 Oct 2026 · Meera Iyer". */
export function facultyAddedWords(date: string, who: string | null): string {
  return who ? `${date} · ${who}` : date;
}

// ---- IA-15 People › Faculty courses (B2-09 f0 … f5) ----

export const FACULTY_COURSES = {
  intro: 'Who teaches which course. This sets what each faculty member sees in their workspace.',
  searchPlaceholder: 'Faculty name or e-mail',
  caption: 'Faculty courses',
  columns: {
    member: 'Faculty member',
    coursesTaught: 'Courses taught',
    status: 'Status',
    action: 'Action',
  },
  remove: 'Remove…',
  assignCourse: 'Assign a course',
  panel: {
    title: 'Assign a course',
    facultyLabel: 'Faculty member',
    facultyHint: 'Active faculty members only',
    chooseFaculty: 'Choose a faculty member',
    courseLabel: 'Course',
    courseHint: 'Courses in your content access',
    chooseCourse: 'Choose a course',
    submit: 'Assign course',
    note: 'The course appears in that person’s Faculty workspace. It doesn’t give students anything.',
  },
  removeConfirm: 'Remove course',
  noMarkerTitle: 'Written answers would have no marker',
} as const;

/** The course as B2-09 names it everywhere: its code ("ME ZG523"), or its name without one. */
export function courseCode(course: {
  readonly name: string;
  readonly platformCode: string | null;
}): string {
  return course.platformCode ?? course.name;
}

/** B2-09 Course option: "ME ZG523 — Thermodynamics & Heat Transfer" (the name alone without a code). */
export function courseOptionWords(platformCode: string | null, name: string): string {
  return platformCode ? `${platformCode} — ${name}` : name;
}

/** B2-09 `pickAria`: "Assign a course to Dr S. Ranganathan". */
export function assignToLabel(fullName: string): string {
  return `Assign a course to ${fullName}`;
}

/** B2-09 course `aria`: "Remove ME ZG523 from Dr S. Ranganathan". */
export function removeCourseLabel(code: string, fullName: string): string {
  return `Remove ${code} from ${fullName}`;
}

/** B2-09 f1 flash: "Dr S. Ranganathan now teaches ME ZG523. It appears in their Faculty workspace." */
export function assignedFlash(fullName: string, code: string): string {
  return `${fullName} now teaches ${code}. It appears in their Faculty workspace.`;
}

/** B2-09 DL-1 title: "Remove ME ZG523 from Dr S. Ranganathan?". */
export function removeTitle(code: string, fullName: string): string {
  return `Remove ${code} from ${fullName}?`;
}

/** B2-09 DL-1 body: "ME ZG523 will no longer appear in their Faculty workspace." */
export function removeBody(code: string): string {
  return `${code} will no longer appear in their Faculty workspace.`;
}

/** B2-09 `doRm` flash: "ME ZG523 was removed from Dr S. Ranganathan." */
export function removedFlash(code: string, fullName: string): string {
  return `${code} was removed from ${fullName}.`;
}

/**
 * B2-09 f2 warning line: "1 written answer in ME ZG523 is waiting for marking, and no other faculty
 * member teaches the course. It will wait without a marker until you assign one." The plural is
 * PROVISIONAL (state-copy `IA-15.no-marker.plural`): B2-09 draws one answer.
 */
export function noMarkerLine(waiting: number, code: string): string {
  return waiting === 1
    ? `1 written answer in ${code} is waiting for marking, and no other faculty member teaches the course. It will wait without a marker until you assign one.`
    : `${waiting} written answers in ${code} are waiting for marking, and no other faculty member teaches the course. They will wait without a marker until you assign one.`;
}
