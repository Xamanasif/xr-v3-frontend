/**
 * M23 Device transfer (DTR) + authorised device (Appendix C §2; matrix DTR-*; B3-07, B3-09, B3-11,
 * B3-12, B7-09, B7-10). Student → Institute Admin forward → Super Admin approve. Approve only: a
 * request BITS doesn't approve stays "Forwarded" (T-32; DTR-11). An authorisation change only —
 * nothing is shipped.
 *
 * The form has two fields — "New device" and an optional note (B3-07): the format and the current
 * device are derived from the Student's authorised device, never chosen. "No Institute Admin" is
 * not a refusal: the request is created and waits (B3-07 state `dn`; OD-B3-05).
 */
import type { Audience, PersonActorRef } from '../roles.js';
import type { ActorRef } from '../roles.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isBlank,
  notPermitted,
  ok,
  policyOpen,
  refused,
} from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { DeviceTransferId, ExperimentId, InstitutionId, PersonId } from '../kernel/ids.js';
import { isDrawnTransition, type TransitionTable } from '../kernel/machine.js';
import { newMeta, nextMeta, type RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Institution } from '../institution/model.js';

export const DEVICE_TRANSFER_STATES = ['with-institute-admin', 'forwarded', 'approved'] as const;
export type DeviceTransferState = (typeof DEVICE_TRANSFER_STATES)[number];

export interface DeviceTransfer extends RecordMeta {
  /** DTR-0018. */
  readonly id: DeviceTransferId;
  readonly institutionId: InstitutionId;
  readonly studentId: PersonId;
  /** Derived from the Student's authorised device; never a user choice. */
  readonly format: 'ar' | 'vr' | 'mr';
  readonly experimentId: ExperimentId | null;
  /** Read-only in the form: the current authorised device (free text). */
  readonly fromDevice: string;
  readonly newDevice: string;
  readonly note: string | null;
  readonly state: DeviceTransferState;
  readonly requestedAt: IsoInstant;
  readonly forwarded: { readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly approved: { readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly history: readonly HistoryEntry<'requested' | 'forwarded' | 'approved'>[];
}

/** 'ME lab VR headset, asset tag GIT-VR-03' — keyed by Student × format. */
export interface AuthorisedDevice {
  readonly studentId: PersonId;
  readonly format: 'ar' | 'vr' | 'mr';
  readonly description: string;
  /** 'Used for VR · Shell-and-Tube Heat Exchanger'. */
  readonly usedFor: readonly ExperimentId[];
  readonly since: IsoInstant;
  readonly viaTransferId: DeviceTransferId | null;
}

export type DeviceTransferCommand =
  'requestDeviceTransfer' | 'forwardDeviceTransfer' | 'approveDeviceTransfer';

/** Appendix C M23. Decline, withdraw and cancel are not designed (T-32; DTR-04, DTR-07, DTR-11). */
export const DEVICE_TRANSFER_TRANSITIONS: TransitionTable<
  DeviceTransferState,
  DeviceTransferCommand
> = [
  { from: null, to: 'with-institute-admin', command: 'requestDeviceTransfer', actors: ['student'] },
  {
    from: 'with-institute-admin',
    to: 'forwarded',
    command: 'forwardDeviceTransfer',
    actors: ['tenant_admin'],
  },
  { from: 'forwarded', to: 'approved', command: 'approveDeviceTransfer', actors: ['super_admin'] },
];

const READERS: readonly Audience[] = ['student', 'tenant_admin', 'super_admin'];

/** A request that exists but cannot move yet — a read fact, never a refusal of the request. */
export function forwardingBlocked(
  transfer: DeviceTransfer,
  institution: Institution,
): 'no-institute-admin' | 'institution-paused' | null {
  if (transfer.state !== 'with-institute-admin') return null;
  if (!institution.instituteAdmin) return 'no-institute-admin';
  return institution.pause ? 'institution-paused' : null;
}

/** "My device" in the account menu only for a Student with AR / VR / MR (DTR-05; board 06). */
export function hasMyDevice(devices: readonly AuthorisedDevice[]): boolean {
  return devices.length > 0;
}

/**
 * Request a device transfer (DTR-01): "Describe the new device"; note optional. One open request
 * (DTR-02; OD-B3-03); not while paused (DTR-03). Also when the institution has no Institute Admin —
 * the request waits (B3-07 `dn`). More than one authorised device would make the format ambiguous:
 * not drawn (OD-B3-01) → policy-open rather than a picker.
 */
export function requestDeviceTransfer(input: {
  readonly institution: Institution;
  readonly devices: readonly AuthorisedDevice[];
  readonly openTransfers: readonly DeviceTransfer[];
  readonly newDevice: string;
  readonly note: string | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<DeviceTransfer> {
  const own = input.devices.filter((device) => device.studentId === input.actor.personId);
  if (own.length === 0) return refused('no-authorised-device');
  if (own.length > 1) return policyOpen('OD-B3-01');
  if (input.institution.pause) return refused('institution-paused');
  if (
    input.openTransfers.some(
      (transfer) => transfer.studentId === input.actor.personId && transfer.state !== 'approved',
    )
  ) {
    return refused('transfer-already-open');
  }
  if (isBlank(input.newDevice)) return invalidInput({ field: 'newDevice', rule: 'required' });
  if (
    !isDrawnTransition(
      DEVICE_TRANSFER_TRANSITIONS,
      null,
      'with-institute-admin',
      'requestDeviceTransfer',
    )
  ) {
    return invalidState('none');
  }
  const device = own[0]!;
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('deviceTransfer'),
    institutionId: input.institution.id,
    studentId: input.actor.personId,
    format: device.format,
    experimentId: device.usedFor[0] ?? null,
    fromDevice: device.description,
    newDevice: input.newDevice.trim(),
    note: isBlank(input.note) ? null : input.note!.trim(),
    state: 'with-institute-admin',
    requestedAt: input.now,
    forwarded: null,
    approved: null,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'requested',
        at: input.now,
        actor: input.actor,
        visibleTo: READERS,
      }),
    ],
  });
}

/** Forward to BITS (DTR-06; DL-1, irreversible): "BITS decides; you can’t approve device
 *  transfers." (DTR-07). Not while paused (DTR-08). */
export function forwardDeviceTransfer(input: {
  readonly transfer: DeviceTransfer;
  readonly institution: Institution;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<DeviceTransfer> {
  if (input.transfer.institutionId !== input.institution.id) return notPermitted('out-of-scope');
  if (input.institution.instituteAdmin?.personId !== input.actor.personId)
    return notPermitted('out-of-scope');
  if (
    !isDrawnTransition(
      DEVICE_TRANSFER_TRANSITIONS,
      input.transfer.state,
      'forwarded',
      'forwardDeviceTransfer',
    )
  ) {
    return invalidState(input.transfer.state);
  }
  if (input.institution.pause) return refused('institution-paused');
  return ok({
    ...input.transfer,
    ...nextMeta(input.transfer, input.now),
    state: 'forwarded',
    forwarded: { at: input.now, by: input.actor },
    history: [
      ...input.transfer.history,
      historyEntry({
        id: input.ids.next('history'),
        event: 'forwarded',
        at: input.now,
        actor: input.actor,
        visibleTo: READERS,
      }),
    ],
  });
}

/** Approve a forwarded transfer (DTR-10; DL-1, no reason): the Student's authorised device for the
 *  format becomes the new one. "Approve appears only once it is forwarded." (B7-10 f14; DTR-12). */
export function approveDeviceTransfer(input: {
  readonly transfer: DeviceTransfer;
  readonly device: AuthorisedDevice;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<{ readonly transfer: DeviceTransfer; readonly device: AuthorisedDevice }> {
  if (input.transfer.state === 'with-institute-admin') return refused('not-yet-forwarded');
  if (
    !isDrawnTransition(
      DEVICE_TRANSFER_TRANSITIONS,
      input.transfer.state,
      'approved',
      'approveDeviceTransfer',
    )
  ) {
    return invalidState(input.transfer.state);
  }
  if (
    input.device.studentId !== input.transfer.studentId ||
    input.device.format !== input.transfer.format
  ) {
    return invalidState('device-mismatch');
  }
  return ok({
    transfer: {
      ...input.transfer,
      ...nextMeta(input.transfer, input.now),
      state: 'approved',
      approved: { at: input.now, by: input.actor },
      history: [
        ...input.transfer.history,
        historyEntry({
          id: input.ids.next('history'),
          event: 'approved',
          at: input.now,
          actor: input.actor,
          visibleTo: READERS,
        }),
      ],
    },
    device: {
      ...input.device,
      description: input.transfer.newDevice,
      since: input.now,
      viaTransferId: input.transfer.id,
    },
  });
}
