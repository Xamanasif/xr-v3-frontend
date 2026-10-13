import { createPlaywrightConfig } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);

/**
 * Browser tests against the BUILT web app only, at the four approved widths. The frontend
 * runs on typed mock services (docs/decisions/ADR-0002), so no API process is started.
 *
 * Two builds are served: the product build (`.next`, port 3000, every suite's baseURL) and the
 * dedicated test-hook build (`.next-test-hooks`, port 3200, `TEST_HOOKS_URL`) that only the
 * bridge suites use (ADR-0007 §2). Run `pnpm build` and `pnpm --filter @xr/web build:test-hooks`
 * first (`pnpm test:e2e` at the root does both).
 */
export default createPlaywrightConfig({
  baseURL: 'http://localhost:3000',
  webServer: [
    {
      command: 'pnpm exec next start -p 3000',
      url: 'http://127.0.0.1:3000/healthz',
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
    {
      command: 'node scripts/next-with-test-hooks.mjs start -p 3200',
      url: 'http://127.0.0.1:3200/healthz',
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
  ],
});
