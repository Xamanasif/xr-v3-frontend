import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/content-manager';
const READY = '/content-manager/ready';
const LIBRARY = '/content-manager/library';
const COURSE_CODES = '/content-manager/course-codes';
/** CM-03, by submission id: the sample’s ready, re-check and returned records stand for any. */
const DECISION_READY = '/content-manager/decisions/SUB-0074';
const DECISION_NEXT = '/content-manager/decisions/SUB-0070';
const DECISION_RECHECK = '/content-manager/decisions/SUB-0071';
const DECISION_RETURNED = '/content-manager/decisions/SUB-0081';
/** CM-05, by experiment id. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** CM-08, a correction’s page (Phase 6): the sample’s returned UPD-0006 and on-hold UPD-0004. */
const UPDATE = '/content-manager/updates/UPD-0006';
const UPDATE_WITH_OTHERS = '/content-manager/updates/UPD-0004';

/**
 * Phase 5 link targets: CM-01 Overview, CM-02 Ready to publish, CM-04 Content library and CM-09
 * Course codes (B6-05, B6-06, B6-10; B6-11 f12; B6-12 f2). CM-01’s one primary is “Open the next
 * ready item” (the oldest approval); CM-02 draws its “Open decision” as each row’s primary; CM-09’s
 * is “Save codes” (a command). The correction rows’ actions open the correction’s page (CM-08,
 * built in Phase 6; state-copy `CM-01.row-actions`).
 */
export const P5_CM_LISTS_LINK_TARGETS: readonly LedgerEntry[] = [
  // CM-01 Overview (B6-05 f0 … f2).
  ...pageRows('CM-01', OVERVIEW, [
    [
      'Header',
      'Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-05 f0, f1, f2 `div.xr-phead-actions > a.xr-btn--secondary` (with the Content library icon)',
    ],
    [
      'Needs your decision (the oldest ready item)',
      'Open the next ready item',
      'primary',
      DECISION_READY,
      'built',
      'B6-05 f0, f2 `a.xr-btn--primary.xr-btn--sm` (“… · oldest of 2”; `D.links.cdec`)',
    ],
    [
      'Needs your decision (every other ready item)',
      'Open decision',
      'secondary',
      DECISION_NEXT,
      'built',
      'B6-05 f0, f2 `a.xr-btn--secondary.xr-btn--sm` (named “Open decision for <name>”)',
    ],
    [
      'Needs your decision (a returned correction)',
      'Open update',
      'secondary',
      UPDATE,
      'built',
      'B6-05 f0, f2 `a.xr-btn--secondary.xr-btn--sm` (`D.links.cupd`; the returned correction, CM-08)',
    ],
    [
      'With others (a re-check with the Academic Reviewer)',
      'Open',
      'secondary',
      DECISION_RECHECK,
      'built',
      'B6-05 f0, f2 `a.xr-btn--text.xr-btn--sm` (the script’s re-check row: `D.links.cdec`; CM-03 read-only, B6-07 f3; named “Open <name>”)',
    ],
    [
      'With others (a correction in academic review, awaiting release or on hold)',
      'Open',
      'secondary',
      UPDATE_WITH_OTHERS,
      'built',
      'B6-05 f0, f2 `a.xr-btn--text.xr-btn--sm` (`D.links.cupd`; named “Open <name>”; the correction, CM-08)',
    ],
    [
      'Nothing waiting',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-05 f1 `div.xr-empty a.xr-btn--secondary`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-01.failed`'],
  ]),
  // CM-02 Ready to publish (B6-06 f0, f2, f3; B6-12 f2).
  ...pageRows('CM-02', READY, [
    [
      'Approved row',
      'Open decision',
      'primary',
      DECISION_READY,
      'built',
      'B6-06 f0, f2; B6-12 f2 `a.xr-btn--primary.xr-btn--sm` (each row’s; named “Open decision for <name>”)',
    ],
    [
      'Empty',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-06 f3 `div.xr-empty a.xr-btn--secondary`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-02.failed`'],
  ]),
  // CM-04 Content library (B6-06 f1, f4).
  ...pageRows('CM-04', LIBRARY, [
    [
      'Status tabs',
      'Ready · In review · With vendor · Published',
      'secondary',
      null,
      'in-page',
      'B6-06 f1, f4 `div.xr-tabs[role=tablist] > button.xr-tab` (the address mirrors `?tab=`; state-copy `CM-04.address`)',
    ],
    [
      'Toolbar',
      'Search the library',
      'secondary',
      null,
      'in-page',
      'B6-06 f1, f4 `input#Kl-lq[type=search]` (“Name, ID or course”)',
    ],
    [
      'Toolbar status',
      'Clear search',
      'secondary',
      null,
      'in-page',
      'B6-06 script `lClear` `button.xr-btn--text` (while a search is applied)',
    ],
    [
      'Ready row',
      'Open decision',
      'secondary',
      DECISION_READY,
      'built',
      'B6-06 f1 `a.xr-btn--secondary.xr-btn--sm` (named “Open decision for <name>”)',
    ],
    [
      'In review row',
      'Open',
      'secondary',
      DECISION_RECHECK,
      'built',
      'B6-06 script `D.links.cdec` (CM-03 read-only while in academic review, B6-07 f3; named “Open <name>”)',
    ],
    [
      'With vendor row',
      'Open',
      'secondary',
      DECISION_RETURNED,
      'built',
      'B6-06 script `D.links.cdec` (CM-03 read-only; named “Open <name>”)',
    ],
    [
      'Published row',
      'Open',
      'secondary',
      PUBLISHED,
      'built',
      'B6-06 f4 `a.xr-btn--secondary.xr-btn--sm` (`D.links.cpub`; named “Open <name>”)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-04.failed`'],
  ]),
  // CM-09 Course codes (B6-10 f0 … f2; B6-11 f12).
  ...pageRows('CM-09', COURSE_CODES, [
    [
      'Footer',
      'Save codes',
      'primary',
      null,
      'in-page',
      'B6-10 f0 … f2 `div.xw-flow-foot button.xr-btn--primary` (“Codes saved · …”, or B6-11 f12 “Check the codes”)',
    ],
    [
      'Footer',
      'Undo changes',
      'secondary',
      null,
      'in-page',
      'B6-10 f1; B6-11 f12 `button.xr-btn--text` (while a code is changed)',
    ],
    [
      'Check the codes',
      '<code> is already the code for <course>. Each course needs its own code.',
      'secondary',
      '#cc-code-5',
      'in-page',
      'B6-11 f12 `div.xw-errsum li > a` (moves focus to the row’s field)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-09.failed`'],
  ]),
];
