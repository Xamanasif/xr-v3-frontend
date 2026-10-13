import { afterEach, describe, expect, it } from 'vitest';

import { forgetPageVisits, originOf, recordPageVisit } from './page-location';

afterEach(() => forgetPageVisits());

describe('"Where did it happen?" — the last page outside Help (board 07 "State 1")', () => {
  it('starts empty: no page seen yet in this tab', () => {
    expect(originOf('per-0002')).toBe('');
  });

  it('keeps the page’s own words, crumbs first, joined as board 07 writes places', () => {
    recordPageVisit('per-0002', { words: ['My courses', 'Not available'], help: false });
    expect(originOf('per-0002')).toBe('My courses · Not available');
  });

  it('Help & support pages are never the place: the page before Help is kept', () => {
    recordPageVisit('per-0002', { words: ['Not found'], help: false });
    recordPageVisit('per-0002', { words: ['Help & support'], help: true });
    recordPageVisit('per-0002', { words: ['Help & support', 'Report a problem'], help: true });
    expect(originOf('per-0002')).toBe('Not found');
  });

  it('is kept per person: someone else signed in in the tab never sees it', () => {
    recordPageVisit('per-0002', { words: ['Not your workspace'], help: false });
    expect(originOf('per-kavya-nair')).toBe('');
  });

  it('ignores empty words', () => {
    recordPageVisit('per-0002', { words: ['  ', ''], help: false });
    expect(originOf('per-0002')).toBe('');
  });
});
