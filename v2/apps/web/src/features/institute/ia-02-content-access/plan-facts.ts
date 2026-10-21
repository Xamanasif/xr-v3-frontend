/**
 * Facts the Institute Admin's plan screens (IA-01, IA-02, IA-03, IA-20) draw in the V3 design, as
 * plain presentation of the records the ports answer: today on the sample clock, a plan's term
 * bar (the export's `termVM`: the share passed from the plan's dates and the days the service
 * says are left), when BITS paused it (the plan's own history), and an experiment's four formats
 * with their states (the export's `fmCells` / `fmBadges`: in the plan, published but not in it, not
 * published — WEB · AR · VR · MR).
 */
import type { AccessPlan, AccessPlanStatus, Technology } from '@xr/domain';
import { inDisplayOrder, TECHNOLOGIES } from '@xr/domain';
import type { FormatCode } from '@xr/ui';
import type { IaFormatCell, IaTermState } from '@xr/ui/v3';

import { calendarDay, dayMonthYear } from '@/copy/dates';
import { formatName } from '@/copy/flow-state-words';
import {
  badgeWords,
  type BadgeState,
  daysLeftWords,
  endedOnWords,
  formatKeyLine,
  longDay,
  pausedOnWords,
  termDescription,
  termLabel,
} from '@/copy/institute-home';

const IST_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** An instant's calendar day in Indian time ("2026-10-22"), as the sample world reads dates. */
export function calendarDateOf(instant: string): string {
  return IST_DAY.format(new Date(instant));
}

/** Whole days from one calendar date to another ("2026-10-08" → "2027-10-07": 364). */
export function daysBetween(from: string, to: string): number {
  const day = (date: string) => Date.parse(`${date}T00:00:00Z`);
  return Math.round((day(to) - day(from)) / 86_400_000);
}

/** When BITS last paused the plan (its history's `paused`), or null. */
export function pausedAtOf(plan: AccessPlan): string | null {
  const paused = plan.history.filter((entry) => entry.event === 'paused');
  return paused.length > 0 ? paused[paused.length - 1]!.at : null;
}

/** The term bar of a plan, ready for `IaTermBar` (all but `place`). */
export interface TermBarFacts {
  readonly label: string;
  readonly left: string;
  readonly start: string;
  readonly end: string;
  readonly elapsed: number;
  readonly state: IaTermState;
  readonly description: string;
}

/**
 * The plan's term bar (the export's `termVM`): the label ("Yearly term"), the days left in gold
 * while it ends soon, "Paused by BITS on …" while paused, "Ended on …" once ended; the share of
 * the term passed is the term's days less the days the service says are left.
 */
export function termBarOf(
  plan: AccessPlan,
  status: AccessPlanStatus,
  daysLeft: number | null,
  pausedAt: string | null,
): TermBarFacts {
  const total = Math.max(1, daysBetween(plan.startsOn, plan.endsOn));
  const left = Math.max(0, daysLeft ?? 0);
  const passed = Math.min(total, Math.max(0, total - left));
  const base = {
    label: termLabel(plan.term),
    start: calendarDay(plan.startsOn),
    end: calendarDay(plan.endsOn),
    elapsed: passed / total,
  };
  if (status === 'paused') {
    return {
      ...base,
      state: 'paused',
      left: pausedOnWords(pausedAt === null ? null : dayMonthYear(pausedAt)),
      description: termDescription(plan, {
        kind: 'paused',
        on: pausedAt === null ? null : longDay(calendarDateOf(pausedAt)),
      }),
    };
  }
  if (status === 'access-ended') {
    return {
      ...base,
      elapsed: 1,
      state: 'ended',
      left: endedOnWords(plan.endsOn),
      description: termDescription(plan, { kind: 'ended' }),
    };
  }
  return {
    ...base,
    state: status === 'ending-soon' ? 'ending' : 'live',
    left: daysLeftWords(left),
    description: termDescription(plan, { kind: 'live', passed, total, left }),
  };
}

/** An experiment's four formats with their states, in the display order. */
export interface FormatFacts {
  readonly cells: readonly IaFormatCell[];
  /** "WEB and VR in your plan · AR published, not in your plan · MR not published". */
  readonly key: string;
}

/**
 * The formats of an experiment of the plan (the export's `fmCells`): in the plan, published but
 * not in it (`publishedNotInPlan`, ACC-10), else not published.
 */
export function formatFactsOf(
  inPlan: readonly Technology[],
  publishedNotInPlan: readonly Technology[],
): FormatFacts {
  const stateOf = (format: Technology): BadgeState =>
    inPlan.includes(format) ? 'on' : publishedNotInPlan.includes(format) ? 'pub' : 'none';
  const all = inDisplayOrder(TECHNOLOGIES);
  return {
    cells: all.map((format) => ({
      format: formatName(format) as FormatCode,
      state: stateOf(format),
      words: badgeWords(format, stateOf(format)),
    })),
    key: formatKeyLine(
      all.filter((format) => stateOf(format) === 'on'),
      all.filter((format) => stateOf(format) === 'pub'),
      all.filter((format) => stateOf(format) === 'none'),
    ),
  };
}
