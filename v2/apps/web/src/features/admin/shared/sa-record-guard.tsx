'use client';

import type { Result, ServiceError } from '@xr/contracts/draft';
import { Button, ButtonLink, ListState, LoadingRows, SaMessage, TextLink } from '@xr/ui/v3';
import type { ReactNode } from 'react';

import { SA_FAILED, SA_UNAVAILABLE } from '@/copy/sa-shared';
import { WORKSPACE_NAV } from '@/nav/nav-config';

import type { RecordRead, RecordRefusalKind } from '../../shared/record-guard/record-guard';

/**
 * The GL-04 message in the Super Admin shell (the export's `V.message`, `nf`): an unknown record,
 * or one the service will not show — existence is not revealed — with the way back to the
 * Overview and Help & support. Drawn in place of the page; its H1 takes focus with the route.
 */
export function SaUnavailable() {
  const config = WORKSPACE_NAV.super_admin;
  return (
    <SaMessage
      title={SA_UNAVAILABLE.title}
      actions={
        <>
          <ButtonLink variant="primary" href={config.base}>
            {SA_UNAVAILABLE.back}
          </ButtonLink>
          <TextLink href={config.help.href}>{SA_UNAVAILABLE.help}</TextLink>
        </>
      }
    >
      {SA_UNAVAILABLE.sentence}
    </SaMessage>
  );
}

export interface SaRecordGuardProps<T> {
  /** The record's read (`useXrQuery`). */
  readonly read: RecordRead<T>;
  /** "Loading the request…" (the kit's loading line over skeleton rows; never blank). */
  readonly loadingLabel: string;
  /** "We couldn’t load this request" (the kit's failed state, with Try again). */
  readonly failedTitle: ReactNode;
  /** Drawn treatments by refusal kind; any kind not listed is the GL-04 message. */
  readonly refusals?: Partial<Record<RecordRefusalKind, ReactNode>>;
  readonly children: (record: T) => ReactNode;
}

/**
 * The V3 record guard of the Super Admin screens (the shared `RecordGuard`, drawn with the kit):
 * loading, failed with Try again, the record — or, for a refusal, its drawn treatment or the GL-04
 * "This page isn’t available" message in place.
 */
export function SaRecordGuard<T>({
  read,
  loadingLabel,
  failedTitle,
  refusals = {},
  children,
}: SaRecordGuardProps<T>) {
  if (read.isError) {
    return (
      <ListState
        kind="failed"
        title={failedTitle}
        action={
          <Button
            onClick={() => {
              void read.refetch();
            }}
          >
            {SA_FAILED.retry}
          </Button>
        }
      >
        {SA_FAILED.line}
      </ListState>
    );
  }
  if (read.isPending || !read.data) return <LoadingRows message={loadingLabel} />;
  const answer: Result<T, ServiceError> = read.data;
  if (answer.ok) return <>{children(answer.value)}</>;
  return <>{refusals[answer.error.kind] ?? <SaUnavailable />}</>;
}
