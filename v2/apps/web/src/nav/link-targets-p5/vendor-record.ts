import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const LIST = '/vendor/experiments';
/**
 * The sample’s records stand for any: SUB-0079 a draft, SUB-0081 returned, SUB-0083 a draft whose
 * course is no longer assigned.
 */
const DRAFT_RECORD = '/vendor/experiments/SUB-0079';
const RETURNED_RECORD = '/vendor/experiments/SUB-0081';
const READ_ONLY_RECORD = '/vendor/experiments/SUB-0083';
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const REVISE = '/vendor/experiments/SUB-0081/revise';
/** Report a problem (XS-07), its “Where” filled from the page the person came from. */
const REPORT = '/vendor/help/report';

/**
 * VE-07 Experiment record and VE-13 Submission and version history, as the owner-approved Vendor
 * export links them (design/v3-refined-b/roles/VE-v1, LINK-MAP L50 … L55). One primary per state
 * that has one, in the head: a draft’s “Edit draft” and a returned record’s “Revise and resubmit”
 * (“Continue revising” once changes are saved); every other state has no action but the
 * breadcrumb and the tabs (state-copy `VE-07.no-other-actions`), and “Ask for help” while the
 * course is no longer assigned. VE-13 is the record’s second tab (`?tab=history`, state-copy
 * `VE-13.address`): its rows are the record’s.
 */
export const P5_VENDOR_RECORD_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('VE-07', DRAFT_RECORD, [
    [
      'Breadcrumb',
      'My experiments',
      'secondary',
      LIST,
      'built',
      'VE-v1 LINK-MAP L50 “Breadcrumb · My experiments” (`nav.rk-crumbs`)',
    ],
    [
      'Head (draft)',
      'Edit draft',
      'primary',
      EDIT_DRAFT,
      'built',
      'VE-v1 LINK-MAP L51 “Edit draft” → VE-09 (`div.rk-head-act > a.rb-btn--primary`; the editor at the step the draft last reached, `editDraftAddress`)',
    ],
    [
      'Tabs',
      'Details',
      'secondary',
      DRAFT_RECORD,
      'built',
      'VE-v1 LINK-MAP L55 “Tabs · Details” (`nav.rk-tabs > a.rk-tab`; focus moves to the page heading)',
    ],
    [
      'Tabs',
      'Submission and version history',
      'secondary',
      `${DRAFT_RECORD}?tab=history`,
      'built',
      'VE-v1 LINK-MAP L55 “Tabs · Submission and version history” → VE-13 (focus moves to the history heading)',
    ],
  ]),
  ...pageRows('VE-07', RETURNED_RECORD, [
    [
      'Head (returned)',
      'Revise and resubmit · Continue revising',
      'primary',
      REVISE,
      'built',
      'VE-v1 LINK-MAP L52 “Revise and resubmit / Continue revising” → VE-08 (`div.rk-head-act > a.rb-btn--primary`; not shown while the course is no longer assigned, state-copy `VE-07.course-withdrawn.returned`)',
    ],
    [
      'Returned-reason panel',
      'Revise: go to <reference>',
      'secondary',
      `${REVISE}?step=formats&field=ar.device-need`,
      'built',
      'VE-v1 LINK-MAP L53 “What it refers to · reference chips” → VE-08 at that field, focused (`button.ve-ref`; `revise?step=<step>&field=<key>` — the editor’s `reviseReferenceAddress`, no `step=` for a Course and description reference; the editor focuses the field once the reason shows)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `VE-07.failed`; the export’s failed state (VE-02 `rk-state`)',
    ],
  ]),
  ...pageRows('VE-07', READ_ONLY_RECORD, [
    [
      'Read-only notice (course no longer assigned)',
      'Ask for help',
      'secondary',
      REPORT,
      'built',
      'VE-v1 LINK-MAP L54 “Ask for help” → XS-07 report form (`div.rk-notice-act > a.rb-btn`)',
    ],
  ]),
];
