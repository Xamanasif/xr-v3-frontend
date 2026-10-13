/**
 * The contract suite itself (Appendix F §3.6, §7.4; ADR-0008 consequences): framework-free and
 * reachable only through its own subpath; a case never passes against an adapter that cannot run
 * it; the conformance proxy catches every kind of drift; and the flow cases cover all 27
 * `flows.json` steps and the drawn alternates, with the world-dependent proofs held as WP-0.11
 * obligations.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { StudentAccessGrantId } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import {
  PACKAGE,
  SRC,
  flowSteps,
  importsOf,
  relativeToSrc,
  sourceFiles,
} from '../../test-support/sources.js';
import { WIRE_CONTRACTS } from '../../wire-contracts.js';
import * as draft from '../index.js';
import { fieldError, validationFailed } from '../errors/field-errors.js';
import { PHASE_SCHEDULE_EXCEPTIONS, ledgerRows } from '../ledger/index.js';
import type { ProductPorts } from '../ports/index.js';
import { STANDINS_MARKER } from '../standins/index.js';
import { ContractViolation } from './assert.js';
import { checkError, checkValue, conformingPorts, rowFor, writtenKeys } from './conformance.js';
import {
  CONTRACT_CASES,
  CONTRACT_SUITE_MARKER,
  DEFERRED_OBLIGATIONS,
  type ContractCase,
  type ContractSubject,
  runContractSuite,
} from './index.js';
import { runCases } from './run.js';

/** The runtime graph of relative imports from `entry` (type-only imports carry no code). */
function runtimeGraph(entry: string): ReadonlySet<string> {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const item of importsOf(readFileSync(file, 'utf8'))) {
      if (item.typeOnly || !item.specifier.startsWith('.')) continue;
      visit(resolve(dirname(file), item.specifier.replace(/\.js$/, '.ts')));
    }
  };
  visit(entry);
  return new Set([...seen].map(relativeToSrc));
}

describe('framework independence (Appendix F §3.6)', () => {
  const FORBIDDEN =
    /^(vitest|@vitest\/|@playwright\/|playwright|react|react-dom|next|@next\/|node:|http|https|fs|path|url|undici|express|msw|@testing-library\/|@xr\/testing|@xr\/sample-platform)/;

  it('imports no test runner, browser, React, Next.js, HTTP server or Node built-in anywhere in ./draft', () => {
    const findings = sourceFiles('draft').flatMap((file) =>
      importsOf(readFileSync(file, 'utf8'))
        .filter((item) => FORBIDDEN.test(item.specifier))
        .map((item) => `${relativeToSrc(file)} → ${item.specifier}`),
    );
    expect(findings).toEqual([]);
  });

  it('depends on nothing outside zod, @xr/domain, @xr/validation and this package', () => {
    const external = new Set(
      sourceFiles('draft').flatMap((file) =>
        importsOf(readFileSync(file, 'utf8'))
          .map((item) => item.specifier)
          .filter((specifier) => !specifier.startsWith('.')),
      ),
    );
    expect([...external].sort()).toEqual(['@xr/domain', '@xr/validation', 'zod']);
  });

  it('uses no global of a runtime (process, window, document, fetch)', () => {
    for (const file of sourceFiles('draft/contract-suite')) {
      expect(readFileSync(file, 'utf8'), relativeToSrc(file)).not.toMatch(
        /\b(process|window|document|globalThis|fetch)\b[.(]/,
      );
    }
  });
});

describe('import boundaries', () => {
  it('keeps the suite and the stand-ins out of ./draft and ./draft out of the root export', () => {
    const draft = runtimeGraph(join(SRC, 'draft', 'index.ts'));
    expect(
      [...draft].filter(
        (file) => file.startsWith('draft/contract-suite/') || file.startsWith('draft/standins/'),
      ),
    ).toEqual([]);
    const root = runtimeGraph(join(SRC, 'index.ts'));
    expect([...root].filter((file) => file.startsWith('draft/'))).toEqual([]);
  });

  it('publishes exactly four entry points', () => {
    const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.exports)).toEqual([
      '.',
      './draft',
      './draft/standins',
      './draft/contract-suite',
    ]);
    expect(Object.keys(manifest.dependencies).sort()).toEqual([
      '@xr/domain',
      '@xr/validation',
      'zod',
    ]);
  });

  it('leaves WIRE_CONTRACTS as committed: five schemas, none of them a draft port schema', () => {
    expect(WIRE_CONTRACTS.map((contract) => contract.name)).toEqual([
      'HealthQuery',
      'HealthResponse',
      'ProblemDetails',
      'RuntimeEventInput',
      'RuntimeEventBatch',
    ]);
    const draftSchemas = new Set<unknown>(Object.values(draft));
    for (const row of ledgerRows()) {
      draftSchemas.add(row.input);
      draftSchemas.add(row.output);
    }
    for (const contract of WIRE_CONTRACTS)
      expect(draftSchemas.has(contract.schema), contract.name).toBe(false);
  });

  it('carries the bundle markers that verify looks for', () => {
    expect(CONTRACT_SUITE_MARKER).toBe('xr-contracts-draft-contract-suite');
    expect(STANDINS_MARKER).toBe('xr-contracts-draft-standins');
    const verify = readFileSync(join(PACKAGE, '..', '..', 'scripts', 'verify.mjs'), 'utf8');
    expect(verify).toContain(`'${CONTRACT_SUITE_MARKER}'`);
    expect(verify).toContain(`'${STANDINS_MARKER}'`);
  });
});

describe('a case never passes falsely', () => {
  it('reports every case "not run" while no world exists (a null factory)', async () => {
    const report = await runContractSuite(() => null);
    expect(report.suite).toBe(CONTRACT_SUITE_MARKER);
    expect(report.counts).toEqual({ passed: 0, failed: 0, 'not-run': CONTRACT_CASES.length });
    expect(report.methodsExercised).toEqual([]);
    for (const item of report.cases)
      expect(item.reason).toMatch(/cannot build the fixture .* WP-0\.11/);
  });

  it('passes nothing against an adapter with no methods', async () => {
    const empty = {} as ProductPorts;
    const subject: ContractSubject = {
      implements: ['WP-0.11', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'],
      publicPorts: empty,
      as: () => empty,
      standins: {} as ContractSubject['standins'],
      seams: {},
      snapshot: () => ({}),
    };
    const report = await runContractSuite(() => subject);
    expect(report.counts.passed).toBe(0);
    expect(report.counts.failed).toBeGreaterThan(40);
    const notRun = report.cases.filter((item) => item.status === 'not-run');
    for (const item of notRun) expect(item.reason).toMatch(/test seam|world inspection/);
  });

  it('runs no case whose methods land in a later phase', async () => {
    const empty = {} as ProductPorts;
    const subject: ContractSubject = {
      implements: ['WP-0.11'],
      publicPorts: empty,
      as: () => empty,
      standins: {} as ContractSubject['standins'],
      seams: {},
      snapshot: () => ({}),
    };
    const later: ContractCase = {
      id: 'synthetic:later-phase',
      title: 'A case that calls a P5 method',
      group: 'flow',
      evidence: 'synthetic — the not-run rule of run.ts',
      requires: {
        fixture: { kind: 'spine-start' },
        methods: ['ProductionService.listMyExperiments'],
      },
      run: () => Promise.reject(new Error('a later-phase case must not run')),
    };
    const report = await runCases(() => subject, [later]);
    expect(report.cases[0]).toMatchObject({
      status: 'not-run',
      reason: expect.stringMatching(/ProductionService\.listMyExperiments \(P5\)/),
    });
    expect(report.counts.passed).toBe(0);
  });

  it('runs E-alt3 with the Phase-0 set: listAllContent is advanced by the recorded owner exception', () => {
    const altThree = CONTRACT_CASES.find((item) => item.id === 'flow:E-alt3-override')!;
    const phase = new Map(ledgerRows().map((row) => [row.id, row.mock]));
    expect(altThree.requires.methods.map((method) => phase.get(method))).toEqual([
      'WP-0.11',
      'WP-0.11',
      'WP-0.11',
    ]);
    expect(PHASE_SCHEDULE_EXCEPTIONS.map((exception) => exception.method)).toEqual([
      'ProductionService.listAllContent',
    ]);
  });

  it('reports a factory that throws as failed', async () => {
    const report = await runContractSuite(
      () => {
        throw new Error('no seed');
      },
      { only: (item) => item.id === 'surface:SessionService' },
    );
    expect(report.cases).toHaveLength(1);
    expect(report.cases[0]).toMatchObject({
      status: 'failed',
      reason: expect.stringMatching(/the factory failed/),
    });
  });
});

describe('the conformance proxy', () => {
  const withdraw = rowFor('studentAccess', 'withdrawGrant');
  const getGrant = rowFor('catalogue', 'getExperiment');

  it('accepts a declared error and rejects an undeclared kind, code or decision', () => {
    expect(() =>
      checkError(withdraw, { kind: 'refused', code: 'institution-paused' }),
    ).not.toThrow();
    expect(() => checkError(withdraw, { kind: 'conflict', code: 'duplicate' })).toThrow(
      ContractViolation,
    );
    expect(() => checkError(withdraw, { kind: 'refused', code: 'plan-ended' })).toThrow(
      /does not declare/,
    );
    expect(() => checkError(withdraw, { kind: 'policy-open', decision: 'OD-B9-99' })).toThrow(
      /does not name/,
    );
  });

  it('demands the drawn words and the drawn summary title of a validation failure', () => {
    const drawn = validationFailed([fieldError('reason', 'IA-04.reason.required')], null);
    expect(() => checkError(withdraw, drawn)).not.toThrow();
    const reworded = {
      ...drawn,
      fieldErrors: [{ ...drawn.fieldErrors[0]!, message: 'Reason required.' }],
    };
    expect(() => checkError(withdraw, reworded)).toThrow(/not the drawn words/);
    const titled = { ...drawn, summaryTitle: 'Check this step' };
    expect(() => checkError(withdraw, titled)).toThrow(/summary title/);
  });

  it('checks values against the output schema and `changed` as record references', () => {
    expect(() => checkValue(getGrant, { nope: true }, undefined)).toThrow(/output schema/);
    expect(() => checkValue(withdraw, {}, [{ kind: 'NOPE', id: 'x' }])).toThrow(ContractViolation);
  });

  it('diffs snapshots by record key', () => {
    expect(
      writtenKeys(
        { 'SACC:1': { a: 1 }, 'PER:2': {} },
        { 'SACC:1': { a: 2 }, 'PER:2': {}, 'GRP:3': {} },
      ),
    ).toEqual(['GRP:3', 'SACC:1']);
  });

  /** One port, one method, a world of one record. */
  function proxied(answer: (world: Record<string, unknown>) => unknown) {
    const world: Record<string, unknown> = { 'SACC:SACC-0310': { state: 'active' } };
    const ports = {
      studentAccess: { withdrawGrant: async () => answer(world) },
    } as unknown as ProductPorts;
    const log = { calls: [] as { method: string; outcome: string }[] };
    return { ports: conformingPorts(ports, () => structuredClone(world), log), log };
  }
  const input = {
    grantId: 'SACC-0310' as StudentAccessGrantId,
    reason: 'Left the course.',
    expectedRev: 1,
  };

  it('fails a refusal that writes', async () => {
    const { ports } = proxied((world) => {
      world['SACC:SACC-0310'] = { state: 'withdrawn' };
      return { ok: false, error: { kind: 'refused', code: 'institution-paused' } };
    });
    await expect(ports.studentAccess.withdrawGrant(input)).rejects.toThrow(
      /a refusal writes nothing/,
    );
  });

  it('fails a command whose `changed` is not what it wrote', async () => {
    const { ports } = proxied((world) => {
      world['SACC:SACC-0310'] = { state: 'withdrawn' };
      return { ok: false, error: { kind: 'unavailable' } };
    });
    await expect(ports.studentAccess.withdrawGrant(input)).rejects.toThrow(/writes nothing/);
  });

  it('fails an answer that is not a Result', async () => {
    const { ports } = proxied(() => ({ grant: 'SACC-0310' }));
    await expect(ports.studentAccess.withdrawGrant(input)).rejects.toThrow(
      /did not answer a Result/,
    );
  });

  it('logs a conforming answer', async () => {
    const { ports, log } = proxied(() => ({
      ok: false,
      error: { kind: 'stale-version', currentRev: 2 },
    }));
    await expect(ports.studentAccess.withdrawGrant(input)).resolves.toMatchObject({ ok: false });
    expect(log.calls).toEqual([
      { method: 'StudentAccessService.withdrawGrant', outcome: 'stale-version' },
    ]);
  });

  it('wraps every ledger method, and only those', () => {
    const wrapped = conformingPorts({} as ProductPorts, () => ({}), { calls: [] });
    expect(Object.keys(wrapped)).toHaveLength(22);
    expect(ledgerRows()).toHaveLength(183);
  });
});

describe('cases and obligations', () => {
  it('has unique case ids and documents every case', () => {
    expect(new Set(CONTRACT_CASES.map((item) => item.id)).size).toBe(CONTRACT_CASES.length);
    for (const item of CONTRACT_CASES) {
      expect(item.evidence.length, item.id).toBeGreaterThan(10);
      for (const method of item.requires.methods)
        expect(
          ledgerRows().some((row) => row.id === method),
          method,
        ).toBe(true);
    }
  });

  it('covers all 27 flows.json steps', () => {
    const steps = flowSteps().map((step) => `${step.flow}${step.step}`);
    expect(steps).toHaveLength(27);
    const covered = new Set<string>();
    for (const item of CONTRACT_CASES) {
      for (const match of item.evidence.matchAll(
        /flows\.json (A|B|C|D|E|F|Device )(\d)–(?:A|B|C|D|E|F)?(\d)/g,
      )) {
        const flow = match[1]!.trim();
        for (let step = Number(match[2]); step <= Number(match[3]); step += 1)
          covered.add(`${flow}${step}`);
      }
    }
    expect(steps.filter((step) => !covered.has(step))).toEqual([]);
  });

  it('covers the drawn alternates WP-0.11 must pass (Appendix F WP-0.11 acceptance 1)', () => {
    const evidence = CONTRACT_CASES.map((item) => item.evidence).join('\n');
    for (const alternate of ['E-alt1', 'E-alt2', 'E-alt3', 'F-alt', 'B5'])
      expect(evidence, alternate).toContain(alternate);
    const flowF = CONTRACT_CASES.find((item) => item.id === 'flow:F')!;
    expect(flowF.requires.methods).toEqual(
      expect.arrayContaining(['CorrectionService.holdUpdate', 'CorrectionService.liftHold']),
    );
  });

  it('holds the world-dependent proofs as WP-0.11 obligations, each naming real cases', () => {
    const ids = new Set(CONTRACT_CASES.map((item) => item.id));
    expect(DEFERRED_OBLIGATIONS.map((item) => item.id)).toEqual([
      'WP-0.9/5-after-flow-E',
      'WP-0.9/5-state-coverage',
      'WP-0.9/5-spine-start',
      'WP-0.9/12-provenance',
      'WP-0.10/flows',
      'WP-0.10/E-alt3-reach',
    ]);
    for (const obligation of DEFERRED_OBLIGATIONS) {
      expect(obligation.owner).toBe('WP-0.11');
      for (const id of obligation.cases) expect(ids.has(id), id).toBe(true);
    }
    const flows = CONTRACT_CASES.filter((item) => item.group === 'flow').map((item) => item.id);
    const held = DEFERRED_OBLIGATIONS.flatMap((item) => item.cases);
    expect(flows.filter((id) => !held.includes(id))).toEqual([]);
  });

  it('identifies sample people only through the harness seam, never a UI or URL', () => {
    for (const file of sourceFiles('draft/contract-suite')) {
      const text = readFileSync(file, 'utf8');
      expect(text, relativeToSrc(file)).not.toMatch(/signIn\(\s*\{[^}]*password/);
      expect(text, relativeToSrc(file)).not.toMatch(/\?as=|switchAccount|impersonat/i);
    }
  });
});
