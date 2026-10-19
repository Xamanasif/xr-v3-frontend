import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

/**
 * Link targets of SA-18 Device transfers and SA-19 Device transfer decision in the owner-approved
 * V3 design (the Super Admin export SA-v1: `sa-views-d.js` `V.transfers`, `V.transfer`, its
 * LINK-MAP), with the rail's Operations destination; the SA-07 rows they enable are beside SA-07's
 * other rows (link-targets.ts). No control is named by a DTR reference.
 */
export const P3_OPERATIONS_LINK_TARGETS: readonly LedgerEntry[] = [
  {
    screen: 'Shell',
    where: 'Sidebar destination (Super Admin only)',
    action: 'Operations',
    role: 'secondary',
    on: '/admin/*',
    target: '/admin/operations/device-transfers',
    outcome: 'built',
    board: 'SA-v1 LINK-MAP (rail “Operations” → SA-18); 06 (Super Admin raw[])',
    note: 'SA-18: Appendix A §3.7 row 17 — “Operations” opens Device transfers; `/admin/operations` redirects there. Support (SA-20) and Access ending (SA-22) are its tabs.',
  },
  // SA-18 Operations › Device transfers (SA-v1 `V.transfers`).
  ...pageRows('SA-18', '/admin/operations/device-transfers', [
    [
      'Operations tabs',
      'Device transfers',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'SA-v1 LINK-MAP SA-18 “Device transfers” (tab; `nav.rk-tabs.sa-tabs`, `aria-current="page"`)',
      'The page’s own tab, current on every view of the list.',
    ],
    [
      'Operations tabs',
      'Support',
      'secondary',
      '/admin/operations/support',
      'built',
      'SA-v1 LINK-MAP SA-18 “Support” (tab → SA-20)',
      'State-copy SA-18.tabs.',
    ],
    [
      'Operations tabs',
      'Access ending',
      'secondary',
      '/admin/operations/access-ending',
      'built',
      'SA-v1 LINK-MAP SA-18 “Access ending” (tab → SA-22)',
      'State-copy SA-18.tabs.',
    ],
    [
      'View switch (`sa-seg`)',
      'Forwarded to BITS · Still with an institution · Approved',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `V.transfers` (`SA.seg`, buttons with `aria-pressed` and counts)',
      'Filters the one list; the address mirrors the view (`?show=with-institution`, `?show=approved`; state-copy SA-18.show-address).',
    ],
    [
      'Each row',
      '<format> device transfer for <Student>, <status>. Open',
      'secondary',
      '/admin/operations/device-transfers/{transferId}',
      'built',
      'SA-v1 LINK-MAP SA-18 “VR device transfer for Rahul Verma, Forwarded. Open” (`a.rk-rowlink`, the whole row)',
      'Every view’s rows open their transfer (state-copy SA-18.rows).',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-core.js `SA.listState` failed (state-copy SA-18.failed)',
    ],
  ]),
  // SA-19 Device transfer decision (SA-v1 `V.transfer`, `SA.DLG.approveDtr`).
  ...pageRows('SA-19', '/admin/operations/device-transfers/{transferId}', [
    [
      'Breadcrumbs',
      'Operations',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'SA-v1 LINK-MAP SA-19 “Operations” (breadcrumb)',
    ],
    [
      'Breadcrumbs',
      'Device transfers',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'SA-v1 LINK-MAP SA-19 “Device transfers” (breadcrumb)',
    ],
    [
      'Page head (under 860 px)',
      'Go to decision',
      'secondary',
      '#transfer-decision',
      'in-page',
      'SA-v1 LINK-MAP SA-19 “Go to decision” (`a.rb-btn.rk-goto` → the panel)',
    ],
    [
      'Decision panel (forwarded)',
      'Approve transfer',
      'primary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `V.transfer` (`button.rb-btn--primary.rk-go`); LINK-MAP actions SA-19',
      'Opens the confirmation. Approve is the only decision (T-32): there is no Decline.',
    ],
    [
      'Confirmation',
      'Approve transfer',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-views-d.js `SA.DLG.approveDtr`',
      'The approveDeviceTransfer command, with the transfer’s revision from when the confirmation opened.',
    ],
    ['Confirmation', 'Cancel', 'secondary', null, 'in-page', 'SA-v1 sa-core.js dialog (Cancel)'],
    [
      'Decision panel (approved)',
      'Back to device transfers',
      'secondary',
      '/admin/operations/device-transfers',
      'built',
      'SA-v1 sa-views-d.js `V.transfer` (`div.rk-done` > `a.rb-btn`)',
    ],
    [
      'Refusal notice',
      'Check it again',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-core.js `SA.refusalHtml` (state-copy SA-19.moved-on)',
      'Closes the notice; focus moves to the page’s heading. Nothing is sent.',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'SA-v1 sa-core.js `SA.listState` failed formula (state-copy SA-19.failed)',
    ],
  ]),
];
