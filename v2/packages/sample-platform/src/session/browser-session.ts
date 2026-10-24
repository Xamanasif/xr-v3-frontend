/**
 * Browser-session data that is board-drawn behaviour, not persistence (Appendix F §4.2; ADR-0004
 * §2): the public selection basket — "lives in the visitor's browser session until the request
 * is sent" (B1-06) — and the request-status tickets this browser session holds — PU-10 "continues
 * from this session" (B1-07). Kept in `sessionStorage` when the composition root supplies it, with
 * a memory fallback; never a world record. This module never writes `localStorage` itself: the
 * visitor's kept tickets below are the browser snapshot's (`TicketKeeper`).
 *
 * A ticket belongs to the world that issued it (Package 1C; ADR-0009). Under ADR-0004 option A a
 * reload builds a new world from the seed, whose deterministic ids would mint the same tokens again
 * — so a ticket kept from an earlier world has expired: it is dropped when the browser session
 * starts in another world, and can never open a request the new world creates. A ticket also
 * belongs to the user session that sent the request — the tab's signed-out visitor, or one
 * sign-in (`ticketHolder`): a person who signs in to the tab holds none of the visitor's tickets,
 * and signing out gives the visitor back its own; nothing one person sent opens for the next
 * (owner DV-5 / O-05: "the submitting browser session"). What is read back from storage is checked
 * entry by entry; anything malformed, or a withheld placeholder, is left out (storage is the
 * visitor's own, and a hand-edited value must not reach a rule).
 *
 * In a local prototype build that keeps the world in this browser (TE-6), the signed-out visitor's
 * own tickets are also kept beside the saved world, bound to its lineage (owner decision, 24 Oct
 * 2026; ADR-0009 amendment; `persistence/kept-tickets.ts`): a reload, navigating away, or closing
 * and reopening the tab comes back to the same request in this browser. The visitor holds those
 * tickets in every page load of the lineage; a sign-in never does, and a ticket sent during a
 * sign-in stays with the page load, as above.
 */
import {
  type AccessRequest,
  EMPTY_SELECTION,
  type ExperimentId,
  type IsoInstant,
  type RequestStatusToken,
  type Selection,
  type SelectionItem,
  TECHNOLOGIES,
  type Technology,
} from '@xr/domain';

import type { TicketKeeper } from '../persistence/kept-tickets.js';
import { isWithheldToken } from '../persistence/withheld.js';

/** The user session a ticket belongs to: the tab's signed-out visitor, or one sign-in. */
export type TicketHolder = 'visitor' | `sign-in:${string}`;

/**
 * Whose tickets a call may use: the signed-out visitor's, or — while a person is signed in — only
 * the ones sent in that sign-in (`nonce`: one per sign-in, never reused in a world).
 */
export function ticketHolder(session: { readonly nonce: string } | null): TicketHolder {
  return session ? `sign-in:${session.nonce}` : 'visitor';
}

/** The part of the Web Storage API this needs (the browser's `sessionStorage`). */
export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SELECTION_KEY = 'xr.selection.v1';
/** v2 (Package 1C): each ticket names the world it was issued in and the user session it is for. */
const TICKETS_KEY = 'xr.request-tickets.v2';

/** A ticket held: the token and the user session it belongs to. */
interface HeldTicket {
  readonly token: RequestStatusToken;
  readonly holder: TicketHolder;
}

/** A ticket as stored: the world that issued it, the token and its user session. */
interface StoredTicket extends HeldTicket {
  readonly world: string;
}

const bounded = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 200;

const isHolder = (value: unknown): value is TicketHolder =>
  bounded(value) && (value === 'visitor' || /^sign-in:\S+$/.test(value));

function storedTickets(value: unknown): StoredTicket[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    const ticket = entry as {
      readonly world?: unknown;
      readonly token?: unknown;
      readonly holder?: unknown;
    } | null;
    return ticket &&
      bounded(ticket.world) &&
      bounded(ticket.token) &&
      !isWithheldToken(ticket.token) &&
      isHolder(ticket.holder)
      ? [{ world: ticket.world, token: ticket.token as RequestStatusToken, holder: ticket.holder }]
      : [];
  });
}

const KNOWN_FORMATS: ReadonlySet<string> = new Set(TECHNOLOGIES);

function selectionItem(value: unknown): SelectionItem | null {
  const item = value as {
    readonly experimentId?: unknown;
    readonly formats?: unknown;
    readonly addedAt?: unknown;
  } | null;
  if (!item || !bounded(item.experimentId) || !bounded(item.addedAt)) return null;
  if (!Array.isArray(item.formats) || item.formats.length === 0) return null;
  if (
    !item.formats.every(
      (format: unknown) => typeof format === 'string' && KNOWN_FORMATS.has(format),
    )
  )
    return null;
  return {
    experimentId: item.experimentId as ExperimentId,
    formats: item.formats as Technology[],
    addedAt: item.addedAt as IsoInstant,
  };
}

/** A stored selection, entry by entry; one kept before Package 1C has no `lastRemovedAt`. */
function storedSelection(value: unknown): Selection | null {
  const stored = value as {
    readonly items?: unknown;
    readonly lastRemoved?: unknown;
    readonly lastRemovedAt?: unknown;
  } | null;
  if (!stored || !Array.isArray(stored.items)) return null;
  const items = stored.items.flatMap((entry: unknown) => {
    const item = selectionItem(entry);
    return item ? [item] : [];
  });
  const unique = items.filter(
    (item, index) => items.findIndex((other) => other.experimentId === item.experimentId) === index,
  );
  const lastRemoved = stored.lastRemoved === null ? null : selectionItem(stored.lastRemoved);
  const at = stored.lastRemovedAt;
  return {
    items: unique,
    lastRemoved,
    lastRemovedAt:
      lastRemoved && typeof at === 'number' && Number.isInteger(at) && at >= 0 ? at : null,
  };
}

export class BrowserSession {
  /** The query-cache partition of the public surface (`public:<browser-session-id>`). */
  readonly key: string;
  readonly #storage: SessionStorageLike | null;
  /** The world this browser session's tickets are good for (ADR-0009). */
  readonly #world: string;
  /** TE-6: the visitor's tickets kept beside the saved world (ADR-0009 amendment); else `null`. */
  readonly #kept: TicketKeeper | null;
  #selection: Selection;
  #tickets: readonly HeldTicket[];

  constructor(
    id: string,
    storage: SessionStorageLike | null,
    world: string,
    kept: TicketKeeper | null = null,
  ) {
    this.key = `public:${id}`;
    this.#storage = storage;
    this.#world = world;
    this.#kept = kept;
    this.#selection = storedSelection(this.#read(SELECTION_KEY)) ?? EMPTY_SELECTION;
    const stored = storedTickets(this.#read(TICKETS_KEY));
    this.#tickets = stored
      .filter((ticket) => ticket.world === world)
      .map(({ token, holder }) => ({ token, holder }));
    // Tickets of an earlier world have expired: they are not kept.
    if (stored.length !== this.#tickets.length) this.#writeTickets();
  }

  get selection(): Selection {
    return this.#selection;
  }

  set selection(next: Selection) {
    this.#selection = next;
    this.#write(SELECTION_KEY, next);
  }

  /**
   * The tickets of this world the browser session holds for one user session (`requestTokens`) —
   * for the signed-out visitor, with the ones this browser keeps for it (TE-6; ADR-0009 amendment).
   */
  ticketsOf(holder: TicketHolder): readonly RequestStatusToken[] {
    const held = this.#tickets
      .filter((ticket) => ticket.holder === holder)
      .map((ticket) => ticket.token);
    if (holder !== 'visitor' || !this.#kept) return held;
    const kept = this.#kept.tickets().map((ticket) => ticket.token);
    return [...held, ...kept.filter((token) => !held.includes(token))];
  }

  /**
   * A request was sent in this browser session, by this user session: it keeps the ticket. The
   * signed-out visitor's is also kept in this browser, for the request it was issued for (TE-6;
   * owner decision, 24 Oct 2026; ADR-0009 amendment); a sign-in's stays with this page load.
   */
  holdTicket(
    request: Pick<AccessRequest, 'id' | 'routeId' | 'createdAt' | 'statusToken'>,
    holder: TicketHolder,
  ): void {
    const token = request.statusToken;
    if (!this.#tickets.some((ticket) => ticket.token === token)) {
      this.#tickets = [...this.#tickets, { token, holder }];
      this.#writeTickets();
    }
    if (holder === 'visitor') {
      this.#kept?.keep({
        request: request.id,
        routeId: request.routeId,
        createdAt: request.createdAt,
        token,
      });
    }
  }

  /**
   * Reset (TE-6): the selection and every ticket of this browser session are forgotten — and the
   * tickets this browser keeps for its visitor.
   */
  forgetAll(): void {
    this.selection = EMPTY_SELECTION;
    this.#tickets = [];
    this.#writeTickets();
    this.#kept?.forget();
  }

  #writeTickets(): void {
    const stored: StoredTicket[] = this.#tickets.map((ticket) => ({
      world: this.#world,
      ...ticket,
    }));
    this.#write(TICKETS_KEY, stored);
  }

  #read(key: string): unknown {
    try {
      const text = this.#storage?.getItem(key) ?? null;
      return text === null ? null : (JSON.parse(text) as unknown);
    } catch {
      return null;
    }
  }

  /** Storage that throws (private mode, quota) leaves the value in memory for this tab. */
  #write(key: string, value: unknown): void {
    try {
      this.#storage?.setItem(key, JSON.stringify(value));
    } catch {
      // Memory fallback: the value above is already held for this tab.
    }
  }
}
