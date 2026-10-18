import { createPlaywrightConfig, e2ePorts, localOrigin } from '@xr/testing/playwright';

const ci = Boolean(process.env.CI);
const { specimens: port } = e2ePorts();

/**
 * The specimen harness at the four approved widths. Its own port: the harness is a separate
 * app from the product (VD-17); `XR_E2E_SPECIMENS_PORT` moves it (`e2ePorts`, @xr/testing). Run
 * `pnpm build` at the workspace root first.
 */
export default createPlaywrightConfig({
  baseURL: localOrigin(port),
  webServer: {
    command: `pnpm exec next start -p ${port}`,
    url: `http://127.0.0.1:${port}/harness-probe`,
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
});
