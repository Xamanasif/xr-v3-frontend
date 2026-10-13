/**
 * Ties zod schemas to the `@xr/domain` types they describe, at compile time (ADR-0008 decision 6:
 * `@xr/domain` stays zod-free; `@xr/contracts/draft` maps validated values to the domain types).
 *
 * - `typedAs<T>()(schema)` compiles only when the schema's output has exactly the shape of the
 *   domain type `T` (readonly-ness aside), and then types the schema's output AS `T`, brands
 *   included. A field added to, removed from or retyped in the domain breaks the build here.
 * - `vocabulary<T>()(values)` compiles only when `values` lists every member of the domain union
 *   `T` and nothing else — one vocabulary, checked against its domain authority.
 *
 * Brands (`InstitutionId`, `Provided<number>` …) are type-level only: a branded schema is the plain
 * runtime schema (a string, a number) typed as the domain brand.
 */
import type { z } from 'zod';

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/** Readonly all the way down, so a zod output and a readonly domain type compare by shape. */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : { readonly [K in keyof T]: DeepReadonly<T[K]> };

/** Exact type equality. */
export type Equals<A, B> =
  (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;

export type SameShape<A, B> = Equals<DeepReadonly<A>, DeepReadonly<B>>;

/** Compile-time assertion: `Assert<Equals<A, B>>` fails the build unless it is `true`. */
export type Assert<T extends true> = T;

declare const mismatch: unique symbol;

/** What a failed `typedAs` check reports in the compiler message. */
export interface ShapeMismatch<Schema, Domain> {
  readonly [mismatch]: { readonly schemaOutput: Schema; readonly domainType: Domain };
}

/** A schema whose output is typed as the domain type `T`. */
export type TypedSchema<T, I = unknown> = z.ZodType<T, I>;

export function typedAs<T>() {
  return <S extends z.ZodType>(
    schema: S & (SameShape<z.output<S>, T> extends true ? unknown : ShapeMismatch<z.output<S>, T>),
  ): TypedSchema<T, z.input<S>> => schema as unknown as TypedSchema<T, z.input<S>>;
}

declare const missing: unique symbol;

/** What a failed `vocabulary` check reports: the members missing from the list, or extra in it. */
export interface VocabularyMismatch<Missing, Extra> {
  readonly [missing]: { readonly missing: Missing; readonly extra: Extra };
}

export function vocabulary<T extends string | number>() {
  return <const A extends readonly [T, ...T[]]>(
    values: A &
      (Equals<A[number], T> extends true
        ? unknown
        : VocabularyMismatch<Exclude<T, A[number]>, Exclude<A[number], T>>),
  ): A => values;
}

/** Brands a runtime schema with a domain brand (type level only). */
export function branded<B>() {
  return <S extends z.ZodType>(schema: S): TypedSchema<B, z.input<S>> =>
    schema as unknown as TypedSchema<B, z.input<S>>;
}
