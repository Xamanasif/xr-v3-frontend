/**
 * Repository checks for the V3 Refined Direction B foundation (ADR-0010). They read the frozen V3
 * reference at the repository root, the V3 status register and comparison map in `v2/docs/v3`,
 * and the web app's sources, so they run UNCACHED with the other repository scans.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

import { verifyChecksumLines, verifyChecksums } from './integrity.js';
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
    // Owner-approved role exports live under `roles/`, each with its own checksums (below).
    const present = walk(reference)
      .map((file) => relative(reference, file).split('\\').join('/'))
      .filter((file) => !file.startsWith('roles/'));
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

describe('owner-approved role exports design/v3-refined-b/roles (uncached integrity)', () => {
  const roles = join(reference, 'roles');
  /**
   * Each export and its file count. An export that ships its own `SHA256SUMS.txt` is checked
   * against it (XS-v6); one that ships none is checked against the list recorded at intake beside
   * its folder, `<folder>.SHA256SUMS.txt` (SA-v1), so nothing is added inside the export.
   */
  const EXPORTS = {
    'XS-v6': { files: 125, sums: 'inside' },
    'SA-v1': { files: 29, sums: 'beside' },
  } as const;
  const sumsOf = (folder: keyof typeof EXPORTS) =>
    EXPORTS[folder].sums === 'inside'
      ? join(roles, folder, 'SHA256SUMS.txt')
      : join(roles, `${folder}.SHA256SUMS.txt`);

  it('each export: its checksums all OK, and the folder holds exactly the listed files', () => {
    const folders = walk(roles)
      .map((file) => relative(roles, file).split('\\').join('/'))
      .filter((file) => file.includes('/'))
      .map((file) => file.split('/')[0]!);
    expect([...new Set(folders)].sort()).toEqual(Object.keys(EXPORTS).sort());
    const loose = walk(roles)
      .map((file) => relative(roles, file).split('\\').join('/'))
      .filter((file) => !file.includes('/'));
    expect(loose.sort()).toEqual(
      [
        'README.md',
        ...Object.keys(EXPORTS)
          .filter((folder) => EXPORTS[folder as keyof typeof EXPORTS].sums === 'beside')
          .map((folder) => `${folder}.SHA256SUMS.txt`),
      ].sort(),
    );
    for (const folder of Object.keys(EXPORTS) as (keyof typeof EXPORTS)[]) {
      const root = join(roles, folder);
      const lines = readFileSync(sumsOf(folder), 'utf8').split('\n').filter(Boolean);
      const result = verifyChecksumLines(root, lines);
      const count = EXPORTS[folder].files;
      summary.push(`role export ${folder}: ${result.ok}/${result.checked} OK`);
      expect(result, folder).toEqual({ checked: count, ok: count, failed: [], missing: [] });
      const listed = lines.map((line) => line.replace(/^[0-9a-f]{64} [ *]/, ''));
      const present = walk(root).map((file) => relative(root, file).split('\\').join('/'));
      expect(present.sort(), folder).toEqual(
        EXPORTS[folder].sums === 'inside' ? [...listed, 'SHA256SUMS.txt'].sort() : listed.sort(),
      );
    }
  });

  it('each export is built on this foundation, and the roles index names it', () => {
    const index = readFileSync(join(roles, 'README.md'), 'utf8');
    for (const folder of Object.keys(EXPORTS)) {
      // Two lock layouts: `baseFiles["project/core.css"]` (XS) or
      // `byteIdenticalCopiesInProject["core.css"]` (SA), each with the sheet's SHA-256.
      const exportLock = readJson(join(roles, folder, 'FOUNDATION-LOCK.json')) as {
        foundationId: string;
        baseFiles?: Record<string, { sha256: string }>;
        byteIdenticalCopiesInProject?: Record<string, { sha256: string }>;
      };
      expect(exportLock.foundationId, folder).toBe(lock.foundationId);
      for (const sheet of ['core.css', 'rb.css', 'rb-kit.css']) {
        const recorded =
          exportLock.baseFiles?.[`project/${sheet}`]?.sha256 ??
          exportLock.byteIdenticalCopiesInProject?.[sheet]?.sha256;
        expect(recorded, `${folder} ${sheet}`).toBe(
          lock.baseFiles[`references/v3/project/${sheet}`],
        );
        // The copy in the export is that file, byte for byte.
        expect(sha256(join(roles, folder, 'project', sheet)), `${folder} ${sheet} (file)`).toBe(
          lock.baseFiles[`references/v3/project/${sheet}`],
        );
      }
      expect(index, folder).toContain(`\`${folder}\``);
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

describe('scope boundary: only migrated screens load the V3 layer (ADR-0010)', () => {
  it('every web app source that loads the V3 layer is one the comparison map names', () => {
    const importers = walk(join(workspaceRoot, 'apps', 'web', 'src'))
      .filter((file) => /\.(?:tsx?|css)$/.test(file))
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) => /@xr\/ui\/(?:v3|styles-v3\.css)\b/.test(readFileSync(file, 'utf8')))
      .map(toWorkspacePath);
    const screens = map.productScreens as { id: string; sources: string[] }[];
    expect(screens.length).toBeGreaterThan(0);
    const named = new Set(screens.flatMap((screen) => screen.sources));
    const unnamed = importers.filter(
      (file) => ![...named].some((source) => file === source || file.startsWith(`${source}/`)),
    );
    expect(unnamed).toEqual([]);
    // Today: the Entry & shared surfaces (XS) and the Super Admin role (SA), and nothing of the
    // locked landing or another role's page.
    expect(new Set(screens.map((screen) => screen.id.slice(0, 2)))).toEqual(new Set(['XS', 'SA']));
    for (const file of importers) {
      expect(file, file).toMatch(
        /^apps\/web\/src\/(?:features\/shared\/|features\/admin\/|app\/\(auth\)\/layout\.tsx$|app\/_workspace\/workspace-route\.tsx$)/,
      );
    }
    summary.push(
      `V3 layer loaded by ${importers.length} web sources (XS, SA), all on the comparison map`,
    );
  });

  it('the root layout and the public landing never load it', () => {
    for (const file of ['apps/web/src/app/layout.tsx', 'apps/web/src/app/(public)/page.tsx']) {
      expect(readFileSync(join(workspaceRoot, file), 'utf8'), file).not.toMatch(
        /@xr\/ui\/(?:v3|styles-v3\.css)|wght@400\.\.800/,
      );
    }
  });
});
