/**
 * SA-21 Support report (B7-09 f8 … f12, f14) as a view of the report the service answers — pure
 * functions, no React. Words come from `copy/operations-6.ts`; dates are the boards' day form
 * ("3 Oct 2026"). The report record is the reporter's own (XS-07 reads the same SUP record).
 */
import type { ActorRef, SupportReport } from '@xr/domain';
import type { TimelineEvent } from '@xr/ui';

import { dayMonthYear } from '@/copy/dates';
import {
  earlierNoteWords,
  quoted,
  REPORT_HISTORY,
  REPORT_PAGE,
  reopenedByTitle,
  reopenedByWords,
  resolvedOnWords,
} from '@/copy/operations-6';

function latest<T extends { readonly at: string }>(items: readonly T[]): T | null {
  return [...items].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).at(-1) ?? null;
}

function nameOf(actor: ActorRef): string {
  return actor.kind === 'person' ? actor.displayName : '';
}

function byReporter(report: SupportReport, actor: ActorRef): boolean {
  return actor.kind === 'person' && actor.personId === report.reporter.personId;
}

/** "What they reported" (B7-09 `dl.xl-kv.xv-kv`): From, What happened, Where, Screenshot. */
export interface ReportedFact {
  readonly term: string;
  readonly value: string;
}

/**
 * The facts as B7-09 lists them. "Where" is left out when the reporter cleared it (the reporter's
 * own detail does the same, XS-07); a screenshot is its file name only — nothing is uploaded.
 */
export function reportedFacts(report: SupportReport, from: string): readonly ReportedFact[] {
  const { keys } = REPORT_PAGE;
  return [
    { term: keys.from, value: from },
    { term: keys.whatHappened, value: report.whatHappened },
    ...(report.where ? [{ term: keys.where, value: report.where }] : []),
    { term: keys.screenshot, value: report.screenshotFileName ?? REPORT_PAGE.noScreenshot },
  ];
}

/**
 * The history, newest first (B7-09 `hist`; "Newest first"): Sent; Resolved with the note in
 * quotation marks; Reopened "By the reporter." or "By <name>." — each with its day (state-copy
 * `SA-21.history`).
 */
export function historyEvents(report: SupportReport): TimelineEvent[] {
  const events = [...report.history].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1,
  );
  return events.map((entry) => {
    const when = dayMonthYear(entry.at);
    switch (entry.event) {
      case 'sent':
        return { id: entry.id, what: REPORT_HISTORY.sent, when };
      case 'resolved':
        return {
          id: entry.id,
          what: REPORT_HISTORY.resolved,
          when,
          ...(entry.note ? { note: quoted(entry.note) } : {}),
        };
      case 'reopened':
        return {
          id: entry.id,
          what: REPORT_HISTORY.reopened,
          when,
          note: byReporter(report, entry.actor)
            ? REPORT_HISTORY.byReporter
            : reopenedByWords(nameOf(entry.actor)),
        };
    }
  });
}

/** The decided panel of a resolved report (B7-09 `rDone`): when, by whom, and the note. */
export function resolutionOf(
  report: SupportReport,
): { readonly line: string; readonly note: string } | null {
  if (report.state !== 'resolved') return null;
  const resolution = latest(report.resolutions);
  return resolution
    ? {
        line: resolvedOnWords(dayMonthYear(resolution.at), nameOf(resolution.by)),
        note: quoted(resolution.note),
      }
    : null;
}

/**
 * The notice first on a reopened report (B7-09 f10 `hasPrev`): who reopened it and the earlier
 * note — "Reopened by the reporter" as drawn, or "Reopened by <name>" when the Super Admin did
 * (state-copy `SA-21.reopened-by`). None when the report has no earlier resolution.
 */
export function reopenedNotice(
  report: SupportReport,
): { readonly title: string; readonly line: string } | null {
  if (report.state !== 'reopened') return null;
  const resolution = latest(report.resolutions);
  const reopening = latest(report.reopenings);
  if (!resolution) return null;
  const title =
    reopening && !byReporter(report, reopening.by)
      ? reopenedByTitle(nameOf(reopening.by))
      : REPORT_PAGE.reopenedByReporter;
  return { title, line: earlierNoteWords(resolution.note) };
}
