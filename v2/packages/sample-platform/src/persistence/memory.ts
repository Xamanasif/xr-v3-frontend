/**
 * Persistence (ADR-0004): the driver behind the tab's world store. Option A — `memory`, here — is
 * one world per browser tab, in memory: a reload or a full navigation rebuilds the tab's world from
 * the seed, and nothing is shared between tabs. A local prototype build may instead keep the world
 * as a versioned browser snapshot (`snapshot.ts`; TE-6, owner authorisation of Phase 7, 17 Oct
 * 2026), behind this same interface.
 */
import type { World } from '../world/types.js';

export interface PersistenceDriver {
  readonly kind: 'memory' | 'browser-snapshot';
  load(): World | null;
  save(world: World): void;
  /**
   * Runs a command body while every other tab's writers wait (the browser's Web Locks), when the
   * driver shares its world with other tabs; the in-tab lock alone orders commands otherwise.
   */
  exclusive?<T>(work: () => T): Promise<T>;
  /**
   * A newer world of this lineage another tab saved, merged with what only this tab holds — to
   * adopt before a command runs; `foreign` when the world was reset elsewhere; `null` when current.
   */
  fresher?(current: World): World | 'foreign' | null;
}

export function memoryPersistence(): PersistenceDriver {
  let held: World | null = null;
  return {
    kind: 'memory',
    load: () => held,
    save: (world) => {
      held = world;
    },
  };
}
