'use client';

/**
 * RV-03 Review a submission and RV-06 its decided state (B6-03, B6-11 f0 … f3): the one extra read
 * the page needs and the contract's own checks, run before a decision is sent. Features import
 * contracts for types only (Appendix F §3.8), so the runtime pieces live here:
 *
 * - **The course** the submission is for, named as the public catalogue names it (its platform
 *   code and name: "ME ZG523 · Thermodynamics & Heat Transfer", B6-03 f0). The review read carries
 *   the course id only.
 * - **The checks**: `approveSubmissionInput` (at least one learning outcome, each with text) and
 *   `returnSubmissionInput` (a reason), with their drawn message keys (`RV-03.outcomes.at-least-one`,
 *   `RV-03.outcome.required`, `RV-03.reason.required`); the outcome editor's own drawn words
 *   (`RV-03.outcome.required-or-cancel`). The service checks again and answers the same keys.
 */
import {
  approveSubmissionInput,
  messageFor,
  parseInput,
  type ProductPorts,
  returnSubmissionInput,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { CourseId } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

import { defineQuery, useXrQuery } from './use-xr-query';

export const reviewCourse = defineQuery({
  family: 'CRS',
  view: 'review-submission-course',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, courseId: string) => ports.catalogue.getCourse(courseId as CourseId),
});

/** The submission's course as the catalogue lists it (`null` id: nothing to read). */
export function useReviewCourse(courseId: string | null) {
  return useXrQuery(reviewCourse, courseId ?? '', { enabled: courseId !== null });
}

/** The drawn words of a field error, or `null` when the catalogue draws none. */
function wordsOf(error: ValidationFailed, field: (path: string) => boolean): string | null {
  const found = error.fieldErrors.find((entry) => field(entry.field));
  return found ? fieldWords(found) : null;
}

/** What a decision's answer says is wrong, as the page shows it (panel, field). */
export interface DecisionIssues {
  /** The panel's error: "Add at least one learning outcome before you approve". */
  readonly outcomes: string | null;
  /** The reason field's error: "Add a reason so the vendor knows what to change". */
  readonly reason: string | null;
}

/** A `validation-failed` answer (the client's check or the service's) as the page's issues. */
export function decisionIssues(error: ValidationFailed): DecisionIssues {
  return {
    outcomes: wordsOf(error, (path) => path === 'outcomes' || path.startsWith('outcomes.')),
    reason: wordsOf(error, (path) => path === 'reason'),
  };
}

/** Approve's check before DL-1 opens: the contract's rule on the working set (OD-B6-02). */
export function approveIssues(input: {
  readonly id: string;
  readonly outcomes: readonly string[];
  readonly expectedRev: number;
}): DecisionIssues | null {
  const parsed = parseInput(approveSubmissionInput, input, null);
  return parsed.ok ? null : decisionIssues(parsed.error);
}

/** Return's check when "Return to vendor" is pressed in DL-2: a reason is required. */
export function returnIssues(input: {
  readonly id: string;
  readonly reason: string;
  readonly references: readonly unknown[];
  readonly outcomes: readonly string[];
  readonly expectedRev: number;
}): DecisionIssues | null {
  const parsed = parseInput(returnSubmissionInput, input, null);
  return parsed.ok ? null : decisionIssues(parsed.error);
}

/** "Add outcome" with nothing typed: the contract's per-outcome rule ("Enter the outcome text"). */
export function newOutcomeIssue(text: string): string | null {
  const parsed = parseInput(approveSubmissionInput.shape.outcomes.element, text, null);
  if (parsed.ok) return null;
  return parsed.error.fieldErrors[0] ? fieldWords(parsed.error.fieldErrors[0]) : null;
}

/** "Save outcome" with the text cleared: the editor's own drawn words ("…, or cancel"). */
export function editedOutcomeIssue(text: string): string | null {
  if (newOutcomeIssue(text) === null) return null;
  return messageFor('RV-03.outcome.required-or-cancel');
}
