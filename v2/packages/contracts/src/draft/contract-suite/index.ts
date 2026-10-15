/**
 * `@xr/contracts/draft/contract-suite` — the framework-free contract suite (Appendix F §3.6, §7.4;
 * ADR-0008 consequences). Published on its own subpath, never re-exported from `./draft`, and
 * fenced out of product code, so it never reaches a client bundle. It imports no test framework,
 * no React, no Next.js, no HTTP server and no Node built-in.
 *
 * `runContractSuite(factory)` runs every case against the adapter the factory builds — the sample
 * world (`@xr/sample-platform`, WP-0.11) now, an HTTP adapter later — and returns a report. A case
 * the adapter cannot run yet (its fixture, a later-phase method, a seam) is reported "not run",
 * never "passed".
 */
import { CATALOGUE_CASES } from './cases/catalogue.js';
import { SESSION_CASES, SURFACE_CASES } from './cases/generic.js';
import { CROSS_ROLE_CASES } from './cases/cross-role.js';
import { FLOW_A_CASES } from './cases/flow-a.js';
import { REQUEST_ACCESS_CASES } from './cases/request-access.js';
import { FLOW_B_CASES } from './cases/flow-b.js';
import { FLOW_C_CASES } from './cases/flow-c.js';
import { FLOW_D_CASES } from './cases/flow-d.js';
import { FLOW_E_CASES } from './cases/flow-e.js';
import { FLOW_F_CASES } from './cases/flow-f.js';
import { INSTITUTION_CASES } from './cases/institutions.js';
import { INVARIANT_CASES } from './cases/invariants.js';
import { type ContractCase, type ContractSuiteReport, runCases } from './run.js';
import type { ContractFactory } from './subject.js';

/** A marker the bundle check looks for: this module must never reach a product build. */
export const CONTRACT_SUITE_MARKER = 'xr-contracts-draft-contract-suite';

/**
 * Every case, in order: surface, session, catalogue structure, flows, request access (Package 1C),
 * institutions (Package 1D), cross-cutting, invariants.
 */
export const CONTRACT_CASES: readonly ContractCase[] = [
  ...SURFACE_CASES,
  ...SESSION_CASES,
  ...CATALOGUE_CASES,
  ...FLOW_A_CASES,
  ...FLOW_B_CASES,
  ...FLOW_C_CASES,
  ...FLOW_D_CASES,
  ...FLOW_E_CASES,
  ...FLOW_F_CASES,
  ...REQUEST_ACCESS_CASES,
  ...INSTITUTION_CASES,
  ...CROSS_ROLE_CASES,
  ...INVARIANT_CASES,
];

export interface RunOptions {
  /** Runs only the cases this predicate keeps. */
  readonly only?: (contractCase: ContractCase) => boolean;
}

/** A report of the whole suite; it names the suite, so a bundle that runs it carries the marker. */
export interface SuiteRun extends ContractSuiteReport {
  readonly suite: typeof CONTRACT_SUITE_MARKER;
}

export async function runContractSuite(
  factory: ContractFactory,
  options: RunOptions = {},
): Promise<SuiteRun> {
  const cases = options.only ? CONTRACT_CASES.filter(options.only) : CONTRACT_CASES;
  return { suite: CONTRACT_SUITE_MARKER, ...(await runCases(factory, cases)) };
}

export { ContractViolation } from './assert.js';
export {
  type CallLog,
  checkError,
  checkValue,
  conformingPorts,
  writtenKeys,
} from './conformance.js';
export { DEFERRED_OBLIGATIONS, type Obligation } from './obligations.js';
export type {
  CaseContext,
  CaseGroup,
  CaseReport,
  CaseStatus,
  ContractCase,
  ContractSuiteReport,
} from './run.js';
export { DRAWN, SAMPLE, WALK } from './sample.js';
export {
  type CaseRequirement,
  type ContractFactory,
  type ContractFixture,
  type ContractInspection,
  type ContractSeams,
  type ContractSubject,
  SAMPLE_PEOPLE,
  type SamplePerson,
  type WorldSnapshot,
} from './subject.js';
