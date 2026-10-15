/**
 * IA-04's pure view of the port's grant rows (B2-04 script `saView`): which rows are on show, how
 * each was given, which can be withdrawn, and the filters. Every fact is the row's own
 * (`StudentAccessService.listGrants`) — the status is the service's `display`, the group grant the
 * service's `alsoInGroupGrant` — and the group names are `GroupService.listGroups`'. Nothing here
 * decides access: a row is a grant's own state, never whether the student can open the experiment.
 */
import type { GrantRow } from '@xr/contracts/draft';

import type { StatusFilter, ViaFilter } from '@/copy/student-access';

export interface AccessRowView {
  /** One row per grant × student (a group grant has a row per current member). */
  readonly key: string;
  readonly row: GrantRow;
  readonly via: 'ind' | 'grp';
  /** The group a group grant gives through (B2-04 "Group: ME ZG523 — Sem II"). */
  readonly groupName: string | null;
  /** The group of the active group grant that also gives this student the experiment. */
  readonly alsoGroupName: string | null;
  /** B2-04 `canWithdraw`: an individual grant, active or waiting, while not paused. */
  readonly canWithdraw: boolean;
  /**
   * B2-04 `grpRow` (`via === 'grp' && !paused`): "Change on the group" opens the group's own page
   * (IA-14, Package 2B) — group grants are changed on the group (SACC-08).
   */
  readonly changeOnGroup: string | null;
}

/**
 * The rows as B2-04 draws them. `paused` is the institution's own pause (B2-04 f12: no Withdraw…).
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
  const nameOf = (groupId: string | undefined) =>
    groupId === undefined ? null : (groupNames.get(groupId) ?? groupId);
  return rows.map((row) => {
    const via = row.grant.target.kind === 'group' ? 'grp' : 'ind';
    return {
      key: `${row.grant.id}:${row.student.id}`,
      row,
      via,
      groupName: row.grant.target.kind === 'group' ? nameOf(row.grant.target.groupId) : null,
      alsoGroupName:
        row.alsoInGroupGrant === null ? null : nameOf(groupOfGrant.get(row.alsoInGroupGrant)),
      canWithdraw:
        !paused &&
        via === 'ind' &&
        (row.display === 'active' || row.display === 'waiting-for-a-licence'),
      changeOnGroup: !paused && row.grant.target.kind === 'group' ? row.grant.target.groupId : null,
    };
  });
}

export interface AccessFilters {
  readonly search: string;
  readonly status: StatusFilter;
  readonly via: ViaFilter;
  readonly showWithdrawn: boolean;
}

const STATUS_DISPLAY: Readonly<Record<Exclude<StatusFilter, 'all'>, GrantRow['display']>> = {
  active: 'active',
  waiting: 'waiting-for-a-licence',
  inactive: 'student-inactive',
};

/**
 * B2-04 `visible`: a withdrawn grant is history, behind "Show withdrawn" — except an individual
 * grant withdrawn beside a group grant ("Individual grant withdrawn"), which stays on show:
 * hiding it would suggest the student has nothing left, which the design does not decide
 * (OD-B2-01).
 */
function onShow(view: AccessRowView, showWithdrawn: boolean): boolean {
  return showWithdrawn || view.row.display !== 'withdrawn';
}

/** B2-04 search: student, student ID, experiment or grant ID. */
function matches(view: AccessRowView, search: string): boolean {
  if (search === '') return true;
  const { row } = view;
  return `${row.student.fullName} ${row.student.institutionStudentId} ${row.experimentName} ${row.grant.id}`
    .toLowerCase()
    .includes(search);
}

export interface FilteredRows {
  /** The rows the filters keep, in the service's order. */
  readonly listed: readonly AccessRowView[];
  /** The rows on show before the filters (B2-04 `shown`). */
  readonly shown: number;
  /** Withdrawn grants behind "Show withdrawn" (B2-04 `nWd`). */
  readonly withdrawn: number;
}

export function filterRows(rows: readonly AccessRowView[], filters: AccessFilters): FilteredRows {
  const search = filters.search.trim().toLowerCase();
  const visible = rows.filter((view) => onShow(view, filters.showWithdrawn));
  return {
    listed: visible.filter(
      (view) =>
        matches(view, search) &&
        (filters.status === 'all' || view.row.display === STATUS_DISPLAY[filters.status]) &&
        (filters.via === 'all' || view.via === filters.via),
    ),
    shown: visible.length,
    withdrawn: rows.filter((view) => view.row.display === 'withdrawn').length,
  };
}
