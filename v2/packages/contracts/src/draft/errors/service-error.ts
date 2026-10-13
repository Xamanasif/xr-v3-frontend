/**
 * The one result type and the one error union of every port (ADR-0008 decision 2; Appendix F
 * §6.5, X-2 reconciled): `Result<T, E>` is `{ ok: true, value, changed }` or `{ ok: false, error }`.
 * A refusal writes nothing. "Read-only" and "not available" are view-model modes plus `refused`
 * codes, not separate errors. Callers never pass their own role (Appendix C §3.0 rule 1).
 */
import type { NotPermittedWhy, RecordRef, RefusalCode } from '@xr/domain';
import { z } from 'zod';

import { recordRef } from '../kernel/primitives.js';
import { type MessageKey, MESSAGE_KEYS } from './messages.js';

export const SERVICE_ERROR_KINDS = [
  'not-signed-in',
  'not-permitted',
  'not-found',
  'invalid-state',
  'refused',
  'validation-failed',
  'stale-version',
  'conflict',
  'policy-open',
  'unavailable',
] as const;

export type ServiceErrorKind = (typeof SERVICE_ERROR_KINDS)[number];

export const NOT_PERMITTED_WHY = [
  'wrong-workspace',
  'out-of-scope',
  'not-own-record',
] as const satisfies readonly NotPermittedWhy[];

export const CONFLICT_CODES = ['duplicate', 'already-sent', 'already-exists'] as const;
export type ConflictCode = (typeof CONFLICT_CODES)[number];

/**
 * A field error a form shows beside the field and in its error summary (Appendix F §6.6).
 * `message` is the exact drawn copy, or `null` when no board draws words for the rule (no copy is
 * invented; the key is always present).
 */
export interface FieldError {
  /** The input path of the field, dot-separated: `email`, `term.endsOn`, `ratings.2`. */
  readonly field: string;
  readonly key: MessageKey;
  readonly message: string | null;
  /** Values filled into the drawn words (`{name}` → `params.name`). */
  readonly params: Readonly<Record<string, string>>;
}

/** No signed-in person (→ sign-in with `returnTo`). Added by ADR-0008 to the Appendix C union. */
export interface NotSignedIn {
  readonly kind: 'not-signed-in';
}
/** Wrong workspace · out of scope · not one's own record (→ XS-06, or the action is absent). */
export interface NotPermitted {
  readonly kind: 'not-permitted';
  readonly why: NotPermittedWhy;
}
/** Unknown or not visible to this reader (→ the board-08 not-found pattern). */
export interface NotFound {
  readonly kind: 'not-found';
}
/** The record has moved on (→ refetch and render its current drawn state). */
export interface InvalidState {
  readonly kind: 'invalid-state';
  readonly current: string;
}
/** A drawn refusal with drawn words (`REFUSALS`). */
export interface Refused<C extends RefusalCode = RefusalCode> {
  readonly kind: 'refused';
  readonly code: C;
}
/** Field errors plus the form's drawn error-summary title, if it has one. */
export interface ValidationFailed {
  readonly kind: 'validation-failed';
  readonly fieldErrors: readonly FieldError[];
  readonly summaryTitle: string | null;
}
/** `expectedRev` did not match the record's `rev`. */
export interface StaleVersion {
  readonly kind: 'stale-version';
  readonly currentRev: number;
}
export interface Conflict<C extends ConflictCode = ConflictCode> {
  readonly kind: 'conflict';
  readonly code: C;
}
/** An undecided product rule was reached; it names the decision. Nothing is written. */
export interface PolicyOpen<D extends string = string> {
  readonly kind: 'policy-open';
  readonly decision: D;
}
/** Failed for now (→ the drawn "failed, try again · Nothing was lost" state). */
export interface Unavailable {
  readonly kind: 'unavailable';
}

export type ServiceError =
  | NotSignedIn
  | NotPermitted
  | NotFound
  | InvalidState
  | Refused
  | ValidationFailed
  | StaleVersion
  | Conflict
  | PolicyOpen
  | Unavailable;

export interface Success<T> {
  readonly ok: true;
  readonly value: T;
  /** Every record this call wrote; empty for reads. Query invalidation reads the kinds. */
  readonly changed: readonly RecordRef[];
}
export interface Failure<E extends ServiceError = ServiceError> {
  readonly ok: false;
  readonly error: E;
}
export type Result<T, E extends ServiceError = ServiceError> = Success<T> | Failure<E>;

export function success<T>(value: T, changed: readonly RecordRef[] = []): Success<T> {
  return { ok: true, value, changed };
}

export function failure<E extends ServiceError>(error: E): Failure<E> {
  return { ok: false, error };
}

// ---- schemas (the contract suite validates every adapter answer against these) ----

export const fieldErrorSchema = z.object({
  field: z.string().min(1),
  key: z.enum(MESSAGE_KEYS as unknown as [MessageKey, ...MessageKey[]]),
  message: z.string().min(1).nullable(),
  params: z.record(z.string(), z.string()),
});

export function serviceErrorSchemaFor(refusalCodes: readonly [string, ...string[]]) {
  return z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('not-signed-in') }),
    z.object({ kind: z.literal('not-permitted'), why: z.enum(NOT_PERMITTED_WHY) }),
    z.object({ kind: z.literal('not-found') }),
    z.object({ kind: z.literal('invalid-state'), current: z.string().min(1) }),
    z.object({ kind: z.literal('refused'), code: z.enum(refusalCodes) }),
    z.object({
      kind: z.literal('validation-failed'),
      fieldErrors: z.array(fieldErrorSchema).min(1),
      summaryTitle: z.string().min(1).nullable(),
    }),
    z.object({ kind: z.literal('stale-version'), currentRev: z.number().int().min(1) }),
    z.object({ kind: z.literal('conflict'), code: z.enum(CONFLICT_CODES) }),
    z.object({ kind: z.literal('policy-open'), decision: z.string().min(1) }),
    z.object({ kind: z.literal('unavailable') }),
  ]);
}

/** A result envelope schema around a value schema. */
export function resultSchema<V extends z.ZodType, E extends z.ZodType>(value: V, error: E) {
  return z.discriminatedUnion('ok', [
    z.object({ ok: z.literal(true), value, changed: z.array(recordRef) }),
    z.object({ ok: z.literal(false), error }),
  ]);
}
