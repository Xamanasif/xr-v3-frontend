'use client';

import type { DeviceTransfer } from '@xr/domain';
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

import {
  TRANSFERS_LIST,
  transferKindWords,
  transferRowLabel,
  transfersCaption,
} from '@/copy/operations';
import { SA_FAILED } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  DEVICE_TRANSFERS_ADDRESS,
  deviceTransferAddress,
  deviceTransfersAddress,
  deviceTransfersPlacement,
  SHOW_STATE,
  showOf,
  TRANSFER_SHOWS,
  type TransferShow,
} from '@/nav/operations';
import { useDeviceTransfers } from '@/queries/devices';
import { useInstitutionTab } from '@/queries/institutions';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { OperationsHead } from '../sa-20-support/operations-tabs';
import {
  forwardedDay,
  forwarderWords,
  inListOrder,
  requesterName,
  transferStatusWords,
  transferTone,
} from './transfer-view';

/** Each view's empty state (state-copy `SA-18.empty.*`; the export's `V.transfers`). */
const EMPTY: Readonly<Record<TransferShow, string>> = {
  forwarded: stateWords('SA-18.empty.forwarded'),
  'with-institution': stateWords('SA-18.empty.with-institution'),
  approved: stateWords('SA-18.empty.approved'),
};

/**
 * SA-18 Operations › Device transfers, at `/admin/operations/device-transfers`
 * (`/admin/operations` redirects here), as the Super Admin export draws it (SA-v1 `V.transfers`).
 *
 * - **Read**: `OperationsService.listDeviceTransfers({ state })` for the view on show — every
 *   institution's transfers, as the service lets the Super Admin see them (`useDeviceTransfers`)
 *   — with the institutions named from `listInstitutions`; the view switch's counts are the
 *   service's answer for every state (`listDeviceTransfers({})`, the read SA-19 makes). The DTR
 *   record is the one the Student (ST-18) and the Institute Admin (IA-18, IA-19) read.
 * - **Views** (`sa-seg`): Forwarded to BITS (the list's own address) · Still with an institution
 *   (`?show=with-institution`) · Approved (`?show=approved`), each with its count. The view lives
 *   here while the page is on show; the address mirrors it (replaced, no history entry) and an
 *   address from outside is read again; one whose `show` names no view is replaced by the list's
 *   address (state-copy `SA-18.show-address`).
 * - **Rows** (the record table, its three width layouts): the Student (the record's own
 *   "requested" entry) over "VR device transfer", the institution, who forwarded it, the day it
 *   was forwarded ("Not yet"), the status. Every row opens its transfer (SA-19), named by
 *   content — never by its reference (state-copy `SA-18.rows`).
 * - Loading, failed + Try again and the empty views are the kit's list states (state-copy
 *   `SA-18.*`); the foot says what approving does and that there is no Decline.
 */
export function DeviceTransfers() {
  const navigation = useAppNavigation();
  const addressed = showOf(navigation.search);
  const [show, setShow] = useState<TransferShow>(addressed ?? 'forwarded');
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setShow(addressed ?? 'forwarded');
  }
  useEffect(() => {
    if (addressed === null) navigation.replace(DEVICE_TRANSFERS_ADDRESS);
  }, [addressed, navigation]);
  useShellPage(deviceTransfersPlacement());

  const transfers = useDeviceTransfers(SHOW_STATE[show]);
  const institutions = useInstitutionTab('all');
  const every = useDeviceTransfers(null);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);

  const counts = useMemo(() => {
    if (!every.data?.ok) return null;
    const all = every.data.value;
    return Object.fromEntries(
      TRANSFER_SHOWS.map((view) => [
        view,
        all.filter((transfer) => transfer.state === SHOW_STATE[view]).length,
      ]),
    ) as Record<TransferShow, number>;
  }, [every.data]);

  const failed =
    transfers.isError ||
    institutions.isError ||
    (transfers.data !== undefined && !transfers.data.ok);
  const loading = !failed && (transfers.data === undefined || institutions.data === undefined);
  const rows = transfers.data?.ok ? inListOrder(transfers.data.value, show) : [];

  const choose = (next: TransferShow) => {
    setShow(next);
    navigation.replace(deviceTransfersAddress(next));
  };
  const retry = () => {
    if (transfers.isError || (transfers.data && !transfers.data.ok)) void transfers.refetch();
    if (institutions.isError) void institutions.refetch();
    if (every.isError || (every.data && !every.data.ok)) void every.refetch();
  };

  return (
    <>
      <OperationsHead current="device-transfers" />
      <ListSurface label={TRANSFERS_LIST.label} busy={loading}>
        <SwitchToolbar
          label={TRANSFERS_LIST.switchLabel}
          value={show}
          onChange={choose}
          options={TRANSFER_SHOWS.map((view) => ({
            key: view,
            label: TRANSFERS_LIST.show[view],
            ...(counts ? { count: counts[view] } : {}),
          }))}
        />
        {failed ? (
          <ListState
            kind="failed"
            title={stateWords('SA-18.failed')}
            action={<Button onClick={retry}>{SA_FAILED.retry}</Button>}
          >
            {SA_FAILED.line}
          </ListState>
        ) : loading ? (
          <LoadingRows message={stateWords('SA-18.loading')} />
        ) : rows.length === 0 ? (
          <ListState kind="empty" icon="headset" title={EMPTY[show]}>
            {stateWords('SA-18.empty.line')}
          </ListState>
        ) : (
          <RecordTable
            caption={transfersCaption(TRANSFERS_LIST.show[show])}
            headers={{
              who: TRANSFERS_LIST.columns.student,
              what: TRANSFERS_LIST.columns.institution,
              kind: TRANSFERS_LIST.columns.forwardedBy,
              when: TRANSFERS_LIST.columns.forwarded,
              status: TRANSFERS_LIST.columns.status,
            }}
            whenLabel={TRANSFERS_LIST.columns.forwarded}
            rows={rows.map((transfer) =>
              transferRow(transfer, names.get(transfer.institutionId) ?? transfer.institutionId),
            )}
          />
        )}
        <ListFoot>{TRANSFERS_LIST.foot}</ListFoot>
      </ListSurface>
    </>
  );
}

/** One transfer as the export's row draws it: who and what, where, who forwarded it, when, status. */
function transferRow(transfer: DeviceTransfer, institution: string): RecordTableRow {
  const student = requesterName(transfer);
  const status = transferStatusWords(transfer.state);
  return {
    key: transfer.id,
    href: deviceTransferAddress(transfer.id),
    title: student,
    linkLabel: transferRowLabel(transfer.format, student, status),
    titleDetail: transferKindWords(transfer.format),
    what: <CellLines strong={institution} />,
    kind: <QuietLine flush>{forwarderWords(transfer) ?? TRANSFERS_LIST.notForwardedYet}</QuietLine>,
    when: forwardedDay(transfer),
    status: <StatusPill tone={transferTone(transfer.state)}>{status}</StatusPill>,
  };
}
