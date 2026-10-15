'use client';

import type { DeviceTransfer } from '@xr/domain';
import { EmptyState, Link, LoadingState, StatusPill } from '@xr/ui';

import {
  DEVICE_REQUESTS,
  reviewLabel,
  transferDateWords,
  transferKindWords,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { deviceRequestAddress } from '@/nav/institute-requests';
import { useDeviceRequests } from '@/queries/devices';

import { LoadFailed } from '../ia-02-content-access/institute-parts';
import {
  newestFirst,
  type StudentNames,
  studentOf,
  TRANSFER_TONE,
  transferStatusWords,
} from './transfer-view';
import { useStudentNames } from './use-student-names';

/**
 * IA-18 Device requests — the Requests page's second tab (`/institute/requests?tab=devices`;
 * board B3-09 f0): "Which device requests need me?" The institution's device requests
 * (`OperationsService.listDeviceRequests`), newest first, one row each — the student (their name
 * opens the request) with their institution student id, "VR device transfer" with its reference
 * and date, the status in the Institute Admin's words (Waiting on you · Forwarded to BITS ·
 * Decided · approved by BITS — the Student reads the same record on My device, B3-07) and
 * "Review" on a request waiting on the Institute Admin while the institution is not paused
 * (B3-09 `canForward`). Decided requests stay listed. The Institute Admin forwards on IA-19;
 * BITS decides — there is no approve or decline here (T-32). No request yet: "No device request
 * yet" (B3-09 none; state-copy `IA-18.empty.line`).
 */
export function DeviceRequestsTab({ paused }: { readonly paused: boolean }) {
  const requests = useDeviceRequests();
  const students = useStudentNames();
  const answer = requests.data;
  if (requests.isError || (answer && !answer.ok)) {
    return (
      <LoadFailed
        title={stateWords('IA-18.failed')}
        onRetry={() => {
          void requests.refetch();
        }}
      />
    );
  }
  if (!answer || students.pending) {
    return <LoadingState label={stateWords('IA-18.loading')} surface="section" />;
  }
  if (answer.value.length === 0) {
    return (
      <div className="xr-section">
        <EmptyState icon="myDevice" title={DEVICE_REQUESTS.emptyTitle}>
          {stateWords('IA-18.empty.line')}
        </EmptyState>
      </div>
    );
  }
  const { columns } = DEVICE_REQUESTS;
  return (
    <>
      <p className="xl-meta mx-0 mt-0 mb-3">{DEVICE_REQUESTS.line}</p>
      <div className="xr-table-wrap">
        <table className="xr-table">
          <caption className="xr-sr">{DEVICE_REQUESTS.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.student}</th>
              <th scope="col">{columns.request}</th>
              <th scope="col">{columns.status}</th>
              <th scope="col">
                <span className="xr-sr">{columns.action}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {newestFirst(answer.value).map((transfer) => (
              <TransferRow
                key={transfer.id}
                transfer={transfer}
                students={students.byId}
                paused={paused}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TransferRow({
  transfer,
  students,
  paused,
}: {
  readonly transfer: DeviceTransfer;
  readonly students: StudentNames;
  readonly paused: boolean;
}) {
  const student = studentOf(transfer, students);
  const href = deviceRequestAddress(transfer.id);
  const { columns } = DEVICE_REQUESTS;
  return (
    <tr>
      <td className="is-primary">
        <Link href={href} className="font-[700]">
          {student.fullName}
        </Link>
        {student.institutionStudentId ? (
          <span className="xr-sub xr-id">{student.institutionStudentId}</span>
        ) : null}
      </td>
      <td data-label={columns.request}>
        {transferKindWords(transfer.format)}
        <span className="xr-sub">
          <span className="xr-id">{transfer.id}</span>
          {transferDateWords(transfer.requestedAt)}
        </span>
      </td>
      <td data-label={columns.status}>
        <StatusPill tone={TRANSFER_TONE[transfer.state]}>
          {transferStatusWords(transfer.state)}
        </StatusPill>
      </td>
      <td>
        {transfer.state === 'with-institute-admin' && !paused ? (
          <Link
            className="xr-btn xr-btn--secondary xr-btn--sm"
            href={href}
            aria-label={reviewLabel(student.fullName)}
          >
            {DEVICE_REQUESTS.review}
          </Link>
        ) : null}
      </td>
    </tr>
  );
}
