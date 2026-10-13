/**
 * Device transfers (Appendix C M23; matrix DTR-*): Student → Institute Admin forward → Super Admin
 * approve. Approve only — decline, withdraw and cancel are not designed (T-32). The format and the
 * current device come from the Student's authorised device, never a choice.
 */
import { describe, expect, it } from 'vitest';

import {
  counterIds,
  device,
  expectOk,
  ids,
  institution,
  refusalOf,
  T,
  transfer,
  who,
} from '../testing/fixtures.js';
import {
  approveDeviceTransfer,
  DEVICE_TRANSFER_STATES,
  DEVICE_TRANSFER_TRANSITIONS,
  type DeviceTransferState,
  forwardDeviceTransfer,
  forwardingBlocked,
  hasMyDevice,
  requestDeviceTransfer,
} from './device.js';

const paused = () => institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });

describe('the device-transfer machine (acceptance 2)', () => {
  const run = (
    from: DeviceTransferState,
    command: 'forwardDeviceTransfer' | 'approveDeviceTransfer',
  ): DeviceTransferState | null => {
    const decision =
      command === 'forwardDeviceTransfer'
        ? forwardDeviceTransfer({
            transfer: transfer(from),
            institution: institution(),
            actor: who.instituteAdmin,
            now: T.oct23,
            ids: counterIds(),
          })
        : approveDeviceTransfer({
            transfer: transfer(from),
            device: device(),
            actor: who.superAdmin,
            now: T.oct23,
            ids: counterIds(),
          });
    if (!decision.ok) return null;
    return 'transfer' in decision.value ? decision.value.transfer.state : decision.value.state;
  };
  for (const from of DEVICE_TRANSFER_STATES) {
    for (const command of ['forwardDeviceTransfer', 'approveDeviceTransfer'] as const) {
      const drawn = DEVICE_TRANSFER_TRANSITIONS.find(
        (row) => row.from === from && row.command === command,
      );
      it(`${from} · ${command}: ${drawn ? `→ ${drawn.to}` : 'refused'}`, () => {
        expect(run(from, command)).toBe(drawn ? drawn.to : null);
      });
    }
  }

  it('no decline, withdraw or cancel (T-32)', () => {
    expect(DEVICE_TRANSFER_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(
      /decline|withdraw|cancel/i,
    );
  });
});

describe('request, forward, approve (DTR-01 … DTR-12)', () => {
  const request = (overrides: Partial<Parameters<typeof requestDeviceTransfer>[0]> = {}) =>
    requestDeviceTransfer({
      institution: institution(),
      devices: [device()],
      openTransfers: [],
      newDevice: ' ME lab VR headset, asset tag GIT-VR-07 ',
      note: '',
      actor: who.student,
      now: T.oct20,
      ids: counterIds(),
      ...overrides,
    });

  it('two fields; format and current device are derived', () => {
    expect(expectOk(request())).toMatchObject({
      id: 'DTR-1001',
      format: 'vr',
      fromDevice: 'ME lab VR headset, asset tag GIT-VR-03',
      newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
      note: null,
      state: 'with-institute-admin',
      experimentId: ids.shell,
    });
    expect(hasMyDevice([device()])).toBe(true);
    expect(hasMyDevice([])).toBe(false);
  });

  it('the drawn refusals; several authorised devices are not drawn (OD-B3-01)', () => {
    expect(refusalOf(request({ devices: [] }))).toEqual({
      kind: 'refused',
      code: 'no-authorised-device',
    });
    expect(refusalOf(request({ devices: [device(), device({ format: 'ar' })] }))).toEqual({
      kind: 'policy-open',
      decision: 'OD-B3-01',
    });
    expect(refusalOf(request({ institution: paused() }))).toEqual({
      kind: 'refused',
      code: 'institution-paused',
    });
    expect(refusalOf(request({ openTransfers: [transfer('forwarded')] }))).toEqual({
      kind: 'refused',
      code: 'transfer-already-open',
    });
    expect(refusalOf(request({ newDevice: ' ' }))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'newDevice', rule: 'required' }],
    });
  });

  it('with no Institute Admin the request is created and waits (OD-B3-05)', () => {
    const none = institution({ instituteAdmin: null });
    const waiting = expectOk(request({ institution: none }));
    expect(forwardingBlocked(waiting, none)).toBe('no-institute-admin');
    expect(forwardingBlocked(waiting, paused())).toBe('institution-paused');
    expect(forwardingBlocked(transfer('forwarded'), none)).toBeNull();
  });

  it('only the institution’s Institute Admin forwards; Approve appears only once forwarded', () => {
    expect(
      refusalOf(
        forwardDeviceTransfer({
          transfer: transfer('with-institute-admin'),
          institution: institution(),
          actor: who.superAdmin,
          now: T.oct23,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'not-permitted', why: 'out-of-scope' });
    expect(
      refusalOf(
        forwardDeviceTransfer({
          transfer: transfer('with-institute-admin'),
          institution: paused(),
          actor: who.instituteAdmin,
          now: T.oct23,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
    expect(
      refusalOf(
        approveDeviceTransfer({
          transfer: transfer('with-institute-admin'),
          device: device(),
          actor: who.superAdmin,
          now: T.oct23,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'not-yet-forwarded' });
    const approved = expectOk(
      approveDeviceTransfer({
        transfer: transfer('forwarded'),
        device: device(),
        actor: who.superAdmin,
        now: T.oct23,
        ids: counterIds(),
      }),
    );
    expect(approved.device).toMatchObject({
      description: 'ME lab VR headset, asset tag GIT-VR-07',
      since: T.oct23,
      viaTransferId: 'DTR-0018',
    });
  });
});
