import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const UPDATES = '/content-manager/updates';
const LIBRARY = '/content-manager/library';
/** CM-08, a correction’s page: the sample’s returned UPD-0006 (hers) and on-hold UPD-0004. */
const CORRECTION_HERS = '/content-manager/updates/UPD-0006';
const CORRECTION_WITH_OTHERS = '/content-manager/updates/UPD-0004';
/** RV-04, by update id: the sample’s UPD-0005 stands for any (the reference stays in the address only). */
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
      'CM-v1 `div.cm-trk-act a.rb-btn--primary` (named “Continue the update to <name>, version <label>, <status>” — never by its reference, `CM-08.no-reference`; `openLink`; state-copy `CM-08.list.actions`); LINK-MAP → CM-08 “Update to …”',
    ],
    [
      'With others · Closed (every other card)',
      'Open',
      'secondary',
      CORRECTION_WITH_OTHERS,
      'built',
      'CM-v1 `div.cm-trk-act a.rb-btn` (named “Open the update to <name>, version <label>, <status>” — never by its reference, `CM-08.no-reference`; `openLink`); LINK-MAP → CM-08 “Update to …”',
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
  // RV-04 Review an update — V3 (RV-v1 `RV.dc.html` item view for an update; LINK-MAP RV-04).
  ...pageRows('RV-04', REVIEW_UPDATE, [
    [
      'Breadcrumb (the parent list)',
      'Review queue',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 `nav.rk-crumbs a` (`I.back`, `parentOf`: the Review queue while it waits, else Reviewed by me); the current crumb is the experiment’s name, never its reference',
    ],
    [
      'Identity card',
      'Go to decision',
      'secondary',
      null,
      'in-page',
      'RV-v1 `a.rb-btn.rk-goto` (while the panel sits below the content; focus to the panel heading)',
    ],
    [
      'Identity card (page map)',
      'Why this correction · What changes · Live experiment · Update history',
      'secondary',
      null,
      'in-page',
      'RV-v1 `nav.rv-onpage a` (`goAnchor`: the section heading to the top, focused)',
    ],
    [
      'Before you decide',
      'See what changes',
      'secondary',
      null,
      'in-page',
      'RV-v1 `div.rv-ready a` (`#rv-s-cmp`)',
    ],
    [
      'Your decision panel (choice)',
      'Approve update / Return to the Content Manager',
      'secondary',
      null,
      'in-page',
      'RV-v1 `label.rk-choice` (no choice at first; state-copy `RV-04.choice`)',
    ],
    [
      'Your decision panel',
      'Approve update · Return to the Content Manager',
      'primary',
      null,
      'in-page',
      'RV-v1 `button#rv-go.rb-btn--primary.rk-go` (`go`) → Approve: the confirmation “Approve the update to <experiment>?”; Return: sent at once with the reason in the panel (state-copy `RV-04.return-reason`) → the outcome (`#rv-done`)',
    ],
    [
      'Check your decision',
      'Choose a decision · Add a reason so the Content Manager knows what to change',
      'secondary',
      null,
      'in-page',
      'RV-v1 `div#rv-errs.rk-errsum a` (focus to the field)',
    ],
    [
      'Approve confirmation',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'RV-v1 `rk-dialog` `#rv-dlg-cancel` (nothing is approved; focus back on the button); its “Approve update” (`#rv-dlg-ok`, `doConfirm`) records the approval — the panel’s primary, confirmed',
    ],
    [
      'Decided outcome',
      'Back to the review queue / Back to Reviewed by me',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 `div.rk-done a.rb-btn` (`backLabel`, by the breadcrumb’s parent: Reviewed by me → /reviewer/reviewed)',
    ],
    [
      'Not sent yet',
      'Open the review queue',
      'secondary',
      QUEUE,
      'built',
      'XS-v6 `XsMessage` action (state-copy `RV-04.not-sent`; the product’s words kept; the ledger keeps one primary per page: the decision)',
    ],
    [
      'Not sent yet',
      'Help',
      'secondary',
      '/reviewer/help',
      'built',
      'XS-v6 `XsMessage` quiet link (state-copy `RV-04.not-sent`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-04.failed`'],
  ]),
];
