import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const BANK = '/faculty/question-bank';
const DRAFT = '/faculty/question-bank/draft';
const IMPORT = '/faculty/question-bank/import';
const BANK_FOR = `${BANK}?experimentId={experimentId}`;

/** Phase 4B link targets: FA-16 Draft questions with assistance and FA-17 Import questions, and FA-14’s Drafts tab (B4-08). */
export const P4B_QUESTION_TOOLS_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-16 Draft questions with assistance (B4-08 f0 … f4): "Draft questions" is the page's one
  // primary; the drafts' own actions are commands on the list (f1).
  ...pageRows('FA-16', DRAFT, [
    ['Back link', 'Question bank', 'secondary', BANK_FOR, 'built', 'B4-08 f0 `a.xr-back`'],
    [
      'Form',
      'The experiment’s lab brief / Text I paste · Question types · How many drafts',
      'secondary',
      null,
      'in-page',
      'B4-08 f0 `fieldset#Dd-src`, `fieldset#Dd-types`, `select#Dd-n`',
    ],
    [
      'Form foot',
      'Cancel',
      'secondary',
      BANK_FOR,
      'built',
      'B4-08 f0 `div.xw-flow-foot` `a.xr-btn--text`',
    ],
    [
      'Form foot',
      'Draft questions',
      'primary',
      null,
      'in-page',
      'B4-08 f0 `button.xr-btn--primary` (QuestionBankService.requestDrafts — the sample stand-in)',
    ],
    [
      'Validation summary',
      'Choose the material to draft from / Choose at least one question type / Choose how many drafts you want',
      'secondary',
      '#dq-src',
      'in-page',
      'B4-08 f2 `div.xw-errsum` links (each moves focus to its field)',
    ],
    [
      'Drafts to review · draft',
      'Review and edit',
      'secondary',
      null,
      'in-page',
      'B4-08 f1 `a.xr-btn--secondary.xr-btn--sm`',
      'The board links to B4-07’s editor; the product opens the FA-15 fields under the draft, in place (state-copy `FA-16.review-edit`).',
    ],
    [
      'Drafts to review · draft',
      'Add to bank',
      'secondary',
      null,
      'in-page',
      'B4-08 f1 `button.xr-btn--secondary.xr-btn--sm` (QuestionBankService.addDraftToBank)',
    ],
    [
      'Drafts to review · draft',
      'Discard',
      'secondary',
      null,
      'in-page',
      'B4-08 f1 `button.xr-btn--text` (QuestionBankService.discardDraft)',
    ],
    [
      'Drafts to review · editor',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-16.review-edit` (B4-07 f3 form foot)',
    ],
    [
      'Drafts to review · editor',
      'Add to bank',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-16.review-edit` (QuestionBankService.addDraftToBank with the reviewed fields)',
    ],
    [
      'Drafts to review',
      'Draft more',
      'secondary',
      null,
      'in-page',
      'B4-08 f1 `div.xr-section-body` `button.xr-btn--text` (back to the form)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-16.failed`'],
  ]),
  // FA-17 Import questions (B4-08 f5 … f9): one primary per step and on the result, as IA-11.
  ...pageRows('FA-17', IMPORT, [
    ['Back link', 'Question bank', 'secondary', BANK_FOR, 'built', 'B4-08 f5 … f9 `a.xr-back`'],
    [
      'Step 1',
      'Download the template (CSV)',
      'secondary',
      null,
      'in-page',
      'B4-08 f5, f9 (a `data:` download of the ten-column template; no navigation)',
    ],
    [
      'Step 1',
      'Choose a CSV file',
      'secondary',
      null,
      'in-page',
      'B4-08 f5, f9 (the browser’s own file chooser; state-copy `FA-17.chooser`)',
    ],
    ['Step 1', 'Cancel', 'secondary', BANK_FOR, 'built', 'B4-08 f5, f9 `a.xr-btn--text`'],
    [
      'Steps 1 … 3',
      'Check file · Choose the corrected file · Continue · Import N questions',
      'primary',
      null,
      'in-page',
      'B4-08 f5 … f7 (`previewQuestionImport`, `commitQuestionImport`; in-page steps, rule S3)',
    ],
    ['Steps 2 and 3', 'Back', 'secondary', null, 'in-page', 'B4-08 f6, f7'],
    [
      'Result',
      'Open question bank',
      'primary',
      BANK_FOR,
      'built',
      'B4-08 f8 `a.xr-btn--primary` (→ B4-07 FA-14)',
    ],
    ['Result', 'Import another file', 'secondary', null, 'in-page', 'B4-08 f8'],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-17.failed`'],
  ]),
  // FA-14 Question bank's Drafts to review tab (B4-07 f1): the drafts' actions, as on FA-16.
  ...pageRows('FA-14', BANK, [
    [
      'Drafts to review · draft',
      'Review and edit',
      'secondary',
      null,
      'in-page',
      'B4-07 f1 `a.xr-btn--secondary.xr-btn--sm`',
      'The board links to B4-08; the product opens the FA-15 fields under the draft, in place (state-copy `FA-16.review-edit`).',
    ],
    [
      'Drafts to review · draft',
      'Add to bank',
      'secondary',
      null,
      'in-page',
      'B4-07 f1 `button.xr-btn--secondary.xr-btn--sm` (QuestionBankService.addDraftToBank)',
    ],
    [
      'Drafts to review · draft',
      'Discard',
      'secondary',
      null,
      'in-page',
      'B4-07 f1 `button.xr-btn--text` (QuestionBankService.discardDraft)',
    ],
    [
      'Drafts to review · editor',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-16.review-edit` (B4-07 f3 form foot)',
    ],
    [
      'Drafts to review · editor',
      'Add to bank',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-16.review-edit` (QuestionBankService.addDraftToBank with the reviewed fields)',
    ],
    [
      'No drafts to review',
      'Draft with assistance',
      'secondary',
      `${DRAFT}?experimentId={experimentId}`,
      'built',
      'B4-07 `b.noDrafts` `div.xr-empty` `a.xr-btn--secondary`',
    ],
  ]),
];
