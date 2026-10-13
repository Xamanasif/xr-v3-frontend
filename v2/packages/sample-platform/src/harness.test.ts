/**
 * The two identity seams the web test-hook bridge uses (WP-0.12; ADR-0003 §3, ADR-0007 §3):
 * `asPersonId` (Playwright's `actAs` names a person by id) and `beginSession` (the CI-only boot
 * descriptor's session). Neither lists people, and neither is reachable from the root export.
 */
import { describe, expect, it } from 'vitest';

import * as root from './index.js';
import { createSamplePlatform, seed } from './index.js';
import {
  asPerson,
  asPersonId,
  beginSession,
  personIdOf,
  snapshot,
  worldOf,
} from './testing/index.js';

const ARJUN = 'sa-arjun-mehta';

describe('asPersonId', () => {
  it('acts as the person in a session of its own and leaves the platform session signed out', async () => {
    const platform = createSamplePlatform({ world: seed() });
    expect(personIdOf(worldOf(platform), 'Arjun Mehta')).toBe(ARJUN);

    const session = await asPersonId(platform, ARJUN).session.getSession();
    if (!session.ok || !session.value) throw new Error('no session');
    expect(session.value.session.personId).toBe(ARJUN);
    expect(session.value.session.role).toBe('super_admin');
    expect(session.value.session.sessionKey).toMatch(/^person:sa-arjun-mehta#ses-\d{6}$/);

    expect(await platform.ports.session.getSession()).toEqual({
      ok: true,
      value: null,
      changed: [],
    });
  });

  it('answers exactly as asPerson does for the same person', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const byName = await asPerson(platform, 'Kavya Nair').session.getSession();
    const byId = await asPersonId(
      platform,
      personIdOf(worldOf(platform), 'Kavya Nair'),
    ).session.getSession();
    if (!byName.ok || !byId.ok || !byName.value || !byId.value) throw new Error('no session');
    const { sessionKey: keyA, ...a } = byName.value.session;
    const { sessionKey: keyB, ...b } = byId.value.session;
    expect(a).toEqual(b);
    expect(keyA).not.toBe(keyB);
  });

  it('refuses an id the world does not know, and writes nothing', () => {
    const platform = createSamplePlatform({ world: seed() });
    const before = snapshot(platform);
    expect(() => asPersonId(platform, 'per-nobody')).toThrow(
      'No sample person with id per-nobody in this world.',
    );
    expect(snapshot(platform)).toEqual(before);
    expect(worldOf(platform).worldVersion).toBe(0);
  });
});

describe('beginSession', () => {
  it("signs the platform's own session in, and the product sign-out ends it", async () => {
    const platform = createSamplePlatform({ world: seed() });
    beginSession(platform, ARJUN);
    const session = await platform.ports.session.getSession();
    if (!session.ok || !session.value) throw new Error('no session');
    expect(session.value.session.personId).toBe(ARJUN);

    expect((await platform.ports.session.signOut()).ok).toBe(true);
    const after = await platform.ports.session.getSession();
    expect(after.ok && after.value).toBeNull();
  });

  it('refuses an unknown person and leaves the session as it was', async () => {
    const platform = createSamplePlatform({ world: seed() });
    expect(() => beginSession(platform, 'per-nobody')).toThrow(/No sample person/);
    const session = await platform.ports.session.getSession();
    expect(session.ok && session.value).toBeNull();
  });

  it('is not part of the root export', () => {
    expect(Object.keys(root)).not.toContain('beginSession');
    expect(Object.keys(root)).not.toContain('asPersonId');
  });
});
