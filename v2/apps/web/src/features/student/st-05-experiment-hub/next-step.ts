/**
 * The hub's next step (the V3 export's `nextStep`, "one next-step rule for Home and the hub": the
 * rule itself is `shared/next-step.ts`, which Home's cover reads too): the item whose action is
 * the next step carries the "Next step" tag and the view's one gold action — on the Overview (a
 * format row, Learning resources or Assessment) and on ST-07 Simulation (a format card). A suggestion only: nothing is locked (T-16) and opening a resource
 * completes nothing (T-13).
 *
 * Read from the existing answers only, side by side (BC3): the hub row's availability and
 * progress per format, the resources summary and the assessment (`getExperimentHub`), the
 * closure (XS-08 banner facts, the row's own closure) and — where the page reads it — the
 * per-format progress views (`getSimulationChooser`: the feedback entry the service offers).
 */
import type { ExperimentHub } from '@xr/contracts/draft';
import type { FormatProgressView, Technology } from '@xr/domain';

import { studentAssessmentAddress } from '@/nav/student-assessments';
import { formatFeedbackAddress, formatPageAddress, hubTabAddress } from '@/nav/student-hub';

import { type NextStepKind, nextStepOf } from '../shared/next-step';
import { type Closure, givenFormats } from '../shared/student-view';

export type { NextStepKind } from '../shared/next-step';

type HubRead = Pick<ExperimentHub, 'row' | 'resourceSummary'> &
  Partial<Pick<ExperimentHub, 'assessment'>>;

/**
 * Where the Student stands on the hub: nothing while the experiment is closed (paused, inactive,
 * a licence wait) or nothing is left to do here; otherwise the one rule (`nextStepOf`) over the
 * hub's answer — feedback due where a completed given format's progress view offers it.
 */
export function hubNextStep(
  hub: HubRead,
  closure: Closure,
  progress: readonly FormatProgressView[] = [],
): NextStepKind | null {
  if (closure !== null || hub.row.closure !== null) return null;
  const feedbackDue = givenFormats(hub.row).find(
    (entry) =>
      entry.progress === 'completed' &&
      progress.find((view) => view.format === entry.format)?.feedback === 'offered',
  );
  const assessment = hub.assessment && !('kind' in hub.assessment) ? hub.assessment : null;
  return nextStepOf({
    row: hub.row,
    feedbackDue: feedbackDue?.format ?? null,
    resources: hub.resourceSummary,
    assessment: assessment && {
      toDo: assessment.result.kind === 'to-do',
      inProgress: assessment.result.kind === 'in-progress',
    },
  });
}

/** Where the next step leads (`null`: a step without a destination of its own). */
export function nextStepAddress(
  experimentId: string,
  step: NextStepKind,
  assessmentId: string | null,
): string | null {
  if (step === 'open-resources') return hubTabAddress(experimentId, 'resources');
  if (step === 'choose-format') return hubTabAddress(experimentId, 'simulation');
  if (step === 'assessment-to-do') {
    return assessmentId ? studentAssessmentAddress(assessmentId) : null;
  }
  if (step === 'assessment-in-progress') {
    return assessmentId ? studentAssessmentAddress(assessmentId, 'attempt') : null;
  }
  const [kind, format] = splitFormatStep(step);
  return kind === 'feedback'
    ? formatFeedbackAddress(experimentId, format)
    : formatPageAddress(experimentId, format);
}

function splitFormatStep(
  step: `continue-${Technology}` | `feedback-${Technology}` | `set-up-${Technology}`,
): readonly ['continue' | 'feedback' | 'set-up', Technology] {
  const at = step.lastIndexOf('-');
  return [
    step.slice(0, at) as 'continue' | 'feedback' | 'set-up',
    step.slice(at + 1) as Technology,
  ];
}
