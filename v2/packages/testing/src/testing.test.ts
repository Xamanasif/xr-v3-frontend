import { describe, expect, it } from 'vitest';

import { DEFAULT_E2E_PORTS, createPlaywrightConfig, e2ePorts, localOrigin } from './playwright.js';
import { createVitestConfig } from './vitest.js';

describe('createVitestConfig', () => {
  it('applies the requested environment and keeps workspace defaults', () => {
    const config = createVitestConfig({ environment: 'jsdom' });
    expect(config.test?.environment).toBe('jsdom');
    expect(config.test?.passWithNoTests).toBe(false);
  });

  it('keeps deterministic suites independent of the developer database', () => {
    const config = createVitestConfig();
    expect(config.test?.env).toEqual({ DATABASE_URL: '' });
    expect(config.test?.exclude).toContain('**/*.db.test.{ts,tsx}');
  });

  it('lets environment-dependent suites see the real environment', () => {
    const config = createVitestConfig({
      environmentDependent: true,
      include: ['src/**/*.db.test.ts'],
    });
    expect(config.test?.env).toEqual({});
    expect(config.test?.include).toEqual(['src/**/*.db.test.ts']);
  });

  it('merges Vite-level overrides', () => {
    const config = createVitestConfig({}, { resolve: { alias: { '@': '/src' } } });
    expect(config.resolve?.alias).toEqual({ '@': '/src' });
    expect(config.test?.environment).toBe('node');
  });
});

describe('createPlaywrightConfig', () => {
  it('targets Chromium at the four approved widths against the given base URL', () => {
    const config = createPlaywrightConfig({ baseURL: 'http://127.0.0.1:3000' });
    expect(config.use?.baseURL).toBe('http://127.0.0.1:3000');
    expect(config.projects?.map((project) => project.name)).toEqual([
      'chromium-1440x900',
      'chromium-1024x768',
      'chromium-768x1024',
      'chromium-375x812',
    ]);
    expect(config.projects?.map((project) => project.use?.viewport)).toEqual([
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 },
    ]);
  });

  it('needs no base URL for suites that serve their own fixture pages', () => {
    const config = createPlaywrightConfig({ testDir: './e2e' });
    expect(config.use?.baseURL).toBeUndefined();
    expect(config.projects).toHaveLength(4);
  });

  it('starts a web server only when one is given', () => {
    expect(createPlaywrightConfig({ baseURL: 'http://127.0.0.1:3000' }).webServer).toBeUndefined();
    const withServer = createPlaywrightConfig({
      baseURL: 'http://127.0.0.1:3000',
      webServer: { command: 'pnpm exec next start -p 3000', url: 'http://127.0.0.1:3000/healthz' },
    });
    expect(withServer.webServer).toMatchObject({ url: 'http://127.0.0.1:3000/healthz' });
  });
});

describe('e2ePorts', () => {
  it('keeps 3000 / 3100 / 3200 by default', () => {
    expect(e2ePorts({})).toEqual({ web: 3000, specimens: 3100, testHooks: 3200 });
    expect(DEFAULT_E2E_PORTS).toEqual({ web: 3000, specimens: 3100, testHooks: 3200 });
  });

  it('moves a port by its variable, so a second checkout can test beside running servers', () => {
    expect(
      e2ePorts({
        XR_E2E_WEB_PORT: '3300',
        XR_E2E_SPECIMENS_PORT: '3400',
        XR_E2E_TEST_HOOKS_PORT: '3500',
      }),
    ).toEqual({ web: 3300, specimens: 3400, testHooks: 3500 });
    expect(localOrigin(3300)).toBe('http://localhost:3300');
  });

  it('refuses a value that is not a usable port, and two suites on one port', () => {
    expect(() => e2ePorts({ XR_E2E_WEB_PORT: 'abc' })).toThrow('XR_E2E_WEB_PORT');
    expect(() => e2ePorts({ XR_E2E_WEB_PORT: '80' })).toThrow('1024 to 65535');
    expect(() => e2ePorts({ XR_E2E_SPECIMENS_PORT: '3000' })).toThrow('must differ');
  });
});
