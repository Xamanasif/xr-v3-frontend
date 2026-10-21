/**
 * IA-09's view helpers on the record the sample world answers after setup (Dr S. Ranganathan,
 * FMAP-0021), and on states the walk does not reach — a removed mapping kept on the record, a course
 * without a code, a mapping no person made — derived from that answer as the service would give it.
 * The mapping's id is the row's key only: no word carries it (the identifier rule).
 */
import type { FacultyRecordView } from '@xr/contracts/draft';
import { asPersonId, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { dayMonthYear } from '@/copy/dates';
import { composePlatform } from '@/platform/composition';

import { coursesTaughtLines, facultyAddedLine } from './faculty-record-view';

async function ranganathan(): Promise<FacultyRecordView> {
  const { sample } = composePlatform({
    dataSource: 'sample',
    world: await fixtureWorld('after-setup'),
  });
  const answer = await asPersonId(sample, 'per-0001').people.getFaculty('per-0014' as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

describe('coursesTaughtLines', () => {
  it('B2-06 f15: the course, then when and by whom it was assigned — no mapping reference', async () => {
    const record = await ranganathan();
    const mapping = record.mappings[0]!;
    const lines = coursesTaughtLines(record);
    expect(lines).toEqual([
      {
        mappingId: 'FMAP-0021',
        courseId: 'thermodynamics-heat-transfer',
        code: 'ME ZG523',
        name: 'Thermodynamics & Heat Transfer',
        assigned: `${dayMonthYear(mapping.assignedAt)} · Meera Iyer`,
      },
    ]);
    for (const line of lines) {
      expect([line.code, line.name, line.assigned].join(' ')).not.toMatch(/\bFMAP-\d+/);
    }
  });

  it('a removed mapping stays on the record but is not listed (state-copy IA-09.courses)', async () => {
    const record = await ranganathan();
    const removed: FacultyRecordView = {
      ...record,
      mappings: record.mappings.map((mapping) => ({
        ...mapping,
        removedAt: '2026-10-12T05:00:00.000Z' as typeof mapping.removedAt,
      })),
    };
    expect(coursesTaughtLines(removed)).toEqual([]);
  });

  it('a course without a code by its name; no person on the record, the date alone', async () => {
    const record = await ranganathan();
    const mapping = record.mappings[0]!;
    const derived: FacultyRecordView = {
      ...record,
      courses: record.courses.map((course) => ({ ...course, platformCode: null })),
      mappings: [{ ...mapping, assignedBy: { kind: 'system', system: 'sample-fixture' } as never }],
    };
    expect(coursesTaughtLines(derived)).toEqual([
      {
        mappingId: 'FMAP-0021',
        courseId: 'thermodynamics-heat-transfer',
        code: null,
        name: 'Thermodynamics & Heat Transfer',
        assigned: dayMonthYear(mapping.assignedAt),
      },
    ]);
  });
});

describe('facultyAddedLine', () => {
  it('B2-06 f15 "Added": the date and who added the faculty member', async () => {
    const record = await ranganathan();
    expect(facultyAddedLine(record)).toBe(`${dayMonthYear(record.faculty.added.at)} · Meera Iyer`);
  });
});
