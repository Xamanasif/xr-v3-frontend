'use client';

import type { SupportReport } from '@xr/domain';
import {
  Button,
  CellLines,
  ListFoot,
  ListState,
  ListSurface,
  LoadingRows,
  QuietLine,
  RecordTable,
  type RecordTableRow,
  StatusPill,
  SwitchToolbar,
} from '@xr/ui/v3';
import { useEffect, useMemo, useState } from 'react';

import { dayMonth, dayMonthYear } from '@/copy/dates';
import { reportTitle } from '@/copy/help';
import {
  lastActivityWords,
  reporterLine,
  reportRowLabel,
  sentWords,
  SUPPORT_LIST,
  SUPPORT_STATUS,
} from '@/copy/operations-6';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
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
import { OperationsHead } from './operations-tabs';

/** Which reports a view lists: Open holds open and reopened reports. */
export function inView(report: SupportReport, show: SupportShow): boolean {
  if (show === 'all') return true;
  if (show === 'resolved') return report.state === 'resolved';
  return report.state === 'open' || report.state === 'reopened';
}

/** A report's last activity: its newest history entry ("Reopened 6 Oct"). */
export function lastActivity(report: SupportReport): string {
  const latest = [...report.history].sort((a, b) =>
    a.at < b.at ? 1 : a.at > b.at ? -1 : a.id < b.id ? 1 : -1,
  )[0];
  return latest
    ? lastActivityWords(latest.event, dayMonth(latest.at))
    : lastActivityWords('sent', dayMonth(report.sentAt));
}

/**
 * SA-20 Operations › Support, at `/admin/operations/support` (`?show=resolved | all`; Open is the
 * list's own address), as the Super Admin export draws it (SA-v1 `V.support`).
 *
 * - **Read**: `OperationsService.listSupportReports({})` — every report sent from Help by any
 *   signed-in person, oldest first, as the service lets the Super Admin read them (SUP-09;
 *   `useSupportReports`) — with the reporters' institutions named from `listInstitutions`.
 * - **Views** (`sa-seg`): Open (open and reopened) · Resolved · All, each with its count; beside
 *   them "Sent from Help by anyone signed in · oldest first". The view lives here while the page is
 *   on show; the address mirrors it (replaced, no history entry); an address from outside (Back) is
 *   read again, and a `show` that names no view is replaced by the list's own address (state-copy
 *   `SA-20.show-address`).
 * - **Rows** (the record table, its three width layouts): the report's title (the excerpt of
 *   "What happened" — there is no saved title, P0-31) over "Sent 3 Oct 2026"; who sent it, their
 *   role and institution; where; the last activity; the status in the reporter's own words. Each
 *   row opens the report (SA-21), named by its title — never its SUP reference.
 * - Loading, failed + Try again and the empty views are the kit's list states (state-copy
 *   `SA-20.*`). Nothing here changes a report; nothing is sent from the product.
 */
export function SupportReports() {
  useShellPage(supportPlacement());
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
    ? (Object.fromEntries(
        SUPPORT_SHOWS.map((view) => [view, all.filter((report) => inView(report, view)).length]),
      ) as Record<SupportShow, number>)
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
    <>
      <OperationsHead current="support" />
      <ListSurface label={SUPPORT_LIST.label} busy={loading}>
        <SwitchToolbar
          label={SUPPORT_LIST.switchLabel}
          value={show}
          onChange={choose}
          options={SUPPORT_SHOWS.map((view) => ({
            key: view,
            label: SUPPORT_LIST.shows[view],
            ...(counts ? { count: counts[view] } : {}),
          }))}
          hint={SUPPORT_LIST.hint}
        />
        {failed ? (
          <ListState
            kind="failed"
            title={stateWords('SA-20.failed')}
            action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
          >
            {SA_FAILED.line}
          </ListState>
        ) : loading ? (
          <LoadingRows message={stateWords('SA-20.loading')} />
        ) : rows.length === 0 ? (
          <ListState kind="empty" icon="lifebuoy" title={SUPPORT_LIST.empty[show]}>
            {SUPPORT_LIST.emptyLine}
          </ListState>
        ) : (
          <RecordTable
            caption={SUPPORT_LIST.caption}
            headers={{
              who: SUPPORT_LIST.columns.report,
              what: SUPPORT_LIST.columns.from,
              kind: SUPPORT_LIST.columns.where,
              when: SUPPORT_LIST.columns.activity,
              status: SUPPORT_LIST.columns.status,
            }}
            whenLabel={SUPPORT_LIST.columns.activity}
            rows={rows.map((report) =>
              reportRow(
                report,
                report.reporter.institutionId
                  ? (names.get(report.reporter.institutionId) ?? null)
                  : null,
              ),
            )}
          />
        )}
        <ListFoot>{SUPPORT_LIST.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** One report as the export's row draws it. */
function reportRow(report: SupportReport, institution: string | null): RecordTableRow {
  const title = reportTitle(report.whatHappened);
  const status = SUPPORT_STATUS[report.state];
  return {
    key: report.id,
    href: supportReportAddress(report.id),
    title,
    linkLabel: reportRowLabel(title, status.words),
    titleDetail: sentWords(dayMonthYear(report.sentAt)),
    what: (
      <CellLines
        strong={report.reporter.displayName}
        small={reporterLine(report.reporter.role, institution)}
      />
    ),
    kind: report.where ? <QuietLine flush>{report.where}</QuietLine> : null,
    when: lastActivity(report),
    status: <StatusPill tone={status.tone}>{status.words}</StatusPill>,
  };
}
