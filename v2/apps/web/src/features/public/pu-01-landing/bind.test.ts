// @vitest-environment node
/**
 * The landing's data binding (owner decision D-14): the design's picks bound to the catalogue
 * reads, the frozen fixture never shipped, a pick that is not published left out.
 */
import type { AreaCard, CatalogueEntry, CourseCard } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { areaPanels, featuredCards, formatCounts, heroChips, LANDING_HREF } from './bind';

const entry = (
  experimentId: string,
  name: string,
  courseId: string,
  courseName: string,
  platformCode: string | null,
  availableIn: CatalogueEntry['availableIn'],
): CatalogueEntry =>
  ({
    experimentId,
    name,
    summary: '',
    courseId,
    courseName,
    platformCode,
    availableIn,
    artworkKey: null,
  }) as unknown as CatalogueEntry;

const SHELL = entry(
  'shell-and-tube-heat-exchanger',
  'Shell-and-Tube Heat Exchanger',
  'thermo',
  'Thermodynamics & Heat Transfer',
  'ME ZG523',
  ['web', 'ar', 'vr'],
);
const CNC = entry(
  'cnc-turning-centre',
  'CNC Turning Centre',
  'manufacturing',
  'Manufacturing Processes',
  'MEL ZG512',
  ['web', 'ar', 'vr', 'mr'],
);
const MOTOR = entry(
  'induction-motor-loading',
  'Induction Motor Loading',
  'machines',
  'Electrical Machines',
  'EEE ZC341',
  ['web', 'vr', 'mr'],
);

const area = (
  id: string,
  name: string,
  artworkKey: string | null,
  experimentCount: number,
  courseCount: number,
) => ({ id, name, artworkKey, experimentCount, courseCount, description: null }) as AreaCard;
const course = (id: string, name: string, platformCode: string | null) =>
  ({ id, name, platformCode, description: null, formatsInCourse: [] }) as unknown as CourseCard;

const STRUCTURE = [
  {
    area: area('mechanical-manufacturing', 'Mechanical & Manufacturing', 'thermal', 5, 2),
    courses: [
      course('thermo', 'Thermodynamics & Heat Transfer', 'ME ZG523'),
      course('manufacturing', 'Manufacturing Processes', 'MEL ZG512'),
    ],
  },
  {
    area: area('electrical-electronics', 'Electrical & Electronics', 'motor', 4, 2),
    courses: [course('machines', 'Electrical Machines', 'EEE ZC341')],
  },
  {
    area: area('somewhere-new', 'Civil Works', null, 1, 1),
    courses: [course('roads', 'Road Design', null)],
  },
];

describe('the hero scenes’ chips', () => {
  it('names the course and the published formats of each scene’s experiment', () => {
    expect(heroChips([SHELL, MOTOR])).toEqual([
      { course: 'ME ZG523 · Thermodynamics & Heat Transfer', formats: ['web', 'ar', 'vr'] },
      { course: 'EEE ZC341 · Electrical Machines', formats: ['web', 'vr', 'mr'] },
      // The distillation column is not published here: its scene shows no chips.
      null,
    ]);
    expect(heroChips(null)).toEqual([null, null, null]);
  });
});

describe('the featured cards', () => {
  it('in the design’s order, with the course, the area badge and the search each opens', () => {
    const cards = featuredCards([SHELL, MOTOR, CNC], STRUCTURE);
    expect(cards.map((card) => card.name)).toEqual([
      'CNC Turning Centre',
      'Shell-and-Tube Heat Exchanger',
      'Induction Motor Loading',
    ]);
    expect(cards[0]).toMatchObject({
      course: 'MEL ZG512 · Manufacturing Processes',
      courseShort: 'MEL ZG512',
      area: 'Mechanical',
      formats: ['web', 'ar', 'vr', 'mr'],
      search: 'CNC',
      descriptor: 'Set up workholding and tool offsets, then cut and inspect a test part.',
    });
    expect(cards[2]!.area).toBe('Electrical');
  });

  it('leaves out an unpublished pick; without the areas the cards have no badge', () => {
    expect(featuredCards([CNC], null)).toHaveLength(1);
    expect(featuredCards([CNC], null)[0]!.area).toBeNull();
    expect(featuredCards([], STRUCTURE)).toEqual([]);
  });
});

describe('the explorer’s panels', () => {
  it('one per area, its counts and courses from the read, its artwork family from its record', () => {
    const panels = areaPanels(STRUCTURE);
    expect(
      panels.map((panel) => [panel.name, panel.family, panel.experiments, panel.courseCount]),
    ).toEqual([
      ['Mechanical & Manufacturing', 'thermal', 5, 2],
      ['Electrical & Electronics', 'motor', 4, 2],
      // No drawn family: the family of its position, as the frozen three areas have.
      ['Civil Works', 'process', 1, 1],
    ]);
    expect(panels[2]!.courses).toEqual([{ code: null, name: 'Road Design' }]);
  });
});

describe('format counts and destinations', () => {
  it('counts each format over the published experiments', () => {
    expect(formatCounts([SHELL, CNC, MOTOR])).toEqual({ web: 3, ar: 2, vr: 3, mr: 2 });
  });

  it('opens the existing routes only (plan §5)', () => {
    expect(LANDING_HREF.search('Induction Motor')).toBe('/experiments?q=Induction%20Motor');
    expect(LANDING_HREF.area('chemical-process')).toBe('/experiments?area=chemical-process');
    expect(LANDING_HREF.format('mr')).toBe('/experiments?format=mr');
    expect([
      LANDING_HREF.home,
      LANDING_HREF.catalogue,
      LANDING_HREF.signIn,
      LANDING_HREF.selection,
    ]).toEqual(['/', '/experiments', '/sign-in', '/selection']);
  });
});
