/**
 * Transcribed from the gold standard's deterministic suite (qa/checks.js):
 *   IMPL 09 — only an explicit completion event completes a simulation
 *   IMPL 09 — one technology cannot complete another
 *   IMPL 09 — a session row is only a RUN when something opened it
 *   IMPL 09 — the fold survives a disagreeing clock, and an error is never swallowed
 *   IMPL 09 — utilisation is derived from runtime events, and from nothing else
 */
import { describe, expect, it } from 'vitest';

import type { Technology } from '../technology.js';
import { RUNTIME_EVENT_TYPES, type RuntimeEventRecord, type RuntimeEventType } from './events.js';
import { deriveSimulationUtilisation } from './utilisation.js';

let seq = 0;
function ev(
  type: RuntimeEventType,
  sessionId: string,
  occurredAt: string,
  extra: Partial<RuntimeEventRecord> = {},
): RuntimeEventRecord {
  seq += 1;
  return { type, sessionId, technology: 'web', occurredAt, seq, source: 'web-runtime', ...extra };
}

const T0 = '2026-09-01T10:00:00.000Z';
const T5 = '2026-09-01T10:05:00.000Z';
const T10 = '2026-09-01T10:10:00.000Z';
const T15 = '2026-09-01T10:15:00.000Z';

describe('deriveSimulationUtilisation', () => {
  it('reports NOT_STARTED with no evidence when nothing happened', () => {
    const result = deriveSimulationUtilisation([], 'web');
    expect(result.status).toBe('NOT_STARTED');
    expect(result.evidence).toBe('none');
    expect(result.launches).toBe(0);
    expect(result.totalSeconds).toBe(0);
  });

  it('a finished run is IN_PROGRESS — time and sessions never complete anything', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SIMULATION_LAUNCHED', 'S1', T0),
        ev('SESSION_STARTED', 'S1', T0),
        ev('SESSION_ENDED', 'S1', T5, { durationSeconds: 300 }),
      ],
      'web',
    );
    expect(result.status).toBe('IN_PROGRESS');
    expect(result.launches).toBe(1);
    expect(result.sessionCount).toBe(1);
    expect(result.totalSeconds).toBe(300);
    expect(result.completed).toBe(false);
  });

  it('eight hours of recorded sessions with no completion event is still IN_PROGRESS', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SESSION_STARTED', 'S1', T0),
        ev('SESSION_ENDED', 'S1', '2026-09-01T18:00:00.000Z', { durationSeconds: 8 * 3600 }),
      ],
      'web',
    );
    expect(result.totalSeconds).toBe(8 * 3600);
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('only an explicit SIMULATION_COMPLETED on an opened session completes', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SIMULATION_LAUNCHED', 'S1', T0),
        ev('SESSION_STARTED', 'S1', T0),
        ev('SIMULATION_COMPLETED', 'S1', T5),
        ev('SESSION_ENDED', 'S1', T10, { durationSeconds: 600 }),
      ],
      'web',
    );
    expect(result.status).toBe('COMPLETED');
    expect(result.completedAt).toBe(T5);
  });

  it('a completion for a session nobody opened is recorded but completes nothing', () => {
    const result = deriveSimulationUtilisation([ev('SIMULATION_COMPLETED', 'ghost', T0)], 'web');
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]?.completed).toBe(true);
    expect(result.completed).toBe(false);
    expect(result.sessionCount).toBe(0);
    expect(result.status).toBe('NOT_STARTED');
  });

  it('an error alone is not use', () => {
    const result = deriveSimulationUtilisation([ev('SIMULATION_ERROR', 'S1', T0)], 'web');
    expect(result.errors).toBe(1);
    expect(result.sessionCount).toBe(0);
    expect(result.status).toBe('NOT_STARTED');
  });

  it('one technology cannot complete another', () => {
    const events = [
      ev('SIMULATION_LAUNCHED', 'W1', T0),
      ev('SESSION_STARTED', 'W1', T0),
      ev('SIMULATION_COMPLETED', 'W1', T5),
    ];
    expect(deriveSimulationUtilisation(events, 'web').status).toBe('COMPLETED');
    for (const other of ['vr', 'mr', 'ar'] as Technology[]) {
      const result = deriveSimulationUtilisation(events, other);
      expect(result.status).toBe('NOT_STARTED');
      expect(result.evidence).toBe('none');
    }
  });

  it('a duplicate SESSION_ENDED never adds its duration a second time', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SESSION_STARTED', 'S1', T0),
        ev('SESSION_ENDED', 'S1', T5, { durationSeconds: 300 }),
        ev('SESSION_ENDED', 'S1', T5, { durationSeconds: 300 }),
      ],
      'web',
    );
    expect(result.totalSeconds).toBe(300);
    expect(result.sessionCount).toBe(1);
  });

  it('a duplicate SESSION_STARTED does not start a second run', () => {
    const result = deriveSimulationUtilisation(
      [ev('SESSION_STARTED', 'S1', T0), ev('SESSION_STARTED', 'S1', T5)],
      'web',
    );
    expect(result.sessionCount).toBe(1);
    expect(result.openSessions).toBe(1);
    expect(result.sessions[0]?.startedAt).toBe(T0);
  });

  it('a replayed launch under a fresh key adds neither a launch nor a session', () => {
    const result = deriveSimulationUtilisation(
      [ev('SIMULATION_LAUNCHED', 'S1', T0), ev('SIMULATION_LAUNCHED', 'S1', T0)],
      'web',
    );
    expect(result.launches).toBe(1);
    expect(result.sessionCount).toBe(1);
  });

  it('a session that never ended counts as open and contributes zero seconds', () => {
    const result = deriveSimulationUtilisation([ev('SESSION_STARTED', 'S1', T0)], 'web');
    expect(result.openSessions).toBe(1);
    expect(result.totalSeconds).toBe(0);
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('a new start while another session is open abandons the open one', () => {
    const result = deriveSimulationUtilisation(
      [ev('SESSION_STARTED', 'S1', T0), ev('SESSION_STARTED', 'S2', T5)],
      'web',
    );
    expect(result.sessions[0]?.abandoned).toBe(true);
    expect(result.sessions[0]?.open).toBe(false);
    expect(result.sessions[1]?.open).toBe(true);
    expect(result.openSessions).toBe(1);
  });

  it('an end before its start is zero seconds, never negative; the session is not left open', () => {
    const result = deriveSimulationUtilisation(
      [ev('SESSION_ENDED', 'S1', T0), ev('SESSION_STARTED', 'S1', T5)],
      'web',
    );
    expect(result.totalSeconds).toBe(0);
    expect(result.openSessions).toBe(0);
    expect(result.sessionCount).toBe(1);
  });

  it('a measured duration is preferred over the clock interval', () => {
    const result = deriveSimulationUtilisation(
      [ev('SESSION_STARTED', 'S1', T0), ev('SESSION_ENDED', 'S1', T15, { durationSeconds: 120 })],
      'web',
    );
    expect(result.totalSeconds).toBe(120);
    expect(result.sessions[0]?.measured).toBe(true);
  });

  it('an unmeasured end falls back to the interval between start and end', () => {
    const result = deriveSimulationUtilisation(
      [ev('SESSION_STARTED', 'S1', T0), ev('SESSION_ENDED', 'S1', T10)],
      'web',
    );
    expect(result.totalSeconds).toBe(600);
  });

  it('a repeated completion never moves the date the Student earned it', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SESSION_STARTED', 'S1', T0),
        ev('SIMULATION_COMPLETED', 'S1', T5),
        ev('SESSION_STARTED', 'S2', T10),
        ev('SIMULATION_COMPLETED', 'S2', T15),
      ],
      'web',
    );
    expect(result.completedAt).toBe(T5);
  });

  it('events fold in runtime-clock order regardless of arrival order', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SESSION_ENDED', 'S1', T10, { durationSeconds: 600 }),
        ev('SIMULATION_COMPLETED', 'S1', T5),
        ev('SESSION_STARTED', 'S1', T0),
      ],
      'web',
    );
    expect(result.status).toBe('COMPLETED');
    expect(result.firstActivityAt).toBe(T0);
    expect(result.lastActivityAt).toBe(T10);
  });

  it('the vocabulary contains no content or assessment event — structurally', () => {
    for (const forbidden of [
      'VIDEO_WATCHED',
      'RESOURCE_VIEWED',
      'OUTCOME_MET',
      'ASSESSMENT_PASSED',
    ]) {
      expect(RUNTIME_EVENT_TYPES as readonly string[]).not.toContain(forbidden);
    }
    expect(RUNTIME_EVENT_TYPES).toHaveLength(5);
  });
});
