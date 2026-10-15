/**
 * IA-05's pure view (B2-05 script `gvView`): the step in the address, the choices the page holds,
 * and what they come to against the service's options — only what the service offers as
 * selectable can be chosen (B2-05 f9), and the step checks are the contract's own input schema
 * (`previewGiveAccessInput`), with its drawn words ("Choose at least one experiment" …).
 */
import type { GiveAccessOptions } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import type { ErrorSummaryItem } from '@xr/ui';

import type { GiveStep } from '@/copy/student-access';
import { giveAccessAddress } from '@/nav/institute';
import {
  checkGiveExperiments,
  checkGiveTarget,
  type GiveChoice,
  type GiveCheck,
} from '@/queries/student-access';

export const STEPS: readonly GiveStep[] = ['experiments', 'students', 'review'];

/** The step in the address (`?step=`); the first step when there is none. */
export function stepOf(search: string): GiveStep {
  const step = new URLSearchParams(search).get('step');
  return step === 'students' || step === 'review' ? step : 'experiments';
}

/** A step's number, 1 … 3. */
export function stepNumber(step: GiveStep): number {
  return STEPS.indexOf(step) + 1;
}

/** The address of a step, keeping what the page was opened with (`?student=`, `?group=` …). */
export function stepAddress(search: string, step: GiveStep): string {
  const query = new URLSearchParams(search);
  const base = giveAccessAddress({
    student: query.get('student') ?? undefined,
    group: query.get('group') ?? undefined,
    course: query.get('course') ?? undefined,
    experiment: query.get('experiment') ?? undefined,
  });
  return `${base}${base.includes('?') ? '&' : '?'}step=${step}`;
}

/** The choices the page holds (B2-05 `gvInit`: exps, who, sel, grp, q). */
export interface Draft {
  readonly courseId: string | null;
  readonly experimentIds: readonly string[];
  readonly who: 'students' | 'group';
  readonly studentIds: readonly string[];
  readonly groupId: string | null;
  readonly search: string;
}

/** What the page was opened with (B2-05 f4 "from Give this group access", f13 "from the student record"). */
export interface Prefill {
  readonly student: string | null;
  readonly group: string | null;
}

export function prefillOf(search: string): Prefill {
  const query = new URLSearchParams(search);
  return { student: query.get('student'), group: query.get('group') };
}

export function draftOf(search: string): Draft {
  const query = new URLSearchParams(search);
  const student = query.get('student');
  const group = query.get('group');
  const experiment = query.get('experiment');
  return {
    courseId: query.get('course'),
    experimentIds: experiment ? [experiment] : [],
    who: group ? 'group' : 'students',
    studentIds: student ? [student] : [],
    groupId: group,
    search: '',
  };
}

export const EMPTY_DRAFT: Draft = {
  courseId: null,
  experimentIds: [],
  who: 'students',
  studentIds: [],
  groupId: null,
  search: '',
};

type OptionExperiment = GiveAccessOptions['experiments'][number];
type OptionStudent = GiveAccessOptions['students'][number];
type OptionGroup = GiveAccessOptions['groups'][number];

/** The choices that hold against the service's options, in the options' order. */
export interface Chosen {
  readonly inPlan: readonly OptionExperiment[];
  readonly notInPlan: readonly OptionExperiment[];
  readonly experiments: readonly OptionExperiment[];
  readonly students: readonly OptionStudent[];
  readonly group: OptionGroup | null;
  /** The formats the chosen experiments inherit from the plan (LD-1), once each. */
  readonly formats: readonly Technology[];
}

export function chosenOf(options: GiveAccessOptions, draft: Draft): Chosen {
  const inPlan = options.experiments.filter((entry) => entry.inPlan);
  const experiments = inPlan.filter((entry) => draft.experimentIds.includes(entry.experimentId));
  return {
    inPlan,
    notInPlan: options.experiments.filter((entry) => !entry.inPlan),
    experiments,
    students: options.students.filter(
      (student) => student.selectable && draft.studentIds.includes(student.id),
    ),
    group: options.groups.find((group) => group.id === draft.groupId && group.selectable) ?? null,
    formats: [...new Set(experiments.flatMap((entry) => entry.formats))],
  };
}

/** The choice to preview and give, once the experiments and the students or group are chosen. */
export function choiceOf(draft: Draft, chosen: Chosen): GiveChoice | null {
  if (chosen.experiments.length === 0) return null;
  const experimentIds = chosen.experiments.map((entry) => entry.experimentId);
  if (draft.who === 'group') {
    return chosen.group
      ? { experimentIds, target: { kind: 'group', groupId: chosen.group.id } }
      : null;
  }
  return chosen.students.length > 0
    ? {
        experimentIds,
        target: { kind: 'students', studentIds: chosen.students.map((student) => student.id) },
      }
    : null;
}

/** The first step that is not complete for a step's address (a reload starts again; state-copy). */
export function reachableStep(step: GiveStep, draft: Draft, chosen: Chosen): GiveStep {
  if (step === 'experiments') return step;
  if (chosen.experiments.length === 0) return 'experiments';
  if (step === 'review' && choiceOf(draft, chosen) === null) return 'students';
  return step;
}

/** The error summary of a failed step check: its title and one linked line per error. */
export interface StepErrors {
  readonly title: string;
  readonly items: readonly ErrorSummaryItem[];
}

/** The field each step check's error links to. */
export const FIELD_IDS = {
  experiments: 'give-access-experiments',
  students: 'give-access-students',
  groups: 'give-access-groups',
  give: 'give-access-give',
} as const;

function summaryOf(check: GiveCheck | null, fieldId: string): StepErrors | null {
  if (check === null) return null;
  return {
    title: check.title,
    items: check.lines.map((line, index) => ({
      fieldId: index === 0 ? fieldId : `${fieldId}-${index}`,
      summaryText: line,
    })),
  };
}

/** Step 1 "Continue" (B2-05 `next1`): at least one experiment — the contract's own rule. */
export function checkExperiments(chosen: Chosen): StepErrors | null {
  return summaryOf(
    checkGiveExperiments(chosen.experiments.map((entry) => entry.experimentId)),
    FIELD_IDS.experiments,
  );
}

/** Step 2 "Continue" (B2-05 `next2`): students, or a group — the contract's own rule. */
export function checkTarget(draft: Draft, chosen: Chosen): StepErrors | null {
  return summaryOf(
    draft.who === 'group'
      ? checkGiveTarget({ kind: 'group', groupId: chosen.group?.id ?? null })
      : checkGiveTarget({
          kind: 'students',
          studentIds: chosen.students.map((student) => student.id),
        }),
    draft.who === 'group' ? FIELD_IDS.groups : FIELD_IDS.students,
  );
}
