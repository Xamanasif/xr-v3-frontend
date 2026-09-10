/**
 * The ONE module that reads Zod's core definitions (`schema._zod.def`, the documented
 * `zod/v4/core` structure). Everything else in the workspace reasons about the plain
 * description returned here. Pinned to Zod 4.6 for Phase 0; covered by
 * `zod-introspection.test.ts`, which fails the moment a construct is described wrongly.
 */
import type { z } from 'zod';

export interface CheckDescription {
  /** `min_length`, `greater_than`, `string_format`, `custom`, `overwrite`, … */
  readonly kind: string;
  /** For `string_format` checks: `regex`, `email`, `datetime`, … */
  readonly format?: string;
}

export interface ChildDescription {
  readonly label: string;
  readonly schema: z.ZodType;
}

export interface NodeDescription {
  /** `def.type`: `string`, `object`, `pipe`, `custom`, … */
  readonly kind: string;
  /** String-format schemas created directly (`z.iso.datetime()`, `z.email()`) carry their format here. */
  readonly format?: string;
  /** `z.coerce.*` — the runtime converts foreign values instead of rejecting them. */
  readonly coerce: boolean;
  /** A `pipe` that carries conversion functions: `z.codec(...)`. */
  readonly codec: boolean;
  readonly checks: readonly CheckDescription[];
  readonly children: readonly ChildDescription[];
}

interface CoreCheck {
  readonly _zod: { readonly def: { readonly check: string; readonly format?: string } };
}

interface CoreDef {
  readonly type: string;
  readonly format?: string;
  readonly coerce?: boolean;
  readonly transform?: unknown;
  readonly checks?: readonly CoreCheck[];
  readonly shape?: Record<string, z.ZodType>;
  readonly catchall?: z.ZodType;
  readonly element?: z.ZodType;
  readonly items?: readonly z.ZodType[];
  readonly rest?: z.ZodType | null;
  readonly options?: readonly z.ZodType[];
  readonly left?: z.ZodType;
  readonly right?: z.ZodType;
  readonly innerType?: z.ZodType;
  readonly in?: z.ZodType;
  readonly out?: z.ZodType;
  readonly keyType?: z.ZodType;
  readonly valueType?: z.ZodType;
  readonly getter?: () => z.ZodType;
  readonly parts?: readonly (z.ZodType | string | number | bigint | boolean | null | undefined)[];
}

function coreDef(schema: z.ZodType): CoreDef {
  return (schema as unknown as { _zod: { def: CoreDef } })._zod.def;
}

function isSchema(value: unknown): value is z.ZodType {
  return typeof value === 'object' && value !== null && '_zod' in value;
}

/** Describe one schema node: its kind, its checks and its child schemas. */
export function describeSchemaNode(schema: z.ZodType): NodeDescription {
  const def = coreDef(schema);
  const children: ChildDescription[] = [];
  const child = (label: string, value: unknown): void => {
    if (isSchema(value)) children.push({ label, schema: value });
  };

  if (def.shape) for (const [key, value] of Object.entries(def.shape)) child(key, value);
  child('[catchall]', def.catchall);
  child('[]', def.element);
  def.items?.forEach((item, index) => child(String(index), item));
  child('[rest]', def.rest);
  def.options?.forEach((option, index) => child(`[option ${index}]`, option));
  child('[left]', def.left);
  child('[right]', def.right);
  child('[inner]', def.innerType);
  child('[in]', def.in);
  child('[out]', def.out);
  child('[key]', def.keyType);
  child('[value]', def.valueType);
  if (def.getter) child('[lazy]', def.getter());
  def.parts?.forEach((part, index) => child(`[part ${index}]`, part));

  return {
    kind: def.type,
    ...(def.format !== undefined ? { format: def.format } : {}),
    coerce: def.coerce === true,
    codec: def.type === 'pipe' && typeof def.transform === 'function',
    checks: (def.checks ?? []).map((check) => ({
      kind: check._zod.def.check,
      ...(check._zod.def.format !== undefined ? { format: check._zod.def.format } : {}),
    })),
    children,
  };
}
