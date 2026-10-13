'use client';

/**
 * The platform provider (Appendix F §3.2; Appendix D §1.2): the tab's service ports, its
 * session (snapshot and subscription), the shared QueryClient and the platform capabilities.
 * One instance of each per browser tab (BC14) — they come from `runtime.ts`, so mounting this
 * provider again, re-rendering it or navigating client-side never creates a second world.
 *
 * Screens do not import this module: they reach data through `@/queries/*` (import fences,
 * Appendix F §3.8). Until the tab's platform is ready (and on the server) there are no ports and
 * the session is `unknown`; queries wait.
 */
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from 'react';

import {
  BOOTING,
  bootPlatform,
  getBootState,
  getQueryClient,
  type PlatformRuntime,
  subscribeBoot,
} from './runtime';
import { type SessionSnapshot, UNKNOWN_SESSION } from './session-store';

const RuntimeContext = createContext<PlatformRuntime | null>(null);

const serverBootState = () => BOOTING;

/** The application's provider: boots this tab's platform once and supplies it. */
export function PlatformProvider({ children }: { readonly children?: ReactNode }) {
  const queryClient = getQueryClient();
  const boot = useSyncExternalStore(subscribeBoot, getBootState, serverBootState);
  useEffect(() => {
    // Idempotent: Strict Mode's second effect and any remount answer the same boot.
    bootPlatform().catch(() => undefined);
  }, []);
  // No silent fallback: a platform that cannot boot (e.g. a data source with no adapter) fails
  // the page instead of showing another data source.
  if (boot.status === 'failed') throw boot.error;
  return (
    <PlatformRuntimeProvider
      runtime={boot.status === 'ready' ? boot.runtime : null}
      queryClient={queryClient}
    >
      {children}
    </PlatformRuntimeProvider>
  );
}

/** Supplies a given runtime (the application provider above, and test renders). */
export function PlatformRuntimeProvider({
  runtime,
  queryClient,
  children,
}: {
  readonly runtime: PlatformRuntime | null;
  readonly queryClient: QueryClient;
  readonly children?: ReactNode;
}) {
  if (runtime && runtime.queryClient !== queryClient) {
    throw new Error('A platform runtime is supplied with its own QueryClient only.');
  }
  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeContext value={runtime}>{children}</RuntimeContext>
    </QueryClientProvider>
  );
}

/** The tab's platform, or `null` while it boots (and on the server). */
export function usePlatform(): PlatformRuntime | null {
  return useContext(RuntimeContext);
}

const noSubscription = () => () => undefined;
const unknownSession = () => UNKNOWN_SESSION;

/** The tab's session; re-renders on every sign-in, sign-out or change of person. */
export function useSession(): SessionSnapshot {
  const runtime = usePlatform();
  return useSyncExternalStore(
    runtime ? runtime.session.subscribe : noSubscription,
    runtime ? runtime.session.getSnapshot : unknownSession,
    unknownSession,
  );
}
