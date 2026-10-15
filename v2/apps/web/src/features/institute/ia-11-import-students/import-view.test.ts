/**
 * IA-11's page state (B2-07 `imInit` / `imView`): the steps move as the board's script moves them,
 * all or nothing gates "Continue" (T-24 interim), and the table lists the service's problems.
 */
import type { StudentImportReport } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import {
  type ImportState,
  importReducer,
  problemLines,
  rowsWithErrors,
  START,
} from './import-view';

const FILE = { name: 'godavari-new.csv', text: 'student_id,…' };

function report(problems: StudentImportReport['problems'] = []): StudentImportReport {
  return {
    batchId: 'imp-0001-godavari-new.csv' as StudentImportReport['batchId'],
    fileName: FILE.name,
    rowsChecked: 6,
    readyToImport: 6 - new Set(problems.map((problem) => problem.row)).size,
    problems,
    canImport: problems.length === 0,
  };
}

const TWO_ON_ROW_3: StudentImportReport['problems'] = [
  {
    row: 3,
    field: 'studentId',
    rule: 'in-people',
    who: { fullName: 'Ravi Teja', studentId: 'GIT-2026-0502' },
    params: { id: 'GIT-2026-0502', name: 'Ravi Teja' },
  },
  {
    row: 3,
    field: 'email',
    rule: 'in-people',
    who: { fullName: 'Ravi Teja', studentId: 'GIT-2026-0502' },
    params: { value: 'ravi.teja@godavari.edu.in' },
  },
  {
    row: 5,
    field: 'fullName',
    rule: 'required',
    who: { fullName: '', studentId: 'GIT-2026-0503' },
    params: {},
  },
];

const run = (...events: Parameters<typeof importReducer>[1][]): ImportState =>
  events.reduce(importReducer, START);

describe('IA-11 page state', () => {
  it('choose → check → continue → back, as B2-07’s script moves', () => {
    const chosen = run({ type: 'unreadable', words: 'x' }, { type: 'chosen', file: FILE });
    expect(chosen).toMatchObject({ step: 1, file: FILE, fileError: null });
    const checked = importReducer(chosen, { type: 'checked', report: report() });
    expect(checked.step).toBe(2);
    const confirming = importReducer(checked, { type: 'continue' });
    expect(confirming.step).toBe(3);
    expect(importReducer(confirming, { type: 'back' }).step).toBe(2);
    // Back to step 1 keeps the file (B2-07 `back` keeps `s.file`).
    expect(importReducer(checked, { type: 'back' })).toMatchObject({ step: 1, file: FILE });
    expect(importReducer(START, { type: 'back' })).toBe(START);
  });

  it('errors gate the import: no “Continue”; “Choose the corrected file” starts with no file', () => {
    const blocked = run(
      { type: 'chosen', file: FILE },
      { type: 'checked', report: report(TWO_ON_ROW_3) },
    );
    expect(importReducer(blocked, { type: 'continue' })).toBe(blocked);
    expect(importReducer(blocked, { type: 'choose-fixed' })).toEqual(START);
  });

  it('a refused check keeps the file; an unreadable one clears it; a stale check returns to step 1', () => {
    const chosen = run({ type: 'chosen', file: FILE });
    expect(importReducer(chosen, { type: 'check-refused', words: 'w' })).toMatchObject({
      file: FILE,
      fileError: 'w',
    });
    expect(importReducer(chosen, { type: 'unreadable', words: 'u' })).toMatchObject({
      file: null,
      fileError: 'u',
    });
    const confirming = run(
      { type: 'chosen', file: FILE },
      { type: 'checked', report: report() },
      { type: 'continue' },
    );
    expect(importReducer(confirming, { type: 'stale', words: 's' })).toMatchObject({
      step: 1,
      file: FILE,
      report: null,
      fileError: 's',
    });
  });

  it('the result, then “Import another file” starts again', () => {
    const done = run(
      { type: 'chosen', file: FILE },
      { type: 'checked', report: report() },
      { type: 'continue' },
      { type: 'imported', result: { added: 6, names: ['Asha Rao'], fileName: FILE.name } },
    );
    expect(done.done).toEqual({ added: 6, names: ['Asha Rao'], fileName: FILE.name });
    expect(importReducer(done, { type: 'restart' })).toEqual(START);
  });

  it('counts rows, not problems, and lists every problem with its words', () => {
    const checked = report(TWO_ON_ROW_3);
    expect(rowsWithErrors(checked)).toBe(2);
    expect(
      problemLines(checked).map(({ row, name, studentId, words }) => [row, name, studentId, words]),
    ).toEqual([
      [
        3,
        'Ravi Teja',
        'GIT-2026-0502',
        'Student ID GIT-2026-0502 is already used by Ravi Teja. Each student needs a different ID.',
      ],
      [
        3,
        'Ravi Teja',
        'GIT-2026-0502',
        'E-mail “ravi.teja@godavari.edu.in” already belongs to someone in People.',
      ],
      [5, '', 'GIT-2026-0503', 'Full name is empty. Every row needs the student’s full name.'],
    ]);
    expect(new Set(problemLines(checked).map((line) => line.key)).size).toBe(3);
  });
});
