import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

/** Phase 3 link targets: IA-17 Requests to BITS, its request detail, IA-18 Device requests and IA-19 Device request, with the IA-01 … IA-05 actions they enable (B3-08, B3-09). */
export const P3_INSTITUTE_REQUESTS_LINK_TARGETS: readonly LedgerEntry[] = [
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Requests',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/requests',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B3-08 f0, B3-09 f0 (`aria-current="page"`)',
    note: 'IA-17 (Phase 3). Board 06’s count (“{n} device requests to forward”) is not drawn: it counts the Device requests tab while the item opens Requests to BITS — DEV-17 open.',
  },
  // IA-01's device-request row (B2-01 f7), drawn once IA-18 is built; the other IA-01 … IA-05
  // actions IA-17 enables are the Package-2A rows of the main ledger.
  ...pageRows('IA-01', '/institute', [
    [
      '“Needs your attention” row (device requests)',
      'Open requests',
      'secondary',
      '/institute/requests?tab=devices',
      'built',
      'B2-01 f7 (→ B3-09 IA-18; P3-07: the annotation’s target over the canvas href)',
      'Drawn while device requests wait on the Institute Admin (`listDeviceRequests`; state-copy IA-01.device-row).',
    ],
  ]),
  // IA-17 Requests to BITS (B3-08 f0 … f3, f7): the list, the form in place and its result.
  ...pageRows('IA-17', '/institute/requests', [
    [
      'Header (Requests to BITS)',
      'Ask BITS for a renewal or more licences',
      'primary',
      null,
      'in-page',
      'B3-08 f0, f3, f7',
      'Opens the form in place (f1, f2), focus on its title; not offered while paused or without a plan (state-copy IA-17.paused, IA-17.no-plan).',
    ],
    [
      'Tabs',
      'Device requests',
      'secondary',
      '/institute/requests?tab=devices',
      'built',
      'B3-08 f0, f3, f7 (→ B3-09 IA-18)',
    ],
    [
      'Request row',
      '(the request’s reference)',
      'secondary',
      '/institute/requests/{requestId}',
      'built',
      'B3-08 f0, f3, f7 (REQ-0058 → the detail, f4; REQ-0042 drawn → B1-08: state-copy IA-17.row-link)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B2-02 f9 formula (IA-17.failed)'],
    [
      'Form (back link)',
      'Requests',
      'secondary',
      null,
      'in-page',
      'B3-08 f1, f2 (`button.xr-back`: back to the list, focus on its title)',
    ],
    [
      'Form · What you need',
      'Renew access plan ACC-0107 · More licences for experiments you hold',
      'secondary',
      null,
      'in-page',
      'B3-08 f1, f2',
    ],
    [
      'Form · error summary',
      '(each error’s words)',
      'secondary',
      null,
      'in-page',
      'B3-08 f1 (focus moves to the field)',
    ],
    ['Form foot', 'Cancel', 'secondary', null, 'in-page', 'B3-08 f1, f2 (back to the list)'],
    [
      'Form foot',
      'Send request to BITS',
      'primary',
      null,
      'in-page',
      'B3-08 f1, f2 (`submitRenewalRequest` / `submitAdditionalLicencesRequest`; the result, f0 `done`)',
    ],
    [
      'Result (Request … sent to BITS)',
      'Back to Requests',
      'primary',
      null,
      'in-page',
      'B3-08 f0 `done` → f3 (the list, focus on its title)',
    ],
  ]),
  // IA-18 Device requests (B3-09 f0), the Requests page's second tab.
  ...pageRows('IA-18', '/institute/requests?tab=devices', [
    ['Tabs', 'Requests to BITS', 'secondary', '/institute/requests', 'built', 'B3-09 f0'],
    [
      'Request row',
      '(the student’s name)',
      'secondary',
      '/institute/requests/devices/{transferId}',
      'built',
      'B3-09 f0 (→ IA-19)',
    ],
    [
      'Request row (Waiting on you; not paused)',
      'Review',
      'secondary',
      '/institute/requests/devices/{transferId}',
      'built',
      'B3-09 f0 (→ IA-19, `aria-label` “Review Rahul Verma’s request”)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B2-02 f9 formula (IA-18.failed)'],
  ]),
  // IA-17's request detail (B3-08 f4 … f6; no screen id of its own, O-02).
  ...pageRows('IA-17', '/institute/requests/{requestId}', [
    ['Back link', 'Requests', 'secondary', '/institute/requests', 'built', 'B3-08 f4 … f6'],
    [
      'Approved — payment required (and payment failed)',
      'Open the payment page',
      'primary',
      '/requests/{routeId}/payment',
      'built',
      'B3-08 f6 (→ B1-08 PU-12 by the request’s opaque address: the requesting institution’s Institute Admin may pay, O-05 / ADR-0009; state-copy IA-17.detail.payment-failed)',
    ],
    [
      'Failed state (request detail)',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B2-02 f9 formula (IA-17.detail.failed)',
    ],
  ]),
  // IA-19 Device request — review & forward (B3-09 f1 … f5).
  ...pageRows('IA-19', '/institute/requests/devices/{transferId}', [
    [
      'Back link',
      'Device requests',
      'secondary',
      '/institute/requests?tab=devices',
      'built',
      'B3-09 f1 … f5',
    ],
    [
      'What the student asked for',
      '(the student’s name)',
      'secondary',
      '/institute/people/students/{studentId}',
      'built',
      'B3-09 f1 … f5 (→ B2-06 IA-07)',
    ],
    [
      'Your action (Waiting on you; not paused)',
      'Forward to BITS',
      'primary',
      null,
      'in-page',
      'B3-09 f1, f5 (opens DL-1; none once forwarded or decided, f2, f3, nor while paused, f4)',
    ],
    [
      'Forward dialog (DL-1)',
      'Forward to BITS · Cancel · Close',
      'secondary',
      null,
      'in-page',
      'B3-09 f1 (`forwardDeviceTransfer` with the revision read; the flash and focus on the status)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B2-02 f9 formula (IA-19.failed)'],
  ]),
];
