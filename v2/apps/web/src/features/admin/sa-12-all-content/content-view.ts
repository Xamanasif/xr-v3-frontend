/**
 * SA-12 / SA-13's pure view rules (B7-06): a record's workflow status as the board words it (the
 * chip, its tone and the "where" line), the four views of All content and their address
 * (`?show=` and `?q=`, routes.json "SA-12 (+ ?show=&q=)"; the default view and an empty search
 * carry none, rule T3). Every status, "stuck" verdict and search match is the service's answer;
 * the views only group what it answered (state-copy `SA-12.views`).
 */
import type { SubmissionStatus } from '@xr/domain';
import type { StatusTone } from '@xr/ui';

import {
  type AllContentShow,
  overriddenWhere,
  publishedWhere,
  recheckWhere,
  resubmittedWhere,
  returnedWhere,
  STATUS_WORDS,
  withContentManagerWhere,
  withReviewerWhere,
  type WorkflowKind,
} from '@/copy/content-oversight';
import { ALL_CONTENT_ADDRESS } from '@/nav/admin-content';

/** B7-06 `stk`: the chip's tone per status (`xr-status--ok | err | wait | info`). */
const TONE: Readonly<Record<WorkflowKind, StatusTone>> = {
  published: 'ok',
  stuck: 'err',
  review: 'wait',
  cm: 'wait',
  vendor: 'info',
  resubmitted: 'wait',
};

/** A record's status as the chip draws it (B7-06 `stw`, `stk`). */
export function workflowKind(status: SubmissionStatus, stuck: boolean): WorkflowKind {
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
  readonly kind: WorkflowKind;
  readonly tone: StatusTone;
  readonly words: string;
  /** The line under the chip (B7-06 `where`). */
  readonly where: string;
}

/**
 * The chip and its line for a record: its status, whether the service finds it stuck, its live
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
    tone: TONE[kind],
    words: STATUS_WORDS[kind],
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

/** The four views of B7-06's tablist, in its order. */
export const ALL_CONTENT_SHOWS: readonly AllContentShow[] = [
  'all',
  'stuck',
  'workflow',
  'published',
];

/** Whether a row belongs to a view (B7-06 `match`): stuck, anything not yet published, published. */
export function inShow(
  row: { readonly stuck: boolean; readonly status: SubmissionStatus },
  show: AllContentShow,
): boolean {
  switch (show) {
    case 'all':
      return true;
    case 'stuck':
      return row.stuck;
    case 'workflow':
      return row.status.state !== 'published';
    case 'published':
      return row.status.state === 'published';
  }
}

/** The view an address names (`?show=`); an unknown value names the default view. */
export function showOf(search: string): AllContentShow {
  const value = new URLSearchParams(search).get('show');
  return (ALL_CONTENT_SHOWS as readonly string[]).includes(value ?? '') && value !== 'all'
    ? (value as AllContentShow)
    : 'all';
}

/** The search an address names (`?q=`). */
export function searchOf(search: string): string {
  return new URLSearchParams(search).get('q') ?? '';
}

/** SA-12 on a view and a search (the default view and an empty search carry no parameter). */
export function allContentAddress(show: AllContentShow, q: string): string {
  const params = new URLSearchParams();
  if (show !== 'all') params.set('show', show);
  if (q.trim() !== '') params.set('q', q);
  const query = params.toString();
  return query ? `${ALL_CONTENT_ADDRESS}?${query}` : ALL_CONTENT_ADDRESS;
}
