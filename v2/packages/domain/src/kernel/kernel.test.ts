/**
 * The kernel (Appendix C §1; Appendix F §6.1–§6.2): drawn ids, time brands, provided values,
 * decisions and transition tables.
 */
import { describe, expect, it } from 'vitest';

import { invalidInput, isBlank, isWholeNumber, ok, refused } from './decision.js';
import { DRAWN_ID_PREFIX, isDrawnId, RESERVED_ID_SLUGS } from './ids.js';
import { commandsFrom, isDrawnPair, isDrawnTransition, transitionFor } from './machine.js';
import { provided } from './provided.js';
import { newMeta, nextMeta, RECORD_KINDS } from './record.js';
import { addDays, calendarDate, dateOf, daysBetween, isoInstant } from './time.js';

describe('record ids (B8-03 "Record IDs": prefix + four digits)', () => {
  it('the twelve drawn prefixes', () => {
    expect(Object.values(DRAWN_ID_PREFIX)).toEqual([
      'REQ',
      'ACC',
      'SACC',
      'ASMT',
      'ATT',
      'SUB',
      'UPD',
      'DTR',
      'SUP',
      'Q',
      'GRP',
      'FMAP',
    ]);
    expect(isDrawnId('request', 'REQ-0042')).toBe(true);
    expect(isDrawnId('question', 'Q-0101')).toBe(true);
    expect(isDrawnId('request', 'REQ-42')).toBe(false);
    expect(isDrawnId('group', 'GRP-0012 ')).toBe(false);
  });

  it('reserved slugs are never minted (route collisions)', () => {
    expect(RESERVED_ID_SLUGS).toEqual([
      'new',
      'draft',
      'import',
      'edit',
      'revise',
      'help',
      'not-allowed',
    ]);
  });

  it('one RecordKind union with board naming: FMAP (not FCM) and a separate COMP (ADR-0008)', () => {
    expect(RECORD_KINDS).toContain('FMAP');
    expect(RECORD_KINDS).toContain('COMP');
    expect(RECORD_KINDS).not.toContain('FCM');
    expect(RECORD_KINDS).toHaveLength(23);
  });
});

describe('time (Appendix C §1.2): canonical instants and calendar dates', () => {
  it('accepts only the canonical UTC form', () => {
    expect(isoInstant('2026-10-08T09:35:00.000Z')).toBe('2026-10-08T09:35:00.000Z');
    expect(() => isoInstant('2026-10-08T09:35:00Z')).toThrow(RangeError);
    expect(() => isoInstant('8 Oct 2026, 15:05')).toThrow(RangeError);
  });

  it('an unreadable date is invalid data, never "expired" (CF-06 interim)', () => {
    expect(calendarDate('2027-10-07')).toBe('2027-10-07');
    expect(() => calendarDate('2027-02-30')).toThrow(RangeError);
    expect(() => calendarDate('7 Oct 2027')).toThrow(RangeError);
  });

  it('whole calendar days', () => {
    expect(daysBetween(calendarDate('2026-10-23'), calendarDate('2026-10-31'))).toBe(8);
    expect(daysBetween(calendarDate('2026-10-31'), calendarDate('2026-10-23'))).toBe(-8);
    expect(addDays(calendarDate('2027-10-08'), -1)).toBe('2027-10-07');
    expect(dateOf(isoInstant('2026-10-23T23:59:59.000Z'))).toBe('2026-10-23');
  });
});

describe('provided values pass through unchanged (T-06; acceptance 6)', () => {
  it('a provided figure is the figure', () => {
    const licences = provided(120);
    expect(licences).toBe(120);
    expect(licences + 0).toBe(120);
  });
});

describe('decisions and metadata', () => {
  it('helpers', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(refused('plan-ended')).toEqual({
      ok: false,
      refusal: { kind: 'refused', code: 'plan-ended' },
    });
    expect(invalidInput({ field: 'reason', rule: 'required' })).toEqual({
      ok: false,
      refusal: { kind: 'validation-failed', issues: [{ field: 'reason', rule: 'required' }] },
    });
    expect([isBlank(' '), isBlank(null), isBlank('x')]).toEqual([true, true, false]);
    // "50.5" and "two" are rejected; whole numbers only (B4-04, B4-07, B1-07).
    expect([
      isWholeNumber(50.5),
      isWholeNumber(0),
      isWholeNumber(0, 1),
      isWholeNumber(120, 1),
    ]).toEqual([false, true, false, true]);
  });

  it('rev +1 on every write', () => {
    const meta = newMeta(isoInstant('2026-10-08T09:35:00.000Z'));
    expect(nextMeta(meta, isoInstant('2026-10-09T09:35:00.000Z'))).toEqual({
      rev: 2,
      createdAt: '2026-10-08T09:35:00.000Z',
      updatedAt: '2026-10-09T09:35:00.000Z',
    });
  });

  it('transition tables answer exactly what is drawn', () => {
    const table = [
      { from: null, to: 'a', command: 'make', actors: ['student'] },
      { from: 'a', to: 'b', command: 'go', actors: ['student'] },
    ] as const;
    expect(transitionFor(table, 'a', 'go')?.to).toBe('b');
    expect(transitionFor(table, 'b', 'go')).toBeUndefined();
    expect(isDrawnTransition(table, 'a', 'b', 'go')).toBe(true);
    expect(isDrawnTransition(table, 'a', 'b', 'make')).toBe(false);
    expect(isDrawnPair(table, null, 'a')).toBe(true);
    expect(isDrawnPair(table, 'b', 'a')).toBe(false);
    expect(commandsFrom(table, 'a')).toEqual(['go']);
  });
});
