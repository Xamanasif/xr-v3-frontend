/**
 * Reading and staging records. Composite keys follow the record's identity (Appendix C M16–M19,
 * M23, M08): runtime activity and completion per Student × Experiment × format, a resource opening
 * per Student × resource, an authorised device per Student × format, an institution course code
 * per institution × course, a supplied licence wait per grant × Student.
 */
import type { RecordRef, Technology } from '@xr/domain';

import {
  type RecordOf,
  refKey,
  TABLE_KIND,
  TABLE_NAMES,
  type Table,
  type TableName,
  type World,
  type WorldRecords,
} from './types.js';

export const formatKey = (studentId: string, experimentId: string, format: Technology): string =>
  `${studentId}|${experimentId}|${format}`;
export const resourceKey = (studentId: string, resourceId: string): string =>
  `${studentId}|${resourceId}`;
export const deviceKey = (studentId: string, format: string): string =>
  `device:${studentId}|${format}`;
export const waitKey = (grantId: string, studentId: string): string =>
  `wait:${grantId}|${studentId}`;
export const courseCodeKey = (institutionId: string, courseId: string): string =>
  `${institutionId}|${courseId}`;

export function values<T>(table: Table<T>): T[] {
  return Object.values(table);
}

export function refOf(table: TableName, key: string): RecordRef {
  return { kind: TABLE_KIND[table], id: key };
}

/**
 * Every record the world holds, keyed `KIND:key` (the contract suite's `snapshot`): a read, a
 * preview or a refusal must leave it unchanged, and a command's `changed` lists exactly the keys
 * whose records it changed.
 */
export function snapshotOf(world: World): Readonly<Record<string, unknown>> {
  const snapshot: Record<string, unknown> = {};
  for (const table of TABLE_NAMES) {
    for (const [key, record] of Object.entries(world.records[table])) {
      snapshot[refKey(refOf(table, key))] = record;
    }
  }
  return snapshot;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * The records a command writes, staged over the latest world: reads see the staged writes, the
 * world is untouched until commit, and `changed` lists exactly the records whose contents differ
 * (a record rewritten unchanged is not a change).
 */
export class Transaction {
  readonly #base: WorldRecords;
  #records: WorldRecords;
  readonly #copied = new Set<TableName>();
  readonly #written: { readonly table: TableName; readonly key: string }[] = [];

  constructor(base: WorldRecords) {
    this.#base = base;
    this.#records = base;
  }

  get records(): WorldRecords {
    return this.#records;
  }

  get<T extends TableName>(table: T, key: string): RecordOf<T> | undefined {
    return (this.#records[table] as Table<RecordOf<T>>)[key];
  }

  list<T extends TableName>(table: T): RecordOf<T>[] {
    return values(this.#records[table] as Table<RecordOf<T>>);
  }

  put<T extends TableName>(table: T, key: string, record: RecordOf<T>): void {
    const current = this.#records[table] as Table<RecordOf<T>>;
    const next = this.#copied.has(table) ? current : { ...current };
    this.#copied.add(table);
    (next as Record<string, RecordOf<T>>)[key] = record;
    this.#records = { ...this.#records, [table]: next };
    if (!this.#written.some((entry) => entry.table === table && entry.key === key)) {
      this.#written.push({ table, key });
    }
  }

  /** The records whose contents changed, in the order they were first written. */
  changed(): readonly RecordRef[] {
    return this.#written
      .filter(({ table, key }) => !same(this.#base[table][key], this.#records[table][key]))
      .map(({ table, key }) => refOf(table, key));
  }
}
