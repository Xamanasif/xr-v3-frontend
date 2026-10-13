/**
 * The in-tab command lock (Appendix D §1.4 step 1, option A): commands run one at a time, in the
 * order they were called. Every command body runs synchronously once it holds the lock — it reads
 * the latest world, decides and commits without awaiting — so no other write can interleave with
 * it (a synchronous stand-in report can only run between two command bodies, never inside one).
 * Option B (TE-6, not authorised) would replace this with `navigator.locks`.
 */
export class Mutex {
  #tail: Promise<unknown> = Promise.resolve();

  run<T>(work: () => T | Promise<T>): Promise<T> {
    const result = this.#tail.then(work);
    this.#tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
