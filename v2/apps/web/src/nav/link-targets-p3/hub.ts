import type { LedgerEntry } from '../link-targets';

import { type PageRow, pageRows } from './rows';

const HUB = '/student/experiments/{experimentId}';

/**
 * The hub's tab strip on each tab page (B3-01 f0, f8; B3-02 f0): Overview · Resources ·
 * Simulation · Assessment · Progress — the Assessment tab since Phase 4B (B4-11 f7 … f9).
 */
function hubTabs(board: string): PageRow[] {
  return [
    ['Hub tabs', 'Overview', 'secondary', HUB, 'built', board],
    ['Hub tabs', 'Resources', 'secondary', `${HUB}/resources`, 'built', board],
    ['Hub tabs', 'Simulation', 'secondary', `${HUB}/simulation`, 'built', board],
    ['Hub tabs', 'Progress', 'secondary', `${HUB}/progress`, 'built', board],
    [
      'Hub tabs',
      'Assessment',
      'secondary',
      `${HUB}/assessment`,
      'built',
      `${board}; B4-11 f7 … f9`,
      'The hub’s Assessment tab (Phase 4B).',
    ],
    [
      'Top bar crumbs',
      'My courses · <course code> · <experiment>',
      'secondary',
      HUB,
      'built',
      board,
    ],
  ];
}

/** Phase 3 link targets: ST-05 tab strip and next steps, ST-06 Resources, ST-07 Simulation, ST-10 Progress for this experiment (B3-01, B3-02). */
export const P3_HUB_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('ST-06', `${HUB}/resources`, [
    ...hubTabs('B3-01 f0 … f7'),
    // Opens the answer's `href` in a new tab (`LearningService.openResource`); the row then reads
    // "Opened in a new tab just now". Stays on the page.
    ['Resource row', 'Open', 'secondary', null, 'in-page', 'B3-01 f0, f2, f7'],
    ['Resource row (couldn’t open)', 'Try again', 'secondary', null, 'in-page', 'B3-01 f1'],
    ['List failed', 'Try again', 'primary', null, 'in-page', 'B3-01 f5'],
  ]),
  ...pageRows('ST-07', `${HUB}/simulation`, [
    ...hubTabs('B3-02 f0 … f7'),
    // The page's one primary while WEB is not completed (`ST-07.primary`).
    [
      'WEB row',
      'Open WEB · Continue WEB',
      'primary',
      `${HUB}/simulation/web`,
      'built',
      'B3-02 f0, f1; B3-12 f0',
    ],
    [
      'WEB row (completed)',
      'Open WEB',
      'secondary',
      `${HUB}/simulation/web`,
      'built',
      'B3-02 f2, f3, f7',
    ],
    ['VR row', 'Open VR', 'secondary', `${HUB}/simulation/{format}`, 'built', 'B3-02 f0 … f3, f7'],
    [
      'Completed row',
      'Give feedback on <format>',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      'B3-02 f2, f7',
    ],
  ]),
  ...pageRows('ST-10', `${HUB}/progress`, [
    ...hubTabs('B3-01 f8 … f12'),
    ['Format row', 'Continue WEB', 'secondary', `${HUB}/simulation/web`, 'built', 'B3-01 f9'],
    ['Format row', 'Open VR', 'secondary', `${HUB}/simulation/{format}`, 'built', 'B3-01 f8'],
    [
      'Completed row',
      'Give feedback on <format>',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      'B3-01 f8, f12',
    ],
  ]),
];
