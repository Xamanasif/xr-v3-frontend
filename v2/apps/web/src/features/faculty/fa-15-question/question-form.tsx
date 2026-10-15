'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { ChoiceKey, ExperimentId, Question, QuestionId, QuestionType } from '@xr/domain';
import { Button, ErrorSummary, Field, FieldError, Link, Notice, Textarea, TextInput } from '@xr/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { correctLabel, optionLabel, QUESTION_EDITOR, savedUsedMessage } from '@/copy/question-bank';
import { stateWords } from '@/copy/state-copy';
import { QUESTION_BANK_ADDRESS, questionBankAddress } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { facultySummaryTitle, type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import { useCommand } from '@/queries/use-command';

import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { BANK_MESSAGE_ID } from '../fa-14-question-bank/question-bank';
import { withAdded } from './return-to';

const CHOICES: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

/** The form's values as typed; each type keeps its own answer fields (`FA-15.type-switch`). */
export interface QuestionDraft {
  readonly type: QuestionType | null;
  readonly text: string;
  readonly options: Readonly<Record<ChoiceKey, string>>;
  readonly correctChoice: ChoiceKey | null;
  readonly statement: 'true' | 'false' | null;
  readonly guidance: string;
  readonly marks: string;
  readonly explanation: string;
}

/** Nothing chosen and nothing typed (B4-07 `qeInit`). */
export const EMPTY_QUESTION: QuestionDraft = {
  type: null,
  text: '',
  options: { A: '', B: '', C: '', D: '' },
  correctChoice: null,
  statement: null,
  guidance: '',
  marks: '',
  explanation: '',
};

/** A bank question's current version, as the form shows it again (f4). */
export function draftOf(question: Question): QuestionDraft {
  const { body } = question;
  return {
    type: body.type,
    text: question.text,
    options:
      body.type === 'multiple-choice'
        ? {
            A: body.options.A ?? '',
            B: body.options.B ?? '',
            C: body.options.C ?? '',
            D: body.options.D ?? '',
          }
        : EMPTY_QUESTION.options,
    correctChoice: body.type === 'multiple-choice' ? body.correct : null,
    statement: body.type === 'true-false' ? (body.correct ? 'true' : 'false') : null,
    guidance: body.type === 'written' ? (body.markingGuidance ?? '') : '',
    marks: String(question.marks),
    explanation: question.explanation ?? '',
  };
}

/** The contract's `QuestionInput` (values as typed): only the chosen type's answer fields. */
function inputOf(experimentId: string, draft: QuestionDraft) {
  return {
    experimentId: experimentId as ExperimentId,
    type: draft.type,
    text: draft.text,
    options: draft.type === 'multiple-choice' ? { ...draft.options } : {},
    correct:
      draft.type === 'multiple-choice'
        ? draft.correctChoice
        : draft.type === 'true-false'
          ? draft.statement
          : null,
    marks: draft.marks,
    explanation: draft.explanation,
    markingGuidance: draft.type === 'written' ? draft.guidance : null,
  };
}

type QuestionField = 'type' | 'text' | 'options' | 'correct' | 'marks';
const QUESTION_FIELDS: ReadonlySet<string> = new Set([
  'type',
  'text',
  'options',
  'correct',
  'marks',
]);

/** The control each error and its summary link point to (B4-07 `#Qe-type`, `#Qe-opts` …). */
const FIELD_IDS: Readonly<Record<QuestionField, string>> = {
  type: 'qe-type',
  text: 'qe-text',
  options: 'qe-opts',
  correct: 'qe-correct',
  marks: 'qe-marks',
};

function questionFieldErrors(error: ValidationFailed): FormFieldError<QuestionField>[] {
  return formFieldErrors(error, (path) =>
    QUESTION_FIELDS.has(path) ? (path as QuestionField) : null,
  );
}

/** How the page around the form learns of an answer it shows itself. */
export type FormOutcome = 'saved' | 'stale' | 'policy-open' | 'gone' | 'deleted';

interface FormNotice {
  readonly tone: 'ok' | 'err';
  readonly text: string;
}

/**
 * The FA-15 form (B4-07 f3 … f8): Question type (three cards, nothing chosen for a new question),
 * Question, the chosen type's answer — Answer options A–D with one "Correct" radio, "The statement
 * is" True / False, or Marking guidance (optional, free text for whoever marks it) — Marks,
 * Explanation (optional), Cancel and "Save question". The service checks the values and answers
 * the drawn words (`FA-15.*` keys; summary "Check this question", which takes focus); typing in a
 * field clears its error. Single correct answer only, three types only, no automatic grading.
 */
export function QuestionForm({
  experimentId,
  initial,
  editing,
  returnTo,
  onOutcome,
}: {
  readonly experimentId: string;
  readonly initial: QuestionDraft;
  /** The question being edited: its ID, the revision read and the assessments that use it. */
  readonly editing: {
    readonly id: string;
    readonly rev: number;
    readonly usedNames: readonly string[];
  } | null;
  readonly returnTo: string | null;
  readonly onOutcome: (outcome: FormOutcome) => void;
}) {
  const navigation = useAppNavigation();
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [errors, setErrors] = useState<readonly FormFieldError<QuestionField>[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [focusNotice, setFocusNotice] = useState(0);
  const [rev, setRev] = useState(editing?.rev ?? 0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const add = useCommand((ports) => ports.questionBank.addQuestion);
  const edit = useCommand((ports) => ports.questionBank.editQuestion);
  const busy = add.busy || edit.busy;
  const bankHref = questionBankAddress(experimentId);

  useEffect(() => {
    if (focusNotice > 0) noticeRef.current?.focus();
  }, [focusNotice]);

  const clear = (...fields: QuestionField[]) =>
    setErrors((current) => current.filter((error) => !fields.includes(error.field)));
  const change = (patch: Partial<QuestionDraft>, ...fields: QuestionField[]) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (fields.length > 0) clear(...fields);
  };
  const errorOf = (field: QuestionField) => errors.find((error) => error.field === field)?.message;
  const say = (next: FormNotice) => {
    setNotice(next);
    setFocusNotice((current) => current + 1);
  };

  const refused = (error: ServiceError) => {
    switch (error.kind) {
      case 'validation-failed':
        setNotice(null);
        setErrors(questionFieldErrors(error));
        setAttempt((current) => current + 1);
        return;
      case 'stale-version':
        onOutcome('stale');
        return;
      case 'policy-open':
        onOutcome('policy-open');
        return;
      case 'invalid-state':
        onOutcome('deleted');
        return;
      case 'not-found':
      case 'not-permitted':
        onOutcome('gone');
        return;
      default:
        say({ tone: 'err', text: stateWords('FA-15.unavailable') });
    }
  };
  // Failed for now: every value stays and the page says it didn't save (`FA-15.unavailable`).
  const unavailable = () => say({ tone: 'err', text: stateWords('FA-15.unavailable') });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input = inputOf(experimentId, draft);
    if (editing === null) {
      add.run(input).then((answer) => {
        if (!answer.ok) return refused(answer.error);
        const id = answer.value.id;
        if (returnTo) {
          navigation.navigate(withAdded(returnTo, id));
          return;
        }
        // Back to the bank, which says it was saved; focus lands on that message (`FA-14.added`).
        noteRouteFocus(QUESTION_BANK_ADDRESS, BANK_MESSAGE_ID);
        const query = new URLSearchParams({ experimentId, added: id });
        navigation.navigate(`${QUESTION_BANK_ADDRESS}?${query.toString()}`);
      }, unavailable);
      return;
    }
    edit.run({ ...input, id: editing.id as QuestionId, expectedRev: rev }).then((answer) => {
      if (!answer.ok) return refused(answer.error);
      setErrors([]);
      setRev(answer.value.question.rev);
      onOutcome('saved');
      if (returnTo) {
        navigation.navigate(returnTo);
        return;
      }
      say({
        tone: 'ok',
        text:
          editing.usedNames.length > 0
            ? savedUsedMessage(editing.usedNames)
            : stateWords('FA-15.saved-edit'),
      });
    }, unavailable);
  };

  const describedBy = (...ids: (string | false | undefined)[]) =>
    ids.filter(Boolean).join(' ') || undefined;

  return (
    <form
      className="xr-section flex flex-col gap-5 p-6"
      noValidate
      aria-label={editing ? QUESTION_EDITOR.editTitle : QUESTION_EDITOR.addTitle}
      onSubmit={submit}
    >
      {errors.length > 0 ? (
        <ErrorSummary
          key={attempt}
          id="qe-err"
          title={facultySummaryTitle('FA-15', errors.length)}
          items={errors.map((error) => ({
            fieldId: FIELD_IDS[error.field],
            summaryText: error.summaryText,
          }))}
        />
      ) : null}
      <div id="qe-saved" ref={noticeRef} tabIndex={-1}>
        {notice ? (
          <Notice
            tone={notice.tone}
            role={notice.tone === 'ok' ? 'status' : 'alert'}
            title={notice.text}
          />
        ) : null}
      </div>
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={FIELD_IDS.type}
        tabIndex={-1}
        aria-describedby={describedBy(errorOf('type') && 'qe-type-e', 'qe-type-h')}
      >
        <legend className="xr-label mb-2">{QUESTION_EDITOR.type}</legend>
        {errorOf('type') ? <FieldError id="qe-type-e">{errorOf('type')}</FieldError> : null}
        <div className="xr-choice-list flex-row flex-wrap">
          {QUESTION_TYPES.map((type) => (
            <label
              key={type}
              className={draft.type === type ? 'xr-choice is-checked' : 'xr-choice'}
              htmlFor={`qe-ty-${type}`}
            >
              <input
                type="radio"
                id={`qe-ty-${type}`}
                name="qe-ty"
                checked={draft.type === type}
                onChange={() => change({ type }, 'type')}
              />
              <span>
                <span className="xr-choice-title">{QUESTION_TYPE_WORDS[type]}</span>
              </span>
            </label>
          ))}
        </div>
        <span className="xr-hint mt-1.5 block" id="qe-type-h">
          {QUESTION_EDITOR.typeHint}
        </span>
      </fieldset>
      <Field id={FIELD_IDS.text} label={QUESTION_EDITOR.text} error={errorOf('text')}>
        <Textarea
          className="min-h-22"
          value={draft.text}
          onChange={(event) => change({ text: event.target.value }, 'text')}
        />
      </Field>
      {draft.type === 'multiple-choice' ? (
        <fieldset
          className="xr-fieldset m-0 min-w-0 border-0 p-0"
          id={FIELD_IDS.options}
          tabIndex={-1}
          aria-describedby={describedBy(
            FIELD_IDS.correct,
            errorOf('options') && 'qe-opts-e',
            errorOf('correct') && 'qe-correct-e',
          )}
        >
          <legend className="xr-label mb-1">{QUESTION_EDITOR.options}</legend>
          <span className="xr-hint mb-2 block" id={FIELD_IDS.correct} tabIndex={-1}>
            {QUESTION_EDITOR.optionsHint}
          </span>
          {errorOf('options') ? <FieldError id="qe-opts-e">{errorOf('options')}</FieldError> : null}
          {errorOf('correct') ? (
            <FieldError id="qe-correct-e">{errorOf('correct')}</FieldError>
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CHOICES.map((choice, index) => (
              <li
                key={choice}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-2"
              >
                <Field id={`qe-o${index}`} label={optionLabel(choice)}>
                  <TextInput
                    autoComplete="off"
                    value={draft.options[choice]}
                    onChange={(event) =>
                      change(
                        { options: { ...draft.options, [choice]: event.target.value } },
                        'options',
                      )
                    }
                  />
                </Field>
                <label className="xr-check min-h-11 items-center p-0" htmlFor={`qe-c${index}`}>
                  <input
                    type="radio"
                    id={`qe-c${index}`}
                    name="qe-correct-choice"
                    aria-label={correctLabel(choice)}
                    checked={draft.correctChoice === choice}
                    onChange={() => change({ correctChoice: choice }, 'correct')}
                  />
                  {QUESTION_EDITOR.correct}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {draft.type === 'true-false' ? (
        <fieldset
          className="xr-fieldset m-0 min-w-0 border-0 p-0"
          id={FIELD_IDS.correct}
          tabIndex={-1}
          aria-describedby={describedBy(errorOf('correct') && 'qe-correct-e')}
        >
          <legend className="xr-label mb-2">{QUESTION_EDITOR.statementIs}</legend>
          {errorOf('correct') ? (
            <FieldError id="qe-correct-e">{errorOf('correct')}</FieldError>
          ) : null}
          <div className="xr-choice-list flex-row flex-wrap">
            {(['true', 'false'] as const).map((value) => (
              <label
                key={value}
                className={draft.statement === value ? 'xr-choice is-checked' : 'xr-choice'}
                htmlFor={`qe-tf-${value}`}
              >
                <input
                  type="radio"
                  id={`qe-tf-${value}`}
                  name="qe-tf"
                  checked={draft.statement === value}
                  onChange={() => change({ statement: value }, 'correct')}
                />
                <span>{value === 'true' ? QUESTION_EDITOR.true : QUESTION_EDITOR.false}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {draft.type === 'written' ? (
        <Field
          id="qe-guide"
          label={QUESTION_EDITOR.guidance}
          marker={QUESTION_EDITOR.optional}
          hint={QUESTION_EDITOR.guidanceHint}
        >
          <Textarea
            className="min-h-24"
            value={draft.guidance}
            onChange={(event) => change({ guidance: event.target.value })}
          />
        </Field>
      ) : null}
      <Field
        id={FIELD_IDS.marks}
        label={QUESTION_EDITOR.marks}
        hint={QUESTION_EDITOR.marksHint}
        error={errorOf('marks')}
      >
        <TextInput
          className="max-w-[120px]"
          inputMode="numeric"
          autoComplete="off"
          value={draft.marks}
          onChange={(event) => change({ marks: event.target.value }, 'marks')}
        />
      </Field>
      <Field
        id="qe-expl"
        label={QUESTION_EDITOR.explanation}
        marker={QUESTION_EDITOR.optional}
        hint={QUESTION_EDITOR.explanationHint}
      >
        <Textarea
          className="min-h-20"
          value={draft.explanation}
          onChange={(event) => change({ explanation: event.target.value })}
        />
      </Field>
      <div className="xw-flow-foot">
        <Link className="xr-btn xr-btn--text" href={returnTo ?? bankHref}>
          {QUESTION_EDITOR.cancel}
        </Link>
        <div className="xw-actions">
          <Button variant="primary" type="submit" busy={busy} busyLabel={QUESTION_EDITOR.saving}>
            {QUESTION_EDITOR.save}
          </Button>
        </div>
      </div>
    </form>
  );
}
