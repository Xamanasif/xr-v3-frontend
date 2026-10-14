'use client';

/**
 * Institutional access requests for the Super Admin (SA-02 Requests, SA-03 Request decision;
 * boards B1-10, B1-11), through `AccessRequestService`. The port resolves who is asking from the
 * session: only the Super Admin may list and decide requests, and every decision — what is
 * allowed, what it changes, what is refused — is the adapter's (`@xr/domain` through
 * `@xr/sample-platform`). The screens pass filters and inputs and render the answers.
 *
 * The decisions are commands: `useCommand(ports => ports.accessRequests.approveRequest)` (also
 * `approveSmallerScope`, `requestMoreInformation`); their receipts (`changed: REQ, INST, ACC`)
 * refresh these reads and the sidebar's count.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { InstitutionKind, RequestId, RequestStatus, RequestType } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** The order of the Received column (B1-10: "newest / oldest first"). */
export type RequestOrder = 'received-newest' | 'received-oldest';

/** SA-02's filters, as the list asks the port for them (no Declined filter, T-02). */
export interface RequestFilter {
  readonly status: RequestStatus | null;
  readonly type: RequestType | null;
  /** "Internal or external": a kind, or "Not set yet" for a new institution's request. */
  readonly route: InstitutionKind | 'not-set' | null;
  /** Reference, institution or contact (B1-10 search placeholder). */
  readonly search: string;
  readonly order: RequestOrder;
}

type FilterParams = {
  readonly [Name in keyof RequestFilter]: RequestFilter[Name];
};

/** `listRequests`: the requests that match, in the order asked for (B1-10). */
export const requestRows = defineQuery({
  family: 'REQ',
  view: 'super-admin-list',
  deps: ['REQ'],
  read: (ports: ProductPorts, filter: FilterParams) =>
    ports.accessRequests.listRequests({
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.route ? { route: filter.route } : {}),
      ...(filter.search.trim() ? { search: filter.search } : {}),
      sort: filter.order,
    }),
});

/** The list's rows for these filters; the previous rows stay on show while new ones load. */
export function useRequestRows(filter: RequestFilter) {
  return useXrQuery(requestRows, { ...filter }, { keepPrevious: true });
}

/** Every request the Super Admin can see (B1-10 "7 requests"; "2 of 7 requests" when filtered). */
export function useAllRequests() {
  return useXrQuery(requestRows, {
    status: null,
    type: null,
    route: null,
    search: '',
    order: 'received-newest',
  });
}

/**
 * `getRequestForDecision`: the request, the formats published now, the institution's existing
 * access and where the request stands (SA-03). Opening the page writes nothing — review start
 * stays a seeded or test-only fact (AD-14 / P1-04).
 */
export const requestForDecision = defineQuery({
  family: 'REQ',
  view: 'decision',
  deps: ['REQ', 'INST', 'ACC', 'EXP'],
  // The address is untrusted text: existence and format are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, requestId: string) =>
    ports.accessRequests.getRequestForDecision(requestId as RequestId),
});

export function useRequestForDecision(requestId: string) {
  return useXrQuery(requestForDecision, requestId);
}
