/**
 * DRAFT — runtime utilisation event ingestion contract.
 *
 * Transcribed from RUNTIME_INTEGRATION_CONTRACT.md §4 (the field set) and §5 (the
 * ingestion rules the API must enforce). No endpoint serves this in Phase 0; the wire
 * schema is published as an OpenAPI component so native clients can code against it.
 * `tenantId` and `recordedAt` are set by the platform, never sent by a client;
 * `personId` must match the authenticated principal. Batch size is an engineering
 * judgement.
 *
 * Wire vs accepted: `runtimeEventInputSchema` is the representable WIRE form (what a
 * client sends; `occurredAt` is an RFC 3339 date-time with offset). The ACCEPTED form
 * applies the platform's explicit normalisation of the runtime clock to canonical UTC
 * and is never published.
 */
import { RUNTIME_EVENT_TYPES, RUNTIME_SOURCES, TECHNOLOGIES } from '@xr/domain';
import { identifier, isoInstantWire, normaliseInstant } from '@xr/validation';
import { z } from 'zod';

import { wireSchema } from './openapi.js';

export const runtimeEventInputSchema = wireSchema(
  z.object({
    /** Idempotency key minted by the CLIENT — a retry is a success, never a second event. */
    clientEventId: identifier,
    type: z.enum(RUNTIME_EVENT_TYPES),
    /** Correlates every event of one run. Required: an unattributable event is worse than none. */
    sessionId: identifier,
    personId: identifier,
    experimentId: identifier,
    technology: z.enum(TECHNOLOGIES),
    contentRecordId: identifier.optional(),
    contentVersionLabel: z.string().max(100).optional(),
    source: z.enum(RUNTIME_SOURCES),
    /** The RUNTIME's clock, RFC 3339 with an explicit offset. */
    occurredAt: isoInstantWire,
    /** SESSION_ENDED only, where the client measured it. */
    durationSeconds: z.number().nonnegative().optional(),
    detail: z.record(z.string(), z.unknown()).optional(),
  }),
  'input',
);
export type RuntimeEventInput = z.input<typeof runtimeEventInputSchema>;

/** Accepted form: the wire form with the runtime clock normalised to canonical UTC. Not published. */
export const runtimeEventAcceptedSchema = runtimeEventInputSchema.transform((event) => ({
  ...event,
  occurredAt: normaliseInstant(event.occurredAt),
}));
export type RuntimeEventAccepted = z.output<typeof runtimeEventAcceptedSchema>;

export const RUNTIME_EVENT_BATCH_MAX = 500;

export const runtimeEventBatchSchema = wireSchema(
  z.object({
    events: z.array(runtimeEventInputSchema).min(1).max(RUNTIME_EVENT_BATCH_MAX),
  }),
  'input',
);
export type RuntimeEventBatch = z.input<typeof runtimeEventBatchSchema>;
