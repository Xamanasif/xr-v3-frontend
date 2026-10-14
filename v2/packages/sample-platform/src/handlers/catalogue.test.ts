/**
 * The public structure reads Phase-1 Package 1B builds (`listAreas`, `getArea`, `getCourse`) and
 * the catalogue facts the Public boards draw, beyond the adapter-independent contract cases
 * (`catalogue:*`): the spine-start world's three areas and their counts (B1-01 "areas 5 / 4 / 3"),
 * the course added with no code and no experiment (B1-03 "Course without a platform code",
 * "Course · nothing published yet"), an area with nothing published (hidden, CRS-09 / OD-B7-13),
 * the seeded featured list (P1-22), the artwork keys (PC-31) and B1-04's course-code order.
 */
import {
  type AreaId,
  type Course,
  type CourseId,
  type EngineeringArea,
  type ExperimentId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed } from '../index.js';
import { afterFlow, asPerson, visitorPorts, worldOf } from '../testing/index.js';
import type { World } from '../world/types.js';

function visitor(world: World = seed()) {
  const platform = createSamplePlatform({ world });
  return { platform, ports: visitorPorts(platform) };
}

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

describe('listAreas (PU-01 explorer, PU-02)', () => {
  it('lists the three areas in Academic-structure order, counted from published experiments', async () => {
    const { platform, ports } = visitor();
    const before = worldOf(platform).worldVersion;
    const areas = ok(await ports.catalogue.listAreas());
    expect(areas).toEqual([
      {
        id: 'mechanical-manufacturing',
        name: 'Mechanical & Manufacturing',
        description: 'Heat transfer, thermodynamics and manufacturing processes.',
        artworkKey: 'thermal',
        // Fluid Mechanics has no published experiment, so it is not counted (B1-01 "2 courses").
        courseCount: 2,
        experimentCount: 5,
      },
      {
        id: 'electrical-electronics',
        name: 'Electrical & Electronics',
        description: 'Electrical machines, transformers and power electronics.',
        artworkKey: 'motor',
        courseCount: 2,
        experimentCount: 4,
      },
      {
        id: 'chemical-process',
        name: 'Chemical & Process',
        description: 'Distillation, process control and flow measurement.',
        artworkKey: 'process',
        courseCount: 1,
        experimentCount: 3,
      },
    ]);
    expect(worldOf(platform).worldVersion).toBe(before);
  });

  it('hides an area with no published experiment, from the list and as a page, with its courses (CRS-09; OD-B7-13 open)', async () => {
    const base = seed();
    const empty: EngineeringArea = {
      ...base.records.areas['chemical-process']!,
      id: unsafeBrand('civil-structures'),
      name: 'Civil & Structures',
      description: null,
      artworkKey: null,
    };
    const course: Course = {
      ...base.records.courses['fluid-mechanics']!,
      id: unsafeBrand('structural-analysis'),
      name: 'Structural Analysis',
      areaId: empty.id,
    };
    const world: World = {
      ...base,
      records: {
        ...base.records,
        areas: { ...base.records.areas, [empty.id]: empty },
        courses: { ...base.records.courses, [course.id]: course },
      },
    };
    const { ports } = visitor(world);
    const areas = ok(await ports.catalogue.listAreas());
    expect(areas.map((area) => area.id)).not.toContain('civil-structures');
    const page = await ports.catalogue.getArea(unsafeBrand<AreaId>('civil-structures'));
    expect(page).toMatchObject({ ok: false, error: { kind: 'not-found' } });
    // Its course would lead back to an area that is not found: hidden with it.
    const coursePage = await ports.catalogue.getCourse(
      unsafeBrand<CourseId>('structural-analysis'),
    );
    expect(coursePage).toMatchObject({ ok: false, error: { kind: 'not-found' } });
  });

  it('counts a newly published experiment for everyone once the Content Manager publishes it (Flow E)', async () => {
    const { ports } = visitor(await afterFlow('E'));
    const mechanical = ok(await ports.catalogue.listAreas()).find(
      (area) => area.id === 'mechanical-manufacturing',
    );
    expect(mechanical).toMatchObject({ courseCount: 2, experimentCount: 6 });
  });
});

describe('getArea (PU-03)', () => {
  it('names the courses with published experiments, each with its formats', async () => {
    const { ports } = visitor();
    const page = ok(await ports.catalogue.getArea(unsafeBrand<AreaId>('mechanical-manufacturing')));
    expect(page.courses).toEqual([
      {
        id: 'thermodynamics-heat-transfer',
        name: 'Thermodynamics & Heat Transfer',
        platformCode: 'ME ZG523',
        description:
          'Laboratory experiments covering conduction, convection and exchanger performance. Learners take their own instrument readings under realistic operating conditions.',
        formatsInCourse: ['web', 'ar', 'vr'],
      },
      {
        id: 'manufacturing-processes',
        name: 'Manufacturing Processes',
        platformCode: 'MEL ZG512',
        description:
          'Machining and casting experiments that relate process settings to the parts they produce.',
        formatsInCourse: ['web', 'ar', 'vr', 'mr'],
      },
    ]);
  });

  it('answers not-found for an unknown area', async () => {
    const { ports } = visitor();
    for (const id of ['', 'no-such-area', 'constructor']) {
      expect(await ports.catalogue.getArea(unsafeBrand<AreaId>(id))).toMatchObject({
        ok: false,
      });
    }
    expect(await ports.catalogue.getArea(unsafeBrand<AreaId>('no-such-area'))).toMatchObject({
      ok: false,
      error: { kind: 'not-found' },
    });
  });
});

describe('getCourse (PU-05)', () => {
  it('lists the course’s published experiments with their area, in the catalogue’s order', async () => {
    const { ports } = visitor();
    const page = ok(
      await ports.catalogue.getCourse(unsafeBrand<CourseId>('thermodynamics-heat-transfer')),
    );
    expect(page.area).toEqual({
      id: 'mechanical-manufacturing',
      name: 'Mechanical & Manufacturing',
    });
    expect(
      page.experiments.map((entry) => [entry.name, entry.availableIn, entry.artworkKey]),
    ).toEqual([
      ['Shell-and-Tube Heat Exchanger', ['web', 'ar', 'vr'], 'thermal-crop'],
      ['Fin-Tube Bundle', ['web', 'vr'], 'bundle'],
      ['Composite Wall Conduction', ['web', 'ar'], 'materials'],
    ]);
  });

  it('opens a course that exists but has nothing published, with no platform code (B1-03 f6, f7)', async () => {
    const { ports } = visitor();
    const page = ok(await ports.catalogue.getCourse(unsafeBrand<CourseId>('fluid-mechanics')));
    expect(page.course).toMatchObject({
      name: 'Fluid Mechanics',
      platformCode: null,
      formatsInCourse: [],
    });
    expect(page.experiments).toEqual([]);
  });

  it('answers not-found for an unknown course and reads the same for a signed-in person', async () => {
    const { platform, ports } = visitor();
    expect(await ports.catalogue.getCourse(unsafeBrand<CourseId>('no-such-course'))).toMatchObject({
      ok: false,
      error: { kind: 'not-found' },
    });
    const admin = asPerson(platform, 'Arjun Mehta');
    const id = unsafeBrand<CourseId>('electrical-machines');
    expect(await admin.catalogue.getCourse(id)).toEqual(await ports.catalogue.getCourse(id));
  });
});

describe('searchCatalogue (PU-01 featured, PU-04)', () => {
  it('keeps the seeded featured experiments in their drawn order (P1-22 interim; PC-32)', async () => {
    const { ports } = visitor();
    const featured = ok(await ports.catalogue.searchCatalogue({ featured: true, sort: 'default' }));
    expect(featured.entries.map((entry) => entry.name)).toEqual([
      'CNC Turning Centre',
      'Shell-and-Tube Heat Exchanger',
      'Induction Motor Loading',
      'Distillation Column',
    ]);
    expect(featured.total).toBe(4);
    // B1-01's drawn lead rests on this list: "…including one experiment available in all four
    // formats" (copy/public.ts LANDING.featured.lead; P1-22 decides the list).
    expect(
      featured.entries.filter((entry) => entry.availableIn.length === 4).map((entry) => entry.name),
    ).toEqual(['CNC Turning Centre']);
  });

  it('carries every catalogue row’s concept artwork (B1-04 `art`; PC-31)', async () => {
    const { ports } = visitor();
    const all = ok(await ports.catalogue.searchCatalogue({ sort: 'default' }));
    expect(all.entries.map((entry) => entry.artworkKey)).toEqual([
      'thermal-crop',
      'bundle',
      'materials',
      'machining',
      'casting',
      'motor-crop',
      'syncgen',
      'coil',
      'switching',
      'process-crop',
      'drum',
      'orifice',
    ]);
  });

  it('orders by course code, then by title within a course (B1-04’s live sort)', async () => {
    const { ports } = visitor();
    const byCode = ok(await ports.catalogue.searchCatalogue({ sort: 'course-code' }));
    expect(byCode.entries.map((entry) => `${entry.platformCode} ${entry.name}`)).toEqual([
      'CHE ZG513 Boiler Drum Level',
      'CHE ZG513 Distillation Column',
      'CHE ZG513 Orifice Plate Metering',
      'EEE ZC341 Induction Motor Loading',
      'EEE ZC341 Synchronous Generator',
      'EEE ZC341 Transformer Tests',
      'EEE ZG512 Buck Converter Ripple',
      'ME ZG523 Composite Wall Conduction',
      'ME ZG523 Fin-Tube Bundle',
      'ME ZG523 Shell-and-Tube Heat Exchanger',
      'MEL ZG512 CNC Turning Centre',
      'MEL ZG512 Investment Casting',
    ]);
  });

  it('gives the experiment page its hero artwork and never an access or entitlement field', async () => {
    const { ports } = visitor();
    const page = ok(
      await ports.catalogue.getExperiment(
        unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger'),
      ),
    );
    expect(page.artworkKey).toBe('thermal-crop');
    expect(Object.keys(page).sort()).toEqual([
      'areaName',
      'artworkKey',
      'availableIn',
      'courseId',
      'courseName',
      'description',
      'experimentId',
      'formats',
      'learningOutcomes',
      'name',
      'platformCode',
      'preview',
      'summary',
      'versionLabel',
    ]);
  });
});
