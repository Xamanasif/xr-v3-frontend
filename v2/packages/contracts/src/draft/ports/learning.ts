/**
 * §3.8 LearningService — ST-06…ST-10, ST-15 — and §3.9 FeedbackService — ST-16, ST-17.
 *
 * Opening a resource marks it "Opened" and nothing else (T-13). "Launch WEB" stores nothing:
 * activity comes only from runtime reports (AD-16), and nothing here ever writes a completion
 * (BC3). Progress is per format, with no aggregate (BC4). Feedback is one record per Student ×
 * Experiment × format, offered only once that format is Completed (BC5); no staff read exists
 * (T-25). The WP-0.9 interim (AD-22, UNRESOLVED) also needs the open gate.
 */
import type { FormatFeedback, FormatProgressView, OpenRefusal, Rating } from '@xr/domain';
import { optionalTrimmed } from '@xr/validation';
import { z } from 'zod';

import {
  experimentId,
  ids,
  isoInstant,
  studentAccessGrantId,
  technology,
} from '../kernel/primitives.js';
import { learningResource } from '../records/catalogue.js';
import { formatFeedback, formatProgressView, rating } from '../records/learning.js';
import { openGate } from '../records/access.js';
import { authorisedDevice } from '../records/operations.js';
import { attemptResult } from '../records/assessment.js';
import type {
  Conflict,
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

// ---- LearningService ----

export const openResourceInput = z.object({ resourceId: ids.in.resource });
export const formatPageInput = z.object({ experimentId: ids.in.experiment, format: technology });
export const launchWebFormatInput = z.object({ experimentId: ids.in.experiment });

export const listResourcesOutput = z.array(
  z.object({ resource: learningResource, openedAt: isoInstant.nullable() }),
);
export const openResourceOutput = z.object({ href: z.string().min(1), openedAt: isoInstant });
export const simulationChooserOutput = z.array(formatProgressView);
/** ST-08 / ST-09: WEB is a link; AR · VR · MR run from a package on a device (no launch button). */
export const formatPageOutput = z.object({
  progress: formatProgressView,
  delivery: z.union([
    z.object({ webLink: z.string().min(1) }),
    z.object({ setupSteps: z.array(z.string()), deviceNeeded: z.string() }),
  ]),
  gate: openGate,
  authorisedDevice: authorisedDevice.nullable(),
});
export const launchWebFormatOutput = z.object({ href: z.string().min(1) });
export const myProgressOutput = z.array(
  z.object({
    experimentId,
    name: z.string().min(1),
    grantId: studentAccessGrantId,
    formats: z.array(formatProgressView),
    assessment: z.union([attemptResult, z.object({ kind: z.literal('none-set') })]),
  }),
);

/** Reads of a Student's own learning: the gate's own open decisions, and SACC-14 (earlier work after a withdrawal or the end). */
type LearningReadErrors =
  NotSignedIn | NotPermitted | Refused<OpenRefusal> | PolicyOpen | Unavailable;

export interface LearningService {
  /** Paused: "Listed, not openable". */
  listResources(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<Out<typeof listResourcesOutput>, LearningReadErrors>;
  /** The first opening is kept; never progress (T-13). */
  openResource(
    input: In<typeof openResourceInput>,
  ): Answer<Out<typeof openResourceOutput>, LearningReadErrors | NotFound>;
  getSimulationChooser(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<readonly FormatProgressView[], LearningReadErrors>;
  getFormatPage(
    input: In<typeof formatPageInput>,
  ): Answer<Out<typeof formatPageOutput>, LearningReadErrors | NotFound>;
  /** Stores nothing (AD-16); never writes completion. Policy-open: D-26 and the gate's decisions. */
  launchWebFormat(
    input: In<typeof launchWebFormatInput>,
  ): Answer<Out<typeof launchWebFormatOutput>, LearningReadErrors>;
  /** Per format only; no aggregate (BC4). */
  getMyProgress(): Answer<Out<typeof myProgressOutput>, NotSignedIn | NotPermitted | Unavailable>;
}

// ---- FeedbackService ----

export const feedbackStateInput = z.object({ experimentId: ids.in.experiment, format: technology });

/**
 * ST-16 (B3-06 `submit`): every statement needs a rating — "Choose a rating"; the summary links
 * read "Choose a rating for statement <n>"; titles "One rating is missing" / "<n> ratings are missing".
 */
export const sendFeedbackInput = z.object({
  experimentId: ids.in.experiment,
  format: technology,
  ratings: z
    .array(rating.nullable(), { error: key('contract.invalid-input') })
    .length(5, { error: key('contract.invalid-input') })
    .transform((ratings, context): readonly [Rating, Rating, Rating, Rating, Rating] => {
      const missing = ratings.flatMap((value, index) => (value === null ? [index] : []));
      for (const index of missing) {
        context.addIssue({
          code: 'custom',
          path: [index],
          message: key('ST-16.rating.required'),
          params: { statement: String(index + 1) },
        });
      }
      if (missing.length > 0) return z.NEVER;
      return ratings as [Rating, Rating, Rating, Rating, Rating];
    }),
  comments: optionalTrimmed(),
});

export const feedbackStateOutput = z.discriminatedUnion('state', [
  z.object({ state: z.literal('not-eligible') }),
  z.object({ state: z.literal('eligible') }),
  z.object({ state: z.literal('sent'), feedback: formatFeedback }),
]);

export interface FeedbackService {
  getFeedbackState(
    input: In<typeof feedbackStateInput>,
  ): Answer<Out<typeof feedbackStateOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /** Policy-open: the gate's own decisions (AD-22 interim). */
  sendFeedback(
    input: In<typeof sendFeedbackInput>,
  ): Answer<
    FormatFeedback,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | InvalidState
    | Refused<'format-not-completed' | OpenRefusal>
    | Conflict<'already-sent'>
    | PolicyOpen
    | Unavailable
  >;
}
