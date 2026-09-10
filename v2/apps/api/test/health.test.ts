import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  HEALTH_PATH,
  PROBLEM_JSON,
  healthResponseSchema,
  problemDetailsSchema,
} from '@xr/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/bootstrap.js';

describe('API foundation (in-process, Fastify inject)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    // Explicit environment: the suite is deterministic whatever the developer has configured.
    app = await createApp({ env: { APP_ENV: 'development', DATABASE_URL: '' } });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the versioned health endpoint under /api/v1', async () => {
    const response = await app.inject({ method: 'GET', url: HEALTH_PATH });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    const body = healthResponseSchema.parse(response.json());
    expect(body.status).toBe('ok');
    expect(body.service).toBe('xr-platform-api');
    expect(body.environment).toBe('development');
    expect(body.checks.database).toEqual({ status: 'skipped', detail: 'DATABASE_URL is not set' });
  });

  it('honours the request schema: database=skip is applied through the validation pipe', async () => {
    const response = await app.inject({ method: 'GET', url: `${HEALTH_PATH}?database=skip` });
    expect(response.statusCode).toBe(200);
    expect(healthResponseSchema.parse(response.json()).checks.database).toEqual({
      status: 'skipped',
      detail: 'skipped by request',
    });
  });

  it('refuses a query outside the contract with a structured problem', async () => {
    const response = await app.inject({ method: 'GET', url: `${HEALTH_PATH}?database=maybe` });
    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain(PROBLEM_JSON);
    const problem = problemDetailsSchema.parse(response.json());
    expect(problem.title).toBe('Validation failed');
    expect(problem.instance).toBe(HEALTH_PATH);
    expect(problem.errors?.[0]?.path).toBe('database');
    expect(JSON.stringify(problem)).not.toContain('database=maybe');
  });

  it('answers an unknown route with an RFC 9457 problem that omits the query string', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/does-not-exist?token=sekret',
    });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain(PROBLEM_JSON);
    const problem = problemDetailsSchema.parse(response.json());
    expect(problem).toMatchObject({
      status: 404,
      title: 'Not Found',
      instance: '/api/v1/does-not-exist',
      detail: 'No route for GET /api/v1/does-not-exist',
    });
    expect(problem.requestId).toBeDefined();
    expect(JSON.stringify(problem)).not.toContain('sekret');
  });

  it('applies CORS to the development web origin only', async () => {
    const allowed = await app.inject({
      method: 'OPTIONS',
      url: HEALTH_PATH,
      headers: { origin: 'http://localhost:3000', 'access-control-request-method': 'GET' },
    });
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    const refused = await app.inject({
      method: 'OPTIONS',
      url: HEALTH_PATH,
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
    });
    expect(refused.headers['access-control-allow-origin']).toBeUndefined();
  });
});
