/**
 * The words of the Super Admin's Overview (SA-01, board B7-01; B7-10 f15; B7-12 f8 … f11): the
 * header's summary line, the two figures and the eight groups — each group's title, its "Open
 * <list>" link and the words of its rows, composed from the facts `getSuperAdminOverview` answers
 * (PC-67). Nothing here counts or dates what the service does not answer. Rules the board does not
 * draw word for word are state-copy entries (`state-copy-content-oversight.ts`, `SA-01.*`).
 */
import type { RequestType, SupportReport } from '@xr/domain';
import { FORMAT_META, ROLE_LABEL, type Technology } from '@xr/domain';

import { calendarDay, dayMonthYear } from './dates';
import { reportTitle } from './help';
import { REQUEST_TYPE_WORDS } from './requests';

export const OVERVIEW_PAGE = {
  title: 'Overview',
  /** B7-01 f2: the loading status in the page header (`xl-meta[role=status]`). */
  loading: 'Loading what is waiting…',
  /** B7-01 `section.xd-figs[aria-label]`. */
  figuresLabel: 'Platform at a glance',
  activeInstitutions: 'Active institutions',
  publishedExperiments: 'Published experiments',
  /** B7-01 "Live in the catalogue today". */
  publishedLine: 'Live in the catalogue today',
  /** B7-01 f1 "Nothing is waiting". */
  calmTitle: 'Waiting on you',
  nothingWaiting: 'Nothing is waiting',
  /** B7-01 f1, B7-10 f15: the calm state's sentence, as drawn. */
  calmLine:
    'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.',
} as const;

/**
 * The eight groups in B7-01's order — title, the "Open <list>" link, and each row's action words
 * (`Open`, `Review`, `Assign`, `Assign scope`).
 */
export const OVERVIEW_GROUPS = {
  requests: { title: 'Requests', open: 'Open Requests', action: 'Open' },
  updates: {
    title: 'Corrections waiting for your release decision',
    open: 'Open Updates',
    action: 'Review',
  },
  deviceTransfers: { title: 'Device transfers', open: 'Open Device transfers', action: 'Review' },
  support: { title: 'Support reports', open: 'Open Support', action: 'Open' },
  accessEnding: {
    title: 'Access ending within 15 days',
    open: 'Open Access ending',
    action: 'Open',
  },
  institutionsWithoutAdmin: {
    title: 'Institutions without an Institute Admin',
    open: 'Open Institutions',
    action: 'Assign',
  },
  stuckContent: { title: 'Stuck content', open: 'Open All content', action: 'Open' },
  holdersWithoutScope: {
    title: 'Role holders without scope',
    open: 'Open Platform roles',
    action: 'Assign scope',
  },
} as const;

export type OverviewGroupKey = keyof typeof OVERVIEW_GROUPS;

/** The groups in the order B7-01 draws them. */
export const OVERVIEW_GROUP_ORDER: readonly OverviewGroupKey[] = [
  'requests',
  'updates',
  'deviceTransfers',
  'support',
  'accessEnding',
  'institutionsWithoutAdmin',
  'stuckContent',
  'holdersWithoutScope',
];

/** B7-01 f0 overline: "Super Admin · Arjun Mehta" — the workspace and who is signed in. */
export function overviewOverline(workspace: string, name: string): string {
  return `${workspace} · ${name}`;
}

/**
 * B7-01 f0 header line: "15 items waiting across 8 groups · 23 Oct 2026" — every group's count
 * added up, the groups that hold something, and today on the sample clock; nothing waiting (f1):
 * the date alone (state-copy `SA-01.summary`).
 */
export function overviewSummary(items: number, groups: number, today: string | null): string {
  const date = today === null ? null : dayMonthYear(today);
  if (items === 0) return date ?? '';
  const waiting = `${items} ${items === 1 ? 'item' : 'items'} waiting across ${groups} ${
    groups === 1 ? 'group' : 'groups'
  }`;
  return date === null ? waiting : `${waiting} · ${date}`;
}

/** B7-01 figure line: "Access active or ending soon · 1 paused · 1 awaiting payment". */
export function activeInstitutionsLine(paused: number, awaitingPayment: number): string {
  return `Access active or ending soon · ${paused} paused · ${awaitingPayment} awaiting payment`;
}

/** B7-01 row action name: "Open: REQ-0040 · Konark Polytechnic", "Review: UPD-0005 · …". */
export function rowActionLabel(action: string, title: string): string {
  return `${action}: ${title}`;
}

/** B7-01 "Open" row action name: "Open: REQ-0040 · Konark Polytechnic". */
export function openRowLabel(title: string): string {
  return rowActionLabel('Open', title);
}

/** "Each with at most four rows and one way to open the full list" (B7-01 f0 caption). */
export const GROUP_ROWS = 4;

/** B7-01 row title: "REQ-0040 · Konark Polytechnic". */
export function requestRowTitle(reference: string, institution: string): string {
  return `${reference} · ${institution}`;
}

/**
 * B7-01 row line: "Additional licences · under review since 29 Sep 2026", with "· access ends 31
 * Oct 2026" for a renewal (state-copy `SA-01.request-row`).
 */
export function requestRowLine(
  type: RequestType,
  receivedAt: string,
  accessEndsOn: string | null = null,
): string {
  const line = `${REQUEST_TYPE_WORDS[type]} · under review since ${dayMonthYear(receivedAt)}`;
  return accessEndsOn === null ? line : `${line} · access ends ${calendarDay(accessEndsOn)}`;
}

/** B7-01 row title: "UPD-0005 · Distillation Column 1.2 → 1.3". */
export function updateRowTitle(
  reference: string,
  experiment: string,
  from: string,
  to: string | null,
): string {
  return to === null
    ? `${reference} · ${experiment} ${from}`
    : `${reference} · ${experiment} ${from} → ${to}`;
}

/** B7-01 row line: "Approved by the Academic Reviewer on 27 Aug 2026 · version 1.2 is live". */
export function updateRowLine(approvedAt: string | null, liveLabel: string): string {
  const approved =
    approvedAt === null
      ? 'Approved by the Academic Reviewer'
      : `Approved by the Academic Reviewer on ${dayMonthYear(approvedAt)}`;
  return `${approved} · version ${liveLabel} is live`;
}

/** B7-01 row title: "DTR-0018 · Rahul Verma · VR". */
export function transferRowTitle(reference: string, student: string, format: Technology): string {
  return `${reference} · ${student} · ${FORMAT_META[format].code}`;
}

/** B7-01 row line: "Godavari Institute of Technology · forwarded 23 Oct 2026". */
export function transferRowLine(institution: string, forwardedAt: string | null): string {
  return forwardedAt === null
    ? institution
    : `${institution} · forwarded ${dayMonthYear(forwardedAt)}`;
}

/**
 * B7-01 row title: "SUP-0207 · Delivery link preview showed an empty frame" — the reference and the
 * report's display title, the provisional excerpt of "What happened" (P0-31; `reportTitle`).
 */
export function supportRowTitle(report: SupportReport): string {
  return `${report.id} · ${reportTitle(report.whatHappened)}`;
}

/**
 * B7-01 row line: "Kavya Nair · Content Manager · reopened 6 Oct 2026", "Meera Iyer · Institute
 * Admin · sent 30 Sep 2026" — who sent it, their role, and when it was last reopened or sent
 * (state-copy `SA-01.support-row`).
 */
export function supportRowLine(report: SupportReport): string {
  const who = `${report.reporter.displayName} · ${ROLE_LABEL[report.reporter.role]}`;
  const reopened = [...report.reopenings].sort((a, b) => (a.at < b.at ? -1 : 1)).at(-1);
  if (report.state === 'reopened' && reopened) {
    return `${who} · reopened ${dayMonthYear(reopened.at)}`;
  }
  return `${who} · sent ${dayMonthYear(report.sentAt)}`;
}

/** B7-01 row title: "BITS Pilani — Hyderabad Campus · ends 31 Oct 2026". */
export function endingRowTitle(institution: string, endsOn: string): string {
  return `${institution} · ends ${calendarDay(endsOn)}`;
}

/** B7-01 row lines: "Renewal in progress — REQ-0038", "Reminder due — nothing is sent from here". */
export function endingRowLine(
  standing:
    | { readonly kind: 'renewal-in-progress'; readonly requestId: string }
    | { readonly kind: 'reminder-due' }
    | { readonly kind: 'ended-no-renewal' },
): string {
  switch (standing.kind) {
    case 'renewal-in-progress':
      return `Renewal in progress — ${standing.requestId}`;
    case 'reminder-due':
      return 'Reminder due — nothing is sent from here';
    case 'ended-no-renewal':
      return 'Ended — no renewal requested';
  }
}

/**
 * B7-01 row line: "Access active since 30 Sep 2026 — nobody can give students access"; a paused
 * institution says so (state-copy `SA-01.no-institute-admin-row`).
 */
export function noInstituteAdminLine(paused: boolean, accessSince: string | null): string {
  const access = paused
    ? 'Access paused'
    : accessSince === null
      ? 'Access active'
      : `Access active since ${dayMonthYear(accessSince)}`;
  return `${access} — nobody can give students access`;
}

/** B7-01 row title: "SUB-0085 · DC Motor Speed Control · EEE ZC341". */
export function stuckRowTitle(reference: string, name: string, courseCode: string | null): string {
  return courseCode === null ? `${reference} · ${name}` : `${reference} · ${name} · ${courseCode}`;
}

/**
 * B7-01 row line: "With the Academic Reviewer since 2 Oct 2026 — no reviewer has EEE ZC341 in
 * scope" (a course with no platform code: "this course").
 */
export function stuckRowLine(since: string, courseCode: string | null): string {
  return `With the Academic Reviewer since ${dayMonthYear(since)} — no reviewer has ${
    courseCode ?? 'this course'
  } in scope`;
}

/** B7-01 row title: "Dr K. Iyer · Academic Reviewer". */
export function holderRowTitle(name: string, roleLabel: string): string {
  return `${name} · ${roleLabel}`;
}

/** B7-01 row line: "Registered 20 Oct 2026 — can’t act on anything yet". */
export function holderRowLine(registeredAt: string): string {
  return `Registered ${dayMonthYear(registeredAt)} — can’t act on anything yet`;
}
