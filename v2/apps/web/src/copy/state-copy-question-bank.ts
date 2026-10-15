import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-14 Question bank and FA-15 Add / edit question (B4-07) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_QUESTION_BANK = {
  // ---- FA-14 Question bank (B4-07 f0, f2, f7, f9) ----------------------------------------------
  'FA-14.experiment': {
    screen: 'FA-14',
    state: 'Which experiment’s questions the bank shows',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (in the order the service lists them). The Experiment filter lists the taught experiments and replaces the address (no history entry). An experiment outside the Faculty member’s teaching scope, or unknown, is the in-shell not-found page.',
    basis:
      'B4-07 f0 toolbar “Experiment” (one option drawn); Appendix A register “FA-14 · ?experimentId=”; the service answers out-of-scope experiments as not permitted',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.no-experiment': {
    screen: 'FA-14',
    state: 'The Faculty member teaches no experiment yet (no course mapped in Faculty courses)',
    words: 'Your Institute Admin hasn’t assigned you courses yet',
    rule: 'An empty state under the page title, with the line “When they assign you a course in Faculty courses, you can add questions for its experiments here.” — no “Add a question”, no toolbar. FA-15 shows the same in place of its form.',
    basis:
      'B4-01 f2 “No courses yet” (“Your Institute Admin hasn’t assigned you courses yet”); B4-07 draws no frame without an experiment',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.no-experiment.line': {
    screen: 'FA-14',
    state: 'The no-experiment state’s line',
    words:
      'When they assign you a course in Faculty courses, you can add questions for its experiments here.',
    basis:
      'B4-01 f2 line “When they assign you a course in Faculty courses, its experiments … appear here.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.loading': {
    screen: 'FA-14',
    state: 'The questions loading (screen readers)',
    words: 'Loading questions',
    rule: 'Skeleton rows in the table’s place under the toolbar, `aria-busy` and the words in a polite status; the count is empty until the list arrives.',
    basis:
      'B4-02 f4 “Loading” (“Loading your experiments”, skeleton rows); B4-07 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.failed': {
    screen: 'FA-14',
    state: 'The questions (or the taught experiments) failed to load',
    words: 'We couldn’t load the question bank',
    rule: 'With B4-02 f5’s line “Nothing has changed. Try again.” and its primary “Try again”, which reads again — in the section’s body, never a section inside a section.',
    basis: 'B4-02 f5 “We couldn’t load your experiments”; B4-07 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.failed.line': {
    screen: 'FA-14',
    state: 'The failed state’s line',
    words: 'Nothing has changed. Try again.',
    basis: 'B4-02 f5 (the Faculty boards’ failed line)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.try-again': {
    screen: 'FA-14',
    state: 'The failed state’s button (FA-14 and FA-15)',
    words: 'Try again',
    basis: 'B4-02 f5 `button.xr-btn--primary` “Try again”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.drafts-tab': {
    screen: 'FA-14',
    state: 'The “Questions · Drafts to review” tab strip and the Drafts to review tab (f1)',
    words: null,
    rule: 'Not rendered: drafts come only from FA-16 Draft with assistance, which is not built (no drafting provider). With one tab left, no tab strip is drawn — the Questions section follows the page header.',
    basis:
      'B4-07 f0 `nav.xr-tabs`, f1 “Drafts to review”; the link-target ledger’s “not rendered” rule',
    status: 'provisional',
    decisions: ['DEV-21', 'T-23'],
  },
  'FA-14.assist-import': {
    screen: 'FA-14',
    state: 'The header’s “Draft with assistance” and “Import”, and the empty state’s “Import”',
    words: null,
    rule: 'Not rendered until FA-16 and FA-17 are built: the header holds “Add a question” only.',
    basis: 'B4-07 f0, f7, f9 `div.xr-phead-actions`, f7 `div.xr-empty`; the link-target ledger',
    status: 'provisional',
    decisions: ['DEV-21', 'T-23'],
  },
  'FA-14.empty-line': {
    screen: 'FA-14',
    state: 'The empty bank’s line (f7) while drafting and importing are not built',
    words: 'Add a question. Questions stay here until you use them in an assessment.',
    basis:
      'B4-07 f7 “Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.” — the two unbuilt ways are left out',
    status: 'provisional',
    decisions: ['DEV-21', 'T-23'],
  },
  'FA-14.used-several': {
    screen: 'FA-14',
    state: 'A question used in more than one assessment',
    words: null,
    rule: '“Used in <n> assessments” (the plural of the drawn “Used in 1 assessment”).',
    basis: 'B4-07 f0 “Used in 1 assessment”; the board script writes the singular for any count',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.no-match': {
    screen: 'FA-14',
    state: 'The search or the Type filter matches no question',
    words: null,
    rule: 'The drawn “No question matches.” in the section body, followed by a text button “Clear filters” that clears the search and the type (B4-02 f3’s grammar); the count reads “0 questions”.',
    basis:
      'B4-07 script `noMatch` (“No question matches.”); B4-02 f3 “No experiment matches. Clear filters”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.clear-filters': {
    screen: 'FA-14',
    state: 'The no-match line’s way back',
    words: 'Clear filters',
    basis: 'B4-02 f3 `button.xr-btn--text` “Clear filters”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.filters': {
    screen: 'FA-14',
    state: 'Searching and filtering by type',
    words: null,
    rule: 'Both apply at once to the experiment’s list: the search matches the question’s words or its ID, ignoring case; the count counts what is shown. Below 600 px of content the Type filter is not shown, as f9 draws it (no “More filters”).',
    basis:
      'B4-07 script `qbView` (`(text + id).includes(q)`, `type === s.type`); f9 (the Type filter hidden by `xr-filter-2`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.labelled-rows': {
    screen: 'FA-14',
    state: 'The table below 760 px of content (f9)',
    words: null,
    rule: 'The rows stack as f9 draws them: question and ID, type tag, marks, used, added, Edit and Delete — without a label before each value (f9’s cells carry none).',
    basis: 'B4-07 f9 “Mobile 375 · bank” (`td` without `data-label`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.deleted-list': {
    screen: 'FA-14',
    state: 'After a question is deleted on this visit',
    words: null,
    rule: 'The drawn message “<ID> deleted from your question bank. Its history is kept.” takes focus, and a “Deleted” list under the table names each question deleted on this visit, “<ID> <question> — deleted <date> · history kept”. The bank reads active questions only, so the list does not survive leaving the page.',
    basis: 'B4-07 script `doDel`, `delRows` (“Deleted”; “— deleted 7 Nov 2026 · history kept”)',
    status: 'provisional',
    decisions: ['VD-12', 'ND-15'],
  },
  'FA-14.delete-used-several': {
    screen: 'FA-14',
    state:
      'Deleting a question several assessments use, or one whose assessments could not be named',
    words: null,
    rule: '“It is used in A and B.” (names joined by commas and a final “and”) “Those assessments keep their copy, so nothing changes for students.” While the assessments’ names cannot be read, “It is used in <n> assessment(s).”',
    basis:
      'B4-07 f2 “It is used in Heat Exchanger — post-lab. That assessment keeps its copy, so nothing changes for students.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-busy': {
    screen: 'FA-14',
    state: 'Deleting (the dialog’s busy button)',
    words: 'Deleting…',
    basis:
      'Board 10 “States · focus, validation, busy” (“the label says what is happening”); B4-07 draws no busy delete',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-unavailable': {
    screen: 'FA-14',
    state: 'Deleting failed for now (service unavailable)',
    words: 'The question wasn’t deleted. Nothing has changed. Try again.',
    rule: 'The dialog stays open with this error notice and can be confirmed again.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes”; B4-07 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-14.delete-refused': {
    screen: 'FA-14',
    state:
      'Deleting was refused: the question changed or was deleted meanwhile, or it is out of reach',
    words: 'Nothing was deleted. The list has been read again.',
    rule: 'The dialog closes, the list is read again and this message (an error line in the message slot) takes focus.',
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
      'The service answers an open decision (a shared or per-person bank); B4-07 draws no co-teaching',
    status: 'provisional',
    decisions: ['OD-B4-17'],
  },
  'FA-14.added': {
    screen: 'FA-14',
    state: 'Back on the bank after adding a question (FA-15 without a return address)',
    words: null,
    rule: 'The drawn “Saved to your question bank as <ID>.” in the message slot (`p.xa-save.is-ok`), with focus; the address drops its `added=` once read.',
    basis: 'B4-07 script `qeView.save` (“Saved to your question bank as Q-0107.”) and `#Kb-msg`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-15 Add / edit question (B4-07 f3 … f8) -----------------------------------------------
  'FA-15.experiment': {
    screen: 'FA-15',
    state: 'Which experiment a new question is for',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first taught experiment (as FA-14); its name is the overline. An experiment outside the teaching scope is the in-shell not-found page. An edited question keeps its own experiment.',
    basis: 'B4-07 f3 `span.xr-overline` “Shell-and-Tube Heat Exchanger”; Appendix A register',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.loading': {
    screen: 'FA-15',
    state: 'The question (or the taught experiments) loading (screen readers)',
    words: 'Loading the question',
    basis: 'Board 04 “State grammar” Loading formula; B4-07 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.failed': {
    screen: 'FA-15',
    state: 'The question (or the taught experiments) failed to load',
    words: 'We couldn’t load the question',
    rule: 'With “Nothing has changed. Try again.” and a primary “Try again”, which reads again.',
    basis: 'B4-02 f5 failed formula; B4-07 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.type-switch': {
    screen: 'FA-15',
    state: 'Switching the question type',
    words: null,
    rule: 'Nothing is chosen for a new question. Each type keeps what was typed for it while the form is open; Save sends only the chosen type’s answer fields (options and the correct one; true or false; marking guidance).',
    basis: 'B4-07 script `qeInit` (the type starts empty), `isMc` / `isTf` / `isW`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.after-add': {
    screen: 'FA-15',
    state: 'A new question saved',
    words: null,
    rule: 'Back to the bank for its experiment, which says “Saved to your question bank as <ID>.” With a `returnTo` address (a same-origin path under /faculty/; anything else is ignored) it goes there instead, with `added=<ID>` appended — Create assessment (step 3) and an assessment’s Questions tab pick the question up from it. Cancel goes to `returnTo` too.',
    basis:
      'B4-07 script `qeView.save` (“Saved to your question bank as Q-0107.”); FA-07 / FA-09 “Add a question” from the bank picker',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.saved-edit': {
    screen: 'FA-15',
    state: 'An edit saved for a question no assessment uses',
    words: 'Saved as a new version.',
    rule: 'In the form’s notice slot (`div.xr-notice--ok`), with focus; the form stays. A used question’s words are drawn (“Saved as a new version. <assessment> keeps the version it has until you choose “Use updated version” there.”).',
    basis: 'B4-07 script `qeView.save` (the used question’s words); the unused case is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.used-several': {
    screen: 'FA-15',
    state: 'Editing a question several assessments use',
    words: null,
    rule: 'The notice title “Used in <n> assessments: A, B”; its line “… The assessments keep the version they have until you choose “Use updated version” on their Questions tab. …”; saved: “Saved as a new version. A and B keep the version they have …”.',
    basis: 'B4-07 f4 notice (one assessment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-15.deleted': {
    screen: 'FA-15',
    state: 'The address names a question deleted from the bank',
    words:
      'This question was deleted from your question bank. Its history is kept, so it can’t be edited.',
    rule: 'A quiet notice under the title, with no form.',
    basis:
      'B4-07 script `delRows` (“history kept”); the service refuses editing a deleted question',
    status: 'provisional',
    decisions: ['VD-12', 'ND-15'],
  },
  'FA-15.policy-open': {
    screen: 'FA-15',
    state: 'The question was added by a colleague on a course both teach',
    words:
      'A colleague added this question. Whether you can change it hasn’t been decided yet, so it can’t be edited here.',
    rule: 'A quiet notice under the title, with no form (also when saving is answered this way).',
    basis:
      'The service answers an open decision (a shared or per-person bank); B4-07 draws no co-teaching',
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
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); B4-07 draws no conflict',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-15.unavailable': {
    screen: 'FA-15',
    state: 'Saving failed for now (service unavailable)',
    words: 'The question wasn’t saved. Everything you typed is still here — try again.',
    rule: 'An error notice in the form’s notice slot, with focus; every value stays and can be saved again.',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; B4-07 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
