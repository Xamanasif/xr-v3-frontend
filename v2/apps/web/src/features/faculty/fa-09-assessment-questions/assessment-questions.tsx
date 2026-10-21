'use client';

import type { AssessmentView, QuestionBankRow, ServiceError } from '@xr/contracts/draft';
import type { AssessmentQuestionRef, QuestionId } from '@xr/domain';
import { FailedState, LoadingState } from '@xr/ui';
import {
  Button,
  ButtonLink,
  FaAside,
  FaBankAvailable,
  FaCount,
  FaMainSheet,
  FaPanel,
  FaQuestionHead,
  FaQuiet,
  FaRecordAdd,
  FaRecordColumns,
  FaRecordOrder,
  FaRecordQuestions,
  FaRecordQuestionsFoot,
  FaRecordSection,
  Hint,
  ListState,
  Notice,
  PendingHint,
  TextLink,
  V46Island,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import {
  addedMessage,
  addLabel,
  deletedLine,
  keepWords,
  madeVersionLine,
  moveDownLabel,
  movedMessage,
  moveUpLabel,
  orderLabel,
  panelMeta,
  pinnedHint,
  questionLead,
  QUESTIONS_WORDS,
  removeLabel,
  splitWords,
  typeAndMarks,
  updatedMessage,
  updatedVersionLabel,
  versionLead,
  versionTitle,
} from '@/copy/assessment-record';
import { marksWords, QUESTION_TYPE_WORDS, questionsAndMarks } from '@/copy/assessment-words';
import { ASSESSMENT_QUESTIONS_EMPTY_LINE, BANK_TOOLS } from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  draftQuestionsAddress,
  importQuestionsAddress,
  newQuestionAddress,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useSubmissions } from '@/queries/faculty-assessment-work';
import { useSession } from '@/queries/session';
import { useAssessmentRecord, useFacultyAssessments, useQuestionBank } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  otherActor,
  TAB_HEADING_ID,
  useAssessmentPage,
} from '../shared/assessment-frame';
import { earlierSubmissions, versionChange } from '../fa-08-assessment-summary/assessment-summary';

/** The focus targets (the export's `fa-msg`, `fa-aq-ph`, `fa-aq-open`, `fa-aq-<id>`). */
const MESSAGE_ID = 'questions-msg';
const PANEL_TITLE_ID = 'questions-bank-title';
const OPENER_ID = 'questions-open-bank';
const rowId = (questionId: string) => `questions-row-${questionId}`;

/**
 * FA-09 Assessment · Questions in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-09 Questions",
 * `vmQuestionsTab`), at `/faculty/assessments/[assessmentId]/questions`, inside the record frame.
 *
 * - **The questions in order**, each as the assessment PINS it (the pinned version's text, type
 *   and marks — never a newer bank version on its own), named by its position and its words (never
 *   its reference), with Move up / Move down and Remove (`AssessmentService.updateQuestions`). A
 *   newer version in the bank says so, and "Use updated version" pins it (`useUpdatedVersion`); a
 *   question deleted from the bank keeps its copy.
 * - **Add from question bank** opens the side panel (`aside.rk-aside` beside the list from 860 px
 *   of content, below it under that): the experiment's bank questions not in this assessment
 *   (`QuestionBankService.listQuestions`, deleted ones left out), each with "Add". Its title takes
 *   focus; the close button or Escape returns focus to the opener.
 * - **New question** opens FA-15 for this experiment, which returns here with `?added=<id>`: the
 *   page then says it was saved to the bank and offers "Add this question to the assessment" —
 *   nothing is attached on its own.
 * - Every change says what happened in place (the export's messages) and, when the service made a
 *   new version because Students have submitted, "This made version 2" with whose submissions keep
 *   which version (`listSubmissions`). While Students have submitted the current version, the page
 *   says who before a change. Refusals re-read the record and say so; nothing is written for them.
 *   "Draft with assistance" (FA-16) and "Import" (FA-17) open those pages for the assessment's
 *   experiment: what they add goes into the bank only, and is added here from the bank panel.
 */
export function AssessmentQuestions({ assessmentId }: { readonly assessmentId: string }) {
  const navigation = useAppNavigation();
  // FA-15's return address carries the question just written; read once, then the plain address.
  const [addedId] = useState(() => new URLSearchParams(navigation.search).get('added'));
  const cleaned = useRef(false);
  useEffect(() => {
    if (addedId === null || cleaned.current) return;
    cleaned.current = true;
    navigation.replace(assessmentAddress(assessmentId, 'questions'));
  }, [addedId, assessmentId, navigation]);

  const state = useAssessmentPage(assessmentId, 'questions');
  if (state.kind !== 'ready') return <AssessmentFallback state={state} />;
  return (
    <AssessmentFrame view={state.view} tab="questions">
      <QuestionsBody view={state.view} addedId={addedId} />
    </AssessmentFrame>
  );
}

type Assessment = AssessmentView['assessment'];
type Pending = {
  readonly action: 'remove' | 'add' | 'move' | 'update';
  readonly questionId: string;
};
/** What the page says after an action: what happened (and the version it made), or a refusal. */
type Message =
  /** `madeVersion`: the change made this version (its line names whose submissions keep which). */
  | { readonly tone: 'ok'; readonly words: string; readonly madeVersion?: number }
  | { readonly tone: 'err'; readonly words: string }
  /** Back from FA-15: the question is offered, never attached on its own. */
  | { readonly tone: 'offer'; readonly questionId: string };
/** What happened, and the version it made (if it made one). */
function okMessage(words: string, madeVersion: number | undefined): Message {
  return madeVersion === undefined ? { tone: 'ok', words } : { tone: 'ok', words, madeVersion };
}

type ChangeAnswer =
  | {
      readonly ok: true;
      readonly value: { readonly assessment: Assessment; readonly newVersion: boolean };
    }
  | { readonly ok: false; readonly error: ServiceError };

/** One row as the assessment pins it. */
interface PinnedRow {
  readonly questionId: string;
  readonly text: string;
  readonly type: string;
  readonly written: boolean;
  readonly marks: string;
  readonly newerVersion: number | null;
  readonly deletedAt: string | null;
}

function pinnedRows(record: AssessmentView): PinnedRow[] {
  return record.questions.map(({ ref, question, newerVersion, deletedFromBank }) => {
    const pinned = question.versions.find((version) => version.version === ref.questionVersion);
    const body = pinned?.body ?? question.body;
    return {
      questionId: ref.questionId,
      text: pinned?.text ?? question.text,
      type: QUESTION_TYPE_WORDS[body.type],
      written: body.type === 'written',
      marks: marksWords(pinned?.marks ?? question.marks),
      newerVersion: deletedFromBank ? null : newerVersion,
      deletedAt: deletedFromBank ? (question.deleted?.at ?? null) : null,
    };
  });
}

function QuestionsBody({
  view,
  addedId,
}: {
  readonly view: AssessmentFrameView;
  readonly addedId: string | null;
}) {
  const session = useSession();
  const viewer = session.status === 'signed-in' ? session.personId : null;
  const { assessment, totalMarks, submittedOnCurrentVersion } = view.record;
  const own = otherActor(assessment.createdBy, viewer) === null;
  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');
  const [panelOpen, setPanelOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(
    addedId !== null ? { tone: 'offer', questionId: addedId } : null,
  );
  const [pending, setPending] = useState<Pending | null>(null);
  const [focus, setFocus] = useState<{ readonly id: string; readonly turn: number } | null>(
    addedId !== null ? { id: MESSAGE_ID, turn: 0 } : null,
  );
  const update = useCommand((ports) => ports.assessments.updateQuestions);
  const pinUpdated = useCommand((ports) => ports.assessments.useUpdatedVersion);
  const record = useAssessmentRecord(assessment.id);
  const list = useFacultyAssessments();
  const bank = useQuestionBank(assessment.experimentId, null, panelOpen || addedId !== null);
  // Who submitted (the pinned hint, the versions' keep line): one aggregate read.
  const submissions = useSubmissions(
    assessment.id,
    own && view.row !== null && view.row.submitted > 0,
  );
  const submissionRows = submissions.data?.ok ? submissions.data.value : null;

  // Focus follows each action, once the page shows its result (the export's `focusLater`). The
  // first one — the offer on the way back from FA-15 — waits a tick, so the route's own focus on
  // arrival does not take it back.
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => document.getElementById(focus.id)?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [focus]);
  const focusOn = (id: string) => setFocus((current) => ({ id, turn: (current?.turn ?? 0) + 1 }));

  const rows = pinnedRows(view.record);
  const refs: readonly AssessmentQuestionRef[] = assessment.questions;

  const say = (next: Message) => {
    setMessage(next);
    focusOn(MESSAGE_ID);
  };

  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      say({ tone: 'err', words: stateWords('FA-09.last-question') });
      return;
    }
    if (error.kind === 'policy-open') {
      say({ tone: 'err', words: stateWords('FA-09.policy-open') });
      return;
    }
    // The record moved on (stale revision, nothing to change, a question gone): read it again.
    void record.refetch();
    void list.refetch();
    if (panelOpen) void bank.refetch();
    say({ tone: 'err', words: stateWords('FA-09.stale') });
  };

  /**
   * "This made version 2. Rahul Verma’s submission keeps version 1; …" after a new version — read
   * from the submissions as they are now (named once that read has answered).
   */
  const versionLine = (version: number) =>
    madeVersionLine(version, keepWords(version, earlierSubmissions(submissionRows, version)));

  const change = (
    action: Pending,
    send: () => Promise<ChangeAnswer>,
    done: (assessment: Assessment, madeVersion: number | undefined) => void,
  ) => {
    if (pending) return;
    setPending(action);
    send().then(
      (answer) => {
        setPending(null);
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        done(
          answer.value.assessment,
          answer.value.newVersion ? answer.value.assessment.version : undefined,
        );
      },
      // Failed for now: nothing changed (state-copy `FA-09.unavailable`).
      () => {
        setPending(null);
        say({ tone: 'err', words: stateWords('FA-09.unavailable') });
      },
    );
  };

  const sendQuestions = (questions: readonly AssessmentQuestionRef[]) => () =>
    update.run({ id: assessment.id, questions: [...questions], expectedRev: assessment.rev });

  const remove = (questionId: string) =>
    change(
      { action: 'remove', questionId },
      sendQuestions(refs.filter((ref) => ref.questionId !== questionId)),
      (_next, madeVersion) => say(okMessage(QUESTIONS_WORDS.removed, madeVersion)),
    );

  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < 0 || to >= refs.length) return;
    const order = [...refs];
    const moved = order[index]!;
    order[index] = order[to]!;
    order[to] = moved;
    change({ action: 'move', questionId: moved.questionId }, sendQuestions(order), (_n, made) => {
      setMessage(okMessage(movedMessage(index + 1, to + 1), made));
      focusOn(rowId(moved.questionId));
    });
  };

  const pinNewer = (questionId: string, position: number) =>
    change(
      { action: 'update', questionId },
      () =>
        pinUpdated.run({
          id: assessment.id,
          questionId: questionId as QuestionId,
          expectedRev: assessment.rev,
        }),
      (_next, madeVersion) => say(okMessage(updatedMessage(position), madeVersion)),
    );

  const add = (row: QuestionBankRow) =>
    change(
      { action: 'add', questionId: row.question.id },
      sendQuestions([
        ...refs,
        { questionId: row.question.id, questionVersion: row.question.version },
      ]),
      (next, madeVersion) => say(okMessage(addedMessage(next.questions.length), madeVersion)),
    );

  const openPanel = () => {
    setPanelOpen(true);
    focusOn(PANEL_TITLE_ID);
  };
  const closePanel = () => {
    setPanelOpen(false);
    focusOn(OPENER_ID);
  };

  const busy = (action: Pending['action'], questionId: string) =>
    pending?.action === action && pending.questionId === questionId;
  const bankRows = bank.data?.ok ? bank.data.value : null;
  const offered =
    message?.tone === 'offer'
      ? (bankRows?.find(
          (row) => row.question.id === message.questionId && row.question.deleted === null,
        ) ?? null)
      : null;
  const pinnedNames =
    own && submittedOnCurrentVersion > 0 && submissionRows !== null
      ? [
          ...new Set(
            submissionRows
              .filter((row) => row.attempt.assessmentVersion === assessment.version)
              .map((row) => row.student.fullName),
          ),
        ]
      : [];
  const written = rows.filter((row) => row.written).length;
  const made = versionChange(assessment, viewer);
  const versionNote =
    assessment.version > 1 && !(message?.tone === 'ok' && message.madeVersion !== undefined) ? (
      <Notice
        tone="info"
        icon="infoDisc"
        space="below"
        title={versionTitle(assessment.version, assessment.versionSince)}
      >
        {`${versionLead(made.change, made.who)} ${keepWords(
          assessment.version,
          earlierSubmissions(submissionRows, assessment.version),
        )}`}
      </Notice>
    ) : null;

  const newQuestion = newQuestionAddress({
    experimentId: assessment.experimentId,
    returnTo: assessmentAddress(assessment.id, 'questions'),
  });

  const main = (
    <FaMainSheet labelledBy={TAB_HEADING_ID}>
      <FaRecordSection>
        <FaQuestionHead
          title={QUESTIONS_WORDS.title}
          titleId={TAB_HEADING_ID}
          focusable
          aside={
            own ? (
              <FaRecordAdd
                buttons={
                  <>
                    {panelOpen ? null : (
                      <Button id={OPENER_ID} icon="stack" iconSize={20} onClick={openPanel}>
                        {QUESTIONS_WORDS.addFromBank}
                      </Button>
                    )}
                    <ButtonLink href={newQuestion} icon="add" iconSize={20}>
                      {QUESTIONS_WORDS.newQuestion}
                    </ButtonLink>
                  </>
                }
                or={QUESTIONS_WORDS.or}
                links={[
                  <TextLink key="draft" href={draftQuestionsAddress(assessment.experimentId)}>
                    {BANK_TOOLS.draftWithAssistance}
                  </TextLink>,
                  <TextLink key="import" href={importQuestionsAddress(assessment.experimentId)}>
                    {BANK_TOOLS.import}
                  </TextLink>,
                ]}
              />
            ) : undefined
          }
        >
          <FaCount>{questionsAndMarks(rows.length, totalMarks)}</FaCount>
          {rows.length > 0 ? <Hint>{splitWords(rows.length - written, written)}</Hint> : null}
        </FaQuestionHead>
        {message?.tone === 'ok' ? (
          <Notice tone="ok" role="status" id={MESSAGE_ID} space="below" title={message.words}>
            {message.madeVersion === undefined ? undefined : versionLine(message.madeVersion)}
          </Notice>
        ) : message?.tone === 'err' ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            id={MESSAGE_ID}
            space="below"
            title={message.words}
          />
        ) : message?.tone === 'offer' ? (
          <Notice
            tone="ok"
            role="status"
            id={MESSAGE_ID}
            space="below"
            wrapActions
            title={QUESTIONS_WORDS.savedTitle}
            actions={
              offered ? (
                <Button busy={busy('add', offered.question.id)} onClick={() => add(offered)}>
                  {QUESTIONS_WORDS.offer}
                </Button>
              ) : undefined
            }
          >
            {QUESTIONS_WORDS.savedLine}
          </Notice>
        ) : null}
        {versionNote}
        {pinnedNames.length > 0 ? (
          <PendingHint space="below">{pinnedHint(pinnedNames)}</PendingHint>
        ) : null}
        {rows.length > 0 ? (
          <FaRecordQuestions
            items={rows.map((row, index) => {
              const position = index + 1;
              const notes: { key: string; text: ReactNode; action?: ReactNode }[] = [];
              if (row.newerVersion !== null) {
                notes.push({
                  key: 'newer',
                  text: QUESTIONS_WORDS.newerVersion,
                  action: own ? (
                    <Button
                      aria-label={updatedVersionLabel(position)}
                      busy={busy('update', row.questionId)}
                      onClick={() => pinNewer(row.questionId, position)}
                    >
                      {QUESTIONS_WORDS.useUpdated}
                    </Button>
                  ) : undefined,
                });
              }
              if (row.deletedAt) notes.push({ key: 'deleted', text: deletedLine(row.deletedAt) });
              return {
                key: row.questionId,
                id: rowId(row.questionId),
                number: position,
                lead: questionLead(position),
                text: row.text,
                type: row.type,
                written: row.written,
                marks: row.marks,
                notes,
                actions: own ? (
                  <>
                    <FaRecordOrder
                      label={orderLabel(position)}
                      up={{
                        label: moveUpLabel(position),
                        disabled: index === 0,
                        onClick: () => move(index, -1),
                      }}
                      down={{
                        label: moveDownLabel(position),
                        disabled: index === rows.length - 1,
                        onClick: () => move(index, 1),
                      }}
                    />
                    <Button
                      variant="ghost"
                      aria-label={removeLabel(position)}
                      busy={busy('remove', row.questionId)}
                      onClick={() => remove(row.questionId)}
                    >
                      {QUESTIONS_WORDS.remove}
                    </Button>
                  </>
                ) : undefined,
              };
            })}
          />
        ) : (
          <ListState kind="empty" icon="stack" title={QUESTIONS_WORDS.emptyTitle}>
            {ASSESSMENT_QUESTIONS_EMPTY_LINE}
          </ListState>
        )}
        <FaRecordQuestionsFoot>{QUESTIONS_WORDS.footNote}</FaRecordQuestionsFoot>
      </FaRecordSection>
    </FaMainSheet>
  );

  return (
    <FaRecordColumns
      aside={
        panelOpen && own ? (
          <FaAside labelledBy={PANEL_TITLE_ID}>
            <BankPanel
              experiment={experiment}
              bank={bank}
              inAssessment={new Set(refs.map((ref) => ref.questionId))}
              busyId={pending?.action === 'add' ? pending.questionId : null}
              onAdd={add}
              onClose={closePanel}
            />
          </FaAside>
        ) : undefined
      }
    >
      {main}
    </FaRecordColumns>
  );
}

/** "From your question bank" — "<experiment> · not in this assessment". */
function BankPanel({
  experiment,
  bank,
  inAssessment,
  busyId,
  onAdd,
  onClose,
}: {
  readonly experiment: string;
  readonly bank: ReturnType<typeof useQuestionBank>;
  readonly inAssessment: ReadonlySet<string>;
  readonly busyId: string | null;
  readonly onAdd: (row: QuestionBankRow) => void;
  readonly onClose: () => void;
}) {
  const answer = bank.data;
  const available = answer?.ok
    ? answer.value.filter(
        (row) => row.question.deleted === null && !inAssessment.has(row.question.id),
      )
    : [];
  return (
    <FaPanel
      titleId={PANEL_TITLE_ID}
      title={QUESTIONS_WORDS.panelTitle}
      focusable
      close={{ label: QUESTIONS_WORDS.closePanel, onClose }}
    >
      <Hint>{panelMeta(experiment)}</Hint>
      {bank.isError || (answer && !answer.ok) ? (
        <V46Island>
          <FailedState
            title={stateWords('FA-09.bank-failed')}
            onRetry={() => void bank.refetch()}
          />
        </V46Island>
      ) : !answer ? (
        <V46Island>
          <LoadingState label={stateWords('FA-09.bank-loading')} surface={null} lines={2} />
        </V46Island>
      ) : available.length > 0 ? (
        <FaBankAvailable
          items={available.map((row) => ({
            key: row.question.id,
            text: row.question.text,
            line: typeAndMarks(
              QUESTION_TYPE_WORDS[row.question.body.type],
              marksWords(row.question.marks),
            ),
            action: (
              <Button
                icon="add"
                iconSize={20}
                aria-label={addLabel(row.question.text)}
                busy={busyId === row.question.id}
                onClick={() => onAdd(row)}
              >
                {QUESTIONS_WORDS.add}
              </Button>
            ),
          }))}
        />
      ) : (
        <FaQuiet>{QUESTIONS_WORDS.panelEmpty}</FaQuiet>
      )}
    </FaPanel>
  );
}
