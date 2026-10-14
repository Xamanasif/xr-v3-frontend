import type { RequestForDecision } from '@xr/contracts/draft';
import type { AccessRequest } from '@xr/domain';

/**
 * The request record as the Super Admin's decision page and every decision receipt carry it: all
 * of it but the requester's ticket, which never leaves the adapter (PC-34; ADR-0009). The world
 * keeps the ticket; only the browser session that sent the request holds a copy.
 */
export function forDecision(request: AccessRequest): RequestForDecision {
  const { statusToken: _ticket, ...view } = request;
  return view;
}
