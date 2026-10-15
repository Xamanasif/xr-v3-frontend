'use client';

import { Icon, Skeleton } from '@xr/ui';
import { useLayoutEffect, useRef } from 'react';

import { EXPERIMENTS_TAB } from '@/copy/faculty-courses';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';

/**
 * B4-02 f5 "Failed + retry": the empty pattern in a surface, the Failed icon on the error tint,
 * what did not load, "Nothing has changed. Try again." and a primary "Try again" with the
 * Try-again icon. The Faculty boards' failed formula, also used where B4-02 draws no failure
 * (FA-02 Courses, FA-03; state-copy `FA-02.failed`, `FA-03.failed`).
 */
export function FacultyFailed({
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
        <p className="xr-body m-0">{EXPERIMENTS_TAB.failedLine}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="xr-btn xr-btn--primary" onClick={onRetry}>
            <Icon name="tryAgain" />
            {EXPERIMENTS_TAB.tryAgain}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * B4-02 f4 "Loading": `div.xr-table-wrap[aria-busy]` with the words in a status region and four
 * skeleton rows in the table's shape (one bar per column), hidden from screen readers.
 */
export function FacultyLoading({
  label,
  columns,
  cells,
}: {
  readonly label: string;
  /** The skeleton row's tracks, as Tailwind's arbitrary `grid-cols-[…]` class. */
  readonly columns: string;
  readonly cells: number;
}) {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {label}
      </span>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className={`grid ${columns} gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]`}
        >
          {Array.from({ length: cells }, (_, cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * After "Try again" the button is gone with the failed state: once the content is back, focus
 * moves to the page's main region (`main#main`, the skip link's target) — only if focus was lost
 * with the button (as the Student pages do).
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
