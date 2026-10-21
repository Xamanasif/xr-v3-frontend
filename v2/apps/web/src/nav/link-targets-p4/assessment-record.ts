import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';
const QUESTIONS = `${RECORD}/questions`;

/**
 * The record frame on each of these tab pages (FA-v1 `Main.dc.html` "FA-08…FA-12 Assessment
 * record"): the crumbs "Assessments › <name>", the record band's waiting link (to Marking for
 * this assessment, while a written answer waits) and the record tabs Summary · Questions ·
 * Settings · Preview · Submissions.
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
      `${board}; \`a.rb-link.fa-rec-wait\``,
    ],
    ['Record tabs', 'Summary', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Questions', 'secondary', QUESTIONS, 'built', board],
    ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', board],
    ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', board],
    ['Record tabs', 'Submissions', 'secondary', `${RECORD}/submissions`, 'built', board],
  ];
}

/** Link targets of FA-08 Summary and FA-09 Questions (FA-v1 `LINK-MAP.json`; earlier B4-05). */
export const P4_ASSESSMENT_RECORD_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-08', RECORD, [
    ...recordFrame('FA-v1 Main.dc.html record band and `nav.rk-tabs.fa-tabs`'),
    // The one primary of a draft without questions — the Questions tab.
    [
      'Draft — not ready (no question yet)',
      'Add questions',
      'primary',
      QUESTIONS,
      'built',
      'FA-v1 Main.dc.html FA-08 `div.fa-actions > a.rb-btn--primary`',
    ],
    // While a written answer waits, FA-19 for the oldest (`FA-08.mark-next`).
    [
      'Submissions panel',
      'Mark next',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'FA-v1 LINK-MAP FA-08 “Mark next” (`a.rb-btn--primary.rk-go` → FA-19)',
    ],
    [
      'Submissions panel',
      'See submissions',
      'secondary',
      `${RECORD}/submissions`,
      'built',
      'FA-v1 Main.dc.html FA-08 `div.rk-panel-body > a.rb-btn` → FA-12',
    ],
    [
      'Rules as set for this assessment',
      'Change settings',
      'secondary',
      `${RECORD}/settings`,
      'built',
      'FA-v1 Main.dc.html FA-08 `div.rk-sec-h > a.rb-link`',
    ],
  ]),
  ...pageRows('FA-09', QUESTIONS, [
    ...recordFrame('FA-v1 Main.dc.html record band and `nav.rk-tabs.fa-tabs`'),
    // Opens the bank panel in place; hidden while the panel is open. The export draws it as a
    // plain button: FA-09 has no gold primary.
    [
      'Questions head',
      'Add from question bank',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-09 `button#fa-aq-open.rb-btn`',
    ],
    [
      'Questions head',
      'New question',
      'secondary',
      `/faculty/question-bank/new?experimentId={experimentId}&returnTo=${QUESTIONS}`,
      'built',
      'FA-v1 Main.dc.html FA-09 `div.fa-qadd > a.rb-btn`',
    ],
    [
      'Questions head',
      'Draft with assistance',
      'secondary',
      '/faculty/question-bank/draft?experimentId={experimentId}',
      'built',
      'FA-v1 Main.dc.html FA-09 `p.fa-qmore > a.rb-link` (→ FA-16)',
    ],
    [
      'Questions head',
      'Import',
      'secondary',
      '/faculty/question-bank/import?experimentId={experimentId}',
      'built',
      'FA-v1 Main.dc.html FA-09 `p.fa-qmore > a.rb-link` (→ FA-17)',
    ],
    [
      'Back from New question',
      'Add this question to the assessment',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-09 `div.rk-notice-act > button.rb-btn` (`AQ.offer`)',
    ],
    ['Question row', 'Move question <n> up', 'secondary', null, 'in-page', 'FA-v1 `fa-iconbtn`'],
    ['Question row', 'Move question <n> down', 'secondary', null, 'in-page', 'FA-v1 `fa-iconbtn`'],
    ['Question row', 'Remove', 'secondary', null, 'in-page', 'FA-v1 `button.rb-btn--ghost`'],
    [
      'Question row (newer version in the bank)',
      'Use updated version',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-09 `p.fa-qnote > button.rb-btn`',
    ],
    [
      'Bank panel',
      'Close question bank',
      'secondary',
      null,
      'in-page',
      'FA-v1 `button.fa-panel-x`',
    ],
    ['Bank panel', 'Add', 'secondary', null, 'in-page', 'FA-v1 `ul.fa-avail--panel button.rb-btn`'],
    ['Bank panel (failed to load)', 'Try again', 'secondary', null, 'in-page', 'Board 04'],
  ]),
];
