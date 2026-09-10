import { describe, expect, it } from 'vitest';

import {
  ValidationProblemException,
  validationExceptionFactory,
} from './validation-problem.exception.js';

describe('validationExceptionFactory', () => {
  it('flattens Standard Schema issue paths, including path-segment objects', () => {
    const exception = validationExceptionFactory([
      { message: 'must be an integer', path: ['quantity'] },
      { message: 'required', path: [{ key: 'checks' }, { key: 'database' }] },
      { message: 'invalid input' },
    ]);
    expect(exception).toBeInstanceOf(ValidationProblemException);
    expect(exception.getStatus()).toBe(400);
    expect(exception.issues).toEqual([
      { path: 'quantity', message: 'must be an integer' },
      { path: 'checks.database', message: 'required' },
      { path: '(root)', message: 'invalid input' },
    ]);
  });
});
