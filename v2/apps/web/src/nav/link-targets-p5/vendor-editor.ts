import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const LIST = '/vendor/experiments';
const NEW = '/vendor/experiments/new';
/** The sample’s records stand for any: SUB-0079 a draft (VE-09), SUB-0081 returned (VE-08). */
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const REVISE = '/vendor/experiments/SUB-0081/revise';
/** The record a first submit or a resubmit opens (Flow E’s SUB-0077). */
const RECORD = '/vendor/experiments/SUB-0077';
const HELP = '/vendor/help';

/** The editor’s frame on every step: the back link to My experiments. */
const TOP: PageRow = [
  'Top',
  'My experiments',
  'secondary',
  LIST,
  'built',
  'B5-03 … B5-05, B5-07 `a.xr-back`',
];

const SUMMARY: PageRow = [
  'Check this step (error summary)',
  '<field error>',
  'secondary',
  '#Ve-course',
  'in-page',
  'B5-03 f3, f4, f5; B5-04 f4, f5; B5-05 f4 `div.xw-errsum li a` (moves focus to the field)',
];

const FAILED: PageRow = [
  'Failed state',
  'Try again',
  'secondary',
  null,
  'in-page',
  'state-copy `VE-03.failed`',
];

/** Steps 2–4: Back and the save action (Save draft; Save changes when revising, B5-07). */
function stepActions(board: string): PageRow[] {
  return [
    [
      'Footer',
      'Back',
      'secondary',
      null,
      'in-page',
      `${board} \`button.xr-btn--text\` (the step before)`,
    ],
    [
      'Footer',
      'Save draft · Save changes',
      'secondary',
      null,
      'in-page',
      `${board} \`button.xr-btn--secondary\` (saveDraft, or saveRevision in revise mode: “Changes saved · … · not resubmitted yet”)`,
    ],
  ];
}

const CONTINUE = (board: string): PageRow => [
  'Footer',
  'Continue',
  'primary',
  null,
  'in-page',
  `${board} \`button.xr-btn--primary\` (the step’s check, then continueStep; the next \`?step=\`)`,
];

/** VE-06’s rows, also VE-08’s step 4 (B5-07 f3). */
const CHECK_ROWS: PageRow[] = [
  ...stepActions('B5-05 f0, f2, f5'),
  [
    'Footer',
    'Submit for academic review · Resubmit',
    'primary',
    null,
    'in-page',
    'B5-05 f0, f2 `button#Vm-sbtn.xr-btn--primary` → DL-1; with something missing, the list (f5). B5-07 f3 “Resubmit”',
  ],
  [
    'Checklist row',
    'Change',
    'secondary',
    null,
    'in-page',
    'B5-05 f0, f5 `li.xv-check-row > button.xr-btn--text` (named “Change course and description” …; the step)',
  ],
  [
    'Missing items (f5)',
    'Go to <step>',
    'secondary',
    null,
    'in-page',
    'B5-05 f5 `ul.xv-miss button.xr-btn--text` (the step with its errors, focus on the field)',
  ],
  [
    'DL-1 Submit for academic review · Resubmit your changes',
    'Cancel · Keep editing',
    'secondary',
    null,
    'in-page',
    'B5-05 f6; B5-07 DL-1 `div.xr-dialog-foot > button.xr-btn--secondary` (nothing is sent)',
  ],
  [
    'Submitted (f1) · Submitted (B5-07 f4)',
    'Open the experiment record',
    'primary',
    RECORD,
    'built',
    'B5-05 f1; B5-07 f4 `div.xr-msg-actions > a.xr-btn--primary`',
    'VE-07 Experiment record (Phase 5).',
  ],
  [
    'Submitted (f1) · Submitted (B5-07 f4)',
    'Back to My experiments',
    'secondary',
    LIST,
    'built',
    'B5-05 f1; B5-07 f4 `div.xr-msg-actions > a.xr-btn--text`',
  ],
];

/**
 * Phase 5 link targets: the experiment editor — VE-03 … VE-06 for a new experiment (B5-03 … B5-05,
 * `?step=` rule S1), VE-09 a saved draft and VE-08 a returned one (B5-07). Each step has one
 * primary: “Continue” (steps 1–3, a command that opens the next `?step=`), “Submit for academic
 * review” / “Resubmit” (step 4, through DL-1), and the result’s “Open the experiment record”. The
 * read-only draft (B5-07 f6) has none. Documents and package files are file names only: “Choose
 * file” and “Add document” upload nothing (OD-B5-11).
 */
export const P5_VENDOR_EDITOR_LINK_TARGETS: readonly LedgerEntry[] = [
  // VE-03 Course and description (B5-03 f0 … f6).
  ...pageRows('VE-03', NEW, [
    TOP,
    [
      'Footer',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'B5-03 f0 … f6 `a.xr-btn--text` (drops what was typed, state-copy `VE-03.kept`)',
    ],
    [
      'Footer',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'B5-03 f0, f6 `button.xr-btn--secondary` (the first save gives the id: `/vendor/experiments/SUB-0077/edit`, state-copy `VE-03.first-save`)',
    ],
    CONTINUE('B5-03 f0 … f5'),
    SUMMARY,
    FAILED,
  ]),
  // VE-04 Formats and delivery (B5-04 f0 … f6).
  ...pageRows('VE-04', `${NEW}?step=formats`, [
    TOP,
    ...stepActions('B5-04 f0 … f6'),
    CONTINUE('B5-04 f0 … f6'),
    [
      'Formats it supports',
      'WEB · AR · VR · MR',
      'secondary',
      null,
      'in-page',
      'B5-04 f0 `div.xv-fmtchecks label.xr-check` (one panel per ticked format)',
    ],
    [
      'Package panel',
      'Choose file',
      'secondary',
      null,
      'in-page',
      'B5-04 f3, f4 `button.xr-btn--secondary.xr-btn--sm` (a sample file name only, state-copy `VE-04.sample-file`)',
    ],
    [
      'Package panel',
      'Remove',
      'secondary',
      null,
      'in-page',
      'B5-04 f1 `div.xv-file > button.xr-btn--text` (named “Remove the VR package file”)',
    ],
    SUMMARY,
  ]),
  // VE-05 Preview and documents (B5-05 f3, f4).
  ...pageRows('VE-05', `${NEW}?step=preview`, [
    TOP,
    ...stepActions('B5-05 f3, f4'),
    CONTINUE('B5-05 f3, f4'),
    [
      'Documents',
      'Add document',
      'secondary',
      null,
      'in-page',
      'B5-05 f3, f4 `button.xr-btn--secondary.xr-btn--sm` (the next sample name, state-copy `VE-05.sample-documents`)',
    ],
    [
      'Documents',
      'Remove',
      'secondary',
      null,
      'in-page',
      'B5-05 f4 `li.xv-file > button.xr-btn--text` (named “Remove <file name>”)',
    ],
    SUMMARY,
  ]),
  // VE-06 Check and submit (B5-05 f0 … f2, f5, f6).
  ...pageRows('VE-06', `${NEW}?step=submit`, [TOP, ...CHECK_ROWS]),
  // VE-09 Edit draft (B5-07 f5; B5-03 f6): the same four steps; read-only when the course is no
  // longer assigned (B5-07 f6).
  ...pageRows('VE-09', EDIT_DRAFT, [
    TOP,
    [
      'Footer',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'B5-03 f6; B5-07 f5 `a.xr-btn--text` (drops what was typed since the last save)',
    ],
    [
      'Footer',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'B5-03 f6; B5-07 f5 `button.xr-btn--secondary` (“Draft saved · <date, time>”)',
    ],
    CONTINUE('B5-07 f5'),
    SUMMARY,
    [
      'Read-only (course no longer assigned)',
      'Back to My experiments',
      'secondary',
      LIST,
      'built',
      'B5-07 f6 `div.xw-actions > a.xr-btn--secondary`',
    ],
    [
      'Read-only (course no longer assigned)',
      'Ask for help',
      'secondary',
      HELP,
      'built',
      'B5-07 f6 `div.xw-actions > a.xr-btn--text`',
    ],
    [
      'Not editable here (with others)',
      'Open the experiment record',
      'secondary',
      '/vendor/experiments/SUB-0074',
      'built',
      'B5-07 script idle notices `div.xr-notice-actions > a.xr-btn--secondary.xr-btn--sm` (state-copy `VE-09.not-editable-title`)',
    ],
    FAILED,
  ]),
  // VE-08 Revise and resubmit (B5-07 f0 … f4, f7, f8; B5-08 f0).
  ...pageRows('VE-08', REVISE, [
    TOP,
    [
      'Returned notice',
      '<what it refers to>',
      'secondary',
      null,
      'in-page',
      'B5-07 f0, f1, f2 `div.xv-refs button.xr-btn--text` (named “Go to Formats & delivery · AR · Device need”; the step and the field, state-copy `VE-08.reference-jump`)',
    ],
    [
      'Footer (step 1)',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'B5-07 f0 `a.xr-btn--text` (drops what was typed since the last save)',
    ],
    [
      'Footer (step 1)',
      'Save changes',
      'secondary',
      null,
      'in-page',
      'B5-07 f0 `button.xr-btn--secondary` (saveRevision: “Changes saved · … · not resubmitted yet”)',
    ],
    CONTINUE('B5-07 f0 … f2'),
    SUMMARY,
    ...CHECK_ROWS.map(([where, action, role, target, outcome, board, note]): PageRow =>
      note === undefined
        ? [`Step 4 · ${where}`, action, role, target, outcome, board]
        : [`Step 4 · ${where}`, action, role, target, outcome, board, note],
    ),
    FAILED,
  ]),
];
