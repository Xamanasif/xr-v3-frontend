'use client';

import type {
  AssessmentIntro as IntroAnswer,
  ServiceError,
  StudentAttemptFacts,
} from '@xr/contracts/draft';
import {
  BackLink,
  Button,
  Icon,
  Link,
  LoadingState,
  Notice,
  type NoticeTone,
  PageContent,
  PageHeader,
} from '@xr/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import {
  attemptsUsedWords,
  inProgressLine,
  inProgressTitle,
  INTRO_PAGE,
  introOverline,
  markedNotReleasedLine,
  notPassedLine,
  notPassedTitle,
  passedTitle,
  passMarkMarksWords,
  passPercentWords,
  questionMixWords,
  submittedOnLine,
} from '@/copy/attempt';
import { releaseValueWords } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { stateWords } from '@/copy/state-copy';
import { STUDENT_WORDS } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import {
  experimentAddress,
  studentAssessmentAddress,
  studentAssessmentPlacement,
} from '@/nav/student-assessments';
import { useAssessmentIntro } from '@/queries/student-assessments';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { notAvailableKind } from '../shared/student-view';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../st-19-not-available/not-available';
import { attemptsUsed, type IntroState, introState, questionCountOf } from './intro-state';

/** The board's id prefix (`Im-main` …; B4-11 f11). */
const PREFIX = 'Im';

/**
 * ST-12 Assessment — before you start — board B4-11 f11 … f16, at
 * `/student/assessments/[assessmentId]`.
 *
 * - **Read**: `AssessmentService.getAssessmentIntro` — the assessment as configured, its question
 *   mix, the Student's own attempts (figure-free until released) and the attempt in progress.
 * - **As drawn**: the back link to the experiment hub, the overline and the name, the state's
 *   notice (f12 in progress, f13 waiting for marking, f14 not passed · 1 attempt left, f15 can't be
 *   started), the introduction, the six key facts exactly as configured (`dl.xa-facts`: questions
 *   and their mix, total marks, pass mark and its marks, attempts allowed and used, deadline, when
 *   the result and answers are seen), "No time limit…", then the state's actions.
 * - **Start assessment / Try again** send `startAttempt` and open the attempt (ST-13); Continue
 *   attempt opens it; See result opens ST-14; Back to experiment opens the hub. Whether a start
 *   is allowed is the service's `canStart` — the page never decides it.
 * - Undrawn states (passed, marked but not released, no attempt left, a start that fails) are
 *   the register's (`state-copy-attempt.ts`).
 */
export function AssessmentIntro({ assessmentId }: { readonly assessmentId: string }) {
  const navigation = useAppNavigation();
  const read = useAssessmentIntro(assessmentId);
  const answer = read.data;
  const intro = answer?.ok ? answer.value : null;
  const error = answer && !answer.ok ? answer.error : null;
  const refusal = error ? notAvailableKind(error) : null;
  useShellPage(
    refusal !== null
      ? notAvailablePlacement(NOT_AVAILABLE_TITLE)
      : studentAssessmentPlacement(intro ? intro.assessment : null),
  );
  const retried = useRetryFocus(intro !== null);

  if (read.isError) {
    return (
      <PageContent wrap="read">
        <StudentFailed
          title={stateWords('ST-12.failed')}
          onRetry={() => {
            retried();
            void read.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (error) {
    if (refusal === null) return navigation.notFound();
    return <NotAvailable kind={refusal} name={null} />;
  }
  if (!intro) {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('ST-12.loading')} surface="section" />
      </PageContent>
    );
  }
  return <IntroPage intro={intro} refetch={() => void read.refetch()} />;
}

type StartOutcome = 'unavailable' | 'refused';

function IntroPage({
  intro,
  refetch,
}: {
  readonly intro: IntroAnswer;
  readonly refetch: () => void;
}) {
  const navigation = useAppNavigation();
  const start = useCommand((ports) => ports.assessments.startAttempt);
  const [outcome, setOutcome] = useState<StartOutcome | null>(null);
  const [answered, setAnswered] = useState(0);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  // The start's answer takes focus when it shows (a notice in place, board 04).
  useEffect(() => {
    if (answered > 0) outcomeRef.current?.focus();
  }, [answered]);

  if (gone) return navigation.notFound();

  const { assessment } = intro;
  const state = introState(intro);
  const hub = experimentAddress(assessment.experimentId);
  const attemptAddress = studentAssessmentAddress(assessment.id, 'attempt');
  const resultAddress = studentAssessmentAddress(assessment.id, 'result');

  const answer = (next: StartOutcome) => {
    setOutcome(next);
    setAnswered((count) => count + 1);
  };

  const refused = (refusal: ServiceError) => {
    if (refusal.kind === 'invalid-state' && refusal.current === 'attempt-in-progress') {
      navigation.navigate(attemptAddress);
      return;
    }
    if (refusal.kind === 'not-found' || refusal.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    refetch();
    answer('refused');
  };

  const begin = () => {
    if (start.busy) return;
    start.run(assessment.id).then(
      (result) => {
        if (result.ok) {
          navigation.navigate(attemptAddress);
          return;
        }
        refused(result.error);
      },
      () => answer('unavailable'),
    );
  };

  const startButton = (label: string) => (
    <Button variant="primary" busy={start.busy} onClick={begin}>
      {label}
    </Button>
  );
  const back = (variant: 'primary' | 'text') => (
    <Link className={`xr-btn xr-btn--${variant}`} href={hub}>
      {INTRO_PAGE.backToExperiment}
    </Link>
  );
  const view = stateView(state, {
    start: startButton,
    continueLink: (
      <Link className="xr-btn xr-btn--primary" href={attemptAddress}>
        {INTRO_PAGE.continue}
      </Link>
    ),
    resultLink: (variant: 'primary' | 'secondary', label: string) => (
      <Link className={`xr-btn xr-btn--${variant}`} href={resultAddress}>
        {label}
      </Link>
    ),
    back,
  });

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={hub}>{intro.experimentName}</BackLink>}
        overline={introOverline(intro.experimentName)}
        title={assessment.name}
      />
      <div id={`${PREFIX}-start`} tabIndex={-1} ref={outcomeRef}>
        {outcome ? (
          <div className="mb-5">
            <StartNotice outcome={outcome} />
          </div>
        ) : null}
      </div>
      {view.notice ? <div className="mb-5">{view.notice}</div> : null}
      {assessment.introduction ? (
        <p className="xr-lead [margin:0_0_20px]">{assessment.introduction}</p>
      ) : null}
      <KeyFacts intro={intro} attempt={factsAttemptOf(state, intro)} />
      <div className="[margin:16px_0_24px]">
        <p className="xl-open">
          <Icon name="info" size={16} />
          <span>{INTRO_PAGE.noTimeLimit}</span>
        </p>
      </div>
      <div className="xw-actions">{view.actions}</div>
    </PageContent>
  );
}

/** The start's answer when it is not the attempt (`ST-12.start-failed`, `ST-12.start-refused`). */
function StartNotice({ outcome }: { readonly outcome: StartOutcome }) {
  return outcome === 'unavailable' ? (
    <Notice tone="err" title={stateWords('ST-12.start-failed')}>
      {STUDENT_WORDS.failedLine}
    </Notice>
  ) : (
    <Notice tone="warn" title={stateWords('ST-12.start-failed')}>
      {stateWords('ST-12.start-refused')}
    </Notice>
  );
}

interface StateParts {
  readonly start: (label: string) => ReactNode;
  readonly continueLink: ReactNode;
  readonly resultLink: (variant: 'primary' | 'secondary', label: string) => ReactNode;
  readonly back: (variant: 'primary' | 'text') => ReactNode;
}

function notice(tone: NoticeTone, title: string, line: string, icon?: 'clock'): ReactNode {
  return (
    <Notice tone={tone} title={title} {...(icon ? { icon } : {})}>
      {line}
    </Notice>
  );
}

/** Each state's notice and actions, as B4-11 f11 … f15 draw them (the rest: `ST-12.states`). */
function stateView(
  state: IntroState,
  parts: StateParts,
): { readonly notice: ReactNode; readonly actions: ReactNode } {
  switch (state.kind) {
    case 'start':
      return {
        notice: null,
        actions: (
          <>
            {parts.start(INTRO_PAGE.start)}
            {parts.back('text')}
          </>
        ),
      };
    case 'continue':
      return {
        notice: notice(
          'info',
          inProgressTitle(state.attemptNumber),
          inProgressLine(state.answered, state.questionCount),
        ),
        actions: (
          <>
            {parts.continueLink}
            {parts.back('text')}
          </>
        ),
      };
    case 'waiting':
    case 'not-released':
      return {
        notice: notice(
          'warn',
          state.kind === 'waiting' ? INTRO_PAGE.waitingTitle : INTRO_PAGE.notReleasedTitle,
          state.kind === 'waiting'
            ? submittedOnLine(state.latest.submittedAt!, state.latest.release)
            : markedNotReleasedLine(state.latest.release),
          'clock',
        ),
        actions: (
          <>
            {parts.resultLink('primary', INTRO_PAGE.seeResultPage)}
            {parts.back('text')}
          </>
        ),
      };
    case 'try-again':
      return {
        notice: notice(
          'quiet',
          notPassedTitle(state.latest.attemptNumber, state.attemptsLeft),
          notPassedLine(state.latest.attemptNumber, state.attemptsLeft),
        ),
        actions: (
          <>
            {parts.start(INTRO_PAGE.tryAgain)}
            {parts.resultLink('secondary', INTRO_PAGE.seeResult)}
          </>
        ),
      };
    case 'passed':
    case 'no-attempts-left':
      return {
        notice:
          state.kind === 'passed'
            ? notice(
                'ok',
                passedTitle(state.latest.attemptNumber),
                stateWords('ST-12.result-stays'),
              )
            : notice(
                'quiet',
                notPassedTitle(state.latest.attemptNumber, 0),
                notPassedLine(state.latest.attemptNumber, 0),
              ),
        actions: (
          <>
            {parts.resultLink('primary', INTRO_PAGE.seeResult)}
            {parts.back('text')}
          </>
        ),
      };
    case 'cant-start':
      return {
        notice: notice(
          'quiet',
          INTRO_PAGE.cantStartTitle,
          state.noQuestions ? INTRO_PAGE.noQuestionsLine : stateWords('ST-12.cant-start-line'),
        ),
        actions: (
          <>
            {parts.back('primary')}
            {state.latest ? parts.resultLink('secondary', INTRO_PAGE.seeResult) : null}
          </>
        ),
      };
  }
}

/**
 * The attempt the page is about (Phase 4B review): an attempt in progress, submitted, marked or
 * released is shown with the facts of the version it pins (P4-06: a submitted attempt keeps its
 * version's terms) — never the current version's beside its own notice. Before a first or a next
 * attempt the facts are the version a new attempt would pin (`null`).
 */
function factsAttemptOf(state: IntroState, intro: IntroAnswer): StudentAttemptFacts | null {
  switch (state.kind) {
    case 'continue':
      return intro.attempts.find((attempt) => attempt.state === 'in-progress') ?? null;
    case 'waiting':
    case 'not-released':
    case 'passed':
    case 'no-attempts-left':
      return state.latest;
    default:
      return null;
  }
}

/** The six key facts exactly as configured (B4-11 f11 `dl.xa-facts`). */
function KeyFacts({
  intro,
  attempt,
}: {
  readonly intro: IntroAnswer;
  readonly attempt: StudentAttemptFacts | null;
}) {
  const current = intro.assessment.rules;
  const pinned = attempt?.pinned ?? null;
  const facts = pinned
    ? {
        questionCount: attempt!.questionCount,
        questionTypes: pinned.questionTypes,
        totalMarks: pinned.totalMarks,
        passMarkPercent: pinned.passMarkPercent,
        passMarkMarks:
          pinned.passMarkPercent === null ? 0 : (pinned.passMarkPercent * pinned.totalMarks) / 100,
        attemptsAllowed: pinned.attemptsAllowed,
        deadline: pinned.deadline,
        release: attempt!.release.option
          ? {
              option: attempt!.release.option,
              releaseDate: attempt!.release.option === 'on-date' ? attempt!.release.on : null,
            }
          : null,
      }
    : {
        questionCount: questionCountOf(intro),
        questionTypes: intro.questionTypes,
        totalMarks: intro.totalMarks,
        passMarkPercent: current.passMarkPercent,
        passMarkMarks: intro.passMarkMarks,
        attemptsAllowed: current.attemptsAllowed,
        deadline: current.deadline,
        release: current.release,
      };
  const missing = INTRO_PAGE.notSet;
  const release = releaseValueWords(facts.release);
  return (
    <dl className="xa-facts">
      <div>
        <dt>{INTRO_PAGE.questions}</dt>
        <dd>
          {facts.questionCount}
          <span>{questionMixWords(facts.questionTypes)}</span>
        </dd>
      </div>
      <div>
        <dt>{INTRO_PAGE.totalMarks}</dt>
        <dd>{facts.totalMarks}</dd>
      </div>
      <div>
        <dt>{INTRO_PAGE.passMark}</dt>
        <dd>
          {facts.passMarkPercent === null ? missing : passPercentWords(facts.passMarkPercent)}
          {facts.passMarkPercent === null ? null : (
            <span>{passMarkMarksWords(facts.passMarkMarks, facts.totalMarks)}</span>
          )}
        </dd>
      </div>
      <div>
        <dt>{INTRO_PAGE.attemptsAllowed}</dt>
        <dd>
          {facts.attemptsAllowed ?? missing}
          <span>{attemptsUsedWords(attemptsUsed(intro))}</span>
        </dd>
      </div>
      <div>
        <dt>{INTRO_PAGE.deadline}</dt>
        <dd>{facts.deadline ? dateTime(facts.deadline) : missing}</dd>
      </div>
      <div>
        <dt>{INTRO_PAGE.release}</dt>
        <dd>
          {release ?? missing}
          {facts.questionTypes.written > 0 ? <span>{INTRO_PAGE.writtenMarked}</span> : null}
        </dd>
      </div>
    </dl>
  );
}
