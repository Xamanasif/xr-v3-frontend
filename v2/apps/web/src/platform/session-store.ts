/**
 * The session of one browser tab, in memory (Appendix F §3.2, §4.6; Appendix D §2.3; ADR-0003;
 * ADR-0004 option A). It mirrors what `SessionService` answers — the person id, the session
 * nonce and the sign-in time; role, institution and banners are never stored here, they are read
 * from the world on every call. Nothing is written to `localStorage`, `sessionStorage` or a
 * cookie, nothing expires on its own (QT-13 open), and there is no account or role switcher: a
 * person changes only by signing out and signing in through the session port.
 *
 * Every identity change — sign-in, sign-out, a different person or a new session of the same
 * person — clears the whole query cache first and then publishes the new session key, so no
 * answer cached for one identity is ever shown to the next. The sample world is not touched.
 *
 * `subscribe` / `getSnapshot` / `getServerSnapshot` follow `useSyncExternalStore`.
 */
import type { QueryClient } from '@tanstack/react-query';
import type { SessionService } from '@xr/contracts/draft';
import type { IsoInstant, MockSession, PersonId } from '@xr/domain';

import { throwIfUnavailable } from '@/queries/unavailable';

export type SessionSnapshot =
  /** On the server and while the tab's platform boots: nobody is known yet. */
  | { readonly status: 'unknown' }
  | { readonly status: 'signed-out'; readonly sessionKey: string }
  | {
      readonly status: 'signed-in';
      readonly sessionKey: string;
      readonly personId: PersonId;
      readonly nonce: string;
      readonly signedInAt: IsoInstant;
      /** The session as `SessionService` answered it at sign-in (display only; never a permission). */
      readonly session: MockSession;
    };

export const UNKNOWN_SESSION: SessionSnapshot = Object.freeze({ status: 'unknown' });

export interface SessionStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): SessionSnapshot;
  getServerSnapshot(): SessionSnapshot;
  /** Reads `SessionService.getSession` and adopts it (the tab's boot). */
  refresh(): Promise<SessionSnapshot>;
  /**
   * The session port the app uses: `signIn` and `signOut` adopt their answer here, so every way
   * of calling them — `useCommand` included — keeps the store, and the cache, in step.
   */
  port(raw: SessionService): SessionService;
}

const SESSION_KEY = /^person:([^\s#]+)#([^\s#]+)$/;

function signedIn(session: MockSession): SessionSnapshot {
  const match = SESSION_KEY.exec(session.sessionKey);
  if (!match || match[1] !== session.personId) {
    throw new Error(
      `The session key "${session.sessionKey}" does not name ${session.personId} (person:<id>#<nonce>).`,
    );
  }
  return Object.freeze({
    status: 'signed-in',
    sessionKey: session.sessionKey,
    personId: session.personId,
    nonce: match[2]!,
    signedInAt: session.signedInAt,
    session,
  });
}

export function createSessionStore(options: {
  readonly session: SessionService;
  readonly queryClient: QueryClient;
  /** `public:<browser-session-id>` — this tab's visitor partition. */
  readonly publicSessionKey: string;
}): SessionStore {
  if (!/^public:[^\s#]+$/.test(options.publicSessionKey)) {
    throw new Error(`"${options.publicSessionKey}" is not a public session key.`);
  }
  const signedOut: SessionSnapshot = Object.freeze({
    status: 'signed-out',
    sessionKey: options.publicSessionKey,
  });
  const listeners = new Set<() => void>();
  let current: SessionSnapshot = UNKNOWN_SESSION;

  function adopt(next: SessionSnapshot): SessionSnapshot {
    const same =
      next.status === current.status &&
      (next.status === 'unknown' ||
        (current.status !== 'unknown' && next.sessionKey === current.sessionKey));
    if (same) return current;
    // Drop every answer and command state of the previous identity before anyone can render
    // with the next one.
    options.queryClient.clear();
    current = next;
    for (const listener of [...listeners]) listener();
    return current;
  }

  async function refresh(): Promise<SessionSnapshot> {
    const answer = throwIfUnavailable(await options.session.getSession());
    if (!answer.ok) throw new Error('getSession refused unexpectedly.');
    return adopt(answer.value ? signedIn(answer.value.session) : signedOut);
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => current,
    getServerSnapshot: () => UNKNOWN_SESSION,
    refresh,
    port(raw) {
      /**
       * After an accepted sign-in or sign-out, adopt the session the adapter now holds — never
       * the answer itself: a re-sent command id answers its first receipt without changing the
       * session (ADR-0008), so the answer can name a person who is no longer signed in. If that
       * read fails, the identity is unknown: the cache is cleared and queries wait.
       */
      const sync = async (): Promise<void> => {
        try {
          await refresh();
        } catch (error) {
          adopt(UNKNOWN_SESSION);
          throw error;
        }
      };
      return {
        signIn: async (input) => {
          const answer = await raw.signIn(input);
          if (answer.ok) await sync();
          return answer;
        },
        getSession: () => raw.getSession(),
        signOut: async () => {
          const answer = await raw.signOut();
          if (answer.ok) await sync();
          return answer;
        },
        checkWorkspace: (workspace) => raw.checkWorkspace(workspace),
      };
    },
  };
}
