import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const RECORD = '/faculty/assessments/{assessmentId}';
const QUESTIONS = `${RECORD}/questions`;

/**
 * The record frame on each of these tab pages (B4-05 f0, f6): the crumbs "Assessments / <name> /
 * <tab>" and the tabs Summary · Questions · Settings · Preview; "Submissions" (FA-12) is Phase 4B
 * and is not rendered (DEV-21).
 */
function recordFrame(board: string): PageRow[] {
  return [
    ['Top bar crumbs', 'Assessments', 'secondary', '/faculty/assessments', 'built', board],
    ['Top bar crumbs', '<assessment name>', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Summary', 'secondary', RECORD, 'built', board],
    ['Record tabs', 'Questions', 'secondary', QUESTIONS, 'built', board],
    ['Record tabs', 'Settings', 'secondary', `${RECORD}/settings`, 'built', board],
    ['Record tabs', 'Preview', 'secondary', `${RECORD}/preview`, 'built', board],
    [
      'Record tabs',
      'Submissions',
      'secondary',
      `${RECORD}/submissions`,
      'not-rendered',
      board,
      'FA-12 Submissions is not built (Phase 4B): the tab appears with it (DEV-21).',
    ],
  ];
}

/** Phase 4A link targets: FA-08 Summary and FA-09 Questions (B4-05). */
export const P4_ASSESSMENT_RECORD_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('FA-08', RECORD, [
    ...recordFrame('B4-05 f0, f3, f4'),
    // f3: the one primary of a draft without questions — the Questions tab.
    ['Ready to use (no question yet)', 'Add questions', 'primary', QUESTIONS, 'built', 'B4-05 f3'],
    [
      'Submissions',
      'Mark next',
      'primary',
      '/faculty/marking',
      'not-rendered',
      'B4-05 f0, f4',
      'FA-18 Marking is not built (Phase 4B): the action appears with it (DEV-21).',
    ],
    [
      'Submissions',
      'See submissions',
      'secondary',
      `${RECORD}/submissions`,
      'not-rendered',
      'B4-05 f0, f4',
      'FA-12 Submissions is not built (Phase 4B): the action appears with it (DEV-21).',
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
      '/faculty/question-bank/draft',
      'not-rendered',
      'B4-05 f1, f6 … f8',
      'FA-16 Draft questions with assistance is not built (T-23 names no provider): the action appears with it (DEV-21).',
    ],
    [
      'Toolbar',
      'Import',
      'secondary',
      '/faculty/question-bank/import',
      'not-rendered',
      'B4-05 f1, f6 … f8',
      'FA-17 Import questions is not built: the action appears with it (DEV-21).',
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
