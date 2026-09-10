/**
 * Proves the package boundaries are ENFORCED by resolved target, not documented:
 *  1. every workspace package.json only depends on the workspace packages it is allowed to;
 *  2. every TypeScript build project references exactly its runtime workspace dependencies
 *     and never emits a broken program (`noEmitOnError`, `composite`);
 *  3. the ESLint rule rejects named, relative, aliased and dynamic forbidden imports —
 *     including the demonstrated bypass `domain → ../../database/dist/…` — and accepts
 *     legitimate ones.
 */
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import {
  ALLOWED_WORKSPACE_DEPENDENCIES,
  FORBIDDEN_THIRD_PARTY,
  TOOLING_WORKSPACE_DEPENDENCIES,
  boundaries,
  externalPackageOf,
  matchesPattern,
  runtimeWorkspaceDependencies,
  type WorkspacePackage,
} from '../../eslint/boundaries.mjs';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');

interface Manifest extends Record<string, unknown> {
  name: WorkspacePackage;
}

function workspacePackages(): Map<WorkspacePackage, { dir: string; manifest: Manifest }> {
  const found = new Map<WorkspacePackage, { dir: string; manifest: Manifest }>();
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(join(workspaceRoot, group))) {
      const dir = join(workspaceRoot, group, entry);
      const file = join(dir, 'package.json');
      if (!existsSync(file)) continue; // stray files such as .DS_Store are not packages
      const manifest = JSON.parse(readFileSync(file, 'utf8')) as Manifest;
      found.set(manifest.name, { dir, manifest });
    }
  }
  return found;
}

const packages = workspacePackages();

describe('workspace dependency matrix', () => {
  it('declares a boundary for every workspace package', () => {
    for (const name of packages.keys()) {
      expect(ALLOWED_WORKSPACE_DEPENDENCIES, `${name} missing`).toHaveProperty(name);
      expect(FORBIDDEN_THIRD_PARTY, `${name} missing`).toHaveProperty(name);
    }
  });

  it('lets each package depend only on its allowed workspace packages', () => {
    for (const [name, { manifest }] of packages) {
      const declared = [
        ...Object.keys((manifest['dependencies'] as Record<string, string>) ?? {}),
        ...Object.keys((manifest['devDependencies'] as Record<string, string>) ?? {}),
        ...Object.keys((manifest['peerDependencies'] as Record<string, string>) ?? {}),
      ].filter((dependency) => dependency.startsWith('@xr/')) as WorkspacePackage[];
      const allowed = new Set<WorkspacePackage>([
        ...ALLOWED_WORKSPACE_DEPENDENCIES[name],
        ...TOOLING_WORKSPACE_DEPENDENCIES,
      ]);
      const violations = declared.filter((dependency) => !allowed.has(dependency));
      expect(violations, `${name} depends on ${violations.join(', ')}`).toEqual([]);
    }
  });

  it('keeps the web application away from the database and the API, and the domain away from everything', () => {
    expect(ALLOWED_WORKSPACE_DEPENDENCIES['@xr/web']).not.toContain('@xr/database');
    expect(ALLOWED_WORKSPACE_DEPENDENCIES['@xr/web']).not.toContain('@xr/api');
    expect(ALLOWED_WORKSPACE_DEPENDENCIES['@xr/domain']).toEqual([]);
  });
});

describe('TypeScript build graph (project references)', () => {
  const tscProjects = [...packages].filter(([name]) => name !== '@xr/web');

  it('every build project is composite and never emits a broken program', () => {
    for (const [name, { dir }] of tscProjects) {
      const config = JSON.parse(readFileSync(join(dir, 'tsconfig.build.json'), 'utf8')) as {
        compilerOptions?: Record<string, unknown>;
      };
      expect(config.compilerOptions?.['composite'], `${name} composite`).toBe(true);
      expect(config.compilerOptions?.['noEmitOnError'], `${name} noEmitOnError`).toBe(true);
    }
  });

  it('every build project references exactly its runtime workspace dependencies', () => {
    for (const [name, { dir }] of tscProjects) {
      const config = JSON.parse(readFileSync(join(dir, 'tsconfig.build.json'), 'utf8')) as {
        references?: { path: string }[];
      };
      const referenced = (config.references ?? []).map((reference) => {
        const referencedDir = resolve(dir, reference.path, '..');
        const entry = [...packages].find(([, pkg]) => resolve(pkg.dir) === referencedDir);
        return entry?.[0] ?? relative(workspaceRoot, referencedDir);
      });
      const manifest = packages.get(name)?.manifest;
      const runtime = Object.keys(
        (manifest?.['dependencies'] as Record<string, string>) ?? {},
      ).filter((d) => d.startsWith('@xr/'));
      expect([...referenced].sort(), name).toEqual([...runtime].sort());
      expect(
        runtime.every((dependency) =>
          runtimeWorkspaceDependencies(name).includes(dependency as WorkspacePackage),
        ),
        name,
      ).toBe(true);
    }
  });

  it('the root solution references every TypeScript project', () => {
    const solution = JSON.parse(
      readFileSync(join(workspaceRoot, 'tsconfig.solution.json'), 'utf8'),
    ) as {
      references: { path: string }[];
    };
    const referenced = solution.references.map((reference) =>
      resolve(workspaceRoot, reference.path, '..'),
    );
    for (const [name, { dir }] of tscProjects) {
      expect(referenced, name).toContain(resolve(dir));
    }
  });
});

describe('matchesPattern', () => {
  it('matches package globs the way the matrix intends', () => {
    expect(matchesPattern('@nestjs/common', '@nestjs/*')).toBe(true);
    expect(matchesPattern('@nestjs/common/decorators', '@nestjs/*')).toBe(true);
    expect(matchesPattern('react/jsx-runtime', 'react/*')).toBe(true);
    expect(matchesPattern('react', 'react/*')).toBe(true);
    expect(matchesPattern('react-dom', 'react')).toBe(false);
    expect(matchesPattern('zod', 'zod')).toBe(true);
  });
});

describe('ESLint rule xr/resolved-boundaries', () => {
  async function lint(packageName: WorkspacePackage, fixturePath: string, source: string) {
    const eslint = new ESLint({
      cwd: workspaceRoot,
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.ts', '**/*.tsx', '**/*.mts'],
          languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parser: (await import('typescript-eslint')).parser,
          },
        },
        boundaries(packageName),
      ],
    });
    const [result] = await eslint.lintText(source, { filePath: join(workspaceRoot, fixturePath) });
    return (result?.messages ?? []).map((message) => ({
      ruleId: message.ruleId ?? `unknown: ${message.message}`,
      text: message.message,
    }));
  }

  // The installed Nest implementation, as pnpm lays it out: the API's node_modules link
  // and the real path inside pnpm's store. Both must classify as @nestjs/common.
  const nestLink = join(workspaceRoot, 'apps', 'api', 'node_modules', '@nestjs', 'common');
  const nestReal = realpathSync(nestLink);
  const fromDomainSrc = (absolute: string) =>
    relative(join(workspaceRoot, 'packages', 'domain', 'src'), absolute)
      .split('\\')
      .join('/');
  const astraBypass = '../../../apps/api/node_modules/@nestjs/common/index.js';
  const storeBypass = fromDomainSrc(join(nestReal, 'index.js'));

  it('externalPackageOf identifies packages from link paths and pnpm store paths alike', () => {
    expect(externalPackageOf(join(nestLink, 'index.js'))).toMatchObject({
      name: '@nestjs/common',
      subpath: 'index.js',
    });
    expect(externalPackageOf(join(nestReal, 'index.js'))).toMatchObject({
      name: '@nestjs/common',
      subpath: 'index.js',
    });
    expect(storeBypass).toContain('node_modules/.pnpm/');
    expect(externalPackageOf(join(workspaceRoot, 'node_modules', '.pnpm'))).toMatchObject({
      name: null,
    });
    expect(
      externalPackageOf(join(workspaceRoot, 'packages', 'domain', 'src', 'index.ts')),
    ).toBeNull();
    expect(
      externalPackageOf(join(workspaceRoot, 'node_modules', 'react', 'index.js')),
    ).toMatchObject({ name: 'react' });
  });

  type Case = [WorkspacePackage, string, string, 'rejected' | 'allowed', RegExp?];
  const cases: Case[] = [
    // external packages reached by PATH are classified as that package (Astra's bypass)
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { Injectable } from '@nestjs/common';",
      'rejected',
      /@nestjs\/\*/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      `import { Injectable } from '${astraBypass}';`,
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      `import { Injectable } from '${storeBypass}';`,
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      `const nest = await import('${astraBypass}');`,
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      `export { Injectable } from '${astraBypass}';`,
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      `export * from '${astraBypass}';`,
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { PrismaPg } from '../../../apps/api/node_modules/@prisma/adapter-pg/dist/index.js';",
      'rejected',
      /external package @prisma\/adapter-pg/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { useState } from '../../../apps/web/node_modules/react/index.js';",
      'rejected',
      /external package react/,
    ],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { Injectable } from '../../../api/node_modules/@nestjs/common/index.js';",
      'rejected',
      /external package @nestjs\/common/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { x } from '../../../node_modules/.pnpm';",
      'rejected',
      /no package identity/,
    ],
    // a workspace package reached through another package's node_modules link is still that workspace package
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { probeDatabase } from '../../../apps/api/node_modules/@xr/database/dist/index.js';",
      'rejected',
      /resolves into @xr\/database/,
    ],
    // legitimate externals stay allowed where policy permits, even by path
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { z } from '../node_modules/zod/index.js';",
      'allowed',
    ],
    ['@xr/api', 'apps/api/src/f.ts', "import { Injectable } from '@nestjs/common';", 'allowed'],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { useQuery } from '@tanstack/react-query';",
      'allowed',
    ],
    // the demonstrated bypass — domain reaching the database by relative path
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { createPrismaClient } from '../../database/dist/index.js';",
      'rejected',
      /resolves into @xr\/database/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "export * from '../../database/src/index.js';",
      'rejected',
      /resolves into @xr\/database/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "export { probeDatabase } from '../../../packages/database/dist/index.js';",
      'rejected',
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "const db = await import('@xr/database');",
      'rejected',
      /must not depend on @xr\/database/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "const db = await import('../../database/dist/index.js');",
      'rejected',
      /resolves into @xr\/database/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "type P = import('@xr/database').PrismaClient;",
      'rejected',
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import type { Prisma } from '@xr/database';",
      'rejected',
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { Injectable } from '@nestjs/common';",
      'rejected',
      /@nestjs\/\*/,
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { FoundationStatusList } from '@xr/ui';",
      'rejected',
    ],
    ['@xr/domain', 'packages/domain/src/f.ts', "import { z } from 'zod';", 'rejected'],
    ['@xr/domain', 'packages/domain/src/f.ts', "import { useState } from 'react';", 'rejected'],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { TECHNOLOGIES } from './technology.js';",
      'allowed',
    ],
    [
      '@xr/domain',
      'packages/domain/src/f.ts',
      "import { readFileSync } from 'node:fs';",
      'allowed',
    ],
    [
      '@xr/domain',
      'packages/domain/vitest.config.ts',
      "import { createVitestConfig } from '@xr/testing';",
      'allowed',
    ],
    // web must never reach the database or the API, by any route
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { createPrismaClient } from '@xr/database';",
      'rejected',
    ],
    ['@xr/web', 'apps/web/src/lib/f.ts', "const db = await import('@xr/database');", 'rejected'],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { createPrismaClient } from '../../../../packages/database/dist/index.js';",
      'rejected',
      /resolves into @xr\/database/,
    ],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { AppModule } from '../../../api/src/app.module.js';",
      'rejected',
      /resolves into @xr\/api/,
    ],
    ['@xr/web', 'apps/web/src/lib/f.ts', "import { AppModule } from '@xr/api';", 'rejected'],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { Injectable } from '@nestjs/common';",
      'rejected',
    ],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { PrismaPg } from '@prisma/adapter-pg';",
      'rejected',
    ],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { healthResponseSchema } from '@xr/contracts';",
      'allowed',
    ],
    ['@xr/web', 'apps/web/src/lib/f.ts', "import { publicEnv } from '@/lib/env';", 'allowed'],
    [
      '@xr/web',
      'apps/web/src/lib/f.ts',
      "import { FoundationStatusList } from '@xr/ui';",
      'allowed',
    ],
    ['@xr/web', 'apps/web/src/app/layout.tsx', "import '@xr/ui/tokens.css';", 'allowed'],
    ['@xr/web', 'apps/web/src/lib/f.ts', "import { parseEnv } from '@xr/config/env';", 'allowed'],
    // internals of another package are never a public export
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { TECHNOLOGIES } from '@xr/domain/src/technology.js';",
      'rejected',
      /internals/,
    ],
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { TECHNOLOGIES } from '@xr/domain/dist/technology.js';",
      'rejected',
      /internals/,
    ],
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { TECHNOLOGIES } from '@xr/domain/technology';",
      'rejected',
      /not a public export/,
    ],
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { TECHNOLOGIES } from '../../domain/src/technology.js';",
      'rejected',
      /resolves into @xr\/domain/,
    ],
    [
      '@xr/contracts',
      'packages/contracts/src/f.ts',
      "import { TECHNOLOGIES } from '@xr/domain';",
      'allowed',
    ],
    // the API stays away from the UI layer
    ['@xr/api', 'apps/api/src/f.ts', "import { FoundationStatusList } from '@xr/ui';", 'rejected'],
    ['@xr/api', 'apps/api/src/f.ts', "import { useState } from 'react';", 'rejected'],
    [
      '@xr/api',
      'apps/api/src/f.ts',
      "import { createPrismaClient } from '@xr/database';",
      'allowed',
    ],
    [
      '@xr/api',
      'apps/api/test/f.ts',
      "import { createApp } from '../src/bootstrap.js';",
      'allowed',
    ],
    // ui and tooling
    ['@xr/ui', 'packages/ui/src/f.tsx', "import { HEALTH_PATH } from '@xr/contracts';", 'rejected'],
    [
      '@xr/testing',
      'packages/testing/eslint.config.mjs',
      "import { node } from '@xr/config/eslint';",
      'allowed',
    ],
    [
      '@xr/database',
      'packages/database/src/f.ts',
      "import { HEALTH_PATH } from '@xr/contracts';",
      'rejected',
    ],
  ];

  for (const [packageName, fixturePath, source, expectation, message] of cases) {
    it(`${packageName} (${fixturePath}): ${source} → ${expectation}`, async () => {
      const findings = await lint(packageName, fixturePath, source);
      const boundaryFindings = findings.filter(
        (finding) => finding.ruleId === 'xr/resolved-boundaries',
      );
      if (expectation === 'rejected') {
        expect(boundaryFindings.length, JSON.stringify(findings)).toBeGreaterThan(0);
        if (message) expect(boundaryFindings[0]?.text).toMatch(message);
      } else {
        expect(findings, JSON.stringify(findings)).toEqual([]);
      }
    });
  }
});
