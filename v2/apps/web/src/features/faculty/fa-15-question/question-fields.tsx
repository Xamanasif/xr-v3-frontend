'use client';

import type { ChoiceKey, QuestionType } from '@xr/domain';
import {
  FaBankAnswerHint,
  FaBankFieldset,
  FaBankOptionRows,
  FaBankStatement,
  FaChoiceGroup,
  FaFormSection,
  Field,
  Textarea,
  TextInput,
} from '@xr/ui/v3';
import type { Ref } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import {
  correctLabel,
  optionLabel,
  QUESTION_EDITOR,
  QUESTION_TYPE_LINES,
} from '@/copy/question-bank';
import type { FormFieldError } from '@/queries/faculty-forms';

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

/** Nothing chosen and nothing typed (the export's new question: the type starts empty). */
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

/** The fields the service checks and answers with words (`FA-15.*` keys). */
export type QuestionField = 'type' | 'text' | 'options' | 'correct' | 'marks';
export const QUESTION_FIELDS: ReadonlySet<string> = new Set([
  'type',
  'text',
  'options',
  'correct',
  'marks',
]);

/**
 * The ids of a form's fields (`<prefix>-type`, `-text`, `-opts`, `-correct`, `-marks`; the
 * options `-o0` … `-o3`, their Correct radios `-c0` … `-c3`).
 */
export function questionFieldIds(prefix: string) {
  return {
    type: `${prefix}-type`,
    text: `${prefix}-text`,
    options: `${prefix}-opts`,
    correct: `${prefix}-correct`,
    marks: `${prefix}-marks`,
    guidance: `${prefix}-guide`,
    explanation: `${prefix}-expl`,
  } as const;
}

/**
 * Where an error's summary link takes focus: the field, the options' group, and for “Choose the
 * correct answer” the first Correct radio of a choice question (the export's `fa-qe-c0`) or the
 * true-or-false group.
 */
export function questionFieldTarget(
  prefix: string,
  field: QuestionField,
  type: QuestionType | null,
): string {
  const ids = questionFieldIds(prefix);
  if (field === 'correct' && type === 'multiple-choice') return `${prefix}-c0`;
  return ids[field];
}

/**
 * The editor's three sections (the export's FA-15 `div.fa-fsec` ×3): Question type (three cards;
 * nothing chosen for a new question), Question and answer (the words, then the chosen type's
 * answer — Answer options A–D with one Correct, “The statement is” True / False, or Marking
 * guidance — or “Choose the question type to set its answer.”), Marks and explanation. FA-15's
 * form and a draft's review fields (FA-14, FA-16) draw them alike; the caller checks nothing — the
 * service answers the words, and typing in a field clears its error.
 */
export function QuestionFields({
  prefix,
  values,
  errors,
  headingLevel = 2,
  textRef,
  onChange,
}: {
  /** The fields' ids' prefix: `qe` (FA-15), or a draft's own. */
  readonly prefix: string;
  readonly values: QuestionDraft;
  readonly errors: readonly FormFieldError<QuestionField>[];
  /** The sections' headings: `h2` on FA-15, `h3` in a draft's card. */
  readonly headingLevel?: 2 | 3;
  readonly textRef?: Ref<HTMLTextAreaElement>;
  readonly onChange: (patch: Partial<QuestionDraft>, ...cleared: QuestionField[]) => void;
}) {
  const ids = questionFieldIds(prefix);
  const errorOf = (field: QuestionField) => errors.find((error) => error.field === field)?.message;
  const optionsError = errorOf('options');
  const correctError = errorOf('correct');
  return (
    <>
      <FaFormSection>
        <FaChoiceGroup
          legend={QUESTION_EDITOR.type}
          legendHint={QUESTION_EDITOR.typeHint}
          id={ids.type}
          name={`${prefix}-ty`}
          options={QUESTION_TYPES.map((type) => ({
            value: type,
            title: QUESTION_TYPE_WORDS[type],
            description: QUESTION_TYPE_LINES[type],
          }))}
          value={values.type}
          onChange={(type) => onChange({ type }, 'type', 'options', 'correct')}
          error={errorOf('type')}
        />
      </FaFormSection>
      <FaFormSection title={QUESTION_EDITOR.answerSection} headingLevel={headingLevel}>
        <Field id={ids.text} label={QUESTION_EDITOR.text} error={errorOf('text')}>
          <Textarea
            ref={textRef}
            value={values.text}
            onChange={(event) => onChange({ text: event.target.value }, 'text')}
          />
        </Field>
        {values.type === null ? (
          <FaBankAnswerHint>{QUESTION_EDITOR.chooseTypeFirst}</FaBankAnswerHint>
        ) : null}
        {values.type === 'multiple-choice' ? (
          <FaBankFieldset
            id={ids.options}
            legend={QUESTION_EDITOR.options}
            legendHint={QUESTION_EDITOR.optionsHint}
            errors={[
              ...(optionsError ? [{ id: `${ids.options}-e`, text: optionsError }] : []),
              ...(correctError ? [{ id: `${ids.correct}-e`, text: correctError }] : []),
            ]}
          >
            <FaBankOptionRows
              name={`${prefix}-correct-choice`}
              correctWord={QUESTION_EDITOR.correct}
              rows={CHOICES.map((choice, index) => ({
                id: `${prefix}-o${index}`,
                label: optionLabel(choice),
                value: values.options[choice],
                invalid:
                  optionsError !== undefined && index < 2 && values.options[choice].trim() === '',
                onChange: (value) =>
                  onChange({ options: { ...values.options, [choice]: value } }, 'options'),
                correctId: `${prefix}-c${index}`,
                correctName: correctLabel(choice),
                checked: values.correctChoice === choice,
                onPick: () => onChange({ correctChoice: choice }, 'correct'),
              }))}
            />
          </FaBankFieldset>
        ) : null}
        {values.type === 'true-false' ? (
          <FaBankFieldset
            id={ids.correct}
            legend={QUESTION_EDITOR.statementIs}
            errors={correctError ? [{ id: `${ids.correct}-e`, text: correctError }] : []}
          >
            <FaBankStatement
              name={`${prefix}-tf`}
              idPrefix={`${prefix}-tf`}
              options={[
                { value: 'true', label: QUESTION_EDITOR.true },
                { value: 'false', label: QUESTION_EDITOR.false },
              ]}
              value={values.statement}
              onChange={(statement) => onChange({ statement }, 'correct')}
            />
          </FaBankFieldset>
        ) : null}
        {values.type === 'written' ? (
          <Field
            id={ids.guidance}
            label={QUESTION_EDITOR.guidance}
            hint={QUESTION_EDITOR.guidanceHint}
          >
            <Textarea
              value={values.guidance}
              onChange={(event) => onChange({ guidance: event.target.value })}
            />
          </Field>
        ) : null}
      </FaFormSection>
      <FaFormSection title={QUESTION_EDITOR.marksSection} headingLevel={headingLevel}>
        <Field
          id={ids.marks}
          label={QUESTION_EDITOR.marks}
          hint={QUESTION_EDITOR.marksHint}
          error={errorOf('marks')}
        >
          <TextInput
            short
            inputMode="numeric"
            autoComplete="off"
            value={values.marks}
            onChange={(event) => onChange({ marks: event.target.value }, 'marks')}
          />
        </Field>
        <Field
          id={ids.explanation}
          label={QUESTION_EDITOR.explanation}
          hint={QUESTION_EDITOR.explanationHint}
        >
          <Textarea
            value={values.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
          />
        </Field>
      </FaFormSection>
    </>
  );
}
