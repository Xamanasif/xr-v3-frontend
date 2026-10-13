/**
 * Browser-session data that is board-drawn behaviour, not persistence (Appendix F §4.2; ADR-0004
 * §2): the public selection basket — "lives in the visitor's browser session until the request
 * is sent" (B1-06) — and the request-status tickets this browser session holds — PU-10 "continues
 * from this session" (B1-07). Kept in `sessionStorage` when the composition root supplies it, with
 * a memory fallback; never a world record, never `localStorage`. Under option A a reload resets
 * the world, so a ticket held across a reload no longer resolves (PU-10 then reads not-found).
 */
import { EMPTY_SELECTION, type RequestStatusToken, type Selection } from '@xr/domain';

/** The part of the Web Storage API this needs (the browser's `sessionStorage`). */
export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SELECTION_KEY = 'xr.selection.v1';
const TICKETS_KEY = 'xr.request-tickets.v1';

export class BrowserSession {
  /** The query-cache partition of the public surface (`public:<browser-session-id>`). */
  readonly key: string;
  readonly #storage: SessionStorageLike | null;
  #selection: Selection;
  #tickets: readonly RequestStatusToken[];

  constructor(id: string, storage: SessionStorageLike | null) {
    this.key = `public:${id}`;
    this.#storage = storage;
    this.#selection = this.#read<Selection>(SELECTION_KEY) ?? EMPTY_SELECTION;
    this.#tickets = this.#read<RequestStatusToken[]>(TICKETS_KEY) ?? [];
  }

  get selection(): Selection {
    return this.#selection;
  }

  set selection(next: Selection) {
    this.#selection = next;
    this.#write(SELECTION_KEY, next);
  }

  get tickets(): readonly RequestStatusToken[] {
    return this.#tickets;
  }

  holdTicket(token: RequestStatusToken): void {
    if (this.#tickets.includes(token)) return;
    this.#tickets = [...this.#tickets, token];
    this.#write(TICKETS_KEY, this.#tickets);
  }

  #read<T>(key: string): T | null {
    try {
      const text = this.#storage?.getItem(key) ?? null;
      return text === null ? null : (JSON.parse(text) as T);
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
