import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';
const SUBMISSIONS = `${RECORD}/submissions`;
const BOARD = 'B4-06 f7 … f11';

/**
 * Phase 4B link targets: FA-12 Submissions and its FA-22 Export CSV (B4-06 f7 … f11). The record
 * frame as on every tab (top-bar crumbs "Assessments / <name> / Submissions", the five tabs);
 * the filter is in-page; "Mark next" (the page's one primary, shown while a submission waits)
 * opens FA-19 for the oldest waiting submission (`FA-12.mark-next-target`); "Export CSV" is a
 * command whose file the browser saves (FA-22). The policy-open state (OD-B4-17) draws no action.
 */
export const P4B_SUBMISSIONS_LINK_TARGETS: readonly LedgerEntry[] = pageRows('FA-12', SUBMISSIONS, [
  ['Top bar crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', BOARD],
  ['Top bar crumbs', '<assessment name>', 'secondary', RECORD, 'built', BOARD],
  ['Record tabs', 'Summary', 'secondary', RECORD, 'built', BOARD],
  ['Record tabs', 'Questions', 'secondary', `${RECORD}/questions`, 'built', BOARD],
  ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', BOARD],
  ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', BOARD],
  ['Record tabs', 'Submissions', 'secondary', SUBMISSIONS, 'built', BOARD],
  ['Toolbar “Show”', 'All', 'secondary', null, 'in-page', 'B4-06 f7 … f11 `div.xr-seg`'],
  [
    'Toolbar “Show”',
    'Waiting for marking',
    'secondary',
    null,
    'in-page',
    'B4-06 f7 … f11 `div.xr-seg`',
  ],
  ['Toolbar “Show”', 'Marked', 'secondary', null, 'in-page', 'B4-06 f7 … f11 `div.xr-seg`'],
  [
    'Toolbar',
    'Mark next',
    'primary',
    '/faculty/marking/{attemptId}',
    'built',
    'B4-06 f7 … f10 `a.xr-btn--primary.xr-btn--sm` → B4-09',
  ],
  [
    'Toolbar',
    'Export CSV',
    'secondary',
    null,
    'in-page',
    'B4-06 f7 … f11 `button.xr-btn--secondary.xr-btn--sm` (`AssessmentService.exportSubmissionsCsv`; the browser saves the file, f10)',
  ],
  ['Submissions (failed to load)', 'Try again', 'secondary', null, 'in-page', 'Board 04'],
]);
