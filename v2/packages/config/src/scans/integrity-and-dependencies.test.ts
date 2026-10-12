import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  deniedInLockfile,
  deniedInManifest,
  deniedKit,
  lockfilePackageCount,
  reachablePackages,
} from './dependencies.js';
import { verifyChecksums } from './integrity.js';

describe('verifyChecksums (shasum -a 256 -c, in Node)', () => {
  let directory = '';
  afterEach(() => {
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  function fixture(files: Record<string, string>): string {
    directory = mkdtempSync(join(tmpdir(), 'xr-checksums-'));
    const lines = Object.entries(files).map(([name, content]) => {
      writeFileSync(join(directory, name), content);
      return `${createHash('sha256').update(content).digest('hex')}  ${name}`;
    });
    writeFileSync(join(directory, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
    return directory;
  }

  it('passes every unchanged file', () => {
    const result = verifyChecksums(fixture({ 'a.css': '.xr-btn{}', 'b.json': '{}' }));
    expect(result).toEqual({ checked: 2, ok: 2, failed: [], missing: [] });
  });

  it('fails a file after a one-byte edit (mutation check)', () => {
    const dir = fixture({ 'a.css': '.xr-btn{}', 'b.json': '{}' });
    writeFileSync(join(dir, 'a.css'), '.xr-btn{ }');
    expect(verifyChecksums(dir)).toMatchObject({ ok: 1, failed: ['a.css'], missing: [] });
  });

  it('reports a missing file', () => {
    const dir = fixture({ 'a.css': '.xr-btn{}' });
    unlinkSync(join(dir, 'a.css'));
    expect(verifyChecksums(dir)).toMatchObject({ ok: 0, failed: [], missing: ['a.css'] });
  });
});

describe('UI-kit deny-list (owner constraint; ADR-0001 §5)', () => {
  const manifest = {
    name: '@xr/web',
    dependencies: { next: '16.3.4', react: '19.3.0' },
    devDependencies: { '@playwright/test': '1.63.0' },
  };

  it('passes the approved dependencies', () => {
    expect(deniedInManifest('apps/web/package.json', manifest)).toEqual([]);
  });

  it.each([
    ['@mui/material', 'MUI'],
    ['@chakra-ui/react', 'Chakra UI'],
    ['@radix-ui/react-dialog', 'Radix (styled kits and headless primitives)'],
    ['shadcn', 'shadcn/ui'],
    ['@headlessui/react', 'Headless UI (headless kit)'],
    ['react-aria-components', 'React Aria (headless kit)'],
    ['@tailwindplus/elements', 'Tailwind Plus (Tailwind UI)'],
    ['@fortawesome/fontawesome-free', 'Font Awesome (icon font)'],
  ])('fails when %s is added', (dependency, kit) => {
    const changed = {
      ...manifest,
      dependencies: { ...manifest.dependencies, [dependency]: '1.0.0' },
    };
    expect(deniedInManifest('apps/web/package.json', changed)).toEqual([
      { where: 'apps/web/package.json dependencies', dependency, kit },
    ]);
  });

  it('does not mistake approved packages for denied ones', () => {
    for (const name of [
      '@tanstack/react-query',
      'react-hook-form',
      'tailwindcss',
      '@tailwindcss/postcss',
      'axe-core',
      '@axe-core/playwright',
    ]) {
      expect(deniedKit(name), name).toBeNull();
    }
  });

  it('finds a denied kit anywhere in the lockfile graph', () => {
    const lockfile = [
      "lockfileVersion: '9.0'",
      'importers:',
      '  apps/web: {}',
      'packages:',
      "  '@axe-core/playwright@4.13.0':",
      '    resolution: {}',
      '  axe-core@4.13.0:',
      '    resolution: {}',
      'snapshots:',
      '  axe-core@4.13.0: {}',
    ].join('\n');
    expect(deniedInLockfile(lockfile)).toEqual([]);
    expect(lockfilePackageCount(lockfile)).toBe(2);
    const withKit = lockfile.replace(
      'snapshots:',
      "  '@radix-ui/react-slot@1.2.0':\n    resolution: {}\nsnapshots:",
    );
    expect(deniedInLockfile(withKit)).toEqual([
      {
        where: 'pnpm-lock.yaml',
        dependency: '@radix-ui/react-slot',
        kit: 'Radix (styled kits and headless primitives)',
      },
    ]);
  });

  it('walks the dependency graph of chosen importers, following workspace links', () => {
    const lockfile = [
      "lockfileVersion: '9.0'",
      'importers:',
      '  apps/web:',
      '    dependencies:',
      "      '@xr/ui':",
      '        specifier: workspace:*',
      '        version: link:../../packages/ui',
      '      next:',
      '        specifier: 16.3.4',
      '        version: 16.3.4(react@19.3.0)',
      '  packages/ui:',
      '    dependencies:',
      '      react:',
      '        specifier: 19.3.0',
      '        version: 19.3.0',
      '    devDependencies:',
      '      jsdom:',
      '        specifier: 30.0.1',
      '        version: 30.0.1',
      '  packages/database:',
      '    dependencies:',
      '      prisma:',
      '        specifier: 7.10.0',
      '        version: 7.10.0',
      'packages:',
      '  next@16.3.4:',
      '    resolution: {}',
      'snapshots:',
      '  next@16.3.4(react@19.3.0):',
      '    dependencies:',
      '      styled-jsx: 5.1.6(react@19.3.0)',
      '  styled-jsx@5.1.6(react@19.3.0):',
      '    dependencies:',
      '      react: 19.3.0',
      '  react@19.3.0: {}',
      '  prisma@7.10.0:',
      '    dependencies:',
      "      '@radix-ui/react-toggle': 1.1.10",
      "  '@radix-ui/react-toggle@1.1.10': {}",
    ].join('\n');
    expect([...reachablePackages(lockfile, ['apps/web'])].sort()).toEqual([
      'next',
      'react',
      'styled-jsx',
    ]);
    expect([...reachablePackages(lockfile, ['packages/ui'])].sort()).toEqual(['jsdom', 'react']);
    expect([...reachablePackages(lockfile, ['packages/database'])].sort()).toEqual([
      '@radix-ui/react-toggle',
      'prisma',
    ]);
  });

  it('reads every YAML document of a pnpm 12 lockfile', () => {
    const lockfile = [
      "lockfileVersion: '9.0'",
      'importers:',
      '  .: {}',
      'packages:',
      "  '@pnpm/exe@12.3.4':",
      '    resolution: {}',
      'snapshots:',
      "  '@pnpm/exe@12.3.4': {}",
      '---',
      "lockfileVersion: '9.0'",
      'importers:',
      '  apps/web: {}',
      'packages:',
      '  next@16.3.4:',
      '    resolution: {}',
      "  '@mui/material@7.0.0':",
      '    resolution: {}',
      'snapshots:',
      '  next@16.3.4: {}',
    ].join('\n');
    expect(lockfilePackageCount(lockfile)).toBe(3);
    expect(deniedInLockfile(lockfile).map((finding) => finding.dependency)).toEqual([
      '@mui/material',
    ]);
  });
});
