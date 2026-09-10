import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PROBLEM_JSON, problemDetailsSchema } from '@xr/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/bootstrap.js';
import { BoomModule, INTERNAL_SECRET, PLAIN_SECRET } from './fixtures/boom.module.js';

const FORBIDDEN = [
  'db.internal',
  '5432',
  'hunter2',
  'token=',
  'sekret',
  '10.0.0.9',
  'at ',
  'stack',
];

describe('error boundary — 5xx responses carry no internal detail', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApp({
      env: { APP_ENV: 'development', DATABASE_URL: '' },
      additionalModules: [BoomModule],
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  for (const [route, secret] of [
    ['http', INTERNAL_SECRET],
    ['error', PLAIN_SECRET],
  ] as const) {
    it(`GET /api/v1/__boom/${route} → generic 500 problem`, async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/__boom/${route}?token=sekret-123&filter=ssn`,
      });
      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toContain(PROBLEM_JSON);
      const problem = problemDetailsSchema.parse(response.json());
      expect(problem).toMatchObject({
        status: 500,
        title: 'Internal Server Error',
        instance: `/api/v1/__boom/${route}`,
      });
      expect(problem.requestId).toBeDefined();
      const raw = response.body;
      expect(raw).not.toContain(secret);
      for (const forbidden of FORBIDDEN) {
        expect(raw, `must not contain "${forbidden}"`).not.toContain(forbidden);
      }
    });
  }
});
