import type { LedgerEntry } from '../link-targets';
import { IA_PLAN_LINK_TARGETS } from '../link-targets-ia/plan';
import { IA_REQUESTS_LINK_TARGETS } from '../link-targets-ia/requests';

/** Phase 3 link targets: IA-17 Requests to BITS, its request detail, IA-18 Device requests and IA-19 Device request, with the IA-01 … IA-05 actions they enable (B3-08, B3-09). */
export const P3_INSTITUTE_REQUESTS_LINK_TARGETS: readonly LedgerEntry[] = [
  {
    screen: 'Shell',
    where: 'Sidebar destination (Institute Admin only)',
    action: 'Requests',
    role: 'secondary',
    on: '/institute/*',
    target: '/institute/requests',
    outcome: 'built',
    board: '06 (Institute Admin raw[]); B3-08 f0, B3-09 f0 (`aria-current="page"`)',
    note: 'IA-17 (Phase 3). Board 06’s count (“{n} device requests to forward”) is not drawn: it counts the Device requests tab while the item opens Requests to BITS — DEV-17 open.',
  },
  // IA-01's device-request row (B2-01 f7), drawn once IA-18 is built — the plan group's
  // `link-targets-ia/plan.ts`; the other IA-01 … IA-05 actions IA-17 enables are the Package-2A rows.
  ...IA_PLAN_LINK_TARGETS['IA-01 device requests'],
  // IA-17 … IA-19: the requests group's `link-targets-ia/requests.ts`, in the ledger's order.
  ...IA_REQUESTS_LINK_TARGETS['IA-17'],
  ...IA_REQUESTS_LINK_TARGETS['IA-18'],
  ...IA_REQUESTS_LINK_TARGETS['IA-17 request detail'],
  ...IA_REQUESTS_LINK_TARGETS['IA-19'],
];
