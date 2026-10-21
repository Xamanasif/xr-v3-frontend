'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { DeviceTransfer } from '@xr/domain';
import {
  Button,
  ButtonLink,
  Field,
  Notice,
  PageHead,
  StAside,
  StDeviceCard,
  StDeviceFacts,
  StDeviceForm,
  StDeviceNow,
  StDevicePrevious,
  StDeviceRequest,
  type StDeviceStep,
  StDeviceSteps,
  StSideText,
  StHowTo,
  StLoading,
  StMessage,
  StOverview,
  StRefuse,
  StSideSection,
  StSideTitle,
  type StatusTone,
  Textarea,
  TextInput,
} from '@xr/ui/v3';
import { type FormEvent, useId, useLayoutEffect, useRef, useState } from 'react';

import {
  DEVICE_HOW,
  DEVICE_NOT_AVAILABLE,
  DEVICE_REQUEST_FORM,
  DEVICE_STEPS,
  DEVICE_TRANSFER_WORDS,
  earlierRequestWords,
  MY_DEVICE_PAGE,
  usedForLabel,
} from '@/copy/device';
import { fieldWords } from '@/copy/field-words';
import { transferWords, wordsOf } from '@/copy/flow-state-words';
import { ST_STATE_WORDS, stDateTime, stDay } from '@/copy/st-shared';
import { stateWords } from '@/copy/state-copy';
import { formatCode } from '@/copy/student';
import { useAppNavigation } from '@/nav/navigation';
import { STUDENT_HELP_ADDRESS, STUDENT_HOME_ADDRESS } from '@/nav/student';
import { myDevicePlacement } from '@/nav/student-device';
import type { MyExperimentsRead } from '@/queries/student';
import { useCommand } from '@/queries/use-command';

import { MAIN_ID } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatChipOf } from '../shared/format-progress';
import { useRetryFocus, useStudentSession } from '../shared/student-states';
import type { Closure } from '../shared/student-view';
import { useStudentTodayLine } from '../shared/use-today';
import { type MyDeviceRead, useMyDeviceEntry } from './device-entry';

/** The controls focus moves to: the button, the field, the request's steps, a refusal. */
const IDS = {
  request: 'device-request',
  newDevice: 'device-new',
  note: 'device-note',
  status: 'device-status',
  refused: 'device-refused',
} as const;

/**
 * ST-18 My device — the V3 Student export's `device` region (`devVM`, `sendDev`) and
 * `msg('dev-not')`, at `/student/device`, opened from the account menu ("My device"); nothing in
 * the rail is current on it.
 *
 * - **Reads**: `OperationsService.getMyDevice` (`useMyDevice`) — the authorised device(s), the
 *   open request with what keeps it from moving (`forwardingBlocked`), the last approved request,
 *   whether a request can be made (`canRequest`) and the institution's pause (`blockedBy`) — and
 *   the Student's listed experiments (`useMyExperiments`), which name what the device is used for
 *   and, with the device read, decide whether the page is offered at all (`device-entry.ts`,
 *   state-copy `ST-18.offered`). Not offered → "My device isn’t available to you"
 *   (`ST-18.direct-visit`).
 * - **One card**: the authorised headset (its chip and the experiments it is used for) with
 *   "Request a device transfer"; the form in place: "Moving from", "New device" (the only required
 *   field) and an optional note. "Send request" runs `OperationsService.requestDeviceTransfer`
 *   through `useCommand` (sent once; "Sending…"). The SERVICE validates: its answer for an empty
 *   "New device" is the field's error ("Describe the new device"), and focus goes to the field.
 *   Refusals (`transfer-already-open`, `institution-paused`, `no-authorised-device`, OD-B3-01) are
 *   words in a notice, and the device is read again; `unavailable` changes nothing.
 * - **Your transfer request**: the open request — else the last approved one — with the
 *   Student's status words ("With your Institute Admin" · "Forwarded to BITS" · "Approved",
 *   `transferWords(state, 'student')`), what happens next, its three dated steps (Requested ·
 *   Forwarded to BITS by the Institute Admin · BITS decides / Approved by BITS — the Super Admin is
 *   never named), "This request can’t be forwarded yet" while the institution has no Institute
 *   Admin (or is paused), From / To / your note, and the earlier approved request in one line. The
 *   transfer's record reference is not shown (lead decision 3). It changes when the Institute Admin
 *   forwards or the Super Admin approves the same record: their receipts invalidate it, so this tab
 *   reads it again. On approval the authorised device is the new one. There is no decline, cancel
 *   or second open request (T-32).
 * - **Paused**: no new request ("You can’t request a transfer…"); the shell shows the banner.
 * - **Undrawn** (provisional): more than one device (`ST-18.several-devices`, OD-B3-01: each
 *   listed, no picker, no request). Nothing promises shipping, provisioning or delivery.
 */
export function MyDevice() {
  useShellPage(myDevicePlacement());
  const navigation = useAppNavigation();
  const today = useStudentTodayLine();
  const student = useStudentSession();
  const entry = useMyDeviceEntry();
  const retried = useRetryFocus(entry.status === 'ready');
  const titleId = useId();

  if (entry.status === 'failed') {
    return (
      <StMessage
        icon="cloudAlert"
        tone="err"
        alert
        title={stateWords('ST-18.failed')}
        titleId={titleId}
        description={ST_STATE_WORDS.failedLine}
        retry={{
          label: ST_STATE_WORDS.tryAgain,
          onRetry: () => {
            retried();
            entry.refetch();
          },
        }}
      />
    );
  }
  if (entry.status === 'pending') {
    return <StLoading variant="card" label={stateWords('ST-18.loading')} />;
  }
  // Not offered (no headset format held now, no open request): the export's refusal card.
  if (!entry.offered) {
    return (
      <StRefuse
        date={today}
        icon="headset"
        off
        kicker={DEVICE_NOT_AVAILABLE.kicker}
        title={DEVICE_NOT_AVAILABLE.title}
        titleId={titleId}
        description={DEVICE_NOT_AVAILABLE.line}
        actions={
          <ButtonLink href={STUDENT_HOME_ADDRESS} variant="primary" size="lg">
            {DEVICE_NOT_AVAILABLE.back}
          </ButtonLink>
        }
        help={{ href: STUDENT_HELP_ADDRESS, label: ST_STATE_WORDS.help }}
      />
    );
  }
  // Offered, but the device read was refused: nothing to show.
  if (entry.device === null) return navigation.notFound();
  return (
    <>
      <PageHead
        title={MY_DEVICE_PAGE.title}
        titleFocusTarget
        date={today}
        lead={MY_DEVICE_PAGE.meta}
      />
      <DevicePage
        device={entry.device}
        experiments={entry.experiments}
        session={student?.closure ?? null}
        refetch={entry.refetch}
      />
    </>
  );
}

function DevicePage({
  device,
  experiments,
  session,
  refetch,
}: {
  readonly device: MyDeviceRead;
  readonly experiments: MyExperimentsRead | null;
  readonly session: Closure;
  readonly refetch: () => void;
}) {
  const [form, setForm] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const baseId = useId();
  // Focus lands once its target is on the page (the open request appears after the receipt's
  // refetch): to the field, back to the button, to the request's steps.
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
  const earlier =
    device.openTransfer !== null &&
    device.lastTransfer !== null &&
    device.lastTransfer.id !== device.openTransfer.transfer.id
      ? device.lastTransfer
      : null;
  const blocked =
    shown && device.openTransfer?.transfer.id === shown.id
      ? device.openTransfer.forwardingBlocked
      : null;
  const first = device.devices[0] ?? null;

  const requestButton =
    canRequest && !form ? (
      <Button
        id={IDS.request}
        variant="primary"
        size="lg"
        icon="swap"
        onClick={() => {
          setRefusal(null);
          setForm(true);
          focusSoon(IDS.newDevice);
        }}
      >
        {MY_DEVICE_PAGE.request}
      </Button>
    ) : null;
  const lock = paused
    ? MY_DEVICE_PAGE.paused
    : several
      ? stateWords('ST-18.several-devices')
      : null;

  return (
    <>
      {refusal !== null ? (
        <Notice id={IDS.refused} tone="warn" icon="alertCircle" role="status" title={refusal} />
      ) : null}
      <StOverview>
        <StDeviceCard>
          {device.devices.length === 0 ? (
            <StDeviceNow
              titleId={`${baseId}-now`}
              none={{ title: MY_DEVICE_PAGE.noDeviceTitle, text: MY_DEVICE_PAGE.noDeviceLine }}
              lock={paused ? MY_DEVICE_PAGE.paused : null}
            />
          ) : (
            device.devices.map((entry, index) => {
              const code = formatCode(entry.format);
              return (
                <StDeviceNow
                  key={entry.format}
                  titleId={`${baseId}-now-${entry.format}`}
                  device={{
                    eyebrow: MY_DEVICE_PAGE.authorised,
                    name: entry.description,
                    chip: deviceChip(entry.format, experiments, session),
                    usedForLabel: usedForLabel(code),
                    usedFor: namesOf(entry.usedFor, experiments).join(', '),
                  }}
                  action={index === 0 ? requestButton : null}
                  lock={index === device.devices.length - 1 ? lock : null}
                />
              );
            })
          )}
          {canRequest && form && first ? (
            <RequestForm
              titleId={`${baseId}-form`}
              from={first.description}
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
          <StDeviceRequest
            titleId={`${baseId}-req`}
            title={shown ? DEVICE_TRANSFER_WORDS.title : MY_DEVICE_PAGE.requests}
            status={
              shown
                ? {
                    tone: STATE_TONE[shown.state],
                    words: wordsOf(transferWords(shown.state, 'student')),
                  }
                : undefined
            }
            none={shown ? undefined : MY_DEVICE_PAGE.noRequests}
          >
            {shown ? (
              <TransferRequest transfer={shown} blocked={blocked} earlier={earlier} />
            ) : null}
          </StDeviceRequest>
        </StDeviceCard>
        <StAside labelledBy={`${baseId}-how`}>
          <StSideSection>
            <StSideTitle id={`${baseId}-how`}>{DEVICE_HOW.title}</StSideTitle>
            <StHowTo device steps={DEVICE_HOW.steps} />
            <StSideText className="sv-devnote">{DEVICE_HOW.note}</StSideText>
          </StSideSection>
        </StAside>
      </StOverview>
    </>
  );
}

/**
 * The chip of a device's format: as the Student holds that format now on their listed experiments
 * (available → solid with its tick; paused, inactive, a licence wait → held), the shared rule.
 */
function deviceChip(
  format: MyDeviceRead['devices'][number]['format'],
  experiments: MyExperimentsRead | null,
  session: Closure,
) {
  const rows = experiments?.rows ?? [];
  const held = rows
    .map(({ experiment }) => {
      const entry = experiment.formats.find((candidate) => candidate.format === format);
      return entry ? formatChipOf(format, entry.availability, experiment.closure, session) : null;
    })
    .filter((chip) => chip !== null);
  const chip = held.find((candidate) => candidate.kind === 'on') ??
    held.find((candidate) => candidate.kind === 'held') ?? {
      code: formatCode(format),
      kind: 'on' as const,
      glyph: undefined,
    };
  return { code: chip.code, kind: chip.kind, glyph: chip.glyph };
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
  titleId,
  from,
  onCancel,
  onSent,
  onRefused,
}: {
  readonly titleId: string;
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
    <StDeviceForm
      titleId={titleId}
      title={DEVICE_REQUEST_FORM.title}
      from={{ label: DEVICE_REQUEST_FORM.movingFrom, device: from }}
      rule={DEVICE_REQUEST_FORM.whoDecides}
      onSubmit={submit}
      actions={
        <>
          <Button size="lg" onClick={onCancel}>
            {DEVICE_REQUEST_FORM.cancel}
          </Button>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            busy={request.busy}
            busyLabel={DEVICE_REQUEST_FORM.sending}
          >
            {DEVICE_REQUEST_FORM.send}
          </Button>
        </>
      }
    >
      <Field
        id={IDS.newDevice}
        label={DEVICE_REQUEST_FORM.newDevice}
        hint={DEVICE_REQUEST_FORM.newDeviceHint}
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
      <Field id={IDS.note} label={DEVICE_REQUEST_FORM.note}>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
    </StDeviceForm>
  );
}

const STATE_TONE: Readonly<Record<DeviceTransfer['state'], StatusTone>> = {
  'with-institute-admin': 'warn',
  forwarded: 'info',
  approved: 'ok',
};

const NEXT_LINE: Readonly<Record<DeviceTransfer['state'], string>> = {
  'with-institute-admin': DEVICE_TRANSFER_WORDS.withInstituteAdmin,
  forwarded: DEVICE_TRANSFER_WORDS.withBits,
  approved: DEVICE_TRANSFER_WORDS.approved,
};

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

/** The step's entry the Student may see (`visibleTo`), the latest of its kind. */
function stepEntry(transfer: DeviceTransfer, event: HistoryEntry['event']): HistoryEntry | null {
  return (
    transfer.history
      .filter((entry) => entry.event === event && entry.visibleTo.includes('student'))
      .at(-1) ?? null
  );
}

/**
 * The request as three dated steps (`devVM` `steps`): Requested (its date) · Forwarded to BITS (by
 * the Institute Admin, with the date — or with your Institute Admin / waiting for one) · BITS
 * decides (with BITS now / not yet) or Approved by BITS (its date).
 */
function stepsOf(
  transfer: DeviceTransfer,
  blocked: 'no-institute-admin' | 'institution-paused' | null,
): StDeviceStep[] {
  const forwarder = stepEntry(transfer, 'forwarded');
  const state = transfer.state;
  const forwardedDone = state === 'forwarded' || state === 'approved';
  const steps: Omit<StDeviceStep, 'ariaLabel'>[] = [
    {
      key: 'requested',
      title: DEVICE_STEPS.requested,
      detail: stDateTime(transfer.requestedAt),
      state: 'done',
    },
    {
      key: 'forwarded',
      title: DEVICE_STEPS.forwarded,
      detail: forwardedDone
        ? forwardedLine(forwarder, transfer.forwarded?.at ?? forwarder?.at ?? null)
        : blocked === 'no-institute-admin'
          ? DEVICE_STEPS.waitingForInstituteAdmin
          : DEVICE_STEPS.withInstituteAdmin,
      state: forwardedDone ? 'done' : 'now',
    },
    {
      key: 'decision',
      title: state === 'approved' ? DEVICE_STEPS.approved : DEVICE_STEPS.bitsDecides,
      detail:
        state === 'approved'
          ? transfer.approved
            ? stDateTime(transfer.approved.at)
            : ''
          : state === 'forwarded'
            ? DEVICE_STEPS.withBitsNow
            : DEVICE_STEPS.notYet,
      state: state === 'approved' ? 'done' : state === 'forwarded' ? 'now' : 'next',
    },
  ];
  return steps.map((step) => ({
    ...step,
    ariaLabel: DEVICE_STEPS.aria(String(step.title), step.state, String(step.detail)),
  }));
}

/** "Meera Iyer · 23 Oct 2026, 10:00" — who forwarded it (as the Student may see) and when. */
function forwardedLine(entry: HistoryEntry | null, at: string | null): string {
  const when = at ? stDateTime(at) : '';
  const name = entry ? actorName(entry) : '';
  return name && when ? DEVICE_STEPS.by(name, when) : name || when;
}

function TransferRequest({
  transfer,
  blocked,
  earlier,
}: {
  readonly transfer: DeviceTransfer;
  readonly blocked: 'no-institute-admin' | 'institution-paused' | null;
  readonly earlier: DeviceTransfer | null;
}) {
  const noInstituteAdmin =
    blocked === 'no-institute-admin' && transfer.state === 'with-institute-admin';
  const approvedAt = earlier?.approved?.at;
  return (
    <>
      <StDeviceSteps
        id={IDS.status}
        explain={noInstituteAdmin ? DEVICE_TRANSFER_WORDS.nothingYet : NEXT_LINE[transfer.state]}
        label={DEVICE_STEPS.label}
        steps={stepsOf(transfer, blocked)}
      />
      {blocked ? (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="status"
          className="sv-devnoia"
          title={DEVICE_TRANSFER_WORDS.cantForwardTitle}
        >
          {blocked === 'no-institute-admin'
            ? DEVICE_TRANSFER_WORDS.noInstituteAdmin
            : stateWords('ST-18.paused-forwarding')}
        </Notice>
      ) : null}
      <StDeviceFacts
        facts={[
          { key: 'from', term: DEVICE_TRANSFER_WORDS.from, detail: transfer.fromDevice },
          { key: 'to', term: DEVICE_TRANSFER_WORDS.to, detail: transfer.newDevice },
          ...(transfer.note
            ? [{ key: 'note', term: DEVICE_TRANSFER_WORDS.yourNote, detail: transfer.note }]
            : []),
        ]}
      />
      {approvedAt ? (
        <StDevicePrevious>{earlierRequestWords(stDay(approvedAt))}</StDevicePrevious>
      ) : null}
    </>
  );
}
