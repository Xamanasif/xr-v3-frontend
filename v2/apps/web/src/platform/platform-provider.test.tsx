/**
 * One world and one QueryClient per browser tab (BC14; ADR-0004 option A; Appendix F §4.2):
 * Strict Mode, re-renders, a second provider and a remount (what a client-side navigation that
 * swaps layouts does at worst) all reach the same instances, with the world's state kept. Each
 * test is a fresh tab: the runtime module is evaluated anew.
 */
import { useQueryClient } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from './runtime';

const created = vi.hoisted(() => ({ count: 0 }));

vi.mock('@xr/sample-platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xr/sample-platform')>();
  return {
    ...actual,
    createSamplePlatform: (...args: Parameters<typeof actual.createSamplePlatform>) => {
      created.count += 1;
      return actual.createSamplePlatform(...args);
    },
  };
});

/** A new tab: fresh module state for the runtime and its providers. */
async function newTab() {
  vi.resetModules();
  const provider = await import('./platform-provider');
  const runtime = await import('./runtime');
  const seen = { runtimes: new Set<PlatformRuntime>(), clients: new Set<unknown>() };
  function Probe() {
    const platform = provider.usePlatform();
    const session = provider.useSession();
    const client = useQueryClient();
    useEffect(() => {
      if (platform) seen.runtimes.add(platform);
      seen.clients.add(client);
    });
    return <p>{`${platform ? 'ready' : 'booting'} · ${session.status}`}</p>;
  }
  return { ...provider, ...runtime, Probe, seen };
}

afterEach(() => {
  created.count = 0;
  vi.doUnmock('@/lib/env');
});

describe('PlatformProvider — one platform per tab', () => {
  it('Strict Mode boots one world and one QueryClient', async () => {
    const tab = await newTab();
    render(
      <StrictMode>
        <tab.PlatformProvider>
          <tab.Probe />
        </tab.PlatformProvider>
      </StrictMode>,
    );
    expect(screen.getByText('booting · unknown')).toBeInTheDocument();
    await screen.findByText('ready · signed-out');
    expect(created.count).toBe(1);
    expect(tab.seen.runtimes.size).toBe(1);
    expect(tab.seen.clients.size).toBe(1);
    const [runtime] = tab.seen.runtimes;
    expect(tab.seen.clients.has(runtime!.queryClient)).toBe(true);
    expect(tab.getQueryClient()).toBe(runtime!.queryClient);
  });

  it('re-rendering and a second provider reuse the same world and QueryClient', async () => {
    const tab = await newTab();
    const view = render(
      <tab.PlatformProvider>
        <tab.Probe />
      </tab.PlatformProvider>,
    );
    await screen.findByText('ready · signed-out');
    for (let index = 0; index < 3; index += 1) {
      view.rerender(
        <tab.PlatformProvider>
          <tab.Probe key={index} />
          <tab.PlatformProvider>
            <tab.Probe />
          </tab.PlatformProvider>
        </tab.PlatformProvider>,
      );
    }
    await waitFor(() => expect(screen.getAllByText('ready · signed-out')).toHaveLength(2));
    expect(created.count).toBe(1);
    expect(tab.seen.runtimes.size).toBe(1);
    expect(tab.seen.clients.size).toBe(1);
  });

  it('a remount keeps the world, its records and the signed-in person; nothing is rebuilt', async () => {
    const tab = await newTab();
    const first = render(
      <tab.PlatformProvider>
        <tab.Probe />
      </tab.PlatformProvider>,
    );
    await screen.findByText('ready · signed-out');
    const runtime = await tab.bootPlatform();
    await act(async () => {
      const signedIn = await runtime.ports.session.signIn({
        method: 'email',
        email: 'arjun.mehta@wilp.example',
        password: 'any-sample-password',
      });
      expect(signedIn.ok).toBe(true);
    });
    const detail = await runtime.ports.institutions.getInstitution('deccan' as never);
    if (!detail.ok) throw new Error('getInstitution refused');
    const paused = await runtime.ports.institutions.pauseInstitution({
      institutionId: detail.value.institution.id,
      reason: 'Checking the student list.',
      expectedRev: detail.value.institution.rev,
    });
    expect(paused.ok).toBe(true);

    first.unmount();
    render(
      <tab.PlatformProvider>
        <tab.Probe />
      </tab.PlatformProvider>,
    );
    await screen.findByText('ready · signed-in');
    expect(created.count).toBe(1);
    expect(await tab.bootPlatform()).toBe(runtime);
    expect(tab.seen.runtimes.size).toBe(1);
    const after = await runtime.ports.institutions.getInstitution('deccan' as never);
    expect(after.ok && after.value.institution.pause).not.toBeNull();
  });

  it('boots once however often it is asked', async () => {
    const tab = await newTab();
    const boots = [tab.bootPlatform(), tab.bootPlatform(), tab.bootPlatform()];
    expect(new Set(boots).size).toBe(1);
    const runtime = await boots[0];
    expect(await tab.bootPlatform()).toBe(runtime);
    expect(created.count).toBe(1);
    expect(tab.getBootState()).toEqual({ status: 'ready', runtime });
  });

  it('the api data source boots on the HTTP adapter, signed out; the sample world is never created', async () => {
    vi.resetModules();
    vi.doMock('@/lib/env', () => ({
      publicEnv: {
        NEXT_PUBLIC_API_BASE_URL: 'http://localhost:4000',
        NEXT_PUBLIC_APP_ENV: 'development',
        NEXT_PUBLIC_XR_DATA_SOURCE: 'api',
      },
    }));
    const { bootPlatform } = await import('./runtime');
    const runtime = await bootPlatform();
    expect(runtime.capabilities).toEqual({ dataSource: 'api', persistence: 'server' });
    expect(runtime.resetSampleWorld).toBeNull();
    expect(await runtime.ports.session.getSession()).toEqual({
      ok: true,
      value: null,
      changed: [],
    });
    expect(created.count).toBe(0);
  });

  it('on the server nothing is composed and every render gets its own empty QueryClient', async () => {
    const tab = await newTab();
    vi.stubGlobal('window', undefined);
    try {
      const one = tab.getQueryClient();
      expect(tab.getQueryClient()).not.toBe(one);
      await expect(tab.bootPlatform()).rejects.toThrow(/browser tab only/);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(created.count).toBe(0);
  });
});
