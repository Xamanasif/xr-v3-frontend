'use client';

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
  activeInstitutionsLine,
  OVERVIEW_PAGE,
  overviewOverline,
  overviewSummary,
} from '@/copy/overview';
import { stateWords } from '@/copy/state-copy';
import { overviewPlacement } from '@/nav/institutions';
import { useSuperAdminOverview } from '@/queries/operations-admin';
import { useCurrentSession, useSession } from '@/queries/session';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  type OverviewGroupView,
  overviewGroups,
  type SuperAdminOverview,
  waitingTotals,
} from './overview-view';

/**
 * SA-01 Overview — board B7-01 ("What is waiting on me across the platform?"; B7-10 f15, B7-12
 * f8 … f11), at `/admin`.
 *
 * - **One read**: `OperationsService.getSuperAdminOverview` (PC-67) — the two figures and the
 *   eight groups, each its count and first four rows, read from the same records and rules as the
 *   list it opens. Counts and rows are the service's; the page only words them (`overview-view`).
 * - **As B7-01 draws it**: the header (overline "Super Admin · <name>", the line "15 items waiting
 *   across 8 groups · <today on the sample clock>", state-copy `SA-01.summary`), the two figures
 *   (`section.xd-figs`), then the groups in the drawn order — Requests, Corrections waiting for
 *   your release decision, Device transfers, Support reports, Access ending within 15 days,
 *   Institutions without an Institute Admin, Stuck content, Role holders without scope — each
 *   "<title> <count>" with "Open <list>" and up to four rows, every row opening the page where it
 *   is handled (routes.json SA-01). A group with nothing in it is left out.
 * - **Nothing waiting** (f1, B7-10 f15): the calm state; the two figures stay. **Loading** (f2):
 *   the status in the header and skeleton groups. Undrawn: failed + "Try again" (state-copy
 *   `SA-01.failed`). Single column at every width; the figures stack on phones (f3).
 * - Nothing here changes a record, and nothing is sent ("Reminder due" is a status, T-31).
 */
export function Overview() {
  useShellPage(overviewPlacement());
  const read = useSuperAdminOverview();
  const session = useSession();
  const current = useCurrentSession();
  const name = current.data?.ok ? (current.data.value?.session.displayName ?? null) : null;
  const overline = name ? overviewOverline(ROLE_LABEL.super_admin, name) : ROLE_LABEL.super_admin;
  // Today on the sample clock: the session's sign-in instant (the screens have no clock of their
  // own; state-copy `SA-01.today`).
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const overview = read.data?.ok ? read.data.value : null;
  const loading = !failed && overview === null;
  const groups = overview ? overviewGroups(overview) : [];
  const totals = waitingTotals(groups);
  const summary = overview ? overviewSummary(totals.items, totals.groups, today) : '';

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mb-5"
        overline={overline}
        title={OVERVIEW_PAGE.title}
        meta={
          loading ? (
            // B7-01 f2: the loading status in the header.
            <span className="xl-meta" role="status">
              {OVERVIEW_PAGE.loading}
            </span>
          ) : summary ? (
            <span className="xl-meta">{summary}</span>
          ) : null
        }
      />
      {failed ? (
        <FailedState
          title={stateWords('SA-01.failed')}
          onRetry={() => {
            void read.refetch();
          }}
        >
          {stateWords('SA-01.failed.line')}
        </FailedState>
      ) : overview === null ? (
        <LoadingGroups />
      ) : (
        <>
          <Figures overview={overview} />
          {groups.length > 0 ? (
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <Group key={group.key} group={group} />
              ))}
            </div>
          ) : (
            <Calm />
          )}
        </>
      )}
    </PageContent>
  );
}

/** B7-01 "Two figures only": active institutions and published experiments (`section.xd-figs`). */
function Figures({ overview }: { readonly overview: SuperAdminOverview }) {
  const { figures } = overview;
  return (
    <section className="xd-figs" aria-label={OVERVIEW_PAGE.figuresLabel}>
      <div className="xd-fig">
        <span className="xd-fig-n xr-num">{figures.activeInstitutions}</span>
        <span className="xd-fig-t">{OVERVIEW_PAGE.activeInstitutions}</span>
        <span className="xd-fig-s">
          {activeInstitutionsLine(figures.paused, figures.awaitingPayment)}
        </span>
      </div>
      <div className="xd-fig">
        <span className="xd-fig-n xr-num">{figures.publishedExperiments}</span>
        <span className="xd-fig-t">{OVERVIEW_PAGE.publishedExperiments}</span>
        <span className="xd-fig-s">{OVERVIEW_PAGE.publishedLine}</span>
      </div>
    </section>
  );
}

/** One B7-01 group: "<title> <count>", "Open <list>" and up to four rows, each with its action. */
function Group({ group }: { readonly group: OverviewGroupView }) {
  return (
    <Section
      className="xd-group"
      title={
        <>
          {group.title} <span className="xd-gn">{group.count}</span>
        </>
      }
      headEnd={
        <Link className="xr-btn xr-btn--text xr-btn--sm" href={group.open.href}>
          {group.open.words}
        </Link>
      }
    >
      <Rows>
        {group.rows.map((row) => (
          <Row key={row.key} icon={row.icon} tone={row.tone} title={row.title} sub={row.sub}>
            <Link
              className="xr-btn xr-btn--secondary xr-btn--sm"
              href={row.action.href}
              aria-label={row.action.label}
            >
              {row.action.words}
            </Link>
          </Row>
        ))}
      </Rows>
    </Section>
  );
}

/** B7-01 f1, B7-10 f15 "Nothing is waiting": the calm, credible empty state. */
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
        <p className="xr-body m-0 text-ink-2">{OVERVIEW_PAGE.calmLine}</p>
      </div>
    </section>
  );
}

/** B7-01 f2 "Loading": skeleton figures and groups (hidden from screen readers; the header announces). */
function LoadingGroups() {
  return (
    <div aria-hidden="true">
      <div className="xd-figs">
        {[0, 1].map((figure) => (
          <div key={figure} className="xd-fig">
            <Skeleton className="h-[32px] w-[64px]" />
            <Skeleton className="w-[160px]" />
          </div>
        ))}
      </div>
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
