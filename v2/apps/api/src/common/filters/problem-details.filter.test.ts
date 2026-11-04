import {
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { problemDetailsSchema } from '@xr/contracts';
import { describe, expect, it } from 'vitest';

import { ValidationProblemException } from '../validation/validation-problem.exception.js';
import { safeInstance, stripQueryStrings, titleFor, toProblem } from './problem-details.filter.js';

const SECRET_URL = '/api/v1/health?token=sekret-123&filter=ssn';
const INTERNAL_MESSAGE = 'connection to db.internal:5432 failed: password "hunter2" rejected';

describe('toProblem — 5xx never leaks internals', () => {
  it('a generic Error becomes a generic 500', () => {
    const problem = toProblem(new Error(INTERNAL_MESSAGE), {
      id: 'req-9',
      method: 'GET',
      url: SECRET_URL,
    });
    expect(problemDetailsSchema.parse(problem)).toMatchObject({
      status: 500,
      title: 'Internal Server Error',
      instance: '/api/v1/health',
      requestId: 'req-9',
    });
    const json = JSON.stringify(problem);
    for (const forbidden of ['db.internal', '5432', 'hunter2', 'token=', 'sekret', 'ssn']) {
      expect(json).not.toContain(forbidden);
    }
  });

  it('an InternalServerErrorException with an internal host and secret is sanitised', () => {
    const problem = toProblem(new InternalServerErrorException(INTERNAL_MESSAGE), {
      url: SECRET_URL,
    });
    expect(problem.status).toBe(500);
    expect(JSON.stringify(problem)).not.toContain('db.internal');
    expect(JSON.stringify(problem)).not.toContain('hunter2');
    expect(problem.detail).not.toContain('hunter2');
  });

  it('every 5xx HttpException is treated the same way', () => {
    const problem = toProblem(new ServiceUnavailableException('upstream 10.0.0.9 down'), {});
    expect(problem).toMatchObject({ status: 503, title: 'Service Unavailable' });
    expect(JSON.stringify(problem)).not.toContain('10.0.0.9');
  });

  it('never copies a query string into instance or detail', () => {
    const problem = toProblem(new NotFoundException(`Cannot GET ${SECRET_URL}`), {
      id: 'req-1',
      method: 'GET',
      url: SECRET_URL,
    });
    expect(problem.instance).toBe('/api/v1/health');
    expect(problem.detail).toBe('No route for GET /api/v1/health');
    expect(JSON.stringify(problem)).not.toContain('token=');
  });

  it('a handler’s 404 for a missing record keeps its detail; the route is not called missing', () => {
    const problem = toProblem(
      new NotFoundException('The experiment is not in the public catalogue.'),
      { id: 'req-3', method: 'GET', url: '/api/v1/catalogue/experiments/unknown?token=sekret' },
    );
    expect(problem).toMatchObject({
      status: 404,
      title: 'Not Found',
      detail: 'The experiment is not in the public catalogue.',
      instance: '/api/v1/catalogue/experiments/unknown',
    });
    expect(JSON.stringify(problem)).not.toContain('token=');
  });
});

describe('toProblem — ordinary 4xx behaviour is preserved', () => {
  it('keeps a client-facing message and the status', () => {
    const problem = toProblem(
      new UnprocessableEntityException('Licence quantity exceeds the request'),
      {
        id: 'req-2',
        method: 'POST',
        url: '/api/v1/requests/R1/grant?dry=1',
      },
    );
    expect(problemDetailsSchema.parse(problem)).toMatchObject({
      status: 422,
      title: 'Unprocessable Entity',
      detail: 'Licence quantity exceeds the request',
      instance: '/api/v1/requests/R1/grant',
      requestId: 'req-2',
    });
  });

  it('renders validation issues as errors', () => {
    const problem = toProblem(
      new ValidationProblemException([{ path: 'database', message: 'bad' }]),
      {
        url: '/api/v1/health?database=maybe',
      },
    );
    expect(problem.status).toBe(400);
    expect(problem.errors).toEqual([{ path: 'database', message: 'bad' }]);
    expect(problem.instance).toBe('/api/v1/health');
  });

  it('strips query strings that a framework message may echo', () => {
    expect(stripQueryStrings('Cannot GET /x?token=abc and /y?k=v')).toBe('Cannot GET /x and /y');
    expect(stripQueryStrings('plain text')).toBe('plain text');
  });
});

describe('helpers', () => {
  it('safeInstance keeps the path only', () => {
    expect(safeInstance('/a/b?c=1#frag')).toBe('/a/b');
    expect(safeInstance('/a/b')).toBe('/a/b');
    expect(safeInstance(undefined)).toBeUndefined();
  });

  it('titleFor is human-readable', () => {
    expect(titleFor(404)).toBe('Not Found');
    expect(titleFor(500)).toBe('Internal Server Error');
    expect(titleFor(999)).toBe('Error');
  });
});
