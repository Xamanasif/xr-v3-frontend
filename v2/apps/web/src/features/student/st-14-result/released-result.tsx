'use client';

import type { AnswerReview, AttemptResultView } from '@xr/contracts/draft';
import type { AssessmentId, AttemptResult } from '@xr/domain';
import { Button, Icon, Link, Notice, PageContent, PageHeader, StatusPill } from '@xr/ui';
import { useId, useState } from 'react';

import {
  attemptsLeftWords,
  attemptWords,
  correctAnswerWords,
  feedbackFromWords,
  ofMarksWords,
  passMarkWords,
  questionHeadWords,
  releasedWords,
  RESULT_PAGE,
  resultOverline,
  yourAnswerWords,
} from '@/copy/result';
import { stateWords } from '@/copy/state-copy';
import { STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import { PROGRESS_ADDRESS } from '@/nav/student-progress';
import { useCommand } from '@/queries/use-command';

type Released = Extract<AttemptResult, { readonly kind: 'released' }>;

/**
 * B4-13 f0, f3, f5: the released result — the header ("You passed" / "Not passed this time"
 * under "<assessment> · result"), the score card (`div.xa-score`), "Your answers" (`ul.xa-ans`)
 * and the actions (`div.xw-actions`). Rendered only for a result the service answers `released`.
 */
export function ReleasedResult({
  assessmentId,
  view,
  released,
  canStart,
  hub,
}: {
  readonly assessmentId: string;
  readonly view: AttemptResultView;
  readonly released: Released;
  readonly canStart: boolean;
  readonly hub: string;
}) {
  const headingId = useId();
  const tryAgain = !released.passed && released.attemptsLeft > 0 && canStart;
  return (
    <PageContent wrap="read">
      <PageHeader
        className="[margin:8px_0_16px]"
        overline={resultOverline(view.assessmentName)}
        title={released.passed ? RESULT_PAGE.passed : RESULT_PAGE.notPassed}
      />
      <div className="xa-score">
        <div>
          <span className="xa-score-n">{ofMarksWords(released.score, released.outOf)}</span>
          <span className="xa-score-sub">
            {released.passed ? (
              <StatusPill tone="ok">{RESULT_PAGE.passedPill}</StatusPill>
            ) : (
              <StatusPill tone="err">{RESULT_PAGE.notPassedPill}</StatusPill>
            )}
          </span>
        </div>
        <div className="xa-score-facts">
          <span>{passMarkWords(released.passMarkMarks, released.outOf)}</span>
          <span>{attemptWords(view.attemptNumber, view.attemptsAllowed)}</span>
          <span>{releasedWords(view.release, released.releasedAt)}</span>
        </div>
      </div>
      {view.review ? (
        <section className="xr-section mt-6" aria-labelledby={headingId}>
          <div className="xr-section-head">
            <h2 id={headingId} className="xr-h2">
              {RESULT_PAGE.yourAnswers}
            </h2>
          </div>
          <div className="[padding:0_24px_24px]">
            <ul className="xa-ans">
              {view.review.map((answer) => (
                <AnswerCard key={answer.questionId} answer={answer} />
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      <ResultActions
        assessmentId={assessmentId}
        hub={hub}
        attemptsLeft={tryAgain ? released.attemptsLeft : null}
      />
    </PageContent>
  );
}

/** One answer (`ul.xa-ans > li`): head, question, your answer, the key, explanation, feedback. */
function AnswerCard({ answer }: { readonly answer: AnswerReview }) {
  const correct = correctAnswerWords(answer.type, answer.correct, answer.options);
  const awarded = answer.awarded > 0;
  return (
    <li>
      <div className="xa-q-head">
        <span className="xa-q-n">{questionHeadWords(answer.number, answer.type)}</span>
        <span className={awarded ? 'xa-mk is-ok' : 'xa-mk is-no'}>
          <Icon name={awarded ? 'done' : 'close'} />
          {ofMarksWords(answer.awarded, answer.outOf)}
        </span>
      </div>
      <p className="xa-q-text m-0 text-[17px] leading-[26px]">{answer.text}</p>
      <div className="xa-ans-row">
        <span>{RESULT_PAGE.yourAnswer}</span>
        <span className="[white-space:pre-line]">
          {yourAnswerWords(answer.type, answer.yourAnswer, answer.options)}
        </span>
      </div>
      {correct !== null ? (
        <div className="xa-ans-row">
          <span>{RESULT_PAGE.correctAnswer}</span>
          <span>{correct}</span>
        </div>
      ) : null}
      {answer.explanation ? (
        <div className="xa-ans-row">
          <span>{RESULT_PAGE.explanation}</span>
          <span>{answer.explanation}</span>
        </div>
      ) : null}
      {answer.feedback ? (
        <div className="xa-ans-row">
          <span>{feedbackFromWords(answer.feedbackBy)}</span>
          <span className="[white-space:pre-line]">{answer.feedback}</span>
        </div>
      ) : null}
    </li>
  );
}

/**
 * f0, f3 `div.xw-actions`: "Back to experiment" (the one primary), then — f3 only — "Try again"
 * with "You have 1 attempt left.", then "See your progress". "Try again" starts the new attempt
 * and opens it (`ST-14.try-again`); a refusal or a failure is said in place.
 */
function ResultActions({
  assessmentId,
  hub,
  attemptsLeft,
}: {
  readonly assessmentId: string;
  readonly hub: string;
  /** The attempts left when "Try again" is shown; `null` hides it. */
  readonly attemptsLeft: number | null;
}) {
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
      {problem === 'failed' ? (
        <Notice tone="err" className="mt-6" title={stateWords('ST-14.start-failed')}>
          {STUDENT_WORDS.failedLine}
        </Notice>
      ) : problem === 'refused' ? (
        <Notice
          tone="err"
          role="status"
          className="mt-6"
          title={stateWords('ST-14.start-refused')}
        />
      ) : null}
      <div className="xw-actions mt-6">
        <Link className="xr-btn xr-btn--primary" href={hub}>
          {RESULT_PAGE.backToExperiment}
        </Link>
        {attemptsLeft !== null ? (
          <>
            <Button
              variant="secondary"
              busy={start.busy}
              busyLabel={stateWords('ST-14.starting')}
              onClick={() => void tryAgain()}
            >
              {RESULT_PAGE.tryAgain}
            </Button>
            <span className="xl-meta">{attemptsLeftWords(attemptsLeft)}</span>
          </>
        ) : null}
        <Link className="xr-btn xr-btn--text" href={PROGRESS_ADDRESS}>
          {RESULT_PAGE.seeProgress}
        </Link>
      </div>
    </>
  );
}
