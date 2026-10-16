/**
 * The flash a holder's page shows when it is opened straight after registering them (SA-16 →
 * SA-17; Appendix A routes.json SA-16 “Register success: opens the new holder on SA-17 with a
 * flash”; B7-08 `doReg`). Held in module memory for the tab, for that one holder, until the page
 * has shown it — never in storage or the address, so a reload or a later visit shows no flash.
 */
/** The holder's name (`h1#role-holder-title`), where focus lands when the page opens this way. */
export const HOLDER_TITLE_ID = 'role-holder-title';

let pending: { readonly holderId: string; readonly words: string } | null = null;

/** SA-16 calls this right before it opens the new holder. */
export function noteArrival(holderId: string, words: string): void {
  pending = { holderId, words };
}

/** The flash waiting for this holder's page, if any (read while rendering; nothing is cleared). */
export function arrivalFor(holderId: string): string | null {
  return pending?.holderId === holderId ? pending.words : null;
}

/** The page has shown it: a later visit shows none. */
export function forgetArrival(holderId: string): void {
  if (pending?.holderId === holderId) pending = null;
}
