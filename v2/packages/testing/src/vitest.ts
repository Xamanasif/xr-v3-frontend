import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';

export interface VitestConfigOptions {
  /** `node` for libraries and the API; `jsdom` for React components and pages. */
  environment?: 'node' | 'jsdom';
  include?: string[];
  setupFiles?: string[];
  /**
   * Unit suites are cached by Turbo as deterministic, so by default they run with
   * DATABASE_URL blanked: a result must never depend on whichever database the
   * developer happened to have configured. Suites that genuinely need the
   * environment (database-backed checks) declare it and run through an uncached task.
   */
  environmentDependent?: boolean;
}

/**
 * Workspace-wide Vitest defaults. Each package passes its environment and any
 * Vite-level overrides (plugins, aliases); everything else stays consistent.
 */
export function createVitestConfig(
  options: VitestConfigOptions = {},
  overrides: ViteUserConfig = {},
): ViteUserConfig {
  const base = defineConfig({
    test: {
      environment: options.environment ?? 'node',
      include: options.include ?? ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
      exclude: options.environmentDependent ? [] : ['**/node_modules/**', '**/*.db.test.{ts,tsx}'],
      setupFiles: options.setupFiles ?? [],
      passWithNoTests: false,
      env: options.environmentDependent ? {} : { DATABASE_URL: '' },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        reportsDirectory: 'coverage',
      },
    },
  });
  return mergeConfig(base, overrides);
}
