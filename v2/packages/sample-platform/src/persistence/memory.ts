/**
 * Persistence (ADR-0004, option A): one world per browser tab, in memory. A reload or a full
 * navigation rebuilds the tab's world from the seed. Nothing is written to `localStorage` or
 * IndexedDB, and nothing is shared between tabs — the browser driver (option B: a versioned
 * snapshot, cross-tab updates and locks) is TE-6, which the owner has not authorised; it would
 * implement this same interface.
 */
import type { World } from '../world/types.js';

export interface PersistenceDriver {
  readonly kind: 'memory';
  load(): World | null;
  save(world: World): void;
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
