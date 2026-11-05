/**
 * The platform of one browser tab (BC14; ADR-0004 option A; Appendix F §4.2): one sample world,
 * one QueryClient and one session store per tab, created once and kept for the life of the page.
 *
 * They live in this module, not in React state: a re-render, a remount of the providers, React
 * Strict Mode's double effects and client-side navigation all reach the same instances, and the
 * boot runs once however often it is asked for. A reload or a full navigation starts a new page:
 * signed out, with the world from the seed (AD-07 option A) — or, in a local prototype build, the
 * world this browser kept (TE-6, owner authorisation of Phase 7, 17 Oct 2026) and the visitor's own
 * request tickets kept beside it (owner decision, 24 Oct 2026; ADR-0009 amendment). On the server
 * nothing is composed: the world exists only in the browser, and each server render gets its own
 * empty QueryClient.
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
  KEPT_REQUEST_TICKETS_KEY,
  type PlatformCapabilities,
  queryDefaultsFor,
  SAMPLE_WORLD_STORAGE_KEY,
} from './composition';
import { relaySampleWebActivity, SAMPLE_WEB_CHANNEL } from './sample-web-relay';
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
  /**
   * TE-6 "Reset demo data" (a local prototype build with the browser snapshot; else `null`): the
   * saved world, the request tickets kept beside it, this tab's selection and request tickets are
   * removed once no command is running;
   * the caller then loads a page, which starts the clean world, signed out. Other tabs start again.
   */
  readonly resetSampleWorld: (() => Promise<void>) | null;
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
  const snapshot = composed.sample?.snapshot ?? null;
  return {
    ports: synced(composed.adapter.ports),
    withCommandId: (commandId) => synced(composed.adapter.withCommandId(commandId)),
    newCommandId: () => composed.adapter.newCommandId(),
    queryClient,
    session,
    capabilities: composed.capabilities,
    invalidate: (changed) => invalidateChanged(queryClient, changed),
    resetSampleWorld: snapshot ? () => snapshot.clear() : null,
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

/**
 * TE-6 (a local prototype build): `localStorage` for the world snapshot, if usable. A test-hook
 * build never keeps one: its tests start from their own fixtures (ADR-0007).
 */
function browserLocalStorage(): Storage | null {
  if (testHooks) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** TE-6: the browser's Web Locks, so the tabs of one browser change the world one at a time. */
function browserLock(): (<T>(work: () => T) => Promise<T>) | undefined {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks) return undefined;
  return <T>(work: () => T) => locks.request('xr.sample-world', () => work()) as Promise<T>;
}

/** TE-3: the sample WEB activity's address for one launch (a page of this app, a new tab). */
function webActivityHref(launch: string): string {
  const address = new URL('/prototype/web-activity', window.location.origin);
  address.searchParams.set('launch', launch);
  return address.href;
}

/**
 * TE-6: the tabs of one browser share the saved world. Another tab's save is adopted (every answer
 * may have changed: the session and the queries are read again); a reset in another tab, or a
 * snapshot removed, starts this page again — from the clean world, signed out. A request ticket
 * another tab of this browser kept for the visitor is taken up the same way (ADR-0009 amendment).
 */
function connectSnapshot(composed: ComposedPlatform, runtime: PlatformRuntime): void {
  const snapshot = composed.sample?.snapshot;
  if (!snapshot) return;
  snapshot.onAdopted(() => {
    // A reset landing in between makes this read refuse; the page then loads again anyway.
    runtime.session.refresh().catch(() => undefined);
    void runtime.queryClient.invalidateQueries();
  });
  snapshot.onForeign(() => window.location.reload());
  window.addEventListener('storage', (event) => {
    if (
      event.key === SAMPLE_WORLD_STORAGE_KEY ||
      event.key === KEPT_REQUEST_TICKETS_KEY ||
      event.key === null
    ) {
      snapshot.sync();
    }
  });
  // A save another tab made while this page was starting, before it listened: adopted now.
  snapshot.sync();
}

/** TE-3: this tab answers the sample WEB activities it launched (`sample-web-relay.ts`). */
function connectSampleWebActivity(composed: ComposedPlatform, runtime: PlatformRuntime): void {
  const web = composed.sample?.sampleWebRuntime;
  if (!web || typeof BroadcastChannel === 'undefined') return;
  relaySampleWebActivity({
    runtime: web,
    channel: new BroadcastChannel(SAMPLE_WEB_CHANNEL),
    invalidate: (changed) => runtime.invalidate(changed),
  });
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
 * expired — named apart, they are never honoured here. In a local prototype build the visitor's own
 * tickets are kept beside the saved world instead, bound to its lineage, not to this name
 * (ADR-0009 amendment).
 */
function newWorldInstance(): string {
  return `world-${randomHex(8)}`;
}

async function start(): Promise<PlatformRuntime> {
  const prepared = testHooks ? await testHooks.prepare() : null;
  const composed = composePlatform({
    dataSource: publicEnv.NEXT_PUBLIC_XR_DATA_SOURCE,
    apiBaseUrl: publicEnv.NEXT_PUBLIC_API_BASE_URL,
    appEnvironment: publicEnv.NEXT_PUBLIC_APP_ENV,
    realNow: () => Date.now(),
    browserStorage: browserSessionStorage(),
    worldInstance: newWorldInstance(),
    ...(prepared ? { world: prepared.world } : {}),
    worldStorage: browserLocalStorage(),
    lineage: `lineage-${randomHex(8)}`,
    ...(browserLock() ? { lock: browserLock()! } : {}),
    // A test-hook build keeps the published WEB link: its specs report runtime activity through
    // the CI-only seam, from their own fixtures (ADR-0007).
    ...(testHooks ? {} : { webActivityHref }),
  });
  const runtime = assembleRuntime({
    composed,
    queryClient: getQueryClient(),
    publicSessionKey: newPublicSessionKey(),
  });
  connectSnapshot(composed, runtime);
  connectSampleWebActivity(composed, runtime);
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
