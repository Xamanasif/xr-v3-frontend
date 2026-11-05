/**
 * The words of the field errors whose rule no board draws but a screen must still show (VD-12):
 * the catalogue gives them no words (`message: null`), so the state-copy register supplies its
 * provisional words. Package 2B: the sample-mode identity safeguard (PC-49) on IA-10 and SA-07;
 * B2B milestone I1 (C2): PU-08's "Until a fixed date" end date later than today.
 */
import { stateWords } from './state-copy';

const UNDRAWN_FIELD_WORDS: Readonly<Record<string, () => string>> = {
  'IA-10.institutionEmail.identity-taken': () => stateWords('IA-10.identity-taken'),
  'SA-07.workEmail.identity-taken': () => stateWords('SA-07.identity-taken'),
  'PU-08.term.endsOn.after-today': () => stateWords('PU-08.end-date-after-today'),
};

/** A field error's words: the drawn message, else the register's provisional words, else none. */
export function fieldWords(error: {
  readonly key: string;
  readonly message: string | null;
}): string | null {
  return error.message ?? UNDRAWN_FIELD_WORDS[error.key]?.() ?? null;
}
