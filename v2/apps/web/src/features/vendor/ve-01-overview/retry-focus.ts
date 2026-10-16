'use client';

import { useLayoutEffect, useRef } from 'react';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';

/**
 * After “Try again” the button is gone with the failed state: once the read is back, focus moves to
 * the page's main region (`main#main`, the skip link's target) — only if focus was lost with the
 * button (as FA-01 does). VE-01 and VE-02 share it.
 */
export function useRetryFocus(settled: boolean): () => void {
  const pending = useRef(false);
  useLayoutEffect(() => {
    if (!pending.current || !settled) return;
    pending.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    document.getElementById(MAIN_ID)?.focus({ preventScroll: true });
  });
  return () => {
    pending.current = true;
  };
}
