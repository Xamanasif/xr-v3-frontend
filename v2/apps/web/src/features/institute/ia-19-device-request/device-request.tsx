'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  FormatBadge,
  type FormatCode,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
  Timeline,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import {
  DEVICE_REQUEST,
  forExperimentWords,
  forwardedFlash,
  forwardEffect,
  forwardTitle,
  REQUESTS_PAGE,
  requestedWords,
  transferTitle,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { studentRecordAddress } from '@/nav/institute';
import { DEVICE_REQUESTS_ADDRESS, deviceRequestPlacement } from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useDeviceRequest } from '@/queries/devices';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed } from '../ia-02-content-access/institute-parts';
import { useInstitutionPaused } from '../ia-06-people/paused';
import { nameOf } from '../ia-17-requests/request-view';
import { useExperimentNames } from '../ia-17-requests/use-experiment-names';
import {
  type StudentNaming,
  studentOf,
  TRANSFER_TONE,
  transferHistoryLines,
  transferStatusWords,
} from '../ia-18-device-requests/transfer-view';
import { useStudentNames } from '../ia-18-device-requests/use-student-names';

const STATUS_ID = 'device-request-status';
const FORWARD_ID = 'device-request-forward';

/**
 * IA-19 Device request — review & forward, board B3-09 f1 … f5 (`/institute/requests/devices/
 * [transferId]`): "Should this request go to BITS?" The middle link of the Student → Institute
 * Admin → BITS chain.
 *
 * - **Reads**: `OperationsService.getDeviceRequest` (existence and scope are the adapter's answer:
 *   another institution's request is not found), the institution's students (the name and student
 *   id) and the published catalogue (the experiment's name). The pause is the session's fact (the
 *   XS-08 banner), or a refusal of this page's forward.
 * - **As B3-09 draws it**: back to Device requests; "Device request · DTR-0018", "VR device
 *   transfer for Rahul Verma", the status in the Institute Admin's words and "Requested … by …";
 *   "What the student asked for" (the student opening their record, the format and experiment,
 *   the device moving from, the new device, the note); "Your action"; "History".
 * - **One action**: "Forward to BITS" (Waiting on you, not paused) → DL-1 ("You can’t take it back
 *   once it’s forwarded.") → `forwardDeviceTransfer` with the revision the page read; then the
 *   flash "Forwarded to BITS. … BITS decides." and focus on the status (f1 → f2). Forwarded (f2)
 *   and decided (f3) are read-only. While paused the request waits, read-only, with the notice
 *   (f4). The Institute Admin never approves or declines (T-32). A refusal because the request
 *   moved on (stale revision, already forwarded) writes nothing: the page reads again and focus
 *   goes to the title (state-copy `IA-19.moved-on`); a failure for now keeps the dialog
 *   (`IA-19.unavailable`).
 * - The transfer is an authorisation change only: nothing is shipped or provisioned.
 */
export function DeviceRequest({ transferId }: { readonly transferId: string }) {
  const read = useDeviceRequest(transferId);
  const students = useStudentNames();
  const names = useExperimentNames();
  const transfer = read.data?.ok ? read.data.value : null;
  useShellPage(deviceRequestPlacement(transfer ? transfer.id : null, REQUESTS_PAGE.tabs.devices));
  const { notFound } = useAppNavigation();

  if (read.isError) {
    return (
      <PageContent wrap="read">
        <BackLink href={DEVICE_REQUESTS_ADDRESS}>{DEVICE_REQUEST.back}</BackLink>
        <div className="h-2" />
        <LoadFailed
          title={stateWords('IA-19.failed')}
          onRetry={() => {
            void read.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (read.data && !read.data.ok) notFound();
  if (transfer === null || students.pending || names.pending) {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('IA-19.loading')} surface="section" />
      </PageContent>
    );
  }
  const experiment =
    transfer.experimentId === null ? null : nameOf(names.byId, transfer.experimentId).name;
  return (
    <TransferPage
      transfer={transfer}
      student={studentOf(transfer, students.byId)}
      experiment={experiment}
      refetch={() => {
        void read.refetch();
      }}
    />
  );
}

function TransferPage({
  transfer,
  student,
  experiment,
  refetch,
}: {
  readonly transfer: DeviceTransfer;
  readonly student: StudentNaming;
  readonly experiment: string | null;
  readonly refetch: () => void;
}) {
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const forward = useCommand((ports) => ports.operations.forwardDeviceTransfer);
  /** The open DL-1, with the revision the page showed when it opened. */
  const [confirming, setConfirming] = useState<{ readonly expectedRev: number } | null>(null);
  const [flash, setFlash] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  // Focus moves after the commit that shows its target (B3-09 `focus(pid + '-iastatus')`); the
  // dialog has given focus back to its trigger in the same commit, so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    (focusRequest.id === 'status' ? statusRef.current : titleRef.current)?.focus();
  }, [focusRequest]);
  const focus = (id: 'status' | 'title') =>
    setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const waiting = transfer.state === 'with-institute-admin';
  const canForward = waiting && !paused;
  const blocked = waiting && paused;
  const format = transfer.format.toUpperCase() as FormatCode;
  const effect = forwardEffect(student.fullName, transfer.format);

  const refused = (error: ServiceError) => {
    setConfirming(null);
    if (error.kind === 'refused' && error.code === 'institution-paused') setRefusedPaused(true);
    refetch();
    focus('title');
  };

  const confirm = () => {
    if (!confirming) return;
    forward.run({ id: transfer.id, expectedRev: confirming.expectedRev }).then(
      (answer) => {
        if (answer.ok) {
          setConfirming(null);
          setFlash(true);
          focus('status');
        } else refused(answer.error);
      },
      // Failed for now: the dialog stays (state-copy `IA-19.unavailable`).
      () => undefined,
    );
  };

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={DEVICE_REQUESTS_ADDRESS}>{DEVICE_REQUEST.back}</BackLink>}
        overline={
          <>
            {DEVICE_REQUEST.overline} · <span className="xr-id">{transfer.id}</span>
          </>
        }
        title={transferTitle(transfer.format, student.fullName)}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <div
            ref={statusRef}
            id={STATUS_ID}
            tabIndex={-1}
            className="flex flex-wrap items-center gap-x-[14px] gap-y-2"
          >
            <StatusPill tone={TRANSFER_TONE[transfer.state]}>
              {transferStatusWords(transfer.state)}
            </StatusPill>
            <span className="xl-meta">
              {requestedWords(transfer.requestedAt, student.fullName)}
            </span>
          </div>
        }
      />
      {flash && transfer.state === 'forwarded' ? (
        <div className="mb-4">
          <Notice tone="ok">{forwardedFlash(student.fullName)}</Notice>
        </div>
      ) : null}
      {blocked ? (
        <div className="mb-4">
          <Notice tone="warn" icon="readOnly" title={DEVICE_REQUEST.pausedTitle}>
            {DEVICE_REQUEST.pausedLine}
          </Notice>
        </div>
      ) : null}
      <div className="xw-stack">
        <Section title={DEVICE_REQUEST.asked} headingId="device-request-asked">
          <div className="xr-section-body">
            <dl className="xl-kv">
              <dt>{DEVICE_REQUEST.keys.student}</dt>
              <dd>
                <Link href={studentRecordAddress(transfer.studentId)}>{student.fullName}</Link>
                {student.institutionStudentId ? (
                  <>
                    {' · '}
                    <span className="xr-id">{student.institutionStudentId}</span>
                  </>
                ) : null}
              </dd>
              <dt>{DEVICE_REQUEST.keys.format}</dt>
              <dd>
                <FormatBadge format={format} variant="yours" compact />
                {experiment ? forExperimentWords(experiment) : null}
              </dd>
              <dt>{DEVICE_REQUEST.keys.from}</dt>
              <dd>{transfer.fromDevice}</dd>
              <dt>{DEVICE_REQUEST.keys.newDevice}</dt>
              <dd>{transfer.newDevice}</dd>
              <dt>{DEVICE_REQUEST.keys.note}</dt>
              <dd>{transfer.note?.trim() ? transfer.note : DEVICE_REQUEST.noNote}</dd>
            </dl>
          </div>
        </Section>
        <Section title={DEVICE_REQUEST.action} headingId="device-request-action">
          <div className="xr-section-body flex flex-col gap-3">
            {canForward ? (
              <>
                <p className="xr-body m-0 text-ink-2">{DEVICE_REQUEST.canForward}</p>
                <div>
                  <Button
                    id={FORWARD_ID}
                    variant="primary"
                    onClick={() => setConfirming({ expectedRev: transfer.rev })}
                  >
                    {DEVICE_REQUEST.forward}
                  </Button>
                </div>
              </>
            ) : null}
            {transfer.state === 'forwarded' ? (
              <p className="xr-body m-0 text-ink-2">{DEVICE_REQUEST.forwarded}</p>
            ) : null}
            {transfer.state === 'approved' ? (
              <p className="xr-body m-0 text-ink-2">{DEVICE_REQUEST.approved}</p>
            ) : null}
            {blocked ? <p className="xr-body m-0 text-ink-2">{DEVICE_REQUEST.blocked}</p> : null}
          </div>
        </Section>
        <Section title={DEVICE_REQUEST.history} headingId="device-request-history">
          <div className="xr-section-body">
            <Timeline
              events={transferHistoryLines(transfer, student.fullName).map((line) => ({
                id: line.id,
                what: line.what,
                when: line.when,
                ...(line.note ? { note: line.note } : {}),
              }))}
            />
          </div>
        </Section>
      </div>
      <ConfirmDialog
        open={confirming !== null && canForward}
        align="start"
        idPrefix="device-forward-dialog"
        returnFocusFallback={titleRef}
        title={forwardTitle(transfer.id)}
        effect={
          <>
            {effect.before}
            <strong className="text-ink">{transfer.newDevice}</strong>
            {effect.after}
          </>
        }
        confirmLabel={DEVICE_REQUEST.forward}
        busy={forward.busy}
        busyLabel={DEVICE_REQUEST.forwarding}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      />
    </PageContent>
  );
}
