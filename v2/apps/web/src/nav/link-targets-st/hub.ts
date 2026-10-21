import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/**
 * The ledger parts of the Student's hub group kept here, by screen. ST-06, ST-07 and ST-10 are
 * `link-targets-p3/hub.ts`; ST-08 and ST-09 are `link-targets-p3/formats.ts`.
 */
export type StHubLedgerPart = 'ST-05';

/**
 * Link targets of the experiment hub's Overview, ST-05 (the hub group, ST-ANALYSIS §5). Moved
 * verbatim from `link-targets.ts` (Package 2A, Phase 3, Phase 4B) at the Student V3 settlement;
 * `link-targets.ts` spreads it in the ledger's order. The Assessment tab's rows are the assess
 * group's (`link-targets-p4b/student-assessments.ts`).
 */
const HUB = '/student/experiments/{experimentId}';
const BASIS = 'ST-v1 StudentFinal `HB.isOverview`, `overviewVM`';
const ASSESSMENT = '/student/assessments/{assessmentId}';

export const ST_HUB_LINK_TARGETS: Readonly<Record<StHubLedgerPart, readonly LedgerEntry[]>> = {
  'ST-05': pageRows('ST-05', HUB, [
    // V3 (ST-v1): the five section tabs, the breadcrumbs, the format rows' actions, Learning
    // resources and Assessment in the aside. The experiment's next step (`next-step.ts`) carries
    // the "Next step" tag and the page's one gold action: one of the primary rows below at a time.
    ['Section tabs', 'Overview', 'secondary', HUB, 'built', `${BASIS} (\`aria-current="page"\`)`],
    ['Section tabs', 'Resources', 'secondary', `${HUB}/resources`, 'built', BASIS],
    ['Section tabs', 'Simulation', 'secondary', `${HUB}/simulation`, 'built', BASIS],
    ['Section tabs', 'Progress', 'secondary', `${HUB}/progress`, 'built', BASIS],
    [
      'Section tabs',
      'Assessment',
      'secondary',
      `${HUB}/assessment`,
      'built',
      `${BASIS}; B4-11 f7 … f9`,
    ],
    ['Breadcrumbs', 'My courses', 'secondary', '/student/courses', 'built', BASIS],
    ['Breadcrumbs', '<course>', 'secondary', '/student/courses/{courseId}', 'built', BASIS],
    [
      'Learning resources (the next step)',
      'Open resources',
      'primary',
      `${HUB}/resources`,
      'built',
      BASIS,
      'Gold while nothing is started and nothing opened; otherwise the secondary row below.',
    ],
    ['Learning resources', 'Open resources', 'secondary', `${HUB}/resources`, 'built', BASIS],
    [
      'Your formats (the next step)',
      'Continue WEB · Open VR · Open <format> · Give feedback on <format>',
      'primary',
      `${HUB}/simulation/{format}`,
      'built',
      BASIS,
      'The row whose action is the next step (`nextStep`): a format in progress, a completed format whose feedback is offered (to ST-16), the first format to open when "choose a format" is next, or a format not started yet.',
    ],
    [
      'Your formats',
      'Continue WEB · Open VR · Open <format>',
      'secondary',
      `${HUB}/simulation/{format}`,
      'built',
      BASIS,
    ],
    [
      'Your formats (completed, feedback offered)',
      'Give feedback on <format>',
      'secondary',
      `${HUB}/feedback/{format}`,
      'built',
      BASIS,
    ],
    [
      'Assessment (the next step)',
      'Open assessment · Continue attempt',
      'primary',
      ASSESSMENT,
      'built',
      BASIS,
      'To do opens ST-12; an attempt in progress opens ST-13 (`/attempt`).',
    ],
    [
      'Assessment',
      'Open assessment · Continue attempt · View · See result',
      'secondary',
      ASSESSMENT,
      'built',
      BASIS,
      'View and See result open ST-14 (`/result`).',
    ],
  ]),
};
