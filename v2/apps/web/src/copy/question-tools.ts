/**
 * The words of FA-16 Draft questions with assistance and FA-17 Import questions (board B4-08
 * f0 … f9), and of what FA-14 Question bank (B4-07 f0, f1, f7) and FA-09's empty Questions tab
 * (B4-05 f1) show of them since Phase 4B. Every phrase here is the frozen board's own — a frame's
 * markup or its script's formula (`drView`, `imView`, `qbView`), found verbatim by
 * `question-tools.test.ts`; what the boards do not word is a provisional entry of the state-copy
 * register (`state-copy-question-tools.ts`, VD-12). The boards' sample drafts, file names, counts
 * and question IDs are never copied: they come from the service's answers and the chosen file.
 *
 * The drafts come from a deterministic sample stand-in — no drafting service is connected (T-23)
 * — and the screens say so in the register's words (`FA-16.sample-stand-in`).
 */
import {
  fillPlaceholders,
  type MessageKey,
  messageFor,
  QUESTION_IMPORT_ROW_KEYS,
  summaryTitleFor,
  type ValidationFailed,
} from '@xr/contracts/draft';

import { stateWords } from './state-copy';

// ---- FA-16 Draft questions with assistance (B4-08 f0 … f4) ----

export const DRAFT_QUESTIONS = {
  /** f0 top bar and crumb (`span.xr-top-title`, `span[aria-current=page]`). */
  place: 'Draft with assistance',
  /** f0 `a.xr-back`. */
  back: 'Question bank',
  /** f0 `h1.xr-h1`. */
  title: 'Draft questions with assistance',
  /** f0 `div.xr-phead-meta` `span.xl-meta`. */
  lead: 'Drafts are suggestions for you to check. They never go into your bank on their own.',
  /** f0 `fieldset#Dd-src` legend and its two choices. */
  source: 'Draft from',
  sourceBrief: 'The experiment’s lab brief',
  sourcePaste: 'Text I paste',
  sourcePasteSub: 'Your own notes or a passage',
  /** `label[for=Dd-paste]` (shown once “Text I paste” is chosen). */
  pasteLabel: 'Text to draft from',
  /** f0 `fieldset#Dd-types` legend. */
  types: 'Question types',
  /** f0 `label[for=Dd-n]` and its first option. */
  howMany: 'How many drafts',
  choose: 'Choose',
  /** f0 `div.xw-flow-foot`. */
  cancel: 'Cancel',
  draft: 'Draft questions',
  /** `d.busy`: `p.xa-save[role=status]`. */
  drafting: 'Drafting questions…',
  /** f3 `#Dd-fail` `div.xr-notice--err`. */
  failTitle: 'Drafting didn’t work this time',
  failLine: 'Nothing was added to your bank. Try again.',
  /** f1 `h2#Dd-lh` and its line (`p.xl-open`). */
  listTitle: 'Drafts to review',
  listLine:
    'Read each draft against the material before adding it. Edit anything that isn’t right.',
  /** f1 each draft's tags (`span.xa-tag--draft`, `span.xa-tag`). */
  needsReview: 'Draft — needs your review',
  assisted: 'Drafted with assistance',
  /** `d.added`: the green tag of a draft added on this visit. */
  inBank: 'In your bank · reviewed by you',
  /** f1 each draft's actions (`div.xw-actions`). */
  reviewEdit: 'Review and edit',
  addToBank: 'Add to bank',
  discard: 'Discard',
  /** f1 `div.xr-section-body` `button.xr-btn--text`. */
  draftMore: 'Draft more',
  /** `d.discard` message. */
  discarded: 'Draft discarded. Nothing was added.',
} as const;

/** `d.left`: "3 left to review". */
export function leftToReview(count: number): string {
  return `${count} left to review`;
}

/** `d.add` / `qbView` add message: "Added to your question bank as Q-0107." */
export function addedToBank(questionId: string): string {
  return `Added to your question bank as ${questionId}.`;
}

/** `d.addAria`: "Add draft “…” to your question bank". */
export function addDraftLabel(text: string): string {
  return `Add draft “${text}” to your question bank`;
}

/** `d.disAria`: "Discard draft “…”". */
export function discardDraftLabel(text: string): string {
  return `Discard draft “${text}”`;
}

/**
 * f0 `span.xr-choice-sub`: "Lab brief — Shell-and-Tube Heat Exchanger · PDF document" — the
 * resource's title, then its kind when the service gives one (the Faculty teaching view carries
 * titles only, PC-52: state-copy `FA-16.lab-brief`).
 */
export function labBriefLine(title: string, kind: string | null): string {
  return kind ? `${title} · ${kind}` : title;
}

/** f2 `div.xw-errsum` `strong`: "Check these choices" (the catalogue's FA-16 title). */
export function draftSummaryTitle(count: number): string {
  return summaryTitleFor('FA-16', count) ?? '';
}

// ---- FA-14 Question bank: drafting and importing (B4-07 f0, f1, f7) ----

export const BANK_TOOLS = {
  /** f0 `div.xr-phead-actions` `a.xr-btn--secondary` (×2); f7's empty state's “Import”. */
  draftWithAssistance: 'Draft with assistance',
  import: 'Import',
  /** f0 `nav.xr-tabs[aria-label]` and its two tabs. */
  tabsLabel: 'Question bank',
  questionsTab: 'Questions',
  draftsTab: 'Drafts to review',
  /** f1 `section#Kb-td` line (`p.xl-open`). */
  draftsLine:
    'Drafts never go into your bank on their own. Review each one, then add it or discard it.',
  /** `b.noDrafts`: the empty Drafts tab. */
  noDraftsTitle: 'No drafts to review',
  noDraftsLine: 'Drafts you ask for appear here until you add or discard them.',
  /** `qbView` discard message. */
  discarded: 'Draft discarded. Nothing was added to your bank.',
  /** f0 `r.isFromDraft`: a question added from a reviewed draft. */
  fromDraft: 'From a draft you reviewed',
  /** f7 `div.xr-empty` line. */
  emptyLine:
    'Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.',
} as const;

/** B4-05 f1 FA-09 “No questions yet” line. */
export const ASSESSMENT_QUESTIONS_EMPTY_LINE =
  'Add questions from your bank, write a new one, draft some with assistance, or import a file. Students can’t see the assessment until it has a question.';

// ---- FA-17 Import questions (B4-08 f5 … f9) ----

export const IMPORT_QUESTIONS = {
  /** f5 top bar and crumb; the steps' accessible name; f8's overline. */
  title: 'Import questions',
  back: 'Question bank',
  steps: ['Choose a file', 'Check rows', 'Confirm import'],
  // Step 1 · Choose a file (f5, f9)
  templateHeading: 'Use the template',
  columnsLabel: 'Template columns',
  download: 'Download the template (CSV)',
  noFile: 'No file chosen',
  choose: 'Choose a CSV file',
  cancel: 'Cancel',
  check: 'Check file',
  checking: 'Checking rows…',
  // Step 2 · Check rows (f6)
  blockedTitle: 'Nothing is imported while the file has errors',
  blockedLine: 'Fix the rows marked Error in your file, then choose it again.',
  tableCaption: 'Rows that need attention',
  tableColumns: { row: 'Row', question: 'Question', fix: 'What to fix', type: 'Type' },
  errorType: 'Error — blocks import',
  warningType: 'Warning',
  backStep: 'Back',
  chooseFixed: 'Choose the corrected file',
  continue: 'Continue',
  // Step 3 · Confirm import (f7)
  notInAssessment: 'They aren’t added to any assessment.',
  importing: 'Importing…',
  // Result (f8)
  importedTitle: 'Questions imported',
  finished: 'Import finished',
  openBank: 'Open question bank',
  again: 'Import another file',
} as const;

/**
 * B4-08 "Download the template (CSV)": the header line only, as the board's `data:` link serves
 * it (the handoff marks its `data:` links as intentional; the product serves the same file).
 */
export const QUESTION_TEMPLATE_DOWNLOAD = {
  href: 'data:text/csv;charset=utf-8,type%2Cquestion%2Coption_a%2Coption_b%2Coption_c%2Coption_d%2Ccorrect%2Cmarks%2Cexplanation%2Cmarking_guidance%0A',
  fileName: 'questions-template.csv',
} as const;

/** A run of the template line: plain words, or a template column's name in `<strong>`. */
export type QuestionTemplateRun = string | { readonly column: string };

/** f5 "Use the template" line, with its six `<strong>` column names. */
export const QUESTION_TEMPLATE_LINE: readonly QuestionTemplateRun[] = [
  'One row per question. ',
  { column: 'type' },
  ' is multiple choice, true or false, or written answer. ',
  { column: 'question' },
  ' and ',
  { column: 'marks' },
  ' are always required; choice questions need their options and ',
  { column: 'correct' },
  ' (A–D, or TRUE / FALSE). ',
  { column: 'explanation' },
  ' and ',
  { column: 'marking_guidance' },
  ' are optional.',
];

/** f5 `p.xr-meta`: "Questions go into your bank for Shell-and-Tube Heat Exchanger. They aren’t …". */
export function importQuietLine(experimentName: string): string {
  return `Questions go into your bank for ${experimentName}. They aren’t added to any assessment.`;
}

/** `imView.over`: "Step 2 of 3". */
export function importStepWords(step: number): string {
  return `Step ${step} of 3`;
}

/** `imView.totalText`: "8 rows" (one: state-copy `FA-17.count-one`). */
export function rowsWords(count: number): string {
  return count === 1 ? '1 row' : `${count} rows`;
}

/** `imView.okText`: "6 ready". */
export function readyCountWords(count: number): string {
  return `${count} ready`;
}

/** `imView.errText`: "2 with errors" (one: state-copy `FA-17.count-one`). */
export function errorCountWords(count: number): string {
  return count === 1 ? '1 with an error' : `${count} with errors`;
}

/** `imView.warnText`: "1 with a warning" (several: state-copy `FA-17.count-one`). */
export function warningCountWords(count: number): string {
  return count === 1 ? '1 with a warning' : `${count} with warnings`;
}

/** "8 questions" / "1 question": f7's first `<strong>`. */
export function questionsWords(count: number): string {
  return count === 1 ? '1 question' : `${count} questions`;
}

/** f7 lead: "<strong>8 questions</strong> will be added to your bank from <strong>…</strong>." */
export const IMPORT_CONFIRM_LINE = {
  middle: ' will be added to your bank from ',
  end: '.',
} as const;

/**
 * f7's second point: "One has no explanation — students would see none for it." Several are the
 * register's (`FA-17.no-explanation-several`); none, no point.
 */
export function noExplanationWords(count: number): string | null {
  if (count === 0) return null;
  if (count === 1) return 'One has no explanation — students would see none for it.';
  return fillPlaceholders(stateWords('FA-17.no-explanation-several'), { n: String(count) });
}

/** `imView.importBtn`: "Import 8 questions". */
export function importQuestionsButton(count: number): string {
  return `Import ${questionsWords(count)}`;
}

/**
 * f8 notice: "8 questions were added to your bank as Q-0110 to Q-0117. None is in an assessment
 * yet." (one: state-copy `FA-17.count-one`).
 */
export function importedLine(added: readonly string[]): string {
  if (added.length === 1) {
    return fillPlaceholders(stateWords('FA-17.imported-one'), { id: added[0]! });
  }
  return `${added.length} questions were added to your bank as ${added[0] ?? ''} to ${added.at(-1) ?? ''}. None is in an assessment yet.`;
}

// ---- What to fix: the catalogue's drawn words, else the register's ----

/** The register's words for each row rule B4-08 states but does not word. */
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
 * "What to fix" for one report row: B4-08's words where it draws them (“correct is “E”, but the
 * question has options A–D only.”), else the register's provisional words; a rule no map names is
 * the register's general line (`FA-17.row.other`).
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
 * The words under the chooser for a refused check: "Choose a CSV file first" (drawn, the
 * service's own message), or the register's for a file without the template's columns or rows.
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
