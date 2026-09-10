/**
 * Strict wire-schema publication.
 *
 * WIRE-CONTRACT INVARIANT — a published wire schema must faithfully describe the
 * external values clients send and receive: no drift in either direction. The guard
 * is an ALLOWLIST: a node kind, check kind or string format not verified to publish
 * faithfully fails closed — so a construct whose runtime rule would silently
 * disappear from the document (a pipeline such as `z.string().pipe(z.string().min(5))`,
 * a codec, a refinement, a transform, a value-rewriting check, a fallback, an
 * unrepresentable type or format) is rejected, and so is every COERCIVE node
 * (`z.coerce.*`, recursively): the document would promise one type while the runtime
 * silently converted another (`z.coerce.boolean()` turns "false" into true).
 * Rejection happens at definition (`wireSchema`), in the contracts test over the
 * registry, and at API boot through `@nestjs/swagger`'s converter hook.
 *
 * Conversions, coercions and semantic checks belong to separate application /
 * ACCEPTED-form schemas or functions that are never registered as wire schemas.
 */
import type { z } from 'zod';

import { describeSchemaNode } from './zod-introspection.js';

export class UnrepresentableSchemaError extends Error {
  override readonly name = 'UnrepresentableSchemaError';
  constructor(
    readonly path: readonly (string | number)[],
    readonly reason: string,
  ) {
    super(
      `Wire schema is not representable in OpenAPI at "${path.join('.') || '(root)'}": ${reason}. ` +
        'Express the rule with a representable construct, or move it to an accepted-form schema that is not published.',
    );
  }
}

/** Node kinds verified to publish faithfully (Zod 4.6, `openapi-3.0` target). */
const REPRESENTABLE_NODE_KINDS = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'object',
  'array',
  'tuple',
  'union',
  'intersection',
  'enum',
  'literal',
  'record',
  'optional',
  'nullable',
  'nonoptional',
  'default',
  'readonly',
  'lazy',
  'template_literal',
  'any',
  'unknown',
  'never',
]);

/** Check kinds verified to publish faithfully (as minLength / maximum / multipleOf / integer …). */
const REPRESENTABLE_CHECK_KINDS = new Set([
  'min_length',
  'max_length',
  'length_equals',
  'greater_than',
  'less_than',
  'multiple_of',
  'number_format',
]);

/** String formats verified to publish as a standard `format` and/or an explicit `pattern`. */
const REPRESENTABLE_STRING_FORMATS = new Set([
  'regex',
  'email',
  'url',
  'uuid',
  'guid',
  'cuid',
  'cuid2',
  'ulid',
  'xid',
  'ksuid',
  'nanoid',
  'emoji',
  'ipv4',
  'ipv6',
  'cidrv4',
  'cidrv6',
  'base64',
  'base64url',
  'e164',
  'datetime',
  'date',
  'time',
  'duration',
  'includes',
  'starts_with',
  'ends_with',
]);

const NODE_REASONS: Readonly<Record<string, string>> = {
  pipe: 'a pipeline (.pipe / .transform / z.preprocess / z.stringbool) — runtime validation spans both stages, the document could only carry one',
  custom: 'custom validation (z.custom / z.instanceof)',
  transform: 'a transform',
  catch: 'a fallback value (.catch) that silently accepts invalid input',
  prefault: 'a pre-parse default (.prefault)',
  date: 'a Date object',
  bigint: 'a bigint',
  symbol: 'a symbol',
  map: 'a Map',
  set: 'a Set',
  promise: 'a Promise',
  function: 'a function',
  file: 'a File',
  nan: 'NaN',
  undefined: 'undefined',
  void: 'void',
  success: 'z.success',
};

const CHECK_REASONS: Readonly<Record<string, string>> = {
  custom: 'a custom refinement (.refine / .superRefine / .check)',
  overwrite: 'a value-rewriting check (.trim / .toLowerCase / .toUpperCase / .normalize)',
};

function walk(schema: z.ZodType, path: (string | number)[], seen: Set<z.ZodType>): void {
  if (seen.has(schema)) return;
  seen.add(schema);
  const node = describeSchemaNode(schema);

  if (node.coerce) {
    throw new UnrepresentableSchemaError(
      path,
      `a coercive schema (z.coerce.${node.kind}) — coercive schemas are not representable as faithful published wire contracts: the document would promise ${node.kind} values while the runtime silently converted other types`,
    );
  }
  if (node.kind === 'pipe') {
    throw new UnrepresentableSchemaError(
      path,
      node.codec
        ? 'a codec (z.codec) — its conversion cannot be published faithfully'
        : NODE_REASONS['pipe']!,
    );
  }
  if (!REPRESENTABLE_NODE_KINDS.has(node.kind)) {
    throw new UnrepresentableSchemaError(
      path,
      NODE_REASONS[node.kind] ?? `a "${node.kind}" schema`,
    );
  }
  if (node.format !== undefined && !REPRESENTABLE_STRING_FORMATS.has(node.format)) {
    throw new UnrepresentableSchemaError(
      path,
      `the string format "${node.format}" (no portable pattern)`,
    );
  }
  for (const check of node.checks) {
    if (check.kind === 'string_format') {
      if (check.format === undefined || !REPRESENTABLE_STRING_FORMATS.has(check.format)) {
        throw new UnrepresentableSchemaError(
          path,
          `the string format "${check.format ?? '?'}" (no portable pattern)`,
        );
      }
      continue;
    }
    const rejected = CHECK_REASONS[check.kind];
    if (rejected) throw new UnrepresentableSchemaError(path, rejected);
    if (!REPRESENTABLE_CHECK_KINDS.has(check.kind)) {
      throw new UnrepresentableSchemaError(path, `a "${check.kind}" check`);
    }
  }
  for (const child of node.children) walk(child.schema, [...path, child.label], seen);
}

/**
 * Throw unless every node, check and format of `schema` is on the verified allowlist
 * (catches everything Zod's converter would silently drop, such as pipelines and
 * refinements), then run Zod's own strict conversion (catches anything the converter
 * itself cannot express).
 */
export function assertRepresentable(schema: z.ZodType, io: 'input' | 'output'): void {
  walk(schema, [], new Set());
  standardJsonSchema(schema, io);
}

/** Mark a schema as a WIRE schema: representability is checked once, at definition. */
export function wireSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  io: 'input' | 'output',
): TSchema {
  assertRepresentable(schema, io);
  return schema;
}

interface StandardJsonSchemaProps {
  readonly jsonSchema?: {
    readonly input: (options: { target: 'openapi-3.0' }) => unknown;
    readonly output: (options: { target: 'openapi-3.0' }) => unknown;
  };
}

function standardJsonSchema(schema: z.ZodType, io: 'input' | 'output'): Record<string, unknown> {
  const standard = (schema as unknown as { '~standard': StandardJsonSchemaProps })['~standard'];
  const convert = standard.jsonSchema?.[io];
  if (!convert) {
    throw new UnrepresentableSchemaError([], 'the schema does not expose Standard JSON Schema');
  }
  return convert({ target: 'openapi-3.0' }) as Record<string, unknown>;
}

export type OpenApiSchemaObject = Record<string, unknown>;

export interface ToOpenApiSchemaOptions {
  /** `output` for responses (default); `input` for request payloads. */
  io?: 'input' | 'output';
}

/**
 * OpenAPI 3.0 schema for a wire contract, through the Standard JSON Schema interface
 * (`~standard.jsonSchema`) — the SAME path `@nestjs/swagger` 12 uses — after the
 * representability assertion above. Throws; never weakens.
 */
export function toOpenApiSchema(
  schema: z.ZodType,
  options: ToOpenApiSchemaOptions = {},
): OpenApiSchemaObject {
  const io = options.io ?? 'output';
  assertRepresentable(schema, io);
  const { $schema: _dropped, ...rest } = standardJsonSchema(schema, io);
  return rest;
}
