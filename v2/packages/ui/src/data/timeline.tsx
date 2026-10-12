import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';

/** One entry of a record's history. */
export interface TimelineEvent {
  /** Stable key. */
  readonly id: string;
  /** What happened ("Returned with a reason", "Access activated"). */
  readonly what: ReactNode;
  /** When, and who ("19 Aug · Prof. A. Menon"; dates as "23 Oct 2026, 10:30", never numeric). */
  readonly when: ReactNode;
  /** An optional note: a quoted reason, a reference ("SACC-0310 · individually"). */
  readonly note?: ReactNode;
}

export interface TimelineProps {
  /** The events, newest first, in the caller's order (the component does not sort). */
  readonly events: readonly TimelineEvent[];
  /**
   * Fill the first (newest) event's dot (`li.xr-tl.is-latest`), as board 03 and B2-03 draw it.
   * Most templated product histories draw no latest marker (B5-06, B7-05): pass `false`.
   */
  readonly markLatest?: boolean;
  /**
   * The element of the what / when / note lines: `div` as the B2–B7 product boards draw them
   * (267 instances), or `p` as boards 03, 07, 09a and the B1 boards do (100). Same look: the
   * foundation sheet sets `p{margin:0}`.
   */
  readonly lineElement?: 'div' | 'p';
  /** The list's name when no heading names it (board 03 "Submission and review history"). */
  readonly label?: string;
  /** The id of the heading that names the list (usually the section's H2 names the section). */
  readonly labelledBy?: string;
  /** Board context classes on the `ol`. */
  readonly className?: string;
}

/**
 * A record's history, newest first (`ol.xr-timeline` > `li.xr-tl` with a decorative
 * `span.xr-tl-dot` and the `xr-tl-what` / `xr-tl-when` / `xr-tl-note` lines; board 03 "Timeline ·
 * history last on a record", B2-03, B5-06 — 39 boards). Who · when · note, in the caller's words.
 */
export function Timeline({
  events,
  markLatest = true,
  lineElement: Line = 'div',
  label,
  labelledBy,
  className,
}: TimelineProps) {
  return (
    <ol
      className={joinClasses('xr-timeline', className)}
      aria-label={label}
      aria-labelledby={labelledBy}
    >
      {events.map((event, index) => (
        <li
          key={event.id}
          className={joinClasses('xr-tl', markLatest && index === 0 && 'is-latest')}
        >
          <span className="xr-tl-dot" aria-hidden="true" />
          <div>
            <Line className="xr-tl-what">{event.what}</Line>
            <Line className="xr-tl-when">{event.when}</Line>
            {event.note !== undefined && event.note !== null && event.note !== '' ? (
              <Line className="xr-tl-note">{event.note}</Line>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
