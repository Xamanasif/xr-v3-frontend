'use client';

/**
 * The Faculty member's Phase-4B reads (boards B4-06 f7 … f11, B4-08 … B4-10): an assessment's
 * submissions (FA-12), the marking queue (FA-18), a submission to mark (FA-19), the Students of a
 * taught experiment (FA-20) and one Student's detail (FA-21), and the drafts waiting for review
 * (FA-16, FA-14's Drafts tab). The CSV exports (FA-22), the drafting and import commands are run
 * with `useCommand` (an export is a read the screen asks for once, by a button).
 *
 * Drafts and checked import files are adapter state, not world records (PC-61; Q-06): no receipt
 * names them, so FA-16 reads `listDrafts` again after requesting, adding or discarding a draft.
 */
import type { ProductPorts, StudentProgressFilter } from '@xr/contracts/draft';
import type { AssessmentId, AttemptId, ExperimentId, PersonId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** The Faculty member's scope (Faculty courses ∩ the plans) and who an experiment reaches. */
const SCOPE = ['FMAP', 'ACC', 'INST', 'PER', 'CRS', 'EXP', 'SACC', 'GRP'] as const;

export const submissions = defineQuery({
  family: 'ATT',
  view: 'faculty-submissions',
  deps: [...SCOPE, 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts, assessmentId: string) =>
    ports.assessments.listSubmissions(assessmentId as AssessmentId),
});

/** FA-12 (B4-06 f7 … f11): the assessment's submitted attempts, oldest first. */
export function useSubmissions(assessmentId: string | null, enabled = true) {
  return useXrQuery(submissions, assessmentId ?? '', {
    enabled: enabled && assessmentId !== null,
  });
}

export const markingQueue = defineQuery({
  family: 'ATT',
  view: 'faculty-marking-queue',
  deps: [...SCOPE, 'ASMT', 'ATT', 'Q'],
  read: (
    ports: ProductPorts,
    params: { readonly assessmentId: string | null; readonly state: 'waiting' | 'marked' | 'all' },
  ) =>
    ports.marking.listQueue({
      state: params.state,
      ...(params.assessmentId ? { assessmentId: params.assessmentId as AssessmentId } : {}),
    }),
});

/** FA-18 (B4-09 f0, f4, f5), FA-12's "Mark next", FA-19's "Next submission". */
export function useMarkingQueue(
  assessmentId: string | null,
  state: 'waiting' | 'marked' | 'all',
  enabled = true,
) {
  return useXrQuery(markingQueue, { assessmentId, state }, { enabled, keepPrevious: true });
}

export const attemptForMarking = defineQuery({
  family: 'ATT',
  view: 'faculty-attempt-for-marking',
  deps: [...SCOPE, 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts, attemptId: string) =>
    ports.marking.getAttemptForMarking(attemptId as AttemptId),
});

/** FA-19 (B4-09 f1 … f3, f7, f8). */
export function useAttemptForMarking(attemptId: string | null, enabled = true) {
  return useXrQuery(attemptForMarking, attemptId ?? '', {
    enabled: enabled && attemptId !== null,
  });
}

/** A type literal (not an interface), so it is a query param (`QueryParams` has an index signature). */
export type StudentsFilter = {
  readonly experimentId: string;
  readonly inactiveForDays: 7 | 14 | 30 | null;
  readonly progress: StudentProgressFilter | null;
};

/** The list input of FA-20 and its export (FA-22): the same filter, so the CSV holds the list. */
export function studentsInput(filter: StudentsFilter) {
  return {
    experimentId: filter.experimentId as ExperimentId,
    ...(filter.inactiveForDays !== null ? { inactiveForDays: filter.inactiveForDays } : {}),
    ...(filter.progress !== null ? { progress: filter.progress } : {}),
  };
}

export const facultyStudents = defineQuery({
  family: 'faculty',
  view: 'faculty-students',
  deps: [...SCOPE, 'ASMT', 'ATT', 'Q', 'RUN', 'COMP'],
  read: (ports: ProductPorts, filter: StudentsFilter) =>
    ports.teaching.listStudents(studentsInput(filter)),
});

/** FA-20 (B4-10 f0, f1, f6, f7). */
export function useFacultyStudents(filter: StudentsFilter | null, enabled = true) {
  return useXrQuery(
    facultyStudents,
    filter ?? { experimentId: '', inactiveForDays: null, progress: null },
    { enabled: enabled && filter !== null, keepPrevious: true },
  );
}

export const facultyStudentDetail = defineQuery({
  family: 'PER',
  view: 'faculty-student-detail',
  deps: [...SCOPE, 'ASMT', 'ATT', 'Q', 'RUN', 'COMP', 'RES'],
  read: (
    ports: ProductPorts,
    params: { readonly studentId: string; readonly experimentId: string },
  ) =>
    ports.teaching.getStudentDetail({
      studentId: params.studentId as PersonId,
      experimentId: params.experimentId as ExperimentId,
    }),
});

/** FA-21 (B4-10 f3 … f5). */
export function useFacultyStudentDetail(
  studentId: string | null,
  experimentId: string | null,
  enabled = true,
) {
  return useXrQuery(
    facultyStudentDetail,
    { studentId: studentId ?? '', experimentId: experimentId ?? '' },
    { enabled: enabled && studentId !== null && experimentId !== null },
  );
}

export const questionDrafts = defineQuery({
  family: 'Q',
  view: 'faculty-question-drafts',
  deps: ['FMAP', 'ACC', 'EXP', 'Q'],
  read: (ports: ProductPorts, experimentId: string) =>
    ports.questionBank.listDrafts(experimentId as ExperimentId),
});

/** FA-16's "Drafts to review" and FA-14's Drafts tab: the Faculty member's own drafts. */
export function useQuestionDrafts(experimentId: string | null, enabled = true) {
  return useXrQuery(questionDrafts, experimentId ?? '', {
    enabled: enabled && experimentId !== null,
  });
}
