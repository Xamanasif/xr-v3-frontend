/**
 * The ports the API does not serve yet (ADR-0014): every method answers `unavailable` — the drawn
 * "failed, try again" state — and nothing else. Never the sample world in their place (ADR-0002
 * §5: no silent fallback). Built from the method ledger, so a port the ledger lists can never be
 * missing; each phase of `docs/BACKEND_PLAN.md` replaces one port here with its HTTP port.
 */
import { failure, ledgerRows, type PortKey, type ProductPorts } from '@xr/contracts/draft';

export function unavailablePort<K extends PortKey>(portKey: K): ProductPorts[K] {
  const methods = ledgerRows()
    .filter((row) => row.portKey === portKey)
    .map((row) => row.method);
  if (methods.length === 0) throw new Error(`The method ledger lists no methods for ${portKey}.`);
  return Object.fromEntries(
    methods.map((method) => [method, async () => failure({ kind: 'unavailable' })]),
  ) as unknown as ProductPorts[K];
}
