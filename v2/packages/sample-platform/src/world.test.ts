/**
 * The spine-start seed and the scripted walk (WP-0.11 acceptance 2, 3, 5, 6): deterministic,
 * nothing Flows A–F create before they create it, every board reference the walk creates, both
 * Composite Wall records kept apart, sample provenance on every runtime event.
 */
import { RUNTIME_SOURCES, isStuck } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { seed, SPINE_ANCHOR } from './index.js';
import {
  afterFlow,
  afterSetup,
  buildWorld,
  ist,
  laterSample,
  pendingReservations,
  stateCoverage,
  WALK_STEPS,
} from './testing/index.js';
import { values } from './world/records.js';
import type { World } from './world/types.js';

const json = (world: World) => JSON.stringify(world);

describe('seed(anchor) — the spine-start world', () => {
  it('is deterministic: the same anchor gives a deep-equal world', () => {
    expect(json(seed())).toBe(json(seed()));
    expect(json(seed(SPINE_ANCHOR))).toBe(json(seed()));
    expect(seed().anchor).toBe(ist('2026-10-02 10:00'));
  });

  it('holds nothing Flows A–F create (no Godavari, no REQ-0042, no SUB-0077, no UPD-0005)', () => {
    const records = seed().records;
    expect(records.institutions['godavari']).toBeUndefined();
    expect(values(records.institutions).map((entry) => entry.name)).not.toContain(
      'Godavari Institute of Technology',
    );
    for (const id of ['REQ-0042', 'REQ-0058']) expect(records.requests[id]).toBeUndefined();
    expect(records.plans['ACC-0107']).toBeUndefined();
    expect(records.submissions['SUB-0077']).toBeUndefined();
    expect(records.updates['UPD-0005']).toBeUndefined();
    expect(records.reports['SUP-0213']).toBeUndefined();
    expect(records.experiments['conduction-through-a-composite-wall']).toBeUndefined();
    for (const table of [
      'people',
      'groups',
      'mappings',
      'courseCodes',
      'grants',
      'waits',
      'assessments',
      'attempts',
      'questions',
      'transfers',
      'devices',
      'activities',
      'completions',
      'feedback',
      'resourcesOpened',
    ] as const) {
      expect(Object.keys(records[table]), table).toEqual([]);
    }
  });

  it('holds the background world: the B7 institutions, REQ-0038 / REQ-0040 under review, Composite Wall Conduction', () => {
    const records = seed().records;
    expect(Object.keys(records.institutions).sort()).toEqual(
      ['bitshyd', 'deccan', 'konark', 'malnad', 'sahyadri', 'vizag'].sort(),
    );
    expect(records.requests['REQ-0038']?.status).toBe('under-review');
    expect(records.requests['REQ-0040']?.status).toBe('under-review');
    expect(records.experiments['composite-wall-conduction']?.live.catalogue.name).toBe(
      'Composite Wall Conduction',
    );
    expect(Object.keys(records.updates).sort()).toEqual(
      ['UPD-0001', 'UPD-0002', 'UPD-0003', 'UPD-0004', 'UPD-0006'].sort(),
    );
    const stuck = records.submissions['SUB-0085']!;
    expect(isStuck(stuck, values(records.holders))).toBe(true);
  });

  it('reserves the board references the walk creates, in walk order (X-14)', () => {
    const pending = pendingReservations(seed().idSource);
    for (const id of [
      'REQ-0042',
      'REQ-0058',
      'ACC-0107',
      'SACC-0310',
      'ASMT-0009',
      'ATT-0450',
      'DTR-0018',
      'SUB-0077',
      'UPD-0005',
      'SUP-0213',
    ]) {
      expect(pending, id).toContain(id);
    }
  });
});

describe('the scripted walk', () => {
  it('runs in board-date order', () => {
    const times = WALK_STEPS.map((step) => step.at);
    expect(times).toEqual([...times].sort());
  });

  it('is deterministic: two runs from the seed give deep-equal worlds', async () => {
    const at = WALK_STEPS.at(-1)!.at;
    const first = await buildWorld(seed(), WALK_STEPS, { seedId: 'walk', at });
    const second = await buildWorld(seed(), WALK_STEPS, { seedId: 'walk', at });
    expect(json(first)).toBe(json(second));
  }, 60_000);

  it('creates exactly the board references the flows trace (acceptance 2)', async () => {
    const records = (await afterFlow('D')).records;
    expect(records.requests['REQ-0042']?.status).toBe('access-active');
    expect(records.requests['REQ-0042']?.activatedPlanId).toBe('ACC-0107');
    expect(records.requests['REQ-0058']?.type).toBe('additional-licences');
    expect(records.plans['ACC-0107']?.institutionId).toBe('godavari');
    expect(values(records.grants).map((grant) => `${grant.id}:${grant.state}`)).toEqual([
      'SACC-0310:active',
    ]);
    expect(records.assessments['ASMT-0009']?.name).toBe('Heat Exchanger — post-lab');
    const attempt = records.attempts['ATT-0450']!;
    expect(attempt.marking.confirmed).not.toBeNull();
    expect(
      attempt.marking.automatic.reduce((sum, mark) => sum + mark.awarded, 0) +
        attempt.marking.written.reduce((sum, mark) => sum + (mark.mark ?? 0), 0),
    ).toBe(11);
    expect(records.transfers['DTR-0018']?.state).toBe('approved');
    expect(records.submissions['SUB-0077']?.status.state).toBe('published');
    expect(records.submissions['SUB-0077']?.revision).toBe(2);
    expect(records.updates['UPD-0005']?.state).toBe('released');
    expect(records.experiments['distillation-column']?.live.label).toBe('1.3');
    expect(records.reports['SUP-0213']?.state).toBe('open');
  });

  it('keeps the two Composite Wall records separate after Flow E and in state coverage (BC11)', async () => {
    for (const world of [await afterFlow('E'), await stateCoverage()]) {
      const names = values(world.records.experiments)
        .filter((experiment) => experiment.live.catalogue.name.includes('Composite Wall'))
        .map((experiment) => `${experiment.id}:${experiment.live.catalogue.name}`)
        .sort();
      expect(names).toEqual([
        'composite-wall-conduction:Composite Wall Conduction',
        'conduction-through-a-composite-wall:Conduction Through a Composite Wall',
      ]);
    }
  });

  it('records sample provenance on every runtime event; the production vocabulary is unchanged (acceptance 5)', async () => {
    const world = await afterFlow('C');
    expect(world.runtimeEvents.length).toBeGreaterThan(0);
    for (const event of world.runtimeEvents) {
      expect(['sample-fixture', 'sample-standin']).toContain(event.origin);
    }
    expect(RUNTIME_SOURCES.some((source) => /stand-?in|demo|prototype|sample/i.test(source))).toBe(
      false,
    );
  });

  it('never completes a format from a launch, a session or time — only the completion report (T-12)', async () => {
    const world = await afterFlow('C');
    const completionEvents = world.runtimeEvents.filter(
      (event) => event.report.kind === 'completion',
    );
    expect(Object.keys(world.records.completions)).toHaveLength(completionEvents.length);
  });
});

describe('the fixtures', () => {
  it('after Flow A: access active on ACC-0107, no Institute Admin yet', async () => {
    const records = (await afterFlow('A')).records;
    expect(records.requests['REQ-0042']?.status).toBe('access-active');
    expect(records.institutions['godavari']?.instituteAdmin).toBeNull();
    expect(Object.keys(records.people)).toEqual([]);
  });

  it('after setup: Meera Iyer assigned, twelve students and three Faculty, no grant', async () => {
    const records = (await afterSetup()).records;
    expect(records.institutions['godavari']?.instituteAdmin?.name).toBe('Meera Iyer');
    const people = values(records.people);
    expect(people.filter((person) => person.kind === 'student')).toHaveLength(12);
    expect(people.filter((person) => person.kind === 'faculty')).toHaveLength(3);
    expect(people.find((person) => person.fullName === 'Prof. Ravi Shankar')?.accountStatus).toBe(
      'inactive',
    );
    expect(people.find((person) => person.fullName === 'Sneha Reddy')?.accountStatus).toBe(
      'inactive',
    );
    expect(Object.keys(records.grants)).toEqual([]);
    expect(Object.keys(records.mappings)).toEqual(['FMAP-0021']);
    expect(Object.keys(records.groups)).toEqual(['GRP-0012']);
    expect(Object.keys(records.devices)).toHaveLength(1);
  });

  it('after Flow B: SACC-0310 given, no runtime activity yet', async () => {
    const records = (await afterFlow('B')).records;
    expect(records.grants['SACC-0310']?.state).toBe('active');
    expect(Object.keys(records.activities)).toEqual([]);
    expect(Object.keys(records.transfers)).toEqual([]);
  });

  it('after Flow C: WEB and VR completed with feedback, the bank built, no assessment yet', async () => {
    const records = (await afterFlow('C')).records;
    expect(Object.keys(records.completions)).toHaveLength(2);
    expect(Object.keys(records.feedback)).toHaveLength(2);
    expect(Object.keys(records.questions)).toEqual([
      'Q-0101',
      'Q-0102',
      'Q-0103',
      'Q-0104',
      'Q-0105',
      'Q-0106',
    ]);
    expect(Object.keys(records.assessments)).toEqual([]);
  });

  it('later sample: the group grant, the withdrawn grant and the supplied licence waits (12 Oct)', async () => {
    const records = (await laterSample()).records;
    expect(values(records.grants).map((grant) => `${grant.id}:${grant.state}`)).toEqual([
      'SACC-0310:active',
      'SACC-0311:active',
      'SACC-0312:withdrawn',
      'SACC-0313:active',
      'SACC-0314:active',
    ]);
    const waiting = values(records.waits).map((wait) => records.people[wait.studentId]?.fullName);
    expect(waiting.sort()).toEqual(['Arun Kumar', 'Fatima Begum']);
  });

  it('state coverage: the whole walk plus GRP-0013 and DTR-0019 waiting with the Institute Admin', async () => {
    const world = await stateCoverage();
    expect(world.records.groups['GRP-0013']?.name).toBe('Lab batch B');
    expect(world.records.transfers['DTR-0019']?.state).toBe('with-institute-admin');
    expect(world.records.submissions['SUB-0085']).toBeDefined();
    for (const note of Object.values(world.seedNotes))
      expect(note.evidence.length).toBeGreaterThan(2);
  });
});
