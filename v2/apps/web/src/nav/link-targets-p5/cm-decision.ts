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
/** CM-08 an update (Phase 6): the draft CM-06 / CM-07 open, by update id — UPD-0005 stands for any. */
const UPDATE = '/content-manager/updates/UPD-0005';

/**
 * Phase 5 link targets: CM-03 Publication decision and CM-05 Published experiment (B6-07, B6-08,
 * B6-11). CM-03’s one primary is the panel’s “Publish” / “Send back” (a command, through DL-1 or
 * DL-2); the result links to the public page (state-copy `CM-03.published.view`), the Content
 * library or Ready to publish. CM-05’s correction entry — “Start a correction” (its primary),
 * “Edit catalogue details” (CM-06) and “Edit delivery link” (CM-07) — opens or joins the one
 * correction draft (a command) and lands on its update page (CM-08, built in Phase 6) with the
 * named field focused; “Open update” (the primary while an update is in progress) only opens it
 * (state-copy `CM-05.correction-entry`, `CM-05.entry-opens`).
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
      'built',
      'B6-08 f0, f4; B6-13 f1 `div.xw-actions > button.xr-btn--primary` (opens the one draft — `openCorrection` — then its update page)',
    ],
    [
      'Correction entry',
      'Edit catalogue details',
      'secondary',
      `${UPDATE}?focus=summary`,
      'built',
      'B6-08 f0, f2, f4 `div.xw-actions > button.xr-btn--secondary` (CM-06: opens or joins the draft, the summary focused)',
    ],
    [
      'Correction entry',
      'Edit delivery link',
      'secondary',
      `${UPDATE}?focus=web-link`,
      'built',
      'B6-08 f0, f2, f4 `div.xw-actions > button.xr-btn--secondary` (CM-07: opens or joins the draft, the web link focused)',
    ],
    [
      'An update is in progress (notice f1; draft actions f2)',
      'Open update',
      'primary',
      UPDATE,
      'built',
      'B6-08 f1 `div.xr-notice-actions > button.xr-btn--primary.xr-btn--sm`, f2 `div.xw-actions > button.xr-btn--primary`; B6-11 f9; B7-11 f4 (a link drawn as the button)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `CM-05.failed`'],
  ]),
];
