import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

const FEEDBACK_PAGE = '/student/experiments/{experimentId}/feedback/{format}';

/**
 * Phase 3 link targets: ST-15 Progress, ST-16 Format feedback and ST-17 Feedback sent, in the
 * owner-approved V3 Student design (ST-v1 LINK-MAP; `progress`, `feedback`, `msg('fb-not')`).
 * ST-01's Up next "Give feedback" is its row of the main ledger (B2-10 f5 → ST-16); ST-01's "See
 * earlier work" and ST-02's "View earlier work" stay unrendered there while SACC-14 is open.
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
      'Filters',
      'Status · Course · Remove filter (chip) · Clear filters',
      'secondary',
      null,
      'in-page',
      'ST-v1 LINK-MAP · StudentFinal.dc.html `progress` (`sv-ptools`)',
      'Filters apply at once; nothing is stored (`StProgressTools`).',
    ],
    [
      'Experiment head',
      'Open experiment',
      'secondary',
      '/student/experiments/{experimentId}',
      'built',
      'ST-v1 LINK-MAP · `progExp` (`hasOpen`; → ST-05)',
      'Not while the institution is paused.',
    ],
    [
      'Format row (in progress)',
      'Continue WEB · Continue VR',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'ST-v1 LINK-MAP · `progExp` (`cont`; → ST-08 / ST-09)',
      'The page’s one gold action is the first of the chosen kind: continue, then feedback, then open.',
    ],
    [
      'Format row (not started)',
      'Open WEB · Open VR',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'ST-v1 LINK-MAP · `progExp` (`open`; → ST-08 / ST-09)',
    ],
    [
      'Format row (completed, feedback offered for that format)',
      'Give feedback on WEB · Give feedback on VR',
      'secondary',
      FEEDBACK_PAGE,
      'built',
      'ST-v1 LINK-MAP · `progExp` (`fb`; → ST-16)',
      'Only where the service’s feedback entry for that format offers it (its own completion, BC5).',
    ],
    [
      'Assessment line',
      'Open assessment · Continue attempt · See result',
      'secondary',
      '/student/assessments/{assessmentId}',
      'built',
      'ST-v1 LINK-MAP · `progExp` (`asmtLink`; → ST-12 / ST-13 / ST-14)',
      'From `listMyAssessments`; “Continue attempt” opens `…/attempt`, “See result” `…/result`.',
    ],
    ['No match', 'Clear filters', 'secondary', null, 'in-page', 'ST-v1 `progVM` (`nomatch`)'],
    [
      'Nothing yet',
      'Help & support',
      'secondary',
      '/student/help',
      'built',
      'ST-v1 `progress` (`P.nothing`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'ST-v1 `progVM` (`retry`)'],
  ]),
  ...pageRows('ST-16', FEEDBACK_PAGE, [
    [
      'Breadcrumb',
      '<experiment> · VR · WEB (the format)',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'ST-v1 LINK-MAP · `fbVM` (`crumbExp` → ST-05, `crumbFmt` → ST-08 / ST-09)',
      'The experiment crumb opens the hub; the format crumb its page.',
    ],
    [
      'Error summary',
      'Choose a rating for statement <n>',
      'secondary',
      '#feedback-q<n>',
      'in-page',
      'ST-v1 `fbVM` (`errList`)',
      'Moves focus to that statement’s first radio (or its chosen one).',
    ],
    [
      'Rating sheet',
      'Submit feedback',
      'primary',
      null,
      'in-page',
      'ST-v1 `fbVM` (`submit`)',
      'FeedbackService.sendFeedback; the sent record (ST-17) replaces the sheet and the H1 takes focus.',
    ],
    [
      'Rating sheet',
      'Cancel',
      'secondary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'ST-v1 LINK-MAP · `fbVM` (`crumbFmt` → ST-08 / ST-09)',
    ],
    [
      'Not open yet (the format not completed)',
      'Back to WEB · Back to VR',
      'primary',
      '/student/experiments/{experimentId}/simulation/{format}',
      'built',
      'ST-v1 LINK-MAP · `msg(fb-not)` (→ ST-08 / ST-09)',
      'State-copy `ST-16.not-eligible`: only for a given format not completed, nothing holding it.',
    ],
  ]),
  ...pageRows('ST-17', FEEDBACK_PAGE, [
    [
      'Feedback sent',
      'Back to experiment',
      'primary',
      '/student/experiments/{experimentId}',
      'built',
      'ST-v1 LINK-MAP · `fbVM` sent (→ ST-05)',
    ],
    [
      'Feedback sent',
      'See your progress',
      'secondary',
      '/student/progress',
      'built',
      'ST-v1 LINK-MAP · `fbVM` sent (→ ST-15)',
    ],
  ]),
];
