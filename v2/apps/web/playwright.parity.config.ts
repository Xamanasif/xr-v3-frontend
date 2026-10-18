import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';
import { e2ePorts, localOrigin } from '@xr/testing/playwright';

import { RUNS_ROOT } from '../../tools/board-capture/src/paths.mjs';

/**
 * The Phase-0 visual-parity suite of the built screens (WP-0.15; Appendix F §7.5): the v46
 * boards rendered offline by the test-only board-capture harness (`v2/tools/board-capture`)
 * against the real Next.js screens of the dedicated test-hook build, in the same run, on the same
 * machine, in the same Chromium, with the same vendored Public Sans files (VD-18 local interim).
 *
 * Separate from the four-width functional suites (`playwright.config.ts`): one Chromium project,
 * the viewport is set per test (board frame width × 900). References are never written from the
 * product (`updateSnapshots: 'none'`); every run keeps its artefacts in its own git-ignored folder.
 */
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
process.env.XR_PARITY_RUN_DIR ??= join(RUNS_ROOT, `${stamp}-web`);
const run = process.env.XR_PARITY_RUN_DIR;
const ci = Boolean(process.env.CI);
const ports = e2ePorts();

export default defineConfig({
  testDir: './e2e/parity',
  testMatch: '**/*.parity.ts',
  outputDir: join(run, 'results'),
  snapshotPathTemplate: join(run, 'references', '{arg}{ext}'),
  updateSnapshots: 'none',
  fullyParallel: true,
  forbidOnly: ci,
  retries: 0,
  // One test opens a board and compares many specimens in turn.
  timeout: 300_000,
  reporter: [['list'], ['json', { outputFile: join(run, 'report.json') }]],
  globalSetup: './e2e/parity/global-setup.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: localOrigin(ports.testHooks),
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    colorScheme: 'light',
    locale: 'en-GB',
    timezoneId: 'Asia/Kolkata',
    trace: 'off',
  },
  projects: [{ name: 'parity-chromium' }],
  webServer: {
    command: `node scripts/next-with-test-hooks.mjs start -p ${ports.testHooks}`,
    url: `http://127.0.0.1:${ports.testHooks}/healthz`,
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
