// Package boundaries of the V2 workspace — the ONE place they are declared.
//
// Consumers:
//   1. `rules/resolved-boundaries.mjs` — the ESLint rule that classifies every import by
//      its RESOLVED filesystem target (named, relative, aliased, dynamic, export-from);
//   2. `src/boundaries/boundaries.test.ts` — checks every package.json against the
//      allowed workspace-dependency matrix and lints fixtures through the rule;
//   3. package `exports` fields close the third door — deep paths such as
//      `@xr/contracts/src/x` do not resolve at all.

/** Which workspace packages each package may depend on (dependencies + devDependencies). */
export const ALLOWED_WORKSPACE_DEPENDENCIES = {
  '@xr/domain': [],
  '@xr/validation': [],
  '@xr/contracts': ['@xr/domain', '@xr/validation'],
  '@xr/config': [],
  '@xr/database': [],
  '@xr/testing': [],
  '@xr/ui': [],
  '@xr/api': ['@xr/config', '@xr/contracts', '@xr/database', '@xr/domain', '@xr/validation'],
  // The mock adapter (ADR-0002, AD-01; WP-0.11): the sample world behind the draft ports. It
  // may use only the contracts, the domain rules and the validation primitives.
  '@xr/sample-platform': ['@xr/contracts', '@xr/domain', '@xr/validation'],
  // `@xr/sample-platform` only through src/platform/composition.ts and its ./testing export only
  // through the test-hook bridge (Appendix F §3.8; webFences in fences.mjs).
  '@xr/web': [
    '@xr/config',
    '@xr/contracts',
    '@xr/domain',
    '@xr/sample-platform',
    '@xr/ui',
    '@xr/validation',
  ],
  // The specimen harness (VD-17): renders @xr/ui specimens for tests; never deployed, and no
  // package may depend on it.
  '@xr/specimens': ['@xr/ui'],
};

/** Tooling-only workspace packages: any package may use them (devDependencies, config files). */
export const TOOLING_WORKSPACE_DEPENDENCIES = ['@xr/config', '@xr/testing'];

export const WORKSPACE_PACKAGES = Object.keys(ALLOWED_WORKSPACE_DEPENDENCIES);

const FRAMEWORK_SERVER = ['@nestjs/*', 'fastify', 'fastify/*', '@fastify/*'];
const FRAMEWORK_WEB = ['react', 'react-dom', 'react/*', 'react-dom/*', 'next', 'next/*'];
const DATA_LAYER = ['@prisma/*', 'prisma', 'prisma/*', 'pg'];

/** Third-party modules each package must never import (gitignore-style globs on the specifier). */
export const FORBIDDEN_THIRD_PARTY = {
  '@xr/domain': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER, 'zod', 'zod/*'],
  '@xr/validation': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER],
  '@xr/contracts': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER],
  '@xr/config': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER],
  '@xr/database': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB],
  '@xr/testing': [...FRAMEWORK_SERVER, ...DATA_LAYER],
  '@xr/ui': [...FRAMEWORK_SERVER, 'next', 'next/*', ...DATA_LAYER],
  '@xr/api': [...FRAMEWORK_WEB],
  '@xr/sample-platform': [...FRAMEWORK_SERVER, ...FRAMEWORK_WEB, ...DATA_LAYER],
  '@xr/web': [...DATA_LAYER, ...FRAMEWORK_SERVER],
  '@xr/specimens': [...DATA_LAYER, ...FRAMEWORK_SERVER],
};

/** Workspace packages `name` may import: itself, its allowed dependencies, and tooling. */
export function allowedWorkspaceImports(name) {
  return new Set([
    name,
    ...ALLOWED_WORKSPACE_DEPENDENCIES[name],
    ...TOOLING_WORKSPACE_DEPENDENCIES,
  ]);
}

/** Runtime (non-tooling) workspace dependencies — what a package's TypeScript project references. */
export function runtimeWorkspaceDependencies(name) {
  return ALLOWED_WORKSPACE_DEPENDENCIES[name].filter(
    (dependency) =>
      !TOOLING_WORKSPACE_DEPENDENCIES.includes(dependency) ||
      name === '@xr/api' ||
      name === '@xr/web',
  );
}

/** Does a bare specifier match a forbidden pattern (`pkg`, `pkg/*`, `@scope/*`)? */
export function matchesPattern(specifier, pattern) {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    if (base.endsWith('/*')) return specifier.startsWith(base.slice(0, -1));
    if (base.includes('*')) return globToRegExp(pattern).test(specifier);
    return specifier === base || specifier.startsWith(`${base}/`);
  }
  if (pattern.includes('*')) return globToRegExp(pattern).test(specifier);
  return specifier === pattern;
}

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}(?:/.*)?$`);
}
