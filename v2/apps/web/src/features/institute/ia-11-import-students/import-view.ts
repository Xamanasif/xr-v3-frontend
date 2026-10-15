/**
 * IA-11 Import students — the page's state as plain data (B2-07 `imInit` / `imView`): the step, the
 * chosen file, the words under the chooser, the service's report and the import's result. The
 * steps are in the page, never in the address (Appendix A rule S3), and nothing here is stored:
 * leaving the page forgets the file and its check (state-copy `IA-11.chooser`).
 */
import type { StudentImportReport } from '@xr/contracts/draft';

import { problemWords } from '@/copy/import-students';

/**
 * The template's six columns, every one required, in its order (B2-07 `ul.xw-cols` and the
 * template download): the CSV file format the service reads (`student-import.ts` COLUMNS), so code
 * rather than copy.
 */
export const TEMPLATE_COLUMNS = [
  'student_id',
  'full_name',
  'email',
  'programme',
  'course',
  'course_code',
] as const;

export type ImportStep = 1 | 2 | 3;

/** The chosen file as the browser read it: its name and its text. */
export interface ChosenFile {
  readonly name: string;
  readonly text: string;
}

/** What "Import N students" answered (B2-07 f9). */
export interface ImportedResult {
  readonly added: number;
  /** Who was added, in file order (`commitStudentImportOutput.students`). */
  readonly names: readonly string[];
  readonly fileName: string;
}

export interface ImportState {
  readonly step: ImportStep;
  readonly file: ChosenFile | null;
  /** The words under the chooser (`span.xw-ferr`), or none. */
  readonly fileError: string | null;
  readonly report: StudentImportReport | null;
  readonly done: ImportedResult | null;
}

export const START: ImportState = {
  step: 1,
  file: null,
  fileError: null,
  report: null,
  done: null,
};

export type ImportEvent =
  /** A file was chosen and read: it replaces the one before, and the words go (B2-07 `choose`). */
  | { readonly type: 'chosen'; readonly file: ChosenFile }
  /** The chosen file could not be read, or is too large: no file is chosen. */
  | { readonly type: 'unreadable'; readonly words: string }
  /** The check was refused for the file ("Choose a CSV file first", the columns, no rows). */
  | { readonly type: 'check-refused'; readonly words: string }
  /** The service's report: step 2 (B2-07 `check`). */
  | { readonly type: 'checked'; readonly report: StudentImportReport }
  | { readonly type: 'back' }
  /** Step 2 with no errors → step 3 (B2-07 `toConfirm`). */
  | { readonly type: 'continue' }
  /** Step 2 with errors → step 1 with no file chosen (B2-07 `chooseFixed`; state-copy `IA-11.chooser`). */
  | { readonly type: 'choose-fixed' }
  | { readonly type: 'imported'; readonly result: ImportedResult }
  /** The check is no longer current: step 1, the same file chosen (state-copy `IA-11.commit.stale`). */
  | { readonly type: 'stale'; readonly words: string }
  /** "Import another file" (B2-07 `startOver`). */
  | { readonly type: 'restart' };

export function importReducer(state: ImportState, event: ImportEvent): ImportState {
  switch (event.type) {
    case 'chosen':
      return { ...state, file: event.file, fileError: null };
    case 'unreadable':
      return { ...state, file: null, fileError: event.words };
    case 'check-refused':
      return { ...state, fileError: event.words };
    case 'checked':
      return { ...state, step: 2, report: event.report, fileError: null };
    case 'back':
      return state.step === 1 ? state : { ...state, step: (state.step - 1) as ImportStep };
    case 'continue':
      return state.report !== null && state.report.problems.length === 0
        ? { ...state, step: 3 }
        : state;
    case 'choose-fixed':
      return { ...START };
    case 'imported':
      return { ...state, done: event.result };
    case 'stale':
      return { ...state, step: 1, report: null, fileError: event.words };
    case 'restart':
      return { ...START };
  }
}

/** How many rows have at least one problem (B2-07 `errors`; state-copy `IA-11.row.several`). */
export function rowsWithErrors(report: StudentImportReport): number {
  return new Set(report.problems.map((problem) => problem.row)).size;
}

/** One line of "Rows that need attention" (B2-07 f6 `problems`). */
export interface ProblemLine {
  readonly key: string;
  readonly row: number;
  /** The name and student ID as the file gives them; empty when the row has none (`IA-11.row.who`). */
  readonly name: string;
  readonly studentId: string;
  readonly words: string;
}

/** The report's problems as the table lists them: in the service's order (row, then column). */
export function problemLines(report: StudentImportReport): ProblemLine[] {
  return report.problems.map((problem, index) => ({
    key: `${problem.row}:${problem.field}:${problem.rule}:${index}`,
    row: problem.row,
    name: problem.who.fullName,
    studentId: problem.who.studentId,
    words: problemWords(problem),
  }));
}
