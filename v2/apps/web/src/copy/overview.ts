/**
 * The words of the Super Admin's Overview (SA-01) in the owner-approved V3 Refined B design (the
 * Super Admin export, design/v3-refined-b/roles/SA-v1 `sa-views-a.js` `V.overview`, `sa-core.js`
 * `SA.work`): the head and its two figures, the category switch, the priority band, the queue's
 * eight groups — each group's name, its destination link and quiet line, and the words of its rows
 * — composed from the facts `getSuperAdminOverview` answers (PC-67). Nothing here counts or orders
 * what the service does not answer. Internal references (REQ-, UPD-, DTR-, SUP-, SUB-, ACC-) are
 * never written: rows are named by their institution, content or person, as the export names them.
 * Rules the export does not draw word for word are state-copy entries (`SA-01.*`).
 */
import type { RequestType } from '@xr/domain';

import { dayMonth, weekdayDate } from './dates';
import { REQUEST_TYPE_WORDS } from './requests';

export const OVERVIEW_PAGE = {
  title: 'Overview',
  /** `dl.rb-figs[aria-label]`. */
  figuresLabel: 'Platform at a glance',
  activeInstitutions: 'Active institutions',
  /** The first line under the active institutions. */
  activeLine: 'Access active or ending soon.',
  publishedExperiments: 'Published experiments',
  publishedLine: 'Live in the catalogue today',
  /** `div.rb-switch[aria-label]`. */
  switchLabel: 'Show what is waiting',
  /** Nothing waiting at all (`div.rb-calm`). */
  calmTitle: 'Nothing is waiting',
  calmLine:
    'Requests, corrections to release, device transfers, support reports, ending access, institutions without an Institute Admin, stuck content and role holders without scope appear here when they need you.',
  /** The priority band (`section.rb-prio`). */
  priorityTitle: 'Needs attention first',
  /** The band's order in words — the order applied (state-copy `SA-01.priority`). */
  priorityNote: 'Soonest deadline first, then the longest wait',
  /** The rest of the queue under the band. */
  alsoWaiting: 'Also waiting on you',
} as const;

/** "1 paused, 1 awaiting payment." — only what is not zero; nothing when both are. */
export function activeInstitutionsExtra(paused: number, awaitingPayment: number): string | null {
  const parts = [
    paused > 0 ? `${paused} paused` : null,
    awaitingPayment > 0 ? `${awaitingPayment} awaiting payment` : null,
  ].filter((part): part is string => part !== null);
  return parts.length > 0 ? `${parts.join(', ')}.` : null;
}

/**
 * The eight groups — the queue's name (`h3.rb-g-name`), its destination link and the quiet line a
 * chosen category shows when its group has nothing in it.
 */
export const OVERVIEW_GROUPS = {
  requests: {
    title: 'Requests',
    open: 'Open Requests',
    quiet: 'No request is waiting for your decision.',
  },
  updates: {
    title: 'Corrections waiting for your release decision',
    open: 'Open Updates',
    quiet: 'No correction is waiting for your release decision.',
  },
  deviceTransfers: {
    title: 'Device transfers',
    open: 'Open Device transfers',
    quiet: 'No device transfer has been forwarded to BITS.',
  },
  support: { title: 'Support reports', open: 'Open Support', quiet: 'No support report is open.' },
  accessEnding: {
    title: 'Access ending within 15 days',
    open: 'Open Access ending',
    quiet: 'No institution’s access ends in the next 15 days.',
  },
  institutionsWithoutAdmin: {
    title: 'Institutions without an Institute Admin',
    open: 'Open Institutions',
    quiet: 'Every institution with access has an Institute Admin.',
  },
  stuckContent: {
    title: 'Stuck content',
    open: 'Open All content',
    quiet: 'Nothing is stuck in the content workflow.',
  },
  holdersWithoutScope: {
    title: 'Role holders without scope',
    open: 'Open Platform roles',
    quiet: 'Every role holder has a scope.',
  },
} as const;

export type OverviewGroupKey = keyof typeof OVERVIEW_GROUPS;

/** The groups in the approved order (B7-01; the export's queue order). */
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

/** The category switch: its options in order, each the groups it shows. */
export const OVERVIEW_CATEGORIES = [
  { key: 'all', label: 'All', groups: OVERVIEW_GROUP_ORDER },
  { key: 'requests', label: 'Requests', groups: ['requests'] },
  { key: 'updates', label: 'Corrections', groups: ['updates'] },
  { key: 'deviceTransfers', label: 'Device transfers', groups: ['deviceTransfers'] },
  { key: 'support', label: 'Support', groups: ['support'] },
  { key: 'accessEnding', label: 'Access ending', groups: ['accessEnding'] },
  {
    key: 'setup',
    label: 'Set-up gaps',
    groups: ['institutionsWithoutAdmin', 'stuckContent', 'holdersWithoutScope'],
  },
] as const satisfies readonly {
  readonly key: string;
  readonly label: string;
  readonly groups: readonly OverviewGroupKey[];
}[];

export type OverviewCategoryKey = (typeof OVERVIEW_CATEGORIES)[number]['key'];

/** The chosen category in a few words, announced and given as the queue's hidden heading. */
export function categoryAnnouncement(label: string, items: number): string {
  return `${label}, ${items} ${items === 1 ? 'item' : 'items'}`;
}

// ---- dates as the export writes them ----

const DAY_MS = 86_400_000;

const IST_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

/** The calendar day of an instant in Indian time, as a day number (for waits in whole days). */
function istDayNumber(instant: string): number {
  const parts = Object.fromEntries(
    IST_DAY.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Date.UTC(parts['year']!, parts['month']! - 1, parts['day']!) / DAY_MS;
}

/** A calendar date ("2026-10-31") as an instant of that day in Indian time. */
function dayInstant(date: string): string {
  return `${date}T12:00:00+05:30`;
}

/** Whole days from `from` to `to` (both instants, Indian calendar days). */
function daysBetween(from: string, to: string): number {
  return Math.max(0, istDayNumber(to) - istDayNumber(from));
}

function plural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

/** "24 September" (the export's `dLong`). */
export function dayFullMonth(instant: string): string {
  return weekdayDate(instant).split(' ').slice(1, 3).join(' ');
}

/** The wait column of a row: "29 days" over "since 24 Sep"; on the day itself "Today" over "23 Oct". */
export function waitSince(
  from: string,
  today: string | null,
  verb = 'since',
): { readonly big: string; readonly small: string } {
  const days = today === null ? 0 : daysBetween(from, today);
  return days === 0
    ? { big: 'Today', small: dayMonth(from) }
    : { big: plural(days, 'day'), small: `${verb} ${dayMonth(from)}` };
}

/** An end date's column: "In 8 days" over "31 Oct" (the service's days left). */
export function endsIn(
  endsOn: string,
  daysLeft: number | null,
): { readonly big: string; readonly small: string } {
  const days = daysLeft ?? 0;
  return {
    big: days === 0 ? 'Today' : `In ${plural(days, 'day')}`,
    small: dayMonth(dayInstant(endsOn)),
  };
}

// ---- the rows (the export's `SA.work`) ----

const ASKS_FOR: Readonly<Record<RequestType, string>> = {
  'new-access': 'asks for new access',
  'additional-licences': 'asks for additional licences',
  renewal: 'asks to renew its access',
};

const REQUEST_KIND: Readonly<Record<RequestType, string>> = {
  'new-access': 'new access',
  'additional-licences': 'additional licences',
  renewal: 'renewal',
};

export const ROW_ACTIONS = {
  request: 'Open request',
  update: 'Review correction',
  transfer: 'Review transfer',
  report: 'Open report',
  renewal: 'Open renewal request',
  ending: 'View access ending',
  assignAdmin: 'Assign Institute Admin',
  stuck: 'Open in All content',
  scope: 'Assign scope',
} as const;

/** "Konark Polytechnic asks for additional licences". */
export function requestRowTitle(institution: string, type: RequestType): string {
  return `${institution} ${ASKS_FOR[type]}`;
}

/**
 * "Additional licences for Buck Converter Ripple." — the experiment named when the request holds
 * one (or "for 3 experiments"); a renewal adds when its access ends (state-copy
 * `SA-01.request-row`).
 */
export function requestRowLine(
  type: RequestType,
  experiments: { readonly count: number; readonly firstName: string | null },
  accessEndsOn: string | null,
): string {
  const what =
    experiments.count === 1 && experiments.firstName
      ? experiments.firstName
      : plural(experiments.count, 'experiment');
  const line = `${REQUEST_TYPE_WORDS[type]} for ${what}.`;
  return accessEndsOn === null
    ? line
    : `${line} Access ends on ${dayFullMonth(dayInstant(accessEndsOn))}.`;
}

/** "Open the additional licences request from Konark Polytechnic". */
export function openRequestName(type: RequestType, institution: string): string {
  return `Open the ${REQUEST_KIND[type]} request from ${institution}`;
}

/** "Distillation Column correction, version 1.2 to 1.3". */
export function updateRowTitle(experiment: string, from: string, to: string | null): string {
  return to === null
    ? `${experiment} correction, version ${from}`
    : `${experiment} correction, version ${from} to ${to}`;
}

/** "Approved by the Academic Reviewer on 27 August. Version 1.2 is still live." */
export function updateRowLine(approvedAt: string | null, liveLabel: string): string {
  const approved =
    approvedAt === null
      ? 'Approved by the Academic Reviewer.'
      : `Approved by the Academic Reviewer on ${dayFullMonth(approvedAt)}.`;
  return `${approved} Version ${liveLabel} is still live.`;
}

/** "Review the Distillation Column correction". */
export function reviewCorrectionName(experiment: string): string {
  return `Review the ${experiment} correction`;
}

/** "VR device transfer for Rahul Verma". */
export function transferRowTitle(formatCode: string, student: string): string {
  return `${formatCode} device transfer for ${student}`;
}

/** "Godavari Institute of Technology. Forwarded by its Institute Admin." */
export function transferRowLine(institution: string): string {
  return `${institution}. Forwarded by its Institute Admin.`;
}

/** "Review the VR device transfer for Rahul Verma". */
export function reviewTransferName(formatCode: string, student: string): string {
  return `Review the ${transferRowTitle(formatCode, student)}`;
}

/** "Kavya Nair, Content Manager". */
export function reportRowLine(reporter: string, role: string): string {
  return `${reporter}, ${role}`;
}

/** The report's last event under its wait: "sent 30 Sep", "reopened 6 Oct". */
export function reportEventVerb(reopened: boolean): string {
  return reopened ? 'reopened' : 'sent';
}

/** "Open the report: Usage page took a long time to load". */
export function openReportName(title: string): string {
  return `Open the report: ${title}`;
}

/**
 * An access-ending row's line: "Access ends on 31 October. Renewal in progress." or "… Reminder
 * due; nothing is sent from here." (a status, never a message).
 */
export function endingRowLine(endsOn: string, renewal: boolean): string {
  const ends = `Access ends on ${dayFullMonth(dayInstant(endsOn))}.`;
  return renewal
    ? `${ends} Renewal in progress.`
    : `${ends} Reminder due; nothing is sent from here.`;
}

/** The priority band's line for an ending access (the export's `pd`). */
export function endingPriorityLine(
  renewalUnderReviewSince: string | null,
  renewal: boolean,
): string {
  if (!renewal) return 'The reminder is due. Nothing is sent from here.';
  return renewalUnderReviewSince === null
    ? 'Renewal in progress.'
    : `Its renewal request has been under review since ${dayFullMonth(renewalUnderReviewSince)}.`;
}

/** "Open the renewal request from …" / "View access ending for …". */
export function endingActionName(institution: string, renewal: boolean): string {
  return renewal
    ? `Open the renewal request from ${institution}`
    : `View access ending for ${institution}`;
}

export const PRIORITY_KINDS = {
  ending: 'Access ending',
  correction: 'Correction waiting for release',
} as const;

/** The band's line for a correction: "Version 1.3 was approved … on 27 August. Version 1.2 is still live." */
export function correctionPriorityLine(
  to: string | null,
  approvedAt: string | null,
  liveLabel: string,
): string {
  const version = to === null ? 'The correction' : `Version ${to}`;
  const approved =
    approvedAt === null
      ? `${version} was approved by the Academic Reviewer.`
      : `${version} was approved by the Academic Reviewer on ${dayFullMonth(approvedAt)}.`;
  return `${approved} Version ${liveLabel} is still live.`;
}

/** "Distillation Column correction". */
export function correctionTitle(experiment: string): string {
  return `${experiment} correction`;
}

/** The band's wait for a correction: "Waiting since 27 Aug". */
export function waitingSince(from: string): string {
  return `Waiting since ${dayMonth(from)}`;
}

/** "Sahyadri Institute of Engineering has no Institute Admin". */
export function noAdminRowTitle(institution: string): string {
  return `${institution} has no Institute Admin`;
}

/** "Access active since 30 September. Nobody there can give students access." */
export function noAdminRowLine(paused: boolean, accessSince: string | null): string {
  const access = paused ? 'Access paused' : 'Access active';
  const since = accessSince === null ? '' : ` since ${dayFullMonth(accessSince)}`;
  return `${access}${since}. Nobody there can give students access.`;
}

/** "Assign an Institute Admin to Sahyadri Institute of Engineering". */
export function assignAdminName(institution: string): string {
  return `Assign an Institute Admin to ${institution}`;
}

/** "DC Motor Speed Control is stuck in review". */
export function stuckRowTitle(name: string): string {
  return `${name} is stuck in review`;
}

/** "EEE ZC341. With the Academic Reviewer since 2 October; no reviewer has this course in scope." */
export function stuckRowLine(courseCode: string | null, since: string): string {
  const line = `With the Academic Reviewer since ${dayFullMonth(since)}; no reviewer has this course in scope.`;
  return courseCode === null ? line : `${courseCode}. ${line}`;
}

/** "Open DC Motor Speed Control in All content". */
export function openStuckName(name: string): string {
  return `Open ${name} in All content`;
}

/** "Dr K. Iyer has no scope yet". */
export function holderRowTitle(name: string): string {
  return `${name} has no scope yet`;
}

/** "Academic Reviewer, registered 20 October. Can’t act on anything yet." */
export function holderRowLine(roleLabel: string, registeredAt: string): string {
  return `${roleLabel}, registered ${dayFullMonth(registeredAt)}. Can’t act on anything yet.`;
}

/** "Assign scope to Dr K. Iyer". */
export function assignScopeName(name: string): string {
  return `Assign scope to ${name}`;
}
