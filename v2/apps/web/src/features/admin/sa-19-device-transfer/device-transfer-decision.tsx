'use client';

import type { InstitutionDetail, Result, ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ConfirmDialog,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  GoButton,
  Hint,
  Notice,
  PageHead,
  RecordLine,
  SectionNote,
  StatusPill,
  SurfaceSection,
  Timeline,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { dateTime, weekdayDate } from '@/copy/dates';
import { TRANSFER_ACTIONS, transferActionWords } from '@/copy/flow-state-words';
import {
  approvedFlashLine,
  approvedNextWords,
  approvedOnWords,
  approvingMovesWords,
  confirmNowItems,
  confirmTitle,
  DECISION_PAGE,
  decisionTitle,
  formatValue,
  OPERATIONS_PAGE,
  quotedNote,
  studentWords,
} from '@/copy/operations';
import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import {
  DEVICE_TRANSFERS_ADDRESS,
  deviceTransferPlacement,
  deviceTransfersPlacement,
  operationsUnavailablePlacement,
} from '@/nav/operations';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useDeviceTransfers } from '@/queries/devices';
import { useTransferInstitution } from '@/queries/operations-extra';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import {
  actorName,
  forwarderWords,
  historyEvents,
  requesterName,
  transferStatusWords,
  transferTone,
} from '../sa-18-device-transfers/transfer-view';

/** The decision column's id (`aside.rk-aside`; "Go to decision" leads here under 860 px). */
const PANEL_ID = 'transfer-decision';
const PANEL_TITLE_ID = 'transfer-decision-h';
/** The flash said once the approval made here is recorded (`div.rk-notice--ok`). */
const FLASH_ID = 'transfer-flash';

/** What the page names besides the record: the institution and the experiment. */
interface TransferContext {
  readonly institution: InstitutionDetail | null;
  readonly experiment: string | null;
}

/**
 * SA-19 Device transfer decision, at `/admin/operations/device-transfers/[transferId]`, as the
 * Super Admin export draws it (SA-v1 `V.transfer`, `SA.DLG.approveDtr`).
 *
 * - **Read**: the transfer from `OperationsService.listDeviceTransfers` (the port has no
 *   single-transfer read for the Super Admin); an id it does not list is the GL-04 "This page
 *   isn’t available" message in place (`SaRecordGuard`). The institution (`getInstitution`: its
 *   name, the Student's institution number) and the experiment (the published catalogue) are named
 *   beside it (state-copy `SA-19.facts`). The page names the transfer by its content — the DTR
 *   reference is never shown (SA-v1 HANDOFF).
 * - **As drawn**: the crumbs Operations › Device transfers › the Student; "Device transfer", the
 *   title, the status and the institution; "The transfer" and its History (newest first) on the
 *   sheet; "Your decision" in the panel, sticky beside the sheet from 860 px and under it below,
 *   with "Go to decision".
 * - **Decide**: one action, "Approve transfer", while the transfer is forwarded
 *   (`transferActionWords`). It confirms first (what moves now; nothing shipped, collected or
 *   registered; no reason asked) and the confirmation sends `approveDeviceTransfer` with the
 *   transfer's revision from when it opened. Approved: the flash takes focus, the decided panel
 *   says who and when; the Student (ST-18) and the Institute Admin (IA-18, IA-19) read the same
 *   record. Refused (stale, approved elsewhere, not yet forwarded): nothing is written, the
 *   transfer is read again and the panel shows its current state under the refusal notice, focus
 *   on the panel's heading (state-copy `SA-19.moved-on`, `SA-19.stale.*`). Unavailable for now:
 *   the confirmation stays open. There is no Decline (T-32): a transfer not approved stays
 *   Forwarded.
 * - **Still with the institution**: the same page, the panel saying it is not BITS's to decide
 *   yet — read-only until the Institute Admin forwards it.
 */
export function DeviceTransferDecision({ transferId }: { readonly transferId: string }) {
  const read = useDeviceTransfers(null);
  const catalogue = usePublishedCatalogue();
  const transfer = read.data?.ok
    ? (read.data.value.find((candidate) => candidate.id === transferId) ?? null)
    : null;
  const institution = useTransferInstitution(transfer?.institutionId ?? null);
  // The address is untrusted text: the page names the transfer only once it is read.
  const unknown = read.data?.ok === true && transfer === null;
  useShellPage(
    transfer
      ? deviceTransferPlacement(decisionTitle(transfer.format, requesterName(transfer)))
      : unknown
        ? operationsUnavailablePlacement('SA-19', SA_UNAVAILABLE.documentTitle)
        : deviceTransfersPlacement(),
  );

  const experiments = useMemo(() => {
    const map = new Map<string, string>();
    if (catalogue.data?.ok) {
      for (const entry of catalogue.data.value.entries) map.set(entry.experimentId, entry.name);
    }
    return map;
  }, [catalogue.data]);

  // The record as the guard reads it: the listed transfer, or not found when the list (the one
  // Super Admin read of transfers) does not hold it.
  const answer: Result<DeviceTransfer, ServiceError> | undefined =
    read.data === undefined
      ? undefined
      : !read.data.ok
        ? read.data
        : transfer
          ? { ok: true, value: transfer, changed: [] }
          : { ok: false, error: { kind: 'not-found' } };
  const waiting = catalogue.isPending || (transfer !== null && institution.isPending);

  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : answer,
        isPending: read.isPending || waiting,
        isError: read.isError || catalogue.isError || institution.isError,
        refetch: () => {
          void read.refetch();
          void catalogue.refetch();
          if (transfer) void institution.refetch();
        },
      }}
      loadingLabel={stateWords('SA-19.loading')}
      failedTitle={stateWords('SA-19.failed')}
    >
      {(record) => (
        <TransferPage
          transfer={record}
          context={{
            institution: institution.data?.ok ? institution.data.value : null,
            experiment: record.experimentId ? (experiments.get(record.experimentId) ?? null) : null,
          }}
          refetch={() => void read.refetch()}
        />
      )}
    </SaRecordGuard>
  );
}

type FocusTarget = 'flash' | 'panel' | 'title';
type FocusRequest = { readonly target: FocusTarget; readonly count: number };

function TransferPage({
  transfer,
  context,
  refetch,
}: {
  readonly transfer: DeviceTransfer;
  readonly context: TransferContext;
  readonly refetch: () => void;
}) {
  const session = useSession();
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const student = requesterName(transfer);
  const title = decisionTitle(transfer.format, student);
  const status = transferStatusWords(transfer.state);
  const institutionName = context.institution?.institution.name ?? transfer.institutionId;
  const studentNumber =
    context.institution?.people.studentList.find((person) => person.id === transfer.studentId)
      ?.institutionStudentId ?? null;
  const forwardedBy = forwarderWords(transfer);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  // The flash is said once the approval made here is recorded, while the record is approved.
  const [flash, setFlash] = useState(false);
  // A refused approval: the notice above the panel's current state until "Check it again".
  const [refused, setRefused] = useState(false);
  // Focus moves in an effect: in the same commit the confirmation's own close has given focus
  // back (a child's effect runs first), so this request wins (as SA-03, SA-07).
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  useEffect(() => {
    if (!focus) return;
    const target =
      focus.target === 'flash' ? flashRef : focus.target === 'panel' ? panelTitleRef : titleRef;
    target.current?.focus();
  }, [focus, transfer.state]);
  const ask = (target: FocusTarget) =>
    setFocus((current) => ({ target, count: (current?.count ?? 0) + 1 }));

  const approvable = transferActionWords(transfer, 'super_admin') === TRANSFER_ACTIONS.approve;

  const facts = [
    { term: DECISION_PAGE.keys.student, value: studentWords(student, studentNumber) },
    { term: DECISION_PAGE.keys.institution, value: institutionName },
    { term: DECISION_PAGE.keys.format, value: formatValue(transfer.format, context.experiment) },
    { term: DECISION_PAGE.keys.from, value: transfer.fromDevice },
    { term: DECISION_PAGE.keys.to, value: transfer.newDevice },
    ...(transfer.note ? [{ term: DECISION_PAGE.keys.note, value: quotedNote(transfer.note) }] : []),
    ...(forwardedBy ? [{ term: DECISION_PAGE.keys.forwardedBy, value: forwardedBy }] : []),
  ];

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[
              { label: OPERATIONS_PAGE.title, href: DEVICE_TRANSFERS_ADDRESS },
              { label: OPERATIONS_PAGE.tabs['device-transfers'], href: DEVICE_TRANSFERS_ADDRESS },
            ]}
            current={student}
          />
        }
        variant="record"
        date={today ? weekdayDate(today) : undefined}
        eyebrow={DECISION_PAGE.eyebrow}
        title={title}
        titleId="page-h1"
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <StatusPill tone={transferTone(transfer.state)} size="lg">
              {status}
            </StatusPill>
            <span>{institutionName}</span>
          </>
        }
        goTo={{ label: DECISION_PAGE.goTo, targetId: PANEL_ID }}
      />
      {flash && transfer.state === 'approved' ? (
        <Notice
          ref={flashRef}
          id={FLASH_ID}
          tone="ok"
          icon="okDisc"
          role="status"
          title={DECISION_PAGE.approvedFlash}
        >
          {approvedFlashLine(student)}
        </Notice>
      ) : null}
      <DetailLayout
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_TITLE_ID}
        main={
          <>
            <SurfaceSection title={DECISION_PAGE.transfer} titleId="transfer-facts">
              <DefinitionList items={facts} />
            </SurfaceSection>
            <SurfaceSection
              title={DECISION_PAGE.history}
              titleId="transfer-history"
              aside={<SectionNote>{DECISION_PAGE.historyNote}</SectionNote>}
            >
              <Timeline events={historyEvents(transfer)} />
            </SurfaceSection>
          </>
        }
        aside={
          <DecisionPanel
            title={DECISION_PAGE.panelTitle}
            titleId={PANEL_TITLE_ID}
            titleRef={panelTitleRef}
          >
            {refused ? (
              <Notice
                tone="warn"
                icon="alertCircle"
                role="alert"
                title={stateWords('SA-19.stale.title')}
                actions={
                  <Button
                    onClick={() => {
                      setRefused(false);
                      ask('title');
                    }}
                  >
                    {DECISION_PAGE.checkAgain}
                  </Button>
                }
              >
                {stateWords('SA-19.stale.line')}
              </Notice>
            ) : null}
            {approvable ? (
              <OpenPanel
                transfer={transfer}
                student={student}
                panelTitleRef={panelTitleRef}
                onApproved={() => {
                  setRefused(false);
                  setFlash(true);
                  ask('flash');
                }}
                onMovedOn={() => {
                  setRefused(true);
                  refetch();
                  ask('panel');
                }}
                // The approval made here asked for the flash: it wins once the record reads
                // approved (the panel's controls go first).
                onFocusLost={() =>
                  setFocus((current) =>
                    current?.target === 'flash'
                      ? current
                      : { target: 'panel', count: (current?.count ?? 0) + 1 },
                  )
                }
              />
            ) : transfer.state === 'approved' && transfer.approved ? (
              <DecisionOutcome
                status={
                  <StatusPill tone="ok" size="lg">
                    {status}
                  </StatusPill>
                }
                meta={approvedOnWords(
                  dateTime(transfer.approved.at),
                  actorName(transfer.approved.by),
                )}
              >
                <RecordLine>{approvedNextWords(student)}</RecordLine>
                <ButtonLink href={DEVICE_TRANSFERS_ADDRESS}>{DECISION_PAGE.back}</ButtonLink>
              </DecisionOutcome>
            ) : (
              <Notice tone="off" icon="clock" role="status" title={DECISION_PAGE.notYet.title}>
                {DECISION_PAGE.notYet.line}
              </Notice>
            )}
          </DecisionPanel>
        }
      />
    </>
  );
}

/**
 * The open panel and its confirmation. The confirmation names the transfer as it stood when it
 * opened and sends exactly that: its revision, never a newer read's.
 */
function OpenPanel({
  transfer,
  student,
  panelTitleRef,
  onApproved,
  onMovedOn,
  onFocusLost,
}: {
  readonly transfer: DeviceTransfer;
  readonly student: string;
  readonly panelTitleRef: RefObject<HTMLHeadingElement | null>;
  /** The approval was recorded: the decided panel and the flash show, focus on the flash. */
  readonly onApproved: () => void;
  /** Refused because the transfer moved on: read it again, the notice, focus on the heading. */
  readonly onMovedOn: () => void;
  /** The panel is going while one of its controls has focus: focus on the heading instead. */
  readonly onFocusLost: () => void;
}) {
  const [confirming, setConfirming] = useState<DeviceTransfer | null>(null);
  const approve = useCommand((ports) => ports.operations.approveDeviceTransfer);

  // When the panel's controls go (approved here or elsewhere) while one of them has focus — the
  // panel's own heading and frame excepted — the page asks for focus on the heading.
  const lost = useRef(onFocusLost);
  useLayoutEffect(() => {
    lost.current = onFocusLost;
  });
  useLayoutEffect(
    () => () => {
      const frame = document.getElementById(PANEL_ID);
      const active = document.activeElement;
      if (
        frame &&
        active &&
        active !== frame &&
        active !== panelTitleRef.current &&
        frame.contains(active)
      )
        lost.current();
    },
    [panelTitleRef],
  );

  const send = (named: DeviceTransfer) => {
    approve.run({ id: named.id, expectedRev: named.rev }).then(
      (answer) => {
        setConfirming(null);
        if (answer.ok) onApproved();
        // Stale, approved elsewhere, not yet forwarded: nothing was written (SA-19.moved-on).
        else onMovedOn();
      },
      // Unavailable for now: nothing changes; the confirmation stays open (SA-19.unavailable).
      () => undefined,
    );
  };

  // What the dialog names: the transfer as it stood when the confirmation opened.
  const named = confirming ?? transfer;
  return (
    <>
      <RecordLine>{approvingMovesWords(student, transfer.format)}</RecordLine>
      <Hint>{DECISION_PAGE.noDecline}</Hint>
      <GoButton onClick={() => setConfirming(transfer)}>{TRANSFER_ACTIONS.approve}</GoButton>
      <ConfirmDialog
        open={confirming !== null}
        idPrefix="transfer-confirm"
        title={confirmTitle(named.format, student)}
        description={DECISION_PAGE.confirmLine}
        groups={[
          {
            kind: 'now',
            title: DECISION_PAGE.confirmNow,
            items: confirmNowItems(student, named.format, named.fromDevice, named.newDevice),
          },
          { kind: 'later', title: DECISION_PAGE.confirmLater, items: [DECISION_PAGE.notShipped] },
        ]}
        confirmLabel={TRANSFER_ACTIONS.approve}
        cancelLabel={DECISION_PAGE.cancel}
        busy={approve.busy}
        busyLabel={DECISION_PAGE.approving}
        returnFocusFallback={panelTitleRef}
        onConfirm={() => {
          if (confirming) send(confirming);
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
