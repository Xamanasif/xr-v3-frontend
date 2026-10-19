import type { Role, SupportReport, SupportState } from '@xr/domain';

import { dayMonthYear } from './dates';
import { stateWords } from './state-copy';

/**
 * Help & support words (XS-07) as the owner-approved Entry & shared export draws them
 * (design/v3-refined-b/roles/XS-v6, `XsHelp`; SHARED-CONTRACT `XsHelp`), which keeps board 07's
 * words and rules: no response times, service levels or named responders (ND-14); status is read
 * here only, nothing is e-mailed (T-34). Dates read "1 Oct 2026". A Super Admin sees no reference
 * anywhere (owner decision 6): every function that would show one takes `showReferences`.
 */
export const HELP = {
  title: 'Help & support',
  lead: 'Something isn’t working? Report it here and follow what happens to your report.',
  report: 'Report a problem',
  mine: 'My reports',
  empty: {
    title: 'No reports yet',
    line: 'If something isn’t working, report it and follow it here.',
  },
  loading: 'Loading your reports…',
  failed: { title: 'We couldn’t load your reports', line: 'Nothing has changed. Try again.' },
  retry: 'Try again',
  form: {
    lead: 'Describe what went wrong. You can follow your report in My reports.',
    summary: 'One thing needs fixing',
    whatSummary: 'Say what happened',
    what: 'What happened?',
    whatHint: 'Say what you were doing and what you saw.',
    whatError: 'Say what happened, so it can be looked into',
    where: 'Where did it happen?',
    whereHint: 'Filled in from the page you came from. Change it if needed.',
    screenshot: 'Screenshot',
    optional: '(optional)',
    screenshotHint: 'A picture of the screen can help.',
    send: 'Send report',
    sending: 'Sending…',
    sendingStatus: 'Sending your report',
    cancel: 'Cancel',
  },
  sent: {
    title: 'Report sent',
    referenceBefore: 'Your reference is ',
    referenceAfter: '. You can follow it in My reports.',
    withoutReference: 'You can follow it in My reports.',
    view: 'View my reports',
    /** "Back to Home" (Student) / "Back to Overview" (every other role). */
    back: (homeLabel: string) => `Back to ${homeLabel}`,
  },
  detail: {
    sheet: 'Report',
    reported: 'What you reported',
    history: 'History',
    newestFirst: 'Newest first',
    reopenedTitle: 'This report is open again',
    foot: 'Something else isn’t working? ',
    loading: 'Loading your report…',
    failedTitle: 'We couldn’t load your report',
  },
  facts: {
    what: 'What happened',
    where: 'Where',
    screenshot: 'Screenshot',
    whereMissing: 'Not given',
  },
} as const;

/**
 * Whether Help shows a report's reference (SUP-…): every role but the Super Admin, whose interfaces
 * show no internal reference anywhere, accessible names included (owner decision 6; XS `showRefs`).
 */
export function showsReportReferences(role: Role): boolean {
  return role !== 'super_admin';
}

/** A report's state in words, with the V3 status tone (XS: Open and Reopened info, Resolved ok). */
export const REPORT_STATUS: Readonly<
  Record<SupportState, { readonly tone: 'info' | 'ok'; readonly label: string }>
> = {
  open: { tone: 'info', label: 'Open' },
  resolved: { tone: 'ok', label: 'Resolved' },
  reopened: { tone: 'info', label: 'Reopened' },
};

/**
 * The longest report title, in characters. PROVISIONAL with the rule below (P0-31): no board
 * draws a cut title; board 07's titles run to 46 characters.
 */
export const REPORT_TITLE_MAX = 60;

/**
 * A report's title in My reports and on its detail — PROVISIONAL (owner decision P0-31, 12 Oct
 * 2026: "display-only excerpt from 'What happened' as the provisional title; no saved title
 * field"). The beginning of "What happened": spaces and line breaks collapsed; a text that fits is
 * shown whole without its closing full stop; a longer one is cut at the last word that fits, with
 * an ellipsis. The report keeps no title of its own (Appendix C M24); this is display only.
 * Recorded as provisional in the state-copy register (`XS-07.report-title`).
 */
export function reportTitle(whatHappened: string): string {
  const text = whatHappened.replace(/\s+/g, ' ').trim();
  if (text.length <= REPORT_TITLE_MAX) return text.replace(/(?<!\.)\.$/, '');
  const cut = text.slice(0, REPORT_TITLE_MAX);
  const space = cut.lastIndexOf(' ');
  const words = (space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '');
  return `${words}…`;
}

function latest<T extends { readonly at: string }>(items: readonly T[]): T | undefined {
  return [...items].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).at(-1);
}

/**
 * The line under a report's title in My reports (XS: "SUP-0211 · Sent 1 Oct 2026 · Reopened 6 Oct
 * 2026"); no reference for a Super Admin.
 */
export function reportMeta(report: SupportReport, showReferences: boolean): string {
  const parts = [...(showReferences ? [report.id] : []), `Sent ${dayMonthYear(report.sentAt)}`];
  if (report.state === 'resolved') {
    const resolution = latest(report.resolutions);
    if (resolution) parts.push(`Resolved ${dayMonthYear(resolution.at)}`);
  }
  if (report.state === 'reopened') {
    const reopening = latest(report.reopenings);
    if (reopening) parts.push(`Reopened ${dayMonthYear(reopening.at)}`);
  }
  return parts.join(' · ');
}

/** `p.rb-note` beside "My reports": "1 report · newest first", "3 reports · newest first". */
export function reportCountText(count: number): string {
  return `${count === 1 ? '1 report' : `${count} reports`} · newest first`;
}

/** The person's own reports, newest first. */
export function newestFirst(reports: readonly SupportReport[]): SupportReport[] {
  return [...reports].sort((a, b) =>
    a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : a.id < b.id ? 1 : -1,
  );
}

/** "Sent 1 Oct 2026" in a report's head. */
export function sentOn(report: SupportReport): string {
  return `Sent ${dayMonthYear(report.sentAt)}`;
}

/**
 * The resolution note shown first on a resolved report (XS: "Resolution note · 18 Sep 2026" and the
 * note in quotation marks), or nothing.
 */
export function resolutionOf(
  report: SupportReport,
): { readonly title: string; readonly note: string } | null {
  if (report.state !== 'resolved') return null;
  const resolution = latest(report.resolutions);
  return resolution
    ? { title: `Resolution note · ${dayMonthYear(resolution.at)}`, note: `“${resolution.note}”` }
    : null;
}

/** "This report is open again — It was reopened on 6 Oct 2026. You can follow it here." */
export function reopenedOf(report: SupportReport): string | null {
  if (report.state !== 'reopened') return null;
  const reopening = latest(report.reopenings);
  return reopening
    ? `It was reopened on ${dayMonthYear(reopening.at)}. You can follow it here.`
    : null;
}

const EVENT_WORDS = { sent: 'Sent', resolved: 'Resolved', reopened: 'Reopened' } as const;

/** One line of a report's history, in words (the V3 timeline draws it). */
export interface HistoryLine {
  readonly what: string;
  readonly when: string;
  readonly note?: string;
}

/**
 * The report's history, newest first (XS): "Sent", "Resolved", "Reopened" with the day; a
 * resolution keeps its note, in quotation marks, on its own line — the one in force and an earlier
 * one a reopening superseded alike.
 */
export function historyOf(report: SupportReport): HistoryLine[] {
  const events = [...report.history].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1,
  );
  return events.map((entry) => ({
    what: EVENT_WORDS[entry.event],
    when: dayMonthYear(entry.at),
    ...(entry.event === 'resolved' && entry.note ? { note: `“${entry.note}”` } : {}),
  }));
}

/**
 * What the person reported (XS "What you reported": What happened · Where · Screenshot). A missing
 * place reads "Not given" and a missing screenshot "No screenshot added", as the export draws them.
 */
export function reportedFacts(
  report: SupportReport,
): readonly { readonly term: string; readonly value: string }[] {
  return [
    { term: HELP.facts.what, value: report.whatHappened },
    {
      term: HELP.facts.where,
      value: report.where?.trim() ? report.where : HELP.facts.whereMissing,
    },
    {
      term: HELP.facts.screenshot,
      value: report.screenshotFileName ?? stateWords('XS-07.no-screenshot'),
    },
  ];
}
