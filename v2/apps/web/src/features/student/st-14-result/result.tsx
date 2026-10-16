'use client';

import type {
  AssessmentIntro,
  AttemptResultView,
  ServiceError,
  StudentAttemptFacts,
} from '@xr/contracts/draft';
import { Icon, type IconName, Link, LoadingState, PageContent } from '@xr/ui';
import type { ReactNode } from 'react';

import { notReleasedLine, RESULT_PAGE, waitingLine } from '@/copy/result';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import {
  experimentAddress,
  studentAssessmentAddress,
  studentResultPlacement,
} from '@/nav/student-assessments';
import { useAssessmentIntro, useAttemptResult } from '@/queries/student-assessments';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { notAvailableKind } from '../shared/student-view';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import { ReleasedResult } from './released-result';

/** The Student's latest submitted attempt (`ST-14.attempt-shown`); `null` when none is submitted. */
export function latestSubmitted(
  attempts: readonly StudentAttemptFacts[],
): StudentAttemptFacts | null {
  return (
    [...attempts]
      .filter((attempt) => attempt.state === 'submitted')
      .sort((a, b) => b.attemptNumber - a.attemptNumber)[0] ?? null
  );
}

/** A refusal that is the in-shell not-found: an unknown assessment, a draft, another's attempt. */
function isNotFound(error: ServiceError): boolean {
  return (
    error.kind === 'not-found' || error.kind === 'not-permitted' || error.kind === 'invalid-state'
  );
}

/**
 * ST-14 Result — board B4-13 f0 … f5, at `/student/assessments/[assessmentId]/result`.
 *
 * - **Reads**: `AssessmentService.getAssessmentIntro` — the assessment, whether a new attempt can
 *   start and the Student's own attempts (figure-free) — then `getResult` for the latest submitted
 *   attempt (`ST-14.attempt-shown`): its pinned version's name, attempt number, attempts allowed,
 *   submission time and release terms, and — only once the service answers it `released` — the
 *   score, the outcome and the review of every answer (`ST-14.no-figure`, T-19).
 * - **Released** (f0, f3, f5): "You passed" / "Not passed this time", the score card (score,
 *   Passed / Not passed, pass mark, attempt, when and how it was released) and "Your answers" —
 *   each question with its number, type and mark, the Student's answer, the correct answer of a
 *   choice question, the explanation and the Faculty's feedback on a written answer. "Back to
 *   experiment", "Try again" (f3: not passed, an attempt left and the service allows a new one —
 *   `startAttempt`, then ST-13) and "See your progress".
 * - **Not released** (f1, f4 "Submitted — waiting for marking", also after the deadline; f2
 *   "Result not released yet"): the message page with the attempt's own release terms and "Back
 *   to experiment" — no figure. **No submitted attempt**: B4-13's "Not submitted yet" message.
 * - **Undrawn**: loading, failed + retry, a refusal (ST-19 in place) and the not-found.
 */
export function AssessmentResult({ assessmentId }: { readonly assessmentId: string }) {
  const navigation = useAppNavigation();
  const intro = useAssessmentIntro(assessmentId);
  const introAnswer = intro.data;
  const introValue: AssessmentIntro | null = introAnswer?.ok ? introAnswer.value : null;
  const introError = introAnswer && !introAnswer.ok ? introAnswer.error : null;
  const attempt = introValue ? latestSubmitted(introValue.attempts) : null;
  const result = useAttemptResult(attempt?.attemptId ?? null);
  const resultAnswer = result.data;
  const resultError = resultAnswer && !resultAnswer.ok ? resultAnswer.error : null;
  const refusal = introError && !isNotFound(introError) ? notAvailableKind(introError) : null;

  useShellPage(
    refusal !== null
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : studentResultPlacement(
          RESULT_PAGE.title,
          introValue ? { id: introValue.assessment.id, name: introValue.assessment.name } : null,
        ),
  );

  const settled = introValue !== null && (attempt === null || resultAnswer !== undefined);
  const retried = useRetryFocus(settled);

  if (introError && isNotFound(introError)) return navigation.notFound();
  if (resultError && isNotFound(resultError)) return navigation.notFound();
  if (introError) {
    if (refusal === null) return navigation.notFound();
    return <NotAvailable kind={refusal} name={null} />;
  }
  if (intro.isError || result.isError || resultError) {
    return (
      <PageContent wrap="read">
        <StudentFailed
          title={stateWords('ST-14.failed')}
          onRetry={() => {
            retried();
            if (intro.isError) void intro.refetch();
            if (result.isError || resultError) void result.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (!introValue || (attempt !== null && !resultAnswer?.ok)) {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('ST-14.loading')} surface="section" />
      </PageContent>
    );
  }

  const hub = experimentAddress(introValue.assessment.experimentId);
  const view: AttemptResultView | null = resultAnswer?.ok ? resultAnswer.value : null;
  if (attempt === null || view === null || view.result.kind === 'in-progress') {
    return (
      <ResultMessage
        icon="assessments"
        title={RESULT_PAGE.notSubmittedTitle}
        action={{
          href: studentAssessmentAddress(assessmentId),
          label: RESULT_PAGE.backToAssessment,
        }}
      >
        {RESULT_PAGE.notSubmittedLine}
      </ResultMessage>
    );
  }
  if (view.result.kind === 'waiting-for-marking') {
    return (
      <ResultMessage
        icon="clock"
        tone="wait"
        title={RESULT_PAGE.waitingTitle}
        action={{ href: hub, label: RESULT_PAGE.backToExperiment }}
      >
        {waitingLine(view.submittedAt, view.release, attempt.pinned.questionTypes.written > 0)}
      </ResultMessage>
    );
  }
  if (view.result.kind === 'not-released-yet') {
    return (
      <ResultMessage
        icon="readOnly"
        title={RESULT_PAGE.notReleasedTitle}
        action={{ href: hub, label: RESULT_PAGE.backToExperiment }}
      >
        {notReleasedLine(view.release)}
      </ResultMessage>
    );
  }
  return (
    <ReleasedResult
      assessmentId={assessmentId}
      view={view}
      released={view.result}
      canStart={introValue.canStart}
      hub={hub}
    />
  );
}

/**
 * B4-13 f1, f2 (and `r.notSub`): `div.xr-msg` in the read width, left-aligned near the top
 * (`margin:8px 0 24px`) — the icon (amber while waiting for marking), the page's one H1, the lead
 * and one primary action.
 */
function ResultMessage({
  icon,
  tone = 'neutral',
  title,
  children,
  action,
}: {
  readonly icon: IconName;
  readonly tone?: 'neutral' | 'wait';
  readonly title: string;
  readonly children: ReactNode;
  readonly action: { readonly href: string; readonly label: string };
}) {
  return (
    <PageContent wrap="read">
      <div className="xr-msg [margin:8px_0_24px]">
        <span className={tone === 'wait' ? 'xr-msg-icon bg-warn-bg text-warn' : 'xr-msg-icon'}>
          <Icon name={icon} />
        </span>
        <h1 className="xr-msg-title">{title}</h1>
        <p className="xr-lead m-0">{children}</p>
        <div className="xr-msg-actions">
          <Link className="xr-btn xr-btn--primary" href={action.href}>
            {action.label}
          </Link>
        </div>
      </div>
    </PageContent>
  );
}
