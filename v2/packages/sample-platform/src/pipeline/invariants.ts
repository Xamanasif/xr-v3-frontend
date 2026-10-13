/**
 * Step 6 of the pipeline (Appendix F §4.5; Appendix D §5.5): the twelve domain invariants
 * (`@xr/domain` `INVARIANTS`) checked over the world before and after every command. A broken
 * invariant is a programming error: it throws and nothing is committed.
 */
import {
  brokenInvariants,
  canOpenFormat,
  type CommandInfo,
  FORMAT_DISPLAY_ORDER,
  type InvariantWorld,
  type IsoInstant,
  type OverlapGrantPolicy,
} from '@xr/domain';

import { accessFacts, experimentsGivenTo } from '../world/queries.js';
import { formatKey, values } from '../world/records.js';
import type { SeededFacts, WorldRecords } from '../world/types.js';

/** Can-open answers for every Student × given experiment × format (invariant 5). */
function gates(
  records: WorldRecords,
  seeded: SeededFacts,
  overlap: OverlapGrantPolicy,
  now: IsoInstant,
): Map<string, boolean | 'policy-open'> {
  const answers = new Map<string, boolean | 'policy-open'>();
  for (const person of values(records.people)) {
    if (person.kind !== 'student') continue;
    for (const experimentId of experimentsGivenTo(records, person)) {
      const facts = accessFacts(records, seeded, person, overlap, experimentId);
      if (!facts) continue;
      const experiment = records.experiments[experimentId] ?? null;
      for (const format of FORMAT_DISPLAY_ORDER) {
        const gate = canOpenFormat({ ...facts, experiment, now, format });
        answers.set(
          formatKey(person.id, experimentId, format),
          gate.canOpen ? true : gate.reason === 'policy-open' ? 'policy-open' : false,
        );
      }
    }
  }
  return answers;
}

function project(
  records: WorldRecords,
  seeded: SeededFacts,
  overlap: OverlapGrantPolicy,
  now: IsoInstant,
  withGates: boolean,
): InvariantWorld {
  return {
    plans: values(records.plans),
    grants: values(records.grants),
    mappings: values(records.mappings),
    experiments: values(records.experiments),
    courses: values(records.courses),
    activities: values(records.activities),
    completions: values(records.completions),
    feedback: values(records.feedback),
    assessments: values(records.assessments),
    // Invariant 5 compares can-open only around a runtime report; elsewhere it does not apply.
    gates: withGates ? gates(records, seeded, overlap, now) : new Map(),
  };
}

export interface InvariantInputs {
  readonly before: WorldRecords;
  readonly after: WorldRecords;
  readonly seeded: SeededFacts;
  readonly overlap: OverlapGrantPolicy;
  readonly now: IsoInstant;
  readonly command: CommandInfo;
}

/** Throws when a command broke any of the twelve invariants. */
export function checkInvariants(inputs: InvariantInputs): void {
  const runtime =
    inputs.command.actor.kind === 'system' &&
    inputs.command.actor.system === 'system:runtime-report';
  const broken = brokenInvariants(
    project(inputs.before, inputs.seeded, inputs.overlap, inputs.now, runtime),
    project(inputs.after, inputs.seeded, inputs.overlap, inputs.now, runtime),
    inputs.command,
  );
  if (broken.length > 0) {
    throw new Error(`${inputs.command.name} broke an invariant: ${broken.join('; ')}`);
  }
}
