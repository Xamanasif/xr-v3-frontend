/**
 * The words of IA-11 Import students are B2-07's: each drawn phrase is found verbatim in its markup
 * or script (`imView`), the composed ones with the board's own sample values; the row words are the
 * catalogue's where the board draws them and the register's provisional words where it does not.
 */
import {
  STUDENT_IMPORT_ROW_KEYS,
  STUDENT_IMPORT_SAFEGUARD_ROW_KEYS,
  type StudentImportProblem,
  type ValidationFailed,
} from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { TEMPLATE_COLUMNS } from '@/features/institute/ia-11-import-students/import-view';
import { board } from '@/test-support/boards';

import {
  addedNamesWords,
  CHOOSER_WORDS,
  CONFIRM_LINE,
  fileRefusalWords,
  IMPORT_STUDENTS,
  importButtonWords,
  importedLine,
  importedTitle,
  importStepCount,
  MAX_FILE_BYTES,
  problemKey,
  problemWords,
  readyWords,
  rowsCheckedWords,
  rowsWithErrorsWords,
  studentsWords,
  TEMPLATE_DOWNLOAD,
  TEMPLATE_LINE,
} from './import-students';
import { STATE_COPY } from './state-copy';

const RAW = board('B2-07-Add-and-Import.dc.html');
/** The board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
const B2_07 = `${RAW.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${RAW}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** A problem as the service reports it (`studentImportReport.problems`). */
function problem(
  field: StudentImportProblem['field'],
  rule: StudentImportProblem['rule'],
  params: Record<string, string> = {},
): StudentImportProblem {
  return { row: 6, field, rule, who: { fullName: 'Imran S.', studentId: 'GIT-2026-0409' }, params };
}

describe('IA-11 Import students — the drawn words (B2-07 f5 … f10)', () => {
  it.each(strings(IMPORT_STUDENTS))('“%s” is on B2-07', (phrase) => {
    expect(B2_07).toContain(phrase);
  });

  it('the template: its line with seven <strong> runs, the six columns, the download', () => {
    const html = TEMPLATE_LINE.map((run) =>
      typeof run === 'string'
        ? run
        : `<strong>${'strong' in run ? run.strong : TEMPLATE_COLUMNS[run.column]}</strong>`,
    ).join('');
    expect(RAW).toContain(`<p class="xr-body" style="margin:0 0 10px;color:#40476B">${html}</p>`);
    expect(RAW).toContain(
      `<ul class="xw-cols" aria-label="${IMPORT_STUDENTS.columnsLabel}">${TEMPLATE_COLUMNS.map((column) => `<li>${column}</li>`).join('')}</ul>`,
    );
    expect(RAW).toContain(
      `href="${TEMPLATE_DOWNLOAD.href}" download="${TEMPLATE_DOWNLOAD.fileName}"`,
    );
    // The download is the template's header line, exactly the six columns.
    expect(decodeURIComponent(TEMPLATE_DOWNLOAD.href.split(',').slice(1).join(','))).toBe(
      `${TEMPLATE_COLUMNS.join(',')}\n`,
    );
  });

  it('the composed words follow the board’s script', () => {
    expect(B2_07).toContain("'Step ' + s.step + ' of 3'");
    expect(importStepCount(2)).toBe('Step 2 of 3');
    expect(B2_07).toContain("rep.total + ' rows checked'");
    expect(rowsCheckedWords(13)).toBe('13 rows checked');
    expect(B2_07).toContain("rep.ok + ' ready to import'");
    expect(readyWords(9)).toBe('9 ready to import');
    expect(B2_07).toContain("(rep.errors === 1 ? ' row with an error' : ' rows with errors')");
    expect(rowsWithErrorsWords(4)).toBe('4 rows with errors');
    expect(rowsWithErrorsWords(1)).toBe('1 row with an error');
    expect(B2_07).toContain("'Import ' + rep.ok + ' students'");
    expect(importButtonWords(12)).toBe('Import 12 students');
    expect(B2_07).toContain("rep.ok + ' students imported'");
    expect(importedTitle(12)).toBe('12 students imported');
    // f8: "<strong>12 students</strong> will be added to People from <strong>…</strong>."
    expect(RAW).toContain(
      `{{ i.ok }} students</strong>${CONFIRM_LINE.middle}<strong style="color:#12173F">{{ i.file }}</strong>${CONFIRM_LINE.end}</p>`,
    );
    expect(studentsWords(12)).toBe('12 students');
    // f9: the notice, with the board's sample values in its template.
    const template = /<span>(\{\{ i\.ok \}\} students were added[^<]*)<\/span>/.exec(RAW)?.[1];
    expect(
      template!
        .replace('{{ i.ok }}', '12')
        .replace('{{ i.file }}', 'godavari-me-zg523-corrected.csv'),
    ).toBe(importedLine(12, 'godavari-me-zg523-corrected.csv'));
  });

  it('“Added” names everyone as the board does: “A, B … and L.”', () => {
    const sample = /"sample": "([^"]+)"/.exec(RAW)?.[1];
    const names = sample!.slice(0, -1).split(/, | and /);
    expect(names).toHaveLength(12);
    expect(addedNamesWords(names)).toBe(sample);
  });

  it('the one-student forms are undrawn: the register’s rule (IA-11.count-one, IA-11.added-names)', () => {
    expect(rowsCheckedWords(1)).toBe('1 row checked');
    expect(importButtonWords(1)).toBe('Import 1 student');
    expect(importedTitle(1)).toBe('1 student imported');
    expect(importedLine(1, 'x.csv')).toBe(
      '1 student was added to People from x.csv. They don’t have any experiments yet.',
    );
    expect(addedNamesWords(['Asha Rao'])).toBe('Asha Rao.');
    expect(addedNamesWords(['Asha Rao', 'Ravi Teja'])).toBe('Asha Rao and Ravi Teja.');
    for (const phrase of ['1 row checked', 'Import 1 student', '1 student imported']) {
      expect(B2_07).not.toContain(phrase);
      expect(STATE_COPY['IA-11.count-one'].rule).toContain(phrase);
    }
    expect(STATE_COPY['IA-11.count-one'].rule).toContain(
      '1 student was added to People from <file>. They don’t have any experiments yet.',
    );
    expect(STATE_COPY['IA-11.added-names'].status).toBe('provisional');
  });
});

describe('IA-11 — what to fix, row by row', () => {
  it('B2-07 f6’s four drawn rows are the catalogue’s words, with the row’s own values', () => {
    const drawn = [
      problemWords(problem('studentId', 'duplicate-in-file', { id: 'GIT-2026-0409', row: '3' })),
      problemWords(problem('programme', 'required')),
      problemWords(problem('email', 'email-format', { value: 'fatima.begum@godavari' })),
      problemWords(problem('courseCode', 'required')),
    ];
    expect(drawn).toEqual([
      'Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID.',
      'Programme is empty. Every row needs the student’s programme.',
      'E-mail “fatima.begum@godavari” isn’t a full address.',
      'Course code is empty. Every row needs the course code (ME ZG523 or MEC-523).',
    ]);
    for (const phrase of drawn) expect(RAW).toContain(`"msg": "${phrase}"`);
  });

  it('the rows B2-07 states as rules but does not word are the register’s provisional words', () => {
    const cases: [StudentImportProblem, string, keyof typeof STATE_COPY][] = [
      [
        problem('studentId', 'required'),
        'Student ID is empty. Every row needs the student’s ID.',
        'IA-11.row.student-id.required',
      ],
      [
        problem('fullName', 'required'),
        'Full name is empty. Every row needs the student’s full name.',
        'IA-11.row.full-name.required',
      ],
      [
        problem('email', 'required'),
        'E-mail is empty. Every row needs the student’s institution e-mail.',
        'IA-11.row.e-mail.required',
      ],
      [
        problem('course', 'required'),
        'Course is empty. Every row needs the course.',
        'IA-11.row.course.required',
      ],
      [
        problem('email', 'in-people', { value: 'rahul.verma@godavari.edu.in' }),
        'E-mail “rahul.verma@godavari.edu.in” already belongs to someone in People.',
        'IA-11.row.e-mail.in-people',
      ],
      [
        problem('studentId', 'in-people', { id: 'GIT-2026-0418', name: 'Rahul Verma' }),
        'Student ID GIT-2026-0418 is already used by Rahul Verma. Each student needs a different ID.',
        'IA-11.row.student-id.in-people',
      ],
      [
        problem('studentId', 'in-people', { id: 'GIT-2026-0418', name: '' }),
        'Student ID GIT-2026-0418 is already in People. Each student needs a different ID.',
        'IA-11.row.student-id.in-people.unnamed',
      ],
      [
        problem('courseCode', 'unknown-course', { value: 'XX 999' }),
        'Course code “XX 999” doesn’t match a course in your content access. Use the BITS code or your institution’s own code.',
        'IA-11.row.course-code.unknown-course',
      ],
    ];
    for (const [reported, words, entry] of cases) {
      expect(problemWords(reported)).toBe(words);
      expect(B2_07).not.toContain(words);
      expect(STATE_COPY[entry]).toMatchObject({ status: 'provisional', decisions: ['VD-12'] });
    }
  });

  it('the sample-mode identity safeguard’s rows wait on T-11 / P1-01, not a final policy', () => {
    expect(problemKey(problem('email', 'identity-taken'))).toBe('IA-11.row.email.identity-taken');
    expect(
      problemWords(problem('email', 'identity-taken', { value: 'meera.iyer@godavari.edu.in' })),
    ).toBe(
      'E-mail “meera.iyer@godavari.edu.in” is already used to sign in to the platform. Use a different e-mail.',
    );
    expect(
      problemWords(
        problem('email', 'duplicate-in-file', { value: 'asha.rao@godavari.edu.in', row: '2' }),
      ),
    ).toBe(
      'E-mail “asha.rao@godavari.edu.in” is also in row 2. Each student needs a different e-mail.',
    );
    for (const id of [
      'IA-11.row.e-mail.identity-taken',
      'IA-11.row.e-mail.duplicate-in-file',
    ] as const) {
      expect(STATE_COPY[id]).toMatchObject({ status: 'provisional', decisions: ['T-11', 'P1-01'] });
      expect(STATE_COPY[id].rule).toContain('not the T-11');
    }
  });
});

describe('IA-11 — every row rule the service may report has words', () => {
  it.each(Object.keys({ ...STUDENT_IMPORT_ROW_KEYS, ...STUDENT_IMPORT_SAFEGUARD_ROW_KEYS }))(
    '%s',
    (pair) => {
      const [field, rule] = pair.split(':') as [
        StudentImportProblem['field'],
        StudentImportProblem['rule'],
      ];
      const words = problemWords(
        problem(field, rule, { value: 'v', id: 'GIT-1', row: '2', name: 'Asha Rao' }),
      );
      expect(words.length).toBeGreaterThan(10);
      expect(words).not.toMatch(/[{}]/);
    },
  );
});

describe('IA-11 — the chooser’s words', () => {
  const refusal = (field: string, key: string, message: string | null): ValidationFailed => ({
    kind: 'validation-failed',
    fieldErrors: [{ field, key: key as never, message, params: {} }],
    summaryTitle: null,
  });

  it('“Choose a CSV file first” is the service’s drawn message; the file checks are the register’s', () => {
    expect(
      fileRefusalWords(refusal('fileName', 'IA-11.file.required', 'Choose a CSV file first')),
    ).toBe('Choose a CSV file first');
    expect(B2_07).toContain("err: 'Choose a CSV file first'");
    expect(fileRefusalWords(refusal('file', 'IA-11.file.columns', null))).toBe(
      STATE_COPY['IA-11.file.columns'].words,
    );
    expect(fileRefusalWords(refusal('file', 'IA-11.file.no-rows', null))).toBe(
      STATE_COPY['IA-11.file.no-rows'].words,
    );
    expect(fileRefusalWords(refusal('other', 'IA-11.file.columns', null))).toBeNull();
  });

  it('the size cap, the unreadable file and the stale check are provisional', () => {
    expect(MAX_FILE_BYTES).toBe(1024 * 1024);
    expect(STATE_COPY['IA-11.file.too-large'].rule).toContain('1,048,576 bytes');
    expect(CHOOSER_WORDS).toEqual({
      tooLarge: STATE_COPY['IA-11.file.too-large'].words,
      unreadable: STATE_COPY['IA-11.file.unreadable'].words,
      stale: STATE_COPY['IA-11.commit.stale'].words,
    });
  });

  it('all or nothing is recorded as the interim T-24, not a final policy; no warning is worded', () => {
    expect(STATE_COPY['IA-11.commit-mode']).toMatchObject({
      status: 'provisional',
      decisions: ['T-24'],
    });
    expect(STATE_COPY['IA-11.commit-mode'].rule).toContain('not a final policy');
    expect(STATE_COPY['IA-11.no-warnings'].decisions).toEqual(['T-24']);
    expect(strings(IMPORT_STUDENTS)).not.toContain('Warning');
  });
});
