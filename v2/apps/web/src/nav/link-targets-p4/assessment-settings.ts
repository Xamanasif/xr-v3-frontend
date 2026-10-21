import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';

/**
 * The assessment record's frame on each tab page (FA-v1 `Main.dc.html` "FA-08…FA-12 Assessment
 * record"): the crumbs "Assessments › <name>", the record band's waiting link and the record tabs.
 */
function recordFrame(board: string): PageRow[] {
  return [
    ['Crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', board],
    [
      'Record band',
      '<n> waiting for marking',
      'secondary',
      '/faculty/marking?assessmentId={assessmentId}',
      'built',
      board,
    ],
    ['Record tabs', 'Summary', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Questions', 'secondary', `${RECORD}/questions`, 'built', board],
    ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', board],
    ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', board],
    ['Record tabs', 'Submissions', 'secondary', `${RECORD}/submissions`, 'built', board],
  ];
}

/** Link targets of FA-10 Settings and FA-11 Preview (FA-v1 `LINK-MAP.json`; earlier B4-06). */
export const P4_ASSESSMENT_SETTINGS_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-10 Settings: the page's one primary is the form's "Save settings" (a command).
  // Configuration only: no result-release, "Make available" or close control (T-18).
  ...pageRows('FA-10', `${RECORD}/settings`, [
    ...recordFrame('FA-v1 Main.dc.html record band and `nav.rk-tabs.fa-tabs`'),
    [
      'Error summary “Check these settings”',
      '(each link: the field it names)',
      'secondary',
      '#Es-name',
      'in-page',
      'FA-v1 Main.dc.html FA-10 `div.rk-errsum` (`#Es-err`)',
    ],
    [
      'Form foot',
      'Cancel changes',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-10 `div.fa-formfoot-l > button.rb-btn` (puts the record’s values back; state-copy `FA-10.cancel`)',
    ],
    [
      'Form foot',
      'Save settings',
      'primary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-10 `div.fa-formfoot-r > button.rb-btn--primary` (`AssessmentService.updateSettings`)',
    ],
  ]),
  // FA-11 Preview: a reading page — no primary, no command. The view switch mirrors the view
  // into the address (`?view=key`; state-copy `FA-11.view-address`).
  ...pageRows('FA-11', `${RECORD}/preview`, [
    ...recordFrame('FA-v1 Main.dc.html record band and `nav.rk-tabs.fa-tabs`'),
    [
      'Preview as',
      'Student view / Answer key',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-11 `div.fa-seg`',
    ],
    [
      'Nothing to preview yet',
      'Add questions',
      'secondary',
      `${RECORD}/questions`,
      'built',
      'FA-v1 Main.dc.html FA-11 `div.rk-state a.rb-btn`',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-11 `div.rk-state[role=alert] button.rb-btn`',
    ],
    [
      'A colleague’s preview (policy-open)',
      'Back to Summary',
      'secondary',
      RECORD,
      'built',
      'FA-v1 Main.dc.html FA-11 `div.fa-msg-act a.rb-btn`',
    ],
    [
      'A colleague’s preview (policy-open)',
      'Help',
      'secondary',
      '/faculty/help',
      'built',
      'FA-v1 Main.dc.html FA-11 `div.fa-msg-act a.rb-link` (XS-07)',
    ],
  ]),
];
