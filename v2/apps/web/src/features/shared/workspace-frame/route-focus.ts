'use client';

import { useEffect } from 'react';

/**
 * Focus after a client-side navigation (WP-0.13; WP-0.8 README "Focus after choosing a destination
 * in the drawer … is route-level focus handling"). Boards 06 and 12 say only that choosing a
 * destination closes the drawer; the drawer then leaves focus on the link it hid. So, once the
 * person has moved to another page of the tab, focus moves to `main` — the skip link's own target
 * (`main.xr-page#main`, `tabIndex=-1`, VD-16) — without scrolling: the next Tab continues in the
 * new page. On a document load nothing moves (the skip link stays the first stop), nor when the
 * interim landing replaces itself with Help (ADR-0005 §8) — only that replacement, which the
 * person did not ask for: another role's bare base shows XS-06 and replaces nothing, so leaving it
 * is an ordinary navigation (WP-0.13 review).
 *
 * The last address is kept per tab, in module state like the platform runtime, so a move between
 * two workspace layouts (XS-06 "Back to Home") counts as a navigation too.
 */
let lastAddress: string | null = null;
/** The address the interim landing is replacing itself with, until that navigation is seen. */
let landingTarget: string | null = null;

/** The interim landing calls this right before it replaces its address with `target`. */
export function noteInterimLanding(target: string): void {
  landingTarget = target;
}

export const MAIN_ID = 'main';

export function focusMain(): void {
  const main = document.getElementById(MAIN_ID);
  if (main && main !== document.activeElement) main.focus({ preventScroll: true });
}

export function useRouteFocus(pathname: string): void {
  useEffect(() => {
    const previous = lastAddress;
    lastAddress = pathname;
    if (previous === null || previous === pathname) return;
    if (landingTarget === pathname) {
      landingTarget = null;
      return;
    }
    focusMain();
  }, [pathname]);

  // A link to the page already shown changes no address — choosing the current destination in
  // the drawer, for one: focus would stay on a link the drawer has just hidden.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || !link.closest('.xr-app')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.hash !== '') return;
      if (url.pathname !== window.location.pathname) return;
      window.setTimeout(focusMain, 0);
    };
    // Capture: the account menu and the drawer remove or hide the chosen link while React handles
    // the click, so the link is read before that.
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}

/** Tests only: a new tab. */
export function forgetLastAddress(): void {
  lastAddress = null;
  landingTarget = null;
}
