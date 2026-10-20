import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const UPDATES = '/content-manager/updates';
const LIBRARY = '/content-manager/library';
/** CM-05, by experiment id: Distillation Column stands for any published experiment. */
const PUBLISHED = '/content-manager/published/distillation-column';
/** CM-08 a correction, by update id: UPD-0005 stands for any. */
const UPDATE = '/content-manager/updates/UPD-0005';

/**
 * Link targets of the CM-08 correction page in V3 (the owner-approved export CM-v1, `Main.dc.html`
 * “CM-08 Correction detail” and its dialogs; LINK-MAP “CM-08 Detail · returned / · awaiting”): the
 * draft CM-06 “Edit catalogue details” and CM-07 “Edit delivery link” open on CM-05 (whose entries
 * are in `link-targets-p5/cm-decision.ts`) and every later state. The panel's one primary is “Send
 * for academic review” (a command, through its dialog); Save draft and Withdraw update are commands
 * too. A correction never says “Publish” (BC8).
 */
export const P6_CM_CORRECTION_LINK_TARGETS: readonly LedgerEntry[] = [
  ...pageRows('CM-08', UPDATE, [
    [
      'Breadcrumb',
      'Updates',
      'secondary',
      UPDATES,
      'built',
      'CM-v1 `nav.rk-crumbs` (`goUpdates`); LINK-MAP “CM-08 Detail · returned” → CM-08',
    ],
    [
      'Identity band',
      'Back to the published experiment',
      'secondary',
      PUBLISHED,
      'built',
      'CM-v1 `div.rb-id-act a.rb-btn` (`E.goExp`; “Back from the correction” on CM-05 while the update is open, state-copy `CM-05.back-from-correction`); LINK-MAP → CM-05',
    ],
    [
      'Identity band (below 860 px)',
      'Go to actions',
      'secondary',
      '#cm-u-panel',
      'in-page',
      'CM-v1 `a.rb-btn.rk-goto[href=#cm-u-panel]` (focus to the panel’s heading)',
    ],
    [
      'Stale notice',
      'Show where it is now',
      'secondary',
      null,
      'in-page',
      'CM-v1 `E.stale` `rk-notice-act button` (`reread`; state-copy `CM-08.stale`, `CM-08.moved-on`)',
    ],
    [
      'Arrival notice (CM-06, CM-07)',
      'Go to the catalogue details · Go to the web link',
      'secondary',
      null,
      'in-page',
      'CM-v1 `E.entryGo` (`goEntry`: focus the summary / the web link; state-copy `CM-08.arrival`); LINK-MAP commands “Go to the web link”',
    ],
    [
      'Your update panel: the check',
      'Say what changes and why · Enter the version label, for example 1.1 · Change at least one catalogue detail or delivery link',
      'secondary',
      null,
      'in-page',
      'CM-v1 `div.rk-errsum#cm-u-errs a` (`errList`: each link focuses its field; the change link the Summary)',
    ],
    [
      'Your update panel: save failed',
      'Try again',
      'secondary',
      null,
      'in-page',
      'CM-v1 `div.rk-errsum#cm-u-savefail button` (`E.save`; LINK-MAP commands “Save draft · Try again”)',
    ],
    [
      'Your update panel (draft, returned)',
      'Send for academic review',
      'primary',
      null,
      'in-page',
      'CM-v1 `button.rb-btn--primary.rk-go#cm-u-send` → the check or the dialog “Send UPD-… for academic review?” → In academic review',
    ],
    [
      'Your update panel (draft, returned)',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'CM-v1 `button.rb-btn.cm-wide#cm-u-save` (“Draft saved”; Saving… while it runs)',
    ],
    [
      'Your update panel (draft, returned)',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'CM-v1 `button.rb-btn--ghost.cm-wide#cm-u-wd` → the dialog “Withdraw UPD-…?”',
    ],
    [
      'Your update panel (in academic review)',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'CM-v1 `E.canWithdraw` `button.rb-btn.cm-wide#cm-u-wd` → the dialog “Withdraw UPD-…?”',
    ],
    [
      'Your update panel (read-only)',
      'Open the published experiment',
      'secondary',
      PUBLISHED,
      'built',
      'CM-v1 `a.rb-btn.cm-wide` (`E.goExp`); LINK-MAP “CM-08 Detail · awaiting” → CM-05',
    ],
    [
      'Send UPD-…? dialog',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'CM-v1 `#cm-dlg-send-cancel` (nothing is saved or sent; waits while sending)',
    ],
    [
      'Send UPD-…? dialog',
      'Send for academic review',
      'secondary',
      null,
      'in-page',
      'CM-v1 `#cm-dlg-send-ok` (saves the page, then sends it — state-copy `CM-08.send-saves-first`; Sending…)',
    ],
    [
      'Withdraw UPD-…? dialog',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'CM-v1 `#cm-dlg-wd-cancel` (nothing is withdrawn; waits while withdrawing)',
    ],
    [
      'Withdraw UPD-…? dialog',
      'Withdraw update',
      'secondary',
      null,
      'in-page',
      'CM-v1 `button.rb-btn--navy#cm-dlg-wd-ok` (the reason is required → Withdrawn; Withdrawing…)',
    ],
    [
      'No update open',
      'Open the Content library',
      'secondary',
      LIBRARY,
      'built',
      'B6-13 f0 (state-copy `CM-08.no-update`); CM-v1 draws no such page',
    ],
    [
      'Failed state (a correction)',
      'Try again',
      'secondary',
      null,
      'in-page',
      'state-copy `CM-08.failed` (the application’s record guard)',
    ],
  ]),
];
