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

/**
 * A page outside the workspaces (the sign-in card, XS-01) records its address, so the move from
 * it into a workspace counts as a navigation too: after signing in, focus moves to the
 * workspace's main content rather than staying lost with the sign-in button that has gone.
 */
export function noteEntryAddress(pathname: string): void {
  lastAddress = pathname;
}

/** The interim landing calls this right before it replaces its address with `target`. */
export function noteInterimLanding(target: string): void {
  landingTarget = target;
}

/** The element a flow asks focus to land on when it arrives at an address (Package 1C). */
let arrival: { readonly pathname: string; readonly elementId: string } | null = null;

/**
 * A flow that moves to its result page calls this right before the move: when that address is
 * shown, focus goes to the element with this id (`tabIndex=-1`) instead of `main` — B1-07 moves
 * focus to the "Request sent" heading after Submit (`reqFocus(pid + '-h1s')`). If the element is
 * not there, focus goes to `main` as after any move.
 */
export function noteRouteFocus(pathname: string, elementId: string): void {
  arrival = { pathname, elementId };
}

function focusArrival(pathname: string): boolean {
  const wanted = arrival;
  if (!wanted || wanted.pathname !== pathname) return false;
  arrival = null;
  const element = document.getElementById(wanted.elementId);
  if (!element) return false;
  if (element !== document.activeElement) element.focus({ preventScroll: true });
  return true;
}

export const MAIN_ID = 'main';

export function focusMain(): void {
  const main = document.getElementById(MAIN_ID);
  if (main && main !== document.activeElement) main.focus({ preventScroll: true });
}

/**
 * A public page reached at an in-page address (`/#for-institutions`, PU-14; Package 1B): focus
 * goes to that section's heading (`tabIndex=-1`) instead of `main`, without a second scroll — the
 * router has scrolled the section into view. False when the address names no such target.
 */
function focusHashTarget(hash: string): boolean {
  if (hash.length < 2) return false;
  const section = document.getElementById(decodeURIComponent(hash.slice(1)));
  const heading = section?.querySelector<HTMLElement>('h2[tabindex="-1"]');
  if (!heading) return false;
  if (heading !== document.activeElement) heading.focus({ preventScroll: true });
  return true;
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
    if (focusArrival(pathname)) return;
    if (focusHashTarget(window.location.hash)) return;
    focusMain();
  }, [pathname]);

  // A link to the page already shown changes no address — choosing the current destination in
  // the drawer, for one: focus would stay on a link the drawer has just hidden.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      // The workspace shell, and the public shell (Package 1B: `div.xp`).
      if (!(link instanceof HTMLAnchorElement) || !link.closest('.xr-app, .xp')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname) return;
      // "For institutions" on the landing itself (public shell only): the router scrolls, focus
      // follows the section. A link that handles its own click (a workspace jump link such as
      // "Go to decision" moves focus itself) is left alone — read once the click has run.
      if (url.hash !== '') {
        if (url.hash === `#${MAIN_ID}` || !link.closest('.xp')) return;
        window.setTimeout(() => {
          if (!event.defaultPrevented) focusHashTarget(url.hash);
        }, 0);
        return;
      }
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
  arrival = null;
}
