'use client';

import type {
  AssessmentIntro as IntroAnswer,
  AttemptSheet,
  PinnedRelease,
} from '@xr/contracts/draft';
import { type AnswerValue, type ChoiceKey, ROLE_LABEL } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageHeader,
  SkipLink,
} from '@xr/ui';
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import {
  answeredCountWords,
  ATTEMPT_PAGE,
  attemptDocumentTitle,
  attemptMetaLine,
  attemptOverline,
  questionLabel,
  questionMarks,
  stripLinkLabel,
  submittedLine,
  unansweredWords,
} from '@/copy/attempt';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import { experimentAddress, studentAssessmentAddress } from '@/nav/student-assessments';
import { useAssessmentIntro } from '@/queries/student-assessments';
import { useCommand } from '@/queries/use-command';

import { DocumentTitle } from '../../shared/document-title';
import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPerson, useWorkspaceIdentity } from '../../shared/workspace-frame/shell-page';
import { StudentFailed } from '../shared/student-states';
import { notAvailableKind } from '../shared/student-view';
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
      <AttemptFrame held={held} status="idle" title={attemptDocumentTitle(held.name, true)}>
        <SubmittedMessage
          held={held}
          submittedAt={submitted.submittedAt}
          release={facts?.release ?? null}
        />
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
      <AttemptFrame held={null} status="idle" title="">
        <StudentFailed title={stateWords('ST-13.failed')} onRetry={() => void read.refetch()} />
      </AttemptFrame>
    );
  }
  return (
    <AttemptFrame held={null} status="idle" title="">
      <LoadingState label={stateWords('ST-13.loading')} surface="section" />
    </AttemptFrame>
  );
}

/**
 * The focused frame (B4-12 f0): `div.xr-app` with the skip link, `header.xa-bar` (the way out,
 * the save state, the avatar) and `main.xr-page` holding `div.xr-wrap--form.xr-content`.
 */
function AttemptFrame({
  held,
  status,
  onRetry,
  title,
  overlay,
  children,
}: {
  readonly held: Held | null;
  readonly status: SaveStatus;
  readonly onRetry?: () => void;
  readonly title: string;
  /** The DL-1 dialog: inside `main`, after the content (the board's scrim). */
  readonly overlay?: ReactNode;
  readonly children: ReactNode;
}) {
  const person = useShellPerson();
  const identity = useWorkspaceIdentity();
  return (
    <div className="xr-app">
      <SkipLink targetId={MAIN_ID} />
      <DocumentTitle title={title} />
      <header className="xa-bar">
        {held ? (
          <BackLink href={experimentAddress(held.experimentId)}>{held.experimentName}</BackLink>
        ) : (
          <span />
        )}
        <div className="xa-bar-end">
          <SaveState status={status} onRetry={onRetry} />
          <span
            className="xr-avatar"
            role="img"
            aria-label={`${person.name}, ${ROLE_LABEL[identity.role]}`}
          >
            {person.initials}
          </span>
        </div>
      </header>
      <main className="xr-page [padding-top:28px]" id={MAIN_ID} tabIndex={-1}>
        <div className="xr-wrap--form xr-content">{children}</div>
        {overlay}
      </main>
    </div>
  );
}

/** The bar's save state (B4-12 f0 idle, "Saving…", f3 saved, f2 failed with Try again). */
function SaveState({
  status,
  onRetry,
}: {
  readonly status: SaveStatus;
  readonly onRetry: (() => void) | undefined;
}) {
  switch (status) {
    case 'idle':
      return (
        <span className="xa-save">
          <Icon name="done" />
          {ATTEMPT_PAGE.saveIdle}
        </span>
      );
    case 'saving':
      return (
        <span className="xa-save" role="status">
          <span className="xr-spin" aria-hidden="true" />
          {ATTEMPT_PAGE.saving}
        </span>
      );
    case 'saved':
      return (
        <span className="xa-save is-ok" role="status">
          <Icon name="done" />
          {ATTEMPT_PAGE.saved}
        </span>
      );
    case 'failed':
      return (
        <span className="xa-save is-err" role="alert">
          <Icon name="failed" />
          {ATTEMPT_PAGE.saveFailed}
          <button type="button" className="xr-btn xr-btn--text min-h-8" onClick={onRetry}>
            {ATTEMPT_PAGE.tryAgain}
          </button>
        </span>
      );
  }
}

/** f4 "Answers submitted" (`div.xr-msg#Ta-done`, focused when it shows). */
function SubmittedMessage({
  held,
  submittedAt,
  release,
}: {
  readonly held: Held;
  readonly submittedAt: string;
  readonly release: PinnedRelease | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const hasWritten = held.sheet.questions.some((question) => question.type === 'written');
  return (
    <div
      ref={ref}
      className="xr-msg [margin:24px_0] [text-align:left]"
      id={`${PREFIX}-done`}
      tabIndex={-1}
    >
      <span className="xr-msg-icon xr-x-msg-icon--ok">
        <Icon name="done" />
      </span>
      <h1 className="xr-msg-title">{ATTEMPT_PAGE.submittedTitle}</h1>
      <p className="xr-lead m-0">{submittedLine(submittedAt, hasWritten, release)}</p>
      <div className="xr-msg-actions">
        <Link className="xr-btn xr-btn--primary" href={experimentAddress(held.experimentId)}>
          {ATTEMPT_PAGE.backToExperiment}
        </Link>
        <Link
          className="xr-btn xr-btn--text"
          href={studentAssessmentAddress(held.assessmentId, 'result')}
        >
          {ATTEMPT_PAGE.seeResultPage}
        </Link>
      </div>
    </div>
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
      status={saver.status}
      onRetry={saver.retry}
      title={attemptDocumentTitle(held.name, false)}
      overlay={
        <ConfirmDialog
          open={dialogOpen}
          idPrefix={`${PREFIX}-s`}
          align="end"
          title={ATTEMPT_PAGE.dialogTitle}
          effect={
            missing.length > 0 ? (
              <span className="block [margin:0_0_8px]">
                <strong>{unansweredWords(missing)}</strong> {ATTEMPT_PAGE.stillSubmit}
              </span>
            ) : (
              ATTEMPT_PAGE.dialogEffect
            )
          }
          notice={missing.length > 0 ? <p>{ATTEMPT_PAGE.dialogEffect}</p> : undefined}
          cancelLabel={ATTEMPT_PAGE.keepAnswering}
          confirmLabel={ATTEMPT_PAGE.submitAnswers}
          busyLabel={ATTEMPT_PAGE.submitting}
          busy={busy}
          onConfirm={() => void confirm()}
          onCancel={() => {
            if (!busy) setDialogOpen(false);
          }}
        />
      }
    >
      <PageHeader
        className="[margin:0_0_16px]"
        overline={attemptOverline(held.experimentName, sheet.attemptNumber, sheet.attemptsAllowed)}
        title={held.name}
        meta={
          <span className="xl-meta">
            {attemptMetaLine(questions.length, sheet.totalMarks, sheet.deadline)}
          </span>
        }
      />
      {failures > 0 ? (
        <div id={`${PREFIX}-suberr`} tabIndex={-1} ref={failedRef} className="mb-4">
          <Notice tone="err" title={ATTEMPT_PAGE.submitFailedTitle}>
            {ATTEMPT_PAGE.submitFailedLine}
          </Notice>
        </div>
      ) : null}
      <div className="mb-5">
        <nav className="xa-strip" aria-label={ATTEMPT_PAGE.stripLabel}>
          <span className="xa-strip-text" role="status">
            {answeredCountWords(answered.length, questions.length)}
          </span>
          <ol>
            {questions.map((question) => {
              const done = isAnswered(saver.answers[question.questionId]);
              return (
                <li key={question.questionId}>
                  <a
                    href={`#${PREFIX}-q${question.number}`}
                    className={done ? 'is-done' : undefined}
                    aria-label={stripLinkLabel(question.number, done)}
                    onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                      event.preventDefault();
                      focusQuestion(question.number);
                    }}
                  >
                    {question.number}
                  </a>
                </li>
              );
            })}
          </ol>
          {missing.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => focusQuestion(missing[0]!)}>
              {ATTEMPT_PAGE.nextUnanswered}
            </Button>
          ) : null}
        </nav>
      </div>
      <ol className="xa-qs">
        {questions.map((question) => (
          <li
            key={question.questionId}
            className="xa-q"
            id={`${PREFIX}-q${question.number}`}
            tabIndex={-1}
          >
            <div className="xa-q-head">
              <span className="xa-q-n">
                {questionLabel(question.number, questions.length, question.type)}
              </span>
              <span className="xr-meta">{questionMarks(question.marks)}</span>
            </div>
            <QuestionAnswer question={question} saver={saver} />
          </li>
        ))}
      </ol>
      <div className="xw-flow-foot mt-6">
        <p className="xl-meta m-0 max-w-[440px]">{ATTEMPT_PAGE.footNote}</p>
        <div className="xw-actions">
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            {ATTEMPT_PAGE.submit}
          </Button>
        </div>
      </div>
    </AttemptFrame>
  );
}

type SheetQuestion = AttemptSheet['questions'][number];

/** A question's answer: the choices (`fieldset` of `label.xr-choice`) or the written field. */
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
    const id = `${PREFIX}-t${question.number}`;
    return (
      <div className="xr-field">
        <label className="xa-q-text" htmlFor={id}>
          {question.text}
        </label>
        <span className="xr-hint" id={`${id}-h`}>
          {ATTEMPT_PAGE.writtenHint}
        </span>
        <textarea
          id={id}
          className="xr-textarea"
          aria-describedby={`${id}-h`}
          value={value?.type === 'written' ? value.text : ''}
          onChange={(event) => saver.write(question.questionId, event.target.value)}
          onBlur={() => saver.leave(question.questionId)}
        />
      </div>
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
  return (
    <fieldset className="xr-fieldset">
      <legend className="xa-q-text">{question.text}</legend>
      <div className="xr-choice-list">
        {options.map((option) => {
          const id = `${name}-${option.key}`;
          return (
            <label key={option.key} className="xr-choice" htmlFor={id}>
              <input
                type="radio"
                id={id}
                name={name}
                checked={checked(option.value)}
                onChange={() => saver.choose(question.questionId, option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
