'use client';

import type { SupportReport } from '@xr/domain';
import {
  FailedState,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  SectionBody,
  Skeleton,
  StatusPill,
  StatusTabs,
} from '@xr/ui';
import { useEffect, useId, useMemo, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { reportTitle } from '@/copy/help';
import { OPERATIONS_PAGE } from '@/copy/operations';
import {
  fromWords,
  OPERATIONS_6_META,
  openReportLabel,
  sentWords,
  SUPPORT_LIST,
  SUPPORT_STATUS,
} from '@/copy/operations-6';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  OPERATIONS_REPORT_ADDRESS,
  SUPPORT_ADDRESS,
  SUPPORT_SHOWS,
  supportAddress,
  supportPlacement,
  supportReportAddress,
  type SupportShow,
  supportShowOf,
} from '@/nav/operations';
import { useInstitutionTab } from '@/queries/institutions';
import { useSupportReports } from '@/queries/operations-admin';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { OperationsTabs } from './operations-tabs';

/** The board's four columns (B7-09 f7: Report · From · Status · Action). */
const COLUMN_COUNT = 4;

/** Which reports a view lists (B7-09 `match`): Open holds open and reopened reports. */
export function inView(report: SupportReport, show: SupportShow): boolean {
  if (show === 'all') return true;
  if (show === 'resolved') return report.state === 'resolved';
  return report.state === 'open' || report.state === 'reopened';
}

/**
 * SA-20 Operations › Support — board B7-09 f7 (1440, open reports) and f13 (nothing open), at
 * `/admin/operations/support` (`?show=resolved | all`; Open is the list's own address).
 *
 * - **Read**: `OperationsService.listSupportReports({})` — every report sent from Help by any
 *   signed-in person, oldest first, as the service lets the Super Admin read them (SUP-09;
 *   `useSupportReports`) — with the reporters' institutions named from `listInstitutions`.
 * - **As B7-09 draws it**: the Operations header and its three tab links (rule T1, Support
 *   current); the section "Support reports · Sent from Help by any signed-in person · oldest open
 *   first"; the view tabs Open (open and reopened) · Resolved · All with their counts
 *   (`role="tablist"`, ← → between them); the table Report (the excerpt of "What happened" — there
 *   is no saved title, P0-31 — over "SUP-0213 · Sent 3 Oct 2026") · From (name · role ·
 *   institution) · Status (Open / Reopened / Resolved) · Open (→ SA-21). Below 760 px of content
 *   the rows become labelled blocks (the v46 sheet). A view with nothing in it is the calm empty
 *   state (f13 "No open support reports").
 * - The view lives here while the page is on show; the address mirrors it (replaced, no history
 *   entry); an address from outside (Back) is read again, and a `show` that names no view is
 *   replaced by the list's own address (state-copy `SA-20.show-address`).
 * - Undrawn: loading and failed + Try again (state-copy `SA-20.loading`, `SA-20.failed`). Nothing
 *   here changes a report; nothing is sent from the product.
 */
export function SupportReports() {
  useShellPage(supportPlacement());
  const headingId = useId();
  const navigation = useAppNavigation();
  const addressed = supportShowOf(navigation.search);
  const [show, setShow] = useState<SupportShow>(addressed ?? 'open');
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setShow(addressed ?? 'open');
  }
  useEffect(() => {
    if (addressed === null) navigation.replace(SUPPORT_ADDRESS);
  }, [addressed, navigation]);

  const reports = useSupportReports();
  const institutions = useInstitutionTab('all');
  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);

  const failed =
    reports.isError || institutions.isError || (reports.data !== undefined && !reports.data.ok);
  const loading = !failed && (reports.data === undefined || institutions.data === undefined);
  const all = reports.data?.ok ? reports.data.value : null;
  const counts = all
    ? Object.fromEntries(
        SUPPORT_SHOWS.map((view) => [view, all.filter((report) => inView(report, view)).length]),
      )
    : null;
  const rows = all ? all.filter((report) => inView(report, show)) : [];

  const choose = (next: SupportShow) => {
    setShow(next);
    navigation.replace(supportAddress(next));
  };
  const retry = () => {
    if (reports.isError || (reports.data && !reports.data.ok)) void reports.refetch();
    if (institutions.isError) void institutions.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={OPERATIONS_PAGE.title}
        meta={<span className="xl-meta">{OPERATIONS_6_META}</span>}
      />
      <OperationsTabs current="support" />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={loading ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {SUPPORT_LIST.sectionTitle}
          </h2>
          <span className="xr-meta">{SUPPORT_LIST.sectionMeta}</span>
        </div>
        <StatusTabs
          label={SUPPORT_LIST.showLabel}
          idPrefix="support"
          className="px-4"
          tabs={SUPPORT_SHOWS.map((view) => ({
            id: view,
            label: SUPPORT_LIST.shows[view],
            ...(counts ? { count: counts[view] } : {}),
          }))}
          selected={show}
          onSelect={(id) => choose(id as SupportShow)}
        >
          {failed ? (
            <SectionBody>
              <FailedState
                title={stateWords('SA-20.failed')}
                reportHref={OPERATIONS_REPORT_ADDRESS}
                onRetry={retry}
              >
                {stateWords('SA-20.failed.line')}
              </FailedState>
            </SectionBody>
          ) : loading ? (
            <LoadingState
              label={stateWords('SA-20.loading')}
              className="rounded-none border-x-0 border-b-0 mt-3"
              skeleton={<SkeletonRows />}
            />
          ) : rows.length === 0 ? (
            <NothingHere show={show} />
          ) : (
            <div className="xr-table-wrap rounded-none border-x-0 border-b-0 mt-3">
              <table className="xr-table">
                <thead>
                  <tr>
                    <th scope="col">{SUPPORT_LIST.columns.report}</th>
                    <th scope="col">{SUPPORT_LIST.columns.from}</th>
                    <th scope="col">{SUPPORT_LIST.columns.status}</th>
                    <th scope="col">
                      <span className="xr-sr">{SUPPORT_LIST.columns.action}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((report) => (
                    <ReportRow
                      key={report.id}
                      report={report}
                      institution={
                        report.reporter.institutionId
                          ? (names.get(report.reporter.institutionId) ?? null)
                          : null
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StatusTabs>
      </section>
    </PageContent>
  );
}

/** One report as B7-09 f7 draws it. */
function ReportRow({
  report,
  institution,
}: {
  readonly report: SupportReport;
  readonly institution: string | null;
}) {
  const title = reportTitle(report.whatHappened);
  const status = SUPPORT_STATUS[report.state];
  return (
    <tr>
      <td className="is-primary">
        <strong>{title}</strong>
        <span className="xr-meta block">
          <span className="xr-id">{report.id}</span> · {sentWords(dayMonthYear(report.sentAt))}
        </span>
      </td>
      <td data-label={SUPPORT_LIST.columns.from}>
        {fromWords(report.reporter.displayName, report.reporter.role, institution)}
      </td>
      <td data-label={SUPPORT_LIST.columns.status}>
        <StatusPill tone={status.tone}>{status.words}</StatusPill>
      </td>
      <td>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={supportReportAddress(report.id)}
          aria-label={openReportLabel(report.id, title)}
        >
          {SUPPORT_LIST.open}
        </Link>
      </td>
    </tr>
  );
}

/** B7-09 f13 "Nothing open" (and the other views' `noRowsText`): calm, the all-clear tint. */
function NothingHere({ show }: { readonly show: SupportShow }) {
  return (
    <SectionBody>
      <div className="xr-empty">
        <span className="xr-empty-icon xr-x-empty-icon--ok">
          <Icon name="done" />
        </span>
        <h3 className="xr-h3 m-0">{SUPPORT_LIST.empty[show]}</h3>
        <p className="xr-body m-0 text-ink-2">{SUPPORT_LIST.emptyLine}</p>
      </div>
    </SectionBody>
  );
}

/** Skeleton rows in the table's shape (board 04 "Skeleton in the shape of the content"). */
function SkeletonRows() {
  return (
    <table className="xr-table" aria-hidden="true">
      <tbody>
        {Array.from({ length: 3 }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: COLUMN_COUNT }, (_, column) => (
              <td key={column}>
                <Skeleton />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
