import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

/** The ledger parts of the requests group, by page. */
export type IaRequestsLedgerPart = 'IA-17' | 'IA-18' | 'IA-17 request detail' | 'IA-19';

/**
 * Link targets of the Institute Admin’s requests group: IA-17 Requests to BITS and its request
 * detail, IA-18 Device requests and IA-19 Device request (Phase 3 rows, B3-08, B3-09; in V3 the
 * owner-approved Institute Admin export, IA-v1 `Main.dc.html` and LINK-MAP.json), spread from
 * `link-targets-p3/institute-requests.ts`. No action is named by a request’s, a plan’s or a
 * device request’s reference (state-copy IA-17.no-reference).
 *
 * The Institute Admin’s ledger entries are kept per V3 screen group (IA-ANALYSIS §5) so that each
 * group edits only its own file; `link-targets.ts` spreads the parts in the ledger’s order.
 */
export const IA_REQUESTS_LINK_TARGETS: Readonly<
  Record<IaRequestsLedgerPart, readonly LedgerEntry[]>
> = {
  // IA-17 Requests to BITS (IA-v1 "Requests head and tabs", "IA-17"): the list, the form in place
  // and its result.
  'IA-17': pageRows('IA-17', '/institute/requests', [
    [
      'Header (Requests to BITS)',
      'Ask BITS for a renewal or more licences',
      'primary',
      null,
      'in-page',
      'IA-v1 `Main.dc.html` Requests head (`V.RH.ask`); B3-08 f0, f3, f7',
      'Opens the form in place, focus on its title; not offered while paused or without a plan (state-copy IA-17.paused, IA-17.no-plan).',
    ],
    [
      'Tabs',
      'Device requests',
      'secondary',
      '/institute/requests?tab=devices',
      'built',
      'IA-v1 `V.RH.tabs` (→ IA-18); B3-08 f0, f3, f7',
    ],
    [
      'Request row',
      '(the request’s kind, named by content: “More licences, sent 21 Oct 2026, Under review. Open the request”; the whole row follows it)',
      'secondary',
      '/institute/requests/{requestId}',
      'built',
      'IA-v1 `vm17` rows (`rowL` → the detail; state-copy IA-17.row-link, IA-17.row-name)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B2-02 f9 formula (IA-17.failed): reads again, focus on the page’s title',
    ],
    [
      'Form (crumbs)',
      'Requests',
      'secondary',
      null,
      'in-page',
      'IA-v1 "IA-17 form" crumbs (`V.back`): back to the list in place, focus on its title; a new-tab press follows /institute/requests',
    ],
    [
      'Form · What you need',
      'Renew your access plan · More licences for experiments you hold',
      'secondary',
      null,
      'in-page',
      'IA-v1 `vm17form` (`setRenew`, `setMore`); state-copy IA-17.no-reference',
    ],
    [
      'Form · error summary',
      '(each error’s words)',
      'secondary',
      null,
      'in-page',
      'IA-v1 `vm17form` `errList` (focus moves to the field)',
    ],
    [
      'Form foot',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'IA-v1 `ia-actions` (back to the list, nothing sent)',
    ],
    [
      'Form foot',
      'Send request to BITS',
      'primary',
      null,
      'in-page',
      'IA-v1 `vm17form` `send` (`submitRenewalRequest` / `submitAdditionalLicencesRequest`; the result)',
    ],
    [
      'Result (crumbs)',
      'Requests',
      'secondary',
      null,
      'in-page',
      'IA-v1 "sent" crumbs (`V.back`): back to the list in place, focus on its title',
    ],
    [
      'Result (Request sent to BITS)',
      'View request',
      'secondary',
      '/institute/requests/{requestId}',
      'built',
      'IA-v1 "sent" (`V.open`, navy: the new request’s detail)',
    ],
    [
      'Result (Request sent to BITS)',
      'Back to Requests',
      'primary',
      null,
      'in-page',
      'IA-v1 "sent" (`V.back`; drawn as the default button beside the navy “View request”) → the list, focus on its title',
    ],
  ]),
  // IA-18 Device requests (IA-v1 "IA-18 Device requests tab"), the Requests page's second tab.
  'IA-18': pageRows('IA-18', '/institute/requests?tab=devices', [
    [
      'Tabs',
      'Requests to BITS',
      'secondary',
      '/institute/requests',
      'built',
      'IA-v1 `V.RH.tabs`; B3-09 f0',
    ],
    [
      'Request row',
      '(the student’s name)',
      'secondary',
      '/institute/people/students/{studentId}',
      'built',
      'IA-v1 `vm18` (`stu` → IA-07)',
    ],
    [
      'Request row',
      'VR device transfer (named “VR device transfer from Rahul Verma, 22 Oct 2026”)',
      'secondary',
      '/institute/requests/devices/{transferId}',
      'built',
      'IA-v1 `vm18` (`open`, `openAria` without the reference → IA-19)',
    ],
    [
      'Request row (Waiting on you; not paused)',
      'Review',
      'secondary',
      '/institute/requests/devices/{transferId}',
      'built',
      'IA-v1 `vm18` (`canReview` → IA-19, `aria-label` “Review Rahul Verma’s request”)',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'B2-02 f9 formula (IA-18.failed): reads again, focus on the page’s title',
    ],
  ]),
  // IA-17's request detail (IA-v1 "IA-17 detail"; no screen id of its own, O-02).
  'IA-17 request detail': pageRows('IA-17', '/institute/requests/{requestId}', [
    [
      'Crumbs',
      'Requests',
      'secondary',
      '/institute/requests',
      'built',
      'IA-v1 detail crumbs (`V.back`)',
    ],
    [
      'Approved — payment required (and payment failed)',
      'Open the payment page',
      'primary',
      '/requests/{routeId}/payment',
      'built',
      'IA-v1 `isPay` (navy; → B1-08 PU-12 by the request’s opaque address: the requesting institution’s Institute Admin may pay, O-05 / ADR-0009; state-copy IA-17.detail.payment-failed)',
    ],
    [
      'Access active (the plan the request created)',
      'View your access plan',
      'secondary',
      '/institute/content-access/plans/{planId}',
      'built',
      'IA-v1 `isActive` (`planLink` → IA-03, named without the reference; state-copy IA-17.detail.stands)',
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
  // IA-19 Device request — review & forward (IA-v1 "IA-19").
  'IA-19': pageRows('IA-19', '/institute/requests/devices/{transferId}', [
    [
      'Crumbs',
      'Device requests',
      'secondary',
      '/institute/requests?tab=devices',
      'built',
      'IA-v1 "IA-19" crumbs (`V.back`)',
    ],
    [
      'What the student asked for',
      '(the student’s name)',
      'secondary',
      '/institute/people/students/{studentId}',
      'built',
      'IA-v1 `vm19` (`stu` → IA-07)',
    ],
    [
      'Your action (Waiting on you; not paused)',
      'Forward to BITS',
      'primary',
      null,
      'in-page',
      'IA-v1 `vm19` (`canForward`, `openFwd`: opens the dialog; none once forwarded or decided, nor while paused)',
    ],
    [
      'Forward dialog',
      'Forward to BITS · Cancel',
      'secondary',
      null,
      'in-page',
      'IA-v1 `dlgContent` `forward` (“Forward Rahul Verma’s device request to BITS?”; `forwardDeviceTransfer` with the revision read; the flash “Forwarded to BITS” and focus on it)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'B2-02 f9 formula (IA-19.failed)'],
  ]),
};
