'use client';

import { FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import { FailedState, FormatBadge, LoadingState, SectionBody, Skeleton } from '@xr/ui';
import { useLayoutEffect, useRef } from 'react';

import { stateWords } from '@/copy/state-copy';

import { focusMain } from '../../shared/workspace-frame/route-focus';

/**
 * Pieces the Content Manager’s lists share (CM-01, CM-02, CM-04, CM-09; boards B6-05, B6-06,
 * B6-10): the rows’ compact format chips, the undrawn loading skeleton and failed + retry.
 */

/** A row’s formats (`span.xv-chips` of `span.xr-fmt.xr-fmt--compact`), WEB · AR · VR · MR. */
export function FormatChips({ formats }: { readonly formats: readonly Technology[] }) {
  return (
    <span className="xv-chips">
      {inDisplayOrder(formats).map((format) => (
        <FormatBadge key={format} format={FORMAT_META[format].code} compact />
      ))}
    </span>
  );
}

/** Undrawn: loading — skeleton rows in a table’s shape, announced politely (`<screen>.loading`). */
export function LoadingRows({
  label,
  grid,
  cells,
  rows = 3,
}: {
  readonly label: string;
  /** The rows’ Tailwind grid (`grid-cols-[…]`), written out where it is used. */
  readonly grid: string;
  readonly cells: number;
  readonly rows?: number;
}) {
  return (
    <LoadingState
      label={label}
      surface={null}
      skeleton={
        <div aria-hidden="true">
          {Array.from({ length: rows }, (_, row) => (
            <div
              key={row}
              className={`grid gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)] ${grid}`}
            >
              {Array.from({ length: cells }, (_, cell) => (
                <Skeleton key={cell} />
              ))}
            </div>
          ))}
        </div>
      }
    />
  );
}

/**
 * Undrawn: failed + Try again (`<screen>.failed`, `CM-lists.failed.line`) — board 04’s failed
 * notice in the section body. After “Try again” the notice goes with the failed state: once the
 * page is back, focus moves to the page’s main region, only if it was lost with the button.
 */
export function LoadFailed({
  title,
  onRetry,
}: {
  readonly title: string;
  readonly onRetry: () => void;
}) {
  return (
    <SectionBody>
      <FailedState title={title} onRetry={onRetry}>
        {stateWords('CM-lists.failed.line')}
      </FailedState>
    </SectionBody>
  );
}

/** Focus after “Try again” (see LoadFailed): call the returned function from the retry. */
export function useRetryFocus(settled: boolean): () => void {
  const pending = useRef(false);
  useLayoutEffect(() => {
    if (!pending.current || !settled) return;
    pending.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    focusMain();
  });
  return () => {
    pending.current = true;
  };
}
