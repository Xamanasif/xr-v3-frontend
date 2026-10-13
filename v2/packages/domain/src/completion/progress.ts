/**
 * `formatProgress` (Appendix D §5.3; BC3, BC4): per format, read side by side — a completion
 * record → Completed (date); otherwise runtime activity → In progress; otherwise Not started.
 * The runtime fold's own COMPLETED value is never read here, and no experiment-, course- or
 * Student-level aggregate, percentage or verdict exists (RUN-10). Progress is the same before and
 * after a pause or a withdrawal — work is kept (invariant 4).
 */
import type { Technology } from '../technology.js';
import type { ExperimentId } from '../kernel/ids.js';
import type { FeedbackEntry } from '../feedback/feedback.js';
import type { RuntimeActivity } from '../runtime/activity.js';
import type { FormatCompletion, FormatProgressStatus } from './record.js';

export function formatProgress(input: {
  readonly activity: RuntimeActivity | null;
  readonly completion: FormatCompletion | null;
}): FormatProgressStatus {
  if (input.completion) return 'completed';
  const activity = input.activity;
  return activity && (activity.firstOpenedAt !== null || activity.sessions > 0)
    ? 'in-progress'
    : 'not-started';
}

export interface FormatProgressView {
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly status: FormatProgressStatus;
  readonly completion: FormatCompletion | null;
  readonly activity: RuntimeActivity | null;
  /** 'Completed 14 Oct 2026 before the pause' / 'Not started before the pause' (B3-01, B3-05). */
  readonly beforePause: boolean;
  readonly feedback: FeedbackEntry;
}

export function formatProgressView(input: {
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly activity: RuntimeActivity | null;
  readonly completion: FormatCompletion | null;
  readonly feedback: FeedbackEntry;
  /** The institution is paused now. */
  readonly paused: boolean;
}): FormatProgressView {
  return {
    experimentId: input.experimentId,
    format: input.format,
    status: formatProgress(input),
    completion: input.completion,
    activity: input.activity,
    beforePause: input.paused,
    feedback: input.feedback,
  };
}
