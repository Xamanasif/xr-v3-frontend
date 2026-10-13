/**
 * Derived read models (Appendix C M27; Appendix D §5.3): usage, content access, access ending and
 * the sidebar counts — computed from records on every read. Counts of people and records only:
 * no licence usage, percentage or feedback column (T-06; RUN-13).
 */
import { describe, expect, it } from 'vitest';

import {
  assessment,
  attempt,
  experiment,
  grant,
  group,
  ids,
  institution,
  plan,
  QUESTIONS,
  request,
  student,
  submission,
  system,
  T,
  transfer,
  update,
  who,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import { provided } from '../kernel/provided.js';
import { calendarDate } from '../kernel/time.js';
import type { StudentAccessGrantId } from '../kernel/ids.js';
import { UNDECIDED_OVERLAP_POLICY } from '../access/model.js';
import type { RuntimeActivity } from '../runtime/activity.js';
import {
  accessEndingRows,
  iaContentAccess,
  inactiveDays,
  navCounts,
  usage,
} from './read-models.js';

const activity = (
  studentId: typeof ids.rahul,
  format: 'web' | 'vr',
  sessions: number,
): RuntimeActivity => ({
  studentId,
  experimentId: ids.shell,
  format,
  firstOpenedAt: provided(T.oct12),
  lastSavedAt: null,
  lastSessionReportedAt: null,
  sessions: provided(sessions),
});

describe('usage (IA-20; B3-10): each column reads its own state', () => {
  const groupGrant = grant({
    id: ids.sacc311,
    target: { kind: 'group', groupId: ids.grp12 },
    givenAt: T.oct12,
  });
  const snehaWithdrawn = grant({
    id: unsafeBrand<StudentAccessGrantId>('SACC-0312'),
    target: { kind: 'student', studentId: ids.sneha },
    state: 'withdrawn',
  });
  const rows = usage({
    institution: institution(),
    plans: [plan()],
    experiments: [experiment()],
    students: [
      student(),
      student({ id: ids.arun }),
      student({ id: ids.sneha }),
      student({ id: ids.kumar, institutionId: ids.konark }),
    ],
    grants: [grant(), groupGrant, snehaWithdrawn],
    groups: [group([{ id: ids.arun }, { id: ids.sneha }])],
    waits: [],
    overlap: UNDECIDED_OVERLAP_POLICY,
    activities: [
      activity(ids.rahul, 'web', 3),
      activity(ids.arun, 'web', 1),
      activity(ids.rahul, 'vr', 2),
      activity(ids.kumar, 'web', 9),
    ],
    completions: [
      {
        studentId: ids.rahul,
        experimentId: ids.shell,
        format: 'web',
        completedAt: T.oct14,
        reportedFrom: 'simulation',
        recordedBy: system('system:runtime-report'),
      },
    ],
    now: T.oct14,
  });

  it('students who can open it today, each once; an undecided case is not counted', () => {
    expect(rows).toHaveLength(1);
    expect(rows[0]!.studentsWithAccess).toBe(2); // Rahul (individual) + Arun (group); Sneha's overlap is policy-open
  });

  it('started, completed and sessions per plan format; other institutions are never read', () => {
    expect(rows[0]!.perFormat).toEqual([
      { format: 'web', started: 2, completed: 1, sessions: 4 },
      { format: 'vr', started: 1, completed: 0, sessions: 2 },
    ]);
    expect(Object.keys(rows[0]!)).toEqual(['experimentId', 'studentsWithAccess', 'perFormat']);
  });
});

describe('content access and access ending', () => {
  it('"AR is published but not in your plan" (ACC-10)', () => {
    expect(iaContentAccess(plan(), [experiment({}, ['web', 'ar', 'vr'])])).toEqual([
      { item: plan().items[0], publishedNotInPlan: ['ar'] },
    ]);
  });

  it('ending soon (reminder due — nothing is sent), renewal in progress, ended', () => {
    const soon = plan({ endsOn: calendarDate('2026-10-31') });
    const ended = plan({ id: unsafeBrand('ACC-0099'), endsOn: calendarDate('2026-10-15') });
    expect(accessEndingRows({ plans: [plan(), soon, ended], requests: [], now: T.oct23 })).toEqual([
      {
        institutionId: ids.godavari,
        planId: ids.plan,
        endsOn: '2026-10-31',
        daysLeft: 8,
        endedDaysAgo: null,
        standing: { kind: 'reminder-due' },
      },
      {
        institutionId: ids.godavari,
        planId: 'ACC-0099',
        endsOn: '2026-10-15',
        daysLeft: null,
        endedDaysAgo: 8,
        standing: { kind: 'ended-no-renewal' },
      },
    ]);
    const renewal = request({ type: 'renewal', sourcePlanId: ids.plan, status: 'under-review' });
    expect(
      accessEndingRows({ plans: [soon], requests: [renewal], now: T.oct23 })[0]!.standing,
    ).toEqual({ kind: 'renewal-in-progress', requestId: ids.req42 });
  });
});

describe('sidebar counts (navCounts): records in the reader’s scope', () => {
  it('Super Admin requests under review; Institute Admin device requests waiting to be forwarded', () => {
    expect(
      navCounts.superAdminRequests([
        request(),
        request({ status: 'access-active' }),
        request({ status: 'information-requested' }),
      ]),
    ).toBe(1);
    expect(
      navCounts.instituteAdminDeviceRequests(
        [
          transfer('with-institute-admin'),
          transfer('forwarded'),
          transfer('with-institute-admin', { institutionId: ids.konark }),
        ],
        ids.godavari,
      ),
    ).toBe(1);
  });

  it('review queue, ready to publish, written answers to mark', () => {
    const waiting = submission({
      state: 'with-academic-reviewer',
      since: T.aug14,
      reason: 'first-review',
    });
    expect(
      navCounts.reviewerQueue(
        [waiting, submission({ state: 'draft' })],
        [update('in-academic-review'), update('draft')],
        () => true,
      ),
    ).toBe(2);
    expect(navCounts.reviewerQueue([waiting], [], () => false)).toBe(0);
    expect(
      navCounts.contentManagerReady(
        [submission({ state: 'with-content-manager', since: T.aug14 })],
        () => true,
      ),
    ).toBe(1);
    const done = attempt({ state: 'submitted', submittedAt: T.nov5 });
    const confirmed = {
      ...done,
      marking: { ...done.marking, confirmed: { at: T.nov7, by: who.faculty } },
    };
    expect(
      navCounts.facultyMarking([done, confirmed, attempt()], [assessment()], QUESTIONS, [
        ids.shell,
      ]),
    ).toBe(1);
    expect(navCounts.facultyMarking([done], [assessment()], QUESTIONS, [])).toBe(0);
  });

  it('"Inactive for N days"', () => {
    expect(inactiveDays(null, T.oct23)).toBeNull();
    expect(inactiveDays(T.oct12, T.oct23)).toBe(11); // 12 Oct 05:00 → 23 Oct 05:00
  });
});
