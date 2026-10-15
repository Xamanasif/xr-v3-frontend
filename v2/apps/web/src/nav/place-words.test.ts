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
    // Package 1D: the Super Admin's Overview and Institutions.
    ['/admin', 'Overview'],
    ['/admin/institutions', 'Institutions'],
    ['/admin/institutions/godavari', 'Institutions'],
    // Package 2A: the Institute Admin's and the Student's pages name their destination.
    ['/institute', 'Overview'],
    ['/institute/content-access', 'Content access'],
    ['/institute/content-access/plans/ACC-0107', 'Content access › ACC-0107'],
    ['/institute/student-access/give?step=review', 'Student access'],
    ['/institute/people/students/per-0002', 'People'],
    // Package 2B: the Faculty record, Import students, a Group and the tabs.
    ['/institute/people/faculty/per-0013', 'People'],
    ['/institute/people/import', 'People'],
    ['/institute/people/groups/GRP-0012', 'People'],
    ['/institute/people?tab=groups', 'People'],
    ['/institute/content-access?tab=course-codes', 'Content access'],
    ['/student/courses?tab=experiments', 'My courses'],
    ['/student', 'Home'],
    ['/student/courses', 'My courses'],
    ['/student/experiments/shell-and-tube-heat-exchanger', 'My courses'],
  ])('%s → %s', (path, place) => {
    expect(placeWordsOf(path)).toBe(place);
  });

  it.each([
    [null],
    [''],
    ['/'],
    ['/student/assessments'],
    ['/faculty'],
    ['https://evil.example/admin/requests'],
    ['//evil.example/admin/requests'],
    ['/sign-in'],
  ])('%j has no words', (path) => {
    expect(placeWordsOf(path)).toBeNull();
  });

  it.each([
    ['/student/progress', 'Progress'],
    ['/student/device', 'My device'],
    ['/student/experiments/shell-and-tube-heat-exchanger/simulation/web', 'My courses'],
    ['/student/experiments/shell-and-tube-heat-exchanger/feedback/vr', 'My courses'],
    ['/institute/requests', 'Requests'],
    ['/institute/requests/REQ-0058', 'Requests › REQ-0058'],
    ['/institute/requests/devices/DTR-0018', 'Requests › Device requests › DTR-0018'],
    ['/institute/usage', 'Usage'],
    ['/admin/operations/device-transfers', 'Operations'],
    ['/admin/operations/device-transfers/DTR-0018', 'Operations › DTR-0018'],
  ])('Phase 3: %s is “%s”', (path, words) => {
    expect(placeWordsOf(path)).toBe(words);
  });

  it('a record segment that is not a reference names the list alone', () => {
    expect(placeWordsOf('/admin/requests/Enter%20your%20password%20here')).toBe('Requests');
    expect(placeWordsOf('/student/help/reports/%E0%A4%A')).toBe('Help & support');
    expect(placeWordsOf('/admin/requests/req-0038')).toBe('Requests');
    expect(placeWordsOf('/admin/institutions/Enter%20your%20password%20here')).toBe('Institutions');
  });
});
