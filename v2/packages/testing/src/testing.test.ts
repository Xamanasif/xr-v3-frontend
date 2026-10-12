import { describe, expect, it } from 'vitest';

import { createPlaywrightConfig } from './playwright.js';
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
