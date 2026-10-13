/**
 * Cases generated from the ledger, one per port:
 * - surface: every method of the port exists;
 * - session: without a signed-in person, every method that needs one answers `not-signed-in` and
 *   writes nothing (ADR-0008, X-2) — before any input is read (Appendix F §4.5 pipeline: the actor
 *   is resolved before validation), so a placeholder input is enough.
 */
import { ids } from '../../kernel/primitives.js';
import { ledgerRows, type LedgerRow } from '../../ledger/index.js';
import type { MethodId, PortName } from '../../ports/index.js';
import { PORT_NAMES } from '../../ports/index.js';
import { workspaceInput } from '../../ports/session.js';
import { check, errorOf } from '../assert.js';
import type { ContractCase } from '../run.js';

const ID_SCHEMAS = new Set<unknown>(Object.values(ids.in));

/** A placeholder argument: the session is checked before the input is read. */
function placeholderFor(row: LedgerRow): unknown {
  if (row.input === null) return undefined;
  if (ID_SCHEMAS.has(row.input)) return 'XX-0000';
  if (row.input === workspaceInput) return 'student';
  if (row.id === 'ProductionService.getContentRecord') return { kind: 'SUB', id: 'SUB-0000' };
  if (row.id === 'AccessRequestService.startPayment')
    return { by: 'institute-admin', requestId: 'REQ-0000', expectedRev: 1 };
  return {};
}

function rowsOf(port: PortName): readonly LedgerRow[] {
  return ledgerRows().filter((row) => row.port === port);
}

export const SURFACE_CASES: readonly ContractCase[] = PORT_NAMES.map((port) => ({
  id: `surface:${port}`,
  title: `${port} offers every ledger method`,
  group: 'surface' as const,
  evidence: 'Appendix C §3; ADR-0008 decision 1 (22 ports, 183 methods)',
  requires: { fixture: { kind: 'spine-start' as const }, methods: [] as MethodId[] },
  run: async (context) => {
    const rows = rowsOf(port);
    const ports = context.publicPorts as unknown as Record<
      string,
      Record<string, unknown> | undefined
    >;
    const missing = rows.filter((row) => typeof ports[row.portKey]?.[row.method] !== 'function');
    check(missing.length === 0, `${port} lacks ${missing.map((row) => row.method).join(', ')}`);
    context.note(`${rows.length} methods present`);
  },
}));

export const SESSION_CASES: readonly ContractCase[] = PORT_NAMES.filter((port) =>
  rowsOf(port).some((row) => row.errors.includes('not-signed-in')),
).map((port) => ({
  id: `session:${port}`,
  title: `${port}: without a session every signed-in method answers not-signed-in and writes nothing`,
  group: 'session' as const,
  evidence: 'ADR-0008 decision 2 (X-2: `not-signed-in` → sign-in with returnTo); Appendix F §4.5',
  requires: { fixture: { kind: 'spine-start' as const }, methods: [] as MethodId[] },
  run: async (context) => {
    const ports = context.publicPorts as unknown as Record<
      string,
      Record<string, (input?: unknown) => unknown>
    >;
    let called = 0;
    for (const row of rowsOf(port)) {
      if (!row.errors.includes('not-signed-in')) continue;
      if (!context.implements.includes(row.mock)) {
        context.note(`${row.method}: lands in ${row.mock}, not called`);
        continue;
      }
      const method = ports[row.portKey]?.[row.method];
      check(method, `${row.id} is missing`);
      const placeholder = placeholderFor(row);
      const answer = (await (placeholder === undefined
        ? method.call(ports[row.portKey])
        : method.call(ports[row.portKey], placeholder))) as Parameters<typeof errorOf>[0];
      errorOf(answer, 'not-signed-in', `${row.id} without a session`);
      called += 1;
    }
    context.note(`${called} methods answered not-signed-in`);
  },
}));
