/**
 * The WP-0.10 contract suite against the sample platform (WP-0.11 acceptance 1; Appendix F §7.4):
 * every case runs against the Phase-0 adapter, and every Phase-0 case passes. A case is never
 * weakened to pass — the suite's own assertions and conformance proxy decide.
 */
import {
  CONTRACT_CASES,
  DEFERRED_OBLIGATIONS,
  runContractSuite,
} from '@xr/contracts/draft/contract-suite';
import { describe, expect, it } from 'vitest';

import { contractFactory } from './testing/index.js';

describe('the contract suite against createSamplePlatform', () => {
  it('passes every case; none fails and none is left not run', async () => {
    const report = await runContractSuite(contractFactory);
    const notPassed = report.cases
      .filter((item) => item.status !== 'passed')
      .map((item) => `${item.status} ${item.id}: ${item.reason ?? ''}`);
    expect(notPassed).toEqual([]);
    expect(report.counts).toEqual({ passed: CONTRACT_CASES.length, failed: 0, 'not-run': 0 });
    // Every case the WP-0.9 / WP-0.10 obligations name now passes against a real world.
    const passed = new Set(
      report.cases.filter((item) => item.status === 'passed').map((item) => item.id),
    );
    for (const obligation of DEFERRED_OBLIGATIONS) {
      for (const id of obligation.cases)
        expect(passed.has(id), `${obligation.id}: ${id}`).toBe(true);
    }
  }, 120_000);
});
