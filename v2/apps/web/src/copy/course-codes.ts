/**
 * The words of IA-16 Content access › Course codes (board B2-03 f6 … f10), written from the facts
 * `InstitutionCourseCodeService.list` answers (`listInstitutionCourseCodesOutput`). Every phrase
 * here is the frozen board's own, found verbatim in its markup or script (`course-codes.test.ts`);
 * what B2-03 does not word is a provisional entry of the state-copy register
 * (`state-copy-package-2b.ts`, VD-12). Courses, codes and semesters come from the records.
 */

export const COURSE_CODES_TAB = {
  /** The Content access tab strip's second tab (B2-02 / B2-03 `nav.xr-tabs`). */
  tab: 'Course codes',
  intro:
    'Add the code your institution uses for each course. It sits next to the BITS course code, which BITS maintains and you can’t change.',
  savedTitle: 'Course codes saved',
  showMissingOnly: 'Show missing codes only',
  caption: 'Course codes',
  columns: {
    course: 'Course',
    bitsCode: 'BITS course code',
    yourCode: 'Your course code',
    semester: 'Semester',
    optional: '(optional)',
    status: 'Status',
  },
  readOnlySuffix: ', set by BITS, read-only',
  codePlaceholder: 'For example MEC-523',
  codeHint: 'Your institution’s own code',
  semesterPlaceholder: 'For example Sem II',
  missing: 'Missing',
  added: 'Added',
  noneMissing: 'No course is missing a code.',
  everyCourseHasCode: 'Every course has a code from your institution',
  undo: 'Undo changes',
  save: 'Save course codes',
  pausedTitle: 'Read-only while your institution’s access is paused',
  pausedLine: 'You can change course codes again when BITS lifts the pause.',
  /** The paused table's empty semester (B2-03 f9 "—"). */
  none: '—',
} as const;

/** B2-03 `countText`: "1 of 1 course has no code from your institution" (plural undrawn). */
export function missingCountWords(missing: number, total: number): string {
  if (missing === 0) return COURSE_CODES_TAB.everyCourseHasCode;
  return total === 1
    ? `${missing} of ${total} course has no code from your institution`
    : `${missing} of ${total} courses ${missing === 1 ? 'has' : 'have'} no code from your institution`;
}

/** B2-03 f7: "Students and faculty at your institution see MEC-523 with Thermodynamics & Heat Transfer." */
export function savedLine(
  saved: readonly { readonly code: string; readonly course: string }[],
): string {
  return `Students and faculty at your institution see ${saved
    .map((entry) => `${entry.code} with ${entry.course}`)
    .join(', ')}.`;
}

/** The inputs' labels (B2-03 `label.xr-sr`). */
export function yourCodeLabel(course: string): string {
  return `Your course code for ${course}`;
}

export function semesterLabel(course: string): string {
  return `Semester for ${course} (optional)`;
}
