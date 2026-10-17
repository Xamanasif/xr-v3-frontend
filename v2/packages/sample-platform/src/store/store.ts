/**
 * The one world of a browser tab (BC14; ADR-0004): the latest committed world, the in-tab lock that
 * serialises commands, the persistence driver and the change bus. With the browser snapshot (TE-6,
 * a local prototype build) the world is shared by the tabs of one browser: commands also hold the
 * cross-tab lock, and a newer world another tab saved is adopted before a command runs.
 */
import type { RecordRef } from '@xr/domain';

import type { PersistenceDriver } from '../persistence/memory.js';
import type { World } from '../world/types.js';
import { type ChangeEvent, ChangeBus, type ChangeListener } from './bus.js';
import { Mutex } from './mutex.js';

/** The world was reset in another tab: this page load must start again (TE-6). */
export class ForeignWorldError extends Error {
  override readonly name = 'ForeignWorldError';

  constructor() {
    super('The sample world was reset in another tab.');
  }
}

export class WorldStore {
  #world: World;
  readonly #mutex = new Mutex();
  readonly #bus = new ChangeBus();
  readonly #driver: PersistenceDriver;
  readonly #adopted = new Set<() => void>();
  readonly #foreign = new Set<() => void>();

  constructor(world: World, driver: PersistenceDriver) {
    this.#world = world;
    this.#driver = driver;
    driver.save(world);
  }

  /** The latest committed world. */
  get world(): World {
    return this.#world;
  }

  get persistence(): PersistenceDriver['kind'] {
    return this.#driver.kind;
  }

  /** Runs a command body under the in-tab lock (and the cross-tab one, on the latest world). */
  serialize<T>(work: () => T): Promise<T> {
    const exclusive = this.#driver.exclusive?.bind(this.#driver);
    return this.#mutex.run(() =>
      exclusive
        ? exclusive(() => {
            if (this.sync() === 'foreign') throw new ForeignWorldError();
            return work();
          })
        : work(),
    );
  }

  /**
   * Adopts a newer world another tab saved (TE-6); `foreign` when the world was reset elsewhere.
   * Adopting tells the `onAdopted` listeners (every answer may have changed); it never commits.
   */
  sync(): 'current' | 'adopted' | 'foreign' {
    const fresher = this.#driver.fresher?.(this.#world) ?? null;
    if (fresher === null) return 'current';
    if (fresher === 'foreign') {
      for (const listener of [...this.#foreign]) listener();
      return 'foreign';
    }
    this.#world = fresher;
    for (const listener of [...this.#adopted]) listener();
    return 'adopted';
  }

  /** Replaces the world with its next version and publishes what changed. */
  commit(next: World, changed: readonly RecordRef[]): void {
    if (next.worldVersion !== this.#world.worldVersion + 1) {
      throw new Error(
        `World version ${next.worldVersion} does not follow ${this.#world.worldVersion}.`,
      );
    }
    this.#world = next;
    this.#driver.save(next);
    const event: ChangeEvent = { worldVersion: next.worldVersion, changed };
    this.#bus.publish(event);
  }

  /** Keeps a command's receipt when nothing changed: the same world version, nothing published. */
  keep(next: World): void {
    if (next.worldVersion !== this.#world.worldVersion || next.records !== this.#world.records) {
      throw new Error('Only a receipt may be kept without a new world version.');
    }
    this.#world = next;
    this.#driver.save(next);
  }

  subscribe(listener: ChangeListener): () => void {
    return this.#bus.subscribe(listener);
  }

  /** Called after a newer world from another tab is adopted (TE-6). */
  onAdopted(listener: () => void): () => void {
    this.#adopted.add(listener);
    return () => {
      this.#adopted.delete(listener);
    };
  }

  /** Called when another tab reset the world (TE-6): this page load must start again. */
  onForeign(listener: () => void): () => void {
    this.#foreign.add(listener);
    return () => {
      this.#foreign.delete(listener);
    };
  }
}
