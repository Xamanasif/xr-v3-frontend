/**
 * One method-ledger entry, and the compile-time checks that tie it to its port signature: the
 * declared error kinds and refusal codes are exactly those of the signature, the input schema's
 * input side is exactly the parameter, and the output schema's output side is exactly the success
 * value. A port or schema that drifts from its ledger entry breaks the build.
 */
import type { ActionId, ReadTarget, RefusalCode } from '@xr/domain';
import type { z } from 'zod';

import type { DeepReadonly, Equals, SameShape } from '../kernel/typed.js';
import type { SummaryForm } from '../errors/messages.js';
import type { ServiceErrorKind } from '../errors/service-error.js';

/**
 * When the sample world implements a method (Appendix F §4.1): `WP-0.11` for the Phase-0 method
 * set the flow suites and Phase-0 screens need; otherwise the phase that builds its screen.
 */
export type ImplementationPhase = 'WP-0.11' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export type BuildPhase = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

/** A domain check the adapter evaluates: a policy action, or what a read shows (`canRead`). */
export type PolicyCheck =
  | ActionId
  | `read:${ReadTarget['kind']}`
  | 'read:own-session'
  | 'read:catalogue'
  | 'read:browser-session';

export interface LedgerEntry {
  /** A `preview` validates and answers like a command but writes nothing (Appendix C rule 3). */
  readonly kind: 'command' | 'read' | 'preview';
  /** The schema of the method's one argument; `null` for a method that takes none. */
  readonly input: z.ZodType | null;
  /** The schema of the success value. */
  readonly output: z.ZodType;
  readonly mock: ImplementationPhase;
  /** The screens that call it (Appendix C §3 tables). */
  readonly screens: readonly string[];
  readonly errors: readonly ServiceErrorKind[];
  readonly refusals: readonly RefusalCode[];
  /** Undecided rules the method may reach, answered `policy-open` with these decision ids. */
  readonly open: readonly string[];
  /**
   * The domain checks the adapter runs with the actor, records and scope it resolves itself. Where
   * several are listed, each applies to its own case — the one the record or the input selects
   * (for example `web.launch` for a first launch and `web.continue` after it, or
   * `request.set-route` only for a new institution's first request) — and the entry's note names
   * the case where it is not plain from the check. They are never all run at once.
   */
  readonly policy: readonly PolicyCheck[];
  /** The form whose drawn error-summary title a `validation-failed` carries. */
  readonly form: SummaryForm | null;
  /** The drawn "failed, try again" frame for this method, where one exists. */
  readonly failureFrame: string | null;
  /** Where the contract follows WP-0.9 or ADR-0008 instead of the Appendix C proposal. */
  readonly note?: string;
}

type Answered<F> = F extends (...args: never[]) => infer R ? Awaited<R> : never;
// Distributive helpers: a `never` error union stays `never` (a non-distributive check would infer `unknown`).
type ErrorIn<A> = A extends { readonly ok: false; readonly error: infer E } ? E : never;
/** A `Result` answers its value; a method that answers plainly (`SelectionService.get`) answers itself. */
type ValueIn<A> = A extends { readonly ok: true; readonly value: infer V }
  ? V
  : A extends { readonly ok: false }
    ? never
    : A;
type KindIn<E> = E extends { readonly kind: infer K } ? K : never;
type CodeIn<E> = E extends { readonly kind: 'refused'; readonly code: infer C } ? C : never;
export type ErrorOf<F> = ErrorIn<Answered<F>>;
export type ValueOf<F> = ValueIn<Answered<F>>;
export type ErrorKindsOf<F> = KindIn<ErrorOf<F>>;
export type RefusalCodesOf<F> = CodeIn<ErrorOf<F>>;
type ParameterOf<F> = F extends (...args: infer A) => unknown ? A : never;

type InputCheck<F, I> =
  ParameterOf<F> extends []
    ? I extends null
      ? unknown
      : { readonly inputMismatch: 'the method takes no argument; input must be null' }
    : I extends z.ZodType
      ? SameShape<z.input<I>, ParameterOf<F>[0]> extends true
        ? unknown
        : {
            readonly inputMismatch: {
              readonly schema: DeepReadonly<z.input<I>>;
              readonly parameter: ParameterOf<F>[0];
            };
          }
      : { readonly inputMismatch: 'the method takes an argument; input must be its schema' };

type OutputCheck<F, O> = O extends z.ZodType
  ? SameShape<z.output<O>, ValueOf<F>> extends true
    ? unknown
    : {
        readonly outputMismatch: {
          readonly schema: DeepReadonly<z.output<O>>;
          readonly value: ValueOf<F>;
        };
      }
  : never;

type ListCheck<Declared, Signature, Name extends string> =
  Equals<Declared, Signature> extends true
    ? unknown
    : { readonly [K in Name]: { readonly declared: Declared; readonly signature: Signature } };

/** The checks of one entry against its method `F`. */
export type EntryCheck<F, E> = E extends {
  readonly errors: readonly (infer K)[];
  readonly refusals: readonly (infer R)[];
  readonly input: infer I;
  readonly output: infer O;
}
  ? ListCheck<K, ErrorKindsOf<F>, 'errorsMismatch'> &
      ListCheck<R, RefusalCodesOf<F>, 'refusalsMismatch'> &
      InputCheck<F, I> &
      OutputCheck<F, O>
  : never;

/** A port's ledger: one entry per method, each checked against its signature. */
export function portLedger<Port>() {
  return <const L extends { readonly [M in keyof Port]: LedgerEntry }>(
    ledger: L & { readonly [M in keyof Port]: EntryCheck<Port[M], L[M]> },
  ): L => ledger;
}

type Defaults = 'refusals' | 'open' | 'policy' | 'form' | 'failureFrame';
type EntryInput = Omit<LedgerEntry, Defaults> & Partial<Pick<LedgerEntry, Defaults>>;

/** An entry with the empty defaults filled in. */
export function entry<const E extends EntryInput>(
  value: E,
): E & {
  readonly refusals: E extends { readonly refusals: infer R } ? R : readonly [];
  readonly open: readonly string[];
  readonly policy: readonly PolicyCheck[];
  readonly form: SummaryForm | null;
  readonly failureFrame: string | null;
} {
  return {
    refusals: [],
    open: [],
    policy: [],
    form: null,
    failureFrame: null,
    ...value,
  } as never;
}
