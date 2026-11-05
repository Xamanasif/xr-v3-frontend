/**
 * Browser persistence (TE-6; owner authorisation of Phase 7, 17 Oct 2026 — a local prototype build
 * only; ADR-0004's option B, behind the same driver interface). The tab's world is kept as ONE
 * versioned snapshot in the storage the composition root injects (the browser's `localStorage`);
 * this package never touches a browser API itself.
 *
 * - **Versioned and checked**: the value carries a format number, the world schema and version,
 *   the build's compatibility fingerprint (its starting world), the lineage (one per fresh start),
 *   the world version and a checksum of the world text. Anything unreadable, corrupted, hand-edited
 *   or saved by another build is rejected; the caller then starts a clean world.
 * - **Nothing sensitive**: the world holds no password, credential or session (sessions live in
 *   each tab's memory, ADR-0003). Before saving, the command receipts (which name sessions and may
 *   carry a command's answer) are left out, and every access request's status token is withheld
 *   (ADR-0009): the snapshot alone never re-opens a request status page.
 * - **The requester's own ticket, beside the snapshot** (owner decision, 24 Oct 2026; ADR-0009
 *   amendment): the signed-out visitor's ticket of a request sent in this browser is kept in its own
 *   value, bound to this lineage (`kept-tickets.ts`). A restored or adopted world gets that token
 *   back on exactly the request it was issued for (`withKeptTokens`), so the requester's status
 *   page opens again in this browser — and for nobody else, in no other browser.
 * - **One world, many tabs**: a tab adopts a newer save of its lineage (`adopt`); a different
 *   lineage means the world was reset elsewhere.
 */
import type { AccessRequest } from '@xr/domain';

import { TABLE_NAMES, WORLD_SCHEMA, WORLD_VERSION, type World } from '../world/types.js';
import {
  dropForeignTickets,
  type KeptTicket,
  keptTickets,
  KEPT_TICKETS_KEY,
  type TicketKeeper,
} from './kept-tickets.js';
import type { PersistenceDriver } from './memory.js';
import { isWithheldToken, withheldToken } from './withheld.js';

export { KEPT_TICKETS_KEY, withheldToken };

/** The part of the Web Storage API the snapshot needs (the browser's `localStorage`). */
export interface SnapshotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SNAPSHOT_KEY = 'xr.sample-world';
const MAGIC = 'xr-sample-world';
/** Bumped whenever the envelope or the sanitising rules change: older saves are then rejected. */
export const SNAPSHOT_FORMAT = 1;
const FIELDS = 6;

export interface SnapshotHead {
  readonly lineage: string;
  readonly worldVersion: number;
}

export type SnapshotRead =
  | { readonly status: 'none' }
  | { readonly status: 'found'; readonly world: World; readonly head: SnapshotHead }
  | { readonly status: 'rejected'; readonly reason: string };

/** A 53-bit string hash (cyrb53): an integrity check against damage, not a security measure. */
export function checksum(text: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * The build's fingerprint: its starting world, and its profile when it is not a local development
 * build (`variant`, e.g. `prototype`). A save from a build with another seed — or another profile —
 * is rejected and the browser starts clean, so a prototype build never opens a local build's save.
 */
export function compatibilityOf(start: World, variant?: string): string {
  const world = checksum(JSON.stringify(start));
  return variant ? `${world}~${checksum(variant)}` : world;
}

/** What a snapshot keeps of a world: no command receipts, no request status tokens. */
export function sanitised(world: World): World {
  const requests = Object.fromEntries(
    Object.entries(world.records.requests).map(([key, request]) => [
      key,
      { ...request, statusToken: withheldToken(request.id) } as AccessRequest,
    ]),
  );
  return {
    ...world,
    records: { ...world.records, requests },
    processedCommandIds: {},
  };
}

export function encodeSnapshot(world: World, lineage: string, compatibility: string): string {
  const text = JSON.stringify(sanitised(world));
  return [
    MAGIC,
    String(SNAPSHOT_FORMAT),
    compatibility,
    lineage,
    String(world.worldVersion),
    checksum(text),
    text,
  ].join('|');
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The world's shape, field by field (a value that passed the checksum can still be foreign). */
function worldShapeProblem(value: unknown, head: SnapshotHead): string | null {
  if (!isObject(value)) return 'not an object';
  if (value.schema !== WORLD_SCHEMA || value.version !== WORLD_VERSION) return 'another schema';
  if (value.worldVersion !== head.worldVersion) return 'world version differs from its head';
  if (typeof value.seedId !== 'string' || typeof value.anchor !== 'string') return 'no seed';
  if (value.seededAtReal !== null && typeof value.seededAtReal !== 'number') return 'no clock';
  if (!isObject(value.records)) return 'no records';
  const records = value.records;
  for (const table of TABLE_NAMES) if (!isObject(records[table])) return `no ${table}`;
  if (!isObject(value.identities) || !Array.isArray(value.identities.superAdmins))
    return 'no identities';
  if (
    !isObject(value.seeded) ||
    !Array.isArray(value.seeded.licenceWaits) ||
    !isObject(value.seeded.unavailableRightNow) ||
    !Array.isArray(value.seeded.featuredExperiments)
  )
    return 'no seeded facts';
  if (!Array.isArray(value.history) || !Array.isArray(value.runtimeEvents)) return 'no history';
  if (!isObject(value.idSource) || !isObject(value.processedCommandIds)) return 'no id state';
  if (!isObject(value.seedNotes) || !isObject(value.sentContent)) return 'no notes';
  return null;
}

export function decodeSnapshot(text: string | null, compatibility: string): SnapshotRead {
  if (text === null) return { status: 'none' };
  const parts: string[] = [];
  let rest = text;
  for (let field = 0; field < FIELDS; field += 1) {
    const bar = rest.indexOf('|');
    if (bar < 0) return { status: 'rejected', reason: 'unreadable' };
    parts.push(rest.slice(0, bar));
    rest = rest.slice(bar + 1);
  }
  const [magic, format, compat, lineage, version, sum] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  if (magic !== MAGIC) return { status: 'rejected', reason: 'unreadable' };
  if (format !== String(SNAPSHOT_FORMAT)) return { status: 'rejected', reason: 'another format' };
  if (compat !== compatibility) return { status: 'rejected', reason: 'another build' };
  if (!/^[\w-]{1,64}$/.test(lineage)) return { status: 'rejected', reason: 'unreadable' };
  const worldVersion = Number(version);
  if (!Number.isSafeInteger(worldVersion) || worldVersion < 0)
    return { status: 'rejected', reason: 'unreadable' };
  if (checksum(rest) !== sum) return { status: 'rejected', reason: 'damaged' };
  let world: unknown;
  try {
    world = JSON.parse(rest) as unknown;
  } catch {
    return { status: 'rejected', reason: 'damaged' };
  }
  const head = { lineage, worldVersion };
  const problem = worldShapeProblem(world, head);
  if (problem) return { status: 'rejected', reason: `foreign world (${problem})` };
  return { status: 'found', world: world as World, head };
}

/** The lineage and world version of a stored snapshot, without reading the world. */
export function headOf(text: string | null): SnapshotHead | null {
  if (text === null) return null;
  const parts = text.split('|', FIELDS);
  if (parts.length < FIELDS || parts[0] !== MAGIC) return null;
  const worldVersion = Number(parts[4]);
  return Number.isSafeInteger(worldVersion) ? { lineage: parts[3]!, worldVersion } : null;
}

/**
 * A world adopted from storage, merged with what only this tab may hold: the receipts of its own
 * commands and the status tokens of the requests it created (never saved; see `sanitised`).
 */
export function adoptedWorld(stored: World, current: World): World {
  const requests = Object.fromEntries(
    Object.entries(stored.records.requests).map(([key, request]) => {
      const mine = current.records.requests[key];
      // Only the very request this tab created (same address and creation) gets its token back.
      const same =
        mine !== undefined &&
        mine.routeId === request.routeId &&
        mine.createdAt === request.createdAt;
      return [
        key,
        same && request.statusToken === withheldToken(request.id)
          ? { ...request, statusToken: mine.statusToken }
          : request,
      ];
    }),
  );
  return {
    ...stored,
    records: { ...stored.records, requests },
    processedCommandIds: { ...current.processedCommandIds, ...stored.processedCommandIds },
  };
}

/**
 * A restored or adopted world with the tokens of the tickets this browser keeps for its visitor
 * put back (owner decision, 24 Oct 2026; ADR-0009 amendment). Each token goes back on exactly the
 * request its ticket was issued for — the same reference, address and creation, as `adoptedWorld`
 * matches a tab's own request — and only where the world holds the withheld placeholder, so a
 * token this tab already holds is never replaced. A token goes to one request at most and never to
 * a request whose token another one already has; a withheld placeholder is never put back. The
 * same world is answered when nothing changes.
 */
export function withKeptTokens(world: World, tickets: readonly KeptTicket[]): World {
  if (tickets.length === 0) return world;
  const held = world.records.requests;
  const taken = new Set<string>(Object.values(held).map((request) => request.statusToken));
  let requests: Record<string, AccessRequest> | null = null;
  for (const ticket of tickets) {
    if (!Object.hasOwn(held, ticket.request)) continue;
    const request = held[ticket.request]!;
    const issued = request.routeId === ticket.routeId && request.createdAt === ticket.createdAt;
    if (!issued || request.statusToken !== withheldToken(request.id)) continue;
    if (isWithheldToken(ticket.token) || taken.has(ticket.token)) continue;
    taken.add(ticket.token);
    requests = { ...(requests ?? held), [request.id]: { ...request, statusToken: ticket.token } };
  }
  return requests ? { ...world, records: { ...world.records, requests } } : world;
}

export interface SnapshotOptions {
  /** The browser's `localStorage` (injected: this package reads no browser API). */
  readonly storage: SnapshotStorage;
  /** The name of a fresh start (the composition root draws it): a reset starts a new lineage. */
  readonly lineage: string;
  /** Serialises writers across tabs (the browser's Web Locks); in-tab order only when omitted. */
  readonly lock?: <T>(work: () => T) => Promise<T>;
  /**
   * The build profile, when it is not a local development build (`prototype`): part of the
   * compatibility fingerprint, so saves of different profiles never open each other.
   */
  readonly variant?: string;
}

export interface SnapshotDriver extends PersistenceDriver {
  readonly kind: 'browser-snapshot';
  exclusive<T>(work: () => T): Promise<T>;
  /** How this page load started: from a save, afresh, or afresh after rejecting a save. */
  readonly opened: 'restored' | 'fresh' | 'rejected';
  readonly rejectedBecause: string | null;
  /**
   * The visitor's request tickets kept beside the save, for this lineage (owner decision, 24 Oct
   * 2026; ADR-0009 amendment): the browser session reads and keeps them here.
   */
  readonly tickets: TicketKeeper;
  /** Removes the save and the kept tickets (Reset); nothing is saved again by this page load. */
  clear(): void;
}

/**
 * Opens the snapshot for a page load: the stored world when it is readable and of this build — with
 * the tokens of the tickets this browser keeps for its visitor put back (`withKeptTokens`) — else
 * `start` (a rejected save is removed, and so are tickets kept in another lineage). The world given
 * back is the one the store starts from.
 */
export function openSnapshot(
  options: SnapshotOptions,
  start: World,
): { readonly driver: SnapshotDriver; readonly world: World } {
  const { storage } = options;
  const compatibility = compatibilityOf(start, options.variant);
  let stored: SnapshotRead;
  try {
    stored = decodeSnapshot(storage.getItem(SNAPSHOT_KEY), compatibility);
  } catch {
    stored = { status: 'rejected', reason: 'storage unavailable' };
  }
  if (stored.status === 'rejected') {
    try {
      storage.removeItem(SNAPSHOT_KEY);
    } catch {
      // Nothing to remove, or storage refuses: the clean world is saved over it, if it can be.
    }
  }
  const lineage = stored.status === 'found' ? stored.head.lineage : options.lineage;
  let closed = false;
  const tickets = keptTickets(storage, lineage, () => closed);
  // A clean start is a new lineage: tickets kept for the world it replaces open nothing any more.
  if (stored.status !== 'found') dropForeignTickets(storage, lineage);
  const restored =
    stored.status === 'found' ? withKeptTokens(stored.world, tickets.tickets()) : null;
  // A restored world is already what is stored (the kept tokens are withheld again on every save):
  // it is not written back on the way in, so a page load never overwrites a save (or a reset)
  // another tab made after it read.
  let lastSaved: World | null = restored;
  // Whether this browser holds this page load's world: a save that never happened (a full quota, a
  // storage that refuses writes) is not mistaken for a reset made in another tab.
  let persisted = stored.status === 'found';
  const run = <T>(work: () => T): Promise<T> =>
    options.lock ? options.lock(work) : Promise.resolve().then(work);
  const driver: SnapshotDriver = {
    kind: 'browser-snapshot',
    opened:
      stored.status === 'found' ? 'restored' : stored.status === 'rejected' ? 'rejected' : 'fresh',
    rejectedBecause: stored.status === 'rejected' ? stored.reason : null,
    tickets,
    load: () => lastSaved,
    save(world) {
      if (closed || world === lastSaved) return;
      lastSaved = world;
      try {
        storage.setItem(SNAPSHOT_KEY, encodeSnapshot(world, lineage, compatibility));
        persisted = true;
      } catch {
        // Quota or a storage that refuses: the world goes on in this tab's memory.
      }
    },
    exclusive: run,
    fresher(current) {
      if (closed) return null;
      let text: string | null;
      try {
        text = storage.getItem(SNAPSHOT_KEY);
      } catch {
        return null;
      }
      const head = headOf(text);
      if (!head) return persisted ? 'foreign' : null;
      if (head.lineage !== lineage) return 'foreign';
      if (head.worldVersion <= current.worldVersion) {
        // No newer world — but another tab of this browser may have kept a ticket since.
        const ticketed = withKeptTokens(current, tickets.tickets());
        return ticketed === current ? null : ticketed;
      }
      const read = decodeSnapshot(text, compatibility);
      if (read.status !== 'found') return 'foreign';
      lastSaved = withKeptTokens(adoptedWorld(read.world, current), tickets.tickets());
      return lastSaved;
    },
    clear() {
      closed = true;
      try {
        storage.removeItem(SNAPSHOT_KEY);
      } catch {
        // Storage refuses: nothing was kept.
      }
      tickets.forget();
    },
  };
  return { driver, world: restored ?? start };
}
