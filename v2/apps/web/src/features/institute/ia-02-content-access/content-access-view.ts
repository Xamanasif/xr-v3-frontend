/**
 * IA-02's pure view rules (B2-02): the port's per-course answer regrouped as the board draws it —
 * one section per access plan (newest first), its course groups, one row per experiment — and
 * narrowed by the Search and Status filters (B2-02 script `caView`; state-copy `IA-02.filters`).
 */
import type { ContentAccessExperiment, ContentAccessRow } from '@xr/contracts/draft';
import type { AccessPlanStatus } from '@xr/domain';

import type { ContentStatusFilter } from '@/copy/institute-home';

type PlanStanding = ContentAccessRow['plans'][number];

export interface ContentRowView extends ContentAccessExperiment {
  /** The status of the row's plan (B2-02 "Status" column). */
  readonly status: AccessPlanStatus;
  /** Whether "Give access" is drawn: its plan is active or ending soon (f4, f5 draw none). */
  readonly givable: boolean;
}

export interface CourseGroupView {
  readonly course: ContentAccessRow['course'];
  readonly institutionCode: ContentAccessRow['institutionCode'];
  readonly rows: readonly ContentRowView[];
}

export interface PlanSectionView {
  readonly standing: PlanStanding;
  readonly courses: readonly CourseGroupView[];
}

export interface ContentAccessView {
  readonly sections: readonly PlanSectionView[];
  /** Every experiment row, before the filters ("1 experiment in 1 course"). */
  readonly total: number;
  /** The rows the filters keep ("0 of 1 experiment"). */
  readonly shown: number;
  /** The courses the plans hold. */
  readonly courses: number;
  /** "Give students access" in the header: some plan's experiments can be given now. */
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
  const plans = new Map<string, PlanStanding>();
  for (const row of rows) {
    for (const standing of row.plans) plans.set(standing.plan.id, standing);
  }
  const search = filter.search.trim().toLocaleLowerCase('en');
  const wanted = filter.status === 'all' ? null : STATUS_OF_FILTER[filter.status];
  let total = 0;
  let shown = 0;
  const sections: PlanSectionView[] = [];
  for (const standing of [...plans.values()].sort(newestFirst)) {
    const courses: CourseGroupView[] = [];
    for (const row of rows) {
      const groupRows: ContentRowView[] = [];
      for (const experiment of row.experiments) {
        if (experiment.planId !== standing.plan.id) continue;
        total += 1;
        const text = [experiment.name, row.course.platformCode ?? '', row.course.name]
          .join(' ')
          .toLocaleLowerCase('en');
        if (search !== '' && !text.includes(search)) continue;
        if (wanted !== null && standing.status !== wanted) continue;
        shown += 1;
        groupRows.push({
          ...experiment,
          status: standing.status,
          givable: givable(standing.status),
        });
      }
      if (groupRows.length > 0) {
        courses.push({ course: row.course, institutionCode: row.institutionCode, rows: groupRows });
      }
    }
    if (courses.length > 0) sections.push({ standing, courses });
  }
  return {
    sections,
    total,
    shown,
    courses: rows.filter((row) => row.experiments.length > 0).length,
    anyGivable: [...plans.values()].some((standing) => givable(standing.status)),
  };
}
