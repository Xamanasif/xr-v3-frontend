/**
 * The Faculty forms' checks and error words (Phase 4A; B4-04, B4-06, B4-07), on the contract's own
 * schemas and message catalogue — features import contracts for types only (Appendix F §3.8), so
 * the runtime pieces they need live here: a step of FA-07 checked before anything is sent (the
 * same `createAssessmentInput` rules and message keys the service answers with), FA-15's
 * question checked likewise, the drawn summary titles, and a `validation-failed` answer turned
 * into each field's drawn words.
 */
import {
  addQuestionInput,
  createAssessmentInput,
  editQuestionInput,
  parseInput,
  summaryTitleFor,
  toErrorSummary,
  type ValidationFailed,
} from '@xr/contracts/draft';

import { fieldWords } from '@/copy/field-words';
import { stateWords } from '@/copy/state-copy';

/** One field's drawn error, with the words its summary link uses. */
export interface FormFieldError<F extends string> {
  readonly field: F;
  readonly message: string;
  readonly summaryText: string;
}

/**
 * The service's drawn words per field, in the order it reports them. `fieldOf` maps an input path
 * (`rules.passMarkPercent`) to the form's field; paths it does not know are left out. `undrawn`
 * supplies the register's words for a rule no board words.
 */
export function formFieldErrors<F extends string>(
  error: ValidationFailed,
  fieldOf: (path: string) => F | null,
  undrawn: (path: string, key: string) => string | null = () => null,
): FormFieldError<F>[] {
  const errors: FormFieldError<F>[] = [];
  const summary = toErrorSummary(error).items;
  error.fieldErrors.forEach((fieldError, index) => {
    const field = fieldOf(fieldError.field);
    const message = fieldWords(fieldError) ?? undrawn(fieldError.field, fieldError.key);
    if (field === null || !message) return;
    if (errors.some((entry) => entry.field === field)) return;
    errors.push({ field, message, summaryText: summary[index]?.summaryText ?? message });
  });
  return errors;
}

/** "Check this step" (B4-04) and "Check this question" (B4-07): the catalogue's titles. */
export function facultySummaryTitle(form: 'FA-07' | 'FA-15', count: number): string {
  return summaryTitleFor(form, count) ?? '';
}

/** The rules form's fields (`RulesFields`). */
export type RulesField =
  'name' | 'introduction' | 'passMark' | 'attempts' | 'deadline' | 'releaseOption' | 'releaseDate';

const RULE_PATHS: Readonly<Record<string, RulesField>> = {
  name: 'name',
  introduction: 'introduction',
  'rules.passMarkPercent': 'passMark',
  'rules.attemptsAllowed': 'attempts',
  'rules.deadline': 'deadline',
  'rules.releaseOption': 'releaseOption',
  'rules.releaseDate': 'releaseDate',
};

/** The rules form's errors from a `validation-failed` answer of create or save settings. */
export function rulesFieldErrors(error: ValidationFailed): FormFieldError<RulesField>[] {
  return formFieldErrors(
    error,
    (path) => RULE_PATHS[path] ?? null,
    // A typed date the page could not read reaches the service as typed (state-copy
    // `FA-shared.date-time-unreadable`): its invalid-input answer gets the register's words.
    (path, key) =>
      key !== 'contract.invalid-input'
        ? null
        : path === 'rules.deadline'
          ? stateWords('FA-shared.deadline-unreadable')
          : path === 'rules.releaseDate'
            ? stateWords('FA-shared.release-date-unreadable')
            : null,
  );
}

/**
 * FA-07's input checked as the service will check it (`createAssessmentInput`, form FA-07):
 * `null` when it would be accepted, else the `validation-failed` the service would answer — a
 * step shows only its own fields' errors from it. Nothing is sent and nothing is decided here.
 */
export function checkCreateAssessment(input: unknown): ValidationFailed | null {
  const parsed = parseInput(createAssessmentInput, input, 'FA-07');
  return parsed.ok ? null : parsed.error;
}

/** FA-15's question checked as `addQuestion` / `editQuestion` will check it (form FA-15). */
export function checkQuestion(input: unknown, editing: boolean): ValidationFailed | null {
  const parsed = parseInput(editing ? editQuestionInput : addQuestionInput, input, 'FA-15');
  return parsed.ok ? null : parsed.error;
}
