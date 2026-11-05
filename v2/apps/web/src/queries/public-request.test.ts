/**
 * PU-08's field errors from a validation failure: the drawn words, else the state-copy register's
 * provisional words for an undrawn rule (VD-12).
 */
import { describe, expect, it } from 'vitest';

import { requestErrors } from './public-request';

describe('requestErrors', () => {
  it('an end date not later than today takes the register’s words (B2B milestone I1, C2)', () => {
    const check = requestErrors({
      kind: 'validation-failed',
      summaryTitle: null,
      fieldErrors: [
        {
          field: 'term.endsOn',
          key: 'PU-08.term.endsOn.after-today',
          message: null,
          params: {},
        },
      ],
    });
    expect(check.errors).toEqual([
      {
        field: 'term.endsOn',
        message: 'Choose a date after today.',
        summaryText: 'Choose a date after today.',
      },
    ]);
  });
});
