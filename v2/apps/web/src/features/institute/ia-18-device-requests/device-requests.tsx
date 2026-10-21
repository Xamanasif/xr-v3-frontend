'use client';

import {
  Button,
  IaManageSurface,
  IaRqDeviceTable,
  ListState,
  LoadingRows,
  Notice,
  RecordLine,
  StatusPill,
} from '@xr/ui/v3';

import {
  DEVICE_REQUESTS,
  openTransferLabel,
  REQUESTS_PAGE,
  reviewLabel,
  transferDateWords,
  transferKindWords,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { studentRecordAddress } from '@/nav/institute';
import { deviceRequestAddress } from '@/nav/institute-requests';
import { useDeviceRequests } from '@/queries/devices';

import { newestFirst, studentOf, transferStatusWords } from '../shared/transfer-view';
import { useStudentNames } from '../shared/use-student-names';
import { TRANSFER_V3_TONE } from './transfer-tone';

const LIST_HEADING_ID = 'device-requests-h';

/**
 * IA-18 Device requests — the Requests page's second tab in V3 (`/institute/requests?tab=devices`;
 * the owner-approved Institute Admin export, IA-v1 `Main.dc.html` "IA-18 Device requests tab",
 * `vm18`): "Which device requests need me?" One explanation ("You forward device requests to BITS.
 * BITS decides."), the paused notice while the institution is paused, then the institution's
 * device requests (`OperationsService.listDeviceRequests`), newest first, in the role's list
 * table — the student (their name opens their record) with their institution student id, "VR
 * device transfer" (opening the request, named by its format, student and date — never by its
 * reference: state-copy `IA-17.no-reference`) with the date it was asked, the status in the
 * Institute Admin's words (Waiting on you · Forwarded to BITS · Decided · approved by BITS — the
 * Student reads the same record on My device) and "Review" on a request waiting on the Institute
 * Admin while the institution is not paused. Decided requests stay listed. The Institute Admin
 * forwards on IA-19; BITS decides — there is no approve or decline here (T-32). No request yet:
 * "No device request yet". Loading and a failed read draw the V3 list states in the surface.
 */
export function DeviceRequestsTab({
  paused,
  onRetry,
}: {
  readonly paused: boolean;
  /** After "Try again": focus to the page's H1. */
  readonly onRetry: () => void;
}) {
  const requests = useDeviceRequests();
  const students = useStudentNames();
  const answer = requests.data;
  const failed = requests.isError || (answer !== undefined && !answer.ok);
  const loading = !failed && (!answer || students.pending);

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        titleAs="h2"
        title={stateWords('IA-18.failed')}
        action={
          <Button
            onClick={() => {
              void requests.refetch();
              onRetry();
            }}
          >
            {REQUESTS_PAGE.tryAgain}
          </Button>
        }
      >
        {REQUESTS_PAGE.failedLine}
      </ListState>
    );
  } else if (loading || !answer?.ok) {
    body = <LoadingRows message={stateWords('IA-18.loading')} cells={[2, 2, 1, 1]} />;
  } else if (answer.value.length === 0) {
    body = (
      <ListState kind="empty" roomy titleAs="h2" icon="device" title={DEVICE_REQUESTS.emptyTitle}>
        {stateWords('IA-18.empty.line')}
      </ListState>
    );
  } else {
    body = (
      <IaRqDeviceTable
        caption={DEVICE_REQUESTS.caption}
        headers={DEVICE_REQUESTS.columns}
        rows={newestFirst(answer.value).map((transfer) => {
          const student = studentOf(transfer, students.byId);
          const href = deviceRequestAddress(transfer.id);
          return {
            key: transfer.id,
            student: {
              name: student.fullName,
              href: studentRecordAddress(transfer.studentId),
            },
            studentId: student.institutionStudentId,
            request: {
              label: transferKindWords(transfer.format),
              href,
              accessibleName: openTransferLabel(
                transfer.format,
                student.fullName,
                transfer.requestedAt,
              ),
            },
            date: transferDateWords(transfer.requestedAt),
            status: (
              <StatusPill tone={TRANSFER_V3_TONE[transfer.state]}>
                {transferStatusWords(transfer.state)}
              </StatusPill>
            ),
            review:
              transfer.state === 'with-institute-admin' && !paused
                ? {
                    label: DEVICE_REQUESTS.review,
                    href,
                    accessibleName: reviewLabel(student.fullName),
                  }
                : null,
          };
        })}
      />
    );
  }

  return (
    <>
      <RecordLine>{DEVICE_REQUESTS.line}</RecordLine>
      {paused ? (
        <Notice tone="paused" icon="lock" role="status" title={DEVICE_REQUESTS.pausedTitle}>
          {DEVICE_REQUESTS.pausedLine}
        </Notice>
      ) : null}
      <IaManageSurface
        labelledBy={LIST_HEADING_ID}
        hiddenTitle={DEVICE_REQUESTS.heading}
        busy={loading}
      >
        {body}
      </IaManageSurface>
    </>
  );
}
