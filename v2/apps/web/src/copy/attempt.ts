/**
 * The words of ST-12 Before you start (board B4-11 f11 … f16) and ST-13 the assessment attempt
 * (board B4-12 f0 … f6). Drawn words are quoted from the boards; each composed line takes the
 * board's own form for its sample. Words no board draws for these screens are provisional entries
 * of the state-copy register (`state-copy-attempt.ts`), read from there.
 */
import type { PinnedRelease } from '@xr/contracts/draft';
import type { QuestionType } from '@xr/domain';

import { marksWords, QUESTION_TYPE_WORDS, questionsAndMarks } from './assessment-words';
import { stateWords } from './state-copy';
import { stDateTime } from './st-shared';

// ---- ST-12 Before you start (B4-11 f11 … f16) ------------------------------------------------

/** The fixed words of ST-12 (B4-11 f11 … f16). */
export const INTRO_PAGE = {
  /** f11 overline "Shell-and-Tube Heat Exchanger · assessment" (upper case by the sheet). */
  overline: 'assessment',
  questions: 'Questions',
  totalMarks: 'Total marks',
  passMark: 'Pass mark',
  attemptsAllowed: 'Attempts allowed',
  deadline: 'Deadline',
  release: 'Result and answers',
  /** f11 "You have used none". */
  usedNone: 'You have used none',
  /** f11 "Result and answers · After the deadline · Your faculty marks written answers". */
  writtenMarked: 'Your faculty marks written answers',
  noTimeLimit:
    'No time limit. Answers save as you go, and nothing is submitted until you choose Submit.',
  start: 'Start assessment',
  continue: 'Continue attempt',
  tryAgain: 'Try again',
  /** f14 secondary. */
  seeResult: 'See result',
  /** f13 primary. */
  seeResultPage: 'See result page',
  backToExperiment: 'Back to experiment',
  /** f13. */
  waitingTitle: 'Submitted — waiting for marking',
  /** B4-11 f3 (ST-11), B4-13 f2: marked, not released yet (`ST-12.not-released`). */
  notReleasedTitle: 'Result not released yet',
  /** A key fact not set — never for a Ready assessment (`ST-12.rule-missing`). */
  notSet: '—',
  /** f15. */
  cantStartTitle: 'This assessment can’t be started yet',
  /** f15: the reason the board draws — the assessment has no questions. */
  noQuestionsLine:
    'It has no questions yet. It appears ready to start when your faculty has added them.',
} as const;

/** f11 overline: "Shell-and-Tube Heat Exchanger · assessment". */
export function introOverline(experimentName: string): string {
  return `${experimentName} · ${INTRO_PAGE.overline}`;
}

/**
 * f11 "2 multiple choice · 1 true or false · 1 written answer": the types in the boards' order; a
 * type with none is left out and "written answers" is plural (state-copy `ST-12.question-mix`).
 */
export function questionMixWords(mix: {
  readonly multipleChoice: number;
  readonly trueFalse: number;
  readonly written: number;
}): string {
  return [
    mix.multipleChoice > 0 ? `${mix.multipleChoice} multiple choice` : null,
    mix.trueFalse > 0 ? `${mix.trueFalse} true or false` : null,
    mix.written > 0
      ? `${mix.written} ${mix.written === 1 ? 'written answer' : 'written answers'}`
      : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** A figure as the boards write it: whole, or with its decimals (`ST-12.pass-mark-marks`). */
function figure(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

/** f11 "50%". */
export function passPercentWords(percent: number): string {
  return `${percent}%`;
}

/** f11 "8 of 16 marks" (the pass mark in marks, as the service gives it). */
export function passMarkMarksWords(passMarkMarks: number, totalMarks: number): string {
  return `${figure(passMarkMarks)} of ${totalMarks} ${totalMarks === 1 ? 'mark' : 'marks'}`;
}

/** f11 "You have used none", f13 "You have used 1" (submitted attempts; `ST-12.attempts-used`). */
export function attemptsUsedWords(used: number): string {
  return used === 0 ? INTRO_PAGE.usedNone : `You have used ${used}`;
}

/** f12 "Attempt 1 in progress". */
export function inProgressTitle(attemptNumber: number): string {
  return `Attempt ${attemptNumber} in progress`;
}

const NUMBER_WORDS = [
  'none',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
] as const;

/** "two", "four" (f12); a figure from 13 up (`ST-12.number-words`). */
function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value);
}

/**
 * When the result appears, by the attempt's pinned release (f13 "Your result appears after the
 * deadline."); the other two options are the register's (`ST-12.release-*`). Nothing when the
 * pinned version names none.
 */
export function resultAppearsWords(release: PinnedRelease, withDate: boolean): string | null {
  switch (release.option) {
    case 'after-deadline':
      return withDate && release.on
        ? `Your result appears after the deadline: ${stDateTime(release.on)}.`
        : 'Your result appears after the deadline.';
    case 'immediately-after-marking':
      return stateWords('ST-12.release-after-marking');
    case 'on-date':
      return release.on
        ? stateWords('ST-12.release-on-date').replace('{date}', stDateTime(release.on))
        : null;
    case null:
      return null;
  }
}

/** f13 "You submitted on 5 Nov 2026, 18:52. Your result appears after the deadline." */
export function submittedOnLine(submittedAt: string, release: PinnedRelease): string {
  const appears = resultAppearsWords(release, false);
  return [`You submitted on ${stDateTime(submittedAt)}.`, appears]
    .filter((part): part is string => part !== null)
    .join(' ');
}

/**
 * The not-released-yet line (B4-13 f2 "Your answers have been marked. Results for this assessment
 * are released after the deadline: 14 Nov 2026, 23:59."), the other options from the register.
 */
export function markedNotReleasedLine(release: PinnedRelease): string {
  if (release.option === 'after-deadline' && release.on) {
    return `Your answers have been marked. Results for this assessment are released after the deadline: ${stDateTime(release.on)}.`;
  }
  if (release.option === 'on-date' && release.on) {
    return stateWords('ST-12.not-released-on-date').replace('{date}', stDateTime(release.on));
  }
  return 'Your answers have been marked.';
}

/** f14 "Not passed on attempt 1 · 1 attempt left"; none left from the register. */
export function notPassedTitle(attemptNumber: number, attemptsLeft: number): string {
  const left =
    attemptsLeft === 0
      ? stateWords('ST-12.no-attempts-left')
      : `${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left`;
  return `Not passed on attempt ${attemptNumber} · ${left}`;
}

/**
 * f14 "You can try once more. Your first result stays on your result page." — after a later
 * attempt, or with more than one attempt left, or none, the register's words.
 */
export function notPassedLine(attemptNumber: number, attemptsLeft: number): string {
  if (attemptsLeft === 0) return stateWords('ST-12.result-stays');
  const tryWords =
    attemptsLeft === 1
      ? 'You can try once more.'
      : stateWords('ST-12.try-more').replace('{n}', numberWord(attemptsLeft));
  const stays =
    attemptNumber === 1
      ? 'Your first result stays on your result page.'
      : stateWords('ST-12.earlier-results-stay');
  return `${tryWords} ${stays}`;
}

// ---- ST-13 the attempt (B4-12 f0 … f6) ------------------------------------------------------

/** The fixed words of ST-13 (B4-12 f0 … f6). */
export const ATTEMPT_PAGE = {
  saveIdle: 'Answers save automatically',
  saving: 'Saving…',
  saved: 'All answers saved',
  saveFailed: 'Your last answer didn’t save',
  tryAgain: 'Try again',
  /** `nav.xa-strip aria-label`. */
  stripLabel: 'Your answers',
  nextUnanswered: 'Next unanswered',
  noTimeLimit: 'no time limit',
  writtenHint: 'Your faculty marks written answers.',
  true: 'True',
  false: 'False',
  footNote:
    'Nothing is submitted until you choose Submit. You can’t change answers after submitting.',
  submit: 'Submit',
  dialogTitle: 'Submit your answers?',
  stillSubmit: 'You can still submit.',
  dialogEffect: 'You can’t change your answers after submitting.',
  keepAnswering: 'Keep answering',
  submitAnswers: 'Submit answers',
  submitting: 'Submitting…',
  submitFailedTitle: 'Your answers weren’t submitted',
  submitFailedLine: 'They’re still saved here. Try again.',
  submittedTitle: 'Answers submitted',
  backToExperiment: 'Back to experiment',
  seeResultPage: 'See your result page',
  /** f4 "… Your faculty marks written answers. …" */
  writtenMarked: 'Your faculty marks written answers.',
} as const;

/** f0 overline "Shell-and-Tube Heat Exchanger · Attempt 1 of 2" (upper case by the sheet). */
export function attemptOverline(
  experimentName: string,
  attemptNumber: number,
  attemptsAllowed: number | null,
): string {
  const attempt =
    attemptsAllowed === null
      ? `Attempt ${attemptNumber}`
      : `Attempt ${attemptNumber} of ${attemptsAllowed}`;
  return `${experimentName} · ${attempt}`;
}

/** f0 "4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit". */
export function attemptMetaLine(
  questionCount: number,
  totalMarks: number,
  deadline: string | null,
): string {
  return [
    questionsAndMarks(questionCount, totalMarks),
    deadline ? `due ${stDateTime(deadline)}` : null,
    ATTEMPT_PAGE.noTimeLimit,
  ]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

/** f0 "0 of 4 answered". */
export function answeredCountWords(answered: number, questionCount: number): string {
  return `${answered} of ${questionCount} answered`;
}

/** The strip's link names: "Question 1, answered" / "Question 3, not answered" (B4-12 script). */
export function stripLinkLabel(number: number, answered: boolean): string {
  return `Question ${number}${answered ? ', answered' : ', not answered'}`;
}

/** f0 "Question 1 of 4 · Multiple choice" (upper case by the sheet). */
export function questionLabel(number: number, questionCount: number, type: QuestionType): string {
  return `Question ${number} of ${questionCount} · ${QUESTION_TYPE_WORDS[type]}`;
}

/** f0 "2 marks", "10 marks". */
export function questionMarks(marks: number): string {
  return marksWords(marks);
}

/**
 * f1 "2 questions aren’t answered (3, 4)." — one: "1 question isn’t answered (question 3)."
 * (B4-12 script `missText`).
 */
export function unansweredWords(numbers: readonly number[]): string {
  return numbers.length === 1
    ? `1 question isn’t answered (question ${numbers[0]}).`
    : `${numbers.length} questions aren’t answered (${numbers.join(', ')}).`;
}

/**
 * f4 "Submitted 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears after
 * the deadline: 14 Nov 2026, 23:59." — without a written question, "Your faculty confirms the
 * automatic marks." (`ST-13.submitted-no-written`; owner decision of 24 Oct 2026).
 */
export function submittedLine(
  submittedAt: string,
  hasWritten: boolean,
  release: PinnedRelease | null,
): string {
  return [
    `Submitted ${stDateTime(submittedAt)}.`,
    hasWritten ? ATTEMPT_PAGE.writtenMarked : stateWords('ST-13.submitted-no-written'),
    release ? resultAppearsWords(release, true) : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' ');
}

/** The browser tab while the attempt is on show: the assessment's name (`ST-13.document-title`). */
export function attemptDocumentTitle(name: string, submitted: boolean): string {
  return submitted ? `${ATTEMPT_PAGE.submittedTitle} · ${name}` : name;
}

// ---- V3 (the owner-approved Student export ST-v1, `StudentFinal.dc.html`) -----------------------
// ST-12 Before you start (`introVM`) and ST-13 the focused attempt (`attVM`, the DL-1 dialog). Each
// string is the export's own (`attempt.test.ts` finds it there); what it does not word is the
// register's (`state-copy-attempt.ts`).

/** ST-12's fixed words (`is.aintro`). */
export const INTRO_V3 = {
  /** f11 state heading while nothing is attempted. */
  beforeYouStart: 'Before you start',
  /** `ul.sv-rules aria-label` and its three rules. */
  rulesLabel: 'How answering works',
  ruleNoTimeLimit: 'No time limit',
  ruleSaves: 'Answers save as you go',
  ruleSubmit: 'Nothing is submitted until you choose Submit',
  ruleSubmitDetail: 'You can’t change answers after submitting.',
  /** `h2.xr-sr` of the key facts. */
  factsTitle: 'Key facts, as set for this assessment',
  setBy: 'Set by',
  /** Marked, not released yet: the state heading. */
  notReleasedTitle: 'Marked — result not released yet',
  /** Released and passed: the state heading. */
  passedTitle: 'Result released — you passed',
  /** Released, not passed, no attempt left: the state heading. */
  releasedTitle: 'Result released',
  /** The status of an assessment that can't be started (`asmtRow` `noq`). */
  cantStartStatus: 'Can’t be started yet',
} as const;

/** The head's eyebrow after the experiment's link: " · assessment". */
export const INTRO_EYEBROW_AFTER = ` · ${INTRO_PAGE.overline}`;

/**
 * An attempt in progress (`introVM`): "Your answers are saved. 2 questions of 4 answered." — one
 * reads "One question of 4 answered.".
 */
export function inProgressSavedLine(answered: number, questionCount: number): string {
  const count =
    answered === 1 ? 'One question' : `${answered} ${answered === 1 ? 'question' : 'questions'}`;
  return `Your answers are saved. ${count} of ${questionCount} answered.`;
}

/**
 * Submitted, waiting for marking (`introVM`): "You submitted on 5 Nov 2026, 18:52. Your result
 * appears after the deadline: 14 Nov 2026, 23:59." — by the attempt's pinned release.
 */
export function submittedWaitingLine(submittedAt: string, release: PinnedRelease): string {
  return [`You submitted on ${stDateTime(submittedAt)}.`, resultAppearsWords(release, true)]
    .filter((part): part is string => part !== null)
    .join(' ');
}

/**
 * Marked, not released yet (`introVM`): "Results for this assessment are released after the
 * deadline: 14 Nov 2026, 23:59." — the other settings are the register's.
 */
export function notReleasedYetLine(release: PinnedRelease): string | null {
  if (release.option === 'after-deadline' && release.on)
    return `Results for this assessment are released after the deadline: ${stDateTime(release.on)}.`;
  if (release.option === 'on-date' && release.on)
    return stateWords('ST-12.not-released-on-date')
      .replace('{date}', stDateTime(release.on))
      .replace(/^Your answers have been marked\. /, '');
  return null;
}

/** ST-13's fixed words (`is.att`, the DL-1 dialog). */
export const ATTEMPT_V3 = {
  /** The focused page's skip link (the delivered XS words). */
  skip: 'Skip to main content',
  /** `ol.sv-qs aria-label`. */
  questionsLabel: 'Questions',
  /** `h2.xr-sr` of the submit panel. */
  submitTitle: 'Submit your answers',
  /** "Answers submitted": the status. */
  waiting: 'Waiting for marking',
} as const;

/** "Attempt 1 of 2" (`attVM` `attemptText`); "Attempt 1" when the version sets no limit. */
export function attemptOfWords(attemptNumber: number, attemptsAllowed: number | null): string {
  return attemptsAllowed === null
    ? `Attempt ${attemptNumber}`
    : `Attempt ${attemptNumber} of ${attemptsAllowed}`;
}

/** DL-1 with every question answered: "All 4 questions are answered." */
export function allAnsweredWords(questionCount: number): string {
  return `All ${questionCount} questions are answered.`;
}

/** DL-1's warning: "2 questions aren’t answered (3, 4). You can still submit." */
export function pendingWords(numbers: readonly number[]): string {
  return `${unansweredWords(numbers)} ${ATTEMPT_PAGE.stillSubmit}`;
}
