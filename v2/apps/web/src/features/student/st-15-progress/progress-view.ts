/**
 * Pure view helpers of ST-15 Progress (the V3 Student export's `progVM` / `progExp`): which course
 * each experiment the progress read answers sits under, the formats each lists — its own given
 * formats in the table, the others under "Not available to you" — what the Status filter matches,
 * and the assessment line. They decide no progress: activity, completion, availability and
 * feedback stay the service's separate answers (BC3) — a format is "Completed" only where its
 * progress view carries the completion record (T-12), and nothing is summed across formats (T-13).
 * The chip, pill, facts and action of one format are the shared `format-progress.ts`'s.
 */
import type { LearningService, MyAssessmentRow, MyExperimentRow } from '@xr/contracts/draft';
import type { FormatCode, FormatProgressStatus, FormatProgressView } from '@xr/domain';

import { resultWords, studentAssessmentWords, wordsOf } from '@/copy/flow-state-words';
import { PROGRESS_ASSESSMENT } from '@/copy/progress-feedback';
import { studentAssessmentAddress } from '@/nav/student-assessments';
import type { MyExperimentEntry } from '@/queries/student';

import {
  type FormatChipView,
  formatChipOf,
  type OffFormatRow,
  offFormatRowsOf,
} from '../shared/format-progress';
import { type Closure, hubFormatOrder, isGiven, policyOpenOf } from '../shared/student-view';

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

/** One course group (`div.sv-pgroup`). */
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

/** A format of the Student's own, in the table: given (now or not right now) or undecided. */
export interface ProgressFormat {
  readonly view: FormatProgressView;
  readonly chip: FormatChipView;
  /** Given to the Student (the Status filter reads these); `false`: an undecided rule (PC-26). */
  readonly given: boolean;
}

/** The table's formats in the hub's order (given first) and the formats not available to them. */
export function formatsOf(
  item: ProgressExperiment,
  session: Closure,
): { readonly mine: readonly ProgressFormat[]; readonly off: readonly OffFormatRow[] } {
  const mine: ProgressFormat[] = [];
  for (const entry of hubFormatOrder(item.experiment)) {
    const given = isGiven(entry.availability);
    if (!given && policyOpenOf(entry.availability) === null) continue;
    const view = item.progress.formats.find((candidate) => candidate.format === entry.format);
    if (!view) continue;
    mine.push({
      view,
      given,
      chip: formatChipOf(entry.format, entry.availability, item.experiment.closure, session),
    });
  }
  return { mine, off: offFormatRowsOf(hubFormatOrder(item.experiment)) };
}

/** Another format of the experiment the Student can open now ("WEB still opens"). */
export function opensNow(mine: readonly ProgressFormat[], except: FormatCode): FormatCode | null {
  return (
    mine.find((entry) => entry.chip.kind === 'on' && entry.chip.code !== except)?.chip.code ?? null
  );
}

/** The given formats' progress — what the Status filter reads (one of them has the status). */
export function givenStatuses(item: ProgressExperiment): FormatProgressStatus[] {
  return item.experiment.formats.flatMap((entry) => {
    if (!isGiven(entry.availability)) return [];
    const view = item.progress.formats.find((candidate) => candidate.format === entry.format);
    return view ? [view.status] : [];
  });
}

/** The institution's pause, from the experiment's closure or the session's banner facts. */
export function pausedNow(item: ProgressExperiment, session: Closure): boolean {
  return session === 'paused' || item.experiment.closure?.kind === 'institution-paused';
}

/** The assessment line: the words and, where the export draws one, the way on. */
export interface AssessmentLine {
  readonly words: string;
  readonly link?: { readonly href: string; readonly label: string };
}

/**
 * The experiment's assessment line (`progExp` `asmt`): from the Student's assessment row
 * (`listMyAssessments`, its name, deadline and latest result) when that read has it, else from the
 * progress read's own result in the Student's status words (no name, no way on). "Open assessment", "Continue attempt" and "See result" go
 * to ST-12, ST-13 and ST-14.
 */
export function assessmentLineOf(
  progress: ProgressRow,
  row: MyAssessmentRow | undefined,
): AssessmentLine {
  if (row) {
    const { name, id } = row.assessment;
    const result = row.result;
    switch (result.kind) {
      case 'to-do':
        return {
          words: PROGRESS_ASSESSMENT.toDo(name, row.assessment.rules.deadline),
          link: { href: studentAssessmentAddress(id), label: PROGRESS_ASSESSMENT.open },
        };
      case 'in-progress':
        return {
          words: PROGRESS_ASSESSMENT.inProgress(name),
          link: {
            href: studentAssessmentAddress(id, 'attempt'),
            label: PROGRESS_ASSESSMENT.continueAttempt,
          },
        };
      case 'waiting-for-marking':
        return { words: PROGRESS_ASSESSMENT.waiting(name) };
      case 'not-released-yet':
        return { words: PROGRESS_ASSESSMENT.notReleased(name) };
      case 'released':
        return {
          words: PROGRESS_ASSESSMENT.released(
            name,
            result.passed,
            result.score,
            result.outOf,
            result.releasedAt,
          ),
          link: {
            href: studentAssessmentAddress(id, 'result'),
            label: PROGRESS_ASSESSMENT.seeResult,
          },
        };
    }
  }
  // Without the assessments read: the progress read's own result in the Student's words.
  const { assessment } = progress;
  switch (assessment.kind) {
    case 'none-set':
      return { words: PROGRESS_ASSESSMENT.noneSet };
    case 'released':
      return { words: wordsOf(resultWords(assessment.passed)) ?? PROGRESS_ASSESSMENT.noneSet };
    case 'in-progress':
    case 'waiting-for-marking':
    case 'not-released-yet':
      return {
        words: wordsOf(studentAssessmentWords(assessment.kind)) ?? PROGRESS_ASSESSMENT.noneSet,
      };
  }
}

/** The Student's assessment row of an experiment, if the assessments read lists one. */
export function assessmentRowOf(
  rows: readonly MyAssessmentRow[] | null,
  experimentId: string,
): MyAssessmentRow | undefined {
  return rows?.find((row) => (row.assessment.experimentId as string) === experimentId);
}
