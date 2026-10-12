import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export interface PlaywrightConfigOptions {
  baseURL: string;
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
      baseURL: options.baseURL,
      trace: 'on-first-retry',
    },
    projects: REVIEW_VIEWPORTS.map(({ name, width, height }) => ({
      name,
      use: { ...devices['Desktop Chrome'], viewport: { width, height } },
    })),
    ...(options.webServer ? { webServer: options.webServer } : {}),
  });
}
