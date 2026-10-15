/**
 * FA-07's steps as data (B4-04 script `crView`): which step an address names, what each step
 * checks before "Continue" — the contract's own `createAssessmentInput` checked exactly as the
 * service will check it, showing only the step's own fields (`checkCreateAssessment`) — and the
 * typed rules as the "This assessment" panel reads them. Nothing is decided here: the service
 * answers again when the assessment is sent.
 */
import type { CreateOption, QuestionBankRow, ValidationFailed } from '@xr/contracts/draft';
import type { AssessmentRules, ExperimentId, QuestionId } from '@xr/domain';

import { typedDateTimeToInstant } from '@/copy/assessment-words';
import { CHOOSE_EXPERIMENT } from '@/copy/assessments';
import { CREATE_STEPS, type CreateStep } from '@/nav/faculty';
import {
  checkCreateAssessment,
  type FormFieldError,
  formFieldErrors,
  type RulesField,
  rulesFieldErrors,
} from '@/queries/faculty-forms';

import { rulesFieldIds, rulesInputOf, type RulesDraft } from '../shared/rules-fields';
import type { CreateDraft } from './create-draft';

/** The board's id prefix for the flow (`Cc-h`, `Cc-err`, `Cc-exp`, `Cc-name` … `Cc-qs`). */
export const ID_PREFIX = 'Cc';
export const TITLE_ID = `${ID_PREFIX}-h`;
export const ERRORS_ID = `${ID_PREFIX}-err`;

export type CreateField = RulesField | 'experiment' | 'questions';
export type CreateError = FormFieldError<CreateField>;

/** The control each error-summary link focuses (`fieldset#Cc-exp`, `#Cc-pass` … `#Cc-qs`). */
export const FIELD_IDS: Readonly<Record<CreateField, string>> = {
  ...rulesFieldIds(ID_PREFIX),
  experiment: `${ID_PREFIX}-exp`,
  questions: `${ID_PREFIX}-qs`,
};

const STEP_OF_FIELD: Readonly<Record<CreateField, CreateStep>> = {
  experiment: 'experiment',
  name: 'rules',
  introduction: 'rules',
  passMark: 'rules',
  attempts: 'rules',
  deadline: 'rules',
  releaseOption: 'rules',
  releaseDate: 'rules',
  questions: 'questions',
};

export function stepOfField(field: CreateField): CreateStep {
  return STEP_OF_FIELD[field];
}

/** The step the address names (`?step=`); none is step 1. `known` is false for an unknown slug. */
export function stepOf(search: string): { readonly step: CreateStep; readonly known: boolean } {
  const named = new URLSearchParams(search).get('step');
  if (named === null) return { step: 'experiment', known: true };
  const step = CREATE_STEPS.find((candidate) => candidate === named);
  return step ? { step, known: true } : { step: 'experiment', known: false };
}

export function stepNumber(step: CreateStep): number {
  return CREATE_STEPS.indexOf(step) + 1;
}

export function previousStep(step: CreateStep): CreateStep {
  return CREATE_STEPS[Math.max(stepNumber(step) - 2, 0)]!;
}

export function nextStep(step: CreateStep): CreateStep {
  return CREATE_STEPS[Math.min(stepNumber(step), CREATE_STEPS.length - 1)]!;
}

/** The ticked questions that are in the bank, in the bank's order (`FA-07.question-order`). */
export function pickedRows(
  bank: readonly QuestionBankRow[],
  questionIds: readonly string[],
): QuestionBankRow[] {
  return bank.filter((row) => questionIds.includes(row.question.id));
}

/** `createAssessment`'s input, values as typed. */
export function createInput(
  draft: CreateDraft,
  mode: 'create' | 'save-as-draft',
  questionIds: readonly string[],
) {
  return {
    mode,
    experimentId: draft.experimentId as ExperimentId | null,
    ...rulesInputOf(draft.rules),
    questions: questionIds.map((id) => id as QuestionId),
  };
}

/** A `validation-failed` answer as the flow's field errors, in the service's order. */
export function createErrors(error: ValidationFailed): CreateError[] {
  const others = formFieldErrors<CreateField>(error, (path) =>
    path === 'experimentId' ? 'experiment' : path === 'questions' ? 'questions' : null,
  );
  return [
    ...others.filter((entry) => entry.field === 'experiment'),
    ...rulesFieldErrors(error),
    ...others.filter((entry) => entry.field === 'questions'),
  ];
}

/** f8: the chosen experiment already has an assessment (B4-04 `next1`). */
export const EXISTS_ERROR: CreateError = {
  field: 'experiment',
  message: CHOOSE_EXPERIMENT.exists,
  summaryText: CHOOSE_EXPERIMENT.exists,
};

/** The option chosen in step 1, if it is one of the experiments the Faculty member teaches. */
export function chosenOption(
  options: readonly CreateOption[],
  draft: CreateDraft,
): CreateOption | null {
  return options.find((option) => option.experimentId === draft.experimentId) ?? null;
}

/**
 * What "Continue" on a step finds wrong (B4-04 `next1`, `next2`, `next3`): step 1 an experiment
 * (and not one that already has an assessment, f8); step 2 the name and every rule; step 3 a
 * question. Steps 1–3 use the contract's own check for "Create".
 */
export function checkStep(
  step: CreateStep,
  draft: CreateDraft,
  options: readonly CreateOption[],
  picked: readonly string[],
): CreateError[] {
  if (step === 'experiment') {
    const option = chosenOption(options, draft);
    if (option === null) {
      const failed = checkCreateAssessment(
        createInput({ ...draft, experimentId: null }, 'create', picked),
      );
      return failed ? createErrors(failed).filter((entry) => entry.field === 'experiment') : [];
    }
    return option.existingAssessmentId !== null ? [EXISTS_ERROR] : [];
  }
  if (step === 'preview') return [];
  const failed = checkCreateAssessment(createInput(draft, 'create', picked));
  if (!failed) return [];
  return createErrors(failed).filter((entry) => stepOfField(entry.field) === step);
}

/** "Save as draft" (B4-04 `draft`): only a name is needed; typed rules must still read. */
export function checkDraft(draft: CreateDraft, picked: readonly string[]): CreateError[] {
  const failed = checkCreateAssessment(createInput(draft, 'save-as-draft', picked));
  return failed ? createErrors(failed) : [];
}

/**
 * The step an address may show (state-copy `FA-07.step-address`): the first earlier step that is
 * not complete, else the step itself; `null` while it cannot be told yet (the bank is loading).
 */
export function reachableStep(
  step: CreateStep,
  draft: CreateDraft,
  options: readonly CreateOption[],
  picked: readonly string[] | null,
): CreateStep | null {
  for (const earlier of CREATE_STEPS.slice(0, stepNumber(step) - 1)) {
    if (earlier === 'questions' && picked === null) return null;
    if (checkStep(earlier, draft, options, picked ?? []).length > 0) return earlier;
  }
  return step;
}

const NUMBER = /^\d+(?:\.\d+)?$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T/;

/**
 * The rules as typed, for the summary panel (state-copy `FA-07.summary-as-typed`): each rule once
 * it reads as a value ("50.5" reads as 50.5, f3), the rest left out.
 */
export function typedRules(rules: RulesDraft): AssessmentRules {
  const number = (typed: string) => (NUMBER.test(typed.trim()) ? Number(typed.trim()) : null);
  const instant = (typed: string) => {
    const value = typedDateTimeToInstant(typed);
    return INSTANT.test(value) ? (value as NonNullable<AssessmentRules['deadline']>) : null;
  };
  return {
    passMarkPercent: number(rules.passMark),
    attemptsAllowed: number(rules.attempts),
    deadline: instant(rules.deadline),
    release:
      rules.releaseOption === null
        ? null
        : {
            option: rules.releaseOption,
            releaseDate: rules.releaseOption === 'on-date' ? instant(rules.releaseDate) : null,
          },
  };
}
