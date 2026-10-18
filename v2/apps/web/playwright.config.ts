import { createPlaywrightConfig, e2ePorts, localOrigin } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);
const ports = e2ePorts();

/**
 * Browser tests against the BUILT web app only, at the four approved widths. The frontend
 * runs on typed mock services (docs/decisions/ADR-0002), so no API process is started.
 *
 * Two builds are served: the product build (`.next`, port 3000, every suite's baseURL) and the
 * dedicated test-hook build (`.next-test-hooks`, port 3200, `TEST_HOOKS_URL`) that only the
 * bridge suites use (ADR-0007 §2). Run `pnpm build` and `pnpm --filter @xr/web build:test-hooks`
 * first (`pnpm test:e2e` at the root does both). `XR_E2E_WEB_PORT` / `XR_E2E_TEST_HOOKS_PORT` move
 * the two servers, so a second checkout can run its suites while another checkout's servers keep
 * their ports (`e2ePorts`, @xr/testing).
 */
export default createPlaywrightConfig({
  baseURL: localOrigin(ports.web),
  webServer: [
    {
      command: `pnpm exec next start -p ${ports.web}`,
      url: `http://127.0.0.1:${ports.web}/healthz`,
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
    {
      command: `node scripts/next-with-test-hooks.mjs start -p ${ports.testHooks}`,
      url: `http://127.0.0.1:${ports.testHooks}/healthz`,
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
  ],
});
