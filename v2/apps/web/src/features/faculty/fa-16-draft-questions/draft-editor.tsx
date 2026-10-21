'use client';

import type { ValidationFailed } from '@xr/contracts/draft';
import type { ExperimentId, QuestionDraft, QuestionDraftId } from '@xr/domain';
import { Button, ErrorSummary, FaFormColumn, FaFormFoot, FaFormMessages } from '@xr/ui/v3';
import { type FormEvent, type Ref } from 'react';

import { QUESTION_EDITOR } from '@/copy/question-bank';
import { DRAFT_QUESTIONS } from '@/copy/question-tools';
import { facultySummaryTitle, type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';

import {
  EMPTY_QUESTION,
  QUESTION_FIELDS,
  type QuestionDraft as QuestionValues,
  type QuestionField,
  QuestionFields,
  questionFieldTarget,
} from '../fa-15-question/question-fields';

export type { QuestionValues };

/** The FA-15 fields a draft's review edits. */
export type EditorField = QuestionField;

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

/** The service's words per field (`FA-15.*` keys) for a refused "Add to bank". */
export function editorFieldErrors(error: ValidationFailed): FormFieldError<EditorField>[] {
  return formFieldErrors(error, (path) =>
    QUESTION_FIELDS.has(path) ? (path as EditorField) : null,
  );
}

/**
 * “Review and edit” (state-copy `FA-16.review-edit`): the FA-15 sections inside the draft's card,
 * in place — Question type, Question and answer, Marks and explanation (`QuestionFields`, their
 * headings `h3` under the list's) — with Cancel and “Add to bank”. The values live with the list,
 * so closing keeps what was typed; the service checks them and answers FA-15's words (“Check this
 * question”, which takes focus). The form is named by the draft's words.
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
  /** The draft's words: the form's name. */
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
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <FaFormColumn as="form" bare labelledBy={labelledBy} onSubmit={submit}>
      {errors.length > 0 ? (
        <FaFormMessages stack>
          <ErrorSummary
            spaced
            key={attempt}
            id={`${prefix}-err`}
            title={facultySummaryTitle('FA-15', errors.length)}
            items={errors.map((error) => ({
              fieldId: questionFieldTarget(prefix, error.field, values.type),
              summaryText: error.summaryText,
            }))}
          />
        </FaFormMessages>
      ) : null}
      <QuestionFields
        prefix={prefix}
        values={values}
        errors={errors}
        headingLevel={3}
        textRef={textRef}
        onChange={onChange}
      />
      <FaFormFoot
        start={<Button onClick={onCancel}>{QUESTION_EDITOR.cancel}</Button>}
        end={
          <Button type="submit" busy={busy} busyLabel={QUESTION_EDITOR.saving}>
            {DRAFT_QUESTIONS.addToBank}
          </Button>
        }
      />
    </FaFormColumn>
  );
}
