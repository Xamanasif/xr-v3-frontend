/**
 * IA-01's view rules in the V3 design (IA-v1 `attention`): every attention fact the contract names
 * becomes the lead band (the pause, a plan ending soon, an ended plan) or a counted item — its
 * count, words, line and one action — the device requests join the items before the students
 * without access, at most six rows; the head's actions follow the status. No reference is written.
 */
import type { ContentAccessRow, InstituteAttention } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { attentionView, headerActions } from './overview-view';

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

const CONTENT = [
  { course: { id: 'thermodynamics-heat-transfer', name: 'Thermodynamics & Heat Transfer' } },
] as unknown as readonly ContentAccessRow[];

const TODAY = '2027-09-22';
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC)-\d+/;

describe('attentionView (IA-v1 `attention`)', () => {
  it('writes each fact as its lead band or counted item, by content', () => {
    const view = attentionView(ALL_KINDS, null, CONTENT, TODAY);
    expect(view.leads.map((lead) => [lead.tone, lead.title, lead.line, lead.action])).toEqual([
      [
        'paused',
        'BITS has paused your institution’s access',
        'Students can’t open experiments. Pages are read-only until BITS lifts the pause. Your work is kept.',
        { href: '/institute/help', label: 'Help' },
      ],
      [
        'due',
        'Request a renewal',
        'Your plan ends on 7 October. The reminder is due; nothing is sent automatically.',
        { href: '/institute/requests', label: 'Request renewal' },
      ],
      [
        'off',
        'Your access plan has ended',
        'Ended 7 Oct 2027 · students can’t open its experiments now.',
        { href: '/institute/requests', label: 'Request renewal' },
      ],
    ]);
    expect(view.items.map((item) => [item.count, item.title, item.line, item.action])).toEqual([
      [
        2,
        'students are waiting for a licence',
        'Shell-and-Tube Heat Exchanger',
        { href: '/institute/student-access', label: 'View students' },
      ],
      [
        1,
        'experiment hasn’t been given to any student',
        'Shell-and-Tube Heat Exchanger',
        {
          href: '/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=shell-and-tube-heat-exchanger',
          label: 'Give access',
        },
      ],
      [
        3,
        'students have no access yet',
        'Added on 15 September',
        { href: '/institute/people', label: 'Review students' },
      ],
      [
        1,
        'course has no course code from your institution',
        'ME ZG523 Thermodynamics & Heat Transfer',
        // Package 2B: Course codes (IA-16) is built.
        { href: '/institute/content-access?tab=course-codes', label: 'Add course code' },
      ],
    ]);
    // The lead bands count as items ("7 items").
    expect(view.count).toBe(7);
    expect(JSON.stringify(view)).not.toMatch(REFERENCE);
  });

  it('keys stay unique when two items share a kind', () => {
    const view = attentionView([ALL_KINDS[4]!, ALL_KINDS[4]!], null, CONTENT, TODAY);
    expect(new Set(view.items.map((item) => item.key)).size).toBe(2);
  });

  it('the device requests join before the students without access; never beside the pause', () => {
    const devices = {
      count: 2,
      newest: { student: 'Imran Shaikh', requestedAt: '2027-09-18T04:30:00.000Z' },
    };
    const view = attentionView(
      [ALL_KINDS[1]!, ALL_KINDS[3]!, ALL_KINDS[5]!],
      devices,
      CONTENT,
      TODAY,
    );
    expect(view.items.map((item) => item.key)).toEqual([
      'students-waiting-for-a-licence-1',
      'device-requests',
      'students-without-access-2',
    ]);
    const device = view.items[1]!;
    expect([device.count, device.title, device.line, device.action]).toEqual([
      2,
      'device requests to forward to BITS',
      'From Imran Shaikh and 1 other on 18 September. BITS decides after you forward it.',
      { href: '/institute/requests?tab=devices', label: 'Open requests' },
    ]);
    expect(view.count).toBe(4);
    for (const alone of [ALL_KINDS[0]!, ALL_KINDS[2]!]) {
      const lone = attentionView([alone], devices, CONTENT, TODAY);
      expect(lone.items).toEqual([]);
      expect(lone.count).toBe(1);
    }
  });

  it('nothing to do: no lead, no item, the calm state', () => {
    expect(attentionView([], null, CONTENT, TODAY)).toEqual({ leads: [], items: [], count: 0 });
  });

  it('at most six rows: the added device item makes the last one give way', () => {
    const six = [
      ALL_KINDS[3]!,
      ALL_KINDS[4]!,
      ALL_KINDS[4]!,
      ALL_KINDS[4]!,
      ALL_KINDS[5]!,
      ALL_KINDS[6]!,
    ];
    const view = attentionView(
      six,
      { count: 1, newest: { student: 'Rahul Verma', requestedAt: '2026-10-22T04:30:00.000Z' } },
      CONTENT,
      '2026-10-22',
    );
    expect(view.count).toBe(6);
    expect(view.items[1]!.key).toBe('device-requests');
    expect(view.items[1]!.line).toBe(
      'From Rahul Verma on 22 October. BITS decides after you forward it.',
    );
    expect(view.items.some((item) => item.key.startsWith('course-without-code'))).toBe(false);
  });
});

describe('headerActions', () => {
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
