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
    ['/admin/requests/REQ-0038', 'Requests'],
    ['/admin/requests/REQ-0038#decision', 'Requests'],
    ['/student/help', 'Help & support'],
    ['/faculty/help/report', 'Help & support › Report a problem'],
    ['/vendor/help/reports/SUP-0213', 'Help & support › SUP-0213'],
    // A Super Admin sees no report reference (owner decision 6; SA-v1).
    ['/admin/help/reports/SUP-0213', 'Help & support'],
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
    ['/reviewer/submissions/SUB-0077', 'Review queue'],
    ['/reviewer/reviewed', 'Reviewed by me'],
    ['/content-manager/decisions/SUB-0077', 'Ready to publish › SUB-0077'],
    ['/content-manager/published/distillation-column', 'Content library'],
    ['/content-manager/course-codes', 'Course codes'],
    // Phase 6.
    ['/content-manager/updates', 'Updates'],
    ['/content-manager/updates/UPD-0005?focus=summary', 'Updates › UPD-0005'],
    ['/reviewer/updates/UPD-0005', 'Review queue'],
    ['/admin/content/updates?show=on-hold', 'Content'],
    ['/admin/content/updates/UPD-0005', 'Content'],
    ['/admin/content/records/SUB-0085', 'Content'],
    ['/admin/content/records/distillation-column', 'Content'],
    ['/admin/structure/courses/fluid-mechanics', 'Academic structure'],
    ['/admin/roles/role-a-menon', 'Platform roles'],
    ['/admin/operations/support/SUP-0213', 'Operations'],
    ['/admin/operations/access-ending', 'Operations'],
  ])('%s → %s', (path, place) => {
    expect(placeWordsOf(path)).toBe(place);
  });

  it.each([
    [null],
    [''],
    ['/'],
    // An address that names no page has no words.
    ['/content-manager/nowhere'],
    ['https://evil.example/admin/requests'],
    ['//evil.example/admin/requests'],
    ['/sign-in'],
  ])('%j has no words', (path) => {
    expect(placeWordsOf(path)).toBeNull();
  });

  it.each([
    // Phase 4B: the Student's assessment pages, Marking, a submission, Students, the tools.
    // V3 (ST-v1): no Student words carry an internal reference (the owner's identifier rule).
    ['/student/assessments', 'Assessments'],
    ['/student/assessments/ASMT-0009', 'Assessments'],
    ['/student/assessments/ASMT-0009/attempt', 'Assessments'],
    ['/student/assessments/ASMT-0009/result', 'Assessments'],
    ['/student/experiments/shell-and-tube-heat-exchanger/assessment', 'My courses'],
    // V3 (FA-v1): no Faculty words carry an internal reference (the owner's identifier rule).
    ['/faculty/assessments/ASMT-0009/submissions', 'Assessments'],
    ['/faculty/marking', 'Marking'],
    ['/faculty/marking/ATT-0450', 'Marking › Mark a submission'],
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
    ['/faculty/assessments/ASMT-0009/settings', 'Assessments'],
    ['/faculty/question-bank/Q-0101', 'Question bank'],
    ['/student/progress', 'Progress'],
    ['/student/device', 'My device'],
    ['/student/experiments/shell-and-tube-heat-exchanger/simulation/web', 'My courses'],
    ['/student/experiments/shell-and-tube-heat-exchanger/feedback/vr', 'My courses'],
    ['/institute/requests', 'Requests'],
    ['/institute/requests/REQ-0058', 'Requests'],
    ['/institute/requests/devices/DTR-0018', 'Requests › Device requests'],
    ['/institute/usage', 'Usage'],
    ['/admin/operations/device-transfers', 'Operations'],
    ['/admin/operations/device-transfers/DTR-0018', 'Operations'],
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
