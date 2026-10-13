/**
 * From a failed input schema to the drawn field errors a form shows beside each field and in its
 * error summary (Appendix F §6.6; B8-07 "Validation"): one error per field — the first, as the
 * boards show one message per field — each with its rule key, the exact drawn words (or `null`
 * where none are drawn) and the values filled into them.
 */
import type { z } from 'zod';

import {
  isMessageKey,
  type MessageKey,
  messageFor,
  placeholdersOf,
  DRAWN_MESSAGES,
  isDrawn,
  summaryTitleFor,
  type SummaryForm,
} from './messages.js';
import type { FieldError, ValidationFailed } from './service-error.js';

/** A field error for a key, with its drawn words filled in. Missing values throw (a programming error). */
export function fieldError(
  field: string,
  key: MessageKey,
  params: Readonly<Record<string, string>> = {},
): FieldError {
  if (isDrawn(key)) {
    const missing = placeholdersOf(DRAWN_MESSAGES[key].text).filter((name) => !(name in params));
    if (missing.length > 0) {
      throw new Error(`Field error ${key} needs ${missing.map((name) => `{${name}}`).join(', ')}.`);
    }
  }
  return { field, key, message: messageFor(key, params), params };
}

function pathOf(issue: z.core.$ZodIssue): string {
  const path = issue.path.map(String);
  // A union decided by its `kind` (a term, a target) reports the choice on the field itself.
  if (issue.code === 'invalid_union' && path[path.length - 1] === 'kind') path.pop();
  return path.length === 0 ? '(input)' : path.join('.');
}

function paramsOf(issue: z.core.$ZodIssue): Readonly<Record<string, string>> {
  const params = (issue as { params?: Record<string, unknown> }).params;
  if (!params) return {};
  return Object.fromEntries(Object.entries(params).map(([name, value]) => [name, String(value)]));
}

/**
 * Field errors from zod issues. An issue whose message is not a catalogue key (a value of the
 * wrong type reached a port) becomes `contract.invalid-input`, which has no drawn words.
 */
export function fieldErrorsFromIssues(issues: readonly z.core.$ZodIssue[]): FieldError[] {
  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of issues) {
    const field = pathOf(issue);
    if (seen.has(field)) continue;
    seen.add(field);
    const key = isMessageKey(issue.message) ? issue.message : 'contract.invalid-input';
    errors.push(fieldError(field, key, key === 'contract.invalid-input' ? {} : paramsOf(issue)));
  }
  return errors;
}

/** `validation-failed` with the form's drawn summary title for this many errors. */
export function validationFailed(
  fieldErrors: readonly FieldError[],
  form: SummaryForm | null,
): ValidationFailed {
  return {
    kind: 'validation-failed',
    fieldErrors,
    summaryTitle: summaryTitleFor(form, fieldErrors.length),
  };
}

export type Parsed<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ValidationFailed };

/** Parse an input with its schema: the accepted value, or `validation-failed` with drawn words. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
  form: SummaryForm | null,
): Parsed<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: validationFailed(fieldErrorsFromIssues(result.error.issues), form) };
}

/** The error-summary view a form renders (Appendix F §6.6): a title and one linked item per field. */
export interface ErrorSummaryView {
  readonly title: string | null;
  readonly items: readonly {
    readonly field: string;
    readonly message: string | null;
    readonly summaryText: string | null;
  }[];
}

export function toErrorSummary(error: ValidationFailed): ErrorSummaryView {
  return {
    title: error.summaryTitle,
    items: error.fieldErrors.map((item) => {
      const entry = isDrawn(item.key) ? DRAWN_MESSAGES[item.key] : null;
      const summary =
        entry && 'summaryText' in entry && entry.summaryText
          ? entry.summaryText.replace(
              /\{([a-zA-Z]+)\}/g,
              (_, name: string) => item.params[name] ?? `{${name}}`,
            )
          : item.message;
      return { field: item.field, message: item.message, summaryText: summary };
    }),
  };
}
