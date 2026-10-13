/**
 * Input-field helpers of the DTO schemas. Every message a schema reports is a catalogue KEY
 * (`messages.ts`), checked at compile time by `key()`.
 */
import { WHOLE_NUMBER_FROM_ONE } from '@xr/validation';
import { z } from 'zod';

import type { MessageKey } from '../errors/messages.js';

/** A catalogue key, checked at compile time. */
export const key = (value: MessageKey): MessageKey => value;

/**
 * A choice the form may leave unanswered (`null`): required, reported with `required`. The inner
 * schema reports `required` itself when the value is absent (give it `{ error: required }`), and a
 * union picked by its `kind` reports its own branch's fields. The accepted value is never `null` —
 * no choice is ever made for the person.
 */
export function requiredChoice<S extends z.ZodType>(schema: S, required: MessageKey) {
  return schema.nullable().transform((value, context): NonNullable<z.output<S>> => {
    if (value === null) {
      context.addIssue({ code: 'custom', message: required });
      return z.NEVER;
    }
    return value as NonNullable<z.output<S>>;
  });
}

/** A whole number exactly as a board checks it, without trimming (B1-11 `String(lic)`). */
export function wholeNumberUntrimmed(formatKey: MessageKey) {
  return z
    .string({ error: formatKey })
    .regex(WHOLE_NUMBER_FROM_ONE, { error: formatKey })
    .transform((value) => Number(value));
}
