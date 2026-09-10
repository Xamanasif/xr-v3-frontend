import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export interface PlaywrightConfigOptions {
  baseURL: string;
  testDir?: string;
  webServer?: PlaywrightTestConfig['webServer'];
}

/** Workspace-wide Playwright defaults: Chromium, traces on retry, CI-aware reporters. */
export function createPlaywrightConfig(options: PlaywrightConfigOptions): PlaywrightTestConfig {
  const ci = Boolean(process.env['CI']);
  return defineConfig({
    testDir: options.testDir ?? './e2e',
    fullyParallel: true,
    forbidOnly: ci,
    retries: ci ? 2 : 0,
    reporter: ci ? [['github'], ['html', { open: 'never' }]] : [['list']],
    use: {
      baseURL: options.baseURL,
      trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    ...(options.webServer ? { webServer: options.webServer } : {}),
  });
}
