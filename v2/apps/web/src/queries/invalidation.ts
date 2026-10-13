/**
 * The one invalidation function (Appendix F §4.6; Appendix D §1.5; ADR-0002 §4). Every command
 * receipt carries `changed: RecordRef[]`; the queries whose `meta.deps` include one of the
 * changed kinds are invalidated, and no other. There are no hand-written per-command lists,
 * because those drift. This is what makes a decision in one role's screen what every other role
 * in the tab sees (BC14).
 */
import type { Query, QueryClient } from '@tanstack/react-query';
import type { RecordKind, RecordRef } from '@xr/domain';

/** The changed record kinds of a receipt, each once. */
export function changedKinds(changed: readonly RecordRef[]): ReadonlySet<RecordKind> {
  return new Set(changed.map((ref) => ref.kind));
}

/** Whether a cached query reads any of the kinds. A query without deps matches nothing. */
export function dependsOnAny(query: Query, kinds: ReadonlySet<RecordKind>): boolean {
  return query.meta?.deps?.some((kind) => kinds.has(kind)) ?? false;
}

/**
 * Invalidates exactly the queries that depend on what the receipt changed; active ones refetch
 * before the returned promise settles. A receipt that changed nothing invalidates nothing.
 */
export function invalidateChanged(
  queryClient: QueryClient,
  changed: readonly RecordRef[],
): Promise<void> {
  const kinds = changedKinds(changed);
  if (kinds.size === 0) return Promise.resolve();
  return queryClient.invalidateQueries({ predicate: (query) => dependsOnAny(query, kinds) });
}
