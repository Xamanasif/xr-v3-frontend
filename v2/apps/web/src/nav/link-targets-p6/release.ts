import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const UPDATES = '/admin/content/updates';
const ALL_CONTENT = '/admin/content/all';
/** SA-11, by update id: the after-flow-e world's UPD-0005 (waiting) stands for any. */
const DECISION = '/admin/content/updates/UPD-0005';
/** SA-11 of an update on hold (UPD-0004 in every fixture world). */
const HELD = '/admin/content/updates/UPD-0004';

/**
 * SA-10 Content updates and SA-11 Release or hold an update in the owner-approved Super Admin
 * export (design/v3-refined-b/roles/SA-v1, `sa-views-c.js` `V.updates`, `V.update`; LINK-MAP
 * SA-10, SA-11). SA-10 draws no primary action: each row opens the decision. SA-11's one primary
 * is the panel's “Release update” / “Hold update” (a command, through its confirmation); on hold
 * the panel's one action is “Lift hold” (confirmed), and once released the panel is read-only.
 * Nothing on either page says “Publish”; no row or link is named by a reference.
 */
export const P6_RELEASE_LINK_TARGETS: readonly LedgerEntry[] = [
  // SA-10 Content updates (SA-v1 `V.updates`).
  ...pageRows('SA-10', UPDATES, [
    [
      'Page tabs',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-10 “Updates” tab (`nav.rk-tabs.sa-tabs > a.rk-tab[aria-current="page"]`)',
    ],
    [
      'Page tabs',
      'All content',
      'secondary',
      ALL_CONTENT,
      'built',
      'SA-v1 LINK-MAP SA-10 “All content” tab → SA-12',
    ],
    [
      'Segmented control',
      'Waiting for your decision · On hold · Released',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.updates` `seg` (`div.rb-switch[role=group] > button[aria-pressed]`; mirrored in `?show=`; state-copy `SA-10.show-address`)',
    ],
    [
      'Each row (waiting)',
      'Distillation Column correction, version 1.2 to 1.3, Waiting for your decision. Open',
      'secondary',
      DECISION,
      'built',
      'SA-v1 LINK-MAP SA-10 row link (`a.rk-rowlink`, the whole row) → SA-11',
    ],
    [
      'Each row (on hold, released)',
      'Boiler Drum Level correction, version 2.0 to 2.1, On hold. Open',
      'secondary',
      HELD,
      'built',
      'SA-v1 `V.updates` row link (`a.rk-rowlink`, the whole row) → SA-11',
    ],
    [
      'Failed state',
      'Try again',
      'secondary',
      null,
      'in-page',
      'SA-v1 `SA.listState` failed (`retryList`)',
    ],
  ]),
  // SA-11 Release or hold an update (SA-v1 `V.update`, `SA.DLG.releaseUpd`, `holdUpd`, `liftUpd`).
  ...pageRows('SA-11', DECISION, [
    [
      'Breadcrumb',
      'Content',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-11 breadcrumb → SA-10',
    ],
    [
      'Breadcrumb',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 LINK-MAP SA-11 breadcrumb → SA-10',
    ],
    [
      'Go to decision',
      'Go to decision',
      'secondary',
      '#update-decision',
      'in-page',
      'SA-v1 LINK-MAP SA-11 “Go to decision” → `#up-panel` (below 860 px of page width)',
    ],
    [
      'Your decision panel (choice)',
      'Release update / Hold',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.update` `label.rk-choice` (no choice is made for her: “Choose a decision”)',
    ],
    [
      'Your decision panel',
      'Release update · Hold update',
      'primary',
      null,
      'in-page',
      'SA-v1 `V.update` `button.rk-go` (`up-go`) → `SA.DLG.releaseUpd` “Release update” or `SA.DLG.holdUpd` “Hold update” with the reason → the flash and the decided panel',
    ],
    [
      'Release confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `dlg-cancel` (nothing is released)',
    ],
    [
      'Hold confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `dlg-cancel` (nothing is held)',
    ],
    [
      'On hold panel',
      'Lift hold',
      'secondary',
      null,
      'in-page',
      'SA-v1 `V.update` `button.rk-go` (`up-lift`) → `SA.DLG.liftUpd` → waiting again; no Release while held',
    ],
    [
      'Lift hold confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'SA-v1 `dialogHtml` `dlg-cancel` (the hold stays)',
    ],
    [
      'A refused decision',
      'Check it again',
      'secondary',
      null,
      'in-page',
      'SA-v1 `SA.refusalHtml` (`clearRefusal`: focus to the title; the words are state-copy `SA-11.stale.*`)',
    ],
    [
      'Released panel',
      'Back to Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 `V.update` released `rk-done` `a.rb-btn`',
    ],
    [
      'Nothing to decide (not approved yet)',
      'Back to Updates',
      'secondary',
      UPDATES,
      'built',
      'SA-v1 `V.update` `notForSA` (`V.message`, `a.rb-btn--primary`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `SA-11.failed`'],
  ]),
];
