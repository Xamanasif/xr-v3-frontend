/**
 * IA-01's view rules (B2-01): every attention fact the contract names becomes the drawn row — its
 * icon, tone, words and one action — and a row whose page is not built in Package 2A keeps its
 * words with no action (state-copy `IA-01.not-rendered`); the header's actions follow the status.
 */
import type { InstituteAttention } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { attentionRows, headerActions } from './overview-view';

const ALL_KINDS = [
  { kind: 'institution-paused' },
  { kind: 'plan-ending-soon', planId: 'ACC-0107', endsOn: '2027-10-07', daysLeft: 15 },
  { kind: 'plan-ended', planId: 'ACC-0107', endedOn: '2027-10-07' },
  {
    kind: 'students-waiting-for-a-licence',
    experimentId: 'shell-and-tube-heat-exchanger',
    experimentName: 'Shell-and-Tube Heat Exchanger',
    students: 2,
  },
  {
    kind: 'experiment-not-given',
    planId: 'ACC-0107',
    experimentId: 'shell-and-tube-heat-exchanger',
    courseId: 'thermodynamics-heat-transfer',
    experimentName: 'Shell-and-Tube Heat Exchanger',
    courseCode: 'ME ZG523',
  },
  { kind: 'students-without-access', students: 3, lastAddedOn: '2027-09-15', lastAddedHow: 'form' },
  { kind: 'course-without-code', courseId: 'thermodynamics-heat-transfer', courseCode: 'ME ZG523' },
] as unknown as readonly InstituteAttention[];

describe('attentionRows (B2-01 f0, f3, f4, f5, f7)', () => {
  it('writes each fact as its drawn row', () => {
    expect(
      attentionRows(ALL_KINDS).map((row) => [
        row.icon,
        row.tone ?? null,
        row.title,
        row.sub,
        row.action,
      ]),
    ).toEqual([
      [
        'paused',
        'wait',
        'BITS has paused your institution’s access',
        'Students can’t open experiments. Pages are read-only until BITS lifts the pause.',
        { href: '/institute/help', label: 'Help' },
      ],
      [
        'clock',
        'wait',
        'Access plan ACC-0107 ends in 15 days',
        'Ends 7 Oct 2027 · renewal reminder due',
        null,
      ],
      [
        'notAvailable',
        null,
        'Access plan ACC-0107 has ended',
        'Ended 7 Oct 2027 · students can’t open its experiments now',
        null,
      ],
      [
        'clock',
        'wait',
        '2 students are waiting for a licence',
        'Shell-and-Tube Heat Exchanger',
        { href: '/institute/student-access', label: 'View students' },
      ],
      [
        'warning',
        'wait',
        'Shell-and-Tube Heat Exchanger hasn’t been given to any student',
        'ME ZG523 · access plan ACC-0107',
        {
          href: '/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=shell-and-tube-heat-exchanger',
          label: 'Give access',
        },
      ],
      [
        'studentAccess',
        null,
        '3 students have no access yet',
        'Added on 15 Sep 2027',
        { href: '/institute/people', label: 'Review students' },
      ],
      [
        'courseCodes',
        null,
        'ME ZG523 has no course code from your institution',
        'Content access · Course codes',
        // Package 2B: Course codes (IA-16) is built.
        { href: '/institute/content-access?tab=course-codes', label: 'Add course code' },
      ],
    ]);
  });

  it('keys stay unique when two items share a kind', () => {
    const rows = attentionRows([ALL_KINDS[4]!, ALL_KINDS[4]!]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(2);
  });
});

describe('headerActions (B2-01 f0, f1, f3, f4, f5)', () => {
  it('two while access is live, “Add students” once it has ended, none paused or before payment', () => {
    expect(headerActions('access-active')).toEqual({ addStudents: true, giveAccess: true });
    expect(headerActions('ending-soon')).toEqual({ addStudents: true, giveAccess: true });
    expect(headerActions('access-ended')).toEqual({ addStudents: true, giveAccess: false });
    expect(headerActions('access-paused')).toEqual({ addStudents: false, giveAccess: false });
    expect(headerActions('approved-payment-required')).toEqual({
      addStudents: false,
      giveAccess: false,
    });
  });
});
