/**
 * The words of IA-11 Import students (B2-07 f5 … f10), written from the canonical facts the ports
 * answer (`studentImportReport`, `commitStudentImportOutput`): the report carries rule keys and
 * values, never words. Every phrase here is the frozen board's own, found verbatim in its markup or
 * its script's formula (`imView`; `import-students.test.ts`); the row words are the catalogue's
 * where B2-07 draws them (`messageFor`), and what no board words is a provisional entry of the
 * state-copy register (`state-copy-import.ts`, VD-12). The board's sample file names and people are
 * never copied: they come from the chosen file and the service's answer.
 *
 * All or nothing ("Nothing is imported while the file has errors") is the interim T-24 assumption,
 * not a final policy (state-copy `IA-11.commit-mode`). No warning is defined, so none is worded.
 */
import {
  fillPlaceholders,
  type MessageKey,
  messageFor,
  STUDENT_IMPORT_FIELDS,
  STUDENT_IMPORT_ROW_KEYS,
  STUDENT_IMPORT_SAFEGUARD_ROW_KEYS,
  type StudentImportProblem,
  type ValidationFailed,
} from '@xr/contracts/draft';

import { stateWords } from './state-copy';

export const IMPORT_STUDENTS = {
  /** The top bar, the steps' accessible name and the result's overline (B2-07 f5, f9). */
  title: 'Import students',
  back: 'Students',
  steps: ['Choose a file', 'Check rows', 'Confirm import'],
  // Step 1 · Choose a file (f5)
  templateHeading: 'Use the template',
  columnsLabel: 'Template columns, all required',
  download: 'Download the template (CSV)',
  noFile: 'No file chosen',
  choose: 'Choose a CSV file',
  quietLine: 'Students are added to People with no experiments. No invitation or e-mail is sent.',
  cancel: 'Cancel',
  check: 'Check file',
  checking: 'Checking rows…',
  // Step 2 · Check rows (f6, f7)
  blockedTitle: 'Nothing is imported while the file has errors',
  blockedLine: 'Fix the rows marked Error in your file, then choose it again.',
  tableCaption: 'Rows that need attention',
  tableColumns: { row: 'Row', student: 'Student', fix: 'What to fix', type: 'Type' },
  errorType: 'Error — blocks import',
  backStep: 'Back',
  chooseFixed: 'Choose the corrected file',
  continue: 'Continue',
  // Step 3 · Confirm import (f8)
  confirmPoints: [
    'They won’t have any experiments yet — give access afterwards.',
    'No invitation or e-mail is sent.',
  ],
  importing: 'Importing…',
  // Result (f9)
  finished: 'Import finished',
  added: 'Added',
  giveAccess: 'Give students access',
  viewStudents: 'View students',
  again: 'Import another file',
} as const;

/**
 * B2-07 "Download the template (CSV)": the header line only. The handoff marks its `data:` links as
 * intentional; the product serves the same file the same way.
 */
export const TEMPLATE_DOWNLOAD = {
  href: 'data:text/csv;charset=utf-8,student_id%2Cfull_name%2Cemail%2Cprogramme%2Ccourse%2Ccourse_code%0A',
  fileName: 'students-template.csv',
} as const;

/**
 * A run of the template line: plain words, words in `<strong>`, or a template column's name in
 * `<strong>` — by its place among the file's columns (`TEMPLATE_COLUMNS` in the feature: the file
 * format is code, and B8-03 counts "email" in copy outside the CSV column name).
 */
export type TemplateRun = string | { readonly strong: string } | { readonly column: number };

/**
 * B2-07 f5 "Use the template" line, with its seven `<strong>` runs: "Every column is required" and
 * the six column names.
 */
export const TEMPLATE_LINE: readonly TemplateRun[] = [
  'One row per student. ',
  { strong: 'Every column is required' },
  ': the student’s details (',
  { column: 0 },
  ', ',
  { column: 1 },
  ', ',
  { column: 2 },
  '), their ',
  { column: 3 },
  ', the ',
  { column: 4 },
  ' and its ',
  { column: 5 },
  ' — the BITS code (for example ME ZG523) or your institution’s code (MEC-523).',
];

/** B2-07 `imView` overline: "Step 2 of 3". */
export function importStepCount(step: number): string {
  return `Step ${step} of 3`;
}

/** B2-07 `totalText`: "13 rows checked" (one: state-copy `IA-11.count-one`). */
export function rowsCheckedWords(count: number): string {
  return count === 1 ? '1 row checked' : `${count} rows checked`;
}

/** B2-07 `okText`: "9 ready to import". */
export function readyWords(count: number): string {
  return `${count} ready to import`;
}

/** B2-07 `errText`: "4 rows with errors", "1 row with an error". */
export function rowsWithErrorsWords(count: number): string {
  return count === 1 ? '1 row with an error' : `${count} rows with errors`;
}

/** "12 students" / "1 student" (state-copy `IA-11.count-one`): B2-07 f8's first `<strong>`. */
export function studentsWords(count: number): string {
  return count === 1 ? '1 student' : `${count} students`;
}

/** B2-07 f8 lead: "<strong>12 students</strong> will be added to People from <strong>…</strong>." */
export const CONFIRM_LINE = { middle: ' will be added to People from ', end: '.' } as const;

/** B2-07 `importBtn`: "Import 12 students" (one: "Import 1 student"). */
export function importButtonWords(count: number): string {
  return `Import ${studentsWords(count)}`;
}

/** B2-07 result title: "12 students imported" (one: "1 student imported"). */
export function importedTitle(count: number): string {
  return `${studentsWords(count)} imported`;
}

/**
 * B2-07 f9 notice: "12 students were added to People from godavari-me-zg523-corrected.csv. None of
 * them has any experiments yet." (one: state-copy `IA-11.count-one`).
 */
export function importedLine(count: number, fileName: string): string {
  return count === 1
    ? `1 student was added to People from ${fileName}. They don’t have any experiments yet.`
    : `${count} students were added to People from ${fileName}. None of them has any experiments yet.`;
}

/** B2-07 f9 "Added": "Rahul Verma, Priya Natarajan, … and Ananya Das." in file order. */
export function addedNamesWords(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]!}.`;
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)!}.`;
}

// ---- What to fix: the catalogue's drawn words, else the register's ----

/** The contract's row fields (`STUDENT_IMPORT_FIELDS`), by name. */
const [STUDENT_ID, FULL_NAME, E_MAIL, , COURSE, COURSE_CODE] = STUDENT_IMPORT_FIELDS;

/**
 * The register's words for each row rule B2-07 does not word (state-copy `IA-11.row.*`), by the
 * contract's `field:rule` — the same pairs the catalogue's undrawn row keys name.
 */
const UNDRAWN_ROW_WORDS: Readonly<Record<string, string>> = {
  [`${STUDENT_ID}:required`]: stateWords('IA-11.row.student-id.required'),
  [`${FULL_NAME}:required`]: stateWords('IA-11.row.full-name.required'),
  [`${E_MAIL}:required`]: stateWords('IA-11.row.e-mail.required'),
  [`${COURSE}:required`]: stateWords('IA-11.row.course.required'),
  [`${E_MAIL}:in-people`]: stateWords('IA-11.row.e-mail.in-people'),
  [`${STUDENT_ID}:in-people`]: stateWords('IA-11.row.student-id.in-people'),
  [`${COURSE_CODE}:unknown-course`]: stateWords('IA-11.row.course-code.unknown-course'),
  [`${E_MAIL}:identity-taken`]: stateWords('IA-11.row.e-mail.identity-taken'),
  [`${E_MAIL}:duplicate-in-file`]: stateWords('IA-11.row.e-mail.duplicate-in-file'),
};

const ROW_KEYS: Readonly<Record<string, MessageKey>> = {
  ...STUDENT_IMPORT_ROW_KEYS,
  ...STUDENT_IMPORT_SAFEGUARD_ROW_KEYS,
};

/** The catalogue key of a reported problem (`field:rule`), or `null` for one no map names. */
export function problemKey(
  problem: Pick<StudentImportProblem, 'field' | 'rule'>,
): MessageKey | null {
  return ROW_KEYS[`${problem.field}:${problem.rule}`] ?? null;
}

/**
 * "What to fix" for one problem: B2-07's words where it draws them ("Programme is empty. Every row
 * needs the student’s programme."), else the register's provisional words, with the problem's own
 * values (the e-mail or code as the file gives it, the first row, who holds the ID).
 */
export function problemWords(problem: StudentImportProblem): string {
  const key = problemKey(problem);
  if (key === null) return '';
  const params = problem.params;
  const drawn = messageFor(key, params);
  if (drawn !== null) return drawn;
  if (problem.field === STUDENT_ID && problem.rule === 'in-people' && !params.name) {
    return fillPlaceholders(stateWords('IA-11.row.student-id.in-people.unnamed'), params);
  }
  const undrawn = UNDRAWN_ROW_WORDS[`${problem.field}:${problem.rule}`];
  return undrawn ? fillPlaceholders(undrawn, params) : '';
}

// ---- The chooser's words ----

/**
 * The words under the chooser for a refused check: "Choose a CSV file first" (drawn, the service's
 * own `message`), or the register's for a file without the template's columns or without rows.
 */
export function fileRefusalWords(error: ValidationFailed): string | null {
  for (const item of error.fieldErrors) {
    if (item.field !== 'fileName' && item.field !== 'file') continue;
    if (item.message) return item.message;
    if (item.key === 'IA-11.file.columns') return stateWords('IA-11.file.columns');
    if (item.key === 'IA-11.file.no-rows') return stateWords('IA-11.file.no-rows');
  }
  return null;
}

/** The largest file the page reads (state-copy `IA-11.file.too-large`): 1 MB. */
export const MAX_FILE_BYTES = 1_048_576;

export const CHOOSER_WORDS = {
  tooLarge: stateWords('IA-11.file.too-large'),
  unreadable: stateWords('IA-11.file.unreadable'),
  stale: stateWords('IA-11.commit.stale'),
} as const;
