/**
 * Record kinds, references and metadata (Appendix C §1.6, §1.8; ADR-0008 decision 5, X-9).
 *
 * One `RecordKind` union with board naming: `FMAP` for the Faculty-course mapping (B2-09
 * "FMAP-0021"; candidate-matrix rows keyed `FCM` refer to it) and `COMP` for the system-owned
 * format completion, separate from runtime activity `RUN` (ADR-0006).
 */
import type { IsoInstant } from './time.js';

export const RECORD_KINDS = [
  'REQ',
  'INST',
  'ACC',
  'SACC',
  'PER',
  'GRP',
  'FMAP',
  'CCODE',
  'AREA',
  'CRS',
  'EXP',
  'SUB',
  'UPD',
  'RUN',
  'COMP',
  'FB',
  'RES',
  'ASMT',
  'ATT',
  'Q',
  'DTR',
  'SUP',
  'ROLE',
] as const;

export type RecordKind = (typeof RECORD_KINDS)[number];

export interface RecordRef {
  readonly kind: RecordKind;
  readonly id: string;
}

export function ref(kind: RecordKind, id: string): RecordRef {
  return { kind, id };
}

/**
 * `rev` +1 on every write (commands carry `expectedRev`; a mismatch is `stale-version` in the
 * service layer). `createdAt` / `updatedAt` drive "last change" columns (Appendix C §1.8 [P]).
 */
export interface RecordMeta {
  readonly rev: number;
  readonly createdAt: IsoInstant;
  readonly updatedAt: IsoInstant;
}

export function newMeta(now: IsoInstant): RecordMeta {
  return { rev: 1, createdAt: now, updatedAt: now };
}

/** The metadata of the next revision of a record written at `now`. */
export function nextMeta(record: RecordMeta, now: IsoInstant): RecordMeta {
  return { rev: record.rev + 1, createdAt: record.createdAt, updatedAt: now };
}
