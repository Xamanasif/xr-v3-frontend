/**
 * FA-15's return protocol (state-copy `FA-15.after-add`): Create assessment (FA-07 step 3) and an
 * assessment's Questions tab (FA-09) open "Add a question" with `?returnTo=<their address>`; after
 * saving, FA-15 goes back there with `added=<questionId>` so they can pick the new question up.
 * Only a same-origin path under `/faculty/` is honoured — anything else is ignored, so the address
 * can never send the person to another site or another workspace.
 */
const BASE = 'http://return-to.invalid';

/** The `returnTo` value when it is a same-origin path under `/faculty/`, else `null`. */
export function safeReturnTo(value: string | null): string | null {
  if (!value || !value.startsWith('/faculty/')) return null;
  const control = [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (value.includes('\\') || control) return null;
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE || !url.pathname.startsWith('/faculty/')) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The return address with `added=<questionId>` set (replacing any earlier `added`). */
export function withAdded(returnTo: string, questionId: string): string {
  const url = new URL(returnTo, BASE);
  url.searchParams.set('added', questionId);
  return `${url.pathname}${url.search}${url.hash}`;
}
