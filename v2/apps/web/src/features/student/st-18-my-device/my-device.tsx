'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  Button,
  Field,
  FormatBadge,
  Icon,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  ReadOnlyValue,
  Section,
  SectionBody,
  StatusPill,
  type StatusTone,
  Textarea,
  TextInput,
  Timeline,
  type TimelineEvent,
} from '@xr/ui';
import { type FormEvent, useLayoutEffect, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import {
  DEVICE_HISTORY,
  DEVICE_REQUEST_FORM,
  DEVICE_TRANSFER_WORDS,
  MY_DEVICE_PAGE,
  usedForWords,
} from '@/copy/device';
import { fieldWords } from '@/copy/field-words';
import { transferWords, wordsOf } from '@/copy/flow-state-words';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { myDevicePlacement } from '@/nav/student-device';
import type { MyExperimentsRead } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { StudentFailed, useRetryFocus } from '../shared/student-states';
import { type MyDeviceRead, useMyDeviceEntry } from './device-entry';

/** The controls focus moves to (B3-07 `Dd-req`, `Dd-dev`, `Dd-status`). */
const IDS = {
  request: 'device-request',
  newDevice: 'device-new',
  note: 'device-note',
  status: 'device-status',
  refused: 'device-refused',
} as const;

/**
 * ST-18 My device — board B3-07 f0 … f9 (DTR-0018 across roles: B3-12), at `/student/device`,
 * opened from the account menu (XS-05 "My device", f1); nothing in the sidebar is current on it.
 *
 * - **Reads**: `OperationsService.getMyDevice` (`useMyDevice`) — the authorised device(s), the
 *   open request with what keeps it from moving (`forwardingBlocked`), the last approved request,
 *   whether a request can be made (`canRequest`) and the institution's pause (`blockedBy`) — and
 *   the Student's listed experiments (`useMyExperiments`), which name what the device is used for
 *   and, with the device read, decide whether the page is offered at all (`device-entry.ts`,
 *   state-copy `ST-18.offered`). Not offered → the in-shell not-found (P3-06, provisional).
 * - **Request a device transfer** (f0) opens the form in place (f3): "Moving from" read-only,
 *   "New device" (the only required field) and an optional note. "Send request" runs
 *   `OperationsService.requestDeviceTransfer` through `useCommand` (sent once; "Sending…"). The
 *   SERVICE validates: its answer for an empty "New device" is the drawn field error ("Describe
 *   the new device"; B3-07 f3 draws no error summary), and focus goes to the field. Refusals
 *   (`transfer-already-open`, `institution-paused`, `no-authorised-device`, OD-B3-01) are words in
 *   a notice, and the device is read again; `unavailable` changes nothing (`ST-18.unavailable`).
 * - **Your transfer request** (f4 … f7): the open request — else the last approved one — with the
 *   Student's status words ("With your Institute Admin" · "Forwarded to BITS" · "Approved",
 *   `transferWords(state, 'student')`), what happens next, "This request can’t be forwarded yet"
 *   while the institution has no Institute Admin (f7), and From / To. It changes when the Institute
 *   Admin forwards or the Super Admin approves the same DTR record: their receipts invalidate DTR,
 *   so this tab reads it again. On approval the authorised device is the new one (f6). There is
 *   no decline, cancel or second open request (T-32).
 * - **Paused** (f8): no new request ("You can’t request a transfer…"); the shell shows the banner.
 * - **Undrawn** (provisional): no authorised device recorded (`ST-18.no-device`: no request
 *   offered; no device registry, D20b / P3-03), more than one device (`ST-18.several-devices`,
 *   OD-B3-01: no picker). Nothing promises shipping, provisioning or delivery.
 */
export function MyDevice() {
  useShellPage(myDevicePlacement());
  const navigation = useAppNavigation();
  const entry = useMyDeviceEntry();
  const retried = useRetryFocus(entry.status === 'ready');

  if (entry.status === 'failed') {
    return (
      <PageContent wrap="read">
        <StudentFailed
          title={stateWords('ST-18.failed')}
          onRetry={() => {
            retried();
            entry.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (entry.status === 'pending') {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('ST-18.loading')} surface="section" />
      </PageContent>
    );
  }
  // Not offered (no headset format, device or request): the in-shell not-found (P3-06).
  if (!entry.offered || entry.device === null) return navigation.notFound();
  return (
    <PageContent wrap="read">
      <DevicePage device={entry.device} experiments={entry.experiments} refetch={entry.refetch} />
    </PageContent>
  );
}

function DevicePage({
  device,
  experiments,
  refetch,
}: {
  readonly device: MyDeviceRead;
  readonly experiments: MyExperimentsRead | null;
  readonly refetch: () => void;
}) {
  const [form, setForm] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  // Focus lands once its target is on the page (the open request appears after the receipt's
  // refetch), as B3-07 moves it: to the field, back to the button, to the new status.
  const pendingFocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    const target = document.getElementById(pendingFocus.current);
    if (!target) return;
    pendingFocus.current = null;
    target.focus();
  });
  const focusSoon = (id: string) => {
    pendingFocus.current = id;
  };

  const canRequest = device.canRequest === true;
  const paused = device.blockedBy === 'institution-paused';
  const several = typeof device.canRequest === 'object' && device.openTransfer === null;
  const shown = device.openTransfer?.transfer ?? device.lastTransfer;

  return (
    <>
      <PageHeader
        className="[margin:0_0_20px]"
        title={MY_DEVICE_PAGE.title}
        meta={MY_DEVICE_PAGE.meta}
      />
      <div className="xw-stack">
        {refusal !== null ? (
          <Notice id={IDS.refused} tone="warn" tabIndex={-1}>
            {refusal}
          </Notice>
        ) : null}
        <Section
          title={MY_DEVICE_PAGE.authorised}
          meta={
            device.devices.length > 0
              ? uniqueFormats(device).map((format) => (
                  <FormatBadge key={format} format={format} variant="yours" compact />
                ))
              : undefined
          }
        >
          {device.devices.length === 0 ? (
            <SectionBody>
              <p className="xr-body m-0 text-ink-2">{stateWords('ST-18.no-device')}</p>
            </SectionBody>
          ) : (
            device.devices.map((entry) => (
              <div key={entry.format} className="xl-dev">
                <span className="xl-dev-ico">
                  <Icon name="headset" />
                </span>
                <div className="xl-dev-text">
                  <span className="xl-dev-name">{entry.description}</span>
                  <span className="xl-meta">
                    {usedForWords(formatCode(entry.format), namesOf(entry.usedFor, experiments))}
                  </span>
                </div>
              </div>
            ))
          )}
          {canRequest && !form ? (
            <SectionBody className="[padding-top:0]">
              <Button
                id={IDS.request}
                variant="primary"
                onClick={() => {
                  setRefusal(null);
                  setForm(true);
                  focusSoon(IDS.newDevice);
                }}
              >
                {MY_DEVICE_PAGE.request}
              </Button>
            </SectionBody>
          ) : null}
          {several ? (
            <SectionBody className="[padding-top:0]">
              <p className="xr-body m-0 text-ink-2">{stateWords('ST-18.several-devices')}</p>
            </SectionBody>
          ) : null}
          {paused ? (
            <SectionBody className="[padding-top:0]">
              <p className="xr-body m-0 text-ink-2">{MY_DEVICE_PAGE.paused}</p>
            </SectionBody>
          ) : null}
        </Section>
        {canRequest && form ? (
          <RequestForm
            from={device.devices[0]?.description ?? ''}
            onCancel={() => {
              setForm(false);
              focusSoon(IDS.request);
            }}
            onSent={() => {
              setForm(false);
              focusSoon(IDS.status);
            }}
            onRefused={(words) => {
              setForm(false);
              setRefusal(words);
              focusSoon(words === null ? MAIN_ID : IDS.refused);
              refetch();
            }}
          />
        ) : null}
        {shown ? (
          <TransferSection
            transfer={shown}
            blocked={
              device.openTransfer?.transfer.id === shown.id
                ? device.openTransfer.forwardingBlocked
                : null
            }
          />
        ) : null}
        <Section title={MY_DEVICE_PAGE.history}>
          <SectionBody>
            <History device={device} />
          </SectionBody>
        </Section>
      </div>
    </>
  );
}

/** The formats of the authorised devices, as their chips name them, once each. */
function uniqueFormats(device: MyDeviceRead) {
  return [...new Set(device.devices.map((entry) => formatCode(entry.format)))];
}

/** The names of the experiments a device is used for that are listed for the Student now. */
function namesOf(ids: readonly string[], experiments: MyExperimentsRead | null): string[] {
  const names = new Map<string, string>(
    (experiments?.rows ?? []).map(({ experiment }) => [experiment.experimentId, experiment.name]),
  );
  return ids.flatMap((id) => {
    const name = names.get(id);
    return name ? [name] : [];
  });
}

/** The words of a refusal of "Send request" (state-copy `ST-18.refused-*`, provisional). */
function refusalWords(error: ServiceError): string | null {
  if (error.kind === 'policy-open') return stateWords('ST-18.several-devices');
  if (error.kind !== 'refused') return null;
  switch (error.code) {
    case 'transfer-already-open':
      return stateWords('ST-18.refused-open');
    case 'institution-paused':
      return MY_DEVICE_PAGE.paused;
    case 'no-authorised-device':
      return stateWords('ST-18.no-device');
    default:
      return null;
  }
}

function RequestForm({
  from,
  onCancel,
  onSent,
  onRefused,
}: {
  readonly from: string;
  readonly onCancel: () => void;
  readonly onSent: () => void;
  readonly onRefused: (words: string | null) => void;
}) {
  const [newDevice, setNewDevice] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const request = useCommand((ports) => ports.operations.requestDeviceTransfer);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (request.busy) return;
    request.run({ newDevice, note }).then(
      (answer) => {
        if (answer.ok) {
          onSent();
          return;
        }
        if (answer.error.kind === 'validation-failed') {
          const field = answer.error.fieldErrors.find((entry) => entry.field === 'newDevice');
          setError(field ? fieldWords(field) : null);
          document.getElementById(IDS.newDevice)?.focus();
          return;
        }
        // Refused or no longer possible: say why (where the words are drawn or registered) and
        // read the device again, which shows what is possible now.
        onRefused(refusalWords(answer.error));
      },
      // Failed for now: nothing changes and what was typed stays (state-copy `ST-18.unavailable`).
      () => undefined,
    );
  };

  return (
    <Section title={DEVICE_REQUEST_FORM.title}>
      <form className="xr-section-body flex flex-col gap-[18px]" noValidate onSubmit={submit}>
        <ReadOnlyValue label={DEVICE_REQUEST_FORM.movingFrom}>{from}</ReadOnlyValue>
        <Field
          id={IDS.newDevice}
          label={DEVICE_REQUEST_FORM.newDevice}
          hint={DEVICE_REQUEST_FORM.newDeviceHint}
          errorClass="xw-ferr"
          error={error ?? undefined}
        >
          <TextInput
            autoComplete="off"
            value={newDevice}
            onChange={(event) => {
              setNewDevice(event.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field id={IDS.note} label={DEVICE_REQUEST_FORM.note} marker={DEVICE_REQUEST_FORM.optional}>
          <Textarea
            className="min-h-[90px]"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <p className="xl-meta m-0">{DEVICE_REQUEST_FORM.whoDecides}</p>
        <div className="xw-flow-foot">
          <Button variant="text" onClick={onCancel}>
            {DEVICE_REQUEST_FORM.cancel}
          </Button>
          <div className="xw-actions">
            <Button
              variant="primary"
              type="submit"
              busy={request.busy}
              busyLabel={DEVICE_REQUEST_FORM.sending}
            >
              {DEVICE_REQUEST_FORM.send}
            </Button>
          </div>
        </div>
      </form>
    </Section>
  );
}

const STATE_TONE: Readonly<Record<DeviceTransfer['state'], StatusTone>> = {
  'with-institute-admin': 'wait',
  forwarded: 'info',
  approved: 'ok',
};

const NEXT_LINE: Readonly<Record<DeviceTransfer['state'], string>> = {
  'with-institute-admin': DEVICE_TRANSFER_WORDS.withInstituteAdmin,
  forwarded: DEVICE_TRANSFER_WORDS.withBits,
  approved: DEVICE_TRANSFER_WORDS.approved,
};

function TransferSection({
  transfer,
  blocked,
}: {
  readonly transfer: DeviceTransfer;
  readonly blocked: 'no-institute-admin' | 'institution-paused' | null;
}) {
  return (
    <Section title={DEVICE_TRANSFER_WORDS.title} recordId={transfer.id}>
      <SectionBody className="flex flex-col gap-[14px]">
        <div
          id={IDS.status}
          tabIndex={-1}
          className="flex flex-wrap items-center gap-x-[14px] gap-y-2"
        >
          <StatusPill tone={STATE_TONE[transfer.state]}>
            {wordsOf(transferWords(transfer.state, 'student'))}
          </StatusPill>
        </div>
        <p className="xr-body m-0 text-ink-2">{NEXT_LINE[transfer.state]}</p>
        {blocked ? (
          <Notice tone="warn" title={DEVICE_TRANSFER_WORDS.cantForwardTitle}>
            {blocked === 'no-institute-admin'
              ? DEVICE_TRANSFER_WORDS.noInstituteAdmin
              : stateWords('ST-18.paused-forwarding')}
          </Notice>
        ) : null}
        <dl className="xl-kv">
          <dt>{DEVICE_TRANSFER_WORDS.from}</dt>
          <dd>{transfer.fromDevice}</dd>
          <dt>{DEVICE_TRANSFER_WORDS.to}</dt>
          <dd>{transfer.newDevice}</dd>
        </dl>
      </SectionBody>
    </Section>
  );
}

type HistoryEntry = DeviceTransfer['history'][number];

function actorName(entry: HistoryEntry): string {
  switch (entry.actor.kind) {
    case 'person':
      return entry.actor.displayName;
    case 'requester':
      return entry.actor.name;
    default:
      return '';
  }
}

/** One line per step of the open request and the last approved one, newest first (`ST-18.history`). */
function historyEvents(device: MyDeviceRead): TimelineEvent[] {
  const transfers = [device.openTransfer?.transfer, device.lastTransfer].filter(
    (transfer, index, all): transfer is DeviceTransfer =>
      transfer != null && all.findIndex((other) => other?.id === transfer.id) === index,
  );
  const steps = transfers.flatMap((transfer) =>
    transfer.history
      .filter((entry) => entry.visibleTo.includes('student'))
      .map((entry, order) => ({ transfer, entry, order })),
  );
  steps.sort((a, b) =>
    a.entry.at === b.entry.at ? b.order - a.order : a.entry.at < b.entry.at ? 1 : -1,
  );
  return steps.map(({ transfer, entry }) => ({
    id: `${transfer.id}:${entry.id}`,
    what:
      entry.event === 'requested'
        ? DEVICE_HISTORY.requested(actorName(entry))
        : entry.event === 'forwarded'
          ? DEVICE_HISTORY.forwarded(actorName(entry))
          : DEVICE_HISTORY.approved,
    when: dateTime(entry.at),
    note:
      entry.event === 'requested'
        ? DEVICE_HISTORY.fromTo(transfer.fromDevice, transfer.newDevice)
        : entry.event === 'approved'
          ? DEVICE_HISTORY.nowAuthorised(transfer.newDevice)
          : undefined,
  }));
}

function History({ device }: { readonly device: MyDeviceRead }) {
  const events = historyEvents(device);
  if (events.length === 0) {
    return <p className="xr-body m-0 text-ink-2">{MY_DEVICE_PAGE.noHistory}</p>;
  }
  return <Timeline events={events} />;
}
