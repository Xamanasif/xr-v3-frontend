import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-11 Import students (B2-07 f5 … f10) — Phase-2 Package 2B, part of
 * the one register (`state-copy.ts`, VD-12): every state string or rule the screen shows that its
 * board does not draw word for word.
 */
export const STATE_COPY_IMPORT = {
  // ---- What B2-07 decides only for now ----
  'IA-11.commit-mode': {
    screen: 'IA-11',
    state: 'A checked file with one or more rows in error (step 2)',
    words: null,
    rule: 'All or nothing, as B2-07 f6 draws it: “Nothing is imported while the file has errors”, “Choose the corrected file” instead of “Continue”, and the service imports every row or none. This is the interim T-24 assumption, not a final policy: importing only the valid rows stays open. If it changes, only the step 2 notice and its button change.',
    basis:
      'B2-07 f6 caption and “Commit mode — interim, not final” (T-24 “errors block”, build choice, not confirmed); PeopleService.commitStudentImport “Every row or none (T-24 interim)”',
    status: 'provisional',
    decisions: ['T-24'],
  },
  'IA-11.no-warnings': {
    screen: 'IA-11',
    state: 'A row problem that would only warn',
    words: null,
    rule: 'None is shown: every problem the service reports is “Error — blocks import”. B2-07 defines no warning condition, so no warning tag, count or row is rendered.',
    basis:
      'B2-07 “Warnings”: “no warning condition is defined. None is drawn … Which conditions, if any, should only warn is part of T-24.”',
    status: 'provisional',
    decisions: ['T-24'],
  },

  // ---- Step 1 · Choose a file ----
  'IA-11.chooser': {
    screen: 'IA-11',
    state: 'Choosing the file',
    words: null,
    rule: '“Choose a CSV file” opens the browser’s own file chooser (one file, `.csv` / `text/csv`); the chosen file’s name replaces “No file chosen”. Choosing again replaces it. The file is read as text in the browser when chosen — nothing is uploaded or stored — and “Check file” sends its name and text to the service, which reads the rows. “Choose the corrected file” (step 2) goes back to step 1 with no file chosen and focus on “Choose a CSV file” — the board picks its corrected sample file itself. The report is kept on the page only: leaving or reloading the page forgets the file and its check. The steps are in the page, not in the address (Appendix A rule S3).',
    basis:
      'B2-07 f5 (its chooser cycles two sample file names — a canvas stand-in); Appendix A IA-11 “product needs a real CSV file input”; PeopleService.previewStudentImport “a check that writes nothing”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.template.example': {
    screen: 'IA-11',
    state: 'Step 1’s line: the course-code example',
    words: null,
    rule: 'The example is the institution’s first course in content access (its BITS code, else its name) with the institution’s own code for it — “… the BITS code (for example ME ZG523) or your institution’s code (MEC-523).” — or, without an own code, “… or your institution’s own code for the course.” (`InstitutionCourseCodeService.list`, read once for the page). Never a fixed sample code.',
    basis:
      'IA-v1 Main.dc.html IA-11 template line and `vm11` (`exCode`, `exOwn`); the export’s fallback to its sample course when none is held is a preview stand-in',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.template.no-course': {
    screen: 'IA-11',
    state: 'Step 1’s line before any course is in content access (or before the list has answered)',
    words: 'the BITS code or your institution’s own code for the course.',
    basis:
      'IA-v1 Main.dc.html `vm11` `exOwn` (“ or your institution’s own code for the course”) without a course to name; the export never draws an institution with no course here',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.file.columns': {
    screen: 'IA-11',
    state: 'A file whose first line is not the template’s six columns',
    words:
      'This file doesn’t use the template’s columns. Download the template and put one student on each row under its six columns.',
    rule: 'Shown under the chooser (`xw-ferr`); focus moves to “Choose a CSV file”. Nothing is checked.',
    basis:
      'B2-07 draws the template and its columns only (“The template download has exactly these columns.”); catalogue `IA-11.file.columns` is undrawn; the “Choose a CSV file first” formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.file.no-rows': {
    screen: 'IA-11',
    state: 'A file with the template’s columns and no student rows',
    words: 'This file has no students in it. Add one row per student under the template’s columns.',
    rule: 'Shown under the chooser; focus moves to “Choose a CSV file”.',
    basis:
      'B2-07 “One row per student.”; catalogue `IA-11.file.no-rows` is undrawn; the “Choose a CSV file first” formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.file.too-large': {
    screen: 'IA-11',
    state: 'A chosen file larger than 1 MB',
    words:
      'This file is larger than 1 MB. Split the students into smaller files and import them one at a time.',
    rule: 'The page reads files up to 1 MB (1,048,576 bytes; several thousand student rows). A larger file is not read: no file is chosen and the words show under the chooser.',
    basis:
      'B2-07 draws no size limit; the cap is a product safeguard for reading the file in the browser, chosen as an interim',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.file.unreadable': {
    screen: 'IA-11',
    state: 'A chosen file the browser cannot read as text',
    words: 'We couldn’t read this file. Choose it again, or save it as CSV and choose it again.',
    rule: 'No file is chosen and the words show under the chooser.',
    basis: 'B2-07 draws no unreadable file; board 04 Failed formula (what happened, what to do)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Step 2 · Check rows: the row words B2-07 states as rules but does not draw ----
  'IA-11.row.student-id.required': {
    screen: 'IA-11',
    state: 'A row with an empty student_id',
    words: 'Student ID is empty. Every row needs the student’s ID.',
    basis:
      'B2-07 “Every column is required”; the drawn row formula (“Programme is empty. Every row needs the student’s programme.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.full-name.required': {
    screen: 'IA-11',
    state: 'A row with an empty full_name',
    words: 'Full name is empty. Every row needs the student’s full name.',
    basis: 'B2-07 “Every column is required”; the drawn row formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.e-mail.required': {
    screen: 'IA-11',
    state: 'A row with nothing in the e-mail column',
    words: 'E-mail is empty. Every row needs the student’s institution e-mail.',
    basis: 'B2-07 “Every column is required”; the drawn row formula; B2-07 f0 “Institution e-mail”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.course.required': {
    screen: 'IA-11',
    state: 'A row with an empty course',
    words: 'Course is empty. Every row needs the course.',
    basis: 'B2-07 “Every column is required”; the drawn row formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.e-mail.in-people': {
    screen: 'IA-11',
    state: 'A row whose e-mail is already in People',
    words: 'E-mail “{value}” already belongs to someone in People.',
    basis:
      'B2-07 “Duplicates”: “IDs / e-mails already in People, are errors with the row number”; IA-10’s drawn “This e-mail already belongs to someone in People” and the drawn row formula (“E-mail “fatima.begum@godavari” isn’t a full address.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.student-id.in-people': {
    screen: 'IA-11',
    state: 'A row whose student ID is already in People',
    words: 'Student ID {id} is already used by {name}. Each student needs a different ID.',
    basis:
      'B2-07 “Duplicates”; IA-10’s drawn “GIT-2026-0418 is already used by Rahul Verma” and the drawn row formula (“Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.student-id.in-people.unnamed': {
    screen: 'IA-11',
    state: 'A row whose student ID is in People when the service names no holder',
    words: 'Student ID {id} is already in People. Each student needs a different ID.',
    basis: 'As `IA-11.row.student-id.in-people`, without the name',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.course-code.unknown-course': {
    screen: 'IA-11',
    state: 'A row whose course code names no course of the institution’s content access',
    words:
      'Course code “{value}” doesn’t match a course in your content access. Use the BITS code or your institution’s own code.',
    basis:
      'B2-07 step 1 (“the BITS code … or your institution’s code”); a course code naming no course is an error only in a PROVISIONAL WP-0.9 reading (catalogue `IA-11.row.courseCode.unknown-course`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.e-mail.identity-taken': {
    screen: 'IA-11',
    state:
      'A row whose e-mail already signs someone else in to the sample platform — another institution’s person, an Institute Admin, a platform role, a Super Admin (sample-mode identity safeguard)',
    words: 'E-mail “{value}” is already used to sign in to the platform. Use a different e-mail.',
    rule: 'An error like any other: the row is refused rather than merged with, or hiding, that sign-in. A protective sample-mode safeguard, not the T-11 invitation or identity policy.',
    basis:
      'Owner authorisation of Phase 2B §5 (PC-49); the catalogue’s identity-taken row key is undrawn; the IA-10 safeguard words (`IA-10.identity-taken`)',
    status: 'provisional',
    decisions: ['T-11', 'P1-01'],
  },
  'IA-11.row.e-mail.duplicate-in-file': {
    screen: 'IA-11',
    state: 'Two rows of the file with one e-mail (sample-mode identity safeguard)',
    words: 'E-mail “{value}” is also in row {row}. Each student needs a different e-mail.',
    rule: 'The later row is the error; two people would otherwise share one sign-in. A sample-mode safeguard, not the T-11 policy.',
    basis:
      'Owner authorisation of Phase 2B §5 (PC-49); the drawn duplicate-ID words (“Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID.”)',
    status: 'provisional',
    decisions: ['T-11', 'P1-01'],
  },
  'IA-11.row.several': {
    screen: 'IA-11',
    state: 'A row with more than one problem',
    words: null,
    rule: 'One table line per problem, in the file’s row order and the template’s column order, each with the row number. The counts count rows: “4 rows with errors” however many problems they have.',
    basis:
      'B2-07 f6 draws one problem per row (the script’s `errors` count rows: 13 checked, 9 ready, 4 with errors)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.row.who': {
    screen: 'IA-11',
    state: 'A row with an empty name or student ID',
    words: null,
    rule: '“Student” shows what the row gives — the name, then the student ID under it (`ia-cell-sub ia-nowrap`); an empty one is left out. “What to fix” says which is missing.',
    basis: 'B2-07 f6 (“Imran S.” · GIT-2026-0409, as the file gives them)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Counts and results with one student ----
  'IA-11.count-one': {
    screen: 'IA-11',
    state: 'A file with one row, or one student to import',
    words: null,
    rule: '“1 row checked”; “1 student will be added to People from <file>.”; “Import 1 student”; “1 student imported”; “1 student was added to People from <file>. They don’t have any experiments yet.”; with no problem in a one-row file, “The 1 row has every required column, and nobody in the file is already in People.” The noun follows the number. “1 row with an error” is drawn.',
    basis:
      "B2-07 `imView` (“13 rows checked”, “Import 12 students”, “12 students imported”; `rep.errors === 1 ? ' row with an error' : ' rows with errors'`)",
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.added-names': {
    screen: 'IA-11',
    state: 'The “Added” list with one or two students',
    words: null,
    rule: 'Every added student, in file order, as the commit names them: “Rahul Verma.”; “Rahul Verma and Priya Natarajan.”; from three on “A, B and C.” as drawn.',
    basis: 'B2-07 f9 (“Rahul Verma, Priya Natarajan, … Nikhil Bose and Ananya Das.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  // ---- Step 3 · Import: what the service may answer ----
  'IA-11.commit.changed': {
    screen: 'IA-11',
    state: 'Import refused because People changed since the check (a row now duplicates someone)',
    words: null,
    rule: 'Nothing is imported. The same file is checked again and step 2 shows with the problems found now (all or nothing, T-24).',
    basis:
      'PeopleService.commitStudentImport checks the rows again against the records as they are then (`validation-failed`); B2-07 draws no such frame',
    status: 'provisional',
    decisions: ['VD-12', 'T-24'],
  },
  'IA-11.commit.stale': {
    screen: 'IA-11',
    state: 'Import refused because the check is no longer current (already imported, or not found)',
    words: 'This check is no longer current. Check the file again.',
    rule: 'Nothing is imported. Step 1 shows with the same file chosen and these words under the chooser.',
    basis:
      'PeopleService.commitStudentImport `not-found` (a batch is committed once) / `invalid-state`; B2-07 draws no such frame; board 04 refused formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.unavailable': {
    screen: 'IA-11',
    state: 'Checking or importing failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the step, the chosen file and the report stay, and the action can be sent again. A check failed for now shows no message; an import failed for now shows the V3 export’s “The import didn’t finish — Nothing was added. Try again.” on step 3, which takes focus (it goes on Back or a new try).',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; IA-v1 Main.dc.html IA-11 step 3 `hasFail` (`im-fail`); the export draws no check failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-11.paused': {
    screen: 'IA-11',
    state: 'Import students while the institution’s access is paused',
    words: null,
    rule: 'The V3 refusal replaces the flow (no steps): “You can’t import students while your institution’s access is paused”, “People and their work are kept. You can import again when BITS lifts the pause.”, “Back to Students” and Help. A check or an import refused `institution-paused` meanwhile shows the same, its heading focused.',
    basis:
      'IA-v1 Main.dc.html IA-11 `V.refuse`; B2-01 f5 “no actions while paused”; PeopleService refuses every write `institution-paused`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
