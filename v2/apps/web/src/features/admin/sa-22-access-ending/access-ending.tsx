'use client';

import type { accessEndingOutput, Out } from '@xr/contracts/draft';
import type { AccessEndingRow, RequestStatus } from '@xr/domain';
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
} from '@xr/ui';
import { useId, useMemo } from 'react';

import { calendarDay } from '@/copy/dates';
import { OPERATIONS_PAGE } from '@/copy/operations';
import {
  ACCESS_ENDING,
  asOfWords,
  daysLeftWords,
  endedAgoWords,
  OPERATIONS_6_META,
  openInstitutionLabel,
  openRequestLabel,
  planLine,
  renewalLine,
  STANDING_TONE,
  STRIPPED_OPERATIONS,
} from '@/copy/operations-6';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress } from '@/nav/institutions';
import { accessEndingPlacement, OPERATIONS_REPORT_ADDRESS } from '@/nav/operations';
import { requestAddress } from '@/nav/requests';
import { useAllRequests } from '@/queries/access-requests';
import { useAccessEnding } from '@/queries/operations-admin';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { requestStatusWords } from '../shared/request-status';
import { OperationsTabs } from '../sa-20-support/operations-tabs';

/** The board's four columns (B7-09 f4: Institution · Access ends · Status · Actions). */
const COLUMN_COUNT = 4;

/** One listed plan, with its institution's name and kind (`listAccessEnding`). */
export type AccessEndingView = Out<typeof accessEndingOutput>[number];

/**
 * The day the list is "as of" (B7-09 "As of 23 Oct 2026"), read back from the service's own
 * answer: a plan ending in `daysLeft` days was read on its end date less those days, an ended one
 * on its end date plus `endedDaysAgo` (calendar days, as the domain counts them). `null` when
 * nothing is listed — the read carries no date of its own (state-copy `SA-22.as-of`).
 */
export function asOfDate(rows: readonly AccessEndingView[]): string | null {
  for (const { row } of rows) {
    const offset =
      row.daysLeft !== null ? -row.daysLeft : row.endedDaysAgo !== null ? row.endedDaysAgo : null;
    if (offset === null) continue;
    const day = new Date(`${row.endsOn}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + offset);
    return day.toISOString().slice(0, 10);
  }
  return null;
}

/** "8 days left" or "Ended 8 days ago" under the end date (B7-09 f4). */
export function endsLine(row: AccessEndingRow): string | null {
  if (row.endedDaysAgo !== null) return endedAgoWords(row.endedDaysAgo);
  if (row.daysLeft !== null) return daysLeftWords(row.daysLeft);
  return null;
}

/**
 * SA-22 Operations › Access ending — board B7-09 f4 (1440), f5 (nothing ending), f6 (375,
 * labelled blocks); B7-10 f13 ("Reminder due" — nothing is sent), at
 * `/admin/operations/access-ending`.
 *
 * - **Read**: `OperationsService.listAccessEnding()` — each access plan ending within 15 days or
 *   ended, with its institution, soonest first and ended plans after (`useAccessEnding`) — and,
 *   for a renewal in progress, its request's status from `listRequests` (Super Admin words).
 * - **As B7-09 draws it**: the Operations header and its three tab links (rule T1, Access ending
 *   current); the section "Ending within 15 days, or ended · As of <day> · soonest first"; the
 *   table Institution (name over "ACC-0098 · Internal") · Access ends (the end date over "8 days
 *   left" / "Ended 8 days ago") · Status (Renewal in progress — "REQ-0038 under review"; Reminder
 *   due — "Nothing is sent from here"; Access ended — "No renewal requested") · Actions (Open
 *   request → SA-03 for a renewal in progress; Open institution → SA-07 on every row). Below 760
 *   px of content the rows become labelled blocks (f6). Under the list: "“Reminder due” is a
 *   status only — nothing is sent from here, and no reminder channel is set. Renewals come in as
 *   requests." (T-31, the id out of the words, P1-14).
 * - **Read-only**: no status action on any row — an ended plan comes back only through a renewal
 *   request (B7-10 f8); "Reminder due" sends nothing (T-31); nothing here approves a renewal or
 *   recalculates a licence. Nothing listed: the calm empty state (f5).
 * - Undrawn: loading and failed + Try again (state-copy `SA-22.loading`, `SA-22.failed`).
 */
export function AccessEnding() {
  useShellPage(accessEndingPlacement());
  const headingId = useId();
  const ending = useAccessEnding();
  const requests = useAllRequests();

  const statuses = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    if (requests.data?.ok) for (const row of requests.data.value) map.set(row.id, row.status);
    return map;
  }, [requests.data]);

  const failed =
    ending.isError || requests.isError || (ending.data !== undefined && !ending.data.ok);
  const loading = !failed && (ending.data === undefined || requests.data === undefined);
  const rows = ending.data?.ok ? ending.data.value : [];
  const asOf = asOfDate(rows);

  const retry = () => {
    if (ending.isError || (ending.data && !ending.data.ok)) void ending.refetch();
    if (requests.isError) void requests.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={OPERATIONS_PAGE.title}
        meta={<span className="xl-meta">{OPERATIONS_6_META}</span>}
      />
      <OperationsTabs current="access-ending" />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={loading ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {ACCESS_ENDING.sectionTitle}
          </h2>
          {asOf ? <span className="xr-meta">{asOfWords(calendarDay(asOf))}</span> : null}
        </div>
        {failed ? (
          <SectionBody>
            <FailedState
              title={stateWords('SA-22.failed')}
              reportHref={OPERATIONS_REPORT_ADDRESS}
              onRetry={retry}
            >
              {stateWords('SA-22.failed.line')}
            </FailedState>
          </SectionBody>
        ) : loading ? (
          <LoadingState
            label={stateWords('SA-22.loading')}
            className="rounded-none border-x-0 border-b-0"
            skeleton={<SkeletonRows />}
          />
        ) : rows.length === 0 ? (
          <SectionBody>
            <div className="xr-empty">
              <span className="xr-empty-icon xr-x-empty-icon--ok">
                <Icon name="done" />
              </span>
              <h3 className="xr-h3 m-0">{ACCESS_ENDING.emptyTitle}</h3>
              <p className="xr-body m-0 text-ink-2">{ACCESS_ENDING.emptyLine}</p>
            </div>
          </SectionBody>
        ) : (
          <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
            <table className="xr-table">
              <thead>
                <tr>
                  <th scope="col">{ACCESS_ENDING.columns.institution}</th>
                  <th scope="col">{ACCESS_ENDING.columns.ends}</th>
                  <th scope="col">{ACCESS_ENDING.columns.status}</th>
                  <th scope="col">
                    <span className="xr-sr">{ACCESS_ENDING.columns.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((view) => (
                  <EndingRow
                    key={view.row.planId}
                    view={view}
                    requestStatus={
                      view.row.standing.kind === 'renewal-in-progress'
                        ? (statuses.get(view.row.standing.requestId) ?? null)
                        : null
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="xl-open [margin:16px_0_0]">
        <Icon name="info" size={16} />
        <span>{STRIPPED_OPERATIONS.reminderStatusOnly.words}</span>
      </p>
    </PageContent>
  );
}

/** One plan as B7-09 f4 draws it per standing. */
function EndingRow({
  view,
  requestStatus,
}: {
  readonly view: AccessEndingView;
  readonly requestStatus: RequestStatus | null;
}) {
  const { row, institutionName, institutionKind } = view;
  const { standing } = row;
  const line = endsLine(row);
  const under =
    standing.kind === 'renewal-in-progress'
      ? renewalLine(standing.requestId, requestStatus ? requestStatusWords(requestStatus) : null)
      : standing.kind === 'reminder-due'
        ? ACCESS_ENDING.nothingSent
        : ACCESS_ENDING.noRenewal;
  return (
    <tr>
      <td className="is-primary">
        <strong>{institutionName}</strong>
        <span className="xr-meta block">{planLine(row.planId, institutionKind)}</span>
      </td>
      <td data-label={ACCESS_ENDING.columns.ends}>
        <span className="xw-nowrap">{calendarDay(row.endsOn)}</span>
        {line ? <span className="xr-meta block">{line}</span> : null}
      </td>
      <td data-label={ACCESS_ENDING.columns.status}>
        <StatusPill tone={STANDING_TONE[standing.kind]}>
          {ACCESS_ENDING.standing[standing.kind]}
        </StatusPill>
        <span className="xr-meta block [margin-top:4px]">{under}</span>
      </td>
      <td>
        <div className="xw-actions justify-end [gap:8px]">
          {standing.kind === 'renewal-in-progress' ? (
            <Link
              className="xr-btn xr-btn--secondary xr-btn--sm"
              href={requestAddress(standing.requestId)}
              aria-label={openRequestLabel(standing.requestId)}
            >
              {ACCESS_ENDING.openRequest}
            </Link>
          ) : null}
          <Link
            className="xr-btn xr-btn--text xr-btn--sm"
            href={institutionAddress(row.institutionId)}
            aria-label={openInstitutionLabel(institutionName)}
          >
            {ACCESS_ENDING.openInstitution}
          </Link>
        </div>
      </td>
    </tr>
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
