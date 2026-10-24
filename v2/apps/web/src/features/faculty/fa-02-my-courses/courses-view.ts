import type { TeachingCourseRow } from '@xr/contracts/draft';

import { deadlineWords } from '@/copy/assessment-words';
import { assessmentName } from '@/copy/fa-shared';
import { writtenWaitingWords } from '@/copy/faculty-experiment';
import { withConfirmWords } from '@/copy/marking';
import {
  accessEndedLine,
  assessmentDueLine,
  courseExperimentsLabel,
  MY_COURSES_PAGE,
  openCourseLabel,
  withAccessWords,
} from '@/copy/faculty-courses';
import { facultyCourseAddress, facultyExperimentAddress } from '@/nav/faculty';

import type { TaughtExperiment } from '../fa-04-experiments/taught-experiments';
import { colleagueOf, formatCodes, studentsReached } from '../fa-04-experiments/teaching-view';
import { assessmentStateLongView, type StatusView } from '../shared/assessment-state';

/**
 * FA-02's course ledger (the export's `vmCourses` for the Courses tab): each course the Institute
 * Admin's Faculty courses map to the Faculty member, with its figures (the service's counts) and its
 * taught experiments in aligned rows — formats, Students with access and the assessment (status,
 * name, deadline, "created by" for a colleague's, the own written answers waiting). Pure.
 */

export interface LedgerRowView {
  readonly experimentId: string;
  readonly name: string;
  readonly href: string;
  readonly formats: readonly string[];
  readonly students: string;
  /** "Assessment ready" (ok), "Assessment in draft" or "No assessment yet" (neutral). */
  readonly status: StatusView;
  readonly assessment: string | null;
  readonly detail: string;
  readonly waiting: string | null;
}

export interface LedgerCourseView {
  readonly courseId: string;
  readonly code: string | null;
  readonly name: string;
  readonly source: string;
  readonly figures: {
    readonly experiments: number;
    readonly students: number;
    readonly assessments: number;
  };
  readonly href: string;
  readonly openLabel: string;
  readonly listLabel: string;
  readonly rows: readonly LedgerRowView[];
}

function ledgerRow(entry: TaughtExperiment, me: string | null): LedgerRowView {
  const { option, teaching, assessment } = entry;
  const colleague = assessment === null ? null : colleagueOf(assessment, me);
  const waiting = assessment !== null && colleague === null ? assessment.waitingForMarking : 0;
  return {
    experimentId: option.experimentId,
    name: option.name,
    href: facultyExperimentAddress(option.experimentId),
    formats: formatCodes(teaching.formatsInstitutionHas),
    students: withAccessWords(studentsReached(teaching)),
    status: assessmentStateLongView(assessment?.readiness ?? null),
    assessment: assessment === null ? null : assessmentName(assessment.assessment.name),
    detail:
      assessment === null
        ? MY_COURSES_PAGE.createFromExperiment
        : assessmentDueLine(
            assessment.assessment.rules.deadline === null
              ? null
              : deadlineWords(assessment.assessment.rules.deadline),
            colleague,
          ),
    // Choice-only submissions waiting for confirmation are named too (24 Oct 2026).
    waiting: withConfirmWords(
      waiting > 0 ? writtenWaitingWords(waiting) : null,
      assessment !== null && colleague === null ? assessment.waitingToConfirm : 0,
    ),
  };
}

/** The ledger: one card per course (listMyCourses order), its taught experiments as rows. */
export function ledgerViews(
  courses: readonly TeachingCourseRow[],
  taught: readonly TaughtExperiment[],
  me: string | null,
): LedgerCourseView[] {
  return courses.map((row) => ({
    courseId: row.course.id,
    code: row.course.platformCode,
    name: row.course.name,
    source:
      row.accessEndedOn === null ? MY_COURSES_PAGE.source : accessEndedLine(row.accessEndedOn),
    figures: {
      experiments: row.experiments,
      students: row.studentsWithAccess,
      assessments: row.assessments,
    },
    href: facultyCourseAddress(row.course.id),
    openLabel: openCourseLabel(row.course.platformCode, row.course.name),
    listLabel: courseExperimentsLabel(row.course.platformCode, row.course.name),
    rows: taught
      .filter((entry) => entry.teaching.experiment.courseId === row.course.id)
      .map((entry) => ledgerRow(entry, me)),
  }));
}
