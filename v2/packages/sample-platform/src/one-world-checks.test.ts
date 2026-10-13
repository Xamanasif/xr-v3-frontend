/**
 * Negative controls for the WP-0.14 one-world checks: each check must FAIL on a world that breaks
 * its rule, naming the step, the commit and the record — otherwise a passing proof would prove
 * nothing. The broken worlds are hand-made copies of real fixture worlds; no adapter code is
 * changed or bypassed to make them.
 */
import type { PersonActorRef } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { assemblePlatform } from './platform/create.js';
import {
  commitViolations,
  historyViolations,
  type ObservedCommit,
  worldViolations,
} from './test-support/one-world/harness.js';
import { afterFlow } from './testing/index.js';
import type { World, WorldHistoryEntry } from './world/types.js';

const KAVYA: PersonActorRef = {
  kind: 'person',
  personId: 'per-kavya-nair' as PersonActorRef['personId'],
  role: 'content_manager',
  displayName: 'Kavya Nair',
};

function commitOf(
  before: World,
  after: World,
  method: string,
  changed: WorldHistoryEntry['changed'],
  actor: WorldHistoryEntry['actor'] = KAVYA,
): ObservedCommit {
  const entry: WorldHistoryEntry = {
    worldVersion: before.worldVersion + 1,
    commandId: 'cmd-control',
    method,
    origin: 'command',
    actor,
    at: before.anchor,
    changed,
    note: null,
  };
  return {
    step: 'CONTROL',
    before,
    after: { ...after, worldVersion: before.worldVersion + 1, history: [...before.history, entry] },
    entry,
  };
}

describe('WP-0.14 one-world checks catch what they claim to catch', () => {
  it('invariant 1: a publish that changes a grant fails, naming the step, the commit and the records', async () => {
    const before = await afterFlow('B');
    const grant = before.records.grants['SACC-0310']!;
    const after: World = {
      ...before,
      records: {
        ...before.records,
        grants: { ...before.records.grants, 'SACC-0310': { ...grant, state: 'withdrawn' } },
      },
    };
    const problems = commitViolations(
      assemblePlatform({ world: before }),
      commitOf(before, after, 'ProductionService.publish', [{ kind: 'SACC', id: 'SACC-0310' }]),
    );
    expect(problems.join('\n')).toMatch(
      /invariant #1 .*step CONTROL, commit ProductionService\.publish .*SACC:SACC-0310/,
    );
  });

  it('invariants 2/3: a completion written by a Student command fails', async () => {
    const before = await afterFlow('B');
    const completion = Object.values((await afterFlow('C')).records.completions)[0]!;
    const key = Object.keys((await afterFlow('C')).records.completions)[0]!;
    const after: World = {
      ...before,
      records: {
        ...before.records,
        completions: { ...before.records.completions, [key]: completion },
      },
    };
    const problems = commitViolations(
      assemblePlatform({ world: before }),
      commitOf(before, after, 'LearningService.launchWebFormat', [], {
        kind: 'person',
        personId: 'per-0002' as PersonActorRef['personId'],
        role: 'student',
        displayName: 'Rahul Verma',
      }),
    );
    expect(problems.some((line) => /invariant #2 .*wrote a completion/.test(line))).toBe(true);
    expect(problems.some((line) => /invariant #3 /.test(line))).toBe(true);
  });

  it('reworded invariant 10: SUB-0077 before Flow E step 1, or one Composite Wall record after it, fails', async () => {
    const world = await afterFlow('E');
    const platform = assemblePlatform({ world });
    expect(worldViolations(platform, 'CONTROL', world, 'after-flow-e')).toEqual([]);
    expect(worldViolations(platform, 'CONTROL', world, 'before-flow-e').join('\n')).toMatch(
      /invariant #10 SUB-0077 exists before Flow E step 1 — after step CONTROL/,
    );
    const experiments = { ...world.records.experiments };
    const merged = Object.values(experiments).find(
      (experiment) => experiment.live.catalogue.name === 'Conduction Through a Composite Wall',
    )!;
    delete (experiments as Record<string, unknown>)[merged.id];
    expect(
      worldViolations(
        platform,
        'CONTROL',
        { ...world, records: { ...world.records, experiments } },
        'after-flow-e',
      ).join('\n'),
    ).toMatch(
      /invariant #10 "Conduction Through a Composite Wall" \(SUB-0077\) is not its own published record/,
    );
  });

  it('reworded invariant 10: "Conduction Through a Composite Wall" as a record before E4 publishes it fails', async () => {
    const published = await afterFlow('E');
    const early = await afterFlow('D');
    const created = Object.values(published.records.experiments).find(
      (experiment) => experiment.live.catalogue.name === 'Conduction Through a Composite Wall',
    )!;
    const world: World = {
      ...early,
      records: {
        ...early.records,
        experiments: { ...early.records.experiments, [created.id]: created },
      },
    };
    const platform = assemblePlatform({ world: early });
    expect(worldViolations(platform, 'CONTROL', world, 'in-flow-e').join('\n')).toMatch(
      /invariant #10 "Conduction Through a Composite Wall" is an experiment record before Flow E publishes it — after step CONTROL/,
    );
  });

  it('invariant 12: a runtime event without sample provenance, or a stand-in completion, fails', async () => {
    const world = await afterFlow('C');
    const platform = assemblePlatform({ world });
    const [first, ...rest] = world.runtimeEvents;
    const unsourced = {
      ...world,
      runtimeEvents: [{ ...first!, origin: 'prototype' as never }, ...rest],
    };
    expect(worldViolations(platform, 'CONTROL', unsourced, 'before-flow-e').join('\n')).toMatch(
      /invariant #12 .*origin prototype/,
    );
    const completion = world.runtimeEvents.find((event) => event.report.kind === 'completion')!;
    const standin = {
      ...world,
      runtimeEvents: [{ ...completion, origin: 'sample-standin' as const }],
    };
    expect(worldViolations(platform, 'CONTROL', standin, 'before-flow-e').join('\n')).toMatch(
      /the WEB stand-in reported completion/,
    );
  });

  it('history: an undeclared write, a rewritten record history and a rev that does not rise all fail', async () => {
    const before = await afterFlow('A');
    const request = before.records.requests['REQ-0042']!;
    const rewritten: World = {
      ...before,
      records: {
        ...before.records,
        requests: {
          ...before.records.requests,
          'REQ-0042': { ...request, history: request.history.slice(1) },
        },
      },
    };
    const problems = historyViolations(
      commitOf(before, rewritten, 'AccessRequestService.approveRequest', []),
    );
    expect(problems.join('\n')).toMatch(
      /changed lists nothing but the commit wrote REQ:REQ-0042 — step CONTROL/,
    );
    expect(problems.join('\n')).toMatch(/REQ:REQ-0042 changed without a new rev/);
    expect(problems.join('\n')).toMatch(/REQ:REQ-0042 lost or rewrote its history/);
  });
});
