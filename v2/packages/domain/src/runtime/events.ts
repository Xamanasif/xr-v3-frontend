/**
 * Runtime utilisation event vocabulary — the contract a Web / AR / VR / MR
 * runtime reports against (RUNTIME_INTEGRATION_CONTRACT.md §3–§4; PM_DELTA_09.md §4).
 *
 * Five lifecycle events and DELIBERATELY NO CONTENT EVENT. There is no
 * `VIDEO_WATCHED`, no `RESOURCE_VIEWED`, no `OUTCOME_MET` and no assessment event,
 * so no content or assessment action has a path to the simulation state.
 * The names are stored verbatim — they are what a native client sends.
 */
import type { Technology } from '../technology.js';

export const RUNTIME_EVENT_TYPES = [
  'SIMULATION_LAUNCHED',
  'SESSION_STARTED',
  'SESSION_ENDED',
  'SIMULATION_COMPLETED',
  'SIMULATION_ERROR',
] as const;

export type RuntimeEventType = (typeof RUNTIME_EVENT_TYPES)[number];

export function isRuntimeEventType(value: unknown): value is RuntimeEventType {
  return typeof value === 'string' && (RUNTIME_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * Which runtime reported an event. Production sources only — the prototype's
 * stand-in and demo sources (`platform-standin`, `demo-runtime-simulator`,
 * `web-prototype-runtime`) are prototype artefacts and are excluded from V2
 * (docs/FUNCTIONAL_PARITY_MATRIX.md §G).
 */
export const RUNTIME_SOURCES = [
  'web-runtime',
  'ar-native-client',
  'vr-native-client',
  'mr-native-client',
] as const;

export type RuntimeSource = (typeof RUNTIME_SOURCES)[number];

/**
 * The fields the derivation reads. `occurredAt` is the RUNTIME's clock (ISO-8601,
 * normalised to UTC at ingestion); `seq` is the platform's ingestion order and only
 * breaks ties between events carrying one timestamp.
 */
export interface RuntimeEventRecord {
  readonly type: RuntimeEventType;
  readonly sessionId: string;
  readonly technology: Technology;
  readonly occurredAt: string;
  readonly seq?: number;
  /** SESSION_ENDED only, where the client measured it. */
  readonly durationSeconds?: number | null;
  readonly source?: string;
}
