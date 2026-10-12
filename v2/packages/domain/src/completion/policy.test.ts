/**
 * The completion seam (WP-0.3, docs/decisions/ADR-0006). Owner binding constraint BC3:
 * "Completed" is set by the system, never by the Student, and never inferred from a launch.
 * The completing event itself is still open (T-12), so the only policy is provisional.
 */
import { describe, expect, it } from 'vitest';

// @ts-expect-error -- SimulationStatus must not be reachable from the package root (no UI path)
import type { SimulationStatus as _NotPublic } from '../index.js';
import * as domain from '../index.js';
import type { RuntimeEventRecord, RuntimeEventType } from '../runtime/events.js';
import { deriveSimulationUtilisation, foldSessions } from '../runtime/utilisation.js';
import { type CompletionPolicy, interimCompletionPolicy } from './policy.js';

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

const T0 = '2026-10-12T10:00:00.000Z';
const T1 = '2026-10-12T10:30:00.000Z';
const T2 = '2026-10-12T11:30:00.000Z';

const acceptsEverything: CompletionPolicy = {
  id: 'test-accepts-everything',
  status: 'provisional',
  isCompletion: () => true,
};
const acceptsNothing: CompletionPolicy = {
  id: 'test-accepts-nothing',
  status: 'provisional',
  isCompletion: () => false,
};

describe('interimCompletionPolicy', () => {
  it('is provisional: the completing event (T-12) is not decided', () => {
    expect(interimCompletionPolicy.status).toBe('provisional');
  });

  it('counts only a completion report from a launched or started session', () => {
    const report = ev('SIMULATION_COMPLETED', 'S1', T1);
    const opened = { sessionLaunched: true, sessionStarted: true };
    expect(interimCompletionPolicy.isCompletion(report, opened)).toBe(true);
    expect(
      interimCompletionPolicy.isCompletion(report, {
        sessionLaunched: false,
        sessionStarted: false,
      }),
    ).toBe(false);
    for (const type of [
      'SIMULATION_LAUNCHED',
      'SESSION_STARTED',
      'SESSION_ENDED',
      'SIMULATION_ERROR',
    ] as const) {
      expect(interimCompletionPolicy.isCompletion(ev(type, 'S1', T1), opened)).toBe(false);
    }
  });
});

describe('a simulation launch never marks a format Completed', () => {
  it('launch, start and a long session leave the format in progress, not completed', () => {
    const result = deriveSimulationUtilisation(
      [
        ev('SIMULATION_LAUNCHED', 'S1', T0),
        ev('SESSION_STARTED', 'S1', T0),
        ev('SESSION_ENDED', 'S1', T2, { durationSeconds: 5400 }),
      ],
      'web',
    );
    expect(result.completed).toBe(false);
    expect(result.completedAt).toBeNull();
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('holds even when the injected policy would accept anything: only reports reach a policy', () => {
    const fold = foldSessions(
      [
        ev('SIMULATION_LAUNCHED', 'S1', T0),
        ev('SESSION_STARTED', 'S1', T0),
        ev('SESSION_ENDED', 'S1', T1),
        ev('SIMULATION_ERROR', 'S1', T1),
      ],
      acceptsEverything,
    );
    expect(fold.completed).toBe(false);
  });
});

describe('the policy is injectable', () => {
  it('a policy can refuse a report the interim rule would accept', () => {
    const events = [
      ev('SIMULATION_LAUNCHED', 'S1', T0),
      ev('SESSION_STARTED', 'S1', T0),
      ev('SIMULATION_COMPLETED', 'S1', T1),
    ];
    expect(foldSessions(events).completed).toBe(true); // default = interim rule
    expect(foldSessions(events, acceptsNothing).completed).toBe(false);
    expect(deriveSimulationUtilisation(events, 'web', acceptsNothing).status).toBe('IN_PROGRESS');
  });

  it('the first counted report sets the date and a repeat never moves it', () => {
    const fold = foldSessions(
      [
        ev('SIMULATION_LAUNCHED', 'S1', T0),
        ev('SIMULATION_COMPLETED', 'S1', T1),
        ev('SIMULATION_COMPLETED', 'S1', T2),
      ],
      interimCompletionPolicy,
    );
    expect(fold.completedAt).toBe(T1);
  });
});

describe('public surface', () => {
  it('exposes the completion seam and the activity fold, not the runtime-adapter status', () => {
    expect(domain.interimCompletionPolicy).toBe(interimCompletionPolicy);
    expect(typeof domain.foldSessions).toBe('function');
    expect('deriveSimulationUtilisation' in domain).toBe(false);
  });
});
