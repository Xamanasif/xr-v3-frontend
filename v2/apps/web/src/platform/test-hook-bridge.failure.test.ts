/**
 * A test-hook boot that fails is reported as a failed boot — not as a build without the bridge
 * (the Playwright helpers wait for the handle, then surface this message). Its own file: one tab,
 * one boot.
 */
import { describe, expect, it, vi } from 'vitest';

import { BOOT_DESCRIPTOR_GLOBAL, TEST_HOOKS_GLOBAL } from './test-hook-bridge';

vi.mock('@/platform/test-hooks', async () => await import('./test-hook-bridge'));

const { bootPlatform, getBootState } = await import('./runtime');

describe('a failed test-hook boot', () => {
  it('fails the boot and answers every hook call with the reason', async () => {
    Reflect.set(window, BOOT_DESCRIPTOR_GLOBAL, {
      fixture: 'spine-start',
      session: { personId: 'per-nobody' },
    });
    await expect(bootPlatform()).rejects.toThrow(
      'No sample person with id per-nobody in this world.',
    );
    expect(getBootState().status).toBe('failed');

    const handle = Reflect.get(window, TEST_HOOKS_GLOBAL) as {
      actAs(personId: string, command: unknown): Promise<unknown>;
      inspect(): Promise<unknown>;
    };
    const reason = 'The test-hook boot failed: No sample person with id per-nobody in this world.';
    await expect(
      handle.actAs('sa-arjun-mehta', { port: 'session', method: 'getSession' }),
    ).rejects.toThrow(reason);
    await expect(handle.inspect()).rejects.toThrow(reason);
  });
});
