'use client';

import { useEffect, useRef } from 'react';

/**
 * “Leave without saving?” (VE-04 leave guard; state-copy `VE-04.leave-guard`): while the editor
 * holds unsaved changes, a click on any link that leaves the editor — in the page (Cancel, the
 * breadcrumbs) or in the shell (the rail, the Menu drawer, the account menu's Help) — is held back
 * and handed to `onLeave` with the address it pointed to; the editor then asks. The shell is not
 * changed: the click is caught on `window` before React or the router see it and only its default
 * is prevented, so the shell still closes its drawer or menu as for any link, and the router's link
 * does not move (it skips a click whose default is prevented). Links within the same address (an
 * error summary's `#field`), new-tab and modified clicks, downloads and other origins pass.
 */
export function useLeaveGuard({
  active,
  here,
  onLeave,
}: {
  /** The editor shows its form and what is typed differs from what was last saved. */
  readonly active: boolean;
  /** The address on show (`pathname` + `search`). */
  readonly here: string;
  readonly onLeave: (destination: string) => void;
}): void {
  const latest = useRef({ here, onLeave });
  useEffect(() => {
    latest.current = { here, onLeave };
  });
  useEffect(() => {
    if (!active) return undefined;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}` === latest.current.here) return;
      event.preventDefault();
      latest.current.onLeave(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [active]);
}
