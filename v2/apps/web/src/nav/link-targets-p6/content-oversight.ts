import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const OVERVIEW = '/admin';
const ALL_CONTENT = '/admin/content/all';
const UPDATES = '/admin/content/updates';
/** SA-13, by record id: the stuck SUB-0085 (every fixture world) stands for any submission. */
const STUCK_RECORD = '/admin/content/records/SUB-0085';
/** SA-13 of an experiment published without a submission: Distillation Column (UPD-0005 waiting). */
const PUBLISHED_RECORD = '/admin/content/records/distillation-column';
/** SA-13 of an experiment whose correction is on hold (UPD-0004). */
const HELD_RECORD = '/admin/content/records/boiler-drum-level';

/**
 * Phase 6 link targets: SA-01 Overview in full (B7-01 f0 … f3; B7-10 f15), SA-12 Content › All
 * content (B7-06 f0, f7) and SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6). SA-01 and
 * SA-12 draw no primary action: every Overview row opens the page where its item is handled
 * (routes.json SA-01) and every All content row opens its record. SA-13's one primary is “Open the
 * release decision” on a published record whose correction waits for her (B7-06 f2, SA-11); the
 * override's “Move status” is DL-2's confirm (a command). Nothing here says “Publish”.
 */
export const P6_CONTENT_OVERSIGHT_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-01 Overview (B7-01 f0, f3): the seven groups Phase 6 adds — each "Open <list>" and its
  // rows' action. The Requests group's two rows and "Try again" are Package 1D's (`link-targets.ts`).
  ...pageRows('SA-01', OVERVIEW, [
    [
      'Corrections group head',
      'Open Updates',
      'secondary',
      UPDATES,
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-05)',
    ],
    [
      'Each correction row',
      'Review',
      'secondary',
      '/admin/content/updates/UPD-0005',
      'built',
      'B7-01 f0; routes.json SA-01 (UPD → /admin/content/updates/[updateId], SA-11)',
    ],
    [
      'Device transfers group head',
      'Open Device transfers',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-09)',
    ],
    [
      'Each device transfer row',
      'Review',
      'secondary',
      '/admin/operations/device-transfers/DTR-0018',
      'built',
      'B7-01 f0; routes.json SA-01 (DTR → /admin/operations/device-transfers/[transferId], SA-19)',
    ],
    [
      'Support reports group head',
      'Open Support',
      'secondary',
      '/admin/operations/support',
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-09)',
    ],
    [
      'Each support report row',
      'Open',
      'secondary',
      '/admin/operations/support/SUP-0213',
      'built',
      'B7-01 f0; routes.json SA-01 (SUP → /admin/operations/support/[reportId], SA-21)',
    ],
    [
      'Access ending group head',
      'Open Access ending',
      'secondary',
      '/admin/operations/access-ending',
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-09)',
    ],
    [
      'Each access-ending row',
      'Open',
      'secondary',
      '/admin/operations/access-ending',
      'built',
      'B7-01 f0; routes.json SA-01 (“access-ending rows -> /admin/operations/access-ending (no record page)”, SA-22)',
    ],
    [
      'Institutions without an Institute Admin group head',
      'Open Institutions',
      'secondary',
      '/admin/institutions',
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-02)',
    ],
    [
      'Each institution without an Institute Admin',
      'Assign',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'B7-01 f0 (href B7-03); routes.json SA-01 (→ /admin/institutions/[institutionId], SA-07)',
    ],
    [
      'Stuck content group head',
      'Open All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-06)',
    ],
    [
      'Each stuck content row',
      'Open',
      'secondary',
      STUCK_RECORD,
      'built',
      'B7-01 f0; routes.json SA-01 (stuck SUB → /admin/content/records/[recordId], SA-13)',
    ],
    [
      'Role holders without scope group head',
      'Open Platform roles',
      'secondary',
      '/admin/roles',
      'built',
      'B7-01 f0, f3 (`a.xr-btn--text.xr-btn--sm` → B7-08)',
    ],
    [
      'Each role holder without scope',
      'Assign scope',
      'secondary',
      '/admin/roles/role-0001',
      'built',
      'B7-01 f0; routes.json SA-01 (holder → /admin/roles/[holderId], SA-17)',
    ],
  ]),

  // SA-12 Content › All content (B7-06 f0, f7).
  ...pageRows('SA-12', ALL_CONTENT, [
    [
      'Sub-navigation',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'B7-06 f0, f7 `nav.xr-tabs > a.xr-tab` (SA-10)',
    ],
    [
      'Sub-navigation',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'B7-06 f0, f7 `nav.xr-tabs > a.xr-tab[aria-current="page"]`',
    ],
    [
      'Stuck notice',
      'Show stuck records',
      'secondary',
      null,
      'in-page',
      'B7-06 f0 `div.xr-notice--err` (`showStuck`: selects the Stuck tab; mirrored in `?show=stuck`)',
    ],
    [
      'Correction waiting notice',
      'Open Updates',
      'secondary',
      UPDATES,
      'built',
      'B7-06 f0 `div.xr-notice` (only while a correction waits for her; state-copy `SA-12.update-notice`)',
    ],
    [
      'Status tabs',
      'All · Stuck · In the workflow · Published',
      'secondary',
      null,
      'in-page',
      'B7-06 f0, f7 `div.xr-tabs[role="tablist"] > button.xr-tab` (mirrored in `?show=`; state-copy `SA-12.address`)',
    ],
    [
      'Toolbar status row (and the no-match state)',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'B7-06 f7 (“One way back: Clear filters”)',
    ],
    [
      'Each row',
      'Open',
      'secondary',
      STUCK_RECORD,
      'built',
      'B7-06 f0 `a.xr-btn--secondary.xr-btn--sm` (SA-13; a record without a SUB reference by its experiment id)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'Board 04 "State grammar" Failed + retry (B7-06 draws no failed frame)',
    ],
  ]),

  // SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6).
  ...pageRows('SA-13', STUCK_RECORD, [
    [
      'Back link',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'B7-06 f1 … f6, f8 `a.xr-back`',
    ],
    [
      'Stuck notice',
      'Open Platform roles',
      'secondary',
      '/admin/roles?tab=reviewers',
      'built',
      'B7-06 f1, f8 `div.xr-notice--err` (B7-08; state-copy `SA-13.platform-roles`)',
    ],
    [
      'Stuck notice',
      'Move status (override)',
      'secondary',
      null,
      'in-page',
      'B7-06 f1, f8; B7-10 f6 (opens DL-2; only on a stuck, non-published record)',
    ],
    [
      'DL-2 Move status (override)',
      'Move status',
      'secondary',
      null,
      'in-page',
      'B7-06 f5; B7-10 f6 `div.xr-dialog-foot` (the `overrideStatus` command with a reason and the revision shown)',
    ],
    [
      'DL-2 Move status (override)',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B7-06 f5 `div.xr-dialog-foot` (nothing is moved)',
    ],
  ]),
  ...pageRows('SA-13', PUBLISHED_RECORD, [
    [
      'Correction waiting notice',
      'Open the release decision',
      'primary',
      '/admin/content/updates/UPD-0005',
      'built',
      'B7-06 f2 `a.xr-btn--primary.xr-btn--sm` (SA-11)',
    ],
  ]),
  ...pageRows('SA-13', HELD_RECORD, [
    [
      'Correction on hold notice',
      'Open Updates',
      'secondary',
      '/admin/content/updates?show=on-hold',
      'built',
      'B7-06 f6 `div.xr-notice--warn` (SA-10 on its On hold tab)',
    ],
  ]),
];
