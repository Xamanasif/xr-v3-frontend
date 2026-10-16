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
    // Phase 5: the Vendor's, the Academic Reviewer's and the Content Manager's pages.
    ['/vendor', 'Overview'],
    ['/vendor/experiments', 'My experiments'],
    ['/vendor/experiments/new?step=formats', 'My experiments'],
    ['/vendor/experiments/SUB-0077', 'My experiments › SUB-0077'],
    ['/vendor/experiments/SUB-0077/revise', 'My experiments'],
    ['/reviewer/queue', 'Review queue'],
    ['/reviewer/submissions/SUB-0077', 'Review queue › SUB-0077'],
    ['/reviewer/reviewed', 'Reviewed by me'],
    ['/content-manager/decisions/SUB-0077', 'Ready to publish › SUB-0077'],
    ['/content-manager/published/distillation-column', 'Content library'],
    ['/content-manager/course-codes', 'Course codes'],
  ])('%s → %s', (path, place) => {
    expect(placeWordsOf(path)).toBe(place);
  });

  it.each([
    [null],
    [''],
    ['/'],
    // Phase 5: an unbuilt page (the Content Manager's Updates, Phase 6) has no words.
    ['/content-manager/updates'],
    ['https://evil.example/admin/requests'],
    ['//evil.example/admin/requests'],
    ['/sign-in'],
  ])('%j has no words', (path) => {
    expect(placeWordsOf(path)).toBeNull();
  });

  it.each([
    // Phase 4B: the Student's assessment pages, Marking, a submission, Students, the tools.
    ['/student/assessments', 'Assessments'],
    ['/student/assessments/ASMT-0009', 'Assessments › ASMT-0009'],
    ['/student/assessments/ASMT-0009/attempt', 'Assessments › ASMT-0009'],
    ['/student/assessments/ASMT-0009/result', 'Assessments › ASMT-0009'],
    ['/student/experiments/shell-and-tube-heat-exchanger/assessment', 'My courses'],
    ['/faculty/assessments/ASMT-0009/submissions', 'Assessments › ASMT-0009'],
    ['/faculty/marking', 'Marking'],
    ['/faculty/marking/ATT-0450', 'Marking › ATT-0450'],
    ['/faculty/students', 'Students'],
    ['/faculty/students/per-0002?experimentId=shell-and-tube-heat-exchanger', 'Students'],
    ['/faculty/question-bank/draft', 'Question bank'],
    ['/faculty/question-bank/import', 'Question bank'],
  ])('%s → %s', (path, place) => {
    expect(placeWordsOf(path)).toBe(place);
  });

  it.each([
    // Phase 4A.
    ['/faculty', 'Overview'],
    ['/faculty/courses?tab=experiments', 'My courses'],
    ['/faculty/experiments/shell-and-tube-heat-exchanger', 'My courses'],
    ['/faculty/assessments/new?step=rules', 'Assessments'],
    ['/faculty/assessments/ASMT-0009/settings', 'Assessments › ASMT-0009'],
    ['/faculty/question-bank/Q-0101', 'Question bank'],
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
