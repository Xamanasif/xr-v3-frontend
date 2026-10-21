import type { LedgerEntry } from '../link-targets';
import { pageRows } from '../link-targets-p3/rows';

const BANK = '/faculty/question-bank';
const NEW_QUESTION = '/faculty/question-bank/new';
const QUESTION = '/faculty/question-bank/{questionId}';

/**
 * The link targets of FA-14 Question bank and FA-15 Add / edit question, as the V3 export draws
 * them (FA-v1 `Main.dc.html` "FA-14", "FA-15"; `LINK-MAP.json`). Every action is named by content,
 * never by a record's internal reference.
 */
export const P4_QUESTION_BANK_LINK_TARGETS: readonly LedgerEntry[] = [
  // FA-14 Question bank: one primary, the head's "Add a question" (for the experiment on show).
  // "Draft with assistance" (FA-16), "Import" (FA-17) and the "Questions · Drafts to review" record
  // tabs; the Drafts tab's own actions are FA-16's (`link-targets-p4b/question-tools.ts`).
  ...pageRows('FA-14', BANK, [
    [
      'Header',
      'Add a question',
      'primary',
      `${NEW_QUESTION}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-14 `div.rk-head-act` `a.rb-btn--primary` (LINK-MAP FA-14 → FA-15)',
    ],
    [
      'Header',
      'Draft with assistance',
      'secondary',
      `${BANK}/draft?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-14 `div.rk-head-act` `a.rb-btn` (→ FA-16)',
    ],
    [
      'Header',
      'Import',
      'secondary',
      `${BANK}/import?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-14 `div.rk-head-act` `a.rb-btn--ghost` (→ FA-17)',
    ],
    [
      'Tabs',
      'Questions',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-14 `nav.rk-tabs.fa-tabs` (Questions · Drafts to review, with counts)',
    ],
    [
      'Tabs',
      'Drafts to review',
      'secondary',
      `${BANK}?tab=drafts&experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-14 `nav.rk-tabs.fa-tabs` (Appendix A rule T2; state-copy `FA-14.drafts-tab`)',
    ],
    [
      'Toolbar',
      'Search / Experiment / Type',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-14 `div.rk-tools.fa-tools[role=search]` (the Experiment filter, shown with more than one experiment taught, replaces `?experimentId=`)',
    ],
    [
      'Toolbar · status line',
      'Remove filter … / Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-14 `div.rk-statusline` (`span.rk-chip` buttons, `button.rk-clear`)',
    ],
    [
      'Question row',
      'Edit',
      'secondary',
      QUESTION,
      'built',
      'FA-v1 Main.dc.html FA-14 `div.fa-cellacts` `a.rb-btn` (“Edit question: <question>”)',
    ],
    [
      'Question row',
      'Delete',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-14 `button.rb-btn--ghost` (“Delete question: <question>”): opens “Delete this question?”',
    ],
    [
      'Delete dialog',
      'Cancel',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html `div.rk-dlg-foot` `#fa-dlg-cancel`',
    ],
    [
      'Delete dialog',
      'Delete question',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html `div.rk-dlg-foot` `#fa-dlg-ok` (QuestionBankService.deleteQuestion)',
    ],
    [
      'No match',
      'Clear filters',
      'secondary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-14 `QB.noMatch` `div.rk-state` `button.rb-btn`',
    ],
    ['Failed state', 'Try again', 'secondary', null, 'in-page', 'state-copy `FA-14.failed`'],
    [
      'No-course card',
      'Help & support',
      'secondary',
      '/faculty/help',
      'built',
      'FA-v1 Main.dc.html FA-14 `QB.noCourse` `div.fa-msg-act` `a.rb-btn` (→ XS-07)',
    ],
  ]),
  // FA-15 Add a question: "Save question" is the page's one primary.
  ...pageRows('FA-15', NEW_QUESTION, [
    [
      'Add a question · crumbs',
      'Question bank',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-15 `nav.rk-crumbs`',
    ],
    [
      'Add a question · form foot',
      'Cancel',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-15 `div.fa-formfoot-l` `a.rb-btn`',
      'With a `returnTo` address (FA-07 step 3, FA-09) Cancel goes there instead (state-copy `FA-15.after-add`).',
    ],
    [
      'Add a question · form foot',
      'Save question',
      'primary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-15 `div.fa-formfoot-r` `button.rb-btn--primary` (QuestionBankService.addQuestion; then the bank, or `returnTo` with `added=`)',
    ],
  ]),
  // FA-15 Edit question.
  ...pageRows('FA-15', QUESTION, [
    [
      'Edit question · crumbs',
      'Question bank',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-15 `nav.rk-crumbs`',
    ],
    [
      'Edit question · form foot',
      'Cancel',
      'secondary',
      `${BANK}?experimentId={experimentId}`,
      'built',
      'FA-v1 Main.dc.html FA-15 `div.fa-formfoot-l` `a.rb-btn`',
    ],
    [
      'Edit question · form foot',
      'Save question',
      'primary',
      null,
      'in-page',
      'FA-v1 Main.dc.html FA-15 `button.rb-btn--primary` (QuestionBankService.editQuestion: a new version; assessments keep theirs)',
    ],
  ]),
];
