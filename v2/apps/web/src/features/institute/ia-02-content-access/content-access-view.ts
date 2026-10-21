/**
 * IA-02's pure view rules in the V3 design (IA-v1 `Main.dc.html` IA-02, its script's `vm02core`):
 * the port's per-course answer regrouped as the export draws it — one plan strip per access plan
 * (newest first), then one list grouped by course with one row per plan experiment (newest plan
 * first within a course) — narrowed by the Search and Status filters (state-copy `IA-02.filters`,
 * `IA-02.several`).
 */
import type { ContentAccessExperiment, ContentAccessRow } from '@xr/contracts/draft';
import type { AccessPlanStatus } from '@xr/domain';

import type { ContentStatusFilter } from '@/copy/institute-home';

export type PlanStanding = ContentAccessRow['plans'][number];

export interface ContentRowView extends ContentAccessExperiment {
  /** The status of the row's plan (shown beside its name). */
  readonly status: AccessPlanStatus;
  /** Whether "Give access" is drawn: its plan is active or ending soon. */
  readonly givable: boolean;
}

export interface CourseGroupView {
  readonly course: ContentAccessRow['course'];
  readonly institutionCode: ContentAccessRow['institutionCode'];
  readonly rows: readonly ContentRowView[];
}

export interface ContentAccessView {
  /** Every plan, newest first: one strip each. */
  readonly plans: readonly PlanStanding[];
  /** The course groups the filters keep, in the port's course order. */
  readonly groups: readonly CourseGroupView[];
  /** Every experiment row, before the filters ("1 experiment in 1 course"). */
  readonly total: number;
  /** The rows the filters keep ("0 of 1 experiment"). */
  readonly shown: number;
  /** The courses the plans hold. */
  readonly courses: number;
  /** "Give students access" in the head: some plan's experiments can be given now. */
  readonly anyGivable: boolean;
}

const STATUS_OF_FILTER: Readonly<Record<Exclude<ContentStatusFilter, 'all'>, AccessPlanStatus>> = {
  active: 'access-active',
  ending: 'ending-soon',
  ended: 'access-ended',
};

function givable(status: AccessPlanStatus): boolean {
  return status === 'access-active' || status === 'ending-soon';
}

/** Newest plan first (by activation; the reference breaks a tie), as the service orders them. */
function newestFirst(a: PlanStanding, b: PlanStanding): number {
  if (a.plan.activatedAt !== b.plan.activatedAt) {
    return a.plan.activatedAt < b.plan.activatedAt ? 1 : -1;
  }
  return a.plan.id < b.plan.id ? 1 : a.plan.id > b.plan.id ? -1 : 0;
}

export function contentAccessView(
  rows: readonly ContentAccessRow[],
  filter: { readonly search: string; readonly status: ContentStatusFilter },
): ContentAccessView {
  const byId = new Map<string, PlanStanding>();
  for (const row of rows) {
    for (const standing of row.plans) byId.set(standing.plan.id, standing);
  }
  const plans = [...byId.values()].sort(newestFirst);
  const order = new Map(plans.map((standing, index) => [standing.plan.id as string, index]));
  const search = filter.search.trim().toLocaleLowerCase('en');
  const wanted = filter.status === 'all' ? null : STATUS_OF_FILTER[filter.status];
  let total = 0;
  let shown = 0;
  const groups: CourseGroupView[] = [];
  for (const row of rows) {
    const kept: ContentRowView[] = [];
    for (const experiment of [...row.experiments].sort(
      (a, b) => (order.get(a.planId) ?? 0) - (order.get(b.planId) ?? 0),
    )) {
      const standing = byId.get(experiment.planId);
      if (!standing) continue;
      total += 1;
      // The export's search: the experiment, the course code, the course's name and your code.
      const text = [
        experiment.name,
        row.course.platformCode ?? '',
        row.course.name,
        row.institutionCode?.code ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase('en');
      if (search !== '' && !text.includes(search)) continue;
      if (wanted !== null && standing.status !== wanted) continue;
      shown += 1;
      kept.push({ ...experiment, status: standing.status, givable: givable(standing.status) });
    }
    if (kept.length > 0) {
      groups.push({ course: row.course, institutionCode: row.institutionCode, rows: kept });
    }
  }
  return {
    plans,
    groups,
    total,
    shown,
    courses: rows.filter((row) => row.experiments.length > 0).length,
    anyGivable: plans.some((standing) => givable(standing.status)),
  };
}
