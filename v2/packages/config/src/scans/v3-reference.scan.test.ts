/**
 * Repository checks for the V3 Refined Direction B foundation (ADR-0010). They read the frozen V3
 * reference at the repository root, the V3 status register and comparison map in `v2/docs/v3`,
 * and the web app's sources, so they run UNCACHED with the other repository scans.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { verifyChecksums } from './integrity.js';
import { repositoryRoot, toWorkspacePath, walk, workspaceRoot } from './workspace.js';

const reference = join(repositoryRoot, 'design', 'v3-refined-b');
const pack = join(reference, 'pack');
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

interface Lock {
  foundationId: string;
  lockedLandingScreenIds: string[];
  baseFiles: Record<string, string>;
}
interface Ownership {
  screens: {
    id: string;
    surface: string;
    screen: string;
    type: string;
    designed: boolean;
    proposedRoute: string;
    ownerWorkstream: string;
    v3DesignStatus: string;
  }[];
}
interface RegisterEntry {
  id: string;
  workstream: string;
  surface: string;
  screen: string;
  type: string;
  designed: boolean;
  v46ProposedRoute: string;
  specimens?: string[];
  landingFidelity?: string;
  designSupplied: string;
  ownerApproved: string;
  implementationComplete: string;
  browserChecked: string;
  openIssue: string;
}
interface Register {
  foundationId: string;
  counts: Record<string, number>;
  entries: RegisterEntry[];
}
interface ComparisonMap {
  foundationId: string;
  productScreens: unknown[];
  foundationEvidence: {
    comparisons: {
      id: string;
      specimen: string;
      widths: Record<string, { pageSize: { board: number[]; react: number[] } }>;
    }[];
  };
}

const lock = readJson(join(pack, 'FOUNDATION-LOCK.json')) as Lock;
const ownership = readJson(join(pack, 'SCREEN-OWNERSHIP.json')) as Ownership;
const register = readJson(join(workspaceRoot, 'docs', 'v3', 'V3-STATUS-REGISTER.json')) as Register;
const map = readJson(join(workspaceRoot, 'docs', 'v3', 'V3-COMPARISON-MAP.json')) as ComparisonMap;

const summary: string[] = [];
afterAll(() => {
  console.info(
    `\nV3 foundation checks (ADR-0010)\n${summary.map((line) => `  ${line}`).join('\n')}\n`,
  );
});

describe('frozen V3 reference design/v3-refined-b (uncached integrity)', () => {
  it('46/46 checksums, and the folder holds exactly the listed files', () => {
    const result = verifyChecksums(reference);
    summary.push(
      `V3 reference: ${result.ok}/${result.checked} OK, ${result.failed.length} failed, ${result.missing.length} missing`,
    );
    expect(result).toEqual({ checked: 46, ok: 46, failed: [], missing: [] });
    const listed = readFileSync(join(reference, 'SHA256SUMS.txt'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => line.replace(/^[0-9a-f]{64} [ *]/, ''));
    const present = walk(reference).map((file) => relative(reference, file).split('\\').join('/'));
    expect(present.sort()).toEqual([...listed, 'README.md', 'SHA256SUMS.txt'].sort());
  });

  it("every copy matches the pack's own manifest, and the ten foundation files match the lock", () => {
    const manifest = readJson(join(pack, 'PACK-MANIFEST.json')) as {
      files: Record<string, { sha256: string; bytes: number }>;
    };
    const copies = walk(pack)
      .map((file) => relative(pack, file).split('\\').join('/'))
      .filter((file) => file !== 'PACK-MANIFEST.json');
    expect(copies.length).toBe(45);
    for (const file of copies) {
      expect(manifest.files[file]?.sha256, file).toBe(sha256(join(pack, file)));
    }
    expect(lock.foundationId).toBe('XR-V3-RB-1.0');
    expect(Object.keys(lock.baseFiles)).toHaveLength(10);
    for (const [file, hash] of Object.entries(lock.baseFiles)) {
      expect(sha256(join(pack, file)), file).toBe(hash);
    }
  });
});

describe('V3 status register and comparison map (docs/v3)', () => {
  const owned = ownership.screens;
  const entries = register.entries;

  it('lists the 147 registered ids of SCREEN-OWNERSHIP once each, in order, with their facts', () => {
    expect(register.foundationId).toBe(lock.foundationId);
    expect(map.foundationId).toBe(lock.foundationId);
    expect(entries.map((entry) => entry.id)).toEqual(owned.map((screen) => screen.id));
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(147);
    for (const [index, screen] of owned.entries()) {
      const entry = entries[index]!;
      expect(
        [entry.surface, entry.screen, entry.type, entry.designed, entry.v46ProposedRoute],
        entry.id,
      ).toEqual([
        screen.surface,
        screen.screen,
        screen.type,
        screen.designed,
        screen.proposedRoute,
      ]);
      expect(entry.workstream, entry.id).toBe(screen.ownerWorkstream);
    }
  });

  it('keeps the five status columns separate on every entry', () => {
    for (const entry of entries) {
      for (const column of [
        'designSupplied',
        'ownerApproved',
        'implementationComplete',
        'browserChecked',
      ] as const) {
        expect(
          typeof entry[column] === 'string' && entry[column].length > 0,
          `${entry.id} ${column}`,
        ).toBe(true);
      }
      expect(typeof entry.openIssue, `${entry.id} openIssue`).toBe('string');
    }
  });

  it('counts: 123 designed, 24 excluded, 5 V3 seeds, 2 locked landing ids, 116 pending', () => {
    const byStatus = (status: string) =>
      owned.filter((screen) => screen.v3DesignStatus === status).map((screen) => screen.id);
    const seeds = byStatus('v3-seed-source-received');
    const locked = byStatus('locked-original-landing');
    expect(seeds.sort()).toEqual(['IA-01', 'IA-02', 'SA-01', 'SA-02', 'SA-03']);
    expect(locked.sort()).toEqual([...lock.lockedLandingScreenIds].sort());
    expect(register.counts).toMatchObject({
      registered: 147,
      designed: entries.filter((entry) => entry.designed).length,
      excluded: entries.filter((entry) => !entry.designed).length,
      v3SeedSource: seeds.length,
      lockedLanding: locked.length,
      pendingDesign: byStatus('v3-design-pending').length,
    });
    expect([register.counts.designed, register.counts.excluded]).toEqual([123, 24]);
    summary.push(
      `V3 register: ${entries.length} ids, ${register.counts.designed} designed, ${register.counts.excluded} excluded, ${seeds.length} seeds, ${register.counts.migrated} migrated`,
    );
  });

  it('PU-01 and PU-14 stay locked, with their own landing-fidelity state (HOLD)', () => {
    for (const id of lock.lockedLandingScreenIds) {
      const entry = entries.find((candidate) => candidate.id === id)!;
      expect(entry.landingFidelity, id).toMatch(/^HOLD/);
      expect(entry.implementationComplete, id).toMatch(/^not migrated/);
    }
  });

  it('claims a migration only with a product comparison; every seed specimen was compared at four widths', () => {
    for (const entry of entries.filter((candidate) => !candidate.designed)) {
      expect(
        [entry.designSupplied, entry.implementationComplete, entry.browserChecked],
        entry.id,
      ).toEqual(['excluded', 'n/a', 'n/a']);
    }
    const migrated = entries.filter(
      (entry) => entry.designed && !entry.implementationComplete.startsWith('not migrated'),
    );
    expect(migrated.length).toBe(register.counts.migrated);
    expect(map.productScreens.length >= migrated.length).toBe(true);
    const compared = new Map(
      map.foundationEvidence.comparisons.map((comparison) => [comparison.specimen, comparison]),
    );
    const seeds = entries.filter((entry) => entry.specimens?.length);
    expect(seeds.map((entry) => entry.id).sort()).toEqual([
      'IA-01',
      'IA-02',
      'SA-01',
      'SA-02',
      'SA-03',
    ]);
    for (const entry of seeds) {
      const comparison = compared.get(entry.specimens![0]!);
      expect(comparison?.id, entry.id).toBe(entry.id);
      expect(Object.keys(comparison!.widths).sort(), entry.id).toEqual([
        '1024',
        '1440',
        '375',
        '768',
      ]);
      for (const [width, result] of Object.entries(comparison!.widths)) {
        expect(result.pageSize.react, `${entry.id} ${width}`).toEqual(result.pageSize.board);
      }
    }
  });
});

describe('scope boundary until the first role migrates (ADR-0010)', () => {
  it('no web app source loads the V3 layer while no screen is migrated', () => {
    const importers = walk(join(workspaceRoot, 'apps', 'web', 'src'))
      .filter((file) => /\.(?:tsx?|css)$/.test(file))
      .filter((file) => /@xr\/ui\/(?:v3|styles-v3\.css)\b/.test(readFileSync(file, 'utf8')))
      .map(toWorkspacePath);
    // A role migration (pack prompt 11) lists its routes in docs/v3/V3-COMPARISON-MAP.json
    // `productScreens` and replaces this check with one that names them.
    expect(map.productScreens).toEqual([]);
    expect(importers).toEqual([]);
  });
});
