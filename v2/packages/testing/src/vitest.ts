import { availableParallelism, totalmem } from 'node:os';

import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config';

/**
 * How many test files run at once. A jsdom worker with the product's pages holds about 1.5–2 GB at
 * its peak, so on a machine with little memory the default (one worker per CPU) swaps, and long
 * interaction tests time out for no reason of their own (UX-22: 33 timeouts at 12 workers on an
 * 8 GB, 12-thread Windows laptop; none of them reproduced alone). One worker per 2 GB, at most one
 * per CPU less one, at least one: a large machine keeps its parallelism, a small one stops swapping.
 */
export function workerCount(memoryBytes = totalmem(), cpus = availableParallelism()): number {
  return Math.max(1, Math.min(cpus - 1, Math.floor(memoryBytes / 2 ** 31)));
}

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
      maxWorkers: workerCount(),
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
