import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const ASSESSMENTS = '/student/assessments';
const INTRO = `${ASSESSMENTS}/{assessmentId}`;
const ATTEMPT = `${INTRO}/attempt`;
const RESULT = `${INTRO}/result`;
const HUB = '/student/experiments/{experimentId}';
const TAB = `${HUB}/assessment`;

/**
 * Phase 4B link targets: ST-11 Assessments, the experiment hub’s Assessment tab and Home’s “Up next”
 * assessment row (B4-11 f0 … f10). The hub’s Assessment tab is ST-05’s (its words are, too), drawn
 * as “Assessment tab · …” beside the Overview’s own rows. Home’s row is the ST-01 ledger entry
 * “Up next (an assessment)” (`link-targets.ts`).
 */
export const P4B_STUDENT_ASSESSMENTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // ST-11 Assessments (B4-11 f0 … f6): the state tabs switch the list in place (`?tab=`), each row
  // has one secondary action by its state (the board's `href`: ST-12, ST-13, ST-14).
  ...pageRows('ST-11', ASSESSMENTS, [
    [
      'State tabs',
      'To do · Submitted · Results',
      'secondary',
      null,
      'in-page',
      'B4-11 f0 … f4, f6 `div.xr-seg button[aria-pressed]` (the tab in the address, state-copy `ST-11.tabs`)',
    ],
    [
      'Row (to do)',
      'Open',
      'secondary',
      INTRO,
      'built',
      'B4-11 f0, f6 `a.xr-btn--secondary.xr-btn--sm`',
      'ST-12 Before you start (Phase 4B).',
    ],
    [
      'Row (attempt in progress)',
      'Continue attempt',
      'secondary',
      ATTEMPT,
      'built',
      'B4-11 f1 `a.xr-btn--secondary.xr-btn--sm`',
      'ST-13 the attempt (Phase 4B).',
    ],
    [
      'Row (waiting for marking, result not released yet)',
      'View',
      'secondary',
      RESULT,
      'built',
      'B4-11 f2, f3 `a.xr-btn--secondary.xr-btn--sm` (→ B4-13)',
      'ST-14 Result (Phase 4B).',
    ],
    [
      'Row (result ready)',
      'See result',
      'secondary',
      RESULT,
      'built',
      'B4-11 f4 `a.xr-btn--secondary.xr-btn--sm` (→ B4-13)',
      'ST-14 Result (Phase 4B).',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `ST-11.failed`'],
  ]),
  // The hub's Assessment tab (B4-11 f7 … f9): the strip with Assessment current, then the
  // experiment's assessment with one action — "Open assessment" the tab's primary while to do.
  ...pageRows('ST-05', TAB, [
    ['Assessment tab · hub tabs', 'Overview', 'secondary', HUB, 'built', 'B4-11 f7 … f9'],
    [
      'Assessment tab · hub tabs',
      'Resources',
      'secondary',
      `${HUB}/resources`,
      'built',
      'B4-11 f7 … f9',
    ],
    [
      'Assessment tab · hub tabs',
      'Simulation',
      'secondary',
      `${HUB}/simulation`,
      'built',
      'B4-11 f7 … f9',
    ],
    [
      'Assessment tab · hub tabs',
      'Assessment',
      'secondary',
      TAB,
      'built',
      'B4-11 f7 … f9 (`aria-current="page"`)',
    ],
    [
      'Assessment tab · hub tabs',
      'Progress',
      'secondary',
      `${HUB}/progress`,
      'built',
      'B4-11 f7 … f9',
    ],
    [
      'Assessment tab · top bar crumbs',
      'My courses · <course code> · <experiment>',
      'secondary',
      HUB,
      'built',
      'B4-11 f7 … f9 (the hub tabs’ top bar, B3-01 f0)',
    ],
    [
      'Assessment tab · row (to do)',
      'Open assessment',
      'primary',
      INTRO,
      'built',
      'B4-11 f7 `a.xr-btn--primary`',
      'ST-12 Before you start (Phase 4B).',
    ],
    [
      'Assessment tab · row (attempt in progress)',
      'Continue attempt',
      'primary',
      ATTEMPT,
      'built',
      'state-copy `ST-05.assessment-tab.states` (B4-11 f1 in the f7 row)',
      'ST-13 the attempt (Phase 4B).',
    ],
    [
      'Assessment tab · row (waiting for marking, result not released yet)',
      'View',
      'secondary',
      RESULT,
      'built',
      'B4-11 f9 `a.xr-btn--secondary` (→ B4-13); f3 in the f9 row',
      'ST-14 Result (Phase 4B).',
    ],
    [
      'Assessment tab · row (result ready)',
      'See result',
      'secondary',
      RESULT,
      'built',
      'state-copy `ST-05.assessment-tab.states` (B4-11 f4 in the f9 row)',
      'ST-14 Result (Phase 4B).',
    ],
    [
      'Assessment tab · failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `ST-05.assessment-tab.failed`',
    ],
  ]),
];
