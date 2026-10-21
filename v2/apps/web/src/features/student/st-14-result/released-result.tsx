'use client';

import type { AnswerReview, AttemptResultView } from '@xr/contracts/draft';
import type { AssessmentId, AttemptResult } from '@xr/domain';
import {
  Button,
  ButtonLink,
  Notice,
  PageHead,
  StResultAnswer,
  StResultReview,
  StScoreCard,
  StTextLink,
} from '@xr/ui/v3';
import { type ReactNode, useId, useState } from 'react';

import {
  attemptWords,
  byQuestionWords,
  correctAnswerWords,
  feedbackFromWords,
  figure,
  ofMarksWords,
  outOfWords,
  passMarkValueWords,
  questionHeadWords,
  releasedWords,
  RESULT_PAGE,
  RESULT_V3,
  resultOverline,
  retryLine,
  yourAnswerWords,
} from '@/copy/result';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { PROGRESS_ADDRESS } from '@/nav/student-progress';
import { useCommand } from '@/queries/use-command';

type Released = Extract<AttemptResult, { readonly kind: 'released' }>;

/** The board's id prefix of the answers (`Rs-ans-1` …: the jump list's targets). */
const PREFIX = 'Rs';

/**
 * The released result (ST-v1 `resultVM`, `AR.released`): the crumbs, the head ("<assessment> ·
 * result", "You passed" / "Not passed this time"), the score panel (score, Passed / Not passed,
 * pass mark, attempt, release, the marks by question as a jump list, and — not passed with an
 * attempt left the service allows — "Try again") and "Your answers" with the ways on. Rendered only
 * for a result the service answers `released`.
 */
export function ReleasedResult({
  assessmentId,
  view,
  released,
  canStart,
  crumbs,
  date,
  hub,
}: {
  readonly assessmentId: string;
  readonly view: AttemptResultView;
  readonly released: Released;
  readonly canStart: boolean;
  readonly crumbs: ReactNode;
  readonly date: string | undefined;
  /** "Back to experiment": the hub's Assessment tab. */
  readonly hub: string;
}) {
  const answersId = useId();
  const byQuestionId = useId();
  const tryAgain = !released.passed && released.attemptsLeft > 0 && canStart;
  const review = view.review ?? [];
  return (
    <>
      <PageHead
        breadcrumbs={crumbs}
        date={date}
        eyebrow={resultOverline(view.assessmentName)}
        variant="record"
        title={released.passed ? RESULT_PAGE.passed : RESULT_PAGE.notPassed}
        titleFocusTarget
      />
      <StScoreCard
        label={RESULT_V3.scoreLabel}
        score={figure(released.score)}
        outOf={outOfWords(released.outOf)}
        status={
          released.passed
            ? { tone: 'ok', words: RESULT_PAGE.passedPill }
            : { tone: 'neutral', words: RESULT_PAGE.notPassedPill }
        }
        facts={[
          {
            key: 'pass',
            term: RESULT_V3.passMark,
            value: passMarkValueWords(released.passMarkMarks, released.outOf),
          },
          {
            key: 'attempt',
            term: RESULT_V3.attempt,
            value: attemptWords(view.attemptNumber, view.attemptsAllowed),
          },
          {
            key: 'result',
            term: RESULT_V3.result,
            value: releasedWords(view.release, released.releasedAt),
          },
        ]}
        byQuestion={{
          title: RESULT_V3.byQuestion,
          titleId: byQuestionId,
          items: review.map((answer) => {
            const words = byQuestionWords(answer.number, answer.awarded, answer.outOf);
            return {
              targetId: `${PREFIX}-ans-${answer.number}`,
              label: words.label,
              mark: words.mark,
              full: answer.awarded === answer.outOf,
              ariaLabel: words.name,
            };
          }),
        }}
        retry={
          tryAgain
            ? {
                text: retryLine(released.attemptsLeft, view.attemptNumber),
                action: <TryAgain assessmentId={assessmentId} />,
              }
            : undefined
        }
      />
      {view.review ? (
        <StResultReview
          title={RESULT_PAGE.yourAnswers}
          titleId={answersId}
          foot={
            <>
              <ButtonLink size="lg" href={hub}>
                {RESULT_PAGE.backToExperiment}
              </ButtonLink>
              <StTextLink href={PROGRESS_ADDRESS}>{RESULT_PAGE.seeProgress}</StTextLink>
            </>
          }
        >
          {view.review.map((answer) => (
            <AnswerItem key={answer.questionId} answer={answer} />
          ))}
        </StResultReview>
      ) : null}
    </>
  );
}

/** Whether a choice answer is the key's (`resultVM` `right`); `null` for a written answer. */
function isRight(answer: AnswerReview): boolean | null {
  if (answer.type === 'written' || answer.correct === null) return null;
  const yours = answer.yourAnswer;
  if (yours === null) return false;
  if (yours.type === 'multiple-choice') return yours.choice === answer.correct;
  if (yours.type === 'true-false') return String(yours.value) === answer.correct;
  return false;
}

/**
 * One answer (`li.sv-ans`): the head and mark, the question, your answer with its verdict, the
 * correct answer only where it differs, the explanation and the faculty's feedback.
 */
function AnswerItem({ answer }: { readonly answer: AnswerReview }) {
  const headingId = useId();
  const right = isRight(answer);
  const correct = correctAnswerWords(answer.type, answer.correct, answer.options);
  const unanswered =
    answer.yourAnswer === null ||
    (answer.yourAnswer.type === 'written' && answer.yourAnswer.text.trim() === '');
  const yours = unanswered
    ? RESULT_V3.notAnswered
    : yourAnswerWords(answer.type, answer.yourAnswer, answer.options);
  return (
    <StResultAnswer
      id={`${PREFIX}-ans-${answer.number}`}
      headingId={headingId}
      head={questionHeadWords(answer.number, answer.type)}
      mark={{
        tone: answer.awarded === answer.outOf ? 'ok' : 'neutral',
        words: ofMarksWords(answer.awarded, answer.outOf),
      }}
      question={answer.text}
      yours={{
        term: RESULT_PAGE.yourAnswer,
        value: yours,
        verdict:
          right === null
            ? undefined
            : {
                ok: right,
                words: right
                  ? RESULT_V3.correct
                  : unanswered
                    ? RESULT_V3.notAnswered
                    : RESULT_V3.notCorrect,
              },
      }}
      correct={
        right === false && correct !== null
          ? { term: RESULT_PAGE.correctAnswer, value: correct }
          : undefined
      }
      explanation={
        answer.explanation
          ? { term: RESULT_PAGE.explanation, value: answer.explanation }
          : undefined
      }
      feedback={
        answer.feedback
          ? { term: feedbackFromWords(answer.feedbackBy), value: answer.feedback }
          : undefined
      }
    />
  );
}

/**
 * "Try again" (`div.sv-score-retry`): starts the new attempt and opens it (`ST-14.try-again`); a
 * refusal or a failure is said in place.
 */
function TryAgain({ assessmentId }: { readonly assessmentId: string }) {
  const navigation = useAppNavigation();
  const start = useCommand((ports) => ports.assessments.startAttempt);
  const [problem, setProblem] = useState<'refused' | 'failed' | null>(null);

  const tryAgain = async () => {
    setProblem(null);
    try {
      const answer = await start.run(assessmentId as AssessmentId);
      if (answer.ok) navigation.navigate(studentAssessmentAddress(assessmentId, 'attempt'));
      else setProblem('refused');
    } catch {
      setProblem('failed');
    }
  };

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        busy={start.busy}
        busyLabel={stateWords('ST-14.starting')}
        onClick={() => void tryAgain()}
      >
        {RESULT_PAGE.tryAgain}
      </Button>
      {problem === 'failed' ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          title={stateWords('ST-14.start-failed')}
        >
          {ST_STATE_WORDS.failedLine}
        </Notice>
      ) : problem === 'refused' ? (
        <Notice tone="off" role="status" title={stateWords('ST-14.start-refused')} />
      ) : null}
    </>
  );
}
