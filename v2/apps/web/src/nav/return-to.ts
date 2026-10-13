import type { Role } from '@xr/domain';

import { WORKSPACE_BASE } from './nav-config';

/**
 * Where a person goes back to after signing in (ADR-0005 §5; Appendix F §5.2 "Session gate";
 * AD-21, PROVISIONAL rule; B1-09 "Session expired returns them to the page they were on"). The
 * address is honoured only as a same-origin relative path — one leading `/`, no scheme, no
 * authority, no backslash — inside the signed-in role's own workspace base; anything else lands
 * on the role's home. Another workspace's address never does: the person would only meet XS-06
 * there.
 *
 * Unit-tested in Phase 0; it runs end to end when the XS-01 sign-in reads it (Phase 1, G-8).
 */
export function returnToFor(role: Role, requested: string | null | undefined): string {
  const home = WORKSPACE_BASE[role];
  if (typeof requested !== 'string' || !isRelativePath(requested)) return home;
  let url: URL;
  try {
    url = new URL(requested, 'https://return-to.invalid');
  } catch {
    return home;
  }
  if (url.origin !== 'https://return-to.invalid') return home;
  const inside = url.pathname === home || url.pathname.startsWith(`${home}/`);
  return inside ? `${url.pathname}${url.search}${url.hash}` : home;
}

/** A path with exactly one leading slash and nothing a URL parser could read as an authority. */
function isRelativePath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false;
  // Backslashes and control characters are normalised into authorities or dropped by URL parsers.
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (character === '\\' || code < 0x20 || code === 0x7f) return false;
  }
  return true;
}

/**
 * The sign-in address the session gate sends a signed-out visitor to (Appendix F §3.3 notes;
 * Appendix A §3.8 row 1). After the person signs out themselves it carries `reason=signed-out`
 * (XS-03 "Signed out", B1-09 f10) and no return address; otherwise `returnTo` is the address they
 * asked for. XS-01 and its notices are Phase 1 (G-8): until then `/sign-in` resolves to the public
 * not-found page (K-21).
 */
export function signInAddress(
  why: { readonly kind: 'signed-out' } | { readonly kind: 'return'; readonly path: string },
): string {
  if (why.kind === 'signed-out') return '/sign-in?reason=signed-out';
  const path = isRelativePath(why.path) ? why.path : '/';
  return `/sign-in?returnTo=${encodeURIComponent(path)}`;
}
