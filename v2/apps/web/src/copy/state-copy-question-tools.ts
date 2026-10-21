import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of FA-16 Draft questions with assistance and FA-17 Import questions, and
 * FA-14’s Drafts to review tab — part of the one register (`state-copy.ts`, VD-12): every state
 * string or rule these screens show that the owner-approved V3 export
 * (design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`) does not draw word for word, with its
 * basis and the decisions it waits on. Decision ids never appear in visible copy, and no words name
 * a question or a draft by its internal reference (the owner's identifier rule, 21 Oct 2026).
 */
export const STATE_COPY_QUESTION_TOOLS = {
  // ---- FA-16 Draft questions with assistance -----------------------------------------------------
  'FA-16.sample-stand-in': {
    screen: 'FA-16',
    state:
      'The drafts come from the prototype’s sample stand-in (no drafting service is connected)',
    words:
      'Sample drafts: no drafting service is connected yet, so the drafts come from a fixed sample set for this prototype. Check each one before you add it.',
    rule: 'The role’s sample note (`div.fa-sample`, a note) at the top of the form and of every list of drafts (FA-16’s “Drafts to review” and FA-14’s Drafts tab). The export’s own sentence (“Sample assistance in this preview. …”) names the preview, so the product keeps these words. The stand-in drafts in a fixed order from the chosen types and never reads the material; nothing enters the bank until the Faculty member adds a draft.',
    basis:
      'FA-v1 Main.dc.html FA-16 `div.fa-sample` (preview words); the sample platform’s drafting stand-in (T-23: no provider)',
    status: 'provisional',
    decisions: ['T-23', 'OD-B4-12'],
  },
  'FA-16.experiment': {
    screen: 'FA-16',
    state: 'Which experiment the drafts are for',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (as FA-14); “<experiment> · <code>” is the eyebrow, and the crumb, Cancel and “Back to Question bank” return to its bank. An experiment outside the teaching scope, or unknown, is the in-shell not-found page; with no experiment taught, the drawn “Nothing to draft from yet” card shows instead of the form.',
    basis:
      'FA-v1 Main.dc.html FA-16 `DR.ctx`, `DR.noCourse`; Appendix A register “FA-16 · ?experimentId=”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.lab-brief': {
    screen: 'FA-16',
    state: 'The lab brief the first choice names',
    words: null,
    rule: 'The line under “The experiment’s lab brief” is the title of the experiment’s published resource whose title begins “Lab brief”, as Students see it. The Faculty teaching view gives resource titles only, so the export’s “· PDF document” (the resource’s kind) is not shown. With no such resource the choice has no second line.',
    basis:
      'FA-v1 Main.dc.html FA-16 `DR.briefD`; `teachingExperimentOutput.resources` (titles only, PC-52)',
    status: 'provisional',
    decisions: ['VD-12', 'PC-52'],
  },
  'FA-16.loading': {
    screen: 'FA-16',
    state: 'The experiment and its material loading',
    words: 'Loading the experiment…',
    basis: 'The V3 kit’s loading line (`rk-loading-msg`); the export draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.failed': {
    screen: 'FA-16',
    state: 'The experiment or its material failed to load',
    words: 'We couldn’t load the experiment',
    rule: 'With “Nothing has changed. Try again.” and “Try again”, which reads again (the V3 failed list state).',
    basis: 'The Faculty failed formula; the export draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.request': {
    screen: 'FA-16',
    state: '“Draft questions”',
    words: null,
    rule: 'The three numbered steps (material, types, 3 or 5 drafts; a step is marked done once it is answered). The service checks the choices and answers the drawn words (“Check these choices” and each field’s line; choosing clears its error). While it drafts, the drawn “Drafting questions…” section replaces the form. Then the list of drafts shows and its heading takes focus. If drafting fails for now, the form returns with its choices and the drawn “Drafting didn’t work this time”, which takes focus; pressing “Draft questions” tries again. “Draft more” returns to the form with the choices kept.',
    basis: 'FA-v1 Main.dc.html `vmDraft` (`gen`, `busy`, `fail`, `again`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.list': {
    screen: 'FA-16',
    state: 'Which drafts “Drafts to review” lists, and the side panel’s figures',
    words: null,
    rule: 'Every draft of the Faculty member’s that waits for review for this experiment, oldest first — earlier requests’ drafts too — and the drafts added to the bank on this visit, each with “In your bank · reviewed by you” and no actions. “<n> drafts left to review” counts the waiting ones (“All reviewed” at none). “This request”: Drafted (the request’s drafts), Left to review, Added to your bank and Discarded (this visit). “Your bank for this experiment”: the bank’s questions and the drafts waiting (the bank’s and the drafts’ reads). The page opens on the form even when drafts wait; FA-14’s Drafts tab lists them too. Leaving the page forgets the request.',
    basis:
      'FA-v1 Main.dc.html `vmDraft` (`d.added`, `DR.left`, `DR.nDrafted` …, `DR.nBank`, `DR.nWaiting`); QuestionBankService.listDrafts (“own drafts”, Q-05), listQuestions',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.marks': {
    screen: 'FA-16',
    state: 'A draft’s marks and where it came from',
    words: null,
    rule: 'A draft has no marks: they are the Faculty member’s to set. Each draft shows its type alone (the export’s “· 2 marks”, and FA-14’s “· from the experiment’s lab brief, 4 Nov 2026”, are not shown: a draft records neither marks nor its material), and Marks starts empty in “Review and edit”. “Add to bank” on a draft with no marks opens its fields with the drawn “Enter the marks, as a whole number of 1 or more” and the summary “Check this question”, which takes focus.',
    basis:
      'FA-v1 Main.dc.html `draftMeta`; the contract’s draft (`marks: null`, no source field; OD-B4-12); the FA-15 field words',
    status: 'provisional',
    decisions: ['OD-B4-12', 'T-23'],
  },
  'FA-16.review-edit': {
    screen: 'FA-16',
    state: '“Review and edit” a draft',
    words: null,
    rule: 'Opens the FA-15 sections inside the draft’s card, in place (no new page; the export opens FA-15 “Review a draft”): Question type, Question and answer (Answer options A–D with one Correct, “The statement is” True / False, or Marking guidance), Marks and explanation, filled from the draft, with Cancel and “Add to bank”. While the fields are open the card’s own three actions make way for them and focus moves to Question. “Add to bank” sends the fields as they are now (busy: “Saving…”); the service checks them with the FA-15 words. Cancel closes the fields, keeps what was typed while the page is open (the card’s “Add to bank” then sends that) and returns focus to “Review and edit”.',
    basis:
      'FA-v1 Main.dc.html FA-14 / FA-16 `d.review` (→ FA-15 “Review a draft”); QuestionBankService.addDraftToBank (the reviewed content, Q-05)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.draft-gone': {
    screen: 'FA-16',
    state: 'Adding or discarding a draft that no longer waits (added or discarded elsewhere)',
    words: 'This draft is no longer waiting for review. The list has been read again.',
    rule: 'A warning notice in the list’s message slot, with focus; the list is read again.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); the export draws no conflict',
    status: 'provisional',
    decisions: ['P1-21'],
  },
  'FA-16.draft-unavailable': {
    screen: 'FA-16',
    state: 'Adding or discarding a draft failed for now (service unavailable)',
    words: 'That didn’t work this time. Nothing has changed — try again.',
    rule: 'A warning notice in the list’s message slot, with focus; the draft and anything typed in its fields stay.',
    basis: 'Appendix F §6.6 “command unavailable → nothing changes”; the drafting failure formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.drafts-loading': {
    screen: 'FA-16',
    state: 'The drafts loading',
    words: 'Loading your drafts…',
    basis: 'The V3 kit’s loading line (`rk-loading-msg`); the export draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-16.drafts-failed': {
    screen: 'FA-16',
    state: 'The drafts failed to load',
    words: 'We couldn’t load your drafts',
    rule: 'In the list’s place, with “Nothing has changed. Try again.” and “Try again”, which reads again.',
    basis: 'The Faculty failed formula; the export draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-14 Question bank · Drafts to review --------------------------------------------------------
  'FA-14.drafts-tab': {
    screen: 'FA-14',
    state: 'The “Questions · Drafts to review” tabs',
    words: null,
    rule: 'Record tabs under the page head, for the experiment on show, each with its count: “Questions” (`/faculty/question-bank?experimentId=`; the bank’s questions) and “Drafts to review” (`?tab=drafts`; the Faculty member’s drafts waiting for that experiment, 0 drawn). The Drafts tab lists them as review cards with the drawn line, “<n> drafts to review”, “How review works” beside them, and the same review, add and discard as FA-16; an added draft leaves the list and appears under Questions with “From a draft you reviewed”. With none, the drawn “No drafts to review” offers “Draft with assistance”.',
    basis:
      'FA-v1 Main.dc.html FA-14 `nav.rk-tabs.fa-tabs`, `QB.tabD`, `QB.draftCount`, `QB.noDrafts`; Appendix A rule T2',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-17 Import questions --------------------------------------------------------------------
  'FA-17.experiment': {
    screen: 'FA-17',
    state: 'Which experiment’s bank the questions go into',
    words: null,
    rule: 'The experiment named by `?experimentId=`, else the first experiment the Faculty member teaches (as FA-14); step 1 names it (“Questions go into your bank for …”), and the crumb, Cancel and “Open question bank” go to its bank. An experiment outside the teaching scope, or unknown, is the in-shell not-found page; with no experiment taught, the drawn “Nothing to import into yet” card shows instead of the steps.',
    basis:
      'FA-v1 Main.dc.html FA-17 `IM.dest`, `IM.noCourse`; Appendix A register “FA-17 · ?experimentId=”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.loading': {
    screen: 'FA-17',
    state: 'The experiments the Faculty member teaches loading',
    words: 'Loading the experiment…',
    basis: 'The V3 kit’s loading line (`rk-loading-msg`); the export draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.failed': {
    screen: 'FA-17',
    state: 'The experiments the Faculty member teaches failed to load',
    words: 'We couldn’t load the experiment',
    rule: 'With “Nothing has changed. Try again.” and “Try again”, which reads again (the V3 failed list state).',
    basis: 'The Faculty failed formula; the export draws no failure to load',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.commit-mode': {
    screen: 'FA-17',
    state: 'A checked file with one or more rows in error (step 2)',
    words: null,
    rule: 'All or nothing, as the export draws it: “Nothing is imported while the file has errors”, “Choose another file” instead of “Continue”, and the service imports every row or none. This is the interim T-24 assumption, not a final policy: importing only the valid rows stays open.',
    basis:
      'FA-v1 Main.dc.html FA-17 `IM.hasErrors`, `IM.blocked`, `IM.ownFile`; QuestionBankService.commitQuestionImport',
    status: 'provisional',
    decisions: ['T-24'],
  },
  'FA-17.warnings': {
    screen: 'FA-17',
    state: 'A row with an empty explanation',
    words: null,
    rule: 'A warning, not an error: the row is counted as ready, listed with “Warning”, and imports without an explanation. Step 3 says how many have none (“One has no explanation — students would see none for it.”).',
    basis:
      'FA-v1 Main.dc.html `checkImport`, `IM.warnLine`; catalogue `FA-17.row.explanation-empty`',
    status: 'provisional',
    decisions: ['T-24'],
  },
  'FA-17.chooser': {
    screen: 'FA-17',
    state: 'Choosing the file',
    words: null,
    rule: '“Choose a CSV file” opens the browser’s own file chooser (one file, `.csv` / `text/csv`); the chosen file’s name replaces “No file chosen”. Choosing again replaces it. The file is read as text in the browser when chosen — nothing is uploaded or stored — and “Check file” sends its name and text to the service, which reads the rows. “Choose another file” (step 2) goes back to step 1 with no file chosen and focus on “Choose a CSV file”. The export’s sample-file buttons are preview-only. The steps are in the page, not in the address; leaving or reloading the page forgets the file and its check.',
    basis:
      'FA-v1 Main.dc.html FA-17 (its “Use the sample file” and “Choose the corrected file” pick the preview’s sample files); state-copy `IA-11.chooser`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.columns': {
    screen: 'FA-17',
    state: 'A file whose first line lacks one of the template’s ten columns',
    words:
      'This file doesn’t use the template’s columns. Download the template and put one question on each row under its ten columns.',
    rule: 'Shown under the chooser (`rk-ferr`, an alert) on step 1; focus moves to “Choose a CSV file”. Nothing is checked (the export reports a file problem on step 2 as “This file can’t be checked”; the service refuses the check instead).',
    basis:
      'FA-v1 Main.dc.html FA-17 `IM.fileErr`; catalogue `FA-17.file.columns` is undrawn; state-copy `IA-11.file.columns`',
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
      'FA-v1 Main.dc.html FA-17 (“One row per question”); catalogue `FA-17.file.no-rows` is undrawn; state-copy `IA-11.file.no-rows`',
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
      'The export’s preview guard (1 MB); the cap is a product safeguard for reading the file in the browser (as IA-11), chosen as an interim',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.file.unreadable': {
    screen: 'FA-17',
    state: 'A chosen file the browser cannot read as text',
    words: 'We couldn’t read this file. Choose it again, or save it as CSV and choose it again.',
    rule: 'No file is chosen and the words show under the chooser. (The export’s by-name refusal of a spreadsheet workbook is not added: the product keeps its own states, lead decision 1.)',
    basis: 'The export draws no unreadable file; state-copy `IA-11.file.unreadable`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.question': {
    screen: 'FA-17',
    state: 'A row with an empty question',
    words: 'question is empty. Every row needs the question.',
    basis:
      'FA-v1 Main.dc.html the template (“question · always required”); the drawn row formula; catalogue `FA-17.row.question` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.marks': {
    screen: 'FA-17',
    state: 'A row whose marks are not a whole number of 1 or more',
    words: 'marks isn’t a whole number of 1 or more. Every question needs its marks.',
    basis:
      'FA-v1 Main.dc.html the template (“marks · always required: a whole number, 1 or more”); catalogue `FA-17.row.marks` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.options': {
    screen: 'FA-17',
    state: 'A multiple choice row with fewer than two options',
    words: 'options are missing. A multiple choice question needs at least two options.',
    basis:
      'FA-v1 Main.dc.html the template (“choice questions: at least two options”); catalogue `FA-17.row.options` is undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.row.other': {
    screen: 'FA-17',
    state: 'A row problem the screen has no words for',
    words: 'This row doesn’t follow the template. Check it against the template’s columns.',
    basis:
      'FA-v1 Main.dc.html “The template”; board 04 refused formula (what is wrong, what to do)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.count-one': {
    screen: 'FA-17',
    state: 'One question, or several warnings',
    words: null,
    rule: '“1 question will be added to your bank from <file>.”; “Import 1 question”; “1 question was added to your bank. None is in an assessment yet.”; the noun follows the number. The check’s counts are figures (Rows, Ready, With errors, With warnings).',
    basis: 'FA-v1 Main.dc.html `vmImport` (`plural`, `IM.doneText`, `dl.fa-repfigs`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.confirm-types': {
    screen: 'FA-17',
    state: 'Step 3’s figures by question type',
    words: null,
    rule: 'Not shown: the service’s check reports the rows checked and the rows with problems, not how many of each type are ready. Step 3 shows the line, what importing does and the warning count.',
    basis: 'FA-v1 Main.dc.html FA-17 `IM.byType`; QuestionImportReport (no per-type count)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.no-explanation-several': {
    screen: 'FA-17',
    state: 'Step 3 when several rows have no explanation',
    words: '{n} have no explanation — students would see none for them.',
    basis:
      'FA-v1 Main.dc.html `IM.warnLine` (“ have no explanation — students would see none for them.”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-17.after-import': {
    screen: 'FA-17',
    state: 'After “Import <n> questions”',
    words: null,
    rule: 'The drawn result: eyebrow “Import questions”, title “Questions imported”, “Import finished” with how many were added (never the references they were given); the title takes focus. “Open question bank” goes to the experiment’s bank, which lists them; “Import another file” returns to step 1 with no file chosen.',
    basis: 'FA-v1 Main.dc.html `vmImport` (`IM.done`, `IM.doneText`, `IM.again`)',
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
