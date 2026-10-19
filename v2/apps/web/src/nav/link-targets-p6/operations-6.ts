import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const DEVICE_TRANSFERS = '/admin/operations/device-transfers';
const SUPPORT = '/admin/operations/support';
const ACCESS_ENDING = '/admin/operations/access-ending';
/** SA-21, by report reference: the sample's SUP-0213 stands for any (`expandTarget`'s `{id}`). */
const REPORT = '/admin/operations/support/{id}';

/** The three Operations tab links of a Phase-6 list (SA-v1 `opsHead`, LINK-MAP). */
function operationsTabs(screen: string): Parameters<typeof pageRows>[2] {
  return [
    [
      'Operations tabs',
      'Device transfers',
      'secondary',
      DEVICE_TRANSFERS,
      'built',
      `SA-v1 LINK-MAP ${screen} “Device transfers” (tab → SA-18)`,
    ],
    [
      'Operations tabs',
      'Support',
      'secondary',
      SUPPORT,
      'built',
      `SA-v1 LINK-MAP ${screen} “Support” (tab → SA-20)`,
    ],
    [
      'Operations tabs',
      'Access ending',
      'secondary',
      ACCESS_ENDING,
      'built',
      `SA-v1 LINK-MAP ${screen} “Access ending” (tab → SA-22)`,
    ],
  ];
}

/** The kit's failed state on a Phase-6 Operations page. */
function failedRow(id: string): Parameters<typeof pageRows>[2][number] {
  return [
    'Failed state',
    'Try again',
    'secondary',
    null,
    'in-page',
    `SA-v1 sa-core.js \`SA.listState\` failed (state-copy ${id}.failed)`,
  ];
}

/**
 * Link targets of SA-20 Support, SA-21 Support report and SA-22 Access ending in the
 * owner-approved V3 design (the Super Admin export SA-v1: `sa-views-d.js` `V.support`,
 * `V.report`, `V.accessEnding`, its LINK-MAP), with the SA-07 "Needs attention" row they enable.
 * SA-21's one primary is the panel's "Resolve report" (the `resolveReport` command); Reopen is
 * secondary and confirms first. SA-20 and SA-22 draw no primary: every row opens a record. Nothing
 * on these pages sends anything, and no control is named by a SUP, REQ or ACC reference.
 */
export const P6_OPERATIONS_6_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-20 Operations › Support (SA-v1 `V.support`).
  ...pageRows('SA-20', SUPPORT, [
    ...operationsTabs('SA-20'),
    [
      'View switch (`sa-seg`)',
      'Open · Resolved · All',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `V.support` (`SA.seg`, buttons with `aria-pressed` and counts)',
      'Filters the one list; the address mirrors the view (`?show=resolved`, `?show=all`; state-copy SA-20.show-address).',
    ],
    [
      'Each report row',
      '<title>, <status>. Open the report',
      'secondary',
      REPORT,
      'built',
      'SA-v1 LINK-MAP SA-20 “Student import stopped part-way, Reopened. Open the report” (`a.rk-rowlink`, the whole row)',
    ],
    failedRow('SA-20'),
  ]),
  // SA-21 Support report (SA-v1 `V.report`, `SA.DLG.reopen`).
  ...pageRows('SA-21', REPORT, [
    [
      'Breadcrumbs',
      'Operations',
      'secondary',
      DEVICE_TRANSFERS,
      'built',
      'SA-v1 LINK-MAP SA-21 “Operations” (breadcrumb)',
    ],
    [
      'Breadcrumbs',
      'Support',
      'secondary',
      SUPPORT,
      'built',
      'SA-v1 LINK-MAP SA-21 “Support” (breadcrumb)',
    ],
    [
      'Page head (under 860 px)',
      'Go to decision',
      'secondary',
      '#support-decision',
      'in-page',
      'SA-v1 LINK-MAP SA-21 “Go to decision” (`a.rb-btn.rk-goto` → the panel)',
    ],
    [
      'What they reported (a reporter with an institution)',
      'Open <institution>',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'B7-09 f8 … f12 (→ B7-03); kept from the product — SA-v1 draws none',
      'State-copy SA-21.institution-link.',
    ],
    [
      'Resolve panel (open or reopened)',
      'Resolve report',
      'primary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `V.report` (`button.rb-btn--primary.rk-go`); LINK-MAP actions SA-21',
      'The resolveReport command with the note the reporter sees (required: “Add a note — the reporter sees it”).',
    ],
    [
      'Resolve panel (resolved)',
      'Reopen',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `V.report` (`div.rk-done` > `button.rb-btn`)',
      'Opens the confirmation; Reopen is the only action on a resolved report.',
    ],
    [
      'Confirmation',
      'Reopen',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `SA.DLG.reopen` (“Reopen this report?”)',
      'The reopenReport command, with the report’s revision from when the confirmation opened.',
    ],
    ['Confirmation', 'Cancel', 'secondary', null, 'in-page', 'SA-v1 sa-core.js dialog (Cancel)'],
    [
      'Refusal notice',
      'Check it again',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-core.js `SA.refusalHtml` (state-copy SA-21.stale.title)',
      'Closes the notice; focus moves to the page’s heading. Nothing is sent.',
    ],
    failedRow('SA-21'),
  ]),
  // SA-22 Operations › Access ending (SA-v1 `V.accessEnding`).
  ...pageRows('SA-22', ACCESS_ENDING, [
    ...operationsTabs('SA-22'),
    [
      'Each row (the institution’s name)',
      '<institution>',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'SA-v1 LINK-MAP SA-22 “Konark Polytechnic” (`th[scope=row] a` → SA-07)',
    ],
    [
      'A renewal in progress',
      'Open request',
      'secondary',
      '/admin/requests/{requestId}',
      'built',
      'SA-v1 LINK-MAP SA-22 “Open the renewal request from BITS Pilani — Hyderabad Campus” (`a.rb-btn--ghost` → SA-03)',
      'Nothing here approves a renewal (state-copy SA-22.renewal-line).',
    ],
    [
      'Each row',
      'Open institution',
      'secondary',
      '/admin/institutions/{institutionId}',
      'built',
      'SA-v1 LINK-MAP SA-22 “Open Konark Polytechnic” (`a.rb-btn--ghost` → SA-07)',
      'No status action on any row; “Reminder due” sends nothing (state-copy SA-22.read-only).',
    ],
    failedRow('SA-22'),
  ]),
  // SA-07 Institution detail: the access-ending note of a plan band (SA-v1 `planBand`).
  {
    screen: 'SA-07',
    where: 'Plan band note — ending soon, reminder due',
    action: 'View access ending',
    role: 'secondary',
    on: '/admin/institutions/{institutionId}',
    target: ACCESS_ENDING,
    outcome: 'built',
    board: 'SA-v1 LINK-MAP SA-07 (bitshyd, konark) “View access ending” → SA-22 (`planBand` note)',
    note: 'For a plan ending within 15 days with a reminder due (state-copy SA-07.attention-access-ending).',
  },
];
