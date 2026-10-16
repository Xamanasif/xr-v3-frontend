import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const STUDENTS = '/faculty/students';
const STUDENT = '/faculty/students/{studentId}';

/**
 * Phase 4B link targets: FA-20 Students with its FA-22 Export CSV, and FA-21 Student detail
 * (B4-10). FA-20 draws no primary: Export CSV is the header's secondary command (f0, f2). FA-21's
 * one primary is "Mark their answers" while an attempt waits for marking (f3) → FA-19; a marked
 * attempt has "See submission" (f4) → the assessment's Submissions (FA-12), as the board links
 * them. There is no messaging or reminder action (T-34).
 */
export const P4B_FACULTY_STUDENTS_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-20', STUDENTS, [
    [
      'Page header',
      'Export CSV',
      'secondary',
      null,
      'in-page',
      'B4-10 f0, f2 `button.xr-btn--secondary` (FA-22; script `exportCsv`)',
      'The service makes the CSV of the list on show; the browser saves it (state-copy `FA-22.file`).',
    ],
    [
      'Toolbar',
      'Experiment · Progress · Inactive for · Remove (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'B4-10 f0, f1 (script `onProg`, `onInact`, `chips`, `clear`)',
      'Filters apply at once; the Experiment filter replaces the address (`?experimentId=`).',
    ],
    [
      'Student row',
      '<student name>',
      'secondary',
      `${STUDENT}?experimentId={experimentId}`,
      'built',
      'B4-10 f0, f1, f7 `td a[aria-label="Open …"] strong` (→ FA-21)',
    ],
    ['No match', 'Clear filters', 'secondary', null, 'in-page', 'B4-10 script `s.noMatch`'],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-20.failed`'],
  ]),
  ...pageRows('FA-21', STUDENT, [
    [
      'Back link',
      'Students',
      'secondary',
      `${STUDENTS}?experimentId={experimentId}`,
      'built',
      'B4-10 f3 … f5 `a.xr-back`',
      'FA-20 for the same experiment.',
    ],
    [
      'Assessment · waiting for marking (f3)',
      'Mark their answers',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'B4-10 f3 `a.xr-btn--primary.xr-btn--sm` (→ B4-09 FA-19)',
    ],
    [
      'Assessment · marked (f4)',
      'See submission',
      'secondary',
      '/faculty/assessments/{assessmentId}/submissions',
      'built',
      'B4-10 f4 `a.xr-btn--secondary.xr-btn--sm` (→ B4-06 FA-12)',
      'The assessment’s Submissions, as the board links it.',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-21.failed`'],
  ]),
];
