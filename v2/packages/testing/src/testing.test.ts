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
  it('targets Chromium against the given base URL', () => {
    const config = createPlaywrightConfig({ baseURL: 'http://127.0.0.1:3000' });
    expect(config.use?.baseURL).toBe('http://127.0.0.1:3000');
    expect(config.projects?.map((project) => project.name)).toEqual(['chromium']);
  });
});
