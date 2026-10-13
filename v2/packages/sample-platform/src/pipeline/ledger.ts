/**
 * The method ledger as the adapter's guard rail (ADR-0008 decision 1). Two things come from it:
 *
 *  - who may call a method at all: the workspaces of the screens that call it (`screens`; board
 *    06 workspaces, XS-06 "Not your workspace"). This only ever narrows access — record scope,
 *    state and ownership are still decided by `@xr/domain` policy on every call;
 *  - which errors a method may answer: a handler that produced an error kind, refusal code or
 *    open decision its ledger entry does not declare has drifted from the contract, which is a
 *    programming error and throws (the contract suite's conformance proxy checks the same).
 */
import { type LedgerRow, ledgerRows, type MethodId, type ServiceError } from '@xr/contracts/draft';
import type { Role } from '@xr/domain';

const ROWS = new Map<string, LedgerRow>(ledgerRows().map((row) => [row.id, row]));

export function rowOf(method: MethodId): LedgerRow {
  const row = ROWS.get(method);
  if (!row) throw new Error(`${method} is not a ledger method.`);
  return row;
}

const ALL_ROLES: readonly Role[] = [
  'student',
  'faculty',
  'tenant_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
];

/** Screen-id prefix → the workspace (role) it belongs to (`navigation.json`; board 06). */
const SCREEN_WORKSPACE: Readonly<Record<string, readonly Role[] | 'public'>> = {
  PU: 'public',
  XS: ALL_ROLES,
  ST: ['student'],
  FA: ['faculty'],
  IA: ['tenant_admin'],
  VE: ['vendor'],
  RV: ['academic_reviewer'],
  CM: ['content_manager'],
  SA: ['super_admin'],
};

export interface MethodAudience {
  /** The public surface calls it (no account; PU-* screens). */
  readonly publicSurface: boolean;
  /** The signed-in roles whose screens call it. */
  readonly roles: ReadonlySet<Role>;
}

const AUDIENCES = new Map<string, MethodAudience>();

export function audienceOf(method: MethodId): MethodAudience {
  const cached = AUDIENCES.get(method);
  if (cached) return cached;
  let publicSurface = false;
  const roles = new Set<Role>();
  for (const screen of rowOf(method).screens) {
    const workspace = SCREEN_WORKSPACE[screen.slice(0, 2)];
    if (workspace === undefined) throw new Error(`${method}: no workspace for screen ${screen}.`);
    if (workspace === 'public') publicSurface = true;
    else workspace.forEach((role) => roles.add(role));
  }
  const audience = { publicSurface, roles };
  AUDIENCES.set(method, audience);
  return audience;
}

/** Throws when a method answered an error its ledger entry does not declare. */
export function assertDeclared(method: MethodId, error: ServiceError): void {
  const row = rowOf(method);
  const fail = (what: string) => {
    throw new Error(`${method} answered ${what}, which its ledger entry does not declare.`);
  };
  if (!(row.errors as readonly string[]).includes(error.kind)) fail(`"${error.kind}"`);
  if (error.kind === 'refused' && !(row.refusals as readonly string[]).includes(error.code))
    fail(`refused "${error.code}"`);
  if (error.kind === 'policy-open' && !row.open.includes(error.decision))
    fail(`policy-open "${error.decision}"`);
}
