import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const BANK = '/faculty/question-bank';
const NEW_QUESTION = '/faculty/question-bank/new';
const QUESTION = '/faculty/question-bank/{questionId}';

/** Phase 4A link targets: FA-14 Question bank and FA-15 Add / edit question (B4-07). */
export const P4_QUESTION_BANK_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-14 Question bank (B4-07 f0, f1, f2, f7, f9): one primary, the header's "Add a question"
  // (for the experiment on show). Since Phase 4B "Draft with assistance" (FA-16), "Import" (FA-17)
  // and the "Questions · Drafts to review" tabs render; the Drafts tab's own actions are FA-16's
  // (`link-targets-p4b/question-tools.ts`).
  ...pageRows('FA-14', BANK, [
    [
      'Header',
      'Add a question',
      'primary',
      `${NEW_QUESTION}?experimentId={experimentId}`,
      'built',
      'B4-07 f0, f7, f9 `div.xr-phead-actions` `a.xr-btn--primary`',
    ],
    [
      'Header',
      'Draft with assistance',
      'secondary',
      `${BANK}/draft?experimentId={experimentId}`,
      'built',
      'B4-07 f0, f7, f9 `a.xr-btn--secondary` (→ B4-08 FA-16)',
    ],
    [
      'Header',
      'Import',
      'secondary',
      `${BANK}/import?experimentId={experimentId}`,
      'built',
      'B4-07 f0, f7, f9 `a.xr-btn--secondary` (→ B4-08 FA-17)',
    ],
    [
      'Tabs',
      'Questions',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'B4-07 f0, f1 `nav.xr-tabs` (Questions · Drafts to review)',
    ],
    [
      'Tabs',
      'Drafts to review',
      'secondary',
      `${BANK}?tab=drafts&experimentId={experimentId}`,
      'built',
      'B4-07 f0, f1 `nav.xr-tabs` (Appendix A rule T2; state-copy `FA-14.drafts-tab`)',
    ],
    [
      'Toolbar',
      'Search questions / Experiment / Type',
      'secondary',
      null,
      'in-page',
      'B4-07 f0 `div.xr-toolbar` (the Experiment filter replaces `?experimentId=`)',
    ],
    [
      'Question row',
      'Edit',
      'secondary',
      QUESTION,
      'built',
      'B4-07 f0, f9 `a.xr-btn--secondary.xr-btn--sm` (“Edit Q-0101”)',
    ],
    [
      'Question row',
      'Delete',
      'secondary',
      null,
      'in-page',
      'B4-07 f0, f9 `button.xr-btn--text` (“Delete Q-0101”): opens the DL-1 dialog (f2)',
    ],
    [
      'Delete dialog (DL-1)',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'B4-07 f2 `div.xr-dialog-foot`',
    ],
    [
      'Delete dialog (DL-1)',
      'Delete question',
      'secondary',
      null,
      'in-page',
      'B4-07 f2 `button.xr-btn--danger` (QuestionBankService.deleteQuestion)',
    ],
    [
      'Empty bank',
      'Add a question',
      'secondary',
      `${NEW_QUESTION}?experimentId={experimentId}`,
      'built',
      'B4-07 f7 `div.xr-empty` `a.xr-btn--primary`',
      'Drawn primary-styled in the empty state; the page’s one primary action is the header’s “Add a question”, to the same place.',
    ],
    [
      'Empty bank',
      'Import',
      'secondary',
      `${BANK}/import?experimentId={experimentId}`,
      'built',
      'B4-07 f7 `div.xr-empty` `a.xr-btn--secondary` (→ B4-08 FA-17)',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'state-copy `FA-14.no-match` (B4-02 f3 grammar)',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-14.failed`'],
  ]),
  // FA-15 Add a question (B4-07 f3, f5, f6, f8): "Save question" is the page's one primary.
  ...pageRows('FA-15', NEW_QUESTION, [
    [
      'Add a question · back link',
      'Question bank',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'B4-07 f3 `a.xr-back`',
    ],
    [
      'Add a question · form foot',
      'Cancel',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'B4-07 f3 `div.xw-flow-foot` `a.xr-btn--text`',
      'With a `returnTo` address (FA-07 step 3, FA-09) Cancel goes there instead (state-copy `FA-15.after-add`).',
    ],
    [
      'Add a question · form foot',
      'Save question',
      'primary',
      null,
      'in-page',
      'B4-07 f3 `button.xr-btn--primary` (QuestionBankService.addQuestion; then the bank, or `returnTo` with `added=`)',
    ],
  ]),
  // FA-15 Edit question (B4-07 f4).
  ...pageRows('FA-15', QUESTION, [
    [
      'Edit question · back link',
      'Question bank',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'B4-07 f4 `a.xr-back`',
    ],
    [
      'Edit question · form foot',
      'Cancel',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'B4-07 f4 `div.xw-flow-foot` `a.xr-btn--text`',
    ],
    [
      'Edit question · form foot',
      'Save question',
      'primary',
      null,
      'in-page',
      'B4-07 f4 `button.xr-btn--primary` (QuestionBankService.editQuestion: a new version; assessments keep theirs)',
    ],
  ]),
];
