/**
 * Runs contract cases against an adapter. A case runs only when the adapter can build its fixture,
 * implements every method it calls (ledger `mock` phase) and offers the seams it needs; otherwise
 * it is reported "not run" with the reason — never "passed". Each case gets a fresh subject, and
 * every call it makes is checked by the conformance proxy.
 */
import type { MethodId, ProductPorts } from '../ports/index.js';
import { ledgerRows } from '../ledger/index.js';
import type { ImplementationPhase } from '../ledger/entry.js';
import { ContractViolation } from './assert.js';
import { type CallLog, conformingPorts } from './conformance.js';
import type {
  CaseRequirement,
  ContractFactory,
  ContractFixture,
  ContractSeams,
  ContractSubject,
  SamplePerson,
} from './subject.js';
import type { StandinPorts } from './../standins/index.js';

/** What a case body receives: the ports wrapped by the conformance proxy. */
export interface CaseContext {
  /** The ledger phases the adapter implements. */
  readonly implements: readonly ImplementationPhase[];
  /** Later-phase methods it implements ahead of their phase (ledger `PACKAGE_DELIVERIES`). */
  readonly delivered: readonly MethodId[];
  readonly publicPorts: ProductPorts;
  readonly as: (person: SamplePerson) => ProductPorts;
  readonly standins: StandinPorts;
  readonly seams: ContractSeams;
  readonly snapshot: ContractSubject['snapshot'];
  readonly inspect: ContractSubject['inspect'];
  /** Adds a line to the case's report. */
  readonly note: (line: string) => void;
}

export type CaseGroup = 'surface' | 'session' | 'catalogue' | 'flow' | 'invariant';

export interface ContractCase {
  readonly id: string;
  readonly title: string;
  readonly group: CaseGroup;
  /** The documents the case encodes (flows.json step, board, appendix). */
  readonly evidence: string;
  readonly requires: CaseRequirement;
  readonly run: (context: CaseContext) => Promise<void>;
}

export type CaseStatus = 'passed' | 'failed' | 'not-run';

export interface CaseReport {
  readonly id: string;
  readonly title: string;
  readonly group: CaseGroup;
  readonly status: CaseStatus;
  /** Why it failed, or why it did not run. */
  readonly reason: string | null;
  readonly notes: readonly string[];
  readonly calls: CallLog['calls'];
}

export interface ContractSuiteReport {
  readonly cases: readonly CaseReport[];
  readonly counts: Readonly<Record<CaseStatus, number>>;
  /** Ledger methods called by passing cases. */
  readonly methodsExercised: readonly string[];
}

const PHASE_OF = new Map<string, ImplementationPhase>(
  ledgerRows().map((row) => [row.id, row.mock]),
);

export function describeFixture(fixture: ContractFixture): string {
  return fixture.kind === 'after-flow' ? `after-flow ${fixture.flow}` : fixture.kind;
}

function notRunReason(requirement: CaseRequirement, subject: ContractSubject): string | null {
  const missing = requirement.methods.filter((method: MethodId) => {
    const phase = PHASE_OF.get(method);
    if (subject.delivered?.includes(method)) return false;
    return phase === undefined || !subject.implements.includes(phase);
  });
  if (missing.length > 0) {
    return `calls methods this adapter does not implement yet: ${missing
      .map((method) => `${method} (${PHASE_OF.get(method) ?? 'not in the ledger'})`)
      .join(', ')}`;
  }
  const seams = (requirement.seams ?? []).filter((seam) => !subject.seams[seam]);
  if (seams.length > 0) return `needs the test seam(s) ${seams.join(', ')} (ADR-0007)`;
  if (requirement.inspection && !subject.inspect)
    return 'needs world inspection (sample provenance)';
  return null;
}

async function runCase(contractCase: ContractCase, factory: ContractFactory): Promise<CaseReport> {
  const base = { id: contractCase.id, title: contractCase.title, group: contractCase.group };
  const notes: string[] = [];
  const log: CallLog = { calls: [] };
  let subject: ContractSubject | null;
  try {
    subject = await factory(contractCase.requires.fixture);
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      reason: `the factory failed: ${String(error)}`,
      notes,
      calls: [],
    };
  }
  if (subject === null) {
    return {
      ...base,
      status: 'not-run',
      reason: `the adapter cannot build the fixture "${describeFixture(contractCase.requires.fixture)}" yet (the sample world is WP-0.11)`,
      notes,
      calls: [],
    };
  }
  const reason = notRunReason(contractCase.requires, subject);
  if (reason) return { ...base, status: 'not-run', reason, notes, calls: [] };
  const live = subject;
  const context: CaseContext = {
    implements: live.implements,
    delivered: live.delivered ?? [],
    publicPorts: conformingPorts(live.publicPorts, live.snapshot, log),
    as: (person) => conformingPorts(live.as(person), live.snapshot, log),
    standins: live.standins,
    seams: live.seams,
    snapshot: live.snapshot,
    inspect: live.inspect,
    note: (line) => notes.push(line),
  };
  try {
    await contractCase.run(context);
    return { ...base, status: 'passed', reason: null, notes, calls: log.calls };
  } catch (error) {
    const message =
      error instanceof ContractViolation ? error.message : `unexpected: ${String(error)}`;
    return { ...base, status: 'failed', reason: message, notes, calls: log.calls };
  }
}

/**
 * Runs `cases` (all of them by default) against the adapter the factory builds and reports each
 * one. Framework-free: the caller decides how to assert on the report.
 */
export async function runCases(
  factory: ContractFactory,
  cases: readonly ContractCase[],
): Promise<ContractSuiteReport> {
  const reports: CaseReport[] = [];
  for (const contractCase of cases) reports.push(await runCase(contractCase, factory));
  const counts = { passed: 0, failed: 0, 'not-run': 0 };
  for (const report of reports) counts[report.status] += 1;
  const methodsExercised = [
    ...new Set(
      reports
        .filter((report) => report.status === 'passed')
        .flatMap((report) => report.calls.map((call) => call.method)),
    ),
  ].sort();
  return { cases: reports, counts, methodsExercised };
}
