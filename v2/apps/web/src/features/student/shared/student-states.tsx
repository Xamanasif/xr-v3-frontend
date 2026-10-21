'use client';

import { type ReactNode, useLayoutEffect, useRef } from 'react';

import { useCurrentSession } from '@/queries/session';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';

import { type Closure, closureOf, firstName } from './student-view';

/**
 * The signed-in Student as the session reads now: the first name for the greeting, the
 * institution for the overline and the closure the banner facts carry (XS-08). `null` while the
 * session is loading.
 */
export function useStudentSession(): {
  readonly firstName: string;
  readonly institutionName: string | null;
  readonly closure: Closure;
} | null {
  const current = useCurrentSession();
  const value = current.data?.ok ? current.data.value : null;
  if (!value) return null;
  return {
    firstName: firstName(value.session.displayName),
    institutionName: value.session.institutionName,
    closure: closureOf(value.banners),
  };
}

/** A course code as the boards set it in a row (`span.xr-id`, B2-10 f1, B2-11 f0). */
export function CodeThen({
  code,
  children,
}: {
  readonly code: string | null;
  readonly children?: ReactNode;
}) {
  if (code === null) return <>{children}</>;
  return (
    <>
      <span className="xr-id">{code}</span>
      {children ? <> · {children}</> : null}
    </>
  );
}

/**
 * After "Try again" the button is gone with the failed state: once the page has its content again,
 * focus moves to the page's main region (`main#main`, the skip link's target, `tabIndex=-1`) — only
 * if focus was lost with the button.
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
