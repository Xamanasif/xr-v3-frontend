'use client';

import type { ReactNode, Ref } from 'react';

import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { Button } from './button.js';
import { Icon } from './icon.js';
import { Link } from './links.js';
import { Notice } from './notice.js';

function present(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/* ---------------------------------------------------------------------------------------------
 * Empty — board 04 "State grammar": "Icon, one line, one next step"; never "No data".
 * ------------------------------------------------------------------------------------------- */

export interface EmptyStateProps {
  /** The decorative icon in the 48 px circle (`span.xr-empty-icon`), by its board path. */
  readonly icon: IconName;
  /** 20 (the product boards, 570 instances) or 24 (board 03 "Empty"). */
  readonly iconSize?: 20 | 24;
  /** Nothing here yet ("No requests yet"): `.xr-h3` on an `h2` or `h3` (the boards use both). */
  readonly title: ReactNode;
  readonly headingLevel?: 2 | 3;
  /** How it fills, in one line (`p.xr-body`, or `p.xr-small` with `line="small"`). */
  readonly children?: ReactNode;
  /**
   * The type style of that line: `body` (`p.xr-body`, 16/24; every product board, 515 instances)
   * or `small` (`p.xr-small`, 14/20; board 03 "Empty" and board 07 "State 2a · My reports ·
   * empty · Vendor", the Help empty state).
   */
  readonly line?: 'body' | 'small';
  /**
   * The one next step — a Button or a link styled as one — placed after the line as board 03
   * and B1-10 draw it. (The B2–B7 boards wrap several actions in an inline-styled row; that
   * composition is not emitted here.)
   */
  readonly actions?: ReactNode;
  /** Board context classes. */
  readonly className?: string;
}

/** The empty state (`div.xr-empty`; boards 03 "Empty", 04, B1-10 "Empty · no requests yet"). */
export function EmptyState({
  icon,
  iconSize = 20,
  title,
  headingLevel = 2,
  children,
  line = 'body',
  actions,
  className,
}: EmptyStateProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <div className={joinClasses('xr-empty', className)}>
      <span className="xr-empty-icon">
        <Icon name={icon} size={iconSize} />
      </span>
      <Heading className="xr-h3">{title}</Heading>
      {present(children) && <p className={line === 'small' ? 'xr-small' : 'xr-body'}>{children}</p>}
      {actions}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * No match — B1-10 "No match": the empty pattern, the Search icon and one way back.
 * ------------------------------------------------------------------------------------------- */

export interface NoMatchProps {
  /** "No requests match these filters". */
  readonly title: ReactNode;
  readonly headingLevel?: 2 | 3;
  /** An optional line under the title. */
  readonly children?: ReactNode;
  /** Clears every filter. The result count stays in the toolbar's `role="status"`. */
  readonly onClearFilters: () => void;
  readonly className?: string;
}

/** No match (B1-10 frame "No match"; 92 board instances, all with Search and "Clear filters"). */
export function NoMatch({
  title,
  headingLevel,
  children,
  onClearFilters,
  className,
}: NoMatchProps) {
  return (
    <EmptyState
      icon="search"
      title={title}
      headingLevel={headingLevel}
      className={className}
      actions={
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      }
    >
      {children}
    </EmptyState>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Failed + retry — board 03 error notice: "Try again" and "Report a problem"; no codes, no 500.
 * ------------------------------------------------------------------------------------------- */

export interface FailedStateProps {
  /** What didn't work, with reassurance: "The simulation didn’t open. Nothing was lost." */
  readonly title: ReactNode;
  /** The next step in words: "Try again. If it keeps happening, report the problem." */
  readonly children?: ReactNode;
  readonly onRetry: () => void;
  /** Where "Report a problem" goes (the Help report form). Omit where the board draws none. */
  readonly reportHref?: string;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * Failed + retry, in place (board 03 "Notices, empty, error, loading and read-only"; board 04
 * "State grammar"): an error notice with `role="alert"`, a small secondary "Try again" with the
 * board-02 Retry icon and a "Report a problem" link.
 */
export function FailedState({
  title,
  children,
  onRetry,
  reportHref,
  className,
  ref,
}: FailedStateProps) {
  return (
    <Notice
      ref={ref}
      tone="err"
      title={title}
      className={className}
      actions={
        <>
          <Button variant="secondary" size="sm" icon="retry" onClick={onRetry}>
            Try again
          </Button>
          {reportHref !== undefined && <Link href={reportHref}>Report a problem</Link>}
        </>
      }
    >
      {children}
    </Notice>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Loading — board 04: "Skeleton in the shape of the content; announced politely".
 * ------------------------------------------------------------------------------------------- */

/** One skeleton bar (`span.xr-skel`); shimmers, and is static under reduced motion. */
export function Skeleton({ className }: { readonly className?: string }) {
  return <span className={joinClasses('xr-skel', className)} />;
}

/** The board surface that is busy: `xr-table-wrap` (lists; 84 instances) or `xr-section` (25). */
export type LoadingSurface = 'table' | 'section';

export interface LoadingStateProps {
  /** What screen readers hear while loading: "Loading requests" (board 04: never blank). */
  readonly label: string;
  /**
   * While true: `aria-busy="true"`, the label in the status region and the skeleton. When false
   * the same container and status region stay mounted (emptied) around `children`, so the next
   * load is announced reliably (Appendix E §5.5: keep live regions mounted, change their text).
   */
  readonly loading?: boolean;
  /** `null`: no surface class (a caller-supplied board container in `className`). */
  readonly surface?: LoadingSurface | null;
  /** The skeleton in the shape of the content (DataTable rows, cards). Default: `lines` bars. */
  readonly skeleton?: ReactNode;
  readonly lines?: number;
  /** The loaded content. */
  readonly children?: ReactNode;
  readonly className?: string;
  /**
   * The container is where focus goes after an action that removed the focused control (DataTable
   * after "Try again"): it takes `tabIndex={-1}` (not a Tab stop); focus it through `ref`. No board
   * draws a focusable container, so pass it only while it is needed.
   */
  readonly focusTarget?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * The loading region, as the product boards draw it (B1-10 "Loading" and 83 more):
 * `<div class="xr-table-wrap" aria-busy="true"><span class="xr-sr" role="status">Loading
 * requests</span>` + skeleton. DataTable (WP-0.7) wraps its table in it and passes its own
 * skeleton rows.
 */
export function LoadingState({
  label,
  loading = true,
  surface = 'table',
  skeleton,
  lines = 3,
  children,
  className,
  focusTarget = false,
  ref,
}: LoadingStateProps) {
  return (
    <div
      ref={ref}
      className={
        joinClasses(
          surface === 'table' && 'xr-table-wrap',
          surface === 'section' && 'xr-section',
          className,
        ) || undefined
      }
      aria-busy={loading ? true : undefined}
      tabIndex={focusTarget ? -1 : undefined}
    >
      <span className="xr-sr" role="status">
        {loading ? label : ''}
      </span>
      {loading
        ? (skeleton ?? Array.from({ length: lines }, (_, line) => <Skeleton key={line} />))
        : children}
    </div>
  );
}
