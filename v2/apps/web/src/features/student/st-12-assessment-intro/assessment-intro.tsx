'use client';

import type {
  AssessmentIntro as IntroAnswer,
  ServiceError,
  StudentAttemptFacts,
} from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  Notice,
  PageHead,
  StIntroCard,
  type StIntroFact,
  StIntroExperimentLink,
  StLoading,
  StMessage,
  type StatusTone,
} from '@xr/ui/v3';
import { type ReactNode, type Ref, useEffect, useId, useRef, useState } from 'react';

import {
  attemptsUsedWords,
  INTRO_EYEBROW_AFTER,
  INTRO_PAGE,
  INTRO_V3,
  inProgressSavedLine,
  inProgressTitle,
  notPassedLine,
  notPassedTitle,
  notReleasedYetLine,
  passMarkMarksWords,
  passPercentWords,
  questionMixWords,
  submittedWaitingLine,
} from '@/copy/attempt';
import { releaseValueWords } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { releasedWords } from '@/copy/result';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { WHEN_KICKERS, whenWords } from '@/copy/student-assessments';
import { useAppNavigation } from '@/nav/navigation';
import { notAvailablePlacement } from '@/nav/student';
import {
  hubAssessmentAddress,
  STUDENT_ASSESSMENTS_ADDRESS,
  STUDENT_ASSESSMENTS_TITLE,
  studentAssessmentAddress,
  studentAssessmentPlacement,
} from '@/nav/student-assessments';
import { useAssessmentIntro } from '@/queries/student-assessments';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NOT_AVAILABLE_TITLE, NotAvailable } from '../shared/not-available';
import { useRetryFocus } from '../shared/student-states';
import { notAvailableKind } from '../shared/student-view';
import { useStudentToday } from '../shared/use-today';
import { stateWordsOf, STATE_TONE } from '../st-11-assessments/assessment-rows';
import { attemptsUsed, type IntroState, introState, questionCountOf } from './intro-state';

/** The board's id prefix (`Im-start` …; B4-11 f11). */
const PREFIX = 'Im';

/**
 * ST-12 Assessment — before you start — the owner-approved V3 export (ST-v1 `StudentFinal.dc.html`
 * `is.aintro`, `introVM`), at `/student/assessments/[assessmentId]`.
 *
 * - **Read**: `AssessmentService.getAssessmentIntro` — the assessment as configured, its question
 *   mix, the Student's own attempts (figure-free until released) and the attempt in progress.
 * - **As drawn**: the crumbs (Assessments › the name), the head (the experiment, linking to its
 *   Assessment tab, " · assessment", the name, the introduction), then one card: the status, the
 *   state as its heading with its line, the three rules while the Student can still answer, the
 *   state's actions; the deadline as a date block beside the key facts exactly as configured
 *   (questions and their mix, total marks, pass mark and its marks, attempts allowed and used, when
 *   the result and answers are seen, who set it).
 * - **Start assessment / Try again** send `startAttempt` and open the attempt (ST-13); Continue
 *   attempt opens it; See result opens ST-14; Back to experiment opens the hub's Assessment tab.
 *   Whether a start is allowed is the service's `canStart` — the page never decides it. A start
 *   that fails or is refused is said in place (`ST-12.start-failed`, `ST-12.start-refused`).
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
  const failedId = useId();

  if (read.isError) {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-12.failed')}
        titleId={failedId}
        description={ST_STATE_WORDS.failedLine}
        retry={{
          label: ST_STATE_WORDS.tryAgain,
          onRetry: () => {
            retried();
            void read.refetch();
          },
        }}
      />
    );
  }
  if (error) {
    if (refusal === null) return navigation.notFound();
    return <NotAvailable kind={refusal} name={null} />;
  }
  if (!intro) {
    return (
      <StLoading
        variant="card"
        label={stateWords('ST-12.loading')}
        name={STUDENT_ASSESSMENTS_TITLE}
      />
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
  const today = useStudentToday();
  const start = useCommand((ports) => ports.assessments.startAttempt);
  const [outcome, setOutcome] = useState<StartOutcome | null>(null);
  const [answered, setAnswered] = useState(0);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const stateId = useId();
  const factsId = useId();

  // The start's answer takes focus when it shows (a notice in place, board 04).
  useEffect(() => {
    if (answered > 0) outcomeRef.current?.focus();
  }, [answered]);

  if (gone) return navigation.notFound();

  const { assessment } = intro;
  const state = introState(intro);
  const tab = hubAssessmentAddress(assessment.experimentId);
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

  const view = stateView(state, {
    start: (label) => (
      <Button variant="primary" size="lg" busy={start.busy} onClick={begin}>
        {label}
      </Button>
    ),
    continueLink: (
      <ButtonLink variant="primary" size="lg" href={attemptAddress}>
        {INTRO_PAGE.continue}
      </ButtonLink>
    ),
    resultLink: (primary, label) => (
      <ButtonLink variant={primary ? 'primary' : 'default'} size="lg" href={resultAddress}>
        {label}
      </ButtonLink>
    ),
    back: (primary) => (
      <ButtonLink variant={primary ? 'primary' : 'default'} size="lg" href={tab}>
        {INTRO_PAGE.backToExperiment}
      </ButtonLink>
    ),
  });

  const deadline = factsAttemptOf(state, intro)?.pinned.deadline ?? assessment.rules.deadline;

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: STUDENT_ASSESSMENTS_TITLE, href: STUDENT_ASSESSMENTS_ADDRESS }]}
            current={assessment.name}
          />
        }
        date={today?.line}
        eyebrow={
          <>
            <StIntroExperimentLink href={tab}>{intro.experimentName}</StIntroExperimentLink>
            {INTRO_EYEBROW_AFTER}
          </>
        }
        variant="record"
        title={assessment.name}
        titleFocusTarget
        lead={assessment.introduction ?? undefined}
      />
      {outcome ? <StartNotice outcome={outcome} noticeRef={outcomeRef} /> : null}
      <StIntroCard
        stateId={stateId}
        status={view.status}
        stateTitle={view.title}
        stateLine={view.line ?? undefined}
        rules={
          view.rules
            ? {
                label: INTRO_V3.rulesLabel,
                items: [
                  { key: 'time', icon: 'clock', title: INTRO_V3.ruleNoTimeLimit },
                  { key: 'saves', icon: 'check', title: INTRO_V3.ruleSaves },
                  {
                    key: 'submit',
                    icon: 'lock',
                    title: INTRO_V3.ruleSubmit,
                    detail: INTRO_V3.ruleSubmitDetail,
                  },
                ],
              }
            : undefined
        }
        actions={view.actions}
        factsId={factsId}
        factsTitle={INTRO_V3.factsTitle}
        deadline={
          deadline
            ? {
                kicker: WHEN_KICKERS.deadline,
                when: whenWords(deadline, today?.now ?? null),
                full: dateTime(deadline),
              }
            : undefined
        }
        facts={keyFacts(intro, factsAttemptOf(state, intro))}
      />
    </>
  );
}

/** The start's answer when it is not the attempt (`ST-12.start-failed`, `ST-12.start-refused`). */
function StartNotice({
  outcome,
  noticeRef,
}: {
  readonly outcome: StartOutcome;
  readonly noticeRef: Ref<HTMLDivElement>;
}) {
  return outcome === 'unavailable' ? (
    <Notice
      ref={noticeRef}
      id={`${PREFIX}-start`}
      tone="warn"
      icon="alertCircle"
      role="alert"
      title={stateWords('ST-12.start-failed')}
    >
      {ST_STATE_WORDS.failedLine}
    </Notice>
  ) : (
    <Notice
      ref={noticeRef}
      id={`${PREFIX}-start`}
      tone="off"
      role="status"
      title={stateWords('ST-12.start-failed')}
    >
      {stateWords('ST-12.start-refused')}
    </Notice>
  );
}

interface StateParts {
  readonly start: (label: string) => ReactNode;
  readonly continueLink: ReactNode;
  readonly resultLink: (primary: boolean, label: string) => ReactNode;
  readonly back: (primary: boolean) => ReactNode;
}

interface StateView {
  readonly status: { readonly tone: StatusTone; readonly words: string };
  readonly title: string;
  readonly line: string | null;
  readonly rules: boolean;
  readonly actions: ReactNode;
}

/** The status the card leads with: the assessment's state as ST-11 words it (`asmtRow`). */
function statusFor(state: IntroState) {
  switch (state.kind) {
    case 'start':
      return { tone: STATE_TONE['to-do'], words: stateWordsOf('to-do') };
    case 'continue':
      return { tone: STATE_TONE['in-progress'], words: stateWordsOf('in-progress') };
    case 'waiting':
      return {
        tone: STATE_TONE['waiting-for-marking'],
        words: stateWordsOf('waiting-for-marking'),
      };
    case 'not-released':
      return { tone: STATE_TONE['not-released-yet'], words: stateWordsOf('not-released-yet') };
    case 'try-again':
    case 'passed':
    case 'no-attempts-left':
      return { tone: STATE_TONE.released, words: stateWordsOf('released') };
    case 'cant-start':
      return state.latest?.result.kind === 'released'
        ? { tone: STATE_TONE.released, words: stateWordsOf('released') }
        : { tone: 'neutral' as const, words: INTRO_V3.cantStartStatus };
  }
}

/** "Released 14 Nov 2026, 23:59, after the deadline." for a released attempt. */
function releasedLine(latest: StudentAttemptFacts): string | null {
  return latest.result.kind === 'released'
    ? `${releasedWords(latest.release, latest.result.releasedAt)}.`
    : null;
}

/** Each state's heading, line and actions, as the export's `introVM` draws them. */
function stateView(state: IntroState, parts: StateParts): StateView {
  const status = statusFor(state);
  switch (state.kind) {
    case 'start':
      return {
        status,
        title: INTRO_V3.beforeYouStart,
        line: null,
        rules: true,
        actions: (
          <>
            {parts.start(INTRO_PAGE.start)}
            {parts.back(false)}
          </>
        ),
      };
    case 'continue':
      return {
        status,
        title: inProgressTitle(state.attemptNumber),
        line: inProgressSavedLine(state.answered, state.questionCount),
        rules: true,
        actions: (
          <>
            {parts.continueLink}
            {parts.back(false)}
          </>
        ),
      };
    case 'waiting':
    case 'not-released':
      return {
        status,
        title: state.kind === 'waiting' ? INTRO_PAGE.waitingTitle : INTRO_V3.notReleasedTitle,
        line:
          state.kind === 'waiting'
            ? submittedWaitingLine(state.latest.submittedAt!, state.latest.release)
            : notReleasedYetLine(state.latest.release),
        rules: false,
        actions: (
          <>
            {parts.resultLink(false, INTRO_PAGE.seeResultPage)}
            {parts.back(false)}
          </>
        ),
      };
    case 'try-again':
      return {
        status,
        title: notPassedTitle(state.latest.attemptNumber, state.attemptsLeft),
        line: notPassedLine(state.latest.attemptNumber, state.attemptsLeft),
        rules: true,
        actions: (
          <>
            {parts.start(INTRO_PAGE.tryAgain)}
            {parts.resultLink(false, INTRO_PAGE.seeResult)}
          </>
        ),
      };
    case 'passed':
    case 'no-attempts-left':
      return {
        status,
        title: state.kind === 'passed' ? INTRO_V3.passedTitle : INTRO_V3.releasedTitle,
        line: releasedLine(state.latest),
        rules: false,
        actions: (
          <>
            {parts.resultLink(true, INTRO_PAGE.seeResult)}
            {parts.back(false)}
          </>
        ),
      };
    case 'cant-start':
      return {
        status,
        title: INTRO_PAGE.cantStartTitle,
        line: state.noQuestions ? INTRO_PAGE.noQuestionsLine : stateWords('ST-12.cant-start-line'),
        rules: false,
        actions: (
          <>
            {parts.back(true)}
            {state.latest ? parts.resultLink(false, INTRO_PAGE.seeResult) : null}
          </>
        ),
      };
  }
}

/**
 * The attempt the page is about (Phase 4B review): an attempt in progress, submitted, marked or
 * released is shown with the facts of the version it pins (P4-06: a submitted attempt keeps its
 * version's terms) — never the current version's beside its own state. Before a first or a next
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

/** The key facts exactly as configured (`AI.facts` and "Set by"). */
function keyFacts(intro: IntroAnswer, attempt: StudentAttemptFacts | null): StIntroFact[] {
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
        release: current.release,
      };
  const missing = INTRO_PAGE.notSet;
  const setBy = intro.assessment.createdBy;
  return [
    {
      key: 'questions',
      term: INTRO_PAGE.questions,
      value: facts.questionCount,
      detail: questionMixWords(facts.questionTypes) || undefined,
    },
    { key: 'marks', term: INTRO_PAGE.totalMarks, value: facts.totalMarks },
    {
      key: 'pass',
      term: INTRO_PAGE.passMark,
      value: facts.passMarkPercent === null ? missing : passPercentWords(facts.passMarkPercent),
      detail:
        facts.passMarkPercent === null
          ? undefined
          : passMarkMarksWords(facts.passMarkMarks, facts.totalMarks),
    },
    {
      key: 'attempts',
      term: INTRO_PAGE.attemptsAllowed,
      value: facts.attemptsAllowed ?? missing,
      detail: attemptsUsedWords(attemptsUsed(intro)),
    },
    {
      key: 'release',
      term: INTRO_PAGE.release,
      value: releaseValueWords(facts.release) ?? missing,
      // Without a written question the Faculty member confirms the automatic marks (24 Oct 2026).
      detail:
        facts.questionTypes.written > 0
          ? INTRO_PAGE.writtenMarked
          : stateWords('ST-12.choice-only'),
    },
    ...(setBy.kind === 'person'
      ? [{ key: 'set-by', term: INTRO_V3.setBy, value: setBy.displayName }]
      : []),
  ];
}
