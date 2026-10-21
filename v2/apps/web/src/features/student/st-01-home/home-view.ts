/**
 * The V3 Home's view (the owner-approved Student export ST-v1, `homeVM` and its one next-step rule
 * `nextStep`), as pure presentation over the Home's existing reads: `getMyHome` with each listed
 * course's rows (`studentHome`), the cover experiment's hub (`getExperimentHub`, one more read on
 * the page: its description, outcomes, resource count and assessment) and — when Up next lists an
 * assessment — the Student's own assessments (its name and deadline). Nothing here decides access
 * or progress: availability, the closure, runtime progress, feedback and the assessment's state
 * are the services' separate answers, only put in the export's order. No stage is read or drawn
 * (lead decision 1); no date is shown that the Home does not read (the completion and "Last saved"
 * dates, an access end date).
 */
import type {
  ExperimentHub,
  MyAssessmentRow,
  MyCourseRow,
  MyExperimentRow,
} from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';

import type { HomeRead } from '@/queries/student';

import { nextStepOf } from '../shared/next-step';
import {
  type Closure,
  homeCard,
  undecidedOf,
  upNextItems,
  type UpNextView,
} from '../shared/student-view';

/** The experiment the Home's cover names, and how it came to be named. */
export interface HomeCover {
  /** `continue`: the service's last worked on; `start`: its first waiting format; `listed`: the first listed. */
  readonly kind: 'start' | 'continue' | 'listed';
  readonly experiment: MyExperimentRow;
  readonly course: MyCourseRow | null;
}

/**
 * The cover (state-copy `ST-01.card`): the service's `continue`, else the experiment of the first
 * format it lists in Up next ("Start here"), else — when nothing can be opened now (the
 * institution's pause, a licence wait) — the first experiment listed in the Student's courses.
 */
export function homeCoverOf(read: HomeRead): HomeCover | null {
  const card = homeCard(read);
  if (card) return card;
  for (const entry of read.courses) {
    const experiment = entry.experiments[0];
    if (experiment) return { kind: 'listed', experiment, course: entry.course };
  }
  return null;
}

/** The cover's one next step (the export's `nextStep`, on the product's answers). */
export type HomeStep =
  | { readonly kind: 'paused' }
  | { readonly kind: 'inactive' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'undecided' }
  | { readonly kind: 'continue'; readonly format: Technology }
  | { readonly kind: 'feedback'; readonly format: Technology }
  | { readonly kind: 'resources'; readonly total: number }
  | { readonly kind: 'simulation' }
  | {
      readonly kind: 'assessment';
      readonly assessmentId: string;
      readonly name: string | null;
      readonly deadline: string | null;
    }
  | { readonly kind: 'attempt'; readonly assessmentId: string }
  | { readonly kind: 'set-up'; readonly format: Technology }
  | { readonly kind: 'nothing' };

export interface HomeStepInput {
  readonly read: HomeRead;
  readonly cover: HomeCover;
  readonly closure: Closure;
  /** The cover experiment's hub, when it answered. */
  readonly hub: ExperimentHub | null;
  /** The Student's own assessments (empty: not read). */
  readonly assessments: readonly MyAssessmentRow[];
}

/** The cover's assessment, from its hub or — without it — from an Up next item naming it. */
function assessmentOf({ read, cover, hub }: HomeStepInput): {
  readonly id: string;
  readonly toDo: boolean;
  readonly inProgress: boolean;
} | null {
  if (hub) {
    if ('kind' in hub.assessment) return null;
    const result = hub.assessment.result;
    return {
      id: hub.assessment.id,
      toDo: result.kind === 'to-do',
      inProgress: result.kind === 'in-progress',
    };
  }
  const item = read.home.upNext.find(
    (entry) =>
      entry.kind === 'assessment' &&
      read.assessmentExperiments[entry.assessmentId] === cover.experiment.name,
  );
  return item && item.kind === 'assessment'
    ? { id: item.assessmentId, toDo: true, inProgress: false }
    : null;
}

/**
 * The cover's next step: why nothing opens now (the pause, an inactive account, an undecided rule,
 * a licence wait), else the one rule (`nextStepOf`, shared with the hub) over the cover's row, the
 * feedback Up next offers for it, its hub's resources (when the hub answered) and its assessment;
 * else nothing waiting.
 */
export function homeStepOf(input: HomeStepInput): HomeStep {
  const { read, cover, closure, hub, assessments } = input;
  const experiment = cover.experiment;
  if (closure === 'paused' || experiment.closure?.kind === 'institution-paused') {
    return { kind: 'paused' };
  }
  if (closure === 'inactive' || experiment.closure?.kind === 'student-inactive') {
    return { kind: 'inactive' };
  }
  if (undecidedOf(experiment) !== null) return { kind: 'undecided' };
  if (experiment.closure?.kind === 'waiting-for-a-licence') return { kind: 'waiting' };
  const feedback = read.home.upNext.find(
    (item) => item.kind === 'feedback' && item.experimentId === experiment.experimentId,
  );
  const assessment = assessmentOf(input);
  const step = nextStepOf({
    row: experiment,
    feedbackDue: feedback && feedback.kind === 'feedback' ? feedback.format : null,
    resources: hub ? hub.resourceSummary : null,
    assessment,
  });
  if (step === null) return { kind: 'nothing' };
  if (step === 'open-resources')
    return { kind: 'resources', total: hub?.resourceSummary.total ?? 0 };
  if (step === 'choose-format') return { kind: 'simulation' };
  if (step === 'assessment-to-do' && assessment) {
    const row = assessments.find((entry) => entry.assessment.id === assessment.id);
    return {
      kind: 'assessment',
      assessmentId: assessment.id,
      name: row?.assessment.name ?? null,
      deadline: row?.assessment.rules.deadline ?? null,
    };
  }
  if (step === 'assessment-in-progress' && assessment) {
    return { kind: 'attempt', assessmentId: assessment.id };
  }
  const at = step.lastIndexOf('-');
  const format = step.slice(at + 1) as Technology;
  if (step.startsWith('continue-')) return { kind: 'continue', format };
  if (step.startsWith('feedback-')) return { kind: 'feedback', format };
  return { kind: 'set-up', format };
}

/** Whether the step is one to take (`is-next`, "Your next step", the gold button). */
export function stepToTake(step: HomeStep): boolean {
  return !['paused', 'inactive', 'waiting', 'undecided', 'nothing'].includes(step.kind);
}

/**
 * Up next for the Student's other experiments (state-copy `ST-01.up-next`): the service's items
 * that the cover does not already cover — a format or feedback of another experiment, an
 * assessment of another experiment — at most three, in its order. The export draws one
 * experiment; the product keeps these in the Home's side column.
 */
export function otherUpNext(read: HomeRead, cover: HomeCover): UpNextView[] {
  return upNextItems(read, null).filter((item) =>
    item.kind === 'assessment'
      ? item.experimentName !== cover.experiment.name
      : item.experimentId !== cover.experiment.experimentId,
  );
}
