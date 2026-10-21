import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-06 Assessments and FA-07 Create assessment (B4-04) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_ASSESSMENTS = {
  // ---- FA-06 Assessments (B4-04 f0, f9, f10) ----
  'FA-06.loading': {
    screen: 'FA-06',
    state: 'The assessments loading (screen readers)',
    words: 'Loading assessments',
    rule: 'Skeleton rows in a table surface inside “All assessments”, announced politely; the header and “Create assessment” stay.',
    basis:
      'B2-06 f4 “Loading students” (the list pattern); IA-15 “Loading faculty courses”. B4-04 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-06.failed': {
    screen: 'FA-06',
    state: 'The assessments (or the experiments they are for) failed to load',
    words: 'We couldn’t load the assessments',
    rule: 'With the line “Nothing has changed. Try again.” (`FA-06.failed.line`) and a primary “Try again”, which reads both again.',
    basis:
      'B2-06 f5 “We couldn’t load the students” with its line and “Try again”; B4-04 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-06.failed.line': {
    screen: 'FA-06',
    state: 'The failed state’s next step',
    words: 'Nothing has changed. Try again.',
    basis: 'B2-06 f5 “Nothing has changed. Try again.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-06.search': {
    screen: 'FA-06',
    state: 'What “Search assessments” matches',
    words: null,
    rule: 'Any part of the assessment’s name, its ASMT number, its experiment’s name or the course code, ignoring capitals. The list is the service’s; the search and the filters only narrow what is on show.',
    basis: 'B4-04 f0 placeholder “Name or experiment”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-06.filters': {
    screen: 'FA-06',
    state: 'The Course and State filters',
    words: null,
    rule: 'Course lists the codes of the experiments the assessments are for (as Faculty see them), each once; State: Draft = “Draft — not ready”, Ready = “Ready”, Waiting for marking = any submission waiting for a written answer’s marks. The State filter leaves the bar below 600 px of content (`xr-filter-2`), as the v46 sheet draws it.',
    basis: 'B4-04 f0 / f10 toolbar (`select#Lm-c`, `select#Lm-s` in `div.xr-filter-2`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },

  'FA-06.no-reference': {
    screen: 'FA-06',
    state:
      'Where the export or the earlier boards named an assessment, a submission or a question by its reference (FA-06 … FA-12)',
    words: null,
    rule: 'No assessment, attempt, question or draft reference (ASMT-, ATT-, Q-, D-) in the words, accessible names, notices, dialogs, crumbs or tab titles of FA-06 … FA-12: an assessment is named by its name (“Untitled draft” while it has none), a submission by its student and “Attempt 1 of 2”, a question by its words or its place (“Question 2”). The references stay in the addresses, keys and service calls, and FA-06’s search still matches them. The one exception: FA-12’s export confirmation names the file as the service names it.',
    basis:
      'Owner decision 21 Oct 2026 (FA-v1 WHAT-CHANGED P10, “Internal technical IDs leave ordinary labels”; HANDOFF §5c); lead decision 3 (the service’s export file name)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- FA-07 Create assessment (B4-04 f1 … f8, f11) ----
  'FA-07.loading': {
    screen: 'FA-07',
    state: 'The experiments you teach loading (screen readers)',
    words: 'Loading the experiments you teach',
    basis: 'Board 04 Loading formula; IA-05 “Loading …” in the flow. B4-04 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.failed': {
    screen: 'FA-07',
    state: 'The experiments you teach failed to load',
    words: 'We couldn’t load the experiments you teach',
    rule: 'In the flow, with `FA-06.failed.line` and “Try again”; nothing typed is lost.',
    basis: 'B2-06 f5 failed formula; B4-04 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.no-experiments': {
    screen: 'FA-07',
    state: 'A Faculty member with no experiment to teach (no Faculty course mapped)',
    words:
      'Your Institute Admin hasn’t assigned you courses yet. When they assign you a course in Faculty courses, its experiments appear here.',
    rule: 'In place of the radio cards under “Experiments you teach”; “Continue” answers “Choose an experiment”.',
    basis:
      'B4-01 f2 “Your Institute Admin hasn’t assigned you courses yet” / “When they assign you a course in Faculty courses, its experiments, assessments and students appear here.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.bank-loading': {
    screen: 'FA-07',
    state: 'Step 3: the question bank loading (screen readers)',
    words: 'Loading your question bank',
    basis: 'Board 04 Loading formula; B4-04 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.bank-failed': {
    screen: 'FA-07',
    state: 'Step 3: the question bank failed to load',
    words: 'We couldn’t load your question bank',
    rule: 'With `FA-06.failed.line` and “Try again”; the questions chosen so far are kept.',
    basis: 'B2-06 f5 failed formula; B4-04 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.saving': {
    screen: 'FA-07',
    state: '“Save as draft” while the draft is being saved',
    words: 'Saving…',
    basis:
      'B4-04 “Creating…” on “Create assessment” (`is-busy`); the draft’s busy words are undrawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.create-unavailable': {
    screen: 'FA-07',
    state: '“Create assessment” failed for now (service unavailable)',
    words: 'The assessment wasn’t created. Nothing was changed. Try again.',
    rule: 'An error notice above the step; every typed value and chosen question stays, and the button can be pressed again.',
    basis: 'IA-05 “Access wasn’t given. Nothing was changed. Try again.”; B4-04 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.draft-unavailable': {
    screen: 'FA-07',
    state: '“Save as draft” failed for now (service unavailable)',
    words: 'The draft wasn’t saved. Nothing was changed. Try again.',
    rule: 'As `FA-07.create-unavailable`.',
    basis: 'IA-05 “Access wasn’t given. Nothing was changed. Try again.”; B4-04 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.kept': {
    screen: 'FA-07',
    state: 'What is typed and chosen while moving between the steps',
    words: null,
    rule: 'Kept in memory for the signed-in person for the life of the tab — between the steps, on Back and Forward, and across “New question” (FA-15) and back; never written to the browser’s storage. Dropped by Create, Save as draft, Cancel, a sign-in or sign-out, or a reload.',
    basis:
      'B4-04 “Back” and the summary panel; Appendix D §6.5 per-tab drafts (the PU-08 in-memory store, ADR-0004 option A)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.step-address': {
    screen: 'FA-07',
    state: 'A step’s address reached before the earlier steps are complete (a reload, a link)',
    words: null,
    rule: 'The page moves, in place of that address, to the first step that is not complete: an experiment without an assessment, then the rules as “Continue” checks them, then at least one question.',
    basis:
      'Appendix A rule S1 (`?step=experiment|rules|questions|preview`); IA-05 `IA-05.step-address`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.experiment-address': {
    screen: 'FA-07',
    state: 'Create assessment opened with an experiment (`?experimentId=`)',
    words: null,
    rule: 'That experiment is chosen in step 1, when it is one the Faculty member teaches; otherwise nothing is chosen.',
    basis: 'Appendix A FA-07 “Optional ?experimentId= pre-selection from FA-05”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.experiment-change': {
    screen: 'FA-07',
    state: 'Another experiment chosen after questions were chosen',
    words: null,
    rule: 'The chosen questions are dropped (they belong to the other experiment’s bank); the name and rules stay as typed.',
    basis: 'B4-04 f4 “From your question bank · <experiment>”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.question-added': {
    screen: 'FA-07',
    state: 'Back from “New question” (FA-15) with the question added',
    words: null,
    rule: 'Step 3 again, with everything typed before, and the new question chosen.',
    basis: 'B4-04 f4 “New question” → B4-07 Add a question',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.summary-as-typed': {
    screen: 'FA-07',
    state: 'The “This assessment” panel while the rules are being typed',
    words: null,
    rule: 'Each rule once it reads as a value, in the drawn order and words (`FA-shared.rules-partial`), even before “Continue” checks it (“Pass mark 50.5%”, f3); a value that cannot be read as a number or a date is left out until corrected. The panel’s questions are the chosen ones that are in the bank.',
    basis:
      'B4-04 f3 “Pass mark 50.5%”, f4 “Pass mark 50% · 2 attempts · due … · results: after the deadline”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.question-order': {
    screen: 'FA-07',
    state: 'The order of the chosen questions (preview and the created assessment)',
    words: null,
    rule: 'The bank’s order, whatever order they were ticked in (Questions, FA-09, reorders them later).',
    basis: 'B4-04 f5 “Question 1 … 4” in the f4 bank order',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-07.existing-name': {
    screen: 'FA-07',
    state: 'An experiment’s existing assessment that is not in the Faculty member’s list',
    words: null,
    rule: '“Already has an assessment: <its name>” (the assessments list’s name; “Untitled draft” while it has none) — never its reference.',
    basis:
      'FA-v1 Main.dc.html FA-07 `exps` (“Already has an assessment: ” + name || “Untitled draft”); owner decision 21 Oct 2026 (WHAT-CHANGED P10)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-01'],
  },
  'FA-07.exists-refused': {
    screen: 'FA-07',
    state: 'The service refuses Create or Save as draft: the experiment already has an assessment',
    words: null,
    rule: 'Step 1 with f8 drawn (the summary, the field error and the notice with a link to the assessment); everything typed is kept. One assessment per experiment stays an open decision.',
    basis: 'B4-04 f8 “This experiment already has an assessment”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-01'],
  },
  'FA-07.result': {
    screen: 'FA-07',
    state: 'The result after Create or Save as draft',
    words: null,
    rule: 'Shown in place of the steps at the same address (no record address before it exists): the title says what was pressed; the card says the record’s readiness as the service reads it (a draft saved with every rule and a question is Ready), the export’s line, the checklist (“Name and introduction”; “Rules set for this assessment” or “Rules — not finished”; the questions with their marks or “At least one question — none yet”), “Open assessment”, “Back to Assessments” and the product’s own “Create another” (step 1 again, nothing kept). The card never prints the new assessment’s reference.',
    basis:
      'FA-v1 Main.dc.html FA-07 `CW.done` and WHAT-CHANGED (“FA-07’s result card no longer prints the new assessment’s internal id”); Appendix A FA-07 (“states of this route”)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-03'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
