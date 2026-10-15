/**
 * The words of the Super Admin's Overview (SA-01, board B7-01), Phase-1 scope: its Requests group
 * only (owner decision, Package-1D authorisation §2 "SA-01 scope"). The two figures, the other
 * seven groups and the "15 items waiting across 8 groups · 23 Oct 2026" line arrive with the full
 * overview in Phase 6 (`OperationsService.getSuperAdminOverview`); nothing here counts or dates
 * what the Phase-1 reads do not answer. Words the board does not draw are state-copy entries.
 */
import type { RequestType } from '@xr/domain';

import { dayMonthYear } from './dates';
import { REQUEST_TYPE_WORDS } from './requests';

export const OVERVIEW_PAGE = {
  title: 'Overview',
  /** B7-01 f2: the loading status in the page header (`xl-meta[role=status]`). */
  loading: 'Loading what is waiting…',
  requests: 'Requests',
  openRequests: 'Open Requests',
  open: 'Open',
  /** B7-01 f1 "Nothing is waiting". */
  calmTitle: 'Waiting on you',
  nothingWaiting: 'Nothing is waiting',
} as const;

/** B7-01 f0 overline: "Super Admin · Arjun Mehta" — the workspace and who is signed in. */
export function overviewOverline(workspace: string, name: string): string {
  return `${workspace} · ${name}`;
}

/** B7-01 row title: "REQ-0040 · Konark Polytechnic". */
export function requestRowTitle(reference: string, institution: string): string {
  return `${reference} · ${institution}`;
}

/**
 * B7-01 row line: "Additional licences · under review since 29 Sep 2026" — the request's type and
 * the day it was received (state-copy `SA-01.request-line`).
 */
export function requestRowLine(type: RequestType, receivedAt: string): string {
  return `${REQUEST_TYPE_WORDS[type]} · under review since ${dayMonthYear(receivedAt)}`;
}

/** B7-01 row action name: "Open: REQ-0040 · Konark Polytechnic". */
export function openRowLabel(title: string): string {
  return `Open: ${title}`;
}

/** "Each with at most four rows and one way to open the full list" (B7-01 f0 caption). */
export const GROUP_ROWS = 4;
