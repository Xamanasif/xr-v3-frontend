/**
 * M18 Resource opened (Appendix C §2; matrix RUN-01, RUN-02; B3-01). "Opening a resource marks it
 * “Opened” and nothing else (T-13)." It never counts as progress or completion and never writes
 * runtime activity (invariant 2). Only the first opening is kept (the boards show one date).
 */
import { type Decision, invalidState, ok, refused } from '../kernel/decision.js';
import type { PersonId, ResourceId } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import type { OpenGate } from '../access/model.js';
import type { Experiment } from '../catalogue/model.js';

export interface ResourceOpened {
  readonly studentId: PersonId;
  readonly resourceId: ResourceId;
  /** 'Opened 12 Oct 2026, 09:40'. */
  readonly firstOpenedAt: IsoInstant;
}

/** Open a resource in a new tab (RUN-01): the Student's given experiment, not paused, not inactive. */
export function openResource(input: {
  readonly existing: ResourceOpened | null;
  readonly studentId: PersonId;
  readonly resourceId: ResourceId;
  readonly experiment: Experiment;
  readonly gate: OpenGate;
  readonly now: IsoInstant;
}): Decision<{ readonly opened: ResourceOpened; readonly href: string }> {
  if (!input.gate.canOpen) {
    return input.gate.reason === 'policy-open'
      ? { ok: false, refusal: { kind: 'policy-open', decision: input.gate.decision } }
      : refused(input.gate.reason);
  }
  const resource = input.experiment.resources.find(
    (candidate) => candidate.id === input.resourceId,
  );
  if (!resource) return invalidState('not-in-experiment');
  return ok({
    opened: input.existing ?? {
      studentId: input.studentId,
      resourceId: input.resourceId,
      firstOpenedAt: input.now,
    },
    href: resource.href,
  });
}
