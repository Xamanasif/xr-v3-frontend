'use client';

/**
 * The figures the workspace sidebar counts (board 06 `countText`; `nav/nav-config.ts`
 * `countWords`), read through the ports — the boards' sample numbers are never product data. A
 * count shows only on a built destination (`nav/sidebar-model.ts`), and only the reads of the
 * signed-in person's own workspace run.
 *
 * Built so far: the Super Admin's Requests — "requests under review" (B1-10 caption "Nav count 3 =
 * requests under review"), the rows `AccessRequestService.listRequests` answers with that status
 * (also SA-01's Requests group, Package 1D). Other workspaces' counts arrive with their
 * destinations.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';
import { useMemo } from 'react';

import { defineQuery, useXrQuery } from './use-xr-query';

export const requestsUnderReview = defineQuery({
  family: 'nav-counts',
  view: 'super-admin-requests',
  deps: ['REQ'],
  read: (ports: ProductPorts) =>
    ports.accessRequests.listRequests({ status: 'under-review', sort: 'received-newest' }),
});

/**
 * The requests under review themselves, newest first: the Super Admin's Overview lists them in its
 * Requests group (SA-01, Package 1D) from the very read the sidebar counts, so the group's figure
 * and the sidebar's can never differ.
 */
export function useRequestsUnderReview() {
  return useXrQuery(requestsUnderReview, null);
}

/** Count figures by destination key (zero or absent: no count is drawn). */
export function useNavCounts(role: Role): Readonly<Partial<Record<string, number>>> {
  const requests = useXrQuery(requestsUnderReview, null, { enabled: role === 'super_admin' });
  const underReview =
    role === 'super_admin' && requests.data?.ok ? requests.data.value.length : undefined;
  return useMemo(() => (underReview === undefined ? {} : { requests: underReview }), [underReview]);
}
