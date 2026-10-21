/**
 * IA-04's pure view of the port's grant rows (V3: design/v3-refined-b/roles/IA-v1 `Main.dc.html`
 * `vm04`, `saRow`): one row per student × experiment, grouped by experiment, the status segments
 * with their counts, and the filters. Every fact is the row's own (`StudentAccessService.listGrants`)
 * — the status is the service's `display`, the group grant beside an individual one the service's
 * `alsoInGroupGrant` — and the group names are `GroupService.listGroups`'. Nothing here decides
 * access: a row is a grant's own state, never whether the student can open the experiment.
 */
import type { GrantRow } from '@xr/contracts/draft';
import type { GrantDisplayStatus, Technology } from '@xr/domain';

import type { Ia04Via } from '@/copy/ia-access';

export interface AccessRowView {
  /** One row per student × experiment (a group grant has a row per current member). */
  readonly key: string;
  readonly row: GrantRow;
  readonly via: 'ind' | 'grp';
  /** The group a group grant gives through: its id (the group's page) and name. */
  readonly group: { readonly id: string; readonly name: string } | null;
  /**
   * The active group grant that also gives this student the experiment, beside an individual
   * grant (the service's `alsoInGroupGrant`): its group, named. The group grant's own row is folded
   * into this one — "one row per student × experiment" (`saRow` `hasAlso`; IA-07's rule too).
   */
  readonly also: {
    readonly grantId: string;
    readonly groupId: string | null;
    readonly groupName: string;
  } | null;
  /** An individual grant, active or waiting, while not paused (group grants change on the group). */
  readonly canWithdraw: boolean;
}

/**
 * The rows as the export draws them. `paused` is the institution's own pause (no Withdraw…).
 * Withdraw is offered for individual grants only (group grants are changed on the group, SACC-08)
 * and where the service's word is "Active" or "Waiting for a licence" (an inactive student's grant
 * is refused, SACC-10; an ended plan's is undecided, SACC-11).
 */
export function accessRows(
  rows: readonly GrantRow[],
  groupNames: ReadonlyMap<string, string>,
  paused: boolean,
): readonly AccessRowView[] {
  const groupOfGrant = new Map<string, string>();
  for (const row of rows) {
    if (row.grant.target.kind === 'group') groupOfGrant.set(row.grant.id, row.grant.target.groupId);
  }
  const nameOf = (groupId: string) => groupNames.get(groupId) ?? null;
  // A group grant's row for a student whose individual row names it (`alsoInGroupGrant`).
  const folded = new Set(
    rows.flatMap((row) =>
      row.alsoInGroupGrant ? [`${row.alsoInGroupGrant}:${row.student.id}`] : [],
    ),
  );
  return rows
    .filter(
      (row) =>
        !(row.grant.target.kind === 'group' && folded.has(`${row.grant.id}:${row.student.id}`)),
    )
    .map((row) => {
      const target = row.grant.target;
      const via = target.kind === 'group' ? 'grp' : 'ind';
      const alsoGroup = row.alsoInGroupGrant
        ? (groupOfGrant.get(row.alsoInGroupGrant) ?? null)
        : null;
      return {
        key: `${row.grant.id}:${row.student.id}`,
        row,
        via,
        group:
          target.kind === 'group'
            ? { id: target.groupId, name: nameOf(target.groupId) ?? target.groupId }
            : null,
        also: row.alsoInGroupGrant
          ? {
              grantId: row.alsoInGroupGrant,
              groupId: alsoGroup,
              groupName: (alsoGroup ? nameOf(alsoGroup) : null) ?? '',
            }
          : null,
        canWithdraw:
          !paused &&
          via === 'ind' &&
          (row.display === 'active' || row.display === 'waiting-for-a-licence'),
      };
    });
}

/** The status segments, in the export's order: Current, each status present, then Withdrawn. */
export type Segment = 'current' | Exclude<GrantDisplayStatus, 'withdrawn'> | 'withdrawn';

const STATUS_ORDER: readonly Exclude<GrantDisplayStatus, 'withdrawn'>[] = [
  'active',
  'waiting-for-a-licence',
  'student-inactive',
  'individual-grant-withdrawn',
  'paused',
  'access-ended',
];

export interface SegmentCount {
  readonly segment: Segment;
  readonly count: number;
}

/**
 * The switch's segments (`vm04` `segs`): Current (every row but the withdrawn ones), each status
 * that has rows (or is the one chosen), Withdrawn when there are withdrawn rows (or it is chosen).
 */
export function segmentsOf(
  rows: readonly AccessRowView[],
  chosen: Segment,
): readonly SegmentCount[] {
  const count = (display: GrantDisplayStatus) =>
    rows.filter((view) => view.row.display === display).length;
  const withdrawn = count('withdrawn');
  return [
    { segment: 'current', count: rows.length - withdrawn },
    ...STATUS_ORDER.filter((status) => count(status) > 0 || chosen === status).map((status) => ({
      segment: status,
      count: count(status),
    })),
    ...(withdrawn > 0 || chosen === 'withdrawn'
      ? [{ segment: 'withdrawn' as const, count: withdrawn }]
      : []),
  ];
}

export interface AccessFilters {
  readonly search: string;
  readonly via: Ia04Via;
  readonly segment: Segment;
}

function inSegment(view: AccessRowView, segment: Segment): boolean {
  if (segment === 'current') return view.row.display !== 'withdrawn';
  if (segment === 'withdrawn') return view.row.display === 'withdrawn';
  return view.row.display === segment;
}

/** The search: student, student ID, experiment — or a grant's ID (HANDOFF §9), which is never shown. */
function matches(view: AccessRowView, search: string): boolean {
  if (search === '') return true;
  const { row } = view;
  return `${row.student.fullName} ${row.student.institutionStudentId} ${row.experimentName} ${row.grant.id} ${row.alsoInGroupGrant ?? ''}`
    .toLowerCase()
    .includes(search);
}

/** The rows the segment and the filters keep, in the service's order. */
export function filterRows(
  rows: readonly AccessRowView[],
  filters: AccessFilters,
): readonly AccessRowView[] {
  const search = filters.search.trim().toLowerCase();
  return rows.filter(
    (view) =>
      inSegment(view, filters.segment) &&
      matches(view, search) &&
      (filters.via === 'all' || view.via === filters.via),
  );
}

/** One table group: an experiment (its name, course code, formats from the plan) and its rows. */
export interface ExperimentGroup {
  readonly experimentId: string;
  readonly name: string;
  readonly courseCode: string | null;
  readonly formats: readonly Technology[];
  readonly rows: readonly AccessRowView[];
}

/** The rows grouped by experiment, in the order the experiments first appear (`vm04` `groups`). */
export function byExperiment(rows: readonly AccessRowView[]): readonly ExperimentGroup[] {
  const groups = new Map<string, { head: AccessRowView; rows: AccessRowView[] }>();
  for (const view of rows) {
    const id = view.row.grant.experimentId;
    const entry = groups.get(id);
    if (entry) entry.rows.push(view);
    else groups.set(id, { head: view, rows: [view] });
  }
  return [...groups.entries()].map(([experimentId, { head, rows: list }]) => ({
    experimentId,
    name: head.row.experimentName,
    courseCode: head.row.courseCode,
    formats: head.row.formats,
    rows: list,
  }));
}
