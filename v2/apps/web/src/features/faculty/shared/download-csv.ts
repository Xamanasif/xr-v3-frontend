/**
 * FA-22 Export CSV (B4-06 f10, B4-10 f2): hands the service's CSV to the browser as a file of the
 * name it gives ("submissions-ASMT-0009.csv", "students-shell-and-tube.csv"). The text is the
 * service's, already escaped and formula-safe (PC-57); a byte-order mark lets spreadsheet programs
 * read the UTF-8 words (dashes, names) as written. Nothing is sent anywhere: the file is made in
 * the tab.
 */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
