/**
 * TE-6 (owner authorisation of Phase 7, 17 Oct 2026; a local prototype build only): the world kept
 * as one versioned browser snapshot. A reload restores the progress; a damaged, foreign or older
 * save is rejected for a clean start; no password, session, command receipt or request status
 * token is ever saved in it (the requester's own ticket is kept beside it — ADR-0009 amendment,
 * `kept-tickets.test.ts`); the tabs of one browser share the world (a newer save is adopted before
 * a command), each keeping its own session; a reset removes the save and the other tabs start
 * again.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import { type AccessRequest, type ExperimentId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import {
  createSamplePlatform,
  KEPT_TICKETS_KEY,
  type SamplePlatform,
  type SamplePlatformOptions,
  seed,
  SNAPSHOT_KEY,
  type SnapshotStorage,
} from './index.js';
import { adoptedWorld, sanitised, withheldToken } from './persistence/snapshot.js';
import { withPreAuthorisedDevices } from './seed/local-demonstration.js';
import { ForeignWorldError } from './store/store.js';
import { asPerson, visitorPorts, worldOf } from './testing/index.js';

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function storage(): SnapshotStorage & { readonly items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

let lineages = 0;
/** One page load of the local prototype build on a browser's storage. */
function load(
  local: SnapshotStorage,
  options: Partial<SamplePlatformOptions> = {},
): SamplePlatform {
  lineages += 1;
  return createSamplePlatform({
    preAuthorisedDevices: 'local-demonstration-seed',
    snapshot: { storage: local, lineage: `lineage-${lineages}` },
    ...options,
  });
}

/** The drawn request (B1-07 f4), from a visitor's own selection. */
async function send(ports: ProductPorts, institutionName = 'Godavari Institute of Technology') {
  ok(ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
  return ok(
    await ports.accessRequests.submitPublicRequest({
      institutionName,
      contactPerson: 'Meera Iyer',
      email: 'meera.iyer@godavari.edu.in',
      phone: null,
      licencesRequested: '120',
      message: null,
      term: { kind: 'yearly' },
    }),
  );
}

describe('TE-6 — a reload restores the world', () => {
  it('starts afresh and saves the starting world; the next load restores it', () => {
    const local = storage();
    const first = load(local);
    expect(first.persistence).toBe('browser-snapshot');
    expect(first.snapshot?.opened).toBe('fresh');
    expect(local.items.has(SNAPSHOT_KEY)).toBe(true);
    expect(worldOf(first)).toEqual(withPreAuthorisedDevices(seed()));

    const second = load(local);
    expect(second.snapshot?.opened).toBe('restored');
    // What was saved: the world without receipts, every request's status token withheld.
    expect(worldOf(second)).toEqual(sanitised(worldOf(first)));
  });

  it('keeps every committed change across loads, signed out', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(visitorPorts(tab));
    const before = worldOf(tab);
    expect(before.worldVersion).toBe(1);

    const reloaded = load(local);
    expect(reloaded.snapshot?.opened).toBe('restored');
    expect(worldOf(reloaded).worldVersion).toBe(1);
    expect(worldOf(reloaded).records.requests[sent.reference]).toMatchObject({
      id: sent.reference,
      routeId: sent.routeId,
    });
    expect(worldOf(reloaded).history).toEqual(before.history);
    // Signed out: the session is never saved.
    expect(ok(await reloaded.ports.session.getSession())).toBeNull();
    // Commands continue past the restored history.
    ok(
      await asPerson(reloaded, 'Arjun Mehta').accessRequests.getRequestForDecision(sent.reference),
    );
  });

  it('saves no password, session, receipt or request status token in the snapshot', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(tab.ports);
    const token = worldOf(tab).records.requests[sent.reference]!.statusToken;
    ok(
      await tab.ports.session.signIn({
        method: 'email',
        email: 'arjun.mehta@wilp.example',
        password: 'a-password-typed-here',
      }),
    );
    const commandId = tab.newCommandId();
    const arjun = tab.withCommandId(commandId);
    const page = ok(await arjun.accessRequests.getRequestForDecision(sent.reference));
    ok(
      await arjun.accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      }),
    );
    expect(Object.keys(worldOf(tab).processedCommandIds)).toContain(commandId);

    const saved = local.items.get(SNAPSHOT_KEY)!;
    expect(saved).not.toContain('a-password-typed-here');
    expect(saved).not.toContain(token);
    expect(saved).toContain(withheldToken(sent.reference));
    expect(saved).not.toMatch(/ses-\d{6}/);
    expect(saved).not.toContain(commandId + '":{');
    // The visitor's own ticket is kept beside the snapshot, never inside it (ADR-0009 amendment):
    // that value names the lineage and the one request, and nothing of a session or a password.
    const kept = local.items.get(KEPT_TICKETS_KEY)!;
    expect(JSON.parse(kept)).toEqual({
      format: 1,
      lineage: saved.split('|')[3],
      tickets: [
        {
          request: sent.reference,
          routeId: sent.routeId,
          createdAt: worldOf(tab).records.requests[sent.reference]!.createdAt,
          token,
        },
      ],
    });
    expect(kept).not.toContain('a-password-typed-here');
    expect(kept).not.toMatch(/ses-\d{6}|sign-in:/);
    const restored = load(local);
    expect(worldOf(restored).processedCommandIds).toEqual({});
    // The snapshot alone opens no request status page: without the kept ticket — another browser
    // session of the restored world, or the same save in a browser that holds no ticket — nothing.
    expect(await visitorPorts(restored).accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    const elsewhere = storage();
    elsewhere.items.set(SNAPSHOT_KEY, saved);
    const otherBrowser = load(elsewhere);
    expect(otherBrowser.snapshot?.opened).toBe('restored');
    expect(await otherBrowser.ports.accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    // This browser's visitor, holding the kept ticket, reads it again.
    expect(ok(await restored.ports.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
  });
});

describe('TE-6 — an unreadable or foreign save is rejected for a clean start', () => {
  const cases: readonly [string, (saved: string) => string][] = [
    ['damaged', (saved) => saved.replace('Shell-and-Tube', 'Shell-and-Tub3')],
    ['truncated', (saved) => saved.slice(0, saved.length / 2)],
    ['not a snapshot', () => '{"schema":"xr.sample-world"}'],
    ['another format', (saved) => saved.replace(/^xr-sample-world\|1\|/, 'xr-sample-world|0|')],
    ['empty', () => ''],
  ];
  for (const [name, spoil] of cases) {
    it(`rejects a ${name} save and starts the clean world`, () => {
      const local = storage();
      const first = load(local);
      local.items.set(SNAPSHOT_KEY, spoil(local.items.get(SNAPSHOT_KEY)!));
      const second = load(local);
      expect(second.snapshot?.opened).toBe('rejected');
      expect(worldOf(second)).toEqual(worldOf(first));
      expect(load(local).snapshot?.opened).toBe('restored');
    });
  }

  it('rejects a save of another build (another starting world)', () => {
    const local = storage();
    load(local);
    const other = load(local, { preAuthorisedDevices: 'none' });
    expect(other.snapshot?.opened).toBe('rejected');
    expect(other.snapshot?.rejectedBecause).toBe('another build');
    expect(worldOf(other).seeded.authorisedDevices).toBeUndefined();
  });

  it('is never used with a given world (test-hook builds and tests start from fixtures)', () => {
    const local = storage();
    const given = seed();
    const platform = load(local, { world: given });
    expect(platform.persistence).toBe('memory');
    expect(platform.snapshot).toBeNull();
    expect(local.items.size).toBe(0);
  });
});

describe('TE-6 — the tabs of one browser share the world, each with its own session', () => {
  it('adopts a newer save before a command and on the storage event', async () => {
    const local = storage();
    const a = load(local);
    const b = load(local);
    const adopted: string[] = [];
    b.snapshot?.onAdopted(() => adopted.push('adopted'));

    const sent = await send(visitorPorts(a));
    expect(b.snapshot?.sync()).toBe('adopted');
    expect(adopted).toEqual(['adopted']);
    expect(worldOf(b).records.requests[sent.reference]).toBeDefined();
    expect(b.snapshot?.sync()).toBe('current');

    // A command in B runs on A's latest world without waiting for the storage event.
    const admin = asPerson(b, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    ok(
      await admin.accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      }),
    );
    await send(visitorPorts(a), 'Krishna Valley College of Engineering');
    expect(worldOf(a).history.map((entry) => entry.method)).toEqual([
      'AccessRequestService.submitPublicRequest',
      'AccessRequestService.approveRequest',
      'AccessRequestService.submitPublicRequest',
    ]);
    expect(new Set(worldOf(a).history.map((entry) => entry.commandId)).size).toBe(3);
  });

  it('keeps the request ticket of the tab that sent it when that tab adopts another tab’s world', async () => {
    const local = storage();
    const visitorTab = load(local);
    const adminTab = load(local);
    const visitor = visitorPorts(visitorTab);
    const sent = await send(visitor);

    adminTab.snapshot?.sync();
    expect(worldOf(adminTab).records.requests[sent.reference]!.statusToken).toBe(
      withheldToken(sent.reference),
    );
    const admin = asPerson(adminTab, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    ok(
      await admin.accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      }),
    );

    expect(visitorTab.snapshot?.sync()).toBe('adopted');
    const status = ok(await visitor.accessRequests.getRequestStatus(sent.routeId));
    expect(status.reference).toBe(sent.reference);
    // Nobody else's tab can read it.
    expect(await visitorPorts(adminTab).accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
  });

  it('a reset removes the save: other tabs learn the world is foreign, and the next load is fresh', async () => {
    const local = storage();
    const a = load(local);
    const b = load(local);
    await send(visitorPorts(a));
    const foreign: string[] = [];
    b.snapshot?.onForeign(() => foreign.push('foreign'));

    await a.snapshot?.clear();
    expect(local.items.has(SNAPSHOT_KEY)).toBe(false);
    // Nothing more is saved by the reset tab.
    await send(visitorPorts(a), 'Krishna Valley College of Engineering');
    expect(local.items.has(SNAPSHOT_KEY)).toBe(false);

    expect(b.snapshot?.sync()).toBe('foreign');
    expect(foreign).toEqual(['foreign']);
    await expect(send(visitorPorts(b), 'Tungabhadra Institute')).rejects.toBeInstanceOf(
      ForeignWorldError,
    );

    const next = load(local);
    expect(next.snapshot?.opened).toBe('fresh');
    expect(worldOf(next).worldVersion).toBe(0);
  });
});

describe('TE-6 — safeguards found in the Phase-7 review', () => {
  it('a storage that refuses writes keeps the world in memory, and is never taken for a reset', async () => {
    const refusing: SnapshotStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    const tab = load(refusing);
    const foreign: string[] = [];
    tab.snapshot?.onForeign(() => foreign.push('foreign'));
    expect(tab.snapshot?.sync()).toBe('current');
    await send(visitorPorts(tab));
    expect(worldOf(tab).worldVersion).toBe(1);
    expect(foreign).toEqual([]);
  });

  it('a restored page load writes nothing on the way in, so a reset made meanwhile stands', () => {
    const local = storage();
    load(local);
    let writes = 0;
    const counting: SnapshotStorage = {
      getItem: (key) => local.getItem(key),
      setItem: (key, value) => {
        writes += 1;
        local.setItem(key, value);
      },
      removeItem: (key) => local.removeItem(key),
    };
    const restored = load(counting);
    expect(restored.snapshot?.opened).toBe('restored');
    expect(writes).toBe(0);
    // Another tab resets after this one read: this one sees it, and does not undo it.
    local.removeItem(SNAPSHOT_KEY);
    expect(restored.snapshot?.sync()).toBe('foreign');
    expect(local.items.has(SNAPSHOT_KEY)).toBe(false);
  });

  it('gives a tab back only the token of the very request it created', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(visitorPorts(tab));
    const mine = worldOf(tab).records.requests[sent.reference]!;
    const stored = sanitised(worldOf(tab));
    const other = {
      ...stored,
      records: {
        ...stored.records,
        requests: {
          ...stored.records.requests,
          [sent.reference]: {
            ...stored.records.requests[sent.reference]!,
            routeId: unsafeBrand<AccessRequest['routeId']>('rq-9999'),
          } satisfies AccessRequest,
        },
      },
    };
    expect(adoptedWorld(other, worldOf(tab)).records.requests[sent.reference]!.statusToken).toBe(
      withheldToken(sent.reference),
    );
    expect(adoptedWorld(stored, worldOf(tab)).records.requests[sent.reference]!.statusToken).toBe(
      mine.statusToken,
    );
  });
});
