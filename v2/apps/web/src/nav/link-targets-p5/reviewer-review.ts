import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const QUEUE = '/reviewer/queue';
const REVIEWED = '/reviewer/reviewed';
/** A submission with the reviewer (RV-03): the sample’s SUB-0086 stands for any. */
const REVIEW = '/reviewer/submissions/SUB-0086';
/** A decided submission (RV-06): the sample’s SUB-0074. */
const DECIDED = '/reviewer/submissions/SUB-0074';

/**
 * RV-03 Review a submission and RV-06 its decided state — the owner-approved Academic Reviewer
 * export (RV-v1 `RV.dc.html` item view; LINK-MAP RV-03, RV-06). RV-03’s one primary is the panel’s
 * button — Approve (the confirmation) or Return to vendor (completed in the panel), a command
 * either way; RV-06 draws no primary. Submissions are addressed by id; no visible word names one.
 */
export const P5_REVIEWER_REVIEW_LINK_TARGETS: readonly LedgerEntry[] = [
  // RV-03 Review a submission (RV03, RV03-outcomes, -recheck, -editing, -return-*, -confirm).
  ...pageRows('RV-03', REVIEW, [
    [
      'Breadcrumb',
      'Review queue',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 LINK-MAP RV-03 `nav.rk-crumbs a` (the parent list; the current crumb is the experiment)',
    ],
    [
      'Identity card, while the panel sits below the content',
      'Go to decision',
      'secondary',
      '#rv-panel',
      'in-page',
      'RV-v1 `a.rb-btn.rk-goto` (focus moves to the panel’s heading)',
    ],
    [
      'Identity card · On this page',
      'Re-check request · What changed · Learning outcomes · Description and documents · Formats and delivery · Review history',
      'secondary',
      null,
      'in-page',
      'RV-v1 `nav.rv-onpage a` (each section’s heading scrolls to the top and takes focus)',
    ],
    [
      'Your decision · Before you decide',
      'Add an outcome · Read why · See what changed',
      'secondary',
      null,
      'in-page',
      'RV-v1 `ul.rv-ready-list a` (the outcome field, or the section, takes focus)',
    ],
    [
      'Learning outcomes',
      'Move outcome <n> up · Move outcome <n> down',
      'secondary',
      null,
      'in-page',
      'RV-v1 `button.rv-ibtn` (disabled at the ends and while an outcome is edited)',
    ],
    [
      'Learning outcomes',
      'Edit',
      'secondary',
      null,
      'in-page',
      'RV-v1 `button.rv-ibtn-t` (named “Edit outcome <n>”) → the outcome’s field, “Save outcome” · “Cancel”',
    ],
    [
      'Learning outcomes',
      'Delete',
      'secondary',
      null,
      'in-page',
      'RV-v1 `button.rv-ibtn-t` (named “Delete outcome <n>”) → “Outcome <n> deleted.” · “Undo”',
    ],
    [
      'Learning outcomes',
      'Add outcome',
      'secondary',
      null,
      'in-page',
      'RV-v1 `div.rv-lo-addrow button.rb-btn`',
    ],
    [
      'Description and documents',
      '<preview label>',
      'secondary',
      null,
      'external',
      'RV-v1 `a.rv-filecard--link` (the vendor’s preview link, in a new tab, announced)',
    ],
    [
      'Formats and delivery · WEB',
      'Open web link',
      'secondary',
      null,
      'external',
      'RV-v1 `a.rb-btn.rv-ext` (the vendor’s web link, in a new tab, announced; T-30)',
    ],
    [
      'Formats and delivery · AR / VR / MR',
      'View package details · Hide package details',
      'secondary',
      null,
      'in-page',
      'RV-v1 `div.rv-dcard-act button[aria-expanded]` (package reference and install notes in place)',
    ],
    [
      'Your decision panel',
      'Approve · Return to vendor',
      'primary',
      null,
      'in-page',
      'RV-v1 `button#rv-go.rb-btn--primary.rk-go` → the confirmation (Approve) or the return, sent from the panel with its reason and references; errors in “Check your decision” (`div.rk-errsum` links focus their fields)',
    ],
    [
      'Approve confirmation',
      'Cancel · Approve',
      'secondary',
      null,
      'in-page',
      'RV-v1 `div.rk-dlg-foot` (“Approving does not publish.”; Approve sends the set, then the decided outcome)',
    ],
    [
      'Your decision · after deciding',
      'Back to the review queue',
      'secondary',
      QUEUE,
      'built',
      'RV-v1 `div.rk-done a.rb-btn` (`backLabel`, the parent list)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-03.failed`'],
  ]),
  // RV-06 Decided · read-only (RV06, RV06-returned, RV06-elsewhere).
  ...pageRows('RV-06', DECIDED, [
    [
      'Breadcrumb',
      'Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'RV-v1 LINK-MAP RV-06 `nav.rk-crumbs a` (a decided item sits under Reviewed by me)',
    ],
    [
      'Identity card, while the panel sits below the content',
      'Go to decision',
      'secondary',
      '#rv-panel',
      'in-page',
      'RV-v1 `a.rb-btn.rk-goto`',
    ],
    [
      'Identity card · On this page',
      'Learning outcomes · Description and documents · Formats and delivery · Review history',
      'secondary',
      null,
      'in-page',
      'RV-v1 `nav.rv-onpage a`',
    ],
    [
      'Description and documents',
      '<preview label>',
      'secondary',
      null,
      'external',
      'RV-v1 `a.rv-filecard--link` (the vendor’s preview link, in a new tab, announced; the decided page keeps the item view)',
    ],
    [
      'Formats and delivery · WEB',
      'Open web link',
      'secondary',
      null,
      'external',
      'RV-v1 `a.rb-btn.rv-ext` (in a new tab, announced)',
    ],
    [
      'Decided outcome',
      'Back to Reviewed by me',
      'secondary',
      REVIEWED,
      'built',
      'RV-v1 `div.rk-done a.rb-btn` (`backLabel`)',
    ],
  ]),
];
