/**
 * Runtime activity, the system completion handler and per-format progress (Appendix C M16, M17;
 * ADR-0006; matrix RUN-*, CMP-*). Completion is its own record, written only by the system
 * completion handler; it is never inferred from a launch, an opening, sessions or time (BC3;
 * T-12 stays open).
 */
import { describe, expect, it } from 'vitest';

import type { RuntimeEventRecord, RuntimeEventType } from '../runtime/events.js';
import {
  experiment,
  expectOk,
  grant,
  ids,
  refusalOf,
  system,
  T,
  who,
} from '../testing/fixtures.js';
import {
  launchWebFormat,
  recordRuntimeActivity,
  type RuntimeActivity,
} from '../runtime/activity.js';
import {
  completionFromRuntimeEvents,
  FORMAT_PROGRESS_STATUSES,
  type FormatCompletion,
  reportCompletion,
} from './record.js';
import { type CompletionPolicy, interimCompletionPolicy } from './policy.js';
import { formatProgress, formatProgressView } from './progress.js';

const key = { studentId: ids.rahul, experimentId: ids.shell, format: 'web' as const };
const runtime = system('system:runtime-report');

/** Folds activity reports dated 12, 14 and 20 Oct in turn. */
function activityAfter(...kinds: ('opened' | 'saved' | 'session')[]): RuntimeActivity {
  const dates = [T.oct12, T.oct14, T.oct20];
  let activity: RuntimeActivity | null = null;
  kinds.forEach((kind, index) => {
    activity = expectOk(
      recordRuntimeActivity({
        activity,
        report: { ...key, kind, at: dates[index % 3]! },
        actor: runtime,
      }),
    );
  });
  return activity!;
}

describe('runtime activity (RUN-08 SYSTEM): written only by the runtime report', () => {
  it('records first opened, last saved and sessions — Provided figures, passed through', () => {
    const activity = activityAfter('opened', 'saved', 'opened');
    expect(activity).toMatchObject({ firstOpenedAt: T.oct12, lastSavedAt: T.oct14, sessions: 2 });
  });

  it('no person and no other system writer may write it', () => {
    for (const actor of [
      system('system:payment-provider'),
      system('system:review-start'),
      who.student,
      who.instituteAdmin,
    ]) {
      expect(
        refusalOf(
          recordRuntimeActivity({
            activity: null,
            report: { ...key, kind: 'opened', at: T.oct12 },
            actor: actor as never,
          }),
        ),
      ).toEqual({ kind: 'not-permitted', why: 'wrong-workspace' });
    }
  });

  it('Launch WEB stores nothing: it answers with the link only (AD-16; RUN-03)', () => {
    const launched = expectOk(
      launchWebFormat({
        experiment: experiment(),
        webGate: { canOpen: true, viaGrantIds: [grant().id] },
      }),
    );
    expect(launched).toEqual({ webLink: 'https://sim.example.org/shell' });
    expect(
      refusalOf(
        launchWebFormat({
          experiment: experiment(),
          webGate: { canOpen: false, reason: 'institution-paused' },
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
    expect(
      refusalOf(
        launchWebFormat({
          experiment: experiment({}, ['vr']),
          webGate: { canOpen: true, viaGrantIds: [] },
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'format-not-published' });
    // The WEB format gate carries "not in the plan" (RUN-06); an open decision stays open.
    expect(
      refusalOf(
        launchWebFormat({
          experiment: experiment(),
          webGate: { canOpen: false, reason: 'format-not-in-plan' },
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'format-not-in-plan' });
    expect(
      refusalOf(
        launchWebFormat({
          experiment: experiment(),
          webGate: { canOpen: false, reason: 'policy-open', decision: 'OD-B2-01' },
        }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'OD-B2-01' });
  });
});

describe('the completion handler (CMP-01 SYSTEM; CMP-02 … CMP-05 DENY)', () => {
  const report = { ...key, at: T.oct14, from: 'simulation' as const };
  it('writes the completion once; the first completion stands', () => {
    const first = expectOk(reportCompletion({ existing: null, report, actor: runtime }));
    expect(first).toEqual({
      created: true,
      completion: { ...key, completedAt: T.oct14, reportedFrom: 'simulation', recordedBy: runtime },
    });
    const again = expectOk(
      reportCompletion({
        existing: first.completion,
        report: { ...report, at: T.oct20 },
        actor: runtime,
      }),
    );
    expect(again).toEqual({ created: false, completion: first.completion });
  });

  it('never by the Student, a staff member or another system writer', () => {
    for (const actor of [
      who.student,
      who.faculty,
      who.instituteAdmin,
      who.superAdmin,
      system('system:objective-marks'),
      system('system:review-start'),
    ]) {
      expect(
        refusalOf(reportCompletion({ existing: null, report, actor: actor as never })),
      ).toEqual({ kind: 'not-permitted', why: 'wrong-workspace' });
    }
  });

  it('one format never completes another', () => {
    const web = expectOk(reportCompletion({ existing: null, report, actor: runtime })).completion;
    expect(
      refusalOf(
        reportCompletion({
          existing: web,
          report: { ...report, format: 'vr', from: 'headset' },
          actor: runtime,
        }),
      ),
    ).toEqual({ kind: 'invalid-state', current: 'different-format' });
  });
});

describe('completionFromRuntimeEvents: the decision behind the injected CompletionPolicy', () => {
  let seq = 0;
  const ev = (
    type: RuntimeEventType,
    sessionId: string,
    occurredAt: string,
    extra: Partial<RuntimeEventRecord> = {},
  ): RuntimeEventRecord => {
    seq += 1;
    return { type, sessionId, technology: 'web', occurredAt, seq, source: 'web-runtime', ...extra };
  };
  const decide = (
    events: readonly RuntimeEventRecord[],
    policy: CompletionPolicy = interimCompletionPolicy,
    existing: FormatCompletion | null = null,
  ) => completionFromRuntimeEvents({ ...key, events, policy, existing });
  const acceptsEverything: CompletionPolicy = {
    id: 'test-everything',
    status: 'provisional',
    isCompletion: () => true,
  };

  it('launching, opening and hours of sessions never complete — whatever policy is injected', () => {
    const hours = [
      ev('SIMULATION_LAUNCHED', 'S1', '2026-10-12T10:00:00.000Z'),
      ev('SESSION_STARTED', 'S1', '2026-10-12T10:00:05.000Z'),
      ev('SESSION_ENDED', 'S1', '2026-10-12T16:00:00.000Z', { durationSeconds: 21_595 }),
      ev('SIMULATION_ERROR', 'S1', '2026-10-12T16:00:01.000Z'),
    ];
    expect(decide(hours)).toBeNull();
    expect(decide(hours, acceptsEverything)).toBeNull();
  });

  it('a completion report from an opened session completes, under the interim policy', () => {
    const run = [
      ev('SIMULATION_LAUNCHED', 'S1', '2026-10-14T09:00:00.000Z'),
      ev('SESSION_STARTED', 'S1', '2026-10-14T09:00:05.000Z'),
      ev('SIMULATION_COMPLETED', 'S1', '2026-10-14T10:00:00.000Z'),
    ];
    expect(decide(run)).toEqual({
      ...key,
      completedAt: '2026-10-14T10:00:00.000Z',
      reportedFrom: 'simulation',
      recordedBy: runtime,
    });
    // A bare report with no opened session does not count under the interim rule.
    expect(decide([ev('SIMULATION_COMPLETED', 'S9', '2026-10-14T10:00:00.000Z')])).toBeNull();
  });

  it('reads only its own format, and an existing completion is returned unchanged', () => {
    const vrRun = [
      ev('SESSION_STARTED', 'V1', '2026-10-14T09:00:00.000Z', { technology: 'vr' }),
      ev('SIMULATION_COMPLETED', 'V1', '2026-10-14T10:00:00.000Z', { technology: 'vr' }),
    ];
    expect(decide(vrRun)).toBeNull();
    const existing: FormatCompletion = {
      ...key,
      completedAt: T.oct12,
      reportedFrom: 'simulation',
      recordedBy: runtime,
    };
    expect(decide([], interimCompletionPolicy, existing)).toBe(existing);
  });
});

describe('formatProgress (§1.9 edit 3): Completed only from a completion record', () => {
  it('three statuses, read per format', () => {
    expect(FORMAT_PROGRESS_STATUSES).toEqual(['not-started', 'in-progress', 'completed']);
    expect(formatProgress({ activity: null, completion: null })).toBe('not-started');
    const busy = activityAfter('opened', 'session', 'session', 'session', 'saved', 'session');
    expect(busy.sessions).toBeGreaterThan(3);
    expect(formatProgress({ activity: busy, completion: null })).toBe('in-progress');
    const completion: FormatCompletion = {
      ...key,
      completedAt: T.oct14,
      reportedFrom: 'simulation',
      recordedBy: runtime,
    };
    expect(formatProgress({ activity: null, completion })).toBe('completed');
  });

  it('the view keeps work as it was before a pause (B3-01, B3-05)', () => {
    const view = formatProgressView({
      ...key,
      activity: activityAfter('opened'),
      completion: null,
      feedback: 'not-offered',
      paused: true,
    });
    expect(view).toMatchObject({
      status: 'in-progress',
      beforePause: true,
      feedback: 'not-offered',
    });
  });
});
