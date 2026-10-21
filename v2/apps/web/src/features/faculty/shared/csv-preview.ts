/** The service's CSV file as the export band's preview draws it (`FaExportBand`). */
export interface CsvTable {
  /** The header cells, as written. */
  readonly columns: readonly string[];
  /** The data rows, cell by cell. */
  readonly rows: readonly (readonly string[])[];
}

/**
 * The rows of the CSV text the service built (FA-22 on FA-12 and FA-20: `exportSubmissionsCsv`,
 * `exportStudentsCsv`), read as RFC 4180 writes them — a quoted cell keeps its commas, doubled
 * quotes and line breaks — for the export band's "Rows in the exported file". A byte-order mark
 * and a final line break are not rows. Nothing is added: the cells are the file's.
 */
export function csvTable(csv: string): CsvTable {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let quoted = false;
  const text = csv.startsWith('﻿') ? csv.slice(1) : csv;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      record.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      record.push(cell);
      records.push(record);
      record = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  const [columns = [], ...rows] = records;
  return { columns, rows };
}
