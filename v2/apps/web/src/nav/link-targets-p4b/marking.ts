import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const QUEUE = '/faculty/marking';
const SUBMISSION = '/faculty/marking/ATT-0450';
/** The next waiting answer “Mark next” and “Next submission” open (the walk’s Priya). */
const NEXT_SUBMISSION = '/faculty/marking/ATT-0451';
/** The assessment’s Submissions (FA-12), “See submissions”. */
const SUBMISSIONS = '/faculty/assessments/ASMT-0009/submissions';

/**
 * The link targets of FA-18 Marking queue and FA-19 Mark a submission (V3 Refined B, the
 * owner-approved Faculty export FA-v1 `Main.dc.html` FA-18, FA-19; LINK-MAP.json). FA-18’s one
 * primary is “Mark next” (the oldest waiting answer); FA-19’s is “Confirm marks” (a command,
 * through the dialog) while it waits and “Next submission” once confirmed. Attempts are addressed
 * by id (never shown); the sample’s ATT-0450 (Rahul) and ATT-0451 (Priya) stand for any attempt.
 */
export const P4B_MARKING_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-18 Marking queue (FA-v1 FA-18; boards FA18-Marking, FA18-All, FA18-Nothing-waiting).
  ...pageRows('FA-18', QUEUE, [
    [
      'Toolbar',
      'Mark next',
      'primary',
      NEXT_SUBMISSION,
      'built',
      'FA-v1 FA-18 `div.fa-tbar-act > a.rb-btn.rb-btn--primary.rb-btn--lg` (shown while an answer waits; state-copy `FA-18.mark-next`); LINK-MAP FA-18 “Mark next” → FA-19',
    ],
    [
      'Toolbar',
      'Assessment / Waiting · Marked · All',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-18 `div.rk-tools.fa-mqtools` (`select#fa-mq-asm`, `div.fa-seg.fa-seg--bar`; the address mirrors `?assessmentId=`, `?state=`)',
    ],
    [
      'Written answer row (waiting)',
      'Mark',
      'secondary',
      SUBMISSION,
      'built',
      'FA-v1 FA-18 `div.fa-cellacts > a.rb-btn` (named “Mark <student>”); LINK-MAP FA-18 “Mark Rahul Verma” → FA-19',
    ],
    [
      'Written answer row (marked)',
      'View marks',
      'secondary',
      SUBMISSION,
      'built',
      'FA-v1 FA-18 `a.rb-btn.rb-btn--ghost` (named “View marks for <student>”; state-copy `FA-18.view`); LINK-MAP FA-18 → FA-19',
    ],
    [
      'No match',
      'Show all written answers',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-18 `MQ.showAll` (All, All assessments; focus to “Written answers”)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-18.failed`'],
  ]),
  // FA-19 Mark a submission (FA-v1 FA-19; boards FA19-Mark … FA19-Released).
  ...pageRows('FA-19', SUBMISSION, [
    [
      'Breadcrumb',
      'Marking',
      'secondary',
      QUEUE,
      'built',
      'FA-v1 FA-19 `nav.rk-crumbs > a`; LINK-MAP FA-19 “Marking” → FA-18',
    ],
    [
      'Reading sheet',
      'Go to the marks',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-19 `p.fa-gomark > a.rb-link` (below 860 px; focus to the marks panel)',
    ],
    [
      'Marks panel',
      'Confirm marks',
      'primary',
      null,
      'in-page',
      'FA-v1 FA-19 `div.fa-confirm > button.rb-btn--primary.rb-btn--lg` → the dialog “Confirm marks” → read-only',
    ],
    [
      'Marks panel',
      'Save mark',
      'secondary',
      null,
      'in-page',
      'FA-v1 FA-19 `div.fa-save > button.rb-btn` (“Mark saved — not confirmed yet”)',
    ],
    [
      'Confirm marks dialog',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'FA-v1 dialog `#fa-dlg-cancel` (nothing is confirmed)',
    ],
    [
      'Confirmed panel',
      'Next submission',
      'primary',
      NEXT_SUBMISSION,
      'built',
      'FA-v1 FA-19 `div.fa-done-acts > a.rb-btn--primary.rb-btn--lg` (none waiting: “Nothing else is waiting for marking.”, state-copy `FA-19.next`); LINK-MAP FA-19 “Next submission” → FA-19',
    ],
    [
      'Confirmed panel',
      'See submissions',
      'secondary',
      SUBMISSIONS,
      'built',
      'FA-v1 FA-19 `div.fa-done-acts > a.rb-btn`; LINK-MAP FA-19 “See submissions” → FA-12',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-19.failed`'],
  ]),
];
