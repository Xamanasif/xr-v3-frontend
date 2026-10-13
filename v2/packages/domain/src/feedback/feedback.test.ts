/**
 * Format feedback and resources (Appendix C M18, M19; matrix FB-*, RUN-01, RUN-02; B3-06). Feedback
 * is offered only after that format is recorded Completed by the system; opening a resource marks
 * it "Opened" and nothing else (T-13).
 */
import { describe, expect, it } from 'vitest';

import {
  counterIds,
  experiment,
  expectOk,
  ids,
  refusalOf,
  system,
  T,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import type { ResourceId } from '../kernel/ids.js';
import type { OpenGate } from '../access/model.js';
import type { FormatCompletion } from '../completion/record.js';
import { openResource } from '../resources/resources.js';
import { FEEDBACK_STATEMENTS, feedbackEntry, RATING_SCALE, sendFeedback } from './feedback.js';

const key = { studentId: ids.rahul, experimentId: ids.shell, format: 'web' as const };
const completed: FormatCompletion = {
  ...key,
  completedAt: T.oct14,
  reportedFrom: 'simulation',
  recordedBy: system('system:runtime-report'),
};
const openGate: OpenGate = { canOpen: true, viaGrantIds: [ids.sacc310] };

describe('the feedback entry (feedbackEntry): no entry at all until the format is Completed', () => {
  it('not offered → offered → sent', () => {
    expect(feedbackEntry({ completion: null, feedback: null, gate: openGate })).toBe('not-offered');
    expect(feedbackEntry({ completion: completed, feedback: null, gate: openGate })).toBe(
      'offered',
    );
    // AD-22 interim: the entry also needs the gate open.
    expect(
      feedbackEntry({
        completion: completed,
        feedback: null,
        gate: { canOpen: false, reason: 'no-longer-given' },
      }),
    ).toBe('not-offered');
  });
});

describe('Submit feedback (FB-02; FB-03 never twice; FB-04 not before Completed)', () => {
  const input = {
    existing: null,
    completion: completed,
    gate: openGate,
    ...key,
    ratings: [4, 5, 4, 3, 4],
    comments: '  ',
    now: T.oct14,
    ids: counterIds(),
  };
  it('five 1–5 ratings, comments optional, statement set 1', () => {
    const sent = expectOk(sendFeedback(input));
    expect(sent).toMatchObject({
      statementSet: 1,
      ratings: [4, 5, 4, 3, 4],
      comments: null,
      sentAt: T.oct14,
    });
    expect(FEEDBACK_STATEMENTS).toHaveLength(5);
    expect(Object.keys(RATING_SCALE)).toEqual(['1', '2', '3', '4', '5']);
    expect(refusalOf(sendFeedback({ ...input, existing: sent }))).toEqual({
      kind: 'conflict',
      code: 'already-sent',
    });
  });

  it('not on a format that is not Completed, or Completed in another format', () => {
    expect(refusalOf(sendFeedback({ ...input, completion: null }))).toEqual({
      kind: 'refused',
      code: 'format-not-completed',
    });
    expect(refusalOf(sendFeedback({ ...input, format: 'vr' }))).toEqual({
      kind: 'refused',
      code: 'format-not-completed',
    });
  });

  it('"Choose a rating" for each missing statement', () => {
    expect(refusalOf(sendFeedback({ ...input, ratings: [4, null, 4, 6, 4] }))).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'rating-2', rule: 'choose-rating' },
        { field: 'rating-4', rule: 'choose-rating' },
      ],
    });
  });
});

describe('resources (RUN-01): "Opened" and nothing else', () => {
  const resourceId = unsafeBrand<ResourceId>('res-1');
  it('the first opening is kept; nothing else is written', () => {
    const first = expectOk(
      openResource({
        existing: null,
        studentId: ids.rahul,
        resourceId,
        experiment: experiment(),
        gate: openGate,
        now: T.oct12,
      }),
    );
    expect(first).toEqual({
      opened: { studentId: ids.rahul, resourceId, firstOpenedAt: T.oct12 },
      href: 'https://example.org/brief.pdf',
    });
    const again = expectOk(
      openResource({
        existing: first.opened,
        studentId: ids.rahul,
        resourceId,
        experiment: experiment(),
        gate: openGate,
        now: T.oct20,
      }),
    );
    expect(again.opened.firstOpenedAt).toBe(T.oct12);
    expect(Object.keys(again)).toEqual(['opened', 'href']);
  });

  it('refused through the gate; policy-open passes through', () => {
    expect(
      refusalOf(
        openResource({
          existing: null,
          studentId: ids.rahul,
          resourceId,
          experiment: experiment(),
          gate: { canOpen: false, reason: 'student-inactive' },
          now: T.oct12,
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'student-inactive' });
    expect(
      refusalOf(
        openResource({
          existing: null,
          studentId: ids.rahul,
          resourceId,
          experiment: experiment(),
          gate: { canOpen: false, reason: 'policy-open', decision: 'OD-B2-02' },
          now: T.oct12,
        }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'OD-B2-02' });
  });
});
