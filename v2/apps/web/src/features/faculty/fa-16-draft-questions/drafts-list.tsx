'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { QuestionDraft } from '@xr/domain';
import { Button, FailedState, Icon, Link, LoadingState, Notice } from '@xr/ui';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS } from '@/copy/assessment-words';
import {
  addDraftLabel,
  addedToBank,
  BANK_TOOLS,
  DRAFT_QUESTIONS,
  discardDraftLabel,
  leftToReview,
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

/** Where the list is drawn: FA-16's "Drafts to review" (B4-08 f1) or FA-14's Drafts tab (B4-07 f1). */
export type DraftsListPlace = 'draft-page' | 'bank';

interface Message {
  readonly tone: 'ok' | 'err';
  readonly text: string;
}

/** A draft added to the bank on this visit (FA-16 keeps it in place: `d.added`). */
interface AddedDraft {
  readonly draft: QuestionDraft;
  readonly questionId: string;
}

/** The stand-in note (state-copy `FA-16.sample-stand-in`): the drafts are fixed samples. */
export function SampleDraftsNote({ className }: { readonly className?: string }) {
  return (
    <Notice tone="quiet" role="note" className={className}>
      {stateWords('FA-16.sample-stand-in')}
    </Notice>
  );
}

/**
 * The Faculty member's drafts for one experiment, each “Draft — needs your review” and “Drafted
 * with assistance”, with “Review and edit” (the FA-15 fields in place), “Add to bank”
 * (`addDraftToBank` with the reviewed fields) and “Discard” (`discardDraft`) — B4-08 f1 on FA-16,
 * B4-07 f1 on FA-14's Drafts tab. Drafts are adapter state: the list is read again after each
 * command. The drawn message (“Added to your question bank as Q-0107.”, “Draft discarded. …”)
 * takes focus. A draft has no marks (state-copy `FA-16.marks`): its type alone is shown, and
 * adding one without marks opens its fields with the drawn marks error.
 */
export function DraftsList({
  place,
  experimentId,
  headingRef,
  onDraftMore,
}: {
  readonly place: DraftsListPlace;
  readonly experimentId: string;
  /** FA-16 focuses the heading once the drafts arrive (`focus(pid + '-lh')`). */
  readonly headingRef?: Ref<HTMLHeadingElement>;
  /** FA-16's “Draft more” (back to the form). */
  readonly onDraftMore?: () => void;
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
      say({ tone: 'err', text: stateWords('FA-16.draft-gone') });
      return;
    }
    say({ tone: 'err', text: stateWords('FA-16.draft-unavailable') });
  };
  const unavailable = () => say({ tone: 'err', text: stateWords('FA-16.draft-unavailable') });

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
          await drafts.refetch();
          say({ tone: 'ok', text: addedToBank(answer.value.id) });
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
          await drafts.refetch();
          say({
            tone: 'ok',
            text: place === 'draft-page' ? DRAFT_QUESTIONS.discarded : BANK_TOOLS.discarded,
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

  // FA-16 keeps the drafts added on this visit in place (`d.added`); in id order, as requested.
  const rows: readonly { readonly draft: QuestionDraft; readonly questionId: string | null }[] = [
    ...(waiting ?? []).map((draft) => ({ draft, questionId: null })),
    ...added
      .filter((entry) => !waiting?.some((draft) => draft.id === entry.draft.id))
      .map((entry) => ({ draft: entry.draft, questionId: entry.questionId })),
  ].sort((a, b) => (a.draft.id < b.draft.id ? -1 : a.draft.id > b.draft.id ? 1 : 0));

  let body: ReactNode;
  if (failed) {
    body = (
      <div className="px-6 pb-6">
        <FailedState
          title={stateWords('FA-16.drafts-failed')}
          onRetry={() => void drafts.refetch()}
        >
          {stateWords('FA-14.failed.line')}
        </FailedState>
      </div>
    );
  } else if (waiting === null) {
    body = (
      <LoadingState
        label={stateWords('FA-16.drafts-loading')}
        surface={null}
        className="px-6 pb-6"
      />
    );
  } else if (place === 'bank' && rows.length === 0) {
    body = (
      <div className="xr-section-body">
        <div className="xr-empty">
          <span className="xr-empty-icon bg-ok-bg text-ok">
            <Icon name="done" />
          </span>
          <h3 className="xr-h3 m-0">{BANK_TOOLS.noDraftsTitle}</h3>
          <p className="xr-body m-0 text-ink-2">{BANK_TOOLS.noDraftsLine}</p>
          <div className="flex flex-wrap gap-3">
            <Link className="xr-btn xr-btn--secondary" href={draftQuestionsAddress(experimentId)}>
              {BANK_TOOLS.draftWithAssistance}
            </Link>
          </div>
        </div>
      </div>
    );
  } else {
    body = (
      <ul className="xr-rows">
        {rows.map(({ draft, questionId }) => {
          const prefix = `${ids.prefix}-${draft.id}`;
          const titleId = `${prefix}-t`;
          const isOpen = questionId === null && open.has(draft.id);
          const busy = pending === draft.id;
          return (
            <li key={draft.id} className="xr-row items-start">
              <div className="xr-row-main items-start">
                <span className="xr-row-icon xr-row-icon--info">
                  <Icon name="assist" />
                </span>
                <div className="xr-row-text">
                  <span className="xr-row-title" id={titleId}>
                    {draft.text}
                  </span>
                  <span className="xa-qrow-meta">
                    {questionId === null ? (
                      <>
                        <span className="xa-tag xa-tag--draft">{DRAFT_QUESTIONS.needsReview}</span>
                        <span className="xa-tag">
                          <Icon name="assist" />
                          {DRAFT_QUESTIONS.assisted}
                        </span>
                      </>
                    ) : (
                      <span className="xa-tag bg-ok-bg text-ok">
                        <Icon name="done" />
                        {DRAFT_QUESTIONS.inBank}
                      </span>
                    )}
                    {/* The type alone: a draft has no marks (state-copy `FA-16.marks`). */}
                    <span>{QUESTION_TYPE_WORDS[draft.body.type]}</span>
                  </span>
                </div>
              </div>
              {questionId === null && !isOpen ? (
                <div className="xw-actions">
                  <Button
                    id={`${prefix}-review`}
                    variant="secondary"
                    size="sm"
                    aria-expanded={false}
                    onClick={() => {
                      toggle(draft.id, true);
                      focusOn(`edit:${draft.id}`);
                    }}
                  >
                    {DRAFT_QUESTIONS.reviewEdit}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={addDraftLabel(draft.text)}
                    busy={busy && add.busy}
                    busyLabel={DRAFT_QUESTIONS.addToBank}
                    onClick={() => addToBank(draft)}
                  >
                    {DRAFT_QUESTIONS.addToBank}
                  </Button>
                  <Button
                    variant="text"
                    className="min-h-9"
                    aria-label={discardDraftLabel(draft.text)}
                    busy={busy && discard.busy}
                    busyLabel={DRAFT_QUESTIONS.discard}
                    onClick={() => discardDraft(draft)}
                  >
                    {DRAFT_QUESTIONS.discard}
                  </Button>
                </div>
              ) : null}
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
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className="xr-section" aria-labelledby={ids.heading}>
      <div className="xr-section-head">
        <h2 id={ids.heading} className="xr-h2" tabIndex={-1} ref={headingRef}>
          {DRAFT_QUESTIONS.listTitle}
        </h2>
        {place === 'draft-page' ? (
          <span className="xr-meta" role="status">
            {waiting === null ? '' : leftToReview(waiting.length)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 [padding:0_24px_12px]">
        <p className="xl-open">
          <Icon name="info" size={16} />
          <span>{place === 'draft-page' ? DRAFT_QUESTIONS.listLine : BANK_TOOLS.draftsLine}</span>
        </p>
        <SampleDraftsNote />
      </div>
      <div id={ids.message} ref={messageRef} tabIndex={-1}>
        {message ? (
          <p
            className={`xa-save ${message.tone === 'ok' ? 'is-ok' : 'is-err'} [margin:0_24px_12px]`}
            role="status"
          >
            <Icon name={message.tone === 'ok' ? 'done' : 'failed'} />
            {message.text}
          </p>
        ) : null}
      </div>
      {body}
      {onDraftMore ? (
        <div className="xr-section-body [padding-top:12px]">
          <Button variant="text" onClick={onDraftMore}>
            {DRAFT_QUESTIONS.draftMore}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/** A record without one key. */
function without<T>(record: Readonly<Record<string, T>>, key: string): Readonly<Record<string, T>> {
  const next = { ...record };
  delete next[key];
  return next;
}

/** B4-08 `#Dd-lh`, `#Dd-msg`; B4-07 `#Kb-dh`, `#Kb-msg`. */
const DRAFT_PAGE_IDS = { prefix: 'dq', heading: 'dq-lh', message: 'dq-msg' } as const;
const BANK_IDS = { prefix: 'qbd', heading: 'qb-dh', message: 'qb-dmsg' } as const;
