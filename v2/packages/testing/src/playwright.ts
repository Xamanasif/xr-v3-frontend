import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export interface PlaywrightConfigOptions {
  /** Optional: suites that load their own fixture pages (route-fulfilled) have no server. */
  baseURL?: string;
  testDir?: string;
  /** Optional: suites that need no server (or start their own) omit it. */
  webServer?: PlaywrightTestConfig['webServer'];
}

/**
 * The four widths every v46 board is approved at (design/handoff-v46: 1440 · 1024 · 768 · 375).
 * Layout is driven by container queries, so the viewport width is what matters.
 */
export const REVIEW_VIEWPORTS = [
  { name: 'chromium-1440x900', width: 1440, height: 900 },
  { name: 'chromium-1024x768', width: 1024, height: 768 },
  { name: 'chromium-768x1024', width: 768, height: 1024 },
  { name: 'chromium-375x812', width: 375, height: 812 },
] as const;

/**
 * Workspace-wide Playwright defaults: Chromium at the four approved widths, traces on
 * retry, CI-aware reporters.
 */
export function createPlaywrightConfig(options: PlaywrightConfigOptions): PlaywrightTestConfig {
  const ci = Boolean(process.env['CI']);
  return defineConfig({
    testDir: options.testDir ?? './e2e',
    fullyParallel: true,
    forbidOnly: ci,
    retries: ci ? 2 : 0,
    reporter: ci ? [['github'], ['html', { open: 'never' }]] : [['list']],
    use: {
      ...(options.baseURL ? { baseURL: options.baseURL } : {}),
      trace: 'on-first-retry',
    },
    projects: REVIEW_VIEWPORTS.map(({ name, width, height }) => ({
      name,
      use: { ...devices['Desktop Chrome'], viewport: { width, height } },
    })),
    ...(options.webServer ? { webServer: options.webServer } : {}),
  });
}

/** The local ports the browser suites serve their builds on. */
export interface E2ePorts {
  /** The product build (`apps/web` `.next`): 3000. */
  readonly web: number;
  /** The specimen harness (`apps/specimens`): 3100. */
  readonly specimens: number;
  /** The dedicated test-hook build (`apps/web` `.next-test-hooks`): 3200. */
  readonly testHooks: number;
}

export const DEFAULT_E2E_PORTS: E2ePorts = { web: 3000, specimens: 3100, testHooks: 3200 };

/** The environment variables that move a port (one worktree beside another's running servers). */
export const E2E_PORT_VARIABLES: Readonly<Record<keyof E2ePorts, string>> = {
  web: 'XR_E2E_WEB_PORT',
  specimens: 'XR_E2E_SPECIMENS_PORT',
  testHooks: 'XR_E2E_TEST_HOOKS_PORT',
};

/**
 * The ports for this run: the defaults, or the values of `XR_E2E_WEB_PORT`,
 * `XR_E2E_SPECIMENS_PORT` and `XR_E2E_TEST_HOOKS_PORT`, so a second checkout can run its suites
 * while another checkout's servers keep their ports. A value that is not a whole number from 1024 to
 * 65535 is an error, never a silent fallback.
 */
export function e2ePorts(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): E2ePorts {
  const read = (key: keyof E2ePorts): number => {
    const name = E2E_PORT_VARIABLES[key];
    const raw = environment[name];
    if (raw === undefined || raw === '') return DEFAULT_E2E_PORTS[key];
    if (!/^\d+$/.test(raw) || Number(raw) < 1024 || Number(raw) > 65535) {
      throw new Error(`${name} must be a port from 1024 to 65535, not "${raw}"`);
    }
    return Number(raw);
  };
  const ports = { web: read('web'), specimens: read('specimens'), testHooks: read('testHooks') };
  if (new Set(Object.values(ports)).size !== 3) {
    throw new Error(`the e2e ports must differ: ${JSON.stringify(ports)}`);
  }
  return ports;
}

/** `http://localhost:<port>`, the origin a suite's pages load from. */
export function localOrigin(port: number): string {
  return `http://localhost:${port}`;
}
