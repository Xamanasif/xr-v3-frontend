'use client';

/**
 * RV-04 Review an update (Phase 6; boards B6-04, B6-13, B7-11): the one extra read the page needs
 * and the contract’s own check, run before a decision is sent. Features import contracts for types
 * only (Appendix F §3.8), so the runtime pieces live here:
 *
 * - **The experiment as the public catalogue lists it** — its course (platform code and name:
 *   “CHE ZG513 · Process Instrumentation & Control”, B6-04 f0) and its learning outcomes, for
 *   “About this experiment · Live · read-only”. The review read carries the update, the
 *   comparison and the live version, not the course or the outcomes. The public page reads only
 *   the live version, so it is the same for every reader (EXP-03).
 * - **The check**: `returnUpdateInput` (a reason), with its drawn message key
 *   (`RV-04.reason.required`: “Add a reason so the Content Manager knows what to change”). The
 *   service checks again and answers the same key.
 */
import {
  parseInput,
  type ProductPorts,
  returnUpdateInput,
  type ValidationFailed,
} from '@xr/contracts/draft';
import type { ExperimentId } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

import { defineQuery, useXrQuery } from './use-xr-query';

export const reviewUpdateExperiment = defineQuery({
  family: 'EXP',
  view: 'review-update-experiment',
  deps: ['AREA', 'CRS', 'EXP'],
  read: (ports: ProductPorts, experimentId: string) =>
    ports.catalogue.getExperiment(experimentId as ExperimentId),
});

/** The updated experiment as the catalogue lists it (`null` id: nothing to read yet). */
export function useReviewUpdateExperiment(experimentId: string | null) {
  return useXrQuery(reviewUpdateExperiment, experimentId ?? '', {
    enabled: experimentId !== null,
  });
}

/** The reason field’s words from a `validation-failed` answer (the client’s check or the service’s). */
export function returnReasonIssue(error: ValidationFailed): string | null {
  const found = error.fieldErrors.find((entry) => entry.field === 'reason');
  return found ? fieldWords(found) : null;
}

/** Return’s check when “Return to the Content Manager” is pressed in DL-2: a reason is required. */
export function returnUpdateIssue(input: {
  readonly id: string;
  readonly reason: string;
  readonly expectedRev: number;
}): string | null {
  const parsed = parseInput(returnUpdateInput, input, null);
  return parsed.ok ? null : returnReasonIssue(parsed.error);
}
