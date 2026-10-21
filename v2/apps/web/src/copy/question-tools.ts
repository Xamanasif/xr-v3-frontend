/**
 * The words of FA-16 Draft questions with assistance and FA-17 Import questions, and of FA-14
 * Question bank's Drafts to review tab, as the owner-approved V3 export draws them (V3 Refined B,
 * design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`: the "FA-16 Draft questions with
 * assistance", "FA-17 Import questions" and "FA-14 Question bank" sections and the script's
 * `vmDraft`, `vmImport`, `vmBank`). Every phrase is in the export's markup or script verbatim, and
 * each composed line takes the script's form with the records' values (`question-tools.test.ts`);
 * what the export does not word is a provisional entry of the state-copy register
 * (`state-copy-question-tools.ts`). The export's sample drafts, file names and counts are never
 * copied: they come from the service's answers and the chosen file. No phrase names a question or
 * a draft by its internal reference (the owner's identifier rule): a draft is named by its text.
 *
 * The drafts come from a deterministic sample stand-in — no drafting service is connected (T-23)
 * — and the screens say so in the register's words (`FA-16.sample-stand-in`); the export's "Sample
 * assistance in this preview" sentence is preview-only. The question type keeps the product's
 * "Multiple choice" (`assessment-words.ts`; lead decision 1), in the import template's words too:
 * the domain's CSV parser reads `multiple choice`.
 */
import {
  fillPlaceholders,
  type MessageKey,
  messageFor,
  QUESTION_IMPORT_ROW_KEYS,
  summaryTitleFor,
  type ValidationFailed,
} from '@xr/contracts/draft';

import { QUESTION_SOURCE_WORDS } from './fa-shared';
import { stateWords } from './state-copy';

/** The export's `plural(n, one)`: "1 draft", "3 drafts". */
function plural(count: number, one: string): string {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

// ---- FA-16 Draft questions with assistance ----

export const DRAFT_QUESTIONS = {
  /** The crumb's current place (`span[aria-current=page]`) and the document title. */
  place: 'Draft with assistance',
  /** The crumb's first level. */
  back: 'Question bank',
  /** `h1#fa-h1` and the `p.rk-sub` under it. */
  title: 'Draft questions with assistance',
  lead: 'Drafts are suggestions for you to check. They never go into your bank on their own.',
  /** The no-course card (`#fa-dr-none`). */
  noCourseTitle: 'Nothing to draft from yet',
  noCourseLine:
    'Drafts are made from an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
  backToBank: 'Back to Question bank',
  /** `h2.xr-sr#fa-dr-fh`. */
  formTitle: 'What to draft',
  /** Step 1: `legend`, `p.fa-nstep-hint` and the two choices. */
  source: 'Material to draft from',
  sourceHint: 'Choose one.',
  sourceBrief: 'The experiment’s lab brief',
  sourcePaste: 'Text I paste',
  sourcePasteSub: 'Your own notes or a passage',
  /** `label[for=fa-dr-paste]` (shown once “Text I paste” is chosen). */
  pasteLabel: 'Text to draft from',
  /** Step 2. */
  types: 'Question types',
  typesHint: 'Choose one or more.',
  /** Step 3. */
  howMany: 'How many drafts',
  howManyHint: 'Shared across the question types you choose.',
  /** `div.fa-draftfoot`. */
  cancel: 'Cancel',
  footNote: 'Drafting adds nothing to your bank.',
  draft: 'Draft questions',
  /** `p.rk-loading-msg#fa-dr-busy`. */
  drafting: 'Drafting questions…',
  /** `#fa-dr-fail` `div.rk-notice--warn`. */
  failTitle: 'Drafting didn’t work this time',
  failLine: 'Nothing was added to your bank. Your choices are kept — try again.',
  /** `h2#fa-dr-lh`, its count when none is left, and `p.rk-next`. */
  listTitle: 'Drafts to review',
  allReviewed: 'All reviewed',
  listLine:
    'Read each draft against the material before adding it. Edit anything that isn’t right.',
  /** `p.fa-dl-done`. */
  allDone: 'Every draft from this request has been added or discarded.',
  /** Each draft's tags (`span.xr-st--warn`, `span.fa-tag`; added: `span.xr-st--ok`). */
  needsReview: 'Draft — needs your review',
  assisted: 'Drafted with assistance',
  inBank: 'In your bank · reviewed by you',
  /** `ul.fa-dopts[aria-label]`, `span.fa-dopt-k`, the `p.fa-dkey` labels. */
  optionsLabel: 'Answer options in this draft',
  correct: 'Correct',
  correctAnswer: 'Correct answer',
  guidance: 'Marking guidance',
  /** Each draft's actions (`div.fa-dcard-act`). */
  reviewEdit: 'Review and edit',
  addToBank: 'Add to bank',
  discard: 'Discard',
  /** The messages after adding or discarding a draft (`F.dr`). */
  added: 'Added to your question bank.',
  discarded: 'Draft discarded. Nothing was added to your bank.',
  /** The side panel (`aside.fa-side`): before the list, then for the request. */
  howTitle: 'How drafting works',
  how: [
    {
      title: 'Drafts arrive as suggestions',
      text: 'Each one is marked “Draft — needs your review”.',
    },
    { title: 'You check every draft', text: 'Edit anything that isn’t right, or discard it.' },
    {
      title: 'Only what you add goes into your bank',
      text: 'An added draft can be used in your assessments.',
    },
  ],
  requestTitle: 'This request',
  facts: {
    drafted: 'Drafted',
    left: 'Left to review',
    added: 'Added to your bank',
    discarded: 'Discarded',
  },
  draftMore: 'Draft more',
  bankTitle: 'Your bank for this experiment',
  bankQuestions: 'Questions',
  bankWaiting: 'Drafts waiting',
} as const;

/** `DR.left`: "3 drafts left to review", or "All reviewed". */
export function leftToReview(count: number): string {
  return count > 0 ? `${plural(count, 'draft')} left to review` : DRAFT_QUESTIONS.allReviewed;
}

/** The step 3 choices (`label[for=fa-dr-n]`): "3 drafts", "5 drafts". */
export function draftsCountWords(count: 3 | 5): string {
  return `${count} drafts`;
}

/** `d.revAria`, `d.addAria`, `d.disAria`: the draft named by its text. */
export function reviewDraftLabel(text: string): string {
  return `Review and edit draft: ${text}`;
}

export function addDraftLabel(text: string): string {
  return `Add to bank: ${text}`;
}

export function discardDraftLabel(text: string): string {
  return `Discard draft: ${text}`;
}

/** An added draft's line (`d.meta`): "In your question bank · Multiple choice". */
export function inBankMetaWords(type: string): string {
  return `In your question bank · ${type}`;
}

/**
 * `DR.briefD`: "Lab brief — Shell-and-Tube Heat Exchanger · PDF document" — the resource's title,
 * then its kind when the service gives one (the Faculty teaching view carries titles only, PC-52:
 * state-copy `FA-16.lab-brief`).
 */
export function labBriefLine(title: string, kind: string | null): string {
  return kind ? `${title} · ${kind}` : title;
}

/** `rk-errsum-t`: "Check these choices" (the catalogue's FA-16 title). */
export function draftSummaryTitle(count: number): string {
  return summaryTitleFor('FA-16', count) ?? '';
}

// ---- FA-14 Question bank: the Drafts to review tab ----

export const BANK_TOOLS = {
  /**
   * The page head's two other ways to add questions: FA-07 and FA-09 draw the same two links, so
   * these two keys live in `fa-shared.ts` (frozen).
   */
  ...QUESTION_SOURCE_WORDS,
  /** `nav.rk-tabs.fa-tabs[aria-label]` and its two tabs. */
  tabsLabel: 'Question bank',
  questionsTab: 'Questions',
  draftsTab: 'Drafts to review',
  /** The Drafts tab's line (`p.rk-hint`). */
  draftsLine:
    'Drafts never go into your bank on their own. Review each one, then add it or discard it.',
  /** `QB.noDrafts`: the empty Drafts tab. */
  noDraftsTitle: 'No drafts to review',
  noDraftsLine: 'Drafts you ask for appear here until you add or discard them.',
  /** The messages after adding or discarding a draft on the tab (`F.bank`). */
  added: 'Added to your question bank.',
  addedLine: 'It’s under Questions now. It isn’t in any assessment yet.',
  discarded: 'Draft discarded. Nothing was added to your bank.',
  /** `r.fromDraft`: a question added from a reviewed draft. */
  fromDraft: 'From a draft you reviewed',
  /** `QB.isEmpty` line. */
  emptyLine:
    'Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.',
  /** The side panel beside the drafts (`#fa-qb-side`) and its three steps. */
  howTitle: 'How review works',
  how: [
    {
      title: 'Check it against the material',
      text: 'Each draft was made with assistance from the material you chose.',
    },
    {
      title: 'Edit what isn’t right',
      text: 'Review and edit opens the draft as a question you can change.',
    },
    { title: 'Add it or discard it', text: 'Only what you add goes into your bank.' },
  ],
} as const;

/** `QB.draftCount`: "3 drafts to review". */
export function draftsToReviewWords(count: number): string {
  return `${plural(count, 'draft')} to review`;
}

/** B4-05 f1 FA-09 “No questions yet” line. */
export const ASSESSMENT_QUESTIONS_EMPTY_LINE =
  'Add questions from your bank, write a new one, draft some with assistance, or import a file. Students can’t see the assessment until it has a question.';

// ---- FA-17 Import questions ----

export const IMPORT_QUESTIONS = {
  /** The crumb's current place; the result's eyebrow. */
  title: 'Import questions',
  back: 'Question bank',
  /** The step titles (each the H1 of its step) and the stepper's name and words. */
  steps: ['Choose a file', 'Check rows', 'Confirm import'],
  stepsLabel: 'Steps to import questions',
  stepDone: ', done',
  stepCurrent: ', current step',
  stepTodo: ', not done yet',
  /** The no-course card (`#fa-im-none`). */
  noCourseTitle: 'Nothing to import into yet',
  noCourseLine:
    'Imported questions belong to an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
  backToBank: 'Back to Question bank',
  // Step 1 · Choose a file
  fileTitle: 'Your CSV file',
  fileHint: 'One row per question, in the template’s columns.',
  noFile: 'No file chosen',
  choose: 'Choose a CSV file',
  /** The hint under the chooser: its first sentence (the rest names the preview's sample file). */
  csvOnly: 'CSV only.',
  cancel: 'Cancel',
  check: 'Check file',
  checking: 'Checking rows…',
  // Step 2 · Check rows
  figures: { rows: 'Rows', ready: 'Ready', errors: 'With errors', warnings: 'With warnings' },
  blockedTitle: 'Nothing is imported while the file has errors',
  blockedLine:
    'Fix the rows marked Error in your file, then choose it again. For now, a file imports whole or not at all.',
  tableTitle: 'Rows that need attention',
  tableColumns: { row: 'Row', question: 'Question', fix: 'What to fix', type: 'Type' },
  errorType: 'Error — blocks import',
  warningType: 'Warning',
  backStep: 'Back',
  /** Step 2 with errors in a file the person chose (`IM.chooseAnother`). */
  chooseAnother: 'Choose another file',
  continue: 'Continue',
  // Step 3 · Confirm import
  notInAssessment: 'They aren’t added to any assessment. You choose where to use them.',
  whatImportingDoes: 'What importing does',
  importing: 'Importing…',
  // Result
  importedTitle: 'Questions imported',
  finished: 'Import finished',
  openBank: 'Open question bank',
  again: 'Import another file',
  // The template (the side panel)
  templateTitle: 'The template',
  templateLine: 'One row per question. A file imports whole or not at all.',
  download: 'Download the template (CSV)',
  columnsTitle: 'Columns',
  columnsLabel: 'Template columns',
} as const;

/**
 * The template's columns as the side panel lists them (`dl.fa-tpl`): each column (or the four
 * option columns together) and what goes in it. `type` names the product's "multiple choice" —
 * the domain's CSV parser reads only that spelling (lead decision 1; the export writes "single
 * choice").
 */
export const QUESTION_TEMPLATE_GUIDE: readonly {
  readonly column: string;
  readonly what: string;
}[] = [
  { column: 'type', what: 'multiple choice, true or false, or written answer' },
  { column: 'question', what: 'always required' },
  { column: 'option_a – option_d', what: 'choice questions: at least two options' },
  { column: 'correct', what: 'A–D, or TRUE / FALSE' },
  { column: 'marks', what: 'always required: a whole number, 1 or more' },
  { column: 'explanation', what: 'optional' },
  { column: 'marking_guidance', what: 'optional, for written answers' },
];

/**
 * "Download the template (CSV)": the header line only, as a `data:` link (the product's file
 * name and line ending, unchanged).
 */
export const QUESTION_TEMPLATE_DOWNLOAD = {
  href: 'data:text/csv;charset=utf-8,type%2Cquestion%2Coption_a%2Coption_b%2Coption_c%2Coption_d%2Ccorrect%2Cmarks%2Cexplanation%2Cmarking_guidance%0A',
  fileName: 'questions-template.csv',
} as const;

/** `IM.dest`: "Questions go into your bank for Shell-and-Tube Heat Exchanger. They aren’t …". */
export function importQuietLine(experimentName: string): string {
  return `Questions go into your bank for ${experimentName}. They aren’t added to any assessment.`;
}

/** `IM.over`: "Step 2 of 3". */
export function importStepWords(step: number): string {
  return `Step ${step} of 3`;
}

/** "8 questions" / "1 question". */
export function questionsWords(count: number): string {
  return plural(count, 'question');
}

/** `IM.confirmText`: "8 questions will be added to your bank from post-lab-questions.csv." */
export function importConfirmLine(count: number, fileName: string): string {
  return `${questionsWords(count)} will be added to your bank from ${fileName}.`;
}

/** Step 3's first point: "They go into your question bank for Shell-and-Tube Heat Exchanger." */
export function importIntoBankLine(experimentName: string): string {
  return `They go into your question bank for ${experimentName}.`;
}

/**
 * `IM.warnLine`: "One has no explanation — students would see none for it."; several,
 * "2 have no explanation — students would see none for them."; none, no point.
 */
export function noExplanationWords(count: number): string | null {
  if (count === 0) return null;
  if (count === 1) return 'One has no explanation — students would see none for it.';
  return fillPlaceholders(stateWords('FA-17.no-explanation-several'), { n: String(count) });
}

/** `IM.importBtn`: "Import 8 questions". */
export function importQuestionsButton(count: number): string {
  return `Import ${questionsWords(count)}`;
}

/**
 * `IM.doneText`: "8 questions were added to your bank. None is in an assessment yet." — how many,
 * never the references they were given (the owner's identifier rule).
 */
export function importedLine(count: number): string {
  return `${questionsWords(count)} ${count === 1 ? 'was' : 'were'} added to your bank. None is in an assessment yet.`;
}

// ---- What to fix: the catalogue's words, else the register's ----

/** The register's words for each row rule the boards state but do not word. */
const UNDRAWN_ROW_WORDS: Readonly<Record<string, () => string>> = {
  question: () => stateWords('FA-17.row.question'),
  marks: () => stateWords('FA-17.row.marks'),
  options: () => stateWords('FA-17.row.options'),
};

/**
 * A report row's problem (`type?value=multi-select`, `correct?value=E&options=A–D`, or a bare
 * rule such as `explanation-empty`) as its rule and the cell values its words name.
 */
export function parseProblem(problem: string): {
  readonly rule: string;
  readonly params: Readonly<Record<string, string>>;
} {
  const at = problem.indexOf('?');
  if (at < 0) return { rule: problem, params: {} };
  return {
    rule: problem.slice(0, at),
    params: Object.fromEntries(new URLSearchParams(problem.slice(at + 1))),
  };
}

/** The catalogue key of a reported rule, or `null` for one no map names. */
export function rowProblemKey(rule: string): MessageKey | null {
  return (QUESTION_IMPORT_ROW_KEYS as Readonly<Record<string, MessageKey>>)[rule] ?? null;
}

/**
 * "What to fix" for one report row: the domain catalogue's words where it words the rule (“correct
 * is “E”, but the question has options A–D only.”), else the register's provisional words; a rule
 * no map names is the register's general line (`FA-17.row.other`).
 */
export function rowProblemWords(problem: string): string {
  const { rule, params } = parseProblem(problem);
  const key = rowProblemKey(rule);
  if (key !== null) {
    try {
      const drawn = messageFor(key, params);
      if (drawn !== null) return drawn;
    } catch {
      // A drawn message missing a value it names: the register's general line instead.
      return stateWords('FA-17.row.other');
    }
  }
  return UNDRAWN_ROW_WORDS[rule]?.() ?? stateWords('FA-17.row.other');
}

/**
 * The words under the chooser for a refused check: "Choose a CSV file first" (the service's own
 * message), or the register's for a file without the template's columns or rows.
 */
export function importFileRefusalWords(error: ValidationFailed): string | null {
  for (const item of error.fieldErrors) {
    if (item.field !== 'fileName' && item.field !== 'file') continue;
    if (item.message) return item.message;
    if (item.key === 'FA-17.file.columns') return stateWords('FA-17.file.columns');
    if (item.key === 'FA-17.file.no-rows') return stateWords('FA-17.file.no-rows');
  }
  return null;
}

/** The largest file the page reads (state-copy `FA-17.file.too-large`): 1 MB. */
export const MAX_QUESTION_FILE_BYTES = 1_048_576;

export const QUESTION_CHOOSER_WORDS = {
  tooLarge: stateWords('FA-17.file.too-large'),
  unreadable: stateWords('FA-17.file.unreadable'),
  stale: stateWords('FA-17.commit.stale'),
} as const;
