'use client';

import type { ValidationFailed } from '@xr/contracts/draft';
import type { ChoiceKey, ExperimentId, QuestionDraft, QuestionDraftId } from '@xr/domain';
import { Button, ErrorSummary, Field, FieldError, Textarea, TextInput } from '@xr/ui';
import { type FormEvent, type Ref } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { correctLabel, optionLabel, QUESTION_EDITOR } from '@/copy/question-bank';
import { DRAFT_QUESTIONS } from '@/copy/question-tools';
import { facultySummaryTitle, type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';

import {
  EMPTY_QUESTION,
  type QuestionDraft as QuestionValues,
} from '../fa-15-question/question-form';

const CHOICES: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

/**
 * The summary's links as 24 px targets (WCAG 2.5.8): the drawn 22 px lines put links of a similar
 * length closer than 24 px apart, which axe's target-size check refuses.
 */
export const SUMMARY_TARGETS =
  '[&_li_a]:[display:inline-block] [&_li_a]:[min-height:24px] [&_li_a]:[line-height:24px]';

export type { QuestionValues };

/** The FA-15 fields a draft's review edits (B4-07 f3 … f6). */
export type EditorField = 'type' | 'text' | 'options' | 'correct' | 'marks';
const EDITOR_FIELDS: ReadonlySet<string> = new Set(['type', 'text', 'options', 'correct', 'marks']);

/** A draft as the editor shows it first: its words and answer; the marks are the person's to set. */
export function valuesOf(draft: QuestionDraft): QuestionValues {
  const { body } = draft;
  return {
    type: body.type,
    text: draft.text,
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
    // No suggested marks (OD-B4-12): state-copy `FA-16.marks`.
    marks: '',
    explanation: draft.explanation ?? '',
  };
}

/** `QuestionBankService.addDraftToBank`'s input: the reviewed values, only the type's answer. */
export function addInputOf(draftId: string, experimentId: string, values: QuestionValues) {
  return {
    draftId: draftId as QuestionDraftId,
    experimentId: experimentId as ExperimentId,
    type: values.type,
    text: values.text,
    options: values.type === 'multiple-choice' ? { ...values.options } : {},
    correct:
      values.type === 'multiple-choice'
        ? values.correctChoice
        : values.type === 'true-false'
          ? values.statement
          : null,
    marks: values.marks,
    explanation: values.explanation,
    markingGuidance: values.type === 'written' ? values.guidance : null,
  };
}

/** The service's drawn words per field (`FA-15.*` keys) for a refused "Add to bank". */
export function editorFieldErrors(error: ValidationFailed): FormFieldError<EditorField>[] {
  return formFieldErrors(error, (path) => (EDITOR_FIELDS.has(path) ? (path as EditorField) : null));
}

/**
 * “Review and edit” (state-copy `FA-16.review-edit`): the FA-15 fields under a draft, in place —
 * Question type, Question, the type's answer (Answer options A–D with one Correct, “The statement
 * is” True / False, or Marking guidance), Marks and Explanation — with Cancel and “Add to bank”.
 * The values live with the list, so closing keeps what was typed; the service checks them and
 * answers B4-07's words (“Check this question”, which takes focus).
 */
export function DraftEditor({
  prefix,
  labelledBy,
  values,
  errors,
  attempt,
  busy,
  textRef,
  onChange,
  onCancel,
  onSubmit,
}: {
  /** The ids' prefix, one per draft (`dq-<draftId>`). */
  readonly prefix: string;
  /** The draft's title: the form's name. */
  readonly labelledBy: string;
  readonly values: QuestionValues;
  readonly errors: readonly FormFieldError<EditorField>[];
  /** Bumped on each refused add, so the summary takes focus again. */
  readonly attempt: number;
  readonly busy: boolean;
  readonly textRef?: Ref<HTMLTextAreaElement>;
  readonly onChange: (patch: Partial<QuestionValues>, ...cleared: EditorField[]) => void;
  readonly onCancel: () => void;
  readonly onSubmit: () => void;
}) {
  const ids = {
    type: `${prefix}-type`,
    text: `${prefix}-text`,
    options: `${prefix}-opts`,
    correct: `${prefix}-correct`,
    marks: `${prefix}-marks`,
  } as const satisfies Record<EditorField, string>;
  const errorOf = (field: EditorField) => errors.find((error) => error.field === field)?.message;
  const describedBy = (...list: (string | false | undefined)[]) =>
    list.filter(Boolean).join(' ') || undefined;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form
      className="flex min-w-0 basis-full flex-col gap-5 rounded-[12px] [border:1px_solid_var(--xr-line)] p-5"
      noValidate
      aria-labelledby={labelledBy}
      onSubmit={submit}
    >
      {errors.length > 0 ? (
        <ErrorSummary
          key={attempt}
          id={`${prefix}-err`}
          className={SUMMARY_TARGETS}
          title={facultySummaryTitle('FA-15', errors.length)}
          items={errors.map((error) => ({
            fieldId: ids[error.field],
            summaryText: error.summaryText,
          }))}
        />
      ) : null}
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={ids.type}
        tabIndex={-1}
        aria-describedby={describedBy(errorOf('type') && `${ids.type}-e`, `${ids.type}-h`)}
      >
        <legend className="xr-label mb-2">{QUESTION_EDITOR.type}</legend>
        {errorOf('type') ? <FieldError id={`${ids.type}-e`}>{errorOf('type')}</FieldError> : null}
        <div className="xr-choice-list flex-row flex-wrap">
          {QUESTION_TYPES.map((type) => (
            <label
              key={type}
              className={values.type === type ? 'xr-choice is-checked' : 'xr-choice'}
              htmlFor={`${prefix}-ty-${type}`}
            >
              <input
                type="radio"
                id={`${prefix}-ty-${type}`}
                name={`${prefix}-ty`}
                checked={values.type === type}
                onChange={() => onChange({ type }, 'type')}
              />
              <span>
                <span className="xr-choice-title">{QUESTION_TYPE_WORDS[type]}</span>
              </span>
            </label>
          ))}
        </div>
        <span className="xr-hint mt-1.5 block" id={`${ids.type}-h`}>
          {QUESTION_EDITOR.typeHint}
        </span>
      </fieldset>
      <Field id={ids.text} label={QUESTION_EDITOR.text} error={errorOf('text')}>
        <Textarea
          ref={textRef}
          className="min-h-22"
          value={values.text}
          onChange={(event) => onChange({ text: event.target.value }, 'text')}
        />
      </Field>
      {values.type === 'multiple-choice' ? (
        <fieldset
          className="xr-fieldset m-0 min-w-0 border-0 p-0"
          id={ids.options}
          tabIndex={-1}
          aria-describedby={describedBy(
            ids.correct,
            errorOf('options') && `${ids.options}-e`,
            errorOf('correct') && `${ids.correct}-e`,
          )}
        >
          <legend className="xr-label mb-1">{QUESTION_EDITOR.options}</legend>
          <span className="xr-hint mb-2 block" id={ids.correct} tabIndex={-1}>
            {QUESTION_EDITOR.optionsHint}
          </span>
          {errorOf('options') ? (
            <FieldError id={`${ids.options}-e`}>{errorOf('options')}</FieldError>
          ) : null}
          {errorOf('correct') ? (
            <FieldError id={`${ids.correct}-e`}>{errorOf('correct')}</FieldError>
          ) : null}
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {CHOICES.map((choice, index) => (
              <li
                key={choice}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-2"
              >
                <Field id={`${prefix}-o${index}`} label={optionLabel(choice)}>
                  <TextInput
                    autoComplete="off"
                    value={values.options[choice]}
                    onChange={(event) =>
                      onChange(
                        { options: { ...values.options, [choice]: event.target.value } },
                        'options',
                      )
                    }
                  />
                </Field>
                <label
                  className="xr-check min-h-11 items-center p-0"
                  htmlFor={`${prefix}-c${index}`}
                >
                  <input
                    type="radio"
                    id={`${prefix}-c${index}`}
                    name={`${prefix}-correct-choice`}
                    aria-label={correctLabel(choice)}
                    checked={values.correctChoice === choice}
                    onChange={() => onChange({ correctChoice: choice }, 'correct')}
                  />
                  {QUESTION_EDITOR.correct}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}
      {values.type === 'true-false' ? (
        <fieldset
          className="xr-fieldset m-0 min-w-0 border-0 p-0"
          id={ids.correct}
          tabIndex={-1}
          aria-describedby={describedBy(errorOf('correct') && `${ids.correct}-e`)}
        >
          <legend className="xr-label mb-2">{QUESTION_EDITOR.statementIs}</legend>
          {errorOf('correct') ? (
            <FieldError id={`${ids.correct}-e`}>{errorOf('correct')}</FieldError>
          ) : null}
          <div className="xr-choice-list flex-row flex-wrap">
            {(['true', 'false'] as const).map((value) => (
              <label
                key={value}
                className={values.statement === value ? 'xr-choice is-checked' : 'xr-choice'}
                htmlFor={`${prefix}-tf-${value}`}
              >
                <input
                  type="radio"
                  id={`${prefix}-tf-${value}`}
                  name={`${prefix}-tf`}
                  checked={values.statement === value}
                  onChange={() => onChange({ statement: value }, 'correct')}
                />
                <span>{value === 'true' ? QUESTION_EDITOR.true : QUESTION_EDITOR.false}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {values.type === 'written' ? (
        <Field
          id={`${prefix}-guide`}
          label={QUESTION_EDITOR.guidance}
          marker={QUESTION_EDITOR.optional}
          hint={QUESTION_EDITOR.guidanceHint}
        >
          <Textarea
            className="min-h-24"
            value={values.guidance}
            onChange={(event) => onChange({ guidance: event.target.value })}
          />
        </Field>
      ) : null}
      <Field
        id={ids.marks}
        label={QUESTION_EDITOR.marks}
        hint={QUESTION_EDITOR.marksHint}
        error={errorOf('marks')}
      >
        <TextInput
          className="max-w-[120px]"
          inputMode="numeric"
          autoComplete="off"
          value={values.marks}
          onChange={(event) => onChange({ marks: event.target.value }, 'marks')}
        />
      </Field>
      <Field
        id={`${prefix}-expl`}
        label={QUESTION_EDITOR.explanation}
        marker={QUESTION_EDITOR.optional}
        hint={QUESTION_EDITOR.explanationHint}
      >
        <Textarea
          className="min-h-20"
          value={values.explanation}
          onChange={(event) => onChange({ explanation: event.target.value })}
        />
      </Field>
      <div className="xw-flow-foot">
        <Button variant="text" onClick={onCancel}>
          {QUESTION_EDITOR.cancel}
        </Button>
        <div className="xw-actions">
          <Button variant="secondary" type="submit" busy={busy} busyLabel={QUESTION_EDITOR.saving}>
            {DRAFT_QUESTIONS.addToBank}
          </Button>
        </div>
      </div>
    </form>
  );
}
