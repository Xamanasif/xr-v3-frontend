'use client';

import type { DeviceTransfer } from '@xr/domain';
import {
  EmptyState,
  FailedState,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  SectionTabs,
  Skeleton,
  StatusPill,
  VisuallyHidden,
} from '@xr/ui';
import { useEffect, useMemo } from 'react';

import { OPERATIONS_PAGE, reviewLabel, transferSubLine, TRANSFERS_LIST } from '@/copy/operations';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  DEVICE_TRANSFERS_ADDRESS,
  deviceTransferAddress,
  deviceTransfersAddress,
  deviceTransfersPlacement,
  OPERATIONS_REPORT_ADDRESS,
  SHOW_STATE,
  showOf,
  TRANSFER_SHOWS,
  type TransferShow,
} from '@/nav/operations';
import { useDeviceTransfers } from '@/queries/devices';
import { useInstitutionTab } from '@/queries/institutions';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  forwardedWords,
  inListOrder,
  requesterName,
  transferStatusWords,
  transferTone,
} from './transfer-view';

/** The board's five columns (B3-11 f0: Request · Institution · Forwarded · Status · Action). */
const COLUMN_COUNT = 5;

/** Each view's empty state (state-copy `SA-18.empty.*`; B3-11 draws none). */
const EMPTY: Readonly<Record<TransferShow, { readonly title: string; readonly line: string }>> = {
  forwarded: {
    title: stateWords('SA-18.empty.forwarded'),
    line: stateWords('SA-18.empty.forwarded.line'),
  },
  'with-institution': {
    title: stateWords('SA-18.empty.with-institution'),
    line: stateWords('SA-18.empty.with-institution.line'),
  },
  approved: {
    title: stateWords('SA-18.empty.approved'),
    line: stateWords('SA-18.empty.approved.line'),
  },
};

/**
 * SA-18 Operations › Device transfers — boards B3-11 f0 (forwarded), f2 (still with an
 * institution), f3 (approved), re-used as B7-09 f0 and f2, at `/admin/operations/device-transfers`
 * (`/admin/operations` redirects here).
 *
 * - **Read**: `OperationsService.listDeviceTransfers({ state })` for the view on show — every
 *   institution's transfers, as the service lets the Super Admin see them (`useDeviceTransfers`)
 *   — with the institutions named from `listInstitutions`. The DTR record is the one the Student
 *   (ST-18) and the Institute Admin (IA-18, IA-19) read: its state words line up across the roles
 *   (`transferWords`).
 * - **Show** (B3-11 `xl-seg`, links): Forwarded to BITS (the list's own address) · Still with an
 *   institution (`?show=with-institution`) · Approved (`?show=approved`); an unknown `show` is
 *   replaced by the list's address (state-copy `SA-18.show-address`).
 * - **Rows** (state-copy `SA-18.rows`, `SA-18.forwarded-cell`): reference and "Student · format",
 *   institution, "Forwarded" ("<date, time> · <who>" or "Not yet"), status. A forwarded row opens
 *   its decision (SA-19) from its reference and from "Review"; an approved row from its reference;
 *   a row still with its institution is read-only — "Not BITS’s to decide yet" (f2). Labelled rows
 *   below 760 px of content (the v46 sheet).
 * - **Tabs**: "Device transfers" only; Support and Access ending are Phase 6 and not rendered
 *   (DEV-21; state-copy `SA-18.tabs`). Loading, failed + "Try again" and the empty views are the
 *   board-04 grammar (state-copy `SA-18.*`).
 */
export function DeviceTransfers() {
  const navigation = useAppNavigation();
  const asked = showOf(navigation.search);
  const show: TransferShow = asked ?? 'forwarded';
  useEffect(() => {
    if (asked === null) navigation.replace(DEVICE_TRANSFERS_ADDRESS);
  }, [asked, navigation]);
  useShellPage(deviceTransfersPlacement());

  const transfers = useDeviceTransfers(SHOW_STATE[show]);
  const institutions = useInstitutionTab('all');

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);

  const failed =
    transfers.isError ||
    institutions.isError ||
    (transfers.data !== undefined && !transfers.data.ok);
  const loading = !failed && (transfers.data === undefined || institutions.data === undefined);
  const rows = transfers.data?.ok ? inListOrder(transfers.data.value, show) : [];

  const retry = () => {
    if (transfers.isError || (transfers.data && !transfers.data.ok)) void transfers.refetch();
    if (institutions.isError) void institutions.refetch();
  };

  return (
    <PageContent wrap="wide">
      <PageHeader className="mb-4" title={OPERATIONS_PAGE.title} meta={OPERATIONS_PAGE.meta} />
      <SectionTabs
        className="mb-5"
        label={OPERATIONS_PAGE.tabsLabel}
        tabs={[
          {
            href: DEVICE_TRANSFERS_ADDRESS,
            label: OPERATIONS_PAGE.deviceTransfersTab,
            current: true,
          },
        ]}
      />
      <ShowLinks show={show} />
      {failed ? (
        <FailedState
          title={stateWords('SA-18.failed')}
          reportHref={OPERATIONS_REPORT_ADDRESS}
          onRetry={retry}
        >
          {stateWords('SA-18.failed.line')}
        </FailedState>
      ) : loading ? (
        <LoadingState
          label={stateWords('SA-18.loading')}
          skeleton={<SkeletonRows />}
          surface="table"
        />
      ) : rows.length === 0 ? (
        <div className="xr-section">
          <EmptyState icon="myDevice" title={EMPTY[show].title}>
            {EMPTY[show].line}
          </EmptyState>
        </div>
      ) : (
        <LoadingState label={stateWords('SA-18.loading')} loading={false} surface="table">
          <table className="xr-table">
            <caption className="xr-sr">{TRANSFERS_LIST.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{TRANSFERS_LIST.columns.request}</th>
                <th scope="col">{TRANSFERS_LIST.columns.institution}</th>
                <th scope="col">{TRANSFERS_LIST.columns.forwarded}</th>
                <th scope="col">{TRANSFERS_LIST.columns.status}</th>
                <th scope="col">
                  <VisuallyHidden>{TRANSFERS_LIST.columns.action}</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((transfer) => (
                <TransferRow
                  key={transfer.id}
                  transfer={transfer}
                  institution={names.get(transfer.institutionId) ?? transfer.institutionId}
                />
              ))}
            </tbody>
          </table>
        </LoadingState>
      )}
    </PageContent>
  );
}

/** B3-11 "Show": `div.xr-seg.xl-seg` of links, the current one `aria-current="true"`. */
function ShowLinks({ show }: { readonly show: TransferShow }) {
  return (
    <div className="xr-seg xl-seg mb-4" role="group" aria-label={TRANSFERS_LIST.showLabel}>
      {TRANSFER_SHOWS.map((view) => (
        <Link
          key={view}
          href={deviceTransfersAddress(view)}
          aria-current={view === show ? 'true' : undefined}
        >
          {TRANSFERS_LIST.show[view]}
        </Link>
      ))}
    </div>
  );
}

/** One row as B3-11 draws it per state (f0 forwarded, f2 still with the institution, f3 approved). */
function TransferRow({
  transfer,
  institution,
}: {
  readonly transfer: DeviceTransfer;
  readonly institution: string;
}) {
  // A transfer still with its institution is not BITS's to decide: shown, never opened (f2).
  const opens = transfer.state !== 'with-institute-admin';
  return (
    <tr>
      <td className="is-primary">
        {opens ? (
          <Link className="font-[700]" href={deviceTransferAddress(transfer.id)}>
            <span className="xr-id">{transfer.id}</span>
          </Link>
        ) : (
          <span className="xr-id font-[700]">{transfer.id}</span>
        )}
        <span className="xr-sub">{transferSubLine(requesterName(transfer), transfer.format)}</span>
      </td>
      <td data-label={TRANSFERS_LIST.columns.institution}>{institution}</td>
      <td data-label={TRANSFERS_LIST.columns.forwarded}>{forwardedWords(transfer)}</td>
      <td data-label={TRANSFERS_LIST.columns.status}>
        <StatusPill tone={transferTone(transfer.state)}>
          {transferStatusWords(transfer.state)}
        </StatusPill>
      </td>
      <td>
        {transfer.state === 'forwarded' ? (
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={deviceTransferAddress(transfer.id)}
            aria-label={reviewLabel(transfer.id)}
          >
            {TRANSFERS_LIST.review}
          </Link>
        ) : null}
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
