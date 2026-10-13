/**
 * M19 Format feedback (Appendix C §2; BC5; matrix FB-01 … FB-06; B3-06).
 * One record per Student × Experiment × format, offered only after that format is recorded
 * Completed by the system — "Not eligible → no entry at all … No disabled button." (B3-06). One
 * submission, no edit, no resubmit. No staff view anywhere (FB-06; T-25).
 *
 * Interim (AD-22, UNRESOLVED): the entry also needs the experiment gate to be open; whether
 * feedback stays available after access is withdrawn is not drawn.
 */
import type { Technology } from '../technology.js';
import {
  conflict,
  type Decision,
  invalidInput,
  invalidState,
  ok,
  refused,
} from '../kernel/decision.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId, FeedbackId, PersonId } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import type { OpenGate } from '../access/model.js';
import type { FormatCompletion } from '../completion/record.js';

export type Rating = 1 | 2 | 3 | 4 | 5;

/** The five statements, version 1 (B3-06 `FB.qs`). */
export const FEEDBACK_STATEMENTS = [
  'This experience helped me understand the concept.',
  'The instructions were clear and easy to follow.',
  'The simulation was easy to use and interact with.',
  'This experience worked smoothly without technical issues.',
  'Overall, I was satisfied with this learning experience.',
] as const;

/** Every point labelled, not colour-only (B3-06 `FB.scale`). */
export const RATING_SCALE: Readonly<Record<Rating, string>> = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Neither agree nor disagree',
  4: 'Agree',
  5: 'Strongly agree',
};

export interface FormatFeedback {
  readonly id: FeedbackId;
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  /** The statement set the ratings answer, so a wording change never re-reads stored ratings. */
  readonly statementSet: 1;
  readonly ratings: readonly [Rating, Rating, Rating, Rating, Rating];
  /** 'Additional comments (optional)'. */
  readonly comments: string | null;
  /** 'Sent 14 Oct 2026, 15:42'. */
  readonly sentAt: IsoInstant;
}

/** The entry on ST-08 / ST-09 / ST-10 / ST-15: nothing, "Give feedback on WEB", or sent. */
export type FeedbackEntry = 'not-offered' | 'offered' | { readonly sentAt: IsoInstant };

/** `feedbackEntry` (Appendix D §5.3): a completion for this format and no feedback yet. */
export function feedbackEntry(input: {
  readonly completion: FormatCompletion | null;
  readonly feedback: FormatFeedback | null;
  readonly gate: OpenGate;
}): FeedbackEntry {
  if (input.feedback) return { sentAt: input.feedback.sentAt };
  if (!input.completion) return 'not-offered';
  return input.gate.canOpen ? 'offered' : 'not-offered';
}

function isRating(value: number): value is Rating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export interface SendFeedbackInput {
  readonly existing: FormatFeedback | null;
  readonly completion: FormatCompletion | null;
  readonly gate: OpenGate;
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  /** One per statement; `null` where none was chosen ("Choose a rating"). */
  readonly ratings: readonly (number | null)[];
  readonly comments: string | null;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * Submit feedback (FB-02): five 1–5 ratings required, comments optional, no confirm dialog. Not
 * on a format that is not Completed or not given (FB-04); never twice (FB-03).
 */
export function sendFeedback(input: SendFeedbackInput): Decision<FormatFeedback> {
  if (input.existing) return conflict('already-sent');
  const completion = input.completion;
  if (
    !completion ||
    completion.studentId !== input.studentId ||
    completion.experimentId !== input.experimentId ||
    completion.format !== input.format
  ) {
    return refused('format-not-completed');
  }
  if (!input.gate.canOpen) {
    return input.gate.reason === 'policy-open'
      ? { ok: false, refusal: { kind: 'policy-open', decision: input.gate.decision } }
      : refused(input.gate.reason);
  }
  if (input.ratings.length !== FEEDBACK_STATEMENTS.length) return invalidState('statement-set');
  const missing = input.ratings
    .map((rating, index) => (rating === null || !isRating(rating) ? index + 1 : null))
    .filter((index): index is number => index !== null);
  if (missing.length > 0) {
    return invalidInput(
      ...missing.map((statement) => ({ field: `rating-${statement}`, rule: 'choose-rating' })),
    );
  }
  return ok({
    id: input.ids.next('feedback'),
    studentId: input.studentId,
    experimentId: input.experimentId,
    format: input.format,
    statementSet: 1,
    ratings: input.ratings as unknown as FormatFeedback['ratings'],
    comments:
      input.comments === null || input.comments.trim() === '' ? null : input.comments.trim(),
    sentAt: input.now,
  });
}
