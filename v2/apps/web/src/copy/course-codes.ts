/**
 * The words of IA-16 Content access › Course codes in the owner-approved V3 design
 * (design/v3-refined-b/roles/IA-v1, `project/Main.dc.html` IA-16 and its script's `vm16core` /
 * `vm16`), written from the facts `InstitutionCourseCodeService.list` answers
 * (`listInstitutionCourseCodesOutput`). Every phrase is the export's own (`package-2b.test.ts`
 * finds it); what the export does not word is a provisional entry of the state-copy register
 * (`state-copy-package-2b.ts`, VD-12). Courses, codes and semesters come from the records.
 */

import { iaListText } from './ia-shared';

export const COURSE_CODES_TAB = {
  /** The Content access tab strip's second tab (`nav.rk-tabs`). */
  tab: 'Course codes',
  title: 'Course codes',
  showMissingOnly: 'Show missing codes only',
  missing: 'Missing',
  added: 'Added',
  bitsCode: 'BITS course code',
  bitsNote: 'Set by BITS · read-only',
  yourCode: 'Your course code',
  codePlaceholder: 'Your code for this course',
  semester: 'Semester',
  optional: '(optional)',
  semesterPlaceholder: 'For example Sem II',
  notAdded: 'Not added',
  /** The read-only semester when none is set (`vm16core` "—"). */
  none: '—',
  previewLead: 'Students and faculty see',
  previewEmpty: 'Add your code to show it to students and faculty with the course name.',
  unsaved: 'You have unsaved changes',
  noUnsaved: 'No unsaved changes',
  undo: 'Undo changes',
  saveOne: 'Save course code',
  save: 'Save course codes',
  savedTitle: 'Saved',
  noneMissingTitle: 'No course is missing a code',
  noneMissingLine: 'Every course in your content access has a code from your institution.',
  showAllCourses: 'Show all courses',
  noCoursesTitle: 'No courses yet',
  noCoursesLine:
    'Courses appear here when BITS activates your institution’s access. Then you can add your own code next to each BITS course code.',
  contentAccess: 'Content access',
  pausedTitle: 'Read-only while your institution’s access is paused',
  pausedLine: 'You can change course codes again when BITS lifts the pause.',
  helpTitle: 'How course codes work',
  help: [
    'The BITS course code is set by BITS. You can’t change it here.',
    'Students and faculty at your institution see your code with the course name.',
    'A CSV file for Import students can use either code in its course_code column.',
  ],
  everyCourseHasCode: 'Every course has a code from your institution',
  oneAdded: 'Your institution’s code is added',
  oneMissing: 'Your institution’s code isn’t added yet',
} as const;

/**
 * The head's count (`vm16`): one course "Your institution’s code is added / isn’t added yet";
 * several "1 of 3 courses has no code from your institution" / "Every course has a code from your
 * institution" (`vm16core` `countText`).
 */
export function missingCountWords(missing: number, total: number): string {
  if (total === 1) return missing === 0 ? COURSE_CODES_TAB.oneAdded : COURSE_CODES_TAB.oneMissing;
  if (missing === 0) return COURSE_CODES_TAB.everyCourseHasCode;
  return `${missing} of ${total} courses ${missing === 1 ? 'has' : 'have'} no code from your institution`;
}

/** "Save course code" with one course, "Save course codes" with several (`vm16` `saveText`). */
export function saveWords(courses: number): string {
  return courses === 1 ? COURSE_CODES_TAB.saveOne : COURSE_CODES_TAB.save;
}

/**
 * The flash after a save (`vm16core` `save`): "Course codes saved. Students and faculty at your
 * institution see MEC-523 with Thermodynamics & Heat Transfer." — or, when no course has a code
 * now, "Course codes saved. No course has a code from your institution now."
 */
export function savedLine(
  saved: readonly { readonly code: string; readonly course: string }[],
): string {
  return saved.length > 0
    ? `Course codes saved. Students and faculty at your institution see ${iaListText(
        saved.map((entry) => `${entry.code} with ${entry.course}`),
      )}.`
    : 'Course codes saved. No course has a code from your institution now.';
}

/**
 * The end of a field's accessible name: the drawn label ("Your course code", "Semester"), then
 * the course, read by screen readers only so that each course's fields have their own names —
 * "Your course code for Thermodynamics & Heat Transfer", "Semester for Thermodynamics & Heat
 * Transfer (optional)" (state-copy `IA-16.field-names`).
 */
export function fieldNameEnd(course: string): string {
  return `for ${course}`;
}
