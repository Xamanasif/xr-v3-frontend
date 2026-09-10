/**
 * Instant in time — the WIRE form and the ACCEPTED form, deliberately separate.
 *
 * Wire form (`isoInstantWire`): an RFC 3339 date-time with an explicit offset
 * (`Z` or `±HH:MM`), expressed with Zod's standard `z.iso.datetime()` so that the
 * OpenAPI document carries the identical constraint through the standard JSON
 * Schema mechanism (`format: date-time` plus Zod's own pattern). Runtime validation
 * and the published contract are the same rule: an impossible calendar value such as
 * 2026-02-30 is refused by both. No hand-written date regex, no hidden refinement.
 *
 * Accepted form (`isoInstant`): the wire form normalised to canonical UTC, so that
 * string comparison orders instants correctly (RUNTIME_INTEGRATION_CONTRACT.md §4.3:
 * '2026-09-01T15:30:00+05:30' and the same instant written as UTC must sort together).
 * The normalisation is an explicit application step on ACCEPTANCE; it is never part
 * of a published wire schema, because a transform cannot be represented in OpenAPI.
 *
 * Deliberate tightening versus the prototype's regular expression: RFC 3339 requires
 * seconds, so '2026-09-01T10:00Z' is refused on the wire. The prototype's rule that a
 * non-ISO serialisation such as 'Sep 1, 2026 10:00:00 GMT' is refused rather than
 * silently replaced with "now" is preserved.
 */
import { z } from 'zod';

export const ISO_INSTANT_DESCRIPTION =
  'RFC 3339 date-time with an explicit offset, e.g. 2026-09-01T10:00:00Z or 2026-09-01T15:30:00+05:30';

/** Wire form — representable in JSON Schema, no transformation, no custom refinement. */
export const isoInstantWire = z.iso.datetime({ offset: true }).describe(ISO_INSTANT_DESCRIPTION);

export function isIsoInstant(value: unknown): value is string {
  return isoInstantWire.safeParse(value).success;
}

/** Canonical UTC form (`toISOString()`), so string comparison orders instants correctly. */
export function normaliseInstant(value: string): string {
  return new Date(value).toISOString();
}

/** Accepted form — the wire form explicitly normalised to canonical UTC. Never published. */
export const isoInstant = isoInstantWire.transform(normaliseInstant);

export type IsoInstant = z.output<typeof isoInstant>;
