/**
 * FA-17 Import questions — the page's state as plain data (B4-08 `imInit` / `imView`): the step,
 * the chosen file, the words under the chooser, the service's report and the import's result. The
 * steps are in the page, never in the address, and nothing here is stored: leaving the page
 * forgets the file and its check (state-copy `FA-17.chooser`). The same shape as IA-11's
 * (`ia-11-import-students/import-view.ts`): B4-08 "Same pattern as Import students (B2-07)".
 */
import type { QUESTION_IMPORT_COLUMNS, QuestionImportReport } from '@xr/domain';

import { parseProblem, rowProblemWords } from '@/copy/question-tools';

/**
 * The template's ten columns, in its order (B4-08 `ul.xw-cols` and the template download): the
 * CSV file format the service reads (`QUESTION_IMPORT_COLUMNS`), so code rather than copy.
 */
export const QUESTION_TEMPLATE_COLUMNS = [
  'type',
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct',
  'marks',
  'explanation',
  'marking_guidance',
] as const satisfies readonly (typeof QUESTION_IMPORT_COLUMNS)[number][];

export type ImportStep = 1 | 2 | 3;

/** The chosen file as the browser read it: its name and its text. */
export interface ChosenFile {
  readonly name: string;
  readonly text: string;
}

export interface ImportState {
  readonly step: ImportStep;
  readonly file: ChosenFile | null;
  /** The words under the chooser (`span.xw-ferr`), or none. */
  readonly fileError: string | null;
  readonly report: QuestionImportReport | null;
  /** The new questions' IDs, in file order (f8). */
  readonly done: readonly string[] | null;
}

export const START: ImportState = {
  step: 1,
  file: null,
  fileError: null,
  report: null,
  done: null,
};

export type ImportEvent =
  /** A file was chosen and read: it replaces the one before, and the words go (B4-08 `choose`). */
  | { readonly type: 'chosen'; readonly file: ChosenFile }
  /** The chosen file could not be read, or is too large: no file is chosen. */
  | { readonly type: 'unreadable'; readonly words: string }
  /** The check was refused for the file ("Choose a CSV file first", the columns, no rows). */
  | { readonly type: 'check-refused'; readonly words: string }
  /** The service's report: step 2 (B4-08 `check`). */
  | { readonly type: 'checked'; readonly report: QuestionImportReport }
  | { readonly type: 'back' }
  /** Step 2 with no errors → step 3 (B4-08 `toConfirm`). */
  | { readonly type: 'continue' }
  /** Step 2 with errors → step 1 with no file chosen (state-copy `FA-17.chooser`). */
  | { readonly type: 'choose-fixed' }
  | { readonly type: 'imported'; readonly added: readonly string[] }
  /** The check is no longer current: step 1, the same file chosen (`FA-17.commit.stale`). */
  | { readonly type: 'stale'; readonly words: string }
  /** "Import another file" (B4-08 `startOver`). */
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
      return state.report !== null && state.report.canImport ? { ...state, step: 3 } : state;
    case 'choose-fixed':
      return { ...START };
    case 'imported':
      return { ...state, done: event.added };
    case 'stale':
      return { ...state, step: 1, report: null, fileError: event.words };
    case 'restart':
      return { ...START };
  }
}

/** The report's counts (B4-08 `imView`: total, ok, errors, warnings) and the rows without an explanation. */
export interface ReportCounts {
  readonly rows: number;
  readonly ready: number;
  readonly errors: number;
  readonly warnings: number;
  readonly noExplanation: number;
}

/** Rows are counted once each, whatever number of problems they have. */
export function reportCounts(report: QuestionImportReport): ReportCounts {
  const errorRows = new Set(
    report.rows.filter((entry) => entry.severity === 'error').map((entry) => entry.row),
  );
  const warned = report.rows.filter(
    (entry) => entry.severity === 'warning' && !errorRows.has(entry.row),
  );
  return {
    rows: report.rowsChecked,
    ready: Math.max(0, report.rowsChecked - errorRows.size),
    errors: errorRows.size,
    warnings: new Set(warned.map((entry) => entry.row)).size,
    noExplanation: new Set(
      warned
        .filter((entry) => parseProblem(entry.problem).rule === 'explanation-empty')
        .map((entry) => entry.row),
    ).size,
  };
}

/** One line of "Rows that need attention" (B4-08 f6 `problems`). */
export interface ProblemLine {
  readonly key: string;
  readonly row: number;
  /** The question as the file gives it. */
  readonly question: string;
  readonly words: string;
  readonly severity: 'error' | 'warning';
}

/** The report's rows as the table lists them: in the service's order (row, then rule). */
export function problemLines(report: QuestionImportReport): ProblemLine[] {
  return report.rows.map((entry, index) => ({
    key: `${entry.row}:${entry.problem}:${index}`,
    row: entry.row,
    question: entry.question,
    words: rowProblemWords(entry.problem),
    severity: entry.severity,
  }));
}
