/**
 * The status token a saved world keeps in place of the real one (TE-6; ADR-0009): never a usable
 * ticket. A browser session never holds it as a ticket and no kept ticket ever carries it, so a
 * restored world, where every request carries one, opens nothing through it.
 */
const WITHHELD = 'withheld:';

/** The placeholder a snapshot keeps for a request's status token. */
export function withheldToken(requestId: string): string {
  return `${WITHHELD}${requestId}`;
}

/** Whether a value is a withheld placeholder (of any request), never a ticket. */
export function isWithheldToken(value: string): boolean {
  return value.startsWith(WITHHELD);
}
