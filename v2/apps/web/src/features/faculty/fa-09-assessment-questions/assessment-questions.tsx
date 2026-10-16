'use client';

import type { AssessmentView, QuestionBankRow, ServiceError } from '@xr/contracts/draft';
import type { AssessmentQuestionRef, QuestionId } from '@xr/domain';
import { Button, FailedState, Icon, IconButton, Link, LoadingState, Notice, Section } from '@xr/ui';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import {
  addedMessage,
  addLabel,
  bankRowSub,
  deletedLine,
  movedMessage,
  moveDownLabel,
  moveUpLabel,
  newVersionLine,
  panelMeta,
  QUESTIONS_WORDS,
  removedMessage,
  removeLabel,
  updatedMessage,
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
import { useAssessmentRecord, useFacultyAssessments, useQuestionBank } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  useAssessmentPage,
} from '../shared/assessment-frame';

/** The focus targets the boards name (`Qq-msg`, `Qq-ph`, `Qq-r-<id>`). */
const MESSAGE_ID = 'questions-msg';
const PANEL_TITLE_ID = 'questions-bank-title';
const OPENER_ID = 'questions-open-bank';
const rowId = (questionId: string) => `questions-row-${questionId}`;

/**
 * FA-09 Assessment · Questions — board B4-05 f1, f2, f5 … f8, at
 * `/faculty/assessments/[assessmentId]/questions`, inside the record frame.
 *
 * - **The questions in order**, each as the assessment PINS it (the pinned version's text, type
 *   and marks — never a newer bank version on its own), with its Q-id, Move up / Move down and
 *   Remove (`AssessmentService.updateQuestions`). A newer version in the bank says so, and "Use
 *   updated version" pins it (`useUpdatedVersion`); a question deleted from the bank keeps its copy.
 * - **Add from question bank** opens the side panel (`aside.xr-dpanel` beside the list from 860 px
 *   of content, below it under that): the experiment's bank questions not in this assessment
 *   (`QuestionBankService.listQuestions`, deleted ones left out), each with "Add". Its title takes
 *   focus; the close button or Escape returns focus to the opener.
 * - **New question** opens FA-15 for this experiment, which returns here with `?added=<id>`: the
 *   panel then opens with that question first — the Faculty member adds it; nothing is attached
 *   on its own.
 * - Every change says what happened in place (the boards' messages) and, when the service made a
 *   new version because Students have submitted, "This makes a new version". Refusals re-read the
 *   record and say so; nothing is written for them. "Draft with assistance" (FA-16) and "Import"
 *   (FA-17) open those pages for the assessment's experiment: what they add goes into the bank
 *   only, and is added here from the bank panel (Phase 4B).
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
type Message = { readonly tone: 'ok' | 'err'; readonly words: string };
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
  readonly marks: string;
  readonly newerVersion: number | null;
  readonly deletedAt: string | null;
}

function pinnedRows(record: AssessmentView): PinnedRow[] {
  return record.questions.map(({ ref, question, newerVersion, deletedFromBank }) => {
    const pinned = question.versions.find((version) => version.version === ref.questionVersion);
    return {
      questionId: ref.questionId,
      text: pinned?.text ?? question.text,
      type: QUESTION_TYPE_WORDS[(pinned?.body ?? question.body).type],
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
  const { assessment, totalMarks } = view.record;
  const experiment = view.experiment?.experiment.name ?? stateWords('FA-08.experiment-unknown');
  const [panelOpen, setPanelOpen] = useState(addedId !== null);
  const [message, setMessage] = useState<Message | null>(null);
  const [madeNewVersion, setMadeNewVersion] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [focus, setFocus] = useState<{ readonly id: string; readonly turn: number } | null>(
    addedId !== null ? { id: PANEL_TITLE_ID, turn: 0 } : null,
  );
  const update = useCommand((ports) => ports.assessments.updateQuestions);
  const pinUpdated = useCommand((ports) => ports.assessments.useUpdatedVersion);
  const record = useAssessmentRecord(assessment.id);
  const list = useFacultyAssessments();
  const bank = useQuestionBank(assessment.experimentId, null, panelOpen);

  // Focus follows each action, once the page shows its result (B4-05 script `focus(…)`). The
  // first one — the panel opened on the way back from FA-15 — waits a tick, as the boards do, so
  // the route's own focus on arrival does not take it back.
  useEffect(() => {
    if (!focus) return;
    const timer = window.setTimeout(() => document.getElementById(focus.id)?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [focus]);
  const focusOn = (id: string) => setFocus((current) => ({ id, turn: (current?.turn ?? 0) + 1 }));

  const rows = pinnedRows(view.record);
  const refs: readonly AssessmentQuestionRef[] = assessment.questions;

  const say = (words: string, tone: Message['tone'] = 'ok') => {
    setMessage({ tone, words });
    focusOn(MESSAGE_ID);
  };

  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      say(stateWords('FA-09.last-question'), 'err');
      return;
    }
    if (error.kind === 'policy-open') {
      say(stateWords('FA-09.policy-open'), 'err');
      return;
    }
    // The record moved on (stale revision, nothing to change, a question gone): read it again.
    void record.refetch();
    void list.refetch();
    if (panelOpen) void bank.refetch();
    say(stateWords('FA-09.stale'), 'err');
  };

  const change = (
    action: Pending,
    send: () => Promise<ChangeAnswer>,
    done: (assessment: Assessment) => void,
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
        if (answer.value.newVersion) setMadeNewVersion(true);
        done(answer.value.assessment);
      },
      // Failed for now: nothing changed (state-copy `FA-09.unavailable`).
      () => {
        setPending(null);
        say(stateWords('FA-09.unavailable'), 'err');
      },
    );
  };

  const sendQuestions = (questions: readonly AssessmentQuestionRef[]) => () =>
    update.run({ id: assessment.id, questions: [...questions], expectedRev: assessment.rev });

  const remove = (questionId: string) =>
    change(
      { action: 'remove', questionId },
      sendQuestions(refs.filter((ref) => ref.questionId !== questionId)),
      () => say(removedMessage(questionId)),
    );

  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < 0 || to >= refs.length) return;
    const order = [...refs];
    const moved = order[index]!;
    order[index] = order[to]!;
    order[to] = moved;
    change({ action: 'move', questionId: moved.questionId }, sendQuestions(order), () => {
      setMessage({ tone: 'ok', words: movedMessage(moved.questionId, to + 1) });
      focusOn(rowId(moved.questionId));
    });
  };

  const pinNewer = (questionId: string) =>
    change(
      { action: 'update', questionId },
      () =>
        pinUpdated.run({
          id: assessment.id,
          questionId: questionId as QuestionId,
          expectedRev: assessment.rev,
        }),
      () => say(updatedMessage(questionId)),
    );

  const add = (row: QuestionBankRow) =>
    change(
      { action: 'add', questionId: row.question.id },
      sendQuestions([
        ...refs,
        { questionId: row.question.id, questionVersion: row.question.version },
      ]),
      (next) => say(addedMessage(row.question.id, next.questions.length)),
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
  const submitted = view.row?.submitted ?? 0;

  return (
    <div className={panelOpen ? 'xr-decide' : undefined}>
      <Section
        title={QUESTIONS_WORDS.title}
        metaLive
        meta={questionsAndMarks(rows.length, totalMarks)}
      >
        {/* The drawn toolbar row: Add from question bank, New question, and the text links to
            FA-16 Draft with assistance and FA-17 Import for the assessment's experiment. */}
        <div className="xw-actions min-h-14 [padding:0_24px_16px]">
          {panelOpen ? null : (
            <Button variant="primary" size="sm" icon="add" id={OPENER_ID} onClick={openPanel}>
              {QUESTIONS_WORDS.addFromBank}
            </Button>
          )}
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={newQuestionAddress({
              experimentId: assessment.experimentId,
              returnTo: assessmentAddress(assessment.id, 'questions'),
            })}
          >
            {QUESTIONS_WORDS.newQuestion}
          </Link>
          <Link
            className="xr-btn xr-btn--text"
            href={draftQuestionsAddress(assessment.experimentId)}
          >
            <Icon name="assist" />
            {BANK_TOOLS.draftWithAssistance}
          </Link>
          <Link
            className="xr-btn xr-btn--text"
            href={importQuestionsAddress(assessment.experimentId)}
          >
            <Icon name="readyToPublish" />
            {BANK_TOOLS.import}
          </Link>
        </div>
        <div id={MESSAGE_ID} tabIndex={-1} className="[padding:0_24px]">
          {message ? (
            <p
              className={`xa-save ${message.tone === 'ok' ? 'is-ok' : 'is-err'} [margin:0_0_12px]`}
              role={message.tone === 'ok' ? 'status' : 'alert'}
            >
              <Icon name={message.tone === 'ok' ? 'done' : 'failed'} />
              {message.words}
            </p>
          ) : null}
          {madeNewVersion ? (
            <div className="[margin:0_0_16px]">
              <Notice tone="warn" title={QUESTIONS_WORDS.newVersionTitle}>
                {newVersionLine(Math.max(submitted, 1))}
              </Notice>
            </div>
          ) : null}
        </div>
        {rows.length > 0 ? (
          <ul className="xr-rows">
            {rows.map((row, index) => (
              <li
                key={row.questionId}
                className="xr-row items-start"
                id={rowId(row.questionId)}
                tabIndex={-1}
              >
                <div className="xr-row-main items-start">
                  <span className="xl-n" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="xr-row-text">
                    <span className="xr-row-title">{row.text}</span>
                    <span className="xa-qrow-meta">
                      <span className="xa-tag">{row.type}</span>
                      <span>{row.marks}</span>
                      <span className="xr-id">{row.questionId}</span>
                      {row.deletedAt ? (
                        <span className="xl-inline text-ink-3">
                          <Icon name="info" size={16} />
                          {deletedLine(row.deletedAt)}
                        </span>
                      ) : null}
                    </span>
                    {row.newerVersion !== null ? (
                      <span className="xa-qrow-meta text-warn">
                        <Icon name="info" size={16} />
                        {QUESTIONS_WORDS.newerVersion}
                        <Button
                          variant="text"
                          className="min-h-8"
                          busy={busy('update', row.questionId)}
                          onClick={() => pinNewer(row.questionId)}
                        >
                          {QUESTIONS_WORDS.useUpdated}
                        </Button>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="xw-actions flex-none">
                  <span className="xa-order">
                    <IconButton
                      icon="chevronUp"
                      label={moveUpLabel(index + 1)}
                      disabled={index === 0}
                      className={index === 0 ? 'opacity-35' : undefined}
                      onClick={() => move(index, -1)}
                    />
                    <IconButton
                      icon="chevronDown"
                      label={moveDownLabel(index + 1)}
                      disabled={index === rows.length - 1}
                      className={index === rows.length - 1 ? 'opacity-35' : undefined}
                      onClick={() => move(index, 1)}
                    />
                  </span>
                  <Button
                    variant="text"
                    className="min-h-9"
                    aria-label={removeLabel(index + 1)}
                    busy={busy('remove', row.questionId)}
                    onClick={() => remove(row.questionId)}
                  >
                    {QUESTIONS_WORDS.remove}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="xr-section-body">
            <div className="xr-empty">
              <span className="xr-empty-icon">
                <Icon name="questionBank" />
              </span>
              <h3 className="xr-h3 m-0">{QUESTIONS_WORDS.emptyTitle}</h3>
              <p className="xr-body m-0 text-ink-2">{ASSESSMENT_QUESTIONS_EMPTY_LINE}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" onClick={openPanel}>
                  {QUESTIONS_WORDS.addFromBank}
                </Button>
                <Link
                  className="xr-btn xr-btn--secondary"
                  href={newQuestionAddress({
                    experimentId: assessment.experimentId,
                    returnTo: assessmentAddress(assessment.id, 'questions'),
                  })}
                >
                  {QUESTIONS_WORDS.newQuestion}
                </Link>
              </div>
            </div>
          </div>
        )}
        <div className="xr-section-body [padding-top:12px]">
          <p className="xl-meta m-0">{QUESTIONS_WORDS.footNote}</p>
        </div>
      </Section>
      {panelOpen ? (
        <BankPanel
          experiment={experiment}
          bank={bank}
          inAssessment={new Set(refs.map((ref) => ref.questionId))}
          addedId={addedId}
          busyId={pending?.action === 'add' ? pending.questionId : null}
          onAdd={add}
          onClose={closePanel}
        />
      ) : null}
    </div>
  );
}

/** B4-05 f7: "From your question bank · <experiment> · not in this assessment". */
function BankPanel({
  experiment,
  bank,
  inAssessment,
  addedId,
  busyId,
  onAdd,
  onClose,
}: {
  readonly experiment: string;
  readonly bank: ReturnType<typeof useQuestionBank>;
  readonly inAssessment: ReadonlySet<string>;
  readonly addedId: string | null;
  readonly busyId: string | null;
  readonly onAdd: (row: QuestionBankRow) => void;
  readonly onClose: () => void;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    onClose();
  };
  const answer = bank.data;
  const available = answer?.ok
    ? answer.value
        .filter((row) => row.question.deleted === null && !inAssessment.has(row.question.id))
        // The question just written in FA-15 first (state-copy `FA-09.added-from-editor`).
        .toSorted((a, b) => Number(b.question.id === addedId) - Number(a.question.id === addedId))
    : [];
  return (
    <aside className="xr-dpanel" aria-labelledby={PANEL_TITLE_ID} onKeyDown={onKeyDown}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={PANEL_TITLE_ID} className="xr-dpanel-title" tabIndex={-1}>
          {QUESTIONS_WORDS.panelTitle}
        </h2>
        <IconButton icon="close" label={QUESTIONS_WORDS.closePanel} onClick={onClose} />
      </div>
      <span className="xl-meta">{panelMeta(experiment)}</span>
      {bank.isError || (answer && !answer.ok) ? (
        <FailedState title={stateWords('FA-09.bank-failed')} onRetry={() => void bank.refetch()} />
      ) : !answer ? (
        <LoadingState label={stateWords('FA-09.bank-loading')} surface={null} lines={2} />
      ) : available.length > 0 ? (
        <ul className="m-0 p-0 [list-style:none]">
          {available.map((row) => (
            <li
              key={row.question.id}
              className="flex flex-col gap-1.5 [border-top:1px_solid_var(--xr-line)] [padding:12px_0]"
            >
              <span className="font-[600] text-ink">{row.question.text}</span>
              <span className="xr-meta">
                {bankRowSub(
                  row.question.id,
                  QUESTION_TYPE_WORDS[row.question.body.type],
                  marksWords(row.question.marks),
                )}
              </span>
              {row.question.id === addedId ? (
                <span className="xa-save is-ok">
                  <Icon name="done" />
                  {stateWords('FA-09.added-from-editor')}
                </span>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                aria-label={addLabel(row.question.id)}
                busy={busyId === row.question.id}
                onClick={() => onAdd(row)}
              >
                {QUESTIONS_WORDS.add}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="xr-body m-0 text-ink-2">{QUESTIONS_WORDS.panelEmpty}</p>
      )}
    </aside>
  );
}
