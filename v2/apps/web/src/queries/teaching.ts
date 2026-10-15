'use client';

/**
 * The Faculty workspace's reads (Phase 4A; boards B4-01 … B4-07): the overview, the courses and
 * experiments the Institute Admin's Faculty courses (IA-15) give the Faculty member, the
 * assessments, the question bank and the preview — `TeachingService`, `AssessmentService` and
 * `QuestionBankService` on the one sample world. Each read declares every record kind it is read
 * from, so a command receipt in the same tab (a Faculty course assigned, an assessment created or
 * set, a question added or edited, a grant given, a runtime report) refreshes it — for every role.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { AssessmentId, ExperimentId, QuestionId, QuestionType } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/**
 * What reach is read from beyond the scope (grants and groups); always spread together with
 * `SCOPE`, which already holds the people, the institution and its plans.
 */
const REACH = ['SACC', 'GRP'] as const;
/** What the Faculty member's scope is read from (Faculty courses ∩ the plans, FCM-04). */
const SCOPE = ['FMAP', 'ACC', 'INST', 'PER', 'CRS', 'EXP'] as const;

export const facultyOverview = defineQuery({
  family: 'faculty',
  view: 'faculty-overview',
  deps: [...SCOPE, ...REACH, 'ASMT', 'ATT', 'Q', 'RUN', 'COMP', 'CCODE'],
  read: (ports: ProductPorts) => ports.teaching.getFacultyOverview(),
});

export function useFacultyOverview(enabled = true) {
  return useXrQuery(facultyOverview, null, { enabled });
}

export const teachingCourses = defineQuery({
  family: 'faculty',
  view: 'faculty-my-courses',
  deps: [...SCOPE, ...REACH, 'ASMT', 'AREA'],
  read: (ports: ProductPorts) => ports.teaching.listMyCourses(),
});

export function useTeachingCourses(enabled = true) {
  return useXrQuery(teachingCourses, null, { enabled });
}

export const teachingExperiment = defineQuery({
  family: 'EXP',
  view: 'faculty-teaching-experiment',
  deps: [...SCOPE, ...REACH, 'ASMT', 'AREA', 'RUN', 'COMP', 'RES'],
  read: (ports: ProductPorts, experimentId: string) =>
    ports.teaching.getTeachingExperiment(experimentId as ExperimentId),
});

export function useTeachingExperiment(experimentId: string | null, enabled = true) {
  return useXrQuery(teachingExperiment, experimentId ?? '', {
    enabled: enabled && experimentId !== null,
  });
}

export const facultyAssessments = defineQuery({
  family: 'ASMT',
  view: 'faculty-assessments',
  deps: [...SCOPE, ...REACH, 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts) => ports.assessments.listAssessments(),
});

export function useFacultyAssessments(enabled = true) {
  return useXrQuery(facultyAssessments, null, { enabled });
}

export const createOptions = defineQuery({
  family: 'ASMT',
  view: 'faculty-create-options',
  deps: [...SCOPE, 'ASMT', 'CCODE'],
  read: (ports: ProductPorts) => ports.assessments.getCreateOptions(),
});

export function useCreateOptions(enabled = true) {
  return useXrQuery(createOptions, null, { enabled });
}

export const assessmentRecord = defineQuery({
  family: 'ASMT',
  view: 'faculty-assessment',
  deps: [...SCOPE, ...REACH, 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts, assessmentId: string) =>
    ports.assessments.getAssessment(assessmentId as AssessmentId),
});

export function useAssessmentRecord(assessmentId: string | null, enabled = true) {
  return useXrQuery(assessmentRecord, assessmentId ?? '', {
    enabled: enabled && assessmentId !== null,
  });
}

export const assessmentPreview = defineQuery({
  family: 'ASMT',
  view: 'faculty-assessment-preview',
  deps: [...SCOPE, 'ASMT', 'Q'],
  read: (ports: ProductPorts, assessmentId: string) =>
    ports.assessments.previewAsStudent(assessmentId as AssessmentId),
});

export function useAssessmentPreview(assessmentId: string | null, enabled = true) {
  return useXrQuery(assessmentPreview, assessmentId ?? '', {
    enabled: enabled && assessmentId !== null,
  });
}

export const questionBank = defineQuery({
  family: 'Q',
  view: 'faculty-question-bank',
  deps: [...SCOPE, 'Q', 'ASMT'],
  read: (
    ports: ProductPorts,
    params: { readonly experimentId: string; readonly type: string | null },
  ) =>
    ports.questionBank.listQuestions({
      experimentId: params.experimentId as ExperimentId,
      ...(params.type ? { type: params.type as QuestionType } : {}),
    }),
});

/** FA-14 (and FA-09's "Add from question bank" panel, FA-07 step 3): one experiment's questions. */
export function useQuestionBank(
  experimentId: string | null,
  type: QuestionType | null = null,
  enabled = true,
) {
  return useXrQuery(
    questionBank,
    { experimentId: experimentId ?? '', type },
    { enabled: enabled && experimentId !== null, keepPrevious: true },
  );
}

export const questionRecord = defineQuery({
  family: 'Q',
  view: 'faculty-question',
  deps: [...SCOPE, 'Q', 'ASMT'],
  read: (ports: ProductPorts, questionId: string) =>
    ports.questionBank.getQuestion(questionId as QuestionId),
});

export function useQuestionRecord(questionId: string | null, enabled = true) {
  return useXrQuery(questionRecord, questionId ?? '', {
    enabled: enabled && questionId !== null,
  });
}
