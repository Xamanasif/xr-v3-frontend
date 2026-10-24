/**
 * The requester's own ticket, kept in this browser beside the saved world (owner decision, 24 Oct
 * 2026; ADR-0009 amendment; audit CB-1 / F-01) — a local prototype build with the browser snapshot
 * (TE-6). A reload, navigating away, or closing the tab and opening the site again (each a new page
 * load on the same browser storage) comes back to the SAME request: the status page opens, the
 * requester pays, access becomes active — one request, one institution. The ticket is bound to the
 * world lineage (a reset or a rejected save ends it), to the one request it was issued for, and to
 * the signed-out visitor of this browser; another browser, a sign-in, a forged or withheld value
 * and every other request stay as ADR-0009 has them: not found.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import {
  type ExperimentId,
  type RequestId,
  type RequestStatusToken,
  unsafeBrand,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import {
  createSamplePlatform,
  KEPT_TICKETS_KEY,
  type SamplePlatform,
  type SamplePlatformOptions,
  SNAPSHOT_KEY,
  type SnapshotStorage,
} from './index.js';
import { type KeptTicket } from './persistence/kept-tickets.js';
import { sanitised, withheldToken, withKeptTokens } from './persistence/snapshot.js';
import { asPerson, visitorPorts, worldOf } from './testing/index.js';

const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const GODAVARI = 'Godavari Institute of Technology';
const NOT_FOUND = { ok: false, error: { kind: 'not-found' } };

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
/**
 * One page load of the local prototype build on a browser's `localStorage` — as the web runtime
 * composes it: TE-4's payment stand-in confirms on start, and the tab's own browser session (its
 * `sessionStorage` is new: a closed and reopened tab, or a reload's new world instance).
 */
function load(
  local: SnapshotStorage,
  options: Partial<SamplePlatformOptions> = {},
): SamplePlatform {
  lineages += 1;
  return createSamplePlatform({
    preAuthorisedDevices: 'local-demonstration-seed',
    paymentStandIn: 'confirm-on-start',
    snapshot: { storage: local, lineage: `lineage-${lineages}` },
    ...options,
  });
}

/** The drawn request (B1-07 f4), from a visitor's own selection. */
async function send(ports: ProductPorts, institutionName = GODAVARI) {
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

async function approve(
  platform: SamplePlatform,
  reference: RequestId,
  route: 'external' | 'internal',
) {
  const admin = asPerson(platform, 'Arjun Mehta');
  const page = ok(await admin.accessRequests.getRequestForDecision(reference));
  return ok(
    await admin.accessRequests.approveRequest({
      id: reference,
      route,
      expectedRev: page.request.rev,
    }),
  );
}

function keptValue(local: ReturnType<typeof storage>) {
  const text = local.items.get(KEPT_TICKETS_KEY);
  return text === undefined
    ? null
    : (JSON.parse(text) as { lineage: string; tickets: KeptTicket[] });
}

const lineageOf = (local: ReturnType<typeof storage>) =>
  local.items.get(SNAPSHOT_KEY)!.split('|')[3];

const institutionsNamed = (platform: SamplePlatform, name: string) =>
  Object.values(worldOf(platform).records.institutions).filter(
    (institution) => institution.name === name,
  );

describe('the requester’s ticket is kept in this browser (CB-1: External approval, then a reload)', () => {
  it('a reload of the status page after “Approved — payment required” opens the same request, and the requester pays', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(tab.ports);
    await approve(tab, sent.reference, 'external');
    const requests = Object.keys(worldOf(tab).records.requests).length;

    // The reload: a new page load on the same browser storage, signed out.
    const reloaded = load(local);
    expect(reloaded.snapshot?.opened).toBe('restored');
    const status = ok(await reloaded.ports.accessRequests.getRequestStatus(sent.routeId));
    expect(status).toMatchObject({
      reference: sent.reference,
      routeId: sent.routeId,
      institutionName: GODAVARI,
      status: 'approved-payment-required',
      nextStep: 'continue-to-payment',
    });
    // PU-12 "Continue to payment": TE-4's stand-in confirms; access is active.
    const paid = ok(
      await reloaded.ports.accessRequests.startPayment({
        request: sent.routeId,
        expectedRev: status.rev,
      }),
    );
    expect(paid.status).toBe('payment-not-confirmed');
    const active = ok(await reloaded.ports.accessRequests.getRequestStatus(sent.routeId));
    expect(active).toMatchObject({ reference: sent.reference, status: 'access-active' });
    expect(active.activatedPlanId).toBe('ACC-0107');
    // The same request, one institution: nothing was sent again.
    expect(Object.keys(worldOf(reloaded).records.requests)).toHaveLength(requests);
    expect(institutionsNamed(reloaded, GODAVARI)).toHaveLength(1);
    // The token is withheld again in the save; only the kept value beside it carries it.
    const token = worldOf(reloaded).records.requests[sent.reference]!.statusToken;
    expect(local.items.get(SNAPSHOT_KEY)).not.toContain(token);
    expect(local.items.get(SNAPSHOT_KEY)).toContain(withheldToken(sent.reference));
  });

  it('every later page load of this browser — navigating away and back, a tab closed and opened again — reads it, in progress on PU-07', async () => {
    const local = storage();
    const sent = await send(load(local).ports);
    for (let visit = 0; visit < 3; visit += 1) {
      const page = load(local);
      expect(ok(await page.ports.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
        sent.reference,
      );
      expect(ok(await page.ports.accessRequests.listRequestsInProgress())).toEqual([
        { routeId: sent.routeId, institutionName: GODAVARI },
      ]);
    }
    // Writing nothing on the way in: the kept value is the one the request was sent with.
    expect(keptValue(local)?.tickets).toHaveLength(1);
  });

  it('the Internal route is unchanged: access is active with no payment step, and the request is no longer in progress', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(tab.ports);
    await approve(tab, sent.reference, 'internal');
    const reloaded = load(local);
    const status = ok(await reloaded.ports.accessRequests.getRequestStatus(sent.routeId));
    expect(status).toMatchObject({ status: 'access-active', nextStep: 'sign-in' });
    expect(status.history.map((entry) => entry.event)).not.toContain('payment-started');
    expect(ok(await reloaded.ports.accessRequests.listRequestsInProgress())).toEqual([]);
  });

  it('a tab already open picks up a ticket another tab of this browser kept', async () => {
    const local = storage();
    const first = load(local);
    const second = load(local);
    const sent = await send(second.ports);
    expect(first.snapshot?.sync()).toBe('adopted');
    expect(ok(await first.ports.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
    // Adopted before the ticket was kept (another process, a later storage event): put back then.
    const third = load(local);
    const later = await send(second.ports, 'Krishna Valley College of Engineering');
    local.items.set(KEPT_TICKETS_KEY, JSON.stringify({ ...keptValue(local)!, tickets: [] }));
    expect(third.snapshot?.sync()).toBe('adopted');
    expect(await third.ports.accessRequests.getRequestStatus(later.routeId)).toEqual(NOT_FOUND);
    const kept = { lineage: lineageOf(local), tickets: [] as KeptTicket[] };
    const request = worldOf(second).records.requests[later.reference]!;
    kept.tickets.push({
      request: request.id,
      routeId: request.routeId,
      createdAt: request.createdAt,
      token: request.statusToken,
    });
    local.items.set(KEPT_TICKETS_KEY, JSON.stringify({ format: 1, ...kept }));
    expect(third.snapshot?.sync()).toBe('adopted');
    expect(ok(await third.ports.accessRequests.getRequestStatus(later.routeId)).reference).toBe(
      later.reference,
    );
    expect(third.snapshot?.sync()).toBe('current');
  });
});

describe('only this browser’s visitor, only that request, only this lineage', () => {
  it('another browser holding the same save, and another browser session of this world, open nothing', async () => {
    const local = storage();
    const sent = await send(load(local).ports);
    const elsewhere = storage();
    elsewhere.items.set(SNAPSHOT_KEY, local.items.get(SNAPSHOT_KEY)!);
    const other = load(elsewhere);
    expect(other.snapshot?.opened).toBe('restored');
    expect(await other.ports.accessRequests.getRequestStatus(sent.routeId)).toEqual(NOT_FOUND);
    expect(ok(await other.ports.accessRequests.listRequestsInProgress())).toEqual([]);
    const here = load(local);
    expect(await visitorPorts(here).accessRequests.getRequestStatus(sent.routeId)).toEqual(
      NOT_FOUND,
    );
  });

  it('nobody else’s request is reachable: the seeded requests in progress stay not found and are never listed', async () => {
    const local = storage();
    const sent = await send(load(local).ports);
    const page = load(local);
    const others = Object.values(worldOf(page).records.requests).filter(
      (request) => request.id !== sent.reference,
    );
    expect(others.length).toBeGreaterThan(5);
    for (const request of others) {
      expect(await page.ports.accessRequests.getRequestStatus(request.routeId), request.id).toEqual(
        NOT_FOUND,
      );
    }
    expect(ok(await page.ports.accessRequests.listRequestsInProgress())).toEqual([
      { routeId: sent.routeId, institutionName: GODAVARI },
    ]);
  });

  it('a person signed in holds none of the visitor’s kept tickets; signed out, the visitor has them back', async () => {
    const local = storage();
    const sent = await send(load(local).ports);
    const page = load(local);
    ok(
      await page.ports.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    expect(await page.ports.accessRequests.getRequestStatus(sent.routeId)).toEqual(NOT_FOUND);
    expect(ok(await page.ports.accessRequests.listRequestsInProgress())).toEqual([]);
    ok(await page.ports.session.signOut());
    expect(ok(await page.ports.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
  });

  it('a request sent during a sign-in is that sign-in’s: it is not kept in the browser and ends with the page load', async () => {
    const local = storage();
    const tab = load(local);
    ok(
      await tab.ports.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    const sent = await send(tab.ports);
    expect(ok(await tab.ports.accessRequests.getRequestStatus(sent.routeId)).reference).toBe(
      sent.reference,
    );
    expect(local.items.has(KEPT_TICKETS_KEY)).toBe(false);
    const reloaded = load(local);
    expect(await reloaded.ports.accessRequests.getRequestStatus(sent.routeId)).toEqual(NOT_FOUND);
    ok(
      await reloaded.ports.session.signIn({
        method: 'email',
        email: 'kavya.nair@wilp.example',
        password: 'sample-password',
      }),
    );
    expect(await reloaded.ports.accessRequests.getRequestStatus(sent.routeId)).toEqual(NOT_FOUND);
  });

  it('Reset removes the kept ticket with the save; the next page load holds none', async () => {
    const local = storage();
    const tab = load(local);
    await send(tab.ports);
    expect(local.items.has(KEPT_TICKETS_KEY)).toBe(true);
    await tab.snapshot?.clear();
    expect(local.items.has(SNAPSHOT_KEY)).toBe(false);
    expect(local.items.has(KEPT_TICKETS_KEY)).toBe(false);
    // Nothing is kept again by the reset page load.
    await send(tab.ports, 'Krishna Valley College of Engineering');
    expect(local.items.has(KEPT_TICKETS_KEY)).toBe(false);
    const next = load(local);
    expect(next.snapshot?.opened).toBe('fresh');
    expect(ok(await next.ports.accessRequests.listRequestsInProgress())).toEqual([]);
  });

  it('a ticket kept in another lineage — a reset elsewhere, a rejected or other-build save — opens nothing and is dropped', async () => {
    const local = storage();
    const sent = await send(load(local).ports);
    const kept = local.items.get(KEPT_TICKETS_KEY)!;

    // A damaged save is rejected: a clean world in a new lineage; the old ticket is removed.
    local.items.set(SNAPSHOT_KEY, local.items.get(SNAPSHOT_KEY)!.replace('Shell-and-Tube', 'X'));
    const clean = load(local);
    expect(clean.snapshot?.opened).toBe('rejected');
    expect(local.items.has(KEPT_TICKETS_KEY)).toBe(false);

    // The same ticket planted again beside the clean world: another lineage, honoured nowhere —
    // not even for the request the clean world's first visitor sends at the same address.
    local.items.set(KEPT_TICKETS_KEY, kept);
    const again = load(local);
    expect(again.snapshot?.opened).toBe('restored');
    const twin = await send(visitorPorts(again));
    expect(twin).toEqual(sent);
    expect(await again.ports.accessRequests.getRequestStatus(twin.routeId)).toEqual(NOT_FOUND);
    expect(ok(await again.ports.accessRequests.listRequestsInProgress())).toEqual([]);

    // A save of another build is rejected too, and so is the ticket kept for it.
    const other = storage();
    await send(load(other).ports);
    const otherBuild = load(other, { preAuthorisedDevices: 'none' });
    expect(otherBuild.snapshot?.rejectedBecause).toBe('another build');
    expect(other.items.has(KEPT_TICKETS_KEY)).toBe(false);
  });

  it('a kept ticket names one request: another address or creation, a withheld placeholder, a token twice — nothing is put back', async () => {
    const local = storage();
    const tab = load(local);
    const sent = await send(tab.ports);
    const mine = worldOf(tab).records.requests[sent.reference]!;
    const lineage = lineageOf(local);
    const seeded = Object.values(worldOf(tab).records.requests).find(
      (request) => request.id !== sent.reference && request.status === 'approved-payment-required',
    )!;
    const plant = (tickets: readonly unknown[]) =>
      local.items.set(KEPT_TICKETS_KEY, JSON.stringify({ format: 1, lineage, tickets }));
    const opens = async (routeId: string) =>
      (await load(local).ports.accessRequests.getRequestStatus(routeId as typeof sent.routeId)).ok;

    plant([{ request: mine.id, routeId: 'rq-9999', createdAt: mine.createdAt, token: 'tok-x' }]);
    expect(await opens(sent.routeId)).toBe(false);
    plant([{ request: mine.id, routeId: mine.routeId, createdAt: 'another', token: 'tok-x' }]);
    expect(await opens(sent.routeId)).toBe(false);
    // The withheld placeholder of the seeded request is never a ticket for it.
    plant([
      {
        request: seeded.id,
        routeId: seeded.routeId,
        createdAt: seeded.createdAt,
        token: withheldToken(seeded.id),
      },
    ]);
    expect(await opens(seeded.routeId)).toBe(false);
    plant([
      {
        request: mine.id,
        routeId: mine.routeId,
        createdAt: mine.createdAt,
        token: withheldToken(mine.id),
      },
    ]);
    expect(await opens(sent.routeId)).toBe(false);
    // Malformed entries and other formats are left out.
    local.items.set(KEPT_TICKETS_KEY, JSON.stringify({ format: 2, lineage, tickets: [] }));
    expect(await opens(sent.routeId)).toBe(false);
    local.items.set(KEPT_TICKETS_KEY, '{not json');
    expect(await opens(sent.routeId)).toBe(false);
    plant([null, 'tok-0011', { request: mine.id, routeId: mine.routeId, token: 7 }]);
    expect(await opens(sent.routeId)).toBe(false);
  });
});

describe('withKeptTokens', () => {
  it('puts a token back on exactly its request, only over the withheld placeholder, each token once', async () => {
    const local = storage();
    const tab = load(local);
    const first = await send(tab.ports);
    const second = await send(tab.ports, 'Krishna Valley College of Engineering');
    const world = worldOf(tab);
    const a = world.records.requests[first.reference]!;
    const b = world.records.requests[second.reference]!;
    const stored = sanitised(world);
    const ticket = (request: typeof a, token = request.statusToken): KeptTicket => ({
      request: request.id,
      routeId: request.routeId,
      createdAt: request.createdAt,
      token,
    });

    expect(withKeptTokens(stored, [])).toBe(stored);
    const back = withKeptTokens(stored, [ticket(a)]);
    expect(back.records.requests[a.id]!.statusToken).toBe(a.statusToken);
    expect(back.records.requests[b.id]!.statusToken).toBe(withheldToken(b.id));
    // A token a request already holds is never replaced; a world with nothing to change is kept.
    expect(withKeptTokens(back, [ticket(a, unsafeBrand<RequestStatusToken>('tok-other'))])).toBe(
      back,
    );
    // One token for two requests: only the first gets it.
    const twice = withKeptTokens(stored, [ticket(a), ticket(b, a.statusToken)]);
    expect(twice.records.requests[a.id]!.statusToken).toBe(a.statusToken);
    expect(twice.records.requests[b.id]!.statusToken).toBe(withheldToken(b.id));
    // A request the world does not hold, or an inherited name, puts nothing back.
    for (const name of ['REQ-9999', 'constructor', '__proto__']) {
      expect(
        withKeptTokens(stored, [{ ...ticket(a), request: unsafeBrand<RequestId>(name) }]),
      ).toBe(stored);
    }
  });
});
