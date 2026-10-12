import { createPlaywrightConfig } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);

/**
 * Browser tests against the BUILT web app only, at the four approved widths. The frontend
 * runs on typed mock services (docs/decisions/ADR-0002), so no API process is started.
 * Run `pnpm build` at the workspace root first (`pnpm test:e2e` at the root does both).
 */
export default createPlaywrightConfig({
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'pnpm exec next start -p 3000',
    url: 'http://127.0.0.1:3000/healthz',
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
