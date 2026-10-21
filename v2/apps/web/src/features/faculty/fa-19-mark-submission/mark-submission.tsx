'use client';

import type { AttemptForMarking, ServiceError } from '@xr/contracts/draft';
import type { Attempt, QuestionId } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ConfirmDialog,
  FaAutoMarks,
  FaDoneTotal,
  FaLiveTotal,
  FaMarkConfirm,
  FaMarkFeedback,
  FaMarkHead,
  FaMarkLayout,
  FaMarkSave,
  FaMarkSection,
  FaMarksDone,
  FaMarksPanel,
  FaReleaseNote,
  FaScoreField,
  FaSheetQuestion,
  ListState,
  LoadingRows,
  MetaSeparator,
  Notice,
  PageHead,
  StatusPill,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { marksWords } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import { FACULTY_FAILED_WORDS } from '@/copy/faculty-overview';
import { firstName } from '@/copy/institute-people';
import {
  answerTitle,
  automaticMarksWords,
  choiceQuestionWords,
  confirmedByLine,
  confirmLaterTitle,
  confirmMarkLine,
  confirmReleasePlan,
  confirmTitle,
  confirmTotalLine,
  doneTotalWords,
  feedbackLabel,
  liveTotalLine,
  liveTotalWords,
  MARK_SUBMISSION,
  markFieldSub,
  markHint,
  markOfWords,
  markOutOf,
  passOutcomeWords,
  queuePositionWords,
  questionNumberWords,
  type ReleaseTerms,
  resultReleaseLine,
  submissionOverline,
  submittedLine,
  totalMarksWords,
  writtenQuestionHead,
} from '@/copy/marking';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  MARKING_ADDRESS,
  MARKING_TITLE,
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
import { useSession } from '@/queries/session';
import { useAssessmentRecord } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { passMarkOf, wholeMarkOf } from './mark-facts';

/** The page's ids (the done panel keeps the published build's `ms-mdone`, a focus target). */
const PREFIX = 'ms';
const MARK_ID = `${PREFIX}-mk`;
const FEEDBACK_ID = `${PREFIX}-fb`;
const DONE_ID = `${PREFIX}-mdone`;
const PANEL_ID = `${PREFIX}-panel`;
const PANEL_TITLE_ID = `${PREFIX}-ph`;
const SAVED_ID = `${PREFIX}-saved`;
const AUTO_ID = `${PREFIX}-auto-h`;
const TITLE_ID = `${PREFIX}-h1`;

/** The calm provisional states where no form is drawn (policy-open). */
export type Blocked = 'colleague' | 'several' | 'none' | 'choice';

/** A policy-open decision as the state it shows (`confirmMarks`, `getAttemptForMarking`). */
export function blockedOf(decision: string): Blocked {
  if (decision === 'ATT-17') return 'several';
  if (decision.startsWith('M22')) return 'none';
  if (decision === 'ATT-07') return 'choice';
  return 'colleague';
}

/** The submission's facts as the page draws them, from `getAttemptForMarking`. */
export interface MarkingView {
  /** The written questions by number, in order. */
  readonly written: readonly {
    readonly questionId: QuestionId;
    readonly number: number;
    readonly marks: number;
  }[];
  /** The choice questions by number, with their type and marks (`null`: not marked). */
  readonly choice: readonly {
    readonly questionId: QuestionId;
    readonly number: number;
    readonly type: 'multiple-choice' | 'true-false';
    readonly marks: number;
    readonly awarded: number | null;
  }[];
  /** Every pinned question's marks: the total the attempt is marked out of. */
  readonly outOf: number;
  /** How many questions the attempt's version pins. */
  readonly questions: number;
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
      type: entry.type as 'multiple-choice' | 'true-false',
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
  return {
    written,
    choice,
    outOf: answer.numbering.reduce((sum, entry) => sum + entry.marks, 0),
    questions: answer.numbering.length,
    blocked,
  };
}

/** The pinned release terms in words (`on`: the deadline or the release date). */
function termsOf(answer: AttemptForMarking): ReleaseTerms {
  return {
    option: answer.release.option,
    on: answer.release.on ? dateTime(answer.release.on) : null,
  };
}

/**
 * FA-19 Mark a submission — the owner-approved Faculty export (V3 Refined B, FA-v1
 * `Main.dc.html` FA-19, `vmMark`, `dlgMark`), at `/faculty/marking/[attemptId]`.
 *
 * - **Reads**: `MarkingService.getAttemptForMarking` — the submitted attempt, its written question
 *   as its version pins it (with the marking guidance, Faculty only), the choice questions' marks,
 *   the numbering with every question's marks, the attempts allowed and the pinned release terms;
 *   the queue's waiting answers (`listQueue`: the position and “Next submission”); the assessment
 *   (`getAssessment`: the pinned version's pass mark and how many versions it has); once confirmed,
 *   the assessment's submissions (`listSubmissions`) say whether the result was released.
 * - **As the export draws it**: the breadcrumb “Marking › <Student>”, the assessment and
 *   experiment, the Student as the H1, the status and “Submitted … · attempt 1 of 2”, the queue
 *   position; the reading sheet — the automatic marks per choice question, the written question,
 *   “<Student>’s answer”, the guidance “only you see this”; the Marks panel — the score out of the
 *   question's marks, optional feedback, the live total and pass mark, Save mark (“Mark saved — not
 *   confirmed yet”) and Confirm marks last (the dialog, then read-only: who and when, the total,
 *   the marks, the feedback, when the Student sees the result, Next submission, See submissions).
 *   Below 860 px “Go to the marks” jumps to the panel.
 * - **Checks are the service's**: Save sends `saveMark` as typed; its words (“Enter a whole number
 *   from 0 to 10”) show under the score, which takes focus. Confirm saves what is typed first if it
 *   is not saved yet (state-copy `FA-19.confirm-saves-first`), then the dialog → `confirmMarks`.
 *   No re-marking control (T-20).
 * - **Provisional states** (policy-open: a colleague's assessment, several written questions, no
 *   written question, choice questions without marks) show a calm state and no form.
 */
export function MarkSubmission({ attemptId }: { readonly attemptId: string }) {
  const navigation = useAppNavigation();
  const read = useAttemptForMarking(attemptId);
  const answer = read.data?.ok ? read.data.value : null;
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
          <CalmPage blocked="colleague" />
        </BarePage>
      );
    }
  }
  if (read.isError || (read.data !== undefined && !read.data.ok)) {
    return (
      <BarePage>
        <ListState
          kind="failed"
          titleAs="h2"
          title={stateWords('FA-19.failed')}
          action={
            <Button onClick={() => void read.refetch()}>{FACULTY_FAILED_WORDS.tryAgain}</Button>
          }
        >
          {FACULTY_FAILED_WORDS.line}
        </ListState>
      </BarePage>
    );
  }
  if (answer === null) {
    return (
      <BarePage>
        <LoadingRows message={stateWords('FA-19.loading')} rows={3} cells={[2, 1]} />
      </BarePage>
    );
  }
  return <Submission key={answer.attempt.id} answer={answer} onReread={() => read.refetch()} />;
}

/** The page before the submission is read (or when it can’t be shown): the trail and the heading. */
function BarePage({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: MARKING_TITLE, href: MARKING_ADDRESS }]}
            current={MARK_SUBMISSION.title}
          />
        }
        variant="record"
        title={MARK_SUBMISSION.title}
        titleFocusTarget
      />
      <Surface>{children}</Surface>
    </>
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
  const session = useSession();
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const { attempt, student } = answer;
  const view = markingView(answer);
  const written = view.written[0];
  const question = answer.questions.find((entry) => entry.id === written?.questionId) ?? null;
  const first = firstName(student.fullName);
  const terms = termsOf(answer);
  const confirmed = attempt.marking.confirmed;
  const saved = savedDraftOf(attempt, written?.questionId);
  const name = assessmentName(answer.assessmentName);

  const saveCmd = useCommand((ports) => ports.marking.saveMark);
  const confirmCmd = useCommand((ports) => ports.marking.confirmMarks);
  const queue = useMarkingQueue(null, 'waiting');
  const record = useAssessmentRecord(attempt.assessmentId);
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
  const pendingSavedFocus = useRef(false);
  const markRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusMark > 0) markRef.current?.focus();
  }, [focusMark]);
  // After Save mark, focus moves to its note (the export's `focusLater('fa-mk-saved')`) — once
  // the submission is read again and the note is there.
  useEffect(() => {
    if (!pendingSavedFocus.current || !savedRef.current) return;
    pendingSavedFocus.current = false;
    savedRef.current.focus();
  });
  // Once confirmed, focus moves to the read-only panel (the export's `focusLater('fa-mk-done')`) —
  // after the submission is read again, so the panel is there.
  const isConfirmed = confirmed !== null;
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

  const save = async () => {
    if (saveCmd.busy || preparing) return;
    pendingSavedFocus.current = false;
    const result = await saveTyped();
    if (result) pendingSavedFocus.current = true;
  };

  // The export's `confirm`: the typed mark is checked (saved) before the dialog opens.
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

  // The queue's waiting answers, oldest first: this one's position, and the next one.
  const waiting = queue.data?.ok ? queue.data.value : [];
  const position = waiting.findIndex((row) => row.attempt.id === attempt.id);
  const nextRow = waiting.find((row) => row.attempt.id !== attempt.id) ?? null;
  const released = submissions.data?.ok
    ? (submissions.data.value.find((row) => row.attempt.id === attempt.id)?.releasedAt ?? null) !==
      null
    : false;
  const assessment = record.data?.ok ? record.data.value.assessment : null;
  const passMark = assessment
    ? passMarkOf(assessment, attempt.assessmentVersion, view.outOf)
    : null;
  const versions = assessment ? assessment.versions.length : 0;

  const writtenMark = attempt.marking.written.find(
    (entry) => entry.questionId === written?.questionId,
  );
  const autoAwarded = view.choice.reduce((sum, entry) => sum + (entry.awarded ?? 0), 0);
  const autoOutOf = view.choice
    .filter((entry) => entry.awarded !== null)
    .reduce((sum, entry) => sum + entry.marks, 0);
  const confirmedBy = confirmed && confirmed.by.kind === 'person' ? confirmed.by.displayName : '';
  // The confirmed total: the stand-in's choice marks and the confirmed written mark.
  const confirmedTotal =
    autoAwarded + attempt.marking.written.reduce((sum, entry) => sum + (entry.mark ?? 0), 0);
  // The live total, while the typed mark is a whole number within the question's marks.
  const typed = written ? wholeMarkOf(draft.mark, written.marks) : null;
  const liveTotal = typed === null ? null : autoAwarded + typed;
  const dialogTotal = autoAwarded + (typed ?? 0);
  const passedNow = passMark === null ? null : dialogTotal >= passMark;
  const releasePassed =
    today !== null && answer.release.on !== null && answer.release.option !== null
      ? answer.release.option === 'on-date'
        ? today >= answer.release.on
        : today > answer.release.on
      : false;
  const plan = confirmReleasePlan(first, terms, releasePassed);

  const head = (
    <FaMarkHead
      breadcrumbs={
        <Breadcrumbs
          levels={[{ label: MARKING_TITLE, href: MARKING_ADDRESS }]}
          current={student.fullName}
        />
      }
      eyebrow={submissionOverline(name, answer.experimentName)}
      title={student.fullName}
      titleId={TITLE_ID}
      meta={
        <>
          {confirmed ? (
            <StatusPill tone="ok">{MARK_SUBMISSION.statusMarked}</StatusPill>
          ) : (
            <StatusPill tone="warn">{MARK_SUBMISSION.statusWaiting}</StatusPill>
          )}
          <MetaSeparator />
          <span>
            {submittedLine(
              attempt.submittedAt ? dateTime(attempt.submittedAt) : '',
              attempt.attemptNumber,
              answer.attemptsAllowed,
              versions > 1 ? attempt.assessmentVersion : null,
            )}
          </span>
        </>
      }
      position={
        !confirmed && position >= 0 ? queuePositionWords(position + 1, waiting.length) : undefined
      }
    />
  );

  const sheet = (
    <>
      <FaAutoMarks
        title={MARK_SUBMISSION.automatic}
        titleId={AUTO_ID}
        figure={automaticMarksWords(autoAwarded, autoOutOf)}
        none={MARK_SUBMISSION.noChoice}
        marks={view.choice.map((entry) => ({
          key: entry.questionId,
          label: choiceQuestionWords(entry.number, entry.type),
          mark:
            entry.awarded === null
              ? stateWords('FA-19.choice-not-marked')
              : markOfWords(entry.awarded, entry.marks),
          result: entry.awarded === null ? 'waiting' : entry.awarded >= entry.marks ? 'ok' : 'no',
        }))}
      />
      {view.written.map((entry) => {
        const pinned = answer.questions.find((item) => item.id === entry.questionId);
        if (!pinned) return null;
        const value = attempt.answers[entry.questionId];
        const text =
          value?.type === 'written' && value.text.trim() !== ''
            ? value.text
            : MARK_SUBMISSION.noAnswer;
        const guidance = pinned.body.type === 'written' ? pinned.body.markingGuidance : null;
        return (
          <FaSheetQuestion
            key={entry.questionId}
            titleId={`${PREFIX}-q${entry.number}`}
            title={writtenQuestionHead(entry.number, view.questions)}
            marks={marksWords(entry.marks)}
            text={pinned.text}
            answerTitle={answerTitle(student.fullName)}
            answer={text}
            guidance={guidance ? { title: MARK_SUBMISSION.guidance, text: guidance } : null}
          />
        );
      })}
    </>
  );

  let panelBody: ReactNode;
  if (confirmed) {
    const outcome = passOutcomeWords(
      passMark === null ? null : confirmedTotal >= passMark,
      passMark,
    );
    panelBody = (
      <FaMarksDone
        id={DONE_ID}
        doneRef={doneRef}
        before={
          notice?.kind === 'already-confirmed' ? (
            <Notice tone="info" role="status" title={stateWords('FA-19.already-confirmed')} />
          ) : null
        }
        title={MARK_SUBMISSION.confirmed}
        by={confirmedByLine(dateTime(confirmed.at), confirmedBy)}
        total={<FaDoneTotal total={doneTotalWords(confirmedTotal, view.outOf)} outcome={outcome} />}
        given={view.written.map((entry) => {
          const mark = attempt.marking.written.find((item) => item.questionId === entry.questionId);
          return {
            key: entry.questionId,
            term: questionNumberWords(entry.number),
            value: markOfWords(typeof mark?.mark === 'number' ? mark.mark : 0, entry.marks),
          };
        })}
        feedback={{
          term: MARK_SUBMISSION.feedbackKey,
          text: writtenMark?.feedback?.trim() || MARK_SUBMISSION.noFeedback,
          given: Boolean(writtenMark?.feedback?.trim()),
        }}
        release={
          <FaReleaseNote released={released}>
            {resultReleaseLine(first, terms, released, dateTime(confirmed.at))}
          </FaReleaseNote>
        }
        actions={
          <>
            {nextRow ? (
              <ButtonLink
                variant="primary"
                size="lg"
                href={markSubmissionAddress(nextRow.attempt.id)}
              >
                {MARK_SUBMISSION.next}
              </ButtonLink>
            ) : queue.data?.ok ? (
              <p className="fa-quiet">{MARK_SUBMISSION.nothingElse}</p>
            ) : null}
            <ButtonLink href={assessmentAddress(attempt.assessmentId, 'submissions')}>
              {MARK_SUBMISSION.seeSubmissions}
            </ButtonLink>
          </>
        }
      />
    );
  } else if (shownBlocked !== null || !written || !question) {
    panelBody = (
      <FaMarkSection>
        <CalmNotice blocked={shownBlocked ?? 'none'} count={view.written.length} />
      </FaMarkSection>
    );
  } else {
    panelBody = (
      <>
        <FaMarkSection>
          {notice ? <PanelNotice notice={notice} /> : null}
          <FaScoreField
            id={MARK_ID}
            label={MARK_SUBMISSION.yourMark}
            sub={markFieldSub(written.number, written.marks)}
            value={draft.mark}
            onChange={(event) => change('mark', event.target.value)}
            outOf={markOutOf(written.marks)}
            hint={markHint(written.marks)}
            error={markError ?? undefined}
            inputRef={markRef}
          />
          <FaMarkFeedback
            id={FEEDBACK_ID}
            label={feedbackLabel(first)}
            value={draft.feedback}
            onChange={(event) => change('feedback', event.target.value)}
          />
        </FaMarkSection>
        <FaLiveTotal
          label={MARK_SUBMISSION.total}
          total={liveTotalWords(liveTotal, view.outOf)}
          line={liveTotalLine(autoAwarded, typed, passMark)}
        />
        <FaMarkSave
          button={
            <Button
              busy={saveCmd.busy && !preparing}
              busyLabel={stateWords('FA-19.saving')}
              onClick={() => void save()}
            >
              {MARK_SUBMISSION.save}
            </Button>
          }
          saved={isSaved ? MARK_SUBMISSION.saved : undefined}
          savedId={SAVED_ID}
          savedRef={savedRef}
          note={MARK_SUBMISSION.saveNote}
        />
        <FaMarkConfirm
          button={
            <Button
              variant="primary"
              size="lg"
              busy={preparing}
              busyLabel={stateWords('FA-19.saving')}
              onClick={() => void confirm()}
            >
              {MARK_SUBMISSION.confirm}
            </Button>
          }
          note={MARK_SUBMISSION.cantChange}
        />
      </>
    );
  }

  const nowLines: ReactNode[] = written
    ? [
        confirmMarkLine(written.number, Number(draft.mark.trim()), written.marks),
        confirmTotalLine(first, dialogTotal, view.outOf, passedNow, passMark),
        MARK_SUBMISSION.readOnlyAfter,
        ...(plan.now ? [plan.text] : []),
      ]
    : [];

  return (
    <>
      {head}
      <FaMarkLayout
        goToLabel={MARK_SUBMISSION.goToMarks}
        panelId={PANEL_ID}
        panelTitleId={PANEL_TITLE_ID}
        sheet={sheet}
        panel={
          <FaMarksPanel
            id={PANEL_ID}
            titleId={PANEL_TITLE_ID}
            title={MARK_SUBMISSION.panelTitle}
            note={totalMarksWords(view.outOf)}
          >
            {panelBody}
          </FaMarksPanel>
        }
      />
      {written ? (
        <ConfirmDialog
          open={dialog}
          idPrefix={`${PREFIX}-c`}
          title={confirmTitle(student.fullName)}
          description={name}
          groups={[
            { kind: 'now', title: MARK_SUBMISSION.confirmNow, items: nowLines },
            ...(plan.now
              ? []
              : [{ kind: 'later' as const, title: confirmLaterTitle(first), items: [plan.text] }]),
          ]}
          cancelLabel={MARK_SUBMISSION.cancel}
          confirmLabel={MARK_SUBMISSION.confirm}
          busy={confirmCmd.busy}
          busyLabel={MARK_SUBMISSION.confirming}
          holdWhileBusy
          onConfirm={doConfirm}
          onCancel={() => {
            setDialog(false);
            setConfirmFailed(false);
          }}
          returnFocusFallback={doneRef}
        >
          {confirmFailed ? (
            <Notice
              tone="warn"
              role="alert"
              icon="alertCircle"
              title={stateWords('FA-19.unavailable.confirm')}
            />
          ) : null}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

/** The panel's answer to a refused or failed save or confirm (state-copy `FA-19.stale.*` …). */
function PanelNotice({ notice }: { readonly notice: PanelMessage }) {
  switch (notice.kind) {
    case 'stale':
      return (
        <Notice tone="warn" role="alert" icon="alertCircle" title={stateWords('FA-19.stale.title')}>
          {stateWords('FA-19.stale.line')}
        </Notice>
      );
    case 'already-confirmed':
      return <Notice tone="info" role="status" title={stateWords('FA-19.already-confirmed')} />;
    case 'unavailable-save':
      return (
        <Notice
          tone="warn"
          role="alert"
          icon="alertCircle"
          title={stateWords('FA-19.unavailable.save')}
        />
      );
  }
}

const CALM_WORDS = {
  colleague: ['FA-19.policy-open.colleague.title', 'FA-19.policy-open.colleague.line'],
  several: ['FA-19.policy-open.several.title', 'FA-19.policy-open.several.line'],
  none: ['FA-19.policy-open.none.title', 'FA-19.policy-open.none.line'],
  choice: ['FA-19.policy-open.choice.title', 'FA-19.policy-open.choice.line'],
} as const;

/** A calm provisional state in the marks panel (policy-open): no form. */
function CalmNotice({ blocked, count }: { readonly blocked: Blocked; readonly count: number }) {
  const [title, line] = CALM_WORDS[blocked];
  return (
    <Notice tone="info" role="status" title={stateWords(title)}>
      {stateWords(line).replace('{n}', String(count))}
    </Notice>
  );
}

/** The whole page's calm state (a colleague's assessment): no answer, no mark, no form. */
function CalmPage({ blocked }: { readonly blocked: Blocked }) {
  const [title, line] = CALM_WORDS[blocked];
  return (
    <ListState kind="none" titleAs="h2" icon="lock" title={stateWords(title)}>
      {stateWords(line)}
    </ListState>
  );
}
