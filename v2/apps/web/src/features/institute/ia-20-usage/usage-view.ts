import type { ContentAccessRow } from '@xr/contracts/draft';
import { inDisplayOrder, type Technology, type UsageRow } from '@xr/domain';

/**
 * IA-20 Usage (board B3-10) as the screen draws it, from two reads: `OperationsService.getUsage`
 * (per experiment × format: students with access, started, completed, sessions — P3-04
 * provisional, computed by the service) and `InstitutionService.listContentAccess` (each
 * experiment's name, its course and the course's platform code, the plans that hold it). Nothing
 * here adds a figure to another: no total across formats, experiments or courses, no percentage,
 * no feedback, no licence figure (B3-10 "Not designed"; D7 / T-06).
 */

/** One format of one experiment: the service's three figures, as they are. */
export interface FormatFigures {
  readonly format: Technology;
  readonly started: number;
  readonly completed: number;
  readonly sessions: number;
}

/** One experiment section (B3-10 f0): its head and its table, formats in display order. */
export interface ExperimentUsageView {
  readonly experimentId: string;
  readonly name: string;
  /** The course's platform code ("ME ZG523"); null when the course has none or is not known. */
  readonly courseCode: string | null;
  /** The plans holding it, as Content access lists them (state-copy `IA-20.plans-several`). */
  readonly planIds: readonly string[];
  readonly studentsWithAccess: number;
  readonly formats: readonly FormatFigures[];
}

/** One "By course" row (B3-10 f1). */
export interface CourseUsageView {
  readonly courseId: string;
  readonly name: string;
  readonly code: string | null;
  /** How many of its experiments the usage read lists (state-copy `IA-20.experiments-given`). */
  readonly experimentsGiven: number;
  /**
   * The course's one experiment's figures; `null` when it holds more than one — they are never
   * added up across experiments (state-copy `IA-20.course-several`).
   */
  readonly studentsWithAccess: number | null;
  /**
   * Per format of the table's sessions column, in its order: the sessions, or `null` where the
   * course holds no such format (`IA-20.course-format-not-held`); `null` for the whole cell when
   * the course holds more than one experiment.
   */
  readonly sessions: readonly (number | null)[] | null;
}

export interface UsageScreenView {
  /** "No activity yet" (f2; state-copy `IA-20.no-activity`). */
  readonly none: boolean;
  readonly experiments: readonly ExperimentUsageView[];
  readonly courses: readonly CourseUsageView[];
  /** The formats the by-course sessions column names, in display order ("WEB · VR"). */
  readonly sessionFormats: readonly Technology[];
}

interface ExperimentFacts {
  readonly name: string;
  readonly course: ContentAccessRow['course'];
  readonly planIds: readonly string[];
}

/** Each experiment the institution's plans hold: its name, course and plans (Content access). */
function factsOf(content: readonly ContentAccessRow[]): ReadonlyMap<string, ExperimentFacts> {
  const facts = new Map<string, ExperimentFacts>();
  for (const row of content) {
    for (const item of row.experiments) {
      const known = facts.get(item.experimentId);
      facts.set(item.experimentId, {
        name: known?.name ?? item.name,
        course: known?.course ?? row.course,
        planIds:
          known === undefined
            ? [item.planId]
            : known.planIds.includes(item.planId)
              ? known.planIds
              : [...known.planIds, item.planId],
      });
    }
  }
  return facts;
}

/** Whether any figure of any format is above zero — a check of each figure, never a sum. */
function hasActivity(rows: readonly UsageRow[]): boolean {
  return rows.some((row) =>
    row.perFormat.some(
      (figures) => figures.started > 0 || figures.completed > 0 || figures.sessions > 0,
    ),
  );
}

export function usageScreenView(
  rows: readonly UsageRow[],
  content: readonly ContentAccessRow[],
): UsageScreenView {
  const facts = factsOf(content);
  const experiments = rows.map((row): ExperimentUsageView => {
    const known = facts.get(row.experimentId);
    const order = inDisplayOrder(row.perFormat.map((figures) => figures.format));
    return {
      experimentId: row.experimentId,
      // Content access lists every item of the institution's plans, which the usage rows come
      // from; the ID stands in only if the two reads ever disagree.
      name: known?.name ?? row.experimentId,
      courseCode: known?.course.platformCode ?? null,
      planIds: known?.planIds ?? [],
      studentsWithAccess: row.studentsWithAccess,
      formats: order.map((format) => {
        const figures = row.perFormat.find((candidate) => candidate.format === format)!;
        return {
          format,
          started: figures.started,
          completed: figures.completed,
          sessions: figures.sessions,
        };
      }),
    };
  });

  const sessionFormats = inDisplayOrder(
    rows.flatMap((row) => row.perFormat.map((figures) => figures.format)),
  );

  // By course, in the order its first experiment is listed.
  const byCourse = new Map<
    string,
    { readonly course: ContentAccessRow['course']; readonly rows: UsageRow[] }
  >();
  for (const row of rows) {
    const course = facts.get(row.experimentId)?.course;
    if (course === undefined) continue;
    const group = byCourse.get(course.id) ?? { course, rows: [] };
    group.rows.push(row);
    byCourse.set(course.id, group);
  }
  const courses = [...byCourse.values()].map(({ course, rows: held }): CourseUsageView => {
    const only = held.length === 1 ? held[0]! : null;
    return {
      courseId: course.id,
      name: course.name,
      code: course.platformCode,
      experimentsGiven: held.length,
      studentsWithAccess: only === null ? null : only.studentsWithAccess,
      sessions:
        only === null
          ? null
          : sessionFormats.map(
              (format) =>
                only.perFormat.find((figures) => figures.format === format)?.sessions ?? null,
            ),
    };
  });

  return { none: !hasActivity(rows), experiments, courses, sessionFormats };
}
