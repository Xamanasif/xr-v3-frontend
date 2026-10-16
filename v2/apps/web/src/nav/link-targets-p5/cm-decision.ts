import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const READY = '/content-manager/ready';
const LIBRARY = '/content-manager/library';
/** CM-03, by submission id: the sample’s SUB-0074 (with the Content Manager) stands for any. */
const DECISION = '/content-manager/decisions/SUB-0074';
/** CM-05, by experiment id: Distillation Column stands for any published experiment. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** PU-06, the public page of the experiment just published (SUB-0074 → transient-cooling). */
const PUBLIC_EXPERIMENT = '/experiments/transient-cooling';
/** CM-06 / CM-07 correction draft and CM-08 Updates (Phase 6): not built. */
const UPDATE = '/content-manager/updates/UPD-0005';

/**
 * Phase 5 link targets: CM-03 Publication decision and CM-05 Published experiment (B6-07, B6-08,
 * B6-11). CM-03’s one primary is the panel’s “Publish” / “Send back” (a command, through DL-1 or
 * DL-2); the result links to the public page (state-copy `CM-03.published.view`), the Content
 * library or Ready to publish. CM-05’s correction entry — “Start a correction” (its primary),
 * “Edit catalogue details”, “Edit delivery link” and “Open update” — opens CM-06, CM-07 and CM-08,
 * which are Phase 6: drawn, not rendered (P0-35 / DEV-21; state-copy `CM-05.correction-entry`).
 */
export const P5_CM_DECISION_LINK_TARGETS: readonly LedgerEntry[] = [
  // CM-03 Publication decision (B6-07 f0 … f5; B6-11 f4 … f8).
  ...pageRows('CM-03', DECISION, [
    ['Back link', 'Ready to publish', 'secondary', READY, 'built', 'B6-07 f0 … f5 `a.xr-back`'],
    [
      'Go to decision',
      'Go to decision',
      'secondary',
      null,
      'in-page',
      'B6-07 f2 … f5 `a.xr-jump` (below 860 px of content; focus to the panel)',
    ],
    [
      'Your decision panel (choice)',
      'Publish / Send back',
      'secondary',
      null,
      'in-page',
      'B6-07 f0, f2 `label.xr-choice` (Publish unavailable while a check fails: `is-off`, f2)',
    ],
    [
      'Your decision panel',
      'Publish · Send back',
      'primary',
      null,
      'in-page',
      'B6-07 f0, f2, f5 `button.xr-btn--primary.xr-btn--block` (`Dm-cgo`) → DL-1 “Publish” (B6-11 f6) or DL-2 “Send back” (B6-11 f7) → the result (f4, B6-11 f8)',
    ],
    [
      'DL-1 Publish',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-11 f6 `div.xr-dialog-foot` (nothing is published)',
    ],
    [
      'DL-2 Send back',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-11 f7 `div.xr-dialog-foot` (nothing is sent)',
    ],
    [
      'Published result',
      'View in the catalogue',
      'secondary',
      PUBLIC_EXPERIMENT,
      'built',
      'Undrawn: state-copy `CM-03.published.view` (→ PU-06, B1-05; B6-12 f5, f6)',
    ],
    [
      'Published result',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-07 f4; B6-11 f8 `a.xr-btn--secondary.xr-btn--block`',
    ],
    [
      'Sent-back result',
      'Back to Ready to publish',
      'secondary',
      READY,
      'built',
      'B6-07 script `cmSent` `a.xr-btn--secondary.xr-btn--block`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-03.failed`'],
  ]),
  // CM-05 Published experiment (B6-08 f0 … f4; B6-11 f9).
  ...pageRows('CM-05', PUBLISHED, [
    ['Back link', 'Content library', 'secondary', LIBRARY, 'built', 'B6-08 f0 … f4 `a.xr-back`'],
    [
      'Correction entry (no update in progress)',
      'Start a correction',
      'primary',
      UPDATE,
      'not-rendered',
      'B6-08 f0, f4 `div.xw-actions > button.xr-btn--primary`',
      'The correction draft (CM-06, CM-08) is not built (Phase 6): the page shows the live version read-only (state-copy `CM-05.correction-entry`)',
    ],
    [
      'Correction entry',
      'Edit catalogue details',
      'secondary',
      UPDATE,
      'not-rendered',
      'B6-08 f0, f2, f4 `div.xw-actions > button.xr-btn--secondary`',
      'The correction draft (CM-07, CM-08) is not built (Phase 6)',
    ],
    [
      'Correction entry',
      'Edit delivery link',
      'secondary',
      UPDATE,
      'not-rendered',
      'B6-08 f0, f2, f4 `div.xw-actions > button.xr-btn--secondary`',
      'The correction draft (CM-07, CM-08) is not built (Phase 6)',
    ],
    [
      'An update is in progress (notice; draft actions)',
      'Open update',
      'secondary',
      UPDATE,
      'not-rendered',
      'B6-08 f1 `div.xr-notice-actions > button.xr-btn--primary.xr-btn--sm`, f2 `div.xw-actions`; B6-11 f9',
      'Updates (CM-08) is not built (Phase 6): the notice names the update and its state without the action',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-05.failed`'],
  ]),
];
