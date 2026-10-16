'use client';

/**
 * The Super Admin's All content and Content record (Phase 6; boards B7-06, B7-09, B7-10):
 * `ProductionService.listAllContent` (SA-12, with each published row's live version and the state
 * of its open correction where she may see it, PC-71) and `getContentRecord` (SA-13: the record,
 * who can act, its course, its open correction and — for a stuck record — the withdrawn reviewer
 * scopes over its course). The status override is `useCommand(ports =>
 * ports.production.overrideStatus)`: stuck, non-published records only; the service decides.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { SubmissionStatus } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

const DEPS = ['SUB', 'EXP', 'UPD', 'CRS', 'AREA', 'ROLE'] as const;

export type AllContentFilter = {
  readonly status: SubmissionStatus['state'] | 'stuck' | null;
  readonly search: string;
};

export const allContent = defineQuery({
  family: 'SUB',
  view: 'sa-all-content',
  deps: DEPS,
  read: (ports: ProductPorts, filter: AllContentFilter) =>
    ports.production.listAllContent({
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search.trim() ? { search: filter.search } : {}),
    }),
});

/** SA-12 (B7-06 f0, f7): every experiment and submission she may read, filtered on the service. */
export function useAllContent(
  filter: AllContentFilter = { status: null, search: '' },
  enabled = true,
) {
  return useXrQuery(allContent, filter, { enabled, keepPrevious: true });
}

export const contentRecord = defineQuery({
  family: 'SUB',
  view: 'sa-content-record',
  deps: DEPS,
  read: (ports: ProductPorts, ref: { readonly kind: 'SUB' | 'EXP'; readonly id: string }) =>
    ports.production.getContentRecord(ref as never),
});

/** SA-13 (B7-06 f1 … f6, f8): the record by its address's reference. */
export function useContentRecord(
  ref: { readonly kind: 'SUB' | 'EXP'; readonly id: string } | null,
  enabled = true,
) {
  return useXrQuery(contentRecord, ref ?? { kind: 'SUB', id: '' }, {
    enabled: enabled && ref !== null,
  });
}
