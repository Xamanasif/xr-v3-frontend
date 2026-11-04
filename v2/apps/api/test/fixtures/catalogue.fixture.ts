/**
 * A small catalogue read model for the HTTP tests (no database): two areas, one of them hidden
 * because nothing in it is published; a course with nothing published in a shown area; two
 * published experiments with different formats; a featured list in its own order.
 */
import {
  type AreaId,
  type CourseId,
  type ExperimentId,
  type PlatformCourseCode,
  unsafeBrand,
} from '@xr/domain';

import {
  type CatalogueReadModel,
  CatalogueRepository,
} from '../../src/modules/catalogue/catalogue.repository.js';

export const FIXTURE_IDS = {
  mechanical: unsafeBrand<AreaId>('mechanical'),
  chemical: unsafeBrand<AreaId>('chemical'),
  thermo: unsafeBrand<CourseId>('thermodynamics'),
  casting: unsafeBrand<CourseId>('casting'),
  process: unsafeBrand<CourseId>('process-control'),
  shell: unsafeBrand<ExperimentId>('shell-and-tube'),
  wall: unsafeBrand<ExperimentId>('composite-wall'),
} as const;

const id = FIXTURE_IDS;

export const CATALOGUE_FIXTURE: CatalogueReadModel = {
  areas: [
    {
      id: id.mechanical,
      name: 'Mechanical & Manufacturing',
      description: null,
      artworkKey: 'thermal',
    },
    {
      id: id.chemical,
      name: 'Chemical & Process',
      description: 'Nothing published yet.',
      artworkKey: null,
    },
  ],
  courses: [
    {
      id: id.thermo,
      areaId: id.mechanical,
      name: 'Thermodynamics & Heat Transfer',
      description: null,
      platformCode: unsafeBrand<PlatformCourseCode>('ME ZG523'),
    },
    {
      id: id.casting,
      areaId: id.mechanical,
      name: 'Casting',
      description: null,
      platformCode: null,
    },
    {
      id: id.process,
      areaId: id.chemical,
      name: 'Process Control',
      description: null,
      platformCode: null,
    },
  ],
  experiments: [
    {
      id: id.shell,
      courseId: id.thermo,
      artworkKey: 'thermal-crop',
      live: {
        catalogue: {
          name: 'Shell-and-Tube Heat Exchanger',
          summary: 'Derive effectiveness–NTU.',
          description: 'A two-pass exchanger.',
        },
        formats: [
          { format: 'vr', deviceNeeds: 'Supported VR headset' },
          { format: 'web', deviceNeeds: 'Laptop or desktop with a current web browser' },
        ],
        preview: { label: 'Watch the walkthrough', link: 'https://preview.example/shell' },
      },
      learningOutcomes: ['Determine LMTD', 'Compare arrangements'],
    },
    {
      id: id.wall,
      courseId: id.thermo,
      artworkKey: null,
      live: {
        catalogue: {
          name: 'Composite Wall Conduction',
          summary: 'Layered conduction.',
          description: 'Three layers.',
        },
        formats: [{ format: 'ar', deviceNeeds: 'Supported phone or tablet' }],
        preview: null,
      },
      learningOutcomes: [],
    },
  ],
  featured: [id.wall, id.shell],
};

export class InMemoryCatalogueRepository extends CatalogueRepository {
  constructor(private readonly answer: () => Promise<CatalogueReadModel>) {
    super();
  }

  static of(model: CatalogueReadModel = CATALOGUE_FIXTURE): InMemoryCatalogueRepository {
    return new InMemoryCatalogueRepository(() => Promise.resolve(model));
  }

  load(): Promise<CatalogueReadModel> {
    return this.answer();
  }
}
