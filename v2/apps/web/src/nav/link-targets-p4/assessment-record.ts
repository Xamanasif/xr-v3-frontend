import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';
const QUESTIONS = `${RECORD}/questions`;

/**
 * The record frame on each of these tab pages (B4-05 f0, f6): the crumbs "Assessments / <name> /
 * <tab>" and the tabs Summary · Questions · Settings · Preview · Submissions (FA-12, since Phase
 * 4B).
 */
function recordFrame(board: string): PageRow[] {
  return [
    ['Top bar crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', board],
    ['Top bar crumbs', '<assessment name>', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Summary', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Questions', 'secondary', QUESTIONS, 'built', board],
    ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', board],
    ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', board],
    ['Record tabs', 'Submissions', 'secondary', `${RECORD}/submissions`, 'built', board],
  ];
}

/** Phase 4A link targets: FA-08 Summary and FA-09 Questions (B4-05). */
export const P4_ASSESSMENT_RECORD_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-08', RECORD, [
    ...recordFrame('B4-05 f0, f3, f4'),
    // f3: the one primary of a draft without questions — the Questions tab.
    ['Ready to use (no question yet)', 'Add questions', 'primary', QUESTIONS, 'built', 'B4-05 f3'],
    // Phase 4B: while a submission waits, FA-19 for the oldest (`FA-12.mark-next-target`).
    [
      'Submissions',
      'Mark next',
      'primary',
      '/faculty/marking/{attemptId}',
      'built',
      'B4-05 f0, f4 `a.xr-btn--primary` → B4-09',
    ],
    [
      'Submissions',
      'See submissions',
      'secondary',
      `${RECORD}/submissions`,
      'built',
      'B4-05 f0, f4 `a.xr-btn--secondary` → B4-06',
    ],
    [
      'Rules as set for this assessment (footer)',
      'Change settings',
      'secondary',
      `${RECORD}/settings`,
      'built',
      'B4-05 f0, f3, f4',
    ],
  ]),
  ...pageRows('FA-09', QUESTIONS, [
    ...recordFrame('B4-05 f1, f5 … f8'),
    // Opens the bank panel in place (f7); hidden while the panel is open.
    ['Toolbar', 'Add from question bank', 'primary', null, 'in-page', 'B4-05 f1, f6, f8'],
    [
      'Toolbar',
      'New question',
      'secondary',
      `/faculty/question-bank/new?experimentId={experimentId}&returnTo=${QUESTIONS}`,
      'built',
      'B4-05 f1, f6 … f8',
    ],
    [
      'Toolbar',
      'Draft with assistance',
      'secondary',
      '/faculty/question-bank/draft?experimentId={experimentId}',
      'built',
      'B4-05 f1, f6 … f8 `a.xr-btn--text` (→ B4-08 FA-16; Phase 4B)',
    ],
    [
      'Toolbar',
      'Import',
      'secondary',
      '/faculty/question-bank/import?experimentId={experimentId}',
      'built',
      'B4-05 f1, f6 … f8 `a.xr-btn--text` (→ B4-08 FA-17; Phase 4B)',
    ],
    // f1 draws the empty state's own primary beside the toolbar's.
    ['No questions yet', 'Add from question bank', 'primary', null, 'in-page', 'B4-05 f1'],
    [
      'No questions yet',
      'New question',
      'secondary',
      `/faculty/question-bank/new?experimentId={experimentId}&returnTo=${QUESTIONS}`,
      'built',
      'B4-05 f1',
    ],
    ['Question row', 'Move question <n> up', 'secondary', null, 'in-page', 'B4-05 f5 … f8'],
    ['Question row', 'Move question <n> down', 'secondary', null, 'in-page', 'B4-05 f5 … f8'],
    ['Question row', 'Remove', 'secondary', null, 'in-page', 'B4-05 f5 … f8'],
    [
      'Question row (newer version in the bank)',
      'Use updated version',
      'secondary',
      null,
      'in-page',
      'B4-05 f8',
    ],
    ['Bank panel', 'Close question bank', 'secondary', null, 'in-page', 'B4-05 f7'],
    ['Bank panel', 'Add', 'secondary', null, 'in-page', 'B4-05 f7'],
    ['Bank panel (failed to load)', 'Try again', 'secondary', null, 'in-page', 'Board 04'],
  ]),
];
