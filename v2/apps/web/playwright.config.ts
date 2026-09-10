import { createPlaywrightConfig } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);

/**
 * Browser smoke tests against the BUILT web app and the BUILT API, proving the
 * web → API path end to end. Run `pnpm build` at the workspace root first
 * (`pnpm test:e2e` at the root does both).
 */
export default createPlaywrightConfig({
  baseURL: 'http://localhost:3000',
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../api',
      url: 'http://127.0.0.1:4000/api/v1/health',
      reuseExistingServer: !ci,
      timeout: 60_000,
      env: { APP_ENV: 'development', API_PORT: '4000', DATABASE_URL: '' },
    },
    {
      command: 'pnpm exec next start -p 3000',
      url: 'http://127.0.0.1:3000/healthz',
      reuseExistingServer: !ci,
      timeout: 120_000,
    },
  ],
});
