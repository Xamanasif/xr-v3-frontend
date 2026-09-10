/**
 * Simulation utilisation derived from runtime events — per Student × Experiment × TECHNOLOGY.
 *
 * Transcribed from the gold standard: js/state.js `foldSessions` and
 * `simulationUtilisation` (Implementation 09), whose rules are each pinned by an
 * assertion in qa/checks.js (`IMPL 09 — …` groups). Parity row P-13.
 *
 * The rules, verbatim in meaning:
 *  - events fold in RUNTIME-clock order; ties break on ingestion sequence;
 *  - a SESSION_STARTED for a session already open is IGNORED — the run did not start twice;
 *  - a SESSION_ENDED for a session already ended is IGNORED — a duplicate end may not add
 *    its duration a second time;
 *  - a SESSION_ENDED with no matching start opens and closes in one step, contributing its
 *    reported duration if it has one and nothing if it does not;
 *  - duration prefers what the client MEASURED, falls back to the interval between the
 *    recorded start and end, and is clamped at zero — never negative;
 *  - a session that never ended contributes ZERO seconds and is counted as open;
 *  - a new SESSION_STARTED while another session is open ABANDONS the open one;
 *  - a start that arrives after its own end (a disagreeing device clock) completes the
 *    session; it is not reopened and nothing else is disturbed;
 *  - a COMPLETION IS A REPORT FROM A RUN: a completion whose session was never launched or
 *    started is kept in the session list but completes nothing;
 *  - the FIRST completion is the one that counts; a repeat never moves the date;
 *  - an error alone is not use; launches are counted per session, so a replayed launch
 *    under a fresh key adds nothing;
 *  - COMPLETED needs a completion event and nothing else — not time, not sessions, not
 *    resources, not video, not an assessment, and never another technology.
 *
 * Not transcribed here: the prototype's pre-telemetry baseline (`inheritedLaunches`,
 * `inheritedSeconds`, evidence `mixed`). V2 has no localStorage history to inherit
 * (docs/FUNCTIONAL_PARITY_MATRIX.md P-14).
 */
import type { Technology } from '../technology.js';
import type { RuntimeEventRecord } from './events.js';

export type SimulationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface SessionSummary {
  readonly sessionId: string;
  readonly startedAt: string | null;
  readonly endedAt: string | null;
  readonly seconds: number;
  /** True when the client measured the duration itself. */
  readonly measured: boolean;
  readonly open: boolean;
  readonly launched: boolean;
  readonly started: boolean;
  readonly abandoned: boolean;
  readonly completed: boolean;
  readonly errored: boolean;
}

export interface SessionFold {
  readonly sessions: readonly SessionSummary[];
  /** Sessions something actually opened (launch or start). */
  readonly sessionCount: number;
  readonly openSessions: number;
  readonly launches: number;
  readonly errors: number;
  readonly totalSeconds: number;
  readonly completed: boolean;
  readonly completedAt: string | null;
}

export interface SimulationUtilisation extends SessionFold {
  readonly technology: Technology;
  readonly status: SimulationStatus;
  readonly evidence: 'runtime-events' | 'none';
  readonly firstActivityAt: string | null;
  readonly lastActivityAt: string | null;
  readonly sources: readonly string[];
}

interface MutableSession {
  sessionId: string;
  startedAt: string | null;
  endedAt: string | null;
  seconds: number;
  measured: boolean;
  open: boolean;
  launched: boolean;
  started: boolean;
  abandoned: boolean;
  completed: boolean;
  errored: boolean;
}

/** Runtime-clock order, ingestion sequence as the tie-break. */
export function byRuntimeClock(a: RuntimeEventRecord, b: RuntimeEventRecord): number {
  if (a.occurredAt === b.occurredAt) {
    return (a.seq ?? 0) - (b.seq ?? 0);
  }
  return a.occurredAt < b.occurredAt ? -1 : 1;
}

function secondsBetween(startedAt: string, endedAt: string): number {
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  return Number.isNaN(ms) ? 0 : Math.max(0, Math.round(ms / 1000));
}

function isMeasuredDuration(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Fold an already-ordered list of one technology's events into sessions. */
export function foldSessions(events: readonly RuntimeEventRecord[]): SessionFold {
  const order: MutableSession[] = [];
  const byId = new Map<string, MutableSession>();
  let errors = 0;
  let completed = false;
  let completedAt: string | null = null;

  const session = (id: string): MutableSession => {
    let row = byId.get(id);
    if (!row) {
      row = {
        sessionId: id,
        startedAt: null,
        endedAt: null,
        seconds: 0,
        measured: false,
        open: false,
        launched: false,
        started: false,
        abandoned: false,
        completed: false,
        errored: false,
      };
      byId.set(id, row);
      order.push(row);
    }
    return row;
  };

  for (const event of events) {
    switch (event.type) {
      case 'SIMULATION_LAUNCHED': {
        // Counted per session, not per event: a replayed launch adds nothing.
        session(event.sessionId).launched = true;
        break;
      }
      case 'SESSION_STARTED': {
        const row = session(event.sessionId);
        if (row.startedAt) {
          break; // already open — not a second run
        }
        row.startedAt = event.occurredAt;
        row.started = true;
        if (row.endedAt) {
          // The start arrived after its own end (disagreeing clocks): complete it, never reopen it.
          if (!row.measured) {
            row.seconds = secondsBetween(row.startedAt, row.endedAt);
          }
          break;
        }
        for (const other of order) {
          if (other !== row && other.open) {
            other.open = false;
            other.abandoned = true;
          }
        }
        row.open = true;
        break;
      }
      case 'SESSION_ENDED': {
        const row = session(event.sessionId);
        if (row.endedAt) {
          break; // duplicate end — already counted
        }
        row.endedAt = event.occurredAt;
        row.open = false;
        row.abandoned = false;
        if (isMeasuredDuration(event.durationSeconds)) {
          row.seconds = Math.round(event.durationSeconds);
          row.measured = true;
        } else if (row.startedAt) {
          row.seconds = secondsBetween(row.startedAt, row.endedAt);
        } else {
          row.seconds = 0;
        }
        break;
      }
      case 'SIMULATION_COMPLETED': {
        const row = session(event.sessionId);
        row.completed = true;
        if (!row.launched && !row.started) {
          break; // a completion is a report FROM a run; without one it completes nothing
        }
        if (!completed) {
          completed = true;
          completedAt = event.occurredAt;
        }
        break;
      }
      case 'SIMULATION_ERROR': {
        session(event.sessionId).errored = true;
        errors += 1;
        break;
      }
    }
  }

  let totalSeconds = 0;
  let openSessions = 0;
  let sessionCount = 0;
  let launches = 0;
  for (const row of order) {
    totalSeconds += row.seconds;
    if (row.open) openSessions += 1;
    if (row.launched || row.started) sessionCount += 1;
    if (row.launched) launches += 1;
  }

  return {
    sessions: order.map((row) => ({ ...row })),
    sessionCount,
    openSessions,
    launches,
    errors,
    totalSeconds,
    completed,
    completedAt,
  };
}

/**
 * Utilisation of ONE technology of ONE Experiment for ONE Student, derived from that
 * Student's events for that Experiment. Events of other technologies are ignored,
 * which is what makes "one technology cannot complete another" structural.
 */
export function deriveSimulationUtilisation(
  events: readonly RuntimeEventRecord[],
  technology: Technology,
): SimulationUtilisation {
  const own = events.filter((event) => event.technology === technology).sort(byRuntimeClock);
  const fold = foldSessions(own);
  const used = fold.launches > 0 || fold.sessionCount > 0;
  const status: SimulationStatus = fold.completed
    ? 'COMPLETED'
    : used
      ? 'IN_PROGRESS'
      : 'NOT_STARTED';
  const sources = [...new Set(own.map((event) => event.source).filter((s): s is string => !!s))];

  return {
    ...fold,
    technology,
    status,
    evidence: own.length > 0 ? 'runtime-events' : 'none',
    firstActivityAt: own[0]?.occurredAt ?? null,
    lastActivityAt: own[own.length - 1]?.occurredAt ?? null,
    sources,
  };
}
