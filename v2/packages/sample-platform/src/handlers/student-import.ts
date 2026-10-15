/**
 * IA-11 Import students (B2-07 f5 … f10; Phase-2 Package 2B; provisional register PC-47): the
 * service reads the CSV file the Institute Admin chose — the six template columns, every one
 * required — and reports each row's problems as rule keys. The drawn rules are the domain's
 * (`checkStudentImport`); the sample-mode identity safeguard adds two e-mail rows (PC-49).
 * Nothing is written by a check: the rows wait in the adapter (`PlatformCore.imports`) until the
 * commit, which checks them again against the records as they are then. All or nothing stays the
 * T-24 interim (B2-07 "Commit mode — interim, not final").
 */
import {
  STUDENT_IMPORT_FIELDS,
  type StudentImportProblem,
  type StudentImportReport,
} from '@xr/contracts/draft';
import {
  type CourseId,
  type ImportProblem,
  type Institution,
  platformCodeKey,
  type StudentImportRow,
} from '@xr/domain';

import type { Op } from '../pipeline/runner.js';
import { coursesInAccess } from '../world/queries.js';
import { values } from '../world/records.js';
import { signsSomeoneIn } from './identity-safeguard.js';

/** The template's header (B2-07 "Download the template (CSV)"), by the domain's row field. */
const COLUMNS: Readonly<Record<(typeof STUDENT_IMPORT_FIELDS)[number], string>> = {
  studentId: 'student_id',
  fullName: 'full_name',
  email: 'email',
  programme: 'programme',
  course: 'course',
  courseCode: 'course_code',
};

/** RFC 4180 records: commas, double-quoted fields ("" for a quote), CRLF / LF / CR line ends. */
export function csvRecords(text: string): string[][] {
  const source = text.startsWith('﻿') ? text.slice(1) : text;
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  let index = 0;
  const endField = () => {
    record.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    records.push(record);
    record = [];
  };
  while (index < source.length) {
    const char = source[index]!;
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
      } else field += char;
      index += 1;
      continue;
    }
    if (char === '"' && field === '') quoted = true;
    else if (char === ',') endField();
    else if (char === '\r') {
      endRecord();
      if (source[index + 1] === '\n') index += 1;
    } else if (char === '\n') endRecord();
    else field += char;
    index += 1;
  }
  if (field !== '' || record.length > 0) endRecord();
  return records;
}

/** A header cell as a column name: case, outer spaces and inner spaces ignored ("Full name" → full_name). */
function columnName(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, '_');
}

export type ParsedStudentFile =
  | { readonly kind: 'rows'; readonly rows: readonly StudentImportRow[] }
  | { readonly kind: 'columns' }
  | { readonly kind: 'no-rows' };

/**
 * The file's student rows. Row numbers are the file's own lines as a spreadsheet numbers them
 * (the header is row 1); blank lines are skipped. A header that does not name each of the six
 * columns exactly once is `columns`; a header with nothing under it is `no-rows`.
 */
export function parseStudentFile(text: string): ParsedStudentFile {
  const records = csvRecords(text);
  const blank = (record: readonly string[]) => record.every((cell) => cell.trim() === '');
  const headerAt = records.findIndex((record) => !blank(record));
  if (headerAt < 0) return { kind: 'columns' };
  const header = records[headerAt]!.map(columnName);
  const positions = {} as Record<keyof typeof COLUMNS, number>;
  for (const [field, name] of Object.entries(COLUMNS) as [keyof typeof COLUMNS, string][]) {
    const at = header.indexOf(name);
    if (at < 0 || header.indexOf(name, at + 1) >= 0) return { kind: 'columns' };
    positions[field] = at;
  }
  const rows: StudentImportRow[] = [];
  records.forEach((record, index) => {
    if (index <= headerAt || blank(record)) return;
    const cell = (field: keyof typeof COLUMNS) => record[positions[field]] ?? '';
    rows.push({
      row: index + 1,
      studentId: cell('studentId'),
      fullName: cell('fullName'),
      email: cell('email'),
      programme: cell('programme'),
      course: cell('course'),
      courseCode: cell('courseCode'),
    });
  });
  return rows.length === 0 ? { kind: 'no-rows' } : { kind: 'rows', rows };
}

/**
 * The course a `course_code` files the student against: the BITS code (ME ZG523) or the
 * institution's own (MEC-523), compared as codes are (`platformCodeKey`).
 */
export function courseResolver(
  op: Op,
  institution: Institution,
): (code: string) => CourseId | null {
  // Package 2B (PC-47, provisional): a student is filed only under a course of the institution's
  // content access — the BITS code of a course it does not hold names no course for this file.
  const inAccess = new Set<string>(coursesInAccess(op.records, institution.id));
  return (code) => {
    const key = platformCodeKey(code);
    const platform = values(op.records.courses).find(
      (course) =>
        inAccess.has(course.id) &&
        course.platformCode !== null &&
        platformCodeKey(course.platformCode) === key,
    );
    if (platform) return platform.id;
    const own = values(op.records.courseCodes).find(
      (entry) =>
        entry.institutionId === institution.id &&
        inAccess.has(entry.courseId) &&
        entry.code !== null &&
        platformCodeKey(entry.code) === key,
    );
    return own?.courseId ?? null;
  };
}

/**
 * The identity safeguard's rows (PC-49): an e-mail a second row repeats, or one another sample
 * identity already signs in with. A row whose e-mail the domain already reports (empty, not a full
 * address, already in People) keeps that one problem.
 */
export function identityProblems(
  op: Op,
  rows: readonly StudentImportRow[],
  domain: readonly ImportProblem[],
): ImportProblem[] {
  const reported = new Set(
    domain.filter((problem) => problem.field === 'email').map((problem) => problem.row),
  );
  const firstRow = new Map<string, number>();
  const problems: ImportProblem[] = [];
  for (const row of rows) {
    const email = row.email.trim();
    if (email === '') continue;
    const key = email.toLowerCase();
    const first = firstRow.get(key);
    if (first === undefined) firstRow.set(key, row.row);
    if (reported.has(row.row)) continue;
    if (first !== undefined)
      problems.push({ row: row.row, field: 'email', rule: 'duplicate-in-file' });
    else if (signsSomeoneIn(op, email))
      problems.push({ row: row.row, field: 'email', rule: 'identity-taken' });
  }
  return problems;
}

const FIELD_ORDER: readonly string[] = STUDENT_IMPORT_FIELDS;

/** Row first, then the template's column order — the order B2-07 lists them in. */
export function inFileOrder<P extends { readonly row: number; readonly field: string }>(
  problems: readonly P[],
): P[] {
  return [...problems].sort(
    (a, b) => a.row - b.row || FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field),
  );
}

/**
 * The values a problem's words need (`params`): the e-mail or course code as the file gives it, the
 * first row with the same student ID or e-mail, and who already holds a student ID in People.
 */
export function problemParams(
  op: Op,
  institution: Institution,
  rows: readonly StudentImportRow[],
  problem: ImportProblem,
): Record<string, string> {
  const row = rows.find((candidate) => candidate.row === problem.row);
  if (!row) return {};
  const same = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();
  if (problem.field === 'email') {
    const value = row.email.trim();
    if (problem.rule === 'duplicate-in-file') {
      const first = rows.find((candidate) => same(candidate.email, row.email));
      return { value, row: String(first?.row ?? row.row) };
    }
    return problem.rule === 'required' ? {} : { value };
  }
  if (problem.field === 'studentId') {
    const id = row.studentId.trim();
    if (problem.rule === 'duplicate-in-file') {
      const first = rows.find((candidate) => same(candidate.studentId, row.studentId));
      return { id, row: String(first?.row ?? row.row) };
    }
    if (problem.rule === 'in-people') {
      const holder = values(op.records.people).find(
        (person) =>
          person.institutionId === institution.id &&
          person.kind === 'student' &&
          same(person.institutionStudentId, id),
      );
      return { id, name: holder?.fullName ?? '' };
    }
    return {};
  }
  if (problem.field === 'courseCode' && problem.rule === 'unknown-course') {
    return { value: row.courseCode.trim() };
  }
  return {};
}

/** The report a check answers (`studentImportReport`): counts, and each problem as the file names it. */
export function importReport(
  op: Op,
  institution: Institution,
  batch: { readonly batchId: string; readonly fileName: string },
  rows: readonly StudentImportRow[],
  problems: readonly ImportProblem[],
): StudentImportReport {
  const ordered = inFileOrder(problems);
  const rowsWithErrors = new Set(ordered.map((problem) => problem.row)).size;
  return {
    batchId: batch.batchId as StudentImportReport['batchId'],
    fileName: batch.fileName,
    rowsChecked: rows.length,
    readyToImport: rows.length - rowsWithErrors,
    problems: ordered.map((problem): StudentImportProblem => {
      const row = rows.find((candidate) => candidate.row === problem.row);
      return {
        row: problem.row,
        field: problem.field,
        rule: problem.rule as StudentImportProblem['rule'],
        who: { fullName: row?.fullName.trim() ?? '', studentId: row?.studentId.trim() ?? '' },
        params: problemParams(op, institution, rows, problem),
      };
    }),
    canImport: rows.length > 0 && ordered.length === 0,
  };
}
