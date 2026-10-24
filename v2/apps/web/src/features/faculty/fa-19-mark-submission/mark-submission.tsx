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
import { Fragment, type ReactNode, useEffect, useRef, useState } from 'react';

import { marksWords } from '@/copy/assessment-words';
import { dateTime } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import { FACULTY_FAILED_WORDS } from '@/copy/faculty-overview';
import { firstName } from '@/copy/institute-people';
import {
  answerTitle,
  automaticMarksWords,
  choiceOnlyTotalLine,
  choiceQuestionWords,
  confirmedByLine,
  confirmLaterTitle,
  confirmMarkLine,
  confirmReleasePlan,
  confirmTitle,
  confirmTotalLine,
  doneTotalWords,
  feedbackKeyWords,
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
  saveMarkLabel,
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

/**
 * The calm provisional states where no form is drawn (policy-open): a colleague's assessment
 * (OD-B4-17), choice questions without their automatic marks (ATT-07). Every Ready shape is
 * otherwise marked here (owner decisions of 24 Oct 2026: no written question, several).
 */
export type Blocked = 'colleague' | 'choice';

/** A policy-open decision as the state it shows (`confirmMarks`, `getAttemptForMarking`). */
export function blockedOf(decision: string): Blocked {
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
  /** What blocks the form before anything is sent: choice questions without their marks. */
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
  const blocked: Blocked | null = choice.some((entry) => entry.awarded === null) ? 'choice' : null;
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
 * - **Every Ready shape** (owner decisions of 24 Oct 2026): several written questions — one mark
 *   block per written answer (score, feedback, Save mark), one total and one Confirm marks for the
 *   attempt, which saves every typed block first and is refused while any written answer has no
 *   saved mark (state-copy `FA-19.several`); no written question — the automatic marks, the total
 *   and Confirm marks, no score field (`FA-19.choice-only.title`).
 * - **Provisional states** (policy-open: a colleague's assessment, choice questions without their
 *   automatic marks) show a calm state and no form.
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

const EMPTY_DRAFT: Draft = { mark: '', feedback: '' };

function savedDraftOf(attempt: Attempt, questionId: string | undefined): Draft | null {
  const saved = attempt.marking.written.find((entry) => entry.questionId === questionId);
  if (!saved || saved.mark === null) return null;
  return { mark: String(saved.mark), feedback: saved.feedback ?? '' };
}

/** A written question's block ids: the drawn ones with one, by question number with several. */
function blockIds(number: number, several: boolean) {
  const suffix = several ? `-q${number}` : '';
  return {
    mark: `${MARK_ID}${suffix}`,
    feedback: `${FEEDBACK_ID}${suffix}`,
    saved: `${SAVED_ID}${suffix}`,
  };
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
  // One written question (as drawn), several (one block each, confirmed once) or none (the
  // automatic marks confirmed) — owner decisions of 24 Oct 2026 (state-copy `FA-19.several`,
  // `FA-19.choice-only.title`).
  const several = view.written.length > 1;
  const choiceOnly = view.written.length === 0;
  const first = firstName(student.fullName);
  const terms = termsOf(answer);
  const confirmed = attempt.marking.confirmed;
  const name = assessmentName(answer.assessmentName);

  const saveCmd = useCommand((ports) => ports.marking.saveMark);
  const confirmCmd = useCommand((ports) => ports.marking.confirmMarks);
  const queue = useMarkingQueue(null, 'waiting');
  const record = useAssessmentRecord(attempt.assessmentId);
  const submissions = useSubmissions(attempt.assessmentId, confirmed !== null);

  const [drafts, setDrafts] = useState<Readonly<Record<string, Draft>>>(() =>
    Object.fromEntries(
      view.written.map((entry) => [
        entry.questionId,
        savedDraftOf(attempt, entry.questionId) ?? EMPTY_DRAFT,
      ]),
    ),
  );
  const [markErrors, setMarkErrors] = useState<Readonly<Record<string, string>>>({});
  const [notice, setNotice] = useState<PanelMessage | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [dialog, setDialog] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [focusMark, setFocusMark] = useState<{ readonly questionId: string } | null>(null);
  const pendingDoneFocus = useRef(false);
  const pendingSavedFocus = useRef<string | null>(null);
  // The latest revision this page wrote (a save answers before the submission is read again).
  const writtenRev = useRef(attempt.rev);
  const markRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const savedRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusMark) markRefs.current[focusMark.questionId]?.focus();
  }, [focusMark]);
  // After Save mark, focus moves to its note (the export's `focusLater('fa-mk-saved')`) — once
  // the submission is read again and the note is there.
  useEffect(() => {
    const questionId = pendingSavedFocus.current;
    const note = questionId ? savedRefs.current[questionId] : null;
    if (!questionId || !note) return;
    pendingSavedFocus.current = null;
    note.focus();
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
  const draftOf = (questionId: string): Draft => drafts[questionId] ?? EMPTY_DRAFT;
  const isSaved = (questionId: string): boolean => {
    const saved = savedDraftOf(attempt, questionId);
    const draft = draftOf(questionId);
    return (
      saved !== null &&
      draft.mark.trim() === saved.mark &&
      draft.feedback.trim() === saved.feedback.trim()
    );
  };
  const currentRev = () => Math.max(attempt.rev, writtenRev.current);

  const change = (questionId: string, field: keyof Draft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [questionId]: { ...(current[questionId] ?? EMPTY_DRAFT), [field]: value },
    }));
    if (field === 'mark') {
      setMarkErrors((current) => {
        if (!(questionId in current)) return current;
        const next = { ...current };
        delete next[questionId];
        return next;
      });
    }
    setNotice(null);
  };

  /**
   * A refusal of save or confirm, as the page shows it. A field error goes under its question's
   * score: `mark` is the block saved (or the one written question), `marks.<questionId>` the
   * question the service names (several written questions without a saved mark).
   */
  const refused = (error: ServiceError, saving: QuestionId | null) => {
    switch (error.kind) {
      case 'validation-failed': {
        const errors = formFieldErrors(error, (path) =>
          path === 'mark'
            ? (saving ?? view.written[0]?.questionId ?? null)
            : path.startsWith('marks.')
              ? path.slice('marks.'.length)
              : null,
        );
        if (errors.length === 0) return;
        setMarkErrors((current) => ({
          ...current,
          ...Object.fromEntries(errors.map((entry) => [entry.field, entry.message])),
        }));
        setFocusMark({ questionId: errors[0]!.field });
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

  /** `saveMark` with what is typed for one question; the saved attempt, or `null`. */
  const saveTyped = async (questionId: QuestionId, rev: number): Promise<Attempt | null> => {
    const draft = draftOf(questionId);
    setSavingId(questionId);
    try {
      const result = await saveCmd.run({
        attemptId: attempt.id,
        questionId,
        mark: draft.mark,
        feedback: draft.feedback.trim() === '' ? null : draft.feedback,
        expectedRev: rev,
      });
      if (!result.ok) {
        refused(result.error, questionId);
        return null;
      }
      writtenRev.current = Math.max(writtenRev.current, result.value.rev);
      setMarkErrors((current) => {
        if (!(questionId in current)) return current;
        const next = { ...current };
        delete next[questionId];
        return next;
      });
      setNotice(null);
      return result.value;
    } catch {
      setNotice({ kind: 'unavailable-save' });
      return null;
    }
  };

  const save = async (questionId: QuestionId) => {
    if (saveCmd.busy || preparing) return;
    pendingSavedFocus.current = null;
    const result = await saveTyped(questionId, currentRev());
    if (result) pendingSavedFocus.current = questionId;
  };

  // The export's `confirm`: every typed mark is checked (saved) before the dialog opens — each
  // written answer's, in order; the first refused one stops it, its words under its score.
  const confirm = async () => {
    if (saveCmd.busy || preparing || confirmCmd.busy) return;
    const unsaved = view.written.filter((entry) => !isSaved(entry.questionId));
    if (unsaved.length > 0) {
      setPreparing(true);
      let rev = currentRev();
      for (const entry of unsaved) {
        const result = await saveTyped(entry.questionId, rev);
        if (!result) {
          setPreparing(false);
          return;
        }
        rev = result.rev;
      }
      setPreparing(false);
    }
    setConfirmFailed(false);
    setDialog(true);
  };

  const doConfirm = () => {
    if (confirmCmd.busy) return;
    setConfirmFailed(false);
    confirmCmd.run({ attemptId: attempt.id, expectedRev: currentRev() }).then(
      (result) => {
        setDialog(false);
        if (!result.ok) {
          refused(result.error, null);
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

  const autoAwarded = view.choice.reduce((sum, entry) => sum + (entry.awarded ?? 0), 0);
  const autoOutOf = view.choice
    .filter((entry) => entry.awarded !== null)
    .reduce((sum, entry) => sum + entry.marks, 0);
  const confirmedBy = confirmed && confirmed.by.kind === 'person' ? confirmed.by.displayName : '';
  // The confirmed total: the stand-in's choice marks and every confirmed written mark.
  const confirmedTotal =
    autoAwarded + attempt.marking.written.reduce((sum, entry) => sum + (entry.mark ?? 0), 0);
  // The live total, while every typed mark is a whole number within its question's marks.
  const typedMarks = view.written.map((entry) =>
    wholeMarkOf(draftOf(entry.questionId).mark, entry.marks),
  );
  const typedSum = typedMarks.every((mark) => mark !== null)
    ? typedMarks.reduce<number>((sum, mark) => sum + (mark ?? 0), 0)
    : null;
  const liveTotal = typedSum === null ? null : autoAwarded + typedSum;
  const dialogTotal = autoAwarded + typedMarks.reduce<number>((sum, mark) => sum + (mark ?? 0), 0);
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

  /** One written answer's score and feedback (`FaMarkSection`), as drawn. */
  const markSection = (entry: MarkingView['written'][number], lead: ReactNode = null) => {
    const ids = blockIds(entry.number, several);
    const draft = draftOf(entry.questionId);
    return (
      <FaMarkSection>
        {lead}
        <FaScoreField
          id={ids.mark}
          label={MARK_SUBMISSION.yourMark}
          sub={markFieldSub(entry.number, entry.marks)}
          value={draft.mark}
          onChange={(event) => change(entry.questionId, 'mark', event.target.value)}
          outOf={markOutOf(entry.marks)}
          hint={markHint(entry.marks)}
          error={markErrors[entry.questionId]}
          inputRef={(element) => {
            markRefs.current[entry.questionId] = element;
          }}
        />
        <FaMarkFeedback
          id={ids.feedback}
          label={several ? feedbackLabel(first, entry.number) : feedbackLabel(first)}
          value={draft.feedback}
          onChange={(event) => change(entry.questionId, 'feedback', event.target.value)}
        />
      </FaMarkSection>
    );
  };

  /** One written answer's Save mark and its note (`FaMarkSave`). */
  const markSave = (entry: MarkingView['written'][number]) => {
    const ids = blockIds(entry.number, several);
    return (
      <FaMarkSave
        button={
          <Button
            busy={saveCmd.busy && !preparing && savingId === entry.questionId}
            busyLabel={stateWords('FA-19.saving')}
            onClick={() => void save(entry.questionId)}
            {...(several ? { 'aria-label': saveMarkLabel(entry.number) } : {})}
          >
            {MARK_SUBMISSION.save}
          </Button>
        }
        saved={isSaved(entry.questionId) ? MARK_SUBMISSION.saved : undefined}
        savedId={ids.saved}
        savedRef={(element) => {
          savedRefs.current[entry.questionId] = element;
        }}
        note={MARK_SUBMISSION.saveNote}
      />
    );
  };

  const confirmButton = (
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
  );

  const liveTotalBlock = (
    <FaLiveTotal
      label={MARK_SUBMISSION.total}
      total={liveTotalWords(choiceOnly ? autoAwarded : liveTotal, view.outOf)}
      line={
        choiceOnly
          ? choiceOnlyTotalLine(autoAwarded, passMark)
          : liveTotalLine(autoAwarded, typedSum, passMark, several)
      }
    />
  );

  let panelBody: ReactNode;
  if (confirmed) {
    const outcome = passOutcomeWords(
      passMark === null ? null : confirmedTotal >= passMark,
      passMark,
    );
    const feedbackOf = (questionId: string) =>
      attempt.marking.written.find((item) => item.questionId === questionId)?.feedback?.trim() ??
      '';
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
        given={
          choiceOnly
            ? [
                {
                  key: 'automatic',
                  term: MARK_SUBMISSION.automatic,
                  value: automaticMarksWords(autoAwarded, autoOutOf),
                },
              ]
            : view.written.map((entry) => {
                const mark = attempt.marking.written.find(
                  (item) => item.questionId === entry.questionId,
                );
                return {
                  key: entry.questionId,
                  term: questionNumberWords(entry.number),
                  value: markOfWords(typeof mark?.mark === 'number' ? mark.mark : 0, entry.marks),
                };
              })
        }
        feedback={
          several || choiceOnly
            ? view.written.map((entry) => ({
                key: `feedback-${entry.questionId}`,
                term: feedbackKeyWords(entry.number),
                text: feedbackOf(entry.questionId) || MARK_SUBMISSION.noFeedback,
                given: feedbackOf(entry.questionId) !== '',
              }))
            : {
                term: MARK_SUBMISSION.feedbackKey,
                text: feedbackOf(view.written[0]!.questionId) || MARK_SUBMISSION.noFeedback,
                given: feedbackOf(view.written[0]!.questionId) !== '',
              }
        }
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
  } else if (shownBlocked !== null) {
    panelBody = (
      <FaMarkSection>
        <CalmNotice blocked={shownBlocked} />
      </FaMarkSection>
    );
  } else if (choiceOnly) {
    // No written question: the automatic marks, the total and Confirm marks (owner decision).
    panelBody = (
      <>
        <FaMarkSection>
          {notice ? <PanelNotice notice={notice} /> : null}
          <Notice tone="info" role="status" title={stateWords('FA-19.choice-only.title')}>
            {stateWords('FA-19.choice-only.line')}
          </Notice>
        </FaMarkSection>
        {liveTotalBlock}
        {confirmButton}
      </>
    );
  } else if (several) {
    // One block per written answer (score, feedback, Save mark), then the total and one Confirm.
    panelBody = (
      <>
        {view.written.map((entry, index) => (
          <Fragment key={entry.questionId}>
            {markSection(entry, index === 0 && notice ? <PanelNotice notice={notice} /> : null)}
            {markSave(entry)}
          </Fragment>
        ))}
        {liveTotalBlock}
        {confirmButton}
      </>
    );
  } else {
    const written = view.written[0]!;
    panelBody = (
      <>
        {markSection(written, notice ? <PanelNotice notice={notice} /> : null)}
        {liveTotalBlock}
        {markSave(written)}
        {confirmButton}
      </>
    );
  }

  const nowLines: ReactNode[] = [
    ...view.written.map((entry) =>
      confirmMarkLine(entry.number, Number(draftOf(entry.questionId).mark.trim()), entry.marks),
    ),
    confirmTotalLine(first, dialogTotal, view.outOf, passedNow, passMark),
    MARK_SUBMISSION.readOnlyAfter,
    ...(plan.now ? [plan.text] : []),
  ];

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
  choice: ['FA-19.policy-open.choice.title', 'FA-19.policy-open.choice.line'],
} as const;

/** A calm provisional state in the marks panel (policy-open): no form. */
function CalmNotice({ blocked }: { readonly blocked: Blocked }) {
  const [title, line] = CALM_WORDS[blocked];
  return (
    <Notice tone="info" role="status" title={stateWords(title)}>
      {stateWords(line)}
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
