// Folder-level import fences and code bans of the v46 frontend (Appendix F §3.8, WP-0.4).
//
//   webFences(appDir)  apps/web: features, route files, composition root, test-hook bridge,
//                      the @xr/sample-platform, contract-suite and stand-in fences, process.env,
//                      raw hex and canvas classes in product code
//   uiRules            @xr/ui: v46 class names only, no raw hex, no canvas classes
//   determinism        @xr/domain now, @xr/sample-platform when it exists (WP-0.11)
//
// Test files are outside every fence: they may import test seams (e.g.
// `@xr/sample-platform/testing`) and the contract suite. Exceptions are listed in
// RECORDED_FENCE_EXCEPTIONS with their evidence and removal trigger; the uncached scan suite
// fails when an exception is no longer needed.
import { join } from 'node:path';

import { xrPlugin } from './rules/index.mjs';

/** Never fenced: tests, test support, e2e suites. */
export const TEST_FILES = [
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  'src/test-support/**',
  'src/testing/**',
  'e2e/**',
];

/**
 * The @xr/domain values screens may use: vocabulary only — ids, roles, technology and status
 * unions (Appendix F §3.8). Types are always allowed. Decision, policy and derive functions
 * (`interimCompletionPolicy`, `foldSessions`, `byRuntimeClock`, …) and the non-UI FRD order
 * (`sortTechnologies`) are not vocabulary. Kept in step with @xr/domain by a drift test in
 * apps/web.
 */
export const DOMAIN_VOCABULARY = [
  'PLATFORM_ROLES',
  'ROLE_LABEL',
  'ROLE_PLANE',
  'isRole',
  'TECHNOLOGIES',
  'FORMAT_DISPLAY_ORDER',
  'FORMAT_META',
  'inDisplayOrder',
  'isTechnology',
];

const SAMPLE_PLATFORM_EVERYWHERE = [
  {
    pattern: '@xr/sample-platform',
    reason:
      'the mock adapter is imported only by src/platform/composition.ts (Appendix F §3.8; ADR-0002 §5)',
  },
  {
    pattern: '@xr/sample-platform/**',
    reason:
      'the mock adapter test seams are imported only by src/platform/test-hook-bridge.ts and tests (Appendix F §3.8; ADR-0007)',
  },
];

const CONTRACT_SUITE = {
  pattern: '@xr/contracts/draft/contract-suite{,/**}',
  reason:
    'the contract suite runs in tests only, so Node built-ins never reach the client graph (Appendix F §3.6)',
};

const STANDINS = {
  pattern: '@xr/contracts/draft/standins{,/**}',
  reason:
    'the stand-in ports are test- and seed-only: the seed loader and test harnesses call them, never product code (Appendix C §3.18; ADR-0007)',
};

/** Test tooling and test support never reach product code (Appendix F §3.8; ADR-0007). */
const TEST_TOOLING = [
  {
    pattern: '@xr/testing{,/**}',
    reason: 'test tooling is for tests only; product code never imports it (ADR-0007)',
  },
  {
    pattern: '@/test-support/**',
    reason: 'test support is for tests only; product code never imports it (ADR-0007)',
  },
];

/** Route files take platform PROVIDERS only (Appendix F §3.8), never the wiring behind them. */
const PLATFORM_WIRING = {
  pattern: '@/platform/{composition,test-hook-bridge}',
  reason:
    'route files use the platform providers; the composition root and the test-hook bridge are reached only through them (Appendix F §3.2, §3.8)',
};

/** Expands `{a,b}` alternatives so the rule's globs stay simple. */
function expand(entry) {
  const match = /\{([^}]*)\}/.exec(entry.pattern);
  if (!match) return [entry];
  return match[1]
    .split(',')
    .flatMap((part) => expand({ ...entry, pattern: entry.pattern.replace(match[0], part) }));
}
const deny = (...entries) => entries.flatMap(expand);

const ROUTE_ALLOW = [
  '@/features/**',
  '@/platform/**',
  '@xr/ui',
  '@xr/ui/*.css',
  'next',
  'next/**',
  'react',
];

/**
 * Explicit, evidence-based exceptions to the fences. Each one names the file, what it may
 * import beyond its fence, why, and when the exception ends.
 */
export const RECORDED_FENCE_EXCEPTIONS = [
  {
    file: 'apps/web/src/app/providers.tsx',
    fence: 'app routes',
    allows: ['@tanstack/react-query'],
    evidence:
      'The QueryClient provider predates the platform folder (1b090c9). Appendix F §2.1 and §3.2 move it into src/platform/platform-provider.tsx with the composition root.',
    removal: 'WP-0.12 (composition root, query layer and session)',
  },
];

function routeFence(extraAllow = []) {
  return {
    fence: 'app routes',
    scope: 'all',
    allow: [...ROUTE_ALLOW, ...extraAllow],
    deny: deny(
      ...SAMPLE_PLATFORM_EVERYWHERE,
      CONTRACT_SUITE,
      STANDINS,
      PLATFORM_WIRING,
      ...TEST_TOOLING,
    ),
  };
}

/** apps/web fences. `appDir` is the absolute path of the app (for relative-import roots). */
export function webFences(appDir) {
  const plugins = { xr: xrPlugin };
  const configs = [
    {
      name: 'xr/fence: application code',
      files: ['src/**/*.{ts,tsx}'],
      ignores: [
        'src/features/**',
        'src/app/**',
        'src/platform/composition.ts',
        'src/platform/test-hook-bridge.ts',
        ...TEST_FILES,
      ],
      plugins,
      rules: {
        'xr/import-fence': [
          'error',
          {
            fence: 'application code',
            deny: deny(...SAMPLE_PLATFORM_EVERYWHERE, CONTRACT_SUITE, STANDINS, ...TEST_TOOLING),
          },
        ],
      },
    },
    {
      name: 'xr/fence: composition root',
      files: ['src/platform/composition.ts'],
      plugins,
      rules: {
        'xr/import-fence': [
          'error',
          {
            fence: 'the composition root',
            deny: deny(
              {
                pattern: '@xr/sample-platform/**',
                reason:
                  'the composition root takes only the root export of @xr/sample-platform; its test seams belong to the test-hook bridge (Appendix F §3.8)',
              },
              CONTRACT_SUITE,
              STANDINS,
              ...TEST_TOOLING,
            ),
          },
        ],
      },
    },
    {
      name: 'xr/fence: test-hook bridge',
      files: ['src/platform/test-hook-bridge.ts'],
      plugins,
      rules: {
        'xr/import-fence': [
          'error',
          {
            fence: 'the test-hook bridge',
            deny: deny(
              {
                pattern: '@xr/sample-platform',
                reason:
                  'the test-hook bridge may import only the ./testing export of @xr/sample-platform (Appendix F §3.8; ADR-0007)',
              },
              {
                pattern: '@xr/sample-platform/**',
                except: ['@xr/sample-platform/testing'],
                reason:
                  'the test-hook bridge may import only the ./testing export of @xr/sample-platform (Appendix F §3.8; ADR-0007)',
              },
              CONTRACT_SUITE,
              STANDINS,
              ...TEST_TOOLING,
            ),
          },
        ],
      },
    },
    // §3.8 lists what features may import from the app and the workspace; that list is the
    // allow-list for `@/…` and `@xr/…`. Other npm packages are governed by the boundary matrix
    // (FORBIDDEN_THIRD_PARTY) plus the denies below: data only through @/queries, no next/*.
    // React itself, and form libraries, stay usable (features are React components; B8-07 forms).
    // `@/features/**` covers the shared feature folder (`features/shared`, Appendix F §3.2).
    {
      name: 'xr/fence: features',
      files: ['src/features/**/*.{ts,tsx}'],
      ignores: TEST_FILES,
      plugins,
      rules: {
        'xr/import-fence': [
          'error',
          {
            fence: 'features',
            root: join(appDir, 'src', 'features'),
            scope: 'project',
            allow: ['@/queries/**', '@/copy/**', '@/nav/**', '@/features/**', '@xr/ui'],
            typeOnly: ['@xr/contracts/draft'],
            vocabulary: { '@xr/domain': DOMAIN_VOCABULARY },
            deny: deny(
              ...SAMPLE_PLATFORM_EVERYWHERE,
              CONTRACT_SUITE,
              STANDINS,
              {
                pattern: '@tanstack/**',
                reason:
                  'screens reach data only through the query layer, @/queries (Appendix F §3.1)',
              },
              {
                pattern: 'next{,/**}',
                reason:
                  'route files resolve params and render the feature; links are injected through @xr/ui (Appendix F §3.2, §3.8)',
              },
              ...TEST_TOOLING,
            ),
          },
        ],
      },
    },
    {
      name: 'xr/fence: app routes',
      files: ['src/app/**/*.{ts,tsx}'],
      ignores: TEST_FILES,
      plugins,
      rules: {
        'xr/import-fence': ['error', { ...routeFence(), root: join(appDir, 'src', 'app') }],
      },
    },
    ...RECORDED_FENCE_EXCEPTIONS.filter((exception) => exception.fence === 'app routes').map(
      (exception) => ({
        name: `xr/fence: recorded exception — ${exception.file}`,
        files: [exception.file.replace(/^apps\/web\//, '')],
        plugins,
        rules: {
          'xr/import-fence': [
            'error',
            { ...routeFence(exception.allows), root: join(appDir, 'src', 'app') },
          ],
        },
      }),
    ),
    {
      name: 'xr: configuration is read once',
      files: ['src/**/*.{ts,tsx}'],
      ignores: ['src/lib/env.ts', ...TEST_FILES],
      plugins,
      rules: { 'xr/no-process-env': 'error' },
    },
    {
      name: 'xr: product styling and canvas leakage',
      files: ['src/**/*.tsx'],
      ignores: TEST_FILES,
      plugins,
      rules: { 'xr/no-raw-hex': 'error', 'xr/no-canvas-classes': 'error' },
    },
    {
      name: 'xr: canvas leakage in product TS',
      files: ['src/**/*.ts'],
      ignores: TEST_FILES,
      plugins,
      rules: { 'xr/no-canvas-classes': 'error' },
    },
  ];
  return configs;
}

/** @xr/ui: components emit v46 classes only; no raw hex; no canvas classes. */
export const uiRules = [
  {
    name: 'xr/ui: v46 classes, no raw hex, no canvas classes',
    files: ['src/**/*.tsx'],
    ignores: TEST_FILES,
    plugins: { xr: xrPlugin },
    rules: {
      'xr/v46-class-names': 'error',
      'xr/no-raw-hex': 'error',
      'xr/no-canvas-classes': 'error',
      'xr/product-class-allow-list': 'error',
    },
  },
  {
    name: 'xr/ui: no canvas classes in TS',
    files: ['src/**/*.ts'],
    ignores: TEST_FILES,
    plugins: { xr: xrPlugin },
    rules: { 'xr/no-canvas-classes': 'error', 'xr/product-class-allow-list': 'error' },
  },
];

/** Deterministic packages: no Math.random, no Date.now (Appendix F §3.8). */
export const determinism = {
  name: 'xr: deterministic rules',
  files: ['src/**/*.ts'],
  ignores: TEST_FILES,
  plugins: { xr: xrPlugin },
  rules: { 'xr/deterministic': 'error' },
};
