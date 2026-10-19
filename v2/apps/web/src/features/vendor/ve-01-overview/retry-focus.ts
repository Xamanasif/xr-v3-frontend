'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';

/**
 * After “Try again” the button is gone with the failed state: once the reads are back, focus moves
 * to the page's H1 (the export's `L.retry` → `focusId('ve-h1')`) — only if focus was lost with the
 * button. VE-01 and VE-02 share it.
 */
export function useRetryFocus(settled: boolean, target: RefObject<HTMLElement | null>): () => void {
  const pending = useRef(false);
  useLayoutEffect(() => {
    if (!pending.current || !settled) return;
    pending.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    target.current?.focus({ preventScroll: true });
  });
  return () => {
    pending.current = true;
  };
}
