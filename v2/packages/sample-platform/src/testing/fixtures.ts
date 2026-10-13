/**
 * The fixtures (Appendix F §4.3): named moments of the one walk timeline, plus the later-sample
 * branch and the state-coverage world. Each is a deterministic world value built by running real
 * commands from the spine-start seed; a world is immutable, so a built fixture is cached.
 *
 * Moments on the timeline:
 *  - `after-flow-a`, `after-setup`, `after-flow-b`, `after-flow-c` — the spine flows are sequential,
 *    so "after flow X" is the world when flow X is done and the next has not begun: after A (access
 *    active), after Flow B's first step plus the setup S1–S7, after B (SACC-0310 given), after C
 *    (Rahul's WEB and VR completed and feedback sent, and everything dated before Flow D starts on
 *    27 Oct — the question bank among it);
 *  - `after-flow-d`, `after-flow-e`, `after-flow-f`, `after-flow-device` — the world just after the
 *    flow's last step (D: 15 Nov, when ATT-0450's result is released by its own setting).
 *
 * `laterSample()` branches from after-flow B on 12 Oct (B2-04, B2-05): the group grant SACC-0311
 * (Rahul is a member, so his two grants overlap — OD-B2-01 stays open), SACC-0312 given then
 * withdrawn, SACC-0313 / SACC-0314, and the supplied "Waiting for a licence" values for Arun Kumar
 * and Fatima Begum (no rule may produce them, T-06 / D7). It is a branch: the overlap would make
 * Rahul's own gate policy-open, so the walk and the state-coverage world keep his single grant (S-12).
 *
 * `stateCoverage()` is the whole walk plus the drawn states it does not reach on its own, each with
 * its board frame in a seedNote: GRP-0013 "Lab batch B" (B2-08) and DTR-0019 waiting with the
 * Institute Admin (B3-11). States no coherent drawn record can hold together with the walk are
 * listed in the package README, never invented.
 */
import type {
  ContractFactory,
  ContractFixture,
  ContractSubject,
} from '@xr/contracts/draft/contract-suite';
import { type AuthorisedDevice, type ExperimentId, type IsoInstant, unsafeBrand } from '@xr/domain';

import { reserve } from '../ids/id-source.js';
import { systemCommand } from '../pipeline/runner.js';
import { assemblePlatform, internalsOf } from '../platform/create.js';
import { ist } from '../seed/book.js';
import { EXPERIMENT } from '../seed/catalogue.js';
import { seed } from '../seed/spine-start.js';
import { deviceKey } from '../world/records.js';
import type { World } from '../world/types.js';
import {
  asPerson,
  personIdOf,
  seamsOf,
  snapshot,
  standinsOf,
  visitorPorts,
  worldOf,
} from './harness.js';
import { must, runWalk, WALK_STEPS, type WalkStep } from './walk.js';

export type FixtureName =
  | 'spine-start'
  | 'after-flow-a'
  | 'after-setup'
  | 'after-flow-b'
  | 'after-flow-c'
  | 'after-flow-d'
  | 'after-flow-e'
  | 'after-flow-f'
  | 'after-flow-device'
  | 'later-sample'
  | 'state-coverage';

export const FIXTURE_NAMES: readonly FixtureName[] = [
  'spine-start',
  'after-flow-a',
  'after-setup',
  'after-flow-b',
  'after-flow-c',
  'after-flow-d',
  'after-flow-e',
  'after-flow-f',
  'after-flow-device',
  'later-sample',
  'state-coverage',
];

type Cut = { readonly before: string } | { readonly through: string };

const CUTS: Readonly<
  Record<Exclude<FixtureName, 'spine-start' | 'later-sample' | 'state-coverage'>, Cut>
> = {
  'after-flow-a': { before: 'B1' },
  'after-setup': { before: 'B3' },
  'after-flow-b': { before: 'C1' },
  'after-flow-c': { before: 'D1' },
  'after-flow-d': { through: 'D5' },
  'after-flow-e': { through: 'E4-publish' },
  'after-flow-f': { through: 'F4-release' },
  'after-flow-device': { through: 'Dv3' },
};

function indexOf(stepId: string): number {
  const index = WALK_STEPS.findIndex((step) => step.id === stepId);
  if (index < 0) throw new Error(`No walk step ${stepId}.`);
  return index;
}

/** The walk steps up to a cut, and the sample "today" the fixture opens on. */
export function stepsTo(cut: Cut): {
  readonly steps: readonly WalkStep[];
  readonly at: IsoInstant;
} {
  if ('before' in cut) {
    const index = indexOf(cut.before);
    return { steps: WALK_STEPS.slice(0, index), at: WALK_STEPS[index]!.at };
  }
  const index = indexOf(cut.through);
  return { steps: WALK_STEPS.slice(0, index + 1), at: WALK_STEPS[index]!.at };
}

/** Runs steps from a world on a fresh platform and returns the world they leave, opening on `at`. */
export async function buildWorld(
  base: World,
  steps: readonly WalkStep[],
  options: { readonly seedId: string; readonly at: IsoInstant },
): Promise<World> {
  const platform = assemblePlatform({ world: base });
  await runWalk(platform, steps);
  return { ...worldOf(platform), seedId: options.seedId, anchor: options.at, seededAtReal: null };
}

const CACHE = new Map<FixtureName, Promise<World>>();

function cached(name: FixtureName, build: () => Promise<World>): Promise<World> {
  let world = CACHE.get(name);
  if (!world) {
    world = build();
    CACHE.set(name, world);
  }
  return world;
}

export type FlowName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'Device';

const FLOW_FIXTURE: Readonly<Record<FlowName, keyof typeof CUTS>> = {
  A: 'after-flow-a',
  B: 'after-flow-b',
  C: 'after-flow-c',
  D: 'after-flow-d',
  E: 'after-flow-e',
  F: 'after-flow-f',
  Device: 'after-flow-device',
};

function walkedTo(name: keyof typeof CUTS): Promise<World> {
  return cached(name, () => {
    const { steps, at } = stepsTo(CUTS[name]);
    return buildWorld(seed(), steps, { seedId: name, at });
  });
}

export function afterFlow(flow: FlowName): Promise<World> {
  return walkedTo(FLOW_FIXTURE[flow]);
}

export function afterSetup(): Promise<World> {
  return walkedTo('after-setup');
}

const SHELL = unsafeBrand<ExperimentId>(EXPERIMENT.shellAndTube);

/** 12 Oct 2026 (B2-04 "Later sample · 12 Oct 2026", B2-05 g4w, B2-06 Arun Kumar). */
const LATER_STEPS: readonly WalkStep[] = [
  {
    id: 'L0-waits',
    flow: 'B',
    at: ist('2026-10-12 10:55'),
    evidence:
      'B2-05 g4w / B2-06 — "No licence is available for … on ACC-0107 right now" (supplied, T-06 / D7)',
    run: (walk) => {
      const core = internalsOf(walk.platform).core;
      const outcome = systemCommand(core, 'fixture.licenceWaits', 'sample-fixture', (op) => {
        op.seeded = {
          ...op.seeded,
          licenceWaits: [
            ...op.seeded.licenceWaits,
            ...['Arun Kumar', 'Fatima Begum'].map((name) => ({
              planId: 'ACC-0107',
              studentId: personIdOf(op.world, name),
              experimentId: EXPERIMENT.shellAndTube,
            })),
          ],
        };
        return { value: null, decision: 'supplyLicenceWaits', actor: null };
      });
      if (!outcome.ok) throw new Error(`Later sample waits refused: ${outcome.current}`);
    },
  },
  {
    id: 'L1-group',
    flow: 'B',
    at: ist('2026-10-12 11:00'),
    evidence: 'B2-04 "SACC-0311 · group ME ZG523 — Sem II · 12 Oct 2026" (undrawn time)',
    run: async (walk) => {
      const ia = walk.as('Meera Iyer');
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'IA-03');
      await must(
        ia.studentAccess.giveAccess({
          experimentIds: [SHELL],
          target: { kind: 'group', groupId: unsafeBrand('GRP-0012') },
          expectedPlanRev: plan.plan.rev,
        }),
        'SACC-0311 group grant',
      );
    },
  },
  {
    id: 'L2-nikhil',
    flow: 'B',
    at: ist('2026-10-12 11:10'),
    evidence: 'B2-04 SACC-0312 Nikhil Bose (given 12 Oct; undrawn time)',
    run: async (walk) => {
      const ia = walk.as('Meera Iyer');
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'IA-03');
      await must(
        ia.studentAccess.giveAccess({
          experimentIds: [SHELL],
          target: { kind: 'student', studentId: walk.personId('Nikhil Bose') },
          expectedPlanRev: plan.plan.rev,
        }),
        'SACC-0312 give Nikhil',
      );
    },
  },
  {
    id: 'L3-withdraw',
    flow: 'B',
    at: ist('2026-10-12 11:20'),
    evidence:
      'B2-04 SACC-0312 "Given by mistake — Nikhil is not in ME ZG523 this semester." (withdrawn 12 Oct)',
    run: async (walk) => {
      const ia = walk.as('Meera Iyer');
      const rows = await must(ia.studentAccess.listGrants({ showWithdrawn: false }), 'IA-04');
      const row = rows.find((candidate) => candidate.grant.id === 'SACC-0312')!;
      await must(
        ia.studentAccess.withdrawGrant({
          grantId: row.grant.id,
          reason: 'Given by mistake — Nikhil is not in ME ZG523 this semester.',
          expectedRev: row.grant.rev,
        }),
        'SACC-0312 withdraw',
      );
    },
  },
  {
    id: 'L4-two',
    flow: 'B',
    at: ist('2026-10-12 11:30'),
    evidence:
      'B2-05 g4w — SACC-0313 Lakshmi Prasad Active, SACC-0314 Fatima Begum Waiting for a licence',
    run: async (walk) => {
      const ia = walk.as('Meera Iyer');
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'IA-03');
      await must(
        ia.studentAccess.giveAccess({
          experimentIds: [SHELL],
          target: {
            kind: 'students',
            studentIds: [walk.personId('Lakshmi Prasad'), walk.personId('Fatima Begum')],
          },
          expectedPlanRev: plan.plan.rev,
        }),
        'SACC-0313 / SACC-0314',
      );
    },
  },
];

export function laterSample(): Promise<World> {
  return cached('later-sample', async () =>
    buildWorld(await walkedTo('after-flow-b'), LATER_STEPS, {
      seedId: 'later-sample',
      at: LATER_STEPS.at(-1)!.at,
    }),
  );
}

/** The drawn states the walk does not reach on its own (each cites its board frame). */
const COVERAGE_STEPS: readonly WalkStep[] = [
  {
    id: 'SC-GRP-0013',
    flow: 'setup',
    at: ist('2026-11-15 10:30'),
    evidence: 'B2-08 "GRP-0013 · Lab batch B · 0 members"',
    run: async (walk) => {
      await must(walk.as('Meera Iyer').groups.createGroup({ name: 'Lab batch B' }), 'GRP-0013');
    },
  },
  {
    id: 'SC-imran-device',
    flow: 'Device',
    at: ist('2026-11-15 10:35'),
    evidence:
      'B3-11 DTR-0019 "Imran Shaikh · VR · Godavari Institute of Technology · Not yet" (device supplied; no registry, D20b)',
    run: (walk) => {
      const imran = walk.personId('Imran Shaikh');
      const core = internalsOf(walk.platform).core;
      const outcome = systemCommand(core, 'fixture.authorisedDevice', 'sample-fixture', (op) => {
        const device: AuthorisedDevice = {
          studentId: imran,
          format: 'vr',
          description: 'ME lab VR headset, asset tag GIT-VR-04',
          usedFor: [SHELL],
          since: op.now,
          viaTransferId: null,
        };
        const key = deviceKey(imran, 'vr');
        op.tx.put('devices', key, device);
        op.note(`DTR:${key}`, {
          evidence: 'B3-11 DTR-0019',
          note: 'Authorised device supplied by the fixture; the asset tag is a sample fill',
        });
        return { value: device, decision: 'supplyAuthorisedDevice', actor: null };
      });
      if (!outcome.ok) throw new Error(`Imran's device refused: ${outcome.current}`);
    },
  },
  {
    id: 'SC-DTR-0019',
    flow: 'Device',
    at: ist('2026-11-15 10:40'),
    evidence: 'B3-11 DTR-0019 — with the Institute Admin ("Not yet" forwarded)',
    run: async (walk) => {
      await must(
        walk.as('Imran Shaikh').operations.requestDeviceTransfer({
          newDevice: 'ME lab VR headset, asset tag GIT-VR-08',
          note: null,
        }),
        'DTR-0019',
      );
    },
  },
];

export function stateCoverage(): Promise<World> {
  return cached('state-coverage', async () => {
    const walked = await walkedTo('after-flow-d');
    const base: World = {
      ...walked,
      idSource: reserve(walked.idSource, 'deviceTransfer', ['DTR-0019']),
    };
    return buildWorld(base, COVERAGE_STEPS, {
      seedId: 'state-coverage',
      at: COVERAGE_STEPS.at(-1)!.at,
    });
  });
}

/** Any fixture by name. */
export function fixtureWorld(name: FixtureName): Promise<World> {
  switch (name) {
    case 'spine-start':
      return Promise.resolve(seed());
    case 'later-sample':
      return laterSample();
    case 'state-coverage':
      return stateCoverage();
    default:
      return walkedTo(name);
  }
}

function nameOf(fixture: ContractFixture): FixtureName {
  switch (fixture.kind) {
    case 'spine-start':
    case 'after-setup':
    case 'later-sample':
    case 'state-coverage':
      return fixture.kind;
    case 'after-flow':
      return FLOW_FIXTURE[fixture.flow];
  }
}

/** The adapter the contract suite runs against (`runContractSuite(contractFactory)`). */
export const contractFactory: ContractFactory = async (fixture): Promise<ContractSubject> => {
  const world = await fixtureWorld(nameOf(fixture));
  const platform = assemblePlatform({ world });
  return {
    implements: ['WP-0.11'],
    publicPorts: visitorPorts(platform),
    as: (person) => asPerson(platform, person),
    standins: standinsOf(platform),
    seams: seamsOf(platform),
    snapshot: () => snapshot(platform),
    inspect: {
      runtimeEventOrigins: () => worldOf(platform).runtimeEvents.map((event) => event.origin),
    },
  };
};
