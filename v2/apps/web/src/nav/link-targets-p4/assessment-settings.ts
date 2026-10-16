import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';

/**
 * The assessment record's frame on each tab page (B4-06 f0, f5): the top-bar crumbs "Assessments /
 * <name> / <tab>" and the tabs Summary · Questions · Settings · Preview · Submissions (FA-12, since
 * Phase 4B).
 */
function recordFrame(board: string): PageRow[] {
  return [
    ['Top bar crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', board],
    ['Top bar crumbs', '<assessment name>', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Summary', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Questions', 'secondary', `${RECORD}/questions`, 'built', board],
    ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', board],
    ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', board],
    ['Record tabs', 'Submissions', 'secondary', `${RECORD}/submissions`, 'built', board],
  ];
}

/** Phase 4A link targets: FA-10 Settings and FA-11 Preview (B4-06). */
export const P4_ASSESSMENT_SETTINGS_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-10 Settings (B4-06 f0 … f4): the page's one primary is the form's "Save settings" (a
  // command). Configuration only: no result-release, "Make available" or close control (D4, T-18).
  ...pageRows('FA-10', `${RECORD}/settings`, [
    ...recordFrame('B4-06 f0, f4 `nav.xw-hubtabs`; top bar crumbs'),
    [
      'Error summary “Check these settings”',
      '(each link: the field it names)',
      'secondary',
      '#Es-name',
      'in-page',
      'B4-06 script `errList` (`#Es-err`)',
    ],
    [
      'Form foot',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B4-06 f0 … f4 `button.xr-btn--text` (puts the record’s values back; state-copy `FA-10.cancel`)',
    ],
    [
      'Form foot',
      'Save settings',
      'primary',
      null,
      'in-page',
      'B4-06 f0 … f4 `button.xr-btn--primary` (`AssessmentService.updateSettings`)',
    ],
  ]),
  // FA-11 Preview (B4-06 f5, f6): a reading page — no primary, no command. The view switch mirrors
  // the view into the address (`?view=key`; state-copy `FA-11.view-address`).
  ...pageRows('FA-11', `${RECORD}/preview`, [
    ...recordFrame('B4-06 f5, f6 `nav.xw-hubtabs`; top bar crumbs'),
    [
      'Preview as',
      'Student view / Answer key',
      'secondary',
      null,
      'in-page',
      'B4-06 f5, f6 `div.xr-seg`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-11.failed`'],
  ]),
];
