/**
 * History and audit (Appendix C §1.6, M28). Every governed record shows "what · when · who ·
 * note". History is written per command **as the boards draw it** — not on every command — and
 * nothing is hard-deleted (BR-126). Words come from per-audience copy tables in the web layer;
 * an entry carries only the canonical event kind and the facts.
 */
import type { ActorRef, Audience } from '../roles.js';
import type { HistoryEntryId } from './ids.js';
import type { RecordRef } from './record.js';
import type { IsoInstant } from './time.js';

export interface HistoryEntry<E extends string> {
  readonly id: HistoryEntryId;
  readonly event: E;
  readonly at: IsoInstant;
  readonly actor: ActorRef;
  /** The reason or note exactly as entered. */
  readonly note: string | null;
  /** Who may read this entry, e.g. a withdrawal reason only by the institution's administrators. */
  readonly visibleTo: readonly Audience[];
  /** The records the entry names (REQ-0042, ACC-0107 …). */
  readonly refs: readonly RecordRef[];
}

export interface HistoryInput<E extends string> {
  readonly id: HistoryEntryId;
  readonly event: E;
  readonly at: IsoInstant;
  readonly actor: ActorRef;
  readonly note?: string | null;
  readonly visibleTo: readonly Audience[];
  readonly refs?: readonly RecordRef[];
}

export function historyEntry<E extends string>(input: HistoryInput<E>): HistoryEntry<E> {
  return {
    id: input.id,
    event: input.event,
    at: input.at,
    actor: input.actor,
    note: input.note ?? null,
    visibleTo: input.visibleTo,
    refs: input.refs ?? [],
  };
}

/** Appends without mutating: history is append-only. */
export function appended<E extends string>(
  history: readonly HistoryEntry<E>[],
  entry: HistoryEntry<E>,
): readonly HistoryEntry<E>[] {
  return [...history, entry];
}
