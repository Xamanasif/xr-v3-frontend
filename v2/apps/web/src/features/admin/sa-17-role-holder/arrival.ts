import type { FlashWords } from '@/copy/platform-roles';

/**
 * The flash a holder's page shows when it is opened straight after registering them (SA-16 →
 * SA-17; the SA-v1 export's `SA.setFlash` after Register: “<name> is registered as <role>.”).
 * Held in module memory for the tab, for that one holder, until the page has shown it — never in
 * storage or the address, so a reload or a later visit shows no flash.
 */
/** The holder's name (`h1#role-holder-title`), where focus lands when the page opens this way. */
export const HOLDER_TITLE_ID = 'role-holder-title';

let pending: { readonly holderId: string; readonly words: FlashWords } | null = null;

/** SA-16 calls this right before it opens the new holder. */
export function noteArrival(holderId: string, words: FlashWords): void {
  pending = { holderId, words };
}

/** The flash waiting for this holder's page, if any (read while rendering; nothing is cleared). */
export function arrivalFor(holderId: string): FlashWords | null {
  return pending?.holderId === holderId ? pending.words : null;
}

/** The page has shown it: a later visit shows none. */
export function forgetArrival(holderId: string): void {
  if (pending?.holderId === holderId) pending = null;
}
