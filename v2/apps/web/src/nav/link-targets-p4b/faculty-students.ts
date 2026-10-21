import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const STUDENTS = '/faculty/students';
const STUDENT = '/faculty/students/{studentId}';

/**
 * The link targets of FA-20 Students with its FA-22 Export CSV, and FA-21 Student detail (V3
 * Refined B, the owner-approved Faculty export FA-v1 `Main.dc.html` FA-20, FA-21; LINK-MAP.json).
 * FA-20 draws no primary: Export CSV is the toolbar's command. FA-21's one primary is “Mark their
 * answers” while the latest attempt waits for marking → FA-19; a marked attempt has “View marks”
 * (→ FA-19, read-only), and “Open the assessment” opens its record (FA-08). There is no messaging
 * or reminder action (T-34).
 */
export const P4B_FACULTY_STUDENTS_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-20', STUDENTS, [
    [
      'Toolbar',
      'Export CSV',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-20 `div.fa-tbar-act > button#fa-sl-export.rb-btn` (FA-22; `exportCsv`; shown while rows are on show)',
      'The service makes the CSV of the list on show; the browser saves it and the band shows its rows (state-copy `FA-22.file`).',
    ],
    [
      'Toolbar',
      'Experiment · Progress · Inactive for · Remove filter (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-20 `div.rk-tools.fa-tools`, `div.rk-statusline` (`onExp`, `onProg`, `onInact`, `chips`, `clear`)',
      'Filters apply at once; the Experiment filter (more than one taught) replaces the address (`?experimentId=`).',
    ],
    [
      'Student row',
      '<student name>',
      'secondary',
      `${STUDENT}?experimentId={experimentId}`,
      'built',
      'FA-v1 FA-20 `td a.rk-rowlink[aria-label="Open …"]` (the whole row follows it); LINK-MAP FA-20 “Open Rahul Verma” → FA-21',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-20 `div.rk-state > button.rb-btn` (`SL.clear`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-20.failed`'],
  ]),
  ...pageRows('FA-21', STUDENT, [
    [
      'Breadcrumb',
      'Students',
      'secondary',
      `${STUDENTS}?experimentId={experimentId}`,
      'built',
      'FA-v1 FA-21 `nav.rk-crumbs > a`; LINK-MAP FA-21 “Students” → FA-20',
      'FA-20 for the same experiment.',
    ],
    [
      'Assessment panel · waiting for marking',
      'Mark their answers',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 FA-21 `div.fa-panel-acts > a.rb-btn--primary.rb-btn--lg`; LINK-MAP FA-21 → FA-19',
    ],
    [
      'Assessment panel · marked',
      'View marks',
      'secondary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 FA-21 `div.fa-panel-acts > a.rb-btn.rb-btn--lg`; LINK-MAP FA-21 “View marks” → FA-19',
      'FA-19 shows the confirmed marks read-only.',
    ],
    [
      'Assessment panel',
      'Open the assessment',
      'secondary',
      '/faculty/assessments/{assessmentId}',
      'built',
      'FA-v1 FA-21 `a.rb-link`; LINK-MAP FA-21 “Open the assessment” → FA-08',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-21.failed`'],
  ]),
];
