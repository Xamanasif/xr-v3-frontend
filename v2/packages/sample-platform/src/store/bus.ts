/**
 * The change bus (Appendix F §3.7 `events/`, §4.7): after every commit it publishes the world
 * version and the exact records that changed, so the query layer invalidates by record kind
 * (WP-0.12) and tests can watch the world. It carries domain facts for invalidation and tests
 * only — no adapter sends a notification, reminder or message (T-34).
 */
import type { RecordRef } from '@xr/domain';

export interface ChangeEvent {
  readonly worldVersion: number;
  readonly changed: readonly RecordRef[];
}

export type ChangeListener = (event: ChangeEvent) => void;

export class ChangeBus {
  readonly #listeners = new Set<ChangeListener>();

  subscribe(listener: ChangeListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** A listener that throws never undoes the commit or silences the others. */
  publish(event: ChangeEvent): void {
    for (const listener of [...this.#listeners]) {
      try {
        listener(event);
      } catch (error) {
        queueMicrotask(() => {
          throw error;
        });
      }
    }
  }
}
