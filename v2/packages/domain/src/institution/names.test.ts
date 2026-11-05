/**
 * The interim same-name rule (owner decision DP-09, 5 Nov 2026): letter case, leading and trailing
 * whitespace, repeated internal whitespace and equivalent Unicode dashes are normalised; nothing
 * else is — no fuzzy match and no merge.
 */
import { describe, expect, it } from 'vitest';

import { unsafeBrand } from '../kernel/brand.js';
import type { InstitutionId } from '../kernel/ids.js';
import {
  institutionIdsNamed,
  institutionNameKey,
  institutionsNamed,
  sameInstitutionName,
} from './names.js';

const SEEDED = 'BITS Pilani — Hyderabad Campus';

describe('the interim same-name rule (DP-09)', () => {
  it.each([
    ['letter case', 'bits pilani — hyderabad campus'],
    ['leading and trailing whitespace', '  BITS Pilani — Hyderabad Campus \t'],
    ['repeated internal whitespace', 'BITS  Pilani —   Hyderabad\u00A0Campus'],
    ['hyphen-minus for the em dash', 'BITS Pilani - Hyderabad Campus'],
    ['en dash for the em dash', 'BITS Pilani – Hyderabad Campus'],
    ['horizontal bar', 'BITS Pilani ― Hyderabad Campus'],
    ['minus sign', 'BITS Pilani − Hyderabad Campus'],
    ['full-width hyphen-minus', 'BITS Pilani － Hyderabad Campus'],
  ])('%s names the same institution', (_, typed) => {
    expect(sameInstitutionName(typed, SEEDED)).toBe(true);
  });

  it.each([
    ['another campus', 'BITS Pilani — Goa Campus'],
    ['a dash without its spaces (no fuzzy match)', 'BITS Pilani—Hyderabad Campus'],
    ['an abbreviation', 'BITS Hyderabad'],
    ['a missing word', 'BITS Pilani Hyderabad Campus'],
    ['an extra word', 'BITS Pilani — Hyderabad Campus Trust'],
  ])('%s is a different name', (_, typed) => {
    expect(sameInstitutionName(typed, SEEDED)).toBe(false);
  });

  it('the comparison form only folds case, whitespace and dashes', () => {
    expect(institutionNameKey('  Godavari   Institute — of\tTechnology ')).toBe(
      'godavari institute - of technology',
    );
  });

  it('lists every existing institution of that name, in the order given, and nothing for a blank name', () => {
    const records = [
      { id: unsafeBrand<InstitutionId>('bitshyd'), name: SEEDED },
      { id: unsafeBrand<InstitutionId>('konark'), name: 'Konark Polytechnic' },
      { id: unsafeBrand<InstitutionId>('bitshyd-2'), name: 'BITS PILANI - HYDERABAD CAMPUS' },
    ];
    expect(institutionsNamed('bits pilani – hyderabad campus', records).map((r) => r.id)).toEqual([
      'bitshyd',
      'bitshyd-2',
    ]);
    expect(institutionIdsNamed('Krishna Engineering College', records)).toEqual([]);
    expect(institutionIdsNamed('   ', records)).toEqual([]);
  });
});
