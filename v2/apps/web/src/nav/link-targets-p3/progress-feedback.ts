import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

const FEEDBACK_PAGE = '/student/experiments/{experimentId}/feedback/{format}';

/**
 * Phase 3 link targets: ST-15 Progress, ST-16 Format feedback and ST-17 Feedback sent, with the
 * ST-01 / ST-02 actions they enable (B3-05, B3-06). ST-01's Up next "Give feedback" is its row of
 * the main ledger (B2-10 f5 → B3-06, the frozen Batch-2 link B3-00 names); ST-01's "See earlier
 * work" and ST-02's "View earlier work" stay unrendered there while SACC-14 is open.
 */
export const P3_PROGRESS_FEEDBACK_LINK_TARGETS: readonly LedgerEntry[] = [
  {
    screen: 'Shell',
    where: 'Sidebar destination (Student only)',
    action: 'Progress',
    role: 'secondary',
    on: '/student/*',
    target: '/student/progress',
    outcome: 'built',
    board: '06 (Student raw[]); B3-05 f0 (`aria-current="page"`)',
    note: 'ST-15 (Phase 3).',
  },
  ...pageRows('ST-15', '/student/progress', [
    [
      'Toolbar',
      'Status · Course · Remove (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'B3-05 f0, f3',
      'Filters apply at once; nothing is stored (`ProgressToolbar`).',
    ],
    [
      'Experiment',
      '<experiment name>',
      'secondary',
      '/student/experiments/{experimentId}',
      'built',
      'B3-05 f0, f2, f9 (`h3.xl-exp-title a` → B2-12 ST-05)',
    ],
    [
      'Format line (WEB in progress)',
      'Continue WEB',
      'secondary',
      '/student/experiments/{experimentId}/simulation/web',
      'built',
      'B3-05 f1 (→ B3-03 ST-08)',
    ],
    [
      'Format line (WEB not started)',
      'Open WEB',
      'secondary',
      '/student/experiments/{experimentId}/simulation/web',
      'built',
      'B3-02 f0 words (→ B3-03 ST-08; state-copy `ST-15.actions`)',
    ],
    [
      'Format line (AR · VR · MR not completed)',
      'Open VR',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'B3-05 f0, f1 (→ B3-04 ST-09)',
    ],
    [
      'Format line (completed, feedback offered for that format)',
      'Give feedback on WEB · Give feedback on VR',
      'secondary',
      FEEDBACK_PAGE,
      'built',
      'B3-05 f0, f9 (→ B3-06 ST-16)',
      'Only where the service’s feedback entry for that format offers it (its own completion, BC5).',
    ],
    ['Experiment', 'Show details', 'secondary', null, 'in-page', 'B3-05 f0 (`details.xl-more`)'],
    ['No match', 'Clear filters', 'secondary', null, 'in-page', 'B3-05 f3'],
    ['Nothing yet', 'Help', 'secondary', '/student/help', 'built', 'B3-05 f4'],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B3-05 f8'],
  ]),
  ...pageRows('ST-16', FEEDBACK_PAGE, [
    [
      'Back link',
      'VR · WEB (the format)',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'B3-06 f0 (“VR” → B3-04 ST-09), f3 (“WEB” → B3-03 ST-08)',
    ],
    [
      'Error summary',
      'Choose a rating for statement <n>',
      'secondary',
      '#feedback-q<n>',
      'in-page',
      'B3-06 f1',
      'Moves focus to that statement’s scale.',
    ],
    [
      'Form',
      'Submit feedback',
      'primary',
      null,
      'in-page',
      'B3-06 f0, f1, f2, f6',
      'FeedbackService.sendFeedback; the sent record (ST-17) replaces the form and takes focus.',
    ],
    [
      'Form',
      'Cancel',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'B3-06 f0 (→ B3-04 ST-09)',
    ],
  ]),
  ...pageRows('ST-17', FEEDBACK_PAGE, [
    [
      'Feedback sent',
      'Back to experiment',
      'primary',
      '/student/experiments/{experimentId}',
      'built',
      'B3-06 f3, f4 (→ B2-12 ST-05)',
    ],
    [
      'Feedback sent',
      'See your progress',
      'secondary',
      '/student/progress',
      'built',
      'B3-06 f3, f4 (→ B3-05 ST-15)',
    ],
  ]),
];
