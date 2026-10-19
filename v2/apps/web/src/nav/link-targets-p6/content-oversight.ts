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
 * Phase 6 link targets: SA-01 Overview in full (SA-v1 `V.overview`, LINK-MAP SA-01), SA-12 Content ›
 * All content (B7-06 f0, f7) and SA-13 Content record (B7-06 f1 … f6, f8; B7-10 f5, f6). Every
 * Overview row opens the page where its item is handled; the priority band's first item is drawn
 * as the page's one primary button. SA-12 draws no primary action: every All content row opens its
 * record. SA-12 and SA-13 follow the
 * owner-approved Super Admin export (SA-v1 LINK-MAP SA-12, SA-13): SA-13's one primary is the
 * override panel's “Move status” on a stuck record (a command, through its confirmation); a
 * published record's “Open the release decision” is a default button. Nothing here says
 * “Publish”, and no link is named by a reference.
 */
export const P6_CONTENT_OVERSIGHT_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-01 Overview (SA-v1 `V.overview`; LINK-MAP SA-01): the seven groups beside Requests — each
  // "Open <list>" and its rows' action, which the priority band also draws for the access-ending
  // and correction items it shows. The Requests group, the switch and "Try again" are in
  // `link-targets.ts`. No link is named by a reference.
  ...pageRows('SA-01', OVERVIEW, [
    [
      'Corrections group head',
      'Open Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Updates” → SA-10',
    ],
    [
      'Each correction row (and its priority-band item)',
      'Review correction',
      'secondary',
      '/admin/content/updates/UPD-0005',
      'built',
      'SA-v1 LINK-MAP SA-01 “Review the Distillation Column correction” → SA-11',
      'Named “Review the <experiment> correction”. The band’s first item is drawn as the page’s primary button.',
    ],
    [
      'Device transfers group head',
      'Open Device transfers',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Device transfers” → SA-18',
    ],
    [
      'Each device transfer row',
      'Review transfer',
      'secondary',
      '/admin/operations/device-transfers/DTR-0018',
      'built',
      'SA-v1 LINK-MAP SA-01 “Review the VR device transfer for Rahul Verma” → SA-19',
      'Named “Review the <format> device transfer for <student>”.',
    ],
    [
      'Support reports group head',
      'Open Support',
      'secondary',
      '/admin/operations/support',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Support” → SA-20',
    ],
    [
      'Each support report row',
      'Open report',
      'secondary',
      '/admin/operations/support/SUP-0213',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open the report: …” → SA-21',
      'Named “Open the report: <title>”.',
    ],
    [
      'Access ending group head',
      'Open Access ending',
      'secondary',
      '/admin/operations/access-ending',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Access ending” → SA-22',
    ],
    [
      'Each access-ending row with a renewal in progress (and its priority-band item)',
      'Open renewal request',
      'secondary',
      '/admin/requests/{requestId}',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open the renewal request from BITS Pilani — Hyderabad Campus” → SA-03',
      'Named “Open the renewal request from <institution>”. The band’s first item is drawn as the page’s primary button.',
    ],
    [
      'Each access-ending row with the reminder due (and its priority-band item)',
      'View access ending',
      'secondary',
      '/admin/operations/access-ending',
      'built',
      'SA-v1 LINK-MAP SA-01 “View access ending for Konark Polytechnic” → SA-22',
      'Named “View access ending for <institution>”; access ending has no record page.',
    ],
    [
      'Institutions without an Institute Admin group head',
      'Open Institutions',
      'secondary',
      '/admin/institutions',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Institutions” → SA-06',
    ],
    [
      'Each institution without an Institute Admin',
      'Assign Institute Admin',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'SA-v1 LINK-MAP SA-01 “Assign an Institute Admin to Sahyadri Institute of Engineering” → SA-07',
      'The export opens the institution with its assign dialog (`#/institutions/<id>/assign`); the product opens the institution page, where Assign Institute Admin is the first action.',
    ],
    [
      'Stuck content group head',
      'Open All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'SA-v1 LINK-MAP SA-01 “Open All content” → SA-12',
    ],
    [
      'Each stuck content row',
      'Open in All content',
      'secondary',
      STUCK_RECORD,
      'built',
      'SA-v1 LINK-MAP SA-01 “Open DC Motor Speed Control in All content” → SA-13',
      'Named “Open <experiment> in All content”.',
    ],
    [
      'Role holders without scope group head',
      'Open Platform roles',
      'secondary',
      '/admin/roles',
      'built',
      'SA-v1 LINK-MAP SA-01 “Open Platform roles” → SA-16',
    ],
    [
      'Each role holder without scope',
      'Assign scope',
      'secondary',
      '/admin/roles/role-0001',
      'built',
      'SA-v1 LINK-MAP SA-01 “Assign scope to Dr K. Iyer” → SA-17',
      'Named “Assign scope to <name>”.',
    ],
  ]),

  // SA-12 All content (SA-v1 `V.allContent`; LINK-MAP SA-12).
  ...pageRows('SA-12', ALL_CONTENT, [
    [
      'Page tabs',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-12 “Updates” tab → SA-10',
    ],
    [
      'Page tabs',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'SA-v1 LINK-MAP SA-12 “All content” tab (`a.rk-tab[aria-current="page"]`)',
    ],
    [
      'Stuck notice',
      'Show stuck records',
      'secondary',
      null,
      'in-page',
      'Kept from the product (B7-06 f0 `showStuck`); the SA-v1 export draws no stuck notice: sets “Workflow status” to Stuck, mirrored in `?show=stuck`',
    ],
    [
      'Correction waiting notice',
      'Open Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-12 “Open Updates” → SA-10 (only while a correction waits for her)',
    ],
    [
      'Toolbar',
      'Search · Workflow status',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.allContent` `rk-tools` (mirrored in `?q=` and `?show=`; state-copy `SA-12.address`)',
    ],
    [
      'Toolbar status line (and the no-match state)',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.allContent` `ctClear` (focus to the search)',
    ],
    [
      'Each row',
      'DC Motor Speed Control, Stuck — nobody can act. Open the record',
      'secondary',
      STUCK_RECORD,
      'built',
      'SA-v1 LINK-MAP SA-12 row links (`a.rk-rowlink`, the whole row) → SA-13',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'SA-v1 `SA.listState` failed (`retryList`)',
    ],
  ]),

  // SA-13 Content record (SA-v1 `V.record`, `SA.DLG.override`; LINK-MAP SA-13).
  ...pageRows('SA-13', STUCK_RECORD, [
    [
      'Breadcrumb',
      'Content',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-13 breadcrumb → SA-10',
    ],
    [
      'Breadcrumb',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'SA-v1 LINK-MAP SA-13 breadcrumb → SA-12',
    ],
    [
      'Go to override',
      'Go to override',
      'secondary',
      '#content-record-panel',
      'in-page',
      'SA-v1 LINK-MAP SA-13 “Go to override” → `#rc-panel` (below 860 px of page width)',
    ],
    [
      'Stuck notice',
      'Open Platform roles',
      'secondary',
      '/admin/roles?tab=reviewers',
      'built',
      'SA-v1 LINK-MAP SA-13 “Open Platform roles” → SA-16 Reviewers (state-copy `SA-13.platform-roles`)',
    ],
    [
      'Move status (override) panel',
      'Move status',
      'primary',
      null,
      'in-page',
      'SA-v1 `V.record` `button.rk-go` (`rc-go`; only on a stuck, non-published record) → `SA.DLG.override`',
    ],
    [
      'Override confirmation',
      'Move status',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `dlg-ok` (the `overrideStatus` command with the reason and the revision shown)',
    ],
    [
      'Override confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `dlg-cancel` (nothing is moved)',
    ],
    [
      'A refused move',
      'Check it again',
      'secondary',
      null,
      'in-page',
      'SA-v1 `SA.refusalHtml` (`clearRefusal`; the words are state-copy `SA-13.stale.*`)',
    ],
  ]),
  ...pageRows('SA-13', PUBLISHED_RECORD, [
    [
      'Published notice (correction waiting)',
      'Open the release decision',
      'secondary',
      '/admin/content/updates/UPD-0005',
      'built',
      'SA-v1 LINK-MAP SA-13 “Open the release decision” → SA-11 (`a.rb-btn`)',
    ],
  ]),
  ...pageRows('SA-13', HELD_RECORD, [
    [
      'Published notice (correction on hold)',
      'Open the held correction',
      'secondary',
      '/admin/content/updates/UPD-0004',
      'built',
      'SA-v1 `V.record` published notice (`a.rb-btn` → SA-11 of the held correction)',
    ],
  ]),
];
