'use client';

/**
 * IA-17 Requests to BITS and its request detail (Phase 3; board B3-08), through
 * `AccessRequestService`: the institution's own requests (`listInstitutionRequests`) and one of
 * them as its requester reads it (`getInstitutionRequest`). Sending a renewal or more licences is a
 * command (`useCommand(ports => ports.accessRequests.submitRenewalRequest |
 * submitAdditionalLicencesRequest)`); the request is the same REQ record the Super Admin decides
 * (SA-02 / SA-03), so a decision in the same tab refreshes these reads (`changed: REQ`).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { RequestId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

const REQUEST_DEPS = ['REQ', 'INST', 'ACC', 'EXP', 'CRS'] as const;

export const institutionRequests = defineQuery({
  family: 'REQ',
  view: 'institution-requests',
  deps: REQUEST_DEPS,
  read: (ports: ProductPorts) => ports.accessRequests.listInstitutionRequests(),
});

export function useInstitutionRequests(enabled = true) {
  return useXrQuery(institutionRequests, null, { enabled });
}

export const institutionRequest = defineQuery({
  family: 'REQ',
  view: 'institution-request',
  deps: REQUEST_DEPS,
  // The address is untrusted text: existence and scope are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, requestId: string) =>
    ports.accessRequests.getInstitutionRequest(requestId as RequestId),
});

export function useInstitutionRequest(requestId: string, enabled = true) {
  return useXrQuery(institutionRequest, requestId, { enabled });
}
