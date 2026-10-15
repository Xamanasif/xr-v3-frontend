/**
 * The words of FA-14 Question bank and FA-15 Add / edit question (board B4-07 f0 … f9), written
 * from the facts `QuestionBankService` answers (each question with how many assessments use it;
 * one question with the assessments that use it) and the taught experiments of
 * `getCreateOptions`. Every phrase here is the frozen board's own — a frame's markup or the board
 * script's state logic (`qbView`, `qeView`), cited per entry; what B4-07 does not word is a
 * provisional entry of the state-copy register (`state-copy-question-bank.ts`, VD-12). The board's
 * sample questions, counts and dates are never copied: they come from the records.
 */

/** B4-07 f0, f7, f9: the bank's header, section and toolbar. */
export const QUESTION_BANK = {
  /** f0 `a.xr-btn--primary` (header) and f7's empty state. */
  addQuestion: 'Add a question',
  /** f0 `section#Kb-tq` `h2.xr-h2`. */
  sectionTitle: 'Questions',
  /** f0 toolbar: `label[for=Kb-q]` and its placeholder. */
  search: 'Search questions',
  searchPlaceholder: 'Words or question ID',
  /** f0 toolbar: `label[for=Kb-e]`. */
  experiment: 'Experiment',
  /** f0 toolbar: `label[for=Kb-t]` and its first option. */
  type: 'Type',
  allTypes: 'All types',
  /** f0 `thead` (the last header is `span.xr-sr`). */
  columns: {
    question: 'Question',
    type: 'Type',
    marks: 'Marks',
    used: 'Used',
    added: 'Added',
    actions: 'Actions',
  },
  /** f0 row actions (`a.xr-btn--secondary.xr-btn--sm`, `button.xr-btn--text`). */
  edit: 'Edit',
  delete: 'Delete',
  /** Script `noMatch`: "No question matches." */
  noMatch: 'No question matches.',
  /** f7 `div.xr-empty` `h3`. */
  emptyTitle: 'Your question bank is empty',
  /** Script `delRows`: the "Deleted" list under the table. */
  deletedTitle: 'Deleted',
} as const;

/** f0 `span.xl-meta`: "Questions for Shell-and-Tube Heat Exchanger · ME ZG523". */
export function bankMetaLine(experimentName: string, courseCode: string | null): string {
  return courseCode
    ? `Questions for ${experimentName} · ${courseCode}`
    : `Questions for ${experimentName}`;
}

/** Script `count`: "6 questions", "1 question". */
export function questionCount(count: number): string {
  return `${count} question${count === 1 ? '' : 's'}`;
}

/** f0 aria-labels: "Edit Q-0101", "Delete Q-0101". */
export function editLabel(questionId: string): string {
  return `Edit ${questionId}`;
}

export function deleteLabel(questionId: string): string {
  return `Delete ${questionId}`;
}

/**
 * f0 "Used" column: "Used in 1 assessment" / "Not used yet"; more than one assessment is the
 * register's plural (`FA-14.used-several`).
 */
export function usedWords(usedIn: number): string {
  if (usedIn === 0) return 'Not used yet';
  return `Used in ${usedIn} ${usedIn === 1 ? 'assessment' : 'assessments'}`;
}

/** Script `doDel`: "Q-0101 deleted from your question bank. Its history is kept." */
export function deletedMessage(questionId: string): string {
  return `${questionId} deleted from your question bank. Its history is kept.`;
}

/** Script `delRows`: "Q-0101 What does … — deleted 7 Nov 2026 · history kept" (after the id). */
export function deletedRowWords(text: string, deletedOn: string): string {
  return `${text} — deleted ${deletedOn} · history kept`;
}

/** Script `qeView.save` (a new question): "Saved to your question bank as Q-0107." */
export function addedMessage(questionId: string): string {
  return `Saved to your question bank as ${questionId}.`;
}

/** f2 DL-1 "Delete a used question". */
export const DELETE_DIALOG = {
  effect:
    'It leaves your question bank and won’t be offered for new assessments. Its history is kept.',
  cancel: 'Cancel',
  confirm: 'Delete question',
} as const;

/** f2 `h2.xr-dialog-title`: "Delete Q-0101?". */
export function deleteTitle(questionId: string): string {
  return `Delete ${questionId}?`;
}

/**
 * f2 "**It is used in Heat Exchanger — post-lab.** That assessment keeps its copy, so nothing
 * changes for students." — several assessments are the register's (`FA-14.delete-used-several`).
 */
export function deleteUsedWords(names: readonly string[]): {
  readonly strong: string;
  readonly rest: string;
} {
  return {
    strong: `It is used in ${namesList(names)}.`,
    rest:
      names.length > 1
        ? ' Those assessments keep their copy, so nothing changes for students.'
        : ' That assessment keeps its copy, so nothing changes for students.',
  };
}

/** While the assessments' names cannot be read: "It is used in 1 assessment." (the register's). */
export function deleteUsedCountWords(count: number): {
  readonly strong: string;
  readonly rest: string;
} {
  return {
    strong: `It is used in ${count} ${count === 1 ? 'assessment' : 'assessments'}.`,
    rest:
      count > 1
        ? ' Those assessments keep their copy, so nothing changes for students.'
        : ' That assessment keeps its copy, so nothing changes for students.',
  };
}

/** "A", "A and B", "A, B and C" (the register's join for several assessments). */
export function namesList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** B4-07 f3 … f8: the editor. */
export const QUESTION_EDITOR = {
  /** f3 `a.xr-back`. */
  back: 'Question bank',
  /** f3 / f5 / f6 / f8 `h1`; f4 `h1`. */
  addTitle: 'Add a question',
  editTitle: 'Edit question',
  /** f3 `fieldset#Qe-type`. */
  type: 'Question type',
  typeHint: 'Three types only.',
  /** f3 `label[for=Qe-text]`. */
  text: 'Question',
  /** f4 `fieldset#Qeu-opts`. */
  options: 'Answer options',
  optionsHint: 'Up to four; mark the one correct answer.',
  correct: 'Correct',
  /** Script `isTf` fieldset: "The statement is" · True · False. */
  statementIs: 'The statement is',
  true: 'True',
  false: 'False',
  /** f5 `label[for=Qew-guide]`. */
  guidance: 'Marking guidance',
  guidanceHint:
    'Free text for whoever marks it — what a good answer includes. Students don’t see it while they answer.',
  /** f3 `label[for=Qe-marks]`. */
  marks: 'Marks',
  marksHint: 'A whole number.',
  /** f3 `label[for=Qe-expl]`. */
  explanation: 'Explanation',
  explanationHint: 'Shown to students with the correct answer when their result is released.',
  optional: '(optional)',
  /** f3 `div.xw-flow-foot`. */
  cancel: 'Cancel',
  save: 'Save question',
  /** Script `busy`: "Saving…". */
  saving: 'Saving…',
  /**
   * f4 `div.xr-notice--warn` body ("…on its Questions tab…"); several assessments are the
   * register's (`FA-15.used-several`).
   */
  usedNotice:
    'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
  usedNoticeSeveral:
    'Saving makes a new version in your bank. The assessments keep the version they have until you choose “Use updated version” on their Questions tab. Earlier submissions are never changed.',
} as const;

/** f4 option labels: "Option A" … "Option D"; the radio's name "Option A is the correct answer". */
export function optionLabel(choice: string): string {
  return `Option ${choice}`;
}

export function correctLabel(choice: string): string {
  return `Option ${choice} is the correct answer`;
}

/** f4 notice title: "Used in 1 assessment: Heat Exchanger — post-lab". */
export function usedNoticeTitle(names: readonly string[]): string {
  return `${usedWords(names.length)}: ${names.join(', ')}`;
}

/**
 * Script `qeView.save` (a used question): "Saved as a new version. Heat Exchanger — post-lab keeps
 * the version it has until you choose “Use updated version” there." Several assessments are the
 * register's (`FA-15.used-several`).
 */
export function savedUsedMessage(names: readonly string[]): string {
  return names.length > 1
    ? `Saved as a new version. ${namesList(names)} keep the version they have until you choose “Use updated version” there.`
    : `Saved as a new version. ${names[0] ?? ''} keeps the version it has until you choose “Use updated version” there.`;
}
