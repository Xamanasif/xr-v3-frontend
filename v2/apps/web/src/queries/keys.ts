/**
 * Query keys and dependency metadata (Appendix F §4.6; Appendix D §1.5).
 *
 * Every key is `['xr', sessionKey, family, view, params]`. `sessionKey` is the signed-in
 * person's `person:<id>#<nonce>` or the visitor's `public:<browser-session-id>`, so one
 * person's cached answers can never show for another. Every query declares `meta.deps`: the
 * record kinds its answer is read from. A command receipt invalidates exactly the queries whose
 * deps include a kind it changed (`invalidation.ts`) — there are no per-command lists.
 */
import type { Workspace } from '@xr/contracts/draft';
import { RECORD_KINDS, type RecordKind } from '@xr/domain';

export const QUERY_ROOT = 'xr';

/**
 * Position 3 of a key: a record kind for a record's own reads (`REQ`, `INST` …), or a read-model
 * family whose answer spans kinds — the session, a workspace's home or overview, nav counts.
 * Later phases add families by addition.
 */
export type QueryFamily = RecordKind | 'session' | 'nav-counts' | Workspace;

export type QueryParam = string | number | boolean | null;
/** Position 5: what selects the answer — an id, filters — as plain, serialisable data. */
export type QueryParams =
  | QueryParam
  | readonly QueryParam[]
  | { readonly [name: string]: QueryParam | readonly QueryParam[] };

export type XrQueryKey = readonly [typeof QUERY_ROOT, string, QueryFamily, string, QueryParams];

/** `person:<id>#<nonce>` (signed in) or `public:<browser-session-id>` (visitor). */
export const SESSION_KEY_PATTERN = /^(?:person:[^\s#]+#[^\s#]+|public:[^\s#]+)$/;

/** Builds a key; a session key in any other shape is a programming error. */
export function xrQueryKey(
  sessionKey: string,
  family: QueryFamily,
  view: string,
  params: QueryParams = null,
): XrQueryKey {
  if (!SESSION_KEY_PATTERN.test(sessionKey)) {
    throw new Error(`"${sessionKey}" is not a session key (person:<id>#<nonce> or public:<id>).`);
  }
  if (view.length === 0) throw new Error('A query key needs a view name.');
  return [QUERY_ROOT, sessionKey, family, view, params];
}

/** The metadata every query carries (typed for TanStack Query below). */
export interface XrQueryMeta extends Record<string, unknown> {
  /** The record kinds the answer is read from; a receipt changing any of them invalidates it. */
  readonly deps: readonly RecordKind[];
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: XrQueryMeta;
  }
}

const KNOWN_KINDS: ReadonlySet<string> = new Set(RECORD_KINDS);

/**
 * Checks a dependency list once, where the query is defined: at least one kind, each a real
 * record kind, none twice. A query with no deps would never refresh after a command.
 */
export function checkedDeps(deps: readonly RecordKind[]): readonly RecordKind[] {
  if (deps.length === 0) throw new Error('A query must declare the record kinds it reads.');
  const seen = new Set<string>();
  for (const kind of deps) {
    if (!KNOWN_KINDS.has(kind)) throw new Error(`"${kind}" is not a record kind.`);
    if (seen.has(kind)) throw new Error(`"${kind}" is declared twice.`);
    seen.add(kind);
  }
  return Object.freeze([...deps]);
}
