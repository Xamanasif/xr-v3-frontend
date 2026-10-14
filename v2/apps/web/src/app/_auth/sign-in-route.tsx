'use client';

import { notFound, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

import {
  type AppNavigation,
  NavigationProvider,
  SignIn,
  SignInTitle,
} from '@/features/shared/xs-01-sign-in/sign-in-page';

/**
 * The sign-in page's one route-level module that reads Next.js navigation (as
 * `_workspace/workspace-route.tsx` does for the workspaces; import fences, Appendix F §3.8): the
 * address, its query (`reason`, `returnTo`) and the router, supplied to the framework-free XS-01
 * feature as `@/nav/navigation`.
 *
 * `useSearchParams` sits inside a Suspense boundary (WP-0.13 spike S3). The server cannot know the
 * query of a prerendered page, so its fallback is the same card without a notice (the plain
 * B1-09 f0 card, read with an empty query); the browser renders it with the query. The tab's
 * title is outside the boundary, so the server-rendered page has one.
 */
const NO_QUERY: AppNavigation = {
  pathname: '/sign-in',
  search: '',
  replace: () => undefined,
  notFound,
};

export function SignInRoute() {
  return (
    <>
      <SignInTitle />
      <Suspense
        fallback={
          <NavigationProvider value={NO_QUERY}>
            <SignIn />
          </NavigationProvider>
        }
      >
        <WithNavigation />
      </Suspense>
    </>
  );
}

function WithNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.toString();
  const navigation = useMemo<AppNavigation>(
    () => ({
      pathname,
      search: query ? `?${query}` : '',
      replace: (href) => router.replace(href),
      notFound,
    }),
    [pathname, query, router],
  );
  return (
    <NavigationProvider value={navigation}>
      <SignIn />
    </NavigationProvider>
  );
}
