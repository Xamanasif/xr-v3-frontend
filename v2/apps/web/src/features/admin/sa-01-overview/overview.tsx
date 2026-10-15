'use client';

import type { RequestRow } from '@xr/contracts/draft';
import { ROLE_LABEL } from '@xr/domain';
import {
  FailedState,
  Icon,
  Link,
  PageContent,
  PageHeader,
  Row,
  Rows,
  Section,
  Skeleton,
} from '@xr/ui';
import { useId } from 'react';

import {
  GROUP_ROWS,
  OVERVIEW_PAGE,
  openRowLabel,
  overviewOverline,
  requestRowLine,
  requestRowTitle,
} from '@/copy/overview';
import { stateWords } from '@/copy/state-copy';
import { overviewPlacement } from '@/nav/institutions';
import { requestAddress, REQUESTS_ADDRESS } from '@/nav/requests';
import { useRequestsUnderReview } from '@/queries/nav-counts';
import { useCurrentSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';

/**
 * SA-01 Overview — board B7-01 ("What is waiting on me across the platform?"), at `/admin`, in
 * its Phase-1 scope: the Requests group only (owner decision, Package-1D authorisation §2).
 *
 * - **The group is the port's answer.** The requests under review, newest first, read through
 *   `AccessRequestService.listRequests` — the same read and figure as the sidebar's count (B1-10
 *   "Nav count 3 = requests under review"). At most four rows (B7-01 caption), each opening the
 *   request's decision page (SA-03; Appendix A SA-01 "Every row opens the page where it is
 *   handled"); "Open Requests" opens the full list (SA-02).
 * - **Nothing waiting**: a group with nothing in it is left out (B7-01 note), which leaves the calm
 *   state of B7-01 f1 — its sentence limited to the one group Phase 1 builds (state-copy
 *   `SA-01.calm`).
 * - **Phase 6**: the two figures, the other seven groups and the "15 items waiting across 8
 *   groups · <date>" line are not drawn (`getSuperAdminOverview`, state-copy `SA-01.scope`).
 */
export function Overview() {
  useShellPage(overviewPlacement());
  const requests = useRequestsUnderReview();
  const session = useCurrentSession();
  const name = session.data?.ok ? (session.data.value?.session.displayName ?? null) : null;
  const overline = name ? overviewOverline(ROLE_LABEL.super_admin, name) : ROLE_LABEL.super_admin;
  const loading = requests.isPending && !requests.data;
  const rows = requests.data?.ok ? requests.data.value : null;

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mb-5"
        overline={overline}
        title={OVERVIEW_PAGE.title}
        meta={
          // B7-01 f2: the loading status in the header. The summary line ("15 items waiting
          // across 8 groups · 23 Oct 2026") is Phase 6 (state-copy SA-01.scope).
          loading ? (
            <span className="xl-meta" role="status">
              {OVERVIEW_PAGE.loading}
            </span>
          ) : null
        }
      />
      {requests.isError ? (
        <FailedState
          title={stateWords('SA-01.failed')}
          onRetry={() => {
            void requests.refetch();
          }}
        >
          {stateWords('SA-01.failed.line')}
        </FailedState>
      ) : loading || !rows ? (
        <LoadingGroups />
      ) : rows.length > 0 ? (
        <div className="flex flex-col gap-5">
          <RequestsGroup rows={rows} />
        </div>
      ) : (
        <Calm />
      )}
    </PageContent>
  );
}

type UnderReview = readonly RequestRow[];

/** B7-01 "Requests 3": the group, its count and up to four rows. */
function RequestsGroup({ rows }: { readonly rows: UnderReview }) {
  return (
    <Section
      className="xd-group"
      title={
        <>
          {OVERVIEW_PAGE.requests} <span className="xd-gn">{rows.length}</span>
        </>
      }
      headEnd={
        <Link className="xr-btn xr-btn--text xr-btn--sm" href={REQUESTS_ADDRESS}>
          {OVERVIEW_PAGE.openRequests}
        </Link>
      }
    >
      <Rows>
        {rows.slice(0, GROUP_ROWS).map((row) => {
          const title = requestRowTitle(row.id, row.institutionName);
          return (
            <Row
              key={row.id}
              icon="requests"
              tone="wait"
              title={title}
              sub={requestRowLine(row.type, row.receivedAt)}
            >
              <Link
                className="xr-btn xr-btn--secondary xr-btn--sm"
                href={requestAddress(row.id)}
                aria-label={openRowLabel(title)}
              >
                {OVERVIEW_PAGE.open}
              </Link>
            </Row>
          );
        })}
      </Rows>
    </Section>
  );
}

/** B7-01 f1 "Nothing is waiting": the calm, credible empty state. */
function Calm() {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {OVERVIEW_PAGE.calmTitle}
        </h2>
      </div>
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h3 className="xr-h3 m-0">{OVERVIEW_PAGE.nothingWaiting}</h3>
        <p className="xr-body m-0">{stateWords('SA-01.calm')}</p>
      </div>
    </section>
  );
}

/** B7-01 f2 "Loading": skeleton groups (hidden from screen readers; the header announces). */
function LoadingGroups() {
  return (
    <div aria-hidden="true">
      {[0, 1, 2].map((group) => (
        <section key={group} className="xr-section mb-5">
          <div className="xr-section-head">
            <Skeleton className="w-[220px]" />
          </div>
          {[0, 1].map((line) => (
            <div
              key={line}
              className="grid grid-cols-[1fr_120px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
            >
              <Skeleton />
              <Skeleton />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
