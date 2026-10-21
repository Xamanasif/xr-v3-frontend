'use client';

import type {
  AssessmentIntro as IntroAnswer,
  AttemptSheet,
  StudentAttemptFacts,
} from '@xr/contracts/draft';
import type { AnswerValue, ChoiceKey } from '@xr/domain';
import {
  ButtonLink,
  ConfirmDialog,
  StAttemptAllAnswered,
  StAttemptChoices,
  StAttemptDone,
  StAttemptFrame,
  StAttemptHead,
  StAttemptLayout,
  StAttemptPending,
  StAttemptQuestion,
  StAttemptSave,
  StAttemptStrip,
  StAttemptSubmit,
  StAttemptWritten,
  StLoading,
  StMessage,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';

import {
  allAnsweredWords,
  answeredCountWords,
  ATTEMPT_PAGE,
  ATTEMPT_V3,
  attemptDocumentTitle,
  attemptMetaLine,
  attemptOfWords,
  pendingWords,
  questionLabel,
  questionMarks,
  stripLinkLabel,
  submittedLine,
} from '@/copy/attempt';
import { ST_STATE_WORDS } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { hubAssessmentAddress, studentAssessmentAddress } from '@/nav/student-assessments';
import { useAssessmentIntro } from '@/queries/student-assessments';
import { useCommand } from '@/queries/use-command';

import { DocumentTitle } from '../../shared/document-title';
import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPerson } from '../../shared/workspace-frame/shell-page';
import { notAvailableKind } from '../shared/student-view';
import { STATE_TONE, statusOf } from '../st-11-assessments/assessment-rows';
import { type AnswerSaver, isAnswered, type SaveStatus, useAnswerSaver } from './answer-saver';

/** The board's id prefix (`Ta-main`, `Ta-q1`, `Ta-suberr`, `Ta-done` …; B4-12 f0). */
const PREFIX = 'Ta';
/** The multiple-choice keys in the order a question shows them. */
const CHOICE_ORDER: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

/** What the page keeps of the attempt it opened: its sheet and the names around it. */
interface Held {
  readonly assessmentId: string;
  readonly sheet: AttemptSheet;
  readonly experimentId: string;
  readonly experimentName: string;
  readonly name: string;
}

interface Submitted {
  readonly attemptId: string;
  readonly submittedAt: string;
}

function heldOf(intro: IntroAnswer, sheet: AttemptSheet): Held {
  return {
    assessmentId: intro.assessment.id,
    sheet,
    experimentId: intro.assessment.experimentId,
    experimentName: intro.experimentName,
    name: intro.assessment.name,
  };
}

/**
 * ST-13 Assessment attempt — board B4-12 f0 … f6, at `/student/assessments/[assessmentId]/attempt`,
 * a FOCUSED page: the workspace frame renders it without the shell (no sidebar, no top bar). It
 * draws `div.xr-app > header.xa-bar` (the way out to the experiment hub, the save state, the
 * avatar) and `main.xr-page`, and names the browser tab itself.
 *
 * - **Read**: `getAssessmentIntro` — the attempt in progress (`sheet`: its pinned questions and
 *   saved answers, never a key). No attempt in progress: right after Submit here, "Answers
 *   submitted" (f4); otherwise Before you start (ST-12) replaces this page.
 * - **Answers** save as they change (`saveAnswer`, `ST-13.autosave`): "Saving…" → "All answers
 *   saved"; a failed save → "Your last answer didn’t save · Try again" (f2). The strip counts
 *   what is answered, links to each question and offers "Next unanswered".
 * - **Submit** opens DL-1 "Submit your answers?" naming the unanswered questions (f1); "Submit
 *   answers" sends `submitAttempt` — never automatic, no timer. A failure keeps everything and
 *   says "Your answers weren’t submitted" (f3). Submitted: "Answers submitted" with when the
 *   result appears, by the attempt's pinned release (f4).
 */
export function AssessmentAttempt({ assessmentId }: { readonly assessmentId: string }) {
  const navigation = useAppNavigation();
  const read = useAssessmentIntro(assessmentId);
  const answer = read.data;
  const intro = answer?.ok ? answer.value : null;
  const error = answer && !answer.ok ? answer.error : null;
  const [held, setHeld] = useState<Held | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [gone, setGone] = useState(false);
  const leaving = useRef(false);

  // The attempt the page opened is held as read — from a settled read, never a cached copy that
  // is being read again (a save sent as the page was left may have moved it; Phase 4B review).
  // Later reads move its revision only (`reread` → `saver.adopt`).
  if (
    intro?.sheet &&
    !read.isFetching &&
    submitted === null &&
    held?.sheet.attemptId !== intro.sheet.attemptId
  ) {
    setHeld(heldOf(intro, intro.sheet));
  }

  // No attempt in progress and none submitted here, a refusal of the Student's access, or an
  // attempt submitted elsewhere: Before you start shows where the assessment stands.
  const toIntro =
    gone ||
    (intro !== null && intro.sheet === null && held === null && submitted === null) ||
    (error !== null && notAvailableKind(error) !== null);
  useEffect(() => {
    if (!toIntro || leaving.current) return;
    leaving.current = true;
    navigation.navigate(studentAssessmentAddress(assessmentId), { replace: true });
  }, [toIntro, assessmentId, navigation]);

  if (error && notAvailableKind(error) === null) return navigation.notFound();

  const reread = async (): Promise<number | null> => {
    const fresh = await read.refetch();
    return fresh.data?.ok ? (fresh.data.value.sheet?.rev ?? null) : null;
  };

  if (submitted && held) {
    const facts = intro?.attempts.find((attempt) => attempt.attemptId === submitted.attemptId);
    return (
      <AttemptFrame held={held} title={attemptDocumentTitle(held.name, true)}>
        <AttemptHead held={held} />
        <SubmittedMessage held={held} submittedAt={submitted.submittedAt} facts={facts ?? null} />
      </AttemptFrame>
    );
  }
  if (held && !toIntro) {
    return (
      <AttemptForm
        key={held.sheet.attemptId}
        held={held}
        reread={reread}
        onSubmitted={setSubmitted}
        onGone={() => setGone(true)}
      />
    );
  }
  if (read.isError) {
    return (
      <AttemptFrame held={null} title="">
        <StMessage
          icon="cloudAlert"
          tone="err"
          alert
          title={stateWords('ST-13.failed')}
          titleId={`${PREFIX}-failed`}
          description={ST_STATE_WORDS.failedLine}
          retry={{ label: ST_STATE_WORDS.tryAgain, onRetry: () => void read.refetch() }}
        />
      </AttemptFrame>
    );
  }
  return (
    <AttemptFrame held={null} title="">
      <StLoading variant="card" label={stateWords('ST-13.loading')} />
    </AttemptFrame>
  );
}

/**
 * The focused frame (ST-v1 `is.att`): its own V3 root with the skip link, the bar (`st-focusbar`:
 * the way out to Before you start, named by the assessment; the save state while the questions are
 * on show; the avatar) and `main.st-focuspage#main`.
 */
function AttemptFrame({
  held,
  save,
  title,
  overlay,
  children,
}: {
  readonly held: Held | null;
  /** The save state, while the questions are on show. */
  readonly save?: { readonly status: SaveStatus; readonly onRetry?: () => void };
  readonly title: string;
  /** The DL-1 dialog: inside `main`, after the content. */
  readonly overlay?: ReactNode;
  readonly children: ReactNode;
}) {
  const person = useShellPerson();
  return (
    <StAttemptFrame
      skipLabel={ATTEMPT_V3.skip}
      mainId={MAIN_ID}
      initials={person.initials}
      exit={
        held ? { href: studentAssessmentAddress(held.assessmentId), label: held.name } : undefined
      }
      save={save ? <SaveState status={save.status} onRetry={save.onRetry} /> : undefined}
      overlay={overlay}
    >
      <DocumentTitle title={title} />
      {children}
    </StAttemptFrame>
  );
}

const SAVE_WORDS: Readonly<Record<SaveStatus, string>> = {
  idle: ATTEMPT_PAGE.saveIdle,
  saving: ATTEMPT_PAGE.saving,
  saved: ATTEMPT_PAGE.saved,
  failed: ATTEMPT_PAGE.saveFailed,
};

/** The bar's save state ("Answers save automatically", "Saving…", "All answers saved", f2). */
function SaveState({
  status,
  onRetry,
}: {
  readonly status: SaveStatus;
  readonly onRetry: (() => void) | undefined;
}) {
  return (
    <StAttemptSave
      state={status}
      words={SAVE_WORDS[status]}
      retryLabel={ATTEMPT_PAGE.tryAgain}
      onRetry={onRetry}
    />
  );
}

/** The attempt's head (`div.sv-focushead`): experiment · attempt, the name, its facts. */
function AttemptHead({ held }: { readonly held: Held }) {
  const { sheet } = held;
  return (
    <StAttemptHead
      experiment={held.experimentName}
      attempt={attemptOfWords(sheet.attemptNumber, sheet.attemptsAllowed)}
      title={held.name}
      meta={attemptMetaLine(sheet.questions.length, sheet.totalMarks, sheet.deadline)}
    />
  );
}

/** "Answers submitted" (`section.sv-card.sv-act-card#Ta-done`, focused when it shows). */
function SubmittedMessage({
  held,
  submittedAt,
  facts,
}: {
  readonly held: Held;
  readonly submittedAt: string;
  readonly facts: StudentAttemptFacts | null;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const hasWritten = held.sheet.questions.some((question) => question.type === 'written');
  const kind = facts?.result.kind;
  return (
    <StAttemptDone
      id={`${PREFIX}-done`}
      titleId={titleId}
      cardRef={ref}
      status={
        kind && kind !== 'in-progress'
          ? statusOf(kind)
          : { tone: STATE_TONE['waiting-for-marking'], words: ATTEMPT_V3.waiting }
      }
      title={ATTEMPT_PAGE.submittedTitle}
      text={submittedLine(submittedAt, hasWritten, facts?.release ?? null)}
      actions={
        <>
          <ButtonLink
            variant="primary"
            size="lg"
            href={studentAssessmentAddress(held.assessmentId, 'result')}
          >
            {ATTEMPT_PAGE.seeResultPage}
          </ButtonLink>
          <ButtonLink size="lg" href={hubAssessmentAddress(held.experimentId)}>
            {ATTEMPT_PAGE.backToExperiment}
          </ButtonLink>
        </>
      }
    />
  );
}

function AttemptForm({
  held,
  reread,
  onSubmitted,
  onGone,
}: {
  readonly held: Held;
  readonly reread: () => Promise<number | null>;
  readonly onSubmitted: (submitted: Submitted) => void;
  readonly onGone: () => void;
}) {
  const navigation = useAppNavigation();
  const { sheet } = held;
  const [lost, setLost] = useState(false);
  const saver = useAnswerSaver(sheet, reread, (kind) => {
    // A save refused for good: submitted elsewhere → Before you start; not the Student's or gone
    // → not found; a question no longer in the attempt → the failure bar (nothing re-sent).
    if (kind === 'invalid-state') onGone();
    else if (kind === 'not-found' || kind === 'not-permitted') setLost(true);
  });
  const submit = useCommand((ports) => ports.assessments.submitAttempt);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState(0);
  const failedRef = useRef<HTMLDivElement>(null);

  // "Your answers weren’t submitted" takes focus each time it shows (B4-12 `focus(pid + '-suberr')`).
  useEffect(() => {
    if (failures > 0) failedRef.current?.focus();
  }, [failures]);

  if (lost) return navigation.notFound();

  const questions = sheet.questions;
  const answered = questions.filter((question) => isAnswered(saver.answers[question.questionId]));
  const missing = questions
    .filter((question) => !isAnswered(saver.answers[question.questionId]))
    .map((question) => question.number);

  const focusQuestion = (number: number) => {
    document.getElementById(`${PREFIX}-q${number}`)?.focus();
  };

  const failed = () => {
    setBusy(false);
    setDialogOpen(false);
    setFailures((count) => count + 1);
  };

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    const saved = await saver.settle();
    if (!saved) {
      failed();
      return;
    }
    try {
      const result = await submit.run({
        attemptId: sheet.attemptId,
        expectedRev: saver.revision(),
      });
      if (result.ok) {
        onSubmitted({
          attemptId: result.value.id,
          submittedAt: result.value.submittedAt ?? result.value.updatedAt,
        });
        return;
      }
      if (result.error.kind === 'not-found' || result.error.kind === 'not-permitted') {
        setLost(true);
        return;
      }
      if (result.error.kind === 'invalid-state') {
        onGone();
        return;
      }
      if (result.error.kind === 'stale-version') {
        const fresh = await reread();
        if (fresh !== null) saver.adopt(fresh);
      }
      failed();
    } catch {
      failed();
    }
  };

  return (
    <AttemptFrame
      held={held}
      save={{ status: saver.status, onRetry: saver.retry }}
      title={attemptDocumentTitle(held.name, false)}
      overlay={
        <ConfirmDialog
          open={dialogOpen}
          idPrefix={`${PREFIX}-s`}
          title={ATTEMPT_PAGE.dialogTitle}
          description={ATTEMPT_PAGE.dialogEffect}
          cancelLabel={ATTEMPT_PAGE.keepAnswering}
          confirmLabel={ATTEMPT_PAGE.submitAnswers}
          busyLabel={ATTEMPT_PAGE.submitting}
          busy={busy}
          onConfirm={() => void confirm()}
          onCancel={() => {
            if (!busy) setDialogOpen(false);
          }}
        >
          {missing.length > 0 ? (
            <StAttemptPending>{pendingWords(missing)}</StAttemptPending>
          ) : (
            <StAttemptAllAnswered>{allAnsweredWords(questions.length)}</StAttemptAllAnswered>
          )}
        </ConfirmDialog>
      }
    >
      <AttemptHead held={held} />
      <StAttemptLayout
        questionsLabel={ATTEMPT_V3.questionsLabel}
        questions={questions.map((question) => (
          <StAttemptQuestion
            key={question.questionId}
            id={`${PREFIX}-q${question.number}`}
            headingId={`${PREFIX}-q${question.number}-h`}
            number={question.number}
            done={isAnswered(saver.answers[question.questionId])}
            label={questionLabel(question.number, questions.length, question.type)}
            marks={questionMarks(question.marks)}
          >
            <QuestionAnswer question={question} saver={saver} />
          </StAttemptQuestion>
        ))}
        side={
          <>
            <StAttemptStrip
              title={ATTEMPT_PAGE.stripLabel}
              titleId={`${PREFIX}-strip-h`}
              count={answeredCountWords(answered.length, questions.length)}
              items={questions.map((question) => {
                const done = isAnswered(saver.answers[question.questionId]);
                return {
                  number: question.number,
                  targetId: `${PREFIX}-q${question.number}`,
                  done,
                  label: stripLinkLabel(question.number, done),
                };
              })}
              next={
                missing.length > 0
                  ? { label: ATTEMPT_PAGE.nextUnanswered, onNext: () => focusQuestion(missing[0]!) }
                  : undefined
              }
            />
            <StAttemptSubmit
              titleId={`${PREFIX}-sub-h`}
              title={ATTEMPT_V3.submitTitle}
              failure={
                failures > 0
                  ? {
                      id: `${PREFIX}-suberr`,
                      ref: failedRef,
                      title: ATTEMPT_PAGE.submitFailedTitle,
                      line: ATTEMPT_PAGE.submitFailedLine,
                    }
                  : undefined
              }
              note={ATTEMPT_PAGE.footNote}
              submitLabel={ATTEMPT_PAGE.submit}
              onSubmit={() => setDialogOpen(true)}
            />
          </>
        }
      />
    </AttemptFrame>
  );
}

type SheetQuestion = AttemptSheet['questions'][number];

/** A question's answer: the choices (`fieldset.st-qfs`, radios) or the written field. */
function QuestionAnswer({
  question,
  saver,
}: {
  readonly question: SheetQuestion;
  readonly saver: AnswerSaver;
}) {
  const value: AnswerValue | undefined = saver.answers[question.questionId];
  const name = `${PREFIX}-q${question.number}`;
  if (question.type === 'written') {
    return (
      <StAttemptWritten
        id={`${PREFIX}-t${question.number}`}
        label={question.text}
        hint={ATTEMPT_PAGE.writtenHint}
        value={value?.type === 'written' ? value.text : ''}
        onChange={(event) => saver.write(question.questionId, event.target.value)}
        onBlur={() => saver.leave(question.questionId)}
      />
    );
  }
  const options: readonly {
    readonly key: string;
    readonly label: string;
    readonly value: AnswerValue;
  }[] =
    question.type === 'true-false'
      ? [
          { key: 'true', label: ATTEMPT_PAGE.true, value: { type: 'true-false', value: true } },
          { key: 'false', label: ATTEMPT_PAGE.false, value: { type: 'true-false', value: false } },
        ]
      : CHOICE_ORDER.flatMap((key) => {
          const label = question.options?.[key];
          return label
            ? [{ key, label, value: { type: 'multiple-choice', choice: key } as AnswerValue }]
            : [];
        });
  const checked = (option: AnswerValue): boolean => {
    if (!value) return false;
    if (value.type === 'multiple-choice' && option.type === 'multiple-choice')
      return value.choice === option.choice;
    if (value.type === 'true-false' && option.type === 'true-false')
      return value.value === option.value;
    return false;
  };
  const idOf = (key: string) => `${name}-${key}`;
  return (
    <StAttemptChoices
      legend={question.text}
      name={name}
      options={options.map((option) => ({
        id: idOf(option.key),
        label: option.label,
        checked: checked(option.value),
      }))}
      onChoose={(id) => {
        const option = options.find((entry) => idOf(entry.key) === id);
        if (option) saver.choose(question.questionId, option.value);
      }}
    />
  );
}
