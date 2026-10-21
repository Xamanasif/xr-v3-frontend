import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const ASSESSMENTS = '/student/assessments';
const INTRO = `${ASSESSMENTS}/{assessmentId}`;
const ATTEMPT = `${INTRO}/attempt`;
const RESULT = `${INTRO}/result`;
const HUB = '/student/experiments/{experimentId}';
const TAB = `${HUB}/assessment`;

/**
 * Phase 4B link targets, V3 (ST-v1): ST-11 Assessments, the experiment hub’s Assessment tab and
 * Home’s “Up next” assessment row (B4-11 f0 … f10). The hub’s Assessment tab is ST-05’s (its words are, too), drawn
 * as “Assessment tab · …” beside the Overview’s own rows. Home’s row is the ST-01 ledger entry
 * “Up next (an assessment)” (`link-targets.ts`).
 */
export const P4B_STUDENT_ASSESSMENTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // ST-11 Assessments (V3: ST-v1 `is.alist`, LINK-MAP 11-*): the state tabs are links kept on the
  // page (the address replaced, `?tab=`); each row has one action by its state — the gold primary
  // while it can be answered (the export's `btnCls`), a plain button otherwise.
  ...pageRows('ST-11', ASSESSMENTS, [
    [
      'State tabs',
      'To do · Submitted · Results',
      'secondary',
      null,
      'in-page',
      'ST-v1 LINK-MAP 11-assess, 11sub-assess, 11res-assess `nav.rk-tabs.sv-tabs a.rk-tab` (the tab in the address, replaced; state-copy `ST-11.tabs`)',
    ],
    [
      'Row (to do)',
      'Open',
      'secondary',
      INTRO,
      'built',
      'ST-v1 LINK-MAP 11-assess “Open, <assessment>” `a.rb-btn.rb-btn--primary` (one per row, `alistVM`)',
      'ST-12 Before you start.',
    ],
    [
      'Row (attempt in progress)',
      'Continue attempt',
      'secondary',
      ATTEMPT,
      'built',
      'ST-v1 LINK-MAP 11-inprog “Continue attempt, <assessment>” `a.rb-btn.rb-btn--primary`',
      'ST-13 the attempt.',
    ],
    [
      'Row (waiting for marking, result not released yet)',
      'View',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 11sub-waitmark “View, <assessment>” `a.rb-btn`',
      'ST-14 Result.',
    ],
    [
      'Row (result ready)',
      'See result',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 11res-released “See result, <assessment>” `a.rb-btn`',
      'ST-14 Result.',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'ST-v1 `AL.failed` `div.sv-pstate button.rb-btn` (state-copy `ST-11.failed`)',
    ],
  ]),
  // The hub's Assessment tab (B4-11 f7 … f9): the section tabs with Assessment current, then the
  // experiment's assessment with one action — "Open assessment" the tab's primary while to do.
  ...pageRows('ST-05', TAB, [
    // V3 (ST-v1 `hubVM`): the hub's five section tabs and its breadcrumbs, as on the Overview.
    [
      'Assessment tab · section tabs',
      'Overview',
      'secondary',
      HUB,
      'built',
      'ST-v1 `hubVM`; B4-11 f7 … f9',
    ],
    [
      'Assessment tab · section tabs',
      'Resources',
      'secondary',
      `${HUB}/resources`,
      'built',
      'ST-v1 `hubVM`',
    ],
    [
      'Assessment tab · section tabs',
      'Simulation',
      'secondary',
      `${HUB}/simulation`,
      'built',
      'ST-v1 `hubVM`',
    ],
    [
      'Assessment tab · section tabs',
      'Assessment',
      'secondary',
      TAB,
      'built',
      'ST-v1 `hubVM` (`aria-current="page"`)',
    ],
    [
      'Assessment tab · section tabs',
      'Progress',
      'secondary',
      `${HUB}/progress`,
      'built',
      'ST-v1 `hubVM`',
    ],
    [
      'Assessment tab · breadcrumbs',
      'My courses',
      'secondary',
      '/student/courses',
      'built',
      'ST-v1 `hubVM`',
    ],
    [
      'Assessment tab · breadcrumbs',
      '<course>',
      'secondary',
      '/student/courses/{courseId}',
      'built',
      'ST-v1 `hubVM`',
    ],
    [
      'Assessment tab · card (to do)',
      'Open assessment',
      'primary',
      INTRO,
      'built',
      'ST-v1 LINK-MAP 05as-assess “Open assessment, <assessment>” `div.sv-atab-act a.rb-btn.rb-btn--primary`',
      'ST-12 Before you start.',
    ],
    [
      'Assessment tab · card (attempt in progress)',
      'Continue attempt',
      'primary',
      ATTEMPT,
      'built',
      'ST-v1 LINK-MAP 05as-inprog “Continue attempt, <assessment>” `a.rb-btn.rb-btn--primary`',
      'ST-13 the attempt.',
    ],
    [
      'Assessment tab · card (waiting for marking, result not released yet)',
      'View',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 05as-waitmark, 05as-notrel “View, <assessment>” `a.rb-btn`',
      'ST-14 Result.',
    ],
    [
      'Assessment tab · card (result ready)',
      'See result',
      'secondary',
      RESULT,
      'built',
      'ST-v1 LINK-MAP 05as-released “See result, <assessment>” `a.rb-btn`',
      'ST-14 Result.',
    ],
    [
      'Assessment tab · failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `ST-05.assessment-tab.failed` (`section.sv-msg button.rb-btn.sv-msg-btn`)',
    ],
  ]),
];
