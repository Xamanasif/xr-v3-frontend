'use client';

import { Icon, Skeleton } from '@xr/ui';
import { type RefObject, useLayoutEffect, useRef } from 'react';

import { REVIEW_QUEUE } from '@/copy/reviewer-lists';

/**
 * The Academic Reviewer lists’ shared states, as B6-02 draws them for the review queue and as
 * RV-01 and RV-05 reuse them where their boards draw none (state-copy `RV-01.failed`,
 * `RV-05.loading`, `RV-05.failed`).
 */

/**
 * B6-02 f3 “Failed + retry” (B6-11 f13): the empty pattern, the Failed icon on the error tint,
 * what did not load, “Nothing has changed. Try again.” and a primary “Try again” with its icon.
 * The caller places it (a section body, or a surface of its own) and picks the heading level.
 */
export function ReviewerFailed({
  title,
  onRetry,
  headingLevel = 3,
}: {
  readonly title: string;
  readonly onRetry: () => void;
  readonly headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="xr-empty">
      <span className="xr-empty-icon bg-err-bg text-err">
        <Icon name="failed" />
      </span>
      <Heading className="xr-h3 m-0">{title}</Heading>
      <p className="xr-body m-0 text-ink-2">{REVIEW_QUEUE.failedLine}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="xr-btn xr-btn--primary" onClick={onRetry}>
          <Icon name="tryAgain" />
          {REVIEW_QUEUE.tryAgain}
        </button>
      </div>
    </div>
  );
}

/**
 * B6-02 f2 “Loading”: in the section body, `div.xr-table-wrap[aria-busy]` with the words in a
 * status region and four skeleton rows of five bars (1.6fr .8fr .8fr .8fr 120px), hidden from
 * screen readers.
 */
export function ReviewerLoading({ label }: { readonly label: string }) {
  return (
    <div className="xr-section-body">
      <div className="xr-table-wrap" aria-busy="true">
        <span className="xr-sr" role="status">
          {label}
        </span>
        {[0, 1, 2, 3].map((row) => (
          <div
            key={row}
            aria-hidden="true"
            className="grid grid-cols-[1.6fr_.8fr_.8fr_.8fr_120px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
          >
            {[0, 1, 2, 3, 4].map((cell) => (
              <Skeleton key={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * After “Try again” the button is gone with the failed state: once the read is back, focus moves
 * to `target` (B6-02 `qRetry`: the section’s heading) — only if focus was lost with the button.
 * Returns the function the retry calls first.
 */
export function useRetryFocus(
  settled: boolean,
  target: RefObject<HTMLElement | null> | (() => HTMLElement | null),
): () => void {
  const pending = useRef(false);
  useLayoutEffect(() => {
    if (!pending.current || !settled) return;
    pending.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const element = typeof target === 'function' ? target() : target.current;
    element?.focus({ preventScroll: true });
  });
  return () => {
    pending.current = true;
  };
}
