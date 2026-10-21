/**
 * The experiment's one next step — the V3 export's `nextStep`, "One next-step rule for Home and the
 * hub (same decisions, labels and destinations as hubVM)". Home's cover (`homeStepOf`), the hub's
 * Overview and ST-07 Simulation (`hubNextStep`) all decide through `nextStepOf`; each page only
 * gathers the facts from its own existing reads and says why nothing opens now. A suggestion
 * only: nothing is locked (T-16) and opening a resource completes nothing (T-13).
 */
import type { MyExperimentRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

import { givenFormats } from './student-view';

/**
 * The next step, in the export's order: a format in progress (WEB first) → continue it; a
 * completed format whose feedback is offered → give it; nothing started and no resource opened →
 * the resources; nothing started → choose a format; the assessment to do or in progress; a format
 * not started yet → open it; else none.
 */
export type NextStepKind =
  | `continue-${Technology}`
  | `feedback-${Technology}`
  | 'open-resources'
  | 'choose-format'
  | 'assessment-to-do'
  | 'assessment-in-progress'
  | `set-up-${Technology}`;

/** What the rule reads, gathered by each page from the answers it already has (BC3). */
export interface NextStepFacts {
  /** The experiment's row: its formats' availability and progress. */
  readonly row: Pick<MyExperimentRow, 'formats'>;
  /** A completed format whose feedback the service offers (the hub's progress views, Home's Up next). */
  readonly feedbackDue: Technology | null;
  /** The resources summary, when the page read it (`null`: not read — the rule skips the resources). */
  readonly resources: { readonly total: number; readonly opened: number } | null;
  /** The experiment's assessment, when it has one the Student can see. */
  readonly assessment: { readonly toDo: boolean; readonly inProgress: boolean } | null;
}

/**
 * The export's rule over the formats given to the Student (only those open now can be continued
 * or set up). The closures (the pause, an inactive account, a licence wait, an undecided rule) are
 * the caller's: the rule is asked only while the experiment opens.
 */
export function nextStepOf({
  row,
  feedbackDue,
  resources,
  assessment,
}: NextStepFacts): NextStepKind | null {
  const given = givenFormats(row);
  const open = given.filter((entry) => entry.availability === 'available-to-you');
  const inProgress = open.find((entry) => entry.progress === 'in-progress');
  if (inProgress) return `continue-${inProgress.format}`;
  if (feedbackDue) return `feedback-${feedbackDue}`;
  if (given.length > 0 && given.every((entry) => entry.progress === 'not-started')) {
    return resources !== null && resources.total > 0 && resources.opened === 0
      ? 'open-resources'
      : 'choose-format';
  }
  if (assessment?.toDo) return 'assessment-to-do';
  if (assessment?.inProgress) return 'assessment-in-progress';
  const notStarted = open.find((entry) => entry.progress === 'not-started');
  return notStarted ? `set-up-${notStarted.format}` : null;
}
