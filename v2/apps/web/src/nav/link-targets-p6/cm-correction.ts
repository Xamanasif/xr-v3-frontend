import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const LIBRARY = '/content-manager/library';
/** CM-05, by experiment id: Distillation Column stands for any published experiment. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** CM-08 an update, by update id: UPD-0005 stands for any. */
const UPDATE = '/content-manager/updates/UPD-0005';

/**
 * Phase 6 link targets: CM-08 an update — the correction draft CM-06 “Edit catalogue details” and
 * CM-07 “Edit delivery link” open on CM-05 (whose entries are in `link-targets-p5/cm-decision.ts`)
 * and every later state (B6-09 f1 … f8, B6-11 f10, f11, B6-13 f0, B7-11 f3). The draft’s one
 * primary is “Send for academic review” (a command, through DL-1); Save draft and Withdraw update
 * (DL-2) are commands too. A correction never says “Publish” (BC8).
 */
export const P6_CM_CORRECTION_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('CM-08', UPDATE, [
    [
      'Back link',
      'Back to the published experiment',
      'secondary',
      PUBLISHED,
      'built',
      'B6-09 f1 … f8; B6-11 f10, f11 `button.xr-back` (`backPub`; a link here — “Back from the correction” on CM-05, state-copy `CM-05.back-from-correction`)',
    ],
    [
      'Error summary (B6-11 f11)',
      'Say what changes and why · Enter the version label, for example 1.3 · Change at least one catalogue detail or delivery link',
      'secondary',
      null,
      'in-page',
      'B6-09 script `errList`; B6-11 f11 `div.xw-errsum a` (each link focuses its field; the change link the Summary)',
    ],
    [
      'Draft foot (draft, returned)',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'B6-09 f1, f2, f4; B6-11 f11 `div.xw-flow-foot > button.xr-btn--text.xg-del` → DL-2 “Withdraw this update?”',
    ],
    [
      'Draft foot (draft, returned)',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'B6-09 f1, f2, f4 `div.xw-actions > button.xr-btn--secondary` (“Draft saved · … · the live version is unchanged”)',
    ],
    [
      'Draft foot (draft, returned)',
      'Send for academic review',
      'primary',
      null,
      'in-page',
      'B6-09 f1, f2, f4 `div.xw-actions > button.xr-btn--primary` (`Wd-u-sbtn`) → the check (B6-11 f11) or DL-1 “Send for academic review?” → In academic review (f3)',
    ],
    [
      'DL-1 Send for academic review?',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-09 `dlgSend` `div.xr-dialog-foot` (nothing is saved or sent)',
    ],
    [
      'DL-1 Send for academic review?',
      'Send for academic review',
      'secondary',
      null,
      'in-page',
      'B6-09 `dlgSend` `button.xr-btn--primary` (`Wd-u-sgo`; saves the page, then sends it — state-copy `CM-08.send-saves-first`)',
    ],
    [
      'DL-2 Withdraw this update?',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-09 `dlgW` `div.xr-dialog-foot` (nothing is withdrawn)',
    ],
    [
      'DL-2 Withdraw this update?',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'B6-09 `dlgW` `button.xr-btn--danger` (`Wd-u-wgo`; the reason is required → Withdrawn, f8)',
    ],
    [
      'In academic review (read-only)',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'B6-09 f3 `div.xw-actions > button.xr-btn--text.xg-del` → DL-2',
    ],
    [
      'No update open (B6-13 f0)',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-13 f0 `div.xr-empty a.xr-btn--secondary` (state-copy `CM-08.no-update`)',
    ],
    [
      'Failed state (an update)',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `CM-08.failed`',
    ],
  ]),
];
