import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const QUEUE = '/reviewer/queue';
/** A submission with the reviewer (RV-03): the sample’s SUB-0086 stands for any. */
const REVIEW = '/reviewer/submissions/SUB-0086';
/** A decided submission (RV-06, B6-03 f4): the sample’s SUB-0074. */
const DECIDED = '/reviewer/submissions/SUB-0074';

/**
 * Phase 5 link targets: RV-03 Review a submission and RV-06 its decided state (B6-03 f0 … f5,
 * B6-11 f0 … f3, B6-12 f1). RV-03’s one primary is the panel’s button — Approve (DL-1) or Return to
 * vendor (DL-2), a command either way; RV-06 draws no primary. Submissions are addressed by id.
 */
export const P5_REVIEWER_REVIEW_LINK_TARGETS: readonly LedgerEntry[] = [
  // RV-03 Review a submission (B6-03 f0 … f3, f5; B6-11 f0 … f3).
  ...pageRows('RV-03', REVIEW, [
    ['Back link', 'Review queue', 'secondary', QUEUE, 'built', 'B6-03 f0 … f5 `a.xr-back`'],
    [
      'Below 860 px of content',
      'Go to decision',
      'secondary',
      '#rv-decision',
      'in-page',
      'B6-03 f2, f3, f5 `a.xr-jump` (focus moves to the panel)',
    ],
    [
      'Learning outcomes',
      'Move outcome <n> up · Move outcome <n> down',
      'secondary',
      null,
      'in-page',
      'B6-03 f0, f3 `button.xg-icobtn` (`aria-disabled` at the ends)',
    ],
    [
      'Learning outcomes',
      'Edit',
      'secondary',
      null,
      'in-page',
      'B6-03 f0, f3 `button.xr-btn--text` (named “Edit outcome <n>”) → the outcome’s field, “Save outcome” · “Cancel”',
    ],
    [
      'Learning outcomes',
      'Delete',
      'secondary',
      null,
      'in-page',
      'B6-03 f0, f3 `button.xg-del` (named “Delete outcome <n>”) → “Outcome <n> deleted.” · “Undo”',
    ],
    [
      'Learning outcomes',
      'Add outcome',
      'secondary',
      null,
      'in-page',
      'B6-03 f0, f2, f3, f5 `div.xg-addlo button.xr-btn--secondary`',
    ],
    [
      'Formats and delivery · WEB',
      'Open web link',
      'secondary',
      null,
      'external',
      'B6-03 f0 … f5 `a.xr-btn--secondary.xr-btn--sm` (the vendor’s web link, in a new tab, announced; T-30)',
    ],
    [
      'Formats and delivery · AR / VR / MR',
      'View package details · Hide package details',
      'secondary',
      null,
      'in-page',
      'B6-03 f0, f3 `button.xr-btn--text[aria-expanded]` (package reference and install notes in place)',
    ],
    [
      'Your decision panel',
      'Approve · Return to vendor',
      'primary',
      null,
      'in-page',
      'B6-03 f0 … f3, f5 `button#Rm-rgo.xr-btn--primary.xr-btn--block` → DL-1 (B6-11 f0) or DL-2 (B6-11 f1); with no outcome, “Add at least one learning outcome before you approve” (B6-11 f2)',
    ],
    [
      'DL-1 Approve',
      'Cancel · Approve',
      'secondary',
      null,
      'in-page',
      'B6-11 f0 `div.xr-dialog-foot` (“Approving does not publish it.”; Approve sends the set, then RV-06)',
    ],
    [
      'DL-2 Return to vendor',
      'Cancel · Return to vendor',
      'secondary',
      null,
      'in-page',
      'B6-11 f1 `div.xr-dialog-foot` (a reason is required; references optional; then RV-06)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `RV-03.failed`'],
  ]),
  // RV-06 Decided · read-only (B6-03 f4).
  ...pageRows('RV-06', DECIDED, [
    ['Back link', 'Review queue', 'secondary', QUEUE, 'built', 'B6-03 f4 `a.xr-back`'],
    [
      'Below 860 px of content',
      'Go to decision',
      'secondary',
      '#rv-decision',
      'in-page',
      'B6-03 f4 `a.xr-jump`',
    ],
    [
      'Formats and delivery · WEB',
      'Open web link',
      'secondary',
      null,
      'external',
      'B6-03 f4 `a.xr-btn--secondary.xr-btn--sm` (in a new tab, announced)',
    ],
    [
      'Decided panel',
      'Back to the review queue',
      'secondary',
      QUEUE,
      'built',
      'B6-03 f4 `a.xr-btn--secondary.xr-btn--block`',
    ],
  ]),
];
