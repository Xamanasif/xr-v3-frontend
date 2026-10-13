'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import { FailedState, LoadingState } from '@xr/ui';
import type { ReactNode } from 'react';

import { useAppNavigation } from '@/nav/navigation';

/**
 * The record guard (Appendix F §5.2 "Record guards (framework)"; Appendix A §3.8; ADR-0005 §5):
 * a record page renders what the service answered for its record, and the drawn state when it is
 * refused — never a decision of its own (the port resolves the person and decides).
 *
 * - Loading: the drawn skeleton, announced politely (board 04 "Loading").
 * - Failed for now (`unavailable`, the one thrown answer): the drawn "failed, try again" in place.
 * - Refused: each refusal kind maps to a drawn treatment — `'not-found'` (the workspace's in-shell
 *   PU-15, through the route's not-found boundary; existence is not revealed) or a drawn state of
 *   its own (`ReactNode`). A kind the screen does not map is not found too.
 * - Answered: the record, to the page.
 *
 * Phase 0 wires one screen: the XS-07 report detail, where every refusal is not found. The later
 * guards (ST-19 "not given", "Draft · read-only", RV-06 decided, …) map their refusals to their
 * own drawn states as each screen lands (Appendix F §5.2).
 */
export type RecordRefusalKind = ServiceError['kind'];

export type RefusalTreatment = 'not-found' | ReactNode;

export interface RecordRead<T> {
  readonly data?: Result<T, ServiceError>;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly refetch: () => unknown;
}

export interface RecordGuardProps<T> {
  /** The record's read (`useXrQuery`). */
  readonly read: RecordRead<T>;
  /** What screen readers hear while it loads (board 04: never blank). */
  readonly loadingLabel: string;
  /** The failed state's words: what didn't work + reassurance (board 04 "Failed + retry"). */
  readonly failed: {
    readonly title: ReactNode;
    readonly line?: ReactNode;
    readonly reportHref?: string;
  };
  /** Drawn treatments by refusal kind; any kind not listed is not found. */
  readonly refusals?: Partial<Record<RecordRefusalKind, RefusalTreatment>>;
  readonly children: (record: T) => ReactNode;
}

export function RecordGuard<T>({
  read,
  loadingLabel,
  failed,
  refusals = {},
  children,
}: RecordGuardProps<T>) {
  const { notFound } = useAppNavigation();
  if (read.isError) {
    return (
      <FailedState
        title={failed.title}
        reportHref={failed.reportHref}
        onRetry={() => {
          void read.refetch();
        }}
      >
        {failed.line}
      </FailedState>
    );
  }
  if (read.isPending || !read.data) return <LoadingState label={loadingLabel} surface="section" />;
  const answer = read.data;
  if (answer.ok) return <>{children(answer.value)}</>;
  const treatment = refusals[answer.error.kind] ?? 'not-found';
  if (treatment === 'not-found') notFound();
  return <>{treatment}</>;
}
