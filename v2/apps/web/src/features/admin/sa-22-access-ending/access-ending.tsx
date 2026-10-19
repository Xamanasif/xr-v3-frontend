'use client';

import type { accessEndingOutput, Out } from '@xr/contracts/draft';
import type { AccessEndingRow, RequestStatus } from '@xr/domain';
import {
  Button,
  ButtonLink,
  ButtonRow,
  CellLines,
  ListFoot,
  ListState,
  ListSurface,
  LoadingRows,
  OperationsRowHead,
  OperationsSectionHead,
  QuietLine,
  type ReadOnlyRow,
  ReadOnlyTable,
  StatusPill,
} from '@xr/ui/v3';
import { useId, useMemo } from 'react';

import { calendarDay } from '@/copy/dates';
import { kindWords } from '@/copy/institutions';
import {
  ACCESS_ENDING,
  asOfWords,
  daysLeftWords,
  endedAgoWords,
  openInstitutionLabel,
  openRequestLabel,
  renewalLine,
  STANDING_TONE,
} from '@/copy/operations-6';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress } from '@/nav/institutions';
import { accessEndingPlacement } from '@/nav/operations';
import { requestAddress } from '@/nav/requests';
import { useAllRequests } from '@/queries/access-requests';
import { useAccessEnding } from '@/queries/operations-admin';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { requestStatusWords } from '../shared/request-status';
import { OperationsHead } from '../sa-20-support/operations-tabs';

/** One listed plan, with its institution's name and kind (`listAccessEnding`). */
export type AccessEndingView = Out<typeof accessEndingOutput>[number];

/**
 * The day the list is "as of" ("As of 23 Oct 2026"), read back from the service's own answer: a
 * plan ending in `daysLeft` days was read on its end date less those days, an ended one on its end
 * date plus `endedDaysAgo` (calendar days, as the domain counts them). `null` when nothing is
 * listed — the read carries no date of its own (state-copy `SA-22.as-of`).
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

/** "8 days left" or "Ended 8 days ago" under the end date. */
export function endsLine(row: AccessEndingRow): string | null {
  if (row.endedDaysAgo !== null) return endedAgoWords(row.endedDaysAgo);
  if (row.daysLeft !== null) return daysLeftWords(row.daysLeft);
  return null;
}

/**
 * SA-22 Operations › Access ending, at `/admin/operations/access-ending`, as the Super Admin
 * export draws it (SA-v1 `V.accessEnding`).
 *
 * - **Read**: `OperationsService.listAccessEnding()` — each access plan ending within 15 days or
 *   ended, with its institution, soonest first and ended plans after (`useAccessEnding`) — and,
 *   for a renewal in progress, its request's status from `listRequests` (Super Admin words).
 * - **As drawn**: the Operations head and its tabs (Access ending current); the surface "Ending
 *   within 15 days, or recently ended · As of <day> · soonest first"; the read-only table
 *   (`ReadOnlyTable`, labelled rows under 640 px of its width) — Institution (the name, opening the
 *   institution, over its kind) · Access ends (the end date over "8 days left" / "Ended 8 days
 *   ago") · Status (Renewal in progress — "Request under review"; Reminder due — "Nothing is sent
 *   from here"; Access ended — "No renewal requested") · Actions (Open request → SA-03 for a
 *   renewal in progress; Open institution → SA-07 on every row). Under it: "“Reminder due” is a
 *   status only …". No plan or request reference is shown.
 * - **Read-only**: no status action on any row — an ended plan comes back only through a renewal
 *   request; "Reminder due" is a status and sends nothing; nothing here approves a renewal or
 *   counts licences. Nothing listed: the empty state. Loading and failed + Try again are the
 *   kit's list states (state-copy `SA-22.loading`, `SA-22.failed`).
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
    <>
      <OperationsHead current="access-ending" />
      <ListSurface label={ACCESS_ENDING.label} busy={loading}>
        <OperationsSectionHead
          title={ACCESS_ENDING.sectionTitle}
          titleId={headingId}
          note={asOf ? asOfWords(calendarDay(asOf)) : undefined}
        />
        {failed ? (
          <ListState
            kind="failed"
            title={stateWords('SA-22.failed')}
            action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
          >
            {SA_FAILED.line}
          </ListState>
        ) : loading ? (
          <LoadingRows message={stateWords('SA-22.loading')} />
        ) : rows.length === 0 ? (
          <ListState kind="empty" icon="calendar" title={ACCESS_ENDING.emptyTitle}>
            {ACCESS_ENDING.emptyLine}
          </ListState>
        ) : (
          <ReadOnlyTable
            caption={ACCESS_ENDING.caption}
            columns={[
              ACCESS_ENDING.columns.institution,
              ACCESS_ENDING.columns.ends,
              ACCESS_ENDING.columns.status,
              ACCESS_ENDING.columns.actions,
            ]}
            rows={rows.map((view) =>
              endingRow(
                view,
                view.row.standing.kind === 'renewal-in-progress'
                  ? (statuses.get(view.row.standing.requestId) ?? null)
                  : null,
              ),
            )}
          />
        )}
        <ListFoot>{ACCESS_ENDING.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** One plan as the export's row draws it, per standing. */
function endingRow(view: AccessEndingView, requestStatus: RequestStatus | null): ReadOnlyRow {
  const { row, institutionName, institutionKind } = view;
  const { standing } = row;
  const line = endsLine(row);
  const under =
    standing.kind === 'renewal-in-progress'
      ? requestStatus
        ? renewalLine(requestStatusWords(requestStatus))
        : null
      : standing.kind === 'reminder-due'
        ? ACCESS_ENDING.nothingSent
        : ACCESS_ENDING.noRenewal;
  return {
    key: row.planId,
    head: (
      <OperationsRowHead
        href={institutionAddress(row.institutionId)}
        name={institutionName}
        detail={kindWords(institutionKind)}
      />
    ),
    cells: [
      {
        label: ACCESS_ENDING.columns.ends,
        content: <CellLines strong={calendarDay(row.endsOn)} small={line ?? undefined} />,
      },
      {
        label: ACCESS_ENDING.columns.status,
        content: (
          <>
            <StatusPill tone={STANDING_TONE[standing.kind]}>
              {ACCESS_ENDING.standing[standing.kind]}
            </StatusPill>
            {under ? <QuietLine>{under}</QuietLine> : null}
          </>
        ),
      },
      {
        label: ACCESS_ENDING.columns.actions,
        content: (
          <ButtonRow>
            {standing.kind === 'renewal-in-progress' ? (
              <ButtonLink
                variant="ghost"
                href={requestAddress(standing.requestId)}
                aria-label={openRequestLabel(institutionName)}
              >
                {ACCESS_ENDING.openRequest}
              </ButtonLink>
            ) : null}
            <ButtonLink
              variant="ghost"
              href={institutionAddress(row.institutionId)}
              aria-label={openInstitutionLabel(institutionName)}
            >
              {ACCESS_ENDING.openInstitution}
            </ButtonLink>
          </ButtonRow>
        ),
      },
    ],
  };
}
