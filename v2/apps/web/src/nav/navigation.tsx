'use client';

import { createContext, type ReactNode, useContext } from 'react';

/**
 * The app's navigation, as features see it (WP-0.13; ADR-0005 §5). Features never import
 * `next/*` (import fences, Appendix F §3.8): the route layer (`src/app/_workspace`) reads the
 * address and the router from Next.js and supplies them here, as `@/platform/link` supplies
 * `next/link` to `@xr/ui`. Nothing here decides who may see what — the guards ask the ports.
 */
export interface AppNavigation {
  /** The address on show, without its query (`/student/help`). */
  readonly pathname: string;
  /** The query of the address on show: `''` or `?…`. */
  readonly search: string;
  /** Replaces the address on show (no new history entry), client-side. */
  replace(href: string): void;
  /**
   * Renders the nearest not-found boundary (the workspace's in-shell PU-15). It throws, so it is
   * called while rendering, as Next.js's `notFound()` (WP-0.13 spike S1: client-side `notFound()`
   * renders the segment's `not-found.tsx` inside the persistent layout).
   */
  notFound(): never;
}

const NavigationContext = createContext<AppNavigation | null>(null);

export function NavigationProvider({
  value,
  children,
}: {
  readonly value: AppNavigation;
  readonly children?: ReactNode;
}) {
  return <NavigationContext value={value}>{children}</NavigationContext>;
}

/** The app's navigation; only inside a route that supplies it. */
export function useAppNavigation(): AppNavigation {
  const navigation = useContext(NavigationContext);
  if (!navigation) {
    throw new Error('useAppNavigation is used outside a route that supplies the navigation.');
  }
  return navigation;
}
