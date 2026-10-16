import type { FacultyStudentRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

/** The formats in the boards' order (WEB · AR · VR · MR, `FORMAT_DISPLAY_ORDER`). */
export const FORMAT_ORDER: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

/** B4-10's script draws the "Inactive <n> days" tag from 14 days (`inactive: r.days >= 14`). */
export const INACTIVE_TAG_DAYS = 14;

const DAY_MS = 86_400_000;

/** Whole days from one instant to another (never below 0), as the service counts inactivity. */
export function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS));
}

/**
 * The days a Student has been inactive (state-copy `FA-20.inactive`): the service's figure since
 * the last activity; with no activity yet, the days since the experiment was given, as of the
 * teaching read's instant (`asOf`). `null` while neither can be told.
 */
export function inactiveDaysOf(row: FacultyStudentRow, asOf: string | null): number | null {
  if (row.inactiveDays !== null) return row.inactiveDays;
  if (row.lastActivityAt === null && row.accessGivenAt !== null && asOf !== null)
    return daysBetween(row.accessGivenAt, asOf);
  return null;
}

/** The formats a list's rows hold, in display order (every row has the institution's formats). */
export function formatsOf(rows: readonly FacultyStudentRow[]): Technology[] {
  const present = new Set(rows.flatMap((row) => row.perFormat.map((view) => view.format)));
  return FORMAT_ORDER.filter((format) => present.has(format));
}

/**
 * A CSV file's header cells and how many data rows it holds (FA-22's message): the records are
 * read as RFC 4180 writes them, so a quoted cell with a comma or a line break stays one cell.
 */
export function csvShape(csv: string): { readonly columns: string[]; readonly rows: number } {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]!;
    if (quoted) {
      if (char !== '"') cell += char;
      else if (csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      record.push(cell);
      cell = '';
    } else if (char === '\n') {
      record.push(cell);
      records.push(record);
      record = [];
      cell = '';
    } else if (char !== '\r') cell += char;
  }
  if (cell !== '' || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  const [columns = [], ...data] = records;
  return { columns, rows: data.length };
}
