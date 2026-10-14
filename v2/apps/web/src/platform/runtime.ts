/**
 * The platform of one browser tab (BC14; ADR-0004 option A; Appendix F §4.2): one sample world,
 * one QueryClient and one session store per tab, created once and kept for the life of the page.
 *
 * They live in this module, not in React state: a re-render, a remount of the providers, React
 * Strict Mode's double effects and client-side navigation all reach the same instances, and the
 * boot runs once however often it is asked for. A reload or a full navigation starts a new page,
 * which rebuilds the world from the seed, signed out (AD-07 option A). On the server nothing is
 * composed: the world exists only in the browser, and each server render gets its own empty
 * QueryClient.
 */
import { QueryClient } from '@tanstack/react-query';
import type { DataSource } from '@xr/config/env';
import type { ProductPorts } from '@xr/contracts/draft';
import type { RecordRef } from '@xr/domain';

import { publicEnv } from '@/lib/env';
import { testHooks } from '@/platform/test-hooks';
import { invalidateChanged } from '@/queries/invalidation';

import {
  type ComposedPlatform,
  composePlatform,
  type PlatformCapabilities,
  queryDefaultsFor,
} from './composition';
import { createSessionStore, type SessionStore } from './session-store';

/** What the providers expose to the app (Appendix F §3.2 `platform-provider.tsx`). */
export interface PlatformRuntime {
  /** The ports of this tab's session; sign-in and sign-out go through the session store. */
  readonly ports: ProductPorts;
  withCommandId(commandId: string): ProductPorts;
  newCommandId(): string;
  readonly queryClient: QueryClient;
  readonly session: SessionStore;
  readonly capabilities: PlatformCapabilities;
  /** The one invalidation path: the record refs a command receipt changed (Appendix F §4.6). */
  invalidate(changed: readonly RecordRef[]): Promise<void>;
}

export type BootState =
  | { readonly status: 'booting' }
  | { readonly status: 'ready'; readonly runtime: PlatformRuntime }
  | { readonly status: 'failed'; readonly error: unknown };

export const BOOTING: BootState = Object.freeze({ status: 'booting' });

export function createQueryClient(dataSource: DataSource): QueryClient {
  return new QueryClient({ defaultOptions: queryDefaultsFor(dataSource) });
}

/** Puts a composed adapter, a QueryClient and a session store together (pure; tests use it too). */
export function assembleRuntime(options: {
  readonly composed: ComposedPlatform;
  readonly queryClient: QueryClient;
  readonly publicSessionKey: string;
}): PlatformRuntime {
  const { composed, queryClient } = options;
  const session = createSessionStore({
    session: composed.adapter.ports.session,
    queryClient,
    publicSessionKey: options.publicSessionKey,
  });
  const synced = (ports: ProductPorts): ProductPorts => ({
    ...ports,
    session: session.port(ports.session),
  });
  return {
    ports: synced(composed.adapter.ports),
    withCommandId: (commandId) => synced(composed.adapter.withCommandId(commandId)),
    newCommandId: () => composed.adapter.newCommandId(),
    queryClient,
    session,
    capabilities: composed.capabilities,
    invalidate: (changed) => invalidateChanged(queryClient, changed),
  };
}

// ---- the one per tab (browser only) ----

const inBrowser = (): boolean => typeof window !== 'undefined';

let browserQueryClient: QueryClient | undefined;
let state: BootState = BOOTING;
let boot: Promise<PlatformRuntime> | undefined;
const listeners = new Set<() => void>();

/** The tab's QueryClient in the browser; a new one for each server render. */
export function getQueryClient(): QueryClient {
  const dataSource = publicEnv.NEXT_PUBLIC_XR_DATA_SOURCE;
  if (!inBrowser()) return createQueryClient(dataSource);
  browserQueryClient ??= createQueryClient(dataSource);
  return browserQueryClient;
}

export function subscribeBoot(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getBootState = (): BootState => state;

function publish(next: BootState): void {
  state = next;
  for (const listener of [...listeners]) listener();
}

/** `sessionStorage` for the selection basket and request tickets only (ADR-0004 §2), if usable. */
function browserSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** An opaque id for this tab's visitor partition (`public:<browser-session-id>`). */
function newPublicSessionKey(): string {
  return `public:bs-${randomHex(8)}`;
}

/**
 * The name of this page load's world (ADR-0009): every load builds a new world from the seed
 * (ADR-0004 option A), so the request tickets kept in `sessionStorage` from an earlier load have
 * expired — named apart, they are never honoured here.
 */
function newWorldInstance(): string {
  return `world-${randomHex(8)}`;
}

async function start(): Promise<PlatformRuntime> {
  const prepared = testHooks ? await testHooks.prepare() : null;
  const composed = composePlatform({
    dataSource: publicEnv.NEXT_PUBLIC_XR_DATA_SOURCE,
    appEnvironment: publicEnv.NEXT_PUBLIC_APP_ENV,
    realNow: () => Date.now(),
    browserStorage: browserSessionStorage(),
    worldInstance: newWorldInstance(),
    ...(prepared ? { world: prepared.world } : {}),
  });
  const runtime = assembleRuntime({
    composed,
    queryClient: getQueryClient(),
    publicSessionKey: newPublicSessionKey(),
  });
  testHooks?.attach({ composed, runtime, prepared });
  await runtime.session.refresh();
  return runtime;
}

/**
 * Boots this tab's platform once; every later call answers the same promise. Browser only: the
 * sample world never exists on the server.
 */
export function bootPlatform(): Promise<PlatformRuntime> {
  if (!inBrowser()) {
    return Promise.reject(new Error('The sample world lives in the browser tab only (ADR-0004).'));
  }
  boot ??= start().then(
    (runtime) => {
      testHooks?.settle({ ok: true });
      publish(Object.freeze({ status: 'ready', runtime }));
      return runtime;
    },
    (error: unknown) => {
      testHooks?.settle({ ok: false, error });
      publish(Object.freeze({ status: 'failed', error }));
      throw error;
    },
  );
  return boot;
}
