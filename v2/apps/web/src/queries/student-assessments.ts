'use client';

/**
 * The Student's assessment reads (Phase 4B; boards B4-11 … B4-13): Assessments (ST-11) and the
 * hub's Assessment tab and Home's "Up next" read `listMyAssessments`; "Before you start" (ST-12)
 * and the attempt (ST-13) read `getAssessmentIntro` — its `sheet` is the attempt in progress
 * without any key (PC-55); the result (ST-14) reads `getResult`, figure-free until the pinned
 * version's release setting is met. Each read declares the record kinds it is read from, so the
 * Student's own commands (start, answer, submit) and the Faculty member's (settings, marks)
 * refresh it in the same tab.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { AssessmentId, AttemptId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** What a Student's assessment view is read from: the assessment, attempts, questions and access. */
const DEPS = [
  'ASMT',
  'ATT',
  'Q',
  'SACC',
  'GRP',
  'ACC',
  'INST',
  'PER',
  'EXP',
  'CRS',
  'CCODE',
] as const;

export const myAssessments = defineQuery({
  family: 'ASMT',
  view: 'student-assessments',
  deps: DEPS,
  read: (ports: ProductPorts) => ports.assessments.listMyAssessments(),
});

/** ST-11, the hub's Assessment tab, Home's "Up next" (B4-11 f0 … f10). */
export function useMyAssessments(enabled = true) {
  return useXrQuery(myAssessments, null, { enabled });
}

export const assessmentIntro = defineQuery({
  family: 'ASMT',
  view: 'student-assessment-intro',
  deps: DEPS,
  read: (ports: ProductPorts, assessmentId: string) =>
    ports.assessments.getAssessmentIntro(assessmentId as AssessmentId),
});

/** ST-12 and ST-13 (B4-11 f11 … f16, B4-12): the facts, the Student's attempts and the sheet. */
export function useAssessmentIntro(assessmentId: string | null, enabled = true) {
  return useXrQuery(assessmentIntro, assessmentId ?? '', {
    enabled: enabled && assessmentId !== null,
  });
}

export const attemptResult = defineQuery({
  family: 'ATT',
  view: 'student-attempt-result',
  deps: ['ASMT', 'ATT', 'Q', 'PER'],
  read: (ports: ProductPorts, attemptId: string) =>
    ports.assessments.getResult(attemptId as AttemptId),
});

/** ST-14 (B4-13): the latest submitted attempt's result, as its version releases it. */
export function useAttemptResult(attemptId: string | null, enabled = true) {
  return useXrQuery(attemptResult, attemptId ?? '', {
    enabled: enabled && attemptId !== null,
  });
}
