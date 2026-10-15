/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview — the words board B4-06 draws (f0 …
 * f6), quoted from its frames and its script (`seView`, `pvView`). The rules form's own labels and
 * hints are the shared `RULES_FORM` (`assessment-words.ts`). Where the board names a sample person
 * ("Rahul Verma has submitted", "As Rahul sees it"), the service gives no name: the product's words
 * are state-copy entries (`state-copy-assessment-settings.ts`), built by the formulas below.
 */
import { stateWords } from './state-copy';

/** B4-06 f0 … f4 (FA-10). */
export const SETTINGS_PAGE = {
  /** `div.xw-errsum#Es-err` <strong> (the script's error summary on this page). */
  summaryTitle: 'Check these settings',
  cancel: 'Cancel',
  save: 'Save settings',
  /** The busy button (`is-busy`, "Saving…"). */
  saving: 'Saving…',
  /** The script's `msg` when nothing makes a new version. */
  saved: 'Settings saved.',
  /** f1 `xr-notice--warn` title. */
  newVersionTitle: 'This makes a new version',
  /** f2 `xr-notice--warn` title. */
  /** B4-06 f2's title says a submitted Student is reached; the domain keeps their terms (P4-06). */
  releaseTitle: stateWords('FA-10.release-title'),
} as const;

/** B4-06 f5, f6 (FA-11). */
export const PREVIEW_PAGE = {
  /** `div.xr-seg[aria-label]`. */
  viewLabel: 'Preview as',
  studentView: 'Student view',
  answerKey: 'Answer key',
  /** `p.xl-open` beside the switch. */
  createsNothing: 'Previewing creates no attempt and saves nothing.',
  /** f6 `p.xl-meta`. */
  keyLine: 'Only you see the answer key and the marking guidance.',
  /** f5 written question: `span.xr-hint`. */
  writtenHint: 'Your faculty marks written answers.',
  /** f6 `span.xa-mk.is-ok`. */
  correct: 'Correct',
  explanation: 'Explanation',
  markingGuidance: 'Marking guidance',
  /** f5 true-or-false options. */
  trueWord: 'True',
  falseWord: 'False',
  /** f5 the student-view line's tail: "… · no time limit." */
  noTimeLimit: 'no time limit',
} as const;

/** f5 "Question 1 of 4 · Multiple choice" (`span.xa-q-n`, capitals by CSS). */
export function questionHeading(position: number, count: number, type: string): string {
  return `Question ${position} of ${count} · ${type}`;
}

/** f5 the written answer box's name: "Answer to question 4 (preview)". */
export function previewAnswerLabel(position: number): string {
  return `Answer to question ${position} (preview)`;
}

/**
 * f5 "As Rahul sees it: 4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit." — there is
 * no student to name (state-copy `FA-11.as-a-student`); without a deadline the "due …" part is left
 * out (`FA-11.no-deadline`).
 */
export function studentViewLine(questionsAndMarks: string, due: string | null): string {
  return `${stateWords('FA-11.as-a-student')} ${[
    questionsAndMarks,
    ...(due ? [`due ${due}`] : []),
    PREVIEW_PAGE.noTimeLimit,
  ].join(' · ')}.`;
}

/** "1 student has submitted." / "2 students have submitted." (state-copy `FA-10.submitted-*`). */
function submittedWords(count: number): string {
  return count === 1
    ? stateWords('FA-10.submitted-one')
    : stateWords('FA-10.submitted-many').replace('{n}', String(count));
}

/** f1's body without a name (state-copy `FA-10.new-version-warning`). */
export function newVersionWarning(submitted: number): string {
  return `${submittedWords(submitted)} ${
    submitted === 1
      ? stateWords('FA-10.new-version-warning.one')
      : stateWords('FA-10.new-version-warning.many')
  }`;
}

/** f2's body without a name (state-copy `FA-10.release-warning`). */
export function releaseWarning(submitted: number): string {
  return `${submittedWords(submitted)} ${stateWords('FA-10.release-warning')}`;
}

/**
 * The saved confirmation (`#Es-saved`): "Settings saved." (drawn), or after a change that made a
 * new version "Settings saved as version 2. Earlier submissions keep the version they answered."
 * (state-copy `FA-10.saved-new-version`), then — when the release setting changed — "Students now
 * see their result after the deadline." (`FA-10.saved-release-changed`).
 */
export function savedWords(answer: {
  readonly newVersion: boolean;
  readonly version: number;
  readonly release: string | null;
}): string {
  const first = answer.newVersion
    ? stateWords('FA-10.saved-new-version').replace('{n}', String(answer.version))
    : SETTINGS_PAGE.saved;
  return answer.release
    ? `${first} ${stateWords('FA-10.saved-release-changed').replace('{release}', answer.release)}`
    : first;
}
