/**
 * The local prototype build's additions to the spine-start world (owner authorisation of Phase 7,
 * 17 Oct 2026) — sample facts for a live walk-through, NOT production policy.
 *
 * P3-03 — one pre-authorised sample device: the ME lab's VR headset GIT-VR-03 (board B3-07), for
 * the Godavari Institute of Technology Student whose institution e-mail is
 * `rahul.verma@godavari.edu.in`. Godavari and Rahul do not exist at the start (Flows A and B create
 * them), so the device is a seeded fact that becomes Rahul's authorised device once his Student
 * record exists — then the drawn transfer chain (ST-18 → IA-18/19 → SA-18/19) can start through
 * normal product navigation. No product action registers, provisions or manages a device (D20b);
 * the production device policy stays open.
 */
import { type SeededAuthorisedDevice, type World } from '../world/types.js';
import { ist } from './book.js';
import { EXPERIMENT } from './catalogue.js';

export const PRE_AUTHORISED_DEVICES: readonly SeededAuthorisedDevice[] = [
  {
    institutionId: 'godavari',
    institutionEmail: 'rahul.verma@godavari.edu.in',
    format: 'vr',
    description: 'ME lab VR headset, asset tag GIT-VR-03',
    usedFor: [EXPERIMENT.shellAndTube],
    since: ist('2026-09-30 10:00'),
  },
];

/** A starting world with the local prototype build's pre-authorised devices (P3-03). */
export function withPreAuthorisedDevices(world: World): World {
  return {
    ...world,
    seeded: {
      ...world.seeded,
      authorisedDevices: [...(world.seeded.authorisedDevices ?? []), ...PRE_AUTHORISED_DEVICES],
    },
  };
}
