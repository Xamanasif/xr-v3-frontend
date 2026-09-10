import { describe, expect, it } from 'vitest';

import { parseTscSummary } from '../../../../scripts/graph-dev.mjs';

describe('parseTscSummary (dev compile gate)', () => {
  it('reads the error count of a tsc --watch summary', () => {
    expect(parseTscSummary('11:05:32 AM - Found 0 errors. Watching for file changes.')).toEqual({
      errors: 0,
    });
    expect(parseTscSummary('Found 1 error. Watching for file changes.')).toEqual({ errors: 1 });
    expect(parseTscSummary('Found 12 errors. Watching for file changes.')).toEqual({ errors: 12 });
  });

  it('ignores every other line', () => {
    expect(
      parseTscSummary("src/x.ts(1,1): error TS2322: Type 'string' is not assignable"),
    ).toBeNull();
    expect(parseTscSummary('Starting compilation in watch mode...')).toBeNull();
    expect(parseTscSummary('')).toBeNull();
  });
});
