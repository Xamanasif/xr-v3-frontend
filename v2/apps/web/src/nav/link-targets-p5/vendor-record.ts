import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const LIST = '/vendor/experiments';
/** The sample’s records stand for any: SUB-0079 a draft, SUB-0081 returned. */
const DRAFT_RECORD = '/vendor/experiments/SUB-0079';
const RETURNED_RECORD = '/vendor/experiments/SUB-0081';
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const REVISE = '/vendor/experiments/SUB-0081/revise';

/**
 * Phase 5 link targets: VE-07 Experiment record and VE-13 History (B5-06; B5-08 f2, B6-12 f4).
 * One primary per state that has one: a draft’s “Edit draft” (f1) and a returned record’s “Revise
 * & resubmit” (f3, f6, f10); every other state has no action but the back link (state-copy
 * `VE-07.no-other-actions`). VE-13 is the record’s own history section (`?tab=history`, state-copy
 * `VE-13.address`): B5-06 draws no tab control, so it adds no action.
 */
export const P5_VENDOR_RECORD_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('VE-07', DRAFT_RECORD, [
    ['Back link', 'My experiments', 'secondary', LIST, 'built', 'B5-06 f0 … f10 `a.xr-back`'],
    [
      'Draft banner',
      'Edit draft',
      'primary',
      EDIT_DRAFT,
      'built',
      'B5-06 f1; B5-08 f2 `div.xr-notice-actions > a.xr-btn--primary` (the editor at the step the draft last reached, `editDraftAddress`)',
    ],
  ]),
  ...pageRows('VE-07', RETURNED_RECORD, [
    [
      'Returned block',
      'Revise & resubmit',
      'primary',
      REVISE,
      'built',
      'B5-06 f3, f6, f10 `div.xw-actions > a.xr-btn--primary` (not shown while the course is no longer assigned, state-copy `VE-07.course-withdrawn.returned`)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `VE-07.failed`, `VE-07.try-again`',
    ],
  ]),
];
