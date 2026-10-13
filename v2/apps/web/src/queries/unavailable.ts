/**
 * The one service answer the query layer throws (Appendix F §4.6; ADR-0008 decision 2): a port
 * that answers `unavailable` failed for now, which drives the drawn "failed, try again · Nothing
 * was lost" state. Every other refusal — not permitted, not found, invalid state, stale version,
 * validation, policy-open — is a value the screen renders, never an exception.
 */
export class ServiceUnavailableError extends Error {
  override readonly name = 'ServiceUnavailableError';
  readonly kind = 'unavailable';

  constructor() {
    super('The service is unavailable for now; nothing was changed.');
  }
}

/** Is this answer a port `Result` refusing with `unavailable`? */
export function isUnavailable(answer: unknown): boolean {
  if (typeof answer !== 'object' || answer === null) return false;
  const result = answer as { readonly ok?: unknown; readonly error?: { readonly kind?: unknown } };
  return result.ok === false && result.error?.kind === 'unavailable';
}

/** Passes every answer through, except `unavailable`, which it throws. */
export function throwIfUnavailable<A>(answer: A): A {
  if (isUnavailable(answer)) throw new ServiceUnavailableError();
  return answer;
}
