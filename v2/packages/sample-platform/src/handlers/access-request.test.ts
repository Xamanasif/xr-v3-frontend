/**
 * Package 1C — the public request status and payment pages on the sample adapter, beyond the
 * adapter-independent contract cases (`request-access:*`): where the ticket lives (the browser
 * session, bound to the world that issued it — ADR-0009), what is read back from the visitor's own
 * storage, the Institute Admin path on the seeded institutions (O-05; REQ-28), and the TE-4 sample
 * payment provider (owner authorisation of 14 Oct 2026): confirmed on start in a local prototype
 * build, pending or failed only when a test plans it, always its own system event.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import {
  type AccessRequest,
  type ExperimentId,
  type RequestId,
  type RequestRouteId,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, seed } from '../index.js';
import { sanitised } from '../persistence/snapshot.js';
import type { SessionStorageLike } from '../session/browser-session.js';
import {
  asPerson,
  asPersonId,
  beginSession,
  planPayment,
  seamsOf,
  standinsOf,
  visitorPorts,
  worldOf,
} from '../testing/index.js';
import type { SamplePlatform } from '../platform/create.js';

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function memoryStorage(initial: Record<string, string> = {}): SessionStorageLike & {
  readonly items: Map<string, string>;
} {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
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

async function approveExternal(platform: SamplePlatform, reference: RequestId) {
  const admin = asPerson(platform, 'Arjun Mehta');
  const page = ok(await admin.accessRequests.getRequestForDecision(reference));
  return ok(
    await admin.accessRequests.approveRequest({
      id: reference,
      route: 'external',
      expectedRev: page.request.rev,
    }),
  );
}

function requestOf(platform: SamplePlatform, reference: string): AccessRequest {
  return worldOf(platform).records.requests[reference]!;
}

describe('the ticket stays with the browser session that sent the request (B1-07; O-05; V-17)', () => {
  it('is held by the sending session, answered to no one, and opens nothing elsewhere', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const visitor = visitorPorts(platform);
    const sent = await send(visitor);
    expect(Object.keys(sent).sort()).toEqual(['reference', 'routeId']);
    const record = requestOf(platform, sent.reference);
    expect(record.routeId).toBe(sent.routeId);
    expect([record.statusToken, record.id]).not.toContain(sent.routeId);
    expect(ok(await visitor.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
    const before = worldOf(platform).worldVersion;
    expect(await visitorPorts(platform).accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(worldOf(platform).worldVersion).toBe(before);
  });

  it('keeps tickets per world: one left from an earlier world has expired (a reload, ADR-0004 option A)', async () => {
    const storage = memoryStorage();
    const first = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-a',
    });
    const sentBefore = await send(first.ports);
    expect(JSON.parse(storage.items.get('xr.request-tickets.v2')!)).toEqual([
      {
        world: 'world-a',
        token: requestOf(first, sentBefore.reference).statusToken,
        holder: 'visitor',
      },
    ]);

    // The same tab after a reload: a new world from the seed, the same browser session storage.
    const second = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-b',
    });
    expect(JSON.parse(storage.items.get('xr.request-tickets.v2')!)).toEqual([]);
    // Another visitor of the new world sends the first request: the seed's deterministic ids give
    // it the very address and token the expired ticket named — it still opens nothing.
    const sentAfter = await send(visitorPorts(second));
    expect(sentAfter).toEqual(sentBefore);
    expect(await second.ports.accessRequests.getRequestStatus(sentAfter.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
  });

  it('reads the visitor’s own storage entry by entry: guessed worlds and malformed entries are dropped', async () => {
    const storage = memoryStorage({
      'xr.request-tickets.v2': JSON.stringify([
        { world: 'a-guess', token: 'tok-0001', holder: 'visitor' },
        { token: 'tok-0002', holder: 'visitor' },
        'tok-0003',
        { world: 'world-x', token: 7, holder: 'visitor' },
        { world: 'world-x', token: 'tok-0001' },
        { world: 'world-x', token: 'tok-0001', holder: 'someone' },
      ]),
    });
    const platform = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-x',
    });
    expect(JSON.parse(storage.items.get('xr.request-tickets.v2')!)).toEqual([]);
    const seeded = Object.values(worldOf(platform).records.requests).find(
      (request) => request.statusToken === 'tok-0001',
    )!;
    expect(await platform.ports.accessRequests.getRequestStatus(seeded.routeId)).toMatchObject({
      ok: false,
      error: { kind: 'not-found' },
    });
  });

  it('reads the stored selection entry by entry; one kept before Package 1C has no undo position', () => {
    const item = { experimentId: SHELL, formats: ['web'], addedAt: '2026-10-02T04:30:00.000Z' };
    const storage = memoryStorage({
      'xr.selection.v1': JSON.stringify({
        items: [item, item, { experimentId: 'x', formats: ['holo'], addedAt: 'y' }, null],
        lastRemoved: item,
      }),
    });
    const platform = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-y',
    });
    expect(platform.ports.selection.get()).toEqual({
      items: [item],
      lastRemoved: item,
      lastRemovedAt: null,
    });
  });

  it('belongs to the user session that sent it: a person signed in to the tab holds none of the visitor’s tickets', async () => {
    const storage = memoryStorage();
    const platform = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-s',
    });
    const tab = platform.ports;
    const sent = await send(tab);
    expect(ok(await tab.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
    const toPay = await approveExternal(platform, sent.reference);

    // Another person signs in to the same tab: the visitor's ticket opens nothing for them.
    ok(
      await tab.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    const before = worldOf(platform).worldVersion;
    expect(await tab.accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(
      await tab.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: toPay.request.rev,
      }),
    ).toEqual({ ok: false, error: { kind: 'not-found' } });
    expect(worldOf(platform).worldVersion).toBe(before);

    // Signed out, the tab is its own visitor again: the request is there, as it was.
    ok(await tab.session.signOut());
    expect(ok(await tab.accessRequests.getRequestStatus(sent.routeId))).toMatchObject({
      reference: sent.reference,
      status: 'approved-payment-required',
    });
  });

  it('a person signed in who sends a public request reads it in that sign-in only', async () => {
    const storage = memoryStorage();
    const platform = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-t',
    });
    const tab = platform.ports;
    ok(
      await tab.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    const sent = await send(tab);
    expect(ok(await tab.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
    const [stored] = JSON.parse(storage.items.get('xr.request-tickets.v2')!) as {
      holder: string;
    }[];
    expect(stored?.holder).toMatch(/^sign-in:\S+$/);

    // Neither the tab's signed-out visitor nor a later sign-in of the same person holds it.
    ok(await tab.session.signOut());
    expect(await tab.accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    ok(
      await tab.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    expect(await tab.accessRequests.getRequestStatus(sent.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
  });

  it('needs the world a stored ticket belongs to: storage without a world instance is refused', () => {
    expect(() => createSamplePlatform({ world: seed(), browserStorage: memoryStorage() })).toThrow(
      /world instance/,
    );
  });

  it('a withheld placeholder in the visitor’s storage is never a ticket — not even in a restored world, where every request carries one', async () => {
    // A world as a snapshot keeps it (TE-6): every status token is the withheld placeholder.
    const restored = sanitised(seed());
    const seeded = Object.values(restored.records.requests)[0]!;
    expect(seeded.statusToken).toBe(`withheld:${seeded.id}`);
    const storage = memoryStorage({
      'xr.request-tickets.v2': JSON.stringify([
        { world: 'world-w', token: `withheld:${seeded.id}`, holder: 'visitor' },
      ]),
    });
    const tab = createSamplePlatform({
      world: restored,
      browserStorage: storage,
      worldInstance: 'world-w',
    });
    expect(await tab.ports.accessRequests.getRequestStatus(seeded.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(ok(await tab.ports.accessRequests.listRequestsInProgress())).toEqual([]);
  });
});

describe('PU-07 “You have a request in progress” (owner decision 24 Oct 2026; ADR-0009 amendment)', () => {
  it('lists the requests in progress this browser session holds a ticket for, for the user session asking', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const tab = platform.ports;
    // The seeded requests in progress (REQ-0037 waits for its payment) are nobody's here.
    expect(ok(await tab.accessRequests.listRequestsInProgress())).toEqual([]);
    const sent = await send(tab);
    const line = { routeId: sent.routeId, institutionName: 'Godavari Institute of Technology' };
    expect(ok(await tab.accessRequests.listRequestsInProgress())).toEqual([line]);
    expect(ok(await visitorPorts(platform).accessRequests.listRequestsInProgress())).toEqual([]);

    // A person signed in to the tab lists only what that sign-in sent; the Institute Admin's own
    // role adds nothing here (IA-17 lists the institution's requests).
    ok(
      await tab.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    expect(ok(await tab.accessRequests.listRequestsInProgress())).toEqual([]);
    const own = await send(tab, 'Krishna Valley College of Engineering');
    expect(ok(await tab.accessRequests.listRequestsInProgress())).toEqual([
      { routeId: own.routeId, institutionName: 'Krishna Valley College of Engineering' },
    ]);
    ok(await tab.session.signOut());
    expect(ok(await tab.accessRequests.listRequestsInProgress())).toEqual([line]);
    const srinivas = asPersonId(platform, 'per-p-srinivas');
    expect(ok(await srinivas.accessRequests.listRequestsInProgress())).toEqual([]);
  });

  it('lists the newest first', async () => {
    let real = Date.UTC(2026, 9, 24, 9, 0);
    const platform = createSamplePlatform({ world: seed(), realNow: () => real });
    const first = await send(platform.ports);
    real += 60_000;
    const second = await send(platform.ports, 'Krishna Valley College of Engineering');
    expect(
      ok(await platform.ports.accessRequests.listRequestsInProgress()).map((row) => row.routeId),
    ).toEqual([second.routeId, first.routeId]);
  });

  it('keeps it while it waits — information requested, payment required, not confirmed, failed — and drops it once access is active', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const tab = platform.ports;
    const sent = await send(tab);
    // The sample clock stands still here, so both requests arrive at once: compared unordered.
    const listed = async () =>
      ok(await tab.accessRequests.listRequestsInProgress())
        .map((row) => row.routeId)
        .sort();
    const admin = asPerson(platform, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    ok(
      await admin.accessRequests.requestMoreInformation({
        id: sent.reference,
        reason: 'Please confirm how many students will use VR in the first term.',
        expectedRev: page.request.rev,
      }),
    );
    expect(requestOf(platform, sent.reference).status).toBe('information-requested');
    expect(await listed()).toEqual([sent.routeId]);

    // A second request, approved and paid: it leaves the list; the first stays.
    const second = await send(tab, 'Krishna Valley College of Engineering');
    const toPay = await approveExternal(platform, second.reference);
    expect(await listed()).toEqual([sent.routeId, second.routeId]);
    planPayment(platform, 'failed');
    ok(
      await tab.accessRequests.startPayment({
        request: second.routeId,
        expectedRev: toPay.request.rev,
      }),
    );
    expect(requestOf(platform, second.reference).status).toBe('payment-failed');
    expect(await listed()).toEqual([sent.routeId, second.routeId]);
    const again = ok(await tab.accessRequests.getRequestStatus(second.routeId));
    ok(await tab.accessRequests.startPayment({ request: second.routeId, expectedRev: again.rev }));
    expect(requestOf(platform, second.reference).status).toBe('payment-not-confirmed');
    expect(await listed()).toEqual([sent.routeId, second.routeId]);
    standinsOf(platform).paymentOutcome.report({
      requestId: second.reference,
      outcome: 'confirmed',
    });
    expect(requestOf(platform, second.reference).status).toBe('access-active');
    expect(await listed()).toEqual([sent.routeId]);
  });
});

describe('the Institute Admin path on the seeded institutions (O-05; REQ-28; B3-08)', () => {
  const route = (platform: SamplePlatform, reference: string) =>
    requestOf(platform, reference).routeId as RequestRouteId;

  it('the institution’s own Institute Admin reads its request; another institution’s cannot', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const srinivas = asPersonId(platform, 'per-p-srinivas');
    const bhatt = asPersonId(platform, 'per-r-bhatt');
    const internal = ok(
      await srinivas.accessRequests.getRequestStatus(route(platform, 'REQ-0039')),
    );
    // B1-08 f9 "Internal route · access active with no payment step" (the B7 reading of REQ-0039).
    expect(internal).toMatchObject({
      reference: 'REQ-0039',
      institutionName: 'BITS Pilani — Hyderabad Campus',
      status: 'access-active',
      nextStep: 'sign-in',
      activatedPlanId: 'ACC-0098',
    });
    expect(internal.history.map((entry) => entry.event)).not.toContain('payment-started');
    expect(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0039'))).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(
      ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040'))).reference,
    ).toBe('REQ-0040');
    // An internal request has no payment step, for its Institute Admin too (REQ-09).
    expect(
      await srinivas.accessRequests.startPayment({
        request: route(platform, 'REQ-0039'),
        expectedRev: internal.rev,
      }),
    ).toEqual({ ok: false, error: { kind: 'invalid-state', current: 'access-active' } });
  });

  it('signs nobody in by an address: a Student, the Super Admin or a stranger reads nothing', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const address = route(platform, 'REQ-0040');
    for (const ports of [
      asPerson(platform, 'Arjun Mehta'),
      asPerson(platform, 'Kavya Nair'),
      visitorPorts(platform),
    ]) {
      expect(await ports.accessRequests.getRequestStatus(address)).toEqual({
        ok: false,
        error: { kind: 'not-found' },
      });
    }
    expect(
      await visitorPorts(platform).accessRequests.getRequestStatus(
        unsafeBrand<RequestRouteId>('REQ-0040'),
      ),
    ).toEqual({ ok: false, error: { kind: 'not-found' } });
  });
});

describe('TE-4 — the sample payment provider (owner authorisation, 14 Oct 2026)', () => {
  /** The tab's own browser session sends the request (its ports, and its command-id views). */
  async function approved(paymentStandIn?: 'confirm-on-start' | 'provider-reports') {
    const platform = createSamplePlatform({
      world: seed(),
      ...(paymentStandIn ? { paymentStandIn } : {}),
    });
    const visitor = platform.ports;
    const sent = await send(visitor);
    await approveExternal(platform, sent.reference);
    const view = ok(await visitor.accessRequests.getRequestStatus(sent.routeId));
    return { platform, visitor, sent, view };
  }

  it('confirms a started payment in a local prototype build, as its own system event with sample provenance', async () => {
    const { platform, visitor, sent, view } = await approved('confirm-on-start');
    const answer = await visitor.accessRequests.startPayment({
      request: sent.routeId,
      expectedRev: view.rev,
    });
    // The command answers what it did; its receipt names what the provider changed too.
    expect(ok(answer).status).toBe('payment-not-confirmed');
    expect(answer.ok && answer.changed.map((ref) => ref.kind).sort()).toEqual([
      'ACC',
      'INST',
      'REQ',
    ]);
    const history = worldOf(platform).history.slice(-2);
    expect(history.map((entry) => [entry.method, entry.origin])).toEqual([
      ['AccessRequestService.startPayment', 'command'],
      ['PaymentOutcomePort.report', 'sample-standin'],
    ]);
    const active = ok(await visitor.accessRequests.getRequestStatus(sent.routeId));
    expect(active).toMatchObject({ status: 'access-active', nextStep: 'sign-in' });
    expect(active.activatedPlanId).toMatch(/^ACC-\d{4}$/);
    expect(active.history.map((entry) => [entry.event, entry.actor.kind])).toEqual([
      ['submitted', 'requester'],
      ['approved', 'person'],
      ['payment-started', 'requester'],
      ['payment-confirmed', 'system'],
      ['access-active', 'system'],
    ]);
  });

  it('leaves the payment pending, or fails it, only when a test plans it (P1-06, P1-18)', async () => {
    const pending = await approved('confirm-on-start');
    planPayment(pending.platform, 'pending');
    const started = await pending.visitor.accessRequests.startPayment({
      request: pending.sent.routeId,
      expectedRev: pending.view.rev,
    });
    expect(started.ok && started.changed.map((ref) => ref.kind)).toEqual(['REQ']);
    expect(
      ok(await pending.visitor.accessRequests.getRequestStatus(pending.sent.routeId)).nextStep,
    ).toBe('check-again');

    const failing = await approved('confirm-on-start');
    planPayment(failing.platform, 'failed');
    ok(
      await failing.visitor.accessRequests.startPayment({
        request: failing.sent.routeId,
        expectedRev: failing.view.rev,
      }),
    );
    const failed = ok(await failing.visitor.accessRequests.getRequestStatus(failing.sent.routeId));
    expect([failed.status, failed.nextStep, failed.activatedPlanId]).toEqual([
      'payment-failed',
      'try-payment-again',
      null,
    ]);
    // "Try payment again": the plan is spent, so the prototype's provider confirms this one.
    ok(
      await failing.visitor.accessRequests.startPayment({
        request: failing.sent.routeId,
        expectedRev: failed.rev,
      }),
    );
    expect(
      ok(await failing.visitor.accessRequests.getRequestStatus(failing.sent.routeId)).status,
    ).toBe('access-active');
  });

  it('reports nothing by default: the seed, the walk and the contract suite call the stand-in port', async () => {
    const { visitor, sent, view } = await approved();
    ok(await visitor.accessRequests.startPayment({ request: sent.routeId, expectedRev: view.rev }));
    expect(ok(await visitor.accessRequests.getRequestStatus(sent.routeId)).status).toBe(
      'payment-not-confirmed',
    );
  });

  it('answers a repeated command id with its first receipt and reports no second time', async () => {
    const { platform, sent, view } = await approved('confirm-on-start');
    // The command-id view of the same browser session, as the web query layer sends a command.
    const pay = () =>
      platform
        .withCommandId('cmd-te4-1')
        .accessRequests.startPayment({ request: sent.routeId, expectedRev: view.rev });
    const first = await pay();
    expect(first.ok).toBe(true);
    const version = worldOf(platform).worldVersion;
    const reports = worldOf(platform).history.filter(
      (entry) => entry.method === 'PaymentOutcomePort.report',
    ).length;
    expect(await pay()).toEqual({
      ...first,
      changed: first.ok ? [{ kind: 'REQ', id: sent.reference }] : [],
    });
    expect(worldOf(platform).worldVersion).toBe(version);
    expect(
      worldOf(platform).history.filter((entry) => entry.method === 'PaymentOutcomePort.report'),
    ).toHaveLength(reports);
  });
});

describe('the ticket never crosses a port (PC-34; ADR-0009)', () => {
  it('the Super Admin’s decision page and every decision receipt carry the request without it', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const visitor = visitorPorts(platform);
    const sent = await send(visitor);
    const admin = asPerson(platform, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    expect(page.request).not.toHaveProperty('statusToken');
    expect(page.request.routeId).toBe(sent.routeId);
    const konark = ok(await admin.accessRequests.getRequestForDecision('REQ-0040' as RequestId));
    const asked = ok(
      await admin.accessRequests.requestMoreInformation({
        id: 'REQ-0040' as RequestId,
        reason: 'Please confirm the size of the second section.',
        expectedRev: konark.request.rev,
      }),
    );
    expect(asked.request).not.toHaveProperty('statusToken');
    const approved = ok(
      await admin.accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      }),
    );
    expect(approved.request).not.toHaveProperty('statusToken');
    const view = ok(await visitor.accessRequests.getRequestStatus(sent.routeId));
    planPayment(platform, 'pending');
    ok(await visitor.accessRequests.startPayment({ request: view.routeId, expectedRev: view.rev }));
    const report = standinsOf(platform).paymentOutcome.report({
      requestId: sent.reference,
      outcome: 'confirmed',
    });
    expect(report.ok && report.value.request).not.toHaveProperty('statusToken');
    // The world keeps it: the sending browser session still opens its request.
    expect(requestOf(platform, sent.reference).statusToken).toMatch(/\S/);
    expect(ok(await visitor.accessRequests.getRequestStatus(sent.routeId)).status).toBe(
      'access-active',
    );
  });
});

describe('Package 1E — a ticket opens its own request only, whatever reaches storage', () => {
  it('a visitor’s own ticket does not open another request’s address, nor pay for it', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const visitor = visitorPorts(platform);
    const sent = await send(visitor);
    const other = requestOf(platform, 'REQ-0037');
    expect(other.routeId).not.toBe(sent.routeId);
    const before = worldOf(platform).worldVersion;
    expect(await visitor.accessRequests.getRequestStatus(other.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(
      await visitor.accessRequests.startPayment({ request: other.routeId, expectedRev: other.rev }),
    ).toEqual({ ok: false, error: { kind: 'not-found' } });
    expect(worldOf(platform).worldVersion).toBe(before);
  });

  it('a well-formed ticket planted after the world started — this world, a real token — opens nothing', async () => {
    const storage = memoryStorage();
    const platform = createSamplePlatform({
      world: seed(),
      browserStorage: storage,
      worldInstance: 'world-x',
    });
    // The seed's tokens are deterministic: the forged entry names a real one, the world the tab
    // runs and the visitor. Storage is read once, when the world starts; a later write is not a
    // ticket. (In the browser the world instance is minted at random on every page load, as the
    // world is built, so an entry naming it cannot be written beforehand.)
    const seeded = requestOf(platform, 'REQ-0037');
    storage.setItem(
      'xr.request-tickets.v2',
      JSON.stringify([{ world: 'world-x', token: seeded.statusToken, holder: 'visitor' }]),
    );
    const before = worldOf(platform).worldVersion;
    expect(await platform.ports.accessRequests.getRequestStatus(seeded.routeId)).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    });
    expect(worldOf(platform).worldVersion).toBe(before);
  });

  it('the Super Admin’s list and a smaller-scope receipt carry no ticket either (PC-34)', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const sent = await send(visitorPorts(platform));
    const token = requestOf(platform, sent.reference).statusToken;
    const admin = asPerson(platform, 'Arjun Mehta');
    const rows = ok(await admin.accessRequests.listRequests({ sort: 'received-newest' }));
    expect(rows.map((row) => row.id)).toContain(sent.reference);
    expect(JSON.stringify(rows)).not.toContain(token);
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    const smaller = ok(
      await admin.accessRequests.approveSmallerScope({
        id: sent.reference,
        route: 'external',
        items: [{ experimentId: SHELL, formats: ['web'] }],
        licences: '100',
        term: 'yearly',
        reason: 'WEB for the first term.',
        expectedRev: page.request.rev,
      }),
    );
    expect(JSON.stringify(smaller)).not.toContain(token);
  });
});

describe('Package 1E — repeated and stale commands write nothing (P1-21; dedupe)', () => {
  it('a repeated command id answers the first request’s receipt: one request, one world change', async () => {
    const platform = createSamplePlatform({ world: seed() });
    ok(platform.ports.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    const submit = () =>
      platform.withCommandId('cmd-1e-submit').accessRequests.submitPublicRequest({
        institutionName: 'Godavari Institute of Technology',
        contactPerson: 'Meera Iyer',
        email: 'meera.iyer@godavari.edu.in',
        phone: null,
        licencesRequested: '120',
        message: null,
        term: { kind: 'yearly' },
      });
    const first = ok(await submit());
    const version = worldOf(platform).worldVersion;
    const requests = Object.keys(worldOf(platform).records.requests).length;
    expect(ok(await submit())).toEqual(first);
    expect(worldOf(platform).worldVersion).toBe(version);
    expect(Object.keys(worldOf(platform).records.requests)).toHaveLength(requests);
  });

  it('a repeated approval command id answers its first receipt and decides once', async () => {
    const platform = createSamplePlatform({ world: seed() });
    const sent = await send(visitorPorts(platform));
    // The tab's own session signs in as the Super Admin (the CI seam): its command-id view is the
    // one the web query layer sends commands through.
    beginSession(platform, 'sa-arjun-mehta');
    const page = ok(await platform.ports.accessRequests.getRequestForDecision(sent.reference));
    const approve = () =>
      platform.withCommandId('cmd-1e-approve').accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      });
    const first = await approve();
    expect(first.ok && first.value.request.status).toBe('approved-payment-required');
    const version = worldOf(platform).worldVersion;
    expect(await approve()).toEqual(first);
    expect(worldOf(platform).worldVersion).toBe(version);
    expect(
      requestOf(platform, sent.reference).history.filter((entry) => entry.event === 'approved'),
    ).toHaveLength(1);
    // The same approval under a new command id is a new command: refused, nothing written.
    expect(
      await platform.withCommandId('cmd-1e-approve-2').accessRequests.approveRequest({
        id: sent.reference,
        route: 'external',
        expectedRev: page.request.rev,
      }),
    ).toMatchObject({ ok: false });
    expect(worldOf(platform).worldVersion).toBe(version);
  });

  it.each([
    ['approveRequest', { route: 'external' }],
    [
      'approveSmallerScope',
      {
        route: 'external',
        items: [{ experimentId: SHELL, formats: ['web'] }],
        licences: '100',
        term: 'yearly',
        reason: 'WEB for the first term.',
      },
    ],
    ['requestMoreInformation', { reason: 'Which cohort?' }],
  ] as const)(
    '%s with the revision from before a change is refused as stale and writes nothing',
    async (method, input) => {
      const platform = createSamplePlatform({ world: seed() });
      const sent = await send(visitorPorts(platform));
      const admin = asPerson(platform, 'Arjun Mehta');
      const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
      // The AD-14 review start (a test-only fact): the request stays under review, one revision on.
      seamsOf(platform).recordReviewStarted(sent.reference);
      const before = worldOf(platform).worldVersion;
      const record = requestOf(platform, sent.reference);
      const command = admin.accessRequests[method] as (input: unknown) => Promise<unknown>;
      expect(
        await command({ id: sent.reference, ...input, expectedRev: page.request.rev }),
      ).toEqual({ ok: false, error: { kind: 'stale-version', currentRev: page.request.rev + 1 } });
      expect(worldOf(platform).worldVersion).toBe(before);
      expect(requestOf(platform, sent.reference)).toEqual(record);
    },
  );
});

const REQ_0038 = unsafeBrand<RequestId>('REQ-0038');
const REQ_0040 = unsafeBrand<RequestId>('REQ-0040');

describe('DP-09 interim safeguard: a repeat public request never creates a second institution (P1 register §A, A.1–A.6)', () => {
  it('names the existing institution on SA-03 and holds both approvals; nothing is written', async () => {
    const platform = createSamplePlatform({ world: seed() });
    // A.1: a visitor names the seeded, onboarded institution (internal, ACC-0098) in another form.
    const sent = await send(visitorPorts(platform), '  bits pilani - hyderabad   campus ');
    const admin = asPerson(platform, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(sent.reference));
    expect(page.sameNameInstitutions).toEqual([
      { institutionId: 'bitshyd', name: 'BITS Pilani — Hyderabad Campus', kind: 'internal' },
    ]);
    expect(page.existingAccess).toBeNull();
    const institutionsBefore = Object.keys(worldOf(platform).records.institutions).sort();
    const versionBefore = worldOf(platform).worldVersion;

    // A.3–A.5: neither approval goes ahead, on either route.
    for (const route of ['internal', 'external'] as const) {
      expect(
        await admin.accessRequests.approveRequest({
          id: sent.reference,
          route,
          expectedRev: page.request.rev,
        }),
      ).toEqual({ ok: false, error: { kind: 'policy-open', decision: 'SEL-05' } });
    }
    expect(
      await admin.accessRequests.approveSmallerScope({
        id: sent.reference,
        route: 'external',
        items: [{ experimentId: SHELL, formats: ['web'] }],
        licences: '100',
        term: 'yearly',
        reason: 'Licences: 120 → 100',
        expectedRev: page.request.rev,
      }),
    ).toEqual({ ok: false, error: { kind: 'policy-open', decision: 'SEL-05' } });

    // A.5–A.6: one record stays; the request still waits; the reserved id is not taken.
    expect(Object.keys(worldOf(platform).records.institutions).sort()).toEqual(institutionsBefore);
    expect(worldOf(platform).worldVersion).toBe(versionBefore);
    expect(requestOf(platform, sent.reference).status).toBe('under-review');
    expect(requestOf(platform, sent.reference).institutionId).toBeNull();
    const godavari = await send(visitorPorts(platform));
    const approved = await approveExternal(platform, godavari.reference);
    expect(approved.institution?.id).toBe('godavari');
  });

  it('keeps the existing institution’s own renewal and an unrelated new institution moving', async () => {
    const platform = createSamplePlatform({ world: seed() });
    await send(visitorPorts(platform), 'BITS Pilani — Hyderabad Campus');
    const admin = asPerson(platform, 'Arjun Mehta');
    // REQ-0038 renews ACC-0098 of the same institution: it already has its institution.
    const renewal = ok(await admin.accessRequests.getRequestForDecision(REQ_0038));
    expect(renewal.sameNameInstitutions).toEqual([]);
    const renewed = ok(
      await admin.accessRequests.approveRequest({
        id: REQ_0038,
        route: null,
        expectedRev: renewal.request.rev,
      }),
    );
    expect(renewed.request.status).toBe('access-active');
    // A request naming no existing institution is approved as before.
    const other = await send(visitorPorts(platform), 'Krishna Engineering College');
    const page = ok(await admin.accessRequests.getRequestForDecision(other.reference));
    expect(page.sameNameInstitutions).toEqual([]);
    expect((await approveExternal(platform, other.reference)).request.status).toBe(
      'approved-payment-required',
    );
  });
});

describe('DP-08 — no payment starts or completes while the institution is paused', () => {
  const route = (platform: SamplePlatform, reference: string) =>
    requestOf(platform, reference).routeId as RequestRouteId;

  /** Konark's more-licences request REQ-0040, approved: payment required (external). */
  async function konarkAwaitingPayment() {
    const platform = createSamplePlatform({ world: seed() });
    const admin = asPerson(platform, 'Arjun Mehta');
    const page = ok(await admin.accessRequests.getRequestForDecision(REQ_0040));
    ok(
      await admin.accessRequests.approveRequest({
        id: page.request.id,
        route: null,
        expectedRev: page.request.rev,
      }),
    );
    const pauseKonark = async (paused: boolean) => {
      const detail = ok(await admin.institutions.getInstitution('konark' as never));
      const input = {
        institutionId: 'konark' as never,
        reason: 'Licence review.',
        expectedRev: detail.institution.rev,
      };
      ok(
        paused
          ? await admin.institutions.pauseInstitution(input)
          : await admin.institutions.restoreInstitution(input),
      );
    };
    return { platform, bhatt: asPersonId(platform, 'per-r-bhatt'), pauseKonark };
  }

  it('offers no payment step and refuses one while paused; once restored the payment starts', async () => {
    const { platform, bhatt, pauseKonark } = await konarkAwaitingPayment();
    await pauseKonark(true);
    const held = ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040')));
    expect([held.status, held.nextStep]).toEqual(['approved-payment-required', 'none']);
    const versionBefore = worldOf(platform).worldVersion;
    expect(
      await bhatt.accessRequests.startPayment({
        request: route(platform, 'REQ-0040'),
        expectedRev: held.rev,
      }),
    ).toEqual({ ok: false, error: { kind: 'refused', code: 'institution-paused' } });
    expect(worldOf(platform).worldVersion).toBe(versionBefore);
    expect(requestOf(platform, 'REQ-0040').payments).toEqual([]);

    await pauseKonark(false);
    const open = ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040')));
    expect(open.nextStep).toBe('continue-to-payment');
    const started = ok(
      await bhatt.accessRequests.startPayment({
        request: route(platform, 'REQ-0040'),
        expectedRev: open.rev,
      }),
    );
    expect(started.status).toBe('payment-not-confirmed');
  });

  it('a confirmation reported while paused completes nothing; the same report is accepted once restored', async () => {
    const { platform, bhatt, pauseKonark } = await konarkAwaitingPayment();
    const open = ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040')));
    ok(
      await bhatt.accessRequests.startPayment({
        request: route(platform, 'REQ-0040'),
        expectedRev: open.rev,
      }),
    );
    await pauseKonark(true);
    const provider = standinsOf(platform).paymentOutcome;
    expect(provider.report({ requestId: REQ_0040, outcome: 'confirmed' })).toEqual({
      ok: false,
      error: { kind: 'invalid-state', current: 'institution-paused' },
    });
    const waiting = requestOf(platform, 'REQ-0040');
    expect(waiting.status).toBe('payment-not-confirmed');
    expect(waiting.payments.map((payment) => payment.outcome)).toEqual(['pending']);
    expect(
      ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040'))).nextStep,
    ).toBe('check-again');

    await pauseKonark(false);
    expect(provider.report({ requestId: REQ_0040, outcome: 'confirmed' }).ok).toBe(true);
    const done = requestOf(platform, 'REQ-0040');
    expect(done.status).toBe('access-active');
    expect(done.payments.map((payment) => payment.outcome)).toEqual(['confirmed']);
    expect(done.history.map((entry) => entry.event)).toContain('payment-confirmed');
  });

  it('a failure reported while paused is recorded, and Try payment again waits for the pause to end', async () => {
    const { platform, bhatt, pauseKonark } = await konarkAwaitingPayment();
    const open = ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040')));
    ok(
      await bhatt.accessRequests.startPayment({
        request: route(platform, 'REQ-0040'),
        expectedRev: open.rev,
      }),
    );
    await pauseKonark(true);
    expect(
      standinsOf(platform).paymentOutcome.report({ requestId: REQ_0040, outcome: 'failed' }).ok,
    ).toBe(true);
    const failed = ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040')));
    expect([failed.status, failed.nextStep]).toEqual(['payment-failed', 'none']);
    expect(requestOf(platform, 'REQ-0040').payments.map((payment) => payment.outcome)).toEqual([
      'failed',
    ]);
    await pauseKonark(false);
    expect(
      ok(await bhatt.accessRequests.getRequestStatus(route(platform, 'REQ-0040'))).nextStep,
    ).toBe('try-payment-again');
  });
});
