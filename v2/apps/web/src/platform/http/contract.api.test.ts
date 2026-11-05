/**
 * The contract suite against the API, through the web's own HTTP adapter (B2 exit, ADR-0014;
 * Appendix F §7.4): the same cases that pass against the typed mock, over the wire to a running API
 * on the development seed. Run with `XR_CONTRACT_API_URL=http://localhost:4000 pnpm --filter
 * @xr/web test:contract-api`; skipped without it (the unit suite never needs a server).
 *
 * The HTTP subject, honestly limited to what the API serves today:
 *
 * - `delivered`: the catalogue's methods only (ADR-0013). Every case calling anything else is
 *   reported "not run" by the suite itself, never "passed".
 * - fixture: the spine-start seed only — the development seed is exported from that world. Any
 *   other fixture cannot be built over HTTP yet (`null` → "not run").
 * - `as`: a fresh visitor's ports. The API has no identity yet (B3), so no request carries one;
 *   "the answer never depends on who asks" holds by construction until B3 replaces this.
 * - `snapshot`: empty. The world lives in the API's database, out of this process's reach; that a
 *   read changes nothing is checked by the API's own database tests (`apps/api/test`).
 * - `standins` / `seams`: none. A case that reaches for one fails loudly rather than being faked.
 */
import { ledgerRows, type MethodId } from '@xr/contracts/draft';
import {
  CONTRACT_CASES,
  type ContractFactory,
  type ContractSubject,
  runContractSuite,
} from '@xr/contracts/draft/contract-suite';
import type { StandinPorts } from '@xr/contracts/draft/standins';
import { describe, expect, it } from 'vitest';

import { createHttpPlatform } from './index';

const apiUrl = process.env['XR_CONTRACT_API_URL'];

const CATALOGUE_METHODS = ledgerRows()
  .filter((row) => row.portKey === 'catalogue')
  .map((row) => row.id as MethodId);

const NO_STANDINS = new Proxy({} as StandinPorts, {
  get(_target, name) {
    throw new Error(`The API subject has no stand-in ${String(name)} (no stand-ins over HTTP).`);
  },
});

function httpFactory(baseUrl: string): ContractFactory {
  const visitor = () => createHttpPlatform({ baseUrl, browserStorage: null }).ports;
  return (fixture): ContractSubject | null =>
    fixture.kind !== 'spine-start'
      ? null
      : {
          implements: [],
          delivered: CATALOGUE_METHODS,
          publicPorts: visitor(),
          newVisitor: visitor,
          as: () => visitor(),
          standins: NO_STANDINS,
          seams: {},
          snapshot: () => ({}),
        };
}

describe.skipIf(!apiUrl)('the contract suite against the API (HTTP adapter)', () => {
  it('passes every case it can run; the catalogue cases run and pass', async () => {
    const report = await runContractSuite(httpFactory(apiUrl as string));
    const failed = report.cases
      .filter((item) => item.status === 'failed')
      .map((item) => `${item.id}: ${item.reason ?? ''}`);
    expect(failed).toEqual([]);

    const passed = report.cases.filter((item) => item.status === 'passed').map((item) => item.id);
    // The catalogue cases the seed can run: everything on spine-start that calls only the catalogue.
    expect(passed).toEqual(expect.arrayContaining(['catalogue:structure', 'catalogue:featured']));
    // Nothing outside the catalogue ran: every case that passed calls catalogue methods only.
    for (const id of passed) {
      const contractCase = CONTRACT_CASES.find((item) => item.id === id);
      expect(
        contractCase?.requires.methods.every((method) => CATALOGUE_METHODS.includes(method)),
        id,
      ).toBe(true);
    }
    console.info(
      `contract suite over HTTP: ${report.counts.passed} passed, ${report.counts['not-run']} not run (${passed.join(', ')})`,
    );
  }, 120_000);
});

if (!apiUrl) {
  it('is skipped: XR_CONTRACT_API_URL is not set', () => {
    expect(apiUrl).toBeUndefined();
  });
}
