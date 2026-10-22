'use client';

import { notFound, usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

import {
  type AppNavigation,
  LandingFrame,
  NavigationProvider,
} from '@/features/public/pu-01-landing/landing-page';

/**
 * The landing's one route-level module that reads Next.js navigation (as `public-route.tsx` does
 * for the other public pages; import fences, Appendix F §3.8): the address and the router, given
 * to the framework-free landing as `@/nav/navigation`, and the public pages' route focus — without
 * the v46 public frame (owner decision D-13). The landing reads no query, so the page renders in
 * full on the server (no `useSearchParams` boundary).
 */
export function LandingRoute({ children }: { readonly children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: '',
      replace: (href) => window.history.replaceState(null, '', href),
      navigate: (href, options) => (options?.replace ? router.replace(href) : router.push(href)),
      notFound,
    }),
    [pathname, router],
  );
  return (
    <LandingFrame pathname={pathname}>
      <NavigationProvider value={navigation}>{children}</NavigationProvider>
    </LandingFrame>
  );
}
