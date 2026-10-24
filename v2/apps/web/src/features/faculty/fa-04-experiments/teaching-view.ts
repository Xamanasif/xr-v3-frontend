import type { AssessmentListRow, TeachingExperiment } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import type { FaProgressRow } from '@xr/ui/v3';

import { deadlineWords } from '@/copy/assessment-words';
import { assessmentName, faDaysLeftWords, writtenAnswersWaitingWords } from '@/copy/fa-shared';
import { withConfirmWords } from '@/copy/marking';
import {
  ASSESSMENT_SUMMARY,
  assessmentNoteWords,
  deadlinePassedWords,
} from '@/copy/faculty-experiment';
import { dueWords } from '@/copy/faculty-overview';

import { assessmentStateView, type StatusView } from '../shared/assessment-state';
import { deadlineView } from '../shared/deadline-model';
import { formatProgressRows } from '../shared/progress-model';

/**
 * The teaching screens' presentation over what the existing reads answer (FA-01 … FA-05; the
 * export's `asmSum`), on top of the role's shared models (`../shared/progress-model`,
 * `assessment-state`, `deadline-model`): `getTeachingExperiment` (per-format counts) and
 * `listAssessments` (readiness, submitted, reach, waiting for marking, the record's rules and who
 * created it), on the session's clock. Pure: the pages draw what these return. Counts only: never a
 * percentage, never one figure across formats.
 */

/** The display order of formats (WEB · AR · VR · MR). */
export const FORMAT_ORDER: readonly Technology[] = ['web', 'ar', 'vr', 'mr'];

/** The formats in the display order, as their codes ("WEB", "VR"). */
export function formatCodes(formats: readonly Technology[]): string[] {
  return FORMAT_ORDER.filter((format) => formats.includes(format)).map((format) =>
    format.toUpperCase(),
  );
}

/** Per format the institution holds, its three counts and its unit meter (the export's `fmProg`). */
export function progressRows(teaching: TeachingExperiment): FaProgressRow[] {
  return formatProgressRows(teaching.perFormatCounts);
}

/**
 * The Students the experiment reaches: one format's three counts (each such Student has exactly
 * one status in every format the institution has) — never a figure across formats.
 */
export function studentsReached(teaching: TeachingExperiment): number {
  const first = teaching.perFormatCounts[0];
  return first ? first.completed + first.inProgress + first.notStarted : 0;
}

/** Whole calendar days (Indian time) from an instant to today: how long something has waited. */
export function daysSince(instant: string, today: string): number {
  return Math.max(0, deadlineView(today, instant).days);
}

/** Whether a record was created by someone else (a co-teaching colleague): their name, else null. */
export function colleagueOf(row: AssessmentListRow, me: string | null): string | null {
  const by = row.assessment.createdBy;
  if (by.kind !== 'person' || me === null || by.personId === me) return null;
  return by.displayName;
}

/**
 * The assessment summary of an experiment, as the FA-03 panel and the FA-05 panel draw it (the
 * export's `asmSum`): its status, name, deadline with days left, submissions (own and Ready, with
 * Students reached), the written answers waiting, the note and the one assessment action.
 */
export interface AssessmentSummary {
  readonly assessmentId: string;
  readonly name: string;
  /** "Ready" (ok) or "Draft — not ready" (neutral). */
  readonly status: StatusView;
  readonly ready: boolean;
  readonly due: string;
  /** "7 days left", "today"; only for a Ready assessment whose deadline has not passed. */
  readonly left: string | null;
  /** Own and Ready with Students reached: "2 of 5 students submitted" and its meter. */
  readonly submissions: { readonly submitted: number; readonly reach: number } | null;
  /** The Faculty member's own written answers waiting (0 for a colleague's assessment). */
  readonly waiting: number;
  readonly waitingLine: string | null;
  /** "Created by …", "Rules not finished · …", "No questions yet · …"; none for an own Ready one. */
  readonly note: string | null;
  /** "Open assessment" (Ready) or "Continue setting up" (draft). */
  readonly action: string;
  /** The co-teaching colleague who created it, else null. */
  readonly colleague: string | null;
}

export function assessmentSummary(
  row: AssessmentListRow,
  me: string | null,
  today: string | null,
): AssessmentSummary {
  const { assessment } = row;
  const colleague = colleagueOf(row, me);
  const own = colleague === null;
  const ready = row.readiness === 'ready';
  const deadline = assessment.rules.deadline;
  const view = deadline !== null && today !== null ? deadlineView(deadline, today) : null;
  const due =
    deadline === null
      ? ASSESSMENT_SUMMARY.noDeadline
      : view?.passed
        ? deadlinePassedWords(deadlineWords(deadline))
        : dueWords(deadlineWords(deadline));
  const left =
    view !== null && !view.passed && ready
      ? faDaysLeftWords(Math.max(0, view.days), 'short')
      : null;
  const waiting = own ? row.waitingForMarking : 0;
  return {
    assessmentId: assessment.id,
    name: assessmentName(assessment.name),
    status: assessmentStateView(row.readiness),
    ready,
    due,
    left,
    submissions:
      own && ready && row.reach > 0 ? { submitted: row.submitted, reach: row.reach } : null,
    waiting,
    // Choice-only submissions waiting for confirmation are named too (24 Oct 2026).
    waitingLine: withConfirmWords(
      waiting > 0 ? writtenAnswersWaitingWords(waiting) : null,
      own ? row.waitingToConfirm : 0,
    ),
    note: assessmentNoteWords({ colleague, ready, questions: assessment.questions.length }),
    action: ready ? ASSESSMENT_SUMMARY.open : ASSESSMENT_SUMMARY.continue,
    colleague,
  };
}
