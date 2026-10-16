'use client';

import type { AttemptForMarking, ServiceError } from '@xr/contracts/draft';
import type { Attempt, QuestionId } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  DecisionPanel,
  Field,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Skeleton,
  StatusPill,
  Textarea,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { marksWords } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { FACULTY_FAILED_WORDS } from '@/copy/faculty-overview';
import { firstName } from '@/copy/institute-people';
import {
  answerTitle,
  automaticMarksWords,
  confirmedByLine,
  confirmEffect,
  confirmMarkLead,
  confirmTitle,
  feedbackLabel,
  MARK_SUBMISSION,
  markHint,
  markLabel,
  markOfWords,
  questionNumberWords,
  releaseLine,
  type ReleaseTerms,
  submissionOverline,
  submittedLine,
  writtenQuestionTitle,
} from '@/copy/marking';
import { stateWords } from '@/copy/state-copy';
import {
  MARKING_ADDRESS,
  MARKING_TITLE,
  markingQueueAddress,
  markSubmissionAddress,
  markSubmissionPlacement,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import {
  useAttemptForMarking,
  useMarkingQueue,
  useSubmissions,
} from '@/queries/faculty-assessment-work';
import { formFieldErrors } from '@/queries/faculty-forms';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/** The board’s id prefix (`Mm-mk`, `Mm-fb`, `Mm-mdone`, `Mm-ct` …; B4-09 f1). */
const PREFIX = 'ms';
const MARK_ID = `${PREFIX}-mk`;
const DONE_ID = `${PREFIX}-mdone`;

/** The calm provisional states where no form is drawn (policy-open). */
export type Blocked = 'colleague' | 'several' | 'none' | 'choice';

/** A policy-open decision as the state it shows (`confirmMarks`, `getAttemptForMarking`). */
export function blockedOf(decision: string): Blocked {
  if (decision === 'ATT-17') return 'several';
  if (decision.startsWith('M22')) return 'none';
  if (decision === 'ATT-07') return 'choice';
  return 'colleague';
}

/** The submission’s facts as the page draws them, from `getAttemptForMarking`. */
export interface MarkingView {
  /** The written questions by number, in order. */
  readonly written: readonly {
    readonly questionId: QuestionId;
    readonly number: number;
    readonly marks: number;
  }[];
  /** The choice questions by number, with their marks (`null`: not marked). */
  readonly choice: readonly {
    readonly questionId: QuestionId;
    readonly number: number;
    readonly marks: number;
    readonly awarded: number | null;
  }[];
  /** What blocks the form before anything is sent, if anything (several, none, choice). */
  readonly blocked: Blocked | null;
}

export function markingView(answer: AttemptForMarking): MarkingView {
  const automatic = answer.attempt.marking.automatic;
  const written = answer.numbering
    .filter((entry) => entry.type === 'written')
    .map((entry) => ({ questionId: entry.questionId, number: entry.number, marks: entry.marks }));
  const choice = answer.numbering
    .filter((entry) => entry.type !== 'written')
    .map((entry) => ({
      questionId: entry.questionId,
      number: entry.number,
      marks: entry.marks,
      awarded: automatic.find((mark) => mark.questionId === entry.questionId)?.awarded ?? null,
    }));
  const blocked: Blocked | null =
    written.length === 0
      ? 'none'
      : written.length > 1
        ? 'several'
        : choice.some((entry) => entry.awarded === null)
          ? 'choice'
          : null;
  return { written, choice, blocked };
}

/** The pinned release terms in words (`on`: the deadline or the release date). */
function termsOf(answer: AttemptForMarking): ReleaseTerms {
  return {
    option: answer.release.option,
    on: answer.release.on ? dateTime(answer.release.on) : null,
  };
}

/**
 * FA-19 Mark a submission — board B4-09 f1 … f3, f7, f8, at `/faculty/marking/[attemptId]`.
 *
 * - **Read**: `MarkingService.getAttemptForMarking` — the submitted attempt, its written question
 *   as its version pins it (with the marking guidance, Faculty only), the choice questions’ marks,
 *   the numbering, the attempts allowed and the pinned release terms. Once confirmed, the
 *   assessment’s submissions (`listSubmissions`) say whether the result was released.
 * - **As B4-09 draws it** (AR-4, ~72 / 28 from 860 px of content, the panel under the content
 *   below): the back link “Marking”, the overline “<assessment> · <experiment>”, the Student as the
 *   H1, the attempt id and “Submitted … · attempt 1 of 2”; the question card, “<Student>’s answer”,
 *   the marking guidance (open, collapsible), “Marked automatically” with each choice question’s
 *   marks; the “Your mark” panel: the mark (out of the question’s marks, a whole number), optional
 *   feedback, “Confirm marks” (DL-1, then read-only) and “Save mark” (“Mark saved — not confirmed
 *   yet”). Confirmed (f2): “Marks confirmed”, when and by whom, the mark, the feedback, when the
 *   Student sees the result (by the assessment’s own setting — no release control) and “Next
 *   submission”.
 * - **Checks are the service’s**: Save sends `saveMark` as typed; its drawn words (“Enter a whole
 *   number from 0 to 10”, f3) show under the field, which takes focus. Confirm saves what is typed
 *   first if it is not saved yet (state-copy `FA-19.confirm-saves-first`), then DL-1 → `confirmMarks`.
 * - **Provisional states** (policy-open: a colleague’s assessment, several written questions, no
 *   written question, choice questions without marks) show a calm state and no form.
 */
export function MarkSubmission({ attemptId }: { readonly attemptId: string }) {
  const navigation = useAppNavigation();
  const read = useAttemptForMarking(attemptId);
  const answer = read.data?.ok ? read.data.value : null;
  // The top bar reads “Mark a submission” below 1024 px; the crumbs “Marking / <Student>” (f1).
  useShellPage({
    ...markSubmissionPlacement(answer ? answer.student.fullName : null),
    title: MARK_SUBMISSION.title,
  });

  if (read.data && !read.data.ok) {
    const kind = read.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
    if (kind === 'policy-open') {
      return (
        <BarePage>
          <CalmState blocked="colleague" count={0} />
        </BarePage>
      );
    }
  }
  if (read.isError || (read.data !== undefined && !read.data.ok)) {
    return (
      <BarePage>
        <LoadFailed onRetry={() => void read.refetch()} />
      </BarePage>
    );
  }
  if (answer === null) {
    return (
      <BarePage>
        <LoadingState
          label={stateWords('FA-19.loading')}
          surface="section"
          skeleton={
            <div aria-hidden="true" className="flex flex-col gap-4 p-6">
              <Skeleton className="w-[240px]" />
              <Skeleton />
              <Skeleton />
            </div>
          }
        />
      </BarePage>
    );
  }
  return <Submission key={answer.attempt.id} answer={answer} onReread={() => read.refetch()} />;
}

/** The page before the submission is read (or when it can’t be shown): back link and heading. */
function BarePage({ children }: { readonly children: ReactNode }) {
  return (
    <PageContent wrap="wide">
      <PageHeader
        className="[margin:8px_0_20px]"
        back={<BackLink href={MARKING_ADDRESS}>{MARKING_TITLE}</BackLink>}
        title={MARK_SUBMISSION.title}
      />
      {children}
    </PageContent>
  );
}

type PanelMessage =
  | { readonly kind: 'stale' }
  | { readonly kind: 'already-confirmed' }
  | { readonly kind: 'unavailable-save' };

interface Draft {
  readonly mark: string;
  readonly feedback: string;
}

function savedDraftOf(attempt: Attempt, questionId: string | undefined): Draft | null {
  const saved = attempt.marking.written.find((entry) => entry.questionId === questionId);
  if (!saved || saved.mark === null) return null;
  return { mark: String(saved.mark), feedback: saved.feedback ?? '' };
}

function Submission({
  answer,
  onReread,
}: {
  readonly answer: AttemptForMarking;
  readonly onReread: () => Promise<unknown>;
}) {
  const navigation = useAppNavigation();
  const { attempt, student } = answer;
  const view = markingView(answer);
  const written = view.written[0];
  const question = answer.questions.find((entry) => entry.id === written?.questionId) ?? null;
  const first = firstName(student.fullName);
  const terms = termsOf(answer);
  const confirmed = attempt.marking.confirmed;
  const saved = savedDraftOf(attempt, written?.questionId);

  const saveCmd = useCommand((ports) => ports.marking.saveMark);
  const confirmCmd = useCommand((ports) => ports.marking.confirmMarks);
  const queue = useMarkingQueue(null, 'waiting');
  const submissions = useSubmissions(attempt.assessmentId, confirmed !== null);

  const [draft, setDraft] = useState<Draft>(() => saved ?? { mark: '', feedback: '' });
  const [markError, setMarkError] = useState<string | null>(null);
  const [notice, setNotice] = useState<PanelMessage | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [dialog, setDialog] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [gone, setGone] = useState(false);
  const [focusMark, setFocusMark] = useState(0);
  const pendingDoneFocus = useRef(false);
  const markRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusMark > 0) markRef.current?.focus();
  }, [focusMark]);
  // Once confirmed, focus moves to the read-only panel (B4-09 `focus(pid + '-mdone')`) — after the
  // submission is read again, so the panel is there.
  const isConfirmed = attempt.marking.confirmed !== null;
  useEffect(() => {
    if (!pendingDoneFocus.current || !isConfirmed) return;
    pendingDoneFocus.current = false;
    doneRef.current?.focus();
  });

  if (gone) return navigation.notFound();

  const shownBlocked = blocked ?? view.blocked;
  const isSaved =
    saved !== null &&
    draft.mark.trim() === saved.mark &&
    draft.feedback.trim() === saved.feedback.trim();

  const change = (field: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'mark') setMarkError(null);
    setNotice(null);
  };

  /** A refusal of save or confirm, as the page shows it. */
  const refused = (error: ServiceError) => {
    switch (error.kind) {
      case 'validation-failed': {
        const errors = formFieldErrors(error, (path) => (path === 'mark' ? 'mark' : null));
        setMarkError(errors[0]?.message ?? null);
        setFocusMark((current) => current + 1);
        return;
      }
      case 'not-found':
      case 'not-permitted':
        setGone(true);
        return;
      case 'policy-open':
        setBlocked(blockedOf(error.decision));
        return;
      case 'refused':
        void onReread();
        setNotice({ kind: 'already-confirmed' });
        return;
      default:
        // Stale (or moved on in another way): read the submission again; the typed values stay.
        void onReread();
        setNotice({ kind: 'stale' });
    }
  };

  /** `saveMark` with what is typed; the saved attempt, or `null` when it was refused or failed. */
  const saveTyped = async (): Promise<Attempt | null> => {
    if (!written) return null;
    try {
      const result = await saveCmd.run({
        attemptId: attempt.id,
        questionId: written.questionId,
        mark: draft.mark,
        feedback: draft.feedback.trim() === '' ? null : draft.feedback,
        expectedRev: attempt.rev,
      });
      if (!result.ok) {
        refused(result.error);
        return null;
      }
      setMarkError(null);
      setNotice(null);
      return result.value;
    } catch {
      setNotice({ kind: 'unavailable-save' });
      return null;
    }
  };

  const save = () => {
    if (saveCmd.busy || preparing) return;
    void saveTyped();
  };

  // B4-09 `confirm`: the typed mark is checked (saved) before DL-1 opens (f3).
  const confirm = async () => {
    if (saveCmd.busy || preparing || confirmCmd.busy) return;
    if (!isSaved) {
      setPreparing(true);
      const result = await saveTyped();
      setPreparing(false);
      if (!result) return;
    }
    setConfirmFailed(false);
    setDialog(true);
  };

  const doConfirm = () => {
    if (confirmCmd.busy) return;
    setConfirmFailed(false);
    confirmCmd.run({ attemptId: attempt.id, expectedRev: attempt.rev }).then(
      (result) => {
        setDialog(false);
        if (!result.ok) {
          refused(result.error);
          return;
        }
        setNotice(null);
        pendingDoneFocus.current = true;
      },
      // Failed for now: the dialog stays open and says so (`FA-19.unavailable.confirm`).
      () => setConfirmFailed(true),
    );
  };

  // “Next submission”: the oldest waiting answer other than this one, else the queue (FA-19.next).
  const waiting = queue.data?.ok ? queue.data.value : [];
  const nextRow = waiting.find((row) => row.attempt.id !== attempt.id) ?? null;
  const nextHref = nextRow ? markSubmissionAddress(nextRow.attempt.id) : markingQueueAddress();
  const releasedAt = submissions.data?.ok
    ? (submissions.data.value.find((row) => row.attempt.id === attempt.id)?.releasedAt ?? null)
    : null;

  const writtenMark = attempt.marking.written.find(
    (entry) => entry.questionId === written?.questionId,
  );
  const answerValue = written ? attempt.answers[written.questionId] : undefined;
  const answerText =
    answerValue?.type === 'written' && answerValue.text.trim() !== ''
      ? answerValue.text
      : stateWords('FA-19.no-answer');
  const guidance = question?.body.type === 'written' ? question.body.markingGuidance : null;
  const autoAwarded = view.choice.reduce((sum, entry) => sum + (entry.awarded ?? 0), 0);
  const autoOutOf = view.choice
    .filter((entry) => entry.awarded !== null)
    .reduce((sum, entry) => sum + entry.marks, 0);
  const confirmedBy = confirmed && confirmed.by.kind === 'person' ? confirmed.by.displayName : '';

  let panel: ReactNode;
  if (confirmed) {
    panel = (
      <div id={DONE_ID} ref={doneRef} tabIndex={-1} className="flex flex-col gap-3">
        {notice?.kind === 'already-confirmed' ? (
          <Notice tone="info" role="status">
            {stateWords('FA-19.already-confirmed')}
          </Notice>
        ) : null}
        {/* B4-09 f2 draws the pill across the panel (the board loads no xr-admin.css, whose
            `.xr-dpanel .xr-status{align-self:flex-start}` the product carries). */}
        <StatusPill tone="ok" className="self-stretch">
          {MARK_SUBMISSION.confirmed}
        </StatusPill>
        <span className="xl-meta">{confirmedByLine(dateTime(confirmed.at), confirmedBy)}</span>
        <dl className="xl-kv [grid-template-columns:96px_minmax(0,1fr)] text-[15px]">
          <dt>{MARK_SUBMISSION.markKey}</dt>
          <dd>
            {typeof writtenMark?.mark === 'number' && written
              ? markOfWords(writtenMark.mark, written.marks)
              : ''}
          </dd>
          <dt>{MARK_SUBMISSION.feedbackKey}</dt>
          <dd>{writtenMark?.feedback?.trim() || MARK_SUBMISSION.noFeedback}</dd>
        </dl>
        <p className="xl-meta m-0">
          {releaseLine(first, terms, releasedAt ? dateTime(releasedAt) : null)}
        </p>
        <Link className="xr-btn xr-btn--secondary xr-btn--block" href={nextHref}>
          {MARK_SUBMISSION.next}
        </Link>
      </div>
    );
  } else if (shownBlocked !== null || !written) {
    panel = <CalmState blocked={shownBlocked ?? 'none'} count={view.written.length} inPanel />;
  } else {
    panel = (
      <>
        {notice ? <PanelNotice notice={notice} /> : null}
        <Field
          id={MARK_ID}
          label={markLabel(written.number)}
          hint={markHint(written.marks)}
          error={markError ?? undefined}
        >
          <TextInput
            ref={markRef}
            className="max-w-[140px]"
            inputMode="numeric"
            autoComplete="off"
            value={draft.mark}
            onChange={(event) => change('mark', event.target.value)}
          />
        </Field>
        <Field id={`${PREFIX}-fb`} label={feedbackLabel(first)} marker={MARK_SUBMISSION.optional}>
          <Textarea
            className="min-h-[140px]"
            value={draft.feedback}
            onChange={(event) => change('feedback', event.target.value)}
          />
        </Field>
        {isSaved ? (
          <p className="xa-save is-ok m-0" role="status">
            <Icon name="done" />
            {MARK_SUBMISSION.saved}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            block
            busy={preparing}
            busyLabel={stateWords('FA-19.saving')}
            onClick={() => void confirm()}
          >
            {MARK_SUBMISSION.confirm}
          </Button>
          <Button
            variant="secondary"
            block
            busy={saveCmd.busy && !preparing}
            busyLabel={stateWords('FA-19.saving')}
            onClick={save}
          >
            {MARK_SUBMISSION.save}
          </Button>
        </div>
        <p className="xl-meta m-0">{MARK_SUBMISSION.cantChange}</p>
      </>
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="[margin:8px_0_20px]"
        back={<BackLink href={MARKING_ADDRESS}>{MARKING_TITLE}</BackLink>}
        overline={submissionOverline(answer.assessmentName, answer.experimentName)}
        title={student.fullName}
        meta={
          <>
            <span className="xr-id">{attempt.id}</span>
            <span className="xl-meta">
              {submittedLine(
                attempt.submittedAt ? dateTime(attempt.submittedAt) : '',
                attempt.attemptNumber,
                answer.attemptsAllowed,
              )}
            </span>
          </>
        }
      />
      <div className="xr-decide">
        <div className="xw-stack">
          {written && question ? (
            <>
              <section className="xr-section" aria-labelledby={`${PREFIX}-qh`}>
                <div className="xr-section-head">
                  <h2 id={`${PREFIX}-qh`} className="xr-h2">
                    {writtenQuestionTitle(written.number)}
                  </h2>
                  <span className="xr-meta">{marksWords(written.marks)}</span>
                </div>
                <div className="xr-section-body">
                  <p className="xa-q-text m-0">{question.text}</p>
                </div>
              </section>
              <section className="xr-section" aria-labelledby={`${PREFIX}-ah`}>
                <div className="xr-section-head">
                  <h2 id={`${PREFIX}-ah`} className="xr-h2">
                    {answerTitle(student.fullName)}
                  </h2>
                </div>
                <div className="xr-section-body">
                  <blockquote className="xa-answer">{answerText}</blockquote>
                </div>
              </section>
              {guidance ? (
                <details className="xa-guide" open>
                  <summary>
                    {MARK_SUBMISSION.guidance}
                    <Icon name="chevronDown" />
                  </summary>
                  <div className="xa-guide-body">{guidance}</div>
                </details>
              ) : null}
            </>
          ) : null}
          {view.choice.length > 0 ? (
            <section className="xr-section" aria-labelledby={`${PREFIX}-auh`}>
              <div className="xr-section-head">
                <h2 id={`${PREFIX}-auh`} className="xr-h2">
                  {MARK_SUBMISSION.automatic}
                </h2>
                <span className="xr-meta">{automaticMarksWords(autoAwarded, autoOutOf)}</span>
              </div>
              <ul className="xa-counts [margin:0_24px_24px]">
                {view.choice.map((entry) => (
                  <li key={entry.questionId}>
                    <span className="[flex:1_1_auto]">{questionNumberWords(entry.number)}</span>
                    {entry.awarded === null ? (
                      <span className="xa-mk is-wait">
                        <Icon name="waiting" />
                        {stateWords('FA-19.choice-not-marked')}
                      </span>
                    ) : entry.awarded >= entry.marks ? (
                      <span className="xa-mk is-ok">
                        <Icon name="done" />
                        {markOfWords(entry.awarded, entry.marks)}
                      </span>
                    ) : (
                      <span className="xa-mk is-no">
                        <Icon name="close" />
                        {markOfWords(entry.awarded, entry.marks)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <DecisionPanel id={`${PREFIX}-panel`} title={MARK_SUBMISSION.panelTitle}>
          {panel}
        </DecisionPanel>
      </div>
      {written ? (
        <ConfirmDialog
          open={dialog}
          idPrefix={`${PREFIX}-c`}
          align="marks"
          title={confirmTitle(student.fullName)}
          effect={
            <>
              {confirmMarkLead(written.number)}
              <strong>{markOfWords(Number(draft.mark.trim()), written.marks)}</strong>.
            </>
          }
          notice={
            <>
              <p className="m-0">{confirmEffect(first, terms)}</p>
              {confirmFailed ? (
                <Notice tone="err" role="alert">
                  {stateWords('FA-19.unavailable.confirm')}
                </Notice>
              ) : null}
            </>
          }
          cancelLabel={MARK_SUBMISSION.cancel}
          confirmLabel={MARK_SUBMISSION.confirm}
          busy={confirmCmd.busy}
          busyLabel={MARK_SUBMISSION.confirming}
          onConfirm={doConfirm}
          onCancel={() => {
            setDialog(false);
            setConfirmFailed(false);
          }}
          returnFocusFallback={doneRef}
        />
      ) : null}
    </PageContent>
  );
}

/** The panel’s answer to a refused or failed save or confirm (state-copy `FA-19.stale.*` …). */
function PanelNotice({ notice }: { readonly notice: PanelMessage }) {
  switch (notice.kind) {
    case 'stale':
      return (
        <Notice tone="warn" role="alert" title={stateWords('FA-19.stale.title')}>
          {stateWords('FA-19.stale.line')}
        </Notice>
      );
    case 'already-confirmed':
      return (
        <Notice tone="info" role="status">
          {stateWords('FA-19.already-confirmed')}
        </Notice>
      );
    case 'unavailable-save':
      return (
        <Notice tone="err" role="alert">
          {stateWords('FA-19.unavailable.save')}
        </Notice>
      );
  }
}

const CALM_WORDS = {
  colleague: ['FA-19.policy-open.colleague.title', 'FA-19.policy-open.colleague.line'],
  several: ['FA-19.policy-open.several.title', 'FA-19.policy-open.several.line'],
  none: ['FA-19.policy-open.none.title', 'FA-19.policy-open.none.line'],
  choice: ['FA-19.policy-open.choice.title', 'FA-19.policy-open.choice.line'],
} as const;

/** A calm provisional state (policy-open): no answer, no mark, no form. */
function CalmState({
  blocked,
  count,
  inPanel = false,
}: {
  readonly blocked: Blocked;
  readonly count: number;
  readonly inPanel?: boolean;
}) {
  const [title, line] = CALM_WORDS[blocked];
  const words = stateWords(line).replace('{n}', String(count));
  if (inPanel) {
    return (
      <Notice tone="quiet" title={stateWords(title)} role="status">
        {words}
      </Notice>
    );
  }
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="info" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords(title)}</h2>
        <p className="xr-body m-0 text-ink-2">{words}</p>
      </div>
    </div>
  );
}

/** Undrawn: failed + Try again (`FA-19.failed`), B4-02 f5’s formula. */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords('FA-19.failed')}</h2>
        <p className="xr-body m-0 text-ink-2">{FACULTY_FAILED_WORDS.line}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {FACULTY_FAILED_WORDS.tryAgain}
          </Button>
        </div>
      </div>
    </div>
  );
}
