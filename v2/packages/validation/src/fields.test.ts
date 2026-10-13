import { describe, expect, it } from 'vitest';

import {
  EMAIL_AS_DRAWN,
  HTTPS_LINK_AS_DRAWN,
  calendarDateString,
  emailAsDrawn,
  httpsLinkAsDrawn,
  optionalTrimmed,
  requiredTrimmed,
  wholeNumberInRange,
  wholeNumberString,
} from './fields.js';

/** The message keys a schema reports for a value, in order. */
function keys(schema: { safeParse(value: unknown): unknown }, value: unknown): string[] {
  const result = schema.safeParse(value) as
    { success: true } | { success: false; error: { issues: { message: string }[] } };
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('requiredTrimmed', () => {
  const field = requiredTrimmed('required');

  it('accepts text and trims it (an explicit transformation)', () => {
    expect(field.parse('  Godavari Institute  ')).toBe('Godavari Institute');
  });

  it('reports the required key for missing, blank and non-text values', () => {
    for (const value of [undefined, null, '', '   ', 7]) {
      expect(keys(field, value), String(value)).toEqual(['required']);
    }
  });
});

describe('optionalTrimmed', () => {
  const field = optionalTrimmed();

  it('keeps null, trims text and reads blank as null — never a default value', () => {
    expect(field.parse(null)).toBeNull();
    expect(field.parse('   ')).toBeNull();
    expect(field.parse(' Sem II ')).toBe('Sem II');
  });

  it('refuses a missing value: absent and null are different inputs', () => {
    expect(field.safeParse(undefined).success).toBe(false);
  });
});

describe('wholeNumberString (B1-07 licences)', () => {
  const field = wholeNumberString('required', 'whole-number');

  it('parses the trimmed whole number', () => {
    expect(field.parse('120')).toBe(120);
    expect(field.parse(' 60 ')).toBe(60);
  });

  it('reports only the required key when the value is missing', () => {
    expect(keys(field, '')).toEqual(['required']);
    expect(keys(field, undefined)).toEqual(['required']);
  });

  it('reports the format key for anything but a whole number of 1 or more', () => {
    for (const value of ['0', '50.5', 'two', '1e3', '-4', '012']) {
      expect(keys(field, value), value).toEqual(['whole-number']);
    }
  });
});

describe('wholeNumberInRange (B4-04 pass mark, B4-09 marks)', () => {
  const passMark = wholeNumberInRange(0, 100, 'required', 'range');

  it('accepts the bounds and parses them', () => {
    expect(passMark.parse('0')).toBe(0);
    expect(passMark.parse(' 100 ')).toBe(100);
  });

  it('reports the format key outside the range or for a fraction', () => {
    for (const value of ['101', '50.5', '-1', 'fifty']) {
      expect(keys(passMark, value), value).toEqual(['range']);
    }
    expect(keys(passMark, ' ')).toEqual(['required']);
  });
});

describe('emailAsDrawn and httpsLinkAsDrawn', () => {
  it('check the trimmed value with the boards’ own expressions', () => {
    const email = emailAsDrawn('required', 'format');
    expect(email.parse(' meera.iyer@godavari.edu.in ')).toBe('meera.iyer@godavari.edu.in');
    expect(keys(email, 'meera.iyer@godavari')).toEqual(['format']);
    expect(keys(email, '')).toEqual(['required']);
    const link = httpsLinkAsDrawn('required', 'format');
    expect(link.parse('https://labs.example/shell-and-tube')).toBe(
      'https://labs.example/shell-and-tube',
    );
    expect(keys(link, 'http://labs.example/x')).toEqual(['format']);
  });

  it('publish the drawn expressions unchanged', () => {
    expect(EMAIL_AS_DRAWN.source).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
    expect(HTTPS_LINK_AS_DRAWN.source).toBe('^https:\\/\\/[^\\s/.]+\\.[^\\s]+$');
  });
});

describe('calendarDateString', () => {
  const date = calendarDateString('required', 'format');

  it('accepts a real date and refuses an impossible one', () => {
    expect(date.parse(' 2027-10-07 ')).toBe('2027-10-07');
    expect(keys(date, '2026-02-30')).toEqual(['format']);
    expect(keys(date, '7 Oct 2027')).toEqual(['format']);
    expect(keys(date, '')).toEqual(['required']);
  });
});
