import type { LedgerEntry } from '../link-targets';
import { type PageRow, pageRows } from '../link-targets-p3/rows';

const LIST = '/vendor/experiments';
const NEW = '/vendor/experiments/new';
/** The sample's records stand for any: SUB-0079 a draft (VE-09), SUB-0081 returned (VE-08). */
const EDIT_DRAFT = '/vendor/experiments/SUB-0079/edit';
const REVISE = '/vendor/experiments/SUB-0081/revise';
/** The record a first submit or a resubmit opens (Flow E's SUB-0077). */
const RECORD = '/vendor/experiments/SUB-0077';
/** Report a problem (XS-07), its “Where” filled from the page the person came from. */
const REPORT = '/vendor/help/report';

/** The editor's breadcrumbs on every step: My experiments (guarded while changes are unsaved). */
const CRUMB: PageRow = [
  'Breadcrumbs',
  'My experiments',
  'secondary',
  LIST,
  'built',
  'VE-v1 LINK-MAP L30 `nav.rk-crumbs` (“Leave without saving?” first while changes are unsaved, state-copy `VE-04.leave-guard`)',
];

/** A saved experiment's breadcrumb: its record (VE-07). */
const RECORD_CRUMB = (record: string): PageRow => [
  'Breadcrumbs (saved experiment)',
  '<experiment name>',
  'secondary',
  record,
  'built',
  'VE-v1 LINK-MAP L31 `nav.rk-crumbs` (guarded the same way)',
];

/** The top stepper (narrow) and the aside outline (wide): the steps and the current step's parts. */
const STEPS: PageRow[] = [
  [
    'Steps (top stepper, aside outline)',
    'Course · Formats · Preview · Check',
    'secondary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L32 `nav.ve-steps button.ve-step`, `ol.ve-stepnav button` (the step’s `?step=`, values kept)',
  ],
  [
    'Aside outline (current step)',
    '<part: a step-1 group or a chosen format>',
    'secondary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L32 `ul.vr-sub button.vr-sub-b` (focus to that section or block)',
  ],
];

const SUMMARY: PageRow = [
  'Check this step (error summary)',
  '<field error>',
  'secondary',
  '#Ve-course',
  'in-page',
  'VE-v1 LINK-MAP L35 `div.vr-errwrap div.rk-errsum li a` (moves focus to the field)',
];

const FAILED: PageRow = [
  'Failed state',
  'Try again',
  'secondary',
  null,
  'in-page',
  'state-copy `VE-03.failed`',
];

/** “Leave without saving?” over a link held back while changes are unsaved. */
const LEAVE: PageRow[] = [
  [
    'Leave without saving? (unsaved changes)',
    'Keep editing',
    'secondary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L39 `div.rk-dlg-foot` (closes; every value kept; focus back on the link)',
  ],
  [
    'Leave without saving? (unsaved changes)',
    'Leave without saving',
    'secondary',
    LIST,
    'built',
    'VE-v1 LINK-MAP L40 (the destination that was chosen — here the breadcrumb’s My experiments; what was typed is dropped)',
  ],
];

/** Steps 2–4: Back and the save action (Save draft; Save changes when revising). */
function stepActions(screen: string): PageRow[] {
  return [
    [
      'Actions',
      'Back',
      'secondary',
      null,
      'in-page',
      `VE-v1 LINK-MAP L33 ${screen} \`div.vr-actions-l button.rb-btn--ghost\` (the step before)`,
    ],
    [
      'Actions',
      'Save draft · Save changes',
      'secondary',
      null,
      'in-page',
      `VE-v1 LINK-MAP L34 ${screen} \`div.vr-actions-r button.rb-btn\` (saveDraft, or saveRevision in revise mode: “Changes saved · … · not resubmitted yet”)`,
    ],
  ];
}

const CONTINUE = (screen: string): PageRow => [
  'Actions',
  'Continue',
  'primary',
  null,
  'in-page',
  `VE-v1 LINK-MAP L33 ${screen} \`button.rb-btn--primary\` (the step’s check, then continueStep; the next \`?step=\`)`,
];

/** The outcome card's and the refusal's two ways on. */
const WAYS_ON = (where: string, primaryNote: string): PageRow[] => [
  [
    where,
    'Open the experiment record',
    'primary',
    RECORD,
    'built',
    `VE-v1 LINK-MAP L41, L43 \`div.ve-done-actions > a.rb-btn--primary\` (${primaryNote})`,
    'VE-07 Experiment record.',
  ],
  [
    where,
    'Back to My experiments',
    'secondary',
    LIST,
    'built',
    'VE-v1 LINK-MAP L42, L43 `div.ve-done-actions > a.rb-btn`',
  ],
];

/** VE-06's rows, also VE-08's step 4. */
const CHECK_ROWS: PageRow[] = [
  ...stepActions('VE-06'),
  [
    'Actions',
    'Submit for academic review · Resubmit',
    'primary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L38 `button#Ve-sbtn.rb-btn--primary` → the confirmation; with something missing, the list',
  ],
  [
    'Review section',
    'Change',
    'secondary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L46 `div.vr-rev-h > button.vr-chg` (named “Change course and description” …; that step, values kept)',
  ],
  [
    'Missing items',
    'Go to <step>',
    'secondary',
    '#Ve-plink',
    'in-page',
    'VE-v1 LINK-MAP L36 `span.ve-errline > a` (the step with its errors, focus on the field)',
  ],
  [
    'Confirmation: Submit for academic review? · Resubmit your changes?',
    'Cancel · Keep editing',
    'secondary',
    null,
    'in-page',
    'VE-v1 LINK-MAP L39 `div.rk-dlg-foot > button.rb-btn` (nothing is sent; focus back on Submit)',
  ],
  ...WAYS_ON('Outcome card (submitted · resubmitted)', 'the outcome card'),
];

/**
 * The experiment editor's link targets — VE-03 … VE-06 for a new experiment (`?step=` rule S1),
 * VE-09 a saved draft and VE-08 a returned one — in the V3 Vendor design (VE-v1 LINK-MAP L30 …
 * L48). Each editing step has one primary: “Continue” (steps 1–3, a command that opens the next
 * `?step=`), “Submit for academic review” / “Resubmit” (step 4, through the confirmation), and the
 * outcome's or the refusal's “Open the experiment record”. The read-only draft has none. Documents
 * and package files are file names only: “Attach file” and “Add document” upload nothing
 * (OD-B5-11). Every link out while changes are unsaved asks “Leave without saving?” first.
 */
export const P5_VENDOR_EDITOR_LINK_TARGETS: readonly LedgerEntry[] = [
  // VE-03 Course and description.
  ...pageRows('VE-03', NEW, [
    CRUMB,
    ...STEPS,
    [
      'Actions',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'VE-v1 `div.vr-actions-l > a.rb-btn--ghost` (drops what was typed, state-copy `VE-03.kept`; asks first while changes are unsaved)',
    ],
    [
      'Actions',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L34 `div.vr-actions-r button.rb-btn` (the first save gives the id: `/vendor/experiments/SUB-0077/edit`, state-copy `VE-03.first-save`)',
    ],
    CONTINUE('VE-03'),
    SUMMARY,
    ...LEAVE,
    FAILED,
  ]),
  // VE-04 Formats and delivery.
  ...pageRows('VE-04', `${NEW}?step=formats`, [
    CRUMB,
    ...STEPS,
    ...stepActions('VE-04'),
    CONTINUE('VE-04'),
    [
      'Formats it supports',
      'WEB · AR · VR · MR',
      'secondary',
      null,
      'in-page',
      'VE-v1 `fieldset.vr-fmtsel label.vr-fmtopt` (one delivery block per chosen format)',
    ],
    [
      'App-package block',
      'Attach file',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L47 `div.vr-labelrow > button.vr-linkbtn` (named “Attach the VR package file”; a sample file name only, state-copy `VE-04.sample-file`)',
    ],
    [
      'App-package block',
      'Remove',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L47 `div.ve-file.vr-file > button.rb-btn--ghost` (named “Remove the VR package file”)',
    ],
    SUMMARY,
    ...LEAVE,
  ]),
  // VE-05 Preview and documents.
  ...pageRows('VE-05', `${NEW}?step=preview`, [
    CRUMB,
    ...STEPS,
    ...stepActions('VE-05'),
    CONTINUE('VE-05'),
    [
      'Documents',
      'Add document',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L48 `div.vr-sec-h--row > button.rb-btn` (the next sample name, state-copy `VE-05.sample-documents`)',
    ],
    [
      'Documents',
      'Remove',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L48 `li.ve-file > button.rb-btn--ghost` (named “Remove <file name>”; the dashed line when none is left)',
    ],
    SUMMARY,
    ...LEAVE,
  ]),
  // VE-06 Check and submit.
  ...pageRows('VE-06', `${NEW}?step=submit`, [CRUMB, ...STEPS, ...CHECK_ROWS, ...LEAVE]),
  // VE-09 Edit draft: the same four steps; read-only when the course is no longer assigned; the
  // refusal when it is no longer a draft.
  ...pageRows('VE-09', EDIT_DRAFT, [
    CRUMB,
    RECORD_CRUMB('/vendor/experiments/SUB-0079'),
    ...STEPS,
    [
      'Actions',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'VE-v1 `div.vr-actions-l > a.rb-btn--ghost` (drops what was typed since the last save; asks first while changes are unsaved)',
    ],
    [
      'Actions',
      'Save draft',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L34 `div.vr-actions-r button.rb-btn` (“Draft saved · <date, time>”)',
    ],
    CONTINUE('VE-09'),
    SUMMARY,
    ...LEAVE,
    [
      'Read-only (course no longer assigned)',
      'Back to My experiments',
      'secondary',
      LIST,
      'built',
      'VE-v1 LINK-MAP L44 `div.rk-notice-act > a.rb-btn`',
    ],
    [
      'Read-only (course no longer assigned)',
      'Ask for help',
      'secondary',
      REPORT,
      'built',
      'VE-v1 LINK-MAP L45 “Ask for help” → XS-07 report form, Where prefilled (`div.rk-notice-act > a.rb-btn--ghost`; as the record’s, L54)',
    ],
    [
      'Refusal (approved, being reviewed, published, already submitted)',
      'Open the experiment record',
      'primary',
      '/vendor/experiments/SUB-0074',
      'built',
      'VE-v1 LINK-MAP L43 `div.ve-done-actions > a.rb-btn--primary` (state-copy `VE-09.refusal-kind`)',
    ],
    [
      'Refusal (approved, being reviewed, published, already submitted)',
      'Back to My experiments',
      'secondary',
      LIST,
      'built',
      'VE-v1 LINK-MAP L43 `div.ve-done-actions > a.rb-btn`',
    ],
    FAILED,
  ]),
  // VE-08 Revise and resubmit.
  ...pageRows('VE-08', REVISE, [
    CRUMB,
    RECORD_CRUMB('/vendor/experiments/SUB-0081'),
    [
      'Returned reason',
      '<what it refers to>',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L37 `ul.vr-ret-reflist button.ve-ref` (named “Go to Formats & delivery · AR · Device need”; the step and the field, tagged, state-copy `VE-08.reference-jump`)',
    ],
    ...STEPS,
    [
      'Actions (step 1)',
      'Cancel',
      'secondary',
      LIST,
      'built',
      'VE-v1 `div.vr-actions-l > a.rb-btn--ghost` (drops what was typed since the last save; asks first while changes are unsaved)',
    ],
    [
      'Actions (step 1)',
      'Save changes',
      'secondary',
      null,
      'in-page',
      'VE-v1 LINK-MAP L34 `div.vr-actions-r button.rb-btn` (saveRevision: “Changes saved · … · not resubmitted yet”, state-copy `VE-08.private-revision`)',
    ],
    CONTINUE('VE-08'),
    SUMMARY,
    ...CHECK_ROWS.map(([where, action, role, target, outcome, board, note]): PageRow =>
      note === undefined
        ? [`Step 4 · ${where}`, action, role, target, outcome, board]
        : [`Step 4 · ${where}`, action, role, target, outcome, board, note],
    ),
    ...LEAVE,
    FAILED,
  ]),
];
