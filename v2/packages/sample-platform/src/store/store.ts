/**
 * The one world of a browser tab (BC14; ADR-0004 option A): the latest committed world, the
 * in-tab lock that serialises commands, the persistence driver and the change bus.
 */
import type { RecordRef } from '@xr/domain';

import type { PersistenceDriver } from '../persistence/memory.js';
import type { World } from '../world/types.js';
import { type ChangeEvent, ChangeBus, type ChangeListener } from './bus.js';
import { Mutex } from './mutex.js';

export class WorldStore {
  #world: World;
  readonly #mutex = new Mutex();
  readonly #bus = new ChangeBus();
  readonly #driver: PersistenceDriver;

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

  /** Runs a command body under the in-tab lock. */
  serialize<T>(work: () => T): Promise<T> {
    return this.#mutex.run(work);
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
}
