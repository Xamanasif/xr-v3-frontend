import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const QUEUE = '/faculty/marking';
const SUBMISSION = '/faculty/marking/ATT-0450';
/** The next waiting answer “Mark next” and “Next submission” open (B4-09 f2 caption “→ Priya”). */
const NEXT_SUBMISSION = '/faculty/marking/ATT-0451';

/**
 * Phase 4B link targets: FA-18 Marking queue and FA-19 Mark a submission (B4-09). Each page has one
 * primary: FA-18’s “Mark next” (the oldest waiting answer) and FA-19’s “Confirm marks” (a command,
 * through DL-1). Attempts are addressed by id; the sample’s ATT-0450 (Rahul) and ATT-0451 (Priya)
 * stand for any attempt.
 */
export const P4B_MARKING_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-18 Marking queue (B4-09 f0, f4, f5).
  ...pageRows('FA-18', QUEUE, [
    [
      'Header',
      'Mark next',
      'primary',
      NEXT_SUBMISSION,
      'built',
      'B4-09 f0, f4 `div.xr-phead-actions > a.xr-btn--primary` (shown while an answer waits; state-copy `FA-18.mark-next`)',
    ],
    [
      'Toolbar',
      'Assessment / Waiting · Marked · All',
      'secondary',
      null,
      'in-page',
      'B4-09 f0 `div.xr-toolbar` (`select#Qq-as`, `div.xr-seg`; the address mirrors `?assessmentId=`, `?state=`)',
    ],
    [
      'Written answer row (waiting)',
      'Mark',
      'secondary',
      SUBMISSION,
      'built',
      'B4-09 f0, f4 `a.xr-btn--secondary.xr-btn--sm` (named “Mark <student>”)',
    ],
    [
      'Written answer row (marked)',
      'View',
      'secondary',
      SUBMISSION,
      'built',
      'B4-09 script `r.act` “View” (named “View marks for <student>”; state-copy `FA-18.view`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-18.failed`'],
  ]),
  // FA-19 Mark a submission (B4-09 f1 … f3, f7, f8).
  ...pageRows('FA-19', SUBMISSION, [
    ['Back link', 'Marking', 'secondary', QUEUE, 'built', 'B4-09 f1, f2, f3, f7, f8 `a.xr-back`'],
    [
      'Marking guidance',
      'Marking guidance',
      'secondary',
      null,
      'in-page',
      'B4-09 f1 `details.xa-guide > summary` (open as drawn; collapses in place)',
    ],
    [
      'Your mark panel',
      'Confirm marks',
      'primary',
      null,
      'in-page',
      'B4-09 f1, f3, f7, f8 `button.xr-btn--primary.xr-btn--block` → DL-1 (`Mm-ct`) “Confirm marks” → read-only (f2)',
    ],
    [
      'Your mark panel',
      'Save mark',
      'secondary',
      null,
      'in-page',
      'B4-09 f1, f3, f7, f8 `button.xr-btn--secondary.xr-btn--block` (“Mark saved — not confirmed yet”)',
    ],
    [
      'DL-1 Confirm marks',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B4-09 DL-1 `div.xr-dialog-foot` (nothing is confirmed)',
    ],
    [
      'Confirmed panel',
      'Next submission',
      'secondary',
      NEXT_SUBMISSION,
      'built',
      'B4-09 f2 `a.xr-btn--secondary.xr-btn--block` (caption “Next submission → Priya.”; none waiting → the queue, state-copy `FA-19.next`)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-19.failed`'],
  ]),
];
