/**
 * Pure view helpers of the Student's format pages (ST-08 WEB simulation, B3-03; ST-09 AR / VR /
 * MR format, B3-04): which drawn state a page is in, from the service's answers read side by side
 * — the format's progress view (RUN, COMP), its gate, the experiment hub's availability and
 * closure, and the feedback state (FB). Nothing here decides access, progress or eligibility, and
 * nothing turns one answer into another (BC3): "Completed" is the completion record's, "In
 * progress" the runtime's activity, "Give feedback" the FeedbackService's `eligible`.
 */
import type {
  ExperimentHub,
  feedbackStateOutput,
  formatPageOutput,
  Out,
  ServiceError,
} from '@xr/contracts/draft';
import { FORMAT_DISPLAY_ORDER, type Technology } from '@xr/domain';

import { type NotAvailableKind, notAvailableKind } from '../shared/student-view';

export type FormatPageAnswer = Out<typeof formatPageOutput>;
export type FeedbackStateAnswer = Out<typeof feedbackStateOutput>;
type Progress = FormatPageAnswer['progress'];

/** What the panel shows beside the status chip, as the progress view carries it. */
export type ProgressMeta =
  | { readonly kind: 'none' }
  /** WEB: "Last saved …" (B3-03 f0); VR: "Last session reported …" (B3-04 f0). */
  | { readonly kind: 'last'; readonly at: string }
  /** Activity before a save / session report: "First opened …" / "First session reported …". */
  | { readonly kind: 'first'; readonly at: string };

/** The feedback beside a completion: offered (`eligible`), sent, or neither (`ST-08.completed-not-eligible`). */
export type CompletedFeedback =
  | { readonly kind: 'eligible' }
  | { readonly kind: 'sent'; readonly sentAt: string }
  | { readonly kind: 'none' };

/** The panel's drawn states (B3-03 f0 … f6; B3-04 f0 … f2, f5). */
export type PanelState =
  | { readonly kind: 'not-started' }
  | { readonly kind: 'in-progress'; readonly meta: ProgressMeta }
  | {
      readonly kind: 'completed';
      readonly completedAt: string;
      readonly reportedFrom: 'simulation' | 'headset';
      readonly feedback: CompletedFeedback;
    }
  | { readonly kind: 'paused' }
  | { readonly kind: 'waiting'; readonly planId: string | null }
  | { readonly kind: 'inactive' };

/** The whole page: the panel, one of B3-04's message pages, or ST-19 in its place. */
export type FormatView =
  | { readonly kind: 'panel'; readonly panel: PanelState }
  /** B3-04 f3: published, not in the institution's access; `included` = the formats it does include. */
  | { readonly kind: 'not-included'; readonly included: readonly Technology[] }
  /** B3-04 f4: not published for this experiment; `published` = the formats it is made for. */
  | { readonly kind: 'not-published'; readonly published: readonly Technology[] }
  | { readonly kind: 'not-available'; readonly refusal: NotAvailableKind };

type Availability = ExperimentHub['row']['formats'][number]['availability'];

function inDisplayOrder(formats: readonly Technology[]): Technology[] {
  return [...formats].sort(
    (a, b) => FORMAT_DISPLAY_ORDER.indexOf(a) - FORMAT_DISPLAY_ORDER.indexOf(b),
  );
}

/** The formats the institution's access includes for the Student (given now, or not right now). */
export function includedFormats(hub: ExperimentHub): Technology[] {
  return inDisplayOrder(
    hub.row.formats
      .filter(
        (entry) =>
          entry.availability === 'available-to-you' ||
          entry.availability === 'not-available-right-now',
      )
      .map((entry) => entry.format),
  );
}

/** The formats the experiment is published in (B3-04 f4 "made for WEB, AR and VR"). */
export function publishedFormats(hub: ExperimentHub): Technology[] {
  return inDisplayOrder(hub.experiment.formats.map((entry) => entry.format));
}

function availabilityOf(hub: ExperimentHub, format: Technology): Availability | null {
  return hub.row.formats.find((entry) => entry.format === format)?.availability ?? null;
}

/** "Last saved" (WEB) / "Last session reported" (package formats), else the first activity. */
export function progressMeta(progress: Progress): ProgressMeta {
  const activity = progress.activity;
  if (!activity) return { kind: 'none' };
  const last = progress.format === 'web' ? activity.lastSavedAt : activity.lastSessionReportedAt;
  if (last) return { kind: 'last', at: last };
  return activity.firstOpenedAt ? { kind: 'first', at: activity.firstOpenedAt } : { kind: 'none' };
}

function completedFeedback(feedback: FeedbackStateAnswer | null): CompletedFeedback {
  if (feedback?.state === 'eligible') return { kind: 'eligible' };
  if (feedback?.state === 'sent') return { kind: 'sent', sentAt: feedback.feedback.sentAt };
  return { kind: 'none' };
}

/** A refusal the gate carries in its answer, as ST-19 reads it (the hub's own mapping). */
function gateRefusal(gate: FormatPageAnswer['gate']): NotAvailableKind | null {
  if (gate.canOpen) return null;
  const error: ServiceError =
    gate.reason === 'policy-open'
      ? { kind: 'policy-open', decision: gate.decision }
      : { kind: 'refused', code: gate.reason };
  return notAvailableKind(error);
}

/**
 * The page's view from an answered format page (`getFormatPage` ok), the experiment hub and — for
 * a completed format — the feedback state. Order: the format's availability for the institution
 * (B3-04 f3, f4), then the gate's own refusal (paused f5, a supplied licence wait B3-03 f6, an
 * inactive account, or ST-19), then the progress view (Not started, In progress, Completed).
 */
export function formatView(
  page: FormatPageAnswer,
  hub: ExperimentHub,
  feedback: FeedbackStateAnswer | null,
): FormatView {
  const format = page.progress.format;
  const availability = availabilityOf(hub, format);
  if (availability === 'not-available-for-this-experiment') {
    return { kind: 'not-published', published: publishedFormats(hub) };
  }
  if (availability === 'not-included-for-your-institution') {
    return { kind: 'not-included', included: includedFormats(hub) };
  }
  const gate = page.gate;
  if (!gate.canOpen) {
    switch (gate.reason) {
      case 'format-not-in-plan':
        return { kind: 'not-included', included: includedFormats(hub) };
      case 'format-not-published':
        return { kind: 'not-published', published: publishedFormats(hub) };
      case 'institution-paused':
        return { kind: 'panel', panel: { kind: 'paused' } };
      case 'waiting-for-a-licence':
        return {
          kind: 'panel',
          panel: {
            kind: 'waiting',
            planId:
              hub.row.closure?.kind === 'waiting-for-a-licence' ? hub.row.closure.planId : null,
          },
        };
      case 'student-inactive':
        return { kind: 'panel', panel: { kind: 'inactive' } };
      default:
        return { kind: 'not-available', refusal: gateRefusal(gate) ?? 'not-given' };
    }
  }
  const progress = page.progress;
  switch (progress.status) {
    case 'not-started':
      return { kind: 'panel', panel: { kind: 'not-started' } };
    case 'in-progress':
      return { kind: 'panel', panel: { kind: 'in-progress', meta: progressMeta(progress) } };
    case 'completed':
      // Completed only with the system's completion record (BC3); never inferred.
      return progress.completion
        ? {
            kind: 'panel',
            panel: {
              kind: 'completed',
              completedAt: progress.completion.completedAt,
              reportedFrom: progress.completion.reportedFrom,
              feedback: completedFeedback(feedback),
            },
          }
        : { kind: 'panel', panel: { kind: 'in-progress', meta: progressMeta(progress) } };
  }
}

/**
 * A format page the service did not answer: `not-found` is a format the experiment does not
 * publish — B3-04 f4's message when the hub confirms it, else not found; a refusal is ST-19's.
 */
export function unansweredView(
  error: ServiceError,
  format: Technology,
  hub: ExperimentHub | null,
): FormatView | 'not-found' {
  if (error.kind === 'not-found') {
    if (hub && !publishedFormats(hub).includes(format)) {
      return { kind: 'not-published', published: publishedFormats(hub) };
    }
    return 'not-found';
  }
  const refusal = notAvailableKind(error);
  return refusal === null ? 'not-found' : { kind: 'not-available', refusal };
}

/** The course code the Student's course row shows (T-17), else the platform code (`ST-08.code-shown`). */
export function codeShown(
  hub: ExperimentHub,
  courses: readonly { readonly courseId: string; readonly codeShown: string | null }[],
): string | null {
  const row = courses.find((course) => course.courseId === hub.experiment.courseId);
  return row ? row.codeShown : hub.experiment.platformCode;
}
