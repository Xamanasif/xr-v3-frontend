import type { LedgerEntry } from '../link-targets';
import { pageRows } from './rows';

/**
 * Phase 3 link targets: ST-18 My device and the XS-05 "My device" entry, in the owner-approved V3
 * Student design (ST-v1 LINK-MAP; `device`, `msg('dev-not')`). The entry itself is the XS-05 row
 * of the main ledger (offered only to a Student holding AR, VR or MR, or with a request open); the
 * page's actions are commands in place — there is no decline, cancel or second request (T-32).
 */
export const P3_DEVICE_LINK_TARGETS: readonly LedgerEntry[] = pageRows('ST-18', '/student/device', [
  [
    'Authorised device (nothing open; not paused)',
    'Request a device transfer',
    'primary',
    null,
    'in-page',
    'ST-v1 LINK-MAP · `devVM` (`openForm`)',
    'Opens the request form in place, focus on “New device”; offered only while the device service says a request can be made (`canRequest`).',
  ],
  [
    'Request a device transfer (form)',
    'Send request',
    'primary',
    null,
    'in-page',
    'ST-v1 `devVM` (`send`)',
    'OperationsService.requestDeviceTransfer; the open request (“With your Institute Admin”, its three steps) replaces the form and takes focus.',
  ],
  [
    'Request a device transfer (form)',
    'Cancel',
    'secondary',
    null,
    'in-page',
    'ST-v1 `devVM` (`cancelForm`)',
    'Closes the form without sending; focus returns to “Request a device transfer”.',
  ],
  [
    'Not available (no headset format, no open request)',
    'Back to Home',
    'primary',
    '/student',
    'built',
    'ST-v1 LINK-MAP · `msg(dev-not)` (→ ST-01)',
    'State-copy `ST-18.direct-visit`.',
  ],
  [
    'Not available (no headset format, no open request)',
    'Help & support',
    'secondary',
    '/student/help',
    'built',
    'ST-v1 LINK-MAP · `msg(dev-not)` (→ XS-07)',
  ],
]);
