/**
 * IA-15's view helpers on what the sample world answers after setup (three faculty, FMAP-0021 for
 * Dr S. Ranganathan, ME ZG523 in content access), and on states the walk does not reach — a removed
 * mapping, a course without a code, a mapping list behind the directory — derived from those
 * answers as the service would give them.
 */
import type { FacultyCourseMapping, FieldError } from '@xr/contracts/draft';
import { asPersonId, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { composePlatform } from '@/platform/composition';

import {
  type ContentAccessCourse,
  courseChoices,
  facultyChoices,
  facultyCourseRows,
  firstAssignError,
  preselectedFaculty,
  searchRows,
} from './faculty-courses-view';

async function afterSetup() {
  const { sample } = composePlatform({
    dataSource: 'sample',
    world: await fixtureWorld('after-setup'),
  });
  const meera = asPersonId(sample, 'per-0001');
  const [directory, mappings, courses] = await Promise.all([
    meera.people.listFaculty(),
    meera.facultyCourses.list(),
    meera.institutionCourseCodes.list(),
  ]);
  if (!directory.ok || !mappings.ok || !courses.ok) throw new Error('after-setup');
  return { directory: directory.value, mappings: mappings.value, courses: courses.value };
}

function fieldError(field: string, message: string | null): FieldError {
  return {
    field,
    key: field === 'facultyId' ? 'IA-15.facultyId.active-only' : 'IA-15.courseId.already-teaches',
    message,
    params: {},
  };
}

describe('facultyCourseRows', () => {
  it('each faculty member in list order, with the course code and the current mapping', async () => {
    const { directory, mappings } = await afterSetup();
    const rows = facultyCourseRows(directory, mappings);
    expect(rows.map((row) => [row.fullName, row.email, row.active])).toEqual([
      ['Dr S. Ranganathan', 's.ranganathan@godavari.edu.in', true],
      ['Dr Anita Desai', 'anita.desai@godavari.edu.in', true],
      ['Prof. Ravi Shankar', 'ravi.shankar@godavari.edu.in', false],
    ]);
    expect(rows[0]!.courses).toEqual([
      {
        courseId: 'thermodynamics-heat-transfer',
        code: 'ME ZG523',
        mapping: { id: 'FMAP-0021', rev: mappings[0]!.rev },
      },
    ]);
    expect(rows[1]!.courses).toEqual([]);
  });

  it('a removed mapping is never the one "Remove…" removes; a list behind the directory offers none', async () => {
    const { directory, mappings } = await afterSetup();
    const removed: FacultyCourseMapping[] = mappings.map((mapping) => ({
      ...mapping,
      removedAt: '2026-10-12T05:00:00.000Z' as FacultyCourseMapping['removedAt'],
    }));
    expect(facultyCourseRows(directory, removed)[0]!.courses[0]!.mapping).toBeNull();
    expect(facultyCourseRows(directory, [])[0]!.courses[0]!.mapping).toBeNull();
  });

  it('a course without a code is named by its name', async () => {
    const { directory, mappings } = await afterSetup();
    const uncoded = directory.map((row) => ({
      ...row,
      courses: row.courses.map((course) => ({ ...course, platformCode: null })),
    }));
    expect(facultyCourseRows(uncoded, mappings)[0]!.courses[0]!.code).toBe(
      'Thermodynamics & Heat Transfer',
    );
  });
});

describe('searchRows', () => {
  it('matches name or e-mail, ignoring case and the spaces around it', async () => {
    const { directory, mappings } = await afterSetup();
    const rows = facultyCourseRows(directory, mappings);
    expect(searchRows(rows, '')).toBe(rows);
    expect(searchRows(rows, '  DESAI ').map((row) => row.fullName)).toEqual(['Dr Anita Desai']);
    expect(searchRows(rows, 'ravi.shankar@').map((row) => row.fullName)).toEqual([
      'Prof. Ravi Shankar',
    ]);
    expect(searchRows(rows, 'dr ')).toHaveLength(2);
    expect(searchRows(rows, 'nobody')).toEqual([]);
  });
});

describe('the panel’s choices', () => {
  it('active faculty members only; the courses in content access, "<code> — <name>"', async () => {
    const { directory, mappings, courses } = await afterSetup();
    const rows = facultyCourseRows(directory, mappings);
    expect(facultyChoices(rows)).toEqual([
      { value: '', label: 'Choose a faculty member' },
      { value: 'per-0014', label: 'Dr S. Ranganathan' },
      { value: 'per-0015', label: 'Dr Anita Desai' },
    ]);
    expect(courseChoices(courses)).toEqual([
      { value: '', label: 'Choose a course' },
      {
        value: 'thermodynamics-heat-transfer',
        label: 'ME ZG523 — Thermodynamics & Heat Transfer',
      },
    ]);
    const uncoded: ContentAccessCourse[] = courses.map((row) => ({
      ...row,
      course: { ...row.course, platformCode: null },
    }));
    expect(courseChoices(uncoded)[1]!.label).toBe('Thermodynamics & Heat Transfer');
    expect(courseChoices([])).toEqual([{ value: '', label: 'Choose a course' }]);
  });

  it('`&faculty=` chooses an active member of the list, and no one else', async () => {
    const { directory, mappings } = await afterSetup();
    const rows = facultyCourseRows(directory, mappings);
    expect(preselectedFaculty('?tab=faculty-courses&faculty=per-0015', rows)).toBe('per-0015');
    expect(preselectedFaculty('?tab=faculty-courses&faculty=per-0016', rows)).toBe('');
    expect(preselectedFaculty('?tab=faculty-courses&faculty=per-0002', rows)).toBe('');
    expect(preselectedFaculty('?tab=faculty-courses', rows)).toBe('');
  });
});

describe('firstAssignError', () => {
  it('one error at a time, the faculty member first; undrawn words stay null', () => {
    expect(firstAssignError([])).toBeNull();
    expect(
      firstAssignError([
        fieldError('courseId', 'Dr S. Ranganathan already teaches ME ZG523'),
        fieldError('facultyId', null),
      ]),
    ).toEqual({ field: 'facultyId', message: null });
    expect(
      firstAssignError([fieldError('courseId', 'Dr S. Ranganathan already teaches ME ZG523')]),
    ).toEqual({ field: 'courseId', message: 'Dr S. Ranganathan already teaches ME ZG523' });
    expect(firstAssignError([fieldError('rows.2', 'other')])).toBeNull();
  });
});
