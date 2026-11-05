/**
 * next.config.ts — the build flags and the test-hook alias (TE-7; ADR-0007 §2; Appendix F §3.2,
 * §3.8), loaded for real under each flag value. The built-output proof that product chunks hold
 * no hook code is `e2e/platform/test-hook-isolation.spec.ts` and `pnpm verify` (bundle).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { NextConfig } from 'next';
import { afterEach, describe, expect, it, vi } from 'vitest';

const appRoot = join(import.meta.dirname, '..', '..');

async function loadConfig(env: Record<string, string | undefined>): Promise<NextConfig> {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_XR_TEST_HOOKS', env.NEXT_PUBLIC_XR_TEST_HOOKS ?? '');
  vi.stubEnv('NEXT_PUBLIC_XR_DATA_SOURCE', env.NEXT_PUBLIC_XR_DATA_SOURCE ?? '');
  vi.stubEnv('NEXT_PUBLIC_APP_ENV', env.NEXT_PUBLIC_APP_ENV ?? '');
  return (await import('../../next.config')).default;
}

const aliasOf = (config: NextConfig) =>
  (config.turbopack?.resolveAlias as Record<string, string> | undefined)?.['@/platform/test-hooks'];

afterEach(() => vi.unstubAllEnvs());

describe('next.config.ts', () => {
  it('a product build resolves the test-hook seam to the empty stub, in .next', async () => {
    const config = await loadConfig({});
    expect(aliasOf(config)).toBe('./src/platform/test-hooks.ts');
    expect(config.distDir).toBeUndefined();
    expect(config.reactStrictMode).toBe(true);
    expect(existsSync(join(appRoot, aliasOf(config)!))).toBe(true);
  });

  it('a dedicated test-hook build resolves the bridge, in its own .next-test-hooks', async () => {
    const config = await loadConfig({ NEXT_PUBLIC_XR_TEST_HOOKS: '1' });
    expect(aliasOf(config)).toBe('./src/platform/test-hook-bridge.ts');
    expect(config.distDir).toBe('.next-test-hooks');
    expect(existsSync(join(appRoot, aliasOf(config)!))).toBe(true);
  });

  it.each(['true', '0', 'yes'])('refuses NEXT_PUBLIC_XR_TEST_HOOKS=%s', async (value) => {
    await expect(loadConfig({ NEXT_PUBLIC_XR_TEST_HOOKS: value })).rejects.toThrow(
      /NEXT_PUBLIC_XR_TEST_HOOKS: must be 1/,
    );
  });

  it('refuses an unknown data source', async () => {
    await expect(loadConfig({ NEXT_PUBLIC_XR_DATA_SOURCE: 'mock' })).rejects.toThrow(
      /NEXT_PUBLIC_XR_DATA_SOURCE/,
    );
  });

  it('builds for api as a development build, with the empty test-hook stub (ADR-0014)', async () => {
    const config = await loadConfig({ NEXT_PUBLIC_XR_DATA_SOURCE: 'api' });
    expect(aliasOf(config)).toBe('./src/platform/test-hooks.ts');
    expect(config.distDir).toBeUndefined();
  });

  it('refuses an api build outside development: product builds stay on sample', async () => {
    for (const environment of ['staging', 'production']) {
      await expect(
        loadConfig({ NEXT_PUBLIC_XR_DATA_SOURCE: 'api', NEXT_PUBLIC_APP_ENV: environment }),
      ).rejects.toThrow(/an api build is a development build/);
    }
  });

  it('refuses an api build with the test hooks (the flag schema): they drive the sample world only', async () => {
    await expect(
      loadConfig({ NEXT_PUBLIC_XR_DATA_SOURCE: 'api', NEXT_PUBLIC_XR_TEST_HOOKS: '1' }),
    ).rejects.toThrow(
      /the test hooks drive the sample world; they need NEXT_PUBLIC_XR_DATA_SOURCE=sample/,
    );
  });
});
