/**
 * Which state ST-12 Before you start shows (board B4-11 f11 … f15; state-copy `ST-12.states`),
 * from the service's answer alone: the attempt in progress, the latest attempt's result as the
 * service words it (figure-free until released) and whether the service lets the Student start
 * (`canStart`). Nothing here decides a start, a result or a release.
 */
import type { AssessmentIntro, StudentAttemptFacts } from '@xr/contracts/draft';

export type IntroState =
  /** f11: nothing attempted yet, and the service lets the Student start. */
  | { readonly kind: 'start' }
  /** f12: an attempt in progress. */
  | {
      readonly kind: 'continue';
      readonly attemptNumber: number;
      readonly answered: number;
      readonly questionCount: number;
    }
  /** f13: submitted, waiting for marking. */
  | { readonly kind: 'waiting'; readonly latest: StudentAttemptFacts }
  /** Marked, not released yet (`ST-12.not-released`). */
  | { readonly kind: 'not-released'; readonly latest: StudentAttemptFacts }
  /** f14: released, not passed, an attempt left that the service lets the Student start. */
  | {
      readonly kind: 'try-again';
      readonly latest: StudentAttemptFacts;
      readonly attemptsLeft: number;
    }
  /** Released and passed (`INTRO_V3.passedTitle`). */
  | { readonly kind: 'passed'; readonly latest: StudentAttemptFacts }
  /** Released, not passed, no attempt left. */
  | { readonly kind: 'no-attempts-left'; readonly latest: StudentAttemptFacts }
  /** f15: the service does not let the Student start; the board's reason only when it holds. */
  | {
      readonly kind: 'cant-start';
      readonly noQuestions: boolean;
      readonly latest: StudentAttemptFacts | null;
    };

/** The questions of the version a new attempt would pin (the "Questions" fact). */
export function questionCountOf(intro: AssessmentIntro): number {
  const mix = intro.questionTypes;
  return mix.multipleChoice + mix.trueFalse + mix.written;
}

/** The Student's attempts that are submitted: "You have used 1" (state-copy `ST-12.attempts-used`). */
export function attemptsUsed(intro: AssessmentIntro): number {
  return intro.attempts.filter((attempt) => attempt.state === 'submitted').length;
}

function latestOf(intro: AssessmentIntro): StudentAttemptFacts | null {
  return [...intro.attempts].sort((a, b) => a.attemptNumber - b.attemptNumber).at(-1) ?? null;
}

export function introState(intro: AssessmentIntro): IntroState {
  if (intro.sheet) {
    const facts = intro.attempts.find((attempt) => attempt.attemptId === intro.sheet!.attemptId);
    return {
      kind: 'continue',
      attemptNumber: intro.sheet.attemptNumber,
      answered: facts?.answered ?? 0,
      questionCount: facts?.questionCount ?? intro.sheet.questions.length,
    };
  }
  const latest = latestOf(intro);
  if (latest && latest.state === 'submitted') {
    const result = latest.result;
    switch (result.kind) {
      case 'waiting-for-marking':
        return { kind: 'waiting', latest };
      case 'not-released-yet':
        return { kind: 'not-released', latest };
      case 'released':
        if (result.passed) return { kind: 'passed', latest };
        if (result.attemptsLeft === 0) return { kind: 'no-attempts-left', latest };
        if (intro.canStart) return { kind: 'try-again', latest, attemptsLeft: result.attemptsLeft };
        return { kind: 'cant-start', noQuestions: questionCountOf(intro) === 0, latest };
      case 'in-progress':
        break;
    }
  }
  if (intro.canStart) return { kind: 'start' };
  return { kind: 'cant-start', noQuestions: questionCountOf(intro) === 0, latest };
}
