import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4B’s FA-16 Draft questions with assistance and FA-17 Import questions, and FA-14’s Drafts tab (B4-08) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_QUESTION_TOOLS = {
  // ---- FA-16 Draft questions with assistance (B4-08 f0 … f4) -----------------------------------
  'FA-16.sample-stand-in': {
    screen: 'FA-16',
    state:
      'The drafts come from the prototype’s sample stand-in (no drafting service is connected)',
    words:
      'Sample drafts: no drafting service is connected yet, so the drafts come from a fixed sample set for this prototype. Check each one before you add it.',
    rule: 'A quiet notice above the form and at the top of every list of drafts (FA-16’s “Drafts to review” and FA-14’s Drafts tab). The stand-in drafts in a fixed order from the chosen types and never reads the material; nothing enters the bank until the Faculty member adds a draft.',
    basis:
      'B4-08 “Not designed: which service drafts the questions … No provider is named anywhere.”; the sample platform’s drafting stand-in (T-23: no provider)',
    status: 'provisional',
    decisions: ['T-23', 'OD-B4-12'],
  },
  'FA-16.experiment': {
    screen: 'FA-16',
    state: 'Which experiment the drafts are for',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (as FA-14); its name is the overline, and the back link and Cancel return to its bank. An experiment outside the teaching scope, or unknown, is the in-shell not-found page; with no experiment taught, the FA-14 empty state shows instead of the form.',
    basis:
      'B4-08 f0 `span.xr-overline` “Shell-and-Tube Heat Exchanger”; Appendix A register “FA-16 · ?experimentId=”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.lab-brief': {
    screen: 'FA-16',
    state: 'The lab brief the first choice names',
    words: null,
    rule: 'The line under “The experiment’s lab brief” is the title of the experiment’s published resource whose title begins “Lab brief”, as Students see it. The Faculty teaching view gives resource titles only, so the board’s “· PDF document” (the resource’s kind) is not shown. With no such resource the choice has no second line.',
    basis:
      'B4-08 f0 “Lab brief — Shell-and-Tube Heat Exchanger · PDF document”; `teachingExperimentOutput.resources` (titles only, PC-52)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-52'],
  },
  'FA-16.loading': {
    screen: 'FA-16',
    state: 'The experiment and its material loading (screen readers)',
    words: 'Loading the experiment',
    basis: 'Board 04 “State grammar” Loading formula; B4-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.failed': {
    screen: 'FA-16',
    state: 'The experiment or its material failed to load',
    words: 'We couldn’t load the experiment',
    rule: 'With “Nothing has changed. Try again.” and a primary “Try again”, which reads again (the FA-14 formula).',
    basis: 'B4-02 f5 failed formula; B4-08 draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.request': {
    screen: 'FA-16',
    state: '“Draft questions”',
    words: null,
    rule: 'The service checks the choices and answers the drawn words (“Check these choices” and each field’s line; choosing a field clears its error). While it drafts, the drawn “Drafting questions…” section replaces the form. Then the list of drafts shows and its heading takes focus. If drafting fails for now, the form returns with its choices and the drawn “Drafting didn’t work this time”, which takes focus; pressing “Draft questions” tries again. “Draft more” returns to the form with the choices kept.',
    basis: 'B4-08 script `drView` (`gen`, `busy`, `fail`, `again`); f2, f3',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.list': {
    screen: 'FA-16',
    state: 'Which drafts “Drafts to review” lists',
    words: null,
    rule: 'Every draft of the Faculty member’s that waits for review for this experiment, oldest first — earlier requests’ drafts too — and the drafts added to the bank on this visit, each with “In your bank · reviewed by you” and no actions. “<n> left to review” counts the waiting ones. The page opens on the form (f0) even when drafts wait; FA-14’s Drafts tab lists them too. Leaving the page forgets which drafts were added on this visit.',
    basis:
      'B4-08 f1 and script `drView` (`d.added`, `left`); QuestionBankService.listDrafts (“own drafts”, Q-05)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.marks': {
    screen: 'FA-16',
    state: 'A draft’s marks',
    words: null,
    rule: 'A draft has no marks: they are the Faculty member’s to set. Each draft shows its type alone (the board’s “· 2 marks” is not shown), and Marks starts empty in “Review and edit”. “Add to bank” on a draft with no marks opens its editor with the drawn “Enter the marks, as a whole number of 1 or more” and the summary “Check this question”, which takes focus.',
    basis:
      'B4-08 f1 “Multiple choice · 2 marks”; B4-08 “Not designed: … suggested marks … open”; the contract’s draft (`marks: null`, OD-B4-12); B4-07 f6 field words',
    status: 'provisional',
    decisions: ['OD-B4-12', 'T-23'],
  },
  'FA-16.review-edit': {
    screen: 'FA-16',
    state: '“Review and edit” a draft',
    words: null,
    rule: 'Opens the FA-15 fields under the draft, in place (no new page): Question type, Question, the type’s answer (Answer options A–D with one Correct, “The statement is” True / False, or Marking guidance), Marks and Explanation, filled from the draft, with Cancel and “Add to bank”. While the fields are open the row’s own three actions make way for them and focus moves to Question. “Add to bank” sends the fields as they are now (busy: B4-07’s “Saving…”); the service checks them with the FA-15 words. Cancel closes the fields, keeps what was typed while the page is open (the row’s “Add to bank” then sends that) and returns focus to “Review and edit”.',
    basis:
      'B4-08 f1 `a.xr-btn--secondary` “Review and edit” (the board links to B4-07’s editor); QuestionBankService.addDraftToBank (the reviewed content, Q-05)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.draft-gone': {
    screen: 'FA-16',
    state: 'Adding or discarding a draft that no longer waits (added or discarded elsewhere)',
    words: 'This draft is no longer waiting for review. The list has been read again.',
    rule: 'An error line in the list’s message slot, with focus; the list is read again.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); B4-08 draws no conflict',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-16.draft-unavailable': {
    screen: 'FA-16',
    state: 'Adding or discarding a draft failed for now (service unavailable)',
    words: 'That didn’t work this time. Nothing has changed — try again.',
    rule: 'An error line in the list’s message slot, with focus; the draft and anything typed in its fields stay.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes”; B4-08 f3’s failure formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.drafts-loading': {
    screen: 'FA-16',
    state: 'The drafts loading (screen readers)',
    words: 'Loading your drafts',
    basis: 'B4-08 `d.busy` skeleton lines; board 04 Loading formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.drafts-failed': {
    screen: 'FA-16',
    state: 'The drafts failed to load',
    words: 'We couldn’t load your drafts',
    rule: 'In the list’s place, with “Nothing has changed. Try again.” and “Try again”, which reads again.',
    basis: 'B4-02 f5 failed formula; B4-08 draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-14 Question bank · Drafts to review (B4-07 f0, f1) -----------------------------------
  'FA-14.drafts-tab': {
    screen: 'FA-14',
    state: 'The “Questions · Drafts to review” tabs',
    words: null,
    rule: 'Section tabs under the page header, for the experiment on show: “Questions” (`/faculty/question-bank?experimentId=`) and “Drafts to review” (`?tab=drafts`), whose count is the Faculty member’s drafts waiting for that experiment (0 is drawn). The Drafts tab lists them with the drawn line and the same review, add and discard as FA-16; an added draft leaves the list and appears under Questions with “From a draft you reviewed”. With none, the drawn “No drafts to review” offers “Draft with assistance”.',
    basis:
      'B4-07 f0, f1 `nav.xr-tabs`, `section#Kb-td`, script `qbView` (`nDrafts`, `noDrafts`); Appendix A rule T2',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-17 Import questions (B4-08 f5 … f9) ---------------------------------------------------
  'FA-17.experiment': {
    screen: 'FA-17',
    state: 'Which experiment’s bank the questions go into',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (as FA-14); step 1 names it (“Questions go into your bank for …”), and the back link, Cancel and “Open question bank” go to its bank. An experiment outside the teaching scope, or unknown, is the in-shell not-found page; with no experiment taught, the FA-14 empty state shows instead of the steps.',
    basis:
      'B4-08 f5 “Questions go into your bank for Shell-and-Tube Heat Exchanger.”; Appendix A register “FA-17 · ?experimentId=”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.loading': {
    screen: 'FA-17',
    state: 'The experiments the Faculty member teaches loading (screen readers)',
    words: 'Loading the experiment',
    basis: 'Board 04 “State grammar” Loading formula; B4-08 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.failed': {
    screen: 'FA-17',
    state: 'The experiments the Faculty member teaches failed to load',
    words: 'We couldn’t load the experiment',
    rule: 'With “Nothing has changed. Try again.” and a primary “Try again”, which reads again (the FA-14 formula).',
    basis: 'B4-02 f5 failed formula; B4-08 draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.commit-mode': {
    screen: 'FA-17',
    state: 'A checked file with one or more rows in error (step 2)',
    words: null,
    rule: 'All or nothing, as B4-08 f6 draws it: “Nothing is imported while the file has errors”, “Choose the corrected file” instead of “Continue”, and the service imports every row or none. This is the interim T-24 assumption, not a final policy: importing only the valid rows stays open.',
    basis:
      'B4-08 “Commit: All or nothing while any row has an error — an interim rule, labelled; valid-rows-only is the other option still open (T-24)”; QuestionBankService.commitQuestionImport',
    status: 'provisional',
    decisions: ['T-24'],
  },
  'FA-17.warnings': {
    screen: 'FA-17',
    state: 'A row with an empty explanation',
    words: null,
    rule: 'A warning, not an error: the row is counted as ready, listed with “Warning”, and imports without an explanation. Step 3 says how many have none (“One has no explanation — students would see none for it.”).',
    basis: 'B4-08 f6, f7 (“errors block, warnings don’t”); catalogue `FA-17.row.explanation-empty`',
    status: 'provisional',
    decisions: ['T-24'],
  },
  'FA-17.chooser': {
    screen: 'FA-17',
    state: 'Choosing the file',
    words: null,
    rule: '“Choose a CSV file” opens the browser’s own file chooser (one file, `.csv` / `text/csv`); the chosen file’s name replaces “No file chosen”. Choosing again replaces it. The file is read as text in the browser when chosen — nothing is uploaded or stored — and “Check file” sends its name and text to the service, which reads the rows. “Choose the corrected file” (step 2) goes back to step 1 with no file chosen and focus on “Choose a CSV file” — the board picks its corrected sample file itself (as IA-11). The steps are in the page, not in the address; leaving or reloading the page forgets the file and its check.',
    basis:
      'B4-08 f5 (its chooser picks two sample file names — a canvas stand-in); B4-08 “Same pattern as Import students (B2-07)”; state-copy `IA-11.chooser`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.columns': {
    screen: 'FA-17',
    state: 'A file whose first line lacks one of the template’s ten columns',
    words:
      'This file doesn’t use the template’s columns. Download the template and put one question on each row under its ten columns.',
    rule: 'Shown under the chooser (`xw-ferr`); focus moves to “Choose a CSV file”. Nothing is checked.',
    basis:
      'B4-08 draws the template and its columns only; catalogue `FA-17.file.columns` is undrawn; the “Choose a CSV file first” formula; state-copy `IA-11.file.columns`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.no-rows': {
    screen: 'FA-17',
    state: 'A file with the template’s columns and no question rows',
    words:
      'This file has no questions in it. Add one row per question under the template’s columns.',
    rule: 'Shown under the chooser; focus moves to “Choose a CSV file”.',
    basis:
      'B4-08 f5 “One row per question.”; catalogue `FA-17.file.no-rows` is undrawn; state-copy `IA-11.file.no-rows`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.too-large': {
    screen: 'FA-17',
    state: 'A chosen file larger than 1 MB',
    words:
      'This file is larger than 1 MB. Split the questions into smaller files and import them one at a time.',
    rule: 'The page reads files up to 1 MB (1,048,576 bytes). A larger file is not read: no file is chosen and the words show under the chooser.',
    basis:
      'B4-08 draws no size limit; the cap is a product safeguard for reading the file in the browser (as IA-11), chosen as an interim',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.unreadable': {
    screen: 'FA-17',
    state: 'A chosen file the browser cannot read as text',
    words: 'We couldn’t read this file. Choose it again, or save it as CSV and choose it again.',
    rule: 'No file is chosen and the words show under the chooser.',
    basis: 'B4-08 draws no unreadable file; state-copy `IA-11.file.unreadable`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.question': {
    screen: 'FA-17',
    state: 'A row with an empty question',
    words: 'question is empty. Every row needs the question.',
    basis:
      'B4-08 f5 “question and marks are always required”; the drawn row formula (“explanation is empty. The question imports without one.”); catalogue `FA-17.row.question` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.marks': {
    screen: 'FA-17',
    state: 'A row whose marks are not a whole number of 1 or more',
    words: 'marks isn’t a whole number of 1 or more. Every question needs its marks.',
    basis:
      'B4-08 f5 “question and marks are always required”; B4-07 f6 “Enter the marks, as a whole number of 1 or more”; catalogue `FA-17.row.marks` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.options': {
    screen: 'FA-17',
    state: 'A multiple choice row with fewer than two options',
    words: 'options are missing. A multiple choice question needs at least two options.',
    basis:
      'B4-08 f5 “choice questions need their options”; B4-07 f6 “Add at least two answer options”; catalogue `FA-17.row.options` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.other': {
    screen: 'FA-17',
    state: 'A row problem the screen has no words for',
    words: 'This row doesn’t follow the template. Check it against the template’s columns.',
    basis: 'B4-08 f5 “Use the template”; board 04 refused formula (what is wrong, what to do)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.count-one': {
    screen: 'FA-17',
    state: 'One row, one question, or several warnings',
    words: null,
    rule: '“1 row”; “1 with an error”; “2 with warnings”; “1 question will be added to your bank from <file>.”; “Import 1 question”; the noun follows the number. “1 with a warning” is drawn.',
    basis: 'B4-08 `imView` (“8 rows”, “2 with errors”, “1 with a warning”, “Import 8 questions”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.no-explanation-several': {
    screen: 'FA-17',
    state: 'Step 3 when several rows have no explanation',
    words: '{n} have no explanation — students would see none for them.',
    basis: 'B4-08 f7 “One has no explanation — students would see none for it.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.imported-one': {
    screen: 'FA-17',
    state: 'The result when one question was imported',
    words: '1 question was added to your bank as {id}. It isn’t in an assessment yet.',
    basis:
      'B4-08 f8 “8 questions were added to your bank as Q-0110 to Q-0117. None is in an assessment yet.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.after-import': {
    screen: 'FA-17',
    state: 'After “Import <n> questions”',
    words: null,
    rule: 'The drawn result: overline “Import questions”, title “Questions imported”, “Import finished” naming the first and last new question IDs; the title takes focus. “Open question bank” goes to the experiment’s bank, which lists them; “Import another file” returns to step 1 with no file chosen.',
    basis: 'B4-08 f8 and script `imView` (`done`, `startOver`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.commit.stale': {
    screen: 'FA-17',
    state: 'Import refused because the check is no longer current (already imported, or not found)',
    words: 'This check is no longer current. Check the file again.',
    rule: 'Nothing is imported. Step 1 shows with the same file chosen and these words under the chooser.',
    basis:
      'QuestionBankService.commitQuestionImport `not-found` (a check is committed once) / `invalid-state`; state-copy `IA-11.commit.stale`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.unavailable': {
    screen: 'FA-17',
    state: 'Checking or importing failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the step, the chosen file and the report stay, and the action can be sent again; no message is shown (as IA-11).',
    basis:
      'Appendix F §6.6 “command unavailable → nothing changes … answers kept”; state-copy `IA-11.unavailable`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
