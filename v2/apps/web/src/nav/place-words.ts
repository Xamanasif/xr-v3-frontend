import { HELP_TITLE } from './help';
import { REQUESTS_TITLE } from './requests';
import { resolveAddress } from './routes';

/**
 * The return address in words, for XS-03 "Session expired" (B1-09 f9: "Sign in again to go back
 * to where you were: My courses › Shell-and-Tube Heat Exchanger" — "Return address kept and
 * shown"). PROVISIONAL rule (state-copy `XS-03.return-place`):
 *
 * - Only an address of a built page has words: the page's crumbs and title as its top bar shows
 *   them, joined with " › " as B1-09 writes the place. Any other address has none — never the
 *   address itself (board 08 "Never show route names").
 * - The address is untrusted text (a link can carry any `returnTo`). A record's reference is shown
 *   only when it has the shape the boards give references (`REQ-0042`, `SUP-0213`); anything
 *   else names the list alone, so no sentence can be written into the sign-in card through a link.
 * - Whether the person may go back there is decided after sign-in (`return-to.ts`), not here.
 */
const REFERENCE = /^[A-Z]{2,5}-\d{4}$/;

function referenceIn(path: string): string | null {
  const last =
    path
      .split('/')
      .filter((part) => part !== '')
      .at(-1) ?? '';
  let decoded: string;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    return null;
  }
  return REFERENCE.test(decoded) ? decoded : null;
}

export function placeWordsOf(returnTo: string | null): string | null {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return null;
  const pathname = returnTo.split(/[?#]/, 1)[0]!;
  const outcome = resolveAddress(pathname);
  switch (outcome.kind) {
    case 'screen': {
      if (outcome.view === 'reports') return HELP_TITLE;
      if (outcome.view === 'report') return `${HELP_TITLE} › Report a problem`;
      const reference = referenceIn(pathname);
      return reference ? `${HELP_TITLE} › ${reference}` : HELP_TITLE;
    }
    case 'record-screen': {
      if (outcome.screen === 'SA-02') return REQUESTS_TITLE;
      const reference = referenceIn(pathname);
      return reference ? `${REQUESTS_TITLE} › ${reference}` : REQUESTS_TITLE;
    }
    default:
      return null;
  }
}
