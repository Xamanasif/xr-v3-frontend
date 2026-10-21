/**
 * IA-20's view of the two reads (B3-10; IA-v1 `vm20`): formats in display order, "No activity yet" as a check of
 * each figure, the plans that hold an experiment, and the by-course rows that never add figures up
 * across experiments or formats (state-copy `IA-20.course-several`, `IA-20.course-format-not-held`).
 */
import type { ContentAccessRow } from '@xr/contracts/draft';
import type { UsageRow } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { usageScreenView } from './usage-view';

const course = (id: string, name: string, platformCode: string | null) =>
  ({ id, name, platformCode, description: null, formatsInCourse: [] }) as never;

const item = (experimentId: string, name: string, planId: string) =>
  ({
    experimentId,
    name,
    planId,
    formats: ['web'],
    publishedNotInPlan: [],
    studentsGiven: 0,
  }) as never;

const content = (
  courseFacts: ReturnType<typeof course>,
  experiments: ReturnType<typeof item>[],
): ContentAccessRow =>
  ({
    course: courseFacts,
    items: [],
    publishedNotInPlan: [],
    institutionCode: null,
    plans: [],
    experiments,
  }) as never;

const row = (
  experimentId: string,
  studentsWithAccess: number,
  perFormat: [string, number, number, number][],
): UsageRow =>
  ({
    experimentId,
    studentsWithAccess,
    perFormat: perFormat.map(([format, started, completed, sessions]) => ({
      format,
      started,
      completed,
      sessions,
    })),
  }) as never;

const THERMO = course('thermo', 'Thermodynamics & Heat Transfer', 'ME ZG523');
const MACHINES = course('machines', 'Electrical Machines', 'EEE ZC341');

describe('usageScreenView', () => {
  it('names each experiment from Content access and shows its formats in display order', () => {
    const view = usageScreenView(
      [
        row('shell', 5, [
          ['vr', 2, 1, 4],
          ['web', 4, 2, 11],
        ]),
      ],
      [content(THERMO, [item('shell', 'Shell-and-Tube Heat Exchanger', 'ACC-0107')])],
    );
    expect(view.none).toBe(false);
    expect(view.experiments).toEqual([
      {
        experimentId: 'shell',
        name: 'Shell-and-Tube Heat Exchanger',
        courseCode: 'ME ZG523',
        planIds: ['ACC-0107'],
        studentsWithAccess: 5,
        hasActivity: true,
        formats: [
          { format: 'web', started: 4, completed: 2, sessions: 11 },
          { format: 'vr', started: 2, completed: 1, sessions: 4 },
        ],
      },
    ]);
    // B3-10 f1: one course, one experiment — its figures as they are.
    expect(view.sessionFormats).toEqual(['web', 'vr']);
    expect(view.courses).toEqual([
      {
        courseId: 'thermo',
        name: 'Thermodynamics & Heat Transfer',
        code: 'ME ZG523',
        experimentsGiven: 1,
        studentsWithAccess: 5,
        sessions: [11, 4],
      },
    ]);
  });

  it('“No activity yet” while every figure is zero, or with no rows at all', () => {
    const zero = row('shell', 3, [
      ['web', 0, 0, 0],
      ['vr', 0, 0, 0],
    ]);
    const facts = [content(THERMO, [item('shell', 'Shell', 'ACC-0107')])];
    expect(usageScreenView([zero], facts).none).toBe(true);
    // V3: each experiment says so on its own (IA-v1 `hasActivity`).
    expect(usageScreenView([zero], facts).experiments[0]!.hasActivity).toBe(false);
    expect(
      usageScreenView([zero, row('fin', 1, [['web', 1, 0, 1]])], facts).experiments.map(
        (experiment) => experiment.hasActivity,
      ),
    ).toEqual([false, true]);
    expect(usageScreenView([], facts).none).toBe(true);
    // Any one figure above zero is activity: a session alone, or a completion alone.
    expect(usageScreenView([row('shell', 3, [['web', 0, 0, 1]])], facts).none).toBe(false);
    expect(usageScreenView([row('shell', 3, [['vr', 0, 1, 0]])], facts).none).toBe(false);
  });

  it('every plan that holds an experiment, once each', () => {
    const view = usageScreenView(
      [row('shell', 1, [['web', 1, 0, 1]])],
      [
        content(THERMO, [
          item('shell', 'Shell', 'ACC-0107'),
          item('shell', 'Shell', 'ACC-0212'),
          item('shell', 'Shell', 'ACC-0107'),
        ]),
      ],
    );
    expect(view.experiments[0]!.planIds).toEqual(['ACC-0107', 'ACC-0212']);
  });

  it('by course: a course with two experiments adds nothing up; a format it lacks is marked', () => {
    const view = usageScreenView(
      [
        row('shell', 5, [
          ['web', 4, 2, 11],
          ['vr', 2, 1, 4],
        ]),
        row('fin', 3, [['web', 1, 0, 2]]),
        row('transformer', 2, [['web', 1, 1, 3]]),
      ],
      [
        content(THERMO, [item('shell', 'Shell', 'ACC-0107'), item('fin', 'Fin', 'ACC-0107')]),
        content(MACHINES, [item('transformer', 'Transformer Tests', 'ACC-0085')]),
      ],
    );
    expect(view.experiments.map((experiment) => experiment.name)).toEqual([
      'Shell',
      'Fin',
      'Transformer Tests',
    ]);
    expect(view.sessionFormats).toEqual(['web', 'vr']);
    expect(view.courses).toEqual([
      {
        courseId: 'thermo',
        name: 'Thermodynamics & Heat Transfer',
        code: 'ME ZG523',
        experimentsGiven: 2,
        studentsWithAccess: null,
        sessions: null,
      },
      {
        courseId: 'machines',
        name: 'Electrical Machines',
        code: 'EEE ZC341',
        experimentsGiven: 1,
        studentsWithAccess: 2,
        sessions: [3, null],
      },
    ]);
  });

  it('an experiment Content access does not list keeps its ID and stays out of the course rows', () => {
    const view = usageScreenView([row('orphan', 1, [['web', 1, 0, 1]])], []);
    expect(view.experiments[0]).toMatchObject({
      name: 'orphan',
      courseCode: null,
      planIds: [],
    });
    expect(view.courses).toEqual([]);
  });
});
