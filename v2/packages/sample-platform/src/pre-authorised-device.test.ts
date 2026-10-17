/**
 * P3-03 (owner authorisation of Phase 7, 17 Oct 2026): a local prototype build starts with one
 * pre-authorised sample device — Godavari's ME lab VR headset GIT-VR-03 for the Student whose
 * institution e-mail is rahul.verma@godavari.edu.in. It becomes Rahul's authorised device once
 * his Student record exists, so the drawn transfer chain starts through the product; the
 * Institute Admin's forward and the Super Admin's approval update the same shared record, and the
 * approved record then wins over the seeded fact. Nothing registers or provisions a device.
 */
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed, type World } from './index.js';
import { PRE_AUTHORISED_DEVICES, withPreAuthorisedDevices } from './seed/local-demonstration.js';
import { asPerson, buildWorld, stepsTo, worldOf } from './testing/index.js';

/** Flows A and B1, and People set up (Rahul imported) — just before the walk's own S7 device. */
async function rahulExists(start: World): Promise<World> {
  const { steps, at } = stepsTo({ before: 'S7' });
  return buildWorld(start, steps, { seedId: 'p3-03-before-s7', at });
}

async function ok<T>(answer: Promise<{ ok: true; value: T } | { ok: false; error: unknown }>) {
  const result = await answer;
  if (!result.ok) throw new Error(`refused: ${JSON.stringify(result.error)}`);
  return result.value;
}

describe('P3-03 — the pre-authorised sample device (local prototype build only)', () => {
  it('is a seeded fact of the local prototype seed only; a given world is never changed', () => {
    const local = createSamplePlatform({ preAuthorisedDevices: 'local-demonstration-seed' });
    expect(worldOf(local).seeded.authorisedDevices).toEqual(PRE_AUTHORISED_DEVICES);
    expect(Object.keys(worldOf(local).records.devices)).toEqual([]);

    expect(worldOf(createSamplePlatform()).seeded.authorisedDevices).toBeUndefined();
    const given = seed();
    const passed = createSamplePlatform({
      world: given,
      preAuthorisedDevices: 'local-demonstration-seed',
    });
    expect(worldOf(passed)).toBe(given);
  });

  it('becomes Rahul’s authorised device; the transfer chain runs and the approved record wins', async () => {
    const platform = createSamplePlatform({
      world: await rahulExists(withPreAuthorisedDevices(seed())),
    });
    const rahul = asPerson(platform, 'Rahul Verma');
    const before = await ok(rahul.operations.getMyDevice());
    expect(before.devices).toEqual([
      expect.objectContaining({
        format: 'vr',
        description: 'ME lab VR headset, asset tag GIT-VR-03',
        viaTransferId: null,
      }),
    ]);
    expect(before.openTransfer).toBeNull();
    // A read writes nothing: the device is not a record yet.
    expect(Object.keys(worldOf(platform).records.devices)).toEqual([]);

    const requested = await ok(
      rahul.operations.requestDeviceTransfer({
        newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
        note: 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
      }),
    );
    const id = requested.transfer.id;
    expect(requested.transfer.state).toBe('with-institute-admin');

    const meera = asPerson(platform, 'Meera Iyer');
    const waiting = await ok(meera.operations.listDeviceRequests({}));
    const row = waiting.find((transfer) => transfer.id === id)!;
    const forwarded = await ok(
      meera.operations.forwardDeviceTransfer({ id, expectedRev: row.rev }),
    );
    expect(forwarded.state).toBe('forwarded');

    const arjun = asPerson(platform, 'Arjun Mehta');
    const approved = await ok(
      arjun.operations.approveDeviceTransfer({ id, expectedRev: forwarded.rev }),
    );
    expect(approved.transfer.state).toBe('approved');

    const after = await ok(rahul.operations.getMyDevice());
    expect(after.devices).toEqual([
      expect.objectContaining({
        description: 'ME lab VR headset, asset tag GIT-VR-07',
        viaTransferId: id,
      }),
    ]);
    expect(after.lastTransfer?.id).toBe(id);
    expect(Object.values(worldOf(platform).records.devices)).toHaveLength(1);
  });

  it('is nobody else’s: another Godavari Student has none, and without the fact Rahul has none', async () => {
    const local = createSamplePlatform({
      world: await rahulExists(withPreAuthorisedDevices(seed())),
    });
    const priya = await ok(asPerson(local, 'Priya Natarajan').operations.getMyDevice());
    expect(priya.devices).toEqual([]);

    const plain = createSamplePlatform({ world: await rahulExists(seed()) });
    const rahul = asPerson(plain, 'Rahul Verma');
    expect((await ok(rahul.operations.getMyDevice())).devices).toEqual([]);
    const refused = await rahul.operations.requestDeviceTransfer({
      newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
      note: '',
    });
    expect(refused.ok).toBe(false);
  });
});
