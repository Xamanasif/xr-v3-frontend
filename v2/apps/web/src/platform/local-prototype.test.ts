/**
 * DP-16 (B2B milestone I2): which builds serve the `/prototype` support pages — a sample build of a
 * local development build or of the isolated prototype profile; never staging or production, and
 * never an API build.
 */
import { describe, expect, it } from 'vitest';

import { servesPrototypePages } from './local-prototype';

describe('servesPrototypePages', () => {
  it.each([
    ['development', 'sample', true],
    ['prototype', 'sample', true],
    ['staging', 'sample', false],
    ['production', 'sample', false],
    ['development', 'api', false],
    ['prototype', 'api', false],
  ] as const)('%s with the %s data source → %s', (environment, dataSource, expected) => {
    expect(
      servesPrototypePages({
        NEXT_PUBLIC_APP_ENV: environment,
        NEXT_PUBLIC_XR_DATA_SOURCE: dataSource,
      }),
    ).toBe(expected);
  });
});
