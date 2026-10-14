/**
 * The public catalogue's structure reads (Appendix C §3.2; Phase-1 Package 1B): `listAreas`,
 * `getArea` and `getCourse` must tell the same story as `searchCatalogue` — counts, courses and
 * formats derive from published experiments only (B1-02 "Counts come from published experiments";
 * B1-03 "Each area groups the courses that have published experiments"; "Formats in this course:
 * union of the published formats of its experiments"). They read publication only, never access,
 * entitlement, activity or completion (BC3, BC9), and need no sign-in.
 */
import {
  type AreaId,
  type CourseId,
  FORMAT_DISPLAY_ORDER,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

import { check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed } from '../helpers.js';
import type { CatalogueEntry, ProductPorts } from '../../ports/index.js';
import type { CaseContext, ContractCase } from '../run.js';

const STRUCTURE = [
  'CatalogueService.listAreas',
  'CatalogueService.getArea',
  'CatalogueService.getCourse',
  'CatalogueService.searchCatalogue',
] as const;

function unionInDisplayOrder(entries: readonly CatalogueEntry[]): readonly Technology[] {
  const held = new Set(entries.flatMap((entry) => entry.availableIn));
  return FORMAT_DISPLAY_ORDER.filter((format) => held.has(format));
}

/** Every area against the catalogue search: its card, its courses, each course's page. */
async function checkStructure(ports: ProductPorts, context: CaseContext): Promise<void> {
  const all = valueOf(await ports.catalogue.searchCatalogue({ sort: 'default' }), 'PU-04');
  const areas = valueOf(await ports.catalogue.listAreas(), 'PU-02 listAreas');
  check(areas.length > 0, 'the public surface lists at least one area');
  deepEqual(new Set(areas.map((area) => area.id)).size, areas.length, 'each area is listed once');
  let experiments = 0;
  for (const card of areas) {
    const inArea = valueOf(
      await ports.catalogue.searchCatalogue({ areaId: card.id, sort: 'default' }),
      `PU-04 filtered by ${card.name}`,
    ).entries;
    check(inArea.length > 0, `${card.name}: an area without a published experiment is hidden`);
    deepEqual(card.experimentCount, inArea.length, `${card.name}: its experiment count`);
    const courseIds = [...new Set(inArea.map((entry) => entry.courseId))];
    deepEqual(card.courseCount, courseIds.length, `${card.name}: its course count`);
    experiments += inArea.length;

    const page = valueOf(await ports.catalogue.getArea(card.id), `PU-03 ${card.name}`);
    deepEqual(page.area, card, `PU-03 ${card.name}: the same card as the area list`);
    deepEqual(
      page.courses.map((course) => course.id).sort(),
      [...courseIds].sort(),
      `PU-03 ${card.name}: the courses that have published experiments`,
    );
    for (const course of page.courses) {
      const ofCourse = inArea.filter((entry) => entry.courseId === course.id);
      deepEqual(
        course.formatsInCourse,
        unionInDisplayOrder(ofCourse),
        `PU-03 ${course.name}: formats in this course`,
      );
      const coursePage = valueOf(
        await ports.catalogue.getCourse(course.id),
        `PU-05 ${course.name}`,
      );
      deepEqual(coursePage.course, course, `PU-05 ${course.name}: the area page's course card`);
      deepEqual(
        coursePage.area,
        { id: card.id, name: card.name },
        `PU-05 ${course.name}: its area`,
      );
      deepEqual(
        coursePage.experiments,
        ofCourse,
        `PU-05 ${course.name}: its published experiments, as the catalogue lists them`,
      );
    }
  }
  deepEqual(experiments, all.total, 'every published experiment sits in exactly one listed area');
  context.note(`${areas.length} areas, ${all.total} published experiments`);
}

const structure: ContractCase = {
  id: 'catalogue:structure',
  title: 'Areas, area pages and course pages agree with the catalogue (PU-01…PU-05)',
  group: 'catalogue',
  evidence:
    'Appendix C §3.2; B1-01 / B1-02 explorer counts; B1-03 PU-02, PU-03, PU-05 (“Formats in this course: union of the published formats of its experiments”); matrix EXP-01, CRS-09',
  requires: { fixture: { kind: 'spine-start' }, methods: [...STRUCTURE] },
  run: async (context) => {
    await checkStructure(context.publicPorts, context);
    const missingArea = await context.publicPorts.catalogue.getArea(
      unsafeBrand<AreaId>('no-such-area'),
    );
    errorOf(
      missingArea,
      'not-found',
      'PU-03 for an unknown area (B1-03 “We can’t find that area”)',
    );
    const missingCourse = await context.publicPorts.catalogue.getCourse(
      unsafeBrand<CourseId>('no-such-course'),
    );
    errorOf(missingCourse, 'not-found', 'PU-05 for an unknown course');
    // A signed-in person reads the same public surface (EXP-03): the answer never depends on who asks.
    const admin = context.as('Arjun Mehta');
    deepEqual(
      valueOf(await admin.catalogue.listAreas(), 'PU-02 signed in'),
      valueOf(await context.publicPorts.catalogue.listAreas(), 'PU-02 signed out'),
      'the areas read the same for a visitor and a signed-in person (no access or entitlement)',
    );
  },
};

const afterPublication: ContractCase = {
  id: 'catalogue:after-publication',
  title:
    'A publication changes the structure reads for everyone; the two Composite Wall experiments stay two (BC11)',
  group: 'catalogue',
  evidence:
    'Appendix C §3.2 [C] “A new experiment appears only after the Content Manager publishes it”; flows.json E5 (B6-12 f5–6); BC11 / OD-B5-09',
  requires: { fixture: { kind: 'after-flow', flow: 'E' }, methods: [...STRUCTURE] },
  run: async (context) => {
    await checkStructure(context.publicPorts, context);
    const conduction = await experimentNamed(
      context.publicPorts,
      'Conduction Through a Composite Wall',
    );
    const wall = await experimentNamed(context.publicPorts, 'Composite Wall Conduction');
    check(conduction.experimentId !== wall.experimentId, 'two separate records (BC11)');
    const course = valueOf(
      await context.publicPorts.catalogue.getCourse(conduction.courseId),
      'PU-05 of the newly published experiment',
    );
    check(
      course.experiments.some((entry) => entry.experimentId === conduction.experimentId) &&
        course.experiments.some((entry) => entry.experimentId === wall.experimentId),
      'the course lists both Composite Wall records',
    );
  },
};

const featured: ContractCase = {
  id: 'catalogue:featured',
  title: 'The landing’s featured experiments are published catalogue entries (P1-22 interim)',
  group: 'catalogue',
  evidence:
    'B1-01 “Featured experiments · Start with these experiments”; Appendix G P1-22 (provisional: a seeded list); provisional register PC-32',
  requires: { fixture: { kind: 'spine-start' }, methods: ['CatalogueService.searchCatalogue'] },
  run: async (context) => {
    const all = valueOf(
      await context.publicPorts.catalogue.searchCatalogue({ sort: 'default' }),
      'PU-04',
    );
    const shown = valueOf(
      await context.publicPorts.catalogue.searchCatalogue({ featured: true, sort: 'default' }),
      'PU-01 featured',
    );
    deepEqual(shown.total, shown.entries.length, 'the featured total counts its entries');
    for (const entry of shown.entries) {
      const listed = all.entries.find((candidate) => candidate.experimentId === entry.experimentId);
      deepEqual(entry, listed, `${entry.name}: the catalogue's own entry`);
    }
    context.note(`${shown.total} featured of ${all.total}`);
  },
};

const nothingPublished: ContractCase = {
  id: 'catalogue:nothing-published',
  title:
    'An area with nothing published stays hidden with its courses; a course with nothing published opens empty',
  group: 'catalogue',
  evidence:
    'Appendix C §3.14 addArea “The public explorer is unchanged until the area has published experiments [U OD-B7-13]”; B1-01 “Hidden from the landing explorer and from All areas until something is published”; B1-03 PU-05 f6 / f7 (“Course · nothing published yet”); matrix CRS-09',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...STRUCTURE,
      'AcademicStructureService.addArea',
      'AcademicStructureService.addCourse',
    ],
  },
  run: async (context) => {
    const catalogue = context.publicPorts.catalogue;
    const before = valueOf(await catalogue.listAreas(), 'PU-02 before');
    const listed = before[0];
    check(listed !== undefined, 'the public surface lists an area');
    if (!listed) return;
    const admin = context.as('Arjun Mehta').academicStructure;
    const area = valueOf(
      await admin.addArea({ name: 'Civil & Structures', description: null }),
      'SA-14 adds an area with nothing published',
    );
    const hiddenCourse = valueOf(
      await admin.addCourse({ name: 'Structural Analysis', areaId: area.id, description: null }),
      'SA-14 adds a course to it',
    );
    const emptyCourse = valueOf(
      await admin.addCourse({ name: 'Surveying Practice', areaId: listed.id, description: null }),
      `SA-14 adds a course to ${listed.name}`,
    );

    deepEqual(valueOf(await catalogue.listAreas(), 'PU-02 after'), before, 'PU-02 is unchanged');
    errorOf(
      await catalogue.getArea(area.id),
      'not-found',
      'PU-03 of an area with nothing published',
    );
    errorOf(
      await catalogue.getCourse(hiddenCourse.id),
      'not-found',
      'PU-05 of a course in a hidden area (hidden with its area)',
    );
    const page = valueOf(
      await catalogue.getCourse(emptyCourse.id),
      'PU-05 of a course with nothing published (B1-03 f6 / f7)',
    );
    deepEqual(page.experiments, [], 'PU-05: no experiments');
    deepEqual(page.course.formatsInCourse, [], 'PU-05: no formats');
    deepEqual(page.area, { id: listed.id, name: listed.name }, 'PU-05: its area');
    const areaPage = valueOf(await catalogue.getArea(listed.id), `PU-03 ${listed.name}`);
    check(
      !areaPage.courses.some((course) => course.id === emptyCourse.id),
      'PU-03 lists only the courses that have published experiments',
    );
    await checkStructure(context.publicPorts, context);
  },
};

export const CATALOGUE_CASES: readonly ContractCase[] = [
  structure,
  afterPublication,
  featured,
  nothingPublished,
];
