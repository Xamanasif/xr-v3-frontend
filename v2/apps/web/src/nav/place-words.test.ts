/**
 * The return address in words for XS-03 "Session expired" (B1-09 f9; PROVISIONAL rule): built
 * pages only, never the address, and nothing a crafted link could write into the card.
 */
import { describe, expect, it } from 'vitest';

import { placeWordsOf } from './place-words';

describe('placeWordsOf', () => {
  it.each([
    ['/admin/requests', 'Requests'],
    ['/admin/requests?status=under-review', 'Requests'],
    ['/admin/requests/REQ-0038', 'Requests › REQ-0038'],
    ['/admin/requests/REQ-0038#decision', 'Requests › REQ-0038'],
    ['/student/help', 'Help & support'],
    ['/faculty/help/report', 'Help & support › Report a problem'],
    ['/vendor/help/reports/SUP-0213', 'Help & support › SUP-0213'],
  ])('%s → %s', (path, place) => {
    expect(placeWordsOf(path)).toBe(place);
  });

  it.each([
    [null],
    [''],
    ['/'],
    ['/admin'],
    ['/student/courses'],
    ['https://evil.example/admin/requests'],
    ['//evil.example/admin/requests'],
    ['/sign-in'],
  ])('%j has no words', (path) => {
    expect(placeWordsOf(path)).toBeNull();
  });

  it('a record segment that is not a reference names the list alone', () => {
    expect(placeWordsOf('/admin/requests/Enter%20your%20password%20here')).toBe('Requests');
    expect(placeWordsOf('/student/help/reports/%E0%A4%A')).toBe('Help & support');
    expect(placeWordsOf('/admin/requests/req-0038')).toBe('Requests');
  });
});
