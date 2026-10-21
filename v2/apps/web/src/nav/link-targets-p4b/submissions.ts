import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';
const SUBMISSIONS = `${RECORD}/submissions`;
const BOARD = 'FA-v1 Main.dc.html record band and `nav.rk-tabs.fa-tabs`';

/**
 * Link targets of FA-12 Submissions and its FA-22 Export CSV (FA-v1 `LINK-MAP.json` “FA-12”,
 * `Main.dc.html` “FA-12 Submissions · FA-22 Export”; earlier B4-06 f7 … f11). The record frame as
 * on every tab; the filter is in-page; "Mark next" (the page's one primary, shown while a written
 * answer waits) opens FA-19 for the oldest waiting submission (`FA-12.mark-next-target`); each row
 * opens FA-19 for that submission; "Export CSV" is a command whose file the browser saves (FA-22).
 * The filter and "Export CSV" show once there is a submission. The policy-open state (OD-B4-17)
 * draws no action.
 */
export const P4B_SUBMISSIONS_LINK_TARGETS: readonly LedgerEntry[] = pageRows('FA-12', SUBMISSIONS, [
  ['Crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', BOARD],
  [
    'Record band',
    '<n> waiting for marking',
    'secondary',
    '/faculty/marking?assessmentId={assessmentId}',
    'built',
    BOARD,
  ],
  ['Record tabs', 'Summary', 'secondary', RECORD, 'built', BOARD],
  ['Record tabs', 'Questions', 'secondary', `${RECORD}/questions`, 'built', BOARD],
  ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', BOARD],
  ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', BOARD],
  ['Record tabs', 'Submissions', 'secondary', SUBMISSIONS, 'built', BOARD],
  [
    'Toolbar “Show”',
    'All',
    'secondary',
    null,
    'in-page',
    'FA-v1 Main.dc.html FA-12 `div.fa-seg.fa-seg--bar`',
  ],
  [
    'Toolbar “Show”',
    'Waiting for marking',
    'secondary',
    null,
    'in-page',
    'FA-v1 Main.dc.html FA-12 `div.fa-seg.fa-seg--bar`',
  ],
  [
    'Toolbar “Show”',
    'Marked',
    'secondary',
    null,
    'in-page',
    'FA-v1 Main.dc.html FA-12 `div.fa-seg.fa-seg--bar`',
  ],
  [
    'Toolbar',
    'Mark next',
    'primary',
    '/faculty/marking/{attemptId}',
    'built',
    'FA-v1 LINK-MAP FA-12 “Mark next” (`a.rb-btn--primary` → FA-19)',
  ],
  [
    'Toolbar',
    'Export CSV',
    'secondary',
    null,
    'in-page',
    'FA-v1 Main.dc.html FA-12 `button.rb-btn` with the download glyph (`AssessmentService.exportSubmissionsCsv`; the browser saves the file)',
  ],
  [
    'Row',
    '<student name>',
    'secondary',
    '/faculty/marking/{attemptId}',
    'built',
    'FA-v1 LINK-MAP FA-12 row (`a.rk-rowlink`, the whole row; “Mark <student>” / “View marks for <student>”)',
    'FA-19 for that submission.',
  ],
  [
    'No match',
    'Show all',
    'secondary',
    null,
    'in-page',
    'FA-v1 Main.dc.html FA-12 `div.rk-state` (`SB.filtNone`)',
  ],
  ['Submissions (failed to load)', 'Try again', 'secondary', null, 'in-page', 'Board 04'],
]);
