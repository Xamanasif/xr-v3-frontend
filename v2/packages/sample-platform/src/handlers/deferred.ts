/**
 * The methods that land with their screens in a later phase (method ledger `mock` ≠ WP-0.11;
 * Appendix F §4.1). The port keeps its full surface (every method exists), but a call is a
 * programming error until its phase builds it: it rejects, naming the phase, and is never
 * answered with a made-up value. The contract suite never calls them against this adapter.
 */
import { DELIVERED_METHODS, type MethodId } from '@xr/contracts/draft';

import { rowOf } from '../pipeline/ledger.js';

export class NotInThisPhase extends Error {
  override readonly name = 'NotInThisPhase';
}

export function deferred(method: MethodId): (...args: unknown[]) => Promise<never> {
  const phase = rowOf(method).mock;
  if (phase === 'WP-0.11')
    throw new Error(`${method} is a WP-0.11 method and must be implemented.`);
  if (DELIVERED_METHODS.includes(method))
    throw new Error(`${method} was delivered by a later-phase package and must be implemented.`);
  return () =>
    Promise.reject(
      new NotInThisPhase(
        `${method} lands in ${phase} (Appendix F §4.1); WP-0.11 does not build it.`,
      ),
    );
}
