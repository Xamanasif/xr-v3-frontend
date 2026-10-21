import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of FA-14 Question bank and FA-15 Add / edit question — part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that the
 * owner-approved V3 export (design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`) does not draw
 * word for word, with its basis and the decisions it waits on. Decision ids never appear in
 * visible copy, and no words name a question or an assessment by its internal reference (the
 * owner's identifier rule, 21 Oct 2026).
 */
export const STATE_COPY_QUESTION_BANK = {
  // ---- FA-14 Question bank ----------------------------------------------------------------------
  // The Drafts to review tab's rule is `FA-14.drafts-tab` in `state-copy-question-tools.ts`.
  'FA-14.experiment': {
    screen: 'FA-14',
    state: 'Which experiment’s questions the bank shows',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (in the order the service lists them); the page head names it (“Your questions for <experiment> · <code>. …”). With more than one experiment taught, the Experiment filter lists them and replaces the address (no history entry); with one, no Experiment filter. The service reads one experiment’s questions at a time, so the export’s “All experiments” is not offered. An experiment outside the Faculty member’s teaching scope, or unknown, is the in-shell not-found page.',
    basis:
      'FA-v1 Main.dc.html FA-14 `QB.multiExp`, `QB.sub`; Appendix A register “FA-14 · ?experimentId=”; QuestionBankService.listQuestions (one experiment); the service answers out-of-scope experiments as not permitted',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.loading': {
    screen: 'FA-14',
    state: 'The questions loading',
    words: 'Loading questions…',
    rule: 'Skeleton rows in the table’s place under the toolbar with these words above them (`rk-loading-msg`, a polite status); the count and the type split are empty until the list arrives.',
    basis:
      'The V3 kit’s list loading (rb-kit.css `rk-skel-row`); the export draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.failed': {
    screen: 'FA-14',
    state: 'The questions (or the taught experiments) failed to load',
    words: 'We couldn’t load the question bank',
    rule: 'The V3 list state for a failed read (an alert) with the line “Nothing has changed. Try again.” and “Try again”, which reads again — in the Questions section, in the table’s place.',
    basis:
      'The V3 kit’s failed list state (rb-kit.css `rk-state`); the Faculty failed formula; the export draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.failed.line': {
    screen: 'FA-14',
    state: 'The failed state’s line',
    words: 'Nothing has changed. Try again.',
    basis: 'The Faculty failed formula (`fa-shared.ts` `FACULTY_FAILED_WORDS`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.try-again': {
    screen: 'FA-14',
    state: 'The failed state’s button (FA-14 and FA-15)',
    words: 'Try again',
    basis: 'The Faculty failed formula (`fa-shared.ts` `FACULTY_FAILED_WORDS`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.used-several': {
    screen: 'FA-14',
    state: 'The “Used in” cell',
    words: null,
    rule: 'The assessments that use the question by name, joined “A, B and C” (the export’s `names`), from the Faculty member’s assessments (AssessmentService.listAssessments, one read for the page); while their names cannot be read, how many (“1 assessment”, “2 assessments”). None: “Not yet”. The export’s “None now · earlier versions keep it” is not shown: the bank’s read holds no fact for a question only earlier assessment versions use.',
    basis:
      'FA-v1 Main.dc.html FA-14 `r.usedMain`, `r.used`, `r.usedNote`; QuestionBankService.listQuestions (`usedIn`: a count)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.filters': {
    screen: 'FA-14',
    state: 'Searching and filtering by type',
    words: null,
    rule: 'Both apply at once to the experiment’s list: the search matches the question’s words (and its stored key, which is never shown), ignoring case; the count reads “3 of 6 questions” while a filter applies. Each applied filter is a chip whose remove button clears it; “Clear filters” clears both and returns focus to the search field. Both fields show at every width.',
    basis:
      'FA-v1 Main.dc.html FA-14 `vmBank` (`(v.t + id).indexOf(q)`, `QB.chips`, `QB.count`, `QB.clear`); the 375 px render',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.labelled-rows': {
    screen: 'FA-14',
    state: 'The table below 760 px of content',
    words: null,
    rule: 'The rows stack as the export’s phone rows: the question, its type tag with the marks and “added <date>” beside it, “Used in” with its label, then Edit and Delete.',
    basis: 'FA-v1 Main.dc.html FA-14 `fa-ptable` rows (`fa-mob`, `fa-lbl`); the 375 px render',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.deleted-list': {
    screen: 'FA-14',
    state: 'After a question is deleted on this visit',
    words: null,
    rule: 'The drawn message “Question deleted from your question bank.” (“Its history is kept.”, and the assessments that keep their copy) takes focus, and the drawn “Deleted” box under the list names each question deleted on this visit, “<question> — deleted <date> · history kept”. The bank reads active questions only, so the box does not survive leaving the page.',
    basis:
      'FA-v1 Main.dc.html FA-14 `dlgBank.ok`, `QB.delRows` (“Deleted”; “deleted 7 Nov 2026 · history kept”)',
    status: 'provisional',
    decisions: ['VD-12', 'ND-15'],
  },
  'FA-14.delete-used-several': {
    screen: 'FA-14',
    state:
      'Deleting a question several assessments use, or one whose assessments could not be named',
    words: null,
    rule: 'The dialog’s third point: “It is used in A and B. Those assessments keep their copy, so nothing changes for students.” (names joined “A, B and C”); while the assessments’ names cannot be read, “It is used in <n> assessments. …”. After the delete, “A and B keep their copy, so nothing changes for students.”',
    basis:
      'FA-v1 Main.dc.html `dlgBank` (“It is used in … That assessment keeps its copy / Those assessments keep their copy, so nothing changes for students.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-busy': {
    screen: 'FA-14',
    state: 'Deleting (the dialog’s busy button)',
    words: 'Deleting…',
    basis:
      'Board 10 “States · focus, validation, busy” (“the label says what is happening”); the export draws no busy delete',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-unavailable': {
    screen: 'FA-14',
    state: 'Deleting failed for now (service unavailable)',
    words: 'The question wasn’t deleted. Nothing has changed. Try again.',
    rule: 'The dialog stays open with this warning notice in its body (an alert) and can be confirmed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes”; the export draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-refused': {
    screen: 'FA-14',
    state:
      'Deleting was refused: the question changed or was deleted meanwhile, or it is out of reach',
    words: 'Nothing was deleted. The list has been read again.',
    rule: 'The dialog closes, the list is read again and this message (a warning notice in the message slot) takes focus.',
    basis: 'Appendix G P1-21 interim (“Refetch and render the current drawn state”)',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-14.delete-policy-open': {
    screen: 'FA-14',
    state: 'Deleting a colleague’s question (who may change it is undecided)',
    words:
      'Nothing was deleted. Whether you can delete a question a colleague added hasn’t been decided yet.',
    basis:
      'The service answers an open decision (a shared or per-person bank); the export draws only its note about colleagues’ questions',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },
  'FA-14.added': {
    screen: 'FA-14',
    state: 'Back on the bank after adding a question (FA-15 without a return address)',
    words: null,
    rule: 'The drawn “Saved to your question bank.” with “It isn’t in any assessment yet.” in the message slot, with focus, once the question is in the list; the address drops its `added=` once read.',
    basis: 'FA-v1 Main.dc.html `qeCommit` (a new question: “Saved to your question bank.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-15 Add / edit question ------------------------------------------------------------------
  'FA-15.experiment': {
    screen: 'FA-15',
    state: 'Which experiment a new question is for',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first taught experiment (as FA-14); “<experiment> · <code>” is the eyebrow. An experiment outside the teaching scope is the in-shell not-found page; with none taught, FA-14’s no-course card shows in place of the form. An edited question keeps its own experiment.',
    basis: 'FA-v1 Main.dc.html FA-15 `QE.ctx`; Appendix A register',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.loading': {
    screen: 'FA-15',
    state: 'The question (or the taught experiments) loading',
    words: 'Loading the question…',
    basis: 'The V3 kit’s loading line (`rk-loading-msg`); the export draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.failed': {
    screen: 'FA-15',
    state: 'The question (or the taught experiments) failed to load',
    words: 'We couldn’t load the question',
    rule: 'With “Nothing has changed. Try again.” and “Try again”, which reads again (the V3 failed list state).',
    basis: 'The Faculty failed formula; the export draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.type-switch': {
    screen: 'FA-15',
    state: 'Switching the question type',
    words: null,
    rule: 'Nothing is chosen for a new question (the drawn “Choose the question type to set its answer.” stands in for the answer fields). Each type keeps what was typed for it while the form is open; Save sends only the chosen type’s answer fields (options and the correct one; true or false; marking guidance).',
    basis: 'FA-v1 Main.dc.html FA-15 `QE.noType`, `isSc` / `isTf` / `isW`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.after-add': {
    screen: 'FA-15',
    state: 'A new question saved',
    words: null,
    rule: 'Back to the bank for its experiment, which says “Saved to your question bank.” With a `returnTo` address (a same-origin path under /faculty/; anything else is ignored) it goes there instead, with `added=<key>` appended — Create assessment (step 3) and an assessment’s Questions tab pick the question up from it. Cancel and the crumb go to `returnTo` too.',
    basis: 'FA-v1 Main.dc.html `qeCommit` (a new question); FA-07 / FA-09 “Add a question”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.saved-edit': {
    screen: 'FA-15',
    state: 'An edit saved',
    words: null,
    rule: 'Every saved edit is a new version (the domain’s rule), so the notice says “Saved as version <n>.”; for a question assessments use, under it “<assessment> keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.” In the form’s notice slot, with focus; the form stays (with a `returnTo` address the page goes there instead).',
    basis:
      'FA-v1 Main.dc.html `qeCommit` (“Saved as version ” + n; the used notice’s “keeps the version it has until you choose “Use updated version” on its Questions tab”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.used-several': {
    screen: 'FA-15',
    state: 'Editing a question several assessments use',
    words: null,
    rule: 'The notice title “Used in <n> assessments: A and B”; its line “… The assessments keep the version they have until you choose “Use updated version” on their Questions tab. …”; saved: “A and B keep the version they have …”. The side panel’s “Used in” names them.',
    basis: 'FA-v1 Main.dc.html FA-15 `QE.usedT`, `QE.usedD` (one assessment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.deleted': {
    screen: 'FA-15',
    state: 'The address names a question deleted from the bank',
    words:
      'This question was deleted from your question bank. Its history is kept, so it can’t be edited.',
    rule: 'A notice under the title, with no form.',
    basis:
      'FA-v1 Main.dc.html FA-14 `QB.delRows` (“history kept”); the service refuses editing a deleted question',
    status: 'provisional',
    decisions: ['VD-12', 'ND-15'],
  },
  'FA-15.policy-open': {
    screen: 'FA-15',
    state: 'The question was added by a colleague on a course both teach',
    words:
      'A colleague added this question. Whether you can change it hasn’t been decided yet, so it can’t be edited here.',
    rule: 'A notice under the title, with no form (also when saving is answered this way).',
    basis:
      'The service answers an open decision (a shared or per-person bank); the export draws no editor for a colleague’s question',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },
  'FA-15.stale': {
    screen: 'FA-15',
    state: 'Saving an edit was refused because the question changed meanwhile',
    words:
      'This question changed while you were editing it. Its latest version is shown — make your change again.',
    rule: 'The question is read again and the form shows it (what was typed is not kept, so nothing is overwritten silently); this warning stays above the form until the next save.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); the export draws no conflict',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-15.unavailable': {
    screen: 'FA-15',
    state: 'Saving failed for now (service unavailable)',
    words: 'The question wasn’t saved. Everything you typed is still here — try again.',
    rule: 'A warning notice in the form’s notice slot, with focus; every value stays and can be saved again.',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; the export draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
