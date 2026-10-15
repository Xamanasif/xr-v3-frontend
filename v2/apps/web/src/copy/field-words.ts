/**
 * The words of the field errors whose rule no board draws but a screen must still show (VD-12):
 * the catalogue gives them no words (`message: null`), so the state-copy register supplies its
 * provisional words. Package 2B: the sample-mode identity safeguard (PC-49) on IA-10 and SA-07.
 */
import { stateWords } from './state-copy';

const UNDRAWN_FIELD_WORDS: Readonly<Record<string, () => string>> = {
  'IA-10.institutionEmail.identity-taken': () => stateWords('IA-10.identity-taken'),
  'SA-07.workEmail.identity-taken': () => stateWords('SA-07.identity-taken'),
};

/** A field error's words: the drawn message, else the register's provisional words, else none. */
export function fieldWords(error: {
  readonly key: string;
  readonly message: string | null;
}): string | null {
  return error.message ?? UNDRAWN_FIELD_WORDS[error.key]?.() ?? null;
}
