/**
 * Academic structure, course codes and the public catalogue (Appendix C M06–M09; matrix CRS-*,
 * CC-*, EXP-*). No Programme or Module level (BC2); the two Composite Wall experiments are two
 * records (BC11); formats read WEB · AR · VR · MR; the catalogue reads publication only.
 */
import { describe, expect, it } from 'vitest';

import {
  area,
  counterIds,
  course,
  experiment,
  expectOk,
  ids,
  institution,
  refusalOf,
  T,
  who,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import type { PlatformCourseCode } from './model.js';
import { publishedFormats } from './model.js';
import {
  addArea,
  addCourse,
  institutionCodeStatus,
  moveCourse,
  platformCodeKey,
  publicAreas,
  publicCatalogue,
  renameStructure,
  savePlatformCourseCodes,
  searchPublicCatalogue,
  setInstitutionCourseCode,
} from './decide.js';

const sa = () => ({ actor: who.superAdmin, now: T.oct14, ids: counterIds() });

describe('areas and courses (CRS-01 … CRS-05): Super Admin structure, no Module layer', () => {
  it('names are unique, compared trimmed and case-insensitively; a course starts with no platform code', () => {
    expect(
      refusalOf(
        addArea({
          ...sa(),
          areas: [area()],
          name: ' mechanical & manufacturing ',
          description: null,
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'name', rule: 'taken' }] });
    const made = expectOk(
      addCourse({
        ...sa(),
        courses: [course()],
        areas: [area()],
        areaId: ids.area,
        name: 'Heat and Mass Transfer Lab',
        description: null,
      }),
    );
    expect(made).toMatchObject({ areaId: ids.area, platformCode: null });
    expect(Object.keys(made)).not.toEqual(
      expect.arrayContaining(['programme', 'moduleId', 'module']),
    );
    expect(
      refusalOf(
        renameStructure({
          ...sa(),
          record: course(),
          siblings: [course()],
          name: 'Thermodynamics & Heat Transfer',
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'name', rule: 'unchanged' }] });
  });

  it('a course moves only while nobody is filed against it (CRS-04 provisional)', () => {
    const areas = [area(), area({ id: ids.area2, name: 'Chemical & Process' })];
    expect(
      refusalOf(
        moveCourse({
          ...sa(),
          course: course(),
          areas,
          targetAreaId: ids.area2,
          filed: { students: 3, faculty: 0 },
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'course-has-people-filed' });
    expect(
      expectOk(
        moveCourse({
          ...sa(),
          course: course(),
          areas,
          targetAreaId: ids.area2,
          filed: { students: 0, faculty: 0 },
        }),
      ).areaId,
    ).toBe(ids.area2);
  });
});

describe('course codes (CC-01 … CC-07)', () => {
  const cm = { actor: who.contentManager, now: T.oct14, ids: counterIds() };
  it('platform codes: unique trimmed upper-case; internal spaces are not decided (D-25)', () => {
    expect(platformCodeKey(' me zg523 ')).toBe('ME ZG523');
    expect(platformCodeKey('MEZG523')).not.toBe(platformCodeKey('ME ZG523'));
    const two = [
      course(),
      course({ id: ids.course2, name: 'Power Electronics', platformCode: null }),
    ];
    expect(
      refusalOf(
        savePlatformCourseCodes({
          ...cm,
          courses: two,
          changes: [{ courseId: ids.course2, code: 'me zg523' }],
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: ids.course2, rule: 'code-taken' }] });
    const saved = expectOk(
      savePlatformCourseCodes({
        ...cm,
        courses: two,
        changes: [
          { courseId: ids.course2, code: ' EEE ZC341 ' },
          { courseId: ids.course, code: '' },
        ],
      }),
    );
    expect(saved.map((entry) => entry.platformCode)).toEqual([
      null,
      unsafeBrand<PlatformCourseCode>('EEE ZC341'),
    ]);
  });

  it('the institution’s own code: a semester needs a code; read-only while paused', () => {
    const input = {
      existing: null,
      institution: institution(),
      courseId: ids.course,
      coursesInAccess: [ids.course],
      code: ' MEC-523 ',
      semester: 'Sem II',
      actor: who.instituteAdmin,
      now: T.oct14,
    };
    const set = expectOk(setInstitutionCourseCode(input));
    expect(set).toMatchObject({ code: 'MEC-523', semester: 'Sem II' });
    expect(institutionCodeStatus(set)).toBe('added');
    expect(institutionCodeStatus(null)).toBe('missing');
    expect(refusalOf(setInstitutionCourseCode({ ...input, code: null }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'code', rule: 'semester-needs-code' }],
    });
    expect(
      refusalOf(
        setInstitutionCourseCode({
          ...input,
          institution: institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } }),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
    expect(refusalOf(setInstitutionCourseCode({ ...input, coursesInAccess: [] }))).toEqual({
      kind: 'not-permitted',
      why: 'out-of-scope',
    });
  });
});

describe('the public catalogue (EXP-01, EXP-02, EXP-11; CRS-09)', () => {
  const named = (id: typeof ids.wallA, name: string, formats: Parameters<typeof experiment>[1]) => {
    const live = experiment({}, formats).live;
    return experiment({
      id,
      live: { ...live, catalogue: { name, summary: name, description: name } },
    });
  };
  const wallA = named(ids.wallA, 'Composite Wall Conduction', ['vr', 'web']);
  const wallB = named(ids.wallB, 'Conduction Through a Composite Wall', ['mr', 'ar', 'web']);

  it('the two Composite Wall experiments stay two records with two slugs', () => {
    const entries = publicCatalogue([wallA, wallB], [course()]);
    expect(entries.map((entry) => entry.experimentId)).toEqual([ids.wallA, ids.wallB]);
    expect(new Set(entries.map((entry) => entry.experimentId)).size).toBe(2);
  });

  it('“Available in” lists published formats in WEB · AR · VR · MR order — never an entitlement', () => {
    expect(publishedFormats(wallA)).toEqual(['web', 'vr']);
    expect(publicCatalogue([wallB], [course()])[0]!.formats).toEqual(['web', 'ar', 'mr']);
    expect(Object.keys(publicCatalogue([wallA], [course()])[0]!)).toEqual([
      'experimentId',
      'courseId',
      'areaId',
      'name',
      'summary',
      'formats',
      'platformCode',
    ]);
  });

  it('areas appear only with a published experiment', () => {
    const entries = publicCatalogue([wallA], [course()]);
    expect(
      publicAreas([area(), area({ id: ids.area2, name: 'Chemical & Process' })], entries).map(
        (entry) => entry.id,
      ),
    ).toEqual([ids.area]);
    expect(publicCatalogue([wallA], [])).toEqual([]);
  });
});

describe('the catalogue search (PU-01 featured, PU-04 filters and orders; B1-04)', () => {
  const entryOf = (
    id: typeof ids.wallA,
    name: string,
    formats: Parameters<typeof experiment>[1],
    courseId = ids.course,
  ) => {
    const live = experiment({}, formats).live;
    return experiment({
      id,
      courseId,
      live: { ...live, catalogue: { name, summary: `About ${name}`, description: name } },
    });
  };
  const shell = entryOf(ids.shell, 'Shell-and-Tube Heat Exchanger', ['web', 'vr']);
  const wallA = entryOf(ids.wallA, 'Composite Wall Conduction', ['vr', 'web']);
  const wallB = entryOf(ids.wallB, 'Conduction Through a Composite Wall', ['ar'], ids.course2);
  const courses = [
    course(),
    course({ id: ids.course2, areaId: ids.area2, name: 'Circuits', platformCode: null }),
  ];
  const catalogue = publicCatalogue([shell, wallA, wallB], courses);
  const facts = {
    courseName: (id: string) => courses.find((entry) => entry.id === id)?.name ?? null,
    featured: [ids.wallB, ids.shell],
  };
  const idsOf = (search: Parameters<typeof searchPublicCatalogue>[1]) =>
    searchPublicCatalogue(catalogue, search, facts).map((entry) => entry.experimentId);

  it('default keeps the catalogue order; nothing is filtered without a filter', () => {
    expect(idsOf({ sort: 'default' })).toEqual([ids.shell, ids.wallA, ids.wallB]);
  });

  it('featured keeps the seeded list only, in its seeded order under default', () => {
    expect(idsOf({ featured: true, sort: 'default' })).toEqual([ids.wallB, ids.shell]);
    expect(idsOf({ featured: true, sort: 'title-a-z' })).toEqual([ids.wallB, ids.shell]);
  });

  it('filters by area and by published format', () => {
    expect(idsOf({ areaId: ids.area2, sort: 'default' })).toEqual([ids.wallB]);
    expect(idsOf({ format: 'vr', sort: 'default' })).toEqual([ids.shell, ids.wallA]);
    expect(idsOf({ format: 'mr', sort: 'default' })).toEqual([]);
  });

  it('text matches name, summary, platform code and course name — trimmed, any case', () => {
    expect(idsOf({ text: '  composite ', sort: 'default' })).toEqual([ids.wallA, ids.wallB]);
    expect(idsOf({ text: 'about shell', sort: 'default' })).toEqual([ids.shell]);
    expect(idsOf({ text: 'me zg523', sort: 'default' })).toEqual([ids.shell, ids.wallA]);
    expect(idsOf({ text: 'CIRCUITS', sort: 'default' })).toEqual([ids.wallB]);
    expect(idsOf({ text: '   ', sort: 'default' })).toEqual([ids.shell, ids.wallA, ids.wallB]);
  });

  it('title A–Z sorts by name; course code sorts by code (blank last), then by name', () => {
    expect(idsOf({ sort: 'title-a-z' })).toEqual([ids.wallA, ids.wallB, ids.shell]);
    expect(idsOf({ sort: 'course-code' })).toEqual([ids.wallA, ids.shell, ids.wallB]);
  });

  it('never reorders or changes the catalogue it is given', () => {
    const before = catalogue.map((entry) => entry.experimentId);
    searchPublicCatalogue(catalogue, { sort: 'title-a-z' }, facts);
    expect(catalogue.map((entry) => entry.experimentId)).toEqual(before);
  });
});
