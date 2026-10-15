'use client';

import type { MyOverview } from '@xr/contracts/draft';
import { Icon, Link, PageContent, PageHeader, Row, Rows, Skeleton } from '@xr/ui';
import { useId } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  activeStatusLine,
  approvedStatusLine,
  approvedTitle,
  endedStatusLine,
  endingStatusLine,
  INSTITUTE_ACTIONS,
  itemsWords,
  OVERVIEW_WORDS,
  pausedStatusLine,
} from '@/copy/institute-home';
import { stateWords } from '@/copy/state-copy';
import {
  addPersonAddress,
  destinationPlacement,
  giveAccessAddress,
  OVERVIEW_TITLE,
} from '@/nav/institute';
import { useInstituteOverview } from '@/queries/institute-home';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { InstituteStatusPill, LoadFailed } from '../ia-02-content-access/institute-parts';
import { attentionRows, headerActions } from './overview-view';

/**
 * IA-01 Overview — board B2-01 ("What needs my attention at my institution?"), at `/institute`:
 * Meera Iyer's starting page — one status line, two actions and a short attention list.
 *
 * - **Read**: `InstitutionService.getMyOverview` — the institution, its status, the plan the
 *   status line names (with the days left in its term on the sample clock) and up to six
 *   "Needs your attention" facts the service derives from the records on every read (PC-38).
 *   Every word is written here from those facts (`@/copy/institute-home`); licences are shown as
 *   approved, never counted (T-06 / D7).
 * - **As B2-01 draws it**: the status line per state (f0 active, f1 approved — payment required,
 *   f3 ending soon, f4 ended, f5 paused), the header's actions per state, the rows in the
 *   service's order with one action each, the calm state (f2) and "No content yet" before access
 *   is active (f1; not reachable in the sample world — an Institute Admin is assigned only once
 *   access is active, INST-04). A row whose action opens a screen not built in Package 2A keeps
 *   its words and draws no action (state-copy `IA-01.not-rendered`).
 * - Nothing here changes a record: every action opens the page where it is handled.
 */
export function InstituteOverview() {
  useShellPage(destinationPlacement('IA-01'));
  const overview = useInstituteOverview();
  const answer = overview.data?.ok ? overview.data.value : null;
  const loading = !overview.isError && overview.isPending;

  if (overview.isError || (overview.data && !overview.data.ok)) {
    return (
      <PageContent wrap="read">
        <PageHeader className="mb-6" title={OVERVIEW_TITLE} />
        <LoadFailed
          title={stateWords('IA-01.failed')}
          onRetry={() => {
            void overview.refetch();
          }}
        />
      </PageContent>
    );
  }

  if (loading || !answer) {
    return (
      <PageContent wrap="read">
        <PageHeader
          className="mb-6"
          title={OVERVIEW_TITLE}
          meta={
            <span className="xr-meta" role="status">
              {stateWords('IA-01.loading')}
            </span>
          }
        />
        <LoadingRows />
      </PageContent>
    );
  }

  return <OverviewPage overview={answer} />;
}

function OverviewPage({ overview }: { readonly overview: MyOverview }) {
  const actions = headerActions(overview.status);
  const reference = overview.institution.createdFromRequestId;
  return (
    <PageContent wrap="read">
      <PageHeader
        className="mb-6"
        overline={overview.institution.name}
        title={OVERVIEW_TITLE}
        meta={
          <div className="xw-statusline">
            <InstituteStatusPill status={overview.status} />
            <span className="xr-num">{statusLine(overview)}</span>
          </div>
        }
        actions={
          actions.addStudents || actions.giveAccess ? (
            <>
              {actions.addStudents ? (
                <Link className="xr-btn xr-btn--secondary" href={addPersonAddress('student')}>
                  {INSTITUTE_ACTIONS.addStudents}
                </Link>
              ) : null}
              {actions.giveAccess ? (
                <Link className="xr-btn xr-btn--primary" href={giveAccessAddress()}>
                  {INSTITUTE_ACTIONS.giveStudentsAccess}
                </Link>
              ) : null}
            </>
          ) : null
        }
      />
      {overview.status === 'approved-payment-required' ? (
        <NoContentYet reference={reference} />
      ) : (
        <Attention overview={overview} />
      )}
    </PageContent>
  );
}

/** B2-01's status line beside the status chip, per state (f0, f1, f3, f4, f5). */
function statusLine(overview: MyOverview): string {
  const { plan } = overview;
  if (overview.status === 'approved-payment-required' || plan === null) {
    return approvedStatusLine(overview.institution.createdFromRequestId);
  }
  switch (overview.status) {
    case 'access-paused':
      return pausedStatusLine(
        plan.id,
        overview.institution.pause ? dayMonthYear(overview.institution.pause.since) : '',
      );
    case 'access-ended':
      return endedStatusLine(plan);
    case 'ending-soon':
      return endingStatusLine(plan, overview.planDaysLeft ?? 0);
    case 'access-active':
      return activeStatusLine(plan);
  }
}

/** B2-01 "Needs your attention": the rows (f0, f3 … f7) or the calm state (f2). */
function Attention({ overview }: { readonly overview: MyOverview }) {
  const headingId = useId();
  const rows = attentionRows(overview.attention);
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {OVERVIEW_WORDS.attention}
        </h2>
        {rows.length > 0 ? <span className="xr-meta">{itemsWords(rows.length)}</span> : null}
      </div>
      {rows.length > 0 ? (
        <Rows>
          {rows.map((row) => (
            <Row key={row.key} icon={row.icon} tone={row.tone} title={row.title} sub={row.sub}>
              {row.action ? (
                <Link className="xr-btn xr-btn--secondary xr-btn--sm" href={row.action.href}>
                  {row.action.label}
                </Link>
              ) : null}
            </Row>
          ))}
        </Rows>
      ) : (
        <div className="xr-empty">
          <span className="xr-empty-icon xr-x-empty-icon--ok">
            <Icon name="done" />
          </span>
          <h3 className="xr-h3 m-0">{OVERVIEW_WORDS.calmTitle}</h3>
          <p className="xr-body m-0 text-ink-2">{OVERVIEW_WORDS.calmLine}</p>
        </div>
      )}
    </section>
  );
}

/**
 * B2-01 f1 "Institution approved · access not active": no content and no Give access until the
 * payment is confirmed. "View request status" (PU-10 from the workspace) is not built in 2A.
 */
function NoContentYet({ reference }: { readonly reference: string }) {
  const headingId = useId();
  return (
    <section className="xr-section" aria-labelledby={headingId}>
      <div className="xr-section-head">
        <h2 id={headingId} className="xr-h2">
          {OVERVIEW_WORDS.noContent}
        </h2>
      </div>
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="clock" />
        </span>
        <h3 className="xr-h3 m-0">{approvedTitle(reference)}</h3>
        <p className="xr-body m-0 text-ink-2">{OVERVIEW_WORDS.approvedLine}</p>
      </div>
    </section>
  );
}

/** Loading: skeleton rows in the attention list's shape (hidden; the header announces it). */
function LoadingRows() {
  return (
    <section className="xr-section" aria-hidden="true">
      <div className="xr-section-head">
        <Skeleton className="w-[220px]" />
      </div>
      {[0, 1, 2].map((line) => (
        <div
          key={line}
          className="grid grid-cols-[1fr_140px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </section>
  );
}
