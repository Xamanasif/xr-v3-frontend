/**
 * Pure view helpers of ST-15 Progress (B3-05): which course each experiment the progress read
 * answers sits under, the line each format reads and the one action it offers. They decide no
 * progress: activity, completion, availability and feedback stay the service's separate answers
 * (BC3) — a format is "Completed" only where its progress view carries the completion record
 * (T-12), and nothing is summed across formats (T-13).
 */
import type { LearningService, MyExperimentRow } from '@xr/contracts/draft';
import type { FormatProgressStatus, Technology } from '@xr/domain';

import type { MyExperimentEntry } from '@/queries/student';

import { hubFormatOrder, isGiven, policyOpenOf } from '../shared/student-view';

type Read<M extends keyof LearningService> = Extract<
  Awaited<ReturnType<LearningService[M]>>,
  { readonly ok: true }
>['value'];

/** One experiment of `getMyProgress`: its name, grant, per-format progress views, assessment. */
export type ProgressRow = Read<'getMyProgress'>[number];

/** An experiment on Progress: the progress read beside the Student's own experiment row. */
export interface ProgressExperiment {
  readonly progress: ProgressRow;
  /** Availability per format and the closure, as the course page reads them (ST-03). */
  readonly experiment: MyExperimentRow;
}

/** One course section (B3-05 `section.xr-section`). */
export interface ProgressGroup {
  readonly course: MyExperimentEntry['course'];
  readonly experiments: readonly ProgressExperiment[];
}

/**
 * The experiments the progress read answers, under their courses in My courses' order (state-copy
 * `ST-15.groups`). An experiment My courses does not list has no course to sit under and is left
 * out.
 */
export function progressGroups(
  rows: readonly ProgressRow[],
  entries: readonly MyExperimentEntry[],
): ProgressGroup[] {
  const byId = new Map(rows.map((row) => [row.experimentId as string, row]));
  const groups: { course: MyExperimentEntry['course']; experiments: ProgressExperiment[] }[] = [];
  for (const entry of entries) {
    const progress = byId.get(entry.experiment.experimentId);
    if (!progress) continue;
    let group = groups.find((candidate) => candidate.course.courseId === entry.course.courseId);
    if (!group) {
      group = { course: entry.course, experiments: [] };
      groups.push(group);
    }
    group.experiments.push({ progress, experiment: entry.experiment });
  }
  return groups;
}

/** A format line: a given format reads its own progress view; any other its availability. */
export type FormatLine =
  | {
      readonly kind: 'given';
      readonly format: Technology;
      /** Open now (`available-to-you`), or given but not available right now (D-26). */
      readonly openNow: boolean;
      readonly view: ProgressRow['formats'][number];
    }
  | {
      readonly kind: 'off';
      readonly format: Technology;
      readonly availability:
        | 'not-included-for-your-institution'
        | 'not-available-for-this-experiment'
        | { readonly policyOpen: string };
    };

/** B3-05's lines, in the hub's order: given formats, then those not included, then not available. */
export function formatLines(item: ProgressExperiment): FormatLine[] {
  const lines: FormatLine[] = [];
  for (const entry of hubFormatOrder(item.experiment)) {
    const { availability } = entry;
    if (isGiven(availability)) {
      const view = item.progress.formats.find((candidate) => candidate.format === entry.format);
      if (view) {
        lines.push({
          kind: 'given',
          format: entry.format,
          openNow: availability === 'available-to-you',
          view,
        });
      }
    } else if (policyOpenOf(availability) !== null) {
      lines.push({
        kind: 'off',
        format: entry.format,
        availability: availability as { readonly policyOpen: string },
      });
    } else if (
      availability === 'not-included-for-your-institution' ||
      availability === 'not-available-for-this-experiment'
    ) {
      lines.push({ kind: 'off', format: entry.format, availability });
    }
  }
  return lines;
}

/** The given formats' progress — what the Status filter reads (B3-05 `states.includes(s.st)`). */
export function givenStatuses(item: ProgressExperiment): FormatProgressStatus[] {
  return formatLines(item).flatMap((line) => (line.kind === 'given' ? [line.view.status] : []));
}

/** The one action a format line offers (state-copy `ST-15.actions`). */
export type LineAction =
  | { readonly kind: 'none' }
  | { readonly kind: 'continue-web' }
  | { readonly kind: 'open-format' }
  | { readonly kind: 'give-feedback' }
  | { readonly kind: 'feedback-sent'; readonly sentAt: string };

export function lineAction(
  line: Extract<FormatLine, { kind: 'given' }>,
  experiment: MyExperimentRow,
): LineAction {
  const { view } = line;
  // A sent feedback is the Student's own fact and stays said (B3-05 f2); it is never an action.
  if (typeof view.feedback === 'object')
    return { kind: 'feedback-sent', sentAt: view.feedback.sentAt };
  // Paused (f5), inactive, a licence wait, not available right now: the words stay, no action.
  if (view.beforePause || experiment.closure !== null || !line.openNow) return { kind: 'none' };
  switch (view.status) {
    case 'completed':
      // Offered by the service from THIS format's completion only (BC5), never the experiment's.
      return view.feedback === 'offered' ? { kind: 'give-feedback' } : { kind: 'none' };
    case 'in-progress':
      return line.format === 'web' ? { kind: 'continue-web' } : { kind: 'open-format' };
    case 'not-started':
      return { kind: 'open-format' };
  }
}
