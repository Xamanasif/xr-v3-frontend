import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const UPDATES = '/content-manager/updates';
const LIBRARY = '/content-manager/library';
/** CM-08, a correction’s page: the sample’s returned UPD-0006 (hers) and on-hold UPD-0004. */
const CORRECTION_HERS = '/content-manager/updates/UPD-0006';
const CORRECTION_WITH_OTHERS = '/content-manager/updates/UPD-0004';
/** RV-04, by update id: the sample’s UPD-0005 stands for any. */
const REVIEW_UPDATE = '/reviewer/updates/UPD-0005';
const QUEUE = '/reviewer/queue';

/**
 * Phase 6 link targets: CM-08 Updates (the list; V3: the export CM-v1) and RV-04 Review an
 * update (B6-04 f0 … f4, B6-13 f4, B7-11 f6). The update rows of RV-01, RV-02, RV-05 and CM-01 are
 * in their Phase-5 files (`link-targets-p5/reviewer-lists.ts`, `cm-lists.ts`), now built; CM-04’s
 * published row keeps its drawn “Open” to the published experiment (CM-05). The list's primary is
 * a Need-you card's “Continue” (CM-v1, one per card); RV-04’s one primary is the panel’s
 * “Approve update” / “Return to the Content Manager” (a command, through DL-1 or DL-2). Approving
 * releases and publishes nothing: Release / Hold is the Super Admin’s (SA-11).
 */
export const P6_REVIEW_UPDATE_LINK_TARGETS: readonly LedgerEntry[] = [
  // CM-08 Updates — V3 (CM-v1 `Main.dc.html` “CM-08 Updates list”; LINK-MAP “CM-08 Updates list”).
  ...pageRows('CM-08', UPDATES, [
    [
      'Need you (a draft or returned card)',
      'Continue',
      'primary',
      CORRECTION_HERS,
      'built',
      'CM-v1 `div.cm-trk-act a.rb-btn--primary` (named “Continue <UPD id>, <name>, <status>”; `openLink`; state-copy `CM-08.list.actions`); LINK-MAP → CM-08 “Update to …”',
    ],
    [
      'With others · Closed (every other card)',
      'Open',
      'secondary',
      CORRECTION_WITH_OTHERS,
      'built',
      'CM-v1 `div.cm-trk-act a.rb-btn` (named “Open <UPD id>, <name>, <status>”; `openLink`); LINK-MAP → CM-08 “Update to …”',
    ],
    [
      'Empty',
      'Open the Content library',
      'secondary',
      `${LIBRARY}?tab=published`,
      'built',
      'CM-v1 `U.empty` `div.rk-state a.rb-btn` (`goLibraryPublished`)',
    ],
    [
      'Couldn’t load (the list)',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 `U.lsFailed` `button#cm-upd-retry` (`lsRetry`: reads the list again, focus to the page title; state-copy `CM-08.list.failed`)',
    ],
  ]),
  // RV-04 Review an update (B6-04 f0 … f4; B6-13 f4; B7-11 f6).
  ...pageRows('RV-04', REVIEW_UPDATE, [
    ['Back link', 'Review queue', 'secondary', QUEUE, 'built', 'B6-04 f0 … f4 `a.xr-back`'],
    [
      'Go to decision',
      'Go to decision',
      'secondary',
      null,
      'in-page',
      'B6-04 f2 … f4 `a.xr-jump` (below 860 px of content; focus to the panel)',
    ],
    [
      'Your decision panel (choice)',
      'Approve update / Return to the Content Manager',
      'secondary',
      null,
      'in-page',
      'B6-04 f0 … f2 `label.xr-choice` (Approve update chosen first)',
    ],
    [
      'Your decision panel',
      'Approve update · Return to the Content Manager',
      'primary',
      null,
      'in-page',
      'B6-04 f0 … f2 `button.xr-btn--primary.xr-btn--block` (`Um-r-go`) → DL-1 “Approve UPD-0005?” or DL-2 “Return to the Content Manager?” → the decided panel (f3, f4)',
    ],
    [
      'DL-1 Approve',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-04 `dlgRA` `div.xr-dialog-foot` (nothing is approved)',
    ],
    [
      'DL-2 Return',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B6-04 `dlgRR` `div.xr-dialog-foot` (nothing is returned)',
    ],
    [
      'Decided panel',
      'Back to the review queue',
      'secondary',
      QUEUE,
      'built',
      'B6-04 f3, f4; B7-11 f6 `#Um-r-dec a.xr-btn--secondary.xr-btn--block`',
    ],
    [
      'Not sent yet',
      'Open the review queue',
      'secondary',
      QUEUE,
      'built',
      'B6-04 `rvNone`; B6-13 f4 `div.xr-empty a.xr-btn--secondary` (state-copy `RV-04.not-sent`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-04.failed`'],
  ]),
];
