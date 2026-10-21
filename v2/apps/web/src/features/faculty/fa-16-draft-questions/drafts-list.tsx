'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { ChoiceKey, QuestionDraft } from '@xr/domain';
import {
  Button,
  ButtonLink,
  FaAuthor,
  FaBankHowTo,
  FaBankSideTitle,
  FaDraftAllDone,
  FaDraftCard,
  FaDraftList,
  FaDraftListSurface,
  FaDraftSample,
  FaFormColumn,
  FaFormSection,
  FaPickCount,
  FaQuestionHead,
  FaSide,
  FaSideSection,
  Hint,
  ListState,
  LoadingRows,
  Notice,
} from '@xr/ui/v3';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS } from '@/copy/assessment-words';
import { QUESTION_EDITOR } from '@/copy/question-bank';
import {
  addDraftLabel,
  BANK_TOOLS,
  DRAFT_QUESTIONS,
  discardDraftLabel,
  draftsToReviewWords,
  inBankMetaWords,
  leftToReview,
  reviewDraftLabel,
} from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import { draftQuestionsAddress } from '@/nav/faculty';
import { useQuestionDrafts } from '@/queries/faculty-assessment-work';
import type { FormFieldError } from '@/queries/faculty-forms';
import { useCommand } from '@/queries/use-command';

import {
  addInputOf,
  DraftEditor,
  type EditorField,
  editorFieldErrors,
  type QuestionValues,
  valuesOf,
} from './draft-editor';

const CHOICES: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

/** Where the list is drawn: FA-16's "Drafts to review" or FA-14's Drafts tab. */
export type DraftsListPlace = 'draft-page' | 'bank';

interface Message {
  readonly tone: 'ok' | 'err';
  readonly title: string;
  readonly line?: string;
}

/** A draft added to the bank on this visit (FA-16 keeps it in place: `d.added`). */
interface AddedDraft {
  readonly draft: QuestionDraft;
  readonly questionId: string;
}

/** The stand-in note (state-copy `FA-16.sample-stand-in`): the drafts are fixed samples. */
export function SampleDraftsNote() {
  return <FaDraftSample>{stateWords('FA-16.sample-stand-in')}</FaDraftSample>;
}

/**
 * The Faculty member's drafts for one experiment as review cards, each “Draft — needs your review”
 * and “Drafted with assistance”, with its options and key (or the answer, or the guidance), and
 * “Review and edit” (the FA-15 sections in the card), “Add to bank” (`addDraftToBank` with the
 * reviewed fields) and “Discard” (`discardDraft`), each named by the draft's words — FA-16's
 * “Drafts to review” (a surface of its own, the count “3 drafts left to review”), FA-14's Drafts
 * tab (beside “How review works”, “3 drafts to review”). Drafts are adapter state: the list is read
 * again after each command. The drawn message (“Added to your question bank.”, “Draft discarded.
 * Nothing was added to your bank.”) takes focus. A draft has no marks (state-copy `FA-16.marks`):
 * its type alone is shown, and adding one without marks opens its fields with the drawn marks
 * error.
 */
export function DraftsList({
  place,
  experimentId,
  headingRef,
  requestDone = false,
  onAdded,
  onDiscarded,
}: {
  readonly place: DraftsListPlace;
  readonly experimentId: string;
  /** FA-16 focuses the heading once the drafts arrive (the export's `focusLater('fa-dr-lh')`). */
  readonly headingRef?: Ref<HTMLHeadingElement>;
  /** FA-16: every draft of the request is added or discarded (`DR.allDone`). */
  readonly requestDone?: boolean;
  /** FA-16's side figures: a draft added or discarded on this visit. */
  readonly onAdded?: (draftId: string) => void;
  readonly onDiscarded?: (draftId: string) => void;
}) {
  const ids = place === 'draft-page' ? DRAFT_PAGE_IDS : BANK_IDS;
  const drafts = useQuestionDrafts(experimentId);
  const add = useCommand((ports) => ports.questionBank.addDraftToBank);
  const discard = useCommand((ports) => ports.questionBank.discardDraft);
  const [edits, setEdits] = useState<Readonly<Record<string, QuestionValues>>>({});
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<
    Readonly<Record<string, readonly FormFieldError<EditorField>[]>>
  >({});
  const [attempts, setAttempts] = useState<Readonly<Record<string, number>>>({});
  const [added, setAdded] = useState<readonly AddedDraft[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [focus, setFocus] = useState<{ readonly target: string; readonly count: number }>({
    target: '',
    count: 0,
  });
  const messageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focus.count === 0) return;
    if (focus.target === 'message') messageRef.current?.focus();
    else if (focus.target.startsWith('edit:')) textRef.current?.focus();
    else document.getElementById(focus.target)?.focus();
  }, [focus]);
  const focusOn = (target: string) => setFocus((current) => ({ target, count: current.count + 1 }));
  const say = (next: Message) => {
    setMessage(next);
    focusOn('message');
  };

  const waiting = drafts.data?.ok ? drafts.data.value : null;
  const failed = drafts.isError || (drafts.data !== undefined && !drafts.data.ok);

  const valuesFor = (draft: QuestionDraft) => edits[draft.id] ?? valuesOf(draft);
  const forget = (draftId: string) => {
    setEdits((current) => without(current, draftId));
    setErrors((current) => without(current, draftId));
    setOpen((current) => {
      const next = new Set(current);
      next.delete(draftId);
      return next;
    });
  };
  const toggle = (draftId: string, value: boolean) =>
    setOpen((current) => {
      const next = new Set(current);
      if (value) next.add(draftId);
      else next.delete(draftId);
      return next;
    });

  /** A refusal of add or discard: gone meanwhile → read again; anything else → nothing changed. */
  const refused = (error: ServiceError) => {
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      void drafts.refetch();
      say({ tone: 'err', title: stateWords('FA-16.draft-gone') });
      return;
    }
    say({ tone: 'err', title: stateWords('FA-16.draft-unavailable') });
  };
  const unavailable = () => say({ tone: 'err', title: stateWords('FA-16.draft-unavailable') });

  const addToBank = (draft: QuestionDraft) => {
    if (add.busy || discard.busy) return;
    setPending(draft.id);
    add.run(addInputOf(draft.id, experimentId, valuesFor(draft))).then(
      async (answer) => {
        setPending(null);
        if (answer.ok) {
          forget(draft.id);
          if (place === 'draft-page') {
            setAdded((current) => [...current, { draft, questionId: answer.value.id }]);
          }
          onAdded?.(draft.id);
          await drafts.refetch();
          say(
            place === 'draft-page'
              ? { tone: 'ok', title: DRAFT_QUESTIONS.added }
              : { tone: 'ok', title: BANK_TOOLS.added, line: BANK_TOOLS.addedLine },
          );
          return;
        }
        const error = answer.error;
        if (error.kind === 'validation-failed') {
          // Opens the draft's fields with the drawn words; the summary takes focus.
          const fieldErrors = editorFieldErrors(error);
          setErrors((current) => ({ ...current, [draft.id]: fieldErrors }));
          setAttempts((current) => ({ ...current, [draft.id]: (current[draft.id] ?? 0) + 1 }));
          toggle(draft.id, true);
          return;
        }
        refused(error);
      },
      () => {
        setPending(null);
        unavailable();
      },
    );
  };

  const discardDraft = (draft: QuestionDraft) => {
    if (add.busy || discard.busy) return;
    setPending(draft.id);
    discard.run({ draftId: draft.id }).then(
      async (answer) => {
        setPending(null);
        if (answer.ok) {
          forget(draft.id);
          onDiscarded?.(draft.id);
          await drafts.refetch();
          say({
            tone: 'ok',
            title: place === 'draft-page' ? DRAFT_QUESTIONS.discarded : BANK_TOOLS.discarded,
          });
          return;
        }
        refused(answer.error);
      },
      () => {
        setPending(null);
        unavailable();
      },
    );
  };

  const change = (draft: QuestionDraft, patch: Partial<QuestionValues>, cleared: EditorField[]) => {
    setEdits((current) => ({ ...current, [draft.id]: { ...valuesFor(draft), ...patch } }));
    if (cleared.length > 0) {
      setErrors((current) => ({
        ...current,
        [draft.id]: (current[draft.id] ?? []).filter((error) => !cleared.includes(error.field)),
      }));
    }
  };

  // FA-16 keeps the drafts added on this visit in place (`d.added`); in key order, as requested.
  const rows: readonly { readonly draft: QuestionDraft; readonly questionId: string | null }[] = [
    ...(waiting ?? []).map((draft) => ({ draft, questionId: null })),
    ...added
      .filter((entry) => !waiting?.some((draft) => draft.id === entry.draft.id))
      .map((entry) => ({ draft: entry.draft, questionId: entry.questionId })),
  ].sort((a, b) => (a.draft.id < b.draft.id ? -1 : a.draft.id > b.draft.id ? 1 : 0));

  const messageNotice = message ? (
    <Notice
      id={ids.message}
      ref={messageRef}
      tone={message.tone === 'ok' ? 'ok' : 'warn'}
      space={place === 'draft-page' ? 'above' : undefined}
      icon={message.tone === 'ok' ? undefined : 'alertCircle'}
      role="status"
      title={message.title}
    >
      {message.line}
    </Notice>
  ) : null;

  let body: ReactNode;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('FA-16.drafts-failed')}
        action={
          <Button onClick={() => void drafts.refetch()}>{stateWords('FA-14.try-again')}</Button>
        }
      >
        {stateWords('FA-14.failed.line')}
      </ListState>
    );
  } else if (waiting === null) {
    body = <LoadingRows message={stateWords('FA-16.drafts-loading')} rows={2} cells={[2]} />;
  } else if (place === 'bank' && rows.length === 0) {
    body = (
      <ListState
        kind="empty"
        icon="draft"
        title={BANK_TOOLS.noDraftsTitle}
        action={
          <ButtonLink href={draftQuestionsAddress(experimentId)}>
            {BANK_TOOLS.draftWithAssistance}
          </ButtonLink>
        }
      >
        {BANK_TOOLS.noDraftsLine}
      </ListState>
    );
  } else {
    body = (
      <FaDraftList>
        {rows.map(({ draft, questionId }) => {
          const prefix = `${ids.prefix}-${draft.id}`;
          const titleId = `${prefix}-t`;
          const isOpen = questionId === null && open.has(draft.id);
          const busy = pending === draft.id;
          const type = QUESTION_TYPE_WORDS[draft.body.type];
          const { body: answer } = draft;
          return (
            <FaDraftCard
              key={draft.id}
              state={
                questionId === null
                  ? {
                      kind: 'review',
                      needsReview: DRAFT_QUESTIONS.needsReview,
                      assisted: DRAFT_QUESTIONS.assisted,
                    }
                  : { kind: 'added', inBank: DRAFT_QUESTIONS.inBank }
              }
              // The type alone: a draft has no marks (state-copy `FA-16.marks`).
              meta={questionId === null ? type : inBankMetaWords(type)}
              text={draft.text}
              textId={titleId}
              options={
                questionId === null && answer.type === 'multiple-choice'
                  ? {
                      label: DRAFT_QUESTIONS.optionsLabel,
                      correctWord: DRAFT_QUESTIONS.correct,
                      items: CHOICES.filter((choice) => (answer.options[choice] ?? '').trim()).map(
                        (choice) => ({
                          letter: choice,
                          text: answer.options[choice],
                          correct: answer.correct === choice,
                        }),
                      ),
                    }
                  : null
              }
              keyLine={
                questionId !== null
                  ? null
                  : answer.type === 'true-false'
                    ? {
                        label: DRAFT_QUESTIONS.correctAnswer,
                        value: answer.correct ? QUESTION_EDITOR.true : QUESTION_EDITOR.false,
                      }
                    : answer.type === 'written' && answer.markingGuidance
                      ? { label: DRAFT_QUESTIONS.guidance, value: answer.markingGuidance }
                      : null
              }
              actions={
                questionId === null && !isOpen ? (
                  <>
                    <Button
                      id={`${prefix}-review`}
                      aria-expanded={false}
                      aria-label={reviewDraftLabel(draft.text)}
                      onClick={() => {
                        toggle(draft.id, true);
                        focusOn(`edit:${draft.id}`);
                      }}
                    >
                      {DRAFT_QUESTIONS.reviewEdit}
                    </Button>
                    <Button
                      aria-label={addDraftLabel(draft.text)}
                      busy={busy && add.busy}
                      busyLabel={DRAFT_QUESTIONS.addToBank}
                      onClick={() => addToBank(draft)}
                    >
                      {DRAFT_QUESTIONS.addToBank}
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={discardDraftLabel(draft.text)}
                      busy={busy && discard.busy}
                      busyLabel={DRAFT_QUESTIONS.discard}
                      onClick={() => discardDraft(draft)}
                    >
                      {DRAFT_QUESTIONS.discard}
                    </Button>
                  </>
                ) : undefined
              }
            >
              {isOpen ? (
                <DraftEditor
                  prefix={prefix}
                  labelledBy={titleId}
                  values={valuesFor(draft)}
                  errors={errors[draft.id] ?? []}
                  attempt={attempts[draft.id] ?? 0}
                  busy={busy && add.busy}
                  textRef={focus.target === `edit:${draft.id}` ? textRef : undefined}
                  onChange={(patch, ...cleared) => change(draft, patch, cleared)}
                  onCancel={() => {
                    toggle(draft.id, false);
                    setErrors((current) => without(current, draft.id));
                    focusOn(`${prefix}-review`);
                  }}
                  onSubmit={() => addToBank(draft)}
                />
              ) : null}
            </FaDraftCard>
          );
        })}
      </FaDraftList>
    );
  }

  if (place === 'draft-page') {
    return (
      <FaDraftListSurface
        titleId={ids.heading}
        title={DRAFT_QUESTIONS.listTitle}
        titleRef={headingRef}
        count={waiting === null ? undefined : leftToReview(waiting.length)}
        before={<SampleDraftsNote />}
        line={DRAFT_QUESTIONS.listLine}
      >
        {messageNotice}
        {body}
        {requestDone ? <FaDraftAllDone>{DRAFT_QUESTIONS.allDone}</FaDraftAllDone> : null}
      </FaDraftListSurface>
    );
  }

  return (
    <FaAuthor>
      <FaFormColumn labelledBy={ids.heading}>
        <SampleDraftsNote />
        <FaFormSection>
          <FaQuestionHead
            title={DRAFT_QUESTIONS.listTitle}
            titleId={ids.heading}
            focusable
            aside={
              waiting && waiting.length > 0 ? (
                <FaPickCount>{draftsToReviewWords(waiting.length)}</FaPickCount>
              ) : null
            }
          >
            <Hint>{BANK_TOOLS.draftsLine}</Hint>
          </FaQuestionHead>
          {messageNotice}
          {body}
        </FaFormSection>
      </FaFormColumn>
      <FaSide labelledBy="qb-side">
        <FaSideSection>
          <FaBankSideTitle id="qb-side">{BANK_TOOLS.howTitle}</FaBankSideTitle>
          <FaBankHowTo steps={BANK_TOOLS.how} />
        </FaSideSection>
      </FaSide>
    </FaAuthor>
  );
}

/** A record without one key. */
function without<T>(record: Readonly<Record<string, T>>, key: string): Readonly<Record<string, T>> {
  const next = { ...record };
  delete next[key];
  return next;
}

/** The export's `#fa-dr-lh`, `#fa-msg` on FA-16; FA-14's Drafts tab's own. */
const DRAFT_PAGE_IDS = { prefix: 'dq', heading: 'dq-lh', message: 'dq-msg' } as const;
const BANK_IDS = { prefix: 'qbd', heading: 'qb-dh', message: 'qb-dmsg' } as const;
