/**
 * Repository checks of `pnpm verify` (Appendix F §7.6–§7.7, WP-0.4). They read files outside
 * this package — the frozen handoff, the audit evidence, every product package — so they run
 * UNCACHED (`pnpm --filter @xr/config test:scans`), never as a Turbo-cached test.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ESLint } from 'eslint';
import ts from 'typescript';
import { afterAll, describe, expect, it } from 'vitest';

import { DOMAIN_VOCABULARY, RECORDED_FENCE_EXCEPTIONS } from '../../eslint/fences.mjs';
import {
  deniedInLockfile,
  deniedInManifest,
  deniedKit,
  lockfilePackageCount,
  reachablePackages,
} from './dependencies.js';
import { RECORDED_SCAN_EXCEPTIONS } from './exceptions.js';
import { extractScript } from './extract.js';
import { verifyChecksums } from './integrity.js';
import {
  PRODUCT_SCAN_RULE_IDS,
  TEST_SEAM_DESIGNATED_LOCATIONS,
  scanIdentityAddresses,
  scanProductFile,
  type Finding,
} from './rules.js';
import {
  productTargets,
  repositoryRoot,
  toWorkspacePath,
  walk,
  workspaceRoot,
} from './workspace.js';

const summary: string[] = [];
afterAll(() => {
  console.info(`\nRepository checks (WP-0.4)\n${summary.map((line) => `  ${line}`).join('\n')}\n`);
});

function gitStatus(path: string): string {
  return execFileSync(
    'git',
    ['-C', repositoryRoot, 'status', '--porcelain', '--untracked-files=all', '--', path],
    {
      encoding: 'utf8',
    },
  );
}

describe('frozen design handoff v46 and audit evidence (uncached integrity)', () => {
  it('design/handoff-v46: 178/178 checksums, and git sees no change or new file', () => {
    const result = verifyChecksums(join(repositoryRoot, 'design', 'handoff-v46'));
    summary.push(
      `frozen handoff: ${result.ok}/${result.checked} OK, ${result.failed.length} failed, ${result.missing.length} missing`,
    );
    expect(result).toEqual({ checked: 178, ok: 178, failed: [], missing: [] });
    expect(gitStatus('design/handoff-v46')).toBe('');
  });

  it('v2/docs/v46: every audit-evidence checksum, the pinned permission matrix, and no change', () => {
    const directory = join(workspaceRoot, 'docs', 'v46');
    const result = verifyChecksums(directory);
    summary.push(
      `audit evidence: ${result.ok}/${result.checked} OK, ${result.failed.length} failed, ${result.missing.length} missing`,
    );
    expect(result).toEqual({ checked: 36, ok: 36, failed: [], missing: [] });
    const matrix = createHash('sha256')
      .update(readFileSync(join(directory, 'permission-matrix.json')))
      .digest('hex');
    expect(matrix).toBe('34826fec5420440afb55223fd22c363c29a4e1f58408761796bf0a9e20f3b3fa');
    expect(gitStatus('v2/docs/v46')).toBe('');
  });
});

describe('static scans of product code (Appendix F §7.6)', () => {
  const { targets, missingRoots } = productTargets();
  const findings: Finding[] = targets.flatMap(scanProductFile);
  const isExcepted = (finding: Finding) =>
    RECORDED_SCAN_EXCEPTIONS.some(
      (exception) =>
        exception.rule === finding.rule &&
        exception.file === finding.file &&
        finding.found.includes(exception.found),
    );

  it('scans every product file that exists, and says which product roots do not exist yet', () => {
    expect(targets.length).toBeGreaterThan(0);
    const counts = new Map<string, number>();
    for (const target of targets) {
      const root = target.file.split('/').slice(0, 3).join('/');
      counts.set(root, (counts.get(root) ?? 0) + 1);
    }
    summary.push(
      `product files scanned: ${targets.length} (${[...counts].map(([root, count]) => `${root} ${count}`).join(', ')})`,
    );
    summary.push(
      `product roots not present yet (scanned once they exist): ${missingRoots.join(', ') || 'none'}`,
    );
    summary.push(`scan rules: ${PRODUCT_SCAN_RULE_IDS.length}`);
    summary.push(
      `test-seam names, designated locations only: ${Object.entries(TEST_SEAM_DESIGNATED_LOCATIONS)
        .map(([rule, files]) => `${rule} → ${(files as string[]).join(', ')}`)
        .join('; ')}`,
    );
  });

  it('finds nothing outside the recorded exceptions', () => {
    const unexpected = findings.filter((finding) => !isExcepted(finding));
    const excepted = findings.filter(isExcepted);
    summary.push(
      `scan findings: ${unexpected.length} unexpected, ${excepted.length} under recorded exceptions`,
    );
    expect(
      unexpected.map(
        (finding) =>
          `${finding.rule} ${finding.file}:${finding.line} "${finding.found}" — ${finding.evidence}`,
      ),
    ).toEqual([]);
  });

  it('keeps no stale exception: every recorded exception still matches a finding', () => {
    for (const exception of RECORDED_SCAN_EXCEPTIONS) {
      expect(
        findings.some(
          (finding) =>
            finding.rule === exception.rule &&
            finding.file === exception.file &&
            finding.found.includes(exception.found),
        ),
        `${exception.rule} ${exception.file} is no longer needed (${exception.removal})`,
      ).toBe(true);
    }
    summary.push(
      `recorded scan exceptions: ${RECORDED_SCAN_EXCEPTIONS.map((exception) => `${exception.rule} @ ${exception.file} (until ${exception.removal})`).join('; ')}`,
    );
  });

  it('chooses no identity through an address in product code or test support', () => {
    const files = [
      ...walk(join(workspaceRoot, 'apps', 'web', 'e2e')),
      ...walk(join(workspaceRoot, 'apps', 'specimens', 'e2e')),
      ...walk(join(workspaceRoot, 'packages', 'testing', 'src')),
      ...walk(join(workspaceRoot, 'packages', 'testing', 'e2e')),
    ].filter((file) => /\.tsx?$/.test(file));
    const identity = files.flatMap((file) =>
      scanIdentityAddresses(toWorkspacePath(file), readFileSync(file, 'utf8')),
    );
    summary.push(
      `test-support files checked for identity in addresses: ${files.length}, findings ${identity.length}`,
    );
    expect(identity).toEqual([]);
  });
});

/** Where the product's UI dependencies come from (Appendix F §7.6: apps/web and @xr/ui). */
const PRODUCT_GRAPH_ROOTS = ['apps/web', 'packages/ui', 'apps/specimens'];

describe('dependency deny-list (owner constraint; ADR-0001 §5)', () => {
  it('no workspace manifest declares a UI kit, design system, headless kit or icon font', () => {
    const manifests = [
      join(workspaceRoot, 'package.json'),
      ...['apps', 'packages'].flatMap((group) =>
        walk(join(workspaceRoot, group)).filter((file) =>
          /^[^/]+\/[^/]+\/package\.json$/.test(toWorkspacePath(file)),
        ),
      ),
    ];
    const findings = manifests.flatMap((file) =>
      deniedInManifest(
        toWorkspacePath(file),
        JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>,
      ),
    );
    summary.push(
      `deny-list: ${manifests.length} manifests, ${findings.length} denied dependencies`,
    );
    expect(manifests.length).toBeGreaterThanOrEqual(10);
    expect(findings).toEqual([]);
  });

  it('nothing in the resolved graph of apps/web, @xr/ui or the specimen harness is a denied kit', () => {
    const lockfile = readFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), 'utf8');
    const product = reachablePackages(lockfile, PRODUCT_GRAPH_ROOTS);
    const denied = [...product].filter((name) => deniedKit(name) !== null);
    summary.push(
      `deny-list: product graph (${PRODUCT_GRAPH_ROOTS.join(', ')}) ${product.size} packages, ${denied.length} denied`,
    );
    expect(product.size).toBeGreaterThan(100);
    expect(product).toContain('next');
    expect(denied).toEqual([]);
  });

  it('records, outside the product graph, only the known Prisma Studio tooling', () => {
    const lockfile = readFileSync(join(workspaceRoot, 'pnpm-lock.yaml'), 'utf8');
    const outside = deniedInLockfile(lockfile).map((finding) => finding.dependency);
    const radixViaPrismaStudio = reachablePackages(lockfile, ['packages/database']);
    // @radix-ui/* reaches the lockfile only through prisma → @prisma/studio-core (the
    // database tooling of @xr/database, unchanged since 1b090c9); it is not in the product graph.
    for (const name of outside) {
      expect(radixViaPrismaStudio, name).toContain(name);
      expect(name, name).toMatch(/^@radix-ui\//);
    }
    summary.push(
      `deny-list: lockfile ${lockfilePackageCount(lockfile)} entries; outside the product graph: ${outside.length} (${outside.length ? 'Radix primitives of Prisma Studio, @xr/database tooling only' : 'none'})`,
    );
  });
});

describe('import fences are wired into the real ESLint configs (Appendix F §3.8)', () => {
  async function xrRules(packageDir: string, file: string, code: string): Promise<string[]> {
    const eslint = new ESLint({ cwd: join(workspaceRoot, packageDir) });
    const [result] = await eslint.lintText(code, {
      filePath: join(workspaceRoot, packageDir, file),
    });
    return [
      ...new Set(
        (result?.messages ?? [])
          .map((message) => message.ruleId ?? '')
          .filter((id) => id.startsWith('xr/')),
      ),
    ].sort();
  }

  it.each([
    [
      'src/features/shared/xs-07-help/view.tsx',
      "import { compose } from '@/platform/composition';\nexport const a = compose;",
      ['xr/import-fence'],
    ],
    [
      'src/features/shared/xs-07-help/view.tsx',
      "import { ROLE_LABEL } from '@xr/domain';\nexport const a = ROLE_LABEL;",
      [],
    ],
    [
      'src/app/student/help/page.tsx',
      "import { ROLE_LABEL } from '@xr/domain';\nexport const a = ROLE_LABEL;",
      ['xr/import-fence'],
    ],
    [
      'src/lib/api-client.ts',
      "import { createSamplePlatform } from '@xr/sample-platform';\nexport const a = createSamplePlatform;",
      ['xr/import-fence'],
    ],
    [
      'src/platform/composition.ts',
      "import { createSamplePlatform } from '@xr/sample-platform';\nexport const a = createSamplePlatform;",
      [],
    ],
    [
      'src/platform/test-hook-bridge.ts',
      "import { buildWorld } from '@xr/sample-platform/testing';\nexport const a = buildWorld;",
      [],
    ],
    [
      'src/platform/session.test.ts',
      "import { buildWorld } from '@xr/sample-platform/testing';\nexport const a = buildWorld;",
      [],
    ],
    [
      'src/lib/settings.ts',
      'export const flag = process.env.NEXT_PUBLIC_XR_DATA_SOURCE;',
      ['xr/no-process-env'],
    ],
    ['src/lib/env.ts', 'export const flag = process.env.NEXT_PUBLIC_XR_DATA_SOURCE;', []],
    [
      'src/features/shared/pu-15-not-found/view.tsx',
      'export const V = () => <p style={{ color: \'#12173F\' }} className="b1-cap">x</p>;',
      ['xr/no-canvas-classes', 'xr/no-raw-hex'],
    ],
  ])('apps/web %s', async (file, code, expected) => {
    expect(await xrRules('apps/web', file, code)).toEqual(expected);
  });

  it.each([
    [
      'src/foundation/button.tsx',
      'export const B = () => <button className="xr-btn flex p-4" />;',
      ['xr/v46-class-names'],
    ],
    [
      'src/foundation/button.tsx',
      'export const B = () => <button className="xr-btn xr-btn--primary" />;',
      [],
    ],
    ['src/foundation/button.test.tsx', 'export const B = () => <button className="flex" />;', []],
  ])('packages/ui %s', async (file, code, expected) => {
    expect(await xrRules('packages/ui', file, code)).toEqual(expected);
  });

  it.each([
    ['src/access/grant.ts', 'export const now = Date.now();', ['xr/deterministic']],
    ['src/access/grant.test.ts', 'export const now = Date.now();', []],
  ])('packages/domain %s', async (file, code, expected) => {
    expect(await xrRules('packages/domain', file, code)).toEqual(expected);
  });

  it('keeps no stale fence exception: each excepted file still imports what it is excepted for', () => {
    for (const exception of RECORDED_FENCE_EXCEPTIONS) {
      const path = join(repositoryRoot, 'v2', exception.file.replace(/^apps\//, 'apps/'));
      const file = existsSync(path) ? path : join(workspaceRoot, exception.file);
      const imports = extractScript(file, readFileSync(file, 'utf8'), false).imports.map(
        (item) => item.specifier,
      );
      for (const allowed of exception.allows) {
        expect(
          imports,
          `${exception.file} no longer imports ${allowed} (${exception.removal})`,
        ).toContain(allowed);
      }
    }
    summary.push(
      `recorded fence exceptions: ${RECORDED_FENCE_EXCEPTIONS.map((exception) => `${exception.file} → ${exception.allows.join(', ')} (until ${exception.removal})`).join('; ')}`,
    );
  });

  it('the features vocabulary list names only real @xr/domain exports', () => {
    const entry = join(workspaceRoot, 'packages', 'domain', 'src', 'index.ts');
    const program = ts.createProgram([entry], {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2023,
      noEmit: true,
    });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(entry);
    const symbol = source && checker.getSymbolAtLocation(source);
    const exported = new Set(
      (symbol ? checker.getExportsOfModule(symbol) : []).map((item) => item.getName()),
    );
    expect(exported.size).toBeGreaterThan(10);
    for (const name of DOMAIN_VOCABULARY) expect(exported, name).toContain(name);
  });
});
