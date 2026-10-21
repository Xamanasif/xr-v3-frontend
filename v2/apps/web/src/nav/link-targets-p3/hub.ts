import type { LedgerEntry } from '../link-targets';

import { type PageRow, pageRows } from './rows';

const HUB = '/student/experiments/{experimentId}';

/** The hub's section tabs and breadcrumbs on each tab page (V3, ST-v1 `hubVM`). */
function hubTabs(board: string): PageRow[] {
  return [
    ['Section tabs', 'Overview', 'secondary', HUB, 'built', board],
    ['Section tabs', 'Resources', 'secondary', `${HUB}/resources`, 'built', board],
    ['Section tabs', 'Simulation', 'secondary', `${HUB}/simulation`, 'built', board],
    ['Section tabs', 'Progress', 'secondary', `${HUB}/progress`, 'built', board],
    [
      'Section tabs',
      'Assessment',
      'secondary',
      `${HUB}/assessment`,
      'built',
      `${board}; B4-11 f7 … f9`,
      'The hub’s Assessment tab (Phase 4B).',
    ],
    [
      'Breadcrumbs',
      'My courses · <course>',
      'secondary',
      '/student/courses/{courseId}',
      'built',
      board,
    ],
  ];
}

/** The hub's tabs ST-06 Resources, ST-07 Simulation and ST-10 Progress (V3, ST-v1 `resVM`, `simVM`, `progTabVM`). */
export const P3_HUB_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('ST-06', `${HUB}/resources`, [
    ...hubTabs('ST-v1 StudentFinal `HB.isResources`, `resVM`'),
    // Opens the answer's `href` in a new tab (`LearningService.openResource`); the row then reads
    // "Opened in a new tab just now". Stays on the page.
    ['Resource row', 'Open', 'secondary', null, 'in-page', 'ST-v1 `resVM`'],
    ['Resource row (couldn’t open)', 'Try again', 'secondary', null, 'in-page', 'ST-v1 `resVM`'],
    ['List failed', 'Try again', 'secondary', null, 'in-page', 'ST-v1 `resVM` (`RS.failed`)'],
  ]),
  ...pageRows('ST-07', `${HUB}/simulation`, [
    ...hubTabs('ST-v1 StudentFinal `HB.isSim`, `simVM`'),
    // Gold once (`fmtRows`): continue, then feedback, then open.
    [
      'Format card (the gold action)',
      'Continue <format> · Give feedback on <format> · Open <format>',
      'primary',
      `${HUB}/simulation/{format}`,
      'built',
      'ST-v1 `simVM`, `fmtRows`',
      'Give feedback opens ST-16 (`/feedback/{format}`).',
    ],
    [
      'Format card',
      'Open WEB · Continue WEB · Open VR · Continue VR',
      'secondary',
      `${HUB}/simulation/{format}`,
      'built',
      'ST-v1 `simVM`',
    ],
    [
      'Format card (completed, feedback offered)',
      'Give feedback on <format>',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      'ST-v1 `simVM`',
    ],
  ]),
  ...pageRows('ST-10', `${HUB}/progress`, [
    ...hubTabs('ST-v1 StudentFinal `HB.isPT`, `progTabVM`'),
    [
      'Format row (the gold action)',
      'Continue <format> · Give feedback on <format> · Open <format>',
      'primary',
      `${HUB}/simulation/{format}`,
      'built',
      'ST-v1 `progExp`',
      'Give feedback opens ST-16 (`/feedback/{format}`).',
    ],
    [
      'Format row',
      'Continue WEB · Open VR',
      'secondary',
      `${HUB}/simulation/{format}`,
      'built',
      'ST-v1 `progExp`',
    ],
    [
      'Completed row',
      'Give feedback on <format>',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      'ST-v1 `progExp`',
    ],
    [
      'Assessment line',
      'Open assessment · Continue attempt · See result',
      'secondary',
      '/student/assessments/{assessmentId}',
      'built',
      'ST-v1 `progExp` (`asmtLink`)',
      'Continue attempt opens ST-13 (`/attempt`), See result ST-14 (`/result`).',
    ],
  ]),
];
