import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const UPDATES = '/admin/content/updates';
const ALL_CONTENT = '/admin/content/all';
/** SA-11, by update id: the after-flow-e world's UPD-0005 (waiting) stands for any. */
const DECISION = '/admin/content/updates/UPD-0005';
/** SA-11 of an update on hold (UPD-0004 in every fixture world). */
const HELD = '/admin/content/updates/UPD-0004';

/**
 * Phase 6 link targets: SA-10 Content › Updates and SA-11 Release or hold an update (B7-05,
 * B7-10 f0 … f4, B7-11). SA-10 draws no primary action: its rows open the decision (“Review” on a
 * waiting row, “Open” otherwise). SA-11's one primary is the panel's “Release update” / “Hold” (a
 * command, through DL-1 or DL-2); on hold the only action is “Lift hold” (DL-1), and once
 * released the panel is read-only. Nothing on either page says “Publish”.
 */
export const P6_RELEASE_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-10 Content › Updates (B7-05 f0, f2, f3, f4; B7-11 f0).
  ...pageRows('SA-10', UPDATES, [
    [
      'Sub-navigation',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'B7-05 f0 … f4 `nav.xr-tabs > a.xr-tab[aria-current="page"]`',
    ],
    [
      'Sub-navigation',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'B7-05 f0 … f4 `nav.xr-tabs > a.xr-tab` (SA-12)',
    ],
    [
      'Status tabs',
      'Waiting for you · On hold · Released',
      'secondary',
      null,
      'in-page',
      'B7-05 f0, f2, f3 `div.xr-tabs[role="tablist"] > button.xr-tab` (mirrored in `?show=`; state-copy `SA-10.show-address`)',
    ],
    [
      'Waiting row',
      'Review',
      'secondary',
      DECISION,
      'built',
      'B7-05 f0; B7-11 f0 `a.xr-btn--secondary.xr-btn--sm` (SA-11)',
    ],
    [
      'On hold · Released row',
      'Open',
      'secondary',
      HELD,
      'built',
      'B7-05 f2, f3 `a.xr-btn--secondary.xr-btn--sm` (SA-11)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-10.failed`'],
  ]),
  // SA-11 Release or hold an update (B7-05 f1, f5 … f11; B7-10 f0 … f4; B7-11 f1; B7-12 f0 … f3).
  ...pageRows('SA-11', DECISION, [
    ['Back link', 'Updates', 'secondary', UPDATES, 'built', 'B7-05 f1, f5 … f11 `a.xr-back`'],
    [
      'Go to decision',
      'Go to decision',
      'secondary',
      null,
      'in-page',
      'B7-05 f11; B7-12 f2, f3 `a.xr-jump` (below 860 px of content; focus to the panel)',
    ],
    [
      'Your decision panel (choice)',
      'Release update / Hold',
      'secondary',
      null,
      'in-page',
      'B7-05 f1, f7 `label.xr-choice`',
    ],
    [
      'Your decision panel',
      'Release update · Hold',
      'primary',
      null,
      'in-page',
      'B7-05 f1, f7 `button.xr-btn--primary.xr-btn--block` (`Wm-sgo`) → DL-1 “Release update” (f8; B7-10 f0) or DL-2 “Hold” with a reason (f9; B7-10 f1) → the decided panel (f6, f5)',
    ],
    [
      'DL-1 Release',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B7-05 f8; B7-10 f0 `div.xr-dialog-foot` (nothing is released)',
    ],
    [
      'DL-2 Hold',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B7-05 f9; B7-10 f1 `div.xr-dialog-foot` (nothing is held)',
    ],
    [
      'On hold panel',
      'Lift hold',
      'secondary',
      null,
      'in-page',
      'B7-05 f5; B7-10 f2 `button.xr-btn--secondary.xr-btn--block` → DL-1 “Lift hold” → waiting again (f7); no Release while held',
    ],
    [
      'DL-1 Lift hold',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B7-05 script `dLift` `div.xr-dialog-foot` (the hold stays)',
    ],
    [
      'Nothing to decide (not approved yet)',
      'Back to Updates',
      'secondary',
      UPDATES,
      'built',
      'B7-05 f10; B7-10 f4 `a.xr-btn--secondary`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-11.failed`'],
  ]),
];
