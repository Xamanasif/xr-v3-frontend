import type { SupportReport, SupportState } from '@xr/domain';
import type { HelpReportStatus, TimelineEvent } from '@xr/ui';

import { dayMonth } from './dates';
import { stateWords } from './state-copy';

/**
 * Help & support words (XS-07, board 07; Appendix F §3.2 `copy/`). The status words are board
 * 07's "Rules": "Open · Resolved · Reopened — identical to the Super Admin side"; the dates are
 * board 07's day-and-month form.
 */

/** A report's state in words, with the tone and icon board 07 draws for it. */
export const REPORT_STATUS: Readonly<Record<SupportState, HelpReportStatus>> = {
  // `xr-status--info` with the info tone's own arrows (board 07 `OPEN`).
  open: { tone: 'info', label: 'Open' },
  // `xr-status--ok` with the tick (board 07 `RESOLVED`).
  resolved: { tone: 'ok', label: 'Resolved' },
  // `xr-status--info` with the Retry arrow (board 07 `REOPENED`).
  reopened: { tone: 'info', label: 'Reopened', icon: 'retry' },
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
 * The facts after the reference in a My reports row (board 07: "sent 1 Oct · reopened 6 Oct",
 * "sent 30 Sep", "sent 15 Sep · resolved 18 Sep").
 */
export function reportSub(report: SupportReport): string {
  const sent = `sent ${dayMonth(report.sentAt)}`;
  if (report.state === 'resolved') {
    const resolution = latest(report.resolutions);
    return resolution ? `${sent} · resolved ${dayMonth(resolution.at)}` : sent;
  }
  if (report.state === 'reopened') {
    const reopening = latest(report.reopenings);
    return reopening ? `${sent} · reopened ${dayMonth(reopening.at)}` : sent;
  }
  return sent;
}

/** `span.xr-meta` beside "My reports": "1 report", "3 reports" (board 07 s5, m2). */
export function reportCountText(count: number): string {
  return count === 1 ? '1 report' : `${count} reports`;
}

/** The person's own reports, newest first (board 07 "State 2"). */
export function newestFirst(reports: readonly SupportReport[]): SupportReport[] {
  return [...reports].sort((a, b) =>
    a.sentAt < b.sentAt ? 1 : a.sentAt > b.sentAt ? -1 : a.id < b.id ? 1 : -1,
  );
}

/**
 * The resolution note shown first on a resolved report (board 07 "State 3": "Resolution note ·
 * 23 Sep" and the note in quotation marks), or nothing.
 */
export function resolutionOf(
  report: SupportReport,
): { readonly date: string; readonly note: string } | null {
  if (report.state !== 'resolved') return null;
  const resolution = latest(report.resolutions);
  return resolution ? { date: dayMonth(resolution.at), note: `“${resolution.note}”` } : null;
}

/** "This report is open again — It was reopened on 6 Oct" (board 07 "State 3a"), or nothing. */
export function reopenedOf(report: SupportReport): { readonly date: string } | null {
  if (report.state !== 'reopened') return null;
  const reopening = latest(report.reopenings);
  return reopening ? { date: dayMonth(reopening.at) } : null;
}

const EVENT_WORDS = { sent: 'Sent', resolved: 'Resolved', reopened: 'Reopened' } as const;

/**
 * The report's history, newest first (board 07 "History comes last"): "Sent", "Resolved",
 * "Reopened" with the day. A resolution still in force reads "· resolution note added" (its note
 * is the first thing on the page, "State 3"); an earlier one, superseded by a reopening, keeps its
 * note in quotation marks ("State 3a": "Reopened reads as open again, with the earlier resolution
 * kept in the history").
 */
export function historyOf(report: SupportReport): TimelineEvent[] {
  const events = [...report.history].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1,
  );
  return events.map((entry, index) => {
    const day = dayMonth(entry.at);
    let when = day;
    if (entry.event === 'resolved') {
      const inForce = index === 0 && report.state === 'resolved';
      if (inForce) when = `${day} · resolution note added`;
      else if (entry.note) when = `${day} · “${entry.note}”`;
    }
    return { id: entry.id, what: EVENT_WORDS[entry.event], when };
  });
}

/** One row of "What you reported" (board 07 "State 3": What happened · Where · Screenshot). */
export interface ReportedFact {
  readonly term: 'What happened' | 'Where' | 'Screenshot';
  readonly value: string;
  /** The screenshot row draws the image icon before the file name. */
  readonly icon?: 'image';
}

/**
 * What the person reported, as board 07 lists it. A missing screenshot reads "No screenshot
 * added" (board 07 "State 3a"). An empty "Where" is not drawn: the row is left out rather than
 * given undrawn words (reported).
 */
export function reportedFacts(report: SupportReport): ReportedFact[] {
  return [
    { term: 'What happened', value: report.whatHappened },
    ...(report.where ? [{ term: 'Where', value: report.where } as const] : []),
    {
      term: 'Screenshot',
      value: report.screenshotFileName ?? stateWords('XS-07.no-screenshot'),
      icon: 'image',
    },
  ];
}
