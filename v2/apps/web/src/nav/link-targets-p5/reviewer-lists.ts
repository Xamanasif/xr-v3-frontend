import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/reviewer';
const QUEUE = '/reviewer/queue';
const REVIEWED = '/reviewer/reviewed';
/** RV-03 (and RV-06 once decided): the sample’s SUB-0086 stands for any submission. */
const SUBMISSION = '/reviewer/submissions/SUB-0086';
/** RV-06, the decided page, from Reviewed by me: the sample’s SUB-0081. */
const DECIDED = '/reviewer/submissions/SUB-0081';
/** RV-04 Review an update (`/reviewer/updates/[updateId]`, screens.json): not built, Phase 6. */
const UPDATE = '/reviewer/updates/UPD-0005';
const DECIDED_UPDATE = '/reviewer/updates/UPD-0004';

const RV_04_NOT_BUILT =
  'RV-04 Review an update is not built (Phase 6): the row is drawn without its action (DEV-21; state-copy';

/**
 * Phase 5 link targets: RV-01 Overview, RV-02 Review queue and RV-05 Reviewed by me (B6-01,
 * B6-02). RV-01’s one primary is “Review the oldest — <name>” (the oldest submission or re-check,
 * state-copy `RV-01.oldest`); RV-02 draws a primary “Review” on every row, one per drawn row kind;
 * RV-05 has none. Every update action opens RV-04, which is Phase 6: not rendered.
 */
export const P5_REVIEWER_LISTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // RV-01 Overview (B6-01 f0 … f2).
  ...pageRows('RV-01', OVERVIEW, [
    [
      'Actions',
      'Review the oldest — <name>',
      'primary',
      SUBMISSION,
      'built',
      'B6-01 f0, f2 `div.xw-actions > a.xr-btn--primary` (the oldest submission or re-check; state-copy `RV-01.oldest`)',
    ],
    [
      'Actions',
      'Open the review queue',
      'secondary',
      QUEUE,
      'built',
      'B6-01 f0, f2 `div.xw-actions > a.xr-btn--secondary`',
    ],
    [
      'Waiting row (new submission, re-check)',
      'Review',
      'secondary',
      SUBMISSION,
      'built',
      'B6-01 f0, f2 `li.xr-row > a.xr-btn--secondary.xr-btn--sm` (named “Review <name>”)',
    ],
    [
      'Waiting row (update)',
      'Review update',
      'secondary',
      UPDATE,
      'not-rendered',
      'B6-01 f0, f2 `li.xr-row > a.xr-btn--secondary.xr-btn--sm` (named “Review update <name>”)',
      `${RV_04_NOT_BUILT} RV-01.update-row).`,
    ],
    [
      'Nothing waiting',
      'Open Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'B6-01 f1 `div.xr-empty a.xr-btn--secondary`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-01.failed`'],
  ]),
  // RV-02 Review queue (B6-02 f0, f2 … f5; B6-11 f13, f14; B6-12 f0).
  ...pageRows('RV-02', QUEUE, [
    [
      'Toolbar',
      'Search the queue / Type / Course',
      'secondary',
      null,
      'in-page',
      'B6-02 f0, f5 `div.xr-toolbar` (the address mirrors `?type=`; state-copy `RV-02.filters`)',
    ],
    [
      'Toolbar status',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'B6-02 script `qFiltered` (`div.xr-toolbar-status > button.xr-btn--text`)',
    ],
    [
      'Queue row (new submission, re-check)',
      'Review',
      'primary',
      SUBMISSION,
      'built',
      'B6-02 f0, f5; B6-12 f0 `a.xr-btn--primary.xr-btn--sm` (named “Review <name>”)',
    ],
    [
      'Queue row (update)',
      'Review',
      'primary',
      UPDATE,
      'not-rendered',
      'B6-02 f0, f5 `a.xr-btn--primary.xr-btn--sm` on the UPD-0005 row',
      `${RV_04_NOT_BUILT} RV-02.update-row).`,
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'B6-02 script `qNoMatch` (`div.xr-empty button.xr-btn--secondary`)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B6-02 f3; B6-11 f13 `button.xr-btn--primary` (focus returns to the section heading)',
    ],
    [
      'Nothing waiting',
      'Open Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'B6-02 f4; B6-11 f14 `div.xr-empty a.xr-btn--secondary`',
    ],
  ]),
  // RV-05 Reviewed by me (B6-02 f1).
  ...pageRows('RV-05', REVIEWED, [
    [
      'Toolbar',
      'Show',
      'secondary',
      null,
      'in-page',
      'B6-02 f1 `div.xr-toolbar select#Qr-f` (Everything I decided · New submissions · Updates)',
    ],
    [
      'Decision row (submission)',
      'Open',
      'secondary',
      DECIDED,
      'built',
      'B6-02 f1 `a.xr-btn--secondary.xr-btn--sm` (named “Open <name>”; RV-06, the decided page)',
    ],
    [
      'Decision row (update)',
      'Open',
      'secondary',
      DECIDED_UPDATE,
      'not-rendered',
      'B6-02 f1 `a.xr-btn--secondary.xr-btn--sm` on the UPD rows',
      `${RV_04_NOT_BUILT} RV-05.update-row).`,
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-05.failed`'],
  ]),
];
