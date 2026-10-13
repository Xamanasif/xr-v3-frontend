/**
 * M16 Runtime activity, M17 Format completion + progress view, M18 Resource opened, M19 Format
 * feedback (Appendix C §2). Five states never collapse (BC3): activity is not completion; a
 * completion is written only by the system completion handler; feedback exists only with a
 * completion for that format (BC5). Progress is per format, with no aggregate (BC4).
 */
import {
  FEEDBACK_STATEMENTS,
  FORMAT_PROGRESS_STATUSES,
  type FeedbackEntry,
  type FormatCompletion,
  type FormatFeedback,
  type FormatProgressView,
  type Rating,
  type ResourceOpened,
  type RuntimeActivity,
} from '@xr/domain';
import { z } from 'zod';

import {
  experimentId,
  feedbackId,
  isoInstant,
  personId,
  providedInstant,
  providedNumber,
  resourceId,
  technology,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const RATINGS = vocabulary<Rating>()([1, 2, 3, 4, 5]);
export const rating = z.literal(RATINGS);
export const formatProgressStatus = z.enum(FORMAT_PROGRESS_STATUSES);

/** The five statements of feedback statement set 1 (B3-06 `FB.qs`). */
export const FEEDBACK_STATEMENT_COUNT = FEEDBACK_STATEMENTS.length;

export const runtimeActivity = typedAs<RuntimeActivity>()(
  z.object({
    studentId: personId,
    experimentId,
    format: technology,
    firstOpenedAt: providedInstant.nullable(),
    lastSavedAt: providedInstant.nullable(),
    lastSessionReportedAt: providedInstant.nullable(),
    sessions: providedNumber,
  }),
);

export const formatCompletion = typedAs<FormatCompletion>()(
  z.object({
    studentId: personId,
    experimentId,
    format: technology,
    completedAt: isoInstant,
    reportedFrom: z.enum(['simulation', 'headset']),
    recordedBy: z.object({ kind: z.literal('system'), system: z.literal('system:runtime-report') }),
  }),
);

export const feedbackEntry = typedAs<FeedbackEntry>()(
  z.union([z.literal('not-offered'), z.literal('offered'), z.object({ sentAt: isoInstant })]),
);

export const formatProgressView = typedAs<FormatProgressView>()(
  z.object({
    experimentId,
    format: technology,
    status: formatProgressStatus,
    completion: formatCompletion.nullable(),
    activity: runtimeActivity.nullable(),
    beforePause: z.boolean(),
    feedback: feedbackEntry,
  }),
);

export const resourceOpened = typedAs<ResourceOpened>()(
  z.object({ studentId: personId, resourceId, firstOpenedAt: isoInstant }),
);

export const formatFeedback = typedAs<FormatFeedback>()(
  z.object({
    id: feedbackId,
    studentId: personId,
    experimentId,
    format: technology,
    statementSet: z.literal(1),
    ratings: z.tuple([rating, rating, rating, rating, rating]),
    comments: z.string().nullable(),
    sentAt: isoInstant,
  }),
);
