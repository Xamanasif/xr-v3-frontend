import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

/**
 * Phase 3 link targets: ST-18 My device and the XS-05 "My device" entry (B3-07). The entry itself
 * is the XS-05 row of the main ledger (offered only to a Student holding AR, VR or MR, f1 / f2);
 * the page's actions are commands in place — there is no decline, cancel or second request (T-32).
 */
export const P3_DEVICE_LINK_TARGETS: readonly LedgerEntry[] = pageRows('ST-18', '/student/device', [
  [
    'Authorised device (nothing open; not paused)',
    'Request a device transfer',
    'primary',
    null,
    'in-page',
    'B3-07 f0, f9',
    'Opens the request form in place (f3), focus on “New device”; offered only while the device service says a request can be made (`canRequest`).',
  ],
  [
    'Request a device transfer (form)',
    'Send request',
    'primary',
    null,
    'in-page',
    'B3-07 f3, f4',
    'OperationsService.requestDeviceTransfer; the open request (“With your Institute Admin”) replaces the form and takes focus.',
  ],
  [
    'Request a device transfer (form)',
    'Cancel',
    'secondary',
    null,
    'in-page',
    'B3-07 f3',
    'Closes the form without sending; focus returns to “Request a device transfer”.',
  ],
]);
