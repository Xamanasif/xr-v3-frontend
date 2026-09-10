import { describe, expect, it } from 'vitest';

import { identifier, slug } from './identifiers.js';

describe('identifiers', () => {
  it('bounds identifiers without altering them', () => {
    expect(identifier.parse('EXP-001')).toBe('EXP-001');
    expect(identifier.safeParse('').success).toBe(false);
    expect(identifier.safeParse('x'.repeat(201)).success).toBe(false);
  });

  it('accepts catalogue slugs only', () => {
    expect(slug.parse('direct-shear')).toBe('direct-shear');
    expect(slug.safeParse('Direct Shear').success).toBe(false);
    expect(slug.safeParse('c_shear').success).toBe(false);
  });
});
