/**
 * §3.3 SelectionService (browser session only) — PU-06, PU-07, header. Synchronous; backed by
 * `sessionStorage` with a memory fallback, never a world record (B1-06 "lives in the visitor’s
 * browser session until the request is sent"). Request preparation, never a checkout: no prices,
 * no purchase, no access (SEL-02, SEL-04, SEL-06). Emptied by `submitPublicRequest`.
 */
import type { Selection } from '@xr/domain';
import { z } from 'zod';

import { ids, technology } from '../kernel/primitives.js';
import type {
  Conflict,
  InvalidState,
  NotFound,
  Refused,
  Result,
  ValidationFailed,
} from '../errors/service-error.js';
import type { In } from './common.js';
import { key } from './fields.js';

export const addToSelectionInput = z.object({
  experimentId: ids.in.experiment,
  formats: z
    .array(technology, { error: key('contract.invalid-input') })
    .min(1, { error: key('PU-06.formats.choose-one') }),
});

/** An empty list is the drawn refusal `last-format-locked`, not a validation error (B1-06). */
export const setSelectionFormatsInput = z.object({
  experimentId: ids.in.experiment,
  formats: z.array(technology, { error: key('contract.invalid-input') }),
});

export type AddToSelectionInput = In<typeof addToSelectionInput>;
export type SetSelectionFormatsInput = In<typeof setSelectionFormatsInput>;

/**
 * Appendix C's unions plus what the WP-0.9 decisions answer: a format that is not published
 * (`format-not-published`), an experiment already chosen (`conflict: already-exists`), and an
 * experiment that is not in the selection (`invalid-state: not-in-selection`).
 */
export interface SelectionService {
  get(): Selection;
  add(
    input: AddToSelectionInput,
  ): Result<
    Selection,
    ValidationFailed | NotFound | Refused<'format-not-published'> | Conflict<'already-exists'>
  >;
  setFormats(
    input: SetSelectionFormatsInput,
  ): Result<
    Selection,
    | ValidationFailed
    | Refused<'last-format-locked' | 'format-not-published'>
    | NotFound
    | InvalidState
  >;
  remove(experimentId: In<typeof ids.in.experiment>): Result<Selection, NotFound | InvalidState>;
  undoRemove(): Result<Selection, InvalidState>;
}
