'use client';

/**
 * Reads through the service ports, cached per session (Appendix F §4.6; Appendix D §1.5).
 * Each read is defined once with `defineQuery` — its key family and view, the record kinds it
 * depends on and the typed port method it calls — and used with `useXrQuery`. Screens never
 * build keys, call `useQuery` or reach the ports themselves (import fences, Appendix F §3.8).
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import type { ProductPorts } from '@xr/contracts/draft';
import type { RecordKind } from '@xr/domain';

import { usePlatform, useSession } from '@/platform/platform-provider';

import { checkedDeps, type QueryFamily, type QueryParams, QUERY_ROOT, xrQueryKey } from './keys';
import { ServiceUnavailableError, throwIfUnavailable } from './unavailable';

export interface XrQuery<P extends QueryParams, T> {
  readonly family: QueryFamily;
  readonly view: string;
  /** The record kinds the answer is read from (`meta.deps`). */
  readonly deps: readonly RecordKind[];
  /** The typed port read; its refusals are values, `unavailable` is thrown. */
  readonly read: (ports: ProductPorts, params: P) => Promise<T>;
}

/** Defines a read once; its dependency list is checked here. */
export function defineQuery<P extends QueryParams, T>(query: XrQuery<P, T>): XrQuery<P, T> {
  return Object.freeze({ ...query, deps: checkedDeps(query.deps) });
}

/** Thrown when the identity changed while a read was running: its answer belongs to no one now. */
export class SessionChangedError extends Error {
  override readonly name = 'SessionChangedError';
}

export interface XrQueryOptions {
  /** `false`: no request (a read the screen does not need for this person). Default `true`. */
  readonly enabled?: boolean;
  /**
   * While the answer for new params loads, keep showing the answer for the previous params of
   * the SAME identity (a list re-read for a new filter or order: B1-10 "Filter applies at once",
   * rows sorted in place). An answer of another identity is never kept.
   */
  readonly keepPrevious?: boolean;
}

/**
 * The previous answer while the next one loads — only when it was read for the same identity
 * (`queryKey[1]` is the session key). Typed `never` for TanStack's generic placeholder signature
 * (`NonFunctionGuard<T>`), which a generic `T` cannot satisfy; the function returns `T | undefined`.
 */
function keepSameIdentity<T>(sessionKey: string | null): never {
  const keep = (
    previous: T | undefined,
    previousQuery: { readonly queryKey: readonly unknown[] } | undefined,
  ): T | undefined =>
    previousQuery && sessionKey !== null && previousQuery.queryKey[1] === sessionKey
      ? previous
      : undefined;
  return keep as never;
}

/**
 * Runs a defined read for the tab's current session. Disabled (no request) until the platform
 * is ready and the session is known; the answer is the port's `Result`.
 */
export function useXrQuery<P extends QueryParams, T>(
  query: XrQuery<P, T>,
  params: P,
  options: XrQueryOptions = {},
): UseQueryResult<T, ServiceUnavailableError | SessionChangedError> {
  const runtime = usePlatform();
  const session = useSession();
  const sessionKey = session.status === 'unknown' ? null : session.sessionKey;
  return useQuery({
    ...(options.keepPrevious ? { placeholderData: keepSameIdentity<T>(sessionKey) } : {}),
    // Before the session is known the key holds no session; such entries are never fetched and
    // are dropped with the rest of the cache when the session is adopted.
    queryKey: sessionKey
      ? xrQueryKey(sessionKey, query.family, query.view, params)
      : [QUERY_ROOT, 'unknown', query.family, query.view, params],
    queryFn: async () => {
      if (!runtime || !sessionKey) throw new Error('The platform is not ready.');
      const current = () => runtime.session.getSnapshot();
      const keyOf = (snapshot: ReturnType<typeof current>) =>
        snapshot.status === 'unknown' ? null : snapshot.sessionKey;
      if (keyOf(current()) !== sessionKey) throw new SessionChangedError();
      const answer = throwIfUnavailable(await query.read(runtime.ports, params));
      // An answer read across a sign-in or sign-out is never cached under either identity.
      if (keyOf(current()) !== sessionKey) throw new SessionChangedError();
      return answer;
    },
    meta: { deps: query.deps },
    enabled: runtime !== null && sessionKey !== null && options.enabled !== false,
  });
}
