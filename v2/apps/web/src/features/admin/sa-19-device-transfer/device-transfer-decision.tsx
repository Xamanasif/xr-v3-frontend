'use client';

import type { InstitutionDetail, Result, ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  DecisionLayout,
  EmptyState,
  FormatBadge,
  type FormatCode,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  StatusPill,
  Timeline,
} from '@xr/ui';
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { dateTime } from '@/copy/dates';
import { formatName, TRANSFER_ACTIONS, transferActionWords } from '@/copy/flow-state-words';
import {
  approvedFlash,
  approvedOnWords,
  approvingMovesWords,
  confirmEffectParts,
  confirmTitle,
  DECISION_PAGE,
  decisionTitle,
  forwardedByWords,
  formatForWords,
  NOT_YET_WITH_BITS,
} from '@/copy/operations';
import { stateWords } from '@/copy/state-copy';
import {
  DEVICE_TRANSFERS_ADDRESS,
  deviceTransferPlacement,
  deviceTransfersPlacement,
  OPERATIONS_REPORT_ADDRESS,
} from '@/nav/operations';
import { usePublishedCatalogue } from '@/queries/catalogue';
import { useDeviceTransfers } from '@/queries/devices';
import { useTransferInstitution } from '@/queries/operations-extra';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import {
  actorName,
  forwarderOf,
  historyEvents,
  requesterName,
  transferStatusWords,
  transferTone,
} from '../sa-18-device-transfers/transfer-view';

/** The decision panel's id (`aside.xr-dpanel`). */
const PANEL_ID = 'transfer-decision';

/** What the page names besides the record: the institution and the experiment. */
interface TransferContext {
  readonly institution: InstitutionDetail | null;
  readonly experiment: string | null;
}

/**
 * SA-19 Device transfer decision — boards B3-11 f1 (forwarded), f4 (Approve · DL-1 confirm), f5
 * (approved · read-only), f6 (768: the panel under the details), f7 (375); B7-09 f1, f3; B7-10 f14
 * (still with the institution), at `/admin/operations/device-transfers/[transferId]`.
 *
 * - **Read**: the transfer from `OperationsService.listDeviceTransfers` (the port has no
 *   single-transfer read for the Super Admin); an id it does not list is the in-shell not-found
 *   page. The institution (`getInstitution`: its name, the Student's institution ID) and the
 *   experiment (the published catalogue) are named beside it (state-copy `SA-19.facts`).
 * - **Decide**: one action, "Approve transfer", offered while the transfer is forwarded
 *   (`transferActionWords`). It confirms first (DL-1, B3-11 f4: exactly what changes — the
 *   Student's authorised device for the format becomes the new device; no reason, nothing is
 *   shipped) and the confirmation sends `approveDeviceTransfer` with the transfer's revision from
 *   when it opened (`expectedRev`). Approved: the decided panel ("Approved on … by …"), B3-11's
 *   flash, and focus on the status line (B3-11 `focus(pid + '-sastatus')`); the Student (ST-18)
 *   and the Institute Admin (IA-18, IA-19) read the same record. Refused (stale, approved
 *   elsewhere, not yet forwarded): nothing is written, the transfer is read again and shows its
 *   current drawn state, focus on the panel's heading (state-copy `SA-19.moved-on`, as SA-03).
 *   There is no Decline and no Declined state (T-32).
 * - **Not with BITS yet** (B3-11 `beforeSA`, B7-10 f14): "<reference> hasn’t reached BITS yet",
 *   read-only — Approve appears only once it is forwarded.
 * - **Layout**: details ~72 % and the sticky decision panel ~28 % from 860 px of content; below,
 *   the panel follows the details (B3-11 f6, f7 draw no "Go to decision").
 */
export function DeviceTransferDecision({ transferId }: { readonly transferId: string }) {
  const read = useDeviceTransfers(null);
  const catalogue = usePublishedCatalogue();
  const transfer = read.data?.ok
    ? (read.data.value.find((candidate) => candidate.id === transferId) ?? null)
    : null;
  const institution = useTransferInstitution(transfer?.institutionId ?? null);
  // The address is untrusted text: the top bar names the transfer only once it is read (as IA-19).
  useShellPage(transfer ? deviceTransferPlacement(transfer.id) : deviceTransfersPlacement());

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
    <PageContent wrap="wide">
      <RecordGuard
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
        failed={{
          title: stateWords('SA-19.failed'),
          line: stateWords('SA-19.failed.line'),
          reportHref: OPERATIONS_REPORT_ADDRESS,
        }}
      >
        {(record) => (
          <TransferPage
            transfer={record}
            context={{
              institution: institution.data?.ok ? institution.data.value : null,
              experiment: record.experimentId
                ? (experiments.get(record.experimentId) ?? null)
                : null,
            }}
            refetch={() => void read.refetch()}
          />
        )}
      </RecordGuard>
    </PageContent>
  );
}

/** B3-11 `beforeSA` / B7-10 f14, or the decision page (B3-11 `atSA`). */
function TransferPage({
  transfer,
  context,
  refetch,
}: {
  readonly transfer: DeviceTransfer;
  readonly context: TransferContext;
  readonly refetch: () => void;
}) {
  if (transfer.state === 'with-institute-admin') {
    return (
      <>
        <PageHeader
          className="mt-2 mb-4"
          back={<BackLink href={DEVICE_TRANSFERS_ADDRESS}>{NOT_YET_WITH_BITS.back}</BackLink>}
          title={NOT_YET_WITH_BITS.title}
        />
        <Section>
          <EmptyState icon="myDevice" title={NOT_YET_WITH_BITS.heading(transfer.id)}>
            {NOT_YET_WITH_BITS.line}
          </EmptyState>
        </Section>
      </>
    );
  }
  return <DecisionContent transfer={transfer} context={context} refetch={refetch} />;
}

type FocusRequest = { readonly target: 'status' | 'heading'; readonly count: number };

function DecisionContent({
  transfer,
  context,
  refetch,
}: {
  readonly transfer: DeviceTransfer;
  readonly context: TransferContext;
  readonly refetch: () => void;
}) {
  const student = requesterName(transfer);
  const forwarder = forwarderOf(transfer);
  const instituteAdmin = forwarder?.name ?? '';
  const institutionName = context.institution?.institution.name ?? transfer.institutionId;
  const studentNumber =
    context.institution?.people.studentList.find((person) => person.id === transfer.studentId)
      ?.institutionStudentId ?? null;
  const statusRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // B3-11 `flashAppr`: said once the approval made here is recorded, while the record is approved.
  const [flash, setFlash] = useState(false);
  // Focus moves in an effect: in the same commit the confirmation's own close has given focus
  // back (a child's effect runs first), so this request wins (as SA-03, SA-07).
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  useEffect(() => {
    if (!focus) return;
    (focus.target === 'status' ? statusRef : titleRef).current?.focus();
  }, [focus]);
  const ask = (target: FocusRequest['target']) =>
    setFocus((current) => ({ target, count: (current?.count ?? 0) + 1 }));

  const approvable = transferActionWords(transfer, 'super_admin') === TRANSFER_ACTIONS.approve;

  return (
    <>
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={DEVICE_TRANSFERS_ADDRESS}>{DECISION_PAGE.back}</BackLink>}
        overline={
          <>
            {DECISION_PAGE.overline} · <span className="xr-id">{transfer.id}</span>
          </>
        }
        title={decisionTitle(transfer.format, student)}
        meta={
          <div
            ref={statusRef}
            id="transfer-status"
            tabIndex={-1}
            className="flex flex-wrap items-center gap-x-[14px] gap-y-2"
          >
            <StatusPill tone={transferTone(transfer.state)}>
              {transferStatusWords(transfer.state)}
            </StatusPill>
            <span className="xl-meta">{institutionName}</span>
          </div>
        }
      />
      {flash && transfer.state === 'approved' ? (
        <Notice tone="ok" className="mb-4">
          {approvedFlash(student, instituteAdmin)}
        </Notice>
      ) : null}
      <DecisionLayout
        jump={false}
        panel={{
          id: PANEL_ID,
          title: DECISION_PAGE.panelTitle,
          titleFocusTarget: true,
          titleRef,
          children: approvable ? (
            <OpenPanel
              transfer={transfer}
              student={student}
              instituteAdmin={instituteAdmin}
              titleRef={titleRef}
              onApproved={() => {
                setFlash(true);
                ask('status');
              }}
              onMovedOn={() => {
                refetch();
                ask('heading');
              }}
              onFocusLost={() => ask('heading')}
            />
          ) : transfer.approved ? (
            <p className="xr-body m-0 text-ink-2">
              {approvedOnWords(dateTime(transfer.approved.at), actorName(transfer.approved.by))}
            </p>
          ) : null,
        }}
      >
        <Section title={DECISION_PAGE.transfer}>
          <SectionBody>
            <dl className="xl-kv">
              <Fact name={DECISION_PAGE.keys.student}>
                {studentNumber ? (
                  <>
                    {student} · <span className="xr-id">{studentNumber}</span>
                  </>
                ) : (
                  student
                )}
              </Fact>
              <Fact name={DECISION_PAGE.keys.institution}>{institutionName}</Fact>
              <Fact name={DECISION_PAGE.keys.format}>
                <FormatBadge
                  format={formatName(transfer.format) as FormatCode}
                  variant="yours"
                  compact
                />
                {context.experiment ? formatForWords(context.experiment) : null}
              </Fact>
              <Fact name={DECISION_PAGE.keys.from}>{transfer.fromDevice}</Fact>
              <Fact name={DECISION_PAGE.keys.to}>{transfer.newDevice}</Fact>
              <Fact name={DECISION_PAGE.keys.note}>{transfer.note ?? DECISION_PAGE.noNote}</Fact>
              {forwarder ? (
                <Fact name={DECISION_PAGE.keys.forwardedBy}>
                  {forwarder.role
                    ? forwardedByWords(forwarder.name, forwarder.role)
                    : forwarder.name}
                </Fact>
              ) : null}
            </dl>
          </SectionBody>
        </Section>
        <Section title={DECISION_PAGE.history}>
          <SectionBody>
            <Timeline events={historyEvents(transfer)} />
          </SectionBody>
        </Section>
      </DecisionLayout>
    </>
  );
}

function Fact({ name, children }: { readonly name: string; readonly children: ReactNode }) {
  return (
    <>
      <dt>{name}</dt>
      <dd>{children}</dd>
    </>
  );
}

/**
 * The open panel (B3-11 f1 `canApprove`) and its DL-1 confirmation (f4). The confirmation names
 * the transfer as it stood when it opened and sends exactly that: its revision, never a newer
 * read's.
 */
function OpenPanel({
  transfer,
  student,
  instituteAdmin,
  titleRef,
  onApproved,
  onMovedOn,
  onFocusLost,
}: {
  readonly transfer: DeviceTransfer;
  readonly student: string;
  readonly instituteAdmin: string;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  /** The approval was recorded: the decided panel and the flash show, focus on the status. */
  readonly onApproved: () => void;
  /** Refused because the transfer moved on: read it again, focus on the panel's heading. */
  readonly onMovedOn: () => void;
  /** The panel is going while one of its controls has focus: focus on the heading instead. */
  readonly onFocusLost: () => void;
}) {
  const [confirming, setConfirming] = useState<DeviceTransfer | null>(null);
  const approve = useCommand((ports) => ports.operations.approveDeviceTransfer);

  // When the panel goes (approved here or elsewhere), its controls go with it: if one of them has
  // focus — the panel's own heading and frame excepted — the page asks for focus on the heading.
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
        active !== titleRef.current &&
        frame.contains(active)
      )
        lost.current();
    },
    [titleRef],
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
  const effect = confirmEffectParts(student, named.format, instituteAdmin);

  return (
    <>
      <p className="xr-body m-0 text-ink-2">{approvingMovesWords(student, transfer.format)}</p>
      <Button variant="primary" block onClick={() => setConfirming(transfer)}>
        {TRANSFER_ACTIONS.approve}
      </Button>
      <ConfirmDialog
        open={confirming !== null}
        align="start"
        idPrefix="transfer-confirm"
        title={confirmTitle(named.id)}
        effect={
          <>
            {effect.before}
            <strong className="text-ink">{named.newDevice}</strong>
            {effect.after}
          </>
        }
        confirmLabel={TRANSFER_ACTIONS.approve}
        cancelLabel={DECISION_PAGE.cancel}
        busy={approve.busy}
        busyLabel={DECISION_PAGE.approving}
        returnFocusFallback={titleRef}
        onConfirm={() => {
          if (confirming) send(confirming);
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
