/**
 * The words of FA-14 Question bank and FA-15 Add / edit question as the owner-approved V3 export
 * draws them (V3 Refined B, design/v3-refined-b/roles/FA-v1 `project/Main.dc.html`: the "FA-14
 * Question bank" and "FA-15 Add / edit question" sections, the delete dialog, and the script's
 * `vmBank`, `dlgBank`, `vmEditor`, `qeCommit`), written from the facts `QuestionBankService` answers
 * (each question with how many assessments use it; one question with the assessments that use it)
 * and the taught experiments of `getCreateOptions`. Every phrase is in the export's markup or
 * script verbatim, and each composed line takes the script's form with the records' values
 * (`question-bank.test.tsx`); what the export does not word is a provisional entry of the
 * state-copy register (`state-copy-question-bank.ts`). The export's sample questions, counts and
 * dates are never copied: they come from the records.
 *
 * The owner's identifier rule: no phrase names a question by its internal reference — a question is
 * named by its text, an assessment by its name. The question type keeps the product's "Multiple
 * choice" (`assessment-words.ts`, which the Student pages share, and the domain's CSV rule); the
 * export's "Single choice" is not adopted (lead decision 1).
 */

/** FA-14: the page head, the no-course card, the Questions section, its toolbar and table. */
export const QUESTION_BANK = {
  /** `div.rk-head-act` `a.rb-btn--primary`. */
  addQuestion: 'Add a question',
  /** `QB.sub` with no course. */
  noCourseLead: 'Questions belong to the experiments you teach.',
  /** The no-course card (`#fa-qb-none`), its line and its way on. */
  noCourseTitle: 'Your question bank opens with your first course',
  noCourseLine:
    'Questions belong to the experiments you teach. Your Institute Admin hasn’t assigned you a course yet.',
  help: 'Help & support',
  /** `h2#fa-tabh`. */
  sectionTitle: 'Questions',
  /** `div.rk-tools[role=search][aria-label]`, the search field and its placeholder. */
  filterLabel: 'Filter questions',
  search: 'Search',
  searchPlaceholder: 'Words in the question',
  /** `label[for=fa-qb-exp]`, `label[for=fa-qb-type]` and its first option. */
  experiment: 'Experiment',
  type: 'Type',
  allTypes: 'All types',
  /** `button.rk-clear`, and the no-match state's button. */
  clearFilters: 'Clear filters',
  /** The table's caption and heads (the last is `span.xr-sr`). */
  caption: 'Questions in your bank',
  columns: {
    question: 'Question',
    marks: 'Marks',
    used: 'Used in',
    added: 'Added',
    actions: 'Actions',
  },
  /** `r.usedMain` when no assessment uses the question. */
  notUsed: 'Not yet',
  /** Each row's actions (`a.rb-btn`, `button.rb-btn--ghost`). */
  edit: 'Edit',
  delete: 'Delete',
  /** `QB.noMatch` (`div.rk-state`). */
  noMatchTitle: 'No question matches these filters',
  noMatchLine: 'Try fewer filters or other words.',
  /** `QB.isEmpty` (`div.rk-state--roomy`). */
  emptyTitle: 'Your question bank is empty',
  /** `div.fa-deletedbox` `h3.fa-k`. */
  deletedTitle: 'Deleted',
} as const;

/** `QB.sub`: "Your questions for Shell-and-Tube Heat Exchanger · ME ZG523. Drafts stay apart …". */
export function bankLead(experimentName: string, courseCode: string | null): string {
  const what = courseCode ? `${experimentName} · ${courseCode}` : experimentName;
  return `Your questions for ${what}. Drafts stay apart until you review them.`;
}

/** The export's `plural(n, one)`: "1 question", "6 questions". */
function plural(count: number, one: string): string {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

/** `QB.count`: "6 questions"; with a filter applied, "3 of 6 questions". */
export function questionCount(total: number, shown?: number): string {
  return shown === undefined
    ? plural(total, 'question')
    : `${shown} of ${plural(total, 'question')}`;
}

/**
 * `QB.split`: "3 multiple choice · 2 true or false · 1 written answer" — the types with none are
 * left out (the export's "single choice" is the product's "multiple choice", lead decision 1).
 */
export function typeSplitWords(counts: {
  readonly multipleChoice: number;
  readonly trueFalse: number;
  readonly written: number;
}): string {
  return [
    counts.multipleChoice ? `${counts.multipleChoice} multiple choice` : '',
    counts.trueFalse ? `${counts.trueFalse} true or false` : '',
    counts.written ? plural(counts.written, 'written answer') : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/** The chips: "Search: “ntu”", "Type: True or false". */
export function searchChipWords(query: string): string {
  return `Search: “${query}”`;
}

export function typeChipWords(type: string): string {
  return `Type: ${type}`;
}

/** A chip's remove button (`c.aria`): "Remove filter Type: True or false". */
export function removeFilterLabel(chip: string): string {
  return `Remove filter ${chip}`;
}

/** `r.marks`: "2 marks", "1 mark". */
export function marksWords(marks: number): string {
  return plural(marks, 'mark');
}

/** `r.idv` / `QE.idText`: "Version 2" (only when there is more than one version). */
export function versionWords(version: number): string {
  return `Version ${version}`;
}

/** The phone line `span.fa-mob`: "added 20 Oct 2026". */
export function addedOnWords(day: string): string {
  return `added ${day}`;
}

/** `r.editAria`, `r.delAria`: the question named by its text. */
export function editLabel(text: string): string {
  return `Edit question: ${text}`;
}

export function deleteLabel(text: string): string {
  return `Delete question: ${text}`;
}

/** "A", "A and B", "A, B and C" (the export's `names`). */
export function namesList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * "Used in": the assessments by name (`r.usedMain`); while their names cannot be read, how many
 * (the export's `r.used`, "1 assessment"); none, "Not yet".
 */
export function usedWords(usedIn: number, names: readonly string[] | null): string {
  if (usedIn === 0) return QUESTION_BANK.notUsed;
  if (names && names.length > 0) return namesList(names);
  return plural(usedIn, 'assessment');
}

/** `div.fa-deletedbox` `li`: "<question> — deleted 7 Nov 2026 · history kept". */
export function deletedRowWords(text: string, deletedOn: string): string {
  return `${text} — deleted ${deletedOn} · history kept`;
}

/** DL-1 "Delete this question?" (`dlgBank`): the question's text is its line. */
export const DELETE_DIALOG = {
  title: 'Delete this question?',
  effectsTitle: 'What deleting does',
  leaves: 'It leaves your question bank and won’t be offered for new assessments.',
  history: 'Its history is kept.',
  cancel: 'Cancel',
  confirm: 'Delete question',
} as const;

/**
 * `dlgBank` third point: "It is used in Heat Exchanger — post-lab. That assessment keeps its copy,
 * so nothing changes for students."; several, "Those assessments keep their copy"; while the
 * names cannot be read, how many (state-copy `FA-14.delete-used-several`).
 */
export function deleteUsedWords(names: readonly string[] | null, count: number): string {
  const many = (names?.length ?? count) > 1;
  const which = names && names.length > 0 ? namesList(names) : plural(count, 'assessment');
  return `It is used in ${which}. ${
    many ? 'Those assessments keep their copy' : 'That assessment keeps its copy'
  }, so nothing changes for students.`;
}

/** After a delete (`dlgBank.ok`): the message's title and line. */
export const DELETED_MESSAGE = 'Question deleted from your question bank.';

/**
 * "Its history is kept. Heat Exchanger — post-lab keeps its copy, so nothing changes for students."
 * Several keep their copy (state-copy `FA-14.delete-used-several`); none, the first sentence only.
 */
export function deletedLine(names: readonly string[] | null): string {
  if (!names || names.length === 0) return DELETE_DIALOG.history;
  return `${DELETE_DIALOG.history} ${namesList(names)} ${
    names.length > 1 ? 'keep their copy' : 'keeps its copy'
  }, so nothing changes for students.`;
}

/** Back on the bank after adding a question (`qeCommit`, a new question). */
export const ADDED_MESSAGE = {
  title: 'Saved to your question bank.',
  line: 'It isn’t in any assessment yet.',
} as const;

/** FA-15 (the editor, `vmEditor`). */
export const QUESTION_EDITOR = {
  /** `nav.rk-crumbs` first level. */
  back: 'Question bank',
  /** `QE.title`. */
  addTitle: 'Add a question',
  editTitle: 'Edit question',
  /** `fieldset` "Question type" and its legend's line. */
  type: 'Question type',
  typeHint: 'Three types only.',
  /** `h2.fa-fsec-t` of the second and third sections. */
  answerSection: 'Question and answer',
  marksSection: 'Marks and explanation',
  /** `label[for=fa-qe-text]`. */
  text: 'Question',
  /** `p.fa-answerhint` while no type is chosen. */
  chooseTypeFirst: 'Choose the question type to set its answer.',
  /** The options fieldset and its legend's line. */
  options: 'Answer options',
  optionsHint: 'Up to four. Mark the one correct answer.',
  correct: 'Correct',
  /** The true-or-false fieldset. */
  statementIs: 'The statement is',
  true: 'True',
  false: 'False',
  /** `label[for=fa-qe-guide]` and its hint. */
  guidance: 'Marking guidance (optional)',
  guidanceHint:
    'Free text for whoever marks it — what a good answer includes. Students don’t see it.',
  /** `label[for=fa-qe-marks]` and its hint. */
  marks: 'Marks',
  marksHint: 'A whole number, 1 or more.',
  /** `label[for=fa-qe-expl]` and its hint. */
  explanation: 'Explanation (optional)',
  explanationHint: 'Shown to students with the correct answer when their result is released.',
  /** `div.fa-formfoot`. */
  cancel: 'Cancel',
  save: 'Save question',
  saving: 'Saving…',
  /**
   * The used question's notice line (`QE.usedD`); several assessments are the register's
   * (`FA-15.used-several`).
   */
  usedNotice:
    'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
  usedNoticeSeveral:
    'Saving makes a new version in your bank. The assessments keep the version they have until you choose “Use updated version” on their Questions tab. Earlier submissions are never changed.',
  /** The side panel (`aside.fa-side`): "This question" and its facts. */
  sideTitle: 'This question',
  factVersion: 'Version',
  factUsed: 'Used in',
  factAdded: 'Added',
  notInAssessment: 'Not in an assessment yet',
  /** "What students see" and its three moments. */
  seeTitle: 'What students see',
  see: [
    {
      title: 'When they take the assessment',
      text: 'The question and, for choice questions, its options.',
    },
    { title: 'When their result is released', text: 'The correct answer and your explanation.' },
    { title: 'Never', text: 'Your marking guidance — only whoever marks the answer sees it.' },
  ],
} as const;

/**
 * The type cards' second lines (`QE.types`): what each type asks and how it is marked — the
 * product's three types, in `QUESTION_TYPES` order.
 */
export const QUESTION_TYPE_LINES = {
  'multiple-choice': 'One correct answer from up to four options. Marked automatically.',
  'true-false': 'Students say whether a statement is true or false. Marked automatically.',
  written: 'Students write their answer and you mark it.',
} as const;

/** `QE.ctx`: "Shell-and-Tube Heat Exchanger · ME ZG523". */
export function experimentContext(experimentName: string, courseCode: string | null): string {
  return courseCode ? `${experimentName} · ${courseCode}` : experimentName;
}

/** `o.label` and `o.cAria`: "Option A"; "Option A is the correct answer". */
export function optionLabel(choice: string): string {
  return `Option ${choice}`;
}

export function correctLabel(choice: string): string {
  return `Option ${choice} is the correct answer`;
}

/** `QE.usedT`: "Used in 1 assessment: Heat Exchanger — post-lab". */
export function usedNoticeTitle(names: readonly string[]): string {
  return `Used in ${plural(names.length, 'assessment')}: ${namesList(names)}`;
}

/** The side fact "Version": "Version 2 — earlier versions are kept" (version 1 alone). */
export function versionFactWords(version: number): string {
  return version > 1 ? `${versionWords(version)} — earlier versions are kept` : versionWords(1);
}

/** The side fact "Added": "20 Oct 2026", or "… · from a draft you reviewed". */
export function addedFactWords(day: string, fromDraft: boolean): string {
  return fromDraft ? `${day} · from a draft you reviewed` : day;
}

/** `qeCommit` (an edit): "Saved as version 2." — every edit is a new version (domain Q-02). */
export function savedVersionWords(version: number): string {
  return `Saved as version ${version}.`;
}

/**
 * Under it, for a question assessments use: "Heat Exchanger — post-lab keeps the version it has
 * until you choose “Use updated version” on its Questions tab. Earlier submissions are never
 * changed." Several keep theirs (state-copy `FA-15.used-several`).
 */
export function savedUsedLine(names: readonly string[]): string {
  return names.length > 1
    ? `${namesList(names)} keep the version they have until you choose “Use updated version” on their Questions tab. Earlier submissions are never changed.`
    : `${names[0] ?? ''} keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.`;
}
