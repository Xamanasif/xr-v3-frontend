'use client';

import { Icon, LoadingState, Skeleton } from '@xr/ui';
import { type ReactNode, useLayoutEffect, useRef } from 'react';

import { STUDENT_WORDS } from '@/copy/student';
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

/**
 * "Failed + retry" as the Student boards draw it (B2-11 f10): the empty pattern with the Failed
 * icon in the error tint, what didn't load, "Nothing has changed. Try again." and a primary
 * "Try again" with the Try-again icon — in place of the content.
 */
export function StudentFailed({
  title,
  onRetry,
}: {
  readonly title: string;
  readonly onRetry: () => void;
}) {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h2 className="xr-h3 m-0">{title}</h2>
        <p className="xr-body m-0">{STUDENT_WORDS.failedLine}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="xr-btn xr-btn--primary" onClick={onRetry}>
            <Icon name="tryAgain" />
            {STUDENT_WORDS.tryAgain}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * B2-11 f9 "Loading": `div.xr-table-wrap aria-busy="true"` with the label in a status region and
 * four skeleton rows of two bars (`grid-template-columns:1.6fr 1fr`), hidden from screen readers.
 */
export function StudentLoading({ label }: { readonly label: string }) {
  return (
    <LoadingState
      label={label}
      skeleton={[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="grid grid-cols-[1.6fr_1fr] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    />
  );
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
