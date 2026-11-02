/**
 * The V3 words of the Institute Admin's People screens — IA-06 Students, IA-08 Faculty, IA-09
 * Faculty record, IA-10 Add student / faculty member, IA-11 Import students, IA-13 Groups and IA-15
 * Faculty courses — as the owner-approved export draws them (V3 Refined B,
 * design/v3-refined-b/roles/IA-v1 `project/Main.dc.html`, template and script): each phrase is in
 * its markup or script verbatim, and each composed line takes the script's form with the records'
 * values (`ia-people.test.ts`). The words the earlier boards drew and the export keeps are the
 * existing modules' (`institute-people.ts`, which the Faculty pages also read, `faculty.ts`,
 * `groups.ts`, `import-students.ts`) and are not repeated here; nothing there changes. The forms
 * more than one screen group writes (the toolbar's "Showing 5 of 12", a chip's "Remove filter …")
 * are `ia-shared.ts`'s. No phrase names a record by its internal reference: people, groups and
 * courses are named by content.
 */
import { studentCountWords } from './institute-people';

// ---- The People page (tabs, paused notice, flash) ----------------------------------------------

export const PEOPLE_V3 = {
  /** `rk-notice-d` of the paused notice under the tabs, per tab (`peopleHead.pausedD`). */
  paused: {
    students: 'You can add or import students again when BITS lifts the pause.',
    faculty: 'You can add faculty members again when BITS lifts the pause.',
    groups: 'You can create and change groups again when BITS lifts the pause.',
    facultyCourses: 'You can assign or remove courses again when BITS lifts the pause.',
  },
  /** The flash's title after a change on a tab (`flashT`, default). */
  saved: 'Saved',
  /** A dialog's way out (`#ia-dlg-cancel`). */
  cancel: 'Cancel',
} as const;

/** The tab count's words for screen readers (`span.xr-sr`): ", 12 students". */
export function tabCountWords(words: string): string {
  return `, ${words}`;
}

// ---- IA-06 People › Students -------------------------------------------------------------------

export const STUDENTS_V3 = {
  sectionTitle: 'Students',
  filterLabel: 'Filter students',
  searchLabel: 'Search students',
  // UX-20: the export's "Search name, student ID or e-mail" is clipped at 375 px; the accessible
  // name stays "Search students".
  searchPlaceholder: 'Name, ID or e-mail',
  segmentsLabel: 'Show students by status',
  all: 'All',
  caption: 'Students at your institution',
  columns: { student: 'Student', group: 'Group', access: 'Access', action: 'Action' },
  /** Before the groups on phones (`grpLab`). */
  groupOne: 'Group: ',
  groupSeveral: 'Groups: ',
  noCourse: 'No course recorded',
  experimentsGiven: 'Experiments given: ',
  noCurrentExperiments: 'No current experiments',
  giveAccess: 'Give access',
  showAll: 'Show all students',
  emptyLine:
    'Add students one at a time or import a CSV file with the buttons above. Adding a student doesn’t give them any experiments yet.',
  loading: 'Loading students…',
} as const;

/** `giveAria`: "Give Ananya Das access". */
export function giveStudentAccessLabel(fullName: string): string {
  return `Give ${fullName} access`;
}

/** `liveText` (announced): "5 students shown", "1 student shown". */
export function studentsShownWords(shown: number): string {
  return `${studentCountWords(shown, shown, false)} shown`;
}

// ---- IA-08 People › Faculty --------------------------------------------------------------------

export const FACULTY_V3 = {
  sectionTitle: 'Faculty',
  filterLabel: 'Filter faculty',
  searchLabel: 'Search faculty',
  searchPlaceholder: 'Search name or e-mail',
  caption: 'Faculty at your institution and the courses they teach',
  noMatchLine: 'Check the spelling of the name or e-mail.',
  emptyTitle: 'No faculty members yet',
  emptyLine:
    'Add the people who teach your courses. You assign their courses afterwards, in Faculty courses.',
  foot: 'Courses taught set what each person sees in the Faculty workspace. They never give students access.',
} as const;

/** `r.aria`: "Open faculty record: Dr S. Ranganathan". */
export function openFacultyLabel(fullName: string): string {
  return `Open faculty record: ${fullName}`;
}

// ---- IA-13 People › Groups ---------------------------------------------------------------------

export const GROUPS_V3 = {
  sectionTitle: 'Groups',
  caption: 'Groups at your institution',
  /** The phone rows' label of the third column. */
  givenLabel: 'Experiments given',
  noMembers: 'No members yet',
  emptyLine:
    'A group is another way to choose who gets an experiment, for example a section or a lab batch.',
  foot: 'Giving a group access gives it to the group’s current members, through the same Give students access steps.',
  /** The flash's link after "Create group" (`linkT`). */
  openGroup: 'Open the group',
} as const;

/** `fmAria`: "Formats from your plan: WEB, VR". */
export function planFormatsLabel(codes: readonly string[]): string {
  return `Formats from your plan: ${codes.join(', ')}`;
}

// ---- IA-15 People › Faculty courses ------------------------------------------------------------

export const FACULTY_COURSES_V3 = {
  sectionTitle: 'Faculty courses',
  filterLabel: 'Filter faculty courses',
  searchLabel: 'Search faculty',
  searchPlaceholder: 'Search faculty name or e-mail',
  caption: 'Who teaches which course',
  emptyLine: 'Add faculty members in People first, then assign the courses they teach here.',
  /** `cantText`: why nothing can be assigned. */
  cant: {
    paused: 'Assigning is unavailable while your institution’s access is paused.',
    noCourses: 'Courses appear here when BITS activates your institution’s access.',
    noFaculty: 'Add a faculty member in People first.',
  },
} as const;

// ---- IA-09 Faculty record ----------------------------------------------------------------------

export const FACULTY_RECORD_V3 = {
  paused: 'You can change the courses they teach again when BITS lifts the pause.',
  inactiveTitle: 'This faculty account is inactive',
  inactiveLine: 'Inactive faculty members can’t be assigned courses.',
} as const;

/** The head's meta: "Added 8 Oct 2026 · Meera Iyer". */
export function addedLine(dateAndWho: string): string {
  return `Added ${dateAndWho}`;
}

/** The course's own line: "Your course code MEC-523". */
export function ownCourseCodeLine(code: string): string {
  return `Your course code ${code}`;
}

/** The table's caption: "Courses taught by Dr S. Ranganathan". */
export function coursesTaughtCaption(fullName: string): string {
  return `Courses taught by ${fullName}`;
}

/** The section's foot: "These courses set what … sees in the Faculty workspace. They never give …". */
export function coursesSetFoot(fullName: string): string {
  return `These courses set what ${fullName} sees in the Faculty workspace. They never give students access.`;
}

// ---- IA-10 Add student / Add faculty member ----------------------------------------------------

export const ADD_PERSON_V3 = {
  pausedTitle: 'You can’t add people while your institution’s access is paused',
  pausedLine: 'People and their work are kept. You can add people again when BITS lifts the pause.',
  help: 'Help',
  student: {
    leadTitle: 'Adding a student doesn’t give them any experiments',
    leadLine:
      'You give access separately, from Student access or the student’s record. No invitation or e-mail is sent.',
  },
  faculty: {
    leadTitle: 'Adding a faculty member doesn’t assign any courses',
    leadLine:
      'Assign the courses they teach after adding them, in Faculty courses. No invitation or e-mail is sent.',
  },
  /** `sidHint`: with the first student's ID as the example, or without one. */
  studentIdExample: 'Your institution’s ID, for example ',
  studentIdNoExample: 'Your institution’s ID for this student.',
  programme: 'Programme (optional)',
  programmeHint: 'Optional here. The CSV import asks for it.',
  group: 'Group (optional)',
  facts: {
    studentId: 'Student ID',
    email: 'Institution e-mail',
    group: 'Group',
    notInGroup: 'Not in a group',
    coursesTaught: 'Courses taught',
    noneYet: 'None yet',
  },
} as const;

/** "Back to Students", "Back to Faculty". */
export function backToWords(place: string): string {
  return `Back to ${place}`;
}

// ---- IA-11 Import students ---------------------------------------------------------------------

export const IMPORT_V3 = {
  pausedTitle: 'You can’t import students while your institution’s access is paused',
  pausedLine: 'People and their work are kept. You can import again when BITS lifts the pause.',
  stepsLabel: 'Steps',
  stepDone: ', done',
  stepCurrent: ', current step',
  columnsLabel: 'Required columns',
  fileLabel: 'File to import',
  chooseAnother: 'Choose another file',
  blockedLine:
    'Fix the rows marked Error in your file, then choose it again. Nobody already in People is changed.',
  cleanTitle: 'No problems found',
  attentionTitle: 'Rows that need attention',
  rowsNote: 'Row numbers count from the first student row, after the header.',
  confirmPoints: [
    'They won’t have any experiments yet — give access afterwards.',
    'No invitation or e-mail is sent.',
    'Nobody already in People is changed.',
  ],
  failedTitle: 'The import didn’t finish',
  failedLine: 'Nothing was added. Try again.',
} as const;

/**
 * Step 1's line under "Use the template", with the template's six columns by name (the file format
 * is code: `TEMPLATE_COLUMNS` in the feature) and the course-code example.
 */
export function templateLine(columns: readonly string[], example: string): string {
  const [id, name, address, programme, course, code] = columns;
  return `One row per student. Every column is required: the student’s details (${id}, ${name}, ${address}), their ${programme}, the ${course} and its ${code} — ${example}`;
}

/** The step 1 line's course-code example (`exOwn`): with the institution's own code, or without. */
export function templateCodeExample(bitsCode: string, ownCode: string | null): string {
  return ownCode
    ? `the BITS code (for example ${bitsCode}) or your institution’s code (${ownCode}).`
    : `the BITS code (for example ${bitsCode}) or your institution’s own code for the course.`;
}

/** The table's caption: the title and the note on row numbers. */
export function attentionCaption(): string {
  return `${IMPORT_V3.attentionTitle}. ${IMPORT_V3.rowsNote}`;
}

/** The first cell: "Row 4". */
export function rowNumberWords(row: number): string {
  return `Row ${row}`;
}

/** Step 2's counts on one line (`sumText`): "13 rows checked · 9 ready to import · 4 rows with errors". */
export function checkSummaryWords(parts: readonly string[]): string {
  return parts.join(' · ');
}

/**
 * Step 2 without problems (`okD`): "All 12 rows have every required column, and nobody in the file
 * is already in People." One row (the export draws twelve): "The 1 row has …" (state-copy
 * `IA-11.count-one`).
 */
export function cleanLine(rows: number): string {
  return rows === 1
    ? 'The 1 row has every required column, and nobody in the file is already in People.'
    : `All ${rows} rows have every required column, and nobody in the file is already in People.`;
}

/** Step 3's line (`willText`): "12 students will be added to People from …csv.". */
export function willAddLine(students: string, fileName: string): string {
  return `${students} will be added to People from ${fileName}.`;
}
