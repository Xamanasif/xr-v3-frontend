import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  HEALTH_PATH,
  PROBLEM_JSON,
  WIRE_CONTRACTS,
  healthQuerySchema,
  healthResponseSchema,
  problemDetailsSchema,
  runtimeEventInputSchema,
  toOpenApiSchema,
} from '@xr/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OPENAPI_JSON_PATH, createApp } from '../src/bootstrap.js';
import { CodecModule } from './fixtures/codec.module.js';
import { CoerciveResponseModule } from './fixtures/coercive-response.module.js';
import { CoerciveModule } from './fixtures/coercive.module.js';
import { PipelineModule } from './fixtures/pipeline.module.js';
import { RefinedModule } from './fixtures/refined.module.js';
import { UnrepresentableModule } from './fixtures/unrepresentable.module.js';

type Json = Record<string, unknown>;
const at = (value: unknown, ...path: (string | number)[]): unknown =>
  path.reduce<unknown>((current, key) => (current as Json | undefined)?.[key as string], value);

const ENV = { APP_ENV: 'development', DATABASE_URL: '' };

describe('OpenAPI published by the running application', () => {
  let app: NestFastifyApplication;
  let document: Json;

  beforeAll(async () => {
    app = await createApp({ env: ENV });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    const response = await app.inject({ method: 'GET', url: `/${OPENAPI_JSON_PATH}` });
    expect(response.statusCode).toBe(200);
    document = response.json() as Json;
  });

  afterAll(async () => {
    await app.close();
  });

  it('is an OpenAPI 3.0 document with the health route', () => {
    expect(String(document['openapi']).startsWith('3.0')).toBe(true);
    expect(at(document, 'paths', HEALTH_PATH, 'get')).toBeDefined();
  });

  it('publishes the request schema: the database query parameter with its enum and default', () => {
    const parameters = at(document, 'paths', HEALTH_PATH, 'get', 'parameters') as Json[];
    const database = parameters.find((parameter) => parameter['name'] === 'database');
    expect(database).toMatchObject({ in: 'query', required: false });
    expect(at(database, 'schema', 'enum')).toEqual(['probe', 'skip']);
    expect(at(database, 'schema', 'default')).toBe('probe');
  });

  it('publishes the success response schema with its date-time and enum constraints', () => {
    const schema = at(
      document,
      'paths',
      HEALTH_PATH,
      'get',
      'responses',
      '200',
      'content',
      'application/json',
      'schema',
    ) as Json;
    expect(at(schema, 'properties', 'status', 'enum')).toEqual(['ok', 'degraded']);
    expect(at(schema, 'properties', 'timestamp', 'type')).toBe('string');
    expect(at(schema, 'properties', 'timestamp', 'format')).toBe('date-time');
    expect(schema['required']).toEqual(expect.arrayContaining(['status', 'timestamp', 'checks']));
    expect(
      at(schema, 'properties', 'checks', 'properties', 'database', 'properties', 'status', 'enum'),
    ).toEqual(['ok', 'skipped', 'unavailable']);
  });

  it('publishes the RFC 9457 problem schema once and references it from 400 and 500', () => {
    const problem = at(document, 'components', 'schemas', 'ProblemDetails') as Json;
    expect(problem['required']).toEqual(expect.arrayContaining(['title', 'status']));
    expect(at(problem, 'properties', 'status', 'type')).toBe('integer');
    for (const status of ['400', '500']) {
      expect(
        at(
          document,
          'paths',
          HEALTH_PATH,
          'get',
          'responses',
          status,
          'content',
          PROBLEM_JSON,
          'schema',
          '$ref',
        ),
      ).toBe('#/components/schemas/ProblemDetails');
    }
  });

  it('publishes every registered wire contract as a component, drafts marked as such', () => {
    for (const contract of WIRE_CONTRACTS) {
      const component = at(document, 'components', 'schemas', contract.name) as Json;
      expect(component, contract.name).toBeDefined();
      expect(component['x-status']).toBe(contract.status);
      if (contract.status === 'draft') expect(String(component['description'])).toMatch(/^DRAFT/);
    }
  });

  it('serves every published or draft contract exactly as its strict conversion — no weaker component anywhere', () => {
    for (const contract of WIRE_CONTRACTS) {
      const {
        description: _d,
        'x-status': _s,
        ...served
      } = at(document, 'components', 'schemas', contract.name) as Json;
      expect(served, contract.name).toEqual(toOpenApiSchema(contract.schema, { io: contract.io }));
    }
  });

  it('served enums agree with runtime validation for the health query and response', () => {
    const query = at(
      document,
      'components',
      'schemas',
      'HealthQuery',
      'properties',
      'database',
      'enum',
    ) as string[];
    for (const value of query)
      expect(healthQuerySchema.safeParse({ database: value }).success, value).toBe(true);
    expect(healthQuerySchema.safeParse({ database: 'maybe' }).success).toBe(false);
    expect(query).not.toContain('maybe');
    const status = at(
      document,
      'components',
      'schemas',
      'HealthResponse',
      'properties',
      'status',
      'enum',
    ) as string[];
    expect(status).toEqual(['ok', 'degraded']);
    expect(
      at(document, 'components', 'schemas', 'ProblemDetails', 'properties', 'status', 'minimum'),
    ).toBe(100);
    expect(problemDetailsSchema.safeParse({ title: 'x', status: 99 }).success).toBe(false);
    expect(healthResponseSchema.safeParse({}).success).toBe(false);
  });

  it('serves the runtime-event timestamp as a date-time contract that agrees with runtime validation', () => {
    const occurredAt = at(
      document,
      'components',
      'schemas',
      'RuntimeEventInput',
      'properties',
      'occurredAt',
    ) as {
      type: string;
      format: string;
      pattern: string;
    };
    expect(occurredAt.type).toBe('string');
    expect(occurredAt.format).toBe('date-time');
    expect(at(document, 'components', 'schemas', 'RuntimeEventInput', 'required')).toContain(
      'occurredAt',
    );

    const served = new RegExp(occurredAt.pattern);
    const base = {
      clientEventId: 'c-1',
      type: 'SESSION_STARTED',
      sessionId: 'S1',
      personId: 'P1',
      experimentId: 'direct-shear',
      technology: 'web',
      source: 'web-runtime',
    };
    for (const valid of ['2026-09-01T15:30:00+05:30', '2026-09-01T10:00:00.250Z']) {
      expect(served.test(valid), valid).toBe(true);
      expect(runtimeEventInputSchema.safeParse({ ...base, occurredAt: valid }).success, valid).toBe(
        true,
      );
    }
    for (const invalid of [
      'Sep 1, 2026 10:00:00 GMT',
      '2026-09-01T10:00:00',
      '2026-02-30T10:00:00Z',
    ]) {
      expect(served.test(invalid), invalid).toBe(false);
      expect(
        runtimeEventInputSchema.safeParse({ ...base, occurredAt: invalid }).success,
        invalid,
      ).toBe(false);
    }
  });
});

describe('OpenAPI publication fails closed', () => {
  it('refuses to boot when a route declares a request schema with an unrepresentable custom refinement', async () => {
    await expect(createApp({ env: ENV, additionalModules: [RefinedModule] })).rejects.toThrow(
      /not representable.*custom refinement/,
    );
  });

  it('refuses to boot when a route declares a response schema with a transform', async () => {
    await expect(
      createApp({ env: ENV, additionalModules: [UnrepresentableModule] }),
    ).rejects.toThrow(/not representable.*pipeline/);
  });

  it('PIPELINE PROOF — refuses to boot for z.string().pipe(z.string().min(5)) on a request schema', async () => {
    await expect(createApp({ env: ENV, additionalModules: [PipelineModule] })).rejects.toThrow(
      /not representable.*pipeline/,
    );
  });

  it('COERCION PROOF — refuses to boot for z.coerce.number() / z.coerce.boolean() on a request schema', async () => {
    await expect(createApp({ env: ENV, additionalModules: [CoerciveModule] })).rejects.toThrow(
      /not representable.*"n".*coercive schema \(z\.coerce\.number\)/,
    );
  });

  it('COERCION PROOF (output direction) — refuses to boot for z.coerce.number() on a response schema', async () => {
    await expect(
      createApp({ env: ENV, additionalModules: [CoerciveResponseModule] }),
    ).rejects.toThrow(/not representable.*"count".*coercive schema \(z\.coerce\.number\)/);
  });

  it('CODEC PROOF — refuses to boot for a codec on a request schema', async () => {
    await expect(createApp({ env: ENV, additionalModules: [CodecModule] })).rejects.toThrow(
      /not representable.*codec/,
    );
  });
});
