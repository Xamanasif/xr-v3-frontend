import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const DEVICE_TRANSFERS = '/admin/operations/device-transfers';
const SUPPORT = '/admin/operations/support';
const ACCESS_ENDING = '/admin/operations/access-ending';
/** SA-21, by report reference: the sample's SUP-0213 stands for any (`expandTarget`'s `{id}`). */
const REPORT = '/admin/operations/support/{id}';
const HELP_REPORT = '/admin/help/report';

/** The three Operations tab links of a Phase-6 list (rule T1; B7-09 f4, f7). */
function operationsTabs(board: string): Parameters<typeof pageRows>[2] {
  return [
    [
      'Operations tabs',
      'Device transfers',
      'secondary',
      DEVICE_TRANSFERS,
      'built',
      `${board} (\`nav.xr-tabs.xr-tabs--on-white\` → B7-09 f0)`,
    ],
    ['Operations tabs', 'Support', 'secondary', SUPPORT, 'built', `${board} (→ B7-09 f7)`],
    [
      'Operations tabs',
      'Access ending',
      'secondary',
      ACCESS_ENDING,
      'built',
      `${board} (→ B7-09 f4)`,
    ],
    [
      'Top-bar crumb (from 1024 px)',
      'Operations',
      'secondary',
      DEVICE_TRANSFERS,
      'built',
      `${board} (\`ol.xr-crumbs\`)`,
    ],
  ];
}

/** Board 04's failed state on a Phase-6 Operations page (no board draws it). */
function failedRows(id: string): Parameters<typeof pageRows>[2] {
  return [
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      `Board 04 "State grammar" Failed + retry (B7-09 draws no failed page; state-copy ${id}.failed)`,
    ],
    [
      'Failed state',
      'Report a problem',
      'secondary',
      HELP_REPORT,
      'built',
      'Board 03 failed notice (`xr-notice-actions`)',
    ],
  ];
}

/**
 * Phase 6 link targets: SA-20 Support, SA-21 Support report and SA-22 Access ending (B7-09,
 * B7-10), with the SA-07 "Needs attention" row they enable. SA-21's one primary is the panel's
 * "Resolve" (the `resolveReport` command); Reopen is secondary and confirms first (DL-1). SA-20 and
 * SA-22 draw no primary: every row opens a record. Nothing on these pages sends anything.
 */
export const P6_OPERATIONS_6_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-20 Operations › Support (B7-09 f7, f13).
  ...pageRows('SA-20', SUPPORT, [
    ...operationsTabs('B7-09 f7, f13'),
    [
      'View tabs (`role="tablist"`)',
      'Open · Resolved · All',
      'secondary',
      null,
      'in-page',
      'B7-09 f7, f13 (`button.xr-tab[role=tab]` with `xr-tab-count`)',
      'Filters the one list; the address mirrors the view (`?show=resolved`, `?show=all`; state-copy SA-20.show-address).',
    ],
    [
      'Each report row',
      'Open',
      'secondary',
      REPORT,
      'built',
      'B7-09 f7 (`xr-btn--secondary.xr-btn--sm`, “Open SUP-0213 …”)',
    ],
    ...failedRows('SA-20'),
  ]),
  // SA-21 Support report (B7-09 f8 … f12, f14; B7-10 f12; B7-12 f28 … f31).
  ...pageRows('SA-21', REPORT, [
    ['Back link', 'Support', 'secondary', SUPPORT, 'built', 'B7-09 f8 … f14 (`a.xr-back`)'],
    [
      'Top-bar crumbs (from 1024 px)',
      'Operations',
      'secondary',
      DEVICE_TRANSFERS,
      'built',
      'B7-09 f8 (`ol.xr-crumbs` “Operations / Support / SUP-0213”)',
    ],
    [
      'Top-bar crumbs (from 1024 px)',
      'Support',
      'secondary',
      SUPPORT,
      'built',
      'B7-09 f8 (`ol.xr-crumbs`)',
    ],
    [
      'What they reported (a reporter with an institution)',
      'Open <institution>',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'B7-09 f8 … f12 (`a.xr-btn--text.xr-btn--sm` → B7-03)',
      'State-copy SA-21.institution-link.',
    ],
    [
      'Resolve panel (open or reopened)',
      'Resolve',
      'primary',
      null,
      'in-page',
      'B7-09 f8, f10, f11 (`button.xr-btn--primary.xr-btn--block`); B7-10 f12',
      'The resolveReport command with the note the reporter sees (required: “Add a note — the reporter sees it”).',
    ],
    [
      'Resolve panel (resolved)',
      'Reopen',
      'secondary',
      null,
      'in-page',
      'B7-09 f9, f12 (`button.xr-btn--secondary.xr-btn--block`)',
      'Opens the confirmation (DL-1); Reopen is the only action on a resolved report.',
    ],
    [
      'Confirmation (DL-1)',
      'Reopen',
      'secondary',
      null,
      'in-page',
      'B7-09 f12 “Reopen SUP-0189?”',
      'The reopenReport command, with the report’s revision from when the confirmation opened.',
    ],
    ['Confirmation (DL-1)', 'Cancel', 'secondary', null, 'in-page', 'B7-09 f12 (Cancel, Close)'],
    ...failedRows('SA-21'),
  ]),
  // SA-22 Operations › Access ending (B7-09 f4, f5, f6; B7-10 f13).
  ...pageRows('SA-22', ACCESS_ENDING, [
    ...operationsTabs('B7-09 f4, f5, f6'),
    [
      'A renewal in progress',
      'Open request',
      'secondary',
      '/admin/requests/{requestId}',
      'built',
      'B7-09 f4 (`xr-btn--secondary.xr-btn--sm`, “Open request REQ-0038” → B1-11 SA-03)',
      'Nothing here approves a renewal (state-copy SA-22.renewal-line).',
    ],
    [
      'Each row',
      'Open institution',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'B7-09 f4, f6 (`xr-btn--text.xr-btn--sm` → B7-03 SA-07)',
      'No status action on any row; “Reminder due” sends nothing (state-copy SA-22.read-only).',
    ],
    ...failedRows('SA-22'),
  ]),
  // SA-07 Institution detail: the access-ending row of “Needs attention” (B7-03 konark).
  {
    screen: 'SA-07',
    where: '“Needs attention” — access ending with a reminder due',
    action: 'Operations › Access ending',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: ACCESS_ENDING,
    outcome: 'built',
    board: 'B7-03 `att` (konark → B7-09 f4)',
    note: 'Phase 6: rendered with SA-22 Operations › Access ending, for a plan ending within 15 days with a reminder due (state-copy SA-07.attention-access-ending).',
  },
];
