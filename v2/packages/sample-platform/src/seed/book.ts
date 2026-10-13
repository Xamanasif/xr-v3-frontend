/**
 * The seed's record book (Appendix F §3.7 `seed/`): the spine-start world is assembled here from
 * the frozen boards' sample data — pure, deterministic, no clock and no random source. Each record
 * is written once with the date the boards draw, and carries a `seedNote` naming its board frame
 * (T-36: "marked as sample" lives in seed metadata, never in product chrome).
 *
 * Sample times are read as Indian local time (Appendix C §1.2): `ist('2026-10-02 10:14')`.
 */
import {
  type ActorRef,
  calendarDate,
  type CalendarDate,
  historyEntry,
  type HistoryEntry,
  type IsoInstant,
  isoInstant,
  newMeta,
  type PersonActorRef,
  type RecordKind,
  type RecordMeta,
  type RecordRef,
  type Audience,
  type SystemActorRef,
  unsafeBrand,
} from '@xr/domain';

import { EMPTY_ID_STATE, type IdSourceState, StagedIds } from '../ids/id-source.js';
import {
  EMPTY_RECORDS,
  type RecordOf,
  refKey,
  type SeedNote,
  TABLE_KIND,
  type TableName,
  type WorldRecords,
} from '../world/types.js';

/** A board time read as Indian local time: `'2026-10-02 10:14'` → the canonical UTC instant. */
export function ist(local: string): IsoInstant {
  const [date, time = '00:00'] = local.split(' ');
  return isoInstant(new Date(`${date}T${time}:00.000+05:30`).toISOString());
}

export function day(text: string): CalendarDate {
  return calendarDate(text);
}

/** `rev` and dates of a record written at `created` and last changed at `updated`. */
export function meta(created: IsoInstant, updated: IsoInstant = created, rev = 1): RecordMeta {
  return { ...newMeta(created), rev, updatedAt: updated };
}

export class SeedBook {
  #records: Record<string, Record<string, unknown>> = { ...EMPTY_RECORDS } as never;
  readonly ids: StagedIds;
  readonly notes: Record<string, SeedNote> = {};

  constructor(idState: IdSourceState = EMPTY_ID_STATE) {
    // The seed writes its drawn ids itself; it mints only opaque ids and history ids.
    this.ids = new StagedIds(idState, () => false);
  }

  put<T extends TableName>(
    table: T,
    key: string,
    record: RecordOf<T>,
    note?: SeedNote,
  ): RecordOf<T> {
    const current = this.#records[table] ?? {};
    if (Object.hasOwn(current, key)) throw new Error(`The seed writes ${table} ${key} twice.`);
    this.#records = { ...this.#records, [table]: { ...current, [key]: record } };
    if (note) this.notes[refKey({ kind: TABLE_KIND[table], id: key })] = note;
    return record;
  }

  /** Rewrites a record the seed wrote earlier (a later drawn event on the same record). */
  replace<T extends TableName>(table: T, key: string, record: RecordOf<T>): void {
    const current = this.#records[table] ?? {};
    if (!Object.hasOwn(current, key))
      throw new Error(`The seed has no ${table} ${key} to replace.`);
    this.#records = { ...this.#records, [table]: { ...current, [key]: record } };
  }

  get<T extends TableName>(table: T, key: string): RecordOf<T> {
    const record = this.#records[table]?.[key];
    if (!record) throw new Error(`The seed has no ${table} ${key}.`);
    return record as RecordOf<T>;
  }

  get records(): WorldRecords {
    return this.#records as unknown as WorldRecords;
  }

  /** One history entry, with the seed's next history id. */
  entry<E extends string>(input: {
    readonly event: E;
    readonly at: IsoInstant;
    readonly actor: ActorRef;
    readonly note?: string | null;
    readonly visibleTo: readonly Audience[];
    readonly refs?: readonly RecordRef[];
  }): HistoryEntry<E> {
    return historyEntry({ ...input, id: this.ids.next('history') });
  }
}

export function refOfKind(kind: RecordKind, id: string): RecordRef {
  return { kind, id };
}

/** A person's actor reference as the history shows it. */
export function personRef(
  personId: string,
  role: PersonActorRef['role'],
  displayName: string,
): PersonActorRef {
  return { kind: 'person', personId: unsafeBrand(personId), role, displayName };
}

export function systemRef<S extends SystemActorRef['system']>(system: S): SystemActorRef<S> {
  return { kind: 'system', system } as SystemActorRef<S>;
}

/** A requester (public) actor, as a request's history names its contact. */
export function requesterRef(name: string): ActorRef {
  return { kind: 'requester', name };
}

/** The Super Admin as every seeded decision names them (B7: "Arjun Mehta"). */
export const SUPER_ADMIN_ID = 'sa-arjun-mehta';
export const ARJUN = personRef(SUPER_ADMIN_ID, 'super_admin', 'Arjun Mehta');

export function note(evidence: string, text: string): SeedNote {
  return { evidence, note: text };
}
