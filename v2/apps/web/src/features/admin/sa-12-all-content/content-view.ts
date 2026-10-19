/**
 * SA-12 / SA-13's pure view rules: a record's workflow status as the Super Admin export words it
 * (the pill, its tone and the "where it is" line; the export's `CONT_LBL`, `CONT_KIND`), the
 * "Workflow status" filter of All content and its address (`?show=` and `?q=`, routes.json "SA-12
 * (+ ?show=&q=)"; all statuses and an empty search carry none, rule T3). Every status, "stuck"
 * verdict and search match is the service's answer; the filter only groups what it answered
 * (state-copy `SA-12.views`).
 */
import type { SubmissionStatus } from '@xr/domain';

import {
  overriddenWhere,
  publishedWhere,
  recheckWhere,
  resubmittedWhere,
  returnedWhere,
  withContentManagerWhere,
  withReviewerWhere,
} from '@/copy/content-oversight';
import { type ContentTone, WORKFLOW_STATUS, type WorkflowStatusKey } from '@/copy/sa-content';
import { ALL_CONTENT_ADDRESS } from '@/nav/admin-content';

/** A record's status as the pill draws it (the export's `contentStatus`: stuck before all else). */
export function workflowKind(status: SubmissionStatus, stuck: boolean): WorkflowStatusKey {
  if (stuck) return 'stuck';
  switch (status.state) {
    case 'published':
      return 'published';
    case 'with-academic-reviewer':
      return 'review';
    case 'with-content-manager':
      return 'cm';
    case 'returned':
      return 'vendor';
    case 'resubmitted':
    case 'draft':
      return 'resubmitted';
  }
}

export interface WorkflowWords {
  readonly kind: WorkflowStatusKey;
  readonly tone: ContentTone;
  readonly words: string;
  /** The "where it is" line (the export's `where`). */
  readonly where: string;
}

/**
 * The pill and its line for a record: its status, whether the service finds it stuck, its live
 * version where it is published, and its revision (a resubmission's line).
 */
export function workflowWords(
  status: SubmissionStatus,
  stuck: boolean,
  live: { readonly label: string; readonly since: string } | null,
  revision: number | null,
): WorkflowWords {
  const kind = workflowKind(status, stuck);
  return {
    kind,
    tone: WORKFLOW_STATUS[kind].tone,
    words: WORKFLOW_STATUS[kind].words,
    where: whereOf(status, live, revision),
  };
}

function whereOf(
  status: SubmissionStatus,
  live: { readonly label: string; readonly since: string } | null,
  revision: number | null,
): string {
  switch (status.state) {
    case 'published':
      return publishedWhere(live?.label ?? '', live?.since ?? status.at);
    case 'with-academic-reviewer':
      return status.reason === 'recheck'
        ? recheckWhere(status.since)
        : withReviewerWhere(status.since);
    case 'with-content-manager':
      return withContentManagerWhere(status.since);
    case 'returned':
      return status.by === 'super-admin-override'
        ? overriddenWhere(status.since)
        : returnedWhere(status.since);
    case 'resubmitted':
      return resubmittedWhere(status.since, revision ?? 1);
    case 'draft':
      // A draft is the Vendor's only (SUB-16): the service never lists one to her.
      return '';
  }
}

/** The "Workflow status" filter: every status, or one (the export's `CF`, in its order). */
export type StatusFilter = 'all' | WorkflowStatusKey;

/**
 * The filter's options in the export's order. "Resubmitted" (undrawn; state-copy
 * `SA-12.resubmitted`) is offered only while a record has it.
 */
export const STATUS_FILTERS: readonly StatusFilter[] = [
  'all',
  'published',
  'review',
  'cm',
  'vendor',
  'stuck',
  'resubmitted',
];

/** Whether a row has the filter's status (all statuses: every row). */
export function hasStatus(
  row: { readonly stuck: boolean; readonly status: SubmissionStatus },
  filter: StatusFilter,
): boolean {
  return filter === 'all' || workflowKind(row.status, row.stuck) === filter;
}

/** The status an address names (`?show=`); an unknown value names every status. */
export function showOf(search: string): StatusFilter {
  const value = new URLSearchParams(search).get('show');
  return (STATUS_FILTERS as readonly string[]).includes(value ?? '') && value !== 'all'
    ? (value as StatusFilter)
    : 'all';
}

/** The search an address names (`?q=`). */
export function searchOf(search: string): string {
  return new URLSearchParams(search).get('q') ?? '';
}

/** SA-12 on a status and a search (every status and an empty search carry no parameter). */
export function allContentAddress(show: StatusFilter, q: string): string {
  const params = new URLSearchParams();
  if (show !== 'all') params.set('show', show);
  if (q.trim() !== '') params.set('q', q);
  const query = params.toString();
  return query ? `${ALL_CONTENT_ADDRESS}?${query}` : ALL_CONTENT_ADDRESS;
}
