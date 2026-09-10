import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { isIsoInstant, isoInstant, isoInstantWire } from './instant.js';

const VALID = [
  '2026-09-01T15:30:00+05:30',
  '2026-09-01T10:00:00Z',
  '2026-09-01T10:00:00.250Z',
  '2024-02-29T00:00:00Z',
];
const INVALID = [
  'Sep 1, 2026 10:00:00 GMT',
  '2026-09-01 10:00:00',
  '2026-09-01T10:00:00', // no offset
  '2026-09-01T10:00Z', // RFC 3339 requires seconds
  '2026-13-01T10:00:00Z', // no such month
  '2026-02-30T10:00:00Z', // no such day
  '2023-02-29T10:00:00Z', // not a leap year
  '',
  1725184800000,
  null,
];

describe('isoInstantWire (wire form)', () => {
  it('accepts RFC 3339 date-times with an explicit offset, unchanged', () => {
    for (const value of VALID) {
      expect(isoInstantWire.parse(value)).toBe(value);
      expect(isIsoInstant(value)).toBe(true);
    }
  });

  it('refuses every other serialisation and every impossible calendar value', () => {
    for (const value of INVALID) {
      expect(isoInstantWire.safeParse(value).success, String(value)).toBe(false);
      expect(isIsoInstant(value)).toBe(false);
    }
  });

  it('publishes the same rule as a standard date-time contract', () => {
    const json = z.toJSONSchema(isoInstantWire, { target: 'openapi-3.0', io: 'input' }) as {
      type: string;
      format: string;
      pattern: string;
      description: string;
    };
    expect(json.type).toBe('string');
    expect(json.format).toBe('date-time');
    expect(json.description).toContain('RFC 3339');
    // The published pattern is Zod's own; it must agree with runtime validation.
    const published = new RegExp(json.pattern);
    for (const value of VALID) expect(published.test(value), value).toBe(true);
    for (const value of INVALID.filter((v): v is string => typeof v === 'string')) {
      expect(published.test(value), value).toBe(false);
    }
  });
});

describe('isoInstant (accepted form)', () => {
  it('normalises to canonical UTC', () => {
    expect(isoInstant.parse('2026-09-01T15:30:00+05:30')).toBe('2026-09-01T10:00:00.000Z');
    expect(isoInstant.parse('2026-09-01T10:00:00.250Z')).toBe('2026-09-01T10:00:00.250Z');
  });

  it('orders correctly after normalisation', () => {
    const later = isoInstant.parse('2026-09-01T10:00:01Z');
    const earlier = isoInstant.parse('2026-09-01T15:30:00+05:30');
    expect(earlier < later).toBe(true);
  });

  it('is not representable as a wire schema (it carries a transform)', () => {
    expect(() => z.toJSONSchema(isoInstant, { target: 'openapi-3.0', io: 'output' })).toThrow(
      /transform/i,
    );
  });
});
