'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ConfirmDialog,
  DefinitionList,
  IaRecordGrid,
  IaRqActionPanel,
  IaRqFormatFor,
  IaRqForwardButton,
  IaSectionBody,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  RecordLine,
  StandList,
  StatusPill,
  Surface,
  TextLink,
  Timeline,
} from '@xr/ui/v3';
import { useEffect, useRef, useState } from 'react';

import {
  DEVICE_REQUEST,
  decisionWords,
  forExperimentWords,
  forwardedFlash,
  forwardEffect,
  forwardTitle,
  historyWhen,
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
import { nameOf } from '../ia-17-requests/request-view';
import { useExperimentNames } from '../ia-17-requests/use-experiment-names';
import { TRANSFER_V3_TONE } from '../ia-18-device-requests/transfer-tone';
import { actorName } from '../shared/actor-name';
import { formatCodes } from '../shared/format-codes';
import { useInstitutionPaused } from '../shared/paused';
import {
  type StudentNaming,
  studentOf,
  transferHistoryLines,
  transferStatusWords,
} from '../shared/transfer-view';
import { useStudentNames } from '../shared/use-student-names';

const TITLE_ID = 'device-request-title';
const FLASH_ID = 'device-request-flash';
const FORWARD_ID = 'device-request-forward';

/** "Device requests", the crumb above a device request (IA-v1 `rk-crumbs`). */
const DEVICE_REQUESTS_CRUMB = {
  label: REQUESTS_PAGE.tabs.devices,
  href: DEVICE_REQUESTS_ADDRESS,
} as const;

/**
 * IA-19 Device request — review & forward in V3 (`/institute/requests/devices/[transferId]`; the
 * owner-approved Institute Admin export, IA-v1 `Main.dc.html` "IA-19", `vm19`): "Should this
 * request go to BITS?" The middle link of the Student → Institute Admin → BITS chain.
 *
 * - **Reads**: `OperationsService.getDeviceRequest` (existence and scope are the adapter's answer:
 *   another institution's request is not found — the in-shell not-found page; the export's "No
 *   device request to review" card is not adopted), the institution's students (the name and
 *   student id) and the published catalogue (the experiment's name). The pause is the session's
 *   fact (the XS-08 banner), or a refusal of this page's forward.
 * - **As the export draws it**, named by content — never by the reference (state-copy
 *   `IA-17.no-reference`): the crumbs "Device requests › VR device transfer for Rahul Verma" (the
 *   browser tab too); "Device request", the title, the status in the Institute Admin's words and
 *   "Requested … by …"; then the record: "What the student asked for" (the student opening their
 *   record, the format and experiment, the device moving from, the new device, the note), "Your
 *   action" beside it (what is left to do, "Forward to BITS" while it waits on you, and where it
 *   stands: request, forwarded, BITS decision — `IA-19.stands`) and "History" below, without the
 *   devices.
 * - **One action**: "Forward to BITS" (Waiting on you, not paused) → the dialog "Forward Rahul
 *   Verma’s device request to BITS?" ("You can’t take it back once it’s forwarded.", focus on its
 *   confirm) → `forwardDeviceTransfer` with the revision the page read; then the flash "Forwarded
 *   to BITS" and focus on it. Forwarded and decided are read-only. While paused the request waits,
 *   read-only, with the notice. The Institute Admin never approves or declines (T-32). A refusal
 *   because the request moved on (stale revision, already forwarded) writes nothing: the page reads
 *   again and focus goes to the title (state-copy `IA-19.moved-on`); a failure for now keeps the
 *   dialog (`IA-19.unavailable`).
 * - The transfer is an authorisation change only: nothing is shipped or provisioned.
 */
export function DeviceRequest({ transferId }: { readonly transferId: string }) {
  const read = useDeviceRequest(transferId);
  const students = useStudentNames();
  const names = useExperimentNames();
  const transfer = read.data?.ok ? read.data.value : null;
  const ready = transfer !== null && !students.pending && !names.pending;
  const student = ready ? studentOf(transfer, students.byId) : null;
  const title = ready && student ? transferTitle(transfer.format, student.fullName) : null;
  useShellPage(deviceRequestPlacement(title, REQUESTS_PAGE.tabs.devices));
  const { notFound } = useAppNavigation();

  if (read.isError) {
    return (
      <>
        <Breadcrumbs levels={[DEVICE_REQUESTS_CRUMB]} current={DEVICE_REQUEST.overline} />
        <Surface>
          <ListState
            kind="failed"
            titleAs="h2"
            title={stateWords('IA-19.failed')}
            action={
              <Button
                onClick={() => {
                  void read.refetch();
                }}
              >
                {REQUESTS_PAGE.tryAgain}
              </Button>
            }
          >
            {REQUESTS_PAGE.failedLine}
          </ListState>
        </Surface>
      </>
    );
  }
  if (read.data && !read.data.ok) notFound();
  if (!ready || student === null || title === null) {
    return (
      <Surface busy>
        <LoadingRows message={stateWords('IA-19.loading')} cells={[2, 1]} rows={2} />
      </Surface>
    );
  }
  const experiment =
    transfer.experimentId === null ? null : nameOf(names.byId, transfer.experimentId).name;
  return (
    <TransferPage
      transfer={transfer}
      student={student}
      title={title}
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
  title,
  experiment,
  refetch,
}: {
  readonly transfer: DeviceTransfer;
  readonly student: StudentNaming;
  readonly title: string;
  readonly experiment: string | null;
  readonly refetch: () => void;
}) {
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const forward = useCommand((ports) => ports.operations.forwardDeviceTransfer);
  /** The open dialog, with the revision the page showed when it opened. */
  const [confirming, setConfirming] = useState<{ readonly expectedRev: number } | null>(null);
  const [flash, setFlash] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const flashShown = flash && transfer.state === 'forwarded';
  // Focus moves after the commit that shows its target (the export's `focusLater('ia-flash')`):
  // the flash shows once the request reads forwarded, after the dialog has given focus back to
  // its trigger, so the request waits for it.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    if (focusRequest.id === 'flash') document.getElementById(FLASH_ID)?.focus();
    else titleRef.current?.focus();
  }, [focusRequest, flashShown]);
  const focus = (id: 'flash' | 'title') => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const waiting = transfer.state === 'with-institute-admin';
  const canForward = waiting && !paused;
  const blocked = waiting && paused;
  const [format] = formatCodes([transfer.format]);

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
          focus('flash');
        } else refused(answer.error);
      },
      // Failed for now: the dialog stays (state-copy `IA-19.unavailable`).
      () => undefined,
    );
  };

  const action = blocked
    ? DEVICE_REQUEST.blocked
    : waiting
      ? DEVICE_REQUEST.canForward
      : transfer.state === 'forwarded'
        ? DEVICE_REQUEST.forwarded
        : DEVICE_REQUEST.approved;
  const { stand } = DEVICE_REQUEST;
  const forwardedBy = transfer.forwarded ? actorName(transfer.forwarded.by) : null;
  // The devices are in "What the student asked for": the history does not repeat them.
  const requestedIds = new Set<string>(
    transfer.history.filter((entry) => entry.event === 'requested').map((entry) => entry.id),
  );

  return (
    <>
      <PageHead
        breadcrumbs={<Breadcrumbs levels={[DEVICE_REQUESTS_CRUMB]} current={title} />}
        variant="record"
        eyebrow={DEVICE_REQUEST.overline}
        title={title}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={TRANSFER_V3_TONE[transfer.state]}>
              {transferStatusWords(transfer.state)}
            </StatusPill>
            <span>{requestedWords(transfer.requestedAt, student.fullName)}</span>
          </>
        }
      />
      {flashShown ? (
        <Notice tone="ok" role="status" id={FLASH_ID} title={DEVICE_REQUEST.forwardedTitle}>
          {forwardedFlash(student.fullName)}
        </Notice>
      ) : null}
      {blocked ? (
        <Notice tone="paused" icon="lock" role="status" title={DEVICE_REQUEST.pausedTitle}>
          {DEVICE_REQUEST.pausedLine}
        </Notice>
      ) : null}
      <IaRecordGrid
        main={
          <Surface labelledBy="device-request-asked">
            <IaSectionBody
              title={DEVICE_REQUEST.asked}
              titleId="device-request-asked"
              size="section"
            >
              <DefinitionList
                items={[
                  {
                    term: DEVICE_REQUEST.keys.student,
                    value: (
                      <>
                        <TextLink href={studentRecordAddress(transfer.studentId)}>
                          {student.fullName}
                        </TextLink>
                        {student.institutionStudentId ? ` · ${student.institutionStudentId}` : null}
                      </>
                    ),
                  },
                  {
                    term: DEVICE_REQUEST.keys.format,
                    value: (
                      <IaRqFormatFor code={format ?? transfer.format}>
                        {experiment ? forExperimentWords(experiment) : null}
                      </IaRqFormatFor>
                    ),
                  },
                  { term: DEVICE_REQUEST.keys.from, value: transfer.fromDevice },
                  { term: DEVICE_REQUEST.keys.newDevice, value: transfer.newDevice },
                  {
                    term: DEVICE_REQUEST.keys.note,
                    value: transfer.note?.trim() ? transfer.note : DEVICE_REQUEST.noNote,
                  },
                ]}
              />
            </IaSectionBody>
          </Surface>
        }
        side={
          <IaRqActionPanel title={DEVICE_REQUEST.action} titleId="device-request-action">
            <RecordLine>{action}</RecordLine>
            {canForward ? (
              <IaRqForwardButton
                id={FORWARD_ID}
                onPress={() => setConfirming({ expectedRev: transfer.rev })}
              >
                {DEVICE_REQUEST.forward}
              </IaRqForwardButton>
            ) : null}
            <StandList
              items={[
                { term: stand.request, value: transferStatusWords(transfer.state) },
                {
                  term: stand.forwarded,
                  value: transfer.forwarded
                    ? historyWhen(transfer.forwarded.at, forwardedBy)
                    : transfer.state === 'approved'
                      ? stand.notRecorded
                      : stand.notYet,
                },
                {
                  term: stand.decision,
                  value: transfer.approved ? decisionWords(transfer.approved.at) : stand.notYet,
                },
              ]}
            />
          </IaRqActionPanel>
        }
        more={
          <Surface labelledBy="device-request-history">
            <IaSectionBody
              title={DEVICE_REQUEST.history}
              titleId="device-request-history"
              size="section"
            >
              <Timeline
                events={transferHistoryLines(transfer, student.fullName).map((line) => ({
                  what: line.what,
                  when: line.when,
                  ...(line.note && !requestedIds.has(line.id) ? { note: line.note } : {}),
                }))}
              />
            </IaSectionBody>
          </Surface>
        }
      />
      <ConfirmDialog
        open={confirming !== null && canForward}
        idPrefix="device-forward-dialog"
        initialFocus="confirm"
        returnFocusFallback={titleRef}
        title={forwardTitle(student.fullName)}
        description={forwardEffect(student.fullName, transfer.format, transfer.newDevice)}
        confirmLabel={DEVICE_REQUEST.forward}
        busyLook
        busy={forward.busy}
        busyLabel={DEVICE_REQUEST.forwarding}
        onConfirm={confirm}
        onCancel={() => setConfirming(null)}
      >
        {null}
      </ConfirmDialog>
    </>
  );
}
