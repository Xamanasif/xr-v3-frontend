import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';

export interface TermTrackProps {
  /** "Yearly term" (`span.rb-term-label`). */
  readonly label: ReactNode;
  /** "15 days left", "Paused", "Ended" (`span.rb-term-left`). */
  readonly remaining: ReactNode;
  /** `due` (gold-brown, the default), `calm` (ink) or `paused` (navy). */
  readonly remainingTone?: 'due' | 'calm' | 'paused';
  /** The term's first and last day ("8 Oct 2026", "7 Oct 2027"). */
  readonly start: ReactNode;
  readonly end: ReactNode;
  /**
   * The share of the term that has passed, 0 to 1, from the plan's dates and the application's
   * clock — computed by the caller, never a constant.
   */
  readonly elapsed: number;
  /** The gold remainder (ending soon). */
  readonly showRest?: boolean;
  /** The marker for today. */
  readonly showToday?: boolean;
  /** The striped track of a paused plan (`rk-track-paused`, no fill). */
  readonly paused?: boolean;
  /** The ended track: the fill runs the whole term (`rk-track-full`). */
  readonly full?: boolean;
  /**
   * The term in words, the track's accessible name ("Access term from 8 October 2026 to 7 October
   * 2027. 349 of 364 days have passed; 15 days are left.").
   */
  readonly description: string;
  /** Inside a plan band (`rk-plan-term`). */
  readonly inPlanBand?: boolean;
}

function percent(share: number): string {
  return `${(Math.min(1, Math.max(0, share)) * 100).toFixed(2)}%`;
}

/**
 * The term timeline (`div.rb-term[role=img]`; rb.css, IA-01 and IA-02): label and days left, the
 * track with the elapsed fill, the gold remainder and today's marker, and the first and last day.
 *
 * The fill, the remainder and the marker are positioned by the share of the term that has passed,
 * which only the plan's dates decide: the boards draw it as `style="width: 95.88%"` and
 * `style="left: 95.88%"`. This file is the one place in the V3 layer that sets such a data-driven
 * inline style — the recorded `inline-style` scan exception (`packages/config/src/scans/
 * exceptions.ts`); everything else about the track stays in the frozen stylesheets.
 */
export function TermTrack({
  label,
  remaining,
  remainingTone = 'due',
  start,
  end,
  elapsed,
  showRest = false,
  showToday = false,
  paused = false,
  full = false,
  description,
  inPlanBand = false,
}: TermTrackProps) {
  const fill = full ? '100%' : percent(elapsed);
  const rest = percent(1 - elapsed);
  return (
    <div
      className={joinClasses('rb-term', inPlanBand && 'rk-plan-term')}
      role="img"
      aria-label={description}
    >
      <div className="rb-term-top">
        <span className="rb-term-label">{label}</span>
        <span
          className={joinClasses(
            'rb-term-left',
            remainingTone === 'calm' && 'rb-term-left--calm',
            remainingTone === 'paused' && 'rk-term-paused',
          )}
        >
          {remaining}
        </span>
      </div>
      <div
        className={joinClasses(
          'rb-term-track',
          paused && 'rk-track-paused',
          full && 'rk-track-full',
        )}
      >
        <span className="rb-term-fill" style={{ width: fill }} />
        {showRest ? <span className="rb-term-rest" style={{ width: rest }} /> : null}
        {showToday ? <span className="rb-term-today" style={{ left: fill }} /> : null}
      </div>
      <div className="rb-term-ends">
        <span>{start}</span>
        <span>{end}</span>
      </div>
    </div>
  );
}
