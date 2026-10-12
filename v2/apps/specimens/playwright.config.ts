import { createPlaywrightConfig } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);

/**
 * The specimen harness at the four approved widths. Its own port: the harness is a separate
 * app from the product (VD-17). Run `pnpm build` at the workspace root first.
 */
export default createPlaywrightConfig({
  baseURL: 'http://localhost:3100',
  webServer: {
    command: 'pnpm exec next start -p 3100',
    url: 'http://127.0.0.1:3100/harness-probe',
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
