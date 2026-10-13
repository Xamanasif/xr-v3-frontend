import { describe, expect, it } from 'vitest';

import { dayMonth, dayMonthYear } from './dates';

describe('dates as the boards write them (B8-03; board 07)', () => {
  it('day and month in Indian time, with the boards’ month names', () => {
    expect(dayMonth('2026-09-28T04:30:00.000Z')).toBe('28 Sep');
    expect(dayMonth('2026-10-06T04:30:00.000Z')).toBe('6 Oct');
    // 23:30 UTC on 2 Oct is already 3 Oct in IST.
    expect(dayMonth('2026-10-02T23:30:00.000Z')).toBe('3 Oct');
    expect(dayMonthYear('2026-10-08T09:35:00.000Z')).toBe('8 Oct 2026');
  });

  it('never a numeric date, and never "Sept"', () => {
    for (let month = 0; month < 12; month += 1) {
      const text = dayMonth(new Date(Date.UTC(2026, month, 15, 6)).toISOString());
      expect(text).toMatch(/^15 [A-Z][a-z]{2}$/);
    }
  });

  it('refuses what is not an instant', () => {
    expect(() => dayMonth('not a date')).toThrow();
  });
});
