/**
 * The words of the Student's ST-14 Result (board B4-13 f0 … f5; Phase 4B). Every string here is
 * the board's own (`result.test.ts` finds each on B4-13, the composed ones with the board's own
 * values); the question types are the Phase-4A words (`assessment-words.ts`). What B4-13 does not
 * word — the other release settings, a plural, a fractional pass mark, a feedback author the
 * record does not name — is a provisional entry of the state-copy register
 * (`state-copy-result.ts`, VD-12). Names, figures, answers and dates are the sample world's,
 * never typed here.
 */
import type { PinnedRelease } from '@xr/contracts/draft';
import type { AnswerValue, ChoiceKey, QuestionType } from '@xr/domain';

import { QUESTION_TYPE_WORDS } from './assessment-words';
import { stateWords } from './state-copy';
import { stDateTime } from './st-shared';

export const RESULT_PAGE = {
  /** The top bar's title below 1024 px and the current crumb (B4-13 f0 … f5 `xr-top-title`). */
  title: 'Result',
  /** f0, f5 `h1.xr-h1`. */
  passed: 'You passed',
  /** f3 `h1.xr-h1`. */
  notPassed: 'Not passed this time',
  /** f0 `span.xr-status--ok`. */
  passedPill: 'Passed',
  /** f3 `span.xr-status--err`. */
  notPassedPill: 'Not passed',
  /** f0 `h2.xr-h2`. */
  yourAnswers: 'Your answers',
  yourAnswer: 'Your answer',
  correctAnswer: 'Correct answer',
  explanation: 'Explanation',
  /** B4-13 script `answers`: a choice question left unanswered. */
  notAnswered: 'Not answered',
  /** B4-13 script `answers`: a written answer left empty. */
  noWrittenAnswer: '—',
  /** B4-13 script `opts` of a true-or-false question. */
  trueWord: 'True',
  falseWord: 'False',
  /** f0 … f5 `a.xr-btn--primary` (→ B2-12, the experiment hub). */
  backToExperiment: 'Back to experiment',
  /** f3 `a.xr-btn--secondary` (→ B4-12, a new attempt). */
  tryAgain: 'Try again',
  /** f0, f3, f5 `a.xr-btn--text` (→ B3-05 Progress). */
  seeProgress: 'See your progress',
  /** f1, f4 `h1.xr-msg-title`. */
  waitingTitle: 'Submitted — waiting for marking',
  /** f1, f4 lead, second sentence. */
  facultyMarks: 'Your faculty marks written answers.',
  /** f2 `h1.xr-msg-title`. */
  notReleasedTitle: 'Result not released yet',
  /** f2 lead, first sentence. */
  marked: 'Your answers have been marked.',
  /** B4-13 `r.notSub` (markup, no frame): no submitted attempt. */
  notSubmittedTitle: 'Not submitted yet',
  notSubmittedLine: 'Your result appears here after you submit and your answers are marked.',
  /** B4-13 `r.notSub` `a.xr-btn--primary` (→ B4-11, "Before you start"). */
  backToAssessment: 'Back to the assessment',
} as const;

/** A figure as the boards write it: "11", "8"; a fractional pass mark to two places (`ST-14.figures`). */
export function figure(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}

/** "11 of 16 marks", "2 of 2 marks" (B4-13 `scoreText`, `markText`); "1 of 1 mark" (`ST-14.one-mark`). */
export function ofMarksWords(awarded: number, outOf: number): string {
  return outOf === 1
    ? stateWords('ST-14.one-mark').replace('{n}', figure(awarded))
    : `${figure(awarded)} of ${figure(outOf)} marks`;
}

/** "Heat Exchanger — post-lab · result" (f0 `span.xr-overline`, set in capitals by the class). */
export function resultOverline(assessmentName: string): string {
  return `${assessmentName} · result`;
}

/**
 * "Pass mark 50% · 8 of 16 marks" (f0 `xa-score-facts`). The percentage is the attempt's own
 * version's, read back from its pass mark in marks (`ST-14.pass-mark`).
 */
export function passMarkWords(passMarkMarks: number, outOf: number): string {
  const percent = outOf > 0 ? Math.round((passMarkMarks * 100) / outOf) : 0;
  return `Pass mark ${percent}% · ${ofMarksWords(passMarkMarks, outOf)}`;
}

/** "Attempt 1 of 2" (f0); "Attempt 1" when the version sets no limit (`ST-14.attempt-no-limit`). */
export function attemptWords(attemptNumber: number, attemptsAllowed: number | null): string {
  return attemptsAllowed === null
    ? stateWords('ST-14.attempt-no-limit').replace('{n}', String(attemptNumber))
    : `Attempt ${attemptNumber} of ${attemptsAllowed}`;
}

function sameInstant(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}

/**
 * "Released 14 Nov 2026, 23:59, after the deadline" (f0) — the attempt's own release setting;
 * the others are `ST-14.released.*`.
 */
export function releasedWords(release: PinnedRelease, releasedAt: string): string {
  const at = stDateTime(releasedAt);
  switch (release.option) {
    case 'after-deadline':
      return `Released ${at}, after the deadline`;
    case 'immediately-after-marking':
      return stateWords('ST-14.released.when-marked').replace('{at}', at);
    case 'on-date':
      // Released on the date set, or — marks confirmed after it — when they were confirmed.
      return release.on !== null && sameInstant(release.on, releasedAt)
        ? stateWords('ST-14.released.on-date').replace('{at}', at)
        : stateWords('ST-14.released.when-marked').replace('{at}', at);
    default:
      return stateWords('ST-14.released.other').replace('{at}', at);
  }
}

/** When the result appears, as the attempt's version sets it (f1, f4; `ST-14.appears.*`). */
function appearsWords(release: PinnedRelease): string {
  if (release.option === 'after-deadline' && release.on !== null)
    return `Your result appears after the deadline: ${stDateTime(release.on)}.`;
  if (release.option === 'on-date' && release.on !== null)
    return stateWords('ST-14.appears.on-date').replace('{date}', stDateTime(release.on));
  if (release.option === 'immediately-after-marking')
    return stateWords('ST-14.appears.when-marked');
  return stateWords('ST-14.appears.other');
}

/**
 * f1, f4: "You submitted on 5 Nov 2026, 18:52. Your faculty marks written answers. Your result
 * appears after the deadline: 14 Nov 2026, 23:59." — the same words once the deadline has passed
 * while marking is not finished (f4: never a partial score).
 */
export function waitingLine(
  submittedAt: string | null,
  release: PinnedRelease,
  /** The attempt's version has a written question (Phase 4B review: none, no "faculty marks"). */
  hasWritten = true,
): string {
  return [
    submittedAt === null ? null : `You submitted on ${stDateTime(submittedAt)}.`,
    hasWritten ? RESULT_PAGE.facultyMarks : null,
    appearsWords(release),
  ]
    .filter((part): part is string => part !== null)
    .join(' ');
}

/**
 * f2: "Your answers have been marked. Results for this assessment are released after the
 * deadline: 14 Nov 2026, 23:59." (`ST-14.not-released.*` for the other settings).
 */
export function notReleasedLine(release: PinnedRelease): string {
  const when =
    release.option === 'after-deadline' && release.on !== null
      ? `Results for this assessment are released after the deadline: ${stDateTime(release.on)}.`
      : release.option === 'on-date' && release.on !== null
        ? stateWords('ST-14.not-released.on-date').replace('{date}', stDateTime(release.on))
        : stateWords('ST-14.not-released.other');
  return `${RESULT_PAGE.marked} ${when}`;
}

/** "Question 1 · Multiple choice" (f0 `span.xa-q-n`, set in capitals by the class). */
export function questionHeadWords(number: number, type: QuestionType): string {
  return `Question ${number} · ${QUESTION_TYPE_WORDS[type]}`;
}

/** "Feedback from Dr S. Ranganathan" (f0); `ST-14.feedback-from-faculty` when no name is recorded. */
export function feedbackFromWords(name: string | null): string {
  return name === null ? stateWords('ST-14.feedback-from-faculty') : `Feedback from ${name}`;
}

/** "You have 1 attempt left." (f3 `span.xl-meta`); the plural is `ST-14.attempts-left`. */
export function attemptsLeftWords(left: number): string {
  return left === 1
    ? 'You have 1 attempt left.'
    : stateWords('ST-14.attempts-left').replace('{n}', String(left));
}

/**
 * The Student's answer in words (f0 "Your answer"): the chosen option's words, "True" / "False",
 * the written text — "Not answered" for an unanswered choice, "—" for an empty written answer
 * (B4-13 script `answers`).
 */
export function yourAnswerWords(
  type: QuestionType,
  answer: AnswerValue | null,
  options: Partial<Record<ChoiceKey, string>> | null,
): string {
  if (type === 'written') {
    const text = answer?.type === 'written' ? answer.text : '';
    return text.trim() === '' ? RESULT_PAGE.noWrittenAnswer : text;
  }
  if (answer === null) return RESULT_PAGE.notAnswered;
  if (answer.type === 'multiple-choice') return options?.[answer.choice] ?? answer.choice;
  if (answer.type === 'true-false')
    return answer.value ? RESULT_PAGE.trueWord : RESULT_PAGE.falseWord;
  return RESULT_PAGE.notAnswered;
}

/** The correct answer in words (f0 "Correct answer"): the key's option, or "True" / "False". */
export function correctAnswerWords(
  type: QuestionType,
  correct: string | null,
  options: Partial<Record<ChoiceKey, string>> | null,
): string | null {
  if (correct === null || type === 'written') return null;
  if (type === 'true-false')
    return correct === 'true' ? RESULT_PAGE.trueWord : RESULT_PAGE.falseWord;
  return options?.[correct as ChoiceKey] ?? correct;
}

// ---- V3 (the owner-approved Student export ST-v1, `StudentFinal.dc.html`) -----------------------
// ST-14 (`resultVM`): the score panel, the marks by question, the answer review. Each string is the
// export's own (`result.test.ts` finds it there); what it does not word is the register's.

/** ST-14's fixed words (`is.ares`). */
export const RESULT_V3 = {
  /** `section.sv-score aria-label`. */
  scoreLabel: 'Your score',
  passMark: 'Pass mark',
  attempt: 'Attempt',
  result: 'Result',
  /** `p.sv-eyebrow` over the jump list. */
  byQuestion: 'Marks by question',
  /** A choice answer's verdict (`sv-verdict`). */
  correct: 'Correct',
  notCorrect: 'Not correct',
  /** No answer given (a choice or a written answer). */
  notAnswered: 'Not answered',
} as const;

/** "of 16 marks" beside the score (`AR.total`); "of 1 mark". */
export function outOfWords(outOf: number): string {
  return `of ${figure(outOf)} ${outOf === 1 ? 'mark' : 'marks'}`;
}

/** "50% · 8 of 16 marks" (`AR.passText`): the attempt's own pass mark. */
export function passMarkValueWords(passMarkMarks: number, outOf: number): string {
  const percent = outOf > 0 ? Math.round((passMarkMarks * 100) / outOf) : 0;
  return `${percent}% · ${ofMarksWords(passMarkMarks, outOf)}`;
}

/** The jump list: "Q1", "2 of 2" and its name "Question 1: 2 of 2 marks" (`AR.byQ`). */
export function byQuestionWords(
  number: number,
  awarded: number,
  outOf: number,
): { readonly label: string; readonly mark: string; readonly name: string } {
  const marks = ofMarksWords(awarded, outOf);
  return {
    label: `Q${number}`,
    mark: `${figure(awarded)} of ${figure(outOf)}`,
    name: `Question ${number}: ${marks}`,
  };
}

/**
 * Not passed with an attempt left (`AR.leftText`): "You have 1 attempt left. Your first result
 * stays here." — more than one left, or a later attempt, from the register.
 */
export function retryLine(attemptsLeft: number, attemptNumber: number): string {
  const left = attemptsLeftWords(attemptsLeft);
  const stays =
    attemptNumber === 1 ? 'Your first result stays here.' : stateWords('ST-14.earlier-stay');
  return `${left} ${stays}`;
}
