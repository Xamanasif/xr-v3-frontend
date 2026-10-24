/**
 * The requester's own request tickets, kept in this browser beside the saved world (owner decision,
 * 24 Oct 2026; ADR-0009 amendment; audit CB-1 / F-01) — a local prototype build with the browser
 * snapshot (TE-6) only. A requester who reloads the status page, navigates away or closes the tab
 * comes back to the same request in this browser; another browser or device cannot (production
 * needs real accounts, T-01 / R01).
 *
 * - **Beside the snapshot, never inside it**: one `localStorage` value (`xr.request-tickets.kept`),
 *   next to `xr.sample-world`. The snapshot still withholds every status token (`sanitised`), and
 *   no ticket is ever part of an address.
 * - **Bound to the world lineage**: the value names the lineage it was kept in. A reset starts a new
 *   lineage, and a save the build rejects (damaged, another format, another build) starts a clean
 *   world in a new lineage: a ticket of another lineage opens nothing and is dropped.
 * - **Bound to one request**: each ticket names the very request it was issued for — its reference,
 *   its address and its creation, as `adoptedWorld` matches a tab's own request — with its token. A
 *   restored world gets the token back on exactly that request (`withKeptTokens`, snapshot.ts).
 * - **The signed-out visitor's only**: a request sent during a sign-in belongs to that sign-in,
 *   which ends with the page (sessions are never saved, ADR-0003, and a sign-in's name is not unique
 *   across page loads), so its ticket stays with the page load (`BrowserSession`).
 *
 * What is read back is checked entry by entry; anything malformed, a duplicate or a withheld
 * placeholder is left out (the storage is the visitor's own, and a hand-edited value must not reach
 * a rule). This package reads no browser API: the composition root injects the storage.
 */
import type { IsoInstant, RequestId, RequestRouteId, RequestStatusToken } from '@xr/domain';

import { isWithheldToken } from './withheld.js';

/** The `localStorage` key of the kept tickets, beside the snapshot's `xr.sample-world`. */
export const KEPT_TICKETS_KEY = 'xr.request-tickets.kept';
/** Bumped whenever the value's shape changes: an older value is then left out. */
const KEPT_TICKETS_FORMAT = 1;
/** A browser keeps a handful of requests at most; a longer list is not this build's. */
const MOST = 50;

/** The part of the Web Storage API the kept tickets need (the browser's `localStorage`). */
export interface KeptTicketStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** One request's ticket, kept for the signed-out visitor of this browser. */
export interface KeptTicket {
  readonly request: RequestId;
  readonly routeId: RequestRouteId;
  readonly createdAt: IsoInstant;
  readonly token: RequestStatusToken;
}

/** What a browser session reaches of the kept tickets (`BrowserSession`). */
export interface TicketKeeper {
  /** The tickets this browser keeps for the visitor, in this page load's lineage. */
  tickets(): readonly KeptTicket[];
  /** A visitor's request was sent in this browser: its ticket is kept, once per request. */
  keep(ticket: KeptTicket): void;
  /** Reset: every kept ticket of this browser is forgotten. */
  forget(): void;
}

const bounded = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 200;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

interface KeptValue {
  readonly lineage: string;
  readonly tickets: readonly KeptTicket[];
}

/** The stored value, checked: its lineage and its well-formed tickets (each request once). */
function readValue(text: string | null): KeptValue | null {
  if (text === null) return null;
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return null;
  }
  if (!isObject(value) || value.format !== KEPT_TICKETS_FORMAT) return null;
  if (!bounded(value.lineage) || !Array.isArray(value.tickets)) return null;
  const requests = new Set<string>();
  const tokens = new Set<string>();
  const tickets = value.tickets.flatMap((entry: unknown): KeptTicket[] => {
    if (!isObject(entry)) return [];
    const { request, routeId, createdAt, token } = entry;
    if (!bounded(request) || !bounded(routeId) || !bounded(createdAt) || !bounded(token)) return [];
    // A withheld placeholder is never a ticket; a request or a token named twice is foreign.
    if (isWithheldToken(token) || requests.has(request) || tokens.has(token)) return [];
    requests.add(request);
    tokens.add(token);
    return [
      {
        request: request as RequestId,
        routeId: routeId as RequestRouteId,
        createdAt: createdAt as IsoInstant,
        token: token as RequestStatusToken,
      },
    ];
  });
  return { lineage: value.lineage, tickets: tickets.slice(0, MOST) };
}

function readStored(storage: KeptTicketStorage): KeptValue | null {
  try {
    return readValue(storage.getItem(KEPT_TICKETS_KEY));
  } catch {
    return null;
  }
}

/**
 * The kept tickets of one page load's lineage. `closed` is the snapshot's: once the world is reset
 * in this page load, nothing more is kept and nothing kept is honoured.
 */
export function keptTickets(
  storage: KeptTicketStorage,
  lineage: string,
  closed: () => boolean,
): TicketKeeper {
  const mine = (): readonly KeptTicket[] => {
    if (closed()) return [];
    const stored = readStored(storage);
    return stored && stored.lineage === lineage ? stored.tickets : [];
  };
  return {
    tickets: mine,
    keep(ticket) {
      if (closed()) return;
      const held = mine();
      if (held.some((kept) => kept.request === ticket.request || kept.token === ticket.token)) {
        return;
      }
      // A value of another lineage is replaced: it belongs to a world that no longer exists.
      const next = { format: KEPT_TICKETS_FORMAT, lineage, tickets: [...held, ticket] };
      try {
        storage.setItem(KEPT_TICKETS_KEY, JSON.stringify(next));
      } catch {
        // Quota or a storage that refuses: the browser session still holds it for this page load.
      }
    },
    forget() {
      try {
        storage.removeItem(KEPT_TICKETS_KEY);
      } catch {
        // Storage refuses: nothing was kept.
      }
    },
  };
}

/**
 * A page load that starts a clean world (no save, or a save rejected): tickets kept in another
 * lineage name a world that no longer exists and are removed.
 */
export function dropForeignTickets(storage: KeptTicketStorage, lineage: string): void {
  try {
    const text = storage.getItem(KEPT_TICKETS_KEY);
    if (text === null) return;
    if (readValue(text)?.lineage !== lineage) storage.removeItem(KEPT_TICKETS_KEY);
  } catch {
    // Storage refuses: whatever is there names another lineage and opens nothing.
  }
}
