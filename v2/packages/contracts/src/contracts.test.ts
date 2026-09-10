import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { HEALTH_PATH } from './api.js';
import { healthQuerySchema, healthResponseSchema } from './health.js';
import {
  UnrepresentableSchemaError,
  assertRepresentable,
  toOpenApiSchema,
  wireSchema,
} from './openapi.js';
import { problemDetailsSchema } from './problem.js';
import {
  RUNTIME_EVENT_BATCH_MAX,
  runtimeEventAcceptedSchema,
  runtimeEventBatchSchema,
  runtimeEventInputSchema,
} from './runtime-events.js';
import { WIRE_CONTRACTS } from './wire-contracts.js';

type Properties = Record<string, Record<string, unknown>>;
const propertiesOf = (schema: Record<string, unknown>): Properties =>
  schema['properties'] as Properties;

const validHealth = {
  status: 'ok',
  service: 'xr-platform-api',
  version: '0.0.0',
  apiVersion: 'v1',
  environment: 'development',
  timestamp: '2026-09-10T00:00:00.000Z',
  uptimeSeconds: 12,
  checks: { database: { status: 'skipped', detail: 'DATABASE_URL is not set' } },
};

const validEvent = {
  clientEventId: 'c-1',
  type: 'SESSION_ENDED',
  sessionId: 'S1',
  personId: 'P1',
  experimentId: 'direct-shear',
  technology: 'vr',
  source: 'vr-native-client',
  occurredAt: '2026-09-01T15:30:00+05:30',
  durationSeconds: 300,
};

describe('api paths', () => {
  it('versions every route under /api/v1', () => {
    expect(HEALTH_PATH).toBe('/api/v1/health');
  });
});

describe('healthQuerySchema', () => {
  it('defaults to probing and refuses unknown modes', () => {
    expect(healthQuerySchema.parse({})).toEqual({ database: 'probe' });
    expect(healthQuerySchema.parse({ database: 'skip' })).toEqual({ database: 'skip' });
    expect(healthQuerySchema.safeParse({ database: 'maybe' }).success).toBe(false);
  });
});

describe('healthResponseSchema', () => {
  it('accepts the documented shape', () => {
    expect(healthResponseSchema.parse(validHealth).checks.database.status).toBe('skipped');
  });

  it('refuses an unknown status and a non-ISO timestamp', () => {
    expect(healthResponseSchema.safeParse({ ...validHealth, status: 'fine' }).success).toBe(false);
    expect(
      healthResponseSchema.safeParse({ ...validHealth, timestamp: 'Sep 10 2026' }).success,
    ).toBe(false);
  });
});

describe('problemDetailsSchema', () => {
  it('defaults the type to about:blank', () => {
    expect(problemDetailsSchema.parse({ title: 'Not Found', status: 404 }).type).toBe(
      'about:blank',
    );
  });
});

describe('runtime event contract (draft)', () => {
  it('the wire form keeps the runtime clock exactly as sent', () => {
    expect(runtimeEventInputSchema.parse(validEvent).occurredAt).toBe('2026-09-01T15:30:00+05:30');
  });

  it('the accepted form normalises the runtime clock to UTC — an explicit, unpublished step', () => {
    expect(runtimeEventAcceptedSchema.parse(validEvent).occurredAt).toBe(
      '2026-09-01T10:00:00.000Z',
    );
  });

  it('refuses a non-RFC-3339 timestamp and an impossible calendar value', () => {
    for (const occurredAt of [
      'Sep 1, 2026 10:00:00 GMT',
      '2026-09-01T10:00:00',
      '2026-02-30T10:00:00Z',
    ]) {
      expect(
        runtimeEventInputSchema.safeParse({ ...validEvent, occurredAt }).success,
        occurredAt,
      ).toBe(false);
    }
  });

  it('refuses an unknown event type, technology and source', () => {
    expect(
      runtimeEventInputSchema.safeParse({ ...validEvent, type: 'RESOURCE_VIEWED' }).success,
    ).toBe(false);
    expect(
      runtimeEventInputSchema.safeParse({ ...validEvent, technology: 'hologram' }).success,
    ).toBe(false);
    expect(
      runtimeEventInputSchema.safeParse({ ...validEvent, source: 'demo-runtime-simulator' })
        .success,
    ).toBe(false);
  });

  it('requires a session id', () => {
    expect(runtimeEventInputSchema.safeParse({ ...validEvent, sessionId: '' }).success).toBe(false);
  });

  it('bounds a batch', () => {
    expect(runtimeEventBatchSchema.safeParse({ events: [] }).success).toBe(false);
    const events = Array.from({ length: RUNTIME_EVENT_BATCH_MAX + 1 }, (_, i) => ({
      ...validEvent,
      clientEventId: `c-${i}`,
    }));
    expect(runtimeEventBatchSchema.safeParse({ events }).success).toBe(false);
  });
});

describe('wire contracts are representable and keep their constraints', () => {
  it('converts every registered contract, published or draft, without throwing', () => {
    for (const contract of WIRE_CONTRACTS) {
      expect(
        () => toOpenApiSchema(contract.schema, { io: contract.io }),
        contract.name,
      ).not.toThrow();
      expect(toOpenApiSchema(contract.schema, { io: contract.io })).not.toHaveProperty('$schema');
    }
  });

  it('publishes the runtime timestamp as a standard date-time that agrees with runtime validation', () => {
    const schema = toOpenApiSchema(runtimeEventInputSchema, { io: 'input' });
    const occurredAt = propertiesOf(schema)['occurredAt'] as { format: string; pattern: string };
    expect(occurredAt).toMatchObject({ type: 'string', format: 'date-time' });
    const published = new RegExp(occurredAt.pattern);
    expect(published.test('2026-09-01T15:30:00+05:30')).toBe(true);
    expect(published.test('2026-02-30T10:00:00Z')).toBe(false);
    expect(propertiesOf(schema)['type']?.['enum']).toContain('SIMULATION_COMPLETED');
    expect(propertiesOf(schema)['technology']?.['enum']).toEqual(['web', 'vr', 'mr', 'ar']);
    expect(schema['required']).toEqual(
      expect.arrayContaining(['clientEventId', 'sessionId', 'occurredAt', 'source']),
    );
  });

  it('keeps the response timestamp and enum constraints', () => {
    const schema = toOpenApiSchema(healthResponseSchema, { io: 'output' });
    expect(propertiesOf(schema)['timestamp']).toMatchObject({
      type: 'string',
      format: 'date-time',
    });
    expect(propertiesOf(schema)['status']?.['enum']).toEqual(['ok', 'degraded']);
    expect(schema['required']).toContain('checks');
  });

  it('describes the health query in its input shape, default included', () => {
    const schema = toOpenApiSchema(healthQuerySchema, { io: 'input' });
    expect(propertiesOf(schema)['database']).toMatchObject({
      type: 'string',
      enum: ['probe', 'skip'],
      default: 'probe',
    });
  });
});

describe('publication fails closed', () => {
  const cases: ReadonlyArray<[string, z.ZodType, RegExp]> = [
    [
      'a custom refinement',
      z.object({ v: z.string().refine((s) => s !== 'x') }),
      /custom refinement/,
    ],
    [
      'a superRefine',
      z.object({ v: z.string().superRefine(() => undefined) }),
      /custom refinement/,
    ],
    [
      'a refinement nested in an array',
      z.object({ v: z.array(z.string().refine(() => true)) }),
      /custom refinement/,
    ],
    [
      'a refinement nested in a union',
      z.union([z.string().refine(() => true), z.number()]),
      /custom refinement/,
    ],
    ['a transform', z.object({ v: z.string().transform((s) => s.trim()) }), /pipeline/],
    ['a preprocess', z.object({ v: z.preprocess((s) => s, z.string()) }), /pipeline/],
    ['a value-rewriting check', z.object({ v: z.string().trim() }), /value-rewriting/],
    ['a fallback', z.object({ v: z.string().catch('x') }), /fallback/],
    ['a pre-parse default', z.object({ v: z.string().prefault('x') }), /prefault/],
    [
      'a custom schema',
      z.object({ v: z.custom<string>((s) => typeof s === 'string') }),
      /custom validation/,
    ],
    ['a Date', z.object({ v: z.date() }), /Date/],
    // pipelines and codecs — runtime validation spans stages the document cannot carry
    ['the demonstrated pipeline', z.string().pipe(z.string().min(5)), /pipeline/],
    [
      'a pipeline inside an object',
      z.object({ v: z.string().pipe(z.string().min(5)) }),
      /pipeline/,
    ],
    [
      'a nested pipeline',
      z.object({ v: z.array(z.string().pipe(z.string().min(2)).pipe(z.string().max(9))) }),
      /pipeline/,
    ],
    [
      'a pipeline inside an optional',
      z.object({ v: z.string().pipe(z.string().min(5)).optional() }),
      /pipeline/,
    ],
    [
      'a codec with input/output transformation',
      z.object({
        when: z.codec(z.iso.datetime(), z.date(), {
          decode: (value) => new Date(value),
          encode: (value) => value.toISOString(),
        }),
      }),
      /codec/,
    ],
    [
      'a codec whose constraints would otherwise disappear',
      z.object({
        n: z.codec(z.string().min(5), z.number(), {
          decode: (value) => value.length,
          encode: (value) => 'x'.repeat(value),
        }),
      }),
      /codec/,
    ],
    ['a stringbool (a codec in Zod 4.6)', z.object({ flag: z.stringbool() }), /pipeline|codec/],
    ['a string format without a portable pattern', z.object({ t: z.jwt() }), /format "jwt"/],
    // coercion — the document would promise one type while the runtime converted another
    [
      'a coercive string',
      z.object({ s: z.coerce.string() }),
      /coercive schema \(z\.coerce\.string\)/,
    ],
    [
      'a coercive number',
      z.object({ n: z.coerce.number() }),
      /coercive schema \(z\.coerce\.number\)/,
    ],
    [
      'a coercive boolean',
      z.object({ flag: z.coerce.boolean() }),
      /coercive schema \(z\.coerce\.boolean\)/,
    ],
    [
      'a coercive bigint',
      z.object({ big: z.coerce.bigint() }),
      /coercive schema \(z\.coerce\.bigint\)/,
    ],
    ['a coercive date', z.object({ when: z.coerce.date() }), /coercive schema \(z\.coerce\.date\)/],
    ['a bare coercive schema', z.coerce.number(), /coercive/],
    [
      'the demonstrated coercive route query',
      z.object({ n: z.coerce.number(), flag: z.coerce.boolean() }),
      /coercive/,
    ],
    [
      'coercion with constraints that would publish',
      z.object({ page: z.coerce.number().int().min(1) }),
      /coercive/,
    ],
    ['coercion inside an optional', z.object({ n: z.coerce.number().optional() }), /coercive/],
    ['coercion inside a default', z.object({ n: z.coerce.number().default(1) }), /coercive/],
    ['coercion inside a nullable', z.object({ n: z.coerce.number().nullable() }), /coercive/],
    ['coercion inside an array', z.object({ ns: z.array(z.coerce.number()) }), /coercive/],
    [
      'coercion inside an array inside an optional',
      z.object({ ns: z.array(z.coerce.boolean()).optional() }),
      /coercive/,
    ],
    [
      'coercion inside a nested object',
      z.object({ outer: z.object({ inner: z.object({ flag: z.coerce.boolean() }) }) }),
      /coercive/,
    ],
    [
      'coercion inside a union',
      z.object({ v: z.union([z.string(), z.coerce.number()]) }),
      /coercive/,
    ],
    [
      'coercion inside a tuple',
      z.object({ pair: z.tuple([z.string(), z.coerce.boolean()]) }),
      /coercive/,
    ],
    ['coercion inside a record', z.record(z.string(), z.coerce.number()), /coercive/],
    [
      'coercion inside a catchall',
      z.object({ a: z.string() }).catchall(z.coerce.number()),
      /coercive/,
    ],
    [
      'coercion inside an intersection',
      z.intersection(z.object({ a: z.string() }), z.object({ b: z.coerce.number() })),
      /coercive/,
    ],
    [
      'coercion inside a lazy schema',
      z.object({ tree: z.lazy(() => z.object({ n: z.coerce.number() })) }),
      /coercive/,
    ],
  ];

  for (const [label, schema, message] of cases) {
    it(`throws for ${label} (input and output)`, () => {
      expect(() => assertRepresentable(schema, 'input')).toThrow(UnrepresentableSchemaError);
      expect(() => assertRepresentable(schema, 'input')).toThrow(message);
      expect(() => toOpenApiSchema(schema, { io: 'output' })).toThrow(UnrepresentableSchemaError);
      expect(() => wireSchema(schema, 'input')).toThrow(UnrepresentableSchemaError);
      expect(() => wireSchema(schema, 'output')).toThrow(UnrepresentableSchemaError);
    });
  }

  it('PIPELINE PROOF — the guard exists because Zod alone would publish a weaker contract', () => {
    const pipeline = z.string().pipe(z.string().min(5));
    // What Zod's converter emits for the input side: the min(5) of the second stage is gone…
    expect(z.toJSONSchema(pipeline, { target: 'openapi-3.0', io: 'input' })).toEqual({
      type: 'string',
    });
    // …while runtime validation still enforces it.
    expect(pipeline.safeParse('abc').success).toBe(false);
    expect(pipeline.safeParse('abcdef').success).toBe(true);
    // Therefore the wire-schema path refuses it outright.
    expect(() => wireSchema(pipeline, 'input')).toThrow(/pipeline/);
    expect(() => toOpenApiSchema(pipeline, { io: 'input' })).toThrow(/pipeline/);
  });

  it('COERCION PROOF — the document would promise one type while the runtime converted another', () => {
    const query = z.object({ n: z.coerce.number(), flag: z.coerce.boolean() });
    // What Zod's converter emits for the input side: plain number / boolean…
    expect(z.toJSONSchema(query, { target: 'openapi-3.0', io: 'input' })).toMatchObject({
      properties: { n: { type: 'number' }, flag: { type: 'boolean' } },
    });
    // …while the runtime accepts strings and converts them ("false" becomes true).
    expect(query.parse({ n: '7', flag: 'false' })).toEqual({ n: 7, flag: true });
    // Therefore the wire path refuses it in both directions, naming the path and the reason.
    expect(() => wireSchema(query, 'input')).toThrow(/"n".*coercive schema \(z\.coerce\.number\)/);
    expect(() => wireSchema(query, 'output')).toThrow(/coercive/);
    expect(() => toOpenApiSchema(query, { io: 'input' })).toThrow(/coercive/);
    expect(() => toOpenApiSchema(query, { io: 'output' })).toThrow(/coercive/);
    // The faithful wire form of the same shape is representable; conversion, if ever
    // needed, stays in an application schema that is never registered.
    const wire = wireSchema(z.object({ n: z.number(), flag: z.boolean() }), 'input');
    expect(wire.safeParse({ n: '7', flag: 'false' }).success).toBe(false);
    expect(wire.safeParse({ n: 7, flag: false }).success).toBe(true);
  });

  it('CODEC PROOF — a codec never publishes a weaker contract', () => {
    const codec = z.codec(z.string().min(5), z.number(), {
      decode: (value) => value.length,
      encode: (value) => 'x'.repeat(value),
    });
    expect(z.toJSONSchema(codec, { target: 'openapi-3.0', io: 'output' })).toEqual({
      type: 'number',
    });
    expect(() => wireSchema(codec, 'input')).toThrow(/codec/);
    expect(() => wireSchema(codec, 'output')).toThrow(/codec/);
  });

  it('names the offending path', () => {
    expect(() =>
      assertRepresentable(
        z.object({ outer: z.object({ when: z.string().refine(() => true) }) }),
        'input',
      ),
    ).toThrow(/"outer\.when"/);
    expect(() =>
      assertRepresentable(z.object({ list: z.array(z.string().pipe(z.string().min(1))) }), 'input'),
    ).toThrow(/"list\.\[\]"/);
    expect(() =>
      assertRepresentable(
        z.object({ outer: z.object({ inner: z.object({ flag: z.coerce.boolean() }) }) }),
        'input',
      ),
    ).toThrow(/"outer\.inner\.flag".*coercive/);
  });

  it('accepts the representable vocabulary', () => {
    const representable = z.object({
      id: z.uuid(),
      email: z.email(),
      site: z.url(),
      when: z.iso.datetime({ offset: true }),
      day: z.iso.date(),
      kind: z.enum(['a', 'b']).default('a'),
      code: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .min(3)
        .max(3),
      prefix: z.string().startsWith('xr-').includes('-'),
      count: z.number().int().min(0).max(10).multipleOf(1).optional(),
      page: z.number().int().min(1),
      tags: z.array(z.string().min(1)).max(5),
      pair: z.tuple([z.string(), z.number()]),
      either: z.union([z.literal('x'), z.number()]),
      nested: z.object({ note: z.string().nullable() }),
      map: z.record(z.string(), z.number()),
      both: z.intersection(z.object({ a: z.string() }), z.object({ b: z.number() })),
      template: z.templateLiteral(['xr-', z.number()]),
      anything: z.unknown(),
      tree: z.lazy(() => z.object({ leaf: z.string() })),
    });
    expect(() => wireSchema(representable, 'input')).not.toThrow();
    expect(() => toOpenApiSchema(representable, { io: 'output' })).not.toThrow();
    const published = toOpenApiSchema(representable, { io: 'input' });
    expect(propertiesOf(published)['code']).toMatchObject({
      type: 'string',
      pattern: '^[A-Z]{3}$',
      minLength: 3,
      maxLength: 3,
    });
    expect(propertiesOf(published)['count']).toMatchObject({
      type: 'integer',
      minimum: 0,
      maximum: 10,
    });
    expect(propertiesOf(published)['when']).toMatchObject({ type: 'string', format: 'date-time' });
  });
});
